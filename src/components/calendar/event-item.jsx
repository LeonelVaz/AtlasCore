import React, { useState, useEffect, useRef } from 'react';

/**
 * Componente simplificado para renderizar un evento individual con soporte para
 * arrastrar y redimensionar - Versión corregida para arrastre inmediato
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
    startY: 0,
    startHeight: 0,
    deltaY: 0,
    listeners: false
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
    
    // Configurar el estado y las variables de referencias
    if (isResize) {
      setResizing(true);
    } else {
      setDragging(true);
    }
    
    // Guardar datos iniciales
    dragInfo.current = {
      dragging: true,
      isResize: isResize,
      startY: e.clientY,
      startHeight: eventRef.current.offsetHeight,
      deltaY: 0,
      listeners: true
    };
    
    // Añadir event listeners para el movimiento
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Aplicar clase visual inmediatamente
    if (isResize) {
      eventRef.current.classList.add('resizing');
    } else {
      eventRef.current.classList.add('dragging');
    }
    
    console.log(isResize ? 'Iniciando redimensionamiento' : 'Iniciando arrastre');
  };
  
  // Función para manejar el movimiento del ratón
  const handleMouseMove = (e) => {
    if (!dragInfo.current.dragging) return;
    
    // Calcular el desplazamiento
    const deltaY = e.clientY - dragInfo.current.startY;
    dragInfo.current.deltaY = deltaY;
    
    // Si estamos redimensionando
    if (dragInfo.current.isResize) {
      // Calcular nueva altura
      let newHeight = dragInfo.current.startHeight + deltaY;
      newHeight = Math.max(gridSize, newHeight); // Altura mínima
      newHeight = Math.round(newHeight / gridSize) * gridSize; // Snap a la rejilla
      
      // Aplicar la nueva altura
      eventRef.current.style.height = `${newHeight}px`;
    } 
    // Si estamos arrastrando
    else {
      // Calcular offset con snap
      const snappedDelta = Math.round(deltaY / gridSize) * gridSize;
      
      // Aplicar la transformación para mover
      eventRef.current.style.transform = `translateY(${snappedDelta}px)`;
    }
  };
  
  // Función para manejar el final del arrastre o redimensionamiento
  const handleMouseUp = (e) => {
    if (!dragInfo.current.dragging) return;
    
    // Eliminar los event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Calcular el cambio en horas
    let hoursDelta;
    const isResize = dragInfo.current.isResize;
    
    if (isResize) {
      // Para redimensionamiento, calcular cuántas horas añadimos/eliminamos
      const heightDelta = Math.round(eventRef.current.offsetHeight) - dragInfo.current.startHeight;
      hoursDelta = Math.round(heightDelta / gridSize);
      
      // Eliminar clase y estilo de redimensionamiento
      eventRef.current.classList.remove('resizing');
      eventRef.current.style.height = '';
    } else {
      // Para arrastre, calcular cuántas horas se desplazó
      hoursDelta = Math.round(dragInfo.current.deltaY / gridSize);
      
      // Eliminar clase y estilo de arrastre
      eventRef.current.classList.remove('dragging');
      eventRef.current.style.transform = '';
    }
    
    // Actualizar estados
    setDragging(false);
    setResizing(false);
    
    // Solo actualizar si hubo cambio
    if (hoursDelta !== 0) {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      
      if (isResize) {
        // Si redimensiona, solo cambiamos la hora de fin
        endDate.setHours(endDate.getHours() + hoursDelta);
      } else {
        // Si arrastra, mover ambas horas
        startDate.setHours(startDate.getHours() + hoursDelta);
        endDate.setHours(endDate.getHours() + hoursDelta);
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
    dragInfo.current = {
      dragging: false,
      isResize: false,
      startY: 0,
      startHeight: 0,
      deltaY: 0,
      listeners: false
    };
  };
  
  // Manejar clic para abrir detalles (solo si no estamos arrastrando)
  const handleClick = (e) => {
    // Si estamos arrastrando o redimensionando, no hacer nada
    if (dragging || resizing || dragInfo.current.dragging) return;
    
    e.stopPropagation();
    onClick(event);
  };
  
  return (
    <div 
      ref={eventRef}
      className={`calendar-event ${dragging ? 'dragging' : ''} ${resizing ? 'resizing' : ''}`}
      style={{ backgroundColor: event.color }}
      onClick={handleClick}
      onMouseDown={(e) => handleMouseDown(e, 'drag')}
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