import React, { useState, useEffect } from 'react';

/**
 * Componente que muestra un indicador visual para eventos con notas
 * Se integra en la decoración de eventos del calendario
 */
const NoteBadge = ({ event, pluginId }) => {
  const [hasNotes, setHasNotes] = useState(false);
  const [notesCount, setNotesCount] = useState(0);
  
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
          const hasValidNotes = eventNotes && Array.isArray(eventNotes) && eventNotes.length > 0;
          setHasNotes(hasValidNotes);
          setNotesCount(hasValidNotes ? eventNotes.length : 0);
        } else {
          // Fallback: comprobar mediante referencias directas
          const fallbackCheck = () => {
            try {
              // Si el evento tiene una propiedad que indica que tiene notas
              if (event.hasNotes) return { hasNotes: true, count: 1 };
              
              // Intentar buscar en almacenamiento como segunda opción
              const storageKey = `plugin.notes-manager.notes`;
              const notesJson = localStorage.getItem(storageKey);
              if (!notesJson) return { hasNotes: false, count: 0 };
              
              const notes = JSON.parse(notesJson);
              if (!Array.isArray(notes)) return { hasNotes: false, count: 0 };
              
              // Buscar notas que referencien este evento
              const matchingNotes = notes.filter(note => 
                (note.references && note.references.type === 'event' && note.references.id === event.id) ||
                note.eventId === event.id // Compatibilidad con versiones antiguas
              );
              
              return { 
                hasNotes: matchingNotes.length > 0, 
                count: matchingNotes.length 
              };
            } catch (err) {
              console.error('Error al verificar notas en localStorage:', err);
              return { hasNotes: false, count: 0 };
            }
          };
          
          const result = fallbackCheck();
          setHasNotes(result.hasNotes);
          setNotesCount(result.count);
        }
      } catch (error) {
        console.error('Error al verificar notas para evento:', error);
      }
    };
    
    checkForNotes();
    
    // Suscribirse a cambios en notas
    const handleNotesChanged = () => {
      checkForNotes();
    };
    
    // Intentar suscribirse a eventos de cambio de notas
    if (window.__appCore?.events) {
      const unsubscribers = [
        window.__appCore.events.subscribe('plugin.notes-manager.note_created', handleNotesChanged),
        window.__appCore.events.subscribe('plugin.notes-manager.note_updated', handleNotesChanged),
        window.__appCore.events.subscribe('plugin.notes-manager.note_deleted', handleNotesChanged)
      ];
      
      return () => {
        unsubscribers.forEach(unsub => {
          if (typeof unsub === 'function') unsub();
        });
      };
    }
  }, [event]);
  
  // No mostrar nada si el evento no tiene notas
  if (!hasNotes) return null;
  
  const badgeTitle = notesCount === 1 
    ? 'Este evento tiene 1 nota'
    : `Este evento tiene ${notesCount} notas`;
  
  // Selector de clase según el número de notas
  const getBadgeClassName = () => {
    if (notesCount > 5) return 'note-badge note-badge-many';
    if (notesCount > 1) return 'note-badge note-badge-multiple';
    return 'note-badge';
  };
  
  return (
    <div className={getBadgeClassName()} title={badgeTitle}>
      <span className="material-icons">note</span>
      {notesCount > 1 && (
        <span className="note-count">{notesCount}</span>
      )}
    </div>
  );
};

export default NoteBadge;