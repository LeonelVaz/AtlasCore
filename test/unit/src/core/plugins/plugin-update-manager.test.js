// test/unit/src/core/plugins/plugin-update-manager.test.js

/**
 * @jest-environment jsdom
 */
import pluginUpdateManager from "../../../../../src/core/plugins/plugin-update-manager";

// Mockear dependencias
jest.mock("../../../../../src/core/config/constants", () => ({
  PLUGIN_CONSTANTS: {},
  STORAGE_KEYS: { PLUGIN_DATA_PREFIX: "atlas_plugin_" },
}));
jest.mock("../../../../../src/core/plugins/plugin-registry", () => ({
  getPlugin: jest.fn(),
  isPluginActive: jest.fn(),
  activatePlugin: jest.fn(),
}));
jest.mock("../../../../../src/core/plugins/plugin-package-manager", () => ({
  getInstalledPlugins: jest.fn(() => ({})),
  hasUpdate: jest.fn(),
  uninstallPlugin: jest.fn(() => Promise.resolve(true)),
  installPlugin: jest.fn(() => Promise.resolve(true)),
}));

jest.mock("../../../../../src/core/plugins/plugin-repository-manager", () => {
  const mockInstance = {
    getRepositories: jest.fn(() => ({})), // Por defecto vacío
    getRepository: jest.fn(),
  };
  return mockInstance;
});

jest.mock("../../../../../src/core/bus/event-bus", () => ({
  publish: jest.fn(),
  subscribe: jest.fn(() => jest.fn()),
}));
jest.mock("../../../../../src/services/storage-service", () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

const pluginRepositoryManager = require("../../../../../src/core/plugins/plugin-repository-manager");
const pluginPackageManager = require("../../../../../src/core/plugins/plugin-package-manager");
const eventBus = require("../../../../../src/core/bus/event-bus");
const storageService = require("../../../../../src/services/storage-service");
const { STORAGE_KEYS } = require("../../../../../src/core/config/constants");
const pluginRegistry = require("../../../../../src/core/plugins/plugin-registry");

describe("PluginUpdateManager", () => {
  const historyKey = STORAGE_KEYS.PLUGIN_DATA_PREFIX + "update_history";
  const availableUpdatesKey =
    STORAGE_KEYS.PLUGIN_DATA_PREFIX + "available_updates";
  const lastCheckKey = STORAGE_KEYS.PLUGIN_DATA_PREFIX + "last_update_check";
  const settingsKey = STORAGE_KEYS.PLUGIN_DATA_PREFIX + "update_settings";

  const pluginId = "testPlugin";
  const installedPluginInfo = {
    id: pluginId,
    version: "1.0.0",
    name: "Test Plugin",
  };
  const remotePluginInfo = {
    id: pluginId,
    version: "1.1.0",
    name: "Test Plugin Updated",
    releaseNotes: "New features!",
  };
  const mockRepo = {
    id: "official",
    name: "Official Repo",
    url: "http://official.com",
    apiEndpoint: "http://official.com/api",
  };

  let originalConsoleError;

  // beforeEach a nivel de describe principal para reseteos generales
  beforeEach(() => {
    originalConsoleError = console.error;
    console.error = jest.fn();

    jest.clearAllMocks();

    pluginUpdateManager.initialized = false;
    pluginUpdateManager.updateQueue = [];
    pluginUpdateManager.updatingPlugin = null;
    pluginUpdateManager.lastCheckTimestamp = 0;
    pluginUpdateManager.availableUpdates = {};
    pluginUpdateManager.updateHistory = {};
    pluginUpdateManager.updateSettings = {
      checkAutomatically: true, // Configurar esto a false por defecto para los tests
      checkInterval: 86400000,
      autoUpdate: false,
      updateNotificationsEnabled: true,
    };
    pluginUpdateManager._subscribers = {};
    pluginUpdateManager._lastSubscriberId = 0;

    // Configuración base de mocks de storageService
    storageService.get.mockImplementation(async (key, defaultValue) => {
      if (key === historyKey) return Promise.resolve({});
      if (key === availableUpdatesKey) return Promise.resolve({});
      if (key === lastCheckKey) return Promise.resolve(0); // Último chequeo fue hace mucho
      if (key === settingsKey)
        return Promise.resolve({
          // Devolver settings base
          checkAutomatically: false, // <- Cambiado a false para tests
          checkInterval: 86400000,
          autoUpdate: false,
          updateNotificationsEnabled: true,
        });
      return Promise.resolve(defaultValue);
    });
    storageService.set.mockResolvedValue(true);

    // Configuración base de otros mocks
    pluginPackageManager.getInstalledPlugins.mockReturnValue({
      [pluginId]: installedPluginInfo,
    });
    pluginRepositoryManager.getRepositories.mockReturnValue({}); // Sin repos por defecto
    pluginRepositoryManager.getRepository.mockReturnValue(undefined);
    pluginRegistry.getPlugin.mockReturnValue(installedPluginInfo);
    pluginRegistry.isPluginActive.mockReturnValue(false);
    pluginRegistry.activatePlugin.mockResolvedValue(true);
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe("initialize", () => {
    // No necesitamos llamar a initialize aquí si el beforeEach principal ya lo hace
    // O si queremos controlar cuándo se inicializa para tests específicos.
    // Por ahora, asumimos que los tests específicos de initialize lo llamarán.

    test("debe inicializar y cargar datos desde storageService", async () => {
      // Configurar para que NO haga checkForUpdates automáticamente
      storageService.get.mockImplementation(async (key) => {
        if (key === settingsKey)
          return Promise.resolve({
            ...pluginUpdateManager.updateSettings,
            checkAutomatically: false,
          });
        if (key === lastCheckKey) return Promise.resolve(Date.now()); // No ha pasado el intervalo
        return Promise.resolve({});
      });
      await pluginUpdateManager.initialize();
      expect(pluginUpdateManager.initialized).toBe(true);
      // Aquí se podrían añadir más aserciones sobre los valores cargados si fuera necesario.
    });

    test("debe verificar actualizaciones automáticamente si está configurado y el intervalo ha pasado", async () => {
      const checkForUpdatesSpy = jest.spyOn(
        pluginUpdateManager,
        "checkForUpdates"
      );

      // Configurar mocks para ESTE test
      storageService.get.mockImplementation(async (key) => {
        if (key === lastCheckKey)
          return Promise.resolve(
            Date.now() -
              (pluginUpdateManager.updateSettings.checkInterval + 1000)
          ); // Intervalo pasado
        if (key === settingsKey)
          return Promise.resolve({
            ...pluginUpdateManager.updateSettings,
            checkAutomatically: true,
          }); // Habilitado
        return Promise.resolve({});
      });
      pluginRepositoryManager.getRepositories.mockReturnValueOnce({
        official: mockRepo,
      }); // Proveer un repo

      await pluginUpdateManager.initialize(); // Llamar a initialize aquí para este test

      expect(checkForUpdatesSpy).toHaveBeenCalled();
      checkForUpdatesSpy.mockRestore();
    });

    test("NO debe verificar automáticamente si checkAutomatically es false", async () => {
      const checkForUpdatesSpy = jest.spyOn(
        pluginUpdateManager,
        "checkForUpdates"
      );
      storageService.get.mockImplementation(async (key) => {
        if (key === settingsKey)
          return Promise.resolve({
            ...pluginUpdateManager.updateSettings,
            checkAutomatically: false,
          });
        return Promise.resolve({});
      });
      // No es necesario mockear getRepositories aquí si checkForUpdates no se va a llamar

      await pluginUpdateManager.initialize();
      expect(checkForUpdatesSpy).not.toHaveBeenCalled();
      checkForUpdatesSpy.mockRestore();
    });
  });

  describe("checkForUpdates", () => {
    let checkPluginInRepositorySpy;
    beforeEach(async () => {
      // Asegurar que el manager esté inicializado para estos tests
      // y que haya repositorios.
      storageService.get.mockImplementation(async (key) => {
        // Mock base para settings
        if (key === settingsKey)
          return Promise.resolve({
            ...pluginUpdateManager.updateSettings,
            checkAutomatically: false,
          });
        return Promise.resolve({});
      });
      pluginRepositoryManager.getRepositories.mockReturnValue({
        official: mockRepo,
      });
      await pluginUpdateManager.initialize();

      // Limpiar mocks después de la inicialización del manager
      jest.clearAllMocks();
      // Re-establecer el mock de getRepositories para los tests de este describe
      pluginRepositoryManager.getRepositories.mockReturnValue({
        official: mockRepo,
      });
      pluginPackageManager.getInstalledPlugins.mockReturnValue({
        [pluginId]: installedPluginInfo,
      });

      checkPluginInRepositorySpy = jest
        .spyOn(pluginUpdateManager, "_checkPluginInRepository")
        .mockImplementation(async () => null);
    });
    afterEach(() => {
      checkPluginInRepositorySpy.mockRestore();
    });

    test("debe verificar actualizaciones y encontrar una disponible", async () => {
      checkPluginInRepositorySpy.mockResolvedValue(remotePluginInfo);
      pluginPackageManager.hasUpdate.mockReturnValue(true);

      const updates = await pluginUpdateManager.checkForUpdates();

      expect(checkPluginInRepositorySpy).toHaveBeenCalledWith(
        pluginId,
        installedPluginInfo.version,
        "official"
      );
      expect(updates[pluginId]).toBeDefined();
      expect(updates[pluginId].newVersion).toBe("1.1.0");
      expect(storageService.set).toHaveBeenCalledWith(
        availableUpdatesKey,
        expect.any(Object)
      );
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.updateCheckStarted",
        expect.any(Object)
      );
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.updateAvailable",
        expect.objectContaining({ pluginId })
      );
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.updateCheckCompleted",
        expect.any(Object)
      );
    });

    test("no debe encontrar actualizaciones si no las hay", async () => {
      checkPluginInRepositorySpy.mockResolvedValue({ ...installedPluginInfo });
      pluginPackageManager.hasUpdate.mockReturnValue(false);

      const updates = await pluginUpdateManager.checkForUpdates();
      expect(updates[pluginId]).toBeUndefined();
      expect(eventBus.publish).not.toHaveBeenCalledWith(
        "pluginSystem.updateAvailable",
        expect.any(Object)
      );
    });

    test("debe lanzar error si no hay repositorios configurados (controlado por mock)", async () => {
      pluginRepositoryManager.getRepositories.mockReturnValueOnce({});
      await expect(pluginUpdateManager.checkForUpdates()).rejects.toThrow(
        "No hay repositorios configurados"
      );
    });
  });

  describe("applyUpdate", () => {
    let downloadPluginPackageSpy;
    const mockPackageContent = {
      manifest: remotePluginInfo,
      files: { "index.js": "code" },
    };

    beforeEach(async () => {
      // Asegurar inicialización
      storageService.get.mockImplementation(async (key) => {
        if (key === settingsKey)
          return Promise.resolve({
            ...pluginUpdateManager.updateSettings,
            checkAutomatically: false,
          });
        return Promise.resolve({});
      });
      pluginRepositoryManager.getRepositories.mockReturnValue({
        official: mockRepo,
      }); // Para initialize
      await pluginUpdateManager.initialize();
      jest.clearAllMocks(); // Limpiar mocks de initialize

      // Configurar mocks para applyUpdate
      pluginRepositoryManager.getRepositories.mockReturnValue({
        official: mockRepo,
      });
      pluginRepositoryManager.getRepository.mockReturnValue(mockRepo);
      pluginPackageManager.getInstalledPlugins.mockReturnValue({
        [pluginId]: installedPluginInfo,
      });

      downloadPluginPackageSpy = jest
        .spyOn(pluginUpdateManager, "_downloadPluginPackage")
        .mockResolvedValue(mockPackageContent);

      pluginUpdateManager.availableUpdates = {
        [pluginId]: {
          id: pluginId,
          currentVersion: "1.0.0",
          newVersion: "1.1.0",
          repositoryId: "official",
          releaseNotes: "New features!",
        },
      };
      pluginRegistry.getPlugin.mockReturnValue(installedPluginInfo);
      pluginRegistry.isPluginActive.mockReturnValue(true);
      pluginRegistry.activatePlugin.mockResolvedValue(true);
    });
    afterEach(() => {
      downloadPluginPackageSpy.mockRestore();
    });

    test("debe aplicar una actualización disponible", async () => {
      const result = await pluginUpdateManager.applyUpdate(pluginId);

      expect(result).toBe(true);
      expect(downloadPluginPackageSpy).toHaveBeenCalledWith(
        pluginId,
        "1.1.0",
        "official"
      );
      expect(pluginPackageManager.uninstallPlugin).toHaveBeenCalledWith(
        pluginId,
        { keepSettings: true }
      );
      expect(pluginPackageManager.installPlugin).toHaveBeenCalledWith(
        mockPackageContent,
        { update: true }
      );
      expect(pluginRegistry.activatePlugin).toHaveBeenCalledWith(pluginId);
      expect(pluginUpdateManager.updateHistory[pluginId]).toBeDefined();
      expect(pluginUpdateManager.updateHistory[pluginId][0].toVersion).toBe(
        "1.1.0"
      );
      expect(pluginUpdateManager.availableUpdates[pluginId]).toBeUndefined();
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.updateStarted",
        expect.objectContaining({ pluginId })
      );
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.updateCompleted",
        expect.objectContaining({ pluginId })
      );
    });

    test("debe lanzar error si no hay actualización disponible", async () => {
      delete pluginUpdateManager.availableUpdates[pluginId];
      await expect(pluginUpdateManager.applyUpdate(pluginId)).rejects.toThrow(
        `No hay actualización disponible para el plugin: ${pluginId}`
      );
    });
  });

  describe("applyAllUpdates", () => {
    beforeEach(async () => {
      storageService.get.mockImplementation(async (key) => {
        if (key === settingsKey)
          return Promise.resolve({
            ...pluginUpdateManager.updateSettings,
            checkAutomatically: false,
          });
        return Promise.resolve({});
      });
      // No es necesario que getRepositories devuelva algo para initialize aquí, ya que checkAutomatically es false
      await pluginUpdateManager.initialize();
      jest.clearAllMocks();
      pluginPackageManager.getInstalledPlugins.mockReturnValue({
        p1: { id: "p1", version: "1.0" },
        p2: { id: "p2", version: "2.0" },
      });
    });
    test("debe intentar aplicar todas las actualizaciones disponibles", async () => {
      pluginUpdateManager.availableUpdates = {
        p1: {
          id: "p1",
          currentVersion: "1.0",
          newVersion: "1.1",
          repositoryId: "repo1",
          releaseNotes: "notes p1",
        },
        p2: {
          id: "p2",
          currentVersion: "2.0",
          newVersion: "2.1",
          repositoryId: "repo1",
          releaseNotes: "notes p2",
        },
      };
      pluginRepositoryManager.getRepository.mockReturnValue(mockRepo);
      const mockPackageP1 = {
        manifest: { id: "p1", version: "1.1" },
        files: {},
      };
      const mockPackageP2 = {
        manifest: { id: "p2", version: "2.1" },
        files: {},
      };

      const downloadSpy = jest
        .spyOn(pluginUpdateManager, "_downloadPluginPackage")
        .mockImplementation(async (id) => {
          if (id === "p1") return mockPackageP1;
          if (id === "p2") return mockPackageP2;
          return null;
        });

      pluginRegistry.getPlugin.mockImplementation((id) => {
        if (id === "p1") return { id: "p1", version: "1.0" };
        if (id === "p2") return { id: "p2", version: "2.0" };
        return null;
      });
      pluginRegistry.isPluginActive.mockReturnValue(true);
      pluginRegistry.activatePlugin.mockResolvedValue(true);

      const applyUpdateSpy = jest
        .spyOn(pluginUpdateManager, "applyUpdate")
        .mockImplementation(async (id) => {
          if (id === "p1") {
            delete pluginUpdateManager.availableUpdates["p1"];
            pluginUpdateManager.updateHistory["p1"] = [{ toVersion: "1.1" }];
            return true;
          }
          if (id === "p2") {
            throw new Error("Failed to update p2");
          }
          return false;
        });

      const results = await pluginUpdateManager.applyAllUpdates();

      expect(applyUpdateSpy).toHaveBeenCalledWith("p1");
      expect(applyUpdateSpy).toHaveBeenCalledWith("p2");
      expect(results.successful).toEqual(["p1"]);
      expect(results.failed.length).toBe(1);
      expect(results.failed[0].pluginId).toBe("p2");
      expect(results.failed[0].error).toBe("Failed to update p2");
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.massUpdateStarted",
        expect.any(Object)
      );
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.massUpdateCompleted",
        expect.any(Object)
      );

      applyUpdateSpy.mockRestore();
      downloadSpy.mockRestore();
    });
  });

  describe("configureUpdateSettings", () => {
    beforeEach(async () => {
      storageService.get.mockImplementation(async (key) => {
        if (key === settingsKey)
          return Promise.resolve({
            ...pluginUpdateManager.updateSettings,
            checkAutomatically: false,
          });
        return Promise.resolve({});
      });
      await pluginUpdateManager.initialize();
      jest.clearAllMocks();
    });
    test("debe actualizar y guardar la configuración", async () => {
      const newSettings = {
        checkAutomatically: false,
        autoUpdate: true,
        checkInterval: 120000,
      };
      await pluginUpdateManager.configureUpdateSettings(newSettings);

      expect(pluginUpdateManager.updateSettings.checkAutomatically).toBe(false);
      expect(pluginUpdateManager.updateSettings.autoUpdate).toBe(true);
      expect(pluginUpdateManager.updateSettings.checkInterval).toBe(120000);
      expect(storageService.set).toHaveBeenCalledWith(
        settingsKey,
        pluginUpdateManager.updateSettings
      );
      expect(eventBus.publish).toHaveBeenCalledWith(
        "pluginSystem.updateSettingsChanged",
        { settings: pluginUpdateManager.updateSettings }
      );
    });
  });

  describe("Utility methods", () => {
    beforeEach(async () => {
      storageService.get.mockImplementation(async (key) => {
        if (key === settingsKey)
          return Promise.resolve({
            ...pluginUpdateManager.updateSettings,
            checkAutomatically: false,
          });
        return Promise.resolve({});
      });
      await pluginUpdateManager.initialize();
      jest.clearAllMocks();
    });
    test("getAvailableUpdates debe devolver las actualizaciones actuales", () => {
      pluginUpdateManager.availableUpdates = {
        test: { id: "test", version: "2.0" },
      };
      expect(pluginUpdateManager.getAvailableUpdates()).toEqual({
        test: { id: "test", version: "2.0" },
      });
    });

    test("getUpdateHistory debe devolver el historial", () => {
      pluginUpdateManager.updateHistory = { test: [{ version: "1.0" }] };
      expect(pluginUpdateManager.getUpdateHistory()).toEqual({
        test: [{ version: "1.0" }],
      });
    });

    test("getUpdateSettings debe devolver la configuración actual", () => {
      const currentSettings = { ...pluginUpdateManager.updateSettings };
      expect(pluginUpdateManager.getUpdateSettings()).toEqual(currentSettings);
    });
  });
});
