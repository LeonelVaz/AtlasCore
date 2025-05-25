/**
 * @jest-environment jsdom
 */
import { validatePlugin, compareVersions, validatePluginComplete } from '../../../../../src/core/plugins/plugin-validator';

// Mockear dependencias
jest.mock('../../../../../src/core/config/constants', () => ({
  PLUGIN_CONSTANTS: { CURRENT_APP_VERSION: '1.0.0' }, 
}));
jest.mock('../../../../../src/core/plugins/plugin-compatibility', () => ({
  checkAppCompatibility: jest.fn(),
  runFullCompatibilityCheck: jest.fn(), 
}));

const pluginCompatibility = require('../../../../../src/core/plugins/plugin-compatibility');

describe('PluginValidator', () => {
  let mockPlugin;
  let originalConsoleError;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPlugin = {
      id: 'testPlugin',
      name: 'Test Plugin',
      version: '1.0.0',
      description: 'A plugin for testing',
      author: 'Tester',
      init: jest.fn(() => true),
      cleanup: jest.fn(() => true),
      minAppVersion: '0.9.0',
      maxAppVersion: '1.1.0',
      dependencies: [{ id: 'dep1', version: '1.0.0' }],
      conflicts: [{ id: 'conflict1', reason: 'Test conflict' }],
    };
    
    pluginCompatibility.checkAppCompatibility.mockReturnValue({ compatible: true, reason: '' });
    pluginCompatibility.runFullCompatibilityCheck.mockReturnValue({ compatible: true, reason: 'Compatible', details: {} });

    originalConsoleError = console.error;
    console.error = jest.fn(); 
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('validatePlugin', () => {
    test('debe devolver true para un plugin válido', () => {
      expect(validatePlugin(mockPlugin)).toBe(true);
    });

    test('debe devolver false si el plugin no es un objeto', () => {
      expect(validatePlugin(null)).toBe(false);
      expect(console.error).toHaveBeenCalledWith('El plugin no es un objeto válido');
    });

    // Pruebas de metadatos
    ['id', 'name', 'version', 'description', 'author'].forEach(field => {
      test(`debe devolver false si falta ${field}`, () => {
        const invalidPlugin = { ...mockPlugin };
        // Si el campo es 'id', invalidPlugin.id será undefined después de delete,
        // así que el mensaje de error no podrá usar plugin.id.
        // Para otros campos, plugin.id (de mockPlugin) seguirá estando en invalidPlugin.
        const pluginIdForMessage = (field === 'id') ? undefined : invalidPlugin.id;
        delete invalidPlugin[field];

        expect(validatePlugin(invalidPlugin)).toBe(false);

        let expectedErrorMessage;
        if (field === 'id') {
          expectedErrorMessage = 'Plugin sin ID válido';
        } else {
          // Construye el mensaje que tu código realmente produce
          // El pluginIdForMessage será 'testPlugin' si field no es 'id'
          // o undefined si field es 'id' (en cuyo caso el código fuente no usa [${plugin.id}])
          // Sin embargo, en validateMetadata, si plugin.id no está, el primer chequeo es `!plugin.id`
          // y el mensaje es 'Plugin sin ID válido'.
          // Si falta OTRO campo, y plugin.id existe, el mensaje será `Plugin [${plugin.id}] sin ${campo} válido`
          
          // Reajuste de lógica para currentPluginIdForMessage
          // El invalidPlugin SÍ tiene el ID 'testPlugin' cuando borramos 'name', 'version', etc.
          // Solo cuando borramos 'id' es que invalidPlugin.id es undefined.

          if (field === 'name') {
            expectedErrorMessage = `Plugin [${mockPlugin.id}] sin nombre válido`;
          } else if (field === 'version') {
            expectedErrorMessage = `Plugin [${mockPlugin.id}] sin versión válida`;
          } else if (field === 'description') {
            expectedErrorMessage = `Plugin [${mockPlugin.id}] sin descripción válida`;
          } else if (field === 'author') {
            expectedErrorMessage = `Plugin [${mockPlugin.id}] sin autor válido`;
          }
        }
        
        expect(console.error).toHaveBeenCalledWith(expectedErrorMessage);
      });
    });

    // Pruebas de métodos
    ['init', 'cleanup'].forEach(method => {
      test(`debe devolver false si falta el método ${method}`, () => {
        const invalidPlugin = { ...mockPlugin };
        delete invalidPlugin[method];
        expect(validatePlugin(invalidPlugin)).toBe(false);
        expect(console.error).toHaveBeenCalledWith(`Plugin [${mockPlugin.id}] sin método '${method}' válido`);
      });
    });

    // Pruebas de compatibilidad de versión
    test('debe devolver false si checkAppCompatibility falla', () => {
      pluginCompatibility.checkAppCompatibility.mockReturnValue({ compatible: false, reason: 'Versión de app incorrecta' });
      expect(validatePlugin(mockPlugin)).toBe(false);
      expect(console.error).toHaveBeenCalledWith(`Plugin [${mockPlugin.id}] incompatible: Versión de app incorrecta`);
    });
    
    test('debe devolver false si las dependencias son inválidas (no array)', () => {
        const invalidPlugin = { ...mockPlugin, dependencies: "not-an-array" };
        expect(validatePlugin(invalidPlugin)).toBe(false);
        expect(console.error).toHaveBeenCalledWith(`Plugin [${mockPlugin.id}] con dependencias declaradas en formato inválido`);
    });
    test('debe devolver false si una dependencia tiene ID vacío', () => {
        const invalidPlugin = { ...mockPlugin, dependencies: [{id: " "}] }; // ID con solo espacio
        expect(validatePlugin(invalidPlugin)).toBe(false);
        expect(console.error).toHaveBeenCalledWith(`Plugin [${mockPlugin.id}] contiene una dependencia sin ID válido`);
    });

     test('debe devolver false si los conflictos son inválidos (no array)', () => {
        const invalidPlugin = { ...mockPlugin, conflicts: "not-an-array" };
        expect(validatePlugin(invalidPlugin)).toBe(false);
        expect(console.error).toHaveBeenCalledWith(`Plugin [${mockPlugin.id}] con conflictos declarados en formato inválido`);
    });
  });

  describe('compareVersions', () => {
    test.each([
      ['1.0.0', '1.0.0', 0],
      ['1.0.0', '1.0.1', -1],
      ['1.1.0', '1.0.1', 1],
      ['1.0', '1.0.0', 0], 
      ['2.0.0', '1.9.9', 1],
      ['0.0.1', '0.0.2', -1],
    ])('compareVersions("%s", "%s") debe devolver %i', (v1, v2, expected) => {
      expect(compareVersions(v1, v2)).toBe(expected);
    });
  });

  describe('validatePluginComplete', () => {
    test('debe devolver valid: true para un plugin completamente válido', () => {
      const result = validatePluginComplete(mockPlugin);
      expect(result.valid).toBe(true);
      expect(result.reason).toBe('Plugin válido');
    });

    test('debe devolver valid: false y razón si la compatibilidad falla', () => {
      pluginCompatibility.runFullCompatibilityCheck.mockReturnValue({ compatible: false, reason: 'App version too low', details: {} });
      const result = validatePluginComplete(mockPlugin);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('App version too low');
    });

    test('debe devolver valid: false y razón si la validación básica falla', () => {
      const invalidPlugin = { ...mockPlugin };
      delete invalidPlugin.name; // Hacerlo inválido para validateMetadata
      
      // validatePluginComplete llama internamente a validateMetadata, etc.
      // Necesitamos que el mock de pluginCompatibility devuelva true aquí para aislar la falla básica
      pluginCompatibility.runFullCompatibilityCheck.mockReturnValue({ compatible: true, reason: 'Compatible', details: {} });

      const result = validatePluginComplete(invalidPlugin);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Metadatos inválidos'); // Razón de la falla de validateMetadata
    });
  });
});