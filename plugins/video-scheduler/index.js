// video-scheduler/index.js

import React from 'react';
// Importar los componentes propios
import VideoSchedulerNavItemComponent from './components/VideoSchedulerNavItem.jsx';
import VideoSchedulerMainPageComponent from './components/VideoSchedulerMainPage.jsx';

// ID de página consistente y simple. Notes usa 'notes', así que 'videoscheduler' está bien.
const PLUGIN_PAGE_ID = 'videoscheduler';

export default {
  id: 'video-scheduler',
  name: 'Video Scheduler',
  version: '0.0.3', // Nueva versión para esta corrección
  description: 'Plugin para planificar y organizar la producción de videos.',
  author: 'Tu Nombre/Equipo (Desarrollador: AtlasAI)',
  minAppVersion: '0.3.0',
  maxAppVersion: '0.9.9',
  permissions: ['ui'],

  _core: null,
  _navigationExtensionId: null,
  _pageExtensionId: null,

  init: function(core) {
    const self = this;
    
    return new Promise(function(resolve, reject) {
      try {
        self._core = core;

        if (typeof React === 'undefined') {
          const errMsg = `[${self.id}] React no está definido. Deteniendo inicialización.`;
          console.error(errMsg);
          return reject(new Error(errMsg));
        }
        console.log(`[${self.id}] React está disponible.`);
        console.log(`[${self.id}] Inicializando plugin...`);

        // --- Registrar Navegación ---
        function NavigationWrapper(propsFromAtlas) {
          return React.createElement(VideoSchedulerNavItemComponent, {
            ...propsFromAtlas,
            plugin: self,
            core: self._core,
            pluginId: self.id,
            // Pasar el pageId que el NavItem debe usar para la navegación
            pageIdToNavigate: PLUGIN_PAGE_ID
          });
        }
        self._navigationExtensionId = self._core.ui.registerExtension(
          self.id,
          self._core.ui.getExtensionZones().MAIN_NAVIGATION,
          NavigationWrapper,
          { order: 150 }
        );
        console.log(`[${self.id}] Item de navegación registrado. Extension ID: ${self._navigationExtensionId}`);

        // --- Registrar Página ---
        function PageWrapper(propsFromAtlas) {
          // propsFromAtlas aquí contendrá el pageId que Atlas le pasa
          // si se registró correctamente.
          console.log(`[${self.id}] PageWrapper recibiendo propsFromAtlas:`, propsFromAtlas);
          return React.createElement(VideoSchedulerMainPageComponent, {
            ...propsFromAtlas,
            plugin: self,
            core: self._core,
            pluginId: self.id
            // El componente VideoSchedulerMainPageComponent recibirá props.pageId de Atlas
          });
        }
        self._pageExtensionId = self._core.ui.registerExtension(
          self.id,
          self._core.ui.getExtensionZones().PLUGIN_PAGES,
          PageWrapper,
          { // Objeto de opciones para registerExtension
            order: 100, // Opcional, para el orden entre páginas de diferentes plugins
            // **LA CORRECCIÓN IMPORTANTE ESTÁ AQUÍ:**
            // El pageId se define DENTRO de un objeto 'props' que se pasa
            // al registrar la extensión de la página.
            props: { 
              pageId: PLUGIN_PAGE_ID // Este es el ID con el que se registra la página.
                                     // Atlas pasará este pageId como prop al PageWrapper.
            }
          }
        );
        console.log(`[${self.id}] Página principal registrada con pageId: '${PLUGIN_PAGE_ID}'. Extension ID: ${self._pageExtensionId}`);

        if (!self._navigationExtensionId || !self._pageExtensionId) {
            console.warn(`[${self.id}] Uno o ambos registros de extensión UI podrían haber fallado (IDs: nav=${self._navigationExtensionId}, page=${self._pageExtensionId}).`);
        }

        console.log(`[${self.id}] Plugin inicializado completamente.`);
        resolve(true);
      } catch (error) {
        console.error(`[${self.id}] Error durante la inicialización:`, error);
        reject(error); // Rechazar la promesa si hay un error
      }
    });
  },

  cleanup: function() {
    // ... (sin cambios respecto a Revisión 4, la limpieza con IDs es buena)
    const self = this;
    console.log(`[${self.id}] Limpiando plugin...`);
    try {
      if (self._navigationExtensionId && self._core && self._core.ui.removeExtension) {
        self._core.ui.removeExtension(self.id, self._navigationExtensionId);
        console.log(`[${self.id}] Extensión de navegación (${self._navigationExtensionId}) removida.`);
      }
      if (self._pageExtensionId && self._core && self._core.ui.removeExtension) {
        self._core.ui.removeExtension(self.id, self._pageExtensionId);
        console.log(`[${self.id}] Extensión de página (${self._pageExtensionId}) removida.`);
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
  publicAPI: {}
};