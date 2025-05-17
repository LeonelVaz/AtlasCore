/**
 * Gestor de Seguridad para el Sistema de Plugins de Atlas
 */
import pluginRegistry from './plugin-registry';
import pluginErrorHandler from './plugin-error-handler';
import pluginSandbox from './plugin-sandbox';
import pluginResourceMonitor from './plugin-resource-monitor';
import pluginSecurityAudit from './plugin-security-audit';
import pluginPermissionChecker from './plugin-permission-checker';
import eventBus from '../bus/event-bus';
import { PLUGIN_CONSTANTS } from '../config/constants';

class PluginSecurityManager {
  constructor() {
    this.initialized = false;
    this.securityLevel = PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL;
    this.detectedThreats = [];
    this.blacklistedPlugins = new Set();
    this.pluginsWithWarnings = {};
    this.securityEvents = [];
    this.maxSecurityEvents = 100;
    this.activeSecurityChecks = new Set([
      'resourceUsage',
      'apiAccess',
      'storageUsage',
      'domManipulation',
      'externalCommunication'
    ]);
  }

  initialize(options = {}) {
    if (this.initialized) {
      console.warn('El gestor de seguridad ya está inicializado');
      return true;
    }
    
    try {
      console.log('Inicializando sistema de seguridad para plugins...');
      
      this.securityLevel = options.securityLevel || PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL;
      
      this._initializeSubsystems();
      this._setupEventListeners();
      this._loadBlacklistedPlugins();
      
      // Verificar plugins ya registrados
      const registeredPlugins = pluginRegistry.getAllPlugins();
      registeredPlugins.forEach(plugin => {
        this.validatePlugin(plugin.id);
      });
      
      this.initialized = true;
      
      eventBus.publish('pluginSystem.securityInitialized', {
        securityLevel: this.securityLevel,
        activeChecks: Array.from(this.activeSecurityChecks)
      });
      
      console.log(`Sistema de seguridad inicializado (nivel: ${this.securityLevel})`);
      return true;
    } catch (error) {
      console.error('Error al inicializar sistema de seguridad:', error);
      return false;
    }
  }

  _initializeSubsystems() {
    pluginSandbox.initialize(this.securityLevel);
    pluginResourceMonitor.initialize(this.securityLevel);
    pluginSecurityAudit.initialize(this.securityLevel);
    pluginPermissionChecker.initialize(this.securityLevel);
  }

  _setupEventListeners() {
    // Escuchar eventos de sobrecarga de recursos
    eventBus.subscribe('pluginSystem.resourceOveruse', (data) => {
      this._handleSecurityEvent('resourceOveruse', data);
    });
    
    // Escuchar eventos de acceso no autorizado
    eventBus.subscribe('pluginSystem.unauthorizedAccess', (data) => {
      this._handleSecurityEvent('unauthorizedAccess', data);
    });
    
    // Escuchar eventos de manipulación DOM sospechosa
    eventBus.subscribe('pluginSystem.suspiciousDomOperation', (data) => {
      this._handleSecurityEvent('suspiciousDomOperation', data);
    });
    
    // Escuchar eventos de comunicación externa sospechosa
    eventBus.subscribe('pluginSystem.suspiciousExternalCommunication', (data) => {
      this._handleSecurityEvent('suspiciousExternalCommunication', data);
    });
    
    // Escuchar eventos de intento de ejecución de código inseguro
    eventBus.subscribe('pluginSystem.unsafeCodeExecution', (data) => {
      this._handleSecurityEvent('unsafeCodeExecution', data);
    });

    // Eventos de registro de plugins (para validación)
    eventBus.subscribe('pluginSystem.pluginRegistered', (data) => {
      if (data && data.pluginId) {
        this.validatePlugin(data.pluginId);
      }
    });
  }

  _handleSecurityEvent(eventType, data) {
    // Crear objeto de evento de seguridad
    const securityEvent = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: eventType,
      pluginId: data.pluginId || 'unknown',
      severity: this._calculateEventSeverity(eventType, data),
      details: data
    };
    
    // Añadir al historial
    this.securityEvents.unshift(securityEvent);
    
    // Limitar tamaño del historial
    if (this.securityEvents.length > this.maxSecurityEvents) {
      this.securityEvents = this.securityEvents.slice(0, this.maxSecurityEvents);
    }
    
    // Registrar en el sistema de auditoría
    pluginSecurityAudit.recordSecurityEvent(securityEvent);
    
    // Tomar acciones según severidad
    this._takeActionForSecurityEvent(securityEvent);
    
    // Publicar evento para otros componentes
    eventBus.publish('pluginSystem.securityEvent', securityEvent);
  }

  _calculateEventSeverity(eventType, data) {
    const severityMap = {
      'unauthorizedAccess': 'high',
      'unsafeCodeExecution': 'critical',
      'suspiciousExternalCommunication': 'high',
      'suspiciousDomOperation': 'medium',
      'resourceOveruse': 'medium'
    };
    
    // Nivel base según tipo de evento
    let severity = severityMap[eventType] || 'low';
    
    // Incrementar severidad si hay patrones específicos
    if (data.repeated && data.repeated > 3) {
      // Elevar un nivel si es un comportamiento repetido
      severity = this._escalateSeverity(severity);
    }
    
    if (data.intentional === true) {
      // Elevar un nivel si parece intencional
      severity = this._escalateSeverity(severity);
    }
    
    return severity;
  }

  _escalateSeverity(currentSeverity) {
    const levels = ['low', 'medium', 'high', 'critical'];
    const currentIndex = levels.indexOf(currentSeverity);
    
    if (currentIndex < levels.length - 1) {
      return levels[currentIndex + 1];
    }
    
    return currentSeverity;
  }

  _takeActionForSecurityEvent(securityEvent) {
    const { pluginId, severity, type } = securityEvent;
    
    // Registrar advertencia para el plugin
    this._addWarningToPlugin(pluginId, securityEvent);
    
    // Acciones según severidad
    switch (severity) {
      case 'critical':
        // Acciones inmediatas para amenazas críticas
        this.deactivatePlugin(pluginId, `Amenaza de seguridad crítica: ${type}`);
        this.blacklistPlugin(pluginId);
        break;
        
      case 'high':
        // Acciones para amenazas altas
        if (this._getPluginWarningsCount(pluginId) > 3) {
          // Si hay múltiples advertencias, desactivar
          this.deactivatePlugin(pluginId, `Múltiples amenazas de seguridad altas: ${type}`);
        } else {
          // Limitar recursos como medida preventiva
          pluginResourceMonitor.applyRestrictions(pluginId);
        }
        break;
        
      case 'medium':
        // Acciones para amenazas medias
        if (this._getPluginWarningsCount(pluginId) > 5) {
          // Si hay muchas advertencias, aplicar restricciones
          pluginResourceMonitor.applyRestrictions(pluginId);
        }
        break;
        
      case 'low':
        // Solo monitorear para amenazas bajas
        pluginResourceMonitor.increaseMonitoring(pluginId);
        break;
    }
    
    // Añadir a lista de amenazas detectadas
    this.detectedThreats.push({
      timestamp: Date.now(),
      pluginId,
      type,
      severity,
      actionTaken: severity === 'critical' ? 'blacklisted' : 
                  severity === 'high' ? 'restricted' : 'monitored'
    });
  }

  _addWarningToPlugin(pluginId, warning) {
    if (!pluginId) return;
    
    if (!this.pluginsWithWarnings[pluginId]) {
      this.pluginsWithWarnings[pluginId] = [];
    }
    
    this.pluginsWithWarnings[pluginId].push({
      timestamp: Date.now(),
      type: warning.type,
      severity: warning.severity,
      details: warning.details
    });
  }

  _getPluginWarningsCount(pluginId) {
    if (!pluginId || !this.pluginsWithWarnings[pluginId]) {
      return 0;
    }
    
    return this.pluginsWithWarnings[pluginId].length;
  }

  _loadBlacklistedPlugins() {
    try {
      // En una implementación real, esto cargaría de almacenamiento
      this.blacklistedPlugins = new Set();
    } catch (error) {
      console.error('Error al cargar lista negra de plugins:', error);
      this.blacklistedPlugins = new Set();
    }
  }

  validatePlugin(pluginId) {
    try {
      if (!this.initialized) {
        console.warn('Sistema de seguridad no inicializado');
        return { valid: true, reasons: [] };
      }
      
      // Verificar si está en lista negra
      if (this.blacklistedPlugins.has(pluginId)) {
        return {
          valid: false,
          reasons: ['Plugin en lista negra por violaciones de seguridad previas']
        };
      }
      
      const plugin = pluginRegistry.getPlugin(pluginId);
      
      if (!plugin) {
        return {
          valid: false,
          reasons: ['Plugin no encontrado']
        };
      }
      
      // Validar permisos solicitados
      const permissionsCheck = pluginPermissionChecker.validatePermissions(pluginId, plugin.permissions);
      
      // Validar código del plugin (análisis estático)
      const codeCheck = pluginSandbox.validatePluginCode(pluginId, plugin);
      
      // Recopilar todas las razones de invalidez
      const reasons = [];
      
      if (!permissionsCheck.valid) {
        reasons.push(...permissionsCheck.reasons);
      }
      
      if (!codeCheck.valid) {
        reasons.push(...codeCheck.reasons);
      }
      
      const isValid = reasons.length === 0;
      
      // Registrar resultado de la validación
      pluginSecurityAudit.recordValidationResult(pluginId, {
        timestamp: Date.now(),
        valid: isValid,
        reasons
      });
      
      // Si no es válido, añadir advertencia
      if (!isValid) {
        this._addWarningToPlugin(pluginId, {
          type: 'validationFailed',
          severity: 'high',
          details: { reasons }
        });
      }
      
      return {
        valid: isValid,
        reasons
      };
    } catch (error) {
      console.error(`Error al validar plugin ${pluginId}:`, error);
      
      return {
        valid: false,
        reasons: [`Error durante validación: ${error.message}`]
      };
    }
  }

  deactivatePlugin(pluginId, reason) {
    try {
      if (!pluginId) return false;
      
      // Registrar el intento de desactivación
      pluginSecurityAudit.recordPluginDeactivation(pluginId, {
        timestamp: Date.now(),
        reason
      });
      
      // Verificar si el plugin está activo
      if (!pluginRegistry.isPluginActive(pluginId)) {
        return true; // Ya está desactivado
      }
      
      // Solicitar desactivación al registro de plugins
      eventBus.publish('pluginSystem.securityDeactivateRequest', {
        pluginId,
        reason
      });
      
      console.warn(`Plugin ${pluginId} desactivado por seguridad: ${reason}`);
      
      return true;
    } catch (error) {
      console.error(`Error al desactivar plugin ${pluginId}:`, error);
      
      // Registrar el error
      pluginErrorHandler.handleError(
        'security',
        'deactivatePlugin',
        error,
        { pluginId, reason }
      );
      
      return false;
    }
  }

  blacklistPlugin(pluginId) {
    if (!pluginId) return false;
    
    try {
      // Añadir a la lista negra en memoria
      this.blacklistedPlugins.add(pluginId);
      
      // Registrar en auditoría
      pluginSecurityAudit.recordBlacklistAction(pluginId, {
        timestamp: Date.now(),
        action: 'add'
      });
      
      // Publicar evento
      eventBus.publish('pluginSystem.pluginBlacklisted', { pluginId });
      
      console.warn(`Plugin ${pluginId} añadido a lista negra de seguridad`);
      
      return true;
    } catch (error) {
      console.error(`Error al añadir plugin ${pluginId} a lista negra:`, error);
      return false;
    }
  }

  whitelistPlugin(pluginId) {
    if (!pluginId) return false;
    
    try {
      // Quitar de la lista negra en memoria
      const wasBlacklisted = this.blacklistedPlugins.has(pluginId);
      this.blacklistedPlugins.delete(pluginId);
      
      if (wasBlacklisted) {
        // Registrar en auditoría
        pluginSecurityAudit.recordBlacklistAction(pluginId, {
          timestamp: Date.now(),
          action: 'remove'
        });
        
        // Publicar evento
        eventBus.publish('pluginSystem.pluginWhitelisted', { pluginId });
        
        console.log(`Plugin ${pluginId} eliminado de lista negra de seguridad`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error al eliminar plugin ${pluginId} de lista negra:`, error);
      return false;
    }
  }

  isPluginBlacklisted(pluginId) {
    if (!pluginId) return false;
    
    return this.blacklistedPlugins.has(pluginId);
  }

  getPluginSecurityInfo(pluginId) {
    if (!pluginId) {
      return {
        warnings: [],
        blacklisted: false,
        securityScore: 0,
        permissionsDetails: null
      };
    }
    
    try {
      // Obtener advertencias
      const warnings = this.pluginsWithWarnings[pluginId] || [];
      
      // Verificar lista negra
      const blacklisted = this.blacklistedPlugins.has(pluginId);
      
      // Calcular puntuación de seguridad (0-100, mayor es mejor)
      const securityScore = this._calculatePluginSecurityScore(pluginId);
      
      // Obtener detalles de permisos
      const permissionsDetails = pluginPermissionChecker.getPluginPermissions(pluginId);
      
      // Obtener historial de auditoría
      const auditHistory = pluginSecurityAudit.getPluginAuditHistory(pluginId);
      
      return {
        warnings,
        blacklisted,
        securityScore,
        permissionsDetails,
        auditHistory,
        resourceUsage: pluginResourceMonitor.getPluginResourceUsage(pluginId)
      };
    } catch (error) {
      console.error(`Error al obtener información de seguridad para plugin ${pluginId}:`, error);
      
      return {
        warnings: [],
        blacklisted: false,
        securityScore: 0,
        permissionsDetails: null,
        error: error.message
      };
    }
  }

  _calculatePluginSecurityScore(pluginId) {
    try {
      const plugin = pluginRegistry.getPlugin(pluginId);
      
      if (!plugin) {
        return 0;
      }
      
      // Puntuación base
      let score = 100;
      
      // Restar por advertencias
      const warnings = this.pluginsWithWarnings[pluginId] || [];
      const warningScoreMap = {
        'critical': -40,
        'high': -20,
        'medium': -10,
        'low': -5
      };
      
      warnings.forEach(warning => {
        score += warningScoreMap[warning.severity] || 0;
      });
      
      // Restar por permisos solicitados
      const permissionsDetails = pluginPermissionChecker.getPluginPermissions(pluginId);
      if (permissionsDetails) {
        // Restar más por permisos sensibles
        if (permissionsDetails.hasStoragePermission) score -= 5;
        if (permissionsDetails.hasNetworkPermission) score -= 10;
        if (permissionsDetails.hasDomPermission) score -= 15;
        if (permissionsDetails.hasCodeExecutionPermission) score -= 25;
      }
      
      // Ajustar límites
      score = Math.max(0, Math.min(100, score));
      
      return score;
    } catch (error) {
      console.error(`Error al calcular puntuación de seguridad para plugin ${pluginId}:`, error);
      return 0;
    }
  }

  toggleSecurityCheck(checkName, enabled) {
    if (!checkName) return false;
    
    try {
      if (enabled) {
        this.activeSecurityChecks.add(checkName);
      } else {
        this.activeSecurityChecks.delete(checkName);
      }
      
      // Notificar a los subsistemas del cambio
      pluginSandbox.updateSecurityChecks(this.activeSecurityChecks);
      pluginResourceMonitor.updateSecurityChecks(this.activeSecurityChecks);
      pluginPermissionChecker.updateSecurityChecks(this.activeSecurityChecks);
      
      // Publicar evento
      eventBus.publish('pluginSystem.securityCheckToggled', {
        checkName,
        enabled,
        activeChecks: Array.from(this.activeSecurityChecks)
      });
      
      return true;
    } catch (error) {
      console.error(`Error al cambiar verificación de seguridad ${checkName}:`, error);
      return false;
    }
  }

  setSecurityLevel(level) {
    if (!level || !PLUGIN_CONSTANTS.SECURITY.LEVEL[level.toUpperCase()]) {
      return false;
    }
    
    try {
      const newLevel = PLUGIN_CONSTANTS.SECURITY.LEVEL[level.toUpperCase()];
      
      if (this.securityLevel === newLevel) {
        return true; // No hay cambio
      }
      
      this.securityLevel = newLevel;
      
      // Actualizar subsistemas
      pluginSandbox.setSecurityLevel(newLevel);
      pluginResourceMonitor.setSecurityLevel(newLevel);
      pluginSecurityAudit.setSecurityLevel(newLevel);
      pluginPermissionChecker.setSecurityLevel(newLevel);
      
      // Publicar evento
      eventBus.publish('pluginSystem.securityLevelChanged', {
        level: newLevel
      });
      
      // Configurar verificaciones según el nivel
      this._configureSecurityChecksByLevel(newLevel);
      
      console.log(`Nivel de seguridad del sistema de plugins establecido a ${level}`);
      
      return true;
    } catch (error) {
      console.error(`Error al cambiar nivel de seguridad a ${level}:`, error);
      return false;
    }
  }

  _configureSecurityChecksByLevel(level) {
    // Reiniciar las verificaciones activas
    this.activeSecurityChecks.clear();
    
    // Configurar según nivel
    switch (level) {
      case PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW:
        // Verificaciones mínimas para entorno de desarrollo
        this.activeSecurityChecks.add('resourceUsage');
        this.activeSecurityChecks.add('apiAccess');
        break;
        
      case PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL:
        // Verificaciones estándar para uso normal
        this.activeSecurityChecks.add('resourceUsage');
        this.activeSecurityChecks.add('apiAccess');
        this.activeSecurityChecks.add('storageUsage');
        this.activeSecurityChecks.add('domManipulation');
        break;
        
      case PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH:
        // Todas las verificaciones para máxima seguridad
        this.activeSecurityChecks.add('resourceUsage');
        this.activeSecurityChecks.add('apiAccess');
        this.activeSecurityChecks.add('storageUsage');
        this.activeSecurityChecks.add('domManipulation');
        this.activeSecurityChecks.add('externalCommunication');
        this.activeSecurityChecks.add('codeExecution');
        this.activeSecurityChecks.add('dataAccess');
        break;
    }
    
    // Actualizar subsistemas
    pluginSandbox.updateSecurityChecks(this.activeSecurityChecks);
    pluginResourceMonitor.updateSecurityChecks(this.activeSecurityChecks);
    pluginPermissionChecker.updateSecurityChecks(this.activeSecurityChecks);
  }

  getSecurityStats() {
    try {
      // Número de plugins en lista negra
      const blacklistedCount = this.blacklistedPlugins.size;
      
      // Plugins con advertencias
      const pluginsWithWarningsCount = Object.keys(this.pluginsWithWarnings).length;
      
      // Total de amenazas detectadas
      const totalThreats = this.detectedThreats.length;
      
      // Conteo por severidad
      const threatsBySeverity = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      };
      
      this.detectedThreats.forEach(threat => {
        if (threatsBySeverity[threat.severity] !== undefined) {
          threatsBySeverity[threat.severity]++;
        }
      });
      
      // Conteo por tipo
      const threatsByType = {};
      this.detectedThreats.forEach(threat => {
        if (!threatsByType[threat.type]) {
          threatsByType[threat.type] = 0;
        }
        threatsByType[threat.type]++;
      });
      
      // Obtener estadísticas de recursos
      const resourceStats = pluginResourceMonitor.getResourceStats();
      
      // Obtener estadísticas de auditoría
      const auditStats = pluginSecurityAudit.getAuditStats();
      
      return {
        securityLevel: this.securityLevel,
        activeChecks: Array.from(this.activeSecurityChecks),
        blacklistedPlugins: blacklistedCount,
        pluginsWithWarnings: pluginsWithWarningsCount,
        detectedThreats: {
          total: totalThreats,
          bySeverity: threatsBySeverity,
          byType: threatsByType,
          recent: this.detectedThreats.slice(0, 5) // 5 más recientes
        },
        resourceUsage: resourceStats,
        auditStats: auditStats,
        securityEvents: this.securityEvents.slice(0, 10) // 10 más recientes
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de seguridad:', error);
      
      return {
        error: error.message,
        securityLevel: this.securityLevel
      };
    }
  }

  clearPluginSecurityData(pluginId) {
    if (!pluginId) return false;
    
    try {
      // Limpiar advertencias
      delete this.pluginsWithWarnings[pluginId];
      
      // Quitar de la lista negra
      this.blacklistedPlugins.delete(pluginId);
      
      // Filtrar amenazas detectadas
      this.detectedThreats = this.detectedThreats.filter(
        threat => threat.pluginId !== pluginId
      );
      
      // Limpiar en subsistemas
      pluginSecurityAudit.clearPluginData(pluginId);
      pluginResourceMonitor.clearPluginData(pluginId);
      pluginPermissionChecker.clearPluginData(pluginId);
      
      return true;
    } catch (error) {
      console.error(`Error al limpiar datos de seguridad para plugin ${pluginId}:`, error);
      return false;
    }
  }

  getDetectedThreats(options = {}) {
    try {
      let threats = [...this.detectedThreats];
      
      // Aplicar filtros si existen
      if (options.pluginId) {
        threats = threats.filter(t => t.pluginId === options.pluginId);
      }
      
      if (options.severity) {
        threats = threats.filter(t => t.severity === options.severity);
      }
      
      if (options.type) {
        threats = threats.filter(t => t.type === options.type);
      }
      
      if (options.fromTimestamp) {
        threats = threats.filter(t => t.timestamp >= options.fromTimestamp);
      }
      
      // Limitar si se especifica un límite
      if (options.limit && !isNaN(options.limit)) {
        threats = threats.slice(0, options.limit);
      }
      
      return threats;
    } catch (error) {
      console.error('Error al obtener amenazas detectadas:', error);
      return [];
    }
  }
}

const pluginSecurityManager = new PluginSecurityManager();
export default pluginSecurityManager;