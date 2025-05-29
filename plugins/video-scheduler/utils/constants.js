// video-scheduler/utils/constants.js

export const VIDEO_MAIN_STATUS = {
  PENDING: "pending",
  EMPTY: "empty",
  DEVELOPMENT: "development",
  PRODUCTION: "production",
  PUBLISHED: "published",
};

export const VIDEO_SUB_STATUS = {
  REC: "rec",
  EDITING: "editing",
  THUMBNAIL: "thumbnail",
  SCHEDULING_POST: "scheduling_post",
  SCHEDULED: "scheduled",
};

export const VIDEO_STACKABLE_STATUS = {
  QUESTION: "question",
  WARNING: "warning",
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
  [VIDEO_MAIN_STATUS.PRODUCTION]: [
    VIDEO_SUB_STATUS.EDITING,
    VIDEO_SUB_STATUS.THUMBNAIL,
    VIDEO_SUB_STATUS.SCHEDULING_POST,
  ],
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
  name: "",
  description: "", // Descripción corta (editable inline)
  status: VIDEO_MAIN_STATUS.PENDING,
  subStatus: null,
  stackableStatuses: [],
  createdAt: null,
  updatedAt: null,
  // Nuevos campos para detalles extendidos:
  detailedDescription: "", // Descripción larga
  platform: "", // ej. "YouTube", "Vimeo"
  url: "", // URL del video publicado
  duration: "", // ej. "10:35" (string)
  tags: [], // array de strings
};

export const DEFAULT_DAILY_INCOME_STRUCTURE = {
  amount: 0,
  currency: "USD",
  payer: "",
  status: "pending",
};

export const ALL_SUPPORTED_CURRENCIES = [
  { code: "USD", name: "Dólar estadounidense", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "JPY", name: "Yen japonés", symbol: "¥" },
  { code: "GBP", name: "Libra esterlina", symbol: "£" },
  { code: "AUD", name: "Dólar australiano", symbol: "$" },
  { code: "CAD", name: "Dólar canadiense", symbol: "$" },
  { code: "CHF", name: "Franco suizo", symbol: "CHF" },
  { code: "CNY", name: "Yuan chino", symbol: "CN¥" },
  { code: "HKD", name: "Dólar de Hong Kong", symbol: "$" },
  { code: "NZD", name: "Dólar neozelandés", symbol: "$" },
  { code: "SEK", name: "Corona sueca", symbol: "kr" },
  { code: "KRW", name: "Won surcoreano", symbol: "₩" },
  { code: "SGD", name: "Dólar de Singapur", symbol: "$" },
  { code: "NOK", name: "Corona noruega", symbol: "kr" },
  { code: "MXN", name: "Peso mexicano", symbol: "$" },
  { code: "INR", name: "Rupia india", symbol: "₹" },
  { code: "RUB", name: "Rublo ruso", symbol: "₽" },
  { code: "ZAR", name: "Rand sudafricano", symbol: "R" },
  { code: "BRL", name: "Real brasileño", symbol: "R$" },
  { code: "TRY", name: "Lira turca", symbol: "₺" },
  { code: "ARS", name: "Peso argentino", symbol: "$" },
  { code: "CLP", name: "Peso chileno", symbol: "$" },
  { code: "COP", name: "Peso colombiano", symbol: "$" },
  { code: "PEN", name: "Sol peruano", symbol: "S/." },
  { code: "PLN", name: "Złoty polaco", symbol: "zł" },
  { code: "THB", name: "Baht tailandés", symbol: "฿" },
  { code: "IDR", name: "Rupia indonesia", symbol: "Rp" },
  { code: "HUF", name: "Forinto húngaro", symbol: "Ft" },
  { code: "CZK", name: "Corona checa", symbol: "Kč" },
  { code: "ILS", name: "Nuevo shéquel israelí", symbol: "₪" },
  { code: "PHP", name: "Peso filipino", symbol: "₱" },
  { code: "MYR", name: "Ringgit malayo", symbol: "RM" },
];

export const getCurrencySymbol = (currencyCode) => {
  const currency = ALL_SUPPORTED_CURRENCIES.find(
    (c) => c.code === currencyCode
  );
  return currency ? currency.symbol : currencyCode;
};

export const isDateInPast = (dateStr) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parts = dateStr.split("-");
    if (parts.length !== 3) return false;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return false;
    const checkDate = new Date(year, month - 1, day);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  } catch (error) {
    console.error("Error en isDateInPast:", error, "dateStr:", dateStr);
    return false;
  }
};

export const VALID_PAST_STATUSES = [
  VIDEO_MAIN_STATUS.EMPTY,
  VIDEO_MAIN_STATUS.PUBLISHED,
];

export const INVALID_PAST_STATUSES = [
  VIDEO_MAIN_STATUS.DEVELOPMENT,
  VIDEO_MAIN_STATUS.PRODUCTION,
];
