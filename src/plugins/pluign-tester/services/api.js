/**
 * Servicio de API pública para el plugin
 */

/**
 * Crea y devuelve la API pública del plugin
 * @param {Object} plugin - Referencia al plugin
 * @returns {Object} API pública
 */
export function createPublicAPI(plugin) {
  const publicAPI = {
    /**
 * Obtiene estadísticas del plugin
 * @returns {Object} Objeto con estadísticas
 */
getEstadisticas: function() {
  // Asegurar que los datos existen antes de acceder a ellos
  const registroEventos = plugin._data && plugin._data.registroEventos ? plugin._data.registroEventos : [];
  const contador = plugin._data && typeof plugin._data.contador === 'number' ? plugin._data.contador : 0;
  
  return {
    contador: contador,
    eventos: registroEventos.length,
    ultimaActualizacion: new Date()
  };
},
    
    /**
     * Incrementa el contador del plugin
     * @param {number} incremento - Cantidad a incrementar (por defecto 1)
     * @returns {number} Nuevo valor del contador
     */
    incrementarContador: function(incremento = 1) {
      plugin._data.contador += incremento;
      
      // Guardar datos
      plugin._core.storage.setItem(
        plugin.id,
        'plugin-data',
        plugin._data
      ).catch(error => {
        console.error('[Plugin Tester] Error al guardar contador:', error);
      });
      
      return plugin._data.contador;
    },
    
    /**
     * Obtiene la configuración actual del plugin
     * @returns {Object} Objeto de configuración
     */
    getConfiguracion: function() {
      return { ...plugin._data.configuracion };
    }
  };
  
  return publicAPI;
}