/**
 * Servicio de almacenamiento abstracto para Atlas
 * 
 * Proporciona una interfaz unificada para operaciones de almacenamiento
 * independientemente de la plataforma (web o escritorio)
 */

import eventBus, { EventCategories } from '../core/bus/event-bus';
import { STORAGE_KEYS } from '../core/config/constants';

// Detectar si estamos en entorno Electron
const isElectron = () => {
  return window && window.process && window.process.type;
};

class StorageService {
  constructor() {
    this.storageAdapter = null;
    this.initStorage();
  }

  /**
   * Inicializa el adaptador de almacenamiento adecuado según la plataforma
   */
  initStorage() {
    try {
      if (isElectron()) {
        // En entorno Electron, usar ElectronStore
        this.initElectronStore();
      } else {
        // En entorno web, usar localStorage
        this.initLocalStorage();
      }

      console.log('Servicio de almacenamiento inicializado correctamente');
    } catch (error) {
      console.error('Error al inicializar el servicio de almacenamiento:', error);
      // Fallback a localStorage si hay algún problema
      this.initLocalStorage();
    }
  }

  /**
   * Inicializa el adaptador para localStorage (web)
   */
  initLocalStorage() {
    this.storageAdapter = {
      get: (key, defaultValue) => {
        try {
          const value = localStorage.getItem(key);
          return value !== null ? JSON.parse(value) : defaultValue;
        } catch (error) {
          console.error(`Error al obtener ${key} de localStorage:`, error);
          return defaultValue;
        }
      },
      set: (key, value) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch (error) {
          console.error(`Error al guardar ${key} en localStorage:`, error);
          return false;
        }
      },
      remove: (key) => {
        try {
          localStorage.removeItem(key);
          return true;
        } catch (error) {
          console.error(`Error al eliminar ${key} de localStorage:`, error);
          return false;
        }
      },
      clear: () => {
        try {
          localStorage.clear();
          return true;
        } catch (error) {
          console.error('Error al limpiar localStorage:', error);
          return false;
        }
      }
    };
  }

  /**
   * Inicializa el adaptador para Electron Store (escritorio)
   * Nota: Este método se completa cuando se detecta el entorno Electron
   */
  initElectronStore() {
    // Verificar si estamos en Electron y el API está disponible
    if (isElectron() && window.electron && window.electron.store) {
      this.storageAdapter = {
        get: async (key, defaultValue) => {
          try {
            const value = await window.electron.store.get(key);
            return value !== undefined ? value : defaultValue;
          } catch (error) {
            console.error(`Error al obtener ${key} de ElectronStore:`, error);
            return defaultValue;
          }
        },
        set: async (key, value) => {
          try {
            await window.electron.store.set(key, value);
            return true;
          } catch (error) {
            console.error(`Error al guardar ${key} en ElectronStore:`, error);
            return false;
          }
        },
        remove: async (key) => {
          try {
            await window.electron.store.delete(key);
            return true;
          } catch (error) {
            console.error(`Error al eliminar ${key} de ElectronStore:`, error);
            return false;
          }
        },
        clear: async () => {
          try {
            await window.electron.store.clear();
            return true;
          } catch (error) {
            console.error('Error al limpiar ElectronStore:', error);
            return false;
          }
        }
      };
    } else {
      // Fallback a localStorage si no está disponible Electron Store
      console.warn('ElectronStore no disponible, usando localStorage como fallback');
      this.initLocalStorage();
    }
  }

  /**
   * Obtiene un valor del almacenamiento
   * @param {string} key - Clave para identificar el valor
   * @param {any} defaultValue - Valor por defecto si no existe la clave
   * @returns {Promise<any>} - Valor almacenado o defaultValue
   */
  async get(key, defaultValue = null) {
    if (!this.storageAdapter) {
      console.error('Storage no inicializado correctamente');
      return defaultValue;
    }

    try {
      const result = await this.storageAdapter.get(key, defaultValue);
      return result;
    } catch (error) {
      console.error(`Error en get(${key}):`, error);
      return defaultValue;
    }
  }

  /**
   * Guarda un valor en el almacenamiento
   * @param {string} key - Clave para identificar el valor
   * @param {any} value - Valor a almacenar
   * @returns {Promise<boolean>} - true si el guardado fue exitoso
   */
  async set(key, value) {
    if (!this.storageAdapter) {
      console.error('Storage no inicializado correctamente');
      return false;
    }

    try {
      const result = await this.storageAdapter.set(key, value);
      
      // Publicar evento de cambio en almacenamiento
      if (result) {
        eventBus.publish(`${EventCategories.STORAGE}.dataChanged`, { key, value });
        
        // Publicar eventos específicos para ciertos tipos de datos
        if (key === STORAGE_KEYS.EVENTS) {
          eventBus.publish(`${EventCategories.STORAGE}.eventsUpdated`, value);
        }
      }
      
      return result;
    } catch (error) {
      console.error(`Error en set(${key}):`, error);
      return false;
    }
  }

  /**
   * Elimina un valor del almacenamiento
   * @param {string} key - Clave del valor a eliminar
   * @returns {Promise<boolean>} - true si la eliminación fue exitosa
   */
  async remove(key) {
    if (!this.storageAdapter) {
      console.error('Storage no inicializado correctamente');
      return false;
    }

    try {
      const result = await this.storageAdapter.remove(key);
      
      // Publicar evento de eliminación
      if (result) {
        eventBus.publish(`${EventCategories.STORAGE}.dataRemoved`, { key });
      }
      
      return result;
    } catch (error) {
      console.error(`Error en remove(${key}):`, error);
      return false;
    }
  }

  /**
   * Limpia todo el almacenamiento
   * @returns {Promise<boolean>} - true si la limpieza fue exitosa
   */
  async clear() {
    if (!this.storageAdapter) {
      console.error('Storage no inicializado correctamente');
      return false;
    }

    try {
      const result = await this.storageAdapter.clear();
      
      // Publicar evento de limpieza
      if (result) {
        eventBus.publish(`${EventCategories.STORAGE}.dataCleared`, {});
      }
      
      return result;
    } catch (error) {
      console.error('Error en clear():', error);
      return false;
    }
  }
}

// Exportar una única instancia para toda la aplicación
const storageService = new StorageService();
export default storageService;