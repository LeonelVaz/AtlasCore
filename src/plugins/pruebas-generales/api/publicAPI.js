/**
 * publicAPI.js
 * API pública expuesta a otros plugins
 */

import logger from '../utils/logger';
import { incrementCounter, getStoredData } from './storageManager';
import { publishDemoEvent } from './eventManager';
import constants from '../constants';

/**
 * Crea y retorna la API pública del plugin
 * @param {Object} plugin - Instancia del plugin
 * @returns {Object} - API pública
 */
export function createPublicAPI(plugin) {
  const api = {
    /**
     * Obtiene información general del plugin
     * @returns {Object} - Información del plugin
     */
    getPluginInfo: function() {
      return {
        id: plugin.id,
        name: constants.PLUGIN_NAME,
        version: plugin.version,
        description: plugin.description,
        author: plugin.author
      };
    },
    
    /**
     * Obtiene el contador actual
     * @returns {number} - Valor del contador
     */
    getCounter: function() {
      return plugin._data.demoData.counter;
    },
    
    /**
     * Incrementa el contador
     * @returns {Promise<number>} - Nuevo valor del contador
     */
    incrementCounter: async function() {
      logger.debug('API pública: incrementando contador');
      
      if (!plugin._core) {
        throw new Error('El plugin no está inicializado');
      }
      
      return await incrementCounter(plugin._core, plugin);
    },
    
    /**
     * Obtiene el historial de eventos
     * @param {number} limit - Límite de eventos a retornar (opcional)
     * @returns {Array} - Historial de eventos
     */
    getEventLog: function(limit = 0) {
      const log = [...plugin._data.demoData.eventLog];
      
      // Si se especifica un límite, retornar solo los últimos N eventos
      if (limit > 0 && limit < log.length) {
        return log.slice(-limit);
      }
      
      return log;
    },
    
    /**
     * Obtiene la configuración actual
     * @returns {Object} - Configuración actual
     */
    getSettings: function() {
      return { ...plugin._data.settings };
    },
    
    /**
     * Comprueba si el plugin tiene un permiso específico
     * @param {string} permission - Permiso a comprobar
     * @returns {boolean} - true si tiene el permiso, false en caso contrario
     */
    hasPermission: function(permission) {
      return plugin.permissions.includes(permission);
    },
    
    /**
     * Inicia una demostración
     * @param {string} demoId - ID de la demostración
     * @param {Object} options - Opciones adicionales
     * @returns {Promise<boolean>} - Éxito/fallo de la operación
     */
    startDemo: async function(demoId, options = {}) {
      logger.debug(`API pública: iniciando demo ${demoId}`, options);
      
      if (!plugin._core) {
        throw new Error('El plugin no está inicializado');
      }
      
      try {
        // Publicar evento de inicio de demo
        publishDemoEvent(plugin._core, plugin, demoId, 'started', options);
        
        return true;
      } catch (error) {
        logger.error(`Error al iniciar demo ${demoId}:`, error);
        return false;
      }
    },
    
    /**
     * Completa una demostración
     * @param {string} demoId - ID de la demostración
     * @param {Object} result - Resultado de la demo
     * @returns {Promise<boolean>} - Éxito/fallo de la operación
     */
    completeDemo: async function(demoId, result = {}) {
      logger.debug(`API pública: completando demo ${demoId}`, result);
      
      if (!plugin._core) {
        throw new Error('El plugin no está inicializado');
      }
      
      try {
        // Publicar evento de completado de demo
        publishDemoEvent(plugin._core, plugin, demoId, 'completed', {
          success: result.success !== false,
          data: result.data || {}
        });
        
        return true;
      } catch (error) {
        logger.error(`Error al completar demo ${demoId}:`, error);
        return false;
      }
    },
    
    /**
     * Devuelve las categorías de demostración disponibles
     * @returns {Array} - Categorías de demostración
     */
    getDemoCategories: function() {
      return [...constants.DEMO_CATEGORIES];
    }
  };
  
  return api;
}