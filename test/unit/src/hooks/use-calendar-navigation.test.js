// test/unit/src/hooks/use-calendar-navigation.test.jsx

/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";

// Mocks ANTES de la importación del hook
jest.mock("../../../../src/core/bus/event-bus", () => {
  const actualEvents = jest.requireActual("../../../../src/core/bus/events");
  return {
    __esModule: true,
    default: {
      publish: jest.fn(),
    },
    CalendarEvents: actualEvents.CalendarEvents,
  };
});

// Importar el hook DESPUÉS de los mocks
import useCalendarNavigation from "../../../../src/hooks/use-calendar-navigation";
// Importar mocks para aserciones (DESPUÉS de jest.mock)
const eventBus = require("../../../../src/core/bus/event-bus").default;
const { CalendarEvents } = require("../../../../src/core/bus/event-bus");

describe("useCalendarNavigation Hook", () => {
  let initialDate;
  let dateSpy;
  const OriginalDate = global.Date; // Guardar el constructor original de Date

  beforeEach(() => {
    jest.clearAllMocks();
    initialDate = new OriginalDate(2023, 0, 15, 12, 0, 0); // Usar OriginalDate para la fecha base

    // Mockear new Date()
    dateSpy = jest.spyOn(global, "Date").mockImplementation((...args) => {
      if (args.length === 0) {
        // Cuando se llama como `new Date()` para obtener la fecha "actual"
        return new OriginalDate(initialDate.getTime()); // Devolver una copia de initialDate
      }
      // Cuando se llama con argumentos, como `new Date(timestamp)` o `new Date(year, month, day)`
      return new OriginalDate(...args); // Usar el constructor original con los argumentos pasados
    });
  });

  afterEach(() => {
    dateSpy.mockRestore(); // Esto restaurará global.Date a su implementación original
  });

  test("debe inicializar currentDate y selectedDay con la fecha actual (mockeada)", () => {
    const { result } = renderHook(() => useCalendarNavigation());
    // El hook llama internamente a new Date() para inicializar, lo que usa nuestro mock
    expect(result.current.currentDate.getTime()).toBe(initialDate.getTime());
    expect(result.current.selectedDay.getTime()).toBe(initialDate.getTime());
  });

  test("goToPreviousWeek debe restar 7 días y publicar evento", () => {
    const { result } = renderHook(() => useCalendarNavigation());
    // currentDate y selectedDay se inicializan con nuestro mock de Date()
    const previousCurrentDate = new OriginalDate(
      result.current.currentDate.getTime()
    ); // Crear una copia usando OriginalDate

    act(() => {
      result.current.goToPreviousWeek();
    });

    const expectedDate = new OriginalDate(initialDate.getTime());
    expectedDate.setDate(expectedDate.getDate() - 7);

    expect(result.current.currentDate.getTime()).toBe(expectedDate.getTime());
    expect(eventBus.publish).toHaveBeenCalledWith(CalendarEvents.DATE_CHANGED, {
      date: result.current.currentDate,
      previousDate: previousCurrentDate, // Esta es una instancia de Date creada por el mock
      navigation: "previousWeek",
    });
  });

  test("goToNextWeek debe sumar 7 días y publicar evento", () => {
    const { result } = renderHook(() => useCalendarNavigation());
    const previousCurrentDate = new OriginalDate(
      result.current.currentDate.getTime()
    );

    act(() => {
      result.current.goToNextWeek();
    });

    const expectedDate = new OriginalDate(initialDate.getTime());
    expectedDate.setDate(expectedDate.getDate() + 7);

    expect(result.current.currentDate.getTime()).toBe(expectedDate.getTime());
    expect(eventBus.publish).toHaveBeenCalledWith(CalendarEvents.DATE_CHANGED, {
      date: result.current.currentDate,
      previousDate: previousCurrentDate,
      navigation: "nextWeek",
    });
  });

  test("goToCurrentWeek debe ir a la fecha actual (mockeada) y publicar evento", () => {
    const { result } = renderHook(() => useCalendarNavigation());

    const differentDate = new OriginalDate(2023, 0, 1, 10, 0, 0);
    act(() => {
      // setCurrentDate internamente creará `new Date(differentDate)`
      // que nuestro spy interceptará y usará `new OriginalDate(differentDate)`
      result.current.setCurrentDate(differentDate);
    });
    const previousCurrentDate = new OriginalDate(
      result.current.currentDate.getTime()
    );

    act(() => {
      result.current.goToCurrentWeek(); // Esto llamará a `new Date()` internamente
    });

    expect(result.current.currentDate.getTime()).toBe(initialDate.getTime());
    expect(eventBus.publish).toHaveBeenCalledWith(CalendarEvents.DATE_CHANGED, {
      date: result.current.currentDate,
      previousDate: previousCurrentDate,
      navigation: "today",
    });
  });

  test("goToPreviousDay debe restar 1 día a selectedDay y publicar evento", () => {
    const { result } = renderHook(() => useCalendarNavigation());
    const previousSelectedDay = new OriginalDate(
      result.current.selectedDay.getTime()
    );

    act(() => {
      result.current.goToPreviousDay();
    });

    const expectedDate = new OriginalDate(initialDate.getTime());
    expectedDate.setDate(expectedDate.getDate() - 1);

    expect(result.current.selectedDay.getTime()).toBe(expectedDate.getTime());
    expect(eventBus.publish).toHaveBeenCalledWith(CalendarEvents.DATE_CHANGED, {
      date: result.current.selectedDay,
      previousDate: previousSelectedDay,
      navigation: "previousDay",
    });
  });

  test("goToNextDay debe sumar 1 día a selectedDay y publicar evento", () => {
    const { result } = renderHook(() => useCalendarNavigation());
    const previousSelectedDay = new OriginalDate(
      result.current.selectedDay.getTime()
    );

    act(() => {
      result.current.goToNextDay();
    });

    const expectedDate = new OriginalDate(initialDate.getTime());
    expectedDate.setDate(expectedDate.getDate() + 1);

    expect(result.current.selectedDay.getTime()).toBe(expectedDate.getTime());
    expect(eventBus.publish).toHaveBeenCalledWith(CalendarEvents.DATE_CHANGED, {
      date: result.current.selectedDay,
      previousDate: previousSelectedDay,
      navigation: "nextDay",
    });
  });

  test("goToToday debe establecer selectedDay y currentDate a hoy (mockeado), y publicar evento", () => {
    const { result } = renderHook(() => useCalendarNavigation());

    const differentCurrentDate = new OriginalDate(2023, 0, 1, 10, 0, 0);
    const differentSelectedDay = new OriginalDate(2023, 0, 5, 10, 0, 0);
    act(() => {
      result.current.setCurrentDate(differentCurrentDate);
      result.current.setSelectedDay(differentSelectedDay);
    });
    const previousSelectedDay = new OriginalDate(
      result.current.selectedDay.getTime()
    );

    act(() => {
      result.current.goToToday();
    });

    expect(result.current.selectedDay.getTime()).toBe(initialDate.getTime());
    expect(result.current.currentDate.getTime()).toBe(initialDate.getTime());
    expect(eventBus.publish).toHaveBeenCalledWith(CalendarEvents.DATE_CHANGED, {
      date: result.current.selectedDay,
      previousDate: previousSelectedDay,
      navigation: "today",
    });
  });
});
