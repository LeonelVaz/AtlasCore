/**
 * Funciones auxiliares para el plugin
 */

/**
 * Registra un mensaje en la consola con un prefijo estandarizado
 * @param {string} type - Tipo de mensaje (log, error, warn, info)
 * @param {string} message - Mensaje a registrar
 * @param {any} data - Datos adicionales (opcional)
 */
export function log(type = 'log', message, data) {
  const prefix = '[Plugin Tester]';
  
  switch (type.toLowerCase()) {
    case 'error':
      console.error(`${prefix} ${message}`, data);
      break;
    case 'warn':
      console.warn(`${prefix} ${message}`, data);
      break;
    case 'info':
      console.info(`${prefix} ${message}`, data);
      break;
    default:
      console.log(`${prefix} ${message}`, data);
  }
}

/**
 * Genera un ID único
 * @returns {string} ID único
 */
export function generateUniqueId() {
  return `pt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formatea una fecha para mostrarla
 * @param {Date|number} date - Fecha o timestamp
 * @param {boolean} includeTime - Si se debe incluir la hora
 * @returns {string} Fecha formateada
 */
export function formatDate(date, includeTime = true) {
  const d = date instanceof Date ? date : new Date(date);
  
  if (includeTime) {
    return d.toLocaleString();
  }
  
  return d.toLocaleDateString();
}

/**
 * Verifica si una versión está dentro de un rango
 * @param {string} version - Versión a verificar
 * @param {string} minVersion - Versión mínima
 * @param {string} maxVersion - Versión máxima
 * @returns {boolean} true si la versión está dentro del rango
 */
export function isVersionInRange(version, minVersion, maxVersion) {
  // Convertir versiones a arrays de números
  const versionArr = version.split('.').map(Number);
  const minVersionArr = minVersion.split('.').map(Number);
  const maxVersionArr = maxVersion.split('.').map(Number);
  
  // Comparar con versión mínima
  for (let i = 0; i < minVersionArr.length; i++) {
    if (versionArr[i] > minVersionArr[i]) {
      break;
    }
    if (versionArr[i] < minVersionArr[i]) {
      return false;
    }
  }
  
  // Comparar con versión máxima
  for (let i = 0; i < maxVersionArr.length; i++) {
    if (versionArr[i] < maxVersionArr[i]) {
      break;
    }
    if (versionArr[i] > maxVersionArr[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Limita un array a una longitud máxima
 * @param {Array} array - Array a limitar
 * @param {number} maxLength - Longitud máxima
 * @param {boolean} fromStart - Si se debe limitar desde el principio (true) o desde el final (false)
 * @returns {Array} Array limitado
 */
export function limitArrayLength(array, maxLength, fromStart = false) {
  if (array.length <= maxLength) {
    return [...array];
  }
  
  return fromStart
    ? array.slice(array.length - maxLength)
    : array.slice(0, maxLength);
}

/**
 * Crea un objeto de error más detallado
 * @param {string} code - Código de error
 * @param {string} message - Mensaje de error
 * @param {Object} details - Detalles adicionales
 * @returns {Error} Error con propiedades adicionales
 */
export function createError(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  
  return error;
}