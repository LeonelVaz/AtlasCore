// src/components/settings/calendar-config.jsx
import React, { useState, useEffect } from "react";
import { STORAGE_KEYS } from "../../core/config/constants";
import storageService from "../../services/storage-service";
import eventBus from "../../core/bus/event-bus";

/**
 * Componente para configuración general del calendario
 */
const CalendarConfig = () => {
  // Estado para el número máximo de eventos simultáneos
  const [maxEvents, setMaxEvents] = useState(3);
  const [loading, setLoading] = useState(true);

  // Cargar configuración al iniciar
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedMaxEvents = await storageService.get(
          STORAGE_KEYS.MAX_SIMULTANEOUS_EVENTS,
          3
        );

        // Validar el rango (1-10)
        setMaxEvents(Math.min(10, Math.max(1, parseInt(savedMaxEvents) || 3)));
        setLoading(false);
      } catch (error) {
        console.error("Error al cargar configuración del calendario:", error);
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Guardar cambios cuando se actualiza el valor
  useEffect(() => {
    if (!loading) {
      // Guardar en almacenamiento
      storageService.set(STORAGE_KEYS.MAX_SIMULTANEOUS_EVENTS, maxEvents);

      // Emitir evento para que otros componentes se actualicen
      eventBus.publish("calendar.maxSimultaneousEventsChanged", {
        value: maxEvents,
      });

      console.log(
        "Configuración actualizada: maxSimultaneousEvents =",
        maxEvents
      );
    }
  }, [maxEvents, loading]);

  // Manejar cambio en el número máximo de eventos
  const handleMaxEventsChange = (e) => {
    const value = parseInt(e.target.value, 10);

    // Validar el rango (1-10)
    if (!isNaN(value) && value >= 1 && value <= 10) {
      setMaxEvents(value);
    }
  };

  return (
    <div className="calendar-config">
      <h3 className="settings-section-title">Configuración del Calendario</h3>
      <p className="settings-section-description">
        Ajusta las preferencias generales del calendario.
      </p>

      <div className="settings-section">
        <h4>Eventos Simultáneos</h4>
        <p>
          Define cuántos eventos pueden ocupar el mismo espacio temporal antes
          de que se rechacen nuevos eventos en esa franja.
        </p>

        <div className="max-events-setting">
          <label htmlFor="max-simultaneous-events">
            Número máximo de eventos simultáneos (1-10):
          </label>
          <div className="max-events-control">
            <input
              id="max-simultaneous-events"
              type="range"
              min="1"
              max="10"
              value={maxEvents}
              onChange={handleMaxEventsChange}
              className="max-events-slider"
            />
            <span className="max-events-value">{maxEvents}</span>
          </div>
          <p className="max-events-info">
            Al alcanzar este límite, los nuevos eventos que se solapen
            completamente con los existentes serán rechazados.
          </p>
        </div>
      </div>

      <div className="settings-divider"></div>

      <div className="settings-section">
        <h4>Otras configuraciones</h4>
        <p>Se añadirán en futuras actualizaciones.</p>
      </div>
    </div>
  );
};

export default CalendarConfig;
