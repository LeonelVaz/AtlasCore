/**
 * Sistema de Sandbox para Plugins de Atlas
 * 
 * Este módulo proporciona aislamiento y ejecución segura para
 * el código de plugins, previniendo efectos secundarios no deseados
 * y limitando el acceso a recursos sensibles.
 */

import eventBus from '../bus/event-bus';
import pluginErrorHandler from './plugin-error-handler';
import { PLUGIN_CONSTANTS } from '../config/constants';

/**
 * Clase que implementa el sandbox para aislamiento de plugins
 */
class PluginSandbox {
  constructor() {
    // Estado de inicialización
    this.initialized = false;
    
    // Nivel de seguridad actual
    this.securityLevel = PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL;
    
    // Verificaciones de seguridad activas
    this.activeChecks = new Set([
      'domManipulation',
      'codeExecution',
      'externalCommunication'
    ]);
    
    // Métodos nativos cacheados para prevenir manipulación
    this.cachedNatives = {};
    
    // Plugins con sandbox aplicado
    this.sandboxedPlugins = new Set();
    
    // Plugins con errores de ejecución en sandbox
    this.sandboxErrors = {};
    
    // Límite de errores en sandbox antes de desactivar plugin
    this.maxSandboxErrors = 5;
    
    // Reglas de análisis estático para validación de plugins
    this.staticAnalysisRules = [
      {
        name: 'preventEval',
        pattern: /\beval\s*\(/g,
        severity: 'critical',
        message: 'Uso de eval() detectado, lo cual es una práctica insegura'
      },
      {
        name: 'preventDocumentWrite',
        pattern: /document\.write\s*\(/g,
        severity: 'high',
        message: 'Uso de document.write() detectado, lo cual puede causar comportamiento inesperado'
      },
      {
        name: 'preventInnerHTML',
        pattern: /\.innerHTML\s*=/g,
        severity: 'medium',
        message: 'Uso de innerHTML detectado, lo cual puede ser inseguro para manipulación DOM'
      },
      {
        name: 'preventWindowOpen',
        pattern: /window\.open\s*\(/g,
        severity: 'medium',
        message: 'Uso de window.open() detectado, lo cual puede abrir ventanas no deseadas'
      },
      {
        name: 'preventNewFunction',
        pattern: /new\s+Function\s*\(/g,
        severity: 'critical',
        message: 'Uso de new Function() detectado, lo cual es una práctica insegura similar a eval'
      },
      {
        name: 'preventSetTimeout',
        pattern: /setTimeout\s*\(\s*['"`]/g, // Busca setTimeout con string como primer argumento
        severity: 'high',
        message: 'Uso de setTimeout con string como argumento detectado, lo cual es inseguro'
      },
      {
        name: 'preventSetInterval',
        pattern: /setInterval\s*\(\s*['"`]/g, // Busca setInterval con string como primer argumento
        severity: 'high',
        message: 'Uso de setInterval con string como argumento detectado, lo cual es inseguro'
      },
      {
        name: 'preventAccessStorage',
        pattern: /(localStorage|sessionStorage|indexedDB)\./g,
        severity: 'medium',
        message: 'Acceso directo a almacenamiento del navegador detectado, use core.storage en su lugar'
      },
      {
        name: 'preventDirectFetch',
        pattern: /\bfetch\s*\(/g,
        severity: 'medium',
        message: 'Uso directo de fetch() detectado, lo cual podría permitir comunicaciones no autorizadas'
      },
      {
        name: 'preventXHR',
        pattern: /new\s+XMLHttpRequest\s*\(/g,
        severity: 'medium',
        message: 'Uso de XMLHttpRequest detectado, lo cual podría permitir comunicaciones no autorizadas'
      },
      {
        name: 'preventObjectDefineProperty',
        pattern: /Object\.defineProperty\s*\(\s*(Object|Array|String|Number|Function|Boolean|Symbol|Math|JSON|Date|RegExp)\./g,
        severity: 'critical',
        message: 'Intento de modificar objetos nativos detectado, lo cual es una práctica peligrosa'
      }
    ];
  }

  /**
   * Inicializa el sistema de sandbox
   * @param {string} securityLevel - Nivel de seguridad
   * @returns {boolean} - true si se inicializó correctamente
   */
  initialize(securityLevel) {
    if (this.initialized) {
      console.warn('Sandbox ya inicializado');
      return true;
    }
    
    try {
      console.log('Inicializando sistema de sandbox para plugins...');
      
      // Establecer nivel de seguridad
      this.securityLevel = securityLevel || PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL;
      
      // Cachear métodos nativos para prevenir manipulación
      this._cacheNativeMethods();
      
      // Instalar protecciones globales según nivel de seguridad
      this._installGlobalProtections();
      
      this.initialized = true;
      
      console.log(`Sandbox inicializado (nivel: ${this.securityLevel})`);
      return true;
    } catch (error) {
      console.error('Error al inicializar sandbox:', error);
      return false;
    }
  }

  /**
   * Cachea métodos nativos para evitar que sean sobreescritos
   * @private
   */
  _cacheNativeMethods() {
    try {
      // Guardamos referencias a funciones nativas que podrían ser manipuladas
      this.cachedNatives = {
        setTimeout: setTimeout.bind(window),
        setInterval: setInterval.bind(window),
        clearTimeout: clearTimeout.bind(window),
        clearInterval: clearInterval.bind(window),
        addEventListener: EventTarget.prototype.addEventListener,
        removeEventListener: EventTarget.prototype.removeEventListener,
        createElement: document.createElement.bind(document),
        querySelector: document.querySelector.bind(document),
        querySelectorAll: document.querySelectorAll.bind(document),
        fetch: window.fetch,
        console: {
          log: console.log.bind(console),
          warn: console.warn.bind(console),
          error: console.error.bind(console)
        }
      };
    } catch (error) {
      console.error('Error al cachear métodos nativos:', error);
    }
  }

  /**
   * Instala protecciones globales según el nivel de seguridad
   * @private
   */
  _installGlobalProtections() {
    // Solo instalamos protecciones globales en niveles altos de seguridad
    if (this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH) {
      try {
        this._protectGlobalObjects();
      } catch (error) {
        console.error('Error al instalar protecciones globales:', error);
      }
    }
  }

  /**
   * Protege objetos globales contra modificaciones
   * @private
   */
  _protectGlobalObjects() {
    // Esta es una implementación simplificada
    // En producción, se usarían técnicas más avanzadas
    
    // Lista de objetos nativos a proteger
    const protectedGlobals = [
      Object, Array, String, Number, Function, 
      Boolean, Symbol, Math, JSON, Date, RegExp
    ];
    
    protectedGlobals.forEach(obj => {
      // Congelar el objeto y su prototipo
      try {
        Object.freeze(obj);
        Object.freeze(obj.prototype);
      } catch (e) {
        // Algunos objetos no tienen prototype o no se pueden congelar
      }
    });
    
    console.log('Protecciones globales instaladas');
  }

  /**
   * Valida el código de un plugin mediante análisis estático
   * @param {string} pluginId - ID del plugin
   * @param {Object} plugin - Objeto plugin a validar
   * @returns {Object} - Resultado de la validación
   */
  validatePluginCode(pluginId, plugin) {
    if (!pluginId || !plugin) {
      return {
        valid: false,
        reasons: ['Plugin no válido para validación']
      };
    }
    
    try {
      // En una implementación real, analizaríamos el código fuente del plugin
      // Para esta implementación, simulamos que examinamos el código
      
      // Convertimos el plugin a string para análisis (no es ideal, pero sirve para demostración)
      const pluginString = JSON.stringify(plugin);
      
      // Validar usando reglas de análisis estático
      const violations = [];
      
      for (const rule of this.staticAnalysisRules) {
        if (rule.pattern.test(pluginString)) {
          violations.push({
            rule: rule.name,
            severity: rule.severity,
            message: rule.message
          });
          
          // Reiniciar patrón para futuros usos
          rule.pattern.lastIndex = 0;
        }
      }
      
      // Filtrar según nivel de seguridad
      const filteredViolations = this._filterViolationsBySecurityLevel(violations);
      
      // Generar razones a partir de violaciones
      const reasons = filteredViolations.map(v => `${v.message} (${v.severity})`);
      
      // Registrar resultado
      if (filteredViolations.length > 0) {
        eventBus.publish('pluginSystem.codeValidationFailed', {
          pluginId,
          violations: filteredViolations
        });
      }
      
      return {
        valid: reasons.length === 0,
        reasons,
        violations: filteredViolations
      };
    } catch (error) {
      console.error(`Error al validar código del plugin ${pluginId}:`, error);
      
      return {
        valid: false,
        reasons: [`Error durante validación de código: ${error.message}`]
      };
    }
  }

  /**
   * Filtra violaciones según el nivel de seguridad actual
   * @param {Array} violations - Lista de violaciones detectadas
   * @returns {Array} - Lista de violaciones filtrada
   * @private
   */
  _filterViolationsBySecurityLevel(violations) {
    // En nivel bajo, solo consideramos violaciones críticas
    if (this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW) {
      return violations.filter(v => v.severity === 'critical');
    }
    
    // En nivel normal, consideramos críticas y altas
    if (this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL) {
      return violations.filter(v => v.severity === 'critical' || v.severity === 'high');
    }
    
    // En nivel alto, consideramos todas
    return violations;
  }

  /**
   * Ejecuta una función de un plugin en un entorno aislado
   * @param {string} pluginId - ID del plugin
   * @param {Function} func - Función a ejecutar
   * @param {Array} args - Argumentos para la función
   * @param {Object} context - Contexto de ejecución
   * @returns {*} - Resultado de la ejecución
   */
  executeSandboxed(pluginId, func, args = [], context = null) {
    if (!this.initialized) {
      console.warn('Sandbox no inicializado');
      return func.apply(context, args);
    }
    
    if (!pluginId || typeof func !== 'function') {
      throw new Error('Argumentos inválidos para executeSandboxed');
    }
    
    // Registrar plugin como sandboxed
    this.sandboxedPlugins.add(pluginId);
    
    try {
      // En una implementación real de sandbox, aquí:
      // 1. Crearíamos un contexto aislado (posiblemente con un iframe)
      // 2. Limitaríamos acceso a APIs sensibles
      // 3. Aplicaríamos límites de recursos
      // 4. Monitorizaríamos la ejecución
      
      // Aplicamos monitor básico de errores
      const result = this._monitoredExecution(pluginId, func, args, context);
      
      return result;
    } catch (error) {
      // Registrar error
      this._handleSandboxError(pluginId, error);
      
      // Propagar error
      throw error;
    }
  }

  /**
   * Ejecuta una función con monitoreo de errores
   * @param {string} pluginId - ID del plugin
   * @param {Function} func - Función a ejecutar
   * @param {Array} args - Argumentos para la función
   * @param {Object} context - Contexto de ejecución
   * @returns {*} - Resultado de la ejecución
   * @private
   */
  _monitoredExecution(pluginId, func, args, context) {
    // Simulación simplificada de sandbox
    // En una implementación real, usaríamos técnicas más avanzadas
    
    try {
      // Simular límite de tiempo para la ejecución
      let timedOut = false;
      let timeoutId = null;
      
      // Promesa que realiza la ejecución con timeout
      const executionPromise = new Promise((resolve, reject) => {
        // Establecer timeout según nivel de seguridad
        const timeout = this._getExecutionTimeout();
        
        // Crear timeout
        timeoutId = this.cachedNatives.setTimeout(() => {
          timedOut = true;
          reject(new Error(`Ejecución del plugin ${pluginId} excedió el límite de tiempo (${timeout}ms)`));
        }, timeout);
        
        try {
          // Ejecutar función
          const result = func.apply(context, args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      // Limpiamos el timeout si la ejecución termina antes
      executionPromise.finally(() => {
        if (timeoutId !== null && !timedOut) {
          this.cachedNatives.clearTimeout(timeoutId);
        }
      });
      
      return executionPromise;
    } catch (error) {
      // Manejar error
      this._handleSandboxError(pluginId, error);
      throw error;
    }
  }

  /**
   * Obtiene el timeout de ejecución según nivel de seguridad
   * @returns {number} - Timeout en milisegundos
   * @private
   */
  _getExecutionTimeout() {
    switch (this.securityLevel) {
      case PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW:
        return 10000; // 10 segundos
      case PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL:
        return 5000; // 5 segundos
      case PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH:
        return 2000; // 2 segundos
      default:
        return 5000;
    }
  }

  /**
   * Maneja un error ocurrido en el sandbox
   * @param {string} pluginId - ID del plugin
   * @param {Error} error - Error ocurrido
   * @private
   */
  _handleSandboxError(pluginId, error) {
    // Inicializar registro de errores si no existe
    if (!this.sandboxErrors[pluginId]) {
      this.sandboxErrors[pluginId] = [];
    }
    
    // Añadir error al registro
    this.sandboxErrors[pluginId].push({
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack
    });
    
    // Limitar tamaño del registro
    if (this.sandboxErrors[pluginId].length > 20) {
      this.sandboxErrors[pluginId] = this.sandboxErrors[pluginId].slice(-20);
    }
    
    // Reportar error
    pluginErrorHandler.handleError(
      pluginId,
      'sandbox',
      error,
      { securityLevel: this.securityLevel }
    );
    
    // Publicar evento
    eventBus.publish('pluginSystem.sandboxError', {
      pluginId,
      error: error.message,
      count: this.sandboxErrors[pluginId].length
    });
    
    // Verificar si superó el límite de errores
    if (this.sandboxErrors[pluginId].length >= this.maxSandboxErrors) {
      // Notificar exceso de errores
      eventBus.publish('pluginSystem.tooManySandboxErrors', {
        pluginId,
        count: this.sandboxErrors[pluginId].length,
        errors: this.sandboxErrors[pluginId].slice(-3) // Últimos 3 errores
      });
    }
  }

  /**
   * Crea un proxy para intercepción de acceso a DOM
   * @param {Object} element - Elemento DOM a proteger
   * @param {string} pluginId - ID del plugin
   * @returns {Proxy} - Proxy del elemento
   */
  createDOMProxy(element, pluginId) {
    if (!element || !pluginId) {
      return element;
    }
    
    // Solo aplicar proxy si la verificación está activa
    if (!this.activeChecks.has('domManipulation')) {
      return element;
    }
    
    // Lista de propiedades y métodos sensibles
    const sensitiveDOMProps = [
      'innerHTML', 'outerHTML', 'insertAdjacentHTML'
    ];
    
    // Crear proxy para interceptar accesos
    return new Proxy(element, {
      get: (target, prop) => {
        const value = target[prop];
        
        // Verificar si es una propiedad/método sensible
        if (sensitiveDOMProps.includes(prop)) {
          // Registrar acceso
          this._logSensitiveAccess(pluginId, 'dom', `${element.tagName}.${prop}`);
        }
        
        // Si es función, proxificar para monitorear su uso
        if (typeof value === 'function') {
          return (...args) => {
            // Verificar operaciones sensibles
            if (prop === 'setAttribute' && args[0] === 'srcdoc') {
              this._handlePotentiallyDangerousOperation(
                pluginId, 
                'dom', 
                `setAttribute('srcdoc')`,
                args
              );
            }
            
            // Llamar al método original
            return value.apply(target, args);
          };
        }
        
        return value;
      },
      
      set: (target, prop, value) => {
        // Verificar si es una propiedad sensible
        if (sensitiveDOMProps.includes(prop)) {
          // Verificar contenido sospechoso
          if (typeof value === 'string' && this._containsSuspiciousContent(value)) {
            this._handlePotentiallyDangerousOperation(
              pluginId, 
              'dom', 
              `${prop} = [sospechoso]`,
              { value }
            );
          }
        }
        
        // Permitir la asignación
        target[prop] = value;
        return true;
      }
    });
  }

  /**
   * Verifica si un contenido contiene código potencialmente sospechoso
   * @param {string} content - Contenido a verificar
   * @returns {boolean} - true si es sospechoso
   * @private
   */
  _containsSuspiciousContent(content) {
    if (typeof content !== 'string') {
      return false;
    }
    
    // Buscar patrones sospechosos (script tags, javascript: URLs, etc.)
    const suspiciousPatterns = [
      /<\s*script/i,
      /javascript\s*:/i,
      /data\s*:\s*text\/html/i,
      /on[a-z]+\s*=/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Registra acceso a propiedades o métodos sensibles
   * @param {string} pluginId - ID del plugin
   * @param {string} type - Tipo de acceso
   * @param {string} target - Objetivo del acceso
   * @private
   */
  _logSensitiveAccess(pluginId, type, target) {
    // En implementación real, registraríamos en algún sistema de logs
    if (this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH) {
      console.warn(`[Sandbox] Plugin ${pluginId} accedió a ${type} sensible: ${target}`);
    }
  }

  /**
   * Maneja una operación potencialmente peligrosa
   * @param {string} pluginId - ID del plugin
   * @param {string} type - Tipo de operación
   * @param {string} operation - Operación realizada
   * @param {Object} details - Detalles adicionales
   * @private
   */
  _handlePotentiallyDangerousOperation(pluginId, type, operation, details) {
    // Operaciones realmente peligrosas bloqueadas en nivel alto
    const isHighSecurity = this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH;
    
    // Publicar evento
    eventBus.publish('pluginSystem.suspiciousOperation', {
      pluginId,
      type,
      operation,
      details: isHighSecurity ? details : null,
      blocked: isHighSecurity
    });
    
    // En nivel de seguridad alto, lanzar error
    if (isHighSecurity) {
      throw new Error(`Operación potencialmente peligrosa bloqueada: ${type} ${operation}`);
    }
  }

  /**
   * Crea un contenedor aislado para un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {Object} - Entorno aislado
   */
  createIsolatedEnvironment(pluginId) {
    if (!pluginId) {
      throw new Error('ID de plugin requerido para crear entorno aislado');
    }
    
    try {
      // En una implementación real, se crearía un entorno totalmente aislado
      // Por ejemplo, mediante un iframe sandbox o un Web Worker
      
      // Por ahora, retornamos un objeto proxy simple
      const isolatedEnvironment = {
        console: this._createProxiedConsole(pluginId),
        setTimeout: this._createProxiedTimeout(pluginId),
        setInterval: this._createProxiedInterval(pluginId),
        fetch: this._createProxiedFetch(pluginId),
        // Podríamos añadir más APIs aquí
      };
      
      return isolatedEnvironment;
    } catch (error) {
      console.error(`Error al crear entorno aislado para plugin ${pluginId}:`, error);
      
      // En caso de error, devolver entorno vacío
      return {};
    }
  }

  /**
   * Crea una consola proxy para un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {Object} - Consola proxy
   * @private
   */
  _createProxiedConsole(pluginId) {
    return {
      log: (...args) => {
        this.cachedNatives.console.log(`[Plugin ${pluginId}]`, ...args);
      },
      warn: (...args) => {
        this.cachedNatives.console.warn(`[Plugin ${pluginId}]`, ...args);
      },
      error: (...args) => {
        this.cachedNatives.console.error(`[Plugin ${pluginId}]`, ...args);
      }
      // Otros métodos de console se pueden añadir aquí
    };
  }

  /**
   * Crea un setTimeout proxy
   * @param {string} pluginId - ID del plugin
   * @returns {Function} - setTimeout proxy
   * @private
   */
  _createProxiedTimeout(pluginId) {
    return (callback, delay, ...args) => {
      // Verificar si es función (no permitir strings para eval)
      if (typeof callback !== 'function') {
        throw new Error('setTimeout solo acepta funciones como primer argumento');
      }
      
      // Limitar delay según nivel de seguridad
      const maxDelay = this._getMaxTimeout();
      const limitedDelay = Math.min(delay || 0, maxDelay);
      
      // Crear wrapping para monitoreo
      const wrappedCallback = () => {
        try {
          return callback(...args);
        } catch (error) {
          this._handleSandboxError(pluginId, error);
          throw error;
        }
      };
      
      // Crear timeout real
      return this.cachedNatives.setTimeout(wrappedCallback, limitedDelay);
    };
  }

  /**
   * Crea un setInterval proxy
   * @param {string} pluginId - ID del plugin
   * @returns {Function} - setInterval proxy
   * @private
   */
  _createProxiedInterval(pluginId) {
    return (callback, delay, ...args) => {
      // Verificar si es función (no permitir strings para eval)
      if (typeof callback !== 'function') {
        throw new Error('setInterval solo acepta funciones como primer argumento');
      }
      
      // Limitar delay según nivel de seguridad
      const minDelay = this._getMinInterval();
      const limitedDelay = Math.max(delay || 0, minDelay);
      
      // Crear wrapping para monitoreo
      const wrappedCallback = () => {
        try {
          return callback(...args);
        } catch (error) {
          this._handleSandboxError(pluginId, error);
          throw error;
        }
      };
      
      // Crear interval real
      return this.cachedNatives.setInterval(wrappedCallback, limitedDelay);
    };
  }

  /**
   * Crea un fetch proxy
   * @param {string} pluginId - ID del plugin
   * @returns {Function} - fetch proxy
   * @private
   */
  _createProxiedFetch(pluginId) {
    return async (url, options = {}) => {
      // Verificar si la comunicación externa está permitida
      if (this.activeChecks.has('externalCommunication')) {
        // Validar URL (en implementación real, verificaríamos contra lista blanca)
        const isSafeUrl = this._isSafeUrl(url);
        
        if (!isSafeUrl) {
          // Notificar intento de comunicación sospechosa
          eventBus.publish('pluginSystem.suspiciousExternalCommunication', {
            pluginId,
            url,
            options
          });
          
          // En nivel alto, bloquear
          if (this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH) {
            throw new Error(`Acceso a URL no permitida: ${url}`);
          }
        }
      }
      
      // Ejecutar fetch real
      try {
        return await this.cachedNatives.fetch(url, options);
      } catch (error) {
        // Registrar error
        this._handleSandboxError(pluginId, error);
        throw error;
      }
    };
  }

  /**
   * Verifica si una URL es segura
   * @param {string} url - URL a verificar
   * @returns {boolean} - true si es segura
   * @private
   */
  _isSafeUrl(url) {
    try {
      // Implementación simple - verificar protocolo
      const parsedUrl = new URL(url, window.location.origin);
      const safeProtocols = ['https:', 'http:', 'data:'];
      
      return safeProtocols.includes(parsedUrl.protocol);
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene el timeout máximo según nivel de seguridad
   * @returns {number} - Timeout máximo en ms
   * @private
   */
  _getMaxTimeout() {
    switch (this.securityLevel) {
      case PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW:
        return 30000; // 30 segundos
      case PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL:
        return 10000; // 10 segundos
      case PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH:
        return 5000; // 5 segundos
      default:
        return 10000;
    }
  }

  /**
   * Obtiene el intervalo mínimo según nivel de seguridad
   * @returns {number} - Intervalo mínimo en ms
   * @private
   */
  _getMinInterval() {
    switch (this.securityLevel) {
      case PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW:
        return 100; // 0.1 segundos
      case PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL:
        return 500; // 0.5 segundos
      case PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH:
        return 1000; // 1 segundo
      default:
        return 500;
    }
  }

  /**
   * Actualiza la lista de verificaciones de seguridad activas
   * @param {Set} activeChecks - Conjunto de verificaciones activas
   */
  updateSecurityChecks(activeChecks) {
    if (!activeChecks) return;
    
    this.activeChecks = new Set(activeChecks);
    
    // Publicar evento de actualización
    eventBus.publish('pluginSystem.sandboxSecurityChecksUpdated', {
      checks: Array.from(this.activeChecks)
    });
  }

  /**
   * Establece el nivel de seguridad del sandbox
   * @param {string} level - Nivel de seguridad
   * @returns {boolean} - true si se cambió correctamente
   */
  setSecurityLevel(level) {
    if (!level || !PLUGIN_CONSTANTS.SECURITY.LEVEL[level]) {
      return false;
    }
    
    try {
      this.securityLevel = level;
      
      // Reinstalar protecciones globales si es necesario
      if (level === PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH) {
        this._installGlobalProtections();
      }
      
      // Publicar evento
      eventBus.publish('pluginSystem.sandboxSecurityLevelChanged', {
        level
      });
      
      return true;
    } catch (error) {
      console.error(`Error al cambiar nivel de seguridad a ${level}:`, error);
      return false;
    }
  }

  /**
   * Obtiene errores de sandbox para un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {Array} - Lista de errores
   */
  getSandboxErrors(pluginId) {
    if (!pluginId) {
      return [];
    }
    
    return this.sandboxErrors[pluginId] || [];
  }

  /**
   * Limpia datos relacionados con un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {boolean} - true si se limpió correctamente
   */
  clearPluginData(pluginId) {
    if (!pluginId) {
      return false;
    }
    
    try {
      // Eliminar de plugins con sandbox
      this.sandboxedPlugins.delete(pluginId);
      
      // Eliminar errores
      delete this.sandboxErrors[pluginId];
      
      return true;
    } catch (error) {
      console.error(`Error al limpiar datos de plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Evalúa código de forma segura (sin usar eval)
   * @param {string} pluginId - ID del plugin
   * @param {string} code - Código a evaluar
   * @returns {*} - Resultado de la evaluación
   */
  safeEvaluate(pluginId, code) {
    if (!pluginId || typeof code !== 'string') {
      throw new Error('Argumentos inválidos para safeEvaluate');
    }
    
    // Validar código con análisis estático
    const validateResult = this._validateCode(code);
    
    if (!validateResult.valid) {
      throw new Error(`Código inseguro: ${validateResult.reasons.join(', ')}`);
    }
    
    try {
      // Crear función segura (menos peligroso que eval directo)
      // Limitar acceso solo a un scope específico
      const scopeVars = {
        // Variables seguras que queremos exponer
        console: this._createProxiedConsole(pluginId),
        Math,
        Date,
        // Podríamos añadir más
      };
      
      // Extraer nombres y valores de variables scope
      const scopeKeys = Object.keys(scopeVars);
      const scopeValues = scopeKeys.map(key => scopeVars[key]);
      
      // Crear función con los argumentos siendo las variables scope
      // y el cuerpo siendo el código a evaluar
      const fn = new Function(...scopeKeys, `"use strict";\n${code}`);
      
      // Ejecutar con timeout
      return this.executeSandboxed(
        pluginId,
        fn,
        scopeValues
      );
    } catch (error) {
      this._handleSandboxError(pluginId, error);
      throw error;
    }
  }

  /**
   * Valida código con análisis estático simple
   * @param {string} code - Código a validar
   * @returns {Object} - Resultado de la validación
   * @private
   */
  _validateCode(code) {
    const violations = [];
    
    // Aplicar reglas de validación
    for (const rule of this.staticAnalysisRules) {
      if (rule.pattern.test(code)) {
        violations.push({
          rule: rule.name,
          severity: rule.severity,
          message: rule.message
        });
        
        // Reiniciar patrón
        rule.pattern.lastIndex = 0;
      }
    }
    
    // Filtrar según nivel de seguridad
    const filteredViolations = this._filterViolationsBySecurityLevel(violations);
    
    // Generar razones
    const reasons = filteredViolations.map(v => v.message);
    
    return {
      valid: reasons.length === 0,
      reasons,
      violations: filteredViolations
    };
  }

  /**
   * Obtiene estadísticas del sistema de sandbox
   * @returns {Object} - Estadísticas
   */
  getStats() {
    try {
      // Contar plugins con sandbox
      const sandboxedPluginsCount = this.sandboxedPlugins.size;
      
      // Contar plugins con errores
      const pluginsWithErrorsCount = Object.keys(this.sandboxErrors).length;
      
      // Total de errores
      let totalErrors = 0;
      Object.values(this.sandboxErrors).forEach(errors => {
        totalErrors += errors.length;
      });
      
      // Plugins con más errores
      const topErrorPlugins = Object.entries(this.sandboxErrors)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 3)
        .map(([pluginId, errors]) => ({
          pluginId,
          errorCount: errors.length
        }));
      
      return {
        securityLevel: this.securityLevel,
        activeChecks: Array.from(this.activeChecks),
        sandboxedPlugins: sandboxedPluginsCount,
        pluginsWithErrors: pluginsWithErrorsCount,
        totalErrors,
        topErrorPlugins
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de sandbox:', error);
      
      return {
        error: error.message
      };
    }
  }
}

// Exportar instancia única
const pluginSandbox = new PluginSandbox();
export default pluginSandbox;