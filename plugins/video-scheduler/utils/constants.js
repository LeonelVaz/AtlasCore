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
};

// Para la lógica de tu app vanilla, un video en un slot tiene una estructura simple
export const DEFAULT_SLOT_VIDEO_STRUCTURE = {
  id: null, // Se generará como 'day-slotIndex'
  name: '',
  description: '',
  status: VIDEO_MAIN_STATUS.PENDING,
  subStatus: null,
};

export const DEFAULT_DAILY_INCOME_STRUCTURE = {
  amount: 0,
  currency: 'USD', // Moneda por defecto
  payer: '',
  status: 'pending' // 'pending' o 'paid'
};

export const CURRENCIES = ['USD', 'EUR', 'ARS']; // Simple array para selectores