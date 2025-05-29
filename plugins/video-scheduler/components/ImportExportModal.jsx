// video-scheduler/components/ImportExportModal.jsx
import React from "react";

function ImportExportModal({ plugin, core, pluginId, onClose }) {
  const modalRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [feedback, setFeedback] = React.useState({ type: "", message: "" });
  const [isCoreDialogActive, setIsCoreDialogActive] = React.useState(false);

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

  const handleExport = async () => {
    setIsProcessing(true);
    setFeedback({ message: "", type: "" });
    try {
      if (!plugin.publicAPI || !plugin.publicAPI.exportAllData) {
        throw new Error("La función de exportación no está disponible.");
      }
      const dataToExport = await plugin.publicAPI.exportAllData();
      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const timestamp = new Date()
        .toISOString()
        .replace(/[:T.]/g, "-")
        .slice(0, -5); // Formato YYYY-MM-DD-HH-MM-SS
      a.download = `${pluginId}-data-export-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showTemporaryFeedback("Datos exportados con éxito.", "success");
    } catch (error) {
      console.error(`[${pluginId}] Error al exportar datos:`, error);
      showTemporaryFeedback(`Error al exportar: ${error.message}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    setFeedback({ message: "", type: "" });

    try {
      if (!plugin.publicAPI || !plugin.publicAPI.importAllData) {
        throw new Error("La función de importación no está disponible.");
      }
      const fileContent = await file.text();
      const jsonData = JSON.parse(fileContent);

      let confirmedImport = false;
      if (core && core.dialogs && core.dialogs.confirm) {
        setIsCoreDialogActive(true);
        confirmedImport = await core.dialogs.confirm(
          "Importar estos datos reemplazará TODOS los datos existentes del Video Scheduler. ¿Estás seguro de que quieres continuar?",
          "Confirmar Importación Masiva"
        );
        setIsCoreDialogActive(false);
      } else {
        confirmedImport = confirm(
          "Importar estos datos reemplazará TODOS los datos existentes del Video Scheduler. ¿Continuar?"
        );
      }

      if (!confirmedImport) {
        setIsProcessing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      await plugin.publicAPI.importAllData(jsonData);
      showTemporaryFeedback(
        "Datos importados con éxito. La página se recargará para reflejar los cambios.",
        "success",
        6000
      );

      setTimeout(() => {
        onClose();
        if (core && core.events && typeof core.events.publish === "function") {
          core.events.publish(pluginId, `${pluginId}.dataImportedRefresh`, {});
        } else if (typeof window !== "undefined") {
          // Fallback extremo
          window.location.reload();
        }
      }, 2000);
    } catch (error) {
      console.error(`[${pluginId}] Error al importar datos:`, error);
      showTemporaryFeedback(
        `Error al importar: ${error.message}. Asegúrate de que el archivo JSON es válido y tiene la estructura correcta.`,
        "error",
        8000
      );
      setIsProcessing(false);
    } finally {
      // No resetear isProcessing aquí si el error fue antes del confirm,
      // pero sí limpiar el input del archivo
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (isCoreDialogActive) {
    return null;
  }

  return React.createElement(
    "div",
    { className: "import-export-modal-overlay" },
    React.createElement(
      "div",
      {
        ref: modalRef,
        className: "import-export-modal",
        style: { display: "flex" },
      },
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
                  "import_export"
                ),
                React.createElement(
                  "h3",
                  { key: "title" },
                  "Importar / Exportar Datos"
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
              { key: "desc", className: "modal-description" },
              "Exporta todos los datos del Video Scheduler (videos, ingresos, configuración de moneda) a un archivo JSON para crear una copia de seguridad o transferirlos. " +
                "Importa un archivo JSON previamente exportado para restaurar los datos. " +
                "La importación reemplazará todos los datos existentes del plugin."
            ),

            React.createElement(
              "div",
              { key: "actions-export", className: "action-group" },
              [
                React.createElement(
                  "h4",
                  { key: "title-export" },
                  "Exportar Datos"
                ),
                React.createElement(
                  "button",
                  {
                    key: "btn-export",
                    onClick: handleExport,
                    disabled: isProcessing,
                    className: "action-button primary",
                  },
                  isProcessing
                    ? "Exportando..."
                    : "Exportar Todos los Datos a JSON"
                ),
              ]
            ),

            React.createElement("hr", {
              key: "divider",
              className: "modal-divider",
            }),

            React.createElement(
              "div",
              { key: "actions-import", className: "action-group" },
              [
                React.createElement(
                  "h4",
                  { key: "title-import" },
                  "Importar Datos"
                ),
                React.createElement("input", {
                  key: "file-input",
                  type: "file",
                  accept: ".json,application/json", // Más específico
                  onChange: handleImport,
                  disabled: isProcessing,
                  ref: fileInputRef,
                  className: "file-input", // Para ocultar con CSS
                  id: `${pluginId}-import-file-input`,
                }),
                React.createElement(
                  "label",
                  {
                    htmlFor: `${pluginId}-import-file-input`,
                    className: `action-button secondary file-input-label ${
                      isProcessing ? "disabled" : ""
                    }`,
                    key: "label-file-input",
                    role: "button", // Para accesibilidad
                    tabIndex: isProcessing ? -1 : 0, // Para accesibilidad
                    onKeyDown: (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        if (fileInputRef.current && !isProcessing)
                          fileInputRef.current.click();
                      }
                    },
                  },
                  isProcessing
                    ? "Importando..."
                    : "Seleccionar Archivo JSON para Importar"
                ),
                React.createElement(
                  "p",
                  { key: "import-warning", className: "import-warning-text" },
                  "⚠️ ¡Atención! La importación reemplazará todos los datos actuales del Video Scheduler."
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
            "Cerrar"
          )
        ),
      ]
    )
  );
}

export default ImportExportModal;
