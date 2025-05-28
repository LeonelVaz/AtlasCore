import React, { useState, useEffect } from "react";
import { STORAGE_KEYS } from "../../core/config/constants";
import storageService from "../../services/storage-service";
import eventBus from "../../core/bus/event-bus";

/**
 * Componente para configuración de herramientas de desarrollo
 */
const DeveloperPanel = () => {
  // Estados para las diferentes opciones de desarrollo
  const [eventDebuggerEnabled, setEventDebuggerEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [consoleLogsEnabled, setConsoleLogsEnabled] = useState(false);
  const [performanceMonitorEnabled, setPerformanceMonitorEnabled] =
    useState(false);

  // Cargar configuración al iniciar
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Cargar configuración del event debugger
        const debuggerEnabled = await storageService.get(
          STORAGE_KEYS.DEV_EVENT_DEBUGGER_ENABLED,
          false
        );
        setEventDebuggerEnabled(debuggerEnabled);

        // Cargar otras configuraciones de desarrollo
        const logsEnabled = await storageService.get(
          STORAGE_KEYS.DEV_CONSOLE_LOGS_ENABLED,
          false
        );
        setConsoleLogsEnabled(logsEnabled);

        const perfEnabled = await storageService.get(
          STORAGE_KEYS.DEV_PERFORMANCE_MONITOR_ENABLED,
          false
        );
        setPerformanceMonitorEnabled(perfEnabled);

        setLoading(false);
      } catch (error) {
        console.error("Error al cargar configuración de desarrollo:", error);
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Manejar cambio en Event Debugger
  const handleEventDebuggerToggle = async (enabled) => {
    try {
      setEventDebuggerEnabled(enabled);
      await storageService.set(
        STORAGE_KEYS.DEV_EVENT_DEBUGGER_ENABLED,
        enabled
      );

      // Publicar evento para notificar el cambio
      eventBus.publish("developer.eventDebuggerToggled", { enabled });

      console.log(`Event Debugger ${enabled ? "activado" : "desactivado"}`);
    } catch (error) {
      console.error(
        "Error al cambiar configuración del Event Debugger:",
        error
      );
      // Revertir cambio en caso de error
      setEventDebuggerEnabled(!enabled);
    }
  };

  // Manejar cambio en logs de consola
  const handleConsoleLogsToggle = async (enabled) => {
    try {
      setConsoleLogsEnabled(enabled);
      await storageService.set(STORAGE_KEYS.DEV_CONSOLE_LOGS_ENABLED, enabled);

      // Configurar el modo debug del eventBus
      eventBus.setDebugMode(enabled);

      // Publicar evento para notificar el cambio
      eventBus.publish("developer.consoleLogsToggled", { enabled });

      console.log(`Logs de consola ${enabled ? "activados" : "desactivados"}`);
    } catch (error) {
      console.error("Error al cambiar configuración de logs:", error);
      setConsoleLogsEnabled(!enabled);
    }
  };

  // Manejar cambio en monitor de rendimiento
  const handlePerformanceMonitorToggle = async (enabled) => {
    try {
      setPerformanceMonitorEnabled(enabled);
      await storageService.set(
        STORAGE_KEYS.DEV_PERFORMANCE_MONITOR_ENABLED,
        enabled
      );

      // Publicar evento para notificar el cambio
      eventBus.publish("developer.performanceMonitorToggled", { enabled });

      console.log(
        `Monitor de rendimiento ${enabled ? "activado" : "desactivado"}`
      );
    } catch (error) {
      console.error(
        "Error al cambiar configuración del monitor de rendimiento:",
        error
      );
      setPerformanceMonitorEnabled(!enabled);
    }
  };

  // Función para limpiar todos los logs
  const handleClearLogs = () => {
    try {
      console.clear();
      console.log("🧹 Logs de consola limpiados por el usuario");
    } catch (error) {
      console.error("Error al limpiar logs:", error);
    }
  };

  // Función para mostrar información del sistema
  const handleShowSystemInfo = () => {
    const systemInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        colorDepth: screen.colorDepth,
      },
      window: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
      },
      atlas: {
        version: "0.3.0",
        eventBusActive: eventBus.getActiveEvents().length,
        isElectron:
          typeof window !== "undefined" &&
          typeof window.electronAPI !== "undefined",
      },
    };

    console.group("🖥️ INFORMACIÓN DEL SISTEMA");
    console.table(systemInfo.atlas);
    console.log("🌐 Navegador:", systemInfo.userAgent);
    console.log("💻 Plataforma:", systemInfo.platform);
    console.log("🗣️ Idioma:", systemInfo.language);
    console.log("📊 Pantalla:", systemInfo.screen);
    console.log("🪟 Ventana:", systemInfo.window);
    console.groupEnd();
  };

  // Función para ejecutar test del sistema de eventos
  const handleTestEventSystem = () => {
    console.group("🧪 TEST DEL SISTEMA DE EVENTOS");

    // Test 1: Publicar evento de prueba
    console.log("1️⃣ Publicando evento de prueba...");
    eventBus.publish("developer.test", {
      timestamp: Date.now(),
      message: "Evento de test desde panel de desarrolladores",
    });

    // Test 2: Verificar eventos activos
    console.log("2️⃣ Eventos activos:", eventBus.getActiveEvents());

    // Test 3: Estadísticas de suscriptores
    const stats = {};
    eventBus.getActiveEvents().forEach((event) => {
      stats[event] = eventBus.getSubscriberCount(event);
    });
    console.table(stats);

    console.groupEnd();
  };

  if (loading) {
    return (
      <div className="developer-panel">
        <p>Cargando configuración de desarrollo...</p>
      </div>
    );
  }

  return (
    <div className="developer-panel">
      <h3 className="settings-section-title">Herramientas de Desarrollo</h3>
      <p className="settings-section-description">
        Configuración de herramientas para desarrolladores y depuración.
      </p>

      {/* Event Debugger */}
      <div className="settings-section">
        <h4>Event Debugger</h4>
        <p className="settings-description">
          Muestra un panel flotante que monitorea todos los eventos del sistema
          en tiempo real.
        </p>

        <div className="settings-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={eventDebuggerEnabled}
              onChange={(e) => handleEventDebuggerToggle(e.target.checked)}
            />
            <span className="toggle-text">
              {eventDebuggerEnabled ? "Activado" : "Desactivado"}
            </span>
          </label>
        </div>

        {eventDebuggerEnabled && (
          <div className="settings-info">
            <p>
              <strong>ℹ️ Información:</strong> El Event Debugger aparecerá en la
              esquina inferior derecha de la pantalla.
            </p>
          </div>
        )}
      </div>

      <div className="settings-divider"></div>

      {/* Logs de Consola */}
      <div className="settings-section">
        <h4>Logs Detallados</h4>
        <p className="settings-description">
          Habilita logs detallados del sistema de eventos en la consola del
          navegador.
        </p>

        <div className="settings-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={consoleLogsEnabled}
              onChange={(e) => handleConsoleLogsToggle(e.target.checked)}
            />
            <span className="toggle-text">
              {consoleLogsEnabled ? "Activado" : "Desactivado"}
            </span>
          </label>
        </div>
      </div>

      <div className="settings-divider"></div>

      {/* Monitor de Rendimiento */}
      <div className="settings-section">
        <h4>Monitor de Rendimiento</h4>
        <p className="settings-description">
          Monitorea el rendimiento de la aplicación y muestra métricas en la
          consola.
        </p>

        <div className="settings-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={performanceMonitorEnabled}
              onChange={(e) => handlePerformanceMonitorToggle(e.target.checked)}
            />
            <span className="toggle-text">
              {performanceMonitorEnabled ? "Activado" : "Desactivado"}
            </span>
          </label>
        </div>

        <div className="settings-info">
          <p>
            <em>⚠️ Funcionalidad próximamente disponible</em>
          </p>
        </div>
      </div>

      <div className="settings-divider"></div>

      {/* Herramientas de Debug */}
      <div className="settings-section">
        <h4>Herramientas de Debug</h4>
        <p className="settings-description">
          Herramientas útiles para depuración y análisis del sistema.
        </p>

        <div className="debug-tools">
          <button className="debug-tool-button" onClick={handleClearLogs}>
            🧹 Limpiar Consola
          </button>

          <button className="debug-tool-button" onClick={handleShowSystemInfo}>
            🖥️ Info del Sistema
          </button>

          <button className="debug-tool-button" onClick={handleTestEventSystem}>
            🧪 Test de Eventos
          </button>
        </div>
      </div>

      <div className="settings-divider"></div>

      {/* Información Adicional */}
      <div className="settings-section">
        <h4>Información para Desarrolladores</h4>
        <div className="dev-info">
          <p>
            <strong>Versión de Atlas:</strong> 0.3.0
          </p>
          <p>
            <strong>Eventos activos:</strong>{" "}
            {eventBus.getActiveEvents().length}
          </p>
          <p>
            <strong>Entorno:</strong>{" "}
            {typeof window !== "undefined" &&
            typeof window.electronAPI !== "undefined"
              ? "Electron"
              : "Web"}
          </p>
          <p>
            <strong>Consola:</strong> Presiona F12 para abrir las herramientas
            de desarrollo
          </p>
        </div>
      </div>

      <div className="settings-warning">
        <p>
          <strong>⚠️ Advertencia:</strong> Las herramientas de desarrollo pueden
          afectar el rendimiento de la aplicación. Se recomienda desactivarlas
          en uso normal.
        </p>
      </div>
    </div>
  );
};

export default DeveloperPanel;
