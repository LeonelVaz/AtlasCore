// src/core/plugins/plugin-security-audit.js

/**
 * Sistema de Auditoría de Seguridad para Plugins de Atlas
 */
import { PLUGIN_CONSTANTS, STORAGE_KEYS } from "../config/constants";
import storageService from "../../services/storage-service";
import eventBus from "../bus/event-bus";

class PluginSecurityAudit {
  constructor() {
    this.initialized = false;
    this.securityLevel = PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL;
    this.auditMode = "immediate";
    this.auditLog = [];
    this.pluginAuditLogs = {};
    this.auditQueue = [];
    this.maxLogSize = 1000;
    this.batchIntervalId = null;
    this.batchInterval = 60000;

    this.auditEventTypes = [
      "securityEvent",
      "permissionRequest",
      "permissionChange",
      "validation",
      "suspiciousActivity",
      "resourceOveruse",
      "blacklistAction",
      "pluginActivation",
      "pluginDeactivation",
      "codeExecution",
      "other",
    ];

    this.storageKey = STORAGE_KEYS.PLUGIN_DATA_PREFIX + "security_audit_log";
  }

  initialize(securityLevelInput) {
    if (this.initialized) {
      const currentInputLevel = securityLevelInput
        ? String(securityLevelInput).toLowerCase()
        : undefined;
      if (
        currentInputLevel === undefined ||
        this.securityLevel === currentInputLevel
      ) {
        console.warn("[SecurityAudit] Sistema de auditoría ya inicializado.");
      } else {
        this.setSecurityLevel(securityLevelInput);
      }
      return true;
    }

    try {
      console.log(
        "[SecurityAudit] [DEBUG_INIT] Inicializando sistema de auditoría para plugins..."
      );

      const initialLevel = securityLevelInput
        ? String(securityLevelInput).toLowerCase()
        : this.securityLevel;
      console.log(
        "[SecurityAudit] [DEBUG_INIT] Nivel de seguridad inicial para initialize:",
        initialLevel
      );

      this.setSecurityLevel(initialLevel);
      console.log(
        "[SecurityAudit] [DEBUG_INIT] Después de setSecurityLevel, this.securityLevel:",
        this.securityLevel,
        "this.auditMode:",
        this.auditMode
      );

      this._loadAuditLog();

      if (this.auditMode === "batch") {
        console.log(
          "[SecurityAudit] [DEBUG_INIT] Configurando modo batch, llamando a _startBatchProcessing."
        );
        this._startBatchProcessing();
      }

      console.log(
        "[SecurityAudit] [DEBUG_INIT] Llamando a _setupEventListeners."
      );
      this._setupEventListeners();

      this.initialized = true;

      console.log(
        `[SecurityAudit] Sistema de auditoría inicializado (nivel: ${this.securityLevel}, modo: ${this.auditMode})`
      );
      return true;
    } catch (error) {
      console.error(
        "[SecurityAudit] Error al inicializar sistema de auditoría:",
        error
      );
      this.initialized = false;
      return false;
    }
  }

  _configureAuditMode() {
    console.log(
      "[SecurityAudit] [DEBUG_CONFIGURE_MODE] Configurando modo de auditoría para nivel:",
      this.securityLevel
    );
    switch (this.securityLevel) {
      case PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW:
        this.auditMode = "batch";
        this.maxLogSize = 500;
        break;
      case PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL:
        this.auditMode = "immediate";
        this.maxLogSize = 1000;
        break;
      case PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH:
        this.auditMode = "immediate";
        this.maxLogSize = 5000;
        break;
      default:
        this.auditMode = "immediate";
        this.maxLogSize = 1000;
    }
    console.log(
      "[SecurityAudit] [DEBUG_CONFIGURE_MODE] Modo de auditoría configurado a:",
      this.auditMode
    );
  }

  async _loadAuditLog() {
    try {
      console.log(
        "[SecurityAudit] [DEBUG_LOAD_LOG] Cargando log desde storage, clave:",
        this.storageKey
      );
      const savedLog = await storageService.get(this.storageKey, []);
      if (Array.isArray(savedLog) && savedLog.length > 0) {
        this.auditLog = savedLog;
        this._rebuildPluginIndices();
        console.log(
          `[SecurityAudit] Log de auditoría cargado: ${savedLog.length} entradas`
        );
      } else {
        this.auditLog = [];
        console.log(
          "[SecurityAudit] [DEBUG_LOAD_LOG] No se encontró log guardado o estaba vacío."
        );
      }
    } catch (error) {
      console.error("[SecurityAudit] Error al cargar log de auditoría:", error);
      this.auditLog = [];
    }
  }

  _rebuildPluginIndices() {
    this.pluginAuditLogs = {};
    this.auditLog.forEach((entry) => {
      if (entry.pluginId) {
        if (!this.pluginAuditLogs[entry.pluginId]) {
          this.pluginAuditLogs[entry.pluginId] = [];
        }
        this.pluginAuditLogs[entry.pluginId].push(entry);
      }
    });
  }

  async _saveAuditLog() {
    try {
      console.log(
        "[SecurityAudit] [DEBUG_SAVE_LOG] Intentando guardar log. Nivel de seguridad:",
        this.securityLevel
      );
      if (this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW) {
        console.log(
          "[SecurityAudit] [DEBUG_SAVE_LOG] No se guarda el log en nivel LOW."
        );
        return;
      }
      const logToSave = this.auditLog.slice(-this.maxLogSize);
      console.log(
        "[SecurityAudit] [DEBUG_SAVE_LOG] Guardando",
        logToSave.length,
        "entradas."
      );
      await storageService.set(this.storageKey, logToSave);
    } catch (error) {
      console.error(
        "[SecurityAudit] Error al guardar log de auditoría:",
        error
      );
    }
  }

  _startBatchProcessing() {
    if (this.batchIntervalId) {
      clearInterval(this.batchIntervalId);
    }
    console.log(
      "[SecurityAudit] [DEBUG_BATCH] Iniciando procesamiento por lotes, intervalo:",
      this.batchInterval
    );
    this.batchIntervalId = setInterval(() => {
      console.log(
        "[SecurityAudit] [DEBUG_BATCH] Intervalo de batch disparado."
      );
      this._processBatch();
    }, this.batchInterval);
  }

  async _processBatch() {
    console.log(
      "[SecurityAudit] [DEBUG_BATCH] _processBatch llamado. Longitud de cola:",
      this.auditQueue.length
    );
    if (this.auditQueue.length === 0) {
      return;
    }
    const batch = [...this.auditQueue];
    this.auditQueue = [];
    console.log(
      "[SecurityAudit] [DEBUG_BATCH] Procesando lote de",
      batch.length,
      "eventos."
    );
    this._addEventsToLog(batch);
    await this._saveAuditLog();
  }

  _addEventsToLog(events) {
    console.log(
      "[SecurityAudit] [DEBUG_ADD_LOG] _addEventsToLog, eventos a añadir:",
      JSON.stringify(events)
    );
    if (!Array.isArray(events) || events.length === 0) return;
    this.auditLog.push(...events);
    console.log(
      "[SecurityAudit] [DEBUG_ADD_LOG] this.auditLog DESPUÉS de push, longitud:",
      this.auditLog.length
    );
    if (this.auditLog.length > this.maxLogSize) {
      this.auditLog = this.auditLog.slice(-this.maxLogSize);
    }
    events.forEach((entry) => {
      if (entry.pluginId) {
        if (!this.pluginAuditLogs[entry.pluginId])
          this.pluginAuditLogs[entry.pluginId] = [];
        this.pluginAuditLogs[entry.pluginId].push(entry);
        const maxPluginLogSize = Math.min(500, Math.floor(this.maxLogSize / 2));
        if (this.pluginAuditLogs[entry.pluginId].length > maxPluginLogSize) {
          this.pluginAuditLogs[entry.pluginId] = this.pluginAuditLogs[
            entry.pluginId
          ].slice(-maxPluginLogSize);
        }
      }
    });
  }

  _setupEventListeners() {
    console.log(
      "[SecurityAudit] [DEBUG_SETUP_LISTENERS] Configurando escuchadores de eventos..."
    );
    const eventsToAudit = [
      "pluginSystem.securityEvent",
      "pluginSystem.pendingPermissions",
      "pluginSystem.permissionsRegistered",
      "pluginSystem.permissionsApproved",
      "pluginSystem.permissionsRejected",
      "pluginSystem.permissionsRevoked",
      "pluginSystem.pluginActivated",
      "pluginSystem.pluginDeactivated",
      "pluginSystem.suspiciousOperation",
      "pluginSystem.resourceOveruse",
      "pluginSystem.pluginBlacklisted",
      "pluginSystem.pluginWhitelisted",
      "pluginSystem.sandboxError",
      "pluginSystem.unsafeCodeExecution",
    ];
    eventsToAudit.forEach((eventType) => {
      const handler = (data) => {
        console.log(
          `[SecurityAudit] [DEBUG_EVENT_HANDLER] Evento '${eventType}' recibido por handler:`,
          JSON.stringify(data)
        );
        let auditType = "other";
        const simpleEventType = eventType.replace("pluginSystem.", "");

        if (simpleEventType.includes("permission"))
          auditType = "permissionChange";
        else if (simpleEventType.includes("securityEvent"))
          auditType = "securityEvent";
        else if (
          simpleEventType.includes("suspicious") ||
          simpleEventType.includes("sandboxError")
        )
          auditType = "suspiciousActivity";
        else if (simpleEventType.includes("resource"))
          auditType = "resourceOveruse";
        else if (
          simpleEventType.includes("blacklist") ||
          simpleEventType.includes("whitelist")
        )
          auditType = "blacklistAction";
        else if (simpleEventType === "pluginActivated")
          auditType = "pluginActivation";
        else if (simpleEventType === "pluginDeactivated")
          auditType = "pluginDeactivation";
        else if (simpleEventType.includes("codeExecution"))
          auditType = "codeExecution";

        console.log(
          "[SecurityAudit] [DEBUG_EVENT_HANDLER] auditType determinado:",
          auditType
        );
        const auditEntry = {
          id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          eventType: simpleEventType,
          auditType,
          pluginId: data.pluginId || null,
          details: data,
        };
        console.log(
          "[SecurityAudit] [DEBUG_EVENT_HANDLER] Llamando a _processAuditEntry con:",
          JSON.stringify(auditEntry)
        );
        this._processAuditEntry(auditEntry);
      };
      try {
        if (!eventBus || typeof eventBus.subscribe !== "function") {
          console.error(
            "[SecurityAudit] [DEBUG_SETUP_LISTENERS] FATAL: eventBus o eventBus.subscribe no está definido ANTES de la suscripción para",
            eventType
          );
          throw new Error("eventBus.subscribe no es una función");
        }
        console.log(
          "[SecurityAudit] [DEBUG_SETUP_LISTENERS] Intentando suscribir a:",
          eventType
        );
        eventBus.subscribe(eventType, handler);
        console.log(
          "[SecurityAudit] [DEBUG_SETUP_LISTENERS] Suscrito exitosamente a:",
          eventType
        );
      } catch (e) {
        console.error(
          `[SecurityAudit] [DEBUG_SETUP_LISTENERS] Error al suscribir a ${eventType}:`,
          e
        );
      }
    });
    console.log(
      "[SecurityAudit] [DEBUG_SETUP_LISTENERS] Configuración de escuchadores completada."
    );
  }

  _processAuditEntry(entry) {
    console.log(
      "[SecurityAudit] [DEBUG_PROCESS_ENTRY] _processAuditEntry, auditType a verificar:",
      entry.auditType
    );
    console.log(
      "[SecurityAudit] [DEBUG_PROCESS_ENTRY] this.auditEventTypes incluye entry.auditType?:",
      this.auditEventTypes.includes(entry.auditType)
    );
    if (!this.auditEventTypes.includes(entry.auditType)) {
      return;
    }
    console.log(
      "[SecurityAudit] [DEBUG_PROCESS_ENTRY] _processAuditEntry, auditMode:",
      this.auditMode
    );
    switch (this.auditMode) {
      case "immediate":
        console.log(
          "[SecurityAudit] [DEBUG_PROCESS_ENTRY] Modo immediate, llamando a _addEventsToLog"
        );
        this._addEventsToLog([entry]);
        this._saveAuditLog();
        break;
      case "batch":
        console.log(
          "[SecurityAudit] [DEBUG_PROCESS_ENTRY] Modo batch, añadiendo a cola."
        );
        this.auditQueue.push(entry);
        break;
      case "disabled":
        console.log(
          "[SecurityAudit] [DEBUG_PROCESS_ENTRY] Modo disabled, no se hace nada."
        );
        break;
    }
  }

  recordSecurityEvent(event) {
    if (!this.initialized || !event) return;
    console.log(
      "[SecurityAudit] [DEBUG_RECORD_EVENT] recordSecurityEvent llamado con:",
      JSON.stringify(event)
    );
    const auditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      eventType: "securityEvent",
      auditType: "securityEvent",
      pluginId: event.pluginId || null,
      details: event,
    };
    this._processAuditEntry(auditEntry);
  }

  recordValidationResult(pluginId, result) {
    if (!this.initialized || !pluginId) return;
    const auditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      eventType: "validation",
      auditType: "validation",
      pluginId,
      details: result,
    };
    this._processAuditEntry(auditEntry);
  }

  recordBlacklistAction(pluginId, action) {
    if (!this.initialized || !pluginId) return;
    const auditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      eventType: "blacklistAction",
      auditType: "blacklistAction",
      pluginId,
      details: action,
    };
    this._processAuditEntry(auditEntry);
  }

  recordPluginDeactivation(pluginId, details) {
    if (!this.initialized || !pluginId) return;
    const auditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      eventType: "pluginDeactivation",
      auditType: "pluginDeactivation",
      pluginId,
      details: details,
    };
    this._processAuditEntry(auditEntry);
  }

  getPluginAuditHistory(pluginId) {
    if (!pluginId) return [];
    return [...(this.pluginAuditLogs[pluginId] || [])];
  }

  getAuditLog(filters = {}) {
    try {
      let filteredLog = [...this.auditLog];
      if (filters.pluginId)
        filteredLog = filteredLog.filter(
          (entry) => entry.pluginId === filters.pluginId
        );
      if (filters.auditType)
        filteredLog = filteredLog.filter(
          (entry) => entry.auditType === filters.auditType
        );
      if (filters.startDate)
        filteredLog = filteredLog.filter(
          (entry) => entry.timestamp >= filters.startDate
        );
      if (filters.endDate)
        filteredLog = filteredLog.filter(
          (entry) => entry.timestamp <= filters.endDate
        );
      if (filters.limit) filteredLog = filteredLog.slice(-filters.limit);
      return filteredLog;
    } catch (error) {
      console.error(
        "[SecurityAudit] Error al obtener log de auditoría:",
        error
      );
      return [];
    }
  }

  getAuditLogByType(type, limit = 50) {
    try {
      if (!type) return [];
      const filteredLog = this.auditLog.filter(
        (entry) => entry.auditType === type
      );
      return filteredLog.slice(-limit);
    } catch (error) {
      console.error(
        `[SecurityAudit] Error al obtener log de auditoría por tipo ${type}:`,
        error
      );
      return [];
    }
  }

  clearPluginData(pluginId) {
    if (!pluginId) return false;
    try {
      delete this.pluginAuditLogs[pluginId];
      this.auditLog = this.auditLog.filter(
        (entry) => entry.pluginId !== pluginId
      );
      this._saveAuditLog();
      return true;
    } catch (error) {
      console.error(
        `[SecurityAudit] Error al limpiar datos de plugin ${pluginId}:`,
        error
      );
      return false;
    }
  }

  clearAllAuditLogs() {
    try {
      this.auditLog = [];
      this.pluginAuditLogs = {};
      storageService.remove(this.storageKey);
      return true;
    } catch (error) {
      console.error(
        "[SecurityAudit] Error al limpiar logs de auditoría:",
        error
      );
      return false;
    }
  }

  exportAuditData() {
    try {
      return {
        version: "1.0",
        timestamp: Date.now(),
        securityLevel: this.securityLevel,
        auditMode: this.auditMode,
        logs: [...this.auditLog],
      };
    } catch (error) {
      console.error(
        "[SecurityAudit] Error al exportar datos de auditoría:",
        error
      );
      return null;
    }
  }

  setSecurityLevel(levelInput) {
    const validLevels = Object.values(PLUGIN_CONSTANTS.SECURITY.LEVEL);
    const level = String(levelInput || "").toLowerCase();

    if (!levelInput || !validLevels.includes(level)) {
      console.warn(
        `[SecurityAudit] Nivel de seguridad inválido: '${levelInput}'. Los válidos son ${validLevels.join(
          ", "
        )}.`
      );
      return false;
    }

    try {
      if (this.securityLevel === level && this.initialized) {
        return true;
      }
      console.log(
        "[SecurityAudit] [DEBUG_SET_LEVEL] Cambiando nivel de seguridad a:",
        level
      );
      this.securityLevel = level;
      this._configureAuditMode();

      if (this.auditMode === "batch" && this.initialized) {
        console.log(
          "[SecurityAudit] [DEBUG_SET_LEVEL] Iniciando batch processing por cambio de nivel."
        );
        this._startBatchProcessing();
      } else if (this.batchIntervalId) {
        console.log(
          "[SecurityAudit] [DEBUG_SET_LEVEL] Limpiando intervalo de batch por cambio de nivel/modo."
        );
        clearInterval(this.batchIntervalId);
        this.batchIntervalId = null;
      }
      return true;
    } catch (error) {
      console.error(
        `[SecurityAudit] Error al cambiar nivel de seguridad a ${levelInput}:`,
        error
      );
      return false;
    }
  }

  setAuditMode(mode) {
    const validModes = ["immediate", "batch", "disabled"];
    if (!mode || !validModes.includes(mode)) {
      console.warn(`[SecurityAudit] Modo de auditoría inválido: ${mode}.`);
      return false;
    }
    try {
      if (this.auditMode === mode) return true;
      console.log(
        "[SecurityAudit] [DEBUG_SET_MODE] Cambiando modo de auditoría a:",
        mode
      );
      this.auditMode = mode;
      if (mode === "batch" && this.initialized) {
        console.log(
          "[SecurityAudit] [DEBUG_SET_MODE] Iniciando batch processing por cambio de modo."
        );
        this._startBatchProcessing();
      } else if (this.batchIntervalId) {
        console.log(
          "[SecurityAudit] [DEBUG_SET_MODE] Limpiando intervalo de batch por cambio de modo."
        );
        clearInterval(this.batchIntervalId);
        this.batchIntervalId = null;
      }
      return true;
    } catch (error) {
      console.error(
        `[SecurityAudit] Error al cambiar modo de auditoría a ${mode}:`,
        error
      );
      return false;
    }
  }

  getAuditStats() {
    try {
      const totalEntries = this.auditLog.length;
      const countByType = {};
      this.auditEventTypes.forEach((type) => {
        countByType[type] = this.auditLog.filter(
          (entry) => entry.auditType === type
        ).length;
      });
      const pluginCounts = {};
      this.auditLog.forEach((entry) => {
        if (entry.pluginId) {
          pluginCounts[entry.pluginId] =
            (pluginCounts[entry.pluginId] || 0) + 1;
        }
      });
      const topPlugins = Object.entries(pluginCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([pluginId, count]) => ({ pluginId, count }));
      const recentEvents = this.auditLog.slice(-10);
      return {
        totalEntries,
        countByType,
        topPlugins,
        recentEvents,
        auditMode: this.auditMode,
        securityLevel: this.securityLevel,
      };
    } catch (error) {
      console.error(
        "[SecurityAudit] Error al obtener estadísticas de auditoría:",
        error
      );
      return {
        error: error.message,
        securityLevel: this.securityLevel,
        auditMode: this.auditMode,
        totalEntries: 0,
        countByType: {},
        topPlugins: [],
        recentEvents: [],
      };
    }
  }
}

const pluginSecurityAudit = new PluginSecurityAudit();
export default pluginSecurityAudit;
