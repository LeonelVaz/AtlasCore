/**
 * Sistema de compatibilidad para plugins de Atlas
 * 
 * Este módulo se encarga de verificar la compatibilidad entre plugins
 * y con la aplicación principal, así como gestionar conflictos.
 */

import { compareVersions } from './plugin-validator';
import pluginRegistry from './plugin-registry';
import { PLUGIN_CONSTANTS } from '../config/constants';
import eventBus from '../bus/event-bus';

/**
 * Clase para gestionar la compatibilidad entre plugins
 */
class PluginCompatibility {
  constructor() {
    this.appVersion = PLUGIN_CONSTANTS.CURRENT_APP_VERSION || '0.4.0';
    this.incompatibilities = {};
    this.conflicts = {};
  }

  /**
   * Verifica la compatibilidad de un plugin con la aplicación
   * @param {Object} plugin - Plugin a verificar
   * @returns {Object} - Resultado de la verificación con detalles
   */
  checkAppCompatibility(plugin) {
    if (!plugin || !plugin.id) {
      return {
        compatible: false,
        reason: 'Plugin inválido'
      };
    }

    try {
      // Verificar versión mínima
      if (!plugin.minAppVersion || typeof plugin.minAppVersion !== 'string') {
        return {
          compatible: false,
          reason: 'No se especificó la versión mínima de la aplicación'
        };
      }

      // Verificar versión máxima
      if (!plugin.maxAppVersion || typeof plugin.maxAppVersion !== 'string') {
        return {
          compatible: false,
          reason: 'No se especificó la versión máxima de la aplicación'
        };
      }

      // Verificar rango de compatibilidad
      if (compareVersions(this.appVersion, plugin.minAppVersion) < 0) {
        return {
          compatible: false,
          reason: `El plugin requiere la versión ${plugin.minAppVersion} o superior (actual: ${this.appVersion})`
        };
      }

      if (compareVersions(this.appVersion, plugin.maxAppVersion) > 0) {
        return {
          compatible: false,
          reason: `El plugin solo es compatible hasta la versión ${plugin.maxAppVersion} (actual: ${this.appVersion})`
        };
      }

      return {
        compatible: true
      };
    } catch (error) {
      console.error(`Error al verificar compatibilidad del plugin ${plugin.id}:`, error);
      return {
        compatible: false,
        reason: `Error al verificar compatibilidad: ${error.message}`
      };
    }
  }

  /**
   * Verifica las dependencias de un plugin
   * @param {Object} plugin - Plugin a verificar
   * @returns {Object} - Resultado de la verificación con detalles
   */
  checkDependencies(plugin) {
    if (!plugin || !plugin.id) {
      return {
        satisfied: false,
        missing: [],
        reason: 'Plugin inválido'
      };
    }

    try {
      // Si no hay dependencias, está satisfecho
      if (!plugin.dependencies || !Array.isArray(plugin.dependencies) || plugin.dependencies.length === 0) {
        return {
          satisfied: true,
          missing: []
        };
      }

      // Verificar cada dependencia
      const missingDependencies = [];
      const versionMismatches = [];

      for (const dependency of plugin.dependencies) {
        // Verificar formato correcto de dependencia
        if (!dependency.id || !dependency.version) {
          missingDependencies.push({
            id: dependency.id || 'desconocido',
            reason: 'Formato de dependencia inválido'
          });
          continue;
        }

        // Verificar si la dependencia está registrada
        const dependencyPlugin = pluginRegistry.getPlugin(dependency.id);
        if (!dependencyPlugin) {
          missingDependencies.push({
            id: dependency.id,
            version: dependency.version,
            reason: 'Plugin no encontrado'
          });
          continue;
        }

        // Verificar versión de dependencia
        if (compareVersions(dependencyPlugin.version, dependency.version) < 0) {
          versionMismatches.push({
            id: dependency.id,
            required: dependency.version,
            actual: dependencyPlugin.version,
            reason: `Se requiere versión ${dependency.version} o superior`
          });
          continue;
        }
      }

      // Combinar resultados
      const allMissing = [...missingDependencies, ...versionMismatches];
      return {
        satisfied: allMissing.length === 0,
        missing: allMissing,
        reason: allMissing.length > 0 ? 
          `Faltan ${allMissing.length} dependencias` : null
      };
    } catch (error) {
      console.error(`Error al verificar dependencias del plugin ${plugin.id}:`, error);
      return {
        satisfied: false,
        missing: [],
        reason: `Error al verificar dependencias: ${error.message}`
      };
    }
  }

  /**
   * Verifica si un plugin tiene conflictos con otros plugins activos
   * @param {Object} plugin - Plugin a verificar
   * @returns {Object} - Resultado de la verificación con detalles
   */
  checkConflicts(plugin) {
    if (!plugin || !plugin.id) {
      return {
        hasConflicts: true,
        conflicts: [],
        reason: 'Plugin inválido'
      };
    }

    try {
      // Si no hay definición de conflictos, no hay conflicto
      if (!plugin.conflicts || !Array.isArray(plugin.conflicts) || plugin.conflicts.length === 0) {
        return {
          hasConflicts: false,
          conflicts: []
        };
      }

      // Verificar cada posible conflicto con plugins activos
      const activePlugins = pluginRegistry.getActivePlugins();
      const foundConflicts = [];

      for (const conflict of plugin.conflicts) {
        // Verificar formato correcto
        if (typeof conflict !== 'string' && (!conflict.id || !conflict.reason)) {
          continue;
        }

        const conflictId = typeof conflict === 'string' ? conflict : conflict.id;
        const conflictReason = typeof conflict === 'string' ? 
          'Conflicto declarado con este plugin' : conflict.reason;

        // Verificar si el plugin conflictivo está activo
        const isActiveConflict = activePlugins.some(p => p.id === conflictId);
        
        if (isActiveConflict) {
          foundConflicts.push({
            id: conflictId,
            reason: conflictReason
          });
        }
      }

      return {
        hasConflicts: foundConflicts.length > 0,
        conflicts: foundConflicts,
        reason: foundConflicts.length > 0 ? 
          `Conflicto con ${foundConflicts.length} plugins activos` : null
      };
    } catch (error) {
      console.error(`Error al verificar conflictos del plugin ${plugin.id}:`, error);
      return {
        hasConflicts: true,
        conflicts: [],
        reason: `Error al verificar conflictos: ${error.message}`
      };
    }
  }

  /**
   * Verifica si los plugins activos tienen conflictos con un plugin específico
   * @param {Object} plugin - Plugin a verificar
   * @returns {Object} - Resultado de la verificación con detalles
   */
  checkReversedConflicts(plugin) {
    if (!plugin || !plugin.id) {
      return {
        hasConflicts: true,
        conflicts: [],
        reason: 'Plugin inválido'
      };
    }

    try {
      const activePlugins = pluginRegistry.getActivePlugins();
      const reversedConflicts = [];

      // Verificar si algún plugin activo declara conflicto con este
      for (const activePlugin of activePlugins) {
        if (!activePlugin.conflicts || !Array.isArray(activePlugin.conflicts)) {
          continue;
        }

        // Buscar si este plugin está en la lista de conflictos
        const conflictEntry = activePlugin.conflicts.find(conflict => {
          if (typeof conflict === 'string') {
            return conflict === plugin.id;
          }
          return conflict.id === plugin.id;
        });

        if (conflictEntry) {
          reversedConflicts.push({
            id: activePlugin.id,
            name: activePlugin.name,
            reason: typeof conflictEntry === 'string' ? 
              'Conflicto declarado con este plugin' : 
              conflictEntry.reason
          });
        }
      }

      return {
        hasConflicts: reversedConflicts.length > 0,
        conflicts: reversedConflicts,
        reason: reversedConflicts.length > 0 ? 
          `${reversedConflicts.length} plugins activos declaran conflicto con este plugin` : null
      };
    } catch (error) {
      console.error(`Error al verificar conflictos inversos del plugin ${plugin.id}:`, error);
      return {
        hasConflicts: true,
        conflicts: [],
        reason: `Error al verificar conflictos inversos: ${error.message}`
      };
    }
  }

  /**
   * Realiza un chequeo completo de compatibilidad para un plugin
   * @param {Object} plugin - Plugin a verificar
   * @returns {Object} - Resultado completo de la verificación
   */
  runFullCompatibilityCheck(plugin) {
    if (!plugin || !plugin.id) {
      return {
        pluginId: 'desconocido',
        compatible: false,
        reason: 'Plugin inválido'
      };
    }

    try {
      const appCompat = this.checkAppCompatibility(plugin);
      const dependencies = this.checkDependencies(plugin);
      const conflicts = this.checkConflicts(plugin);
      const reversedConflicts = this.checkReversedConflicts(plugin);

      // Determinar compatibilidad general
      const isCompatible = appCompat.compatible && 
                          dependencies.satisfied && 
                          !conflicts.hasConflicts && 
                          !reversedConflicts.hasConflicts;

      // Determinar razón principal de incompatibilidad
      let reason = '';
      if (!appCompat.compatible) {
        reason += appCompat.reason + '; ';
      }
      if (!dependencies.satisfied) {
        reason += dependencies.reason + '; ';
      }
      if (conflicts.hasConflicts) {
        reason += conflicts.reason + '; ';
      }
      if (reversedConflicts.hasConflicts) {
        reason += reversedConflicts.reason + '; ';
      }

      // Almacenar para referencia futura
      if (!isCompatible) {
        this.incompatibilities[plugin.id] = {
          reason: reason.trim(),
          details: {
            appCompat,
            dependencies,
            conflicts,
            reversedConflicts
          },
          timestamp: Date.now()
        };
      } else {
        // Limpiar incompatibilidades previas
        delete this.incompatibilities[plugin.id];
      }

      // Almacenar conflictos para referencia
      if (conflicts.hasConflicts || reversedConflicts.hasConflicts) {
        this.conflicts[plugin.id] = {
          declared: conflicts.conflicts,
          reversed: reversedConflicts.conflicts,
          timestamp: Date.now()
        };
      } else {
        // Limpiar conflictos previos
        delete this.conflicts[plugin.id];
      }

      // Publicar evento de compatibilidad
      eventBus.publish('pluginSystem.compatibilityChecked', {
        pluginId: plugin.id,
        compatible: isCompatible,
        reason: reason.trim(),
        details: {
          appCompat,
          dependencies,
          conflicts,
          reversedConflicts
        }
      });

      return {
        pluginId: plugin.id,
        compatible: isCompatible,
        reason: isCompatible ? 'Compatible' : reason,
        details: {
          appCompat,
          dependencies,
          conflicts,
          reversedConflicts
        }
      };
    } catch (error) {
      console.error(`Error en verificación completa de compatibilidad del plugin ${plugin.id}:`, error);
      
      this.incompatibilities[plugin.id] = {
        reason: `Error en verificación: ${error.message}`,
        timestamp: Date.now()
      };

      return {
        pluginId: plugin.id,
        compatible: false,
        reason: `Error en verificación: ${error.message}`,
        details: {
          error: error.message
        }
      };
    }
  }

  /**
   * Obtiene la información de incompatibilidad para un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {Object|null} - Información de incompatibilidad o null
   */
  getIncompatibilityInfo(pluginId) {
    return this.incompatibilities[pluginId] || null;
  }

  /**
   * Obtiene la información de conflictos para un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {Object|null} - Información de conflictos o null
   */
  getConflictInfo(pluginId) {
    return this.conflicts[pluginId] || null;
  }

  /**
   * Obtiene todos los plugins incompatibles registrados
   * @returns {Object} - Mapa de plugins incompatibles con sus razones
   */
  getAllIncompatibilities() {
    return { ...this.incompatibilities };
  }

  /**
   * Obtiene todos los conflictos entre plugins registrados
   * @returns {Object} - Mapa de conflictos entre plugins
   */
  getAllConflicts() {
    return { ...this.conflicts };
  }

  /**
   * Limpia registros de incompatibilidades y conflictos
   */
  clear() {
    this.incompatibilities = {};
    this.conflicts = {};
  }
}

// Exportar instancia única
const pluginCompatibility = new PluginCompatibility();
export default pluginCompatibility;