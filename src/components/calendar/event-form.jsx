// src/components/calendar/event-form.jsx

import React, { useState } from 'react';
import Dialog from '../ui/dialog';
import Button from '../ui/button';

function EventForm({ 
  event,
  error,
  isEditing,
  onSave,
  onChange,
  onDelete,
  onClose,
  children // Añadimos soporte para children para los puntos de extensión
}) {
  // Estado para manejar la pestaña activa (para plugins)
  const [activeTab, setActiveTab] = useState('main');
  
  // Verificar si hay componentes de extensión
  const hasExtensions = React.Children.count(children) > 0;
  
  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title={isEditing ? 'Editar evento' : 'Nuevo evento'}
      confirmText="Guardar"
      onConfirm={onSave}
    >
      {error && (
        <div className="form-error" style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}
      
      {/* Pestañas si hay extensiones */}
      {hasExtensions && (
        <div className="event-form-tabs">
          <button 
            className={`event-form-tab ${activeTab === 'main' ? 'active' : ''}`}
            onClick={() => setActiveTab('main')}
          >
            Principal
          </button>
          <button 
            className={`event-form-tab ${activeTab === 'extensions' ? 'active' : ''}`}
            onClick={() => setActiveTab('extensions')}
          >
            Adicional
          </button>
        </div>
      )}
      
      {/* Contenido principal del formulario */}
      <div className={`event-form-content ${activeTab === 'main' ? 'active' : ''}`}>
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
            value={event.color || '#2d4b94'} 
            onChange={onChange} 
          />
        </div>
      </div>
      
      {/* Contenido de extensiones */}
      {hasExtensions && (
        <div className={`event-form-content ${activeTab === 'extensions' ? 'active' : ''}`}>
          <div className="event-form-extensions">
            {children}
          </div>
        </div>
      )}
      
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