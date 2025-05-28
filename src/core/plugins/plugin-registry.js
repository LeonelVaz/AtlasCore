/**
 * Registro de plugins para Atlas
 */
class PluginRegistry {
  constructor() {
    this.plugins = {};
    this.activePlugins = {};
    this.instances = {};
    this.pluginStates = {};
    this.pluginErrors = {};
    this.pluginDependencies = {};
    this.pluginConflicts = {};
  }

  /**
   * Registra un plugin en el sistema
   */
  registerPlugin(plugin) {
    try {
      if (!plugin?.id) {
        console.error("Intento de registrar plugin sin ID");
        return false;
      }

      if (this.plugins[plugin.id]) {
        console.warn(
          `El plugin ${plugin.id} ya está registrado, será sobrescrito`
        );
      }

      this.plugins[plugin.id] = plugin;

      // Inicializar estados
      this.activePlugins[plugin.id] = this.activePlugins[plugin.id] ?? false;
      this.pluginStates[plugin.id] = this.pluginStates[plugin.id] || {
        registered: Date.now(),
        active: false,
      };

      delete this.pluginErrors[plugin.id];

      // Registrar dependencias
      if (plugin.dependencies?.length) {
        this.pluginDependencies[plugin.id] = plugin.dependencies.map((dep) =>
          typeof dep === "string" ? { id: dep } : dep
        );
      } else {
        delete this.pluginDependencies[plugin.id];
      }

      // Registrar conflictos
      if (plugin.conflicts?.length) {
        this.pluginConflicts[plugin.id] = plugin.conflicts.map((conflict) =>
          typeof conflict === "string"
            ? { id: conflict, reason: "Conflicto declarado con este plugin" }
            : conflict
        );
      } else {
        delete this.pluginConflicts[plugin.id];
      }

      return true;
    } catch (error) {
      console.error(`Error al registrar plugin [${plugin?.id}]:`, error);
      if (plugin?.id) {
        this.pluginErrors[plugin.id] = {
          operation: "register",
          message: error.message || "Error al registrar plugin",
          timestamp: Date.now(),
        };
      }
      return false;
    }
  }

  /**
   * Desregistra un plugin del sistema
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

      delete this.pluginErrors[pluginId];

      return true;
    } catch (error) {
      console.error(`Error al desregistrar plugin [${pluginId}]:`, error);
      this.pluginErrors[pluginId] = {
        operation: "unregister",
        message: error.message || "Error al desregistrar plugin",
        timestamp: Date.now(),
      };
      return false;
    }
  }

  /**
   * Activa un plugin registrado
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

      console.log(`Inicializando plugin: ${pluginId}`);

      // Asegurar estado
      this.pluginStates[pluginId] = this.pluginStates[pluginId] || {
        registered: Date.now(),
        active: false,
      };

      delete this.pluginErrors[pluginId];

      try {
        // Inicializar plugin
        const success = plugin.init(core);

        if (!success) {
          throw new Error(`Inicialización falló para plugin: ${pluginId}`);
        }

        // Actualizar estado
        this.activePlugins[pluginId] = true;
        this.instances[pluginId] = {
          plugin,
          initialized: true,
          activatedAt: Date.now(),
        };
        this.pluginStates[pluginId].active = true;
        this.pluginStates[pluginId].lastActivated = Date.now();

        console.log(`Plugin activado: ${pluginId}`);
        return true;
      } catch (initError) {
        console.error(`Error al inicializar plugin [${pluginId}]:`, initError);
        this.pluginErrors[pluginId] = {
          operation: "activate",
          message: initError.message || "Error al inicializar plugin",
          timestamp: Date.now(),
        };

        this.pluginStates[pluginId].lastError = {
          type: "activation",
          message: initError.message || "Error al inicializar plugin",
          timestamp: Date.now(),
        };

        return false;
      }
    } catch (error) {
      console.error(`Error al activar plugin [${pluginId}]:`, error);
      this.pluginErrors[pluginId] = {
        operation: "activate",
        message: error.message || "Error al activar plugin",
        timestamp: Date.now(),
      };
      return false;
    }
  }

  /**
   * Desactiva un plugin activo
   */
  deactivatePlugin(pluginId) {
    try {
      if (!this.plugins[pluginId]) {
        console.error(
          `Intento de desactivar plugin no registrado: ${pluginId}`
        );
        return false;
      }

      if (!this.activePlugins[pluginId]) {
        console.warn(`Plugin ya desactivado: ${pluginId}`);
        return true;
      }

      const plugin = this.plugins[pluginId];
      delete this.pluginErrors[pluginId];

      try {
        // Limpiar plugin
        console.log(`Limpiando plugin: ${pluginId}`);
        const success = plugin.cleanup();

        if (!success) {
          console.error(`Limpieza falló para plugin: ${pluginId}`);
        }

        // Actualizar estado
        this.activePlugins[pluginId] = false;

        if (this.instances[pluginId]) {
          this.instances[pluginId].initialized = false;
          this.instances[pluginId].deactivatedAt = Date.now();
        }

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

        this.pluginErrors[pluginId] = {
          operation: "deactivate",
          message: cleanupError.message || "Error al limpiar plugin",
          timestamp: Date.now(),
        };

        if (this.pluginStates[pluginId]) {
          this.pluginStates[pluginId].active = false;
          this.pluginStates[pluginId].lastDeactivated = Date.now();
          this.pluginStates[pluginId].lastError = {
            type: "deactivation",
            message: cleanupError.message || "Error al limpiar plugin",
            timestamp: Date.now(),
          };
        }

        return true; // Devolvemos true porque el plugin queda desactivado
      }
    } catch (error) {
      console.error(`Error al desactivar plugin [${pluginId}]:`, error);
      this.pluginErrors[pluginId] = {
        operation: "deactivate",
        message: error.message || "Error al desactivar plugin",
        timestamp: Date.now(),
      };
      return false;
    }
  }

  // Métodos de consulta simplificados
  getPlugin(pluginId) {
    return this.plugins[pluginId] || null;
  }

  isPluginActive(pluginId) {
    return !!this.activePlugins[pluginId];
  }

  getAllPlugins() {
    return Object.values(this.plugins);
  }

  getActivePlugins() {
    return Object.entries(this.activePlugins)
      .filter(([, active]) => active)
      .map(([id]) => this.plugins[id])
      .filter(Boolean);
  }

  getPluginDependencies(pluginId) {
    return this.pluginDependencies[pluginId] || [];
  }

  getPluginConflicts(pluginId) {
    return this.pluginConflicts[pluginId] || [];
  }

  getPluginState(pluginId) {
    return this.pluginStates[pluginId] || {};
  }

  getPluginStates() {
    return { ...this.pluginStates };
  }

  setPluginState(pluginId, state) {
    if (!pluginId) return;

    this.pluginStates[pluginId] = {
      ...(this.pluginStates[pluginId] || {}),
      ...state,
      lastUpdated: Date.now(),
    };
  }

  setPluginStates(states) {
    if (!states || typeof states !== "object") return;
    this.pluginStates = { ...states };
  }

  getPluginErrors() {
    return { ...this.pluginErrors };
  }

  getPluginError(pluginId) {
    return this.pluginErrors[pluginId] || null;
  }

  clear() {
    // Desactivar plugins activos
    Object.keys(this.activePlugins).forEach((pluginId) => {
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
  }
}

// Exportar instancia única
const pluginRegistry = new PluginRegistry();
export default pluginRegistry;
