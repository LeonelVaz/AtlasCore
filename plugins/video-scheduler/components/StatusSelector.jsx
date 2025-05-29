// video-scheduler/components/StatusSelector.jsx
import React from "react";
import {
  VIDEO_MAIN_STATUS,
  VIDEO_SUB_STATUS,
  VIDEO_STACKABLE_STATUS,
  STATUS_EMOJIS,
  VALID_SUB_STATUSES_FOR_MAIN,
} from "../utils/constants.js";

function StatusSelector(props) {
  const {
    currentMainStatus,
    currentSubStatus,
    currentStackableStatuses = [],
    onStatusChange,
    onCancel,
    styleProps,
  } = props;
  const popupRef = React.useRef(null);

  // Manejar clicks fuera del popup
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onCancel();
      }
    };

    // Agregar el listener después de un pequeño delay para evitar que se cierre inmediatamente
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onCancel]);

  const handleMainStatusSelect = (newMainStatus) => {
    const validSubStatusesForNewMain =
      VALID_SUB_STATUSES_FOR_MAIN[newMainStatus] || [];
    let newSub = null;
    // Solo mantener el subestado si el estado principal no cambia Y el subestado actual es válido para ese principal
    if (
      newMainStatus === currentMainStatus &&
      validSubStatusesForNewMain.includes(currentSubStatus)
    ) {
      newSub = currentSubStatus;
    } else if (validSubStatusesForNewMain.length > 0) {
      // Opcional: Si se cambia a un estado principal que tiene subestados, se podría auto-seleccionar el primero,
      // o dejarlo en null para que el usuario elija. Por ahora, se deja en null.
      // newSub = validSubStatusesForNewMain[0]; // Ejemplo de auto-selección
    }

    // Mantener los sub-estados apilables
    onStatusChange(newMainStatus, newSub, currentStackableStatuses);
  };

  const handleSubStatusSelect = (subStatus) => {
    const validSubStatuses =
      VALID_SUB_STATUSES_FOR_MAIN[currentMainStatus] || [];
    if (validSubStatuses.includes(subStatus)) {
      const newSubStatus = currentSubStatus === subStatus ? null : subStatus;
      onStatusChange(currentMainStatus, newSubStatus, currentStackableStatuses);
      // Cerrar el popup después de seleccionar sub-estado
      onCancel();
    } else {
      console.warn(
        `Sub-estado ${subStatus} no es válido para el estado principal ${currentMainStatus}`
      );
    }
  };

  const handleStackableStatusToggle = (stackableStatus) => {
    // Solo permitir al usuario añadir/quitar ❓ (QUESTION)
    // El sistema maneja ❗ (WARNING) automáticamente
    if (stackableStatus !== VIDEO_STACKABLE_STATUS.QUESTION) {
      return;
    }

    const newStackableStatuses = [...currentStackableStatuses];
    const index = newStackableStatuses.indexOf(stackableStatus);

    if (index > -1) {
      // Quitar si ya existe
      newStackableStatuses.splice(index, 1);
    } else {
      // Añadir si no existe
      newStackableStatuses.push(stackableStatus);
    }

    onStatusChange(currentMainStatus, currentSubStatus, newStackableStatuses);
  };

  const availableMainStatuses = Object.values(VIDEO_MAIN_STATUS);
  const availableSubStatuses =
    VALID_SUB_STATUSES_FOR_MAIN[currentMainStatus] || [];

  return React.createElement(
    "div",
    {
      ref: popupRef,
      className: "status-selector-popup",
      style: styleProps,
    },
    [
      React.createElement("h4", { key: "ss-title" }, "Cambiar Estado"),

      // Estados principales
      React.createElement(
        "strong",
        { key: "main-label", className: "status-selector-label" },
        "Estado Principal:"
      ),
      React.createElement(
        "div",
        { key: "ss-main-statuses", className: "status-options-group" },
        availableMainStatuses.map((statusValue) =>
          React.createElement(
            "button",
            {
              key: statusValue,
              onClick: () => handleMainStatusSelect(statusValue),
              className: `status-option-button ${
                currentMainStatus === statusValue ? "active" : ""
              }`,
            },
            `${STATUS_EMOJIS[statusValue] || "?"} ${
              statusValue.charAt(0).toUpperCase() + statusValue.slice(1)
            }`
          )
        )
      ),

      // Sub-estados normales
      availableSubStatuses.length > 0 &&
        React.createElement(React.Fragment, { key: "sub-status-section" }, [
          React.createElement(
            "strong",
            { key: "sub-label", className: "status-selector-label sub-label" },
            "Sub-Estado:"
          ),
          React.createElement(
            "div",
            { key: "ss-sub-statuses", className: "status-options-group" },
            availableSubStatuses.map((subStatusValue) =>
              React.createElement(
                "button",
                {
                  key: subStatusValue,
                  onClick: () => handleSubStatusSelect(subStatusValue),
                  className: `status-option-button ${
                    currentSubStatus === subStatusValue ? "active" : ""
                  }`,
                },
                `${STATUS_EMOJIS[subStatusValue] || "?"} ${
                  subStatusValue.charAt(0).toUpperCase() +
                  subStatusValue.slice(1)
                }`
              )
            )
          ),
        ]),

      // Sub-estados apilables (solo mostrar ❓ ya que ❗ lo maneja el sistema)
      React.createElement(React.Fragment, { key: "stackable-status-section" }, [
        React.createElement(
          "strong",
          {
            key: "stackable-label",
            className: "status-selector-label sub-label",
          },
          "Marcas Adicionales:"
        ),
        React.createElement(
          "div",
          { key: "ss-stackable-statuses", className: "status-options-group" },
          [
            React.createElement(
              "button",
              {
                key: VIDEO_STACKABLE_STATUS.QUESTION,
                onClick: () =>
                  handleStackableStatusToggle(VIDEO_STACKABLE_STATUS.QUESTION),
                className: `status-option-button ${
                  currentStackableStatuses.includes(
                    VIDEO_STACKABLE_STATUS.QUESTION
                  )
                    ? "active"
                    : ""
                }`,
              },
              `${
                STATUS_EMOJIS[VIDEO_STACKABLE_STATUS.QUESTION]
              } Marcar para revisar`
            ),
            // Mostrar WARNING solo como información (no clickeable por el usuario desde aquí)
            currentStackableStatuses.includes(VIDEO_STACKABLE_STATUS.WARNING) &&
              React.createElement(
                "div",
                {
                  key: VIDEO_STACKABLE_STATUS.WARNING,
                  className: "status-info-display status-option-button", // reusar estilo pero no funcionalidad de click
                  style: {
                    cursor: "default",
                    background: "rgba(var(--warning-color-rgb), 0.1)",
                    color: "var(--warning-color)",
                  },
                },
                `${
                  STATUS_EMOJIS[VIDEO_STACKABLE_STATUS.WARNING]
                } Alerta del sistema`
              ),
          ]
        ),
      ]),

      React.createElement(
        "button",
        {
          key: "ss-cancel",
          onClick: onCancel,
          className: "status-selector-cancel-button",
        },
        "Cerrar"
      ),
    ]
  );
}

export default StatusSelector;
