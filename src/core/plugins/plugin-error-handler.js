/**
 * Manejador de errores para el sistema de plugins
 * 
 * Este módulo se encarga de gestionar, formatear y reportar
 * errores que ocurren en el sistema de plugins
 */

import eventBus from '../bus/event-bus';

/**
 * Clase para gestión y reporte de errores de plugins
 */
class PluginErrorHandler {
  constructor() {
    // Handlers de errores registrados
    this.handlers = [];
    this.lastId = 0;
    
    // Historial de errores
    this.errorLog = [];
    this.maxLogSize = 100;
  }

  /**
   * Registra un handler para errores de plugins
   * @param {Function} handler - Función que maneja errores
   * @returns {number} - ID del handler
   */
  registerHandler(handler) {
    if (typeof handler !== 'function') {
      throw new Error('El handler debe ser una función');
    }
    
    const id = ++this.lastId;
    this.handlers.push({ id, handler });
    
    return id;
  }

  /**
   * Elimina un handler registrado
   * @param {number} handlerId - ID del handler a eliminar
   * @returns {boolean} - true si se eliminó correctamente
   */
  unregisterHandler(handlerId) {
    const index = this.handlers.findIndex(h => h.id === handlerId);
    
    if (index === -1) {
      return false;
    }
    
    this.handlers.splice(index, 1);
    return true;
  }

  /**
   * Maneja un error de plugin
   * @param {string} pluginId - ID del plugin que generó el error
   * @param {string} operation - Operación que causó el error
   * @param {Error|string} error - Objeto de error o mensaje
   * @param {Object} metadata - Información adicional
   */
  handleError(pluginId, operation, error, metadata = {}) {
    // Formatear información del error
    const errorInfo = this._formatError(pluginId, operation, error, metadata);
    
    // Añadir al log
    this._addToLog(errorInfo);
    
    // Notificar a handlers registrados
    this._notifyHandlers(errorInfo);
    
    // Publicar evento para suscriptores externos
    eventBus.publish('pluginSystem.error', errorInfo);
    
    return errorInfo;
  }

  /**
   * Formatea un error para su reporte
   * @param {string} pluginId - ID del plugin
   * @param {string} operation - Operación que causó el error
   * @param {Error|string} error - Objeto de error o mensaje
   * @param {Object} metadata - Información adicional
   * @returns {Object} - Información formateada del error
   * @private
   */
  _formatError(pluginId, operation, error, metadata) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : null;
    
    return {
      id: this._generateErrorId(),
      pluginId: pluginId || 'unknown',
      operation: operation || 'unknown',
      message: errorMessage,
      stack: errorStack,
      timestamp: Date.now(),
      metadata
    };
  }

  /**
   * Genera un ID único para un error
   * @returns {string} - ID del error
   * @private
   */
  _generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Añade un error al log
   * @param {Object} errorInfo - Información del error
   * @private
   */
  _addToLog(errorInfo) {
    // Añadir al inicio para tener los más recientes primero
    this.errorLog.unshift(errorInfo);
    
    // Mantener tamaño máximo del log
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }
  }

  /**
   * Notifica a todos los handlers registrados
   * @param {Object} errorInfo - Información del error
   * @private
   */
  _notifyHandlers(errorInfo) {
    this.handlers.forEach(({ handler }) => {
      try {
        handler(errorInfo);
      } catch (handlerError) {
        console.error('Error en handler de errores de plugin:', handlerError);
      }
    });
  }

  /**
   * Obtiene el log de errores
   * @param {number} limit - Número máximo de errores a obtener
   * @returns {Array} - Log de errores
   */
  getErrorLog(limit = this.maxLogSize) {
    return this.errorLog.slice(0, limit);
  }

  /**
   * Limpia el log de errores
   */
  clearErrorLog() {
    this.errorLog = [];
  }

  /**
   * Obtiene errores filtrados por plugin
   * @param {string} pluginId - ID del plugin
   * @returns {Array} - Errores del plugin
   */
  getPluginErrors(pluginId) {
    if (!pluginId) return [];
    return this.errorLog.filter(error => error.pluginId === pluginId);
  }
}

// Exportar instancia única
const pluginErrorHandler = new PluginErrorHandler();
export default pluginErrorHandler;