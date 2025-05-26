// video-scheduler/config.example.js
// Archivo de ejemplo para configuración personalizada del plugin Video Scheduler
// Copia este archivo como 'config.js' y personaliza según tus necesidades

export const CUSTOM_CONFIG = {
  // === CONFIGURACIÓN GENERAL ===
  general: {
    // Título personalizado para el plugin
    pluginTitle: 'Video Scheduler',
    
    // Descripción personalizada
    pluginDescription: 'Gestiona tu producción de videos',
    
    // Idioma por defecto ('es' o 'en')
    defaultLanguage: 'es',
    
    // Zona horaria para fechas y horarios
    timezone: 'America/Argentina/Buenos_Aires',
    
    // Formato de fecha preferido
    dateFormat: 'DD/MM/YYYY',
    
    // Primer día de la semana (0 = Domingo, 1 = Lunes)
    firstDayOfWeek: 1
  },

  // === CONFIGURACIÓN DE PLATAFORMAS ===
  platforms: {
    // Plataformas disponibles y sus configuraciones
    available: {
      youtube: {
        name: 'YouTube',
        icon: '📺',
        color: '#FF0000',
        defaultDuration: 10, // minutos
        categories: ['Tutorial', 'Vlog', 'Review', 'Gaming']
      },
      vimeo: {
        name: 'Vimeo',
        icon: '🎥',
        color: '#1AB7EA',
        defaultDuration: 15,
        categories: ['Documental', 'Cortometraje', 'Música']
      },
      tiktok: {
        name: 'TikTok',
        icon: '📱',
        color: '#000000',
        defaultDuration: 1,
        categories: ['Dance', 'Comedy', 'Education', 'Lifestyle']
      },
      instagram: {
        name: 'Instagram',
        icon: '📷',
        color: '#E4405F',
        defaultDuration: 0.5,
        categories: ['Stories', 'Reels', 'IGTV', 'Live']
      },
      twitch: {
        name: 'Twitch',
        icon: '🎮',
        color: '#9146FF',
        defaultDuration: 120,
        categories: ['Gaming', 'Just Chatting', 'Music', 'Art']
      }
    },
    
    // Plataforma por defecto
    default: 'youtube'
  },

  // === CONFIGURACIÓN DE ESTADOS ===
  productionStates: {
    // Estados personalizados con configuración
    states: {
      planned: {
        name: 'Planeado',
        emoji: '📋',
        color: '#3B82F6',
        order: 1,
        description: 'Video en fase de planificación'
      },
      scripting: {
        name: 'Guionización',
        emoji: '✍️',
        color: '#8B5CF6',
        order: 2,
        description: 'Escribiendo el guión'
      },
      recording: {
        name: 'Grabación',
        emoji: '🎬',
        color: '#F59E0B',
        order: 3,
        description: 'Grabando el contenido'
      },
      editing: {
        name: 'Edición',
        emoji: '✂️',
        color: '#EF4444',
        order: 4,
        description: 'Editando el video'
      },
      review: {
        name: 'Revisión',
        emoji: '👀',
        color: '#06B6D4',
        order: 5,
        description: 'Revisando antes de publicar'
      },
      ready_to_publish: {
        name: 'Listo para Publicar',
        emoji: '📤',
        color: '#10B981',
        order: 6,
        description: 'Listo para subir'
      },
      published: {
        name: 'Publicado',
        emoji: '✅',
        color: '#059669',
        order: 7,
        description: 'Video publicado'
      },
      archived: {
        name: 'Archivado',
        emoji: '📦',
        color: '#6B7280',
        order: 8,
        description: 'Video archivado'
      }
    },
    
    // Estado inicial por defecto
    defaultState: 'planned',
    
    // Estados que se consideran "activos" (en producción)
    activeStates: ['scripting', 'recording', 'editing', 'review'],
    
    // Estados que se consideran "completados"
    completedStates: ['published', 'archived']
  },

  // === CONFIGURACIÓN DE MONEDAS ===
  currencies: {
    // Monedas soportadas
    supported: {
      USD: {
        name: 'Dólar Estadounidense',
        symbol: '$',
        rate: 1.0 // Moneda base
      },
      EUR: {
        name: 'Euro',
        symbol: '€',
        rate: 0.92
      },
      ARS: {
        name: 'Peso Argentino',
        symbol: '$',
        rate: 850.0
      },
      MXN: {
        name: 'Peso Mexicano',
        symbol: '$',
        rate: 18.5
      },
      COP: {
        name: 'Peso Colombiano',
        symbol: '$',
        rate: 4200.0
      },
      BRL: {
        name: 'Real Brasileño',
        symbol: 'R$',
        rate: 5.2
      }
    },
    
    // Moneda por defecto
    default: 'USD',
    
    // Auto-actualizar tasas de cambio (requiere API externa)
    autoUpdateRates: false,
    
    // URL de API para tasas de cambio (opcional)
    exchangeApiUrl: null
  },

  // === CONFIGURACIÓN DE FRANJAS HORARIAS ===
  timeSlots: {
    slots: {
      morning: {
        name: 'Mañana',
        emoji: '🌅',
        startTime: '06:00',
        endTime: '12:00',
        color: '#FEF3C7'
      },
      afternoon: {
        name: 'Tarde',
        emoji: '☀️',
        startTime: '12:00',
        endTime: '18:00',
        color: '#FED7AA'
      },
      evening: {
        name: 'Noche',
        emoji: '🌙',
        startTime: '18:00',
        endTime: '24:00',
        color: '#E0E7FF'
      }
    },
    
    // Franja por defecto
    default: 'morning',
    
    // Permitir franjas horarias personalizadas
    allowCustomSlots: true
  },

  // === CONFIGURACIÓN DE INTERFAZ ===
  ui: {
    // Vista por defecto al abrir el plugin
    defaultView: 'grid', // 'grid', 'calendar', 'list'
    
    // Número de videos por página en vista de lista
    itemsPerPage: 20,
    
    // Mostrar vista previa de miniaturas
    showThumbnails: true,
    
    // Tema de colores personalizado
    customTheme: {
      primaryColor: '#3B82F6',
      accentColor: '#10B981',
      warningColor: '#F59E0B',
      errorColor: '#EF4444'
    },
    
    // Configuración del calendario
    calendar: {
      // Mostrar números de semana
      showWeekNumbers: false,
      
      // Resaltar fines de semana
      highlightWeekends: true,
      
      // Mostrar eventos de otros calendarios de Atlas
      showAtlasEvents: true
    },
    
    // Configuración de notificaciones
    notifications: {
      // Mostrar notificaciones de deadlines
      deadlineNotifications: true,
      
      // Días de anticipación para notificaciones
      notifyDaysBefore: 3,
      
      // Mostrar notificaciones de estado cambiado
      statusChangeNotifications: true
    }
  },

  // === CONFIGURACIÓN DE EXPORTACIÓN ===
  export: {
    // Formatos de exportación disponibles
    formats: ['json', 'csv', 'xlsx'],
    
    // Formato por defecto
    defaultFormat: 'csv',
    
    // Incluir metadatos en exportaciones
    includeMetadata: true,
    
    // Incluir ingresos en exportaciones
    includeEarnings: true,
    
    // Plantillas personalizadas para exportación CSV
    csvTemplates: {
      basic: ['title', 'date', 'status', 'platform'],
      detailed: ['title', 'description', 'date', 'timeSlot', 'status', 'platform', 'duration', 'earnings'],
      production: ['title', 'date', 'status', 'scriptStatus', 'editingProgress', 'notes']
    }
  },

  // === CONFIGURACIÓN DE BULK OPERATIONS ===
  bulkOperations: {
    // Límite máximo de videos en operaciones en lote
    maxBulkSize: 50,
    
    // Patrones de nombres predefinidos
    namePatterns: [
      'Video #{{number}}',
      '{{baseName}} - Episodio {{number}}',
      '{{baseName}} Part {{number}}',
      'Tutorial {{number}}: {{baseName}}'
    ],
    
    // Frecuencias disponibles
    frequencies: {
      daily: { name: 'Diario', interval: 1 },
      weekly: { name: 'Semanal', interval: 7 },
      biweekly: { name: 'Quincenal', interval: 14 },
      monthly: { name: 'Mensual', interval: 30 }
    }
  },

  // === CONFIGURACIÓN DE INTEGRACIÓN ===
  integrations: {
    // Integración con calendario de Atlas
    atlasCalendar: {
      enabled: true,
      syncEvents: true,
      showIndicators: true,
      indicatorStyle: 'badge' // 'badge', 'dot', 'number'
    },
    
    // APIs externas (configuración para futuras integraciones)
    apis: {
      youtube: {
        enabled: false,
        apiKey: null,
        syncMetadata: false
      },
      googleCalendar: {
        enabled: false,
        calendarId: null,
        syncDeadlines: false
      }
    }
  },

  // === CONFIGURACIÓN DE RENDIMIENTO ===
  performance: {
    // Límite de videos cargados en memoria
    videoLoadLimit: 200,
    
    // Intervalo de auto-guardado (segundos, 0 para desactivar)
    autoSaveInterval: 30,
    
    // Caché de estadísticas (minutos)
    statsCacheTime: 5,
    
    // Lazy loading para miniaturas
    lazyLoadThumbnails: true
  },

  // === CONFIGURACIÓN DE DEBUGGING ===
  debug: {
    // Activar logs de debug
    enabled: false,
    
    // Nivel de logs ('error', 'warn', 'info', 'debug')
    logLevel: 'warn',
    
    // Mostrar información de rendimiento
    showPerformanceInfo: false,
    
    // Guardar logs en storage para debugging
    persistLogs: false
  },

  // === CONFIGURACIÓN DE VALIDACIÓN ===
  validation: {
    // Longitudes máximas
    maxLengths: {
      title: 100,
      description: 500,
      tags: 10,
      notes: 1000
    },
    
    // Reglas de validación personalizadas
    rules: {
      // Requiere título para todos los videos
      requireTitle: true,
      
      // Requiere fecha para videos programados
      requireDate: true,
      
      // Validar formato de URLs de miniatura
      validateThumbnailUrls: true,
      
      // Prevenir fechas en el pasado para nuevos videos
      preventPastDates: true
    }
  },

  // === PLANTILLAS PREDEFINIDAS ===
  templates: {
    // Plantillas de videos predefinidas
    videoTemplates: [
      {
        name: 'Tutorial',
        title: 'Tutorial: {{topic}}',
        duration: 15,
        tags: ['tutorial', 'how-to'],
        platform: 'youtube',
        status: 'planned'
      },
      {
        name: 'Review',
        title: 'Review: {{product}}',
        duration: 12,
        tags: ['review', 'opinion'],
        platform: 'youtube',
        status: 'planned'
      },
      {
        name: 'Vlog',
        title: 'Vlog: {{theme}}',
        duration: 8,
        tags: ['vlog', 'lifestyle'],
        platform: 'youtube',
        status: 'planned'
      }
    ],
    
    // Plantillas de series
    seriesTemplates: [
      {
        name: 'Curso Completo',
        baseName: 'Curso de {{subject}}',
        episodeCount: 10,
        frequency: 'weekly',
        platform: 'youtube'
      },
      {
        name: 'Serie Semanal',
        baseName: '{{title}} - Semana',
        episodeCount: 4,
        frequency: 'weekly',
        platform: 'youtube'
      }
    ]
  }
};

// === FUNCIONES DE CONFIGURACIÓN ===

/**
 * Aplica configuración personalizada sobre la configuración por defecto
 * @param {Object} defaultConfig - Configuración por defecto del plugin
 * @param {Object} customConfig - Configuración personalizada
 * @returns {Object} Configuración final combinada
 */
export function mergeConfig(defaultConfig, customConfig) {
  return {
    ...defaultConfig,
    ...customConfig,
    // Merge profundo para objetos anidados
    platforms: { ...defaultConfig.platforms, ...customConfig.platforms },
    currencies: { ...defaultConfig.currencies, ...customConfig.currencies },
    ui: { ...defaultConfig.ui, ...customConfig.ui }
  };
}

/**
 * Valida la configuración personalizada
 * @param {Object} config - Configuración a validar
 * @returns {Object} Resultado de validación { valid: boolean, errors: string[] }
 */
export function validateConfig(config) {
  const errors = [];
  
  // Validar moneda por defecto
  if (config.currencies && config.currencies.default && 
      !config.currencies.supported[config.currencies.default]) {
    errors.push(`Moneda por defecto '${config.currencies.default}' no está en la lista de monedas soportadas`);
  }
  
  // Validar plataforma por defecto
  if (config.platforms && config.platforms.default && 
      !config.platforms.available[config.platforms.default]) {
    errors.push(`Plataforma por defecto '${config.platforms.default}' no está en la lista de plataformas disponibles`);
  }
  
  // Validar límites de bulk operations
  if (config.bulkOperations && config.bulkOperations.maxBulkSize > 100) {
    errors.push('El límite máximo de bulk operations no puede ser mayor a 100');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

// Exportar configuración por defecto
export default CUSTOM_CONFIG;