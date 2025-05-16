import React, { useState, useRef, useEffect } from 'react';

/**
 * Selector de fecha para vincular notas con fechas específicas
 * @param {Object} props - Propiedades del componente
 * @param {Date} props.value - Fecha seleccionada
 * @param {Function} props.onChange - Función para manejar cambios
 * @param {boolean} props.disabled - Si el selector está deshabilitado
 */
const DatePicker = ({ value, onChange, disabled = false }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [inputDate, setInputDate] = useState('');
  const inputRef = useRef(null);

  // Actualizar fecha seleccionada cuando cambia el valor
  useEffect(() => {
    if (value instanceof Date && !isNaN(value.getTime())) {
      setSelectedDate(value);
      
      // Formatear para input date
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      setInputDate(`${year}-${month}-${day}`);
    } else {
      setSelectedDate(null);
      setInputDate('');
    }
  }, [value]);

  // Manejar cambios en el input
  const handleDateChange = (e) => {
    const newValue = e.target.value;
    setInputDate(newValue);
    
    if (newValue) {
      try {
        const date = new Date(newValue);
        if (!isNaN(date.getTime())) {
          setSelectedDate(date);
          if (onChange) {
            onChange(date);
          }
        }
      } catch (err) {
        console.error('Error al parsear fecha:', err);
      }
    } else {
      setSelectedDate(null);
      if (onChange) {
        onChange(null);
      }
    }
  };

  // Manejar selección de fecha actual
  const handleSelectToday = () => {
    if (disabled) return;
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    setInputDate(`${year}-${month}-${day}`);
    setSelectedDate(today);
    
    if (onChange) {
      onChange(today);
    }
  };

  // Formato para mostrar la fecha
  const formatDate = (date) => {
    if (!date) return '';
    
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="date-picker">
      <div className="date-input-container">
        <input
          ref={inputRef}
          type="date"
          value={inputDate}
          onChange={handleDateChange}
          className="date-input"
          disabled={disabled}
        />
        <button
          type="button"
          className="today-button"
          onClick={handleSelectToday}
          title="Seleccionar hoy"
          disabled={disabled}
        >
          <span className="material-icons">today</span>
        </button>
      </div>
      
      {selectedDate && (
        <div className="selected-date-display">
          {formatDate(selectedDate)}
        </div>
      )}
    </div>
  );
};

export default DatePicker;