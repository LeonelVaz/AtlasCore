import React from "react";

function CreateNoteForm(props) {
  const { onSave, onCancel, core, fromEvent } = props;
  const [title, setTitle] = React.useState(
    fromEvent ? `Notas: ${fromEvent.title}` : ""
  );
  const [content, setContent] = React.useState("");

  const RichTextEditor = core?.ui?.components?.RichTextEditor;

  React.useEffect(() => {
    if (fromEvent && RichTextEditor) {
      const eventDate = new Date(fromEvent.start).toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const eventInfo = `
      <p><strong>Evento:</strong> ${fromEvent.title}</p>
      <p><strong>Fecha:</strong> ${eventDate}</p>
      <hr>
      <p><br></p>
      <p><br></p>
    `;
      setContent(eventInfo);
    }
  }, [fromEvent, RichTextEditor]);

  const handleSave = () => {
    if (title.trim()) {
      let finalContent = content;
      if (fromEvent && !RichTextEditor && !content) {
        const eventDate = new Date(fromEvent.start).toLocaleDateString(
          "es-ES",
          {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }
        );
        finalContent = `Evento: ${fromEvent.title}\nFecha: ${eventDate}\n\n---\n\n`;
      }
      onSave(
        title.trim(),
        finalContent,
        fromEvent ? fromEvent.id : null,
        fromEvent ? fromEvent.title : null
      );
      setTitle("");
      setContent("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      handleSave();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  const handleContentChange = (htmlContent) => {
    setContent(htmlContent);
  };

  return React.createElement(
    "div",
    {
      className: "create-note-form",
    },
    [
      React.createElement(
        "div",
        {
          key: "header",
          className: "create-note-form-header",
        },
        [
          React.createElement(
            "span",
            {
              className: "material-icons create-note-form-header-icon",
              key: "icon",
            },
            "add_circle"
          ),
          React.createElement(
            "h2",
            {
              key: "title",
              className: "create-note-form-header-title",
            },
            fromEvent ? "Nueva Nota desde Evento" : "Nueva Nota"
          ),
        ]
      ),

      fromEvent &&
        React.createElement(
          "div",
          {
            key: "event-info",
            className: "create-note-form-event-info",
          },
          [
            React.createElement(
              "span",
              { className: "material-icons event-info-icon", key: "icon" },
              "event"
            ),
            React.createElement(
              "span",
              { key: "text" },
              `Esta nota se vinculará automáticamente al evento: ${fromEvent.title}`
            ),
          ]
        ),

      React.createElement(
        "div",
        {
          key: "form-fields",
          className: "create-note-form-fields",
        },
        [
          React.createElement("input", {
            key: "title-input",
            type: "text",
            value: title,
            onChange: (e) => setTitle(e.target.value),
            onKeyDown: handleKeyPress,
            placeholder: "Título de la nota *",
            autoFocus: true,
            className: "create-note-form-title-input",
          }),

          RichTextEditor
            ? React.createElement(RichTextEditor, {
                key: "content-rich-editor",
                value: content,
                onChange: handleContentChange,
                placeholder: "Escribe el contenido de tu nota aquí...",
                height: "200px",
                toolbar: "full",
                className: "note-rich-editor", // Mantener clase existente para estilos de RichTextEditor
                initialFocus: !fromEvent,
              })
            : React.createElement("textarea", {
                key: "content-textarea-fallback",
                value: content,
                onChange: (e) => setContent(e.target.value),
                onKeyDown: handleKeyPress,
                placeholder: fromEvent
                  ? "Escribe tus notas sobre el evento aquí..."
                  : "Escribe el contenido de tu nota aquí...",
                rows: 8,
                className: "create-note-form-textarea-fallback",
              }),
        ]
      ),

      React.createElement(
        "div",
        {
          key: "actions",
          className: "create-note-form-actions",
        },
        [
          React.createElement(
            "div",
            {
              key: "help",
              className: "create-note-form-help-text",
            },
            RichTextEditor
              ? "Usa la barra de herramientas para dar formato • Ctrl+Enter para guardar • Esc para cancelar"
              : "Ctrl+Enter para guardar • Esc para cancelar"
          ),

          React.createElement(
            "div",
            {
              key: "buttons",
              className: "create-note-form-buttons",
            },
            [
              React.createElement(
                "button",
                {
                  key: "cancel",
                  onClick: onCancel,
                  className: "create-note-form-button-cancel",
                },
                [
                  React.createElement(
                    "span",
                    {
                      className: "material-icons",
                      key: "cancel-icon",
                    },
                    "close"
                  ),
                  React.createElement(
                    "span",
                    { key: "cancel-text" },
                    "Cancelar"
                  ),
                ]
              ),

              React.createElement(
                "button",
                {
                  key: "save",
                  onClick: handleSave,
                  disabled: !title.trim(),
                  className: "create-note-form-button-save",
                },
                [
                  React.createElement(
                    "span",
                    {
                      className: "material-icons",
                      key: "save-icon",
                    },
                    "save"
                  ),
                  React.createElement(
                    "span",
                    { key: "save-text" },
                    "Crear Nota"
                  ),
                ]
              ),
            ]
          ),
        ]
      ),
    ]
  );
}

export default CreateNoteForm;
