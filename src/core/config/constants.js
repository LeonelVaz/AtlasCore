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
  PLUGIN_DATA_PREFIX: 'atlas_plugin_data_',
  // Claves para el sistema de seguridad
  PLUGIN_SECURITY_SETTINGS: 'atlas_plugin_security_settings',
  PLUGIN_BLACKLIST: 'atlas_plugin_blacklist',
  PLUGIN_AUDIT_LOG: 'atlas_plugin_audit_log',
  PLUGIN_PERMISSIONS: 'atlas_plugin_permissions',
  // Claves para el sistema de distribución y actualizaciones
  INSTALLED_PLUGINS: 'atlas_installed_plugins',
  PACKAGE_MANIFESTS: 'atlas_package_manifests',
  REPOSITORIES: 'atlas_repositories',
  REPOSITORY_CACHE: 'atlas_repository_cache',
  REPOSITORY_SYNC_TIMESTAMPS: 'atlas_repository_sync_timestamps',
  AVAILABLE_UPDATES: 'atlas_available_updates',
  UPDATE_HISTORY: 'atlas_update_history',
  UPDATE_SETTINGS: 'atlas_update_settings',
  LAST_UPDATE_CHECK: 'atlas_last_update_check'
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
  // Versión actual de la aplicación
  CURRENT_APP_VERSION: '0.3.0',
  
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
    EXTENSION_POINT_CHANGED: 'extensionPointChanged',
    COMPATIBILITY_CHECKED: 'compatibilityChecked',
    COMPATIBILITY_ERROR: 'compatibilityError',
    DEPENDENCY_ERROR: 'dependencyError',
    CYCLES_DETECTED: 'cyclesDetected',
    LOAD_ORDER_CALCULATED: 'loadOrderCalculated',
    PLUGINS_SORTED: 'pluginsSorted',
    PLUGINS_VALIDATED: 'pluginsValidated',
    // Eventos específicos de seguridad
    SECURITY_INITIALIZED: 'securityInitialized',
    SECURITY_EVENT: 'securityEvent',
    PERMISSION_REQUEST: 'permissionRequest',
    PERMISSION_GRANTED: 'permissionGranted',
    PERMISSION_DENIED: 'permissionDenied',
    SUSPICIOUS_ACTIVITY: 'suspiciousActivity',
    RESOURCE_OVERUSE: 'resourceOveruse',
    SANDBOX_ERROR: 'sandboxError',
    BLACKLIST_CHANGED: 'blacklistChanged',
    SECURITY_LEVEL_CHANGED: 'securityLevelChanged',
    // Eventos específicos del sistema de distribución y actualizaciones
    PLUGIN_PACKAGED: 'pluginPackaged',
    PLUGIN_INSTALL_STARTED: 'pluginInstallStarted',
    PLUGIN_INSTALLED: 'pluginInstalled',
    PLUGIN_UNINSTALL_STARTED: 'pluginUninstallStarted',
    PLUGIN_UNINSTALLED: 'pluginUninstalled',
    INSTALLATION_ERROR: 'installationError',
    UNINSTALLATION_ERROR: 'uninstallationError',
    REPOSITORY_ADDED: 'repositoryAdded',
    REPOSITORY_UPDATED: 'repositoryUpdated',
    REPOSITORY_REMOVED: 'repositoryRemoved',
    REPOSITORY_TOGGLED: 'repositoryToggled',
    REPOSITORY_SYNC_STARTED: 'repositorySyncStarted',
    REPOSITORY_SYNC_COMPLETED: 'repositorySyncCompleted',
    REPOSITORY_ERROR: 'repositoryError',
    ALL_REPOSITORIES_SYNCED: 'allRepositoriesSynced',
    UPDATE_CHECK_STARTED: 'updateCheckStarted',
    UPDATE_CHECK_COMPLETED: 'updateCheckCompleted',
    UPDATE_CHECK_ERROR: 'updateCheckError',
    UPDATE_AVAILABLE: 'updateAvailable',
    UPDATE_STARTED: 'updateStarted',
    UPDATE_COMPLETED: 'updateCompleted',
    UPDATE_ERROR: 'updateError',
    MASS_UPDATE_STARTED: 'massUpdateStarted',
    MASS_UPDATE_COMPLETED: 'massUpdateCompleted',
    UPDATE_SETTINGS_CHANGED: 'updateSettingsChanged',
    INTEGRITY_VERIFIED: 'integrityVerified',
    INTEGRITY_ERROR: 'integrityError'
  },
  
  // Zonas de extensión UI disponibles
  UI_EXTENSION_ZONES: {
    CALENDAR_SIDEBAR: 'calendar-sidebar',
    SETTINGS_PANEL: 'settings-panel',
    // Nuevos puntos de extensión para navegación y páginas de plugins
    MAIN_NAVIGATION: 'main-navigation',
    PLUGIN_PAGES: 'plugin-pages',
    // Nuevos puntos de extensión para calendario y eventos
    CALENDAR_DAY_CELL: 'calendar-day-cell',        // Nueva zona para celdas de día
    EVENT_DETAIL_VIEW: 'event-detail-view',        // Nueva zona para detalles de evento
    EVENT_FORM: 'event-form',                      // Extensión para el formulario de eventos
    // Otros puntos de extensión existentes
    SECURITY_PANEL: 'security-panel'
  },
  
  // Constantes para el sistema de seguridad
  SECURITY: {
    // Niveles de seguridad
    LEVEL: {
      LOW: 'low',           // Para desarrollo
      NORMAL: 'normal',     // Predeterminado
      HIGH: 'high'          // Para entornos críticos
    },
    
    // Tipos de permisos
    PERMISSION_TYPES: {
      STORAGE: 'storage',
      NETWORK: 'network',
      DOM: 'dom',
      EVENTS: 'events',
      COMMUNICATION: 'communication',
      UI: 'ui',
      NOTIFICATIONS: 'notifications',
      CODE_EXECUTION: 'codeExecution'
    },
    
    // Niveles de riesgo
    RISK_LEVELS: {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    },
    
    // Modos de auditoría
    AUDIT_MODES: {
      DISABLED: 'disabled',
      BATCH: 'batch',
      IMMEDIATE: 'immediate'
    },
    
    // Estados de solicitud de permiso
    PERMISSION_STATUS: {
      PENDING: 'pending',
      APPROVED: 'approved',
      REJECTED: 'rejected',
      REVOKED: 'revoked'
    },
    
    // Tipos de eventos de seguridad
    EVENT_TYPES: {
      SECURITY_VIOLATION: 'securityViolation',
      UNAUTHORIZED_ACCESS: 'unauthorizedAccess',
      RESOURCE_OVERUSE: 'resourceOveruse',
      SUSPICIOUS_CODE: 'suspiciousCode',
      SANDBOX_ESCAPE: 'sandboxEscape',
      DATA_LEAK: 'dataLeak',
      DOM_MANIPULATION: 'domManipulation'
    },
    
    // Acciones de seguridad
    ACTIONS: {
      MONITOR: 'monitor',
      RESTRICT: 'restrict',
      DEACTIVATE: 'deactivate',
      BLACKLIST: 'blacklist',
      QUARANTINE: 'quarantine'
    }
  },
  
  // Constantes para el sistema de distribución y actualizaciones
  DISTRIBUTION: {
    // Tipos de repositorios
    REPOSITORY_TYPES: {
      OFFICIAL: 'official',
      COMMUNITY: 'community',
      PRIVATE: 'private'
    },
    
    // Estados de instalación
    INSTALLATION_STATUS: {
      PENDING: 'pending',
      INSTALLING: 'installing',
      INSTALLED: 'installed',
      FAILED: 'failed',
      UNINSTALLING: 'uninstalling',
      UNINSTALLED: 'uninstalled'
    },
    
    // Estados de actualización
    UPDATE_STATUS: {
      AVAILABLE: 'available',
      DOWNLOADING: 'downloading',
      INSTALLING: 'installing',
      COMPLETED: 'completed',
      FAILED: 'failed'
    },
    
    // Tipos de verificación de integridad
    INTEGRITY_CHECK_TYPES: {
      CHECKSUM: 'checksum',
      SIGNATURE: 'signature',
      FULL: 'full'
    }
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
    MAX_ERROR_LOG_SIZE: 100,
    
    // Límites específicos para sistema de seguridad
    SECURITY: {
      // Memoria máxima para un plugin (4MB)
      MAX_MEMORY: 4 * 1024 * 1024,
      
      // Tiempo máximo de CPU por minuto (ms)
      MAX_CPU_TIME: 1000,
      
      // Tiempo máximo de ejecución para una operación (ms)
      MAX_OPERATION_TIME: 2000,
      
      // Máximo de operaciones por minuto
      MAX_OPERATIONS_PER_MINUTE: 1000,
      
      // Máximo de llamadas a API por minuto
      MAX_API_CALLS_PER_MINUTE: 100,
      
      // Máximo de peticiones de red por minuto
      MAX_NETWORK_REQUESTS_PER_MINUTE: 30,
      
      // Máximo de operaciones DOM por minuto
      MAX_DOM_OPERATIONS_PER_MINUTE: 200,
      
      // Máximo de errores antes de desactivar un plugin
      MAX_ERRORS_BEFORE_DEACTIVATION: 5
    },
    
    // Límites para el sistema de distribución y actualizaciones
    DISTRIBUTION: {
      // Tamaño máximo de paquete de plugin (10MB)
      MAX_PACKAGE_SIZE: 10 * 1024 * 1024,
      
      // Número máximo de repositorios
      MAX_REPOSITORIES: 20,
      
      // Máximo de intentos de instalación
      MAX_INSTALL_ATTEMPTS: 3,
      
      // Tiempo máximo de instalación (10 minutos)
      MAX_INSTALL_TIME: 10 * 60 * 1000,
      
      // Cache máximo de repositorios (100MB)
      MAX_REPOSITORY_CACHE: 100 * 1024 * 1024,
      
      // Tiempo de expiración de cache (24 horas)
      CACHE_EXPIRATION_TIME: 24 * 60 * 60 * 1000
    }
  }
};