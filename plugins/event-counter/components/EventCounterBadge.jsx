import React from "react";

function EventCounterBadge(props) {
  const [eventCount, setEventCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [badgeColor, setBadgeColor] = React.useState("#4f46e5");

  // Función para calcular eventos del día y determinar color
  const updateEventCountAndColor = React.useCallback(() => {
    try {
      // Obtener el módulo de calendario
      const calendar = props.core.getModule("calendar");
      if (!calendar) {
        setEventCount(0);
        setIsLoading(false);
        return;
      }

      // Obtener eventos para esta fecha específica
      const eventsForDay = calendar.getEventsForDate(props.date);
      const count = eventsForDay ? eventsForDay.length : 0;

      // Determinar color usando la API del plugin
      const color = props.plugin.publicAPI.getColorForEventCount(count);

      setEventCount(count);
      setBadgeColor(color || "#4f46e5"); // Fallback al color por defecto
      setIsLoading(false);

      console.log(
        `[EventCounterBadge] ${props.date.toDateString()}: ${count} eventos, color: ${color}`
      );
    } catch (error) {
      console.error("[EventCounterBadge] Error al calcular eventos:", error);
      setEventCount(0);
      setBadgeColor("#4f46e5");
      setIsLoading(false);
    }
  }, [props.date, props.core, props.plugin]);

  // Función para formatear el número mostrado
  const formatCount = React.useCallback((count) => {
    if (count > 99) return "99+";
    return count.toString();
  }, []);

  // Función para generar el título del tooltip
  const getTooltipText = React.useCallback((count) => {
    if (count === 0) return "Sin eventos";
    if (count === 1) return "1 evento este día";
    if (count <= 99) return `${count} eventos este día`;
    return "Más de 99 eventos este día";
  }, []);

  // Función para calcular color de texto con buen contraste
  const getTextColor = React.useCallback((backgroundColor) => {
    // Convertir hex a RGB
    const hex = backgroundColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calcular luminancia
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Retornar blanco para colores oscuros, negro para colores claros
    return luminance > 0.5 ? "#000000" : "#ffffff";
  }, []);

  // Efecto para calcular eventos inicialmente y suscribirse a actualizaciones
  React.useEffect(() => {
    // Calcular eventos inicialmente
    updateEventCountAndColor();

    // Suscribirse a actualizaciones del contador
    const unsubUpdate = props.core.events.subscribe(
      "event-counter-badge",
      "contadorEventos.actualizar",
      updateEventCountAndColor
    );

    // Suscribirse a cambios de configuración
    const unsubConfig = props.core.events.subscribe(
      "event-counter-badge",
      "contadorEventos.configChanged",
      updateEventCountAndColor
    );

    // Cleanup: cancelar suscripciones
    return () => {
      if (typeof unsubUpdate === "function") {
        unsubUpdate();
      }
      if (typeof unsubConfig === "function") {
        unsubConfig();
      }
    };
  }, [updateEventCountAndColor, props.core]);

  // Si está cargando, no mostrar nada
  if (isLoading) {
    return null;
  }

  // Si no hay eventos, no mostrar contador
  if (eventCount === 0) {
    return null;
  }

  // Usar una sola clase CSS base
  const badgeClass = "event-counter-badge";

  // Calcular color de texto para buen contraste
  const textColor = getTextColor(badgeColor);

  // Generar props para el elemento con estilos dinámicos
  const badgeProps = {
    className: badgeClass,
    title: getTooltipText(eventCount),
    "data-count": formatCount(eventCount),
    "aria-label": getTooltipText(eventCount),
    role: "status",
    style: {
      backgroundColor: badgeColor,
      color: textColor,
      // Añadir una sombra sutil que combine con el color
      boxShadow: `0 2px 4px ${badgeColor}20, 0 1px 2px ${badgeColor}40`,
    },
  };

  // Mostrar el contador de eventos
  return React.createElement("span", badgeProps, formatCount(eventCount));
}

export default EventCounterBadge;
