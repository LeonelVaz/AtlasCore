// test/unit/src/utils/debug-utils.test.js

/**
 * @jest-environment jsdom
 */

import { setupDebugTools } from "../../../../src/utils/debug-utils"; // Ajusta la ruta si es diferente

describe("Debug Utils", () => {
  let mockEvents;
  let mockCreateEvent;
  let mockUpdateEvent;
  let mockSaveEvents;
  let originalWindowDebugAtlas;

  beforeEach(() => {
    mockEvents = [
      {
        id: "1",
        title: "Event 1",
        start: new Date().toISOString(),
        end: new Date().toISOString(),
      },
    ];
    mockCreateEvent = jest.fn((eventData) => ({
      ...eventData,
      id: "new-" + Date.now(),
    }));
    mockUpdateEvent = jest.fn((id, data) => ({ ...data, id }));
    mockSaveEvents = jest.fn();

    // Guardar y limpiar cualquier window.debugAtlas previo
    if (typeof window !== "undefined") {
      originalWindowDebugAtlas = window.debugAtlas;
      delete window.debugAtlas;
    }
  });

  afterEach(() => {
    // Restaurar window.debugAtlas si existía
    if (typeof window !== "undefined") {
      if (originalWindowDebugAtlas) {
        window.debugAtlas = originalWindowDebugAtlas;
      } else {
        delete window.debugAtlas;
      }
    }
  });

  test("debe configurar window.debugAtlas con las funciones correctas", () => {
    if (typeof window === "undefined") {
      // Si window no está definido (ej. Node puro sin JSDOM), el test no es aplicable
      // o setupDebugTools debería manejarlo graciosamente.
      // El hook ya tiene: if (typeof window === 'undefined') return () => {};
      const cleanup = setupDebugTools(
        mockEvents,
        mockCreateEvent,
        mockUpdateEvent,
        mockSaveEvents
      );
      expect(typeof cleanup).toBe("function");
      cleanup(); // No debería fallar
      return;
    }

    setupDebugTools(
      mockEvents,
      mockCreateEvent,
      mockUpdateEvent,
      mockSaveEvents
    );

    expect(window.debugAtlas).toBeDefined();
    expect(typeof window.debugAtlas.getEvents).toBe("function");
    expect(typeof window.debugAtlas.createTestEvent).toBe("function");
    expect(typeof window.debugAtlas.forceUpdate).toBe("function");
    expect(typeof window.debugAtlas.saveAllEvents).toBe("function");
  });

  test("window.debugAtlas.getEvents debe devolver los eventos actuales", () => {
    if (typeof window === "undefined") return;
    setupDebugTools(
      mockEvents,
      mockCreateEvent,
      mockUpdateEvent,
      mockSaveEvents
    );
    expect(window.debugAtlas.getEvents()).toEqual(mockEvents);
  });

  test("window.debugAtlas.createTestEvent debe llamar a createEvent con datos de prueba", () => {
    if (typeof window === "undefined") return;
    setupDebugTools(
      mockEvents,
      mockCreateEvent,
      mockUpdateEvent,
      mockSaveEvents
    );
    window.debugAtlas.createTestEvent();

    expect(mockCreateEvent).toHaveBeenCalled();
    const calledWith = mockCreateEvent.mock.calls[0][0];
    expect(calledWith.title).toMatch(/Evento de prueba \d+/);
    expect(calledWith.color).toBe("#FF5722");
    expect(new Date(calledWith.start) < new Date(calledWith.end)).toBe(true);
  });

  test("window.debugAtlas.forceUpdate debe llamar a updateEvent con fechas modificadas", () => {
    if (typeof window === "undefined") return;
    setupDebugTools(
      mockEvents,
      mockCreateEvent,
      mockUpdateEvent,
      mockSaveEvents
    );
    const eventIdToUpdate = "1";
    const hoursToMove = 2;

    window.debugAtlas.forceUpdate(eventIdToUpdate, hoursToMove);

    expect(mockUpdateEvent).toHaveBeenCalled();
    const [calledId, calledData] = mockUpdateEvent.mock.calls[0];
    expect(calledId).toBe(eventIdToUpdate);

    const originalStartDate = new Date(mockEvents[0].start);
    const expectedStartDate = new Date(originalStartDate);
    expectedStartDate.setHours(originalStartDate.getHours() + hoursToMove);

    expect(new Date(calledData.start).getHours()).toBe(
      expectedStartDate.getHours()
    );
  });

  test("window.debugAtlas.forceUpdate debe devolver null si el evento no existe", () => {
    if (typeof window === "undefined") return;
    setupDebugTools(
      mockEvents,
      mockCreateEvent,
      mockUpdateEvent,
      mockSaveEvents
    );
    const result = window.debugAtlas.forceUpdate("non-existent-id", 1);
    expect(result).toBeNull();
    expect(mockUpdateEvent).not.toHaveBeenCalled();
  });

  test("window.debugAtlas.saveAllEvents debe llamar a saveEvents", () => {
    if (typeof window === "undefined") return;
    setupDebugTools(
      mockEvents,
      mockCreateEvent,
      mockUpdateEvent,
      mockSaveEvents
    );
    const result = window.debugAtlas.saveAllEvents();
    expect(mockSaveEvents).toHaveBeenCalledWith(mockEvents);
    expect(result).toBe("Eventos guardados manualmente");
  });

  test("la función de limpieza debe eliminar window.debugAtlas", () => {
    if (typeof window === "undefined") return;
    const cleanup = setupDebugTools(
      mockEvents,
      mockCreateEvent,
      mockUpdateEvent,
      mockSaveEvents
    );
    expect(window.debugAtlas).toBeDefined();
    cleanup();
    expect(window.debugAtlas).toBeUndefined();
  });

  test("no debe fallar si window no está definido al ejecutar", () => {
    const originalWin = global.window;
    delete global.window; // Simular que no hay window

    let cleanupFunction;
    expect(() => {
      cleanupFunction = setupDebugTools(
        mockEvents,
        mockCreateEvent,
        mockUpdateEvent,
        mockSaveEvents
      );
    }).not.toThrow();
    expect(typeof cleanupFunction).toBe("function");

    // La función de cleanup también debería ser segura
    expect(() => {
      if (cleanupFunction) cleanupFunction();
    }).not.toThrow();

    global.window = originalWin; // Restaurar
  });
});
