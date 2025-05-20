/**
 * DayCellExtension.jsx
 * Extensión para las celdas de día en el calendario
 */

import logger from '../../utils/logger';

/**
 * Componente para extender las celdas de día en el calendario
 */
function DayCellExtension(props) {
  const React = window.React;
  const { useState, useEffect } = React;
  
  // Extraer propiedades
  const { core, plugin, day, hour, minutes, date } = props;
  
  // Estados locales
  const [hasEvents, setHasEvents] = useState(false);
  const [importance, setImportance] = useState(0); // 0: normal, 1: medio, 2: alto
  
  // Efecto para comprobar eventos
  useEffect(() => {
    if (!date) return;
    
    try {
      // Intentar obtener eventos para esta celda
      const calendarModule = core.getModule('calendar');
      if (calendarModule && typeof calendarModule.getEventsForDate === 'function') {
        const events = calendarModule.getEventsForDate(date);
        
        // Filtrar eventos para esta hora específica
        const cellEvents = events.filter(event => {
          const eventStart = new Date(event.start);
          return eventStart.getHours() === hour && eventStart.getMinutes() === minutes;
        });
        
        // Actualizar estado
        setHasEvents(cellEvents.length > 0);
        
        // Determinar importancia basada en metadatos (demo)
        if (cellEvents.length > 0) {
          // Buscar el evento con mayor importancia
          let maxImportance = 0;
          
          cellEvents.forEach(event => {
            // Verificar si tiene metadatos de importancia
            if (event.metadata && typeof event.metadata.importance === 'number') {
              if (event.metadata.importance > maxImportance) {
                maxImportance = Math.min(2, event.metadata.importance);
              }
            }
          });
          
          setImportance(maxImportance);
        } else {
          setImportance(0);
        }
      }
    } catch (error) {
      logger.debug('Error al comprobar eventos para la celda:', error);
    }
  }, [core, date, hour, minutes]);
  
  // Si no hay eventos, no renderizar nada
  if (!hasEvents) {
    return null;
  }
  
  // Determinar clase CSS según importancia
  let importanceClass = '';
  let indicator = '';
  
  switch (importance) {
    case 1:
      importanceClass = 'pg-importance-medium';
      indicator = '●';
      break;
    case 2:
      importanceClass = 'pg-importance-high';
      indicator = '★';
      break;
    default:
      importanceClass = 'pg-importance-normal';
      indicator = '•';
      break;
  }
  
  // Renderizar indicador de eventos
  return React.createElement(
    'div',
    {
      className: `pg-day-cell-indicator ${importanceClass}`,
      title: 'Indicador de Importancia - Demo'
    },
    indicator
  );
}

export default DayCellExtension;