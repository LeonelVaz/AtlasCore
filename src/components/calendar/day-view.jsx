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
  onUpdate  // Función para actualizar eventos
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
    try {
      return events
        .filter(event => event.title && shouldShowEvent(event, hour))
        .map(event => (
          <EventItem
            key={event.id}
            event={event}
            onClick={onEventClick}
            onUpdate={(updatedEvent) => {
              console.log('Evento actualizado en vista diaria:', updatedEvent);
              onUpdate(updatedEvent);
            }}
          />
        ));
    } catch (error) {
      console.error('Error al renderizar eventos en vista diaria:', error);
      return null;
    }
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