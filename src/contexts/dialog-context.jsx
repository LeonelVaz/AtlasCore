import React, { createContext, useState, useContext, useCallback } from "react";
import CustomDialog from "../components/ui/dialog-system/custom-dialog";

const DialogContext = createContext();

/**
 * Provider del contexto de diálogos
 * Proporciona funciones para mostrar alert, confirm y prompt personalizados
 */
export const DialogProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    type: "alert",
    title: "",
    message: "",
    defaultValue: "",
    confirmText: "Aceptar",
    cancelText: "Cancelar",
    onConfirm: null,
    onCancel: null,
    onClose: null,
  });

  // Función para cerrar el diálogo
  const closeDialog = useCallback(() => {
    setDialogState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  // Función para mostrar alert personalizado
  const showAlert = useCallback(
    (message, title = "Información", confirmText = "Aceptar") => {
      return new Promise((resolve) => {
        setDialogState({
          isOpen: true,
          type: "alert",
          title,
          message,
          confirmText,
          onConfirm: () => {
            closeDialog();
            resolve(true);
          },
          onClose: () => {
            closeDialog();
            resolve(true);
          },
        });
      });
    },
    [closeDialog]
  );

  // Función para mostrar confirm personalizado
  const showConfirm = useCallback(
    (
      message,
      title = "Confirmación",
      confirmText = "Aceptar",
      cancelText = "Cancelar"
    ) => {
      return new Promise((resolve) => {
        setDialogState({
          isOpen: true,
          type: "confirm",
          title,
          message,
          confirmText,
          cancelText,
          onConfirm: () => {
            closeDialog();
            resolve(true);
          },
          onCancel: () => {
            closeDialog();
            resolve(false);
          },
        });
      });
    },
    [closeDialog]
  );

  // Función para mostrar prompt personalizado
  const showPrompt = useCallback(
    (
      message,
      defaultValue = "",
      title = "Entrada de datos",
      confirmText = "Aceptar",
      cancelText = "Cancelar"
    ) => {
      return new Promise((resolve) => {
        setDialogState({
          isOpen: true,
          type: "prompt",
          title,
          message,
          defaultValue,
          confirmText,
          cancelText,
          onConfirm: (value) => {
            closeDialog();
            resolve(value);
          },
          onCancel: () => {
            closeDialog();
            resolve(null);
          },
        });
      });
    },
    [closeDialog]
  );

  // Función para mostrar diálogo personalizado con opciones avanzadas
  const showCustomDialog = useCallback(
    (options) => {
      return new Promise((resolve) => {
        const {
          type = "alert",
          title = "",
          message = "",
          defaultValue = "",
          confirmText = "Aceptar",
          cancelText = "Cancelar",
          onConfirm = null,
          onCancel = null,
        } = options;

        setDialogState({
          isOpen: true,
          type,
          title,
          message,
          defaultValue,
          confirmText,
          cancelText,
          onConfirm: (result) => {
            closeDialog();
            if (onConfirm) onConfirm(result);
            resolve(result);
          },
          onCancel: (result) => {
            closeDialog();
            if (onCancel) onCancel(result);
            resolve(result);
          },
        });
      });
    },
    [closeDialog]
  );

  // Valor del contexto
  const contextValue = {
    showAlert,
    showConfirm,
    showPrompt,
    showCustomDialog,
    closeDialog,
  };

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      {/* Solo renderizar el diálogo si está abierto y tiene handlers válidos */}
      {dialogState.isOpen && dialogState.onConfirm && (
        <CustomDialog
          isOpen={dialogState.isOpen}
          type={dialogState.type}
          title={dialogState.title}
          message={dialogState.message}
          defaultValue={dialogState.defaultValue}
          confirmText={dialogState.confirmText}
          cancelText={dialogState.cancelText}
          onConfirm={dialogState.onConfirm}
          onCancel={dialogState.onCancel}
          onClose={dialogState.onClose}
        />
      )}
    </DialogContext.Provider>
  );
};

/**
 * Hook para usar el contexto de diálogos
 */
export const useDialog = () => {
  const context = useContext(DialogContext);

  if (!context) {
    throw new Error("useDialog debe ser usado dentro de un DialogProvider");
  }

  return context;
};

export default DialogContext;
