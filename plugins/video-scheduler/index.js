import React from 'react';
import VideoSchedulerNavItemComponent from './components/VideoSchedulerNavItem.jsx';
import VideoSchedulerMainPageComponent from './components/VideoSchedulerMainPage.jsx';
// Importar constantes
import { DEFAULT_VIDEO_STRUCTURE, VIDEO_STATUS } from './utils/constants.js';

const PLUGIN_PAGE_ID = 'videoscheduler';

export default {
  id: 'video-scheduler',
  name: 'Video Scheduler',
  version: '0.1.0', // Incrementamos versión para Etapa 1
  description: 'Plugin para planificar y organizar la producción de videos.',
  author: 'Tu Nombre/Equipo (Desarrollador: AtlasAI)',
  minAppVersion: '0.3.0',
  maxAppVersion: '0.9.9',
  // Ahora necesitamos 'storage' para la Etapa 2, pero podemos añadirlo ya.
  // Por ahora, en Etapa 1, no lo usaremos activamente para persistencia.
  permissions: ['ui', 'storage'], 

  _core: null,
  _navigationExtensionId: null,
  _pageExtensionId: null,

  // --- NUEVO: Almacenamiento en memoria para videos ---
  _videos: [], 

  init: function(core) {
    const self = this;
    
    return new Promise(function(resolve, reject) {
      try {
        self._core = core;

        if (typeof React === 'undefined') {
          const errMsg = `[${self.id}] React no está definido.`;
          console.error(errMsg);
          return reject(new Error(errMsg));
        }
        console.log(`[${self.id}] React está disponible.`);
        console.log(`[${self.id}] Inicializando plugin (v${self.version})...`);

        // Inicializar _videos (en etapas futuras, esto cargará desde storage)
        self._videos = []; 
        console.log(`[${self.id}] Almacén de videos en memoria inicializado.`);

        // Registrar API pública (se definirá más abajo)
        self.publicAPI = self._createPublicAPI(self);
        self._core.plugins.registerAPI(self.id, self.publicAPI);
        console.log(`[${self.id}] API pública registrada.`);

        // --- Registrar UI (sin cambios en la lógica de registro en sí) ---
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
        resolve(true);
      } catch (error) {
        console.error(`[${self.id}] Error durante la inicialización:`, error);
        reject(error);
      }
    });
  },

  cleanup: function() {
    // ... (la limpieza actual es adecuada)
    const self = this;
    console.log(`[${self.id}] Limpiando plugin...`);
    // En etapas futuras, aquí podríamos querer guardar this._videos en storage si hay cambios pendientes.
    // Por ahora, solo limpiamos UI.
    try {
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
  
  // --- API Pública del Plugin ---
  publicAPI: { /* Se define mediante _createPublicAPI */ },

  _createPublicAPI: function(pluginInstance) {
    return {
      // --- NUEVAS FUNCIONES API ---
      getAllVideos: () => pluginInstance._internalGetAllVideos(),
      createVideo: (videoData) => pluginInstance._internalCreateVideo(videoData),
      // En el futuro: getVideoById, updateVideo, deleteVideo
    };
  },

  // --- Métodos Internos del Plugin (Lógica de Negocio) ---
  _internalGetAllVideos: function() {
    console.log(`[${this.id}] _internalGetAllVideos llamado. Devolviendo ${this._videos.length} videos.`);
    // Devolver una copia para evitar modificaciones externas directas del array interno
    return [...this._videos]; 
  },

  _internalCreateVideo: function(videoData) {
    const self = this;
    const newVideo = {
      ...DEFAULT_VIDEO_STRUCTURE, // Empezar con la estructura base
      ...videoData,              // Sobrescribir con los datos proporcionados
      id: `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, // ID único simple
      status: videoData.status || VIDEO_STATUS.PLANNED, // Estado por defecto si no se proporciona
      createdAt: new Date().toISOString(),
    };
    self._videos.push(newVideo);
    console.log(`[${self.id}] _internalCreateVideo: Video añadido. Total videos: ${self._videos.length}`, newVideo);
    
    // Publicar un evento (útil para que otras partes de la UI reaccionen si es necesario)
    // self._core.events.publish(self.id, `${self.id}.videoCreated`, { video: newVideo });
    
    // En la Etapa 2, aquí guardaríamos en self._core.storage
    return newVideo; // Devolver el video creado
  },
};