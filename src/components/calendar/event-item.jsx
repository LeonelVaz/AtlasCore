// event-item.jsx

import React, { useState, useEffect, useRef } from 'react';

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
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [blockClicks, setBlockClicks] = useState(false);
  
  // Información para seguimiento del arrastre/redimensionamiento
  const dragInfo = useRef({
    dragging: false,
    isResize: false,
    startX: 0,
    startY: 0,
    startHeight: 0,
    deltaX: 0,
    deltaY: 0,
    listeners: false,
    startTime: 0,
    endTime: 0,
    moved: false,
    // Valores originales del evento para cálculos
    originalDuration: null,
    originalStartMinutes: null,
    // Rejilla para movimiento bidimensional
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
  
  // Formatear horario del evento
  const formatEventTime = () => {
    try {
      const start = new Date(event.start);
      const end = new Date(event.end);
      
      return `${start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - 
              ${end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    } catch (error) {
      console.error('Error al formatear hora del evento:', error);
      return '';
    }
  };
  
  // Calcular duración del evento en minutos
  const calculateEventDuration = () => {
    try {
      const start = new Date(event.start);
      const end = new Date(event.end);
      return (end - start) / (1000 * 60); // Duración en minutos
    } catch (error) {
      console.error('Error al calcular duración del evento:', error);
      return 60; // Valor por defecto: 1 hora
    }
  };
  
  // Inicializar información de rejilla
  const initializeGridInfo = () => {
    try {
      const isWeekView = eventRef.current.closest('.calendar-grid') !== null;
      const isInDayView = eventRef.current.closest('.day-view-container') !== null;
      
      const currentSlot = eventRef.current.closest('.calendar-time-slot') || 
                          eventRef.current.closest('.day-view-hour-slot');
      
      let timeSlots = [];
      let container = null;
      
      if (isWeekView) {
        container = eventRef.current.closest('.calendar-grid');
        timeSlots = container ? Array.from(container.querySelectorAll('.calendar-time-slot')) : [];
      } else {
        container = eventRef.current.closest('.day-view-container');
        timeSlots = container ? Array.from(container.querySelectorAll('.day-view-hour-slot')) : [];
      }
      
      // Vista diaria (solo info vertical)
      if (isInDayView) {
        return {
          containerElement: container,
          gridRect: container ? container.getBoundingClientRect() : null,
          dayWidth: 0,
          hourHeight: gridSize,
          days: [],
          dayElements: [],
          inWeekView: false,
          startDay: new Date(event.start),
          startHour: new Date(event.start).getHours(),
          startMinute: new Date(event.start).getMinutes(), // Añadir minutos del inicio
          timeSlots,
          startSlot: currentSlot,
          targetSlot: currentSlot
        };
      }
      
      // Vista semanal (info horizontal y vertical)
      const gridElement = container;
      const gridRect = gridElement?.getBoundingClientRect();
      
      const headerRow = gridElement?.querySelector('.calendar-header-row');
      const dayHeaders = headerRow?.querySelectorAll('.calendar-day-header');
      const dayElements = [];
      const days = [];
      
      let totalDayWidth = 0;
      let dayCount = 0;
      
      if (dayHeaders) {
        dayHeaders.forEach((dayHeader, index) => {
          if (index > 0) { // Ignorar header de tiempo
            const headerText = dayHeader.textContent || '';
            const dateParts = headerText.split(',');
            if (dateParts.length > 1) {
              let dayDate = new Date();
              
              try {
                const monthYearStr = dateParts[1].trim();
                const [day, month] = monthYearStr.split(' ');
                const monthIndex = getMonthIndex(month);
                
                if (!isNaN(parseInt(day)) && monthIndex !== -1) {
                  dayDate = new Date();
                  dayDate.setDate(parseInt(day));
                  dayDate.setMonth(monthIndex);
                }
              } catch (e) {
                console.log('Error parsing date from header:', e);
              }
              
              days.push(dayDate);
              dayElements.push(dayHeader);
              
              const dayRect = dayHeader.getBoundingClientRect();
              totalDayWidth += dayRect.width;
              dayCount++;
            }
          }
        });
      }
      
      const avgDayWidth = dayCount > 0 ? totalDayWidth / dayCount : gridRect ? gridRect.width / 7 : 0;
      const startDay = new Date(event.start);
      const startHour = startDay.getHours();
      const startMinute = startDay.getMinutes(); // Añadir minutos del inicio
      
      return {
        containerElement: gridElement,
        gridRect,
        dayWidth: avgDayWidth,
        hourHeight: gridSize,
        days,
        dayElements,
        inWeekView: true,
        startDay,
        startHour,
        startMinute, // Incluir minutos del inicio
        timeSlots,
        startSlot: currentSlot,
        targetSlot: currentSlot
      };
    } catch (error) {
      console.error('Error initializing grid info:', error);
      return {
        containerElement: null,
        gridRect: null,
        dayWidth: 0,
        hourHeight: gridSize,
        days: [],
        dayElements: [],
        inWeekView: false,
        startDay: new Date(event.start),
        startHour: new Date(event.start).getHours(),
        startMinute: new Date(event.start).getMinutes(),
        timeSlots: [],
        startSlot: null,
        targetSlot: null
      };
    }
  };
  
  // Convertir nombre de mes a índice
  const getMonthIndex = (monthName) => {
    const months = {
      'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
      'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
    };
    
    for (const [abbr, index] of Object.entries(months)) {
      if (monthName.toLowerCase().startsWith(abbr)) {
        return index;
      }
    }
    
    return -1;
  };
  
  // Encontrar celda destino según posición
  const findTargetSlot = (clientX, clientY) => {
    if (!dragInfo.current.grid || !dragInfo.current.grid.timeSlots.length) {
      return null;
    }
    
    const deltaY = clientY - dragInfo.current.startY;
    const deltaX = clientX - dragInfo.current.startX;
    
    // Aplicar snap a la posición vertical (tiempo)
    let adjustedDeltaY = deltaY;
    if (snapValue > 0) {
      // Convertir snapValue (minutos) a pixeles
      const snapPixels = snapValue * (gridSize / 60);
      adjustedDeltaY = Math.round(deltaY / snapPixels) * snapPixels;
    }
    
    const hourDelta = Math.round(adjustedDeltaY / dragInfo.current.grid.hourHeight);
    let dayDelta = 0;
    
    if (dragInfo.current.grid.inWeekView && dragInfo.current.grid.dayWidth > 0) {
      dayDelta = Math.round(deltaX / dragInfo.current.grid.dayWidth);
    }
    
    if (hourDelta === 0 && dayDelta === 0) {
      return dragInfo.current.grid.startSlot;
    }
    
    const slots = dragInfo.current.grid.timeSlots;
    if (!slots.length) return null;
    
    const startSlotIndex = slots.indexOf(dragInfo.current.grid.startSlot);
    if (startSlotIndex === -1) return null;
    
    const rowSize = dragInfo.current.grid.inWeekView ? 7 : 1;
    
    let targetRowIndex = Math.floor(startSlotIndex / rowSize) + hourDelta;
    let targetColIndex = startSlotIndex % rowSize + dayDelta;
    
    targetRowIndex = Math.max(0, Math.min(targetRowIndex, Math.floor((slots.length - 1) / rowSize)));
    targetColIndex = Math.max(0, Math.min(targetColIndex, rowSize - 1));
    
    const targetIndex = targetRowIndex * rowSize + targetColIndex;
    
    if (targetIndex >= 0 && targetIndex < slots.length) {
      return slots[targetIndex];
    }
    
    return null;
  };
  
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
  
  // Manejar clic para editar
  const handleClick = (e) => {
    if (blockClicks) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    if (!dragInfo.current.dragging && !dragging && !resizing) {
      console.log('Clic en evento, abriendo editor...');
      onClick(event);
    }
  };
  
  // Iniciar arrastre o redimensionamiento
  const handleMouseDown = (e, mode) => {
    // No permitir redimensionamiento si el evento continúa al día siguiente
    if (mode === 'resize' && continuesNextDay) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    setBlockClicks(true);
    
    const isResize = mode === 'resize';
    const gridInfo = initializeGridInfo();
    
    // Guardar duración original y minutos de inicio para cálculos posteriores
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    const durationMinutes = (endDate - startDate) / (1000 * 60);
    const startMinutes = startDate.getMinutes();
    
    dragInfo.current = {
      dragging: true,
      isResize: isResize,
      startX: e.clientX,
      startY: e.clientY,
      startHeight: eventRef.current.offsetHeight,
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
    
    document.body.classList.add('dragging-active');
    
    // Si snap está activo, añadir clase especial
    if (snapValue > 0) {
      document.body.classList.add('snap-active');
    }
    
    setTimeout(() => {
      if (dragInfo.current.dragging) {
        if (isResize) {
          setResizing(true);
          if (eventRef.current) eventRef.current.classList.add('resizing');
        } else {
          setDragging(true);
          if (eventRef.current) eventRef.current.classList.add('dragging');
        }
      }
    }, 100);
  };
  
  // Manejar movimiento
  const handleMouseMove = (e) => {
    if (!dragInfo.current.dragging) return;
    
    const deltaX = e.clientX - dragInfo.current.startX;
    const deltaY = e.clientY - dragInfo.current.startY;
    
    const movedSignificantly = Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3;
    
    if (movedSignificantly) {
      dragInfo.current.moved = true;
      dragInfo.current.deltaX = deltaX;
      
      if (dragInfo.current.isResize) {
        // Aplicar snap al redimensionamiento
        let adjustedDeltaY = deltaY;
        if (snapValue > 0) {
          // Convertir snapValue (minutos) a pixeles
          const snapPixels = snapValue * (gridSize / 60);
          adjustedDeltaY = Math.round(deltaY / snapPixels) * snapPixels;
        }
        
        dragInfo.current.deltaY = adjustedDeltaY;
        
        // Redimensionar verticalmente con snap
        let newHeight = dragInfo.current.startHeight + adjustedDeltaY;
        newHeight = Math.max(gridSize / 2, newHeight); // Altura mínima
        
        if (eventRef.current) {
          eventRef.current.style.height = `${newHeight}px`;
        }
      } else {
        // Arrastrar (vertical y horizontal) con snap aplicado en findTargetSlot
        dragInfo.current.deltaY = deltaY;
        
        if (eventRef.current) {
          // Si snap está activado, ajustar la visualización de la transformación
          if (snapValue > 0) {
            // Convertir snapValue (minutos) a pixeles
            const snapPixels = snapValue * (gridSize / 60);
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
        
        const targetSlot = findTargetSlot(e.clientX, e.clientY);
        if (targetSlot) {
          dragInfo.current.grid.targetSlot = targetSlot;
          highlightTargetSlot(targetSlot);
        }
      }
    }
  };
  
  // Función para calcular el cambio de tiempo preciso
  const calculatePreciseTimeChange = (deltaY, isResize = false) => {
    // Si estamos redimensionando SIN snap activado, redondeamos a horas completas
    if (snapValue === 0 && isResize) {
      // Calcular cuántas horas completas cambia
      const hourDelta = Math.round(deltaY / gridSize);
      return hourDelta * 60; // Convertir a minutos
    }
    
    // Si no hay snap activado (pero no es redimensionamiento), usar cálculo simple
    if (snapValue === 0) {
      const pixelsPerMinute = gridSize / 60;
      return deltaY / pixelsPerMinute;  // Retorna minutos
    }
    
    // Con snap activado, calcular cuántos intervalos de snap
    const pixelsPerMinute = gridSize / 60;
    const snapPixels = snapValue * pixelsPerMinute;
    const snapIntervals = Math.round(deltaY / snapPixels);
    
    // Devuelve minutos exactos basados en el snap
    return snapIntervals * snapValue;
  };
  
  // Finalizar arrastre o redimensionamiento
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
    const wasJustAClick = !wasActuallyDragged && 
                         (dragInfo.current.endTime - dragInfo.current.startTime < 300);
    
    // Si fue solo un clic, abrir editor
    if (wasJustAClick && !dragInfo.current.isResize) {
      if (eventRef.current) {
        eventRef.current.classList.remove('dragging');
        eventRef.current.style.transform = '';
      }
      
      setDragging(false);
      setResizing(false);
      
      console.log('Detectado como clic en evento, abriendo editor...');
      onClick(event);
      
      dragInfo.current = { dragging: false };
      
      setTimeout(() => {
        setBlockClicks(false);
      }, 300);
      
      return;
    }
    
    // Si hubo movimiento real, calcular cambios
    if (wasActuallyDragged) {
      let minutesDelta = 0;
      let daysDelta = 0;
      
      if (dragInfo.current.isResize) {
        // Calcular cambio por redimensionamiento en minutos precisos
        minutesDelta = calculatePreciseTimeChange(dragInfo.current.deltaY, true);
        
        if (eventRef.current) {
          eventRef.current.classList.remove('resizing');
          eventRef.current.style.height = '';
        }
      } else {
        // Calcular cambio por arrastre en minutos precisos
        minutesDelta = calculatePreciseTimeChange(dragInfo.current.deltaY, false);
        
        // Calcular cambio en días (solo para vista semanal)
        if (dragInfo.current.grid.inWeekView && dragInfo.current.grid.dayWidth > 0) {
          daysDelta = Math.round(dragInfo.current.deltaX / dragInfo.current.grid.dayWidth);
        }
        
        if (eventRef.current) {
          eventRef.current.classList.remove('dragging');
          eventRef.current.style.transform = '';
        }
      }
      
      setDragging(false);
      setResizing(false);
      
      // Actualizar si hubo cambio efectivo
      if (minutesDelta !== 0 || daysDelta !== 0) {
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);
        
        if (dragInfo.current.isResize) {
          // Solo cambia tiempo de fin en minutos precisos
          endDate.setMinutes(endDate.getMinutes() + minutesDelta);
        } else {
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
        }
        
        const updatedEvent = {
          ...event,
          start: startDate.toISOString(),
          end: endDate.toISOString()
        };
        
        console.log('Evento actualizado:', updatedEvent);
        onUpdate(updatedEvent);
      }
      
      // Desactivar bloqueo de clics
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
      setResizing(false);
      
      setTimeout(() => {
        setBlockClicks(false);
      }, 300);
      
      dragInfo.current = { dragging: false };
    }
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
      onMouseDown={(e) => handleMouseDown(e, 'drag')}
      onClick={handleClick}
      data-event-id={event.id}
    >
      <div className="event-title">{event.title}</div>
      <div className="event-time">{formatEventTime()}</div>
      
      {/* Solo mostrar el handle de redimensionamiento si no continúa al día siguiente */}
      {!continuesNextDay && (
        <div 
          className="event-resize-handle"
          onMouseDown={(e) => handleMouseDown(e, 'resize')}
        />
      )}
    </div>
  );
}

export default EventItem;