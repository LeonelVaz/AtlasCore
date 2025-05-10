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
    if (blockClicks) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    // Añadir retardo pequeño para asegurar que no es parte de un arrastre
    setTimeout(() => {
      // Verificar nuevamente que no hay arrastre o redimensionamiento en curso
      if (!dragging && !resizing) {
        console.log('Clic en evento, abriendo editor...');
        onClick(event);
      }
    }, 10);
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
      onMouseDown={(e) => handleDragStart(e)}
      onClick={handleClick}
      data-event-id={event.id}
    >
      {/* Usando divs con evento de clic explícito para mejorar la interacción */}
      <div className="event-title" onClick={handleClick}>{event.title}</div>
      <div className="event-time" onClick={handleClick}>{formatEventTime(event)}</div>
      
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