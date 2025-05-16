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
      
      return true;
    } catch (error) {
      console.error(`Error al registrar plugin [${plugin?.id}]:`, error);
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
      
      return true;
    } catch (error) {
      console.error(`Error al desregistrar plugin [${pluginId}]:`, error);
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
      
      // Llamar al método init del plugin
      const success = plugin.init(core);
      
      if (!success) {
        console.error(`Error al inicializar plugin: ${pluginId}`);
        return false;
      }
      
      // Marcar como activo
      this.activePlugins[pluginId] = true;
      
      // Guardar instancia
      this.instances[pluginId] = {
        plugin,
        initialized: true
      };
      
      console.log(`Plugin activado: ${pluginId}`);
      return true;
    } catch (error) {
      console.error(`Error al activar plugin [${pluginId}]:`, error);
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
      
      // Llamar al método cleanup del plugin
      console.log(`Limpiando plugin: ${pluginId}`);
      const success = plugin.cleanup();
      
      if (!success) {
        console.error(`Error al limpiar plugin: ${pluginId}`);
        // Continuamos con la desactivación a pesar del error
      }
      
      // Marcar como inactivo
      this.activePlugins[pluginId] = false;
      
      // Limpiar instancia
      if (this.instances[pluginId]) {
        this.instances[pluginId].initialized = false;
      }
      
      console.log(`Plugin desactivado: ${pluginId}`);
      return true;
    } catch (error) {
      console.error(`Error al desactivar plugin [${pluginId}]:`, error);
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
    
    return activePluginIds.map(id => this.plugins[id]);
  }
}

// Exportar instancia única
const pluginRegistry = new PluginRegistry();
export default pluginRegistry;