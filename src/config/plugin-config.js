/**
 * Configuración de plugins para Atlas
 * Este archivo se carga antes de inicializar el sistema de plugins
 */

window.AtlasConfig = window.AtlasConfig || {};

// Array para almacenar plugins registrados en tiempo de ejecución
window.AtlasConfig.plugins = window.AtlasConfig.plugins || [];

// No hay rutas predefinidas - estas se descubrirán automáticamente
window.AtlasConfig.pluginPaths = window.AtlasConfig.pluginPaths || [];

// Método para registrar un nuevo plugin en tiempo de ejecución
window.registerPlugin = function(plugin) {
  if (plugin && plugin.id) {
    // Asegurarse de que no exista ya
    const exists = window.AtlasConfig.plugins.some(p => p.id === plugin.id);
    if (!exists) {
      window.AtlasConfig.plugins.push(plugin);
      
      // Disparar evento para notificar al sistema de plugins
      if (typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('atlas:plugin:registered', { 
          detail: { pluginId: plugin.id }
        }));
      }
      
      console.log(`Plugin registrado: ${plugin.id}`);
      return true;
    }
  }
  return false;
};

// Escuchar a eventos de registro de plugins
window.addEventListener('atlas:plugin:register', function(event) {
  if (event.detail && event.detail.plugin) {
    window.registerPlugin(event.detail.plugin);
  }
});