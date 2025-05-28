/**
 * @jest-environment jsdom
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  TimeScaleProvider,
  TimeScaleContext,
} from "../../../../src/contexts/time-scale-context";
import { TIME_SCALES } from "../../../../src/core/config/constants";

// Mock del timeScaleService
jest.mock("../../../../src/services/time-scale-service", () => ({
  initialize: jest.fn(),
  getAvailableTimeScales: jest.fn(),
  setTimeScale: jest.fn(),
  getCurrentTimeScale: jest.fn(),
  createCustomTimeScale: jest.fn(),
}));

// Mock del eventBus
jest.mock("../../../../src/core/bus/event-bus", () => ({
  subscribe: jest.fn(),
  publish: jest.fn(),
}));

const timeScaleService = require("../../../../src/services/time-scale-service");
const eventBus = require("../../../../src/core/bus/event-bus");

let eventBusSubscribeCallback;

const TestConsumer = () => {
  const context = React.useContext(TimeScaleContext);
  if (!context) return <p>Context not found</p>;
  return (
    <div>
      <p>Current Scale ID: {context.currentTimeScale.id}</p>
      <p>Loading: {context.loading.toString()}</p>
      <p>
        Available Scales:{" "}
        {context.availableTimeScales.map((s) => s.name).join(", ")}
      </p>
      <button
        onClick={async () =>
          await context.changeTimeScale(TIME_SCALES.COMPACT.id)
        }
      >
        Change to Compact
      </button>
      <button onClick={async () => await context.createCustomTimeScale(90)}>
        Create Custom 90px
      </button>
    </div>
  );
};

describe("TimeScaleProvider and TimeScaleContext", () => {
  const mockAvailableScalesData = [TIME_SCALES.STANDARD, TIME_SCALES.COMPACT];

  beforeEach(() => {
    jest.clearAllMocks();
    eventBusSubscribeCallback = null;

    timeScaleService.initialize.mockResolvedValue(TIME_SCALES.STANDARD);
    timeScaleService.getAvailableTimeScales.mockReturnValue(
      mockAvailableScalesData
    );
    timeScaleService.getCurrentTimeScale.mockResolvedValue(
      TIME_SCALES.STANDARD
    ); // Default para la primera carga del evento
    timeScaleService.setTimeScale.mockResolvedValue(true);
    timeScaleService.createCustomTimeScale.mockResolvedValue(true);

    eventBus.subscribe.mockImplementation((eventName, callback) => {
      if (eventName === "app.timeScaleChanged") {
        eventBusSubscribeCallback = callback;
      }
      return jest.fn();
    });
  });

  const simulateTimeScaleChangedEvent = () => {
    if (eventBusSubscribeCallback) {
      act(() => {
        eventBusSubscribeCallback();
      });
    }
  };

  test("debe inicializar y proveer la escala actual, escalas disponibles y estado de carga", async () => {
    render(
      <TimeScaleProvider>
        <TestConsumer />
      </TimeScaleProvider>
    );

    expect(screen.getByText("Loading: true")).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText("Loading: false")).toBeInTheDocument()
    );

    expect(timeScaleService.initialize).toHaveBeenCalledTimes(1);
    expect(timeScaleService.getAvailableTimeScales).toHaveBeenCalledTimes(1);
    expect(eventBus.subscribe).toHaveBeenCalledWith(
      "app.timeScaleChanged",
      expect.any(Function)
    );
    // getCurrentTimeScale NO se llama durante la inicialización
    expect(timeScaleService.getCurrentTimeScale).not.toHaveBeenCalled();

    expect(
      screen.getByText(`Current Scale ID: ${TIME_SCALES.STANDARD.id}`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `Available Scales: ${mockAvailableScalesData
          .map((s) => s.name)
          .join(", ")}`
      )
    ).toBeInTheDocument();
  });

  test("debe manejar errores durante la inicialización", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    timeScaleService.initialize.mockRejectedValueOnce(new Error("Init failed"));

    render(
      <TimeScaleProvider>
        <TestConsumer />
      </TimeScaleProvider>
    );

    await waitFor(() =>
      expect(screen.getByText("Loading: false")).toBeInTheDocument()
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error al inicializar la escala de tiempo:",
      expect.any(Error)
    );
    expect(
      screen.getByText(`Current Scale ID: ${TIME_SCALES.STANDARD.id}`)
    ).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  test("changeTimeScale debe llamar al servicio y actualizar la escala actual si tiene éxito", async () => {
    // Simular el estado después de la inicialización
    timeScaleService.initialize.mockResolvedValue(TIME_SCALES.STANDARD);
    timeScaleService.getCurrentTimeScale.mockResolvedValue(TIME_SCALES.COMPACT); // Lo que devolverá DESPUÉS de setTimeScale

    render(
      <TimeScaleProvider>
        <TestConsumer />
      </TimeScaleProvider>
    );
    await waitFor(() =>
      expect(screen.getByText("Loading: false")).toBeInTheDocument()
    );
    // Limpiar llamadas de la inicialización para enfocarnos en esta acción
    timeScaleService.getCurrentTimeScale.mockClear();

    const changeButton = screen.getByRole("button", {
      name: "Change to Compact",
    });
    await act(async () => {
      fireEvent.click(changeButton);
    });

    expect(timeScaleService.setTimeScale).toHaveBeenCalledWith(
      TIME_SCALES.COMPACT.id
    );
    // getCurrentTimeScale se llama UNA VEZ dentro de changeTimeScale
    expect(timeScaleService.getCurrentTimeScale).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(
        screen.getByText(`Current Scale ID: ${TIME_SCALES.COMPACT.id}`)
      ).toBeInTheDocument()
    );
  });

  test("createCustomTimeScale debe llamar al servicio y actualizar la escala actual si tiene éxito", async () => {
    const customScale = {
      id: "custom",
      name: "Personalizada 90px",
      height: 90,
      pixelsPerMinute: 90 / 60,
    };
    // Simular el estado después de la inicialización
    timeScaleService.initialize.mockResolvedValue(TIME_SCALES.STANDARD);
    timeScaleService.getCurrentTimeScale.mockResolvedValue(customScale); // Lo que devolverá DESPUÉS de createCustomTimeScale

    render(
      <TimeScaleProvider>
        <TestConsumer />
      </TimeScaleProvider>
    );
    await waitFor(() =>
      expect(screen.getByText("Loading: false")).toBeInTheDocument()
    );
    timeScaleService.getCurrentTimeScale.mockClear();

    const createButton = screen.getByRole("button", {
      name: "Create Custom 90px",
    });
    await act(async () => {
      fireEvent.click(createButton);
    });

    expect(timeScaleService.createCustomTimeScale).toHaveBeenCalledWith(90);
    // getCurrentTimeScale se llama UNA VEZ dentro de createCustomTimeScale
    expect(timeScaleService.getCurrentTimeScale).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(
        screen.getByText(`Current Scale ID: ${customScale.id}`)
      ).toBeInTheDocument()
    );
  });

  test('debe actualizar la escala si el evento "app.timeScaleChanged" del eventBus se dispara', async () => {
    render(
      <TimeScaleProvider>
        <TestConsumer />
      </TimeScaleProvider>
    );
    await waitFor(() =>
      expect(screen.getByText("Loading: false")).toBeInTheDocument()
    );
    expect(
      screen.getByText(`Current Scale ID: ${TIME_SCALES.STANDARD.id}`)
    ).toBeInTheDocument();
    timeScaleService.getCurrentTimeScale.mockClear();

    timeScaleService.getCurrentTimeScale.mockResolvedValueOnce(
      TIME_SCALES.COMPACT
    );

    simulateTimeScaleChangedEvent();

    await waitFor(() =>
      expect(
        screen.getByText(`Current Scale ID: ${TIME_SCALES.COMPACT.id}`)
      ).toBeInTheDocument()
    );
    // getCurrentTimeScale se llama UNA VEZ dentro del handler del evento
    expect(timeScaleService.getCurrentTimeScale).toHaveBeenCalledTimes(1);
  });
});
