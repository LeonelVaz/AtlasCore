// use-event-resize.jsx - CORREGIDO PARA CONSIDERAR FRANJAS PERSONALIZADAS

import { useState, useRef, useEffect } from 'react';
import { initializeGridInfo } from '../utils/event-utils';

/**
 * Hook personalizado para manejar el redimensionamiento de eventos
 */
export function useEventResize({
  eventRef,
  event,
  onUpdate,
  gridSize = 60,
  snapValue = 0,
  setBlockClicks,
  customSlots = {} // Añadido: recibe información de franjas personalizadas
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
    originalEndDate: null,
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
      
      try {
        // Actualizar si hubo cambio efectivo
        if (snapValue === 0) {
          // MODIFICADO: Ajustar a franjas horarias existentes
          // Obtener fechas originales
          const originalEnd = new Date(event.end);
          const startDate = new Date(event.start);
          
          // Calcular proporción de casilla desplazada
          const cellRatio = resizeInfo.current.deltaY / gridSize;
          
          // NUEVA LÓGICA: Buscar la franja más cercana a la posición de destino
          // Calculamos la nueva hora y minutos deseados basados en el redimensionamiento
          let newEndHour = originalEnd.getHours();
          let newEndMinutes = originalEnd.getMinutes();
          
          // Calcular los minutos totales desplazados
          const totalMinutesShift = Math.round(cellRatio * 60);
          
          // Calcular la nueva posición deseada
          const currentTotalMinutes = newEndHour * 60 + newEndMinutes;
          const desiredTotalMinutes = currentTotalMinutes + totalMinutesShift;
          
          // Convertir de vuelta a horas y minutos
          newEndHour = Math.floor(desiredTotalMinutes / 60);
          newEndMinutes = desiredTotalMinutes % 60;
          
          // Asegurar que la hora está en el rango válido
          newEndHour = Math.max(0, Math.min(23, newEndHour));
          
          // Determinar la posición válida más cercana
          let validPositions = [0]; // Siempre tenemos la hora en punto (XX:00)
          
          // Añadir las franjas personalizadas para esta hora si existen
          if (customSlots[newEndHour]) {
            customSlots[newEndHour].forEach(slot => {
              validPositions.push(slot.minutes);
            });
          }
          
          // Añadir la siguiente hora en punto
          validPositions.push(0);
          
          // Encontrar la posición válida más cercana
          validPositions.sort((a, b) => a - b);
          const closestMinute = validPositions.reduce((prev, curr) => 
            Math.abs(curr - newEndMinutes) < Math.abs(prev - newEndMinutes) ? curr : prev, validPositions[0]);
          
          // Ajustar la hora final
          const newEndDate = new Date(originalEnd);
          
          // Si es la siguiente hora
          if (closestMinute === 0 && newEndMinutes > 30) {
            newEndDate.setHours(newEndHour + 1, 0, 0, 0);
          } else {
            newEndDate.setHours(newEndHour, closestMinute, 0, 0);
          }
          
          // Asegurar que la fecha de fin es posterior a la de inicio
          if (newEndDate <= startDate) {
            // Si el fin sería anterior al inicio, ajustar a 1 hora después del inicio
            newEndDate.setTime(startDate.getTime() + (60 * 60 * 1000));
          }
          
          // Solo actualizar si hay un cambio real
          if (newEndDate.getTime() !== originalEnd.getTime()) {
            const updatedEvent = {
              ...event,
              end: newEndDate.toISOString()
            };
            
            console.log('Evento redimensionado:', updatedEvent);
            onUpdate(updatedEvent);
          }
        } else {
          // CON SNAP: Usar cálculo preciso con snap
          // Convertir el cambio en píxeles a minutos según el snap
          const pixelsPerMinute = gridSize / 60;
          const snapPixels = snapValue * pixelsPerMinute;
          const snapIntervals = Math.round(resizeInfo.current.deltaY / snapPixels);
          const minutesDelta = snapIntervals * snapValue;
          
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