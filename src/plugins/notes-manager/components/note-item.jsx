import React, { useState } from 'react';

const NoteItem = ({ note, onSelect, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    
    // Si es hoy, mostrar solo la hora
    const isToday = new Date().toDateString() === date.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Si no es hoy, mostrar fecha corta
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };
  
  // Obtener un extracto del contenido
  const getContentExcerpt = (content, maxLength = 100) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    
    return content.substring(0, maxLength) + '...';
  };
  
  // Manejar clic en eliminar
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };
  
  // Confirmar eliminación
  const handleConfirmDelete = (e) => {
    e.stopPropagation();
    onDelete();
    setShowDeleteConfirm(false);
  };
  
  // Cancelar eliminación
  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };
  
  return (
    <div 
      className="note-item"
      onClick={onSelect}
      style={{ borderLeftColor: note.color || '#2D4B94' }}
    >
      <div className="note-item-header">
        <h3 className="note-item-title">{note.title}</h3>
        <div className="note-item-date">{formatDate(note.modified)}</div>
      </div>
      
      <div className="note-item-content">
        {getContentExcerpt(note.content)}
      </div>
      
      {note.eventId && (
        <div className="note-item-event">
          <span className="material-icons">event</span>
          <span>Vinculada a evento</span>
        </div>
      )}
      
      <div className="note-item-actions">
        {!showDeleteConfirm ? (
          <button 
            className="note-item-delete"
            onClick={handleDeleteClick}
            title="Eliminar nota"
          >
            <span className="material-icons">delete</span>
          </button>
        ) : (
          <div className="note-delete-confirm">
            <span>¿Eliminar?</span>
            <button 
              className="note-delete-yes"
              onClick={handleConfirmDelete}
              title="Confirmar eliminación"
            >
              <span className="material-icons">check</span>
            </button>
            <button 
              className="note-delete-no"
              onClick={handleCancelDelete}
              title="Cancelar eliminación"
            >
              <span className="material-icons">close</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteItem;