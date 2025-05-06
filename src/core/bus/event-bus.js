/**
 * EventBus - Sistema centralizado de comunicación entre módulos
 * 
 * Implementa el patrón publicador/suscriptor para permitir la comunicación
 * desacoplada entre diferentes partes de la aplicación.
 */

// Categorías de eventos para organizar la comunicación
export const EventCategories = {
  CALENDAR: 'calendar',
  APP: 'app',
  STORAGE: 'storage'
};

class EventBus {
  constructor() {
    this.subscribers = {};
    this.lastId = 0;
  }

  /**
   * Suscribe una función a un tipo de evento específico
   * @param {string} eventType - Tipo de evento al que suscribirse
   * @param {Function} callback - Función a ejecutar cuando ocurra el evento
   * @returns {Function} - Función para cancelar la suscripción
   */
  subscribe(eventType, callback) {
    const id = this.getNextId();
    
    if (!this.subscribers[eventType]) {
      this.subscribers[eventType] = {};
    }
    
    this.subscribers[eventType][id] = callback;
    
    // Devolver función para cancelar la suscripción
    return () => {
      delete this.subscribers[eventType][id];
      
      // Limpiar el objeto si no quedan suscriptores
      if (Object.keys(this.subscribers[eventType]).length === 0) {
        delete this.subscribers[eventType];
      }
    };
  }

  /**
   * Publica un evento para todos los suscriptores
   * @param {string} eventType - Tipo de evento a publicar
   * @param {any} data - Datos asociados al evento
   */
  publish(eventType, data) {
    if (!this.subscribers[eventType]) {
      return;
    }
    
    Object.values(this.subscribers[eventType]).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error en suscriptor de evento ${eventType}:`, error);
      }
    });
  }

  /**
   * Genera un ID único para cada suscripción
   * @returns {number} - ID único
   * @private
   */
  getNextId() {
    return ++this.lastId;
  }
}

// Exportar una única instancia para toda la aplicación
const eventBus = new EventBus();
export default eventBus;