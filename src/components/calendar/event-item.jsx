import React, { useRef, useState, useEffect } from 'react';
import { useEventDrag } from '../../hooks/use-event-drag';
import { useEventResize } from '../../hooks/use-event-resize';
import { formatEventTime } from '../../utils/time-utils';

/**
 * Componente para evento individual con soporte para arrastrar y redimensionar
 */
function EventItem({ 
  event, 
  onClick, 
  onUpdate,
  continuesNextDay = false,
  continuesFromPrevDay = false,
  gridSize = 60, // Altura de una celda (1 hora)
  snapValue = 0  // Valor de snap en minutos (0 = desactivado)
}) {
  // Referencias y estado
  const eventRef = useRef(null);
  const [blockClicks, setBlockClicks] = useState(false);
  const dragStartInfo = useRef({ x: 0, y: 0, time: 0 });
  
  // Custom hooks para drag y resize
  const { dragging, handleDragStart } = useEventDrag({
    eventRef,
    event,
    onUpdate,
    gridSize,
    snapValue,
    setBlockClicks
  });
  
  const { resizing, handleResizeStart } = useEventResize({
    eventRef,
    event,
    onUpdate,
    gridSize,
    snapValue,
    setBlockClicks
  });
  
  // Manejar clic para editar
  const handleClick = (e) => {
    // Verificar si fue un clic simple o parte de un arrastre
    const now = Date.now();
    const timeDiff = now - dragStartInfo.current.time;
    const distX = Math.abs(e.clientX - dragStartInfo.current.x);
    const distY = Math.abs(e.clientY - dragStartInfo.current.y);
    
    // Si el clic es rápido (< 200ms) y no hubo movimiento significativo (< 5px)
    const isSimpleClick = timeDiff < 200 && distX < 5 && distY < 5;
    
    if (blockClicks) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    if (isSimpleClick && !dragging && !resizing) {
      e.preventDefault();
      e.stopPropagation();
      console.log('Clic en evento, abriendo editor...');
      onClick(event);
    }
  };
  
  // Manejar inicio de arrastre
  const handleMouseDown = (e) => {
    // Ignorar si es el handle de resize
    if (e.target.classList.contains('event-resize-handle')) {
      return;
    }
    
    // Guardar información de inicio para detectar si es clic o arrastre
    dragStartInfo.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
    
    // Iniciar posible arrastre (tendrá efecto solo si se mueve el mouse)
    handleDragStart(e);
  };
  
  // Desbloquear clics en caso de error
  useEffect(() => {
    if (blockClicks) {
      const timer = setTimeout(() => {
        setBlockClicks(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [blockClicks]);
  
  return (
    <div 
      ref={eventRef}
      className={`calendar-event ${dragging ? 'dragging' : ''} ${resizing ? 'resizing' : ''} 
                  ${continuesNextDay ? 'continues-next-day' : ''} 
                  ${continuesFromPrevDay ? 'continues-from-prev-day' : ''}`}
      style={{ backgroundColor: event.color }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      data-event-id={event.id}
    >
      <div className="event-title">{event.title}</div>
      <div className="event-time">{formatEventTime(event)}</div>
      
      {/* Solo mostrar el handle de redimensionamiento si no continúa al día siguiente */}
      {!continuesNextDay && ( 
        <div 
          className="event-resize-handle"
          onMouseDown={(e) => handleResizeStart(e)}
        />
      )}
    </div>
  );
}

export default EventItem;