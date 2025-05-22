import React, { useEffect, useState } from 'react';
import eventBus, { CalendarEvents, AppEvents, StorageEvents } from '../../core/bus/event-bus';

function EventDebugger() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [eventCount, setEventCount] = useState({
    calendar: 0,
    app: 0,
    storage: 0,
    total: 0
  });
  
  useEffect(() => {
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
    
    // App inicializada
    subscriptions.push(
      eventBus.subscribe(AppEvents.INITIALIZED, (data) => {
        console.log('✅ app.initialized:', data);
        updateCount('app');
      })
    );
    
    // Cambio de tema
    subscriptions.push(
      eventBus.subscribe(AppEvents.THEME_CHANGED, (data) => {
        console.log('✅ app.themeChanged:', data);
        updateCount('app');
      })
    );
    
    // Módulo registrado
    subscriptions.push(
      eventBus.subscribe(AppEvents.MODULE_REGISTERED, (data) => {
        console.log('✅ app.moduleRegistered:', data);
        updateCount('app');
      })
    );
    
    // Cambio de configuración
    subscriptions.push(
      eventBus.subscribe(AppEvents.SETTINGS_CHANGED, (data) => {
        console.log('✅ app.settingsChanged:', data);
        updateCount('app');
      })
    );
    
    // ========== EVENTOS DE ALMACENAMIENTO ==========
    console.log('\n💾 Suscribiéndose a eventos de ALMACENAMIENTO...');
    
    // Datos cambiados
    subscriptions.push(
      eventBus.subscribe(StorageEvents.DATA_CHANGED, (data) => {
        console.log('✅ storage.dataChanged:', data);
        updateCount('storage');
      })
    );
    
    // Eventos actualizados
    subscriptions.push(
      eventBus.subscribe(StorageEvents.EVENTS_UPDATED, (data) => {
        console.log(`✅ storage.eventsUpdated: ${Array.isArray(data) ? data.length + ' eventos' : data}`);
        updateCount('storage');
      })
    );
    
    // Verificar eventos activos después de suscribirnos
    setTimeout(() => {
      console.log('\n📊 RESUMEN DEL SISTEMA:');
      console.log('Eventos con suscriptores:', eventBus.getActiveEvents());
      
      // Contar suscriptores por evento
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
      
      // Verificar eventos principales
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
  }, []);
  
  // Función para ejecutar test manual
  const runManualTest = () => {
    console.log('\n🧪 EJECUTANDO TEST MANUAL...');
    
    // Test 1: Publicar evento de prueba
    console.log('1️⃣ Publicando evento de prueba...');
    eventBus.publish('test.manual', { mensaje: 'Test manual desde EventDebugger' });
    
    // Test 2: Verificar módulo calendar
    console.log('2️⃣ Verificando acceso al módulo calendar...');
    try {
      // Este test requeriría acceso al core, por ahora solo mostramos el intento
      console.log('   ⚠️  Para probar el módulo calendar, usa un plugin de prueba');
    } catch (e) {
      console.log('   ❌ Error:', e.message);
    }
    
    // Test 3: Listar todos los eventos activos
    console.log('3️⃣ Eventos activos en el sistema:');
    const activeEvents = eventBus.getActiveEvents();
    activeEvents.forEach(event => {
      console.log(`   - ${event}: ${eventBus.getSubscriberCount(event)} suscriptores`);
    });
    
    console.log('\n✅ Test manual completado\n');
  };
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      background: '#1a1a1a',
      color: '#fff',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      minWidth: isMinimized ? '180px' : '320px',
      transition: 'all 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 12px',
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer'
      }} onClick={() => setIsMinimized(!isMinimized)}>
        <span style={{ fontWeight: 'bold' }}>
          📡 Event Debugger
        </span>
        <span style={{ fontSize: '14px' }}>
          {isMinimized ? '▲' : '▼'}
        </span>
      </div>
      
      {/* Content */}
      {!isMinimized && (
        <>
          <div style={{ padding: '12px' }}>
            <div style={{ marginBottom: '10px' }}>
              <strong>Eventos capturados:</strong>
            </div>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              marginBottom: '10px'
            }}>
              <div style={{ 
                background: '#2a2a2a', 
                padding: '8px', 
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                📅 Calendario<br/>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {eventCount.calendar}
                </span>
              </div>
              
              <div style={{ 
                background: '#2a2a2a', 
                padding: '8px', 
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                🔧 Aplicación<br/>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {eventCount.app}
                </span>
              </div>
              
              <div style={{ 
                background: '#2a2a2a', 
                padding: '8px', 
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                💾 Storage<br/>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {eventCount.storage}
                </span>
              </div>
              
              <div style={{ 
                background: '#2563eb', 
                padding: '8px', 
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                📊 Total<br/>
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {eventCount.total}
                </span>
              </div>
            </div>
            
            <button
              onClick={runManualTest}
              style={{
                width: '100%',
                padding: '8px',
                background: '#4a4a4a',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '12px'
              }}
              onMouseOver={(e) => e.target.style.background = '#5a5a5a'}
              onMouseOut={(e) => e.target.style.background = '#4a4a4a'}
            >
              🧪 Ejecutar Test Manual
            </button>
            
            <div style={{ 
              marginTop: '10px', 
              fontSize: '10px', 
              color: '#888',
              textAlign: 'center'
            }}>
              Ver consola para detalles completos
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default EventDebugger;