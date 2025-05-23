import React from 'react';

function EventNotesExtension(props) {
  const { event, plugin, core } = props;
  const [notes, setNotes] = React.useState([]);
  const [collapsed, setCollapsed] = React.useState(false);
  
  React.useEffect(() => {
    if (plugin && event && event.id) {
      const eventNotes = plugin.getNotesForEvent(event.id);
      setNotes(eventNotes);
    }
  }, [plugin, event]);
  
  if (!notes || notes.length === 0) {
    return null;
  }
  
  const handleNoteClick = (noteId) => {
    // Navegar a la página de notas con la nota seleccionada
    if (core.navigation && core.navigation.navigateToPlugin) {
      core.navigation.navigateToPlugin(plugin.id, 'notes', {
        selectedNoteId: noteId
      });
    }
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
    'div',
    {
      className: 'event-notes-section',
      style: {
        marginTop: 'var(--spacing-md)',
        padding: 'var(--spacing-md)',
        backgroundColor: 'var(--bg-color-secondary)',
        borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--border-color)'
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
            marginBottom: collapsed ? 0 : 'var(--spacing-sm)',
            cursor: 'pointer'
          },
          onClick: () => setCollapsed(!collapsed)
        },
        [
          React.createElement(
            'div',
            {
              key: 'title',
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)'
              }
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
              )
            ]
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
  );
}

export default EventNotesExtension;