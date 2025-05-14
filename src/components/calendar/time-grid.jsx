// src/components/calendar/time-grid.jsx (corregido)
import React, { useContext } from 'react';
import EventItem from './event-item';
import useTimeGrid from '../../hooks/use-time-grid';
import { TimeScaleContext } from '../../contexts/time-scale-context';
import { TIME_SCALES } from '../../core/config/constants';

function TimeGrid({ 
  days, 
  events, 
  onEventClick, 
  onCellClick, 
  onUpdateEvent, 
  snapValue,
  renderDayHeader 
}) {
  // Obtener la escala de tiempo del contexto
  const timeScaleContext = useContext(TimeScaleContext);
  
  // Obtener la altura de celda desde el contexto de escala, con fallback al valor por defecto
  const cellHeight = timeScaleContext?.currentTimeScale?.height || 60;
  
  // Determinar si estamos usando escala compacta
  const isCompactScale = timeScaleContext?.currentTimeScale?.id === TIME_SCALES.COMPACT.id || 
                      (timeScaleContext?.currentTimeScale?.id === 'custom' && cellHeight <= 45);
  
  // Usar el hook de time-grid para la lógica de la rejilla
  const {
    hours,
    customSlots,
    shouldShowEventStart,
    isEventActiveAtStartOfDay,
    formatTimeSlot,
    addCustomTimeSlot,
    removeCustomTimeSlot,
    canAddIntermediateSlot
  } = useTimeGrid(0, 24, cellHeight);

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
        const heightPx = Math.max(20, Math.round(durationHours * cellHeight));
        
        // Determinar si es un evento pequeño (menos de 30 minutos)
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
              onUpdate={(updatedEvent) => {
                onUpdateEvent(updatedEvent.id, updatedEvent);
              }}
              continuesNextDay={continuesNextDay}
              continuesFromPrevDay={true}
              gridSize={cellHeight}
              snapValue={snapValue}
              isMicroEvent={isMicroEvent}
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
  const renderEvents = (day, hour, minutes = 0, duration) => {
    try {
      // Si es la primera hora del día, mostrar eventos que continúan del día anterior
      if (hour === 0 && minutes === 0) {
        const continuingEvents = renderContinuingEvents(day);
        if (continuingEvents && continuingEvents.length > 0) {
          return continuingEvents;
        }
      }
      
      // Eventos que comienzan exactamente en esta celda
      const eventsStartingInSlot = events.filter(event => 
        shouldShowEventStart(event, day, hour, minutes)
      );
      
      return eventsStartingInSlot.map(event => {
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
        
        // Calcular duración visible
        const durationMs = visibleEnd.getTime() - eventStart.getTime();
        const durationHours = durationMs / (1000 * 60 * 60);
        const heightPx = Math.max(20, Math.round(durationHours * cellHeight));
        
        // Determinar si es un evento pequeño (menos de 30 minutos)
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
            className={`event-wrapper ${continuesNextDay ? 'continues-next-day' : ''}`} 
            style={eventStyle} 
            key={`event-${event.id}-${day.getDate()}-${hour}-${minutes}`}
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
              gridSize={cellHeight}
              snapValue={snapValue}
              isMicroEvent={isMicroEvent}
            />
          </div>
        );
      });
    } catch (error) {
      console.error('Error al renderizar eventos:', error);
      return null;
    }
  };

  // Manejar clic en botón de agregar franja intermedia
  const handleAddIntermediateClick = (hour) => {
    if(hour < 23) { // No agregamos botón en la última hora
      // Por defecto, añadir a los 30 minutos de la hora
      addCustomTimeSlot(hour, 30);
    }
  };
  
  // Manejar clic en botón de eliminar franja personalizada
  const handleRemoveCustomSlot = (e, hour, minutes) => {
    e.stopPropagation(); // Evitar que se propague el clic
    removeCustomTimeSlot(hour, minutes);
  };

  return (
    <div className={`calendar-grid ${isCompactScale ? 'time-scale-compact' : ''}`}>
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

      {/* Rejilla horaria - Usamos las horas generadas por el hook */}
      {hours.map((hour, hourIndex) => {
        // Calcular la altura proporcional para las celdas estándar
        // Si hay franjas personalizadas para esta hora, la altura debe reducirse
        const hasCustomSlots = customSlots[hour] && customSlots[hour].length > 0;
        
        // Calcular la duración efectiva de la celda estándar (hora completa)
        let standardSlotDuration = 60; // Minutos por defecto
        
        if (hasCustomSlots) {
          // Si hay franjas personalizadas, la duración es hasta la primera franja
          const firstCustomSlot = [...customSlots[hour]].sort((a, b) => a.minutes - b.minutes)[0];
          standardSlotDuration = firstCustomSlot.minutes;
        }
        
        // Calcular la altura proporcional
        const standardSlotHeight = (standardSlotDuration / 60) * cellHeight;
        
        return (
          <React.Fragment key={hour}>
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
              
              {days.map((day, dayIndex) => (
                <div 
                  key={dayIndex} 
                  className={`calendar-cell calendar-time-slot ${
                    standardSlotDuration === 15 ? 'time-slot-short' : 
                    standardSlotDuration === 30 ? 'time-slot-medium' : 
                    standardSlotDuration === 45 ? 'time-slot-large' : 
                    'time-slot-standard'
                  }`}
                  data-testid="calendar-time-slot"
                  onClick={() => onCellClick(day, hour)}
                  style={{ 
                    height: `${standardSlotHeight}px`, 
                    minHeight: `${standardSlotHeight}px` 
                  }}
                >
                  {renderEvents(day, hour, 0, standardSlotDuration)}
                </div>
              ))}
            </div>
            
            {/* Agregar botón + entre horas, solo en la columna de horas */}
            {hourIndex < hours.length - 1 && canAddIntermediateSlot(hour, 0) && (
              <div className="time-separator-row">
                <div className="time-separator-cell">
                  <button 
                    className="add-time-slot-button"
                    onClick={() => handleAddIntermediateClick(hour)}
                    title={`Añadir franja ${hour}:30`}
                  >
                    <span className="material-icons">add</span>
                  </button>
                </div>
                
                {/* Celdas vacías para mantener la estructura de la tabla */}
                {days.map((_, dayIndex) => (
                  <div key={dayIndex} className="time-separator-placeholder"></div>
                ))}
              </div>
            )}
            
            {/* Renderizar franjas personalizadas si existen para esta hora */}
            {hasCustomSlots && customSlots[hour].map(slot => {
              // Calcular la duración real de esta franja personalizada
              let slotDuration = slot.duration || 30; // Valor predeterminado
              
              // Si hay más franjas, la duración es hasta la siguiente franja
              const sortedSlots = [...customSlots[hour]].sort((a, b) => a.minutes - b.minutes);
              const slotIndex = sortedSlots.findIndex(s => s.minutes === slot.minutes);
              
              if (slotIndex < sortedSlots.length - 1) {
                // Si hay una siguiente franja, la duración es hasta ella
                slotDuration = sortedSlots[slotIndex + 1].minutes - slot.minutes;
              } else {
                // Si es la última franja, la duración es hasta la siguiente hora
                slotDuration = 60 - slot.minutes;
              }
              
              // Calcular la altura proporcional
              const slotHeight = (slotDuration / 60) * cellHeight;
              
              return (
                <div key={`custom-${hour}-${slot.minutes}`} className="calendar-row time-row-with-delete">
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
                  
                  {days.map((day, dayIndex) => (
                    <div 
                      key={dayIndex} 
                      className={`calendar-cell calendar-time-slot ${
                        slotDuration === 15 ? 'time-slot-short' : 
                        slotDuration === 30 ? 'time-slot-medium' : 
                        slotDuration === 45 ? 'time-slot-large' : 
                        'time-slot-standard'
                      }`}
                      data-testid="calendar-time-slot-custom"
                      onClick={() => {
                        const date = new Date(day);
                        date.setHours(hour, slot.minutes, 0, 0);
                        onCellClick(date, hour);
                      }}
                      style={{ 
                        height: `${slotHeight}px`, 
                        minHeight: `${slotHeight}px` 
                      }}
                    >
                      {renderEvents(day, hour, slot.minutes, slotDuration)}
                    </div>
                  ))}
                </div>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default TimeGrid;