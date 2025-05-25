/**
 * Servicio de almacenamiento para plugins
 */
import storageService from '../../services/storage-service';
import eventBus from '../bus/event-bus';

class PluginStorage {
  constructor() {
    this.keyPrefix = 'plugin_data_';
    this.pluginKeys = {}; // Almacena un Set de claves por pluginId
    this.pluginStorageLimit = 1024 * 1024; // 1MB por defecto
    this.pluginDataSizes = {}; // Almacena el tamaño total de datos por pluginId
  }

  _getStorageKey(pluginId, key) {
    return `${this.keyPrefix}${pluginId}_${key}`;
  }

  _registerPluginKey(pluginId, key) {
    if (!this.pluginKeys[pluginId]) {
      this.pluginKeys[pluginId] = new Set();
    }
    this.pluginKeys[pluginId].add(key);
  }

  _estimateSize(value) {
    try {
      if (value === undefined || value === null) {
        return 0;
      }
      return JSON.stringify(value).length * 2; // Aproximación para UTF-16
    } catch (error) {
      console.error("Error estimando tamaño del valor:", error, "Valor:", value);
      return Number.MAX_SAFE_INTEGER; 
    }
  }

  _updatePluginDataSize(pluginId, sizeChange) { 
    if (typeof pluginId !== 'string' || typeof sizeChange !== 'number') {
        return;
    }
    this.pluginDataSizes[pluginId] = (this.pluginDataSizes[pluginId] || 0) + sizeChange;
    
    if (this.pluginDataSizes[pluginId] < 0) {
      this.pluginDataSizes[pluginId] = 0;
    }
  }

  _exceedsStorageLimit(pluginId, sizeDeltaToAdd = 0) {
    const currentSize = this.pluginDataSizes[pluginId] || 0;
    return (currentSize + sizeDeltaToAdd) > this.pluginStorageLimit;
  }

  setStorageLimit(limitInBytes) {
    if (typeof limitInBytes !== 'number' || limitInBytes < 0) { 
      throw new Error('El límite debe ser un número no negativo');
    }
    this.pluginStorageLimit = limitInBytes;
  }

  async setItem(pluginId, key, value) {
    if (!pluginId || typeof pluginId !== 'string' || !key || typeof key !== 'string') {
      console.error('Argumentos inválidos para setItem: pluginId y key son requeridos y deben ser strings.');
      return false;
    }
    
    try {
      const storageKey = this._getStorageKey(pluginId, key);
      const oldValue = await storageService.get(storageKey);
      const oldSize = this._estimateSize(oldValue);
      const newSize = this._estimateSize(value);
      const sizeDelta = newSize - oldSize;

      if (this._exceedsStorageLimit(pluginId, sizeDelta)) { 
        console.error(`Plugin ${pluginId} ha excedido su límite de almacenamiento. Actual: ${this.pluginDataSizes[pluginId] || 0}, Intento añadir delta: ${sizeDelta}, Límite: ${this.pluginStorageLimit}`);
        eventBus.publish('pluginSystem.storageLimitExceeded', {
          pluginId,
          currentSize: this.pluginDataSizes[pluginId] || 0,
          attemptedValueSize: newSize,
          limit: this.pluginStorageLimit
        });
        return false;
      }
            
      const result = await storageService.set(storageKey, value);
      
      if (result) {
        this._registerPluginKey(pluginId, key);
        this._updatePluginDataSize(pluginId, sizeDelta);
        
        eventBus.publish('pluginSystem.storageChanged', {
          pluginId,
          key,
          action: 'set'
        });
      }
      
      return result;
    } catch (error) {
      console.error(`Error al guardar datos para plugin ${pluginId}, clave ${key}:`, error);
      return false;
    }
  }

  async getItem(pluginId, key, defaultValue = null) {
    if (!pluginId || typeof pluginId !== 'string' || !key || typeof key !== 'string') {
      console.error('Argumentos inválidos para getItem: pluginId y key son requeridos y deben ser strings.');
      return defaultValue;
    }
    
    try {
      const storageKey = this._getStorageKey(pluginId, key);
      const storedValue = await storageService.get(storageKey);

      let valueToReturn;
      if (storedValue === undefined) {
        valueToReturn = defaultValue;
      } else {
        valueToReturn = storedValue;
      }
      
      if (storedValue !== undefined) {
        const isNewKeyForSizing = !this.pluginKeys[pluginId] || !this.pluginKeys[pluginId]?.has(key);
        this._registerPluginKey(pluginId, key);

        if (isNewKeyForSizing) {
          const valueSize = this._estimateSize(storedValue);
          this._updatePluginDataSize(pluginId, valueSize); 
        }
      }
      
      return valueToReturn;
    } catch (error) {
      console.error(`Error al recuperar datos para plugin ${pluginId}, clave ${key}:`, error);
      return defaultValue;
    }
  }

  async removeItem(pluginId, key) {
    if (!pluginId || typeof pluginId !== 'string' || !key || typeof key !== 'string') {
      console.error('Argumentos inválidos para removeItem: pluginId y key son requeridos y deben ser strings.');
      return false;
    }
    
    try {
      const storageKey = this._getStorageKey(pluginId, key);
      const currentValue = await storageService.get(storageKey);
      let sizeToDecrease = 0;

      if (currentValue !== undefined && this.pluginKeys[pluginId] && this.pluginKeys[pluginId].has(key)) {
        sizeToDecrease = this._estimateSize(currentValue);
      }
      
      const result = await storageService.remove(storageKey);
      
      if (result) {
        if (this.pluginKeys[pluginId]) {
          this.pluginKeys[pluginId].delete(key);
          this._updatePluginDataSize(pluginId, -sizeToDecrease); 

          if (this.pluginKeys[pluginId].size === 0) {
            delete this.pluginKeys[pluginId];
            delete this.pluginDataSizes[pluginId];
          }
        }
        
        eventBus.publish('pluginSystem.storageChanged', {
          pluginId,
          key,
          action: 'remove'
        });
      }
      
      return result;
    } catch (error) {
      console.error(`Error al eliminar datos para plugin ${pluginId}, clave ${key}:`, error);
      return false;
    }
  }

  async getKeys(pluginId) {
    if (!pluginId || typeof pluginId !== 'string') {
      console.error('ID de plugin inválido para getKeys');
      return [];
    }
    return this.pluginKeys[pluginId] ? Array.from(this.pluginKeys[pluginId]) : [];
  }

  async clearPluginData(pluginId) {
    if (!pluginId || typeof pluginId !== 'string') {
      console.error('ID de plugin inválido para clearPluginData');
      return false;
    }
    
    try {
      const keys = this.pluginKeys[pluginId] ? Array.from(this.pluginKeys[pluginId]) : [];
      
      for (const key of keys) {
        const storageKey = this._getStorageKey(pluginId, key);
        await storageService.remove(storageKey);
      }
      
      delete this.pluginKeys[pluginId];
      delete this.pluginDataSizes[pluginId]; 
      
      eventBus.publish('pluginSystem.storageCleared', { pluginId });
      
      return true;
    } catch (error) {
      console.error(`Error al limpiar datos del plugin ${pluginId}:`, error);
      return false;
    }
  }

  getPluginDataSize(pluginId) {
    if (!pluginId || typeof pluginId !== 'string') return 0;
    return this.pluginDataSizes[pluginId] || 0;
  }

  getStorageUsagePercentage(pluginId) {
    if (!pluginId || typeof pluginId !== 'string') return 0;
    
    const size = this.pluginDataSizes[pluginId] || 0;
    if (this.pluginStorageLimit === 0) return size > 0 ? 100 : 0;
    return Math.round((size / this.pluginStorageLimit) * 100);
  }
}

const pluginStorage = new PluginStorage();
export default pluginStorage;