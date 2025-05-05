import React, { useState, useEffect } from 'react';
import { publishEvent, subscribeToEvent, EVENT_TYPES } from '../../core/bus/EventBus';
import { registerModule } from '../../core/module/ModuleRegistry';
import '../../styles/calendar/CalendarMain.css';

/**
 * Componente principal del calendario
 * Implementa la vista semanal básica con funcionalidad mínima viable
 */
const CalendarMain = () => {
  // Estado para los eventos del calendario
  const [events, setEvents] = useState([]);
  // Estado para la semana actual (fecha de inicio de la semana)
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  // Estado para el evento que se está editando
  const [editingEvent, setEditingEvent] = useState(null);

  // Horas del día para la rejilla temporal (de 8:00 a 20:00)
  const hours = Array.from({ length: 13 }, (_, i) => i + 8);
  // Días de la semana
  const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // Efecto para cargar eventos al iniciar
  useEffect(() => {
    loadEvents();

    // Registrar el módulo de calendario
    registerCalendarModule();

    // Suscribirse a cambios de semana
    const unsubscribe = subscribeToEvent(EVENT_TYPES.CALENDAR.WEEK_CHANGED, (weekStart) => {
      setCurrentWeekStart(weekStart);
      loadEvents(); // Recargar eventos al cambiar de semana
    });

    return () => {
      unsubscribe(); // Limpiar suscripción al desmontar
    };
  }, []);

  // Función para registrar el módulo de calendario
  const registerCalendarModule = () => {
    const calendarAPI = {
      getCurrentWeek: () => currentWeekStart,
      getEvents: () => events,
      createEvent: createEvent,
      updateEvent: updateEvent,
      deleteEvent: deleteEvent,
      navigateToWeek: navigateToWeek
    };

    registerModule('calendar', calendarAPI);
  };

  // Función para cargar eventos desde localStorage
  const loadEvents = () => {
    try {
      const storedEvents = localStorage.getItem('calendar_events');
      if (storedEvents) {
        setEvents(JSON.parse(storedEvents));
      }
    } catch (error) {
      console.error('Error al cargar eventos:', error);
    }
  };

  // Función para guardar eventos en localStorage
  const saveEvents = (updatedEvents) => {
    try {
      localStorage.setItem('calendar_events', JSON.stringify(updatedEvents));
    } catch (error) {
      console.error('Error al guardar eventos:', error);
    }
  };

  // Función para crear un nuevo evento
  const createEvent = (event) => {
    const newEvent = {
      ...event,
      id: Date.now().toString(), // ID único basado en timestamp
    };

    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    saveEvents(updatedEvents);

    // Publicar evento de creación
    publishEvent(EVENT_TYPES.CALENDAR.EVENT_CREATED, newEvent);

    return newEvent;
  };

  // Función para actualizar un evento existente
  const updateEvent = (updatedEvent) => {
    const updatedEvents = events.map(event => 
      event.id === updatedEvent.id ? updatedEvent : event
    );

    setEvents(updatedEvents);
    saveEvents(updatedEvents);

    // Publicar evento de actualización
    publishEvent(EVENT_TYPES.CALENDAR.EVENT_UPDATED, updatedEvent);

    return updatedEvent;
  };

  // Función para eliminar un evento
  const deleteEvent = (eventId) => {
    const updatedEvents = events.filter(event => event.id !== eventId);
    
    setEvents(updatedEvents);
    saveEvents(updatedEvents);

    // Publicar evento de eliminación
    publishEvent(EVENT_TYPES.CALENDAR.EVENT_DELETED, { id: eventId });

    return true;
  };

  // Función para navegar a la semana anterior
  const goToPreviousWeek = () => {
    const prevWeek = new Date(currentWeekStart);
    prevWeek.setDate(prevWeek.getDate() - 7);
    setCurrentWeekStart(prevWeek);
    publishEvent(EVENT_TYPES.CALENDAR.WEEK_CHANGED, prevWeek);
  };

  // Función para navegar a la semana siguiente
  const goToNextWeek = () => {
    const nextWeek = new Date(currentWeekStart);
    nextWeek.setDate(nextWeek.getDate() + 7);
    setCurrentWeekStart(nextWeek);
    publishEvent(EVENT_TYPES.CALENDAR.WEEK_CHANGED, nextWeek);
  };

  // Función para navegar a la semana actual
  const goToCurrentWeek = () => {
    const today = new Date();
    const weekStart = getStartOfWeek(today);
    setCurrentWeekStart(weekStart);
    publishEvent(EVENT_TYPES.CALENDAR.WEEK_CHANGED, weekStart);
  };

  // Función para navegar a una semana específica
  const navigateToWeek = (date) => {
    const weekStart = getStartOfWeek(date);
    setCurrentWeekStart(weekStart);
    publishEvent(EVENT_TYPES.CALENDAR.WEEK_CHANGED, weekStart);
  };

  // Función para obtener el inicio de la semana (lunes) de una fecha
  function getStartOfWeek(date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajustar cuando es domingo
    const monday = new Date(date);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  // Función para formatear la fecha en formato legible
  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  // Función para manejar clic en una celda de tiempo (crear evento)
  const handleTimeSlotClick = (day, hour) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + day);
    date.setHours(hour, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(hour + 1, 0, 0, 0);

    const newEvent = {
      title: 'Nuevo evento',
      start: date.toISOString(),
      end: endDate.toISOString(),
      color: '#3788d8'
    };

    createEvent(newEvent);
  };

  // Función para manejar clic en un evento (editar)
  const handleEventClick = (event) => {
    setEditingEvent(event);
  };

  // Función para guardar cambios en un evento en edición
  const handleSaveEvent = () => {
    if (editingEvent) {
      updateEvent(editingEvent);
      setEditingEvent(null);
    }
  };

  // Función para cancelar la edición de un evento
  const handleCancelEdit = () => {
    setEditingEvent(null);
  };

  // Función para manejar cambios en los campos del evento en edición
  const handleEventChange = (field, value) => {
    setEditingEvent({
      ...editingEvent,
      [field]: value
    });
  };

  // Función para verificar si hay un evento en una hora y día específicos
  const getEventsForTimeSlot = (day, hour) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + day);
    date.setHours(hour, 0, 0, 0);
    
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      // Verificar si el evento está en esta hora
      return eventStart.getDate() === date.getDate() && 
             eventStart.getMonth() === date.getMonth() &&
             eventStart.getFullYear() === date.getFullYear() &&
             eventStart.getHours() === hour;
    });
  };

  // Renderizar fechas de la semana actual
  const renderWeekDates = () => {
    return weekDays.map((day, index) => {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + index);
      return (
        <div key={index} className="calendar-header-cell">
          <div className="day-name">{day}</div>
          <div className="day-date">{formatDate(date)}</div>
        </div>
      );
    });
  };

  // Renderizar la rejilla de tiempo
  const renderTimeGrid = () => {
    return hours.map(hour => (
      <div key={hour} className="time-row">
        <div className="time-label">{`${hour}:00`}</div>
        {weekDays.map((_, dayIndex) => (
          <div 
            key={dayIndex} 
            className="time-cell"
            onClick={() => handleTimeSlotClick(dayIndex, hour)}
          >
            {renderEventsInCell(dayIndex, hour)}
          </div>
        ))}
      </div>
    ));
  };

  // Renderizar eventos en una celda específica
  const renderEventsInCell = (day, hour) => {
    const cellEvents = getEventsForTimeSlot(day, hour);
    
    return cellEvents.map(event => (
      <div 
        key={event.id} 
        className="calendar-event"
        style={{ backgroundColor: event.color }}
        onClick={(e) => {
          e.stopPropagation();
          handleEventClick(event);
        }}
      >
        {event.title}
      </div>
    ));
  };

  // Renderizar formulario de edición de evento
  const renderEventForm = () => {
    if (!editingEvent) return null;

    return (
      <div className="event-form-overlay">
        <div className="event-form">
          <h3>Editar Evento</h3>
          
          <div className="form-group">
            <label>Título:</label>
            <input 
              type="text" 
              value={editingEvent.title} 
              onChange={(e) => handleEventChange('title', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Inicio:</label>
            <input 
              type="datetime-local" 
              value={new Date(editingEvent.start).toISOString().slice(0, 16)} 
              onChange={(e) => handleEventChange('start', new Date(e.target.value).toISOString())}
            />
          </div>
          
          <div className="form-group">
            <label>Fin:</label>
            <input 
              type="datetime-local" 
              value={new Date(editingEvent.end).toISOString().slice(0, 16)} 
              onChange={(e) => handleEventChange('end', new Date(e.target.value).toISOString())}
            />
          </div>
          
          <div className="form-group">
            <label>Color:</label>
            <input 
              type="color" 
              value={editingEvent.color} 
              onChange={(e) => handleEventChange('color', e.target.value)}
            />
          </div>
          
          <div className="form-actions">
            <button onClick={handleSaveEvent}>Guardar</button>
            <button onClick={handleCancelEdit}>Cancelar</button>
            <button 
              onClick={() => {
                deleteEvent(editingEvent.id);
                setEditingEvent(null);
              }}
              className="delete-btn"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-container">
      <div className="calendar-controls">
        <button onClick={goToPreviousWeek}>Semana Anterior</button>
        <button onClick={goToCurrentWeek}>Semana Actual</button>
        <button onClick={goToNextWeek}>Semana Siguiente</button>
      </div>
      
      <div className="calendar-header">
        <div className="time-header-cell"></div>
        {renderWeekDates()}
      </div>
      
      <div className="calendar-body">
        {renderTimeGrid()}
      </div>
      
      {renderEventForm()}
    </div>
  );
};

export default CalendarMain;