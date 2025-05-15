// use-event-drag.jsx (optimizado)
import { useState, useRef, useEffect } from 'react';
import { initializeGridInfo, findTargetSlot, calculatePreciseTimeChange } from '../utils/event-utils';

export function useEventDrag({
  eventRef, event, onUpdate, gridSize = 60, snapValue = 0, 
  setBlockClicks, customSlots = {}, maxSimultaneousEvents = 3
}) {
  const [dragging, setDragging] = useState(false);
  const dragInfo = useRef({
    dragging: false,
    startX: 0, startY: 0, deltaX: 0, deltaY: 0, virtualDeltaY: undefined,
    startTime: 0, endTime: 0, moved: false, wasActuallyDragged: false,
    originalDuration: null, originalStartMinutes: null, originalEvent: null,
    grid: {
      containerElement: null, gridRect: null, dayWidth: 0, hourHeight: gridSize,
      days: [], dayElements: [], inWeekView: false, startDay: null,
      startHour: 0, startMinute: 0, timeSlots: [], startSlot: null,
      targetSlot: null, targetHour: 0, targetMinutes: 0, targetEventsCount: 0
    },
    highlightedCell: null, wouldExceedLimit: false
  });

  // Limpieza
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      removeAllHighlights();
      removeAllLimitIndicators();
      document.body.classList.remove('dragging-active', 'snap-active');
    };
  }, []);

  // Funciones auxiliares
  const removeAllLimitIndicators = () => {
    document.querySelectorAll('.exceed-limit').forEach(cell => {
      cell.classList.remove('exceed-limit');
    });
  };

  const highlightTargetSlot = (targetSlot) => {
    removeAllHighlights();
    if (targetSlot) {
      targetSlot.classList.add(dragInfo.current.wouldExceedLimit ? 'exceed-limit-slot' : 'drag-target-active');
      dragInfo.current.highlightedCell = targetSlot;
    }
  };

  const removeAllHighlights = () => {
    if (dragInfo.current.highlightedCell) {
      dragInfo.current.highlightedCell.classList.remove('drag-target-active', 'exceed-limit-slot');
      dragInfo.current.highlightedCell = null;
    }
    document.querySelectorAll('.drag-target-active, .exceed-limit-slot').forEach(cell => {
      cell.classList.remove('drag-target-active', 'exceed-limit-slot');
    });
  };

  function findBestGuessSlot(clientX, clientY, dragInfo) {
    if (!dragInfo.grid?.timeSlots?.length) return null;
    
    let nearestSlot = null;
    let minDistance = Infinity;
    
    for (const slot of dragInfo.grid.timeSlots) {
      if (!slot.classList.contains('calendar-time-slot') && 
          !slot.classList.contains('day-view-hour-slot')) continue;
      
      const rect = slot.getBoundingClientRect();
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
    
    if (nearestSlot && dragInfo.grid.startSlot) {
      const targetRect = nearestSlot.getBoundingClientRect();
      const originalRect = dragInfo.grid.startSlot.getBoundingClientRect();
      dragInfo.virtualDeltaY = targetRect.top - originalRect.top;
      dragInfo.grid.targetSlot = nearestSlot;
      
      const hour = parseInt(nearestSlot.getAttribute('data-hour') || '0', 10);
      const minutes = parseInt(nearestSlot.getAttribute('data-minutes') || '0', 10);
      dragInfo.grid.targetHour = hour;
      dragInfo.grid.targetMinutes = minutes;
      
      const currentEventId = event.id;
      let eventsCount = 0;
      
      nearestSlot.querySelectorAll('.event-wrapper').forEach(wrapper => {
        const eventEl = wrapper.querySelector('.calendar-event');
        if (eventEl && eventEl.getAttribute('data-event-id') !== currentEventId) {
          eventsCount++;
        }
      });
      
      dragInfo.grid.targetEventsCount = eventsCount;
      dragInfo.wouldExceedLimit = eventsCount >= maxSimultaneousEvents;
    }
    
    return nearestSlot;
  }

  // Manejadores de eventos
  const handleDragStart = (e) => {
    if (e.target.classList.contains('event-resize-handle')) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (!event?.start || !event?.end) {
      console.error('Error: Evento sin propiedades start/end', event);
      return;
    }
    
    try {
      removeAllLimitIndicators();
      const gridInfo = initializeGridInfo(eventRef, gridSize, event);
      
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Error: Fechas inválidas en el evento', event);
        return;
      }
      
      const durationMinutes = (endDate - startDate) / (1000 * 60);
      
      dragInfo.current = {
        dragging: true,
        startX: e.clientX,
        startY: e.clientY,
        deltaX: 0, deltaY: 0, virtualDeltaY: undefined,
        startTime: Date.now(), endTime: 0, moved: false, wasActuallyDragged: false,
        originalDuration: durationMinutes,
        originalStartMinutes: startDate.getMinutes(),
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
  
  const handleMouseMove = (e) => {
    if (!dragInfo.current.dragging) return;
    
    const deltaX = e.clientX - dragInfo.current.startX;
    const deltaY = e.clientY - dragInfo.current.startY;
    const movedSignificantly = Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5;
    
    if (movedSignificantly && !dragInfo.current.moved) {
      dragInfo.current.moved = true;
      dragInfo.current.wasActuallyDragged = true;
      setBlockClicks(true);
      document.body.classList.add('dragging-active');
      if (snapValue > 0) document.body.classList.add('snap-active');
      
      setDragging(true);
      if (eventRef.current) {
        eventRef.current.classList.add('dragging');
        eventRef.current.style.opacity = '0.8';
      }
    }
    
    if (movedSignificantly) {
      dragInfo.current.deltaX = deltaX;
      dragInfo.current.deltaY = deltaY;
      
      if (eventRef.current) {
        eventRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      }
      
      const targetSlot = findTargetSlot(e.clientX, e.clientY, dragInfo.current);
      
      if (targetSlot) {
        if (targetSlot.classList.contains('calendar-time-slot') || 
            targetSlot.classList.contains('day-view-hour-slot')) {
            
          const hour = parseInt(targetSlot.getAttribute('data-hour') || '0', 10);
          const minutes = parseInt(targetSlot.getAttribute('data-minutes') || '0', 10);
          const currentEventId = event.id;
          let eventsCount = 0;
          
          targetSlot.querySelectorAll('.event-wrapper').forEach(wrapper => {
            const eventEl = wrapper.querySelector('.calendar-event');
            if (eventEl && eventEl.getAttribute('data-event-id') !== currentEventId) {
              eventsCount++;
            }
          });
          
          dragInfo.current.grid.targetHour = hour;
          dragInfo.current.grid.targetMinutes = minutes;
          dragInfo.current.grid.targetEventsCount = eventsCount;
          dragInfo.current.wouldExceedLimit = eventsCount >= maxSimultaneousEvents;
          
          if (dragInfo.current.wouldExceedLimit) {
            eventRef.current?.classList.add('cannot-place');
          } else {
            eventRef.current?.classList.remove('cannot-place');
          }
          
          highlightTargetSlot(targetSlot);
        }
      } else if (dragInfo.current.grid?.timeSlots.length > 0) {
        const bestGuessSlot = findBestGuessSlot(e.clientX, e.clientY, dragInfo.current);
        if (bestGuessSlot) highlightTargetSlot(bestGuessSlot);
      }
    }
  };
  
  const handleMouseUp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!dragInfo.current.dragging) return;
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    removeAllHighlights();
    removeAllLimitIndicators();
    document.body.classList.remove('dragging-active', 'snap-active');
    
    dragInfo.current.endTime = Date.now();
    const wasActuallyDragged = dragInfo.current.moved;
    const wasRealDrag = dragInfo.current.wasActuallyDragged;
    
    if (!wasActuallyDragged) {
      if (eventRef.current) {
        eventRef.current.classList.remove('dragging', 'cannot-place');
        eventRef.current.style.transform = '';
        eventRef.current.style.opacity = '1';
      }
      
      setDragging(false);
      dragInfo.current = { dragging: false };
      setBlockClicks(false);
      return;
    }
    
    if (dragInfo.current.wouldExceedLimit) {
      if (eventRef.current) {
        eventRef.current.style.transform = '';
        eventRef.current.style.opacity = '1';
        eventRef.current.classList.remove('dragging', 'cannot-place');
      }
      
      setDragging(false);
      setBlockClicks(true);
      setTimeout(() => setBlockClicks(false), 500);
      
      dragInfo.current = { 
        dragging: false,
        endTime: dragInfo.current.endTime,
        wasActuallyDragged: wasRealDrag
      };
      
      return;
    }
    
    if (wasActuallyDragged) {
      try {
        if (!event?.start || !event?.end) {
          console.error('Error: Evento sin propiedades start/end', event);
          return;
        }
  
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);
        const originalStart = new Date(event.start).getTime();
        const originalEnd = new Date(event.end).getTime();
        let daysDelta = 0;
  
        if (dragInfo.current.grid.inWeekView && dragInfo.current.grid.dayWidth > 0) {
          daysDelta = Math.round(dragInfo.current.deltaX / dragInfo.current.grid.dayWidth);
        }
        
        const deltaY = dragInfo.current.virtualDeltaY !== undefined 
                      ? dragInfo.current.virtualDeltaY 
                      : dragInfo.current.deltaY;
        
        if (snapValue === 0) {
          const hourDelta = deltaY / gridSize;
          const currentHour = startDate.getHours();
          const currentMinutes = startDate.getMinutes();
          
          let newHour = currentHour + Math.floor(hourDelta);
          let remainingMinutesFraction = hourDelta - Math.floor(hourDelta);
          let newMinutes = currentMinutes + Math.round(remainingMinutesFraction * 60);
          
          if (newMinutes >= 60) {
            newHour += 1;
            newMinutes -= 60;
          } else if (newMinutes < 0) {
            newHour -= 1;
            newMinutes += 60;
          }
          
          newHour = Math.max(0, Math.min(23, newHour));
          
          let validPositions = [0];
          if (customSlots[newHour]) {
            customSlots[newHour].forEach(slot => {
              validPositions.push(slot.minutes);
            });
          }
          
          validPositions.sort((a, b) => a - b);
          const closestMinute = validPositions.reduce((prev, curr) => 
            Math.abs(curr - newMinutes) < Math.abs(prev - newMinutes) ? curr : prev, validPositions[0]);
          
          startDate.setHours(newHour, closestMinute, 0, 0);
          const newEndDate = new Date(startDate.getTime() + (dragInfo.current.originalDuration * 60 * 1000));
          endDate.setTime(newEndDate.getTime());
        } else {
          const minutesDelta = calculatePreciseTimeChange(deltaY, false, gridSize, snapValue);
          startDate.setMinutes(startDate.getMinutes() + minutesDelta);
          endDate.setMinutes(endDate.getMinutes() + minutesDelta);
        }
        
        if (daysDelta !== 0) {
          startDate.setDate(startDate.getDate() + daysDelta);
          endDate.setDate(endDate.getDate() + daysDelta);
        }
        
        const newStart = startDate.getTime();
        const newEnd = endDate.getTime();
        const noRealChange = (newStart === originalStart && newEnd === originalEnd);
        
        if (eventRef.current) {
          eventRef.current.classList.remove('dragging', 'cannot-place');
          eventRef.current.style.transform = '';
          eventRef.current.style.opacity = '1';
          
          if (wasRealDrag && !noRealChange) {
            eventRef.current.dataset.recentlyDragged = 'true';
            setTimeout(() => {
              if (eventRef.current) eventRef.current.dataset.recentlyDragged = 'false';
            }, 1000);
          }
        }
        
        setDragging(false);
        
        if (!noRealChange) {
          onUpdate({
            ...event,
            start: startDate.toISOString(),
            end: endDate.toISOString()
          });
        }
      } catch (error) {
        console.error('Error al finalizar arrastre:', error);
        
        if (eventRef.current) {
          eventRef.current.classList.remove('dragging', 'cannot-place');
          eventRef.current.style.transform = '';
          eventRef.current.style.opacity = '1';
        }
      }
      
      // Manejar clics después del arrastre
      document.addEventListener('click', function handleDocumentClick(evt) {
        if (Date.now() - dragInfo.current.endTime < 300) {
          evt.stopPropagation();
          evt.preventDefault();
        }
        document.removeEventListener('click', handleDocumentClick, true);
        return false;
      }, true);
      
      setBlockClicks(true);
      setTimeout(() => setBlockClicks(false), 500);
      
      dragInfo.current = { 
        dragging: false,
        endTime: dragInfo.current.endTime,
        wasActuallyDragged: wasRealDrag
      };
    } else {
      if (eventRef.current) {
        eventRef.current.classList.remove('dragging', 'cannot-place');
        eventRef.current.style.transform = '';
        eventRef.current.style.opacity = '1';
      }
      
      setDragging(false);
      setBlockClicks(true);
      setTimeout(() => setBlockClicks(false), 500);
      
      dragInfo.current = { dragging: false };
    }
  };

  return { dragging, handleDragStart };
}