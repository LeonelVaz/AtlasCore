/**
 * @jest-environment jsdom
 */
import pluginEventsModule from "../../../../../src/core/plugins/plugin-events";

// Mockear dependencias
jest.mock("../../../../../src/core/bus/event-bus", () => ({
  publish: jest.fn(),
  subscribe: jest.fn((eventName, callback) => {
    // Guardar la callback para poder simular su llamada
    // y devolver una función de desuscripción mockeada
    const mockUnsubscribe = jest.fn();
    if (!global.mockEventBusSubscriptions)
      global.mockEventBusSubscriptions = {};
    if (!global.mockEventBusSubscriptions[eventName])
      global.mockEventBusSubscriptions[eventName] = [];
    global.mockEventBusSubscriptions[eventName].push({
      callback,
      unsubscribe: mockUnsubscribe,
    });
    return mockUnsubscribe;
  }),
}));

// Importar el módulo mockeado para acceder a sus funciones jest.fn()
const eventBus = require("../../../../../src/core/bus/event-bus");

// pluginEvents es un singleton, exporta la instancia
const pluginEvents = pluginEventsModule;

describe("PluginEvents", () => {
  let originalConsoleError;

  beforeEach(() => {
    jest.clearAllMocks();
    // Resetear estado interno del singleton pluginEvents
    pluginEvents.pluginSubscriptions = {};
    pluginEvents.lastSubscriptionId = 0;
    pluginEvents.listeningEvents = new Set();
    if (global.mockEventBusSubscriptions) {
      global.mockEventBusSubscriptions = {};
    }
    originalConsoleError = console.error;
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe("subscribe", () => {
    test("debe suscribirse a un evento y registrar la suscripción", () => {
      const callback = jest.fn();
      const unsubscribe = pluginEvents.subscribe(
        "pluginA",
        "testEvent",
        callback
      );

      expect(eventBus.subscribe).toHaveBeenCalledWith(
        "plugin.testEvent",
        expect.any(Function)
      );
      expect(pluginEvents.pluginSubscriptions["pluginA"]).toBeDefined();
      const subId = Object.keys(pluginEvents.pluginSubscriptions["pluginA"])[0];
      expect(pluginEvents.pluginSubscriptions["pluginA"][subId].eventName).toBe(
        "testEvent"
      );
      expect(unsubscribe).toBeInstanceOf(Function);
      expect(pluginEvents.listeningEvents.has("testEvent")).toBe(true);
    });

    test("debe llamar al callback del plugin cuando eventBus publica un evento", () => {
      const callback = jest.fn();
      pluginEvents.subscribe("pluginA", "testEvent", callback);

      // Simular que eventBus llama al wrapper
      const eventBusCallbackWrapper = eventBus.subscribe.mock.calls[0][1];
      eventBusCallbackWrapper({
        sourcePlugin: "pluginB",
        data: { message: "hello" },
      });

      expect(callback).toHaveBeenCalledWith({ message: "hello" }, "pluginB");
    });

    test("debe manejar errores en el callback y publicar en pluginSystem.eventHandlerError", () => {
      const faultyCallback = jest.fn(() => {
        throw new Error("Callback error");
      });
      pluginEvents.subscribe("pluginA", "errorEvent", faultyCallback);

      const eventBusCallbackWrapper = eventBus.subscribe.mock.calls[0][1];
      eventBusCallbackWrapper({ sourcePlugin: "pluginB", data: {} });

      expect(faultyCallback).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        "Error en callback de plugin pluginA para evento errorEvent:",
        expect.any(Error)
      );
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.eventHandlerError",
        {
          pluginId: "pluginA",
          eventName: "errorEvent",
          error: "Callback error",
        }
      );
    });

    test("debe devolver una función de desuscripción que llama a unsubscribe del módulo", () => {
      const callback = jest.fn();
      const unsubscribeFn = pluginEvents.subscribe(
        "pluginA",
        "testEvent",
        callback
      );
      const subId = Object.keys(pluginEvents.pluginSubscriptions["pluginA"])[0];

      jest.spyOn(pluginEvents, "unsubscribe");
      unsubscribeFn();
      expect(pluginEvents.unsubscribe).toHaveBeenCalledWith(
        "pluginA",
        parseInt(subId, 10)
      );
    });

    test("debe loguear error y devolver función vacía si los argumentos son inválidos", () => {
      const unsub = pluginEvents.subscribe(null, "test", () => {});
      expect(console.error).toHaveBeenCalledWith(
        "Argumentos inválidos para subscribe"
      );
      expect(unsub).toBeInstanceOf(Function);
      unsub(); // No debería fallar
    });
  });

  describe("unsubscribe", () => {
    test("debe eliminar una suscripción y llamar a la función de desuscripción de eventBus", () => {
      const callback = jest.fn();
      pluginEvents.subscribe("pluginA", "testEvent", callback);
      const subId = Object.keys(pluginEvents.pluginSubscriptions["pluginA"])[0];
      const mockEventBusUnsubscribe =
        global.mockEventBusSubscriptions["plugin.testEvent"][0].unsubscribe;

      const result = pluginEvents.unsubscribe("pluginA", parseInt(subId, 10));
      expect(result).toBe(true);
      // CORRECCIÓN AQUÍ:
      expect(pluginEvents.pluginSubscriptions["pluginA"]).toBeUndefined();
      expect(mockEventBusUnsubscribe).toHaveBeenCalled();
    });

    test("debe devolver false si la suscripción o plugin no existen", () => {
      expect(pluginEvents.unsubscribe("nonExistentPlugin", 1)).toBe(false);
      pluginEvents.subscribe("pluginA", "test", () => {});
      expect(pluginEvents.unsubscribe("pluginA", 999)).toBe(false); // ID de suscripción no existe
    });
  });

  describe("publish", () => {
    test("debe publicar un evento en eventBus con el prefijo y sourcePlugin", () => {
      pluginEvents.listeningEvents.add("myCustomEvent"); // Simular que alguien escucha
      pluginEvents.publish("pluginA", "myCustomEvent", { detail: "info" });
      expect(eventBus.publish).toHaveBeenCalledWith("plugin.myCustomEvent", {
        sourcePlugin: "pluginA",
        data: { detail: "info" },
      });
      // No debería publicar en '*' porque 'myCustomEvent' está en listeningEvents
      expect(eventBus.publish).not.toHaveBeenCalledWith(
        "plugin.*",
        expect.anything()
      );
    });

    test('debe publicar en "plugin.*" si el evento específico no está en listeningEvents', () => {
      pluginEvents.publish("pluginB", "unheardEvent", { data: "payload" });
      expect(eventBus.publish).toHaveBeenCalledWith("plugin.unheardEvent", {
        sourcePlugin: "pluginB",
        data: { data: "payload" },
      });
      expect(eventBus.publish).toHaveBeenCalledWith("plugin.*", {
        sourcePlugin: "pluginB",
        eventName: "unheardEvent",
        data: { data: "payload" },
      });
    });

    test("debe devolver false y loguear error si los argumentos son inválidos", () => {
      const result = pluginEvents.publish(null, "testEvent", {});
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        "Argumentos inválidos para publish"
      );
    });
  });

  describe("unsubscribeAll", () => {
    test("debe eliminar todas las suscripciones de un plugin", () => {
      pluginEvents.subscribe("pluginA", "event1", () => {});
      pluginEvents.subscribe("pluginA", "event2", () => {});
      const mockUnsub1 =
        global.mockEventBusSubscriptions["plugin.event1"][0].unsubscribe;
      const mockUnsub2 =
        global.mockEventBusSubscriptions["plugin.event2"][0].unsubscribe;

      const result = pluginEvents.unsubscribeAll("pluginA");
      expect(result).toBe(true);
      expect(pluginEvents.pluginSubscriptions["pluginA"]).toBeUndefined();
      expect(mockUnsub1).toHaveBeenCalled();
      expect(mockUnsub2).toHaveBeenCalled();
    });

    test("debe devolver false si el plugin no tiene suscripciones", () => {
      expect(pluginEvents.unsubscribeAll("nonExistentPlugin")).toBe(false);
    });
  });

  describe("getPluginSubscriptions", () => {
    test("debe devolver una lista de suscripciones para un plugin", () => {
      pluginEvents.subscribe("pluginA", "event1", () => {});
      pluginEvents.subscribe("pluginA", "event2", () => {});
      const subs = pluginEvents.getPluginSubscriptions("pluginA");
      expect(subs.length).toBe(2);
      expect(subs).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ eventName: "event1" }),
          expect.objectContaining({ eventName: "event2" }),
        ])
      );
    });

    test("debe devolver un array vacío si el plugin no existe o no tiene suscripciones", () => {
      expect(pluginEvents.getPluginSubscriptions("nonExistentPlugin")).toEqual(
        []
      );
    });
  });

  describe("getStats", () => {
    test("debe devolver estadísticas correctas sobre las suscripciones", () => {
      pluginEvents.subscribe("pluginA", "eventA1", () => {});
      pluginEvents.subscribe("pluginA", "eventA2", () => {});
      pluginEvents.subscribe("pluginB", "eventB1", () => {});

      const stats = pluginEvents.getStats();
      expect(stats.totalPlugins).toBe(2);
      expect(stats.totalSubscriptions).toBe(3);
      expect(stats.eventsWithListeners).toEqual(
        expect.arrayContaining(["eventA1", "eventA2", "eventB1"])
      );
      expect(stats.subscriptionsByPlugin).toEqual({
        pluginA: 2,
        pluginB: 1,
      });
    });
  });
});
