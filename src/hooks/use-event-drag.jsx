// src/hooks/use-event-drag.jsx

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
  setBlockClicks
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
    
    // No bloquear clics inmediatamente, solo cuando se confirme el arrastre
    
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
    
    // No activar clases ni estado de arrastre hasta que haya movimiento real
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
        // Si snap está activado, ajustar la visualización de la transformación
        if (snapValue > 0) {
          // Convertir snapValue (minutos) a pixeles
          const snapPixels = snapValue * (dragInfo.current.grid.hourHeight / 60);
          const adjustedDeltaY = Math.round(deltaY / snapPixels) * snapPixels;
          
          // Aproximar horizontalmente a días
          let adjustedDeltaX = deltaX;
          if (dragInfo.current.grid.inWeekView && dragInfo.current.grid.dayWidth > 0) {
            adjustedDeltaX = Math.round(deltaX / dragInfo.current.grid.dayWidth) * dragInfo.current.grid.dayWidth;
          }
          
          eventRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        } else {
          // Sin snap, transformación normal
          eventRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        }
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

        // Calcular cambio por arrastre en minutos precisos
        minutesDelta = calculatePreciseTimeChange(dragInfo.current.deltaY, false, gridSize, snapValue);
        
        // Calcular cambio en días (solo para vista semanal)
        if (dragInfo.current.grid.inWeekView && dragInfo.current.grid.dayWidth > 0) {
          daysDelta = Math.round(dragInfo.current.deltaX / dragInfo.current.grid.dayWidth);
        }
        
        if (eventRef.current) {
          eventRef.current.classList.remove('dragging');
          eventRef.current.style.transform = '';
        }
        
        setDragging(false);
        
        // Actualizar si hubo cambio efectivo
        if (minutesDelta !== 0 || daysDelta !== 0) {
          const startDate = new Date(event.start);
          const endDate = new Date(event.end);
          
          // Verificar que las fechas son válidas
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.error('Error en handleMouseUp: Fechas inválidas en el evento', event);
            return;
          }
          
          // Si no hay snap activado, alinear con la hora completa pero mantener duración
          if (snapValue === 0) {
            // Obtener la hora completa más cercana basada en el desplazamiento
            const hourDelta = Math.round(dragInfo.current.deltaY / gridSize);
            
            // Ajustar la fecha para comenzar en una hora completa
            startDate.setHours(startDate.getHours() + hourDelta);
            startDate.setMinutes(0); // Resetear minutos a 0 para alinear con hora completa
            
            // Mantener la duración exacta original
            const durationMinutes = dragInfo.current.originalDuration;
            const newEndDate = new Date(startDate);
            newEndDate.setMinutes(newEndDate.getMinutes() + durationMinutes);
            
            // Actualizar solo endDate después de calcular basado en startDate
            endDate.setTime(newEndDate.getTime());
          } else {
            // Con snap activado, comportamiento normal
            startDate.setMinutes(startDate.getMinutes() + minutesDelta);
            endDate.setMinutes(endDate.getMinutes() + minutesDelta);
          }
          
          if (daysDelta !== 0) {
            startDate.setDate(startDate.getDate() + daysDelta);
            endDate.setDate(endDate.getDate() + daysDelta);
          }
          
          const updatedEvent = {
            ...event,
            start: startDate.toISOString(),
            end: endDate.toISOString()
          };
          
          console.log('Evento actualizado:', updatedEvent);
          onUpdate(updatedEvent);
        }
      } catch (error) {
        console.error('Error al finalizar arrastre:', error);
      }
      
      // Desactivar bloqueo de clics después de un tiempo
      setTimeout(() => {
        setBlockClicks(false);
      }, 300);
      
      // Manejar clics inmediatos después de soltar
      const handleDocumentClick = (event) => {
        const timeElapsed = Date.now() - dragInfo.current.endTime;
        if (timeElapsed < 100) {
          event.stopPropagation();
          event.preventDefault();
        }
        
        document.removeEventListener('click', handleDocumentClick, true);
        return false;
      };
      
      document.addEventListener('click', handleDocumentClick, true);
      
      const containerElement = dragInfo.current.grid ? dragInfo.current.grid.containerElement : null;
      const endTime = dragInfo.current.endTime;
      
      dragInfo.current = { 
        dragging: false,
        endTime: endTime
      };
      
      // Señalizar fin de arrastre
      if (containerElement) {
        containerElement.classList.add('just-dragged');
        containerElement.setAttribute('data-drag-time', String(endTime));
        
        setTimeout(() => {
          if (containerElement) {
            containerElement.classList.remove('just-dragged');
          }
        }, 150);
      }
    } else {
      // Si no hubo movimiento, limpiar estados
      setDragging(false);
      
      setTimeout(() => {
        setBlockClicks(false);
      }, 300);
      
      dragInfo.current = { dragging: false };
    }
  };

  return { dragging, handleDragStart };
}