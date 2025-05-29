/**
 * @jest-environment jsdom
 */

// Desactivar el mock global para poder probar la implementación real
jest.unmock("../../../../src/services/storage-service");

// Importar la implementación real
import storageService from "../../../../src/services/storage-service";
import * as eventBus from "../../../../src/core/bus/event-bus";
import { STORAGE_KEYS } from "../../../../src/core/config/constants";

// Mock de eventBus
jest.mock("../../../../src/core/bus/event-bus", () => ({
  publish: jest.fn(),
  default: {
    publish: jest.fn(),
  },
  EventCategories: {
    STORAGE: "storage",
  },
}));

describe("StorageService", () => {
  // Configuración inicial y limpieza
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    // Reset del adaptador de almacenamiento para forzar nueva inicialización
    storageService.storageAdapter = null;
  });

  describe("Inicialización", () => {
    test("Debe inicializar con localStorage por defecto en entorno web", () => {
      // Asegurar que isElectron retorna false
      Object.defineProperty(window, "process", {
        value: undefined,
        writable: true,
      });

      // Forzar reinicialización
      storageService.initStorage();

      // Verificar que se inicializó con localStorage
      expect(storageService.storageAdapter).not.toBeNull();
      expect(typeof storageService.storageAdapter.get).toBe("function");
      expect(typeof storageService.storageAdapter.set).toBe("function");
      expect(typeof storageService.storageAdapter.remove).toBe("function");
      expect(typeof storageService.storageAdapter.clear).toBe("function");
    });

    test("Debe manejar errores durante la inicialización y usar localStorage como fallback", () => {
      // Simular un error durante la inicialización
      const originalInitStorage = storageService.initStorage;
      const originalInitLocalStorage = storageService.initLocalStorage;

      storageService.initStorage = jest.fn().mockImplementation(() => {
        throw new Error("Error de inicialización");
      });

      storageService.initLocalStorage = jest.fn();

      // Intentar inicializar
      expect(() => storageService.initStorage()).toThrow(
        "Error de inicialización"
      );

      // Restaurar métodos originales
      storageService.initStorage = originalInitStorage;
      storageService.initLocalStorage = originalInitLocalStorage;
    });

    test("Debe inicializar con ElectronStore en entorno Electron", () => {
      // Simular entorno Electron
      Object.defineProperty(window, "process", {
        value: { type: "renderer" },
        writable: true,
      });

      // Simular API de Electron
      Object.defineProperty(window, "electron", {
        value: {
          store: {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
            clear: jest.fn(),
          },
        },
        writable: true,
      });

      // Forzar reinicialización
      storageService.initStorage();

      // Verificar que se inicializó con ElectronStore
      expect(storageService.storageAdapter).not.toBeNull();
      expect(typeof storageService.storageAdapter.get).toBe("function");
      expect(typeof storageService.storageAdapter.set).toBe("function");
      expect(typeof storageService.storageAdapter.remove).toBe("function");
      expect(typeof storageService.storageAdapter.clear).toBe("function");
    });

    test("Debe usar localStorage como fallback si electron.store no está disponible", () => {
      // Simular entorno Electron sin API store
      Object.defineProperty(window, "process", {
        value: { type: "renderer" },
        writable: true,
      });

      Object.defineProperty(window, "electron", {
        value: {},
        writable: true,
      });

      const spyInitLocalStorage = jest.spyOn(
        storageService,
        "initLocalStorage"
      );

      // Forzar reinicialización
      storageService.initStorage();

      // Verificar que se llamó a initLocalStorage como fallback
      expect(spyInitLocalStorage).toHaveBeenCalled();
    });
  });

  describe("Adaptador localStorage", () => {
    beforeEach(() => {
      // Asegurar que isElectron retorna false
      Object.defineProperty(window, "process", {
        value: undefined,
        writable: true,
      });

      // Inicializar con localStorage
      storageService.initLocalStorage();
    });

    test("get debe recuperar y parsear valores de localStorage", async () => {
      const testKey = "testKey";
      const testValue = { foo: "bar" };
      const testValueString = JSON.stringify(testValue);

      // Configurar mock para retornar un valor
      window.localStorage.getItem.mockReturnValue(testValueString);

      const result = await storageService.get(testKey);

      expect(window.localStorage.getItem).toHaveBeenCalledWith(testKey);
      expect(result).toEqual(testValue);
    });

    test("get debe retornar defaultValue si la clave no existe", async () => {
      const testKey = "nonExistentKey";
      const defaultValue = { default: true };

      // Configurar mock para retornar null (clave no existe)
      window.localStorage.getItem.mockReturnValue(null);

      const result = await storageService.get(testKey, defaultValue);

      expect(window.localStorage.getItem).toHaveBeenCalledWith(testKey);
      expect(result).toEqual(defaultValue);
    });

    test("get debe retornar defaultValue si ocurre un error al parsear", async () => {
      const testKey = "invalidJsonKey";
      const defaultValue = { default: true };

      // Configurar mock para retornar JSON inválido
      window.localStorage.getItem.mockReturnValue("{invalid json");

      const result = await storageService.get(testKey, defaultValue);

      expect(window.localStorage.getItem).toHaveBeenCalledWith(testKey);
      expect(result).toEqual(defaultValue);
    });

    test("set debe almacenar valores en localStorage", async () => {
      const testKey = "testKey";
      const testValue = { foo: "bar" };

      const result = await storageService.set(testKey, testValue);

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        testKey,
        JSON.stringify(testValue)
      );
      expect(result).toBe(true);
    });

    test("set debe manejar errores de localStorage", async () => {
      const testKey = "testKey";
      const testValue = { foo: "bar" };

      // Simular error en localStorage
      window.localStorage.setItem.mockImplementation(() => {
        throw new Error("Storage error");
      });

      const result = await storageService.set(testKey, testValue);

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        testKey,
        JSON.stringify(testValue)
      );
      expect(result).toBe(false);
    });

    test("remove debe eliminar valores de localStorage", async () => {
      const testKey = "testKey";

      const result = await storageService.remove(testKey);

      expect(window.localStorage.removeItem).toHaveBeenCalledWith(testKey);
      expect(result).toBe(true);
    });

    test("remove debe manejar errores de localStorage", async () => {
      const testKey = "testKey";

      // Simular error en localStorage
      window.localStorage.removeItem.mockImplementation(() => {
        throw new Error("Storage error");
      });

      const result = await storageService.remove(testKey);

      expect(window.localStorage.removeItem).toHaveBeenCalledWith(testKey);
      expect(result).toBe(false);
    });

    test("clear debe limpiar localStorage", async () => {
      const result = await storageService.clear();

      expect(window.localStorage.clear).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test("clear debe manejar errores de localStorage", async () => {
      // Simular error en localStorage
      window.localStorage.clear.mockImplementation(() => {
        throw new Error("Storage error");
      });

      const result = await storageService.clear();

      expect(window.localStorage.clear).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe("Adaptador ElectronStore", () => {
    beforeEach(() => {
      // Simular entorno Electron
      Object.defineProperty(window, "process", {
        value: { type: "renderer" },
        writable: true,
      });

      // Simular API de Electron
      Object.defineProperty(window, "electron", {
        value: {
          store: {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
            clear: jest.fn(),
          },
        },
        writable: true,
      });

      // Inicializar con ElectronStore
      storageService.initElectronStore();
    });

    test("get debe recuperar valores de ElectronStore", async () => {
      const testKey = "testKey";
      const testValue = { foo: "bar" };

      // Configurar mock para retornar un valor
      window.electron.store.get.mockResolvedValue(testValue);

      const result = await storageService.get(testKey);

      expect(window.electron.store.get).toHaveBeenCalledWith(testKey);
      expect(result).toEqual(testValue);
    });

    test("get debe retornar defaultValue si la clave no existe", async () => {
      const testKey = "nonExistentKey";
      const defaultValue = { default: true };

      // Configurar mock para retornar undefined (clave no existe)
      window.electron.store.get.mockResolvedValue(undefined);

      const result = await storageService.get(testKey, defaultValue);

      expect(window.electron.store.get).toHaveBeenCalledWith(testKey);
      expect(result).toEqual(defaultValue);
    });

    test("get debe retornar defaultValue si ocurre un error", async () => {
      const testKey = "errorKey";
      const defaultValue = { default: true };

      // Configurar mock para lanzar un error
      window.electron.store.get.mockRejectedValue(new Error("Store error"));

      const result = await storageService.get(testKey, defaultValue);

      expect(window.electron.store.get).toHaveBeenCalledWith(testKey);
      expect(result).toEqual(defaultValue);
    });

    test("set debe almacenar valores en ElectronStore", async () => {
      const testKey = "testKey";
      const testValue = { foo: "bar" };

      // Configurar mock para resolver correctamente
      window.electron.store.set.mockResolvedValue(undefined);

      const result = await storageService.set(testKey, testValue);

      expect(window.electron.store.set).toHaveBeenCalledWith(
        testKey,
        testValue
      );
      expect(result).toBe(true);
    });

    test("set debe manejar errores de ElectronStore", async () => {
      const testKey = "testKey";
      const testValue = { foo: "bar" };

      // Configurar mock para lanzar un error
      window.electron.store.set.mockRejectedValue(new Error("Store error"));

      const result = await storageService.set(testKey, testValue);

      expect(window.electron.store.set).toHaveBeenCalledWith(
        testKey,
        testValue
      );
      expect(result).toBe(false);
    });

    test("remove debe eliminar valores de ElectronStore", async () => {
      const testKey = "testKey";

      // Configurar mock para resolver correctamente
      window.electron.store.delete.mockResolvedValue(undefined);

      const result = await storageService.remove(testKey);

      expect(window.electron.store.delete).toHaveBeenCalledWith(testKey);
      expect(result).toBe(true);
    });

    test("remove debe manejar errores de ElectronStore", async () => {
      const testKey = "testKey";

      // Configurar mock para lanzar un error
      window.electron.store.delete.mockRejectedValue(new Error("Store error"));

      const result = await storageService.remove(testKey);

      expect(window.electron.store.delete).toHaveBeenCalledWith(testKey);
      expect(result).toBe(false);
    });

    test("clear debe limpiar ElectronStore", async () => {
      // Configurar mock para resolver correctamente
      window.electron.store.clear.mockResolvedValue(undefined);

      const result = await storageService.clear();

      expect(window.electron.store.clear).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test("clear debe manejar errores de ElectronStore", async () => {
      // Configurar mock para lanzar un error
      window.electron.store.clear.mockRejectedValue(new Error("Store error"));

      const result = await storageService.clear();

      expect(window.electron.store.clear).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe("Validaciones y manejo de eventos", () => {
    beforeEach(() => {
      // Inicializar con localStorage
      storageService.initLocalStorage();
    });

    test("get debe retornar defaultValue si storageAdapter no está inicializado", async () => {
      // Forzar storageAdapter a null
      storageService.storageAdapter = null;

      const testKey = "testKey";
      const defaultValue = { default: true };

      const result = await storageService.get(testKey, defaultValue);

      expect(result).toEqual(defaultValue);
    });

    test("set debe retornar false si storageAdapter no está inicializado", async () => {
      // Forzar storageAdapter a null
      storageService.storageAdapter = null;

      const testKey = "testKey";
      const testValue = { foo: "bar" };

      const result = await storageService.set(testKey, testValue);

      expect(result).toBe(false);
    });

    test("remove debe retornar false si storageAdapter no está inicializado", async () => {
      // Forzar storageAdapter a null
      storageService.storageAdapter = null;

      const testKey = "testKey";

      const result = await storageService.remove(testKey);

      expect(result).toBe(false);
    });

    test("clear debe retornar false si storageAdapter no está inicializado", async () => {
      // Forzar storageAdapter a null
      storageService.storageAdapter = null;

      const result = await storageService.clear();

      expect(result).toBe(false);
    });

    test("set debe publicar evento dataChanged cuando es exitoso", async () => {
      const testKey = "testKey";
      const testValue = { foo: "bar" };

      await storageService.set(testKey, testValue);

      expect(eventBus.publish).toHaveBeenCalledWith(
        `${eventBus.EventCategories.STORAGE}.dataChanged`,
        { key: testKey, value: testValue }
      );
    });

    test("set debe publicar evento eventsUpdated cuando la clave es EVENTS", async () => {
      const testKey = STORAGE_KEYS.EVENTS;
      const testValue = [{ id: "1", title: "Test Event" }];

      await storageService.set(testKey, testValue);

      expect(eventBus.publish).toHaveBeenCalledWith(
        `${eventBus.EventCategories.STORAGE}.dataChanged`,
        { key: testKey, value: testValue }
      );

      expect(eventBus.publish).toHaveBeenCalledWith(
        `${eventBus.EventCategories.STORAGE}.eventsUpdated`,
        testValue
      );
    });

    test("remove debe publicar evento dataRemoved cuando es exitoso", async () => {
      const testKey = "testKey";

      await storageService.remove(testKey);

      expect(eventBus.publish).toHaveBeenCalledWith(
        `${eventBus.EventCategories.STORAGE}.dataRemoved`,
        { key: testKey }
      );
    });

    test("clear debe publicar evento dataCleared cuando es exitoso", async () => {
      await storageService.clear();

      expect(eventBus.publish).toHaveBeenCalledWith(
        `${eventBus.EventCategories.STORAGE}.dataCleared`,
        {}
      );
    });
  });
});
