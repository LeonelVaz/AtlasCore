import React from 'react';
import EventSelector from './EventSelector.jsx';

function NoteCard(props) {
  const { note, isEditing, isSelected, onEdit, onSave, onDelete, onCancel, core, plugin, id } = props;
  const [editTitle, setEditTitle] = React.useState(note.title);
  const [editContent, setEditContent] = React.useState(note.content);
  const [showEventSelector, setShowEventSelector] = React.useState(false);
  
  // Obtener los componentes de texto enriquecido del core
  const RichTextEditor = core?.ui?.components?.RichTextEditor;
  const RichTextViewer = core?.ui?.components?.RichTextViewer;
  
  // Resetear valores de edición cuando cambia isEditing
  React.useEffect(() => {
    if (isEditing) {
      setEditTitle(note.title);
      setEditContent(note.content);
    }
  }, [isEditing, note.title, note.content]);
  
  const handleSave = () => {
    if (editTitle.trim()) {
      onSave({
        title: editTitle.trim(),
        content: editContent
      });
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };
  
  const handleContentChange = (htmlContent) => {
    setEditContent(htmlContent);
  };
  
  const handleEventSelect = (event) => {
    if (event) {
      plugin.linkNoteToEvent(note.id, event.id, event.title);
    } else {
      plugin.unlinkNoteFromEvent(note.id);
    }
    setShowEventSelector(false);
    // Forzar actualización
    onSave({});
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Función para extraer texto plano del HTML para preview - mejorada
  const getTextPreview = (htmlContent) => {
    if (!htmlContent || typeof htmlContent !== 'string') return 'Sin contenido';
    
    try {
      // Crear un elemento temporal para extraer el texto
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      
      // Limitar a 200 caracteres para el preview
      return textContent.length > 200 ? textContent.substring(0, 200) + '...' : textContent || 'Sin contenido';
    } catch (error) {
      console.error('Error al extraer texto del HTML:', error);
      return htmlContent.substring(0, 200) + '...' || 'Sin contenido';
    }
  };
  
  // Función mejorada para verificar si el contenido es HTML
  const isHtmlContent = (content) => {
    if (!content || typeof content !== 'string') return false;
    return content.includes('<') && content.includes('>');
  };
  
  if (isEditing) {
    return React.createElement(
      'div',
      {
        id: id,
        className: 'note-card editing',
        style: {
          backgroundColor: 'var(--card-bg)',
          border: '2px solid var(--primary-color)',
          borderRadius: 'var(--border-radius-md)',
          padding: 'var(--spacing-md)',
          boxShadow: 'var(--shadow-md)',
          transition: 'all var(--transition-normal)',
          minHeight: '300px'
        }
      },
      [
        React.createElement(
          'input',
          {
            key: 'title-input',
            type: 'text',
            value: editTitle,
            onChange: (e) => setEditTitle(e.target.value),
            onKeyDown: handleKeyPress,
            placeholder: 'Título de la nota',
            style: {
              width: '100%',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-sm)',
              padding: 'var(--spacing-sm)',
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: 'var(--spacing-sm)',
              backgroundColor: 'var(--input-bg)',
              color: 'var(--text-color)',
              outline: 'none'
            }
          }
        ),
        
        // Mostrar vinculación actual si existe
        note.linkedEventId && React.createElement(
          'div',
          {
            key: 'current-link',
            style: {
              backgroundColor: 'rgba(var(--primary-color-rgb, 45, 75, 148), 0.1)',
              border: '1px solid var(--primary-color)',
              borderRadius: 'var(--border-radius-sm)',
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              marginBottom: 'var(--spacing-sm)',
              fontSize: '12px',
              color: 'var(--text-color)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)'
            }
          },
          [
            React.createElement('span', { className: 'material-icons', key: 'icon', style: { fontSize: '14px' } }, 'event'),
            React.createElement('span', { key: 'text' }, `Vinculada a: ${note.linkedEventTitle}`)
          ]
        ),
        
        // Usar RichTextEditor si está disponible, sino fallback al textarea
        RichTextEditor ? 
          React.createElement(RichTextEditor, {
            key: 'content-rich-editor',
            value: editContent,
            onChange: handleContentChange,
            placeholder: 'Edita el contenido de tu nota...',
            height: '180px',
            toolbar: 'full',
            className: 'note-rich-editor-edit'
          }) :
          React.createElement(
            'textarea',
            {
              key: 'content-textarea-fallback',
              value: editContent,
              onChange: (e) => setEditContent(e.target.value),
              onKeyDown: handleKeyPress,
              placeholder: 'Contenido de la nota...',
              rows: 6,
              style: {
                width: '100%',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-sm)',
                padding: 'var(--spacing-sm)',
                fontSize: '14px',
                marginBottom: 'var(--spacing-md)',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-color)',
                resize: 'vertical',
                fontFamily: 'inherit',
                outline: 'none'
              }
            }
          ),
        
        React.createElement(
          'div',
          {
            key: 'actions',
            style: {
              display: 'flex',
              gap: 'var(--spacing-sm)',
              justifyContent: 'space-between',
              marginTop: 'var(--spacing-md)',
              paddingTop: 'var(--spacing-sm)',
              borderTop: '1px solid var(--border-color)'
            }
          },
          [
            React.createElement(
              'button',
              {
                key: 'link-event',
                onClick: () => setShowEventSelector(true),
                style: {
                  backgroundColor: 'var(--info-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--border-radius-sm)',
                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-xs)'
                }
              },
              [
                React.createElement('span', { key: 'link-icon', className: 'material-icons', style: { fontSize: '14px' } }, 'link'),
                React.createElement('span', { key: 'link-text' }, note.linkedEventId ? 'Cambiar evento' : 'Vincular evento')
              ]
            ),
            React.createElement(
              'div',
              {
                key: 'save-cancel',
                style: {
                  display: 'flex',
                  gap: 'var(--spacing-sm)'
                }
              },
              [
                React.createElement(
                  'button',
                  {
                    key: 'cancel',
                    onClick: onCancel,
                    style: {
                      backgroundColor: 'transparent',
                      color: 'var(--text-color-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--border-radius-sm)',
                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-xs)'
                    }
                  },
                  [
                    React.createElement('span', { key: 'close-icon', className: 'material-icons', style: { fontSize: '14px' } }, 'close'),
                    React.createElement('span', { key: 'close-text' }, 'Cancelar')
                  ]
                ),
                React.createElement(
                  'button',
                  {
                    key: 'save',
                    onClick: handleSave,
                    disabled: !editTitle.trim(),
                    style: {
                      backgroundColor: 'var(--primary-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--border-radius-sm)',
                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                      fontSize: '12px',
                      cursor: editTitle.trim() ? 'pointer' : 'not-allowed',
                      opacity: editTitle.trim() ? 1 : 0.5,
                      transition: 'all var(--transition-fast)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-xs)'
                    }
                  },
                  [
                    React.createElement('span', { key: 'save-icon', className: 'material-icons', style: { fontSize: '14px' } }, 'save'),
                    React.createElement('span', { key: 'save-text' }, 'Guardar')
                  ]
                )
              ]
            )
          ]
        ),
        React.createElement(
          'div',
          {
            key: 'help',
            style: {
              fontSize: '11px',
              color: 'var(--text-color-secondary)',
              marginTop: 'var(--spacing-xs)',
              textAlign: 'center'
            }
          },
          RichTextEditor ? 
            'Usa la barra de herramientas para dar formato • Ctrl+Enter para guardar • Esc para cancelar' :
            'Ctrl+Enter para guardar • Esc para cancelar'
        ),
        
        // Selector de eventos
        showEventSelector && React.createElement(EventSelector, {
          key: 'event-selector',
          onSelect: handleEventSelect,
          onCancel: () => setShowEventSelector(false),
          currentEventId: note.linkedEventId,
          core: core
        })
      ]
    );
  }
  
  return React.createElement(
    'div',
    {
      id: id,
      className: `note-card ${isSelected ? 'selected' : ''}`,
      style: {
        backgroundColor: 'var(--card-bg)',
        border: isSelected ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-md)',
        padding: 'var(--spacing-md)',
        boxShadow: isSelected ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        transition: 'all var(--transition-normal)',
        cursor: 'pointer',
        position: 'relative',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column'
      },
      onMouseEnter: (e) => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      },
      onMouseLeave: (e) => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }
    },
    [
      // Acciones (botones)
      React.createElement(
        'div',
        {
          key: 'actions',
          className: 'note-actions',
          style: {
            position: 'absolute',
            top: 'var(--spacing-sm)',
            right: 'var(--spacing-sm)',
            display: 'flex',
            gap: 'var(--spacing-xs)',
            opacity: 0,
            transition: 'opacity var(--transition-fast)',
            zIndex: 10
          },
          onMouseEnter: (e) => {
            e.target.style.opacity = 1;
          }
        },
        [
          React.createElement(
            'button',
            {
              key: 'edit',
              onClick: (e) => {
                e.stopPropagation();
                onEdit();
              },
              title: 'Editar nota',
              style: {
                backgroundColor: 'var(--info-color)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                transition: 'all var(--transition-fast)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }
            },
            React.createElement('span', { className: 'material-icons', style: { fontSize: '16px' } }, 'edit')
          ),
          React.createElement(
            'button',
            {
              key: 'delete',
              onClick: (e) => {
                e.stopPropagation();
                onDelete();
              },
              title: 'Eliminar nota',
              style: {
                backgroundColor: 'var(--danger-color)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                transition: 'all var(--transition-fast)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }
            },
            React.createElement('span', { className: 'material-icons', style: { fontSize: '16px' } }, 'delete')
          )
        ]
      ),
      
      // Título con indicador de vinculación
      React.createElement(
        'div',
        {
          key: 'title-section',
          style: {
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--spacing-xs)',
            marginBottom: 'var(--spacing-md)'
          }
        },
        [
          React.createElement(
            'h3',
            {
              key: 'title',
              style: {
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: 'var(--text-color)',
                paddingRight: 'var(--spacing-xl)', // Espacio para los botones
                lineHeight: '1.4',
                flex: 1
              }
            },
            note.title
          ),
          note.linkedEventId && React.createElement(
            'span',
            {
              key: 'event-indicator',
              className: 'material-icons',
              title: `Vinculada a: ${note.linkedEventTitle}`,
              style: {
                fontSize: '18px',
                color: 'var(--primary-color)',
                marginTop: '2px'
              }
            },
            'event'
          )
        ]
      ),
      
      // Contenido - usar RichTextViewer si está disponible y hay contenido HTML
      React.createElement(
        'div',
        {
          key: 'content',
          style: {
            flex: 1,
            marginBottom: 'var(--spacing-md)',
            overflow: 'hidden'
          }
        },
        RichTextViewer && note.content && isHtmlContent(note.content) ? 
          // Mostrar contenido HTML con RichTextViewer
          React.createElement(RichTextViewer, {
            content: note.content,
            maxHeight: '150px',
            className: 'note-content-viewer',
            sanitize: true
          }) :
          // Fallback para texto plano o si no hay RichTextViewer
          React.createElement(
            'p',
            {
              style: {
                margin: 0,
                fontSize: '14px',
                color: 'var(--text-color-secondary)',
                lineHeight: '1.5',
                maxHeight: '150px',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 6,
                WebkitBoxOrient: 'vertical'
              }
            },
            getTextPreview(note.content)
          )
      ),
      
      // Metadatos
      React.createElement(
        'div',
        {
          key: 'metadata',
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: 'var(--text-color-secondary)',
            borderTop: '1px solid var(--border-color)',
            paddingTop: 'var(--spacing-xs)',
            marginTop: 'auto',
            flexWrap: 'wrap',
            gap: 'var(--spacing-xs)'
          }
        },
        [
          React.createElement(
            'span',
            { key: 'created' },
            '📅 ' + formatDate(note.createdAt)
          ),
          note.modifiedAt !== note.createdAt && React.createElement(
            'span',
            { key: 'modified', style: { fontSize: '10px', fontStyle: 'italic' } },
            '✏️ ' + formatDate(note.modifiedAt)
          )
        ]
      )
    ]
  );
}

// CSS para hacer visible las acciones al hacer hover en la tarjeta
const styleElement = document.createElement('style');
styleElement.textContent = `
  .note-card:hover .note-actions {
    opacity: 1 !important;
  }
  
  .note-card.selected {
    animation: pulse 0.3s ease-in-out;
  }
  
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); }
  }
  
  /* Estilos específicos para el contenido del rich text viewer en notas */
  .note-content-viewer {
    font-size: 14px;
    line-height: 1.5;
  }
  
  .note-content-viewer h1,
  .note-content-viewer h2,
  .note-content-viewer h3,
  .note-content-viewer h4,
  .note-content-viewer h5,
  .note-content-viewer h6 {
    margin-top: 0.5em;
    margin-bottom: 0.3em;
    font-size: 1.1em !important;
  }
  
  .note-content-viewer p {
    margin-bottom: 0.8em;
  }
  
  .note-content-viewer ul,
  .note-content-viewer ol {
    margin-bottom: 0.8em;
    padding-left: 1.5em;
  }
  
  .note-content-viewer blockquote {
    margin: 0.5em 0;
    padding: 0.5em;
    border-left: 3px solid var(--primary-color);
    background-color: rgba(var(--primary-color-rgb, 45, 75, 148), 0.05);
  }
`;
document.head.appendChild(styleElement);

export default NoteCard;