import React, { useState, useEffect, useCallback } from 'react';
import NotesList from './notes-list';
import NoteEditor from './note-editor';
import { NotesContext } from '../contexts/notes-context';
import Dialog from '../../../components/ui/dialog';

/**
 * Panel principal para gestión de notas
 * Permite visualizar, crear, editar y eliminar notas
 */
const NotesPanel = () => {
  const [view, setView] = useState('list'); // 'list' o 'editor'
  const [selectedNote, setSelectedNote] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const { notes, createNote, updateNote, deleteNote, loading, t, refreshNotes, cleanOrphanedReferences } = React.useContext(NotesContext);
  
  // Verificar referencias huérfanas al cargar el panel
  useEffect(() => {
    const initializePanel = async () => {
      await refreshNotes();
      
      // Limpiar referencias huérfanas (eventos eliminados)
      await cleanOrphanedReferences();
    };
    
    initializePanel();
  }, [refreshNotes, cleanOrphanedReferences]);
  
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
  
  // Para cancelar la edición y volver a la lista
  const handleCancelEdit = () => {
    setSelectedNote(null);
    setView('list');
  };
  
  // Para mostrar el diálogo de confirmación
  const handleDeleteRequest = useCallback((noteId) => {
    const note = notes.find(n => n.id === noteId);
    setNoteToDelete(note);
    setShowConfirmDelete(true);
  }, [notes]);
  
  // Para eliminar una nota
  const handleConfirmDelete = async () => {
    try {
      if (noteToDelete) {
        await deleteNote(noteToDelete.id);
        
        // Si estábamos editando la nota eliminada, volver a la lista
        if (selectedNote && selectedNote.id === noteToDelete.id) {
          setSelectedNote(null);
          setView('list');
        }
        
        // Cerrar diálogo de confirmación
        setShowConfirmDelete(false);
        setNoteToDelete(null);
      }
    } catch (error) {
      console.error('Error al eliminar nota:', error);
    }
  };
  
  // Para cancelar la eliminación
  const handleCancelDelete = () => {
    setShowConfirmDelete(false);
    setNoteToDelete(null);
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
        <div className="notes-loading">
          <div className="loading-spinner"></div>
          <span>{t('common.loading')}</span>
        </div>
      ) : (
        <div className="notes-panel-content">
          {view === 'list' ? (
            <NotesList 
              notes={notes}
              onSelectNote={handleEditNote}
              onDeleteNote={handleDeleteRequest}
            />
          ) : (
            <NoteEditor 
              note={selectedNote}
              onSave={handleSaveNote}
              onCancel={handleCancelEdit}
              onDelete={() => handleDeleteRequest(selectedNote.id)}
            />
          )}
        </div>
      )}
      
      {/* Diálogo de confirmación para eliminar */}
      {showConfirmDelete && noteToDelete && (
        <Dialog
          isOpen={showConfirmDelete}
          onClose={handleCancelDelete}
          title={t('notes.delete')}
          onConfirm={handleConfirmDelete}
          confirmText={t('common.delete')}
          cancelText={t('common.cancel')}
        >
          <div className="delete-confirmation">
            <p>{t('notes.confirmDeleteMessage')} <strong>{noteToDelete.title}</strong>?</p>
            <p className="delete-warning">{t('notes.deleteWarning')}</p>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default NotesPanel;