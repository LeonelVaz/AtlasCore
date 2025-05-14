// src/components/settings/time-slot-editor.jsx
import React, { useState, useEffect } from 'react';
import useTimeGrid from '../../hooks/use-time-grid';

/**
 * Componente para editar franjas horarias
 */
const TimeSlotEditor = () => {
  const {
    customSlots,
    addCustomTimeSlot,
    removeCustomTimeSlot,
    isLoading
  } = useTimeGrid(0, 24);

  const [showForm, setShowForm] = useState(false);
  const [formValues, setFormValues] = useState({
    hour: 9,
    minutes: 30
  });

  // Generar opciones para select de horas
  const hourOptions = [];
  for (let i = 0; i < 24; i++) {
    hourOptions.push(i);
  }

  // Generar opciones para select de minutos
  const minuteOptions = [15, 30, 45];

  // Manejar cambios en el formulario
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: parseInt(value, 10)
    }));
  };

  // Manejar envío del formulario
  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    const { hour, minutes } = formValues;
    const success = addCustomTimeSlot(hour, minutes);
    
    if (success) {
      setShowForm(false);
      setFormValues({
        hour: 9,
        minutes: 30
      });
    }
  };

  // Cancelar formulario
  const handleCancelForm = () => {
    setShowForm(false);
  };

  // Función para manejar la eliminación de una franja
  const handleRemoveSlot = (hour, minutes) => {
    removeCustomTimeSlot(hour, minutes);
  };

  // Verificar si existen franjas personalizadas
  const hasCustomSlots = Object.keys(customSlots).length > 0;
  
  // Ordenar las horas para visualización
  const sortedHours = Object.keys(customSlots)
    .map(hour => parseInt(hour, 10))
    .sort((a, b) => a - b);

  if (isLoading) {
    return <div className="loading-indicator">Cargando franjas horarias...</div>;
  }

  return (
    <div className="time-slot-editor">
      <h3 className="settings-section-title">Franjas Horarias Personalizadas</h3>
      <p className="settings-section-description">
        Las franjas horarias personalizadas te permiten dividir las horas estándar 
        en intervalos más pequeños para una planificación más precisa.
      </p>

      {/* Visualizador de franjas personalizadas */}
      {hasCustomSlots ? (
        <div className="custom-time-viewer">
          <div className="custom-time-viewer-header">
            Franjas Horarias Activas
          </div>
          <div className="custom-time-scales">
            <div className="custom-time-hour">
              {sortedHours.map(hour => (
                <div key={`hour-${hour}`} className="custom-time-hour-label">
                  {hour}:00
                </div>
              ))}
            </div>
            <div className="custom-time-slots">
              {sortedHours.map(hour => {
                // Obtener todas las franjas de esta hora, incluida la estándar
                const hourSlots = [
                  // Agregar implícitamente la franja estándar
                  { hour, minutes: 0, type: 'standard' },
                  // Agregar las franjas personalizadas
                  ...(customSlots[hour] || []).map(slot => ({
                    hour,
                    minutes: slot.minutes,
                    type: slot.minutes === 30 ? 'medium' : 'short'
                  }))
                ];
                
                // Ordenar por minutos
                hourSlots.sort((a, b) => a.minutes - b.minutes);
                
                return hourSlots.map(slot => (
                  <div 
                    key={`slot-${hour}-${slot.minutes}`} 
                    className={`custom-time-slot custom-time-slot-${slot.type}`}
                  >
                    <span>{`${hour}:${slot.minutes.toString().padStart(2, '0')}`}</span>
                    {slot.minutes > 0 && (
                      <div className="custom-time-slot-actions">
                        <button
                          onClick={() => handleRemoveSlot(hour, slot.minutes)}
                          title="Eliminar franja"
                        >
                          <span className="material-icons">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                ));
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="custom-time-empty">
          <p>No hay franjas horarias personalizadas. Añade tu primera franja para comenzar.</p>
        </div>
      )}

      {/* Botón para mostrar el formulario */}
      {!showForm && (
        <button 
          className="add-custom-slot-button"
          onClick={() => setShowForm(true)}
        >
          <span className="material-icons">add</span>
          Agregar Franja Horaria
        </button>
      )}

      {/* Formulario para añadir una franja */}
      {showForm && (
        <div className="custom-slot-form">
          <form onSubmit={handleFormSubmit}>
            <div className="custom-slot-form-row">
              <div className="custom-slot-form-field">
                <label htmlFor="slot-hour">Hora</label>
                <select 
                  id="slot-hour"
                  name="hour"
                  value={formValues.hour}
                  onChange={handleFormChange}
                >
                  {hourOptions.map(hour => (
                    <option key={`hour-option-${hour}`} value={hour}>
                      {hour}:00
                    </option>
                  ))}
                </select>
              </div>
              <div className="custom-slot-form-field">
                <label htmlFor="slot-minutes">Minutos</label>
                <select 
                  id="slot-minutes"
                  name="minutes"
                  value={formValues.minutes}
                  onChange={handleFormChange}
                >
                  {minuteOptions.map(minutes => (
                    <option key={`minutes-option-${minutes}`} value={minutes}>
                      {minutes}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="custom-slot-form-actions">
              <button 
                type="button" 
                className="cancel-button"
                onClick={handleCancelForm}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="save-button"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="time-slot-guide">
        <h4>Sobre las franjas horarias</h4>
        <ul>
          <li>Puedes crear franjas de 15, 30 o 45 minutos.</li>
          <li>También puedes agregar franjas intermedias directamente en el calendario haciendo clic en el botón "+" que aparece entre dos franjas.</li>
          <li>La franja más pequeña permitida es de 15 minutos.</li>
          <li>Las franjas personalizadas aparecerán en el calendario con un sombreado distinto para diferenciarlas.</li>
        </ul>
      </div>
    </div>
  );
};

export default TimeSlotEditor;