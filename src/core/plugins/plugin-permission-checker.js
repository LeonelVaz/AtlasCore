/**
 * Verificador de Permisos para Plugins de Atlas
 * 
 * Este módulo se encarga de gestionar y validar los permisos
 * solicitados por los plugins, asegurando que solo accedan
 * a funcionalidades autorizadas.
 */

import eventBus from '../bus/event-bus';
import { PLUGIN_CONSTANTS } from '../config/constants';

/**
 * Clase para verificar y gestionar permisos de plugins
 */
class PluginPermissionChecker {
  constructor() {
    // Estado de inicialización
    this.initialized = false;
    
    // Nivel de seguridad
    this.securityLevel = PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL;
    
    // Verificaciones activas
    this.activeChecks = new Set(['apiAccess']);
    
    // Permisos registrados por plugin
    this.pluginPermissions = {};
    
    // Plugins con permisos elevados
    this.elevatedPermissionPlugins = new Set();
    
    // Historial de solicitudes de permisos
    this.permissionRequests = [];
    
    // Historial de accesos a APIs
    this.apiAccessLogs = {};
    
    // Límite de tamaño del historial
    this.maxLogSize = 100;
    
    // Permisos automáticamente aprobados según nivel de seguridad
    this.autoApprovedPermissions = {
      // En nivel de seguridad BAJO
      [PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW]: [
        'storage',
        'network',
        'notifications',
        'ui',
        'events',
        'communication',
        'dom'
      ],
      
      // En nivel de seguridad NORMAL
      [PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL]: [
        'storage',
        'ui',
        'events',
        'communication'
      ],
      
      // En nivel de seguridad ALTO
      [PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH]: [
        'ui',
        'events'
      ]
    };
    
    // Definición de permisos disponibles
    this.availablePermissions = {
      'storage': {
        name: 'storage',
        description: 'Permite al plugin almacenar y recuperar datos persistentes',
        methods: ['core.storage.setItem', 'core.storage.getItem', 'core.storage.removeItem'],
        risk: 'low'
      },
      'network': {
        name: 'network',
        description: 'Permite al plugin realizar peticiones a servicios externos',
        methods: ['fetch', 'XMLHttpRequest'],
        risk: 'medium'
      },
      'notifications': {
        name: 'notifications',
        description: 'Permite al plugin mostrar notificaciones',
        methods: ['core.notifications.show'],
        risk: 'low'
      },
      'ui': {
        name: 'ui',
        description: 'Permite al plugin añadir componentes a la interfaz',
        methods: ['core.ui.registerExtension'],
        risk: 'low'
      },
      'events': {
        name: 'events',
        description: 'Permite al plugin suscribirse y publicar eventos',
        methods: ['core.events.subscribe', 'core.events.publish'],
        risk: 'low'
      },
      'communication': {
        name: 'communication',
        description: 'Permite al plugin comunicarse con otros plugins',
        methods: ['core.plugins.getPluginAPI', 'core.plugins.createChannel'],
        risk: 'medium'
      },
      'dom': {
        name: 'dom',
        description: 'Permite al plugin manipular el DOM directamente',
        methods: ['document.createElement', 'element.appendChild'],
        risk: 'high'
      },
      'codeExecution': {
        name: 'codeExecution',
        description: 'Permite al plugin ejecutar código arbitrario (altamente restringido)',
        methods: ['function constructor', 'regexp constructor'],
        risk: 'critical'
      }
    };
  }

  /**
   * Inicializa el verificador de permisos
   * @param {string} securityLevel - Nivel de seguridad
   * @returns {boolean} - true si se inicializó correctamente
   */
  initialize(securityLevel) {
    if (this.initialized) {
      console.warn('Verificador de permisos ya inicializado');
      return true;
    }
    
    try {
      console.log('Inicializando verificador de permisos para plugins...');
      
      // Establecer nivel de seguridad
      this.securityLevel = securityLevel || PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL;
      
      this.initialized = true;
      
      console.log(`Verificador de permisos inicializado (nivel: ${this.securityLevel})`);
      return true;
    } catch (error) {
      console.error('Error al inicializar verificador de permisos:', error);
      return false;
    }
  }

  /**
   * Valida los permisos solicitados por un plugin
   * @param {string} pluginId - ID del plugin
   * @param {Array|Object} permissions - Permisos solicitados
   * @returns {Object} - Resultado de la validación
   */
  validatePermissions(pluginId, permissions) {
    if (!pluginId) {
      return {
        valid: false,
        reasons: ['ID de plugin no válido']
      };
    }
    
    try {
      // Si no se especifican permisos, solo permitimos permisos básicos
      if (!permissions) {
        // Registrar los permisos base
        this._registerPluginPermissions(pluginId, ['ui', 'events']);
        
        return {
          valid: true,
          permissions: ['ui', 'events']
        };
      }
      
      // Normalizar permisos a array
      const permissionsArray = this._normalizePermissions(permissions);
      
      // Validar cada permiso
      const invalidPermissions = [];
      const approvedPermissions = [];
      const pendingPermissions = [];
      
      // Obtener permisos actuales ya aprobados para este plugin
      const currentPermissions = this.pluginPermissions[pluginId]?.approved || [];
      
      console.log(`[FIX] Validando permisos para ${pluginId}. Permisos actuales:`, currentPermissions);
      
      permissionsArray.forEach(permission => {
        // Verificar si el permiso existe
        if (!this.availablePermissions[permission]) {
          invalidPermissions.push({
            name: permission,
            reason: 'Permiso no reconocido'
          });
          return;
        }
        
        // SOLUCIÓN: Comprobar si el permiso ya está aprobado en la estructura interna
        if (currentPermissions.includes(permission)) {
          console.log(`[FIX] Permiso ${permission} ya está aprobado para ${pluginId}`);
          approvedPermissions.push(permission);
          return;
        }
        
        // Verificar si el permiso está auto-aprobado para este nivel de seguridad
        const autoApproved = this.autoApprovedPermissions[this.securityLevel]
          .includes(permission);
        
        if (autoApproved) {
          approvedPermissions.push(permission);
        } else {
          // Marcar como pendiente de revisión
          pendingPermissions.push(permission);
        }
      });
      
      // Registrar los permisos aprobados
      if (approvedPermissions.length > 0) {
        this._registerPluginPermissions(pluginId, approvedPermissions);
      }
      
      // Registrar solicitudes pendientes
      if (pendingPermissions.length > 0) {
        this._registerPendingPermissions(pluginId, pendingPermissions);
      }
      
      // Determinar resultado global
      const isValid = invalidPermissions.length === 0;
      
      // Generar razones para permisos inválidos
      const reasons = invalidPermissions.map(p => 
        `Permiso inválido: ${p.name} - ${p.reason}`
      );
      
      // Si hay permisos pendientes, añadir una razón
      if (pendingPermissions.length > 0) {
        reasons.push(`${pendingPermissions.length} permisos requieren revisión manual: ${pendingPermissions.join(', ')}`);
      }
      
      // Registrar en historial
      this._logPermissionValidation(pluginId, {
        permissions: permissionsArray,
        approved: approvedPermissions,
        pending: pendingPermissions,
        invalid: invalidPermissions,
        valid: isValid
      });
      
      // SOLUCIÓN: Log mejorado para depuración
      console.log(`[FIX] Resultado validación para ${pluginId}: `, {
        valid: isValid && pendingPermissions.length === 0,
        approvedPermissions,
        pendingPermissions
      });
      
      // Notificar permisos pendientes
      if (pendingPermissions.length > 0) {
        eventBus.publish('pluginSystem.pendingPermissions', {
          pluginId,
          permissions: pendingPermissions
        });
      }
      
      return {
        valid: isValid && pendingPermissions.length === 0,
        reasons: reasons.length > 0 ? reasons : null,
        approvedPermissions,
        pendingPermissions,
        invalidPermissions: invalidPermissions.map(p => p.name)
      };
    } catch (error) {
      console.error(`Error al validar permisos para plugin ${pluginId}:`, error);
      
      return {
        valid: false,
        reasons: [`Error al validar permisos: ${error.message}`]
      };
    }
  }  

  /**
   * Normaliza permisos a un array
   * @param {Array|Object|string} permissions - Permisos a normalizar
   * @returns {Array} - Array de permisos
   * @private
   */
  _normalizePermissions(permissions) {
    // Si ya es array, devolver copia
    if (Array.isArray(permissions)) {
      return [...permissions];
    }
    
    // Si es string, convertir a array
    if (typeof permissions === 'string') {
      return [permissions];
    }
    
    // Si es objeto, extraer keys que sean true
    if (typeof permissions === 'object' && permissions !== null) {
      return Object.entries(permissions)
        .filter(([_, value]) => value === true)
        .map(([key]) => key);
    }
    
    // Por defecto, array vacío
    return [];
  }

  /**
   * Registra los permisos aprobados para un plugin
   * @param {string} pluginId - ID del plugin
   * @param {Array} permissions - Permisos aprobados
   * @private
   */
  _registerPluginPermissions(pluginId, permissions) {
    if (!pluginId || !Array.isArray(permissions)) {
      return;
    }
    
    // Inicializar si no existe
    if (!this.pluginPermissions[pluginId]) {
      this.pluginPermissions[pluginId] = {
        approved: [],
        pending: [],
        revoked: []
      };
    }
    
    // Añadir permisos aprobados (sin duplicados)
    const currentApproved = new Set(this.pluginPermissions[pluginId].approved);
    permissions.forEach(permission => {
      currentApproved.add(permission);
    });
    
    this.pluginPermissions[pluginId].approved = Array.from(currentApproved);
    
    // Si hay permisos de alto riesgo, marcar plugin como elevado
    const hasHighRiskPermissions = permissions.some(permission => {
      const permInfo = this.availablePermissions[permission];
      return permInfo && (permInfo.risk === 'high' || permInfo.risk === 'critical');
    });
    
    if (hasHighRiskPermissions) {
      this.elevatedPermissionPlugins.add(pluginId);
      
      // Publicar evento
      eventBus.publish('pluginSystem.elevatedPermissionsGranted', {
        pluginId,
        permissions: permissions.filter(permission => {
          const permInfo = this.availablePermissions[permission];
          return permInfo && (permInfo.risk === 'high' || permInfo.risk === 'critical');
        })
      });
    }
    
    // Publicar evento
    eventBus.publish('pluginSystem.permissionsRegistered', {
      pluginId,
      permissions
    });
  }

  /**
   * Registra permisos pendientes de aprobación
   * @param {string} pluginId - ID del plugin
   * @param {Array} permissions - Permisos pendientes
   * @private
   */
  _registerPendingPermissions(pluginId, permissions) {
    if (!pluginId || !Array.isArray(permissions)) {
      return;
    }
    
    // Inicializar si no existe
    if (!this.pluginPermissions[pluginId]) {
      this.pluginPermissions[pluginId] = {
        approved: [],
        pending: [],
        revoked: []
      };
    }
    
    // Añadir permisos pendientes (sin duplicados)
    const currentPending = new Set(this.pluginPermissions[pluginId].pending);
    permissions.forEach(permission => {
      currentPending.add(permission);
    });
    
    this.pluginPermissions[pluginId].pending = Array.from(currentPending);
    
    // Registrar solicitud
    this.permissionRequests.push({
      pluginId,
      permissions,
      timestamp: Date.now(),
      status: 'pending'
    });
    
    // Limitar tamaño del historial
    if (this.permissionRequests.length > this.maxLogSize) {
      this.permissionRequests = this.permissionRequests.slice(-this.maxLogSize);
    }
  }

  /**
   * Registra una validación de permisos en el historial
   * @param {string} pluginId - ID del plugin
   * @param {Object} result - Resultado de la validación
   * @private
   */
  _logPermissionValidation(pluginId, result) {
    // Añadir al historial
    this.permissionRequests.push({
      pluginId,
      ...result,
      timestamp: Date.now(),
      status: result.valid ? 'approved' : 'rejected'
    });
    
    // Limitar tamaño del historial
    if (this.permissionRequests.length > this.maxLogSize) {
      this.permissionRequests = this.permissionRequests.slice(-this.maxLogSize);
    }
  }

  /**
   * Verifica si un plugin tiene un permiso específico
   * @param {string} pluginId - ID del plugin
   * @param {string} permission - Permiso a verificar
   * @returns {boolean} - true si tiene el permiso
   */
  hasPermission(pluginId, permission) {
    if (!pluginId || !permission) {
      return false;
    }
    
    // Si el plugin no tiene permisos registrados, no tiene permiso
    if (!this.pluginPermissions[pluginId]) {
      return false;
    }
    
    // Verificar en permisos aprobados
    return this.pluginPermissions[pluginId].approved.includes(permission);
  }

  /**
   * Verifica acceso a un método específico
   * @param {string} pluginId - ID del plugin
   * @param {string} method - Método al que se intenta acceder
   * @returns {Object} - Resultado de la verificación
   */
  checkMethodAccess(pluginId, method) {
    if (!pluginId || !method) {
      return {
        permitted: false,
        reason: 'Argumentos inválidos'
      };
    }
    
    try {
      // Buscar qué permiso corresponde al método
      let requiredPermission = null;
      
      // Iterar sobre todos los permisos para encontrar el método
      Object.entries(this.availablePermissions).forEach(([permName, permInfo]) => {
        if (permInfo.methods && permInfo.methods.some(m => method.includes(m))) {
          requiredPermission = permName;
        }
      });
      
      // Si no se encontró permiso, verificar si es un método libre
      if (!requiredPermission) {
        // Lista de métodos permitidos sin permiso específico
        const freeMethods = [
          'core.getModule',
          'console.log',
          'console.warn',
          'console.error'
        ];
        
        // Si está en la lista blanca, permitir
        if (freeMethods.some(m => method.includes(m))) {
          return {
            permitted: true,
            permission: 'free',
            method
          };
        }
        
        // En nivel de seguridad bajo, permitir métodos sin permiso específico
        if (this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW) {
          return {
            permitted: true,
            permission: 'unspecified',
            method,
            warning: 'Método no asociado a permiso específico'
          };
        }
        
        // En otros niveles, rechazar
        return {
          permitted: false,
          reason: `Método ${method} no asociado a ningún permiso conocido`,
          method
        };
      }
      
      // Verificar si el plugin tiene el permiso requerido
      const hasPermission = this.hasPermission(pluginId, requiredPermission);
      
      // Registrar acceso
      this._logApiAccess(pluginId, method, requiredPermission, hasPermission);
      
      // Si no tiene permiso y está en modo estricto, generar evento
      if (!hasPermission && this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH) {
        eventBus.publish('pluginSystem.unauthorizedAccess', {
          pluginId,
          method,
          requiredPermission
        });
      }
      
      return {
        permitted: hasPermission,
        permission: requiredPermission,
        method,
        reason: hasPermission ? null : `Se requiere el permiso ${requiredPermission}`
      };
    } catch (error) {
      console.error(`Error al verificar acceso a método ${method} para plugin ${pluginId}:`, error);
      
      return {
        permitted: false,
        reason: `Error en verificación: ${error.message}`,
        method
      };
    }
  }

  /**
   * Registra un acceso a API en el historial
   * @param {string} pluginId - ID del plugin
   * @param {string} method - Método accedido
   * @param {string} permission - Permiso requerido
   * @param {boolean} permitted - Si fue permitido
   * @private
   */
  _logApiAccess(pluginId, method, permission, permitted) {
    // Inicializar log si no existe
    if (!this.apiAccessLogs[pluginId]) {
      this.apiAccessLogs[pluginId] = [];
    }
    
    // Añadir registro
    this.apiAccessLogs[pluginId].push({
      timestamp: Date.now(),
      method,
      permission,
      permitted
    });
    
    // Limitar tamaño del log
    if (this.apiAccessLogs[pluginId].length > this.maxLogSize) {
      this.apiAccessLogs[pluginId] = this.apiAccessLogs[pluginId].slice(-this.maxLogSize);
    }
  }

  /**
   * Aprueba permisos pendientes para un plugin
   * @param {string} pluginId - ID del plugin
   * @param {Array} permissions - Permisos a aprobar
   * @returns {boolean} - true si se aprobaron correctamente
   */
  approvePermissions(pluginId, permissions) {
    if (!pluginId || !Array.isArray(permissions) || permissions.length === 0) {
      console.warn('Argumentos inválidos para approvePermissions', { pluginId, permissions });
      return false;
    }
    
    try {
      console.log(`Intentando aprobar permisos para ${pluginId}:`, permissions);
      
      // 1. Inicializar si no existe la estructura para este plugin
      if (!this.pluginPermissions[pluginId]) {
        this.pluginPermissions[pluginId] = {
          approved: [],
          pending: permissions.slice(), // Copia de seguridad en caso de que no estén en pending
          revoked: []
        };
      }
      
      // 2. Añadir los permisos directamente a la lista de aprobados (forzando la aprobación)
      this._registerPluginPermissions(pluginId, permissions);
      
      // 3. Mostrar estado actual para depuración
      console.log('Estado de permisos antes de quitar pendientes:', JSON.stringify(this.pluginPermissions[pluginId]));
      
      // 4. Quitar explícitamente de la lista de pendientes
      if (this.pluginPermissions[pluginId].pending) {
        this.pluginPermissions[pluginId].pending = 
          this.pluginPermissions[pluginId].pending.filter(p => !permissions.includes(p));
      }
      
      // 5. Actualizar solicitudes pendientes
      this.permissionRequests = this.permissionRequests.filter(request => {
        if (request.pluginId === pluginId && request.status === 'pending') {
          // Marcar como aprobada la solicitud completa si todos sus permisos están aprobados
          const containsAnyPermission = request.permissions.some(p => permissions.includes(p));
          if (containsAnyPermission) {
            request.status = 'approved';
          }
        }
        return true; // Mantener en la lista
      });
      
      // 6. Mostrar el estado final para depuración
      console.log('Estado final de permisos:', JSON.stringify(this.pluginPermissions[pluginId]));
      
      // 7. Publicar evento de aprobación manual
      try {
        if (typeof eventBus !== 'undefined' && eventBus.publish) {
          eventBus.publish('pluginSystem.permissionsApproved', {
            pluginId,
            permissions,
            source: 'manual-fix'
          });
        }
      } catch (eventError) {
        console.warn('Error al publicar evento:', eventError);
      }
      
      return true;
    } catch (error) {
      console.error(`Error crítico al aprobar permisos para plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Rechaza permisos pendientes para un plugin
   * @param {string} pluginId - ID del plugin
   * @param {Array} permissions - Permisos a rechazar
   * @returns {boolean} - true si se rechazaron correctamente
   */
  rejectPermissions(pluginId, permissions) {
    if (!pluginId || !Array.isArray(permissions) || permissions.length === 0) {
      return false;
    }
    
    try {
      // Verificar que los permisos estén pendientes
      if (!this.pluginPermissions[pluginId] || !this.pluginPermissions[pluginId].pending) {
        return false;
      }
      
      // Filtrar solo permisos que estén pendientes
      const permissionsToReject = permissions.filter(permission => 
        this.pluginPermissions[pluginId].pending.includes(permission)
      );
      
      if (permissionsToReject.length === 0) {
        return false;
      }
      
      // Quitar de pendientes
      this.pluginPermissions[pluginId].pending = 
        this.pluginPermissions[pluginId].pending.filter(
          permission => !permissionsToReject.includes(permission)
        );
      
      // Añadir a revocados
      if (!this.pluginPermissions[pluginId].revoked) {
        this.pluginPermissions[pluginId].revoked = [];
      }
      
      this.pluginPermissions[pluginId].revoked.push(
        ...permissionsToReject
      );
      
      // Actualizar solicitudes pendientes
      this.permissionRequests.forEach(request => {
        if (request.pluginId === pluginId && request.status === 'pending') {
          const requestPermissions = request.permissions || [];
          const matchingRejected = requestPermissions.filter(
            permission => permissionsToReject.includes(permission)
          );
          
          if (matchingRejected.length > 0) {
            request.status = 'rejected';
          }
        }
      });
      
      // Publicar evento
      eventBus.publish('pluginSystem.permissionsRejected', {
        pluginId,
        permissions: permissionsToReject
      });
      
      return true;
    } catch (error) {
      console.error(`Error al rechazar permisos para plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Revoca permisos previamente aprobados
   * @param {string} pluginId - ID del plugin
   * @param {Array} permissions - Permisos a revocar
   * @returns {boolean} - true si se revocaron correctamente
   */
  revokePermissions(pluginId, permissions) {
    if (!pluginId || !Array.isArray(permissions) || permissions.length === 0) {
      return false;
    }
    
    try {
      // Verificar que el plugin tenga permisos
      if (!this.pluginPermissions[pluginId]) {
        return false;
      }
      
      // Filtrar solo permisos que estén aprobados
      const permissionsToRevoke = permissions.filter(permission => 
        this.pluginPermissions[pluginId].approved.includes(permission)
      );
      
      if (permissionsToRevoke.length === 0) {
        return false;
      }
      
      // Quitar de aprobados
      this.pluginPermissions[pluginId].approved = 
        this.pluginPermissions[pluginId].approved.filter(
          permission => !permissionsToRevoke.includes(permission)
        );
      
      // Añadir a revocados
      if (!this.pluginPermissions[pluginId].revoked) {
        this.pluginPermissions[pluginId].revoked = [];
      }
      
      this.pluginPermissions[pluginId].revoked.push(
        ...permissionsToRevoke
      );
      
      // Verificar si hay que quitar de plugins con permisos elevados
      this._updateElevatedStatus(pluginId);
      
      // Publicar evento
      eventBus.publish('pluginSystem.permissionsRevoked', {
        pluginId,
        permissions: permissionsToRevoke
      });
      
      return true;
    } catch (error) {
      console.error(`Error al revocar permisos para plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Actualiza el estado de permisos elevados de un plugin
   * @param {string} pluginId - ID del plugin
   * @private
   */
  _updateElevatedStatus(pluginId) {
    if (!pluginId || !this.pluginPermissions[pluginId]) {
      return;
    }
    
    // Verificar si tiene permisos de alto riesgo
    const hasHighRiskPermissions = this.pluginPermissions[pluginId].approved.some(permission => {
      const permInfo = this.availablePermissions[permission];
      return permInfo && (permInfo.risk === 'high' || permInfo.risk === 'critical');
    });
    
    // Actualizar estado
    if (hasHighRiskPermissions) {
      this.elevatedPermissionPlugins.add(pluginId);
    } else {
      this.elevatedPermissionPlugins.delete(pluginId);
    }
  }

  /**
   * Obtiene los permisos de un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {Object|null} - Información de permisos o null
   */
  getPluginPermissions(pluginId) {
    if (!pluginId) {
      return null;
    }
    
    // Si no tiene permisos registrados, devolver objeto base
    if (!this.pluginPermissions[pluginId]) {
      return {
        approved: [],
        pending: [],
        revoked: [],
        hasElevatedPermissions: false,
        // Helpers para verificaciones rápidas
        hasStoragePermission: false,
        hasNetworkPermission: false,
        hasDomPermission: false,
        hasCodeExecutionPermission: false
      };
    }
    
    // Generar información completa
    return {
      approved: [...this.pluginPermissions[pluginId].approved],
      pending: [...(this.pluginPermissions[pluginId].pending || [])],
      revoked: [...(this.pluginPermissions[pluginId].revoked || [])],
      hasElevatedPermissions: this.elevatedPermissionPlugins.has(pluginId),
      // Helpers para verificaciones rápidas
      hasStoragePermission: this.hasPermission(pluginId, 'storage'),
      hasNetworkPermission: this.hasPermission(pluginId, 'network'),
      hasDomPermission: this.hasPermission(pluginId, 'dom'),
      hasCodeExecutionPermission: this.hasPermission(pluginId, 'codeExecution')
    };
  }

  /**
   * Obtiene el historial de acceso a API de un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {Array} - Historial de accesos
   */
  getApiAccessHistory(pluginId) {
    if (!pluginId) {
      return [];
    }
    
    return this.apiAccessLogs[pluginId] || [];
  }

  /**
   * Obtiene las solicitudes de permisos pendientes
   * @returns {Array} - Solicitudes pendientes
   */
  getPendingPermissionRequests() {
    return this.permissionRequests.filter(request => request.status === 'pending');
  }

  /**
   * Establece el nivel de seguridad del verificador
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
      eventBus.publish('pluginSystem.permissionCheckerSecurityLevelChanged', {
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
    
    this.activeChecks = new Set(activeChecks);
    
    // Publicar evento de actualización
    eventBus.publish('pluginSystem.permissionCheckerChecksUpdated', {
      checks: Array.from(this.activeChecks)
    });
  }

  /**
   * Limpia todos los datos relacionados con un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {boolean} - true si se limpió correctamente
   */
  clearPluginData(pluginId) {
    if (!pluginId) return false;
    
    try {
      // Eliminar permisos
      delete this.pluginPermissions[pluginId];
      
      // Eliminar historial de acceso
      delete this.apiAccessLogs[pluginId];
      
      // Quitar de plugins con permisos elevados
      this.elevatedPermissionPlugins.delete(pluginId);
      
      // Filtrar historial de solicitudes
      this.permissionRequests = this.permissionRequests.filter(
        request => request.pluginId !== pluginId
      );
      
      return true;
    } catch (error) {
      console.error(`Error al limpiar datos de plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas de permisos
   * @returns {Object} - Estadísticas
   */
  getPermissionStats() {
    try {
      // Contar plugins con permisos
      const pluginsWithPermissions = Object.keys(this.pluginPermissions).length;
      
      // Plugins con permisos elevados
      const pluginsWithElevatedPermissions = this.elevatedPermissionPlugins.size;
      
      // Solicitudes pendientes
      const pendingRequests = this.permissionRequests.filter(
        request => request.status === 'pending'
      ).length;
      
      // Contar permisos por tipo
      const permissionsByType = {};
      
      Object.values(this.pluginPermissions).forEach(permissions => {
        permissions.approved.forEach(permission => {
          if (!permissionsByType[permission]) {
            permissionsByType[permission] = 0;
          }
          permissionsByType[permission]++;
        });
      });
      
      // Permisos más comunes
      const mostCommonPermissions = Object.entries(permissionsByType)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([permission, count]) => ({
          permission,
          count,
          risk: this.availablePermissions[permission]?.risk || 'unknown'
        }));
      
      return {
        pluginsWithPermissions,
        pluginsWithElevatedPermissions,
        pendingRequests,
        permissionsByType,
        mostCommonPermissions,
        securityLevel: this.securityLevel,
        activeChecks: Array.from(this.activeChecks)
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de permisos:', error);
      
      return {
        error: error.message,
        securityLevel: this.securityLevel
      };
    }
  }
}

// Exportar instancia única
const pluginPermissionChecker = new PluginPermissionChecker();
export default pluginPermissionChecker;