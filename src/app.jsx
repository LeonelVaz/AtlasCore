// app.jsx

import React from 'react';
import CalendarMain from './components/calendar/calendar-main';
import WindowControls from './components/ui/window-controls';
import { isElectronEnv } from './utils/electron-detector';

/**
 * Componente principal de la aplicación Atlas
 * Contiene el header básico y el componente principal del calendario
 */
function App() {
  // Verificar si estamos en Electron
  const isElectron = isElectronEnv();

  return (
    <div className="app-container">
      <header className={isElectron ? "app-header draggable" : "app-header"}>
        <div className="app-logo">
          <h1>Atlas</h1>
        </div>
        
        {isElectron && <WindowControls />}
      </header>
      
      <main className="app-content">
        <CalendarMain />
      </main>
    </div>
  );
}

export default App;