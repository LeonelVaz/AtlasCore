/**
 * @jest-environment jsdom
 */

// Importar las funciones del módulo para que se ejecuten en el scope del test
// y para poder llamarlas directamente si es necesario (aunque operan sobre window).
import {
  registerModule,
  getModule,
  isModuleRegistered,
  unregisterModule,
} from "../../../../../src/core/modules/module-registry.js";

describe("Module Registry (module-registry.js)", () => {
  let originalConsoleError;

  beforeEach(() => {
    // Asegurar que window.__appModules esté limpio para cada test
    window.__appModules = {};
    originalConsoleError = console.error;
    console.error = jest.fn(); // Mockear console.error para verificar llamadas
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  // El script ya establece window.__appModules al importarse si no existe.
  // Este test verifica esa inicialización implícita.
  test("debe inicializar window.__appModules si no existe", () => {
    // Simular que no existe y re-importar (o confiar en la primera importación)
    // Para este test, verificamos el estado después de la importación inicial del suite.
    expect(window.__appModules).toBeDefined();
    expect(typeof window.__appModules).toBe("object");
  });

  describe("registerModule", () => {
    test("debe registrar un nuevo módulo correctamente", () => {
      const moduleName = "testModule";
      const moduleApi = { foo: "bar" };
      const result = registerModule(moduleName, moduleApi);

      expect(result).toBe(true);
      expect(window.__appModules[moduleName]).toBe(moduleApi);
    });

    test("debe sobrescribir un módulo existente si se registra con el mismo nombre", () => {
      const moduleName = "testModule";
      const первоначальныйApi = { version: 1 };
      const новыйApi = { version: 2 };

      registerModule(moduleName, первоначальныйApi);
      const result = registerModule(moduleName, новыйApi);

      expect(result).toBe(true);
      expect(window.__appModules[moduleName]).toBe(новыйApi);
    });

    // Nota: El script original no previene la sobrescritura, lo cual podría ser un test a considerar
    // si el comportamiento deseado fuera no sobrescribir.
  });

  describe("getModule", () => {
    test("debe devolver la API de un módulo registrado", () => {
      const moduleName = "testModule";
      const moduleApi = { getData: () => "data" };
      window.__appModules[moduleName] = moduleApi;

      const retrievedApi = getModule(moduleName);
      expect(retrievedApi).toBe(moduleApi);
    });

    test("debe devolver null si el módulo no está registrado", () => {
      const retrievedApi = getModule("nonExistentModule");
      expect(retrievedApi).toBeNull();
    });

    test("debe devolver null si window no está definido (simulación)", () => {
      const originalWindow = global.window;
      delete global.window; // Simular entorno sin window
      const retrievedApi = getModule("anyModule");
      expect(retrievedApi).toBeNull();
      global.window = originalWindow; // Restaurar
    });
  });

  describe("isModuleRegistered", () => {
    test("debe devolver true si el módulo está registrado", () => {
      const moduleName = "testModule";
      window.__appModules[moduleName] = { api: {} };
      expect(isModuleRegistered(moduleName)).toBe(true);
    });

    test("debe devolver false si el módulo no está registrado", () => {
      expect(isModuleRegistered("nonExistentModule")).toBe(false);
    });

    test("debe devolver false si window no está definido (simulación)", () => {
      const originalWindow = global.window;
      delete global.window;
      expect(isModuleRegistered("anyModule")).toBe(false);
      global.window = originalWindow;
    });
  });

  describe("unregisterModule", () => {
    test("debe eliminar un módulo registrado y devolver true", () => {
      const moduleName = "testModule";
      window.__appModules[moduleName] = { api: {} };
      const result = unregisterModule(moduleName);

      expect(result).toBe(true);
      expect(window.__appModules[moduleName]).toBeUndefined();
      expect(isModuleRegistered(moduleName)).toBe(false);
    });

    test("debe devolver false si el módulo no existe", () => {
      const result = unregisterModule("nonExistentModule");
      expect(result).toBe(false);
    });

    test("debe devolver false si window no está definido (simulación)", () => {
      const originalWindow = global.window;
      delete global.window;
      const result = unregisterModule("anyModule");
      expect(result).toBe(false);
      global.window = originalWindow;
    });
  });

  // Tests para el caso donde window no está definido para registerModule
  describe("registerModule sin window", () => {
    let originalWindow;
    beforeEach(() => {
      originalWindow = global.window;
      delete global.window; // Simular entorno sin window
    });
    afterEach(() => {
      global.window = originalWindow; // Restaurar window
    });

    test("registerModule debe devolver false y loguear error si window no está definido", () => {
      const moduleName = "testModule";
      const moduleApi = { foo: "bar" };
      const result = registerModule(moduleName, moduleApi);
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        "No se puede registrar el módulo fuera del entorno del navegador"
      );
    });
  });
});
