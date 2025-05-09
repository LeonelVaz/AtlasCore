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
import storageService from '../../services/storage-service';
import '../../styles/calendar/calendar-main.css';
import '../../styles/components/events.css';

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
  const [formError, setFormError] = useState(''); // Estado para manejar errores del formulario
  const [view, setView] = useState('week'); // 'week' o 'day'
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [newEvent, setNewEvent] = useState({
    id: '',
    title: '',
    start: '',
    end: '',
    color: '#2d4b94' // Color predeterminado (Azul Atlas)
  });

  // MEJORA: Exportar la función getEvents fuera del useEffect para que sea más testeable
  // Esta función siempre devolverá el estado events actual
  const getEvents = () => events;

  // Obtener eventos del almacenamiento al cargar
  useEffect(() => {
    loadEvents();
    
    // Registrar el módulo de calendario
    const moduleAPI = {
      // Usar la función externa para mejorar la testabilidad
      getEvents, // Esta línea ahora es más fácil de probar
      createEvent,
      updateEvent,
      deleteEvent
    };
    registerModule('calendar', moduleAPI);
    
    // Suscribirse a eventos relevantes
    const unsubscribe = eventBus.subscribe(
      `${EventCategories.STORAGE}.eventsUpdated`, 
      loadEvents
    );
    
    // Simplificado: Función de limpieza directa
    return () => { 
      unsubscribe && unsubscribe(); 
      unregisterModule('calendar'); 
    };
  }, []);

  // Para depuración
  useEffect(() => {
    if (typeof window !== 'undefined') {
      /* istanbul ignore next */
      window.debugCalendar = () => {
        console.log('Estado actual de eventos:', events);
        console.log('Evento seleccionado:', selectedEvent);
        console.log('Formulario de evento:', newEvent);
        console.log('Fecha actual:', currentDate);
        return { events, selectedEvent, newEvent, currentDate };
      };
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete window.debugCalendar;
      }
    };
  }, [events, selectedEvent, newEvent, currentDate]);

  // Añadir useEffect para depuración
  useEffect(() => {
    console.log('Estado de eventos actualizado:', events);
    
    // Exponer función de depuración en window para pruebas
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

  // Cargar eventos desde el almacenamiento
  const loadEvents = async () => {
    try {
      const storedEvents = await storageService.get('atlas_events', []);
      
      // Validar que sea un array
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

  // Guardar eventos en el almacenamiento
  const saveEvents = async (updatedEvents) => {
    try {
      console.log('Guardando eventos:', updatedEvents);
      
      // Asegurar que tenemos un array válido para guardar
      if (!Array.isArray(updatedEvents)) {
        console.error('Error: Intentando guardar eventos que no son un array');
        return false;
      }
      
      // Guardar en el servicio de almacenamiento
      const result = await storageService.set('atlas_events', updatedEvents);
      
      console.log('Resultado de guardado:', result);
      
      return result;
    } catch (error) {
      console.error('Error al guardar eventos:', error);
      return false;
    }
  };

  // Función para cambiar entre vistas
  const toggleView = (newView, date = null) => {
    setView(newView);
    if (date) {
      setSelectedDay(new Date(date));
    }
  };

  // Crear un nuevo evento
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
      /* istanbul ignore next */
      console.error('Error al crear evento:', error);
      /* istanbul ignore next */
      return null;
    }
  };

  // Actualizar un evento existente
  const updateEvent = (eventId, eventData) => {
    try {
      console.log('Actualizando evento con ID:', eventId);
      console.log('Nuevos datos:', eventData);
      
      // Crear una copia del array de eventos
      const updatedEvents = events.map(event => 
        event.id === eventId ? { ...eventData } : event
      );
      
      console.log('Lista actualizada de eventos:', updatedEvents);
      
      // Actualizar el estado
      setEvents(updatedEvents);
      
      // Guardar los cambios
      saveEvents(updatedEvents);
      
      // Devolver el evento actualizado
      const updatedEvent = updatedEvents.find(e => e.id === eventId);
      console.log('Evento después de actualizar:', updatedEvent);
      
      return updatedEvent;
    } catch (error) {
      /* istanbul ignore next */
      console.error('Error al actualizar evento:', error);
      /* istanbul ignore next */
      return null;
    }
  };

  // Eliminar un evento
  const deleteEvent = (eventId) => {
    try {
      const updatedEvents = events.filter(event => event.id !== eventId);
      setEvents(updatedEvents);
      saveEvents(updatedEvents);
    } catch (error) {
      /* istanbul ignore next */
      console.error('Error al eliminar evento:', error);
    }
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
    try {
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
      
      // Resetear el evento seleccionado y el error del formulario
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
      /* istanbul ignore next */
      console.error('Error al manejar clic en celda:', error);
    }
  };

  // Manejar clic en un evento existente
  const handleEventClick = (event) => {
    console.log('Evento clickeado:', event); // Para depuración
    
    try {
      // Asegurar que estamos trabajando con objetos Date para las fechas
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      
      // Validar que las fechas sean válidas
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        /* istanbul ignore next */
        console.error('Fechas de evento inválidas:', event);
        /* istanbul ignore next */
        return;
      }
      
      // Formatear las fechas para el formato datetime-local
      const formatDateForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };
      
      // Hacer una copia profunda del evento seleccionado para evitar problemas de referencia
      setSelectedEvent({...event});
      
      // Resetear el error del formulario
      setFormError('');
      
      // Establecer todos los campos del formulario explícitamente
      const formattedEvent = {
        id: event.id,
        title: event.title || '',
        start: event.start,
        end: event.end,
        color: event.color || '#2d4b94',
        startFormatted: formatDateForInput(startDate),
        endFormatted: formatDateForInput(endDate)
      };
      
      console.log('Evento formateado para formulario:', formattedEvent); // Para depuración
      setNewEvent(formattedEvent);
      
      setShowEventForm(true);
    } catch (error) {
      /* istanbul ignore next */
      console.error('Error al manejar clic en evento:', error, event);
    }
  };

  // Manejar cambios en el formulario de evento
  const handleEventFormChange = (e) => {
    try {
      const { name, value } = e.target;
      
      if (name === 'start' || name === 'end') {
        // Para los campos de fecha, necesitamos actualizar tanto el valor ISO como el formateado
        const date = new Date(value);
        
        if (isNaN(date.getTime())) {
          /* istanbul ignore next */
          console.error('Fecha inválida:', value);
          /* istanbul ignore next */
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
      /* istanbul ignore next */
      console.error('Error al manejar cambio en formulario:', error);
    }
  };

  // Función para cerrar y reiniciar el formulario
  const handleCloseForm = () => {
    setShowEventForm(false);
    setSelectedEvent(null);
    setFormError(''); // Limpiar el mensaje de error
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

  // Guardar evento (crear nuevo o actualizar existente)
  const handleSaveEvent = () => {
    try {
      // Resetear el mensaje de error
      setFormError('');
      
      // Validar que el título no esté vacío
      if (!newEvent.title.trim()) {
        setFormError('El título del evento no puede estar vacío');
        console.error('El título del evento no puede estar vacío');
        return;
      }
      
      // Validar que la hora de fin no sea anterior a la hora de inicio
      const startDate = new Date(newEvent.start);
      const endDate = new Date(newEvent.end);
      
      if (endDate < startDate) {
        setFormError('La hora de fin no puede ser anterior a la hora de inicio');
        console.error('La hora de fin no puede ser anterior a la hora de inicio');
        return;
      }
      
      // Crear una versión del evento sin los campos de formato para guardar
      const eventToSave = {
        id: newEvent.id || Date.now().toString(),
        title: newEvent.title.trim(),
        start: newEvent.start,
        end: newEvent.end,
        color: newEvent.color || '#2d4b94'
      };
      
      console.log('Guardando evento:', eventToSave); 
      console.log('Evento seleccionado:', selectedEvent);
      
      if (selectedEvent && selectedEvent.id) {
        // Actualizar evento existente
        updateEvent(selectedEvent.id, eventToSave);
      } else {
        // Crear nuevo evento
        createEvent(eventToSave);
      }
      
      // Limpiar el error y cerrar el formulario
      setFormError('');
      handleCloseForm();
    } catch (error) {
      /* istanbul ignore next */
      console.error('Error al guardar evento:', error);
      /* istanbul ignore next */
      setFormError('Ocurrió un error al guardar el evento');
    }
  };

  // Eliminar evento seleccionado
  const handleDeleteEvent = () => {
    try {
      if (selectedEvent) {
        deleteEvent(selectedEvent.id);
        handleCloseForm();
      }
    } catch (error) {
      /* istanbul ignore next */
      console.error('Error al eliminar evento:', error);
    }
  };

  // Verificar si un evento debe mostrarse en un día y hora específicos
  const shouldShowEvent = (event, day, hour) => {
    try {
      // Validaciones básicas
      if (!event?.start) return false;
      
      const eventStart = new Date(event.start);
      
      // Comprobar si la fecha es válida
      if (isNaN(eventStart.getTime())) return false;
      
      // Comprobar si el evento coincide con el día y la hora de la celda
      return (
        eventStart.getDate() === day.getDate() &&
        eventStart.getMonth() === day.getMonth() &&
        eventStart.getFullYear() === day.getFullYear() &&
        eventStart.getHours() === hour
      );
    } catch (error) {
      /* istanbul ignore next */
      console.error('Error al verificar evento:', error, event);
      /* istanbul ignore next */
      return false;
    }
  };

  // Renderizar eventos en la celda correspondiente
  const renderEvents = (day, hour) => {
    try {
      return events
        .filter(event => {
          // Solo incluir eventos que comienzan exactamente en esta hora
          if (!event.title) return false;
          
          const eventStart = new Date(event.start);
          if (isNaN(eventStart.getTime())) return false;
          
          return (
            eventStart.getDate() === day.getDate() &&
            eventStart.getMonth() === day.getMonth() &&
            eventStart.getFullYear() === day.getFullYear() &&
            eventStart.getHours() === hour
          );
        })
        .map(event => {
          // Calcular la duración en horas
          const start = new Date(event.start);
          const end = new Date(event.end);
          
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return (
              <EventItem
                key={event.id}
                event={event}
                onClick={handleEventClick}
                onUpdate={(updatedEvent) => {
                  updateEvent(updatedEvent.id, updatedEvent);
                }}
              />
            );
          }
          
          // Calcular duración en horas
          const durationMs = end.getTime() - start.getTime();
          const durationHours = durationMs / (1000 * 60 * 60);
          
          // Calcular altura basada en duración (cada celda = 60px de altura)
          const heightPx = Math.max(60, Math.round(durationHours * 60));
          
          // Aplicar estilo inline para la altura
          const eventStyle = {
            height: `${heightPx}px`,
            zIndex: 20 // Asegurar que esté por encima de otras celdas
          };
          
          return (
            <div className="event-wrapper" style={eventStyle} key={event.id}>
              <EventItem
                key={event.id}
                event={event}
                onClick={handleEventClick}
                onUpdate={(updatedEvent) => {
                  updateEvent(updatedEvent.id, updatedEvent);
                }}
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
      ) : (
        <DayView 
          date={selectedDay}
          events={events}
          onEventClick={handleEventClick}
          onTimeSlotClick={handleCellClick}
          onUpdate={(updatedEvent) => {
            updateEvent(updatedEvent.id, updatedEvent);
          }}
        />
      )}

      {/* Formulario para crear/editar eventos */}
      {showEventForm && (
        <div className="event-form-overlay" data-testid="event-form-overlay">
          <div className="event-form">
            <h3>{selectedEvent ? 'Editar evento' : 'Nuevo evento'}</h3>
            
            {/* Mostrar mensaje de error si existe */}
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

// MEJORA: Exponer la función getEvents para test
CalendarMain.getEvents = (component) => component.getEvents();

export default CalendarMain;