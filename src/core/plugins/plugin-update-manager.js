/**
 * Gestor de actualizaciones para plugins de Atlas
 * Maneja verificación y aplicación de actualizaciones
 */
import { PLUGIN_CONSTANTS, STORAGE_KEYS } from "../config/constants";
import pluginRegistry from "./plugin-registry";
import pluginPackageManager from "./plugin-package-manager";
import pluginRepositoryManager from "./plugin-repository-manager";
import eventBus from "../bus/event-bus";
import storageService from "../../services/storage-service";

class PluginUpdateManager {
  constructor() {
    this.initialized = false;
    this.updateQueue = [];
    this.updatingPlugin = null;
    this.lastCheckTimestamp = 0;
    this.availableUpdates = {};
    this.updateHistory = {};
    this.updateSettings = {
      checkAutomatically: true,
      checkInterval: 86400000, // 24 horas en ms
      autoUpdate: false,
      updateNotificationsEnabled: true,
    };
    this._subscribers = {};
    this._lastSubscriberId = 0;
  }

  async initialize() {
    if (this.initialized) return true;

    try {
      // Cargar historial de actualizaciones
      this.updateHistory = await storageService.get(
        STORAGE_KEYS.PLUGIN_DATA_PREFIX + "update_history",
        {}
      );

      // Cargar actualizaciones disponibles
      this.availableUpdates = await storageService.get(
        STORAGE_KEYS.PLUGIN_DATA_PREFIX + "available_updates",
        {}
      );

      // Cargar timestamp del último chequeo
      this.lastCheckTimestamp = await storageService.get(
        STORAGE_KEYS.PLUGIN_DATA_PREFIX + "last_update_check",
        0
      );

      // Cargar configuración de actualizaciones
      const savedSettings = await storageService.get(
        STORAGE_KEYS.PLUGIN_DATA_PREFIX + "update_settings",
        {}
      );

      this.updateSettings = {
        ...this.updateSettings,
        ...savedSettings,
      };

      this.initialized = true;
      console.log("Plugin Update Manager inicializado");

      // Verificar si toca hacer un chequeo automático
      if (
        this.updateSettings.checkAutomatically &&
        Date.now() - this.lastCheckTimestamp > this.updateSettings.checkInterval
      ) {
        this.checkForUpdates();
      }

      return true;
    } catch (error) {
      console.error("Error al inicializar Plugin Update Manager:", error);
      return false;
    }
  }

  /**
   * Suscribe a eventos del sistema de actualizaciones
   */
  subscribe(eventName, callback) {
    if (typeof callback !== "function") return () => {};

    const id = ++this._lastSubscriberId;

    if (!this._subscribers[eventName]) {
      this._subscribers[eventName] = {};
    }

    this._subscribers[eventName][id] = callback;

    return () => {
      if (this._subscribers[eventName]?.[id]) {
        delete this._subscribers[eventName][id];
        if (Object.keys(this._subscribers[eventName]).length === 0) {
          delete this._subscribers[eventName];
        }
      }
    };
  }

  /**
   * Publica un evento en el sistema
   */
  _publishEvent(eventName, data = {}) {
    // Publicar en el bus de eventos
    eventBus.publish(`pluginSystem.${eventName}`, data);

    // Notificar a los suscriptores directos
    if (this._subscribers[eventName]) {
      Object.values(this._subscribers[eventName]).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en suscriptor a evento ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Verifica si hay actualizaciones disponibles para los plugins instalados
   * @param {Object} options - Opciones para la verificación
   * @returns {Promise<Object>} - Objeto con actualizaciones disponibles
   */
  async checkForUpdates(options = {}) {
    if (!this.initialized) await this.initialize();

    try {
      // Actualizar timestamp
      this.lastCheckTimestamp = Date.now();
      await storageService.set(
        STORAGE_KEYS.PLUGIN_DATA_PREFIX + "last_update_check",
        this.lastCheckTimestamp
      );

      // Notificar inicio de verificación
      this._publishEvent("updateCheckStarted", {
        timestamp: this.lastCheckTimestamp,
      });

      // Obtener plugins instalados
      const installedPlugins = pluginPackageManager.getInstalledPlugins();
      const repositories = pluginRepositoryManager.getRepositories();

      if (Object.keys(repositories).length === 0) {
        throw new Error("No hay repositorios configurados");
      }

      // Resetear actualizaciones disponibles si se solicita una verificación completa
      if (options.fullCheck) {
        this.availableUpdates = {};
      }

      // Verificar cada plugin instalado
      for (const [pluginId, installedInfo] of Object.entries(
        installedPlugins
      )) {
        // Buscar en todos los repositorios
        for (const [repoId, repo] of Object.entries(repositories)) {
          try {
            // En una implementación real, esto haría una petición HTTP
            // Simulamos la verificación
            const remoteInfo = await this._checkPluginInRepository(
              pluginId,
              installedInfo.version,
              repoId
            );

            if (
              remoteInfo &&
              pluginPackageManager.hasUpdate(pluginId, remoteInfo)
            ) {
              this.availableUpdates[pluginId] = {
                id: pluginId,
                currentVersion: installedInfo.version,
                newVersion: remoteInfo.version,
                repositoryId: repoId,
                releaseNotes: remoteInfo.releaseNotes,
                compatibleWithCurrentApp: true,
                detectedAt: Date.now(),
              };

              // Notificar actualización disponible
              this._publishEvent("updateAvailable", {
                pluginId,
                currentVersion: installedInfo.version,
                newVersion: remoteInfo.version,
                repositoryId: repoId,
              });

              // Si encontramos una actualización, no seguir buscando en otros repos
              break;
            }
          } catch (repoError) {
            console.warn(
              `Error al verificar ${pluginId} en repositorio ${repoId}:`,
              repoError
            );
          }
        }
      }

      // Guardar actualizaciones disponibles
      await storageService.set(
        STORAGE_KEYS.PLUGIN_DATA_PREFIX + "available_updates",
        this.availableUpdates
      );

      // Notificar finalización de verificación
      this._publishEvent("updateCheckCompleted", {
        timestamp: Date.now(),
        availableUpdates: this.availableUpdates,
      });

      // Aplicar actualizaciones automáticas si está habilitado
      if (
        this.updateSettings.autoUpdate &&
        Object.keys(this.availableUpdates).length > 0
      ) {
        this.applyAllUpdates();
      }

      return { ...this.availableUpdates };
    } catch (error) {
      console.error("Error al verificar actualizaciones:", error);

      this._publishEvent("updateCheckError", {
        timestamp: Date.now(),
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Aplica una actualización específica
   * @param {string} pluginId - ID del plugin a actualizar
   * @returns {Promise<boolean>} - true si la actualización se aplicó correctamente
   */
  async applyUpdate(pluginId) {
    if (!this.initialized) await this.initialize();

    try {
      // Verificar si hay una actualización disponible
      if (!this.availableUpdates[pluginId]) {
        throw new Error(
          `No hay actualización disponible para el plugin: ${pluginId}`
        );
      }

      const updateInfo = this.availableUpdates[pluginId];

      // Establecer estado de actualización
      this.updatingPlugin = pluginId;

      // Notificar inicio de actualización
      this._publishEvent("updateStarted", {
        pluginId,
        fromVersion: updateInfo.currentVersion,
        toVersion: updateInfo.newVersion,
      });

      // Obtener paquete del plugin desde el repositorio
      const repository = pluginRepositoryManager.getRepository(
        updateInfo.repositoryId
      );

      if (!repository) {
        throw new Error(
          `Repositorio no encontrado: ${updateInfo.repositoryId}`
        );
      }

      // En una implementación real, descargaría el paquete
      // Simulamos la descarga
      const pluginPackage = await this._downloadPluginPackage(
        pluginId,
        updateInfo.newVersion,
        updateInfo.repositoryId
      );

      // Guardar estado actual por seguridad
      const currentPlugin = pluginRegistry.getPlugin(pluginId);
      const wasActive = pluginRegistry.isPluginActive(pluginId);

      // Desinstalar versión actual
      await pluginPackageManager.uninstallPlugin(pluginId, {
        keepSettings: true,
      });

      // Instalar nueva versión
      await pluginPackageManager.installPlugin(pluginPackage, { update: true });

      // Si estaba activo, reactivar
      if (wasActive) {
        // En una implementación real, utilizaría pluginManager
        // Simulamos la activación
        const plugin = pluginRegistry.getPlugin(pluginId);
        if (plugin) {
          pluginRegistry.activatePlugin(pluginId);
        }
      }

      // Registrar actualización en historial
      this.updateHistory[pluginId] = this.updateHistory[pluginId] || [];
      this.updateHistory[pluginId].push({
        fromVersion: updateInfo.currentVersion,
        toVersion: updateInfo.newVersion,
        appliedAt: Date.now(),
        repositoryId: updateInfo.repositoryId,
      });

      // Guardar historial
      await storageService.set(
        STORAGE_KEYS.PLUGIN_DATA_PREFIX + "update_history",
        this.updateHistory
      );

      // Eliminar de lista de actualizaciones disponibles
      delete this.availableUpdates[pluginId];
      await storageService.set(
        STORAGE_KEYS.PLUGIN_DATA_PREFIX + "available_updates",
        this.availableUpdates
      );

      // Limpiar estado de actualización
      this.updatingPlugin = null;

      // Notificar finalización de actualización
      this._publishEvent("updateCompleted", {
        pluginId,
        fromVersion: updateInfo.currentVersion,
        toVersion: updateInfo.newVersion,
        appliedAt: Date.now(),
      });

      return true;
    } catch (error) {
      // Limpiar estado de actualización
      this.updatingPlugin = null;

      console.error(`Error al actualizar plugin ${pluginId}:`, error);

      this._publishEvent("updateError", {
        pluginId,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Aplica todas las actualizaciones disponibles
   * @returns {Promise<Object>} - Resultados de las actualizaciones
   */
  async applyAllUpdates() {
    if (!this.initialized) await this.initialize();

    const updateResults = {
      successful: [],
      failed: [],
    };

    // Si no hay actualizaciones disponibles, salir
    if (Object.keys(this.availableUpdates).length === 0) {
      return updateResults;
    }

    // Notificar inicio de actualización masiva
    this._publishEvent("massUpdateStarted", {
      count: Object.keys(this.availableUpdates).length,
    });

    // Aplicar actualizaciones una por una
    for (const pluginId of Object.keys(this.availableUpdates)) {
      try {
        await this.applyUpdate(pluginId);
        updateResults.successful.push(pluginId);
      } catch (error) {
        console.error(`Error al actualizar plugin ${pluginId}:`, error);
        updateResults.failed.push({
          pluginId,
          error: error.message,
        });
      }
    }

    // Notificar finalización de actualización masiva
    this._publishEvent("massUpdateCompleted", {
      successful: updateResults.successful.length,
      failed: updateResults.failed.length,
      results: updateResults,
    });

    return updateResults;
  }

  /**
   * Obtiene la lista de actualizaciones disponibles
   * @returns {Object} - Objeto con las actualizaciones disponibles
   */
  getAvailableUpdates() {
    return { ...this.availableUpdates };
  }

  /**
   * Obtiene el historial de actualizaciones
   * @param {string} [pluginId] - ID del plugin (opcional)
   * @returns {Object} - Historial de actualizaciones
   */
  getUpdateHistory(pluginId) {
    if (pluginId) {
      return this.updateHistory[pluginId] || [];
    }
    return { ...this.updateHistory };
  }

  /**
   * Configura las opciones de actualización
   * @param {Object} settings - Configuración de actualizaciones
   * @returns {Promise<boolean>} - true si se aplicó correctamente
   */
  async configureUpdateSettings(settings) {
    if (!this.initialized) await this.initialize();

    try {
      // Actualizar configuración
      this.updateSettings = {
        ...this.updateSettings,
        ...settings,
      };

      // Guardar configuración
      await storageService.set(
        STORAGE_KEYS.PLUGIN_DATA_PREFIX + "update_settings",
        this.updateSettings
      );

      // Notificar cambio de configuración
      this._publishEvent("updateSettingsChanged", {
        settings: this.updateSettings,
      });

      return true;
    } catch (error) {
      console.error("Error al configurar actualizaciones:", error);
      return false;
    }
  }

  /**
   * Obtiene la configuración actual de actualizaciones
   * @returns {Object} - Configuración de actualizaciones
   */
  getUpdateSettings() {
    return { ...this.updateSettings };
  }

  // Métodos privados

  /**
   * Verifica si hay actualizaciones para un plugin en un repositorio
   * @private
   */
  async _checkPluginInRepository(pluginId, currentVersion, repositoryId) {
    // En una implementación real, haría una petición al repositorio
    // Simulamos el proceso con un delay
    await this._simulateNetworkDelay();

    // Simulamos resultados para algunos plugins
    if (pluginId === "example-plugin") {
      return {
        id: "example-plugin",
        name: "Plugin de Ejemplo",
        version: "0.4.0", // Nueva versión
        description: "Plugin de ejemplo actualizado",
        releaseNotes: "Agregada integración con sistema de actualizaciones",
      };
    }

    return null;
  }

  /**
   * Descarga un paquete de plugin desde un repositorio
   * @private
   */
  async _downloadPluginPackage(pluginId, version, repositoryId) {
    // En una implementación real, descargaría el paquete
    // Simulamos el proceso con un delay
    await this._simulateNetworkDelay();

    // Simulamos un paquete para el plugin de ejemplo
    if (pluginId === "example-plugin") {
      return {
        manifest: {
          id: "example-plugin",
          name: "Plugin de Ejemplo",
          version: "0.4.0",
          author: "Atlas Team",
          description: "Plugin de ejemplo actualizado",
          minAppVersion: "0.3.0",
          maxAppVersion: "1.0.0",
          dependencies: [],
          conflicts: [],
          permissions: ["storage", "events", "ui", "notifications"],
          packagedAt: Date.now(),
          packagedBy: "Atlas Repository",
          checksums: {},
          signature: "simulation",
        },
        files: {
          "index.js": {
            content:
              "export default " +
              JSON.stringify(
                {
                  id: "example-plugin",
                  name: "Plugin de Ejemplo",
                  version: "0.4.0",
                  author: "Atlas Team",
                  description: "Plugin de ejemplo actualizado",
                  minAppVersion: "0.3.0",
                  maxAppVersion: "1.0.0",
                  dependencies: [],
                  conflicts: [],
                  permissions: ["storage", "events", "ui", "notifications"],
                  init: function (core) {
                    return true;
                  },
                  cleanup: function () {
                    return true;
                  },
                },
                null,
                2
              ),
            type: "application/javascript",
          },
          "README.md": {
            content:
              "# Plugin de Ejemplo v0.4.0\n\nPlugin de ejemplo actualizado.",
            type: "text/markdown",
          },
        },
      };
    }

    throw new Error(`Paquete no encontrado para ${pluginId}@${version}`);
  }

  /**
   * Simula un retraso de red
   * @private
   */
  async _simulateNetworkDelay() {
    return new Promise((resolve) =>
      setTimeout(resolve, Math.random() * 500 + 100)
    );
  }
}

const pluginUpdateManager = new PluginUpdateManager();
export default pluginUpdateManager;
