// src/utils/dialog-interceptor.js

/**
 * Interceptor de diálogos nativos
 * Reemplaza alert(), confirm() y prompt() globales con versiones personalizadas
 */

let dialogContext = null;

// Guardar referencias originales
const originalAlert = window.alert;
const originalConfirm = window.confirm;
const originalPrompt = window.prompt;

/**
 * Inicializa el interceptor de diálogos
 * @param {Object} context - Contexto de diálogos con funciones showAlert, showConfirm, showPrompt
 */
export const initializeDialogInterceptor = (context) => {
  dialogContext = context;

  // Reemplazar alert global
  window.alert = async (message) => {
    if (dialogContext && dialogContext.showAlert) {
      return await dialogContext.showAlert(String(message));
    }
    // Fallback a alert nativo si no hay contexto
    return originalAlert(message);
  };

  // Reemplazar confirm global
  window.confirm = async (message) => {
    if (dialogContext && dialogContext.showConfirm) {
      return await dialogContext.showConfirm(String(message));
    }
    // Fallback a confirm nativo si no hay contexto
    return originalConfirm(message);
  };

  // Reemplazar prompt global
  window.prompt = async (message, defaultValue = "") => {
    if (dialogContext && dialogContext.showPrompt) {
      return await dialogContext.showPrompt(
        String(message),
        String(defaultValue)
      );
    }
    // Fallback a prompt nativo si no hay contexto
    return originalPrompt(message, defaultValue);
  };

  console.log(
    "Dialog interceptor inicializado - Los diálogos nativos ahora son personalizados"
  );
};

/**
 * Restaura los diálogos nativos originales
 */
export const restoreNativeDialogs = () => {
  window.alert = originalAlert;
  window.confirm = originalConfirm;
  window.prompt = originalPrompt;
  dialogContext = null;

  console.log("Diálogos nativos restaurados");
};

/**
 * Verifica si el interceptor está activo
 */
export const isInterceptorActive = () => {
  return dialogContext !== null;
};

/**
 * Funciones auxiliares para uso directo (sin interceptar globales)
 */
export const safeAlert = async (message, title) => {
  if (dialogContext && dialogContext.showAlert) {
    return await dialogContext.showAlert(String(message), title);
  }
  // Fallback seguro
  console.warn("Dialog context no disponible, usando console.log:", message);
  return true;
};

export const safeConfirm = async (message, title) => {
  if (dialogContext && dialogContext.showConfirm) {
    return await dialogContext.showConfirm(String(message), title);
  }
  // Fallback seguro - por defecto false para confirmaciones
  console.warn(
    "Dialog context no disponible, retornando false para confirm:",
    message
  );
  return false;
};

export const safePrompt = async (message, defaultValue = "", title) => {
  if (dialogContext && dialogContext.showPrompt) {
    return await dialogContext.showPrompt(
      String(message),
      String(defaultValue),
      title
    );
  }
  // Fallback seguro - retornar null
  console.warn(
    "Dialog context no disponible, retornando null para prompt:",
    message
  );
  return null;
};

/**
 * Función para plugins que permite usar diálogos sin depender de globals
 */
export const createPluginDialogAPI = () => {
  return {
    alert: safeAlert,
    confirm: safeConfirm,
    prompt: safePrompt,

    // Función más avanzada para diálogos personalizados
    showDialog: (options) => {
      if (dialogContext && dialogContext.showCustomDialog) {
        return dialogContext.showCustomDialog(options);
      }
      console.warn("Dialog context no disponible para showDialog");
      return Promise.resolve(null);
    },
  };
};
