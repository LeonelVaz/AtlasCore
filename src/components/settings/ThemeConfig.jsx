// src/components/settings/ThemeConfig.jsx
import React from 'react';
import useTheme from '../../hooks/use-theme';
import './theme-config.css';

/**
 * Componente para la configuración de temas
 */
const ThemeConfig = () => {
  const { currentTheme, availableThemes, changeTheme } = useTheme();
  
  const handleThemeChange = (themeId) => {
    changeTheme(themeId);
  };
  
  return (
    <div className="theme-config">
      <h3 className="theme-config-title">Tema de la Aplicación</h3>
      <p className="theme-config-description">
        Elige el tema que más te guste para personalizar la apariencia de la aplicación.
      </p>
      
      <div className="theme-options">
        {availableThemes.map(theme => (
          <div 
            key={theme.id}
            className={`theme-option ${currentTheme === theme.id ? 'selected' : ''}`}
            onClick={() => handleThemeChange(theme.id)}
          >
            <div className={`theme-preview theme-preview-${theme.id}`}>
              <div className="theme-preview-content"></div>
            </div>
            <div className="theme-option-info">
              <span className="theme-option-icon">{theme.icon}</span>
              <span className="theme-option-name">{theme.name}</span>
            </div>
            {currentTheme === theme.id && (
              <div className="theme-selected-indicator">
                <span className="checkmark">✓</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="theme-section">
        <h3 className="theme-section-title">Estilo de Encabezados de Días</h3>
        <p className="theme-section-description">
          Elige cómo se muestran los días en el calendario.
        </p>
        {/* Esta sección será implementada después */}
        <div className="theme-section-placeholder">
          Esta funcionalidad se implementará próximamente
        </div>
      </div>
      
      <div className="theme-section">
        <h3 className="theme-section-title">Visualización de Hora en Eventos</h3>
        <p className="theme-section-description">
          Configura cómo se muestra la hora dentro de los eventos del calendario.
        </p>
        {/* Esta sección será implementada después */}
        <div className="theme-section-placeholder">
          Esta funcionalidad se implementará próximamente
        </div>
      </div>
    </div>
  );
};

export default ThemeConfig;