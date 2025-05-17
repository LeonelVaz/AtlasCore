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
    
    // Reglas de análisis estático 
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
        message: 'Uso de document.write() detectado'
      },
      {
        name: 'preventInnerHTML',
        pattern: /\.innerHTML\s*=/g,
        severity: 'medium',
        message: 'Uso de innerHTML detectado'
      },
      {
        name: 'preventWindowOpen',
        pattern: /window\.open\s*\(/g,
        severity: 'medium',
        message: 'Uso de window.open() detectado'
      },
      {
        name: 'preventNewFunction',
        pattern: /new\s+Function\s*\(/g,
        severity: 'critical',
        message: 'Uso de new Function() detectado'
      },
      {
        name: 'preventSetTimeout',
        pattern: /setTimeout\s*\(\s*['"`]/g,
        severity: 'high',
        message: 'Uso de setTimeout con string como argumento detectado'
      },
      {
        name: 'preventSetInterval',
        pattern: /setInterval\s*\(\s*['"`]/g,
        severity: 'high',
        message: 'Uso de setInterval con string como argumento detectado'
      },
      {
        name: 'preventAccessStorage',
        pattern: /(localStorage|sessionStorage|indexedDB)\./g,
        severity: 'medium',
        message: 'Acceso directo a almacenamiento del navegador detectado'
      },
      {
        name: 'preventDirectFetch',
        pattern: /\bfetch\s*\(/g,
        severity: 'medium',
        message: 'Uso directo de fetch() detectado'
      },
      {
        name: 'preventXHR',
        pattern: /new\s+XMLHttpRequest\s*\(/g,
        severity: 'medium',
        message: 'Uso de XMLHttpRequest detectado'
      },
      {
        name: 'preventObjectDefineProperty',
        pattern: /Object\.defineProperty\s*\(\s*(Object|Array|String|Number|Function|Boolean|Symbol|Math|JSON|Date|RegExp)\./g,
        severity: 'critical',
        message: 'Intento de modificar objetos nativos detectado'
      }
    ];
  }

  initialize(securityLevel) {
    if (this.initialized) {
      console.warn('Sandbox ya inicializado');
      return true;
    }
    
    try {
      console.log('Inicializando sistema de sandbox para plugins...');
      
      this.securityLevel = securityLevel || PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL;
      
      this._cacheNativeMethods();
      this._installGlobalProtections();
      
      this.initialized = true;
      
      console.log(`Sandbox inicializado (nivel: ${this.securityLevel})`);
      return true;
    } catch (error) {
      console.error('Error al inicializar sandbox:', error);
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
      console.error('Error al cachear métodos nativos:', error);
    }
  }

  _installGlobalProtections() {
    if (this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH) {
      try {
        this._protectGlobalObjects();
      } catch (error) {
        console.error('Error al instalar protecciones globales:', error);
      }
    }
  }

  _protectGlobalObjects() {
    const protectedGlobals = [
      Object, Array, String, Number, Function, 
      Boolean, Symbol, Math, JSON, Date, RegExp
    ];
    
    protectedGlobals.forEach(obj => {
      try {
        Object.freeze(obj);
        Object.freeze(obj.prototype);
      } catch (e) {
        // Algunos objetos no tienen prototype o no se pueden congelar
      }
    });
    
    console.log('Protecciones globales instaladas');
  }

  validatePluginCode(pluginId, plugin) {
    if (!pluginId || !plugin) {
      return {
        valid: false,
        reasons: ['Plugin no válido para validación']
      };
    }
    
    try {
      const pluginString = JSON.stringify(plugin);
      const violations = [];
      
      for (const rule of this.staticAnalysisRules) {
        if (rule.pattern.test(pluginString)) {
          violations.push({
            rule: rule.name,
            severity: rule.severity,
            message: rule.message
          });
          
          rule.pattern.lastIndex = 0;
        }
      }
      
      const filteredViolations = this._filterViolationsBySecurityLevel(violations);
      const reasons = filteredViolations.map(v => `${v.message} (${v.severity})`);
      
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
      console.warn('Sandbox no inicializado');
      return func.apply(context, args);
    }
    
    if (!pluginId || typeof func !== 'function') {
      throw new Error('Argumentos inválidos para executeSandboxed');
    }
    
    this.sandboxedPlugins.add(pluginId);
    
    try {
      return await this._monitoredExecution(pluginId, func, args, context);
    } catch (error) {
      this._handleSandboxError(pluginId, error);
      throw error;
    }
  }

  async _monitoredExecution(pluginId, func, args, context) {
    try {
      let timedOut = false;
      let timeoutId = null;
      
      const executionPromise = new Promise((resolve, reject) => {
        const timeout = this._getExecutionTimeout();
        
        timeoutId = this.cachedNatives.setTimeout(() => {
          timedOut = true;
          reject(new Error(`Ejecución del plugin ${pluginId} excedió el límite de tiempo (${timeout}ms)`));
        }, timeout);
        
        try {
          const result = func.apply(context, args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      executionPromise.finally(() => {
        if (timeoutId !== null && !timedOut) {
          this.cachedNatives.clearTimeout(timeoutId);
        }
      });
      
      return executionPromise;
    } catch (error) {
      this._handleSandboxError(pluginId, error);
      throw error;
    }
  }

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

  _handleSandboxError(pluginId, error) {
    if (!this.sandboxErrors[pluginId]) {
      this.sandboxErrors[pluginId] = [];
    }
    
    this.sandboxErrors[pluginId].push({
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack
    });
    
    if (this.sandboxErrors[pluginId].length > 20) {
      this.sandboxErrors[pluginId] = this.sandboxErrors[pluginId].slice(-20);
    }
    
    pluginErrorHandler.handleError(
      pluginId,
      'sandbox',
      error,
      { securityLevel: this.securityLevel }
    );
    
    eventBus.publish('pluginSystem.sandboxError', {
      pluginId,
      error: error.message,
      count: this.sandboxErrors[pluginId].length
    });
    
    if (this.sandboxErrors[pluginId].length >= this.maxSandboxErrors) {
      eventBus.publish('pluginSystem.tooManySandboxErrors', {
        pluginId,
        count: this.sandboxErrors[pluginId].length,
        errors: this.sandboxErrors[pluginId].slice(-3)
      });
    }
  }

  // Métodos adicionales condensados...
  
  createDOMProxy(element, pluginId) {
    if (!element || !pluginId || !this.activeChecks.has('domManipulation')) {
      return element;
    }
    
    const sensitiveDOMProps = ['innerHTML', 'outerHTML', 'insertAdjacentHTML'];
    
    return new Proxy(element, {
      get: (target, prop) => {
        const value = target[prop];
        
        if (sensitiveDOMProps.includes(prop)) {
          this._logSensitiveAccess(pluginId, 'dom', `${element.tagName}.${prop}`);
        }
        
        if (typeof value === 'function') {
          return (...args) => {
            if (prop === 'setAttribute' && args[0] === 'srcdoc') {
              this._handlePotentiallyDangerousOperation(
                pluginId, 'dom', `setAttribute('srcdoc')`, args
              );
            }
            
            return value.apply(target, args);
          };
        }
        
        return value;
      },
      
      set: (target, prop, value) => {
        if (sensitiveDOMProps.includes(prop)) {
          if (typeof value === 'string' && this._containsSuspiciousContent(value)) {
            this._handlePotentiallyDangerousOperation(
              pluginId, 'dom', `${prop} = [sospechoso]`, { value }
            );
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
      /<\s*script/i,
      /javascript\s*:/i,
      /data\s*:\s*text\/html/i,
      /on[a-z]+\s*=/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(content));
  }

  _logSensitiveAccess(pluginId, type, target) {
    if (this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH) {
      console.warn(`[Sandbox] Plugin ${pluginId} accedió a ${type} sensible: ${target}`);
    }
  }

  _handlePotentiallyDangerousOperation(pluginId, type, operation, details) {
    const isHighSecurity = this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH;
    
    eventBus.publish('pluginSystem.suspiciousOperation', {
      pluginId,
      type,
      operation,
      details: isHighSecurity ? details : null,
      blocked: isHighSecurity
    });
    
    if (isHighSecurity) {
      throw new Error(`Operación potencialmente peligrosa bloqueada: ${type} ${operation}`);
    }
  }

  // Métodos simplificados...
  
  updateSecurityChecks(activeChecks) {
    if (!activeChecks) return;
    
    this.activeChecks = new Set(activeChecks);
    
    eventBus.publish('pluginSystem.sandboxSecurityChecksUpdated', {
      checks: Array.from(this.activeChecks)
    });
  }

  setSecurityLevel(level) {
    if (!level || !PLUGIN_CONSTANTS.SECURITY.LEVEL[level]) {
      return false;
    }
    
    try {
      this.securityLevel = level;
      
      if (level === PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH) {
        this._installGlobalProtections();
      }
      
      eventBus.publish('pluginSystem.sandboxSecurityLevelChanged', { level });
      
      return true;
    } catch (error) {
      console.error(`Error al cambiar nivel de seguridad a ${level}:`, error);
      return false;
    }
  }

  getSandboxErrors(pluginId) {
    return !pluginId ? [] : (this.sandboxErrors[pluginId] || []);
  }

  clearPluginData(pluginId) {
    if (!pluginId) return false;
    
    try {
      this.sandboxedPlugins.delete(pluginId);
      delete this.sandboxErrors[pluginId];
      
      return true;
    } catch (error) {
      console.error(`Error al limpiar datos de plugin ${pluginId}:`, error);
      return false;
    }
  }

  getStats() {
    try {
      const sandboxedPluginsCount = this.sandboxedPlugins.size;
      const pluginsWithErrorsCount = Object.keys(this.sandboxErrors).length;
      
      let totalErrors = 0;
      Object.values(this.sandboxErrors).forEach(errors => {
        totalErrors += errors.length;
      });
      
      const topErrorPlugins = Object.entries(this.sandboxErrors)
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 3)
        .map(([pluginId, errors]) => ({
          pluginId, errorCount: errors.length
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
      return { error: error.message };
    }
  }
}

const pluginSandbox = new PluginSandbox();
export default pluginSandbox;