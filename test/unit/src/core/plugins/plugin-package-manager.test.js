/**
 * @jest-environment jsdom
 */

// Mockear dependencias ANTES de importar pluginPackageManager
jest.mock('../../../../../src/core/config/constants', () => ({
  PLUGIN_CONSTANTS: { CURRENT_APP_VERSION: '0.4.0' },
  STORAGE_KEYS: { PLUGIN_DATA_PREFIX: 'atlas_plugin_' },
}));
jest.mock('../../../../../src/core/plugins/plugin-registry', () => ({
  getPlugin: jest.fn(),
  isPluginActive: jest.fn(),
  deactivatePlugin: jest.fn(() => true), // Simula desactivación exitosa
  registerPlugin: jest.fn(() => true), // Simula registro exitoso
  unregisterPlugin: jest.fn(() => true),
  getAllPlugins: jest.fn(() => []),
}));
jest.mock('../../../../../src/core/plugins/plugin-loader', () => ({
  loadPluginById: jest.fn(),
}));
jest.mock('../../../../../src/core/plugins/plugin-validator', () => ({
  validatePluginComplete: jest.fn(() => ({ valid: true, reason: 'Valid' })),
}));
jest.mock('../../../../../src/core/plugins/plugin-integrity-checker', () => ({
  generateChecksums: jest.fn(() => Promise.resolve({ 'file.js': 'checksum123' })),
  signPackage: jest.fn(() => Promise.resolve('signature123')),
  verifyPackage: jest.fn(() => Promise.resolve(true)),
}));
jest.mock('../../../../../src/core/bus/event-bus', () => ({
  publish: jest.fn(),
}));
jest.mock('../../../../../src/services/storage-service', () => ({
  get: jest.fn((key, defaultValue) => Promise.resolve(defaultValue)),
  set: jest.fn(() => Promise.resolve(true)),
  remove: jest.fn(() => Promise.resolve(true)),
}));

// Importar el módulo BAJO PRUEBA (pluginPackageManager es un singleton)
import pluginPackageManagerInstance from '../../../../../src/core/plugins/plugin-package-manager';
const pluginPackageManager = pluginPackageManagerInstance;

// Importar mocks para aserciones
const pluginRegistry = require('../../../../../src/core/plugins/plugin-registry');
const { loadPluginById } = require('../../../../../src/core/plugins/plugin-loader');
const { validatePluginComplete } = require('../../../../../src/core/plugins/plugin-validator');
const pluginIntegrityChecker = require('../../../../../src/core/plugins/plugin-integrity-checker');
const eventBus = require('../../../../../src/core/bus/event-bus');
const storageService = require('../../../../../src/services/storage-service');


describe('PluginPackageManager', () => {
  const mockPluginDef = {
    id: 'testPlugin', name: 'Test Plugin', version: '1.0.0', author: 'Tester',
    description: 'A test plugin', minAppVersion: '0.3.0', maxAppVersion: '0.5.0',
    dependencies: [], conflicts: [], permissions: [],
    init: jest.fn(), cleanup: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    // Resetear estado interno del singleton
    pluginPackageManager.initialized = false; // Forzar re-inicialización si es necesario
    pluginPackageManager.installQueue = [];
    pluginPackageManager.uninstallQueue = [];
    pluginPackageManager.installingPlugin = null;
    pluginPackageManager.installedPlugins = {};
    pluginPackageManager.packageManifests = {};
    pluginPackageManager._subscribers = {};
    pluginPackageManager._lastSubscriberId = 0;
    
    // Simular que el registry tiene el plugin
    pluginRegistry.getPlugin.mockReturnValue(mockPluginDef);
    // Inicializar para cada test para asegurar un estado limpio de storage mocks
    await pluginPackageManager.initialize();
  });

  describe('initialize', () => {
    test('debe cargar datos desde storageService', async () => {
      // La inicialización ya ocurre en beforeEach
      expect(storageService.get).toHaveBeenCalledWith('atlas_plugin_installed_plugins', {});
      expect(storageService.get).toHaveBeenCalledWith('atlas_plugin_package_manifests', {});
      expect(pluginPackageManager.initialized).toBe(true);
    });
  });

  describe('packagePlugin', () => {
    test('debe empaquetar un plugin válido', async () => {
      const pkg = await pluginPackageManager.packagePlugin('testPlugin');
      expect(pkg.manifest.id).toBe('testPlugin');
      expect(pkg.manifest.checksums).toEqual({ 'file.js': 'checksum123' }); // Del mock
      expect(pkg.files).toBeDefined();
      expect(pluginIntegrityChecker.generateChecksums).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.pluginPackaged', expect.any(Object));
      expect(pluginPackageManager.packageManifests['testPlugin']).toEqual(pkg.manifest);
    });

    test('debe firmar el paquete si se proporciona signingKey', async () => {
        const pkg = await pluginPackageManager.packagePlugin('testPlugin', { signingKey: 'mykey' });
        expect(pluginIntegrityChecker.signPackage).toHaveBeenCalledWith(expect.anything(), 'mykey');
        expect(pkg.manifest.signature).toBe('signature123');
    });

    test('debe lanzar error si el plugin no se encuentra en el registro', async () => {
        pluginRegistry.getPlugin.mockReturnValueOnce(null);
        await expect(pluginPackageManager.packagePlugin('unknownPlugin'))
            .rejects.toThrow('Plugin no encontrado: unknownPlugin');
    });

    test('debe lanzar error si la validación del plugin falla', async () => {
        validatePluginComplete.mockReturnValueOnce({ valid: false, reason: 'Validation failed' });
        await expect(pluginPackageManager.packagePlugin('testPlugin'))
            .rejects.toThrow('Plugin inválido: Validation failed');
    });
  });

  describe('installPlugin', () => {
    const mockPackage = {
      manifest: {
        id: 'installTest', name: 'Install Test', version: '1.0.0',
        minAppVersion: '0.3.0', maxAppVersion: '0.5.0',
        dependencies: [], conflicts: [], permissions: [],
        checksums: { 'file.js': 'checksumValid' }
      },
      files: { 'file.js': 'content' },
    };

    beforeEach(() => {
        pluginIntegrityChecker.verifyPackage.mockResolvedValue(true); // Paquete válido por defecto
        loadPluginById.mockResolvedValue({ id: 'installTest' }); // Carga exitosa
        pluginRegistry.registerPlugin.mockReturnValue(true);
    });

    test('debe instalar un plugin desde un paquete válido', async () => {
      const result = await pluginPackageManager.installPlugin(mockPackage);
      expect(result).toBe(true);
      expect(pluginIntegrityChecker.verifyPackage).toHaveBeenCalledWith(mockPackage);
      expect(pluginPackageManager.installedPlugins['installTest']).toBeDefined();
      expect(loadPluginById).toHaveBeenCalledWith('installTest');
      expect(pluginRegistry.registerPlugin).toHaveBeenCalledWith({ id: 'installTest' });
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.pluginInstallStarted', expect.any(Object));
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.pluginInstalled', expect.any(Object));
    });

    test('debe lanzar error si el paquete no supera la verificación de integridad', async () => {
        pluginIntegrityChecker.verifyPackage.mockResolvedValueOnce(false);
        await expect(pluginPackageManager.installPlugin(mockPackage))
            .rejects.toThrow('El paquete del plugin no es válido o está corrupto');
    });

    test('debe lanzar error si el plugin ya está instalado y no es una actualización', async () => {
        pluginPackageManager.installedPlugins['installTest'] = { id: 'installTest', version: '0.9.0' };
        await expect(pluginPackageManager.installPlugin(mockPackage, { update: false })) // Explicitly update: false
            .rejects.toThrow('Ya existe un plugin instalado con el ID: installTest');
    });

    test('debe permitir la instalación si es una actualización (update: true)', async () => {
        pluginPackageManager.installedPlugins['installTest'] = { id: 'installTest', version: '0.9.0' };
        // _checkDependencies y _checkConflicts deben ser mockeadas para devolver [] si no hay
        jest.spyOn(pluginPackageManager, '_checkDependencies').mockResolvedValue([]);
        jest.spyOn(pluginPackageManager, '_checkConflicts').mockResolvedValue([]);

        const result = await pluginPackageManager.installPlugin(mockPackage, { update: true });
        expect(result).toBe(true); // Debería permitirlo
    });

    test('debe lanzar error si la versión de la app no es compatible', async () => {
        const incompatiblePkg = { ...mockPackage, manifest: { ...mockPackage.manifest, minAppVersion: '0.5.0' }};
        // PLUGIN_CONSTANTS.CURRENT_APP_VERSION es '0.4.0'
        await expect(pluginPackageManager.installPlugin(incompatiblePkg))
            .rejects.toThrow('El plugin no es compatible con la versión actual 0.4.0');
    });
  });

  describe('uninstallPlugin', () => {
    beforeEach(() => {
        // Simular que el plugin está instalado
        pluginPackageManager.installedPlugins['testPlugin'] = { id: 'testPlugin', version: '1.0.0' };
    });

    test('debe desinstalar un plugin instalado', async () => {
      pluginRegistry.isPluginActive.mockReturnValue(true); // Simular que está activo para probar la desactivación
      jest.spyOn(pluginPackageManager, '_deactivatePlugin').mockResolvedValue(true);

      const result = await pluginPackageManager.uninstallPlugin('testPlugin');
      expect(result).toBe(true);
      expect(pluginPackageManager._deactivatePlugin).toHaveBeenCalledWith('testPlugin');
      expect(pluginRegistry.unregisterPlugin).toHaveBeenCalledWith('testPlugin');
      expect(pluginPackageManager.installedPlugins['testPlugin']).toBeUndefined();
      expect(storageService.remove).toHaveBeenCalledWith('atlas_plugin_testPlugin_files'); // Simulación de _removePluginFiles
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.pluginUninstallStarted', { pluginId: 'testPlugin' });
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.pluginUninstalled', { pluginId: 'testPlugin' });
    });

    test('debe lanzar error si el plugin no está instalado', async () => {
        await expect(pluginPackageManager.uninstallPlugin('unknownPlugin'))
            .rejects.toThrow('El plugin no está instalado: unknownPlugin');
    });

    test('debe lanzar error si hay dependientes y no se fuerza la desinstalación', async () => {
        jest.spyOn(pluginPackageManager, '_getDependentPlugins').mockResolvedValueOnce(['dependentPlugin']);
        await expect(pluginPackageManager.uninstallPlugin('testPlugin', { force: false }))
            .rejects.toThrow('Hay plugins que dependen de este: dependentPlugin');
    });

    test('debe permitir la desinstalación forzada aunque haya dependientes', async () => {
        jest.spyOn(pluginPackageManager, '_getDependentPlugins').mockResolvedValueOnce(['dependentPlugin']);
        const result = await pluginPackageManager.uninstallPlugin('testPlugin', { force: true });
        expect(result).toBe(true);
    });
  });

  describe('Utility Methods', () => {
    test('getInstalledPlugins debe devolver la lista de plugins instalados', () => {
      pluginPackageManager.installedPlugins = { p1: {id:'p1'}, p2: {id:'p2'} };
      expect(pluginPackageManager.getInstalledPlugins()).toEqual({ p1: {id:'p1'}, p2: {id:'p2'} });
    });

    test('isPluginInstalled debe verificar correctamente', () => {
      pluginPackageManager.installedPlugins['p1'] = {id:'p1'};
      expect(pluginPackageManager.isPluginInstalled('p1')).toBe(true);
      expect(pluginPackageManager.isPluginInstalled('pNonExistent')).toBe(false);
    });

    test('hasUpdate debe comparar versiones correctamente', () => {
        pluginPackageManager.installedPlugins['p1'] = { id: 'p1', version: '1.0.0' };
        expect(pluginPackageManager.hasUpdate('p1', { id: 'p1', version: '1.1.0' })).toBe(true);
        expect(pluginPackageManager.hasUpdate('p1', { id: 'p1', version: '1.0.0' })).toBe(false);
        expect(pluginPackageManager.hasUpdate('p1', { id: 'p1', version: '0.9.0' })).toBe(false);
        expect(pluginPackageManager.hasUpdate('pNonExistent', { id: 'p1', version: '1.1.0' })).toBe(false);
    });
  });
});