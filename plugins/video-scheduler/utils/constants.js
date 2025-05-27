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
  [VIDEO_STACKABLE_STATUS.QUESTION]: "❓",
  [VIDEO_STACKABLE_STATUS.WARNING]: "❗",
};

export const DEFAULT_SLOT_VIDEO_STRUCTURE = {
  id: null,
  name: '',
  description: '',
  status: VIDEO_MAIN_STATUS.PENDING,
  subStatus: null,
  stackableStatuses: [], 
  createdAt: null, // Opcional: para rastrear cuándo se creó
  updatedAt: null  // Opcional: para rastrear última modificación
};

export const DEFAULT_DAILY_INCOME_STRUCTURE = {
  amount: 0,
  currency: 'USD', 
  payer: '',
  status: 'pending' // 'pending' o 'paid'
};

export const CURRENCIES = ['USD', 'EUR', 'ARS']; 

export const isDateInPast = (dateStr) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Compara solo con el inicio del día actual
    
    // Asegurarse que dateStr esté en formato YYYY-MM-DD
    const parts = dateStr.split('-');
    if (parts.length !== 3) return false; // Formato inválido

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10); // Mes es 1-12
    const day = parseInt(parts[2], 10);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return false; // Partes no numéricas

    const checkDate = new Date(year, month - 1, day); // Mes en Date es 0-11
    checkDate.setHours(0, 0, 0, 0); 
    
    return checkDate < today;
  } catch (error) {
    console.error('Error en isDateInPast:', error, 'dateStr:', dateStr);
    return false; // Considerar como no pasado en caso de error
  }
};

export const VALID_PAST_STATUSES = [
  VIDEO_MAIN_STATUS.EMPTY,
  VIDEO_MAIN_STATUS.PUBLISHED // Un video publicado puede estar en el pasado
];

export const INVALID_PAST_STATUSES = [
  VIDEO_MAIN_STATUS.DEVELOPMENT,
  VIDEO_MAIN_STATUS.PRODUCTION,
  // PENDING se maneja por transición automática a EMPTY en el pasado
];
