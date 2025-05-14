// use-event-drag.jsx - CORREGIDO (ARREGLANDO ERROR DE startDate)

import { useState, useRef, useEffect } from 'react';
import { initializeGridInfo, findTargetSlot, calculatePreciseTimeChange } from '../utils/event-utils';

/**
 * Hook personalizado para manejar el arrastre de eventos
 */
export function useEventDrag({
  eventRef,
  event,
  onUpdate,
  gridSize = 60,
  snapValue = 0,
  setBlockClicks,
  customSlots = {} // Añadido: recibe información de franjas personalizadas
}) {
  const [dragging, setDragging] = useState(false);
  const dragInfo = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
    listeners: false,
    startTime: 0,
    endTime: 0,
    moved: false,
    wasActuallyDragged: false,
    originalStartMinutes: null,
    originalDuration: null,
    grid: {
      containerElement: null,
      gridRect: null,
      dayWidth: 0,
      hourHeight: gridSize,
      days: [],
      dayElements: [],
      startDay: null,
      startHour: 0,
      timeSlots: [],
      startSlot: null,
      targetSlot: null
    },
    highlightedCell: null
  });

  // Limpiar listeners al desmontar
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      removeAllHighlights();
      document.body.classList.remove('dragging-active');
      document.body.classList.remove('snap-active');
    };
  }, []);

  // Resaltar celda destino
  const highlightTargetSlot = (targetSlot) => {
    removeAllHighlights();
    
    if (targetSlot) {
      targetSlot.classList.add('drag-target-active');
      dragInfo.current.highlightedCell = targetSlot;
    }
  };
  
  // Eliminar resaltados
  const removeAllHighlights = () => {
    if (dragInfo.current.highlightedCell) {
      dragInfo.current.highlightedCell.classList.remove('drag-target-active');
      dragInfo.current.highlightedCell = null;
    }
    
    document.querySelectorAll('.drag-target-active').forEach(cell => {
      cell.classList.remove('drag-target-active');
    });
  };

  // Iniciar arrastre
  const handleDragStart = (e) => {
    // Verificar si se hace clic en el handle de resize (que debe seguir funcionando solo para resize)
    if (e.target.classList.contains('event-resize-handle')) {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    // Verificamos que el evento tenga las propiedades necesarias
    if (!event || !event.start || !event.end) {
      console.error('Error en handleDragStart: Evento sin propiedades start/end', event);
      return;
    }
    
    try {
      const gridInfo = initializeGridInfo(eventRef, gridSize, event);
      
      // Guardar duración original y minutos de inicio para cálculos posteriores
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      
      // Verificar que las fechas son válidas
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Error en handleDragStart: Fechas inválidas en el evento', event);
        return;
      }
      
      const durationMinutes = (endDate - startDate) / (1000 * 60);
      const startMinutes = startDate.getMinutes();
      
      dragInfo.current = {
        dragging: true,
        startX: e.clientX,
        startY: e.clientY,
        deltaX: 0,
        deltaY: 0,
        listeners: true,
        startTime: Date.now(),
        endTime: 0,
        moved: false,
        wasActuallyDragged: false,
        originalDuration: durationMinutes,
        originalStartMinutes: startMinutes,
        grid: gridInfo,
        highlightedCell: null
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } catch (error) {
      console.error('Error al iniciar arrastre:', error);
    }
  };
  
  // Manejar movimiento durante el arrastre
  const handleMouseMove = (e) => {
    if (!dragInfo.current.dragging) return;
    
    const deltaX = e.clientX - dragInfo.current.startX;
    const deltaY = e.clientY - dragInfo.current.startY;
    
    const movedSignificantly = Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5;
    
    if (movedSignificantly && !dragInfo.current.moved) {
      // Primera vez que se detecta movimiento significativo, iniciar arrastre real
      dragInfo.current.moved = true;
      dragInfo.current.wasActuallyDragged = true;
      setBlockClicks(true);
      document.body.classList.add('dragging-active');
      
      // Si snap está activo, añadir clase especial
      if (snapValue > 0) {
        document.body.classList.add('snap-active');
      }
      
      setDragging(true);
      if (eventRef.current) eventRef.current.classList.add('dragging');
    }
    
    if (movedSignificantly) {
      dragInfo.current.deltaX = deltaX;
      dragInfo.current.deltaY = deltaY;
      
      if (eventRef.current) {
        // Transformación visual durante el arrastre
        eventRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      }
      
      const targetSlot = findTargetSlot(e.clientX, e.clientY, dragInfo.current);
      if (targetSlot) {
        dragInfo.current.grid.targetSlot = targetSlot;
        highlightTargetSlot(targetSlot);
      }
    }
  };
  
  // Finalizar arrastre
  const handleMouseUp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!dragInfo.current.dragging) return;
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    removeAllHighlights();
    document.body.classList.remove('dragging-active');
    document.body.classList.remove('snap-active');
    
    dragInfo.current.endTime = Date.now();
    
    const wasActuallyDragged = dragInfo.current.moved;
    const wasRealDrag = dragInfo.current.wasActuallyDragged;
    
    // Si no hubo movimiento real, permitir que se maneje como clic
    if (!wasActuallyDragged) {
      if (eventRef.current) {
        eventRef.current.classList.remove('dragging');
        eventRef.current.style.transform = '';
      }
      
      setDragging(false);
      dragInfo.current = { dragging: false };
      return;
    }
    
    // Si hubo movimiento real, calcular cambios
    if (wasActuallyDragged) {
      let minutesDelta = 0;
      let daysDelta = 0;
      
      try {
        // Verificar que el evento tenga las propiedades necesarias
        if (!event || !event.start || !event.end) {
          console.error('Error en handleMouseUp: Evento sin propiedades start/end', event);
          return;
        }

        // Inicializar fechas de inicio y fin
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);

        // Calcular cambio en días (solo para vista semanal)
        if (dragInfo.current.grid.inWeekView && dragInfo.current.grid.dayWidth > 0) {
          daysDelta = Math.round(dragInfo.current.deltaX / dragInfo.current.grid.dayWidth);
        }
        
        // MODIFICADO: Cálculo de ajuste de tiempo considerando franjas personalizadas
        if (snapValue === 0) {
          // Calcular el cambio aproximado en horas basado en el desplazamiento
          const hourDelta = dragInfo.current.deltaY / gridSize;
          
          // Obtener hora actual
          const currentHour = startDate.getHours();
          const currentMinutes = startDate.getMinutes();
          
          // NUEVA LÓGICA: Buscar la franja más cercana a la posición de destino
          // Calculamos la nueva hora y minutos deseados basados en el arrastre
          let newHour = currentHour + Math.floor(hourDelta);
          let remainingMinutesFraction = hourDelta - Math.floor(hourDelta);
          let newMinutes = currentMinutes + Math.round(remainingMinutesFraction * 60);
          
          // Normalizar hora y minutos
          if (newMinutes >= 60) {
            newHour += 1;
            newMinutes -= 60;
          } else if (newMinutes < 0) {
            newHour -= 1;
            newMinutes += 60;
          }
          
          // Asegurar que la hora está en el rango válido
          newHour = Math.max(0, Math.min(23, newHour));
          
          // Determinar la posición válida más cercana
          let validPositions = [0]; // Siempre tenemos la hora en punto (XX:00)
          
          // Añadir las franjas personalizadas para esta hora si existen
          if (customSlots[newHour]) {
            customSlots[newHour].forEach(slot => {
              validPositions.push(slot.minutes);
            });
          }
          
          // Encontrar la posición válida más cercana
          validPositions.sort((a, b) => a - b);
          const closestMinute = validPositions.reduce((prev, curr) => 
            Math.abs(curr - newMinutes) < Math.abs(prev - newMinutes) ? curr : prev, validPositions[0]);
          
          // Ajustar a la posición válida más cercana
          startDate.setHours(newHour, closestMinute, 0, 0);
          
          // Mantener la duración original
          const newEndDate = new Date(startDate.getTime() + (dragInfo.current.originalDuration * 60 * 1000));
          endDate.setTime(newEndDate.getTime());
        } else {
          // Con snap activado, usar el comportamiento normal
          minutesDelta = calculatePreciseTimeChange(dragInfo.current.deltaY, false, gridSize, snapValue);
          startDate.setMinutes(startDate.getMinutes() + minutesDelta);
          endDate.setMinutes(endDate.getMinutes() + minutesDelta);
        }
        
        // Aplicar cambio de día (si hay)
        if (daysDelta !== 0) {
          startDate.setDate(startDate.getDate() + daysDelta);
          endDate.setDate(endDate.getDate() + daysDelta);
        }
        
        if (eventRef.current) {
          eventRef.current.classList.remove('dragging');
          eventRef.current.style.transform = '';
          
          // Marcar el elemento como recientemente arrastrado
          if (wasRealDrag) {
            eventRef.current.dataset.recentlyDragged = 'true';
            
            // Programar la limpieza de este estado después de un tiempo
            setTimeout(() => {
              if (eventRef.current) {
                eventRef.current.dataset.recentlyDragged = 'false';
              }
            }, 1000);
          }
        }
        
        setDragging(false);
        
        // Actualizar evento
        const updatedEvent = {
          ...event,
          start: startDate.toISOString(),
          end: endDate.toISOString()
        };
        
        console.log('Evento actualizado:', updatedEvent);
        onUpdate(updatedEvent);
      } catch (error) {
        console.error('Error al finalizar arrastre:', error);
      }
      
      // Manejar clics inmediatos después de soltar el arrastre
      const handleDocumentClick = (evt) => {
        const timeElapsed = Date.now() - dragInfo.current.endTime;
        if (timeElapsed < 300) { // Si el clic es menos de 300ms después de soltar
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
      
      dragInfo.current = { 
        dragging: false,
        endTime: dragInfo.current.endTime,
        wasActuallyDragged: wasRealDrag
      };
    } else {
      // Si no hubo movimiento, limpiar estados
      setDragging(false);
      
      setTimeout(() => {
        setBlockClicks(false);
      }, 500);
      
      dragInfo.current = { dragging: false };
    }
  };

  return { dragging, handleDragStart };
}