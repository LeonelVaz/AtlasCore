/**
 * Plugin "Pruebas generales" para Atlas
 * Un plugin integral que demuestra todas las capacidades del sistema de plugins
 */

import constants from './constants';
import { initializeStorage, getStoredData, saveData } from './api/storageManager';
import { setupEventSubscriptions, cleanupEventSubscriptions } from './api/eventManager';
import { createPublicAPI } from './api/publicAPI';
import logger from './utils/logger';

// Importar componentes principales
import SidebarWidget from './components/sidebar/SidebarWidget';
import NavigationItem from './components/navigation/NavigationItem';
import SettingsPanel from './components/settings/SettingsPanel';
import DayCellExtension from './components/calendar/DayCellExtension';
import EventDetailExtension from './components/calendar/EventDetailExtension';
import EventFormExtension from './components/calendar/EventFormExtension';

// Importar páginas
import MainPage from './pages/MainPage';
import APITestsPage from './pages/APITestsPage';
import UITestsPage from './pages/UITestsPage';
import AdvancedDemosPage from './pages/AdvancedDemosPage';

/**
 * Definición principal del plugin
 */
export default {
  // Metadatos del plugin
  id: 'pruebas-generales',
  name: 'Pruebas Generales',
  version: '1.0.0',
  description: 'Plugin demostrativo para desarrolladores de Atlas que muestra todas las capacidades del sistema',
  author: 'Tu Nombre',
  
  // Restricciones de compatibilidad
  minAppVersion: '0.3.0',
  maxAppVersion: '2.0.0',
  
  // Permisos requeridos
  permissions: ['storage', 'events', 'ui', 'network', 'notifications', 'communication'],
  
  // Estado interno del plugin
  _core: null,
  _activeExtensions: [],
  _data: {
    settings: {
      theme: 'light',
      showNotifications: true,
      animationsEnabled: true,
      logLevel: 'info'
    },
    demoData: {
      counter: 0,
      lastUpdate: null,
      eventLog: []
    }
  },
  
  // API pública expuesta a otros plugins
  publicAPI: null,
  
  /**
   * Método de inicialización
   * @param {Object} core - Objeto core proporcionado por Atlas
   * @returns {Promise<boolean>} - Éxito/fallo de la inicialización
   */
  init: function(core) {
    const self = this;
    logger.info('Inicializando plugin Pruebas Generales...');
    
    // Devolver Promise para manejar inicialización asíncrona
    return new Promise(async function(resolve) {
      try {
        // Guardar referencia al core
        self._core = core;
        
        // Inicializar logger con nivel de log configurado
        logger.setCore(core);
        logger.setPluginId(self.id);
        
        // Cargar datos almacenados
        await initializeStorage(core, self);
        
        // Configurar suscripciones a eventos
        setupEventSubscriptions(core, self);
        
        // Registrar extensiones UI
        self._registerUIExtensions(core);
        
        // Crear API pública
        self.publicAPI = createPublicAPI(self);
        
        // Registrar API pública
        if (self.publicAPI) {
          core.plugins.registerAPI(self.id, self.publicAPI);
        }
        
        logger.success('Plugin Pruebas Generales inicializado correctamente');
        resolve(true);
      } catch (error) {
        logger.error('Error durante la inicialización del plugin:', error);
        resolve(false);
      }
    });
  },
  
  /**
   * Método de limpieza al desactivar el plugin
   * @returns {boolean} - Éxito/fallo de la limpieza
   */
  cleanup: function() {
    logger.info('Limpiando recursos del plugin Pruebas Generales...');
    
    try {
      // Guardar datos
      if (this._core) {
        saveData(this._core, this);
      }
      
      // Limpiar suscripciones a eventos
      cleanupEventSubscriptions(this._core, this);
      
      // Eliminar todas las extensiones de UI
      this._removeAllUIExtensions();
      
      logger.success('Limpieza del plugin completada');
      return true;
    } catch (error) {
      logger.error('Error durante la limpieza del plugin:', error);
      return false;
    }
  },
  
  /**
   * Registra todas las extensiones de UI del plugin
   * @param {Object} core - Objeto core del sistema
   * @private
   */
  _registerUIExtensions: function(core) {
    const extensionZones = core.ui.getExtensionZones();
    
    // Registrar componente en barra lateral
    this._registerExtension(
      extensionZones.CALENDAR_SIDEBAR, 
      SidebarWidget, 
      { order: 100 }
    );
    
    // Registrar ítem en navegación principal
    this._registerExtension(
      extensionZones.MAIN_NAVIGATION, 
      NavigationItem, 
      { order: 100 }
    );
    
    // Registrar panel de configuración
    this._registerExtension(
      extensionZones.SETTINGS_PANEL, 
      SettingsPanel, 
      { order: 100 }
    );
    
    // Registrar extensión para celdas del calendario
    this._registerExtension(
      extensionZones.CALENDAR_DAY_CELL, 
      DayCellExtension, 
      { order: 100 }
    );
    
    // Registrar extensión para detalles de eventos
    this._registerExtension(
      extensionZones.EVENT_DETAIL_VIEW, 
      EventDetailExtension, 
      { order: 100 }
    );
    
    // Registrar extensión para formulario de eventos
    this._registerExtension(
      extensionZones.EVENT_FORM, 
      EventFormExtension, 
      { order: 100 }
    );
    
    // Registrar páginas completas
    this._registerExtension(
      extensionZones.PLUGIN_PAGES, 
      MainPage, 
      { order: 100, props: { pageId: 'main-page' } }
    );
    
    this._registerExtension(
      extensionZones.PLUGIN_PAGES, 
      APITestsPage, 
      { order: 100, props: { pageId: 'api-tests' } }
    );
    
    this._registerExtension(
      extensionZones.PLUGIN_PAGES, 
      UITestsPage, 
      { order: 100, props: { pageId: 'ui-tests' } }
    );
    
    this._registerExtension(
      extensionZones.PLUGIN_PAGES, 
      AdvancedDemosPage, 
      { order: 100, props: { pageId: 'advanced-demos' } }
    );
  },
  
  /**
   * Registra una extensión de UI y guarda su referencia
   * @param {string} zone - Zona de extensión
   * @param {function} component - Componente React
   * @param {Object} options - Opciones adicionales
   * @private
   */
  _registerExtension: function(zone, component, options) {
    const extensionId = this._core.ui.registerExtension(
      this.id,
      zone,
      component,
      {
        ...options,
        props: {
          ...options.props,
          plugin: this,
          core: this._core
        }
      }
    );
    
    this._activeExtensions.push(extensionId);
    return extensionId;
  },
  
  /**
   * Elimina todas las extensiones de UI registradas
   * @private
   */
  _removeAllUIExtensions: function() {
    if (this._core) {
      this._core.ui.removeAllExtensions(this.id);
      this._activeExtensions = [];
    }
  }
};