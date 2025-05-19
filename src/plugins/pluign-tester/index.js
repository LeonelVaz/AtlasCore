import React from 'react';

// Plugin Tester para Atlas
// Este plugin sirve como demostración y prueba de todas las funcionalidades
// disponibles en el sistema de plugins de Atlas.

export default {
  // ===== Metadatos del plugin =====
  id: 'atlas-plugin-tester',
  name: 'Plugin Tester',
  version: '1.0.0',
  description: 'Plugin de prueba que utiliza todas las funcionalidades disponibles en Atlas',
  author: 'Desarrollador Atlas',
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
  priority: 50,
  core: false,
  
  // ===== Dependencias y conflictos =====
  dependencies: [],
  conflicts: [],
  
  // ===== Permisos requeridos =====
  permissions: [
    'storage',      // Para pruebas de almacenamiento persistente
    'events',       // Para el sistema de eventos
    'ui',           // Para extensiones de la interfaz
    'network',      // Para pruebas de red
    'notifications', // Para pruebas de notificaciones
    'communication'  // Para comunicación entre plugins
  ],
  
  // ===== Variables internas =====
  _core: null,
  _data: {
    contador: 0,
    configuracion: {
      colorTema: '#3498db',
      mostrarNotificaciones: true,
      intervaloActualizacion: 30
    },
    registroEventos: []
  },
  _timerId: null,
  _subscriptions: [],
  _extensionIds: {},
  
  // ===== API pública =====
  publicAPI: null, // Inicializaremos esto en el método init para mantener el contexto correcto
  
  // Método para inicializar la API pública con el contexto adecuado
  _initPublicAPI: function() {
    const self = this; // Capturamos 'this' en una variable
    
    this.publicAPI = {
      getEstadisticas: function() {
        return {
          contador: self._data.contador,
          eventos: self._data.registroEventos.length,
          ultimaActualizacion: new Date()
        };
      },
      
      incrementarContador: function(incremento = 1) {
        self._data.contador += incremento;
        self._saveData();
        return self._data.contador;
      },
      
      getConfiguracion: function() {
        return { ...self._data.configuracion };
      }
    };
    
    return this.publicAPI;
  },
  
  // ===== Método de inicialización =====
  init: function(core) {
    try {
      console.log('[Plugin Tester] Iniciando inicialización...');
      this._core = core;
      
      // Cargar datos almacenados
      this._loadData();
      
      // Incrementar contador de inicializaciones
      this._data.contador++;
      this._saveData();
      
      // Inicializar y registrar API pública
      this._initPublicAPI();
      core.plugins.registerAPI(this.id, this.publicAPI);
      
      // Configurar escuchadores de eventos
      this._setupEventListeners();
      
      // Registrar extensiones UI
      this._registerUIExtensions();
      
      // Configurar temporizador periódico
      this._configurarActualizacionPeriodica();
      
      console.log('[Plugin Tester] Inicialización completada con éxito.');
      return true;
    } catch (error) {
      console.error('[Plugin Tester] Error durante la inicialización:', error);
      return false;
    }
  },
  
  // ===== Método de limpieza =====
  cleanup: function() {
    try {
      console.log('[Plugin Tester] Iniciando limpieza...');
      
      // Guardar datos
      this._saveData();
      
      // Detener temporizador
      if (this._timerId) {
        clearInterval(this._timerId);
        this._timerId = null;
      }
      
      // Cancelar suscripciones a eventos
      this._unsubscribeFromEvents();
      
      // Eliminar extensiones UI (el core lo hace automáticamente, pero
      // es buena práctica tener esto documentado)
      // core.ui.removeAllExtensions(this.id);
      
      console.log('[Plugin Tester] Limpieza completada con éxito.');
      return true;
    } catch (error) {
      console.error('[Plugin Tester] Error durante la limpieza:', error);
      return false;
    }
  },
  
  // ===== MÉTODOS PRIVADOS =====
  
  // === Manejo de datos ===
  _loadData: async function() {
    try {
      console.log('[Plugin Tester] Cargando datos...');
      const savedData = await this._core.storage.getItem(
        this.id,
        'plugin-data',
        null
      );
      
      if (savedData) {
        this._data = { ...this._data, ...savedData };
        console.log('[Plugin Tester] Datos cargados:', this._data);
      } else {
        console.log('[Plugin Tester] No se encontraron datos guardados. Usando valores predeterminados.');
      }
    } catch (error) {
      console.error('[Plugin Tester] Error al cargar datos:', error);
    }
  },
  
  _saveData: async function() {
    try {
      console.log('[Plugin Tester] Guardando datos...');
      await this._core.storage.setItem(
        this.id,
        'plugin-data',
        this._data
      );
      console.log('[Plugin Tester] Datos guardados con éxito.');
    } catch (error) {
      console.error('[Plugin Tester] Error al guardar datos:', error);
    }
  },
  
  // === Sistema de eventos ===
  _setupEventListeners: function() {
    console.log('[Plugin Tester] Configurando escuchadores de eventos...');
    
    // Eventos del calendario
    const eventCreatedSub = this._core.events.subscribe(
      this.id,
      'calendar.eventCreated',
      this._handleCalendarEvent.bind(this, 'created')
    );
    
    const eventUpdatedSub = this._core.events.subscribe(
      this.id,
      'calendar.eventUpdated',
      this._handleCalendarEvent.bind(this, 'updated')
    );
    
    const eventDeletedSub = this._core.events.subscribe(
      this.id,
      'calendar.eventDeleted',
      this._handleCalendarEvent.bind(this, 'deleted')
    );
    
    // Eventos de la aplicación
    const appThemeChangedSub = this._core.events.subscribe(
      this.id,
      'app.themeChanged',
      this._handleAppEvent.bind(this, 'themeChanged')
    );
    
    const appInitializedSub = this._core.events.subscribe(
      this.id,
      'app.initialized',
      this._handleAppEvent.bind(this, 'initialized')
    );
    
    // Añadir suscripciones a la lista para limpiarlas luego
    this._subscriptions.push(
      eventCreatedSub,
      eventUpdatedSub,
      eventDeletedSub,
      appThemeChangedSub,
      appInitializedSub
    );
    
    // Publicar un evento propio para pruebas
    this._core.events.publish(
      this.id,
      'pluginTester.initialized',
      { timestamp: Date.now() }
    );
    
    console.log('[Plugin Tester] Escuchadores de eventos configurados.');
  },
  
  _unsubscribeFromEvents: function() {
    console.log('[Plugin Tester] Cancelando suscripciones a eventos...');
    
    // Cancelar todas las suscripciones individualmente
    this._subscriptions.forEach(unsub => {
      if (typeof unsub === 'function') {
        unsub();
      }
    });
    
    // O usar el método del core para cancelar todas
    this._core.events.unsubscribeAll(this.id);
    
    this._subscriptions = [];
    console.log('[Plugin Tester] Suscripciones a eventos canceladas.');
  },
  
  _handleCalendarEvent: function(tipo, datos) {
    console.log(`[Plugin Tester] Evento de calendario ${tipo} recibido:`, datos);
    
    // Registrar evento
    this._data.registroEventos.push({
      tipo: `calendar.event${tipo[0].toUpperCase() + tipo.slice(1)}`,
      timestamp: Date.now(),
      datos: datos
    });
    
    // Limitar el registro a los últimos 100 eventos
    if (this._data.registroEventos.length > 100) {
      this._data.registroEventos = this._data.registroEventos.slice(-100);
    }
    
    // Guardar datos
    this._saveData();
  },
  
  _handleAppEvent: function(tipo, datos) {
    console.log(`[Plugin Tester] Evento de aplicación ${tipo} recibido:`, datos);
    
    // Registrar evento
    this._data.registroEventos.push({
      tipo: `app.${tipo}`,
      timestamp: Date.now(),
      datos: datos
    });
    
    // Limitar el registro a los últimos 100 eventos
    if (this._data.registroEventos.length > 100) {
      this._data.registroEventos = this._data.registroEventos.slice(-100);
    }
    
    // Guardar datos
    this._saveData();
  },
  
  // === Temporizador periódico ===
  _configurarActualizacionPeriodica: function() {
    console.log('[Plugin Tester] Configurando actualización periódica...');
    
    // Convertir minutos a milisegundos
    const intervalo = this._data.configuracion.intervaloActualizacion * 1000;
    
    // Configurar temporizador
    this._timerId = setInterval(() => {
      console.log('[Plugin Tester] Ejecutando actualización periódica...');
      
      // Publicar evento de actualización
      this._core.events.publish(
        this.id,
        'pluginTester.actualizacionPeriodica',
        {
          timestamp: Date.now(),
          contador: this._data.contador
        }
      );
      
    }, intervalo);
    
    console.log(`[Plugin Tester] Actualización periódica configurada cada ${intervalo}ms.`);
  },
  
  // === Registro de extensiones UI ===
  _registerUIExtensions: function() {
    console.log('[Plugin Tester] Registrando extensiones de UI...');
    
    // 1. Registrar componente de barra lateral
    this._extensionIds.sidebar = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().CALENDAR_SIDEBAR,
      this._createSidebarComponent(),
      { order: 100 }
    );
    
    // 2. Registrar extensión para celdas del calendario
    this._extensionIds.calendarCell = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().CALENDAR_DAY_CELL,
      this._createCalendarCellExtension(),
      { order: 100 }
    );
    
    // 3. Registrar extensión para detalles de eventos
    this._extensionIds.eventDetail = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().EVENT_DETAIL_VIEW,
      this._createEventDetailExtension(),
      { order: 100 }
    );
    
    // 4. Registrar extensión para formulario de eventos
    this._extensionIds.eventForm = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().EVENT_FORM,
      this._createEventFormExtension(),
      { order: 100 }
    );
    
    // 5. Registrar componente de navegación
    this._extensionIds.navigation = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().MAIN_NAVIGATION,
      this._createNavigationComponent(),
      { order: 100 }
    );
    
    // 6. Registrar página completa
    this._extensionIds.page = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().PLUGIN_PAGES,
      this._createPageComponent(),
      {
        order: 100,
        props: { pageId: 'plugin-tester' }
      }
    );
    
    // 7. Registrar panel de configuración
    this._extensionIds.settings = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().SETTINGS_PANEL,
      this._createSettingsComponent(),
      { order: 100 }
    );
    
    console.log('[Plugin Tester] Extensiones de UI registradas con éxito.');
  },
  
  // === Creación de componentes UI ===
  _createSidebarComponent: function() {
    const self = this;
    
    return function SidebarWidget(props) {
      const [contador, setContador] = React.useState(self._data.contador);
      
      // Actualizar contador cuando cambie en el plugin
      React.useEffect(() => {
        const unsub = self._core.events.subscribe(
          props.pluginId,
          'pluginTester.actualizacionPeriodica',
          (data) => {
            setContador(data.contador);
          }
        );
        
        return () => unsub();
      }, []);
      
      const incrementarContador = () => {
        const nuevoContador = self.publicAPI.incrementarContador();
        setContador(nuevoContador);
      };
      
      return React.createElement(
        'div',
        { 
          className: 'plugin-tester-sidebar',
          style: {
            padding: '10px',
            margin: '5px 0',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px'
          }
        },
        [
          React.createElement('h3', { key: 'title' }, 'Plugin Tester'),
          React.createElement('p', { key: 'counter' }, `Contador: ${contador}`),
          React.createElement(
            'button',
            {
              key: 'button',
              onClick: incrementarContador,
              style: {
                padding: '5px 10px',
                backgroundColor: self._data.configuracion.colorTema,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }
            },
            'Incrementar'
          )
        ]
      );
    };
  },
  
  _createCalendarCellExtension: function() {
    const self = this;
    
    return function CalendarCellExtension(props) {
      // Solo mostrar en algunas celdas para demostración
      const shouldShow = (
        (props.hour + props.minutes) % 3 === 0 && 
        props.date.getDate() % 2 === 0
      );
      
      if (!shouldShow) return null;
      
      return React.createElement(
        'div',
        {
          className: 'plugin-tester-cell-indicator',
          style: {
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: self._data.configuracion.colorTema
          }
        }
      );
    };
  },
  
  _createEventDetailExtension: function() {
    const self = this;
    
    return function EventDetailExtension(props) {
      // Solo mostrar si hay un evento
      if (!props.event) return null;
      
      return React.createElement(
        'div',
        {
          className: 'plugin-tester-event-detail',
          style: {
            padding: '10px',
            margin: '10px 0',
            backgroundColor: '#f9f9f9',
            borderLeft: `3px solid ${self._data.configuracion.colorTema}`,
            borderRadius: '2px'
          }
        },
        [
          React.createElement('h4', { key: 'title' }, 'Plugin Tester Info'),
          React.createElement('p', { key: 'content' }, `Evento ID: ${props.event.id}`),
          React.createElement('p', { key: 'time' }, `Última actualización: ${new Date().toLocaleTimeString()}`)
        ]
      );
    };
  },
  
  _createEventFormExtension: function() {
    const self = this;
    
    return function EventFormExtension(props) {
      // Campo adicional para el formulario de eventos
      const [metadatos, setMetadatos] = React.useState(
        props.event && props.event.metadatos ? props.event.metadatos : ''
      );
      
      const handleChange = (e) => {
        setMetadatos(e.target.value);
        
        if (props.onChange) {
          props.onChange({
            target: {
              name: 'metadatos',
              value: e.target.value
            }
          });
        }
      };
      
      return React.createElement(
        'div',
        {
          className: 'plugin-tester-event-form',
          style: {
            padding: '10px',
            margin: '10px 0',
            borderTop: '1px solid #eee'
          }
        },
        [
          React.createElement('label', { key: 'label', htmlFor: 'event-metadata' }, 'Metadatos adicionales:'),
          React.createElement(
            'input',
            {
              key: 'input',
              id: 'event-metadata',
              type: 'text',
              value: metadatos,
              onChange: handleChange,
              style: {
                width: '100%',
                padding: '5px',
                marginTop: '5px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }
            }
          )
        ]
      );
    };
  },
  
  _createNavigationComponent: function() {
    return function NavigationItem(props) {
      const handleClick = () => {
        if (props.onNavigate) {
          props.onNavigate(props.pluginId, 'plugin-tester');
        }
      };
      
      return React.createElement(
        'div',
        {
          className: 'plugin-tester-nav-item',
          onClick: handleClick,
          style: {
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            cursor: 'pointer'
          }
        },
        [
          React.createElement(
            'span',
            {
              key: 'icon',
              className: 'material-icons',
              style: { marginRight: '8px' }
            },
            'bug_report'
          ),
          React.createElement(
            'span',
            { key: 'label' },
            'Plugin Tester'
          )
        ]
      );
    };
  },
  
  _createPageComponent: function() {
    const self = this;
    
    return function PageComponent(props) {
      const [stats, setStats] = React.useState(self.publicAPI.getEstadisticas());
      const [eventos, setEventos] = React.useState(self._data.registroEventos);
      
      // Actualizar estadísticas periódicamente
      React.useEffect(() => {
        const interval = setInterval(() => {
          setStats(self.publicAPI.getEstadisticas());
          setEventos([...self._data.registroEventos]);
        }, 2000);
        
        return () => clearInterval(interval);
      }, []);
      
      // Probar la API de eventos
      const publicarEvento = () => {
        self._core.events.publish(
          self.id,
          'pluginTester.eventoManual',
          {
            timestamp: Date.now(),
            mensaje: 'Evento de prueba manual'
          }
        );
      };
      
      return React.createElement(
        'div',
        {
          className: 'plugin-tester-page',
          style: {
            padding: '20px',
            maxWidth: '800px',
            margin: '0 auto'
          }
        },
        [
          // Cabecera
          React.createElement('h1', { key: 'title' }, 'Plugin Tester - Panel de Control'),
          React.createElement('p', { key: 'description' }, 'Esta página muestra las distintas funcionalidades del sistema de plugins de Atlas'),
          
          // Sección de estadísticas
          React.createElement(
            'div',
            {
              key: 'stats',
              style: {
                backgroundColor: '#f5f5f5',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px'
              }
            },
            [
              React.createElement('h2', { key: 'stats-title' }, 'Estadísticas'),
              React.createElement('p', { key: 'stats-counter' }, `Contador: ${stats.contador}`),
              React.createElement('p', { key: 'stats-events' }, `Eventos registrados: ${stats.eventos}`),
              React.createElement('p', { key: 'stats-update' }, `Última actualización: ${stats.ultimaActualizacion.toLocaleString()}`),
              React.createElement(
                'button',
                {
                  key: 'publish-button',
                  onClick: publicarEvento,
                  style: {
                    padding: '8px 16px',
                    backgroundColor: self._data.configuracion.colorTema,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '10px'
                  }
                },
                'Publicar evento de prueba'
              )
            ]
          ),
          
          // Sección de pruebas de API
          React.createElement(
            'div',
            {
              key: 'api-tests',
              style: {
                backgroundColor: '#f5f5f5',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px'
              }
            },
            [
              React.createElement('h2', { key: 'api-title' }, 'Pruebas de API'),
              React.createElement(
                'button',
                {
                  key: 'test-storage',
                  onClick: async () => {
                    try {
                      await self._core.storage.setItem(
                        self.id,
                        'test-key',
                        { tiempo: Date.now() }
                      );
                      const data = await self._core.storage.getItem(
                        self.id,
                        'test-key'
                      );
                      alert(`Prueba de almacenamiento exitosa: ${JSON.stringify(data)}`);
                    } catch (error) {
                      alert(`Error en prueba de almacenamiento: ${error.message}`);
                    }
                  },
                  style: {
                    padding: '8px 16px',
                    backgroundColor: '#2ecc71',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    margin: '5px'
                  }
                },
                'Probar Almacenamiento'
              ),
              
              React.createElement(
                'button',
                {
                  key: 'test-events',
                  onClick: () => {
                    try {
                      self._core.events.publish(
                        self.id,
                        'pluginTester.testEvent',
                        { tiempo: Date.now() }
                      );
                      alert('Evento de prueba publicado. Revisa la consola para más detalles.');
                    } catch (error) {
                      alert(`Error en prueba de eventos: ${error.message}`);
                    }
                  },
                  style: {
                    padding: '8px 16px',
                    backgroundColor: '#e67e22',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    margin: '5px'
                  }
                },
                'Probar Eventos'
              ),
              
              React.createElement(
                'button',
                {
                  key: 'test-plugins',
                  onClick: () => {
                    try {
                      const plugins = self._core.plugins.getActivePlugins();
                      alert(`Plugins activos: ${plugins.map(p => p.id).join(', ')}`);
                    } catch (error) {
                      alert(`Error en prueba de plugins: ${error.message}`);
                    }
                  },
                  style: {
                    padding: '8px 16px',
                    backgroundColor: '#9b59b6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    margin: '5px'
                  }
                },
                'Listar Plugins'
              )
            ]
          ),
          
          // Registro de eventos
          React.createElement(
            'div',
            {
              key: 'events-log',
              style: {
                backgroundColor: '#f5f5f5',
                padding: '15px',
                borderRadius: '8px'
              }
            },
            [
              React.createElement('h2', { key: 'events-title' }, 'Registro de Eventos'),
              React.createElement(
                'div',
                {
                  key: 'events-container',
                  style: {
                    maxHeight: '300px',
                    overflowY: 'auto',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    padding: '10px',
                    backgroundColor: '#fff'
                  }
                },
                eventos.length > 0
                  ? eventos.slice().reverse().map((evento, index) => {
                      return React.createElement(
                        'div',
                        {
                          key: `event-${index}`,
                          style: {
                            padding: '8px',
                            borderBottom: '1px solid #eee',
                            fontSize: '0.9em'
                          }
                        },
                        [
                          React.createElement(
                            'div',
                            { key: 'event-header', style: { fontWeight: 'bold' } },
                            `${evento.tipo} - ${new Date(evento.timestamp).toLocaleString()}`
                          ),
                          React.createElement(
                            'div',
                            { key: 'event-data' },
                            JSON.stringify(evento.datos)
                          )
                        ]
                      );
                    })
                  : React.createElement('p', { key: 'no-events' }, 'No hay eventos registrados.')
              )
            ]
          )
        ]
      );
    };
  },
  
  _createSettingsComponent: function() {
    const self = this;
    
    return function SettingsComponent(props) {
      const [config, setConfig] = React.useState({...self._data.configuracion});
      
      const handleColorChange = (e) => {
        const newConfig = {
          ...config,
          colorTema: e.target.value
        };
        
        setConfig(newConfig);
        self._data.configuracion = newConfig;
        self._saveData();
      };
      
      const handleCheckboxChange = (e) => {
        const newConfig = {
          ...config,
          mostrarNotificaciones: e.target.checked
        };
        
        setConfig(newConfig);
        self._data.configuracion = newConfig;
        self._saveData();
      };
      
      const handleIntervalChange = (e) => {
        const newConfig = {
          ...config,
          intervaloActualizacion: parseInt(e.target.value, 10) || 30
        };
        
        setConfig(newConfig);
        self._data.configuracion = newConfig;
        self._saveData();
        
        // Reiniciar temporizador con el nuevo intervalo
        if (self._timerId) {
          clearInterval(self._timerId);
          self._timerId = null;
        }
        self._configurarActualizacionPeriodica();
      };
      
      return React.createElement(
        'div',
        {
          className: 'plugin-tester-settings',
          style: {
            padding: '15px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px'
          }
        },
        [
          React.createElement('h3', { key: 'title' }, 'Configuración de Plugin Tester'),
          
          // Color del tema
          React.createElement(
            'div',
            {
              key: 'color-group',
              style: {
                marginBottom: '15px'
              }
            },
            [
              React.createElement('label', { key: 'label', htmlFor: 'theme-color' }, 'Color del tema:'),
              React.createElement(
                'input',
                {
                  key: 'input',
                  id: 'theme-color',
                  type: 'color',
                  value: config.colorTema,
                  onChange: handleColorChange,
                  style: {
                    marginLeft: '10px',
                    verticalAlign: 'middle'
                  }
                }
              )
            ]
          ),
          
          // Mostrar notificaciones
          React.createElement(
            'div',
            {
              key: 'notifications-group',
              style: {
                marginBottom: '15px'
              }
            },
            [
              React.createElement('label', { key: 'label', htmlFor: 'show-notifications' }, 'Mostrar notificaciones:'),
              React.createElement(
                'input',
                {
                  key: 'input',
                  id: 'show-notifications',
                  type: 'checkbox',
                  checked: config.mostrarNotificaciones,
                  onChange: handleCheckboxChange,
                  style: {
                    marginLeft: '10px',
                    verticalAlign: 'middle'
                  }
                }
              )
            ]
          ),
          
          // Intervalo de actualización
          React.createElement(
            'div',
            {
              key: 'interval-group',
              style: {
                marginBottom: '15px'
              }
            },
            [
              React.createElement('label', { key: 'label', htmlFor: 'update-interval' }, 'Intervalo de actualización (segundos):'),
              React.createElement(
                'input',
                {
                  key: 'input',
                  id: 'update-interval',
                  type: 'number',
                  min: '5',
                  max: '300',
                  value: config.intervaloActualizacion,
                  onChange: handleIntervalChange,
                  style: {
                    marginLeft: '10px',
                    width: '60px'
                  }
                }
              )
            ]
          ),
          
          // Botón de restablecer configuración
          React.createElement(
            'button',
            {
              key: 'reset-button',
              onClick: () => {
                const defaultConfig = {
                  colorTema: '#3498db',
                  mostrarNotificaciones: true,
                  intervaloActualizacion: 30
                };
                
                setConfig(defaultConfig);
                self._data.configuracion = defaultConfig;
                self._saveData();
                
                // Reiniciar temporizador
                if (self._timerId) {
                  clearInterval(self._timerId);
                  self._timerId = null;
                }
                self._configurarActualizacionPeriodica();
              },
              style: {
                padding: '8px 16px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }
            },
            'Restablecer valores predeterminados'
          )
        ]
      );
    };
  }
};