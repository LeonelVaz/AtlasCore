// video-scheduler/utils/i18n.js

/**
 * Sistema simple de internacionalización para el plugin Video Scheduler
 */
export class I18nHelper {
  constructor(defaultLanguage = 'es') {
    this.currentLanguage = defaultLanguage;
    this.translations = {};
    this.fallbackLanguage = 'en';
  }

  /**
   * Carga las traducciones para un idioma específico
   * @param {string} language - Código del idioma
   * @param {Object} translations - Objeto con las traducciones
   */
  loadTranslations(language, translations) {
    if (!this.translations[language]) {
      this.translations[language] = {};
    }
    this.translations[language] = { ...this.translations[language], ...translations };
  }

  /**
   * Cambia el idioma actual
   * @param {string} language - Código del nuevo idioma
   */
  setLanguage(language) {
    this.currentLanguage = language;
  }

  /**
   * Obtiene el idioma actual
   * @returns {string} Código del idioma actual
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * Traduce una clave al idioma actual
   * @param {string} key - Clave de traducción (puede usar notación punto)
   * @param {string} fallback - Texto de respaldo si no se encuentra la traducción
   * @param {Object} params - Parámetros para interpolación
   * @returns {string} Texto traducido
   */
  t(key, fallback = null, params = {}) {
    let translation = this._getTranslation(key, this.currentLanguage);
    
    // Si no se encuentra en el idioma actual, intentar con el idioma de respaldo
    if (!translation && this.currentLanguage !== this.fallbackLanguage) {
      translation = this._getTranslation(key, this.fallbackLanguage);
    }
    
    // Si aún no se encuentra, usar el fallback o la clave misma
    if (!translation) {
      translation = fallback || key;
    }
    
    // Interpolar parámetros si los hay
    return this._interpolate(translation, params);
  }

  /**
   * Obtiene una traducción de un idioma específico
   * @private
   * @param {string} key - Clave de traducción
   * @param {string} language - Idioma
   * @returns {string|null} Traducción o null si no se encuentra
   */
  _getTranslation(key, language) {
    const languageTranslations = this.translations[language];
    if (!languageTranslations) return null;
    
    // Soporte para claves anidadas (ej: "ui.buttons.save")
    const keys = key.split('.');
    let value = languageTranslations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && value.hasOwnProperty(k)) {
        value = value[k];
      } else {
        return null;
      }
    }
    
    return typeof value === 'string' ? value : null;
  }

  /**
   * Interpola parámetros en una cadena de texto
   * @private
   * @param {string} text - Texto con marcadores de posición
   * @param {Object} params - Parámetros para interpolar
   * @returns {string} Texto con parámetros interpolados
   */
  _interpolate(text, params) {
    if (!params || Object.keys(params).length === 0) {
      return text;
    }
    
    let result = text;
    
    // Reemplazar marcadores de posición como {{nombre}}
    for (const [key, value] of Object.entries(params)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return result;
  }

  /**
   * Obtiene todas las claves de traducción disponibles
   * @param {string} language - Idioma (opcional, usa el actual por defecto)
   * @returns {Array} Lista de claves disponibles
   */
  getAvailableKeys(language = null) {
    const lang = language || this.currentLanguage;
    const translations = this.translations[lang];
    
    if (!translations) return [];
    
    return this._getAllKeys(translations);
  }

  /**
   * Obtiene todas las claves de un objeto de manera recursiva
   * @private
   * @param {Object} obj - Objeto de traducciones
   * @param {string} prefix - Prefijo para claves anidadas
   * @returns {Array} Lista de claves
   */
  _getAllKeys(obj, prefix = '') {
    const keys = [];
    
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        keys.push(...this._getAllKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
    
    return keys;
  }

  /**
   * Verifica si existe una traducción para una clave
   * @param {string} key - Clave a verificar
   * @param {string} language - Idioma (opcional)
   * @returns {boolean} True si existe la traducción
   */
  hasTranslation(key, language = null) {
    const lang = language || this.currentLanguage;
    return this._getTranslation(key, lang) !== null;
  }

  /**
   * Obtiene los idiomas disponibles
   * @returns {Array} Lista de códigos de idioma disponibles
   */
  getAvailableLanguages() {
    return Object.keys(this.translations);
  }

  /**
   * Formatrea números según el idioma actual
   * @param {number} number - Número a formatear
   * @param {Object} options - Opciones de formateo
   * @returns {string} Número formateado
   */
  formatNumber(number, options = {}) {
    const locale = this._getLocaleFromLanguage(this.currentLanguage);
    return new Intl.NumberFormat(locale, options).format(number);
  }

  /**
   * Formatea fechas según el idioma actual
   * @param {Date|string} date - Fecha a formatear
   * @param {Object} options - Opciones de formateo
   * @returns {string} Fecha formateada
   */
  formatDate(date, options = {}) {
    const locale = this._getLocaleFromLanguage(this.currentLanguage);
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
  }

  /**
   * Formatea cantidades monetarias según el idioma actual
   * @param {number} amount - Cantidad a formatear
   * @param {string} currency - Código de moneda
   * @returns {string} Cantidad formateada
   */
  formatCurrency(amount, currency = 'USD') {
    const locale = this._getLocaleFromLanguage(this.currentLanguage);
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Convierte el código de idioma a un locale válido
   * @private
   * @param {string} language - Código de idioma
   * @returns {string} Locale válido
   */
  _getLocaleFromLanguage(language) {
    const localeMap = {
      'es': 'es-ES',
      'en': 'en-US',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-BR'
    };
    
    return localeMap[language] || 'en-US';
  }

  /**
   * Traduce opciones de estado de video
   * @param {string} status - Estado del video
   * @returns {string} Estado traducido
   */
  translateVideoStatus(status) {
    return this.t(`status.${status}`, status);
  }

  /**
   * Traduce plataformas
   * @param {string} platform - Plataforma
   * @returns {string} Plataforma traducida
   */
  translatePlatform(platform) {
    return this.t(`platforms.${platform}`, platform);
  }

  /**
   * Traduce franjas horarias
   * @param {string} timeSlot - Franja horaria
   * @returns {string} Franja horaria traducida
   */
  translateTimeSlot(timeSlot) {
    return this.t(`timeSlots.${timeSlot}`, timeSlot);
  }

  /**
   * Obtiene texto pluralizado según la cantidad
   * @param {number} count - Cantidad
   * @param {string} key - Clave base de traducción
   * @returns {string} Texto pluralizado
   */
  pluralize(count, key) {
    if (count === 1) {
      return this.t(`${key}.singular`, this.t(key));
    } else {
      return this.t(`${key}.plural`, this.t(key));
    }
  }

  /**
   * Carga traducciones desde un archivo JSON
   * @param {string} language - Código del idioma
   * @param {string} jsonContent - Contenido JSON como string
   */
  loadTranslationsFromJSON(language, jsonContent) {
    try {
      const translations = JSON.parse(jsonContent);
      this.loadTranslations(language, translations);
    } catch (error) {
      console.error(`Error al cargar traducciones para ${language}:`, error);
    }
  }

  /**
   * Exporta las traducciones actuales como JSON
   * @param {string} language - Idioma a exportar (opcional)
   * @returns {string} JSON con las traducciones
   */
  exportTranslations(language = null) {
    const lang = language || this.currentLanguage;
    const translations = this.translations[lang] || {};
    return JSON.stringify(translations, null, 2);
  }
}