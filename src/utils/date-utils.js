/**
 * Utilidades para manejo de fechas en Atlas
 */

/**
 * Obtiene el primer día de la semana (domingo) para una fecha dada
 */
export function getFirstDayOfWeek(date) {
  const newDate = new Date(date);
  const day = newDate.getDay(); // 0 = Domingo, 1 = Lunes, ...
  newDate.setDate(newDate.getDate() - day);
  return newDate;
}

/**
 * Obtiene el último día de la semana (sábado) para una fecha dada
 */
export function getLastDayOfWeek(date) {
  const firstDay = getFirstDayOfWeek(date);
  const lastDay = new Date(firstDay);
  lastDay.setDate(lastDay.getDate() + 6);
  return lastDay;
}

/**
 * Formatea una fecha en formato localizado
 */
export function formatDate(date, options = {}, locale = "es-ES") {
  return new Date(date).toLocaleDateString(locale, options);
}

/**
 * Formatea una hora en formato HH:MM
 */
export function formatTime(hour, minute = 0) {
  return `${hour.toString().padStart(2, "0")}:${minute
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Formatea la hora para mostrar (00:00 formato)
 */
export function formatHour(hour) {
  return `${hour.toString().padStart(2, "0")}:00`;
}

/**
 * Verifica si dos rangos de fecha/hora se solapan
 */
export function isTimeOverlapping(start1, end1, start2, end2) {
  return start1 < end2 && start2 < end1;
}

/**
 * Añade días a una fecha
 */
export function addDays(date, days) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}

/**
 * Genera un array con los días de una semana
 */
export function generateWeekDays(date) {
  const firstDay = getFirstDayOfWeek(date);
  const days = [];

  for (let i = 0; i < 7; i++) {
    days.push(addDays(firstDay, i));
  }

  return days;
}

/**
 * Determina si una fecha está en el pasado
 */
export function isPastDate(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) < today;
}

/**
 * Determina si dos fechas son el mismo día
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

/**
 * Formatea una fecha para input datetime-local
 */
export function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
