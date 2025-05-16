/**
 * Gestor de plugins para Atlas
 * 
 * Este módulo coordina todas las operaciones relacionadas con plugins:
 * carga, inicialización, activación, desactivación, etc.
 */

import { loadPlugins, loadPluginById } from './plugin-loader';
import pluginRegistry from './plugin-registry';
import coreAPI from './core-api';
import storageService from '../../services/storage-service';
import { STORAGE_KEYS } from '../../core/config/constants';
import eventBus from '../../core/bus/event-bus';

// Constantes
const PLUGIN_STATE_KEY = 'atlas_plugin_states';
const PLUGIN_EVENT_PREFIX = 'plugin.';

/**
 * Clase principal para gestión de plugins
 */
class PluginManager {
  constructor() {
    this.initialized = false;
    this.loading = false;
    this.error = null;
    
    // Suscriptores a eventos del sistema de plugins
    this._subscribers = {};
    this._lastSubscriberId = 0;
  }

  /**
   * Inicializa el sistema de plugins
   * @param {Object} services - Servicios internos a proporcionar a la API
   * @returns {Promise<boolean>} - true si se inicializó correctamente
   */
  async initialize(services = {}) {
    if (this.initialized) {
      console.warn('El gestor de plugins ya está inicializado');
      return true;
    }
    
    try {
      this.loading = true;
      this.error = null;
      
      // Inicializar la API Core
      coreAPI.init(services);
      
      // Cargar estados previos de plugins
      await this._loadPluginStates();
      
      // Cargar plugins disponibles
      const plugins = await loadPlugins();
      
      // Registrar plugins
      let registeredCount = 0;
      for (const plugin of plugins) {
        const success = pluginRegistry.registerPlugin(plugin);
        if (success) registeredCount++;
      }
      
      // Activar automáticamente plugins según estado previo
      await this._activatePluginsFromState();
      
      console.log(`Sistema de plugins inicializado. ${registeredCount} plugins registrados.`);
      
      // Publicar evento de inicialización
      this._publishEvent('initialized', { 
        pluginsCount: registeredCount,
        activePlugins: pluginRegistry.getActivePlugins().map(p => p.id)
      });
      
      this.initialized = true;
      this.loading = false;
      
      return true;
    } catch (error) {
      console.error('Error al inicializar el sistema de plugins:', error);
      this.error = error.message || 'Error desconocido al inicializar plugins';
      this.loading = false;
      
      // Publicar evento de error
      this._publishEvent('error', { error: this.error });
      
      return false;
    }
  }

  /**
   * Carga el estado anterior de los plugins desde almacenamiento
   * @private
   */
  async _loadPluginStates() {
    try {
      // Cargar estados previos
      const pluginStates = await storageService.get(PLUGIN_STATE_KEY, {});
      
      // Establecer estados en el registro
      pluginRegistry.setPluginStates(pluginStates);
      
      return true;
    } catch (error) {
      console.error('Error al cargar estados de plugins:', error);
      return false;
    }
  }

  /**
   * Guarda el estado actual de los plugins en almacenamiento
   * @private
   */
  async _savePluginStates() {
    try {
      // Obtener estados actuales
      const pluginStates = pluginRegistry.getPluginStates();
      
      // Guardar en almacenamiento
      await storageService.set(PLUGIN_STATE_KEY, pluginStates);
      
      return true;
    } catch (error) {
      console.error('Error al guardar estados de plugins:', error);
      return false;
    }
  }

  /**
   * Activa plugins basado en estados previamente guardados
   * @private
   */
  async _activatePluginsFromState() {
    try {
      const pluginStates = pluginRegistry.getPluginStates();
      
      // Activar plugins marcados como activos
      for (const [pluginId, state] of Object.entries(pluginStates)) {
        if (state.active) {
          await this.activatePlugin(pluginId);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error al activar plugins desde estado previo:', error);
      return false;
    }
  }

  /**
   * Publica un evento del sistema de plugins
   * @param {string} eventName - Nombre del evento sin prefijo
   * @param {Object} data - Datos del evento
   * @private
   */
  _publishEvent(eventName, data = {}) {
    // Publicar en el bus de eventos
    const fullEventName = `pluginSystem.${eventName}`;
    eventBus.publish(fullEventName, data);
    
    // Notificar a los suscriptores directos
    if (this._subscribers[eventName]) {
      Object.values(this._subscribers[eventName]).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en suscriptor a evento ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Activa un plugin por su ID
   * @param {string} pluginId - ID del plugin a activar
   * @returns {Promise<boolean>} - true si se activó correctamente
   */
  async activatePlugin(pluginId) {
    if (!this.initialized) {
      console.error('El gestor de plugins no está inicializado');
      return false;
    }
    
    try {
      // Verificar si ya está registrado
      let plugin = pluginRegistry.getPlugin(pluginId);
      
      // Si no está registrado, intentar cargarlo
      if (!plugin) {
        plugin = await loadPluginById(pluginId);
        
        if (!plugin) {
          console.error(`No se pudo cargar el plugin: ${pluginId}`);
          return false;
        }
        
        // Registrar el plugin recién cargado
        const registered = pluginRegistry.registerPlugin(plugin);
        if (!registered) {
          console.error(`No se pudo registrar el plugin: ${pluginId}`);
          return false;
        }
      }
      
      // Si ya está activo, no hacer nada
      if (pluginRegistry.isPluginActive(pluginId)) {
        console.warn(`Plugin ya activo: ${pluginId}`);
        return true;
      }
      
      // Activar el plugin
      const activated = pluginRegistry.activatePlugin(pluginId, coreAPI);
      
      if (activated) {
        // Actualizar estado y guardar
        pluginRegistry.setPluginState(pluginId, { active: true, lastActivated: Date.now() });
        await this._savePluginStates();
        
        // Publicar evento
        this._publishEvent('pluginActivated', { pluginId, plugin });
      }
      
      return activated;
    } catch (error) {
      console.error(`Error al activar plugin [${pluginId}]:`, error);
      
      // Publicar evento de error
      this._publishEvent('error', { 
        pluginId, 
        operation: 'activate',
        error: error.message || 'Error desconocido'
      });
      
      return false;
    }
  }

  /**
   * Desactiva un plugin por su ID
   * @param {string} pluginId - ID del plugin a desactivar
   * @returns {Promise<boolean>} - true si se desactivó correctamente
   */
  async deactivatePlugin(pluginId) {
    if (!this.initialized) {
      console.error('El gestor de plugins no está inicializado');
      return false;
    }
    
    try {
      // Verificar si está activo
      if (!pluginRegistry.isPluginActive(pluginId)) {
        console.warn(`Plugin no activo: ${pluginId}`);
        return true;
      }
      
      // Obtener plugin antes de desactivarlo
      const plugin = pluginRegistry.getPlugin(pluginId);
      
      // Desactivar el plugin
      const deactivated = pluginRegistry.deactivatePlugin(pluginId);
      
      if (deactivated) {
        // Limpiar recursos del plugin en la API
        await coreAPI.cleanupPluginResources(pluginId);
        
        // Actualizar estado y guardar
        pluginRegistry.setPluginState(pluginId, { active: false, lastDeactivated: Date.now() });
        await this._savePluginStates();
        
        // Publicar evento
        this._publishEvent('pluginDeactivated', { pluginId, plugin });
      }
      
      return deactivated;
    } catch (error) {
      console.error(`Error al desactivar plugin [${pluginId}]:`, error);
      
      // Publicar evento de error
      this._publishEvent('error', { 
        pluginId, 
        operation: 'deactivate',
        error: error.message || 'Error desconocido'
      });
      
      return false;
    }
  }

  /**
   * Obtiene todos los plugins disponibles
   * @returns {Object[]} - Array de plugins
   */
  getAllPlugins() {
    if (!this.initialized) {
      console.warn('El gestor de plugins no está inicializado');
      return [];
    }
    
    return pluginRegistry.getAllPlugins();
  }

  /**
   * Obtiene todos los plugins activos
   * @returns {Object[]} - Array de plugins activos
   */
  getActivePlugins() {
    if (!this.initialized) {
      console.warn('El gestor de plugins no está inicializado');
      return [];
    }
    
    return pluginRegistry.getActivePlugins();
  }

  /**
   * Comprueba si un plugin está activo
   * @param {string} pluginId - ID del plugin
   * @returns {boolean} - true si el plugin está activo
   */
  isPluginActive(pluginId) {
    if (!this.initialized) {
      console.warn('El gestor de plugins no está inicializado');
      return false;
    }
    
    return pluginRegistry.isPluginActive(pluginId);
  }

  /**
   * Suscribe a eventos del sistema de plugins
   * @param {string} eventName - Nombre del evento sin prefijo
   * @param {Function} callback - Función a llamar cuando ocurra el evento
   * @returns {Function} - Función para cancelar suscripción
   */
  subscribe(eventName, callback) {
    if (typeof callback !== 'function') return () => {};
    
    const id = ++this._lastSubscriberId;
    
    if (!this._subscribers[eventName]) {
      this._subscribers[eventName] = {};
    }
    
    this._subscribers[eventName][id] = callback;
    
    // Devolver función para cancelar suscripción
    return () => {
      if (this._subscribers[eventName] && this._subscribers[eventName][id]) {
        delete this._subscribers[eventName][id];
        
        if (Object.keys(this._subscribers[eventName]).length === 0) {
          delete this._subscribers[eventName];
        }
      }
    };
  }

  /**
   * Recarga todos los plugins disponibles
   * @param {boolean} preserveState - Si se debe preservar el estado de activación
   * @returns {Promise<boolean>} - true si se recargaron correctamente
   */
  async reloadPlugins(preserveState = true) {
    if (!this.initialized) {
      console.error('El gestor de plugins no está inicializado');
      return false;
    }
    
    try {
      // Guardar IDs y estados de plugins activos
      const activePlugins = preserveState ? pluginRegistry.getActivePlugins() : [];
      const activePluginIds = activePlugins.map(p => p.id);
      
      // Desactivar todos los plugins activos
      for (const plugin of activePlugins) {
        await this.deactivatePlugin(plugin.id);
      }
      
      // Volver a cargar los plugins
      const plugins = await loadPlugins();
      
      // Limpiar registro existente
      pluginRegistry.clear();
      
      // Registrar nuevos plugins encontrados
      let registeredCount = 0;
      for (const plugin of plugins) {
        const success = pluginRegistry.registerPlugin(plugin);
        if (success) registeredCount++;
      }
      
      // Cargar estados desde almacenamiento
      await this._loadPluginStates();
      
      console.log(`Plugins recargados. ${registeredCount} plugins registrados.`);
      
      // Reactivar los plugins que estaban activos
      if (preserveState) {
        let activatedCount = 0;
        for (const pluginId of activePluginIds) {
          const success = await this.activatePlugin(pluginId);
          if (success) activatedCount++;
        }
        
        console.log(`${activatedCount}/${activePluginIds.length} plugins reactivados.`);
      }
      
      // Publicar evento
      this._publishEvent('pluginsReloaded', { 
        count: registeredCount,
        reactivated: preserveState ? activePluginIds : []
      });
      
      return true;
    } catch (error) {
      console.error('Error al recargar plugins:', error);
      
      // Publicar evento de error
      this._publishEvent('error', { 
        operation: 'reload',
        error: error.message || 'Error desconocido'
      });
      
      return false;
    }
  }

  /**
   * Obtiene datos del estado actual del sistema de plugins
   * @returns {Object} - Información del estado del sistema
   */
  getStatus() {
    return {
      initialized: this.initialized,
      loading: this.loading,
      error: this.error,
      totalPlugins: this.initialized ? pluginRegistry.getAllPlugins().length : 0,
      activePlugins: this.initialized ? pluginRegistry.getActivePlugins().length : 0,
      states: this.initialized ? pluginRegistry.getPluginStates() : {}
    };
  }
}

// Exportar instancia única
const pluginManager = new PluginManager();
export default pluginManager;