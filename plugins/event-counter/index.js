import React from "react";
import EventCounterBadge from "./components/EventCounterBadge.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";
import "./styles/index.css";

export default {
  // Metadatos del plugin
  id: "contador-eventos-dia",
  name: "Contador de Eventos Pro",
  version: "2.0.0",
  description:
    "Plugin profesional para mostrar contadores de eventos personalizables en el calendario",
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

  // Configuraciones por defecto expandidas
  _settings: {
    // === MODO DE COLORES ===
    useMultipleColors: false,
    singleColor: "#4f46e5",
    colorRanges: {
      range1: { min: 1, max: 3, color: "#10b981" },
      range2: { min: 4, max: 6, color: "#06b6d4" },
      range3: { min: 7, max: 999, color: "#f59e0b" },
    },

    // === ESTILO DEL BADGE ===
    badgeStyle: "rounded", // 'rounded', 'circular', 'square', 'minimal', 'modern'
    badgePosition: "bottom-right", // 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'
    badgeSize: "medium", // 'small', 'medium', 'large', 'xl'

    // === TIPOGRAFÍA ===
    fontFamily: "system", // 'system', 'inter', 'roboto', 'poppins', 'monospace'
    fontSize: "auto", // 'auto', 'xs', 'sm', 'md', 'lg'
    fontWeight: "semibold", // 'normal', 'medium', 'semibold', 'bold'
    textColor: "auto", // 'auto', 'white', 'black', 'gray-light', 'gray-dark'

    // === EFECTOS VISUALES ===
    showShadow: true,
    shadowIntensity: "medium", // 'light', 'medium', 'strong'
    showBorder: false,
    borderColor: "#ffffff",
    borderWidth: 1,

    // === ANIMACIONES ===
    enableAnimations: true,
    animationType: "fade", // 'fade', 'scale', 'slide', 'bounce'
    hoverEffect: true,

    // === AVANZADO ===
    hideOnZero: true,
    showOnlyWorkdays: false,
    customCSSEnabled: false,
    customCSS: "",
  },

  // Método de inicialización
  init: async function (core) {
    const self = this;

    try {
      self._core = core;
      self._subscriptions = [];
      self._extensionIds = {};

      await self._loadSettings();
      self.publicAPI = self._createPublicAPI();
      core.plugins.registerAPI(self.id, self.publicAPI);

      self._registerDayHeaderExtension();
      self._registerSettingsPanel();
      self._setupEventListeners();
      self._injectCustomCSS();

      console.log("[Contador Eventos Pro] Plugin inicializado correctamente");
      return true;
    } catch (error) {
      console.error(
        "[Contador Eventos Pro] Error durante la inicialización:",
        error
      );
      return false;
    }
  },

  // Método de limpieza
  cleanup: async function () {
    try {
      await this._saveSettings();
      this._removeCustomCSS();

      this._subscriptions.forEach((unsub) => {
        if (typeof unsub === "function") unsub();
      });
      this._subscriptions = [];

      Object.entries(this._extensionIds).forEach(([zone, extensionId]) => {
        if (extensionId && this._core) {
          this._core.ui.removeExtension(this.id, extensionId);
        }
      });

      console.log("[Contador Eventos Pro] Limpieza completada");
      return true;
    } catch (error) {
      console.error("[Contador Eventos Pro] Error durante la limpieza:", error);
      return false;
    }
  },

  // Cargar configuraciones
  _loadSettings: async function () {
    const STORAGE_KEY = "settings";
    try {
      const savedSettings = await this._core.storage.getItem(
        this.id,
        STORAGE_KEY,
        null
      );

      if (savedSettings) {
        this._settings = {
          ...this._settings,
          ...savedSettings,
          colorRanges: {
            ...this._settings.colorRanges,
            ...(savedSettings.colorRanges || {}),
          },
        };
      }
    } catch (error) {
      console.error(
        "[Contador Eventos Pro] Error al cargar configuraciones:",
        error
      );
    }
  },

  // Guardar configuraciones
  _saveSettings: async function () {
    const STORAGE_KEY = "settings";
    try {
      await this._core.storage.setItem(this.id, STORAGE_KEY, this._settings);
    } catch (error) {
      console.error(
        "[Contador Eventos Pro] Error al guardar configuraciones:",
        error
      );
    }
  },

  // Crear API pública expandida
  _createPublicAPI: function () {
    const self = this;

    return {
      // Configuraciones básicas
      getSettings: () => ({ ...self._settings }),
      updateSettings: async (newSettings) => {
        self._settings = {
          ...self._settings,
          ...newSettings,
          colorRanges: {
            ...self._settings.colorRanges,
            ...(newSettings.colorRanges || {}),
          },
        };

        await self._saveSettings();
        self._injectCustomCSS();

        self._core.events.publish(self.id, "contadorEventos.configChanged", {
          settings: self._settings,
        });
      },

      // Utilidades de color y estilo
      getColorForEventCount: (count) => self._getColorForEventCount(count),
      getBadgeClasses: (count) => self._getBadgeClasses(count),
      getBadgeStyles: (count) => self._getBadgeStyles(count),

      // Utilidades avanzadas
      shouldShowBadge: (date, count) => self._shouldShowBadge(date, count),
      getTextColor: (backgroundColor) => self._getTextColor(backgroundColor),

      // Presets y configuraciones rápidas
      applyPreset: async (presetName) => {
        const preset = self._getPreset(presetName);
        if (preset) {
          await self.publicAPI.updateSettings(preset);
        }
      },
      getAvailablePresets: () => self._getAvailablePresets(),

      // Validación
      validateSettings: (settings) => self._validateSettings(settings),
    };
  },

  // Determinar color según configuración
  _getColorForEventCount: function (count) {
    if (count === 0) return null;

    if (!this._settings.useMultipleColors) {
      return this._settings.singleColor;
    }

    const ranges = this._settings.colorRanges;
    if (count >= ranges.range1.min && count <= ranges.range1.max)
      return ranges.range1.color;
    if (count >= ranges.range2.min && count <= ranges.range2.max)
      return ranges.range2.color;
    if (count >= ranges.range3.min) return ranges.range3.color;

    return this._settings.singleColor;
  },

  // Generar clases CSS para el badge
  _getBadgeClasses: function (count) {
    const classes = ["event-counter-badge"];

    // Estilo del badge
    classes.push(`badge-style-${this._settings.badgeStyle}`);

    // Tamaño
    classes.push(`badge-size-${this._settings.badgeSize}`);

    // Posición
    classes.push(
      `badge-position-${this._settings.badgePosition.replace("-", "_")}`
    );

    // Familia de fuente
    classes.push(`badge-font-${this._settings.fontFamily}`);

    // Peso de fuente
    classes.push(`badge-weight-${this._settings.fontWeight}`);

    // Efectos
    if (this._settings.showShadow) {
      classes.push(`badge-shadow-${this._settings.shadowIntensity}`);
    }

    if (this._settings.showBorder) {
      classes.push("badge-with-border");
    }

    if (this._settings.enableAnimations) {
      classes.push("badge-animated");
      classes.push(`badge-animation-${this._settings.animationType}`);
    }

    if (this._settings.hoverEffect) {
      classes.push("badge-hover-enabled");
    }

    return classes.join(" ");
  },

  // Generar estilos inline dinámicos
  _getBadgeStyles: function (count) {
    const styles = {};
    const backgroundColor = this._getColorForEventCount(count);

    if (backgroundColor) {
      styles.backgroundColor = backgroundColor;

      // Color de texto
      if (this._settings.textColor === "auto") {
        styles.color = this._getTextColor(backgroundColor);
      } else {
        const textColors = {
          white: "#ffffff",
          black: "#000000",
          "gray-light": "#9ca3af",
          "gray-dark": "#374151",
        };
        styles.color = textColors[this._settings.textColor] || "#ffffff";
      }

      // Sombra personalizada
      if (this._settings.showShadow) {
        const shadowIntensities = {
          light: "0 1px 2px",
          medium: "0 2px 4px",
          strong: "0 4px 8px",
        };
        const shadowBase =
          shadowIntensities[this._settings.shadowIntensity] ||
          shadowIntensities.medium;
        styles.boxShadow = `${shadowBase} ${backgroundColor}20, ${shadowBase.replace(
          "0 ",
          "0 1px "
        )} ${backgroundColor}40`;
      }
    }

    // Borde personalizado
    if (this._settings.showBorder) {
      styles.border = `${this._settings.borderWidth}px solid ${this._settings.borderColor}`;
    }

    // Tamaño de fuente personalizado
    if (this._settings.fontSize !== "auto") {
      const fontSizes = {
        xs: "9px",
        sm: "10px",
        md: "12px",
        lg: "14px",
      };
      styles.fontSize = fontSizes[this._settings.fontSize];
    }

    return styles;
  },

  // Determinar si mostrar badge
  _shouldShowBadge: function (date, count) {
    if (count === 0 && this._settings.hideOnZero) return false;

    if (this._settings.showOnlyWorkdays) {
      const dayOfWeek = date.getDay();
      return dayOfWeek !== 0 && dayOfWeek !== 6; // No domingo ni sábado
    }

    return true;
  },

  // Calcular color de texto automático
  _getTextColor: function (backgroundColor) {
    const hex = backgroundColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#ffffff";
  },

  // Presets predefinidos
  _getPreset: function (presetName) {
    const presets = {
      minimal: {
        badgeStyle: "minimal",
        badgeSize: "small",
        showShadow: false,
        showBorder: false,
        fontWeight: "normal",
        enableAnimations: false,
      },
      modern: {
        badgeStyle: "modern",
        badgeSize: "medium",
        showShadow: true,
        shadowIntensity: "medium",
        fontWeight: "semibold",
        enableAnimations: true,
        animationType: "scale",
      },
      classic: {
        badgeStyle: "circular",
        badgeSize: "medium",
        showShadow: true,
        shadowIntensity: "light",
        fontWeight: "bold",
        enableAnimations: true,
        animationType: "fade",
      },
      bold: {
        badgeStyle: "square",
        badgeSize: "large",
        showShadow: true,
        shadowIntensity: "strong",
        showBorder: true,
        fontWeight: "bold",
        enableAnimations: true,
        animationType: "bounce",
      },
    };
    return presets[presetName];
  },

  _getAvailablePresets: function () {
    return [
      {
        id: "minimal",
        name: "Minimalista",
        description: "Diseño simple y limpio",
      },
      {
        id: "modern",
        name: "Moderno",
        description: "Estilo contemporáneo con efectos suaves",
      },
      {
        id: "classic",
        name: "Clásico",
        description: "Diseño tradicional y elegante",
      },
      {
        id: "bold",
        name: "Llamativo",
        description: "Diseño audaz que destaca",
      },
    ];
  },

  // Validar configuraciones
  _validateSettings: function (settings) {
    const errors = [];

    if (settings.colorRanges) {
      const ranges = settings.colorRanges;
      if (ranges.range1.min >= ranges.range1.max) {
        errors.push("El rango 1 debe tener un mínimo menor que el máximo");
      }
      if (ranges.range2.min >= ranges.range2.max) {
        errors.push("El rango 2 debe tener un mínimo menor que el máximo");
      }
      if (ranges.range1.max >= ranges.range2.min) {
        errors.push("Los rangos no deben solaparse");
      }
    }

    return { isValid: errors.length === 0, errors };
  },

  // Inyectar CSS personalizado
  _injectCustomCSS: function () {
    this._removeCustomCSS();

    if (this._settings.customCSSEnabled && this._settings.customCSS) {
      const style = document.createElement("style");
      style.id = `${this.id}-custom-css`;
      style.textContent = this._settings.customCSS;
      document.head.appendChild(style);
    }
  },

  // Remover CSS personalizado
  _removeCustomCSS: function () {
    const existingStyle = document.getElementById(`${this.id}-custom-css`);
    if (existingStyle) {
      existingStyle.remove();
    }
  },

  // Configurar listeners de eventos
  _setupEventListeners: function () {
    const self = this;

    const eventTypes = [
      "calendar.eventCreated",
      "calendar.eventUpdated",
      "calendar.eventDeleted",
      "calendar.eventsLoaded",
    ];

    eventTypes.forEach((eventType) => {
      const subscription = this._core.events.subscribe(
        this.id,
        eventType,
        function (data) {
          console.log(`[Contador Eventos Pro] ${eventType}:`, data);
          self._triggerUIUpdate();
        }
      );
      this._subscriptions.push(subscription);
    });
  },

  // Forzar actualización de UI
  _triggerUIUpdate: function () {
    setTimeout(() => {
      this._core.events.publish(this.id, "contadorEventos.actualizar", {
        timestamp: Date.now(),
      });
    }, 50);
  },

  // Patrón Wrapper
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

  // Registrar extensión del header
  _registerDayHeaderExtension: function () {
    const BadgeWrapper = this._createComponentWrapper(EventCounterBadge);
    this._extensionIds.dayHeader = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().CALENDAR_DAY_HEADER,
      BadgeWrapper,
      { order: 200 }
    );
  },

  // Registrar panel de configuración
  _registerSettingsPanel: function () {
    const SettingsWrapper = this._createComponentWrapper(SettingsPanel);
    this._extensionIds.settings = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().SETTINGS_PANEL,
      SettingsWrapper,
      { order: 100 }
    );
  },
};
