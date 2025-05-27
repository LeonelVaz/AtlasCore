// video-scheduler/utils/constants.js

export const VIDEO_MAIN_STATUS = {
  PENDING: 'pending',
  EMPTY: 'empty',
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  PUBLISHED: 'published'
};

export const VIDEO_SUB_STATUS = {
  REC: 'rec',
  EDITING: 'editing',
  THUMBNAIL: 'thumbnail',
  SCHEDULING_POST: 'scheduling_post',
  SCHEDULED: 'scheduled'
};

// Nuevos sub-estados apilables
export const VIDEO_STACKABLE_STATUS = {
  QUESTION: 'question',    // ❓ - Duda del usuario
  WARNING: 'warning'       // ❗ - Alerta del sistema
};

export const SUB_STATUS_MAIN_MAP = {
  [VIDEO_SUB_STATUS.REC]: VIDEO_MAIN_STATUS.DEVELOPMENT,
  [VIDEO_SUB_STATUS.EDITING]: VIDEO_MAIN_STATUS.PRODUCTION,
  [VIDEO_SUB_STATUS.THUMBNAIL]: VIDEO_MAIN_STATUS.PRODUCTION,
  [VIDEO_SUB_STATUS.SCHEDULING_POST]: VIDEO_MAIN_STATUS.PRODUCTION,
  [VIDEO_SUB_STATUS.SCHEDULED]: VIDEO_MAIN_STATUS.PUBLISHED,
};

export const VALID_SUB_STATUSES_FOR_MAIN = {
  [VIDEO_MAIN_STATUS.DEVELOPMENT]: [VIDEO_SUB_STATUS.REC],
  [VIDEO_MAIN_STATUS.PRODUCTION]: [VIDEO_SUB_STATUS.EDITING, VIDEO_SUB_STATUS.THUMBNAIL, VIDEO_SUB_STATUS.SCHEDULING_POST],
  [VIDEO_MAIN_STATUS.PUBLISHED]: [VIDEO_SUB_STATUS.SCHEDULED],
  [VIDEO_MAIN_STATUS.PENDING]: [],
  [VIDEO_MAIN_STATUS.EMPTY]: [],
};

export const STATUS_EMOJIS = {
  [VIDEO_MAIN_STATUS.PENDING]: "📅",
  [VIDEO_MAIN_STATUS.EMPTY]: "⬜",
  [VIDEO_MAIN_STATUS.DEVELOPMENT]: "🟦",
  [VIDEO_MAIN_STATUS.PRODUCTION]: "🟨",
  [VIDEO_MAIN_STATUS.PUBLISHED]: "🟩",
  [VIDEO_SUB_STATUS.REC]: "☕",
  [VIDEO_SUB_STATUS.EDITING]: "💻",
  [VIDEO_SUB_STATUS.THUMBNAIL]: "✏️",
  [VIDEO_SUB_STATUS.SCHEDULING_POST]: "🕰️",
  [VIDEO_SUB_STATUS.SCHEDULED]: "🌐",
  // Nuevos sub-estados apilables
  [VIDEO_STACKABLE_STATUS.QUESTION]: "❓",
  [VIDEO_STACKABLE_STATUS.WARNING]: "❗",
};

// Estructura actualizada para incluir sub-estados apilables
export const DEFAULT_SLOT_VIDEO_STRUCTURE = {
  id: null, // Se generará como 'day-slotIndex'
  name: '',
  description: '',
  status: VIDEO_MAIN_STATUS.PENDING,
  subStatus: null,
  stackableStatuses: [], // Array para sub-estados apilables [❓, ❗]
};

export const DEFAULT_DAILY_INCOME_STRUCTURE = {
  amount: 0,
  currency: 'USD', // Moneda por defecto
  payer: '',
  status: 'pending' // 'pending' o 'paid'
};

export const CURRENCIES = ['USD', 'EUR', 'ARS']; // Simple array para selectores

// Función helper para verificar si una fecha está en el pasado
export const isDateInPast = (dateStr) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) {
      return false;
    }
    
    const checkDate = new Date(year, month - 1, day);
    checkDate.setHours(0, 0, 0, 0);
    
    return checkDate < today;
  } catch (error) {
    console.error('Error en isDateInPast:', error, 'dateStr:', dateStr);
    return false;
  }
};

// Estados que tienen sentido en el pasado
export const VALID_PAST_STATUSES = [
  VIDEO_MAIN_STATUS.EMPTY,
  VIDEO_MAIN_STATUS.PUBLISHED
];

// Estados que NO tienen sentido en el pasado (deberían tener ❗)
export const INVALID_PAST_STATUSES = [
  VIDEO_MAIN_STATUS.DEVELOPMENT,
  VIDEO_MAIN_STATUS.PRODUCTION
];