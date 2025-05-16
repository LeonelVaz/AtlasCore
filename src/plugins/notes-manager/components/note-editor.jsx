import React, { useState, useEffect, useContext } from 'react';
import { NotesContext } from '../contexts/notes-context';
import RichTextEditor from './rich-text-editor';
import CategorySelector from './category-selector';
import TagsInput from './tags-input';

const NoteEditor = ({ note, onSave, onCancel, onDelete }) => {
  const { t } = useContext(NotesContext);
  
  // Estado para los campos del formulario
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: '#2D4B94',
    categoryId: null,
    tags: []
  });
  
  const [error, setError] = useState('');
  
  // Cargar datos si estamos editando una nota existente
  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title || '',
        content: note.content || '',
        color: note.color || '#2D4B94',
        categoryId: note.categoryId || null,
        tags: note.tags || [],
        references: note.references || null
      });
    } else {
      // Valores por defecto para nueva nota
      setFormData({
        title: '',
        content: '',
        color: '#2D4B94',
        categoryId: null,
        tags: []
      });
    }
  }, [note]);
  
  // Manejar cambios en campos de texto
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Manejar cambios en el editor de texto enriquecido
  const handleContentChange = (content) => {
    setFormData(prev => ({
      ...prev,
      content
    }));
  };
  
  // Manejar cambios en la categoría
  const handleCategoryChange = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      categoryId
    }));
  };
  
  // Manejar cambios en las etiquetas
  const handleTagsChange = (tags) => {
    setFormData(prev => ({
      ...prev,
      tags
    }));
  };
  
  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.title.trim()) {
      setError(t('errors.titleRequired'));
      return;
    }
    
    // Limpiar error si todo está correcto
    setError('');
    
    // Preservar referencias si existen
    const noteToSave = {
      ...formData,
      // Si estamos editando una nota existente, mantener la referencia
      references: note?.references || formData.references
    };
    
    // Llamar al callback de guardado
    onSave(noteToSave);
  };
  
  return (
    <div className="note-editor">
      <form onSubmit={handleSubmit} className="note-form">
        {error && (
          <div className="note-form-error">
            {error}
          </div>
        )}
        
        <div className="note-form-header">
          <div className="note-form-color">
            <label htmlFor="note-color">{t('notes.color')}:</label>
            <input
              id="note-color"
              type="color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="note-color-picker"
            />
          </div>
          
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="note-delete-button"
              title={t('notes.delete')}
            >
              <span className="material-icons">delete</span>
            </button>
          )}
        </div>
        
        <div className="note-form-field">
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder={t('notes.titlePlaceholder')}
            className="note-title-input"
          />
        </div>
        
        <div className="note-form-field">
          <label className="note-form-label">{t('categories.category')}:</label>
          <CategorySelector 
            value={formData.categoryId}
            onChange={handleCategoryChange}
          />
        </div>
        
        <div className="note-form-field">
          <label className="note-form-label">{t('tags.tags')}:</label>
          <TagsInput 
            value={formData.tags}
            onChange={handleTagsChange}
          />
        </div>
        
        <div className="note-form-field note-content-field">
          <RichTextEditor
            value={formData.content}
            onChange={handleContentChange}
            placeholder={t('notes.contentPlaceholder')}
            className="note-content-input"
            height="250px"
          />
        </div>
        
        {/* Mostrar información de referencia si existe */}
        {note && note.references && (
          <div className="note-references-info">
            <div className="note-reference-badge">
              <span className="material-icons">
                {note.references.type === 'event' ? 'event' : 'calendar_today'}
              </span>
              <span className="note-reference-text">
                {note.references.type === 'event' ? t('notes.linkedEvent') : t('notes.linkedDate')}
              </span>
            </div>
          </div>
        )}
        
        <div className="note-form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="note-cancel-button"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="note-save-button"
          >
            {t('common.save')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NoteEditor;