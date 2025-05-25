/**
 * @jest-environment jsdom
 */
import pluginStorage from '../../../../../src/core/plugins/plugin-storage';

// Mockear dependencias
jest.mock('../../../../../src/services/storage-service', () => ({
  get: jest.fn(),
  set: jest.fn(),
  remove: jest.fn(),
}));
jest.mock('../../../../../src/core/bus/event-bus', () => ({
  publish: jest.fn(),
}));

const storageService = require('../../../../../src/services/storage-service');
const eventBus = require('../../../../../src/core/bus/event-bus');

describe('PluginStorage', () => {
  const pluginId = 'testPlugin';
  const testKey = 'testKey';
  const testValue = { data: 'testData' };
  const mockEstimateSize = (value) => {
    if (value === undefined || value === null) return 0;
    try {
      return JSON.stringify(value).length * 2;
    } catch (e) { return 1024;} // Fallback
  }
  const estimatedSize = mockEstimateSize(testValue);

  beforeEach(() => {
    jest.clearAllMocks();
    // Resetear estado interno del singleton
    pluginStorage.pluginKeys = {};
    pluginStorage.pluginDataSizes = {};
    pluginStorage.pluginStorageLimit = 1024 * 1024; // Reset a default

    storageService.get.mockResolvedValue(undefined); // Por defecto, no hay valor
    storageService.set.mockResolvedValue(true);
    storageService.remove.mockResolvedValue(true);
  });

  describe('setItem', () => {
    test('debe guardar un item y actualizar el tamaño de datos', async () => {
      storageService.get.mockResolvedValueOnce(undefined); // No hay valor previo

      const result = await pluginStorage.setItem(pluginId, testKey, testValue);
      
      expect(result).toBe(true);
      expect(storageService.set).toHaveBeenCalledWith(`plugin_data_${pluginId}_${testKey}`, testValue);
      expect(pluginStorage.pluginKeys[pluginId].has(testKey)).toBe(true);
      expect(pluginStorage.pluginDataSizes[pluginId]).toBe(estimatedSize);
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.storageChanged', 
        { pluginId, key: testKey, action: 'set' }
      );
    });

    test('debe actualizar el tamaño correctamente al sobrescribir un item', async () => {
      const oldValue = { old: 'data' };
      const oldSize = mockEstimateSize(oldValue);
      const newValue = { new: 'data updated' };
      const newSize = mockEstimateSize(newValue);

      storageService.get.mockResolvedValueOnce(undefined); 
      await pluginStorage.setItem(pluginId, testKey, oldValue);
      expect(pluginStorage.pluginDataSizes[pluginId]).toBe(oldSize);
      
      storageService.set.mockClear();
      eventBus.publish.mockClear();

      storageService.get.mockResolvedValueOnce(oldValue); 
      const result = await pluginStorage.setItem(pluginId, testKey, newValue); 
      
      expect(result).toBe(true);
      expect(storageService.set).toHaveBeenCalledWith(`plugin_data_${pluginId}_${testKey}`, newValue);
      expect(pluginStorage.pluginDataSizes[pluginId]).toBe(newSize); 
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.storageChanged', 
        { pluginId, key: testKey, action: 'set' }
      );
    });

    test('no debe guardar si se excede el límite de almacenamiento', async () => {
      storageService.get.mockResolvedValueOnce(undefined);
      pluginStorage.setStorageLimit(estimatedSize - 1); 
      const result = await pluginStorage.setItem(pluginId, testKey, testValue);
      
      expect(result).toBe(false);
      expect(storageService.set).not.toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.storageLimitExceeded', expect.objectContaining({
          pluginId,
          limit: estimatedSize - 1
      }));
    });

    test('debe devolver false y loguear error si faltan argumentos', async () => {
      const originalConsoleError = console.error;
      console.error = jest.fn(); 
      const result = await pluginStorage.setItem(null, testKey, testValue);
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Argumentos inválidos para setItem: pluginId y key son requeridos y deben ser strings.');
      console.error = originalConsoleError; 
    });
  });

  describe('getItem', () => {
    test('debe recuperar un item existente', async () => {
      storageService.get.mockResolvedValue(testValue);
      const value = await pluginStorage.getItem(pluginId, testKey);
      
      expect(value).toEqual(testValue);
      expect(storageService.get).toHaveBeenCalledWith(`plugin_data_${pluginId}_${testKey}`);
    });

    test('debe devolver defaultValue si el item no existe', async () => {
      const defaultValue = { default: 'val' };
      const value = await pluginStorage.getItem(pluginId, testKey, defaultValue);
      
      expect(value).toEqual(defaultValue);
    });

     test('debe actualizar el tamaño si el item se obtiene por primera vez (y no estaba registrado)', async () => {
      storageService.get.mockResolvedValue(testValue);
      delete pluginStorage.pluginDataSizes[pluginId];
      delete pluginStorage.pluginKeys[pluginId];

      await pluginStorage.getItem(pluginId, testKey);
      
      expect(pluginStorage.pluginDataSizes[pluginId]).toBe(estimatedSize);
      expect(pluginStorage.pluginKeys[pluginId].has(testKey)).toBe(true);
    });
  });

  describe('removeItem', () => {
    test('debe eliminar un item y actualizar el tamaño de datos (cuando es la única clave)', async () => {
      storageService.get.mockResolvedValue(testValue); 
      pluginStorage.pluginKeys[pluginId] = new Set([testKey]); 
      pluginStorage.pluginDataSizes[pluginId] = estimatedSize;

      const result = await pluginStorage.removeItem(pluginId, testKey);
      
      expect(result).toBe(true);
      expect(storageService.remove).toHaveBeenCalledWith(`plugin_data_${pluginId}_${testKey}`);
      
      expect(pluginStorage.pluginKeys[pluginId]).toBeUndefined(); 
      expect(pluginStorage.pluginDataSizes[pluginId]).toBeUndefined(); 

      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.storageChanged', 
        { pluginId, key: testKey, action: 'remove' }
      );
    });

     test('debe eliminar un item y actualizar el tamaño si quedan otras claves', async () => {
      const key1 = 'key1';
      const value1 = {v:1};
      const size1 = mockEstimateSize(value1);
      const key2 = 'key2';
      const value2 = {v:2, d:"long"};
      const size2 = mockEstimateSize(value2);

      storageService.get.mockResolvedValueOnce(undefined).mockResolvedValueOnce(undefined); // Para los setItem
      await pluginStorage.setItem(pluginId, key1, value1);
      await pluginStorage.setItem(pluginId, key2, value2);
      expect(pluginStorage.pluginDataSizes[pluginId]).toBe(size1 + size2);
      
      // Limpiar mocks para las siguientes aserciones específicas de removeItem
      storageService.get.mockClear(); 
      storageService.set.mockClear();
      eventBus.publish.mockClear();

      storageService.get.mockResolvedValueOnce(value1); // Simular que get en removeItem encuentra value1
      const result = await pluginStorage.removeItem(pluginId, key1);

      expect(result).toBe(true);
      expect(storageService.remove).toHaveBeenCalledWith(`plugin_data_${pluginId}_${key1}`);
      expect(pluginStorage.pluginKeys[pluginId].has(key1)).toBe(false);
      expect(pluginStorage.pluginKeys[pluginId].has(key2)).toBe(true);
      expect(pluginStorage.pluginDataSizes[pluginId]).toBe(size2); 
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.storageChanged', 
        { pluginId, key: key1, action: 'remove' }
      );
    });
  });

  describe('getKeys', () => {
    test('debe devolver las claves registradas para un plugin', async () => {
      storageService.get.mockResolvedValue(undefined); 
      await pluginStorage.setItem(pluginId, 'key1', 'val1');
      await pluginStorage.setItem(pluginId, 'key2', 'val2');
      
      const keys = await pluginStorage.getKeys(pluginId);
      expect(keys).toEqual(expect.arrayContaining(['key1', 'key2']));
      expect(keys.length).toBe(2);
    });

    test('debe devolver un array vacío si no hay claves', async () => {
        const keys = await pluginStorage.getKeys(pluginId);
        expect(keys).toEqual([]);
    });
  });

  describe('clearPluginData', () => {
    test('debe eliminar todos los datos de un plugin', async () => {
      storageService.get.mockResolvedValue(undefined); 
      await pluginStorage.setItem(pluginId, 'key1', 'val1');
      await pluginStorage.setItem(pluginId, 'key2', 'val2');
      expect(pluginStorage.getPluginDataSize(pluginId)).toBeGreaterThan(0);
      expect((await pluginStorage.getKeys(pluginId)).length).toBe(2);

      const result = await pluginStorage.clearPluginData(pluginId);
      
      expect(result).toBe(true);
      expect(storageService.remove).toHaveBeenCalledWith(`plugin_data_${pluginId}_key1`);
      expect(storageService.remove).toHaveBeenCalledWith(`plugin_data_${pluginId}_key2`);
      expect(pluginStorage.pluginKeys[pluginId]).toBeUndefined();
      expect(pluginStorage.pluginDataSizes[pluginId]).toBeUndefined(); 
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.storageCleared', { pluginId });
    });
  });

  describe('Data Size and Limits', () => {
    test('setStorageLimit debe actualizar el límite', () => {
      const newLimit = 500 * 1024;
      pluginStorage.setStorageLimit(newLimit);
      expect(pluginStorage.pluginStorageLimit).toBe(newLimit);
    });

    test('getPluginDataSize debe devolver el tamaño correcto', async () => {
      storageService.get.mockResolvedValueOnce(undefined);
      await pluginStorage.setItem(pluginId, testKey, testValue);
      expect(pluginStorage.getPluginDataSize(pluginId)).toBe(estimatedSize);
    });

    test('getStorageUsagePercentage debe devolver el porcentaje correcto', async () => {
      storageService.get.mockResolvedValueOnce(undefined);
      pluginStorage.setStorageLimit(estimatedSize * 2);
      await pluginStorage.setItem(pluginId, testKey, testValue);
      expect(pluginStorage.getStorageUsagePercentage(pluginId)).toBe(50);
    });

    test('getStorageUsagePercentage debe manejar límite cero', async () => {
      pluginStorage.setStorageLimit(0);
      storageService.get.mockResolvedValueOnce(undefined);
      const setResult = await pluginStorage.setItem(pluginId, testKey, testValue);
      
      if (estimatedSize > 0) {
        expect(setResult).toBe(false); 
        expect(pluginStorage.getPluginDataSize(pluginId)).toBe(0); 
        expect(pluginStorage.getStorageUsagePercentage(pluginId)).toBe(0); 
      } else { 
        expect(setResult).toBe(true); 
        expect(pluginStorage.getPluginDataSize(pluginId)).toBe(0);
        expect(pluginStorage.getStorageUsagePercentage(pluginId)).toBe(0);
      }
      
      pluginStorage.pluginDataSizes[pluginId] = 0; 
      expect(pluginStorage.getStorageUsagePercentage(pluginId)).toBe(0);
    });
  });
});