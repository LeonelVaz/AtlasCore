import React from 'react';

/**
 * Componente para los controles de ventana en Electron
 * Con íconos totalmente consistentes
 */
const WindowControls = () => {
  // Verificar si estamos en Electron
  const isElectron = window.electronAPI !== undefined;
  
  // No renderizar nada si no estamos en Electron
  if (!isElectron) return null;
  
  // Handlers para controles de ventana
  const handleMinimize = () => window.electronAPI.minimize();
  const handleMaximize = () => window.electronAPI.maximize();
  const handleClose = () => window.electronAPI.close();

  // Uso de divs simples en lugar de SVGs para garantizar consistencia total
  return (
    <div className="window-controls">
      {/* Botón Minimizar */}
      <button 
        onClick={handleMinimize} 
        className="window-button min-button"
        aria-label="Minimizar"
      >
        <div className="window-icon min-icon"></div>
      </button>
      
      {/* Botón Maximizar */}
      <button 
        onClick={handleMaximize} 
        className="window-button max-button"
        aria-label="Maximizar"
      >
        <div className="window-icon max-icon"></div>
      </button>
      
      {/* Botón Cerrar */}
      <button 
        onClick={handleClose} 
        className="window-button close-button"
        aria-label="Cerrar"
      >
        <div className="window-icon close-icon"></div>
      </button>
    </div>
  );
};

export default WindowControls;