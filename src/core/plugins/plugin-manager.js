/**
 * Gestor de plugins para Atlas
 * 
 * Este módulo coordina todas las operaciones relacionadas con plugins:
 * carga, inicialización, activación, desactivación, etc.
 */

import { loadPlugins, loadPluginById, validatePluginCompatibility } from './plugin-loader';
import pluginRegistry from './plugin-registry';
import coreAPI from './core-api';
import storageService from '../../services/storage-service';
import { STORAGE_KEYS } from '../../core/config/constants';
import eventBus from '../../core/bus/event-bus';
import pluginCompatibility from './plugin-compatibility';
import pluginDependencyResolver from './plugin-dependency-resolver';

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
    
    // Registro de resultados de compatibilidad por plugin
    this._compatibilityResults = {};
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
      
      // Verificar compatibilidad y dependencias
      await this._verifyPluginCompatibility();
      
      // Marcar como inicializado antes de activar plugins
      this.initialized = true;
      
      // Activar automáticamente plugins según estado previo
      await this._activatePluginsFromState();
      
      console.log(`Sistema de plugins inicializado. ${registeredCount} plugins registrados.`);
      
      // Publicar evento de inicialización
      this._publishEvent('initialized', { 
        pluginsCount: registeredCount,
        activePlugins: pluginRegistry.getActivePlugins().map(p => p.id)
      });
      
      this.loading = false;
      
      return true;
    } catch (error) {
      console.error('Error al inicializar el sistema de plugins:', error);
      this.error = error.message || 'Error desconocido al inicializar plugins';
      this.loading = false;
      this.initialized = false; // Asegurarse de que no quede en estado inconsistente
      
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
      // Verificar que el sistema esté inicializado
      if (!this.initialized) {
        console.warn('No se pueden activar plugins, el sistema no está inicializado');
        return false;
      }
      
      const pluginStates = pluginRegistry.getPluginStates();
      
      // Obtener lista de plugins activos ordenados por dependencias
      const allPlugins = pluginRegistry.getAllPlugins();
      const sortedPluginIds = pluginDependencyResolver.calculateLoadOrder();
      
      // Mapeo de ID a objeto plugin
      const pluginsMap = {};
      allPlugins.forEach(plugin => {
        if (plugin && plugin.id) {
          pluginsMap[plugin.id] = plugin;
        }
      });
      
      // Activar plugins marcados como activos en orden de dependencias
      for (const pluginId of sortedPluginIds) {
        const state = pluginStates[pluginId];
        
        if (state && state.active && pluginsMap[pluginId]) {
          // Verificar compatibilidad antes de activar
          const compatResult = this._compatibilityResults[pluginId];
          
          if (compatResult && !compatResult.compatible) {
            console.warn(`Plugin ${pluginId} no se activará automáticamente debido a incompatibilidad: ${compatResult.reason}`);
            continue;
          }
          
          try {
            await this.activatePlugin(pluginId);
          } catch (error) {
            console.error(`Error al activar plugin ${pluginId} desde estado previo:`, error);
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error al activar plugins desde estado previo:', error);
      return false;
    }
  }

  /**
   * Verifica la compatibilidad y dependencias de todos los plugins registrados
   * @private
   */
  async _verifyPluginCompatibility() {
    try {
      // Limpiar resultados anteriores
      this._compatibilityResults = {};
      
      // Obtener todos los plugins registrados
      const allPlugins = pluginRegistry.getAllPlugins();
      
      // Verificar compatibilidad de cada plugin
      for (const plugin of allPlugins) {
        try {
          // Verificación completa
          const result = pluginCompatibility.runFullCompatibilityCheck(plugin);
          
          // Almacenar resultado
          this._compatibilityResults[plugin.id] = result;
          
          // Actualizar estado en el registro
          pluginRegistry.setPluginState(plugin.id, { 
            compatible: result.compatible,
            incompatibilityReason: result.compatible ? null : result.reason,
            lastCompatibilityCheck: Date.now()
          });
          
          if (!result.compatible) {
            console.warn(`Plugin ${plugin.id} incompatible: ${result.reason}`);
          }
        } catch (error) {
          console.error(`Error al verificar compatibilidad del plugin ${plugin.id}:`, error);
          this._compatibilityResults[plugin.id] = {
            compatible: false,
            reason: `Error en verificación: ${error.message}`
          };
        }
      }
      
      // Resolver dependencias y calcular el orden de carga
      pluginDependencyResolver.calculateLoadOrder();
      
      return true;
    } catch (error) {
      console.error('Error al verificar compatibilidad de plugins:', error);
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
      // Verificar compatibilidad antes de activar
      const compatResult = this._compatibilityResults[pluginId];
      
      if (compatResult && !compatResult.compatible) {
        console.error(`No se puede activar plugin incompatible: ${compatResult.reason}`);
        
        // Publicar evento de error de compatibilidad
        this._publishEvent('compatibilityError', {
          pluginId,
          reason: compatResult.reason,
          details: compatResult
        });
        
        return false;
      }
      
      // Verificar si ya está registrado
      let plugin = pluginRegistry.getPlugin(pluginId);
      
      // Si no está registrado, intentar cargarlo
      if (!plugin) {
        plugin = await loadPluginById(pluginId);
        
        if (!plugin) {
          console.error(`No se pudo cargar el plugin: ${pluginId}`);
          return false;
        }
        
        // Verificar compatibilidad del plugin recién cargado
        const validation = validatePluginCompatibility(plugin);
        
        if (!validation.valid) {
          console.error(`No se puede registrar plugin incompatible: ${validation.reason}`);
          
          // Publicar evento de error de compatibilidad
          this._publishEvent('compatibilityError', {
            pluginId,
            reason: validation.reason,
            details: validation.details
          });
          
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
      
      // Verificar que todas las dependencias estén activadas
      const dependencies = plugin.dependencies || [];
      
      if (dependencies.length > 0) {
        for (const dependency of dependencies) {
          const depId = typeof dependency === 'string' ? dependency : dependency.id;
          
          if (!depId) continue;
          
          // Verificar si la dependencia existe
          const depPlugin = pluginRegistry.getPlugin(depId);
          
          if (!depPlugin) {
            console.error(`Dependencia ${depId} no encontrada para el plugin ${pluginId}`);
            
            // Publicar evento de error de dependencia
            this._publishEvent('dependencyError', {
              pluginId,
              dependencyId: depId,
              reason: 'Dependencia no encontrada'
            });
            
            return false;
          }
          
          // Verificar si la dependencia está activa
          if (!pluginRegistry.isPluginActive(depId)) {
            console.log(`Activando dependencia ${depId} para el plugin ${pluginId}`);
            
            // Activar dependencia recursivamente
            const depActivated = await this.activatePlugin(depId);
            
            if (!depActivated) {
              console.error(`No se pudo activar la dependencia ${depId} para el plugin ${pluginId}`);
              
              // Publicar evento de error de dependencia
              this._publishEvent('dependencyError', {
                pluginId,
                dependencyId: depId,
                reason: 'No se pudo activar la dependencia'
              });
              
              return false;
            }
          }
        }
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
   * @param {boolean} force - Si es true, ignora las dependencias
   * @returns {Promise<boolean>} - true si se desactivó correctamente
   */
  async deactivatePlugin(pluginId, force = false) {
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
      
      // Si no es forzado, verificar que ningún plugin activo dependa de este
      if (!force) {
        const dependentPlugins = pluginDependencyResolver.getDependentPlugins(pluginId);
        const activeDependent = dependentPlugins.filter(depId => pluginRegistry.isPluginActive(depId));
        
        if (activeDependent.length > 0) {
          console.error(`No se puede desactivar plugin ${pluginId} porque ${activeDependent.length} plugins dependen de él`);
          
          // Publicar evento de error de dependencia
          this._publishEvent('dependencyError', {
            pluginId,
            dependent: activeDependent,
            reason: 'Otros plugins activos dependen de este'
          });
          
          return false;
        }
      }
      
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
    
    const plugins = pluginRegistry.getAllPlugins();
    
    // Añadir información de compatibilidad
    return plugins.map(plugin => {
      const compatResult = this._compatibilityResults[plugin.id];
      
      return {
        ...plugin,
        compatible: compatResult ? compatResult.compatible : true,
        incompatibilityReason: compatResult && !compatResult.compatible ? compatResult.reason : null
      };
    });
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
   * Comprueba si un plugin es compatible
   * @param {string} pluginId - ID del plugin
   * @returns {boolean} - true si el plugin es compatible
   */
  isPluginCompatible(pluginId) {
    if (!this.initialized || !this._compatibilityResults[pluginId]) {
      return true; // Asumir compatibilidad por defecto
    }
    
    return this._compatibilityResults[pluginId].compatible;
  }

  /**
   * Obtiene información de compatibilidad de un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {Object|null} - Información de compatibilidad o null
   */
  getPluginCompatibilityInfo(pluginId) {
    if (!this.initialized || !this._compatibilityResults[pluginId]) {
      return null;
    }
    
    return this._compatibilityResults[pluginId];
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
      
      // Limpiar compatibilidad
      this._compatibilityResults = {};
      
      // Registrar nuevos plugins encontrados
      let registeredCount = 0;
      for (const plugin of plugins) {
        const success = pluginRegistry.registerPlugin(plugin);
        if (success) registeredCount++;
      }
      
      // Verificar compatibilidad de los plugins
      await this._verifyPluginCompatibility();
      
      // Cargar estados desde almacenamiento
      await this._loadPluginStates();
      
      console.log(`Plugins recargados. ${registeredCount} plugins registrados.`);
      
      // Reactivar los plugins que estaban activos
      if (preserveState) {
        // Recalcular orden de carga
        const loadOrder = pluginDependencyResolver.calculateLoadOrder();
        const sortedActivePluginIds = loadOrder.filter(id => activePluginIds.includes(id));
        
        let activatedCount = 0;
        for (const pluginId of sortedActivePluginIds) {
          // Verificar si es compatible antes de reactivar
          if (this.isPluginCompatible(pluginId)) {
            const success = await this.activatePlugin(pluginId);
            if (success) activatedCount++;
          } else {
            console.warn(`Plugin ${pluginId} no se reactivará por incompatibilidad: ${this._compatibilityResults[pluginId]?.reason}`);
          }
        }
        
        console.log(`${activatedCount}/${sortedActivePluginIds.length} plugins reactivados.`);
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
   * Ejecuta una verificación de compatibilidad para un plugin específico
   * @param {string} pluginId - ID del plugin
   * @returns {Promise<Object>} - Resultado de la verificación
   */
  async checkPluginCompatibility(pluginId) {
    try {
      if (!this.initialized) {
        console.warn('El gestor de plugins no está inicializado');
        return { compatible: false, reason: 'Sistema de plugins no inicializado' };
      }
      
      const plugin = pluginRegistry.getPlugin(pluginId);
      
      if (!plugin) {
        return { compatible: false, reason: 'Plugin no encontrado' };
      }
      
      // Ejecutar verificación completa
      const result = pluginCompatibility.runFullCompatibilityCheck(plugin);
      
      // Actualizar registro interno
      this._compatibilityResults[pluginId] = result;
      
      // Actualizar estado en el registro
      pluginRegistry.setPluginState(pluginId, { 
        compatible: result.compatible,
        incompatibilityReason: result.compatible ? null : result.reason,
        lastCompatibilityCheck: Date.now()
      });
      
      return result;
    } catch (error) {
      console.error(`Error al verificar compatibilidad del plugin ${pluginId}:`, error);
      
      const errorResult = {
        compatible: false,
        reason: `Error en verificación: ${error.message}`,
        details: { error: error.message }
      };
      
      // Actualizar registro interno
      this._compatibilityResults[pluginId] = errorResult;
      
      return errorResult;
    }
  }

  /**
   * Obtiene datos del estado actual del sistema de plugins
   * @returns {Object} - Información del estado del sistema
   */
  getStatus() {
    const allPlugins = this.initialized ? pluginRegistry.getAllPlugins() : [];
    const activePlugins = this.initialized ? pluginRegistry.getActivePlugins() : [];
    
    return {
      initialized: this.initialized,
      loading: this.loading,
      error: this.error,
      totalPlugins: allPlugins.length,
      activePlugins: activePlugins.length,
      compatiblePlugins: allPlugins.filter(p => 
        this._compatibilityResults[p.id]?.compatible !== false
      ).length,
      incompatiblePlugins: allPlugins.filter(p => 
        this._compatibilityResults[p.id]?.compatible === false
      ).length,
      states: this.initialized ? pluginRegistry.getPluginStates() : {},
      cycles: pluginDependencyResolver.getDetectedCycles()
    };
  }
}

// Exportar instancia única
const pluginManager = new PluginManager();
export default pluginManager;