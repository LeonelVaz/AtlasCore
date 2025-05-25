// test/unit/src/utils/module-utils.test.js

/**
 * @jest-environment jsdom
 */

import {
  checkTimeConflict,
  convertEventFormat,
  getRegisteredModules,
  executeAcrossModules,
  checkModuleDependencies
} from '../../../../src/utils/module-utils';

describe('Module Utils', () => {
  let originalConsoleWarn;
  let originalConsoleError;

  beforeEach(() => {
    originalConsoleWarn = console.warn;
    originalConsoleError = console.error;
    console.warn = jest.fn();
    console.error = jest.fn();

    if (typeof window !== 'undefined') {
        window.__appModules = {};
    }
  });

  afterEach(() => {
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    if (typeof window !== 'undefined') {
        delete window.__appModules;
    }
  });

  describe('checkTimeConflict', () => {
    const baseTime = new Date(2023, 0, 1, 10, 0, 0).getTime();
    const eventA = { 
        start: new Date(baseTime).toISOString(), 
        end: new Date(baseTime + 60 * 60000).toISOString() 
    }; // 10:00 - 11:00

    test('debe detectar conflicto cuando los eventos se solapan', () => {
      const eventB = { start: new Date(baseTime + 30 * 60000).toISOString(), end: new Date(baseTime + 90 * 60000).toISOString() };
      expect(checkTimeConflict(eventA, eventB)).toBe(true);
    });

    test('debe detectar conflicto cuando un evento contiene a otro', () => {
      const eventC = { start: new Date(baseTime - 30 * 60000).toISOString(), end: new Date(baseTime + 90 * 60000).toISOString() };
      expect(checkTimeConflict(eventA, eventC)).toBe(true);
      expect(checkTimeConflict(eventC, eventA)).toBe(true);
    });

    test('no debe detectar conflicto si los eventos son adyacentes', () => {
      const eventD = { start: new Date(baseTime + 60 * 60000).toISOString(), end: new Date(baseTime + 120 * 60000).toISOString() };
      expect(checkTimeConflict(eventA, eventD)).toBe(false);
    });

    test('no debe detectar conflicto si los eventos están separados', () => {
      const eventE = { start: new Date(baseTime + 120 * 60000).toISOString(), end: new Date(baseTime + 180 * 60000).toISOString() };
      expect(checkTimeConflict(eventA, eventE)).toBe(false);
    });
    
    // Test Corregido
    test('debe devolver false y loguear si las cadenas de fecha son inválidas (resultan en NaN)', () => {
        const eventWithInvalidStartString = { start: 'esto no es una fecha', end: eventA.end };
        const eventWithInvalidEndString = { start: eventA.start, end: 'tampoco esto' };

        expect(checkTimeConflict(eventWithInvalidStartString, eventA)).toBe(false);
        expect(console.error).toHaveBeenCalledWith('Fechas inválidas al verificar conflicto');
        
        console.error.mockClear(); // Limpiar para la siguiente aserción
        
        expect(checkTimeConflict(eventA, eventWithInvalidEndString)).toBe(false);
        expect(console.error).toHaveBeenCalledWith('Fechas inválidas al verificar conflicto');
    });

    test('debe devolver false si faltan propiedades start/end (sin log específico de "Fechas inválidas")', () => {
        // Caso 1: event1.end falta
        expect(checkTimeConflict({start: eventA.start }, eventA)).toBe(false);
        expect(console.error).not.toHaveBeenCalledWith('Fechas inválidas al verificar conflicto'); // No debería llegar a este log
        
        console.error.mockClear();

        // Caso 2: event2.start falta
        expect(checkTimeConflict(eventA, { end: eventA.end })).toBe(false);
        expect(console.error).not.toHaveBeenCalledWith('Fechas inválidas al verificar conflicto');
    });

    test('debe loguear error genérico si new Date() lanza una excepción inesperada', () => {
        // Para forzar una excepción diferente a que simplemente devuelva NaN,
        // podríamos pasar algo que new Date() realmente no sepa cómo manejar,
        // aunque es difícil porque new Date() es muy permisivo.
        // Simulemos un error en la propiedad de acceso.
        const eventWithFaultyGetter = {
            get start() { throw new Error('getter error'); },
            end: eventA.end
        };
        expect(checkTimeConflict(eventWithFaultyGetter, eventA)).toBe(false);
        expect(console.error).toHaveBeenCalledWith('Error al verificar conflicto de tiempo:', expect.any(Error));
    });
  });

  // ... (resto de los tests para convertEventFormat, etc., que ya pasaban) ...
  describe('convertEventFormat', () => {
    const calendarEvent = { id: 'cal1', title: 'Reunión Calendario', description: 'Detalles...', start: '2023-01-01T10:00:00Z', end: '2023-01-01T11:00:00Z', color: '#aabbcc' };
    const taskEvent = { id: 'task1', title: 'Hacer Compra', description: 'Comprar leche', dueDate: '2023-01-01T11:00:00Z', completed: false, priority: 'high' };

    test('debe convertir de calendar a task', () => {
      const converted = convertEventFormat(calendarEvent, 'calendar', 'task');
      expect(converted).toEqual({
        id: 'cal1',
        title: 'Reunión Calendario',
        description: 'Detalles...',
        dueDate: '2023-01-01T11:00:00Z',
        completed: false,
        priority: 'medium',
        calendarEventId: 'cal1'
      });
    });

    test('debe convertir de task a calendar', () => {
      const converted = convertEventFormat(taskEvent, 'task', 'calendar');
      const expectedStartTime = new Date(taskEvent.dueDate);
      expectedStartTime.setHours(expectedStartTime.getHours() - 1);

      expect(converted).toEqual({
        id: 'task1',
        title: 'Tarea: Hacer Compra',
        description: 'Comprar leche',
        start: expectedStartTime.toISOString(),
        end: '2023-01-01T11:00:00Z',
        color: '#FF9800', // Color para no completada
        taskId: 'task1'
      });
    });
    
    test('debe convertir de calendar a video', () => {
        const converted = convertEventFormat(calendarEvent, 'calendar', 'video');
        expect(converted).toEqual({
          id: 'cal1',
          title: 'Reunión Calendario',
          description: 'Detalles...',
          scheduledDate: '2023-01-01T10:00:00Z',
          duration: 60,
          status: 'planificado',
          calendarEventId: 'cal1'
        });
      });

    test('debe devolver copia si los formatos son iguales', () => {
      const converted = convertEventFormat(calendarEvent, 'calendar', 'calendar');
      expect(converted).toEqual(calendarEvent);
      expect(converted).not.toBe(calendarEvent);
    });

    test('debe devolver null y advertir si la conversión no está implementada', () => {
      const converted = convertEventFormat(calendarEvent, 'calendar', 'unknownFormat');
      expect(converted).toBeNull();
      expect(console.warn).toHaveBeenCalledWith('Conversión de calendar a unknownFormat no implementada');
    });

    test('debe devolver null si faltan argumentos', () => {
        expect(convertEventFormat(null, 'calendar', 'task')).toBeNull();
    });
  });

  describe('getRegisteredModules y executeAcrossModules', () => {
    beforeEach(() => {
      if (typeof window !== 'undefined') {
        window.__appModules = {
          moduleA: { getData: jest.fn(() => 'dataA'), commonFunc: jest.fn() },
          moduleB: { commonFunc: jest.fn(() => 'dataB'), anotherFunc: jest.fn() },
          moduleC: { getData: jest.fn(() => 'dataC') }
        };
      }
    });

    test('getRegisteredModules debe devolver los nombres de los módulos registrados', () => {
      const modules = getRegisteredModules();
      expect(modules).toEqual(expect.arrayContaining(['moduleA', 'moduleB', 'moduleC']));
      expect(modules.length).toBe(3);
    });

    test('executeAcrossModules debe ejecutar el método en los módulos que lo implementan', () => {
      const results = executeAcrossModules('commonFunc', [1, 'arg2']);
      expect(window.__appModules.moduleA.commonFunc).toHaveBeenCalledWith(1, 'arg2');
      expect(window.__appModules.moduleB.commonFunc).toHaveBeenCalledWith(1, 'arg2');
      expect(results).toEqual(expect.arrayContaining([
        expect.objectContaining({ module: 'moduleA', success: true }),
        expect.objectContaining({ module: 'moduleB', success: true, result: 'dataB' })
      ]));
      const moduleCResult = results.find(r => r.module === 'moduleC');
      expect(moduleCResult).toBeUndefined();
    });
    
    test('executeAcrossModules debe manejar errores en la ejecución de un método', () => {
        window.__appModules.moduleA.commonFunc.mockImplementationOnce(() => { throw new Error('Exec error A'); });
        const results = executeAcrossModules('commonFunc');
        const resultA = results.find(r => r.module === 'moduleA');
        expect(resultA.success).toBe(false);
        expect(resultA.error).toBe('Exec error A');
        expect(console.error).toHaveBeenCalledWith('Error al ejecutar commonFunc en el módulo moduleA:', expect.any(Error));
    });
  });

  describe('checkModuleDependencies', () => {
    beforeEach(() => {
        if (typeof window !== 'undefined') {
            window.__appModules = {
              depA: {},
              depB: {}
            };
        }
    });

    test('debe devolver éxito si todas las dependencias están satisfechas', () => {
      const result = checkModuleDependencies('myModule', ['depA', 'depB']);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Todas las dependencias satisfechas');
      expect(result.missingDependencies).toEqual([]);
    });

    test('debe devolver fallo y listar dependencias faltantes', () => {
      const result = checkModuleDependencies('myModule', ['depA', 'depC', 'depD']);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Faltan 2 dependencias');
      expect(result.missingDependencies).toEqual(['depC', 'depD']);
    });

    test('debe devolver éxito si no hay dependencias que verificar', () => {
      const result1 = checkModuleDependencies('myModule', []);
      expect(result1.success).toBe(true);
      expect(result1.message).toBe('No hay dependencias que verificar');

      const result2 = checkModuleDependencies('myModule');
      expect(result2.success).toBe(true);
      expect(result2.message).toBe('No hay dependencias que verificar');
    });

    test('debe manejar el caso donde __appModules no existe', () => {
        if (typeof window !== 'undefined') delete window.__appModules;
        const result = checkModuleDependencies('myModule', ['depA']);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Sistema de módulos no disponible');
    });
  });
});