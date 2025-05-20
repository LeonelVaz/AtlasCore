/**
 * EventDetailExtension.jsx
 * Extensión para la vista detallada de eventos
 */

import logger from '../../utils/logger';

/**
 * Componente para extender la vista detallada de eventos
 */
function EventDetailExtension(props) {
  const React = window.React;
  const { useState, useEffect } = React;
  
  // Extraer propiedades
  const { core, plugin, event, isEditing } = props;
  
  // Estados locales
  const [metadata, setMetadata] = useState(null);
  const [hasMetadata, setHasMetadata] = useState(false);
  
  // Efecto para procesar metadatos del evento
  useEffect(() => {
    if (event && event.metadata) {
      setMetadata(event.metadata);
      setHasMetadata(true);
    } else {
      setMetadata(null);
      setHasMetadata(false);
    }
  }, [event]);
  
  // Si no hay metadatos, mostrar mensaje informativo
  if (!hasMetadata) {
    return React.createElement(
      'div',
      { className: 'pg-event-detail-extension pg-no-metadata' },
      [
        React.createElement(
          'p',
          { key: 'info' },
          'Este evento no tiene metadatos de Pruebas Generales'
        ),
        React.createElement(
          'p',
          { key: 'help' },
          'Edita el evento y usa la extensión de formulario para añadir propiedades avanzadas'
        )
      ]
    );
  }
  
  // Función para renderizar valor de importancia
  const renderImportance = (value) => {
    const importanceLabels = {
      0: 'Normal',
      1: 'Media',
      2: 'Alta'
    };
    
    const importanceIcons = {
      0: '•',
      1: '●',
      2: '★'
    };
    
    const importanceClasses = {
      0: 'pg-importance-normal',
      1: 'pg-importance-medium',
      2: 'pg-importance-high'
    };
    
    const numericValue = parseInt(value, 10);
    const label = importanceLabels[numericValue] || 'Desconocida';
    const icon = importanceIcons[numericValue] || '•';
    const className = importanceClasses[numericValue] || 'pg-importance-normal';
    
    return React.createElement(
      'div',
      { className: `pg-importance-indicator ${className}` },
      [
        React.createElement('span', { key: 'icon', className: 'pg-indicator-icon' }, icon),
        React.createElement('span', { key: 'label' }, label)
      ]
    );
  };
  
  // Renderizar extensión de detalles
  return React.createElement(
    'div',
    { className: 'pg-event-detail-extension' },
    [
      // Título de la sección
      React.createElement(
        'h3',
        { key: 'title', className: 'pg-section-title' },
        'Propiedades avanzadas'
      ),
      
      // Información de importancia
      metadata.importance !== undefined && React.createElement(
        'div',
        { key: 'importance', className: 'pg-detail-section' },
        [
          React.createElement('span', { key: 'label', className: 'pg-detail-label' }, 'Importancia:'),
          React.createElement('div', { key: 'value', className: 'pg-detail-value' }, renderImportance(metadata.importance))
        ]
      ),
      
      // Lista de etiquetas
      Array.isArray(metadata.tags) && metadata.tags.length > 0 && React.createElement(
        'div',
        { key: 'tags', className: 'pg-detail-section' },
        [
          React.createElement('span', { key: 'label', className: 'pg-detail-label' }, 'Etiquetas:'),
          React.createElement(
            'div',
            { key: 'value', className: 'pg-tags-container' },
            metadata.tags.map(tag => React.createElement(
              'span',
              { key: tag, className: 'pg-tag' },
              tag
            ))
          )
        ]
      ),
      
      // Otros metadatos (variables)
      Object.entries(metadata)
        .filter(([key]) => !['importance', 'tags'].includes(key))
        .map(([key, value]) => React.createElement(
          'div',
          { key: `meta-${key}`, className: 'pg-detail-section' },
          [
            React.createElement('span', { key: 'label', className: 'pg-detail-label' }, `${key}:`),
            React.createElement(
              'span',
              { key: 'value', className: 'pg-detail-value' },
              typeof value === 'string' || typeof value === 'number'
                ? value.toString()
                : JSON.stringify(value)
            )
          ]
        )),
      
      // Nota informativa
      React.createElement(
        'p',
        { key: 'info', className: 'pg-info-text' },
        'Propiedades añadidas por la extensión "Pruebas Generales"'
      )
    ]
  );
}

export default EventDetailExtension;