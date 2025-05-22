import React from 'react';
import NoteCard from './NoteCard.jsx';
import CreateNoteForm from './CreateNoteForm.jsx';

function NotesPage(props) {
  const [notes, setNotes] = React.useState([]);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [editingNote, setEditingNote] = React.useState(null);
  
  // Cargar notas al montar el componente
  React.useEffect(() => {
    if (props.plugin) {
      const currentNotes = props.plugin.getNotes();
      setNotes(currentNotes);
    }
  }, [props.plugin]);
  
  // Manejar creación de nueva nota
  const handleCreateNote = (title, content) => {
    if (props.plugin) {
      const newNote = props.plugin.createNote(title, content);
      const updatedNotes = props.plugin.getNotes();
      setNotes(updatedNotes);
      setShowCreateForm(false);
    }
  };
  
  // Manejar actualización de nota
  const handleUpdateNote = (noteId, updates) => {
    if (props.plugin) {
      props.plugin.updateNote(noteId, updates);
      const updatedNotes = props.plugin.getNotes();
      setNotes(updatedNotes);
      setEditingNote(null);
    }
  };
  
  // Manejar eliminación de nota
  const handleDeleteNote = (noteId) => {
    if (props.plugin && window.confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
      props.plugin.deleteNote(noteId);
      const updatedNotes = props.plugin.getNotes();
      setNotes(updatedNotes);
    }
  };
  
  // Manejar cancelación de edición
  const handleCancelEdit = () => {
    setEditingNote(null);
    setShowCreateForm(false);
  };
  
  return React.createElement(
    'div',
    { 
      className: 'notes-page',
      style: {
        padding: 'var(--spacing-lg)',
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'var(--bg-color)',
        minHeight: '100vh'
      }
    },
    [
      // Header
      React.createElement(
        'div',
        {
          key: 'header',
          className: 'notes-header',
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--spacing-xl)',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: 'var(--spacing-md)'
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
                    fontSize: '28px',
                    fontWeight: '600'
                  }
                },
                'My Notes'
              ),
              React.createElement(
                'p',
                {
                  key: 'subtitle',
                  style: {
                    margin: 'var(--spacing-xs) 0 0 0',
                    color: 'var(--text-color-secondary)',
                    fontSize: '14px'
                  }
                },
                `${notes.length} nota${notes.length !== 1 ? 's' : ''}`
              )
            ]
          ),
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
                padding: 'var(--spacing-sm) var(--spacing-md)',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)',
                transition: 'background-color var(--transition-fast)'
              },
              onMouseEnter: (e) => {
                e.target.style.backgroundColor = 'var(--primary-hover)';
              },
              onMouseLeave: (e) => {
                e.target.style.backgroundColor = 'var(--primary-color)';
              }
            },
            [
              React.createElement(
                'span',
                { 
                  className: 'material-icons',
                  key: 'icon',
                  style: { fontSize: '18px' }
                },
                'add'
              ),
              React.createElement('span', { key: 'text' }, 'Nueva Nota')
            ]
          )
        ]
      ),
      
      // Formulario de creación (si está visible)
      showCreateForm && React.createElement(CreateNoteForm, {
        key: 'create-form',
        onSave: handleCreateNote,
        onCancel: handleCancelEdit
      }),
      
      // Lista de notas
      React.createElement(
        'div',
        {
          key: 'notes-grid',
          className: 'notes-grid',
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 'var(--spacing-md)',
            marginTop: showCreateForm ? 'var(--spacing-xl)' : 0
          }
        },
        notes.length === 0 ? 
          React.createElement(
            'div',
            {
              key: 'empty-state',
              style: {
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: 'var(--spacing-xl)',
                color: 'var(--text-color-secondary)'
              }
            },
            [
              React.createElement(
                'span',
                {
                  className: 'material-icons',
                  key: 'icon',
                  style: {
                    fontSize: '48px',
                    marginBottom: 'var(--spacing-md)',
                    opacity: 0.5,
                    display: 'block'
                  }
                },
                'note'
              ),
              React.createElement(
                'p',
                { key: 'message' },
                'No hay notas todavía. ¡Crea tu primera nota!'
              )
            ]
          ) :
          notes.map(note => 
            React.createElement(NoteCard, {
              key: note.id,
              note: note,
              isEditing: editingNote === note.id,
              onEdit: () => setEditingNote(note.id),
              onSave: (updates) => handleUpdateNote(note.id, updates),
              onDelete: () => handleDeleteNote(note.id),
              onCancel: handleCancelEdit
            })
          )
      )
    ]
  );
}

export default NotesPage;