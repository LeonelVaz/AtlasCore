import React, { useState } from 'react';

/**
 * Plugin de Ejemplo para Atlas
 * 
 * Este plugin sirve como demostración de la nueva API de plugins
 * y su integración con el sistema de eventos, almacenamiento, extensiones UI,
 * comunicación entre plugins y el sistema de seguridad.
 */

/**
 * Componente de navegación para la barra lateral
 */
function createNavigationItem() {
  return function NavigationItem(props) {
    const { onNavigate, pluginId } = props;
    
    const handleClick = () => {
      onNavigate(pluginId, 'main'); // Navegar a la página principal del plugin
    };
    
    // Crear elemento usando React.createElement para evitar JSX en archivos .js
    return React.createElement(
      'div', 
      { 
        className: 'sidebar-item',
        onClick: handleClick 
      },
      [
        React.createElement(
          'span', 
          { className: 'sidebar-item-icon', key: 'icon' },
          React.createElement('span', { className: 'material-icons' }, 'extension')
        ),
        React.createElement(
          'span', 
          { className: 'sidebar-item-label', key: 'label' },
          'Demo Plugin'
        )
      ]
    );
  };
}

/**
 * Componente de página principal del plugin
 */
function createMainPage() {
  return function MainPage(props) {
    const [counter, setCounter] = useState(0);
    
    return React.createElement(
      'div', 
      { className: 'plugin-page' },
      [
        React.createElement(
          'div',
          { className: 'plugin-header', key: 'header' },
          React.createElement('h1', { className: 'plugin-title' }, 'Plugin de Ejemplo')
        ),
        React.createElement(
          'div',
          { className: 'plugin-content', key: 'content' },
          [
            React.createElement(
              'div',
              { className: 'plugin-section', key: 'intro' },
              [
                React.createElement('h2', { className: 'plugin-section-title', key: 'intro-title' }, 'Bienvenido'),
                React.createElement('p', { key: 'intro-text' }, 'Este es un ejemplo de una página completa de plugin. Los plugins pueden tener sus propias páginas con funcionalidad completa.')
              ]
            ),
            React.createElement(
              'div',
              { className: 'plugin-section', key: 'counter-section' },
              [
                React.createElement('h2', { className: 'plugin-section-title', key: 'counter-title' }, 'Contador Interactivo'),
                React.createElement('p', { key: 'counter-text' }, 'Este contador demuestra la interactividad de los componentes de React en las páginas de plugins:'),
                React.createElement(
                  'div',
                  { className: 'counter-container', key: 'counter-container', style: { display: 'flex', alignItems: 'center', marginTop: '15px' } },
                  [
                    React.createElement(
                      'button',
                      { 
                        className: 'plugin-button',
                        onClick: () => setCounter(counter - 1),
                        key: 'decrement',
                        style: { width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
                      },
                      '-'
                    ),
                    React.createElement(
                      'span',
                      { 
                        key: 'count',
                        style: { margin: '0 15px', fontSize: '20px', minWidth: '50px', textAlign: 'center' }
                      },
                      counter
                    ),
                    React.createElement(
                      'button',
                      { 
                        className: 'plugin-button',
                        onClick: () => setCounter(counter + 1),
                        key: 'increment',
                        style: { width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
                      },
                      '+'
                    )
                  ]
                )
              ]
            ),
            React.createElement(
              'div',
              { className: 'plugin-section', key: 'benefits' },
              [
                React.createElement('h2', { className: 'plugin-section-title', key: 'benefits-title' }, 'Beneficios'),
                React.createElement(
                  'ul',
                  { key: 'benefits-list' },
                  [
                    React.createElement('li', { key: 'benefit-1' }, 'Páginas completas dedicadas para tus plugins'),
                    React.createElement('li', { key: 'benefit-2' }, 'Navegación directa desde la barra lateral principal'),
                    React.createElement('li', { key: 'benefit-3' }, 'Totalmente integrado con el sistema de plugins')
                  ]
                )
              ]
            )
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
  version: '0.3.5', // Actualizada para compatibilidad con sistema de seguridad
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
  
  // Declaración de permisos que requiere el plugin
  permissions: [
    'storage',    // Permiso para almacenamiento persistente
    'events',     // Permiso para eventos
    'ui',         // Permiso para UI
    'notifications' // Permiso para notificaciones
  ],
  
  // Estado interno
  _subscriptions: [],
  _extensions: [],
  _data: {},
  _channel: null,
  
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
      
      // Registrar API pública
      this._registerPublicAPI();
      
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
    
    // Almacenar referencias para limpieza
    this._subscriptions = [
      calendarSubscription
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
      const NavigationItem = createNavigationItem();
      const MainPage = createMainPage();
      
      // Registrar componente en la navegación principal
      if (zones.MAIN_NAVIGATION) {
        const navExtId = core.ui.registerExtension(
          pluginId,
          zones.MAIN_NAVIGATION,
          NavigationItem,
          {
            order: 100,
            props: {
              title: 'Demo Plugin'
            }
          }
        );
        
        // Guardar referencia para limpieza
        if (navExtId) {
          this._extensions.push(navExtId);
        }
      }
      
      // Registrar página principal en el punto de extensión de páginas
      if (zones.PLUGIN_PAGES) {
        const pageExtId = core.ui.registerExtension(
          pluginId,
          zones.PLUGIN_PAGES,
          MainPage,
          {
            order: 10,
            props: {
              pageId: 'main', // ID de la página para navegación
              title: 'Página Principal'
            }
          }
        );
        
        // Guardar referencia para limpieza
        if (pageExtId) {
          this._extensions.push(pageExtId);
        }
      }
      
      // También registrar en el sidebar del calendario para compatibilidad
      if (zones.CALENDAR_SIDEBAR) {
        const sidebarExtId = core.ui.registerExtension(
          pluginId,
          zones.CALENDAR_SIDEBAR,
          function SidebarWidget() {
            return React.createElement(
              'div',
              { className: 'sidebar-widget' },
              [
                React.createElement('h3', { key: 'title' }, 'Demo Plugin Widget'),
                React.createElement('p', { key: 'desc' }, 'Este widget aparece en el sidebar del calendario.')
              ]
            );
          },
          {
            order: 100
          }
        );
        
        if (sidebarExtId) {
          this._extensions.push(sidebarExtId);
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
   * Registra la API pública del plugin
   * @private
   */
  _registerPublicAPI: function() {
    try {
      const pluginId = this.id;
      
      // Crear métodos de la API
      const apiMethods = {
        // Método simple para probar comunicación
        sayHello: (name) => {
          const message = `Hola ${name || 'mundo'} desde el plugin de ejemplo!`;
          console.log(message);
          return message;
        },
        
        // Método que recupera datos del almacenamiento 
        getStoredData: async () => {
          try {
            const data = await this._core.storage.getItem(pluginId, 'demoData', { default: 'Sin datos' });
            return {
              success: true,
              data,
              timestamp: Date.now()
            };
          } catch (error) {
            console.error('Error al obtener datos almacenados:', error);
            return {
              success: false,
              error: error.message,
              timestamp: Date.now()
            };
          }
        },
        
        // Método que guarda datos en el almacenamiento
        storeData: async (data) => {
          try {
            const result = await this._core.storage.setItem(pluginId, 'demoData', data);
            return {
              success: result,
              timestamp: Date.now()
            };
          } catch (error) {
            console.error('Error al almacenar datos:', error);
            return {
              success: false,
              error: error.message,
              timestamp: Date.now()
            };
          }
        }
      };
      
      // Registrar API pública
      this._core.plugins.registerAPI(pluginId, apiMethods);
      
      console.log('[Example Plugin] API pública registrada');
    } catch (error) {
      console.error('[Example Plugin] Error al registrar API pública:', error);
    }
  },
  
  /**
   * API pública del plugin
   */
  publicAPI: {
    /**
     * Método de demostración que responde un saludo
     * @param {string} name - Nombre para saludar
     * @returns {string} - Mensaje de saludo
     */
    sayHello: function(name) {
      const message = `¡Hola ${name || 'amigo'}! Saludos desde el plugin de ejemplo.`;
      console.log('[Example Plugin] sayHello llamado con:', name);
      return message;
    },
    
    /**
     * Obtiene la hora actual
     * @returns {Object} - Información de hora actual
     */
    getCurrentTime: function() {
      const now = new Date();
      return {
        timestamp: now.getTime(),
        formatted: now.toLocaleTimeString(),
        date: now.toLocaleDateString(),
        hours: now.getHours(),
        minutes: now.getMinutes(),
        seconds: now.getSeconds()
      };
    }
  }
};