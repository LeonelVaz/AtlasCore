import React from "react";
import EventSelector from "./EventSelector.jsx";

function NoteCard(props) {
  const {
    note,
    isEditing,
    isSelected,
    onEdit,
    onSave,
    onDelete,
    onCancel,
    core,
    plugin,
    id,
  } = props;
  const [editTitle, setEditTitle] = React.useState(note.title);
  const [editContent, setEditContent] = React.useState(note.content);
  const [showEventSelector, setShowEventSelector] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const RichTextEditor = core?.ui?.components?.RichTextEditor;
  const RichTextViewer = core?.ui?.components?.RichTextViewer;

  React.useEffect(() => {
    if (isEditing) {
      setEditTitle(note.title);
      setEditContent(note.content);
    }
  }, [isEditing, note.title, note.content]);

  const handleSave = () => {
    if (editTitle.trim()) {
      onSave({ title: editTitle.trim(), content: editContent });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && e.ctrlKey) handleSave();
    else if (e.key === "Escape") onCancel();
  };

  const handleContentChange = (htmlContent) => setEditContent(htmlContent);

  const handleEventSelect = (event) => {
    if (event) plugin.linkNoteToEvent(note.id, event.id, event.title);
    else plugin.unlinkNoteFromEvent(note.id);
    setShowEventSelector(false);
    onSave({}); // Forzar actualización
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTextPreview = (htmlContent) => {
    if (!htmlContent || typeof htmlContent !== "string") return "Sin contenido";
    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;
      const textContent = tempDiv.textContent || tempDiv.innerText || "";
      return textContent.length > 200
        ? textContent.substring(0, 200) + "..."
        : textContent || "Sin contenido";
    } catch (error) {
      console.error("Error al extraer texto del HTML:", error);
      return htmlContent.substring(0, 200) + "..." || "Sin contenido";
    }
  };

  const isHtmlContent = (content) => {
    if (!content || typeof content !== "string") return false;
    return content.includes("<") && content.includes(">");
  };

  if (isEditing) {
    return React.createElement(
      "div",
      { id: id, className: "note-card editing" },
      [
        React.createElement("input", {
          key: "title-input",
          type: "text",
          value: editTitle,
          onChange: (e) => setEditTitle(e.target.value),
          onKeyDown: handleKeyPress,
          placeholder: "Título de la nota",
          className: "note-card-edit-title-input",
        }),
        note.linkedEventId &&
          React.createElement(
            "div",
            { key: "current-link", className: "note-card-current-link" },
            [
              React.createElement(
                "span",
                { className: "material-icons current-link-icon", key: "icon" },
                "event"
              ),
              React.createElement(
                "span",
                { key: "text" },
                `Vinculada a: ${note.linkedEventTitle}`
              ),
            ]
          ),
        RichTextEditor
          ? React.createElement(RichTextEditor, {
              key: "content-rich-editor",
              value: editContent,
              onChange: handleContentChange,
              placeholder: "Edita el contenido de tu nota...",
              height: "180px",
              toolbar: "full",
              className: "note-rich-editor-edit", // Mantener clase específica
            })
          : React.createElement("textarea", {
              key: "content-textarea-fallback",
              value: editContent,
              onChange: (e) => setEditContent(e.target.value),
              onKeyDown: handleKeyPress,
              placeholder: "Contenido de la nota...",
              rows: 6,
              className: "note-card-edit-textarea-fallback",
            }),
        React.createElement(
          "div",
          { key: "actions", className: "note-card-edit-actions" },
          [
            React.createElement(
              "button",
              {
                key: "link-event",
                onClick: () => setShowEventSelector(true),
                className: "note-card-edit-button-link",
              },
              [
                React.createElement(
                  "span",
                  { key: "link-icon", className: "material-icons" },
                  "link"
                ),
                React.createElement(
                  "span",
                  { key: "link-text" },
                  note.linkedEventId ? "Cambiar evento" : "Vincular evento"
                ),
              ]
            ),
            React.createElement(
              "div",
              {
                key: "save-cancel-group",
                className: "note-card-edit-save-cancel-group",
              },
              [
                React.createElement(
                  "button",
                  {
                    key: "cancel",
                    onClick: onCancel,
                    className: "note-card-edit-button-cancel",
                  },
                  [
                    React.createElement(
                      "span",
                      { key: "close-icon", className: "material-icons" },
                      "close"
                    ),
                    React.createElement(
                      "span",
                      { key: "close-text" },
                      "Cancelar"
                    ),
                  ]
                ),
                React.createElement(
                  "button",
                  {
                    key: "save",
                    onClick: handleSave,
                    disabled: !editTitle.trim(),
                    className: "note-card-edit-button-save",
                  },
                  [
                    React.createElement(
                      "span",
                      { key: "save-icon", className: "material-icons" },
                      "save"
                    ),
                    React.createElement(
                      "span",
                      { key: "save-text" },
                      "Guardar"
                    ),
                  ]
                ),
              ]
            ),
          ]
        ),
        React.createElement(
          "div",
          { key: "help", className: "note-card-edit-help-text" },
          RichTextEditor
            ? "Usa la barra de herramientas para dar formato • Ctrl+Enter para guardar • Esc para cancelar"
            : "Ctrl+Enter para guardar • Esc para cancelar"
        ),
        showEventSelector &&
          React.createElement(EventSelector, {
            key: "event-selector",
            onSelect: handleEventSelect,
            onCancel: () => setShowEventSelector(false),
            currentEventId: note.linkedEventId,
            core: core,
          }),
      ]
    );
  }

  return React.createElement(
    "div",
    {
      id: id,
      className: `note-card ${isSelected ? "selected" : ""} ${
        isHovered ? "hovered" : ""
      }`, // Añadir clase 'hovered'
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
      tabIndex: 0, // Para accesibilidad
    },
    [
      React.createElement(
        "div",
        { key: "actions", className: "note-actions" }, // Opacidad controlada por CSS con .note-card.hovered
        [
          React.createElement(
            "button",
            {
              key: "edit",
              onClick: (e) => {
                e.stopPropagation();
                onEdit();
              },
              title: "Editar nota",
              className: "note-action-button edit",
            },
            React.createElement("span", { className: "material-icons" }, "edit")
          ),
          React.createElement(
            "button",
            {
              key: "delete",
              onClick: (e) => {
                e.stopPropagation();
                onDelete();
              },
              title: "Eliminar nota",
              className: "note-action-button delete",
            },
            React.createElement(
              "span",
              { className: "material-icons" },
              "delete"
            )
          ),
        ]
      ),
      React.createElement(
        "div",
        { key: "title-section", className: "note-card-title-section" },
        React.createElement(
          "h3",
          { key: "title", className: "note-card-title" },
          note.title
        )
      ),
      React.createElement(
        "div",
        { key: "content-container", className: "note-card-content-container" },
        RichTextViewer && note.content && isHtmlContent(note.content)
          ? React.createElement(RichTextViewer, {
              content: note.content,
              maxHeight: "150px",
              className: "note-content-viewer",
              sanitize: true,
            })
          : React.createElement(
              "p",
              { className: "note-card-content-fallback" },
              getTextPreview(note.content)
            )
      ),
      React.createElement(
        "div",
        { key: "metadata", className: "note-card-metadata" },
        [
          React.createElement(
            "div",
            { key: "dates", className: "note-card-dates" },
            [
              React.createElement(
                "span",
                { key: "created" },
                "📅 " + formatDate(note.createdAt)
              ),
              note.modifiedAt !== note.createdAt &&
                React.createElement(
                  "span",
                  { key: "modified", className: "note-card-modified-date" },
                  "✏️ " + formatDate(note.modifiedAt)
                ),
            ]
          ),
          note.linkedEventId &&
            React.createElement(
              "span",
              {
                key: "event-indicator",
                className: "material-icons note-card-event-indicator",
                title: `Vinculada a: ${note.linkedEventTitle}`,
              },
              "event"
            ),
        ]
      ),
    ]
  );
}

export default NoteCard;
