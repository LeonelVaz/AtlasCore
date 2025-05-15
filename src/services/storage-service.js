/**
 * Servicio de almacenamiento abstracto unificado (web o escritorio)
 */

import eventBus, { EventCategories } from '../core/bus/event-bus';
import { STORAGE_KEYS } from '../core/config/constants';

// Detectar entorno Electron
const isElectron = () => window && window.process && window.process.type;

class StorageService {
  constructor() {
    this.storageAdapter = null;
    this.initStorage();
  }

  initStorage() {
    try {
      isElectron() ? this.initElectronStore() : this.initLocalStorage();
    } catch (error) {
      console.error('Error al inicializar almacenamiento:', error);
      this.initLocalStorage(); // Fallback a localStorage
    }
  }

  initLocalStorage() {
    this.storageAdapter = {
      get: (key, defaultValue) => {
        try {
          const value = localStorage.getItem(key);
          return value !== null ? JSON.parse(value) : defaultValue;
        } catch (error) {
          return defaultValue;
        }
      },
      
      set: (key, value) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch (error) {
          return false;
        }
      },
      
      remove: (key) => {
        try {
          localStorage.removeItem(key);
          return true;
        } catch (error) {
          return false;
        }
      },
      
      clear: () => {
        try {
          localStorage.clear();
          return true;
        } catch (error) {
          return false;
        }
      }
    };
  }

  initElectronStore() {
    if (isElectron() && window.electron?.store) {
      this.storageAdapter = {
        get: async (key, defaultValue) => {
          try {
            const value = await window.electron.store.get(key);
            return value !== undefined ? value : defaultValue;
          } catch (error) {
            return defaultValue;
          }
        },
        
        set: async (key, value) => {
          try {
            await window.electron.store.set(key, value);
            return true;
          } catch (error) {
            return false;
          }
        },
        
        remove: async (key) => {
          try {
            await window.electron.store.delete(key);
            return true;
          } catch (error) {
            return false;
          }
        },
        
        clear: async () => {
          try {
            await window.electron.store.clear();
            return true;
          } catch (error) {
            return false;
          }
        }
      };
    } else {
      this.initLocalStorage();
    }
  }

  async get(key, defaultValue = null) {
    if (!this.storageAdapter) return defaultValue;

    try {
      return await this.storageAdapter.get(key, defaultValue);
    } catch (error) {
      return defaultValue;
    }
  }

  async set(key, value) {
    if (!this.storageAdapter) return false;

    try {
      const result = await this.storageAdapter.set(key, value);
      
      if (result) {
        eventBus.publish(`${EventCategories.STORAGE}.dataChanged`, { key, value });
        
        if (key === STORAGE_KEYS.EVENTS) {
          eventBus.publish(`${EventCategories.STORAGE}.eventsUpdated`, value);
        }
      }
      
      return result;
    } catch (error) {
      return false;
    }
  }

  async remove(key) {
    if (!this.storageAdapter) return false;

    try {
      const result = await this.storageAdapter.remove(key);
      
      if (result) {
        eventBus.publish(`${EventCategories.STORAGE}.dataRemoved`, { key });
      }
      
      return result;
    } catch (error) {
      return false;
    }
  }

  async clear() {
    if (!this.storageAdapter) return false;

    try {
      const result = await this.storageAdapter.clear();
      
      if (result) {
        eventBus.publish(`${EventCategories.STORAGE}.dataCleared`, {});
      }
      
      return result;
    } catch (error) {
      return false;
    }
  }
}

// Exportar instancia única
const storageService = new StorageService();
export default storageService;