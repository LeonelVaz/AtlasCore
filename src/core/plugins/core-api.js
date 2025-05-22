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
    // Almacenar referencias a servicios que puedan necesitar los plugins
    this._services = services;
    
    // Inicializar API de diálogos si está disponible
    if (services.dialog) {
      this._dialogAPI = createPluginDialogAPI();
    }
    
    // Inicializar subcomponentes básicos de la API
    this._initEvents();
    this._initStorage();
    this._initUI();
    this._initDialogs(); // Nueva inicialización para diálogos
    this._initErrorHandling();
    this._initCommunication();
    
    console.log('API Core inicializada (v' + this.version + ')');
  }

  _initEvents() {
    // Usar el módulo especializado para eventos de plugins
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
    // Usar el módulo especializado para almacenamiento de plugins
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
    // Sistema de integración UI para plugins - Mejorado con Extensiones
    this.ui = {
      registerExtension: (pluginId, zoneId, component, options = {}) => {
        if (!pluginId || !zoneId || !component) {
          console.error('Argumentos inválidos para registerExtension');
          return null;
        }
        
        try {
          // Crear objeto de información del componente
          const componentInfo = {
            component,
            props: options.props || {},
            order: options.order || 100
          };
          
          // Registrar en el gestor de extensiones
          const extensionId = uiExtensionManager.registerExtension(
            pluginId, 
            zoneId, 
            componentInfo
          );
          
          // Registrar para limpieza automática
          if (extensionId) {
            if (!this._pluginResources[pluginId]) {
              this._pluginResources[pluginId] = {};
            }
            
            if (!this._pluginResources[pluginId].extensions) {
              this._pluginResources[pluginId].extensions = [];
            }
            
            this._pluginResources[pluginId].extensions.push({
              extensionId,
              zoneId
            });
          }
          
          return extensionId;
        } catch (error) {
          this._handleError(pluginId, 'ui', error);
          return null;
        }
      },
      
      removeExtension: (pluginId, extensionId) => {
        if (!pluginId || !extensionId) {
          console.error('Argumentos inválidos para removeExtension');
          return false;
        }
        
        try {
          // Eliminar del gestor de extensiones
          const success = uiExtensionManager.removeExtension(extensionId);
          
          // Actualizar registro de recursos si se eliminó
          if (success && this._pluginResources[pluginId]?.extensions) {
            this._pluginResources[pluginId].extensions = 
              this._pluginResources[pluginId].extensions.filter(
                ext => ext.extensionId !== extensionId
              );
          }
          
          return success;
        } catch (error) {
          this._handleError(pluginId, 'ui', error);
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
        if (!pluginId) {
          return false;
        }
        
        try {
          return uiExtensionManager.removeAllPluginExtensions(pluginId);
        } catch (error) {
          this._handleError(pluginId, 'ui', error);
          return false;
        }
      },

      // Agregar componentes de UI básicos para plugins
      components: {
        // Componentes de texto enriquecido
        RichTextEditor: RichText.Editor,
        RichTextViewer: RichText.Viewer
      }
    };
  }

  _initDialogs() {
    // Sistema de diálogos para plugins
    this.dialogs = {
      // Función alert personalizada para plugins
      alert: async (pluginId, message, title = 'Información') => {
        try {
          if (this._dialogAPI && this._dialogAPI.alert) {
            return await this._dialogAPI.alert(String(message), title);
          }
          
          // Fallback a console si no hay API de diálogos
          console.log(`[Plugin ${pluginId}] Alert:`, message);
          return true;
        } catch (error) {
          this._handleError(pluginId, 'dialog.alert', error);
          return false;
        }
      },
      
      // Función confirm personalizada para plugins
      confirm: async (pluginId, message, title = 'Confirmación') => {
        try {
          if (this._dialogAPI && this._dialogAPI.confirm) {
            return await this._dialogAPI.confirm(String(message), title);
          }
          
          // Fallback a console si no hay API de diálogos
          console.log(`[Plugin ${pluginId}] Confirm:`, message, '(auto-false)');
          return false;
        } catch (error) {
          this._handleError(pluginId, 'dialog.confirm', error);
          return false;
        }
      },
      
      // Función prompt personalizada para plugins
      prompt: async (pluginId, message, defaultValue = '', title = 'Entrada de datos') => {
        try {
          if (this._dialogAPI && this._dialogAPI.prompt) {
            return await this._dialogAPI.prompt(String(message), String(defaultValue), title);
          }
          
          // Fallback a console si no hay API de diálogos
          console.log(`[Plugin ${pluginId}] Prompt:`, message, '(auto-null)');
          return null;
        } catch (error) {
          this._handleError(pluginId, 'dialog.prompt', error);
          return null;
        }
      },
      
      // Función para diálogos personalizados avanzados
      showCustomDialog: async (pluginId, options) => {
        try {
          if (this._dialogAPI && this._dialogAPI.showDialog) {
            return await this._dialogAPI.showDialog(options);
          }
          
          // Fallback básico
          console.log(`[Plugin ${pluginId}] Custom dialog:`, options);
          return null;
        } catch (error) {
          this._handleError(pluginId, 'dialog.showCustomDialog', error);
          return null;
        }
      },
      
      // Función de conveniencia que envuelve todas las opciones
      show: (pluginId, type, message, options = {}) => {
        const {
          title,
          defaultValue,
          confirmText,
          cancelText
        } = options;
        
        switch (type) {
          case 'alert':
            return this.alert(pluginId, message, title);
          case 'confirm':
            return this.confirm(pluginId, message, title);
          case 'prompt':
            return this.prompt(pluginId, message, defaultValue, title);
          default:
            console.error(`Tipo de diálogo no válido: ${type}`);
            return Promise.resolve(null);
        }
      }
    };
  }

  _initErrorHandling() {
    // Registrar handler de errores por defecto
    this._errorHandlers.push((pluginId, context, error) => {
      console.error(`Error en plugin [${pluginId}] (${context}):`, error);
      
      // Mostrar errores críticos usando el sistema de diálogos si está disponible
      if (context === 'init' || context === 'critical') {
        if (this._dialogAPI && this._dialogAPI.alert) {
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
    // API para comunicación entre plugins
    this.plugins = {
      registerAPI: (pluginId, apiObject) => {
        try {
          return pluginAPIRegistry.registerAPI(pluginId, apiObject);
        } catch (error) {
          this._handleError(pluginId, 'registerAPI', error);
          return false;
        }
      },
      
      getPlugin: (pluginId) => {
        try {
          const plugin = pluginRegistry.getPlugin(pluginId);
          
          if (!plugin) {
            return null;
          }
          
          // Devolver solo información pública
          return {
            id: plugin.id,
            name: plugin.name,
            version: plugin.version,
            author: plugin.author,
            description: plugin.description,
            isActive: pluginRegistry.isPluginActive(pluginId),
            // No incluir API, dependencias, conflictos, etc.
          };
        } catch (error) {
          this._handleError('app', 'getPlugin', error);
          return null;
        }
      },
      
      getActivePlugins: () => {
        try {
          const activePlugins = pluginRegistry.getActivePlugins();
          
          // Mapear a información pública
          return activePlugins.map(plugin => ({
            id: plugin.id,
            name: plugin.name,
            version: plugin.version,
            author: plugin.author,
            description: plugin.description,
            isActive: true
          }));
        } catch (error) {
          this._handleError('app', 'getActivePlugins', error);
          return [];
        }
      },
      
      isPluginActive: (pluginId) => {
        try {
          return pluginRegistry.isPluginActive(pluginId);
        } catch (error) {
          this._handleError('app', 'isPluginActive', error);
          return false;
        }
      },
      
      getPluginAPI: (callerPluginId, targetPluginId) => {
        try {
          // Verificar que ambos plugins existan
          if (!pluginRegistry.getPlugin(callerPluginId) || 
              !pluginRegistry.getPlugin(targetPluginId)) {
            return null;
          }
          
          // Se implementa a través del sistema de comunicación
          const proxy = {
            __targetPluginId: targetPluginId,
            __callerPluginId: callerPluginId
          };
          
          // Crear un proxy que permitirá acceder a los métodos de la API
          return new Proxy(proxy, {
            get: (target, prop) => {
              // Ignorar propiedades internas
              if (prop.startsWith('__')) {
                return target[prop];
              }
              
              // Devolver una función que invoca el método remoto
              return (...args) => {
                return pluginCommunication.callPluginMethod(
                  target.__callerPluginId,
                  target.__targetPluginId,
                  prop,
                  args
                );
              };
            }
          });
        } catch (error) {
          this._handleError(callerPluginId, 'getPluginAPI', error);
          return null;
        }
      },
      
      createChannel: (callerPluginId, channelName, options = {}) => {
        try {
          return pluginCommunication.createChannel(channelName, callerPluginId, options);
        } catch (error) {
          this._handleError(callerPluginId, 'createChannel', error);
          return null;
        }
      },
      
      getChannel: (callerPluginId, channelName) => {
        try {
          const channelsInfo = pluginCommunication.getChannelsInfo();
          
          if (!channelsInfo[channelName]) {
            return null;
          }
          
          const subscribe = (callback) => {
            return pluginCommunication.subscribeToChannel(channelName, callerPluginId, callback);
          };
          
          const publish = (message) => {
            return pluginCommunication.publishToChannel(channelName, callerPluginId, message);
          };
          
          // Solo el creador puede cerrar el canal, por defecto
          const close = () => {
            return pluginCommunication.closeChannel(channelName, callerPluginId);
          };
          
          // Devolver API del canal
          return {
            subscribe,
            publish,
            close,
            name: channelName,
            createdBy: channelsInfo[channelName].creator
          };
        } catch (error) {
          this._handleError(callerPluginId, 'getChannel', error);
          return null;
        }
      },
      
      listChannels: () => {
        try {
          const channelsInfo = pluginCommunication.getChannelsInfo();
          
          return Object.keys(channelsInfo).map(channelName => ({
            name: channelName,
            createdBy: channelsInfo[channelName].creator,
            subscribersCount: channelsInfo[channelName].subscribers.length
          }));
        } catch (error) {
          this._handleError('app', 'listChannels', error);
          return [];
        }
      }
    };
  }

  _handleError(pluginId, context, error) {
    // Llamar a todos los handlers registrados
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
    
    // Devolver función para cancelar registro
    return () => {
      const index = this._errorHandlers.indexOf(handler);
      if (index !== -1) {
        this._errorHandlers.splice(index, 1);
      }
    };
  }

  getModule(moduleId) {
    if (!moduleId) {
      console.error('ID de módulo inválido');
      return null;
    }
    
    // Caso especial para el módulo de calendario
    if (moduleId === 'calendar') {
      // Inicializar solo una vez
      if (!this._modulesInitialized.has('calendar')) {
        const calendarService = this._services.calendar;
        if (calendarService) {
          calendarModule.init(calendarService);
          this._modulesInitialized.add('calendar');
        }
      }
      return calendarModule;
    }
    
    // Intentar obtener el módulo del registro global
    if (typeof window !== 'undefined' && window.__appModules && window.__appModules[moduleId]) {
      return window.__appModules[moduleId];
    }
    
    // Verificar si el módulo está en los servicios proporcionados
    if (this._services && this._services[moduleId]) {
      return this._services[moduleId];
    }
    
    console.warn(`Módulo no encontrado: ${moduleId}`);
    return null;
  }

  async cleanupPluginResources(pluginId) {
    if (!pluginId) {
      return true;
    }
    
    // Asegurarse de que existe la estructura de recursos para este plugin
    if (!this._pluginResources[pluginId]) {
      return true;
    }
    
    try {
      // Cancelar suscripciones a eventos
      this.events.unsubscribeAll(pluginId);
      
      // Eliminar extensiones UI
      this.ui.removeAllExtensions(pluginId);
      
      // Eliminar API registrada
      pluginAPIRegistry.unregisterAPI(pluginId);
      
      // Limpiar recursos de comunicación
      pluginCommunication.clearPluginResources(pluginId);
      
      // No limpiamos los datos de almacenamiento automáticamente
      // para preservar configuración entre sesiones
      
      // Eliminar registro de recursos
      delete this._pluginResources[pluginId];
      
      return true;
    } catch (error) {
      this._handleError(pluginId, 'cleanup', error);
      return false;
    }
  }
}

// Exportar instancia única
const coreAPI = new CoreAPI();
export default coreAPI;