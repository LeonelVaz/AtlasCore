/**
 * Utilidad para detectar el entorno Electron
 */

/**
 * Verifica si la aplicación está ejecutándose en entorno Electron
 */
export function isElectronEnv() {
  return typeof window !== 'undefined' && 
         window !== null &&
         typeof window.electronAPI !== 'undefined';
}