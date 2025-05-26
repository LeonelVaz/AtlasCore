import React from 'react';
import VideoSchedulerNavItemComponent from './components/VideoSchedulerNavItem.jsx';
import VideoSchedulerMainPageComponent from './components/VideoSchedulerMainPage.jsx';
import { DEFAULT_VIDEO_STRUCTURE, VIDEO_STATUS } from './utils/constants.js';

const PLUGIN_PAGE_ID = 'videoscheduler';
const STORAGE_KEY_VIDEOS = 'videos_data'; // Clave para el almacenamiento

export default {
  id: 'video-scheduler',
  name: 'Video Scheduler',
  version: '0.2.0', // Incrementamos versión para Etapa 2
  description: 'Plugin para planificar y organizar la producción de videos.',
  author: 'Tu Nombre/Equipo (Desarrollador: AtlasAI)',
  minAppVersion: '0.3.0',
  maxAppVersion: '0.9.9',
  permissions: ['ui', 'storage'], // 'storage' es crucial ahora

  _core: null,
  _navigationExtensionId: null,
  _pageExtensionId: null,
  _videos: [], 

  // --- MÉTODO INIT ACTUALIZADO ---
  init: function(core) {
    const self = this;
    
    // init ahora devuelve una Promise porque _loadVideos es asíncrono
    return new Promise(async function(resolve, reject) { 
      try {
        self._core = core;

        if (typeof React === 'undefined') {
          const errMsg = `[${self.id}] React no está definido.`;
          console.error(errMsg);
          return reject(new Error(errMsg)); // Rechazar la promesa
        }
        console.log(`[${self.id}] React está disponible.`);
        console.log(`[${self.id}] Inicializando plugin (v${self.version})...`);

        // --- NUEVO: Cargar videos desde el almacenamiento ---
        await self._loadVideosFromStorage(); 
        // _loadVideosFromStorage ahora actualiza self._videos internamente

        self.publicAPI = self._createPublicAPI(self);
        self._core.plugins.registerAPI(self.id, self.publicAPI);
        console.log(`[${self.id}] API pública registrada.`);

        function NavigationWrapper(propsFromAtlas) {
          return React.createElement(VideoSchedulerNavItemComponent, {
            ...propsFromAtlas, plugin: self, core: self._core, pluginId: self.id, pageIdToNavigate: PLUGIN_PAGE_ID
          });
        }
        self._navigationExtensionId = self._core.ui.registerExtension(
          self.id, self._core.ui.getExtensionZones().MAIN_NAVIGATION, NavigationWrapper, { order: 150 }
        );

        function PageWrapper(propsFromAtlas) {
          return React.createElement(VideoSchedulerMainPageComponent, {
            ...propsFromAtlas, plugin: self, core: self._core, pluginId: self.id
          });
        }
        self._pageExtensionId = self._core.ui.registerExtension(
          self.id, self._core.ui.getExtensionZones().PLUGIN_PAGES, PageWrapper,
          { order: 100, props: { pageId: PLUGIN_PAGE_ID } }
        );
        
        console.log(`[${self.id}] Extensiones UI registradas (NavID: ${self._navigationExtensionId}, PageID: ${self._pageExtensionId}).`);
        console.log(`[${self.id}] Plugin inicializado completamente.`);
        resolve(true); // Resolver la promesa
      } catch (error) {
        console.error(`[${self.id}] Error durante la inicialización:`, error);
        reject(error); // Rechazar la promesa
      }
    });
  },

  cleanup: async function() { // Convertido a async para _saveVideosToStorage
    const self = this;
    console.log(`[${self.id}] Limpiando plugin...`);
    try {
      // --- NUEVO: Guardar videos al limpiar (buena práctica) ---
      // Aunque guardamos después de cada cambio, esto es un último resguardo.
      await self._saveVideosToStorage();

      if (self._core.ui.removeAllExtensions) {
        self._core.ui.removeAllExtensions(self.id);
        console.log(`[${self.id}] Todas las extensiones UI del plugin removidas.`);
      }
      self._navigationExtensionId = null;
      self._pageExtensionId = null;
      console.log(`[${self.id}] Plugin limpiado correctamente.`);
      return true;
    } catch (error) {
      console.error(`[${self.id}] Error durante la limpieza:`, error);
      return false;
    }
  },
  
  publicAPI: { /* ... */ },

  _createPublicAPI: function(pluginInstance) {
    return {
      getAllVideos: () => pluginInstance._internalGetAllVideos(),
      // --- CREATEVIDEO AHORA ES ASÍNCRONO ---
      createVideo: async (videoData) => await pluginInstance._internalCreateVideo(videoData),
      // Añadiremos estos en etapas futuras, pero preparémoslos para ser async
      // updateVideo: async (videoId, updates) => await pluginInstance._internalUpdateVideo(videoId, updates),
      // deleteVideo: async (videoId) => await pluginInstance._internalDeleteVideo(videoId),
    };
  },

  // --- MÉTODOS INTERNOS MODIFICADOS/NUEVOS ---
  _loadVideosFromStorage: async function() {
    const self = this;
    try {
      const storedVideos = await self._core.storage.getItem(self.id, STORAGE_KEY_VIDEOS, []); // Valor por defecto: array vacío
      self._videos = storedVideos || []; // Asegurar que _videos sea un array
      console.log(`[${self.id}] Videos cargados desde storage: ${self._videos.length} videos.`);
    } catch (error) {
      console.error(`[${self.id}] Error al cargar videos desde storage:`, error);
      self._videos = []; // En caso de error, empezar con array vacío
    }
  },

  _saveVideosToStorage: async function() {
    const self = this;
    if (!self._core || !self._core.storage) {
        console.warn(`[${self.id}] _saveVideosToStorage: Core o storage no disponible. No se pudo guardar.`);
        return;
    }
    try {
      await self._core.storage.setItem(self.id, STORAGE_KEY_VIDEOS, self._videos);
      console.log(`[${self.id}] Videos guardados en storage: ${self._videos.length} videos.`);
    } catch (error) {
      console.error(`[${self.id}] Error al guardar videos en storage:`, error);
    }
  },

  _internalGetAllVideos: function() {
    console.log(`[${this.id}] _internalGetAllVideos llamado. Devolviendo ${this._videos.length} videos.`);
    return [...this._videos]; 
  },

  // --- CREATEVIDEO AHORA ES ASÍNCRONO Y GUARDA ---
  _internalCreateVideo: async function(videoData) {
    const self = this;
    const newVideo = {
      ...DEFAULT_VIDEO_STRUCTURE,
      ...videoData,
      id: `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      status: videoData.status || VIDEO_STATUS.PLANNED,
      createdAt: new Date().toISOString(),
    };
    self._videos.push(newVideo);
    console.log(`[${self.id}] _internalCreateVideo: Video añadido a memoria. Total: ${self._videos.length}`, newVideo);
    
    await self._saveVideosToStorage(); // Guardar en storage
    
    // self._core.events.publish(self.id, `${self.id}.videoCreated`, { video: newVideo });
    return newVideo;
  },

  // --- ESQUELETOS PARA FUTUROS MÉTODOS (también deben guardar) ---
  // _internalUpdateVideo: async function(videoId, updates) {
  //   const self = this;
  //   const videoIndex = self._videos.findIndex(v => v.id === videoId);
  //   if (videoIndex > -1) {
  //     self._videos[videoIndex] = { ...self._videos[videoIndex], ...updates, updatedAt: new Date().toISOString() };
  //     await self._saveVideosToStorage();
  //     // self._core.events.publish(self.id, `${self.id}.videoUpdated`, { video: self._videos[videoIndex] });
  //     return self._videos[videoIndex];
  //   }
  //   return null;
  // },

  // _internalDeleteVideo: async function(videoId) {
  //   const self = this;
  //   const initialLength = self._videos.length;
  //   self._videos = self._videos.filter(v => v.id !== videoId);
  //   if (self._videos.length < initialLength) {
  //     await self._saveVideosToStorage();
  //     // self._core.events.publish(self.id, `${self.id}.videoDeleted`, { videoId });
  //     return true;
  //   }
  //   return false;
  // },
};