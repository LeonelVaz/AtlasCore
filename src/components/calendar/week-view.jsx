// week-view.jsx - Ajustar estilos para permitir scroll
import React from 'react';
import TimeGrid from './time-grid';
import { generateWeekDays, formatDate } from '../../utils/date-utils';

function WeekView({ 
  currentDate, 
  events, 
  onEventClick, 
  onCellClick, 
  onUpdateEvent, 
  snapValue 
}) {
  const weekDays = generateWeekDays(currentDate);

  return (
    <div className="week-view" style={{ height: '100%', overflow: 'auto' }}>
      <TimeGrid 
        days={weekDays}
        events={events}
        onEventClick={onEventClick}
        onCellClick={onCellClick}
        onUpdateEvent={onUpdateEvent}
        snapValue={snapValue}
        renderDayHeader={(day) => (
          formatDate(day, { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short' 
          })
        )}
      />
    </div>
  );
}

export default WeekView;