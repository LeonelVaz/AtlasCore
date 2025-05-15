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

// Componente que renderiza extensiones de plugins en un punto específico
const PluginExtensionPoint = ({ pointId, extraProps = {} }) => {
  const [extensions, setExtensions] = useState([]);
  
  // Obtener extensiones registradas para este punto
  useEffect(() => {
    // Función para obtener extensiones actuales
    const getExtensions = () => {
      if (!window.__pluginExtensions || !window.__pluginExtensions[pointId]) {
        return [];
      }
      return window.__pluginExtensions[pointId];
    };
    
    // Obtener extensiones iniciales
    setExtensions(getExtensions());
    
    // Suscribirse a cambios en extensiones
    const handleComponentRegistered = (data) => {
      if (data.pointId === pointId) {
        setExtensions(getExtensions());
      }
    };
    
    // Suscribirse al evento de registro de componentes
    eventBus.subscribe('app.pluginComponentRegistered', handleComponentRegistered);
    
    return () => {
      // Desuscribirse al desmontar
      eventBus.unsubscribe('app.pluginComponentRegistered', handleComponentRegistered);
    };
  }, [pointId]);
  
  // No renderizar nada si no hay extensiones
  if (extensions.length === 0) return null;
  
  // Renderizar cada extensión
  return (
    <div className={`plugin-extension-point plugin-point-${pointId}`}>
      {extensions.map((extension, index) => {
        const Component = extension.component;
        return (
          <div key={`${extension.pluginId}-${index}`} className="plugin-extension-container">
            <Component 
              {...extraProps} 
              pluginId={extension.pluginId}
              options={extension.options}
            />
          </div>
        );
      })}
    </div>
  );
};

function CalendarMain() {
  // Hooks para gestión de eventos
  const { 
    events, getEvents, createEvent, updateEvent, deleteEvent, saveEvents 
  } = useCalendarEvents();

  // Estados
  const [view, setView] = useState(CALENDAR_VIEWS.WEEK);
  const [snapValue, setSnapValue] = useState(SNAP_VALUES.NONE);
  const [maxSimultaneousEvents, setMaxSimultaneousEvents] = useState(3);
  
  // Hook de navegación
  const {
    currentDate, selectedDay, setSelectedDay, 
    goToPreviousWeek, goToNextWeek, goToCurrentWeek,
    goToPreviousDay, goToNextDay, goToToday
  } = useCalendarNavigation();
  
  // Hook de formulario de eventos
  const {
    selectedEvent, showEventForm, formError, newEvent,
    handleEventClick, handleCellClick, handleEventFormChange,
    handleCloseForm, handleSaveEvent, handleDeleteEvent
  } = useEventForm(createEvent, updateEvent, deleteEvent, events, maxSimultaneousEvents);

  // Cargar configuración de eventos simultáneos
  useEffect(() => {
    const loadMaxSimultaneousEvents = async () => {
      try {
        const savedValue = await storageService.get(STORAGE_KEYS.MAX_SIMULTANEOUS_EVENTS, 3);
        const validValue = Math.min(10, Math.max(1, parseInt(savedValue) || 3));
        setMaxSimultaneousEvents(validValue);
      } catch (error) {
        console.error('Error al cargar configuración de eventos simultáneos:', error);
      }
    };
    
    loadMaxSimultaneousEvents();
    
    // Suscribirse a cambios
    const unsubscribe = eventBus.subscribe(
      'calendar.maxSimultaneousEventsChanged', 
      (data) => setMaxSimultaneousEvents(data.value)
    );
    
    return () => unsubscribe && unsubscribe();
  }, []);

  // Registrar módulo
  useEffect(() => {
    // API del calendario
    const moduleAPI = {
      getEvents,
      createEvent,
      updateEvent,
      deleteEvent,
      getMaxSimultaneousEvents: () => maxSimultaneousEvents,
      setMaxSimultaneousEvents: (value) => {
        const validValue = Math.min(10, Math.max(1, value));
        setMaxSimultaneousEvents(validValue);
        return validValue;
      }
    };
    
    registerModule('calendar', moduleAPI);
    return () => unregisterModule('calendar');
  }, [maxSimultaneousEvents, getEvents, createEvent, updateEvent, deleteEvent]);

  // Debug tools
  useEffect(() => {
    return setupDebugTools(events, createEvent, updateEvent, saveEvents);
  }, [events, createEvent, updateEvent, saveEvents]);

  // Cambiar entre vistas
  const toggleView = (newView, date = null) => {
    setView(newView);
    if (date) setSelectedDay(new Date(date));
  };

  // Obtener mes y año para el título
  const getFormattedMonthYear = () => {
    const month = new Date(currentDate).toLocaleDateString('es-ES', { month: 'long' });
    const year = new Date(currentDate).getFullYear();
    return `${month.charAt(0).toUpperCase() + month.slice(1)} de ${year}`;
  };

  // Botones de navegación según la vista
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

  // Título según la vista
  const getTitle = () => {
    if (view === CALENDAR_VIEWS.WEEK) {
      return getFormattedMonthYear();
    } else {
      return new Date(selectedDay).toLocaleDateString('es-ES', { 
        day: 'numeric', month: 'long', year: 'numeric'
      });
    }
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-navigation">
          {renderNavigationButtons()}
        </div>
        
        <div className="calendar-title">
          <h2>{getTitle()}</h2>
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
          
          {/* Punto de extensión para botones en la barra de herramientas */}
          <PluginExtensionPoint 
            pointId="calendar.toolbar" 
            extraProps={{
              currentDate,
              view,
              setView: toggleView
            }}
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
        >
          {/* Punto de extensión para campos en el formulario de eventos */}
          <PluginExtensionPoint 
            pointId={selectedEvent ? 'form.eventEdit' : 'form.eventCreate'} 
            extraProps={{
              event: newEvent,
              onChange: handleEventFormChange
            }}
          />
        </EventForm>
      )}
    </div>
  );
}

// Exponer getEvents para pruebas
CalendarMain.getEvents = (component) => component.getEvents();

export default CalendarMain;