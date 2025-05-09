import React, { useState, useEffect, useRef } from 'react';

/**
 * Componente para renderizar un evento individual con soporte para
 * arrastrar en dos dimensiones y redimensionar, con movimiento horizontal mejorado
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
      startHour: 0
    }
  });
  
  // Usar useEffect para limpiar listeners al desmontar
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
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
      
      // Si estamos en vista diaria, no necesitamos información de rejilla horizontal
      if (isInDayView) {
        return {
          containerElement: eventRef.current.closest('.day-view-container'),
          gridRect: null,
          dayWidth: 0,
          hourHeight: gridSize,
          days: [],
          dayElements: [],
          inWeekView: false,
          startDay: new Date(event.start),
          startHour: new Date(event.start).getHours()
        };
      }
      
      // Para vista semanal, necesitamos toda la información de la rejilla
      const gridElement = eventRef.current.closest('.calendar-grid');
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
        startHour
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
        startHour: new Date(event.start).getHours()
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
  
  // Manejador simple de clic para editar
  const handleClick = (e) => {
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
      moved: false,
      grid: gridInfo
    };
    
    // Añadir event listeners para el movimiento
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Configurar el estado visual después de un pequeño delay
    setTimeout(() => {
      if (dragInfo.current.dragging) {
        if (isResize) {
          setResizing(true);
          eventRef.current.classList.add('resizing');
        } else {
          setDragging(true);
          eventRef.current.classList.add('dragging');
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
        eventRef.current.style.height = `${newHeight}px`;
      } 
      // Si estamos arrastrando (vertical y horizontal)
      else {
        // Aplicar transformación directa para seguir exactamente al cursor
        eventRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      }
    }
  };
  
  // Función para manejar el final del arrastre o redimensionamiento
  const handleMouseUp = (e) => {
    e.stopPropagation();
    
    if (!dragInfo.current.dragging) return;
    
    // Eliminar los event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Detectar si fue un clic rápido sin movimiento
    const wasJustAClick = !dragInfo.current.moved && 
                         (Date.now() - dragInfo.current.startTime < 300);
    
    // Si fue solo un clic, abrir el editor
    if (wasJustAClick && !dragInfo.current.isResize) {
      // Eliminar clases y estilos
      eventRef.current.classList.remove('dragging');
      eventRef.current.style.transform = '';
      
      // Actualizar estados
      setDragging(false);
      setResizing(false);
      
      // Llamar al manejador de clic para editar
      console.log('Detectado como clic en evento, abriendo editor...');
      onClick(event);
      
      // Reiniciar el objeto de información de arrastre
      dragInfo.current = { dragging: false };
      
      return;
    }
    
    // Si hubo movimiento real, calcular cambios
    let hoursDelta = 0;
    let daysDelta = 0;
    
    if (dragInfo.current.isResize) {
      // Para redimensionamiento, calcular cuántas horas añadimos/eliminamos
      const heightDelta = Math.round(eventRef.current.offsetHeight) - dragInfo.current.startHeight;
      hoursDelta = Math.round(heightDelta / gridSize);
      
      // Eliminar clase y estilo de redimensionamiento
      eventRef.current.classList.remove('resizing');
      eventRef.current.style.height = '';
    } else {
      // Para arrastre, calcular cambios en horas y días
      
      // Calcular cambio de horas (vertical)
      hoursDelta = Math.round(dragInfo.current.deltaY / gridSize);
      
      // Calcular cambio de días (horizontal) si estamos en vista semanal
      if (dragInfo.current.grid.inWeekView && dragInfo.current.grid.dayWidth > 0) {
        const horizontalChange = dragInfo.current.deltaX;
        daysDelta = Math.round(horizontalChange / dragInfo.current.grid.dayWidth);
        
        // Corrección para movimiento negativo (izquierda)
        if (horizontalChange < 0 && Math.abs(horizontalChange) % dragInfo.current.grid.dayWidth > 10) {
          daysDelta = Math.floor(horizontalChange / dragInfo.current.grid.dayWidth);
        }
        
        console.log(`Movimiento horizontal: ${horizontalChange}px, Cambio de días: ${daysDelta}`);
      }
      
      // Eliminar clase y estilo de arrastre
      eventRef.current.classList.remove('dragging');
      eventRef.current.style.transform = '';
    }
    
    // Actualizar estados
    setDragging(false);
    setResizing(false);
    
    // Solo actualizar si hubo cambio
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
    
    // Reiniciar el objeto de información de arrastre
    dragInfo.current = { dragging: false };
  };
  
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