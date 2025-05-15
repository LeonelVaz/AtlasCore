/**
 * Utilidades para manejar operaciones relacionadas con tiempo
 */

/**
 * Formatea el tiempo de un evento para mostrar
 */
export function formatEventTime(event) {
  try {
    if (!event?.start || !event?.end) return '';
    
    const start = new Date(event.start);
    const end = new Date(event.end);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
    
    const options = { hour: '2-digit', minute: '2-digit' };
    return `${start.toLocaleTimeString('es-ES', options)} - ${end.toLocaleTimeString('es-ES', options)}`;
  } catch (error) {
    console.error('Error al formatear hora del evento:', error);
    return '';
  }
}

/**
 * Calcula la duración de un evento en minutos
 */
export function calculateEventDuration(event) {
  try {
    if (!event?.start || !event?.end) return 60;
    
    const start = new Date(event.start);
    const end = new Date(event.end);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 60;
    
    return (end - start) / (1000 * 60);
  } catch (error) {
    console.error('Error al calcular duración del evento:', error);
    return 60;
  }
}

/**
 * Verifica si un evento continúa hasta el siguiente día
 */
export function eventContinuesToNextDay(event) {
  try {
    if (!event?.start || !event?.end) return false;
    
    const start = new Date(event.start);
    const end = new Date(event.end);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
    
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
 */
export function eventContinuesFromPrevDay(event, currentDate) {
  try {
    if (!event?.start || !event?.end || !currentDate) return false;
    
    const start = new Date(event.start);
    if (isNaN(start.getTime()) || isNaN(currentDate.getTime())) return false;
    
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
 */
export function snapTimeToInterval(time, snapMinutes) {
  if (!snapMinutes || snapMinutes <= 0) return time;
  
  try {
    if (!time || isNaN(time.getTime())) return time;
    
    const result = new Date(time);
    const minutes = result.getMinutes();
    const remainder = minutes % snapMinutes;
    
    if (remainder === 0) {
      result.setSeconds(0, 0);
      return result;
    }
    
    const roundedMinutes = remainder < snapMinutes / 2 
      ? minutes - remainder 
      : minutes + (snapMinutes - remainder);
    
    result.setMinutes(roundedMinutes, 0, 0);
    return result;
  } catch (error) {
    console.error('Error al hacer snap del tiempo:', error);
    return time;
  }
}