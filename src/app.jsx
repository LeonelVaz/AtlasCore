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

// Permite renderizar elementos de barra lateral agregados por plugins
const DynamicSidebarItems = () => {
  const [pluginItems, setPluginItems] = useState([]);
  
  useEffect(() => {
    // Función para obtener elementos registrados
    const updateSidebarItems = () => {
      if (!window.__pluginExtensions || !window.__pluginExtensions['app.sidebar']) {
        setPluginItems([]);
        return;
      }
      
      setPluginItems(window.__pluginExtensions['app.sidebar']);
    };
    
    // Obtener elementos actuales
    updateSidebarItems();
    
    // Suscribirse a cambios
    const handleComponentRegistered = (data) => {
      if (data.pointId === 'app.sidebar') {
        updateSidebarItems();
      }
    };
    
    // Registrar listener
    eventBus.subscribe('app.pluginComponentRegistered', handleComponentRegistered);
    
    return () => {
      eventBus.unsubscribe('app.pluginComponentRegistered', handleComponentRegistered);
    };
  }, []);
  
  // No renderizar nada si no hay elementos
  if (pluginItems.length === 0) return null;
  
  // Renderizar cada elemento
  return (
    <>
      {pluginItems.map((registration, index) => {
        const Component = registration.component;
        return (
          <Component 
            key={`${registration.pluginId}-${index}`}
            pluginId={registration.pluginId}
            options={registration.options}
          />
        );
      })}
    </>
  );
};

/**
 * Componente principal de la aplicación
 */
function App() {
  const isElectron = isElectronEnv();
  const [activeSection, setActiveSection] = useState(APP_SECTIONS.CALENDAR.id);
  const [pluginsInitialized, setPluginsInitialized] = useState(false);
  const [pluginSections, setPluginSections] = useState({});
  
  // Inicializar sistema de plugins
  useEffect(() => {
    // Establecer la versión de la aplicación en una variable global
    window.APP_VERSION = '0.3.0';
    
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
        
        // Exponer el core globalmente para solucionar problemas de acceso
        window.__appCore = pluginCore;
        
        // Inicializar el sistema de plugins
        const enabledPlugins = await initializePlugins(pluginCore);
        console.log(`${enabledPlugins.length} plugins inicializados:`, 
                    enabledPlugins.map(p => p.name).join(', '));
        
        // Buscar plugins que registren secciones en la aplicación principal
        const sections = {};
        enabledPlugins.forEach(plugin => {
          if (plugin.section) {
            sections[plugin.id] = {
              id: plugin.id,
              label: plugin.section.label || plugin.name,
              icon: plugin.section.icon || 'extension',
              component: plugin.section.component
            };
          }
        });
        
        setPluginSections(sections);
        setPluginsInitialized(true);
        console.log('Sistema de plugins inicializado correctamente');
      } catch (error) {
        console.error('Error al inicializar el sistema de plugins:', error);
      }
    };
    
    initializeApp();
  }, []);
  
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
      default:
        // Verificar si es una sección de un plugin
        if (pluginSections[activeSection] && pluginSections[activeSection].component) {
          const PluginComponent = pluginSections[activeSection].component;
          return <PluginComponent />;
        }
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
          <Sidebar>
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
            
            {/* Secciones de plugins */}
            {Object.values(pluginSections).map(section => (
              <SidebarItem
                key={section.id}
                icon={section.icon}
                label={section.label}
                active={activeSection === section.id}
                onClick={() => setActiveSection(section.id)}
              />
            ))}
            
            {/* Elementos de sidebar dinámicos */}
            <DynamicSidebarItems />
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