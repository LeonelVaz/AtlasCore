// src/app.jsx (modificado)
import React, { useState, useEffect } from 'react';
import CalendarMain from './components/calendar/calendar-main';
import SettingsPanel from './components/settings/SettingsPanel';
import Sidebar from './components/ui/sidebar/Sidebar';
import SidebarItem from './components/ui/sidebar/SidebarItem';
import WindowControls from './components/ui/window-controls';
import ThemeProvider from './contexts/theme-context';
import { isElectronEnv } from './utils/electron-detector';
import './styles/themes/light.css';
import './styles/themes/dark.css';
import './styles/themes/atlas-dark-blue.css';
import './styles/themes/purple-night.css';

// Íconos para los elementos del sidebar (usando caracteres emoji por simplicidad)
const APP_SECTIONS = {
  CALENDAR: { id: 'calendar', label: 'Calendario', icon: '📅' },
  SETTINGS: { id: 'settings', label: 'Configuración', icon: '⚙️' },
};

/**
 * Componente principal de la aplicación Atlas
 * Contiene el layout principal y la navegación entre secciones
 */
function App() {
  // Verificar si estamos en Electron
  const isElectron = isElectronEnv();
  
  // Estado para la sección activa
  const [activeSection, setActiveSection] = useState(APP_SECTIONS.CALENDAR.id);
  
  // Lista de secciones para el sidebar
  const sidebarSections = [
    APP_SECTIONS.CALENDAR,
    APP_SECTIONS.SETTINGS
  ];
  
  // Cambiar sección activa
  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
  };
  
  // Renderizar el contenido según la sección activa
  const renderContent = () => {
    switch (activeSection) {
      case APP_SECTIONS.CALENDAR.id:
        return <CalendarMain />;
      case APP_SECTIONS.SETTINGS.id:
        return <SettingsPanel />;
      default:
        return <CalendarMain />;
    }
  };

  return (
    <ThemeProvider>
      <div className="app-container">
        <header className={isElectron ? "app-header draggable" : "app-header"}>
          <div className="app-logo">
            <h1>Atlas</h1>
          </div>
          
          {isElectron && <WindowControls />}
        </header>
        
        <div className="app-main">
          <Sidebar>
            {sidebarSections.map(section => (
              <SidebarItem
                key={section.id}
                icon={section.icon}
                label={section.label}
                active={activeSection === section.id}
                onClick={() => handleSectionChange(section.id)}
              />
            ))}
          </Sidebar>
          
          <main className="app-content">
            {renderContent()}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
