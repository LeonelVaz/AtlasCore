/**
 * EventBus - Sistema centralizado de comunicación entre módulos
 * 
 * Implementa el patrón publicador/suscriptor para comunicación desacoplada
 */

// Categorías de eventos
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
   * Suscribe una función a un tipo de evento
   */
  subscribe(eventType, callback) {
    const id = this.getNextId();
    
    if (!this.subscribers[eventType]) {
      this.subscribers[eventType] = {};
    }
    
    this.subscribers[eventType][id] = callback;
    
    // Devolver función para cancelar suscripción
    return () => {
      delete this.subscribers[eventType][id];
      
      if (Object.keys(this.subscribers[eventType]).length === 0) {
        delete this.subscribers[eventType];
      }
    };
  }

  /**
   * Publica un evento para todos los suscriptores
   */
  publish(eventType, data) {
    if (!this.subscribers[eventType]) return;
    
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
   * @private
   */
  getNextId() {
    return ++this.lastId;
  }
}

// Exportar instancia única
const eventBus = new EventBus();
export default eventBus;