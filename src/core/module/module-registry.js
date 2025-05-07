/**
 * Module Registry - Sistema básico de registro de módulos
 * 
 * Permite registrar módulos y sus APIs para la interoperabilidad
 * entre diferentes partes de la aplicación.
 */

// Inicializar el registro global de módulos si no existe
if (typeof window !== 'undefined' && !window.__appModules) {
  window.__appModules = {};
}

/**
 * Registra un módulo en el sistema
 * @param {string} moduleName - Nombre único del módulo
 * @param {Object} moduleApi - API pública que expone el módulo
 * @returns {boolean} - true si el registro fue exitoso
 */
export function registerModule(moduleName, moduleApi) {
  if (typeof window === 'undefined') {
    console.error('No se puede registrar el módulo fuera del entorno del navegador');
    return false;
  }
  
  // Verificar si el módulo ya está registrado
  if (window.__appModules[moduleName]) {
    console.warn(`El módulo ${moduleName} ya está registrado. Se sobrescribirá.`);
  }
  
  // Registrar el módulo
  window.__appModules[moduleName] = moduleApi;
  console.log(`Módulo ${moduleName} registrado correctamente`);
  return true;
}

/**
 * Obtiene la API de un módulo registrado
 * @param {string} moduleName - Nombre del módulo
 * @returns {Object|null} - API del módulo o null si no existe
 */
export function getModule(moduleName) {
  if (typeof window === 'undefined' || !window.__appModules[moduleName]) {
    console.warn(`El módulo ${moduleName} no está disponible`);
    return null;
  }
  
  return window.__appModules[moduleName];
}

/**
 * Verifica si un módulo está registrado
 * @param {string} moduleName - Nombre del módulo
 * @returns {boolean} - true si el módulo está registrado
 */
export function isModuleRegistered(moduleName) {
  return typeof window !== 'undefined' && !!window.__appModules[moduleName];
}

/**
 * Elimina un módulo previamente registrado
 * @param {string} moduleName - Nombre del módulo a eliminar
 * @returns {boolean} - true si el módulo fue eliminado, false si no existía
 */
export function unregisterModule(moduleName) {
  if (typeof window === 'undefined' || !window.__appModules || !window.__appModules[moduleName]) {
    console.warn(`El módulo ${moduleName} no está registrado, no se puede eliminar.`);
    return false;
  }
  
  // Eliminar el módulo del registro
  delete window.__appModules[moduleName];
  console.log(`Módulo ${moduleName} eliminado correctamente`);
  return true;
}