// event-form.jsx (refactorizado)
import React from 'react';
import Dialog from '../ui/dialog';
import Button from '../ui/button';

function EventForm({ 
  event,
  error,
  isEditing,
  onSave,
  onChange,
  onDelete,
  onClose
}) {
  const handleConfirm = () => {
    onSave();
  };
  
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title={isEditing ? 'Editar evento' : 'Nuevo evento'}
      confirmText="Guardar"
      onConfirm={handleConfirm}
    >
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
      
      {isEditing && (
        <div className="form-actions">
          <Button 
            variant="danger" 
            onClick={onDelete}
          >
            Eliminar
          </Button>
        </div>
      )}
    </Dialog>
  );
}

export default EventForm;