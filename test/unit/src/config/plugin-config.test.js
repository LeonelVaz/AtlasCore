/**
 * @jest-environment jsdom
 */

import '../../../../src/config/plugin-config.js';

describe('Plugin Configuration (plugin-config.js)', () => {
  let originalConsoleLog;
  let originalDispatchEvent; // Para restaurar el dispatchEvent real de JSDOM/navegador
  let spyOnWindowDispatch;   // Para espiar el dispatchEvent real

  beforeEach(() => {
    window.AtlasConfig = {
      plugins: [],
      pluginPaths: [],
    };

    originalConsoleLog = console.log;
    console.log = jest.fn();

    // Guardamos el dispatchEvent original de JSDOM/navegador
    // Es importante que sea el original real, no un mock de un test anterior.
    // Si window.dispatchEvent ya es un mock de Jest de un test anterior,
    // esto podría no funcionar como se espera sin un jest.restoreAllMocks() global.
    // Por ahora, asumimos que originalDispatchEvent es el método real.
    if (!originalDispatchEvent) { // Solo guardar la primera vez
        originalDispatchEvent = window.dispatchEvent;
    }
    // Para este test, vamos a espiar el dispatchEvent real
    // y también tener un mock para cuando lo necesitemos explícitamente.
    spyOnWindowDispatch = jest.spyOn(window, 'dispatchEvent');
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    // Restaurar el espía para limpiar
    spyOnWindowDispatch.mockRestore();
    // Si modificamos window.dispatchEvent directamente, restaurarlo:
    // window.dispatchEvent = originalDispatchEvent;
  });

  test('debe inicializar window.AtlasConfig correctamente', () => {
    expect(window.AtlasConfig).toBeDefined();
    expect(window.AtlasConfig.plugins).toEqual([]);
    expect(window.AtlasConfig.pluginPaths).toEqual([]);
  });

  test('debe definir window.registerPlugin', () => {
    expect(typeof window.registerPlugin).toBe('function');
  });

  describe('window.registerPlugin', () => {
    test('debe registrar un plugin nuevo y válido', () => {
      const plugin = { id: 'testPlugin', name: 'Test Plugin' };
      // Para este test específico, queremos que window.dispatchEvent sea nuestro espía/mock
      // para poder verificar sus llamadas.
      const mockDispatch = jest.fn();
      spyOnWindowDispatch.mockImplementation(mockDispatch); // Hacer que el espía use nuestro mock

      const result = window.registerPlugin(plugin);

      expect(result).toBe(true);
      expect(window.AtlasConfig.plugins).toContainEqual(plugin);
      expect(console.log).toHaveBeenCalledWith('Plugin registrado: testPlugin');
      
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      const dispatchedEvent = mockDispatch.mock.calls[0][0];
      expect(dispatchedEvent).toBeInstanceOf(CustomEvent);
      expect(dispatchedEvent.type).toBe('atlas:plugin:registered');
      expect(dispatchedEvent.detail).toEqual({ pluginId: 'testPlugin' });

      spyOnWindowDispatch.mockImplementation(originalDispatchEvent); // Restaurar comportamiento original del espía
    });

    test('no debe registrar un plugin si ya existe', () => {
      const plugin = { id: 'testPlugin', name: 'Test Plugin' };
      window.AtlasConfig.plugins.push(plugin); 
      console.log.mockClear();
      spyOnWindowDispatch.mockClear();

      const result = window.registerPlugin(plugin);

      expect(result).toBe(false);
      expect(window.AtlasConfig.plugins.length).toBe(1);
      expect(console.log).not.toHaveBeenCalled();
      expect(spyOnWindowDispatch).not.toHaveBeenCalled();
    });

    test('no debe registrar un plugin si no tiene id', () => {
      const plugin = { name: 'No ID Plugin' };
       spyOnWindowDispatch.mockClear();
      const result = window.registerPlugin(plugin);
      expect(result).toBe(false);
      expect(window.AtlasConfig.plugins).not.toContainEqual(plugin);
      expect(spyOnWindowDispatch).not.toHaveBeenCalled();
    });

    test('no debe registrar un plugin si es null o undefined', () => {
      spyOnWindowDispatch.mockClear();
      expect(window.registerPlugin(null)).toBe(false);
      expect(window.registerPlugin(undefined)).toBe(false);
      expect(spyOnWindowDispatch).not.toHaveBeenCalled();
    });
  });

  test('debe escuchar al evento "atlas:plugin:register" y registrar el plugin (verificando efecto)', () => {
    // El script plugin-config.js ya ha añadido su event listener a `window`
    // cuando se importó por primera vez. Este listener usa el window.dispatchEvent
    // que estaba presente en ese momento.

    const newPlugin = { id: 'eventPlugin', name: 'Event Plugin' };
    const eventToDispatch = new CustomEvent('atlas:plugin:register', {
      detail: { plugin: newPlugin }
    });

    // Queremos que el listener REAL del script se active.
    // Así que disparamos el evento usando el dispatchEvent original (no espiado/mockeado por este test).
    // `spyOnWindowDispatch` está espiando, por lo que la llamada a originalDispatchEvent será registrada por el espía.
    // Pero nuestro objetivo principal es verificar el *efecto* de que el plugin se añade.
    
    // Limpiar llamadas previas al espía si es necesario para esta aserción específica
    spyOnWindowDispatch.mockClear(); 
    console.log.mockClear();

    // Disparar el evento. Esto debería:
    // 1. Activar el listener en plugin-config.js.
    // 2. Ese listener llama a window.registerPlugin().
    // 3. window.registerPlugin() añade el plugin y dispara 'atlas:plugin:registered'.
    originalDispatchEvent.call(window, eventToDispatch); // Usar .call para asegurar el contexto correcto

    // Verificar el efecto principal: el plugin fue añadido
    expect(window.AtlasConfig.plugins).toContainEqual(newPlugin);
    expect(console.log).toHaveBeenCalledWith('Plugin registrado: eventPlugin');

    // Verificar que el evento 'atlas:plugin:registered' fue disparado.
    // El spyOnWindowDispatch debería haber capturado esta llamada, ya que
    // window.registerPlugin llama a window.dispatchEvent.
    const registeredEventCall = spyOnWindowDispatch.mock.calls.find(
        (call) => call[0] instanceof CustomEvent && call[0].type === 'atlas:plugin:registered'
    );
    expect(registeredEventCall).toBeDefined();
    if (registeredEventCall) {
        expect(registeredEventCall[0].detail).toEqual({ pluginId: 'eventPlugin' });
    }
  });
});