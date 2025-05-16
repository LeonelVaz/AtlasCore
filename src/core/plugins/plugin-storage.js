/**
 * Servicio de almacenamiento específico para plugins
 * 
 * Proporciona una interfaz unificada para almacenar y recuperar
 * datos de los plugins de forma segura y aislada
 */

import storageService from '../../services/storage-service';
import eventBus from '../bus/event-bus';

/**
 * Clase para gestionar el almacenamiento específico de plugins
 */
class PluginStorage {
  constructor() {
    // Prefijo para las claves de almacenamiento de plugins
    this.keyPrefix = 'plugin_data_';
    
    // Registro de claves por plugin para facilitar limpieza
    this.pluginKeys = {};
    
    // Límite de almacenamiento por plugin (en bytes)
    this.pluginStorageLimit = 1024 * 1024; // 1MB por defecto
    
    // Mapa de tamaños aproximados de datos por plugin
    this.pluginDataSizes = {};
  }

  /**
   * Genera una clave de almacenamiento prefijada para un plugin
   * @param {string} pluginId - ID del plugin
   * @param {string} key - Clave original
   * @returns {string} - Clave prefijada
   * @private
   */
  _getStorageKey(pluginId, key) {
    return `${this.keyPrefix}${pluginId}_${key}`;
  }

  /**
   * Registra una clave utilizada por un plugin
   * @param {string} pluginId - ID del plugin
   * @param {string} key - Clave utilizada
   * @private
   */
  _registerPluginKey(pluginId, key) {
    if (!this.pluginKeys[pluginId]) {
      this.pluginKeys[pluginId] = new Set();
    }
    
    this.pluginKeys[pluginId].add(key);
  }

  /**
   * Estima el tamaño en bytes de un valor
   * @param {*} value - Valor a estimar
   * @returns {number} - Tamaño aproximado en bytes
   * @private
   */
  _estimateSize(value) {
    try {
      const jsonString = JSON.stringify(value);
      return jsonString.length * 2; // Aproximación para UTF-16
    } catch (error) {
      return 1024; // Valor por defecto si no se puede estimar
    }
  }

  /**
   * Actualiza el registro de tamaño de datos para un plugin
   * @param {string} pluginId - ID del plugin
   * @param {number} size - Tamaño a añadir o restar (negativo)
   * @private
   */
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

  /**
   * Verifica si un plugin ha excedido su límite de almacenamiento
   * @param {string} pluginId - ID del plugin
   * @param {number} additionalSize - Tamaño adicional a considerar
   * @returns {boolean} - true si excede el límite
   * @private
   */
  _exceedsStorageLimit(pluginId, additionalSize = 0) {
    const currentSize = this.pluginDataSizes[pluginId] || 0;
    return (currentSize + additionalSize) > this.pluginStorageLimit;
  }

  /**
   * Establece el límite de almacenamiento para todos los plugins
   * @param {number} limitInBytes - Límite en bytes
   */
  setStorageLimit(limitInBytes) {
    if (typeof limitInBytes !== 'number' || limitInBytes <= 0) {
      throw new Error('El límite debe ser un número positivo');
    }
    
    this.pluginStorageLimit = limitInBytes;
  }

  /**
   * Guarda un valor en el almacenamiento
   * @param {string} pluginId - ID del plugin
   * @param {string} key - Clave
   * @param {*} value - Valor a guardar
   * @returns {Promise<boolean>} - true si se guardó correctamente
   */
  async setItem(pluginId, key, value) {
    if (!pluginId || !key) {
      console.error('Argumentos inválidos para setItem');
      return false;
    }
    
    try {
      // Estimar el tamaño del nuevo valor
      const valueSize = this._estimateSize(value);
      
      // Comprobar si excede el límite
      if (this._exceedsStorageLimit(pluginId, valueSize)) {
        console.error(`El plugin ${pluginId} ha excedido su límite de almacenamiento`);
        
        // Publicar evento de límite excedido
        eventBus.publish('pluginSystem.storageLimitExceeded', {
          pluginId,
          currentSize: this.pluginDataSizes[pluginId] || 0,
          attemptedSize: valueSize,
          limit: this.pluginStorageLimit
        });
        
        return false;
      }
      
      // Crear clave completa
      const storageKey = this._getStorageKey(pluginId, key);
      
      // Obtener valor anterior para calcular diferencia de tamaño
      const oldValue = await storageService.get(storageKey);
      const oldSize = oldValue !== undefined ? this._estimateSize(oldValue) : 0;
      
      // Guardar el valor
      const result = await storageService.set(storageKey, value);
      
      if (result) {
        // Registrar la clave
        this._registerPluginKey(pluginId, key);
        
        // Actualizar tamaño registrado
        this._updatePluginDataSize(pluginId, valueSize - oldSize);
        
        // Publicar evento de cambio
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

  /**
   * Recupera un valor del almacenamiento
   * @param {string} pluginId - ID del plugin
   * @param {string} key - Clave
   * @param {*} defaultValue - Valor por defecto si no existe
   * @returns {Promise<*>} - Valor recuperado o defaultValue
   */
  async getItem(pluginId, key, defaultValue = null) {
    if (!pluginId || !key) {
      console.error('Argumentos inválidos para getItem');
      return defaultValue;
    }
    
    try {
      // Crear clave completa
      const storageKey = this._getStorageKey(pluginId, key);
      
      // Obtener el valor
      const value = await storageService.get(storageKey, defaultValue);
      
      // Si el valor existe y no está registrado, registrar la clave
      if (value !== defaultValue) {
        this._registerPluginKey(pluginId, key);
        
        // Actualizar tamaño aproximado si no estaba registrado
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

  /**
   * Elimina un valor del almacenamiento
   * @param {string} pluginId - ID del plugin
   * @param {string} key - Clave
   * @returns {Promise<boolean>} - true si se eliminó correctamente
   */
  async removeItem(pluginId, key) {
    if (!pluginId || !key) {
      console.error('Argumentos inválidos para removeItem');
      return false;
    }
    
    try {
      // Crear clave completa
      const storageKey = this._getStorageKey(pluginId, key);
      
      // Obtener valor actual para actualizar tamaño
      const currentValue = await storageService.get(storageKey);
      const currentSize = currentValue !== undefined ? this._estimateSize(currentValue) : 0;
      
      // Eliminar el valor
      const result = await storageService.remove(storageKey);
      
      if (result) {
        // Actualizar registro de claves
        if (this.pluginKeys[pluginId]) {
          this.pluginKeys[pluginId].delete(key);
        }
        
        // Actualizar tamaño registrado
        this._updatePluginDataSize(pluginId, -currentSize);
        
        // Publicar evento de cambio
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

  /**
   * Obtiene todas las claves utilizadas por un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {Promise<Array<string>>} - Array de claves
   */
  async getKeys(pluginId) {
    if (!pluginId) {
      console.error('ID de plugin inválido');
      return [];
    }
    
    try {
      // Si tenemos un registro, lo usamos
      if (this.pluginKeys[pluginId]) {
        return Array.from(this.pluginKeys[pluginId]);
      }
      
      // Si no hay registro, intentamos reconstruirlo (operación más lenta)
      this.pluginKeys[pluginId] = new Set();
      
      // Esta es una implementación simplificada
      // En un entorno real, habría que escanear el almacenamiento
      return [];
    } catch (error) {
      console.error(`Error al obtener claves del plugin ${pluginId}:`, error);
      return [];
    }
  }

  /**
   * Elimina todos los datos almacenados de un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {Promise<boolean>} - true si se eliminaron correctamente
   */
  async clearPluginData(pluginId) {
    if (!pluginId) {
      console.error('ID de plugin inválido');
      return false;
    }
    
    try {
      // Obtener todas las claves del plugin
      const keys = await this.getKeys(pluginId);
      
      // Eliminar cada valor uno por uno
      for (const key of keys) {
        await this.removeItem(pluginId, key);
      }
      
      // Limpiar registro de claves
      delete this.pluginKeys[pluginId];
      
      // Reiniciar contador de tamaño
      this.pluginDataSizes[pluginId] = 0;
      
      // Publicar evento de limpieza
      eventBus.publish('pluginSystem.storageCleared', {
        pluginId
      });
      
      return true;
    } catch (error) {
      console.error(`Error al limpiar datos del plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Obtiene el tamaño aproximado de datos almacenados por un plugin
   * @param {string} pluginId - ID del plugin
   * @returns {number} - Tamaño en bytes
   */
  getPluginDataSize(pluginId) {
    if (!pluginId) return 0;
    return this.pluginDataSizes[pluginId] || 0;
  }

  /**
   * Obtiene el porcentaje de uso del límite de almacenamiento
   * @param {string} pluginId - ID del plugin
   * @returns {number} - Porcentaje de uso (0-100)
   */
  getStorageUsagePercentage(pluginId) {
    if (!pluginId) return 0;
    
    const size = this.pluginDataSizes[pluginId] || 0;
    return Math.round((size / this.pluginStorageLimit) * 100);
  }
}

// Exportar instancia única
const pluginStorage = new PluginStorage();
export default pluginStorage;