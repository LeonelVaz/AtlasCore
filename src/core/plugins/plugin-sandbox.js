// src/core/plugins/plugin-sandbox.js

/**
 * Sistema de Sandbox para Plugins
 */
import eventBus from '../bus/event-bus';
import pluginErrorHandler from './plugin-error-handler';
import { PLUGIN_CONSTANTS } from '../config/constants';

class PluginSandbox {
  constructor() {
    this.initialized = false;
    this.securityLevel = PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL;
    this.activeChecks = new Set(['domManipulation', 'codeExecution', 'externalCommunication']);
    this.cachedNatives = {};
    this.sandboxedPlugins = new Set();
    this.sandboxErrors = {};
    this.maxSandboxErrors = 5; 
    
    this.staticAnalysisRules = [
      {name: 'preventEval', pattern: /\beval\s*\(/g, severity: 'critical', message: 'Uso de eval() detectado.'},
      {name: 'preventDocumentWrite', pattern: /document\.write\s*\(/g, severity: 'high', message: 'Uso de document.write() detectado.'},
      {name: 'preventInnerHTML', pattern: /\.innerHTML\s*=/g, severity: 'medium', message: 'Asignación directa a innerHTML detectada.'},
      {name: 'preventWindowOpen', pattern: /window\.open\s*\(/g, severity: 'medium', message: 'Uso de window.open() detectado.'},
      {name: 'preventNewFunction', pattern: /new\s+Function\s*\(/g, severity: 'critical', message: 'Uso de new Function() detectado.'},
      {name: 'preventSetTimeoutString', pattern: /setTimeout\s*\(\s*['"`]/g, severity: 'high', message: 'Uso de setTimeout con string detectado.'},
      {name: 'preventSetIntervalString', pattern: /setInterval\s*\(\s*['"`]/g, severity: 'high', message: 'Uso de setInterval con string detectado.'},
      {name: 'preventAccessStorage', pattern: /(localStorage|sessionStorage|indexedDB)\.(?!getItem|setItem|removeItem|clear|key|length)/g, severity: 'medium', message: 'Acceso directo a Web Storage API detectado. Usar coreAPI.storage.'},
      {name: 'preventDirectFetch', pattern: /\bfetch\s*\(/g, severity: 'medium', message: 'Uso directo de fetch() detectado. Considerar API mediadora.'},
      {name: 'preventXHR', pattern: /new\s+XMLHttpRequest\s*\(/g, severity: 'medium', message: 'Uso de XMLHttpRequest detectado. Considerar API mediadora.'},
      {name: 'preventObjectDefinePropertyOnGlobals', pattern: /Object\.defineProperty\s*\(\s*(Object|Array|String|Number|Function|Boolean|Symbol|Math|JSON|Date|RegExp)\b/g, severity: 'critical', message: 'Intento de modificar propiedades de objetos globales de JavaScript.'}
    ];
  }

  initialize(securityLevelInput) {
    if (this.initialized) {
        if (securityLevelInput === undefined || this.securityLevel === securityLevelInput) {
            console.warn('[Sandbox] Sandbox ya inicializado.');
        } else {
            this.setSecurityLevel(securityLevelInput); 
        }
        return true;
    }
    
    try {
      console.log('[Sandbox] Inicializando sistema de sandbox para plugins...');
      this.securityLevel = securityLevelInput || this.securityLevel;
      this._cacheNativeMethods();
      this._installGlobalProtections();
      this.initialized = true;
      console.log(`[Sandbox] Sandbox inicializado (nivel: ${this.securityLevel})`);
      return true;
    } catch (error) {
      console.error('[Sandbox] Error al inicializar sandbox:', error);
      this.initialized = false;
      return false;
    }
  }

  _cacheNativeMethods() {
    try {
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
      console.error('[Sandbox] Error al cachear métodos nativos:', error);
    }
  }

  _installGlobalProtections() {
    if (this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH) {
      try {
        this._protectGlobalObjects();
        console.log('[Sandbox] Protecciones globales instaladas para nivel HIGH.');
      } catch (error) {
        console.error('[Sandbox] Error al instalar protecciones globales:', error);
      }
    }
  }

  _protectGlobalObjects() {
    const protectedGlobals = [
      Object, Array, String, Number, Function,
      Boolean, Symbol, Math, JSON, Date, RegExp,
    ];
    protectedGlobals.forEach(obj => {
      try {
        if (obj && typeof Object.freeze === 'function') Object.freeze(obj); // Object.freeze es estático
        if (obj && obj.prototype) Object.freeze(obj.prototype);
      } catch (e) {
        // console.warn(`[Sandbox] No se pudo congelar completamente ${obj?.name}: ${e.message}`);
      }
    });
  }

  validatePluginCode(pluginId, plugin) {
    if (!pluginId || !plugin) {
      return {valid: false, reasons: ['Plugin o ID de plugin no válido para validación de código.']};
    }
    try {
      const pluginString = JSON.stringify(plugin); 
      const violations = [];
      this.staticAnalysisRules.forEach(rule => {
        rule.pattern.lastIndex = 0;
        if (rule.pattern.test(pluginString)) {
          violations.push({
            rule: rule.name,
            severity: rule.severity,
            message: rule.message || `Patrón sospechoso '${rule.name}' encontrado.`
          });
        }
      });
      const filteredViolations = this._filterViolationsBySecurityLevel(violations);
      const reasons = filteredViolations.map(v => v.message || `${v.rule} (${v.severity})`);
      if (filteredViolations.length > 0) {
        eventBus.publish('pluginSystem.codeValidationFailed', { pluginId, violations: filteredViolations });
      }
      return {
        valid: reasons.length === 0,
        reasons: reasons.length > 0 ? reasons : [],
        violations: filteredViolations
      };
    } catch (error) {
      console.error(`[Sandbox] Error al validar código del plugin ${pluginId}:`, error);
      return {valid: false, reasons: [`Error durante validación de código: ${error.message}`], violations: []};
    }
  }

  _filterViolationsBySecurityLevel(violations) {
    if (this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW) {
      return violations.filter(v => v.severity === 'critical');
    }
    if (this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL) {
      return violations.filter(v => v.severity === 'critical' || v.severity === 'high');
    }
    return violations;
  }

  async executeSandboxed(pluginId, func, args = [], context = null) {
    if (!this.initialized) {
      console.warn('[Sandbox] Sandbox no inicializado, ejecutando directamente.');
      try {
        return await Promise.resolve(func.apply(context, args));
      } catch (directError) {
        this._handleSandboxError(pluginId || 'unknown_direct_exec', directError);
        throw directError;
      }
    }
    if (!pluginId || typeof func !== 'function') {
      const err = new Error('Argumentos inválidos para executeSandboxed: Se requiere pluginId y func.');
      this._handleSandboxError(pluginId || 'unknown_invalid_args', err);
      return Promise.reject(err);
    }
    this.sandboxedPlugins.add(pluginId);
    return this._monitoredExecution(pluginId, func, args, context);
  }

  async _monitoredExecution(pluginId, func, args, context) {
    let timeoutId = null;
    let timedOut = false;
    
    const executionPromise = new Promise((resolve, reject) => {
      const timeoutDuration = this._getExecutionTimeout();
      timeoutId = this.cachedNatives.setTimeout(() => {
        timedOut = true;
        const timeoutError = new Error(`Ejecución del plugin ${pluginId} excedió el límite de tiempo (${timeoutDuration}ms)`);
        this._handleSandboxError(pluginId, timeoutError); 
        reject(timeoutError);
      }, timeoutDuration);
      
      try {
        const result = func.apply(context, args);
        Promise.resolve(result)
          .then(resolvedResult => {
            if (!timedOut) {
              this.cachedNatives.clearTimeout(timeoutId);
              resolve(resolvedResult);
            }
          })
          .catch(executionError => {
            if (!timedOut) {
              this.cachedNatives.clearTimeout(timeoutId);
              this._handleSandboxError(pluginId, executionError);
              reject(executionError);
            }
          });
      } catch (syncError) {
        if (!timedOut) {
            this.cachedNatives.clearTimeout(timeoutId);
            this._handleSandboxError(pluginId, syncError);
            reject(syncError);
        }
      }
    });
    return executionPromise;
  }

  _getExecutionTimeout() {
    switch (this.securityLevel) {
      case PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW: return 10000;
      case PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH: return 2000;
      default: return 5000;
    }
  }

  _handleSandboxError(pluginId, error) {
    if (!this.sandboxErrors[pluginId]) {
      this.sandboxErrors[pluginId] = [];
    }
    const errorEntry = { timestamp: Date.now(), message: error.message, stack: error.stack };
    this.sandboxErrors[pluginId].push(errorEntry);
    if (this.sandboxErrors[pluginId].length > 20) {
      this.sandboxErrors[pluginId] = this.sandboxErrors[pluginId].slice(-20);
    }
    pluginErrorHandler.handleError(pluginId, 'sandbox', error, { securityLevel: this.securityLevel });
    eventBus.publish('pluginSystem.sandboxError', {
      pluginId, error: error.message, fullError: error, count: this.sandboxErrors[pluginId].length
    });
    if (this.sandboxErrors[pluginId].length >= this.maxSandboxErrors) {
      eventBus.publish('pluginSystem.tooManySandboxErrors', {
        pluginId, count: this.sandboxErrors[pluginId].length, errors: this.sandboxErrors[pluginId].slice(-3)
      });
    }
  }

  createDOMProxy(element, pluginId) {
    if (!element || !pluginId || typeof element.setAttribute !== 'function') {
        return element;
    }
    // Solo crear Proxy si el chequeo de manipulación del DOM está activo
    if (!this.activeChecks.has('domManipulation')) {
        return element;
    }
    
    const sensitiveDOMProps = ['innerHTML', 'outerHTML', 'textContent', 'innerText', 'insertAdjacentHTML', 'srcdoc'];

    return new Proxy(element, {
      get: (target, propKey) => {
        const prop = String(propKey);
        const value = target[prop];
        if (sensitiveDOMProps.includes(prop)) {
          this._logSensitiveAccess(pluginId, 'dom_get', `${element.tagName}.${prop}`);
        }
        if (typeof value === 'function') {
          return (...args) => {
            if (prop === 'setAttribute' && args[0] && sensitiveDOMProps.includes(args[0])) {
              this._handlePotentiallyDangerousOperation(
                pluginId, 'dom_method_call', `setAttribute('${args[0]}')`, { attribute: args[0], value: args[1] }
              );
            }
            return value.apply(target, args);
          };
        }
        return value;
      },
      set: (target, propKey, value) => {
        const prop = String(propKey);
        if (sensitiveDOMProps.includes(prop)) {
          if (typeof value === 'string' && this._containsSuspiciousContent(value)) {
            this._handlePotentiallyDangerousOperation(
              pluginId, 'dom_set', `${prop} = [sospechoso]`, { value }
            );
          } else {
            // Si no es sospechoso, pero es una prop sensible, llamar a _logSensitiveAccess
            this._logSensitiveAccess(pluginId, 'dom_set', `${element.tagName}.${prop}`);
          }
        }
        target[prop] = value;
        return true;
      }
    });
  }

  _containsSuspiciousContent(content) {
    if (typeof content !== 'string') return false;
    const suspiciousPatterns = [
      /<\s*script/i, /javascript\s*:/i, /data\s*:\s*text\/html/i,
      /\bon[a-z]+\s*=/i, /<\s*iframe[^>]+srcdoc\s*=/i
    ];
    return suspiciousPatterns.some(pattern => pattern.test(content));
  }

  _logSensitiveAccess(pluginId, type, target) {
    // Si el monitoreo de manipulación del DOM está activo, siempre publicar el intento de acceso.
    if (this.activeChecks.has('domManipulation')) {
      eventBus.publish('pluginSystem.sensitiveAccessAttempt', {
          pluginId, 
          type, 
          target, 
          securityLevel: this.securityLevel
      });
    }
  }

  _handlePotentiallyDangerousOperation(pluginId, type, operation, details) {
    const isHighSecurity = this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH;
    eventBus.publish('pluginSystem.suspiciousOperation', {
      pluginId, type, operation,
      details: (isHighSecurity || this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL) ? details : null,
      blocked: isHighSecurity
    });
    if (isHighSecurity) {
      throw new Error(`Operación potencialmente peligrosa bloqueada: ${type} ${operation}`);
    }
  }

  updateSecurityChecks(activeChecksInput) {
    if (!activeChecksInput || !Array.isArray(activeChecksInput)) {
        console.warn('[Sandbox] updateSecurityChecks: activeChecksInput debe ser un array.');
        return;
    }
    try {
      this.activeChecks = new Set(activeChecksInput);
      eventBus.publish('pluginSystem.sandboxSecurityChecksUpdated', { checks: Array.from(this.activeChecks) });
    } catch (error) {
      console.error('[Sandbox] Error al actualizar verificaciones de seguridad:', error);
    }
  }

  setSecurityLevel(level) {
    const validLevels = Object.values(PLUGIN_CONSTANTS.SECURITY.LEVEL);
    if (!level || !validLevels.includes(level)) {
        console.warn(`[Sandbox] Nivel de seguridad inválido: ${level}. Los válidos son ${validLevels.join(', ')}`);
        return false;
    }
    try {
      if (this.securityLevel === level && this.initialized) {
          return true;
      }
      this.securityLevel = level;
      if (this.initialized) {
          this._installGlobalProtections();
      }
      eventBus.publish('pluginSystem.sandboxSecurityLevelChanged', { level });
      return true;
    } catch (error) {
      console.error(`[Sandbox] Error al cambiar nivel de seguridad a ${level}:`, error);
      return false;
    }
  }

  getSandboxErrors(pluginId) {
    return pluginId ? (this.sandboxErrors[pluginId] || []) : [];
  }

  clearPluginData(pluginId) {
    if (!pluginId) return false;
    try {
      this.sandboxedPlugins.delete(pluginId);
      delete this.sandboxErrors[pluginId];
      return true;
    } catch (error) {
      console.error(`[Sandbox] Error al limpiar datos de plugin ${pluginId}:`, error);
      return false;
    }
  }

  getStats() {
    try {
      const sandboxedPluginsCount = this.sandboxedPlugins.size;
      const pluginsWithErrorsCount = Object.keys(this.sandboxErrors).length;
      let totalErrors = 0;
      Object.values(this.sandboxErrors).forEach(errors => { totalErrors += errors.length; });
      const topErrorPlugins = Object.entries(this.sandboxErrors)
        .map(([id, errors]) => ({ pluginId: id, errorCount: errors.length }))
        .sort((a, b) => b.errorCount - a.errorCount)
        .slice(0, 3);
      return {
        securityLevel: this.securityLevel,
        activeChecks: Array.from(this.activeChecks),
        sandboxedPlugins: sandboxedPluginsCount,
        pluginsWithErrors: pluginsWithErrorsCount,
        totalErrors,
        topErrorPlugins
      };
    } catch (error) {
      console.error('[Sandbox] Error al obtener estadísticas de sandbox:', error);
      return { error: error.message, securityLevel: this.securityLevel, activeChecks: [], sandboxedPlugins:0, pluginsWithErrors:0, totalErrors:0, topErrorPlugins:[] };
    }
  }
}

const pluginSandbox = new PluginSandbox();
export default pluginSandbox;