/**
 * Module Registry - Sistema de registro de módulos
 */

// Inicializar registro global
if (typeof window !== 'undefined' && !window.__appModules) {
  window.__appModules = {};
}

/**
 * Registra un módulo en el sistema
 */
export function registerModule(moduleName, moduleApi) {
  if (typeof window === 'undefined') {
    console.error('No se puede registrar el módulo fuera del entorno del navegador');
    return false;
  }
  
  window.__appModules[moduleName] = moduleApi;
  return true;
}

/**
 * Obtiene la API de un módulo registrado
 */
export function getModule(moduleName) {
  if (typeof window === 'undefined' || !window.__appModules[moduleName]) {
    return null;
  }
  
  return window.__appModules[moduleName];
}

/**
 * Verifica si un módulo está registrado
 */
export function isModuleRegistered(moduleName) {
  return typeof window !== 'undefined' && !!window.__appModules[moduleName];
}

/**
 * Elimina un módulo previamente registrado
 */
export function unregisterModule(moduleName) {
  if (typeof window === 'undefined' || !window.__appModules || !window.__appModules[moduleName]) {
    return false;
  }
  
  delete window.__appModules[moduleName];
  return true;
}