import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import SnapControl from "../../../../../src/components/calendar/snap-control";
import { SNAP_VALUES } from "../../../../../src/core/config/constants";

describe("SnapControl Component", () => {
  const mockOnSnapChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers(); // For useEffects related to menu closing / resizing
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test("renders toggle button and value indicator", () => {
    render(
      <SnapControl
        snapValue={SNAP_VALUES.NONE}
        onSnapChange={mockOnSnapChange}
      />
    );
    expect(screen.getByTitle("Activar/Desactivar imán")).toBeInTheDocument();
    expect(
      screen.getByTitle("Configurar precisión de imán")
    ).toBeInTheDocument();
    expect(screen.getByText("Off")).toBeInTheDocument(); // Label for NONE
  });

  test("toggle button activates/deactivates snap", () => {
    const { rerender } = render(
      <SnapControl
        snapValue={SNAP_VALUES.NONE}
        onSnapChange={mockOnSnapChange}
      />
    );
    const toggleButton = screen.getByTitle("Activar/Desactivar imán");

    fireEvent.click(toggleButton);
    expect(mockOnSnapChange).toHaveBeenCalledWith(SNAP_VALUES.PRECISE); // NONE -> PRECISE

    rerender(
      <SnapControl
        snapValue={SNAP_VALUES.PRECISE}
        onSnapChange={mockOnSnapChange}
      />
    );
    fireEvent.click(toggleButton);
    expect(mockOnSnapChange).toHaveBeenCalledWith(SNAP_VALUES.NONE); // PRECISE -> NONE
  });

  test("value indicator shows correct label for different snap values", () => {
    const { rerender } = render(
      <SnapControl
        snapValue={SNAP_VALUES.NONE}
        onSnapChange={mockOnSnapChange}
      />
    );
    expect(screen.getByText("Off")).toBeInTheDocument();

    rerender(
      <SnapControl
        snapValue={SNAP_VALUES.BASIC}
        onSnapChange={mockOnSnapChange}
      />
    );
    expect(screen.getByText("1h")).toBeInTheDocument();

    rerender(
      <SnapControl
        snapValue={SNAP_VALUES.MEDIUM}
        onSnapChange={mockOnSnapChange}
      />
    );
    expect(screen.getByText("30m")).toBeInTheDocument();

    rerender(
      <SnapControl
        snapValue={SNAP_VALUES.PRECISE}
        onSnapChange={mockOnSnapChange}
      />
    );
    expect(screen.getByText("15m")).toBeInTheDocument();

    rerender(<SnapControl snapValue={10} onSnapChange={mockOnSnapChange} />); // Custom value
    expect(screen.getByText("10m")).toBeInTheDocument();
  });

  test("clicking value indicator opens and closes the menu", () => {
    render(
      <SnapControl
        snapValue={SNAP_VALUES.NONE}
        onSnapChange={mockOnSnapChange}
      />
    );
    const valueIndicator = screen.getByTitle("Configurar precisión de imán");

    expect(screen.queryByTestId("snap-menu")).not.toBeInTheDocument();
    fireEvent.click(valueIndicator);
    expect(screen.getByTestId("snap-menu")).toBeInTheDocument();

    fireEvent.click(valueIndicator); // Click again to close
    expect(screen.queryByTestId("snap-menu")).not.toBeInTheDocument();
  });

  test("menu contains correct snap options and custom section", () => {
    render(
      <SnapControl
        snapValue={SNAP_VALUES.NONE}
        onSnapChange={mockOnSnapChange}
      />
    );
    fireEvent.click(screen.getByTitle("Configurar precisión de imán"));

    const menu = screen.getByTestId("snap-menu");
    expect(menu).toBeInTheDocument();
    expect(screen.getByText("Desactivado")).toBeInTheDocument();
    expect(screen.getByText("Básico (1h)")).toBeInTheDocument();
    expect(screen.getByText("Medio (30m)")).toBeInTheDocument();
    expect(screen.getByText("Preciso (15m)")).toBeInTheDocument();
    expect(screen.getByText("Personalizado")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton")).toBeInTheDocument(); // Custom input
    expect(screen.getByText("minutos")).toBeInTheDocument();
    expect(screen.getByText("Aplicar")).toBeInTheDocument();
  });

  test("selecting a predefined option calls onSnapChange and closes menu", () => {
    render(
      <SnapControl
        snapValue={SNAP_VALUES.NONE}
        onSnapChange={mockOnSnapChange}
      />
    );
    fireEvent.click(screen.getByTitle("Configurar precisión de imán"));

    fireEvent.click(screen.getByText("Medio (30m)"));
    expect(mockOnSnapChange).toHaveBeenCalledWith(SNAP_VALUES.MEDIUM);
    expect(screen.queryByTestId("snap-menu")).not.toBeInTheDocument();
  });

  test("custom value input works and apply button calls onSnapChange", () => {
    render(
      <SnapControl
        snapValue={SNAP_VALUES.NONE}
        onSnapChange={mockOnSnapChange}
      />
    );
    fireEvent.click(screen.getByTitle("Configurar precisión de imán"));

    const customInput = screen.getByRole("spinbutton");
    fireEvent.change(customInput, { target: { value: "25" } });
    expect(customInput).toHaveValue(25);

    fireEvent.click(screen.getByText("Aplicar"));
    expect(mockOnSnapChange).toHaveBeenCalledWith(25);
    expect(screen.queryByTestId("snap-menu")).not.toBeInTheDocument();
  });

  test("custom value input clamps values between 1 and 60", () => {
    render(
      <SnapControl
        snapValue={SNAP_VALUES.NONE}
        onSnapChange={mockOnSnapChange}
      />
    );
    fireEvent.click(screen.getByTitle("Configurar precisión de imán"));

    const customInput = screen.getByRole("spinbutton");
    fireEvent.change(customInput, { target: { value: "0" } });
    expect(customInput).toHaveValue(1); // Clamped to 1

    fireEvent.change(customInput, { target: { value: "100" } });
    expect(customInput).toHaveValue(60); // Clamped to 60
  });

  test("clicking outside the menu closes it", () => {
    render(
      <div>
        <SnapControl
          snapValue={SNAP_VALUES.NONE}
          onSnapChange={mockOnSnapChange}
        />
        <button>Outside Button</button>
      </div>
    );
    fireEvent.click(screen.getByTitle("Configurar precisión de imán")); // Open menu
    expect(screen.getByTestId("snap-menu")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByText("Outside Button")); // Click outside
    act(() => {
      jest.runAllTimers(); // Ensure any timers in useEffect for closing are run
    });
    expect(screen.queryByTestId("snap-menu")).not.toBeInTheDocument();
  });

  test('selected option has "selected" class', () => {
    render(
      <SnapControl
        snapValue={SNAP_VALUES.MEDIUM}
        onSnapChange={mockOnSnapChange}
      />
    );
    fireEvent.click(screen.getByTitle("Configurar precisión de imán"));

    const mediumOption = screen.getByText("Medio (30m)");
    expect(mediumOption).toHaveClass("selected");

    const preciseOption = screen.getByText("Preciso (15m)");
    expect(preciseOption).not.toHaveClass("selected");
  });
});
