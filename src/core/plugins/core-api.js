// src/core/plugins/core-api.js
/**
 * API Core para plugins de Atlas - Actualizado con soporte para diálogos
 */
import eventBus from '../bus/event-bus';
import storageService from '../../services/storage-service';
import pluginEvents from './plugin-events';
import pluginStorage from './plugin-storage';
import uiExtensionManager from './ui-extension-manager';
import pluginAPIRegistry from './plugin-api-registry';
import pluginCommunication from './plugin-communication';
import pluginRegistry from './plugin-registry';
import { PLUGIN_CONSTANTS } from '../config/constants';
import { createPluginDialogAPI } from '../../utils/dialog-interceptor';
// Importar los componentes de texto enriquecido
import RichText from '../../components/ui/rich-text';

// Importar el módulo de calendario
import calendarModule from '../modules/calendar-module';

class CoreAPI {
  constructor() {
    this.version = '0.3.0';
    this._services = {};
    this._pluginResources = {};
    this._errorHandlers = [];
    this._modulesInitialized = new Set();
    this._dialogAPI = null;
  }

  init(services = {}) {
    this._services = services;
    
    if (services.dialog) {
      this._dialogAPI = createPluginDialogAPI();
    } else {
      this._dialogAPI = null; // Asegurarse de que se resetea si no se provee
    }
    
    this._initEvents();
    this._initStorage();
    this._initUI();
    this._initDialogs(); 
    this._initErrorHandling(); // Debe ir después de _initDialogs si usa this._dialogAPI
    this._initCommunication();
    
    console.log('API Core inicializada (v' + this.version + ')');
  }

  _initEvents() {
    this.events = {
      subscribe: (pluginId, eventName, callback) => {
        return pluginEvents.subscribe(pluginId, eventName, callback);
      },
      publish: (pluginId, eventName, data) => {
        return pluginEvents.publish(pluginId, eventName, data);
      },
      unsubscribeAll: (pluginId) => {
        return pluginEvents.unsubscribeAll(pluginId);
      }
    };
  }

  _initStorage() {
    this.storage = {
      setItem: async (pluginId, key, value) => {
        return pluginStorage.setItem(pluginId, key, value);
      },
      getItem: async (pluginId, key, defaultValue = null) => {
        return pluginStorage.getItem(pluginId, key, defaultValue);
      },
      removeItem: async (pluginId, key) => {
        return pluginStorage.removeItem(pluginId, key);
      },
      clearPluginData: async (pluginId) => {
        return pluginStorage.clearPluginData(pluginId);
      }
    };
  }

  _initUI() {
    this.ui = {
      registerExtension: (pluginId, zoneId, component, options = {}) => {
        if (!pluginId || !zoneId || !component) {
          console.error('Argumentos inválidos para registerExtension');
          return null;
        }
        try {
          const componentInfo = {
            component,
            props: options.props || {},
            order: options.order || 100
          };
          const extensionId = uiExtensionManager.registerExtension(
            pluginId, zoneId, componentInfo
          );
          if (extensionId) {
            if (!this._pluginResources[pluginId]) this._pluginResources[pluginId] = {};
            if (!this._pluginResources[pluginId].extensions) this._pluginResources[pluginId].extensions = [];
            this._pluginResources[pluginId].extensions.push({ extensionId, zoneId });
          }
          return extensionId;
        } catch (error) {
          this._handleError(pluginId, 'ui.registerExtension', error);
          return null;
        }
      },
      removeExtension: (pluginId, extensionId) => {
        if (!pluginId || !extensionId) {
          console.error('Argumentos inválidos para removeExtension');
          return false;
        }
        try {
          const success = uiExtensionManager.removeExtension(extensionId);
          if (success && this._pluginResources[pluginId]?.extensions) {
            this._pluginResources[pluginId].extensions = 
              this._pluginResources[pluginId].extensions.filter(ext => ext.extensionId !== extensionId);
          }
          return success;
        } catch (error) {
          this._handleError(pluginId, 'ui.removeExtension', error);
          return false;
        }
      },
      getExtensionZones: () => {
        try {
          return { ...PLUGIN_CONSTANTS.UI_EXTENSION_ZONES };
        } catch (error) {
          console.error('Error al obtener zonas de extensión:', error);
          return {};
        }
      },
      removeAllExtensions: (pluginId) => {
        if (!pluginId) return false;
        try {
          return uiExtensionManager.removeAllPluginExtensions(pluginId);
        } catch (error) {
          this._handleError(pluginId, 'ui.removeAllExtensions', error);
          return false;
        }
      },
      components: {
        RichTextEditor: RichText.Editor,
        RichTextViewer: RichText.Viewer
      }
    };
  }

  _initDialogs() {
    // Guardar 'this' de la instancia de CoreAPI
    const self = this; 

    const dialogFunctions = {
      alert: async (pluginId, message, title = 'Información') => {
        try {
          // Usar self (CoreAPI instance) para acceder a _dialogAPI y _handleError
          if (self._dialogAPI && self._dialogAPI.alert) {
            return await self._dialogAPI.alert(String(message), title);
          }
          console.log(`[Plugin ${pluginId}] Alert:`, message);
          return true;
        } catch (error) {
          self._handleError(pluginId, 'dialog.alert', error);
          return false;
        }
      },
      confirm: async (pluginId, message, title = 'Confirmación') => {
        try {
          if (self._dialogAPI && self._dialogAPI.confirm) {
            return await self._dialogAPI.confirm(String(message), title);
          }
          console.log(`[Plugin ${pluginId}] Confirm:`, message, '(auto-false)');
          return false;
        } catch (error) {
          self._handleError(pluginId, 'dialog.confirm', error);
          return false;
        }
      },
      prompt: async (pluginId, message, defaultValue = '', title = 'Entrada de datos') => {
        try {
          if (self._dialogAPI && self._dialogAPI.prompt) {
            return await self._dialogAPI.prompt(String(message), String(defaultValue), title);
          }
          console.log(`[Plugin ${pluginId}] Prompt:`, message, '(auto-null)');
          return null;
        } catch (error) {
          self._handleError(pluginId, 'dialog.prompt', error);
          return null;
        }
      },
      showCustomDialog: async (pluginId, options) => {
        try {
          if (self._dialogAPI && self._dialogAPI.showDialog) {
            return await self._dialogAPI.showDialog(options);
          }
          console.log(`[Plugin ${pluginId}] Custom dialog:`, options);
          return null;
        } catch (error) {
          self._handleError(pluginId, 'dialog.showCustomDialog', error);
          return null;
        }
      },
      show: function(pluginId, type, message, options = {}) { // Usar function() para que 'this' se refiera a dialogFunctions
        const { title, defaultValue } = options;
        // 'this' aquí se referirá al objeto 'dialogFunctions'
        switch (type) {
          case 'alert':
            return this.alert(pluginId, message, title); 
          case 'confirm':
            return this.confirm(pluginId, message, title);
          case 'prompt':
            return this.prompt(pluginId, message, defaultValue, title);
          default:
            // self._handleError o console.error
            console.error(`Tipo de diálogo no válido: ${type}`);
            // self._handleError(pluginId, 'dialog.show', new Error(`Tipo de diálogo no válido: ${type}`));
            return Promise.resolve(null);
        }
      }
    };
    self.dialogs = dialogFunctions;
  }

  _initErrorHandling() {
    this._errorHandlers = []; // Limpiar handlers previos en cada init
    this._errorHandlers.push((pluginId, context, error) => {
      console.error(`Error en plugin [${pluginId}] (${context}):`, error);
      if (context === 'init' || context === 'critical') {
        if (this._dialogAPI && this._dialogAPI.alert) { // 'this' aquí es la instancia de CoreAPI
          this._dialogAPI.alert(
            `Error crítico en plugin "${pluginId}": ${error.message}`,
            'Error de Plugin'
          ).catch(e => {
            console.error('Error al mostrar diálogo de error:', e);
          });
        }
      }
    });
  }

  _initCommunication() {
    this.plugins = {
      registerAPI: (pluginId, apiObject) => {
        try {
          return pluginAPIRegistry.registerAPI(pluginId, apiObject);
        } catch (error) {
          this._handleError(pluginId, 'plugins.registerAPI', error);
          return false;
        }
      },
      getPlugin: (pluginId) => {
        try {
          const plugin = pluginRegistry.getPlugin(pluginId);
          if (!plugin) return null;
          return {
            id: plugin.id, name: plugin.name, version: plugin.version,
            author: plugin.author, description: plugin.description,
            isActive: pluginRegistry.isPluginActive(pluginId),
          };
        } catch (error) {
          this._handleError('app', 'plugins.getPlugin', error);
          return null;
        }
      },
      getActivePlugins: () => {
        try {
          const activePlugins = pluginRegistry.getActivePlugins();
          return activePlugins.map(plugin => ({
            id: plugin.id, name: plugin.name, version: plugin.version,
            author: plugin.author, description: plugin.description, isActive: true
          }));
        } catch (error) {
          this._handleError('app', 'plugins.getActivePlugins', error);
          return [];
        }
      },
      isPluginActive: (pluginId) => {
        try {
          return pluginRegistry.isPluginActive(pluginId);
        } catch (error) {
          this._handleError('app', 'plugins.isPluginActive', error);
          return false;
        }
      },
      getPluginAPI: (callerPluginId, targetPluginId) => {
        try {
          if (!pluginRegistry.getPlugin(callerPluginId) || !pluginRegistry.getPlugin(targetPluginId)) {
            return null;
          }
          const proxy = { __targetPluginId: targetPluginId, __callerPluginId: callerPluginId };
          return new Proxy(proxy, {
            get: (target, prop) => {
              if (prop.startsWith('__')) return target[prop];
              return (...args) => pluginCommunication.callPluginMethod(
                target.__callerPluginId, target.__targetPluginId, prop, args
              );
            }
          });
        } catch (error) {
          this._handleError(callerPluginId, 'plugins.getPluginAPI', error);
          return null;
        }
      },
      createChannel: (callerPluginId, channelName, options = {}) => {
        try {
          return pluginCommunication.createChannel(channelName, callerPluginId, options);
        } catch (error) {
          this._handleError(callerPluginId, 'plugins.createChannel', error);
          return null;
        }
      },
      getChannel: (callerPluginId, channelName) => {
        try {
          const channelsInfo = pluginCommunication.getChannelsInfo();
          if (!channelsInfo[channelName]) return null;
          const subscribe = (callback) => pluginCommunication.subscribeToChannel(channelName, callerPluginId, callback);
          const publish = (message) => pluginCommunication.publishToChannel(channelName, callerPluginId, message);
          const close = () => pluginCommunication.closeChannel(channelName, callerPluginId);
          return {
            subscribe, publish, close,
            name: channelName, createdBy: channelsInfo[channelName].creator
          };
        } catch (error) {
          this._handleError(callerPluginId, 'plugins.getChannel', error);
          return null;
        }
      },
      listChannels: () => {
        try {
          const channelsInfo = pluginCommunication.getChannelsInfo();
          return Object.keys(channelsInfo).map(channelName => ({
            name: channelName, createdBy: channelsInfo[channelName].creator,
            subscribersCount: channelsInfo[channelName].subscribers.length
          }));
        } catch (error) {
          this._handleError('app', 'plugins.listChannels', error);
          return [];
        }
      }
    };
  }

  _handleError(pluginId, context, error) {
    for (const handler of this._errorHandlers) {
      try {
        handler(pluginId, context, error);
      } catch (e) {
        console.error('Error en handler de errores:', e);
      }
    }
  }

  registerErrorHandler(handler) {
    if (typeof handler !== 'function') return () => {};
    this._errorHandlers.push(handler);
    return () => {
      const index = this._errorHandlers.indexOf(handler);
      if (index !== -1) this._errorHandlers.splice(index, 1);
    };
  }

  getModule(moduleId) {
    if (!moduleId) {
      console.error('ID de módulo inválido');
      return null;
    }
    if (moduleId === 'calendar') {
      if (!this._modulesInitialized.has('calendar')) {
        const calendarService = this._services.calendar;
        if (calendarService) {
          calendarModule.init(calendarService);
          this._modulesInitialized.add('calendar');
        } else {
            // Podríamos loguear un error si el servicio de calendario no está disponible
            // pero el módulo calendar ya lo hace.
        }
      }
      return calendarModule;
    }
    if (typeof window !== 'undefined' && window.__appModules && window.__appModules[moduleId]) {
      return window.__appModules[moduleId];
    }
    if (this._services && this._services[moduleId]) {
      return this._services[moduleId];
    }
    console.warn(`Módulo no encontrado: ${moduleId}`);
    return null;
  }

  async cleanupPluginResources(pluginId) {
    if (!pluginId || !this._pluginResources[pluginId]) {
      return true;
    }
    try {
      this.events.unsubscribeAll(pluginId);
      this.ui.removeAllExtensions(pluginId);
      pluginAPIRegistry.unregisterAPI(pluginId);
      pluginCommunication.clearPluginResources(pluginId);
      delete this._pluginResources[pluginId];
      return true;
    } catch (error) {
      this._handleError(pluginId, 'cleanupPluginResources', error);
      return false;
    }
  }
}

const coreAPI = new CoreAPI();
export default coreAPI;