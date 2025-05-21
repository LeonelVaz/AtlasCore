export default {
  id: 'administrador-notas',
  name: 'Administrador de Notas',
  version: '1.0.0',
  description: 'Administra notas asociadas a fechas y eventos en tu calendario',
  author: 'Atlas Plugins',
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
  permissions: ['storage', 'events', 'ui', 'communication'],
  
  _core: null,
  _data: {
    notas: {},
    categorias: {
      trabajo: { nombre: 'Trabajo', color: '#2196F3', icono: 'work' },
      personal: { nombre: 'Personal', color: '#4CAF50', icono: 'person' },
      general: { nombre: 'General', color: '#9E9E9E', icono: 'note' }
    },
    configuracion: {
      mostrarIndicadores: true,
      formatoFecha: 'DD/MM/YYYY',
      ordenamiento: 'fecha-desc'
    }
  },
  _subscriptions: [],
  _extensionIds: [],
  
  init: function(core) {
    const self = this;
    
    return new Promise(function(resolve) {
      try {
        self._core = core;
        
        // Importar servicios y utilidades
        Promise.all([
          import('./services/notesService.js').then(module => {
            self._notesService = new module.NotesService(self, core);
          }),
          import('./services/storageService.js').then(module => {
            self._storageService = new module.StorageService(self, core);
          }),
          import('./utils/helpers.js').then(module => {
            self._helpers = module.helpers;
          })
        ]).then(() => {
          // Cargar datos guardados
          return self._storageService.loadData();
        }).then((savedData) => {
          if (savedData) {
            self._data = { ...self._data, ...savedData };
          }
          
          // Registrar componentes UI
          self._registerUIComponents();
          
          // Configurar listeners de eventos
          self._setupEventListeners();
          
          // Registrar API pública
          self.publicAPI = self._createPublicAPI();
          core.plugins.registerAPI(self.id, self.publicAPI);
          
          console.log('[Administrador de Notas] Inicializado correctamente');
          resolve(true);
        }).catch(function(error) {
          console.error('[Administrador de Notas] Error durante la inicialización:', error);
          resolve(false);
        });
      } catch (error) {
        console.error('[Administrador de Notas] Error crítico:', error);
        resolve(false);
      }
    });
  },
  
  cleanup: function() {
    try {
      // Guardar datos
      if (this._storageService) {
        this._storageService.saveData(this._data);
      }
      
      // Cancelar todas las suscripciones
      this._subscriptions.forEach(function(unsub) {
        if (typeof unsub === 'function') {
          unsub();
        }
      });
      
      // Eliminar todas las extensiones UI
      if (this._core && this._core.ui) {
        this._core.ui.removeAllExtensions(this.id);
      }
      
      console.log('[Administrador de Notas] Limpieza completada');
      return true;
    } catch (error) {
      console.error('[Administrador de Notas] Error durante la limpieza:', error);
      return false;
    }
  },
  
  _createPublicAPI: function() {
    const self = this;
    
    return {
      // Obtener todas las notas
      getNotas: function() {
        return { ...self._data.notas };
      },
      
      // Obtener notas por fecha
      getNotasPorFecha: function(fecha) {
        const fechaStr = self._helpers.formatDateKey(fecha);
        return self._data.notas[fechaStr] || [];
      },
      
      // Obtener notas por evento
      getNotasPorEvento: function(eventoId) {
        const todasLasNotas = [];
        Object.values(self._data.notas).forEach(notasPorFecha => {
          const notasDelEvento = notasPorFecha.filter(nota => nota.eventoId === eventoId);
          todasLasNotas.push(...notasDelEvento);
        });
        return todasLasNotas;
      },
      
      // Crear nueva nota
      crearNota: function(fecha, contenido, opciones = {}) {
        return self._notesService.crearNota(fecha, contenido, opciones);
      },
      
      // Actualizar nota
      actualizarNota: function(fecha, notaId, cambios) {
        return self._notesService.actualizarNota(fecha, notaId, cambios);
      },
      
      // Eliminar nota
      eliminarNota: function(fecha, notaId) {
        return self._notesService.eliminarNota(fecha, notaId);
      },
      
      // Obtener categorías
      getCategorias: function() {
        return { ...self._data.categorias };
      },
      
      // Buscar notas
      buscarNotas: function(termino) {
        return self._notesService.buscarNotas(termino);
      }
    };
  },
  
  _registerUIComponents: function() {
    const self = this;
    
    // Importar y registrar componentes JSX
    Promise.all([
      import('./components/ToolbarButton.jsx'),
      import('./components/CalendarIndicator.jsx'),
      import('./components/EventFormExtension.jsx'),
      import('./components/EventDetailExtension.jsx'),
      import('./components/SidebarWidget.jsx'),
      import('./components/MainPage.jsx'),
      import('./components/SettingsPanel.jsx')
    ]).then(([
      ToolbarButtonModule,
      CalendarIndicatorModule,
      EventFormModule,
      EventDetailModule,
      SidebarModule,
      MainPageModule,
      SettingsModule
    ]) => {
      const zones = self._core.ui.getExtensionZones();
      
      // Botón en la barra de herramientas
      self._extensionIds.push(
        self._core.ui.registerExtension(
          self.id,
          zones.MAIN_NAVIGATION,
          ToolbarButtonModule.createToolbarButton(self),
          { order: 200 }
        )
      );
      
      // Indicador en celdas del calendario
      self._extensionIds.push(
        self._core.ui.registerExtension(
          self.id,
          zones.CALENDAR_DAY_HEADER,
          CalendarIndicatorModule.createCalendarIndicator(self),
          { order: 150 }
        )
      );
      
      // Extensión para formulario de eventos
      self._extensionIds.push(
        self._core.ui.registerExtension(
          self.id,
          zones.EVENT_FORM,
          EventFormModule.createEventFormExtension(self),
          { order: 100 }
        )
      );
      
      // Extensión para detalles de eventos
      self._extensionIds.push(
        self._core.ui.registerExtension(
          self.id,
          zones.EVENT_DETAIL_VIEW,
          EventDetailModule.createEventDetailExtension(self),
          { order: 100 }
        )
      );
      
      // Widget en la barra lateral
      self._extensionIds.push(
        self._core.ui.registerExtension(
          self.id,
          zones.CALENDAR_SIDEBAR,
          SidebarModule.createSidebarWidget(self),
          { order: 100 }
        )
      );
      
      // Página principal de notas
      self._extensionIds.push(
        self._core.ui.registerExtension(
          self.id,
          zones.PLUGIN_PAGES,
          MainPageModule.createMainPage(self),
          { order: 100, props: { pageId: 'administrador-notas' } }
        )
      );
      
      // Panel de configuración
      self._extensionIds.push(
        self._core.ui.registerExtension(
          self.id,
          zones.SETTINGS_PANEL,
          SettingsModule.createSettingsPanel(self),
          { order: 100 }
        )
      );
    }).catch(error => {
      console.error('[Administrador de Notas] Error al registrar componentes UI:', error);
    });
  },
  
  _setupEventListeners: function() {
    const self = this;
    
    // Escuchar cambios en eventos del calendario
    self._subscriptions.push(
      self._core.events.subscribe(
        self.id,
        'calendar.eventUpdated',
        function(data) {
          self._handleEventUpdate(data);
        }
      )
    );
    
    self._subscriptions.push(
      self._core.events.subscribe(
        self.id,
        'calendar.eventDeleted',
        function(data) {
          self._handleEventDelete(data);
        }
      )
    );
    
    // Escuchar cambios de tema
    self._subscriptions.push(
      self._core.events.subscribe(
        self.id,
        'app.themeChanged',
        function(data) {
          self._handleThemeChange(data);
        }
      )
    );
    
    // Escuchar cambios en la vista del calendario
    self._subscriptions.push(
      self._core.events.subscribe(
        self.id,
        'calendar.viewChanged',
        function(data) {
          self._handleViewChange(data);
        }
      )
    );
  },
  
  _handleEventUpdate: function(data) {
    // Actualizar referencias de notas si el evento cambió de fecha
    if (data.oldEvent && data.newEvent && data.oldEvent.start !== data.newEvent.start) {
      this._notesService.actualizarReferenciasEvento(
        data.oldEvent.id,
        data.oldEvent.start,
        data.newEvent.start
      );
    }
  },
  
  _handleEventDelete: function(data) {
    // Marcar notas relacionadas como huérfanas
    if (data.event && data.event.id) {
      this._notesService.marcarNotasHuerfanas(data.event.id);
    }
  },
  
  _handleThemeChange: function(data) {
    // Publicar evento para que los componentes se actualicen
    this._core.events.publish(
      this.id,
      'administradorNotas.temaActualizado',
      data
    );
  },
  
  _handleViewChange: function(data) {
    // Publicar evento para actualizar la vista de notas
    this._core.events.publish(
      this.id,
      'administradorNotas.vistaActualizada',
      data
    );
  }
};