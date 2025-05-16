import React, { useState, useEffect } from 'react';

const NoteEditor = ({ note, onSave, onCancel, onDelete }) => {
  // Estado para los campos del formulario
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: '#2D4B94'
  });
  
  const [error, setError] = useState('');
  
  // Cargar datos si estamos editando una nota existente
  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title || '',
        content: note.content || '',
        color: note.color || '#2D4B94'
      });
    } else {
      // Valores por defecto para nueva nota
      setFormData({
        title: '',
        content: '',
        color: '#2D4B94'
      });
    }
  }, [note]);
  
  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Manejar envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.title.trim()) {
      setError('El título es obligatorio');
      return;
    }
    
    // Limpiar error si todo está correcto
    setError('');
    
    // Llamar al callback de guardado
    onSave({
      ...formData,
      eventId: note?.eventId // Mantener la relación con el evento si existe
    });
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
            <label htmlFor="note-color">Color:</label>
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
              title="Eliminar nota"
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
            placeholder="Título de la nota"
            className="note-title-input"
          />
        </div>
        
        <div className="note-form-field">
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Escribe tu nota aquí..."
            className="note-content-input"
            rows={10}
          />
        </div>
        
        <div className="note-form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="note-cancel-button"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="note-save-button"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
};

export default NoteEditor;