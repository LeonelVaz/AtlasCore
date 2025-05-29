import React, { useContext } from "react";
import EventItem from "./event-item";
import useTimeGrid from "../../hooks/use-time-grid";
import { TimeScaleContext } from "../../contexts/time-scale-context";
import { TIME_SCALES } from "../../core/config/constants";
import { PLUGIN_CONSTANTS } from "../../core/config/constants";
import ExtensionPoint from "../plugin-extension/extension-point";

// Componente para renderizar un evento individual
const EventRenderer = ({
  event,
  offsetPixels,
  heightPx,
  column,
  columnWidth,
  continuesNextDay,
  continuesFromPrevDay,
  isMicroEvent,
  gridSize,
  snapValue,
  customSlots,
  maxSimultaneousEvents,
  onEventClick,
  onUpdateEvent,
}) => {
  const eventStyle = {
    position: "absolute",
    top: `${offsetPixels}px`,
    height: `${heightPx}px`,
    left: `calc(${column * columnWidth}% + 2px)`,
    width: `calc(${columnWidth}% - 4px)`,
    zIndex: 20,
  };

  const wrapperClass = `event-wrapper ${
    continuesNextDay ? "continues-next-day" : ""
  } ${continuesFromPrevDay ? "continues-from-prev-day" : ""}`;

  return (
    <div className={wrapperClass} style={eventStyle}>
      <EventItem
        key={event.id}
        event={event}
        onClick={onEventClick}
        onUpdate={(updatedEvent) =>
          onUpdateEvent(updatedEvent.id, updatedEvent)
        }
        continuesNextDay={continuesNextDay}
        continuesFromPrevDay={continuesFromPrevDay}
        gridSize={gridSize}
        snapValue={snapValue}
        isMicroEvent={isMicroEvent}
        customSlots={customSlots}
        maxSimultaneousEvents={maxSimultaneousEvents}
      />
    </div>
  );
};

// Componente para renderizar franjas horarias
const TimeSlotRow = ({
  hour,
  day,
  dayIndex,
  onCellClick,
  onAddIntermediateClick,
  slotDuration,
  slotHeight,
  slotType,
  renderEvents,
}) => {
  const dateWithTime = new Date(day);
  dateWithTime.setHours(hour, 0, 0, 0);

  // Punto de extensión para CALENDAR_HOUR_CELL
  const renderHourCellExtensions = () => {
    return (
      <ExtensionPoint
        zoneId={PLUGIN_CONSTANTS.UI_EXTENSION_ZONES.CALENDAR_HOUR_CELL}
        render={(extensions) => (
          <>
            {extensions.map((extension) => {
              const ExtComponent = extension.component;
              return (
                <div
                  key={extension.id}
                  className="calendar-hour-cell-extension"
                  data-plugin-id={extension.pluginId}
                >
                  <ExtComponent
                    {...extension.props}
                    date={dateWithTime}
                    hour={hour}
                    minutes={0}
                    pluginId={extension.pluginId}
                    extensionId={extension.id}
                  />
                </div>
              );
            })}
          </>
        )}
        fallback={null}
      />
    );
  };

  return (
    <div
      className={`calendar-cell calendar-time-slot ${slotType}`}
      data-testid="calendar-time-slot"
      data-hour={hour}
      data-minutes={0}
      onClick={() => onCellClick(dateWithTime, hour, 0, slotDuration)}
      style={{ height: `${slotHeight}px`, minHeight: `${slotHeight}px` }}
    >
      {renderHourCellExtensions()}
      {renderEvents && renderEvents(day, hour, 0, slotDuration)}
    </div>
  );
};

// Componente para renderizar franjas personalizadas
const CustomTimeSlot = ({
  hour,
  slot,
  day,
  dayIndex,
  slotDuration,
  slotHeight,
  onCellClick,
  renderEvents,
  slotType,
}) => {
  const dateWithTime = new Date(day);
  dateWithTime.setHours(hour, slot.minutes, 0, 0);

  // Punto de extensión para CALENDAR_HOUR_CELL para franjas personalizadas
  const renderCustomHourCellExtensions = () => {
    return (
      <ExtensionPoint
        zoneId={PLUGIN_CONSTANTS.UI_EXTENSION_ZONES.CALENDAR_HOUR_CELL}
        render={(extensions) => (
          <>
            {extensions.map((extension) => {
              const ExtComponent = extension.component;
              return (
                <div
                  key={extension.id}
                  className="calendar-hour-cell-extension"
                  data-plugin-id={extension.pluginId}
                >
                  <ExtComponent
                    {...extension.props}
                    date={dateWithTime}
                    hour={hour}
                    minutes={slot.minutes}
                    pluginId={extension.pluginId}
                    extensionId={extension.id}
                  />
                </div>
              );
            })}
          </>
        )}
        fallback={null}
      />
    );
  };

  return (
    <div
      className={`calendar-cell calendar-time-slot ${slotType}`}
      data-testid="calendar-time-slot-custom"
      data-hour={hour}
      data-minutes={slot.minutes}
      onClick={() =>
        onCellClick(dateWithTime, hour, slot.minutes, slotDuration)
      }
      style={{ height: `${slotHeight}px`, minHeight: `${slotHeight}px` }}
    >
      {renderCustomHourCellExtensions()}
      {renderEvents && renderEvents(day, hour, slot.minutes, slotDuration)}
    </div>
  );
};

function TimeGrid({
  days,
  events,
  onEventClick,
  onCellClick,
  onUpdateEvent,
  snapValue,
  renderDayHeader,
  maxSimultaneousEvents = 3,
}) {
  // Obtener configuración de escala de tiempo
  const timeScaleContext = useContext(TimeScaleContext);
  const cellHeight = timeScaleContext?.currentTimeScale?.height || 60;
  const isCompactScale =
    timeScaleContext?.currentTimeScale?.id === TIME_SCALES.COMPACT.id ||
    (timeScaleContext?.currentTimeScale?.id === "custom" && cellHeight <= 45);

  // Usar hook para lógica de rejilla
  const {
    hours,
    customSlots,
    shouldShowEventStart,
    isEventActiveAtStartOfDay,
    formatTimeSlot,
    addCustomTimeSlot,
    removeCustomTimeSlot,
    canAddIntermediateSlot,
    canAddIntermediateSlotAt15,
    getEventPositionInSlot,
    eventsOverlapInTimeSlot,
  } = useTimeGrid(0, 24, cellHeight);

  // Renderizar eventos continuos
  const renderContinuingEvents = (day) => {
    const continuingEvents = events.filter((event) =>
      isEventActiveAtStartOfDay(event, day)
    );

    return continuingEvents.map((event) => {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const eventEnd = new Date(event.end);
      const continuesNextDay = eventEnd > dayEnd;
      const visibleEnd = eventEnd > dayEnd ? dayEnd : eventEnd;

      // Calcular altura
      const durationMs = visibleEnd.getTime() - dayStart.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);
      const heightPx = Math.max(20, Math.round(durationHours * cellHeight));
      const isMicroEvent = heightPx < 25;

      const eventStyle = {
        position: "absolute",
        top: 0,
        height: `${heightPx}px`,
        left: "2px",
        right: "2px",
        zIndex: 20,
      };

      return (
        <div
          className={`event-wrapper continues-from-prev-day ${
            continuesNextDay ? "continues-next-day" : ""
          }`}
          style={eventStyle}
          key={`continuing-${event.id}-${day.getDate()}`}
        >
          <EventItem
            key={event.id}
            event={event}
            onClick={onEventClick}
            onUpdate={(updatedEvent) =>
              onUpdateEvent(updatedEvent.id, updatedEvent)
            }
            continuesNextDay={continuesNextDay}
            continuesFromPrevDay={true}
            gridSize={cellHeight}
            snapValue={snapValue}
            isMicroEvent={isMicroEvent}
            customSlots={customSlots}
            maxSimultaneousEvents={maxSimultaneousEvents}
          />
        </div>
      );
    });
  };

  // Calcular posicionamiento de eventos simultáneos
  const calculateEventPositioning = (eventsInSlot, day) => {
    if (!eventsInSlot?.length) return [];

    // Un solo evento usa todo el ancho
    if (eventsInSlot.length === 1) {
      return [
        {
          event: eventsInSlot[0],
          column: 0,
          columnCount: 1,
        },
      ];
    }

    // Analizar solapamientos
    const eventPositions = [];
    let columns = [];

    // Ordenar por hora de inicio
    const sortedEvents = [...eventsInSlot].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    // Asignar columnas a cada evento
    sortedEvents.forEach((event) => {
      let column = 0;
      while (
        columns[column] &&
        eventsOverlapInTimeSlot(event, columns[column], day.date)
      ) {
        column++;
      }

      columns[column] = event;

      eventPositions.push({
        event,
        column,
        columnCount: Math.max(column + 1, columns.filter(Boolean).length),
      });
    });

    // Actualizar el recuento de columnas para todos
    const maxColumn = Math.max(...eventPositions.map((ep) => ep.column)) + 1;
    eventPositions.forEach((ep) => {
      ep.columnCount = maxColumn;
    });

    return eventPositions;
  };

  // Renderizar eventos en la celda
  const renderEvents = (day, hour, minutes = 0, duration) => {
    // Eventos continuos al inicio del día
    if (hour === 0 && minutes === 0) {
      const continuingEvents = renderContinuingEvents(day);
      if (continuingEvents?.length) return continuingEvents;
    }

    // Eventos que comienzan en esta celda
    const eventsStartingInSlot = events.filter((event) =>
      shouldShowEventStart(event, day, hour, minutes, duration)
    );

    if (!eventsStartingInSlot.length) return null;

    // Calcular posicionamiento para eventos simultáneos
    const eventPositions = calculateEventPositioning(eventsStartingInSlot, {
      date: day,
      hour,
      minutes,
    });

    // Renderizar eventos posicionados
    return eventPositions.map(({ event, column, columnCount }) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const continuesNextDay = eventEnd > dayEnd;
      const visibleEnd = eventEnd > dayEnd ? dayEnd : eventEnd;

      // Calcular duración visible
      const durationMs = visibleEnd.getTime() - eventStart.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);
      const heightPx = Math.max(20, Math.round(durationHours * cellHeight));

      // Calcular posición relativa
      const { offsetPixels } = getEventPositionInSlot(
        event,
        hour,
        minutes,
        duration,
        cellHeight
      );

      const isMicroEvent = heightPx < 25;
      const columnWidth = 100 / columnCount;

      return (
        <EventRenderer
          key={`event-${event.id}-${day.getDate()}-${hour}-${minutes}`}
          event={event}
          offsetPixels={offsetPixels}
          heightPx={heightPx}
          column={column}
          columnWidth={columnWidth}
          continuesNextDay={continuesNextDay}
          continuesFromPrevDay={false}
          isMicroEvent={isMicroEvent}
          gridSize={cellHeight}
          snapValue={snapValue}
          customSlots={customSlots}
          maxSimultaneousEvents={maxSimultaneousEvents}
          onEventClick={onEventClick}
          onUpdateEvent={onUpdateEvent}
        />
      );
    });
  };

  // Renderizar extensiones para el encabezado del día
  const renderDayHeaderExtensions = (day) => {
    return (
      <ExtensionPoint
        zoneId={PLUGIN_CONSTANTS.UI_EXTENSION_ZONES.CALENDAR_DAY_HEADER}
        render={(extensions) => (
          <>
            {extensions.map((extension) => {
              const ExtComponent = extension.component;
              return (
                <div
                  key={extension.id}
                  className="calendar-day-header-extension"
                  data-plugin-id={extension.pluginId}
                >
                  <ExtComponent
                    {...extension.props}
                    date={day}
                    pluginId={extension.pluginId}
                    extensionId={extension.id}
                  />
                </div>
              );
            })}
          </>
        )}
        fallback={null}
      />
    );
  };

  return (
    <div
      className={`calendar-grid ${isCompactScale ? "time-scale-compact" : ""}`}
    >
      {/* Encabezado */}
      <div className="calendar-row calendar-header-row">
        <div className="calendar-cell calendar-time-header"></div>
        {days.map((day, index) => (
          <div
            key={index}
            className="calendar-cell calendar-day-header"
            data-testid="calendar-day-header"
          >
            {renderDayHeader(day)}
            {renderDayHeaderExtensions(day)}
          </div>
        ))}
      </div>

      {/* Rejilla horaria */}
      {hours.map((hour, hourIndex) => {
        // Calcular altura y duración de celda estándar
        const hasCustomSlots = customSlots[hour]?.length > 0;
        let standardSlotDuration = 60;

        if (hasCustomSlots) {
          const firstCustomSlot = [...customSlots[hour]].sort(
            (a, b) => a.minutes - b.minutes
          )[0];
          standardSlotDuration = firstCustomSlot.minutes;
        }

        const standardSlotHeight = (standardSlotDuration / 60) * cellHeight;
        const standardSlotType =
          standardSlotDuration === 15
            ? "time-slot-short"
            : standardSlotDuration === 30
            ? "time-slot-medium"
            : standardSlotDuration === 45
            ? "time-slot-large"
            : "time-slot-standard";

        return (
          <React.Fragment key={hour}>
            {/* Fila de hora estándar */}
            <div className="calendar-row">
              <div
                className="calendar-cell calendar-time"
                style={{
                  height: `${standardSlotHeight}px`,
                  minHeight: `${standardSlotHeight}px`,
                }}
              >
                {formatTimeSlot(hour)}
              </div>

              {days.map((day, dayIndex) => (
                <TimeSlotRow
                  key={dayIndex}
                  hour={hour}
                  day={day}
                  dayIndex={dayIndex}
                  slotDuration={standardSlotDuration}
                  slotHeight={standardSlotHeight}
                  slotType={standardSlotType}
                  onCellClick={onCellClick}
                  renderEvents={() =>
                    renderEvents(day, hour, 0, standardSlotDuration)
                  }
                />
              ))}
            </div>

            {/* Botones de agregar franjas */}
            {hourIndex < hours.length - 1 &&
              canAddIntermediateSlot(hour, 0) && (
                <div className="time-separator-row">
                  <div className="time-separator-cell">
                    <button
                      className="add-time-slot-button"
                      onClick={() => addCustomTimeSlot(hour, 30)}
                      title={`Añadir franja ${hour}:30`}
                    >
                      <span className="material-icons">add</span>
                    </button>
                  </div>
                  {days.map((_, idx) => (
                    <div key={idx} className="time-separator-placeholder"></div>
                  ))}
                </div>
              )}

            {hourIndex < hours.length - 1 &&
              canAddIntermediateSlotAt15(hour) && (
                <div className="time-separator-row">
                  <div className="time-separator-cell">
                    <button
                      className="add-time-slot-button"
                      onClick={() => addCustomTimeSlot(hour, 15)}
                      title={`Añadir franja ${hour}:15`}
                    >
                      <span className="material-icons">add</span>
                    </button>
                  </div>
                  {days.map((_, idx) => (
                    <div key={idx} className="time-separator-placeholder"></div>
                  ))}
                </div>
              )}

            {/* Franjas personalizadas */}
            {hasCustomSlots &&
              customSlots[hour].map((slot) => {
                // Calcular duración de la franja
                const sortedSlots = [...customSlots[hour]].sort(
                  (a, b) => a.minutes - b.minutes
                );
                const slotIndex = sortedSlots.findIndex(
                  (s) => s.minutes === slot.minutes
                );

                let slotDuration = slot.duration || 30;
                if (slotIndex < sortedSlots.length - 1) {
                  slotDuration =
                    sortedSlots[slotIndex + 1].minutes - slot.minutes;
                } else {
                  slotDuration = 60 - slot.minutes;
                }

                const slotHeight = (slotDuration / 60) * cellHeight;
                const slotType =
                  slotDuration === 15
                    ? "time-slot-short"
                    : slotDuration === 30
                    ? "time-slot-medium"
                    : slotDuration === 45
                    ? "time-slot-large"
                    : "time-slot-standard";

                return (
                  <React.Fragment
                    key={`custom-fragment-${hour}-${slot.minutes}`}
                  >
                    <div className="calendar-row time-row-with-delete">
                      <div
                        className="calendar-cell calendar-time calendar-time-custom"
                        style={{
                          height: `${slotHeight}px`,
                          minHeight: `${slotHeight}px`,
                        }}
                      >
                        <button
                          className="remove-time-slot-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCustomTimeSlot(hour, slot.minutes);
                          }}
                          title={`Eliminar franja ${hour}:${slot.minutes
                            .toString()
                            .padStart(2, "0")}`}
                          aria-label="Eliminar franja horaria"
                        >
                          <span className="material-icons">clear</span>
                        </button>

                        {formatTimeSlot(hour, slot.minutes)}
                      </div>

                      {days.map((day, dayIndex) => (
                        <CustomTimeSlot
                          key={dayIndex}
                          hour={hour}
                          slot={slot}
                          day={day}
                          dayIndex={dayIndex}
                          slotDuration={slotDuration}
                          slotHeight={slotHeight}
                          slotType={slotType}
                          onCellClick={onCellClick}
                          renderEvents={() =>
                            renderEvents(day, hour, slot.minutes, slotDuration)
                          }
                        />
                      ))}
                    </div>

                    {slot.minutes < 45 && (
                      <div className="time-separator-row">
                        <div className="time-separator-cell">
                          <button
                            className="add-time-slot-button"
                            onClick={() =>
                              addCustomTimeSlot(hour, slot.minutes + 15)
                            }
                            title={`Añadir franja ${hour}:${(slot.minutes + 15)
                              .toString()
                              .padStart(2, "0")}`}
                          >
                            <span className="material-icons">add</span>
                          </button>
                        </div>
                        {days.map((_, idx) => (
                          <div
                            key={idx}
                            className="time-separator-placeholder"
                          ></div>
                        ))}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default TimeGrid;
