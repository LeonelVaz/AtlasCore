import React, { useEffect, useState } from 'react';
import eventBus, { CalendarEvents, AppEvents, StorageEvents } from '../../core/bus/event-bus';
import { STORAGE_KEYS } from '../../core/config/constants';
import storageService from '../../services/storage-service';

function EventDebugger() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [logsEnabled, setLogsEnabled] = useState(false);
  const [performanceEnabled, setPerformanceEnabled] = useState(false);
  const [eventCount, setEventCount] = useState({
    calendar: 0,
    app: 0,
    storage: 0,
    total: 0
  });
  
  // Cargar configuración inicial
  useEffect(() => {
    const loadDebuggerConfig = async () => {
      try {
        const enabled = await storageService.get(STORAGE_KEYS.DEV_EVENT_DEBUGGER_ENABLED, false);
        setIsEnabled(enabled);
        
        const logs = await storageService.get(STORAGE_KEYS.DEV_CONSOLE_LOGS_ENABLED, false);
        setLogsEnabled(logs);
        
        const perf = await storageService.get(STORAGE_KEYS.DEV_PERFORMANCE_MONITOR_ENABLED, false);
        setPerformanceEnabled(perf);
      } catch (error) {
        console.error('Error al cargar configuración del Event Debugger:', error);
      }
    };
    
    loadDebuggerConfig();
  }, []);
  
  // Escuchar cambios en la configuración
  useEffect(() => {
    const subscriptions = [];
    
    subscriptions.push(
      eventBus.subscribe('developer.eventDebuggerToggled', (data) => {
        setIsEnabled(data.enabled);
        
        if (data.enabled) {
          console.log('🔍 Event Debugger activado desde configuración');
        } else {
          console.log('🔍 Event Debugger desactivado desde configuración');
        }
      })
    );
    
    subscriptions.push(
      eventBus.subscribe('developer.consoleLogsToggled', (data) => {
        setLogsEnabled(data.enabled);
      })
    );
    
    subscriptions.push(
      eventBus.subscribe('developer.performanceMonitorToggled', (data) => {
        setPerformanceEnabled(data.enabled);
      })
    );
    
    return () => {
      subscriptions.forEach(unsub => unsub && unsub());
    };
  }, []);
  
  // Configurar monitoreo de eventos solo si está habilitado
  useEffect(() => {
    if (!isEnabled) {
      return;
    }
    
    console.log('🔍 EventDebugger: Iniciando monitoreo completo del sistema...\n');
    
    // Verificar estado inicial del sistema
    verifySystemStatus();
    
    const subscriptions = [];
    
    // ========== EVENTOS DEL CALENDARIO ==========
    console.log('📅 Suscribiéndose a eventos del CALENDARIO...');
    
    // Evento de creación
    subscriptions.push(
      eventBus.subscribe(CalendarEvents.EVENT_CREATED, (data) => {
        console.log('✅ calendar.eventCreated:', data);
        updateCount('calendar');
      })
    );
    
    // Evento de actualización
    subscriptions.push(
      eventBus.subscribe(CalendarEvents.EVENT_UPDATED, (data) => {
        console.log('✅ calendar.eventUpdated:', data);
        if (data.oldEvent && data.newEvent) {
          console.log('  📌 Cambios detectados:');
          if (data.oldEvent.start !== data.newEvent.start) {
            console.log(`    - Fecha inicio: ${data.oldEvent.start} → ${data.newEvent.start}`);
          }
          if (data.oldEvent.end !== data.newEvent.end) {
            console.log(`    - Fecha fin: ${data.oldEvent.end} → ${data.newEvent.end}`);
          }
          if (data.oldEvent.title !== data.newEvent.title) {
            console.log(`    - Título: "${data.oldEvent.title}" → "${data.newEvent.title}"`);
          }
        }
        updateCount('calendar');
      })
    );
    
    // Evento de eliminación
    subscriptions.push(
      eventBus.subscribe(CalendarEvents.EVENT_DELETED, (data) => {
        console.log('✅ calendar.eventDeleted:', data);
        updateCount('calendar');
      })
    );
    
    // Evento de carga
    subscriptions.push(
      eventBus.subscribe(CalendarEvents.EVENTS_LOADED, (data) => {
        console.log(`✅ calendar.eventsLoaded: ${data.count} eventos cargados`);
        updateCount('calendar');
      })
    );
    
    // Cambio de vista
    subscriptions.push(
      eventBus.subscribe(CalendarEvents.VIEW_CHANGED, (data) => {
        console.log('✅ calendar.viewChanged:', data);
        updateCount('calendar');
      })
    );
    
    // Cambio de fecha
    subscriptions.push(
      eventBus.subscribe(CalendarEvents.DATE_CHANGED, (data) => {
        console.log('✅ calendar.dateChanged:', data);
        updateCount('calendar');
      })
    );
    
    // ========== EVENTOS DE LA APLICACIÓN ==========
    console.log('\n🔧 Suscribiéndose a eventos de la APLICACIÓN...');
    
    subscriptions.push(
      eventBus.subscribe(AppEvents.INITIALIZED, (data) => {
        console.log('✅ app.initialized:', data);
        updateCount('app');
      })
    );
    
    subscriptions.push(
      eventBus.subscribe(AppEvents.THEME_CHANGED, (data) => {
        console.log('✅ app.themeChanged:', data);
        updateCount('app');
      })
    );
    
    subscriptions.push(
      eventBus.subscribe(AppEvents.MODULE_REGISTERED, (data) => {
        console.log('✅ app.moduleRegistered:', data);
        updateCount('app');
      })
    );
    
    subscriptions.push(
      eventBus.subscribe(AppEvents.SETTINGS_CHANGED, (data) => {
        console.log('✅ app.settingsChanged:', data);
        updateCount('app');
      })
    );
    
    // ========== EVENTOS DE ALMACENAMIENTO ==========
    console.log('\n💾 Suscribiéndose a eventos de ALMACENAMIENTO...');
    
    subscriptions.push(
      eventBus.subscribe(StorageEvents.DATA_CHANGED, (data) => {
        console.log('✅ storage.dataChanged:', data);
        updateCount('storage');
      })
    );
    
    subscriptions.push(
      eventBus.subscribe(StorageEvents.EVENTS_UPDATED, (data) => {
        console.log(`✅ storage.eventsUpdated: ${Array.isArray(data) ? data.length + ' eventos' : data}`);
        updateCount('storage');
      })
    );
    
    // ========== EVENTOS DE DESARROLLO ==========
    console.log('\n🛠️ Suscribiéndose a eventos de DESARROLLO...');
    
    subscriptions.push(
      eventBus.subscribe('developer.test', (data) => {
        console.log('✅ developer.test:', data);
        updateCount('app');
      })
    );
    
    // Verificar eventos activos después de suscribirnos
    setTimeout(() => {
      console.log('\n📊 RESUMEN DEL SISTEMA:');
      console.log('Eventos con suscriptores:', eventBus.getActiveEvents());
      
      const eventStats = {};
      eventBus.getActiveEvents().forEach(event => {
        eventStats[event] = eventBus.getSubscriberCount(event);
      });
      console.table(eventStats);
    }, 1000);
    
    // Función para actualizar contadores
    function updateCount(category) {
      setEventCount(prev => ({
        ...prev,
        [category]: prev[category] + 1,
        total: prev.total + 1
      }));
    }
    
    // Función para verificar el estado del sistema
    function verifySystemStatus() {
      console.log('🔍 VERIFICACIÓN DEL SISTEMA:');
      
      const criticalEvents = [
        'calendar.eventCreated',
        'calendar.eventUpdated',
        'calendar.eventDeleted'
      ];
      
      console.log('\n📌 Estado de eventos críticos:');
      criticalEvents.forEach(event => {
        const hasSubscribers = eventBus.hasSubscribers(event);
        const count = eventBus.getSubscriberCount(event);
        console.log(`${hasSubscribers ? '✅' : '❌'} ${event} - ${count} suscriptores`);
      });
      
      console.log('\n');
    }
    
    // Cleanup
    return () => {
      console.log('🔍 EventDebugger: Deteniendo monitoreo...');
      subscriptions.forEach(unsub => unsub());
    };
  }, [isEnabled]);
  
  // Funciones de herramientas
  const runManualTest = () => {
    console.log('\n🧪 EJECUTANDO TEST MANUAL...');
    
    console.log('1️⃣ Publicando evento de prueba...');
    eventBus.publish('test.manual', { mensaje: 'Test manual desde EventDebugger' });
    
    console.log('2️⃣ Verificando acceso al módulo calendar...');
    try {
      console.log('   ⚠️  Para probar el módulo calendar, usa un plugin de prueba');
    } catch (e) {
      console.log('   ❌ Error:', e.message);
    }
    
    console.log('3️⃣ Eventos activos en el sistema:');
    const activeEvents = eventBus.getActiveEvents();
    activeEvents.forEach(event => {
      console.log(`   - ${event}: ${eventBus.getSubscriberCount(event)} suscriptores`);
    });
    
    console.log('\n✅ Test manual completado\n');
  };
  
  const clearConsole = () => {
    try {
      console.clear();
      console.log('🧹 Logs de consola limpiados por el usuario');
    } catch (error) {
      console.error('Error al limpiar logs:', error);
    }
  };
  
  const showSystemInfo = () => {
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
        colorDepth: screen.colorDepth
      },
      window: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight
      },
      atlas: {
        version: '0.3.0',
        eventBusActive: eventBus.getActiveEvents().length,
        isElectron: typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined'
      }
    };

    console.group('🖥️ INFORMACIÓN DEL SISTEMA');
    console.table(systemInfo.atlas);
    console.log('🌐 Navegador:', systemInfo.userAgent);
    console.log('💻 Plataforma:', systemInfo.platform);
    console.log('🗣️ Idioma:', systemInfo.language);
    console.log('📊 Pantalla:', systemInfo.screen);
    console.log('🪟 Ventana:', systemInfo.window);
    console.groupEnd();
  };
  
  // Funciones para cambiar configuración
  const toggleDebugger = async () => {
    try {
      const newState = !isEnabled;
      await storageService.set(STORAGE_KEYS.DEV_EVENT_DEBUGGER_ENABLED, newState);
      setIsEnabled(newState);
      
      eventBus.publish('developer.eventDebuggerToggled', { enabled: newState });
      
      console.log(`🔍 Event Debugger ${newState ? 'activado' : 'desactivado'} desde el panel flotante`);
    } catch (error) {
      console.error('Error al cambiar configuración del Event Debugger:', error);
    }
  };
  
  const toggleLogs = async () => {
    try {
      const newState = !logsEnabled;
      await storageService.set(STORAGE_KEYS.DEV_CONSOLE_LOGS_ENABLED, newState);
      setLogsEnabled(newState);
      
      eventBus.setDebugMode(newState);
      eventBus.publish('developer.consoleLogsToggled', { enabled: newState });
      
      console.log(`🔧 Logs detallados ${newState ? 'activados' : 'desactivados'}`);
    } catch (error) {
      console.error('Error al cambiar configuración de logs:', error);
    }
  };
  
  const togglePerformance = async () => {
    try {
      const newState = !performanceEnabled;
      await storageService.set(STORAGE_KEYS.DEV_PERFORMANCE_MONITOR_ENABLED, newState);
      setPerformanceEnabled(newState);
      
      eventBus.publish('developer.performanceMonitorToggled', { enabled: newState });
      
      console.log(`📊 Monitor de rendimiento ${newState ? 'activado' : 'desactivado'}`);
    } catch (error) {
      console.error('Error al cambiar configuración del monitor de rendimiento:', error);
    }
  };
  
  // No renderizar nada si está deshabilitado
  if (!isEnabled) {
    return null;
  }
  
  return (
    <div className={`event-debugger ${isMinimized ? 'minimized' : 'expanded'}`}>
      {/* Header */}
      <div 
        className="event-debugger-header" 
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="event-debugger-title">
          <span className="emoji">📡</span>
          Event Debugger
        </div>
        <div className="event-debugger-controls">
          <button
            className="event-debugger-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              toggleDebugger();
            }}
            title="Desactivar Event Debugger"
          >
            ✕
          </button>
          <span className="event-debugger-toggle">
            {isMinimized ? '▲' : '▼'}
          </span>
        </div>
      </div>
      
      {/* Content */}
      {!isMinimized && (
        <div className="event-debugger-content">
          {/* Estadísticas de eventos */}
          <div className="event-stats-section">
            <div className="event-stats-title">Eventos capturados:</div>
            
            <div className="event-stats-grid">
              <div className="event-stat-card">
                <div className="event-stat-label">📅 Calendario</div>
                <div className="event-stat-value">{eventCount.calendar}</div>
              </div>
              
              <div className="event-stat-card">
                <div className="event-stat-label">🔧 Aplicación</div>
                <div className="event-stat-value">{eventCount.app}</div>
              </div>
              
              <div className="event-stat-card">
                <div className="event-stat-label">💾 Storage</div>
                <div className="event-stat-value">{eventCount.storage}</div>
              </div>
              
              <div className="event-stat-card total">
                <div className="event-stat-label">📊 Total</div>
                <div className="event-stat-value">{eventCount.total}</div>
              </div>
            </div>
          </div>
          
          {/* Configuración rápida */}
          <div className="debug-config-section">
            <div className="debug-config-title">Configuración rápida:</div>
            
            <div className="debug-toggle">
              <span className="debug-toggle-label">Logs detallados</span>
              <label className="debug-toggle-switch">
                <input
                  type="checkbox"
                  className="debug-toggle-input"
                  checked={logsEnabled}
                  onChange={toggleLogs}
                />
                <span className="debug-toggle-slider"></span>
              </label>
            </div>
            
            <div className="debug-toggle">
              <span className="debug-toggle-label">Monitor rendimiento</span>
              <label className="debug-toggle-switch">
                <input
                  type="checkbox"
                  className="debug-toggle-input"
                  checked={performanceEnabled}
                  onChange={togglePerformance}
                />
                <span className="debug-toggle-slider"></span>
              </label>
            </div>
          </div>
          
          {/* Herramientas de debug */}
          <div className="debug-tools-section">
            <div className="debug-tools-title">Herramientas:</div>
            
            <div className="debug-tools-grid">
              <button
                className="debug-tool-btn primary"
                onClick={runManualTest}
                title="Ejecutar test del sistema de eventos"
              >
                🧪 Test Manual
              </button>
              
              <button
                className="debug-tool-btn warning"
                onClick={clearConsole}
                title="Limpiar la consola del navegador"
              >
                🧹 Limpiar
              </button>
              
              <button
                className="debug-tool-btn success"
                onClick={showSystemInfo}
                title="Mostrar información del sistema"
              >
                🖥️ Info Sistema
              </button>
              
              <button
                className="debug-tool-btn"
                onClick={() => {
                  console.log('📋 Eventos activos:', eventBus.getActiveEvents());
                  const stats = {};
                  eventBus.getActiveEvents().forEach(event => {
                    stats[event] = eventBus.getSubscriberCount(event);
                  });
                  console.table(stats);
                }}
                title="Mostrar estadísticas de eventos"
              >
                📊 Stats
              </button>
            </div>
          </div>
          
          {/* Información del sistema */}
          <div className="debug-info-section">
            <div className="debug-info-main">
              Ver consola para detalles completos
            </div>
            <div className="debug-info-secondary">
              Se puede desactivar desde Configuración → Desarrolladores
              <br />
              Eventos activos: {eventBus.getActiveEvents().length} | 
              Entorno: {typeof window !== 'undefined' && typeof window.electronAPI !== 'undefined' ? 'Electron' : 'Web'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventDebugger;