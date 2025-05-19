/**
 * Componente para el panel de configuración
 */
import React, { useState } from 'react';

export function SettingsPanel(props) {
  const { plugin } = props;
  
  const [config, setConfig] = useState({...plugin._data.configuracion});
  
  const handleColorChange = (e) => {
    const newConfig = {
      ...config,
      colorTema: e.target.value
    };
    
    setConfig(newConfig);
    plugin._data.configuracion = newConfig;
    plugin._core.storage.setItem(plugin.id, 'plugin-data', plugin._data);
  };
  
  const handleCheckboxChange = (e) => {
    const newConfig = {
      ...config,
      mostrarNotificaciones: e.target.checked
    };
    
    setConfig(newConfig);
    plugin._data.configuracion = newConfig;
    plugin._core.storage.setItem(plugin.id, 'plugin-data', plugin._data);
  };
  
  const handleIntervalChange = (e) => {
    const newConfig = {
      ...config,
      intervaloActualizacion: parseInt(e.target.value, 10) || 30
    };
    
    setConfig(newConfig);
    plugin._data.configuracion = newConfig;
    plugin._core.storage.setItem(plugin.id, 'plugin-data', plugin._data);
    
    // Reiniciar temporizador con el nuevo intervalo
    if (plugin._timerId) {
      clearInterval(plugin._timerId);
      plugin._timerId = null;
    }
    plugin._configurarActualizacionPeriodica();
  };
  
  const resetSettings = () => {
    const defaultConfig = {
      colorTema: '#3498db',
      mostrarNotificaciones: true,
      intervaloActualizacion: 30
    };
    
    setConfig(defaultConfig);
    plugin._data.configuracion = defaultConfig;
    plugin._core.storage.setItem(plugin.id, 'plugin-data', plugin._data);
    
    // Reiniciar temporizador
    if (plugin._timerId) {
      clearInterval(plugin._timerId);
      plugin._timerId = null;
    }
    plugin._configurarActualizacionPeriodica();
  };
  
  return (
    <div className="plugin-tester-settings">
      <h3>Configuración de Plugin Tester</h3>
      
      {/* Color del tema */}
      <div className="plugin-tester-settings-group">
        <label htmlFor="theme-color">Color del tema:</label>
        <input
          id="theme-color"
          type="color"
          value={config.colorTema}
          onChange={handleColorChange}
          className="plugin-tester-color-input"
        />
      </div>
      
      {/* Mostrar notificaciones */}
      <div className="plugin-tester-settings-group">
        <label htmlFor="show-notifications">Mostrar notificaciones:</label>
        <input
          id="show-notifications"
          type="checkbox"
          checked={config.mostrarNotificaciones}
          onChange={handleCheckboxChange}
          className="plugin-tester-checkbox"
        />
      </div>
      
      {/* Intervalo de actualización */}
      <div className="plugin-tester-settings-group">
        <label htmlFor="update-interval">Intervalo de actualización (segundos):</label>
        <input
          id="update-interval"
          type="number"
          min="5"
          max="300"
          value={config.intervaloActualizacion}
          onChange={handleIntervalChange}
          className="plugin-tester-number-input"
        />
      </div>
      
      {/* Botón de restablecer configuración */}
      <button
        className="plugin-tester-button plugin-tester-button-red"
        onClick={resetSettings}
      >
        Restablecer valores predeterminados
      </button>
    </div>
  );
}