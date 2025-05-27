// video-scheduler/index.js
import React from 'react';
import VideoSchedulerNavItemComponent from './components/VideoSchedulerNavItem.jsx';
import VideoSchedulerMainPageComponent from './components/VideoSchedulerMainPage.jsx';
import { 
  DEFAULT_SLOT_VIDEO_STRUCTURE, 
  VIDEO_MAIN_STATUS, 
  VIDEO_SUB_STATUS,
  VIDEO_STACKABLE_STATUS,
  DEFAULT_DAILY_INCOME_STRUCTURE,
  isDateInPast,
  INVALID_PAST_STATUSES
} from './utils/constants.js';
import './styles/index.css';

const PLUGIN_PAGE_ID = 'videoscheduler';
const STORAGE_KEY_DATA = 'video_scheduler_plugin_data';

export default {
  id: 'video-scheduler',
  name: 'Video Scheduler',
  version: '0.5.1', // Incremento de versión por cambios
  description: 'Planificador visual de videos estilo calendario con sistema de estados avanzado.',
  author: 'Tu Nombre/Equipo',
  minAppVersion: '0.3.0',
  maxAppVersion: '0.9.9',
  permissions: ['ui', 'storage'],

  _core: null,
  _navigationExtensionId: null,
  _pageExtensionId: null,

  _pluginData: {
    videosBySlotKey: {}, 
    dailyIncomes: {},
    settings: {
        currencyRates: { USD: 870, EUR: 950, ARS: 1 }, 
        defaultCurrency: 'USD',
    } 
  },

  init: function(core) {
    const self = this;
    return new Promise(async (resolve, reject) => {
      try {
        self._core = core;
        if (typeof React === 'undefined') {
            const errMsg = `[${self.id}] React no está definido.`;
            console.error(errMsg);
            return reject(new Error(errMsg));
        }
        console.log(`[${self.id}] v${self.version} inicializando...`);

        await self._loadPluginData();
        
        self.publicAPI = self._createPublicAPI(self);
        self._core.plugins.registerAPI(self.id, self.publicAPI);

        // Usando una función factory para el wrapper del NavItem
        const NavItemWrapperFactory = (Component, extraProps) => (propsFromAtlas) => 
            React.createElement(Component, { ...propsFromAtlas, ...extraProps });

        self._navigationExtensionId = self._core.ui.registerExtension(
            self.id, 
            self._core.ui.getExtensionZones().MAIN_NAVIGATION, 
            NavItemWrapperFactory(VideoSchedulerNavItemComponent, { plugin: self, core: self._core, pluginId: self.id, pageIdToNavigate: PLUGIN_PAGE_ID }),
            { order: 150 }
        );
        
        const PageWrapperFactory = (Component, extraProps) => (propsFromAtlas) =>
            React.createElement(Component, { ...propsFromAtlas, ...extraProps });

        self._pageExtensionId = self._core.ui.registerExtension(
            self.id, 
            self._core.ui.getExtensionZones().PLUGIN_PAGES, 
            PageWrapperFactory(VideoSchedulerMainPageComponent, { plugin: self, core: self._core, pluginId: self.id }),
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

  cleanup: async function() {
    const self = this;
    console.log(`[${self.id}] Limpiando plugin...`);
    try {
        await self._savePluginData();
        if (self._core && self._core.ui && self._core.ui.removeAllExtensions) { // Verificar core y ui
            self._core.ui.removeAllExtensions(self.id);
            console.log(`[${self.id}] Extensiones UI removidas.`);
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
  _createPublicAPI: function(self) {
    return {
      getMonthViewData: async (year, month) => self._internalGetMonthViewData(year, month),
      updateVideoName: async (dateStr, slotIndex, newName) => self._internalUpdateVideoName(dateStr, slotIndex, newName),
      updateVideoDescription: async (dateStr, slotIndex, newDescription) => self._internalUpdateVideoDescription(dateStr, slotIndex, newDescription),
      updateVideoStatus: async (dateStr, slotIndex, newStatus, newSubStatus, newStackableStatuses) => self._internalUpdateVideoStatus(dateStr, slotIndex, newStatus, newSubStatus, newStackableStatuses),
      setDailyIncome: async (dateStr, incomeData) => self._internalSetDailyIncome(dateStr, incomeData),
      getDailyIncome: async (dateStr) => self._internalGetDailyIncome(dateStr),
      // bulkCreateVideos: async (schedule) => self._internalBulkCreateVideos(schedule), // Ya implementado en VideoSchedulerMainPage
      // getVideoStats: (monthData) => self._internalGetVideoStats(monthData), // Usado internamente o por StatsPanel
      // getIncomeStats: (monthData) => self._internalGetIncomeStats(monthData) // Usado internamente o por StatsPanel
    };
  },

  _loadPluginData: async function() {
    const self = this;
    if (!self._core || !self._core.storage) { // Verificar core y storage
        console.warn(`[${self.id}] Core o storage no disponible en _loadPluginData.`);
        self._pluginData = { // Datos por defecto si no se puede cargar
            videosBySlotKey: {},
            dailyIncomes: {},
            settings: { currencyRates: { USD: 870, EUR: 950, ARS: 1 }, defaultCurrency: 'USD' }
        };
        return;
    }
    const loadedData = await self._core.storage.getItem(self.id, STORAGE_KEY_DATA, {});
    const safeLoadedData = loadedData || {}; // Asegurar que no sea null/undefined
    self._pluginData = {
        videosBySlotKey: safeLoadedData.videosBySlotKey || {},
        dailyIncomes: safeLoadedData.dailyIncomes || {},
        settings: { ...(self._pluginData.settings || {}), ...(safeLoadedData.settings || {}) }
    };
    
    Object.keys(self._pluginData.videosBySlotKey).forEach(key => {
      const video = self._pluginData.videosBySlotKey[key];
      if (!video.stackableStatuses) {
        video.stackableStatuses = [];
      }
    });
  },

  _savePluginData: async function() {
    const self = this;
    if (!self._core || !self._core.storage) {
        console.warn(`[${self.id}] Core o storage no disponible en _savePluginData.`);
        return;
    }
    try {
        await self._core.storage.setItem(self.id, STORAGE_KEY_DATA, self._pluginData);
    } catch (error) { 
        console.error(`[${self.id}] Error al guardar datos:`, error); 
    }
  },

  _getVideoSlotKey: (dateStr, slotIndex) => `${dateStr}-${slotIndex}`,

  _ensureVideoSlotExists: function(dateStr, slotIndex) {
    const key = this._getVideoSlotKey(dateStr, slotIndex);
    if (!this._pluginData.videosBySlotKey[key]) {
      this._pluginData.videosBySlotKey[key] = { 
        ...DEFAULT_SLOT_VIDEO_STRUCTURE, 
        id: key,
        stackableStatuses: []
      };
    }
    if (!this._pluginData.videosBySlotKey[key].stackableStatuses) {
      this._pluginData.videosBySlotKey[key].stackableStatuses = [];
    }
    return this._pluginData.videosBySlotKey[key];
  },
  
  _filterDataByMonth: function(year, month_idx) { // Asegurar que este método solo filtra y no modifica
    const self = this;
    const monthKeyPrefix = `${year}-${String(month_idx + 1).padStart(2, '0')}-`;
    
    const videosForMonth = {};
    Object.entries(self._pluginData.videosBySlotKey).forEach(([key, video]) => {
        if (key.startsWith(monthKeyPrefix)) {
            videosForMonth[key] = { ...video }; // Devolver copia para evitar mutaciones inesperadas
        }
    });

    const incomesForMonth = {};
    Object.entries(self._pluginData.dailyIncomes).forEach(([key, income]) => {
        if (key.startsWith(monthKeyPrefix)) {
            incomesForMonth[key] = { ...income }; // Devolver copia
        }
    });

    return { videos: videosForMonth, dailyIncomes: incomesForMonth };
  },


  _applySystemWarnings: function(video, dateStr) {
    if (!video || !dateStr) {
      return;
    }

    const isPast = isDateInPast(dateStr);
    // Asegurar que stackableStatuses es un array, incluso si es undefined inicialmente
    const stackableStatuses = Array.isArray(video.stackableStatuses) ? [...video.stackableStatuses] : [];
    const hasWarning = stackableStatuses.includes(VIDEO_STACKABLE_STATUS.WARNING);
    const hasName = video.name && video.name.trim() !== '';

    let shouldHaveWarning = false;

    if (isPast && INVALID_PAST_STATUSES.includes(video.status)) {
      shouldHaveWarning = true;
    }
    if (video.status === VIDEO_MAIN_STATUS.PENDING && hasName) {
      shouldHaveWarning = true;
    }
    if (video.status === VIDEO_MAIN_STATUS.EMPTY && hasName) {
      shouldHaveWarning = true;
    }

    if (shouldHaveWarning && !hasWarning) {
      stackableStatuses.push(VIDEO_STACKABLE_STATUS.WARNING);
    } else if (!shouldHaveWarning && hasWarning) {
      const warningIndex = stackableStatuses.indexOf(VIDEO_STACKABLE_STATUS.WARNING);
      if (warningIndex > -1) {
        stackableStatuses.splice(warningIndex, 1);
      }
    }
    video.stackableStatuses = stackableStatuses; // Asignar el array modificado
  },

  _internalGetMonthViewData: async function(year, month_idx) {
    const self = this;
    const daysInMonth = new Date(year, month_idx + 1, 0).getDate();
    
    let dataChanged = false; // Flag para rastrear si es necesario guardar

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month_idx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        for (let slotIndex = 0; slotIndex < 3; slotIndex++) {
            const key = self._getVideoSlotKey(dateStr, slotIndex);
            if (!self._pluginData.videosBySlotKey[key]) {
                self._pluginData.videosBySlotKey[key] = { 
                    ...DEFAULT_SLOT_VIDEO_STRUCTURE, 
                    id: key,
                    stackableStatuses: []
                };
                dataChanged = true;
            } else if (!self._pluginData.videosBySlotKey[key].stackableStatuses) {
                // Asegurar que los videos existentes tengan stackableStatuses
                self._pluginData.videosBySlotKey[key].stackableStatuses = [];
                dataChanged = true;
            }
        }
        if (!self._pluginData.dailyIncomes[dateStr]) {
            self._pluginData.dailyIncomes[dateStr] = { ...DEFAULT_DAILY_INCOME_STRUCTURE };
            dataChanged = true;
        }
    }

    // Aplicar transiciones y warnings
    const monthKeyPrefix = `${year}-${String(month_idx + 1).padStart(2, '0')}-`;
    Object.keys(self._pluginData.videosBySlotKey).forEach(key => {
        if (!key.startsWith(monthKeyPrefix)) return; // Solo procesar el mes actual
        
        const video = self._pluginData.videosBySlotKey[key];
        const dateStr = key.substring(0, 10); // "YYYY-MM-DD"
        const isPast = isDateInPast(dateStr);

        const originalStatus = video.status;
        const originalSubStatus = video.subStatus;
        const originalStackable = JSON.stringify((video.stackableStatuses || []).sort());

        if (isPast) {
          if (video.status === VIDEO_MAIN_STATUS.PENDING) {
            video.status = VIDEO_MAIN_STATUS.EMPTY; video.name = ''; video.description = ''; video.subStatus = null; video.stackableStatuses = [];
          }
          if (video.status === VIDEO_MAIN_STATUS.PUBLISHED && video.subStatus === VIDEO_SUB_STATUS.SCHEDULED) {
            video.subStatus = null;
          }
        }
        self._applySystemWarnings(video, dateStr);

        if (video.status !== originalStatus || video.subStatus !== originalSubStatus || JSON.stringify((video.stackableStatuses || []).sort()) !== originalStackable) {
            dataChanged = true;
        }
    });

    if (dataChanged) {
        await self._savePluginData();
    }
    
    return self._filterDataByMonth(year, month_idx); // Retorna solo los datos filtrados del mes
  },

  _internalUpdateVideoName: async function(dateStr, slotIndex, newName) {
    const self = this;
    const video = self._ensureVideoSlotExists(dateStr, slotIndex);
    const oldName = video.name;
    video.name = newName.trim(); // Guardar trim
    
    const isPast = isDateInPast(dateStr);
    
    if (isPast) {
      if (video.status === VIDEO_MAIN_STATUS.EMPTY && video.name !== '') {
        video.status = VIDEO_MAIN_STATUS.DEVELOPMENT;
        video.subStatus = null;
      } else if (video.name === '' && oldName !== '') { // Si se borra el nombre
        video.status = VIDEO_MAIN_STATUS.EMPTY;
        video.subStatus = null;
        video.stackableStatuses = [];
      }
    } else {
      if (video.status === VIDEO_MAIN_STATUS.PENDING && video.name !== '') {
        video.status = VIDEO_MAIN_STATUS.DEVELOPMENT;
        video.subStatus = null;
      } else if (video.name === '' && oldName !== '' && video.status !== VIDEO_MAIN_STATUS.EMPTY) {
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

  _internalUpdateVideoDescription: async function(dateStr, slotIndex, newDescription) {
    const self = this;
    const video = self._ensureVideoSlotExists(dateStr, slotIndex);
    video.description = newDescription.trim();
    video.updatedAt = new Date().toISOString();
    await self._savePluginData();
    return video;
  },

  _internalUpdateVideoStatus: async function(dateStr, slotIndex, newMainStatus, newSubStatus, newStackableStatuses = []) {
    const self = this;
    const video = self._ensureVideoSlotExists(dateStr, slotIndex);
    
    const isPast = isDateInPast(dateStr);
    
    if (isPast && newMainStatus === VIDEO_MAIN_STATUS.PUBLISHED && newSubStatus === VIDEO_SUB_STATUS.SCHEDULED) {
      newSubStatus = null; // No puede estar "scheduled" en el pasado
    }
    
    // Si se cambia a EMPTY, limpiar nombre y descripción
    if (newMainStatus === VIDEO_MAIN_STATUS.EMPTY) {
        video.name = '';
        video.description = '';
        newSubStatus = null; // EMPTY no tiene substatus
        newStackableStatuses = []; // EMPTY no tiene stackable statuses
    }


    video.status = newMainStatus;
    video.subStatus = newSubStatus;
    
    const userStackableStatuses = (newStackableStatuses || []).filter(status => 
      status !== VIDEO_STACKABLE_STATUS.WARNING // El usuario no gestiona WARNING directamente
    );
    video.stackableStatuses = [...userStackableStatuses];
    
    self._applySystemWarnings(video, dateStr); // Aplicar warnings de sistema DESPUÉS de los cambios del usuario
    
    video.updatedAt = new Date().toISOString();
    await self._savePluginData();
    return video;
  },

  _internalSetDailyIncome: async function(dateStr, incomeData) {
    const self = this;
    self._pluginData.dailyIncomes[dateStr] = { 
        ...DEFAULT_DAILY_INCOME_STRUCTURE, 
        ...(self._pluginData.dailyIncomes[dateStr] || {}), 
        ...incomeData 
    };
    await self._savePluginData();
    return self._pluginData.dailyIncomes[dateStr];
  },

  _internalGetDailyIncome: async function(dateStr) { // Este método es realmente síncrono con los datos cargados
    const self = this;
    return self._pluginData.dailyIncomes[dateStr] || { ...DEFAULT_DAILY_INCOME_STRUCTURE };
  },
};
