/**
 * Gestor de repositorios para plugins de Atlas
 * Maneja el registro y acceso a repositorios de plugins
 */
import { PLUGIN_CONSTANTS, STORAGE_KEYS } from "../config/constants";
import eventBus from "../bus/event-bus";
import storageService from "../../services/storage-service";

class PluginRepositoryManager {
  constructor() {
    this.initialized = false;
    this.repositories = {};
    this.repositoryCache = {};
    this.lastSyncTimestamps = {};
    this._subscribers = {};
    this._lastSubscriberId = 0;
  }

  async initialize() {
    if (this.initialized) return true;

    try {
      // Cargar repositorios guardados
      this.repositories = await storageService.get(
        STORAGE_KEYS.PLUGIN_DATA_PREFIX + "repositories",
        {}
      );

      // Cargar cache de repositorios
      this.repositoryCache = await storageService.get(
        STORAGE_KEYS.PLUGIN_DATA_PREFIX + "repository_cache",
        {}
      );

      // Cargar timestamps de última sincronización
      this.lastSyncTimestamps = await storageService.get(
        STORAGE_KEYS.PLUGIN_DATA_PREFIX + "repository_sync_timestamps",
        {}
      );

      // Añadir repositorio oficial si no existe
      if (!this.repositories["atlas-official"]) {
        this.repositories["atlas-official"] = {
          id: "atlas-official",
          name: "Repositorio Oficial de Atlas",
          url: "https://plugins.atlas-app.org",
          apiEndpoint: "https://api.atlas-app.org/plugins",
          description: "Repositorio oficial de plugins para Atlas",
          official: true,
          enabled: true,
          addedAt: Date.now(),
          priority: 10,
        };

        await this._saveRepositories();
      }

      this.initialized = true;
      console.log("Plugin Repository Manager inicializado");
      return true;
    } catch (error) {
      console.error("Error al inicializar Plugin Repository Manager:", error);
      return false;
    }
  }

  /**
   * Suscribe a eventos del sistema de repositorios
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
   * Añade un nuevo repositorio
   * @param {Object} repository - Información del repositorio
   * @returns {Promise<boolean>} - true si se añadió correctamente
   */
  async addRepository(repository) {
    if (!this.initialized) await this.initialize();

    try {
      // Validar información mínima
      if (!repository.id || !repository.name || !repository.url) {
        throw new Error("Información de repositorio incompleta");
      }

      // Verificar si ya existe
      if (this.repositories[repository.id]) {
        throw new Error(`Ya existe un repositorio con el ID: ${repository.id}`);
      }

      // Preparar objeto de repositorio
      const newRepository = {
        id: repository.id,
        name: repository.name,
        url: repository.url,
        apiEndpoint: repository.apiEndpoint || `${repository.url}/api`,
        description: repository.description || "",
        official: false,
        enabled: true,
        addedAt: Date.now(),
        priority: repository.priority || 100,
        lastSync: null,
      };

      // Validar URL/API antes de añadir
      const isValid = await this._validateRepository(newRepository);

      if (!isValid) {
        throw new Error(
          "No se pudo validar el repositorio. URL no accesible o formato incorrecto."
        );
      }

      // Añadir repositorio
      this.repositories[repository.id] = newRepository;

      // Guardar cambios
      await this._saveRepositories();

      // Notificar evento
      this._publishEvent("repositoryAdded", {
        repositoryId: repository.id,
        repository: newRepository,
      });

      // Sincronizar
      this.syncRepository(repository.id);

      return true;
    } catch (error) {
      console.error("Error al añadir repositorio:", error);

      this._publishEvent("repositoryError", {
        operation: "add",
        repository: repository?.id,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Actualiza la información de un repositorio
   * @param {string} repositoryId - ID del repositorio
   * @param {Object} updates - Actualizaciones a aplicar
   * @returns {Promise<boolean>} - true si se actualizó correctamente
   */
  async updateRepository(repositoryId, updates) {
    if (!this.initialized) await this.initialize();

    try {
      // Verificar si existe
      if (!this.repositories[repositoryId]) {
        throw new Error(`Repositorio no encontrado: ${repositoryId}`);
      }

      // No permitir cambiar ID o estado oficial
      delete updates.id;
      delete updates.official;

      // Si cambia la URL o API, validar
      if (updates.url || updates.apiEndpoint) {
        const testRepo = {
          ...this.repositories[repositoryId],
          ...updates,
        };

        const isValid = await this._validateRepository(testRepo);
        if (!isValid) {
          throw new Error(
            "No se pudo validar el repositorio. URL no accesible o formato incorrecto."
          );
        }
      }

      // Actualizar repositorio
      this.repositories[repositoryId] = {
        ...this.repositories[repositoryId],
        ...updates,
        lastUpdated: Date.now(),
      };

      // Guardar cambios
      await this._saveRepositories();

      // Notificar evento
      this._publishEvent("repositoryUpdated", {
        repositoryId,
        repository: this.repositories[repositoryId],
      });

      // Si cambió la URL o API, sincronizar
      if (updates.url || updates.apiEndpoint) {
        this.syncRepository(repositoryId);
      }

      return true;
    } catch (error) {
      console.error(`Error al actualizar repositorio ${repositoryId}:`, error);

      this._publishEvent("repositoryError", {
        operation: "update",
        repository: repositoryId,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Elimina un repositorio
   * @param {string} repositoryId - ID del repositorio a eliminar
   * @returns {Promise<boolean>} - true si se eliminó correctamente
   */
  async removeRepository(repositoryId) {
    if (!this.initialized) await this.initialize();

    try {
      // Verificar si existe
      if (!this.repositories[repositoryId]) {
        throw new Error(`Repositorio no encontrado: ${repositoryId}`);
      }

      // No permitir eliminar repositorio oficial
      if (this.repositories[repositoryId].official) {
        throw new Error("No se puede eliminar el repositorio oficial");
      }

      // Eliminar cache de este repositorio
      delete this.repositoryCache[repositoryId];
      await this._saveRepositoryCache();

      // Eliminar timestamp de sincronización
      delete this.lastSyncTimestamps[repositoryId];
      await this._saveLastSyncTimestamps();

      // Eliminar repositorio
      delete this.repositories[repositoryId];

      // Guardar cambios
      await this._saveRepositories();

      // Notificar evento
      this._publishEvent("repositoryRemoved", {
        repositoryId,
      });

      return true;
    } catch (error) {
      console.error(`Error al eliminar repositorio ${repositoryId}:`, error);

      this._publishEvent("repositoryError", {
        operation: "remove",
        repository: repositoryId,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Habilita o deshabilita un repositorio
   * @param {string} repositoryId - ID del repositorio
   * @param {boolean} enabled - Estado de habilitación
   * @returns {Promise<boolean>} - true si se cambió correctamente
   */
  async toggleRepository(repositoryId, enabled) {
    if (!this.initialized) await this.initialize();

    try {
      // Verificar si existe
      if (!this.repositories[repositoryId]) {
        throw new Error(`Repositorio no encontrado: ${repositoryId}`);
      }

      // No permitir deshabilitar repositorio oficial
      if (this.repositories[repositoryId].official && !enabled) {
        throw new Error("No se puede deshabilitar el repositorio oficial");
      }

      // Actualizar estado
      this.repositories[repositoryId].enabled = enabled;
      this.repositories[repositoryId].lastUpdated = Date.now();

      // Guardar cambios
      await this._saveRepositories();

      // Notificar evento
      this._publishEvent("repositoryToggled", {
        repositoryId,
        enabled,
      });

      return true;
    } catch (error) {
      console.error(
        `Error al cambiar estado del repositorio ${repositoryId}:`,
        error
      );

      this._publishEvent("repositoryError", {
        operation: "toggle",
        repository: repositoryId,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Sincroniza los datos de un repositorio
   * @param {string} repositoryId - ID del repositorio a sincronizar
   * @returns {Promise<Object>} - Información sincronizada
   */
  async syncRepository(repositoryId) {
    if (!this.initialized) await this.initialize();

    try {
      // Verificar si existe
      if (!this.repositories[repositoryId]) {
        throw new Error(`Repositorio no encontrado: ${repositoryId}`);
      }

      // Verificar si está habilitado
      if (!this.repositories[repositoryId].enabled) {
        throw new Error(`El repositorio ${repositoryId} está deshabilitado`);
      }

      // Notificar inicio de sincronización
      this._publishEvent("repositorySyncStarted", {
        repositoryId,
      });

      // En una implementación real, haría una petición al repositorio
      // Simulamos el proceso
      const plugins = await this._fetchRepositoryPlugins(repositoryId);

      // Guardar en cache
      this.repositoryCache[repositoryId] = {
        plugins,
        syncedAt: Date.now(),
      };

      // Actualizar timestamp de sincronización
      this.lastSyncTimestamps[repositoryId] = Date.now();

      // Guardar cache y timestamps
      await this._saveRepositoryCache();
      await this._saveLastSyncTimestamps();

      // Actualizar info del repositorio
      this.repositories[repositoryId].lastSync = Date.now();
      await this._saveRepositories();

      // Notificar fin de sincronización
      this._publishEvent("repositorySyncCompleted", {
        repositoryId,
        pluginCount: plugins.length,
      });

      return plugins;
    } catch (error) {
      console.error(`Error al sincronizar repositorio ${repositoryId}:`, error);

      this._publishEvent("repositoryError", {
        operation: "sync",
        repository: repositoryId,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Sincroniza todos los repositorios habilitados
   * @returns {Promise<Object>} - Resultados de sincronización
   */
  async syncAllRepositories() {
    if (!this.initialized) await this.initialize();

    const results = {
      successful: [],
      failed: [],
    };

    // Iterar sobre repositorios habilitados
    for (const [repositoryId, repository] of Object.entries(
      this.repositories
    )) {
      if (repository.enabled) {
        try {
          await this.syncRepository(repositoryId);
          results.successful.push(repositoryId);
        } catch (error) {
          console.error(
            `Error al sincronizar repositorio ${repositoryId}:`,
            error
          );
          results.failed.push({
            repositoryId,
            error: error.message,
          });
        }
      }
    }

    // Notificar sincronización completa
    this._publishEvent("allRepositoriesSynced", {
      successful: results.successful.length,
      failed: results.failed.length,
      results,
    });

    return results;
  }

  /**
   * Obtiene los plugins disponibles en un repositorio
   * @param {string} repositoryId - ID del repositorio
   * @param {boolean} [forceSync=false] - Forzar sincronización
   * @returns {Promise<Array>} - Plugins disponibles
   */
  async getRepositoryPlugins(repositoryId, forceSync = false) {
    if (!this.initialized) await this.initialize();

    try {
      // Verificar si existe
      if (!this.repositories[repositoryId]) {
        throw new Error(`Repositorio no encontrado: ${repositoryId}`);
      }

      // Verificar si está habilitado
      if (!this.repositories[repositoryId].enabled) {
        throw new Error(`El repositorio ${repositoryId} está deshabilitado`);
      }

      // Verificar si necesitamos sincronizar
      const needsSync =
        forceSync ||
        !this.repositoryCache[repositoryId] ||
        !this.lastSyncTimestamps[repositoryId] ||
        Date.now() - this.lastSyncTimestamps[repositoryId] > 3600000; // 1 hora

      if (needsSync) {
        return await this.syncRepository(repositoryId);
      }

      // Devolver desde cache
      return this.repositoryCache[repositoryId]?.plugins || [];
    } catch (error) {
      console.error(
        `Error al obtener plugins del repositorio ${repositoryId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Busca plugins en todos los repositorios habilitados
   * @param {string} query - Término de búsqueda
   * @returns {Promise<Array>} - Resultados de la búsqueda
   */
  async searchPlugins(query) {
    if (!this.initialized) await this.initialize();

    try {
      const results = [];

      // Normalizar query
      const normalizedQuery = query.toLowerCase().trim();

      // Buscar en repositorios habilitados
      for (const [repositoryId, repository] of Object.entries(
        this.repositories
      )) {
        if (!repository.enabled) continue;

        try {
          // Obtener plugins del repositorio
          const plugins = await this.getRepositoryPlugins(repositoryId);

          // Filtrar según la búsqueda
          const matches = plugins.filter(
            (plugin) =>
              plugin.name.toLowerCase().includes(normalizedQuery) ||
              plugin.description.toLowerCase().includes(normalizedQuery) ||
              plugin.id.toLowerCase().includes(normalizedQuery) ||
              plugin.tags?.some((tag) =>
                tag.toLowerCase().includes(normalizedQuery)
              )
          );

          // Añadir repositorio a cada resultado
          matches.forEach((plugin) => {
            results.push({
              ...plugin,
              repositoryId,
              repositoryName: repository.name,
            });
          });
        } catch (error) {
          console.warn(
            `Error al buscar en repositorio ${repositoryId}:`,
            error
          );
        }
      }

      // Ordenar resultados por relevancia y prioridad del repositorio
      results.sort((a, b) => {
        // Primero por prioridad de repositorio
        const repoPriorityA =
          this.repositories[a.repositoryId]?.priority || 100;
        const repoPriorityB =
          this.repositories[b.repositoryId]?.priority || 100;

        if (repoPriorityA !== repoPriorityB) {
          return repoPriorityA - repoPriorityB;
        }

        // Luego por coincidencia exacta en ID
        const exactMatchA = a.id.toLowerCase() === normalizedQuery;
        const exactMatchB = b.id.toLowerCase() === normalizedQuery;

        if (exactMatchA && !exactMatchB) return -1;
        if (!exactMatchA && exactMatchB) return 1;

        // Luego por coincidencia en nombre
        const nameMatchA = a.name.toLowerCase().includes(normalizedQuery);
        const nameMatchB = b.name.toLowerCase().includes(normalizedQuery);

        if (nameMatchA && !nameMatchB) return -1;
        if (!nameMatchA && nameMatchB) return 1;

        // Finalmente por popularidad (descargas)
        return (b.downloads || 0) - (a.downloads || 0);
      });

      return results;
    } catch (error) {
      console.error("Error al buscar plugins:", error);
      throw error;
    }
  }

  /**
   * Obtiene un repositorio específico
   * @param {string} repositoryId - ID del repositorio
   * @returns {Object|null} - Información del repositorio
   */
  getRepository(repositoryId) {
    if (!this.repositories[repositoryId]) {
      return null;
    }

    return { ...this.repositories[repositoryId] };
  }

  /**
   * Obtiene todos los repositorios
   * @returns {Object} - Objeto con todos los repositorios
   */
  getRepositories() {
    return { ...this.repositories };
  }

  /**
   * Obtiene los repositorios habilitados
   * @returns {Object} - Objeto con repositorios habilitados
   */
  getEnabledRepositories() {
    const enabledRepos = {};

    Object.entries(this.repositories).forEach(([id, repo]) => {
      if (repo.enabled) {
        enabledRepos[id] = { ...repo };
      }
    });

    return enabledRepos;
  }

  // Métodos privados

  /**
   * Guarda la información de repositorios
   * @private
   */
  async _saveRepositories() {
    try {
      await storageService.set(
        STORAGE_KEYS.PLUGIN_DATA_PREFIX + "repositories",
        this.repositories
      );
      return true;
    } catch (error) {
      console.error("Error al guardar repositorios:", error);
      return false;
    }
  }

  /**
   * Guarda el cache de repositorios
   * @private
   */
  async _saveRepositoryCache() {
    try {
      await storageService.set(
        STORAGE_KEYS.PLUGIN_DATA_PREFIX + "repository_cache",
        this.repositoryCache
      );
      return true;
    } catch (error) {
      console.error("Error al guardar cache de repositorios:", error);
      return false;
    }
  }

  /**
   * Guarda los timestamps de sincronización
   * @private
   */
  async _saveLastSyncTimestamps() {
    try {
      await storageService.set(
        STORAGE_KEYS.PLUGIN_DATA_PREFIX + "repository_sync_timestamps",
        this.lastSyncTimestamps
      );
      return true;
    } catch (error) {
      console.error("Error al guardar timestamps de sincronización:", error);
      return false;
    }
  }

  /**
   * Verifica si un repositorio es accesible y válido
   * @private
   */
  async _validateRepository(repository) {
    // En una implementación real, verificaría haciendo una petición
    // Simulamos el proceso
    const { url, apiEndpoint } = repository;

    if (!url || !url.startsWith("http")) {
      return false;
    }

    if (!apiEndpoint || !apiEndpoint.startsWith("http")) {
      return false;
    }

    // Simulamos un delay de red
    await this._simulateNetworkDelay();

    // Simulamos validación exitosa
    return true;
  }

  /**
   * Obtiene la lista de plugins de un repositorio
   * @private
   */
  async _fetchRepositoryPlugins(repositoryId) {
    // En una implementación real, haría una petición HTTP
    // Simulamos el proceso
    await this._simulateNetworkDelay();

    // Datos simulados para el repositorio oficial
    if (repositoryId === "atlas-official") {
      return [
        {
          id: "example-plugin",
          name: "Plugin de Ejemplo",
          version: "0.4.0",
          author: "Atlas Team",
          description: "Plugin oficial de ejemplo para Atlas",
          minAppVersion: "0.3.0",
          maxAppVersion: "1.0.0",
          downloads: 1250,
          rating: 4.8,
          tags: ["oficial", "ejemplo", "demo"],
          lastUpdated: Date.now() - 604800000, // 1 semana atrás
        },
        {
          id: "calendar-export",
          name: "Exportador de Calendario",
          version: "0.2.1",
          author: "Atlas Team",
          description:
            "Permite exportar eventos del calendario a diversos formatos",
          minAppVersion: "0.3.0",
          maxAppVersion: "1.0.0",
          downloads: 850,
          rating: 4.5,
          tags: ["oficial", "calendario", "utilidad"],
          lastUpdated: Date.now() - 1209600000, // 2 semanas atrás
        },
        {
          id: "theme-creator",
          name: "Creador de Temas",
          version: "0.1.5",
          author: "Atlas Team",
          description: "Herramienta para crear y personalizar temas para Atlas",
          minAppVersion: "0.3.0",
          maxAppVersion: "1.0.0",
          downloads: 720,
          rating: 4.2,
          tags: ["oficial", "temas", "personalización"],
          lastUpdated: Date.now() - 2419200000, // 4 semanas atrás
        },
      ];
    }

    // Datos simulados para repositorios de comunidad
    return [
      {
        id: `${repositoryId}-plugin-1`,
        name: "Plugin Comunitario 1",
        version: "0.1.0",
        author: "Comunidad Atlas",
        description: "Un plugin creado por la comunidad",
        minAppVersion: "0.3.0",
        maxAppVersion: "1.0.0",
        downloads: 120,
        rating: 3.8,
        tags: ["comunidad", "utilidad"],
        lastUpdated: Date.now() - 1209600000, // 2 semanas atrás
      },
      {
        id: `${repositoryId}-plugin-2`,
        name: "Plugin Comunitario 2",
        version: "0.2.0",
        author: "Comunidad Atlas",
        description: "Otro plugin creado por la comunidad",
        minAppVersion: "0.3.0",
        maxAppVersion: "1.0.0",
        downloads: 85,
        rating: 4.0,
        tags: ["comunidad", "herramienta"],
        lastUpdated: Date.now() - 2592000000, // 30 días atrás
      },
    ];
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

const pluginRepositoryManager = new PluginRepositoryManager();
export default pluginRepositoryManager;
