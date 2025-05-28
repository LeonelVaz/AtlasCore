import React, { useState, useRef, useEffect } from "react";
import { SNAP_VALUES } from "../../core/config/constants";

function SnapControl({ snapValue, onSnapChange }) {
  const [showMenu, setShowMenu] = useState(false);
  const [customValue, setCustomValue] = useState(5);
  const menuRef = useRef(null);
  const containerRef = useRef(null);

  // Opciones predefinidas
  const snapOptions = [
    { label: "Desactivado", value: SNAP_VALUES.NONE },
    { label: "Básico (1h)", value: SNAP_VALUES.BASIC },
    { label: "Medio (30m)", value: SNAP_VALUES.MEDIUM },
    { label: "Preciso (15m)", value: SNAP_VALUES.PRECISE },
    { label: "Personalizado", value: "custom" },
  ];

  // Cerrar menú cuando se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  // Medir contenedor para ajustar menú
  useEffect(() => {
    if (containerRef.current && menuRef.current && showMenu) {
      const containerWidth = containerRef.current.offsetWidth;
      menuRef.current.style.minWidth = `${Math.max(containerWidth, 200)}px`;
    }
  }, [showMenu]);

  // Obtener etiqueta
  const getSnapLabel = () => {
    switch (snapValue) {
      case SNAP_VALUES.NONE:
        return "Off";
      case SNAP_VALUES.BASIC:
        return "1h";
      case SNAP_VALUES.MEDIUM:
        return "30m";
      case SNAP_VALUES.PRECISE:
        return "15m";
      default:
        return `${snapValue}m`;
    }
  };

  // Manejar selección de opción
  const handleOptionSelect = (value) => {
    if (value === "custom") return;
    onSnapChange(value);
    setShowMenu(false);
  };

  // Manejar cambio en valor personalizado
  const handleCustomValueChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    setCustomValue(Math.max(1, Math.min(60, value)));
  };

  // Aplicar valor personalizado
  const applyCustomValue = () => {
    onSnapChange(customValue);
    setShowMenu(false);
  };

  return (
    <div className="snap-control-container" ref={containerRef}>
      <button
        className={`snap-control-toggle ${snapValue > 0 ? "active" : ""}`}
        onClick={() =>
          onSnapChange(snapValue > 0 ? SNAP_VALUES.NONE : SNAP_VALUES.PRECISE)
        }
        title="Activar/Desactivar imán"
      >
        <span className="snap-icon">⌁</span>
      </button>

      <div
        className={`snap-value-indicator ${snapValue > 0 ? "active" : ""}`}
        onClick={() => setShowMenu(!showMenu)}
        title="Configurar precisión de imán"
      >
        {getSnapLabel()}
      </div>

      {showMenu && (
        <div
          ref={menuRef}
          className="snap-options-menu"
          data-testid="snap-menu"
        >
          {snapOptions.map((option) => (
            <div
              key={option.value}
              className={`snap-option ${
                snapValue === option.value ? "selected" : ""
              }`}
              onClick={() => handleOptionSelect(option.value)}
            >
              {option.label}
            </div>
          ))}

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
            <button className="snap-apply-custom" onClick={applyCustomValue}>
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SnapControl;
