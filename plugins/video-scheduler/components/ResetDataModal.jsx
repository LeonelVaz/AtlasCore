// video-scheduler/components/ResetDataModal.jsx
import React from "react";

function ResetDataModal({ plugin, core, pluginId, onClose, currentViewDate }) {
  // Recibir currentViewDate
  const modalRef = React.useRef(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [resetScope, setResetScope] = React.useState("current_month");
  const [confirmationText, setConfirmationText] = React.useState("");
  const [feedback, setFeedback] = React.useState({ type: "", message: "" });
  const [isCoreDialogActive, setIsCoreDialogActive] = React.useState(false);

  const expectedConfirmation = "CONFIRMAR RESET";

  React.useEffect(() => {
    if (isCoreDialogActive) return;
    const handleClickOutside = (event) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target) &&
        !isProcessing
      ) {
        onClose();
      }
    };
    const timeoutId = setTimeout(
      () => document.addEventListener("mousedown", handleClickOutside),
      100
    );
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose, isProcessing, isCoreDialogActive]);

  React.useEffect(() => {
    if (isCoreDialogActive) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isProcessing) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isProcessing, isCoreDialogActive]);

  const showTemporaryFeedback = (message, type, duration = 4000) => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: "", type: "" }), duration);
  };

  const handleReset = async () => {
    if (confirmationText !== expectedConfirmation) {
      showTemporaryFeedback("Texto de confirmación incorrecto.", "error");
      return;
    }
    if (!plugin.publicAPI || !plugin.publicAPI.resetPluginData) {
      showTemporaryFeedback(
        "La función de reseteo no está disponible.",
        "error"
      );
      return;
    }
    if (resetScope === "current_month" && !currentViewDate) {
      showTemporaryFeedback(
        "No se pudo determinar el mes actual para el reseteo.",
        "error"
      );
      console.error(
        `[${pluginId}] currentViewDate no fue proporcionada a ResetDataModal para el reseteo del mes.`
      );
      return;
    }

    setIsProcessing(true);
    setFeedback({ message: "", type: "" });

    const resetMessage =
      resetScope === "all_data"
        ? "TODOS los datos del Video Scheduler (videos, ingresos, configuración) serán eliminados permanentemente. Esta acción no se puede deshacer. ¿Estás absolutamente seguro?"
        : `Los videos e ingresos del MES actualmente visible (${
            currentViewDate
              ? currentViewDate.toLocaleDateString("es-ES", {
                  month: "long",
                  year: "numeric",
                })
              : "desconocido"
          }) serán eliminados. La configuración de moneda NO se verá afectada. Esta acción no se puede deshacer. ¿Estás seguro?`;

    const resetTitle =
      resetScope === "all_data"
        ? "Confirmar Reseteo Total"
        : "Confirmar Reseteo del Mes Actual";

    try {
      let confirmedByDialog = false;
      if (core && core.dialogs && core.dialogs.confirm) {
        setIsCoreDialogActive(true);
        confirmedByDialog = await core.dialogs.confirm(
          resetMessage,
          resetTitle
        );
        setIsCoreDialogActive(false);
      } else {
        confirmedByDialog = confirm(resetMessage);
      }

      if (!confirmedByDialog) {
        setIsProcessing(false);
        setConfirmationText("");
        return;
      }

      await plugin.publicAPI.resetPluginData(resetScope, currentViewDate); // Pasar currentViewDate
      showTemporaryFeedback(
        "Datos reseteados con éxito. La página se recargará.",
        "success",
        6000
      );

      setTimeout(() => {
        onClose();
        if (core && core.events && typeof core.events.publish === "function") {
          core.events.publish(pluginId, `${pluginId}.dataResetRefresh`, {});
        } else if (typeof window !== "undefined") {
          window.location.reload();
        }
      }, 2000);
    } catch (error) {
      console.error(`[${pluginId}] Error al resetear datos:`, error);
      showTemporaryFeedback(`Error al resetear: ${error.message}`, "error");
      setIsProcessing(false);
    } finally {
      // No resetear isProcessing aquí si el error fue antes del confirm
      setConfirmationText("");
    }
  };

  const radioOptions = [
    {
      value: "current_month",
      label: "Restablecer solo el mes actual visible en el calendario",
      description:
        "Elimina videos e ingresos del mes visible. La configuración de moneda se conserva.",
    },
    {
      value: "all_data",
      label: "Restablecer TODOS los datos del plugin",
      description:
        "Elimina todos los videos, ingresos y revierte la configuración de moneda a los valores por defecto.",
    },
  ];

  if (isCoreDialogActive) {
    return null;
  }

  return React.createElement(
    "div",
    { className: "reset-data-modal-overlay" },
    React.createElement(
      "div",
      { ref: modalRef, className: "reset-data-modal" },
      [
        React.createElement(
          "div",
          { key: "header", className: "modal-header" },
          [
            React.createElement(
              "div",
              { key: "title-container", className: "modal-title-container" },
              [
                React.createElement(
                  "span",
                  {
                    key: "icon",
                    className: "material-icons modal-header-icon",
                  },
                  "restart_alt"
                ),
                React.createElement(
                  "h3",
                  { key: "title" },
                  "Restablecer Datos del Plugin"
                ),
              ]
            ),
            React.createElement(
              "button",
              {
                key: "close-btn",
                type: "button",
                className: "modal-close-button",
                onClick: onClose,
                disabled: isProcessing,
              },
              "✕"
            ),
          ]
        ),
        React.createElement(
          "div",
          { key: "content", className: "modal-content" },
          [
            React.createElement(
              "p",
              { key: "desc", className: "modal-description warning" },
              "¡Atención! Esta es una acción destructiva y no se puede deshacer. " +
                "Por favor, considera exportar tus datos primero si deseas conservarlos."
            ),

            React.createElement(
              "div",
              { key: "scope-selector", className: "action-group" },
              [
                React.createElement(
                  "h4",
                  { key: "title-scope" },
                  "Selecciona el Alcance del Reseteo:"
                ),
                radioOptions.map((option) =>
                  React.createElement(
                    "div",
                    {
                      key: `radio-group-${option.value}`,
                      className: "radio-group",
                    },
                    [
                      React.createElement(
                        "label",
                        {
                          key: `label-${option.value}`,
                          className: "radio-label",
                        },
                        [
                          React.createElement("input", {
                            type: "radio",
                            name: "resetScope",
                            value: option.value,
                            checked: resetScope === option.value,
                            onChange: (e) => setResetScope(e.target.value),
                            disabled: isProcessing,
                            key: `input-${option.value}`,
                          }),
                          option.label,
                        ]
                      ),
                      React.createElement(
                        "p",
                        {
                          key: `desc-${option.value}`,
                          className: "radio-description",
                        },
                        option.description
                      ),
                    ]
                  )
                ),
              ]
            ),

            React.createElement("hr", {
              key: "divider",
              className: "modal-divider",
            }),

            React.createElement(
              "div",
              { key: "confirmation-area", className: "action-group" },
              [
                React.createElement(
                  "h4",
                  { key: "title-confirm" },
                  "Confirmación Requerida"
                ),
                React.createElement(
                  "p",
                  {
                    key: "confirm-instructions",
                    className: "confirmation-instructions",
                  },
                  `Para confirmar, escribe "${expectedConfirmation}" en el campo de abajo:`
                ),
                React.createElement("input", {
                  key: "confirm-input",
                  type: "text",
                  value: confirmationText,
                  onChange: (e) =>
                    setConfirmationText(e.target.value.toUpperCase()),
                  placeholder: expectedConfirmation,
                  disabled: isProcessing,
                  className: "confirmation-input",
                }),
                React.createElement(
                  "button",
                  {
                    key: "btn-reset",
                    onClick: handleReset,
                    disabled:
                      isProcessing || confirmationText !== expectedConfirmation,
                    className: "action-button danger full-width",
                  },
                  isProcessing ? "Reseteando..." : "Restablecer Datos Ahora"
                ),
              ]
            ),

            feedback.message &&
              React.createElement(
                "div",
                {
                  key: "feedback",
                  className: `feedback-message ${feedback.type}`,
                },
                feedback.message
              ),
          ]
        ),
        React.createElement(
          "div",
          { key: "footer", className: "modal-footer" },
          React.createElement(
            "button",
            {
              key: "btn-close-footer",
              onClick: onClose,
              disabled: isProcessing,
              className: "action-button secondary",
            },
            "Cancelar"
          )
        ),
      ]
    )
  );
}

export default ResetDataModal;
