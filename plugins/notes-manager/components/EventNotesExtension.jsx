import React from 'react';
import CreateNoteForm from './CreateNoteForm.jsx';

function EventNotesExtension(props) {
  const { event, plugin, core } = props;
  const [notes, setNotes] = React.useState([]);
  const [collapsed, setCollapsed] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  
  const refreshNotes = () => {
    if (plugin && event && event.id) {
      const eventNotes = plugin.getNotesForEvent(event.id);
      setNotes(eventNotes);
    }
  };
  
  React.useEffect(() => {
    refreshNotes();
  }, [plugin, event]);
  
  // Escuchar eventos de creación/actualización/eliminación de notas
  React.useEffect(() => {
    if (!core || !plugin) return;
    
    const handleNotesChanged = () => {
      setIsRefreshing(true);
      refreshNotes();
      setTimeout(() => setIsRefreshing(false), 300);
    };
    
    // Suscribirse a eventos del plugin de notas
    const unsubCreate = core.events.subscribe(
      plugin.id,
      'noteCreated',
      handleNotesChanged
    );
    
    const unsubUpdate = core.events.subscribe(
      plugin.id,
      'noteUpdated',
      handleNotesChanged
    );
    
    const unsubDelete = core.events.subscribe(
      plugin.id,
      'noteDeleted',
      handleNotesChanged
    );
    
    return () => {
      if (typeof unsubCreate === 'function') unsubCreate();
      if (typeof unsubUpdate === 'function') unsubUpdate();
      if (typeof unsubDelete === 'function') unsubDelete();
    };
  }, [core, plugin]);
  
  const handleNoteClick = (noteId) => {
    // Intentar diferentes métodos de navegación
    const navigateToNote = () => {
      const params = { selectedNoteId: noteId };
      
      if (core.navigation && core.navigation.navigateToPlugin) {
        core.navigation.navigateToPlugin(plugin.id, 'notes', params);
      } else if (core.ui && core.ui.navigateToPlugin) {
        core.ui.navigateToPlugin(plugin.id, 'notes', params);
      } else if (props.onNavigate) {
        // Si se proporciona onNavigate desde el padre
        props.onNavigate(plugin.id, 'notes', params);
      } else {
        console.warn('[Notas Simples] No se pudo navegar a la nota');
      }
    };
    
    navigateToNote();
  };
  
  const handleCreateNote = () => {
    console.log('[Notas Simples] Abriendo formulario para crear nota del evento:', event.title);
    setShowCreateForm(true);
  };
  
  const handleSaveNote = async (title, content) => {
    try {
      // Crear la nota vinculada al evento
      await plugin.createNote(title, content, event.id, event.title);
      
      // Cerrar el formulario de creación
      setShowCreateForm(false);
      
      // Refrescar las notas de manera asíncrona para evitar conflictos
      setTimeout(() => {
        refreshNotes();
      }, 100);
      
      // Mostrar notificación discreta sin usar dialogs que puedan interferir
      console.log('[Notas Simples] ✅ Nota creada exitosamente para el evento:', event.title);
      
      // Si hay una función de notificación no intrusiva disponible, usarla
      if (core?.notifications?.show) {
        core.notifications.show({
          type: 'success',
          message: 'Nota creada exitosamente',
          duration: 2000,
          position: 'bottom-right'
        });
      } else if (core?.toast?.success) {
        core.toast.success('Nota creada exitosamente');
      }
      
    } catch (error) {
      console.error('[Notas Simples] Error al crear la nota:', error);
      
      // Mostrar error de manera no intrusiva
      if (core?.notifications?.show) {
        core.notifications.show({
          type: 'error',
          message: 'Error al crear la nota',
          duration: 3000,
          position: 'bottom-right'
        });
      } else if (core?.toast?.error) {
        core.toast.error('Error al crear la nota');
      }
    }
  };
  
  const handleCancelCreate = () => {
    setShowCreateForm(false);
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getTextPreview = (content) => {
    if (!content) return 'Sin contenido';
    
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const text = tempDiv.textContent || tempDiv.innerText || '';
      return text.length > 100 ? text.substring(0, 100) + '...' : text || 'Sin contenido';
    } catch (error) {
      return content.substring(0, 100) + '...' || 'Sin contenido';
    }
  };
  
  return React.createElement(
    React.Fragment,
    null,
    [
      // Sección principal de notas
      React.createElement(
        'div',
        {
          key: 'notes-section',
          className: 'event-notes-section',
          style: {
            marginTop: 'var(--spacing-md)',
            padding: 'var(--spacing-md)',
            backgroundColor: 'var(--bg-color-secondary)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--border-color)',
            transition: 'all var(--transition-normal)',
            opacity: isRefreshing ? 0.7 : 1
          }
        },
        [
          // Header
          React.createElement(
            'div',
            {
              key: 'header',
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: collapsed ? 0 : 'var(--spacing-sm)'
              }
            },
            [
              React.createElement(
                'div',
                {
                  key: 'title',
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    cursor: 'pointer',
                    flex: 1
                  },
                  onClick: () => setCollapsed(!collapsed)
                },
                [
                  React.createElement(
                    'span',
                    {
                      className: 'material-icons',
                      key: 'icon',
                      style: {
                        fontSize: '18px',
                        color: 'var(--primary-color)'
                      }
                    },
                    'note'
                  ),
                  React.createElement(
                    'h4',
                    {
                      key: 'text',
                      style: {
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--text-color)'
                      }
                    },
                    `Notas (${notes.length})`
                  ),
                  React.createElement(
                    'span',
                    {
                      key: 'chevron',
                      className: 'material-icons',
                      style: {
                        fontSize: '18px',
                        color: 'var(--text-color-secondary)',
                        transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                        transition: 'transform var(--transition-fast)'
                      }
                    },
                    'expand_more'
                  )
                ]
              ),
              
              // Botón de crear nota
              React.createElement(
                'button',
                {
                  key: 'create-note-btn',
                  onClick: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCreateNote();
                  },
                  style: {
                    backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--border-radius-sm)',
                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    transition: 'all var(--transition-fast)',
                    marginLeft: 'var(--spacing-sm)'
                  },
                  onMouseEnter: (e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  },
                  onMouseLeave: (e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary-color)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                },
                [
                  React.createElement('span', { className: 'material-icons', key: 'icon', style: { fontSize: '14px' } }, 'add'),
                  React.createElement('span', { key: 'text' }, 'Crear Nota')
                ]
              )
            ]
          ),
          
          // Lista de notas
          !collapsed && React.createElement(
            'div',
            {
              key: 'notes-list',
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-xs)'
              }
            },
            notes.length === 0 ?
              React.createElement(
                'div',
                {
                  style: {
                    textAlign: 'center',
                    padding: 'var(--spacing-md)',
                    color: 'var(--text-color-secondary)',
                    fontSize: '13px',
                    fontStyle: 'italic'
                  }
                },
                'No hay notas para este evento. ¡Crea la primera!'
              ) :
              notes.map(note => 
                React.createElement(
                  'div',
                  {
                    key: note.id,
                    className: 'event-note-item',
                    style: {
                      padding: 'var(--spacing-sm)',
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--border-radius-sm)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    },
                    onClick: () => handleNoteClick(note.id),
                    onMouseEnter: (e) => {
                      e.currentTarget.style.borderColor = 'var(--primary-color)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    },
                    onMouseLeave: (e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }
                  },
                  [
                    React.createElement(
                      'div',
                      {
                        key: 'note-title',
                        style: {
                          fontWeight: '500',
                          fontSize: '13px',
                          color: 'var(--text-color)',
                          marginBottom: 'var(--spacing-xs)'
                        }
                      },
                      note.title
                    ),
                    React.createElement(
                      'div',
                      {
                        key: 'note-preview',
                        style: {
                          fontSize: '12px',
                          color: 'var(--text-color-secondary)',
                          lineHeight: '1.4',
                          marginBottom: 'var(--spacing-xs)'
                        }
                      },
                      getTextPreview(note.content)
                    ),
                    React.createElement(
                      'div',
                      {
                        key: 'note-date',
                        style: {
                          fontSize: '11px',
                          color: 'var(--text-color-secondary)',
                          fontStyle: 'italic'
                        }
                      },
                      formatDate(note.createdAt)
                    )
                  ]
                )
              )
          )
        ]
      ),
      
      // Modal/Overlay con formulario de creación
      showCreateForm && React.createElement(
        'div',
        {
          key: 'create-form-overlay',
          style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 'var(--spacing-lg)'
          },
          onClick: handleCancelCreate
        },
        React.createElement(
          'div',
          {
            style: {
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              borderRadius: 'var(--border-radius-lg)',
              backgroundColor: 'var(--modal-bg)',
              boxShadow: 'var(--shadow-xl)'
            },
            onClick: (e) => e.stopPropagation()
          },
          React.createElement(CreateNoteForm, {
            onSave: handleSaveNote,
            onCancel: handleCancelCreate,
            core: core,
            fromEvent: event
          })
        )
      )
    ]
  );
}

export default EventNotesExtension;