// video-scheduler/index.js
import React from 'react';
import VideoSchedulerNavItemComponent from './components/VideoSchedulerNavItem.jsx';
import VideoSchedulerMainPageComponent from './components/VideoSchedulerMainPage.jsx';
import { DEFAULT_SLOT_VIDEO_STRUCTURE, VIDEO_MAIN_STATUS, DEFAULT_DAILY_INCOME_STRUCTURE } from './utils/constants.js';
import './styles/video-scheduler.css'; // IMPORTANTE: Importar el CSS

const PLUGIN_PAGE_ID = 'videoscheduler';
const STORAGE_KEY_DATA = 'video_scheduler_plugin_data';

export default {
  id: 'video-scheduler',
  name: 'Video Scheduler',
  version: '0.4.2', 
  description: 'Planificador visual de videos estilo calendario vanilla.',
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
        currencyRates: { USD: 1, EUR: 0.92, ARS: 870 }, 
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

        const NavWrapper = p => React.createElement(VideoSchedulerNavItemComponent, {...p, plugin:self, core:self._core, pluginId:self.id, pageIdToNavigate: PLUGIN_PAGE_ID});
        self._navigationExtensionId = self._core.ui.registerExtension(self.id, self._core.ui.getExtensionZones().MAIN_NAVIGATION, NavWrapper, {order:150});
        
        const PageWrapper = p => React.createElement(VideoSchedulerMainPageComponent, {...p, plugin:self, core:self._core, pluginId:self.id});
        self._pageExtensionId = self._core.ui.registerExtension(self.id, self._core.ui.getExtensionZones().PLUGIN_PAGES, PageWrapper, {order:100, props:{pageId:PLUGIN_PAGE_ID}});
        
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
        if (self._core.ui.removeAllExtensions) {
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
      updateVideoStatus: async (dateStr, slotIndex, newStatus, newSubStatus) => self._internalUpdateVideoStatus(dateStr, slotIndex, newStatus, newSubStatus),
      setDailyIncome: async (dateStr, incomeData) => self._internalSetDailyIncome(dateStr, incomeData),
      getDailyIncome: async (dateStr) => self._internalGetDailyIncome(dateStr),
    };
  },

  _loadPluginData: async function() {
    const self = this;
    const loadedData = await self._core.storage.getItem(self.id, STORAGE_KEY_DATA, {});
    const safeLoadedData = loadedData || {};
    self._pluginData = {
        videosBySlotKey: safeLoadedData.videosBySlotKey || {},
        dailyIncomes: safeLoadedData.dailyIncomes || {},
        settings: { ...self._pluginData.settings, ...(safeLoadedData.settings || {}) }
    };
    console.log(`[${self.id}] Datos cargados desde storage.`, JSON.parse(JSON.stringify(self._pluginData)));
  },
  _savePluginData: async function() {
    const self = this;
    if (!self._core || !self._core.storage) {
        console.warn(`[${self.id}] Core o storage no disponible. No se pudo guardar.`);
        return;
    }
    try {
        await self._core.storage.setItem(self.id, STORAGE_KEY_DATA, self._pluginData);
        console.log(`[${self.id}] Datos guardados en storage.`);
    } catch (error) { console.error(`[${self.id}] Error al guardar datos:`, error); }
  },

  _getVideoSlotKey: (dateStr, slotIndex) => `${dateStr}-${slotIndex}`,

  _ensureVideoSlotExists: function(dateStr, slotIndex) {
    const key = this._getVideoSlotKey(dateStr, slotIndex);
    if (!this._pluginData.videosBySlotKey[key]) {
      this._pluginData.videosBySlotKey[key] = { ...DEFAULT_SLOT_VIDEO_STRUCTURE, id: key };
    }
    return this._pluginData.videosBySlotKey[key];
  },

  _internalGetMonthViewData: async function(year, month_idx) {
    const self = this;
    const daysInMonth = new Date(year, month_idx + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month_idx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        for (let slotIndex = 0; slotIndex < 3; slotIndex++) {
            self._ensureVideoSlotExists(dateStr, slotIndex);
        }
        if (!self._pluginData.dailyIncomes[dateStr]) {
            self._pluginData.dailyIncomes[dateStr] = { ...DEFAULT_DAILY_INCOME_STRUCTURE };
        }
    }
    const today = new Date(); today.setHours(0,0,0,0);
    let changedByTransition = false;
    Object.keys(self._pluginData.videosBySlotKey).forEach(key => {
        const video = self._pluginData.videosBySlotKey[key];
        if (video.status === VIDEO_MAIN_STATUS.PENDING) {
            const [videoYear, videoMonth, videoDay] = key.split('-').slice(0,3).map(Number);
            const videoDate = new Date(videoYear, videoMonth - 1, videoDay);
            if (videoDate < today) {
                video.status = VIDEO_MAIN_STATUS.EMPTY; video.name = ''; video.description = '';
                changedByTransition = true;
            }
        }
    });
    if (changedByTransition) {
        await self._savePluginData();
    }
    return { 
        videos: { ...self._pluginData.videosBySlotKey }, 
        dailyIncomes: { ...self._pluginData.dailyIncomes }
    };
  },

  _internalUpdateVideoName: async function(dateStr, slotIndex, newName) {
    const self = this;
    const video = self._ensureVideoSlotExists(dateStr, slotIndex);
    const oldName = video.name;
    video.name = newName;
    if (video.status === VIDEO_MAIN_STATUS.PENDING && newName.trim() !== '') {
      video.status = VIDEO_MAIN_STATUS.DEVELOPMENT; video.subStatus = null;
    } else if (newName.trim() === '' && oldName.trim() !== '' && video.status !== VIDEO_MAIN_STATUS.EMPTY) {
      video.status = VIDEO_MAIN_STATUS.PENDING; video.subStatus = null;
    }
    video.updatedAt = new Date().toISOString();
    await self._savePluginData();
    return video;
  },

  _internalUpdateVideoDescription: async function(dateStr, slotIndex, newDescription) {
    const self = this;
    const video = self._ensureVideoSlotExists(dateStr, slotIndex);
    video.description = newDescription;
    video.updatedAt = new Date().toISOString();
    await self._savePluginData();
    return video;
  },

  _internalUpdateVideoStatus: async function(dateStr, slotIndex, newMainStatus, newSubStatus) {
    const self = this;
    const video = self._ensureVideoSlotExists(dateStr, slotIndex);
    if (video.status === VIDEO_MAIN_STATUS.EMPTY && newMainStatus !== VIDEO_MAIN_STATUS.PENDING && newMainStatus !== VIDEO_MAIN_STATUS.EMPTY) {
        console.warn(`[${self.id}] Un slot EMPTY solo puede cambiar a PENDING o seguir EMPTY.`);
        return video; 
    }
    video.status = newMainStatus;
    video.subStatus = newSubStatus;
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
};