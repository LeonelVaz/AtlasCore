// video-scheduler/index.js
// Importar constantes y utilidades
import { VIDEO_STATUS, DEFAULT_VIDEO_STRUCTURE, CURRENCIES, VIDEO_TIME_SLOTS } from './utils/constants.js';
import { I18nHelper } from './utils/i18n.js';
import { formatCurrency, calculateTotalEarnings, getVideoCountByStatus } from './utils/videoUtils.js';

export default {
  id: 'video-scheduler',
  name: 'Video Scheduler',
  version: '1.0.0',
  description: 'Planifica, organiza y da seguimiento a la producción de videos.',
  author: 'Atlas Plugin Team',
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
  permissions: ['storage', 'events', 'ui'],

  // Almacenamiento interno del plugin
  _core: null,
  _videos: [],
  _settings: {
    defaultPlatform: 'youtube',
    defaultCurrency: 'USD',
    currencyRates: {
      USD: 1.0,
      EUR: 0.92,
      ARS: 850.0,
      MXN: 18.5,
    },
    showInCalendarHeaders: true,
    language: 'es'
  },
  _i18n: null,
  _subscriptions: [],

  // Ciclo de vida del plugin
  init: function(core) {
    const self = this;
    
    return new Promise(function(resolve) {
      try {
        self._core = core;

        // Cargar datos y configuraciones persistentes
        Promise.all([
          self._core.storage.getItem(self.id, 'videos_data', []),
          self._core.storage.getItem(self.id, 'plugin_settings', self._settings)
        ]).then(function([storedVideos, storedSettings]) {
          
          // Procesar videos almacenados
          self._videos = storedVideos.map(function(v) {
            return {
              ...DEFAULT_VIDEO_STRUCTURE,
              ...v,
              slot: { 
                ...DEFAULT_VIDEO_STRUCTURE.slot, 
                ...v.slot, 
                date: v.slot?.date ? new Date(v.slot.date).toISOString().split('T')[0] : null 
              },
              publishedAt: v.publishedAt ? new Date(v.publishedAt).toISOString() : null,
              createdAt: v.createdAt ? new Date(v.createdAt).toISOString() : null,
              updatedAt: v.updatedAt ? new Date(v.updatedAt).toISOString() : null,
            };
          });

          self._settings = { ...self._settings, ...storedSettings };

          // Inicializar i18n
          self._i18n = new I18nHelper(self._settings.language);

          // Registrar API pública
          self.publicAPI = self._createPublicAPI(self);
          self._core.plugins.registerAPI(self.id, self.publicAPI);

          // Registrar extensiones de UI
          self._registerUIExtensions();

          // Configurar listeners de eventos
          self._setupEventListeners();

          self._core.events.publish(self.id, self.id + '.initialized', { success: true });
          console.log('[' + self.id + '] Plugin inicializado correctamente');
          resolve(true);
          
        }).catch(function(error) {
          console.error('[' + self.id + '] Error al cargar datos:', error);
          resolve(false);
        });

      } catch (error) {
        console.error('[' + self.id + '] Error durante la inicialización:', error);
        resolve(false);
      }
    });
  },

  cleanup: function() {
    try {
      // Guardar datos
      this._saveAllPluginData();
      
      // Cancelar suscripciones
      this._subscriptions.forEach(function(unsub) {
        if (typeof unsub === 'function') unsub();
      });

      console.log('[' + this.id + '] Plugin limpiado correctamente');
      return true;
    } catch (error) {
      console.error('[' + this.id + '] Error durante la limpieza:', error);
      return false;
    }
  },

  // API Pública del Plugin
  publicAPI: null,

  _createPublicAPI: function(pluginInstance) {
    return {
      // Gestión de Videos
      getAllVideos: function(filters) {
        return pluginInstance._internalGetAllVideos(filters);
      },
      getVideoById: function(id) {
        return pluginInstance._internalGetVideoById(id);
      },
      getVideosByDate: function(date) {
        return pluginInstance._internalGetVideosByDate(date);
      },
      getVideosInDateRange: function(startDate, endDate) {
        return pluginInstance._internalGetVideosInDateRange(startDate, endDate);
      },
      createVideo: function(videoData) {
        return pluginInstance._internalCreateVideo(videoData);
      },
      updateVideo: function(id, videoData) {
        return pluginInstance._internalUpdateVideo(id, videoData);
      },
      deleteVideo: function(id) {
        return pluginInstance._internalDeleteVideo(id);
      },
      addBulkVideos: function(options) {
        return pluginInstance._internalAddBulkVideos(options);
      },

      // Gestión de Estado de Producción
      getProductionStatus: function(id) {
        const video = pluginInstance._internalGetVideoById(id);
        return video ? video.status : null;
      },
      updateProductionStatus: function(id, status, subStatus) {
        return pluginInstance._internalUpdateProductionStatus(id, status, subStatus);
      },

      // Gestión de Ingresos
      trackEarningsForVideo: function(id, earningsData) {
        return pluginInstance._internalTrackEarningsForVideo(id, earningsData);
      },

      // Estadísticas y Reportes
      getVideoCountByStatus: function(filters) {
        return pluginInstance._internalGetVideoCountByStatus(filters);
      },
      getEarningsReport: function(options) {
        return pluginInstance._internalGetEarningsReport(options);
      },

      // Configuración
      getPluginSettings: function() {
        return {...pluginInstance._settings};
      },
      updatePluginSetting: function(key, value) {
        return pluginInstance._internalUpdatePluginSetting(key, value);
      },
      updateCurrencyRates: function(rates) {
        return pluginInstance._internalUpdateCurrencyRates(rates);
      },

      // Utilidades i18n
      translate: function(key, fallback) {
        return pluginInstance._i18n ? pluginInstance._i18n.t(key, fallback) : (fallback || key);
      },
    };
  },

  // Métodos Internos del Plugin
  _saveAllPluginData: function() {
    const self = this;
    return Promise.all([
      self._core.storage.setItem(self.id, 'videos_data', self._videos),
      self._core.storage.setItem(self.id, 'plugin_settings', self._settings)
    ]);
  },

  _internalGetAllVideos: function(filters) {
    let videosToFilter = [...this._videos];
    if (!filters) return videosToFilter;
    
    if (filters.status) {
      videosToFilter = videosToFilter.filter(function(v) {
        return v.status === filters.status;
      });
    }
    if (filters.platform) {
      videosToFilter = videosToFilter.filter(function(v) {
        return v.platform === filters.platform;
      });
    }
    if (filters.dateRange) {
      videosToFilter = videosToFilter.filter(function(v) {
        const videoDate = v.slot.date;
        return videoDate >= filters.dateRange.start && videoDate <= filters.dateRange.end;
      });
    }
    
    return videosToFilter;
  },

  _internalGetVideoById: function(id) {
    return this._videos.find(function(v) { return v.id === id; }) || null;
  },

  _internalGetVideosByDate: function(targetDateStr) {
    return this._videos.filter(function(v) {
      return v.slot.date === targetDateStr;
    });
  },

  _internalGetVideosInDateRange: function(startDateStr, endDateStr) {
    return this._videos.filter(function(v) {
      return v.slot.date >= startDateStr && v.slot.date <= endDateStr;
    });
  },

  _internalCreateVideo: function(videoData) {
    const self = this;
    
    return new Promise(function(resolve) {
      const newVideo = {
        ...DEFAULT_VIDEO_STRUCTURE,
        ...videoData,
        id: 'video-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        slot: { 
          ...DEFAULT_VIDEO_STRUCTURE.slot, 
          ...videoData.slot, 
          date: videoData.slot?.date ? new Date(videoData.slot.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        },
        status: videoData.status || VIDEO_STATUS.PLANNED,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      self._videos.push(newVideo);
      self._saveAllPluginData().then(function() {
        self._core.events.publish(self.id, self.id + '.videoCreated', { video: newVideo });
        resolve(newVideo);
      });
    });
  },

  _internalUpdateVideo: function(id, videoDataToUpdate) {
    const self = this;
    
    return new Promise(function(resolve) {
      const videoIndex = self._videos.findIndex(function(v) { return v.id === id; });
      if (videoIndex === -1) {
        resolve(null);
        return;
      }
      
      const previousData = { ...self._videos[videoIndex] };
      self._videos[videoIndex] = {
        ...previousData,
        ...videoDataToUpdate,
        slot: videoDataToUpdate.slot ? { 
          ...previousData.slot, 
          ...videoDataToUpdate.slot, 
          date: videoDataToUpdate.slot?.date ? new Date(videoDataToUpdate.slot.date).toISOString().split('T')[0] : previousData.slot.date 
        } : previousData.slot,
        updatedAt: new Date().toISOString(),
      };
      
      self._saveAllPluginData().then(function() {
        self._core.events.publish(self.id, self.id + '.videoUpdated', { 
          video: self._videos[videoIndex], 
          previousData: previousData 
        });
        resolve(self._videos[videoIndex]);
      });
    });
  },

  _internalDeleteVideo: function(id) {
    const self = this;
    
    return new Promise(function(resolve) {
      const videoIndex = self._videos.findIndex(function(v) { return v.id === id; });
      if (videoIndex === -1) {
        resolve(false);
        return;
      }
      
      const deletedVideo = self._videos[videoIndex];
      self._videos.splice(videoIndex, 1);
      
      self._saveAllPluginData().then(function() {
        self._core.events.publish(self.id, self.id + '.videoDeleted', { video: deletedVideo });
        resolve(true);
      });
    });
  },

  _internalAddBulkVideos: function(options) {
    const self = this;
    const { baseName, count, startNumber = 1, startDay, startSlot = 'morning', frequency = 'daily' } = options;
    
    return new Promise(function(resolve) {
      const startDate = new Date(startDay);
      const promises = [];
      
      for (let i = 0; i < count; i++) {
        const videoDate = new Date(startDate);
        
        if (frequency === 'daily') {
          videoDate.setDate(startDate.getDate() + i);
        } else if (frequency === 'weekly') {
          videoDate.setDate(startDate.getDate() + (i * 7));
        }
        
        const videoPromise = self._internalCreateVideo({
          title: baseName + ' #' + (startNumber + i),
          slot: { 
            date: videoDate.toISOString().split('T')[0], 
            timeSlot: startSlot 
          },
        });
        
        promises.push(videoPromise);
      }
      
      Promise.all(promises).then(function(videos) {
        self._core.events.publish(self.id, self.id + '.bulkVideosAdded', { count: count, videos: videos });
        resolve(videos);
      });
    });
  },

  _internalUpdateProductionStatus: function(id, status, subStatus) {
    return this._internalUpdateVideo(id, { 
      status: status, 
      subStatus: subStatus || null 
    });
  },

  _internalTrackEarningsForVideo: function(id, earningsData) {
    const self = this;
    const video = self._internalGetVideoById(id);
    if (!video) return Promise.resolve(null);
    
    video.earnings = video.earnings || { 
      currency: self._settings.defaultCurrency, 
      total: 0, 
      breakdown: {} 
    };
    
    const source = earningsData.source || 'manual';
    video.earnings.breakdown[source] = (video.earnings.breakdown[source] || 0) + parseFloat(earningsData.amount);
    video.earnings.total = Object.values(video.earnings.breakdown).reduce(function(sum, val) {
      return sum + val;
    }, 0);
    video.earnings.lastUpdated = new Date().toISOString();
    video.earnings.currency = earningsData.currency || video.earnings.currency;
    
    return self._internalUpdateVideo(id, { earnings: video.earnings });
  },

  _internalGetVideoCountByStatus: function(filters) {
    const videos = this._internalGetAllVideos(filters);
    return getVideoCountByStatus(videos);
  },

  _internalGetEarningsReport: function(options) {
    const videos = this._internalGetAllVideos(options?.filters);
    return calculateTotalEarnings(videos, this._settings.currencyRates, this._settings.defaultCurrency);
  },

  _internalUpdatePluginSetting: function(key, value) {
    const self = this;
    
    return new Promise(function(resolve) {
      self._settings[key] = value;
      self._saveAllPluginData().then(function() {
        self._core.events.publish(self.id, self.id + '.settingsUpdated', { 
          settings: {...self._settings} 
        });
        resolve(true);
      });
    });
  },

  _internalUpdateCurrencyRates: function(rates) {
    this._settings.currencyRates = { ...this._settings.currencyRates, ...rates };
    return this._internalUpdatePluginSetting('currencyRates', this._settings.currencyRates);
  },

  _setupEventListeners: function() {
    // Configurar listeners si es necesario
  },

  // Gestión de UI (Registro de Extensiones)
  _registerUIExtensions: function() {
    const self = this;

    // 1. Item de Navegación Principal
    function NavItemComponent(props) {
      const handleClick = function() {
        props.onNavigate(props.pluginId, 'main-scheduler');
      };
      
      return React.createElement(
        'div',
        {
          className: 'navigation-item',
          onClick: handleClick,
          style: { cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 'var(--spacing-sm)' }
        },
        [
          React.createElement(
            'span',
            { className: 'material-icons', key: 'icon', style: { marginRight: 'var(--spacing-sm)' } },
            'videocam'
          ),
          React.createElement(
            'span',
            { key: 'label' },
            'Video Scheduler'
          )
        ]
      );
    }

    self._core.ui.registerExtension(
      self.id, 
      self._core.ui.getExtensionZones().MAIN_NAVIGATION, 
      NavItemComponent, 
      { order: 150, props: { plugin: self } }
    );

    // 2. Página Completa del Plugin
    function VideoSchedulerPageComponent(props) {
      return self._createVideoSchedulerPage(props);
    }

    self._core.ui.registerExtension(
      self.id, 
      self._core.ui.getExtensionZones().PLUGIN_PAGES, 
      VideoSchedulerPageComponent, 
      { 
        order: 100,
        props: { 
          pageId: 'main-scheduler', 
          plugin: self, 
          core: self._core 
        } 
      }
    );

    // 3. Widget para Panel de Configuración
    function SettingsWidgetComponent(props) {
      return self._createSettingsWidget(props);
    }

    self._core.ui.registerExtension(
      self.id, 
      self._core.ui.getExtensionZones().SETTINGS_PANEL, 
      SettingsWidgetComponent, 
      { props: { plugin: self, core: self._core } }
    );

    // 4. Indicadores en el Calendario (opcional)
    if (self._settings.showInCalendarHeaders) {
      function CalendarDayIndicatorComponent(props) {
        return self._createCalendarDayIndicator(props);
      }

      self._core.ui.registerExtension(
        self.id, 
        self._core.ui.getExtensionZones().CALENDAR_DAY_HEADER, 
        CalendarDayIndicatorComponent, 
        { props: { plugin: self, core: self._core } }
      );
    }
  },

  // Métodos para crear componentes (se implementan en archivos separados conceptualmente)
  _createVideoSchedulerPage: function(props) {
    // Este método contendrá la lógica del componente principal
    // Por simplicidad, aquí se incluye una implementación básica
    const self = this;
    
    function VideoSchedulerPage(componentProps) {
      const [currentDate, setCurrentDate] = React.useState(new Date());
      const [videos, setVideos] = React.useState([]);
      const [showModal, setShowModal] = React.useState(false);
      const [editingVideo, setEditingVideo] = React.useState(null);
      
      // Cargar videos del mes actual
      React.useEffect(function() {
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        const monthVideos = self.publicAPI.getVideosInDateRange(
          startOfMonth.toISOString().split('T')[0],
          endOfMonth.toISOString().split('T')[0]
        );
        
        setVideos(monthVideos);
      }, [currentDate]);
      
      const handleCreateVideo = function(slotDate, timeSlot) {
        setEditingVideo({
          slot: { date: slotDate, timeSlot: timeSlot }
        });
        setShowModal(true);
      };
      
      const handleEditVideo = function(video) {
        setEditingVideo(video);
        setShowModal(true);
      };
      
      const handleSaveVideo = function(videoData) {
        if (editingVideo && editingVideo.id) {
          self.publicAPI.updateVideo(editingVideo.id, videoData).then(function() {
            setShowModal(false);
            setEditingVideo(null);
            // Refrescar videos
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            const monthVideos = self.publicAPI.getVideosInDateRange(
              startOfMonth.toISOString().split('T')[0],
              endOfMonth.toISOString().split('T')[0]
            );
            setVideos(monthVideos);
          });
        } else {
          self.publicAPI.createVideo(videoData).then(function() {
            setShowModal(false);
            setEditingVideo(null);
            // Refrescar videos
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            const monthVideos = self.publicAPI.getVideosInDateRange(
              startOfMonth.toISOString().split('T')[0],
              endOfMonth.toISOString().split('T')[0]
            );
            setVideos(monthVideos);
          });
        }
      };
      
      return React.createElement(
        'div',
        { className: 'videoscheduler-page' },
        [
          // Header con controles
          React.createElement(
            'div',
            { className: 'videoscheduler-header', key: 'header' },
            [
              React.createElement('h1', { key: 'title' }, 'Video Scheduler'),
              React.createElement(
                'div',
                { className: 'videoscheduler-controls', key: 'controls' },
                [
                  React.createElement(
                    'button',
                    {
                      key: 'add-video',
                      onClick: function() { handleCreateVideo(null, 'morning'); },
                      className: 'btn-primary'
                    },
                    'Añadir Video'
                  ),
                  React.createElement(
                    'button',
                    {
                      key: 'prev-month',
                      onClick: function() {
                        const newDate = new Date(currentDate);
                        newDate.setMonth(currentDate.getMonth() - 1);
                        setCurrentDate(newDate);
                      }
                    },
                    '← Mes Anterior'
                  ),
                  React.createElement(
                    'span',
                    { key: 'current-month' },
                    currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
                  ),
                  React.createElement(
                    'button',
                    {
                      key: 'next-month',
                      onClick: function() {
                        const newDate = new Date(currentDate);
                        newDate.setMonth(currentDate.getMonth() + 1);
                        setCurrentDate(newDate);
                      }
                    },
                    'Mes Siguiente →'
                  )
                ]
              )
            ]
          ),
          
          // Lista de videos simplificada
          React.createElement(
            'div',
            { className: 'videoscheduler-videos', key: 'videos' },
            videos.map(function(video) {
              return React.createElement(
                'div',
                {
                  key: video.id,
                  className: 'video-card',
                  onClick: function() { handleEditVideo(video); }
                },
                [
                  React.createElement('h3', { key: 'title' }, video.title),
                  React.createElement('p', { key: 'date' }, 'Fecha: ' + video.slot.date),
                  React.createElement('p', { key: 'status' }, 'Estado: ' + video.status),
                  React.createElement('p', { key: 'slot' }, 'Franja: ' + video.slot.timeSlot)
                ]
              );
            })
          ),
          
          // Modal para editar/crear video (simplificado)
          showModal ? React.createElement(
            'div',
            { className: 'modal-overlay', key: 'modal' },
            React.createElement(
              'div',
              { className: 'modal-content' },
              [
                React.createElement('h2', { key: 'modal-title' }, editingVideo?.id ? 'Editar Video' : 'Nuevo Video'),
                self._createVideoForm({
                  video: editingVideo,
                  onSave: handleSaveVideo,
                  onCancel: function() {
                    setShowModal(false);
                    setEditingVideo(null);
                  }
                })
              ]
            )
          ) : null
        ]
      );
    }
    
    return VideoSchedulerPage(props);
  },

  _createVideoForm: function(props) {
    const self = this;
    const video = props.video || {};
    
    return function VideoForm() {
      const [formData, setFormData] = React.useState({
        title: video.title || '',
        description: video.description || '',
        status: video.status || VIDEO_STATUS.PLANNED,
        platform: video.platform || self._settings.defaultPlatform,
        duration: video.duration || 10,
        slot: {
          date: video.slot?.date || new Date().toISOString().split('T')[0],
          timeSlot: video.slot?.timeSlot || 'morning'
        }
      });
      
      const handleChange = function(field, value) {
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          setFormData(function(prev) {
            return {
              ...prev,
              [parent]: {
                ...prev[parent],
                [child]: value
              }
            };
          });
        } else {
          setFormData(function(prev) {
            return {
              ...prev,
              [field]: value
            };
          });
        }
      };
      
      const handleSubmit = function(e) {
        e.preventDefault();
        props.onSave(formData);
      };
      
      return React.createElement(
        'form',
        { onSubmit: handleSubmit, className: 'video-form' },
        [
          React.createElement(
            'div',
            { className: 'form-group', key: 'title-group' },
            [
              React.createElement('label', { key: 'title-label' }, 'Título:'),
              React.createElement('input', {
                key: 'title-input',
                type: 'text',
                value: formData.title,
                onChange: function(e) { handleChange('title', e.target.value); },
                required: true
              })
            ]
          ),
          
          React.createElement(
            'div',
            { className: 'form-group', key: 'date-group' },
            [
              React.createElement('label', { key: 'date-label' }, 'Fecha:'),
              React.createElement('input', {
                key: 'date-input',
                type: 'date',
                value: formData.slot.date,
                onChange: function(e) { handleChange('slot.date', e.target.value); }
              })
            ]
          ),
          
          React.createElement(
            'div',
            { className: 'form-group', key: 'slot-group' },
            [
              React.createElement('label', { key: 'slot-label' }, 'Franja Horaria:'),
              React.createElement(
                'select',
                {
                  key: 'slot-select',
                  value: formData.slot.timeSlot,
                  onChange: function(e) { handleChange('slot.timeSlot', e.target.value); }
                },
                VIDEO_TIME_SLOTS.map(function(slot) {
                  return React.createElement('option', { key: slot, value: slot }, slot);
                })
              )
            ]
          ),
          
          React.createElement(
            'div',
            { className: 'form-group', key: 'status-group' },
            [
              React.createElement('label', { key: 'status-label' }, 'Estado:'),
              React.createElement(
                'select',
                {
                  key: 'status-select',
                  value: formData.status,
                  onChange: function(e) { handleChange('status', e.target.value); }
                },
                Object.values(VIDEO_STATUS).map(function(status) {
                  return React.createElement('option', { key: status, value: status }, status);
                })
              )
            ]
          ),
          
          React.createElement(
            'div',
            { className: 'form-actions', key: 'actions' },
            [
              React.createElement(
                'button',
                {
                  key: 'save',
                  type: 'submit',
                  className: 'btn-primary'
                },
                'Guardar'
              ),
              React.createElement(
                'button',
                {
                  key: 'cancel',
                  type: 'button',
                  onClick: props.onCancel
                },
                'Cancelar'
              )
            ]
          )
        ]
      );
    }();
  },

  _createSettingsWidget: function(props) {
    const self = this;
    
    return function SettingsWidget() {
      const [settings, setSettings] = React.useState({...self._settings});
      
      const handleSettingChange = function(key, value) {
        const newSettings = {
          ...settings,
          [key]: value
        };
        
        setSettings(newSettings);
        self.publicAPI.updatePluginSetting(key, value);
      };
      
      return React.createElement(
        'div',
        { className: 'videoscheduler-settings' },
        [
          React.createElement('h3', { key: 'title' }, 'Configuración Video Scheduler'),
          
          React.createElement(
            'div',
            { className: 'settings-group', key: 'platform' },
            [
              React.createElement('label', { key: 'label' }, 'Plataforma por defecto:'),
              React.createElement(
                'select',
                {
                  key: 'select',
                  value: settings.defaultPlatform,
                  onChange: function(e) { handleSettingChange('defaultPlatform', e.target.value); }
                },
                [
                  React.createElement('option', { key: 'youtube', value: 'youtube' }, 'YouTube'),
                  React.createElement('option', { key: 'vimeo', value: 'vimeo' }, 'Vimeo'),
                  React.createElement('option', { key: 'tiktok', value: 'tiktok' }, 'TikTok')
                ]
              )
            ]
          ),
          
          React.createElement(
            'div',
            { className: 'settings-group', key: 'currency' },
            [
              React.createElement('label', { key: 'label' }, 'Moneda por defecto:'),
              React.createElement(
                'select',
                {
                  key: 'select',
                  value: settings.defaultCurrency,
                  onChange: function(e) { handleSettingChange('defaultCurrency', e.target.value); }
                },
                Object.keys(CURRENCIES).map(function(currency) {
                  return React.createElement('option', { key: currency, value: currency }, currency);
                })
              )
            ]
          ),
          
          React.createElement(
            'div',
            { className: 'settings-group', key: 'calendar' },
            [
              React.createElement('label', { key: 'label' }, 'Mostrar en calendario:'),
              React.createElement('input', {
                key: 'checkbox',
                type: 'checkbox',
                checked: settings.showInCalendarHeaders,
                onChange: function(e) { handleSettingChange('showInCalendarHeaders', e.target.checked); }
              })
            ]
          )
        ]
      );
    }();
  },

  _createCalendarDayIndicator: function(props) {
    const self = this;
    
    return function CalendarDayIndicator(componentProps) {
      const [videoCount, setVideoCount] = React.useState(0);
      
      React.useEffect(function() {
        const dateStr = componentProps.date.toISOString().split('T')[0];
        const videosForDay = self.publicAPI.getVideosByDate(dateStr);
        setVideoCount(videosForDay.length);
      }, [componentProps.date]);
      
      if (videoCount === 0) return null;
      
      return React.createElement(
        'span',
        {
          className: 'videoscheduler-day-indicator',
          style: {
            backgroundColor: 'var(--primary-color)',
            color: 'white',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: '11px',
            marginLeft: '4px'
          }
        },
        videoCount
      );
    }(props);
  }
};