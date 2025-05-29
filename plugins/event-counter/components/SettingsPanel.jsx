import React from "react";

// NO hay constantes TASK_STATUS ni STATUS_LABELS aquí

function SettingsPanel(props) {
  const [settings, setSettings] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("appearance");
  const [previewCount, setPreviewCount] = React.useState(5);

  React.useEffect(() => {
    try {
      // Carga las settings del plugin "Contador de Eventos Pro"
      const currentSettings = props.plugin.publicAPI.getSettings();
      setSettings(currentSettings);
      setIsLoading(false);
    } catch (error) {
      console.error(
        "[SettingsPanel Pro] Error al cargar configuraciones:",
        error
      );
      setIsLoading(false);
    }
  }, [props.plugin]);

  const saveSettings = async (newSettings) => {
    try {
      setSaving(true);
      // Actualiza las settings del plugin "Contador de Eventos Pro"
      await props.plugin.publicAPI.updateSettings(newSettings);
      setTimeout(() => setSaving(false), 2000);
    } catch (error) {
      console.error("[SettingsPanel Pro] Error al guardar:", error);
      setSaving(false);
    }
  };

  const handleSettingChange = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleNestedSettingChange = async (parentKey, childKey, value) => {
    const newSettings = {
      ...settings,
      [parentKey]: { ...settings[parentKey], [childKey]: value },
    };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleRangeChange = async (rangeKey, field, value) => {
    const newSettings = {
      ...settings,
      colorRanges: {
        ...settings.colorRanges,
        [rangeKey]: {
          ...settings.colorRanges[rangeKey],
          [field]: field === "color" ? value : parseInt(value, 10) || 0,
        },
      },
    };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleApplyPreset = async (presetId) => {
    try {
      await props.plugin.publicAPI.applyPreset(presetId);
      const updatedSettings = props.plugin.publicAPI.getSettings();
      setSettings(updatedSettings);
    } catch (error) {
      console.error("[SettingsPanel Pro] Error aplicando preset:", error);
    }
  };

  const handleReset = async () => {
    if (
      confirm(
        "¿Estás seguro de que quieres resetear toda la configuración del Contador de Eventos?"
      )
    ) {
      // defaultSettings específicas para "Contador de Eventos Pro"
      const defaultSettings = {
        useMultipleColors: false,
        singleColor: "#4f46e5",
        badgeStyle: "rounded",
        badgePosition: "bottom-right",
        badgeSize: "medium",
        fontFamily: "system",
        fontSize: "auto",
        fontWeight: "semibold",
        textColor: "auto",
        transparentBackground: false,
        showShadow: true,
        shadowIntensity: "medium",
        showGlow: false,
        glowColor: "background",
        glowCustomColor: "#4f46e5",
        glowIntensity: "medium",
        showBorder: false,
        borderColor: "#ffffff",
        borderWidth: 1,
        enableAnimations: true,
        animationType: "fade",
        hoverEffect: true,
        hideOnZero: true,
        showOnlyWorkdays: false,
        customCSSEnabled: false,
        customCSS: "",
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

  if (isLoading) {
    return React.createElement("div", { className: "settings-panel-loading" }, [
      React.createElement("div", {
        key: "spinner",
        className: "loading-spinner",
      }),
      React.createElement("p", { key: "text" }, "Cargando configuración..."),
    ]);
  }

  // Asegurarse que 'settings' (del event-counter) esté cargado antes de continuar
  if (!settings) {
    return React.createElement(
      "div",
      { className: "settings-panel-error" },
      "Error al cargar la configuración del contador de eventos"
    );
  }

  // Preview para el "Contador de Eventos Pro"
  const createBadgePreview = () => {
    // Defensa por si la API no es la esperada o settings no está listo
    if (!props.plugin.publicAPI.getBadgeClasses || !settings) {
      return React.createElement(
        "div",
        { key: "badge-preview-loading-or-error" },
        "Cargando preview del badge..."
      );
    }
    const badgeClasses = props.plugin.publicAPI.getBadgeClasses(previewCount);
    const badgeStyles = props.plugin.publicAPI.getBadgeStyles(previewCount);
    return React.createElement(
      "div",
      { className: "badge-preview-container" },
      [
        React.createElement(
          "div",
          { key: "preview-area", className: "badge-preview-area" },
          React.createElement(
            "span",
            {
              className: badgeClasses,
              style: badgeStyles,
              "data-count": previewCount > 99 ? "99+" : previewCount.toString(),
            },
            previewCount > 99 ? "99+" : previewCount.toString()
          )
        ),
        React.createElement(
          "div",
          { key: "preview-controls", className: "badge-preview-controls" },
          [
            React.createElement(
              "label",
              { key: "label-preview-slider" },
              "Vista previa (Event Counter):"
            ),
            React.createElement("input", {
              key: "input-preview-slider",
              type: "range",
              min: "0",
              max: "20",
              value: previewCount,
              onChange: (e) =>
                setPreviewCount(parseInt(e.target.value, 10) || 0),
              className: "preview-slider",
            }),
            React.createElement(
              "span",
              { key: "value-preview-count" },
              previewCount + " eventos"
            ),
          ]
        ),
      ]
    );
  };

  // Pestañas solo para "Contador de Eventos Pro"
  const tabs = [
    { id: "appearance", label: "Apariencia", icon: "🎨" },
    { id: "colors", label: "Colores", icon: "🌈" },
    { id: "typography", label: "Tipografía", icon: "📝" },
    { id: "effects", label: "Efectos", icon: "✨" },
    { id: "advanced", label: "Avanzado", icon: "⚙️" },
  ];

  return React.createElement(
    "div",
    { className: "event-counter-settings-panel" },
    [
      React.createElement(
        "div",
        { key: "header", className: "settings-header" },
        [
          React.createElement(
            "h3",
            { key: "title", className: "settings-title" },
            "⚡ Contador de Eventos Pro"
          ),
          React.createElement(
            "p",
            { key: "subtitle", className: "settings-subtitle" },
            "Personaliza completamente la apariencia de los contadores"
          ),
        ]
      ),
      React.createElement(
        "div",
        { key: "main-container", className: "settings-main-container" },
        [
          React.createElement(
            "div",
            { key: "left-column", className: "settings-left-column" },
            [
              props.plugin.publicAPI.getAvailablePresets &&
                React.createElement(
                  "div",
                  { key: "presets-section", className: "settings-section" },
                  [
                    React.createElement(
                      "h4",
                      { key: "title-presets" },
                      "🎯 Presets Rápidos"
                    ),
                    React.createElement(
                      "div",
                      {
                        key: "presets-grid",
                        className: "presets-grid-horizontal",
                      },
                      props.plugin.publicAPI
                        .getAvailablePresets()
                        .map((preset) =>
                          React.createElement(
                            "button",
                            {
                              key: preset.id,
                              className: "preset-button-compact",
                              onClick: () => handleApplyPreset(preset.id),
                              title: preset.description,
                            },
                            [
                              React.createElement(
                                "strong",
                                { key: `preset-name-${preset.id}` },
                                preset.name
                              ),
                              React.createElement(
                                "small",
                                { key: `preset-desc-${preset.id}` },
                                preset.description
                              ),
                            ]
                          )
                        )
                    ),
                  ]
                ),
              React.createElement(
                "div",
                { key: "tabs-nav", className: "settings-tabs-horizontal" },
                tabs.map((tab) =>
                  React.createElement(
                    "button",
                    {
                      key: tab.id,
                      className: `tab-button-horizontal ${
                        activeTab === tab.id ? "active" : ""
                      }`,
                      onClick: () => setActiveTab(tab.id),
                    },
                    `${tab.icon} ${tab.label}`
                  )
                )
              ),
              React.createElement(
                "div",
                {
                  key: "tab-content-wrapper",
                  className: "tab-content-horizontal",
                },
                [
                  activeTab === "appearance" &&
                    React.createElement(
                      "div",
                      {
                        key: "appearance-tab",
                        className: "tab-panel-horizontal",
                      },
                      React.createElement(
                        "div",
                        {
                          key: "appearance-grid",
                          className: "settings-grid-horizontal",
                        },
                        [
                          React.createElement(
                            "div",
                            {
                              key: "style",
                              className: "setting-group-compact",
                            },
                            [
                              React.createElement(
                                "label",
                                {
                                  key: "label-style",
                                  className: "setting-label-compact",
                                },
                                "Estilo del Contador"
                              ),
                              React.createElement(
                                "select",
                                {
                                  key: "select-style",
                                  value: settings.badgeStyle,
                                  onChange: (e) =>
                                    handleSettingChange(
                                      "badgeStyle",
                                      e.target.value
                                    ),
                                  className: "setting-select-compact",
                                },
                                [
                                  React.createElement(
                                    "option",
                                    { key: "rounded", value: "rounded" },
                                    "Redondeado"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "circular", value: "circular" },
                                    "Circular"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "square", value: "square" },
                                    "Cuadrado"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "minimal", value: "minimal" },
                                    "Minimalista"
                                  ),
                                ]
                              ),
                            ]
                          ),
                          React.createElement(
                            "div",
                            {
                              key: "position",
                              className: "setting-group-compact",
                            },
                            [
                              React.createElement(
                                "label",
                                {
                                  key: "label-position",
                                  className: "setting-label-compact",
                                },
                                "Posición"
                              ),
                              React.createElement(
                                "select",
                                {
                                  key: "select-position",
                                  value: settings.badgePosition,
                                  onChange: (e) =>
                                    handleSettingChange(
                                      "badgePosition",
                                      e.target.value
                                    ),
                                  className: "setting-select-compact",
                                },
                                [
                                  React.createElement(
                                    "option",
                                    { key: "tl", value: "top-left" },
                                    "Superior Izq."
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "tr", value: "top-right" },
                                    "Superior Der."
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "bl", value: "bottom-left" },
                                    "Inferior Izq."
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "br", value: "bottom-right" },
                                    "Inferior Der."
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "center", value: "center" },
                                    "Centro"
                                  ),
                                ]
                              ),
                            ]
                          ),
                          React.createElement(
                            "div",
                            { key: "size", className: "setting-group-compact" },
                            [
                              React.createElement(
                                "label",
                                {
                                  key: "label-size",
                                  className: "setting-label-compact",
                                },
                                "Tamaño"
                              ),
                              React.createElement(
                                "select",
                                {
                                  key: "select-size",
                                  value: settings.badgeSize,
                                  onChange: (e) =>
                                    handleSettingChange(
                                      "badgeSize",
                                      e.target.value
                                    ),
                                  className: "setting-select-compact",
                                },
                                [
                                  React.createElement(
                                    "option",
                                    { key: "small", value: "small" },
                                    "Pequeño"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "medium", value: "medium" },
                                    "Mediano"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "large", value: "large" },
                                    "Grande"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "xl", value: "xl" },
                                    "Extra Grande"
                                  ),
                                ]
                              ),
                            ]
                          ),
                        ]
                      )
                    ),
                  activeTab === "colors" &&
                    React.createElement(
                      "div",
                      { key: "colors-tab", className: "tab-panel-horizontal" },
                      [
                        React.createElement(
                          "div",
                          {
                            key: "color-mode",
                            className: "setting-group-horizontal",
                          },
                          [
                            React.createElement(
                              "label",
                              {
                                key: "label-color-mode",
                                className: "checkbox-label-horizontal",
                              },
                              [
                                React.createElement("input", {
                                  key: "checkbox-color-mode",
                                  type: "checkbox",
                                  checked: settings.useMultipleColors,
                                  onChange: (e) =>
                                    handleSettingChange(
                                      "useMultipleColors",
                                      e.target.checked
                                    ),
                                }),
                                React.createElement(
                                  "span",
                                  { key: "text-color-mode" },
                                  "Usar colores diferentes según cantidad"
                                ),
                              ]
                            ),
                          ]
                        ),
                        React.createElement(
                          "div",
                          {
                            key: "transparent-bg",
                            className: "setting-group-horizontal",
                          },
                          [
                            React.createElement(
                              "label",
                              {
                                key: "label-transparent-bg",
                                className: "checkbox-label-horizontal",
                              },
                              [
                                React.createElement("input", {
                                  key: "checkbox-transparent-bg",
                                  type: "checkbox",
                                  checked: settings.transparentBackground,
                                  onChange: (e) =>
                                    handleSettingChange(
                                      "transparentBackground",
                                      e.target.checked
                                    ),
                                }),
                                React.createElement(
                                  "span",
                                  { key: "text-transparent-bg" },
                                  "Fondo transparente (solo borde)"
                                ),
                              ]
                            ),
                          ]
                        ),
                        !settings.useMultipleColors &&
                          React.createElement(
                            "div",
                            {
                              key: "single-color-group",
                              className: "setting-group-horizontal",
                            },
                            [
                              React.createElement(
                                "label",
                                {
                                  key: "label-single-color",
                                  className: "setting-label-compact",
                                },
                                "Color del Contador"
                              ),
                              React.createElement(
                                "div",
                                {
                                  key: "color-input-single",
                                  className: "color-input-group-horizontal",
                                },
                                [
                                  React.createElement("input", {
                                    key: "input-single-color",
                                    type: "color",
                                    value: settings.singleColor,
                                    onChange: (e) =>
                                      handleSettingChange(
                                        "singleColor",
                                        e.target.value
                                      ),
                                    className: "setting-color-input-compact",
                                  }),
                                  React.createElement(
                                    "span",
                                    {
                                      key: "preview-single-color",
                                      className: "color-preview-badge-compact",
                                      style: {
                                        backgroundColor: settings.singleColor,
                                      },
                                    },
                                    "5"
                                  ),
                                  React.createElement(
                                    "code",
                                    {
                                      key: "code-single-color",
                                      className: "color-code-compact",
                                    },
                                    settings.singleColor
                                  ),
                                ]
                              ),
                            ]
                          ),
                        settings.useMultipleColors &&
                          React.createElement(
                            "div",
                            {
                              key: "color-ranges-section",
                              className: "color-ranges-section",
                            },
                            [
                              React.createElement(
                                "h4",
                                {
                                  key: "title-color-ranges",
                                  className: "subsection-title-compact",
                                },
                                "Configuración de Rangos"
                              ),
                              React.createElement(
                                "div",
                                {
                                  key: "range1-config",
                                  className: "range-config-horizontal",
                                },
                                [
                                  React.createElement(
                                    "h5",
                                    { key: "title-range1" },
                                    "Rango 1 (Pocos eventos)"
                                  ),
                                  React.createElement(
                                    "div",
                                    {
                                      key: "controls-range1",
                                      className: "range-controls-horizontal",
                                    },
                                    [
                                      React.createElement(
                                        "div",
                                        {
                                          key: "inputs-range1",
                                          className: "range-inputs-horizontal",
                                        },
                                        [
                                          React.createElement(
                                            "div",
                                            {
                                              key: "min-range1",
                                              className:
                                                "range-input-horizontal",
                                            },
                                            [
                                              React.createElement(
                                                "label",
                                                { key: "label-min-range1" },
                                                "Desde:"
                                              ),
                                              React.createElement("input", {
                                                key: "input-min-range1",
                                                type: "number",
                                                min: "1",
                                                value:
                                                  settings.colorRanges.range1
                                                    .min,
                                                onChange: (e) =>
                                                  handleRangeChange(
                                                    "range1",
                                                    "min",
                                                    e.target.value
                                                  ),
                                                className:
                                                  "setting-number-input-compact",
                                              }),
                                            ]
                                          ),
                                          React.createElement(
                                            "div",
                                            {
                                              key: "max-range1",
                                              className:
                                                "range-input-horizontal",
                                            },
                                            [
                                              React.createElement(
                                                "label",
                                                { key: "label-max-range1" },
                                                "Hasta:"
                                              ),
                                              React.createElement("input", {
                                                key: "input-max-range1",
                                                type: "number",
                                                min: settings.colorRanges.range1
                                                  .min,
                                                value:
                                                  settings.colorRanges.range1
                                                    .max,
                                                onChange: (e) =>
                                                  handleRangeChange(
                                                    "range1",
                                                    "max",
                                                    e.target.value
                                                  ),
                                                className:
                                                  "setting-number-input-compact",
                                              }),
                                            ]
                                          ),
                                        ]
                                      ),
                                      React.createElement(
                                        "div",
                                        {
                                          key: "color-range1",
                                          className: "range-color-horizontal",
                                        },
                                        [
                                          React.createElement(
                                            "label",
                                            { key: "label-color-range1" },
                                            "Color:"
                                          ),
                                          React.createElement("input", {
                                            key: "input-color-range1",
                                            type: "color",
                                            value:
                                              settings.colorRanges.range1.color,
                                            onChange: (e) =>
                                              handleRangeChange(
                                                "range1",
                                                "color",
                                                e.target.value
                                              ),
                                            className:
                                              "setting-color-input-compact",
                                          }),
                                        ]
                                      ),
                                    ]
                                  ),
                                ]
                              ),
                              React.createElement(
                                "div",
                                {
                                  key: "range2-config",
                                  className: "range-config-horizontal",
                                },
                                [
                                  React.createElement(
                                    "h5",
                                    { key: "title-range2" },
                                    "Rango 2 (Eventos moderados)"
                                  ),
                                  React.createElement(
                                    "div",
                                    {
                                      key: "controls-range2",
                                      className: "range-controls-horizontal",
                                    },
                                    [
                                      React.createElement(
                                        "div",
                                        {
                                          key: "inputs-range2",
                                          className: "range-inputs-horizontal",
                                        },
                                        [
                                          React.createElement(
                                            "div",
                                            {
                                              key: "min-range2",
                                              className:
                                                "range-input-horizontal",
                                            },
                                            [
                                              React.createElement(
                                                "label",
                                                { key: "label-min-range2" },
                                                "Desde:"
                                              ),
                                              React.createElement("input", {
                                                key: "input-min-range2",
                                                type: "number",
                                                min:
                                                  (settings.colorRanges.range1
                                                    .max || 0) + 1,
                                                value:
                                                  settings.colorRanges.range2
                                                    .min,
                                                onChange: (e) =>
                                                  handleRangeChange(
                                                    "range2",
                                                    "min",
                                                    e.target.value
                                                  ),
                                                className:
                                                  "setting-number-input-compact",
                                              }),
                                            ]
                                          ),
                                          React.createElement(
                                            "div",
                                            {
                                              key: "max-range2",
                                              className:
                                                "range-input-horizontal",
                                            },
                                            [
                                              React.createElement(
                                                "label",
                                                { key: "label-max-range2" },
                                                "Hasta:"
                                              ),
                                              React.createElement("input", {
                                                key: "input-max-range2",
                                                type: "number",
                                                min: settings.colorRanges.range2
                                                  .min,
                                                value:
                                                  settings.colorRanges.range2
                                                    .max,
                                                onChange: (e) =>
                                                  handleRangeChange(
                                                    "range2",
                                                    "max",
                                                    e.target.value
                                                  ),
                                                className:
                                                  "setting-number-input-compact",
                                              }),
                                            ]
                                          ),
                                        ]
                                      ),
                                      React.createElement(
                                        "div",
                                        {
                                          key: "color-range2",
                                          className: "range-color-horizontal",
                                        },
                                        [
                                          React.createElement(
                                            "label",
                                            { key: "label-color-range2" },
                                            "Color:"
                                          ),
                                          React.createElement("input", {
                                            key: "input-color-range2",
                                            type: "color",
                                            value:
                                              settings.colorRanges.range2.color,
                                            onChange: (e) =>
                                              handleRangeChange(
                                                "range2",
                                                "color",
                                                e.target.value
                                              ),
                                            className:
                                              "setting-color-input-compact",
                                          }),
                                        ]
                                      ),
                                    ]
                                  ),
                                ]
                              ),
                              React.createElement(
                                "div",
                                {
                                  key: "range3-config",
                                  className: "range-config-horizontal",
                                },
                                [
                                  React.createElement(
                                    "h5",
                                    { key: "title-range3" },
                                    "Rango 3 (Muchos eventos)"
                                  ),
                                  React.createElement(
                                    "div",
                                    {
                                      key: "controls-range3",
                                      className: "range-controls-horizontal",
                                    },
                                    [
                                      React.createElement(
                                        "div",
                                        {
                                          key: "inputs-range3",
                                          className: "range-inputs-horizontal",
                                        },
                                        [
                                          React.createElement(
                                            "div",
                                            {
                                              key: "min-range3",
                                              className:
                                                "range-input-horizontal",
                                            },
                                            [
                                              React.createElement(
                                                "label",
                                                { key: "label-min-range3" },
                                                "Desde:"
                                              ),
                                              React.createElement("input", {
                                                key: "input-min-range3",
                                                type: "number",
                                                min:
                                                  (settings.colorRanges.range2
                                                    .max || 0) + 1,
                                                value:
                                                  settings.colorRanges.range3
                                                    .min,
                                                onChange: (e) =>
                                                  handleRangeChange(
                                                    "range3",
                                                    "min",
                                                    e.target.value
                                                  ),
                                                className:
                                                  "setting-number-input-compact",
                                              }),
                                            ]
                                          ),
                                        ]
                                      ),
                                      React.createElement(
                                        "div",
                                        {
                                          key: "color-range3",
                                          className: "range-color-horizontal",
                                        },
                                        [
                                          React.createElement(
                                            "label",
                                            { key: "label-color-range3" },
                                            "Color:"
                                          ),
                                          React.createElement("input", {
                                            key: "input-color-range3",
                                            type: "color",
                                            value:
                                              settings.colorRanges.range3.color,
                                            onChange: (e) =>
                                              handleRangeChange(
                                                "range3",
                                                "color",
                                                e.target.value
                                              ),
                                            className:
                                              "setting-color-input-compact",
                                          }),
                                        ]
                                      ),
                                    ]
                                  ),
                                ]
                              ),
                            ]
                          ),
                      ]
                    ),
                  activeTab === "typography" &&
                    React.createElement(
                      "div",
                      {
                        key: "typography-tab",
                        className: "tab-panel-horizontal",
                      },
                      React.createElement(
                        "div",
                        {
                          key: "typography-grid",
                          className: "settings-grid-horizontal",
                        },
                        [
                          React.createElement(
                            "div",
                            {
                              key: "font-family",
                              className: "setting-group-compact",
                            },
                            [
                              React.createElement(
                                "label",
                                {
                                  key: "label-font-family",
                                  className: "setting-label-compact",
                                },
                                "Familia de Fuente"
                              ),
                              React.createElement(
                                "select",
                                {
                                  key: "select-font-family",
                                  value: settings.fontFamily,
                                  onChange: (e) =>
                                    handleSettingChange(
                                      "fontFamily",
                                      e.target.value
                                    ),
                                  className: "setting-select-compact",
                                },
                                [
                                  React.createElement(
                                    "option",
                                    { key: "system", value: "system" },
                                    "Sistema"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "inter", value: "inter" },
                                    "Inter"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "roboto", value: "roboto" },
                                    "Roboto"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "poppins", value: "poppins" },
                                    "Poppins"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "monospace", value: "monospace" },
                                    "Monospace"
                                  ),
                                ]
                              ),
                            ]
                          ),
                          React.createElement(
                            "div",
                            {
                              key: "font-size",
                              className: "setting-group-compact",
                            },
                            [
                              React.createElement(
                                "label",
                                {
                                  key: "label-font-size",
                                  className: "setting-label-compact",
                                },
                                "Tamaño de Fuente"
                              ),
                              React.createElement(
                                "select",
                                {
                                  key: "select-font-size",
                                  value: settings.fontSize,
                                  onChange: (e) =>
                                    handleSettingChange(
                                      "fontSize",
                                      e.target.value
                                    ),
                                  className: "setting-select-compact",
                                },
                                [
                                  React.createElement(
                                    "option",
                                    { key: "auto", value: "auto" },
                                    "Automático"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "xs", value: "xs" },
                                    "Extra Pequeño"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "sm", value: "sm" },
                                    "Pequeño"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "md", value: "md" },
                                    "Mediano"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "lg", value: "lg" },
                                    "Grande"
                                  ),
                                ]
                              ),
                            ]
                          ),
                          React.createElement(
                            "div",
                            {
                              key: "font-weight",
                              className: "setting-group-compact",
                            },
                            [
                              React.createElement(
                                "label",
                                {
                                  key: "label-font-weight",
                                  className: "setting-label-compact",
                                },
                                "Peso de Fuente"
                              ),
                              React.createElement(
                                "select",
                                {
                                  key: "select-font-weight",
                                  value: settings.fontWeight,
                                  onChange: (e) =>
                                    handleSettingChange(
                                      "fontWeight",
                                      e.target.value
                                    ),
                                  className: "setting-select-compact",
                                },
                                [
                                  React.createElement(
                                    "option",
                                    { key: "normal", value: "normal" },
                                    "Normal"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "medium", value: "medium" },
                                    "Medio"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "semibold", value: "semibold" },
                                    "Semi Negrita"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "bold", value: "bold" },
                                    "Negrita"
                                  ),
                                ]
                              ),
                            ]
                          ),
                          React.createElement(
                            "div",
                            {
                              key: "text-color",
                              className: "setting-group-compact",
                            },
                            [
                              React.createElement(
                                "label",
                                {
                                  key: "label-text-color",
                                  className: "setting-label-compact",
                                },
                                "Color del Texto"
                              ),
                              React.createElement(
                                "select",
                                {
                                  key: "select-text-color",
                                  value: settings.textColor,
                                  onChange: (e) =>
                                    handleSettingChange(
                                      "textColor",
                                      e.target.value
                                    ),
                                  className: "setting-select-compact",
                                },
                                [
                                  React.createElement(
                                    "option",
                                    { key: "auto", value: "auto" },
                                    "Automático"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "white", value: "white" },
                                    "Blanco"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "black", value: "black" },
                                    "Negro"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "gray-light", value: "gray-light" },
                                    "Gris Claro"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "gray-dark", value: "gray-dark" },
                                    "Gris Oscuro"
                                  ),
                                ]
                              ),
                            ]
                          ),
                        ]
                      )
                    ),
                  activeTab === "effects" &&
                    React.createElement(
                      "div",
                      { key: "effects-tab", className: "tab-panel-horizontal" },
                      [
                        React.createElement(
                          "div",
                          {
                            key: "shadow-group",
                            className: "setting-group-horizontal",
                          },
                          [
                            React.createElement(
                              "label",
                              {
                                key: "label-shadow",
                                className: "checkbox-label-horizontal",
                              },
                              [
                                React.createElement("input", {
                                  key: "checkbox-shadow",
                                  type: "checkbox",
                                  checked: settings.showShadow,
                                  onChange: (e) =>
                                    handleSettingChange(
                                      "showShadow",
                                      e.target.checked
                                    ),
                                }),
                                React.createElement(
                                  "span",
                                  { key: "text-shadow" },
                                  "Mostrar sombra (oscura)"
                                ),
                              ]
                            ),
                            settings.showShadow &&
                              React.createElement(
                                "select",
                                {
                                  key: "select-shadow-intensity",
                                  value: settings.shadowIntensity,
                                  onChange: (e) =>
                                    handleSettingChange(
                                      "shadowIntensity",
                                      e.target.value
                                    ),
                                  className:
                                    "setting-select-compact setting-indent",
                                },
                                [
                                  React.createElement(
                                    "option",
                                    { key: "light", value: "light" },
                                    "Sombra Suave"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "medium", value: "medium" },
                                    "Sombra Media"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "strong", value: "strong" },
                                    "Sombra Fuerte"
                                  ),
                                ]
                              ),
                          ]
                        ),
                        React.createElement(
                          "div",
                          {
                            key: "glow-group",
                            className: "setting-group-horizontal",
                          },
                          [
                            React.createElement(
                              "label",
                              {
                                key: "label-glow",
                                className: "checkbox-label-horizontal",
                              },
                              [
                                React.createElement("input", {
                                  key: "checkbox-glow",
                                  type: "checkbox",
                                  checked: settings.showGlow,
                                  onChange: (e) =>
                                    handleSettingChange(
                                      "showGlow",
                                      e.target.checked
                                    ),
                                }),
                                React.createElement(
                                  "span",
                                  { key: "text-glow" },
                                  "Mostrar resplandor"
                                ),
                              ]
                            ),
                            settings.showGlow &&
                              React.createElement(
                                "div",
                                {
                                  key: "glow-controls",
                                  className: "glow-controls-horizontal",
                                },
                                [
                                  React.createElement(
                                    "select",
                                    {
                                      key: "select-glow-color-type",
                                      value: settings.glowColor,
                                      onChange: (e) =>
                                        handleSettingChange(
                                          "glowColor",
                                          e.target.value
                                        ),
                                      className: "setting-select-compact",
                                    },
                                    [
                                      React.createElement(
                                        "option",
                                        {
                                          key: "background",
                                          value: "background",
                                        },
                                        "Color de fondo"
                                      ),
                                      React.createElement(
                                        "option",
                                        { key: "border", value: "border" },
                                        "Color de borde"
                                      ),
                                      React.createElement(
                                        "option",
                                        { key: "custom", value: "custom" },
                                        "Color personalizado"
                                      ),
                                    ]
                                  ),
                                  settings.glowColor === "custom" &&
                                    React.createElement("input", {
                                      key: "input-glow-custom-color",
                                      type: "color",
                                      value: settings.glowCustomColor,
                                      onChange: (e) =>
                                        handleSettingChange(
                                          "glowCustomColor",
                                          e.target.value
                                        ),
                                      className: "setting-color-input-compact",
                                    }),
                                  React.createElement(
                                    "select",
                                    {
                                      key: "select-glow-intensity",
                                      value: settings.glowIntensity,
                                      onChange: (e) =>
                                        handleSettingChange(
                                          "glowIntensity",
                                          e.target.value
                                        ),
                                      className: "setting-select-compact",
                                    },
                                    [
                                      React.createElement(
                                        "option",
                                        { key: "light", value: "light" },
                                        "Resplandor Suave"
                                      ),
                                      React.createElement(
                                        "option",
                                        { key: "medium", value: "medium" },
                                        "Resplandor Medio"
                                      ),
                                      React.createElement(
                                        "option",
                                        { key: "strong", value: "strong" },
                                        "Resplandor Fuerte"
                                      ),
                                    ]
                                  ),
                                ]
                              ),
                          ]
                        ),
                        React.createElement(
                          "div",
                          {
                            key: "border-group",
                            className: "setting-group-horizontal",
                          },
                          [
                            React.createElement(
                              "label",
                              {
                                key: "label-border",
                                className: "checkbox-label-horizontal",
                              },
                              [
                                React.createElement("input", {
                                  key: "checkbox-border",
                                  type: "checkbox",
                                  checked: settings.showBorder,
                                  onChange: (e) =>
                                    handleSettingChange(
                                      "showBorder",
                                      e.target.checked
                                    ),
                                }),
                                React.createElement(
                                  "span",
                                  { key: "text-border" },
                                  "Mostrar borde"
                                ),
                              ]
                            ),
                            settings.showBorder &&
                              React.createElement(
                                "div",
                                {
                                  key: "border-controls",
                                  className: "border-controls-horizontal",
                                },
                                [
                                  React.createElement("input", {
                                    key: "input-border-color",
                                    type: "color",
                                    value: settings.borderColor,
                                    onChange: (e) =>
                                      handleSettingChange(
                                        "borderColor",
                                        e.target.value
                                      ),
                                    className: "setting-color-input-compact",
                                    title: "Color del borde",
                                  }),
                                  React.createElement("input", {
                                    key: "input-border-width",
                                    type: "number",
                                    min: "1",
                                    max: "5",
                                    value: settings.borderWidth || 1,
                                    onChange: (e) => {
                                      const val = parseInt(e.target.value, 10);
                                      const finalVal = isNaN(val)
                                        ? 1
                                        : Math.max(1, Math.min(5, val));
                                      handleSettingChange(
                                        "borderWidth",
                                        finalVal
                                      );
                                    },
                                    className: "setting-number-input-compact",
                                    title: "Grosor del borde",
                                  }),
                                ]
                              ),
                          ]
                        ),
                        React.createElement(
                          "div",
                          {
                            key: "animations-group",
                            className: "setting-group-horizontal",
                          },
                          [
                            React.createElement(
                              "label",
                              {
                                key: "label-animations",
                                className: "checkbox-label-horizontal",
                              },
                              [
                                React.createElement("input", {
                                  key: "checkbox-animations",
                                  type: "checkbox",
                                  checked: settings.enableAnimations,
                                  onChange: (e) =>
                                    handleSettingChange(
                                      "enableAnimations",
                                      e.target.checked
                                    ),
                                }),
                                React.createElement(
                                  "span",
                                  { key: "text-animations" },
                                  "Habilitar animaciones"
                                ),
                              ]
                            ),
                            settings.enableAnimations &&
                              React.createElement(
                                "select",
                                {
                                  key: "select-animation-type",
                                  value: settings.animationType,
                                  onChange: (e) =>
                                    handleSettingChange(
                                      "animationType",
                                      e.target.value
                                    ),
                                  className: "setting-select-compact",
                                },
                                [
                                  React.createElement(
                                    "option",
                                    { key: "fade", value: "fade" },
                                    "Desvanecimiento"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "scale", value: "scale" },
                                    "Escala"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "slide", value: "slide" },
                                    "Deslizamiento"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "bounce", value: "bounce" },
                                    "Rebote"
                                  ),
                                ]
                              ),
                          ]
                        ),
                        React.createElement(
                          "div",
                          {
                            key: "hover-group",
                            className: "setting-group-horizontal",
                          },
                          [
                            React.createElement(
                              "label",
                              {
                                key: "label-hover",
                                className: "checkbox-label-horizontal",
                              },
                              [
                                React.createElement("input", {
                                  key: "checkbox-hover",
                                  type: "checkbox",
                                  checked: settings.hoverEffect,
                                  onChange: (e) =>
                                    handleSettingChange(
                                      "hoverEffect",
                                      e.target.checked
                                    ),
                                }),
                                React.createElement(
                                  "span",
                                  { key: "text-hover" },
                                  "Efectos al pasar el mouse"
                                ),
                              ]
                            ),
                          ]
                        ),
                      ]
                    ),
                  activeTab === "advanced" &&
                    React.createElement(
                      "div",
                      {
                        key: "advanced-tab",
                        className: "tab-panel-horizontal",
                      },
                      [
                        React.createElement(
                          "h4",
                          {
                            key: "visibility-title",
                            className: "subsection-title-compact",
                          },
                          "Opciones de Visibilidad"
                        ),
                        React.createElement(
                          "div",
                          {
                            key: "visibility-options-grid",
                            className: "settings-grid-horizontal",
                          },
                          [
                            React.createElement(
                              "div",
                              {
                                key: "hide-zero",
                                className: "setting-group-compact",
                              },
                              [
                                React.createElement(
                                  "label",
                                  {
                                    key: "label-hide-zero",
                                    className: "checkbox-label-horizontal",
                                  },
                                  [
                                    React.createElement("input", {
                                      key: "checkbox-hide-zero",
                                      type: "checkbox",
                                      checked: settings.hideOnZero,
                                      onChange: (e) =>
                                        handleSettingChange(
                                          "hideOnZero",
                                          e.target.checked
                                        ),
                                    }),
                                    React.createElement(
                                      "span",
                                      { key: "text-hide-zero" },
                                      "Ocultar cuando no hay eventos"
                                    ),
                                  ]
                                ),
                              ]
                            ),
                            React.createElement(
                              "div",
                              {
                                key: "workdays-only",
                                className: "setting-group-compact",
                              },
                              [
                                React.createElement(
                                  "label",
                                  {
                                    key: "label-workdays-only",
                                    className: "checkbox-label-horizontal",
                                  },
                                  [
                                    React.createElement("input", {
                                      key: "checkbox-workdays-only",
                                      type: "checkbox",
                                      checked: settings.showOnlyWorkdays,
                                      onChange: (e) =>
                                        handleSettingChange(
                                          "showOnlyWorkdays",
                                          e.target.checked
                                        ),
                                    }),
                                    React.createElement(
                                      "span",
                                      { key: "text-workdays-only" },
                                      "Mostrar solo en días laborales"
                                    ),
                                  ]
                                ),
                              ]
                            ),
                          ]
                        ),
                        React.createElement(
                          "h4",
                          {
                            key: "css-title",
                            className: "subsection-title-compact",
                          },
                          "CSS Personalizado"
                        ),
                        React.createElement(
                          "div",
                          {
                            key: "custom-css-group",
                            className: "setting-group-horizontal",
                          },
                          [
                            React.createElement(
                              "label",
                              {
                                key: "label-custom-css",
                                className: "checkbox-label-horizontal",
                              },
                              [
                                React.createElement("input", {
                                  key: "checkbox-custom-css",
                                  type: "checkbox",
                                  checked: settings.customCSSEnabled,
                                  onChange: (e) =>
                                    handleSettingChange(
                                      "customCSSEnabled",
                                      e.target.checked
                                    ),
                                }),
                                React.createElement(
                                  "span",
                                  { key: "text-custom-css" },
                                  "Habilitar CSS personalizado"
                                ),
                              ]
                            ),
                            settings.customCSSEnabled &&
                              React.createElement("textarea", {
                                key: "textarea-custom-css",
                                value: settings.customCSS,
                                onChange: (e) =>
                                  handleSettingChange(
                                    "customCSS",
                                    e.target.value
                                  ),
                                placeholder:
                                  "/* Ingresa tu CSS personalizado aquí */\n.event-counter-badge {\n  /* tus estilos */\n}",
                                className: "setting-textarea-horizontal",
                                rows: 6,
                              }),
                          ]
                        ),
                      ]
                    ),
                  // La pestaña TaskManager ya no se renderiza aquí porque fue eliminada de `tabs` y su lógica
                ]
              ),
              React.createElement(
                "div",
                {
                  key: "footer-actions",
                  className: "settings-footer-horizontal",
                },
                [
                  React.createElement(
                    "button",
                    {
                      key: "reset-btn",
                      onClick: handleReset,
                      className: "reset-button-horizontal",
                    },
                    "🔄 Resetear Todo"
                  ),
                  React.createElement(
                    "div",
                    { key: "info-autosave" },
                    React.createElement(
                      "small",
                      { key: "autosave-text" },
                      "Los cambios se guardan automáticamente"
                    )
                  ),
                ]
              ),
            ]
          ),
          React.createElement(
            "div",
            { key: "right-column", className: "settings-right-column" },
            [
              React.createElement(
                "div",
                {
                  key: "preview-section",
                  className: "settings-section-sticky",
                },
                [
                  React.createElement(
                    "h4",
                    { key: "title-preview" },
                    "🎯 Vista Previa"
                  ),
                  // El segundo hijo (condicional) del array de "preview-section"
                  settings
                    ? React.createElement(
                        React.Fragment,
                        { key: "badge-preview-content-wrapper" },
                        createBadgePreview()
                      )
                    : React.createElement(
                        "div",
                        { key: "loading-preview-text" },
                        "Cargando preview..."
                      ),
                ]
              ),
            ]
          ),
        ]
      ),
      isSaving &&
        React.createElement(
          "div",
          {
            key: "floating-notification",
            className: "floating-save-notification",
          },
          [
            React.createElement("span", { key: "icon-saving" }, "💾"),
            React.createElement("span", { key: "text-saving" }, "Guardando..."),
          ]
        ),
    ]
  );
}

// ELIMINADO: Todo el código de TaskManagerPage, TaskItem, y TaskForm

export default SettingsPanel;
