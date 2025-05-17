/**
 * Servicio de almacenamiento para plugins
 */
import storageService from '../../services/storage-service';
import eventBus from '../bus/event-bus';

class PluginStorage {
  constructor() {
    this.keyPrefix = 'plugin_data_';
    this.pluginKeys = {};
    this.pluginStorageLimit = 1024 * 1024; // 1MB por defecto
    this.pluginDataSizes = {};
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
      return JSON.stringify(value).length * 2; // Aproximación para UTF-16
    } catch (error) {
      return 1024; // Valor por defecto si no se puede estimar
    }
  }

  _updatePluginDataSize(pluginId, size) {
    if (!this.pluginDataSizes[pluginId]) {
      this.pluginDataSizes[pluginId] = 0;
    }
    
    this.pluginDataSizes[pluginId] += size;
    
    // Nunca permitir valores negativos
    if (this.pluginDataSizes[pluginId] < 0) {
      this.pluginDataSizes[pluginId] = 0;
    }
  }

  _exceedsStorageLimit(pluginId, additionalSize = 0) {
    const currentSize = this.pluginDataSizes[pluginId] || 0;
    return (currentSize + additionalSize) > this.pluginStorageLimit;
  }

  setStorageLimit(limitInBytes) {
    if (typeof limitInBytes !== 'number' || limitInBytes <= 0) {
      throw new Error('El límite debe ser un número positivo');
    }
    
    this.pluginStorageLimit = limitInBytes;
  }

  async setItem(pluginId, key, value) {
    if (!pluginId || !key) {
      console.error('Argumentos inválidos para setItem');
      return false;
    }
    
    try {
      const valueSize = this._estimateSize(value);
      
      if (this._exceedsStorageLimit(pluginId, valueSize)) {
        console.error(`Plugin ${pluginId} ha excedido su límite de almacenamiento`);
        
        eventBus.publish('pluginSystem.storageLimitExceeded', {
          pluginId,
          currentSize: this.pluginDataSizes[pluginId] || 0,
          attemptedSize: valueSize,
          limit: this.pluginStorageLimit
        });
        
        return false;
      }
      
      const storageKey = this._getStorageKey(pluginId, key);
      const oldValue = await storageService.get(storageKey);
      const oldSize = oldValue !== undefined ? this._estimateSize(oldValue) : 0;
      
      const result = await storageService.set(storageKey, value);
      
      if (result) {
        this._registerPluginKey(pluginId, key);
        this._updatePluginDataSize(pluginId, valueSize - oldSize);
        
        eventBus.publish('pluginSystem.storageChanged', {
          pluginId,
          key,
          action: 'set'
        });
      }
      
      return result;
    } catch (error) {
      console.error(`Error al guardar datos del plugin ${pluginId}:`, error);
      return false;
    }
  }

  async getItem(pluginId, key, defaultValue = null) {
    if (!pluginId || !key) {
      console.error('Argumentos inválidos para getItem');
      return defaultValue;
    }
    
    try {
      const storageKey = this._getStorageKey(pluginId, key);
      const value = await storageService.get(storageKey, defaultValue);
      
      if (value !== defaultValue) {
        this._registerPluginKey(pluginId, key);
        
        if (!this.pluginDataSizes[pluginId] || !this.pluginKeys[pluginId]?.has(key)) {
          const valueSize = this._estimateSize(value);
          this._updatePluginDataSize(pluginId, valueSize);
        }
      }
      
      return value;
    } catch (error) {
      console.error(`Error al recuperar datos del plugin ${pluginId}:`, error);
      return defaultValue;
    }
  }

  async removeItem(pluginId, key) {
    if (!pluginId || !key) {
      console.error('Argumentos inválidos para removeItem');
      return false;
    }
    
    try {
      const storageKey = this._getStorageKey(pluginId, key);
      const currentValue = await storageService.get(storageKey);
      const currentSize = currentValue !== undefined ? this._estimateSize(currentValue) : 0;
      
      const result = await storageService.remove(storageKey);
      
      if (result) {
        if (this.pluginKeys[pluginId]) {
          this.pluginKeys[pluginId].delete(key);
        }
        
        this._updatePluginDataSize(pluginId, -currentSize);
        
        eventBus.publish('pluginSystem.storageChanged', {
          pluginId,
          key,
          action: 'remove'
        });
      }
      
      return result;
    } catch (error) {
      console.error(`Error al eliminar datos del plugin ${pluginId}:`, error);
      return false;
    }
  }

  async getKeys(pluginId) {
    if (!pluginId) {
      console.error('ID de plugin inválido');
      return [];
    }
    
    try {
      return this.pluginKeys[pluginId] ? Array.from(this.pluginKeys[pluginId]) : [];
    } catch (error) {
      console.error(`Error al obtener claves del plugin ${pluginId}:`, error);
      return [];
    }
  }

  async clearPluginData(pluginId) {
    if (!pluginId) {
      console.error('ID de plugin inválido');
      return false;
    }
    
    try {
      const keys = await this.getKeys(pluginId);
      
      for (const key of keys) {
        await this.removeItem(pluginId, key);
      }
      
      delete this.pluginKeys[pluginId];
      this.pluginDataSizes[pluginId] = 0;
      
      eventBus.publish('pluginSystem.storageCleared', { pluginId });
      
      return true;
    } catch (error) {
      console.error(`Error al limpiar datos del plugin ${pluginId}:`, error);
      return false;
    }
  }

  getPluginDataSize(pluginId) {
    if (!pluginId) return 0;
    return this.pluginDataSizes[pluginId] || 0;
  }

  getStorageUsagePercentage(pluginId) {
    if (!pluginId) return 0;
    
    const size = this.pluginDataSizes[pluginId] || 0;
    return Math.round((size / this.pluginStorageLimit) * 100);
  }
}

const pluginStorage = new PluginStorage();
export default pluginStorage;