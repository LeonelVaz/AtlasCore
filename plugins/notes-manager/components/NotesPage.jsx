import React from "react";
import NoteCard from "./NoteCard.jsx";
import CreateNoteForm from "./CreateNoteForm.jsx";

function NotesPage(props) {
  const { plugin, core } = props;
  const [notes, setNotes] = React.useState([]);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [editingNote, setEditingNote] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filteredNotes, setFilteredNotes] = React.useState([]);
  const [selectedNoteId, setSelectedNoteId] = React.useState(null);
  const [createFromEvent, setCreateFromEvent] = React.useState(null);

  React.useEffect(() => {
    if (props.navigationParams) {
      if (
        props.navigationParams.action === "create" &&
        props.navigationParams.fromEvent
      ) {
        setCreateFromEvent(props.navigationParams.fromEvent);
        setShowCreateForm(true);
      }
      if (props.navigationParams.selectedNoteId) {
        setSelectedNoteId(props.navigationParams.selectedNoteId);
        setTimeout(() => {
          const noteElement = document.getElementById(
            `note-${props.navigationParams.selectedNoteId}`
          );
          if (noteElement) {
            noteElement.scrollIntoView({ behavior: "smooth", block: "center" });
            // Efecto visual, podría ser una clase CSS en lugar de style
            noteElement.classList.add("note-highlight-effect");
            setTimeout(() => {
              noteElement.classList.remove("note-highlight-effect");
            }, 1500);
          }
        }, 100);
      }
    }
  }, [props.navigationParams]);

  React.useEffect(() => {
    if (plugin) {
      const currentNotes = plugin.getNotes();
      setNotes(currentNotes);
      setFilteredNotes(currentNotes); // Inicialmente mostrar todas las notas
    }
  }, [plugin]);

  React.useEffect(() => {
    if (plugin) {
      // Asegurarse que plugin está definido
      if (searchQuery.trim()) {
        const results = plugin.searchNotes(searchQuery);
        setFilteredNotes(results);
      } else {
        setFilteredNotes(notes); // Usar el estado 'notes' que ya está cargado
      }
    }
  }, [searchQuery, notes, plugin]);

  React.useEffect(() => {
    if (!core || !plugin) return;
    const handleCreateFromEvent = (data) => {
      if (data && data.fromEvent) {
        setCreateFromEvent(data.fromEvent);
        setShowCreateForm(true);
      }
    };
    const unsub = core.events.subscribe(
      plugin.id,
      "createNoteFromEvent",
      handleCreateFromEvent
    );
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [core, plugin]);

  const handleCreateNote = (
    title,
    content,
    linkedEventId,
    linkedEventTitle
  ) => {
    if (plugin) {
      plugin.createNote(title, content, linkedEventId, linkedEventTitle);
      const updatedNotes = plugin.getNotes();
      setNotes(updatedNotes);
      // setFilteredNotes(updatedNotes); // No es necesario, useEffect [notes] lo hará
      setShowCreateForm(false);
      setCreateFromEvent(null);
      if (core?.dialogs?.alert)
        core.dialogs.alert(plugin.id, "✅ Nota creada exitosamente", "Éxito");
    }
  };

  const handleUpdateNote = (noteId, updates) => {
    if (plugin) {
      plugin.updateNote(noteId, updates);
      const updatedNotes = plugin.getNotes();
      setNotes(updatedNotes);
      // setFilteredNotes(updatedNotes);
      setEditingNote(null);
      if (core?.dialogs?.alert)
        core.dialogs.alert(
          plugin.id,
          "✅ Nota actualizada exitosamente",
          "Éxito"
        );
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!plugin) return;
    let confirmed = core?.dialogs?.confirm
      ? await core.dialogs.confirm(
          plugin.id,
          "¿Estás seguro de que quieres eliminar esta nota? Esta acción no se puede deshacer.",
          "Confirmar eliminación"
        )
      : window.confirm("¿Estás seguro de que quieres eliminar esta nota?");
    if (confirmed) {
      plugin.deleteNote(noteId);
      const updatedNotes = plugin.getNotes();
      setNotes(updatedNotes);
      // setFilteredNotes(updatedNotes);
      if (core?.dialogs?.alert)
        core.dialogs.alert(
          plugin.id,
          "🗑️ Nota eliminada exitosamente",
          "Eliminada"
        );
    }
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setShowCreateForm(false);
    setCreateFromEvent(null);
  };

  const stats = plugin
    ? plugin.getNotesStats()
    : { total: 0, withRichContent: 0, linkedToEvents: 0, createdToday: 0 };
  const hasRichText = !!core?.ui?.components?.RichTextEditor;

  return React.createElement("div", { className: "notes-page" }, [
    React.createElement("div", { key: "header", className: "notes-header" }, [
      React.createElement(
        "div",
        { key: "title-section", className: "notes-header-title-section" },
        [
          React.createElement(
            "h1",
            { key: "title", className: "notes-header-title" },
            [
              React.createElement(
                "span",
                {
                  key: "title-icon",
                  className: "material-icons notes-header-icon",
                },
                "note"
              ),
              React.createElement("span", { key: "title-text" }, "My Notes"),
            ]
          ),
          React.createElement(
            "div",
            { key: "stats", className: "notes-header-stats" },
            [
              React.createElement(
                "span",
                { key: "total" },
                `📝 ${stats.total} nota${stats.total !== 1 ? "s" : ""}`
              ),
              hasRichText &&
                React.createElement(
                  "span",
                  { key: "rich" },
                  `🎨 ${stats.withRichContent} con formato`
                ),
              stats.linkedToEvents > 0 &&
                React.createElement(
                  "span",
                  { key: "linked" },
                  `📅 ${stats.linkedToEvents} vinculadas a eventos`
                ),
              stats.createdToday > 0 &&
                React.createElement(
                  "span",
                  { key: "today" },
                  `✨ ${stats.createdToday} creadas hoy`
                ),
            ].filter(Boolean)
          ),
        ]
      ),
      React.createElement(
        "div",
        { key: "actions", className: "notes-header-actions" },
        [
          React.createElement(
            "button",
            {
              key: "create-button",
              className: "create-note-button",
              onClick: () => {
                setShowCreateForm(!showCreateForm);
                setCreateFromEvent(null);
              },
            },
            [
              React.createElement(
                "span",
                { className: "material-icons", key: "button-icon" },
                showCreateForm ? "close" : "add"
              ),
              React.createElement(
                "span",
                { key: "button-text" },
                showCreateForm ? "Cancelar" : "Nueva Nota"
              ),
            ]
          ),
          notes.length > 3 &&
            React.createElement(
              "div",
              { key: "search-container", className: "notes-search-container" }, // Usar clase del CSS
              [
                React.createElement("input", {
                  key: "search-input",
                  type: "text",
                  value: searchQuery,
                  onChange: (e) => setSearchQuery(e.target.value),
                  placeholder: "Buscar en notas...",
                  className: "notes-search-input", // Usar clase del CSS
                }),
                React.createElement(
                  "span",
                  {
                    className: "material-icons notes-search-icon",
                    key: "search-icon",
                  },
                  "search"
                ), // Usar clase del CSS
              ]
            ),
        ]
      ),
    ]),
    hasRichText &&
      React.createElement(
        "div",
        { key: "richtext-info", className: "richtext-info" }, // Usar clase del CSS
        [
          React.createElement(
            "span",
            {
              className: "material-icons richtext-info-icon",
              key: "richtext-icon",
            },
            "palette"
          ),
          React.createElement(
            "span",
            { key: "richtext-text" },
            "Editor de texto enriquecido activado: usa negrita, cursiva, listas y más para dar formato a tus notas"
          ),
        ]
      ),
    showCreateForm &&
      React.createElement(CreateNoteForm, {
        key: "create-form",
        onSave: handleCreateNote,
        onCancel: handleCancelEdit,
        core: core,
        fromEvent: createFromEvent,
      }),
    searchQuery.trim() &&
      React.createElement(
        "div",
        { key: "search-results-info", className: "search-results-info" }, // Usar clase del CSS
        `🔍 Mostrando ${filteredNotes.length} de ${notes.length} notas para "${searchQuery}"`
      ),
    React.createElement(
      "div",
      { key: "notes-grid", className: "notes-grid" }, // marginTop controlado por CSS
      filteredNotes.length === 0
        ? React.createElement(
            "div",
            { key: "empty-state", className: "empty-state" }, // Usar clase del CSS
            [
              React.createElement(
                "span",
                {
                  className: "material-icons empty-state-icon",
                  key: "empty-icon",
                },
                searchQuery.trim() ? "search_off" : "note_add"
              ),
              React.createElement(
                "h3",
                { key: "empty-title", className: "empty-state-title" },
                searchQuery.trim()
                  ? "No se encontraron notas"
                  : "No hay notas todavía"
              ),
              React.createElement(
                "p",
                { key: "empty-message", className: "empty-state-message" },
                searchQuery.trim()
                  ? `No hay notas que coincidan con "${searchQuery}". Intenta con otros términos.`
                  : '¡Crea tu primera nota usando el botón "Nueva Nota"!'
              ),
            ]
          )
        : filteredNotes.map((note) =>
            React.createElement(NoteCard, {
              key: note.id,
              id: `note-${note.id}`,
              note: note,
              isEditing: editingNote === note.id,
              isSelected: selectedNoteId === note.id,
              onEdit: () => setEditingNote(note.id),
              onSave: (updates) => handleUpdateNote(note.id, updates),
              onDelete: () => handleDeleteNote(note.id),
              onCancel: handleCancelEdit,
              core: core,
              plugin: plugin,
            })
          )
    ),
  ]);
}

export default NotesPage;
