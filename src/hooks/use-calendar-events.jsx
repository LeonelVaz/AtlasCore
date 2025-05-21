import { useState, useEffect } from 'react';
import eventBus, { EventCategories, CalendarEvents } from '../core/bus/event-bus';
import storageService from '../services/storage-service';
import { STORAGE_KEYS } from '../core/config/constants';

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
      
      // Publicar evento de creación con el nombre correcto
      eventBus.publish(CalendarEvents.EVENT_CREATED, { 
        event: newEventWithId 
      });
      
      return newEventWithId;
    } catch (error) {
      console.error('Error al crear evento:', error);
      return null;
    }
  };

  // Actualizar evento
  const updateEvent = (eventId, eventData) => {
    try {
      // Obtener el evento anterior antes de actualizar
      const oldEvent = events.find(e => e.id === eventId);
      if (!oldEvent) {
        console.error('Evento no encontrado:', eventId);
        return null;
      }

      const updatedEvents = events.map(event => 
        event.id === eventId ? { ...eventData } : event
      );
      
      setEvents(updatedEvents);
      saveEvents(updatedEvents);
      
      const updatedEvent = updatedEvents.find(e => e.id === eventId);
      
      // Publicar evento de actualización con el nombre correcto y datos completos
      if (updatedEvent) {
        eventBus.publish(CalendarEvents.EVENT_UPDATED, { 
          oldEvent: oldEvent,
          newEvent: updatedEvent 
        });
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
      if (!eventToDelete) {
        console.error('Evento no encontrado:', eventId);
        return;
      }

      const updatedEvents = events.filter(event => event.id !== eventId);
      
      setEvents(updatedEvents);
      saveEvents(updatedEvents);
      
      // Publicar evento de eliminación con el nombre correcto
      eventBus.publish(CalendarEvents.EVENT_DELETED, { 
        event: eventToDelete 
      });
    } catch (error) {
      console.error('Error al eliminar evento:', error);
    }
  };

  // Cargar todos los eventos cuando se inicializa
  useEffect(() => {
    // Disparar evento de carga de eventos completada
    if (events.length > 0 || events.length === 0) {
      eventBus.publish(CalendarEvents.EVENTS_LOADED, { 
        events: events,
        count: events.length
      });
    }
  }, [events]);

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