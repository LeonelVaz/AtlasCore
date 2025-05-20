/**
 * constantes.js
 * Definición de constantes utilizadas en todo el plugin
 */

const constants = {
  // Identificación
  PLUGIN_ID: 'pruebas-generales',
  PLUGIN_NAME: 'Pruebas Generales',
  
  // Claves de almacenamiento
  STORAGE_KEYS: {
    SETTINGS: 'settings',
    DEMO_DATA: 'demo-data',
    EVENT_LOG: 'event-log',
    COUNTER: 'counter'
  },
  
  // Nombres de eventos personalizados
  CUSTOM_EVENTS: {
    COUNTER_UPDATED: 'pruebas-generales.counter.updated',
    THEME_CHANGED: 'pruebas-generales.theme.changed',
    DEMO_STARTED: 'pruebas-generales.demo.started',
    DEMO_COMPLETED: 'pruebas-generales.demo.completed',
    LOG_ENTRY: 'pruebas-generales.log.entry'
  },
  
  // IDs de páginas
  PAGE_IDS: {
    MAIN: 'main-page',
    API_TESTS: 'api-tests',
    UI_TESTS: 'ui-tests',
    ADVANCED_DEMOS: 'advanced-demos'
  },
  
  // Temas disponibles
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark',
    HIGH_CONTRAST: 'high-contrast'
  },
  
  // Niveles de log
  LOG_LEVELS: {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error',
    NONE: 'none'
  },
  
  // Tiempos para demostración
  DEMO_TIMINGS: {
    SHORT: 500,
    MEDIUM: 1000,
    LONG: 2000
  },
  
  // Categorías de demostración
  DEMO_CATEGORIES: [
    {
      id: 'storage',
      name: 'Almacenamiento',
      icon: 'storage',
      description: 'Prueba las capacidades de almacenamiento persistente'
    },
    {
      id: 'events',
      name: 'Eventos',
      icon: 'event',
      description: 'Demuestra el sistema de eventos para comunicación'
    },
    {
      id: 'ui',
      name: 'Interfaces de usuario',
      icon: 'dashboard',
      description: 'Explora las diferentes zonas de extensión UI'
    },
    {
      id: 'communication',
      name: 'Comunicación',
      icon: 'share',
      description: 'Prueba la comunicación entre plugins'
    },
    {
      id: 'calendar',
      name: 'Integración con calendario',
      icon: 'calendar_today',
      description: 'Interactúa con el calendario y sus eventos'
    },
    {
      id: 'advanced',
      name: 'Características avanzadas',
      icon: 'stars',
      description: 'Prueba funcionalidades avanzadas como drag-and-drop'
    },
    {
      id: 'themes',
      name: 'Temas y estilos',
      icon: 'palette',
      description: 'Experimenta con diferentes temas y estilos'
    },
    {
      id: 'forms',
      name: 'Formularios',
      icon: 'text_fields',
      description: 'Implementa y valida diferentes tipos de formularios'
    },
    {
      id: 'charts',
      name: 'Visualización de datos',
      icon: 'bar_chart',
      description: 'Visualiza datos con diferentes tipos de gráficas'
    },
    {
      id: 'permissions',
      name: 'Permisos',
      icon: 'security',
      description: 'Explora el sistema de permisos de Atlas'
    }
  ]
};

export default constants;