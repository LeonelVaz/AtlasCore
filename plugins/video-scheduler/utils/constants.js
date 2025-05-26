// video-scheduler/utils/constants.js

export const VIDEO_MAIN_STATUS = {
  PENDING: 'pending',         // 📅 Slot disponible
  EMPTY: 'empty',             // ⬜ Slot intencionalmente vacío
  DEVELOPMENT: 'development', // 🟦 En desarrollo inicial
  PRODUCTION: 'production',   // 🟨 En producción activa
  PUBLISHED: 'published'      // 🟩 Video publicado
  // Considerar 'ARCHIVED' en el futuro
};

export const VIDEO_SUB_STATUS = {
  // Sub-estados para DEVELOPMENT
  REC: 'rec',                 // ☕ Grabando (asociado a DEVELOPMENT)

  // Sub-estados para PRODUCTION
  EDITING: 'editing',         // 💻 Edición
  THUMBNAIL: 'thumbnail',     // ✏️ Creando miniatura
  SCHEDULING_POST: 'scheduling_post', // 🕰️ Agendando publicación en plataforma

  // Sub-estados para PUBLISHED
  SCHEDULED: 'scheduled'      // 🌐 Publicación ya agendada en plataforma
};

// Mapeo de sub-estados a sus estados principales para validación o lógica
export const SUB_STATUS_MAIN_MAP = {
  [VIDEO_SUB_STATUS.REC]: VIDEO_MAIN_STATUS.DEVELOPMENT,
  [VIDEO_SUB_STATUS.EDITING]: VIDEO_MAIN_STATUS.PRODUCTION,
  [VIDEO_SUB_STATUS.THUMBNAIL]: VIDEO_MAIN_STATUS.PRODUCTION,
  [VIDEO_SUB_STATUS.SCHEDULING_POST]: VIDEO_MAIN_STATUS.PRODUCTION,
  [VIDEO_SUB_STATUS.SCHEDULED]: VIDEO_MAIN_STATUS.PUBLISHED,
};

// Mapeo de qué sub-estados son válidos para cada estado principal
export const VALID_SUB_STATUSES_FOR_MAIN = {
  [VIDEO_MAIN_STATUS.DEVELOPMENT]: [VIDEO_SUB_STATUS.REC],
  [VIDEO_MAIN_STATUS.PRODUCTION]: [VIDEO_SUB_STATUS.EDITING, VIDEO_SUB_STATUS.THUMBNAIL, VIDEO_SUB_STATUS.SCHEDULING_POST],
  [VIDEO_MAIN_STATUS.PUBLISHED]: [VIDEO_SUB_STATUS.SCHEDULED],
  [VIDEO_MAIN_STATUS.PENDING]: [],
  [VIDEO_MAIN_STATUS.EMPTY]: [],
};

// Emojis para todos los estados y sub-estados
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

// Estructura base para un objeto Video (actualizada)
export const DEFAULT_VIDEO_STRUCTURE = {
  id: null,
  title: '', // Un slot PENDING o EMPTY no tendrá título inicialmente
  description: '',
  status: VIDEO_MAIN_STATUS.PENDING, // Estado principal
  subStatus: null,                  // Sub-estado (si aplica)
  // slot: { date: null, timeSlot: null }, // Se añadirá en etapas de calendario
  createdAt: null,
  updatedAt: null,
};