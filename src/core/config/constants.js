/**
 * Constantes globales para la aplicación Atlas
 */

// Temas
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  ATLAS_DARK_BLUE: 'atlas-dark-blue',
  PURPLE_NIGHT: 'purple-night',
  DEEP_OCEAN: 'deep-ocean'
};

// Estilos de encabezado
export const DAY_HEADER_STYLES = {
  DEFAULT: 'default',
  MINIMAL: 'minimal',
  DASHBOARD: 'dashboard'
};

// Visualización de horas
export const TIME_DISPLAY_STYLES = {
  HIDDEN: 'hidden',
  START_ONLY: 'start-only',
  START_END: 'start-end',
  COMPACT: 'compact'
};

// Vistas de calendario
export const CALENDAR_VIEWS = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month'
};

// Valores de snap
export const SNAP_VALUES = {
  NONE: 0,
  PRECISE: 15,
  MEDIUM: 30,
  BASIC: 60
};

// Colores predefinidos
export const EVENT_COLORS = {
  ATLAS_BLUE: '#2D4B94',
  MODULAR_GREEN: '#26A69A',
  STRUCTURE_GRAY: '#546E7A',
  INSIGHT_YELLOW: '#FFB300',
  CUSTOM_PURPLE: '#7E57C2',
  ALARM_RED: '#E53935'
};

// Operaciones de eventos
export const EVENT_OPERATIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete'
};

// Almacenamiento
export const STORAGE_KEYS = {
  EVENTS: 'atlas_events',
  SETTINGS: 'atlas_settings',
  THEME: 'atlas_theme',
  SNAP_VALUE: 'atlas_snap_value',
  TIME_SCALE: 'atlas_time_scale',
  CUSTOM_TIME_SLOTS: 'atlas_custom_time_slots',
  MAX_SIMULTANEOUS_EVENTS: 'atlas_max_simultaneous_events',
  // Claves para el sistema de plugins
  PLUGIN_STATES: 'atlas_plugin_states',
  PLUGIN_SETTINGS: 'atlas_plugin_settings',
  PLUGIN_DATA_PREFIX: 'atlas_plugin_data_'
};

// Tipos de franja horaria
export const TIME_SLOT_TYPES = {
  STANDARD: 'standard',
  LARGE: 'large',
  MEDIUM: 'medium',
  SHORT: 'short'
};

// Tipos de módulos
export const MODULE_TYPES = {
  CORE: 'core',
  SERVICE: 'service'
};

// Valores por defecto
export const DEFAULT_EVENT_DURATION = 60;
export const DEFAULT_HOUR_CELL_HEIGHT = 60;

// Escalas de tiempo
export const TIME_SCALES = {
  COMPACT: {
    id: 'compact',
    name: 'Compacta',
    height: 40,
    pixelsPerMinute: 40 / 60
  },
  STANDARD: {
    id: 'standard',
    name: 'Estándar',
    height: 60,
    pixelsPerMinute: 1
  },
  COMFORTABLE: {
    id: 'comfortable',
    name: 'Confortable',
    height: 80,
    pixelsPerMinute: 80 / 60
  },
  SPACIOUS: {
    id: 'spacious',
    name: 'Espaciosa',
    height: 100,
    pixelsPerMinute: 100 / 60
  },
  CUSTOM: {
    id: 'custom',
    name: 'Personalizada'
  }
};

// Sistema de plugins
export const PLUGIN_CONSTANTS = {
  // Versión mínima para compatibilidad
  MIN_COMPATIBLE_VERSION: '0.3.0',
  // Versión máxima para compatibilidad
  MAX_COMPATIBLE_VERSION: '1.0.0',
  // Prefijos para eventos
  EVENT_PREFIXES: {
    PLUGIN: 'plugin.',
    SYSTEM: 'pluginSystem.'
  },
  // Tipos de eventos del sistema de plugins
  SYSTEM_EVENTS: {
    INITIALIZED: 'initialized',
    ERROR: 'error',
    PLUGIN_ACTIVATED: 'pluginActivated',
    PLUGIN_DEACTIVATED: 'pluginDeactivated',
    PLUGINS_RELOADED: 'pluginsReloaded',
    STORAGE_CHANGED: 'storageChanged',
    STORAGE_CLEARED: 'storageCleared',
    STORAGE_LIMIT_EXCEEDED: 'storageLimitExceeded',
    EVENT_HANDLER_ERROR: 'eventHandlerError',
    EXTENSION_POINT_CHANGED: 'extensionPointChanged'
  },
  // Zonas de extensión UI disponibles
  UI_EXTENSION_ZONES: {
    CALENDAR_SIDEBAR: 'calendar-sidebar',
    SETTINGS_PANEL: 'settings-panel',
    // Se añadirán más en versiones futuras
    // DASHBOARD_WIDGETS: 'dashboard-widgets' (v0.5.0+)
  },
  // Límites del sistema
  LIMITS: {
    // 1MB de almacenamiento por plugin
    STORAGE_LIMIT_BYTES: 1024 * 1024,
    // 50 suscripciones a eventos máximo por plugin
    MAX_EVENT_SUBSCRIPTIONS: 50,
    // 10 componentes UI máximo por plugin
    MAX_UI_COMPONENTS: 10,
    // Tamaño máximo del log de errores
    MAX_ERROR_LOG_SIZE: 100
  }
};