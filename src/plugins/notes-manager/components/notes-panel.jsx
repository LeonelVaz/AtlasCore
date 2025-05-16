import React, { useState, useEffect, useContext } from 'react';
import NotesList from './notes-list';
import NoteEditor from './note-editor';
import { NotesContext } from '../contexts/notes-context';

/**
 * Panel principal para gestión de notas
 * Permite visualizar, crear, editar y eliminar notas
 */
const NotesPanel = () => {
  const [view, setView] = useState('list'); // 'list' o 'editor'
  const [selectedNote, setSelectedNote] = useState(null);
  const { notes, createNote, updateNote, deleteNote, loading, t, cleanOrphanedReferences } = useContext(NotesContext);
  
  // Verificar referencias huérfanas al cargar el panel
  useEffect(() => {
    const checkOrphanedReferences = async () => {
      try {
        // Limpiar referencias a eventos que ya no existen
        const orphanedCount = await cleanOrphanedReferences();
        if (orphanedCount > 0) {
          console.log(`Se limpiaron ${orphanedCount} referencias huérfanas`);
        }
      } catch (error) {
        console.error('Error al verificar referencias huérfanas:', error);
      }
    };
    
    checkOrphanedReferences();
  }, [cleanOrphanedReferences]);
  
  // Para crear una nueva nota
  const handleNewNote = () => {
    setSelectedNote(null);
    setView('editor');
  };
  
  // Para editar una nota existente
  const handleEditNote = (note) => {
    setSelectedNote(note);
    setView('editor');
  };
  
  // Para guardar una nota (nueva o editada)
  const handleSaveNote = async (noteData) => {
    try {
      if (selectedNote) {
        // Actualizar nota existente
        await updateNote(selectedNote.id, noteData);
      } else {
        // Crear nueva nota
        await createNote(noteData);
      }
      
      // Volver a la vista de lista
      setView('list');
    } catch (error) {
      console.error('Error al guardar nota:', error);
      // Aquí se podría mostrar un mensaje de error al usuario
    }
  };
  
  // Para cancelar la edición
  const handleCancelEdit = () => {
    setSelectedNote(null);
    setView('list');
  };
  
  // Para eliminar una nota
  const handleDeleteNote = async (noteId) => {
    try {
      await deleteNote(noteId);
      
      // Si estábamos editando la nota eliminada, volver a la lista
      if (selectedNote && selectedNote.id === noteId) {
        setSelectedNote(null);
        setView('list');
      }
    } catch (error) {
      console.error('Error al eliminar nota:', error);
      // Aquí se podría mostrar un mensaje de error al usuario
    }
  };
  
  return (
    <div className="notes-panel">
      <div className="notes-panel-header">
        <h2 className="notes-panel-title">{t('panel.title')}</h2>
        {view === 'list' && (
          <button 
            className="notes-new-button"
            onClick={handleNewNote}
            title={t('notes.new')}
          >
            <span className="material-icons">add</span>
            {t('notes.new')}
          </button>
        )}
        {view === 'editor' && (
          <button 
            className="notes-back-button"
            onClick={handleCancelEdit}
            title={t('panel.back')}
          >
            <span className="material-icons">arrow_back</span>
            {t('panel.back')}
          </button>
        )}
      </div>
      
      {loading ? (
        <div className="notes-loading">{t('common.loading')}</div>
      ) : (
        <div className="notes-panel-content">
          {view === 'list' ? (
            <NotesList 
              notes={notes}
              onSelectNote={handleEditNote}
              onDeleteNote={handleDeleteNote}
            />
          ) : (
            <NoteEditor 
              note={selectedNote}
              onSave={handleSaveNote}
              onCancel={handleCancelEdit}
              onDelete={selectedNote ? () => handleDeleteNote(selectedNote.id) : null}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default NotesPanel;