// video-scheduler/components/SettingsPanelWidget.jsx
import React from "react";
import { ALL_SUPPORTED_CURRENCIES } from "../utils/constants.js";

function SettingsPanelWidget(props) {
  const { plugin, core, pluginId } = props;
  const [currentSettings, setCurrentSettings] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [feedbackMessage, setFeedbackMessage] = React.useState({
    text: "",
    type: "",
  }); // type: 'success' or 'error'

  const loadSettings = React.useCallback(async () => {
    setIsLoading(true);
    try {
      if (
        plugin &&
        plugin.publicAPI &&
        plugin.publicAPI.getCurrencyConfiguration
      ) {
        const config = await plugin.publicAPI.getCurrencyConfiguration();
        setCurrentSettings(config);
      } else {
        throw new Error(
          "API del plugin no disponible para cargar configuración."
        );
      }
    } catch (error) {
      console.error(`[${pluginId}] Error al cargar la configuración:`, error);
      setFeedbackMessage({
        text: "Error al cargar configuración.",
        type: "error",
      });
      // Establecer un estado por defecto en caso de error para evitar que currentSettings sea null
      setCurrentSettings({
        mainUserCurrency: "USD",
        configuredIncomeCurrencies: ["USD"],
        currencyRates: { USD: 1 },
      });
    } finally {
      setIsLoading(false);
    }
  }, [plugin, pluginId]);

  React.useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleMainCurrencyChange = async (event) => {
    const newMainCurrency = event.target.value;
    if (
      !currentSettings ||
      newMainCurrency === currentSettings.mainUserCurrency
    )
      return;

    setIsSaving(true);
    setFeedbackMessage({ text: "", type: "" });
    try {
      // Necesitamos pasar las incomeCurrencies y rates actuales,
      // ya que la API saveCurrencyConfiguration espera todos los parámetros.
      await plugin.publicAPI.saveCurrencyConfiguration(
        newMainCurrency,
        currentSettings.configuredIncomeCurrencies,
        currentSettings.currencyRates
      );
      // Volver a cargar para reflejar los cambios (especialmente si saveCurrencyConfiguration ajusta algo)
      await loadSettings();
      setFeedbackMessage({
        text: "Moneda principal actualizada.",
        type: "success",
      });
    } catch (error) {
      console.error(
        `[${pluginId}] Error al guardar la moneda principal:`,
        error
      );
      setFeedbackMessage({
        text: "Error al guardar la moneda principal.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
      // Ocultar mensaje después de un tiempo
      setTimeout(() => setFeedbackMessage({ text: "", type: "" }), 3000);
    }
  };

  const handleManageRatesClick = () => {
    // Esta función ahora intenta emitir un evento global que la página principal podría escuchar.
    // O podría interactuar con una API de Atlas si existiera para mostrar modales.
    if (core && core.events && core.events.publish) {
      core.events.publish(pluginId, `${pluginId}.requestOpenCurrencyModal`, {});
      setFeedbackMessage({
        text: "Solicitud para abrir configuración de tasas enviada. Por favor, navega a la página principal del plugin si no se abre.",
        type: "info",
      });
      setTimeout(() => setFeedbackMessage({ text: "", type: "" }), 5000);
    } else {
      alert(
        "Funcionalidad para gestionar tasas detalladas disponible en la página principal del plugin."
      );
    }
  };

  if (isLoading || !currentSettings) {
    return React.createElement(
      "div",
      { className: `${pluginId}-settings-widget settings-widget loading` },
      "Cargando configuración..."
    );
  }

  return React.createElement(
    "div",
    { className: `${pluginId}-settings-widget settings-widget` },
    [
      React.createElement(
        "h3",
        { key: "title", className: "widget-title" },
        `${plugin.name} - Configuración`
      ),

      React.createElement(
        "div",
        { key: "main-currency-section", className: "setting-group" },
        [
          React.createElement(
            "label",
            {
              key: "label-main-currency",
              htmlFor: `${pluginId}-main-currency-select`,
              className: "setting-label",
            },
            "Moneda Principal de Visualización:"
          ),
          React.createElement(
            "select",
            {
              id: `${pluginId}-main-currency-select`,
              key: "select-main-currency",
              value: currentSettings.mainUserCurrency,
              onChange: handleMainCurrencyChange,
              disabled: isSaving,
              className: "setting-select",
            },
            ALL_SUPPORTED_CURRENCIES.map((c) =>
              React.createElement(
                "option",
                { key: `main-curr-${c.code}`, value: c.code },
                `${c.name} (${c.code})`
              )
            )
          ),
          React.createElement(
            "p",
            { key: "info-main-currency", className: "setting-description" },
            "Todas las estadísticas y totales se mostrarán en esta moneda. Las tasas de cambio se definirán en relación a ella."
          ),
        ]
      ),

      React.createElement(
        "div",
        { key: "manage-rates-section", className: "setting-group" },
        [
          React.createElement(
            "label",
            {
              key: "label-manage-rates",
              className: "setting-label",
            },
            "Gestión de Divisas de Ingreso y Tasas:"
          ),
          React.createElement(
            "button",
            {
              key: "btn-manage-rates",
              onClick: handleManageRatesClick,
              disabled: isSaving,
              className: "setting-button",
            },
            "Administrar Monedas y Tasas de Cambio"
          ),
          React.createElement(
            "p",
            { key: "info-manage-rates", className: "setting-description" },
            "Abre el diálogo para añadir/quitar monedas en las que recibes ingresos y configurar sus tasas de cambio relativas a tu moneda principal."
          ),
        ]
      ),

      feedbackMessage.text &&
        React.createElement(
          "div",
          {
            key: "feedback-msg",
            className: `feedback-message ${feedbackMessage.type}`,
            style: {
              // Estilos en línea para simplicidad, idealmente en CSS
              padding: "10px",
              marginTop: "15px",
              borderRadius: "4px",
              textAlign: "center",
              backgroundColor:
                feedbackMessage.type === "success"
                  ? "var(--success-bg, lightgreen)"
                  : feedbackMessage.type === "error"
                  ? "var(--danger-bg, lightcoral)"
                  : "var(--info-bg, lightblue)",
              color:
                feedbackMessage.type === "success"
                  ? "var(--success-text, darkgreen)"
                  : feedbackMessage.type === "error"
                  ? "var(--danger-text, darkred)"
                  : "var(--info-text, darkblue)",
              border: `1px solid ${
                feedbackMessage.type === "success"
                  ? "var(--success-color, green)"
                  : feedbackMessage.type === "error"
                  ? "var(--danger-color, red)"
                  : "var(--info-color, blue)"
              }`,
            },
          },
          feedbackMessage.text
        ),
    ]
  );
}

export default SettingsPanelWidget;
