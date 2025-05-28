/**
 * Gestor de paquetes para plugins de Atlas
 * Maneja empaquetado, instalación y desinstalación de plugins
 */
import { PLUGIN_CONSTANTS, STORAGE_KEYS } from "../config/constants";
import pluginRegistry from "./plugin-registry";
import { loadPluginById } from "./plugin-loader";
import { validatePluginComplete } from "./plugin-validator";
import pluginIntegrityChecker from "./plugin-integrity-checker";
import eventBus from "../bus/event-bus";
import storageService from "../../services/storage-service";

class PluginPackageManager {
  constructor() {
    this.initialized = false;
    this.installQueue = [];
    this.uninstallQueue = [];
    this.installingPlugin = null;
    this.installedPlugins = {};
    this.packageManifests = {};
    this._subscribers = {};
    this._lastSubscriberId = 0;
  }

  async initialize() {
    if (this.initialized) return true;

    try {
      // Cargar información de plugins instalados
      this.installedPlugins = await storageService.get(
        STORAGE_KEYS.PLUGIN_DATA_PREFIX + "installed_plugins",
        {}
      );

      // Cargar manifiestos de paquetes
      this.packageManifests = await storageService.get(
        STORAGE_KEYS.PLUGIN_DATA_PREFIX + "package_manifests",
        {}
      );

      this.initialized = true;
      console.log("Plugin Package Manager inicializado");
      return true;
    } catch (error) {
      console.error("Error al inicializar Plugin Package Manager:", error);
      return false;
    }
  }

  /**
   * Suscribe a eventos del sistema de paquetes
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
   * Empaqueta un plugin para distribución
   * @param {string} pluginId - ID del plugin a empaquetar
   * @param {Object} options - Opciones de empaquetado
   * @returns {Promise<Object>} - Objeto que representa el paquete del plugin
   */
  async packagePlugin(pluginId, options = {}) {
    try {
      const plugin = pluginRegistry.getPlugin(pluginId);

      if (!plugin) {
        throw new Error(`Plugin no encontrado: ${pluginId}`);
      }

      // Verificar que el plugin es válido
      const validation = validatePluginComplete(plugin);
      if (!validation.valid) {
        throw new Error(`Plugin inválido: ${validation.reason}`);
      }

      // Crear manifiesto del paquete
      const packageManifest = {
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        author: plugin.author,
        description: plugin.description,
        minAppVersion: plugin.minAppVersion,
        maxAppVersion: plugin.maxAppVersion,
        dependencies: plugin.dependencies || [],
        conflicts: plugin.conflicts || [],
        permissions: plugin.permissions || [],
        packagedAt: Date.now(),
        packagedBy: options.author || "Atlas System",
        checksums: {},
        signature: null,
      };

      // Obtener archivos del plugin
      const pluginFiles = await this._collectPluginFiles(pluginId);

      // Calcular checksums para verificación de integridad
      packageManifest.checksums =
        await pluginIntegrityChecker.generateChecksums(pluginFiles);

      // Firmar el paquete si se proporciona una clave
      if (options.signingKey) {
        packageManifest.signature = await pluginIntegrityChecker.signPackage(
          packageManifest,
          options.signingKey
        );
      }

      // Crear el paquete combinando manifesto y archivos
      const pluginPackage = {
        manifest: packageManifest,
        files: pluginFiles,
      };

      // Guardar el manifiesto en storage para referencia
      this.packageManifests[pluginId] = packageManifest;
      await this._savePackageManifests();

      // Notificar eventos
      this._publishEvent("pluginPackaged", {
        pluginId,
        packageManifest,
      });

      return pluginPackage;
    } catch (error) {
      console.error(`Error al empaquetar plugin ${pluginId}:`, error);

      this._publishEvent("packagingError", {
        pluginId,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Instala un plugin desde un paquete
   * @param {Object} pluginPackage - Paquete del plugin a instalar
   * @param {Object} options - Opciones de instalación
   * @returns {Promise<boolean>} - true si la instalación fue exitosa
   */
  async installPlugin(pluginPackage, options = {}) {
    if (!this.initialized) await this.initialize();

    try {
      const { manifest, files } = pluginPackage;

      // Verificar si ya existe un plugin instalado con el mismo ID
      if (this.installedPlugins[manifest.id] && !options.update) {
        throw new Error(
          `Ya existe un plugin instalado con el ID: ${manifest.id}`
        );
      }

      // Verificar integridad del paquete
      const isValid = await pluginIntegrityChecker.verifyPackage(pluginPackage);
      if (!isValid) {
        throw new Error("El paquete del plugin no es válido o está corrupto");
      }

      // Verificar compatibilidad con la versión de la aplicación
      const appVersion = PLUGIN_CONSTANTS.CURRENT_APP_VERSION;
      if (
        this._compareVersions(appVersion, manifest.minAppVersion) < 0 ||
        this._compareVersions(appVersion, manifest.maxAppVersion) > 0
      ) {
        throw new Error(
          `El plugin no es compatible con la versión actual ${appVersion}`
        );
      }

      // Verificar dependencias
      const missingDependencies = await this._checkDependencies(
        manifest.dependencies
      );
      if (missingDependencies.length > 0 && !options.ignoreDependencies) {
        throw new Error(
          `Dependencias faltantes: ${missingDependencies.join(", ")}`
        );
      }

      // Verificar conflictos
      const activeConflicts = await this._checkConflicts(manifest.conflicts);
      if (activeConflicts.length > 0 && !options.ignoreConflicts) {
        throw new Error(
          `Conflictos con plugins activos: ${activeConflicts.join(", ")}`
        );
      }

      // Establecer estado de instalación
      this.installingPlugin = manifest.id;

      // Notificar inicio de instalación
      this._publishEvent("pluginInstallStarted", {
        pluginId: manifest.id,
        version: manifest.version,
      });

      // Extraer archivos del plugin
      await this._extractPluginFiles(manifest.id, files);

      // Registrar plugin como instalado
      this.installedPlugins[manifest.id] = {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        installedAt: Date.now(),
        lastUpdated: Date.now(),
        checksums: manifest.checksums,
        signature: manifest.signature,
      };

      // Guardar información de plugins instalados
      await this._saveInstalledPlugins();

      // Cargar el plugin recién instalado
      const plugin = await loadPluginById(manifest.id);

      if (!plugin) {
        throw new Error(
          `No se pudo cargar el plugin instalado: ${manifest.id}`
        );
      }

      // Registrar el plugin en el registro
      if (!pluginRegistry.registerPlugin(plugin)) {
        throw new Error(`No se pudo registrar el plugin: ${manifest.id}`);
      }

      // Limpiar estado de instalación
      this.installingPlugin = null;

      // Notificar finalización de instalación
      this._publishEvent("pluginInstalled", {
        pluginId: manifest.id,
        version: manifest.version,
        plugin,
      });

      return true;
    } catch (error) {
      // Limpiar estado de instalación
      this.installingPlugin = null;

      console.error("Error al instalar plugin:", error);

      this._publishEvent("installationError", {
        pluginId: pluginPackage?.manifest?.id || "unknown",
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Desinstala un plugin
   * @param {string} pluginId - ID del plugin a desinstalar
   * @param {Object} options - Opciones de desinstalación
   * @returns {Promise<boolean>} - true si la desinstalación fue exitosa
   */
  async uninstallPlugin(pluginId, options = {}) {
    if (!this.initialized) await this.initialize();

    try {
      // Verificar si el plugin está instalado
      if (!this.installedPlugins[pluginId]) {
        throw new Error(`El plugin no está instalado: ${pluginId}`);
      }

      // Verificar si hay plugins que dependen de este
      const dependentPlugins = await this._getDependentPlugins(pluginId);
      if (dependentPlugins.length > 0 && !options.force) {
        throw new Error(
          `Hay plugins que dependen de este: ${dependentPlugins.join(", ")}`
        );
      }

      // Notificar inicio de desinstalación
      this._publishEvent("pluginUninstallStarted", {
        pluginId,
      });

      // Desactivar el plugin si está activo
      if (pluginRegistry.isPluginActive(pluginId)) {
        await this._deactivatePlugin(pluginId);
      }

      // Eliminar archivos del plugin
      await this._removePluginFiles(pluginId);

      // Eliminar registro del plugin
      pluginRegistry.unregisterPlugin(pluginId);

      // Eliminar de la lista de plugins instalados
      delete this.installedPlugins[pluginId];

      // Guardar información actualizada de plugins instalados
      await this._saveInstalledPlugins();

      // Notificar finalización de desinstalación
      this._publishEvent("pluginUninstalled", {
        pluginId,
      });

      return true;
    } catch (error) {
      console.error(`Error al desinstalar plugin ${pluginId}:`, error);

      this._publishEvent("uninstallationError", {
        pluginId,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Obtiene la lista de plugins instalados
   * @returns {Object} - Objeto con la información de plugins instalados
   */
  getInstalledPlugins() {
    return { ...this.installedPlugins };
  }

  /**
   * Verifica si un plugin está instalado
   * @param {string} pluginId - ID del plugin a verificar
   * @returns {boolean} - true si el plugin está instalado
   */
  isPluginInstalled(pluginId) {
    return !!this.installedPlugins[pluginId];
  }

  /**
   * Obtiene la información de un plugin instalado
   * @param {string} pluginId - ID del plugin
   * @returns {Object|null} - Información del plugin o null si no está instalado
   */
  getInstalledPluginInfo(pluginId) {
    return this.installedPlugins[pluginId] || null;
  }

  /**
   * Verifica si hay actualizaciones disponibles para un plugin
   * @param {string} pluginId - ID del plugin a verificar
   * @param {Object} remoteManifest - Manifiesto remoto para comparar
   * @returns {boolean} - true si hay una actualización disponible
   */
  hasUpdate(pluginId, remoteManifest) {
    const installedPlugin = this.installedPlugins[pluginId];

    if (!installedPlugin || !remoteManifest) {
      return false;
    }

    return (
      this._compareVersions(remoteManifest.version, installedPlugin.version) > 0
    );
  }

  // Métodos privados

  /**
   * Recopila los archivos de un plugin
   * @private
   */
  async _collectPluginFiles(pluginId) {
    // En una implementación real, esto recopilaría archivos físicos
    // En esta simulación, devolvemos estructura de directorios
    const plugin = pluginRegistry.getPlugin(pluginId);

    return {
      "index.js": {
        content: "export default " + JSON.stringify(plugin, null, 2),
        type: "application/javascript",
      },
      "README.md": {
        content: `# ${plugin.name}\n\n${plugin.description}\n\nAutor: ${plugin.author}\nVersión: ${plugin.version}`,
        type: "text/markdown",
      },
    };
  }

  /**
   * Extrae los archivos de un plugin al sistema
   * @private
   */
  async _extractPluginFiles(pluginId, files) {
    // En una implementación real, escribiría archivos al sistema
    // En esta simulación, registramos la actividad
    console.log(`Extrayendo archivos para plugin ${pluginId}`);

    // Registro de operación simulada para seguimiento
    await storageService.set(
      STORAGE_KEYS.PLUGIN_DATA_PREFIX + `${pluginId}_files`,
      {
        extractedAt: Date.now(),
        fileCount: Object.keys(files).length,
      }
    );

    return true;
  }

  /**
   * Elimina los archivos de un plugin del sistema
   * @private
   */
  async _removePluginFiles(pluginId) {
    // En una implementación real, eliminaría archivos del sistema
    // En esta simulación, registramos la actividad
    console.log(`Eliminando archivos del plugin ${pluginId}`);

    // Eliminar registro simulado
    await storageService.remove(
      STORAGE_KEYS.PLUGIN_DATA_PREFIX + `${pluginId}_files`
    );

    return true;
  }

  /**
   * Desactiva un plugin
   * @private
   */
  async _deactivatePlugin(pluginId) {
    if (!pluginRegistry.isPluginActive(pluginId)) {
      return true;
    }

    // En una implementación real, utilizaría el plugin manager
    // En esta simulación, usamos directamente el registry
    const deactivated = pluginRegistry.deactivatePlugin(pluginId);

    if (!deactivated) {
      throw new Error(`No se pudo desactivar el plugin: ${pluginId}`);
    }

    return true;
  }

  /**
   * Verifica dependencias de un plugin
   * @private
   */
  async _checkDependencies(dependencies = []) {
    if (
      !dependencies ||
      !Array.isArray(dependencies) ||
      dependencies.length === 0
    ) {
      return [];
    }

    const missingDependencies = [];

    for (const dep of dependencies) {
      const depId = typeof dep === "string" ? dep : dep.id;
      const depVersion = typeof dep === "string" ? null : dep.version;

      // Verificar si la dependencia está instalada
      if (!this.installedPlugins[depId]) {
        missingDependencies.push(depId);
        continue;
      }

      // Verificar versión si se especifica
      if (depVersion) {
        const installedVersion = this.installedPlugins[depId].version;
        if (this._compareVersions(installedVersion, depVersion) < 0) {
          missingDependencies.push(`${depId}@${depVersion}`);
        }
      }
    }

    return missingDependencies;
  }

  /**
   * Verifica conflictos con plugins activos
   * @private
   */
  async _checkConflicts(conflicts = []) {
    if (!conflicts || !Array.isArray(conflicts) || conflicts.length === 0) {
      return [];
    }

    const activeConflicts = [];

    for (const conflict of conflicts) {
      const conflictId = typeof conflict === "string" ? conflict : conflict.id;

      // Verificar si el plugin conflictivo está activo
      if (pluginRegistry.isPluginActive(conflictId)) {
        activeConflicts.push(conflictId);
      }
    }

    return activeConflicts;
  }

  /**
   * Obtiene plugins que dependen del plugin especificado
   * @private
   */
  async _getDependentPlugins(pluginId) {
    const allPlugins = pluginRegistry.getAllPlugins();
    const dependentPlugins = [];

    for (const plugin of allPlugins) {
      if (!plugin.dependencies) continue;

      const isDependency = plugin.dependencies.some((dep) => {
        const depId = typeof dep === "string" ? dep : dep.id;
        return depId === pluginId;
      });

      if (isDependency) {
        dependentPlugins.push(plugin.id);
      }
    }

    return dependentPlugins;
  }

  /**
   * Guarda la información de plugins instalados
   * @private
   */
  async _saveInstalledPlugins() {
    try {
      await storageService.set(
        STORAGE_KEYS.PLUGIN_DATA_PREFIX + "installed_plugins",
        this.installedPlugins
      );
      return true;
    } catch (error) {
      console.error(
        "Error al guardar información de plugins instalados:",
        error
      );
      return false;
    }
  }

  /**
   * Guarda los manifiestos de paquetes
   * @private
   */
  async _savePackageManifests() {
    try {
      await storageService.set(
        STORAGE_KEYS.PLUGIN_DATA_PREFIX + "package_manifests",
        this.packageManifests
      );
      return true;
    } catch (error) {
      console.error("Error al guardar manifiestos de paquetes:", error);
      return false;
    }
  }

  /**
   * Compara versiones semánticas
   * @private
   */
  _compareVersions(v1, v2) {
    const parts1 = v1.split(".").map(Number);
    const parts2 = v2.split(".").map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;

      if (p1 < p2) return -1;
      if (p1 > p2) return 1;
    }

    return 0;
  }
}

const pluginPackageManager = new PluginPackageManager();
export default pluginPackageManager;
