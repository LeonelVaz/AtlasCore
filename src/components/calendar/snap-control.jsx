import React, { useState, useRef, useEffect } from 'react';
import { SNAP_VALUES } from '../../core/config/constants';

/**
 * Componente de control de imán (snap) para alineación automática de eventos
 * Versión modificada con menú más ancho
 */
function SnapControl({ snapValue, onSnapChange }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const containerRef = useRef(null);
  
  // Opciones predefinidas de snap usando constantes
  const snapOptions = [
    { label: 'Desactivado', value: SNAP_VALUES.NONE },
    { label: 'Básico (1h)', value: SNAP_VALUES.BASIC },
    { label: 'Medio (30m)', value: SNAP_VALUES.MEDIUM },
    { label: 'Preciso (15m)', value: SNAP_VALUES.PRECISE },
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
    if (snapValue === SNAP_VALUES.NONE) return 'Off';
    if (snapValue === SNAP_VALUES.BASIC) return '1h';
    if (snapValue === SNAP_VALUES.MEDIUM) return '30m';
    if (snapValue === SNAP_VALUES.PRECISE) return '15m';
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

  // Medimos el ancho del contenedor para ajustar el menú
  useEffect(() => {
    if (containerRef.current && menuRef.current && showMenu) {
      const containerWidth = containerRef.current.offsetWidth;
      // Asegurar que el menú sea al menos tan ancho como el contenedor
      menuRef.current.style.minWidth = `${Math.max(containerWidth, 200)}px`;
    }
  }, [showMenu]);
  
  return (
    <div className="snap-control-container" ref={containerRef}>
      <button 
        className={`snap-control-toggle ${snapValue > 0 ? 'active' : ''}`}
        onClick={() => onSnapChange(snapValue > 0 ? SNAP_VALUES.NONE : SNAP_VALUES.PRECISE)} // Modificado para usar PRECISE (15m) en lugar de BASIC
        title="Activar/Desactivar imán"
      >
        <span className="snap-icon">⌁</span>
      </button>
      
      <div 
        className={`snap-value-indicator ${snapValue > 0 ? 'active' : ''}`}
        onClick={() => setShowMenu(!showMenu)}
        title="Configurar precisión de imán"
      >
        {getSnapLabel()}
      </div>
      
      {showMenu && (
        <div ref={menuRef} className="snap-options-menu" data-testid="snap-menu">
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
        </div>
      )}
    </div>
  );
}

export default SnapControl;