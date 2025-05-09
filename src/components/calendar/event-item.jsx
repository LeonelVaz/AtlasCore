import React, { useState, useEffect, useRef } from 'react';

/**
 * Componente para renderizar un evento individual con soporte para
 * arrastrar en dos dimensiones y redimensionar
 */
function EventItem({ 
  event, 
  onClick, 
  onUpdate,
  gridSize = 60, // Altura de una celda (1 hora)
  columnWidth = null, // Ancho de columna, se detecta automáticamente
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
    parentElement: null,
    parentRect: null,
    eventRect: null,
    columnCount: 7, // Asumimos 7 días por defecto para vista semanal
    columnWidth: 0
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
  
  // Función para manejar el inicio del arrastre o redimensionamiento
  const handleMouseDown = (e, mode) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Si es un clic en el manejador de redimensionamiento
    const isResize = mode === 'resize';
    
    // Configurar el estado visual
    if (isResize) {
      setResizing(true);
    } else {
      setDragging(true);
    }
    
    // Obtener referencias a los elementos padre y medidas
    const parentElement = eventRef.current.closest('.calendar-time-slot') || 
                          eventRef.current.closest('.day-view-hour-slot');
    
    // Determinar si estamos en vista semanal o diaria
    const isWeekView = eventRef.current.closest('.calendar-grid') !== null;
    
    // Obtener medidas para el posicionamiento
    const eventRect = eventRef.current.getBoundingClientRect();
    const parentRect = parentElement?.getBoundingClientRect();
    
    // Calcular ancho de columna para vista semanal
    let colWidth = columnWidth;
    let colCount = 7; // Días por defecto
    
    if (isWeekView && !colWidth) {
      const gridElement = eventRef.current.closest('.calendar-grid');
      const row = gridElement?.querySelector('.calendar-row');
      
      if (row) {
        const cells = row.querySelectorAll('.calendar-time-slot');
        colCount = cells.length;
        
        if (cells.length > 0) {
          colWidth = cells[0].getBoundingClientRect().width;
        }
      }
    }
    
    // Guardar datos iniciales
    dragInfo.current = {
      dragging: true,
      isResize: isResize,
      startX: e.clientX,
      startY: e.clientY,
      startHeight: eventRect.height,
      deltaX: 0,
      deltaY: 0,
      listeners: true,
      startTime: Date.now(),
      moved: false,
      parentElement,
      parentRect,
      eventRect,
      isWeekView,
      columnCount: colCount,
      columnWidth: colWidth
    };
    
    // Añadir event listeners para el movimiento
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Crear un clon flotante para arrastre si no es redimensionamiento
    if (!isResize) {
      eventRef.current.style.pointerEvents = 'none'; // Evitar que interfiera con el arrastre
      
      // Añadir clase para estilos de arrastre
      eventRef.current.classList.add('dragging');
    } else {
      // Añadir clase para estilos de redimensionamiento
      eventRef.current.classList.add('resizing');
    }
    
    console.log(isResize ? 'Iniciando redimensionamiento' : 'Iniciando arrastre');
  };
  
  // Función para manejar el movimiento del ratón
  const handleMouseMove = (e) => {
    if (!dragInfo.current.dragging) return;
    
    // Marcar como movido (no solo un clic)
    dragInfo.current.moved = true;
    
    // Calcular el desplazamiento
    const deltaX = e.clientX - dragInfo.current.startX;
    const deltaY = e.clientY - dragInfo.current.startY;
    
    // Almacenar el desplazamiento actual
    dragInfo.current.deltaX = deltaX;
    dragInfo.current.deltaY = deltaY;
    
    // Si estamos redimensionando (solo vertical)
    if (dragInfo.current.isResize) {
      // Calcular nueva altura
      let newHeight = dragInfo.current.startHeight + deltaY;
      newHeight = Math.max(gridSize, newHeight); // Altura mínima
      
      // Aplicar la nueva altura directamente para movimiento fluido (sin snap)
      eventRef.current.style.height = `${newHeight}px`;
    } 
    // Si estamos arrastrando (vertical y horizontal)
    else {
      // Aplicar transformación directa para seguir exactamente al cursor
      eventRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
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
      eventRef.current.style.pointerEvents = '';
      eventRef.current.style.transform = '';
      
      // Actualizar estados
      setDragging(false);
      setResizing(false);
      
      // Llamar al manejador de clic para editar
      console.log('Detectado como clic en evento, abriendo editor...');
      onClick(event);
      
      // Reiniciar el objeto de información de arrastre
      resetDragInfo();
      
      return;
    }
    
    // Si hubo movimiento real, calcular cambios
    const isResize = dragInfo.current.isResize;
    const isWeekView = dragInfo.current.isWeekView;
    let hoursDelta = 0;
    let daysDelta = 0;
    
    if (isResize) {
      // Para redimensionamiento, calcular cuántas horas añadimos/eliminamos
      const heightDelta = Math.round(eventRef.current.offsetHeight) - dragInfo.current.startHeight;
      hoursDelta = Math.round(heightDelta / gridSize);
      
      // Eliminar clase y estilo de redimensionamiento
      eventRef.current.classList.remove('resizing');
      eventRef.current.style.height = '';
    } else {
      // Para arrastre, calcular cambios en días y horas
      
      // Calcular cambio de horas (vertical)
      hoursDelta = Math.round(dragInfo.current.deltaY / gridSize);
      
      // Calcular cambio de días (horizontal) solo en vista semanal
      if (isWeekView && dragInfo.current.columnWidth > 0) {
        daysDelta = Math.round(dragInfo.current.deltaX / dragInfo.current.columnWidth);
      }
      
      // Eliminar clase y estilo de arrastre
      eventRef.current.classList.remove('dragging');
      eventRef.current.style.pointerEvents = '';
      eventRef.current.style.transform = '';
    }
    
    // Actualizar estados
    setDragging(false);
    setResizing(false);
    
    // Solo actualizar si hubo cambio
    if (hoursDelta !== 0 || daysDelta !== 0) {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      
      if (isResize) {
        // Si redimensiona, solo cambiamos la hora de fin
        endDate.setHours(endDate.getHours() + hoursDelta);
      } else {
        // Si arrastra, mover ambas horas y posiblemente días
        startDate.setHours(startDate.getHours() + hoursDelta);
        endDate.setHours(endDate.getHours() + hoursDelta);
        
        // Aplicar cambio de días si es necesario
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
    resetDragInfo();
  };
  
  // Función para reiniciar el estado de arrastre
  const resetDragInfo = () => {
    dragInfo.current = {
      dragging: false,
      isResize: false,
      startX: 0,
      startY: 0,
      startHeight: 0,
      deltaX: 0,
      deltaY: 0,
      listeners: false,
      moved: false,
      parentElement: null,
      parentRect: null,
      eventRect: null,
      isWeekView: false,
      columnCount: 7,
      columnWidth: 0
    };
  };
  
  return (
    <div 
      ref={eventRef}
      className={`calendar-event ${dragging ? 'dragging' : ''} ${resizing ? 'resizing' : ''}`}
      style={{ backgroundColor: event.color }}
      onMouseDown={(e) => handleMouseDown(e, 'drag')}
      onClick={(e) => {
        // Este manejador es solo por seguridad, la lógica principal está en handleMouseUp
        e.stopPropagation();
      }}
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