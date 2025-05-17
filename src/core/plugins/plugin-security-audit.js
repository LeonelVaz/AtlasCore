/**
 * Sistema de Auditoría de Seguridad para Plugins de Atlas
 */
import { PLUGIN_CONSTANTS } from '../config/constants';
import storageService from '../../services/storage-service';
import eventBus from '../bus/event-bus';

class PluginSecurityAudit {
  constructor() {
    this.initialized = false;
    this.securityLevel = PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL;
    this.auditMode = 'immediate';
    this.auditLog = [];
    this.pluginAuditLogs = {};
    this.auditQueue = [];
    this.maxLogSize = 1000;
    this.batchIntervalId = null;
    this.batchInterval = 60000; // 1 minuto
    
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
    
    this.storageKey = 'plugin_security_audit_log';
  }

  initialize(securityLevel) {
    if (this.initialized) {
      console.warn('Sistema de auditoría ya inicializado');
      return true;
    }
    
    try {
      console.log('Inicializando sistema de auditoría para plugins...');
      
      this.securityLevel = securityLevel || PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL;
      
      this._configureAuditMode();
      this._loadAuditLog();
      
      if (this.auditMode === 'batch') {
        this._startBatchProcessing();
      }
      
      this._setupEventListeners();
      
      this.initialized = true;
      
      console.log(`Sistema de auditoría inicializado (nivel: ${this.securityLevel}, modo: ${this.auditMode})`);
      return true;
    } catch (error) {
      console.error('Error al inicializar sistema de auditoría:', error);
      return false;
    }
  }

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
        this.maxLogSize = 5000;
        break;
      default:
        this.auditMode = 'immediate';
    }
  }

  async _loadAuditLog() {
    try {
      const savedLog = await storageService.get(this.storageKey, []);
      
      if (Array.isArray(savedLog) && savedLog.length > 0) {
        this.auditLog = savedLog;
        this._rebuildPluginIndices();
        console.log(`Log de auditoría cargado: ${savedLog.length} entradas`);
      }
    } catch (error) {
      console.error('Error al cargar log de auditoría:', error);
      this.auditLog = [];
    }
  }

  _rebuildPluginIndices() {
    this.pluginAuditLogs = {};
    
    this.auditLog.forEach(entry => {
      if (entry.pluginId) {
        if (!this.pluginAuditLogs[entry.pluginId]) {
          this.pluginAuditLogs[entry.pluginId] = [];
        }
        
        this.pluginAuditLogs[entry.pluginId].push(entry);
      }
    });
  }

  async _saveAuditLog() {
    try {
      if (this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW) {
        return;
      }
      
      const logToSave = this.auditLog.slice(-this.maxLogSize);
      await storageService.set(this.storageKey, logToSave);
    } catch (error) {
      console.error('Error al guardar log de auditoría:', error);
    }
  }

  _startBatchProcessing() {
    if (this.batchIntervalId) {
      clearInterval(this.batchIntervalId);
    }
    
    this.batchIntervalId = setInterval(() => {
      this._processBatch();
    }, this.batchInterval);
  }

  async _processBatch() {
    try {
      if (this.auditQueue.length === 0) {
        return;
      }
      
      const batch = [...this.auditQueue];
      this.auditQueue = [];
      
      this._addEventsToLog(batch);
      await this._saveAuditLog();
    } catch (error) {
      console.error('Error al procesar lote de auditoría:', error);
    }
  }

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

  getPluginAuditHistory(pluginId) {
    if (!pluginId) {
      return [];
    }
    
    // Devolver copia del historial para ese plugin
    return [...(this.pluginAuditLogs[pluginId] || [])];
  }

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