/**
 * Sistema de Bus de Eventos
 * 
 * Implementa un patrón publicador/suscriptor para permitir la comunicación
 * desacoplada entre los diferentes módulos de la aplicación.
 */

// Categorías de eventos del sistema
export const EVENT_CATEGORIES = {
  CALENDAR: 'calendar',
  APP: 'app'
};

// Tipos de eventos específicos
export const EVENT_TYPES = {
  // Eventos del calendario
  CALENDAR: {
    EVENT_CREATED: `${EVENT_CATEGORIES.CALENDAR}.event_created`,
    EVENT_UPDATED: `${EVENT_CATEGORIES.CALENDAR}.event_updated`,
    EVENT_DELETED: `${EVENT_CATEGORIES.CALENDAR}.event_deleted`,
    DATE_SELECTED: `${EVENT_CATEGORIES.CALENDAR}.date_selected`,
    WEEK_CHANGED: `${EVENT_CATEGORIES.CALENDAR}.week_changed`
  },
  // Eventos de la aplicación
  APP: {
    INITIALIZED: `${EVENT_CATEGORIES.APP}.initialized`,
    ERROR: `${EVENT_CATEGORIES.APP}.error`
  }
};

// Instancia global del bus de eventos
let eventBus = null;

/**
 * Clase EventBus - Implementa el patrón publicador/suscriptor
 */
class EventBus {
  constructor() {
    this.subscribers = {};
  }

  /**
   * Suscribe una función a un tipo de evento específico
   * @param {string} eventType - Tipo de evento
   * @param {Function} callback - Función a ejecutar cuando ocurra el evento
   * @returns {Function} - Función para cancelar la suscripción
   */
  subscribe(eventType, callback) {
    if (!this.subscribers[eventType]) {
      this.subscribers[eventType] = [];
    }
    
    this.subscribers[eventType].push(callback);
    
    // Devolver función para cancelar la suscripción
    return () => {
      this.subscribers[eventType] = this.subscribers[eventType].filter(
        subscriber => subscriber !== callback
      );
    };
  }

  /**
   * Publica un evento para todos los suscriptores
   * @param {string} eventType - Tipo de evento
   * @param {any} data - Datos asociados al evento
   */
  publish(eventType, data) {
    if (!this.subscribers[eventType]) {
      return;
    }
    
    this.subscribers[eventType].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error en suscriptor de evento ${eventType}:`, error);
      }
    });
  }

  /**
   * Elimina todas las suscripciones para un tipo de evento
   * @param {string} eventType - Tipo de evento
   */
  clearSubscriptions(eventType) {
    if (eventType) {
      delete this.subscribers[eventType];
    } else {
      this.subscribers = {};
    }
  }
}

/**
 * Inicializa el bus de eventos global
 * @returns {EventBus} - Instancia del bus de eventos
 */
export function initEventBus() {
  if (!eventBus) {
    eventBus = new EventBus();
    console.log('Bus de eventos inicializado');
  }
  return eventBus;
}

/**
 * Obtiene la instancia del bus de eventos
 * @returns {EventBus} - Instancia del bus de eventos
 */
export function getEventBus() {
  if (!eventBus) {
    return initEventBus();
  }
  return eventBus;
}

/**
 * Publica un evento en el bus
 * @param {string} eventType - Tipo de evento
 * @param {any} data - Datos asociados al evento
 */
export function publishEvent(eventType, data) {
  const bus = getEventBus();
  bus.publish(eventType, data);
}

/**
 * Suscribe una función a un evento
 * @param {string} eventType - Tipo de evento
 * @param {Function} callback - Función a ejecutar
 * @returns {Function} - Función para cancelar suscripción
 */
export function subscribeToEvent(eventType, callback) {
  const bus = getEventBus();
  return bus.subscribe(eventType, callback);
}