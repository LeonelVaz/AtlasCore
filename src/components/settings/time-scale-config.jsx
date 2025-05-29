// src/components/settings/time-scale-config.jsx
import React, { useState } from "react";
import useTimeScale from "../../hooks/use-time-scale";

/**
 * Componente para la configuración de escalas de tiempo
 */
const TimeScaleConfig = () => {
  const {
    currentTimeScale,
    availableTimeScales,
    changeTimeScale,
    createCustomTimeScale,
  } = useTimeScale();
  const [customHeight, setCustomHeight] = useState(60);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleTimeScaleChange = (timeScaleId) => {
    if (timeScaleId === "custom") {
      setShowCustomInput(true);
    } else {
      changeTimeScale(timeScaleId);
      setShowCustomInput(false);
    }
  };

  const handleCustomHeightChange = (e) => {
    const value = parseInt(e.target.value) || 60;
    setCustomHeight(Math.max(20, Math.min(200, value)));
  };

  const handleCustomHeightSubmit = (e) => {
    e.preventDefault();
    createCustomTimeScale(customHeight);
    setShowCustomInput(false);
  };

  return (
    <div className="time-scale-config">
      <h3 className="time-scale-config-title">Escala de Tiempo</h3>
      <p className="time-scale-config-description">
        Configura la densidad visual de la rejilla temporal para mostrar más o
        menos información.
      </p>

      <div className="time-scale-preview">
        <div className="time-scale-hours">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="time-scale-hour"
              style={{ height: `${currentTimeScale.height}px` }}
            >
              <div className="time-scale-hour-label">{`${8 + i}:00`}</div>
            </div>
          ))}
        </div>
        <div className="time-scale-events">
          <div
            className="time-scale-event"
            style={{
              height: `${currentTimeScale.height * 1.5}px`,
              top: `${currentTimeScale.height * 0.5}px`,
            }}
          >
            Evento de ejemplo
          </div>
          <div
            className="time-scale-event time-scale-event-alt"
            style={{
              height: `${currentTimeScale.height}px`,
              top: `${currentTimeScale.height * 2.5}px`,
            }}
          >
            Otro evento
          </div>
        </div>
      </div>

      <div className="time-scale-options">
        <h4>Densidad</h4>
        <div className="time-scale-options-grid">
          {availableTimeScales.map((scale) => (
            <div
              key={scale.id}
              className={`time-scale-option ${
                currentTimeScale.id === scale.id ? "selected" : ""
              }`}
              onClick={() => handleTimeScaleChange(scale.id)}
            >
              <div
                className="time-scale-option-preview"
                style={{ height: `${scale.height * 0.5}px` }}
              >
                <div className="time-scale-option-line"></div>
                <div className="time-scale-option-line"></div>
                <div className="time-scale-option-line"></div>
              </div>
              <div className="time-scale-option-name">{scale.name}</div>
              <div className="time-scale-option-size">{`${scale.height}px/hora`}</div>
            </div>
          ))}
          <div
            className={`time-scale-option ${
              currentTimeScale.id === "custom" ? "selected" : ""
            }`}
            onClick={() => handleTimeScaleChange("custom")}
          >
            <div className="time-scale-option-preview">
              <div className="time-scale-option-custom-icon">
                <span className="material-icons">add_circle_outline</span>
              </div>
            </div>
            <div className="time-scale-option-name">Personalizada</div>
          </div>
        </div>

        {showCustomInput && (
          <div className="time-scale-custom-form">
            <form onSubmit={handleCustomHeightSubmit}>
              <div className="time-scale-custom-input">
                <label htmlFor="custom-height">
                  Altura (en píxeles por hora):
                </label>
                <input
                  id="custom-height"
                  type="number"
                  min="20"
                  max="200"
                  value={customHeight}
                  onChange={handleCustomHeightChange}
                />
              </div>

              <div className="time-scale-custom-buttons">
                <button type="submit" className="time-scale-custom-apply">
                  Aplicar
                </button>
                <button
                  type="button"
                  className="time-scale-custom-cancel"
                  onClick={() => setShowCustomInput(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="time-scale-info">
        <h4>Información</h4>
        <p>
          La escala de tiempo determina cuánto espacio vertical ocupa cada hora
          en el calendario. Una escala más compacta permite ver más horas a la
          vez, mientras que una escala más espaciosa proporciona más detalle y
          facilita la interacción con los eventos.
        </p>
      </div>
    </div>
  );
};

export default TimeScaleConfig;
