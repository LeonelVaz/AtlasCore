// video-scheduler/components/DailyIncomeForm.jsx
import React from "react";
import {
  DEFAULT_DAILY_INCOME_STRUCTURE,
  ALL_SUPPORTED_CURRENCIES,
} from "../utils/constants.js";

function DailyIncomeForm(props) {
  const {
    day,
    existingIncome,
    onSave,
    onCancel,
    onDelete,
    plugin,
    styleProps,
  } = props;
  const popupRef = React.useRef(null);
  const core = plugin._core;

  const currencyConfig = plugin._pluginData.settings;
  const mainUserCurrency = currencyConfig.mainUserCurrency;
  const availableIncomeCurrencies =
    currencyConfig.configuredIncomeCurrencies || [mainUserCurrency];

  const initialData = existingIncome || {
    ...DEFAULT_DAILY_INCOME_STRUCTURE,
    currency: mainUserCurrency,
  };

  const [amount, setAmount] = React.useState(initialData.amount);
  const [currency, setCurrency] = React.useState(
    availableIncomeCurrencies.includes(initialData.currency)
      ? initialData.currency
      : mainUserCurrency
  );
  const [payer, setPayer] = React.useState(initialData.payer);
  const [status, setStatus] = React.useState(initialData.status);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onCancel(); // El botón Cancelar o el click afuera llaman a onCancel
      }
    };
    const timeoutId = setTimeout(
      () => document.addEventListener("mousedown", handleClickOutside),
      100
    );
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onCancel]);

  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onCancel(); // Escape también llama a onCancel
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
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
  }, [existingIncome, mainUserCurrency, availableIncomeCurrencies]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(day, {
      amount: parseFloat(amount) || 0,
      currency,
      payer: payer.trim(),
      status,
    });
  };

  const handleDeleteClick = async () => {
    if (existingIncome && existingIncome.amount > 0) {
      if (core && core.dialogs && core.dialogs.confirm) {
        try {
          const message = `¿Estás seguro de que quieres eliminar el ingreso del día ${day}? Esta acción no se puede deshacer.`;
          const title = "Confirmar Eliminación";
          const confirmed = await core.dialogs.confirm(message, title);
          if (confirmed) {
            if (onDelete) {
              onDelete(day); // onDelete se encargará de cerrar el popup a través de VideoSchedulerMainPage
            }
          }
          // Si no se confirma, el popup permanece abierto.
          // No se llama a onCancel() aquí explícitamente, el usuario puede cerrar con ESC o click afuera.
        } catch (error) {
          console.log(
            "[DailyIncomeForm] Diálogo de confirmación cerrado o cancelado.",
            error
          );
        }
      } else {
        console.warn(
          "[DailyIncomeForm] core.dialogs.confirm no disponible, usando confirm() nativo."
        );
        if (
          confirm(
            `¿Estás seguro de que quieres eliminar el ingreso del día ${day}?`
          )
        ) {
          if (onDelete) {
            onDelete(day);
          }
        }
      }
    }
  };

  const incomeIsPresent = existingIncome && existingIncome.amount > 0;

  return React.createElement(
    "div",
    {
      ref: popupRef,
      className: "daily-income-form-popup",
      style: styleProps,
    },
    [
      React.createElement("h4", { key: "dif-title" }, `Ingreso del Día ${day}`),
      React.createElement("form", { key: "dif-form", onSubmit: handleSubmit }, [
        // ... (campos del formulario sin cambios) ...
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
            // Si hay un ingreso existente, mostrar "Eliminar"
            incomeIsPresent &&
              React.createElement(
                "button",
                {
                  key: "delete-button",
                  type: "button",
                  onClick: handleDeleteClick,
                  className: "button-danger",
                },
                "Eliminar"
              ),
            // Si NO hay un ingreso existente (creando nuevo), mostrar "Cancelar"
            !incomeIsPresent &&
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
            // El botón "Guardar Ingreso" siempre se muestra
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
