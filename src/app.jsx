// src/app.jsx (actualizado)
import React, { useState, useEffect } from 'react';
import CalendarMain from './components/calendar/calendar-main';
import SettingsPanel from './components/settings/settings-panel';
import Sidebar from './components/ui/sidebar/Sidebar';
import SidebarItem from './components/ui/sidebar/sidebar-item';
import WindowControls from './components/ui/window-controls';
import ThemeProvider from './contexts/theme-context';
import TimeScaleProvider from './contexts/time-scale-context';
import { isElectronEnv } from './utils/electron-detector';
import './styles/themes/index.css'; // Importación optimizada de temas


// Iconos para los elementos del sidebar usando Material Icons
const APP_SECTIONS = {
  CALENDAR: { id: 'calendar', label: 'Calendario', icon: 'calendar_today' },
  SETTINGS: { id: 'settings', label: 'Configuración', icon: 'settings' },
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
      <TimeScaleProvider>
        <div className="app-container">
          <header className={isElectron ? "app-header draggable" : "app-header"}>
            <div className="app-logo">
              <img src="/logo-white.png" alt="Atlas" height="40" />
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
      </TimeScaleProvider>
    </ThemeProvider>
  );
}

export default App;