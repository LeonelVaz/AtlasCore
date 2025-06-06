// src\core\bus\event-bus.js

/**
 * EventBus - Sistema centralizado de comunicación entre módulos
 *
 * Implementa el patrón publicador/suscriptor para comunicación desacoplada
 */

// Categorías de eventos
export const EventCategories = {
  CALENDAR: "calendar",
  APP: "app",
  STORAGE: "storage",
};

// Re-exportar todos los eventos desde events.js para compatibilidad
export {
  CalendarEvents,
  AppEvents,
  StorageEvents,
  UIEvents,
  default as Events,
} from "./events";

class EventBus {
  constructor() {
    this.subscribers = {};
    this.lastId = 0;
    // Flag para controlar el debugging
    this.debugEnabled = false;
  }

  /**
   * Suscribe una función a un tipo de evento
   * @param {string} eventType - Tipo de evento a suscribir
   * @param {Function} callback - Función a llamar cuando ocurra el evento
   * @returns {Function} - Función para cancelar suscripción
   */
  subscribe(eventType, callback) {
    const id = this.getNextId();

    if (!this.subscribers[eventType]) {
      this.subscribers[eventType] = {};
    }

    this.subscribers[eventType][id] = callback;

    // Devolver función para cancelar suscripción
    return () => {
      if (this.subscribers[eventType] && this.subscribers[eventType][id]) {
        delete this.subscribers[eventType][id];

        if (Object.keys(this.subscribers[eventType]).length === 0) {
          delete this.subscribers[eventType];
        }
      }
    };
  }

  /**
   * Cancela una suscripción a un evento
   * @param {string} eventType - Tipo de evento
   * @param {Function} callback - Función de callback a eliminar
   */
  unsubscribe(eventType, callback) {
    if (!eventType || !callback || !this.subscribers[eventType]) return;

    // Buscar el id del callback
    const entries = Object.entries(this.subscribers[eventType] || {});
    for (const [id, registeredCallback] of entries) {
      if (registeredCallback === callback) {
        delete this.subscribers[eventType][id];
        break;
      }
    }

    // Limpiar categoría si está vacía
    if (
      this.subscribers[eventType] &&
      Object.keys(this.subscribers[eventType]).length === 0
    ) {
      delete this.subscribers[eventType];
    }
  }

  /**
   * Publica un evento para todos los suscriptores
   * @param {string} eventType - Tipo de evento a publicar
   * @param {*} data - Datos a pasar a los suscriptores
   */
  publish(eventType, data) {
    if (!eventType) return;

    // Solo log si el debug está habilitado
    if (this.debugEnabled) {
      console.log(`[EventBus] Publicando evento: ${eventType}`, data);
    }

    if (!this.subscribers[eventType]) {
      if (this.debugEnabled) {
        console.log(`[EventBus] No hay suscriptores para: ${eventType}`);
      }
      return;
    }

    const subscriberCount = Object.keys(this.subscribers[eventType]).length;
    if (this.debugEnabled && subscriberCount > 0) {
      console.log(
        `[EventBus] Notificando a ${subscriberCount} suscriptores de ${eventType}`
      );
    }

    Object.values(this.subscribers[eventType] || {}).forEach((callback) => {
      if (typeof callback === "function") {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en suscriptor de evento ${eventType}:`, error);
        }
      }
    });
  }

  /**
   * Genera un ID único para cada suscripción
   * @private
   */
  getNextId() {
    return ++this.lastId;
  }

  /**
   * Verifica si un evento tiene suscriptores
   * @param {string} eventType - Tipo de evento
   * @returns {boolean} - true si tiene suscriptores
   */
  hasSubscribers(eventType) {
    return (
      !!this.subscribers[eventType] &&
      Object.keys(this.subscribers[eventType] || {}).length > 0
    );
  }

  /**
   * Obtiene la cantidad de suscriptores de un evento
   * @param {string} eventType - Tipo de evento
   * @returns {number} - Cantidad de suscriptores
   */
  getSubscriberCount(eventType) {
    if (!eventType || !this.subscribers[eventType]) return 0;
    return Object.keys(this.subscribers[eventType] || {}).length;
  }

  /**
   * Elimina todas las suscripciones
   */
  clear() {
    this.subscribers = {};
  }

  /**
   * Obtiene lista de todos los eventos con suscriptores
   * Útil para depuración
   */
  getActiveEvents() {
    return Object.keys(this.subscribers);
  }

  /**
   * Habilita o deshabilita el modo debug
   * @param {boolean} enabled - true para habilitar debug
   */
  setDebugMode(enabled) {
    this.debugEnabled = enabled;
  }
}

// Exportar instancia única
const eventBus = new EventBus();
export default eventBus;
