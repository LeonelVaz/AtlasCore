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

// Mock del hook useTimeScale
const mockChangeTimeScale = jest.fn();
const mockCreateCustomTimeScale = jest.fn();
const mockUseTimeScale = jest.fn();

jest.mock("../../../../../src/hooks/use-time-scale", () => mockUseTimeScale);

// Importar el componente después de mockear el hook
const TimeScaleConfig =
  require("../../../../../src/components/settings/time-scale-config").default;

describe("TimeScaleConfig Component", () => {
  const defaultAvailableScales = [
    { id: "compact", name: "Compacta", height: 40 },
    { id: "standard", name: "Estándar", height: 60 },
    { id: "comfortable", name: "Confortable", height: 80 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTimeScale.mockReturnValue({
      currentTimeScale: { id: "standard", name: "Estándar", height: 60 },
      availableTimeScales: [...defaultAvailableScales],
      changeTimeScale: mockChangeTimeScale,
      createCustomTimeScale: mockCreateCustomTimeScale,
    });
  });

  test("debe renderizar el título y la descripción", () => {
    render(<TimeScaleConfig />);
    expect(screen.getByText("Escala de Tiempo")).toBeInTheDocument();
    expect(
      screen.getByText(/Configura la densidad visual de la rejilla temporal/i)
    ).toBeInTheDocument();
  });

  test("debe mostrar las escalas de tiempo disponibles", () => {
    render(<TimeScaleConfig />);
    expect(screen.getByText("Compacta")).toBeInTheDocument();
    expect(screen.getByText("Estándar")).toBeInTheDocument();
    expect(screen.getByText("Confortable")).toBeInTheDocument();
    expect(screen.getByText("Personalizada")).toBeInTheDocument();
  });

  test("debe resaltar la escala de tiempo actual", () => {
    render(<TimeScaleConfig />);
    const standardOption = screen
      .getByText("Estándar")
      .closest(".time-scale-option");
    expect(standardOption).toHaveClass("selected");
  });

  test("debe llamar a changeTimeScale al hacer clic en una opción de escala predefinida", () => {
    render(<TimeScaleConfig />);
    const compactOption = screen
      .getByText("Compacta")
      .closest(".time-scale-option");
    fireEvent.click(compactOption);
    expect(mockChangeTimeScale).toHaveBeenCalledWith("compact");
  });

  test('debe mostrar el input para altura personalizada al hacer clic en "Personalizada"', () => {
    render(<TimeScaleConfig />);
    const customOption = screen
      .getByText("Personalizada")
      .closest(".time-scale-option");
    fireEvent.click(customOption);

    expect(
      screen.getByLabelText("Altura (en píxeles por hora):")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aplicar" })).toBeInTheDocument();
  });

  test("debe actualizar el valor de altura personalizada y validarlo", () => {
    render(<TimeScaleConfig />);
    fireEvent.click(
      screen.getByText("Personalizada").closest(".time-scale-option")
    );

    const heightInput = screen.getByLabelText("Altura (en píxeles por hora):");
    fireEvent.change(heightInput, { target: { value: "10" } }); // Menor que el min (20)
    expect(heightInput).toHaveValue(20);

    fireEvent.change(heightInput, { target: { value: "250" } }); // Mayor que el max (200)
    expect(heightInput).toHaveValue(200);

    fireEvent.change(heightInput, { target: { value: "100" } });
    expect(heightInput).toHaveValue(100);
  });

  test("debe llamar a createCustomTimeScale al enviar el formulario de altura personalizada", () => {
    render(<TimeScaleConfig />);
    fireEvent.click(
      screen.getByText("Personalizada").closest(".time-scale-option")
    );

    const heightInput = screen.getByLabelText("Altura (en píxeles por hora):");
    fireEvent.change(heightInput, { target: { value: "90" } });

    const applyButton = screen.getByRole("button", { name: "Aplicar" });
    fireEvent.click(applyButton); // Simula submit del form

    expect(mockCreateCustomTimeScale).toHaveBeenCalledWith(90);
    expect(
      screen.queryByLabelText("Altura (en píxeles por hora):")
    ).not.toBeInTheDocument(); // Formulario se oculta
  });

  test("debe ocultar el input personalizado al hacer clic en Cancelar", () => {
    render(<TimeScaleConfig />);
    fireEvent.click(
      screen.getByText("Personalizada").closest(".time-scale-option")
    );
    expect(
      screen.getByLabelText("Altura (en píxeles por hora):")
    ).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: "Cancelar" });
    fireEvent.click(cancelButton);
    expect(
      screen.queryByLabelText("Altura (en píxeles por hora):")
    ).not.toBeInTheDocument();
  });

  test("debe ocultar el input personalizado si se selecciona otra escala predefinida", () => {
    render(<TimeScaleConfig />);
    fireEvent.click(
      screen.getByText("Personalizada").closest(".time-scale-option")
    );
    expect(
      screen.getByLabelText("Altura (en píxeles por hora):")
    ).toBeInTheDocument();

    const compactOption = screen
      .getByText("Compacta")
      .closest(".time-scale-option");
    fireEvent.click(compactOption);
    expect(mockChangeTimeScale).toHaveBeenCalledWith("compact");
    expect(
      screen.queryByLabelText("Altura (en píxeles por hora):")
    ).not.toBeInTheDocument();
  });
});
