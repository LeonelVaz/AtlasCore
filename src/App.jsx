import React, { useState, useEffect } from 'react';
import CalendarMain from './components/calendar/CalendarMain';
import { initEventBus } from './core/bus/EventBus';
import './styles/App.css';

// Inicializar el bus de eventos al cargar la aplicación
initEventBus();

function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Simular carga inicial de la aplicación
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Atlas</h1>
        <div className="app-controls">
          <button className="btn-today">Hoy</button>
        </div>
      </header>
      <main className="app-main">
        {appReady ? (
          <CalendarMain />
        ) : (
          <div className="loading-indicator">Cargando...</div>
        )}
      </main>
    </div>
  );
}

export default App;