import React from 'react';

function CreateNoteForm(props) {
  const { onSave, onCancel, core, fromEvent } = props;
  const [title, setTitle] = React.useState(fromEvent ? `Notas: ${fromEvent.title}` : '');
  const [content, setContent] = React.useState('');
  
  // Obtener los componentes de texto enriquecido del core
  const RichTextEditor = core?.ui?.components?.RichTextEditor;
  
  // Si viene de un evento, preparar el contenido inicial
  React.useEffect(() => {
    if (fromEvent && RichTextEditor) {
      const eventDate = new Date(fromEvent.start).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Contenido inicial con la información del evento
      const eventInfo = `
      <p><strong>Evento:</strong> ${fromEvent.title}</p>
      <p><strong>Fecha:</strong> ${eventDate}</p>
      <hr>
      <p><br></p>
      <p><br></p>
    `;
    
      
      setContent(eventInfo);
    }
  }, [fromEvent, RichTextEditor]);
  
  const handleSave = () => {
    if (title.trim()) {
      // Si viene de un evento pero el editor no soporta HTML, crear contenido plano
      let finalContent = content;
      
      if (fromEvent && !RichTextEditor && !content) {
        const eventDate = new Date(fromEvent.start).toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        finalContent = `Evento: ${fromEvent.title}\nFecha: ${eventDate}\n\n---\n\n`;
      }
      
      onSave(
        title.trim(),
        finalContent,
        fromEvent ? fromEvent.id : null,
        fromEvent ? fromEvent.title : null
      );
      setTitle('');
      setContent('');
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
    setContent(htmlContent);
  };
  
  return React.createElement(
    'div',
    {
      className: 'create-note-form',
      style: {
        backgroundColor: 'var(--card-bg)',
        border: '2px solid var(--primary-color)',
        borderRadius: 'var(--border-radius-lg)',
        padding: 'var(--spacing-lg)',
        boxShadow: 'var(--shadow-lg)',
        animation: 'slideDown 0.3s ease-out'
      }
    },
    [
      React.createElement(
        'div',
        {
          key: 'header',
          style: {
            display: 'flex',
            alignItems: 'center',
            marginBottom: 'var(--spacing-md)'
          }
        },
        [
          React.createElement(
            'span',
            {
              className: 'material-icons',
              key: 'icon',
              style: {
                color: 'var(--primary-color)',
                marginRight: 'var(--spacing-sm)',
                fontSize: '20px'
              }
            },
            'add_circle'
          ),
          React.createElement(
            'h2',
            {
              key: 'title',
              style: {
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: 'var(--text-color)'
              }
            },
            fromEvent ? 'Nueva Nota desde Evento' : 'Nueva Nota'
          )
        ]
      ),
      
      // Mostrar información del evento si viene de uno
      fromEvent && React.createElement(
        'div',
        {
          key: 'event-info',
          style: {
            backgroundColor: 'rgba(var(--primary-color-rgb, 45, 75, 148), 0.1)',
            border: '1px solid var(--primary-color)',
            borderRadius: 'var(--border-radius-sm)',
            padding: 'var(--spacing-sm)',
            marginBottom: 'var(--spacing-md)',
            fontSize: '13px',
            color: 'var(--text-color)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)'
          }
        },
        [
          React.createElement('span', { className: 'material-icons', key: 'icon', style: { fontSize: '16px' } }, 'event'),
          React.createElement('span', { key: 'text' }, `Esta nota se vinculará automáticamente al evento: ${fromEvent.title}`)
        ]
      ),
      
      React.createElement(
        'div',
        {
          key: 'form',
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-md)'
          }
        },
        [
          React.createElement(
            'input',
            {
              key: 'title-input',
              type: 'text',
              value: title,
              onChange: (e) => setTitle(e.target.value),
              onKeyDown: handleKeyPress,
              placeholder: 'Título de la nota *',
              autoFocus: true,
              style: {
                width: '100%',
                border: '2px solid var(--border-color)',
                borderRadius: 'var(--border-radius-md)',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                fontSize: '16px',
                fontWeight: '500',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-color)',
                transition: 'border-color var(--transition-fast)',
                outline: 'none'
              },
              onFocus: (e) => {
                e.target.style.borderColor = 'var(--primary-color)';
              },
              onBlur: (e) => {
                e.target.style.borderColor = 'var(--border-color)';
              }
            }
          ),
          
          // Usar RichTextEditor si está disponible, sino fallback al textarea
          RichTextEditor ? 
            React.createElement(RichTextEditor, {
              key: 'content-rich-editor',
              value: content,
              onChange: handleContentChange,
              placeholder: 'Escribe el contenido de tu nota aquí...',
              height: '200px',
              toolbar: 'full',
              className: 'note-rich-editor',
              initialFocus: !fromEvent // Solo enfocar si no viene de evento
            }) :
            React.createElement(
              'textarea',
              {
                key: 'content-textarea-fallback',
                value: content,
                onChange: (e) => setContent(e.target.value),
                onKeyDown: handleKeyPress,
                placeholder: fromEvent ? 
                  'Escribe tus notas sobre el evento aquí...' : 
                  'Escribe el contenido de tu nota aquí...',
                rows: 8,
                style: {
                  width: '100%',
                  border: '2px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  fontSize: '14px',
                  backgroundColor: 'var(--input-bg)',
                  color: 'var(--text-color)',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  lineHeight: '1.5',
                  minHeight: '120px',
                  transition: 'border-color var(--transition-fast)',
                  outline: 'none'
                },
                onFocus: (e) => {
                  e.target.style.borderColor = 'var(--primary-color)';
                },
                onBlur: (e) => {
                  e.target.style.borderColor = 'var(--border-color)';
                }
              }
            )
        ]
      ),
      
      React.createElement(
        'div',
        {
          key: 'actions',
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 'var(--spacing-md)',
            paddingTop: 'var(--spacing-md)',
            borderTop: '1px solid var(--border-color)'
          }
        },
        [
          React.createElement(
            'div',
            {
              key: 'help',
              style: {
                fontSize: '12px',
                color: 'var(--text-color-secondary)',
                fontStyle: 'italic'
              }
            },
            RichTextEditor ? 
              'Usa la barra de herramientas para dar formato • Ctrl+Enter para guardar • Esc para cancelar' :
              'Ctrl+Enter para guardar • Esc para cancelar'
          ),
          
          React.createElement(
            'div',
            {
              key: 'buttons',
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
                    borderRadius: 'var(--border-radius-md)',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)'
                  },
                  onMouseEnter: (e) => {
                    e.target.style.backgroundColor = 'var(--hover-color)';
                    e.target.style.borderColor = 'var(--text-color-secondary)';
                  },
                  onMouseLeave: (e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.borderColor = 'var(--border-color)';
                  }
                },
                [
                  React.createElement(
                    'span',
                    {
                      className: 'material-icons',
                      key: 'cancel-icon',
                      style: { fontSize: '16px' }
                    },
                    'close'
                  ),
                  React.createElement('span', { key: 'cancel-text' }, 'Cancelar')
                ]
              ),
              
              React.createElement(
                'button',
                {
                  key: 'save',
                  onClick: handleSave,
                  disabled: !title.trim(),
                  style: {
                    backgroundColor: title.trim() ? 'var(--primary-color)' : 'var(--border-color)',
                    color: title.trim() ? 'white' : 'var(--text-color-secondary)',
                    border: 'none',
                    borderRadius: 'var(--border-radius-md)',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: title.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all var(--transition-fast)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)'
                  },
                  onMouseEnter: (e) => {
                    if (title.trim()) {
                      e.target.style.backgroundColor = 'var(--primary-hover)';
                    }
                  },
                  onMouseLeave: (e) => {
                    if (title.trim()) {
                      e.target.style.backgroundColor = 'var(--primary-color)';
                    }
                  }
                },
                [
                  React.createElement(
                    'span',
                    {
                      className: 'material-icons',
                      key: 'save-icon',
                      style: { fontSize: '16px' }
                    },
                    'save'
                  ),
                  React.createElement('span', { key: 'save-text' }, 'Crear Nota')
                ]
              )
            ]
          )
        ]
      )
    ]
  );
}

// Agregar animación CSS
const styleElement = document.createElement('style');
styleElement.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(styleElement);

export default CreateNoteForm;