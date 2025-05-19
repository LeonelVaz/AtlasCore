import React, { useState, useEffect } from 'react';
import CalendarMain from './components/calendar/calendar-main';
import SettingsPanel from './components/settings/settings-panel';
import Sidebar from './components/ui/sidebar/Sidebar';
import SidebarItem from './components/ui/sidebar/sidebar-item';
import WindowControls from './components/ui/window-controls';
import ConfigProvider from './contexts/config-provider';
import { isElectronEnv } from './utils/electron-detector';
import pluginManager from './core/plugins/plugin-manager';
import PluginPages from './components/plugin-extension/plugin-pages'; // Importar el nuevo componente

// Iconos para los elementos del sidebar
const APP_SECTIONS = {
  CALENDAR: { id: 'calendar', label: 'Calendario', icon: 'calendar_today' },
  SETTINGS: { id: 'settings', label: 'Configuración', icon: 'settings' },
  PLUGIN: { id: 'plugin', label: 'Plugin', icon: 'extension' }, // Nueva sección para plugins
};

/**
 * Componente principal de la aplicación
 */
function App() {
  const isElectron = isElectronEnv();
  const [activeSection, setActiveSection] = useState(APP_SECTIONS.CALENDAR.id);
  const [currentPluginPage, setCurrentPluginPage] = useState(null); // Estado para la página actual del plugin
  
  // Inicializar sistema de plugins
  useEffect(() => {
    const initPluginSystem = async () => {
      try {
        // Inicializar con servicios que se proporcionarán a los plugins
        const services = {
          // Aquí se pasarán servicios internos en fase 2+
        };
        
        // Inicializar el sistema de plugins - sin dependencias a plugins específicos
        await pluginManager.initialize(services);
        console.log('Sistema de plugins inicializado');
      } catch (error) {
        console.error('Error al inicializar sistema de plugins:', error);
      }
    };
    
    initPluginSystem();
  }, []);
  
  // Función para navegar a una página de plugin
  const handleNavigateToPluginPage = (pluginId, pageId) => {
    setActiveSection(APP_SECTIONS.PLUGIN.id);
    setCurrentPluginPage({ pluginId, pageId });
  };
  
  // Secciones fijas de la barra lateral
  const sidebarSections = [
    APP_SECTIONS.CALENDAR,
    APP_SECTIONS.SETTINGS
  ];
  
  // Renderizar contenido según sección activa
  const renderContent = () => {
    // Secciones principales de la aplicación
    switch (activeSection) {
      case APP_SECTIONS.SETTINGS.id:
        return <SettingsPanel />;
      case APP_SECTIONS.CALENDAR.id:
        return <CalendarMain />;
      case APP_SECTIONS.PLUGIN.id:
        if (currentPluginPage) {
          return <PluginPages currentPluginPage={currentPluginPage} />;
        }
        return <div className="plugin-error">No se ha seleccionado ninguna página de plugin.</div>;
      default:
        // Fallback por defecto
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
          <Sidebar onPluginNavigate={handleNavigateToPluginPage}>
            {/* Secciones estándar */}
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