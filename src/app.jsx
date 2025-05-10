import React from 'react';
import CalendarMain from './components/calendar/calendar-main';

/**
 * Componente principal de la aplicación Atlas
 */
function App() {
  // Verificar si estamos en Electron
  const isElectron = window.electronAPI !== undefined;
  
  // Funciones para controlar la ventana
  const handleMinimize = () => {
    if (isElectron) window.electronAPI.minimize();
  };
  
  const handleMaximize = () => {
    if (isElectron) window.electronAPI.maximize();
  };
  
  const handleClose = () => {
    if (isElectron) window.electronAPI.close();
  };

  return (
    <div className="app-container">
      <header className={isElectron ? "app-header draggable" : "app-header"}>
        <div className="app-logo">
          <h1>Atlas</h1>
        </div>
        
        {isElectron && (
          <div className="window-controls">
            <button onClick={handleMinimize} className="window-button min-button">
              <span>&#8722;</span>
            </button>
            <button onClick={handleMaximize} className="window-button max-button">
              <span>&#9744;</span>
            </button>
            <button onClick={handleClose} className="window-button close-button">
              <span>&#10005;</span>
            </button>
          </div>
        )}
      </header>
      
      <main className="app-content">
        <CalendarMain />
      </main>
    </div>
  );
}

export default App;