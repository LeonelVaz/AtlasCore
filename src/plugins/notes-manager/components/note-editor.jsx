import React, { useState, useContext, useEffect } from 'react';
import { NotesContext } from '../contexts/notes-context';
import RichTextEditor from './rich-text-editor';
import CategorySelector from './category-selector';
import TagsInput from './tags-input';
import DatePicker from './date-picker';
import EventSelector from './event-selector';

/**
 * Editor de notas mejorado
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.note - Nota a editar (o null para nueva nota)
 * @param {Function} props.onSave - Función al guardar
 * @param {Function} props.onCancel - Función al cancelar
 * @param {Function} props.onDelete - Función al eliminar
 */
const NoteEditor = ({ note, onSave, onCancel, onDelete }) => {
  const { t, getNotesByEvent } = useContext(NotesContext);
  
  // Estado para los campos del formulario
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: '#2D4B94',
    categoryId: null,
    tags: [],
    references: null
  });
  
  const [refType, setRefType] = useState('none'); // 'none', 'event', 'date'
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Cargar datos si estamos editando una nota existente
  useEffect(() => {
    if (note) {
      const initialData = {
        title: note.title || '',
        content: note.content || '',
        color: note.color || '#2D4B94',
        categoryId: note.categoryId || null,
        tags: note.tags || [],
        references: note.references || null
      };
      
      setFormData(initialData);
      
      // Determinar el tipo de referencia
      if (note.references) {
        setRefType(note.references.type || 'none');
      } else if (note.eventId) { // Para compatibilidad con versiones antiguas
        setRefType('event');
        setFormData(prev => ({
          ...prev,
          references: {
            type: 'event',
            id: note.eventId
          }
        }));
      } else {
        setRefType('none');
      }
    } else {
      // Valores por defecto para nueva nota
      setFormData({
        title: '',
        content: '',
        color: '#2D4B94',
        categoryId: null,
        tags: [],
        references: null
      });
      setRefType('none');
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
  
  // Manejar cambio en tipo de referencia
  const handleRefTypeChange = (e) => {
    const newRefType = e.target.value;
    setRefType(newRefType);
    
    // Limpiar referencia anterior
    setFormData(prev => ({
      ...prev,
      references: newRefType === 'none' ? null : { type: newRefType }
    }));
  };
  
  // Manejar cambio en la referencia a evento
  const handleEventChange = (eventId) => {
    setFormData(prev => ({
      ...prev,
      references: {
        type: 'event',
        id: eventId
      }
    }));
  };
  
  // Manejar cambio en la referencia a fecha
  const handleDateChange = (date) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        references: {
          type: 'date',
          id: date.toISOString()
        }
      }));
    }
  };
  
  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.title.trim()) {
      setError(t('errors.titleRequired'));
      return;
    }
    
    try {
      // Indicar que estamos guardando
      setIsSaving(true);
      
      // Limpiar error si todo está correcto
      setError('');
      
      // Llamar al callback de guardado
      await onSave(formData);
      
      // Resetear formulario
      setIsSaving(false);
    } catch (error) {
      console.error('Error al guardar nota:', error);
      setError(error.message || t('errors.saveFailed'));
      setIsSaving(false);
    }
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
              disabled={isSaving}
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
            disabled={isSaving}
            autoFocus
          />
        </div>
        
        <div className="note-form-field">
          <label className="note-form-label">{t('categories.category')}:</label>
          <CategorySelector 
            value={formData.categoryId}
            onChange={handleCategoryChange}
            disabled={isSaving}
          />
        </div>
        
        <div className="note-form-field">
          <label className="note-form-label">{t('tags.tags')}:</label>
          <TagsInput 
            value={formData.tags}
            onChange={handleTagsChange}
            disabled={isSaving}
          />
        </div>
        
        {/* Referencias a eventos o fechas */}
        <div className="note-form-field note-references-field">
          <label className="note-form-label">{t('notes.referenceType')}:</label>
          <div className="reference-type-selector">
            <select 
              value={refType} 
              onChange={handleRefTypeChange}
              className="reference-type-select"
              disabled={isSaving}
            >
              <option value="none">{t('notes.noReference')}</option>
              <option value="event">{t('notes.eventReference')}</option>
              <option value="date">{t('notes.dateReference')}</option>
            </select>
          </div>
          
          {refType === 'event' && (
            <div className="reference-selector">
              <EventSelector 
                value={formData.references?.id}
                onChange={handleEventChange}
                disabled={isSaving}
              />
            </div>
          )}
          
          {refType === 'date' && (
            <div className="reference-selector">
              <DatePicker 
                value={formData.references?.id ? new Date(formData.references.id) : null}
                onChange={handleDateChange}
                disabled={isSaving}
              />
            </div>
          )}
        </div>
        
        <div className="note-form-field note-content-field">
          <RichTextEditor
            value={formData.content}
            onChange={handleContentChange}
            placeholder={t('notes.contentPlaceholder')}
            className="note-content-input"
            height="250px"
            disabled={isSaving}
          />
        </div>
        
        <div className="note-form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="note-cancel-button"
            disabled={isSaving}
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="note-save-button"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="loading-spinner small"></span>
                {t('common.saving')}
              </>
            ) : (
              t('common.save')
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NoteEditor;