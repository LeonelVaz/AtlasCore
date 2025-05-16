import React, { useState, useEffect } from 'react';

/**
 * Componente que muestra un indicador visual para eventos con notas
 * Se integra en la decoración de eventos del calendario
 */
const NoteBadge = ({ event, pluginId }) => {
  const [hasNotes, setHasNotes] = useState(false);
  
  useEffect(() => {
    // Verificar si el evento tiene notas asociadas
    const checkForNotes = async () => {
      if (!event || !event.id) return;
      
      try {
        // Intentar acceder al módulo de notas a través del registro global
        const notesModule = window.__appModules?.['notes-manager'];
        
        if (notesModule && typeof notesModule.getNotesByEvent === 'function') {
          // Usar el método del módulo si está disponible
          const eventNotes = await notesModule.getNotesByEvent(event.id);
          setHasNotes(eventNotes && eventNotes.length > 0);
        } else {
          // Fallback: comprobar mediante referencias directas
          const fallbackCheck = () => {
            try {
              // Si el evento tiene una propiedad que indica que tiene notas
              if (event.hasNotes) return true;
              
              // Intentar buscar en almacenamiento como segunda opción
              const storageKey = `plugin.notes-manager.notes`;
              const notesJson = localStorage.getItem(storageKey);
              if (!notesJson) return false;
              
              const notes = JSON.parse(notesJson);
              if (!Array.isArray(notes)) return false;
              
              // Buscar notas que referencien este evento
              return notes.some(note => 
                (note.references && note.references.type === 'event' && note.references.id === event.id) ||
                note.eventId === event.id // Compatibilidad con versiones antiguas
              );
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