import React, { useContext } from 'react';
import EventItem from './event-item';
import useTimeGrid from '../../hooks/use-time-grid';
import { TimeScaleContext } from '../../contexts/time-scale-context';
import { TIME_SCALES } from '../../core/config/constants';

function TimeGrid({ 
  days, events, onEventClick, onCellClick, onUpdateEvent, 
  snapValue, renderDayHeader, maxSimultaneousEvents = 3 
}) {
  // Obtener configuración de escala de tiempo
  const timeScaleContext = useContext(TimeScaleContext);
  const cellHeight = timeScaleContext?.currentTimeScale?.height || 60;
  const isCompactScale = timeScaleContext?.currentTimeScale?.id === TIME_SCALES.COMPACT.id || 
                      (timeScaleContext?.currentTimeScale?.id === 'custom' && cellHeight <= 45);
  
  // Usar hook para lógica de rejilla
  const {
    hours, customSlots, shouldShowEventStart, isEventActiveAtStartOfDay,
    formatTimeSlot, addCustomTimeSlot, removeCustomTimeSlot, 
    canAddIntermediateSlot, canAddIntermediateSlotAt15, 
    getEventPositionInSlot, eventsOverlapInTimeSlot
  } = useTimeGrid(0, 24, cellHeight);

  // Renderizar eventos continuos
  const renderContinuingEvents = (day) => {
    try {
      const continuingEvents = events.filter(event => isEventActiveAtStartOfDay(event, day));
      
      return continuingEvents.map(event => {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);
        
        const eventEnd = new Date(event.end);
        const continuesNextDay = eventEnd > dayEnd;
        const visibleEnd = eventEnd > dayEnd ? dayEnd : eventEnd;
        
        // Calcular altura basada en duración visible
        const durationMs = visibleEnd.getTime() - dayStart.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);
        const heightPx = Math.max(20, Math.round(durationHours * cellHeight));
        const isMicroEvent = heightPx < 25;
        
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
              onUpdate={(updatedEvent) => onUpdateEvent(updatedEvent.id, updatedEvent)}
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
    } catch (error) {
      console.error('Error al renderizar eventos continuos:', error);
      return null;
    }
  };

  // Calcular posicionamiento de eventos simultáneos
  const calculateEventPositioning = (eventsInSlot, day) => {
    try {
      if (!eventsInSlot?.length) return [];
      
      // Un solo evento usa todo el ancho
      if (eventsInSlot.length === 1) {
        return [{
          event: eventsInSlot[0],
          column: 0,
          columnCount: 1
        }];
      }
      
      // Analizar solapamientos y ubicar en columnas
      const eventPositions = [];
      let columns = [];
      
      // Ordenar por hora de inicio
      const sortedEvents = [...eventsInSlot].sort((a, b) => {
        return new Date(a.start).getTime() - new Date(b.start).getTime();
      });
      
      // Contar eventos existentes
      const existingEventsCount = sortedEvents.length;
      
      // Actualizar conteo en el DOM
      const targetSlot = document.querySelector(
        `.calendar-time-slot[data-hour="${day.hour}"][data-minutes="${day.minutes}"]`
      );
      
      if (targetSlot) {
        targetSlot.setAttribute('data-events-count', existingEventsCount.toString());
        
        if (existingEventsCount >= maxSimultaneousEvents) {
          targetSlot.setAttribute('data-exceed-limit', 'true');
        } else {
          targetSlot.removeAttribute('data-exceed-limit');
        }
      }
      
      // Asignar columnas a cada evento
      sortedEvents.forEach(event => {
        let column = 0;
        while (columns[column] && eventsOverlapInTimeSlot(event, columns[column], day.date)) {
          column++;
        }
        
        columns[column] = event;
        
        eventPositions.push({
          event,
          column,
          columnCount: Math.max(column + 1, columns.filter(Boolean).length)
        });
      });
      
      // Actualizar el recuento de columnas para todos
      const maxColumn = Math.max(...eventPositions.map(ep => ep.column)) + 1;
      eventPositions.forEach(ep => {
        ep.columnCount = maxColumn;
      });
      
      return eventPositions;
    } catch (error) {
      console.error('Error al calcular posicionamiento:', error);
      return [];
    }
  };

  // Renderizar eventos en la celda
  const renderEvents = (day, hour, minutes = 0, duration) => {
    try {
      // Eventos continuos al inicio del día
      if (hour === 0 && minutes === 0) {
        const continuingEvents = renderContinuingEvents(day);
        if (continuingEvents?.length) return continuingEvents;
      }
      
      // Eventos que comienzan en esta celda
      const eventsStartingInSlot = events.filter(event => 
        shouldShowEventStart(event, day, hour, minutes, duration)
      );
      
      if (!eventsStartingInSlot.length) return null;
      
      // Calcular posicionamiento para eventos simultáneos
      const eventPositions = calculateEventPositioning(eventsStartingInSlot, {
        date: day, hour, minutes
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
        
        // Calcular posición relativa dentro de la celda
        const { offsetPixels } = getEventPositionInSlot(event, hour, minutes, duration, cellHeight);
        
        const isMicroEvent = heightPx < 25;
        const columnWidth = 100 / columnCount;
        
        const eventStyle = {
          position: 'absolute',
          top: `${offsetPixels}px`,
          height: `${heightPx}px`,
          left: `calc(${column * columnWidth}% + 2px)`,
          width: `calc(${columnWidth}% - 4px)`,
          zIndex: 20
        };
        
        return (
          <div 
            className={`event-wrapper ${continuesNextDay ? 'continues-next-day' : ''}`} 
            style={eventStyle} 
            key={`event-${event.id}-${day.getDate()}-${hour}-${minutes}`}
          >
            <EventItem
              key={event.id}
              event={event}
              onClick={onEventClick}
              onUpdate={(updatedEvent) => onUpdateEvent(updatedEvent.id, updatedEvent)}
              continuesNextDay={continuesNextDay}
              continuesFromPrevDay={false}
              gridSize={cellHeight}
              snapValue={snapValue}
              isMicroEvent={isMicroEvent}
              customSlots={customSlots}
              maxSimultaneousEvents={maxSimultaneousEvents}
            />
          </div>
        );
      });
    } catch (error) {
      console.error('Error al renderizar eventos:', error);
      return null;
    }
  };

  // Handlers para botones de franja
  const handleAddIntermediateClick = (hour, minutes = 0) => {
    if (hour < 23) {
      if (minutes === 0) {
        addCustomTimeSlot(hour, 30);
      } else if (minutes === 30) {
        addCustomTimeSlot(hour, 45);
      }
    }
  };
  
  const handleAddIntermediateSlotAt15 = (hour) => {
    if (hour < 23) addCustomTimeSlot(hour, 15);
  };
  
  const handleRemoveCustomSlot = (e, hour, minutes) => {
    e.stopPropagation();
    removeCustomTimeSlot(hour, minutes);
  };

  return (
    <div className={`calendar-grid ${isCompactScale ? 'time-scale-compact' : ''}`}>
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
          </div>
        ))}
      </div>

      {/* Rejilla horaria */}
      {hours.map((hour, hourIndex) => {
        // Calcular altura y duración de celda estándar
        const hasCustomSlots = customSlots[hour]?.length > 0;
        let standardSlotDuration = 60;
        
        if (hasCustomSlots) {
          const firstCustomSlot = [...customSlots[hour]].sort((a, b) => a.minutes - b.minutes)[0];
          standardSlotDuration = firstCustomSlot.minutes;
        }
        
        const standardSlotHeight = (standardSlotDuration / 60) * cellHeight;
        
        return (
          <React.Fragment key={hour}>
            {/* Fila de hora estándar */}
            <div className="calendar-row">
              <div 
                className="calendar-cell calendar-time" 
                style={{ 
                  height: `${standardSlotHeight}px`,
                  minHeight: `${standardSlotHeight}px`
                }}
              >
                {formatTimeSlot(hour)}
              </div>
              
              {days.map((day, dayIndex) => {
                const dateWithTime = new Date(day);
                dateWithTime.setHours(hour, 0, 0, 0);
                
                return (
                  <div 
                    key={dayIndex} 
                    className={`calendar-cell calendar-time-slot ${
                      standardSlotDuration === 15 ? 'time-slot-short' : 
                      standardSlotDuration === 30 ? 'time-slot-medium' : 
                      standardSlotDuration === 45 ? 'time-slot-large' : 
                      'time-slot-standard'
                    }`}
                    data-testid="calendar-time-slot"
                    data-hour={hour}
                    data-minutes={0}
                    onClick={() => onCellClick(dateWithTime, hour, 0, standardSlotDuration)}
                    style={{ 
                      height: `${standardSlotHeight}px`, 
                      minHeight: `${standardSlotHeight}px` 
                    }}
                  >
                    {renderEvents(day, hour, 0, standardSlotDuration)}
                  </div>
                );
              })}
            </div>
            
            {/* Botones de agregar franjas */}
            {hourIndex < hours.length - 1 && canAddIntermediateSlot(hour, 0) && (
              <div className="time-separator-row">
                <div className="time-separator-cell">
                  <button 
                    className="add-time-slot-button"
                    onClick={() => handleAddIntermediateClick(hour, 0)}
                    title={`Añadir franja ${hour}:30`}
                  >
                    <span className="material-icons">add</span>
                  </button>
                </div>
                {days.map((_, idx) => <div key={idx} className="time-separator-placeholder"></div>)}
              </div>
            )}
            
            {hourIndex < hours.length - 1 && canAddIntermediateSlotAt15(hour) && (
              <div className="time-separator-row">
                <div className="time-separator-cell">
                  <button 
                    className="add-time-slot-button"
                    onClick={() => handleAddIntermediateSlotAt15(hour)}
                    title={`Añadir franja ${hour}:15`}
                  >
                    <span className="material-icons">add</span>
                  </button>
                </div>
                {days.map((_, idx) => <div key={idx} className="time-separator-placeholder"></div>)}
              </div>
            )}
            
            {/* Franjas personalizadas */}
            {hasCustomSlots && customSlots[hour].map(slot => {
              // Calcular duración de la franja
              const sortedSlots = [...customSlots[hour]].sort((a, b) => a.minutes - b.minutes);
              const slotIndex = sortedSlots.findIndex(s => s.minutes === slot.minutes);
              
              let slotDuration = slot.duration || 30;
              if (slotIndex < sortedSlots.length - 1) {
                slotDuration = sortedSlots[slotIndex + 1].minutes - slot.minutes;
              } else {
                slotDuration = 60 - slot.minutes;
              }
              
              const slotHeight = (slotDuration / 60) * cellHeight;
              const canAddAfterThisSlot = canAddIntermediateSlot(hour, slot.minutes);
              
              return (
                <React.Fragment key={`custom-fragment-${hour}-${slot.minutes}`}>
                  <div className="calendar-row time-row-with-delete">
                    <div 
                      className="calendar-cell calendar-time calendar-time-custom" 
                      style={{ 
                        height: `${slotHeight}px`,
                        minHeight: `${slotHeight}px` 
                      }}
                    >
                      <button 
                        className="remove-time-slot-button"
                        onClick={(e) => handleRemoveCustomSlot(e, hour, slot.minutes)}
                        title={`Eliminar franja ${hour}:${slot.minutes.toString().padStart(2, '0')}`}
                        aria-label="Eliminar franja horaria"
                      >
                        <span className="material-icons">clear</span>
                      </button>
                      
                      {formatTimeSlot(hour, slot.minutes)}
                    </div>
                    
                    {days.map((day, dayIndex) => {
                      const dateWithTime = new Date(day);
                      dateWithTime.setHours(hour, slot.minutes, 0, 0);
                      
                      return (
                        <div 
                          key={dayIndex} 
                          className={`calendar-cell calendar-time-slot ${
                            slotDuration === 15 ? 'time-slot-short' : 
                            slotDuration === 30 ? 'time-slot-medium' : 
                            slotDuration === 45 ? 'time-slot-large' : 
                            'time-slot-standard'
                          }`}
                          data-testid="calendar-time-slot-custom"
                          data-hour={hour}
                          data-minutes={slot.minutes}
                          onClick={() => onCellClick(dateWithTime, hour, slot.minutes, slotDuration)}
                          style={{ 
                            height: `${slotHeight}px`, 
                            minHeight: `${slotHeight}px` 
                          }}
                        >
                          {renderEvents(day, hour, slot.minutes, slotDuration)}
                        </div>
                      );
                    })}
                  </div>
                  
                  {canAddAfterThisSlot && (
                    <div className="time-separator-row">
                      <div className="time-separator-cell">
                        <button 
                          className="add-time-slot-button"
                          onClick={() => handleAddIntermediateClick(hour, slot.minutes)}
                          title={`Añadir franja ${hour}:${slot.minutes === 30 ? '45' : '30'}`}
                        >
                          <span className="material-icons">add</span>
                        </button>
                      </div>
                      {days.map((_, idx) => <div key={idx} className="time-separator-placeholder"></div>)}
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