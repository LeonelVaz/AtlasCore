import React from 'react';
import Dialog from '../ui/dialog';
import Button from '../ui/button';
import { PLUGIN_CONSTANTS } from '../../core/config/constants';
import ExtensionPoint from '../plugin-extension/extension-point';

function EventForm({ 
  event,
  error,
  isEditing,
  onSave,
  onChange,
  onDelete,
  onClose
}) {
  // Renderizar extensiones para el formulario de eventos
  const renderEventExtensions = () => {
    return (
      <ExtensionPoint
        zoneId={PLUGIN_CONSTANTS.UI_EXTENSION_ZONES.EVENT_FORM}
        render={(extensions) => (
          <div className="event-form-extensions">
            {extensions.map(extension => {
              const ExtComponent = extension.component;
              return (
                <div 
                  key={extension.id}
                  className="event-form-extension"
                  data-plugin-id={extension.pluginId}
                >
                  <ExtComponent
                    {...extension.props}
                    event={event}
                    isEditing={isEditing}
                    onChange={onChange}
                    pluginId={extension.pluginId}
                    extensionId={extension.id}
                  />
                </div>
              );
            })}
          </div>
        )}
        fallback={null}
      />
    );
  };

  // Renderizar extensiones para la vista detallada del evento
  const renderEventDetailExtensions = () => {
    return (
      <ExtensionPoint
        zoneId={PLUGIN_CONSTANTS.UI_EXTENSION_ZONES.EVENT_DETAIL_VIEW}
        render={(extensions) => (
          <div className="event-detail-extensions">
            {extensions.map(extension => {
              const ExtComponent = extension.component;
              return (
                <div 
                  key={extension.id}
                  className="event-detail-extension"
                  data-plugin-id={extension.pluginId}
                >
                  <ExtComponent
                    {...extension.props}
                    event={event}
                    isEditing={isEditing}
                    pluginId={extension.pluginId}
                    extensionId={extension.id}
                  />
                </div>
              );
            })}
          </div>
        )}
        fallback={null}
      />
    );
  };

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
      
      <div className="event-form-content active">
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

        {/* Extensiones para el formulario de eventos */}
        {renderEventExtensions()}
      </div>
      
      {/* Extensiones para la vista detallada del evento */}
      {renderEventDetailExtensions()}
      
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