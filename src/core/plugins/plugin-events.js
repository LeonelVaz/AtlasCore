/**
 * Sistema de eventos para plugins
 * 
 * Proporciona un mecanismo de comunicación basado en eventos
 * entre plugins y la aplicación principal
 */

import eventBus from '../bus/event-bus';

/**
 * Clase para gestionar eventos específicos de plugins
 */
class PluginEvents {
  constructor() {
    // Prefijo para eventos de plugins
    this.pluginEventPrefix = 'plugin.';
    
    // Suscripciones por plugin
    this.pluginSubscriptions = {};
    
    // ID global para suscripciones
    this.lastSubscriptionId = 0;
    
    // Eventos que se están escuchando
    this.listeningEvents = new Set();
  }

  /**
   * Genera un nombre de evento prefijado para plugins
   * @param {string} eventName - Nombre base del evento
   * @returns {string} - Nombre prefijado
   * @private
   */
  _getEventName(eventName) {
    // Si ya tiene el prefijo, no lo añadir de nuevo
    if (eventName.startsWith(this.pluginEventPrefix)) {
      return eventName;
    }
    
    return `${this.pluginEventPrefix}${eventName}`;
  }

  /**
   * Registra una suscripción de un plugin
   * @param {string} pluginId - ID del plugin
   * @param {string} eventName - Nombre del evento
   * @param {Function} callback - Callback de la suscripción
   * @param {Function} unsubscribeFn - Función para cancelar suscripción
   * @returns {number} - ID de la suscripción
   * @private
   */
  _registerSubscription(pluginId, eventName, callback, unsubscribeFn) {
    if (!this.pluginSubscriptions[pluginId]) {
      this.pluginSubscriptions[pluginId] = {};
    }
    
    const subscriptionId = ++this.lastSubscriptionId;
    
    this.pluginSubscriptions[pluginId][subscriptionId] = {
      eventName,
      callback,
      unsubscribe: unsubscribeFn
    };
    
    return subscriptionId;
  }

  /**
   * Publica un evento sin prefijo de plugin
   * @param {string} eventName - Nombre del evento
   * @param {*} data - Datos del evento
   * @private
   */
  _publishSystemEvent(eventName, data) {
    eventBus.publish(`pluginSystem.${eventName}`, data);
  }

  /**
   * Suscribe un plugin a un evento
   * @param {string} pluginId - ID del plugin
   * @param {string} eventName - Nombre del evento
   * @param {Function} callback - Función a llamar cuando ocurra el evento
   * @returns {Function} - Función para cancelar suscripción
   */
  subscribe(pluginId, eventName, callback) {
    if (!pluginId || !eventName || typeof callback !== 'function') {
      console.error('Argumentos inválidos para subscribe');
      return () => {};
    }
    
    try {
      // Normalizar nombre del evento
      const fullEventName = this._getEventName(eventName);
      
      // Suscripción al bus de eventos
      const unsubscribe = eventBus.subscribe(fullEventName, data => {
        // Si el evento tiene origen en un plugin, añadir metadatos
        const eventData = typeof data === 'object' && data !== null && data.sourcePlugin
          ? data // Ya tiene formato de evento de plugin
          : { 
              sourcePlugin: null, // Evento del sistema o sin origen específico
              data 
            };
        
        try {
          // Llamar al callback del plugin
          callback(eventData.data, eventData.sourcePlugin);
        } catch (error) {
          console.error(`Error en callback de plugin ${pluginId} para evento ${eventName}:`, error);
          
          // Publicar evento de error
          this._publishSystemEvent('eventHandlerError', {
            pluginId,
            eventName,
            error: error.message || 'Error desconocido en manejador de eventos'
          });
        }
      });
      
      // Registrar la suscripción para limpieza
      const subscriptionId = this._registerSubscription(pluginId, eventName, callback, unsubscribe);
      
      // Registrar que estamos escuchando este evento
      this.listeningEvents.add(eventName);
      
      // Devolver función para cancelar
      return () => this.unsubscribe(pluginId, subscriptionId);
    } catch (error) {
      console.error(`Error al suscribir plugin ${pluginId} a evento ${eventName}:`, error);
      
      // Publicar evento de error
      this._publishSystemEvent('error', {
        pluginId,
        operation: 'subscribe',
        eventName,
        error: error.message || 'Error desconocido'
      });
      
      return () => {};
    }
  }

  /**
   * Cancela una suscripción de un plugin
   * @param {string} pluginId - ID del plugin
   * @param {number} subscriptionId - ID de la suscripción
   * @returns {boolean} - true si se canceló correctamente
   */
  unsubscribe(pluginId, subscriptionId) {
    if (!pluginId || !subscriptionId) {
      return false;
    }
    
    try {
      // Verificar que el plugin tenga suscripciones
      if (!this.pluginSubscriptions[pluginId]) {
        return false;
      }
      
      // Verificar que exista la suscripción
      const subscription = this.pluginSubscriptions[pluginId][subscriptionId];
      if (!subscription) {
        return false;
      }
      
      // Llamar a la función de cancelación
      if (typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
      
      // Eliminar registro
      delete this.pluginSubscriptions[pluginId][subscriptionId];
      
      // Si no quedan suscripciones para este plugin, limpiar
      if (Object.keys(this.pluginSubscriptions[pluginId]).length === 0) {
        delete this.pluginSubscriptions[pluginId];
      }
      
      return true;
    } catch (error) {
      console.error(`Error al cancelar suscripción ${subscriptionId} del plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Publica un evento
   * @param {string} pluginId - ID del plugin que publica
   * @param {string} eventName - Nombre del evento
   * @param {*} data - Datos a pasar a los suscriptores
   * @returns {boolean} - true si se publicó correctamente
   */
  publish(pluginId, eventName, data) {
    if (!pluginId || !eventName) {
      console.error('Argumentos inválidos para publish');
      return false;
    }
    
    try {
      // Normalizar nombre del evento
      const fullEventName = this._getEventName(eventName);
      
      // Preparar datos con origen del plugin
      const eventData = {
        sourcePlugin: pluginId,
        data
      };
      
      // Publicar en el bus de eventos
      eventBus.publish(fullEventName, eventData);
      
      // Si hay pocos suscriptores al evento, publicar también con el prefijo común
      // para facilitar la detección de eventos no escuchados
      if (!this.listeningEvents.has(eventName)) {
        eventBus.publish(this._getEventName('*'), {
          sourcePlugin: pluginId,
          eventName,
          data
        });
      }
      
      return true;
    } catch (error) {
      console.error(`Error al publicar evento ${eventName} desde plugin ${pluginId}:`, error);
      
      // Publicar evento de error
      this._publishSystemEvent('error', {
        pluginId,
        operation: 'publish',
        eventName,
        error: error.message || 'Error desconocido'
      });
      
      return false;
    }
  }

  /**
   * Cancela todas las suscripciones de un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {boolean} - true si se cancelaron correctamente
   */
  unsubscribeAll(pluginId) {
    if (!pluginId || !this.pluginSubscriptions[pluginId]) {
      return false;
    }
    
    try {
      const subscriptions = this.pluginSubscriptions[pluginId];
      
      // Cancelar cada suscripción
      Object.values(subscriptions).forEach(subscription => {
        if (typeof subscription.unsubscribe === 'function') {
          try {
            subscription.unsubscribe();
          } catch (error) {
            console.error(`Error al cancelar suscripción a ${subscription.eventName}:`, error);
          }
        }
      });
      
      // Eliminar todas las suscripciones del plugin
      delete this.pluginSubscriptions[pluginId];
      
      return true;
    } catch (error) {
      console.error(`Error al cancelar todas las suscripciones del plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Obtiene todas las suscripciones de un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {Array} - Lista de suscripciones
   */
  getPluginSubscriptions(pluginId) {
    if (!pluginId || !this.pluginSubscriptions[pluginId]) {
      return [];
    }
    
    try {
      const subscriptions = this.pluginSubscriptions[pluginId];
      
      return Object.entries(subscriptions).map(([id, subscription]) => ({
        id: parseInt(id),
        eventName: subscription.eventName
      }));
    } catch (error) {
      console.error(`Error al obtener suscripciones del plugin ${pluginId}:`, error);
      return [];
    }
  }

  /**
   * Obtiene estadísticas de uso del sistema de eventos
   * @returns {Object} - Estadísticas
   */
  getStats() {
    try {
      const stats = {
        totalPlugins: Object.keys(this.pluginSubscriptions).length,
        totalSubscriptions: 0,
        eventsWithListeners: Array.from(this.listeningEvents),
        subscriptionsByPlugin: {}
      };
      
      // Calcular estadísticas
      Object.entries(this.pluginSubscriptions).forEach(([pluginId, subscriptions]) => {
        const count = Object.keys(subscriptions).length;
        stats.totalSubscriptions += count;
        stats.subscriptionsByPlugin[pluginId] = count;
      });
      
      return stats;
    } catch (error) {
      console.error('Error al generar estadísticas de eventos:', error);
      return {
        totalPlugins: 0,
        totalSubscriptions: 0,
        eventsWithListeners: [],
        subscriptionsByPlugin: {}
      };
    }
  }
}

// Exportar instancia única
const pluginEvents = new PluginEvents();
export default pluginEvents;