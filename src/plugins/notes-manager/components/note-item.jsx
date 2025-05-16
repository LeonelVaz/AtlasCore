import React, { useState, useContext } from 'react';
import { NotesContext } from '../contexts/notes-context';
import { formatNoteDate, getNoteExcerpt } from '../utils/notes-utils';

const NoteItem = ({ note, onSelect, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { categories, t } = useContext(NotesContext);
  
  // Obtener la categoría si existe
  const category = note.categoryId 
    ? categories.find(cat => cat.id === note.categoryId) 
    : null;
  
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
  
  // Determinar tipo de referencia
  const getReferenceIcon = () => {
    if (!note.references) return null;
    
    return note.references.type === 'event' 
      ? 'event' 
      : 'today';
  };
  
  // Determinar texto de referencia
  const getReferenceText = () => {
    if (!note.references) return '';
    
    return note.references.type === 'event' 
      ? t('notes.linkedEvent') 
      : t('notes.linkedDate');
  };
  
  // Para retrocompatibilidad con notas antiguas
  const hasEventReference = note.references?.type === 'event' || !!note.eventId;
  const hasDateReference = note.references?.type === 'date';
  
  return (
    <div 
      className="note-item"
      onClick={onSelect}
      style={{ borderLeftColor: note.color || '#2D4B94' }}
    >
      <div className="note-item-header">
        <h3 className="note-item-title">{note.title}</h3>
        <div className="note-item-date">
          {formatNoteDate(note.updatedAt || note.modified)}
        </div>
      </div>
      
      {category && (
        <div className="note-item-category">
          <span 
            className="category-indicator"
            style={{ backgroundColor: category.color }}
          ></span>
          <span className="category-name">{category.name}</span>
        </div>
      )}
      
      {note.tags && note.tags.length > 0 && (
        <div className="note-item-tags">
          {note.tags.map((tag, index) => (
            <span key={index} className="note-tag">
              {tag}
            </span>
          ))}
        </div>
      )}
      
      <div className="note-item-content">
        {getNoteExcerpt(note.content, 150)}
      </div>
      
      {(hasEventReference || hasDateReference) && (
        <div className="note-item-reference">
          <span className="material-icons">
            {getReferenceIcon() || 'link'}
          </span>
          <span>{getReferenceText()}</span>
        </div>
      )}
      
      <div className="note-item-actions">
        {!showDeleteConfirm ? (
          <button 
            className="note-item-delete"
            onClick={handleDeleteClick}
            title={t('notes.delete')}
          >
            <span className="material-icons">delete</span>
          </button>
        ) : (
          <div className="note-delete-confirm">
            <span>{t('notes.confirmDelete')}</span>
            <button 
              className="note-delete-yes"
              onClick={handleConfirmDelete}
              title={t('common.yes')}
            >
              <span className="material-icons">check</span>
            </button>
            <button 
              className="note-delete-no"
              onClick={handleCancelDelete}
              title={t('common.no')}
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