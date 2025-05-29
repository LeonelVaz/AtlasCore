// test/unit/src/core/plugins/plugin-security-audit.test.js

// Mockear storage-service globalmente
jest.mock("../../../../../src/services/storage-service", () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));

// Mock de event-bus:
jest.mock("../../../../../src/core/bus/event-bus", () => {
  let subscribers = {};

  const publish = jest.fn((eventName, data) => {
    if (subscribers[eventName]) {
      subscribers[eventName].forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          // console.error(`Test mock eventBus: Error en callback para ${eventName}`, e);
        }
      });
    }
  });

  const subscribe = jest.fn((eventName, callback) => {
    if (!subscribers[eventName]) {
      subscribers[eventName] = [];
    }
    subscribers[eventName].push(callback);
    const currentCallback = callback;
    return jest.fn(() => {
      if (subscribers[eventName]) {
        subscribers[eventName] = subscribers[eventName].filter(
          (cb) => cb !== currentCallback
        );
      }
    });
  });

  const clearAllSubscribers_devOnly = () => {
    subscribers = {};
  };

  return {
    __esModule: true,
    default: {
      publish: publish,
      subscribe: subscribe,
      clearAllSubscribers_devOnly: clearAllSubscribers_devOnly,
    },
  };
});

import pluginSecurityAuditModule from "../../../../../src/core/plugins/plugin-security-audit";
import {
  PLUGIN_CONSTANTS,
  STORAGE_KEYS,
} from "../../../../../src/core/config/constants";

const storageService = require("../../../../../src/services/storage-service");
const eventBus = require("../../../../../src/core/bus/event-bus").default;

describe("PluginSecurityAudit", () => {
  const pluginSecurityAudit = pluginSecurityAuditModule;
  const pluginId = "testPlugin";
  const storageKey = STORAGE_KEYS.PLUGIN_DATA_PREFIX + "security_audit_log";

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const resetAuditModuleInternalState = () => {
    pluginSecurityAudit.initialized = false;
    pluginSecurityAudit.securityLevel = PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL;
    pluginSecurityAudit.auditMode = "immediate";
    pluginSecurityAudit.auditLog = [];
    pluginSecurityAudit.pluginAuditLogs = {};
    pluginSecurityAudit.auditQueue = [];
    if (pluginSecurityAudit.batchIntervalId) {
      clearInterval(pluginSecurityAudit.batchIntervalId);
      pluginSecurityAudit.batchIntervalId = null;
    }
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    if (eventBus.clearAllSubscribers_devOnly) {
      eventBus.clearAllSubscribers_devOnly();
    }

    resetAuditModuleInternalState();

    storageService.get.mockImplementation(async (key, defaultValue) => {
      if (key === storageKey) return Promise.resolve([]);
      return Promise.resolve(defaultValue);
    });
    storageService.set.mockResolvedValue(true);
    storageService.remove.mockResolvedValue(true);
  });

  describe("initialize", () => {
    test("debe inicializar y llamar a _setupEventListeners, y eventBus.subscribe debe ser llamado", async () => {
      const setupListenersSpy = jest.spyOn(
        pluginSecurityAudit,
        "_setupEventListeners"
      );
      await pluginSecurityAudit.initialize(
        PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL
      );

      expect(pluginSecurityAudit.initialized).toBe(true);
      expect(setupListenersSpy).toHaveBeenCalled();
      expect(eventBus.subscribe).toHaveBeenCalled();
      setupListenersSpy.mockRestore();
    });

    test("debe cargar log desde storageService", async () => {
      storageService.get.mockResolvedValueOnce([
        { id: "entry1", pluginId, auditType: "validation" },
      ]);
      await pluginSecurityAudit.initialize(
        PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL
      );
      expect(storageService.get).toHaveBeenCalledWith(storageKey, []);
      expect(pluginSecurityAudit.auditLog.length).toBe(1);
    });

    test("debe configurar el modo batch en nivel LOW", async () => {
      await pluginSecurityAudit.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW);
      expect(pluginSecurityAudit.auditMode).toBe("batch");
      expect(pluginSecurityAudit.batchIntervalId).toBeDefined();
    });
  });

  describe("Event Handling and Recording", () => {
    beforeEach(async () => {
      resetAuditModuleInternalState();
    });

    test("debe registrar un evento de seguridad directamente", async () => {
      await pluginSecurityAudit.initialize(
        PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL
      );
      jest.clearAllMocks(); // Limpiar después de la inicialización

      const eventData = { pluginId, message: "Security Test Event" };
      pluginSecurityAudit.recordSecurityEvent(eventData);

      expect(pluginSecurityAudit.auditLog.length).toBe(1);
      expect(pluginSecurityAudit.auditLog[0].auditType).toBe("securityEvent");
      expect(storageService.set).toHaveBeenCalledWith(
        storageKey,
        expect.any(Array)
      );
    });

    test("debe suscribirse a eventos del sistema y registrarlos", async () => {
      // Verificar que subscribe se llamará durante la inicialización
      const subscribeCallsBefore = eventBus.subscribe.mock.calls.length;

      await pluginSecurityAudit.initialize(
        PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL
      );

      // Verificar que hay suscriptores después de la inicialización
      const subscribeCallsAfter = eventBus.subscribe.mock.calls.length;
      expect(subscribeCallsAfter).toBeGreaterThan(subscribeCallsBefore);

      // Ahora podemos limpiar los mocks porque ya verificamos las suscripciones
      jest.clearAllMocks();

      const eventData = { pluginId, details: "Activation details" };

      // Publicar el evento DESPUÉS de que se hayan configurado los listeners
      eventBus.publish("pluginSystem.pluginActivated", eventData);

      // En modo immediate, no necesitamos timers para este caso
      expect(pluginSecurityAudit.auditLog.length).toBe(1);
      const loggedEntry = pluginSecurityAudit.auditLog.find(
        (e) => e.eventType === "pluginActivated"
      );
      expect(loggedEntry).toBeDefined();
      expect(loggedEntry.auditType).toBe("pluginActivation");
      expect(loggedEntry.pluginId).toBe(pluginId);
      expect(loggedEntry.details).toEqual(eventData);
    });
  });

  describe("Batch Processing", () => {
    beforeEach(async () => {
      resetAuditModuleInternalState();
      // Para batch processing, necesitamos el nivel LOW
      await pluginSecurityAudit.initialize(PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW);
      jest.clearAllMocks();
    });

    test("debe encolar eventos en modo batch y procesarlos", async () => {
      expect(pluginSecurityAudit.auditMode).toBe("batch");

      const eventData1 = { pluginId, message: "Batch Event 1" };
      pluginSecurityAudit.recordSecurityEvent(eventData1);

      expect(pluginSecurityAudit.auditQueue.length).toBe(1);
      expect(pluginSecurityAudit.auditLog.length).toBe(0);

      // Avanzar el timer para procesar el batch
      jest.advanceTimersByTime(pluginSecurityAudit.batchInterval + 100);
      await jest.runOnlyPendingTimersAsync();

      expect(pluginSecurityAudit.auditQueue.length).toBe(0);
      expect(pluginSecurityAudit.auditLog.length).toBe(1);
      expect(pluginSecurityAudit.auditLog[0].details.message).toBe(
        "Batch Event 1"
      );
    });
  });

  describe("Log Management", () => {
    beforeEach(async () => {
      resetAuditModuleInternalState();
      await pluginSecurityAudit.initialize(
        PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL
      );
      jest.clearAllMocks();
    });

    test("getPluginAuditHistory debe devolver el historial de un plugin", () => {
      pluginSecurityAudit.recordSecurityEvent({ pluginId, message: "Event 1" });
      pluginSecurityAudit.recordSecurityEvent({
        pluginId: "otherPlugin",
        message: "Event 2",
      });
      pluginSecurityAudit.recordSecurityEvent({ pluginId, message: "Event 3" });

      const history = pluginSecurityAudit.getPluginAuditHistory(pluginId);
      expect(history.length).toBe(2);
    });

    test("getAuditLog debe filtrar por criterios", () => {
      pluginSecurityAudit.recordSecurityEvent({
        pluginId,
        auditType: "securityEvent",
      });
      pluginSecurityAudit.recordBlacklistAction(pluginId, { action: "add" });

      const filtered = pluginSecurityAudit.getAuditLog({
        auditType: "blacklistAction",
      });
      expect(filtered.length).toBe(1);
      expect(filtered[0].auditType).toBe("blacklistAction");
    });
  });

  describe("setSecurityLevel", () => {
    beforeEach(async () => {
      resetAuditModuleInternalState();
      await pluginSecurityAudit.initialize(
        PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL
      );
      jest.clearAllMocks();
    });

    test("debe cambiar el nivel de seguridad y reconfigurar el modo de auditoría", () => {
      const result = pluginSecurityAudit.setSecurityLevel(
        PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH
      );
      expect(result).toBe(true);
      expect(pluginSecurityAudit.securityLevel).toBe(
        PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH
      );
      expect(pluginSecurityAudit.auditMode).toBe("immediate");
      expect(pluginSecurityAudit.batchIntervalId).toBeNull();
    });

    test("debe cambiar a modo batch si el nivel es LOW", () => {
      const result = pluginSecurityAudit.setSecurityLevel(
        PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW
      );
      expect(result).toBe(true);
      expect(pluginSecurityAudit.securityLevel).toBe(
        PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW
      );
      expect(pluginSecurityAudit.auditMode).toBe("batch");
      expect(pluginSecurityAudit.batchIntervalId).not.toBeNull();
    });
  });

  describe("getAuditStats", () => {
    beforeEach(async () => {
      resetAuditModuleInternalState();
      await pluginSecurityAudit.initialize(
        PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL
      );
      jest.clearAllMocks();
    });

    test("debe devolver estadísticas correctas de auditoría", () => {
      pluginSecurityAudit.recordSecurityEvent({
        pluginId: "p1",
        message: "Event Alpha",
      });
      pluginSecurityAudit.recordBlacklistAction("p2", { action: "add" });
      pluginSecurityAudit.recordValidationResult("p1", { valid: true });

      const stats = pluginSecurityAudit.getAuditStats();
      expect(stats.totalEntries).toBe(3);
      expect(stats.countByType.securityEvent).toBe(1);
      expect(stats.countByType.blacklistAction).toBe(1);
      expect(stats.countByType.validation).toBe(1);
      const p1Stats = stats.topPlugins.find((p) => p.pluginId === "p1");
      expect(p1Stats.count).toBe(2);
    });
  });
});
