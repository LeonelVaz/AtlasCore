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
    this.securityLevel = PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL; // Default inicial
    this.securityInitialized = false;
    this._activatingPlugins = new Set();
    this.activeSecurityChecks = new Set(); 
    // console.log('[PM Constructor] Instancia creada, securityLevel default:', this.securityLevel);
  }

  async initialize(services = {}, options = {}) {
    if (this.initialized && !options.forceReload) {
      // console.warn('[PM] El gestor de plugins ya está inicializado');
      return true;
    }
    
    // console.log('[PM] Iniciando inicialización de PluginManager...');
    this.loading = true;
    this.error = null;
    this.initialized = false; 
    this.securityInitialized = false;
    this._compatibilityResults = {}; 
    
    try {
      // El nivel de seguridad se determinará y establecerá en _initializeSecuritySystem
      // o si la seguridad está deshabilitada. No lo establecemos desde options aquí directamente.
      // this.securityLevel = options.securityLevel || PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL;
      // console.log(`[PM] Nivel de seguridad deseado para initialize: ${options.securityLevel || 'DEFAULT'}, enableSecurity: ${options.enableSecurity !== false}`);

      coreAPI.init(services);
      
      if (options.enableSecurity !== false) {
        await this._initializeSecuritySystem(options); 
      } else {
        // console.log('[PM] Sistema de seguridad explícitamente deshabilitado para esta inicialización.');
        this.securityInitialized = false;
        this.securityLevel = options.securityLevel || this.securityLevel; // Usar opción o default si seguridad está off
        this._configureSecurityChecksByLevel(this.securityLevel); 
      }
      
      await this._loadPluginStates();
      const plugins = await loadPlugins();
      // console.log(`[PM] Plugins cargados por loadPlugins: ${plugins.length}, IDs: ${plugins.map(p=>p?.id).join(', ')}`);
      
      const registeredCount = this._registerPlugins(plugins);
      // console.log(`[PM] Plugins registrados en pluginRegistry: ${registeredCount}`);
      
      // console.log('[PM DEBUG INIT] ANTES de _verifyPluginCompatibility. _compatibilityResults:', JSON.stringify(this._compatibilityResults));
      await this._verifyPluginCompatibility();
      // console.log('[PM DEBUG INIT] DESPUÉS de _verifyPluginCompatibility. _compatibilityResults:', JSON.stringify(this._compatibilityResults));
      
      this.initialized = true; 
      // console.log('[PM DEBUG INIT] this.initialized AHORA es true');
      
      await this._activatePluginsFromState();
      
      // console.log(`[PM] Sistema de plugins inicializado. ${registeredCount} plugins registrados.`);
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
      this.initialized = false;
      this.securityInitialized = false;
      
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
      // console.log('[PM] Inicializando sistema de seguridad para plugins...');
      
      const securitySettingsFromStorage = await this._loadSecuritySettings();
      const determinedSecurityLevel = options.securityLevel || 
                                    securitySettingsFromStorage?.securityLevel || 
                                    this.securityLevel; 
      
      this.securityLevel = determinedSecurityLevel;
      // console.log(`[PM] Nivel de seguridad determinado para subsistemas: ${this.securityLevel}`);
      this._configureSecurityChecksByLevel(this.securityLevel);

      const securityConfig = { securityLevel: this.securityLevel };
      
      pluginSecurityManager.initialize(securityConfig);
      pluginSandbox.initialize(this.securityLevel);
      pluginResourceMonitor.initialize(this.securityLevel);
      pluginPermissionChecker.initialize(this.securityLevel);
      pluginSecurityAudit.initialize(this.securityLevel);
      
      eventBus.subscribe('pluginSystem.securityDeactivateRequest', async (data) => {
        if (data?.pluginId) {
          // console.warn(`[PM] Solicitud de desactivación de seguridad: ${data.pluginId} - ${data.reason}`);
          await this.deactivatePlugin(data.pluginId, true);
          pluginSecurityAudit.recordPluginDeactivation(data.pluginId, {
            reason: data.reason, timestamp: Date.now(), source: 'security'
          });
        }
      });
      
      this.securityInitialized = true;
      // console.log(`[PM] Sistema de seguridad inicializado (nivel: ${this.securityLevel})`);
      return true;
    } catch (error) {
      console.error('[PM] Error al inicializar sistema de seguridad:', error);
      this.securityInitialized = false;
      return false;
    }
  }

  async rejectPluginPermissions(pluginId, permissions) {
    if (!pluginId || !Array.isArray(permissions) || permissions.length === 0) {
        console.error('[PM] Argumentos inválidos para rejectPluginPermissions', { pluginId, permissions });
        return false;
    }
    if (!this.initialized) {
        console.warn("[PM] PluginManager no inicializado. No se pueden rechazar permisos.");
        return false;
    }
    if (!this.securityInitialized) {
        console.warn("[PM] Sistema de seguridad no inicializado. No se pueden rechazar permisos.");
        return false;
    }

    try {
        const success = pluginPermissionChecker.rejectPermissions(pluginId, permissions);
        if (success) {
            // Opcional: Guardar el estado o realizar otras acciones si es necesario
            // Por ejemplo, si el estado de los permisos afecta algo que pluginManager rastrea directamente.
            // await this._savePluginStates(); // Si el estado de los permisos afecta `pluginRegistry.pluginStates`

            eventBus.publish('pluginSystem.permissionsRejectedByManager', { pluginId, permissions });
            console.log(`[PM] Permisos ${permissions.join(', ')} rechazados para ${pluginId}`);
        } else {
            console.warn(`[PM] Falló el rechazo de permisos para ${pluginId} desde el permissionChecker.`);
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
      // console.log('[PM] Configuración de seguridad cargada:', settings);
      return settings;
    } catch (error) {
      console.error('[PM] Error al cargar configuración de seguridad:', error);
      return {
        securityLevel: PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL,
        activeChecks: ['resourceUsage', 'apiAccess', 'storageUsage', 'domManipulation']
      };
    }
  }

  async _saveSecuritySettings(settings = {}) {
    try {
      const currentSettings = await this._loadSecuritySettings();
      const newSettings = { ...currentSettings, ...settings, lastUpdated: Date.now() };
      await storageService.set(STORAGE_KEYS.PLUGIN_SECURITY_SETTINGS_KEY, newSettings);
      // console.log('[PM] Configuración de seguridad guardada:', newSettings);
    } catch (error) {
      console.error('[PM] Error al guardar configuración de seguridad:', error);
    }
  }

  async _loadPluginStates() {
    try {
      const pluginStatesFromStorage = await storageService.get(PLUGIN_STATE_KEY, {});
      // console.log('[PM DEBUG LPS] pluginStates leídos de storageService:', JSON.stringify(pluginStatesFromStorage));
      pluginRegistry.setPluginStates(pluginStatesFromStorage);
      return true;
    } catch (error) {
      console.error('[PM] Error al cargar estados de plugins:', error);
      return false;
    }
  }

  async _savePluginStates() {
    try {
      const pluginStates = pluginRegistry.getPluginStates();
      await storageService.set(PLUGIN_STATE_KEY, pluginStates);
      return true;
    } catch (error) {
      console.error('[PM] Error al guardar estados de plugins:', error);
      return false;
    }
  }

  async _activatePluginsFromState() {
    // console.log('[PM DEBUG APS] Iniciando _activatePluginsFromState.');
    // console.log('[PM DEBUG APS] this.initialized:', this.initialized);
    // console.log('[PM DEBUG APS] this._compatibilityResults al inicio de APS:', JSON.stringify(this._compatibilityResults));
    
    try {
      const pluginStates = pluginRegistry.getPluginStates();
      const allPlugins = pluginRegistry.getAllPlugins(); 
      const sortedPluginIds = pluginDependencyResolver.calculateLoadOrder(); 

      // console.log('[PM DEBUG APS] sortedPluginIds:', sortedPluginIds.join(', '));
      // console.log('[PM DEBUG APS] pluginStates (desde pluginRegistry):', JSON.stringify(pluginStates));
      // console.log('[PM DEBUG APS] allPlugins (desde pluginRegistry):', allPlugins.map(p=>p?.id).join(', '));

      const pluginsMap = {};
      allPlugins.forEach(plugin => {
        if (plugin?.id) pluginsMap[plugin.id] = plugin;
      });
      
      let activatedCount = 0;
      for (const pluginId of sortedPluginIds) {
        const state = pluginStates[pluginId];
        // console.log(`[PM DEBUG APS] Procesando ${pluginId}. Estado:`, JSON.stringify(state), `En pluginsMap: ${!!pluginsMap[pluginId]}`);
        
        if (state?.active && pluginsMap[pluginId]) {
          const compatResult = this._compatibilityResults[pluginId];
          // console.log(`[PM DEBUG APS] Compatibilidad para ${pluginId} (desde _compatibilityResults):`, JSON.stringify(compatResult));
          
          const isBlacklisted = this.securityInitialized && 
                               pluginSecurityManager.isPluginBlacklisted(pluginId);
          // console.log(`[PM DEBUG APS] ${pluginId} - isBlacklisted: ${isBlacklisted}`);
          
          if (!compatResult || compatResult?.compatible === false) {
            // console.warn(`[PM] Plugin ${pluginId} no se activará (desde APS): Incompatible o sin resultado. Razón: ${compatResult?.reason}`);
            continue;
          }
          if (isBlacklisted) {
            // console.warn(`[PM] Plugin ${pluginId} no se activará (desde APS): está en lista negra`);
            continue;
          }
          
          // console.log(`[PM DEBUG APS] Intentando activar ${pluginId} vía this.activatePlugin`);
          if (await this.activatePlugin(pluginId)) {
             activatedCount++;
             // console.log(`[PM DEBUG APS] ${pluginId} activado exitosamente desde APS.`);
          } else {
             // console.warn(`[PM DEBUG APS] Falló la activación de ${pluginId} desde APS.`);
          }
        }
      }
      // console.log(`[PM] ${activatedCount} plugins activados automáticamente desde el estado.`);
      return true;
    } catch (error) {
      console.error('[PM] Error al activar plugins desde estado previo:', error);
      return false;
    }
  }

  async _verifyPluginCompatibility() {
    // console.log('[PM] Iniciando _verifyPluginCompatibility...');
    try {
      this._compatibilityResults = {};
      const allPlugins = pluginRegistry.getAllPlugins();
      // console.log(`[PM] _verifyPluginCompatibility - Verificando ${allPlugins.length} plugins: ${allPlugins.map(p=>p?.id).join(', ')}`);
      
      for (const plugin of allPlugins) {
        if (!plugin || !plugin.id) {
            // console.warn('[PM] _verifyPluginCompatibility - Encontrado plugin inválido o sin ID:', plugin);
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
          if (!result.compatible) {
            console.warn(`[PM] Plugin ${plugin.id} incompatible: ${result.reason}`);
          }
        } catch (error) {
          console.error(`[PM] Error al verificar compatibilidad para ${plugin.id}:`, error);
          this._compatibilityResults[plugin.id] = { compatible: false, reason: `Error en verificación: ${error.message}` };
        }
      }
      return true;
    } catch (error) {
      console.error('[PM] Error general en _verifyPluginCompatibility:', error);
      return false;
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
      console.error(`[PM] El gestor de plugins no está inicializado, no se puede activar plugin: ${pluginId}`);
      return false;
    }
    if (this._activatingPlugins.has(pluginId)) {
      // console.warn(`[PM] Activación de ${pluginId} ya en progreso o ciclo detectado.`);
      return true; // Si ya está en proceso, consideramos que eventualmente se activará (o fallará)
    }
    
    // console.log(`[PM] Iniciando activación de plugin: ${pluginId}`);
    this._activatingPlugins.add(pluginId);
    
    try {
      let plugin = pluginRegistry.getPlugin(pluginId);
      if (!plugin) {
        plugin = await this._loadAndRegisterPlugin(pluginId);
        if (!plugin) {
          console.error(`[PM] Plugin ${pluginId} no encontrado o no se pudo cargar/registrar para activación.`);
          this._activatingPlugins.delete(pluginId);
          return false;
        }
      }
      
      if (pluginRegistry.isPluginActive(pluginId)) {
        // console.log(`[PM] Plugin ${pluginId} ya está activo.`);
        this._activatingPlugins.delete(pluginId);
        return true;
      }

      let compatResult = this._compatibilityResults[pluginId];
      if (!compatResult && plugin) { // Solo recalcular si no existe Y tenemos la definición del plugin
          // console.log(`[PM] (activatePlugin) Compatibilidad no encontrada en caché para ${pluginId}, verificando...`);
          compatResult = pluginCompatibility.runFullCompatibilityCheck(plugin);
          this._compatibilityResults[pluginId] = compatResult;
      }

      // Si incluso después de re-verificar (o si no había plugin), no es compatible
      if (!compatResult || !compatResult.compatible) {
        console.warn(`[PM] No se puede activar ${pluginId}: Incompatible. Razón: ${compatResult?.reason}`);
        this._publishEvent('compatibilityError', { pluginId, reason: compatResult?.reason, details: compatResult });
        this._activatingPlugins.delete(pluginId);
        return false;
      }
      
      const isBlacklisted = this.securityInitialized && pluginSecurityManager.isPluginBlacklisted(pluginId);
      if (isBlacklisted) {
        console.warn(`[PM] No se puede activar ${pluginId}: Está en lista negra.`);
        this._publishEvent('securityViolation', { pluginId, reason: 'Intento de activar plugin en lista negra', severity: 'high' });
        this._activatingPlugins.delete(pluginId);
        return false;
      }
      
      if (this.securityInitialized) {
        const securityValidation = pluginSecurityManager.validatePlugin(pluginId);
        if (!securityValidation.valid) {
          console.warn(`[PM] No se puede activar ${pluginId}: Validación de seguridad fallida. Razón: ${securityValidation.reason}`);
          this._publishEvent('securityViolation', { pluginId, reason: 'Validación de seguridad fallida', details: securityValidation, severity: 'medium' });
          this._activatingPlugins.delete(pluginId);
          return false;
        }
        if (plugin.permissions && this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH) {
          const permValidation = pluginPermissionChecker.validatePermissions(pluginId, plugin.permissions);
          if (permValidation.pendingPermissions.length > 0) {
            console.warn(`[PM] No se puede activar ${pluginId}: Permisos pendientes en nivel HIGH.`);
            this._publishEvent('permissionDenied', { pluginId, permissions: permValidation.pendingPermissions, reason: 'Nivel de seguridad alto no permite aprobación manual' });
            this._activatingPlugins.delete(pluginId);
            return false;
          }
        }
      }
      
      await this._activateDependencies(plugin);
      
      let activated = false;
      // console.log(`[PM] Ejecutando init para ${pluginId}`);
      try {
        if (this.securityInitialized) {
          const finishOperation = pluginResourceMonitor.trackOperation(pluginId, 'activation');
          activated = await pluginSandbox.executeSandboxed(pluginId, () => pluginRegistry.activatePlugin(pluginId, coreAPI), [], null);
          finishOperation();
        } else {
          activated = pluginRegistry.activatePlugin(pluginId, coreAPI);
        }
      } catch (activationError) {
        console.error(`[PM] Error durante la ejecución de init de ${pluginId}:`, activationError);
        if (this.securityInitialized) {
          pluginSecurityAudit.recordPluginDeactivation(pluginId, { action: 'activation_failed', error: activationError.message, timestamp: Date.now() });
        }
        this._activatingPlugins.delete(pluginId);
        return false;
      }
      
      if (activated) {
        // console.log(`[PM] ${pluginId} activado, registrando API y estado.`);
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
        console.warn(`[PM] La activación de ${pluginId} (llamada a init del registro) devolvió false.`);
      }
      
      this._activatingPlugins.delete(pluginId);
      return activated;
    } catch (error) {
      console.error(`[PM] Error general al activar plugin [${pluginId}]:`, error);
      this._activatingPlugins.delete(pluginId);
      this._publishEvent('error', { pluginId, operation: 'activate', error: error.message || 'Error desconocido' });
      return false;
    }
  }

  async _loadAndRegisterPlugin(pluginId) {
    // console.log(`[PM] _loadAndRegisterPlugin: Intentando cargar ${pluginId}`);
    try {
      let plugin = pluginRegistry.getPlugin(pluginId);
      if (plugin) {
        // console.log(`[PM] _loadAndRegisterPlugin: ${pluginId} ya estaba en el registro.`);
        if (!this._compatibilityResults[pluginId]) {
            const compatResult = pluginCompatibility.runFullCompatibilityCheck(plugin);
            this._compatibilityResults[pluginId] = compatResult;
            if (!compatResult.compatible) {
                 // console.warn(`[PM] _loadAndRegisterPlugin: Plugin ${pluginId} pre-registrado es incompatible. Razón: ${compatResult.reason}`);
                 return null;
            }
        } else if (!this._compatibilityResults[pluginId].compatible) {
            // console.warn(`[PM] _loadAndRegisterPlugin: Plugin ${pluginId} pre-registrado es incompatible (cacheado). Razón: ${this._compatibilityResults[pluginId].reason}`);
            return null;
        }
        return plugin;
      }

      plugin = await loadPluginById(pluginId);
      if (!plugin) {
        console.error(`[PM] _loadAndRegisterPlugin: No se pudo cargar el plugin: ${pluginId} desde loadPluginById.`);
        return null;
      }
      // console.log(`[PM] _loadAndRegisterPlugin: ${pluginId} cargado desde loadPluginById.`);
      
      const validationResult = validatePluginCompatibility(plugin);
      this._compatibilityResults[plugin.id] = { compatible: validationResult.valid, reason: validationResult.reason, details: validationResult.details };
      
      if (!validationResult.valid) {
        // console.warn(`[PM] _loadAndRegisterPlugin: ${pluginId} cargado pero no es compatible. Razón: ${validationResult.reason}`);
        this._publishEvent('compatibilityError', { pluginId, reason: validationResult.reason, details: validationResult.details });
        return null;
      }

      if (!pluginRegistry.registerPlugin(plugin)) {
        console.error(`[PM] _loadAndRegisterPlugin: No se pudo registrar el plugin cargado: ${pluginId}`);
        return null;
      }
      // console.log(`[PM] _loadAndRegisterPlugin: ${pluginId} registrado exitosamente.`);
      return plugin;
    } catch (error) {
      console.error(`[PM] Error en _loadAndRegisterPlugin para ${pluginId}:`, error);
      return null;
    }
  }

  async _activateDependencies(pluginDefinition) {
    if (!pluginDefinition || !pluginDefinition.dependencies || pluginDefinition.dependencies.length === 0) {
      return true;
    }
    // console.log(`[PM] Activando dependencias para ${pluginDefinition.id}:`, pluginDefinition.dependencies.map(d => (typeof d === 'string' ? d : d.id)));
    for (const dependency of pluginDefinition.dependencies) {
      const depId = typeof dependency === 'string' ? dependency : dependency.id;
      if (!depId) continue;
      
      if (pluginRegistry.isPluginActive(depId)) {
        // console.log(`[PM] Dependencia ${depId} ya está activa.`);
        continue;
      }
      
      // console.log(`[PM] Activando dependencia requerida ${depId} para el plugin ${pluginDefinition.id}`);
      const depActivated = await this.activatePlugin(depId);
      if (!depActivated) {
        const errorMsg = `Dependencia ${depId} de ${pluginDefinition.id} no pudo ser activada.`;
        console.error(`[PM] ${errorMsg}`);
        this._publishEvent('dependencyError', { pluginId: pluginDefinition.id, dependencyId: depId, reason: 'No se pudo activar la dependencia' });
        throw new Error(errorMsg);
      }
    }
    return true;
  }

  async deactivatePlugin(pluginId, force = false) {
    if (!this.initialized) {
        // console.warn("[PM] PluginManager no inicializado, no se puede desactivar plugin.");
        return true; 
    }
    if (!pluginRegistry.isPluginActive(pluginId)) {
      // console.log(`[PM] Plugin ${pluginId} ya está inactivo o no existe como activo.`);
      return true; 
    }
    
    // console.log(`[PM] Iniciando desactivación de ${pluginId}, force: ${force}`);
    try {
      const plugin = pluginRegistry.getPlugin(pluginId);
      
      if (!force) {
        const dependentPlugins = pluginDependencyResolver.getDependentPlugins(pluginId)
          .filter(depId => pluginRegistry.isPluginActive(depId));
        if (dependentPlugins.length > 0) {
          console.warn(`[PM] No se puede desactivar ${pluginId}: Plugins dependientes activos: ${dependentPlugins.join(', ')}`);
          this._publishEvent('dependencyError', { pluginId, dependent: dependentPlugins, reason: 'Otros plugins activos dependen de este' });
          return false;
        }
      }
      
      pluginAPIRegistry.unregisterAPI(pluginId);
      pluginCommunication.clearPluginResources(pluginId);
      
      let registryCallSuccessful = false;
      try {
        // console.log(`[PM] Ejecutando cleanup para ${pluginId}`);
        if (this.securityInitialized) {
          const finishOperation = pluginResourceMonitor.trackOperation(pluginId, 'deactivation');
          registryCallSuccessful = await pluginSandbox.executeSandboxed(pluginId, () => pluginRegistry.deactivatePlugin(pluginId), [], null);
          finishOperation();
        } else {
          registryCallSuccessful = pluginRegistry.deactivatePlugin(pluginId);
        }
      } catch (error) {
        console.error(`[PM] Error durante la ejecución de cleanup de ${pluginId}:`, error);
        if (!force) return false; 
      }
      
      if (!registryCallSuccessful && !force) {
          console.error(`[PM] Cleanup de ${pluginId} devolvió false y no se forzó la desactivación. La desactivación completa falló.`);
          return false;
      }

      // console.log(`[PM] Plugin ${pluginId} considerado desactivado (registryCallSuccessful: ${registryCallSuccessful}, force: ${force}). Procediendo con limpieza de manager.`);
      await coreAPI.cleanupPluginResources(pluginId);
      if (this.securityInitialized) {
        pluginResourceMonitor.decreaseMonitoring(pluginId);
        pluginResourceMonitor.removeRestrictions(pluginId);
      }
      pluginRegistry.setPluginState(pluginId, { active: false, lastDeactivated: Date.now() });
      await this._savePluginStates();
      this._publishEvent('pluginDeactivated', { pluginId, plugin }); 
      if (this.securityInitialized) {
        pluginSecurityAudit.recordPluginDeactivation(pluginId, { forced: force, reason: force ? 'Desactivación forzada' : 'Desactivación normal', timestamp: Date.now() });
      }
      // console.log(`[PM] Plugin ${pluginId} desactivado exitosamente por el manager.`);
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
            Object.assign(pluginInfo, { securityScore: securityInfo?.securityScore || 0, blacklisted: securityInfo?.blacklisted || false, securityWarnings: securityInfo?.warnings?.length || 0, permissions: pluginPermissionChecker.getPluginPermissions(plugin.id) });
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
  subscribe(eventName, callback) { /* ... (sin cambios) ... */ return () => {}; }

  async reloadPlugins(preserveState = true) {
    if (!this.initialized) {
        // console.warn("[PM] PluginManager no inicializado. No se pueden recargar plugins.");
        return false;
    }
    // console.log("[PM] Iniciando recarga de plugins...");
    this.loading = true;
    let overallSuccess = true;

    try {
      const activePluginIdsBeforeReload = preserveState ? 
        pluginRegistry.getActivePlugins().map(p => p.id) : [];
      
      const currentActivePluginsForDeactivation = [...pluginRegistry.getActivePlugins().map(p => p.id)];
      for (const pluginId of currentActivePluginsForDeactivation) {
        if(!await this.deactivatePlugin(pluginId, true)) {
            // console.warn(`[PM] No se pudo desactivar completamente ${pluginId} durante la recarga. Continuando...`);
        }
      }
      
      pluginRegistry.clear();
      this._compatibilityResults = {}; 
      pluginAPIRegistry.clearAll();
      
      const plugins = await loadPlugins();
      const registeredCount = this._registerPlugins(plugins);
      await this._verifyPluginCompatibility();
      
      // console.log(`[PM] Plugins recargados en registro: ${registeredCount}.`);
      
      let reactivatedCount = 0;
      if (preserveState && activePluginIdsBeforeReload.length > 0) {
        const loadOrder = pluginDependencyResolver.calculateLoadOrder(); 
        const pluginsToReactivate = loadOrder.filter(id => 
            activePluginIdsBeforeReload.includes(id) &&
            this.isPluginCompatible(id) &&
            (!this.securityInitialized || !pluginSecurityManager.isPluginBlacklisted(id))
        );

        for (const pluginId of pluginsToReactivate) {
          if (await this.activatePlugin(pluginId)) {
            reactivatedCount++;
          } else {
            // console.warn(`[PM] No se pudo reactivar ${pluginId} después de la recarga.`);
            overallSuccess = false; 
          }
        }
        // console.log(`[PM] ${reactivatedCount}/${pluginsToReactivate.length} plugins reactivados.`);
      }
      
      this._publishEvent('pluginsReloaded', { count: registeredCount, reactivatedCount, reactivatedPluginIds: pluginRegistry.getActivePlugins().map(p=>p.id) });
    } catch (error) {
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

  setSecurityLevel(level) {
    // console.log(`[PM DEBUG] setSecurityLevel CALLED. Current this.securityLevel: ${this.securityLevel}, Target level: ${level}, securityInitialized: ${this.securityInitialized}`);
    const normalizedLevelParam = level?.toUpperCase();
    const newLevel = PLUGIN_CONSTANTS.SECURITY.LEVEL[normalizedLevelParam];

    if (!newLevel) {
      console.error(`[PM] Nivel de seguridad inválido proporcionado a setSecurityLevel: ${level}`);
      return false;
    }
    
    const oldLevel = this.securityLevel;
    
    if (oldLevel === newLevel && this.securityInitialized) {
        // console.log(`[PM] Nivel de seguridad ya es ${newLevel} y la seguridad está inicializada. No se realizan cambios.`);
        return true; 
    }
    
    this.securityLevel = newLevel; 

    if (this.securityInitialized) {
        // console.log(`[PM] Aplicando cambio de nivel de seguridad de ${oldLevel} a ${newLevel} a subsistemas.`);
        try {
            pluginSecurityManager.setSecurityLevel(newLevel);
            pluginSandbox.setSecurityLevel(newLevel);
            pluginResourceMonitor.setSecurityLevel(newLevel);
            pluginPermissionChecker.setSecurityLevel(newLevel);
            pluginSecurityAudit.setSecurityLevel(newLevel);
            
            this._configureSecurityChecksByLevel(newLevel);
            this._saveSecuritySettings({ securityLevel: newLevel }); // Guardar inmediatamente
            this._publishEvent('securityLevelChanged', { level: newLevel, previousLevel: oldLevel });
            // console.log(`[PM] Nivel de seguridad del sistema de plugins establecido a ${newLevel}.`);
        } catch (error) {
            console.error(`[PM] Error al aplicar nuevo nivel de seguridad ${newLevel} a subsistemas:`, error);
            this.securityLevel = oldLevel; 
            return false;
        }
    } else {
        // console.log(`[PM] Nivel de seguridad pre-configurado a ${newLevel}. Se aplicará en la inicialización del sistema de seguridad.`);
        // No guardar en storage aquí, initialize lo hará si es necesario.
    }
    return true;
  }

  async approvePluginPermissions(pluginId, permissions) {
    if (!pluginId || !Array.isArray(permissions) || permissions.length === 0) return false;
    if (!this.initialized) {
        // console.warn("[PM] PluginManager no inicializado. No se pueden aprobar permisos.");
        return false;
    }
    try {
      const permissionsInfo = pluginPermissionChecker.getPluginPermissions(pluginId);
      const success = pluginPermissionChecker.approvePermissions(pluginId, permissions);
      if (success) {
        pluginRegistry.setPluginState(pluginId, {
          permissionsApproved: [...new Set([...(permissionsInfo?.approved || []), ...permissions])],
          permissionsPending: (permissionsInfo?.pending || []).filter(p => !permissions.includes(p))
        });
        await this._savePluginStates();
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
        // console.warn("[PM] Sistema de seguridad no inicializado. No se puede añadir a lista negra.");
        return false;
    }
    if (!pluginId) return false;
    try {
      if(pluginRegistry.isPluginActive(pluginId)) {
          await this.deactivatePlugin(pluginId, true);
      }
      const result = pluginSecurityManager.blacklistPlugin(pluginId);
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
      Object.entries(apiInfo).forEach(([pluginId, info]) => {
        const plugin = pluginRegistry.getPlugin(pluginId);
        if (plugin) {
          result[pluginId] = { ...info, pluginName: plugin.name, pluginVersion: plugin.version, isActive: pluginRegistry.isPluginActive(pluginId) };
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
    }
    // console.log(`[PM] Verificaciones de seguridad activas para nivel ${level}:`, Array.from(this.activeSecurityChecks));
  }
}

const pluginManager = new PluginManager();
export default pluginManager;