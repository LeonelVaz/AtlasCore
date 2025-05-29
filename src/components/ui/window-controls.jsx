import React, { useState, useEffect } from "react";

/**
 * Componente para los controles de ventana en Electron
 * Con detección de estado maximizado y enfoque
 */
const WindowControls = () => {
  // Verificar si electronAPI está disponible
  if (typeof window === "undefined" || !window.electronAPI) {
    return null; // No renderizar nada si no estamos en Electron
  }

  // Estados para maximización y enfoque
  const [isMaximized, setIsMaximized] = useState(false);
  const [isWindowFocused, setIsWindowFocused] = useState(true); // Asumimos enfocado por defecto

  // Efecto para detectar estado maximizado y enfoque
  useEffect(() => {
    // Consultar estados iniciales
    window.electronAPI.isMaximized().then(setIsMaximized);
    window.electronAPI.isFocused().then(setIsWindowFocused);

    // Suscribirse a cambios de maximización
    const unsubscribeMaximize = window.electronAPI.onMaximizeChange(
      (maximized) => {
        setIsMaximized(maximized);
      }
    );

    // Suscribirse a cambios de enfoque
    const unsubscribeFocus = window.electronAPI.onFocusChange((focused) => {
      setIsWindowFocused(focused);
    });

    return () => {
      unsubscribeMaximize && unsubscribeMaximize();
      unsubscribeFocus && unsubscribeFocus();
    };
  }, []);

  // Handlers para controles de ventana
  const handleMinimize = () => window.electronAPI.minimize();
  const handleMaximize = () => window.electronAPI.maximize();
  const handleClose = () => window.electronAPI.close();

  return (
    <div
      className={`window-controls ${
        isWindowFocused ? "window-focused" : "window-blurred"
      }`}
      data-testid="window-controls"
    >
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
