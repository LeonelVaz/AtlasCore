/**
 * Módulo principal del sistema de plugins de Atlas
 * 
 * Exporta el registro y el cargador de plugins, así como
 * utilidades para la integración con la aplicación principal.
 */

import pluginRegistry from './plugin-registry';
import pluginLoader, { PLUGIN_EVENTS } from './plugin-loader';

/**
 * Inicializa el sistema de plugins con el objeto core
 * @param {Object} core - APIs disponibles para los plugins 
 * @returns {Promise<Array>} - Plugins habilitados
 */
export async function initializePlugins(core) {
  return await pluginRegistry.initialize(core);
}

/**
 * Registra un plugin en el sistema
 * @param {Object} plugin - Objeto del plugin con métodos init y cleanup
 * @returns {boolean} - true si se registró correctamente
 */
export function registerPlugin(plugin) {
  return pluginLoader.registerPlugin(plugin);
}

/**
 * Crea el objeto core con las APIs para los plugins
 * @param {Object} apis - APIs de la aplicación principal
 * @returns {Object} - Objeto core para inicializar plugins
 */
export function createPluginCore(apis = {}) {
  // Objeto base que se pasará a los plugins en su inicialización
  return {
    // Acceso al bus de eventos
    events: apis.events || {},
    
    // API de almacenamiento
    storage: {
      // Guardar datos específicos del plugin
      setItem: async (pluginId, key, value) => {
        const storageKey = `plugin.${pluginId}.${key}`;
        return apis.storage?.set(storageKey, value) || false;
      },
      
      // Recuperar datos específicos del plugin
      getItem: async (pluginId, key, defaultValue = null) => {
        const storageKey = `plugin.${pluginId}.${key}`;
        return apis.storage?.get(storageKey, defaultValue) || defaultValue;
      },
      
      // Eliminar datos específicos del plugin
      removeItem: async (pluginId, key) => {
        const storageKey = `plugin.${pluginId}.${key}`;
        return apis.storage?.remove(storageKey) || false;
      }
    },
    
    // Acceso a módulos registrados
    getModule: apis.getModule || (() => null),
    
    // Registro de módulos
    registerModule: apis.registerModule || (() => false),
    
    // API de UI
    ui: {
      // Registrar componente en zona específica
      registerComponent: (zoneId, component) => {
        // Esta función será implementada en fases posteriores
        console.log(`[Plugin API] Registrando componente en zona ${zoneId}`);
        return true;
      }
    },
    
    // API de configuración
    config: {
      // Guardar configuración del plugin
      saveConfig: async (pluginId, config) => {
        return await pluginRegistry.savePluginConfig(pluginId, config);
      },
      
      // Cargar configuración del plugin
      loadConfig: async (pluginId) => {
        return await pluginRegistry.loadPluginConfig(pluginId);
      }
    }
  };
}

// Exportar para uso en la aplicación
export { pluginRegistry, pluginLoader, PLUGIN_EVENTS };