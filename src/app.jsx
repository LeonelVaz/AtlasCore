// src/app.jsx
import React, { useState, useEffect } from 'react';
import CalendarMain from './components/calendar/calendar-main';
import SettingsPanel from './components/settings/settings-panel';
import Sidebar from './components/ui/sidebar/Sidebar';
import SidebarItem from './components/ui/sidebar/sidebar-item';
import WindowControls from './components/ui/window-controls';
import ConfigProvider from './contexts/config-provider';
import { DialogProvider, useDialog } from './contexts/DialogContext'; // Importar el proveedor de diálogos
import { initializeDialogInterceptor } from './utils/dialog-interceptor'; // Importar el interceptor
import { isElectronEnv } from './utils/electron-detector';
import pluginManager from './core/plugins/plugin-manager';
import PluginPages from './components/plugin-extension/plugin-pages';
import EventDebugger from './debug/EventDebugger';

// Iconos para los elementos del sidebar
const APP_SECTIONS = {
  CALENDAR: { id: 'calendar', label: 'Calendario', icon: 'calendar_today' },
  SETTINGS: { id: 'settings', label: 'Configuración', icon: 'settings' },
  PLUGIN: { id: 'plugin', label: 'Plugin', icon: 'extension' },
};

/**
 * Componente interno de la aplicación que tiene acceso al contexto de diálogos
 */
function AppContent() {
  const isElectron = isElectronEnv();
  const [activeSection, setActiveSection] = useState(APP_SECTIONS.CALENDAR.id);
  const [currentPluginPage, setCurrentPluginPage] = useState(null);
  const dialogContext = useDialog(); // Obtener el contexto de diálogos
  
  // Inicializar el interceptor de diálogos
  useEffect(() => {
    if (dialogContext) {
      initializeDialogInterceptor(dialogContext);
      console.log('Interceptor de diálogos inicializado');
    }
  }, [dialogContext]);
  
  // Inicializar sistema de plugins
  useEffect(() => {
    const initPluginSystem = async () => {
      try {
        // Inicializar con servicios que se proporcionarán a los plugins
        const services = {
          // Incluir contexto de diálogos para plugins
          dialog: dialogContext
        };
        
        // Inicializar el sistema de plugins
        await pluginManager.initialize(services);
        console.log('Sistema de plugins inicializado con soporte para diálogos');
      } catch (error) {
        console.error('Error al inicializar sistema de plugins:', error);
        
        // Usar el sistema de diálogos personalizado para mostrar el error
        if (dialogContext) {
          dialogContext.showAlert(
            `Error al inicializar el sistema de plugins: ${error.message}`,
            'Error de inicialización'
          );
        }
      }
    };
    
    // Solo inicializar si tenemos el contexto de diálogos
    if (dialogContext) {
      initPluginSystem();
    }
  }, [dialogContext]);
  
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
        return <CalendarMain />;
    }
  };

  return (
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
      
      <EventDebugger />
    </div>
  );
}

/**
 * Componente principal de la aplicación con todos los providers
 */
function App() {
  return (
    <ConfigProvider>
      <DialogProvider>
        <AppContent />
      </DialogProvider>
    </ConfigProvider>
  );
}

export default App;