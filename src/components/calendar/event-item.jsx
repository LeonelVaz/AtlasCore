import React, { useState, useEffect, useRef } from 'react';

/**
 * Componente para renderizar un evento individual con soporte para
 * arrastrar en dos dimensiones y redimensionar, con resaltado de celda de destino
 */
function EventItem({ 
  event, 
  onClick, 
  onUpdate,
  gridSize = 60, // Altura de una celda (1 hora)
}) {
  // Referencias para el elemento del evento
  const eventRef = useRef(null);
  
  // Estado para tracking
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  // Variable de estado para bloquear clics
  const [blockClicks, setBlockClicks] = useState(false);
  
  // Variables para seguimiento del arrastre/redimensionamiento
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
    endTime: 0, // Tiempo de finalización del arrastre
    moved: false,
    // Información sobre la rejilla para movimiento bidimensional
    grid: {
      containerElement: null,
      gridRect: null,      
      dayWidth: 0,
      hourHeight: gridSize,
      days: [],
      dayElements: [],
      startDay: null,
      startHour: 0,
      timeSlots: [], // Referencia a todas las celdas de tiempo
      startSlot: null, // Slot original del evento
      targetSlot: null // Slot actual de destino
    },
    // Referencia a la celda resaltada actualmente
    highlightedCell: null
  });
  
  // Usar useEffect para limpiar listeners al desmontar
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Limpiar cualquier resaltado de celda si existe
      removeAllHighlights();
      // Asegurar que se elimina la clase de arrastre del body
      document.body.classList.remove('dragging-active');
    };
  }, []);
  
  // Formatear las horas para mostrar
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
  
  // Inicializar información sobre la rejilla del calendario para arrastre bidimensional
  const initializeGridInfo = () => {
    try {
      // Verificar si estamos en vista semanal o diaria
      const isWeekView = eventRef.current.closest('.calendar-grid') !== null;
      const isInDayView = eventRef.current.closest('.day-view-container') !== null;
      
      // Obtener la celda actual donde está el evento
      const currentSlot = eventRef.current.closest('.calendar-time-slot') || 
                          eventRef.current.closest('.day-view-hour-slot');
      
      // Coleccionar todas las celdas de tiempo
      let timeSlots = [];
      let container = null;
      
      if (isWeekView) {
        container = eventRef.current.closest('.calendar-grid');
        timeSlots = container ? Array.from(container.querySelectorAll('.calendar-time-slot')) : [];
      } else {
        container = eventRef.current.closest('.day-view-container');
        timeSlots = container ? Array.from(container.querySelectorAll('.day-view-hour-slot')) : [];
      }
      
      // Si estamos en vista diaria, no necesitamos información de rejilla horizontal
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
          timeSlots,
          startSlot: currentSlot,
          targetSlot: currentSlot
        };
      }
      
      // Para vista semanal, necesitamos toda la información de la rejilla
      const gridElement = container;
      const gridRect = gridElement?.getBoundingClientRect();
      
      // Obtener elementos de día y sus anchos
      const headerRow = gridElement?.querySelector('.calendar-header-row');
      const dayHeaders = headerRow?.querySelectorAll('.calendar-day-header');
      const dayElements = [];
      const days = [];
      
      // Calcular ancho de día promedio
      let totalDayWidth = 0;
      let dayCount = 0;
      
      if (dayHeaders) {
        dayHeaders.forEach((dayHeader, index) => {
          if (index > 0) { // Ignorar el header de tiempo
            // Obtener fecha del encabezado (asumiendo formato es "Dia, N Mes")
            const headerText = dayHeader.textContent || '';
            const dateParts = headerText.split(',');
            if (dateParts.length > 1) {
              // Extraer y parsear fecha
              let dayDate = new Date();
              
              // Intentar extraer fecha del texto del encabezado
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
              
              // Acumular ancho
              const dayRect = dayHeader.getBoundingClientRect();
              totalDayWidth += dayRect.width;
              dayCount++;
            }
          }
        });
      }
      
      // Calcular ancho promedio si no pudimos obtener información específica
      const avgDayWidth = dayCount > 0 ? totalDayWidth / dayCount : gridRect ? gridRect.width / 7 : 0;
      
      // Determinar el día y hora iniciales del evento
      const startDay = new Date(event.start);
      const startHour = startDay.getHours();
      
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
        timeSlots: [],
        startSlot: null,
        targetSlot: null
      };
    }
  };
  
  // Función auxiliar para obtener el índice del mes
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
  
  // Función para encontrar la celda de destino según la posición actual
  const findTargetSlot = (clientX, clientY) => {
    // Si no tenemos información de rejilla, no podemos determinar la celda de destino
    if (!dragInfo.current.grid || !dragInfo.current.grid.timeSlots.length) {
      return null;
    }
    
    // Calcular el desplazamiento en celdas
    const deltaY = clientY - dragInfo.current.startY;
    const deltaX = clientX - dragInfo.current.startX;
    
    const hourDelta = Math.round(deltaY / dragInfo.current.grid.hourHeight);
    let dayDelta = 0;
    
    if (dragInfo.current.grid.inWeekView && dragInfo.current.grid.dayWidth > 0) {
      dayDelta = Math.round(deltaX / dragInfo.current.grid.dayWidth);
    }
    
    // Si no hay cambio, quedamos en la misma celda de inicio
    if (hourDelta === 0 && dayDelta === 0) {
      return dragInfo.current.grid.startSlot;
    }
    
    // Buscar la celda de destino basada en la posición original y el desplazamiento
    const slots = dragInfo.current.grid.timeSlots;
    if (!slots.length) return null;
    
    // Encontrar las coordenadas de la celda de inicio
    const startSlotIndex = slots.indexOf(dragInfo.current.grid.startSlot);
    if (startSlotIndex === -1) return null;
    
    // Calcular el índice de la celda de destino
    // Vista semanal: 7 celdas por fila (7 días), cada fila es una hora
    // Vista diaria: 1 celda por fila (1 día), cada fila es una hora
    const rowSize = dragInfo.current.grid.inWeekView ? 7 : 1;
    
    // Calcular el nuevo índice teniendo en cuenta movimiento vertical y horizontal
    let targetRowIndex = Math.floor(startSlotIndex / rowSize) + hourDelta;
    let targetColIndex = startSlotIndex % rowSize + dayDelta;
    
    // Asegurar que estamos dentro de los límites
    targetRowIndex = Math.max(0, Math.min(targetRowIndex, Math.floor((slots.length - 1) / rowSize)));
    targetColIndex = Math.max(0, Math.min(targetColIndex, rowSize - 1));
    
    // Calcular el índice final
    const targetIndex = targetRowIndex * rowSize + targetColIndex;
    
    // Asegurar que el índice esté dentro de los límites
    if (targetIndex >= 0 && targetIndex < slots.length) {
      return slots[targetIndex];
    }
    
    return null;
  };
  
  // Resaltar la celda de destino durante el arrastre
  const highlightTargetSlot = (targetSlot) => {
    // Quitar el resaltado anterior si existe
    removeAllHighlights();
    
    // Si tenemos una celda de destino, resaltarla
    if (targetSlot) {
      targetSlot.classList.add('drag-target-active');
      dragInfo.current.highlightedCell = targetSlot;
    }
  };
  
  // Eliminar todos los resaltados de celdas
  const removeAllHighlights = () => {
    if (dragInfo.current.highlightedCell) {
      dragInfo.current.highlightedCell.classList.remove('drag-target-active');
      dragInfo.current.highlightedCell = null;
    }
    
    // Por seguridad, limpiar todas las celdas resaltadas
    document.querySelectorAll('.drag-target-active').forEach(cell => {
      cell.classList.remove('drag-target-active');
    });
  };
  
  // Manejador simple de clic para editar
  const handleClick = (e) => {
    // No hace nada si blockClicks está activo
    if (blockClicks) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    // Verificar que no estamos arrastrando o redimensionando
    if (!dragInfo.current.dragging && !dragging && !resizing) {
      console.log('Clic en evento, abriendo editor...');
      onClick(event);
    }
  };
  
  // Función para manejar el inicio del arrastre o redimensionamiento
  const handleMouseDown = (e, mode) => {
    // Evitar propagación para que no se cree un nuevo evento al hacer clic
    e.preventDefault();
    e.stopPropagation();
    
    // Activar bloqueo de clics inmediatamente al iniciar arrastre/redimensionamiento
    setBlockClicks(true);
    
    // Si es un clic en el manejador de redimensionamiento
    const isResize = mode === 'resize';
    
    // Inicializar información de la rejilla para arrastre bidimensional
    const gridInfo = initializeGridInfo();
    
    // Guardar datos iniciales
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
      grid: gridInfo,
      highlightedCell: null
    };
    
    // Añadir event listeners para el movimiento
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Agregar clase al body para indicar que hay un arrastre activo
    document.body.classList.add('dragging-active');
    
    // Configurar el estado visual después de un pequeño delay
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
  
  // Función para manejar el movimiento del ratón
  const handleMouseMove = (e) => {
    if (!dragInfo.current.dragging) return;
    
    // Calcular el desplazamiento desde el punto inicial
    const deltaX = e.clientX - dragInfo.current.startX;
    const deltaY = e.clientY - dragInfo.current.startY;
    
    // Solo consideramos que hay movimiento si se superó un umbral mínimo
    const movedSignificantly = Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3;
    
    if (movedSignificantly) {
      // Indicar que el evento se ha movido significativamente
      dragInfo.current.moved = true;
      
      // Almacenar el desplazamiento actual
      dragInfo.current.deltaX = deltaX;
      dragInfo.current.deltaY = deltaY;
      
      // Si estamos redimensionando (solo vertical)
      if (dragInfo.current.isResize) {
        // Calcular nueva altura
        let newHeight = dragInfo.current.startHeight + deltaY;
        newHeight = Math.max(gridSize / 2, newHeight); // Altura mínima
        
        // Aplicar la nueva altura directamente para movimiento fluido
        if (eventRef.current) {
          eventRef.current.style.height = `${newHeight}px`;
        }
      } 
      // Si estamos arrastrando (vertical y horizontal)
      else {
        // Aplicar transformación directa para seguir exactamente al cursor
        if (eventRef.current) {
          eventRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        }
        
        // Encontrar y resaltar la celda de destino
        const targetSlot = findTargetSlot(e.clientX, e.clientY);
        if (targetSlot) {
          // Actualizar la celda de destino en la información de arrastre
          dragInfo.current.grid.targetSlot = targetSlot;
          
          // Resaltar la celda de destino
          highlightTargetSlot(targetSlot);
        }
      }
    }
  };
  
  // Función para manejar el final del arrastre o redimensionamiento
  const handleMouseUp = (e) => {
    // Evitar que cualquier evento se propague y active la celda subyacente
    e.preventDefault();
    e.stopPropagation();
    
    if (!dragInfo.current.dragging) return;
    
    // Eliminar los event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Eliminar todos los resaltados de celdas
    removeAllHighlights();
    
    // Eliminar la clase de arrastre del body
    document.body.classList.remove('dragging-active');
    
    // Registrar el tiempo de finalización
    dragInfo.current.endTime = Date.now();
    
    // Detectar si hubo algún movimiento significativo
    const wasActuallyDragged = dragInfo.current.moved;
    
    // Detectar si fue un clic rápido sin movimiento
    const wasJustAClick = !wasActuallyDragged && 
                         (dragInfo.current.endTime - dragInfo.current.startTime < 300);
    
    // Si fue solo un clic, abrir el editor
    if (wasJustAClick && !dragInfo.current.isResize) {
      // Eliminar clases y estilos
      if (eventRef.current) {
        eventRef.current.classList.remove('dragging');
        eventRef.current.style.transform = '';
      }
      
      // Actualizar estados
      setDragging(false);
      setResizing(false);
      
      // Llamar al manejador de clic para editar
      console.log('Detectado como clic en evento, abriendo editor...');
      onClick(event);
      
      // Reiniciar el objeto de información de arrastre
      dragInfo.current = { dragging: false };
      
      // Desactivar el bloqueo de clics después de un breve delay
      setTimeout(() => {
        setBlockClicks(false);
      }, 300);
      
      return;
    }
    
    // Si hubo un movimiento real, se calculan los cambios
    // pero independientemente de si hubo cambios en horas/días, no abrimos el editor
    if (wasActuallyDragged) {
      let hoursDelta = 0;
      let daysDelta = 0;
      
      // SOLUCIÓN MEJORADA: Usar directamente la celda de destino resaltada
      // en lugar de hacer un nuevo cálculo basado en deltaX/deltaY
      const targetSlot = dragInfo.current.grid ? dragInfo.current.grid.targetSlot : null;
      const startSlot = dragInfo.current.grid ? dragInfo.current.grid.startSlot : null;
      
      if (dragInfo.current.isResize) {
        // Para redimensionamiento, calcular cuántas horas añadimos/eliminamos
        if (eventRef.current) {
          const heightDelta = Math.round(eventRef.current.offsetHeight) - dragInfo.current.startHeight;
          hoursDelta = Math.round(heightDelta / gridSize);
        }
        
        // Eliminar clase y estilo de redimensionamiento
        if (eventRef.current) {
          eventRef.current.classList.remove('resizing');
          eventRef.current.style.height = '';
        }
      } else {
        // Para arrastre, determinar el cambio basado en las celdas, no en píxeles
        if (targetSlot && startSlot && targetSlot !== startSlot) {
          // Determinar la posición de las celdas de inicio y destino
          const allSlots = dragInfo.current.grid.timeSlots;
          if (allSlots && allSlots.length > 0) {
            const rowSize = dragInfo.current.grid.inWeekView ? 7 : 1;
            
            // Encontrar índices de las celdas
            const startIndex = allSlots.indexOf(startSlot);
            const targetIndex = allSlots.indexOf(targetSlot);
            
            if (startIndex !== -1 && targetIndex !== -1) {
              // Calcular fila (hora) y columna (día) para ambas celdas
              const startRow = Math.floor(startIndex / rowSize);
              const startCol = startIndex % rowSize;
              
              const targetRow = Math.floor(targetIndex / rowSize);
              const targetCol = targetIndex % rowSize;
              
              // Calcular diferencia en días y horas
              hoursDelta = targetRow - startRow;
              daysDelta = targetCol - startCol;
              
              console.log(`Cambio calculado desde celdas: ${daysDelta} días, ${hoursDelta} horas`);
            } else {
              // Fallback: usar el cálculo tradicional si no podemos encontrar los índices
              hoursDelta = Math.round(dragInfo.current.deltaY / gridSize);
              
              if (dragInfo.current.grid.inWeekView && dragInfo.current.grid.dayWidth > 0) {
                const horizontalChange = dragInfo.current.deltaX;
                daysDelta = Math.round(horizontalChange / dragInfo.current.grid.dayWidth);
              }
              
              console.log(`Cambio calculado desde delta: ${daysDelta} días, ${hoursDelta} horas`);
            }
          }
        } else {
          // Fallback si no tenemos celdas de referencia
          hoursDelta = Math.round(dragInfo.current.deltaY / gridSize);
          
          if (dragInfo.current.grid.inWeekView && dragInfo.current.grid.dayWidth > 0) {
            const horizontalChange = dragInfo.current.deltaX;
            daysDelta = Math.round(horizontalChange / dragInfo.current.grid.dayWidth);
          }
        }
        
        // Eliminar clase y estilo de arrastre
        if (eventRef.current) {
          eventRef.current.classList.remove('dragging');
          eventRef.current.style.transform = '';
        }
      }
      
      // Actualizar estados
      setDragging(false);
      setResizing(false);
      
      // Solo actualizar si hubo cambio efectivo en horas o días
      if (hoursDelta !== 0 || daysDelta !== 0) {
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);
        
        if (dragInfo.current.isResize) {
          // Si redimensiona, solo cambiamos la hora de fin
          endDate.setHours(endDate.getHours() + hoursDelta);
        } else {
          // Si arrastra, mover ambas horas
          startDate.setHours(startDate.getHours() + hoursDelta);
          endDate.setHours(endDate.getHours() + hoursDelta);
          
          // Aplicar cambio de días
          if (daysDelta !== 0) {
            startDate.setDate(startDate.getDate() + daysDelta);
            endDate.setDate(endDate.getDate() + daysDelta);
          }
        }
        
        // Crear evento actualizado
        const updatedEvent = {
          ...event,
          start: startDate.toISOString(),
          end: endDate.toISOString()
        };
        
        console.log('Evento actualizado:', updatedEvent);
        
        // Llamar a la función de actualización
        onUpdate(updatedEvent);
      }
      
      // IMPORTANTE: Siempre mantenemos el bloqueo de clics activo si hubo movimiento,
      // independientemente de si los cambios fueron efectivos (hoursDelta !== 0 || daysDelta !== 0)
      // Desactivar el bloqueo después de un tiempo para evitar la apertura del editor
      setTimeout(() => {
        setBlockClicks(false);
      }, 300);
      
      // SOLUCIÓN AJUSTADA: No bloqueamos todos los clics globalmente, solo los que ocurren 
      // demasiado rápido después de soltar el mouse (probablemente no intencionados)
      const handleDocumentClick = (event) => {
        // Solo prevenimos los clics que suceden muy rápido después de soltar el mouse
        // (menos de 100ms), que son probablemente resultado del mouseup, no un clic intencional
        const timeElapsed = Date.now() - dragInfo.current.endTime;
        if (timeElapsed < 100) {
          // Prevenir el clic solo si es muy rápido después de soltar
          event.stopPropagation();
          event.preventDefault();
          console.log('Bloqueando clic inmediato después de arrastre');
        }
        
        // Eliminar este listener después del primer clic de cualquier manera
        document.removeEventListener('click', handleDocumentClick, true);
        return false;
      };
      
      // Agregar un listener de captura a nivel de documento para capturar el siguiente clic
      document.addEventListener('click', handleDocumentClick, true);
      
      // Guardar una referencia al contenedor antes de reiniciar dragInfo
      const containerElement = dragInfo.current.grid ? dragInfo.current.grid.containerElement : null;
      
      // Guardar el tiempo de finalización
      const endTime = dragInfo.current.endTime;
      
      // Reiniciar el objeto de información de arrastre, pero mantener el tiempo de finalización
      dragInfo.current = { 
        dragging: false,
        endTime: endTime // Mantener el tiempo de finalización
      };
      
      // Añadir una clase al elemento del calendario para indicar que se acaba de
      // completar una operación de arrastre/redimensionamiento, pero por menos tiempo
      if (containerElement) {
        containerElement.classList.add('just-dragged');
        
        // Guardar el tiempo del último arrastre como atributo de datos
        containerElement.setAttribute('data-drag-time', String(endTime));
        
        setTimeout(() => {
          if (containerElement) {
            containerElement.classList.remove('just-dragged');
          }
        }, 150); // Reducir a 150ms en lugar de 300ms
      }
    } else {
      // Si no hubo movimiento, simplemente limpiamos los estados
      setDragging(false);
      setResizing(false);
      
      // Desactivar el bloqueo de clics después de un breve delay
      setTimeout(() => {
        setBlockClicks(false);
      }, 300);
      
      // Reiniciar el objeto de información de arrastre
      dragInfo.current = { dragging: false };
    }
  };
  
  // Usamos useEffect para asegurar que el bloqueo de clics se desactive
  // incluso si ocurre algún error en el manejo del arrastre/redimensionamiento
  useEffect(() => {
    if (blockClicks) {
      const timer = setTimeout(() => {
        setBlockClicks(false);
      }, 1000); // Tiempo de seguridad máximo
      return () => clearTimeout(timer);
    }
  }, [blockClicks]);
  
  return (
    <div 
      ref={eventRef}
      className={`calendar-event ${dragging ? 'dragging' : ''} ${resizing ? 'resizing' : ''}`}
      style={{ backgroundColor: event.color }}
      onMouseDown={(e) => handleMouseDown(e, 'drag')}
      onClick={handleClick}
      data-event-id={event.id}
    >
      <div className="event-title">{event.title}</div>
      <div className="event-time">{formatEventTime()}</div>
      
      {/* Handle para redimensionar */}
      <div 
        className="event-resize-handle"
        onMouseDown={(e) => handleMouseDown(e, 'resize')}
      />
    </div>
  );
}

export default EventItem;