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
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock del hook useTimeGrid
const mockAddCustomTimeSlot = jest.fn();
const mockRemoveCustomTimeSlot = jest.fn();
const mockUseTimeGrid = jest.fn(); // Este es el mock principal del hook

jest.mock("../../../../../src/hooks/use-time-grid", () => mockUseTimeGrid);

// Importar el componente después de mockear el hook
const TimeSlotEditor =
  require("../../../../../src/components/settings/time-slot-editor").default;

describe("TimeSlotEditor Component", () => {
  const initialCustomSlots = {
    10: [{ hour: 10, minutes: 30, type: "medium" }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Configuración por defecto para mockUseTimeGrid en cada test
    mockUseTimeGrid.mockReturnValue({
      customSlots: { ...initialCustomSlots },
      addCustomTimeSlot: mockAddCustomTimeSlot, // Asignar el mock a la propiedad
      removeCustomTimeSlot: mockRemoveCustomTimeSlot, // Asignar el mock a la propiedad
      isLoading: false,
    });
  });

  test("debe renderizar el título y la descripción", () => {
    render(<TimeSlotEditor />);
    expect(
      screen.getByText("Franjas Horarias Personalizadas")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Las franjas horarias personalizadas te permiten dividir/i
      )
    ).toBeInTheDocument();
  });

  test('debe mostrar "Cargando..." si isLoading es true', () => {
    // Sobrescribir el mock para este test específico
    mockUseTimeGrid.mockReturnValueOnce({
      customSlots: {},
      addCustomTimeSlot: mockAddCustomTimeSlot, // CORREGIDO: Asignar el mock
      removeCustomTimeSlot: mockRemoveCustomTimeSlot, // CORREGIDO: Asignar el mock
      isLoading: true,
    });
    render(<TimeSlotEditor />);
    expect(
      screen.getByText("Cargando franjas horarias...")
    ).toBeInTheDocument();
  });

  test("debe mostrar las franjas horarias existentes", () => {
    render(<TimeSlotEditor />);
    expect(screen.getByText("10:30")).toBeInTheDocument();
    const slot1030 = screen.getByText("10:30").closest(".custom-time-slot");
    expect(within(slot1030).getByTitle("Eliminar franja")).toBeInTheDocument();
  });

  test("debe mostrar mensaje si no hay franjas personalizadas", () => {
    mockUseTimeGrid.mockReturnValueOnce({
      customSlots: {},
      addCustomTimeSlot: mockAddCustomTimeSlot,
      removeCustomTimeSlot: mockRemoveCustomTimeSlot,
      isLoading: false,
    });
    render(<TimeSlotEditor />);
    // CORRECCIÓN AQUÍ: Usar una expresión regular para buscar el texto
    expect(
      screen.getByText(
        /No hay franjas horarias personalizadas\. Añade tu primera franja para comenzar\./i
      )
    ).toBeInTheDocument();
    // O, si solo quieres asegurarte de que la primera parte del mensaje esté:
    // expect(screen.getByText(/No hay franjas horarias personalizadas\./i)).toBeInTheDocument();
  });

  test('debe mostrar el formulario al hacer clic en "Agregar Franja Horaria"', () => {
    render(<TimeSlotEditor />);
    const addButton = screen.getByText("Agregar Franja Horaria");
    fireEvent.click(addButton);

    expect(screen.getByLabelText("Hora")).toBeInTheDocument();
    expect(screen.getByLabelText("Minutos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
  });

  test("debe llamar a addCustomTimeSlot al enviar el formulario", () => {
    mockAddCustomTimeSlot.mockReturnValue(true);
    render(<TimeSlotEditor />);
    fireEvent.click(screen.getByText("Agregar Franja Horaria"));

    const hourSelect = screen.getByLabelText("Hora");
    const minuteSelect = screen.getByLabelText("Minutos");
    const saveButton = screen.getByRole("button", { name: "Guardar" });

    fireEvent.change(hourSelect, { target: { value: "14" } });
    fireEvent.change(minuteSelect, { target: { value: "15" } });
    fireEvent.click(saveButton);

    expect(mockAddCustomTimeSlot).toHaveBeenCalledWith(14, 15);
    expect(screen.queryByLabelText("Hora")).not.toBeInTheDocument();
  });

  test("no debe ocultar el formulario si addCustomTimeSlot devuelve false", () => {
    mockAddCustomTimeSlot.mockReturnValue(false);
    render(<TimeSlotEditor />);
    fireEvent.click(screen.getByText("Agregar Franja Horaria"));

    const saveButton = screen.getByRole("button", { name: "Guardar" });
    fireEvent.click(saveButton);

    expect(mockAddCustomTimeSlot).toHaveBeenCalled();
    expect(screen.getByLabelText("Hora")).toBeInTheDocument();
  });

  test("debe ocultar el formulario al hacer clic en Cancelar", () => {
    render(<TimeSlotEditor />);
    fireEvent.click(screen.getByText("Agregar Franja Horaria"));
    expect(screen.getByLabelText("Hora")).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: "Cancelar" });
    fireEvent.click(cancelButton);
    expect(screen.queryByLabelText("Hora")).not.toBeInTheDocument();
  });

  test("debe llamar a removeCustomTimeSlot al hacer clic en el botón de eliminar", () => {
    render(<TimeSlotEditor />);
    const slot1030 = screen.getByText("10:30").closest(".custom-time-slot");
    const deleteButton = within(slot1030).getByTitle("Eliminar franja");
    fireEvent.click(deleteButton);

    expect(mockRemoveCustomTimeSlot).toHaveBeenCalledWith(10, 30);
  });
});
