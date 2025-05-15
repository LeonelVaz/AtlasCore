/**
 * Sistema de permisos para plugins
 * 
 * Gestiona los permisos que cada plugin puede solicitar y utilizar,
 * proporcionando un sistema de control de acceso para funcionalidades sensibles.
 */

// Definición de permisos disponibles
export const PERMISSIONS = {
  // Permisos de almacenamiento
  'storage.read': {
    name: 'Leer datos propios',
    description: 'Leer datos guardados por el propio plugin',
    defaultGrant: true,
    dangerLevel: 'low'
  },
  'storage.write': {
    name: 'Escribir datos propios',
    description: 'Guardar datos del propio plugin',
    defaultGrant: true,
    dangerLevel: 'low'
  },
  
  // Permisos de calendario
  'calendar.read': {
    name: 'Leer eventos del calendario',
    description: 'Ver todos los eventos del calendario',
    defaultGrant: true,
    dangerLevel: 'medium'
  },
  'calendar.write': {
    name: 'Modificar eventos del calendario',
    description: 'Crear, editar o eliminar eventos del calendario',
    defaultGrant: false,
    dangerLevel: 'high'
  },
  
  // Permisos de extensión UI
  'ui.registerComponents': {
    name: 'Añadir elementos a la interfaz',
    description: 'Añadir botones, controles u otros elementos visuales',
    defaultGrant: true,
    dangerLevel: 'medium'
  },
  
  // Permisos avanzados
  'system.modules': {
    name: 'Acceso a módulos del sistema',
    description: 'Interactuar con módulos internos del sistema',
    defaultGrant: false,
    dangerLevel: 'high'
  },
  'network.external': {
    name: 'Comunicación externa',
    description: 'Comunicarse con servicios externos (futuro)',
    defaultGrant: false,
    dangerLevel: 'high'
  }
};

/**
 * Verifica si un permiso existe
 * @param {string} permissionId - ID del permiso
 * @returns {boolean} - true si existe
 */
export function isValidPermission(permissionId) {
  return !!PERMISSIONS[permissionId];
}

/**
 * Obtiene los detalles de un permiso
 * @param {string} permissionId - ID del permiso
 * @returns {Object|null} - Detalles del permiso o null si no existe
 */
export function getPermissionDetails(permissionId) {
  return PERMISSIONS[permissionId] || null;
}

/**
 * Verifica si un permiso debería concederse por defecto
 * @param {string} permissionId - ID del permiso
 * @returns {boolean} - true si debería concederse por defecto
 */
export function isDefaultGranted(permissionId) {
  return PERMISSIONS[permissionId]?.defaultGrant || false;
}

/**
 * Determina si un conjunto de permisos son todos seguros (nivel bajo)
 * @param {Array} permissionIds - Lista de IDs de permisos
 * @returns {boolean} - true si todos son de nivel bajo
 */
export function arePermissionsSafe(permissionIds) {
  if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
    return true;
  }
  
  return permissionIds.every(permId => {
    const permission = PERMISSIONS[permId];
    return permission && permission.dangerLevel === 'low';
  });
}

/**
 * Determina si algún permiso es de alto riesgo
 * @param {Array} permissionIds - Lista de IDs de permisos
 * @returns {boolean} - true si alguno es de nivel alto
 */
export function hasHighRiskPermissions(permissionIds) {
  if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
    return false;
  }
  
  return permissionIds.some(permId => {
    const permission = PERMISSIONS[permId];
    return permission && permission.dangerLevel === 'high';
  });
}

/**
 * Genera un objeto de permisos concedidos por defecto
 * @returns {Object} - Objeto con pares {permissionId: boolean}
 */
export function getDefaultPermissions() {
  const defaultPermissions = {};
  
  Object.keys(PERMISSIONS).forEach(permId => {
    defaultPermissions[permId] = PERMISSIONS[permId].defaultGrant;
  });
  
  return defaultPermissions;
}

export default PERMISSIONS;