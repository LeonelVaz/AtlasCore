// video-scheduler/index.js
import React from "react";
import VideoSchedulerNavItemComponent from "./components/VideoSchedulerNavItem.jsx";
import VideoSchedulerMainPageComponent from "./components/VideoSchedulerMainPage.jsx";
import SettingsPanelWidgetComponent from "./components/SettingsPanelWidget.jsx";
import ImportExportModalComponent from "./components/ImportExportModal.jsx";
import ResetDataModalComponent from "./components/ResetDataModal.jsx";
import {
  DEFAULT_SLOT_VIDEO_STRUCTURE,
  VIDEO_MAIN_STATUS,
  VIDEO_SUB_STATUS,
  VIDEO_STACKABLE_STATUS,
  DEFAULT_DAILY_INCOME_STRUCTURE,
  isDateInPast,
  INVALID_PAST_STATUSES,
  ALL_SUPPORTED_CURRENCIES,
  getCurrencySymbol,
} from "./utils/constants.js";
import "./styles/index.css";

const PLUGIN_PAGE_ID = "videoscheduler";
const STORAGE_KEY_DATA = "video_scheduler_plugin_data_v2";

export default {
  id: "video-scheduler",
  name: "Video Scheduler",
  version: "0.8.4", // Incrementar versión por los cambios
  description:
    "Planificador visual de videos con estados, multimes, moneda personalizable y detalles extendidos.",
  author: "Atlas Plugin Developer",
  minAppVersion: "0.3.0",
  maxAppVersion: "0.9.9",
  permissions: ["ui", "storage"],

  _core: null,
  _navigationExtensionId: null,
  _pageExtensionId: null,
  _settingsWidgetExtensionId: null,

  _pluginData: {
    videosBySlotKey: {},
    dailyIncomes: {},
    settings: {
      mainUserCurrency: "USD",
      currencyRates: { USD: 1, EUR: 1.08, ARS: 0.0011 },
      configuredIncomeCurrencies: ["USD", "EUR", "ARS"],
    },
  },

  init: function (core) {
    const self = this;
    return new Promise(async (resolve, reject) => {
      try {
        self._core = core;
        if (typeof React === "undefined") {
          const errMsg = `[${self.id}] React no está definido.`;
          console.error(errMsg);
          return reject(new Error(errMsg));
        }
        console.log(`[${self.id}] v${self.version} inicializando...`);
        await self._loadPluginData();
        self.publicAPI = self._createPublicAPI(self);
        self._core.plugins.registerAPI(self.id, self.publicAPI);

        const createComponentWrapper = (Component, extraProps = {}) => {
          return (propsFromAtlas) =>
            React.createElement(Component, {
              ...propsFromAtlas,
              plugin: self,
              core: self._core,
              pluginId: self.id,
              ...extraProps,
            });
        };

        self._navigationExtensionId = self._core.ui.registerExtension(
          self.id,
          self._core.ui.getExtensionZones().MAIN_NAVIGATION,
          createComponentWrapper(VideoSchedulerNavItemComponent, {
            pageIdToNavigate: PLUGIN_PAGE_ID,
          }),
          { order: 150 }
        );

        self._pageExtensionId = self._core.ui.registerExtension(
          self.id,
          self._core.ui.getExtensionZones().PLUGIN_PAGES,
          createComponentWrapper(VideoSchedulerMainPageComponent, {
            ImportExportModal: ImportExportModalComponent,
            ResetDataModal: ResetDataModalComponent,
          }),
          { order: 100, props: { pageId: PLUGIN_PAGE_ID } }
        );

        self._settingsWidgetExtensionId = self._core.ui.registerExtension(
          self.id,
          self._core.ui.getExtensionZones().SETTINGS_PANEL,
          createComponentWrapper(SettingsPanelWidgetComponent),
          { order: 100 }
        );

        console.log(`[${self.id}] Plugin inicializado.`);
        resolve(true);
      } catch (error) {
        console.error(`[${self.id}] Error en init:`, error);
        reject(error);
      }
    });
  },

  cleanup: async function () {
    const self = this;
    console.log(`[${self.id}] Limpiando plugin...`);
    try {
      await self._savePluginData();

      if (self._core && self._core.ui) {
        if (self._navigationExtensionId) {
          self._core.ui.removeExtension(self.id, self._navigationExtensionId);
        }
        if (self._pageExtensionId) {
          self._core.ui.removeExtension(self.id, self._pageExtensionId);
        }
        if (self._settingsWidgetExtensionId) {
          self._core.ui.removeExtension(
            self.id,
            self._settingsWidgetExtensionId
          );
        }
      }

      self._navigationExtensionId = null;
      self._pageExtensionId = null;
      self._settingsWidgetExtensionId = null;

      console.log(`[${self.id}] Plugin limpiado.`);
      return true;
    } catch (error) {
      console.error(`[${self.id}] Error en cleanup:`, error);
      return false;
    }
  },

  publicAPI: {},
  _createPublicAPI: function (self) {
    return {
      getMonthViewData: async (year, month) =>
        self._internalGetMonthViewData(year, month),
      updateVideoName: async (dateStr, slotIndex, newName) =>
        self._internalUpdateVideoName(dateStr, slotIndex, newName),
      updateVideoDescription: async (dateStr, slotIndex, newDescription) =>
        self._internalUpdateVideoDescription(
          dateStr,
          slotIndex,
          newDescription
        ),
      updateVideoStatus: async (
        dateStr,
        slotIndex,
        newStatus,
        newSubStatus,
        newStackableStatuses
      ) =>
        self._internalUpdateVideoStatus(
          dateStr,
          slotIndex,
          newStatus,
          newSubStatus,
          newStackableStatuses
        ),
      updateVideoDetails: async (dateStr, slotIndex, details) =>
        self._internalUpdateVideoDetails(dateStr, slotIndex, details),
      setDailyIncome: async (dateStr, incomeData) =>
        self._internalSetDailyIncome(dateStr, incomeData),
      getDailyIncome: async (dateStr) => self._internalGetDailyIncome(dateStr),
      deleteDailyIncome: async (dateStr) =>
        self._internalDeleteDailyIncome(dateStr),
      getCurrencyConfiguration: async () =>
        self._internalGetCurrencyConfiguration(),
      saveCurrencyConfiguration: async (
        mainCurrency,
        incomeCurrencies,
        rates
      ) =>
        self._internalSaveCurrencyConfiguration(
          mainCurrency,
          incomeCurrencies,
          rates
        ),
      getAllSupportedCurrencies: () => ALL_SUPPORTED_CURRENCIES,
      getCurrencySymbol: (currencyCode) => getCurrencySymbol(currencyCode),
      getCurrentViewDate: async () => {
        // Esta función es un placeholder. La forma correcta es que VideoSchedulerMainPage
        // pase su `currentDate` a los modales que lo necesiten (como ResetDataModal).
        // Si se llama sin esa prop, usamos la fecha actual del sistema como fallback.
        console.warn(
          `[${self.id}] API getCurrentViewDate: Usando fecha actual del sistema. Para mayor precisión, asegúrese de que la página principal pase su fecha de vista actual al modal de reseteo.`
        );
        return new Date();
      },
      exportAllData: async () => {
        console.log(
          `[${self.id}] Exportando datos:`,
          JSON.parse(JSON.stringify(self._pluginData))
        );
        return JSON.parse(JSON.stringify(self._pluginData));
      },
      importAllData: async (dataToImport) => {
        console.log(`[${self.id}] Iniciando importación de datos...`);
        if (typeof dataToImport !== "object" || dataToImport === null) {
          throw new Error(
            "Los datos a importar deben ser un objeto JSON válido."
          );
        }

        if (
          !dataToImport.hasOwnProperty("videosBySlotKey") ||
          !dataToImport.hasOwnProperty("dailyIncomes") ||
          !dataToImport.hasOwnProperty("settings")
        ) {
          throw new Error(
            "El archivo JSON importado no tiene la estructura esperada."
          );
        }
        if (
          typeof dataToImport.videosBySlotKey !== "object" ||
          typeof dataToImport.dailyIncomes !== "object" ||
          typeof dataToImport.settings !== "object"
        ) {
          throw new Error(
            "Las propiedades videosBySlotKey, dailyIncomes o settings no son objetos válidos."
          );
        }

        self._pluginData = JSON.parse(JSON.stringify(dataToImport));
        console.log(
          `[${self.id}] _pluginData reemplazado con datos importados.`
        );

        await self._loadPluginData(); // Re-normalizar los datos importados
        console.log(
          `[${self.id}] _pluginData normalizado después de la importación.`
        );

        await self._savePluginData();
        console.log(`[${self.id}] Datos importados y guardados.`);

        if (self._core.events) {
          self._core.events.publish(
            self.id,
            `${self.id}.dataImportedRefresh`,
            {}
          );
          console.log(`[${self.id}] Evento dataImportedRefresh publicado.`);
        }
        return true;
      },
      resetPluginData: async (scope = "current_month", currentViewDate) => {
        console.log(`[${self.id}] Iniciando reseteo de datos. Scope: ${scope}`);
        if (scope === "current_month" && !currentViewDate) {
          currentViewDate = new Date(); // Fallback
          console.warn(
            `[${self.id}] resetPluginData: currentViewDate no proporcionada para reset del mes, usando fecha actual del sistema.`
          );
        }

        if (scope === "all_data") {
          self._pluginData = {
            videosBySlotKey: {},
            dailyIncomes: {},
            settings: {
              mainUserCurrency: "USD",
              currencyRates: { USD: 1, EUR: 1.08, ARS: 0.0011 },
              configuredIncomeCurrencies: ["USD", "EUR", "ARS"],
            },
          };
          console.log(`[${self.id}] Todos los datos han sido reseteados.`);
        } else if (scope === "current_month") {
          const year = currentViewDate.getFullYear();
          const month = currentViewDate.getMonth();
          const monthKeyPrefix = `${year}-${String(month + 1).padStart(
            2,
            "0"
          )}-`;

          let videosDeleted = 0;
          Object.keys(self._pluginData.videosBySlotKey).forEach((key) => {
            if (key.startsWith(monthKeyPrefix)) {
              delete self._pluginData.videosBySlotKey[key];
              videosDeleted++;
            }
          });
          console.log(
            `[${self.id}] ${videosDeleted} videos eliminados para el mes ${monthKeyPrefix}.`
          );

          let incomesReset = 0;
          Object.keys(self._pluginData.dailyIncomes).forEach((key) => {
            if (key.startsWith(monthKeyPrefix)) {
              self._pluginData.dailyIncomes[key] = {
                ...DEFAULT_DAILY_INCOME_STRUCTURE,
                currency: self._pluginData.settings.mainUserCurrency,
              };
              incomesReset++;
            }
          });
          console.log(
            `[${self.id}] ${incomesReset} ingresos reseteados para el mes ${monthKeyPrefix}.`
          );
        } else {
          throw new Error("Alcance de reseteo no válido.");
        }

        await self._savePluginData();
        console.log(`[${self.id}] Datos reseteados y guardados.`);
        if (self._core.events) {
          self._core.events.publish(self.id, `${self.id}.dataResetRefresh`, {
            scope,
          });
          console.log(`[${self.id}] Evento dataResetRefresh publicado.`);
        }
        return true;
      },
    };
  },

  _loadPluginData: async function () {
    const self = this;
    if (!self._core || !self._core.storage) {
      console.warn(
        `[${self.id}] Core o storage no disponible en _loadPluginData.`
      );
      self._pluginData = self._pluginData || {}; // Asegurar que _pluginData exista
      self._pluginData.settings = self._pluginData.settings || {
        mainUserCurrency: "USD",
        currencyRates: { USD: 1 },
        configuredIncomeCurrencies: ["USD"],
      };
      self._pluginData.videosBySlotKey = self._pluginData.videosBySlotKey || {};
      self._pluginData.dailyIncomes = self._pluginData.dailyIncomes || {};
      return;
    }

    // Si _pluginData ya tiene contenido (ej. de una importación previa en la misma sesión),
    // usamos esos datos como base para la normalización. Sino, cargamos de storage.
    const hasPreloadedData =
      self._pluginData &&
      (Object.keys(self._pluginData.videosBySlotKey || {}).length > 0 ||
        Object.keys(self._pluginData.dailyIncomes || {}).length > 0 ||
        self._pluginData.settings); // Chequeo más robusto

    const baseData = hasPreloadedData
      ? JSON.parse(JSON.stringify(self._pluginData)) // Usar copia profunda si hay datos pre-cargados
      : await self._core.storage.getItem(self.id, STORAGE_KEY_DATA, {});

    const safeLoadedData = baseData || {};

    const defaultSettings = {
      mainUserCurrency: "USD",
      currencyRates: { USD: 1, EUR: 1.08, ARS: 0.0011 },
      configuredIncomeCurrencies: ["USD", "EUR", "ARS"],
    };

    const loadedSettingsSource = safeLoadedData.settings || {};
    const finalSettings = {
      mainUserCurrency:
        loadedSettingsSource.mainUserCurrency ||
        defaultSettings.mainUserCurrency,
      currencyRates: {
        ...defaultSettings.currencyRates,
        ...(loadedSettingsSource.currencyRates || {}),
      },
      configuredIncomeCurrencies:
        Array.isArray(loadedSettingsSource.configuredIncomeCurrencies) &&
        loadedSettingsSource.configuredIncomeCurrencies.length > 0
          ? [...new Set(loadedSettingsSource.configuredIncomeCurrencies)] // Asegurar unicidad
          : [...defaultSettings.configuredIncomeCurrencies],
    };

    if (
      !ALL_SUPPORTED_CURRENCIES.find(
        (c) => c.code === finalSettings.mainUserCurrency
      )
    ) {
      finalSettings.mainUserCurrency = defaultSettings.mainUserCurrency;
    }

    finalSettings.currencyRates[finalSettings.mainUserCurrency] = 1;

    if (
      !finalSettings.configuredIncomeCurrencies.includes(
        finalSettings.mainUserCurrency
      )
    ) {
      finalSettings.configuredIncomeCurrencies.push(
        finalSettings.mainUserCurrency
      );
      finalSettings.configuredIncomeCurrencies = [
        ...new Set(finalSettings.configuredIncomeCurrencies),
      ];
    }

    finalSettings.configuredIncomeCurrencies.forEach((code) => {
      if (
        finalSettings.currencyRates[code] === undefined ||
        finalSettings.currencyRates[code] <= 0
      ) {
        finalSettings.currencyRates[code] =
          code === finalSettings.mainUserCurrency
            ? 1
            : defaultSettings.currencyRates[code] || 1;
      }
    });

    const ratesToKeep = {};
    finalSettings.configuredIncomeCurrencies.forEach((code) => {
      if (finalSettings.currencyRates.hasOwnProperty(code)) {
        // Solo mantener si existe
        ratesToKeep[code] = finalSettings.currencyRates[code];
      } else {
        // Si no existe, asignar 1 (o 1 si es la moneda principal)
        ratesToKeep[code] = code === finalSettings.mainUserCurrency ? 1 : 1;
      }
    });
    finalSettings.currencyRates = ratesToKeep;

    self._pluginData = {
      videosBySlotKey: safeLoadedData.videosBySlotKey || {},
      dailyIncomes: safeLoadedData.dailyIncomes || {},
      settings: finalSettings,
    };

    Object.keys(self._pluginData.videosBySlotKey).forEach((key) => {
      const videoData = self._pluginData.videosBySlotKey[key] || {};
      self._pluginData.videosBySlotKey[key] = {
        ...DEFAULT_SLOT_VIDEO_STRUCTURE,
        ...videoData,
        id: key,
        stackableStatuses: Array.isArray(videoData.stackableStatuses)
          ? videoData.stackableStatuses
          : [],
        tags: Array.isArray(videoData.tags) ? videoData.tags : [],
      };
    });

    const validIncomeCurrencies =
      self._pluginData.settings.configuredIncomeCurrencies;
    const mainCurrencyForIncomes = self._pluginData.settings.mainUserCurrency;
    Object.keys(self._pluginData.dailyIncomes).forEach((dateKey) => {
      const income = self._pluginData.dailyIncomes[dateKey] || {};
      const currencyIsValid = validIncomeCurrencies.includes(income.currency);

      self._pluginData.dailyIncomes[dateKey] = {
        ...DEFAULT_DAILY_INCOME_STRUCTURE,
        ...income, // Sobrescribir con datos existentes
        currency: currencyIsValid ? income.currency : mainCurrencyForIncomes, // Corregir moneda si es inválida
      };
    });
    console.log(
      `[${self.id}] Datos cargados/normalizados:`,
      JSON.parse(JSON.stringify(self._pluginData))
    );
  },

  _savePluginData: async function () {
    const self = this;
    if (!self._core || !self._core.storage) {
      console.warn(
        `[${self.id}] Core o storage no disponible en _savePluginData.`
      );
      return;
    }
    try {
      if (
        self._pluginData.settings?.mainUserCurrency &&
        self._pluginData.settings?.currencyRates
      ) {
        self._pluginData.settings.currencyRates[
          self._pluginData.settings.mainUserCurrency
        ] = 1;
      } else {
        console.warn(
          `[${self.id}] Settings de moneda incompletos al guardar, usando defaults.`
        );
        self._pluginData.settings = self._pluginData.settings || {};
        self._pluginData.settings.mainUserCurrency =
          self._pluginData.settings.mainUserCurrency || "USD";
        self._pluginData.settings.currencyRates = self._pluginData.settings
          .currencyRates || { USD: 1 };
        self._pluginData.settings.currencyRates[
          self._pluginData.settings.mainUserCurrency
        ] = 1;
        self._pluginData.settings.configuredIncomeCurrencies = self._pluginData
          .settings.configuredIncomeCurrencies || [
          self._pluginData.settings.mainUserCurrency,
        ];
      }
      await self._core.storage.setItem(
        self.id,
        STORAGE_KEY_DATA,
        self._pluginData
      );
    } catch (error) {
      console.error(`[${self.id}] Error al guardar datos:`, error);
    }
  },

  _getVideoSlotKey: function (dateStr, slotIndex) {
    return `${dateStr}-${slotIndex}`;
  },

  _ensureVideoSlotExists: function (dateStr, slotIndex) {
    const key = this._getVideoSlotKey(dateStr, slotIndex);
    const existingVideo = this._pluginData.videosBySlotKey[key];
    if (!existingVideo) {
      this._pluginData.videosBySlotKey[key] = {
        ...DEFAULT_SLOT_VIDEO_STRUCTURE,
        id: key,
      };
    } else {
      this._pluginData.videosBySlotKey[key] = {
        ...DEFAULT_SLOT_VIDEO_STRUCTURE,
        ...existingVideo,
        id: key, // Asegurar que el ID sea correcto
        stackableStatuses: Array.isArray(existingVideo.stackableStatuses)
          ? existingVideo.stackableStatuses
          : [],
        tags: Array.isArray(existingVideo.tags) ? existingVideo.tags : [],
      };
    }
    return this._pluginData.videosBySlotKey[key];
  },

  _filterDataByMonth: function (year, month_idx) {
    const monthKeyPrefix = `${year}-${String(month_idx + 1).padStart(2, "0")}-`;
    const videosForMonth = {};
    Object.entries(this._pluginData.videosBySlotKey).forEach(([key, video]) => {
      if (key.startsWith(monthKeyPrefix)) videosForMonth[key] = { ...video };
    });
    const incomesForMonth = {};
    Object.entries(this._pluginData.dailyIncomes).forEach(([key, income]) => {
      if (key.startsWith(monthKeyPrefix)) incomesForMonth[key] = { ...income };
    });
    return { videos: videosForMonth, dailyIncomes: incomesForMonth };
  },

  _applySystemWarnings: function (video, dateStr) {
    if (!video || !dateStr) return;
    const isPastDate = isDateInPast(dateStr); // Renombrado para claridad
    const stackableStatuses = Array.isArray(video.stackableStatuses)
      ? [...video.stackableStatuses]
      : [];
    const hasName = video.name && video.name.trim() !== "";
    let shouldHaveWarning = false;

    if (isPastDate && INVALID_PAST_STATUSES.includes(video.status)) {
      shouldHaveWarning = true;
    }
    if (video.status === VIDEO_MAIN_STATUS.PENDING && hasName) {
      shouldHaveWarning = true;
    }
    if (video.status === VIDEO_MAIN_STATUS.EMPTY && hasName) {
      shouldHaveWarning = true;
    }

    const warningIndex = stackableStatuses.indexOf(
      VIDEO_STACKABLE_STATUS.WARNING
    );
    if (shouldHaveWarning && warningIndex === -1) {
      stackableStatuses.push(VIDEO_STACKABLE_STATUS.WARNING);
    } else if (!shouldHaveWarning && warningIndex > -1) {
      stackableStatuses.splice(warningIndex, 1);
    }
    video.stackableStatuses = stackableStatuses;
  },

  _internalGetMonthViewData: async function (year, month_idx) {
    const daysInMonth = new Date(year, month_idx + 1, 0).getDate();
    let dataChangedByGet = false;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month_idx + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      for (let slotIndex = 0; slotIndex < 3; slotIndex++) {
        const key = this._getVideoSlotKey(dateStr, slotIndex);
        const videoBeforeEnsure = this._pluginData.videosBySlotKey[key]
          ? JSON.stringify(this._pluginData.videosBySlotKey[key])
          : null;
        this._ensureVideoSlotExists(dateStr, slotIndex);
        const videoAfterEnsure = JSON.stringify(
          this._pluginData.videosBySlotKey[key]
        );
        if (videoBeforeEnsure !== videoAfterEnsure) dataChangedByGet = true;
      }
      if (!this._pluginData.dailyIncomes[dateStr]) {
        this._pluginData.dailyIncomes[dateStr] = {
          ...DEFAULT_DAILY_INCOME_STRUCTURE,
          currency: this._pluginData.settings.mainUserCurrency,
        };
        dataChangedByGet = true;
      } else {
        // Asegurar que los ingresos existentes tengan la estructura completa
        const income = this._pluginData.dailyIncomes[dateStr];
        const incomeBeforeEnsure = JSON.stringify(income);
        this._pluginData.dailyIncomes[dateStr] = {
          ...DEFAULT_DAILY_INCOME_STRUCTURE,
          currency: this._pluginData.settings.mainUserCurrency,
          ...income,
        };
        if (
          JSON.stringify(this._pluginData.dailyIncomes[dateStr]) !==
          incomeBeforeEnsure
        )
          dataChangedByGet = true;
      }
    }

    const monthKeyPrefix = `${year}-${String(month_idx + 1).padStart(2, "0")}-`;
    Object.keys(this._pluginData.videosBySlotKey).forEach((key) => {
      if (!key.startsWith(monthKeyPrefix)) return;
      const video = this._pluginData.videosBySlotKey[key];
      const dateStrOfVideo = key.substring(0, 10);
      const isPastDate = isDateInPast(dateStrOfVideo);
      const originalState = JSON.stringify(video);

      if (isPastDate) {
        if (video.status === VIDEO_MAIN_STATUS.PENDING) {
          video.status = VIDEO_MAIN_STATUS.EMPTY;
          video.name = "";
          video.description = "";
          video.subStatus = null;
          video.stackableStatuses = [];
        }
        if (
          video.status === VIDEO_MAIN_STATUS.PUBLISHED &&
          video.subStatus === VIDEO_SUB_STATUS.SCHEDULED
        ) {
          video.subStatus = null;
        }
      }
      this._applySystemWarnings(video, dateStrOfVideo);

      if (JSON.stringify(video) !== originalState) dataChangedByGet = true;
    });

    if (dataChangedByGet) await this._savePluginData();
    return this._filterDataByMonth(year, month_idx);
  },

  _internalUpdateVideoName: async function (dateStr, slotIndex, newName) {
    const video = this._ensureVideoSlotExists(dateStr, slotIndex);
    const oldName = video.name;
    video.name = newName.trim();
    const isPastDate = isDateInPast(dateStr);

    if (isPastDate) {
      if (video.status === VIDEO_MAIN_STATUS.EMPTY && video.name !== "") {
        video.status = VIDEO_MAIN_STATUS.DEVELOPMENT;
      } else if (video.name === "" && oldName !== "") {
        // Solo cambiar a EMPTY si se borra un nombre que existía
        video.status = VIDEO_MAIN_STATUS.EMPTY;
        video.subStatus = null;
        video.stackableStatuses = []; // Resetear estados apilables al vaciar
      }
    } else {
      // Para fechas futuras o presentes
      if (video.status === VIDEO_MAIN_STATUS.PENDING && video.name !== "") {
        video.status = VIDEO_MAIN_STATUS.DEVELOPMENT;
      } else if (
        video.name === "" &&
        oldName !== "" &&
        video.status !== VIDEO_MAIN_STATUS.EMPTY
      ) {
        video.status = VIDEO_MAIN_STATUS.PENDING;
        video.subStatus = null;
        video.stackableStatuses = [];
      }
    }
    this._applySystemWarnings(video, dateStr);
    video.updatedAt = new Date().toISOString();
    await this._savePluginData();
    return JSON.parse(JSON.stringify(video)); // Devolver copia
  },

  _internalUpdateVideoDescription: async function (
    dateStr,
    slotIndex,
    newDescription
  ) {
    const video = this._ensureVideoSlotExists(dateStr, slotIndex);
    video.description = newDescription.trim();
    video.updatedAt = new Date().toISOString();
    await this._savePluginData();
    return JSON.parse(JSON.stringify(video));
  },

  _internalUpdateVideoStatus: async function (
    dateStr,
    slotIndex,
    newMainStatus,
    newSubStatus,
    newStackableStatuses = []
  ) {
    const video = this._ensureVideoSlotExists(dateStr, slotIndex);
    const isPastDate = isDateInPast(dateStr);

    if (
      isPastDate &&
      newMainStatus === VIDEO_MAIN_STATUS.PUBLISHED &&
      newSubStatus === VIDEO_SUB_STATUS.SCHEDULED
    ) {
      newSubStatus = null; // No puede estar "SCHEDULED" en el pasado si ya está "PUBLISHED"
    }

    // Si se cambia a EMPTY, limpiar nombre, descripción y sub-estados
    if (newMainStatus === VIDEO_MAIN_STATUS.EMPTY) {
      video.name = ""; // Borrar nombre al pasar a EMPTY
      video.description = ""; // Borrar descripción
      newSubStatus = null; // No hay sub-estado para EMPTY
      newStackableStatuses = []; // Limpiar estados apilables
    } else if (newMainStatus === VIDEO_MAIN_STATUS.PENDING) {
      // Si se cambia a PENDING, usualmente se borra el sub-estado.
      // Los stackable statuses pueden mantenerse si el usuario los puso intencionalmente.
      newSubStatus = null;
    }

    video.status = newMainStatus;
    video.subStatus = newSubStatus;

    const userStackableStatuses = (newStackableStatuses || []).filter(
      (status) => status !== VIDEO_STACKABLE_STATUS.WARNING // El sistema maneja WARNING
    );
    video.stackableStatuses = [...userStackableStatuses];
    this._applySystemWarnings(video, dateStr);
    video.updatedAt = new Date().toISOString();
    await this._savePluginData();
    return JSON.parse(JSON.stringify(video));
  },

  _internalUpdateVideoDetails: async function (dateStr, slotIndex, details) {
    const video = this._ensureVideoSlotExists(dateStr, slotIndex);
    if (details.hasOwnProperty("detailedDescription"))
      video.detailedDescription = details.detailedDescription;
    if (details.hasOwnProperty("platform")) video.platform = details.platform;
    if (details.hasOwnProperty("url")) video.url = details.url;
    if (details.hasOwnProperty("duration")) video.duration = details.duration;
    if (details.hasOwnProperty("tags"))
      video.tags = Array.isArray(details.tags) ? details.tags : [];
    video.updatedAt = new Date().toISOString();
    await this._savePluginData();
    return JSON.parse(JSON.stringify(video));
  },

  _internalSetDailyIncome: async function (dateStr, incomeData) {
    const mainCurrency = this._pluginData.settings.mainUserCurrency;
    const currentIncome = this._pluginData.dailyIncomes[dateStr] || {};

    let newAmount = parseFloat(incomeData.amount);
    if (isNaN(newAmount) || newAmount <= 0) {
      // Si el monto es 0, vacío, o inválido
      this._pluginData.dailyIncomes[dateStr] = {
        ...DEFAULT_DAILY_INCOME_STRUCTURE,
        currency: incomeData.currency || currentIncome.currency || mainCurrency, // Mantener moneda si existe, sino la del form, sino la principal
      };
    } else {
      this._pluginData.dailyIncomes[dateStr] = {
        ...DEFAULT_DAILY_INCOME_STRUCTURE, // Empezar con la base
        ...currentIncome, // Mantener datos existentes como payer, status si no se proveen nuevos
        ...incomeData, // Sobrescribir con los nuevos datos
        amount: newAmount, // Usar el monto parseado
        currency: incomeData.currency || currentIncome.currency || mainCurrency, // Priorizar moneda del form, luego existente, luego principal
      };
    }
    await this._savePluginData();
    return JSON.parse(JSON.stringify(this._pluginData.dailyIncomes[dateStr]));
  },

  _internalGetDailyIncome: async function (dateStr) {
    const income = this._pluginData.dailyIncomes[dateStr] || {
      ...DEFAULT_DAILY_INCOME_STRUCTURE,
      currency: this._pluginData.settings.mainUserCurrency,
    };
    return JSON.parse(JSON.stringify(income));
  },

  _internalDeleteDailyIncome: async function (dateStr) {
    if (this._pluginData.dailyIncomes[dateStr]) {
      this._pluginData.dailyIncomes[dateStr] = {
        ...DEFAULT_DAILY_INCOME_STRUCTURE,
        currency: this._pluginData.settings.mainUserCurrency, // Resetear a la moneda principal
      };
      await this._savePluginData();
      return true;
    }
    return false;
  },

  _internalGetCurrencyConfiguration: async function () {
    return JSON.parse(JSON.stringify(this._pluginData.settings));
  },

  _internalSaveCurrencyConfiguration: async function (
    mainCurrency,
    incomeCurrencies,
    rates
  ) {
    if (!ALL_SUPPORTED_CURRENCIES.find((c) => c.code === mainCurrency)) {
      console.error(`[${this.id}] Moneda principal inválida: ${mainCurrency}`);
      return JSON.parse(JSON.stringify(this._pluginData.settings)); // Devolver sin cambios
    }
    this._pluginData.settings.mainUserCurrency = mainCurrency;

    const validatedIncomeCurrencies = incomeCurrencies.filter((code) =>
      ALL_SUPPORTED_CURRENCIES.find((c) => c.code === code)
    );
    if (!validatedIncomeCurrencies.includes(mainCurrency)) {
      validatedIncomeCurrencies.push(mainCurrency);
    }
    this._pluginData.settings.configuredIncomeCurrencies = [
      ...new Set(validatedIncomeCurrencies),
    ];

    const validatedRates = {};
    this._pluginData.settings.configuredIncomeCurrencies.forEach((code) => {
      if (code === mainCurrency) {
        validatedRates[code] = 1;
      } else if (rates && typeof rates[code] === "number" && rates[code] > 0) {
        validatedRates[code] = rates[code];
      } else {
        // Si la tasa no es válida o no existe, intentar mantener la anterior o default a 1
        const existingRate = this._pluginData.settings.currencyRates
          ? this._pluginData.settings.currencyRates[code]
          : undefined;
        validatedRates[code] =
          typeof existingRate === "number" && existingRate > 0
            ? existingRate
            : 1;
      }
    });
    this._pluginData.settings.currencyRates = validatedRates;

    // Limpiar tasas de monedas que ya no están en configuredIncomeCurrencies
    Object.keys(this._pluginData.settings.currencyRates).forEach(
      (rateCurrency) => {
        if (
          !this._pluginData.settings.configuredIncomeCurrencies.includes(
            rateCurrency
          )
        ) {
          delete this._pluginData.settings.currencyRates[rateCurrency];
        }
      }
    );

    await this._savePluginData();
    if (this._core && this._core.events && this._core.events.publish) {
      this._core.events.publish(
        this.id,
        `${this.id}.currencyConfigChanged`,
        JSON.parse(JSON.stringify(this._pluginData.settings))
      );
    }
    return JSON.parse(JSON.stringify(this._pluginData.settings));
  },
};
