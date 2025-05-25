// test/unit/src/hooks/use-time-grid.test.jsx

/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';

// Mocks ANTES de la importación del hook
jest.mock('../../../../src/services/storage-service', () => ({
  get: jest.fn(),
  set: jest.fn(),
}));
jest.mock('../../../../src/core/bus/event-bus', () => ({
  __esModule: true,
  default: {
    publish: jest.fn(),
  }
}));
jest.mock('../../../../src/utils/date-utils', () => ({
  formatHour: jest.fn((hour) => `${String(hour).padStart(2, '0')}:00`),
}));
jest.mock('../../../../src/core/config/constants', () => ({
  DEFAULT_HOUR_CELL_HEIGHT: 60,
  STORAGE_KEYS: {
    CUSTOM_TIME_SLOTS: 'atlas_custom_time_slots_mock_key_for_timegrid'
  },
}));

// Importar el hook DESPUÉS de los mocks
import useTimeGrid from '../../../../src/hooks/use-time-grid';
// Importar mocks para aserciones (DESPUÉS de jest.mock)
const storageService = require('../../../../src/services/storage-service');
const eventBus = require('../../../../src/core/bus/event-bus').default;
const { STORAGE_KEYS } = require('../../../../src/core/config/constants');
const dateUtils = require('../../../../src/utils/date-utils');


describe('useTimeGrid Hook', () => {
  let originalConsoleError;

  beforeEach(() => {
    jest.clearAllMocks();
    storageService.get.mockResolvedValue({});
    originalConsoleError = console.error;
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  test('debe inicializar con horas por defecto y cargar slots vacíos', async () => {
    const { result } = renderHook(() => useTimeGrid(8, 18));
    
    await act(async () => {});

    expect(result.current.isLoading).toBe(false);
    expect(result.current.hours.length).toBe(10);
    expect(result.current.hours[0]).toBe(8);
    expect(result.current.customSlots).toEqual({});
    expect(storageService.get).toHaveBeenCalledWith(STORAGE_KEYS.CUSTOM_TIME_SLOTS, {});
  });

  test('debe cargar y procesar customSlots desde el almacenamiento', async () => {
    const savedSlots = {
      9: [{ minutes: 30 }],
      10: [{ minutes: 15 }, { minutes: 45 }],
    };
    storageService.get.mockResolvedValue(savedSlots);

    const { result } = renderHook(() => useTimeGrid());
    await act(async () => {});

    expect(result.current.customSlots[9]).toEqual([{ minutes: 30, duration: 30 }]);
    expect(result.current.customSlots[10]).toEqual([
      { minutes: 15, duration: 30 },
      { minutes: 45, duration: 15 },
    ]);
  });

  describe('addCustomTimeSlot', () => {
    test('debe añadir un slot, recalcular duraciones y guardar', async () => {
      const { result } = renderHook(() => useTimeGrid());
      await act(async () => {});

      act(() => { result.current.addCustomTimeSlot(9, 30); });
      expect(result.current.customSlots[9]).toEqual([{ minutes: 30, duration: 30 }]);
      expect(storageService.set).toHaveBeenCalledWith(STORAGE_KEYS.CUSTOM_TIME_SLOTS, { 9: [{ minutes: 30, duration: 30 }] });
      expect(eventBus.publish).toHaveBeenCalledWith('calendar.timeSlotsChanged', expect.any(Object));

      act(() => { result.current.addCustomTimeSlot(9, 15); });
      expect(result.current.customSlots[9]).toEqual([
        { minutes: 15, duration: 15 },
        { minutes: 30, duration: 30 },
      ]);
    });

    test('no debe añadir si el slot ya existe', async () => {
        const { result } = renderHook(() => useTimeGrid());
        await act(async () => {});
        act(() => { result.current.addCustomTimeSlot(9, 30); });
        
        storageService.set.mockClear();
        
        let success;
        act(() => { success = result.current.addCustomTimeSlot(9, 30); });
        expect(success).toBe(false);
        expect(storageService.set).not.toHaveBeenCalled();
      });
  
      test('debe ajustar minutos a múltiplo de 15 (y añadir si no existe)', async () => {
        const { result } = renderHook(() => useTimeGrid());
        await act(async () => {});
        
        let success;
        act(() => { success = result.current.addCustomTimeSlot(10, 20); });
        expect(success).toBe(true);
        expect(result.current.customSlots[10]).toEqual([{ minutes: 15, duration: 45 }]);
      });

      test('no debe añadir 00:45 si 00:30 no existe (subdivision order)', async () => {
        const { result } = renderHook(() => useTimeGrid());
        await act(async () => {});
        let success;
        act(() => { success = result.current.addCustomTimeSlot(0, 45); });
        expect(success).toBe(false);
        expect(result.current.customSlots[0]).toBeUndefined();
      });
  });
  

  test('removeCustomTimeSlot debe eliminar un slot y recalcular duraciones', async () => {
    storageService.get.mockResolvedValue({ 9: [{ minutes: 15 }, { minutes: 30 }] });
    const { result } = renderHook(() => useTimeGrid());
    await act(async () => {});

    act(() => { result.current.removeCustomTimeSlot(9, 15); });
    expect(result.current.customSlots[9]).toEqual([{ minutes: 30, duration: 30 }]);
    expect(storageService.set).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalled();

    act(() => { result.current.removeCustomTimeSlot(9, 30); });
    expect(result.current.customSlots[9]).toBeUndefined();
  });

  test('formatTimeSlot debe llamar a dateUtils.formatHour para la hora completa y formatear minutos', () => {
    const { result } = renderHook(() => useTimeGrid());
    
    result.current.formatTimeSlot(9, 0);
    expect(dateUtils.formatHour).toHaveBeenCalledWith(9);
    expect(result.current.formatTimeSlot(9, 0)).toBe('09:00');

    expect(result.current.formatTimeSlot(10, 30)).toBe('10:30');
  });

  describe('shouldShowEventStart', () => {
    const day = new Date(2023, 0, 15);
    const { result } = renderHook(() => useTimeGrid());

    test('debe devolver true si el evento empieza dentro del slot', () => {
      const event = { start: new Date(2023, 0, 15, 10, 15).toISOString() };
      expect(result.current.shouldShowEventStart(event, day, 10, 0, 60)).toBe(true);
    });
    test('debe devolver false si el evento empieza fuera del slot o en otro día', () => {
      const event = { start: new Date(2023, 0, 15, 9, 59).toISOString() };
      expect(result.current.shouldShowEventStart(event, day, 10, 0, 60)).toBe(false);
      
      const eventOtherDay = { start: new Date(2023, 0, 16, 10, 0).toISOString() };
      expect(result.current.shouldShowEventStart(eventOtherDay, day, 10, 0, 60)).toBe(false);
    });
    test('debe devolver false si el evento o su fecha de inicio son inválidos', () => {
        expect(result.current.shouldShowEventStart(null, day, 10, 0, 60)).toBe(false);
        expect(result.current.shouldShowEventStart({ start: 'invalid-date' }, day, 10, 0, 60)).toBe(false);
    });
  });

  test('isEventActiveAtStartOfDay debe funcionar correctamente', () => {
    const day = new Date(2023, 0, 15);
    const { result } = renderHook(() => useTimeGrid());
    const eventSpanningMidnight = {
      start: new Date(2023, 0, 14, 23, 0).toISOString(),
      end: new Date(2023, 0, 15, 1, 0).toISOString(),
    };
    expect(result.current.isEventActiveAtStartOfDay(eventSpanningMidnight, day)).toBe(true);

    const eventNotSpanning = {
        start: new Date(2023, 0, 15, 2, 0).toISOString(),
        end: new Date(2023, 0, 15, 3, 0).toISOString(),
      };
    expect(result.current.isEventActiveAtStartOfDay(eventNotSpanning, day)).toBe(false);
  });

  test('getEventPositionInSlot debe calcular el offset correctamente', () => {
    const { result } = renderHook(() => useTimeGrid(0, 24, 60));
    const event = { start: new Date(2023, 0, 15, 10, 30).toISOString() };
    const position = result.current.getEventPositionInSlot(event, 10, 0, 60, 60); 
    expect(position.offsetPercent).toBe(50);
    expect(position.offsetPixels).toBe(30);
  });

  test('eventsOverlapInTimeSlot debe detectar solapamientos', () => {
    const { result } = renderHook(() => useTimeGrid());
    const event1 = { start: '2023-01-01T10:00:00Z', end: '2023-01-01T11:00:00Z' };
    const event2 = { start: '2023-01-01T10:30:00Z', end: '2023-01-01T11:30:00Z' };
    const event3 = { start: '2023-01-01T11:00:00Z', end: '2023-01-01T12:00:00Z' };
    
    expect(result.current.eventsOverlapInTimeSlot(event1, event2)).toBe(true);
    expect(result.current.eventsOverlapInTimeSlot(event1, event3)).toBe(false);
  });
});