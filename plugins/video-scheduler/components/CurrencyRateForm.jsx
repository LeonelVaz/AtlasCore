// video-scheduler/components/CurrencyRateForm.jsx
import React from 'react';
import { CURRENCIES } from '../utils/constants.js';

function CurrencyRateForm(props) {
  const { initialRates, initialDefaultCurrency, onSave, onCancel, styleProps } = props;
  const modalRef = React.useRef(null);

  const [rates, setRates] = React.useState({ ...initialRates });
  const [defaultCurrency, setDefaultCurrency] = React.useState(initialDefaultCurrency);

  React.useEffect(() => {
    setRates({ ...initialRates });
    setDefaultCurrency(initialDefaultCurrency);
  }, [initialRates, initialDefaultCurrency]);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onCancel();
      }
    };
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCancel]);

  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);

  const handleRateChange = (currency) => (e) => {
    const value = e.target.value;
    const numericValue = value === '' ? '' : parseFloat(value); 
    
    setRates(prev => ({
      ...prev,
      [currency]: numericValue 
    }));
  };
  
  const handleRateBlur = (currency) => (e) => {
    let value = parseFloat(e.target.value);
    if (isNaN(value) || value <= 0) {
        value = initialRates[currency] || (currency === 'USD' ? 870 : 950);
    }
    setRates(prev => ({
      ...prev,
      [currency]: value
    }));
  };

  const handleDefaultCurrencyChange = (e) => {
    setDefaultCurrency(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalRates = { ...rates };
    let ratesAreValid = true;

    CURRENCIES.forEach(currency => {
        if (currency !== 'ARS') {
            const rateValue = parseFloat(finalRates[currency]);
            if (isNaN(rateValue) || rateValue <= 0) {
                alert(`La tasa para ${currency} debe ser un número positivo.`);
                ratesAreValid = false;
            } else {
                finalRates[currency] = rateValue;
            }
        }
    });
    
    if (!ratesAreValid) {
        return; 
    }

    finalRates.ARS = 1; 
    onSave(finalRates, defaultCurrency);
  };

  return React.createElement(
    'div',
    { className: 'currency-rate-form-overlay' },
    React.createElement(
      'div',
      {
        ref: modalRef,
        className: 'currency-rate-form-modal',
        style: styleProps 
      },
      [
        React.createElement(
          'div',
          { key: 'header', className: 'currency-rate-form-header' },
          [
            React.createElement('h3', { key: 'title' }, '⚙️ Configurar Tasas de Cambio'),
            React.createElement(
              'button',
              {
                key: 'close-btn',
                type: 'button',
                className: 'currency-rate-close-button',
                onClick: onCancel
              },
              '✕'
            )
          ]
        ),
        // <--- CAMBIO ESTRUCTURAL: El <form> ahora envuelve el contenido y las acciones ---
        React.createElement(
            'form', 
            { 
                key: 'form-wrapper', 
                onSubmit: handleSubmit, 
                className: 'currency-rate-form-wrapper' // <-- NUEVA CLASE PARA EL FORM
            }, 
            [
                // <--- Este es el contenido con scroll ---
                React.createElement(
                    'div',
                    { key: 'content', className: 'currency-rate-form-content'},
                    [
                        React.createElement('p', {key: 'info-text', className: 'currency-rate-info'}, 
                            'Define las tasas de cambio relativas a ARS. ARS siempre es 1.'
                        ),
                        React.createElement(
                            'div',
                            { key: 'rates-grid', className: 'currency-rates-inputs-grid' },
                            CURRENCIES.filter(c => c !== 'ARS').map(currency => { 
                                return React.createElement(
                                    'div', { key: `rate-column-${currency}`, className: 'rate-input-column' },
                                    [
                                        React.createElement('label', { 
                                            key: `label-header-${currency}`, 
                                            className: 'rate-column-header-label',
                                            htmlFor: `input-rate-${currency}`
                                        }, `1 ${currency} =`),
                                        React.createElement('input', {
                                            id: `input-rate-${currency}`,
                                            key: `input-${currency}`,
                                            type: 'number',
                                            value: rates[currency] === '' ? '' : rates[currency],
                                            onChange: handleRateChange(currency),
                                            onBlur: handleRateBlur(currency),
                                            step: '0.01',
                                            min: '0.01',
                                            required: true,
                                            placeholder: `0.00`
                                        }),
                                        React.createElement('span', {
                                            key: `span-target-${currency}`, 
                                            className: 'rate-column-target-currency'
                                        }, 'ARS')
                                    ]
                                );
                            })
                        ),
                        React.createElement(
                            'div', { key: 'ars-rate-display', className: 'form-group form-group-fullwidth form-group-disabled' },
                            [
                                React.createElement('label', { key: 'label-ars', htmlFor: 'input-ars-rate' }, `Tasa ARS:`),
                                React.createElement('input', {
                                    id: 'input-ars-rate',
                                    key: 'input-ars',
                                    type: 'number',
                                    value: 1,
                                    readOnly: true,
                                    disabled: true
                                }),
                                React.createElement('span', {key: 'span-ars', className: 'currency-rate-target-fixed'}, 'ARS (Fijo)')
                            ]
                        ),
                        React.createElement(
                            'div', { key: 'default-currency-group', className: 'form-group form-group-fullwidth' }, 
                            [
                                React.createElement('label', { key: 'label-default', htmlFor: 'select-default-currency' }, 'Moneda por defecto para ingresos:'),
                                React.createElement(
                                    'select', 
                                    { 
                                        id: 'select-default-currency',
                                        key: 'select-default', 
                                        value: defaultCurrency, 
                                        onChange: handleDefaultCurrencyChange 
                                    },
                                    CURRENCIES.map(c => React.createElement('option', { key: c, value: c }, c))
                                )
                            ]
                        )
                    ]
                ),
                // <--- Este es el pie de página fijo (fuera del div de contenido) ---
                React.createElement(
                    'div', { key: 'actions', className: 'form-actions' },
                    [
                        React.createElement(
                            'button',
                            {
                                key: 'cancel',
                                type: 'button',
                                onClick: onCancel,
                                className: 'button-secondary'
                            },
                            'Cancelar'
                        ),
                        React.createElement(
                            'button',
                            {
                                key: 'submit',
                                type: 'submit',
                                className: 'button-primary'
                            },
                            'Guardar Tasas'
                        )
                    ]
                )
            ]
        )
      ]
    )
  );
}

export default CurrencyRateForm;