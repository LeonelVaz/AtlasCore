// preload.js
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

// Imprimir para confirmar que se expuso la API
console.log('API expuesta: electronAPI');