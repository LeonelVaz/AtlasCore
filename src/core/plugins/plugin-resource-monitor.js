/**
 * Monitor de Recursos para Plugins de Atlas
 * 
 * Este módulo se encarga de monitorear y limitar el uso de recursos
 * del sistema por parte de los plugins, previniendo abusos y garantizando
 * un rendimiento óptimo de la aplicación.
 */

import eventBus from '../bus/event-bus';
import { PLUGIN_CONSTANTS } from '../config/constants';

/**
 * Clase para monitorear y limitar recursos de plugins
 */
class PluginResourceMonitor {
  constructor() {
    // Estado de inicialización
    this.initialized = false;
    
    // Nivel de seguridad
    this.securityLevel = PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL;
    
    // Verificaciones activas
    this.activeChecks = new Set(['resourceUsage']);
    
    // Registro de uso de recursos por plugin
    this.resourceUsage = {};
    
    // Contadores de operaciones por plugin
    this.operationCounts = {};
    
    // Límites de recursos según nivel de seguridad
    this.resourceLimits = {
      // Límites en nivel de seguridad BAJO
      [PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW]: {
        memory: 10 * 1024 * 1024, // 10 MB
        storage: 5 * 1024 * 1024, // 5 MB
        cpuTimePerMinute: 5000, // 5 segundos
        operationsPerMinute: 5000, // 5000 operaciones
        domNodesCreated: 500, // 500 nodos DOM
        apiCallsPerMinute: 200, // 200 llamadas a API
        networkRequestsPerMinute: 60, // 60 peticiones de red
        concurrentOperations: 10 // 10 operaciones concurrentes
      },
      
      // Límites en nivel de seguridad NORMAL
      [PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL]: {
        memory: 5 * 1024 * 1024, // 5 MB
        storage: 2 * 1024 * 1024, // 2 MB
        cpuTimePerMinute: 2000, // 2 segundos
        operationsPerMinute: 3000, // 3000 operaciones
        domNodesCreated: 200, // 200 nodos DOM
        apiCallsPerMinute: 100, // 100 llamadas a API
        networkRequestsPerMinute: 30, // 30 peticiones de red
        concurrentOperations: 5 // 5 operaciones concurrentes
      },
      
      // Límites en nivel de seguridad ALTO
      [PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH]: {
        memory: 2 * 1024 * 1024, // 2 MB
        storage: 1 * 1024 * 1024, // 1 MB
        cpuTimePerMinute: 1000, // 1 segundo
        operationsPerMinute: 1000, // 1000 operaciones
        domNodesCreated: 50, // 50 nodos DOM
        apiCallsPerMinute: 50, // 50 llamadas a API
        networkRequestsPerMinute: 10, // 10 peticiones de red
        concurrentOperations: 3 // 3 operaciones concurrentes
      }
    };
    
    // Plugins con restricciones adicionales
    this.restrictedPlugins = new Set();
    
    // Límites adicionales para plugins restringidos (multiplicador)
    this.restrictionMultiplier = 0.5; // 50% de los límites normales
    
    // Tiempo para limpiar contadores (1 minuto)
    this.counterResetInterval = 60 * 1000;
    
    // ID del intervalo de limpieza
    this.cleanupIntervalId = null;
    
    // Plugins en nivel de monitoreo elevado
    this.enhancedMonitoringPlugins = new Set();
    
    // Marcas de tiempo para medición de CPU
    this.cpuTimings = {};
    
    // Listeners para peticiones de red
    this.networkRequestListeners = new Map();
  }

  /**
   * Inicializa el monitor de recursos
   * @param {string} securityLevel - Nivel de seguridad
   * @returns {boolean} - true si se inicializó correctamente
   */
  initialize(securityLevel) {
    if (this.initialized) {
      console.warn('Monitor de recursos ya inicializado');
      return true;
    }
    
    try {
      console.log('Inicializando monitor de recursos para plugins...');
      
      // Establecer nivel de seguridad
      this.securityLevel = securityLevel || PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL;
      
      // Iniciar limpieza periódica de contadores
      this._startPeriodicCleanup();
      
      // Monitorear peticiones de red si está activo
      if (this.activeChecks.has('networkRequests')) {
        this._setupNetworkMonitoring();
      }
      
      this.initialized = true;
      
      console.log(`Monitor de recursos inicializado (nivel: ${this.securityLevel})`);
      return true;
    } catch (error) {
      console.error('Error al inicializar monitor de recursos:', error);
      return false;
    }
  }

  /**
   * Inicia la limpieza periódica de contadores
   * @private
   */
  _startPeriodicCleanup() {
    // Limpiar intervalo anterior si existe
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
    }
    
    // Crear nuevo intervalo
    this.cleanupIntervalId = setInterval(() => {
      this._resetOperationCounters();
    }, this.counterResetInterval);
    
    console.log(`Limpieza periódica de contadores configurada (${this.counterResetInterval}ms)`);
  }

  /**
   * Resetea contadores de operaciones
   * @private
   */
  _resetOperationCounters() {
    // Para cada plugin, resetear contadores por minuto
    Object.keys(this.operationCounts).forEach(pluginId => {
      // Guardar histórico antes de resetear
      if (!this.resourceUsage[pluginId]) {
        this.resourceUsage[pluginId] = { history: [] };
      }
      
      // Guardar snapshot actual en histórico
      this.resourceUsage[pluginId].history.push({
        timestamp: Date.now(),
        operations: { ...this.operationCounts[pluginId] }
      });
      
      // Limitar tamaño del histórico (últimas 60 entradas - 1 hora)
      const maxHistorySize = 60;
      if (this.resourceUsage[pluginId].history.length > maxHistorySize) {
        this.resourceUsage[pluginId].history = 
          this.resourceUsage[pluginId].history.slice(-maxHistorySize);
      }
      
      // Resetear contadores para el nuevo período
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

  /**
   * Configura monitoreo de peticiones de red
   * @private
   */
  _setupNetworkMonitoring() {
    try {
      // Monitorear fetch (global)
      const originalFetch = window.fetch;
      
      window.fetch = async function(resource, options) {
        // Intentar detectar qué plugin realiza la petición
        // (esto es una simplificación, en un sistema real sería más sofisticado)
        const pluginId = window.__currentPluginContext || 'unknown';
        
        // Registrar petición
        if (window.__resourceMonitor) {
          window.__resourceMonitor.trackNetworkRequest(pluginId);
        }
        
        // Realizar petición original
        return originalFetch.apply(this, arguments);
      };
      
      // Exponer referencia a this en window para usar en el monkey patch
      window.__resourceMonitor = this;
      
      console.log('Monitoreo de red configurado');
    } catch (error) {
      console.error('Error al configurar monitoreo de red:', error);
    }
  }

  /**
   * Registra el inicio de una operación para un plugin
   * @param {string} pluginId - ID del plugin
   * @param {string} operationType - Tipo de operación
   * @returns {Function} - Función para finalizar la operación
   */
  trackOperation(pluginId, operationType = 'general') {
    if (!this.initialized || !pluginId) {
      // No-op function if not initialized
      return () => {};
    }
    
    // Verificar si el monitoreo está activo
    if (!this.activeChecks.has('resourceUsage')) {
      return () => {};
    }
    
    // Inicializar contadores si no existen
    if (!this.operationCounts[pluginId]) {
      this.operationCounts[pluginId] = {
        apiCalls: 0,
        networkRequests: 0,
        domOperations: 0,
        storageOperations: 0,
        cpuTime: 0,
        totalOperations: 0
      };
    }
    
    // Incrementar contador total
    this.operationCounts[pluginId].totalOperations++;
    
    // Incrementar contador específico
    switch (operationType) {
      case 'api':
        this.operationCounts[pluginId].apiCalls++;
        break;
      case 'network':
        this.operationCounts[pluginId].networkRequests++;
        break;
      case 'dom':
        this.operationCounts[pluginId].domOperations++;
        break;
      case 'storage':
        this.operationCounts[pluginId].storageOperations++;
        break;
    }
    
    // Registrar inicio para medición de CPU
    const startTime = performance.now();
    
    // Guardar referencia al plugin actual para monitoreo
    const previousPlugin = window.__currentPluginContext;
    window.__currentPluginContext = pluginId;
    
    // Devolver función para finalizar tracking
    return () => {
      // Calcular tiempo de CPU
      const endTime = performance.now();
      const cpuTime = endTime - startTime;
      
      // Añadir al total
      this.operationCounts[pluginId].cpuTime += cpuTime;
      
      // Restaurar contexto previo
      window.__currentPluginContext = previousPlugin;
      
      // Verificar límites después de la operación
      this._checkResourceLimits(pluginId);
    };
  }

  /**
   * Registra una petición de red de un plugin
   * @param {string} pluginId - ID del plugin
   */
  trackNetworkRequest(pluginId) {
    if (!this.initialized || !pluginId) {
      return;
    }
    
    // Inicializar contadores si no existen
    if (!this.operationCounts[pluginId]) {
      this.operationCounts[pluginId] = {
        apiCalls: 0,
        networkRequests: 0,
        domOperations: 0,
        storageOperations: 0,
        cpuTime: 0,
        totalOperations: 0
      };
    }
    
    // Incrementar contadores
    this.operationCounts[pluginId].networkRequests++;
    this.operationCounts[pluginId].totalOperations++;
    
    // Verificar límites
    this._checkResourceLimits(pluginId);
  }

  /**
   * Registra uso de memoria de un plugin
   * @param {string} pluginId - ID del plugin
   * @param {number} bytesUsed - Bytes utilizados
   */
  trackMemoryUsage(pluginId, bytesUsed) {
    if (!this.initialized || !pluginId || isNaN(bytesUsed)) {
      return;
    }
    
    // Inicializar datos si no existen
    if (!this.resourceUsage[pluginId]) {
      this.resourceUsage[pluginId] = { memory: 0, history: [] };
    }
    
    // Actualizar uso de memoria
    this.resourceUsage[pluginId].memory = bytesUsed;
    
    // Verificar límites
    this._checkResourceLimits(pluginId);
  }

  /**
   * Registra uso de almacenamiento de un plugin
   * @param {string} pluginId - ID del plugin
   * @param {number} bytesUsed - Bytes utilizados
   */
  trackStorageUsage(pluginId, bytesUsed) {
    if (!this.initialized || !pluginId || isNaN(bytesUsed)) {
      return;
    }
    
    // Inicializar datos si no existen
    if (!this.resourceUsage[pluginId]) {
      this.resourceUsage[pluginId] = { storage: 0, history: [] };
    }
    
    // Actualizar uso de almacenamiento
    this.resourceUsage[pluginId].storage = bytesUsed;
    
    // Verificar límites
    this._checkResourceLimits(pluginId);
  }

  /**
   * Verifica si un plugin ha excedido sus límites de recursos
   * @param {string} pluginId - ID del plugin
   * @private
   */
  _checkResourceLimits(pluginId) {
    if (!pluginId || !this.operationCounts[pluginId]) {
      return;
    }
    
    // Obtener límites según nivel de seguridad
    const baseLimits = this.resourceLimits[this.securityLevel];
    
    // Aplicar restricciones adicionales si el plugin está restringido
    const isRestricted = this.restrictedPlugins.has(pluginId);
    const multiplier = isRestricted ? this.restrictionMultiplier : 1;
    
    // Calcular límites efectivos
    const limits = {
      memory: baseLimits.memory * multiplier,
      storage: baseLimits.storage * multiplier,
      cpuTimePerMinute: baseLimits.cpuTimePerMinute * multiplier,
      operationsPerMinute: baseLimits.operationsPerMinute * multiplier,
      domNodesCreated: baseLimits.domNodesCreated * multiplier,
      apiCallsPerMinute: baseLimits.apiCallsPerMinute * multiplier,
      networkRequestsPerMinute: baseLimits.networkRequestsPerMinute * multiplier
    };
    
    // Obtener contadores actuales
    const counts = this.operationCounts[pluginId];
    
    // Verificar cada límite
    const violations = [];
    
    // Verificar uso de CPU
    if (counts.cpuTime > limits.cpuTimePerMinute) {
      violations.push({
        type: 'cpuTime',
        current: counts.cpuTime,
        limit: limits.cpuTimePerMinute
      });
    }
    
    // Verificar operaciones totales
    if (counts.totalOperations > limits.operationsPerMinute) {
      violations.push({
        type: 'totalOperations',
        current: counts.totalOperations,
        limit: limits.operationsPerMinute
      });
    }
    
    // Verificar llamadas a API
    if (counts.apiCalls > limits.apiCallsPerMinute) {
      violations.push({
        type: 'apiCalls',
        current: counts.apiCalls,
        limit: limits.apiCallsPerMinute
      });
    }
    
    // Verificar peticiones de red
    if (counts.networkRequests > limits.networkRequestsPerMinute) {
      violations.push({
        type: 'networkRequests',
        current: counts.networkRequests,
        limit: limits.networkRequestsPerMinute
      });
    }
    
    // Verificar operaciones DOM
    if (counts.domOperations > limits.domNodesCreated) {
      violations.push({
        type: 'domOperations',
        current: counts.domOperations,
        limit: limits.domNodesCreated
      });
    }
    
    // Verificar memoria y almacenamiento
    if (this.resourceUsage[pluginId]) {
      if (this.resourceUsage[pluginId].memory > limits.memory) {
        violations.push({
          type: 'memory',
          current: this.resourceUsage[pluginId].memory,
          limit: limits.memory
        });
      }
      
      if (this.resourceUsage[pluginId].storage > limits.storage) {
        violations.push({
          type: 'storage',
          current: this.resourceUsage[pluginId].storage,
          limit: limits.storage
        });
      }
    }
    
    // Si hay violaciones, notificar
    if (violations.length > 0) {
      this._handleResourceLimitViolations(pluginId, violations);
    }
  }

  /**
   * Maneja violaciones de límites de recursos
   * @param {string} pluginId - ID del plugin
   * @param {Array} violations - Lista de violaciones
   * @private
   */
  _handleResourceLimitViolations(pluginId, violations) {
    // Registrar violaciones
    if (!this.resourceUsage[pluginId]) {
      this.resourceUsage[pluginId] = { violations: [] };
    }
    
    if (!this.resourceUsage[pluginId].violations) {
      this.resourceUsage[pluginId].violations = [];
    }
    
    // Añadir violación al historial
    this.resourceUsage[pluginId].violations.push({
      timestamp: Date.now(),
      violations
    });
    
    // Limitar tamaño del historial (últimas 20)
    if (this.resourceUsage[pluginId].violations.length > 20) {
      this.resourceUsage[pluginId].violations = 
        this.resourceUsage[pluginId].violations.slice(-20);
    }
    
    // Aplicar restricciones
    this.restrictedPlugins.add(pluginId);
    
    // Publicar evento
    eventBus.publish('pluginSystem.resourceOveruse', {
      pluginId,
      violations,
      action: 'restricted'
    });
    
    // En nivel de seguridad alto, tomar medidas más severas para violaciones graves
    if (this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH) {
      // Buscar violaciones críticas (más del 200% del límite)
      const criticalViolations = violations.filter(v => v.current > v.limit * 2);
      
      if (criticalViolations.length > 0) {
        // Solicitar desactivación del plugin
        eventBus.publish('pluginSystem.securityDeactivateRequest', {
          pluginId,
          reason: `Uso excesivo de recursos: ${criticalViolations.map(v => v.type).join(', ')}`
        });
      }
    }
  }

  /**
   * Aplica restricciones adicionales a un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {boolean} - true si se aplicaron restricciones
   */
  applyRestrictions(pluginId) {
    if (!pluginId) return false;
    
    try {
      // Añadir a lista de plugins restringidos
      this.restrictedPlugins.add(pluginId);
      
      // Añadir a monitoreo elevado
      this.enhancedMonitoringPlugins.add(pluginId);
      
      // Publicar evento
      eventBus.publish('pluginSystem.pluginRestricted', {
        pluginId,
        restrictionLevel: this.restrictionMultiplier
      });
      
      return true;
    } catch (error) {
      console.error(`Error al aplicar restricciones a plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Elimina restricciones adicionales de un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {boolean} - true si se eliminaron restricciones
   */
  removeRestrictions(pluginId) {
    if (!pluginId) return false;
    
    try {
      // Quitar de lista de plugins restringidos
      const wasRestricted = this.restrictedPlugins.has(pluginId);
      this.restrictedPlugins.delete(pluginId);
      
      // Quitar de monitoreo elevado
      this.enhancedMonitoringPlugins.delete(pluginId);
      
      // Si estaba restringido, publicar evento
      if (wasRestricted) {
        eventBus.publish('pluginSystem.pluginUnrestricted', {
          pluginId
        });
      }
      
      return true;
    } catch (error) {
      console.error(`Error al eliminar restricciones de plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Aumenta el nivel de monitoreo para un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {boolean} - true si se aumentó el monitoreo
   */
  increaseMonitoring(pluginId) {
    if (!pluginId) return false;
    
    try {
      // Añadir a plugins con monitoreo elevado
      this.enhancedMonitoringPlugins.add(pluginId);
      
      return true;
    } catch (error) {
      console.error(`Error al aumentar monitoreo para plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Reduce el nivel de monitoreo para un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {boolean} - true si se redujo el monitoreo
   */
  decreaseMonitoring(pluginId) {
    if (!pluginId) return false;
    
    try {
      // Quitar de plugins con monitoreo elevado
      this.enhancedMonitoringPlugins.delete(pluginId);
      
      return true;
    } catch (error) {
      console.error(`Error al reducir monitoreo para plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Establece el nivel de seguridad del monitor
   * @param {string} level - Nivel de seguridad
   * @returns {boolean} - true si se cambió correctamente
   */
  setSecurityLevel(level) {
    if (!level || !PLUGIN_CONSTANTS.SECURITY.LEVEL[level]) {
      return false;
    }
    
    try {
      this.securityLevel = level;
      
      // Publicar evento
      eventBus.publish('pluginSystem.resourceMonitorSecurityLevelChanged', {
        level
      });
      
      return true;
    } catch (error) {
      console.error(`Error al cambiar nivel de seguridad a ${level}:`, error);
      return false;
    }
  }

  /**
   * Actualiza la lista de verificaciones de seguridad activas
   * @param {Set} activeChecks - Conjunto de verificaciones activas
   */
  updateSecurityChecks(activeChecks) {
    if (!activeChecks) return;
    
    try {
      const previousChecks = new Set(this.activeChecks);
      this.activeChecks = new Set(activeChecks);
      
      // Verificar si monitoreo de red cambió
      const hadNetworkChecks = previousChecks.has('networkRequests');
      const hasNetworkChecks = this.activeChecks.has('networkRequests');
      
      if (!hadNetworkChecks && hasNetworkChecks) {
        // Activar monitoreo de red
        this._setupNetworkMonitoring();
      }
      
      // Publicar evento de actualización
      eventBus.publish('pluginSystem.resourceMonitorChecksUpdated', {
        checks: Array.from(this.activeChecks)
      });
    } catch (error) {
      console.error('Error al actualizar verificaciones de seguridad:', error);
    }
  }

  /**
   * Limpia todos los datos relacionados con un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {boolean} - true si se limpió correctamente
   */
  clearPluginData(pluginId) {
    if (!pluginId) return false;
    
    try {
      // Eliminar contadores de operaciones
      delete this.operationCounts[pluginId];
      
      // Eliminar datos de recursos
      delete this.resourceUsage[pluginId];
      
      // Quitar de listas especiales
      this.restrictedPlugins.delete(pluginId);
      this.enhancedMonitoringPlugins.delete(pluginId);
      
      return true;
    } catch (error) {
      console.error(`Error al limpiar datos de plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Obtiene información de uso de recursos para un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {Object} - Información de uso de recursos
   */
  getPluginResourceUsage(pluginId) {
    if (!pluginId) {
      return {
        operationCounts: null,
        resources: null,
        isRestricted: false,
        hasEnhancedMonitoring: false
      };
    }
    
    try {
      return {
        operationCounts: this.operationCounts[pluginId] || null,
        resources: this.resourceUsage[pluginId] || null,
        isRestricted: this.restrictedPlugins.has(pluginId),
        hasEnhancedMonitoring: this.enhancedMonitoringPlugins.has(pluginId),
        limits: this._getEffectiveLimits(pluginId)
      };
    } catch (error) {
      console.error(`Error al obtener uso de recursos para plugin ${pluginId}:`, error);
      
      return {
        error: error.message,
        isRestricted: this.restrictedPlugins.has(pluginId),
        hasEnhancedMonitoring: this.enhancedMonitoringPlugins.has(pluginId)
      };
    }
  }

  /**
   * Obtiene límites efectivos para un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {Object} - Límites efectivos
   * @private
   */
  _getEffectiveLimits(pluginId) {
    // Obtener límites base según nivel de seguridad
    const baseLimits = this.resourceLimits[this.securityLevel];
    
    // Aplicar multiplicador si el plugin está restringido
    const multiplier = this.restrictedPlugins.has(pluginId) ? 
      this.restrictionMultiplier : 1;
    
    // Calcular límites efectivos
    return {
      memory: baseLimits.memory * multiplier,
      storage: baseLimits.storage * multiplier,
      cpuTimePerMinute: baseLimits.cpuTimePerMinute * multiplier,
      operationsPerMinute: baseLimits.operationsPerMinute * multiplier,
      domNodesCreated: baseLimits.domNodesCreated * multiplier,
      apiCallsPerMinute: baseLimits.apiCallsPerMinute * multiplier,
      networkRequestsPerMinute: baseLimits.networkRequestsPerMinute * multiplier
    };
  }

  /**
   * Obtiene estadísticas generales de uso de recursos
   * @returns {Object} - Estadísticas de recursos
   */
  getResourceStats() {
    try {
      // Plugins monitoreados
      const monitoredPluginsCount = Object.keys(this.operationCounts).length;
      
      // Plugins restringidos
      const restrictedPluginsCount = this.restrictedPlugins.size;
      
      // Plugins con monitoreo elevado
      const enhancedMonitoringCount = this.enhancedMonitoringPlugins.size;
      
      // Uso total de recursos
      const totalResourceUsage = {
        apiCalls: 0,
        networkRequests: 0,
        domOperations: 0,
        storageOperations: 0,
        cpuTime: 0,
        totalOperations: 0,
        memory: 0,
        storage: 0
      };
      
      // Sumar contadores de todos los plugins
      Object.values(this.operationCounts).forEach(counts => {
        totalResourceUsage.apiCalls += counts.apiCalls || 0;
        totalResourceUsage.networkRequests += counts.networkRequests || 0;
        totalResourceUsage.domOperations += counts.domOperations || 0;
        totalResourceUsage.storageOperations += counts.storageOperations || 0;
        totalResourceUsage.cpuTime += counts.cpuTime || 0;
        totalResourceUsage.totalOperations += counts.totalOperations || 0;
      });
      
      // Sumar memoria y almacenamiento
      Object.values(this.resourceUsage).forEach(usage => {
        totalResourceUsage.memory += usage.memory || 0;
        totalResourceUsage.storage += usage.storage || 0;
      });
      
      // Plugins con mayor uso de recursos
      const pluginsResourceRanking = Object.entries(this.operationCounts)
        .map(([pluginId, counts]) => ({
          pluginId,
          operationsCount: counts.totalOperations || 0,
          cpuTime: counts.cpuTime || 0
        }))
        .sort((a, b) => b.operationsCount - a.operationsCount)
        .slice(0, 5); // Top 5
      
      // Plugins con violaciones recientes
      const pluginsWithViolations = [];
      
      Object.entries(this.resourceUsage).forEach(([pluginId, usage]) => {
        if (usage.violations && usage.violations.length > 0) {
          // Obtener última violación
          const lastViolation = usage.violations[usage.violations.length - 1];
          
          pluginsWithViolations.push({
            pluginId,
            lastViolationTime: lastViolation.timestamp,
            violationCount: usage.violations.length,
            lastViolationTypes: lastViolation.violations.map(v => v.type)
          });
        }
      });
      
      // Ordenar por tiempo de violación (más reciente primero)
      pluginsWithViolations.sort((a, b) => b.lastViolationTime - a.lastViolationTime);
      
      return {
        monitoredPlugins: monitoredPluginsCount,
        restrictedPlugins: restrictedPluginsCount,
        enhancedMonitoring: enhancedMonitoringCount,
        totalUsage: totalResourceUsage,
        topResourceUsers: pluginsResourceRanking,
        recentViolations: pluginsWithViolations.slice(0, 5), // Top 5
        securityLevel: this.securityLevel,
        activeChecks: Array.from(this.activeChecks)
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de recursos:', error);
      
      return {
        error: error.message,
        securityLevel: this.securityLevel
      };
    }
  }

  /**
   * Realiza limpieza al desactivar el monitor
   */
  cleanup() {
    try {
      // Detener intervalo de limpieza
      if (this.cleanupIntervalId) {
        clearInterval(this.cleanupIntervalId);
        this.cleanupIntervalId = null;
      }
      
      // Restaurar fetch original si fue modificado
      if (window.__resourceMonitor === this) {
        delete window.__resourceMonitor;
        delete window.__currentPluginContext;
      }
      
      this.initialized = false;
      
      return true;
    } catch (error) {
      console.error('Error en limpieza de monitor de recursos:', error);
      return false;
    }
  }
}

// Exportar instancia única
const pluginResourceMonitor = new PluginResourceMonitor();
export default pluginResourceMonitor;