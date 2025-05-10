// calendar-main.jsx
import React, { useState, useEffect } from 'react';
import eventBus, { EventCategories } from '../../core/bus/event-bus';
import { registerModule, unregisterModule } from '../../core/module/module-registry';
import WeekView from './week-view';
import DayView from './day-view';
import EventForm from './event-form';
import SnapControl from './snap-control';
import storageService from '../../services/storage-service';
import '../../styles/calendar/calendar-main.css';

/**
 * Componente principal del calendario con vista semanal y diaria
 */
function CalendarMain() {
  // Estados principales
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [view, setView] = useState('week'); // 'week' o 'day'
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [snapValue, setSnapValue] = useState(0); // 0 = desactivado por defecto
  const [newEvent, setNewEvent] = useState({
    id: '',
    title: '',
    start: '',
    end: '',
    color: '#2d4b94' // Color predeterminado (Azul Atlas)
  });

  // Obtener eventos actuales
  const getEvents = () => events;

  // Cargar eventos al iniciar y registrar módulo
  useEffect(() => {
    loadEvents();
    
    // Registrar API del calendario
    const moduleAPI = {
      getEvents,
      createEvent,
      updateEvent,
      deleteEvent
    };
    registerModule('calendar', moduleAPI);
    
    // Suscribirse a eventos de almacenamiento
    const unsubscribe = eventBus.subscribe(
      `${EventCategories.STORAGE}.eventsUpdated`, 
      loadEvents
    );
    
    return () => { 
      unsubscribe && unsubscribe(); 
      unregisterModule('calendar'); 
    };
  }, []);

  // Exponer funciones de depuración
  useEffect(() => {
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
  }, [events]);

  // Cargar eventos desde almacenamiento
  const loadEvents = async () => {
    try {
      const storedEvents = await storageService.get('atlas_events', []);
      
      if (!Array.isArray(storedEvents)) {
        console.error('Error: Los datos cargados no son un array válido de eventos');
        setEvents([]);
        return;
      }
      
      // Filtrar eventos válidos
      const validEvents = storedEvents.filter(event => {
        try {
          if (!event || typeof event !== 'object') return false;
          if (!event.id || !event.title) return false;
          if (!event.start || !event.end) return false;
          
          const startDate = new Date(event.start);
          const endDate = new Date(event.end);
          
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return false;
          
          return true;
        } catch (error) {
          console.error('Error al procesar fechas del evento:', error, event);
          return false;
        }
      });
      
      setEvents(validEvents);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      setEvents([]);
    }
  };

  // Guardar eventos en almacenamiento
  const saveEvents = async (updatedEvents) => {
    try {
      if (!Array.isArray(updatedEvents)) {
        console.error('Error: Intentando guardar eventos que no son un array');
        return false;
      }
      
      const result = await storageService.set('atlas_events', updatedEvents);
      return result;
    } catch (error) {
      console.error('Error al guardar eventos:', error);
      return false;
    }
  };

  // Cambiar entre vistas
  const toggleView = (newView, date = null) => {
    setView(newView);
    if (date) {
      setSelectedDay(new Date(date));
    }
  };

  // Crear evento
  const createEvent = (eventData) => {
    try {
      const newEventWithId = {
        ...eventData,
        id: Date.now().toString() // ID único basado en timestamp
      };
      
      const updatedEvents = [...events, newEventWithId];
      setEvents(updatedEvents);
      saveEvents(updatedEvents);
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
      
      return updatedEvents.find(e => e.id === eventId);
    } catch (error) {
      console.error('Error al actualizar evento:', error);
      return null;
    }
  };

  // Eliminar evento
  const deleteEvent = (eventId) => {
    try {
      const updatedEvents = events.filter(event => event.id !== eventId);
      setEvents(updatedEvents);
      saveEvents(updatedEvents);
    } catch (error) {
      console.error('Error al eliminar evento:', error);
    }
  };

  // Navegación entre semanas
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToCurrentWeek = () => {
    setCurrentDate(new Date());
  };

  // Manejar navegación de días en vista diaria
  const goToPreviousDay = () => {
    const prevDay = new Date(selectedDay);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDay(prevDay);
  };

  const goToNextDay = () => {
    const nextDay = new Date(selectedDay);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDay(nextDay);
  };

  const goToToday = () => {
    setSelectedDay(new Date());
  };

  // Manejar clic en celda para crear evento
  const handleCellClick = (day, hour) => {
    try {
      const startDate = new Date(day);
      startDate.setHours(hour, 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setHours(hour + 1, 0, 0, 0);
      
      // Formatear fechas para inputs
      const formatDateForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };
      
      setSelectedEvent(null);
      setFormError('');
      
      setNewEvent({
        id: '',
        title: 'Nuevo evento',
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        startFormatted: formatDateForInput(startDate),
        endFormatted: formatDateForInput(endDate),
        color: '#2d4b94'
      });
      
      setShowEventForm(true);
    } catch (error) {
      console.error('Error al manejar clic en celda:', error);
    }
  };

  // Manejar clic en evento existente
  const handleEventClick = (event) => {
    try {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Fechas de evento inválidas:', event);
        return;
      }
      
      // Formatear fechas para inputs
      const formatDateForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };
      
      setSelectedEvent({...event});
      setFormError('');
      
      setNewEvent({
        id: event.id,
        title: event.title || '',
        start: event.start,
        end: event.end,
        color: event.color || '#2d4b94',
        startFormatted: formatDateForInput(startDate),
        endFormatted: formatDateForInput(endDate)
      });
      
      setShowEventForm(true);
    } catch (error) {
      console.error('Error al manejar clic en evento:', error, event);
    }
  };

  // Actualizar datos del formulario
  const handleEventFormChange = (e) => {
    try {
      const { name, value } = e.target;
      
      if (name === 'start' || name === 'end') {
        const date = new Date(value);
        
        if (isNaN(date.getTime())) {
          console.error('Fecha inválida:', value);
          return;
        }
        
        setNewEvent(prev => ({ 
          ...prev, 
          [name]: date.toISOString(),
          [`${name}Formatted`]: value 
        }));
      } else {
        setNewEvent(prev => ({ ...prev, [name]: value }));
      }
    } catch (error) {
      console.error('Error al manejar cambio en formulario:', error);
    }
  };

  // Cerrar y reiniciar formulario
  const handleCloseForm = () => {
    setShowEventForm(false);
    setSelectedEvent(null);
    setFormError('');
    setNewEvent({
      id: '',
      title: '',
      start: '',
      end: '',
      startFormatted: '',
      endFormatted: '',
      color: '#2d4b94'
    });
  };

  // Guardar evento
  const handleSaveEvent = () => {
    try {
      setFormError('');
      
      // Validar título
      if (!newEvent.title.trim()) {
        setFormError('El título del evento no puede estar vacío');
        return;
      }
      
      // Validar fechas
      const startDate = new Date(newEvent.start);
      const endDate = new Date(newEvent.end);
      
      if (endDate < startDate) {
        setFormError('La hora de fin no puede ser anterior a la hora de inicio');
        return;
      }
      
      const eventToSave = {
        id: newEvent.id || Date.now().toString(),
        title: newEvent.title.trim(),
        start: newEvent.start,
        end: newEvent.end,
        color: newEvent.color || '#2d4b94'
      };
      
      if (selectedEvent && selectedEvent.id) {
        // Actualizar existente
        updateEvent(selectedEvent.id, eventToSave);
      } else {
        // Crear nuevo
        createEvent(eventToSave);
      }
      
      handleCloseForm();
    } catch (error) {
      console.error('Error al guardar evento:', error);
      setFormError('Ocurrió un error al guardar el evento');
    }
  };

  // Eliminar evento
  const handleDeleteEvent = () => {
    try {
      if (selectedEvent) {
        deleteEvent(selectedEvent.id);
        handleCloseForm();
      }
    } catch (error) {
      console.error('Error al eliminar evento:', error);
    }
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-navigation">
          {view === 'week' ? (
            <>
              <button onClick={goToPreviousWeek}>Semana anterior</button>
              <button onClick={goToCurrentWeek}>Semana actual</button>
              <button onClick={goToNextWeek}>Semana siguiente</button>
            </>
          ) : (
            <>
              <button onClick={goToPreviousDay}>Día anterior</button>
              <button onClick={goToToday}>Hoy</button>
              <button onClick={goToNextDay}>Día siguiente</button>
            </>
          )}
        </div>
        <div className="calendar-view-toggle">
          <button 
            className={view === 'week' ? 'active' : ''} 
            onClick={() => toggleView('week')}
          >
            Vista Semanal
          </button>
          <button 
            className={view === 'day' ? 'active' : ''} 
            onClick={() => toggleView('day', selectedDay)}
          >
            Vista Diaria
          </button>
          <SnapControl
            snapValue={snapValue}
            onSnapChange={setSnapValue}
          />
        </div>
        <div className="calendar-title">
          {view === 'week' && (
            <h2>
              {new Date(currentDate).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h2>
          )}
          {view === 'day' && (
            <h2>
              {new Date(selectedDay).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h2>
          )}
        </div>
      </div>

      {view === 'week' ? (
        <WeekView 
          currentDate={currentDate}
          events={events}
          onEventClick={handleEventClick}
          onCellClick={handleCellClick}
          onUpdateEvent={updateEvent}
          snapValue={snapValue}
        />
      ) : (
        <DayView 
          date={selectedDay}
          events={events}
          onEventClick={handleEventClick}
          onTimeSlotClick={handleCellClick}
          onUpdate={updateEvent}
          snapValue={snapValue}
        />
      )}

      {showEventForm && (
        <EventForm
          event={newEvent}
          error={formError}
          isEditing={Boolean(selectedEvent)}
          onSave={handleSaveEvent}
          onChange={handleEventFormChange}
          onDelete={handleDeleteEvent}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}

// Exponer getEvents para pruebas
CalendarMain.getEvents = (component) => component.getEvents();

export default CalendarMain;