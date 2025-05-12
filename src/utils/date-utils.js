/**
 * Utilidades para manejo de fechas en Atlas
 */

/**
 * Obtiene el primer día de la semana (domingo) para una fecha dada
 * @param {Date} date - Fecha de referencia
 * @returns {Date} - Primer día de la semana (domingo)
 */
export function getFirstDayOfWeek(date) {
  const newDate = new Date(date);
  const day = newDate.getDay(); // 0 = Domingo, 1 = Lunes, ...
  newDate.setDate(newDate.getDate() - day);
  return newDate;
}

/**
 * Obtiene el último día de la semana (sábado) para una fecha dada
 * @param {Date} date - Fecha de referencia
 * @returns {Date} - Último día de la semana (sábado)
 */
export function getLastDayOfWeek(date) {
  const firstDay = getFirstDayOfWeek(date);
  const lastDay = new Date(firstDay);
  lastDay.setDate(lastDay.getDate() + 6);
  return lastDay;
}

/**
 * Formatea una fecha en formato localizado
 * @param {Date} date - Fecha a formatear
 * @param {Object} options - Opciones de formato (ver Intl.DateTimeFormat)
 * @param {string} locale - Configuración regional (default: 'es-ES')
 * @returns {string} - Fecha formateada
 */
export function formatDate(date, options = {}, locale = 'es-ES') {
  return new Date(date).toLocaleDateString(locale, options);
}

/**
 * Formatea una hora en formato HH:MM
 * @param {number} hour - Hora (0-23)
 * @param {number} minute - Minuto (0-59)
 * @returns {string} - Hora formateada (HH:MM)
 */
export function formatTime(hour, minute = 0) {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

/**
 * Formatea la hora para mostrar (00:00 formato)
 * @param {number} hour - Hora del día (0-23)
 * @returns {string} - Formato de hora (HH:00)
 */
export function formatHour(hour) {
  return `${hour.toString().padStart(2, '0')}:00`;
}

/**
 * Verifica si dos rangos de fecha/hora se solapan
 * @param {Date} start1 - Fecha/hora de inicio del primer evento
 * @param {Date} end1 - Fecha/hora de fin del primer evento
 * @param {Date} start2 - Fecha/hora de inicio del segundo evento
 * @param {Date} end2 - Fecha/hora de fin del segundo evento
 * @returns {boolean} - true si los rangos se solapan
 */
export function isTimeOverlapping(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}

/**
 * Añade días a una fecha
 * @param {Date} date - Fecha inicial
 * @param {number} days - Número de días a añadir (puede ser negativo)
 * @returns {Date} - Nueva fecha
 */
export function addDays(date, days) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

/**
 * Genera un array con los días de una semana
 * @param {Date} date - Fecha de referencia
 * @returns {Date[]} - Array con los 7 días de la semana
 */
export function generateWeekDays(date) {
  const firstDay = getFirstDayOfWeek(date);
  const days = [];
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(firstDay);
    day.setDate(day.getDate() + i);
    days.push(day);
  }
  
  return days;
}

/**
 * Determina si una fecha está en el pasado
 * @param {Date} date - Fecha a verificar
 * @returns {boolean} - true si la fecha está en el pasado
 */
export function isPastDate(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) < today;
}

/**
 * Determina si dos fechas son el mismo día
 * @param {Date} date1 - Primera fecha
 * @param {Date} date2 - Segunda fecha
 * @returns {boolean} - true si las fechas corresponden al mismo día
 */
export function isSameDay(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// Añadir esta función al final del archivo
/**
 * Formatea una fecha para input datetime-local
 * @param {Date} date - Fecha a formatear
 * @returns {string} - Fecha formateada en formato "YYYY-MM-DDTHH:MM"
 */
export function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}