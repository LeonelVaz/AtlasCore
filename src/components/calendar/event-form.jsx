// event-form.jsx
import React from 'react';

function EventForm({ 
  event,
  error,
  isEditing,
  onSave,
  onChange,
  onDelete,
  onClose
}) {
  return (
    <div className="event-form-overlay" data-testid="event-form-overlay">
      <div className="event-form">
        <h3>{isEditing ? 'Editar evento' : 'Nuevo evento'}</h3>
        
        {error && (
          <div className="form-error" style={{ color: 'red', marginBottom: '10px' }}>
            {error}
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="event-title">Título:</label>
          <input 
            id="event-title"
            type="text" 
            name="title" 
            value={event.title} 
            onChange={onChange} 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="event-start">Inicio:</label>
          <input 
            id="event-start"
            type="datetime-local" 
            name="start" 
            value={event.startFormatted} 
            onChange={onChange} 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="event-end">Fin:</label>
          <input 
            id="event-end"
            type="datetime-local" 
            name="end" 
            value={event.endFormatted} 
            onChange={onChange} 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="event-color">Color:</label>
          <input 
            id="event-color"
            type="color" 
            name="color" 
            value={event.color} 
            onChange={onChange} 
          />
        </div>
        
        <div className="form-actions">
          <button onClick={onSave}>Guardar</button>
          {isEditing && (
            <button onClick={onDelete} className="delete-button">
              Eliminar
            </button>
          )}
          <button onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventForm;