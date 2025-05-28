/**
 * @jest-environment jsdom
 */

import pluginCommunicationModuleInstance from "../../../../../src/core/plugins/plugin-communication";

// Mockear dependencias
jest.mock("../../../../../src/core/bus/event-bus", () => ({
  publish: jest.fn(),
}));
jest.mock("../../../../../src/core/plugins/plugin-registry", () => ({
  getPlugin: jest.fn(),
  isPluginActive: jest.fn(),
  getAllPlugins: jest.fn(() => []),
}));
jest.mock("../../../../../src/core/plugins/plugin-api-registry", () => ({
  callPluginMethod: jest.fn(),
}));
jest.mock("../../../../../src/core/plugins/plugin-compatibility", () => ({
  getConflictInfo: jest.fn(),
}));
jest.mock("../../../../../src/core/plugins/plugin-error-handler", () => ({
  handleError: jest.fn(),
}));

const eventBus = require("../../../../../src/core/bus/event-bus");
const pluginRegistry = require("../../../../../src/core/plugins/plugin-registry");
const pluginAPIRegistry = require("../../../../../src/core/plugins/plugin-api-registry");
const pluginCompatibility = require("../../../../../src/core/plugins/plugin-compatibility");
const pluginErrorHandler = require("../../../../../src/core/plugins/plugin-error-handler");

const pluginCommunication = pluginCommunicationModuleInstance;

describe("PluginCommunication", () => {
  let originalConsoleError;
  let originalConsoleWarn; // Para getChannel si se descomentan los logs
  const CALLER_ID = "callerP";
  const TARGET_ID = "targetP";
  const METHOD_NAME = "methodX";
  const CHANNEL_NAME = "testChannel";
  const PLUGIN_A = "pluginA";
  const PLUGIN_B = "pluginB";
  const PLUGIN_C = "pluginC";

  beforeEach(() => {
    jest.clearAllMocks();

    pluginCommunication.communicationHistory = {};
    pluginCommunication.lastCommunicationId = 0;
    pluginCommunication.channels = {};
    // Reseteamos el maxHistorySize a un valor manejable para los tests si es necesario
    pluginCommunication.maxHistorySize = 3; // Ajustado para tests de historial

    pluginRegistry.isPluginActive.mockReturnValue(true);
    pluginCompatibility.getConflictInfo.mockReturnValue(null);
    pluginAPIRegistry.callPluginMethod.mockResolvedValue("mockApiResult");

    originalConsoleError = console.error;
    console.error = jest.fn();
    originalConsoleWarn = console.warn;
    console.warn = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  describe("callPluginMethod", () => {
    test("debe llamar a pluginAPIRegistry.callPluginMethod si todo es válido", async () => {
      const result = await pluginCommunication.callPluginMethod(
        CALLER_ID,
        TARGET_ID,
        METHOD_NAME,
        ["arg1"]
      );
      expect(result).toBe("mockApiResult");
      expect(pluginAPIRegistry.callPluginMethod).toHaveBeenCalledWith(
        CALLER_ID,
        TARGET_ID,
        METHOD_NAME,
        ["arg1"]
      );
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.communication",
        expect.objectContaining({ success: true })
      );
      const history = pluginCommunication.getCommunicationHistory(CALLER_ID);
      expect(history[0]).toMatchObject({
        callerPluginId: CALLER_ID,
        targetPluginId: TARGET_ID,
        methodName: METHOD_NAME,
        status: "success",
      });
      expect(
        pluginCommunication.getCommunicationHistory(TARGET_ID)[0]
      ).toMatchObject({
        callerPluginId: CALLER_ID,
        targetPluginId: TARGET_ID,
        methodName: METHOD_NAME,
        status: "success",
      });
    });

    test("debe lanzar error si faltan argumentos requeridos", async () => {
      await expect(
        pluginCommunication.callPluginMethod(null, TARGET_ID, METHOD_NAME)
      ).rejects.toThrow("Argumentos inválidos para callPluginMethod");
      await expect(
        pluginCommunication.callPluginMethod(CALLER_ID, null, METHOD_NAME)
      ).rejects.toThrow("Argumentos inválidos para callPluginMethod");
      await expect(
        pluginCommunication.callPluginMethod(CALLER_ID, TARGET_ID, null)
      ).rejects.toThrow("Argumentos inválidos para callPluginMethod");
    });

    test("debe lanzar error si el plugin llamador no está activo", async () => {
      pluginRegistry.isPluginActive.mockImplementation(
        (id) => id !== CALLER_ID
      );
      await expect(
        pluginCommunication.callPluginMethod(CALLER_ID, TARGET_ID, METHOD_NAME)
      ).rejects.toThrow(`Plugin llamador no está activo: ${CALLER_ID}`);
      expect(pluginErrorHandler.handleError).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.communication",
        expect.objectContaining({
          success: false,
          error: `Plugin llamador no está activo: ${CALLER_ID}`,
        })
      );
    });

    test("debe lanzar error si el plugin objetivo no está activo", async () => {
      pluginRegistry.isPluginActive.mockImplementation(
        (id) => id !== TARGET_ID
      );
      await expect(
        pluginCommunication.callPluginMethod(CALLER_ID, TARGET_ID, METHOD_NAME)
      ).rejects.toThrow(`Plugin objetivo no está activo: ${TARGET_ID}`);
      expect(pluginErrorHandler.handleError).toHaveBeenCalled();
    });

    test("debe lanzar error si hay incompatibilidad (conflicto declarado por llamador, tipo string)", async () => {
      pluginCompatibility.getConflictInfo.mockImplementation((id) => {
        if (id === CALLER_ID) return { declared: [TARGET_ID] }; // Conflicto como string
        return null;
      });
      await expect(
        pluginCommunication.callPluginMethod(CALLER_ID, TARGET_ID, METHOD_NAME)
      ).rejects.toThrow(
        `Plugins incompatibles: ${CALLER_ID} declara conflicto con ${TARGET_ID}`
      );
    });

    test("debe lanzar error si hay incompatibilidad (conflicto declarado por objetivo, tipo objeto)", async () => {
      pluginCompatibility.getConflictInfo.mockImplementation((id) => {
        if (id === TARGET_ID)
          return {
            declared: [{ id: CALLER_ID, reason: "Custom conflict reason" }],
          };
        return null;
      });
      await expect(
        pluginCommunication.callPluginMethod(CALLER_ID, TARGET_ID, METHOD_NAME)
      ).rejects.toThrow("Plugins incompatibles: Custom conflict reason");
    });

    test("debe manejar error al verificar compatibilidad y retornar incompatible", async () => {
      pluginCompatibility.getConflictInfo.mockImplementation(() => {
        throw new Error("Simulated DB error for compatibility");
      });
      await expect(
        pluginCommunication.callPluginMethod(CALLER_ID, TARGET_ID, METHOD_NAME)
      ).rejects.toThrow(
        "Plugins incompatibles: Error al verificar compatibilidad: Simulated DB error for compatibility"
      );
      expect(console.error).toHaveBeenCalledWith(
        "Error al verificar compatibilidad entre plugins:",
        expect.any(Error)
      );
    });

    test("debe lanzar error si pluginAPIRegistry.callPluginMethod falla", async () => {
      const apiError = new Error("API call failed");
      pluginAPIRegistry.callPluginMethod.mockRejectedValueOnce(apiError);
      await expect(
        pluginCommunication.callPluginMethod(CALLER_ID, TARGET_ID, METHOD_NAME)
      ).rejects.toThrow("API call failed");
      expect(pluginErrorHandler.handleError).toHaveBeenCalledWith(
        CALLER_ID,
        "pluginCommunication",
        apiError,
        { target: TARGET_ID, method: METHOD_NAME }
      );
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.communication",
        expect.objectContaining({ success: false, error: "API call failed" })
      );
    });

    test("_registerCommunication debe manejar el tamaño máximo del historial", () => {
      pluginCommunication.maxHistorySize = 2; // Para este test
      pluginCommunication._registerCommunication(
        CALLER_ID,
        TARGET_ID,
        "method1"
      );
      pluginCommunication._registerCommunication(
        CALLER_ID,
        TARGET_ID,
        "method2"
      );
      pluginCommunication._registerCommunication(
        CALLER_ID,
        TARGET_ID,
        "method3"
      ); // Esto debería truncar

      const callerHistory =
        pluginCommunication.getCommunicationHistory(CALLER_ID);
      expect(callerHistory.length).toBe(2);
      expect(callerHistory[0].methodName).toBe("method3");
      expect(callerHistory[1].methodName).toBe("method2");

      const targetHistory =
        pluginCommunication.getCommunicationHistory(TARGET_ID);
      expect(targetHistory.length).toBe(2);
      expect(targetHistory[0].methodName).toBe("method3");

      // También probar el caso donde se crea por primera vez el historial para un plugin
      pluginCommunication._registerCommunication(
        "newPlugin",
        TARGET_ID,
        "method4"
      );
      expect(
        pluginCommunication.getCommunicationHistory("newPlugin").length
      ).toBe(1);
    });

    test("_updateCommunicationStatus debe actualizar y manejar ID no encontrado", () => {
      const commId = pluginCommunication._registerCommunication(
        CALLER_ID,
        TARGET_ID,
        "methodToUpdate"
      );
      pluginCommunication._updateCommunicationStatus(commId, true);
      let commEntry = pluginCommunication.getCommunicationHistory(CALLER_ID)[0];
      expect(commEntry.status).toBe("success");
      expect(commEntry.completedAt).toBeDefined();

      pluginCommunication._updateCommunicationStatus(
        "nonExistentId",
        false,
        "some error"
      );
      // No debería haber cambios ni errores si el ID no se encuentra
      commEntry = pluginCommunication.getCommunicationHistory(CALLER_ID)[0];
      expect(commEntry.status).toBe("success"); // Sigue siendo el anterior
    });
  });

  describe("Canales de Comunicación", () => {
    test("createChannel debe crear un canal y publicar evento", () => {
      const channelApi = pluginCommunication.createChannel(
        CHANNEL_NAME,
        PLUGIN_A,
        { maxMessages: 50 }
      );
      expect(pluginCommunication.channels[CHANNEL_NAME]).toBeDefined();
      expect(pluginCommunication.channels[CHANNEL_NAME].creator).toBe(PLUGIN_A);
      expect(
        pluginCommunication.channels[CHANNEL_NAME].options.maxMessages
      ).toBe(50);
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.channelCreated",
        {
          channelName: CHANNEL_NAME,
          creatorPluginId: PLUGIN_A,
        }
      );
      expect(channelApi.publish).toBeInstanceOf(Function);
    });

    test("createChannel debe lanzar error si faltan argumentos", () => {
      expect(() => pluginCommunication.createChannel(null, PLUGIN_A)).toThrow(
        "Argumentos inválidos para createChannel"
      );
      expect(() =>
        pluginCommunication.createChannel(CHANNEL_NAME, null)
      ).toThrow("Argumentos inválidos para createChannel");
    });

    test("createChannel debe lanzar error si el canal ya existe", () => {
      pluginCommunication.createChannel(CHANNEL_NAME, PLUGIN_A);
      expect(() =>
        pluginCommunication.createChannel(CHANNEL_NAME, PLUGIN_B)
      ).toThrow(`El canal ya existe: ${CHANNEL_NAME}`);
    });

    describe("getChannel", () => {
      test("debe devolver la API del canal si existe", () => {
        pluginCommunication.createChannel(CHANNEL_NAME, PLUGIN_A);
        const channelApi = pluginCommunication.getChannel(
          PLUGIN_B,
          CHANNEL_NAME
        );
        expect(channelApi).not.toBeNull();
        expect(typeof channelApi.subscribe).toBe("function");
        const info = channelApi.getInfo();
        expect(info.name).toBe(CHANNEL_NAME);
      });

      test("debe devolver null si el canal no existe y loguear advertencia (o nada si está comentado)", () => {
        expect(
          pluginCommunication.getChannel(PLUGIN_A, "nonExistentChannel")
        ).toBeNull();
        // Si el console.warn estuviera activo:
        // expect(console.warn).toHaveBeenCalledWith(`PluginCommunication: Canal no encontrado al intentar obtenerlo: nonExistentChannel`);
      });

      test("debe devolver null y llamar a _handleError si channelName es nulo", () => {
        const originalHandleError = pluginCommunication._handleError; // Espiar método interno
        pluginCommunication._handleError = jest.fn();

        expect(pluginCommunication.getChannel(PLUGIN_A, null)).toBeNull();
        expect(pluginCommunication._handleError).toHaveBeenCalledWith(
          PLUGIN_A,
          "getChannel",
          expect.any(Error)
        );

        pluginCommunication._handleError = originalHandleError; // Restaurar
      });

      // Si se descomenta la lógica de compatibilidad en getChannel:
      // test('getChannel debe devolver null si hay incompatibilidad con el creador', () => {
      //   pluginCommunication.createChannel(CHANNEL_NAME, PLUGIN_A);
      //   pluginCompatibility.getConflictInfo.mockImplementation(id => {
      //     if (id === PLUGIN_B) return { declared: [PLUGIN_A] }; // PLUGIN_B en conflicto con PLUGIN_A
      //     return null;
      //   });
      //   const originalHandleError = pluginCommunication._handleError;
      //   pluginCommunication._handleError = jest.fn();

      //   expect(pluginCommunication.getChannel(PLUGIN_B, CHANNEL_NAME)).toBeNull();
      //   expect(pluginCommunication._handleError).toHaveBeenCalledWith(PLUGIN_B, 'getChannel.compatibility', expect.any(Error));

      //   pluginCommunication._handleError = originalHandleError;
      // });
    });

    describe("subscribeToChannel", () => {
      beforeEach(() => {
        pluginCommunication.createChannel(CHANNEL_NAME, PLUGIN_A);
      });

      test("debe permitir la suscripción y devolver función de desuscripción", () => {
        const mockCallback = jest.fn();
        const unsubscribe = pluginCommunication.subscribeToChannel(
          CHANNEL_NAME,
          PLUGIN_B,
          mockCallback
        );
        expect(typeof unsubscribe).toBe("function");
        expect(
          pluginCommunication.channels[CHANNEL_NAME].subscribers[PLUGIN_B]
        ).toBeDefined();
        expect(eventBus.publish).toHaveBeenCalledWith(
          "pluginSystem.channelSubscribed",
          { channelName: CHANNEL_NAME, pluginId: PLUGIN_B }
        );
        unsubscribe();
        expect(
          pluginCommunication.channels[CHANNEL_NAME].subscribers[PLUGIN_B]
        ).toBeUndefined();
      });

      test("debe lanzar error si faltan argumentos o callback no es función", () => {
        expect(() =>
          pluginCommunication.subscribeToChannel(null, PLUGIN_B, jest.fn())
        ).toThrow("Argumentos inválidos");
        expect(() =>
          pluginCommunication.subscribeToChannel(CHANNEL_NAME, null, jest.fn())
        ).toThrow("Argumentos inválidos");
        expect(() =>
          pluginCommunication.subscribeToChannel(
            CHANNEL_NAME,
            PLUGIN_B,
            "not-a-function"
          )
        ).toThrow("Argumentos inválidos");
      });

      test("debe lanzar error si el canal no existe", () => {
        expect(() =>
          pluginCommunication.subscribeToChannel(
            "fakeChannel",
            PLUGIN_B,
            jest.fn()
          )
        ).toThrow("Canal no encontrado: fakeChannel");
      });

      test("debe lanzar error si el suscriptor es incompatible con el creador", () => {
        pluginCompatibility.getConflictInfo.mockImplementation((id) => {
          if (id === PLUGIN_B) return { declared: [PLUGIN_A] };
          return null;
        });
        expect(() =>
          pluginCommunication.subscribeToChannel(
            CHANNEL_NAME,
            PLUGIN_B,
            jest.fn()
          )
        ).toThrow(
          `No se puede suscribir al canal: ${PLUGIN_B} declara conflicto con ${PLUGIN_A}`
        );
      });

      test("debe enviar mensajes históricos al suscribirse si la opción está activa (último mensaje)", () => {
        pluginCommunication.channels[
          CHANNEL_NAME
        ].options.sendHistoryOnSubscribe = true;
        pluginCommunication.channels[
          CHANNEL_NAME
        ].options.sendFullHistoryOnSubscribe = false; // Solo el último
        const msg1 = { data: "msg1" };
        const msg2 = { data: "msg2" }; // Este será el primero en el array `messages`
        pluginCommunication.publishToChannel(CHANNEL_NAME, PLUGIN_A, msg1);
        pluginCommunication.publishToChannel(CHANNEL_NAME, PLUGIN_A, msg2);

        const mockCallback = jest.fn();
        pluginCommunication.subscribeToChannel(
          CHANNEL_NAME,
          PLUGIN_B,
          mockCallback
        );

        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({ content: msg2 })
        );
      });

      test("debe enviar mensajes históricos al suscribirse si la opción está activa (historia completa)", () => {
        pluginCommunication.channels[
          CHANNEL_NAME
        ].options.sendHistoryOnSubscribe = true;
        pluginCommunication.channels[
          CHANNEL_NAME
        ].options.sendFullHistoryOnSubscribe = true;
        const msg1 = { data: "msg1" };
        const msg2 = { data: "msg2" };
        pluginCommunication.publishToChannel(CHANNEL_NAME, PLUGIN_A, msg1);
        pluginCommunication.publishToChannel(CHANNEL_NAME, PLUGIN_A, msg2); // msg2 es el más reciente

        const mockCallback = jest.fn();
        pluginCommunication.subscribeToChannel(
          CHANNEL_NAME,
          PLUGIN_B,
          mockCallback
        );

        expect(mockCallback).toHaveBeenCalledTimes(2);
        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({ content: msg2 })
        );
        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({ content: msg1 })
        );
      });

      test("debe manejar error en callback al enviar mensaje histórico", () => {
        pluginCommunication.channels[
          CHANNEL_NAME
        ].options.sendHistoryOnSubscribe = true;
        pluginCommunication.publishToChannel(CHANNEL_NAME, PLUGIN_A, {
          data: "historical",
        });

        const erroringCallback = jest.fn(() => {
          throw new Error("Callback error during history send");
        });
        expect(() =>
          pluginCommunication.subscribeToChannel(
            CHANNEL_NAME,
            PLUGIN_B,
            erroringCallback
          )
        ).not.toThrow();
        expect(console.error).toHaveBeenCalledWith(
          "Error al enviar mensaje histórico a pluginB:",
          expect.any(Error)
        );
        expect(erroringCallback).toHaveBeenCalledTimes(1); // Se intentó llamar
      });
    });

    describe("unsubscribeFromChannel", () => {
      beforeEach(() => {
        pluginCommunication.createChannel(CHANNEL_NAME, PLUGIN_A);
        pluginCommunication.subscribeToChannel(
          CHANNEL_NAME,
          PLUGIN_B,
          jest.fn()
        );
      });

      test("debe desuscribir un plugin", () => {
        const result = pluginCommunication.unsubscribeFromChannel(
          CHANNEL_NAME,
          PLUGIN_B
        );
        expect(result).toBe(true);
        expect(
          pluginCommunication.channels[CHANNEL_NAME].subscribers[PLUGIN_B]
        ).toBeUndefined();
        expect(eventBus.publish).toHaveBeenCalledWith(
          "pluginSystem.channelUnsubscribed",
          { channelName: CHANNEL_NAME, pluginId: PLUGIN_B }
        );
      });

      test("debe devolver false si channelName o pluginId son nulos/undefined", () => {
        expect(pluginCommunication.unsubscribeFromChannel(null, PLUGIN_B)).toBe(
          false
        );
        expect(
          pluginCommunication.unsubscribeFromChannel(CHANNEL_NAME, null)
        ).toBe(false);
      });

      test("debe devolver false si el canal no existe", () => {
        expect(
          pluginCommunication.unsubscribeFromChannel("fakeChannel", PLUGIN_B)
        ).toBe(false);
      });

      test("debe devolver false si el plugin no está suscrito", () => {
        expect(
          pluginCommunication.unsubscribeFromChannel(CHANNEL_NAME, PLUGIN_C)
        ).toBe(false);
      });
    });

    describe("publishToChannel", () => {
      let mockCallbackB;
      beforeEach(() => {
        pluginCommunication.createChannel(CHANNEL_NAME, PLUGIN_A);
        mockCallbackB = jest.fn();
        pluginCommunication.subscribeToChannel(
          CHANNEL_NAME,
          PLUGIN_B,
          mockCallbackB
        );
      });

      test("debe publicar un mensaje y notificar a los suscriptores", () => {
        const message = { data: "hello" };
        const result = pluginCommunication.publishToChannel(
          CHANNEL_NAME,
          PLUGIN_A,
          message
        );
        expect(result).toBe(true);
        expect(mockCallbackB).toHaveBeenCalledWith(
          expect.objectContaining({
            publisher: PLUGIN_A,
            content: message,
          })
        );
        expect(pluginCommunication.channels[CHANNEL_NAME].messages.length).toBe(
          1
        );
        expect(
          pluginCommunication.channels[CHANNEL_NAME].subscribers[PLUGIN_B]
            .lastMessage
        ).toBeDefined();
      });

      test("un suscriptor puede publicar en el canal", () => {
        const message = { data: "from subscriber" };
        const result = pluginCommunication.publishToChannel(
          CHANNEL_NAME,
          PLUGIN_B,
          message
        );
        expect(result).toBe(true);
        // El propio suscriptor no se notifica a sí mismo, pero otros sí lo harían
        // Para este test, solo verificamos que pudo publicar
      });

      test("cualquier plugin puede publicar si allowAnyPublisher es true", () => {
        pluginCommunication.channels[
          CHANNEL_NAME
        ].options.allowAnyPublisher = true;
        const message = { data: "from anyone" };
        const result = pluginCommunication.publishToChannel(
          CHANNEL_NAME,
          PLUGIN_C,
          message
        ); // PLUGIN_C no es creador ni suscriptor
        expect(result).toBe(true);
        expect(mockCallbackB).toHaveBeenCalledWith(
          expect.objectContaining({ content: message, publisher: PLUGIN_C })
        );
      });

      test("debe devolver false y loguear error si el publicador no tiene permiso", () => {
        pluginCommunication.channels[
          CHANNEL_NAME
        ].options.allowAnyPublisher = false; // Asegurar
        const result = pluginCommunication.publishToChannel(
          CHANNEL_NAME,
          PLUGIN_C,
          { data: "no permission" }
        );
        expect(result).toBe(false);
        expect(console.error).toHaveBeenCalledWith(
          `Plugin ${PLUGIN_C} no puede publicar en el canal ${CHANNEL_NAME}`
        );
        expect(mockCallbackB).not.toHaveBeenCalled();
      });

      test("debe devolver false si channelName o publisherPluginId son nulos", () => {
        expect(pluginCommunication.publishToChannel(null, PLUGIN_A, {})).toBe(
          false
        );
        expect(
          pluginCommunication.publishToChannel(CHANNEL_NAME, null, {})
        ).toBe(false);
      });

      test("debe devolver false si el canal no existe", () => {
        expect(
          pluginCommunication.publishToChannel("fakeChannel", PLUGIN_A, {})
        ).toBe(false);
      });

      test("debe truncar mensajes si excede maxMessages", () => {
        pluginCommunication.channels[CHANNEL_NAME].options.maxMessages = 2;
        pluginCommunication.publishToChannel(CHANNEL_NAME, PLUGIN_A, { id: 1 });
        pluginCommunication.publishToChannel(CHANNEL_NAME, PLUGIN_A, { id: 2 });
        pluginCommunication.publishToChannel(CHANNEL_NAME, PLUGIN_A, { id: 3 }); // Este debería truncar el más antiguo
        expect(pluginCommunication.channels[CHANNEL_NAME].messages.length).toBe(
          2
        );
        expect(
          pluginCommunication.channels[CHANNEL_NAME].messages[0].content.id
        ).toBe(3); // El más nuevo
        expect(
          pluginCommunication.channels[CHANNEL_NAME].messages[1].content.id
        ).toBe(2);
      });

      test("debe manejar error en callback del suscriptor y llamar a pluginErrorHandler", () => {
        const erroringCallback = jest.fn(() => {
          throw new Error("Subscriber callback failed");
        });
        pluginCommunication.subscribeToChannel(
          CHANNEL_NAME,
          PLUGIN_C,
          erroringCallback
        );

        pluginCommunication.publishToChannel(CHANNEL_NAME, PLUGIN_A, {
          data: "test error",
        });

        expect(erroringCallback).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledWith(
          `Error al notificar mensaje a plugin ${PLUGIN_C}:`,
          expect.any(Error)
        );
        expect(pluginErrorHandler.handleError).toHaveBeenCalledWith(
          PLUGIN_C,
          "channelMessage",
          expect.any(Error),
          expect.objectContaining({ channelName: CHANNEL_NAME })
        );
        // El otro suscriptor (PLUGIN_B) debería haber recibido el mensaje
        expect(mockCallbackB).toHaveBeenCalledTimes(1);
      });
    });

    describe("closeChannel", () => {
      beforeEach(() => {
        pluginCommunication.createChannel(CHANNEL_NAME, PLUGIN_A);
        pluginCommunication.subscribeToChannel(
          CHANNEL_NAME,
          PLUGIN_B,
          jest.fn()
        );
      });

      test("el creador debe poder cerrar el canal", () => {
        const result = pluginCommunication.closeChannel(CHANNEL_NAME, PLUGIN_A);
        expect(result).toBe(true);
        expect(pluginCommunication.channels[CHANNEL_NAME]).toBeUndefined();
        expect(eventBus.publish).toHaveBeenCalledWith(
          "pluginSystem.channelClosed",
          { channelName: CHANNEL_NAME, closedBy: PLUGIN_A }
        );
      });

      test("debe notificar a los suscriptores al cerrar el canal", () => {
        const subscriberCallback = jest.fn();
        pluginCommunication.subscribeToChannel(
          CHANNEL_NAME,
          PLUGIN_C,
          subscriberCallback
        );
        pluginCommunication.closeChannel(CHANNEL_NAME, PLUGIN_A);
        expect(subscriberCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            content: { type: "channel_closed", reason: expect.any(String) },
          })
        );
      });

      test("un no-creador no debe poder cerrar el canal por defecto", () => {
        const result = pluginCommunication.closeChannel(CHANNEL_NAME, PLUGIN_B);
        expect(result).toBe(false);
        expect(pluginCommunication.channels[CHANNEL_NAME]).toBeDefined();
        expect(console.error).toHaveBeenCalledWith(
          `Plugin ${PLUGIN_B} no puede cerrar el canal ${CHANNEL_NAME}`
        );
      });

      test("un no-creador puede cerrar el canal si allowAnyClose es true", () => {
        pluginCommunication.channels[CHANNEL_NAME].options.allowAnyClose = true;
        const result = pluginCommunication.closeChannel(CHANNEL_NAME, PLUGIN_B);
        expect(result).toBe(true);
        expect(pluginCommunication.channels[CHANNEL_NAME]).toBeUndefined();
      });

      test("debe devolver false si channelName o pluginId son nulos", () => {
        expect(pluginCommunication.closeChannel(null, PLUGIN_A)).toBe(false);
        expect(pluginCommunication.closeChannel(CHANNEL_NAME, null)).toBe(
          false
        );
      });

      test("debe devolver false si el canal no existe", () => {
        expect(pluginCommunication.closeChannel("fakeChannel", PLUGIN_A)).toBe(
          false
        );
      });

      test("debe manejar error al notificar cierre a suscriptor (publicar falla)", () => {
        // Simular que publishToChannel falla para cubrir el catch en closeChannel
        const originalPublish = pluginCommunication.publishToChannel;
        pluginCommunication.publishToChannel = jest.fn(() => {
          throw new Error("Simulated publish error during close");
        });

        expect(() =>
          pluginCommunication.closeChannel(CHANNEL_NAME, PLUGIN_A)
        ).not.toThrow(); // El cierre principal debe completarse
        expect(console.error).toHaveBeenCalledWith(
          `Error al notificar cierre a plugin ${PLUGIN_B}:`,
          expect.any(Error)
        );
        expect(pluginCommunication.channels[CHANNEL_NAME]).toBeUndefined(); // El canal se cierra igual

        pluginCommunication.publishToChannel = originalPublish; // Restaurar
      });
    });

    describe("_createChannelAPI", () => {
      beforeEach(() => {
        pluginCommunication.createChannel(CHANNEL_NAME, PLUGIN_A);
      });
      test("getInfo debe devolver null si el canal ya no existe", () => {
        const api = pluginCommunication._createChannelAPI(
          CHANNEL_NAME,
          PLUGIN_A
        );
        pluginCommunication.closeChannel(CHANNEL_NAME, PLUGIN_A); // Cerrar el canal
        expect(api.getInfo()).toBeNull();
      });
      test("getHistory debe devolver array vacío si el canal ya no existe", () => {
        const api = pluginCommunication._createChannelAPI(
          CHANNEL_NAME,
          PLUGIN_A
        );
        pluginCommunication.closeChannel(CHANNEL_NAME, PLUGIN_A); // Cerrar el canal
        expect(api.getHistory()).toEqual([]);
      });
    });
  });

  describe("Historial de Comunicación", () => {
    test("getCommunicationHistory debe devolver historial específico o vacío", () => {
      pluginCommunication._registerCommunication(PLUGIN_A, PLUGIN_B, "method1");
      expect(pluginCommunication.getCommunicationHistory(PLUGIN_A).length).toBe(
        1
      );
      expect(pluginCommunication.getCommunicationHistory(PLUGIN_C).length).toBe(
        0
      ); // Plugin sin historial
      expect(pluginCommunication.getCommunicationHistory().length).toBe(0); // Sin ID, devuelve vacío
    });

    test("clearCommunicationHistory debe limpiar historial de un plugin", () => {
      pluginCommunication._registerCommunication(PLUGIN_A, PLUGIN_B, "method1");
      pluginCommunication.clearCommunicationHistory(PLUGIN_A);
      expect(pluginCommunication.getCommunicationHistory(PLUGIN_A).length).toBe(
        0
      );
      // No debe fallar si el plugin no tiene historial
      expect(() =>
        pluginCommunication.clearCommunicationHistory(PLUGIN_C)
      ).not.toThrow();
    });
  });

  describe("clearPluginResources", () => {
    test("debe limpiar historial, desuscribir y cerrar canales creados por el plugin", () => {
      pluginCommunication._registerCommunication(
        PLUGIN_A,
        PLUGIN_B,
        "someMethod"
      );
      pluginCommunication.createChannel("chByA", PLUGIN_A);
      pluginCommunication.createChannel("chNotByA", PLUGIN_B);
      pluginCommunication.subscribeToChannel("chNotByA", PLUGIN_A, jest.fn()); // A suscrito a un canal de B
      pluginCommunication.subscribeToChannel("chByA", PLUGIN_B, jest.fn()); // B suscrito a un canal de A

      pluginCommunication.clearPluginResources(PLUGIN_A);

      expect(pluginCommunication.getCommunicationHistory(PLUGIN_A).length).toBe(
        0
      );
      expect(pluginCommunication.channels["chByA"]).toBeUndefined(); // Canal creado por A se cierra
      expect(pluginCommunication.channels["chNotByA"]).toBeDefined(); // Canal de B permanece
      expect(
        pluginCommunication.channels["chNotByA"].subscribers[PLUGIN_A]
      ).toBeUndefined(); // A ya no está suscrito
    });

    test("no debe fallar si pluginId es nulo o undefined", () => {
      expect(() =>
        pluginCommunication.clearPluginResources(null)
      ).not.toThrow();
      expect(() =>
        pluginCommunication.clearPluginResources(undefined)
      ).not.toThrow();
    });
  });

  describe("Utilidades de Canales", () => {
    test("getChannelsInfo debe devolver información de los canales", () => {
      pluginCommunication.createChannel("chan1", PLUGIN_A);
      pluginCommunication.subscribeToChannel("chan1", PLUGIN_B, jest.fn());
      pluginCommunication.publishToChannel("chan1", PLUGIN_A, { msg: 1 });
      pluginCommunication.createChannel("chan2", PLUGIN_B);

      const info = pluginCommunication.getChannelsInfo();
      expect(Object.keys(info).length).toBe(2);
      expect(info["chan1"]).toEqual({
        creator: PLUGIN_A,
        created: expect.any(Number),
        subscribers: [PLUGIN_B],
        messagesCount: 1,
      });
      expect(info["chan2"].creator).toBe(PLUGIN_B);
    });

    test("listChannels debe devolver un array con información resumida", () => {
      pluginCommunication.createChannel("chan1", PLUGIN_A);
      pluginCommunication.subscribeToChannel("chan1", PLUGIN_B, jest.fn());
      pluginCommunication.createChannel("chan2", PLUGIN_B);
      pluginCommunication.subscribeToChannel("chan2", PLUGIN_A, jest.fn());
      pluginCommunication.subscribeToChannel("chan2", PLUGIN_C, jest.fn());

      const list = pluginCommunication.listChannels();
      expect(list.length).toBe(2);
      expect(list).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "chan1",
            createdBy: PLUGIN_A,
            subscribersCount: 1,
          }),
          expect.objectContaining({
            name: "chan2",
            createdBy: PLUGIN_B,
            subscribersCount: 2,
          }),
        ])
      );
    });
  });

  describe("_handleError (cobertura directa)", () => {
    test("debe llamar a console.error", () => {
      pluginCommunication._handleError(
        "testPlugin",
        "testOperation",
        new Error("Test error")
      );
      expect(console.error).toHaveBeenCalledWith(
        "PluginCommunication Error (testOperation) para testPlugin:",
        "Test error"
      );
    });
  });
});
