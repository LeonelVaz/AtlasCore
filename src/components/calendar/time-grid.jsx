// time-grid.jsx
import React from 'react';
import EventItem from './event-item';
import { formatHour } from '../../utils/date-utils';
import '../../styles/components/snap-control.css';

function TimeGrid({ 
  days, 
  events, 
  onEventClick, 
  onCellClick, 
  onUpdateEvent, 
  snapValue,
  renderDayHeader 
}) {
  // Generar horas del día
  const generateHours = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i);
    }
    return hours;
  };

  const hours = generateHours();

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
              onClick={onEventClick}
              onUpdate={(updatedEvent) => {
                onUpdateEvent(updatedEvent.id, updatedEvent);
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
              onClick={onEventClick}
              onUpdate={(updatedEvent) => {
                onUpdateEvent(updatedEvent.id, updatedEvent);
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

  return (
    <div className="calendar-grid">
      {/* Encabezado con días */}
      <div className="calendar-row calendar-header-row">
        <div className="calendar-cell calendar-time-header"></div>
        {days.map((day, index) => (
          <div 
            key={index} 
            className="calendar-cell calendar-day-header"
            data-testid="calendar-day-header"
          >
            {renderDayHeader(day)}
          </div>
        ))}
      </div>

      {/* Rejilla horaria */}
      {hours.map((hour) => (
        <div key={hour} className="calendar-row">
          <div className="calendar-cell calendar-time">
            {formatHour(hour)}
          </div>
          
          {days.map((day, dayIndex) => (
            <div 
              key={dayIndex} 
              className="calendar-cell calendar-time-slot"
              data-testid="calendar-time-slot"
              onClick={() => onCellClick(day, hour)}
            >
              {renderEvents(day, hour)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default TimeGrid;