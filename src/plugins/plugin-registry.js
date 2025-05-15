/**
 * Plugin Registry para Atlas
 * 
 * Gestiona el registro de plugins, su compatibilidad con la aplicación
 * y expone una API para interactuar con los plugins instalados.
 */
import eventBus, { EventCategories } from '../core/bus/event-bus';
import storageService from '../services/storage-service';
import pluginLoader, { PLUGIN_EVENTS } from './plugin-loader';
import { STORAGE_KEYS } from '../core/config/constants';

// Versión actual de la aplicación (debe actualizarse con cada versión)
const APP_VERSION = '0.3.0';

class PluginRegistry {
  constructor() {
    this.isInitialized = false;
    this.core = null;
  }

  /**
   * Inicializa el registro de plugins
   * @param {Object} core - Objeto con APIs para los plugins
   * @returns {Promise<Array>} - Plugins instalados y habilitados
   */
  async initialize(core) {
    if (this.isInitialized) return pluginLoader.getEnabledPlugins();
    
    this.core = core;
    
    try {
      await pluginLoader.initialize(core);
      
      // Registrar eventos para el registry
      this._setupEventListeners();
      
      this.isInitialized = true;
      return pluginLoader.getEnabledPlugins();
    } catch (error) {
      console.error('Error al inicializar el registro de plugins:', error);
      return [];
    }
  }

  /**
   * Configura los listeners de eventos para el registro
   * @private
   */
  _setupEventListeners() {
    // Escuchar eventos de plugins
    eventBus.subscribe(`${EventCategories.APP}.${PLUGIN_EVENTS.INITIALIZED}`, (data) => {
      console.log(`Plugin Registry: Plugin inicializado: ${data.pluginName}`);
    });
    
    eventBus.subscribe(`${EventCategories.APP}.${PLUGIN_EVENTS.ERROR}`, (data) => {
      console.error(`Plugin Registry: Error en plugin ${data.pluginName}: ${data.message}`);
    });
  }

  /**
   * Obtiene la lista completa de plugins
   * @returns {Array} - Lista de plugins con su estado
   */
  getAllPlugins() {
    return pluginLoader.getAllPlugins();
  }

  /**
   * Obtiene la lista de plugins habilitados
   * @returns {Array} - Lista de plugins habilitados
   */
  getEnabledPlugins() {
    return pluginLoader.getEnabledPlugins();
  }

  /**
   * Habilita un plugin específico
   * @param {string} pluginId - ID del plugin a habilitar
   * @returns {Promise<boolean>} - Resultado de la habilitación
   */
  async enablePlugin(pluginId) {
    return await pluginLoader.enablePlugin(pluginId);
  }

  /**
   * Deshabilita un plugin específico
   * @param {string} pluginId - ID del plugin a deshabilitar
   * @returns {Promise<boolean>} - Resultado de la deshabilitación
   */
  async disablePlugin(pluginId) {
    return await pluginLoader.disablePlugin(pluginId);
  }

  /**
   * Verifica si un plugin es compatible con la versión actual de la aplicación
   * @param {Object} plugin - Plugin a verificar
   * @returns {boolean} - true si es compatible
   */
  checkPluginCompatibility(plugin) {
    if (!plugin?.version) return false;
    
    // Si no especifica versiones, se asume compatible
    if (!plugin.minAppVersion && !plugin.maxAppVersion) return true;
    
    // Verificar versión mínima
    if (plugin.minAppVersion) {
      if (compareVersions(APP_VERSION, plugin.minAppVersion) < 0) {
        return false; // Versión actual menor a la mínima requerida
      }
    }
    
    // Verificar versión máxima
    if (plugin.maxAppVersion) {
      if (compareVersions(APP_VERSION, plugin.maxAppVersion) > 0) {
        return false; // Versión actual mayor a la máxima soportada
      }
    }
    
    return true;
  }

  /**
   * Guarda la configuración de un plugin específico
   * @param {string} pluginId - ID del plugin
   * @param {Object} config - Configuración a guardar
   * @returns {Promise<boolean>} - Resultado del guardado
   */
  async savePluginConfig(pluginId, config) {
    try {
      const storageKey = `${STORAGE_KEYS.PLUGIN_CONFIG}.${pluginId}`;
      await storageService.set(storageKey, config);
      return true;
    } catch (error) {
      console.error(`Error al guardar configuración del plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Carga la configuración de un plugin específico
   * @param {string} pluginId - ID del plugin
   * @returns {Promise<Object>} - Configuración del plugin
   */
  async loadPluginConfig(pluginId) {
    try {
      const storageKey = `${STORAGE_KEYS.PLUGIN_CONFIG}.${pluginId}`;
      return await storageService.get(storageKey, {});
    } catch (error) {
      console.error(`Error al cargar configuración del plugin ${pluginId}:`, error);
      return {};
    }
  }
}

/**
 * Compara dos versiones en formato semántico (x.y.z)
 * @param {string} v1 - Primera versión
 * @param {string} v2 - Segunda versión
 * @returns {number} - -1 si v1 < v2, 0 si v1 = v2, 1 si v1 > v2
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  // Comparar cada parte
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0; // Iguales
}

// Exportar una única instancia para toda la aplicación
const pluginRegistry = new PluginRegistry();
export default pluginRegistry;