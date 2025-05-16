/**
 * Módulo de internacionalización para el plugin de notas
 */

// Importar traducciones
// En una implementación completa, estos imports serían dinámicos
import esMessages from '../locales/es/notes.json';
import enMessages from '../locales/en/notes.json';

/**
 * Carga las traducciones para el idioma especificado
 * @param {string} locale - Código de idioma (ej. 'es', 'en')
 * @returns {Object} - Traducciones para el idioma
 */
export function loadTranslations(locale) {
  // Extraer código de idioma base
  const baseLocale = locale?.split('-')[0].toLowerCase() || 'es';
  
  // Mapeo de idiomas soportados
  const translations = {
    'es': esMessages,
    'en': enMessages
  };
  
  // Devolver traducciones para el idioma o español como fallback
  return translations[baseLocale] || translations['es'];
}

/**
 * Obtiene una traducción específica
 * @param {Object} translations - Objeto de traducciones
 * @param {string} key - Clave de la traducción
 * @param {Object} params - Parámetros para interpolar
 * @returns {string} - Texto traducido
 */
export function getTranslation(translations, key, params = {}) {
  if (!translations) {
    return key; // Si no hay traducciones, devolver la clave
  }
  
  // Obtener partes de la clave (ej. 'notes.create' -> ['notes', 'create'])
  const parts = key.split('.');
  
  // Navegar por el objeto de traducciones
  let value = translations;
  for (const part of parts) {
    value = value?.[part];
    if (value === undefined) {
      return key; // Si no se encuentra la clave, devolver la clave original
    }
  }
  
  // Si el valor no es un string, devolver la clave
  if (typeof value !== 'string') {
    return key;
  }
  
  // Interpolar parámetros
  if (params && Object.keys(params).length > 0) {
    return interpolateParams(value, params);
  }
  
  return value;
}

/**
 * Interpola parámetros en una cadena de texto
 * @param {string} text - Texto con marcadores de posición
 * @param {Object} params - Parámetros para interpolar
 * @returns {string} - Texto con parámetros interpolados
 */
function interpolateParams(text, params) {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? params[key] : match;
  });
}

/**
 * Formatea una fecha según el idioma
 * @param {Date|string} date - Fecha a formatear
 * @param {Object} options - Opciones de formato
 * @param {string} locale - Código de idioma
 * @returns {string} - Fecha formateada
 */
export function formatDate(date, options = {}, locale = 'es') {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString(locale, options);
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return String(date);
  }
}

/**
 * Formatea una hora según el idioma
 * @param {Date|string} time - Hora a formatear
 * @param {Object} options - Opciones de formato
 * @param {string} locale - Código de idioma
 * @returns {string} - Hora formateada
 */
export function formatTime(time, options = {}, locale = 'es') {
  try {
    const timeObj = time instanceof Date ? time : new Date(time);
    return timeObj.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      ...options
    });
  } catch (error) {
    console.error('Error al formatear hora:', error);
    return String(time);
  }
}

export default {
  loadTranslations,
  getTranslation,
  formatDate,
  formatTime
};