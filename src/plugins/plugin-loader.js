/**
 * Plugin Loader para Atlas
 * 
 * Gestiona la carga, inicialización y ciclo de vida de los plugins.
 */
import eventBus, { EventCategories } from '../core/bus/event-bus';
import storageService from '../services/storage-service';
import { STORAGE_KEYS } from '../core/config/constants';
import { isElectronEnv } from '../utils/electron-detector';

// Canal de eventos específico para plugins
export const PLUGIN_EVENTS = {
  LOADED: 'plugin.loaded',
  INITIALIZED: 'plugin.initialized',
  ERROR: 'plugin.error',
  ENABLED: 'plugin.enabled',
  DISABLED: 'plugin.disabled',
  CONFIG_CHANGED: 'plugin.configChanged',
  PERMISSION_CHANGED: 'plugin.permissionChanged'
};

// Directorio base para plugins integrados (importados como módulos)
const PLUGIN_MODULES = {
  // Plugins integrados
  'notes-manager': () => import('./notes-manager')
  // Se pueden añadir más plugins integrados aquí
};

class PluginLoader {
  constructor() {
    this.plugins = {};
    this.enabledPlugins = {};
    this.core = null;
    this.isInitialized = false;
    this.pluginErrors = {}; // Almacena errores por plugin
    this.pluginLoadingStatus = {}; // Almacena estado de carga
    this.pluginTimeouts = {}; // Para gestionar timeouts de inicialización
  }

  /**
   * Inicializa el sistema de plugins
   * @param {Object} core - Objeto con APIs para los plugins
   * @returns {Promise<Array>} - Plugins cargados e inicializados
   */
  async initialize(core) {
    if (this.isInitialized) return Object.values(this.enabledPlugins);

    this.core = core;
    
    try {
      // Cargar configuración de plugins habilitados
      const storedPluginState = await storageService.get(STORAGE_KEYS.PLUGINS_STATE, {});
      
      // Descubrir plugins disponibles
      await this.discoverPlugins();
      
      // Inicializar plugins habilitados
      await this.initializeEnabledPlugins(storedPluginState);
      
      this.isInitialized = true;
      return Object.values(this.enabledPlugins);
    } catch (error) {
      console.error('Error al inicializar el sistema de plugins:', error);
      eventBus.publish(`${EventCategories.APP}.${PLUGIN_EVENTS.ERROR}`, {
        message: 'Error al inicializar el sistema de plugins',
        error
      });
      return [];
    }
  }

  /**
   * Descubre los plugins disponibles en el sistema
   * @returns {Promise<void>}
   */
  async discoverPlugins() {
    try {
      console.log('Buscando plugins disponibles...');
      
      // Intentar cargar plugins desde el sistema de archivos en Electron
      if (isElectronEnv() && window.electronAPI?.plugins?.loadPlugins) {
        try {
          console.log('Detectado entorno Electron, cargando plugins del sistema...');
          const plugins = await window.electronAPI.plugins.loadPlugins();
          
          if (Array.isArray(plugins) && plugins.length > 0) {
            console.log(`Se encontraron ${plugins.length} plugins en el sistema.`);
            plugins.forEach(plugin => this.registerPlugin(plugin));
          } else {
            console.log('No se encontraron plugins en el sistema de archivos.');
          }
        } catch (err) {
          console.warn('Error al cargar plugins desde Electron:', err);
        }
      }
      
      // Cargar plugins integrados (definidos en PLUGIN_MODULES)
      for (const [pluginId, importFunc] of Object.entries(PLUGIN_MODULES)) {
        try {
          this.pluginLoadingStatus[pluginId] = 'loading';
          const moduleExport = await importFunc();
          this.pluginLoadingStatus[pluginId] = 'loaded';
          
          // Verificar que el módulo exporta un objeto por defecto
          const plugin = moduleExport.default;
          
          if (plugin && this.validatePluginStructure(plugin)) {
            this.registerPlugin(plugin);
          } else {
            console.error(`Plugin integrado ${pluginId} tiene una estructura inválida.`);
            this.pluginErrors[pluginId] = 'Estructura de plugin inválida';
            this.pluginLoadingStatus[pluginId] = 'error';
          }
        } catch (err) {
          console.warn(`Error al cargar plugin integrado ${pluginId}:`, err);
          this.pluginErrors[pluginId] = err.message;
          this.pluginLoadingStatus[pluginId] = 'error';
        }
      }
      
    } catch (error) {
      console.error('Error al descubrir plugins:', error);
    }
  }

  /**
   * Registra un plugin en el sistema
   * @param {Object} plugin - Objeto del plugin con métodos init y cleanup
   * @returns {boolean} - Resultado del registro
   */
  registerPlugin(plugin) {
    try {
      // Validar estructura básica del plugin
      if (!this.validatePluginStructure(plugin)) {
        console.error(`Plugin inválido:`, plugin);
        this.pluginErrors[plugin?.id || 'unknown'] = 'Estructura de plugin inválida';
        return false;
      }
      
      // Evitar duplicados
      if (this.plugins[plugin.id]) {
        console.warn(`Plugin ${plugin.id} ya está registrado.`);
        return false;
      }
      
      // Registrar plugin
      this.plugins[plugin.id] = plugin;
      this.pluginLoadingStatus[plugin.id] = 'registered';
      console.log(`Plugin registrado: ${plugin.name} (${plugin.id}) v${plugin.version}`);
      
      // Notificar que un plugin se ha cargado
      eventBus.publish(`${EventCategories.APP}.${PLUGIN_EVENTS.LOADED}`, {
        pluginId: plugin.id,
        pluginName: plugin.name,
        version: plugin.version
      });
      
      return true;
    } catch (error) {
      console.error(`Error al registrar plugin ${plugin?.id || 'desconocido'}:`, error);
      this.pluginErrors[plugin?.id || 'unknown'] = error.message;
      return false;
    }
  }

  /**
   * Inicializa los plugins habilitados
   * @param {Object} pluginState - Estado de habilitación de plugins
   * @returns {Promise<Array>} - Plugins inicializados
   */
  async initializeEnabledPlugins(pluginState) {
    const initializedPlugins = [];
    
    // Procesar cada plugin registrado
    for (const [pluginId, plugin] of Object.entries(this.plugins)) {
      // Verificar si está habilitado (por defecto sí para plugins integrados en esta versión)
      const isEnabled = pluginState[pluginId] !== false;
      
      if (isEnabled) {
        try {
          // Establecer timeout para la inicialización
          const initPromise = new Promise((resolve, reject) => {
            // Almacenar la referencia del timeout para limpieza
            this.pluginTimeouts[pluginId] = setTimeout(() => {
              reject(new Error(`Timeout al inicializar plugin ${pluginId}`));
            }, 5000); // 5 segundos de timeout
            
            try {
              // Marcar como inicializando
              this.pluginLoadingStatus[pluginId] = 'initializing';
              
              // Llamar al método init del plugin
              const success = plugin.init(this.core);
              
              // Limpiar el timeout ya que terminó correctamente
              clearTimeout(this.pluginTimeouts[pluginId]);
              delete this.pluginTimeouts[pluginId];
              
              resolve(success);
            } catch (err) {
              clearTimeout(this.pluginTimeouts[pluginId]);
              delete this.pluginTimeouts[pluginId];
              reject(err);
            }
          });
          
          const success = await initPromise;
          
          if (success) {
            this.enabledPlugins[pluginId] = plugin;
            initializedPlugins.push(plugin);
            this.pluginLoadingStatus[pluginId] = 'initialized';
            
            eventBus.publish(`${EventCategories.APP}.${PLUGIN_EVENTS.INITIALIZED}`, {
              pluginId,
              pluginName: plugin.name
            });
            
            console.log(`Plugin inicializado: ${plugin.name} (${plugin.id})`);
          } else {
            console.error(`Plugin ${plugin.id} falló durante la inicialización.`);
            this.pluginErrors[pluginId] = 'Inicialización fallida';
            this.pluginLoadingStatus[pluginId] = 'error';
          }
        } catch (error) {
          console.error(`Error al inicializar plugin ${plugin.id}:`, error);
          this.pluginErrors[pluginId] = error.message;
          this.pluginLoadingStatus[pluginId] = 'error';
          
          eventBus.publish(`${EventCategories.APP}.${PLUGIN_EVENTS.ERROR}`, {
            pluginId,
            pluginName: plugin.name,
            message: `Error al inicializar plugin ${plugin.name}`,
            error
          });
        }
      }
    }
    
    return initializedPlugins;
  }

  /**
   * Habilita un plugin específico
   * @param {string} pluginId - ID del plugin a habilitar
   * @returns {Promise<boolean>} - Resultado de la habilitación
   */
  async enablePlugin(pluginId) {
    try {
      const plugin = this.plugins[pluginId];
      if (!plugin) {
        console.error(`Plugin ${pluginId} no encontrado.`);
        return false;
      }
      
      // Evitar reiniciar si ya está habilitado
      if (this.enabledPlugins[pluginId]) {
        console.warn(`Plugin ${pluginId} ya está habilitado.`);
        return true;
      }
      
      // Inicializar el plugin con timeout
      const initPromise = new Promise((resolve, reject) => {
        // Almacenar la referencia del timeout para limpieza
        this.pluginTimeouts[pluginId] = setTimeout(() => {
          reject(new Error(`Timeout al habilitar plugin ${pluginId}`));
        }, 5000); // 5 segundos de timeout
        
        try {
          // Marcar como inicializando
          this.pluginLoadingStatus[pluginId] = 'initializing';
          
          // Llamar al método init del plugin
          const success = plugin.init(this.core);
          
          // Limpiar el timeout ya que terminó correctamente
          clearTimeout(this.pluginTimeouts[pluginId]);
          delete this.pluginTimeouts[pluginId];
          
          resolve(success);
        } catch (err) {
          clearTimeout(this.pluginTimeouts[pluginId]);
          delete this.pluginTimeouts[pluginId];
          reject(err);
        }
      });
      
      const success = await initPromise;
      
      if (!success) {
        console.error(`Plugin ${pluginId} falló durante la inicialización.`);
        this.pluginErrors[pluginId] = 'Inicialización fallida';
        this.pluginLoadingStatus[pluginId] = 'error';
        return false;
      }
      
      // Actualizar estado
      this.enabledPlugins[pluginId] = plugin;
      this.pluginLoadingStatus[pluginId] = 'initialized';
      
      // Persistir el estado actualizado
      await this.savePluginsState();
      
      // Notificar
      eventBus.publish(`${EventCategories.APP}.${PLUGIN_EVENTS.ENABLED}`, {
        pluginId,
        pluginName: plugin.name
      });
      
      console.log(`Plugin habilitado: ${plugin.name} (${plugin.id})`);
      return true;
    } catch (error) {
      console.error(`Error al habilitar plugin ${pluginId}:`, error);
      this.pluginErrors[pluginId] = error.message;
      this.pluginLoadingStatus[pluginId] = 'error';
      return false;
    }
  }

  /**
   * Deshabilita un plugin específico
   * @param {string} pluginId - ID del plugin a deshabilitar
   * @returns {Promise<boolean>} - Resultado de la deshabilitación
   */
  async disablePlugin(pluginId) {
    try {
      const plugin = this.enabledPlugins[pluginId];
      if (!plugin) {
        console.warn(`Plugin ${pluginId} no está habilitado.`);
        return true;
      }
      
      // Ejecutar limpieza con timeout
      const cleanupPromise = new Promise((resolve, reject) => {
        // Almacenar la referencia del timeout para limpieza
        this.pluginTimeouts[pluginId] = setTimeout(() => {
          reject(new Error(`Timeout al deshabilitar plugin ${pluginId}`));
        }, 5000); // 5 segundos de timeout
        
        try {
          // Marcar como deshabilitando
          this.pluginLoadingStatus[pluginId] = 'disabling';
          
          // Llamar al método cleanup del plugin
          const success = plugin.cleanup(this.core);
          
          // Limpiar el timeout ya que terminó correctamente
          clearTimeout(this.pluginTimeouts[pluginId]);
          delete this.pluginTimeouts[pluginId];
          
          resolve(success);
        } catch (err) {
          clearTimeout(this.pluginTimeouts[pluginId]);
          delete this.pluginTimeouts[pluginId];
          reject(err);
        }
      });
      
      const success = await cleanupPromise;
      
      if (!success) {
        console.error(`Plugin ${pluginId} falló durante la limpieza.`);
        // No cancelamos la deshabilitación aunque falle la limpieza
      }
      
      // Actualizar estado
      delete this.enabledPlugins[pluginId];
      this.pluginLoadingStatus[pluginId] = 'disabled';
      
      // Eliminar componentes UI registrados por este plugin
      if (window.__pluginExtensions) {
        // Para cada punto de extensión
        Object.keys(window.__pluginExtensions).forEach(pointId => {
          // Filtrar componentes de este plugin
          window.__pluginExtensions[pointId] = window.__pluginExtensions[pointId].filter(
            reg => reg.pluginId !== pluginId
          );
        });
      }
      
      // Persistir el estado actualizado
      await this.savePluginsState();
      
      // Notificar
      eventBus.publish(`${EventCategories.APP}.${PLUGIN_EVENTS.DISABLED}`, {
        pluginId,
        pluginName: plugin.name
      });
      
      console.log(`Plugin deshabilitado: ${plugin.name} (${plugin.id})`);
      return true;
    } catch (error) {
      console.error(`Error al deshabilitar plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Guarda el estado (habilitado/deshabilitado) de todos los plugins
   * @returns {Promise<boolean>} - Resultado del guardado
   */
  async savePluginsState() {
    try {
      const state = {};
      
      // Almacenar solo el estado para todos los plugins
      for (const pluginId in this.plugins) {
        state[pluginId] = !!this.enabledPlugins[pluginId];
      }
      
      await storageService.set(STORAGE_KEYS.PLUGINS_STATE, state);
      return true;
    } catch (error) {
      console.error('Error al guardar estado de plugins:', error);
      return false;
    }
  }

  /**
   * Obtiene la lista de todos los plugins (habilitados y deshabilitados)
   * @returns {Array} - Lista de plugins con su estado
   */
  getAllPlugins() {
    return Object.entries(this.plugins).map(([pluginId, plugin]) => ({
      id: pluginId,
      name: plugin.name,
      version: plugin.version,
      description: plugin.description || '',
      author: plugin.author || '',
      enabled: !!this.enabledPlugins[pluginId],
      status: this.pluginLoadingStatus[pluginId] || 'unknown',
      error: this.pluginErrors[pluginId] || null
    }));
  }

  /**
   * Obtiene la lista de plugins habilitados
   * @returns {Array} - Lista de plugins habilitados
   */
  getEnabledPlugins() {
    return Object.values(this.enabledPlugins);
  }

  /**
   * Obtiene los errores de un plugin específico
   * @param {string} pluginId - ID del plugin
   * @returns {string|null} - Mensaje de error o null si no hay errores
   */
  getPluginError(pluginId) {
    return this.pluginErrors[pluginId] || null;
  }

  /**
   * Obtiene el estado de carga de un plugin específico
   * @param {string} pluginId - ID del plugin
   * @returns {string} - Estado de carga ('loading', 'loaded', 'initialized', etc.)
   */
  getPluginStatus(pluginId) {
    return this.pluginLoadingStatus[pluginId] || 'unknown';
  }

  /**
   * Valida la estructura básica de un plugin
   * @param {Object} plugin - Plugin a validar
   * @returns {boolean} - Resultado de la validación
   */
  validatePluginStructure(plugin) {
    // Verificar propiedades requeridas
    if (!plugin || typeof plugin !== 'object') return false;
    if (!plugin.id || !plugin.name || !plugin.version) return false;
    
    // Verificar métodos requeridos
    if (typeof plugin.init !== 'function') return false;
    if (typeof plugin.cleanup !== 'function') return false;
    
    return true;
  }
  
  /**
   * Limpia todos los recursos asignados a los plugins
   * Útil antes de recargar la aplicación
   */
  cleanup() {
    // Cancelar todos los timeouts pendientes
    Object.keys(this.pluginTimeouts).forEach(pluginId => {
      clearTimeout(this.pluginTimeouts[pluginId]);
    });
    
    // Llamar a cleanup en todos los plugins habilitados
    Object.entries(this.enabledPlugins).forEach(([pluginId, plugin]) => {
      try {
        plugin.cleanup(this.core);
      } catch (error) {
        console.error(`Error al limpiar plugin ${pluginId}:`, error);
      }
    });
    
    // Limpiar colecciones
    this.plugins = {};
    this.enabledPlugins = {};
    this.pluginErrors = {};
    this.pluginLoadingStatus = {};
    this.pluginTimeouts = {};
    this.isInitialized = false;
  }
}

// Exportar una única instancia para toda la aplicación
const pluginLoader = new PluginLoader();
export default pluginLoader;