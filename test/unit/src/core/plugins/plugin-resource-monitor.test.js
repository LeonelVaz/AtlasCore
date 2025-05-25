// test/unit/src/core/plugins/plugin-resource-monitor.enhanced.test.js

/**
 * @jest-environment jsdom
 */
import pluginResourceMonitor from '../../../../../src/core/plugins/plugin-resource-monitor';
import { PLUGIN_CONSTANTS } from '../../../../../src/core/config/constants';

// Mockear dependencias
jest.mock('../../../../../src/core/bus/event-bus', () => ({
  publish: jest.fn(),
}));

const eventBus = require('../../../../../src/core/bus/event-bus');

describe('PluginResourceMonitor - Enhanced Coverage', () => {
  const pluginId = 'testPlugin';
  let originalPerformanceNow;
  let originalFetch;
  let mockPerformanceNowValue;

  beforeAll(() => {
    jest.useFakeTimers();
    originalFetch = global.fetch;
  });

  afterAll(() => {
    jest.useRealTimers();
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset singleton state
    pluginResourceMonitor.initialized = false;
    pluginResourceMonitor.securityLevel = PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL;
    pluginResourceMonitor.activeChecks = new Set(['resourceUsage']);
    pluginResourceMonitor.resourceUsage = {};
    pluginResourceMonitor.operationCounts = {};
    pluginResourceMonitor.restrictedPlugins = new Set();
    pluginResourceMonitor.enhancedMonitoringPlugins = new Set();
    
    if (pluginResourceMonitor.cleanupIntervalId) {
      clearInterval(pluginResourceMonitor.cleanupIntervalId);
      pluginResourceMonitor.cleanupIntervalId = null;
    }
    
    // Mock performance.now
    mockPerformanceNowValue = 1000;
    originalPerformanceNow = performance.now;
    performance.now = jest.fn(() => mockPerformanceNowValue);
    
    // Reset window modifications
    delete window._originalFetch;
    delete window.__resourceMonitor;
    delete window.__currentPluginContext;
    global.fetch = originalFetch;
    
    // Mock console methods
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });
  
  afterEach(() => {
    performance.now = originalPerformanceNow;
    if (pluginResourceMonitor.cleanupIntervalId) {
      clearInterval(pluginResourceMonitor.cleanupIntervalId);
      pluginResourceMonitor.cleanupIntervalId = null;
    }
    pluginResourceMonitor.initialized = false;
    
    // Reset window modifications
    if (window._originalFetch) {
      global.fetch = window._originalFetch;
      delete window._originalFetch;
    }
    delete window.__resourceMonitor;
    delete window.__currentPluginContext;
  });

  describe('initialize - casos edge', () => {
    test('debería manejar doble inicialización con mismo nivel', () => {
      pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      expect(pluginResourceMonitor.initialized).toBe(true);
      
      // Segunda inicialización con mismo nivel
      const result = pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      expect(result).toBe(true);
      expect(console.warn).toHaveBeenCalledWith('[ResourceMonitor] Monitor de recursos ya inicializado.');
    });

    test('debería manejar doble inicialización con nivel diferente', () => {
      pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      jest.clearAllMocks();
      
      // Segunda inicialización con nivel diferente
      const result = pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH);
      expect(result).toBe(true);
      expect(pluginResourceMonitor.securityLevel).toBe(PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH);
    });

    test('debería manejar inicialización sin parámetro de nivel', () => {
      const result = pluginResourceMonitor.initialize();
      expect(result).toBe(true);
      expect(pluginResourceMonitor.securityLevel).toBe(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
    });

    test('debería manejar error durante inicialización', () => {
      // Mock para que _startPeriodicCleanup falle
      const originalStartPeriodicCleanup = pluginResourceMonitor._startPeriodicCleanup;
      pluginResourceMonitor._startPeriodicCleanup = jest.fn(() => {
        throw new Error('Cleanup setup failed');
      });
      
      const result = pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      
      expect(result).toBe(false);
      expect(pluginResourceMonitor.initialized).toBe(false);
      expect(console.error).toHaveBeenCalledWith('[ResourceMonitor] Error al inicializar monitor de recursos:', expect.any(Error));
      
      // Restore
      pluginResourceMonitor._startPeriodicCleanup = originalStartPeriodicCleanup;
    });
  });

  describe('_setupNetworkMonitoring', () => {
    beforeEach(() => {
      pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
    });

    test('debería manejar error durante configuración de monitoreo de red', () => {
      // Simular error eliminando window temporalmente
      const originalWindow = global.window;
      delete global.window;
      
      pluginResourceMonitor._setupNetworkMonitoring();
      
      expect(console.error).toHaveBeenCalledWith('[ResourceMonitor] Error al configurar monitoreo de red:', expect.any(Error));
      
      // Restore
      global.window = originalWindow;
    });
  });

  describe('trackOperation - casos edge', () => {
    beforeEach(() => {
      pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      jest.clearAllMocks();
    });

    test('debería retornar función no-op cuando no está inicializado', () => {
      pluginResourceMonitor.initialized = false;
      
      const done = pluginResourceMonitor.trackOperation(pluginId, 'api');
      expect(typeof done).toBe('function');
      
      // Llamar la función no debería hacer nada
      done();
      expect(pluginResourceMonitor.operationCounts[pluginId]).toBeUndefined();
    });

    test('debería retornar función no-op cuando pluginId es null', () => {
      const done = pluginResourceMonitor.trackOperation(null, 'api');
      expect(typeof done).toBe('function');
      
      done();
      expect(Object.keys(pluginResourceMonitor.operationCounts)).toHaveLength(0);
    });

    test('debería retornar función no-op cuando resourceUsage no está en activeChecks', () => {
      pluginResourceMonitor.activeChecks.delete('resourceUsage');
      
      const done = pluginResourceMonitor.trackOperation(pluginId, 'api');
      expect(typeof done).toBe('function');
      
      done();
      expect(pluginResourceMonitor.operationCounts[pluginId]).toBeUndefined();
    });

    test('debería manejar diferentes tipos de operaciones', () => {
      const types = ['api', 'network', 'dom', 'storage', 'general'];
      
      types.forEach(type => {
        const done = pluginResourceMonitor.trackOperation(pluginId, type);
        done();
      });
      
      const counts = pluginResourceMonitor.operationCounts[pluginId];
      expect(counts.totalOperations).toBe(5);
      expect(counts.apiCalls).toBe(1);
      expect(counts.networkRequests).toBe(1);
      expect(counts.domOperations).toBe(1);
      expect(counts.storageOperations).toBe(1);
    });

    test('debería manejar cleanup de operationCounts durante trackOperation', () => {
      performance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1050);
      
      const done = pluginResourceMonitor.trackOperation(pluginId, 'api');
      
      // Simular que operationCounts fue limpiado durante la operación
      delete pluginResourceMonitor.operationCounts[pluginId];
      
      // No debería fallar al llamar done()
      expect(() => done()).not.toThrow();
    });

    test('debería mantener contexto de plugin anterior', () => {
      window.__currentPluginContext = 'previousPlugin';
      
      performance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1050);
      const done = pluginResourceMonitor.trackOperation(pluginId, 'api');
      
      expect(window.__currentPluginContext).toBe(pluginId);
      
      done();
      
      expect(window.__currentPluginContext).toBe('previousPlugin');
    });
  });

  describe('trackNetworkRequest', () => {
    beforeEach(() => {
      pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      jest.clearAllMocks();
    });

    test('debería rastrear requests de red correctamente', () => {
      pluginResourceMonitor.trackNetworkRequest(pluginId);
      
      expect(pluginResourceMonitor.operationCounts[pluginId].networkRequests).toBe(1);
      expect(pluginResourceMonitor.operationCounts[pluginId].totalOperations).toBe(1);
    });

    test('debería no hacer nada cuando no está inicializado', () => {
      pluginResourceMonitor.initialized = false;
      
      pluginResourceMonitor.trackNetworkRequest(pluginId);
      
      expect(pluginResourceMonitor.operationCounts[pluginId]).toBeUndefined();
    });

    test('debería no hacer nada cuando pluginId es null', () => {
      pluginResourceMonitor.trackNetworkRequest(null);
      
      expect(Object.keys(pluginResourceMonitor.operationCounts)).toHaveLength(0);
    });

    test('debería no hacer nada cuando resourceUsage no está en activeChecks', () => {
      pluginResourceMonitor.activeChecks.delete('resourceUsage');
      
      pluginResourceMonitor.trackNetworkRequest(pluginId);
      
      expect(pluginResourceMonitor.operationCounts[pluginId]).toBeUndefined();
    });
  });

  describe('trackMemoryUsage y trackStorageUsage', () => {
    beforeEach(() => {
      pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      jest.clearAllMocks();
    });

    test('debería rastrear uso de memoria', () => {
      pluginResourceMonitor.trackMemoryUsage(pluginId, 1024);
      
      expect(pluginResourceMonitor.resourceUsage[pluginId].memory).toBe(1024);
    });

    test('debería rastrear uso de almacenamiento', () => {
      pluginResourceMonitor.trackStorageUsage(pluginId, 2048);
      
      expect(pluginResourceMonitor.resourceUsage[pluginId].storage).toBe(2048);
    });

    test('debería no hacer nada con pluginId null', () => {
      pluginResourceMonitor.trackMemoryUsage(null, 1024);
      pluginResourceMonitor.trackStorageUsage(null, 2048);
      
      expect(Object.keys(pluginResourceMonitor.resourceUsage)).toHaveLength(0);
    });

    test('debería no hacer nada con valores NaN', () => {
      pluginResourceMonitor.trackMemoryUsage(pluginId, 'invalid');
      pluginResourceMonitor.trackStorageUsage(pluginId, 'invalid');
      
      expect(pluginResourceMonitor.resourceUsage[pluginId]).toBeUndefined();
    });

    test('debería no hacer nada cuando no está inicializado', () => {
      pluginResourceMonitor.initialized = false;
      
      pluginResourceMonitor.trackMemoryUsage(pluginId, 1024);
      pluginResourceMonitor.trackStorageUsage(pluginId, 2048);
      
      expect(pluginResourceMonitor.resourceUsage[pluginId]).toBeUndefined();
    });

    test('debería no hacer nada cuando resourceUsage no está en activeChecks', () => {
      pluginResourceMonitor.activeChecks.delete('resourceUsage');
      
      pluginResourceMonitor.trackMemoryUsage(pluginId, 1024);
      pluginResourceMonitor.trackStorageUsage(pluginId, 2048);
      
      expect(pluginResourceMonitor.resourceUsage[pluginId]).toBeUndefined();
    });
  });

  describe('_checkResourceLimits - casos edge', () => {
    beforeEach(() => {
      pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      jest.clearAllMocks();
    });

    test('debería no hacer nada con pluginId null', () => {
      pluginResourceMonitor._checkResourceLimits(null);
      
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    test('debería no hacer nada cuando operationCounts no existe', () => {
      pluginResourceMonitor._checkResourceLimits('nonexistent');
      
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    test('debería no hacer nada cuando resourceUsage no está en activeChecks', () => {
      pluginResourceMonitor.activeChecks.delete('resourceUsage');
      pluginResourceMonitor.operationCounts[pluginId] = { cpuTime: 9999 };
      
      pluginResourceMonitor._checkResourceLimits(pluginId);
      
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    test('debería manejar nivel de seguridad inválido', () => {
      pluginResourceMonitor.securityLevel = 'INVALID_LEVEL';
      pluginResourceMonitor.operationCounts[pluginId] = { cpuTime: 9999 };
      
      pluginResourceMonitor._checkResourceLimits(pluginId);
      
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('No se encontraron límites de recursos'));
    });

    test('debería verificar límites de memoria y storage', () => {
      const limits = pluginResourceMonitor.resourceLimits[PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL];
      
      // Setup datos que excedan límites
      pluginResourceMonitor.operationCounts[pluginId] = {
        cpuTime: 0, totalOperations: 0, apiCalls: 0, networkRequests: 0, domOperations: 0
      };
      
      pluginResourceMonitor.resourceUsage[pluginId] = {
        memory: limits.memory + 1000,
        storage: limits.storage + 1000,
        violations: []
      };
      
      pluginResourceMonitor._checkResourceLimits(pluginId);
      
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.resourceOveruse', 
        expect.objectContaining({
          violations: expect.arrayContaining([
            expect.objectContaining({ type: 'memory' }),
            expect.objectContaining({ type: 'storage' })
          ])
        })
      );
    });
  });

  describe('_handleResourceLimitViolations', () => {
    beforeEach(() => {
      pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      jest.clearAllMocks();
    });

    test('debería crear estructura de resourceUsage si no existe', () => {
      const violations = [{ type: 'cpuTime', current: 5000, limit: 2000 }];
      
      pluginResourceMonitor._handleResourceLimitViolations(pluginId, violations);
      
      expect(pluginResourceMonitor.resourceUsage[pluginId]).toBeDefined();
      expect(pluginResourceMonitor.resourceUsage[pluginId].violations).toHaveLength(1);
    });

    test('debería crear array de violations si no existe', () => {
      pluginResourceMonitor.resourceUsage[pluginId] = { memory: 0, storage: 0 };
      const violations = [{ type: 'cpuTime', current: 5000, limit: 2000 }];
      
      pluginResourceMonitor._handleResourceLimitViolations(pluginId, violations);
      
      expect(pluginResourceMonitor.resourceUsage[pluginId].violations).toHaveLength(1);
    });

    test('debería limitar el historial de violations a 20', () => {
      pluginResourceMonitor.resourceUsage[pluginId] = {
        violations: Array(25).fill({ timestamp: Date.now(), violations: [] })
      };
      
      const violations = [{ type: 'cpuTime', current: 5000, limit: 2000 }];
      pluginResourceMonitor._handleResourceLimitViolations(pluginId, violations);
      
      expect(pluginResourceMonitor.resourceUsage[pluginId].violations).toHaveLength(20);
    });

    test('debería solicitar desactivación para violaciones críticas en nivel HIGH', () => {
      pluginResourceMonitor.setSecurityLevel(PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH);
      const limits = pluginResourceMonitor.resourceLimits[PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH];
      
      const violations = [{ 
        type: 'cpuTime', 
        current: limits.cpuTimePerMinute * 3, // 3x el límite = crítico
        limit: limits.cpuTimePerMinute 
      }];
      
      pluginResourceMonitor._handleResourceLimitViolations(pluginId, violations);
      
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.securityDeactivateRequest', 
        expect.objectContaining({
          pluginId,
          reason: expect.stringContaining('Uso excesivo de recursos: cpuTime')
        })
      );
    });
  });

  describe('applyRestrictions y removeRestrictions', () => {
    beforeEach(() => {
      pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      jest.clearAllMocks();
    });

    test('debería aplicar restricciones correctamente', () => {
      const result = pluginResourceMonitor.applyRestrictions(pluginId);
      
      expect(result).toBe(true);
      expect(pluginResourceMonitor.restrictedPlugins.has(pluginId)).toBe(true);
      expect(pluginResourceMonitor.enhancedMonitoringPlugins.has(pluginId)).toBe(true);
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.pluginRestricted', {
        pluginId,
        restrictionLevel: 0.5
      });
    });

    test('debería manejar error al aplicar restricciones', () => {
      // Mock para simular error
      const originalAdd = pluginResourceMonitor.restrictedPlugins.add;
      pluginResourceMonitor.restrictedPlugins.add = jest.fn(() => {
        throw new Error('Add failed');
      });
      
      const result = pluginResourceMonitor.applyRestrictions(pluginId);
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error al aplicar restricciones'),
        expect.any(Error)
      );
      
      // Restore
      pluginResourceMonitor.restrictedPlugins.add = originalAdd;
    });

    test('debería retornar false para pluginId null en apply', () => {
      const result = pluginResourceMonitor.applyRestrictions(null);
      expect(result).toBe(false);
    });

    test('debería remover restricciones correctamente', () => {
      pluginResourceMonitor.restrictedPlugins.add(pluginId);
      
      const result = pluginResourceMonitor.removeRestrictions(pluginId);
      
      expect(result).toBe(true);
      expect(pluginResourceMonitor.restrictedPlugins.has(pluginId)).toBe(false);
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.pluginUnrestricted', { pluginId });
    });

    test('debería manejar remover restricciones de plugin no restringido', () => {
      const result = pluginResourceMonitor.removeRestrictions(pluginId);
      
      expect(result).toBe(true);
      expect(eventBus.publish).not.toHaveBeenCalledWith('pluginSystem.pluginUnrestricted', expect.anything());
    });

    test('debería retornar false para pluginId null en remove', () => {
      const result = pluginResourceMonitor.removeRestrictions(null);
      expect(result).toBe(false);
    });

    test('debería manejar error al remover restricciones', () => {
      const originalDelete = pluginResourceMonitor.restrictedPlugins.delete;
      pluginResourceMonitor.restrictedPlugins.delete = jest.fn(() => {
        throw new Error('Delete failed');
      });
      
      const result = pluginResourceMonitor.removeRestrictions(pluginId);
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error al eliminar restricciones'),
        expect.any(Error)
      );
      
      // Restore
      pluginResourceMonitor.restrictedPlugins.delete = originalDelete;
    });
  });

  describe('increaseMonitoring y decreaseMonitoring', () => {
    test('debería aumentar monitoreo correctamente', () => {
      const result = pluginResourceMonitor.increaseMonitoring(pluginId);
      
      expect(result).toBe(true);
      expect(pluginResourceMonitor.enhancedMonitoringPlugins.has(pluginId)).toBe(true);
    });

    test('debería retornar false para pluginId null en increase', () => {
      const result = pluginResourceMonitor.increaseMonitoring(null);
      expect(result).toBe(false);
    });

    test('debería manejar error al aumentar monitoreo', () => {
      const originalAdd = pluginResourceMonitor.enhancedMonitoringPlugins.add;
      pluginResourceMonitor.enhancedMonitoringPlugins.add = jest.fn(() => {
        throw new Error('Add failed');
      });
      
      const result = pluginResourceMonitor.increaseMonitoring(pluginId);
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error al aumentar monitoreo'),
        expect.any(Error)
      );
      
      // Restore
      pluginResourceMonitor.enhancedMonitoringPlugins.add = originalAdd;
    });

    test('debería reducir monitoreo correctamente', () => {
      pluginResourceMonitor.enhancedMonitoringPlugins.add(pluginId);
      
      const result = pluginResourceMonitor.decreaseMonitoring(pluginId);
      
      expect(result).toBe(true);
      expect(pluginResourceMonitor.enhancedMonitoringPlugins.has(pluginId)).toBe(false);
    });

    test('debería retornar false para pluginId null en decrease', () => {
      const result = pluginResourceMonitor.decreaseMonitoring(null);
      expect(result).toBe(false);
    });

    test('debería manejar error al reducir monitoreo', () => {
      const originalDelete = pluginResourceMonitor.enhancedMonitoringPlugins.delete;
      pluginResourceMonitor.enhancedMonitoringPlugins.delete = jest.fn(() => {
        throw new Error('Delete failed');
      });
      
      const result = pluginResourceMonitor.decreaseMonitoring(pluginId);
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error al reducir monitoreo'),
        expect.any(Error)
      );
      
      // Restore
      pluginResourceMonitor.enhancedMonitoringPlugins.delete = originalDelete;
    });
  });

  describe('setSecurityLevel - casos edge', () => {
    test('debería manejar nivel null', () => {
      const result = pluginResourceMonitor.setSecurityLevel(null);
      
      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Nivel de seguridad inválido'));
    });

    test('debería manejar nivel inválido', () => {
      const result = pluginResourceMonitor.setSecurityLevel('INVALID');
      
      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('Nivel de seguridad inválido'));
    });

    test('debería retornar true para mismo nivel cuando está inicializado', () => {
      pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      jest.clearAllMocks();
      
      const result = pluginResourceMonitor.setSecurityLevel(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      
      expect(result).toBe(true);
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    test('debería manejar error durante cambio de nivel', () => {
      const originalPublish = eventBus.publish;
      eventBus.publish = jest.fn(() => {
        throw new Error('Publish failed');
      });
      
      const result = pluginResourceMonitor.setSecurityLevel(PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH);
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error al cambiar nivel de seguridad'),
        expect.any(Error)
      );
      
      // Restore
      eventBus.publish = originalPublish;
    });
  });

  describe('updateSecurityChecks', () => {
    beforeEach(() => {
      pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      jest.clearAllMocks();
    });

    test('debería manejar input null', () => {
      pluginResourceMonitor.updateSecurityChecks(null);
      
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('debe ser un array'));
    });

    test('debería manejar input no array', () => {
      pluginResourceMonitor.updateSecurityChecks('invalid');
      
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('debe ser un array'));
    });

    test('debería manejar error durante actualización', () => {
      const originalPublish = eventBus.publish;
      eventBus.publish = jest.fn(() => {
        throw new Error('Publish failed');
      });
      
      pluginResourceMonitor.updateSecurityChecks(['resourceUsage']);
      
      expect(console.error).toHaveBeenCalledWith(
        '[ResourceMonitor] Error al actualizar verificaciones de seguridad:',
        expect.any(Error)
      );
      
      // Restore
      eventBus.publish = originalPublish;
    });
  });

  describe('getPluginResourceUsage - casos edge', () => {
    test('debería manejar pluginId null', () => {
      const usage = pluginResourceMonitor.getPluginResourceUsage(null);
      
      expect(usage.operationCounts).toBeNull();
      expect(usage.resources).toBeNull();
      expect(usage.isRestricted).toBe(false);
      expect(usage.hasEnhancedMonitoring).toBe(false);
      expect(usage.limits).toBeDefined();
    });

    test('debería manejar error durante obtención de datos', () => {
      const originalRestrictedPlugins = pluginResourceMonitor.restrictedPlugins;
      pluginResourceMonitor.restrictedPlugins = {
        has: jest.fn(() => {
          throw new Error('Has failed');
        })
      };
      
      const usage = pluginResourceMonitor.getPluginResourceUsage(pluginId);
      
      expect(usage.error).toBe('Has failed');
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error al obtener uso de recursos'),
        expect.any(Error)
      );
      
      // Restore
      pluginResourceMonitor.restrictedPlugins = originalRestrictedPlugins;
    });
  });

  describe('_getEffectiveLimits', () => {
    beforeEach(() => {
      pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
    });

    test('debería retornar límites base para plugin no restringido', () => {
      const limits = pluginResourceMonitor._getEffectiveLimits(pluginId);
      const baseLimits = pluginResourceMonitor.resourceLimits[PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL];
      
      expect(limits).toEqual(baseLimits);
    });

    test('debería retornar límites reducidos para plugin restringido', () => {
      pluginResourceMonitor.restrictedPlugins.add(pluginId);
      
      const limits = pluginResourceMonitor._getEffectiveLimits(pluginId);
      const baseLimits = pluginResourceMonitor.resourceLimits[PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL];
      
      Object.keys(baseLimits).forEach(key => {
        expect(limits[key]).toBe(baseLimits[key] * 0.5);
      });
    });

    test('debería manejar nivel de seguridad inválido', () => {
      pluginResourceMonitor.securityLevel = 'INVALID';
      
      const limits = pluginResourceMonitor._getEffectiveLimits(pluginId);
      const normalLimits = pluginResourceMonitor.resourceLimits[PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL];
      
      expect(limits).toEqual(normalLimits);
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('No se pudieron obtener los límites base'));
    });
  });

  describe('getResourceStats - casos edge', () => {
    test('debería manejar error durante obtención de stats', () => {
      const originalOperationCounts = pluginResourceMonitor.operationCounts;
      pluginResourceMonitor.operationCounts = {
        get length() {
          throw new Error('Length failed');
        }
      };
      
      const stats = pluginResourceMonitor.getResourceStats();
      
      expect(stats.error).toBe('Length failed');
      expect(console.error).toHaveBeenCalledWith(
        '[ResourceMonitor] Error al obtener estadísticas de recursos:',
        expect.any(Error)
      );
      
      // Restore
      pluginResourceMonitor.operationCounts = originalOperationCounts;
    });

    test('debería calcular stats con datos de violaciones', () => {
      pluginResourceMonitor.resourceUsage[pluginId] = {
        violations: [
          { timestamp: Date.now(), violations: [{ type: 'cpuTime' }] },
          { timestamp: Date.now() - 1000, violations: [{ type: 'memory' }] }
        ]
      };
      
      const stats = pluginResourceMonitor.getResourceStats();
      
      expect(stats.recentViolations).toHaveLength(1);
      expect(stats.recentViolations[0].pluginId).toBe(pluginId);
      expect(stats.recentViolations[0].violationCount).toBe(2);
    });
  });

  describe('cleanup', () => {
    test('debería limpiar completamente el estado', () => {
      pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      
      // Setup network monitoring
      window._originalFetch = jest.fn();
      window.__resourceMonitor = pluginResourceMonitor;
      window.__currentPluginContext = 'test';
      
      const result = pluginResourceMonitor.cleanup();
      
      expect(result).toBe(true);
      expect(pluginResourceMonitor.initialized).toBe(false);
      expect(pluginResourceMonitor.cleanupIntervalId).toBeNull();
      expect(window.__resourceMonitor).toBeUndefined();
      expect(window.__currentPluginContext).toBeUndefined();
      expect(window._originalFetch).toBeUndefined();
    });

    test('debería manejar error durante cleanup', () => {
      const originalClearInterval = clearInterval;
      global.clearInterval = jest.fn(() => {
        throw new Error('Clear interval failed');
      });
      
      pluginResourceMonitor.cleanupIntervalId = 'test';
      
      const result = pluginResourceMonitor.cleanup();
      
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        '[ResourceMonitor] Error en limpieza de monitor de recursos:',
        expect.any(Error)
      );
      
      // Restore
      global.clearInterval = originalClearInterval;
    });
  });

  describe('fetch wrapper integration', () => {
    beforeEach(() => {
      pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      pluginResourceMonitor.updateSecurityChecks(['resourceUsage', 'networkRequests']);
    });

    test('debería interceptar y rastrear requests fetch', async () => {
      window.__currentPluginContext = pluginId;
      global.fetch = jest.fn().mockResolvedValue({ ok: true });
      
      pluginResourceMonitor._setupNetworkMonitoring();
      
      await window.fetch('https://example.com');
      
      expect(pluginResourceMonitor.operationCounts[pluginId]?.networkRequests).toBe(1);
    });
  });

  describe('_resetOperationCounters', () => {
    beforeEach(() => {
      pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      jest.clearAllMocks();
    });

    test('debería resetear contadores y crear historial', () => {
      // Setup operation counts
      pluginResourceMonitor.operationCounts[pluginId] = {
        apiCalls: 5,
        networkRequests: 3,
        domOperations: 2,
        storageOperations: 1,
        cpuTime: 1000,
        totalOperations: 11
      };
      
      pluginResourceMonitor._resetOperationCounters();
      
      // Check that counters were reset
      expect(pluginResourceMonitor.operationCounts[pluginId].totalOperations).toBe(0);
      expect(pluginResourceMonitor.operationCounts[pluginId].apiCalls).toBe(0);
      
      // Check that history was created
      expect(pluginResourceMonitor.resourceUsage[pluginId].history).toHaveLength(1);
      expect(pluginResourceMonitor.resourceUsage[pluginId].history[0].operations.totalOperations).toBe(11);
    });

    test('debería limitar el historial a 60 entradas', () => {
      // Setup large history
      pluginResourceMonitor.resourceUsage[pluginId] = {
        history: Array(65).fill().map((_, i) => ({ 
          timestamp: Date.now() - i * 1000, 
          operations: {} 
        }))
      };
      
      pluginResourceMonitor.operationCounts[pluginId] = { totalOperations: 1 };
      
      pluginResourceMonitor._resetOperationCounters();
      
      expect(pluginResourceMonitor.resourceUsage[pluginId].history).toHaveLength(60);
    });
  });
});