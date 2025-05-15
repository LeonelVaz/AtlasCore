import React from 'react';
import TimeGrid from './time-grid';
import { formatDate } from '../../utils/date-utils';

function DayView({ 
  date, 
  events, 
  onEventClick, 
  onTimeSlotClick,
  onUpdate,
  snapValue = 0,
  maxSimultaneousEvents = 3
}) {
  // Generar un array con un solo día para usar con TimeGrid
  const singleDay = [new Date(date)];
  
  // Formato del encabezado del día con nombre completo
  const renderDayHeader = (day) => (
    <div className="day-header-content">
      <span className="day-name">
        {formatDate(day, { weekday: 'long' })}
      </span>
      <div className="day-details">
        <span className="day-number">{day.getDate()}</span>
        <span className="day-month">
          {formatDate(day, { month: 'long' })}
        </span>
      </div>
    </div>
  );

  // Modificar el manejador para pasar correctamente los minutos y la duración
  const handleTimeSlotClick = (dateWithTime, hour, minutes = 0, slotDuration = 60) => {
    // Pasar la fecha completa y la duración al handler original
    onTimeSlotClick(dateWithTime, hour, minutes, slotDuration);
  };

  return (
    <div className="day-view-container">
      <TimeGrid 
        days={singleDay}
        events={events}
        onEventClick={onEventClick}
        onCellClick={handleTimeSlotClick}
        onUpdateEvent={onUpdate}
        snapValue={snapValue}
        renderDayHeader={renderDayHeader}
        maxSimultaneousEvents={maxSimultaneousEvents}
      />
    </div>
  );
}

export default DayView;