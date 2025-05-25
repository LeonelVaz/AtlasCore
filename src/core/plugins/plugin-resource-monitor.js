// src/core/plugins/plugin-resource-monitor.js

/**
 * Monitor de Recursos para Plugins
 */
import eventBus from '../bus/event-bus';
import { PLUGIN_CONSTANTS } from '../config/constants';

class PluginResourceMonitor {
  constructor() {
    this.initialized = false;
    this.securityLevel = PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL;
    this.activeChecks = new Set(['resourceUsage']);
    this.resourceUsage = {};
    this.operationCounts = {};
    
    // Límites de recursos según nivel de seguridad
    this.resourceLimits = {
      [PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW]: {
        memory: 10 * 1024 * 1024, // 10 MB
        storage: 5 * 1024 * 1024, // 5 MB
        cpuTimePerMinute: 5000, // 5 segundos
        operationsPerMinute: 5000,
        domNodesCreated: 500,
        apiCallsPerMinute: 200,
        networkRequestsPerMinute: 60,
        concurrentOperations: 10
      },
      
      [PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL]: {
        memory: 5 * 1024 * 1024, // 5 MB
        storage: 2 * 1024 * 1024, // 2 MB
        cpuTimePerMinute: 2000, // 2 segundos
        operationsPerMinute: 3000,
        domNodesCreated: 200,
        apiCallsPerMinute: 100, 
        networkRequestsPerMinute: 30,
        concurrentOperations: 5
      },
      
      [PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH]: {
        memory: 2 * 1024 * 1024, // 2 MB
        storage: 1 * 1024 * 1024, // 1 MB
        cpuTimePerMinute: 1000, // 1 segundo
        operationsPerMinute: 1000,
        domNodesCreated: 50,
        apiCallsPerMinute: 50,
        networkRequestsPerMinute: 10,
        concurrentOperations: 3
      }
    };
    
    this.restrictedPlugins = new Set();
    this.restrictionMultiplier = 0.5; // 50% de los límites normales
    this.counterResetInterval = 60 * 1000; // 1 minuto
    this.cleanupIntervalId = null;
    this.enhancedMonitoringPlugins = new Set();
    this.cpuTimings = {};
    this.networkRequestListeners = new Map();
  }

  initialize(securityLevelInput) { // Cambiado el nombre del parámetro para claridad
    if (this.initialized) {
      // Solo advertir si se intenta inicializar de nuevo sin un cambio de nivel explícito
      if (securityLevelInput === undefined || this.securityLevel === securityLevelInput) {
          console.warn('[ResourceMonitor] Monitor de recursos ya inicializado.');
      } else {
          // Si se llama con un nuevo nivel, permitir la re-inicialización del nivel.
          // La lógica de setSecurityLevel manejará si realmente hay un cambio.
          this.setSecurityLevel(securityLevelInput);
      }
      return true;
    }
    
    try {
      console.log('[ResourceMonitor] Inicializando monitor de recursos para plugins...');
      
      // Usar el nivel proporcionado, o el actual si no se proporciona (que viene del constructor)
      this.securityLevel = securityLevelInput || this.securityLevel; 
      
      this._startPeriodicCleanup();
      
      if (this.activeChecks.has('networkRequests')) {
        this._setupNetworkMonitoring();
      }
      
      this.initialized = true;
      
      console.log(`[ResourceMonitor] Monitor de recursos inicializado (nivel: ${this.securityLevel})`);
      return true;
    } catch (error) {
      console.error('[ResourceMonitor] Error al inicializar monitor de recursos:', error);
      this.initialized = false; // Asegurar que no se marque como inicializado si falla
      return false;
    }
  }

  _startPeriodicCleanup() {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
    }
    
    this.cleanupIntervalId = setInterval(() => {
      this._resetOperationCounters();
    }, this.counterResetInterval);
  }

  _resetOperationCounters() {
    Object.keys(this.operationCounts).forEach(pluginId => {
      if (!this.resourceUsage[pluginId]) {
        this.resourceUsage[pluginId] = { history: [] };
      }
      
      this.resourceUsage[pluginId].history.push({
        timestamp: Date.now(),
        operations: { ...this.operationCounts[pluginId] } // Guardar una copia
      });
      
      const maxHistorySize = 60;
      if (this.resourceUsage[pluginId].history.length > maxHistorySize) {
        this.resourceUsage[pluginId].history = 
          this.resourceUsage[pluginId].history.slice(-maxHistorySize);
      }
      
      this.operationCounts[pluginId] = {
        apiCalls: 0,
        networkRequests: 0,
        domOperations: 0,
        storageOperations: 0,
        cpuTime: 0,
        totalOperations: 0
      };
    });
  }

  _setupNetworkMonitoring() {
    try {
      // Guardar referencia al fetch original si aún no se ha hecho
      if (!window._originalFetch) {
        window._originalFetch = window.fetch;
      }
      
      window.fetch = async function(resource, options) {
        const pluginId = window.__currentPluginContext || 'unknown';
        
        if (window.__resourceMonitor && typeof window.__resourceMonitor.trackNetworkRequest === 'function') {
          window.__resourceMonitor.trackNetworkRequest(pluginId);
        }
        
        return window._originalFetch.apply(this, arguments);
      };
      
      window.__resourceMonitor = this; // Asegurar que sea la instancia correcta
      
      console.log('[ResourceMonitor] Monitoreo de red configurado.');
    } catch (error) {
      console.error('[ResourceMonitor] Error al configurar monitoreo de red:', error);
    }
  }

  trackOperation(pluginId, operationType = 'general') {
    if (!this.initialized || !pluginId || !this.activeChecks.has('resourceUsage')) {
      return () => {}; // Devolver una función no-op
    }
    
    if (!this.operationCounts[pluginId]) {
      this.operationCounts[pluginId] = {
        apiCalls: 0, networkRequests: 0, domOperations: 0,
        storageOperations: 0, cpuTime: 0, totalOperations: 0
      };
    }
    
    this.operationCounts[pluginId].totalOperations++;
    
    switch (operationType) {
      case 'api': this.operationCounts[pluginId].apiCalls++; break;
      case 'network': this.operationCounts[pluginId].networkRequests++; break;
      case 'dom': this.operationCounts[pluginId].domOperations++; break;
      case 'storage': this.operationCounts[pluginId].storageOperations++; break;
    }
    
    const startTime = performance.now();
    const previousPluginContext = window.__currentPluginContext;
    window.__currentPluginContext = pluginId;
    
    return () => {
      const cpuTime = performance.now() - startTime;
      if (this.operationCounts[pluginId]) { // Verificar que aún exista (pudo ser limpiado)
          this.operationCounts[pluginId].cpuTime += cpuTime;
      }
      window.__currentPluginContext = previousPluginContext;
      
      this._checkResourceLimits(pluginId);
    };
  }

  trackNetworkRequest(pluginId) {
    if (!this.initialized || !pluginId || !this.activeChecks.has('resourceUsage')) return;
    
    if (!this.operationCounts[pluginId]) {
      this.operationCounts[pluginId] = {
        apiCalls: 0, networkRequests: 0, domOperations: 0,
        storageOperations: 0, cpuTime: 0, totalOperations: 0
      };
    }
    
    this.operationCounts[pluginId].networkRequests++;
    this.operationCounts[pluginId].totalOperations++;
    
    this._checkResourceLimits(pluginId);
  }

  trackMemoryUsage(pluginId, bytesUsed) {
    if (!this.initialized || !pluginId || isNaN(bytesUsed) || !this.activeChecks.has('resourceUsage')) return;
    
    if (!this.resourceUsage[pluginId]) {
      this.resourceUsage[pluginId] = { memory: 0, storage: 0, history: [], violations: [] };
    }
    
    this.resourceUsage[pluginId].memory = bytesUsed;
    this._checkResourceLimits(pluginId);
  }

  trackStorageUsage(pluginId, bytesUsed) {
    if (!this.initialized || !pluginId || isNaN(bytesUsed) || !this.activeChecks.has('resourceUsage')) return;
    
    if (!this.resourceUsage[pluginId]) {
      this.resourceUsage[pluginId] = { memory: 0, storage: 0, history: [], violations: [] };
    }
    
    this.resourceUsage[pluginId].storage = bytesUsed;
    this._checkResourceLimits(pluginId);
  }

  _checkResourceLimits(pluginId) {
    if (!pluginId || !this.operationCounts[pluginId] || !this.activeChecks.has('resourceUsage')) return;
    
    const baseLimits = this.resourceLimits[this.securityLevel];
    if (!baseLimits) {
        console.warn(`[ResourceMonitor] No se encontraron límites de recursos para el nivel de seguridad: ${this.securityLevel}`);
        return;
    }
    const isRestricted = this.restrictedPlugins.has(pluginId);
    const multiplier = isRestricted ? this.restrictionMultiplier : 1;
    
    const limits = {
      memory: baseLimits.memory * multiplier,
      storage: baseLimits.storage * multiplier,
      cpuTimePerMinute: baseLimits.cpuTimePerMinute * multiplier,
      operationsPerMinute: baseLimits.operationsPerMinute * multiplier,
      domNodesCreated: baseLimits.domNodesCreated * multiplier,
      apiCallsPerMinute: baseLimits.apiCallsPerMinute * multiplier,
      networkRequestsPerMinute: baseLimits.networkRequestsPerMinute * multiplier
    };
    
    const counts = this.operationCounts[pluginId];
    const violations = [];
    
    if (counts.cpuTime > limits.cpuTimePerMinute) violations.push({ type: 'cpuTime', current: counts.cpuTime, limit: limits.cpuTimePerMinute });
    if (counts.totalOperations > limits.operationsPerMinute) violations.push({ type: 'totalOperations', current: counts.totalOperations, limit: limits.operationsPerMinute });
    if (counts.apiCalls > limits.apiCallsPerMinute) violations.push({ type: 'apiCalls', current: counts.apiCalls, limit: limits.apiCallsPerMinute });
    if (counts.networkRequests > limits.networkRequestsPerMinute) violations.push({ type: 'networkRequests', current: counts.networkRequests, limit: limits.networkRequestsPerMinute });
    if (counts.domOperations > limits.domNodesCreated) violations.push({ type: 'domOperations', current: counts.domOperations, limit: limits.domNodesCreated });
    
    if (this.resourceUsage[pluginId]) {
      if (this.resourceUsage[pluginId].memory > limits.memory) violations.push({ type: 'memory', current: this.resourceUsage[pluginId].memory, limit: limits.memory });
      if (this.resourceUsage[pluginId].storage > limits.storage) violations.push({ type: 'storage', current: this.resourceUsage[pluginId].storage, limit: limits.storage });
    }
    
    if (violations.length > 0) {
      this._handleResourceLimitViolations(pluginId, violations);
    }
  }

  _handleResourceLimitViolations(pluginId, violations) {
    if (!this.resourceUsage[pluginId]) {
      this.resourceUsage[pluginId] = { violations: [], history: [] }; // Asegurar que violations y history existan
    }
    if (!this.resourceUsage[pluginId].violations) {
      this.resourceUsage[pluginId].violations = [];
    }
    
    this.resourceUsage[pluginId].violations.push({ timestamp: Date.now(), violations });
    
    if (this.resourceUsage[pluginId].violations.length > 20) {
      this.resourceUsage[pluginId].violations = this.resourceUsage[pluginId].violations.slice(-20);
    }
    
    this.restrictedPlugins.add(pluginId);
    
    eventBus.publish('pluginSystem.resourceOveruse', { pluginId, violations, action: 'restricted' });
    
    if (this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH) {
      const criticalViolations = violations.filter(v => v.current > v.limit * 2);
      if (criticalViolations.length > 0) {
        eventBus.publish('pluginSystem.securityDeactivateRequest', {
          pluginId,
          reason: `Uso excesivo de recursos: ${criticalViolations.map(v => v.type).join(', ')}`
        });
      }
    }
  }

  applyRestrictions(pluginId) {
    if (!pluginId) return false;
    try {
      this.restrictedPlugins.add(pluginId);
      this.enhancedMonitoringPlugins.add(pluginId); // Aumentar monitoreo al restringir
      eventBus.publish('pluginSystem.pluginRestricted', { pluginId, restrictionLevel: this.restrictionMultiplier });
      return true;
    } catch (error) {
      console.error(`[ResourceMonitor] Error al aplicar restricciones a plugin ${pluginId}:`, error);
      return false;
    }
  }

  removeRestrictions(pluginId) {
    if (!pluginId) return false;
    try {
      const wasRestricted = this.restrictedPlugins.has(pluginId);
      this.restrictedPlugins.delete(pluginId);
      // Considerar si también se debe quitar de enhancedMonitoring aquí o hacerlo explícito.
      // Por ahora, lo dejamos para que se maneje con decreaseMonitoring si es necesario.
      if (wasRestricted) {
        eventBus.publish('pluginSystem.pluginUnrestricted', { pluginId });
      }
      return true;
    } catch (error) {
      console.error(`[ResourceMonitor] Error al eliminar restricciones de plugin ${pluginId}:`, error);
      return false;
    }
  }

  increaseMonitoring(pluginId) {
    if (!pluginId) return false;
    try {
      this.enhancedMonitoringPlugins.add(pluginId);
      return true;
    } catch (error) {
      console.error(`[ResourceMonitor] Error al aumentar monitoreo para plugin ${pluginId}:`, error);
      return false;
    }
  }

  decreaseMonitoring(pluginId) {
    if (!pluginId) return false;
    try {
      this.enhancedMonitoringPlugins.delete(pluginId);
      return true;
    } catch (error) {
      console.error(`[ResourceMonitor] Error al reducir monitoreo para plugin ${pluginId}:`, error);
      return false;
    }
  }

  setSecurityLevel(level) {
    const validLevels = Object.values(PLUGIN_CONSTANTS.SECURITY.LEVEL);
    if (!level || !validLevels.includes(level)) {
        console.warn(`[ResourceMonitor] Nivel de seguridad inválido: ${level}. Los válidos son ${validLevels.join(', ')}`);
        return false;
    }
    
    try {
      if (this.securityLevel === level && this.initialized) { // Solo no hacer nada si ya está inicializado y el nivel es el mismo
          return true;
      }
      this.securityLevel = level;
      eventBus.publish('pluginSystem.resourceMonitorSecurityLevelChanged', { level });
      return true;
    } catch (error) {
      console.error(`[ResourceMonitor] Error al cambiar nivel de seguridad a ${level}:`, error);
      return false;
    }
  }

  updateSecurityChecks(activeChecksInput) {
    if (!activeChecksInput || !Array.isArray(activeChecksInput)) {
        console.warn('[ResourceMonitor] updateSecurityChecks: activeChecksInput debe ser un array.');
        return;
    }
    try {
      const previousChecks = new Set(this.activeChecks);
      this.activeChecks = new Set(activeChecksInput);
      
      const hadNetworkChecks = previousChecks.has('networkRequests');
      const hasNetworkChecks = this.activeChecks.has('networkRequests');
      
      if (!hadNetworkChecks && hasNetworkChecks && typeof window !== 'undefined') { // Añadir typeof window para SSR
        this._setupNetworkMonitoring();
      } else if (hadNetworkChecks && !hasNetworkChecks && typeof window !== 'undefined' && window._originalFetch) {
        // Restaurar fetch original si el monitoreo de red se desactiva
        window.fetch = window._originalFetch;
        delete window.__resourceMonitor;
        console.log('[ResourceMonitor] Monitoreo de red desactivado y fetch restaurado.');
      }
      
      eventBus.publish('pluginSystem.resourceMonitorChecksUpdated', {
        checks: Array.from(this.activeChecks)
      });
    } catch (error) {
      console.error('[ResourceMonitor] Error al actualizar verificaciones de seguridad:', error);
    }
  }

  clearPluginData(pluginId) {
    if (!pluginId) return false;
    try {
      delete this.operationCounts[pluginId];
      delete this.resourceUsage[pluginId];
      this.restrictedPlugins.delete(pluginId);
      this.enhancedMonitoringPlugins.delete(pluginId);
      return true;
    } catch (error) {
      console.error(`[ResourceMonitor] Error al limpiar datos de plugin ${pluginId}:`, error);
      return false;
    }
  }

  getPluginResourceUsage(pluginId) {
    if (!pluginId) {
      return {
        operationCounts: null, resources: null, isRestricted: false,
        hasEnhancedMonitoring: false, limits: this._getEffectiveLimits(null) // Devuelve límites base si no hay pluginId
      };
    }
    try {
      return {
        operationCounts: { ...(this.operationCounts[pluginId] || {}) },
        resources: { ...(this.resourceUsage[pluginId] || { memory: 0, storage: 0, history: [], violations: [] }) },
        isRestricted: this.restrictedPlugins.has(pluginId),
        hasEnhancedMonitoring: this.enhancedMonitoringPlugins.has(pluginId),
        limits: this._getEffectiveLimits(pluginId)
      };
    } catch (error) {
      console.error(`[ResourceMonitor] Error al obtener uso de recursos para plugin ${pluginId}:`, error);
      return {
        error: error.message, isRestricted: false, hasEnhancedMonitoring: false,
        limits: this._getEffectiveLimits(null)
      };
    }
  }

  _getEffectiveLimits(pluginId) {
    const baseLimits = this.resourceLimits[this.securityLevel];
    if (!baseLimits) { // Fallback si el nivel de seguridad es inválido por alguna razón
        console.warn(`[ResourceMonitor] No se pudieron obtener los límites base para el nivel: ${this.securityLevel}. Usando NORMAL.`);
        return this.resourceLimits[PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL] || {};
    }
    const multiplier = pluginId && this.restrictedPlugins.has(pluginId) ? this.restrictionMultiplier : 1;
    
    const effective = {};
    for (const key in baseLimits) {
        effective[key] = baseLimits[key] * multiplier;
    }
    return effective;
  }

  getResourceStats() {
    try {
      const stats = {
        monitoredPlugins: Object.keys(this.operationCounts).length,
        restrictedPlugins: this.restrictedPlugins.size,
        enhancedMonitoring: this.enhancedMonitoringPlugins.size,
        securityLevel: this.securityLevel,
        activeChecks: Array.from(this.activeChecks)
      };
      
      const totalResourceUsage = {
        apiCalls: 0, networkRequests: 0, domOperations: 0,
        storageOperations: 0, cpuTime: 0, totalOperations: 0,
        memory: 0, storage: 0
      };
      
      Object.values(this.operationCounts).forEach(counts => {
        Object.entries(counts).forEach(([key, value]) => {
          if (totalResourceUsage.hasOwnProperty(key)) totalResourceUsage[key] += value || 0;
        });
      });
      
      Object.values(this.resourceUsage).forEach(usage => {
        totalResourceUsage.memory += usage.memory || 0;
        totalResourceUsage.storage += usage.storage || 0;
      });
      stats.totalUsage = totalResourceUsage;
      
      stats.topResourceUsers = Object.entries(this.operationCounts)
        .map(([pluginId, counts]) => ({
          pluginId,
          operationsCount: counts.totalOperations || 0,
          cpuTime: counts.cpuTime || 0
        }))
        .sort((a, b) => b.operationsCount - a.operationsCount || b.cpuTime - a.cpuTime)
        .slice(0, 5);
      
      const pluginsWithViolations = [];
      Object.entries(this.resourceUsage).forEach(([pluginId, usage]) => {
        if (usage.violations && usage.violations.length > 0) {
          const lastViolation = usage.violations[usage.violations.length - 1];
          pluginsWithViolations.push({
            pluginId,
            lastViolationTime: lastViolation.timestamp,
            violationCount: usage.violations.length,
            lastViolationTypes: lastViolation.violations.map(v => v.type)
          });
        }
      });
      stats.recentViolations = pluginsWithViolations
        .sort((a, b) => b.lastViolationTime - a.lastViolationTime)
        .slice(0, 5);
      
      return stats;
    } catch (error) {
      console.error('[ResourceMonitor] Error al obtener estadísticas de recursos:', error);
      return { error: error.message, securityLevel: this.securityLevel };
    }
  }

  cleanup() {
    try {
      if (this.cleanupIntervalId) {
        clearInterval(this.cleanupIntervalId);
        this.cleanupIntervalId = null;
      }
      
      if (typeof window !== 'undefined' && window.__resourceMonitor === this) {
        if (window._originalFetch) { // Restaurar fetch si fue modificado
            window.fetch = window._originalFetch;
            delete window._originalFetch;
        }
        delete window.__resourceMonitor;
        delete window.__currentPluginContext;
      }
      
      this.initialized = false;
      // Opcional: resetear todos los estados a sus valores iniciales del constructor
      // this.resourceUsage = {};
      // this.operationCounts = {};
      // etc.
      return true;
    } catch (error) {
      console.error('[ResourceMonitor] Error en limpieza de monitor de recursos:', error);
      return false;
    }
  }
}

const pluginResourceMonitor = new PluginResourceMonitor();
export default pluginResourceMonitor;