/**
 * Configura herramientas de depuración para el calendario
 */
export function setupDebugTools(events, createEvent, updateEvent, saveEvents) {
  if (typeof window === 'undefined') return () => {};
  
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
      
      return createEvent(testEvent);
    },
    forceUpdate: (eventId, hoursToMove) => {
      const eventToUpdate = events.find(e => e.id === eventId);
      if (!eventToUpdate) return null;
      
      const startDate = new Date(eventToUpdate.start);
      const endDate = new Date(eventToUpdate.end);
      
      startDate.setHours(startDate.getHours() + hoursToMove);
      endDate.setHours(endDate.getHours() + hoursToMove);
      
      const updatedEvent = {
        ...eventToUpdate,
        start: startDate.toISOString(),
        end: endDate.toISOString()
      };
      
      return updateEvent(eventId, updatedEvent);
    },
    saveAllEvents: () => {
      saveEvents(events);
      return 'Eventos guardados manualmente';
    }
  };
  
  return () => {
    if (typeof window !== 'undefined') {
      delete window.debugAtlas;
    }
  };
}