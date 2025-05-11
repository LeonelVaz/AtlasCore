// test/unit/storage-service.test.js
import storageService from '../../src/services/storage-service';
import eventBus from '../../src/core/bus/event-bus';
import { STORAGE_KEYS } from '../../src/core/config/constants';

// Mock para eventBus
jest.mock('../../src/core/bus/event-bus', () => ({
  __esModule: true,
  default: {
    publish: jest.fn()
  },
  EventCategories: {
    STORAGE: 'storage'
  }
}));

// Mock para localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

// Mock para Electron Store
const mockElectronStore = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  clear: jest.fn()
};

describe('Storage Service', () => {
  // Salvar el localStorage original y window.electron
  let originalLocalStorage;
  let originalElectron;
  
  beforeEach(() => {
    // Guardar originales
    originalLocalStorage = Object.getOwnPropertyDescriptor(window, 'localStorage');
    originalElectron = window.electron;
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    
    // Limpiar mocks antes de cada prueba
    jest.clearAllMocks();
    
    // Reiniciar el localStorage mock
    mockLocalStorage.clear();
  });
  
  afterEach(() => {
    // Restaurar localStorage original
    if (originalLocalStorage) {
      Object.defineProperty(window, 'localStorage', originalLocalStorage);
    }
    
    // Restaurar window.electron
    window.electron = originalElectron;
  });

  describe('Inicialización', () => {
    test('se inicializa correctamente y crea un adaptador para localStorage', () => {
      // Forzar reinicialización
      storageService.initStorage();
      
      // Verificar que se inicializó con localStorage
      expect(storageService.storageAdapter).not.toBeNull();
      
      // Probar que el adaptador funciona
      storageService.storageAdapter.set('test-key', { data: 'test' });
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
    
    test('usa Electron Store si está disponible', () => {
      // Simular entorno Electron
      window.electron = {
        store: mockElectronStore
      };
      
      // Simular que es un entorno Electron
      jest.spyOn(storageService, 'isElectron').mockReturnValue(true);
      
      // Reinicializar el servicio
      storageService.initStorage();
      
      // Probar que usa Electron Store
      storageService.storageAdapter.get('test-key');
      expect(mockElectronStore.get).toHaveBeenCalled();
    });
    
    test('usa localStorage como fallback si hay error con Electron Store', () => {
      // Simular un error en la inicialización de Electron Store
      jest.spyOn(storageService, 'isElectron').mockReturnValue(true);
      jest.spyOn(storageService, 'initElectronStore').mockImplementation(() => {
        throw new Error('Error al inicializar Electron Store');
      });
      
      // Espiar console.error
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // Reinicializar el servicio
      storageService.initStorage();
      
      // Verificar que cayó en fallback a localStorage
      storageService.storageAdapter.set('test-key', { data: 'test' });
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      
      // Restaurar console.error
      console.error = originalConsoleError;
    });
  });

  describe('Método get', () => {
    test('obtiene un valor del almacenamiento correctamente', async () => {
      // Configurar un valor en localStorage
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({ test: 'data' }));
      
      // Obtener el valor
      const result = await storageService.get('test-key');
      
      // Verificar que se llamó a getItem
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');
      
      // Verificar que el resultado es correcto
      expect(result).toEqual({ test: 'data' });
    });
    
    test('devuelve el valor por defecto si la clave no existe', async () => {
      // No configurar valor en localStorage
      mockLocalStorage.getItem.mockReturnValueOnce(null);
      
      // Obtener el valor con un valor por defecto
      const defaultValue = { default: true };
      const result = await storageService.get('non-existent-key', defaultValue);
      
      // Verificar que se llamó a getItem
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('non-existent-key');
      
      // Verificar que se devolvió el valor por defecto
      expect(result).toEqual(defaultValue);
    });
    
    test('maneja errores al obtener valores', async () => {
      // Simular un error al obtener un valor
      mockLocalStorage.getItem.mockImplementationOnce(() => {
        throw new Error('Error al obtener valor');
      });
      
      // Espiar console.error
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // Intentar obtener el valor
      const defaultValue = { default: true };
      const result = await storageService.get('error-key', defaultValue);
      
      // Verificar que se devolvió el valor por defecto
      expect(result).toEqual(defaultValue);
      
      // Verificar que se registró el error
      expect(console.error).toHaveBeenCalled();
      
      // Restaurar console.error
      console.error = originalConsoleError;
    });
    
    test('maneja errores cuando storageAdapter no está inicializado', async () => {
      // Guardar el adaptador original
      const originalAdapter = storageService.storageAdapter;
      
      // Simular que storageAdapter no está inicializado
      storageService.storageAdapter = null;
      
      // Espiar console.error
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // Intentar obtener un valor
      const defaultValue = { default: true };
      const result = await storageService.get('test-key', defaultValue);
      
      // Verificar que se devolvió el valor por defecto
      expect(result).toEqual(defaultValue);
      
      // Verificar que se registró el error
      expect(console.error).toHaveBeenCalled();
      
      // Restaurar storageAdapter y console.error
      storageService.storageAdapter = originalAdapter;
      console.error = originalConsoleError;
    });
  });

  describe('Método set', () => {
    test('guarda un valor en el almacenamiento correctamente', async () => {
      // Configurar que setItem funcione correctamente
      mockLocalStorage.setItem.mockImplementationOnce(() => {});
      
      // Guardar un valor
      const value = { test: 'data' };
      const result = await storageService.set('test-key', value);
      
      // Verificar que se llamó a setItem correctamente
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(value));
      
      // Verificar que se devolvió true (éxito)
      expect(result).toBe(true);
      
      // Verificar que se publicó el evento correcto
      expect(eventBus.publish).toHaveBeenCalledWith('storage.dataChanged', { key: 'test-key', value });
    });
    
    test('publica eventos específicos para ciertos tipos de datos', async () => {
      // Guardar eventos
      const eventsData = [{ id: 'event1' }];
      await storageService.set(STORAGE_KEYS.EVENTS, eventsData);
      
      // Verificar que se publicó el evento general
      expect(eventBus.publish).toHaveBeenCalledWith('storage.dataChanged', { 
        key: STORAGE_KEYS.EVENTS, 
        value: eventsData 
      });
      
      // Verificar que se publicó el evento específico para eventos
      expect(eventBus.publish).toHaveBeenCalledWith('storage.eventsUpdated', eventsData);
    });
    
    test('maneja errores al guardar valores', async () => {
      // Simular un error al guardar
      mockLocalStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Error al guardar');
      });
      
      // Espiar console.error
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // Intentar guardar un valor
      const result = await storageService.set('error-key', { data: 'test' });
      
      // Verificar que se devolvió false (error)
      expect(result).toBe(false);
      
      // Verificar que se registró el error
      expect(console.error).toHaveBeenCalled();
      
      // Verificar que NO se publicó ningún evento
      expect(eventBus.publish).not.toHaveBeenCalled();
      
      // Restaurar console.error
      console.error = originalConsoleError;
    });
    
    test('maneja errores cuando storageAdapter no está inicializado', async () => {
      // Guardar el adaptador original
      const originalAdapter = storageService.storageAdapter;
      
      // Simular que storageAdapter no está inicializado
      storageService.storageAdapter = null;
      
      // Espiar console.error
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // Intentar guardar un valor
      const result = await storageService.set('test-key', { data: 'test' });
      
      // Verificar que se devolvió false (error)
      expect(result).toBe(false);
      
      // Verificar que se registró el error
      expect(console.error).toHaveBeenCalled();
      
      // Restaurar storageAdapter y console.error
      storageService.storageAdapter = originalAdapter;
      console.error = originalConsoleError;
    });
  });

  describe('Método remove', () => {
    test('elimina un valor del almacenamiento correctamente', async () => {
      // Configurar que removeItem funcione correctamente
      mockLocalStorage.removeItem.mockImplementationOnce(() => {});
      
      // Eliminar un valor
      const result = await storageService.remove('test-key');
      
      // Verificar que se llamó a removeItem correctamente
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
      
      // Verificar que se devolvió true (éxito)
      expect(result).toBe(true);
      
      // Verificar que se publicó el evento correcto
      expect(eventBus.publish).toHaveBeenCalledWith('storage.dataRemoved', { key: 'test-key' });
    });
    
    test('maneja errores al eliminar valores', async () => {
      // Simular un error al eliminar
      mockLocalStorage.removeItem.mockImplementationOnce(() => {
        throw new Error('Error al eliminar');
      });
      
      // Espiar console.error
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // Intentar eliminar un valor
      const result = await storageService.remove('error-key');
      
      // Verificar que se devolvió false (error)
      expect(result).toBe(false);
      
      // Verificar que se registró el error
      expect(console.error).toHaveBeenCalled();
      
      // Verificar que NO se publicó ningún evento
      expect(eventBus.publish).not.toHaveBeenCalled();
      
      // Restaurar console.error
      console.error = originalConsoleError;
    });
  });

  describe('Método clear', () => {
    test('limpia todo el almacenamiento correctamente', async () => {
      // Configurar que clear funcione correctamente
      mockLocalStorage.clear.mockImplementationOnce(() => {});
      
      // Limpiar el almacenamiento
      const result = await storageService.clear();
      
      // Verificar que se llamó a clear correctamente
      expect(mockLocalStorage.clear).toHaveBeenCalled();
      
      // Verificar que se devolvió true (éxito)
      expect(result).toBe(true);
      
      // Verificar que se publicó el evento correcto
      expect(eventBus.publish).toHaveBeenCalledWith('storage.dataCleared', {});
    });
    
    test('maneja errores al limpiar el almacenamiento', async () => {
      // Simular un error al limpiar
      mockLocalStorage.clear.mockImplementationOnce(() => {
        throw new Error('Error al limpiar');
      });
      
      // Espiar console.error
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // Intentar limpiar el almacenamiento
      const result = await storageService.clear();
      
      // Verificar que se devolvió false (error)
      expect(result).toBe(false);
      
      // Verificar que se registró el error
      expect(console.error).toHaveBeenCalled();
      
      // Verificar que NO se publicó ningún evento
      expect(eventBus.publish).not.toHaveBeenCalled();
      
      // Restaurar console.error
      console.error = originalConsoleError;
    });
  });

  describe('Detección de entorno Electron', () => {
    test('detecta correctamente el entorno Electron', () => {
      // Guardar window.process original
      const originalProcess = window.process;
      
      // Simular entorno Electron
      window.process = { type: 'renderer' };
      
      // Verificar detección de Electron
      expect(storageService.isElectron()).toBe(true);
      
      // Restaurar window.process
      window.process = originalProcess;
    });
    
    test('detecta correctamente el entorno no-Electron', () => {
      // Guardar window.process original
      const originalProcess = window.process;
      
      // Simular entorno no-Electron
      delete window.process;
      
      // Verificar detección de Electron
      expect(storageService.isElectron()).toBe(false);
      
      // Restaurar window.process
      window.process = originalProcess;
    });
  });
});