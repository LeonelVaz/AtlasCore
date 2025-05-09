import React, { useState, useRef, useEffect } from 'react';

/**
 * Componente de control de imán (snap) para alineación automática de eventos
 */
function SnapControl({ snapValue, onSnapChange }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  
  // Opciones predefinidas de snap
  const snapOptions = [
    { label: 'Desactivado', value: 0 },
    { label: 'Básico (1h)', value: 60 },
    { label: 'Medio (30m)', value: 30 },
    { label: 'Preciso (15m)', value: 15 },
    { label: 'Personalizado', value: 'custom' }
  ];
  
  // Estado para valor personalizado
  const [customValue, setCustomValue] = useState(5);
  
  // Cerrar menú cuando se hace clic fuera
  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setShowMenu(false);
    }
  };
  
  useEffect(() => {
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);
  
  // Obtener etiqueta para mostrar
  const getSnapLabel = () => {
    if (snapValue === 0) return 'Off';
    if (snapValue === 60) return '1h';
    if (snapValue === 30) return '30m';
    if (snapValue === 15) return '15m';
    return `${snapValue}m`;
  };
  
  // Manejar selección de opción
  const handleOptionSelect = (value) => {
    if (value === 'custom') {
      // Si es personalizado, no cerrar el menú
      // y mostrar el input para valor personalizado
    } else {
      onSnapChange(value);
      setShowMenu(false);
    }
  };
  
  // Manejar cambio en valor personalizado
  const handleCustomValueChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    setCustomValue(Math.max(1, Math.min(60, value))); // Limitar entre 1 y 60 minutos
  };
  
  // Aplicar valor personalizado
  const applyCustomValue = () => {
    onSnapChange(customValue);
    setShowMenu(false);
  };
  
  return (
    <div className="snap-control-container">
      <button 
        className={`snap-control-toggle ${snapValue > 0 ? 'active' : ''}`}
        onClick={() => onSnapChange(snapValue > 0 ? 0 : 60)} // Toggle entre desactivado y básico (1h)
        title="Activar/Desactivar imán"
      >
        <span className="snap-icon">⌁</span>
      </button>
      
      <div 
        className="snap-value-indicator"
        onClick={() => setShowMenu(!showMenu)}
        title="Configurar precisión de imán"
      >
        {getSnapLabel()}
      </div>
      
      {showMenu && (
        <div ref={menuRef} className="snap-options-menu">
          {snapOptions.map((option) => (
            <div 
              key={option.value}
              className={`snap-option ${snapValue === option.value ? 'selected' : ''}`}
              onClick={() => handleOptionSelect(option.value)}
            >
              {option.label}
            </div>
          ))}
          
          {/* Sección para valor personalizado */}
          {snapOptions.find(option => option.value === 'custom') && (
            <div className="snap-custom-section">
              <div className="snap-custom-input">
                <input 
                  type="number" 
                  min="1" 
                  max="60" 
                  value={customValue}
                  onChange={handleCustomValueChange}
                />
                <span>minutos</span>
              </div>
              <button 
                className="snap-apply-custom"
                onClick={applyCustomValue}
              >
                Aplicar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SnapControl;