// calendar-main.jsx 
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
import { CALENDAR_VIEWS, SNAP_VALUES } from '../../core/config/constants';

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
  const [snapValue, setSnapValue] = useState(SNAP_VALUES.NONE);
  
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

  // Registrar módulo al iniciar
  useEffect(() => {
    // Registrar API del calendario
    const moduleAPI = {
      getEvents,
      createEvent,
      updateEvent,
      deleteEvent
    };
    registerModule('calendar', moduleAPI);
    
    return () => { 
      unregisterModule('calendar'); 
    };
  }, []);

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

  // Renderizar botones de navegación según la vista actual
  const renderNavigationButtons = () => {
    if (view === CALENDAR_VIEWS.WEEK) {
      return (
        <>
          <Button onClick={goToPreviousWeek}>Semana anterior</Button>
          <Button onClick={goToCurrentWeek} variant="secondary">Semana actual</Button>
          <Button onClick={goToNextWeek}>Semana siguiente</Button>
        </>
      );
    } else {
      return (
        <>
          <Button onClick={goToPreviousDay}>Día anterior</Button>
          <Button onClick={goToToday} variant="secondary">Hoy</Button>
          <Button onClick={goToNextDay}>Día siguiente</Button>
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
        <div className="calendar-view-toggle">
          <Button 
            isActive={view === CALENDAR_VIEWS.WEEK} 
            onClick={() => toggleView(CALENDAR_VIEWS.WEEK)}
          >
            Vista Semanal
          </Button>
          <Button 
            isActive={view === CALENDAR_VIEWS.DAY} 
            onClick={() => toggleView(CALENDAR_VIEWS.DAY, selectedDay)}
          >
            Vista Diaria
          </Button>
          <SnapControl
            snapValue={snapValue}
            onSnapChange={setSnapValue}
          />
        </div>
        <div className="calendar-title">
          {view === CALENDAR_VIEWS.WEEK && (
            <h2>
              {new Date(currentDate).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h2>
          )}
          {view === CALENDAR_VIEWS.DAY && (
            <h2>
              {new Date(selectedDay).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h2>
          )}
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