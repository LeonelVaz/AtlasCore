/**
 * @jest-environment jsdom
 */
import calendarModule from "../../../../../src/core/modules/calendar-module";
import { CALENDAR_VIEWS } from "../../../../../src/core/config/constants";
import { act } from "@testing-library/react";

jest.mock("../../../../../src/core/bus/event-bus", () => ({
  __esModule: true,
  default: {
    subscribe: jest.fn(),
  },
  CalendarEvents: {
    EVENTS_LOADED: "calendar:eventsLoaded",
    EVENT_CREATED: "calendar:eventCreated",
    EVENT_UPDATED: "calendar:eventUpdated",
    EVENT_DELETED: "calendar:eventDeleted",
  },
}));

const eventBus = require("../../../../../src/core/bus/event-bus").default;
const { CalendarEvents } = require("../../../../../src/core/bus/event-bus");

const OriginalDate = global.Date;

describe("CalendarModule", () => {
  let mockCalendarService;
  let mockEventBusUnsubscribe;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEventBusUnsubscribe = jest.fn();
    eventBus.subscribe.mockReturnValue(mockEventBusUnsubscribe);
    calendarModule.cleanup();

    mockCalendarService = {
      getCurrentDate: jest.fn(
        () => new OriginalDate("2023-01-15T10:00:00.000Z")
      ),
      getEvents: jest.fn(() => [
        {
          id: "1",
          start: new OriginalDate("2023-01-15T09:00:00Z"),
          end: new OriginalDate("2023-01-15T10:00:00Z"),
          title: "Event 1",
        },
        {
          id: "2",
          start: new OriginalDate("2023-01-15T11:00:00Z"),
          end: new OriginalDate("2023-01-15T12:00:00Z"),
          title: "Event 2",
        },
      ]),
      getCurrentView: jest.fn(() => CALENDAR_VIEWS.WEEK),
      createEvent: jest.fn((data) => ({ ...data, id: "newEventId" })),
      updateEvent: jest.fn((id, data) => ({ ...data, id })),
      deleteEvent: jest.fn(),
      getConfig: jest.fn(() => ({
        timeScale: { id: "standard", pixelsPerHour: 60 },
        maxSimultaneousEvents: 3,
        snapValue: 0,
        dayHeaderStyle: "default",
        timeDisplayStyle: "start-end",
      })),
    };
    global.Date = OriginalDate;
  });

  afterEach(() => {
    calendarModule.cleanup();
    global.Date = OriginalDate;
  });

  // --- Tests de init ---
  describe("init", () => {
    test("no debe inicializar si no se proporciona calendarService y loguear error", () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const result = calendarModule.init(null);
      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "CalendarModule: No se proporcionó servicio de calendario"
      );
      expect(calendarModule._initialized).toBe(false);
      consoleErrorSpy.mockRestore();
    });

    test("debe inicializar correctamente con un calendarService válido", () => {
      const result = calendarModule.init(mockCalendarService);
      expect(result).toBe(true);
      expect(calendarModule._initialized).toBe(true);
      expect(mockCalendarService.getCurrentDate).toHaveBeenCalled();
      expect(mockCalendarService.getEvents).toHaveBeenCalled();
      expect(mockCalendarService.getCurrentView).toHaveBeenCalled();
      expect(eventBus.subscribe).toHaveBeenCalledTimes(4);
    });

    test("debe llamar a cleanup si se inicializa de nuevo", () => {
      calendarModule.init(mockCalendarService);
      const cleanupSpy = jest.spyOn(calendarModule, "cleanup");
      calendarModule.init(mockCalendarService);
      expect(cleanupSpy).toHaveBeenCalledTimes(1);
      cleanupSpy.mockRestore();
    });

    test("solo debe configurar event listeners una vez aunque init se llame múltiples veces", () => {
      calendarModule.init(mockCalendarService);
      expect(eventBus.subscribe).toHaveBeenCalledTimes(4);
      eventBus.subscribe.mockClear();

      calendarModule.init(mockCalendarService);
      expect(eventBus.subscribe).toHaveBeenCalledTimes(4);
    });
  });

  // --- Tests de métodos de obtención ---
  describe("Métodos de obtención de datos (después de init)", () => {
    beforeEach(() => {
      calendarModule.init(mockCalendarService);
    });

    test("getEvents debe devolver los eventos del estado interno", () => {
      const events = calendarModule.getEvents();
      expect(events).toEqual(mockCalendarService.getEvents());
      const internalEvents = calendarModule._calendarState.events;
      expect(events).not.toBe(internalEvents);
    });

    test("getCurrentView debe devolver la vista actual", () => {
      expect(calendarModule.getCurrentView()).toBe(CALENDAR_VIEWS.WEEK);
    });

    test("getSelectedDate debe devolver la fecha seleccionada", () => {
      expect(calendarModule.getSelectedDate()).toEqual(
        new OriginalDate("2023-01-15T10:00:00.000Z")
      );
    });

    test("getEvent debe devolver un evento por ID o null", () => {
      expect(calendarModule.getEvent("1")).toEqual(
        mockCalendarService.getEvents()[0]
      );
      expect(calendarModule.getEvent("nonExistentId")).toBeNull();
      expect(calendarModule.getEvent(null)).toBeNull();
    });

    test("getCalendarConfig debe devolver la configuración del servicio o una por defecto", () => {
      expect(calendarModule.getCalendarConfig()).toEqual(
        mockCalendarService.getConfig()
      );

      const serviceWithoutConfig = {
        ...mockCalendarService,
        getConfig: undefined,
      };
      calendarModule.init(serviceWithoutConfig);
      const defaultConfig = {
        timeScale: { id: "standard", pixelsPerHour: 60 },
        maxSimultaneousEvents: 3,
        snapValue: 0,
        dayHeaderStyle: "default",
        timeDisplayStyle: "start-end",
      };
      expect(calendarModule.getCalendarConfig()).toEqual(defaultConfig);
    });
  });

  // --- Tests de manipulación de eventos ---
  describe("Manipulación de Eventos (después de init)", () => {
    beforeEach(() => {
      calendarModule.init(mockCalendarService);
    });

    test("createEvent debe llamar al método del servicio", () => {
      const eventData = {
        title: "New Event",
        start: new OriginalDate(),
        end: new OriginalDate(),
      };
      calendarModule.createEvent(eventData);
      expect(mockCalendarService.createEvent).toHaveBeenCalledWith(eventData);
    });

    test("updateEvent debe llamar al método del servicio", () => {
      const eventData = { title: "Updated Event" };
      calendarModule.updateEvent("1", eventData);
      expect(mockCalendarService.updateEvent).toHaveBeenCalledWith(
        "1",
        eventData
      );
    });

    test("deleteEvent debe llamar al método del servicio", () => {
      calendarModule.deleteEvent("1");
      expect(mockCalendarService.deleteEvent).toHaveBeenCalledWith("1");
    });
  });

  // --- Tests de suscripciones a EventBus ---
  describe("Suscripciones a EventBus (después de init)", () => {
    let capturedCallbacks = {};

    beforeEach(() => {
      capturedCallbacks = {};
      eventBus.subscribe.mockImplementation((eventName, callback) => {
        capturedCallbacks[eventName] = callback;
        return mockEventBusUnsubscribe;
      });
      calendarModule.init(mockCalendarService);
    });

    test("debe actualizar eventos internos cuando se dispara EVENTS_LOADED", () => {
      const newEvents = [{ id: "3", title: "Loaded Event" }];
      expect(capturedCallbacks[CalendarEvents.EVENTS_LOADED]).toBeInstanceOf(
        Function
      );
      act(() => {
        capturedCallbacks[CalendarEvents.EVENTS_LOADED]({ events: newEvents });
      });
      expect(calendarModule.getEvents()).toEqual(newEvents);
    });

    test("debe añadir evento cuando se dispara EVENT_CREATED", () => {
      const newEvent = {
        id: "new1",
        title: "Created Event",
        start: new OriginalDate(),
        end: new OriginalDate(),
      };
      const initialEventCount = calendarModule.getEvents().length;
      expect(capturedCallbacks[CalendarEvents.EVENT_CREATED]).toBeInstanceOf(
        Function
      );
      act(() => {
        capturedCallbacks[CalendarEvents.EVENT_CREATED]({ event: newEvent });
      });
      expect(calendarModule.getEvents().length).toBe(initialEventCount + 1);
      expect(calendarModule.getEvent("new1")).toEqual(newEvent);
    });

    test("no debe añadir evento si ya existe al disparar EVENT_CREATED", () => {
      const existingEvent = calendarModule.getEvents()[0];
      const initialEventCount = calendarModule.getEvents().length;
      expect(capturedCallbacks[CalendarEvents.EVENT_CREATED]).toBeInstanceOf(
        Function
      );
      act(() => {
        capturedCallbacks[CalendarEvents.EVENT_CREATED]({
          event: existingEvent,
        });
      });
      expect(calendarModule.getEvents().length).toBe(initialEventCount);
    });

    test("debe actualizar evento cuando se dispara EVENT_UPDATED", () => {
      const updatedEventData = {
        id: "1",
        title: "Event 1 Updated",
        start: new OriginalDate("2023-01-15T09:00:00Z"),
        end: new OriginalDate("2023-01-15T10:30:00Z"),
      };
      expect(capturedCallbacks[CalendarEvents.EVENT_UPDATED]).toBeInstanceOf(
        Function
      );
      act(() => {
        capturedCallbacks[CalendarEvents.EVENT_UPDATED]({
          newEvent: updatedEventData,
        });
      });
      const updatedEvent = calendarModule.getEvent("1");
      expect(updatedEvent.title).toBe("Event 1 Updated");
      expect(new OriginalDate(updatedEvent.end)).toEqual(
        new OriginalDate("2023-01-15T10:30:00Z")
      );
    });

    test("debe eliminar evento cuando se dispara EVENT_DELETED", () => {
      const eventToDelete = { id: "1" };
      const initialEventCount = calendarModule.getEvents().length;
      expect(capturedCallbacks[CalendarEvents.EVENT_DELETED]).toBeInstanceOf(
        Function
      );
      act(() => {
        capturedCallbacks[CalendarEvents.EVENT_DELETED]({
          event: eventToDelete,
        });
      });
      expect(calendarModule.getEvents().length).toBe(initialEventCount - 1);
      expect(calendarModule.getEvent("1")).toBeNull();
    });
  });

  // --- Test de cleanup ---
  describe("cleanup", () => {
    test("debe llamar a las funciones de desuscripción al limpiar", () => {
      calendarModule.init(mockCalendarService);
      expect(eventBus.subscribe).toHaveBeenCalledTimes(4);

      calendarModule.cleanup();

      expect(mockEventBusUnsubscribe).toHaveBeenCalledTimes(4);
      expect(calendarModule._initialized).toBe(false);
      expect(calendarModule._subscriptionsActive).toBe(false);
      expect(calendarModule._eventListeners.length).toBe(0);
    });
  });

  // --- Tests de Filtrado y Agrupación ---
  describe("Filtrado y Agrupación de Eventos (después de init)", () => {
    const mockEventsForFiltering = [
      {
        id: "ev1",
        title: "Morning Meeting",
        start: "2023-10-26T09:00:00Z",
        end: "2023-10-26T10:00:00Z",
        color: "blue",
      },
      {
        id: "ev2",
        title: "Lunch",
        start: "2023-10-26T12:00:00Z",
        end: "2023-10-26T13:00:00Z",
        color: "green",
      },
      {
        id: "ev3",
        title: "Afternoon Task",
        start: "2023-10-26T14:00:00Z",
        end: "2023-10-26T16:00:00Z",
        color: "blue",
      },
      {
        id: "ev4",
        title: "Next Day Prep",
        start: "2023-10-27T10:00:00Z",
        end: "2023-10-27T11:00:00Z",
        color: "red",
      },
      {
        id: "ev5",
        title: "All Day Event",
        start: "2023-10-26T00:00:00Z",
        end: "2023-10-26T23:59:59Z",
        color: "yellow",
      },
    ];

    beforeEach(() => {
      mockCalendarService.getEvents.mockReturnValue(
        mockEventsForFiltering.map((e) => ({
          ...e,
          start: new OriginalDate(e.start),
          end: new OriginalDate(e.end),
        }))
      );
      calendarModule.init(mockCalendarService);
    });

    test("getEventsForDate debe devolver eventos para la fecha dada", () => {
      const events = calendarModule.getEventsForDate(
        new OriginalDate("2023-10-26T10:00:00Z")
      );
      expect(events.length).toBe(4);
      expect(events.map((e) => e.id).sort()).toEqual(
        ["ev1", "ev2", "ev3", "ev5"].sort()
      );
    });

    test("getEventsForDateRange debe devolver eventos dentro del rango (considerando normalización del método)", () => {
      const events = calendarModule.getEventsForDateRange(
        "2023-10-26T00:00:00Z",
        "2023-10-26T12:30:00Z"
      );
      expect(events.length).toBe(4);
      expect(events.map((e) => e.id).sort()).toEqual(
        ["ev1", "ev2", "ev3", "ev5"].sort()
      );
    });

    test("getUpcomingEvents debe devolver eventos futuros ordenados (con mock de Date)", () => {
      const MOCK_NOW_STRING = "2023-10-26T11:00:00Z";
      const dateSpy = jest
        .spyOn(global, "Date")
        .mockImplementation((...args) => {
          if (
            args.length > 0 &&
            typeof args[0] === "string" &&
            args[0].includes("-")
          ) {
            // Si es un string de fecha ISO
            return new OriginalDate(...args);
          }
          if (args.length === 0) {
            // new Date()
            return new OriginalDate(MOCK_NOW_STRING);
          }
          return new OriginalDate(...args); // Para otros constructores (ej. new Date(year, month, day))
        });

      const upcoming = calendarModule.getUpcomingEvents(2);
      expect(upcoming.length).toBe(2);
      expect(upcoming.map((e) => e.id)).toEqual(["ev5", "ev2"]);

      dateSpy.mockRestore();
    });

    test("getEventsByCategory debe agrupar eventos por color", () => {
      const grouped = calendarModule.getEventsByCategory("color");
      expect(Object.keys(grouped).length).toBe(4);
      expect(grouped.blue.length).toBe(2);
      expect(grouped.green.length).toBe(1);
      expect(grouped.red.length).toBe(1);
      expect(grouped.yellow.length).toBe(1);
    });

    test("getMonthMetadata debe devolver metadatos para los días del mes (Octubre - 31 días)", () => {
      // Para asegurar que Octubre (índice 9) se usa, creamos la fecha explícitamente.
      // OriginalDate(year, monthIndex, day)
      const testDateForOctober = new OriginalDate(2023, 9, 1); // 9 es Octubre

      const metadata = calendarModule.getMonthMetadata(testDateForOctober);

      // Log para depurar si sigue fallando:
      // console.log('DEBUG getMonthMetadata - metadata.length:', metadata.length);
      // if (metadata.length === 30) {
      //   console.log('DEBUG getMonthMetadata - primer día:', metadata[0]?.date.toISOString());
      //   console.log('DEBUG getMonthMetadata - último día:', metadata[metadata.length -1]?.date.toISOString());
      // }

      expect(metadata.length).toBe(31);

      const day26 = metadata.find((d) => d.day === 26);
      expect(day26).toBeDefined(); // Añadir verificación de que se encontró el día
      if (day26) {
        // Solo acceder a props si day26 existe
        expect(day26.hasEvents).toBe(true);
        expect(day26.eventCount).toBe(4);
        expect(day26.eventColors).toEqual(
          expect.arrayContaining(["blue", "green", "yellow"])
        );
      }

      const day27 = metadata.find((d) => d.day === 27);
      expect(day27).toBeDefined();
      if (day27) {
        expect(day27.hasEvents).toBe(true);
        expect(day27.eventCount).toBe(1);
        expect(day27.eventColors).toEqual(["red"]);
      }
    });
  });
});
