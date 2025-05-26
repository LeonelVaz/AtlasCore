// video-scheduler/components/DailyIncomeForm.jsx
import React from 'react';
import { CURRENCIES, DEFAULT_DAILY_INCOME_STRUCTURE } from '../utils/constants.js';

function DailyIncomeForm(props) {
  const { day, existingIncome, onSave, onCancel, styleProps } = props;
  
  const initialData = existingIncome || { ...DEFAULT_DAILY_INCOME_STRUCTURE };

  const [amount, setAmount] = React.useState(initialData.amount);
  const [currency, setCurrency] = React.useState(initialData.currency);
  const [payer, setPayer] = React.useState(initialData.payer);
  const [status, setStatus] = React.useState(initialData.status);

  // Sincronizar estado si existingIncome cambia (ej. al abrir para un día diferente)
  React.useEffect(() => {
    const currentInitialData = existingIncome || { ...DEFAULT_DAILY_INCOME_STRUCTURE };
    setAmount(currentInitialData.amount);
    setCurrency(currentInitialData.currency);
    setPayer(currentInitialData.payer);
    setStatus(currentInitialData.status);
  }, [existingIncome]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(day, {
      amount: parseFloat(amount) || 0,
      currency,
      payer: payer.trim(),
      status
    });
  };

  return React.createElement(
    'div',
    {
      className: 'daily-income-form-popup',
      style: styleProps 
    },
    [
      React.createElement('h4', { key: 'dif-title' }, `Ingreso del Día ${day}`),
      React.createElement('form', { key: 'dif-form', onSubmit: handleSubmit }, [
        React.createElement('div', { key: 'dif-amount-group', className: 'form-group' }, [
          React.createElement('label', {htmlFor: `dif-amount-${day}`}, 'Monto: '),
          React.createElement('input', { 
            type: 'number', id: `dif-amount-${day}`, value: amount, 
            onChange: e => setAmount(e.target.value), step: "0.01", min: "0"
          })
        ]),
        React.createElement('div', { key: 'dif-currency-group', className: 'form-group' }, [
          React.createElement('label', {htmlFor: `dif-currency-${day}`}, 'Moneda: '),
          React.createElement('select', { 
            id: `dif-currency-${day}`, value: currency, 
            onChange: e => setCurrency(e.target.value)
          }, CURRENCIES.map(c => React.createElement('option', {key: c, value: c}, c)))
        ]),
        React.createElement('div', { key: 'dif-payer-group', className: 'form-group' }, [
          React.createElement('label', {htmlFor: `dif-payer-${day}`}, 'Pagador: '),
          React.createElement('input', { 
            type: 'text', id: `dif-payer-${day}`, value: payer, 
            onChange: e => setPayer(e.target.value)
          })
        ]),
        React.createElement('div', { key: 'dif-status-group', className: 'form-group' }, [
          React.createElement('label', {htmlFor: `dif-inc-status-${day}`}, 'Estado Pago: '),
          React.createElement('select', { 
            id: `dif-inc-status-${day}`, value: status, 
            onChange: e => setStatus(e.target.value)
          }, [
            React.createElement('option', {key: 'pending', value: 'pending'}, 'Pendiente'),
            React.createElement('option', {key: 'paid', value: 'paid'}, 'Pagado')
          ])
        ]),
        React.createElement('div', { key: 'dif-actions', className: 'form-actions' }, [
          React.createElement('button', {type: 'button', onClick: onCancel, className: 'button-secondary'}, 'Cancelar'),
          React.createElement('button', {type: 'submit', className: 'button-primary'}, 'Guardar Ingreso')
        ])
      ])
    ]
  );
}

export default DailyIncomeForm;