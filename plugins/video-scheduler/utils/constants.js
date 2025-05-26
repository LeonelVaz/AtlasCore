// video-scheduler/utils/constants.js

export const DEFAULT_VIDEO_STRUCTURE = {
  id: null,
  title: 'Nuevo Video',
  description: '',
  slot: {
    date: null, // YYYY-MM-DD string
    timeSlot: 'morning', // 'morning', 'afternoon', 'evening'
  },
  status: 'planned',
  subStatus: null,
  platform: 'youtube',
  duration: 10, // minutos
  tags: [],
  thumbnail: '',
  
  // Metadatos de Producción
  productionMetadata: {
    scriptStatus: 'pending', // 'pending', 'draft', 'review', 'approved'
    scriptLink: '',
    recordingDate: null,
    recordingLocation: '',
    editor: '',
    editingProgress: 0, // 0-100
    thumbnailArtist: '',
    notes: '',
  },

  // Ingresos del Video
  earnings: {
    currency: 'USD',
    total: 0,
    breakdown: {},
    lastUpdated: null,
  },

  // Timestamps
  publishedAt: null,
  createdAt: null,
  updatedAt: null,

  // Enlace al evento de Atlas (opcional)
  atlasEventId: null
};

export const VIDEO_STATUS = {
  PLANNED: 'planned',
  SCRIPTING: 'scripting',
  RECORDING: 'recording',
  EDITING: 'editing',
  REVIEW: 'review',
  READY_TO_PUBLISH: 'ready_to_publish',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

export const VIDEO_TIME_SLOTS = ['morning', 'afternoon', 'evening'];

export const CURRENCIES = {
  USD: { symbol: '$', name: 'Dólar Estadounidense' },
  EUR: { symbol: '€', name: 'Euro' },
  ARS: { symbol: '$', name: 'Peso Argentino' },
  MXN: { symbol: '$', name: 'Peso Mexicano' },
  COP: { symbol: '$', name: 'Peso Colombiano' },
  CLP: { symbol: '$', name: 'Peso Chileno' },
  BRL: { symbol: 'R$', name: 'Real Brasileño' },
  GBP: { symbol: '£', name: 'Libra Esterlina' },
  JPY: { symbol: '¥', name: 'Yen Japonés' },
  CAD: { symbol: 'C$', name: 'Dólar Canadiense' }
};

export const STATUS_EMOJIS = {
  planned: '📋',
  scripting: '✍️',
  recording: '🎬',
  editing: '✂️',
  review: '👀',
  ready_to_publish: '📤',
  published: '✅',
  archived: '📦'
};

export const PLATFORM_ICONS = {
  youtube: '📺',
  vimeo: '🎥',
  tiktok: '📱',
  instagram: '📷',
  facebook: '📘',
  twitter: '🐦',
  twitch: '🎮'
};

export const TIME_SLOT_LABELS = {
  morning: 'Mañana',
  afternoon: 'Tarde',
  evening: 'Noche'
};

export const SCRIPT_STATUS_OPTIONS = {
  pending: 'Pendiente',
  draft: 'Borrador',
  review: 'En Revisión',
  approved: 'Aprobado'
};

export const PRODUCTION_PHASES = {
  preproduction: 'Pre-producción',
  production: 'Producción',
  postproduction: 'Post-producción',
  distribution: 'Distribución'
};

// Configuración por defecto para bulk add
export const BULK_ADD_DEFAULTS = {
  frequency: 'daily',
  startNumber: 1,
  timeSlot: 'morning',
  status: VIDEO_STATUS.PLANNED
};

// Límites del sistema
export const LIMITS = {
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_TAGS: 10,
  MAX_BULK_VIDEOS: 30,
  MIN_DURATION: 1,
  MAX_DURATION: 600 // 10 horas
};

// Formatos de fecha
export const DATE_FORMATS = {
  ISO_DATE: 'YYYY-MM-DD',
  DISPLAY_DATE: 'DD/MM/YYYY',
  FULL_DATE: 'DD de MMMM de YYYY'
};

// Configuración de exportación
export const EXPORT_FORMATS = {
  JSON: 'json',
  CSV: 'csv',
  EXCEL: 'xlsx'
};

// Tipos de reportes
export const REPORT_TYPES = {
  PRODUCTION_STATUS: 'production_status',
  EARNINGS: 'earnings',
  SCHEDULE: 'schedule',
  PLATFORM_DISTRIBUTION: 'platform_distribution'
};

// Configuración de notificaciones
export const NOTIFICATION_TYPES = {
  VIDEO_CREATED: 'video_created',
  VIDEO_UPDATED: 'video_updated',
  VIDEO_DELETED: 'video_deleted',
  STATUS_CHANGED: 'status_changed',
  EARNINGS_ADDED: 'earnings_added',
  BULK_OPERATION: 'bulk_operation'
};