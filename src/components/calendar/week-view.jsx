import React from "react";
import TimeGrid from "./time-grid";
import { generateWeekDays } from "../../utils/date-utils";

function WeekView({
  currentDate,
  events,
  onEventClick,
  onCellClick,
  onUpdateEvent,
  snapValue,
  maxSimultaneousEvents = 3,
}) {
  const weekDays = generateWeekDays(currentDate);

  // Función para renderizar el encabezado de día
  const renderDayHeader = (day) => {
    const dayName = day.toLocaleDateString("es-ES", { weekday: "long" });
    const dayNumber = day.getDate();

    return (
      <div className="day-header-content">
        <span className="day-name">
          {dayName.charAt(0).toUpperCase() + dayName.slice(1)}
        </span>
        <span className="day-number">{dayNumber}</span>
      </div>
    );
  };

  return (
    <div className="week-view">
      <TimeGrid
        days={weekDays}
        events={events}
        onEventClick={onEventClick}
        onCellClick={onCellClick}
        onUpdateEvent={onUpdateEvent}
        snapValue={snapValue}
        renderDayHeader={renderDayHeader}
        maxSimultaneousEvents={maxSimultaneousEvents}
      />
    </div>
  );
}

export default WeekView;
