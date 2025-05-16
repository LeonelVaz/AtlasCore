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
  // Nuevas claves para el sistema de plugins
  PLUGINS_STATE: 'atlas_plugins_state',
  PLUGIN_CONFIG: 'atlas_plugin_config'
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
  PLUGIN: 'plugin',
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

// Permisos para plugins
export const PLUGIN_PERMISSIONS = {
  READ_CALENDAR: 'read_calendar',
  WRITE_CALENDAR: 'write_calendar',
  READ_STORAGE: 'read_storage',
  WRITE_STORAGE: 'write_storage',
  REGISTER_UI: 'register_ui'
};

