import React from "react";
import EventCounterBadge from "./components/EventCounterBadge.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";
import "./styles/index.css";

export default {
  // Metadatos del plugin
  id: "contador-eventos-dia",
  name: "Contador de Eventos por Día",
  version: "1.1.0",
  description:
    "Muestra la cantidad de eventos en el header de cada día del calendario con colores personalizables",
  author: "Atlas Plugin Developer",

  // Restricciones de compatibilidad
  minAppVersion: "0.3.0",
  maxAppVersion: "1.0.0",

  // Permisos requeridos
  permissions: ["events", "ui", "storage"],

  // Variables internas
  _core: null,
  _subscriptions: [],
  _extensionIds: {},

  // Configuraciones por defecto
  _settings: {
    // Modo de colores: false = color único, true = colores por rangos
    useMultipleColors: false,

    // Color único (cuando useMultipleColors = false)
    singleColor: "#4f46e5",

    // Configuración de colores por rangos (cuando useMultipleColors = true)
    colorRanges: {
      // Rango 1: 1-3 eventos (verde)
      range1: {
        min: 1,
        max: 3,
        color: "#10b981",
      },
      // Rango 2: 4-6 eventos (celeste)
      range2: {
        min: 4,
        max: 6,
        color: "#06b6d4",
      },
      // Rango 3: 7+ eventos (naranja)
      range3: {
        min: 7,
        max: 999,
        color: "#f59e0b",
      },
    },
  },

  // Método de inicialización
  init: async function (core) {
    const self = this;

    try {
      // Guardar referencia al core
      self._core = core;
      self._subscriptions = [];
      self._extensionIds = {};

      // Cargar configuraciones guardadas
      await self._loadSettings();

      // Crear API pública
      self.publicAPI = self._createPublicAPI();
      core.plugins.registerAPI(self.id, self.publicAPI);

      // Registrar la extensión UI para el header de días
      self._registerDayHeaderExtension();

      // Registrar panel de configuración
      self._registerSettingsPanel();

      // Configurar listeners de eventos del calendario
      self._setupEventListeners();

      console.log("[Contador Eventos] Plugin inicializado correctamente");
      return true;
    } catch (error) {
      console.error(
        "[Contador Eventos] Error durante la inicialización:",
        error
      );
      return false;
    }
  },

  // Método de limpieza
  cleanup: async function () {
    try {
      // Guardar configuraciones
      await this._saveSettings();

      // Cancelar todas las suscripciones a eventos
      this._subscriptions.forEach((unsub) => {
        if (typeof unsub === "function") {
          unsub();
        }
      });
      this._subscriptions = [];

      // Remover extensiones UI
      Object.entries(this._extensionIds).forEach(([zone, extensionId]) => {
        if (extensionId && this._core) {
          this._core.ui.removeExtension(this.id, extensionId);
        }
      });

      console.log("[Contador Eventos] Limpieza completada");
      return true;
    } catch (error) {
      console.error("[Contador Eventos] Error durante la limpieza:", error);
      return false;
    }
  },

  // Cargar configuraciones del almacenamiento
  _loadSettings: async function () {
    const STORAGE_KEY = "settings";
    try {
      const savedSettings = await this._core.storage.getItem(
        this.id,
        STORAGE_KEY,
        null
      );

      if (savedSettings) {
        // Fusionar configuraciones guardadas con las por defecto
        this._settings = {
          ...this._settings,
          ...savedSettings,
          // Asegurar que colorRanges se fusiona correctamente
          colorRanges: {
            ...this._settings.colorRanges,
            ...(savedSettings.colorRanges || {}),
          },
        };
      }
    } catch (error) {
      console.error(
        "[Contador Eventos] Error al cargar configuraciones:",
        error
      );
    }
  },

  // Guardar configuraciones en el almacenamiento
  _saveSettings: async function () {
    const STORAGE_KEY = "settings";
    try {
      await this._core.storage.setItem(this.id, STORAGE_KEY, this._settings);
    } catch (error) {
      console.error(
        "[Contador Eventos] Error al guardar configuraciones:",
        error
      );
    }
  },

  // Crear API pública
  _createPublicAPI: function () {
    const self = this;

    return {
      // Obtener configuraciones actuales
      getSettings: () => ({ ...self._settings }),

      // Actualizar configuraciones
      updateSettings: async (newSettings) => {
        self._settings = {
          ...self._settings,
          ...newSettings,
          // Fusionar colorRanges correctamente
          colorRanges: {
            ...self._settings.colorRanges,
            ...(newSettings.colorRanges || {}),
          },
        };

        await self._saveSettings();

        // Notificar cambios
        self._core.events.publish(self.id, "contadorEventos.configChanged", {
          settings: self._settings,
        });
      },

      // Obtener color para una cantidad específica de eventos
      getColorForEventCount: (count) => {
        return self._getColorForEventCount(count);
      },
    };
  },

  // Determinar color según cantidad de eventos y configuración
  _getColorForEventCount: function (count) {
    if (count === 0) return null;

    if (!this._settings.useMultipleColors) {
      return this._settings.singleColor;
    }

    // Buscar en qué rango cae el count
    const ranges = this._settings.colorRanges;

    if (count >= ranges.range1.min && count <= ranges.range1.max) {
      return ranges.range1.color;
    }
    if (count >= ranges.range2.min && count <= ranges.range2.max) {
      return ranges.range2.color;
    }
    if (count >= ranges.range3.min) {
      return ranges.range3.color;
    }

    // Fallback al color único
    return this._settings.singleColor;
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
    this._extensionIds.dayHeader = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().CALENDAR_DAY_HEADER,
      BadgeWrapper,
      {
        order: 200,
      }
    );

    console.log(
      "[Contador Eventos] Extensión UI registrada con ID:",
      this._extensionIds.dayHeader
    );
  },

  // Registrar panel de configuración
  _registerSettingsPanel: function () {
    const SettingsWrapper = this._createComponentWrapper(SettingsPanel);

    // Registrar la extensión en el panel de configuración
    this._extensionIds.settings = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().SETTINGS_PANEL,
      SettingsWrapper,
      {
        order: 100,
      }
    );

    console.log(
      "[Contador Eventos] Panel de configuración registrado con ID:",
      this._extensionIds.settings
    );
  },
};
