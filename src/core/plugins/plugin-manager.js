// src\core\plugins\plugin-manager.js

/**
 * Gestor de plugins para Atlas - Versión optimizada y corregida
 */
import { loadPlugins, loadPluginById, validatePluginCompatibility } from './plugin-loader';
import pluginRegistry from './plugin-registry';
import coreAPI from './core-api';
import storageService from '../../services/storage-service';
import { PLUGIN_CONSTANTS, STORAGE_KEYS } from '../config/constants';
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

const PLUGIN_STATE_KEY = 'atlas_plugin_states';

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
    this.activeSecurityChecks = new Set();
  }

  async initialize(services = {}, options = {}) {
    if (this.initialized && !options.forceReload) {
      // console.warn('[PM] El gestor de plugins ya está inicializado');
      return true;
    }
    
    this.loading = true;
    this.error = null;
    this.initialized = false; 
    this.securityInitialized = false; // Resetear en cada intento de inicialización
    this._compatibilityResults = {};
    
    try {
      coreAPI.init(services);
      
      if (options.enableSecurity !== false) {
        // _initializeSecuritySystem devolverá false si falla, lo que debería ser un error de inicialización
        if (!await this._initializeSecuritySystem(options)) {
            throw new Error('Falló la inicialización del sistema de seguridad.');
        }
      } else {
        this.securityInitialized = false; // Explícitamente no inicializado
        this.securityLevel = options.securityLevel || this.securityLevel;
        this._configureSecurityChecksByLevel(this.securityLevel); 
      }
      
      // Estas funciones ahora lanzarán errores si fallan críticamente
      await this._loadPluginStates(); 
      const plugins = await loadPlugins();
      
      const registeredCount = this._registerPlugins(plugins);
      
      await this._verifyPluginCompatibility();
      
      this.initialized = true; // Marcamos como inicializado ANTES de activar desde estado
                              // porque activatePlugin chequea this.initialized
      
      await this._activatePluginsFromState();
      
      this._publishEvent('initialized', { 
        pluginsCount: registeredCount,
        activePlugins: pluginRegistry.getActivePlugins().map(p => p.id),
        securityEnabled: this.securityInitialized,
        securityLevel: this.securityLevel
      });
      
      this.loading = false;
      return true;
    } catch (error) {
      console.error('[PM] Error al inicializar el sistema de plugins:', error);
      this.error = error.message || 'Error desconocido al inicializar plugins';
      this.loading = false;
      this.initialized = false; // Asegurar que initialized es false en error
      this.securityInitialized = false; // También resetear esto
      
      this._publishEvent('error', { error: this.error });
      return false;
    }
  }

  _registerPlugins(plugins) {
    let count = 0;
    if (plugins && Array.isArray(plugins)) {
        for (const plugin of plugins) {
            if (plugin && plugin.id) {
                if (pluginRegistry.registerPlugin(plugin)) count++;
            } else {
                // console.warn('[PM] _registerPlugins: Se intentó registrar un plugin inválido o sin ID.', plugin);
            }
        }
    }
    return count;
  }
  
  async _initializeSecuritySystem(options = {}) {
    try {
      const securitySettingsFromStorage = await this._loadSecuritySettings(); // Ahora puede lanzar error
      const determinedSecurityLevel = options.securityLevel || 
                                    securitySettingsFromStorage?.securityLevel || 
                                    this.securityLevel; 
      
      this.securityLevel = determinedSecurityLevel;
      this._configureSecurityChecksByLevel(this.securityLevel);

      const securityConfig = { securityLevel: this.securityLevel };
      
      pluginSecurityManager.initialize(securityConfig);
      pluginSandbox.initialize(this.securityLevel);
      pluginResourceMonitor.initialize(this.securityLevel);
      pluginPermissionChecker.initialize(this.securityLevel);
      pluginSecurityAudit.initialize(this.securityLevel);
      
      eventBus.subscribe('pluginSystem.securityDeactivateRequest', async (data) => {
        if (data?.pluginId) {
          await this.deactivatePlugin(data.pluginId, true);
          pluginSecurityAudit.recordPluginDeactivation(data.pluginId, {
            reason: data.reason, timestamp: Date.now(), source: 'security'
          });
        }
      });
      
      this.securityInitialized = true;
      return true;
    } catch (error) {
      console.error('[PM] Error al inicializar sistema de seguridad:', error);
      this.securityInitialized = false;
      // Devolver false para que initialize() sepa que falló
      return false; 
    }
  }

  async rejectPluginPermissions(pluginId, permissions) {
    if (!pluginId || !Array.isArray(permissions) || permissions.length === 0) {
        console.error('[PM] Argumentos inválidos para rejectPluginPermissions', { pluginId, permissions });
        return false;
    }
    if (!this.initialized) {
        // console.warn("[PM] PluginManager no inicializado. No se pueden rechazar permisos.");
        return false;
    }
    if (!this.securityInitialized) {
        // console.warn("[PM] Sistema de seguridad no inicializado. No se pueden rechazar permisos.");
        return false;
    }

    try {
        const success = pluginPermissionChecker.rejectPermissions(pluginId, permissions);
        if (success) {
            eventBus.publish('pluginSystem.permissionsRejectedByManager', { pluginId, permissions });
            // console.log(`[PM] Permisos ${permissions.join(', ')} rechazados para ${pluginId}`);
        } else {
            // console.warn(`[PM] Falló el rechazo de permisos para ${pluginId} desde el permissionChecker.`);
        }
        return success;
    } catch (error) {
        console.error(`[PM] Error al rechazar permisos para ${pluginId}:`, error);
        this._publishEvent('error', { pluginId, operation: 'rejectPermissions', error: error.message });
        return false;
    }
  }

  async _loadSecuritySettings() {
    try {
      const settings = await storageService.get(STORAGE_KEYS.PLUGIN_SECURITY_SETTINGS_KEY, {
        securityLevel: PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL,
        activeChecks: ['resourceUsage', 'apiAccess', 'storageUsage', 'domManipulation']
      });
      return settings;
    } catch (error) {
      console.error('[PM] Error al cargar configuración de seguridad:', error);
      // Lanzar error para que _initializeSecuritySystem lo maneje y devuelva false
      throw new Error(`Error al cargar configuración de seguridad: ${error.message}`);
    }
  }

  async _saveSecuritySettings(settings = {}) {
    try {
      const currentSettings = await this._loadSecuritySettings(); // Podría fallar aquí si _loadSecuritySettings lanza error
      const newSettings = { ...currentSettings, ...settings, lastUpdated: Date.now() };
      await storageService.set(STORAGE_KEYS.PLUGIN_SECURITY_SETTINGS_KEY, newSettings);
    } catch (error) {
      console.error('[PM] Error al guardar configuración de seguridad:', error);
      // No relanzar aquí para no romper setSecurityLevel si solo el guardado falla,
      // pero setSecurityLevel debería manejar que _saveSecuritySettings pueda fallar.
      // O, si es crítico, relanzar. Por ahora, solo log.
    }
  }

  async _loadPluginStates() {
    try {
      const pluginStatesFromStorage = await storageService.get(PLUGIN_STATE_KEY, {});
      pluginRegistry.setPluginStates(pluginStatesFromStorage);
      // No devolvemos true aquí, si falla, el catch lanzará el error
    } catch (error) {
      console.error('[PM] Error al cargar estados de plugins:', error);
      // Lanzar error para que initialize() lo capture
      throw new Error(`Error al cargar estados de plugins: ${error.message}`);
    }
  }

  async _savePluginStates() {
    try {
      const pluginStates = pluginRegistry.getPluginStates();
      await storageService.set(PLUGIN_STATE_KEY, pluginStates);
      return true; // Indicar éxito
    } catch (error) {
      console.error('[PM] Error al guardar estados de plugins:', error);
      return false; // Indicar fallo
    }
  }

  async _activatePluginsFromState() {
    try {
      const pluginStates = pluginRegistry.getPluginStates();
      const allPlugins = pluginRegistry.getAllPlugins(); 
      const sortedPluginIds = pluginDependencyResolver.calculateLoadOrder(); 

      const pluginsMap = {};
      allPlugins.forEach(plugin => {
        if (plugin?.id) pluginsMap[plugin.id] = plugin;
      });
      
      // let activatedCount = 0; // No usado
      for (const pluginId of sortedPluginIds) {
        const state = pluginStates[pluginId];
        
        if (state?.active && pluginsMap[pluginId]) {
          const compatResult = this._compatibilityResults[pluginId];
          const isBlacklisted = this.securityInitialized && 
                               pluginSecurityManager.isPluginBlacklisted(pluginId);
          
          if (!compatResult || compatResult?.compatible === false) {
            // console.warn(`[PM] Plugin ${pluginId} no se activará (desde APS): Incompatible. Razón: ${compatResult?.reason}`);
            continue;
          }
          if (isBlacklisted) {
            // console.warn(`[PM] Plugin ${pluginId} no se activará (desde APS): está en lista negra`);
            continue;
          }
          
          // No es necesario contar, activatePlugin ya emite eventos y maneja su estado
          await this.activatePlugin(pluginId); // activatePlugin maneja sus propios errores y devuelve booleano
        }
      }
      // No devolvemos true aquí, si falla una activación, activatePlugin ya lo habrá manejado.
      // Si ocurre un error inesperado en este bucle, el catch lo tomará.
    } catch (error) {
      console.error('[PM] Error al activar plugins desde estado previo:', error);
      // Lanzar para que initialize() lo capture
      throw new Error(`Error al activar plugins desde estado previo: ${error.message}`);
    }
  }

  async _verifyPluginCompatibility() {
    try {
      this._compatibilityResults = {};
      const allPlugins = pluginRegistry.getAllPlugins();
      
      for (const plugin of allPlugins) {
        if (!plugin || !plugin.id) {
            continue;
        }
        try {
          const result = pluginCompatibility.runFullCompatibilityCheck(plugin);
          this._compatibilityResults[plugin.id] = result;
          pluginRegistry.setPluginState(plugin.id, { 
            compatible: result.compatible,
            incompatibilityReason: result.compatible ? null : result.reason,
            lastCompatibilityCheck: Date.now()
          });
          // if (!result.compatible) {
          //   console.warn(`[PM] Plugin ${plugin.id} incompatible: ${result.reason}`);
          // }
        } catch (error) {
          console.error(`[PM] Error al verificar compatibilidad para ${plugin.id}:`, error);
          this._compatibilityResults[plugin.id] = { compatible: false, reason: `Error en verificación: ${error.message}` };
          // Considerar si este error individual debe detener toda la verificación o la inicialización
        }
      }
      // No devolvemos true, si hay un error grave en el bucle, el catch exterior lo toma.
    } catch (error) {
      console.error('[PM] Error general en _verifyPluginCompatibility:', error);
      // Lanzar para que initialize() lo capture
      throw new Error(`Error general en _verifyPluginCompatibility: ${error.message}`);
    }
  }

  _publishEvent(eventName, data = {}) {
    eventBus.publish(`pluginSystem.${eventName}`, data);
    if (this._subscribers[eventName]) {
      Object.values(this._subscribers[eventName]).forEach(callback => {
        try { callback(data); } catch (e) { console.error(`Error en suscriptor a ${eventName}:`, e); }
      });
    }
  }

  async activatePlugin(pluginId) {
    if (!this.initialized) {
      // console.error(`[PM] El gestor de plugins no está inicializado, no se puede activar plugin: ${pluginId}`);
      return false;
    }
    if (this._activatingPlugins.has(pluginId)) {
      return true; 
    }
    
    this._activatingPlugins.add(pluginId);
    
    try {
      let plugin = pluginRegistry.getPlugin(pluginId);
      if (!plugin) {
        plugin = await this._loadAndRegisterPlugin(pluginId);
        if (!plugin) {
          // console.error(`[PM] Plugin ${pluginId} no encontrado o no se pudo cargar/registrar para activación.`);
          this._activatingPlugins.delete(pluginId);
          return false;
        }
      }
      
      if (pluginRegistry.isPluginActive(pluginId)) {
        this._activatingPlugins.delete(pluginId);
        return true;
      }

      let compatResult = this._compatibilityResults[pluginId];
      if (!compatResult && plugin) {
          compatResult = pluginCompatibility.runFullCompatibilityCheck(plugin);
          this._compatibilityResults[pluginId] = compatResult;
      }

      if (!compatResult || !compatResult.compatible) {
        // console.warn(`[PM] No se puede activar ${pluginId}: Incompatible. Razón: ${compatResult?.reason}`);
        this._publishEvent('compatibilityError', { pluginId, reason: compatResult?.reason, details: compatResult });
        this._activatingPlugins.delete(pluginId);
        return false;
      }
      
      const isBlacklisted = this.securityInitialized && pluginSecurityManager.isPluginBlacklisted(pluginId);
      if (isBlacklisted) {
        // console.warn(`[PM] No se puede activar ${pluginId}: Está en lista negra.`);
        this._publishEvent('securityViolation', { pluginId, reason: 'Intento de activar plugin en lista negra', severity: 'high' });
        this._activatingPlugins.delete(pluginId);
        return false;
      }
      
      if (this.securityInitialized) {
        const securityValidation = pluginSecurityManager.validatePlugin(pluginId);
        if (!securityValidation.valid) {
          // console.warn(`[PM] No se puede activar ${pluginId}: Validación de seguridad fallida. Razón: ${securityValidation.reason}`);
          this._publishEvent('securityViolation', { pluginId, reason: 'Validación de seguridad fallida', details: securityValidation, severity: 'medium' });
          this._activatingPlugins.delete(pluginId);
          return false;
        }
        if (plugin.permissions && this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH) {
          const permValidation = pluginPermissionChecker.validatePermissions(pluginId, plugin.permissions);
          if (permValidation.pendingPermissions.length > 0) {
            // console.warn(`[PM] No se puede activar ${pluginId}: Permisos pendientes en nivel HIGH.`);
            this._publishEvent('permissionDenied', { pluginId, permissions: permValidation.pendingPermissions, reason: 'Nivel de seguridad alto no permite aprobación manual' });
            this._activatingPlugins.delete(pluginId);
            return false;
          }
        }
      }
      
      await this._activateDependencies(plugin); // Puede lanzar error, que será capturado por el catch de abajo
      
      let activated = false;
      try {
        if (this.securityInitialized) {
          const finishOperation = pluginResourceMonitor.trackOperation(pluginId, 'activation');
          activated = await pluginSandbox.executeSandboxed(pluginId, () => pluginRegistry.activatePlugin(pluginId, coreAPI), [], null);
          finishOperation();
        } else {
          activated = await pluginRegistry.activatePlugin(pluginId, coreAPI); // activatePlugin es async
        }
      } catch (activationError) { // Error específico de la ejecución de init
        console.error(`[PM] Error durante la ejecución de init de ${pluginId}:`, activationError);
        if (this.securityInitialized) {
          pluginSecurityAudit.recordPluginDeactivation(pluginId, { action: 'activation_failed', error: activationError.message, timestamp: Date.now() });
        }
        // Este error debe hacer que activatePlugin devuelva false
        this._activatingPlugins.delete(pluginId);
        return false;
      }
      
      if (activated) {
        if (plugin.publicAPI) {
          pluginAPIRegistry.registerAPI(pluginId, plugin.publicAPI);
        }
        pluginRegistry.setPluginState(pluginId, { active: true, lastActivated: Date.now() });
        await this._savePluginStates();
        this._publishEvent('pluginActivated', { pluginId, plugin });
        if (this.securityInitialized) {
          pluginSecurityAudit.recordValidationResult(pluginId, { event: 'plugin_activated', success: true, timestamp: Date.now() });
        }
      } else {
        // console.warn(`[PM] La activación de ${pluginId} (llamada a init del registro) devolvió false.`);
        // Si 'activated' es false aquí, el método debería devolver false.
        this._activatingPlugins.delete(pluginId);
        return false;
      }
      
      this._activatingPlugins.delete(pluginId);
      return true; // Solo si 'activated' fue true
    } catch (error) { // Catch para errores generales en activatePlugin (ej. de _activateDependencies)
      console.error(`[PM] Error general al activar plugin [${pluginId}]:`, error);
      this._activatingPlugins.delete(pluginId);
      this._publishEvent('error', { pluginId, operation: 'activate', error: error.message || 'Error desconocido' });
      return false;
    }
  }

  async _loadAndRegisterPlugin(pluginId) {
    try {
      let plugin = pluginRegistry.getPlugin(pluginId);
      if (plugin) {
        if (!this._compatibilityResults[pluginId]) {
            const compatResult = pluginCompatibility.runFullCompatibilityCheck(plugin);
            this._compatibilityResults[pluginId] = compatResult;
            if (!compatResult.compatible) {
                 return null;
            }
        } else if (!this._compatibilityResults[pluginId].compatible) {
            return null;
        }
        return plugin;
      }

      plugin = await loadPluginById(pluginId);
      if (!plugin) {
        return null;
      }
      
      const validationResult = validatePluginCompatibility(plugin); // Usa la importada
      this._compatibilityResults[plugin.id] = { compatible: validationResult.valid, reason: validationResult.reason, details: validationResult.details };
      
      if (!validationResult.valid) {
        this._publishEvent('compatibilityError', { pluginId, reason: validationResult.reason, details: validationResult.details });
        return null;
      }

      if (!pluginRegistry.registerPlugin(plugin)) {
        return null;
      }
      return plugin;
    } catch (error) {
      console.error(`[PM] Error en _loadAndRegisterPlugin para ${pluginId}:`, error);
      return null;
    }
  }

  async _activateDependencies(pluginDefinition) {
    if (!pluginDefinition || !pluginDefinition.dependencies || pluginDefinition.dependencies.length === 0) {
      return; // No devuelve valor explícito de éxito/fallo, se asume éxito si no lanza error
    }
    for (const dependency of pluginDefinition.dependencies) {
      const depId = typeof dependency === 'string' ? dependency : dependency.id;
      if (!depId) continue;
      
      if (pluginRegistry.isPluginActive(depId)) {
        continue;
      }
      
      const depActivated = await this.activatePlugin(depId);
      if (!depActivated) {
        const errorMsg = `Dependencia ${depId} de ${pluginDefinition.id} no pudo ser activada.`;
        // console.error(`[PM] ${errorMsg}`); // activatePlugin ya logueará el error
        this._publishEvent('dependencyError', { pluginId: pluginDefinition.id, dependencyId: depId, reason: 'No se pudo activar la dependencia' });
        throw new Error(errorMsg); // Esto será capturado por el try/catch de quien llame a _activateDependencies (activatePlugin)
      }
    }
    // No es necesario devolver true explícitamente si el éxito es la ausencia de error.
  }

  async deactivatePlugin(pluginId, force = false) {
    if (!this.initialized) {
        return true; 
    }
    if (!pluginRegistry.isPluginActive(pluginId)) {
      return true; 
    }
    
    try {
      const plugin = pluginRegistry.getPlugin(pluginId); // Mover getPlugin aquí para tenerlo disponible
      if (!plugin && pluginId) { // Si getPlugin devuelve null pero tenemos un ID
          // console.warn(`[PM] Intento de desactivar plugin ${pluginId} no encontrado en registro, pero marcado como activo? Limpiando estado.`);
          // Esto es un estado inconsistente, pero procedemos con la limpieza de estado si es posible.
      }
      
      if (!force) {
        const dependentPlugins = pluginDependencyResolver.getDependentPlugins(pluginId)
          .filter(depId => pluginRegistry.isPluginActive(depId));
        if (dependentPlugins.length > 0) {
          // console.warn(`[PM] No se puede desactivar ${pluginId}: Plugins dependientes activos: ${dependentPlugins.join(', ')}`);
          this._publishEvent('dependencyError', { pluginId, dependent: dependentPlugins, reason: 'Otros plugins activos dependen de este' });
          return false;
        }
      }
      
      pluginAPIRegistry.unregisterAPI(pluginId);
      pluginCommunication.clearPluginResources(pluginId);
      
      let registryCallSuccessful = false;
      try {
        if (this.securityInitialized) {
          const finishOperation = pluginResourceMonitor.trackOperation(pluginId, 'deactivation');
          registryCallSuccessful = await pluginSandbox.executeSandboxed(pluginId, () => pluginRegistry.deactivatePlugin(pluginId), [], null);
          finishOperation();
        } else {
          registryCallSuccessful = await pluginRegistry.deactivatePlugin(pluginId); // deactivatePlugin es async
        }
      } catch (error) {
        console.error(`[PM] Error durante la ejecución de cleanup de ${pluginId}:`, error);
        if (!force) return false; 
        // Si es forzado, continuamos a pesar del error en el cleanup del plugin.
        registryCallSuccessful = true; // Consideramos que el registro se "forzó" a desactivar
      }
      
      // Si el cleanup del plugin falló (devolvió false o lanzó error) y no forzamos, la desactivación falla.
      if (!registryCallSuccessful && !force) {
          // console.error(`[PM] Cleanup de ${pluginId} devolvió false y no se forzó la desactivación. La desactivación completa falló.`);
          return false;
      }

      await coreAPI.cleanupPluginResources(pluginId);
      if (this.securityInitialized) {
        pluginResourceMonitor.decreaseMonitoring(pluginId);
        pluginResourceMonitor.removeRestrictions(pluginId);
      }
      pluginRegistry.setPluginState(pluginId, { active: false, lastDeactivated: Date.now() });
      await this._savePluginStates(); // Esto puede devolver false, pero no afecta el resultado de deactivatePlugin
      this._publishEvent('pluginDeactivated', { pluginId, plugin }); // 'plugin' puede ser null si no se encontró
      if (this.securityInitialized) {
        pluginSecurityAudit.recordPluginDeactivation(pluginId, { forced: force, reason: force ? 'Desactivación forzada' : 'Desactivación normal', timestamp: Date.now() });
      }
      return true; 
    } catch (error) {
      console.error(`[PM] Error general al desactivar plugin [${pluginId}]:`, error);
      this._publishEvent('error', { pluginId, operation: 'deactivate', error: error.message });
      return false;
    }
  }

  getAllPlugins() { 
    if (!this.initialized) return [];
    const plugins = pluginRegistry.getAllPlugins();
    return plugins.map(plugin => {
        if (!plugin || !plugin.id) return null;
        const compatInfo = this._compatibilityResults[plugin.id] || { compatible: true, reason: "No verificado aún" };
        const pluginInfo = { ...plugin, compatible: compatInfo.compatible, incompatibilityReason: !compatInfo.compatible ? compatInfo.reason : null };
        if (this.securityInitialized) {
            const securityInfo = pluginSecurityManager.getPluginSecurityInfo(plugin.id);
            Object.assign(pluginInfo, { 
                securityScore: securityInfo?.securityScore || 0, 
                blacklisted: securityInfo?.blacklisted || false, 
                securityWarnings: securityInfo?.warnings?.length || 0, 
                permissions: pluginPermissionChecker.getPluginPermissions(plugin.id) 
            });
        }
        return pluginInfo;
    }).filter(Boolean);
  }
  getActivePlugins() { return this.initialized ? pluginRegistry.getActivePlugins() : []; }
  isPluginActive(pluginId) { return this.initialized ? pluginRegistry.isPluginActive(pluginId) : false; }
  isPluginCompatible(pluginId) { 
    if (!pluginId) return true; 
    const compatResult = this._compatibilityResults[pluginId];
    return compatResult ? compatResult.compatible : true; 
  }
  
  subscribe(eventName, callback) {
    if (!eventName || typeof callback !== 'function') {
        // console.error('[PM] Intento de suscribir con eventName inválido o callback no es función.');
        return () => {}; // Devuelve una función no-op
    }
    const id = `sub_${++this._lastSubscriberId}`;
    if (!this._subscribers[eventName]) {
        this._subscribers[eventName] = {};
    }
    this._subscribers[eventName][id] = callback;
    return () => {
        if (this._subscribers[eventName] && this._subscribers[eventName][id]) {
            delete this._subscribers[eventName][id];
            if (Object.keys(this._subscribers[eventName]).length === 0) {
                delete this._subscribers[eventName];
            }
        }
    };
  }

  async reloadPlugins(preserveState = true) {
    if (!this.initialized) {
        return false;
    }
    this.loading = true;
    let overallSuccess = true;

    try {
      const activePluginIdsBeforeReload = preserveState ? 
        pluginRegistry.getActivePlugins().map(p => p.id) : [];
      
      const currentActivePluginsForDeactivation = [...pluginRegistry.getActivePlugins().map(p => p.id)];
      for (const pluginId of currentActivePluginsForDeactivation) {
        if(!await this.deactivatePlugin(pluginId, true)) {
            // console.warn(`[PM] No se pudo desactivar completamente ${pluginId} durante la recarga. Continuando...`);
            // No marcamos overallSuccess como false aquí, la recarga puede continuar.
        }
      }
      
      pluginRegistry.clear();
      this._compatibilityResults = {}; 
      pluginAPIRegistry.clearAll();
      
      const plugins = await loadPlugins();
      const registeredCount = this._registerPlugins(plugins);
      await this._verifyPluginCompatibility(); // Puede lanzar error
      
      let reactivatedCount = 0;
      if (preserveState && activePluginIdsBeforeReload.length > 0) {
        const loadOrder = pluginDependencyResolver.calculateLoadOrder(); 
        const pluginsToReactivate = loadOrder.filter(id => 
            activePluginIdsBeforeReload.includes(id) &&
            this.isPluginCompatible(id) && // Usa el método del manager
            (!this.securityInitialized || !pluginSecurityManager.isPluginBlacklisted(id))
        );

        for (const pluginId of pluginsToReactivate) {
          if (await this.activatePlugin(pluginId)) { // activatePlugin devuelve booleano
            reactivatedCount++;
          } else {
            // console.warn(`[PM] No se pudo reactivar ${pluginId} después de la recarga.`);
            overallSuccess = false; // Si una reactivación falla, la recarga general no fue 100% exitosa
          }
        }
      }
      
      this._publishEvent('pluginsReloaded', { count: registeredCount, reactivatedCount, reactivatedPluginIds: pluginRegistry.getActivePlugins().map(p=>p.id) });
    } catch (error) { // Errores críticos como fallo en loadPlugins o _verifyPluginCompatibility
      console.error('[PM] Error crítico al recargar plugins:', error);
      this._publishEvent('error', { operation: 'reload', error: error.message });
      overallSuccess = false;
    } finally {
        this.loading = false;
    }
    return overallSuccess;
  }

  getStatus() { 
    if (!this.initialized) { return { initialized: false, loading: this.loading, error: this.error, totalPlugins: 0 }; }
    const allPlugins = pluginRegistry.getAllPlugins();
    const activePlugins = pluginRegistry.getActivePlugins();
    const status = {
      initialized: true, loading: this.loading, error: this.error, totalPlugins: allPlugins.length,
      activePlugins: activePlugins.length,
      compatiblePlugins: allPlugins.filter(p => p?.id && this.isPluginCompatible(p.id)).length,
      incompatiblePlugins: allPlugins.filter(p => p?.id && !this.isPluginCompatible(p.id)).length,
      states: pluginRegistry.getPluginStates(), cycles: pluginDependencyResolver.getDetectedCycles(),
      apiCount: Object.keys(pluginAPIRegistry.getAPIInfo()).length,
      activeChannels: Object.keys(pluginCommunication.getChannelsInfo()).length
    };
    if (this.securityInitialized) {
      const securityStats = pluginSecurityManager.getSecurityStats();
      Object.assign(status, {
        securityEnabled: true, securityLevel: this.securityLevel,
        blacklistedPlugins: securityStats?.blacklistedPlugins || 0,
        pluginsWithWarnings: securityStats?.pluginsWithWarnings || 0,
        detectedThreats: securityStats?.detectedThreats?.total || 0,
        resourceStats: pluginResourceMonitor.getResourceStats(),
        permissionStats: pluginPermissionChecker.getPermissionStats(),
        auditStats: pluginSecurityAudit.getAuditStats(),
        sandboxStats: pluginSandbox.getStats()
      });
    } else { status.securityEnabled = false; }
    return status;
  }

  async setSecurityLevel(level) { // Marcado como async
    const normalizedLevelParam = level?.toUpperCase();
    const newLevel = PLUGIN_CONSTANTS.SECURITY.LEVEL[normalizedLevelParam];

    if (!newLevel) {
      console.error(`[PM] Nivel de seguridad inválido proporcionado a setSecurityLevel: ${level}`);
      return false;
    }
    
    const oldLevel = this.securityLevel;
    
    if (oldLevel === newLevel && this.securityInitialized) {
        return true; 
    }
    
    this.securityLevel = newLevel; 

    if (this.securityInitialized) {
        try {
            pluginSecurityManager.setSecurityLevel(newLevel);
            pluginSandbox.setSecurityLevel(newLevel);
            pluginResourceMonitor.setSecurityLevel(newLevel);
            pluginPermissionChecker.setSecurityLevel(newLevel);
            pluginSecurityAudit.setSecurityLevel(newLevel);
            
            this._configureSecurityChecksByLevel(newLevel);
            await this._saveSecuritySettings({ securityLevel: newLevel }); // AWAIT
            this._publishEvent('securityLevelChanged', { level: newLevel, previousLevel: oldLevel });
        } catch (error) {
            console.error(`[PM] Error al aplicar nuevo nivel de seguridad ${newLevel} a subsistemas:`, error);
            this.securityLevel = oldLevel; // Revertir
            return false;
        }
    } else {
        // Solo preconfigurar, no guardar ni notificar a subsistemas hasta que se inicialice la seguridad
    }
    return true;
  }

  async approvePluginPermissions(pluginId, permissions) {
    if (!pluginId || !Array.isArray(permissions) || permissions.length === 0) return false;
    if (!this.initialized) {
        return false;
    }
    // No es necesario chequear securityInitialized aquí, ya que la aprobación de permisos
    // podría querer hacerse incluso si el sistema de seguridad completo no está listo,
    // pero el permissionChecker sí debe estarlo (lo cual se asume si initialized es true).
    try {
      const permissionsInfo = pluginPermissionChecker.getPluginPermissions(pluginId);
      const success = pluginPermissionChecker.approvePermissions(pluginId, permissions);
      if (success) {
        pluginRegistry.setPluginState(pluginId, {
          permissionsApproved: [...new Set([...(permissionsInfo?.approved || []), ...permissions])],
          permissionsPending: (permissionsInfo?.pending || []).filter(p => !permissions.includes(p))
        });
        if(!await this._savePluginStates()){ // Guardar y verificar si falló
            // console.warn(`[PM] Fallo al guardar estados tras aprobar permisos para ${pluginId}`);
        }
        eventBus.publish('pluginSystem.permissionsApproved', { pluginId, permissions });
      }
      return success;
    } catch (error) {
      console.error(`[PM] Error al aprobar permisos para ${pluginId}:`, error);
      return false;
    }
  }
  
  async blacklistPlugin(pluginId, reason) {
    if (!this.securityInitialized) {
        return false;
    }
    if (!pluginId) return false;
    try {
      if(pluginRegistry.isPluginActive(pluginId)) {
          if(!await this.deactivatePlugin(pluginId, true)) { // Verificar si la desactivación falló
            // console.warn(`[PM] No se pudo desactivar ${pluginId} antes de añadir a lista negra. Continuando con blacklisting.`);
            // No retornar false aquí necesariamente, el blacklisting es la acción principal.
          }
      }
      const result = pluginSecurityManager.blacklistPlugin(pluginId); // Asumiendo que esto es síncrono o no necesita await
      if (result) {
        pluginSecurityAudit.recordBlacklistAction(pluginId, { action: 'add', reason, timestamp: Date.now() });
        this._publishEvent('pluginBlacklisted', { pluginId, reason });
      }
      return result;
    } catch(error) {
      console.error(`[PM] Error al añadir ${pluginId} a lista negra:`, error);
      return false;
    }
  }
  
  getPluginSecurityInfo(pluginId) {
    if (!this.securityInitialized) return { securityEnabled: false };
    if (!pluginId) return { securityEnabled: true, error: "Plugin ID no proporcionado", securityLevel: this.securityLevel };
    try {
      const securityInfo = pluginSecurityManager.getPluginSecurityInfo(pluginId);
      const additionalInfo = {
        resourceUsage: pluginResourceMonitor.getPluginResourceUsage(pluginId),
        permissions: pluginPermissionChecker.getPluginPermissions(pluginId),
        auditHistory: pluginSecurityAudit.getPluginAuditHistory(pluginId).slice(0, 20),
        sandboxErrors: pluginSandbox.getSandboxErrors(pluginId),
        securityLevel: this.securityLevel
      };
      return { securityEnabled: true, ...(securityInfo || {}), ...additionalInfo };
    } catch (error) { return { securityEnabled: true, error: error.message, securityLevel: this.securityLevel }; }
  }
  
  getPluginAPIsInfo() {
    if (!this.initialized) return {};
    try { 
      const apiInfo = pluginAPIRegistry.getAPIInfo();
      const result = {};
      Object.entries(apiInfo).forEach(([pluginId, infoEntry]) => {
        const plugin = pluginRegistry.getPlugin(pluginId);
        if (plugin) { // Solo añadir si el plugin existe en el registro
          result[pluginId] = { ...infoEntry, pluginName: plugin.name, pluginVersion: plugin.version, isActive: pluginRegistry.isPluginActive(pluginId) };
        }
      });
      return result;
    } catch (e) { console.error('[PM] Error en getPluginAPIsInfo:', e); return {}; }
  }

  getSecurityStats() {
    if (!this.securityInitialized) return { securityEnabled: false };
    try { 
      const securityStats = pluginSecurityManager.getSecurityStats();
      const resourceStats = pluginResourceMonitor.getResourceStats();
      const permissionStats = pluginPermissionChecker.getPermissionStats();
      const auditStats = pluginSecurityAudit.getAuditStats();
      const sandboxStats = pluginSandbox.getStats();
      return { securityEnabled: true, securityLevel: this.securityLevel, ...(securityStats || {}), resourceStats, permissionStats, auditStats, sandboxStats, timestamp: Date.now() };
    } catch (e) { console.error('[PM] Error en getSecurityStats:', e); return { error: e.message, securityEnabled: true, securityLevel: this.securityLevel }; }
  }
  
  getPendingPermissionRequests() {
    if (!this.initialized || !this.securityInitialized) return [];
    try { return pluginPermissionChecker.getPendingPermissionRequests(); } catch (e) { console.error('[PM] Error en getPendingPermissionRequests:', e); return []; }
  }
  
  getChannelsInfo() {
    if (!this.initialized) return {};
    try { 
      const channels = pluginCommunication.getChannelsInfo();
      const result = {};
      Object.entries(channels).forEach(([channelName, channelInfo]) => {
        const creatorPlugin = pluginRegistry.getPlugin(channelInfo.creator);
        result[channelName] = {
          ...channelInfo,
          creatorName: creatorPlugin?.name || 'Desconocido',
          creatorActive: pluginRegistry.isPluginActive(channelInfo.creator),
          subscribersInfo: (channelInfo.subscribers || []).map(id => {
            const plugin = pluginRegistry.getPlugin(id);
            return { id, name: plugin?.name || 'Desconocido', active: pluginRegistry.isPluginActive(id) };
          })
        };
      });
      return result;
    } catch (e) { console.error('[PM] Error en getChannelsInfo:', e); return {}; }
  }

  _configureSecurityChecksByLevel(level) {
    this.activeSecurityChecks.clear();
    const normalChecks = ['resourceUsage', 'apiAccess', 'storageUsage', 'domManipulation'];
    const highChecks = [...normalChecks, 'externalCommunication', 'codeExecution'];

    switch (level) {
      case PLUGIN_CONSTANTS.SECURITY.LEVEL.LOW:
        this.activeSecurityChecks.add('resourceUsage');
        this.activeSecurityChecks.add('apiAccess');
        break;
      case PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL:
        normalChecks.forEach(check => this.activeSecurityChecks.add(check));
        break;
      case PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH:
        highChecks.forEach(check => this.activeSecurityChecks.add(check));
        break;
      // No default case needed if levels are exhaustive and validated
    }
  }
}

const pluginManager = new PluginManager();
export default pluginManager;