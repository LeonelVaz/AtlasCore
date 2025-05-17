/**
 * Validador de plugins para Atlas
 * 
 * Este módulo se encarga de validar que un plugin cumpla
 * con los requisitos básicos de estructura y metadatos
 */

import { PLUGIN_CONSTANTS } from '../config/constants';
import pluginCompatibility from './plugin-compatibility';
import pluginDependencyResolver from './plugin-dependency-resolver';

/**
 * Valida que un plugin tenga la estructura requerida
 * @param {Object} plugin - Plugin a validar
 * @returns {boolean} - true si el plugin es válido
 */
export function validatePlugin(plugin) {
  try {
    // Verificar que existan las propiedades básicas requeridas
    if (!plugin || typeof plugin !== 'object') {
      console.error('El plugin no es un objeto válido');
      return false;
    }
    
    // Verificar metadatos obligatorios
    if (!validateMetadata(plugin)) {
      return false;
    }
    
    // Verificar métodos esenciales
    if (!validateMethods(plugin)) {
      return false;
    }
    
    // Verificar compatibilidad de versiones
    if (!validateVersionCompatibility(plugin)) {
      return false;
    }
    
    // Verificar dependencias
    if (!validateDependencies(plugin)) {
      return false;
    }
    
    // Verificar declaración de conflictos
    if (!validateConflicts(plugin)) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error al validar plugin:', error);
    return false;
  }
}

/**
 * Valida que el plugin tenga los metadatos requeridos
 * @param {Object} plugin - Plugin a validar
 * @returns {boolean} - true si los metadatos son válidos
 */
function validateMetadata(plugin) {
  // Verificar ID
  if (!plugin.id || typeof plugin.id !== 'string' || plugin.id.trim() === '') {
    console.error('Plugin sin ID válido');
    return false;
  }
  
  // Verificar nombre
  if (!plugin.name || typeof plugin.name !== 'string' || plugin.name.trim() === '') {
    console.error(`Plugin [${plugin.id}] sin nombre válido`);
    return false;
  }
  
  // Verificar versión
  if (!plugin.version || typeof plugin.version !== 'string') {
    console.error(`Plugin [${plugin.id}] sin versión válida`);
    return false;
  }
  
  // Verificar descripción
  if (!plugin.description || typeof plugin.description !== 'string') {
    console.error(`Plugin [${plugin.id}] sin descripción válida`);
    return false;
  }
  
  // Verificar autor
  if (!plugin.author || typeof plugin.author !== 'string') {
    console.error(`Plugin [${plugin.id}] sin autor válido`);
    return false;
  }
  
  return true;
}

/**
 * Valida que el plugin tenga los métodos requeridos
 * @param {Object} plugin - Plugin a validar
 * @returns {boolean} - true si los métodos son válidos
 */
function validateMethods(plugin) {
  // Verificar método init
  if (!plugin.init || typeof plugin.init !== 'function') {
    console.error(`Plugin [${plugin.id}] sin método 'init' válido`);
    return false;
  }
  
  // Verificar método cleanup
  if (!plugin.cleanup || typeof plugin.cleanup !== 'function') {
    console.error(`Plugin [${plugin.id}] sin método 'cleanup' válido`);
    return false;
  }
  
  return true;
}

/**
 * Valida que la versión del plugin sea compatible con la versión de la aplicación
 * @param {Object} plugin - Plugin a validar
 * @returns {boolean} - true si la versión es compatible
 */
function validateVersionCompatibility(plugin) {
  // Verificar versión mínima
  if (!plugin.minAppVersion || typeof plugin.minAppVersion !== 'string') {
    console.error(`Plugin [${plugin.id}] sin versión mínima especificada`);
    return false;
  }
  
  // Verificar versión máxima
  if (!plugin.maxAppVersion || typeof plugin.maxAppVersion !== 'string') {
    console.error(`Plugin [${plugin.id}] sin versión máxima especificada`);
    return false;
  }
  
  // Realizar verificación completa
  const compatibility = pluginCompatibility.checkAppCompatibility(plugin);
  if (!compatibility.compatible) {
    console.error(`Plugin [${plugin.id}] incompatible: ${compatibility.reason}`);
    return false;
  }
  
  return true;
}

/**
 * Valida las dependencias declaradas del plugin
 * @param {Object} plugin - Plugin a validar
 * @returns {boolean} - true si las dependencias son válidas
 */
function validateDependencies(plugin) {
  // Si no hay dependencias declaradas, es válido
  if (!plugin.dependencies) return true;
  
  // Verificar que sea un array
  if (!Array.isArray(plugin.dependencies)) {
    console.error(`Plugin [${plugin.id}] con dependencias declaradas en formato inválido`);
    return false;
  }
  
  // Verificar cada dependencia
  for (const dependency of plugin.dependencies) {
    // Formato simple (string)
    if (typeof dependency === 'string') {
      if (!dependency.trim()) {
        console.error(`Plugin [${plugin.id}] contiene una dependencia con ID vacío`);
        return false;
      }
      continue;
    }
    
    // Formato completo (objeto)
    if (typeof dependency !== 'object' || !dependency) {
      console.error(`Plugin [${plugin.id}] contiene una dependencia en formato inválido`);
      return false;
    }
    
    // Verificar ID
    if (!dependency.id || typeof dependency.id !== 'string' || !dependency.id.trim()) {
      console.error(`Plugin [${plugin.id}] contiene una dependencia sin ID válido`);
      return false;
    }
    
    // Verificar versión mínima
    if (!dependency.version || typeof dependency.version !== 'string') {
      console.error(`Plugin [${plugin.id}] contiene una dependencia sin versión especificada`);
      return false;
    }
  }
  
  return true;
}

/**
 * Valida la declaración de conflictos del plugin
 * @param {Object} plugin - Plugin a validar
 * @returns {boolean} - true si la declaración de conflictos es válida
 */
function validateConflicts(plugin) {
  // Si no hay conflictos declarados, es válido
  if (!plugin.conflicts) return true;
  
  // Verificar que sea un array
  if (!Array.isArray(plugin.conflicts)) {
    console.error(`Plugin [${plugin.id}] con conflictos declarados en formato inválido`);
    return false;
  }
  
  // Verificar cada conflicto
  for (const conflict of plugin.conflicts) {
    // Formato simple (string)
    if (typeof conflict === 'string') {
      if (!conflict.trim()) {
        console.error(`Plugin [${plugin.id}] contiene un conflicto con ID vacío`);
        return false;
      }
      continue;
    }
    
    // Formato completo (objeto)
    if (typeof conflict !== 'object' || !conflict) {
      console.error(`Plugin [${plugin.id}] contiene un conflicto en formato inválido`);
      return false;
    }
    
    // Verificar ID
    if (!conflict.id || typeof conflict.id !== 'string' || !conflict.id.trim()) {
      console.error(`Plugin [${plugin.id}] contiene un conflicto sin ID válido`);
      return false;
    }
    
    // Verificar razón (opcional pero recomendada)
    if (conflict.reason && typeof conflict.reason !== 'string') {
      console.error(`Plugin [${plugin.id}] contiene un conflicto con razón inválida`);
      return false;
    }
  }
  
  return true;
}

/**
 * Compara dos versiones en formato semántico
 * @param {string} v1 - Primera versión
 * @param {string} v2 - Segunda versión
 * @returns {number} - -1 si v1<v2, 0 si v1=v2, 1 si v1>v2
 */
export function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    
    if (p1 < p2) return -1;
    if (p1 > p2) return 1;
  }
  
  return 0;
}

/**
 * Realiza una validación completa del plugin
 * @param {Object} plugin - Plugin a validar
 * @returns {Object} - Resultado detallado de la validación
 */
export function validatePluginComplete(plugin) {
  try {
    if (!plugin || typeof plugin !== 'object') {
      return {
        valid: false,
        reason: 'El plugin no es un objeto válido',
        details: {}
      };
    }
    
    // Resultados por categoría
    const results = {
      metadata: validateMetadata(plugin),
      methods: validateMethods(plugin),
      compatibility: validateVersionCompatibility(plugin),
      dependencies: validateDependencies(plugin),
      conflicts: validateConflicts(plugin)
    };
    
    // Validez general
    const isValid = Object.values(results).every(result => result === true);
    
    // Determinar razón principal si no es válido
    let mainReason = '';
    if (!results.metadata) mainReason = 'Metadatos inválidos';
    else if (!results.methods) mainReason = 'Métodos requeridos faltantes';
    else if (!results.compatibility) mainReason = 'Incompatible con la versión de la aplicación';
    else if (!results.dependencies) mainReason = 'Declaración de dependencias inválida';
    else if (!results.conflicts) mainReason = 'Declaración de conflictos inválida';
    
    // Obtener información detallada de compatibilidad
    const compatDetails = isValid ? 
      pluginCompatibility.runFullCompatibilityCheck(plugin) : 
      { compatible: false, details: {} };
    
    return {
      valid: isValid && compatDetails.compatible,
      reason: isValid ? (compatDetails.compatible ? 'Plugin válido' : compatDetails.reason) : mainReason,
      details: {
        basicValidation: results,
        compatibility: compatDetails
      }
    };
  } catch (error) {
    console.error(`Error en validación completa del plugin ${plugin?.id}:`, error);
    return {
      valid: false,
      reason: `Error en validación: ${error.message}`,
      details: {
        error: error.message
      }
    };
  }
}