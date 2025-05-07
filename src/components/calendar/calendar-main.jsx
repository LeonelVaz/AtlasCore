// calendar-main.jsx

import React, { useState, useEffect } from 'react';
import eventBus, { EventCategories } from '../../core/bus/event-bus';
import { registerModule, unregisterModule } from '../../core/module/module-registry';
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
    const moduleAPI = {
      // Utilizar una función de flecha para capturar el estado actual en tiempo de ejecución
      getEvents: () => events,
      
      // Usar las funciones del componente directamente
      createEvent,
      updateEvent,
      deleteEvent
    };
    
    // Registrar el módulo
    registerModule('calendar', moduleAPI);
    
    // Suscribirse a eventos relevantes
    const unsubscribe = eventBus.subscribe(
      `${EventCategories.STORAGE}.eventsUpdated`, 
      loadEvents
    );
    
    return () => {
      // Limpiar suscripción al desmontar
      unsubscribe();
      
      // Anular el registro del módulo
      unregisterModule('calendar');
    };
  }, []);

  // Cargar eventos desde localStorage
  const loadEvents = () => {
    try {
      const storedEvents = localStorage.getItem('atlas_events');
      if (storedEvents) {
        const parsedEvents = JSON.parse(storedEvents);
        
        // Validar que sea un array
        if (!Array.isArray(parsedEvents)) {
          console.error('Error: Los datos cargados no son un array válido de eventos');
          setEvents([]);
          return;
        }
        
        // Filtrar eventos válidos
        const validEvents = parsedEvents.filter(event => {
          if (!event || typeof event !== 'object') {
            console.error('Error: Evento no válido detectado', event);
            return false;
          }
          
          if (!event.id || !event.title) {
            console.error('Error: Evento sin ID o título detectado', event);
            return false;
          }
          
          if (!event.start || !event.end) {
            console.error('Error: Evento sin fechas detectado', event);
            return false;
          }
          
          try {
            const startDate = new Date(event.start);
            const endDate = new Date(event.end);
            
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
              console.error('Error: Evento con fechas inválidas detectado', event);
              return false;
            }
          } catch (error) {
            console.error('Error al procesar fechas del evento:', error, event);
            return false;
          }
          
          return true;
        });
        
        setEvents(validEvents);
      }
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      setEvents([]);
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
    // Validar que el título no esté vacío
    if (!newEvent.title.trim()) {
      // Si el título está vacío, mostrar un mensaje o simplemente no guardar
      console.error('El título del evento no puede estar vacío');
      return; // Detener la ejecución y no guardar
    }
    
    // El resto de la función sigue igual
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
    // Verificar que el evento tenga los campos necesarios
    if (!event || !event.start || !event.end) {
      console.error('Error: Evento con datos incompletos detectado', event);
      return false;
    }
    
    try {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      // Verificar que las fechas sean válidas
      if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) {
        console.error('Error: Evento con fechas inválidas detectado', event);
        return false;
      }
      
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
    } catch (error) {
      // Asegurarnos de que este error se registre siempre
      console.error('Error al procesar evento:', error, event);
      return false;
    }
  };

  // Renderizar eventos en la celda correspondiente
  const renderEvents = (day, hour) => {
    try {
      return events
        .filter(event => {
          // Validar que el evento tenga un título
          if (!event.title) {
            console.error('Error: Evento sin título detectado', event);
            return false;
          }
          return shouldShowEvent(event, day, hour);
        })
        .map(event => {
          try {
            return (
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
            );
          } catch (error) {
            // Asegurar que este error se registre siempre
            console.error('Error al renderizar evento específico:', error, event);
            return null; // Devolver null para que React lo ignore sin romper el renderizado
          }
        });
    } catch (error) {
      // Asegurar que este error se registre siempre
      console.error('Error general al renderizar eventos:', error);
      return null; // Devolver null para que React pueda seguir con el renderizado
    }
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