// test/unit/use-time-grid.test.js
import { renderHook, act } from '@testing-library/react';
import useTimeGrid from '../../src/hooks/use-time-grid';
import { DEFAULT_HOUR_CELL_HEIGHT } from '../../src/core/config/constants';

describe('useTimeGrid Hook', () => {
  // Mock para console.error
  let errorSpy;
  
  beforeEach(() => {
    // Espiar console.error para pruebas de manejo de errores
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Restaurar console.error
    errorSpy.mockRestore();
  });

  test('inicializa con los valores predeterminados correctos', () => {
    // Renderizar el hook con valores por defecto
    const { result } = renderHook(() => useTimeGrid());
    
    // Verificar valores iniciales
    expect(result.current.hours).toHaveLength(24); // 24 horas
    expect(result.current.gridHeight).toBe(DEFAULT_HOUR_CELL_HEIGHT);
    expect(result.current.timeSlots).toEqual([]);
  });

  test('inicializa con rangos de horas personalizados', () => {
    // Renderizar el hook con rango personalizado (8-17)
    const { result } = renderHook(() => useTimeGrid(8, 17, 40));
    
    // Verificar valores iniciales
    expect(result.current.hours).toHaveLength(9); // 9 horas (8-16 inclusive)
    expect(result.current.hours[0]).toBe(8); // Primera hora
    expect(result.current.hours[8]).toBe(16); // Última hora
    expect(result.current.gridHeight).toBe(40); // Altura personalizada
  });

  test('generateHours genera correctamente las horas según los parámetros', () => {
    // Renderizar el hook con valores por defecto
    const { result } = renderHook(() => useTimeGrid());
    
    // Verificar la función generateHours
    const hours = result.current.generateHours();
    expect(hours).toHaveLength(24);
    expect(hours[0]).toBe(0); // Primera hora
    expect(hours[23]).toBe(23); // Última hora
    
    // Verificar que la función es determinista (siempre devuelve los mismos valores)
    const hours2 = result.current.generateHours();
    expect(hours).toEqual(hours2);
  });

  test('shouldShowEventStart detecta correctamente cuando un evento comienza en una hora específica', () => {
    // Renderizar el hook
    const { result } = renderHook(() => useTimeGrid());
    
    // Crear evento de prueba
    const testEvent = {
      start: '2025-05-12T10:00:00', // Evento que comienza a las 10:00
      end: '2025-05-12T11:00:00'
    };
    
    // Crear día y hora
    const testDay = new Date('2025-05-12T00:00:00');
    const eventHour = 10;
    const nonEventHour = 9;
    
    // Verificar detección correcta
    expect(result.current.shouldShowEventStart(testEvent, testDay, eventHour)).toBe(true);
    expect(result.current.shouldShowEventStart(testEvent, testDay, nonEventHour)).toBe(false);
    
    // Probar con un día diferente
    const differentDay = new Date('2025-05-13T00:00:00');
    expect(result.current.shouldShowEventStart(testEvent, differentDay, eventHour)).toBe(false);
  });

  test('shouldShowEventStart maneja errores y casos extremos', () => {
    // Renderizar el hook
    const { result } = renderHook(() => useTimeGrid());
    
    // Casos extremos
    const incompleteEvent = { title: 'Sin horas' };
    const invalidStart = { start: 'invalid-date', end: '2025-05-12T11:00:00' };
    const day = new Date('2025-05-12T00:00:00');
    
    // Probar con evento incompleto
    expect(result.current.shouldShowEventStart(incompleteEvent, day, 10)).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockClear();
    
    // Probar con fecha inválida
    expect(result.current.shouldShowEventStart(invalidStart, day, 10)).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
  });

  test('isEventActiveAtStartOfDay detecta correctamente eventos activos al inicio del día', () => {
    // Renderizar el hook
    const { result } = renderHook(() => useTimeGrid());
    
    // Día actual
    const currentDay = new Date('2025-05-12T00:00:00');
    
    // Evento que cruza desde el día anterior
    const crossingEvent = {
      start: '2025-05-11T22:00:00', // Comienza el 11 de mayo a las 22:00
      end: '2025-05-12T02:00:00'    // Termina el 12 de mayo a las 02:00
    };
    
    // Evento que no cruza días
    const regularEvent = {
      start: '2025-05-12T10:00:00',
      end: '2025-05-12T11:00:00'
    };
    
    // Verificar detección correcta
    expect(result.current.isEventActiveAtStartOfDay(crossingEvent, currentDay)).toBe(true);
    expect(result.current.isEventActiveAtStartOfDay(regularEvent, currentDay)).toBe(false);
  });

  test('isEventActiveAtStartOfDay maneja errores y casos extremos', () => {
    // Renderizar el hook
    const { result } = renderHook(() => useTimeGrid());
    
    // Día actual
    const day = new Date('2025-05-12T00:00:00');
    
    // Casos extremos
    const incompleteEvent = { title: 'Sin horas' };
    const invalidDates = { start: 'invalid-date', end: 'invalid-date' };
    
    // Probar con evento incompleto
    expect(result.current.isEventActiveAtStartOfDay(incompleteEvent, day)).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockClear();
    
    // Probar con fechas inválidas
    expect(result.current.isEventActiveAtStartOfDay(invalidDates, day)).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
  });

  test('getEventsForTimeSlot filtra correctamente los eventos para una hora específica', () => {
    // Renderizar el hook
    const { result } = renderHook(() => useTimeGrid());
    
    // Crear eventos de prueba
    const testEvents = [
      {
        id: 'event1',
        title: 'Evento 1',
        start: '2025-05-12T10:00:00',
        end: '2025-05-12T11:00:00'
      },
      {
        id: 'event2',
        title: 'Evento 2',
        start: '2025-05-12T14:00:00',
        end: '2025-05-12T15:00:00'
      },
      {
        id: 'event3',
        title: 'Evento 3',
        start: '2025-05-13T10:00:00', // Diferente día
        end: '2025-05-13T11:00:00'
      }
    ];
    
    // Día y hora a verificar
    const day = new Date('2025-05-12T00:00:00');
    const hour10 = 10;
    const hour14 = 14;
    
    // Verificar para las 10:00
    const eventsAt10 = result.current.getEventsForTimeSlot(testEvents, day, hour10);
    expect(eventsAt10).toHaveLength(1);
    expect(eventsAt10[0].id).toBe('event1');
    
    // Verificar para las 14:00
    const eventsAt14 = result.current.getEventsForTimeSlot(testEvents, day, hour14);
    expect(eventsAt14).toHaveLength(1);
    expect(eventsAt14[0].id).toBe('event2');
    
    // Verificar para una hora sin eventos
    const eventsAt12 = result.current.getEventsForTimeSlot(testEvents, day, 12);
    expect(eventsAt12).toHaveLength(0);
  });

  test('getEventsForTimeSlot maneja arrays vacíos y casos extremos', () => {
    // Renderizar el hook
    const { result } = renderHook(() => useTimeGrid());
    
    // Verificar con array vacío
    expect(result.current.getEventsForTimeSlot([], new Date(), 10)).toEqual([]);
    
    // Verificar con día nulo
    expect(result.current.getEventsForTimeSlot([{ id: 'test' }], null, 10)).toEqual([]);
    
    // Verificar con evento incompleto
    const events = [{ id: 'incomplete' }];
    const day = new Date();
    expect(result.current.getEventsForTimeSlot(events, day, 10)).toEqual([]);
  });

  test('getContinuingEvents encuentra eventos que continúan desde el día anterior', () => {
    // Renderizar el hook
    const { result } = renderHook(() => useTimeGrid());
    
    // Crear eventos de prueba
    const testEvents = [
      {
        id: 'event1',
        title: 'Evento Regular',
        start: '2025-05-12T10:00:00',
        end: '2025-05-12T11:00:00'
      },
      {
        id: 'event2',
        title: 'Evento que Continúa',
        start: '2025-05-11T22:00:00', // Día anterior
        end: '2025-05-12T02:00:00'
      }
    ];
    
    // Día actual
    const currentDay = new Date('2025-05-12T00:00:00');
    
    // Obtener eventos que continúan
    const continuingEvents = result.current.getContinuingEvents(testEvents, currentDay);
    
    // Verificar que solo se encontró el evento que continúa
    expect(continuingEvents).toHaveLength(1);
    expect(continuingEvents[0].id).toBe('event2');
  });

  test('getContinuingEvents maneja arrays vacíos y casos extremos', () => {
    // Renderizar el hook
    const { result } = renderHook(() => useTimeGrid());
    
    // Verificar con array vacío
    expect(result.current.getContinuingEvents([], new Date())).toEqual([]);
    
    // Verificar con día nulo
    expect(result.current.getContinuingEvents([{ id: 'test' }], null)).toEqual([]);
  });

  test('formatTimeSlot formatea correctamente las horas', () => {
    // Renderizar el hook
    const { result } = renderHook(() => useTimeGrid());
    
    // Verificar formato de algunas horas
    expect(result.current.formatTimeSlot(0)).toBe('00:00');
    expect(result.current.formatTimeSlot(9)).toBe('09:00');
    expect(result.current.formatTimeSlot(12)).toBe('12:00');
    expect(result.current.formatTimeSlot(23)).toBe('23:00');
  });

  test('setHourCellHeight actualiza correctamente la altura de la celda', () => {
    // Renderizar el hook
    const { result } = renderHook(() => useTimeGrid());
    
    // Altura inicial
    const initialHeight = result.current.gridHeight;
    
    // Cambiar la altura
    act(() => {
      result.current.setHourCellHeight(80);
    });
    
    // Verificar que la altura se actualizó
    expect(result.current.gridHeight).toBe(80);
    expect(result.current.gridHeight).not.toBe(initialHeight);
    
    // Intentar con un valor negativo (no debería cambiar)
    act(() => {
      result.current.setHourCellHeight(-10);
    });
    
    // Verificar que la altura no cambió
    expect(result.current.gridHeight).toBe(80);
  });

  test('setTimeSlots actualiza correctamente los slots de tiempo', () => {
    // Renderizar el hook
    const { result } = renderHook(() => useTimeGrid());
    
    // Slots de tiempo de prueba
    const newTimeSlots = [
      { start: '09:00', end: '09:30' },
      { start: '09:30', end: '10:00' },
      { start: '10:00', end: '10:30' }
    ];
    
    // Actualizar los slots
    act(() => {
      result.current.setTimeSlots(newTimeSlots);
    });
    
    // Verificar que los slots se actualizaron
    expect(result.current.timeSlots).toEqual(newTimeSlots);
    expect(result.current.timeSlots).toHaveLength(3);
  });
});