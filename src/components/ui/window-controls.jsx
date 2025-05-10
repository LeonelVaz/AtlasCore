import React, { useState, useEffect } from 'react';

/**
 * Componente para los controles de ventana en Electron
 * Con detección de estado maximizado y dos íconos diferentes
 */
const WindowControls = () => {
  // Verificar si estamos en Electron
  const isElectron = window.electronAPI !== undefined;
  const [isMaximized, setIsMaximized] = useState(false);
  
  // No renderizar nada si no estamos en Electron
  if (!isElectron) return null;
  
  // Efecto para detectar estado maximizado
  useEffect(() => {
    if (!isElectron) return;
    
    // Consultar estado inicial
    window.electronAPI.isMaximized().then(setIsMaximized);
    
    // Suscribirse a cambios
    const unsubscribe = window.electronAPI.onMaximizeChange((maximized) => {
      setIsMaximized(maximized);
    });
    
    return unsubscribe;
  }, []);
  
  // Handlers para controles de ventana
  const handleMinimize = () => window.electronAPI.minimize();
  const handleMaximize = () => window.electronAPI.maximize();
  const handleClose = () => window.electronAPI.close();

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
      
      {/* Botón Maximizar/Restaurar */}
      <button 
        onClick={handleMaximize} 
        className="window-button max-button"
        aria-label={isMaximized ? "Restaurar" : "Maximizar"}
      >
        {isMaximized ? (
          <div className="window-icon restore-icon"></div>
        ) : (
          <div className="window-icon max-icon"></div>
        )}
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