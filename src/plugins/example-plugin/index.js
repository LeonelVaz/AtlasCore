import React, { useState } from 'react';

/**
 * Plugin de Ejemplo para Atlas
 * 
 * Este plugin sirve como demostración de la nueva API de plugins
 * y su integración con el sistema de eventos, almacenamiento y extensiones UI.
 */

// Importación separada de React para evitar problemas con JSX en archivos .js
// Los componentes React se definen en archivos separados con extensión .jsx

/**
 * Funciones para crear componentes sin usar JSX directamente
 */
function createSidebarExtension() {
  // Creamos la función que construirá el componente
  return function SidebarExtensionComponent(props) {
    // Ahora usamos React importado, no require
    const { pluginId, extensionId } = props;
    
    // Crear el elemento con React.createElement en lugar de JSX
    return React.createElement(
      'div', 
      { className: "example-sidebar-extension" },
      [
        React.createElement(
          'div', 
          { className: "example-sidebar-header", key: "header" }, 
          "Demo Extension"
        ),
        React.createElement(
          'div', 
          { className: "example-sidebar-content", key: "content" },
          React.createElement(
            'button',
            { 
              className: "example-sidebar-button",
              onClick: () => alert(`Hola desde el plugin de ejemplo (ID: ${extensionId})`),
              key: "button"
            },
            "Click Me"
          )
        )
      ]
    );
  };
}

function createSettingsExtension() {
  // Creamos la función que construirá el componente
  return function SettingsExtensionComponent(props) {
    // Ahora usamos React y useState importados, no require
    const { pluginId, extensionId } = props;
    
    // Usar hooks sin JSX
    const [count, setCount] = useState(0);
    
    // Estilo en línea en lugar de JSX style
    const styles = {
      container: {
        padding: '12px',
        backgroundColor: 'var(--bg-color-secondary)',
        borderRadius: '6px',
        border: '1px solid var(--color-border)'
      },
      title: {
        marginTop: 0,
        marginBottom: '10px',
        color: 'var(--color-atlas-blue)'
      },
      content: {
        marginBottom: '12px'
      },
      counter: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginTop: '10px'
      },
      button: {
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        border: 'none',
        backgroundColor: 'var(--color-atlas-blue)',
        color: 'white',
        fontWeight: 'bold',
        cursor: 'pointer'
      },
      count: {
        fontSize: '18px',
        fontWeight: 'bold'
      }
    };
    
    // Crear el elemento con createElement
    return React.createElement(
      'div',
      { style: styles.container, className: "example-settings-extension" },
      [
        React.createElement('h4', { style: styles.title, key: "title" }, "Configuración de Demo Plugin"),
        React.createElement(
          'div', 
          { style: styles.content, className: "example-settings-content", key: "content" },
          React.createElement('p', { key: "desc" }, "Esta es una demostración de una extensión de configuración.")
        ),
        React.createElement(
          'div',
          { style: styles.counter, className: "example-settings-counter", key: "counter" },
          [
            React.createElement('button', { 
              style: styles.button, 
              onClick: () => setCount(count - 1),
              key: "minus"
            }, "-"),
            React.createElement('span', { 
              style: styles.count,
              key: "value"
            }, count),
            React.createElement('button', { 
              style: styles.button, 
              onClick: () => setCount(count + 1),
              key: "plus"
            }, "+")
          ]
        )
      ]
    );
  };
}

/**
 * Definición del plugin
 */
export default {
  // Metadatos del plugin
  id: 'example-plugin',
  name: 'Plugin de Ejemplo',
  version: '0.2.0',
  description: 'Plugin de demostración para el sistema de plugins de Atlas',
  author: 'Atlas Team',
  
  // Restricciones de compatibilidad
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
  
  // Dependencias (ejemplo de declaración)
  dependencies: [],
  
  // Conflictos (ejemplo de declaración)
  conflicts: [],
  
  // Prioridad de carga (menor = mayor prioridad)
  priority: 100,
  
  // Estado interno
  _subscriptions: [],
  _extensions: [],
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
      
      // Registrar extensiones UI
      this._registerUIExtensions();
      
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
      
      // Limpiar extensiones UI
      this._cleanupUIExtensions();
      
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
   * Registra extensiones UI
   * @private
   */
  _registerUIExtensions: function() {
    try {
      const pluginId = this.id;
      const core = this._core;
      
      // Obtener las zonas de extensión disponibles
      const zones = core.ui.getExtensionZones();
      
      // Crear los componentes usando las funciones factory
      const SidebarExtensionComponent = createSidebarExtension();
      const SettingsExtensionComponent = createSettingsExtension();
      
      // Registrar componente en la barra lateral
      if (zones.CALENDAR_SIDEBAR) {
        const sidebarExtId = core.ui.registerExtension(
          pluginId,
          zones.CALENDAR_SIDEBAR,
          SidebarExtensionComponent,
          {
            order: 100,
            props: {
              title: 'Demo Extension'
            }
          }
        );
        
        // Guardar referencia para limpieza
        if (sidebarExtId) {
          this._extensions.push(sidebarExtId);
        }
      }
      
      // Registrar componente en configuración
      if (zones.SETTINGS_PANEL) {
        const settingsExtId = core.ui.registerExtension(
          pluginId,
          zones.SETTINGS_PANEL,
          SettingsExtensionComponent,
          {
            order: 50, // Prioridad más alta (aparecerá primero)
            props: {
              title: 'Demo Settings'
            }
          }
        );
        
        // Guardar referencia para limpieza
        if (settingsExtId) {
          this._extensions.push(settingsExtId);
        }
      }
      
      console.log(`[Example Plugin] Extensiones UI registradas: ${this._extensions.length}`);
    } catch (error) {
      console.error('[Example Plugin] Error al registrar extensiones UI:', error);
    }
  },
  
  /**
   * Limpia las extensiones UI
   * @private
   */
  _cleanupUIExtensions: function() {
    try {
      // El sistema eliminará automáticamente las extensiones al desactivar el plugin
      // gracias a la integración con el gestor de plugins, pero podríamos hacer limpieza
      // manual si fuera necesario:
      
      /*
      this._extensions.forEach(extensionId => {
        this._core.ui.removeExtension(this.id, extensionId);
      });
      */
      
      // Limpiar lista
      this._extensions = [];
      
      console.log('[Example Plugin] Extensiones UI limpiadas');
    } catch (error) {
      console.error('[Example Plugin] Error al limpiar extensiones UI:', error);
    }
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