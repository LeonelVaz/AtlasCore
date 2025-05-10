// calendar-main.jsx
import React, { useState, useEffect } from 'react';
import { registerModule, unregisterModule } from '../../core/module/module-registry';
import WeekView from './week-view';
import DayView from './day-view';
import EventForm from './event-form';
import SnapControl from './snap-control';
import useCalendarEvents from '../../hooks/use-calendar-events';
import useCalendarNavigation from '../../hooks/use-calendar-navigation';
import useEventForm from '../../hooks/use-event-form';
import { setupDebugTools } from '../../utils/debug-utils';
import '../../styles/calendar/calendar-main.css';

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
  const [view, setView] = useState('week'); // 'week' o 'day'
  const [snapValue, setSnapValue] = useState(0); // 0 = desactivado por defecto
  
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