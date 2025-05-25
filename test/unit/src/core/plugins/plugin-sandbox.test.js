/**
 * @jest-environment jsdom
 */
import pluginSandbox from '../../../../../src/core/plugins/plugin-sandbox';
import { PLUGIN_CONSTANTS } from '../../../../../src/core/config/constants';

// Mockear dependencias
jest.mock('../../../../../src/core/bus/event-bus', () => ({
  publish: jest.fn(),
}));
jest.mock('../../../../../src/core/plugins/plugin-error-handler', () => ({
  handleError: jest.fn(),
}));

const eventBus = require('../../../../../src/core/bus/event-bus');
const pluginErrorHandler = require('../../../../../src/core/plugins/plugin-error-handler');

describe('PluginSandbox', () => {
  const pluginId = 'testPlugin';

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    pluginSandbox.initialized = false;
    pluginSandbox.securityLevel = PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL;
    pluginSandbox.activeChecks = new Set(['domManipulation', 'codeExecution', 'externalCommunication']);
    pluginSandbox.cachedNatives = {}; 
    pluginSandbox.sandboxedPlugins = new Set();
    pluginSandbox.sandboxErrors = {};
  });
  
  afterEach(() => {
     pluginSandbox.initialized = false;
  });

  describe('initialize', () => {
    test('debe inicializar y cachear métodos nativos', () => {
      pluginSandbox.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      expect(pluginSandbox.initialized).toBe(true);
      expect(pluginSandbox.securityLevel).toBe(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      expect(Object.keys(pluginSandbox.cachedNatives).length).toBeGreaterThan(0);
      expect(pluginSandbox.cachedNatives.setTimeout).toBeDefined();
    });

    test('debe aplicar protecciones globales si se inicializa en nivel HIGH', () => {
      const spyProtectGlobalObjects = jest.spyOn(pluginSandbox, '_protectGlobalObjects');
      pluginSandbox.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH);
      expect(pluginSandbox.securityLevel).toBe(PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH);
      expect(spyProtectGlobalObjects).toHaveBeenCalled();
      spyProtectGlobalObjects.mockRestore();
    });

    test('NO debe aplicar protecciones globales si se inicializa en nivel NORMAL', () => {
      const spyProtectGlobalObjects = jest.spyOn(pluginSandbox, '_protectGlobalObjects');
      pluginSandbox.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      expect(pluginSandbox.securityLevel).toBe(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      expect(spyProtectGlobalObjects).not.toHaveBeenCalled();
      spyProtectGlobalObjects.mockRestore();
    });
  });

  describe('validatePluginCode', () => {
    const mockPlugin = { id: 'p1', name: 'Plugin Code Test' };
    beforeEach(()=> {
      pluginSandbox.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL); 
      jest.clearAllMocks();
    });

    test('debe validar código sin violaciones', () => {
      const pluginCode = { ...mockPlugin, someFunc: '() => console.log("safe")' };
      const result = pluginSandbox.validatePluginCode(pluginId, JSON.parse(JSON.stringify(pluginCode)));
      expect(result.valid).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    test('debe detectar "eval" como violación crítica', () => {
      const pluginCode = { ...mockPlugin, someFunction: 'function() { eval("unsafe") }' }; 
      const result = pluginSandbox.validatePluginCode(pluginId, JSON.parse(JSON.stringify(pluginCode)));
      expect(result.valid).toBe(false);
      expect(result.violations.some(v => v.rule === 'preventEval' && v.severity === 'critical')).toBe(true);
    });

    test('debe filtrar violaciones según el nivel de seguridad LOW', () => {
      pluginSandbox.setSecurityLevel(PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW);
      const pluginCode = { ...mockPlugin, func1: '() => eval("critical")', func2: '() => { el.innerHTML = "medium"; }' };
      const result = pluginSandbox.validatePluginCode(pluginId, JSON.parse(JSON.stringify(pluginCode)));
      expect(result.valid).toBe(false); 
      expect(result.violations.length).toBe(1);
      expect(result.violations.some(v => v.rule === 'preventEval')).toBe(true);
      expect(result.violations.some(v => v.rule === 'preventInnerHTML')).toBe(false);
    });
  });

  describe('executeSandboxed', () => {
    beforeEach(()=> {
      pluginSandbox.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      jest.clearAllMocks();
    });

    test('debe ejecutar una función de forma segura', async () => {
      const mockFunc = jest.fn(() => 'success');
      const result = await pluginSandbox.executeSandboxed(pluginId, mockFunc, [1, 2]);
      expect(mockFunc).toHaveBeenCalledWith(1, 2);
      expect(result).toBe('success');
      expect(pluginSandbox.sandboxedPlugins.has(pluginId)).toBe(true);
    });

    test('debe manejar errores dentro de la función ejecutada', async () => {
      const error = new Error('Execution failed');
      const mockFunc = jest.fn(() => { throw error; });
      try {
        await pluginSandbox.executeSandboxed(pluginId, mockFunc);
        throw new Error("executeSandboxed no lanzó el error esperado");
      } catch (e) {
        expect(e.message).toBe('Execution failed');
      }
      expect(pluginErrorHandler.handleError).toHaveBeenCalledWith(pluginId, 'sandbox', error, expect.any(Object));
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.sandboxError', expect.objectContaining({ pluginId, error: 'Execution failed' }));
      expect(pluginSandbox.sandboxErrors[pluginId].length).toBe(1);
    });

    test('debe manejar timeout de ejecución', async () => {
        pluginSandbox.setSecurityLevel(PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH); 
        const sandboxTimeoutDuration = pluginSandbox._getExecutionTimeout(); // Es 2000ms para HIGH

        const mockFunc = jest.fn(() => new Promise(resolve => {
            const timer = pluginSandbox.cachedNatives.setTimeout || setTimeout;
            timer(() => resolve('nunca debería llegar aquí'), sandboxTimeoutDuration + 1000);
        }));

        const execution = pluginSandbox.executeSandboxed(pluginId, mockFunc);
        jest.advanceTimersByTime(sandboxTimeoutDuration + 100); 

        await expect(execution).rejects.toThrow(
          `Ejecución del plugin ${pluginId} excedió el límite de tiempo (${sandboxTimeoutDuration}ms)`
        );
        expect(pluginErrorHandler.handleError).toHaveBeenCalledWith(
            pluginId, 'sandbox',
            expect.objectContaining({ message: expect.stringContaining('excedió el límite de tiempo') }),
            expect.any(Object)
        );
        expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.sandboxError', expect.any(Object));
    }, 10000); // Timeout para Jest
  });

  describe('DOMProxy', () => {
    beforeEach(()=> {
      pluginSandbox.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      jest.clearAllMocks();
    });

    test('debe interceptar acceso a innerHTML en nivel HIGH', () => {
      pluginSandbox.setSecurityLevel(PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH);
      eventBus.publish.mockClear(); // Limpiar llamada de setSecurityLevel
      const div = document.createElement('div');
      const proxiedDiv = pluginSandbox.createDOMProxy(div, pluginId);
      
      expect(() => {
        proxiedDiv.innerHTML = '<script>alert("evil")</script>';
      }).toThrow('Operación potencialmente peligrosa bloqueada: dom_set innerHTML = [sospechoso]');
      
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.suspiciousOperation', expect.objectContaining({
          pluginId,
          type: 'dom_set',
          operation: 'innerHTML = [sospechoso]',
          blocked: true
      }));
    });

    test('debe permitir acceso a innerHTML en nivel LOW pero loguear si es sospechoso', () => {
      pluginSandbox.setSecurityLevel(PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW);
      eventBus.publish.mockClear(); // Limpiar llamada de setSecurityLevel

      const div = document.createElement('div');
      const proxiedDiv = pluginSandbox.createDOMProxy(div, pluginId);
      
      // 1. Contenido no sospechoso
      proxiedDiv.innerHTML = '<p>safe</p>'; 
      expect(div.innerHTML).toBe('<p>safe</p>');
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.sensitiveAccessAttempt', expect.objectContaining({
          pluginId, 
          type: 'dom_set', 
          target: 'DIV.innerHTML' 
      }));
      expect(eventBus.publish).not.toHaveBeenCalledWith('pluginSystem.suspiciousOperation', expect.anything());
      
      eventBus.publish.mockClear(); 

      // 2. Contenido sospechoso
      proxiedDiv.innerHTML = '<script>alert("evil")</script>';
      expect(div.innerHTML).toBe('<script>alert("evil")</script>'); 
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.suspiciousOperation', 
        expect.objectContaining({ 
            pluginId, 
            type: 'dom_set', 
            operation: 'innerHTML = [sospechoso]', 
            blocked: false
        })
      );
    });
  });
  
  describe('setSecurityLevel', () => {
    test('debe cambiar el nivel de seguridad y notificar (si está inicializado)', () => {
        pluginSandbox.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL); 
        eventBus.publish.mockClear(); // Limpiar la llamada de initialize

        const result = pluginSandbox.setSecurityLevel(PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH);
        expect(result).toBe(true);
        expect(pluginSandbox.securityLevel).toBe(PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH);
        expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.sandboxSecurityLevelChanged', { level: PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH });
    });

    test('debe aplicar protecciones globales al cambiar a HIGH si está inicializado', () => {
        pluginSandbox.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
        const spyProtectGlobalObjects = jest.spyOn(pluginSandbox, '_protectGlobalObjects');
        eventBus.publish.mockClear();

        pluginSandbox.setSecurityLevel(PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH);
        expect(spyProtectGlobalObjects).toHaveBeenCalled();
        spyProtectGlobalObjects.mockRestore();
    });

     test('debe devolver false para un nivel inválido', () => {
        pluginSandbox.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
        const originalLevel = pluginSandbox.securityLevel;
        const result = pluginSandbox.setSecurityLevel('INVALID_LEVEL_VALUE');
        expect(result).toBe(false);
        expect(pluginSandbox.securityLevel).toBe(originalLevel);
    });
  });

  describe('getStats', () => {
    beforeEach(()=> {
      pluginSandbox.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL);
      jest.clearAllMocks();
    });

    test('debe devolver estadísticas correctas del sandbox', async () => {
        await pluginSandbox.executeSandboxed('p1', () => {});
        try {
            await pluginSandbox.executeSandboxed('p2', () => { throw new Error('err'); });
        } catch (e) { /* Se espera y se maneja en el test de errores */ }

        const stats = pluginSandbox.getStats();
        expect(stats.sandboxedPlugins).toBe(2); 
        expect(stats.pluginsWithErrors).toBe(1); 
        expect(stats.totalErrors).toBe(1);
        expect(stats.topErrorPlugins.length).toBe(1);
        expect(stats.topErrorPlugins[0].pluginId).toBe('p2');
    });
  });
});