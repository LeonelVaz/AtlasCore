/**
 * Registro de APIs públicas para plugins de Atlas
 * 
 * Este módulo gestiona el registro, acceso y validación de las APIs
 * públicas expuestas por los plugins.
 */

import eventBus from '../bus/event-bus';
import pluginRegistry from './plugin-registry';
import pluginCompatibility from './plugin-compatibility';
import pluginErrorHandler from './plugin-error-handler';

/**
 * Clase para gestionar el registro de APIs públicas de plugins
 */
class PluginAPIRegistry {
  constructor() {
    // Mapa de APIs públicas registradas por plugin
    this.publicAPIs = {};
    
    // Registro de accesos entre plugins para auditoría
    this.apiAccessLog = {};
    
    // Límite de tamaño del log de acceso
    this.maxLogSize = 200;
    
    // Última entrada del log
    this.lastLogId = 0;
    
    // Caché de permisos para acceso rápido
    this.permissionsCache = {};
  }

  /**
   * Registra la API pública de un plugin
   * @param {string} pluginId - ID del plugin
   * @param {Object} apiObject - Objeto que contiene la API pública
   * @returns {boolean} - true si se registró correctamente
   */
  registerAPI(pluginId, apiObject) {
    if (!pluginId || !apiObject) {
      console.error('Argumentos inválidos para registerAPI');
      return false;
    }
    
    try {
      // Verificar que el plugin esté registrado
      if (!pluginRegistry.getPlugin(pluginId)) {
        console.error(`No se puede registrar API para plugin no registrado: ${pluginId}`);
        return false;
      }
      
      // Si ya existe una API registrada, sobreescribirla
      if (this.publicAPIs[pluginId]) {
        console.warn(`Sobrescribiendo API existente para plugin: ${pluginId}`);
      }
      
      // Procesar métodos para añadir control de acceso
      const processedAPI = this._processAPIObject(pluginId, apiObject);
      
      // Registrar la API
      this.publicAPIs[pluginId] = {
        originalAPI: apiObject,
        processedAPI: processedAPI,
        methods: Object.keys(apiObject),
        registeredAt: Date.now()
      };
      
      // Publicar evento de registro
      eventBus.publish('pluginSystem.apiRegistered', {
        pluginId,
        methods: Object.keys(apiObject)
      });
      
      console.log(`API pública registrada para plugin: ${pluginId}`);
      return true;
    } catch (error) {
      console.error(`Error al registrar API para plugin ${pluginId}:`, error);
      pluginErrorHandler.handleError(
        pluginId,
        'registerAPI',
        error,
        { apiObject: Object.keys(apiObject || {}) }
      );
      return false;
    }
  }

  /**
   * Procesa un objeto API para añadir control de acceso a sus métodos
   * @param {string} pluginId - ID del plugin propietario
   * @param {Object} apiObject - Objeto API original
   * @returns {Object} - Objeto API con control de acceso
   * @private
   */
  _processAPIObject(pluginId, apiObject) {
    const processedAPI = {};
    
    // Procesar cada propiedad del objeto API
    Object.entries(apiObject).forEach(([key, value]) => {
      // Si es una función, envolverla para control de acceso
      if (typeof value === 'function') {
        processedAPI[key] = this._wrapAPIMethod(pluginId, key, value);
      } 
      // Si es un objeto, procesarlo recursivamente
      else if (typeof value === 'object' && value !== null) {
        processedAPI[key] = this._processAPIObject(pluginId, value);
      } 
      // Si es otro tipo de valor, copiarlo directamente
      else {
        processedAPI[key] = value;
      }
    });
    
    return processedAPI;
  }

  /**
   * Envuelve un método de API para añadir control de acceso
   * @param {string} pluginId - ID del plugin propietario
   * @param {string} methodName - Nombre del método
   * @param {Function} originalMethod - Método original
   * @returns {Function} - Método con control de acceso
   * @private
   */
  _wrapAPIMethod(pluginId, methodName, originalMethod) {
    const self = this;
    
    // Devolver función envoltorio que realizará validaciones
    return function(...args) {
      try {
        // Obtener información sobre el plugin que realiza la llamada
        const callerInfo = self._getCallerInfo();
        const callerPluginId = callerInfo.pluginId;
        
        // Verificar permisos
        const hasPermission = self._checkAPIAccess(callerPluginId, pluginId, methodName);
        
        if (!hasPermission) {
          const errorMsg = `Acceso denegado: ${callerPluginId} no tiene permiso para acceder a ${pluginId}.${methodName}`;
          console.error(errorMsg);
          
          // Registrar intento de acceso no autorizado
          self._logAPIAccess(callerPluginId, pluginId, methodName, false, errorMsg);
          
          // Publicar evento de intento no autorizado
          eventBus.publish('pluginSystem.unauthorizedAPIAccess', {
            callerPluginId,
            targetPluginId: pluginId,
            method: methodName
          });
          
          throw new Error(errorMsg);
        }
        
        // Registrar acceso exitoso
        self._logAPIAccess(callerPluginId, pluginId, methodName, true);
        
        // Ejecutar método original con contexto correcto
        return originalMethod.apply(this, args);
      } catch (error) {
        // Registrar error y propagarlo
        pluginErrorHandler.handleError(
          pluginId,
          `apiMethod.${methodName}`,
          error,
          { caller: callerPluginId || 'unknown' }
        );
        
        throw error;
      }
    };
  }

  /**
   * Obtiene información sobre el plugin que realiza la llamada
   * @returns {Object} - Información del plugin llamador
   * @private
   */
  _getCallerInfo() {
    // En esta implementación simplificada, el caller se proporciona externamente
    // En una implementación más avanzada, se podría analizar la pila de llamadas
    return {
      pluginId: this._currentCaller || 'app'
    };
  }

  /**
   * Establece el plugin actual para la siguiente llamada a la API
   * @param {string} pluginId - ID del plugin llamador
   * @private
   */
  _setCurrentCaller(pluginId) {
    this._currentCaller = pluginId;
  }

  /**
   * Limpia la información de plugin llamador
   * @private
   */
  _clearCurrentCaller() {
    this._currentCaller = null;
  }

  /**
   * Verifica si un plugin tiene permiso para acceder a un método de otro plugin
   * @param {string} callerPluginId - ID del plugin llamador
   * @param {string} targetPluginId - ID del plugin objetivo
   * @param {string} methodName - Nombre del método a acceder
   * @returns {boolean} - true si tiene permiso
   * @private
   */
  _checkAPIAccess(callerPluginId, targetPluginId, methodName) {
    // Siempre permitir a la aplicación principal acceder a cualquier API
    if (callerPluginId === 'app') {
      return true;
    }
    
    // Un plugin puede llamar a sus propios métodos
    if (callerPluginId === targetPluginId) {
      return true;
    }
    
    // Verificar si el plugin llamador está activo
    if (!pluginRegistry.isPluginActive(callerPluginId)) {
      return false;
    }
    
    // Verificar si el plugin objetivo está activo
    if (!pluginRegistry.isPluginActive(targetPluginId)) {
      return false;
    }
    
    // Verificar dependencias (un plugin puede llamar a APIs de sus dependencias)
    const callerPlugin = pluginRegistry.getPlugin(callerPluginId);
    if (callerPlugin && callerPlugin.dependencies) {
      const isDependency = callerPlugin.dependencies.some(dep => {
        const depId = typeof dep === 'string' ? dep : dep.id;
        return depId === targetPluginId;
      });
      
      if (isDependency) {
        return true;
      }
    }
    
    // Verificar si hay conflicto declarado
    const conflict = pluginCompatibility.getConflictInfo(callerPluginId) || 
                    pluginCompatibility.getConflictInfo(targetPluginId);
    
    if (conflict) {
      // Si hay conflicto explícito, denegar acceso
      const hasExplicitConflict = conflict.declared && conflict.declared.some(c => 
        (typeof c === 'string' ? c : c.id) === callerPluginId
      );
      
      const hasReversedConflict = conflict.reversed && conflict.reversed.some(c => 
        (typeof c === 'string' ? c : c.id) === targetPluginId
      );
      
      if (hasExplicitConflict || hasReversedConflict) {
        return false;
      }
    }
    
    // Verificar cache de permisos para optimizar llamadas repetidas
    const cacheKey = `${callerPluginId}:${targetPluginId}:${methodName}`;
    if (this.permissionsCache[cacheKey] !== undefined) {
      return this.permissionsCache[cacheKey];
    }
    
    // En esta versión, permitimos acceso si no hay restricciones explícitas
    // En futuras implementaciones, se podría añadir un sistema más granular de permisos
    this.permissionsCache[cacheKey] = true;
    return true;
  }

  /**
   * Registra un acceso a la API en el log
   * @param {string} callerPluginId - ID del plugin llamador
   * @param {string} targetPluginId - ID del plugin objetivo
   * @param {string} methodName - Nombre del método
   * @param {boolean} success - Si el acceso fue exitoso
   * @param {string} [error] - Mensaje de error, si hubo
   * @private
   */
  _logAPIAccess(callerPluginId, targetPluginId, methodName, success, error = null) {
    const logEntry = {
      id: ++this.lastLogId,
      timestamp: Date.now(),
      caller: callerPluginId,
      target: targetPluginId,
      method: methodName,
      success,
      error
    };
    
    // Añadir al log
    if (!this.apiAccessLog[callerPluginId]) {
      this.apiAccessLog[callerPluginId] = [];
    }
    
    this.apiAccessLog[callerPluginId].unshift(logEntry);
    
    // Limitar tamaño del log
    if (this.apiAccessLog[callerPluginId].length > this.maxLogSize) {
      this.apiAccessLog[callerPluginId] = this.apiAccessLog[callerPluginId].slice(0, this.maxLogSize);
    }
    
    // Para casos de error, publicar evento
    if (!success) {
      eventBus.publish('pluginSystem.apiAccessError', logEntry);
    }
  }

  /**
   * Obtiene la API pública de un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {Object|null} - API pública o null si no existe
   */
  getPluginAPI(pluginId) {
    if (!pluginId || !this.publicAPIs[pluginId]) {
      return null;
    }
    
    return this.publicAPIs[pluginId].processedAPI;
  }

  /**
   * Invoca un método de la API pública de un plugin
   * @param {string} callerPluginId - ID del plugin llamador
   * @param {string} targetPluginId - ID del plugin objetivo
   * @param {string} methodName - Nombre del método a invocar
   * @param {Array} args - Argumentos para el método
   * @returns {*} - Resultado de la invocación
   */
  callPluginMethod(callerPluginId, targetPluginId, methodName, args = []) {
    if (!callerPluginId || !targetPluginId || !methodName) {
      throw new Error('Argumentos inválidos para callPluginMethod');
    }
    
    try {
      // Obtener la API del plugin objetivo
      const targetAPI = this.getPluginAPI(targetPluginId);
      
      if (!targetAPI) {
        throw new Error(`Plugin no encontrado o sin API pública: ${targetPluginId}`);
      }
      
      // Verificar que el método exista
      const method = targetAPI[methodName];
      
      if (typeof method !== 'function') {
        throw new Error(`Método no encontrado en la API de ${targetPluginId}: ${methodName}`);
      }
      
      // Establecer el plugin llamador para control de acceso
      this._setCurrentCaller(callerPluginId);
      
      try {
        // Invocar el método
        return method(...args);
      } finally {
        // Limpiar información de caller después de la llamada
        this._clearCurrentCaller();
      }
    } catch (error) {
      // Registrar error en el log
      this._logAPIAccess(callerPluginId, targetPluginId, methodName, false, error.message);
      
      // Notificar error
      pluginErrorHandler.handleError(
        callerPluginId,
        'callPluginMethod',
        error,
        { target: targetPluginId, method: methodName }
      );
      
      throw error;
    }
  }

  /**
   * Elimina la API pública de un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {boolean} - true si se eliminó correctamente
   */
  unregisterAPI(pluginId) {
    if (!pluginId || !this.publicAPIs[pluginId]) {
      return false;
    }
    
    try {
      // Eliminar la API
      delete this.publicAPIs[pluginId];
      
      // Limpiar caché de permisos relacionados
      Object.keys(this.permissionsCache).forEach(key => {
        if (key.includes(pluginId)) {
          delete this.permissionsCache[key];
        }
      });
      
      // Publicar evento
      eventBus.publish('pluginSystem.apiUnregistered', { pluginId });
      
      return true;
    } catch (error) {
      console.error(`Error al eliminar API del plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Obtiene información sobre las APIs registradas
   * @returns {Object} - Información de APIs
   */
  getAPIInfo() {
    const apiInfo = {};
    
    Object.entries(this.publicAPIs).forEach(([pluginId, apiData]) => {
      apiInfo[pluginId] = {
        methods: apiData.methods,
        registeredAt: apiData.registeredAt
      };
    });
    
    return apiInfo;
  }

  /**
   * Obtiene el historial de acceso a APIs para un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {Array} - Historial de acceso
   */
  getAccessLog(pluginId) {
    if (!pluginId) {
      return [];
    }
    
    return this.apiAccessLog[pluginId] || [];
  }

  /**
   * Limpia el registro de APIs para un plugin
   * @param {string} pluginId - ID del plugin
   */
  clear(pluginId) {
    if (!pluginId) {
      return;
    }
    
    // Eliminar API
    delete this.publicAPIs[pluginId];
    
    // Limpiar logs
    delete this.apiAccessLog[pluginId];
    
    // Limpiar caché de permisos
    Object.keys(this.permissionsCache).forEach(key => {
      if (key.includes(pluginId)) {
        delete this.permissionsCache[key];
      }
    });
  }

  /**
   * Limpia todos los registros
   */
  clearAll() {
    this.publicAPIs = {};
    this.apiAccessLog = {};
    this.permissionsCache = {};
  }
}

// Exportar instancia única
const pluginAPIRegistry = new PluginAPIRegistry();
export default pluginAPIRegistry;