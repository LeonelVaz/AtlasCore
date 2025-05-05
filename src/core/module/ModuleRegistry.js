/**
 * Sistema de Registro de Módulos
 * 
 * Permite registrar componentes como módulos del sistema y mantener
 * referencias a las APIs expuestas por cada módulo.
 */

/**
 * Registra un nuevo módulo en el sistema
 * @param {string} moduleName - Nombre único del módulo
 * @param {Object} moduleAPI - Objeto con métodos y propiedades que expone el módulo
 * @returns {boolean} - true si el registro fue exitoso, false en caso contrario
 */
export function registerModule(moduleName, moduleAPI) {
  if (!window.__appModules) {
    window.__appModules = {};
  }
  
  // Verificar si el módulo ya existe
  if (window.__appModules[moduleName]) {
    console.warn(`El módulo ${moduleName} ya está registrado. Se sobrescribirá.`);
  }
  
  // Registrar el módulo
  window.__appModules[moduleName] = moduleAPI;
  console.log(`Módulo ${moduleName} registrado correctamente`);
  
  return true;
}

/**
 * Obtiene la API de un módulo registrado
 * @param {string} moduleName - Nombre del módulo
 * @returns {Object|null} - API del módulo o null si no existe
 */
export function getModule(moduleName) {
  if (!window.__appModules || !window.__appModules[moduleName]) {
    console.warn(`El módulo ${moduleName} no está registrado`);
    return null;
  }
  
  return window.__appModules[moduleName];
}

/**
 * Verifica si un módulo está registrado
 * @param {string} moduleName - Nombre del módulo
 * @returns {boolean} - true si el módulo está registrado, false en caso contrario
 */
export function isModuleRegistered(moduleName) {
  return !!(window.__appModules && window.__appModules[moduleName]);
}

/**
 * Elimina un módulo del registro
 * @param {string} moduleName - Nombre del módulo
 * @returns {boolean} - true si se eliminó correctamente, false en caso contrario
 */
export function unregisterModule(moduleName) {
  if (!window.__appModules || !window.__appModules[moduleName]) {
    console.warn(`No se puede eliminar: el módulo ${moduleName} no está registrado`);
    return false;
  }
  
  delete window.__appModules[moduleName];
  console.log(`Módulo ${moduleName} eliminado correctamente`);
  
  return true;
}

/**
 * Obtiene la lista de todos los módulos registrados
 * @returns {string[]} - Array con los nombres de los módulos registrados
 */
export function getRegisteredModules() {
  if (!window.__appModules) {
    return [];
  }
  
  return Object.keys(window.__appModules);
}