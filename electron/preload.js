// preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Imprimir para depuración
console.log('Preload script ejecutándose');

// Exponer una API simplificada
contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-control', 'minimize'),
  maximize: () => ipcRenderer.send('window-control', 'maximize'),
  close: () => ipcRenderer.send('window-control', 'close')
});

// Imprimir para confirmar que se expuso la API
console.log('API expuesta: electronAPI');

