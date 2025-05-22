import React from 'react';

function NoteCard(props) {
  const { note, isEditing, onEdit, onSave, onDelete, onCancel } = props;
  const [editTitle, setEditTitle] = React.useState(note.title);
  const [editContent, setEditContent] = React.useState(note.content);
  
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
        content: editContent.trim()
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
  
  if (isEditing) {
    return React.createElement(
      'div',
      {
        className: 'note-card editing',
        style: {
          backgroundColor: 'var(--card-bg)',
          border: '2px solid var(--primary-color)',
          borderRadius: 'var(--border-radius-md)',
          padding: 'var(--spacing-md)',
          boxShadow: 'var(--shadow-md)',
          transition: 'all var(--transition-normal)'
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
              color: 'var(--text-color)'
            }
          }
        ),
        React.createElement(
          'textarea',
          {
            key: 'content-textarea',
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
              fontFamily: 'inherit'
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
              justifyContent: 'flex-end'
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
                  transition: 'all var(--transition-fast)'
                }
              },
              'Cancelar'
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
                  transition: 'all var(--transition-fast)'
                }
              },
              'Guardar'
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
              marginTop: 'var(--spacing-xs)'
            }
          },
          'Ctrl+Enter para guardar • Esc para cancelar'
        )
      ]
    );
  }
  
  return React.createElement(
    'div',
    {
      className: 'note-card',
      style: {
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-md)',
        padding: 'var(--spacing-md)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all var(--transition-normal)',
        cursor: 'pointer',
        position: 'relative'
      },
      onMouseEnter: (e) => {
        e.target.style.boxShadow = 'var(--shadow-md)';
        e.target.style.transform = 'translateY(-2px)';
      },
      onMouseLeave: (e) => {
        e.target.style.boxShadow = 'var(--shadow-sm)';
        e.target.style.transform = 'translateY(0)';
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
            transition: 'opacity var(--transition-fast)'
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
                width: '24px',
                height: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                transition: 'all var(--transition-fast)'
              }
            },
            React.createElement('span', { className: 'material-icons', style: { fontSize: '14px' } }, 'edit')
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
                width: '24px',
                height: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                transition: 'all var(--transition-fast)'
              }
            },
            React.createElement('span', { className: 'material-icons', style: { fontSize: '14px' } }, 'delete')
          )
        ]
      ),
      
      // Título
      React.createElement(
        'h3',
        {
          key: 'title',
          style: {
            margin: '0 0 var(--spacing-sm) 0',
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--text-color)',
            paddingRight: 'var(--spacing-xl)', // Espacio para los botones
            lineHeight: '1.4'
          }
        },
        note.title
      ),
      
      // Contenido
      React.createElement(
        'p',
        {
          key: 'content',
          style: {
            margin: '0 0 var(--spacing-md) 0',
            fontSize: '14px',
            color: 'var(--text-color-secondary)',
            lineHeight: '1.5',
            maxHeight: '120px',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 5,
            WebkitBoxOrient: 'vertical'
          }
        },
        note.content || 'Sin contenido'
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
            paddingTop: 'var(--spacing-xs)'
          }
        },
        [
          React.createElement(
            'span',
            { key: 'created' },
            'Creado: ' + formatDate(note.createdAt)
          ),
          note.modifiedAt !== note.createdAt && React.createElement(
            'span',
            { key: 'modified' },
            'Editado: ' + formatDate(note.modifiedAt)
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
`;
document.head.appendChild(styleElement);

export default NoteCard;