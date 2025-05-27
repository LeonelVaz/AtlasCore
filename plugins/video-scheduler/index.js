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
  version: '0.5.0', 
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
      updateVideoStatus: async (dateStr, slotIndex, newStatus, newSubStatus, newStackableStatuses) => self._internalUpdateVideoStatus(dateStr, slotIndex, newStatus, newSubStatus, newStackableStatuses),
      setDailyIncome: async (dateStr, incomeData) => self._internalSetDailyIncome(dateStr, incomeData),
      getDailyIncome: async (dateStr) => self._internalGetDailyIncome(dateStr),
      bulkCreateVideos: async (schedule) => self._internalBulkCreateVideos(schedule),
      getVideoStats: (monthData) => self._internalGetVideoStats(monthData),
      getIncomeStats: (monthData) => self._internalGetIncomeStats(monthData)
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
    
    // Migrar datos existentes para añadir stackableStatuses si no existen
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
    // Asegurar que stackableStatuses existe
    if (!this._pluginData.videosBySlotKey[key].stackableStatuses) {
      this._pluginData.videosBySlotKey[key].stackableStatuses = [];
    }
    return this._pluginData.videosBySlotKey[key];
  },

  // Función para aplicar alertas de sistema automáticas
  _applySystemWarnings: function(video, dateStr) {
    if (!video || !dateStr) {
      return;
    }

    const isPast = isDateInPast(dateStr);
    const stackableStatuses = [...(video.stackableStatuses || [])];
    const hasWarning = stackableStatuses.includes(VIDEO_STACKABLE_STATUS.WARNING);
    const hasName = video.name && video.name.trim() !== '';

    let shouldHaveWarning = false;

    // Verificar problemas de tiempo pasado
    if (isPast && INVALID_PAST_STATUSES.includes(video.status)) {
      shouldHaveWarning = true;
    }

    // Verificar inconsistencias lógicas de nombre vs estado
    if (video.status === VIDEO_MAIN_STATUS.PENDING && hasName) {
      // PENDING con nombre → debería ser DEVELOPMENT
      shouldHaveWarning = true;
    }
    
    if (video.status === VIDEO_MAIN_STATUS.EMPTY && hasName) {
      // EMPTY con nombre → no tiene sentido
      shouldHaveWarning = true;
    }

    // Aplicar o quitar warning según sea necesario
    if (shouldHaveWarning && !hasWarning) {
      // Añadir warning
      stackableStatuses.push(VIDEO_STACKABLE_STATUS.WARNING);
      video.stackableStatuses = stackableStatuses;
    } else if (!shouldHaveWarning && hasWarning) {
      // Quitar warning
      const warningIndex = stackableStatuses.indexOf(VIDEO_STACKABLE_STATUS.WARNING);
      if (warningIndex > -1) {
        stackableStatuses.splice(warningIndex, 1);
        video.stackableStatuses = stackableStatuses;
      }
    }
  },

  _internalGetMonthViewData: async function(year, month_idx) {
    const self = this;
    const daysInMonth = new Date(year, month_idx + 1, 0).getDate();
    
    // Asegurar que existen todos los slots del mes
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month_idx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        for (let slotIndex = 0; slotIndex < 3; slotIndex++) {
            self._ensureVideoSlotExists(dateStr, slotIndex);
        }
        if (!self._pluginData.dailyIncomes[dateStr]) {
            self._pluginData.dailyIncomes[dateStr] = { ...DEFAULT_DAILY_INCOME_STRUCTURE };
        }
    }

    let changedByTransition = false;

    // Aplicar transiciones automáticas basadas en tiempo
    Object.keys(self._pluginData.videosBySlotKey).forEach(key => {
        const video = self._pluginData.videosBySlotKey[key];
        const dateStr = key.split('-').slice(0, 3).join('-');
        const isPast = isDateInPast(dateStr);

        if (isPast) {
          // Transición: PENDING → EMPTY en tiempo pasado
          if (video.status === VIDEO_MAIN_STATUS.PENDING) {
            video.status = VIDEO_MAIN_STATUS.EMPTY;
            video.name = '';
            video.description = '';
            video.subStatus = null;
            video.stackableStatuses = [];
            changedByTransition = true;
          }
          
          // Transición: PUBLISHED+SCHEDULED → PUBLISHED en tiempo pasado
          if (video.status === VIDEO_MAIN_STATUS.PUBLISHED && video.subStatus === VIDEO_SUB_STATUS.SCHEDULED) {
            video.subStatus = null;
            changedByTransition = true;
          }
        }

        // Aplicar warnings automáticos
        const oldStackableStatuses = [...(video.stackableStatuses || [])];
        self._applySystemWarnings(video, dateStr);
        
        // Verificar si cambiaron los stackable statuses
        const newStackableStatuses = video.stackableStatuses || [];
        if (JSON.stringify(oldStackableStatuses.sort()) !== JSON.stringify(newStackableStatuses.sort())) {
          changedByTransition = true;
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
    
    const isPast = isDateInPast(dateStr);
    
    if (isPast) {
      // En tiempo pasado: EMPTY + nombre → DEVELOPMENT + WARNING
      if (video.status === VIDEO_MAIN_STATUS.EMPTY && newName.trim() !== '') {
        video.status = VIDEO_MAIN_STATUS.DEVELOPMENT;
        video.subStatus = null;
        // Añadir warning automáticamente
        if (!video.stackableStatuses.includes(VIDEO_STACKABLE_STATUS.WARNING)) {
          video.stackableStatuses.push(VIDEO_STACKABLE_STATUS.WARNING);
        }
      } else if (newName.trim() === '' && oldName.trim() !== '') {
        video.status = VIDEO_MAIN_STATUS.EMPTY;
        video.subStatus = null;
        video.stackableStatuses = []; // Limpiar todos los sub-estados apilables
      }
    } else {
      // En tiempo futuro: comportamiento normal
      if (video.status === VIDEO_MAIN_STATUS.PENDING && newName.trim() !== '') {
        video.status = VIDEO_MAIN_STATUS.DEVELOPMENT;
        video.subStatus = null;
      } else if (newName.trim() === '' && oldName.trim() !== '' && video.status !== VIDEO_MAIN_STATUS.EMPTY) {
        video.status = VIDEO_MAIN_STATUS.PENDING;
        video.subStatus = null;
        video.stackableStatuses = []; // Limpiar todos los sub-estados apilables
      }
    }

    // Aplicar warnings automáticos para detectar inconsistencias lógicas
    self._applySystemWarnings(video, dateStr);
    
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

  _internalUpdateVideoStatus: async function(dateStr, slotIndex, newMainStatus, newSubStatus, newStackableStatuses = []) {
    const self = this;
    const video = self._ensureVideoSlotExists(dateStr, slotIndex);
    
    const isPast = isDateInPast(dateStr);
    
    // En tiempo pasado, verificar si se está tratando de poner PUBLISHED+SCHEDULED
    if (isPast && newMainStatus === VIDEO_MAIN_STATUS.PUBLISHED && newSubStatus === VIDEO_SUB_STATUS.SCHEDULED) {
      newSubStatus = null;
    }

    // Validar transición desde EMPTY (ahora permitida)
    if (video.status === VIDEO_MAIN_STATUS.EMPTY && 
        newMainStatus !== VIDEO_MAIN_STATUS.PENDING && 
        newMainStatus !== VIDEO_MAIN_STATUS.EMPTY) {
      // Transición permitida, no hacer nada
    }

    video.status = newMainStatus;
    video.subStatus = newSubStatus;
    
    // Manejar sub-estados apilables
    // Filtrar warnings automáticos del usuario y mantener solo los que el usuario puede controlar
    const userStackableStatuses = (newStackableStatuses || []).filter(status => 
      status !== VIDEO_STACKABLE_STATUS.WARNING
    );
    
    // Establecer los estados que el usuario eligió
    video.stackableStatuses = [...userStackableStatuses];
    
    // Aplicar warnings automáticos después de la actualización
    self._applySystemWarnings(video, dateStr);
    
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

  _internalGetDailyIncome: async function(dateStr) {
    const self = this;
    return self._pluginData.dailyIncomes[dateStr] || null;
  },

  _internalBulkCreateVideos: async function(schedule) {
    const self = this;
    const results = [];
    
    try {
      for (const item of schedule) {
        const video = self._ensureVideoSlotExists(item.dateStr, item.slotIndex);
        video.name = item.name;
        video.status = item.status || VIDEO_MAIN_STATUS.DEVELOPMENT;
        video.description = item.description || '';
        video.updatedAt = new Date().toISOString();
        
        // Aplicar warnings automáticos
        self._applySystemWarnings(video, item.dateStr);
        
        results.push(video);
      }
      
      await self._savePluginData();
      return results;
    } catch (error) {
      console.error(`[${self.id}] Error en bulk create:`, error);
      throw error;
    }
  },

  _internalGetVideoStats: function(monthData) {
    const self = this;
    const stats = {
      [VIDEO_MAIN_STATUS.PENDING]: 0,
      [VIDEO_MAIN_STATUS.EMPTY]: 0,
      [VIDEO_MAIN_STATUS.DEVELOPMENT]: 0,
      [VIDEO_MAIN_STATUS.PRODUCTION]: 0,
      [VIDEO_MAIN_STATUS.PUBLISHED]: 0,
      [VIDEO_SUB_STATUS.REC]: 0,
      [VIDEO_SUB_STATUS.EDITING]: 0,
      [VIDEO_SUB_STATUS.THUMBNAIL]: 0,
      [VIDEO_SUB_STATUS.SCHEDULING_POST]: 0,
      [VIDEO_SUB_STATUS.SCHEDULED]: 0,
      [VIDEO_STACKABLE_STATUS.QUESTION]: 0,
      [VIDEO_STACKABLE_STATUS.WARNING]: 0,
      total: 0,
      withAlerts: 0,
      withQuestions: 0
    };

    if (monthData && monthData.videos) {
      Object.values(monthData.videos).forEach(video => {
        stats.total++;
        
        if (video.status) {
          stats[video.status]++;
        }
        
        if (video.subStatus) {
          stats[video.subStatus]++;
        }
        
        if (video.stackableStatuses && Array.isArray(video.stackableStatuses)) {
          video.stackableStatuses.forEach(status => {
            if (stats[status] !== undefined) {
              stats[status]++;
            }
            
            if (status === VIDEO_STACKABLE_STATUS.WARNING) {
              stats.withAlerts++;
            }
            if (status === VIDEO_STACKABLE_STATUS.QUESTION) {
              stats.withQuestions++;
            }
          });
        }
      });
    }

    return stats;
  },

  _internalGetIncomeStats: function(monthData) {
    const self = this;
    const incomeStats = {
      totalByCurrency: {},
      totalInARS: 0,
      paidByCurrency: {},
      pendingByCurrency: {},
      totalPaidInARS: 0,
      totalPendingInARS: 0
    };

    const exchangeRates = self._pluginData?.settings?.currencyRates || {
      USD: 870, EUR: 950, ARS: 1
    };

    if (monthData && monthData.dailyIncomes) {
      Object.values(monthData.dailyIncomes).forEach(income => {
        if (income && income.amount > 0) {
          const currency = income.currency || 'USD';
          const amount = parseFloat(income.amount) || 0;
          const rate = exchangeRates[currency] || 1;
          
          if (!incomeStats.totalByCurrency[currency]) {
            incomeStats.totalByCurrency[currency] = 0;
          }
          incomeStats.totalByCurrency[currency] += amount;
          incomeStats.totalInARS += amount * rate;
          
          if (income.status === 'paid') {
            if (!incomeStats.paidByCurrency[currency]) {
              incomeStats.paidByCurrency[currency] = 0;
            }
            incomeStats.paidByCurrency[currency] += amount;
            incomeStats.totalPaidInARS += amount * rate;
          } else {
            if (!incomeStats.pendingByCurrency[currency]) {
              incomeStats.pendingByCurrency[currency] = 0;
            }
            incomeStats.pendingByCurrency[currency] += amount;
            incomeStats.totalPendingInARS += amount * rate;
          }
        }
      });
    }

    return incomeStats;
  },
};