import React from 'react';
import CalendarMain from './components/calendar/calendar-main';

/**
 * Componente principal de la aplicación Atlas
 * Contiene el header básico y el componente principal del calendario
 */
function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-logo">
          <h1>Atlas</h1>
        </div>
        <div className="app-header-controls">
          {/* Controles básicos - Se expandirán en futuras versiones */}
        </div>
      </header>
      
      <main className="app-content">
        <CalendarMain />
      </main>
    </div>
  );
}

export default App;