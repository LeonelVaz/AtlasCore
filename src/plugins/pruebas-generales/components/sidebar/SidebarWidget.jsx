/**
 * SidebarWidget.jsx
 * Widget para la barra lateral del calendario
 */

import logger from '../../utils/logger';
import constants from '../../constants';
import { incrementCounter } from '../../api/storageManager';

/**
 * Componente para la barra lateral del calendario
 */
function SidebarWidget(props) {
  // Importar React explícitamente
  const React = require('react');
  
  // Importar hooks específicamente
  const { useState, useEffect, useRef } = React;
  
  // Extraer propiedades
  const { core, plugin } = props;
  
  // Estados locales
  const [counter, setCounter] = useState(0);
  const [events, setEvents] = useState([]);
  const [expanded, setExpanded] = useState(true);
  
  // Efectos de montaje
  useEffect(() => {
    // Cargar datos iniciales
    if (plugin && plugin._data) {
      setCounter(plugin._data.demoData.counter);
    }
    
    // Suscribirse a actualizaciones del contador
    const unsubCounter = core.events.subscribe(
      plugin.id,
      constants.CUSTOM_EVENTS.COUNTER_UPDATED,
      (data) => {
        setCounter(data.value);
      }
    );
    
    // Cargar próximos eventos (simulado para demostración)
    const calendarModule = core.getModule('calendar');
    if (calendarModule) {
      // Obtener fecha actual
      const today = new Date();
      
      // Obtener eventos para los próximos 7 días
      const end = new Date(today);
      end.setDate(today.getDate() + 7);
      
      try {
        // Intentar obtener eventos usando el módulo de calendario
        const upcomingEvents = calendarModule.getEventsBetweenDates(today, end);
        
        if (Array.isArray(upcomingEvents) && upcomingEvents.length > 0) {
          // Filtrar y formatear eventos
          const formattedEvents = upcomingEvents
            .filter(event => event && event.title) // Filtrar eventos válidos
            .slice(0, 5) // Limitar a 5 eventos
            .map(event => ({
              id: event.id,
              title: event.title,
              start: new Date(event.start)
            }));
          
          setEvents(formattedEvents);
        }
      } catch (error) {
        logger.warn('Error al obtener eventos del calendario:', error);
        
        // Usar eventos de ejemplo si hay un error
        setEvents([
          { id: 'demo1', title: 'Reunión de equipo', start: new Date(today.setHours(10, 0, 0, 0)) },
          { id: 'demo2', title: 'Almuerzo con cliente', start: new Date(today.setHours(13, 30, 0, 0)) },
          { id: 'demo3', title: 'Revisión de proyecto', start: new Date(today.setDate(today.getDate() + 1)) }
        ]);
      }
    }
    
    // Limpiar suscripciones al desmontar
    return () => {
      if (unsubCounter) unsubCounter();
    };
  }, [core, plugin]);
  
  /**
   * Manejador para incrementar contador
   */
  const handleIncrement = async () => {
    try {
      if (core && plugin) {
        const newValue = await incrementCounter(core, plugin);
        setCounter(newValue);
      }
    } catch (error) {
      logger.error('Error al incrementar contador:', error);
    }
  };
  
  /**
   * Manejador para expandir/colapsar widget
   */
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  /**
   * Manejador para evento de calendario
   */
  const handleEventClick = (eventId) => {
    // Abrir evento en el calendario
    const calendarModule = core.getModule('calendar');
    if (calendarModule && typeof calendarModule.openEvent === 'function') {
      try {
        calendarModule.openEvent(eventId);
      } catch (error) {
        logger.warn('Error al abrir evento del calendario:', error);
      }
    }
  };
  
  // Renderizar barra lateral
  return React.createElement(
    'div',
    { className: 'pg-sidebar-widget' },
    [
      // Encabezado
      React.createElement(
        'div',
        { 
          key: 'header', 
          className: 'pg-sidebar-header',
          onClick: toggleExpanded
        },
        [
          React.createElement(
            'h3',
            { key: 'title' },
            'Pruebas Generales'
          ),
          React.createElement(
            'span',
            { 
              key: 'toggle',
              className: 'material-icons pg-toggle-icon'
            },
            expanded ? 'expand_less' : 'expand_more'
          )
        ]
      ),
      
      // Contenido (mostrado solo si está expandido)
      expanded && React.createElement(
        'div',
        { key: 'content', className: 'pg-sidebar-content' },
        [
          // Contador
          React.createElement(
            'div',
            { key: 'counter', className: 'pg-sidebar-counter' },
            [
              React.createElement(
                'span',
                { key: 'label' },
                'Contador:'
              ),
              React.createElement(
                'span',
                { key: 'value', className: 'pg-counter-badge' },
                counter.toString()
              ),
              React.createElement(
                'button',
                {
                  key: 'button',
                  className: 'pg-sidebar-button',
                  onClick: handleIncrement
                },
                '+1'
              )
            ]
          ),
          
          // Próximos eventos
          React.createElement(
            'div',
            { key: 'events', className: 'pg-sidebar-events' },
            [
              React.createElement(
                'h4',
                { key: 'title' },
                'Próximos eventos'
              ),
              
              // Lista de eventos
              events.length > 0 
                ? React.createElement(
                    'ul',
                    { key: 'event-list', className: 'pg-event-list' },
                    events.map(event => React.createElement(
                      'li',
                      { 
                        key: event.id,
                        className: 'pg-event-item',
                        onClick: () => handleEventClick(event.id)
                      },
                      [
                        React.createElement(
                          'span',
                          { key: 'title', className: 'pg-event-title' },
                          event.title
                        ),
                        React.createElement(
                          'span',
                          { key: 'time', className: 'pg-event-time' },
                          event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        )
                      ]
                    ))
                  )
                : React.createElement(
                    'p',
                    { key: 'no-events', className: 'pg-no-events' },
                    'No hay eventos próximos'
                  )
            ]
          ),
          
          // Botón para abrir página principal
          React.createElement(
            'button',
            {
              key: 'open-button',
              className: 'pg-sidebar-button pg-button-primary',
              onClick: () => props.onNavigate(plugin.id, 'main-page')
            },
            'Abrir Demo Completa'
          )
        ]
      )
    ]
  );
}

export default SidebarWidget;