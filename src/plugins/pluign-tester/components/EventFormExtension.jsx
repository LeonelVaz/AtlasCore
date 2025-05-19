/**
 * Componente para el formulario de eventos
 */
import React, { useState } from 'react';

export function EventFormExtension(props) {
  const { plugin, event, onChange } = props;
  
  // Campo adicional para el formulario de eventos
  const [metadatos, setMetadatos] = useState(
    event && event.metadatos ? event.metadatos : ''
  );
  
  const handleChange = (e) => {
    setMetadatos(e.target.value);
    
    if (onChange) {
      onChange({
        target: {
          name: 'metadatos',
          value: e.target.value
        }
      });
    }
  };
  
  return (
    <div className="plugin-tester-event-form">
      <label htmlFor="event-metadata">Metadatos adicionales:</label>
      <input
        id="event-metadata"
        type="text"
        value={metadatos}
        onChange={handleChange}
        className="plugin-tester-input"
      />
    </div>
  );
}