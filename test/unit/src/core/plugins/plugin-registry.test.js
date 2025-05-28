/**
 * @jest-environment jsdom
 */
import pluginRegistryModule from "../../../../../src/core/plugins/plugin-registry";

// pluginRegistry es un singleton
const pluginRegistry = pluginRegistryModule;

describe("PluginRegistry", () => {
  const mockPlugin1 = {
    id: "p1",
    name: "Plugin 1",
    version: "1.0.0",
    init: jest.fn(() => true),
    cleanup: jest.fn(() => true),
  };
  const mockPlugin2 = {
    id: "p2",
    name: "Plugin 2",
    version: "1.0.0",
    dependencies: [{ id: "p1" }],
    init: jest.fn(() => true),
    cleanup: jest.fn(() => true),
  };
  const mockCoreAPI = { version: "test-core" };
  let originalConsoleWarn;
  let originalConsoleError;
  let originalConsoleLog;

  beforeEach(() => {
    jest.clearAllMocks();
    // Resetear estado interno del singleton pluginRegistry
    pluginRegistry.plugins = {};
    pluginRegistry.activePlugins = {};
    pluginRegistry.instances = {};
    pluginRegistry.pluginStates = {};
    pluginRegistry.pluginErrors = {};
    pluginRegistry.pluginDependencies = {};
    pluginRegistry.pluginConflicts = {};

    originalConsoleWarn = console.warn;
    originalConsoleError = console.error;
    originalConsoleLog = console.log;
    console.warn = jest.fn();
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  describe("registerPlugin", () => {
    test("debe registrar un plugin y sus dependencias/conflictos", () => {
      const pluginWithAll = {
        ...mockPlugin1,
        dependencies: [{ id: "depA", version: "1.0" }],
        conflicts: [{ id: "confB", reason: "test conflict" }],
      };
      const result = pluginRegistry.registerPlugin(pluginWithAll);
      expect(result).toBe(true);
      expect(pluginRegistry.plugins["p1"]).toBe(pluginWithAll);
      expect(pluginRegistry.pluginStates["p1"].registered).toBeDefined();
      expect(pluginRegistry.pluginDependencies["p1"]).toEqual([
        { id: "depA", version: "1.0" },
      ]);
      expect(pluginRegistry.pluginConflicts["p1"]).toEqual([
        { id: "confB", reason: "test conflict" },
      ]);
    });

    test("debe advertir si se sobrescribe un plugin existente", () => {
      pluginRegistry.registerPlugin(mockPlugin1);
      pluginRegistry.registerPlugin({ ...mockPlugin1, version: "1.1.0" });
      expect(console.warn).toHaveBeenCalledWith(
        "El plugin p1 ya está registrado, será sobrescrito"
      );
    });

    test("debe devolver false y loguear error si el plugin no tiene ID", () => {
      const result = pluginRegistry.registerPlugin({ name: "No ID" });
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        "Intento de registrar plugin sin ID"
      );
    });
  });

  describe("unregisterPlugin", () => {
    test("debe desregistrar un plugin", () => {
      pluginRegistry.registerPlugin(mockPlugin1);
      const result = pluginRegistry.unregisterPlugin("p1");
      expect(result).toBe(true);
      expect(pluginRegistry.plugins["p1"]).toBeUndefined();
      expect(pluginRegistry.pluginStates["p1"].unregistered).toBeDefined();
    });

    test("debe desactivar el plugin si estaba activo antes de desregistrar", () => {
      pluginRegistry.registerPlugin(mockPlugin1);
      pluginRegistry.activatePlugin("p1", mockCoreAPI); // Activar primero

      const result = pluginRegistry.unregisterPlugin("p1");
      expect(result).toBe(true);
      expect(mockPlugin1.cleanup).toHaveBeenCalled(); // Asegura que cleanup fue llamado
      expect(pluginRegistry.activePlugins["p1"]).toBeUndefined();
    });

    test("debe devolver false si el plugin no existe", () => {
      const result = pluginRegistry.unregisterPlugin("nonExistent");
      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith(
        "Intento de desregistrar plugin inexistente: nonExistent"
      );
    });
  });

  describe("activatePlugin", () => {
    beforeEach(() => {
      pluginRegistry.registerPlugin(mockPlugin1);
    });

    test("debe activar un plugin registrado y llamar a su método init", () => {
      const result = pluginRegistry.activatePlugin("p1", mockCoreAPI);
      expect(result).toBe(true);
      expect(mockPlugin1.init).toHaveBeenCalledWith(mockCoreAPI);
      expect(pluginRegistry.activePlugins["p1"]).toBe(true);
      expect(pluginRegistry.instances["p1"].initialized).toBe(true);
      expect(pluginRegistry.pluginStates["p1"].active).toBe(true);
      expect(pluginRegistry.pluginStates["p1"].lastActivated).toBeDefined();
      expect(console.log).toHaveBeenCalledWith("Plugin activado: p1");
    });

    test("debe devolver true si el plugin ya está activo", () => {
      pluginRegistry.activatePlugin("p1", mockCoreAPI);
      mockPlugin1.init.mockClear(); // Limpiar llamadas previas
      const result = pluginRegistry.activatePlugin("p1", mockCoreAPI);
      expect(result).toBe(true);
      expect(mockPlugin1.init).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith("Plugin ya activado: p1");
    });

    test("debe devolver false y registrar error si init falla", () => {
      mockPlugin1.init.mockImplementationOnce(() => {
        throw new Error("Init failed");
      });
      const result = pluginRegistry.activatePlugin("p1", mockCoreAPI);
      expect(result).toBe(false);
      expect(pluginRegistry.activePlugins["p1"]).toBe(false);
      expect(pluginRegistry.pluginErrors["p1"]).toBeDefined();
      expect(pluginRegistry.pluginErrors["p1"].message).toBe("Init failed");
    });

    test("debe devolver false si el plugin no está registrado", () => {
      const result = pluginRegistry.activatePlugin("nonExistent", mockCoreAPI);
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        "Intento de activar plugin no registrado: nonExistent"
      );
    });
  });

  describe("deactivatePlugin", () => {
    beforeEach(() => {
      pluginRegistry.registerPlugin(mockPlugin1);
      pluginRegistry.activatePlugin("p1", mockCoreAPI); // Asegurar que esté activo
    });

    test("debe desactivar un plugin activo y llamar a su método cleanup", () => {
      const result = pluginRegistry.deactivatePlugin("p1");
      expect(result).toBe(true);
      expect(mockPlugin1.cleanup).toHaveBeenCalled();
      expect(pluginRegistry.activePlugins["p1"]).toBe(false);
      expect(pluginRegistry.instances["p1"].initialized).toBe(false);
      expect(pluginRegistry.pluginStates["p1"].active).toBe(false);
      expect(pluginRegistry.pluginStates["p1"].lastDeactivated).toBeDefined();
      expect(console.log).toHaveBeenCalledWith("Plugin desactivado: p1");
    });

    test("debe devolver true si el plugin ya está desactivado", () => {
      pluginRegistry.deactivatePlugin("p1"); // Desactivar una vez
      mockPlugin1.cleanup.mockClear();
      const result = pluginRegistry.deactivatePlugin("p1");
      expect(result).toBe(true);
      expect(mockPlugin1.cleanup).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith("Plugin ya desactivado: p1");
    });

    test("debe desactivar y registrar error si cleanup falla", () => {
      mockPlugin1.cleanup.mockImplementationOnce(() => {
        throw new Error("Cleanup failed");
      });
      const result = pluginRegistry.deactivatePlugin("p1");
      expect(result).toBe(true); // Aún se considera desactivado
      expect(pluginRegistry.activePlugins["p1"]).toBe(false);
      expect(pluginRegistry.pluginErrors["p1"]).toBeDefined();
      expect(pluginRegistry.pluginErrors["p1"].message).toBe("Cleanup failed");
    });
  });

  describe("Query Methods", () => {
    beforeEach(() => {
      pluginRegistry.registerPlugin(mockPlugin1);
      pluginRegistry.registerPlugin(mockPlugin2);
      pluginRegistry.activatePlugin("p1", mockCoreAPI);
    });

    test("getPlugin debe devolver el plugin registrado", () => {
      expect(pluginRegistry.getPlugin("p1")).toBe(mockPlugin1);
      expect(pluginRegistry.getPlugin("nonExistent")).toBeNull();
    });

    test("isPluginActive debe devolver el estado correcto", () => {
      expect(pluginRegistry.isPluginActive("p1")).toBe(true);
      expect(pluginRegistry.isPluginActive("p2")).toBe(false); // p2 no fue activado
      expect(pluginRegistry.isPluginActive("nonExistent")).toBe(false);
    });

    test("getAllPlugins debe devolver todos los plugins registrados", () => {
      const all = pluginRegistry.getAllPlugins();
      expect(all.length).toBe(2);
      expect(all).toContain(mockPlugin1);
      expect(all).toContain(mockPlugin2);
    });

    test("getActivePlugins debe devolver solo los plugins activos", () => {
      const active = pluginRegistry.getActivePlugins();
      expect(active.length).toBe(1);
      expect(active[0]).toBe(mockPlugin1);
    });

    test("getPluginDependencies debe devolver las dependencias", () => {
      expect(pluginRegistry.getPluginDependencies("p2")).toEqual([
        { id: "p1" },
      ]);
      expect(pluginRegistry.getPluginDependencies("p1")).toEqual([]);
    });

    test("getPluginState y getPluginStates deben devolver la información de estado", () => {
      expect(pluginRegistry.getPluginState("p1").active).toBe(true);
      const states = pluginRegistry.getPluginStates();
      expect(states["p1"]).toBeDefined();
      expect(states["p2"]).toBeDefined();
    });

    test("setPluginState y setPluginStates deben actualizar los estados", () => {
      pluginRegistry.setPluginState("p1", { customData: "test" });
      expect(pluginRegistry.getPluginState("p1").customData).toBe("test");
      expect(pluginRegistry.getPluginState("p1").lastUpdated).toBeDefined();

      const newStates = {
        p1: { active: false },
        pNonExistent: { registered: Date.now() },
      };
      pluginRegistry.setPluginStates(newStates);
      expect(pluginRegistry.getPluginState("p1").active).toBe(false);
      expect(
        pluginRegistry.getPluginState("pNonExistent").registered
      ).toBeDefined();
    });

    test("getPluginError y getPluginErrors deben devolver la información de errores", () => {
      pluginRegistry.pluginErrors["p1"] = { message: "Error for p1" };
      expect(pluginRegistry.getPluginError("p1").message).toBe("Error for p1");
      const errors = pluginRegistry.getPluginErrors();
      expect(errors["p1"]).toBeDefined();
    });
  });

  describe("clear", () => {
    test("debe limpiar todos los registros y desactivar plugins activos", () => {
      pluginRegistry.registerPlugin(mockPlugin1);
      pluginRegistry.activatePlugin("p1", mockCoreAPI);
      pluginRegistry.clear();

      expect(mockPlugin1.cleanup).toHaveBeenCalled();
      expect(pluginRegistry.plugins).toEqual({});
      expect(pluginRegistry.activePlugins).toEqual({});
      // pluginStates no se limpia, se mantiene por historial
      expect(pluginRegistry.pluginErrors).toEqual({});
    });
  });
});
