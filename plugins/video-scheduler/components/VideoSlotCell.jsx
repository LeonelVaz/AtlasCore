// video-scheduler/components/VideoSlotCell.jsx
import React from "react";
import { STATUS_EMOJIS, VIDEO_MAIN_STATUS } from "../utils/constants.js";

function VideoSlotCell(props) {
  const {
    day,
    slotIndex,
    videoData,
    onNameChange,
    onStatusIconClick,
    onDescriptionChange,
    onOpenDetailsForm, // Nueva prop
  } = props;
  const [currentName, setCurrentName] = React.useState(videoData.name || "");
  const [currentDescription, setCurrentDescription] = React.useState(
    videoData.description || ""
  );

  React.useEffect(() => {
    setCurrentName(videoData.name || "");
    setCurrentDescription(videoData.description || "");
  }, [videoData.name, videoData.description]);

  const handleNameInputChange = (e) => {
    setCurrentName(e.target.value);
  };

  const handleNameInputBlur = () => {
    if (
      currentName !== videoData.name ||
      (videoData.status === VIDEO_MAIN_STATUS.PENDING &&
        currentName.trim() !== "")
    ) {
      onNameChange(day, slotIndex, currentName.trim());
    }
  };

  const handleDescriptionInputChange = (e) => {
    setCurrentDescription(e.target.value);
  };

  const handleDescriptionInputBlur = () => {
    if (currentDescription !== videoData.description) {
      onDescriptionChange(day, slotIndex, currentDescription.trim());
    }
  };

  const handleNameInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.target.blur();
    } else if (e.key === "Escape") {
      setCurrentName(videoData.name || "");
      e.target.blur();
    }
  };

  const handleDescriptionInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.target.blur();
    } else if (e.key === "Escape") {
      setCurrentDescription(videoData.description || "");
      e.target.blur();
    }
  };

  const nameInputId = `video-name-${day}-${slotIndex}`;
  const descriptionInputId = `video-description-${day}-${slotIndex}`;

  const placeholderText = currentName.trim() === "" ? "..." : "";

  const buildStatusDisplay = () => {
    const emojiElements = [];
    if (videoData.stackableStatuses && videoData.stackableStatuses.length > 0) {
      videoData.stackableStatuses.forEach((stackableStatus, index) => {
        if (STATUS_EMOJIS[stackableStatus]) {
          emojiElements.push(
            React.createElement(
              "span",
              {
                key: `stackable-${index}`,
                className: "status-emoji stackable-status-emoji",
              },
              STATUS_EMOJIS[stackableStatus]
            )
          );
        }
      });
    }
    if (videoData.subStatus && STATUS_EMOJIS[videoData.subStatus]) {
      emojiElements.push(
        React.createElement(
          "span",
          {
            key: "sub-status",
            className: "status-emoji sub-status-emoji",
          },
          STATUS_EMOJIS[videoData.subStatus]
        )
      );
    }
    if (videoData.status && STATUS_EMOJIS[videoData.status]) {
      emojiElements.push(
        React.createElement(
          "span",
          {
            key: "main-status",
            className: "status-emoji main-status-emoji",
          },
          STATUS_EMOJIS[videoData.status]
        )
      );
    } else {
      emojiElements.push(
        React.createElement(
          "span",
          {
            key: "main-status-pending-fallback",
            className: "status-emoji main-status-emoji",
          },
          STATUS_EMOJIS[VIDEO_MAIN_STATUS.PENDING]
        )
      );
    }
    if (emojiElements.length === 0) {
      emojiElements.push(
        React.createElement(
          "span",
          {
            key: "main-status-empty-fallback",
            className: "status-emoji main-status-emoji",
          },
          STATUS_EMOJIS[VIDEO_MAIN_STATUS.PENDING]
        )
      );
    }
    return emojiElements;
  };

  const isClickable = true; // Para el selector de estado

  const handleOpenDetailsClick = (e) => {
    e.stopPropagation(); // Evitar que se propague al TD o a otros elementos
    if (onOpenDetailsForm) {
      onOpenDetailsForm(day, slotIndex, videoData);
    }
  };

  return React.createElement(
    "td",
    { className: "video-scheduler-slot-cell" },
    React.createElement(
      "div",
      { className: `video-slot status-${videoData.status}` },
      [
        React.createElement(
          "div", // Contenedor para el nombre y el botón de detalles
          {
            key: `name-details-container-${day}-${slotIndex}`,
            className: "name-details-container",
          },
          [
            React.createElement("input", {
              key: nameInputId,
              id: nameInputId,
              type: "text",
              className: "video-name-input",
              value: currentName,
              placeholder: placeholderText,
              onChange: handleNameInputChange,
              onBlur: handleNameInputBlur,
              onKeyDown: handleNameInputKeyDown,
              onClick: (e) => e.stopPropagation(),
            }),
            // Botón para abrir detalles extendidos
            React.createElement(
              "button",
              {
                key: `details-btn-${day}-${slotIndex}`,
                className: "video-slot-details-button",
                onClick: handleOpenDetailsClick,
                title: "Editar detalles del video",
              },
              // Usar un icono de Material Icons o un SVG simple
              React.createElement(
                "span",
                { className: "material-icons" },
                "more_vert" // o "edit_note", "settings_ethernet"
              )
            ),
          ]
        ),
        React.createElement(
          "div",
          {
            key: `description-status-container-${day}-${slotIndex}`,
            className: "description-status-container",
          },
          [
            React.createElement("input", {
              key: descriptionInputId,
              id: descriptionInputId,
              type: "text",
              className: "video-description-input",
              value: currentDescription,
              placeholder: "", // O "Descripción breve..."
              onChange: handleDescriptionInputChange,
              onBlur: handleDescriptionInputBlur,
              onKeyDown: handleDescriptionInputKeyDown,
              onClick: (e) => e.stopPropagation(),
            }),
            React.createElement(
              "div",
              {
                key: `status-icons-${day}-${slotIndex}`,
                className: "status-container",
                onClick: isClickable
                  ? (e) => {
                      e.stopPropagation();
                      onStatusIconClick(day, slotIndex, e);
                    }
                  : (e) => {
                      e.stopPropagation();
                    },
                style: {
                  cursor: isClickable ? "pointer" : "default",
                },
              },
              buildStatusDisplay()
            ),
          ]
        ),
      ]
    )
  );
}

export default VideoSlotCell;
