// calendar-main.jsx
import React, { useState, useEffect, useRef } from 'react';
import eventBus, { EventCategories } from '../../core/bus/event-bus';
import { registerModule, unregisterModule } from '../../core/module/module-registry';
import { 
  getFirstDayOfWeek, 
  formatDate, 
  formatHour, 
  generateWeekDays 
} from '../../utils/date-utils';
import DayView from './day-view';
import EventItem from './event-item';
import SnapControl from './snap-control';
import storageService from '../../services/storage-service';
import '../../styles/calendar/calendar-main.css';
import '../../styles/components/events.css';
import '../../styles/components/snap-control.css';

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
          
          const startDate = new Date(event.start);
          const endDate = new Date(event.end);
          
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.error('Error: Evento con fechas inválidas detectado', event);
            return false;
          }
          
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

  // Generar horas del día
  const generateHours = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i);
    }
    return hours;
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

  // Verificar si un evento comienza exactamente en esta celda
  const shouldShowEventStart = (event, day, hour) => {
    try {
      if (!event?.start) return false;
      
      const eventStart = new Date(event.start);
      
      if (isNaN(eventStart.getTime())) return false;
      
      return (
        eventStart.getDate() === day.getDate() &&
        eventStart.getMonth() === day.getMonth() &&
        eventStart.getFullYear() === day.getFullYear() &&
        eventStart.getHours() === hour
      );
    } catch (error) {
      console.error('Error al verificar inicio de evento:', error, event);
      return false;
    }
  };

  // Verificar si un evento está activo al inicio del día
  const isEventActiveAtStartOfDay = (event, day) => {
    try {
      if (!event?.start || !event?.end) return false;
      
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) return false;
      
      // Medianoche del día
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      
      // El evento comenzó antes de la medianoche y termina después
      return eventStart < dayStart && eventEnd > dayStart;
    } catch (error) {
      console.error('Error al verificar evento activo al inicio del día:', error, event);
      return false;
    }
  };

  // Renderizar eventos que continúan desde el día anterior
  const renderContinuingEvents = (day) => {
    try {
      // Filtrar eventos que continúan desde el día anterior
      const continuingEvents = events.filter(event => isEventActiveAtStartOfDay(event, day));
      
      return continuingEvents.map(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        
        // Normalizar día a medianoche
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        
        // Fin del día (23:59:59.999)
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);
        
        // Calcular si continúa al día siguiente
        const continuesNextDay = eventEnd > dayEnd;
        const visibleEnd = eventEnd > dayEnd ? dayEnd : eventEnd;
        
        // Calcular altura basada en duración visible desde medianoche
        const durationMs = visibleEnd.getTime() - dayStart.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);
        const heightPx = Math.max(20, Math.round(durationHours * 60));
        
        const eventStyle = {
          position: 'absolute',
          top: 0,
          height: `${heightPx}px`,
          left: '2px',
          right: '2px',
          zIndex: 20
        };
        
        return (
          <div 
            className={`event-wrapper continues-from-prev-day ${continuesNextDay ? 'continues-next-day' : ''}`} 
            style={eventStyle} 
            key={`continuing-${event.id}-${day.getDate()}`}
          >
            <EventItem
              key={event.id}
              event={event}
              onClick={handleEventClick}
              onUpdate={(updatedEvent) => {
                updateEvent(updatedEvent.id, updatedEvent);
              }}
              continuesNextDay={continuesNextDay}
              continuesFromPrevDay={true}
              snapValue={snapValue}
            />
          </div>
        );
      });
    } catch (error) {
      console.error('Error al renderizar eventos que continúan:', error);
      return null;
    }
  };

  // Renderizar eventos en la celda
  const renderEvents = (day, hour) => {
    try {
      // Si es la primera hora del día, mostrar eventos que continúan del día anterior
      if (hour === 0) {
        const continuingEvents = renderContinuingEvents(day);
        if (continuingEvents && continuingEvents.length > 0) {
          return continuingEvents;
        }
      }
      
      // Eventos que comienzan exactamente en esta celda
      const eventsStartingThisHour = events.filter(event => shouldShowEventStart(event, day, hour));
      
      return eventsStartingThisHour.map(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        
        // Normalizar día a medianoche
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        
        // Fin del día (23:59:59.999)
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);
        
        // Calcular si continúa al día siguiente
        const continuesNextDay = eventEnd > dayEnd;
        const visibleEnd = eventEnd > dayEnd ? dayEnd : eventEnd;
        
        // Offset basado en minutos
        const topOffset = (eventStart.getMinutes() / 60) * 60;
        
        // Calcular duración visible
        const durationMs = visibleEnd.getTime() - eventStart.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);
        const heightPx = Math.max(20, Math.round(durationHours * 60));
        
        const eventStyle = {
          position: 'absolute',
          top: `${topOffset}px`,
          height: `${heightPx}px`,
          left: '2px',
          right: '2px',
          zIndex: 20
        };
        
        return (
          <div 
            className={`event-wrapper ${continuesNextDay ? 'continues-next-day' : ''}`} 
            style={eventStyle} 
            key={`starting-${event.id}-${day.getDate()}-${hour}`}
          >
            <EventItem
              key={event.id}
              event={event}
              onClick={handleEventClick}
              onUpdate={(updatedEvent) => {
                updateEvent(updatedEvent.id, updatedEvent);
              }}
              continuesNextDay={continuesNextDay}
              continuesFromPrevDay={false}
              snapValue={snapValue}
            />
          </div>
        );
      });
    } catch (error) {
      console.error('Error al renderizar eventos:', error);
      return null;
    }
  };

  const weekDays = generateWeekDays(currentDate);
  const hours = generateHours();

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
              <button onClick={() => {
                const prevDay = new Date(selectedDay);
                prevDay.setDate(prevDay.getDate() - 1);
                setSelectedDay(prevDay);
              }}>Día anterior</button>
              <button onClick={() => setSelectedDay(new Date())}>Hoy</button>
              <button onClick={() => {
                const nextDay = new Date(selectedDay);
                nextDay.setDate(nextDay.getDate() + 1);
                setSelectedDay(nextDay);
              }}>Día siguiente</button>
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
          {view === 'week' && weekDays.length > 0 && (
            <h2>
              {new Date(weekDays[0]).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
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
        <div className="calendar-grid">
          {/* Encabezado con días */}
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

          {/* Rejilla horaria */}
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
      ) : (
        <DayView 
          date={selectedDay}
          events={events}
          onEventClick={handleEventClick}
          onTimeSlotClick={handleCellClick}
          onUpdate={(updatedEvent) => {
            updateEvent(updatedEvent.id, updatedEvent);
          }}
          snapValue={snapValue}
        />
      )}

      {/* Formulario de evento */}
      {showEventForm && (
        <div className="event-form-overlay" data-testid="event-form-overlay">
          <div className="event-form">
            <h3>{selectedEvent ? 'Editar evento' : 'Nuevo evento'}</h3>
            
            {formError && (
              <div className="form-error" style={{ color: 'red', marginBottom: '10px' }}>
                {formError}
              </div>
            )}
            
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

// Exponer getEvents para pruebas
CalendarMain.getEvents = (component) => component.getEvents();

export default CalendarMain;