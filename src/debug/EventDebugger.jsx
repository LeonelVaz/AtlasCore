import React, { useEffect } from 'react';
import eventBus, { CalendarEvents } from '../core/bus/event-bus';

function EventDebugger() {
  useEffect(() => {
    console.log('🔍 EventDebugger: Iniciando monitoreo de eventos del calendario...');
    
    // Suscribirse a todos los eventos del calendario
    const subscriptions = [];
    
    // Evento de creación
    subscriptions.push(
      eventBus.subscribe(CalendarEvents.EVENT_CREATED, (data) => {
        console.log('✅ EVENT_CREATED disparado:', data);
      })
    );
    
    // Evento de actualización
    subscriptions.push(
      eventBus.subscribe(CalendarEvents.EVENT_UPDATED, (data) => {
        console.log('✅ EVENT_UPDATED disparado:', data);
        console.log('  - Evento anterior:', data.oldEvent);
        console.log('  - Evento nuevo:', data.newEvent);
      })
    );
    
    // Evento de eliminación
    subscriptions.push(
      eventBus.subscribe(CalendarEvents.EVENT_DELETED, (data) => {
        console.log('✅ EVENT_DELETED disparado:', data);
      })
    );
    
    // Evento de carga
    subscriptions.push(
      eventBus.subscribe(CalendarEvents.EVENTS_LOADED, (data) => {
        console.log('✅ EVENTS_LOADED disparado:', data);
      })
    );
    
    // Verificar qué eventos están activos
    console.log('📊 Eventos con suscriptores:', eventBus.getActiveEvents());
    
    // Cleanup
    return () => {
      console.log('🔍 EventDebugger: Deteniendo monitoreo...');
      subscriptions.forEach(unsub => unsub());
    };
  }, []);
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      background: '#333',
      color: '#fff',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      📡 Monitoreando eventos del calendario (ver consola)
    </div>
  );
}

export default EventDebugger;