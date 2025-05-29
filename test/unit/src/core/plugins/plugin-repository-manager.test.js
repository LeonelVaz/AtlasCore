/**
 * @jest-environment jsdom
 */
import pluginRepositoryManager from "../../../../../src/core/plugins/plugin-repository-manager";

// Mockear dependencias
jest.mock("../../../../../src/core/config/constants", () => ({
  PLUGIN_CONSTANTS: { CURRENT_APP_VERSION: "1.0.0" }, // Simular una versión de app
  STORAGE_KEYS: { PLUGIN_DATA_PREFIX: "atlas_plugin_" },
}));
jest.mock("../../../../../src/core/bus/event-bus", () => ({
  publish: jest.fn(),
  subscribe: jest.fn(() => jest.fn()), // Devuelve una función de desuscripción mock
}));
jest.mock("../../../../../src/services/storage-service", () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));

// Importar mocks para aserciones
const eventBus = require("../../../../../src/core/bus/event-bus");
const storageService = require("../../../../../src/services/storage-service");
const { STORAGE_KEYS } = require("../../../../../src/core/config/constants");

describe("PluginRepositoryManager", () => {
  const officialRepoKey = STORAGE_KEYS.PLUGIN_DATA_PREFIX + "repositories";
  const cacheKey = STORAGE_KEYS.PLUGIN_DATA_PREFIX + "repository_cache";
  const syncTimestampsKey =
    STORAGE_KEYS.PLUGIN_DATA_PREFIX + "repository_sync_timestamps";

  const mockOfficialRepo = {
    id: "atlas-official",
    name: "Repositorio Oficial de Atlas",
    url: "https://plugins.atlas-app.org",
    apiEndpoint: "https://api.atlas-app.org/plugins",
    description: "Repositorio oficial de plugins para Atlas",
    official: true,
    enabled: true,
    priority: 10,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    // Resetear estado interno del singleton
    pluginRepositoryManager.initialized = false;
    pluginRepositoryManager.repositories = {};
    pluginRepositoryManager.repositoryCache = {};
    pluginRepositoryManager.lastSyncTimestamps = {};
    pluginRepositoryManager._subscribers = {};
    pluginRepositoryManager._lastSubscriberId = 0;

    // Mockear respuestas por defecto de storageService
    storageService.get.mockImplementation(async (key, defaultValue) => {
      if (key === officialRepoKey) return Promise.resolve({}); // Vacío para que se cree el oficial
      if (key === cacheKey) return Promise.resolve({});
      if (key === syncTimestampsKey) return Promise.resolve({});
      return Promise.resolve(defaultValue);
    });
    storageService.set.mockResolvedValue(true);
    storageService.remove.mockResolvedValue(true);

    // Inicializar el manager antes de cada test
    await pluginRepositoryManager.initialize();
    // Limpiar mocks después de la inicialización para no contar las llamadas de init
    jest.clearAllMocks();
    storageService.get.mockImplementation(async (key, defaultValue) => {
      if (key === officialRepoKey)
        return Promise.resolve({
          "atlas-official": { ...mockOfficialRepo, addedAt: Date.now() },
        });
      if (key === cacheKey) return Promise.resolve({});
      if (key === syncTimestampsKey) return Promise.resolve({});
      return Promise.resolve(defaultValue);
    });
  });

  describe("initialize", () => {
    test("debe inicializar y crear repositorio oficial si no existe", async () => {
      // Ya se llama en beforeEach, aquí verificamos efectos
      expect(pluginRepositoryManager.initialized).toBe(true);
      expect(
        pluginRepositoryManager.repositories["atlas-official"]
      ).toBeDefined();
      expect(
        pluginRepositoryManager.repositories["atlas-official"].official
      ).toBe(true);
      // El set se llamaría durante el initialize original si no existiera el repo.
      // Como nuestro beforeEach lo recrea, no esperamos la llamada aquí.
    });

    test("debe cargar datos de repositorios desde storageService", async () => {
      const storedRepos = {
        "custom-repo": {
          id: "custom-repo",
          name: "Custom",
          url: "http://custom.com",
        },
      };
      storageService.get.mockImplementation(async (key) => {
        if (key === officialRepoKey) return Promise.resolve(storedRepos);
        return Promise.resolve({});
      });
      pluginRepositoryManager.initialized = false; // Forzar re-inicialización
      await pluginRepositoryManager.initialize();
      expect(storageService.get).toHaveBeenCalledWith(officialRepoKey, {});
      expect(pluginRepositoryManager.repositories["custom-repo"]).toEqual(
        storedRepos["custom-repo"]
      );
    });
  });

  describe("addRepository", () => {
    const newRepo = {
      id: "repo1",
      name: "Repo 1",
      url: "http://repo1.com",
      apiEndpoint: "http://repo1.com/api",
    };

    // Mockear _validateRepository para que devuelva true
    let originalValidateRepo;
    beforeEach(() => {
      originalValidateRepo = pluginRepositoryManager._validateRepository;
      pluginRepositoryManager._validateRepository = jest
        .fn()
        .mockResolvedValue(true);
    });
    afterEach(() => {
      pluginRepositoryManager._validateRepository = originalValidateRepo;
    });

    test("debe añadir un repositorio válido y sincronizarlo", async () => {
      jest
        .spyOn(pluginRepositoryManager, "syncRepository")
        .mockResolvedValueOnce([]); // Mock sync
      const result = await pluginRepositoryManager.addRepository(newRepo);
      expect(result).toBe(true);
      expect(pluginRepositoryManager.repositories.repo1).toBeDefined();
      expect(pluginRepositoryManager.repositories.repo1.name).toBe("Repo 1");
      expect(storageService.set).toHaveBeenCalledWith(
        officialRepoKey,
        expect.any(Object)
      );
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.repositoryAdded",
        expect.any(Object)
      );
      expect(pluginRepositoryManager.syncRepository).toHaveBeenCalledWith(
        "repo1"
      );
    });

    test("debe lanzar error si la información del repositorio es incompleta", async () => {
      await expect(
        pluginRepositoryManager.addRepository({ id: "incomplete" })
      ).rejects.toThrow("Información de repositorio incompleta");
    });

    test("debe lanzar error si el repositorio ya existe", async () => {
      await pluginRepositoryManager.addRepository(newRepo); // Añadir una vez
      await expect(pluginRepositoryManager.addRepository(newRepo)) // Intentar añadir de nuevo
        .rejects.toThrow("Ya existe un repositorio con el ID: repo1");
    });
    test("debe lanzar error si _validateRepository devuelve false", async () => {
      pluginRepositoryManager._validateRepository.mockResolvedValueOnce(false);
      await expect(
        pluginRepositoryManager.addRepository(newRepo)
      ).rejects.toThrow(
        "No se pudo validar el repositorio. URL no accesible o formato incorrecto."
      );
    });
  });

  describe("updateRepository", () => {
    const repoToUpdate = {
      id: "atlas-official",
      name: "Official Updated",
      url: "http://newofficial.com",
    };
    beforeEach(() => {
      pluginRepositoryManager._validateRepository = jest
        .fn()
        .mockResolvedValue(true);
    });

    test("debe actualizar un repositorio existente", async () => {
      const result = await pluginRepositoryManager.updateRepository(
        "atlas-official",
        { name: "Official Updated Name" }
      );
      expect(result).toBe(true);
      expect(pluginRepositoryManager.repositories["atlas-official"].name).toBe(
        "Official Updated Name"
      );
      expect(storageService.set).toHaveBeenCalledWith(
        officialRepoKey,
        expect.any(Object)
      );
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.repositoryUpdated",
        expect.any(Object)
      );
    });

    test("debe lanzar error si el repositorio no existe", async () => {
      await expect(
        pluginRepositoryManager.updateRepository("nonexistent", {
          name: "Update Fail",
        })
      ).rejects.toThrow("Repositorio no encontrado: nonexistent");
    });
  });

  describe("removeRepository", () => {
    test("debe eliminar un repositorio no oficial", async () => {
      // Primero añadir uno no oficial
      pluginRepositoryManager._validateRepository = jest
        .fn()
        .mockResolvedValue(true);
      const customRepo = {
        id: "custom",
        name: "Custom Repo",
        url: "http://custom.com",
      };
      await pluginRepositoryManager.addRepository(customRepo);

      const result = await pluginRepositoryManager.removeRepository("custom");
      expect(result).toBe(true);
      expect(pluginRepositoryManager.repositories.custom).toBeUndefined();
      expect(storageService.set).toHaveBeenCalledWith(
        officialRepoKey,
        expect.any(Object)
      ); // Al guardar repos
      expect(storageService.remove).not.toHaveBeenCalled(); // Asume que no había cache ni timestamps para este nuevo repo
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.repositoryRemoved",
        { repositoryId: "custom" }
      );
    });

    test("no debe permitir eliminar el repositorio oficial", async () => {
      await expect(
        pluginRepositoryManager.removeRepository("atlas-official")
      ).rejects.toThrow("No se puede eliminar el repositorio oficial");
    });
  });

  describe("syncRepository", () => {
    // Mock _fetchRepositoryPlugins para esta suite
    let originalFetchPlugins;
    const mockPluginsData = [
      { id: "plugin1", name: "Plugin 1", version: "1.0.0" },
    ];

    beforeEach(() => {
      originalFetchPlugins = pluginRepositoryManager._fetchRepositoryPlugins;
      pluginRepositoryManager._fetchRepositoryPlugins = jest
        .fn()
        .mockResolvedValue(mockPluginsData);
    });
    afterEach(() => {
      pluginRepositoryManager._fetchRepositoryPlugins = originalFetchPlugins;
    });

    test("debe sincronizar un repositorio y actualizar la cache", async () => {
      const plugins = await pluginRepositoryManager.syncRepository(
        "atlas-official"
      );
      expect(plugins).toEqual(mockPluginsData);
      expect(
        pluginRepositoryManager.repositoryCache["atlas-official"].plugins
      ).toEqual(mockPluginsData);
      expect(
        pluginRepositoryManager.lastSyncTimestamps["atlas-official"]
      ).toBeDefined();
      expect(storageService.set).toHaveBeenCalledWith(
        cacheKey,
        expect.any(Object)
      );
      expect(storageService.set).toHaveBeenCalledWith(
        syncTimestampsKey,
        expect.any(Object)
      );
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.repositorySyncStarted",
        { repositoryId: "atlas-official" }
      );
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.repositorySyncCompleted",
        expect.objectContaining({ repositoryId: "atlas-official" })
      );
    });

    test("debe lanzar error si el repositorio está deshabilitado", async () => {
      pluginRepositoryManager.repositories["atlas-official"].enabled = false;
      await expect(
        pluginRepositoryManager.syncRepository("atlas-official")
      ).rejects.toThrow("El repositorio atlas-official está deshabilitado");
    });
  });

  describe("searchPlugins", () => {
    const mockPluginList = [
      {
        id: "search-plugin-1",
        name: "Awesome Search Plugin",
        description: "Does awesome things",
        tags: ["search", "utility"],
      },
      {
        id: "another-plugin",
        name: "Another Utility",
        description: "Some other description",
        tags: ["utility"],
      },
    ];
    beforeEach(() => {
      // Mock getRepositoryPlugins para devolver una lista controlada
      jest
        .spyOn(pluginRepositoryManager, "getRepositoryPlugins")
        .mockResolvedValue(mockPluginList);
    });
    afterEach(() => {
      jest.restoreAllMocks();
    });

    test("debe buscar plugins por nombre", async () => {
      const results = await pluginRepositoryManager.searchPlugins("awesome");
      expect(results.length).toBe(1);
      expect(results[0].id).toBe("search-plugin-1");
      expect(pluginRepositoryManager.getRepositoryPlugins).toHaveBeenCalledWith(
        "atlas-official"
      ); // Asume que solo atlas-official está habilitado
    });

    test("debe buscar plugins por descripción", async () => {
      const results = await pluginRepositoryManager.searchPlugins(
        "other description"
      );
      expect(results.length).toBe(1);
      expect(results[0].id).toBe("another-plugin");
    });

    test("debe buscar plugins por tag", async () => {
      const results = await pluginRepositoryManager.searchPlugins("utility");
      expect(results.length).toBe(2); // Ambos plugins tienen el tag 'utility' o descripción
    });

    test("debe devolver un array vacío si no hay coincidencias", async () => {
      const results = await pluginRepositoryManager.searchPlugins(
        "nonexistentqueryterm"
      );
      expect(results.length).toBe(0);
    });
  });

  describe("Utility methods", () => {
    test("getRepository debe devolver un repositorio específico", () => {
      const repo = pluginRepositoryManager.getRepository("atlas-official");
      expect(repo).toBeDefined();
      expect(repo.id).toBe("atlas-official");
    });

    test("getRepositories debe devolver todos los repositorios", () => {
      const repos = pluginRepositoryManager.getRepositories();
      expect(repos["atlas-official"]).toBeDefined();
    });
  });
});
