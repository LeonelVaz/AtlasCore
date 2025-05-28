import { useState } from "react";
import { formatDateForInput } from "../utils/date-utils";

function useEventForm(
  createEvent,
  updateEvent,
  deleteEvent,
  allEvents = [],
  maxSimultaneousEvents = 3
) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [newEvent, setNewEvent] = useState({
    id: "",
    title: "",
    start: "",
    end: "",
    color: "#2d4b94",
  });

  // Verificar límite de eventos simultáneos
  const wouldExceedLimit = (eventToCheck) => {
    if (!eventToCheck?.start || !eventToCheck?.end) return false;

    const start = new Date(eventToCheck.start);
    const end = new Date(eventToCheck.end);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;

    // Filtrar eventos solapados excluyendo el evento actual
    const overlappingEvents = allEvents.filter((existing) => {
      if (selectedEvent && existing.id === selectedEvent.id) return false;

      const existingStart = new Date(existing.start);
      const existingEnd = new Date(existing.end);

      if (isNaN(existingStart.getTime()) || isNaN(existingEnd.getTime()))
        return false;

      return start < existingEnd && existingStart < end;
    });

    return overlappingEvents.length >= maxSimultaneousEvents;
  };

  // Manejar clic en celda para crear evento
  const handleCellClick = (day, hour, minutes = 0, slotDuration = 60) => {
    try {
      let startDate;

      if (
        day instanceof Date &&
        (day.getHours() !== 0 || day.getMinutes() !== 0)
      ) {
        startDate = new Date(day);
      } else {
        startDate = new Date(day);
        startDate.setHours(hour, minutes, 0, 0);
      }

      // Calcular fecha de fin
      const endDate = new Date(startDate);
      const durationInMinutes = slotDuration || 60;
      const startMinutes = startDate.getMinutes();
      const endMinutes = (startMinutes + durationInMinutes) % 60;
      const hoursToAdd = Math.floor((startMinutes + durationInMinutes) / 60);

      endDate.setHours(startDate.getHours() + hoursToAdd, endMinutes, 0, 0);

      setSelectedEvent(null);
      setFormError("");

      setNewEvent({
        id: "",
        title: "Nuevo evento",
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        startFormatted: formatDateForInput(startDate),
        endFormatted: formatDateForInput(endDate),
        color: "#2d4b94",
      });

      setShowEventForm(true);
    } catch (error) {
      console.error("Error al manejar clic en celda:", error);
    }
  };

  // Manejar clic en evento existente
  const handleEventClick = (event) => {
    try {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return;

      setSelectedEvent({ ...event });
      setFormError("");

      setNewEvent({
        id: event.id,
        title: event.title || "",
        start: event.start,
        end: event.end,
        color: event.color || "#2d4b94",
        startFormatted: formatDateForInput(startDate),
        endFormatted: formatDateForInput(endDate),
      });

      setShowEventForm(true);
    } catch (error) {
      console.error("Error al manejar clic en evento:", error);
    }
  };

  // Actualizar datos del formulario
  const handleEventFormChange = (e) => {
    try {
      const { name, value } = e.target;

      if (name === "start" || name === "end") {
        const date = new Date(value);

        if (isNaN(date.getTime())) return;

        setNewEvent((prev) => ({
          ...prev,
          [name]: date.toISOString(),
          [`${name}Formatted`]: value,
        }));
      } else {
        setNewEvent((prev) => ({ ...prev, [name]: value }));
      }
    } catch (error) {
      console.error("Error al manejar cambio en formulario:", error);
    }
  };

  // Cerrar y reiniciar formulario
  const handleCloseForm = () => {
    setShowEventForm(false);
    setSelectedEvent(null);
    setFormError("");
    setNewEvent({
      id: "",
      title: "",
      start: "",
      end: "",
      startFormatted: "",
      endFormatted: "",
      color: "#2d4b94",
    });
  };

  // Guardar evento
  const handleSaveEvent = () => {
    try {
      setFormError("");

      // Validar título
      if (!newEvent.title.trim()) {
        setFormError("El título del evento no puede estar vacío");
        return;
      }

      // Validar fechas
      const startDate = new Date(newEvent.start);
      const endDate = new Date(newEvent.end);

      if (endDate < startDate) {
        setFormError(
          "La hora de fin no puede ser anterior a la hora de inicio"
        );
        return;
      }

      const eventToSave = {
        id: newEvent.id || Date.now().toString(),
        title: newEvent.title.trim(),
        start: newEvent.start,
        end: newEvent.end,
        color: newEvent.color || "#2d4b94",
      };

      // Verificar límite de eventos simultáneos
      if (wouldExceedLimit(eventToSave)) {
        setFormError(
          `No se puede crear el evento: excedería el límite de ${maxSimultaneousEvents} eventos simultáneos`
        );
        return;
      }

      if (selectedEvent && selectedEvent.id) {
        // Actualizar existente
        updateEvent(selectedEvent.id, eventToSave);
      } else {
        // Crear nuevo
        createEvent(eventToSave);
      }

      handleCloseForm();
    } catch (error) {
      console.error("Error al guardar evento:", error);
      setFormError("Ocurrió un error al guardar el evento");
    }
  };

  // Eliminar evento
  const handleDeleteEvent = () => {
    try {
      if (selectedEvent) {
        deleteEvent(selectedEvent.id);
        handleCloseForm();
      }
    } catch (error) {
      console.error("Error al eliminar evento:", error);
    }
  };

  return {
    selectedEvent,
    showEventForm,
    formError,
    newEvent,
    handleEventClick,
    handleCellClick,
    handleEventFormChange,
    handleCloseForm,
    handleSaveEvent,
    handleDeleteEvent,
  };
}

export default useEventForm;
