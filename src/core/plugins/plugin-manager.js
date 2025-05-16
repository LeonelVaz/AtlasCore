/**
 * Gestor de plugins para Atlas
 * 
 * Este módulo coordina todas las operaciones relacionadas con plugins:
 * carga, inicialización, activación, desactivación, etc.
 */

import { loadPlugins, loadPluginById } from './plugin-loader';
import pluginRegistry from './plugin-registry';
import coreAPI from './core-api';

/**
 * Clase principal para gestión de plugins
 */
class PluginManager {
  constructor() {
    this.initialized = false;
    this.loading = false;
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
      
      // Inicializar la API Core
      coreAPI.init(services);
      
      // Cargar plugins disponibles
      const plugins = await loadPlugins();
      
      // Registrar plugins
      let registeredCount = 0;
      for (const plugin of plugins) {
        const success = pluginRegistry.registerPlugin(plugin);
        if (success) registeredCount++;
      }
      
      console.log(`Sistema de plugins inicializado. ${registeredCount} plugins registrados.`);
      
      this.initialized = true;
      this.loading = false;
      
      return true;
    } catch (error) {
      console.error('Error al inicializar el sistema de plugins:', error);
      this.loading = false;
      return false;
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
      
      // Activar el plugin
      const activated = pluginRegistry.activatePlugin(pluginId, coreAPI);
      return activated;
    } catch (error) {
      console.error(`Error al activar plugin [${pluginId}]:`, error);
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
      // Desactivar el plugin
      const deactivated = pluginRegistry.deactivatePlugin(pluginId);
      return deactivated;
    } catch (error) {
      console.error(`Error al desactivar plugin [${pluginId}]:`, error);
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
   * Recarga todos los plugins disponibles
   * @returns {Promise<boolean>} - true si se recargaron correctamente
   */
  async reloadPlugins() {
    if (!this.initialized) {
      console.error('El gestor de plugins no está inicializado');
      return false;
    }
    
    try {
      // Desactivar todos los plugins activos
      const activePlugins = pluginRegistry.getActivePlugins();
      
      for (const plugin of activePlugins) {
        await this.deactivatePlugin(plugin.id);
      }
      
      // Volver a cargar los plugins
      const plugins = await loadPlugins();
      
      // Registrar nuevos plugins encontrados
      let registeredCount = 0;
      for (const plugin of plugins) {
        const success = pluginRegistry.registerPlugin(plugin);
        if (success) registeredCount++;
      }
      
      console.log(`Plugins recargados. ${registeredCount} plugins registrados.`);
      
      // Reactivar los plugins que estaban activos
      let activatedCount = 0;
      for (const plugin of activePlugins) {
        const success = await this.activatePlugin(plugin.id);
        if (success) activatedCount++;
      }
      
      console.log(`${activatedCount}/${activePlugins.length} plugins reactivados.`);
      
      return true;
    } catch (error) {
      console.error('Error al recargar plugins:', error);
      return false;
    }
  }
}

// Exportar instancia única
const pluginManager = new PluginManager();
export default pluginManager;