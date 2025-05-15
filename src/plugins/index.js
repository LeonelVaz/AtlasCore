/**
 * Módulo principal del sistema de plugins de Atlas
 * 
 * Exporta el registro y el cargador de plugins, así como
 * utilidades para la integración con la aplicación principal.
 */

import pluginRegistry from './plugin-registry';
import pluginLoader, { PLUGIN_EVENTS } from './plugin-loader';
import { EXTENSION_POINTS } from './plugin-points';

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
      },
      
      // Comprobar si existe una clave
      hasItem: async (pluginId, key) => {
        const storageKey = `plugin.${pluginId}.${key}`;
        const value = await apis.storage?.get(storageKey, undefined);
        return value !== undefined;
      },
      
      // Obtener todas las claves con un prefijo específico
      getKeys: async (pluginId, prefix = '') => {
        // Esta función podría requerir una implementación específica según el almacenamiento
        // Por ahora devolvemos un array vacío
        console.warn('getKeys no implementado completamente');
        return [];
      }
    },
    
    // Acceso a módulos registrados
    getModule: apis.getModule || (() => null),
    
    // Registro de módulos
    registerModule: apis.registerModule || (() => false),
    
    // API de UI
    ui: {
      // Registrar componente en zona específica
      registerComponent: (pluginId, pointId, component, options = {}) => {
        if (!EXTENSION_POINTS[pointId]) {
          console.error(`Punto de extensión no válido: ${pointId}`);
          return false;
        }
        
        // Registrar el componente para ese punto de extensión
        if (!window.__pluginExtensions) {
          window.__pluginExtensions = {};
        }
        
        if (!window.__pluginExtensions[pointId]) {
          window.__pluginExtensions[pointId] = [];
        }
        
        window.__pluginExtensions[pointId].push({
          pluginId,
          component,
          options
        });
        
        // Notificar que un componente ha sido registrado
        if (apis.events) {
          apis.events.publish('app.pluginComponentRegistered', {
            pluginId,
            pointId,
            options
          });
        }
        
        return true;
      },
      
      // Obtener todos los componentes registrados para un punto de extensión
      getRegisteredComponents: (pointId) => {
        if (!window.__pluginExtensions || !window.__pluginExtensions[pointId]) {
          return [];
        }
        
        return window.__pluginExtensions[pointId];
      },
      
      // Desregistrar todos los componentes de un plugin
      unregisterComponents: (pluginId) => {
        if (!window.__pluginExtensions) return;
        
        Object.keys(window.__pluginExtensions).forEach(pointId => {
          window.__pluginExtensions[pointId] = window.__pluginExtensions[pointId].filter(
            registration => registration.pluginId !== pluginId
          );
        });
      },
      
      // Obtener los puntos de extensión disponibles
      getExtensionPoints: () => {
        return Object.keys(EXTENSION_POINTS);
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
    },
    
    // API de calendario (específico para plugins de calendario)
    calendar: {
      // Obtener eventos del calendario
      getEvents: () => {
        const calendarModule = apis.getModule ? apis.getModule('calendar') : null;
        return calendarModule?.getEvents ? calendarModule.getEvents() : [];
      },
      
      // Crear un evento en el calendario
      createEvent: (eventData) => {
        const calendarModule = apis.getModule ? apis.getModule('calendar') : null;
        return calendarModule?.createEvent ? calendarModule.createEvent(eventData) : null;
      },
      
      // Actualizar un evento en el calendario
      updateEvent: (eventId, eventData) => {
        const calendarModule = apis.getModule ? apis.getModule('calendar') : null;
        return calendarModule?.updateEvent ? calendarModule.updateEvent(eventId, eventData) : null;
      },
      
      // Obtener máximo de eventos simultáneos permitidos
      getMaxSimultaneousEvents: () => {
        const calendarModule = apis.getModule ? apis.getModule('calendar') : null;
        return calendarModule?.getMaxSimultaneousEvents ? calendarModule.getMaxSimultaneousEvents() : 3;
      }
    },
    
    // Utilidades de información
    info: {
      // Obtener la versión de la aplicación
      getAppVersion: () => {
        return window.APP_VERSION || '0.3.0';
      },
      
      // Obtener la lista de plugins activos
      getActivePlugins: () => {
        return pluginRegistry.getEnabledPlugins().map(plugin => ({
          id: plugin.id,
          name: plugin.name,
          version: plugin.version
        }));
      }
    },
    
    // Utilidades de permisos
    permissions: {
      // Verificar si el plugin tiene un permiso específico
      hasPermission: (pluginId, permission) => {
        return pluginRegistry.hasPermission(pluginId, permission);
      },
      
      // Solicitar un permiso adicional en tiempo de ejecución
      requestPermission: async (pluginId, permission) => {
        return await pluginRegistry.requestPermission(pluginId, permission);
      }
    }
  };
}

// Exportar para uso en la aplicación
export { pluginRegistry, pluginLoader, PLUGIN_EVENTS, EXTENSION_POINTS };