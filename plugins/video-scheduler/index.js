// video-scheduler/index.js
import React from "react";
import VideoSchedulerNavItemComponent from "./components/VideoSchedulerNavItem.jsx";
import VideoSchedulerMainPageComponent from "./components/VideoSchedulerMainPage.jsx";
// highlight-next-line
import SettingsPanelWidgetComponent from "./components/SettingsPanelWidget.jsx"; // Nueva importación
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
const STORAGE_KEY_DATA = "video_scheduler_plugin_data_v2"; // Mantener v2 si la estructura no cambia drásticamente

export default {
  id: "video-scheduler",
  name: "Video Scheduler",
  version: "0.8.2", // Incrementar versión
  description:
    "Planificador visual de videos con estados, multimes, moneda personalizable y detalles extendidos.",
  author: "Atlas Plugin Developer",
  minAppVersion: "0.3.0",
  maxAppVersion: "0.9.9",
  permissions: ["ui", "storage"],

  _core: null,
  _navigationExtensionId: null,
  _pageExtensionId: null,
  // highlight-next-line
  _settingsWidgetExtensionId: null, // Para el nuevo widget

  _pluginData: {
    videosBySlotKey: {},
    dailyIncomes: {},
    settings: {
      mainUserCurrency: "USD",
      currencyRates: { USD: 1, EUR: 1.08, ARS: 0.0011 },
      configuredIncomeCurrencies: ["USD", "EUR", "ARS"],
      // Podríamos añadir aquí más configuraciones en el futuro
      // ejemploEnableNotifications: true,
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

        // Helper para crear wrappers de componentes
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

        // Registrar NavItem
        self._navigationExtensionId = self._core.ui.registerExtension(
          self.id,
          self._core.ui.getExtensionZones().MAIN_NAVIGATION,
          createComponentWrapper(VideoSchedulerNavItemComponent, {
            pageIdToNavigate: PLUGIN_PAGE_ID,
          }),
          { order: 150 }
        );

        // Registrar MainPage
        self._pageExtensionId = self._core.ui.registerExtension(
          self.id,
          self._core.ui.getExtensionZones().PLUGIN_PAGES,
          createComponentWrapper(VideoSchedulerMainPageComponent),
          { order: 100, props: { pageId: PLUGIN_PAGE_ID } }
        );

        // highlight-start
        // Registrar SettingsPanelWidget
        self._settingsWidgetExtensionId = self._core.ui.registerExtension(
          self.id,
          self._core.ui.getExtensionZones().SETTINGS_PANEL, // Zona correcta
          createComponentWrapper(SettingsPanelWidgetComponent), // Usar el wrapper
          { order: 100 } // Opcional: ajustar orden si hay otros widgets
        );
        // highlight-end

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
      await self._savePluginData(); // Guardar datos antes de limpiar

      // Limpiar extensiones específicas
      if (self._core && self._core.ui) {
        if (self._navigationExtensionId) {
          self._core.ui.removeExtension(self.id, self._navigationExtensionId);
        }
        if (self._pageExtensionId) {
          self._core.ui.removeExtension(self.id, self._pageExtensionId);
        }
        // highlight-start
        if (self._settingsWidgetExtensionId) {
          self._core.ui.removeExtension(
            self.id,
            self._settingsWidgetExtensionId
          );
        }
        // highlight-end
      }

      self._navigationExtensionId = null;
      self._pageExtensionId = null;
      // highlight-next-line
      self._settingsWidgetExtensionId = null;

      console.log(`[${self.id}] Plugin limpiado.`);
      return true;
    } catch (error) {
      console.error(`[${self.id}] Error en cleanup:`, error);
      return false;
    }
  },

  publicAPI: {}, // Se define en _createPublicAPI
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
        // Usado por SettingsPanelWidget y CurrencyRateForm
        self._internalGetCurrencyConfiguration(),
      saveCurrencyConfiguration: async (
        // Usado por SettingsPanelWidget y CurrencyRateForm
        mainCurrency,
        incomeCurrencies,
        rates
      ) =>
        self._internalSaveCurrencyConfiguration(
          mainCurrency,
          incomeCurrencies,
          rates
        ),
      getAllSupportedCurrencies: () => ALL_SUPPORTED_CURRENCIES, // Usado por SettingsPanelWidget y otros forms
      getCurrencySymbol: (currencyCode) => getCurrencySymbol(currencyCode),
      // Aquí podrían ir más funciones para otras configuraciones si las añades
      // Ejemplo:
      // getPluginSpecificSetting: async (key) => self._pluginData.settings[key],
      // savePluginSpecificSetting: async (key, value) => {
      //   self._pluginData.settings[key] = value;
      //   await self._savePluginData();
      //   return self._pluginData.settings[key];
      // }
    };
  },

  _loadPluginData: async function () {
    const self = this;
    if (!self._core || !self._core.storage) {
      console.warn(
        `[${self.id}] Core o storage no disponible en _loadPluginData.`
      );
      self._pluginData.settings = {
        // Asegurar que settings exista incluso si falla la carga
        mainUserCurrency: "USD",
        currencyRates: { USD: 1, EUR: 1.08, ARS: 0.0011 },
        configuredIncomeCurrencies: ["USD", "EUR", "ARS"],
      };
      return;
    }
    const loadedData = await self._core.storage.getItem(
      self.id,
      STORAGE_KEY_DATA,
      {} // Default a objeto vacío si no hay nada
    );
    const safeLoadedData = loadedData || {};

    // Definir estructura de settings por defecto más robusta
    const defaultSettings = {
      mainUserCurrency: "USD",
      currencyRates: { USD: 1, EUR: 1.08, ARS: 0.0011 }, // Tasas base
      configuredIncomeCurrencies: ["USD", "EUR", "ARS"], // Monedas de ingreso base
      // ejemploEnableNotifications: true, // otras configuraciones
    };

    const loadedSettings = safeLoadedData.settings || {};

    // Fusionar configuraciones cargadas con las por defecto
    // Esto asegura que si se añaden nuevas claves de settings en el futuro,
    // el plugin no falle al cargarlas si no existen en los datos guardados.
    const finalSettings = { ...defaultSettings, ...loadedSettings };

    // Re-validar y asegurar consistencia de la configuración de moneda
    if (
      !ALL_SUPPORTED_CURRENCIES.find(
        (c) => c.code === finalSettings.mainUserCurrency
      )
    ) {
      finalSettings.mainUserCurrency = defaultSettings.mainUserCurrency; // Fallback a USD
    }

    finalSettings.currencyRates = {
      ...defaultSettings.currencyRates,
      ...(finalSettings.currencyRates || {}),
    };
    finalSettings.currencyRates[finalSettings.mainUserCurrency] = 1; // Moneda principal siempre tasa 1

    if (
      !Array.isArray(finalSettings.configuredIncomeCurrencies) ||
      finalSettings.configuredIncomeCurrencies.length === 0
    ) {
      finalSettings.configuredIncomeCurrencies = [
        ...defaultSettings.configuredIncomeCurrencies,
      ];
    }
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
    // Asegurar que todas las configuredIncomeCurrencies tengan una tasa
    finalSettings.configuredIncomeCurrencies.forEach((code) => {
      if (finalSettings.currencyRates[code] === undefined) {
        finalSettings.currencyRates[code] =
          code === finalSettings.mainUserCurrency
            ? 1
            : defaultSettings.currencyRates[code] || 1;
      }
    });

    self._pluginData = {
      videosBySlotKey: safeLoadedData.videosBySlotKey || {},
      dailyIncomes: safeLoadedData.dailyIncomes || {},
      settings: finalSettings,
    };

    // Normalizar videos (ya existente)
    Object.keys(self._pluginData.videosBySlotKey).forEach((key) => {
      self._pluginData.videosBySlotKey[key] = {
        ...DEFAULT_SLOT_VIDEO_STRUCTURE,
        ...self._pluginData.videosBySlotKey[key],
        stackableStatuses: Array.isArray(
          self._pluginData.videosBySlotKey[key].stackableStatuses
        )
          ? self._pluginData.videosBySlotKey[key].stackableStatuses
          : [],
        tags: Array.isArray(self._pluginData.videosBySlotKey[key].tags)
          ? self._pluginData.videosBySlotKey[key].tags
          : [],
      };
    });

    // Normalizar dailyIncomes (ya existente)
    const validIncomeCurrencies =
      self._pluginData.settings.configuredIncomeCurrencies;
    const mainCurrencyForIncomes = self._pluginData.settings.mainUserCurrency;
    Object.values(self._pluginData.dailyIncomes).forEach((income) => {
      if (!validIncomeCurrencies.includes(income.currency)) {
        income.currency = mainCurrencyForIncomes;
      }
    });
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
      // Asegurar que la configuración de moneda sea consistente antes de guardar
      if (
        self._pluginData.settings?.mainUserCurrency &&
        self._pluginData.settings?.currencyRates
      ) {
        self._pluginData.settings.currencyRates[
          self._pluginData.settings.mainUserCurrency
        ] = 1;
      } else {
        // Fallback si settings está corrupto o incompleto
        self._pluginData.settings = {
          mainUserCurrency: "USD",
          currencyRates: { USD: 1, EUR: 1.08, ARS: 0.0011 },
          configuredIncomeCurrencies: ["USD", "EUR", "ARS"],
        };
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

  // _getVideoSlotKey, _ensureVideoSlotExists, _filterDataByMonth, _applySystemWarnings
  // _internalGetMonthViewData, _internalUpdateVideoName, _internalUpdateVideoDescription
  // _internalUpdateVideoStatus, _internalUpdateVideoDetails, _internalSetDailyIncome
  // _internalGetDailyIncome, _internalDeleteDailyIncome
  // (Estas funciones internas no necesitan cambios para el widget de configuración,
  // a menos que el widget fuera a modificar directamente videos o ingresos, lo cual no es el caso)

  _getVideoSlotKey: (dateStr, slotIndex) => `${dateStr}-${slotIndex}`,

  _ensureVideoSlotExists: function (dateStr, slotIndex) {
    const key = this._getVideoSlotKey(dateStr, slotIndex);
    if (!this._pluginData.videosBySlotKey[key]) {
      this._pluginData.videosBySlotKey[key] = {
        ...DEFAULT_SLOT_VIDEO_STRUCTURE,
        id: key,
      };
    } else {
      this._pluginData.videosBySlotKey[key] = {
        ...DEFAULT_SLOT_VIDEO_STRUCTURE,
        ...this._pluginData.videosBySlotKey[key],
        stackableStatuses: Array.isArray(
          this._pluginData.videosBySlotKey[key].stackableStatuses
        )
          ? this._pluginData.videosBySlotKey[key].stackableStatuses
          : [],
        tags: Array.isArray(this._pluginData.videosBySlotKey[key].tags)
          ? this._pluginData.videosBySlotKey[key].tags
          : [],
      };
    }
    return this._pluginData.videosBySlotKey[key];
  },

  _filterDataByMonth: function (year, month_idx) {
    const self = this;
    const monthKeyPrefix = `${year}-${String(month_idx + 1).padStart(2, "0")}-`;
    const videosForMonth = {};
    Object.entries(self._pluginData.videosBySlotKey).forEach(([key, video]) => {
      if (key.startsWith(monthKeyPrefix)) videosForMonth[key] = { ...video };
    });
    const incomesForMonth = {};
    Object.entries(self._pluginData.dailyIncomes).forEach(([key, income]) => {
      if (key.startsWith(monthKeyPrefix)) incomesForMonth[key] = { ...income };
    });
    return { videos: videosForMonth, dailyIncomes: incomesForMonth };
  },

  _applySystemWarnings: function (video, dateStr) {
    if (!video || !dateStr) return;
    const isPast = isDateInPast(dateStr);
    const stackableStatuses = Array.isArray(video.stackableStatuses)
      ? [...video.stackableStatuses]
      : [];
    const hasName = video.name && video.name.trim() !== "";
    let shouldHaveWarning = false;
    if (isPast && INVALID_PAST_STATUSES.includes(video.status))
      shouldHaveWarning = true;
    if (video.status === VIDEO_MAIN_STATUS.PENDING && hasName)
      shouldHaveWarning = true;
    if (video.status === VIDEO_MAIN_STATUS.EMPTY && hasName)
      shouldHaveWarning = true;
    const warningIndex = stackableStatuses.indexOf(
      VIDEO_STACKABLE_STATUS.WARNING
    );
    if (shouldHaveWarning && warningIndex === -1)
      stackableStatuses.push(VIDEO_STACKABLE_STATUS.WARNING);
    else if (!shouldHaveWarning && warningIndex > -1)
      stackableStatuses.splice(warningIndex, 1);
    video.stackableStatuses = stackableStatuses;
  },

  _internalGetMonthViewData: async function (year, month_idx) {
    const self = this;
    const daysInMonth = new Date(year, month_idx + 1, 0).getDate();
    let dataChanged = false;
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month_idx + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      for (let slotIndex = 0; slotIndex < 3; slotIndex++) {
        self._ensureVideoSlotExists(dateStr, slotIndex);
      }
      if (!self._pluginData.dailyIncomes[dateStr]) {
        self._pluginData.dailyIncomes[dateStr] = {
          ...DEFAULT_DAILY_INCOME_STRUCTURE,
          currency: self._pluginData.settings.mainUserCurrency,
        };
        dataChanged = true;
      }
    }
    const monthKeyPrefix = `${year}-${String(month_idx + 1).padStart(2, "0")}-`;
    Object.keys(self._pluginData.videosBySlotKey).forEach((key) => {
      if (!key.startsWith(monthKeyPrefix)) return;
      const video = self._pluginData.videosBySlotKey[key];
      const dateStrOfVideo = key.substring(0, 10); // Asegurar que usamos dateStr del video
      const isPast = isDateInPast(dateStrOfVideo);
      const originalState = JSON.stringify(video);
      if (isPast) {
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
        )
          video.subStatus = null;
      }
      self._applySystemWarnings(video, dateStrOfVideo);
      if (JSON.stringify(video) !== originalState) dataChanged = true;
    });
    if (dataChanged) await self._savePluginData();
    return self._filterDataByMonth(year, month_idx);
  },

  _internalUpdateVideoName: async function (dateStr, slotIndex, newName) {
    const self = this;
    const video = self._ensureVideoSlotExists(dateStr, slotIndex);
    const oldName = video.name;
    video.name = newName.trim();
    const isPast = isDateInPast(dateStr);
    if (isPast) {
      if (video.status === VIDEO_MAIN_STATUS.EMPTY && video.name !== "")
        video.status = VIDEO_MAIN_STATUS.DEVELOPMENT;
      else if (video.name === "" && oldName !== "") {
        video.status = VIDEO_MAIN_STATUS.EMPTY;
        video.subStatus = null;
        video.stackableStatuses = [];
      }
    } else {
      if (video.status === VIDEO_MAIN_STATUS.PENDING && video.name !== "")
        video.status = VIDEO_MAIN_STATUS.DEVELOPMENT;
      else if (
        video.name === "" &&
        oldName !== "" &&
        video.status !== VIDEO_MAIN_STATUS.EMPTY
      ) {
        video.status = VIDEO_MAIN_STATUS.PENDING;
        video.subStatus = null;
        video.stackableStatuses = [];
      }
    }
    self._applySystemWarnings(video, dateStr);
    video.updatedAt = new Date().toISOString();
    await self._savePluginData();
    return video;
  },

  _internalUpdateVideoDescription: async function (
    dateStr,
    slotIndex,
    newDescription
  ) {
    const self = this;
    const video = self._ensureVideoSlotExists(dateStr, slotIndex);
    video.description = newDescription.trim();
    video.updatedAt = new Date().toISOString();
    await self._savePluginData();
    return video;
  },

  _internalUpdateVideoStatus: async function (
    dateStr,
    slotIndex,
    newMainStatus,
    newSubStatus,
    newStackableStatuses = []
  ) {
    const self = this;
    const video = self._ensureVideoSlotExists(dateStr, slotIndex);
    const isPast = isDateInPast(dateStr);
    if (
      isPast &&
      newMainStatus === VIDEO_MAIN_STATUS.PUBLISHED &&
      newSubStatus === VIDEO_SUB_STATUS.SCHEDULED
    )
      newSubStatus = null;
    if (newMainStatus === VIDEO_MAIN_STATUS.EMPTY) {
      video.name = "";
      video.description = "";
      newSubStatus = null;
      newStackableStatuses = [];
    }
    video.status = newMainStatus;
    video.subStatus = newSubStatus;
    const userStackableStatuses = (newStackableStatuses || []).filter(
      (status) => status !== VIDEO_STACKABLE_STATUS.WARNING
    );
    video.stackableStatuses = [...userStackableStatuses];
    self._applySystemWarnings(video, dateStr);
    video.updatedAt = new Date().toISOString();
    await self._savePluginData();
    return video;
  },

  _internalUpdateVideoDetails: async function (dateStr, slotIndex, details) {
    const self = this;
    const video = self._ensureVideoSlotExists(dateStr, slotIndex);
    if (details.hasOwnProperty("detailedDescription"))
      video.detailedDescription = details.detailedDescription;
    if (details.hasOwnProperty("platform")) video.platform = details.platform;
    if (details.hasOwnProperty("url")) video.url = details.url;
    if (details.hasOwnProperty("duration")) video.duration = details.duration;
    if (details.hasOwnProperty("tags"))
      video.tags = Array.isArray(details.tags) ? details.tags : [];
    video.updatedAt = new Date().toISOString();
    await self._savePluginData();
    return video;
  },

  _internalSetDailyIncome: async function (dateStr, incomeData) {
    const self = this;
    const mainCurrency = self._pluginData.settings.mainUserCurrency;
    if (parseFloat(incomeData.amount) === 0 || incomeData.amount === "") {
      self._pluginData.dailyIncomes[dateStr] = {
        ...DEFAULT_DAILY_INCOME_STRUCTURE,
        currency: incomeData.currency || mainCurrency,
      };
    } else {
      self._pluginData.dailyIncomes[dateStr] = {
        ...DEFAULT_DAILY_INCOME_STRUCTURE,
        currency: mainCurrency,
        ...(self._pluginData.dailyIncomes[dateStr] || {}),
        ...incomeData,
      };
    }
    await self._savePluginData();
    return self._pluginData.dailyIncomes[dateStr];
  },

  _internalGetDailyIncome: async function (dateStr) {
    const self = this;
    return (
      self._pluginData.dailyIncomes[dateStr] || {
        ...DEFAULT_DAILY_INCOME_STRUCTURE,
        currency: self._pluginData.settings.mainUserCurrency,
      }
    );
  },

  _internalDeleteDailyIncome: async function (dateStr) {
    const self = this;
    if (self._pluginData.dailyIncomes[dateStr]) {
      self._pluginData.dailyIncomes[dateStr] = {
        ...DEFAULT_DAILY_INCOME_STRUCTURE,
        currency: self._pluginData.settings.mainUserCurrency,
      };
      await self._savePluginData();
      return true;
    }
    return false;
  },

  _internalGetCurrencyConfiguration: async function () {
    const self = this;
    // Devolver una copia profunda para evitar mutaciones externas
    return JSON.parse(JSON.stringify(self._pluginData.settings));
  },

  _internalSaveCurrencyConfiguration: async function (
    mainCurrency,
    incomeCurrencies,
    rates
  ) {
    const self = this;
    // Validación y lógica de guardado (ya existente y parece robusta)
    if (!ALL_SUPPORTED_CURRENCIES.find((c) => c.code === mainCurrency)) {
      console.error(`[${self.id}] Moneda principal inválida: ${mainCurrency}`);
      return self._pluginData.settings; // Retorna la configuración actual sin cambios
    }
    self._pluginData.settings.mainUserCurrency = mainCurrency;

    const validatedIncomeCurrencies = incomeCurrencies.filter((code) =>
      ALL_SUPPORTED_CURRENCIES.find((c) => c.code === code)
    );
    if (!validatedIncomeCurrencies.includes(mainCurrency)) {
      validatedIncomeCurrencies.push(mainCurrency);
    }
    // Usar Set para eliminar duplicados y luego convertir a array
    self._pluginData.settings.configuredIncomeCurrencies = [
      ...new Set(validatedIncomeCurrencies),
    ];

    const validatedRates = {};
    self._pluginData.settings.configuredIncomeCurrencies.forEach((code) => {
      if (code === mainCurrency) {
        validatedRates[code] = 1;
      } else if (rates && typeof rates[code] === "number" && rates[code] > 0) {
        validatedRates[code] = rates[code];
      } else {
        // Si no hay tasa nueva o es inválida, intentar mantener la existente o default a 1
        validatedRates[code] =
          self._pluginData.settings.currencyRates &&
          self._pluginData.settings.currencyRates[code] > 0
            ? self._pluginData.settings.currencyRates[code]
            : 1;
      }
    });
    self._pluginData.settings.currencyRates = validatedRates;

    // Limpiar tasas de monedas que ya no están en configuredIncomeCurrencies (excepto la principal)
    Object.keys(self._pluginData.settings.currencyRates).forEach(
      (rateCurrency) => {
        if (
          rateCurrency !== self._pluginData.settings.mainUserCurrency &&
          !self._pluginData.settings.configuredIncomeCurrencies.includes(
            rateCurrency
          )
        ) {
          delete self._pluginData.settings.currencyRates[rateCurrency];
        }
      }
    );

    await self._savePluginData();
    // Emitir un evento indicando que la configuración de moneda ha cambiado
    if (self._core && self._core.events && self._core.events.publish) {
      self._core.events.publish(self.id, `${self.id}.currencyConfigChanged`, {
        ...self._pluginData.settings,
      });
    }
    return JSON.parse(JSON.stringify(self._pluginData.settings)); // Devolver copia
  },
};
