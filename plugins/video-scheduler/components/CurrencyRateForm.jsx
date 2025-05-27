// video-scheduler/components/CurrencyRateForm.jsx
import React from "react";
import {
  ALL_SUPPORTED_CURRENCIES,
  getCurrencySymbol,
} from "../utils/constants.js";

function CurrencyRateForm(props) {
  const { initialConfiguration, onSave, onCancel, styleProps, plugin } = props;
  const modalRef = React.useRef(null);

  const [mainCurrency, setMainCurrency] = React.useState(
    initialConfiguration.mainUserCurrency
  );
  // incomeCurrencies es un array de códigos de moneda ['USD', 'EUR']
  const [incomeCurrencies, setIncomeCurrencies] = React.useState([
    ...initialConfiguration.configuredIncomeCurrencies,
  ]);
  // rates es un objeto { 'USD': 1, 'EUR': 1.08 }
  const [rates, setRates] = React.useState({
    ...initialConfiguration.currencyRates,
  });

  const [newCurrencyToAdd, setNewCurrencyToAdd] = React.useState("");

  React.useEffect(() => {
    setMainCurrency(initialConfiguration.mainUserCurrency);
    setIncomeCurrencies([...initialConfiguration.configuredIncomeCurrencies]);
    setRates({ ...initialConfiguration.currencyRates });
  }, [initialConfiguration]);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
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
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCancel]);

  const handleMainCurrencyChange = (e) => {
    const newMain = e.target.value;
    setMainCurrency(newMain);

    // Actualizar rates: la nueva moneda principal es 1, el resto necesita recalcularse o resetearse
    // Por simplicidad, vamos a resetear las tasas relativas, el usuario tendrá que reconfirmarlas.
    // Una lógica más avanzada podría intentar convertir.
    const newRates = { [newMain]: 1 };
    incomeCurrencies.forEach((code) => {
      if (code !== newMain) {
        // Mantener tasa si ya existe, sino poner 1 (para que el usuario ajuste)
        newRates[code] =
          rates[code] !== undefined &&
          code !== initialConfiguration.mainUserCurrency
            ? rates[code]
            : 1;
      }
    });
    setRates(newRates);

    // Asegurar que la nueva moneda principal esté en incomeCurrencies
    if (!incomeCurrencies.includes(newMain)) {
      setIncomeCurrencies((prev) => [...prev, newMain].sort());
    }
  };

  const handleAddIncomeCurrency = () => {
    if (newCurrencyToAdd && !incomeCurrencies.includes(newCurrencyToAdd)) {
      const updatedIncomeCurrencies = [
        ...incomeCurrencies,
        newCurrencyToAdd,
      ].sort();
      setIncomeCurrencies(updatedIncomeCurrencies);

      // Añadir tasa por defecto si no existe (relativa a la moneda principal)
      setRates((prevRates) => ({
        ...prevRates,
        [newCurrencyToAdd]:
          prevRates[newCurrencyToAdd] === undefined &&
          newCurrencyToAdd !== mainCurrency
            ? 1
            : prevRates[newCurrencyToAdd],
      }));
      setNewCurrencyToAdd(""); // Resetear selector
    }
  };

  const handleRemoveIncomeCurrency = (currencyCodeToRemove) => {
    if (currencyCodeToRemove === mainCurrency) {
      alert(
        "No puedes eliminar tu moneda principal de las divisas de ingreso."
      );
      return;
    }
    setIncomeCurrencies((prev) =>
      prev.filter((code) => code !== currencyCodeToRemove)
    );
    // Opcional: eliminar la tasa de rates, aunque la función de guardado lo limpiará
    setRates((prevRates) => {
      const newRates = { ...prevRates };
      delete newRates[currencyCodeToRemove];
      return newRates;
    });
  };

  const handleRateChange = (currencyCode) => (e) => {
    const value = e.target.value;
    const numericValue = value === "" ? "" : parseFloat(value);
    setRates((prev) => ({
      ...prev,
      [currencyCode]: numericValue,
    }));
  };

  const handleRateBlur = (currencyCode) => (e) => {
    let value = parseFloat(e.target.value);
    if (isNaN(value) || value <= 0) {
      // Restaurar al valor inicial o un default si no existe
      value = initialConfiguration.currencyRates[currencyCode] || 1;
    }
    setRates((prev) => ({
      ...prev,
      [currencyCode]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalRates = { ...rates };
    let ratesAreValid = true;

    incomeCurrencies.forEach((code) => {
      if (code !== mainCurrency) {
        const rateValue = parseFloat(finalRates[code]);
        if (isNaN(rateValue) || rateValue <= 0) {
          alert(
            `La tasa para ${code} (relativa a ${mainCurrency}) debe ser un número positivo.`
          );
          ratesAreValid = false;
        } else {
          finalRates[code] = rateValue;
        }
      } else {
        finalRates[code] = 1; // La moneda principal siempre es 1 contra sí misma
      }
    });

    if (!ratesAreValid) return;

    // Filtrar tasas para solo incluir las de incomeCurrencies
    const ratesToSave = {};
    incomeCurrencies.forEach((code) => {
      ratesToSave[code] = finalRates[code];
    });

    onSave(mainCurrency, incomeCurrencies, ratesToSave);
  };

  const availableCurrenciesForAdding = ALL_SUPPORTED_CURRENCIES.filter(
    (c) => !incomeCurrencies.includes(c.code)
  );

  return React.createElement(
    "div",
    { className: "currency-rate-form-overlay" },
    React.createElement(
      "div",
      {
        ref: modalRef,
        className: "currency-rate-form-modal",
        style: styleProps,
      },
      [
        React.createElement(
          "div",
          { key: "header", className: "currency-rate-form-header" },
          [
            React.createElement(
              "h3",
              { key: "title" },
              "⚙️ Configurar Monedas y Tasas"
            ),
            React.createElement(
              "button",
              {
                key: "close-btn",
                type: "button",
                className: "currency-rate-close-button",
                onClick: onCancel,
              },
              "✕"
            ),
          ]
        ),
        React.createElement(
          "form",
          {
            key: "form-wrapper",
            onSubmit: handleSubmit,
            className: "currency-rate-form-wrapper",
          },
          [
            React.createElement(
              "div",
              { key: "content", className: "currency-rate-form-content" },
              [
                React.createElement(
                  "div",
                  {
                    key: "main-currency-group",
                    className: "form-group-fullwidth",
                  },
                  [
                    React.createElement(
                      "label",
                      { key: "label-main", htmlFor: "select-main-currency" },
                      "Moneda Principal del Usuario:"
                    ),
                    React.createElement(
                      "select",
                      {
                        id: "select-main-currency",
                        key: "select-main",
                        value: mainCurrency,
                        onChange: handleMainCurrencyChange,
                        className: "main-currency-selector",
                      },
                      ALL_SUPPORTED_CURRENCIES.map((c) =>
                        React.createElement(
                          "option",
                          { key: `main-${c.code}`, value: c.code },
                          `${c.name} (${c.code})`
                        )
                      )
                    ),
                    React.createElement(
                      "p",
                      {
                        key: "main-info",
                        className: "currency-form-info-text",
                      },
                      "Esta es la moneda en la que se mostrarán los totales. Las tasas de otras monedas se definirán en relación a esta."
                    ),
                  ]
                ),
                React.createElement("hr", {
                  key: "divider1",
                  className: "form-divider",
                }),

                React.createElement(
                  "h4",
                  {
                    key: "income-currencies-title",
                    className: "form-section-title",
                  },
                  "Divisas de Ingreso y Tasas de Cambio"
                ),
                React.createElement(
                  "p",
                  { key: "rates-info", className: "currency-form-info-text" },
                  `Define las monedas en las que recibes ingresos y su valor equivalente a 1 unidad de tu moneda principal (${mainCurrency}).`
                ),

                React.createElement(
                  // Sección para añadir nuevas monedas de ingreso
                  "div",
                  {
                    key: "add-currency-section",
                    className: "add-currency-section form-row-compact",
                  },
                  [
                    React.createElement(
                      "select",
                      {
                        key: "select-add-currency",
                        value: newCurrencyToAdd,
                        onChange: (e) => setNewCurrencyToAdd(e.target.value),
                        className: "add-currency-select",
                      },
                      [
                        React.createElement(
                          "option",
                          { key: "empty-add", value: "" },
                          "Seleccionar divisa para añadir..."
                        ),
                        availableCurrenciesForAdding.map((c) =>
                          React.createElement(
                            "option",
                            { key: `add-${c.code}`, value: c.code },
                            `${c.name} (${c.code})`
                          )
                        ),
                      ]
                    ),
                    React.createElement(
                      "button",
                      {
                        key: "btn-add-currency",
                        type: "button",
                        onClick: handleAddIncomeCurrency,
                        disabled: !newCurrencyToAdd,
                        className: "button-add-currency",
                      },
                      "Añadir Divisa de Ingreso"
                    ),
                  ]
                ),

                React.createElement(
                  // Grid para mostrar y editar tasas
                  "div",
                  {
                    key: "rates-grid",
                    className: "currency-rates-editable-grid",
                  },
                  incomeCurrencies.map((code) => {
                    const currencyInfo = ALL_SUPPORTED_CURRENCIES.find(
                      (c) => c.code === code
                    );
                    const isMain = code === mainCurrency;
                    return React.createElement(
                      "div",
                      {
                        key: `rate-item-${code}`,
                        className: `rate-edit-item ${
                          isMain ? "is-main-currency" : ""
                        }`,
                      },
                      [
                        React.createElement(
                          "div",
                          {
                            key: "currency-label",
                            className: "rate-currency-label",
                          },
                          [
                            React.createElement(
                              "span",
                              { key: "name" },
                              `${
                                currencyInfo ? currencyInfo.name : code
                              } (${code})`
                            ),
                            isMain &&
                              React.createElement(
                                "span",
                                {
                                  key: "main-tag",
                                  className: "main-currency-tag",
                                },
                                "Principal"
                              ),
                          ]
                        ),
                        React.createElement(
                          "div",
                          {
                            key: "rate-input-wrapper",
                            className: "rate-input-wrapper",
                          },
                          [
                            React.createElement(
                              "span",
                              { key: "prefix" },
                              `1 ${code} = `
                            ),
                            React.createElement("input", {
                              id: `input-rate-${code}`,
                              key: `input-${code}`,
                              type: "number",
                              value: isMain
                                ? 1
                                : rates[code] === ""
                                ? ""
                                : rates[code],
                              onChange: isMain
                                ? undefined
                                : handleRateChange(code),
                              onBlur: isMain ? undefined : handleRateBlur(code),
                              readOnly: isMain,
                              disabled: isMain,
                              step: "0.000001", // Mayor precisión para tasas pequeñas
                              min: "0.000001",
                              required: !isMain,
                              placeholder: isMain ? "1.00" : "0.00",
                            }),
                            React.createElement(
                              "span",
                              { key: "suffix" },
                              mainCurrency
                            ),
                          ]
                        ),
                        !isMain &&
                          React.createElement(
                            "button",
                            {
                              key: `remove-${code}`,
                              type: "button",
                              onClick: () => handleRemoveIncomeCurrency(code),
                              className: "button-remove-currency",
                            },
                            "✕" // O un icono de "eliminar"
                          ),
                      ]
                    );
                  })
                ),
                incomeCurrencies.length === 0 &&
                  React.createElement(
                    "p",
                    {
                      key: "no-income-currencies",
                      className: "currency-form-info-text empty-list",
                    },
                    "Aún no has añadido ninguna divisa para tus ingresos. Usa el selector de arriba para empezar."
                  ),
              ]
            ),
            React.createElement(
              // Pie de página fijo
              "div",
              { key: "actions", className: "form-actions" },
              [
                React.createElement(
                  "button",
                  {
                    key: "cancel",
                    type: "button",
                    onClick: onCancel,
                    className: "button-secondary",
                  },
                  "Cancelar"
                ),
                React.createElement(
                  "button",
                  {
                    key: "submit",
                    type: "submit",
                    className: "button-primary",
                  },
                  "Guardar Configuración"
                ),
              ]
            ),
          ]
        ),
      ]
    )
  );
}

export default CurrencyRateForm;
