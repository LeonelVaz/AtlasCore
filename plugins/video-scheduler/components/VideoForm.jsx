// video-scheduler/components/VideoForm.jsx
import React from "react";

function VideoForm({ videoData, onSave, onCancel, plugin }) {
  const modalRef = React.useRef(null);
  const [formData, setFormData] = React.useState({
    detailedDescription: videoData?.detailedDescription || "",
    platform: videoData?.platform || "",
    url: videoData?.url || "",
    duration: videoData?.duration || "",
    tags: Array.isArray(videoData?.tags) ? videoData.tags.join(", ") : "",
  });

  React.useEffect(() => {
    setFormData({
      detailedDescription: videoData?.detailedDescription || "",
      platform: videoData?.platform || "",
      url: videoData?.url || "",
      duration: videoData?.duration || "",
      tags: Array.isArray(videoData?.tags) ? videoData.tags.join(", ") : "",
    });
  }, [videoData]);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onCancel();
      }
    };
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onCancel]);

  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCancel]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const detailsToSave = {
      ...formData,
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };
    // Pasamos el videoData original para que en onSave se sepa a qué video corresponden los detalles
    onSave(videoData.day, videoData.slotIndex, detailsToSave);
  };

  return React.createElement(
    "div",
    { className: "video-form-overlay" },
    React.createElement(
      "div",
      { ref: modalRef, className: "video-form-modal" },
      [
        React.createElement(
          "div",
          { key: "video-form-header", className: "video-form-header" }, // <-- Añadido key
          [
            React.createElement(
              "h3",
              { key: "title" },
              `📝 Detalles de: ${videoData?.name || "Video"}`
            ),
            React.createElement(
              "button",
              {
                key: "close-btn",
                type: "button",
                className: "video-form-close-button",
                onClick: onCancel,
              },
              "✕"
            ),
          ]
        ),
        React.createElement(
          "form",
          {
            key: "video-form-main", // <-- Añadido key
            onSubmit: handleSubmit,
            className: "video-form-content",
          },
          [
            React.createElement(
              "div",
              { key: "field-detailedDescription", className: "form-group" }, // <-- key para cada grupo
              [
                React.createElement(
                  "label",
                  { key: "label-desc", htmlFor: "detailedDescription" }, // <-- key para label
                  "Descripción Detallada:"
                ),
                React.createElement("textarea", {
                  key: "input-desc", // <-- key para input/textarea
                  id: "detailedDescription",
                  name: "detailedDescription",
                  value: formData.detailedDescription,
                  onChange: handleChange,
                  rows: 5,
                }),
              ]
            ),
            React.createElement(
              "div",
              { key: "fields-grid", className: "video-form-grid" }, // <-- key para el grid
              [
                React.createElement(
                  "div",
                  { key: "field-platform", className: "form-group" }, // <-- key
                  [
                    React.createElement(
                      "label",
                      { key: "label-platform", htmlFor: "platform" }, // <-- key
                      "Plataforma:"
                    ),
                    React.createElement("input", {
                      key: "input-platform", // <-- key
                      type: "text",
                      id: "platform",
                      name: "platform",
                      value: formData.platform,
                      onChange: handleChange,
                      placeholder: "Ej. YouTube, Vimeo, TikTok",
                    }),
                  ]
                ),
                React.createElement(
                  "div",
                  { key: "field-url", className: "form-group" }, // <-- key
                  [
                    React.createElement(
                      "label",
                      { key: "label-url", htmlFor: "url" }, // <-- key
                      "URL:"
                    ),
                    React.createElement("input", {
                      key: "input-url", // <-- key
                      type: "url",
                      id: "url",
                      name: "url",
                      value: formData.url,
                      onChange: handleChange,
                      placeholder: "https://ejemplo.com/video",
                    }),
                  ]
                ),
                React.createElement(
                  "div",
                  { key: "field-duration", className: "form-group" }, // <-- key
                  [
                    React.createElement(
                      "label",
                      { key: "label-duration", htmlFor: "duration" }, // <-- key
                      "Duración:"
                    ),
                    React.createElement("input", {
                      key: "input-duration", // <-- key
                      type: "text",
                      id: "duration",
                      name: "duration",
                      value: formData.duration,
                      onChange: handleChange,
                      placeholder: "Ej. 10:35 (MM:SS) o 01:15:30 (HH:MM:SS)",
                    }),
                  ]
                ),
                React.createElement(
                  "div",
                  { key: "field-tags", className: "form-group" }, // <-- key
                  [
                    React.createElement(
                      "label",
                      { key: "label-tags", htmlFor: "tags" }, // <-- key
                      "Tags (separados por coma):"
                    ),
                    React.createElement("input", {
                      key: "input-tags", // <-- key
                      type: "text",
                      id: "tags",
                      name: "tags",
                      value: formData.tags,
                      onChange: handleChange,
                      placeholder: "Ej. tutorial, react, desarrollo web",
                    }),
                  ]
                ),
              ]
            ),
            React.createElement(
              "div",
              { key: "video-form-actions", className: "form-actions" }, // <-- key
              [
                React.createElement(
                  "button",
                  {
                    key: "cancel-action", // <-- key
                    type: "button",
                    onClick: onCancel,
                    className: "button-secondary",
                  },
                  "Cancelar"
                ),
                React.createElement(
                  "button",
                  {
                    key: "submit-action", // <-- key
                    type: "submit",
                    className: "button-primary",
                  },
                  "Guardar Detalles"
                ),
              ]
            ),
          ]
        ),
      ]
    )
  );
}

export default VideoForm;
