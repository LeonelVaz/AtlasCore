/**
 * Registro de APIs públicas para plugins de Atlas
 */
import eventBus from "../bus/event-bus";
import pluginRegistry from "./plugin-registry";
import pluginCompatibility from "./plugin-compatibility";
import pluginErrorHandler from "./plugin-error-handler";

class PluginAPIRegistry {
  constructor() {
    this.publicAPIs = {};
    this.apiAccessLog = {};
    this.maxLogSize = 200;
    this.lastLogId = 0;
    this.permissionsCache = {};
  }

  registerAPI(pluginId, apiObject) {
    if (!pluginId || !apiObject) {
      console.error("Argumentos inválidos para registerAPI");
      return false;
    }

    try {
      if (!pluginRegistry.getPlugin(pluginId)) {
        console.error(
          `No se puede registrar API para plugin no registrado: ${pluginId}`
        );
        return false;
      }

      if (this.publicAPIs[pluginId]) {
        console.warn(`Sobrescribiendo API existente para plugin: ${pluginId}`);
      }

      const processedAPI = this._processAPIObject(pluginId, apiObject);

      this.publicAPIs[pluginId] = {
        originalAPI: apiObject,
        processedAPI,
        methods: Object.keys(apiObject),
        registeredAt: Date.now(),
      };

      eventBus.publish("pluginSystem.apiRegistered", {
        pluginId,
        methods: Object.keys(apiObject),
      });

      console.log(`API pública registrada para plugin: ${pluginId}`);
      return true;
    } catch (error) {
      console.error(`Error al registrar API para plugin ${pluginId}:`, error);
      pluginErrorHandler.handleError(pluginId, "registerAPI", error, {
        apiObject: Object.keys(apiObject || {}),
      });
      return false;
    }
  }

  _processAPIObject(pluginId, apiObject) {
    const processedAPI = {};

    Object.entries(apiObject).forEach(([key, value]) => {
      if (typeof value === "function") {
        processedAPI[key] = this._wrapAPIMethod(pluginId, key, value);
      } else if (typeof value === "object" && value !== null) {
        processedAPI[key] = this._processAPIObject(pluginId, value);
      } else {
        processedAPI[key] = value;
      }
    });

    return processedAPI;
  }

  _wrapAPIMethod(pluginId, methodName, originalMethod) {
    const self = this;

    return function (...args) {
      let callerPluginId; // Declarar aquí para que esté disponible en try y catch
      try {
        const callerInfo = self._getCallerInfo();
        callerPluginId = callerInfo.pluginId; // Asignar valor

        if (!self._checkAPIAccess(callerPluginId, pluginId, methodName)) {
          const errorMsg = `Acceso denegado: ${callerPluginId} no tiene permiso para acceder a ${pluginId}.${methodName}`;
          self._logAPIAccess(
            callerPluginId,
            pluginId,
            methodName,
            false,
            errorMsg
          );

          eventBus.publish("pluginSystem.unauthorizedAPIAccess", {
            callerPluginId,
            targetPluginId: pluginId,
            method: methodName,
          });

          throw new Error(errorMsg); // Este es el error que el test espera
        }

        self._logAPIAccess(callerPluginId, pluginId, methodName, true);
        return originalMethod.apply(this, args);
      } catch (error) {
        // Ahora callerPluginId está disponible aquí
        pluginErrorHandler.handleError(
          pluginId,
          `apiMethod.${methodName}`,
          error,
          { caller: callerPluginId || "app" } // Usar 'app' como fallback si callerPluginId fuera undefined por otra razón
        );

        throw error; // Re-lanzar el error original
      }
    };
  }

  _getCallerInfo() {
    return { pluginId: this._currentCaller || "app" };
  }

  _setCurrentCaller(pluginId) {
    this._currentCaller = pluginId;
  }

  _clearCurrentCaller() {
    this._currentCaller = null;
  }

  _checkAPIAccess(callerPluginId, targetPluginId, methodName) {
    if (callerPluginId === "app" || callerPluginId === targetPluginId) {
      return true;
    }

    if (
      !pluginRegistry.isPluginActive(callerPluginId) ||
      !pluginRegistry.isPluginActive(targetPluginId)
    ) {
      return false;
    }

    const callerPlugin = pluginRegistry.getPlugin(callerPluginId);
    if (callerPlugin?.dependencies) {
      const isDependency = callerPlugin.dependencies.some(
        (dep) => (typeof dep === "string" ? dep : dep.id) === targetPluginId
      );

      if (isDependency) return true;
    }

    const conflict =
      pluginCompatibility.getConflictInfo(callerPluginId) ||
      pluginCompatibility.getConflictInfo(targetPluginId);

    if (conflict) {
      const hasExplicitConflict = conflict.declared?.some(
        (c) => (typeof c === "string" ? c : c.id) === callerPluginId
      );

      const hasReversedConflict = conflict.reversed?.some(
        (c) => (typeof c === "string" ? c : c.id) === targetPluginId
      );

      if (hasExplicitConflict || hasReversedConflict) {
        return false;
      }
    }

    const cacheKey = `${callerPluginId}:${targetPluginId}:${methodName}`;
    if (this.permissionsCache[cacheKey] !== undefined) {
      return this.permissionsCache[cacheKey];
    }

    return (this.permissionsCache[cacheKey] = true);
  }

  _logAPIAccess(
    callerPluginId,
    targetPluginId,
    methodName,
    success,
    error = null
  ) {
    const logEntry = {
      id: ++this.lastLogId,
      timestamp: Date.now(),
      caller: callerPluginId,
      target: targetPluginId,
      method: methodName,
      success,
      error,
    };

    if (!this.apiAccessLog[callerPluginId]) {
      this.apiAccessLog[callerPluginId] = [];
    }

    this.apiAccessLog[callerPluginId].unshift(logEntry);

    if (this.apiAccessLog[callerPluginId].length > this.maxLogSize) {
      this.apiAccessLog[callerPluginId] = this.apiAccessLog[
        callerPluginId
      ].slice(0, this.maxLogSize);
    }

    if (!success) {
      eventBus.publish("pluginSystem.apiAccessError", logEntry);
    }
  }

  getPluginAPI(pluginId) {
    return pluginId && this.publicAPIs[pluginId]
      ? this.publicAPIs[pluginId].processedAPI
      : null;
  }

  callPluginMethod(callerPluginId, targetPluginId, methodName, args = []) {
    if (!callerPluginId || !targetPluginId || !methodName) {
      throw new Error("Argumentos inválidos para callPluginMethod");
    }

    try {
      const targetAPI = this.getPluginAPI(targetPluginId);

      if (!targetAPI) {
        throw new Error(
          `Plugin no encontrado o sin API pública: ${targetPluginId}`
        );
      }

      const method = targetAPI[methodName];

      if (typeof method !== "function") {
        throw new Error(
          `Método no encontrado en la API de ${targetPluginId}: ${methodName}`
        );
      }

      this._setCurrentCaller(callerPluginId);

      try {
        return method(...args);
      } finally {
        this._clearCurrentCaller();
      }
    } catch (error) {
      this._logAPIAccess(
        callerPluginId,
        targetPluginId,
        methodName,
        false,
        error.message
      );

      pluginErrorHandler.handleError(
        callerPluginId,
        "callPluginMethod",
        error,
        { target: targetPluginId, method: methodName }
      );

      throw error;
    }
  }

  unregisterAPI(pluginId) {
    if (!pluginId || !this.publicAPIs[pluginId]) return false;

    try {
      delete this.publicAPIs[pluginId];

      Object.keys(this.permissionsCache).forEach((key) => {
        if (key.includes(pluginId)) delete this.permissionsCache[key];
      });

      eventBus.publish("pluginSystem.apiUnregistered", { pluginId });
      return true;
    } catch (error) {
      console.error(`Error al eliminar API del plugin ${pluginId}:`, error);
      return false;
    }
  }

  getAPIInfo() {
    const apiInfo = {};

    Object.entries(this.publicAPIs).forEach(([pluginId, apiData]) => {
      apiInfo[pluginId] = {
        methods: apiData.methods,
        registeredAt: apiData.registeredAt,
      };
    });

    return apiInfo;
  }

  getAccessLog(pluginId) {
    return pluginId ? this.apiAccessLog[pluginId] || [] : [];
  }

  clear(pluginId) {
    if (!pluginId) return;

    delete this.publicAPIs[pluginId];
    delete this.apiAccessLog[pluginId];

    Object.keys(this.permissionsCache).forEach((key) => {
      if (key.includes(pluginId)) delete this.permissionsCache[key];
    });
  }

  clearAll() {
    this.publicAPIs = {};
    this.apiAccessLog = {};
    this.permissionsCache = {};
  }
}

const pluginAPIRegistry = new PluginAPIRegistry();
export default pluginAPIRegistry;
