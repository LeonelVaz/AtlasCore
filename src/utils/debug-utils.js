/**
 * Configura herramientas de depuración para el calendario
 * @param {Array} events - Eventos actuales del calendario
 * @param {Function} createEvent - Función para crear eventos
 * @param {Function} updateEvent - Función para actualizar eventos
 * @param {Function} saveEvents - Función para guardar eventos
 * @returns {Function} - Función para limpiar las herramientas de depuración
 */
export function setupDebugTools(events, createEvent, updateEvent, saveEvents) {
  if (typeof window !== 'undefined') {
    window.debugAtlas = {
      getEvents: () => events,
      createTestEvent: () => {
        const now = new Date();
        const start = new Date(now);
        start.setHours(start.getHours() + 1, 0, 0, 0);
        
        const end = new Date(start);
        end.setHours(end.getHours() + 1);
        
        const testEvent = {
          title: `Evento de prueba ${Date.now()}`,
          start: start.toISOString(),
          end: end.toISOString(),
          color: '#FF5722'
        };
        
        const createdEvent = createEvent(testEvent);
        console.log('Evento de prueba creado:', createdEvent);
        return createdEvent;
      },
      forceUpdate: (eventId, hoursToMove) => {
        const eventToUpdate = events.find(e => e.id === eventId);
        if (!eventToUpdate) {
          console.error('Evento no encontrado:', eventId);
          return null;
        }
        
        const startDate = new Date(eventToUpdate.start);
        const endDate = new Date(eventToUpdate.end);
        
        startDate.setHours(startDate.getHours() + hoursToMove);
        endDate.setHours(endDate.getHours() + hoursToMove);
        
        const updatedEvent = {
          ...eventToUpdate,
          start: startDate.toISOString(),
          end: endDate.toISOString()
        };
        
        const result = updateEvent(eventId, updatedEvent);
        console.log('Actualización forzada:', result);
        return result;
      },
      saveAllEvents: () => {
        saveEvents(events);
        console.log('Eventos guardados manualmente');
      }
    };
  }
  
  return () => {
    if (typeof window !== 'undefined') {
      delete window.debugAtlas;
    }
  };
}