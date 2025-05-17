/**
 * Gestor de plugins para Atlas - Versión optimizada
 */
import { loadPlugins, loadPluginById, validatePluginCompatibility } from './plugin-loader';
import pluginRegistry from './plugin-registry';
import coreAPI from './core-api';
import storageService from '../../services/storage-service';
import { PLUGIN_CONSTANTS } from '../config/constants';
import eventBus from '../bus/event-bus';
import pluginCompatibility from './plugin-compatibility';
import pluginDependencyResolver from './plugin-dependency-resolver';
import pluginAPIRegistry from './plugin-api-registry';
import pluginCommunication from './plugin-communication';
import pluginSecurityManager from './plugin-security-manager';
import pluginSandbox from './plugin-sandbox';
import pluginResourceMonitor from './plugin-resource-monitor';
import pluginPermissionChecker from './plugin-permission-checker';
import pluginSecurityAudit from './plugin-security-audit';

// Constantes
const PLUGIN_STATE_KEY = 'atlas_plugin_states';
const PLUGIN_SECURITY_SETTINGS_KEY = 'atlas_plugin_security_settings';

class PluginManager {
  constructor() {
    this.initialized = false;
    this.loading = false;
    this.error = null;
    this._subscribers = {};
    this._lastSubscriberId = 0;
    this._compatibilityResults = {};
    this.securityLevel = PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL;
    this.securityInitialized = false;
    this._activatingPlugins = new Set();
  }

  /**
   * Inicializa el sistema de plugins
   */
  async initialize(services = {}, options = {}) {
    if (this.initialized) {
      console.warn('El gestor de plugins ya está inicializado');
      return true;
    }
    
    try {
      this.loading = true;
      this.error = null;
      
      // Configurar seguridad e inicializar sistemas
      this.securityLevel = options.securityLevel || PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL;
      coreAPI.init(services);
      
      if (options.enableSecurity !== false) {
        await this._initializeSecuritySystem();
      }
      
      // Cargar estados y plugins
      await this._loadPluginStates();
      const plugins = await loadPlugins();
      
      // Registrar plugins y verificar compatibilidad
      const registeredCount = this._registerPlugins(plugins);
      await this._verifyPluginCompatibility();
      
      this.initialized = true;
      await this._activatePluginsFromState();
      
      console.log(`Sistema de plugins inicializado. ${registeredCount} plugins registrados.`);
      this._publishEvent('initialized', { 
        pluginsCount: registeredCount,
        activePlugins: pluginRegistry.getActivePlugins().map(p => p.id),
        securityEnabled: this.securityInitialized,
        securityLevel: this.securityLevel
      });
      
      this.loading = false;
      return true;
    } catch (error) {
      console.error('Error al inicializar el sistema de plugins:', error);
      this.error = error.message || 'Error desconocido al inicializar plugins';
      this.loading = false;
      this.initialized = false;
      
      this._publishEvent('error', { error: this.error });
      return false;
    }
  }

  /**
   * Registra los plugins en el sistema
   */
  _registerPlugins(plugins) {
    let count = 0;
    for (const plugin of plugins) {
      if (pluginRegistry.registerPlugin(plugin)) count++;
    }
    return count;
  }

  /**
   * Inicializa el sistema de seguridad para plugins
   */
  async _initializeSecuritySystem() {
    try {
      console.log('Inicializando sistema de seguridad para plugins...');
      
      const securitySettings = await this._loadSecuritySettings();
      this.securityLevel = securitySettings?.securityLevel || this.securityLevel;
      
      // Inicializar subsistemas con el nivel de seguridad configurado
      const securityConfig = { securityLevel: this.securityLevel };
      pluginSecurityManager.initialize(securityConfig);
      pluginSandbox.initialize(this.securityLevel);
      pluginResourceMonitor.initialize(this.securityLevel);
      pluginPermissionChecker.initialize(this.securityLevel);
      pluginSecurityAudit.initialize(this.securityLevel);
      
      // Suscribirse a eventos de desactivación de seguridad
      eventBus.subscribe('pluginSystem.securityDeactivateRequest', async (data) => {
        if (data?.pluginId) {
          console.warn(`Solicitud de desactivación de seguridad: ${data.pluginId} - ${data.reason}`);
          await this.deactivatePlugin(data.pluginId, true);
          pluginSecurityAudit.recordPluginDeactivation(data.pluginId, {
            reason: data.reason,
            timestamp: Date.now(),
            source: 'security'
          });
        }
      });
      
      this.securityInitialized = true;
      console.log(`Sistema de seguridad inicializado (nivel: ${this.securityLevel})`);
      return true;
    } catch (error) {
      console.error('Error al inicializar sistema de seguridad:', error);
      return false;
    }
  }

  /**
   * Carga la configuración de seguridad desde el almacenamiento
   */
  async _loadSecuritySettings() {
    try {
      return await storageService.get(PLUGIN_SECURITY_SETTINGS_KEY, {
        securityLevel: PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL,
        activeChecks: ['resourceUsage', 'apiAccess', 'storageUsage', 'domManipulation']
      });
    } catch (error) {
      console.error('Error al cargar configuración de seguridad:', error);
      return {
        securityLevel: PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL,
        activeChecks: ['resourceUsage', 'apiAccess', 'storageUsage', 'domManipulation']
      };
    }
  }

  /**
   * Guarda la configuración de seguridad en el almacenamiento
   */
  async _saveSecuritySettings(settings = {}) {
    try {
      const currentSettings = await this._loadSecuritySettings();
      await storageService.set(PLUGIN_SECURITY_SETTINGS_KEY, {
        ...currentSettings,
        ...settings,
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error('Error al guardar configuración de seguridad:', error);
    }
  }

  /**
   * Carga los estados de los plugins desde el almacenamiento
   */
  async _loadPluginStates() {
    try {
      const pluginStates = await storageService.get(PLUGIN_STATE_KEY, {});
      pluginRegistry.setPluginStates(pluginStates);
      return true;
    } catch (error) {
      console.error('Error al cargar estados de plugins:', error);
      return false;
    }
  }

  /**
   * Guarda los estados de los plugins en el almacenamiento
   */
  async _savePluginStates() {
    try {
      const pluginStates = pluginRegistry.getPluginStates();
      await storageService.set(PLUGIN_STATE_KEY, pluginStates);
      return true;
    } catch (error) {
      console.error('Error al guardar estados de plugins:', error);
      return false;
    }
  }

  /**
   * Activa plugins según su estado previo
   */
  async _activatePluginsFromState() {
    if (!this.initialized) return false;
    
    try {
      const pluginStates = pluginRegistry.getPluginStates();
      const allPlugins = pluginRegistry.getAllPlugins();
      const sortedPluginIds = pluginDependencyResolver.calculateLoadOrder();
      
      // Mapeo de ID a objeto plugin
      const pluginsMap = {};
      allPlugins.forEach(plugin => {
        if (plugin?.id) pluginsMap[plugin.id] = plugin;
      });
      
      // Activar plugins en orden de dependencias
      let activatedCount = 0;
      for (const pluginId of sortedPluginIds) {
        const state = pluginStates[pluginId];
        
        if (state?.active && pluginsMap[pluginId]) {
          // Verificar compatibilidad y lista negra
          const compatResult = this._compatibilityResults[pluginId];
          const isBlacklisted = this.securityInitialized && 
                               pluginSecurityManager.isPluginBlacklisted(pluginId);
          
          if (compatResult?.compatible === false) {
            console.warn(`Plugin ${pluginId} no se activará: ${compatResult.reason}`);
            continue;
          }
          
          if (isBlacklisted) {
            console.warn(`Plugin ${pluginId} no se activará: está en lista negra`);
            continue;
          }
          
          if (await this.activatePlugin(pluginId)) activatedCount++;
        }
      }
      
      console.log(`${activatedCount} plugins activados automáticamente`);
      return true;
    } catch (error) {
      console.error('Error al activar plugins desde estado previo:', error);
      return false;
    }
  }

  /**
   * Verifica la compatibilidad de todos los plugins
   */
  async _verifyPluginCompatibility() {
    try {
      this._compatibilityResults = {};
      const allPlugins = pluginRegistry.getAllPlugins();
      
      for (const plugin of allPlugins) {
        try {
          const result = pluginCompatibility.runFullCompatibilityCheck(plugin);
          this._compatibilityResults[plugin.id] = result;
          
          // Actualizar estado en el registro
          pluginRegistry.setPluginState(plugin.id, { 
            compatible: result.compatible,
            incompatibilityReason: result.compatible ? null : result.reason,
            lastCompatibilityCheck: Date.now()
          });
          
          if (!result.compatible) {
            console.warn(`Plugin ${plugin.id} incompatible: ${result.reason}`);
          }
        } catch (error) {
          console.error(`Error al verificar compatibilidad: ${plugin.id}`, error);
          this._compatibilityResults[plugin.id] = {
            compatible: false,
            reason: `Error en verificación: ${error.message}`
          };
        }
      }
      
      // Resolver dependencias y calcular orden de carga
      pluginDependencyResolver.calculateLoadOrder();
      
      return true;
    } catch (error) {
      console.error('Error al verificar compatibilidad de plugins:', error);
      return false;
    }
  }

  /**
   * Publica un evento en el sistema
   */
  _publishEvent(eventName, data = {}) {
    // Publicar en el bus de eventos
    eventBus.publish(`pluginSystem.${eventName}`, data);
    
    // Notificar a los suscriptores directos
    if (this._subscribers[eventName]) {
      Object.values(this._subscribers[eventName]).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en suscriptor a evento ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Activa un plugin y sus dependencias
   */
  async activatePlugin(pluginId) {
    if (!this.initialized) {
      console.error('El gestor de plugins no está inicializado');
      return false;
    }
    
    // Evitar ciclos infinitos en activación de dependencias
    if (this._activatingPlugins.has(pluginId)) {
      console.warn(`Ciclo detectado en activación de ${pluginId}`);
      return false;
    }
    
    try {
      this._activatingPlugins.add(pluginId);
      
      // Validaciones preliminares
      const compatResult = this._compatibilityResults[pluginId];
      const isBlacklisted = this.securityInitialized && 
                          pluginSecurityManager.isPluginBlacklisted(pluginId);
      
      if (compatResult?.compatible === false) {
        this._publishEvent('compatibilityError', {
          pluginId,
          reason: compatResult.reason,
          details: compatResult
        });
        this._activatingPlugins.delete(pluginId);
        return false;
      }
      
      if (isBlacklisted) {
        this._publishEvent('securityViolation', {
          pluginId,
          reason: 'Intento de activar plugin en lista negra',
          severity: 'high'
        });
        this._activatingPlugins.delete(pluginId);
        return false;
      }
      
      // Buscar o cargar el plugin
      let plugin = pluginRegistry.getPlugin(pluginId);
      if (!plugin) {
        plugin = await this._loadAndRegisterPlugin(pluginId);
        if (!plugin) {
          this._activatingPlugins.delete(pluginId);
          return false;
        }
      }
      
      // Si ya está activo, no hacer nada
      if (pluginRegistry.isPluginActive(pluginId)) {
        this._activatingPlugins.delete(pluginId);
        return true;
      }
      
      // Validación de seguridad y permisos
      if (this.securityInitialized) {
        const securityValidation = pluginSecurityManager.validatePlugin(pluginId);
        if (!securityValidation.valid) {
          this._publishEvent('securityViolation', {
            pluginId,
            reason: 'Validación de seguridad fallida',
            details: securityValidation,
            severity: 'medium'
          });
          this._activatingPlugins.delete(pluginId);
          return false;
        }
        
        // Validar permisos en nivel alto de seguridad
        if (plugin.permissions && 
            this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH) {
          const permValidation = pluginPermissionChecker.validatePermissions(
            pluginId, plugin.permissions
          );
          
          if (permValidation.pendingPermissions.length > 0) {
            this._publishEvent('permissionDenied', {
              pluginId,
              permissions: permValidation.pendingPermissions,
              reason: 'Nivel de seguridad alto no permite aprobación manual'
            });
            this._activatingPlugins.delete(pluginId);
            return false;
          }
        }
      }
      
      // Activar dependencias primero
      await this._activateDependencies(plugin);
      
      // Activar el plugin usando el método adecuado según seguridad
      let activated = false;
      try {
        if (this.securityInitialized) {
          const finishOperation = pluginResourceMonitor.trackOperation(pluginId, 'activation');
          activated = await pluginSandbox.executeSandboxed(
            pluginId,
            () => pluginRegistry.activatePlugin(pluginId, coreAPI),
            [],
            null
          );
          finishOperation();
        } else {
          activated = pluginRegistry.activatePlugin(pluginId, coreAPI);
        }
      } catch (activationError) {
        console.error(`Error durante la activación: ${pluginId}`, activationError);
        if (this.securityInitialized) {
          pluginSecurityAudit.recordPluginDeactivation(pluginId, {
            action: 'activation_failed',
            error: activationError.message,
            timestamp: Date.now()
          });
        }
        this._activatingPlugins.delete(pluginId);
        return false;
      }
      
      if (activated) {
        // Registrar API y actualizar estado
        if (plugin.publicAPI) {
          pluginAPIRegistry.registerAPI(pluginId, plugin.publicAPI);
        }
        
        pluginRegistry.setPluginState(pluginId, { 
          active: true, 
          lastActivated: Date.now() 
        });
        await this._savePluginStates();
        
        this._publishEvent('pluginActivated', { pluginId, plugin });
        
        if (this.securityInitialized) {
          pluginSecurityAudit.recordValidationResult(pluginId, {
            event: 'activation',
            success: true,
            timestamp: Date.now()
          });
        }
      }
      
      this._activatingPlugins.delete(pluginId);
      return activated;
    } catch (error) {
      console.error(`Error al activar plugin [${pluginId}]:`, error);
      this._activatingPlugins.delete(pluginId);
      this._publishEvent('error', { 
        pluginId, 
        operation: 'activate',
        error: error.message || 'Error desconocido'
      });
      return false;
    }
  }

  /**
   * Carga y registra un plugin por su ID
   */
  async _loadAndRegisterPlugin(pluginId) {
    try {
      const plugin = await loadPluginById(pluginId);
      if (!plugin) {
        console.error(`No se pudo cargar el plugin: ${pluginId}`);
        return null;
      }
      
      // Validar compatibilidad
      const validation = validatePluginCompatibility(plugin);
      if (!validation.valid) {
        this._publishEvent('compatibilityError', {
          pluginId,
          reason: validation.reason,
          details: validation.details
        });
        return null;
      }
      
      // Registrar el plugin
      if (!pluginRegistry.registerPlugin(plugin)) {
        console.error(`No se pudo registrar el plugin: ${pluginId}`);
        return null;
      }
      
      return plugin;
    } catch (error) {
      console.error(`Error al cargar plugin ${pluginId}:`, error);
      return null;
    }
  }

  /**
   * Activa las dependencias de un plugin
   */
  async _activateDependencies(plugin) {
    const dependencies = plugin.dependencies || [];
    if (dependencies.length === 0) return true;
    
    for (const dependency of dependencies) {
      const depId = typeof dependency === 'string' ? dependency : dependency.id;
      if (!depId) continue;
      
      // Verificar si la dependencia existe
      const depPlugin = pluginRegistry.getPlugin(depId);
      if (!depPlugin) {
        this._publishEvent('dependencyError', {
          pluginId: plugin.id,
          dependencyId: depId,
          reason: 'Dependencia no encontrada'
        });
        return false;
      }
      
      // Activar la dependencia si no está activa
      if (!pluginRegistry.isPluginActive(depId)) {
        console.log(`Activando dependencia ${depId} para el plugin ${plugin.id}`);
        const depActivated = await this.activatePlugin(depId);
        
        if (!depActivated) {
          this._publishEvent('dependencyError', {
            pluginId: plugin.id,
            dependencyId: depId,
            reason: 'No se pudo activar la dependencia'
          });
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Desactiva un plugin
   */
  async deactivatePlugin(pluginId, force = false) {
    if (!this.initialized || !pluginRegistry.isPluginActive(pluginId)) {
      return !pluginRegistry.isPluginActive(pluginId);
    }
    
    try {
      // Obtener plugin antes de desactivarlo
      const plugin = pluginRegistry.getPlugin(pluginId);
      
      // Verificar que ningún plugin activo dependa de este
      if (!force) {
        const dependentPlugins = pluginDependencyResolver.getDependentPlugins(pluginId)
          .filter(depId => pluginRegistry.isPluginActive(depId));
        
        if (dependentPlugins.length > 0) {
          this._publishEvent('dependencyError', {
            pluginId,
            dependent: dependentPlugins,
            reason: 'Otros plugins activos dependen de este'
          });
          return false;
        }
      }
      
      // Limpiar registros
      pluginAPIRegistry.unregisterAPI(pluginId);
      pluginCommunication.clearPluginResources(pluginId);
      
      // Desactivar el plugin con manejo de timeout
      let deactivated = false;
      try {
        if (this.securityInitialized) {
          const finishOperation = pluginResourceMonitor.trackOperation(pluginId, 'deactivation');
          
          // Timeout para evitar bloqueos
          const cleanupPromise = pluginSandbox.executeSandboxed(
            pluginId,
            () => pluginRegistry.deactivatePlugin(pluginId),
            [],
            null
          );
          
          const timeoutPromise = new Promise(resolve => {
            setTimeout(() => resolve(false), 5000);
          });
          
          deactivated = await Promise.race([cleanupPromise, timeoutPromise]);
          
          // Forzar desactivación si hay timeout
          if (!deactivated) {
            console.warn(`Timeout en desactivación de ${pluginId}, forzando...`);
            deactivated = pluginRegistry.deactivatePlugin(pluginId);
          }
          
          finishOperation();
        } else {
          deactivated = pluginRegistry.deactivatePlugin(pluginId);
        }
      } catch (error) {
        console.error(`Error durante desactivación de ${pluginId}:`, error);
        if (force) {
          deactivated = pluginRegistry.deactivatePlugin(pluginId);
        } else {
          return false;
        }
      }
      
      if (deactivated) {
        // Limpiar recursos y actualizar estado
        await coreAPI.cleanupPluginResources(pluginId);
        
        if (this.securityInitialized) {
          pluginResourceMonitor.decreaseMonitoring(pluginId);
          pluginResourceMonitor.removeRestrictions(pluginId);
        }
        
        pluginRegistry.setPluginState(pluginId, { 
          active: false, 
          lastDeactivated: Date.now() 
        });
        await this._savePluginStates();
        
        this._publishEvent('pluginDeactivated', { pluginId, plugin });
        
        if (this.securityInitialized) {
          pluginSecurityAudit.recordPluginDeactivation(pluginId, {
            forced: force,
            reason: force ? 'Desactivación forzada' : 'Desactivación normal',
            timestamp: Date.now()
          });
        }
      }
      
      return deactivated;
    } catch (error) {
      console.error(`Error al desactivar plugin [${pluginId}]:`, error);
      this._publishEvent('error', { 
        pluginId, 
        operation: 'deactivate',
        error: error.message
      });
      
      // En caso de forzado, intentar una última vez
      if (force) {
        try {
          return pluginRegistry.deactivatePlugin(pluginId);
        } catch (forceError) {
          console.error(`Error al forzar desactivación: ${pluginId}`, forceError);
          return false;
        }
      }
      
      return false;
    }
  }

  /**
   * Recupera todos los plugins registrados
   */
  getAllPlugins() {
    if (!this.initialized) return [];
    
    const plugins = pluginRegistry.getAllPlugins();
    
    return plugins.map(plugin => {
      const pluginInfo = {
        ...plugin,
        compatible: this._compatibilityResults[plugin.id]?.compatible !== false,
        incompatibilityReason: this._compatibilityResults[plugin.id]?.compatible === false ? 
          this._compatibilityResults[plugin.id].reason : null
      };
      
      // Añadir información de seguridad si está disponible
      if (this.securityInitialized) {
        const securityInfo = pluginSecurityManager.getPluginSecurityInfo(plugin.id);
        Object.assign(pluginInfo, {
          securityScore: securityInfo.securityScore,
          blacklisted: securityInfo.blacklisted,
          securityWarnings: securityInfo.warnings.length,
          permissions: pluginPermissionChecker.getPluginPermissions(plugin.id)
        });
      }
      
      return pluginInfo;
    });
  }

  /**
   * Recupera plugins activos
   */
  getActivePlugins() {
    return this.initialized ? pluginRegistry.getActivePlugins() : [];
  }

  /**
   * Verifica si un plugin está activo
   */
  isPluginActive(pluginId) {
    return this.initialized ? pluginRegistry.isPluginActive(pluginId) : false;
  }

  /**
   * Verifica si un plugin es compatible
   */
  isPluginCompatible(pluginId) {
    return !this._compatibilityResults[pluginId] || 
           this._compatibilityResults[pluginId].compatible !== false;
  }

  /**
   * Suscribe a eventos del sistema de plugins
   */
  subscribe(eventName, callback) {
    if (typeof callback !== 'function') return () => {};
    
    const id = ++this._lastSubscriberId;
    
    if (!this._subscribers[eventName]) {
      this._subscribers[eventName] = {};
    }
    
    this._subscribers[eventName][id] = callback;
    
    return () => {
      if (this._subscribers[eventName]?.[id]) {
        delete this._subscribers[eventName][id];
        if (Object.keys(this._subscribers[eventName]).length === 0) {
          delete this._subscribers[eventName];
        }
      }
    };
  }

  /**
   * Recarga todos los plugins
   */
  async reloadPlugins(preserveState = true) {
    if (!this.initialized) return false;
    
    try {
      // Guardar estado actual
      const activePluginIds = preserveState ? 
        pluginRegistry.getActivePlugins().map(p => p.id) : [];
      
      // Desactivar todos los plugins
      for (const pluginId of activePluginIds) {
        await this.deactivatePlugin(pluginId);
      }
      
      // Limpiar y recargar
      pluginRegistry.clear();
      this._compatibilityResults = {};
      pluginAPIRegistry.clearAll();
      
      // Cargar nuevos plugins
      const plugins = await loadPlugins();
      const registeredCount = this._registerPlugins(plugins);
      await this._verifyPluginCompatibility();
      await this._loadPluginStates();
      
      console.log(`Plugins recargados: ${registeredCount} registrados`);
      
      // Reactivar plugins previos
      if (preserveState) {
        const loadOrder = pluginDependencyResolver.calculateLoadOrder();
        const sortedActiveIds = loadOrder.filter(id => activePluginIds.includes(id));
        
        let reactivated = 0;
        for (const pluginId of sortedActiveIds) {
          if (this.securityInitialized && pluginSecurityManager.isPluginBlacklisted(pluginId)) {
            console.warn(`Plugin ${pluginId} no se reactivará (lista negra)`);
            continue;
          }
          
          if (this.isPluginCompatible(pluginId) && await this.activatePlugin(pluginId)) {
            reactivated++;
          }
        }
        
        console.log(`${reactivated}/${sortedActiveIds.length} plugins reactivados`);
      }
      
      this._publishEvent('pluginsReloaded', { 
        count: registeredCount,
        reactivated: preserveState ? activePluginIds : []
      });
      
      return true;
    } catch (error) {
      console.error('Error al recargar plugins:', error);
      this._publishEvent('error', { 
        operation: 'reload',
        error: error.message
      });
      return false;
    }
  }

  /**
   * Obtiene estado general del sistema de plugins
   */
  getStatus() {
    if (!this.initialized) {
      return {
        initialized: false,
        loading: this.loading,
        error: this.error,
        totalPlugins: 0
      };
    }
    
    const allPlugins = pluginRegistry.getAllPlugins();
    const activePlugins = pluginRegistry.getActivePlugins();
    
    const status = {
      initialized: true,
      loading: this.loading,
      error: this.error,
      totalPlugins: allPlugins.length,
      activePlugins: activePlugins.length,
      compatiblePlugins: allPlugins.filter(p => 
        this._compatibilityResults[p.id]?.compatible !== false
      ).length,
      incompatiblePlugins: allPlugins.filter(p => 
        this._compatibilityResults[p.id]?.compatible === false
      ).length,
      states: pluginRegistry.getPluginStates(),
      cycles: pluginDependencyResolver.getDetectedCycles(),
      apiCount: Object.keys(pluginAPIRegistry.getAPIInfo()).length,
      activeChannels: Object.keys(pluginCommunication.getChannelsInfo()).length
    };
    
    // Añadir info de seguridad si está disponible
    if (this.securityInitialized) {
      const securityStats = pluginSecurityManager.getSecurityStats();
      Object.assign(status, {
        securityEnabled: true,
        securityLevel: this.securityLevel,
        blacklistedPlugins: securityStats.blacklistedPlugins,
        pluginsWithWarnings: securityStats.pluginsWithWarnings,
        detectedThreats: securityStats.detectedThreats.total,
        resourceStats: pluginResourceMonitor.getResourceStats(),
        permissionStats: pluginPermissionChecker.getPermissionStats()
      });
    } else {
      status.securityEnabled = false;
    }
    
    return status;
  }

  /**
   * Configura el nivel de seguridad
   */
  setSecurityLevel(level) {
    if (!this.securityInitialized || 
        !PLUGIN_CONSTANTS.SECURITY.LEVEL[level?.toUpperCase()]) {
      return false;
    }
    
    try {
      const newLevel = PLUGIN_CONSTANTS.SECURITY.LEVEL[level.toUpperCase()];
      
      // Actualizar en todos los subsistemas
      const securitySystems = [
        pluginSecurityManager,
        pluginSandbox,
        pluginResourceMonitor,
        pluginPermissionChecker,
        pluginSecurityAudit
      ];
      
      securitySystems.forEach(system => system.setSecurityLevel(newLevel));
      
      this.securityLevel = newLevel;
      this._saveSecuritySettings({ securityLevel: newLevel });
      
      this._publishEvent('securityLevelChanged', {
        level: newLevel,
        previousLevel: this.securityLevel
      });
      
      return true;
    } catch (error) {
      console.error(`Error al cambiar nivel de seguridad a ${level}:`, error);
      return false;
    }
  }

  /**
   * Aprueba permisos para un plugin
   */
  async approvePluginPermissions(pluginId, permissions) {
    if (!pluginId || !Array.isArray(permissions) || permissions.length === 0) {
      return false;
    }
    
    try {
      // Obtener información actual de permisos
      const permissionsInfo = pluginPermissionChecker.getPluginPermissions(pluginId);
      
      // Aprobar permisos
      const success = pluginPermissionChecker.approvePermissions(pluginId, permissions);
      
      if (success) {
        // Actualizar estado y guardar
        pluginRegistry.setPluginState(pluginId, {
          permissionsApproved: [...(permissionsInfo.approved || []), ...permissions],
          permissionsPending: (permissionsInfo.pending || [])
            .filter(p => !permissions.includes(p))
        });
        
        await this._savePluginStates();
        
        eventBus.publish('pluginSystem.permissionsApproved', {
          pluginId,
          permissions
        });
      }
      
      return success;
    } catch (error) {
      console.error(`Error al aprobar permisos para ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Métodos adicionales condensados
   */
  
  // Método para poner un plugin en lista negra
  async blacklistPlugin(pluginId, reason) {
    if (!this.securityInitialized) return false;
    
    try {
      // Desactivar primero si está activo
      if (pluginRegistry.isPluginActive(pluginId)) {
        await this.deactivatePlugin(pluginId, true);
      }
      
      // Añadir a lista negra
      const result = pluginSecurityManager.blacklistPlugin(pluginId);
      
      if (result) {
        pluginSecurityAudit.recordBlacklistAction(pluginId, {
          action: 'add',
          reason,
          timestamp: Date.now()
        });
        
        this._publishEvent('pluginBlacklisted', { pluginId, reason });
      }
      
      return result;
    } catch (error) {
      console.error(`Error al añadir ${pluginId} a lista negra:`, error);
      return false;
    }
  }
  
  // Obtener información de seguridad de un plugin
  getPluginSecurityInfo(pluginId) {
    if (!this.securityInitialized) {
      return { securityEnabled: false };
    }
    
    try {
      const securityInfo = pluginSecurityManager.getPluginSecurityInfo(pluginId);
      const additionalInfo = {
        resourceUsage: pluginResourceMonitor.getPluginResourceUsage(pluginId),
        permissions: pluginPermissionChecker.getPluginPermissions(pluginId),
        auditHistory: pluginSecurityAudit.getPluginAuditHistory(pluginId).slice(0, 20),
        sandboxErrors: pluginSandbox.getSandboxErrors(pluginId),
        securityLevel: this.securityLevel
      };
      
      return { securityEnabled: true, ...securityInfo, ...additionalInfo };
    } catch (error) {
      console.error(`Error al obtener info de seguridad para ${pluginId}:`, error);
      return { securityEnabled: true, error: error.message, securityLevel: this.securityLevel };
    }
  }
  
  // Métodos adicionales implementados de manera similar...
}

// Exportar instancia única
const pluginManager = new PluginManager();
export default pluginManager;