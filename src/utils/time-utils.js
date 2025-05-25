// src/utils/time-utils.js

/**
 * Utilidades para manejar operaciones relacionadas con tiempo
 */

/**
 * Formatea el tiempo de un evento para mostrar (ej. "10:00 - 11:30")
 * Utiliza la configuración regional del navegador para el formato de hora.
 * @param {object} event - El objeto del evento, debe tener event.start y event.end como cadenas ISO o Date.
 * @returns {string} - El tiempo formateado o un string vacío si hay error.
 */
export function formatEventTime(event) {
  try {
    if (!event?.start || !event?.end) return '';
    
    const start = new Date(event.start);
    const end = new Date(event.end);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
    
    // Usar es-ES como locale por defecto si se desea un formato específico,
    // o undefined para usar el locale del navegador.
    const options = { hour: '2-digit', minute: '2-digit', hour12: false }; // Formato 24h
    return `${start.toLocaleTimeString('es-ES', options)} - ${end.toLocaleTimeString('es-ES', options)}`;
  } catch (error) {
    console.error('Error al formatear hora del evento:', error);
    return '';
  }
}

/**
 * Calcula la duración de un evento en minutos.
 * @param {object} event - El objeto del evento, con event.start y event.end.
 * @returns {number} - Duración en minutos, o 60 por defecto si hay error.
 */
export function calculateEventDuration(event) {
  try {
    if (!event?.start || !event?.end) return 60;
    
    const start = new Date(event.start);
    const end = new Date(event.end);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 60;
    
    const durationMs = end.getTime() - start.getTime();
    return Math.round(durationMs / (1000 * 60)); // Redondear a minutos enteros
  } catch (error) {
    console.error('Error al calcular duración del evento:', error);
    return 60;
  }
}

/**
 * Verifica si un evento continúa hasta el siguiente día UTC.
 * Compara los componentes de fecha UTC de inicio y fin.
 * @param {object} event - El objeto del evento, con event.start y event.end.
 * @returns {boolean} - True si el día UTC de fin es posterior al día UTC de inicio.
 */
export function eventContinuesToNextDay(event) {
  try {
    if (!event?.start || !event?.end) return false;
    
    const start = new Date(event.start);
    const end = new Date(event.end);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
    
    // Compara el día, mes y año en UTC
    return start.getUTCDate() !== end.getUTCDate() || 
           start.getUTCMonth() !== end.getUTCMonth() || 
           start.getUTCFullYear() !== end.getUTCFullYear();
  } catch (error) {
    console.error('Error al verificar continuidad del evento:', error);
    return false;
  }
}

/**
 * Verifica si un evento continúa desde el día anterior, comparando días UTC.
 * @param {object} event - El objeto del evento, con event.start.
 * @param {Date|string} currentDate - La fecha actual contra la cual comparar.
 * @returns {boolean} - True si el día UTC de inicio del evento es anterior al día UTC de currentDate.
 */
export function eventContinuesFromPrevDay(event, currentDate) {
  try {
    if (!event?.start || !currentDate) return false; // No necesitamos event.end para esta lógica
    
    const start = new Date(event.start);
    const current = new Date(currentDate);

    if (isNaN(start.getTime()) || isNaN(current.getTime())) return false;
    
    // Para comparar solo las fechas (ignorando la hora),
    // creamos nuevas fechas UTC representando el inicio de cada día UTC.
    const startDayUTC = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
    const currentDayUTC = Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate());
    
    return startDayUTC < currentDayUTC;
  } catch (error) {
    console.error('Error al verificar continuidad desde día anterior:', error);
    return false;
  }
}

/**
 * Ajusta un objeto Date al intervalo de snap más cercano en minutos.
 * Los segundos y milisegundos se establecen a 0.
 * @param {Date} time - El objeto Date a ajustar.
 * @param {number} snapMinutes - El intervalo de snap en minutos (ej. 15, 30).
 * @returns {Date} - Un nuevo objeto Date ajustado, o el original si snapMinutes es inválido.
 */
export function snapTimeToInterval(time, snapMinutes) {
  if (!snapMinutes || typeof snapMinutes !== 'number' || snapMinutes <= 0) return time;
  
  try {
    if (!time || !(time instanceof Date) || isNaN(time.getTime())) return time;
    
    const result = new Date(time.getTime()); // Crear una copia para no mutar el original
    const minutes = result.getMinutes();
    const remainder = minutes % snapMinutes;
    
    if (remainder === 0) {
      result.setSeconds(0, 0);
      return result;
    }
    
    // Redondear al múltiplo de snapMinutes más cercano
    // Si está más cerca del siguiente intervalo, suma; si no, resta el remanente.
    const roundedMinutes = (remainder < snapMinutes / 2) 
      ? minutes - remainder 
      : minutes + (snapMinutes - remainder);
    
    result.setMinutes(roundedMinutes, 0, 0); // setMinutes maneja el desbordamiento a horas
    return result;
  } catch (error) {
    console.error('Error al hacer snap del tiempo:', error);
    return time; // Devolver el original en caso de error
  }
}