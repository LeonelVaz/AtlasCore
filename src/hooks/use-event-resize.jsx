// use-event-resize.jsx - AJUSTE DE SENSIBILIDAD

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
        // LÓGICA AJUSTADA: Usar un umbral más alto (0.5 o 50% de una casilla)
        const deltaY = resizeInfo.current.deltaY;
        const originalEndDate = resizeInfo.current.originalEndDate;
        
        // Calcular el porcentaje de la casilla que se ha movido
        const hourDeltaRaw = deltaY / gridSize;
        
        // Crear una nueva fecha basada en la original (para hora-minuto-segundo)
        const newEndDate = new Date(originalEndDate);
        
        // Obtener la hora final original y minutos
        const originalHour = originalEndDate.getHours();
        const originalMinutes = originalEndDate.getMinutes();
        
        // Calcular la nueva hora final basada en el desplazamiento
        let newHour;
        
        if (hourDeltaRaw < 0) {
          // REDUCCIÓN: Hay que mover más del 70% de una casilla hacia arriba para ir a la hora anterior
          if (hourDeltaRaw <= -0.7) {
            // Redondear a la hora anterior
            newHour = originalHour - 1;
            newEndDate.setHours(newHour, 0, 0, 0);
          } else {
            // No es suficiente para cambiar de hora, mantener en la hora actual
            newHour = originalHour;
            newEndDate.setHours(newHour, 0, 0, 0);
          }
        } else {
          // EXTENSIÓN: Hay que mover más del 30% de una casilla hacia abajo para ir a la hora siguiente
          if (hourDeltaRaw >= 0.3) {
            // Redondear a la hora siguiente
            newHour = originalHour + 1;
            newEndDate.setHours(newHour, 0, 0, 0);
          } else {
            // No es suficiente para cambiar de hora, mantener en la hora actual
            newHour = originalHour;
            newEndDate.setHours(newHour, 0, 0, 0);
          }
        }
        
        // Verificar que la fecha ha cambiado antes de actualizar
        if (newEndDate.getTime() !== originalEndDate.getTime()) {
          const updatedEvent = {
            ...event,
            end: newEndDate.toISOString()
          };
          
          console.log('Evento redimensionado:', updatedEvent);
          onUpdate(updatedEvent);
        }
      } else {
        // Con snap activado, comportamiento normal con minutos delta precisos
        const minutesDelta = calculatePreciseTimeChange(resizeInfo.current.deltaY, true, gridSize, snapValue);
        
        if (minutesDelta !== 0) {
          const endDate = new Date(event.end);
          endDate.setMinutes(endDate.getMinutes() + minutesDelta);
          
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