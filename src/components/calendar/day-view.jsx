import React from 'react';
import { formatHour, formatDate } from '../../utils/date-utils';

/**
 * Componente de vista diaria para el calendario
 * Muestra los eventos de un solo día con mayor detalle
 */
function DayView({ 
  date, 
  events, 
  onEventClick, 
  onTimeSlotClick 
}) {
  // Generar las horas del día (de 0 a 23)
  const generateHours = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i);
    }
    return hours;
  };

  // Verificar si un evento debe mostrarse en una hora específica
  const shouldShowEvent = (event, hour) => {
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
      console.error('Error al verificar evento en vista diaria:', error, event);
      return false;
    }
  };

  // Renderizar eventos para una hora específica
  const renderEvents = (hour) => {
    return events
      .filter(event => event.title && shouldShowEvent(event, hour))
      .map(event => (
        <div 
          key={event.id}
          className="calendar-event"
          style={{ backgroundColor: event.color }}
          onClick={(e) => {
            e.stopPropagation();
            onEventClick(event);
          }}
          data-testid="day-view-event"
        >
          <div className="event-title">{event.title}</div>
          <div className="event-time">
            {new Date(event.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            {' - '}
            {new Date(event.end).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </div>
          {event.description && (
            <div className="event-description">{event.description}</div>
          )}
        </div>
      ));
  };

  const hours = generateHours();

  return (
    <div className="day-view-container">
      <div className="day-view-header">
        <h3 className="day-view-title">
          {formatDate(date, { 
            weekday: 'long', 
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
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