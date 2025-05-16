import React, { useRef, useState, useEffect } from 'react';
import { useEventDrag } from '../../hooks/use-event-drag';
import { useEventResize } from '../../hooks/use-event-resize';
import { formatEventTime } from '../../utils/time-utils';

function EventItem({ 
  event, 
  onClick, 
  onUpdate,
  continuesNextDay = false,
  continuesFromPrevDay = false,
  gridSize = 60, 
  snapValue = 0, 
  isMicroEvent = false, 
  customSlots = {}, 
  maxSimultaneousEvents = 3 
}) {
  const eventRef = useRef(null);
  const [blockClicks, setBlockClicks] = useState(false);
  
  // Custom hooks para drag y resize
  const { dragging, handleDragStart } = useEventDrag({
    eventRef,
    event,
    onUpdate,
    gridSize,
    snapValue,
    setBlockClicks,
    customSlots,
    maxSimultaneousEvents
  });
  
  const { resizing, handleResizeStart } = useEventResize({
    eventRef,
    event,
    onUpdate,
    gridSize,
    snapValue,
    setBlockClicks,
    customSlots
  });
  
  // Aplicar clase cuando se arrastra
  useEffect(() => {
    if (eventRef.current) {
      eventRef.current.dataset.beingDragged = dragging ? 'true' : 'false';
    }
  }, [dragging]);
  
  // Manejar clic para editar
  const handleClick = (e) => {
    if (blockClicks || eventRef.current?.dataset?.recentlyResized === 'true') {
      e.preventDefault();
      e.stopPropagation();
      
      if (eventRef.current?.dataset?.recentlyResized === 'true') {
        eventRef.current.dataset.recentlyResized = 'false';
      }
      
      return;
    }
    
    if (!dragging && !resizing) {
      e.preventDefault();
      e.stopPropagation();
      onClick(event);
    }
  };
  
  // Manejar inicio de arrastre
  const handleMouseDown = (e) => {
    if (e.target.classList.contains('event-resize-handle')) return;
    handleDragStart(e);
  };
  
  // Desbloquear clics en caso de error
  useEffect(() => {
    if (blockClicks) {
      const timer = setTimeout(() => setBlockClicks(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [blockClicks]);
  
  // Clases CSS condicionales
  const eventClasses = [
    'calendar-event',
    dragging ? 'dragging' : '',
    resizing ? 'resizing' : '',
    continuesNextDay ? 'continues-next-day' : '',
    continuesFromPrevDay ? 'continues-from-prev-day' : '',
    isMicroEvent ? 'micro-event' : ''
  ].filter(Boolean).join(' ');
  
  return (
    <div 
      ref={eventRef}
      className={eventClasses}
      style={{ backgroundColor: event.color }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      data-event-id={event.id}
      data-recently-resized="false"
      data-being-dragged="false"
    >
      <div className="event-title">{event.title}</div>
      <div className="event-time">{formatEventTime(event)}</div>
      
      {!continuesNextDay && ( 
        <div 
          className="event-resize-handle"
          onMouseDown={handleResizeStart}
        />
      )}
    </div>
  );
}

export default EventItem;