/**
 * @jest-environment jsdom
 */
import pluginIntegrityCheckerModule from '../../../../../src/core/plugins/plugin-integrity-checker';
// import { PLUGIN_CONSTANTS } from '../../../../../src/core/config/constants'; // No parece usarse directamente en el checker

// Mockear dependencias
jest.mock('../../../../../src/core/bus/event-bus', () => ({
  publish: jest.fn(),
}));

// Importar el módulo mockeado para acceder a sus funciones jest.fn()
const eventBus = require('../../../../../src/core/bus/event-bus');

// pluginIntegrityChecker es un singleton
const pluginIntegrityChecker = pluginIntegrityCheckerModule;

describe('PluginIntegrityChecker', () => {
  let originalConsoleError;

  beforeEach(() => {
    jest.clearAllMocks();
    // Resetear estado interno del singleton
    pluginIntegrityChecker.trustedKeys = {};
    pluginIntegrityChecker.verificationResults = {};

    originalConsoleError = console.error;
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  // Simulación interna de _simulateChecksum para predictibilidad en tests
  const testSimulateChecksum = (path, fileData) => {
    const content = typeof fileData === 'string' ? fileData : (fileData.content || JSON.stringify(fileData));
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      hash = ((hash << 5) - hash) + content.charCodeAt(i);
      hash |= 0;
    }
    const hexHash = (hash >>> 0).toString(16).padStart(8, '0');
    return `sim1-${hexHash}-${path.length}`;
  };

  describe('generateChecksums', () => {
    test('debe generar checksums para los archivos proporcionados', async () => {
      const files = {
        'index.js': { content: 'console.log("hello")' },
        'style.css': { content: 'body { color: red; }' },
      };
      const checksums = await pluginIntegrityChecker.generateChecksums(files);
      expect(checksums['index.js']).toEqual(testSimulateChecksum('index.js', files['index.js']));
      expect(checksums['style.css']).toEqual(testSimulateChecksum('style.css', files['style.css']));
    });

    test('debe lanzar error si la generación falla (simulado)', async () => {
        // Forzar un error dentro de _simulateChecksum (o su equivalente mockeado)
        const originalSimulate = pluginIntegrityChecker._simulateChecksum;
        pluginIntegrityChecker._simulateChecksum = jest.fn(() => { throw new Error('Checksum failed'); });
        
        const files = { 'file.js': 'content' };
        await expect(pluginIntegrityChecker.generateChecksums(files))
          .rejects.toThrow('Checksum failed');
        expect(console.error).toHaveBeenCalledWith('Error al generar checksums:', expect.any(Error));
        
        pluginIntegrityChecker._simulateChecksum = originalSimulate; // Restaurar
    });
  });

  describe('signPackage', () => {
    test('debe simular la firma de un manifiesto', async () => {
      const manifest = { id: 'pluginA', version: '1.0.0' };
      const signingKey = 'testPrivateKey';
      const signature = await pluginIntegrityChecker.signPackage(manifest, signingKey);
      expect(signature).toMatch(/^testPriv-/); // Basado en la simulación
    });
  });

  describe('verifyPackage', () => {
    let validPackage;

    beforeEach(() => {
      const files = {
        'index.js': { content: 'plugin code' },
        'manifest.json': { content: '{"id":"p1"}' },
      };
      validPackage = {
        manifest: {
          id: 'pluginA',
          version: '1.0.0',
          checksums: {
            'index.js': testSimulateChecksum('index.js', files['index.js']),
            'manifest.json': testSimulateChecksum('manifest.json', files['manifest.json']),
          },
          signature: 'test-signature'
        },
        files,
      };
      // Mock _verifySignature para que devuelva true en el caso base
      jest.spyOn(pluginIntegrityChecker, '_verifySignature').mockResolvedValue(true);
    });
    
    afterEach(() => {
        if (pluginIntegrityChecker._verifySignature.mockRestore) {
            pluginIntegrityChecker._verifySignature.mockRestore();
        }
    });


    test('debe verificar un paquete válido (con firma válida por mock)', async () => {
      const isValid = await pluginIntegrityChecker.verifyPackage(validPackage);
      expect(isValid).toBe(true);
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.integrityVerified', {
        pluginId: 'pluginA',
        isValid: true,
        reason: 'Verificación exitosa',
      });
      expect(pluginIntegrityChecker.getVerificationResults('pluginA').isValid).toBe(true);
    });

    test('debe fallar si faltan checksums en el manifiesto', async () => {
      const pkg = { ...validPackage, manifest: { ...validPackage.manifest, checksums: {} } };
      const isValid = await pluginIntegrityChecker.verifyPackage(pkg);
      expect(isValid).toBe(false);
      expect(pluginIntegrityChecker.getVerificationResults('pluginA').reason).toBe('No se encontraron checksums');
    });

    test('debe fallar si un archivo listado en checksums no existe en files', async () => {
        const pkg = JSON.parse(JSON.stringify(validPackage)); // Deep clone
        pkg.manifest.checksums['missing.js'] = 'dummy-checksum';
        // no añadir 'missing.js' a pkg.files
        const isValid = await pluginIntegrityChecker.verifyPackage(pkg);
        expect(isValid).toBe(false);
        expect(pluginIntegrityChecker.getVerificationResults('pluginA').reason).toBe('El archivo missing.js no existe en el paquete');
    });

    test('debe fallar si el checksum de un archivo no coincide', async () => {
      const pkg = JSON.parse(JSON.stringify(validPackage)); // Deep clone
      pkg.manifest.checksums['index.js'] = 'invalid-checksum';
      const isValid = await pluginIntegrityChecker.verifyPackage(pkg);
      expect(isValid).toBe(false);
      expect(pluginIntegrityChecker.getVerificationResults('pluginA').reason).toBe('Checksum inválido para index.js');
    });

    test('debe fallar si la firma es inválida (mockeado)', async () => {
      pluginIntegrityChecker._verifySignature.mockResolvedValue(false);
      const isValid = await pluginIntegrityChecker.verifyPackage(validPackage);
      expect(isValid).toBe(false);
      expect(pluginIntegrityChecker.getVerificationResults('pluginA').reason).toBe('Firma inválida');
    });

    test('debe verificar un paquete válido sin firma', async () => {
        const pkgNoSig = JSON.parse(JSON.stringify(validPackage));
        delete pkgNoSig.manifest.signature; // Quitar firma
        const isValid = await pluginIntegrityChecker.verifyPackage(pkgNoSig);
        expect(isValid).toBe(true);
        expect(pluginIntegrityChecker._verifySignature).not.toHaveBeenCalled();
    });
  });

  describe('Trusted Keys Management', () => {
    test('addTrustedKey debe añadir una clave y removeTrustedKey debe eliminarla', () => {
      const resultAdd = pluginIntegrityChecker.addTrustedKey('key1', 'publicKeyContent', 'Test Key');
      expect(resultAdd).toBe(true);
      expect(pluginIntegrityChecker.getTrustedKeys()['key1']).toBeDefined();
      expect(pluginIntegrityChecker.getTrustedKeys()['key1'].description).toBe('Test Key');

      const resultRemove = pluginIntegrityChecker.removeTrustedKey('key1');
      expect(resultRemove).toBe(true);
      expect(pluginIntegrityChecker.getTrustedKeys()['key1']).toBeUndefined();
      
      expect(pluginIntegrityChecker.removeTrustedKey('nonExistentKey')).toBe(false);
    });
  });

  describe('getVerificationResults', () => {
    test('debe devolver resultados específicos de un plugin o todos los resultados', async () => {
      await pluginIntegrityChecker.verifyPackage({ manifest: { id: 'p1' }, files: {} }); // Falla
      await pluginIntegrityChecker.verifyPackage({ manifest: { id: 'p2', checksums: {} }, files: {} }); // Falla

      expect(pluginIntegrityChecker.getVerificationResults('p1')).toBeDefined();
      expect(pluginIntegrityChecker.getVerificationResults('p1').isValid).toBe(false);
      expect(pluginIntegrityChecker.getVerificationResults('nonExistent')).toBeNull();

      const allResults = pluginIntegrityChecker.getVerificationResults();
      expect(Object.keys(allResults).length).toBe(2);
      expect(allResults['p1']).toBeDefined();
      expect(allResults['p2']).toBeDefined();
    });
  });
});