/**
 * Utilidad para detectar el entorno Electron
 * 
 * Esta función está separada para facilitar los tests
 */

/**
 * Verifica si la aplicación está ejecutándose en entorno Electron
 * @returns {boolean} true si estamos en Electron
 */
export function isElectronEnv() {
  return typeof window !== 'undefined' && 
         typeof window.electronAPI !== 'undefined';
}