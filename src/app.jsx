// src/app.jsx
import React, { useState, useEffect } from "react";
import CalendarMain from "./components/calendar/calendar-main";
import SettingsPanel from "./components/settings/settings-panel";
import Sidebar from "./components/ui/sidebar/sidebar"; // Asegúrate de que el nombre sea 'Sidebar' con S mayúscula
import SidebarItem from "./components/ui/sidebar/sidebar-item";
import WindowControls from "./components/ui/window-controls";
import ConfigProvider from "./contexts/config-provider";
import { DialogProvider, useDialog } from "./contexts/dialog-context"; // Importar el proveedor de diálogos
import { initializeDialogInterceptor } from "./utils/dialog-interceptor"; // Importar el interceptor
import { isElectronEnv } from "./utils/electron-detector";
import pluginManager from "./core/plugins/plugin-manager";
import PluginPages from "./components/plugin-extension/plugin-pages";
import EventDebugger from "./components/debug/event-debugger";
import { STORAGE_KEYS } from "./core/config/constants";
import storageService from "./services/storage-service";
import eventBus from "./core/bus/event-bus";

// Iconos para los elementos del sidebar
const APP_SECTIONS = {
  CALENDAR: { id: "calendar", label: "Calendario", icon: "calendar_today" },
  SETTINGS: { id: "settings", label: "Configuración", icon: "settings" },
  PLUGIN: { id: "plugin", label: "Plugin", icon: "extension" }, // Usado para identificar la sección de plugins
};

/**
 * Componente interno de la aplicación que tiene acceso al contexto de diálogos
 */
function AppContent() {
  const isElectron = isElectronEnv();
  const [activeSection, setActiveSection] = useState(APP_SECTIONS.CALENDAR.id);
  const [currentPluginPage, setCurrentPluginPage] = useState(null); // { pluginId: '...', pageId: '...' }
  const [debuggerEnabled, setDebuggerEnabled] = useState(false);
  const dialogContext = useDialog(); // Obtener el contexto de diálogos

  // Cargar configuración del debugger al iniciar
  useEffect(() => {
    const loadDebuggerConfig = async () => {
      try {
        const enabled = await storageService.get(
          STORAGE_KEYS.DEV_EVENT_DEBUGGER_ENABLED,
          false
        );
        setDebuggerEnabled(enabled);

        const logsEnabled = await storageService.get(
          STORAGE_KEYS.DEV_CONSOLE_LOGS_ENABLED,
          false
        );
        if (logsEnabled) {
          eventBus.setDebugMode(true);
          console.log("🔧 Modo debug activado para el sistema de eventos");
        }
      } catch (error) {
        console.error("Error al cargar configuración de desarrollo:", error);
      }
    };

    loadDebuggerConfig();
  }, []);

  // Escuchar cambios en la configuración del debugger
  useEffect(() => {
    const unsubscribe = eventBus.subscribe(
      "developer.eventDebuggerToggled",
      (data) => {
        setDebuggerEnabled(data.enabled);
      }
    );

    return () => unsubscribe && unsubscribe();
  }, []);

  // Inicializar el interceptor de diálogos
  useEffect(() => {
    if (dialogContext) {
      initializeDialogInterceptor(dialogContext);
      console.log("Interceptor de diálogos inicializado");
    }
  }, [dialogContext]);

  // Inicializar sistema de plugins
  useEffect(() => {
    const initPluginSystem = async () => {
      try {
        const services = {
          dialog: dialogContext,
        };

        await pluginManager.initialize(services);
        console.log(
          "Sistema de plugins inicializado con soporte para diálogos"
        );
      } catch (error) {
        console.error("Error al inicializar sistema de plugins:", error);

        if (dialogContext) {
          dialogContext.showAlert(
            `Error al inicializar el sistema de plugins: ${error.message}`,
            "Error de inicialización"
          );
        }
      }
    };

    if (dialogContext) {
      initPluginSystem();
    }
  }, [dialogContext]);

  // Función para navegar a una página de plugin
  const handleNavigateToPluginPage = (pluginId, pageId) => {
    setActiveSection(APP_SECTIONS.PLUGIN.id); // Establece la sección activa a 'plugin'
    setCurrentPluginPage({ pluginId, pageId });
  };

  // Secciones fijas de la barra lateral
  const sidebarSections = [APP_SECTIONS.CALENDAR, APP_SECTIONS.SETTINGS];

  // Renderizar contenido según sección activa
  const renderContent = () => {
    switch (activeSection) {
      case APP_SECTIONS.SETTINGS.id:
        return <SettingsPanel />;
      case APP_SECTIONS.CALENDAR.id:
        return <CalendarMain />;
      case APP_SECTIONS.PLUGIN.id: // Si la sección activa es 'plugin'
        if (currentPluginPage) {
          return <PluginPages currentPluginPage={currentPluginPage} />;
        }
        // Fallback si no hay página de plugin seleccionada pero la sección es 'plugin'
        return (
          <div className="plugin-error">
            No se ha seleccionado ninguna página de plugin.
          </div>
        );
      default:
        return <CalendarMain />;
    }
  };

  return (
    <div className="app-container">
      <header className={isElectron ? "app-header draggable" : "app-header"}>
        <div className="app-logo">
          <img src="./logo-white.png" alt="Atlas" height="40" />
        </div>

        {isElectron && <WindowControls />}
      </header>
      <div className="app-main">
        <Sidebar
          onPluginNavigate={handleNavigateToPluginPage}
          // Pasar información del estado activo al Sidebar
          activeSectionId={activeSection}
          activePluginId={
            activeSection === APP_SECTIONS.PLUGIN.id
              ? currentPluginPage?.pluginId
              : null
          }
          activePageId={
            activeSection === APP_SECTIONS.PLUGIN.id
              ? currentPluginPage?.pageId
              : null
          }
        >
          {/* Secciones estándar */}
          {sidebarSections.map((section) => (
            <SidebarItem
              key={section.id}
              icon={section.icon}
              label={section.label}
              active={activeSection === section.id} // El estado activo para secciones nativas se maneja aquí
              onClick={() => {
                setActiveSection(section.id);
                if (section.id !== APP_SECTIONS.PLUGIN.id) {
                  setCurrentPluginPage(null); // Limpiar página de plugin si se navega a una sección nativa
                }
              }}
            />
          ))}
        </Sidebar>

        <main className="app-content">{renderContent()}</main>
      </div>
      {/* Renderizar Event Debugger solo si está habilitado */}
      {debuggerEnabled && <EventDebugger />}{" "}
      {/* Modificado para renderizar condicionalmente */}
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
