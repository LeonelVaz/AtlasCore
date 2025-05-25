// test/unit/src/hooks/use-time-grid.test.jsx

/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import useTimeGrid from '../../../../src/hooks/use-time-grid';
import storageService from '../../../../src/services/storage-service';
import eventBus from '../../../../src/core/bus/event-bus';
import { STORAGE_KEYS } from '../../../../src/core/config/constants';
import * as dateUtils from '../../../../src/utils/date-utils'; // Para mockear formatHour

// Mockear dependencias
jest.mock('../../../../src/services/storage-service', () => ({
  get: jest.fn(),
  set: jest.fn(),
}));
jest.mock('../../../../src/core/bus/event-bus', () => ({
  publish: jest.fn(),
}));
jest.mock('../../../../src/utils/date-utils', () => ({
  formatHour: jest.fn((hour) => `${hour}:00`), // Mock simple
}));
jest.mock('../../../../src/core/config/constants', () => ({
  DEFAULT_HOUR_CELL_HEIGHT: 60,
  STORAGE_KEYS: {
    CUSTOM_TIME_SLOTS: 'atlas_custom_time_slots_mock_key',
  },
}));

describe('useTimeGrid Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storageService.get.mockResolvedValue({}); // Por defecto, no hay slots guardados
  });

  test('debe inicializar con horas por defecto y cargar slots vacíos', async () => {
    const { result } = renderHook(() => useTimeGrid(8, 18)); // De 8 AM a 6 PM
    
    // Esperar a que isLoading cambie
    await act(async () => {}); // Permite que el useEffect de carga se ejecute

    expect(result.current.isLoading).toBe(false);
    expect(result.current.hours.length).toBe(10); // 18 - 8 = 10 horas
    expect(result.current.hours[0]).toBe(8);
    expect(result.current.hours[9]).toBe(17);
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

    expect(result.current.customSlots[9]).toEqual([{ minutes: 30, duration: 30 }]); // 60 - 30
    expect(result.current.customSlots[10]).toEqual([
      { minutes: 15, duration: 30 }, // 45 - 15
      { minutes: 45, duration: 15 }, // 60 - 45
    ]);
  });

  test('addCustomTimeSlot debe añadir un slot y recalcular duraciones', async () => {
    const { result } = renderHook(() => useTimeGrid());
    await act(async () => {}); // Carga inicial

    act(() => {
      result.current.addCustomTimeSlot(9, 30);
    });
    expect(result.current.customSlots[9]).toEqual([{ minutes: 30, duration: 30 }]);
    expect(storageService.set).toHaveBeenCalledWith(STORAGE_KEYS.CUSTOM_TIME_SLOTS, { 9: [{ minutes: 30, duration: 30 }] });
    expect(eventBus.publish).toHaveBeenCalledWith('calendar.timeSlotsChanged', expect.any(Object));

    act(() => {
      result.current.addCustomTimeSlot(9, 15);
    });
    // Slots deberían estar ordenados y con duraciones actualizadas
    expect(result.current.customSlots[9]).toEqual([
      { minutes: 15, duration: 15 },
      { minutes: 30, duration: 30 },
    ]);
  });

  test('addCustomTimeSlot no debe añadir si el slot ya existe o es inválido', async () => {
    const { result } = renderHook(() => useTimeGrid());
    await act(async () => {});
    act(() => result.current.addCustomTimeSlot(9, 30)); // Añadir una vez

    storageService.set.mockClear();
    eventBus.publish.mockClear();

    let success = true;
    act(() => {
        success = result.current.addCustomTimeSlot(9, 30); // Intentar añadir de nuevo
    });
    expect(success).toBe(false);
    expect(result.current.customSlots[9].length).toBe(1); // No debería haber cambiado
    expect(storageService.set).not.toHaveBeenCalled();

    act(() => {
        success = result.current.addCustomTimeSlot(9, 20); // Minutos no son múltiplo de 15, se ajustará
    });
    expect(success).toBe(true); // se ajusta a 15 y lo añade si 15 no existe
    expect(result.current.customSlots[9].some(s => s.minutes === 15)).toBe(true);


    act(() => {
        success = result.current.addCustomTimeSlot(10, 45); // Añadir 45 sin 30 (inválido)
    });
    expect(success).toBe(false);
  });


  test('removeCustomTimeSlot debe eliminar un slot y recalcular duraciones', async () => {
    storageService.get.mockResolvedValue({ 9: [{ minutes: 15 }, { minutes: 30 }] });
    const { result } = renderHook(() => useTimeGrid());
    await act(async () => {}); // Carga inicial

    act(() => {
      result.current.removeCustomTimeSlot(9, 15);
    });
    expect(result.current.customSlots[9]).toEqual([{ minutes: 30, duration: 30 }]);
    expect(storageService.set).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalled();

    act(() => {
      result.current.removeCustomTimeSlot(9, 30);
    });
    expect(result.current.customSlots[9]).toBeUndefined(); // La hora se elimina si no quedan slots
  });

  test('formatTimeSlot debe formatear la hora correctamente', () => {
    const { result } = renderHook(() => useTimeGrid());
    expect(result.current.formatTimeSlot(9, 0)).toBe('9:00'); // Mock de dateUtils.formatHour
    expect(result.current.formatTimeSlot(10, 30)).toBe('10:30');
    expect(dateUtils.formatHour).toHaveBeenCalledWith(9);
  });

  describe('shouldShowEventStart', () => {
    const day = new Date(2023, 0, 15);
    const { result } = renderHook(() => useTimeGrid());

    test('debe devolver true si el evento empieza dentro del slot', () => {
      const event = { start: new Date(2023, 0, 15, 10, 15).toISOString() };
      expect(result.current.shouldShowEventStart(event, day, 10, 0, 60)).toBe(true); // Slot de 10:00 a 11:00
    });
    test('debe devolver false si el evento empieza fuera del slot o en otro día', () => {
      const event = { start: new Date(2023, 0, 15, 9, 59).toISOString() };
      expect(result.current.shouldShowEventStart(event, day, 10, 0, 60)).toBe(false);
      const eventOtherDay = { start: new Date(2023, 0, 16, 10, 0).toISOString() };
      expect(result.current.shouldShowEventStart(eventOtherDay, day, 10, 0, 60)).toBe(false);
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
  });

  test('getEventPositionInSlot debe calcular el offset correctamente', () => {
    const { result } = renderHook(() => useTimeGrid());
    const event = { start: new Date(2023, 0, 15, 10, 30).toISOString() }; // Evento a las 10:30
    const position = result.current.getEventPositionInSlot(event, 10, 0, 60, 60); // Slot de 10:00-11:00, altura 60px
    expect(position.offsetPercent).toBe(50); // 30min / 60min
    expect(position.offsetPixels).toBe(30); // (30min / 60min) * 60px
  });
});