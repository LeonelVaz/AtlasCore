// src/components/calendar/calendar-main.jsx con suscripción a eventos
import React, { useState, useEffect } from 'react';
import { registerModule, unregisterModule } from '../../core/module/module-registry';
import WeekView from './week-view';
import DayView from './day-view';
import EventForm from './event-form';
import SnapControl from './snap-control';
import Button from '../ui/button';
import useCalendarEvents from '../../hooks/use-calendar-events';
import useCalendarNavigation from '../../hooks/use-calendar-navigation';
import useEventForm from '../../hooks/use-event-form';
import { setupDebugTools } from '../../utils/debug-utils';
import { CALENDAR_VIEWS, SNAP_VALUES, STORAGE_KEYS } from '../../core/config/constants';
import storageService from '../../services/storage-service';
import eventBus from '../../core/bus/event-bus';

/**
 * Componente principal del calendario con vista semanal y diaria
 */
function CalendarMain() {
  // Usar el hook personalizado para gestión de eventos
  const { 
    events, 
    getEvents, 
    createEvent, 
    updateEvent, 
    deleteEvent, 
    saveEvents 
  } = useCalendarEvents();

  // Estado de la vista y snap
  const [view, setView] = useState(CALENDAR_VIEWS.WEEK);
  // Inicializar snap como desactivado (NONE = 0)
  const [snapValue, setSnapValue] = useState(SNAP_VALUES.NONE);
  
  // NUEVO: Estado para el número máximo de eventos simultáneos
  const [maxSimultaneousEvents, setMaxSimultaneousEvents] = useState(3);
  
  // Usar hook de navegación
  const {
    currentDate,
    selectedDay,
    setSelectedDay,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    goToPreviousDay,
    goToNextDay,
    goToToday
  } = useCalendarNavigation();
  
  // Usar hook de formulario de eventos
  const {
    selectedEvent,
    showEventForm,
    formError,
    newEvent,
    handleEventClick,
    handleCellClick,
    handleEventFormChange,
    handleCloseForm,
    handleSaveEvent,
    handleDeleteEvent
  } = useEventForm(createEvent, updateEvent, deleteEvent);

  // NUEVO: Cargar configuración de eventos simultáneos y suscribirse a cambios
  useEffect(() => {
    const loadMaxSimultaneousEvents = async () => {
      try {
        // Cargar desde almacenamiento o usar valor por defecto (3)
        const savedValue = await storageService.get(STORAGE_KEYS.MAX_SIMULTANEOUS_EVENTS, 3);
        
        // Asegurar que el valor esté en el rango válido (1-10)
        const validValue = Math.min(10, Math.max(1, parseInt(savedValue) || 3));
        setMaxSimultaneousEvents(validValue);
      } catch (error) {
        console.error('Error al cargar configuración de eventos simultáneos:', error);
        // Mantener el valor por defecto
      }
    };
    
    loadMaxSimultaneousEvents();
    
    // Suscribirse a cambios en la configuración
    const unsubscribe = eventBus.subscribe(
      'calendar.maxSimultaneousEventsChanged', 
      (data) => {
        console.log('Actualización de eventos simultáneos:', data.value);
        setMaxSimultaneousEvents(data.value);
      }
    );
    
    return () => {
      unsubscribe && unsubscribe();
    };
  }, []);

  // Registrar módulo al iniciar
  useEffect(() => {
    // Registrar API del calendario
    const moduleAPI = {
      getEvents,
      createEvent,
      updateEvent,
      deleteEvent,
      // NUEVO: Exponer configuración de eventos simultáneos
      getMaxSimultaneousEvents: () => maxSimultaneousEvents,
      setMaxSimultaneousEvents: (value) => {
        const validValue = Math.min(10, Math.max(1, value));
        setMaxSimultaneousEvents(validValue);
        return validValue;
      }
    };
    registerModule('calendar', moduleAPI);
    
    return () => { 
      unregisterModule('calendar'); 
    };
  }, [maxSimultaneousEvents]);

  // Configurar herramientas de depuración
  useEffect(() => {
    const cleanup = setupDebugTools(events, createEvent, updateEvent, saveEvents);
    return cleanup;
  }, [events]);

  // Cambiar entre vistas
  const toggleView = (newView, date = null) => {
    setView(newView);
    if (date) {
      setSelectedDay(new Date(date));
    }
  };

  // Obtener el mes y año actual para mostrar en el título
  const getFormattedMonthYear = () => {
    const month = new Date(currentDate).toLocaleDateString('es-ES', { month: 'long' });
    const year = new Date(currentDate).getFullYear();
    return `${month.charAt(0).toUpperCase() + month.slice(1)} de ${year}`;
  };

  // Renderizar botones de navegación según la vista actual
  const renderNavigationButtons = () => {
    if (view === CALENDAR_VIEWS.WEEK) {
      return (
        <>
          <Button onClick={goToPreviousWeek} variant="text" aria-label="Semana anterior">
            <span className="material-icons">chevron_left</span>
          </Button>
          <Button onClick={goToCurrentWeek} variant="text">Hoy</Button>
          <Button onClick={goToNextWeek} variant="text" aria-label="Semana siguiente">
            <span className="material-icons">chevron_right</span>
          </Button>
        </>
      );
    } else {
      return (
        <>
          <Button onClick={goToPreviousDay} variant="text" aria-label="Día anterior">
            <span className="material-icons">chevron_left</span>
          </Button>
          <Button onClick={goToToday} variant="text">Hoy</Button>
          <Button onClick={goToNextDay} variant="text" aria-label="Día siguiente">
            <span className="material-icons">chevron_right</span>
          </Button>
        </>
      );
    }
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-navigation">
          {renderNavigationButtons()}
        </div>
        
        <div className="calendar-title">
          <h2>{view === CALENDAR_VIEWS.WEEK ? getFormattedMonthYear() : 
               new Date(selectedDay).toLocaleDateString('es-ES', { 
                 month: 'long', 
                 year: 'numeric',
                 day: 'numeric'
               })}</h2>
        </div>
        
        <div className="calendar-view-toggle">
          <Button 
            isActive={view === CALENDAR_VIEWS.WEEK} 
            onClick={() => toggleView(CALENDAR_VIEWS.WEEK)}
          >
            Semana
          </Button>
          <Button 
            isActive={view === CALENDAR_VIEWS.DAY} 
            onClick={() => toggleView(CALENDAR_VIEWS.DAY, selectedDay)}
          >
            Día
          </Button>
          <SnapControl
            snapValue={snapValue}
            onSnapChange={setSnapValue}
          />
        </div>
      </div>

      {view === CALENDAR_VIEWS.WEEK ? (
        <WeekView 
          currentDate={currentDate}
          events={events}
          onEventClick={handleEventClick}
          onCellClick={handleCellClick}
          onUpdateEvent={updateEvent}
          snapValue={snapValue}
          maxSimultaneousEvents={maxSimultaneousEvents}
        />
      ) : (
        <DayView 
          date={selectedDay}
          events={events}
          onEventClick={handleEventClick}
          onTimeSlotClick={handleCellClick}
          onUpdate={updateEvent}
          snapValue={snapValue}
          maxSimultaneousEvents={maxSimultaneousEvents}
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