// use-event-resize.jsx (optimizado)
import { useState, useRef, useEffect } from 'react';
import { initializeGridInfo } from '../utils/event-utils';

export function useEventResize({
  eventRef, event, onUpdate, gridSize = 60, snapValue = 0, 
  setBlockClicks, customSlots = {}
}) {
  const [resizing, setResizing] = useState(false);
  const resizeInfo = useRef({
    resizing: false,
    startY: 0,
    startHeight: 0,
    deltaY: 0,
    wasActuallyResized: false,
    originalDuration: null,
    originalEndDate: null,
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
      document.body.classList.remove('resizing-active', 'snap-active');
    };
  }, []);

  // Iniciar redimensionamiento
  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setBlockClicks(true);
    
    const gridInfo = initializeGridInfo(eventRef, gridSize, event);
    
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    const durationMinutes = (endDate - startDate) / (1000 * 60);
    
    resizeInfo.current = {
      resizing: true,
      startY: e.clientY,
      startHeight: eventRef.current.offsetHeight,
      deltaY: 0,
      startTime: Date.now(),
      wasActuallyResized: false,
      originalDuration: durationMinutes,
      originalEndDate: new Date(endDate),
      grid: {
        containerElement: gridInfo.containerElement,
        gridRect: gridInfo.gridRect,
        hourHeight: gridSize
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.classList.add('resizing-active');
    
    if (snapValue > 0) {
      document.body.classList.add('snap-active');
    }
    
    setTimeout(() => {
      if (resizeInfo.current.resizing) {
        setResizing(true);
        eventRef.current?.classList.add('resizing');
      }
    }, 100);
  };
  
  // Manejar movimiento durante el redimensionamiento
  const handleMouseMove = (e) => {
    if (!resizeInfo.current.resizing) return;
    
    const deltaY = e.clientY - resizeInfo.current.startY;
    const movedSignificantly = Math.abs(deltaY) > 3;
    
    if (movedSignificantly) {
      resizeInfo.current.wasActuallyResized = true;
      
      // Aplicar snap al redimensionamiento
      let adjustedDeltaY = deltaY;
      if (snapValue > 0) {
        const snapPixels = snapValue * (gridSize / 60);
        adjustedDeltaY = Math.round(deltaY / snapPixels) * snapPixels;
      }
      
      resizeInfo.current.deltaY = adjustedDeltaY;
      
      // Redimensionar verticalmente con snap
      let newHeight = Math.max(gridSize / 2, resizeInfo.current.startHeight + adjustedDeltaY);
      
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
    document.body.classList.remove('resizing-active', 'snap-active');
    
    const wasRealResize = resizeInfo.current.wasActuallyResized;
    
    if (wasRealResize) {
      if (eventRef.current) {
        eventRef.current.classList.remove('resizing');
        eventRef.current.style.height = '';
        eventRef.current.dataset.recentlyResized = 'true';
        
        setTimeout(() => {
          if (eventRef.current) {
            eventRef.current.dataset.recentlyResized = 'false';
          }
        }, 1000);
      }
      
      setResizing(false);
      
      try {
        if (snapValue === 0) {
          // Ajustar a franjas existentes
          const originalEnd = new Date(event.end);
          const startDate = new Date(event.start);
          
          const cellRatio = resizeInfo.current.deltaY / gridSize;
          
          // Calcular nueva hora y minutos
          let newEndHour = originalEnd.getHours();
          let newEndMinutes = originalEnd.getMinutes();
          
          const totalMinutesShift = Math.round(cellRatio * 60);
          const currentTotalMinutes = newEndHour * 60 + newEndMinutes;
          const desiredTotalMinutes = currentTotalMinutes + totalMinutesShift;
          
          newEndHour = Math.floor(desiredTotalMinutes / 60);
          newEndMinutes = desiredTotalMinutes % 60;
          newEndHour = Math.max(0, Math.min(23, newEndHour));
          
          // Encontrar posición válida más cercana
          let validPositions = [0];
          if (customSlots[newEndHour]) {
            customSlots[newEndHour].forEach(slot => {
              validPositions.push(slot.minutes);
            });
          }
          validPositions.push(0);
          validPositions.sort((a, b) => a - b);
          
          const closestMinute = validPositions.reduce((prev, curr) => 
            Math.abs(curr - newEndMinutes) < Math.abs(prev - newEndMinutes) ? curr : prev, validPositions[0]);
          
          const newEndDate = new Date(originalEnd);
          
          if (closestMinute === 0 && newEndMinutes > 30) {
            newEndDate.setHours(newEndHour + 1, 0, 0, 0);
          } else {
            newEndDate.setHours(newEndHour, closestMinute, 0, 0);
          }
          
          // Asegurar que fin es posterior a inicio
          if (newEndDate <= startDate) {
            newEndDate.setTime(startDate.getTime() + (60 * 60 * 1000));
          }
          
          if (newEndDate.getTime() !== originalEnd.getTime()) {
            onUpdate({
              ...event,
              end: newEndDate.toISOString()
            });
          }
        } else {
          // Usar cálculo con snap
          const pixelsPerMinute = gridSize / 60;
          const snapPixels = snapValue * pixelsPerMinute;
          const snapIntervals = Math.round(resizeInfo.current.deltaY / snapPixels);
          const minutesDelta = snapIntervals * snapValue;
          
          if (minutesDelta !== 0) {
            const endDate = new Date(event.end);
            endDate.setMinutes(endDate.getMinutes() + minutesDelta);
            
            const startDate = new Date(event.start);
            if (endDate <= startDate) {
              endDate.setTime(startDate.getTime() + (snapValue * 60 * 1000));
            }
            
            onUpdate({
              ...event,
              end: endDate.toISOString()
            });
          }
        }
      } catch (error) {
        console.error('Error al finalizar redimensionamiento:', error);
      }
    } else {
      // Si no hubo movimiento, limpiar estados
      if (eventRef.current) {
        eventRef.current.classList.remove('resizing');
        eventRef.current.style.height = '';
      }
      
      setResizing(false);
    }
    
    // Manejar clics después del redimensionamiento
    document.addEventListener('click', function handleDocumentClick(evt) {
      if (Date.now() - (resizeInfo.current.endTime || 0) < 300) {
        evt.stopPropagation();
        evt.preventDefault();
      }
      document.removeEventListener('click', handleDocumentClick, true);
    }, true);
    
    // Desactivar bloqueo después de un tiempo
    setTimeout(() => setBlockClicks(false), 500);
    
    resizeInfo.current = { 
      resizing: false,
      endTime: Date.now(),
      wasActuallyResized: wasRealResize
    };
  };

  return { resizing, handleResizeStart };
}