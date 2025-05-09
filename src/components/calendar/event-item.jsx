import React, { useState, useRef, useEffect } from 'react';

/**
 * Componente simplificado para renderizar un evento individual con soporte para
 * arrastrar y redimensionar
 */
function EventItem({ 
  event, 
  onClick, 
  onUpdate,
  gridSize = 60, // Altura de una celda (1 hora)
}) {
  // Estados para controlar el arrastre y redimensionamiento
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [initialY, setInitialY] = useState(0);
  const [initialHeight, setInitialHeight] = useState(0);
  
  // Referencia al elemento del evento
  const eventRef = useRef(null);

  // Referencia mutable para almacenar el offset actual
  const offsetRef = useRef(0);
  const heightRef = useRef(0);
  
  // Para debugging - muestra los cambios en el elemento del evento
  useEffect(() => {
    if (eventRef.current) {
      console.log(`Evento ${event.id} montado/actualizado`);
    }
    return () => {
      console.log(`Evento ${event.id} desmontado`);
    };
  }, [event.id]);
  
  // Formatea las horas para mostrar
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
  
  // Función para iniciar el arrastre
  const startDrag = (e) => {
    // Solo iniciar arrastre si no estamos en el manejador de redimensionamiento
    if (e.target.classList.contains('event-resize-handle')) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setInitialY(e.clientY);
    offsetRef.current = 0;
    
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
  };
  
  // Función para manejar el arrastre
  const handleDrag = (e) => {
    if (!isDragging) return;
    
    const deltaY = e.clientY - initialY;
    // Redondear al múltiplo de gridSize más cercano para el efecto snap
    const snappedDelta = Math.round(deltaY / gridSize) * gridSize;
    
    // Actualizar referencia al offset actual
    offsetRef.current = snappedDelta;
    
    // Aplicar la transformación
    eventRef.current.style.transform = `translateY(${snappedDelta}px)`;
  };
  
  // Función para detener el arrastre
  const stopDrag = () => {
    if (!isDragging) return;
    
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', stopDrag);
    
    // Calcular el cambio en horas
    const hoursDelta = Math.round(offsetRef.current / gridSize);
    
    console.log(`Arrastre finalizado. Offset: ${offsetRef.current}px, Delta en horas: ${hoursDelta}`);
    
    // Limpiar transformación
    eventRef.current.style.transform = '';
    
    // Solo actualizar si hubo un cambio
    if (hoursDelta !== 0) {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      
      startDate.setHours(startDate.getHours() + hoursDelta);
      endDate.setHours(endDate.getHours() + hoursDelta);
      
      const updatedEvent = {
        ...event,
        start: startDate.toISOString(),
        end: endDate.toISOString()
      };
      
      console.log('Evento después de arrastrar:', updatedEvent);
      
      // Ejecutar la actualización
      onUpdate(updatedEvent);
    }
    
    // Restablecer el estado
    setIsDragging(false);
    offsetRef.current = 0;
  };
  
  // Función para iniciar el redimensionamiento
  const startResize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setInitialY(e.clientY);
    setInitialHeight(eventRef.current.offsetHeight);
    heightRef.current = eventRef.current.offsetHeight;
    
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
  };
  
  // Función para manejar el redimensionamiento
  const handleResize = (e) => {
    if (!isResizing) return;
    
    const deltaY = e.clientY - initialY;
    
    // Calcular nueva altura y aplicar snap
    let newHeight = initialHeight + deltaY;
    
    // Asegurar altura mínima de una celda
    newHeight = Math.max(gridSize, newHeight);
    
    // Snap a la rejilla
    newHeight = Math.round(newHeight / gridSize) * gridSize;
    
    // Actualizar referencia a la altura actual
    heightRef.current = newHeight;
    
    // Aplicar nueva altura
    eventRef.current.style.height = `${newHeight}px`;
  };
  
  // Función para detener el redimensionamiento
  const stopResize = () => {
    if (!isResizing) return;
    
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    
    // Calcular el cambio en horas
    const hoursDelta = Math.round((heightRef.current - initialHeight) / gridSize);
    
    console.log(`Redimensionamiento finalizado. Nueva altura: ${heightRef.current}px, 
                Altura inicial: ${initialHeight}px, Delta en horas: ${hoursDelta}`);
    
    // Limpiar estilos
    eventRef.current.style.height = '';
    
    // Solo actualizar si hubo un cambio
    if (hoursDelta !== 0) {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      
      // Modificar solo la hora de fin al redimensionar
      endDate.setHours(endDate.getHours() + hoursDelta);
      
      const updatedEvent = {
        ...event,
        start: startDate.toISOString(),
        end: endDate.toISOString()
      };
      
      console.log('Evento después de redimensionar:', updatedEvent);
      
      // Ejecutar la actualización
      onUpdate(updatedEvent);
    }
    
    // Restablecer estados
    setIsResizing(false);
    heightRef.current = 0;
  };
  
  return (
    <div 
      ref={eventRef}
      className={`calendar-event ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
      style={{ backgroundColor: event.color }}
      onClick={(e) => {
        if (!isDragging && !isResizing) {
          e.stopPropagation();
          onClick(event);
        }
      }}
      onMouseDown={startDrag}
      data-event-id={event.id}
    >
      <div className="event-title">{event.title}</div>
      <div className="event-time">{formatEventTime()}</div>
      
      {/* Handle para redimensionar */}
      <div 
        className="event-resize-handle"
        onMouseDown={startResize}
      />
    </div>
  );
}

export default EventItem;