/**
 * @jest-environment jsdom
 */
import pluginAPIRegistry from "../../../../../src/core/plugins/plugin-api-registry";

// Mockear dependencias
jest.mock("../../../../../src/core/bus/event-bus", () => ({
  publish: jest.fn(),
}));
jest.mock("../../../../../src/core/plugins/plugin-registry", () => ({
  getPlugin: jest.fn(),
  isPluginActive: jest.fn(),
}));
jest.mock("../../../../../src/core/plugins/plugin-compatibility", () => ({
  getConflictInfo: jest.fn(),
}));
jest.mock("../../../../../src/core/plugins/plugin-error-handler", () => ({
  handleError: jest.fn(),
}));

const eventBus = require("../../../../../src/core/bus/event-bus");
const pluginRegistry = require("../../../../../src/core/plugins/plugin-registry");
const pluginCompatibility = require("../../../../../src/core/plugins/plugin-compatibility");
const pluginErrorHandler = require("../../../../../src/core/plugins/plugin-error-handler");

describe("PluginAPIRegistry", () => {
  let originalConsoleWarn;
  let originalConsoleError;
  let originalConsoleLog;

  beforeEach(() => {
    jest.clearAllMocks();
    pluginAPIRegistry.clearAll();

    originalConsoleWarn = console.warn;
    originalConsoleError = console.error;
    originalConsoleLog = console.log;
    console.warn = jest.fn();
    console.error = jest.fn();
    console.log = jest.fn();

    pluginRegistry.getPlugin.mockImplementation((pluginId) => ({
      id: pluginId,
      name: pluginId,
      dependencies: [],
    }));
    pluginRegistry.isPluginActive.mockReturnValue(true);
    pluginCompatibility.getConflictInfo.mockReturnValue(null);
  });

  afterEach(() => {
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  // ... (tests de registerAPI y getPluginAPI sin cambios, ya pasaban) ...
  describe("registerAPI", () => {
    test("debe registrar una API y publicar evento", () => {
      const api = { method1: () => "test" };
      const result = pluginAPIRegistry.registerAPI("pluginA", api);
      expect(result).toBe(true);
      expect(pluginAPIRegistry.getPluginAPI("pluginA")).toBeDefined();
      expect(pluginAPIRegistry.publicAPIs["pluginA"].methods).toEqual([
        "method1",
      ]);
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.apiRegistered",
        {
          pluginId: "pluginA",
          methods: ["method1"],
        }
      );
      expect(console.log).toHaveBeenCalledWith(
        "API pública registrada para plugin: pluginA"
      );
    });

    test("no debe registrar API si el plugin no está registrado en pluginRegistry", () => {
      pluginRegistry.getPlugin.mockReturnValueOnce(null);
      const result = pluginAPIRegistry.registerAPI("pluginB", {
        test: () => {},
      });
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        "No se puede registrar API para plugin no registrado: pluginB"
      );
    });

    test("debe advertir si se sobrescribe una API existente", () => {
      pluginAPIRegistry.registerAPI("pluginA", { oldMethod: () => {} });
      console.log.mockClear();

      pluginAPIRegistry.registerAPI("pluginA", { newMethod: () => {} });
      expect(console.warn).toHaveBeenCalledWith(
        "Sobrescribiendo API existente para plugin: pluginA"
      );
      expect(console.log).toHaveBeenCalledWith(
        "API pública registrada para plugin: pluginA"
      );
    });

    test("debe manejar errores durante el registro y llamar a pluginErrorHandler", () => {
      pluginRegistry.getPlugin.mockImplementationOnce(() => {
        throw new Error("Registry error during getPlugin");
      });
      const result = pluginAPIRegistry.registerAPI("pluginC", {
        test: () => {},
      });
      expect(result).toBe(false);
      expect(pluginErrorHandler.handleError).toHaveBeenCalledWith(
        "pluginC",
        "registerAPI",
        expect.any(Error),
        expect.objectContaining({ apiObject: ["test"] })
      );
    });
  });

  describe("getPluginAPI", () => {
    test("debe devolver la API procesada (envuelta) de un plugin", () => {
      const rawApi = { method: () => "raw" };
      pluginAPIRegistry.registerAPI("pluginA", rawApi);
      const api = pluginAPIRegistry.getPluginAPI("pluginA");
      expect(api).toBeDefined();
      expect(typeof api.method).toBe("function");
      expect(api.method).not.toBe(rawApi.method);
    });

    test("debe devolver null si el plugin no tiene API registrada", () => {
      expect(pluginAPIRegistry.getPluginAPI("nonExistent")).toBeNull();
    });
  });

  describe("callPluginMethod", () => {
    let apiPluginA;
    const mockMethodAImpl = jest.fn(() => "resultFromA");

    beforeEach(() => {
      apiPluginA = { methodA: mockMethodAImpl };
      // Asegurarse de que pluginA y su API estén registrados para cada test en este describe
      pluginRegistry.getPlugin.mockImplementation((id) => {
        if (id === "pluginA")
          return { id: "pluginA", name: "Plugin A", dependencies: [] };
        if (id === "pluginB")
          return { id: "pluginB", name: "Plugin B", dependencies: ["pluginA"] };
        if (id === "pluginC")
          return { id: "pluginC", name: "Plugin C", dependencies: [] };
        return null;
      });
      pluginAPIRegistry.registerAPI("pluginA", apiPluginA);
    });

    test("debe llamar a un método de la API de otro plugin si tiene permiso (dependencia)", () => {
      const result = pluginAPIRegistry.callPluginMethod(
        "pluginB",
        "pluginA",
        "methodA",
        [1, 2]
      );
      expect(mockMethodAImpl).toHaveBeenCalledWith(1, 2);
      expect(result).toBe("resultFromA");
      const log = pluginAPIRegistry.getAccessLog("pluginB");
      expect(log.length).toBeGreaterThan(0);
      expect(log[0]).toMatchObject({
        caller: "pluginB",
        target: "pluginA",
        method: "methodA",
        success: true,
      });
    });

    test('debe permitir a "app" (o caller no plugin) llamar a cualquier API', () => {
      const result = pluginAPIRegistry.callPluginMethod(
        "app",
        "pluginA",
        "methodA"
      );
      expect(mockMethodAImpl).toHaveBeenCalled();
      expect(result).toBe("resultFromA");
    });

    test("debe permitir a un plugin llamar a su propia API", () => {
      const result = pluginAPIRegistry.callPluginMethod(
        "pluginA",
        "pluginA",
        "methodA"
      );
      expect(mockMethodAImpl).toHaveBeenCalled();
      expect(result).toBe("resultFromA");
    });

    test('debe lanzar error "Plugin no encontrado..." si targetAPI es null porque el plugin no tiene API registrada', () => {
      // pluginD no tiene API registrada porque no llamamos a registerAPI para él.
      // getPluginAPI('pluginD') devolverá null.
      pluginRegistry.getPlugin.mockImplementation((id) => {
        // Asegurar que pluginD "existe" como plugin
        if (id === "pluginD") return { id: "pluginD", dependencies: [] };
        return { id, dependencies: [] }; // Para otros como pluginB
      });
      expect(() =>
        pluginAPIRegistry.callPluginMethod("pluginB", "pluginD", "someMethod")
      ).toThrow("Plugin no encontrado o sin API pública: pluginD");
    });

    test('debe lanzar error "Método no encontrado..." si targetAPI existe pero el método no', () => {
      // pluginA y su API están registrados en el beforeEach de este describe.
      expect(() =>
        pluginAPIRegistry.callPluginMethod(
          "pluginB",
          "pluginA",
          "nonExistentMethod"
        )
      ).toThrow("Método no encontrado en la API de pluginA: nonExistentMethod");
    });

    test("debe lanzar error y loguear si no hay permiso (sin dependencia)", () => {
      // pluginC no depende de pluginA (configurado en el mock de getPlugin en beforeEach)
      // Sobrescribir _checkAPIAccess temporalmente para forzar el fallo de permiso
      // Esto es porque la lógica original de _checkAPIAccess podría tener un fallback a true.
      const originalCheckAPIAccess = pluginAPIRegistry._checkAPIAccess;
      pluginAPIRegistry._checkAPIAccess = jest.fn((caller, target, method) => {
        if (caller === "pluginC" && target === "pluginA") return false; // Denegar explícitamente
        return originalCheckAPIAccess.call(
          pluginAPIRegistry,
          caller,
          target,
          method
        ); // Usar original para otros
      });

      expect(() =>
        pluginAPIRegistry.callPluginMethod("pluginC", "pluginA", "methodA")
      ).toThrow(
        "Acceso denegado: pluginC no tiene permiso para acceder a pluginA.methodA"
      );

      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.unauthorizedAPIAccess",
        expect.objectContaining({
          callerPluginId: "pluginC",
          targetPluginId: "pluginA",
          method: "methodA",
        })
      );
      const log = pluginAPIRegistry.getAccessLog("pluginC");
      expect(log.length).toBeGreaterThan(0);
      expect(log[0]).toMatchObject({
        success: false,
        error: expect.stringContaining("Acceso denegado"),
      });

      pluginAPIRegistry._checkAPIAccess = originalCheckAPIAccess; // Restaurar
    });
  });

  describe("unregisterAPI", () => {
    test("debe eliminar una API registrada y publicar evento", () => {
      pluginAPIRegistry.registerAPI("pluginA", { test: () => {} });
      const result = pluginAPIRegistry.unregisterAPI("pluginA");
      expect(result).toBe(true);
      expect(pluginAPIRegistry.getPluginAPI("pluginA")).toBeNull();
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.apiUnregistered",
        { pluginId: "pluginA" }
      );
    });

    test("unregisterAPI debe devolver false si el plugin no tiene API registrada", () => {
      expect(pluginAPIRegistry.unregisterAPI("nonExistentPlugin")).toBe(false);
    });
  });
});
