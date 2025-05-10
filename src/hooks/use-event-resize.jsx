import { useState, useRef, useEffect } from 'react';
import { initializeGridInfo, calculatePreciseTimeChange } from '../utils/event-utils';

/**
 * Hook personalizado para manejar el redimensionamiento de eventos
 */
export function useEventResize({
  eventRef,
  event,
  onUpdate,
  gridSize = 60,
  snapValue = 0,
  setBlockClicks
}) {
  const [resizing, setResizing] = useState(false);
  const resizeInfo = useRef({
    resizing: false,
    startX: 0,
    startY: 0,
    startHeight: 0,
    deltaY: 0,
    listeners: false,
    startTime: 0,
    endTime: 0,
    moved: false,
    originalDuration: null,
    grid: {
      containerElement: null,
      gridRect: null,
      hourHeight: gridSize
    }
  });

  // Limpiar listeners al desmontar
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('resizing-active');
      document.body.classList.remove('snap-active');
    };
  }, []);

  // Iniciar redimensionamiento
  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setBlockClicks(true);
    
    const gridInfo = initializeGridInfo(eventRef, gridSize, event);
    
    // Guardar duración original para cálculos posteriores
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    const durationMinutes = (endDate - startDate) / (1000 * 60);
    
    resizeInfo.current = {
      resizing: true,
      startX: e.clientX,
      startY: e.clientY,
      startHeight: eventRef.current.offsetHeight,
      deltaY: 0,
      listeners: true,
      startTime: Date.now(),
      endTime: 0,
      moved: false,
      originalDuration: durationMinutes,
      grid: {
        containerElement: gridInfo.containerElement,
        gridRect: gridInfo.gridRect,
        hourHeight: gridSize
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    document.body.classList.add('resizing-active');
    
    // Si snap está activo, añadir clase especial
    if (snapValue > 0) {
      document.body.classList.add('snap-active');
    }
    
    setTimeout(() => {
      if (resizeInfo.current.resizing) {
        setResizing(true);
        if (eventRef.current) eventRef.current.classList.add('resizing');
      }
    }, 100);
  };
  
  // Manejar movimiento durante el redimensionamiento
  const handleMouseMove = (e) => {
    if (!resizeInfo.current.resizing) return;
    
    const deltaY = e.clientY - resizeInfo.current.startY;
    
    const movedSignificantly = Math.abs(deltaY) > 3;
    
    if (movedSignificantly) {
      resizeInfo.current.moved = true;
      
      // Aplicar snap al redimensionamiento
      let adjustedDeltaY = deltaY;
      if (snapValue > 0) {
        // Convertir snapValue (minutos) a pixeles
        const snapPixels = snapValue * (gridSize / 60);
        adjustedDeltaY = Math.round(deltaY / snapPixels) * snapPixels;
      }
      
      resizeInfo.current.deltaY = adjustedDeltaY;
      
      // Redimensionar verticalmente con snap
      let newHeight = resizeInfo.current.startHeight + adjustedDeltaY;
      newHeight = Math.max(gridSize / 2, newHeight); // Altura mínima
      
      if (eventRef.current) {
        eventRef.current.style.height = `${newHeight}px`;
      }
    }
  };
  
  // Finalizar redimensionamiento
  const handleMouseUp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!resizeInfo.current.resizing) return;
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.classList.remove('resizing-active');
    document.body.classList.remove('snap-active');
    
    resizeInfo.current.endTime = Date.now();
    
    const wasActuallyResized = resizeInfo.current.moved;
    
    // Si hubo movimiento real, calcular cambios
    if (wasActuallyResized) {
      // Calcular cambio por redimensionamiento en minutos precisos
      const minutesDelta = calculatePreciseTimeChange(resizeInfo.current.deltaY, true, gridSize, snapValue);
      
      if (eventRef.current) {
        eventRef.current.classList.remove('resizing');
        eventRef.current.style.height = '';
      }
      
      setResizing(false);
      
      // Actualizar si hubo cambio efectivo
      if (minutesDelta !== 0) {
        const endDate = new Date(event.end);
        
        // Solo cambia tiempo de fin en minutos precisos
        endDate.setMinutes(endDate.getMinutes() + minutesDelta);
        
        const updatedEvent = {
          ...event,
          end: endDate.toISOString()
        };
        
        console.log('Evento redimensionado:', updatedEvent);
        onUpdate(updatedEvent);
      }
    } else {
      // Si no hubo movimiento, limpiar estados
      if (eventRef.current) {
        eventRef.current.classList.remove('resizing');
        eventRef.current.style.height = '';
      }
      
      setResizing(false);
    }
    
    // Desactivar bloqueo de clics
    setTimeout(() => {
      setBlockClicks(false);
    }, 300);
    
    resizeInfo.current = { resizing: false };
  };

  return { resizing, handleResizeStart };
}