/**
 * Gestor de plugins para Atlas
 * 
 * Este módulo coordina todas las operaciones relacionadas con plugins:
 * carga, inicialización, activación, desactivación, etc.
 */

import { loadPlugins, loadPluginById, validatePluginCompatibility } from './plugin-loader';
import pluginRegistry from './plugin-registry';
import coreAPI from './core-api';
import storageService from '../../services/storage-service';
import { STORAGE_KEYS } from '../../core/config/constants';
import eventBus from '../../core/bus/event-bus';
import pluginCompatibility from './plugin-compatibility';
import pluginDependencyResolver from './plugin-dependency-resolver';
import pluginAPIRegistry from './plugin-api-registry';
import pluginCommunication from './plugin-communication';
// Importaciones para el sistema de seguridad (Fase 6)
import pluginSecurityManager from './plugin-security-manager';
import pluginSandbox from './plugin-sandbox';
import pluginResourceMonitor from './plugin-resource-monitor';
import pluginPermissionChecker from './plugin-permission-checker';
import pluginSecurityAudit from './plugin-security-audit';
import { PLUGIN_CONSTANTS } from '../config/constants';

// Constantes
const PLUGIN_STATE_KEY = 'atlas_plugin_states';
const PLUGIN_SECURITY_SETTINGS_KEY = 'atlas_plugin_security_settings';
const PLUGIN_EVENT_PREFIX = 'plugin.';

/**
 * Clase principal para gestión de plugins
 */
class PluginManager {
  constructor() {
    this.initialized = false;
    this.loading = false;
    this.error = null;
    
    // Suscriptores a eventos del sistema de plugins
    this._subscribers = {};
    this._lastSubscriberId = 0;
    
    // Registro de resultados de compatibilidad por plugin
    this._compatibilityResults = {};
    
    // Nivel de seguridad del sistema (añadido en Fase 6)
    this.securityLevel = PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL;
    
    // Indica si el sistema de seguridad está inicializado (añadido en Fase 6)
    this.securityInitialized = false;
    
    // Plugins en proceso de activación (para evitar ciclos infinitos)
    this._activatingPlugins = new Set();
  }

  /**
   * Inicializa el sistema de plugins
   * @param {Object} services - Servicios internos a proporcionar a la API
   * @param {Object} options - Opciones de inicialización
   * @returns {Promise<boolean>} - true si se inicializó correctamente
   */
  async initialize(services = {}, options = {}) {
    if (this.initialized) {
      console.warn('El gestor de plugins ya está inicializado');
      return true;
    }
    
    try {
      this.loading = true;
      this.error = null;
      
      // Configurar nivel de seguridad desde opciones o usar valor predeterminado (añadido en Fase 6)
      this.securityLevel = options.securityLevel || PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL;
      
      // Inicializar la API Core
      coreAPI.init(services);
      
      // Inicializar el sistema de seguridad (añadido en Fase 6)
      if (options.enableSecurity !== false) {
        await this._initializeSecuritySystem();
      }
      
      // Cargar estados previos de plugins
      await this._loadPluginStates();
      
      // Cargar plugins disponibles
      const plugins = await loadPlugins();
      
      // Registrar plugins
      let registeredCount = 0;
      for (const plugin of plugins) {
        const success = pluginRegistry.registerPlugin(plugin);
        if (success) registeredCount++;
      }
      
      // Verificar compatibilidad y dependencias
      await this._verifyPluginCompatibility();
      
      // Marcar como inicializado antes de activar plugins
      this.initialized = true;
      
      // Activar automáticamente plugins según estado previo
      await this._activatePluginsFromState();
      
      console.log(`Sistema de plugins inicializado. ${registeredCount} plugins registrados.`);
      
      // Publicar evento de inicialización
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
      this.initialized = false; // Asegurarse de que no quede en estado inconsistente
      
      // Publicar evento de error
      this._publishEvent('error', { error: this.error });
      
      return false;
    }
  }

  /**
   * Inicializa el sistema de seguridad para plugins (añadido en Fase 6)
   * @private
   */
  async _initializeSecuritySystem() {
    try {
      console.log('Inicializando sistema de seguridad para plugins...');
      
      // Cargar configuración de seguridad
      const securitySettings = await this._loadSecuritySettings();
      
      // Utilizar nivel de seguridad guardado o predeterminado
      this.securityLevel = securitySettings?.securityLevel || this.securityLevel;
      
      // Inicializar subsistemas de seguridad
      pluginSecurityManager.initialize({
        securityLevel: this.securityLevel
      });
      
      pluginSandbox.initialize(this.securityLevel);
      pluginResourceMonitor.initialize(this.securityLevel);
      pluginPermissionChecker.initialize(this.securityLevel);
      pluginSecurityAudit.initialize(this.securityLevel);
      
      // Suscribirse a eventos de desactivación por seguridad
      eventBus.subscribe('pluginSystem.securityDeactivateRequest', async (data) => {
        if (data && data.pluginId) {
          console.warn(`Solicitud de desactivación de seguridad para plugin ${data.pluginId}: ${data.reason}`);
          await this.deactivatePlugin(data.pluginId, true);
          
          // Registrar en auditoría
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
   * Carga la configuración de seguridad desde almacenamiento (añadido en Fase 6)
   * @private
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
   * Guarda la configuración de seguridad en almacenamiento (añadido en Fase 6)
   * @param {Object} settings - Configuración a guardar
   * @private
   */
  async _saveSecuritySettings(settings = {}) {
    try {
      const currentSettings = await this._loadSecuritySettings();
      
      // Fusionar con configuración actual
      const updatedSettings = {
        ...currentSettings,
        ...settings,
        lastUpdated: Date.now()
      };
      
      await storageService.set(PLUGIN_SECURITY_SETTINGS_KEY, updatedSettings);
    } catch (error) {
      console.error('Error al guardar configuración de seguridad:', error);
    }
  }

  /**
   * Carga el estado anterior de los plugins desde almacenamiento
   * @private
   */
  async _loadPluginStates() {
    try {
      // Cargar estados previos
      const pluginStates = await storageService.get(PLUGIN_STATE_KEY, {});
      
      // Establecer estados en el registro
      pluginRegistry.setPluginStates(pluginStates);
      
      return true;
    } catch (error) {
      console.error('Error al cargar estados de plugins:', error);
      return false;
    }
  }

  /**
   * Guarda el estado actual de los plugins en almacenamiento
   * @private
   */
  async _savePluginStates() {
    try {
      // Obtener estados actuales
      const pluginStates = pluginRegistry.getPluginStates();
      
      // Guardar en almacenamiento
      await storageService.set(PLUGIN_STATE_KEY, pluginStates);
      
      return true;
    } catch (error) {
      console.error('Error al guardar estados de plugins:', error);
      return false;
    }
  }

  /**
   * Activa plugins basado en estados previamente guardados
   * @private
   */
  async _activatePluginsFromState() {
    try {
      // Verificar que el sistema esté inicializado
      if (!this.initialized) {
        console.warn('No se pueden activar plugins, el sistema no está inicializado');
        return false;
      }
      
      const pluginStates = pluginRegistry.getPluginStates();
      
      // Obtener lista de plugins activos ordenados por dependencias
      const allPlugins = pluginRegistry.getAllPlugins();
      const sortedPluginIds = pluginDependencyResolver.calculateLoadOrder();
      
      // Mapeo de ID a objeto plugin
      const pluginsMap = {};
      allPlugins.forEach(plugin => {
        if (plugin && plugin.id) {
          pluginsMap[plugin.id] = plugin;
        }
      });
      
      // Activar plugins marcados como activos en orden de dependencias
      for (const pluginId of sortedPluginIds) {
        const state = pluginStates[pluginId];
        
        if (state && state.active && pluginsMap[pluginId]) {
          // Verificar compatibilidad antes de activar
          const compatResult = this._compatibilityResults[pluginId];
          
          if (compatResult && !compatResult.compatible) {
            console.warn(`Plugin ${pluginId} no se activará automáticamente debido a incompatibilidad: ${compatResult.reason}`);
            continue;
          }
          
          // Verificar si está en lista negra (añadido en Fase 6)
          if (this.securityInitialized && pluginSecurityManager.isPluginBlacklisted(pluginId)) {
            console.warn(`Plugin ${pluginId} no se activará automáticamente porque está en lista negra`);
            continue;
          }
          
          try {
            await this.activatePlugin(pluginId);
          } catch (error) {
            console.error(`Error al activar plugin ${pluginId} desde estado previo:`, error);
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error al activar plugins desde estado previo:', error);
      return false;
    }
  }

  /**
   * Verifica la compatibilidad y dependencias de todos los plugins registrados
   * @private
   */
  async _verifyPluginCompatibility() {
    try {
      // Limpiar resultados anteriores
      this._compatibilityResults = {};
      
      // Obtener todos los plugins registrados
      const allPlugins = pluginRegistry.getAllPlugins();
      
      // Verificar compatibilidad de cada plugin
      for (const plugin of allPlugins) {
        try {
          // Verificación completa
          const result = pluginCompatibility.runFullCompatibilityCheck(plugin);
          
          // Almacenar resultado
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
          console.error(`Error al verificar compatibilidad del plugin ${plugin.id}:`, error);
          this._compatibilityResults[plugin.id] = {
            compatible: false,
            reason: `Error en verificación: ${error.message}`
          };
        }
      }
      
      // Resolver dependencias y calcular el orden de carga
      pluginDependencyResolver.calculateLoadOrder();
      
      return true;
    } catch (error) {
      console.error('Error al verificar compatibilidad de plugins:', error);
      return false;
    }
  }

  /**
   * Publica un evento del sistema de plugins
   * @param {string} eventName - Nombre del evento sin prefijo
   * @param {Object} data - Datos del evento
   * @private
   */
  _publishEvent(eventName, data = {}) {
    // Publicar en el bus de eventos
    const fullEventName = `pluginSystem.${eventName}`;
    eventBus.publish(fullEventName, data);
    
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
   * Activa un plugin por su ID
   * @param {string} pluginId - ID del plugin a activar
   * @returns {Promise<boolean>} - true si se activó correctamente
   */
  async activatePlugin(pluginId) {
    if (!this.initialized) {
      console.error('El gestor de plugins no está inicializado');
      return false;
    }
    
    // Evitar ciclos infinitos en activación de dependencias
    if (this._activatingPlugins.has(pluginId)) {
      console.warn(`Ciclo de activación detectado para plugin ${pluginId}, evitando ciclo infinito`);
      return false;
    }
    
    try {
      // Marcar como en proceso de activación
      this._activatingPlugins.add(pluginId);
      
      // Verificar compatibilidad antes de activar
      const compatResult = this._compatibilityResults[pluginId];
      
      if (compatResult && !compatResult.compatible) {
        console.error(`No se puede activar plugin incompatible: ${compatResult.reason}`);
        
        // Publicar evento de error de compatibilidad
        this._publishEvent('compatibilityError', {
          pluginId,
          reason: compatResult.reason,
          details: compatResult
        });
        
        // Quitar de plugins en activación
        this._activatingPlugins.delete(pluginId);
        
        return false;
      }
      
      // Verificar si está en lista negra (añadido en Fase 6)
      if (this.securityInitialized && pluginSecurityManager.isPluginBlacklisted(pluginId)) {
        console.error(`No se puede activar plugin en lista negra: ${pluginId}`);
        
        // Publicar evento
        this._publishEvent('securityViolation', {
          pluginId,
          reason: 'Intento de activar plugin en lista negra',
          severity: 'high'
        });
        
        // Quitar de plugins en activación
        this._activatingPlugins.delete(pluginId);
        
        return false;
      }
      
      // Verificar si ya está registrado
      let plugin = pluginRegistry.getPlugin(pluginId);
      
      // Si no está registrado, intentar cargarlo
      if (!plugin) {
        plugin = await loadPluginById(pluginId);
        
        if (!plugin) {
          console.error(`No se pudo cargar el plugin: ${pluginId}`);
          
          // Quitar de plugins en activación
          this._activatingPlugins.delete(pluginId);
          
          return false;
        }
        
        // Verificar compatibilidad del plugin recién cargado
        const validation = validatePluginCompatibility(plugin);
        
        if (!validation.valid) {
          console.error(`No se puede registrar plugin incompatible: ${validation.reason}`);
          
          // Publicar evento de error de compatibilidad
          this._publishEvent('compatibilityError', {
            pluginId,
            reason: validation.reason,
            details: validation.details
          });
          
          // Quitar de plugins en activación
          this._activatingPlugins.delete(pluginId);
          
          return false;
        }
        
        // Registrar el plugin recién cargado
        const registered = pluginRegistry.registerPlugin(plugin);
        if (!registered) {
          console.error(`No se pudo registrar el plugin: ${pluginId}`);
          
          // Quitar de plugins en activación
          this._activatingPlugins.delete(pluginId);
          
          return false;
        }
      }
      
      // Si ya está activo, no hacer nada
      if (pluginRegistry.isPluginActive(pluginId)) {
        console.warn(`Plugin ya activo: ${pluginId}`);
        
        // Quitar de plugins en activación
        this._activatingPlugins.delete(pluginId);
        
        return true;
      }
      
      // Validar seguridad del plugin (añadido en Fase 6)
      if (this.securityInitialized) {
        const securityValidation = pluginSecurityManager.validatePlugin(pluginId);
        
        if (!securityValidation.valid) {
          console.error(`No se puede activar plugin por razones de seguridad: ${securityValidation.reasons.join(', ')}`);
          
          // Publicar evento
          this._publishEvent('securityViolation', {
            pluginId,
            reason: 'Validación de seguridad fallida',
            details: securityValidation,
            severity: 'medium'
          });
          
          // Quitar de plugins en activación
          this._activatingPlugins.delete(pluginId);
          
          return false;
        }
        
        // Validar permisos solicitados
        if (plugin.permissions) {
          const permissionsValidation = pluginPermissionChecker.validatePermissions(
            pluginId, 
            plugin.permissions
          );
          
          // Si hay permisos pendientes y estamos en nivel alto, rechazar
          if (permissionsValidation.pendingPermissions.length > 0 && 
              this.securityLevel === PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH) {
            console.error(`No se puede activar plugin que requiere permisos manuales en nivel de seguridad alto`);
            
            // Publicar evento
            this._publishEvent('permissionDenied', {
              pluginId,
              permissions: permissionsValidation.pendingPermissions,
              reason: 'Nivel de seguridad alto no permite aprobación manual'
            });
            
            // Quitar de plugins en activación
            this._activatingPlugins.delete(pluginId);
            
            return false;
          }
        }
      }
      
      // Verificar que todas las dependencias estén activadas
      const dependencies = plugin.dependencies || [];
      
      if (dependencies.length > 0) {
        for (const dependency of dependencies) {
          const depId = typeof dependency === 'string' ? dependency : dependency.id;
          
          if (!depId) continue;
          
          // Verificar si la dependencia existe
          const depPlugin = pluginRegistry.getPlugin(depId);
          
          if (!depPlugin) {
            console.error(`Dependencia ${depId} no encontrada para el plugin ${pluginId}`);
            
            // Publicar evento de error de dependencia
            this._publishEvent('dependencyError', {
              pluginId,
              dependencyId: depId,
              reason: 'Dependencia no encontrada'
            });
            
            // Quitar de plugins en activación
            this._activatingPlugins.delete(pluginId);
            
            return false;
          }
          
          // Verificar si la dependencia está activa
          if (!pluginRegistry.isPluginActive(depId)) {
            console.log(`Activando dependencia ${depId} para el plugin ${pluginId}`);
            
            // Activar dependencia recursivamente
            const depActivated = await this.activatePlugin(depId);
            
            if (!depActivated) {
              console.error(`No se pudo activar la dependencia ${depId} para el plugin ${pluginId}`);
              
              // Publicar evento de error de dependencia
              this._publishEvent('dependencyError', {
                pluginId,
                dependencyId: depId,
                reason: 'No se pudo activar la dependencia'
              });
              
              // Quitar de plugins en activación
              this._activatingPlugins.delete(pluginId);
              
              return false;
            }
          }
        }
      }
      
      // Activar el plugin usando sandbox para mayor seguridad (modificado en Fase 6)
      let activated = false;
      
      try {
        if (this.securityInitialized) {
          // Usar el sandbox para activar el plugin
          const finishOperation = pluginResourceMonitor.trackOperation(pluginId, 'activation');
          
          activated = await pluginSandbox.executeSandboxed(
            pluginId,
            () => pluginRegistry.activatePlugin(pluginId, coreAPI),
            [], // Sin argumentos adicionales
            null // Usar contexto predeterminado
          );
          
          finishOperation();
        } else {
          // Activación normal sin sandbox
          activated = pluginRegistry.activatePlugin(pluginId, coreAPI);
        }
      } catch (activationError) {
        console.error(`Error durante la activación del plugin ${pluginId}:`, activationError);
        
        // Registrar en auditoría si está disponible
        if (this.securityInitialized) {
          pluginSecurityAudit.recordPluginDeactivation(pluginId, {
            action: 'activation_failed',
            error: activationError.message,
            timestamp: Date.now()
          });
        }
        
        // Quitar de plugins en activación
        this._activatingPlugins.delete(pluginId);
        
        return false;
      }
      
      if (activated) {
        // Registrar la API pública si existe
        if (plugin.publicAPI) {
          pluginAPIRegistry.registerAPI(pluginId, plugin.publicAPI);
        }
        
        // Actualizar estado y guardar
        pluginRegistry.setPluginState(pluginId, { active: true, lastActivated: Date.now() });
        await this._savePluginStates();
        
        // Publicar evento
        this._publishEvent('pluginActivated', { pluginId, plugin });
        
        // Registrar evento en auditoría (añadido en Fase 6)
        if (this.securityInitialized) {
          pluginSecurityAudit.recordValidationResult(pluginId, {
            event: 'activation',
            success: true,
            timestamp: Date.now()
          });
        }
      }
      
      // Quitar de plugins en activación
      this._activatingPlugins.delete(pluginId);
      
      return activated;
    } catch (error) {
      console.error(`Error al activar plugin [${pluginId}]:`, error);
      
      // Quitar de plugins en activación
      this._activatingPlugins.delete(pluginId);
      
      // Publicar evento de error
      this._publishEvent('error', { 
        pluginId, 
        operation: 'activate',
        error: error.message || 'Error desconocido'
      });
      
      return false;
    }
  }

  /**
   * Desactiva un plugin por su ID
   * @param {string} pluginId - ID del plugin a desactivar
   * @param {boolean} force - Si es true, ignora las dependencias
   * @returns {Promise<boolean>} - true si se desactivó correctamente
   */
  async deactivatePlugin(pluginId, force = false) {
    if (!this.initialized) {
      console.error('El gestor de plugins no está inicializado');
      return false;
    }
    
    try {
      // Verificar si está activo
      if (!pluginRegistry.isPluginActive(pluginId)) {
        console.warn(`Plugin no activo: ${pluginId}`);
        return true;
      }
      
      // Obtener plugin antes de desactivarlo
      const plugin = pluginRegistry.getPlugin(pluginId);
      
      // Si no es forzado, verificar que ningún plugin activo dependa de este
      if (!force) {
        const dependentPlugins = pluginDependencyResolver.getDependentPlugins(pluginId);
        const activeDependent = dependentPlugins.filter(depId => pluginRegistry.isPluginActive(depId));
        
        if (activeDependent.length > 0) {
          console.error(`No se puede desactivar plugin ${pluginId} porque ${activeDependent.length} plugins dependen de él`);
          
          // Publicar evento de error de dependencia
          this._publishEvent('dependencyError', {
            pluginId,
            dependent: activeDependent,
            reason: 'Otros plugins activos dependen de este'
          });
          
          return false;
        }
      }
      
      // Eliminar la API pública si existe
      pluginAPIRegistry.unregisterAPI(pluginId);
      
      // Limpiar canales de comunicación
      pluginCommunication.clearPluginResources(pluginId);
      
      // Desactivar el plugin usando sandbox si está disponible (modificado en Fase 6)
      let deactivated = false;
      
      try {
        if (this.securityInitialized) {
          // Usar el sandbox para desactivar el plugin
          const finishOperation = pluginResourceMonitor.trackOperation(pluginId, 'deactivation');
          
          // Intentar con sandbox, pero con timeout
          const cleanupPromise = pluginSandbox.executeSandboxed(
            pluginId,
            () => pluginRegistry.deactivatePlugin(pluginId),
            [], // Sin argumentos adicionales
            null // Usar contexto predeterminado
          );
          
          // Añadir timeout
          const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => resolve(false), 5000); // 5 segundos de timeout
          });
          
          // Esperar la primera promesa que se resuelva
          deactivated = await Promise.race([cleanupPromise, timeoutPromise]);
          
          // Si hubo timeout, desactivar de forma forzada
          if (!deactivated) {
            console.warn(`Timeout en desactivación de plugin ${pluginId}, forzando desactivación`);
            deactivated = pluginRegistry.deactivatePlugin(pluginId);
          }
          
          finishOperation();
        } else {
          // Desactivación normal sin sandbox
          deactivated = pluginRegistry.deactivatePlugin(pluginId);
        }
      } catch (deactivationError) {
        console.error(`Error durante la desactivación del plugin ${pluginId}:`, deactivationError);
        
        // Si es forzado, intentar deactivar de todas formas
        if (force) {
          deactivated = pluginRegistry.deactivatePlugin(pluginId);
        } else {
          return false;
        }
      }
      
      if (deactivated) {
        // Limpiar recursos del plugin en la API
        await coreAPI.cleanupPluginResources(pluginId);
        
        // Limpiar recursos de seguridad si está disponible (añadido en Fase 6)
        if (this.securityInitialized) {
          // No eliminamos datos de auditoría, solo desactivamos monitoreo
          pluginResourceMonitor.decreaseMonitoring(pluginId);
          pluginResourceMonitor.removeRestrictions(pluginId);
        }
        
        // Actualizar estado y guardar
        pluginRegistry.setPluginState(pluginId, { active: false, lastDeactivated: Date.now() });
        await this._savePluginStates();
        
        // Publicar evento
        this._publishEvent('pluginDeactivated', { pluginId, plugin });
        
        // Registrar evento en auditoría (añadido en Fase 6)
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
      
      // Publicar evento de error
      this._publishEvent('error', { 
        pluginId, 
        operation: 'deactivate',
        error: error.message || 'Error desconocido'
      });
      
      // Si es forzado, intentar deactivar de todas formas
      if (force) {
        try {
          return pluginRegistry.deactivatePlugin(pluginId);
        } catch (forceError) {
          console.error(`Error al forzar desactivación de plugin ${pluginId}:`, forceError);
          return false;
        }
      }
      
      return false;
    }
  }

  /**
   * Obtiene todos los plugins disponibles
   * @returns {Object[]} - Array de plugins
   */
  getAllPlugins() {
    if (!this.initialized) {
      console.warn('El gestor de plugins no está inicializado');
      return [];
    }
    
    const plugins = pluginRegistry.getAllPlugins();
    
    // Añadir información de compatibilidad
    return plugins.map(plugin => {
      const compatResult = this._compatibilityResults[plugin.id];
      
      // Información base
      const pluginInfo = {
        ...plugin,
        compatible: compatResult ? compatResult.compatible : true,
        incompatibilityReason: compatResult && !compatResult.compatible ? compatResult.reason : null
      };
      
      // Añadir información de seguridad si está disponible (añadido en Fase 6)
      if (this.securityInitialized) {
        const securityInfo = pluginSecurityManager.getPluginSecurityInfo(plugin.id);
        
        // Fusionar información de seguridad
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
   * Obtiene todos los plugins activos
   * @returns {Object[]} - Array de plugins activos
   */
  getActivePlugins() {
    if (!this.initialized) {
      console.warn('El gestor de plugins no está inicializado');
      return [];
    }
    
    return pluginRegistry.getActivePlugins();
  }

  /**
   * Comprueba si un plugin está activo
   * @param {string} pluginId - ID del plugin
   * @returns {boolean} - true si el plugin está activo
   */
  isPluginActive(pluginId) {
    if (!this.initialized) {
      console.warn('El gestor de plugins no está inicializado');
      return false;
    }
    
    return pluginRegistry.isPluginActive(pluginId);
  }

  /**
   * Comprueba si un plugin es compatible
   * @param {string} pluginId - ID del plugin
   * @returns {boolean} - true si el plugin es compatible
   */
  isPluginCompatible(pluginId) {
    if (!this.initialized || !this._compatibilityResults[pluginId]) {
      return true; // Asumir compatibilidad por defecto
    }
    
    return this._compatibilityResults[pluginId].compatible;
  }

  /**
   * Obtiene información de compatibilidad de un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {Object|null} - Información de compatibilidad o null
   */
  getPluginCompatibilityInfo(pluginId) {
    if (!this.initialized || !this._compatibilityResults[pluginId]) {
      return null;
    }
    
    return this._compatibilityResults[pluginId];
  }

  /**
   * Suscribe a eventos del sistema de plugins
   * @param {string} eventName - Nombre del evento sin prefijo
   * @param {Function} callback - Función a llamar cuando ocurra el evento
   * @returns {Function} - Función para cancelar suscripción
   */
  subscribe(eventName, callback) {
    if (typeof callback !== 'function') return () => {};
    
    const id = ++this._lastSubscriberId;
    
    if (!this._subscribers[eventName]) {
      this._subscribers[eventName] = {};
    }
    
    this._subscribers[eventName][id] = callback;
    
    // Devolver función para cancelar suscripción
    return () => {
      if (this._subscribers[eventName] && this._subscribers[eventName][id]) {
        delete this._subscribers[eventName][id];
        
        if (Object.keys(this._subscribers[eventName]).length === 0) {
          delete this._subscribers[eventName];
        }
      }
    };
  }

  /**
   * Recarga todos los plugins disponibles
   * @param {boolean} preserveState - Si se debe preservar el estado de activación
   * @returns {Promise<boolean>} - true si se recargaron correctamente
   */
  async reloadPlugins(preserveState = true) {
    if (!this.initialized) {
      console.error('El gestor de plugins no está inicializado');
      return false;
    }
    
    try {
      // Guardar IDs y estados de plugins activos
      const activePlugins = preserveState ? pluginRegistry.getActivePlugins() : [];
      const activePluginIds = activePlugins.map(p => p.id);
      
      // Desactivar todos los plugins activos
      for (const plugin of activePlugins) {
        await this.deactivatePlugin(plugin.id);
      }
      
      // Volver a cargar los plugins
      const plugins = await loadPlugins();
      
      // Limpiar registro existente
      pluginRegistry.clear();
      
      // Limpiar compatibilidad
      this._compatibilityResults = {};
      
      // Limpiar API registry
      pluginAPIRegistry.clearAll();
      
      // Registrar nuevos plugins encontrados
      let registeredCount = 0;
      for (const plugin of plugins) {
        const success = pluginRegistry.registerPlugin(plugin);
        if (success) registeredCount++;
      }
      
      // Verificar compatibilidad de los plugins
      await this._verifyPluginCompatibility();
      
      // Cargar estados desde almacenamiento
      await this._loadPluginStates();
      
      console.log(`Plugins recargados. ${registeredCount} plugins registrados.`);
      
      // Reactivar los plugins que estaban activos
      if (preserveState) {
        // Recalcular orden de carga
        const loadOrder = pluginDependencyResolver.calculateLoadOrder();
        const sortedActivePluginIds = loadOrder.filter(id => activePluginIds.includes(id));
        
        let activatedCount = 0;
        for (const pluginId of sortedActivePluginIds) {
          // Verificar si está en lista negra (añadido en Fase 6)
          if (this.securityInitialized && pluginSecurityManager.isPluginBlacklisted(pluginId)) {
            console.warn(`Plugin ${pluginId} no se reactivará porque está en lista negra`);
            continue;
          }
          
          // Verificar si es compatible antes de reactivar
          if (this.isPluginCompatible(pluginId)) {
            const success = await this.activatePlugin(pluginId);
            if (success) activatedCount++;
          } else {
            console.warn(`Plugin ${pluginId} no se reactivará por incompatibilidad: ${this._compatibilityResults[pluginId]?.reason}`);
          }
        }
        
        console.log(`${activatedCount}/${sortedActivePluginIds.length} plugins reactivados.`);
      }
      
      // Publicar evento
      this._publishEvent('pluginsReloaded', { 
        count: registeredCount,
        reactivated: preserveState ? activePluginIds : []
      });
      
      return true;
    } catch (error) {
      console.error('Error al recargar plugins:', error);
      
      // Publicar evento de error
      this._publishEvent('error', { 
        operation: 'reload',
        error: error.message || 'Error desconocido'
      });
      
      return false;
    }
  }

  /**
   * Ejecuta una verificación de compatibilidad para un plugin específico
   * @param {string} pluginId - ID del plugin
   * @returns {Promise<Object>} - Resultado de la verificación
   */
  async checkPluginCompatibility(pluginId) {
    try {
      if (!this.initialized) {
        console.warn('El gestor de plugins no está inicializado');
        return { compatible: false, reason: 'Sistema de plugins no inicializado' };
      }
      
      const plugin = pluginRegistry.getPlugin(pluginId);
      
      if (!plugin) {
        return { compatible: false, reason: 'Plugin no encontrado' };
      }
      
      // Ejecutar verificación completa
      const result = pluginCompatibility.runFullCompatibilityCheck(plugin);
      
      // Actualizar registro interno
      this._compatibilityResults[pluginId] = result;
      
      // Actualizar estado en el registro
      pluginRegistry.setPluginState(pluginId, { 
        compatible: result.compatible,
        incompatibilityReason: result.compatible ? null : result.reason,
        lastCompatibilityCheck: Date.now()
      });
      
      // Verificar seguridad si está disponible (añadido en Fase 6)
      if (this.securityInitialized) {
        const securityResult = pluginSecurityManager.validatePlugin(pluginId);
        
        // Si hay problemas de seguridad, actualizar resultado
        if (!securityResult.valid) {
          result.compatible = false;
          result.reason = `Problemas de seguridad: ${securityResult.reasons.join(', ')}`;
          result.details.security = securityResult;
          
          // Actualizar registro interno
          this._compatibilityResults[pluginId] = result;
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Error al verificar compatibilidad del plugin ${pluginId}:`, error);
      
      const errorResult = {
        compatible: false,
        reason: `Error en verificación: ${error.message}`,
        details: { error: error.message }
      };
      
      // Actualizar registro interno
      this._compatibilityResults[pluginId] = errorResult;
      
      return errorResult;
    }
  }

  /**
   * Obtiene datos del estado actual del sistema de plugins
   * @returns {Object} - Información del estado del sistema
   */
  getStatus() {
    const allPlugins = this.initialized ? pluginRegistry.getAllPlugins() : [];
    const activePlugins = this.initialized ? pluginRegistry.getActivePlugins() : [];
    
    // Información base del sistema
    const status = {
      initialized: this.initialized,
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
      states: this.initialized ? pluginRegistry.getPluginStates() : {},
      cycles: pluginDependencyResolver.getDetectedCycles(),
      apiCount: Object.keys(pluginAPIRegistry.getAPIInfo()).length,
      activeChannels: Object.keys(pluginCommunication.getChannelsInfo()).length
    };
    
    // Añadir información de seguridad si está disponible (añadido en Fase 6)
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
   * Obtiene información detallada sobre las APIs públicas disponibles
   * @returns {Object} - Información sobre APIs disponibles
   */
  getPluginAPIsInfo() {
    if (!this.initialized) {
      return {};
    }

    try {
      return pluginAPIRegistry.getAPIInfo();
    } catch (error) {
      console.error('Error al obtener información de APIs:', error);
      return {};
    }
  }

  /**
   * Obtiene información sobre los canales de comunicación disponibles
   * @returns {Object} - Información sobre canales
   */
  getChannelsInfo() {
    if (!this.initialized) {
      return {};
    }

    try {
      return pluginCommunication.getChannelsInfo();
    } catch (error) {
      console.error('Error al obtener información de canales:', error);
      return {};
    }
  }

  /**
   * Cambia el nivel de seguridad del sistema (añadido en Fase 6)
   * @param {string} level - Nuevo nivel de seguridad
   * @returns {boolean} - true si se cambió correctamente
   */
  setSecurityLevel(level) {
    if (!this.securityInitialized) {
      console.warn('Sistema de seguridad no inicializado');
      return false;
    }
    
    if (!PLUGIN_CONSTANTS.SECURITY.LEVEL[level?.toUpperCase()]) {
      console.error(`Nivel de seguridad inválido: ${level}`);
      return false;
    }
    
    try {
      const newLevel = PLUGIN_CONSTANTS.SECURITY.LEVEL[level.toUpperCase()];
      
      // Cambiar nivel en subsistemas
      pluginSecurityManager.setSecurityLevel(newLevel);
      pluginSandbox.setSecurityLevel(newLevel);
      pluginResourceMonitor.setSecurityLevel(newLevel);
      pluginPermissionChecker.setSecurityLevel(newLevel);
      pluginSecurityAudit.setSecurityLevel(newLevel);
      
      // Actualizar nivel interno
      this.securityLevel = newLevel;
      
      // Guardar configuración
      this._saveSecuritySettings({ securityLevel: newLevel });
      
      // Publicar evento
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
   * Desactiva y pone en lista negra un plugin (añadido en Fase 6)
   * @param {string} pluginId - ID del plugin
   * @param {string} reason - Razón para la lista negra
   * @returns {boolean} - true si se completó correctamente
   */
  async blacklistPlugin(pluginId, reason) {
    if (!this.securityInitialized) {
      console.warn('Sistema de seguridad no inicializado');
      return false;
    }
    
    try {
      // Desactivar primero si está activo
      if (pluginRegistry.isPluginActive(pluginId)) {
        await this.deactivatePlugin(pluginId, true);
      }
      
      // Añadir a lista negra
      const result = pluginSecurityManager.blacklistPlugin(pluginId);
      
      if (result) {
        // Registrar en auditoría
        pluginSecurityAudit.recordBlacklistAction(pluginId, {
          action: 'add',
          reason,
          timestamp: Date.now()
        });
        
        // Publicar evento
        this._publishEvent('pluginBlacklisted', {
          pluginId,
          reason
        });
      }
      
      return result;
    } catch (error) {
      console.error(`Error al poner en lista negra el plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Elimina un plugin de la lista negra (añadido en Fase 6)
   * @param {string} pluginId - ID del plugin
   * @returns {boolean} - true si se completó correctamente
   */
  whitelistPlugin(pluginId) {
    if (!this.securityInitialized) {
      console.warn('Sistema de seguridad no inicializado');
      return false;
    }
    
    try {
      // Quitar de lista negra
      const result = pluginSecurityManager.whitelistPlugin(pluginId);
      
      if (result) {
        // Registrar en auditoría
        pluginSecurityAudit.recordBlacklistAction(pluginId, {
          action: 'remove',
          timestamp: Date.now()
        });
        
        // Publicar evento
        this._publishEvent('pluginWhitelisted', {
          pluginId
        });
      }
      
      return result;
    } catch (error) {
      console.error(`Error al quitar de lista negra el plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Aprueba permisos pendientes para un plugin (añadido en Fase 6)
   * @param {string} pluginId - ID del plugin
   * @param {Array} permissions - Permisos a aprobar
   * @returns {boolean} - true si se completó correctamente
   */
  approvePluginPermissions(pluginId, permissions) {
    if (!this.securityInitialized) {
      console.warn('Sistema de seguridad no inicializado');
      return false;
    }
    
    try {
      // Aprobar permisos
      const result = pluginPermissionChecker.approvePermissions(pluginId, permissions);
      
      if (result) {
        // Registrar en auditoría
        pluginSecurityAudit.recordValidationResult(pluginId, {
          event: 'permissionApproved',
          permissions,
          timestamp: Date.now()
        });
        
        // Publicar evento
        this._publishEvent('permissionGranted', {
          pluginId,
          permissions
        });
      }
      
      return result;
    } catch (error) {
      console.error(`Error al aprobar permisos para el plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Rechaza permisos pendientes para un plugin (añadido en Fase 6)
   * @param {string} pluginId - ID del plugin
   * @param {Array} permissions - Permisos a rechazar
   * @returns {boolean} - true si se completó correctamente
   */
  rejectPluginPermissions(pluginId, permissions) {
    if (!this.securityInitialized) {
      console.warn('Sistema de seguridad no inicializado');
      return false;
    }
    
    try {
      // Rechazar permisos
      const result = pluginPermissionChecker.rejectPermissions(pluginId, permissions);
      
      if (result) {
        // Registrar en auditoría
        pluginSecurityAudit.recordValidationResult(pluginId, {
          event: 'permissionRejected',
          permissions,
          timestamp: Date.now()
        });
        
        // Publicar evento
        this._publishEvent('permissionDenied', {
          pluginId,
          permissions
        });
      }
      
      return result;
    } catch (error) {
      console.error(`Error al rechazar permisos para el plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Obtiene información de seguridad detallada para un plugin (añadido en Fase 6)
   * @param {string} pluginId - ID del plugin
   * @returns {Object} - Información de seguridad
   */
  getPluginSecurityInfo(pluginId) {
    if (!this.securityInitialized) {
      return {
        securityEnabled: false
      };
    }
    
    try {
      // Obtener información básica
      const securityInfo = pluginSecurityManager.getPluginSecurityInfo(pluginId);
      
      // Obtener información adicional
      const resourceUsage = pluginResourceMonitor.getPluginResourceUsage(pluginId);
      const permissionsInfo = pluginPermissionChecker.getPluginPermissions(pluginId);
      const auditHistory = pluginSecurityAudit.getPluginAuditHistory(pluginId);
      const sandboxErrors = pluginSandbox.getSandboxErrors(pluginId);
      
      // Combinar toda la información
      return {
        securityEnabled: true,
        ...securityInfo,
        resourceUsage,
        permissions: permissionsInfo,
        auditHistory: auditHistory.slice(0, 20), // Limitar a 20 entradas
        sandboxErrors,
        securityLevel: this.securityLevel
      };
    } catch (error) {
      console.error(`Error al obtener información de seguridad para el plugin ${pluginId}:`, error);
      
      return {
        securityEnabled: true,
        error: error.message,
        securityLevel: this.securityLevel
      };
    }
  }

  /**
   * Obtiene solicitudes de permisos pendientes (añadido en Fase 6)
   * @returns {Array} - Lista de solicitudes pendientes
   */
  getPendingPermissionRequests() {
    if (!this.securityInitialized) {
      return [];
    }
    
    try {
      return pluginPermissionChecker.getPendingPermissionRequests();
    } catch (error) {
      console.error('Error al obtener solicitudes de permisos pendientes:', error);
      return [];
    }
  }

  /**
   * Obtiene estadísticas de seguridad (añadido en Fase 6)
   * @returns {Object} - Estadísticas de seguridad
   */
  getSecurityStats() {
    if (!this.securityInitialized) {
      return {
        securityEnabled: false
      };
    }
    
    try {
      // Obtener estadísticas de cada subsistema
      const managerStats = pluginSecurityManager.getSecurityStats();
      const resourceStats = pluginResourceMonitor.getResourceStats();
      const permissionStats = pluginPermissionChecker.getPermissionStats();
      const auditStats = pluginSecurityAudit.getAuditStats();
      const sandboxStats = pluginSandbox.getStats();
      
      // Combinar estadísticas
      return {
        securityEnabled: true,
        securityLevel: this.securityLevel,
        activeChecks: Array.from(managerStats.activeChecks || []),
        threats: managerStats.detectedThreats,
        blacklistedPlugins: managerStats.blacklistedPlugins,
        pluginsWithWarnings: managerStats.pluginsWithWarnings,
        pendingPermissions: permissionStats.pendingRequests,
        resourceOveruse: resourceStats.recentViolations,
        securityEvents: auditStats.totalEntries,
        recentAuditEvents: auditStats.recentEvents,
        sandboxErrors: sandboxStats.totalErrors
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de seguridad:', error);
      
      return {
        securityEnabled: true,
        securityLevel: this.securityLevel,
        error: error.message
      };
    }
  }
}

// Exportar instancia única
const pluginManager = new PluginManager();
export default pluginManager;