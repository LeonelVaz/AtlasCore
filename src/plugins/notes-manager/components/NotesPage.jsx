import React from 'react';
import NoteCard from './NoteCard.jsx';
import CreateNoteForm from './CreateNoteForm.jsx';

function NotesPage(props) {
  const { plugin, core } = props;
  const [notes, setNotes] = React.useState([]);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [editingNote, setEditingNote] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filteredNotes, setFilteredNotes] = React.useState([]);
  
  // Cargar notas al montar el componente
  React.useEffect(() => {
    if (plugin) {
      const currentNotes = plugin.getNotes();
      setNotes(currentNotes);
      setFilteredNotes(currentNotes);
    }
  }, [plugin]);
  
  // Filtrar notas cuando cambia la búsqueda
  React.useEffect(() => {
    if (plugin && searchQuery.trim()) {
      const results = plugin.searchNotes(searchQuery);
      setFilteredNotes(results);
    } else {
      setFilteredNotes(notes);
    }
  }, [searchQuery, notes, plugin]);
  
  // Manejar creación de nueva nota
  const handleCreateNote = (title, content) => {
    if (plugin) {
      const newNote = plugin.createNote(title, content);
      const updatedNotes = plugin.getNotes();
      setNotes(updatedNotes);
      setShowCreateForm(false);
      
      // Mostrar notificación si está disponible el sistema de diálogos
      if (core?.dialogs?.alert) {
        core.dialogs.alert(plugin.id, '✅ Nota creada exitosamente', 'Éxito');
      }
    }
  };
  
  // Manejar actualización de nota
  const handleUpdateNote = (noteId, updates) => {
    if (plugin) {
      plugin.updateNote(noteId, updates);
      const updatedNotes = plugin.getNotes();
      setNotes(updatedNotes);
      setEditingNote(null);
      
      // Mostrar notificación si está disponible el sistema de diálogos
      if (core?.dialogs?.alert) {
        core.dialogs.alert(plugin.id, '✅ Nota actualizada exitosamente', 'Éxito');
      }
    }
  };
  
  // Manejar eliminación de nota
  const handleDeleteNote = async (noteId) => {
    if (!plugin) return;
    
    let confirmed = false;
    
    // Usar el sistema de diálogos personalizado si está disponible
    if (core?.dialogs?.confirm) {
      confirmed = await core.dialogs.confirm(
        plugin.id,
        '¿Estás seguro de que quieres eliminar esta nota? Esta acción no se puede deshacer.',
        'Confirmar eliminación'
      );
    } else {
      // Fallback al confirm nativo
      confirmed = window.confirm('¿Estás seguro de que quieres eliminar esta nota?');
    }
    
    if (confirmed) {
      plugin.deleteNote(noteId);
      const updatedNotes = plugin.getNotes();
      setNotes(updatedNotes);
      
      // Mostrar notificación si está disponible el sistema de diálogos
      if (core?.dialogs?.alert) {
        core.dialogs.alert(plugin.id, '🗑️ Nota eliminada exitosamente', 'Eliminada');
      }
    }
  };
  
  // Manejar cancelación de edición
  const handleCancelEdit = () => {
    setEditingNote(null);
    setShowCreateForm(false);
  };
  
  // Obtener estadísticas
  const stats = plugin ? plugin.getNotesStats() : { total: 0, withRichContent: 0 };
  
  // Verificar si RichText está disponible
  const hasRichText = !!(core?.ui?.components?.RichTextEditor);
  
  return React.createElement(
    'div',
    { 
      className: 'notes-page',
      style: {
        padding: 'var(--spacing-lg)',
        maxWidth: '1400px',
        margin: '0 auto',
        backgroundColor: 'var(--bg-color)',
        minHeight: '100vh'
      }
    },
    [
      // Header mejorado
      React.createElement(
        'div',
        {
          key: 'header',
          className: 'notes-header',
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 'var(--spacing-xl)',
            borderBottom: '2px solid var(--border-color)',
            paddingBottom: 'var(--spacing-md)',
            flexWrap: 'wrap',
            gap: 'var(--spacing-md)'
          }
        },
        [
          React.createElement(
            'div',
            { key: 'title-section' },
            [
              React.createElement(
                'h1',
                { 
                  key: 'title',
                  style: {
                    margin: 0,
                    color: 'var(--text-color)',
                    fontSize: '32px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)'
                  }
                },
                [
                  React.createElement('span', { key: 'title-icon', className: 'material-icons', style: { fontSize: '32px', color: 'var(--primary-color)' } }, 'note'),
                  React.createElement('span', { key: 'title-text' }, 'My Notes')
                ]
              ),
              React.createElement(
                'div',
                {
                  key: 'stats',
                  style: {
                    margin: 'var(--spacing-xs) 0 0 0',
                    color: 'var(--text-color-secondary)',
                    fontSize: '14px',
                    display: 'flex',
                    gap: 'var(--spacing-md)',
                    flexWrap: 'wrap'
                  }
                },
                [
                  React.createElement('span', { key: 'total' }, `📝 ${stats.total} nota${stats.total !== 1 ? 's' : ''}`),
                  hasRichText && React.createElement('span', { key: 'rich' }, `🎨 ${stats.withRichContent} con formato`),
                  stats.createdToday > 0 && React.createElement('span', { key: 'today' }, `✨ ${stats.createdToday} creadas hoy`)
                ].filter(Boolean)
              )
            ]
          ),
          React.createElement(
            'div',
            {
              key: 'actions',
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-sm)',
                alignItems: 'flex-end'
              }
            },
            [
              React.createElement(
                'button',
                {
                  key: 'create-button',
                  className: 'create-note-button',
                  onClick: () => setShowCreateForm(!showCreateForm),
                  style: {
                    backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--border-radius-md)',
                    padding: 'var(--spacing-sm) var(--spacing-lg)',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    transition: 'all var(--transition-fast)',
                    boxShadow: 'var(--shadow-sm)'
                  },
                  onMouseEnter: (e) => {
                    e.target.style.backgroundColor = 'var(--primary-hover)';
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = 'var(--shadow-md)';
                  },
                  onMouseLeave: (e) => {
                    e.target.style.backgroundColor = 'var(--primary-color)';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'var(--shadow-sm)';
                  }
                },
                [
                  React.createElement(
                    'span',
                    { 
                      className: 'material-icons',
                      key: 'button-icon',
                      style: { fontSize: '18px' }
                    },
                    showCreateForm ? 'close' : 'add'
                  ),
                  React.createElement('span', { key: 'button-text' }, showCreateForm ? 'Cancelar' : 'Nueva Nota')
                ]
              ),
              
              // Buscador
              notes.length > 3 && React.createElement(
                'div',
                {
                  key: 'search',
                  style: {
                    position: 'relative',
                    minWidth: '250px'
                  }
                },
                [
                  React.createElement(
                    'input',
                    {
                      key: 'search-input',
                      type: 'text',
                      value: searchQuery,
                      onChange: (e) => setSearchQuery(e.target.value),
                      placeholder: 'Buscar en notas...',
                      style: {
                        width: '100%',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--border-radius-md)',
                        padding: 'var(--spacing-xs) var(--spacing-md)',
                        paddingLeft: '40px',
                        fontSize: '14px',
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
                  React.createElement(
                    'span',
                    {
                      className: 'material-icons',
                      key: 'search-icon',
                      style: {
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-color-secondary)',
                        fontSize: '18px'
                      }
                    },
                    'search'
                  )
                ]
              )
            ]
          )
        ]
      ),
      
      // Información sobre RichText si está disponible
      hasRichText && React.createElement(
        'div',
        {
          key: 'richtext-info',
          style: {
            backgroundColor: 'rgba(var(--primary-color-rgb, 45, 75, 148), 0.1)',
            border: '1px solid var(--primary-color)',
            borderRadius: 'var(--border-radius-md)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            marginBottom: 'var(--spacing-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            fontSize: '13px',
            color: 'var(--text-color)'
          }
        },
        [
          React.createElement('span', { className: 'material-icons', key: 'richtext-icon', style: { fontSize: '16px', color: 'var(--primary-color)' } }, 'palette'),
          React.createElement('span', { key: 'richtext-text' }, 'Editor de texto enriquecido activado: usa negrita, cursiva, listas y más para dar formato a tus notas')
        ]
      ),
      
      // Formulario de creación (si está visible)
      showCreateForm && React.createElement(CreateNoteForm, {
        key: 'create-form',
        onSave: handleCreateNote,
        onCancel: handleCancelEdit,
        core: core
      }),
      
      // Resultados de búsqueda
      searchQuery.trim() && React.createElement(
        'div',
        {
          key: 'search-results',
          style: {
            marginBottom: 'var(--spacing-md)',
            padding: 'var(--spacing-sm)',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-md)',
            fontSize: '14px',
            color: 'var(--text-color-secondary)'
          }
        },
        `🔍 Mostrando ${filteredNotes.length} de ${notes.length} notas para "${searchQuery}"`
      ),
      
      // Lista de notas
      React.createElement(
        'div',
        {
          key: 'notes-grid',
          className: 'notes-grid',
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--spacing-lg)',
            marginTop: showCreateForm ? 'var(--spacing-xl)' : 'var(--spacing-md)'
          }
        },
        filteredNotes.length === 0 ? 
          React.createElement(
            'div',
            {
              key: 'empty-state',
              style: {
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: 'var(--spacing-xl) var(--spacing-md)',
                color: 'var(--text-color-secondary)',
                backgroundColor: 'var(--card-bg)',
                borderRadius: 'var(--border-radius-lg)',
                border: '2px dashed var(--border-color)'
              }
            },
            [
              React.createElement(
                'span',
                {
                  className: 'material-icons',
                  key: 'empty-icon',
                  style: {
                    fontSize: '64px',
                    marginBottom: 'var(--spacing-md)',
                    opacity: 0.5,
                    display: 'block',
                    color: 'var(--primary-color)'
                  }
                },
                searchQuery.trim() ? 'search_off' : 'note_add'
              ),
              React.createElement(
                'h3',
                {
                  key: 'empty-title',
                  style: {
                    margin: '0 0 var(--spacing-sm) 0',
                    fontSize: '18px',
                    fontWeight: '600'
                  }
                },
                searchQuery.trim() ? 'No se encontraron notas' : 'No hay notas todavía'
              ),
              React.createElement(
                'p',
                { 
                  key: 'empty-message',
                  style: {
                    margin: 0,
                    fontSize: '14px'
                  }
                },
                searchQuery.trim() ? 
                  `No hay notas que coincidan con "${searchQuery}". Intenta con otros términos.` :
                  '¡Crea tu primera nota usando el botón "Nueva Nota"!'
              )
            ]
          ) :
          filteredNotes.map(note => 
            React.createElement(NoteCard, {
              key: note.id,
              note: note,
              isEditing: editingNote === note.id,
              onEdit: () => setEditingNote(note.id),
              onSave: (updates) => handleUpdateNote(note.id, updates),
              onDelete: () => handleDeleteNote(note.id),
              onCancel: handleCancelEdit,
              core: core
            })
          )
      )
    ]
  );
}

export default NotesPage;