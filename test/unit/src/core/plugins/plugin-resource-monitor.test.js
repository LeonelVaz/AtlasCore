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

// Helper para avanzar timers de Jest
const advanceTimersByTime = (time) => {
  jest.advanceTimersByTime(time);
};

describe('PluginResourceMonitor', () => {
  const pluginId = 'testPlugin';
  let originalPerformanceNow;
  let mockPerformanceNowValue;
  let clearIntervalSpy; // To spy on global clearInterval

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Resetear estado interno del singleton
    pluginResourceMonitor.initialized = false; // IMPORTANT: Reset before each test
    pluginResourceMonitor.securityLevel = PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL; // Default state before init
    pluginResourceMonitor.activeChecks = new Set(['resourceUsage']); // Default active checks
    pluginResourceMonitor.resourceUsage = {};
    pluginResourceMonitor.operationCounts = {};
    pluginResourceMonitor.restrictedPlugins = new Set();
    pluginResourceMonitor.enhancedMonitoringPlugins = new Set();

    if (pluginResourceMonitor.cleanupIntervalId) {
      clearInterval(pluginResourceMonitor.cleanupIntervalId); // Use actual clearInterval
      pluginResourceMonitor.cleanupIntervalId = null;
    }
    
    mockPerformanceNowValue = 1000;
    originalPerformanceNow = performance.now;
    performance.now = jest.fn(() => mockPerformanceNowValue);

    // Spy on clearInterval for the cleanup test
    clearIntervalSpy = jest.spyOn(global, 'clearInterval');
  });
  
  afterEach(() => {
     performance.now = originalPerformanceNow;
     if (pluginResourceMonitor.cleanupIntervalId) {
       clearInterval(pluginResourceMonitor.cleanupIntervalId);
       pluginResourceMonitor.cleanupIntervalId = null;
     }
     pluginResourceMonitor.initialized = false;
     clearIntervalSpy.mockRestore(); // Restore the spy
  });


  describe('initialize', () => {
    test('debe inicializar con un nivel de seguridad y empezar limpieza periódica', () => {
      pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      expect(pluginResourceMonitor.initialized).toBe(true);
      expect(pluginResourceMonitor.securityLevel).toBe(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      expect(pluginResourceMonitor.cleanupIntervalId).not.toBeNull(); // Interval ID should be set
    });
  });

  describe('trackOperation', () => {
    beforeEach(() => {
        pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
        jest.clearAllMocks(); // Clear mocks called during initialize
        performance.now.mockClear();
    });

    test('debe rastrear una operación y medir tiempo de CPU', () => {
      performance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1050); 

      const done = pluginResourceMonitor.trackOperation(pluginId, 'api');
      done();

      expect(pluginResourceMonitor.operationCounts[pluginId].totalOperations).toBe(1);
      expect(pluginResourceMonitor.operationCounts[pluginId].apiCalls).toBe(1);
      expect(pluginResourceMonitor.operationCounts[pluginId].cpuTime).toBe(50);
    });

    test('debe manejar múltiples operaciones', () => {
        performance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1010);
        const done1 = pluginResourceMonitor.trackOperation(pluginId, 'api');
        done1();
        
        performance.now.mockReturnValueOnce(1100).mockReturnValueOnce(1120);
        const done2 = pluginResourceMonitor.trackOperation(pluginId, 'storage');
        done2();

        expect(pluginResourceMonitor.operationCounts[pluginId].totalOperations).toBe(2);
        expect(pluginResourceMonitor.operationCounts[pluginId].apiCalls).toBe(1);
        expect(pluginResourceMonitor.operationCounts[pluginId].storageOperations).toBe(1);
        expect(pluginResourceMonitor.operationCounts[pluginId].cpuTime).toBe(30); // 10ms + 20ms
    });
  });

  describe('Resource Limits', () => {
    beforeEach(() => {
        pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH);
        jest.clearAllMocks();
        performance.now.mockClear();
    });

    test('debe restringir un plugin si excede los límites de CPU', () => {
      const limits = pluginResourceMonitor.resourceLimits[PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH]; // cpuTimePerMinute: 1000
      
      performance.now.mockReturnValue(2000); 
      if (!pluginResourceMonitor.operationCounts[pluginId]) {
          pluginResourceMonitor.operationCounts[pluginId] = { cpuTime: 0, totalOperations: 0, apiCalls:0, networkRequests:0, domOperations:0, storageOperations:0 };
      }
      pluginResourceMonitor.operationCounts[pluginId].cpuTime = limits.cpuTimePerMinute - 10; // 990
      
      const done = pluginResourceMonitor.trackOperation(pluginId, 'api');
      performance.now.mockReturnValue(2000 + 20); // Adds 20ms. Total = 1010. Limit = 1000
      done();

      expect(pluginResourceMonitor.restrictedPlugins.has(pluginId)).toBe(true);
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.resourceOveruse', 
        expect.objectContaining({ 
            pluginId, 
            action: 'restricted',
            violations: expect.arrayContaining([
                expect.objectContaining({type: 'cpuTime', current: 1010, limit: 1000})
            ])
        })
      );
    });

    test('debe solicitar desactivación en nivel HIGH si el exceso es crítico', () => {
      const limits = pluginResourceMonitor.resourceLimits[PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH]; // cpuTimePerMinute is 1000
      
      performance.now.mockReturnValue(3000);
      if (!pluginResourceMonitor.operationCounts[pluginId]) {
          pluginResourceMonitor.operationCounts[pluginId] = { cpuTime: 0, totalOperations: 0, apiCalls:0, networkRequests:0, domOperations:0, storageOperations:0 };
      }
      pluginResourceMonitor.operationCounts[pluginId].cpuTime = limits.cpuTimePerMinute - 10; // 990

      const done = pluginResourceMonitor.trackOperation(pluginId, 'api');
      // Exceed limit * 2. limit is 1000. limit * 2 is 2000.
      // Current cpu is 990. To exceed 2000, need to add > 1010. Add 1011.
      performance.now.mockReturnValue(3000 + 1011); // Total CPU time: 990 + 1011 = 2001
      done();
      
      // Check for resourceOveruse first (always published on violation)
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.resourceOveruse',
        expect.objectContaining({
            pluginId,
            action: 'restricted',
            violations: expect.arrayContaining([
                expect.objectContaining({ type: 'cpuTime', current: 2001, limit: 1000 })
            ])
        })
      );
      // Then check for securityDeactivateRequest (published if critical)
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.securityDeactivateRequest', 
        expect.objectContaining({ pluginId, reason: expect.stringContaining('Uso excesivo de recursos: cpuTime') })
      );
    });
  });

  describe('Periodic Cleanup', () => {
    beforeEach(() => {
        pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
        jest.clearAllMocks();
        performance.now.mockClear();
    });

    test('debe resetear contadores después del intervalo', () => {
      const done = pluginResourceMonitor.trackOperation(pluginId, 'api');
      done();
      expect(pluginResourceMonitor.operationCounts[pluginId].totalOperations).toBe(1);

      advanceTimersByTime(pluginResourceMonitor.counterResetInterval + 1000);

      expect(pluginResourceMonitor.operationCounts[pluginId].totalOperations).toBe(0);
      expect(pluginResourceMonitor.resourceUsage[pluginId].history.length).toBe(1);
    });
  });
  
  describe('setSecurityLevel', () => {
    // Initialize is not called in top-level beforeEach for this describe,
    // because setSecurityLevel itself might be part of an initialization sequence
    // or called on an already initialized monitor.
    // We will initialize it if needed inside the test or a nested beforeEach.

    test('debe cambiar el nivel de seguridad interno en un monitor inicializado', () => {
        pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL); // Init to NORMAL
        jest.clearAllMocks(); // Clear init calls

        pluginResourceMonitor.setSecurityLevel(PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH);
        expect(pluginResourceMonitor.securityLevel).toBe(PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH);
        expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.resourceMonitorSecurityLevelChanged', { level: PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH });
    });

     test('debe devolver false para un nivel inválido', () => {
        pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
        const originalLevel = pluginResourceMonitor.securityLevel;
        const result = pluginResourceMonitor.setSecurityLevel('INVALID_LEVEL');
        expect(result).toBe(false);
        expect(pluginResourceMonitor.securityLevel).toBe(originalLevel); // Should not change
    });
  });

  describe('getPluginResourceUsage', () => {
    beforeEach(() => {
        pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
        jest.clearAllMocks();
        performance.now.mockClear();
    });

    test('debe devolver el uso de recursos para un plugin', () => {
      const done = pluginResourceMonitor.trackOperation(pluginId, 'api');
      done();
      pluginResourceMonitor.trackMemoryUsage(pluginId, 1024);

      const usage = pluginResourceMonitor.getPluginResourceUsage(pluginId);
      expect(usage.operationCounts.totalOperations).toBe(1);
      expect(usage.resources.memory).toBe(1024);
      expect(usage.isRestricted).toBe(false);
    });
  });

  describe('getResourceStats', () => {
    beforeEach(() => {
        pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
        jest.clearAllMocks();
        performance.now.mockClear();
    });

    test('debe devolver estadísticas agregadas de recursos', () => {
        const done1 = pluginResourceMonitor.trackOperation('p1', 'api'); done1();
        const done2 = pluginResourceMonitor.trackOperation('p2', 'network'); done2();
        pluginResourceMonitor.trackMemoryUsage('p1', 500);

        const stats = pluginResourceMonitor.getResourceStats();
        expect(stats.monitoredPlugins).toBe(2);
        expect(stats.totalUsage.totalOperations).toBe(2);
        expect(stats.totalUsage.memory).toBe(500);
        expect(stats.topResourceUsers.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('cleanup', () => {
    test('debe limpiar el intervalo y resetear el estado de inicialización', () => {
        pluginResourceMonitor.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL); // Ensure intervalId is set
        const intervalId = pluginResourceMonitor.cleanupIntervalId;
        expect(intervalId).not.toBeNull();

        pluginResourceMonitor.cleanup();

        expect(pluginResourceMonitor.cleanupIntervalId).toBeNull();
        expect(pluginResourceMonitor.initialized).toBe(false);
        expect(clearIntervalSpy).toHaveBeenCalledWith(intervalId);
    });
  });
});