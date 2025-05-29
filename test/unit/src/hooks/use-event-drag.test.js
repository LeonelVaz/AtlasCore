// test/unit/src/hooks/use-event-drag.test.jsx

/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
// Mocks ANTES de la importación del hook
jest.mock("../../../../src/utils/event-utils", () => ({
  initializeGridInfo: jest.fn(),
  findTargetSlot: jest.fn(),
  calculatePreciseTimeChange: jest.fn(),
}));

// Importar el hook DESPUÉS de los mocks
import { useEventDrag } from "../../../../src/hooks/use-event-drag";
// Importar mocks para aserciones (DESPUÉS de jest.mock)
const eventUtils = require("../../../../src/utils/event-utils");

describe("useEventDrag Hook", () => {
  let mockEventRef;
  let mockEvent;
  let mockOnUpdate;
  let mockSetBlockClicks;

  const mockGridData = {
    containerElement: document.createElement("div"),
    gridRect: { top: 0, left: 0, width: 700, height: 1200 },
    hourHeight: 60,
    dayWidth: 100,
    inWeekView: true,
  };

  const initialEventTimestamp = new Date(2023, 0, 15, 10, 0, 0, 0).getTime();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockEventRef = {
      current: {
        classList: { add: jest.fn(), remove: jest.fn() },
        style: { transform: "", opacity: "" },
        offsetHeight: 120,
        dataset: {},
      },
    };
    mockEvent = {
      id: "event1",
      title: "Draggable Event",
      start: new Date(initialEventTimestamp).toISOString(),
      end: new Date(initialEventTimestamp + 2 * 60 * 60 * 1000).toISOString(),
    };
    mockOnUpdate = jest.fn();
    mockSetBlockClicks = jest.fn();

    eventUtils.initializeGridInfo.mockReturnValue(mockGridData);
    eventUtils.findTargetSlot.mockReturnValue(null);
    eventUtils.calculatePreciseTimeChange.mockImplementation(
      (deltaY, isResize, gridSize, snapValue) => {
        const pixelsPerMinute = gridSize / 60;
        const minutesMoved = deltaY / pixelsPerMinute;
        if (snapValue > 0) {
          return Math.round(minutesMoved / snapValue) * snapValue;
        }
        return Math.round(minutesMoved);
      }
    );

    global.document.addEventListener = jest.fn();
    global.document.removeEventListener = jest.fn();
    global.document.body.classList.add = jest.fn();
    global.document.body.classList.remove = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ... (otros tests que ya pasaban) ...
  test("debe inicializar el estado y limpiar listeners al desmontar", () => {
    const { unmount } = renderHook(() =>
      useEventDrag({
        eventRef: mockEventRef,
        event: mockEvent,
        onUpdate: mockOnUpdate,
        setBlockClicks: mockSetBlockClicks,
      })
    );

    act(() => {
      unmount();
    });
    expect(document.removeEventListener).toHaveBeenCalledWith(
      "mousemove",
      expect.any(Function)
    );
    expect(document.removeEventListener).toHaveBeenCalledWith(
      "mouseup",
      expect.any(Function)
    );
    expect(document.body.classList.remove).toHaveBeenCalledWith(
      "dragging-active",
      "snap-active"
    );
  });

  test("handleDragStart debe iniciar el arrastre y añadir listeners", () => {
    const { result } = renderHook(() =>
      useEventDrag({
        eventRef: mockEventRef,
        event: mockEvent,
        onUpdate: mockOnUpdate,
        setBlockClicks: mockSetBlockClicks,
      })
    );

    const mockMouseDownEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      clientX: 100,
      clientY: 200,
      target: { classList: { contains: jest.fn().mockReturnValue(false) } },
    };

    act(() => {
      result.current.handleDragStart(mockMouseDownEvent);
    });

    expect(eventUtils.initializeGridInfo).toHaveBeenCalledWith(
      mockEventRef,
      60,
      mockEvent
    );
    expect(document.addEventListener).toHaveBeenCalledWith(
      "mousemove",
      expect.any(Function)
    );
    expect(document.addEventListener).toHaveBeenCalledWith(
      "mouseup",
      expect.any(Function)
    );
  });

  describe("Simulación de Arrastre", () => {
    let handleMouseMoveFn, handleMouseUpFn;

    beforeEach(() => {
      document.addEventListener.mockImplementation((event, callback) => {
        if (event === "mousemove") handleMouseMoveFn = callback;
        if (event === "mouseup") handleMouseUpFn = callback;
      });
    });

    test("handleMouseMove debe actualizar el estilo y estado si se mueve significativamente", () => {
      const { result } = renderHook(() =>
        useEventDrag({
          eventRef: mockEventRef,
          event: mockEvent,
          onUpdate: mockOnUpdate,
          setBlockClicks: mockSetBlockClicks,
          gridSize: 60,
        })
      );

      const startX = 100,
        startY = 200;
      act(() => {
        result.current.handleDragStart({
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
          clientX: startX,
          clientY: startY,
          target: { classList: { contains: () => false } },
        });
      });

      act(() => {
        handleMouseMoveFn({ clientX: startX + 20, clientY: startY + 70 });
      });

      expect(result.current.dragging).toBe(true);
      expect(mockEventRef.current.style.transform).toBe(
        "translate(20px, 70px)"
      );
      expect(mockEventRef.current.classList.add).toHaveBeenCalledWith(
        "dragging"
      );
      expect(mockSetBlockClicks).toHaveBeenCalledWith(true);
      expect(eventUtils.findTargetSlot).toHaveBeenCalled();
    });

    test("handleMouseUp debe llamar a onUpdate con las nuevas fechas si el arrastre fue significativo (sin snap, acoplando a hora completa)", () => {
      const gridSize = 60;
      const { result } = renderHook(() =>
        useEventDrag({
          eventRef: mockEventRef,
          event: mockEvent,
          onUpdate: mockOnUpdate,
          setBlockClicks: mockSetBlockClicks,
          gridSize,
          snapValue: 0,
          customSlots: {}, // SIN custom slots, por lo que se acoplará a la hora en punto.
        })
      );

      const startX = 100,
        startY = 200;
      act(() => {
        result.current.handleDragStart({
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
          clientX: startX,
          clientY: startY,
          target: { classList: { contains: () => false } },
        });
      });

      const deltaY = 90; // Mover 90px Y (1.5 horas según píxeles)

      act(() => {
        handleMouseMoveFn({ clientX: startX, clientY: startY + deltaY });
      });
      act(() => {
        handleMouseUpFn({
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
        });
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.dragging).toBe(false);
      expect(mockOnUpdate).toHaveBeenCalledTimes(1);

      // El hook, con customSlots={}, ajustará los minutos a 00.
      // El desplazamiento de 1.5 horas (90 minutos) se interpreta como:
      // newHour = 10 (original) + Math.floor(1.5) = 11
      // newMinutes = 0 (original) + Math.round((1.5 - 1)*60) = 30
      // closestMinute (con validPositions=[0]) se vuelve 0.
      // Entonces, la nueva hora de inicio es 11:00.
      const expectedNewStartDate = new Date(initialEventTimestamp);
      expectedNewStartDate.setHours(11, 0, 0, 0); // 11:00 AM LOCAL (cambio de 1 hora, no 1.5)
      const expectedNewEndDate = new Date(
        expectedNewStartDate.getTime() + 2 * 60 * 60 * 1000
      ); // Mantener duración de 2h

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          start: expectedNewStartDate.toISOString(), // ej. 2023-01-15T15:00:00.000Z si UTC-4
          end: expectedNewEndDate.toISOString(), // ej. 2023-01-15T17:00:00.000Z si UTC-4
        })
      );
      expect(mockSetBlockClicks).toHaveBeenLastCalledWith(false);
    });

    test("handleMouseUp con snapValue debe llamar a onUpdate con fechas ajustadas por calculatePreciseTimeChange", () => {
      const snapValue = 15;
      const gridSize = 60;
      const { result } = renderHook(() =>
        useEventDrag({
          eventRef: mockEventRef,
          event: mockEvent,
          onUpdate: mockOnUpdate,
          setBlockClicks: mockSetBlockClicks,
          gridSize,
          snapValue,
        })
      );

      const startX = 100,
        startY = 200;
      act(() => {
        result.current.handleDragStart({
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
          clientX: startX,
          clientY: startY,
          target: { classList: { contains: () => false } },
        });
      });

      const deltaY = 20;
      eventUtils.calculatePreciseTimeChange.mockReturnValueOnce(15);

      act(() => {
        handleMouseMoveFn({ clientX: startX, clientY: startY + deltaY });
      });
      act(() => {
        handleMouseUpFn({
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
        });
      });
      act(() => {
        jest.runAllTimers();
      });

      expect(eventUtils.calculatePreciseTimeChange).toHaveBeenCalledWith(
        deltaY,
        false,
        gridSize,
        snapValue
      );

      const expectedNewStartDate = new Date(initialEventTimestamp);
      expectedNewStartDate.setMinutes(expectedNewStartDate.getMinutes() + 15);
      const expectedNewEndDate = new Date(
        expectedNewStartDate.getTime() + 2 * 60 * 60 * 1000
      );

      expect(mockOnUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          start: expectedNewStartDate.toISOString(),
          end: expectedNewEndDate.toISOString(),
        })
      );
    });

    test("handleMouseUp no debe llamar a onUpdate si el arrastre no fue significativo", () => {
      const { result } = renderHook(() =>
        useEventDrag({
          eventRef: mockEventRef,
          event: mockEvent,
          onUpdate: mockOnUpdate,
          setBlockClicks: mockSetBlockClicks,
        })
      );

      const startX = 100,
        startY = 200;
      act(() => {
        result.current.handleDragStart({
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
          clientX: startX,
          clientY: startY,
          target: { classList: { contains: () => false } },
        });
      });
      act(() => {
        handleMouseMoveFn({ clientX: startX + 2, clientY: startY + 2 });
      });
      act(() => {
        handleMouseUpFn({
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
        });
      });

      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    test("handleMouseUp no debe llamar a onUpdate si excede el límite de eventos", () => {
      const { result } = renderHook(() =>
        useEventDrag({
          eventRef: mockEventRef,
          event: mockEvent,
          onUpdate: mockOnUpdate,
          setBlockClicks: mockSetBlockClicks,
          maxSimultaneousEvents: 1,
        })
      );

      const startX = 100,
        startY = 200;
      const mockTargetSlotExceed = {
        classList: {
          contains: jest.fn(
            (cn) => cn === "calendar-time-slot" || cn === "day-view-hour-slot"
          ),
          add: jest.fn(),
          remove: jest.fn(),
        },
        getAttribute: jest.fn(() => "1"),
      };
      eventUtils.findTargetSlot.mockReturnValue(mockTargetSlotExceed);

      act(() => {
        result.current.handleDragStart({
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
          clientX: startX,
          clientY: startY,
          target: { classList: { contains: () => false } },
        });
      });
      act(() => {
        handleMouseMoveFn({ clientX: startX + 20, clientY: startY + 70 });
      });
      act(() => {
        handleMouseUpFn({
          preventDefault: jest.fn(),
          stopPropagation: jest.fn(),
        });
      });

      expect(mockEventRef.current.classList.add).toHaveBeenCalledWith(
        "cannot-place"
      );
      expect(mockOnUpdate).not.toHaveBeenCalled();
      expect(mockSetBlockClicks).toHaveBeenCalledWith(true);
      act(() => {
        jest.runAllTimers();
      });
      expect(mockSetBlockClicks).toHaveBeenLastCalledWith(false);
    });
  });
});
