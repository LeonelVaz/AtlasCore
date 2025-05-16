/**
 * API Core para plugins de Atlas
 * 
 * Este módulo define la API que se proporciona a los plugins
 * para que interactúen con la aplicación principal
 */

/**
 * Clase que implementa la API core para plugins
 */
class CoreAPI {
  constructor() {
    // Versión de la API
    this.version = '0.3.0';
    
    // Referencias a servicios internos
    this._services = {};
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
    
    console.log('API Core inicializada');
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
       * @param {string} eventName - Nombre del evento
       * @param {Function} callback - Función a llamar cuando ocurra el evento
       * @returns {Function} - Función para cancelar suscripción
       */
      subscribe: (eventName, callback) => {
        if (!eventName || typeof callback !== 'function') {
          console.error('Argumentos inválidos para subscribe');
          return () => {};
        }
        
        // En implementación real: integrar con el eventBus
        console.log(`[CoreAPI] Subscribe a evento: ${eventName}`);
        
        // Devolver función para cancelar suscripción (dummy en fase 1)
        return () => {
          console.log(`[CoreAPI] Unsubscribe de evento: ${eventName}`);
        };
      },
      
      /**
       * Publicar un evento
       * @param {string} eventName - Nombre del evento
       * @param {*} data - Datos a pasar a los suscriptores
       */
      publish: (eventName, data) => {
        if (!eventName) {
          console.error('Nombre de evento inválido');
          return;
        }
        
        // En implementación real: integrar con el eventBus
        console.log(`[CoreAPI] Publish evento: ${eventName}`, data);
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
       * @returns {boolean} - true si se guardó correctamente
       */
      setItem: (pluginId, key, value) => {
        if (!pluginId || !key) {
          console.error('Argumentos inválidos para setItem');
          return false;
        }
        
        // En implementación real: integrar con storageService
        const storageKey = `plugin_${pluginId}_${key}`;
        console.log(`[CoreAPI] Guardando en storage: ${storageKey}`, value);
        
        return true;
      },
      
      /**
       * Recupera un valor del almacenamiento
       * @param {string} pluginId - ID del plugin
       * @param {string} key - Clave
       * @param {*} defaultValue - Valor por defecto si no existe
       * @returns {*} - Valor recuperado o defaultValue
       */
      getItem: (pluginId, key, defaultValue = null) => {
        if (!pluginId || !key) {
          console.error('Argumentos inválidos para getItem');
          return defaultValue;
        }
        
        // En implementación real: integrar con storageService
        const storageKey = `plugin_${pluginId}_${key}`;
        console.log(`[CoreAPI] Recuperando de storage: ${storageKey}`);
        
        return defaultValue;
      },
      
      /**
       * Elimina un valor del almacenamiento
       * @param {string} pluginId - ID del plugin
       * @param {string} key - Clave
       * @returns {boolean} - true si se eliminó correctamente
       */
      removeItem: (pluginId, key) => {
        if (!pluginId || !key) {
          console.error('Argumentos inválidos para removeItem');
          return false;
        }
        
        // En implementación real: integrar con storageService
        const storageKey = `plugin_${pluginId}_${key}`;
        console.log(`[CoreAPI] Eliminando de storage: ${storageKey}`);
        
        return true;
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
       * @param {string} zoneId - ID de la zona donde registrar
       * @param {Function} Component - Componente React a registrar
       * @returns {string|null} - ID de registro o null si falla
       */
      registerComponent: (zoneId, Component) => {
        if (!zoneId || !Component) {
          console.error('Argumentos inválidos para registerComponent');
          return null;
        }
        
        // En implementación real: integrar con sistema de UI
        console.log(`[CoreAPI] Registrando componente en zona: ${zoneId}`);
        
        // Devolver ID único para este registro (dummy en fase 1)
        return `reg_${Date.now()}`;
      },
      
      /**
       * Elimina un componente registrado
       * @param {string} registrationId - ID de registro obtenido al registrar
       * @returns {boolean} - true si se eliminó correctamente
       */
      unregisterComponent: (registrationId) => {
        if (!registrationId) {
          console.error('ID de registro inválido');
          return false;
        }
        
        // En implementación real: integrar con sistema de UI
        console.log(`[CoreAPI] Eliminando componente con ID: ${registrationId}`);
        
        return true;
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
    
    // En implementación real: integrar con getModule del registry
    console.log(`[CoreAPI] Solicitando módulo: ${moduleId}`);
    
    // Devolver un objeto dummy en fase 1
    return {
      id: moduleId,
      name: `Módulo ${moduleId}`
    };
  }
}

// Exportar instancia única
const coreAPI = new CoreAPI();
export default coreAPI;