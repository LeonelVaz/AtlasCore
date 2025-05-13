// day-view.jsx (modificado)
import React from 'react';
import { formatHour, formatDate } from '../../utils/date-utils';
import EventItem from './event-item';

/**
 * Componente de vista diaria para el calendario
 * Muestra los eventos de un solo día con mayor detalle
 */
function DayView({ 
  date, 
  events, 
  onEventClick, 
  onTimeSlotClick,
  onUpdate,
  snapValue = 0
}) {
  // Generar las horas del día (de 0 a 23)
  const generateHours = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i);
    }
    return hours;
  };

  // Verificar si un evento comienza exactamente en esta hora
  const shouldShowEventStart = (event, hour) => {
    try {
      if (!event?.start) return false;
      
      const eventStart = new Date(event.start);
      
      if (isNaN(eventStart.getTime())) return false;
      
      return (
        eventStart.getDate() === date.getDate() &&
        eventStart.getMonth() === date.getMonth() &&
        eventStart.getFullYear() === date.getFullYear() &&
        eventStart.getHours() === hour
      );
    } catch (error) {
      console.error('Error al verificar inicio de evento en vista diaria:', error, event);
      return false;
    }
  };
  
  // Verificar si un evento está activo durante la hora (para eventos que continúan del día anterior)
  const isEventActiveAtStartOfDay = (event) => {
    try {
      if (!event?.start || !event?.end) return false;
      
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) return false;
      
      // Medianoche del día actual
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      
      // El evento comenzó antes de la medianoche y termina después
      return eventStart < dayStart && eventEnd > dayStart;
    } catch (error) {
      console.error('Error al verificar evento activo al inicio del día:', error, event);
      return false;
    }
  };

  // Renderizar eventos para la primera hora del día (00:00)
  const renderContinuingEvents = () => {
    try {
      // Filtrar eventos que continúan desde el día anterior
      const continuingEvents = events.filter(isEventActiveAtStartOfDay);
      
      return continuingEvents.map(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        
        // Normalizar día a medianoche
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        
        // Fin del día (23:59:59.999)
        const dayEnd = new Date(date);
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
            key={`continuing-${event.id}`}
          >
            <EventItem
              key={event.id}
              event={event}
              onClick={onEventClick}
              onUpdate={(updatedEvent) => {
                onUpdate(updatedEvent.id, updatedEvent);
              }}
              continuesNextDay={continuesNextDay}
              continuesFromPrevDay={true}
              snapValue={snapValue}
            />
          </div>
        );
      });
    } catch (error) {
      console.error('Error al renderizar eventos que continúan en vista diaria:', error);
      return null;
    }
  };

  // Renderizar eventos que comienzan en una hora específica
  const renderEvents = (hour) => {
    try {
      // Si es la primera hora del día, mostrar los eventos que continúan del día anterior
      if (hour === 0) {
        const continuingEvents = renderContinuingEvents();
        if (continuingEvents && continuingEvents.length > 0) {
          return continuingEvents;
        }
      }
      
      // Eventos que comienzan exactamente en esta hora
      const eventsStartingThisHour = events.filter(event => shouldShowEventStart(event, hour));
      
      return eventsStartingThisHour.map(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        
        // Normalizar día a medianoche
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        
        // Fin del día (23:59:59.999)
        const dayEnd = new Date(date);
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
            key={`starting-${event.id}-${hour}`}
          >
            <EventItem
              key={event.id}
              event={event}
              onClick={onEventClick}
              onUpdate={(updatedEvent) => {
                onUpdate(updatedEvent.id, updatedEvent);
              }}
              continuesNextDay={continuesNextDay}
              continuesFromPrevDay={false}
              snapValue={snapValue}
            />
          </div>
        );
      });
    } catch (error) {
      console.error('Error al renderizar eventos en vista diaria:', error);
      return null;
    }
  };

  const hours = generateHours();

  // Formato del encabezado del día con nombre completo
  const getDayTitle = () => {
    return formatDate(date, { 
      weekday: 'long', 
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="day-view-container">
      <div className="day-view-header">
        <h3 className="day-view-title">
          {getDayTitle()}
        </h3>
      </div>

      <div className="day-view-timeline">
        {hours.map((hour) => (
          <div key={hour} className="day-view-hour-row">
            <div className="day-view-hour-label">
              {formatHour(hour)}
            </div>
            <div 
              className="day-view-hour-slot"
              onClick={() => onTimeSlotClick(date, hour)}
              data-testid="day-view-hour-slot"
            >
              {renderEvents(hour)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DayView;