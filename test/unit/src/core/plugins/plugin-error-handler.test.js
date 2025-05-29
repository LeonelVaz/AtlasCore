/**
 * @jest-environment jsdom
 */
import pluginErrorHandler from "../../../../../src/core/plugins/plugin-error-handler";

// Mockear dependencia de eventBus directamente en la factory
jest.mock("../../../../../src/core/bus/event-bus", () => ({
  publish: jest.fn(), // Esta es la función mock que usaremos
}));

// Importar el módulo mockeado para acceder a sus funciones jest.fn()
const eventBus = require("../../../../../src/core/bus/event-bus");

describe("PluginErrorHandler", () => {
  let originalConsoleError;

  beforeEach(() => {
    jest.clearAllMocks();
    // pluginErrorHandler es un singleton, limpiar su estado interno
    pluginErrorHandler.handlers = [];
    pluginErrorHandler.lastId = 0;
    pluginErrorHandler.errorLog = [];
    // Restaurar maxLogSize a su valor por defecto si se modifica en algún test
    pluginErrorHandler.maxLogSize = 100;

    originalConsoleError = console.error;
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe("registerHandler and unregisterHandler", () => {
    test("debe registrar un handler y devolver un ID", () => {
      const handler = jest.fn();
      const id = pluginErrorHandler.registerHandler(handler);
      expect(typeof id).toBe("number");
      expect(pluginErrorHandler.handlers.length).toBe(1);
      expect(pluginErrorHandler.handlers[0].handler).toBe(handler);
    });

    test("debe lanzar error si el handler no es una función", () => {
      expect(() =>
        pluginErrorHandler.registerHandler("not a function")
      ).toThrow("El handler debe ser una función");
    });

    test("debe desregistrar un handler usando su ID", () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const id1 = pluginErrorHandler.registerHandler(handler1);
      pluginErrorHandler.registerHandler(handler2);

      expect(pluginErrorHandler.handlers.length).toBe(2);
      const result = pluginErrorHandler.unregisterHandler(id1);
      expect(result).toBe(true);
      expect(pluginErrorHandler.handlers.length).toBe(1);
      expect(pluginErrorHandler.handlers[0].handler).toBe(handler2);
    });

    test("unregisterHandler debe devolver false si el ID no existe", () => {
      const result = pluginErrorHandler.unregisterHandler(999);
      expect(result).toBe(false);
    });
  });

  describe("handleError", () => {
    test("debe formatear el error, añadirlo al log, notificar a handlers y publicar en eventBus", () => {
      const mockHandler1 = jest.fn();
      const mockHandler2 = jest.fn();
      pluginErrorHandler.registerHandler(mockHandler1);
      pluginErrorHandler.registerHandler(mockHandler2);

      const error = new Error("Something went wrong");
      const pluginId = "testPlugin";
      const operation = "testOperation";
      const metadata = { custom: "data" };

      const errorInfo = pluginErrorHandler.handleError(
        pluginId,
        operation,
        error,
        metadata
      );

      expect(errorInfo.id).toMatch(/^err_\d+_[a-z0-9]+$/);
      expect(errorInfo.pluginId).toBe(pluginId);
      expect(errorInfo.operation).toBe(operation);
      expect(errorInfo.message).toBe("Something went wrong");
      expect(errorInfo.stack).toBe(error.stack);

      // CORRECCIÓN AQUÍ:
      expect(typeof errorInfo.timestamp).toBe("number"); // Verificar que es un primitivo de tipo número
      expect(errorInfo.timestamp).toBeGreaterThan(0); // Una verificación adicional de que es un timestamp válido

      expect(errorInfo.metadata).toEqual(metadata);

      expect(pluginErrorHandler.errorLog[0]).toBe(errorInfo);
      expect(mockHandler1).toHaveBeenCalledWith(errorInfo);
      expect(mockHandler2).toHaveBeenCalledWith(errorInfo);
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.error",
        errorInfo
      );
    });

    test("handleError debe funcionar si error no es una instancia de Error", () => {
      const errorString = "Just a string error";
      const errorInfo = pluginErrorHandler.handleError(
        "p1",
        "op1",
        errorString
      );
      expect(errorInfo.message).toBe(errorString);
      expect(errorInfo.stack).toBeNull();
    });

    test("debe limitar el tamaño del errorLog", () => {
      pluginErrorHandler.maxLogSize = 2;
      pluginErrorHandler.handleError("p1", "op1", new Error("e1"));
      pluginErrorHandler.handleError("p2", "op2", new Error("e2"));
      pluginErrorHandler.handleError("p3", "op3", new Error("e3"));
      expect(pluginErrorHandler.errorLog.length).toBe(2);
      expect(pluginErrorHandler.errorLog[0].message).toBe("e3");
      expect(pluginErrorHandler.errorLog[1].message).toBe("e2");
      // pluginErrorHandler.maxLogSize = 100; // Se restaura en el beforeEach
    });

    test("debe manejar errores dentro de los handlers de error", () => {
      const faultyHandler = jest.fn(() => {
        throw new Error("Handler failed");
      });
      pluginErrorHandler.registerHandler(faultyHandler);
      pluginErrorHandler.handleError("p1", "op1", new Error("e1"));
      // console.error es mockeado, así que verificamos que fue llamado
      expect(console.error).toHaveBeenCalledWith(
        "Error en handler de errores de plugin:",
        expect.any(Error)
      );
    });
  });

  describe("Log Management", () => {
    test("getErrorLog debe devolver el log de errores", () => {
      pluginErrorHandler.handleError("p1", "op1", new Error("e1"));
      pluginErrorHandler.handleError("p2", "op2", new Error("e2"));
      const log = pluginErrorHandler.getErrorLog();
      expect(log.length).toBe(2);
      expect(log[0].message).toBe("e2");
    });

    test("clearErrorLog debe vaciar el log", () => {
      pluginErrorHandler.handleError("p1", "op1", new Error("e1"));
      pluginErrorHandler.clearErrorLog();
      expect(pluginErrorHandler.getErrorLog().length).toBe(0);
    });

    test("getPluginErrors debe devolver errores para un plugin específico", () => {
      pluginErrorHandler.handleError("p1", "op1", new Error("e1-1"));
      pluginErrorHandler.handleError("p2", "op2", new Error("e2-1"));
      pluginErrorHandler.handleError("p1", "op3", new Error("e1-2"));
      const p1Errors = pluginErrorHandler.getPluginErrors("p1");
      expect(p1Errors.length).toBe(2);
      expect(p1Errors[0].message).toBe("e1-2");
      expect(p1Errors[1].message).toBe("e1-1");
      expect(pluginErrorHandler.getPluginErrors("nonExistent").length).toBe(0);
    });
  });
});
