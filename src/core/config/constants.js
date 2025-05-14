// src/core/config/constants.js (actualizado para incluir escalas de tiempo)

/**
 * Constantes globales para la aplicación Atlas
 */

// Constantes para temas de la aplicación
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  ATLAS_DARK_BLUE: 'atlas-dark-blue',
  PURPLE_NIGHT: 'purple-night',
  DEEP_OCEAN: 'deep-ocean'
};

// Constantes para estilos de encabezado de días
export const DAY_HEADER_STYLES = {
  DEFAULT: 'default',
  MINIMAL: 'minimal',
  DASHBOARD: 'dashboard'
};

// Constantes para visualización de horas
export const TIME_DISPLAY_STYLES = {
  HIDDEN: 'hidden',
  START_ONLY: 'start-only',
  START_END: 'start-end',
  COMPACT: 'compact'
};

// Constantes para vistas del calendario
export const CALENDAR_VIEWS = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month'
};

// Constantes para valores de snap (imán)
export const SNAP_VALUES = {
  NONE: 0,
  PRECISE: 15,
  MEDIUM: 30,
  BASIC: 60
};

// Colores predefinidos para eventos
export const EVENT_COLORS = {
  ATLAS_BLUE: '#2D4B94',
  MODULAR_GREEN: '#26A69A',
  STRUCTURE_GRAY: '#546E7A',
  INSIGHT_YELLOW: '#FFB300',
  CUSTOM_PURPLE: '#7E57C2',
  ALARM_RED: '#E53935'
};

// Constantes para operaciones de eventos
export const EVENT_OPERATIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete'
};

// Constantes para almacenamiento
export const STORAGE_KEYS = {
  EVENTS: 'atlas_events',
  SETTINGS: 'atlas_settings',
  THEME: 'atlas_theme',
  SNAP_VALUE: 'atlas_snap_value',
  TIME_SCALE: 'atlas_time_scale',
  CUSTOM_TIME_SLOTS: 'atlas_custom_time_slots'  // Nueva clave para franjas personalizadas
};

// Constantes para tipos de franjas horarias
export const TIME_SLOT_TYPES = {
  STANDARD: 'standard', // Franja de hora completa (60 minutos)
  MEDIUM: 'medium',     // Franja de duración media (30 minutos)
  SHORT: 'short'        // Franja corta (15 minutos)
};

// Constantes para el sistema de módulos
export const MODULE_TYPES = {
  CORE: 'core',
  PLUGIN: 'plugin',
  SERVICE: 'service'
};

// Duración predeterminada para nuevos eventos (en minutos)
export const DEFAULT_EVENT_DURATION = 60;

// Altura de celda de hora por defecto (en píxeles)
export const DEFAULT_HOUR_CELL_HEIGHT = 60;

// Nuevas constantes para escalas de tiempo
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
    pixelsPerMinute: 60 / 60
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