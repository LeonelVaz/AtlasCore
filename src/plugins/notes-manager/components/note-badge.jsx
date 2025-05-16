import React, { useState, useEffect } from 'react';
import { NotesContext } from '../contexts/notes-context';

// Componente que muestra un indicador visual para eventos con notas
const NoteBadge = ({ event }) => {
  const [hasNotes, setHasNotes] = useState(false);
  
  useEffect(() => {
    // Verificar si el evento tiene notas asociadas
    const checkForNotes = async () => {
      if (!event || !event.id) return;
      
      try {
        // Intentar acceder al módulo de notas directamente
        const notesModule = window.__appModules?.['notes-manager'];
        
        if (notesModule && typeof notesModule.getNotesByEvent === 'function') {
          // Usar el método del módulo si está disponible
          const eventNotes = await notesModule.getNotesByEvent(event.id);
          setHasNotes(eventNotes && eventNotes.length > 0);
        } else {
          // Intentar usar localStorage como fallback
          const fallbackCheck = () => {
            try {
              const storageKey = `plugin.notes-manager.notes`;
              const notesJson = localStorage.getItem(storageKey);
              if (!notesJson) return false;
              
              const notes = JSON.parse(notesJson);
              if (!Array.isArray(notes)) return false;
              
              const eventNotes = notes.filter(note => note.eventId === event.id);
              return eventNotes && eventNotes.length > 0;
            } catch (err) {
              console.error('Error al verificar notas en localStorage:', err);
              return false;
            }
          };
          
          setHasNotes(fallbackCheck());
        }
      } catch (error) {
        console.error('Error al verificar notas para evento:', error);
      }
    };
    
    checkForNotes();
  }, [event]);
  
  // No mostrar nada si el evento no tiene notas
  if (!hasNotes) return null;
  
  return (
    <div className="event-badge note-badge" title="Este evento tiene notas">
      <span className="material-icons">note</span>
    </div>
  );
};

export default NoteBadge;