/**
 * EventFormExtension.jsx
 * Extensión para el formulario de eventos
 */

import logger from '../../utils/logger';

/**
 * Componente para extender el formulario de eventos
 */
function EventFormExtension(props) {
  const React = require('react');
  const { useState, useEffect } = React;
  
  // Extraer propiedades
  const { core, plugin, event, isEditing, onChange } = props;
  
  // Estados locales
  const [importance, setImportance] = useState(0);
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  
  // Efecto para cargar datos del evento
  useEffect(() => {
    if (event && event.metadata) {
      // Cargar importancia
      if (typeof event.metadata.importance === 'number') {
        setImportance(event.metadata.importance);
      }
      
      // Cargar etiquetas
      if (Array.isArray(event.metadata.tags)) {
        setTags(event.metadata.tags);
      }
    }
  }, [event]);
  
  /**
   * Manejador para cambio de importancia
   */
  const handleImportanceChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setImportance(value);
    
    // Propagar cambio al formulario principal
    updateEventMetadata({
      importance: value
    });
  };
  
  /**
   * Manejador para añadir etiqueta
   */
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    const updatedTags = [...tags, newTag.trim()];
    setTags(updatedTags);
    setNewTag('');
    
    // Propagar cambio al formulario principal
    updateEventMetadata({
      tags: updatedTags
    });
  };
  
  /**
   * Manejador para eliminar etiqueta
   */
  const handleRemoveTag = (tagToRemove) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    
    // Propagar cambio al formulario principal
    updateEventMetadata({
      tags: updatedTags
    });
  };
  
  /**
   * Manejador para cambio de texto de etiqueta
   */
  const handleTagChange = (e) => {
    setNewTag(e.target.value);
  };
  
  /**
   * Manejador para tecla presionada en input de etiqueta
   */
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  /**
   * Actualiza los metadatos del evento
   */
  const updateEventMetadata = (data) => {
    try {
      // Verificar que onChange y event están disponibles
      if (typeof onChange !== 'function' || !event) {
        return;
      }
      
      // Crear o actualizar objeto metadata
      const currentMetadata = event.metadata || {};
      const updatedMetadata = {
        ...currentMetadata,
        ...data
      };
      
      // Propagar cambio usando formato esperado por el formulario
      onChange({
        target: {
          name: 'metadata',
          value: updatedMetadata
        }
      });
    } catch (error) {
      logger.error('Error al actualizar metadatos:', error);
    }
  };
  
  // Renderizar extensión del formulario
  return React.createElement(
    'div',
    { className: 'pg-event-form-extension' },
    [
      // Título de la sección
      React.createElement(
        'h3',
        { key: 'title', className: 'pg-section-title' },
        'Propiedades avanzadas'
      ),
      
      // Selector de importancia
      React.createElement(
        'div',
        { key: 'importance-section', className: 'pg-form-section' },
        [
          React.createElement(
            'label',
            { key: 'label', htmlFor: 'event-importance' },
            'Importancia:'
          ),
          React.createElement(
            'select',
            {
              key: 'select',
              id: 'event-importance',
              value: importance,
              onChange: handleImportanceChange,
              className: 'pg-select'
            },
            [
              React.createElement('option', { key: '0', value: 0 }, 'Normal'),
              React.createElement('option', { key: '1', value: 1 }, 'Media'),
              React.createElement('option', { key: '2', value: 2 }, 'Alta')
            ]
          )
        ]
      ),
      
      // Sección de etiquetas
      React.createElement(
        'div',
        { key: 'tags-section', className: 'pg-form-section' },
        [
          React.createElement(
            'label',
            { key: 'label' },
            'Etiquetas:'
          ),
          
          // Input para añadir etiquetas
          React.createElement(
            'div',
            { key: 'tag-input', className: 'pg-tag-input-container' },
            [
              React.createElement(
                'input',
                {
                  key: 'input',
                  type: 'text',
                  value: newTag,
                  onChange: handleTagChange,
                  onKeyDown: handleTagKeyDown,
                  placeholder: 'Añadir etiqueta...',
                  className: 'pg-tag-input'
                }
              ),
              React.createElement(
                'button',
                {
                  key: 'button',
                  onClick: handleAddTag,
                  className: 'pg-tag-add-button'
                },
                '+'
              )
            ]
          ),
          
          // Lista de etiquetas
          React.createElement(
            'div',
            { key: 'tag-list', className: 'pg-tag-list' },
            tags.map(tag => React.createElement(
              'span',
              {
                key: tag,
                className: 'pg-tag'
              },
              [
                React.createElement('span', { key: 'text' }, tag),
                React.createElement(
                  'span',
                  {
                    key: 'remove',
                    className: 'pg-tag-remove',
                    onClick: () => handleRemoveTag(tag)
                  },
                  '×'
                )
              ]
            ))
          )
        ]
      ),
      
      // Nota informativa
      React.createElement(
        'p',
        { key: 'info', className: 'pg-info-text' },
        'Estas propiedades son añadidas por la extensión "Pruebas Generales"'
      )
    ]
  );
}

export default EventFormExtension;