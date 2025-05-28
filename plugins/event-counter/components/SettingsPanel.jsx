import React from "react";

function SettingsPanel(props) {
  const [settings, setSettings] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setSaving] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("appearance");
  const [previewCount, setPreviewCount] = React.useState(5);

  // Cargar configuraciones iniciales
  React.useEffect(() => {
    try {
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

  // Función auxiliar para guardar configuraciones
  const saveSettings = async (newSettings) => {
    try {
      setSaving(true);
      await props.plugin.publicAPI.updateSettings(newSettings);

      // Mostrar feedback visual
      setTimeout(() => setSaving(false), 1000);
    } catch (error) {
      console.error("[SettingsPanel Pro] Error al guardar:", error);
      setSaving(false);
    }
  };

  // Manejadores de cambios
  const handleSettingChange = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleNestedSettingChange = async (parentKey, childKey, value) => {
    const newSettings = {
      ...settings,
      [parentKey]: {
        ...settings[parentKey],
        [childKey]: value,
      },
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
          [field]: field === "color" ? value : parseInt(value) || 0,
        },
      },
    };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  // Aplicar preset
  const handleApplyPreset = async (presetId) => {
    try {
      await props.plugin.publicAPI.applyPreset(presetId);
      const updatedSettings = props.plugin.publicAPI.getSettings();
      setSettings(updatedSettings);
    } catch (error) {
      console.error("[SettingsPanel Pro] Error aplicando preset:", error);
    }
  };

  // Resetear configuración
  const handleReset = async () => {
    if (
      confirm("¿Estás seguro de que quieres resetear toda la configuración?")
    ) {
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
        showShadow: true,
        shadowIntensity: "medium",
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

  // Vista de carga
  if (isLoading) {
    return React.createElement("div", { className: "settings-panel-loading" }, [
      React.createElement("div", {
        key: "spinner",
        className: "loading-spinner",
      }),
      React.createElement("p", { key: "text" }, "Cargando configuración..."),
    ]);
  }

  if (!settings) {
    return React.createElement(
      "div",
      { className: "settings-panel-error" },
      "Error al cargar la configuración del contador de eventos"
    );
  }

  // Función para crear el preview del badge
  const createBadgePreview = () => {
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
            React.createElement("label", { key: "label" }, "Vista previa:"),
            React.createElement("input", {
              key: "input",
              type: "range",
              min: "0",
              max: "20",
              value: previewCount,
              onChange: (e) => setPreviewCount(parseInt(e.target.value)),
              className: "preview-slider",
            }),
            React.createElement(
              "span",
              { key: "value" },
              previewCount + " eventos"
            ),
          ]
        ),
      ]
    );
  };

  // Pestañas del panel
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
      // Header del panel
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
          isSaving &&
            React.createElement(
              "div",
              { key: "saving", className: "saving-indicator" },
              "💾 Guardando..."
            ),
        ]
      ),

      // Vista previa
      React.createElement(
        "div",
        { key: "preview-section", className: "settings-section" },
        [
          React.createElement("h4", { key: "title" }, "Vista Previa"),
          createBadgePreview(),
        ]
      ),

      // Presets rápidos
      React.createElement(
        "div",
        { key: "presets-section", className: "settings-section" },
        [
          React.createElement("h4", { key: "title" }, "🎯 Presets Rápidos"),
          React.createElement(
            "div",
            { key: "presets", className: "presets-grid" },
            props.plugin.publicAPI.getAvailablePresets().map((preset) =>
              React.createElement(
                "button",
                {
                  key: preset.id,
                  className: "preset-button",
                  onClick: () => handleApplyPreset(preset.id),
                  title: preset.description,
                },
                [
                  React.createElement("strong", { key: "name" }, preset.name),
                  React.createElement(
                    "small",
                    { key: "desc" },
                    preset.description
                  ),
                ]
              )
            )
          ),
        ]
      ),

      // Navegación por tabs
      React.createElement(
        "div",
        { key: "tabs", className: "settings-tabs" },
        tabs.map((tab) =>
          React.createElement(
            "button",
            {
              key: tab.id,
              className: `tab-button ${activeTab === tab.id ? "active" : ""}`,
              onClick: () => setActiveTab(tab.id),
            },
            `${tab.icon} ${tab.label}`
          )
        )
      ),

      // Contenido de las pestañas
      React.createElement(
        "div",
        { key: "tab-content", className: "tab-content" },
        [
          // PESTAÑA: APARIENCIA
          activeTab === "appearance" &&
            React.createElement(
              "div",
              { key: "appearance", className: "tab-panel" },
              [
                // Estilo del badge
                React.createElement(
                  "div",
                  { key: "style", className: "setting-group" },
                  [
                    React.createElement(
                      "label",
                      { key: "label", className: "setting-label" },
                      "Estilo del Contador"
                    ),
                    React.createElement(
                      "select",
                      {
                        key: "select",
                        value: settings.badgeStyle,
                        onChange: (e) =>
                          handleSettingChange("badgeStyle", e.target.value),
                        className: "setting-select",
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
                        React.createElement(
                          "option",
                          { key: "modern", value: "modern" },
                          "Moderno"
                        ),
                      ]
                    ),
                  ]
                ),

                // Posición del badge
                React.createElement(
                  "div",
                  { key: "position", className: "setting-group" },
                  [
                    React.createElement(
                      "label",
                      { key: "label", className: "setting-label" },
                      "Posición del Contador"
                    ),
                    React.createElement(
                      "select",
                      {
                        key: "select",
                        value: settings.badgePosition,
                        onChange: (e) =>
                          handleSettingChange("badgePosition", e.target.value),
                        className: "setting-select",
                      },
                      [
                        React.createElement(
                          "option",
                          { key: "tl", value: "top-left" },
                          "Superior Izquierda"
                        ),
                        React.createElement(
                          "option",
                          { key: "tr", value: "top-right" },
                          "Superior Derecha"
                        ),
                        React.createElement(
                          "option",
                          { key: "bl", value: "bottom-left" },
                          "Inferior Izquierda"
                        ),
                        React.createElement(
                          "option",
                          { key: "br", value: "bottom-right" },
                          "Inferior Derecha"
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

                // Tamaño del badge
                React.createElement(
                  "div",
                  { key: "size", className: "setting-group" },
                  [
                    React.createElement(
                      "label",
                      { key: "label", className: "setting-label" },
                      "Tamaño del Contador"
                    ),
                    React.createElement(
                      "select",
                      {
                        key: "select",
                        value: settings.badgeSize,
                        onChange: (e) =>
                          handleSettingChange("badgeSize", e.target.value),
                        className: "setting-select",
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
            ),

          // PESTAÑA: COLORES
          activeTab === "colors" &&
            React.createElement(
              "div",
              { key: "colors", className: "tab-panel" },
              [
                // Modo de colores
                React.createElement(
                  "div",
                  { key: "color-mode", className: "setting-group" },
                  [
                    React.createElement(
                      "label",
                      {
                        key: "label",
                        className: "setting-label checkbox-label",
                      },
                      [
                        React.createElement("input", {
                          key: "checkbox",
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
                          { key: "text" },
                          "Usar colores diferentes según cantidad"
                        ),
                      ]
                    ),
                    React.createElement(
                      "p",
                      { key: "description", className: "setting-description" },
                      settings.useMultipleColors
                        ? "Los contadores cambiarán de color según la cantidad de eventos"
                        : "Todos los contadores usarán el mismo color"
                    ),
                  ]
                ),

                // Color único
                !settings.useMultipleColors &&
                  React.createElement(
                    "div",
                    { key: "single-color", className: "setting-group" },
                    [
                      React.createElement(
                        "label",
                        { key: "label", className: "setting-label" },
                        "Color del Contador"
                      ),
                      React.createElement(
                        "div",
                        { key: "color-input", className: "color-input-group" },
                        [
                          React.createElement("input", {
                            key: "input",
                            type: "color",
                            value: settings.singleColor,
                            onChange: (e) =>
                              handleSettingChange(
                                "singleColor",
                                e.target.value
                              ),
                            className: "setting-color-input",
                          }),
                          React.createElement(
                            "span",
                            {
                              key: "preview",
                              className: "color-preview-badge",
                            },
                            "5"
                          ),
                          React.createElement(
                            "code",
                            { key: "code", className: "color-code" },
                            settings.singleColor
                          ),
                        ]
                      ),
                    ]
                  ),

                // Rangos de colores
                settings.useMultipleColors &&
                  React.createElement(
                    "div",
                    { key: "color-ranges", className: "setting-group" },
                    [
                      React.createElement(
                        "h4",
                        { key: "title", className: "subsection-title" },
                        "Configuración de Rangos"
                      ),

                      // Rango 1
                      React.createElement(
                        "div",
                        { key: "range1", className: "range-config" },
                        [
                          React.createElement(
                            "h5",
                            { key: "title" },
                            "Rango 1 (Pocos eventos)"
                          ),
                          React.createElement(
                            "div",
                            { key: "controls", className: "range-controls" },
                            [
                              React.createElement(
                                "div",
                                { key: "min", className: "range-input" },
                                [
                                  React.createElement(
                                    "label",
                                    { key: "label" },
                                    "Desde:"
                                  ),
                                  React.createElement("input", {
                                    key: "input",
                                    type: "number",
                                    min: "1",
                                    value: settings.colorRanges.range1.min,
                                    onChange: (e) =>
                                      handleRangeChange(
                                        "range1",
                                        "min",
                                        e.target.value
                                      ),
                                    className: "setting-number-input",
                                  }),
                                ]
                              ),
                              React.createElement(
                                "div",
                                { key: "max", className: "range-input" },
                                [
                                  React.createElement(
                                    "label",
                                    { key: "label" },
                                    "Hasta:"
                                  ),
                                  React.createElement("input", {
                                    key: "input",
                                    type: "number",
                                    min: settings.colorRanges.range1.min,
                                    value: settings.colorRanges.range1.max,
                                    onChange: (e) =>
                                      handleRangeChange(
                                        "range1",
                                        "max",
                                        e.target.value
                                      ),
                                    className: "setting-number-input",
                                  }),
                                ]
                              ),
                              React.createElement(
                                "div",
                                { key: "color", className: "range-input" },
                                [
                                  React.createElement(
                                    "label",
                                    { key: "label" },
                                    "Color:"
                                  ),
                                  React.createElement("input", {
                                    key: "input",
                                    type: "color",
                                    value: settings.colorRanges.range1.color,
                                    onChange: (e) =>
                                      handleRangeChange(
                                        "range1",
                                        "color",
                                        e.target.value
                                      ),
                                    className: "setting-color-input",
                                  }),
                                ]
                              ),
                            ]
                          ),
                        ]
                      ),

                      // Rango 2
                      React.createElement(
                        "div",
                        { key: "range2", className: "range-config" },
                        [
                          React.createElement(
                            "h5",
                            { key: "title" },
                            "Rango 2 (Eventos moderados)"
                          ),
                          React.createElement(
                            "div",
                            { key: "controls", className: "range-controls" },
                            [
                              React.createElement(
                                "div",
                                { key: "min", className: "range-input" },
                                [
                                  React.createElement(
                                    "label",
                                    { key: "label" },
                                    "Desde:"
                                  ),
                                  React.createElement("input", {
                                    key: "input",
                                    type: "number",
                                    min: settings.colorRanges.range1.max + 1,
                                    value: settings.colorRanges.range2.min,
                                    onChange: (e) =>
                                      handleRangeChange(
                                        "range2",
                                        "min",
                                        e.target.value
                                      ),
                                    className: "setting-number-input",
                                  }),
                                ]
                              ),
                              React.createElement(
                                "div",
                                { key: "max", className: "range-input" },
                                [
                                  React.createElement(
                                    "label",
                                    { key: "label" },
                                    "Hasta:"
                                  ),
                                  React.createElement("input", {
                                    key: "input",
                                    type: "number",
                                    min: settings.colorRanges.range2.min,
                                    value: settings.colorRanges.range2.max,
                                    onChange: (e) =>
                                      handleRangeChange(
                                        "range2",
                                        "max",
                                        e.target.value
                                      ),
                                    className: "setting-number-input",
                                  }),
                                ]
                              ),
                              React.createElement(
                                "div",
                                { key: "color", className: "range-input" },
                                [
                                  React.createElement(
                                    "label",
                                    { key: "label" },
                                    "Color:"
                                  ),
                                  React.createElement("input", {
                                    key: "input",
                                    type: "color",
                                    value: settings.colorRanges.range2.color,
                                    onChange: (e) =>
                                      handleRangeChange(
                                        "range2",
                                        "color",
                                        e.target.value
                                      ),
                                    className: "setting-color-input",
                                  }),
                                ]
                              ),
                            ]
                          ),
                        ]
                      ),

                      // Rango 3
                      React.createElement(
                        "div",
                        { key: "range3", className: "range-config" },
                        [
                          React.createElement(
                            "h5",
                            { key: "title" },
                            "Rango 3 (Muchos eventos)"
                          ),
                          React.createElement(
                            "div",
                            { key: "controls", className: "range-controls" },
                            [
                              React.createElement(
                                "div",
                                { key: "min", className: "range-input" },
                                [
                                  React.createElement(
                                    "label",
                                    { key: "label" },
                                    "Desde:"
                                  ),
                                  React.createElement("input", {
                                    key: "input",
                                    type: "number",
                                    min: settings.colorRanges.range2.max + 1,
                                    value: settings.colorRanges.range3.min,
                                    onChange: (e) =>
                                      handleRangeChange(
                                        "range3",
                                        "min",
                                        e.target.value
                                      ),
                                    className: "setting-number-input",
                                  }),
                                ]
                              ),
                              React.createElement(
                                "div",
                                { key: "color", className: "range-input" },
                                [
                                  React.createElement(
                                    "label",
                                    { key: "label" },
                                    "Color:"
                                  ),
                                  React.createElement("input", {
                                    key: "input",
                                    type: "color",
                                    value: settings.colorRanges.range3.color,
                                    onChange: (e) =>
                                      handleRangeChange(
                                        "range3",
                                        "color",
                                        e.target.value
                                      ),
                                    className: "setting-color-input",
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

          // PESTAÑA: TIPOGRAFÍA
          activeTab === "typography" &&
            React.createElement(
              "div",
              { key: "typography", className: "tab-panel" },
              [
                // Familia de fuente
                React.createElement(
                  "div",
                  { key: "font-family", className: "setting-group" },
                  [
                    React.createElement(
                      "label",
                      { key: "label", className: "setting-label" },
                      "Familia de Fuente"
                    ),
                    React.createElement(
                      "select",
                      {
                        key: "select",
                        value: settings.fontFamily,
                        onChange: (e) =>
                          handleSettingChange("fontFamily", e.target.value),
                        className: "setting-select",
                      },
                      [
                        React.createElement(
                          "option",
                          { key: "system", value: "system" },
                          "Sistema (Por defecto)"
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

                // Tamaño de fuente
                React.createElement(
                  "div",
                  { key: "font-size", className: "setting-group" },
                  [
                    React.createElement(
                      "label",
                      { key: "label", className: "setting-label" },
                      "Tamaño de Fuente"
                    ),
                    React.createElement(
                      "select",
                      {
                        key: "select",
                        value: settings.fontSize,
                        onChange: (e) =>
                          handleSettingChange("fontSize", e.target.value),
                        className: "setting-select",
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

                // Peso de fuente
                React.createElement(
                  "div",
                  { key: "font-weight", className: "setting-group" },
                  [
                    React.createElement(
                      "label",
                      { key: "label", className: "setting-label" },
                      "Peso de Fuente"
                    ),
                    React.createElement(
                      "select",
                      {
                        key: "select",
                        value: settings.fontWeight,
                        onChange: (e) =>
                          handleSettingChange("fontWeight", e.target.value),
                        className: "setting-select",
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

                // Color de texto
                React.createElement(
                  "div",
                  { key: "text-color", className: "setting-group" },
                  [
                    React.createElement(
                      "label",
                      { key: "label", className: "setting-label" },
                      "Color del Texto"
                    ),
                    React.createElement(
                      "select",
                      {
                        key: "select",
                        value: settings.textColor,
                        onChange: (e) =>
                          handleSettingChange("textColor", e.target.value),
                        className: "setting-select",
                      },
                      [
                        React.createElement(
                          "option",
                          { key: "auto", value: "auto" },
                          "Automático (Mejor contraste)"
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
            ),

          // PESTAÑA: EFECTOS
          activeTab === "effects" &&
            React.createElement(
              "div",
              { key: "effects", className: "tab-panel" },
              [
                // Sombras
                React.createElement(
                  "div",
                  { key: "shadow", className: "setting-group" },
                  [
                    React.createElement(
                      "label",
                      {
                        key: "label",
                        className: "setting-label checkbox-label",
                      },
                      [
                        React.createElement("input", {
                          key: "checkbox",
                          type: "checkbox",
                          checked: settings.showShadow,
                          onChange: (e) =>
                            handleSettingChange("showShadow", e.target.checked),
                        }),
                        React.createElement(
                          "span",
                          { key: "text" },
                          "Mostrar sombra"
                        ),
                      ]
                    ),
                    settings.showShadow &&
                      React.createElement(
                        "select",
                        {
                          key: "intensity",
                          value: settings.shadowIntensity,
                          onChange: (e) =>
                            handleSettingChange(
                              "shadowIntensity",
                              e.target.value
                            ),
                          className: "setting-select setting-indent",
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

                // Bordes
                React.createElement(
                  "div",
                  { key: "border", className: "setting-group" },
                  [
                    React.createElement(
                      "label",
                      {
                        key: "label",
                        className: "setting-label checkbox-label",
                      },
                      [
                        React.createElement("input", {
                          key: "checkbox",
                          type: "checkbox",
                          checked: settings.showBorder,
                          onChange: (e) =>
                            handleSettingChange("showBorder", e.target.checked),
                        }),
                        React.createElement(
                          "span",
                          { key: "text" },
                          "Mostrar borde"
                        ),
                      ]
                    ),
                    settings.showBorder &&
                      React.createElement(
                        "div",
                        {
                          key: "border-controls",
                          className: "border-controls setting-indent",
                        },
                        [
                          React.createElement(
                            "div",
                            { key: "color", className: "border-input" },
                            [
                              React.createElement(
                                "label",
                                { key: "label" },
                                "Color:"
                              ),
                              React.createElement("input", {
                                key: "input",
                                type: "color",
                                value: settings.borderColor,
                                onChange: (e) =>
                                  handleSettingChange(
                                    "borderColor",
                                    e.target.value
                                  ),
                                className: "setting-color-input",
                              }),
                            ]
                          ),
                          React.createElement(
                            "div",
                            { key: "width", className: "border-input" },
                            [
                              React.createElement(
                                "label",
                                { key: "label" },
                                "Grosor:"
                              ),
                              React.createElement("input", {
                                key: "input",
                                type: "number",
                                min: "1",
                                max: "5",
                                value: settings.borderWidth,
                                onChange: (e) =>
                                  handleSettingChange(
                                    "borderWidth",
                                    parseInt(e.target.value)
                                  ),
                                className: "setting-number-input",
                              }),
                            ]
                          ),
                        ]
                      ),
                  ]
                ),

                // Animaciones
                React.createElement(
                  "div",
                  { key: "animations", className: "setting-group" },
                  [
                    React.createElement(
                      "label",
                      {
                        key: "label",
                        className: "setting-label checkbox-label",
                      },
                      [
                        React.createElement("input", {
                          key: "checkbox",
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
                          { key: "text" },
                          "Habilitar animaciones"
                        ),
                      ]
                    ),
                    settings.enableAnimations &&
                      React.createElement(
                        "select",
                        {
                          key: "animation-type",
                          value: settings.animationType,
                          onChange: (e) =>
                            handleSettingChange(
                              "animationType",
                              e.target.value
                            ),
                          className: "setting-select setting-indent",
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

                // Efectos hover
                React.createElement(
                  "div",
                  { key: "hover", className: "setting-group" },
                  [
                    React.createElement(
                      "label",
                      {
                        key: "label",
                        className: "setting-label checkbox-label",
                      },
                      [
                        React.createElement("input", {
                          key: "checkbox",
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
                          { key: "text" },
                          "Efectos al pasar el mouse"
                        ),
                      ]
                    ),
                  ]
                ),
              ]
            ),

          // PESTAÑA: AVANZADO
          activeTab === "advanced" &&
            React.createElement(
              "div",
              { key: "advanced", className: "tab-panel" },
              [
                // Opciones de visibilidad
                React.createElement(
                  "h4",
                  { key: "visibility-title", className: "subsection-title" },
                  "Opciones de Visibilidad"
                ),

                React.createElement(
                  "div",
                  { key: "hide-zero", className: "setting-group" },
                  [
                    React.createElement(
                      "label",
                      {
                        key: "label",
                        className: "setting-label checkbox-label",
                      },
                      [
                        React.createElement("input", {
                          key: "checkbox",
                          type: "checkbox",
                          checked: settings.hideOnZero,
                          onChange: (e) =>
                            handleSettingChange("hideOnZero", e.target.checked),
                        }),
                        React.createElement(
                          "span",
                          { key: "text" },
                          "Ocultar cuando no hay eventos"
                        ),
                      ]
                    ),
                  ]
                ),

                React.createElement(
                  "div",
                  { key: "workdays-only", className: "setting-group" },
                  [
                    React.createElement(
                      "label",
                      {
                        key: "label",
                        className: "setting-label checkbox-label",
                      },
                      [
                        React.createElement("input", {
                          key: "checkbox",
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
                          { key: "text" },
                          "Mostrar solo en días laborales"
                        ),
                      ]
                    ),
                  ]
                ),

                // CSS Personalizado
                React.createElement(
                  "h4",
                  { key: "css-title", className: "subsection-title" },
                  "CSS Personalizado"
                ),

                React.createElement(
                  "div",
                  { key: "custom-css", className: "setting-group" },
                  [
                    React.createElement(
                      "label",
                      {
                        key: "label",
                        className: "setting-label checkbox-label",
                      },
                      [
                        React.createElement("input", {
                          key: "checkbox",
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
                          { key: "text" },
                          "Habilitar CSS personalizado"
                        ),
                      ]
                    ),
                    settings.customCSSEnabled &&
                      React.createElement("textarea", {
                        key: "textarea",
                        value: settings.customCSS,
                        onChange: (e) =>
                          handleSettingChange("customCSS", e.target.value),
                        placeholder:
                          "/* Ingresa tu CSS personalizado aquí */\n.event-counter-badge {\n  /* tus estilos */\n}",
                        className: "setting-textarea",
                        rows: 8,
                      }),
                  ]
                ),
              ]
            ),
        ]
      ),

      // Footer con acciones
      React.createElement(
        "div",
        { key: "footer", className: "settings-footer" },
        [
          React.createElement(
            "button",
            {
              key: "reset",
              onClick: handleReset,
              className: "reset-button",
            },
            "🔄 Resetear Todo"
          ),
          React.createElement(
            "div",
            { key: "info" },
            React.createElement(
              "small",
              {},
              "Los cambios se guardan automáticamente"
            )
          ),
        ]
      ),
    ]
  );
}

export default SettingsPanel;
