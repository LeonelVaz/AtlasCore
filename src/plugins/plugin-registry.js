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
import { 
  getDefaultPermissions, 
  isValidPermission, 
  hasHighRiskPermissions 
} from './plugin-permissions';

// Versión actual de la aplicación (debe actualizarse con cada versión)
const APP_VERSION = '0.3.0';

class PluginRegistry {
  constructor() {
    this.isInitialized = false;
    this.core = null;
    this.pluginPermissions = {}; // Almacena permisos por plugin
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
      // Cargar permisos guardados
      await this._loadPermissions();
      
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
   * Carga los permisos guardados para los plugins
   * @private
   */
  async _loadPermissions() {
    try {
      // Cargar permisos existentes
      const savedPermissions = await storageService.get('atlas_plugins_permissions', {});
      this.pluginPermissions = savedPermissions;
      
      // Para cada plugin, asegurar que tiene los permisos predeterminados
      const plugins = pluginLoader.getAllPlugins();
      
      for (const plugin of plugins) {
        if (!this.pluginPermissions[plugin.id]) {
          // Si no tiene permisos guardados, asignar los predeterminados
          this.pluginPermissions[plugin.id] = getDefaultPermissions();
        }
      }
      
      // Guardar permisos actualizados
      await this._savePermissions();
      
      console.log('Permisos de plugins cargados');
    } catch (error) {
      console.error('Error al cargar permisos de plugins:', error);
      this.pluginPermissions = {};
    }
  }

  /**
   * Guarda los permisos actuales de los plugins
   * @private
   */
  async _savePermissions() {
    try {
      await storageService.set('atlas_plugins_permissions', this.pluginPermissions);
      return true;
    } catch (error) {
      console.error('Error al guardar permisos de plugins:', error);
      return false;
    }
  }

  /**
   * Obtiene la lista completa de plugins
   * @param {Object} options - Opciones para filtrar plugins
   * @param {boolean} options.includeIntegrated - Incluir plugins integrados
   * @param {boolean} options.includeExternal - Incluir plugins externos
   * @returns {Array} - Lista de plugins con su estado
   */
  getAllPlugins(options = { includeIntegrated: true, includeExternal: true }) {
    const allPlugins = pluginLoader.getAllPlugins();
    
    // Si se incluyen ambos tipos, devolver todos
    if (options.includeIntegrated && options.includeExternal) {
      return allPlugins;
    }
    
    // Filtrar según las opciones
    return allPlugins.filter(plugin => {
      // Determinar si es un plugin integrado (simplificado para esta versión)
      // En versiones futuras podría mejorarse este criterio
      const isIntegrated = plugin.id.startsWith('atlas-');
      
      if (options.includeIntegrated && isIntegrated) return true;
      if (options.includeExternal && !isIntegrated) return true;
      
      return false;
    });
  }

  /**
   * Obtiene la lista de plugins habilitados
   * @returns {Array} - Lista de plugins habilitados
   */
  getEnabledPlugins() {
    return pluginLoader.getEnabledPlugins();
  }

  /**
   * Registra un nuevo plugin
   * @param {Object} plugin - Plugin a registrar
   * @returns {boolean} - Resultado del registro
   */
  registerPlugin(plugin) {
    // Verificar compatibilidad antes de registrar
    if (!this.checkPluginCompatibility(plugin)) {
      console.error(`Plugin ${plugin.id} no es compatible con esta versión de Atlas`);
      return false;
    }
    
    // Inicializar permisos predeterminados si no existen
    if (!this.pluginPermissions[plugin.id]) {
      this.pluginPermissions[plugin.id] = getDefaultPermissions();
      this._savePermissions();
    }
    
    return pluginLoader.registerPlugin(plugin);
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
  
  /**
   * Recarga los plugins disponibles en el sistema
   * @returns {Promise<Array>} - Plugins cargados
   */
  async refreshPlugins() {
    try {
      await pluginLoader.discoverPlugins();
      return this.getAllPlugins();
    } catch (error) {
      console.error('Error al recargar plugins:', error);
      return [];
    }
  }
  
  /**
   * Verifica si un plugin tiene un permiso específico
   * @param {string} pluginId - ID del plugin
   * @param {string} permissionId - ID del permiso
   * @returns {boolean} - true si tiene el permiso
   */
  hasPermission(pluginId, permissionId) {
    // Verificar validez del permiso
    if (!isValidPermission(permissionId)) {
      console.warn(`Permiso no válido: ${permissionId}`);
      return false;
    }
    
    // Si no hay permisos para este plugin, usar predeterminados
    if (!this.pluginPermissions[pluginId]) {
      this.pluginPermissions[pluginId] = getDefaultPermissions();
      this._savePermissions();
    }
    
    return this.pluginPermissions[pluginId][permissionId] === true;
  }
  
  /**
   * Solicita un permiso adicional para un plugin
   * @param {string} pluginId - ID del plugin
   * @param {string} permissionId - ID del permiso
   * @returns {Promise<boolean>} - true si se concedió el permiso
   */
  async requestPermission(pluginId, permissionId) {
    // Verificar validez del permiso
    if (!isValidPermission(permissionId)) {
      console.warn(`Permiso no válido: ${permissionId}`);
      return false;
    }
    
    // Si es de alto riesgo, mostrar confirmación al usuario
    if (hasHighRiskPermissions([permissionId])) {
      // En una implementación real, aquí se mostraría un diálogo al usuario
      
      // Por ahora, denegar automáticamente permisos de alto riesgo
      console.warn(`Permiso de alto riesgo ${permissionId} solicitado por ${pluginId}`);
      return false;
    }
    
    // Para permisos de bajo o medio riesgo, conceder automáticamente
    if (!this.pluginPermissions[pluginId]) {
      this.pluginPermissions[pluginId] = getDefaultPermissions();
    }
    
    this.pluginPermissions[pluginId][permissionId] = true;
    await this._savePermissions();
    
    return true;
  }
  
  /**
   * Establece explícitamente los permisos para un plugin
   * @param {string} pluginId - ID del plugin
   * @param {Object} permissions - Objeto de permisos
   * @returns {Promise<boolean>} - true si se actualizaron los permisos
   */
  async setPluginPermissions(pluginId, permissions) {
    // Validar permisos
    const invalidPermissions = Object.keys(permissions).filter(
      permId => !isValidPermission(permId)
    );
    
    if (invalidPermissions.length > 0) {
      console.warn(`Permisos no válidos para ${pluginId}:`, invalidPermissions);
    }
    
    // Actualizar permisos válidos
    if (!this.pluginPermissions[pluginId]) {
      this.pluginPermissions[pluginId] = getDefaultPermissions();
    }
    
    // Solo actualizar permisos válidos
    Object.keys(permissions).forEach(permId => {
      if (isValidPermission(permId)) {
        this.pluginPermissions[pluginId][permId] = !!permissions[permId];
      }
    });
    
    await this._savePermissions();
    return true;
  }
  
  /**
   * Obtiene los permisos actuales de un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {Object} - Objeto de permisos
   */
  getPluginPermissions(pluginId) {
    if (!this.pluginPermissions[pluginId]) {
      this.pluginPermissions[pluginId] = getDefaultPermissions();
      this._savePermissions();
    }
    
    return { ...this.pluginPermissions[pluginId] };
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