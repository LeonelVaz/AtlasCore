// video-scheduler/utils/videoUtils.js
import { CURRENCIES, STATUS_EMOJIS, VIDEO_STATUS, TIME_SLOT_LABELS } from './constants.js';

/**
 * Formatea una cantidad monetaria con su símbolo de moneda
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Código de moneda (USD, EUR, etc.)
 * @returns {string} Cantidad formateada
 */
export function formatCurrency(amount, currency = 'USD') {
  const currencyInfo = CURRENCIES[currency] || CURRENCIES.USD;
  const formattedAmount = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  
  return `${currencyInfo.symbol}${formattedAmount}`;
}

/**
 * Convierte una cantidad de una moneda a otra usando las tasas de cambio
 * @param {number} amount - Cantidad a convertir
 * @param {string} fromCurrency - Moneda origen
 * @param {string} toCurrency - Moneda destino
 * @param {Object} currencyRates - Objeto con las tasas de cambio
 * @returns {number} Cantidad convertida
 */
export function convertCurrency(amount, fromCurrency, toCurrency, currencyRates) {
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = currencyRates[fromCurrency] || 1;
  const toRate = currencyRates[toCurrency] || 1;
  
  // Convertir a moneda base (USD) y luego a moneda destino
  const amountInBase = amount / fromRate;
  return amountInBase * toRate;
}

/**
 * Calcula el total de ingresos de una lista de videos
 * @param {Array} videos - Lista de videos
 * @param {Object} currencyRates - Tasas de cambio
 * @param {string} targetCurrency - Moneda de destino para el cálculo
 * @returns {Object} Reporte de ingresos
 */
export function calculateTotalEarnings(videos, currencyRates, targetCurrency = 'USD') {
  const report = {
    totalInTargetCurrency: 0,
    totalByCurrency: {},
    videoCount: 0,
    averageEarningsPerVideo: 0
  };

  videos.forEach(function(video) {
    if (video.earnings && video.earnings.total > 0) {
      const videoCurrency = video.earnings.currency || targetCurrency;
      const amount = video.earnings.total;
      
      // Sumar por moneda original
      if (!report.totalByCurrency[videoCurrency]) {
        report.totalByCurrency[videoCurrency] = 0;
      }
      report.totalByCurrency[videoCurrency] += amount;
      
      // Convertir a moneda objetivo y sumar al total
      const convertedAmount = convertCurrency(amount, videoCurrency, targetCurrency, currencyRates);
      report.totalInTargetCurrency += convertedAmount;
      
      report.videoCount++;
    }
  });

  if (report.videoCount > 0) {
    report.averageEarningsPerVideo = report.totalInTargetCurrency / report.videoCount;
  }

  return report;
}

/**
 * Cuenta videos por estado
 * @param {Array} videos - Lista de videos
 * @returns {Object} Conteo por estado
 */
export function getVideoCountByStatus(videos) {
  const counts = {};
  
  // Inicializar todos los estados con 0
  Object.values(VIDEO_STATUS).forEach(function(status) {
    counts[status] = 0;
  });
  
  // Contar videos por estado
  videos.forEach(function(video) {
    if (counts.hasOwnProperty(video.status)) {
      counts[video.status]++;
    }
  });
  
  return counts;
}

/**
 * Obtiene el emoji correspondiente a un estado de video
 * @param {string} status - Estado del video
 * @returns {string} Emoji del estado
 */
export function getStatusEmoji(status) {
  return STATUS_EMOJIS[status] || '❓';
}

/**
 * Obtiene la etiqueta legible de una franja horaria
 * @param {string} timeSlot - Franja horaria
 * @returns {string} Etiqueta legible
 */
export function getTimeSlotLabel(timeSlot) {
  return TIME_SLOT_LABELS[timeSlot] || timeSlot;
}

/**
 * Formatea una fecha para mostrar
 * @param {string|Date} date - Fecha a formatear
 * @param {string} format - Formato deseado ('short', 'medium', 'long')
 * @returns {string} Fecha formateada
 */
export function formatDate(date, format = 'medium') {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('es-ES');
    case 'long':
      return dateObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'medium':
    default:
      return dateObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
  }
}

/**
 * Calcula la duración total de una lista de videos
 * @param {Array} videos - Lista de videos
 * @returns {Object} Duración total en minutos y horas
 */
export function calculateTotalDuration(videos) {
  const totalMinutes = videos.reduce(function(total, video) {
    return total + (video.duration || 0);
  }, 0);
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return {
    totalMinutes: totalMinutes,
    hours: hours,
    minutes: minutes,
    formatted: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  };
}

/**
 * Filtra videos por criterios múltiples
 * @param {Array} videos - Lista de videos
 * @param {Object} filters - Filtros a aplicar
 * @returns {Array} Videos filtrados
 */
export function filterVideos(videos, filters) {
  return videos.filter(function(video) {
    // Filtro por estado
    if (filters.status && video.status !== filters.status) {
      return false;
    }
    
    // Filtro por plataforma
    if (filters.platform && video.platform !== filters.platform) {
      return false;
    }
    
    // Filtro por rango de fechas
    if (filters.dateRange) {
      const videoDate = video.slot.date;
      if (videoDate < filters.dateRange.start || videoDate > filters.dateRange.end) {
        return false;
      }
    }
    
    // Filtro por franja horaria
    if (filters.timeSlot && video.slot.timeSlot !== filters.timeSlot) {
      return false;
    }
    
    // Filtro por búsqueda de texto
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchableText = [
        video.title,
        video.description,
        ...video.tags
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(searchTerm)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Ordena videos por diferentes criterios
 * @param {Array} videos - Lista de videos
 * @param {string} sortBy - Criterio de ordenamiento
 * @param {string} order - Orden ('asc' o 'desc')
 * @returns {Array} Videos ordenados
 */
export function sortVideos(videos, sortBy = 'date', order = 'asc') {
  const sortedVideos = [...videos];
  
  sortedVideos.sort(function(a, b) {
    let valueA, valueB;
    
    switch (sortBy) {
      case 'date':
        valueA = new Date(a.slot.date || '1970-01-01');
        valueB = new Date(b.slot.date || '1970-01-01');
        break;
      case 'title':
        valueA = a.title.toLowerCase();
        valueB = b.title.toLowerCase();
        break;
      case 'status':
        valueA = a.status;
        valueB = b.status;
        break;
      case 'duration':
        valueA = a.duration || 0;
        valueB = b.duration || 0;
        break;
      case 'earnings':
        valueA = a.earnings?.total || 0;
        valueB = b.earnings?.total || 0;
        break;
      case 'created':
        valueA = new Date(a.createdAt || '1970-01-01');
        valueB = new Date(b.createdAt || '1970-01-01');
        break;
      default:
        return 0;
    }
    
    if (valueA < valueB) {
      return order === 'asc' ? -1 : 1;
    }
    if (valueA > valueB) {
      return order === 'asc' ? 1 : -1;
    }
    return 0;
  });
  
  return sortedVideos;
}

/**
 * Valida los datos de un video
 * @param {Object} videoData - Datos del video a validar
 * @returns {Object} Resultado de la validación
 */
export function validateVideoData(videoData) {
  const errors = [];
  
  // Validar título
  if (!videoData.title || videoData.title.trim().length === 0) {
    errors.push('El título es obligatorio');
  } else if (videoData.title.length > 100) {
    errors.push('El título no puede tener más de 100 caracteres');
  }
  
  // Validar fecha
  if (!videoData.slot?.date) {
    errors.push('La fecha es obligatoria');
  } else {
    const date = new Date(videoData.slot.date);
    if (isNaN(date.getTime())) {
      errors.push('La fecha no es válida');
    }
  }
  
  // Validar duración
  if (videoData.duration !== undefined) {
    const duration = parseInt(videoData.duration);
    if (isNaN(duration) || duration < 1 || duration > 600) {
      errors.push('La duración debe estar entre 1 y 600 minutos');
    }
  }
  
  // Validar estado
  if (videoData.status && !Object.values(VIDEO_STATUS).includes(videoData.status)) {
    errors.push('El estado no es válido');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Genera un ID único para un video
 * @returns {string} ID único
 */
export function generateVideoId() {
  return 'video-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

/**
 * Calcula estadísticas de producción
 * @param {Array} videos - Lista de videos
 * @returns {Object} Estadísticas de producción
 */
export function calculateProductionStats(videos) {
  const stats = {
    total: videos.length,
    published: 0,
    inProduction: 0,
    planned: 0,
    completionRate: 0,
    averageDuration: 0,
    totalDuration: 0
  };
  
  let totalDuration = 0;
  
  videos.forEach(function(video) {
    totalDuration += video.duration || 0;
    
    switch (video.status) {
      case VIDEO_STATUS.PUBLISHED:
        stats.published++;
        break;
      case VIDEO_STATUS.PLANNED:
        stats.planned++;
        break;
      default:
        stats.inProduction++;
        break;
    }
  });
  
  stats.totalDuration = totalDuration;
  stats.averageDuration = videos.length > 0 ? totalDuration / videos.length : 0;
  stats.completionRate = videos.length > 0 ? (stats.published / videos.length) * 100 : 0;
  
  return stats;
}

/**
 * Exporta videos a formato CSV
 * @param {Array} videos - Lista de videos
 * @returns {string} Contenido CSV
 */
export function exportToCSV(videos) {
  const headers = [
    'ID',
    'Título',
    'Descripción',
    'Fecha',
    'Franja Horaria',
    'Estado',
    'Plataforma',
    'Duración (min)',
    'Ingresos Total',
    'Moneda',
    'Fecha Creación'
  ];
  
  const csvContent = [headers.join(',')];
  
  videos.forEach(function(video) {
    const row = [
      video.id,
      '"' + (video.title || '').replace(/"/g, '""') + '"',
      '"' + (video.description || '').replace(/"/g, '""') + '"',
      video.slot.date || '',
      video.slot.timeSlot || '',
      video.status || '',
      video.platform || '',
      video.duration || 0,
      video.earnings?.total || 0,
      video.earnings?.currency || '',
      video.createdAt || ''
    ];
    
    csvContent.push(row.join(','));
  });
  
  return csvContent.join('\n');
}

/**
 * Genera fechas para videos en lote
 * @param {Object} options - Opciones para generar fechas
 * @returns {Array} Lista de fechas generadas
 */
export function generateBulkDates(options) {
  const { startDate, count, frequency, selectedDays } = options;
  const dates = [];
  let currentDate = new Date(startDate);
  
  for (let i = 0; i < count; i++) {
    if (frequency === 'daily') {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (frequency === 'weekly') {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 7);
    } else if (frequency === 'custom' && selectedDays && selectedDays.length > 0) {
      // Para días específicos de la semana
      while (dates.length < count) {
        const dayOfWeek = currentDate.getDay();
        if (selectedDays.includes(dayOfWeek)) {
          dates.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      break;
    }
  }
  
  return dates;
}