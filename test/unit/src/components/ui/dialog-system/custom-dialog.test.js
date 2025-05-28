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
import CustomDialog from "../../../../../../src/components/ui/dialog-system/custom-dialog"; // Ajusta la ruta

describe("CustomDialog Component", () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnClose = jest.fn();

  const baseProps = {
    title: "Test Dialog",
    message: "This is a test message.",
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
    onClose: mockOnClose, // onClose es para alert, onCancel para confirm/prompt
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Restaurar el overflow del body si se modificó
    document.body.style.overflow = "";
  });

  test("no debe renderizar nada si isOpen es false", () => {
    render(<CustomDialog {...baseProps} isOpen={false} type="alert" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  describe("Tipo Alert", () => {
    test("debe renderizar diálogo de alerta con título, mensaje y botón de confirmación", () => {
      render(
        <CustomDialog
          {...baseProps}
          isOpen={true}
          type="alert"
          confirmText="OK"
        />
      );
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByText("Test Dialog")).toBeInTheDocument(); // Título
      expect(screen.getByText("This is a test message.")).toBeInTheDocument(); // Mensaje
      expect(screen.getByRole("button", { name: "OK" })).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Cancelar" })
      ).not.toBeInTheDocument();
    });

    test("debe llamar a onConfirm (que es onClose para alert) al hacer clic en confirmar", () => {
      render(
        <CustomDialog
          {...baseProps}
          isOpen={true}
          type="alert"
          confirmText="OK"
        />
      );
      fireEvent.click(screen.getByRole("button", { name: "OK" }));
      expect(mockOnConfirm).toHaveBeenCalledWith(true); // El handler handleConfirm llama a onConfirm(true)
    });

    test("debe llamar a onConfirm (onClose) al presionar Enter", () => {
      render(<CustomDialog {...baseProps} isOpen={true} type="alert" />);
      fireEvent.keyDown(document, { key: "Enter", code: "Enter" });
      expect(mockOnConfirm).toHaveBeenCalledWith(true);
    });

    test("debe llamar a handleCancel (que llama a onClose) al presionar Escape", () => {
      render(<CustomDialog {...baseProps} isOpen={true} type="alert" />);
      fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
      expect(mockOnClose).toHaveBeenCalledTimes(1); // handleCancel llama a onClose para alert
    });

    test("debe llamar a handleConfirm (onClose) al hacer clic en el backdrop", () => {
      render(<CustomDialog {...baseProps} isOpen={true} type="alert" />);
      fireEvent.click(screen.getByRole("dialog").parentElement); // Clic en el overlay
      expect(mockOnConfirm).toHaveBeenCalledWith(true);
    });
  });

  describe("Tipo Confirm", () => {
    test("debe renderizar diálogo de confirmación con botones Confirmar y Cancelar", () => {
      render(<CustomDialog {...baseProps} isOpen={true} type="confirm" />);
      expect(
        screen.getByRole("button", { name: "Aceptar" })
      ).toBeInTheDocument(); // Texto por defecto
      expect(
        screen.getByRole("button", { name: "Cancelar" })
      ).toBeInTheDocument();
    });

    test("debe llamar a onConfirm(true) al hacer clic en Confirmar", () => {
      render(
        <CustomDialog
          {...baseProps}
          isOpen={true}
          type="confirm"
          confirmText="Sí"
        />
      );
      fireEvent.click(screen.getByRole("button", { name: "Sí" }));
      expect(mockOnConfirm).toHaveBeenCalledWith(true);
    });

    test("debe llamar a onCancel(false) al hacer clic en Cancelar", () => {
      render(
        <CustomDialog
          {...baseProps}
          isOpen={true}
          type="confirm"
          cancelText="No"
        />
      );
      fireEvent.click(screen.getByRole("button", { name: "No" }));
      expect(mockOnCancel).toHaveBeenCalledWith(false);
    });

    test("debe llamar a onConfirm(true) al presionar Enter", () => {
      render(<CustomDialog {...baseProps} isOpen={true} type="confirm" />);
      fireEvent.keyDown(document, { key: "Enter", code: "Enter" });
      expect(mockOnConfirm).toHaveBeenCalledWith(true);
    });

    test("debe llamar a onCancel(false) al presionar Escape", () => {
      render(<CustomDialog {...baseProps} isOpen={true} type="confirm" />);
      fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
      expect(mockOnCancel).toHaveBeenCalledWith(false);
    });

    test("debe llamar a onCancel(false) al hacer clic en el backdrop", () => {
      render(<CustomDialog {...baseProps} isOpen={true} type="confirm" />);
      fireEvent.click(screen.getByRole("dialog").parentElement); // Clic en el overlay
      expect(mockOnCancel).toHaveBeenCalledWith(false);
    });
  });

  describe("Tipo Prompt", () => {
    test("debe renderizar diálogo de prompt con input", () => {
      render(
        <CustomDialog
          {...baseProps}
          isOpen={true}
          type="prompt"
          defaultValue="valor inicial"
        />
      );
      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(screen.getByRole("textbox")).toHaveValue("valor inicial");
    });

    test("debe enfocar el input al abrir (con timeout)", async () => {
      jest.useFakeTimers();
      render(<CustomDialog {...baseProps} isOpen={true} type="prompt" />);
      const input = screen.getByRole("textbox");
      // Avanzar el timer del setTimeout en el componente
      act(() => {
        jest.advanceTimersByTime(150);
      });
      expect(input).toHaveFocus();
      jest.useRealTimers();
    });

    test("debe actualizar inputValue al escribir en el input", () => {
      render(<CustomDialog {...baseProps} isOpen={true} type="prompt" />);
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "nuevo valor" } });
      expect(input).toHaveValue("nuevo valor");
    });

    test("debe llamar a onConfirm con el valor del input al hacer clic en Confirmar", () => {
      render(<CustomDialog {...baseProps} isOpen={true} type="prompt" />);
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "valor final" } });
      fireEvent.click(screen.getByRole("button", { name: "Aceptar" }));
      expect(mockOnConfirm).toHaveBeenCalledWith("valor final");
    });

    test("debe llamar a onConfirm con el valor del input al presionar Enter (no en textarea)", () => {
      render(<CustomDialog {...baseProps} isOpen={true} type="prompt" />);
      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "enter valor" } });
      fireEvent.keyDown(input, { key: "Enter", code: "Enter" }); // Simular Enter en el input
      expect(mockOnConfirm).toHaveBeenCalledWith("enter valor");
    });

    test("debe llamar a onCancel(false) al presionar Escape", () => {
      render(<CustomDialog {...baseProps} isOpen={true} type="prompt" />);
      fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
      expect(mockOnCancel).toHaveBeenCalledWith(false);
    });
  });

  test("debe gestionar el overflow del body", () => {
    expect(document.body.style.overflow).toBe("");
    const { rerender, unmount } = render(
      <CustomDialog {...baseProps} isOpen={true} type="alert" />
    );
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<CustomDialog {...baseProps} isOpen={false} type="alert" />);
    expect(document.body.style.overflow).toBe("");

    // Reabrir y desmontar
    rerender(<CustomDialog {...baseProps} isOpen={true} type="alert" />);
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});
