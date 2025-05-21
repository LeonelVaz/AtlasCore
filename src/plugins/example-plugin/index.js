// Plugin de prueba para verificar que todo funciona correctamente
export default {
  id: 'test-plugin',
  name: 'Plugin de Prueba',
  version: '1.0.0',
  description: 'Plugin para verificar que el sistema funciona',
  author: 'Test',
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
  permissions: ['storage', 'events', 'ui'],
  
  init: function(core) {
    console.log('🔌 [Test Plugin] Inicializando...');
    
    // 1. Probar acceso al módulo calendar
    const calendar = core.getModule('calendar');
    if (calendar) {
      console.log('✅ [Test Plugin] Módulo calendar accesible');
      const events = calendar.getEvents();
      console.log(`✅ [Test Plugin] Eventos en calendario: ${events.length}`);
    } else {
      console.error('❌ [Test Plugin] No se pudo acceder al módulo calendar');
    }
    
    // 2. Probar suscripción a eventos
    core.events.subscribe(
      this.id,
      'calendar.eventCreated',
      (data) => {
        console.log('✅ [Test Plugin] Evento creado detectado:', data);
      }
    );
    
    core.events.subscribe(
      this.id,
      'calendar.eventUpdated',
      (data) => {
        console.log('✅ [Test Plugin] Evento actualizado detectado:', data);
      }
    );
    
    core.events.subscribe(
      this.id,
      'calendar.eventDeleted',
      (data) => {
        console.log('✅ [Test Plugin] Evento eliminado detectado:', data);
      }
    );
    
    // 3. Probar almacenamiento
    core.storage.setItem(this.id, 'test', { mensaje: 'Datos de prueba' })
      .then(() => {
        console.log('✅ [Test Plugin] Almacenamiento funcionando');
        return core.storage.getItem(this.id, 'test');
      })
      .then((data) => {
        console.log('✅ [Test Plugin] Datos recuperados:', data);
      })
      .catch((error) => {
        console.error('❌ [Test Plugin] Error en almacenamiento:', error);
      });
    
    console.log('🔌 [Test Plugin] Inicialización completada');
    return true;
  },
  
  cleanup: function() {
    console.log('🔌 [Test Plugin] Limpiando...');
    return true;
  }
};