/**
 * API Core para plugins de Atlas
 * 
 * Este módulo define la API que se proporciona a los plugins
 * para que interactúen con la aplicación principal
 */

import eventBus from '../bus/event-bus';
import storageService from '../../services/storage-service';
import pluginEvents from './plugin-events';
import pluginStorage from './plugin-storage';
import uiExtensionManager from './ui-extension-manager';
// Importar las constantes
import { PLUGIN_CONSTANTS } from '../config/constants';

/**
 * Clase que implementa la API core para plugins
 */
class CoreAPI {
  constructor() {
    // Versión de la API
    this.version = '0.3.0';
    
    // Referencias a servicios internos
    this._services = {};
    
    // Registro de recursos de plugins para limpieza
    this._pluginResources = {};
    
    // Error handlers personalizados
    this._errorHandlers = [];
  }

  /**
   * Inicializa la API core con los servicios necesarios
   * @param {Object} services - Servicios internos que se necesitan
   */
  init(services = {}) {
    // Almacenar referencias a servicios que puedan necesitar los plugins
    this._services = services;
    
    // Inicializar subcomponentes básicos de la API
    this._initEvents();
    this._initStorage();
    this._initUI();
    this._initErrorHandling();
    
    console.log('API Core inicializada (v' + this.version + ')');
  }

  /**
   * Inicializa el componente de eventos
   * @private
   */
  _initEvents() {
    // Usar el módulo especializado para eventos de plugins
    this.events = {
      /**
       * Suscribirse a un evento
       * @param {string} pluginId - ID del plugin que se suscribe
       * @param {string} eventName - Nombre del evento
       * @param {Function} callback - Función a llamar cuando ocurra el evento
       * @returns {Function} - Función para cancelar suscripción
       */
      subscribe: (pluginId, eventName, callback) => {
        return pluginEvents.subscribe(pluginId, eventName, callback);
      },
      
      /**
       * Publicar un evento
       * @param {string} pluginId - ID del plugin que publica
       * @param {string} eventName - Nombre del evento
       * @param {*} data - Datos a pasar a los suscriptores
       */
      publish: (pluginId, eventName, data) => {
        return pluginEvents.publish(pluginId, eventName, data);
      },
      
      /**
       * Cancelar todas las suscripciones de un plugin
       * @param {string} pluginId - ID del plugin
       * @returns {boolean} - true si se cancelaron correctamente
       */
      unsubscribeAll: (pluginId) => {
        return pluginEvents.unsubscribeAll(pluginId);
      }
    };
  }

  /**
   * Inicializa el componente de almacenamiento
   * @private
   */
  _initStorage() {
    // Usar el módulo especializado para almacenamiento de plugins
    this.storage = {
      /**
       * Guarda un valor en el almacenamiento
       * @param {string} pluginId - ID del plugin
       * @param {string} key - Clave
       * @param {*} value - Valor a guardar
       * @returns {Promise<boolean>} - true si se guardó correctamente
       */
      setItem: async (pluginId, key, value) => {
        return pluginStorage.setItem(pluginId, key, value);
      },
      
      /**
       * Recupera un valor del almacenamiento
       * @param {string} pluginId - ID del plugin
       * @param {string} key - Clave
       * @param {*} defaultValue - Valor por defecto si no existe
       * @returns {Promise<*>} - Valor recuperado o defaultValue
       */
      getItem: async (pluginId, key, defaultValue = null) => {
        return pluginStorage.getItem(pluginId, key, defaultValue);
      },
      
      /**
       * Elimina un valor del almacenamiento
       * @param {string} pluginId - ID del plugin
       * @param {string} key - Clave
       * @returns {Promise<boolean>} - true si se eliminó correctamente
       */
      removeItem: async (pluginId, key) => {
        return pluginStorage.removeItem(pluginId, key);
      },
      
      /**
       * Elimina todos los datos de almacenamiento de un plugin
       * @param {string} pluginId - ID del plugin
       * @returns {Promise<boolean>} - true si se eliminaron correctamente
       */
      clearPluginData: async (pluginId) => {
        return pluginStorage.clearPluginData(pluginId);
      }
    };
  }

  /**
   * Inicializa el componente de UI
   * @private
   */
  _initUI() {
    // Sistema de integración UI para plugins - Mejorado con Extensiones
    this.ui = {
      /**
       * Registra un componente en un punto de extensión
       * @param {string} pluginId - ID del plugin
       * @param {string} zoneId - ID de la zona donde registrar
       * @param {Object|Function} component - Componente React a registrar
       * @param {Object} [options] - Opciones adicionales
       * @param {Object} [options.props] - Props adicionales para el componente
       * @param {number} [options.order] - Orden de renderizado (menor = primero)
       * @returns {string|null} - ID de registro o null si falla
       */
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
      
      /**
       * Elimina una extensión registrada
       * @param {string} pluginId - ID del plugin
       * @param {string} extensionId - ID de la extensión
       * @returns {boolean} - true si se eliminó correctamente
       */
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
      
      /**
       * Obtiene información sobre las zonas de extensión disponibles
       * @returns {Object} - Mapa de zonas de extensión
       */
      getExtensionZones: () => {
        try {
          return { ...PLUGIN_CONSTANTS.UI_EXTENSION_ZONES };
        } catch (error) {
          console.error('Error al obtener zonas de extensión:', error);
          return {};
        }
      },
      
      /**
       * Elimina todas las extensiones de un plugin
       * @param {string} pluginId - ID del plugin
       * @returns {boolean} - true si se eliminaron correctamente
       */
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
      }
    };
  }

  /**
   * Inicializa el sistema de manejo de errores
   * @private
   */
  _initErrorHandling() {
    // Registrar handler de errores por defecto
    this._errorHandlers.push((pluginId, context, error) => {
      console.error(`Error en plugin [${pluginId}] (${context}):`, error);
    });
  }

  /**
   * Maneja un error de plugin
   * @param {string} pluginId - ID del plugin que generó el error
   * @param {string} context - Contexto del error (storage, events, ui, etc.)
   * @param {Error} error - Objeto de error
   * @private
   */
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

  /**
   * Registra un handler personalizado para errores de plugins
   * @param {Function} handler - Función que maneja errores
   * @returns {Function} - Función para cancelar el registro
   */
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

  /**
   * Obtiene una referencia a un módulo del sistema
   * @param {string} moduleId - ID del módulo
   * @returns {Object|null} - Referencia al módulo o null si no existe
   */
  getModule(moduleId) {
    if (!moduleId) {
      console.error('ID de módulo inválido');
      return null;
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

  /**
   * Limpia todos los recursos asociados a un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {Promise<boolean>} - true si se limpiaron correctamente
   */
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