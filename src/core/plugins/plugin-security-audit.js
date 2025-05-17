/**
 * Sistema de Auditoría de Seguridad para Plugins de Atlas
 * 
 * Este módulo se encarga de registrar y analizar eventos relacionados
 * con la seguridad de los plugins, proporcionando trazabilidad
 * y capacidad de detección de comportamientos sospechosos.
 */

import { PLUGIN_CONSTANTS } from '../config/constants';
import storageService from '../../services/storage-service';
import eventBus from '../bus/event-bus';

/**
 * Clase para auditoría de seguridad de plugins
 */
class PluginSecurityAudit {
  constructor() {
    // Estado de inicialización
    this.initialized = false;
    
    // Nivel de seguridad
    this.securityLevel = PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL;
    
    // Modo de auditoría (inmediato, por lotes, desactivado)
    this.auditMode = 'immediate';
    
    // Registro de auditoría en memoria
    this.auditLog = [];
    
    // Registros por plugin
    this.pluginAuditLogs = {};
    
    // Cola para modo por lotes
    this.auditQueue = [];
    
    // Tamaño máximo del historial
    this.maxLogSize = 1000;
    
    // ID del intervalo para modo por lotes
    this.batchIntervalId = null;
    
    // Intervalo para procesar lotes (ms)
    this.batchInterval = 60000; // 1 minuto
    
    // Tipos de eventos a almacenar
    this.auditEventTypes = [
      'securityEvent',
      'permissionRequest',
      'permissionChange',
      'validation',
      'suspiciousActivity',
      'resourceOveruse',
      'blacklistAction',
      'pluginActivation',
      'pluginDeactivation',
      'codeExecution'
    ];
    
    // Clave para almacenamiento
    this.storageKey = 'plugin_security_audit_log';
  }

  /**
   * Inicializa el sistema de auditoría
   * @param {string} securityLevel - Nivel de seguridad
   * @returns {boolean} - true si se inicializó correctamente
   */
  initialize(securityLevel) {
    if (this.initialized) {
      console.warn('Sistema de auditoría ya inicializado');
      return true;
    }
    
    try {
      console.log('Inicializando sistema de auditoría para plugins...');
      
      // Establecer nivel de seguridad
      this.securityLevel = securityLevel || PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL;
      
      // Configurar modo de auditoría según nivel de seguridad
      this._configureAuditMode();
      
      // Cargar historial existente desde almacenamiento
      this._loadAuditLog();
      
      // Iniciar procesamiento por lotes si corresponde
      if (this.auditMode === 'batch') {
        this._startBatchProcessing();
      }
      
      // Suscribirse a eventos relevantes
      this._setupEventListeners();
      
      this.initialized = true;
      
      console.log(`Sistema de auditoría inicializado (nivel: ${this.securityLevel}, modo: ${this.auditMode})`);
      return true;
    } catch (error) {
      console.error('Error al inicializar sistema de auditoría:', error);
      return false;
    }
  }

  /**
   * Configura el modo de auditoría según nivel de seguridad
   * @private
   */
  _configureAuditMode() {
    switch (this.securityLevel) {
      case PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW:
        this.auditMode = 'batch';
        break;
      case PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL:
        this.auditMode = 'immediate';
        break;
      case PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH:
        this.auditMode = 'immediate';
        // En nivel alto, aumentamos tamaño de historial
        this.maxLogSize = 5000;
        break;
      default:
        this.auditMode = 'immediate';
    }
  }

  /**
   * Carga el historial de auditoría desde almacenamiento
   * @private
   */
  async _loadAuditLog() {
    try {
      const savedLog = await storageService.get(this.storageKey, []);
      
      // Si hay datos guardados, cargarlos
      if (Array.isArray(savedLog) && savedLog.length > 0) {
        this.auditLog = savedLog;
        
        // Reconstruir índices por plugin
        this._rebuildPluginIndices();
        
        console.log(`Log de auditoría cargado: ${savedLog.length} entradas`);
      }
    } catch (error) {
      console.error('Error al cargar log de auditoría:', error);
      this.auditLog = [];
    }
  }

  /**
   * Reconstruye índices por plugin a partir del log principal
   * @private
   */
  _rebuildPluginIndices() {
    this.pluginAuditLogs = {};
    
    // Crear índices para cada plugin
    this.auditLog.forEach(entry => {
      if (entry.pluginId) {
        if (!this.pluginAuditLogs[entry.pluginId]) {
          this.pluginAuditLogs[entry.pluginId] = [];
        }
        
        this.pluginAuditLogs[entry.pluginId].push(entry);
      }
    });
  }

  /**
   * Guarda el historial de auditoría en almacenamiento
   * @private
   */
  async _saveAuditLog() {
    try {
      // Solo guardar en niveles normal y alto
      if (this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW) {
        return;
      }
      
      // Limitar tamaño para almacenamiento
      const logToSave = this.auditLog.slice(-this.maxLogSize);
      
      await storageService.set(this.storageKey, logToSave);
    } catch (error) {
      console.error('Error al guardar log de auditoría:', error);
    }
  }

  /**
   * Inicia el procesamiento por lotes
   * @private
   */
  _startBatchProcessing() {
    // Detener intervalo existente si hay
    if (this.batchIntervalId) {
      clearInterval(this.batchIntervalId);
    }
    
    // Crear nuevo intervalo
    this.batchIntervalId = setInterval(() => {
      this._processBatch();
    }, this.batchInterval);
  }

  /**
   * Procesa un lote de eventos de auditoría
   * @private
   */
  async _processBatch() {
    try {
      if (this.auditQueue.length === 0) {
        return;
      }
      
      // Obtener eventos a procesar
      const batch = [...this.auditQueue];
      this.auditQueue = [];
      
      // Añadir al log principal
      this._addEventsToLog(batch);
      
      // Guardar si corresponde
      await this._saveAuditLog();
    } catch (error) {
      console.error('Error al procesar lote de auditoría:', error);
    }
  }

  /**
   * Añade eventos al log principal
   * @param {Array} events - Eventos a añadir
   * @private
   */
  _addEventsToLog(events) {
    if (!Array.isArray(events) || events.length === 0) {
      return;
    }
    
    // Añadir al log principal
    this.auditLog.push(...events);
    
    // Limitar tamaño
    if (this.auditLog.length > this.maxLogSize) {
      this.auditLog = this.auditLog.slice(-this.maxLogSize);
    }
    
    // Actualizar índices por plugin
    events.forEach(entry => {
      if (entry.pluginId) {
        if (!this.pluginAuditLogs[entry.pluginId]) {
          this.pluginAuditLogs[entry.pluginId] = [];
        }
        
        this.pluginAuditLogs[entry.pluginId].push(entry);
        
        // Limitar tamaño por plugin
        const maxPluginLogSize = Math.min(500, this.maxLogSize / 2);
        
        if (this.pluginAuditLogs[entry.pluginId].length > maxPluginLogSize) {
          this.pluginAuditLogs[entry.pluginId] = 
            this.pluginAuditLogs[entry.pluginId].slice(-maxPluginLogSize);
        }
      }
    });
  }

  /**
   * Configura listeners para eventos del sistema
   * @private
   */
  _setupEventListeners() {
    // Lista de eventos a escuchar automáticamente
    const eventsToAudit = [
      'pluginSystem.securityEvent',
      'pluginSystem.pendingPermissions',
      'pluginSystem.permissionsRegistered',
      'pluginSystem.permissionsApproved',
      'pluginSystem.permissionsRejected',
      'pluginSystem.permissionsRevoked',
      'pluginSystem.pluginActivated',
      'pluginSystem.pluginDeactivated',
      'pluginSystem.suspiciousOperation',
      'pluginSystem.resourceOveruse',
      'pluginSystem.pluginBlacklisted',
      'pluginSystem.pluginWhitelisted',
      'pluginSystem.sandboxError',
      'pluginSystem.unsafeCodeExecution'
    ];
    
    // Suscribirse a cada evento
    eventsToAudit.forEach(eventType => {
      eventBus.subscribe(eventType, (data) => {
        // Determinar tipo de auditoría basado en el evento
        let auditType;
        
        if (eventType.includes('permission')) {
          auditType = 'permissionChange';
        } else if (eventType.includes('security')) {
          auditType = 'securityEvent';
        } else if (eventType.includes('suspicious') || eventType.includes('sandbox')) {
          auditType = 'suspiciousActivity';
        } else if (eventType.includes('resource')) {
          auditType = 'resourceOveruse';
        } else if (eventType.includes('blacklist')) {
          auditType = 'blacklistAction';
        } else if (eventType.includes('Activated')) {
          auditType = 'pluginActivation';
        } else if (eventType.includes('Deactivated')) {
          auditType = 'pluginDeactivation';
        } else if (eventType.includes('codeExecution')) {
          auditType = 'codeExecution';
        } else {
          auditType = 'other';
        }
        
        // Crear entrada de auditoría
        const auditEntry = {
          id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          eventType: eventType.replace('pluginSystem.', ''),
          auditType,
          pluginId: data.pluginId || null,
          details: data
        };
        
        // Procesar entrada
        this._processAuditEntry(auditEntry);
      });
    });
  }

  /**
   * Procesa una entrada de auditoría según el modo configurado
   * @param {Object} entry - Entrada de auditoría
   * @private
   */
  _processAuditEntry(entry) {
    // Verificar si el tipo debe ser auditado
    if (!this.auditEventTypes.includes(entry.auditType)) {
      return;
    }
    
    // Según el modo, procesar la entrada
    switch (this.auditMode) {
      case 'immediate':
        // Añadir al log principal
        this._addEventsToLog([entry]);
        // Guardar de inmediato
        this._saveAuditLog();
        break;
        
      case 'batch':
        // Añadir a la cola de procesamiento
        this.auditQueue.push(entry);
        break;
        
      case 'disabled':
        // No hacer nada
        break;
    }
  }

  /**
   * Registra un evento de seguridad
   * @param {Object} event - Evento de seguridad
   */
  recordSecurityEvent(event) {
    if (!this.initialized || !event) {
      return;
    }
    
    const auditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      eventType: 'securityEvent',
      auditType: 'securityEvent',
      pluginId: event.pluginId || null,
      details: event
    };
    
    this._processAuditEntry(auditEntry);
  }

  /**
   * Registra un resultado de validación
   * @param {string} pluginId - ID del plugin
   * @param {Object} result - Resultado de la validación
   */
  recordValidationResult(pluginId, result) {
    if (!this.initialized || !pluginId) {
      return;
    }
    
    const auditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      eventType: 'validation',
      auditType: 'validation',
      pluginId,
      details: result
    };
    
    this._processAuditEntry(auditEntry);
  }

  /**
   * Registra una acción de lista negra
   * @param {string} pluginId - ID del plugin
   * @param {Object} action - Detalles de la acción
   */
  recordBlacklistAction(pluginId, action) {
    if (!this.initialized || !pluginId) {
      return;
    }
    
    const auditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      eventType: 'blacklistAction',
      auditType: 'blacklistAction',
      pluginId,
      details: action
    };
    
    this._processAuditEntry(auditEntry);
  }

  /**
   * Registra desactivación de un plugin
   * @param {string} pluginId - ID del plugin
   * @param {Object} details - Detalles de la desactivación
   */
  recordPluginDeactivation(pluginId, details) {
    if (!this.initialized || !pluginId) {
      return;
    }
    
    const auditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      eventType: 'pluginDeactivation',
      auditType: 'pluginDeactivation',
      pluginId,
      details
    };
    
    this._processAuditEntry(auditEntry);
  }

  /**
   * Obtiene el historial de auditoría para un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {Array} - Historial de auditoría
   */
  getPluginAuditHistory(pluginId) {
    if (!pluginId) {
      return [];
    }
    
    // Devolver copia del historial para ese plugin
    return [...(this.pluginAuditLogs[pluginId] || [])];
  }

  /**
   * Obtiene el historial de auditoría completo
   * @param {Object} filters - Filtros a aplicar
   * @returns {Array} - Historial de auditoría filtrado
   */
  getAuditLog(filters = {}) {
    try {
      let filteredLog = [...this.auditLog];
      
      // Aplicar filtros si existen
      if (filters.pluginId) {
        filteredLog = filteredLog.filter(entry => entry.pluginId === filters.pluginId);
      }
      
      if (filters.auditType) {
        filteredLog = filteredLog.filter(entry => entry.auditType === filters.auditType);
      }
      
      if (filters.startDate) {
        filteredLog = filteredLog.filter(entry => entry.timestamp >= filters.startDate);
      }
      
      if (filters.endDate) {
        filteredLog = filteredLog.filter(entry => entry.timestamp <= filters.endDate);
      }
      
      if (filters.limit) {
        filteredLog = filteredLog.slice(-filters.limit);
      }
      
      return filteredLog;
    } catch (error) {
      console.error('Error al obtener log de auditoría:', error);
      return [];
    }
  }

  /**
   * Obtiene el historial de auditoría para un tipo específico
   * @param {string} type - Tipo de auditoría
   * @param {number} limit - Límite de resultados
   * @returns {Array} - Historial de auditoría
   */
  getAuditLogByType(type, limit = 50) {
    try {
      if (!type) {
        return [];
      }
      
      // Filtrar por tipo
      const filteredLog = this.auditLog.filter(entry => entry.auditType === type);
      
      // Aplicar límite
      return filteredLog.slice(-limit);
    } catch (error) {
      console.error(`Error al obtener log de auditoría por tipo ${type}:`, error);
      return [];
    }
  }

  /**
   * Limpia el historial de auditoría para un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {boolean} - true si se limpió correctamente
   */
  clearPluginData(pluginId) {
    if (!pluginId) return false;
    
    try {
      // Eliminar del historial por plugin
      delete this.pluginAuditLogs[pluginId];
      
      // Filtrar del log principal
      this.auditLog = this.auditLog.filter(entry => entry.pluginId !== pluginId);
      
      // Guardar cambios
      this._saveAuditLog();
      
      return true;
    } catch (error) {
      console.error(`Error al limpiar datos de plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Borra todo el historial de auditoría
   * @returns {boolean} - true si se limpió correctamente
   */
  clearAllAuditLogs() {
    try {
      // Reiniciar logs
      this.auditLog = [];
      this.pluginAuditLogs = {};
      
      // Eliminar de almacenamiento
      storageService.remove(this.storageKey);
      
      return true;
    } catch (error) {
      console.error('Error al limpiar logs de auditoría:', error);
      return false;
    }
  }

  /**
   * Exporta el historial de auditoría
   * @returns {Object} - Datos de auditoría serializables
   */
  exportAuditData() {
    try {
      return {
        version: '1.0',
        timestamp: Date.now(),
        securityLevel: this.securityLevel,
        auditMode: this.auditMode,
        logs: this.auditLog
      };
    } catch (error) {
      console.error('Error al exportar datos de auditoría:', error);
      return null;
    }
  }

  /**
   * Establece el nivel de seguridad y reconfigura el sistema
   * @param {string} level - Nivel de seguridad
   * @returns {boolean} - true si se cambió correctamente
   */
  setSecurityLevel(level) {
    if (!level || !PLUGIN_CONSTANTS.SECURITY.LEVEL[level]) {
      return false;
    }
    
    try {
      this.securityLevel = level;
      
      // Reconfigurar modo de auditoría
      this._configureAuditMode();
      
      // Reiniciar procesamiento por lotes si es necesario
      if (this.auditMode === 'batch') {
        this._startBatchProcessing();
      } else if (this.batchIntervalId) {
        clearInterval(this.batchIntervalId);
        this.batchIntervalId = null;
      }
      
      return true;
    } catch (error) {
      console.error(`Error al cambiar nivel de seguridad a ${level}:`, error);
      return false;
    }
  }

  /**
   * Establece el modo de auditoría manualmente
   * @param {string} mode - Modo de auditoría ('immediate', 'batch', 'disabled')
   * @returns {boolean} - true si se cambió correctamente
   */
  setAuditMode(mode) {
    const validModes = ['immediate', 'batch', 'disabled'];
    
    if (!mode || !validModes.includes(mode)) {
      return false;
    }
    
    try {
      this.auditMode = mode;
      
      // Actualizar procesamiento por lotes
      if (mode === 'batch') {
        this._startBatchProcessing();
      } else if (this.batchIntervalId) {
        clearInterval(this.batchIntervalId);
        this.batchIntervalId = null;
      }
      
      return true;
    } catch (error) {
      console.error(`Error al cambiar modo de auditoría a ${mode}:`, error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas de auditoría
   * @returns {Object} - Estadísticas
   */
  getAuditStats() {
    try {
      // Total de entradas
      const totalEntries = this.auditLog.length;
      
      // Contar por tipo
      const countByType = {};
      this.auditEventTypes.forEach(type => {
        countByType[type] = this.auditLog.filter(entry => entry.auditType === type).length;
      });
      
      // Plugins con más eventos
      const pluginCounts = {};
      this.auditLog.forEach(entry => {
        if (entry.pluginId) {
          if (!pluginCounts[entry.pluginId]) {
            pluginCounts[entry.pluginId] = 0;
          }
          pluginCounts[entry.pluginId]++;
        }
      });
      
      const topPlugins = Object.entries(pluginCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([pluginId, count]) => ({ pluginId, count }));
      
      // Eventos recientes
      const recentEvents = this.auditLog.slice(-10);
      
      return {
        totalEntries,
        countByType,
        topPlugins,
        recentEvents,
        auditMode: this.auditMode,
        securityLevel: this.securityLevel
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de auditoría:', error);
      
      return {
        error: error.message,
        securityLevel: this.securityLevel
      };
    }
  }
}

// Exportar instancia única
const pluginSecurityAudit = new PluginSecurityAudit();
export default pluginSecurityAudit;