/**
 * Registro de plugins para Atlas
 * 
 * Este módulo se encarga de mantener un registro de los plugins
 * disponibles y su estado actual (activo/inactivo)
 */

/**
 * Clase que mantiene el registro de plugins
 */
class PluginRegistry {
  constructor() {
    // Mapeo de ID -> objeto plugin
    this.plugins = {};
    
    // Mapeo de ID -> estado activo (boolean)
    this.activePlugins = {};
    
    // Almacenar instancias inicializadas
    this.instances = {};
    
    // Estados adicionales de los plugins (metadata)
    this.pluginStates = {};
    
    // Plugins con error
    this.pluginErrors = {};
    
    // Información de dependencias
    this.pluginDependencies = {};
    
    // Información de conflictos
    this.pluginConflicts = {};
  }

  /**
   * Registra un plugin en el sistema
   * @param {Object} plugin - Plugin a registrar
   * @returns {boolean} - true si se registró correctamente
   */
  registerPlugin(plugin) {
    try {
      if (!plugin || !plugin.id) {
        console.error('Intento de registrar plugin sin ID');
        return false;
      }
      
      if (this.plugins[plugin.id]) {
        console.warn(`El plugin ${plugin.id} ya está registrado, será sobrescrito`);
      }
      
      this.plugins[plugin.id] = plugin;
      
      // Por defecto, los plugins no están activos al registrarse
      if (this.activePlugins[plugin.id] === undefined) {
        this.activePlugins[plugin.id] = false;
      }
      
      // Inicializar estado si no existe
      if (!this.pluginStates[plugin.id]) {
        this.pluginStates[plugin.id] = {
          registered: Date.now(),
          active: false
        };
      }
      
      // Limpiar errores previos
      delete this.pluginErrors[plugin.id];
      
      // Registrar dependencias si existen
      if (plugin.dependencies && Array.isArray(plugin.dependencies) && plugin.dependencies.length > 0) {
        this.pluginDependencies[plugin.id] = plugin.dependencies.map(dep => {
          if (typeof dep === 'string') {
            return { id: dep };
          }
          return dep;
        });
      } else {
        // Limpiar dependencias si no tiene
        delete this.pluginDependencies[plugin.id];
      }
      
      // Registrar conflictos si existen
      if (plugin.conflicts && Array.isArray(plugin.conflicts) && plugin.conflicts.length > 0) {
        this.pluginConflicts[plugin.id] = plugin.conflicts.map(conflict => {
          if (typeof conflict === 'string') {
            return { id: conflict, reason: 'Conflicto declarado con este plugin' };
          }
          return conflict;
        });
      } else {
        // Limpiar conflictos si no tiene
        delete this.pluginConflicts[plugin.id];
      }
      
      return true;
    } catch (error) {
      console.error(`Error al registrar plugin [${plugin?.id}]:`, error);
      if (plugin?.id) {
        this.pluginErrors[plugin.id] = {
          operation: 'register',
          message: error.message || 'Error al registrar plugin',
          timestamp: Date.now()
        };
      }
      return false;
    }
  }

  /**
   * Desregistra un plugin del sistema
   * @param {string} pluginId - ID del plugin a desregistrar
   * @returns {boolean} - true si se desregistró correctamente
   */
  unregisterPlugin(pluginId) {
    try {
      if (!pluginId || !this.plugins[pluginId]) {
        console.warn(`Intento de desregistrar plugin inexistente: ${pluginId}`);
        return false;
      }
      
      // Si está activo, limpiarlo primero
      if (this.activePlugins[pluginId]) {
        this.deactivatePlugin(pluginId);
      }
      
      // Eliminar registros
      delete this.plugins[pluginId];
      delete this.activePlugins[pluginId];
      delete this.instances[pluginId];
      delete this.pluginDependencies[pluginId];
      delete this.pluginConflicts[pluginId];
      
      // Mantener el estado para referencia histórica
      if (this.pluginStates[pluginId]) {
        this.pluginStates[pluginId].unregistered = Date.now();
      }
      
      // Limpiar errores
      delete this.pluginErrors[pluginId];
      
      return true;
    } catch (error) {
      console.error(`Error al desregistrar plugin [${pluginId}]:`, error);
      this.pluginErrors[pluginId] = {
        operation: 'unregister',
        message: error.message || 'Error al desregistrar plugin',
        timestamp: Date.now()
      };
      return false;
    }
  }

  /**
   * Activa un plugin registrado
   * @param {string} pluginId - ID del plugin a activar
   * @param {Object} core - Objeto core para pasar al plugin
   * @returns {boolean} - true si se activó correctamente
   */
  activatePlugin(pluginId, core) {
    try {
      const plugin = this.plugins[pluginId];
      
      if (!plugin) {
        console.error(`Intento de activar plugin no registrado: ${pluginId}`);
        return false;
      }
      
      if (this.activePlugins[pluginId]) {
        console.warn(`Plugin ya activado: ${pluginId}`);
        return true;
      }
      
      // Inicializar plugin
      console.log(`Inicializando plugin: ${pluginId}`);
      
      // Asegurar que el estado existe
      if (!this.pluginStates[pluginId]) {
        this.pluginStates[pluginId] = {
          registered: Date.now(),
          active: false
        };
      }
      
      // Limpiar errores previos
      delete this.pluginErrors[pluginId];
      
      try {
        // Llamar al método init del plugin
        const success = plugin.init(core);
        
        if (!success) {
          throw new Error(`Inicialización falló para plugin: ${pluginId}`);
        }
        
        // Marcar como activo
        this.activePlugins[pluginId] = true;
        
        // Guardar instancia
        this.instances[pluginId] = {
          plugin,
          initialized: true,
          activatedAt: Date.now()
        };
        
        // Actualizar estado
        this.pluginStates[pluginId].active = true;
        this.pluginStates[pluginId].lastActivated = Date.now();
        
        console.log(`Plugin activado: ${pluginId}`);
        return true;
      } catch (initError) {
        console.error(`Error al inicializar plugin [${pluginId}]:`, initError);
        this.pluginErrors[pluginId] = {
          operation: 'activate',
          message: initError.message || 'Error al inicializar plugin',
          timestamp: Date.now()
        };
        
        // Actualizar estado
        this.pluginStates[pluginId].lastError = {
          type: 'activation',
          message: initError.message || 'Error al inicializar plugin',
          timestamp: Date.now()
        };
        
        return false;
      }
    } catch (error) {
      console.error(`Error al activar plugin [${pluginId}]:`, error);
      this.pluginErrors[pluginId] = {
        operation: 'activate',
        message: error.message || 'Error al activar plugin',
        timestamp: Date.now()
      };
      return false;
    }
  }

  /**
   * Desactiva un plugin activo
   * @param {string} pluginId - ID del plugin a desactivar
   * @returns {boolean} - true si se desactivó correctamente
   */
  deactivatePlugin(pluginId) {
    try {
      if (!this.plugins[pluginId]) {
        console.error(`Intento de desactivar plugin no registrado: ${pluginId}`);
        return false;
      }
      
      if (!this.activePlugins[pluginId]) {
        console.warn(`Plugin ya desactivado: ${pluginId}`);
        return true;
      }
      
      const plugin = this.plugins[pluginId];
      
      // Limpiar errores previos
      delete this.pluginErrors[pluginId];
      
      try {
        // Llamar al método cleanup del plugin
        console.log(`Limpiando plugin: ${pluginId}`);
        const success = plugin.cleanup();
        
        if (!success) {
          console.error(`Limpieza falló para plugin: ${pluginId}`);
          // Continuamos con la desactivación a pesar del error
        }
        
        // Marcar como inactivo
        this.activePlugins[pluginId] = false;
        
        // Limpiar instancia
        if (this.instances[pluginId]) {
          this.instances[pluginId].initialized = false;
          this.instances[pluginId].deactivatedAt = Date.now();
        }
        
        // Actualizar estado
        if (this.pluginStates[pluginId]) {
          this.pluginStates[pluginId].active = false;
          this.pluginStates[pluginId].lastDeactivated = Date.now();
        }
        
        console.log(`Plugin desactivado: ${pluginId}`);
        return true;
      } catch (cleanupError) {
        console.error(`Error al limpiar plugin [${pluginId}]:`, cleanupError);
        
        // Aún así lo desactivamos
        this.activePlugins[pluginId] = false;
        
        // Registrar error
        this.pluginErrors[pluginId] = {
          operation: 'deactivate',
          message: cleanupError.message || 'Error al limpiar plugin',
          timestamp: Date.now()
        };
        
        // Actualizar estado
        if (this.pluginStates[pluginId]) {
          this.pluginStates[pluginId].active = false;
          this.pluginStates[pluginId].lastDeactivated = Date.now();
          this.pluginStates[pluginId].lastError = {
            type: 'deactivation',
            message: cleanupError.message || 'Error al limpiar plugin',
            timestamp: Date.now()
          };
        }
        
        return true; // Devolvemos true porque el plugin queda desactivado aunque falle la limpieza
      }
    } catch (error) {
      console.error(`Error al desactivar plugin [${pluginId}]:`, error);
      this.pluginErrors[pluginId] = {
        operation: 'deactivate',
        message: error.message || 'Error al desactivar plugin',
        timestamp: Date.now()
      };
      return false;
    }
  }

  /**
   * Obtiene un plugin por su ID
   * @param {string} pluginId - ID del plugin
   * @returns {Object|null} - Plugin o null si no existe
   */
  getPlugin(pluginId) {
    return this.plugins[pluginId] || null;
  }

  /**
   * Comprueba si un plugin está activo
   * @param {string} pluginId - ID del plugin
   * @returns {boolean} - true si el plugin está activo
   */
  isPluginActive(pluginId) {
    return !!this.activePlugins[pluginId];
  }

  /**
   * Obtiene todos los plugins registrados
   * @returns {Object[]} - Array de plugins
   */
  getAllPlugins() {
    return Object.values(this.plugins);
  }

  /**
   * Obtiene todos los plugins activos
   * @returns {Object[]} - Array de plugins activos
   */
  getActivePlugins() {
    const activePluginIds = Object.entries(this.activePlugins)
      .filter(([, active]) => active)
      .map(([id]) => id);
    
    return activePluginIds.map(id => this.plugins[id]).filter(Boolean);
  }

  /**
   * Obtiene dependencias de un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {Array} - Lista de dependencias
   */
  getPluginDependencies(pluginId) {
    return this.pluginDependencies[pluginId] || [];
  }

  /**
   * Obtiene conflictos declarados de un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {Array} - Lista de conflictos
   */
  getPluginConflicts(pluginId) {
    return this.pluginConflicts[pluginId] || [];
  }

  /**
   * Obtiene el estado de un plugin específico
   * @param {string} pluginId - ID del plugin
   * @returns {Object} - Estado del plugin
   */
  getPluginState(pluginId) {
    return this.pluginStates[pluginId] || {};
  }

  /**
   * Obtiene los estados de todos los plugins
   * @returns {Object} - Estados de plugins
   */
  getPluginStates() {
    return { ...this.pluginStates };
  }

  /**
   * Establece el estado de un plugin
   * @param {string} pluginId - ID del plugin
   * @param {Object} state - Estado a establecer (se fusiona con el existente)
   */
  setPluginState(pluginId, state) {
    if (!pluginId) return;
    
    // Asegurar que el objeto de estado existe
    if (!this.pluginStates[pluginId]) {
      this.pluginStates[pluginId] = {};
    }
    
    // Fusionar con el estado existente
    this.pluginStates[pluginId] = {
      ...this.pluginStates[pluginId],
      ...state,
      lastUpdated: Date.now()
    };
  }

  /**
   * Establece los estados de todos los plugins
   * @param {Object} states - Estados a establecer
   */
  setPluginStates(states) {
    if (!states || typeof states !== 'object') return;
    
    // Reemplazar todos los estados
    this.pluginStates = { ...states };
  }

  /**
   * Obtiene los errores de los plugins
   * @returns {Object} - Errores por ID de plugin
   */
  getPluginErrors() {
    return { ...this.pluginErrors };
  }

  /**
   * Obtiene los errores de un plugin específico
   * @param {string} pluginId - ID del plugin
   * @returns {Object|null} - Error del plugin o null
   */
  getPluginError(pluginId) {
    return this.pluginErrors[pluginId] || null;
  }

  /**
   * Limpia todos los registros y estados
   */
  clear() {
    // Desactivar todos los plugins activos primero
    Object.keys(this.activePlugins).forEach(pluginId => {
      if (this.activePlugins[pluginId]) {
        this.deactivatePlugin(pluginId);
      }
    });
    
    // Limpiar registros
    this.plugins = {};
    this.activePlugins = {};
    this.instances = {};
    this.pluginErrors = {};
    this.pluginDependencies = {};
    this.pluginConflicts = {};
    
    // No limpiamos pluginStates para mantener historial
  }
}

// Exportar instancia única
const pluginRegistry = new PluginRegistry();
export default pluginRegistry;