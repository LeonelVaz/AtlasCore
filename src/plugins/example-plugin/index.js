/**
 * Plugin de Ejemplo para Atlas
 * 
 * Este plugin sirve como demostración de la nueva API de plugins
 * y su integración con el sistema de eventos y almacenamiento.
 */

/**
 * Definición del plugin
 */
export default {
  // Metadatos del plugin
  id: 'example-plugin',
  name: 'Plugin de Ejemplo',
  version: '0.1.0',
  description: 'Plugin de demostración para el sistema de plugins de Atlas',
  author: 'Atlas Team',
  
  // Restricciones de compatibilidad
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
  
  // Estado interno
  _subscriptions: [],
  _data: {},
  
  /**
   * Inicialización del plugin
   * @param {Object} core - API core proporcionada por el sistema
   * @returns {boolean} - true si la inicialización fue exitosa
   */
  init: function(core) {
    try {
      console.log('[Example Plugin] Inicializando...');
      
      // Guardar referencia a la API core
      this._core = core;
      
      // Cargar datos almacenados
      this._loadStoredData();
      
      // Suscribirse a eventos del sistema
      this._setupEventListeners();
      
      console.log('[Example Plugin] Inicializado correctamente');
      return true;
    } catch (error) {
      console.error('[Example Plugin] Error durante la inicialización:', error);
      return false;
    }
  },
  
  /**
   * Limpieza del plugin antes de desactivarlo
   * @returns {boolean} - true si la limpieza fue exitosa
   */
  cleanup: function() {
    try {
      console.log('[Example Plugin] Limpiando recursos...');
      
      // Guardar datos si es necesario
      this._saveData();
      
      // Limpiar suscripciones a eventos
      this._cleanupEventListeners();
      
      console.log('[Example Plugin] Limpieza completada');
      return true;
    } catch (error) {
      console.error('[Example Plugin] Error durante la limpieza:', error);
      return false;
    }
  },
  
  /**
   * Carga datos almacenados previamente
   * @private
   */
  _loadStoredData: async function() {
    try {
      const pluginId = this.id;
      
      // Cargar contador de inicializaciones
      const initCount = await this._core.storage.getItem(pluginId, 'initCount', 0);
      const lastInitTime = await this._core.storage.getItem(pluginId, 'lastInitTime', 0);
      
      this._data = {
        initCount: initCount + 1,
        lastInitTime: Date.now(),
        previousInitTime: lastInitTime
      };
      
      // Guardar datos actualizados
      await this._saveData();
      
      console.log(`[Example Plugin] Inicializado ${this._data.initCount} veces. Última vez: ${new Date(this._data.previousInitTime).toLocaleString()}`);
    } catch (error) {
      console.error('[Example Plugin] Error al cargar datos:', error);
    }
  },
  
  /**
   * Guarda datos del plugin
   * @private
   */
  _saveData: async function() {
    try {
      const pluginId = this.id;
      
      // Guardar datos en almacenamiento
      await this._core.storage.setItem(pluginId, 'initCount', this._data.initCount);
      await this._core.storage.setItem(pluginId, 'lastInitTime', this._data.lastInitTime);
      
      console.log('[Example Plugin] Datos guardados correctamente');
    } catch (error) {
      console.error('[Example Plugin] Error al guardar datos:', error);
    }
  },
  
  /**
   * Configura los listeners de eventos
   * @private
   */
  _setupEventListeners: function() {
    const pluginId = this.id;
    
    // Escuchar eventos del calendario
    const calendarSubscription = this._core.events.subscribe(
      pluginId,
      'calendar.eventCreated',
      this._handleCalendarEvent.bind(this)
    );
    
    // Escuchar eventos de otros plugins
    const pluginEventSubscription = this._core.events.subscribe(
      pluginId,
      'plugin.*',
      this._handlePluginEvent.bind(this)
    );
    
    // Escuchar eventos del sistema de plugins
    const pluginSystemSubscription = this._core.events.subscribe(
      pluginId,
      'pluginSystem.pluginActivated',
      this._handlePluginSystemEvent.bind(this)
    );
    
    // Almacenar referencias para limpieza
    this._subscriptions = [
      calendarSubscription,
      pluginEventSubscription,
      pluginSystemSubscription
    ];
    
    console.log('[Example Plugin] Listeners de eventos configurados');
  },
  
  /**
   * Limpia los listeners de eventos
   * @private
   */
  _cleanupEventListeners: function() {
    // Llamar a cada función de cancelación
    this._subscriptions.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    
    // Limpiar lista
    this._subscriptions = [];
    
    console.log('[Example Plugin] Listeners de eventos limpiados');
  },
  
  /**
   * Maneja eventos del calendario
   * @param {Object} data - Datos del evento
   * @private
   */
  _handleCalendarEvent: function(data) {
    console.log('[Example Plugin] Evento del calendario recibido:', data);
    
    // Publicar un evento propio
    this._core.events.publish(
      this.id,
      'examplePlugin.calendarEventDetected',
      {
        timestamp: Date.now(),
        eventData: data
      }
    );
  },
  
  /**
   * Maneja eventos de otros plugins
   * @param {Object} data - Datos del evento
   * @param {string} sourcePlugin - ID del plugin que publicó el evento
   * @private
   */
  _handlePluginEvent: function(data, sourcePlugin) {
    // Ignorar eventos propios
    if (sourcePlugin === this.id) return;
    
    console.log(`[Example Plugin] Evento de plugin ${sourcePlugin} recibido:`, data);
  },
  
  /**
   * Maneja eventos del sistema de plugins
   * @param {Object} data - Datos del evento
   * @private
   */
  _handlePluginSystemEvent: function(data) {
    console.log('[Example Plugin] Evento del sistema de plugins recibido:', data);
  },
  
  /**
   * API pública del plugin
   */
  publicAPI: {
    /**
     * Obtiene estadísticas del plugin
     * @returns {Object} - Estadísticas del plugin
     */
    getStats: function() {
      return {
        id: this.id,
        name: this.name,
        version: this.version,
        initCount: this._data.initCount,
        lastInitTime: this._data.lastInitTime
      };
    },
    
    /**
     * Publica un mensaje de ejemplo
     * @param {string} message - Mensaje a publicar
     */
    publishMessage: function(message) {
      this._core.events.publish(
        this.id,
        'examplePlugin.message',
        {
          timestamp: Date.now(),
          message: message || 'Mensaje de ejemplo'
        }
      );
    }
  }
};