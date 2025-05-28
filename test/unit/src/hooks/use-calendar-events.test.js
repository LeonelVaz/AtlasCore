// test/unit/src/hooks/use-calendar-events.test.jsx

/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
// Importaciones mockeadas DEBEN ir ANTES de la importación del hook
jest.mock("../../../../src/core/bus/event-bus", () => {
  const actualEvents = jest.requireActual("../../../../src/core/bus/events");
  return {
    __esModule: true,
    default: {
      publish: jest.fn(),
      subscribe: jest.fn(() => jest.fn()),
    },
    EventCategories: actualEvents.EventCategories,
    CalendarEvents: actualEvents.CalendarEvents,
  };
});

jest.mock("../../../../src/services/storage-service", () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

jest.mock("../../../../src/core/config/constants", () => ({
  __esModule: true,
  STORAGE_KEYS: {
    EVENTS: "atlas_events_mock_key_for_test_calevents",
  },
}));

// Importar el hook DESPUÉS de los mocks
import useCalendarEvents from "../../../../src/hooks/use-calendar-events";
// Importar mocks para aserciones (DESPUÉS de jest.mock)
const eventBus = require("../../../../src/core/bus/event-bus").default;
const { CalendarEvents } = require("../../../../src/core/bus/event-bus");
const storageService = require("../../../../src/services/storage-service");
const { STORAGE_KEYS } = require("../../../../src/core/config/constants");

describe("useCalendarEvents Hook", () => {
  const mockEvents = [
    {
      id: "1",
      title: "Evento 1",
      start: new Date(2023, 0, 1, 10, 0).toISOString(),
      end: new Date(2023, 0, 1, 11, 0).toISOString(),
    },
    {
      id: "2",
      title: "Evento 2",
      start: new Date(2023, 0, 2, 14, 0).toISOString(),
      end: new Date(2023, 0, 2, 15, 0).toISOString(),
    },
  ];
  let mockEventBusStorageUpdateCallback = null;
  let originalConsoleError;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    originalConsoleError = console.error;
    console.error = jest.fn();

    eventBus.subscribe.mockImplementation((eventName, callback) => {
      if (eventName === `${"storage"}.eventsUpdated`) {
        mockEventBusStorageUpdateCallback = callback;
      }
      return jest.fn();
    });
  });

  afterEach(() => {
    mockEventBusStorageUpdateCallback = null;
    console.error = originalConsoleError;
    jest.useRealTimers();
  });

  test("debe cargar eventos iniciales desde storageService y publicar EVENTS_LOADED", async () => {
    storageService.get.mockResolvedValue([...mockEvents]);
    const { result } = renderHook(() => useCalendarEvents());

    await act(async () => {});
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(storageService.get).toHaveBeenCalledWith(STORAGE_KEYS.EVENTS, []);
    expect(result.current.events).toEqual(mockEvents);
    expect(eventBus.subscribe).toHaveBeenCalledWith(
      "storage.eventsUpdated",
      expect.any(Function)
    );
    expect(eventBus.publish).toHaveBeenCalledWith(
      CalendarEvents.EVENTS_LOADED,
      {
        events: mockEvents,
        count: mockEvents.length,
      }
    );
  });

  test("debe manejar un array vacío o datos inválidos al cargar eventos", async () => {
    storageService.get.mockResolvedValueOnce([]);
    const { result: resultEmpty } = renderHook(() => useCalendarEvents());
    await act(async () => {});
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(resultEmpty.current.events).toEqual([]);

    storageService.get.mockResolvedValueOnce(null);
    const { result: resultNull } = renderHook(() => useCalendarEvents());
    await act(async () => {});
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(resultNull.current.events).toEqual([]);
    expect(console.error).toHaveBeenCalledWith(
      "Los datos cargados no son un array válido"
    );

    storageService.get.mockResolvedValueOnce([
      { id: "3", title: "Invalid Date", start: "no-es-fecha", end: "tampoco" },
    ]);
    const { result: resultInvalidDate } = renderHook(() => useCalendarEvents());
    await act(async () => {});
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(resultInvalidDate.current.events).toEqual([]);
  });

  test('debe recargar eventos cuando eventBus publica "storage.eventsUpdated"', async () => {
    storageService.get.mockResolvedValueOnce([]);
    const { result } = renderHook(() => useCalendarEvents());
    await act(async () => {});

    const newMockEvents = [
      {
        id: "3",
        title: "Nuevo Evento",
        start: new Date().toISOString(),
        end: new Date().toISOString(),
      },
    ];
    storageService.get.mockResolvedValueOnce([...newMockEvents]);

    expect(mockEventBusStorageUpdateCallback).toBeInstanceOf(Function);
    await act(async () => {
      if (mockEventBusStorageUpdateCallback) {
        mockEventBusStorageUpdateCallback();
      }
    });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current.events).toEqual(newMockEvents);
    expect(storageService.get).toHaveBeenCalledTimes(2);
  });

  test("createEvent debe añadir un evento, guardarlo y publicarlo", async () => {
    storageService.get.mockResolvedValue([]);
    const { result } = renderHook(() => useCalendarEvents());
    await act(async () => {});

    const newEventData = {
      title: "Evento Creado",
      start: new Date(2023, 0, 3, 10, 0).toISOString(),
      end: new Date(2023, 0, 3, 11, 0).toISOString(),
    };
    let createdEvent;
    await act(async () => {
      createdEvent = result.current.createEvent(newEventData);
    });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current.events.length).toBe(1);
    expect(result.current.events[0].title).toBe("Evento Creado");
    expect(storageService.set).toHaveBeenCalledWith(
      STORAGE_KEYS.EVENTS,
      expect.arrayContaining([
        expect.objectContaining({ title: "Evento Creado" }),
      ])
    );
    expect(eventBus.publish).toHaveBeenCalledWith(
      CalendarEvents.EVENT_CREATED,
      { event: createdEvent }
    );
  });

  test("updateEvent debe modificar un evento, guardarlo y publicarlo", async () => {
    storageService.get.mockResolvedValue([...mockEvents]);
    const { result } = renderHook(() => useCalendarEvents());
    await act(async () => {});
    act(() => {
      jest.advanceTimersByTime(100);
    });
    eventBus.publish.mockClear();

    const eventToUpdateId = mockEvents[0].id;
    const oldEvent = mockEvents[0];
    const updatedEventData = { ...oldEvent, title: "Evento Actualizado" };
    let updatedEventResult;

    await act(async () => {
      updatedEventResult = result.current.updateEvent(
        eventToUpdateId,
        updatedEventData
      );
    });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(
      result.current.events.find((e) => e.id === eventToUpdateId).title
    ).toBe("Evento Actualizado");
    expect(storageService.set).toHaveBeenCalledWith(
      STORAGE_KEYS.EVENTS,
      expect.any(Array)
    );
    expect(eventBus.publish).toHaveBeenCalledWith(
      CalendarEvents.EVENT_UPDATED,
      { oldEvent, newEvent: updatedEventResult }
    );
  });

  test("deleteEvent debe eliminar un evento, guardarlo y publicarlo", async () => {
    storageService.get.mockResolvedValue([...mockEvents]);
    const { result } = renderHook(() => useCalendarEvents());
    await act(async () => {});
    act(() => {
      jest.advanceTimersByTime(100);
    });
    eventBus.publish.mockClear();

    const eventToDelete = mockEvents[0];
    await act(async () => {
      result.current.deleteEvent(eventToDelete.id);
    });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(
      result.current.events.find((e) => e.id === eventToDelete.id)
    ).toBeUndefined();
    expect(result.current.events.length).toBe(mockEvents.length - 1);
    expect(storageService.set).toHaveBeenCalledWith(
      STORAGE_KEYS.EVENTS,
      expect.any(Array)
    );
    expect(eventBus.publish).toHaveBeenCalledWith(
      CalendarEvents.EVENT_DELETED,
      { event: eventToDelete }
    );
  });

  test("debe desuscribirse de eventBus al desmontar", async () => {
    storageService.get.mockResolvedValue([]);
    const mockUnsubscribe = jest.fn();
    eventBus.subscribe.mockImplementation((eventName, callback) => {
      if (eventName === `storage.eventsUpdated`) {
        mockEventBusStorageUpdateCallback = callback;
      }
      return mockUnsubscribe;
    });

    const { unmount } = renderHook(() => useCalendarEvents());
    await act(async () => {});
    act(() => {
      unmount();
    });
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
