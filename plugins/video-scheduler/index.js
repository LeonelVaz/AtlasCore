// video-scheduler/index.js
import React from "react";
import VideoSchedulerNavItemComponent from "./components/VideoSchedulerNavItem.jsx";
import VideoSchedulerMainPageComponent from "./components/VideoSchedulerMainPage.jsx";
import {
  DEFAULT_SLOT_VIDEO_STRUCTURE, // Asegúrate que DEFAULT_SLOT_VIDEO_STRUCTURE se actualizó en constants.js
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
const STORAGE_KEY_DATA = "video_scheduler_plugin_data_v2"; // Incrementar versión de storage si la estructura cambia significativamente

export default {
  id: "video-scheduler",
  name: "Video Scheduler",
  version: "0.8.0", // <-- VERSIÓN INCREMENTADA por VideoForm
  description:
    "Planificador visual de videos con estados, multimes, moneda personalizable y detalles extendidos.",
  author: "Tu Nombre/Equipo",
  minAppVersion: "0.3.0",
  maxAppVersion: "0.9.9",
  permissions: ["ui", "storage"],

  _core: null,
  _navigationExtensionId: null,
  _pageExtensionId: null,

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

        const NavItemWrapperFactory =
          (Component, extraProps) => (propsFromAtlas) =>
            React.createElement(Component, {
              ...propsFromAtlas,
              ...extraProps,
            });
        self._navigationExtensionId = self._core.ui.registerExtension(
          self.id,
          self._core.ui.getExtensionZones().MAIN_NAVIGATION,
          NavItemWrapperFactory(VideoSchedulerNavItemComponent, {
            plugin: self,
            core: self._core,
            pluginId: self.id,
            pageIdToNavigate: PLUGIN_PAGE_ID,
          }),
          { order: 150 }
        );

        const PageWrapperFactory =
          (Component, extraProps) => (propsFromAtlas) =>
            React.createElement(Component, {
              ...propsFromAtlas,
              ...extraProps,
            });
        self._pageExtensionId = self._core.ui.registerExtension(
          self.id,
          self._core.ui.getExtensionZones().PLUGIN_PAGES,
          PageWrapperFactory(VideoSchedulerMainPageComponent, {
            plugin: self,
            core: self._core,
            pluginId: self.id,
          }),
          { order: 100, props: { pageId: PLUGIN_PAGE_ID } }
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
      if (self._core?.ui?.removeAllExtensions) {
        self._core.ui.removeAllExtensions(self.id);
      }
      self._navigationExtensionId = null;
      self._pageExtensionId = null;
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
      // --- NUEVA API PARA DETALLES EXTENDIDOS ---
      updateVideoDetails: async (dateStr, slotIndex, details) =>
        self._internalUpdateVideoDetails(dateStr, slotIndex, details),
      // --- FIN NUEVA API ---
      setDailyIncome: async (dateStr, incomeData) =>
        self._internalSetDailyIncome(dateStr, incomeData),
      getDailyIncome: async (dateStr) => self._internalGetDailyIncome(dateStr),
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
    };
  },

  _loadPluginData: async function () {
    const self = this;
    if (!self._core || !self._core.storage) {
      console.warn(
        `[${self.id}] Core o storage no disponible en _loadPluginData.`
      );
      return;
    }
    const loadedData = await self._core.storage.getItem(
      self.id,
      STORAGE_KEY_DATA,
      {}
    );
    const safeLoadedData = loadedData || {};

    const defaultSettings = {
      mainUserCurrency: "USD",
      currencyRates: { USD: 1, EUR: 1.08, ARS: 0.0011 },
      configuredIncomeCurrencies: ["USD", "EUR", "ARS"],
    };
    const loadedSettings = safeLoadedData.settings || {};
    const finalSettings = {
      mainUserCurrency:
        loadedSettings.mainUserCurrency || defaultSettings.mainUserCurrency,
      currencyRates: {
        ...defaultSettings.currencyRates,
        ...(loadedSettings.currencyRates || {}),
      },
      configuredIncomeCurrencies:
        Array.isArray(loadedSettings.configuredIncomeCurrencies) &&
        loadedSettings.configuredIncomeCurrencies.length > 0
          ? loadedSettings.configuredIncomeCurrencies
          : defaultSettings.configuredIncomeCurrencies,
    };
    finalSettings.currencyRates[finalSettings.mainUserCurrency] = 1;
    if (
      !finalSettings.configuredIncomeCurrencies.includes(
        finalSettings.mainUserCurrency
      )
    ) {
      finalSettings.configuredIncomeCurrencies.push(
        finalSettings.mainUserCurrency
      );
      if (
        finalSettings.currencyRates[finalSettings.mainUserCurrency] ===
        undefined
      ) {
        finalSettings.currencyRates[finalSettings.mainUserCurrency] = 1;
      }
    }

    self._pluginData = {
      videosBySlotKey: safeLoadedData.videosBySlotKey || {},
      dailyIncomes: safeLoadedData.dailyIncomes || {},
      settings: finalSettings,
    };

    // Asegurar que todos los videos tengan los campos por defecto, incluyendo los nuevos
    Object.keys(self._pluginData.videosBySlotKey).forEach((key) => {
      self._pluginData.videosBySlotKey[key] = {
        ...DEFAULT_SLOT_VIDEO_STRUCTURE, // Aplica la estructura por defecto primero
        ...self._pluginData.videosBySlotKey[key], // Luego sobrescribe con los datos guardados
        stackableStatuses: Array.isArray(
          self._pluginData.videosBySlotKey[key].stackableStatuses
        )
          ? self._pluginData.videosBySlotKey[key].stackableStatuses
          : [],
        tags: Array.isArray(self._pluginData.videosBySlotKey[key].tags)
          ? self._pluginData.videosBySlotKey[key].tags
          : [], // Asegurar que tags sea array
      };
    });

    const validIncomeCurrencies =
      self._pluginData.settings.configuredIncomeCurrencies;
    const mainCurrency = self._pluginData.settings.mainUserCurrency;
    Object.values(self._pluginData.dailyIncomes).forEach((income) => {
      if (!validIncomeCurrencies.includes(income.currency)) {
        income.currency = mainCurrency;
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
      if (
        self._pluginData.settings?.currencyRates &&
        self._pluginData.settings?.mainUserCurrency
      ) {
        self._pluginData.settings.currencyRates[
          self._pluginData.settings.mainUserCurrency
        ] = 1;
      } else {
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

  _getVideoSlotKey: (dateStr, slotIndex) => `${dateStr}-${slotIndex}`,

  _ensureVideoSlotExists: function (dateStr, slotIndex) {
    const key = this._getVideoSlotKey(dateStr, slotIndex);
    if (!this._pluginData.videosBySlotKey[key]) {
      this._pluginData.videosBySlotKey[key] = {
        ...DEFAULT_SLOT_VIDEO_STRUCTURE, // Usa la estructura actualizada
        id: key,
      };
    } else {
      // Asegurar que los campos nuevos existan si el video ya existía
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
        const video = self._ensureVideoSlotExists(dateStr, slotIndex); // Llama para asegurar que todos los campos existan
        // No necesitamos marcar dataChanged aquí solo por asegurar el slot, _ensureVideoSlotExists ya lo hace si crea.
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
      const dateStr = key.substring(0, 10);
      const isPast = isDateInPast(dateStr);
      const originalState = JSON.stringify(video); // Para comparación simple
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
      self._applySystemWarnings(video, dateStr);
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
    video.description = newDescription.trim(); // Esta es la descripción corta
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

  // --- NUEVA FUNCIÓN INTERNA PARA DETALLES EXTENDIDOS ---
  _internalUpdateVideoDetails: async function (dateStr, slotIndex, details) {
    const self = this;
    const video = self._ensureVideoSlotExists(dateStr, slotIndex);

    // Actualizar solo los campos relevantes de 'details'
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
  // --- FIN NUEVA FUNCIÓN INTERNA ---

  _internalSetDailyIncome: async function (dateStr, incomeData) {
    const self = this;
    const mainCurrency = self._pluginData.settings.mainUserCurrency;
    self._pluginData.dailyIncomes[dateStr] = {
      ...DEFAULT_DAILY_INCOME_STRUCTURE,
      currency: mainCurrency,
      ...(self._pluginData.dailyIncomes[dateStr] || {}),
      ...incomeData,
    };
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

  _internalGetCurrencyConfiguration: async function () {
    const self = this;
    return JSON.parse(
      JSON.stringify({
        mainUserCurrency: self._pluginData.settings.mainUserCurrency,
        configuredIncomeCurrencies:
          self._pluginData.settings.configuredIncomeCurrencies,
        currencyRates: self._pluginData.settings.currencyRates,
      })
    );
  },

  _internalSaveCurrencyConfiguration: async function (
    mainCurrency,
    incomeCurrencies,
    rates
  ) {
    const self = this;
    if (!ALL_SUPPORTED_CURRENCIES.find((c) => c.code === mainCurrency)) {
      console.error(`[${self.id}] Moneda principal inválida: ${mainCurrency}`);
      return self._pluginData.settings;
    }
    self._pluginData.settings.mainUserCurrency = mainCurrency;
    const validatedIncomeCurrencies = incomeCurrencies.filter((code) =>
      ALL_SUPPORTED_CURRENCIES.find((c) => c.code === code)
    );
    if (!validatedIncomeCurrencies.includes(mainCurrency))
      validatedIncomeCurrencies.push(mainCurrency);
    self._pluginData.settings.configuredIncomeCurrencies = [
      ...new Set(validatedIncomeCurrencies),
    ];
    const validatedRates = {};
    self._pluginData.settings.configuredIncomeCurrencies.forEach((code) => {
      if (code === mainCurrency) validatedRates[code] = 1;
      else if (rates && typeof rates[code] === "number" && rates[code] > 0)
        validatedRates[code] = rates[code];
      else
        validatedRates[code] =
          self._pluginData.settings.currencyRates[code] || 1;
    });
    self._pluginData.settings.currencyRates = validatedRates;
    Object.keys(self._pluginData.settings.currencyRates).forEach(
      (rateCurrency) => {
        if (
          rateCurrency !== mainCurrency &&
          !self._pluginData.settings.configuredIncomeCurrencies.includes(
            rateCurrency
          )
        ) {
          delete self._pluginData.settings.currencyRates[rateCurrency];
        }
      }
    );
    await self._savePluginData();
    return self._pluginData.settings;
  },
};
