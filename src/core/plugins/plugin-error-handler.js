/**
 * Manejador de errores para plugins
 */
import eventBus from "../bus/event-bus";

class PluginErrorHandler {
  constructor() {
    this.handlers = [];
    this.lastId = 0;
    this.errorLog = [];
    this.maxLogSize = 100;
  }

  registerHandler(handler) {
    if (typeof handler !== "function") {
      throw new Error("El handler debe ser una función");
    }

    const id = ++this.lastId;
    this.handlers.push({ id, handler });

    return id;
  }

  unregisterHandler(handlerId) {
    const index = this.handlers.findIndex((h) => h.id === handlerId);

    if (index === -1) return false;

    this.handlers.splice(index, 1);
    return true;
  }

  handleError(pluginId, operation, error, metadata = {}) {
    const errorInfo = this._formatError(pluginId, operation, error, metadata);
    this._addToLog(errorInfo);
    this._notifyHandlers(errorInfo);

    eventBus.publish("pluginSystem.error", errorInfo);

    return errorInfo;
  }

  _formatError(pluginId, operation, error, metadata) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : null;

    return {
      id: this._generateErrorId(),
      pluginId: pluginId || "unknown",
      operation: operation || "unknown",
      message: errorMessage,
      stack: errorStack,
      timestamp: Date.now(),
      metadata,
    };
  }

  _generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  _addToLog(errorInfo) {
    this.errorLog.unshift(errorInfo);

    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }
  }

  _notifyHandlers(errorInfo) {
    this.handlers.forEach(({ handler }) => {
      try {
        handler(errorInfo);
      } catch (handlerError) {
        console.error("Error en handler de errores de plugin:", handlerError);
      }
    });
  }

  getErrorLog(limit = this.maxLogSize) {
    return this.errorLog.slice(0, limit);
  }

  clearErrorLog() {
    this.errorLog = [];
  }

  getPluginErrors(pluginId) {
    if (!pluginId) return [];
    return this.errorLog.filter((error) => error.pluginId === pluginId);
  }
}

const pluginErrorHandler = new PluginErrorHandler();
export default pluginErrorHandler;
