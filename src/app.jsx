import React, { useState, useEffect } from 'react';
import CalendarMain from './components/calendar/calendar-main';
import SettingsPanel from './components/settings/settings-panel';
import Sidebar from './components/ui/sidebar/Sidebar';
import SidebarItem from './components/ui/sidebar/sidebar-item';
import WindowControls from './components/ui/window-controls';
import ConfigProvider from './contexts/config-provider';
import { isElectronEnv } from './utils/electron-detector';
import { initializePlugins, createPluginCore } from './plugins';
import eventBus from './core/bus/event-bus';
import storageService from './services/storage-service';
import { registerModule, getModule } from './core/module/module-registry';
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
  const [pluginsInitialized, setPluginsInitialized] = useState(false);
  
  // Inicializar sistema de plugins
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Iniciando sistema de plugins...');
        
        // Crear objeto core con APIs para plugins
        const pluginCore = createPluginCore({
          events: eventBus,
          storage: storageService,
          getModule,
          registerModule
        });
        
        // Inicializar el sistema de plugins
        await initializePlugins(pluginCore);
        
        // Si está disponible un API para cargar plugins (solo en Electron)
        if (window.electronAPI?.plugins?.loadPlugins) {
          try {
            // Este método sería proporcionado por Electron para cargar plugins desde el sistema de archivos
            const loadedPlugins = await window.electronAPI.plugins.loadPlugins();
            console.log('Plugins cargados desde el sistema de archivos:', loadedPlugins);
          } catch (err) {
            console.warn('No se pudieron cargar plugins locales:', err);
          }
        }
        
        setPluginsInitialized(true);
        console.log('Sistema de plugins inicializado correctamente');
      } catch (error) {
        console.error('Error al inicializar el sistema de plugins:', error);
      }
    };
    
    initializeApp();
  }, []);
  
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