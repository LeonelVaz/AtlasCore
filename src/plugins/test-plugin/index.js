/**
 * Plugin de prueba para Atlas
 */
export default {
  // Metadatos del plugin
  id: 'test-plugin',
  name: 'Plugin de Prueba',
  version: '0.1.0',
  description: 'Un plugin simple para probar el sistema de plugins',
  author: 'Tu Nombre',
  
  // Restricciones de compatibilidad
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
  
  /**
   * Inicializa el plugin
   * @param {Object} core - API central proporcionada por Atlas
   * @returns {boolean} - true si la inicialización fue exitosa
   */
  init: function(core) {
    console.log('¡Plugin de prueba inicializado!');
    
    // Guardar referencia al core para uso posterior
    this.core = core;
    
    // Subscribirse a eventos
    this.unsubscribe = core.events.subscribe('app.initialized', () => {
      console.log('Plugin de prueba recibió evento app.initialized');
    });
    
    // Registrar componente UI simple (si hay permisos)
    if (core.permissions.hasPermission(this.id, 'ui.registerComponents')) {
      core.ui.registerComponent(this.id, 'app.sidebar', function SidebarItemPlugin(props) {
        return {
          render: function() {
            const React = window.React || props.React;
            return React.createElement('div', { 
              className: 'sidebar-item',
              onClick: function() { 
                alert('¡Plugin de prueba funcionando!');
              }
            }, [
              React.createElement('span', { 
                className: 'sidebar-item-icon',
                key: 'icon'
              }, '🧪'),
              React.createElement('span', {
                className: 'sidebar-item-label',
                key: 'label'
              }, 'Plugin de Prueba')
            ]);
          }
        };
      });
    }
    
    return true;
  },
  
  /**
   * Limpia recursos cuando el plugin se desactiva
   * @param {Object} core - API central proporcionada por Atlas
   * @returns {boolean} - true si la limpieza fue exitosa
   */
  cleanup: function(core) {
    console.log('Plugin de prueba desactivado');
    
    // Cancelar suscripciones a eventos
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    this.core = null;
    
    return true;
  }
};