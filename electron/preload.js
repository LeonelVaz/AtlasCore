// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Imprimir para depuración
console.log('Preload script ejecutándose');

// Exponer una API simplificada
contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-control', 'minimize'),
  maximize: () => ipcRenderer.send('window-control', 'maximize'),
  close: () => ipcRenderer.send('window-control', 'close'),
  
  // Métodos para la maximización
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onMaximizeChange: (callback) => {
    ipcRenderer.on('maximize-change', (_, isMaximized) => callback(isMaximized));
    return () => ipcRenderer.removeListener('maximize-change', callback);
  },
  
  // Métodos nuevos para el enfoque de la ventana
  isFocused: () => ipcRenderer.invoke('window-is-focused'),
  onFocusChange: (callback) => {
    ipcRenderer.on('focus-change', (_, isFocused) => callback(isFocused));
    return () => ipcRenderer.removeListener('focus-change', callback);
  }
});

// Interceptar y deshabilitar diálogos nativos problemáticos en Electron
// Esto ayuda a prevenir el problema de bloqueo de interfaz
if (typeof window !== 'undefined') {
  // Marcar que estamos en Electron para que la aplicación use diálogos personalizados
  window.__ELECTRON_CUSTOM_DIALOGS__ = true;
  
  // Función para interceptar diálogos nativos durante la carga inicial
  const interceptNativeDialogs = () => {
    // Guardar referencias originales
    const originalAlert = window.alert;
    const originalConfirm = window.confirm;
    const originalPrompt = window.prompt;
    
    // Reemplazar temporalmente hasta que se inicialice el sistema personalizado
    window.alert = (message) => {
      console.warn('[Electron] Alert interceptado (temporal):', message);
      // En lugar de bloquear, loguear el mensaje
      return true;
    };
    
    window.confirm = (message) => {
      console.warn('[Electron] Confirm interceptado (temporal):', message);
      // Por defecto falso para confirmaciones
      return false;
    };
    
    window.prompt = (message, defaultValue) => {
      console.warn('[Electron] Prompt interceptado (temporal):', message);
      // Por defecto null para prompts
      return null;
    };
    
    // Exponer función para restaurar los originales si es necesario
    window.__restoreNativeDialogs = () => {
      window.alert = originalAlert;
      window.confirm = originalConfirm;
      window.prompt = originalPrompt;
      console.log('[Electron] Diálogos nativos restaurados');
    };
    
    // Exponer información sobre el estado
    window.__dialogsIntercepted = true;
    
    console.log('[Electron] Diálogos nativos interceptados temporalmente');
  };
  
  // Aplicar interceptor cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', interceptNativeDialogs);
  } else {
    interceptNativeDialogs();
  }
}

// Imprimir para confirmar que se expuso la API
console.log('API expuesta: electronAPI, diálogos interceptados');