/**
 * Verificador de Permisos para Plugins de Atlas
 */
import eventBus from '../bus/event-bus';
import { PLUGIN_CONSTANTS } from '../config/constants';

class PluginPermissionChecker {
  constructor() {
    this.initialized = false;
    // Asumimos que PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL es una cadena como "normal"
    this.securityLevel = PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL; 
    this.activeChecks = new Set(['apiAccess']);
    this.pluginPermissions = {};
    this.elevatedPermissionPlugins = new Set();
    this.permissionRequests = [];
    this.apiAccessLogs = {};
    this.maxLogSize = 100;
    
    // Las claves son directamente los valores de las constantes (ej. "low", "normal", "high")
    this.autoApprovedPermissions = {
      [PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW]: [ 
        'storage', 'network', 'notifications', 'ui', 'events', 'communication', 'dom'
      ],
      [PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL]: [
        'storage', 'ui', 'events', 'communication'
      ],
      [PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH]: [
        'ui', 'events'
      ]
    };
    
    this.availablePermissions = { // Sin cambios
      'storage': { name: 'storage', description: '...', methods: ['core.storage.setItem'], risk: 'low' },
      'network': { name: 'network', description: '...', methods: ['fetch'], risk: 'medium' },
      'notifications': { name: 'notifications', description: '...', methods: ['core.notifications.show'], risk: 'low' },
      'ui': { name: 'ui', description: '...', methods: ['core.ui.registerExtension'], risk: 'low' },
      'events': { name: 'events', description: '...', methods: ['core.events.subscribe'], risk: 'low' },
      'communication': { name: 'communication', description: '...', methods: ['core.plugins.getPluginAPI'], risk: 'medium' },
      'dom': { name: 'dom', description: '...', methods: ['document.createElement'], risk: 'high' },
      'codeExecution': { name: 'codeExecution', description: '...', methods: ['new Function'], risk: 'critical' }
    };
  }

  initialize(securityLevelInput) {
    if (this.initialized && securityLevelInput === undefined) {
        return true;
    }
    if (this.initialized && securityLevelInput && this.securityLevel === securityLevelInput) {
        return true;
    }
    
    try {
      console.log('Inicializando verificador de permisos para plugins...');
      
      // Si securityLevelInput es undefined, usa el valor actual de this.securityLevel (que vino del constructor o un set previo)
      const initialLevel = securityLevelInput || this.securityLevel; 
      
      const levelSetSuccessfully = this.setSecurityLevel(initialLevel);

      if (!levelSetSuccessfully && securityLevelInput) {
          console.warn(`Nivel de seguridad de inicialización '${securityLevelInput}' inválido. Se mantiene el nivel '${this.securityLevel}'.`);
      }
      
      this.initialized = true;
      
      // El log usa this.securityLevel (que será minúscula) y lo convierte a MAYÚSCULAS para el log
      console.log(`Verificador de permisos inicializado (nivel: ${String(this.securityLevel).toUpperCase()})`);
      return true;
    } catch (error) {
      console.error('Error al inicializar verificador de permisos:', error);
      this.initialized = false; 
      return false;
    }
  }

  setSecurityLevel(levelInput) { // levelInput debe ser uno de los VALORES de las constantes (ej. "high")
    const validLevels = Object.values(PLUGIN_CONSTANTS.SECURITY.LEVEL); // ["low", "normal", "high"]
    
    if (levelInput === undefined || levelInput === null) {
        console.warn(`[SET_SEC_LEVEL] Intento de establecer un nivel de seguridad nulo o indefinido. No se realizarán cambios.`);
        return false;
    }

    // El input ya debería ser uno de los valores de las constantes (minúsculas)
    // No es necesario .toUpperCase() aquí si las constantes son minúsculas.
    const levelToValidate = String(levelInput);

    if (!validLevels.includes(levelToValidate)) { 
        console.warn(`[SET_SEC_LEVEL] Nivel de seguridad inválido: '${levelInput}'. Los niveles válidos son: ${validLevels.join(', ')}. No se cambiará el nivel actual ('${this.securityLevel}').`);
        return false; 
    }
    
    if (this.securityLevel === levelToValidate) {
        return true; 
    }

    this.securityLevel = levelToValidate; // Asigna el valor validado (minúscula)
    
    try {
      eventBus.publish('pluginSystem.permissionCheckerSecurityLevelChanged', {
        level: this.securityLevel // Enviar el nivel almacenado (minúscula)
      });
      return true;
    } catch (error) {
      console.error(`[SET_SEC_LEVEL] Error al publicar evento:`, error);
      return true; 
    }
  }

  validatePermissions(pluginId, permissions) {
    if (!this.initialized) {
        this.initialize(); 
    }

    if (!pluginId) {
      return { 
          valid: false, reasons: ['ID de plugin no válido'], 
          approvedPermissions: [], pendingPermissions: [], invalidPermissions: [] 
        };
    }
    
    try {
      if (!permissions) { 
        this._registerPluginPermissions(pluginId, ['ui', 'events']);
        return {
          valid: true, permissions: ['ui', 'events'], 
          approvedPermissions: ['ui', 'events'], pendingPermissions: [], invalidPermissions: []
        };
      }
      
      const permissionsArray = this._normalizePermissions(permissions);
      const invalidPermissionsInfo = [];
      const approvedPermissions = [];
      const pendingPermissions = [];
      const currentPluginPerms = this.pluginPermissions[pluginId] || { approved: [], pending: [], revoked: [] };
      
      permissionsArray.forEach(permission => {
        if (!this.availablePermissions[permission]) {
          invalidPermissionsInfo.push({ name: permission, reason: 'Permiso no reconocido' });
          return;
        }
        
        if (currentPluginPerms.approved.includes(permission)) {
          approvedPermissions.push(permission);
          return;
        }
        
        // this.securityLevel es ahora minúscula ("normal", "low", "high")
        // y las claves de autoApprovedPermissions son minúsculas
        const autoApprovedList = this.autoApprovedPermissions[this.securityLevel] || [];
        const autoApproved = autoApprovedList.includes(permission);
        
        if (autoApproved) {
          approvedPermissions.push(permission);
        } else {
          pendingPermissions.push(permission);
        }
      });
      
      if (approvedPermissions.length > 0) this._registerPluginPermissions(pluginId, approvedPermissions);
      if (pendingPermissions.length > 0) this._registerPendingPermissions(pluginId, pendingPermissions);
      
      const isValidOverall = invalidPermissionsInfo.length === 0;
      const isFullyApproved = pendingPermissions.length === 0;
      const reasons = invalidPermissionsInfo.map(p => `Permiso inválido: ${p.name} - ${p.reason}`);
      if (pendingPermissions.length > 0) {
        reasons.push(`${pendingPermissions.length} permisos requieren revisión manual: ${pendingPermissions.join(', ')}`);
      }
      
      this._logPermissionValidation(pluginId, {
        permissions: permissionsArray, approved: approvedPermissions,
        pending: pendingPermissions, invalid: invalidPermissionsInfo.map(p=>p.name),
        valid: isValidOverall && isFullyApproved
      });
      
      if (pendingPermissions.length > 0) {
        eventBus.publish('pluginSystem.pendingPermissions', { pluginId, permissions: pendingPermissions });
      }
      
      return {
        valid: isValidOverall && isFullyApproved,
        reasons: reasons.length > 0 ? reasons : null,
        approvedPermissions, pendingPermissions,
        invalidPermissions: invalidPermissionsInfo.map(p => p.name)
      };
    } catch (error) {
      console.error(`Error al validar permisos para plugin ${pluginId}:`, error);
      return { 
          valid: false, reasons: [`Error al validar permisos: ${error.message}`],
          approvedPermissions: [], pendingPermissions: [], invalidPermissions: []
        };
    }
  }  

  _normalizePermissions(permissions) { // Sin cambios
    if (Array.isArray(permissions)) return [...permissions];
    if (typeof permissions === 'string') return [permissions];
    if (typeof permissions === 'object' && permissions !== null) {
      return Object.entries(permissions)
        .filter(([_, value]) => value === true)
        .map(([key]) => key);
    }
    return [];
  }

  _registerPluginPermissions(pluginId, permissionsToApprove) { // Sin cambios
    if (!pluginId || !Array.isArray(permissionsToApprove)) return;
    if (!this.pluginPermissions[pluginId]) {
      this.pluginPermissions[pluginId] = { approved: [], pending: [], revoked: [] };
    }
    const currentApproved = new Set(this.pluginPermissions[pluginId].approved);
    permissionsToApprove.forEach(permission => currentApproved.add(permission));
    this.pluginPermissions[pluginId].approved = Array.from(currentApproved);
    
    this.pluginPermissions[pluginId].pending = this.pluginPermissions[pluginId].pending.filter(p => !permissionsToApprove.includes(p));
    this.pluginPermissions[pluginId].revoked = this.pluginPermissions[pluginId].revoked.filter(p => !permissionsToApprove.includes(p));

    this._updateElevatedStatus(pluginId);
    eventBus.publish('pluginSystem.permissionsRegistered', { pluginId, permissions: permissionsToApprove });
  }

  _registerPendingPermissions(pluginId, permissionsToAdd) { // Sin cambios
    if (!pluginId || !Array.isArray(permissionsToAdd)) return;
    if (!this.pluginPermissions[pluginId]) {
      this.pluginPermissions[pluginId] = { approved: [], pending: [], revoked: [] };
    }
    const currentPending = new Set(this.pluginPermissions[pluginId].pending);
    permissionsToAdd.forEach(permission => {
      if (!this.pluginPermissions[pluginId].approved.includes(permission) &&
          !this.pluginPermissions[pluginId].revoked.includes(permission)) {
        currentPending.add(permission);
      }
    });
    this.pluginPermissions[pluginId].pending = Array.from(currentPending);
    
    const existingRequest = this.permissionRequests.find(req => 
      req.pluginId === pluginId && 
      req.status === 'pending' &&
      JSON.stringify(req.permissions.sort()) === JSON.stringify([...permissionsToAdd].sort())
    );
    if (!existingRequest && permissionsToAdd.length > 0) {
        this.permissionRequests.push({
          pluginId, permissions: [...permissionsToAdd], 
          timestamp: Date.now(), status: 'pending'
        });
        if (this.permissionRequests.length > this.maxLogSize) {
          this.permissionRequests = this.permissionRequests.slice(-this.maxLogSize);
        }
    }
  }

  _logPermissionValidation(pluginId, result) { // Sin cambios
    // console.log(`[AUDIT-VALIDATION] ${pluginId}:`, result);
  }

  hasPermission(pluginId, permission) { // Sin cambios
    if (!this.initialized) this.initialize();
    if (!pluginId || !permission) return false;
    if (!this.pluginPermissions[pluginId]) return false;
    return this.pluginPermissions[pluginId].approved.includes(permission);
  }

  checkMethodAccess(pluginId, method) { // Sin cambios
    if (!this.initialized) this.initialize();
    if (!pluginId || !method) {
      return { permitted: false, reason: 'Argumentos inválidos' };
    }
    try {
      let requiredPermission = null;
      Object.entries(this.availablePermissions).forEach(([permName, permInfo]) => {
        if (permInfo.methods && permInfo.methods.some(m => method.includes(m))) {
          requiredPermission = permName;
        }
      });
      
      if (!requiredPermission) {
        const freeMethods = [ 'core.getModule', 'console.log', 'console.warn', 'console.error' ];
        if (freeMethods.some(m => method.includes(m))) {
          return { permitted: true, permission: 'free', method };
        }
        
        // this.securityLevel es minúscula, PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW es minúscula
        if (this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW) {
          return {
            permitted: true, permission: 'unspecified', method,
            warning: 'Método no asociado a permiso específico'
          };
        }
        return {
          permitted: false, reason: `Método ${method} no asociado a ningún permiso conocido`, method
        };
      }
      
      const hasPerm = this.hasPermission(pluginId, requiredPermission);
      this._logApiAccess(pluginId, method, requiredPermission, hasPerm);
      
      // this.securityLevel es minúscula, PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH es minúscula
      if (!hasPerm && this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH) {
        eventBus.publish('pluginSystem.unauthorizedAccess', {
          pluginId, method, requiredPermission
        });
      }
      return {
        permitted: hasPerm, permission: requiredPermission, method,
        reason: hasPerm ? null : `Se requiere el permiso ${requiredPermission}`
      };
    } catch (error) {
      console.error(`Error al verificar acceso a método ${method} para plugin ${pluginId}:`, error);
      return { permitted: false, reason: `Error en verificación: ${error.message}`, method };
    }
  }

  _logApiAccess(pluginId, method, permission, permitted) { // Sin cambios
    if (!this.apiAccessLogs[pluginId]) this.apiAccessLogs[pluginId] = [];
    this.apiAccessLogs[pluginId].push({ timestamp: Date.now(), method, permission, permitted });
    if (this.apiAccessLogs[pluginId].length > this.maxLogSize) {
      this.apiAccessLogs[pluginId] = this.apiAccessLogs[pluginId].slice(-this.maxLogSize);
    }
  }

  approvePermissions(pluginId, permissionsToApprove) { // Sin cambios
    if (!this.initialized) this.initialize();
    if (!pluginId || !Array.isArray(permissionsToApprove) || permissionsToApprove.length === 0) {
      return false;
    }
    try {
      this._registerPluginPermissions(pluginId, permissionsToApprove); 
            
      this.permissionRequests.forEach(request => {
        if (request.pluginId === pluginId && request.status === 'pending') {
          request.permissions = request.permissions.filter(p => !permissionsToApprove.includes(p));
          if (request.permissions.length === 0) {
            request.status = 'approved';
          }
        }
      });
      
      eventBus.publish('pluginSystem.permissionsApproved', {
        pluginId, permissions: permissionsToApprove, source: 'manual'
      });
      return true;
    } catch (error) {
      console.error(`Error crítico al aprobar permisos para plugin ${pluginId}:`, error);
      return false;
    }
  }

  rejectPermissions(pluginId, permissionsToReject) { // Sin cambios
    if (!this.initialized) this.initialize();
    if (!pluginId || !Array.isArray(permissionsToReject) || permissionsToReject.length === 0) return false;
    try {
      if (!this.pluginPermissions[pluginId]) {
         this.pluginPermissions[pluginId] = { approved: [], pending: [], revoked: [] };
      }
      
      const actualPermissionsRejected = [];
      permissionsToReject.forEach(permission => {
        const pendingIdx = this.pluginPermissions[pluginId].pending.indexOf(permission);
        if (pendingIdx > -1) {
          this.pluginPermissions[pluginId].pending.splice(pendingIdx, 1);
          if (!this.pluginPermissions[pluginId].revoked.includes(permission)) {
            this.pluginPermissions[pluginId].revoked.push(permission);
          }
          actualPermissionsRejected.push(permission);
        }
      });

      if (actualPermissionsRejected.length === 0) return false;
      
      this.permissionRequests.forEach(request => {
        if (request.pluginId === pluginId && request.status === 'pending') {
           const originalRequestPermissions = [...request.permissions]; 
           request.permissions = request.permissions.filter(p => !actualPermissionsRejected.includes(p));
           if (request.permissions.length === 0 && originalRequestPermissions.some(p => actualPermissionsRejected.includes(p))) {
              request.status = 'rejected'; 
           }
        }
      });
      
      eventBus.publish('pluginSystem.permissionsRejected', { pluginId, permissions: actualPermissionsRejected });
      return true;
    } catch (error) {
      console.error(`Error al rechazar permisos para plugin ${pluginId}:`, error);
      return false;
    }
  }

  revokePermissions(pluginId, permissionsToRevoke) { // Sin cambios
    if (!this.initialized) this.initialize();
    if (!pluginId || !Array.isArray(permissionsToRevoke) || permissionsToRevoke.length === 0) return false;
    try {
      if (!this.pluginPermissions[pluginId]) return false; 
      
      const actualPermissionsRevoked = [];
      permissionsToRevoke.forEach(permission => {
          const approvedIdx = this.pluginPermissions[pluginId].approved.indexOf(permission);
          if (approvedIdx > -1) {
              this.pluginPermissions[pluginId].approved.splice(approvedIdx, 1);
              if (!this.pluginPermissions[pluginId].revoked.includes(permission)) {
                  this.pluginPermissions[pluginId].revoked.push(permission);
              }
              actualPermissionsRevoked.push(permission);
          }
      });

      if(actualPermissionsRevoked.length === 0) return false;

      this._updateElevatedStatus(pluginId);
      eventBus.publish('pluginSystem.permissionsRevoked', { pluginId, permissions: actualPermissionsRevoked });
      return true;
    } catch (error) {
      console.error(`Error al revocar permisos para plugin ${pluginId}:`, error);
      return false;
    }
  }

  _updateElevatedStatus(pluginId) { // Sin cambios
    if (!pluginId || !this.pluginPermissions[pluginId]) return;
    const hasHighRiskPermissions = this.pluginPermissions[pluginId].approved.some(permission => {
      const permInfo = this.availablePermissions[permission];
      return permInfo && (permInfo.risk === 'high' || permInfo.risk === 'critical');
    });
    if (hasHighRiskPermissions) this.elevatedPermissionPlugins.add(pluginId);
    else this.elevatedPermissionPlugins.delete(pluginId);
  }

  getPluginPermissions(pluginId) { // Sin cambios
    if (!this.initialized) this.initialize();
    if (!pluginId) return null; 
    const perms = this.pluginPermissions[pluginId];
    if (!perms) {
      return {
        approved: [], pending: [], revoked: [], hasElevatedPermissions: false,
        hasStoragePermission: false, hasNetworkPermission: false,
        hasDomPermission: false, hasCodeExecutionPermission: false
      };
    }
    return {
      approved: [...perms.approved],
      pending: [...(perms.pending || [])],
      revoked: [...(perms.revoked || [])],
      hasElevatedPermissions: this.elevatedPermissionPlugins.has(pluginId),
      hasStoragePermission: perms.approved.includes('storage'),
      hasNetworkPermission: perms.approved.includes('network'),
      hasDomPermission: perms.approved.includes('dom'),
      hasCodeExecutionPermission: perms.approved.includes('codeExecution')
    };
  }

  getApiAccessHistory(pluginId) { // Sin cambios
    if (!this.initialized) this.initialize();
    if (!pluginId) return [];
    return this.apiAccessLogs[pluginId] || [];
  }

  getPendingPermissionRequests() { // Sin cambios
    if (!this.initialized) this.initialize();
    return this.permissionRequests.filter(request => request.status === 'pending');
  }

  updateSecurityChecks(activeChecks) { // Sin cambios
    if (!this.initialized) this.initialize();
    if (!activeChecks) return;
    this.activeChecks = new Set(activeChecks);
    eventBus.publish('pluginSystem.permissionCheckerChecksUpdated', {
      checks: Array.from(this.activeChecks)
    });
  }

  clearPluginData(pluginId) { // Sin cambios
    if (!this.initialized) this.initialize();
    if (!pluginId) return false;
    try {
      delete this.pluginPermissions[pluginId];
      delete this.apiAccessLogs[pluginId];
      this.elevatedPermissionPlugins.delete(pluginId);
      this.permissionRequests = this.permissionRequests.filter(
        request => request.pluginId !== pluginId
      );
      return true;
    } catch (error) {
      console.error(`Error al limpiar datos de plugin ${pluginId}:`, error);
      return false;
    }
  }

  getPermissionStats() { // Sin cambios
    if (!this.initialized) this.initialize();
    try {
      const pluginsWithPermissions = Object.keys(this.pluginPermissions).length;
      const pluginsWithElevatedPermissions = this.elevatedPermissionPlugins.size;
      const pendingRequests = this.permissionRequests.filter(r => r.status === 'pending').length;
      const permissionsByType = {};
      Object.values(this.pluginPermissions).forEach(perms => {
        (perms.approved || []).forEach(permission => {
          permissionsByType[permission] = (permissionsByType[permission] || 0) + 1;
        });
      });
      const mostCommonPermissions = Object.entries(permissionsByType)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([permission, count]) => ({
          permission, count,
          risk: this.availablePermissions[permission]?.risk || 'unknown'
        }));
      return {
        pluginsWithPermissions, pluginsWithElevatedPermissions, pendingRequests,
        permissionsByType, mostCommonPermissions,
        securityLevel: this.securityLevel, // Enviar el nivel almacenado (minúscula)
        activeChecks: Array.from(this.activeChecks)
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de permisos:', error);
      return { error: error.message, securityLevel: this.securityLevel };
    }
  }
}

const pluginPermissionChecker = new PluginPermissionChecker();
export default pluginPermissionChecker;