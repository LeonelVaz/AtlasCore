import React from "react";
import CreateNoteForm from "./CreateNoteForm.jsx"; // Asumiendo que CreateNoteForm está en el mismo directorio

function EventNotesExtension(props) {
  const { event, plugin, core } = props;
  const [notes, setNotes] = React.useState([]);
  const [collapsed, setCollapsed] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [showCreateForm, setShowCreateForm] = React.useState(false);

  const refreshNotes = React.useCallback(() => {
    if (plugin && event && event.id) {
      const eventNotes = plugin.getNotesForEvent(event.id);
      setNotes(eventNotes);
    }
  }, [plugin, event]); // Asegúrate de que event es estable o usa event.id

  React.useEffect(() => {
    refreshNotes();
  }, [refreshNotes]);

  React.useEffect(() => {
    if (!core || !plugin) return;

    const handleNotesChanged = () => {
      setIsRefreshing(true);
      refreshNotes();
      setTimeout(() => setIsRefreshing(false), 300);
    };

    const unsubCreate = core.events.subscribe(
      plugin.id,
      "noteCreated",
      handleNotesChanged
    );
    const unsubUpdate = core.events.subscribe(
      plugin.id,
      "noteUpdated",
      handleNotesChanged
    );
    const unsubDelete = core.events.subscribe(
      plugin.id,
      "noteDeleted",
      handleNotesChanged
    );

    return () => {
      if (typeof unsubCreate === "function") unsubCreate();
      if (typeof unsubUpdate === "function") unsubUpdate();
      if (typeof unsubDelete === "function") unsubDelete();
    };
  }, [core, plugin, refreshNotes]);

  const handleNoteClick = (noteId) => {
    const params = { selectedNoteId: noteId };
    if (core.navigation && core.navigation.navigateToPlugin) {
      core.navigation.navigateToPlugin(plugin.id, "notes", params);
    } else if (core.ui && core.ui.navigateToPlugin) {
      core.ui.navigateToPlugin(plugin.id, "notes", params);
    } else if (props.onNavigate) {
      props.onNavigate(plugin.id, "notes", params);
    } else {
      console.warn("[Notas Simples] No se pudo navegar a la nota");
    }
  };

  const handleCreateNote = () => {
    setShowCreateForm(true);
  };

  const handleSaveNote = async (title, content) => {
    try {
      await plugin.createNote(title, content, event.id, event.title);
      setShowCreateForm(false);
      setTimeout(refreshNotes, 100);
      if (core?.notifications?.show) {
        core.notifications.show({
          type: "success",
          message: "Nota creada exitosamente",
          duration: 2000,
          position: "bottom-right",
        });
      } else if (core?.toast?.success) {
        core.toast.success("Nota creada exitosamente");
      }
    } catch (error) {
      console.error("[Notas Simples] Error al crear la nota:", error);
      if (core?.notifications?.show) {
        core.notifications.show({
          type: "error",
          message: "Error al crear la nota",
          duration: 3000,
          position: "bottom-right",
        });
      } else if (core?.toast?.error) {
        core.toast.error("Error al crear la nota");
      }
    }
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTextPreview = (content) => {
    if (!content) return "Sin contenido";
    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = content;
      const text = tempDiv.textContent || tempDiv.innerText || "";
      return text.length > 100
        ? text.substring(0, 100) + "..."
        : text || "Sin contenido";
    } catch (error) {
      return content.substring(0, 100) + "..." || "Sin contenido";
    }
  };

  return React.createElement(React.Fragment, null, [
    React.createElement(
      "div",
      {
        key: "notes-section",
        className: `event-notes-section ${isRefreshing ? "refreshing" : ""} ${
          collapsed ? "collapsed" : ""
        }`,
      },
      [
        React.createElement(
          "div",
          {
            key: "header",
            className: "event-notes-header",
          },
          [
            React.createElement(
              "div",
              {
                key: "title-container",
                className: "event-notes-title-container",
                onClick: () => setCollapsed(!collapsed),
              },
              [
                React.createElement(
                  "span",
                  { className: "material-icons event-notes-icon", key: "icon" },
                  "note"
                ),
                React.createElement(
                  "h4",
                  { key: "text", className: "event-notes-title-text" },
                  `Notas (${notes.length})`
                ),
                React.createElement(
                  "span",
                  {
                    key: "chevron",
                    className: "material-icons event-notes-chevron",
                  },
                  "expand_more"
                ),
              ]
            ),
            React.createElement(
              "button",
              {
                key: "create-note-btn",
                onClick: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCreateNote();
                },
                className: "event-notes-create-btn",
              },
              [
                React.createElement(
                  "span",
                  { className: "material-icons", key: "icon" },
                  "add"
                ),
                React.createElement("span", { key: "text" }, "Crear Nota"),
              ]
            ),
          ]
        ),
        !collapsed &&
          React.createElement(
            "div",
            {
              key: "notes-list",
              className: "event-notes-list",
            },
            notes.length === 0
              ? React.createElement(
                  "div",
                  { className: "event-notes-empty" },
                  "No hay notas para este evento. ¡Crea la primera!"
                )
              : notes.map((note) =>
                  React.createElement(
                    "div",
                    {
                      key: note.id,
                      className: "event-note-item",
                      onClick: () => handleNoteClick(note.id),
                      tabIndex: 0, // Para accesibilidad con teclado
                    },
                    [
                      React.createElement(
                        "div",
                        {
                          key: "note-title",
                          className: "event-note-item-title",
                        },
                        note.title
                      ),
                      React.createElement(
                        "div",
                        {
                          key: "note-preview",
                          className: "event-note-item-preview",
                        },
                        getTextPreview(note.content)
                      ),
                      React.createElement(
                        "div",
                        { key: "note-date", className: "event-note-item-date" },
                        formatDate(note.createdAt)
                      ),
                    ]
                  )
                )
          ),
      ]
    ),
    showCreateForm &&
      React.createElement(
        "div",
        {
          key: "create-form-overlay",
          className: "event-notes-form-overlay",
          onClick: handleCancelCreate,
        },
        React.createElement(
          "div",
          {
            className: "event-notes-form-modal",
            onClick: (e) => e.stopPropagation(),
          },
          React.createElement(CreateNoteForm, {
            onSave: handleSaveNote,
            onCancel: handleCancelCreate,
            core: core,
            fromEvent: event,
          })
        )
      ),
  ]);
}

export default EventNotesExtension;
