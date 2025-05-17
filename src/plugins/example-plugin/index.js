import React, { useState } from 'react';

/**
 * Plugin de Ejemplo para Atlas
 * 
 * Este plugin sirve como demostración de la nueva API de plugins
 * y su integración con el sistema de eventos, almacenamiento, extensiones UI,
 * comunicación entre plugins y el sistema de seguridad.
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
 * Crea componente de seguridad para demostrar permisos
 */
function createSecurityComponent() {
  return function SecurityDemoComponent(props) {
    const { pluginId, extensionId, core } = props;
    const [securityInfo, setSecurityInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Estilos para el componente
    const styles = {
      container: {
        padding: '12px',
        backgroundColor: 'var(--bg-color-secondary)',
        borderRadius: '6px',
        border: '1px solid var(--color-border)',
        marginBottom: '12px'
      },
      title: {
        marginTop: 0,
        marginBottom: '10px',
        color: 'var(--color-atlas-blue)'
      },
      content: {
        marginBottom: '12px'
      },
      permissionButton: {
        backgroundColor: 'var(--color-atlas-blue)',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        padding: '8px 12px',
        marginRight: '8px',
        cursor: 'pointer'
      },
      infoPanel: {
        backgroundColor: 'var(--bg-color-tertiary)',
        borderRadius: '4px',
        padding: '8px',
        marginTop: '12px'
      },
      error: {
        backgroundColor: 'rgba(229, 57, 53, 0.1)',
        color: '#E53935',
        padding: '8px',
        borderRadius: '4px',
        marginTop: '12px'
      },
      loading: {
        fontStyle: 'italic',
        marginTop: '12px'
      }
    };
    
    // Función para solicitar permisos de red
    const requestNetworkPermission = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Intentar solicitar permiso a través del sistema de permisos
        const result = await core.requestPermission('network', 'Necesario para hacer peticiones de API');
        
        setSecurityInfo({
          permissionRequested: 'network',
          result
        });
      } catch (err) {
        setError(`Error al solicitar permiso: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    // Función para solicitar permisos de DOM
    const requestDomPermission = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Intentar solicitar permiso a través del sistema de permisos
        const result = await core.requestPermission('dom', 'Necesario para manipular el DOM');
        
        setSecurityInfo({
          permissionRequested: 'dom',
          result
        });
      } catch (err) {
        setError(`Error al solicitar permiso: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    // Función para simular uso excesivo de recursos
    const simulateResourceOveruse = () => {
      try {
        setLoading(true);
        setError(null);
        
        // Generar uso intensivo de CPU
        const startTime = Date.now();
        let counter = 0;
        
        // Bucle que consumirá CPU durante aproximadamente 1 segundo
        while (Date.now() - startTime < 1000) {
          counter++;
          // Operaciones intensivas
          Math.sqrt(counter * Math.random() * 10000);
        }
        
        setSecurityInfo({
          resourceTest: 'CPU intensive operation',
          counter,
          duration: Date.now() - startTime
        });
      } catch (err) {
        setError(`Error en prueba de recursos: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    // Función para probar el sandbox de seguridad
    const testSecuritySandbox = () => {
      try {
        setLoading(true);
        setError(null);
        
        // Intentar acceder a API potencialmente restringida
        // Esto debería ser bloqueado por el sandbox
        const result = {
          evalTest: 'No ejecutado', // El sistema debería prevenir esto
          documentWrite: 'No ejecutado'
        };
        
        try {
          // Intentar usar eval (normalmente bloqueado)
          // eslint-disable-next-line no-eval
          const evalResult = eval('1 + 1');
          result.evalTest = `Ejecución exitosa: ${evalResult}`;
        } catch (evalError) {
          result.evalTest = `Bloqueado: ${evalError.message}`;
        }
        
        try {
          // Intentar usar document.write
          const originalWrite = document.write;
          result.documentWriteExists = Boolean(originalWrite);
        } catch (docError) {
          result.documentWrite = `Acceso bloqueado: ${docError.message}`;
        }
        
        setSecurityInfo(result);
      } catch (err) {
        setError(`Error en prueba de sandbox: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    // Renderizar el componente
    return React.createElement(
      'div',
      { style: styles.container, className: "example-security-extension" },
      [
        React.createElement('h4', { style: styles.title, key: "title" }, "Demostración de Seguridad"),
        React.createElement(
          'div', 
          { style: styles.content, className: "example-security-content", key: "content" },
          React.createElement('p', { key: "desc" }, "Esta extensión demuestra las funcionalidades del sistema de seguridad.")
        ),
        React.createElement(
          'div',
          { key: "buttons" },
          [
            React.createElement('button', { 
              style: styles.permissionButton, 
              onClick: requestNetworkPermission,
              disabled: loading,
              key: "network"
            }, "Solicitar Permiso de Red"),
            React.createElement('button', { 
              style: styles.permissionButton, 
              onClick: requestDomPermission,
              disabled: loading,
              key: "dom"
            }, "Solicitar Permiso de DOM"),
            React.createElement('button', { 
              style: styles.permissionButton, 
              onClick: simulateResourceOveruse,
              disabled: loading,
              key: "resource"
            }, "Simular Uso de Recursos"),
            React.createElement('button', { 
              style: styles.permissionButton, 
              onClick: testSecuritySandbox,
              disabled: loading,
              key: "sandbox"
            }, "Probar Sandbox")
          ]
        ),
        loading && React.createElement('div', { style: styles.loading, key: "loading" }, "Procesando..."),
        error && React.createElement('div', { style: styles.error, key: "error" }, error),
        securityInfo && React.createElement(
          'div', 
          { style: styles.infoPanel, key: "info" },
          Object.entries(securityInfo).map(([key, value], index) => 
            React.createElement('div', { key: index }, `${key}: ${JSON.stringify(value)}`)
          )
        )
      ]
    );
  };
}

// Crear un método de plugin para demo de comunicación entre plugins
function createPluginMethodDemo(core, pluginId) {
  const methods = {
    // Método simple para probar comunicación
    sayHello: (name) => {
      const message = `Hola ${name || 'mundo'} desde el plugin de ejemplo!`;
      console.log(message);
      return message;
    },
    
    // Método que recupera datos del almacenamiento 
    getStoredData: async () => {
      try {
        const data = await core.storage.getItem(pluginId, 'demoData', { default: 'Sin datos' });
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
        const result = await core.storage.setItem(pluginId, 'demoData', data);
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
    },
    
    // Método que obtiene la lista de plugins activos
    getActivePlugins: () => {
      return core.plugins.getActivePlugins();
    },
    
    // Método que publica un evento a través del sistema de eventos
    broadcastMessage: (message) => {
      core.events.publish(pluginId, 'examplePlugin.message', {
        message,
        sender: pluginId,
        timestamp: Date.now()
      });
      
      return {
        success: true,
        message: `Mensaje "${message}" publicado correctamente`
      };
    },
    
    // Método para obtener estadísticas de seguridad
    getSecurityStats: () => {
      try {
        // Intentar acceder a estadísticas si se tiene permiso
        if (core.hasPermission('security')) {
          return {
            timestamp: Date.now(),
            message: 'Estadísticas de seguridad obtenidas correctamente',
            // Ejemplo de datos que podría obtener
            stats: {
              activeChecks: 5,
              threatDetections: 0,
              permissionRequests: 2
            }
          };
        } else {
          return {
            timestamp: Date.now(),
            message: 'No se tiene permiso para acceder a estadísticas de seguridad',
            stats: null
          };
        }
      } catch (error) {
        console.error('Error al obtener estadísticas de seguridad:', error);
        return {
          timestamp: Date.now(),
          message: `Error: ${error.message}`,
          stats: null
        };
      }
    }
  };
  
  return methods;
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
    // Permisos adicionales que se solicitarán en runtime
    // 'network',  // Se solicitará por la demostración
    // 'dom'       // Se solicitará por la demostración
  ],
  
  // Estado interno
  _subscriptions: [],
  _extensions: [],
  _data: {},
  _channel: null,
  _securityCheckInterval: null,
  _resourceTestInterval: null,
  
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
      
      // Crear canal de comunicación
      this._createCommunicationChannel();
      
      // Configurar chequeos periódicos de seguridad (para demo)
      this._setupSecurityChecks();
      
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
      
      // Cerrar canal de comunicación
      if (this._channel) {
        this._channel.close();
        this._channel = null;
      }
      
      // Limpiar intervalos de prueba
      this._cleanupIntervals();
      
      console.log('[Example Plugin] Limpieza completada');
      return true;
    } catch (error) {
      console.error('[Example Plugin] Error durante la limpieza:', error);
      return false;
    }
  },
  
  /**
   * Configura chequeos periódicos de seguridad para demostración
   * @private
   */
  _setupSecurityChecks: function() {
    // Este es un intervalo para demostración que realiza operaciones
    // que podrían ser detectadas por el sistema de seguridad
    if (this._securityCheckInterval) {
      clearInterval(this._securityCheckInterval);
    }
    
    // Intervalo cada 5 minutos
    this._securityCheckInterval = setInterval(() => {
      // Realizar alguna operación que podría ser monitoreada
      // por ejemplo, uso de CPU o almacenamiento
      this._performSecurityDemoOperation();
    }, 5 * 60 * 1000); // 5 minutos
    
    // Intervalo para test de recursos
    if (this._resourceTestInterval) {
      clearInterval(this._resourceTestInterval);
    }
    
    // En modo desarrollo, hacer test más frecuentes con operaciones leves
    // que no deberían disparar alarmas
    this._resourceTestInterval = setInterval(() => {
      this._performLightResourceOperation();
    }, 2 * 60 * 1000); // 2 minutos
  },
  
  /**
   * Limpia los intervalos de prueba
   * @private
   */
  _cleanupIntervals: function() {
    if (this._securityCheckInterval) {
      clearInterval(this._securityCheckInterval);
      this._securityCheckInterval = null;
    }
    
    if (this._resourceTestInterval) {
      clearInterval(this._resourceTestInterval);
      this._resourceTestInterval = null;
    }
  },
  
  /**
   * Realiza una operación de demostración para el sistema de seguridad
   * @private
   */
  _performSecurityDemoOperation: function() {
    try {
      console.log('[Example Plugin] Realizando operación de demo de seguridad');
      
      // Simular alguna operación intensiva
      const data = [];
      for (let i = 0; i < 1000; i++) {
        data.push({
          id: i,
          value: Math.random() * 1000,
          text: `Item ${i}`.repeat(10)
        });
      }
      
      // Intento de acceso a localStorage (debería ser interceptado)
      try {
        localStorage.getItem('test-key');
      } catch (e) {
        // Es esperado que esto falle en un sandbox
      }
      
      // Simular algún acceso a red
      if (this._core.hasPermission('network')) {
        // Si tiene permiso, intentar una petición
        // Esto sería detectado y controlado por el sistema de seguridad
        fetch('https://jsonplaceholder.typicode.com/todos/1')
          .then(response => response.json())
          .then(json => console.log('[Example Plugin] Fetch demo response:', json))
          .catch(error => console.error('[Example Plugin] Fetch demo error:', error));
      }
      
      // Almacenar algo en storage (permitido si tiene permiso)
      if (this._core.hasPermission('storage')) {
        this._core.storage.setItem(this.id, 'securityDemoData', {
          timestamp: Date.now(),
          operation: 'securityDemo',
          dataSize: data.length
        });
      }
    } catch (error) {
      console.error('[Example Plugin] Error en operación de demo de seguridad:', error);
    }
  },
  
  /**
   * Realiza una operación ligera de recursos que no debería disparar alarmas
   * @private
   */
  _performLightResourceOperation: function() {
    try {
      console.log('[Example Plugin] Realizando operación ligera de recursos');
      
      // Operación simple que consume pocos recursos
      const array = new Array(100).fill(0).map((_, i) => i);
      const sum = array.reduce((a, b) => a + b, 0);
      
      // Guardar resultado en datos
      this._data.lastLightOperation = {
        timestamp: Date.now(),
        result: sum
      };
    } catch (error) {
      console.error('[Example Plugin] Error en operación ligera:', error);
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
    
    // Escuchar eventos de seguridad
    const securityEventSubscription = this._core.events.subscribe(
      pluginId,
      'pluginSystem.securityEvent',
      this._handleSecurityEvent.bind(this)
    );
    
    // Almacenar referencias para limpieza
    this._subscriptions = [
      calendarSubscription,
      pluginEventSubscription,
      pluginSystemSubscription,
      securityEventSubscription
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
      const SecurityDemoComponent = createSecurityComponent();
      
      // Registrar componente en la barra lateral
      if (zones.CALENDAR_SIDEBAR) {
        const sidebarExtId = core.ui.registerExtension(
          pluginId,
          zones.CALENDAR_SIDEBAR,
          SidebarExtensionComponent,
          {
            order: 100,
            props: {
              title: 'Demo Extension',
              core: this._core
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
              title: 'Demo Settings',
              core: this._core
            }
          }
        );
        
        // Guardar referencia para limpieza
        if (settingsExtId) {
          this._extensions.push(settingsExtId);
        }
      }
      
      // Registrar componente en panel de seguridad si existe
      if (zones.SECURITY_PANEL) {
        const securityExtId = core.ui.registerExtension(
          pluginId,
          zones.SECURITY_PANEL,
          SecurityDemoComponent,
          {
            order: 10, // Alta prioridad para aparecer primero
            props: {
              title: 'Security Demo',
              core: this._core
            }
          }
        );
        
        // Guardar referencia para limpieza
        if (securityExtId) {
          this._extensions.push(securityExtId);
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
    
    // Si se activa un nuevo plugin, intentar comunicarse con él
    if (data && data.pluginId && data.pluginId !== this.id) {
      setTimeout(() => {
        this._tryPluginCommunication(data.pluginId);
      }, 1000); // Esperar un segundo para asegurar que el plugin está completamente inicializado
    }
  },
  
  /**
   * Maneja eventos de seguridad
   * @param {Object} data - Datos del evento
   * @private
   */
  _handleSecurityEvent: function(data) {
    console.log('[Example Plugin] Evento de seguridad recibido:', data);
    
    // Si el evento es sobre este plugin, registrarlo
    if (data && data.pluginId === this.id) {
      this._data.lastSecurityEvent = {
        timestamp: Date.now(),
        eventData: data
      };
      
      // Guardar para análisis
      this._saveData();
    }
  },
  
  /**
   * Registra la API pública del plugin
   * @private
   */
  _registerPublicAPI: function() {
    try {
      const pluginId = this.id;
      
      // Crear métodos de la API
      const apiMethods = createPluginMethodDemo(this._core, pluginId);
      
      // Registrar API pública
      this._core.plugins.registerAPI(pluginId, apiMethods);
      
      console.log('[Example Plugin] API pública registrada');
    } catch (error) {
      console.error('[Example Plugin] Error al registrar API pública:', error);
    }
  },
  
  /**
   * Crea un canal de comunicación para el plugin
   * @private
   */
  _createCommunicationChannel: function() {
    try {
      const pluginId = this.id;
      
      // Crear canal con opciones
      this._channel = this._core.plugins.createChannel(
        pluginId,
        'example-channel',
        {
          maxMessages: 50,
          sendHistoryOnSubscribe: true,
          sendFullHistoryOnSubscribe: false,
          allowAnyPublisher: true
        }
      );
      
      if (this._channel) {
        // Publicar un mensaje inicial
        this._channel.publish({
          type: 'welcome',
          message: 'Canal de ejemplo iniciado',
          timestamp: Date.now()
        });
        
        // Suscribirse a mensajes (para log)
        const unsubscribe = this._channel.subscribe((message) => {
          console.log('[Example Plugin] Mensaje en canal recibido:', message);
        });
        
        // Agregar a las suscripciones para limpieza
        this._subscriptions.push(unsubscribe);
        
        console.log('[Example Plugin] Canal de comunicación creado');
      }
    } catch (error) {
      console.error('[Example Plugin] Error al crear canal de comunicación:', error);
    }
  },
  
  /**
   * Intenta comunicarse con otro plugin
   * @param {string} targetPluginId - ID del plugin objetivo
   * @private
   */
  _tryPluginCommunication: function(targetPluginId) {
    try {
      // Verificar si el plugin está activo
      if (!this._core.plugins.isPluginActive(targetPluginId)) {
        console.log(`[Example Plugin] El plugin ${targetPluginId} no está activo`);
        return;
      }
      
      // Intentar obtener la API del plugin
      const targetAPI = this._core.plugins.getPluginAPI(this.id, targetPluginId);
      
      if (!targetAPI) {
        console.log(`[Example Plugin] El plugin ${targetPluginId} no expone una API pública`);
        return;
      }
      
      // Verificar si tiene el método sayHello
      if (typeof targetAPI.sayHello === 'function') {
        targetAPI.sayHello(`Plugin ${this.id}`)
          .then(response => {
            console.log(`[Example Plugin] Respuesta de ${targetPluginId}:`, response);
          })
          .catch(error => {
            console.error(`[Example Plugin] Error al llamar a sayHello de ${targetPluginId}:`, error);
          });
      } else {
        console.log(`[Example Plugin] El plugin ${targetPluginId} no tiene método sayHello`);
      }
    } catch (error) {
      console.error(`[Example Plugin] Error al comunicarse con plugin ${targetPluginId}:`, error);
    }
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
    },
    
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
    },
    
    /**
     * Publica un mensaje en el canal de comunicación
     * @param {string} message - Mensaje a publicar
     * @returns {boolean} - true si se publicó correctamente
     */
    publishToChannel: function(message) {
      if (!this._channel) {
        return false;
      }
      
      return this._channel.publish({
        type: 'api_message',
        content: message,
        timestamp: Date.now()
      });
    },
    
    /**
     * Obtiene información del canal de comunicación
     * @returns {Object} - Información del canal
     */
    getChannelInfo: function() {
      if (!this._channel) {
        return { exists: false };
      }
      
      return {
        exists: true,
        info: this._channel.getInfo(),
        historyCount: this._channel.getHistory().length
      };
    },
    
    /**
     * Obtiene el último evento de seguridad relacionado con este plugin
     * @returns {Object|null} - Información del evento o null si no hay
     */
    getLastSecurityEvent: function() {
      if (!this._data.lastSecurityEvent) {
        return null;
      }
      
      return {
        timestamp: this._data.lastSecurityEvent.timestamp,
        timeAgo: Date.now() - this._data.lastSecurityEvent.timestamp,
        event: this._data.lastSecurityEvent.eventData
      };
    },
    
    /**
     * Simular una actividad que podría ser detectada por el sistema de seguridad
     * @returns {Object} - Resultado de la simulación
     */
    simulateSecurityActivity: function() {
      try {
        // Ejecutar operación demo
        this._performSecurityDemoOperation();
        
        return {
          success: true,
          timestamp: Date.now(),
          message: 'Operación de demostración ejecutada correctamente'
        };
      } catch (error) {
        return {
          success: false,
          timestamp: Date.now(),
          error: error.message
        };
      }
    }
  }
};