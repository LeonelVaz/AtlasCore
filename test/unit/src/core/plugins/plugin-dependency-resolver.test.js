/**
 * @jest-environment jsdom
 */
import pluginDependencyResolver from "../../../../../src/core/plugins/plugin-dependency-resolver";

// Mockear dependencias directamente en la factory de jest.mock
jest.mock("../../../../../src/core/plugins/plugin-registry", () => ({
  getAllPlugins: jest.fn(() => []),
  getPlugin: jest.fn(),
}));

jest.mock("../../../../../src/core/plugins/plugin-compatibility", () => ({
  checkAppCompatibility: jest.fn(),
  checkDependencies: jest.fn(),
  checkConflicts: jest.fn(),
  checkReversedConflicts: jest.fn(),
}));

jest.mock("../../../../../src/core/bus/event-bus", () => ({
  publish: jest.fn(), // Esta es la función mock que usaremos
}));

// Importar los módulos mockeados para acceder a sus funciones jest.fn()
const pluginRegistry = require("../../../../../src/core/plugins/plugin-registry");
const pluginCompatibility = require("../../../../../src/core/plugins/plugin-compatibility");
const eventBus = require("../../../../../src/core/bus/event-bus"); // Acceder al mock de eventBus

describe("PluginDependencyResolver", () => {
  let originalConsoleWarn;
  let originalConsoleError;

  beforeEach(() => {
    jest.clearAllMocks();
    pluginDependencyResolver.clearCache();
    pluginRegistry.getAllPlugins.mockReturnValue([]);

    originalConsoleWarn = console.warn;
    originalConsoleError = console.error;
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  describe("_buildDependencyGraph", () => {
    test("debe construir el grafo de dependencias y dependencias inversas correctamente", () => {
      const plugins = [
        { id: "A", dependencies: [{ id: "B" }] },
        { id: "B", dependencies: [{ id: "C" }] },
        { id: "C", dependencies: [] },
        { id: "D", dependencies: [{ id: "B" }] },
        { id: "E" },
        { id: "F", dependencies: null },
        { id: "G", dependencies: [{ id: "H" }, { id: "I" }] },
      ];
      pluginRegistry.getAllPlugins.mockReturnValue(plugins);

      pluginDependencyResolver._buildDependencyGraph();

      expect(pluginDependencyResolver.dependencyGraph).toEqual({
        A: ["B"],
        B: ["C"],
        C: [],
        D: ["B"],
        E: [],
        F: [],
        G: ["H", "I"],
      });
      expect(pluginDependencyResolver.reverseDependencies).toEqual({
        B: ["A", "D"],
        C: ["B"],
        H: ["G"],
        I: ["G"],
      });
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.dependencyGraphBuilt",
        expect.any(Object)
      );
    });

    test("debe manejar dependencias como strings", () => {
      const plugins = [{ id: "A", dependencies: ["B"] }];
      pluginRegistry.getAllPlugins.mockReturnValue(plugins);
      pluginDependencyResolver._buildDependencyGraph();
      expect(pluginDependencyResolver.dependencyGraph["A"]).toEqual(["B"]);
      expect(pluginDependencyResolver.reverseDependencies["B"]).toEqual(["A"]);
    });
  });

  describe("_detectCycles", () => {
    test("debe detectar ciclos simples A -> B -> A", () => {
      const plugins = [
        { id: "A", dependencies: [{ id: "B" }] },
        { id: "B", dependencies: [{ id: "A" }] },
      ];
      pluginRegistry.getAllPlugins.mockReturnValue(plugins);

      const cycles = pluginDependencyResolver._detectCycles();
      expect(cycles.length).toBe(1);
      expect(cycles[0].nodes).toEqual(expect.arrayContaining(["A", "B"]));
      expect(cycles[0].nodes.length).toBe(3);
      // CORRECCIÓN: Usar la variable 'eventBus' importada
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.cyclesDetected",
        { cycles }
      );
    });

    test("no debe detectar ciclos si no los hay", () => {
      const plugins = [
        { id: "A", dependencies: [{ id: "B" }] },
        { id: "B", dependencies: [{ id: "C" }] },
        { id: "C", dependencies: [] },
      ];
      pluginRegistry.getAllPlugins.mockReturnValue(plugins);
      const cycles = pluginDependencyResolver._detectCycles();
      expect(cycles.length).toBe(0);
      expect(eventBus.publish).not.toHaveBeenCalledWith(
        "pluginSystem.cyclesDetected",
        expect.anything()
      );
    });

    test("debe detectar ciclos más largos A -> B -> C -> A", () => {
      const plugins = [
        { id: "A", dependencies: [{ id: "B" }] },
        { id: "B", dependencies: [{ id: "C" }] },
        { id: "C", dependencies: [{ id: "A" }] },
      ];
      pluginRegistry.getAllPlugins.mockReturnValue(plugins);
      const cycles = pluginDependencyResolver._detectCycles();
      expect(cycles.length).toBe(1);
      expect(cycles[0].nodes).toEqual(expect.arrayContaining(["A", "B", "C"]));
      expect(cycles[0].nodes.length).toBe(4);
    });
  });

  describe("calculateLoadOrder", () => {
    test("debe calcular el orden de carga correcto para dependencias lineales", () => {
      const plugins = [
        { id: "B", dependencies: [{ id: "C" }] },
        { id: "A", dependencies: [{ id: "B" }] },
        { id: "C", dependencies: [] },
      ];
      pluginRegistry.getAllPlugins.mockReturnValue(plugins);
      const order = pluginDependencyResolver.calculateLoadOrder();
      expect(order.indexOf("C")).toBeLessThan(order.indexOf("B"));
      expect(order.indexOf("B")).toBeLessThan(order.indexOf("A"));
      expect(order.length).toBe(3);
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.loadOrderCalculated",
        expect.objectContaining({ order, cycles: [] })
      );
    });

    test("debe manejar plugins sin dependencias y dependencias compartidas", () => {
      const plugins = [
        { id: "A", dependencies: [{ id: "C" }] },
        { id: "B", dependencies: [{ id: "C" }] },
        { id: "C", dependencies: [] },
        { id: "D", dependencies: [] },
      ];
      pluginRegistry.getAllPlugins.mockReturnValue(plugins);
      const order = pluginDependencyResolver.calculateLoadOrder();
      expect(order.length).toBe(4);
      expect(order.indexOf("C")).toBeLessThan(order.indexOf("A"));
      expect(order.indexOf("C")).toBeLessThan(order.indexOf("B"));
      expect(order).toContain("D");
    });

    test("debe advertir y romper ciclos al calcular el orden de carga", () => {
      const plugins = [
        { id: "A", dependencies: [{ id: "B" }] },
        { id: "B", dependencies: [{ id: "A" }] },
        { id: "C", dependencies: [] },
      ];
      pluginRegistry.getAllPlugins.mockReturnValue(plugins);
      const order = pluginDependencyResolver.calculateLoadOrder();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Detectados 1 ciclos de dependencias")
      );
      expect(order.length).toBe(3);
      expect(order).toContain("A");
      expect(order).toContain("B");
      expect(order).toContain("C");
      expect(pluginDependencyResolver.detectedCycles.length).toBe(1);
    });

    test("debe devolver todos los plugins si falla la construcción del grafo", () => {
      const originalBuildGraph = pluginDependencyResolver._buildDependencyGraph;
      pluginDependencyResolver._buildDependencyGraph = jest.fn(() => {
        throw new Error("Graph build error");
      });

      pluginRegistry.getAllPlugins.mockReturnValue([{ id: "X" }, { id: "Y" }]);

      const order = pluginDependencyResolver.calculateLoadOrder();
      expect(order).toEqual(["X", "Y"]);
      expect(console.error).toHaveBeenCalledWith(
        "Error al calcular orden de carga de plugins:",
        expect.any(Error)
      );

      pluginDependencyResolver._buildDependencyGraph = originalBuildGraph;
    });
  });

  describe("getPluginPriority", () => {
    // Definir los plugins para este contexto específico para asegurar reverseDependencies
    const pluginsForPriorityTest = [
      { id: "A", dependencies: [{ id: "C" }] }, // C es dependencia de A
      { id: "B", dependencies: [{ id: "C" }] }, // C es dependencia de B
      { id: "C", dependencies: [] }, // C no tiene dependencias
      { id: "D", core: true }, // D es core
      { id: "E", priority: 5 }, // E tiene prioridad explícita
    ];

    beforeEach(() => {
      // Construir el grafo basado en los plugins específicos para este describe
      pluginRegistry.getAllPlugins.mockReturnValue(pluginsForPriorityTest);
      pluginDependencyResolver._buildDependencyGraph();
    });

    test("debe devolver la prioridad definida en el plugin si existe", () => {
      expect(
        pluginDependencyResolver.getPluginPriority({ id: "E", priority: 5 })
      ).toBe(5);
    });

    test("debe devolver prioridad alta (10) para plugins core", () => {
      expect(
        pluginDependencyResolver.getPluginPriority({ id: "D", core: true })
      ).toBe(10);
    });

    test("debe calcular prioridad basada en dependientes inversos", () => {
      // Para 'C': reverseDependencies['C'] es ['A', 'B'] (length 2)
      // 100 - Math.min(90, 2 * 10) = 100 - Math.min(90, 20) = 100 - 20 = 80
      expect(pluginDependencyResolver.getPluginPriority({ id: "C" })).toBe(80);

      // Para 'A': reverseDependencies['A'] es undefined (length 0)
      // 100 - Math.min(90, 0 * 10) = 100 - 0 = 100
      expect(pluginDependencyResolver.getPluginPriority({ id: "A" })).toBe(100);

      // Verificación de la relación de prioridad
      expect(
        pluginDependencyResolver.getPluginPriority({ id: "C" })
      ).toBeLessThan(pluginDependencyResolver.getPluginPriority({ id: "A" }));
    });
  });

  describe("validateAllPlugins", () => {
    test("debe validar todos los plugins y publicar resultados", () => {
      const pluginOk = {
        id: "pOk",
        minAppVersion: "0.1.0",
        maxAppVersion: "1.0.0",
        dependencies: [],
        conflicts: [],
      };
      const pluginBadDep = {
        id: "pBadDep",
        minAppVersion: "0.1.0",
        maxAppVersion: "1.0.0",
        dependencies: [{ id: "missing", version: "1.0.0" }],
        conflicts: [],
      };
      pluginRegistry.getAllPlugins.mockReturnValue([pluginOk, pluginBadDep]);

      pluginCompatibility.checkAppCompatibility.mockImplementation((p) => ({
        compatible: true,
        reason: "",
      }));
      pluginCompatibility.checkDependencies.mockImplementation((p) => {
        if (p.id === "pOk") return { satisfied: true, missing: [] };
        return {
          satisfied: false,
          missing: [{ id: "missing" }],
          reason: "Falta dependencia",
        };
      });
      pluginCompatibility.checkConflicts.mockReturnValue({
        hasConflicts: false,
        conflicts: [],
      });
      pluginCompatibility.checkReversedConflicts.mockReturnValue({
        hasConflicts: false,
        conflicts: [],
      });

      const result = pluginDependencyResolver.validateAllPlugins();

      expect(result.total).toBe(2);
      expect(result.valid).toBe(1);
      expect(result.invalid).toBe(1);
      expect(result.results["pOk"].valid).toBe(true);
      expect(result.results["pBadDep"].valid).toBe(false);
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.pluginsValidated",
        expect.any(Object)
      );
    });
  });
});
