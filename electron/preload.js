/**
 * Script de precarga para Electron
 * 
 * Expone APIs seguras desde el proceso principal al proceso de renderizado
 */

const { contextBridge, ipcRenderer } = require('electron');
const Store = require('electron-store');

// Crear instancia de Electron Store
const store = new Store({
  name: 'atlas-data',
  // Esquema de validación básico
  schema: {
    atlas_events: {
      type: 'array',
      default: []
    },
    atlas_settings: {
      type: 'object',
      default: {}
    }
  }
});

// Exponer APIs seguras al proceso de renderizado
contextBridge.exposeInMainWorld('electron', {
  // API para interactuar con el sistema de almacenamiento
  store: {
    get: (key) => {
      return store.get(key);
    },
    set: (key, value) => {
      store.set(key, value);
      return true;
    },
    delete: (key) => {
      store.delete(key);
      return true;
    },
    clear: () => {
      store.clear();
      return true;
    }
  },
  
  // API para interactuar con el sistema de ventanas
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close')
  }
});