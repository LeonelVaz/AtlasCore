/**
 * API Core para plugins de Atlas
 * 
 * Este módulo define la API que se proporciona a los plugins
 * para que interactúen con la aplicación principal
 */

import eventBus from '../bus/event-bus';
import storageService from '../../services/storage-service';

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
    // Sistema de eventos para comunicación entre plugins
    this.events = {
      /**
       * Suscribirse a un evento
       * @param {string} pluginId - ID del plugin que se suscribe
       * @param {string} eventName - Nombre del evento
       * @param {Function} callback - Función a llamar cuando ocurra el evento
       * @returns {Function} - Función para cancelar suscripción
       */
      subscribe: (pluginId, eventName, callback) => {
        if (!pluginId || !eventName || typeof callback !== 'function') {
          console.error('Argumentos inválidos para subscribe');
          return () => {};
        }
        
        // Registrar recurso del plugin para limpieza automática
        if (!this._pluginResources[pluginId]) {
          this._pluginResources[pluginId] = {};
        }
        
        if (!this._pluginResources[pluginId].eventSubscriptions) {
          this._pluginResources[pluginId].eventSubscriptions = [];
        }
        
        // Crear canal namespaced para eventos de plugins
        const pluginEventName = `plugin.${eventName}`;
        
        // Suscribirse al evento usando el eventBus central
        const unsubscribe = eventBus.subscribe(pluginEventName, callback);
        
        // Almacenar referencia para limpieza
        this._pluginResources[pluginId].eventSubscriptions.push({
          eventName: pluginEventName,
          callback,
          unsubscribe
        });
        
        return unsubscribe;
      },
      
      /**
       * Publicar un evento
       * @param {string} pluginId - ID del plugin que publica
       * @param {string} eventName - Nombre del evento
       * @param {*} data - Datos a pasar a los suscriptores
       */
      publish: (pluginId, eventName, data) => {
        if (!pluginId || !eventName) {
          console.error('Argumentos inválidos para publish');
          return;
        }
        
        // Crear canal namespaced para eventos de plugins
        const pluginEventName = `plugin.${eventName}`;
        
        // Añadir origen del evento a los datos
        const eventData = {
          sourcePlugin: pluginId,
          data
        };
        
        // Publicar mediante el eventBus central
        eventBus.publish(pluginEventName, eventData);
      },
      
      /**
       * Cancelar todas las suscripciones de un plugin
       * @param {string} pluginId - ID del plugin
       * @returns {boolean} - true si se cancelaron correctamente
       */
      unsubscribeAll: (pluginId) => {
        if (!pluginId || !this._pluginResources[pluginId]) {
          return false;
        }
        
        const resources = this._pluginResources[pluginId];
        
        if (resources.eventSubscriptions && resources.eventSubscriptions.length > 0) {
          resources.eventSubscriptions.forEach(subscription => {
            try {
              if (subscription && typeof subscription.unsubscribe === 'function') {
                subscription.unsubscribe();
              }
            } catch (error) {
              console.error(`Error al cancelar suscripción en plugin ${pluginId}:`, error);
            }
          });
          
          resources.eventSubscriptions = [];
        }
        
        return true;
      }
    };
  }

  /**
   * Inicializa el componente de almacenamiento
   * @private
   */
  _initStorage() {
    // Sistema de almacenamiento para plugins
    this.storage = {
      /**
       * Guarda un valor en el almacenamiento
       * @param {string} pluginId - ID del plugin
       * @param {string} key - Clave
       * @param {*} value - Valor a guardar
       * @returns {Promise<boolean>} - true si se guardó correctamente
       */
      setItem: async (pluginId, key, value) => {
        if (!pluginId || !key) {
          console.error('Argumentos inválidos para setItem');
          return false;
        }
        
        try {
          // Crear clave namespaced para el plugin
          const storageKey = `plugin_${pluginId}_${key}`;
          
          // Usar el servicio de almacenamiento
          const result = await storageService.set(storageKey, value);
          
          // Registrar clave de almacenamiento para limpieza
          if (!this._pluginResources[pluginId]) {
            this._pluginResources[pluginId] = {};
          } 
          
          if (!this._pluginResources[pluginId].storageKeys) {
            this._pluginResources[pluginId].storageKeys = [];
          }
          
          if (!this._pluginResources[pluginId].storageKeys.includes(key)) {
            this._pluginResources[pluginId].storageKeys.push(key);
          }
          
          return result;
        } catch (error) {
          this._handleError(pluginId, 'storage', error);
          return false;
        }
      },
      
      /**
       * Recupera un valor del almacenamiento
       * @param {string} pluginId - ID del plugin
       * @param {string} key - Clave
       * @param {*} defaultValue - Valor por defecto si no existe
       * @returns {Promise<*>} - Valor recuperado o defaultValue
       */
      getItem: async (pluginId, key, defaultValue = null) => {
        if (!pluginId || !key) {
          console.error('Argumentos inválidos para getItem');
          return defaultValue;
        }
        
        try {
          // Crear clave namespaced para el plugin
          const storageKey = `plugin_${pluginId}_${key}`;
          
          // Usar el servicio de almacenamiento
          return await storageService.get(storageKey, defaultValue);
        } catch (error) {
          this._handleError(pluginId, 'storage', error);
          return defaultValue;
        }
      },
      
      /**
       * Elimina un valor del almacenamiento
       * @param {string} pluginId - ID del plugin
       * @param {string} key - Clave
       * @returns {Promise<boolean>} - true si se eliminó correctamente
       */
      removeItem: async (pluginId, key) => {
        if (!pluginId || !key) {
          console.error('Argumentos inválidos para removeItem');
          return false;
        }
        
        try {
          // Crear clave namespaced para el plugin
          const storageKey = `plugin_${pluginId}_${key}`;
          
          // Usar el servicio de almacenamiento
          const result = await storageService.remove(storageKey);
          
          // Actualizar registro de claves
          if (this._pluginResources[pluginId] && this._pluginResources[pluginId].storageKeys) {
            const index = this._pluginResources[pluginId].storageKeys.indexOf(key);
            if (index !== -1) {
              this._pluginResources[pluginId].storageKeys.splice(index, 1);
            }
          }
          
          return result;
        } catch (error) {
          this._handleError(pluginId, 'storage', error);
          return false;
        }
      },
      
      /**
       * Elimina todos los datos de almacenamiento de un plugin
       * @param {string} pluginId - ID del plugin
       * @returns {Promise<boolean>} - true si se eliminaron correctamente
       */
      clearPluginData: async (pluginId) => {
        if (!pluginId || !this._pluginResources[pluginId]) {
          return false;
        }
        
        try {
          const resources = this._pluginResources[pluginId];
          
          if (resources.storageKeys && resources.storageKeys.length > 0) {
            const keys = [...resources.storageKeys];
            
            // Eliminar cada clave una por una
            for (const key of keys) {
              await this.storage.removeItem(pluginId, key);
            }
            
            resources.storageKeys = [];
          }
          
          return true;
        } catch (error) {
          this._handleError(pluginId, 'storage', error);
          return false;
        }
      }
    };
  }

  /**
   * Inicializa el componente de UI
   * @private
   */
  _initUI() {
    // Sistema de integración UI para plugins
    this.ui = {
      /**
       * Registra un componente en una zona de la interfaz
       * @param {string} pluginId - ID del plugin
       * @param {string} zoneId - ID de la zona donde registrar
       * @param {Function} Component - Componente React a registrar
       * @returns {string|null} - ID de registro o null si falla
       */
      registerComponent: (pluginId, zoneId, Component) => {
        if (!pluginId || !zoneId || !Component) {
          console.error('Argumentos inválidos para registerComponent');
          return null;
        }
        
        try {
          // Crear ID único para este registro
          const registrationId = `${pluginId}_${zoneId}_${Date.now()}`;
          
          // Registrar componente (placeholder en esta fase)
          console.log(`[CoreAPI] Registrando componente de plugin ${pluginId} en zona: ${zoneId}`);
          
          // Registrar para limpieza automática
          if (!this._pluginResources[pluginId]) {
            this._pluginResources[pluginId] = {};
          }
          
          if (!this._pluginResources[pluginId].uiComponents) {
            this._pluginResources[pluginId].uiComponents = [];
          }
          
          this._pluginResources[pluginId].uiComponents.push({
            registrationId,
            zoneId,
            Component
          });
          
          return registrationId;
        } catch (error) {
          this._handleError(pluginId, 'ui', error);
          return null;
        }
      },
      
      /**
       * Elimina un componente registrado
       * @param {string} pluginId - ID del plugin
       * @param {string} registrationId - ID de registro obtenido al registrar
       * @returns {boolean} - true si se eliminó correctamente
       */
      unregisterComponent: (pluginId, registrationId) => {
        if (!pluginId || !registrationId) {
          console.error('ID de registro inválido');
          return false;
        }
        
        try {
          // Verificar si el plugin tiene componentes registrados
          if (!this._pluginResources[pluginId] || !this._pluginResources[pluginId].uiComponents) {
            return false;
          }
          
          // Encontrar el componente por su ID
          const components = this._pluginResources[pluginId].uiComponents;
          const index = components.findIndex(comp => comp.registrationId === registrationId);
          
          if (index === -1) {
            return false;
          }
          
          // Eliminar registro del componente
          components.splice(index, 1);
          
          console.log(`[CoreAPI] Eliminando componente con ID: ${registrationId}`);
          
          return true;
        } catch (error) {
          this._handleError(pluginId, 'ui', error);
          return false;
        }
      },
      
      /**
       * Elimina todos los componentes UI de un plugin
       * @param {string} pluginId - ID del plugin
       * @returns {boolean} - true si se eliminaron correctamente
       */
      unregisterAllComponents: (pluginId) => {
        if (!pluginId || !this._pluginResources[pluginId]) {
          return false;
        }
        
        try {
          const resources = this._pluginResources[pluginId];
          
          if (resources.uiComponents && resources.uiComponents.length > 0) {
            resources.uiComponents = [];
          }
          
          return true;
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
      
      // Eliminar componentes UI
      this.ui.unregisterAllComponents(pluginId);
      
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