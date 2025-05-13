// use-event-resize.jsx - VERSIÓN CORREGIDA PARA AJUSTAR A HORAS COMPLETAS

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
    originalEndDate: null, // Guardaremos la fecha de fin original
    wasActuallyResized: false,
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
    
    // Guardar duración original y fecha de fin para cálculos posteriores
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
      wasActuallyResized: false,
      originalDuration: durationMinutes,
      originalEndDate: new Date(endDate), // Copia explícita de la fecha de fin original
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
      resizeInfo.current.wasActuallyResized = true;
      
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
    const wasRealResize = resizeInfo.current.wasActuallyResized;
    
    // Si hubo movimiento real, calcular cambios
    if (wasActuallyResized) {
      if (eventRef.current) {
        eventRef.current.classList.remove('resizing');
        eventRef.current.style.height = '';
        
        if (wasRealResize) {
          eventRef.current.dataset.recentlyResized = 'true';
          
          setTimeout(() => {
            if (eventRef.current) {
              eventRef.current.dataset.recentlyResized = 'false';
            }
          }, 1000);
        }
      }
      
      setResizing(false);
      
      // Actualizar si hubo cambio efectivo
      if (snapValue === 0) {
        // SIN SNAP: Calcular la diferencia en horas completas
        const cellDelta = Math.round(resizeInfo.current.deltaY / gridSize);
        
        if (cellDelta !== 0) {
          // Crear una nueva fecha para el fin
          const endDate = new Date(event.end);
          
          // Si no hay snap, ajustar a horas completas (desde la hora original)
          if (cellDelta > 0) {
            // Aumentar: Primero redondear a la siguiente hora completa, luego añadir las horas adicionales
            endDate.setHours(endDate.getHours() + cellDelta);
            // Ajustar a la siguiente hora completa
            endDate.setMinutes(0, 0, 0);
          } else {
            // Disminuir: Ajustar a la hora anterior completa
            endDate.setHours(endDate.getHours() + cellDelta);
            // Ajustar a la hora completa
            endDate.setMinutes(0, 0, 0);
          }
          
          // Asegurar que la fecha de fin es posterior a la de inicio
          const startDate = new Date(event.start);
          if (endDate <= startDate) {
            // Si el fin sería anterior al inicio, ajustar a 1 hora después del inicio
            endDate.setTime(startDate.getTime() + (60 * 60 * 1000));
          }
          
          const updatedEvent = {
            ...event,
            end: endDate.toISOString()
          };
          
          console.log('Evento redimensionado (ajustado a hora completa):', updatedEvent);
          onUpdate(updatedEvent);
        }
      } else {
        // CON SNAP: Usar el cálculo preciso con snap
        const minutesDelta = calculatePreciseTimeChange(resizeInfo.current.deltaY, true, gridSize, snapValue);
        
        if (minutesDelta !== 0) {
          const endDate = new Date(event.end);
          endDate.setMinutes(endDate.getMinutes() + minutesDelta);
          
          // Asegurar que la fecha de fin es posterior a la de inicio
          const startDate = new Date(event.start);
          if (endDate <= startDate) {
            // Si el fin sería anterior al inicio, ajustar según el snap
            endDate.setTime(startDate.getTime() + (snapValue * 60 * 1000));
          }
          
          const updatedEvent = {
            ...event,
            end: endDate.toISOString()
          };
          
          console.log('Evento redimensionado con snap:', updatedEvent);
          onUpdate(updatedEvent);
        }
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
    const handleDocumentClick = (evt) => {
      const timeElapsed = Date.now() - resizeInfo.current.endTime;
      
      if (timeElapsed < 300) {
        evt.stopPropagation();
        evt.preventDefault();
      }
      
      document.removeEventListener('click', handleDocumentClick, true);
      return false;
    };
    
    document.addEventListener('click', handleDocumentClick, true);
    
    // Desactivar bloqueo de clics después de un tiempo
    setTimeout(() => {
      setBlockClicks(false);
    }, 500);
    
    resizeInfo.current = { 
      resizing: false,
      endTime: resizeInfo.current.endTime,
      wasActuallyResized: wasRealResize
    };
  };

  return { resizing, handleResizeStart };
}