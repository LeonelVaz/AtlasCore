// calendar-main.jsx

import React, { useState, useEffect } from 'react';
import eventBus, { EventCategories } from '../../core/bus/event-bus';
import { registerModule } from '../../core/module/module-registry';
import { 
  getFirstDayOfWeek, 
  formatDate, 
  formatHour, 
  generateWeekDays 
} from '../../utils/date-utils';
import '../../styles/calendar/calendar-main.css';

/**
 * Componente principal del calendario con vista semanal
 * Implementa la funcionalidad básica de visualización y gestión de eventos
 */
function CalendarMain() {
  // Estado para almacenar eventos y fecha actual
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    id: '',
    title: '',
    start: '',
    end: '',
    color: '#2D4B94' // Color predeterminado (Azul Atlas)
  });

  // Obtener eventos del almacenamiento al cargar
  useEffect(() => {
    loadEvents();
    
    // Registrar el módulo de calendario
    registerModule('calendar', {
      getEvents: () => events,
      createEvent: createEvent,
      updateEvent: updateEvent,
      deleteEvent: deleteEvent
    });
    
    // Suscribirse a eventos relevantes
    const unsubscribe = eventBus.subscribe(
      `${EventCategories.STORAGE}.eventsUpdated`, 
      loadEvents
    );
    
    return () => {
      unsubscribe(); // Limpiar suscripción al desmontar
    };
  }, []);

  // Cargar eventos desde localStorage
  const loadEvents = () => {
    try {
      const storedEvents = localStorage.getItem('atlas_events');
      if (storedEvents) {
        setEvents(JSON.parse(storedEvents));
      }
    } catch (error) {
      console.error('Error al cargar eventos:', error);
    }
  };

  // Guardar eventos en localStorage
  const saveEvents = (updatedEvents) => {
    try {
      localStorage.setItem('atlas_events', JSON.stringify(updatedEvents));
      eventBus.publish(`${EventCategories.STORAGE}.eventsUpdated`, updatedEvents);
    } catch (error) {
      console.error('Error al guardar eventos:', error);
    }
  };

  // Crear un nuevo evento
  const createEvent = (eventData) => {
    const newEventWithId = {
      ...eventData,
      id: Date.now().toString() // ID único basado en timestamp
    };
    
    const updatedEvents = [...events, newEventWithId];
    setEvents(updatedEvents);
    saveEvents(updatedEvents);
    return newEventWithId;
  };

  // Actualizar un evento existente
  const updateEvent = (eventId, eventData) => {
    const updatedEvents = events.map(event => 
      event.id === eventId ? { ...event, ...eventData } : event
    );
    
    setEvents(updatedEvents);
    saveEvents(updatedEvents);
    return updatedEvents.find(e => e.id === eventId);
  };

  // Eliminar un evento
  const deleteEvent = (eventId) => {
    const updatedEvents = events.filter(event => event.id !== eventId);
    setEvents(updatedEvents);
    saveEvents(updatedEvents);
  };

  // Navegar a la semana anterior
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  // Navegar a la semana siguiente
  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  // Ir a la semana actual
  const goToCurrentWeek = () => {
    setCurrentDate(new Date());
  };

  // Generar las horas del día (de 0 a 23)
  const generateHours = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i);
    }
    return hours;
  };

  // Manejar clic en una celda de tiempo para crear evento
  const handleCellClick = (day, hour) => {
    // Crear nuevas fechas con la hora correcta
    const startDate = new Date(day);
    startDate.setHours(hour, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setHours(hour + 1, 0, 0, 0);
    
    // Formatear las fechas para el formato datetime-local
    const formatDateForInput = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    setNewEvent({
      id: '',
      title: 'Nuevo evento',
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      startFormatted: formatDateForInput(startDate),
      endFormatted: formatDateForInput(endDate),
      color: '#2D4B94'
    });
    
    setShowEventForm(true);
  };

  // Manejar clic en un evento existente
  const handleEventClick = (event) => {
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    
    // Formatear las fechas para el formato datetime-local
    const formatDateForInput = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    
    setSelectedEvent(event);
    setNewEvent({
      ...event,
      start: event.start,
      end: event.end,
      startFormatted: formatDateForInput(startDate),
      endFormatted: formatDateForInput(endDate)
    });
    setShowEventForm(true);
  };

  // Manejar cambios en el formulario de evento
  const handleEventFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'start' || name === 'end') {
      // Para los campos de fecha, necesitamos actualizar tanto el valor ISO como el formateado
      const date = new Date(value);
      setNewEvent(prev => ({ 
        ...prev, 
        [name]: date.toISOString(),
        [`${name}Formatted`]: value 
      }));
    } else {
      setNewEvent(prev => ({ ...prev, [name]: value }));
    }
  };

  // Función para cerrar y reiniciar el formulario
  const handleCloseForm = () => {
    setShowEventForm(false);
    setSelectedEvent(null);
    setNewEvent({
      id: '',
      title: '',
      start: '',
      end: '',
      startFormatted: '',
      endFormatted: '',
      color: '#2D4B94'
    });
  };

  // Guardar evento (crear nuevo o actualizar existente)
  const handleSaveEvent = () => {
    // Crear una versión del evento sin los campos de formato para guardar
    const eventToSave = {
      ...newEvent,
      id: newEvent.id || Date.now().toString(),
      start: newEvent.start,
      end: newEvent.end
    };
    
    // Eliminar los campos formateados que solo se usan para la UI
    delete eventToSave.startFormatted;
    delete eventToSave.endFormatted;
    
    if (selectedEvent) {
      updateEvent(selectedEvent.id, eventToSave);
    } else {
      createEvent(eventToSave);
    }
    
    handleCloseForm();
  };

  // Eliminar evento seleccionado
  const handleDeleteEvent = () => {
    if (selectedEvent) {
      deleteEvent(selectedEvent.id);
      handleCloseForm();
    }
  };

  // Verificar si un evento debe mostrarse en un día y hora específicos
  const shouldShowEvent = (event, day, hour) => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    const cellDate = new Date(day);
    cellDate.setHours(hour, 0, 0, 0);
    
    const cellEndDate = new Date(cellDate);
    cellEndDate.setHours(hour + 1, 0, 0, 0);
    
    return (
      eventStart.getDate() === day.getDate() &&
      eventStart.getMonth() === day.getMonth() &&
      eventStart.getFullYear() === day.getFullYear() &&
      eventStart.getHours() === hour
    );
  };

  // Renderizar eventos en la celda correspondiente
  const renderEvents = (day, hour) => {
    return events.filter(event => shouldShowEvent(event, day, hour)).map(event => (
      <div 
        key={event.id}
        className="calendar-event"
        style={{ backgroundColor: event.color }}
        onClick={() => handleEventClick(event)}
      >
        <div className="event-title">{event.title}</div>
        <div className="event-time">
          {new Date(event.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          {' - '}
          {new Date(event.end).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    ));
  };

  const weekDays = generateWeekDays(currentDate);
  const hours = generateHours();

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-navigation">
          <button onClick={goToPreviousWeek}>Semana anterior</button>
          <button onClick={goToCurrentWeek}>Semana actual</button>
          <button onClick={goToNextWeek}>Semana siguiente</button>
        </div>
        <div className="calendar-title">
          {weekDays.length > 0 && (
            <h2>
              {new Date(weekDays[0]).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h2>
          )}
        </div>
      </div>

      <div className="calendar-grid">
        {/* Encabezado con días de la semana */}
        <div className="calendar-row calendar-header-row">
          <div className="calendar-cell calendar-time-header"></div>
          {weekDays.map((day, index) => (
            <div 
              key={index} 
              className="calendar-cell calendar-day-header"
              data-testid="calendar-day-header"
            >
              {formatDate(day, { 
                weekday: 'short', 
                day: 'numeric', 
                month: 'short' 
              })}
            </div>
          ))}
        </div>

        {/* Filas de horas */}
        {hours.map((hour) => (
          <div key={hour} className="calendar-row">
            <div className="calendar-cell calendar-time">
              {formatHour(hour)}
            </div>
            
            {weekDays.map((day, dayIndex) => (
              <div 
                key={dayIndex} 
                className="calendar-cell calendar-time-slot"
                data-testid="calendar-time-slot"
                onClick={() => handleCellClick(day, hour)}
              >
                {renderEvents(day, hour)}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Formulario para crear/editar eventos */}
      {showEventForm && (
        <div className="event-form-overlay" data-testid="event-form-overlay">
          <div className="event-form">
            <h3>{selectedEvent ? 'Editar evento' : 'Nuevo evento'}</h3>
            
            <div className="form-group">
              <label htmlFor="event-title">Título:</label>
              <input 
                id="event-title"
                type="text" 
                name="title" 
                value={newEvent.title} 
                onChange={handleEventFormChange} 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="event-start">Inicio:</label>
              <input 
                id="event-start"
                type="datetime-local" 
                name="start" 
                value={newEvent.startFormatted} 
                onChange={handleEventFormChange} 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="event-end">Fin:</label>
              <input 
                id="event-end"
                type="datetime-local" 
                name="end" 
                value={newEvent.endFormatted} 
                onChange={handleEventFormChange} 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="event-color">Color:</label>
              <input 
                id="event-color"
                type="color" 
                name="color" 
                value={newEvent.color} 
                onChange={handleEventFormChange} 
              />
            </div>
            
            <div className="form-actions">
              <button onClick={handleSaveEvent}>Guardar</button>
              {selectedEvent && (
                <button onClick={handleDeleteEvent} className="delete-button">
                  Eliminar
                </button>
              )}
              <button onClick={handleCloseForm}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarMain;