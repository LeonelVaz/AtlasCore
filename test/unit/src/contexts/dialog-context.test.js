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
  DialogProvider,
  useDialog,
} from "../../../../src/contexts/dialog-context";

const mockCustomDialogComponent = jest.fn(() => null);
jest.mock("../../../../src/components/ui/dialog-system/custom-dialog", () => {
  // eslint-disable-next-line react/prop-types
  return function MockedCustomDialog(props) {
    mockCustomDialogComponent(props); // Llamar a nuestro jest.fn para rastrear llamadas y props
    if (!props.isOpen) return null;
    return (
      <div data-testid="mocked-custom-dialog" data-type={props.type}>
        {props.message}
      </div>
    );
  };
});

let dialogFromHook;

const TestComponent = () => {
  const dialog = useDialog();
  dialogFromHook = dialog;
  return (
    <div>
      <button onClick={() => dialog.showAlert("Alert message!")}>
        Show Alert
      </button>
      <button onClick={() => dialog.showConfirm("Confirm message?")}>
        Show Confirm
      </button>
      <button onClick={() => dialog.showPrompt("Prompt message", "default")}>
        Show Prompt
      </button>
      <button
        onClick={() =>
          dialog.showCustomDialog({ type: "alert", message: "Custom" })
        }
      >
        Show Custom
      </button>
      <button onClick={() => dialog.closeDialog()}>Close Manually</button>
    </div>
  );
};

describe("DialogProvider and useDialog Hook", () => {
  beforeEach(() => {
    mockCustomDialogComponent.mockClear();
    dialogFromHook = null;
  });

  test("useDialog debe lanzar error si no está dentro de un DialogProvider", () => {
    const originalError = console.error;
    console.error = jest.fn();
    expect(() => render(<TestComponent />)).toThrow(
      "useDialog debe ser usado dentro de un DialogProvider"
    );
    console.error = originalError;
  });

  test("debe proveer funciones showAlert, showConfirm, showPrompt, showCustomDialog y closeDialog", () => {
    render(
      <DialogProvider>
        <TestComponent />
      </DialogProvider>
    );
    expect(dialogFromHook.showAlert).toBeInstanceOf(Function);
    expect(dialogFromHook.showConfirm).toBeInstanceOf(Function);
    expect(dialogFromHook.showPrompt).toBeInstanceOf(Function);
    expect(dialogFromHook.showCustomDialog).toBeInstanceOf(Function);
    expect(dialogFromHook.closeDialog).toBeInstanceOf(Function);
  });

  describe("Dialog Actions", () => {
    test("showAlert debe mostrar CustomDialog con tipo alert y resolver la promesa", async () => {
      render(
        <DialogProvider>
          <TestComponent />
        </DialogProvider>
      );

      let alertPromise;
      await act(async () => {
        alertPromise = dialogFromHook.showAlert("Alert message!");
      });

      await waitFor(() => {
        expect(mockCustomDialogComponent).toHaveBeenCalledWith(
          // CORREGIDO: Sin segundo argumento {}
          expect.objectContaining({
            isOpen: true,
            type: "alert",
            message: "Alert message!",
            title: "Información",
            // confirmText: 'Aceptar' (incluido por defecto)
            // onConfirm y onClose también se pasan
          })
        );
      });
      expect(screen.getByTestId("mocked-custom-dialog")).toBeInTheDocument();

      const lastCallIndex = mockCustomDialogComponent.mock.calls.length - 1;
      const customDialogProps =
        mockCustomDialogComponent.mock.calls[lastCallIndex][0];

      await act(async () => {
        customDialogProps.onConfirm();
      });

      const result = await alertPromise;
      expect(result).toBe(true);

      await waitFor(() => {
        expect(
          screen.queryByTestId("mocked-custom-dialog")
        ).not.toBeInTheDocument();
      });
    });

    test("showConfirm debe mostrar CustomDialog con tipo confirm y resolver con true/false", async () => {
      render(
        <DialogProvider>
          <TestComponent />
        </DialogProvider>
      );

      let confirmPromise;
      await act(async () => {
        confirmPromise = dialogFromHook.showConfirm("Confirm message?");
      });

      await waitFor(() =>
        expect(mockCustomDialogComponent).toHaveBeenCalledWith(
          // CORREGIDO
          expect.objectContaining({
            isOpen: true,
            type: "confirm",
            message: "Confirm message?",
            title: "Confirmación",
            // confirmText y cancelText con valores por defecto
          })
        )
      );
      expect(screen.getByTestId("mocked-custom-dialog")).toBeInTheDocument();

      let lastCallIndex = mockCustomDialogComponent.mock.calls.length - 1;
      let customDialogProps =
        mockCustomDialogComponent.mock.calls[lastCallIndex][0];
      await act(async () => {
        customDialogProps.onConfirm();
      });
      let result = await confirmPromise;
      expect(result).toBe(true);
      await waitFor(() =>
        expect(
          screen.queryByTestId("mocked-custom-dialog")
        ).not.toBeInTheDocument()
      );

      await act(async () => {
        confirmPromise = dialogFromHook.showConfirm("Confirm message?");
      });
      await waitFor(() =>
        expect(mockCustomDialogComponent).toHaveBeenCalledWith(
          // CORREGIDO
          expect.objectContaining({ isOpen: true, type: "confirm" })
        )
      );
      expect(screen.getByTestId("mocked-custom-dialog")).toBeInTheDocument();

      lastCallIndex = mockCustomDialogComponent.mock.calls.length - 1;
      customDialogProps =
        mockCustomDialogComponent.mock.calls[lastCallIndex][0];
      await act(async () => {
        customDialogProps.onCancel();
      });
      result = await confirmPromise;
      expect(result).toBe(false);
      await waitFor(() =>
        expect(
          screen.queryByTestId("mocked-custom-dialog")
        ).not.toBeInTheDocument()
      );
    });

    test("showPrompt debe mostrar CustomDialog con tipo prompt y resolver con valor o null", async () => {
      render(
        <DialogProvider>
          <TestComponent />
        </DialogProvider>
      );

      let promptPromise;
      await act(async () => {
        promptPromise = dialogFromHook.showPrompt("Prompt message", "default");
      });

      await waitFor(() =>
        expect(mockCustomDialogComponent).toHaveBeenCalledWith(
          // CORREGIDO
          expect.objectContaining({
            isOpen: true,
            type: "prompt",
            message: "Prompt message",
            defaultValue: "default",
            title: "Entrada de datos",
          })
        )
      );
      expect(screen.getByTestId("mocked-custom-dialog")).toBeInTheDocument();

      let lastCallIndex = mockCustomDialogComponent.mock.calls.length - 1;
      let customDialogProps =
        mockCustomDialogComponent.mock.calls[lastCallIndex][0];
      await act(async () => {
        customDialogProps.onConfirm("user input");
      });
      let result = await promptPromise;
      expect(result).toBe("user input");
      await waitFor(() =>
        expect(
          screen.queryByTestId("mocked-custom-dialog")
        ).not.toBeInTheDocument()
      );

      await act(async () => {
        promptPromise = dialogFromHook.showPrompt("Prompt message", "default");
      });
      await waitFor(() =>
        expect(mockCustomDialogComponent).toHaveBeenCalledWith(
          // CORREGIDO
          expect.objectContaining({ isOpen: true, type: "prompt" })
        )
      );
      expect(screen.getByTestId("mocked-custom-dialog")).toBeInTheDocument();

      lastCallIndex = mockCustomDialogComponent.mock.calls.length - 1;
      customDialogProps =
        mockCustomDialogComponent.mock.calls[lastCallIndex][0];
      await act(async () => {
        customDialogProps.onCancel();
      });
      result = await promptPromise;
      expect(result).toBe(null);
      await waitFor(() =>
        expect(
          screen.queryByTestId("mocked-custom-dialog")
        ).not.toBeInTheDocument()
      );
    });

    test("showCustomDialog debe mostrar CustomDialog con opciones personalizadas", async () => {
      render(
        <DialogProvider>
          <TestComponent />
        </DialogProvider>
      );

      await act(async () => {
        dialogFromHook.showCustomDialog({
          type: "alert",
          message: "Custom",
          title: "Custom Title",
        });
      });

      await waitFor(() =>
        expect(mockCustomDialogComponent).toHaveBeenCalledWith(
          // CORREGIDO
          expect.objectContaining({
            isOpen: true,
            type: "alert",
            message: "Custom",
            title: "Custom Title",
          })
        )
      );
      expect(screen.getByTestId("mocked-custom-dialog")).toBeInTheDocument();
    });

    test("closeDialog debe cerrar un diálogo abierto", async () => {
      render(
        <DialogProvider>
          <TestComponent />
        </DialogProvider>
      );
      await act(async () => {
        dialogFromHook.showAlert("Alert message!");
      });
      await waitFor(() =>
        expect(screen.getByTestId("mocked-custom-dialog")).toBeInTheDocument()
      );
      expect(
        mockCustomDialogComponent.mock.calls[
          mockCustomDialogComponent.mock.calls.length - 1
        ][0].isOpen
      ).toBe(true);

      await act(async () => {
        dialogFromHook.closeDialog();
      });

      await waitFor(() =>
        expect(
          screen.queryByTestId("mocked-custom-dialog")
        ).not.toBeInTheDocument()
      );
    });
  });
});
