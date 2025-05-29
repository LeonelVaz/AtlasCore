import React from "react";

function EventSelector(props) {
  const { onSelect, onCancel, currentEventId, core } = props;
  const [events, setEvents] = React.useState([]);
  const [filteredEvents, setFilteredEvents] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  // const [selectedDate, setSelectedDate] = React.useState(null); // No usado, eliminar si no se planea

  React.useEffect(() => {
    const calendar = core.getModule("calendar");
    if (calendar) {
      const allEvents = calendar.getEvents();
      const sortedEvents = allEvents.sort(
        (a, b) => new Date(a.start) - new Date(b.start)
      );
      setEvents(sortedEvents);
      setFilteredEvents(sortedEvents); // Inicialmente mostrar todos
    }
  }, [core]);

  React.useEffect(() => {
    let currentFiltered = events;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      currentFiltered = currentFiltered.filter((event) =>
        event.title.toLowerCase().includes(query)
      );
    }
    // Filtrado por selectedDate eliminado ya que no se usa
    setFilteredEvents(currentFiltered);
  }, [searchQuery, events]);

  const formatEventDate = (event) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const dateOptions = { day: "numeric", month: "short" };
    const timeOptions = { hour: "2-digit", minute: "2-digit" };
    const dateStr = start.toLocaleDateString("es-ES", dateOptions);
    const startTime = start.toLocaleTimeString("es-ES", timeOptions);
    const endTime = end.toLocaleTimeString("es-ES", timeOptions);
    return `${dateStr} • ${startTime} - ${endTime}`;
  };

  const eventsByMonth = React.useMemo(() => {
    const grouped = {};
    filteredEvents.forEach((event) => {
      const date = new Date(event.start);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const monthName = date.toLocaleDateString("es-ES", {
        month: "long",
        year: "numeric",
      });
      if (!grouped[monthKey]) {
        grouped[monthKey] = { name: monthName, events: [] };
      }
      grouped[monthKey].events.push(event);
    });
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredEvents]);

  return React.createElement(
    "div",
    {
      className: "event-selector-modal",
      onClick: onCancel,
    },
    React.createElement(
      "div",
      {
        className: "event-selector-content",
        onClick: (e) => e.stopPropagation(),
      },
      [
        React.createElement(
          "div",
          { key: "header", className: "event-selector-header" },
          [
            React.createElement(
              "h3",
              { key: "title", className: "event-selector-title" },
              [
                React.createElement(
                  "span",
                  { className: "material-icons", key: "icon" },
                  "event"
                ),
                React.createElement(
                  "span",
                  { key: "text" },
                  "Seleccionar Evento"
                ),
              ]
            ),
            React.createElement(
              "div",
              { key: "search", className: "event-selector-search-container" },
              [
                React.createElement("input", {
                  key: "search-input",
                  type: "text",
                  value: searchQuery,
                  onChange: (e) => setSearchQuery(e.target.value),
                  placeholder: "Buscar eventos...",
                  className: "event-selector-search-input",
                }),
                React.createElement(
                  "span",
                  {
                    className: "material-icons event-selector-search-icon",
                    key: "search-icon",
                  },
                  "search"
                ),
              ]
            ),
          ]
        ),
        React.createElement(
          "div",
          {
            key: "events-list-container",
            className: "event-selector-list-container",
          },
          eventsByMonth.length === 0
            ? React.createElement(
                "div",
                { className: "event-selector-no-results" },
                "No se encontraron eventos"
              )
            : eventsByMonth.map(([monthKey, monthData]) =>
                React.createElement(
                  "div",
                  { key: monthKey, className: "event-selector-month-group" },
                  [
                    React.createElement(
                      "h4",
                      {
                        key: "month-header",
                        className: "event-selector-month-header",
                      },
                      monthData.name
                    ),
                    React.createElement(
                      "div",
                      {
                        key: "month-events",
                        className: "event-selector-month-events-list",
                      },
                      monthData.events.map((event) =>
                        React.createElement(
                          "div",
                          {
                            key: event.id,
                            className: `event-selector-item ${
                              event.id === currentEventId ? "selected" : ""
                            }`,
                            onClick: () => onSelect(event),
                            tabIndex: 0, // Para accesibilidad
                          },
                          [
                            React.createElement(
                              "div",
                              {
                                key: "event-content",
                                className: "event-selector-item-content",
                              },
                              [
                                React.createElement("div", {
                                  key: "color-indicator",
                                  className: "event-color-indicator",
                                  style: {
                                    backgroundColor:
                                      event.color || "var(--primary-color)",
                                  },
                                }),
                                React.createElement(
                                  "div",
                                  {
                                    key: "event-details",
                                    className: "event-selector-item-details",
                                  },
                                  [
                                    React.createElement(
                                      "div",
                                      {
                                        key: "event-title",
                                        className: "event-selector-item-title",
                                      },
                                      event.title
                                    ),
                                    React.createElement(
                                      "div",
                                      {
                                        key: "event-date",
                                        className: "event-selector-item-date",
                                      },
                                      formatEventDate(event)
                                    ),
                                  ]
                                ),
                                event.id === currentEventId &&
                                  React.createElement(
                                    "span",
                                    {
                                      key: "check-icon",
                                      className:
                                        "material-icons event-selector-item-check",
                                    },
                                    "check_circle"
                                  ),
                              ]
                            ),
                          ]
                        )
                      )
                    ),
                  ]
                )
              )
        ),
        React.createElement(
          "div",
          { key: "footer", className: "event-selector-footer" },
          [
            React.createElement(
              "button",
              {
                key: "cancel",
                onClick: onCancel,
                className: "event-selector-button-cancel",
              },
              "Cancelar"
            ),
            currentEventId &&
              React.createElement(
                "button",
                {
                  key: "unlink",
                  onClick: () => onSelect(null),
                  className: "event-selector-button-unlink",
                },
                "Desvincular"
              ),
          ]
        ),
      ]
    )
  );
}

export default EventSelector;
