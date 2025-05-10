/**
 * Utilidades para manejar operaciones relacionadas con tiempo
 */

/**
 * Formatea el tiempo de un evento para mostrar
 * @param {Object} event - Evento con propiedades start y end
 * @returns {string} Hora formateada
 */
export function formatEventTime(event) {
  try {
    const start = new Date(event.start);
    const end = new Date(event.end);
    
    return `${start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - 
            ${end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  } catch (error) {
    console.error('Error al formatear hora del evento:', error);
    return '';
  }
}

/**
 * Calcula la duración de un evento en minutos
 * @param {Object} event - Evento con propiedades start y end
 * @returns {number} Duración en minutos
 */
export function calculateEventDuration(event) {
  try {
    const start = new Date(event.start);
    const end = new Date(event.end);
    return (end - start) / (1000 * 60); // Duración en minutos
  } catch (error) {
    console.error('Error al calcular duración del evento:', error);
    return 60; // Valor por defecto: 1 hora
  }
}

/**
 * Verifica si un evento continúa hasta el siguiente día
 * @param {Object} event - Evento con propiedades start y end
 * @returns {boolean} Verdadero si continúa al siguiente día
 */
export function eventContinuesToNextDay(event) {
  try {
    const start = new Date(event.start);
    const end = new Date(event.end);
    
    return start.getDate() !== end.getDate() || 
           start.getMonth() !== end.getMonth() || 
           start.getFullYear() !== end.getFullYear();
  } catch (error) {
    console.error('Error al verificar continuidad del evento:', error);
    return false;
  }
}

/**
 * Verifica si un evento continúa desde el día anterior
 * @param {Object} event - Evento con propiedades start y end
 * @param {Date} currentDate - Fecha actual del calendario
 * @returns {boolean} Verdadero si continúa desde el día anterior
 */
export function eventContinuesFromPrevDay(event, currentDate) {
  try {
    const start = new Date(event.start);
    
    // Resetear hora a medianoche para comparar solo fechas
    const currentDay = new Date(currentDate);
    currentDay.setHours(0, 0, 0, 0);
    
    const startDay = new Date(start);
    startDay.setHours(0, 0, 0, 0);
    
    return startDay.getTime() < currentDay.getTime();
  } catch (error) {
    console.error('Error al verificar continuidad desde día anterior:', error);
    return false;
  }
}

/**
 * Ajusta un tiempo al valor de snap más cercano
 * @param {Date} time - Tiempo a ajustar
 * @param {number} snapMinutes - Minutos de snap (15, 30, etc.)
 * @returns {Date} Tiempo ajustado
 */
export function snapTimeToInterval(time, snapMinutes) {
  if (!snapMinutes || snapMinutes <= 0) {
    return time;
  }
  
  try {
    const result = new Date(time);
    const minutes = result.getMinutes();
    const remainder = minutes % snapMinutes;
    
    if (remainder === 0) {
      return result;
    }
    
    // Redondear al valor de snap más cercano
    const roundedMinutes = remainder < snapMinutes / 2 
      ? minutes - remainder 
      : minutes + (snapMinutes - remainder);
    
    result.setMinutes(roundedMinutes);
    result.setSeconds(0);
    result.setMilliseconds(0);
    
    return result;
  } catch (error) {
    console.error('Error al hacer snap del tiempo:', error);
    return time;
  }
}