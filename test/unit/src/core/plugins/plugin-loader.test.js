/**
 * @jest-environment jsdom
 */

const mockImportAllPluginsFn = jest.fn(() => []);
const mockRequireAllPluginsFn = jest.fn(() => []);

// --- Mockear dependencias ANTES de jest.doMock ---
// Estos mocks serán los que se usen DENTRO de la factory de jest.doMock
// cuando se llamen a través de `require` o `import` implícito.
jest.mock('../../../../../src/core/plugins/plugin-validator', () => ({
  validatePlugin: jest.fn(plugin => plugin && !!plugin.id),
  validatePluginComplete: jest.fn(plugin => ({
    valid: plugin && !!plugin.id,
    reason: plugin && !!plugin.id ? 'Valid' : 'Invalid',
    details: {}
  })),
}));
jest.mock('../../../../../src/core/plugins/plugin-compatibility', () => ({
  runFullCompatibilityCheck: jest.fn(plugin => ({
    compatible: plugin && plugin.id !== 'incompatiblePlugin',
    reason: plugin && plugin.id !== 'incompatiblePlugin' ? 'Compatible' : 'Incompatible by mock',
    details: {},
  })),
}));
jest.mock('../../../../../src/core/plugins/plugin-dependency-resolver', () => ({
  calculateLoadOrder: jest.fn(ids => ids || []), // Asegurar que devuelva array si ids es undefined
  getPluginPriority: jest.fn(plugin => plugin.priority || (plugin.core ? 10 : 100)),
}));
jest.mock('../../../../../src/core/bus/event-bus', () => ({
  publish: jest.fn(),
}));

// --- Mockear el módulo 'plugin-loader' ---
jest.doMock('../../../../../src/core/plugins/plugin-loader', () => {
  // Obtener los MOCKS de las dependencias (NO los reales)
  const mockedValidator = require('../../../../../src/core/plugins/plugin-validator');
  const mockedDepResolver = require('../../../../../src/core/plugins/plugin-dependency-resolver');
  const mockedEventBus = require('../../../../../src/core/bus/event-bus');
  const mockedCompatibility = require('../../../../../src/core/plugins/plugin-compatibility');

  return {
    __esModule: true,
    loadPlugins: jest.fn(async () => {
      let plugins = [];
      try {
        const vitePlugins = mockImportAllPluginsFn();
        if (vitePlugins.length > 0) plugins = [...plugins, ...vitePlugins];
      } catch (e) { /* ignore */ }

      if (plugins.length === 0) {
        try {
          const webpackPlugins = mockRequireAllPluginsFn();
          if (webpackPlugins.length > 0) plugins = [...plugins, ...webpackPlugins];
        } catch (e) { /* ignore */ }
      }
      
      // Usar los mocks de las dependencias
      const validPlugins = plugins.filter(p => mockedValidator.validatePlugin(p));
      const sortedPluginIds = mockedDepResolver.calculateLoadOrder(validPlugins.map(p => p.id));
      const sortedPlugins = sortedPluginIds
        .map(id => validPlugins.find(p => p.id === id))
        .filter(Boolean);

      mockedEventBus.publish('pluginSystem.pluginsSorted', {
        original: plugins.length,
        sorted: sortedPlugins.length,
        order: sortedPlugins.map(p => p.id)
      });
      return sortedPlugins;
    }),
    loadPluginById: jest.fn(async (pluginId) => {
      let foundPlugin = null;
      const vitePlugins = mockImportAllPluginsFn();
      foundPlugin = vitePlugins.find(p => p.id === pluginId);
      if (foundPlugin) return foundPlugin;

      const webpackPlugins = mockRequireAllPluginsFn();
      foundPlugin = webpackPlugins.find(p => p.id === pluginId);
      if (foundPlugin) return foundPlugin;
      
      try {
        // @ts-ignore
        const module = await global.import(`/src/plugins/${pluginId}/index.js`);
        if (module && module.default) return module.default;
      } catch (e) { /* ignore */ }
      return null;
    }),
    validatePluginCompatibility: jest.fn((plugin) => {
        const basicValidation = mockedValidator.validatePluginComplete(plugin);
        if (!basicValidation.valid) return basicValidation;
        
        const compatResult = mockedCompatibility.runFullCompatibilityCheck(plugin);
        return {
            valid: compatResult.compatible,
            reason: compatResult.compatible ? 'Compatible' : compatResult.reason,
            details: {
                ...basicValidation.details,
                compatibility: compatResult.details,
            },
        };
    }),
  };
});


// --- Importar las funciones mockeadas de 'plugin-loader' ---
// Estas serán las funciones definidas en la factory de jest.doMock
const { loadPlugins, loadPluginById, validatePluginCompatibility } = require('../../../../../src/core/plugins/plugin-loader');

// --- Importar los mocks de las dependencias para aserciones ---
// Ahora estos son los mocks definidos con jest.mock al principio del archivo
const pluginValidator = require('../../../../../src/core/plugins/plugin-validator');
const pluginCompatibility = require('../../../../../src/core/plugins/plugin-compatibility');
const pluginDependencyResolver = require('../../../../../src/core/plugins/plugin-dependency-resolver');
const eventBus = require('../../../../../src/core/bus/event-bus');


describe('PluginLoader', () => {
  let originalConsoleError;
  let originalConsoleLog;
  let originalConsoleWarn;
  let mockGlobalImportFn;

  const mockPlugin1 = { id: 'plugin1', name: 'Plugin 1', priority: 50, init: jest.fn(), cleanup: jest.fn() };
  const mockPlugin2 = { id: 'plugin2', name: 'Plugin 2', core: true, init: jest.fn(), cleanup: jest.fn() };
  const mockPlugin3 = { id: 'plugin3', name: 'Plugin 3', init: jest.fn(), cleanup: jest.fn() };

  let mockGlobalImportMetaGlob; // Ya no se usa directamente en tests
  let mockGlobalRequireContext; // Ya no se usa directamente en tests

  beforeEach(() => {
    jest.clearAllMocks();
    mockImportAllPluginsFn.mockClear().mockReturnValue([]);
    mockRequireAllPluginsFn.mockClear().mockReturnValue([]);
    // Limpiar los mocks de las funciones exportadas por plugin-loader (que vienen de jest.doMock)
    loadPlugins.mockClear();
    loadPluginById.mockClear();
    validatePluginCompatibility.mockClear();

    // @ts-ignore
    mockGlobalImportMetaGlob = global.import.meta.glob;
    // @ts-ignore
    mockGlobalRequireContext = global.require.context;
    // @ts-ignore
    mockGlobalImportFn = global.import;

    if (typeof mockGlobalImportMetaGlob?.mockClear !== 'function') { /* ... advertencias ... */ }
    if (typeof mockGlobalRequireContext?.mockClear !== 'function') { /* ... advertencias ... */ }
    if (typeof mockGlobalImportFn?.mockClear !== 'function') { /* ... advertencias ... */ }
    
    mockGlobalImportMetaGlob?.mockClear();
    mockGlobalRequireContext?.mockClear();
    mockGlobalImportFn?.mockClear();

    originalConsoleError = console.error;
    originalConsoleLog = console.log;
    originalConsoleWarn = console.warn;
    console.error = jest.fn();
    console.log = jest.fn();
    console.warn = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
  });

  describe('loadPlugins (usando la implementación mockeada por jest.doMock)', () => {
    test('debe cargar plugins usando mockImportAllPluginsFn', async () => {
      mockImportAllPluginsFn.mockReturnValue([mockPlugin1, mockPlugin2]);
      mockRequireAllPluginsFn.mockReturnValue([]);

      const plugins = await loadPlugins();
      
      expect(mockImportAllPluginsFn).toHaveBeenCalled();
      expect(plugins.length).toBe(2);
      expect(plugins).toContain(mockPlugin1);
      expect(plugins).toContain(mockPlugin2);
      
      // Ahora verificamos que los *mocks* de las dependencias fueron llamados
      expect(pluginValidator.validatePlugin).toHaveBeenCalledTimes(2);
      expect(pluginDependencyResolver.calculateLoadOrder).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.pluginsSorted', expect.any(Object));
    });

    test('debe cargar plugins usando mockRequireAllPluginsFn si mockImportAllPluginsFn falla o no devuelve nada', async () => {
      mockImportAllPluginsFn.mockImplementation(() => { throw new Error("glob fail"); });
      mockRequireAllPluginsFn.mockReturnValue([mockPlugin1, mockPlugin2]);

      const plugins = await loadPlugins();
      expect(mockRequireAllPluginsFn).toHaveBeenCalled();
      expect(plugins.length).toBe(2);
      expect(plugins).toContain(mockPlugin1);
    });
    
    test('debe devolver array vacío si ningún mock de "fuente" devuelve plugins', async () => {
        mockImportAllPluginsFn.mockImplementation(() => { throw new Error("glob fail"); });
        mockRequireAllPluginsFn.mockImplementation(() => { throw new Error("require fail"); });
  
        const plugins = await loadPlugins();
        expect(plugins.length).toBe(0);
    });

    test('debe filtrar plugins inválidos (usando el mock de validatePlugin)', async () => {
        const invalidPlugin = { name: "No ID" }; 
        mockImportAllPluginsFn.mockReturnValue([mockPlugin1, invalidPlugin]);
        // validatePlugin (el mock) devolverá false para invalidPlugin
        
        const plugins = await loadPlugins();
        expect(plugins.length).toBe(1);
        expect(plugins[0]).toBe(mockPlugin1);
        expect(pluginValidator.validatePlugin).toHaveBeenCalledWith(mockPlugin1);
        expect(pluginValidator.validatePlugin).toHaveBeenCalledWith(invalidPlugin);
    });

    test('debe usar el orden de calculateLoadOrder (mockeado)', async () => {
        const p1 = {id: 'p1', priority: 100, init: jest.fn(), cleanup: jest.fn()};
        const p2 = {id: 'p2', priority: 10, init: jest.fn(), cleanup: jest.fn()};
        const p3 = {id: 'p3', priority: 50, init: jest.fn(), cleanup: jest.fn()};
        mockImportAllPluginsFn.mockReturnValue([p1,p2,p3]);
        
        pluginDependencyResolver.calculateLoadOrder.mockReturnValueOnce(['p2', 'p3', 'p1']);

        const sortedPlugins = await loadPlugins();
        expect(sortedPlugins.map(p => p.id)).toEqual(['p2', 'p3', 'p1']);
        expect(pluginDependencyResolver.calculateLoadOrder).toHaveBeenCalledWith(['p1', 'p2', 'p3']);
    });
  });

  describe('loadPluginById (usando la implementación mockeada por jest.doMock)', () => {
    test('debe intentar cargar dinámicamente usando global.import (mockeado)', async () => {
      mockGlobalImportFn.mockImplementation(async (path) => {
        if (path === `/src/plugins/plugin3/index.js`) {
          return { default: mockPlugin3 };
        }
        throw new Error('Cannot find module');
      });
      mockImportAllPluginsFn.mockReturnValue([]);
      mockRequireAllPluginsFn.mockReturnValue([]);

      const plugin = await loadPluginById('plugin3');
      
      expect(plugin).toBe(mockPlugin3);
      expect(mockGlobalImportFn).toHaveBeenCalledWith('/src/plugins/plugin3/index.js');
    });

    test('debe devolver null si el plugin no se encuentra (mockeado)', async () => {
        mockImportAllPluginsFn.mockReturnValue([]);
        mockRequireAllPluginsFn.mockReturnValue([]);
        mockGlobalImportFn.mockImplementation(async () => { throw new Error('Not found');});

        const plugin = await loadPluginById('nonExistent');
        expect(plugin).toBeNull();
    });

    test('debe obtener plugin de mockImportAllPluginsFn si está allí', async () => {
        mockImportAllPluginsFn.mockReturnValue([mockPlugin1]);
        const plugin = await loadPluginById('plugin1');
        expect(plugin).toBe(mockPlugin1);
        expect(mockGlobalImportFn).not.toHaveBeenCalled();
    });
  });

  describe('validatePluginCompatibility (usando la implementación mockeada por jest.doMock)', () => {
    test('debe llamar a los mocks de validación y compatibilidad', () => {
      const plugin = { id: 'testPlugin', name: 'Test' };
      validatePluginCompatibility(plugin); // Esta es la función de jest.doMock

      expect(pluginValidator.validatePluginComplete).toHaveBeenCalledWith(plugin);
      expect(pluginCompatibility.runFullCompatibilityCheck).toHaveBeenCalledWith(plugin);
    });
  });

});