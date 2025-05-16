import React, { useState, useEffect, useRef } from 'react';

/**
 * Selector de eventos para vincular notas con eventos
 * @param {Object} props - Propiedades del componente
 * @param {string} props.value - ID del evento seleccionado
 * @param {Function} props.onChange - Función para manejar cambios
 * @param {boolean} props.disabled - Si el selector está deshabilitado
 */
const EventSelector = ({ value, onChange, disabled = false }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const dropdownRef = useRef(null);
  
  // Cargar eventos al montar
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Intentar obtener eventos del módulo de calendario
        if (window.__appModules?.['calendar']?.getEvents) {
          const calendarEvents = window.__appModules['calendar'].getEvents();
          setEvents(Array.isArray(calendarEvents) ? calendarEvents : []);
        } else {
          setError('No se pudo acceder al calendario.');
        }
      } catch (err) {
        console.error('Error al cargar eventos:', err);
        setError('Error al cargar eventos');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
    
    // Suscribirse a cambios en eventos
    const handleEventsChanged = () => {
      fetchEvents();
    };
    
    if (window.__appCore?.events) {
      const eventTypes = ['calendar.eventCreated', 'calendar.eventUpdated', 'calendar.eventDeleted'];
      const unsubscribers = eventTypes.map(type => 
        window.__appCore.events.subscribe(type, handleEventsChanged)
      );
      
      return () => {
        unsubscribers.forEach(unsub => {
          if (typeof unsub === 'function') unsub();
        });
      };
    }
  }, []);
  
  // Actualizar evento seleccionado cuando cambia el valor
  useEffect(() => {
    if (value && events.length > 0) {
      const event = events.find(e => e.id === value);
      setSelectedEvent(event || null);
    } else {
      setSelectedEvent(null);
    }
  }, [value, events]);
  
  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // Manejar selección de evento
  const handleSelect = (event) => {
    setSelectedEvent(event);
    if (onChange) {
      onChange(event.id);
    }
    setIsOpen(false);
  };
  
  // Filtrar eventos
  const filteredEvents = filter 
    ? events.filter(event => 
        event.title.toLowerCase().includes(filter.toLowerCase())
      )
    : events;
  
  // Formatear fecha para mostrar
  const formatEventDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return dateString;
    }
  };
  
  return (
    <div className="event-selector" ref={dropdownRef}>
      {loading ? (
        <div className="event-selector-loading">
          <span className="loading-spinner small"></span> Cargando eventos...
        </div>
      ) : error ? (
        <div className="event-selector-error">{error}</div>
      ) : (
        <>
          <div 
            className={`event-selected ${disabled ? 'disabled' : ''}`}
            onClick={() => !disabled && setIsOpen(!isOpen)}
          >
            {selectedEvent ? (
              <div className="selected-event-info">
                <span className="selected-event-color" style={{ backgroundColor: selectedEvent.color }}></span>
                <span className="selected-event-title">{selectedEvent.title}</span>
              </div>
            ) : (
              <span className="no-event-selected">Seleccionar un evento</span>
            )}
            <span className="material-icons dropdown-arrow">
              {isOpen ? 'arrow_drop_up' : 'arrow_drop_down'}
            </span>
          </div>
          
          {isOpen && (
            <div className="event-dropdown">
              <div className="event-search">
                <input
                  type="text"
                  placeholder="Buscar eventos..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  autoFocus
                />
              </div>
              
              {filteredEvents.length === 0 ? (
                <div className="no-events">
                  {filter ? 'No se encontraron eventos' : 'No hay eventos disponibles'}
                </div>
              ) : (
                <div className="events-list">
                  {filteredEvents.map(event => (
                    <div 
                      key={event.id}
                      className={`event-option ${selectedEvent?.id === event.id ? 'selected' : ''}`}
                      onClick={() => handleSelect(event)}
                    >
                      <span className="event-color" style={{ backgroundColor: event.color }}></span>
                      <div className="event-info">
                        <div className="event-title">{event.title}</div>
                        <div className="event-date">
                          {formatEventDate(event.start)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EventSelector;