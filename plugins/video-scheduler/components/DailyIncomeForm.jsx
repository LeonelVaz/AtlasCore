// video-scheduler/components/DailyIncomeForm.jsx
import React from "react";
// Importar ALL_SUPPORTED_CURRENCIES para el selector
import {
  DEFAULT_DAILY_INCOME_STRUCTURE,
  ALL_SUPPORTED_CURRENCIES,
} from "../utils/constants.js";

function DailyIncomeForm(props) {
  const { day, existingIncome, onSave, onCancel, styleProps, plugin } = props; // plugin añadido para acceder a config
  const popupRef = React.useRef(null);

  // Obtener configuración de moneda del plugin
  const currencyConfig = plugin._pluginData.settings;
  const mainUserCurrency = currencyConfig.mainUserCurrency;
  // Las monedas disponibles para ingresos son las configuradas por el usuario
  const availableIncomeCurrencies =
    currencyConfig.configuredIncomeCurrencies || [mainUserCurrency];

  const initialData = existingIncome || {
    ...DEFAULT_DAILY_INCOME_STRUCTURE,
    currency: mainUserCurrency, // Por defecto, la moneda principal del usuario
  };

  const [amount, setAmount] = React.useState(initialData.amount);
  const [currency, setCurrency] = React.useState(
    // Asegurar que la moneda inicial sea una de las configuradas, sino usar la principal
    availableIncomeCurrencies.includes(initialData.currency)
      ? initialData.currency
      : mainUserCurrency
  );
  const [payer, setPayer] = React.useState(initialData.payer);
  const [status, setStatus] = React.useState(initialData.status);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onCancel();
      }
    };
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onCancel]);

  React.useEffect(() => {
    const currentInitialData = existingIncome || {
      ...DEFAULT_DAILY_INCOME_STRUCTURE,
      currency: mainUserCurrency,
    };
    setAmount(currentInitialData.amount);
    setCurrency(
      availableIncomeCurrencies.includes(currentInitialData.currency)
        ? currentInitialData.currency
        : mainUserCurrency
    );
    setPayer(currentInitialData.payer);
    setStatus(currentInitialData.status);
  }, [existingIncome, mainUserCurrency, availableIncomeCurrencies]); // Depender de availableIncomeCurrencies

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(day, {
      amount: parseFloat(amount) || 0,
      currency,
      payer: payer.trim(),
      status,
    });
  };

  return React.createElement(
    "div",
    { ref: popupRef, className: "daily-income-form-popup", style: styleProps },
    [
      React.createElement("h4", { key: "dif-title" }, `Ingreso del Día ${day}`),
      React.createElement("form", { key: "dif-form", onSubmit: handleSubmit }, [
        React.createElement(
          "div",
          { key: "dif-amount-group", className: "form-group" },
          [
            React.createElement(
              "label",
              { key: "amount-label", htmlFor: `dif-amount-${day}` },
              "Monto: "
            ),
            React.createElement("input", {
              key: "amount-input",
              type: "number",
              id: `dif-amount-${day}`,
              value: amount,
              onChange: (e) => setAmount(e.target.value),
              step: "0.01",
              min: "0",
            }),
          ]
        ),
        React.createElement(
          "div",
          { key: "dif-currency-group", className: "form-group" },
          [
            React.createElement(
              "label",
              { key: "currency-label", htmlFor: `dif-currency-${day}` },
              "Moneda: "
            ),
            React.createElement(
              "select",
              {
                key: "currency-select",
                id: `dif-currency-${day}`,
                value: currency,
                onChange: (e) => setCurrency(e.target.value),
              },
              // Mapear sobre las monedas configuradas por el usuario
              availableIncomeCurrencies.map((code) => {
                const currencyInfo = ALL_SUPPORTED_CURRENCIES.find(
                  (c) => c.code === code
                );
                return React.createElement(
                  "option",
                  { key: `currency-${code}`, value: code },
                  `${currencyInfo ? currencyInfo.name : code} (${code})`
                );
              })
            ),
          ]
        ),
        React.createElement(
          "div",
          { key: "dif-payer-group", className: "form-group" },
          [
            React.createElement(
              "label",
              { key: "payer-label", htmlFor: `dif-payer-${day}` },
              "Pagador: "
            ),
            React.createElement("input", {
              key: "payer-input",
              type: "text",
              id: `dif-payer-${day}`,
              value: payer,
              onChange: (e) => setPayer(e.target.value),
            }),
          ]
        ),
        React.createElement(
          "div",
          { key: "dif-status-group", className: "form-group" },
          [
            React.createElement(
              "label",
              { key: "status-label", htmlFor: `dif-inc-status-${day}` },
              "Estado Pago: "
            ),
            React.createElement(
              "select",
              {
                key: "status-select",
                id: `dif-inc-status-${day}`,
                value: status,
                onChange: (e) => setStatus(e.target.value),
              },
              [
                React.createElement(
                  "option",
                  { key: "status-pending", value: "pending" },
                  "Pendiente"
                ),
                React.createElement(
                  "option",
                  { key: "status-paid", value: "paid" },
                  "Pagado"
                ),
              ]
            ),
          ]
        ),
        React.createElement(
          "div",
          { key: "dif-actions", className: "form-actions" },
          [
            React.createElement(
              "button",
              {
                key: "cancel-button",
                type: "button",
                onClick: onCancel,
                className: "button-secondary",
              },
              "Cancelar"
            ),
            React.createElement(
              "button",
              {
                key: "submit-button",
                type: "submit",
                className: "button-primary",
              },
              "Guardar Ingreso"
            ),
          ]
        ),
      ]),
    ]
  );
}

export default DailyIncomeForm;
