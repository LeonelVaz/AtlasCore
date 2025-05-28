import React from "react";
import EventCounterBadge from "./components/EventCounterBadge.jsx";
import "./styles/event-counter.css";

export default {
  // Metadatos del plugin
  id: "contador-eventos-dia",
  name: "Contador de Eventos por Día",
  version: "1.0.0",
  description:
    "Muestra la cantidad de eventos en el header de cada día del calendario",
  author: "Atlas Plugin Developer",

  // Restricciones de compatibilidad
  minAppVersion: "0.3.0",
  maxAppVersion: "1.0.0",

  // Permisos requeridos
  permissions: ["events", "ui"],

  // Variables internas
  _core: null,
  _subscriptions: [],
  _extensionId: null,

  // Método de inicialización
  init: function (core) {
    const self = this;

    return new Promise(function (resolve) {
      try {
        // Guardar referencia al core
        self._core = core;

        // Registrar la extensión UI para el header de días
        self._registerDayHeaderExtension();

        // Configurar listeners de eventos del calendario
        self._setupEventListeners();

        console.log("[Contador Eventos] Plugin inicializado correctamente");
        resolve(true);
      } catch (error) {
        console.error(
          "[Contador Eventos] Error durante la inicialización:",
          error
        );
        resolve(false);
      }
    });
  },

  // Método de limpieza
  cleanup: function () {
    try {
      // Cancelar todas las suscripciones a eventos
      this._subscriptions.forEach((unsub) => {
        if (typeof unsub === "function") {
          unsub();
        }
      });
      this._subscriptions = [];

      // Remover la extensión UI
      if (this._extensionId && this._core) {
        this._core.ui.removeExtension(this.id, this._extensionId);
      }

      console.log("[Contador Eventos] Limpieza completada");
      return true;
    } catch (error) {
      console.error("[Contador Eventos] Error durante la limpieza:", error);
      return false;
    }
  },

  // Configurar listeners para eventos del calendario
  _setupEventListeners: function () {
    const self = this;

    // Suscribirse a cuando se crea un evento
    const eventCreatedSub = this._core.events.subscribe(
      this.id,
      "calendar.eventCreated",
      function (data) {
        console.log("[Contador Eventos] Evento creado:", data);
        self._triggerUIUpdate();
      }
    );

    // Suscribirse a cuando se actualiza un evento
    const eventUpdatedSub = this._core.events.subscribe(
      this.id,
      "calendar.eventUpdated",
      function (data) {
        console.log("[Contador Eventos] Evento actualizado:", data);
        self._triggerUIUpdate();
      }
    );

    // Suscribirse a cuando se elimina un evento
    const eventDeletedSub = this._core.events.subscribe(
      this.id,
      "calendar.eventDeleted",
      function (data) {
        console.log("[Contador Eventos] Evento eliminado:", data);
        self._triggerUIUpdate();
      }
    );

    // Suscribirse a cuando se cargan los eventos
    const eventsLoadedSub = this._core.events.subscribe(
      this.id,
      "calendar.eventsLoaded",
      function (data) {
        console.log("[Contador Eventos] Eventos cargados:", data);
        self._triggerUIUpdate();
      }
    );

    // Guardar las referencias para poder cancelarlas después
    this._subscriptions.push(
      eventCreatedSub,
      eventUpdatedSub,
      eventDeletedSub,
      eventsLoadedSub
    );
  },

  // Fuerza una actualización de la UI
  _triggerUIUpdate: function () {
    setTimeout(() => {
      this._core.events.publish(this.id, "contadorEventos.actualizar", {
        timestamp: Date.now(),
      });
    }, 50);
  },

  // Patrón Wrapper para inyección de dependencias
  _createComponentWrapper: function (Component, extraProps = {}) {
    const self = this;

    return function ComponentWrapper(propsFromAtlas) {
      return React.createElement(Component, {
        ...propsFromAtlas,
        plugin: self,
        core: self._core,
        pluginId: self.id,
        ...extraProps,
      });
    };
  },

  // Registrar la extensión para el header de días
  _registerDayHeaderExtension: function () {
    const BadgeWrapper = this._createComponentWrapper(EventCounterBadge);

    // Registrar la extensión en el header de días
    this._extensionId = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().CALENDAR_DAY_HEADER,
      BadgeWrapper,
      {
        order: 200,
      }
    );

    console.log(
      "[Contador Eventos] Extensión UI registrada con ID:",
      this._extensionId
    );
  },
};
