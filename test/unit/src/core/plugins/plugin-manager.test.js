// test\unit\src\core\plugins\plugin-manager.test.js

/**
 * @jest-environment jsdom
 */

// Mockear todas las dependencias ANTES de importar pluginManager
jest.mock('../../../../../src/core/plugins/plugin-loader', () => ({
  loadPlugins: jest.fn(),
  loadPluginById: jest.fn(),
  validatePluginCompatibility: jest.fn(),
}));

let mockInternalPluginStates = {}; // Estado simulado para el mock de pluginRegistry
jest.mock('../../../../../src/core/plugins/plugin-registry', () => ({
  registerPlugin: jest.fn(),
  setPluginStates: jest.fn(states => { mockInternalPluginStates = states; }),
  getPluginStates: jest.fn(() => mockInternalPluginStates),
  getAllPlugins: jest.fn(() => []),
  activatePlugin: jest.fn(),
  deactivatePlugin: jest.fn(),
  isPluginActive: jest.fn(),
  getPlugin: jest.fn(),
  getActivePlugins: jest.fn(() => []),
  clear: jest.fn(() => { mockInternalPluginStates = {}; }),
  setPluginState: jest.fn((pluginId, state) => {
    if (!mockInternalPluginStates[pluginId]) mockInternalPluginStates[pluginId] = {};
    mockInternalPluginStates[pluginId] = { ...mockInternalPluginStates[pluginId], ...state };
  }),
  unregisterPlugin: jest.fn(),
}));

jest.mock('../../../../../src/core/plugins/core-api', () => ({ init: jest.fn(), cleanupPluginResources: jest.fn(), }));
jest.mock('../../../../../src/services/storage-service', () => ({ get: jest.fn(), set: jest.fn(), }));
jest.mock('../../../../../src/core/config/constants', () => ({ PLUGIN_CONSTANTS: { SECURITY: { LEVEL: { LOW: 'LOW', NORMAL: 'NORMAL', HIGH: 'HIGH' } }, }, STORAGE_KEYS: { PLUGIN_DATA_PREFIX: 'atlas_plugin_', PLUGIN_SECURITY_SETTINGS_KEY: 'atlas_plugin_security_settings' }, }));
jest.mock('../../../../../src/core/bus/event-bus', () => ({ publish: jest.fn(), subscribe: jest.fn(), }));
jest.mock('../../../../../src/core/plugins/plugin-compatibility', () => ({ runFullCompatibilityCheck: jest.fn(), }));
jest.mock('../../../../../src/core/plugins/plugin-dependency-resolver', () => ({ calculateLoadOrder: jest.fn(() => []), getDependentPlugins: jest.fn(() => []), getDetectedCycles: jest.fn(() => []), }));
jest.mock('../../../../../src/core/plugins/plugin-api-registry', () => ({ registerAPI: jest.fn(), unregisterAPI: jest.fn(), clearAll: jest.fn(), getAPIInfo: jest.fn(() => ({})), }));
jest.mock('../../../../../src/core/plugins/plugin-communication', () => ({ clearPluginResources: jest.fn(), getChannelsInfo: jest.fn(() => ({})), }));
jest.mock('../../../../../src/core/plugins/plugin-security-manager', () => ({ initialize: jest.fn(), validatePlugin: jest.fn(() => ({ valid: true })), isPluginBlacklisted: jest.fn(() => false), blacklistPlugin: jest.fn(), getPluginSecurityInfo: jest.fn(() => ({ securityScore: 100, blacklisted: false, warnings: [] })), getSecurityStats: jest.fn(() => ({ blacklistedPlugins: 0, pluginsWithWarnings:0, detectedThreats: {total:0}})), setSecurityLevel: jest.fn(), }));
jest.mock('../../../../../src/core/plugins/plugin-sandbox', () => ({ initialize: jest.fn(), executeSandboxed: jest.fn((pluginId, func) => func()), getSandboxErrors: jest.fn(() => []), setSecurityLevel: jest.fn(), getStats: jest.fn(()=> ({})), }));
jest.mock('../../../../../src/core/plugins/plugin-resource-monitor', () => ({ initialize: jest.fn(), trackOperation: jest.fn(() => jest.fn()), decreaseMonitoring: jest.fn(), removeRestrictions: jest.fn(), getPluginResourceUsage: jest.fn(() => ({})), getResourceStats: jest.fn(() => ({})), setSecurityLevel: jest.fn(), applyRestrictions: jest.fn(), }));
jest.mock('../../../../../src/core/plugins/plugin-permission-checker', () => ({ initialize: jest.fn(), validatePermissions: jest.fn(() => ({ pendingPermissions: [] })), getPluginPermissions: jest.fn(() => ({ approved: [], pending: [], revoked: []})), getPermissionStats: jest.fn(() => ({})), approvePermissions: jest.fn(), getPendingPermissionRequests: jest.fn(() => []), setSecurityLevel: jest.fn(), }));
jest.mock('../../../../../src/core/plugins/plugin-security-audit', () => ({ initialize: jest.fn(), recordPluginDeactivation: jest.fn(), recordValidationResult: jest.fn(), recordBlacklistAction: jest.fn(), getPluginAuditHistory: jest.fn(() => []), getAuditStats: jest.fn(() => ({ totalEntries: 0 })), setSecurityLevel: jest.fn(), }));


import pluginManagerInstance from '../../../../../src/core/plugins/plugin-manager';
const pluginManager = pluginManagerInstance;

const { loadPlugins } = require('../../../../../src/core/plugins/plugin-loader');
const pluginRegistry = require('../../../../../src/core/plugins/plugin-registry');
const coreAPI = require('../../../../../src/core/plugins/core-api');
const storageService = require('../../../../../src/services/storage-service');
const eventBus = require('../../../../../src/core/bus/event-bus');
const pluginCompatibility = require('../../../../../src/core/plugins/plugin-compatibility');
const pluginSecurityManager = require('../../../../../src/core/plugins/plugin-security-manager');
const pluginSandbox = require('../../../../../src/core/plugins/plugin-sandbox');
const pluginPermissionChecker = require('../../../../../src/core/plugins/plugin-permission-checker');
const pluginDependencyResolver = require('../../../../../src/core/plugins/plugin-dependency-resolver');
const { PLUGIN_CONSTANTS, STORAGE_KEYS } = require('../../../../../src/core/config/constants');


describe('PluginManager', () => {
  const mockPlugin1 = { id: 'p1', name: 'Plugin 1', init: jest.fn(()=>true), cleanup: jest.fn(()=>true), publicAPI: { test:()=>{} }, permissions: ['storage'] };
  const mockPlugin2 = { id: 'p2', name: 'Plugin 2', init: jest.fn(()=>true), cleanup: jest.fn(()=>true), dependencies: [{id: 'p1'}] };
  const mockPlugin3 = { id: 'p3', name: 'Plugin 3', init: jest.fn(()=>true), cleanup: jest.fn(()=>true) };

  let originalConsoleLog;
  let originalConsoleError;
  let managerActivatePluginSpy; 

  beforeEach(() => { 
    jest.clearAllMocks();
    mockInternalPluginStates = {}; 

    pluginManager.initialized = false;
    pluginManager.loading = false;
    pluginManager.error = null;
    pluginManager._subscribers = {};
    pluginManager._compatibilityResults = {};
    pluginManager.securityLevel = PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL;
    pluginManager.securityInitialized = false;
    pluginManager._activatingPlugins = new Set();

    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    console.log = jest.fn(); 
    console.error = jest.fn(); 

    loadPlugins.mockResolvedValue([mockPlugin1, mockPlugin2]);
    storageService.get.mockImplementation(async (key, defaultValue) => {
        if (key === STORAGE_KEYS.PLUGIN_SECURITY_SETTINGS_KEY) {
            return { securityLevel: PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL };
        }
        if (key === 'atlas_plugin_states') {
            return {};
        }
        return defaultValue;
    });
    storageService.set.mockResolvedValue(true);
    pluginRegistry.registerPlugin.mockReturnValue(true);
    pluginRegistry.isPluginActive.mockReturnValue(false); 
    pluginCompatibility.runFullCompatibilityCheck.mockImplementation(plugin => ({
      compatible: plugin.id !== 'pIncompatible',
      reason: plugin.id !== 'pIncompatible' ? 'Compatible' : 'incomp',
      details: {},
    }));
    pluginRegistry.getPlugin.mockImplementation(id => {
        if (id === 'p1') return mockPlugin1;
        if (id === 'p2') return mockPlugin2;
        if (id === 'p3') return mockPlugin3;
        return null;
    });
    pluginRegistry.getAllPlugins.mockReturnValue([mockPlugin1, mockPlugin2]);
    
    pluginRegistry.activatePlugin.mockImplementation((pluginId) => {
        pluginRegistry.isPluginActive.mockImplementation(idToCheck => idToCheck === pluginId);
        return true;
    });
    pluginRegistry.deactivatePlugin.mockReturnValue(true); 
    pluginDependencyResolver.calculateLoadOrder.mockReturnValue(['p1', 'p2']);
    pluginSecurityManager.isPluginBlacklisted.mockReturnValue(false);

    managerActivatePluginSpy = jest.spyOn(pluginManager, 'activatePlugin');
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    managerActivatePluginSpy.mockRestore();
  });

  describe('initialize', () => {
    beforeEach(() => {
        pluginManager.initialized = false; 
        pluginManager.securityInitialized = false;
        pluginManager._compatibilityResults = {};
        managerActivatePluginSpy.mockClear();
        eventBus.publish.mockClear();
        pluginCompatibility.runFullCompatibilityCheck.mockClear();
        loadPlugins.mockClear(); 
        pluginRegistry.getAllPlugins.mockClear();
        pluginRegistry.activatePlugin.mockClear();
        pluginRegistry.isPluginActive.mockReturnValue(false);
        mockInternalPluginStates = {}; 

        loadPlugins.mockImplementation(async () => [mockPlugin1, mockPlugin2]);
        pluginRegistry.getAllPlugins.mockImplementation(() => [mockPlugin1, mockPlugin2]);
    });

    test('debe inicializar todos los subsistemas y cargar plugins', async () => {
      await pluginManager.initialize({}, { enableSecurity: true });
      expect(pluginManager.initialized).toBe(true);
      expect(pluginCompatibility.runFullCompatibilityCheck).toHaveBeenCalledWith(mockPlugin1);
      expect(pluginCompatibility.runFullCompatibilityCheck).toHaveBeenCalledWith(mockPlugin2);
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.initialized', expect.objectContaining({
          securityLevel: PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL // Verificar el nivel post-init
      }));
    });

    test('debe reintentar activar plugins desde el estado si estaban activos', async () => {
        storageService.get.mockImplementation(async key => { 
            if (key === 'atlas_plugin_states') {
                return { p1: { active: true }, p2: {active: false} };
            }
            if (key === STORAGE_KEYS.PLUGIN_SECURITY_SETTINGS_KEY) {
                return { securityLevel: PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL };
            }
            return {};
        });
        pluginDependencyResolver.calculateLoadOrder.mockReturnValueOnce(['p1', 'p2']);
        pluginCompatibility.runFullCompatibilityCheck.mockImplementation(plugin => {
            return { compatible: true, reason: 'Compatible', details: {} };
        });
        pluginSecurityManager.isPluginBlacklisted.mockReturnValue(false);
        pluginRegistry.isPluginActive.mockReturnValue(false); 

        managerActivatePluginSpy.mockClear();

        await pluginManager.initialize(); 

        expect(managerActivatePluginSpy).toHaveBeenCalledWith('p1');
        expect(managerActivatePluginSpy).not.toHaveBeenCalledWith('p2');
    });

    test('no debe inicializar el sistema de seguridad si enableSecurity es false', async () => {
        pluginSecurityManager.initialize.mockClear();
        await pluginManager.initialize({}, { enableSecurity: false });
        expect(pluginSecurityManager.initialize).not.toHaveBeenCalled();
    });

    test('debe manejar errores durante la inicialización', async () => {
        loadPlugins.mockRejectedValueOnce(new Error('Failed to load'));
        const result = await pluginManager.initialize();
        expect(result).toBe(false);
        expect(pluginManager.error).toBe('Failed to load');
    });
  });
  
  describe('activatePlugin', () => {
    beforeEach(async () => {
      if (!pluginManager.initialized) {
          loadPlugins.mockResolvedValueOnce([mockPlugin1, mockPlugin2]);
          pluginRegistry.getAllPlugins.mockReturnValueOnce([mockPlugin1, mockPlugin2]);
          pluginCompatibility.runFullCompatibilityCheck.mockImplementation(p => ({compatible: true}));
          await pluginManager.initialize({}, { enableSecurity: true });
      }
      pluginRegistry.isPluginActive.mockReturnValue(false);
      pluginRegistry.activatePlugin.mockClear();
      managerActivatePluginSpy.mockClear();
    });

    test('debe activar un plugin válido y sus dependencias', async () => {
      pluginDependencyResolver.calculateLoadOrder.mockReturnValue(['p1', 'p2']);
      pluginRegistry.isPluginActive.mockImplementation(id => false);
      
      const result = await pluginManager.activatePlugin('p2');
      expect(result).toBe(true);
      expect(managerActivatePluginSpy).toHaveBeenCalledWith('p1');
      expect(managerActivatePluginSpy).toHaveBeenCalledWith('p2');
      expect(pluginRegistry.activatePlugin).toHaveBeenCalledWith('p1', coreAPI);
      expect(pluginRegistry.activatePlugin).toHaveBeenCalledWith('p2', coreAPI);
    });

    test('no debe activar un plugin incompatible', async () => {
        pluginRegistry.getPlugin.mockImplementationOnce(id => id === 'pIncompatible' ? {id: 'pIncompatible'} : mockPlugin1);
        pluginManager._compatibilityResults['pIncompatible'] = { compatible: false, reason: 'Test Incompatibility' };
        const result = await pluginManager.activatePlugin('pIncompatible');
        expect(result).toBe(false);
        expect(pluginRegistry.activatePlugin).not.toHaveBeenCalled();
    });

    test('no debe activar un plugin en lista negra', async () => {
        pluginSecurityManager.isPluginBlacklisted.mockImplementationOnce(id => id === 'p1');
        const result = await pluginManager.activatePlugin('p1');
        expect(result).toBe(false);
        expect(pluginRegistry.activatePlugin).not.toHaveBeenCalled();
    });

    test('debe fallar la activación si la validación de seguridad falla', async () => {
        pluginSecurityManager.validatePlugin.mockReturnValueOnce({ valid: false, reason: 'Security issue' });
        const result = await pluginManager.activatePlugin('p1');
        expect(result).toBe(false);
    });
    
    test('debe fallar activación si plugin.init() falla (simulado por sandbox)', async () => {
        pluginSandbox.executeSandboxed.mockImplementationOnce(async (id, func) => {
            if (id === 'p1') throw new Error('Init failed');
            return func();
        });
        pluginRegistry.getPlugin.mockReturnValueOnce({ ...mockPlugin1, init: jest.fn(() => { throw new Error('Init failed directly'); }) });
        
        const result = await pluginManager.activatePlugin('p1');
        expect(result).toBe(false);
    });
  });

  describe('deactivatePlugin', () => {
    beforeEach(async () => {
      if (!pluginManager.initialized) {
          loadPlugins.mockResolvedValueOnce([mockPlugin1]);
          pluginRegistry.getAllPlugins.mockReturnValueOnce([mockPlugin1]);
          pluginCompatibility.runFullCompatibilityCheck.mockImplementation(p => ({compatible: true}));
          await pluginManager.initialize();
      }
      pluginRegistry.isPluginActive.mockImplementation(id => id === 'p1');
      pluginRegistry.getPlugin.mockReturnValue(mockPlugin1);
      pluginRegistry.deactivatePlugin.mockReturnValue(true);
    });

    test('debe desactivar un plugin activo', async () => {
      const result = await pluginManager.deactivatePlugin('p1');
      expect(result).toBe(true); 
      expect(pluginSandbox.executeSandboxed).toHaveBeenCalledWith('p1', expect.any(Function), [], null);
    });

    test('no debe desactivar si otros plugins activos dependen de él (sin forzar)', async () => {
        pluginDependencyResolver.getDependentPlugins.mockReturnValueOnce(['pDependent']);
        pluginRegistry.isPluginActive.mockImplementation(id => id === 'p1' || id === 'pDependent');
        const result = await pluginManager.deactivatePlugin('p1', false);
        expect(result).toBe(false);
    });

    test('debe desactivar si otros plugins dependen pero se fuerza', async () => {
        pluginDependencyResolver.getDependentPlugins.mockReturnValueOnce(['pDependent']);
        pluginRegistry.isPluginActive.mockImplementation(id => id === 'p1' || id === 'pDependent');
        const result = await pluginManager.deactivatePlugin('p1', true);
        expect(result).toBe(true);
    });
  });

  describe('reloadPlugins', () => {
    let localManagerDeactivatePluginSpy;

    beforeEach(async () => {
        if (!pluginManager.initialized) {
            loadPlugins.mockResolvedValueOnce([mockPlugin1, mockPlugin2]);
            pluginRegistry.getAllPlugins.mockReturnValueOnce([mockPlugin1, mockPlugin2]);
            pluginCompatibility.runFullCompatibilityCheck.mockImplementation(p => ({compatible: true}));
            await pluginManager.initialize();
        }
        pluginRegistry.getActivePlugins.mockReturnValue([mockPlugin1, mockPlugin2]);
        localManagerDeactivatePluginSpy = jest.spyOn(pluginManager, 'deactivatePlugin');
        loadPlugins.mockClear(); 
        managerActivatePluginSpy.mockClear();
    });
     afterEach(() => {
        localManagerDeactivatePluginSpy.mockRestore();
    });

    test('debe recargar plugins, preservando el estado de los activos', async () => {
        loadPlugins.mockResolvedValueOnce([mockPlugin1, { ...mockPlugin2, version: '1.1.0' }, mockPlugin3]);
        pluginDependencyResolver.calculateLoadOrder.mockReturnValueOnce(['p1', 'p2', 'p3']);
        managerActivatePluginSpy.mockResolvedValue(true);

        const result = await pluginManager.reloadPlugins(true);
        expect(result).toBe(true);
        expect(loadPlugins).toHaveBeenCalledTimes(1);
        expect(localManagerDeactivatePluginSpy).toHaveBeenCalledWith('p1', true);
        expect(localManagerDeactivatePluginSpy).toHaveBeenCalledWith('p2', true);
        expect(pluginRegistry.clear).toHaveBeenCalled();
        expect(managerActivatePluginSpy).toHaveBeenCalledWith('p1');
        expect(managerActivatePluginSpy).toHaveBeenCalledWith('p2');
        expect(managerActivatePluginSpy).not.toHaveBeenCalledWith('p3');
    });
  });

  describe('Security Methods', () => {
    let localDeactivatePluginSpy; 
    beforeEach(async () => {
        pluginManager.initialized = false; 
        pluginManager.securityInitialized = false;
        
        storageService.get.mockImplementation((key, defaultValue) => {
            if (key === STORAGE_KEYS.PLUGIN_SECURITY_SETTINGS_KEY) {
                return Promise.resolve({ securityLevel: PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL });
            }
            if (key === 'atlas_plugin_states') return Promise.resolve({});
            return Promise.resolve(defaultValue);
        });
        loadPlugins.mockResolvedValueOnce([mockPlugin1, mockPlugin2]);
        pluginRegistry.getAllPlugins.mockReturnValueOnce([mockPlugin1, mockPlugin2]);
        pluginCompatibility.runFullCompatibilityCheck.mockImplementation(p => ({compatible: true}));
        
        await pluginManager.initialize({}, { enableSecurity: true });
        // Después de esta inicialización, pluginManager.securityLevel DEBERÍA ser NORMAL.
        
        localDeactivatePluginSpy = jest.spyOn(pluginManager, 'deactivatePlugin');
        eventBus.publish.mockClear(); 
    });
    afterEach(() => {
        localDeactivatePluginSpy.mockRestore();
    });

    test('setSecurityLevel debe actualizar el nivel y notificar a subsistemas', () => {
        expect(pluginManager.securityLevel).toBe(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);

        const result = pluginManager.setSecurityLevel('HIGH'); 
        expect(result).toBe(true);
        expect(pluginManager.securityLevel).toBe('HIGH');
        expect(pluginSecurityManager.setSecurityLevel).toHaveBeenCalledWith('HIGH');
        expect(pluginSandbox.setSecurityLevel).toHaveBeenCalledWith('HIGH');
        
        const securityLevelChangedCalls = eventBus.publish.mock.calls.filter(
            call => call[0] === 'pluginSystem.securityLevelChanged'
        );
        expect(securityLevelChangedCalls.length).toBe(1);
        expect(securityLevelChangedCalls[0][1]).toEqual({ level: 'HIGH', previousLevel: 'NORMAL' });
    });

    test('approvePluginPermissions debe llamar al permissionChecker y guardar estado', async () => {
        pluginPermissionChecker.approvePermissions.mockReturnValue(true);
        const result = await pluginManager.approvePluginPermissions('p1', ['storage']);
        expect(result).toBe(true);
        expect(pluginPermissionChecker.approvePermissions).toHaveBeenCalledWith('p1', ['storage']);
    });

    test('blacklistPlugin debe desactivar y llamar a securityManager', async () => {
        pluginRegistry.isPluginActive.mockReturnValueOnce(true);
        pluginSecurityManager.blacklistPlugin.mockReturnValue(true);

        const result = await pluginManager.blacklistPlugin('p1', 'Test reason');
        expect(result).toBe(true);
        expect(localDeactivatePluginSpy).toHaveBeenCalledWith('p1', true);
    });
  });
  
  describe('getStatus', () => {
    test('debe devolver el estado correcto del sistema de plugins', async () => {
        pluginManager.initialized = false; 
        loadPlugins.mockResolvedValueOnce([mockPlugin1, mockPlugin2]);
        pluginRegistry.getAllPlugins.mockReturnValueOnce([mockPlugin1, mockPlugin2]);
        pluginCompatibility.runFullCompatibilityCheck.mockImplementation(p => ({
            compatible: p.id === 'p1',
            reason: p.id === 'p1' ? 'Compatible' : 'incomp',
        }));
        await pluginManager.initialize({}, {enableSecurity: true});
        
        pluginRegistry.getActivePlugins.mockReturnValue([mockPlugin1]);
        pluginDependencyResolver.getDetectedCycles.mockReturnValueOnce([{nodes: ['cyclePlugin']}]);

        const status = pluginManager.getStatus();
        expect(status.initialized).toBe(true);
        expect(status.totalPlugins).toBe(2);
        expect(status.activePlugins).toBe(1);
        expect(status.compatiblePlugins).toBe(1);
        expect(status.incompatiblePlugins).toBe(1);
    });
  });
});