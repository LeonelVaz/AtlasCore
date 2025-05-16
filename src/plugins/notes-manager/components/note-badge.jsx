import React, { useState, useEffect, useContext } from 'react';
import { NotesContext } from '../contexts/notes-context';

// Componente que muestra un indicador visual para eventos con notas
const NoteBadge = ({ event }) => {
  const [hasNotes, setHasNotes] = useState(false);
  const { getNotesByEvent } = useContext(NotesContext);
  
  useEffect(() => {
    // Verificar si el evento tiene notas asociadas
    const checkForNotes = async () => {
      if (!event || !event.id) return;
      
      try {
        const eventNotes = await getNotesByEvent(event.id);
        setHasNotes(eventNotes && eventNotes.length > 0);
      } catch (error) {
        console.error('Error al verificar notas para evento:', error);
      }
    };
    
    checkForNotes();
  }, [event, getNotesByEvent]);
  
  // No mostrar nada si el evento no tiene notas
  if (!hasNotes) return null;
  
  return (
    <div className="event-badge note-badge" title="Este evento tiene notas">
      <span className="material-icons">note</span>
    </div>
  );
};

export default NoteBadge;