/**
 * @jest-environment jsdom
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";

// --- Mocking Dependencies ---
const mockStorageService = {
  get: jest.fn(),
  set: jest.fn(),
};
jest.mock(
  "../../../../../src/services/storage-service",
  () => mockStorageService
);

const mockEventBus = {
  publish: jest.fn(),
  subscribe: jest.fn(() => jest.fn()), // Return an unsubscribe function
};
jest.mock("../../../../../src/core/bus/event-bus", () => mockEventBus);

jest.mock("../../../../../src/core/config/constants", () => ({
  STORAGE_KEYS: {
    MAX_SIMULTANEOUS_EVENTS: "test_calendar.maxSimultaneousEvents",
  },
}));

// --- Import Component Under Test ---
const CalendarConfig =
  require("../../../../../src/components/settings/calendar-config").default;
const { STORAGE_KEYS } = require("../../../../../src/core/config/constants");

describe("CalendarConfig Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageService.get.mockImplementation(async (key, defaultValue) => {
      if (mockStorageService.get.specificMockReturnValue !== undefined) {
        const valueToReturn = mockStorageService.get.specificMockReturnValue;
        return valueToReturn;
      }
      return defaultValue;
    });
    mockStorageService.set.mockResolvedValue(undefined);
  });

  afterEach(() => {
    delete mockStorageService.get.specificMockReturnValue;
  });

  test("debe renderizar el componente y cargar la configuración inicial (default 3)", async () => {
    render(<CalendarConfig />);

    await waitFor(() => {
      expect(mockStorageService.get).toHaveBeenCalledWith(
        STORAGE_KEYS.MAX_SIMULTANEOUS_EVENTS,
        3
      );
    });

    const slider = screen.getByLabelText(
      /Número máximo de eventos simultáneos \(1-10\):/i
    );
    await waitFor(() => expect(slider).toHaveValue("3"));
    expect(
      screen.getByText("3", { selector: ".max-events-value" })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockStorageService.set).toHaveBeenCalledWith(
        STORAGE_KEYS.MAX_SIMULTANEOUS_EVENTS,
        3
      );
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        "calendar.maxSimultaneousEventsChanged",
        { value: 3 }
      );
    });
  });

  test("debe cargar la configuración con un valor guardado diferente", async () => {
    mockStorageService.get.specificMockReturnValue = 5;
    render(<CalendarConfig />);

    await waitFor(() => {
      expect(mockStorageService.get).toHaveBeenCalledWith(
        STORAGE_KEYS.MAX_SIMULTANEOUS_EVENTS,
        3
      );
    });
    const slider = screen.getByLabelText(
      /Número máximo de eventos simultáneos \(1-10\):/i
    );
    await waitFor(() => expect(slider).toHaveValue("5"));
    expect(
      screen.getByText("5", { selector: ".max-events-value" })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockStorageService.set).toHaveBeenCalledWith(
        STORAGE_KEYS.MAX_SIMULTANEOUS_EVENTS,
        5
      );
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        "calendar.maxSimultaneousEventsChanged",
        { value: 5 }
      );
    });
  });

  test("debe usar el valor por defecto (3) si el valor guardado es 0 (debido a parseInt(0) || 3)", async () => {
    mockStorageService.get.specificMockReturnValue = 0; // Simula que se guardó 0
    render(<CalendarConfig />);

    await waitFor(() => {
      expect(mockStorageService.get).toHaveBeenCalledWith(
        STORAGE_KEYS.MAX_SIMULTANEOUS_EVENTS,
        3
      );
    });

    const slider = screen.getByLabelText(
      /Número máximo de eventos simultáneos \(1-10\):/i
    );
    // Debido a `parseInt(savedMaxEvents) || 3)`, si savedMaxEvents es 0, se usa 3.
    // Luego Math.max(1, 3) es 3. Math.min(10, 3) es 3.
    await waitFor(() => expect(slider).toHaveValue("3"));
    expect(
      screen.getByText("3", { selector: ".max-events-value" })
    ).toBeInTheDocument();

    // Verificar que se guardó y publicó el valor 3
    await waitFor(() => {
      expect(mockStorageService.set).toHaveBeenCalledWith(
        STORAGE_KEYS.MAX_SIMULTANEOUS_EVENTS,
        3
      );
    });
    await waitFor(() => {
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        "calendar.maxSimultaneousEventsChanged",
        { value: 3 }
      );
    });
  });

  test("debe validar y limitar el valor cargado si está fuera de rango (mayor que 10)", async () => {
    mockStorageService.get.specificMockReturnValue = 15;
    render(<CalendarConfig />);

    await waitFor(() => {
      expect(mockStorageService.get).toHaveBeenCalledWith(
        STORAGE_KEYS.MAX_SIMULTANEOUS_EVENTS,
        3
      );
    });
    const slider = screen.getByLabelText(
      /Número máximo de eventos simultáneos \(1-10\):/i
    );
    await waitFor(() => expect(slider).toHaveValue("10"));
    expect(
      screen.getByText("10", { selector: ".max-events-value" })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockStorageService.set).toHaveBeenCalledWith(
        STORAGE_KEYS.MAX_SIMULTANEOUS_EVENTS,
        10
      );
    });
    await waitFor(() => {
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        "calendar.maxSimultaneousEventsChanged",
        { value: 10 }
      );
    });
  });

  test("debe actualizar el valor de maxEvents al cambiar el slider y guardar/publicar", async () => {
    render(<CalendarConfig />);
    await waitFor(() =>
      expect(
        screen.getByLabelText(/Número máximo de eventos simultáneos \(1-10\):/i)
      ).toHaveValue("3")
    );
    await waitFor(() => {
      expect(mockStorageService.set).toHaveBeenCalledWith(
        STORAGE_KEYS.MAX_SIMULTANEOUS_EVENTS,
        3
      );
    });
    mockStorageService.set.mockClear();
    mockEventBus.publish.mockClear();

    const slider = screen.getByLabelText(
      /Número máximo de eventos simultáneos \(1-10\):/i
    );
    await act(async () => {
      fireEvent.change(slider, { target: { value: "7" } });
    });

    expect(slider).toHaveValue("7");
    expect(
      screen.getByText("7", { selector: ".max-events-value" })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockStorageService.set).toHaveBeenCalledWith(
        STORAGE_KEYS.MAX_SIMULTANEOUS_EVENTS,
        7
      );
    });
    await waitFor(() => {
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        "calendar.maxSimultaneousEventsChanged",
        { value: 7 }
      );
    });
  });

  test("debe ajustar el valor del slider a los límites min/max del input y actualizar el estado", async () => {
    render(<CalendarConfig />);
    await waitFor(() =>
      expect(
        screen.getByLabelText(/Número máximo de eventos simultáneos \(1-10\):/i)
      ).toHaveValue("3")
    );
    await waitFor(() => {
      expect(mockStorageService.set).toHaveBeenCalledWith(
        STORAGE_KEYS.MAX_SIMULTANEOUS_EVENTS,
        3
      );
    });
    mockStorageService.set.mockClear();
    mockEventBus.publish.mockClear();

    const slider = screen.getByLabelText(
      /Número máximo de eventos simultáneos \(1-10\):/i
    );

    await act(async () => {
      fireEvent.change(slider, { target: { value: "0" } });
    });
    expect(slider).toHaveValue("1");
    expect(
      screen.getByText("1", { selector: ".max-events-value" })
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(mockStorageService.set).toHaveBeenCalledWith(
        STORAGE_KEYS.MAX_SIMULTANEOUS_EVENTS,
        1
      );
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        "calendar.maxSimultaneousEventsChanged",
        { value: 1 }
      );
    });

    mockStorageService.set.mockClear();
    mockEventBus.publish.mockClear();
    await act(async () => {
      fireEvent.change(slider, { target: { value: "5" } });
    });
    await waitFor(() => expect(slider).toHaveValue("5"));
    expect(
      screen.getByText("5", { selector: ".max-events-value" })
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(mockStorageService.set).toHaveBeenCalledWith(
        STORAGE_KEYS.MAX_SIMULTANEOUS_EVENTS,
        5
      );
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        "calendar.maxSimultaneousEventsChanged",
        { value: 5 }
      );
    });

    mockStorageService.set.mockClear();
    mockEventBus.publish.mockClear();
    await act(async () => {
      fireEvent.change(slider, { target: { value: "11" } });
    });
    expect(slider).toHaveValue("10");
    expect(
      screen.getByText("10", { selector: ".max-events-value" })
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(mockStorageService.set).toHaveBeenCalledWith(
        STORAGE_KEYS.MAX_SIMULTANEOUS_EVENTS,
        10
      );
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        "calendar.maxSimultaneousEventsChanged",
        { value: 10 }
      );
    });
  });

  test("debe manejar errores al cargar la configuración", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mockStorageService.get.mockImplementationOnce(async () => {
      throw new Error("Failed to load");
    });

    render(<CalendarConfig />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error al cargar configuración del calendario:",
        expect.any(Error)
      );
    });

    const slider = screen.getByLabelText(
      /Número máximo de eventos simultáneos \(1-10\):/i
    );
    expect(slider).toHaveValue("3");
    expect(
      screen.getByText("3", { selector: ".max-events-value" })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockStorageService.set).toHaveBeenCalledWith(
        STORAGE_KEYS.MAX_SIMULTANEOUS_EVENTS,
        3
      );
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        "calendar.maxSimultaneousEventsChanged",
        { value: 3 }
      );
    });
    consoleErrorSpy.mockRestore();
  });
});
