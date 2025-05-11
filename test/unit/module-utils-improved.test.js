/**
 * @jest-environment jsdom
 */

import {
  checkTimeConflict,
  convertEventFormat,
  getRegisteredModules,
  executeAcrossModules,
  checkModuleDependencies
} from '../../src/core/module/module-utils';

describe('Module Utils - Pruebas complementarias', () => {
  // Configuración global
  beforeEach(() => {
    // Limpiamos mocks globales
    jest.clearAllMocks();
    
    // Restauramos window.__appModules
    if (typeof window !== 'undefined') {
      window.__appModules = {};
    }
  });

  // Cleanup
  afterEach(() => {
    if (typeof window !== 'undefined') {
      window.__appModules = {};
    }
  });

  describe('checkTimeConflict - casos adicionales', () => {
    test('maneja fechas inválidas correctamente', () => {
      // Espiar console.error
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      try {
        // Caso con fechas inválidas
        const event1 = {
          start: 'invalid-date',
          end: '2025-05-10T11:00:00Z'
        };
        
        const event2 = {
          start: '2025-05-10T10:00:00Z',
          end: '2025-05-10T11:00:00Z'
        };
        
        expect(checkTimeConflict(event1, event2)).toBe(false);
        expect(console.error).toHaveBeenCalled();
        
      } finally {
        // Restaurar console.error
        console.error = originalConsoleError;
      }
    });
  });

  describe('convertEventFormat - casos adicionales', () => {
    test('maneja conversiones cuando los formatos son iguales', () => {
      const event = {
        id: 'test',
        title: 'Test Event',
        description: 'Test description',
        start: '2025-05-10T10:00:00Z',
        end: '2025-05-10T11:00:00Z'
      };
      
      const result = convertEventFormat(event, 'calendar', 'calendar');
      
      // Debería devolver una copia del evento
      expect(result).toEqual(event);
      expect(result).not.toBe(event); // Debe ser un nuevo objeto
    });
    
    test('maneja caso con formato de origen/destino no reconocido', () => {
      // Espiar console.warn
      const originalConsoleWarn = console.warn;
      console.warn = jest.fn();
      
      try {
        const event = {
          id: 'test',
          title: 'Test Event',
          start: '2025-05-10T10:00:00Z',
          end: '2025-05-10T11:00:00Z'
        };
        
        const result = convertEventFormat(event, 'calendar', 'unknown-format');
        
        expect(result).toBeNull();
        expect(console.warn).toHaveBeenCalled();
        
      } finally {
        // Restaurar console.warn
        console.warn = originalConsoleWarn;
      }
    });
    
    test('maneja evento sin propiedades necesarias', () => {
      // Espiar console.error
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      try {
        const event = null;
        
        const result = convertEventFormat(event, 'calendar', 'task');
        
        expect(result).toBeNull();
        
      } finally {
        // Restaurar console.error
        console.error = originalConsoleError;
      }
    });
  });

  describe('executeAcrossModules - casos adicionales', () => {
    test('ejecuta una función en todos los módulos que la implementan y maneja errores', () => {
      // Preparar módulos de prueba con métodos que lanzan error
      window.__appModules = {
        'module1': {
          testMethod: jest.fn().mockImplementation(() => {
            throw new Error('Error en módulo 1');
          })
        },
        'module2': {
          testMethod: jest.fn().mockReturnValue('resultado2')
        }
      };
      
      // Ejecutar el método en todos los módulos
      const results = executeAcrossModules('testMethod', ['arg1', 'arg2']);
      
      // Verificar que se llamó al método en ambos módulos
      expect(window.__appModules.module1.testMethod).toHaveBeenCalledWith('arg1', 'arg2');
      expect(window.__appModules.module2.testMethod).toHaveBeenCalledWith('arg1', 'arg2');
      
      // Verificar que se captura el error correctamente
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Error en módulo 1');
      expect(results[1].success).toBe(true);
      expect(results[1].result).toBe('resultado2');
    });
  });
});