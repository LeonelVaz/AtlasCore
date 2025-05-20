/**
 * logger.js
 * Utilidad de logging para el plugin
 */

import constants from '../constants';

/**
 * Logger personalizado para el plugin
 */
class Logger {
  constructor() {
    this.pluginId = 'pruebas-generales';
    this.core = null;
    this.logLevel = constants.LOG_LEVELS.INFO;
    this.logLevels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      none: 4
    };
  }
  
  /**
   * Establece el core para operaciones avanzadas
   * @param {Object} core - Objeto core del sistema
   */
  setCore(core) {
    this.core = core;
  }
  
  /**
   * Establece el ID del plugin
   * @param {string} pluginId - ID del plugin
   */
  setPluginId(pluginId) {
    this.pluginId = pluginId;
  }
  
  /**
   * Establece el nivel de log
   * @param {string} level - Nivel de log (debug, info, warn, error, none)
   */
  setLevel(level) {
    if (this.logLevels[level] !== undefined) {
      this.logLevel = level;
    }
  }
  
  /**
   * Determina si un nivel de log debe ser mostrado
   * @param {string} level - Nivel a comprobar
   * @returns {boolean} - true si debe mostrarse, false en caso contrario
   * @private
   */
  _shouldLog(level) {
    return this.logLevels[level] >= this.logLevels[this.logLevel];
  }
  
  /**
   * Formatea el mensaje con prefijo del plugin
   * @param {string} message - Mensaje a formatear
   * @returns {string} - Mensaje formateado
   * @private
   */
  _formatMessage(message) {
    return `[${this.pluginId}] ${message}`;
  }
  
  /**
   * Registra un mensaje de depuración
   * @param {string} message - Mensaje a registrar
   * @param {*} data - Datos adicionales (opcional)
   */
  debug(message, data) {
    if (!this._shouldLog('debug')) return;
    
    if (data !== undefined) {
      console.debug(this._formatMessage(message), data);
    } else {
      console.debug(this._formatMessage(message));
    }
    
    // Registrar en sistema de eventos si está disponible
    this._logToEvents('debug', message, data);
  }
  
  /**
   * Registra un mensaje informativo
   * @param {string} message - Mensaje a registrar
   * @param {*} data - Datos adicionales (opcional)
   */
  info(message, data) {
    if (!this._shouldLog('info')) return;
    
    if (data !== undefined) {
      console.info(this._formatMessage(message), data);
    } else {
      console.info(this._formatMessage(message));
    }
    
    // Registrar en sistema de eventos si está disponible
    this._logToEvents('info', message, data);
  }
  
  /**
   * Registra un mensaje de advertencia
   * @param {string} message - Mensaje a registrar
   * @param {*} data - Datos adicionales (opcional)
   */
  warn(message, data) {
    if (!this._shouldLog('warn')) return;
    
    if (data !== undefined) {
      console.warn(this._formatMessage(message), data);
    } else {
      console.warn(this._formatMessage(message));
    }
    
    // Registrar en sistema de eventos si está disponible
    this._logToEvents('warn', message, data);
  }
  
  /**
   * Registra un mensaje de error
   * @param {string} message - Mensaje a registrar
   * @param {*} data - Datos adicionales (opcional)
   */
  error(message, data) {
    if (!this._shouldLog('error')) return;
    
    if (data !== undefined) {
      console.error(this._formatMessage(message), data);
    } else {
      console.error(this._formatMessage(message));
    }
    
    // Registrar en sistema de eventos si está disponible
    this._logToEvents('error', message, data);
  }
  
  /**
   * Registra un mensaje de éxito
   * @param {string} message - Mensaje a registrar
   * @param {*} data - Datos adicionales (opcional)
   */
  success(message, data) {
    if (!this._shouldLog('info')) return;
    
    // Estilo para mensajes de éxito
    const style = 'color: green; font-weight: bold;';
    
    if (data !== undefined) {
      console.log(`%c${this._formatMessage(message)}`, style, data);
    } else {
      console.log(`%c${this._formatMessage(message)}`, style);
    }
    
    // Registrar en sistema de eventos si está disponible
    this._logToEvents('success', message, data);
  }
  
  /**
   * Registra mensaje en el sistema de eventos si está disponible
   * @param {string} level - Nivel de log
   * @param {string} message - Mensaje a registrar
   * @param {*} data - Datos adicionales
   * @private
   */
  _logToEvents(level, message, data) {
    if (this.core && this.core.events && constants.CUSTOM_EVENTS.LOG_ENTRY) {
      try {
        this.core.events.publish(
          this.pluginId,
          constants.CUSTOM_EVENTS.LOG_ENTRY,
          {
            level,
            message,
            data,
            timestamp: Date.now()
          }
        );
      } catch (e) {
        // Ignorar errores en el registro de eventos
      }
    }
  }
}

// Exportar una instancia única
export default new Logger();