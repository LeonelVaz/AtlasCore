# Especificación de Desarrollo: Plugin "Video Scheduler" para Atlas

## 1. Introducción y Visión General

**Objetivo del Documento:**
Este documento sirve como una guía detallada para el desarrollo del plugin "Video Scheduler" para la aplicación Atlas. Complementa la `guia-plugin-atlas.md` oficial, proporcionando especificaciones concretas, adaptando conceptos de una versión anterior del plugin y delineando la funcionalidad deseada dentro del nuevo marco de desarrollo de plugins de Atlas.

**Visión del Plugin "Video Scheduler":**
El plugin Video Scheduler está diseñado para creadores de contenido y equipos que necesitan planificar, organizar y dar seguimiento a su producción de videos. Debe permitir:

*   Programar videos en franjas horarias específicas.
*   Gestionar el ciclo de vida de producción de cada video (ej. planeado, guion, grabación, edición, publicado).
*   Registrar y hacer seguimiento de metadatos de producción (ej. progreso de edición, notas).
*   Registrar y analizar ingresos asociados a cada video.
*   Visualizar la programación en una vista de calendario mensual.
*   Ofrecer estadísticas sobre la producción y los ingresos.
*   Integrarse fluidamente con la interfaz y el sistema de temas de Atlas.

**Público Objetivo:** Creadores de contenido de video, YouTubers, equipos de marketing, agencias de contenido.

## 2. Referencias y Documentación Principal

*   **Guía Oficial de Plugins de Atlas:** `guia-plugin-atlas.md` (Este documento es la referencia principal para la API de Atlas Core, estructura de plugins, ciclo de vida, etc.)
*   **Este Documento:** Especificaciones y adaptaciones para el Video Scheduler.

## 3. Estructura General del Plugin y Archivos

Se recomienda la siguiente estructura de archivos, alineada con la guía de Atlas:

```
video-scheduler/
├── index.js                 # Punto de entrada del plugin (definición principal)
├── components/              # Componentes UI React
│   ├── VideoSchedulerPage.jsx # Página principal del plugin (para PLUGIN_PAGES)
│   ├── VideoCard.jsx          # Componente para mostrar un video en la vista de calendario/lista
│   ├── VideoForm.jsx          # Formulario para crear/editar videos (usado en modal)
│   ├── EarningsForm.jsx       # Formulario para añadir/editar ingresos de un video
│   ├── ProductionStatusSelector.jsx # Selector de estado de producción
│   ├── VideoStatsDisplay.jsx  # Componente para mostrar estadísticas
│   ├── SettingsPanelWidget.jsx # Widget para el panel de configuración de Atlas
│   ├── CalendarDayIndicator.jsx # Indicador para CALENDAR_DAY_HEADER (opcional)
│   └── BulkAddForm.jsx        # Formulario para añadir videos en lote
├── utils/                   # Utilidades JavaScript
│   ├── constants.js         # Constantes (VIDEO_STATUS, CURRENCIES, etc.)
│   ├── videoUtils.js        # Lógica de negocio específica (cálculos, formateo)
│   └── i18n.js              # Utilidad simple de internacionalización (ver Sección 7)
├── styles/                  # Estilos CSS
│   └── video-scheduler.css  # Estilos específicos (usando variables de Atlas)
├── locales/                 # Archivos de traducción JSON
│   ├── es.json
│   └── en.json
└── README.md                # Documentación del plugin
```

## 4. Definición Principal del Plugin (`index.js`)

Este archivo será el núcleo del plugin, exportando el objeto de definición según la `guia-plugin-atlas.md`.

```javascript
// video-scheduler/index.js
// Importar constantes y utilidades
import { VIDEO_STATUS, DEFAULT_VIDEO_STRUCTURE, CURRENCIES } from './utils/constants.js';
// import { I18nHelper } from './utils/i18n.js'; // Si se implementa i18n

export default {
  id: 'video-scheduler',
  name: 'Video Scheduler', // Este nombre puede ser traducido posteriormente
  version: '1.0.0',
  description: 'Planifica, organiza y da seguimiento a la producción de videos.',
  author: 'Tu Nombre/Equipo',
  minAppVersion: '0.3.0', // Ajustar según la versión de Atlas
  permissions: ['storage', 'events', 'ui'], // 'network' si se integran APIs externas

  // Almacenamiento interno del plugin
  _core: null,
  _videos: [], // Array de objetos Video (ver Sección 5: Estructura de Datos)
  _settings: {
    defaultPlatform: 'youtube',
    defaultCurrency: 'USD',
    currencyRates: { // Ejemplo: 1 Unidad de esta moneda = X unidades de la moneda base (ej. ARS)
        USD: 1.0, // Tasa base si USD es la moneda de referencia, o tasa contra otra moneda
        EUR: 0.92,
        //... otras tasas relevantes
    },
    showInCalendarHeaders: true, // Opción para mostrar indicadores en calendario Atlas
    // ... más configuraciones específicas del plugin
  },
  // _i18n: null, // Instancia de I18nHelper

  // --- Ciclo de Vida del Plugin (ver guía-plugin-atlas.md) ---
  init: async function(core) {
    this._core = core;
    const self = this;

    try {
      // 1. Cargar datos y configuraciones persistentes
      const storedVideos = await self._core.storage.getItem(self.id, 'videos_data', []);
      self._videos = storedVideos.map(v => ({
          ...DEFAULT_VIDEO_STRUCTURE, // Asegurar estructura base
          ...v,
          // Asegurar que las fechas importantes son objetos Date o ISO strings consistentes
          slot: { ...DEFAULT_VIDEO_STRUCTURE.slot, ...v.slot, date: v.slot?.date ? new Date(v.slot.date).toISOString().split('T')[0] : null },
          publishedAt: v.publishedAt ? new Date(v.publishedAt).toISOString() : null,
          createdAt: v.createdAt ? new Date(v.createdAt).toISOString() : null,
          updatedAt: v.updatedAt ? new Date(v.updatedAt).toISOString() : null,
      }));

      const storedSettings = await self._core.storage.getItem(self.id, 'plugin_settings', self._settings);
      self._settings = { ...self._settings, ...storedSettings };

      // 2. Inicializar i18n (si se implementa, ver Sección 7)
      // self._i18n = new I18nHelper(self._settings.language || 'en');
      // await self._i18n.loadTranslations(await self._loadTranslationFile('en.json')); // Implementar _loadTranslationFile
      // await self._i18n.loadTranslations(await self._loadTranslationFile('es.json'));

      // 3. Registrar API pública
      this.publicAPI = this._createPublicAPI(self);
      self._core.plugins.registerAPI(self.id, this.publicAPI);

      // 4. Configurar listeners de eventos del calendario de Atlas (opcional, para sincro bidireccional)
      // self._setupAtlasEventListeners();

      // 5. Registrar extensiones de UI
      await self._registerUIExtensions(); // Puede ser async si importa componentes dinámicamente

      self._core.events.publish(self.id, `${self.id}.initialized`, { success: true });
      console.log(`[${self.id}] Plugin inicializado.`);
      return true;
    } catch (error) {
      console.error(`[${self.id}] Error durante la inicialización:`, error);
      self._core.events.publish(self.id, `${self.id}.initialized`, { success: false, error: error.toString() });
      return false;
    }
  },

  cleanup: async function() {
    // Guardar datos, cancelar suscripciones, etc. (ver guía-plugin-atlas.md)
    // ...
    await this._saveAllPluginData();
    this._core.events.unsubscribeAll(this.id);
    console.log(`[${self.id}] Plugin limpiado.`);
    return true;
  },

  // --- API Pública del Plugin ---
  publicAPI: { /* Se define dinámicamente en init mediante _createPublicAPI */ },

  _createPublicAPI: function(pluginInstance) {
    return {
      // Gestión de Videos
      getAllVideos: (filters) => pluginInstance._internalGetAllVideos(filters),
      getVideoById: (id) => pluginInstance._internalGetVideoById(id),
      getVideosByDate: (date) => pluginInstance._internalGetVideosByDate(date), // Para la vista de calendario
      getVideosInDateRange: (startDate, endDate) => pluginInstance._internalGetVideosInDateRange(startDate, endDate),
      createVideo: (videoData) => pluginInstance._internalCreateVideo(videoData),
      updateVideo: (id, videoData) => pluginInstance._internalUpdateVideo(id, videoData),
      deleteVideo: (id) => pluginInstance._internalDeleteVideo(id),
      addBulkVideos: (options) => pluginInstance._internalAddBulkVideos(options),

      // Gestión de Estado de Producción
      getProductionStatus: (id) => pluginInstance._internalGetVideoById(id)?.status,
      updateProductionStatus: (id, status, subStatus = null) => pluginInstance._internalUpdateProductionStatus(id, status, subStatus),

      // Gestión de Ingresos
      trackEarningsForVideo: (id, earningsData) => pluginInstance._internalTrackEarningsForVideo(id, earningsData),
      // (Opcional) getEarningsByVideoId: (id) => pluginInstance._internalGetVideoById(id)?.earnings,

      // Estadísticas y Reportes
      getVideoCountByStatus: (filters) => pluginInstance._internalGetVideoCountByStatus(filters),
      getEarningsReport: (options) => pluginInstance._internalGetEarningsReport(options), // Ej: {totalByCurrency, totalOverallInDefaultCurrency}

      // Configuración
      getPluginSettings: () => ({...pluginInstance._settings}),
      updatePluginSetting: (key, value) => pluginInstance._internalUpdatePluginSetting(key, value),
      updateCurrencyRates: (rates) => pluginInstance._internalUpdateCurrencyRates(rates),

      // Utilidades i18n (si se implementa)
      // translate: (key, fallback) => pluginInstance._i18n ? pluginInstance._i18n.t(key, fallback) : (fallback || key),
    };
  },

  // --- Métodos Internos del Plugin (Lógica de Negocio) ---
  // Estos métodos manipulan `self._videos` y `self._settings`, y usan `self._core.storage` y `self._core.events`.

  _saveAllPluginData: async function() {
    await this._core.storage.setItem(this.id, 'videos_data', this._videos);
    await this._core.storage.setItem(this.id, 'plugin_settings', this._settings);
  },

  _internalGetAllVideos: function(filters) {
    let videosToFilter = [...this._videos];
    if (!filters) return videosToFilter;
    // Ejemplo de filtro:
    if (filters.status) videosToFilter = videosToFilter.filter(v => v.status === filters.status);
    if (filters.platform) videosToFilter = videosToFilter.filter(v => v.platform === filters.platform);
    // ... más filtros
    return videosToFilter;
  },

  _internalGetVideoById: function(id) {
    return this._videos.find(v => v.id === id) || null;
  },

  _internalGetVideosByDate: function(targetDateStr) { // targetDateStr en formato YYYY-MM-DD
    return this._videos.filter(v => v.slot.date === targetDateStr);
  },
  
  _internalGetVideosInDateRange: function(startDateStr, endDateStr) {
    // ... implementación
  },

  _internalCreateVideo: async function(videoData) {
    const newVideo = {
      ...DEFAULT_VIDEO_STRUCTURE,
      ...videoData,
      id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      slot: { ...DEFAULT_VIDEO_STRUCTURE.slot, ...videoData.slot, date: videoData.slot?.date ? new Date(videoData.slot.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]},
      status: videoData.status || VIDEO_STATUS.PLANNED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this._videos.push(newVideo);
    await this._saveAllPluginData();
    this._core.events.publish(this.id, `${this.id}.videoCreated`, { video: newVideo });
    return newVideo;
  },

  _internalUpdateVideo: async function(id, videoDataToUpdate) {
    const videoIndex = this._videos.findIndex(v => v.id === id);
    if (videoIndex === -1) return null;
    const previousData = { ...this._videos[videoIndex] };
    this._videos[videoIndex] = {
      ...previousData,
      ...videoDataToUpdate,
      // Manejo específico para propiedades anidadas como slot o earnings si es necesario
      slot: videoDataToUpdate.slot ? { ...previousData.slot, ...videoDataToUpdate.slot, date: videoDataToUpdate.slot?.date ? new Date(videoDataToUpdate.slot.date).toISOString().split('T')[0] : previousData.slot.date } : previousData.slot,
      updatedAt: new Date().toISOString(),
    };
    await this._saveAllPluginData();
    this._core.events.publish(this.id, `${this.id}.videoUpdated`, { video: this._videos[videoIndex], previousData });
    return this._videos[videoIndex];
  },

  _internalDeleteVideo: async function(id) {
    // ...
  },

  _internalAddBulkVideos: async function(options) {
      // Lógica de tu `addBulkVideos` y `addDailyVideos`/`addWeeklyVideos` adaptada.
      // options: { baseName, startNumber, count, startDay, startSlot, frequency, selectedDaysOfWeek, selectedTimeSlots, frequencyValue }
      // Utiliza _internalCreateVideo para añadir cada video.
      // Ejemplo muy simplificado:
      const { baseName, count, startNumber = 1, startDay, startSlot = 'morning' } = options;
      const startDate = new Date(startDay); // Asumir startDay es YYYY-MM-DD
      for (let i = 0; i < count; i++) {
          const videoDate = new Date(startDate);
          videoDate.setDate(startDate.getDate() + i); // Añade un video por día
          await this._internalCreateVideo({
              title: `${baseName} #${startNumber + i}`,
              slot: { date: videoDate.toISOString().split('T')[0], timeSlot: startSlot },
          });
      }
      this._core.events.publish(this.id, `${this.id}.bulkVideosAdded`, { count });
  },

  _internalUpdateProductionStatus: async function(id, status, subStatus = null) {
    // ...
  },

  _internalTrackEarningsForVideo: async function(id, earningsData) { // earningsData: { currency, amount, source, date }
    const video = this._internalGetVideoById(id);
    if (!video) return null;
    video.earnings = video.earnings || { currency: this._settings.defaultCurrency, total: 0, breakdown: {} };
    video.earnings.breakdown[earningsData.source || 'manual'] = (video.earnings.breakdown[earningsData.source || 'manual'] || 0) + parseFloat(earningsData.amount);
    video.earnings.total = Object.values(video.earnings.breakdown).reduce((sum, val) => sum + val, 0);
    video.earnings.lastUpdated = new Date().toISOString();
    video.earnings.currency = earningsData.currency || video.earnings.currency;
    return await this._internalUpdateVideo(id, { earnings: video.earnings });
  },

  _internalGetVideoCountByStatus: function(filters) {
    // ...
  },
  _internalGetEarningsReport: function(options) {
    // ...
  },

  _internalUpdatePluginSetting: async function(key, value) {
    this._settings[key] = value;
    await this._saveAllPluginData();
    this._core.events.publish(this.id, `${this.id}.settingsUpdated`, { settings: {...this._settings} });
  },

  _internalUpdateCurrencyRates: async function(rates) {
    this._settings.currencyRates = { ...this._settings.currencyRates, ...rates };
    await this._internalUpdatePluginSetting('currencyRates', this._settings.currencyRates);
  },

  // --- Gestión de UI (Registro de Extensiones) ---
  _registerUIExtensions: async function() {
    const self = this; // 'this' del plugin

    // 1. Item de Navegación Principal
    // (Como en el ejemplo anterior, usando React.createElement o JSX pre-transpilado)
    // Necesitarás importar o definir aquí tus componentes. Para simplificar, asumo que están disponibles.
    // const NavItemComponent = (await import('./components/NavItemComponent.jsx')).default;
    // this._core.ui.registerExtension(self.id, self._core.ui.getExtensionZones().MAIN_NAVIGATION, NavItemComponent, { order: 150, props: { plugin: self } });

    // 2. Página Completa del Plugin (Dashboard Principal)
    // const VideoSchedulerPageComponent = (await import('./components/VideoSchedulerPage.jsx')).default;
    // this._core.ui.registerExtension(self.id, self._core.ui.getExtensionZones().PLUGIN_PAGES, VideoSchedulerPageComponent, { pageId: 'main-scheduler', props: { plugin: self, core: self._core } });

    // 3. Widget para Panel de Configuración
    // const SettingsWidgetComponent = (await import('./components/SettingsPanelWidget.jsx')).default;
    // this._core.ui.registerExtension(self.id, self._core.ui.getExtensionZones().SETTINGS_PANEL, SettingsWidgetComponent, { props: { plugin: self, core: self._core } });
    
    // 4. Indicadores en el Calendario (opcional)
    // const CalendarDayIndicatorComponent = (await import('./components/CalendarDayIndicator.jsx')).default;
    // if (self._settings.showInCalendarHeaders) {
    //   this._core.ui.registerExtension(self.id, self._core.ui.getExtensionZones().CALENDAR_DAY_HEADER, CalendarDayIndicatorComponent, { props: { plugin: self, core: self._core } });
    // }
    // Para que esto funcione, los componentes deben ser definidos o importados.
    // Ver la guía de Atlas para `React.createElement` si no usas un paso de build.
    // El desarrollador adaptará esto según cómo se manejen los componentes React.
  },
  
  // _loadTranslationFile: async function(filename) { /* ... Lógica para cargar JSON de locales/ ... */ }
};
```

## 5. Estructura de Datos Principal: Video

Cada video gestionado por el plugin tendrá una estructura similar a la siguiente. El plugin la mantendrá internamente en `this._videos` y la persistirá usando `core.storage`.

```javascript
// utils/constants.js
export const DEFAULT_VIDEO_STRUCTURE = {
  id: null, // Generado por el plugin (ej. `video-${timestamp}`)
  title: 'Nuevo Video',
  description: '',
  slot: { // Información de programación
    date: null, // YYYY-MM-DD string
    timeSlot: 'morning', // 'morning', 'afternoon', 'evening', u horas específicas si se prefiere
    // Podría incluir `startTime` y `endTime` si se necesita más granularidad
  },
  status: VIDEO_STATUS.PLANNED, // Estado actual de producción (ver VIDEO_STATUS)
  subStatus: null, // Sub-estado específico (ej. 'script-review' dentro de 'scripting')
  platform: 'youtube', // Plataforma de destino (youtube, vimeo, tiktok, etc.)
  duration: 10, // Duración estimada/real en minutos
  tags: [], // Array de strings
  thumbnail: '', // URL o path a la miniatura
  
  // Metadatos de Producción (ejemplos, expandir según necesidad)
  productionMetadata: {
    scriptStatus: 'pending', // 'pending', 'draft', 'review', 'approved'
    scriptLink: '',
    recordingDate: null,
    recordingLocation: '',
    editor: '',
    editingProgress: 0, // 0-100
    thumbnailArtist: '',
    notes: '', // Notas generales de producción
  },

  // Ingresos del Video
  earnings: {
    currency: 'USD', // Moneda principal para este video
    total: 0, // Total de ingresos en `currency`
    breakdown: { // Detalle por fuente, en `currency`
      // 'adsense': 150.75,
      // 'sponsorship_brandX': 300.00,
    },
    lastUpdated: null, // ISO string de la última actualización de ingresos
  },

  // Timestamps
  publishedAt: null, // ISO string de cuándo se publicó
  createdAt: null, // ISO string
  updatedAt: null, // ISO string

  // Enlace al evento de Atlas (opcional, si se sincroniza)
  atlasEventId: null
};

export const VIDEO_STATUS = {
  PLANNED: 'planned',
  SCRIPTING: 'scripting',
  RECORDING: 'recording', // Anteriormente 'DESARROLLO' o 'REC'
  EDITING: 'editing',     // Anteriormente 'PRODUCCION' o 'EDICION'
  REVIEW: 'review',
  READY_TO_PUBLISH: 'ready_to_publish', // Anteriormente 'PROGRAMAR'
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  // Estados más granulares de tu `VideoContext` original podrían ser sub-estados.
  // Por ejemplo, 'MINIATURA' podría ser una tarea o un check dentro de 'EDITING' o 'READY_TO_PUBLISH'.
};

export const VIDEO_TIME_SLOTS = ['morning', 'afternoon', 'evening']; // O definir rangos horarios.

export const CURRENCIES = { /* ... como en tu VideoContext ... */ };
// STATUS_EMOJIS se pueden definir aquí también.
```

## 6. Funcionalidades y Componentes UI Clave

### 6.1. Página Principal del Plugin (`VideoSchedulerPage.jsx`)
*   **Vista Principal:** Un calendario mensual (similar al `VideoList.js` original) mostrando "tarjetas" de video en sus respectivas franjas horarias.
    *   Cada día podría tener 3 franjas horarias (mañana, tarde, noche) o ser más configurable.
    *   Las tarjetas de video (`VideoCard.jsx`) deben mostrar: título, estado (con indicador visual/emoji), y quizás miniatura si está disponible.
    *   Permitir hacer clic en una tarjeta de video para abrir un modal de edición (`VideoForm.jsx`).
    *   Permitir hacer clic en un slot vacío para crear un nuevo video en esa franja.
*   **Navegación:** Controles para ir al mes anterior/siguiente. Visualización del mes y año actual.
*   **Acciones Principales (Botones):**
    *   "Añadir Video": Abre modal `VideoForm.jsx` para un nuevo video (sin fecha/slot preseleccionado).
    *   "Añadir Videos en Lote": Abre modal `BulkAddForm.jsx`.
    *   "Estadísticas": Podría navegar a una sub-vista o mostrar un panel con `VideoStatsDisplay.jsx`.
    *   "Configuración": Navega al panel de configuración del plugin en Atlas (donde está `SettingsPanelWidget.jsx`) o abre un modal de configuración específico del plugin.
    *   (Opcional) "Importar/Exportar Datos": Funcionalidad para backup/migración.
*   **Estado:**
    *   Manejará la `currentDate` (para la vista mensual).
    *   Obtendrá los videos del mes actual usando `props.plugin.publicAPI.getVideosByDate()` o `getVideosInDateRange()`.
    *   Gestionará el estado de los modales.

### 6.2. Formulario de Video (`VideoForm.jsx`)
*   **Campos:**
    *   Título (texto)
    *   Descripción (textarea)
    *   Fecha y Franja Horaria (seleccionadores de fecha y slot)
    *   Estado de Producción (`ProductionStatusSelector.jsx`, basado en `VIDEO_STATUS`)
    *   Sub-Estado (opcional, selector dinámico basado en estado principal)
    *   Plataforma (selector: YouTube, Vimeo, etc.)
    *   Duración Estimada (número)
    *   Tags (input para añadir múltiples tags)
    *   URL Miniatura (texto)
    *   Campos de `productionMetadata` (script, grabación, edición, etc.)
    *   Fecha de Publicación (opcional, selector de fecha)
*   **Acciones:** Guardar, Cancelar. Al guardar, llama a `props.plugin.publicAPI.createVideo()` o `updateVideo()`.
*   **Sección de Ingresos:** Podría incluir un botón para "Gestionar Ingresos" que abra `EarningsForm.jsx` para el video actual.

### 6.3. Formulario de Ingresos (`EarningsForm.jsx`)
*   Asociado a un video específico.
*   **Campos:**
    *   Monto (número)
    *   Moneda (selector, de `CURRENCIES` y las tasas configuradas)
    *   Fuente del Ingreso (texto, ej. "Adsense Enero", "Sponsor XYZ")
    *   Fecha del Ingreso (selector de fecha)
*   **Acciones:** Añadir Ingreso, Cancelar. Al añadir, llama a `props.plugin.publicAPI.trackEarningsForVideo()`.
*   Debería mostrar una lista de los ingresos ya registrados para ese video.

### 6.4. Visualización de Estadísticas (`VideoStatsDisplay.jsx`)
*   Mostrará los datos obtenidos de `props.plugin.publicAPI.getVideoCountByStatus()` y `getEarningsReport()`.
*   **Secciones:**
    *   Conteo de videos por estado (ej. 5 Planeados, 3 en Edición, 10 Publicados).
    *   Total de ingresos por moneda.
    *   Total de ingresos convertidos a la moneda por defecto del usuario.
    *   (Opcional) Gráficos simples (barras, líneas) para producción a lo largo del tiempo o ingresos mensuales. Implementar con SVG/CSS o librería muy ligera si es factible bajo el sandbox de Atlas.

### 6.5. Panel de Configuración del Plugin (`SettingsPanelWidget.jsx`)
*   Registrado en la zona `SETTINGS_PANEL` de Atlas.
*   **Opciones:**
    *   Plataforma de video por defecto.
    *   Moneda por defecto para ingresos.
    *   Configuración de tasas de cambio (`currencyRates`). Un pequeño formulario para actualizar las tasas de las monedas principales contra la moneda base.
    *   Opción para mostrar/ocultar indicadores de video en el calendario principal de Atlas.
    *   (Opcional) Configuración de idioma para el plugin (si se implementa i18n).
*   Debe usar `props.plugin.publicAPI.updatePluginSetting()` o `updateCurrencyRates()` para guardar los cambios.

### 6.6. Formulario de Añadir en Lote (`BulkAddForm.jsx`)
*   Similar a tu `BulkAddForm` original, permitiendo crear múltiples videos basados en un nombre base, numeración, frecuencia (diaria, semanal con días específicos), y franja horaria.
*   Al guardar, llama a `props.plugin.publicAPI.addBulkVideos()`.

## 7. Internacionalización (i18n)

*   **Atlas Core:** La `guia-plugin-atlas.md` no especifica un servicio de i18n centralizado.
*   **Implementación en Plugin:**
    *   Se creará una utilidad simple `utils/i18n.js` (ej. `I18nHelper` como se mostró antes).
    *   Cargará archivos JSON desde `locales/en.json`, `locales/es.json`.
    *   El plugin tendrá un método en su API pública `translate(key, fallback)` que los componentes UI usarán.
    *   El idioma activo podría ser una configuración del plugin o intentar detectar el del navegador/Atlas (si Atlas expone esto).

## 8. Estilos y Temas

*   Todos los estilos CSS en `styles/video-scheduler.css` **deben** utilizar las variables CSS proporcionadas por Atlas (ej. `var(--primary-color)`, `var(--card-bg)`, `var(--spacing-md)`) para asegurar la consistencia visual y la adaptabilidad a los temas de Atlas (claro/oscuro).
*   Usar prefijos para las clases CSS (ej. `.videoscheduler-nombreclase`) para evitar colisiones.
*   Consultar la sección "Estilos y temas" de `guia-plugin-atlas.md`.

## 9. Consideraciones Adicionales

*   **Rendimiento:** Especialmente en `VideoSchedulerPage.jsx` al renderizar el calendario mensual con muchos videos. Considerar virtualización si es necesario, aunque para un mes típico no debería ser un problema mayor. Optimizar la obtención y filtrado de datos.
*   **Manejo de Errores:** Implementar `try/catch` en los métodos del plugin y mostrar feedback adecuado al usuario a través de los componentes UI (ej. usando `console.error` y, si Atlas lo proporciona, un servicio de notificaciones `core.notifications`).
*   **Seguridad y Sandbox:** Desarrollar teniendo en cuenta las restricciones del sandbox de Atlas. Evitar manipulación directa del DOM fuera de los componentes React, `eval()`, etc.
*   **Importar/Exportar:**
    *   **Exportar:** Obtener `this._videos` y `this._settings` del plugin, `JSON.stringify()`, y ofrecer como descarga (`Blob` + `<a>` tag).
    *   **Importar:** Usar `<input type="file">`, `FileReader` para leer el JSON, parsearlo, y luego usar los métodos de la API pública del plugin (`createVideo`, `updatePluginSetting`) para restaurar los datos. Validar la estructura del JSON importado.

## 10. Flujo de Trabajo del Usuario (Ejemplos)

*   **Planificar un nuevo video:**
    1.  Usuario va a la página del Video Scheduler.
    2.  Hace clic en un slot vacío del calendario o en "Añadir Video".
    3.  Se abre `VideoForm.jsx`.
    4.  Usuario completa título, fecha, slot, estado inicial "Planned".
    5.  Guarda. El video aparece en el calendario.
*   **Actualizar estado de producción:**
    1.  Usuario hace clic en un video existente en el calendario.
    2.  Se abre `VideoForm.jsx` con los datos del video.
    3.  Usuario cambia el estado de "Scripting" a "Recording" y añade notas en `productionMetadata`.
    4.  Guarda. La tarjeta del video en el calendario actualiza su indicador de estado.
*   **Registrar Ingresos:**
    1.  Usuario edita un video publicado.
    2.  Dentro de `VideoForm.jsx`, hace clic en "Gestionar Ingresos".
    3.  Se abre `EarningsForm.jsx`.
    4.  Usuario añade un nuevo ingreso (monto, moneda, fuente).
    5.  Guarda. Los ingresos se asocian al video. `VideoStatsDisplay.jsx` se actualiza.

## 11. Resumen de Tareas para el Desarrollador

1.  **Configurar el `index.js` del plugin:** Definir metadatos, `init`, `cleanup`, `publicAPI`, y los métodos internos principales para la lógica de datos (CRUD de videos, configuraciones).
2.  **Implementar el almacenamiento de datos:** Usar `core.storage` para persistir `_videos` y `_settings`.
3.  **Desarrollar los Componentes React Principales:** `VideoSchedulerPage.jsx`, `VideoForm.jsx`, `EarningsForm.jsx`, `VideoStatsDisplay.jsx`, `SettingsPanelWidget.jsx`, `BulkAddForm.jsx`.
4.  **Integrar componentes con la API del plugin:** Asegurar que los componentes UI usan `props.plugin.publicAPI` para leer/escribir datos.
5.  **Estilizar los componentes:** Usar `video-scheduler.css` con las variables de tema de Atlas.
6.  **(Opcional pero Recomendado) Implementar i18n:** Crear `utils/i18n.js` y archivos de locale.
7.  **Pruebas Exhaustivas:** Probar todas las funcionalidades, la persistencia de datos, la UI en diferentes temas de Atlas (si están disponibles para prueba).
8.  **Documentación:** Actualizar/crear el `README.md` del plugin.

Este documento debería proporcionar una base sólida para que el desarrollador comprenda los requisitos y pueda construir el plugin "Video Scheduler" de manera efectiva en la nueva plataforma Atlas.