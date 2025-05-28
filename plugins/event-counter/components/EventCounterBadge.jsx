import React from "react";

function EventCounterBadge(props) {
  const [eventCount, setEventCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);

  // Función para calcular eventos del día
  const updateEventCount = React.useCallback(() => {
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

      setEventCount(count);
      setIsLoading(false);

      console.log(
        `[EventCounterBadge] ${props.date.toDateString()}: ${count} eventos`
      );
    } catch (error) {
      console.error("[EventCounterBadge] Error al calcular eventos:", error);
      setEventCount(0);
      setIsLoading(false);
    }
  }, [props.date, props.core]);

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

  // Efecto para calcular eventos inicialmente y suscribirse a actualizaciones
  React.useEffect(() => {
    // Calcular eventos inicialmente
    updateEventCount();

    // Suscribirse a actualizaciones del contador
    const unsub = props.core.events.subscribe(
      "event-counter-badge",
      "contadorEventos.actualizar",
      updateEventCount
    );

    // Cleanup: cancelar suscripción
    return () => {
      if (typeof unsub === "function") {
        unsub();
      }
    };
  }, [updateEventCount, props.core]);

  // Si está cargando, no mostrar nada
  if (isLoading) {
    return null;
  }

  // Si no hay eventos, no mostrar contador
  if (eventCount === 0) {
    return null;
  }

  // Usar una sola clase CSS sin variantes
  const badgeClass = "event-counter-badge";

  // Generar props para el elemento
  const badgeProps = {
    className: badgeClass,
    title: getTooltipText(eventCount),
    "data-count": formatCount(eventCount),
    "aria-label": getTooltipText(eventCount),
    role: "status",
  };

  // Mostrar el contador de eventos
  return React.createElement("span", badgeProps, formatCount(eventCount));
}

export default EventCounterBadge;
