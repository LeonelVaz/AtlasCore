import { useState, useEffect } from 'react';
import eventBus, { EventCategories } from '../core/bus/event-bus';
import storageService from '../services/storage-service';
import { STORAGE_KEYS, EVENT_OPERATIONS } from '../core/config/constants';

/**
 * Hook para la gestión de eventos del calendario
 */
function useCalendarEvents() {
  const [events, setEvents] = useState([]);

  // Cargar eventos al iniciar
  useEffect(() => {
    loadEvents();
    
    // Suscribirse a eventos de almacenamiento
    const unsubscribe = eventBus.subscribe(
      `${EventCategories.STORAGE}.eventsUpdated`, 
      loadEvents
    );
    
    return () => unsubscribe && unsubscribe();
  }, []);

  // Cargar eventos desde almacenamiento
  const loadEvents = async () => {
    try {
      const storedEvents = await storageService.get(STORAGE_KEYS.EVENTS, []);
      
      if (!Array.isArray(storedEvents)) {
        console.error('Los datos cargados no son un array válido');
        setEvents([]);
        return;
      }
      
      // Filtrar eventos válidos
      const validEvents = storedEvents.filter(event => {
        try {
          if (!event?.id || !event?.title || !event?.start || !event?.end) return false;
          
          const startDate = new Date(event.start);
          const endDate = new Date(event.end);
          
          return !isNaN(startDate.getTime()) && !isNaN(endDate.getTime());
        } catch (error) {
          return false;
        }
      });
      
      setEvents(validEvents);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      setEvents([]);
    }
  };

  // Guardar eventos
  const saveEvents = async (updatedEvents) => {
    try {
      if (!Array.isArray(updatedEvents)) return false;
      return await storageService.set(STORAGE_KEYS.EVENTS, updatedEvents);
    } catch (error) {
      console.error('Error al guardar eventos:', error);
      return false;
    }
  };

  // Crear evento
  const createEvent = (eventData) => {
    try {
      const newEventWithId = {
        ...eventData,
        id: Date.now().toString()
      };
      
      const updatedEvents = [...events, newEventWithId];
      setEvents(updatedEvents);
      saveEvents(updatedEvents);
      
      // Publicar evento de creación
      eventBus.publish(`${EventCategories.CALENDAR}.${EVENT_OPERATIONS.CREATE}`, newEventWithId);
      
      return newEventWithId;
    } catch (error) {
      console.error('Error al crear evento:', error);
      return null;
    }
  };

  // Actualizar evento
  const updateEvent = (eventId, eventData) => {
    try {
      const updatedEvents = events.map(event => 
        event.id === eventId ? { ...eventData } : event
      );
      
      setEvents(updatedEvents);
      saveEvents(updatedEvents);
      
      const updatedEvent = updatedEvents.find(e => e.id === eventId);
      
      // Publicar evento de actualización
      if (updatedEvent) {
        eventBus.publish(`${EventCategories.CALENDAR}.${EVENT_OPERATIONS.UPDATE}`, updatedEvent);
      }
      
      return updatedEvent;
    } catch (error) {
      console.error('Error al actualizar evento:', error);
      return null;
    }
  };

  // Eliminar evento
  const deleteEvent = (eventId) => {
    try {
      const eventToDelete = events.find(e => e.id === eventId);
      const updatedEvents = events.filter(event => event.id !== eventId);
      
      setEvents(updatedEvents);
      saveEvents(updatedEvents);
      
      // Publicar evento de eliminación
      if (eventToDelete) {
        eventBus.publish(`${EventCategories.CALENDAR}.${EVENT_OPERATIONS.DELETE}`, { id: eventId });
      }
    } catch (error) {
      console.error('Error al eliminar evento:', error);
    }
  };

  return {
    events,
    getEvents: () => events,
    loadEvents,
    saveEvents,
    createEvent,
    updateEvent,
    deleteEvent
  };
}

export default useCalendarEvents;