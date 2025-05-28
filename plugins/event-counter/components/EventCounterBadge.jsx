import React from "react";

function EventCounterBadge(props) {
  const [eventCount, setEventCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isVisible, setIsVisible] = React.useState(false);

  // Función principal para actualizar datos
  const updateBadgeData = React.useCallback(() => {
    try {
      const calendar = props.core.getModule("calendar");
      if (!calendar) {
        setEventCount(0);
        setIsLoading(false);
        setIsVisible(false);
        return;
      }

      const eventsForDay = calendar.getEventsForDate(props.date);
      const count = eventsForDay ? eventsForDay.length : 0;

      // Verificar si debe mostrarse el badge
      const shouldShow = props.plugin.publicAPI.shouldShowBadge(
        props.date,
        count
      );

      setEventCount(count);
      setIsVisible(shouldShow);
      setIsLoading(false);

      console.log(
        `[EventCounterBadge Pro] ${props.date.toDateString()}: ${count} eventos, visible: ${shouldShow}`
      );
    } catch (error) {
      console.error(
        "[EventCounterBadge Pro] Error al calcular eventos:",
        error
      );
      setEventCount(0);
      setIsVisible(false);
      setIsLoading(false);
    }
  }, [props.date, props.core, props.plugin]);

  // Formatear número mostrado
  const formatCount = React.useCallback((count) => {
    if (count > 999) return "999+";
    if (count > 99) return "99+";
    return count.toString();
  }, []);

  // Generar texto del tooltip
  const getTooltipText = React.useCallback((count) => {
    if (count === 0) return "Sin eventos";
    if (count === 1) return "1 evento este día";
    if (count <= 99) return `${count} eventos este día`;
    if (count <= 999) return `${count} eventos este día`;
    return "Más de 999 eventos este día";
  }, []);

  // Obtener icono según cantidad (opcional)
  const getEventIcon = React.useCallback((count) => {
    if (count === 0) return null;
    if (count === 1) return "●";
    if (count <= 5) return "●●";
    if (count <= 10) return "●●●";
    return "●●●+";
  }, []);

  // Configurar efectos y suscripciones
  React.useEffect(() => {
    updateBadgeData();

    // Suscribirse a eventos de actualización
    const unsubUpdate = props.core.events.subscribe(
      "event-counter-badge-pro",
      "contadorEventos.actualizar",
      updateBadgeData
    );

    const unsubConfig = props.core.events.subscribe(
      "event-counter-badge-pro",
      "contadorEventos.configChanged",
      updateBadgeData
    );

    // Cleanup
    return () => {
      if (typeof unsubUpdate === "function") unsubUpdate();
      if (typeof unsubConfig === "function") unsubConfig();
    };
  }, [updateBadgeData, props.core]);

  // Estados de carga y visibilidad
  if (isLoading) return null;
  if (!isVisible) return null;

  // Obtener clases y estilos dinámicos
  const badgeClasses = props.plugin.publicAPI.getBadgeClasses(eventCount);
  const badgeStyles = props.plugin.publicAPI.getBadgeStyles(eventCount);

  // Props del elemento badge
  const badgeProps = {
    className: badgeClasses,
    title: getTooltipText(eventCount),
    "data-count": formatCount(eventCount),
    "data-original-count": eventCount,
    "aria-label": getTooltipText(eventCount),
    role: "status",
    style: badgeStyles,
  };

  // Obtener configuraciones actuales
  const settings = props.plugin.publicAPI.getSettings();

  // Renderizado condicional según estilo
  if (settings.badgeStyle === "minimal") {
    return React.createElement(
      "span",
      {
        ...badgeProps,
        className: `${badgeClasses} badge-minimal-style`,
      },
      formatCount(eventCount)
    );
  }

  if (settings.badgeStyle === "modern") {
    return React.createElement(
      "div",
      {
        ...badgeProps,
        className: `${badgeClasses} badge-modern-container`,
      },
      [
        React.createElement(
          "span",
          { key: "count", className: "badge-count" },
          formatCount(eventCount)
        ),
        eventCount > 1 &&
          React.createElement(
            "span",
            { key: "indicator", className: "badge-indicator" },
            "+"
          ),
      ]
    );
  }

  if (settings.badgeStyle === "circular") {
    return React.createElement(
      "div",
      {
        ...badgeProps,
        className: `${badgeClasses} badge-circular-container`,
      },
      React.createElement(
        "span",
        { className: "badge-count-text" },
        formatCount(eventCount)
      )
    );
  }

  if (settings.badgeStyle === "square") {
    return React.createElement(
      "div",
      {
        ...badgeProps,
        className: `${badgeClasses} badge-square-container`,
      },
      [
        React.createElement(
          "div",
          { key: "content", className: "badge-square-content" },
          [
            React.createElement(
              "span",
              { key: "number", className: "badge-number" },
              formatCount(eventCount)
            ),
            eventCount > 1 &&
              React.createElement(
                "div",
                { key: "dots", className: "badge-dots" },
                getEventIcon(eventCount)
              ),
          ]
        ),
      ]
    );
  }

  // Badge estilo por defecto (rounded)
  return React.createElement("span", badgeProps, formatCount(eventCount));
}

export default EventCounterBadge;
