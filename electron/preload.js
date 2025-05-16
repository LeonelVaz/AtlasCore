// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al proceso de renderizado
contextBridge.exposeInMainWorld('electronAPI', {
  // APIs de control de ventana
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  isFocused: () => ipcRenderer.invoke('window:isFocused'),
  
  // Eventos de ventana
  onMaximizeChange: (callback) => {
    const subscription = (_, maximized) => callback(maximized);
    ipcRenderer.on('window:maximized-change', subscription);
    return () => {
      ipcRenderer.removeListener('window:maximized-change', subscription);
    };
  },
  
  onFocusChange: (callback) => {
    const subscription = (_, focused) => callback(focused);
    ipcRenderer.on('window:focus-change', subscription);
    return () => {
      ipcRenderer.removeListener('window:focus-change', subscription);
    };
  },
  
  // APIs de plugins
  plugins: {
    // Obtener todos los plugins
    getPlugins: () => ipcRenderer.invoke('plugins:getAll'),
    
    // Seleccionar un plugin para instalarlo
    selectPlugin: () => ipcRenderer.invoke('plugins:selectFromFileSystem')
  }
});

// Código de inicialización adicional
console.log('Preload script executed');