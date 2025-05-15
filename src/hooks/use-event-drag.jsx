// src/hooks/use-event-drag.jsx - Corregido para evitar el bloqueo aleatorio
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
  customSlots = {},
  maxSimultaneousEvents = 3
}) {
  const [dragging, setDragging] = useState(false);
  const dragInfo = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
    virtualDeltaY: undefined,
    listeners: false,
    startTime: 0,
    endTime: 0,
    moved: false,
    wasActuallyDragged: false,
    originalStartMinutes: null,
    originalDuration: null,
    originalEvent: null,
    grid: {
      containerElement: null,
      gridRect: null,
      dayWidth: 0,
      hourHeight: gridSize,
      days: [],
      dayElements: [],
      inWeekView: false,
      startDay: null,
      startHour: 0,
      startMinute: 0,
      timeSlots: [],
      startSlot: null,
      targetSlot: null,
      targetHour: 0,
      targetMinutes: 0,
      targetEventsCount: 0
    },
    highlightedCell: null,
    wouldExceedLimit: false
  });

  // Limpiar listeners y clases al desmontar
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      removeAllHighlights();
      removeAllLimitIndicators(); // NUEVO: Eliminar indicadores de límite
      document.body.classList.remove('dragging-active');
      document.body.classList.remove('snap-active');
    };
  }, []);

  // NUEVO: Función para eliminar todos los indicadores de límite
  const removeAllLimitIndicators = () => {
    // Eliminar clase exceed-limit de todas las celdas
    document.querySelectorAll('.exceed-limit').forEach(cell => {
      cell.classList.remove('exceed-limit');
    });
  };

  // Resaltar celda destino
  const highlightTargetSlot = (targetSlot) => {
    removeAllHighlights();
    
    if (targetSlot) {
      // Si excedería el límite, usar una clase visual diferente
      if (dragInfo.current.wouldExceedLimit) {
        targetSlot.classList.add('exceed-limit-slot');
      } else {
        targetSlot.classList.add('drag-target-active');
      }
      dragInfo.current.highlightedCell = targetSlot;
    }
  };
  
  // Eliminar resaltados
  const removeAllHighlights = () => {
    if (dragInfo.current.highlightedCell) {
      dragInfo.current.highlightedCell.classList.remove('drag-target-active');
      dragInfo.current.highlightedCell.classList.remove('exceed-limit-slot');
      dragInfo.current.highlightedCell = null;
    }
    
    document.querySelectorAll('.drag-target-active, .exceed-limit-slot').forEach(cell => {
      cell.classList.remove('drag-target-active');
      cell.classList.remove('exceed-limit-slot');
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
      // NUEVO: Limpiar todos los indicadores de límite al iniciar un arrastre
      removeAllLimitIndicators();
      
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
        virtualDeltaY: undefined,
        listeners: true,
        startTime: Date.now(),
        endTime: 0,
        moved: false,
        wasActuallyDragged: false,
        originalDuration: durationMinutes,
        originalStartMinutes: startMinutes,
        originalEvent: { ...event },
        grid: gridInfo,
        highlightedCell: null,
        wouldExceedLimit: false
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
      if (eventRef.current) {
        eventRef.current.classList.add('dragging');
        
        // Añadimos una ligera opacidad para ayudar a detectar elementos debajo
        eventRef.current.style.opacity = '0.8';
      }
    }
    
    if (movedSignificantly) {
      dragInfo.current.deltaX = deltaX;
      dragInfo.current.deltaY = deltaY;
      
      if (eventRef.current) {
        // Transformación visual durante el arrastre
        eventRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      }
      
      // Encontrar el slot objetivo
      const targetSlot = findTargetSlot(e.clientX, e.clientY, dragInfo.current);
      
      if (targetSlot) {
        // MEJORADO: Asegurar que estamos trabajando con la casilla correcta
        // Verificar que targetSlot sea una casilla de tiempo válida antes de procesarla
        if (targetSlot.classList.contains('calendar-time-slot') || 
            targetSlot.classList.contains('day-view-hour-slot')) {
            
          // Obtener datos precisos de la casilla objetivo
          const hour = parseInt(targetSlot.getAttribute('data-hour') || '0', 10);
          const minutes = parseInt(targetSlot.getAttribute('data-minutes') || '0', 10);
          
          // IMPORTANTE: Contar eventos excluyendo el que estamos arrastrando
          const currentEventId = event.id;
          let eventsCount = 0;
          
          // Contar eventos dentro de esta casilla específica 
          const eventWrappers = targetSlot.querySelectorAll('.event-wrapper');
          eventWrappers.forEach(wrapper => {
            const eventEl = wrapper.querySelector('.calendar-event');
            if (eventEl && eventEl.getAttribute('data-event-id') !== currentEventId) {
              // Solo contar si no es el evento actual
              eventsCount++;
            }
          });
          
          console.log(`Casilla en (${hour}:${minutes}): ${eventsCount} eventos. Límite: ${maxSimultaneousEvents}`);
          
          // Actualizar información en dragInfo
          dragInfo.current.grid.targetHour = hour;
          dragInfo.current.grid.targetMinutes = minutes;
          dragInfo.current.grid.targetEventsCount = eventsCount;
          
          // Determinar si excedería el límite
          dragInfo.current.wouldExceedLimit = eventsCount >= maxSimultaneousEvents;
          
          // Aplicar estilo visual correspondiente
          if (dragInfo.current.wouldExceedLimit) {
            if (eventRef.current) {
              // Agregar clase para indicar que no se puede colocar aquí
              eventRef.current.classList.add('cannot-place');
            }
          } else {
            if (eventRef.current) {
              // Quitar clase si ya no excede el límite
              eventRef.current.classList.remove('cannot-place');
            }
          }
          
          highlightTargetSlot(targetSlot);
        }
      } else if (dragInfo.current.grid && dragInfo.current.grid.timeSlots.length > 0) {
        // Fallback: si no encontramos slot, buscar uno cercano a la posición actual
        const bestGuessSlot = findBestGuessSlot(e.clientX, e.clientY, dragInfo.current);
        if (bestGuessSlot) {
          highlightTargetSlot(bestGuessSlot);
        }
      }
    }
  };
  
  /**
   * Función auxiliar para encontrar la mejor estimación de slot cuando no es fácil detectar uno
   */
  function findBestGuessSlot(clientX, clientY, dragInfo) {
    if (!dragInfo.grid || !dragInfo.grid.timeSlots.length) return null;
    
    const slots = dragInfo.grid.timeSlots;
    
    // Intentar una búsqueda por proximidad espacial
    let nearestSlot = null;
    let minDistance = Infinity;
    
    for (const slot of slots) {
      // MEJORADO: Verificar que sea una casilla de tiempo válida
      if (!slot.classList.contains('calendar-time-slot') && 
          !slot.classList.contains('day-view-hour-slot')) {
        continue;
      }
      
      const rect = slot.getBoundingClientRect();
      
      // Verificar si el cursor está dentro de los límites horizontales de la celda
      if (clientX >= rect.left && clientX <= rect.right) {
        const distance = Math.min(
          Math.abs(clientY - rect.top),
          Math.abs(clientY - rect.bottom)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestSlot = slot;
        }
      }
    }
    
    // Si encontramos una celda, actualizar virtualDeltaY
    if (nearestSlot && dragInfo.grid.startSlot) {
      const targetRect = nearestSlot.getBoundingClientRect();
      const originalRect = dragInfo.grid.startSlot.getBoundingClientRect();
      dragInfo.virtualDeltaY = targetRect.top - originalRect.top;
      dragInfo.grid.targetSlot = nearestSlot;
      
      // Obtener información de hora y minutos
      const hour = parseInt(nearestSlot.getAttribute('data-hour') || '0', 10);
      const minutes = parseInt(nearestSlot.getAttribute('data-minutes') || '0', 10);
      dragInfo.grid.targetHour = hour;
      dragInfo.grid.targetMinutes = minutes;
      
      // Verificar conteo de eventos (igual que en handleMouseMove)
      const currentEventId = event.id;
      let eventsCount = 0;
      
      const eventWrappers = nearestSlot.querySelectorAll('.event-wrapper');
      eventWrappers.forEach(wrapper => {
        const eventEl = wrapper.querySelector('.calendar-event');
        if (eventEl && eventEl.getAttribute('data-event-id') !== currentEventId) {
          eventsCount++;
        }
      });
      
      dragInfo.grid.targetEventsCount = eventsCount;
      
      // Determinar si excedería el límite
      dragInfo.wouldExceedLimit = eventsCount >= maxSimultaneousEvents;
    }
    
    return nearestSlot;
  }
  
  // Finalizar arrastre
  const handleMouseUp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!dragInfo.current.dragging) return;
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    removeAllHighlights();
    removeAllLimitIndicators(); // Limpiar indicadores de límite
    document.body.classList.remove('dragging-active');
    document.body.classList.remove('snap-active');
    
    dragInfo.current.endTime = Date.now();
    
    const wasActuallyDragged = dragInfo.current.moved;
    const wasRealDrag = dragInfo.current.wasActuallyDragged;
    
    // Si no hubo movimiento real, permitir que se maneje como clic
    if (!wasActuallyDragged) {
      if (eventRef.current) {
        eventRef.current.classList.remove('dragging');
        eventRef.current.classList.remove('cannot-place');
        eventRef.current.style.transform = '';
        eventRef.current.style.opacity = '1';
      }
      
      setDragging(false);
      dragInfo.current = { dragging: false };
      setBlockClicks(false); // Asegurarse de que no bloquee clics
      return;
    }
    
    // Verificar si excedería el límite antes de aplicar cambios
    const wouldExceedLimit = dragInfo.current.wouldExceedLimit;
    
    // Si hubo movimiento real pero excedería el límite, bloquear la acción
    if (wouldExceedLimit) {
      console.log('Acción bloqueada: excedería el límite de eventos simultáneos:', maxSimultaneousEvents);
      
      if (eventRef.current) {
        // Simplemente restaurar a su posición original
        eventRef.current.style.transform = '';
        eventRef.current.style.opacity = '1';
        eventRef.current.classList.remove('dragging');
        eventRef.current.classList.remove('cannot-place');
      }
      
      // Finalizar arrastre sin actualizaciones
      setDragging(false);
      
      // Bloquear temporalmente los clics para evitar la apertura del panel
      setBlockClicks(true);
      setTimeout(() => {
        setBlockClicks(false);
      }, 500);
      
      dragInfo.current = { 
        dragging: false,
        endTime: dragInfo.current.endTime,
        wasActuallyDragged: wasRealDrag
      };
      
      return;
    }
    
    // Si hubo movimiento real y no excede el límite, calcular cambios
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
  
        // Guardar los valores originales para comparar después
        const originalStart = new Date(event.start).getTime();
        const originalEnd = new Date(event.end).getTime();
  
        // Calcular cambio en días (solo para vista semanal)
        if (dragInfo.current.grid.inWeekView && dragInfo.current.grid.dayWidth > 0) {
          daysDelta = Math.round(dragInfo.current.deltaX / dragInfo.current.grid.dayWidth);
        }
        
        // Usar virtualDeltaY si está disponible
        const deltaY = dragInfo.current.virtualDeltaY !== undefined 
                     ? dragInfo.current.virtualDeltaY 
                     : dragInfo.current.deltaY;
        
        // Cálculo de ajuste de tiempo considerando franjas personalizadas
        if (snapValue === 0) {
          // Calcular el cambio aproximado en horas basado en el desplazamiento
          const hourDelta = deltaY / gridSize;
          
          // Obtener hora actual
          const currentHour = startDate.getHours();
          const currentMinutes = startDate.getMinutes();
          
          // Calcular la nueva hora y minutos deseados basados en el arrastre
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
          minutesDelta = calculatePreciseTimeChange(deltaY, false, gridSize, snapValue);
          startDate.setMinutes(startDate.getMinutes() + minutesDelta);
          endDate.setMinutes(endDate.getMinutes() + minutesDelta);
        }
        
        // Aplicar cambio de día (si hay)
        if (daysDelta !== 0) {
          startDate.setDate(startDate.getDate() + daysDelta);
          endDate.setDate(endDate.getDate() + daysDelta);
        }
        
        // NUEVA VERIFICACIÓN: Comprobar si el evento realmente cambió de posición
        const newStart = startDate.getTime();
        const newEnd = endDate.getTime();
        const noRealChange = (newStart === originalStart && newEnd === originalEnd);
        
        if (eventRef.current) {
          eventRef.current.classList.remove('dragging');
          eventRef.current.classList.remove('cannot-place');
          eventRef.current.style.transform = '';
          eventRef.current.style.opacity = '1';
          
          // Marcar el elemento como recientemente arrastrado solo si hubo cambio real
          if (wasRealDrag && !noRealChange) {
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
        
        // CORRECIÓN CLAVE: Actualizar evento SOLO si hubo un cambio real
        if (!noRealChange) {
          const updatedEvent = {
            ...event,
            start: startDate.toISOString(),
            end: endDate.toISOString()
          };
          
          console.log('Evento actualizado:', updatedEvent);
          onUpdate(updatedEvent);
        } else {
          console.log('No hubo cambio real en la posición del evento - no se actualiza');
        }
      } catch (error) {
        console.error('Error al finalizar arrastre:', error);
        
        // Restaurar posición en caso de error
        if (eventRef.current) {
          eventRef.current.classList.remove('dragging');
          eventRef.current.classList.remove('cannot-place');
          eventRef.current.style.transform = '';
          eventRef.current.style.opacity = '1';
        }
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
      
      // SIEMPRE bloquear clics brevemente después de un arrastre
      setBlockClicks(true);
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
      if (eventRef.current) {
        eventRef.current.classList.remove('dragging');
        eventRef.current.classList.remove('cannot-place');
        eventRef.current.style.transform = '';
        eventRef.current.style.opacity = '1';
      }
      
      setDragging(false);
      
      // Asegurarse de bloquear clics brevemente
      setBlockClicks(true);
      setTimeout(() => {
        setBlockClicks(false);
      }, 500);
      
      dragInfo.current = { dragging: false };
    }
  };
  

  return { dragging, handleDragStart };
}