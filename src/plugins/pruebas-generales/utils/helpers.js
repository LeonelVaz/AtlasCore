/**
 * helpers.js
 * Funciones auxiliares para el plugin
 */

/**
 * Formatea una fecha al formato deseado
 * @param {Date|string|number} date - Fecha a formatear
 * @param {string} format - Formato deseado ('short', 'long', 'time', 'datetime', etc.)
 * @returns {string} - Fecha formateada
 */
export function formatDate(date, format = 'short') {
  if (!date) return '';
  
  // Convertir a objeto Date si es necesario
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;
  
  if (!(dateObj instanceof Date) || isNaN(dateObj)) {
    return '';
  }
  
  try {
    switch (format) {
      case 'short':
        return dateObj.toLocaleDateString();
      case 'long':
        return dateObj.toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'time':
        return dateObj.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit'
        });
      case 'datetime':
        return `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit'
        })}`;
      case 'relative':
        return formatRelativeTime(dateObj);
      default:
        return dateObj.toLocaleDateString();
    }
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return '';
  }
}

/**
 * Formatea una fecha en tiempo relativo (ej: "hace 5 minutos")
 * @param {Date} date - Fecha a formatear
 * @returns {string} - Tiempo relativo
 */
export function formatRelativeTime(date) {
  if (!date) return '';
  
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) {
    return 'hace un momento';
  } else if (diffMin < 60) {
    return `hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
  } else if (diffHour < 24) {
    return `hace ${diffHour} ${diffHour === 1 ? 'hora' : 'horas'}`;
  } else if (diffDay < 7) {
    return `hace ${diffDay} ${diffDay === 1 ? 'día' : 'días'}`;
  } else {
    return formatDate(date, 'short');
  }
}

/**
 * Trunca un texto a la longitud máxima especificada
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @param {string} suffix - Sufijo a añadir cuando se trunca (por defecto: '...')
 * @returns {string} - Texto truncado
 */
export function truncateText(text, maxLength, suffix = '...') {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Convierte bytes a una representación legible
 * @param {number} bytes - Cantidad de bytes
 * @param {number} decimals - Número de decimales (por defecto: 1)
 * @returns {string} - Representación legible (ej: "1.5 KB")
 */
export function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Genera un ID único
 * @param {string} prefix - Prefijo para el ID (opcional)
 * @returns {string} - ID único
 */
export function generateId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}-${timestamp}${random}` : `${timestamp}${random}`;
}

/**
 * Espera un tiempo especificado
 * @param {number} ms - Tiempo en milisegundos
 * @returns {Promise<void>} - Promesa que se resuelve después del tiempo especificado
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Intenta una operación varias veces con reintento
 * @param {Function} operation - Función que devuelve una promesa
 * @param {Object} options - Opciones de reintento
 * @param {number} options.maxRetries - Número máximo de reintentos (por defecto: 3)
 * @param {number} options.delay - Retraso entre reintentos en ms (por defecto: 1000)
 * @param {Function} options.shouldRetry - Función que decide si reintentar (recibe el error)
 * @returns {Promise<any>} - Resultado de la operación
 */
export async function retryOperation(operation, options = {}) {
  const maxRetries = options.maxRetries || 3;
  const delay = options.delay || 1000;
  const shouldRetry = options.shouldRetry || (() => true);
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt >= maxRetries || !shouldRetry(error)) {
        throw error;
      }
      
      // Esperar antes del siguiente intento
      await wait(delay);
    }
  }
  
  throw lastError;
}

/**
 * Crea una versión throttled de una función
 * @param {Function} func - Función a limitar
 * @param {number} wait - Tiempo mínimo entre llamadas en ms
 * @returns {Function} - Función throttled
 */
export function throttle(func, wait) {
  let timeout = null;
  let lastCall = 0;
  
  return function(...args) {
    const now = Date.now();
    const remainingTime = lastCall + wait - now;
    
    if (remainingTime <= 0) {
      lastCall = now;
      return func.apply(this, args);
    }
    
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      lastCall = Date.now();
      func.apply(this, args);
    }, remainingTime);
  };
}

/**
 * Crea una versión debounced de una función
 * @param {Function} func - Función a debounce
 * @param {number} wait - Tiempo de espera en ms
 * @param {boolean} immediate - Si se debe ejecutar inmediatamente
 * @returns {Function} - Función debounced
 */
export function debounce(func, wait, immediate = false) {
  let timeout;
  
  return function(...args) {
    const context = this;
    
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    
    const callNow = immediate && !timeout;
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(context, args);
  };
}

/**
 * Obtiene un valor seguro de un objeto anidado con una ruta de acceso
 * @param {Object} obj - Objeto a acceder
 * @param {string} path - Ruta de acceso (ej: 'prop1.prop2.prop3')
 * @param {any} defaultValue - Valor por defecto si la ruta no existe
 * @returns {any} - Valor encontrado o valor por defecto
 */
export function getNestedValue(obj, path, defaultValue = undefined) {
  if (!obj || !path) return defaultValue;
  
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    
    current = current[key];
  }
  
  return current !== undefined ? current : defaultValue;
}

/**
 * Filtra un array de objetos por texto de búsqueda en propiedades específicas
 * @param {Array<Object>} items - Array de objetos a filtrar
 * @param {string} searchText - Texto de búsqueda
 * @param {Array<string>} properties - Propiedades donde buscar
 * @returns {Array<Object>} - Objetos filtrados
 */
export function filterItemsByText(items, searchText, properties) {
  if (!items || !Array.isArray(items) || !searchText || !properties) {
    return items;
  }
  
  const search = searchText.toLowerCase();
  
  return items.filter(item => {
    return properties.some(prop => {
      const value = getNestedValue(item, prop);
      
      if (value === null || value === undefined) {
        return false;
      }
      
      return String(value).toLowerCase().includes(search);
    });
  });
}

/**
 * Comprueba si dos objetos son iguales en estructura y valores
 * @param {any} obj1 - Primer objeto
 * @param {any} obj2 - Segundo objeto
 * @returns {boolean} - true si son iguales, false si no
 */
export function isEqual(obj1, obj2) {
  // Verificar tipos
  if (typeof obj1 !== typeof obj2) {
    return false;
  }
  
  // Valores primitivos o referencias iguales
  if (obj1 === obj2) {
    return true;
  }
  
  // Si uno es null/undefined pero el otro no (ya comprobamos igualdad antes)
  if (!obj1 || !obj2) {
    return false;
  }
  
  // Comparar arrays
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      return false;
    }
    
    return obj1.every((item, index) => isEqual(item, obj2[index]));
  }
  
  // Comparar objetos (que no sean arrays)
  if (typeof obj1 === 'object' && typeof obj2 === 'object') {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) {
      return false;
    }
    
    return keys1.every(key => {
      return keys2.includes(key) && isEqual(obj1[key], obj2[key]);
    });
  }
  
  // Si llegamos aquí, son diferentes
  return false;
}

/**
 * Convierte un objeto a una cadena de consulta URL
 * @param {Object} params - Objeto con parámetros
 * @returns {string} - Cadena de consulta URL (sin '?' inicial)
 */
export function toQueryString(params) {
  if (!params || typeof params !== 'object') {
    return '';
  }
  
  return Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      // Convertir arrays a formato de query string
      if (Array.isArray(value)) {
        return value
          .map(item => `${encodeURIComponent(key)}=${encodeURIComponent(item)}`)
          .join('&');
      }
      
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join('&');
}

/**
 * Analiza una cadena de consulta URL
 * @param {string} queryString - Cadena de consulta (con o sin '?' inicial)
 * @returns {Object} - Objeto con parámetros
 */
export function parseQueryString(queryString) {
  if (!queryString) {
    return {};
  }
  
  // Eliminar '?' inicial si existe
  const query = queryString.startsWith('?')
    ? queryString.substring(1)
    : queryString;
  
  if (!query) {
    return {};
  }
  
  return query
    .split('&')
    .reduce((params, param) => {
      const [key, value] = param.split('=');
      if (!key) return params;
      
      const decodedKey = decodeURIComponent(key);
      const decodedValue = value ? decodeURIComponent(value) : '';
      
      // Manejar parámetros de array (key[]=value1&key[]=value2)
      if (decodedKey.endsWith('[]')) {
        const arrayKey = decodedKey.slice(0, -2);
        if (!params[arrayKey]) {
          params[arrayKey] = [];
        }
        params[arrayKey].push(decodedValue);
      } else {
        params[decodedKey] = decodedValue;
      }
      
      return params;
    }, {});
}