import React from "react";

function SettingsPanel(props) {
  const [settings, setSettings] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  // Cargar configuraciones iniciales
  React.useEffect(() => {
    try {
      const currentSettings = props.plugin.publicAPI.getSettings();
      setSettings(currentSettings);
      setIsLoading(false);
    } catch (error) {
      console.error("[SettingsPanel] Error al cargar configuraciones:", error);
      setIsLoading(false);
    }
  }, [props.plugin]);

  // Manejar cambios en el modo de colores
  const handleModeChange = async (e) => {
    const useMultipleColors = e.target.checked;
    const newSettings = {
      ...settings,
      useMultipleColors,
    };

    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  // Manejar cambio del color único
  const handleSingleColorChange = async (e) => {
    const singleColor = e.target.value;
    const newSettings = {
      ...settings,
      singleColor,
    };

    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  // Manejar cambios en los rangos de colores
  const handleRangeChange = async (rangeKey, field, value) => {
    const newSettings = {
      ...settings,
      colorRanges: {
        ...settings.colorRanges,
        [rangeKey]: {
          ...settings.colorRanges[rangeKey],
          [field]: field === "color" ? value : parseInt(value) || 0,
        },
      },
    };

    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  // Guardar configuraciones
  const saveSettings = async (newSettings) => {
    try {
      setIsSaving(true);
      await props.plugin.publicAPI.updateSettings(newSettings);
    } catch (error) {
      console.error("[SettingsPanel] Error al guardar:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Resetear a valores por defecto
  const handleReset = async () => {
    if (
      confirm(
        "¿Estás seguro de que quieres resetear la configuración a los valores por defecto?"
      )
    ) {
      const defaultSettings = {
        useMultipleColors: false,
        singleColor: "#4f46e5",
        colorRanges: {
          range1: { min: 1, max: 3, color: "#10b981" },
          range2: { min: 4, max: 6, color: "#06b6d4" },
          range3: { min: 7, max: 999, color: "#f59e0b" },
        },
      };

      setSettings(defaultSettings);
      await saveSettings(defaultSettings);
    }
  };

  // Vista de carga
  if (isLoading) {
    return React.createElement(
      "div",
      {
        className: "settings-panel loading",
        style: { padding: "20px", textAlign: "center" },
      },
      "Cargando configuración..."
    );
  }

  // Vista de error si no hay configuraciones
  if (!settings) {
    return React.createElement(
      "div",
      {
        className: "settings-panel error",
        style: {
          padding: "20px",
          textAlign: "center",
          color: "var(--danger-color)",
        },
      },
      "Error al cargar la configuración del contador de eventos"
    );
  }

  return React.createElement(
    "div",
    {
      className: "event-counter-settings-panel",
      style: {
        padding: "20px",
        borderRadius: "8px",
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--border-color)",
      },
    },
    [
      // Título del panel
      React.createElement(
        "h3",
        {
          key: "title",
          style: {
            margin: "0 0 20px 0",
            color: "var(--text-color)",
            fontSize: "18px",
            fontWeight: "600",
          },
        },
        "Configuración del Contador de Eventos"
      ),

      // Indicador de guardado
      isSaving &&
        React.createElement(
          "div",
          {
            key: "saving-indicator",
            style: {
              padding: "8px 12px",
              backgroundColor: "var(--info-color)",
              color: "white",
              borderRadius: "4px",
              marginBottom: "16px",
              fontSize: "14px",
            },
          },
          "💾 Guardando configuración..."
        ),

      // Modo de colores
      React.createElement(
        "div",
        {
          key: "color-mode",
          className: "settings-group",
          style: { marginBottom: "24px" },
        },
        [
          React.createElement(
            "label",
            {
              key: "mode-label",
              style: {
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "500",
                color: "var(--text-color)",
              },
            },
            [
              React.createElement("input", {
                key: "mode-checkbox",
                type: "checkbox",
                checked: settings.useMultipleColors,
                onChange: handleModeChange,
                style: { marginRight: "8px" },
              }),
              "Usar colores diferentes según cantidad de eventos",
            ]
          ),
          React.createElement(
            "p",
            {
              key: "mode-description",
              style: {
                margin: "8px 0 0 0",
                fontSize: "14px",
                color: "var(--text-color-secondary)",
                lineHeight: "1.4",
              },
            },
            settings.useMultipleColors
              ? "Los contadores cambiarán de color según la cantidad de eventos en cada día"
              : "Todos los contadores usarán el mismo color"
          ),
        ]
      ),

      // Configuración de color único
      !settings.useMultipleColors &&
        React.createElement(
          "div",
          {
            key: "single-color",
            className: "settings-group",
            style: { marginBottom: "24px" },
          },
          [
            React.createElement(
              "label",
              {
                key: "single-label",
                style: {
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "var(--text-color)",
                },
              },
              "Color del contador:"
            ),
            React.createElement(
              "div",
              {
                key: "single-color-container",
                style: { display: "flex", alignItems: "center", gap: "12px" },
              },
              [
                React.createElement("input", {
                  key: "single-color-input",
                  type: "color",
                  value: settings.singleColor,
                  onChange: handleSingleColorChange,
                  style: {
                    width: "40px",
                    height: "40px",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  },
                }),
                React.createElement(
                  "span",
                  {
                    key: "single-color-preview",
                    style: {
                      padding: "8px 12px",
                      backgroundColor: settings.singleColor,
                      color: "white",
                      borderRadius: "16px",
                      fontSize: "12px",
                      fontWeight: "600",
                    },
                  },
                  "5"
                ),
                React.createElement(
                  "code",
                  {
                    key: "single-color-code",
                    style: {
                      fontSize: "12px",
                      color: "var(--text-color-secondary)",
                      backgroundColor: "var(--bg-color-secondary)",
                      padding: "4px 8px",
                      borderRadius: "4px",
                    },
                  },
                  settings.singleColor
                ),
              ]
            ),
          ]
        ),

      // Configuración de colores por rangos
      settings.useMultipleColors &&
        React.createElement(
          "div",
          {
            key: "color-ranges",
            className: "settings-group",
          },
          [
            React.createElement(
              "h4",
              {
                key: "ranges-title",
                style: {
                  margin: "0 0 16px 0",
                  fontSize: "16px",
                  fontWeight: "500",
                  color: "var(--text-color)",
                },
              },
              "Configuración de colores por rangos:"
            ),

            // Rango 1
            React.createElement(
              "div",
              {
                key: "range1",
                className: "range-config",
                style: {
                  padding: "16px",
                  backgroundColor: "var(--bg-color-secondary)",
                  borderRadius: "8px",
                  marginBottom: "12px",
                },
              },
              [
                React.createElement(
                  "div",
                  {
                    key: "range1-header",
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "12px",
                    },
                  },
                  [
                    React.createElement(
                      "span",
                      {
                        key: "range1-label",
                        style: {
                          fontWeight: "500",
                          color: "var(--text-color)",
                        },
                      },
                      "Rango 1:"
                    ),
                    React.createElement(
                      "span",
                      {
                        key: "range1-preview",
                        style: {
                          padding: "4px 8px",
                          backgroundColor: settings.colorRanges.range1.color,
                          color: "white",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "600",
                        },
                      },
                      "2"
                    ),
                  ]
                ),
                React.createElement(
                  "div",
                  {
                    key: "range1-controls",
                    style: {
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "12px",
                      alignItems: "center",
                    },
                  },
                  [
                    React.createElement("div", { key: "range1-min" }, [
                      React.createElement(
                        "label",
                        {
                          key: "label",
                          style: {
                            display: "block",
                            fontSize: "12px",
                            color: "var(--text-color-secondary)",
                            marginBottom: "4px",
                          },
                        },
                        "Desde:"
                      ),
                      React.createElement("input", {
                        key: "input",
                        type: "number",
                        min: "1",
                        value: settings.colorRanges.range1.min,
                        onChange: (e) =>
                          handleRangeChange("range1", "min", e.target.value),
                        style: {
                          width: "100%",
                          padding: "6px",
                          border: "1px solid var(--border-color)",
                          borderRadius: "4px",
                        },
                      }),
                    ]),
                    React.createElement("div", { key: "range1-max" }, [
                      React.createElement(
                        "label",
                        {
                          key: "label",
                          style: {
                            display: "block",
                            fontSize: "12px",
                            color: "var(--text-color-secondary)",
                            marginBottom: "4px",
                          },
                        },
                        "Hasta:"
                      ),
                      React.createElement("input", {
                        key: "input",
                        type: "number",
                        min: settings.colorRanges.range1.min,
                        value: settings.colorRanges.range1.max,
                        onChange: (e) =>
                          handleRangeChange("range1", "max", e.target.value),
                        style: {
                          width: "100%",
                          padding: "6px",
                          border: "1px solid var(--border-color)",
                          borderRadius: "4px",
                        },
                      }),
                    ]),
                    React.createElement("div", { key: "range1-color" }, [
                      React.createElement(
                        "label",
                        {
                          key: "label",
                          style: {
                            display: "block",
                            fontSize: "12px",
                            color: "var(--text-color-secondary)",
                            marginBottom: "4px",
                          },
                        },
                        "Color:"
                      ),
                      React.createElement("input", {
                        key: "input",
                        type: "color",
                        value: settings.colorRanges.range1.color,
                        onChange: (e) =>
                          handleRangeChange("range1", "color", e.target.value),
                        style: {
                          width: "100%",
                          height: "32px",
                          border: "1px solid var(--border-color)",
                          borderRadius: "4px",
                          cursor: "pointer",
                        },
                      }),
                    ]),
                  ]
                ),
              ]
            ),

            // Rango 2
            React.createElement(
              "div",
              {
                key: "range2",
                className: "range-config",
                style: {
                  padding: "16px",
                  backgroundColor: "var(--bg-color-secondary)",
                  borderRadius: "8px",
                  marginBottom: "12px",
                },
              },
              [
                React.createElement(
                  "div",
                  {
                    key: "range2-header",
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "12px",
                    },
                  },
                  [
                    React.createElement(
                      "span",
                      {
                        key: "range2-label",
                        style: {
                          fontWeight: "500",
                          color: "var(--text-color)",
                        },
                      },
                      "Rango 2:"
                    ),
                    React.createElement(
                      "span",
                      {
                        key: "range2-preview",
                        style: {
                          padding: "4px 8px",
                          backgroundColor: settings.colorRanges.range2.color,
                          color: "white",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "600",
                        },
                      },
                      "5"
                    ),
                  ]
                ),
                React.createElement(
                  "div",
                  {
                    key: "range2-controls",
                    style: {
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "12px",
                      alignItems: "center",
                    },
                  },
                  [
                    React.createElement("div", { key: "range2-min" }, [
                      React.createElement(
                        "label",
                        {
                          key: "label",
                          style: {
                            display: "block",
                            fontSize: "12px",
                            color: "var(--text-color-secondary)",
                            marginBottom: "4px",
                          },
                        },
                        "Desde:"
                      ),
                      React.createElement("input", {
                        key: "input",
                        type: "number",
                        min: settings.colorRanges.range1.max + 1,
                        value: settings.colorRanges.range2.min,
                        onChange: (e) =>
                          handleRangeChange("range2", "min", e.target.value),
                        style: {
                          width: "100%",
                          padding: "6px",
                          border: "1px solid var(--border-color)",
                          borderRadius: "4px",
                        },
                      }),
                    ]),
                    React.createElement("div", { key: "range2-max" }, [
                      React.createElement(
                        "label",
                        {
                          key: "label",
                          style: {
                            display: "block",
                            fontSize: "12px",
                            color: "var(--text-color-secondary)",
                            marginBottom: "4px",
                          },
                        },
                        "Hasta:"
                      ),
                      React.createElement("input", {
                        key: "input",
                        type: "number",
                        min: settings.colorRanges.range2.min,
                        value: settings.colorRanges.range2.max,
                        onChange: (e) =>
                          handleRangeChange("range2", "max", e.target.value),
                        style: {
                          width: "100%",
                          padding: "6px",
                          border: "1px solid var(--border-color)",
                          borderRadius: "4px",
                        },
                      }),
                    ]),
                    React.createElement("div", { key: "range2-color" }, [
                      React.createElement(
                        "label",
                        {
                          key: "label",
                          style: {
                            display: "block",
                            fontSize: "12px",
                            color: "var(--text-color-secondary)",
                            marginBottom: "4px",
                          },
                        },
                        "Color:"
                      ),
                      React.createElement("input", {
                        key: "input",
                        type: "color",
                        value: settings.colorRanges.range2.color,
                        onChange: (e) =>
                          handleRangeChange("range2", "color", e.target.value),
                        style: {
                          width: "100%",
                          height: "32px",
                          border: "1px solid var(--border-color)",
                          borderRadius: "4px",
                          cursor: "pointer",
                        },
                      }),
                    ]),
                  ]
                ),
              ]
            ),

            // Rango 3
            React.createElement(
              "div",
              {
                key: "range3",
                className: "range-config",
                style: {
                  padding: "16px",
                  backgroundColor: "var(--bg-color-secondary)",
                  borderRadius: "8px",
                  marginBottom: "12px",
                },
              },
              [
                React.createElement(
                  "div",
                  {
                    key: "range3-header",
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "12px",
                    },
                  },
                  [
                    React.createElement(
                      "span",
                      {
                        key: "range3-label",
                        style: {
                          fontWeight: "500",
                          color: "var(--text-color)",
                        },
                      },
                      "Rango 3:"
                    ),
                    React.createElement(
                      "span",
                      {
                        key: "range3-preview",
                        style: {
                          padding: "4px 8px",
                          backgroundColor: settings.colorRanges.range3.color,
                          color: "white",
                          borderRadius: "12px",
                          fontSize: "11px",
                          fontWeight: "600",
                        },
                      },
                      "10"
                    ),
                  ]
                ),
                React.createElement(
                  "div",
                  {
                    key: "range3-controls",
                    style: {
                      display: "grid",
                      gridTemplateColumns: "1fr 2fr",
                      gap: "12px",
                      alignItems: "center",
                    },
                  },
                  [
                    React.createElement("div", { key: "range3-min" }, [
                      React.createElement(
                        "label",
                        {
                          key: "label",
                          style: {
                            display: "block",
                            fontSize: "12px",
                            color: "var(--text-color-secondary)",
                            marginBottom: "4px",
                          },
                        },
                        "Desde:"
                      ),
                      React.createElement("input", {
                        key: "input",
                        type: "number",
                        min: settings.colorRanges.range2.max + 1,
                        value: settings.colorRanges.range3.min,
                        onChange: (e) =>
                          handleRangeChange("range3", "min", e.target.value),
                        style: {
                          width: "100%",
                          padding: "6px",
                          border: "1px solid var(--border-color)",
                          borderRadius: "4px",
                        },
                      }),
                    ]),
                    React.createElement("div", { key: "range3-color" }, [
                      React.createElement(
                        "label",
                        {
                          key: "label",
                          style: {
                            display: "block",
                            fontSize: "12px",
                            color: "var(--text-color-secondary)",
                            marginBottom: "4px",
                          },
                        },
                        "Color (7 eventos o más):"
                      ),
                      React.createElement("input", {
                        key: "input",
                        type: "color",
                        value: settings.colorRanges.range3.color,
                        onChange: (e) =>
                          handleRangeChange("range3", "color", e.target.value),
                        style: {
                          width: "100%",
                          height: "32px",
                          border: "1px solid var(--border-color)",
                          borderRadius: "4px",
                          cursor: "pointer",
                        },
                      }),
                    ]),
                  ]
                ),
              ]
            ),
          ]
        ),

      // Botón de reset
      React.createElement(
        "div",
        {
          key: "reset-section",
          style: {
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid var(--border-color)",
          },
        },
        React.createElement(
          "button",
          {
            onClick: handleReset,
            style: {
              padding: "8px 16px",
              backgroundColor: "var(--danger-color)",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            },
          },
          "Resetear a valores por defecto"
        )
      ),
    ]
  );
}

export default SettingsPanel;
