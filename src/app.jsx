import React, { useState } from 'react';
import CalendarMain from './components/calendar/calendar-main';
import SettingsPanel from './components/settings/settings-panel';
import Sidebar from './components/ui/sidebar/Sidebar';
import SidebarItem from './components/ui/sidebar/sidebar-item';
import WindowControls from './components/ui/window-controls';
import ConfigProvider from './contexts/config-provider';
import { isElectronEnv } from './utils/electron-detector';
import './styles/themes/index.css';

// Iconos para los elementos del sidebar
const APP_SECTIONS = {
  CALENDAR: { id: 'calendar', label: 'Calendario', icon: 'calendar_today' },
  SETTINGS: { id: 'settings', label: 'Configuración', icon: 'settings' },
};

/**
 * Componente principal de la aplicación
 */
function App() {
  const isElectron = isElectronEnv();
  const [activeSection, setActiveSection] = useState(APP_SECTIONS.CALENDAR.id);
  
  const sidebarSections = [
    APP_SECTIONS.CALENDAR,
    APP_SECTIONS.SETTINGS
  ];
  
  // Renderizar contenido según sección activa
  const renderContent = () => {
    switch (activeSection) {
      case APP_SECTIONS.SETTINGS.id:
        return <SettingsPanel />;
      case APP_SECTIONS.CALENDAR.id:
      default:
        return <CalendarMain />;
    }
  };

  return (
    <ConfigProvider>
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
                onClick={() => setActiveSection(section.id)}
              />
            ))}
          </Sidebar>
          
          <main className="app-content">
            {renderContent()}
          </main>
        </div>
      </div>
    </ConfigProvider>
  );
}

export default App;