// video-scheduler/components/DailyIncomeCell.jsx
import React from 'react';

function formatCurrency(amount, currency) {
  if (!amount || amount === 0) return '';
  const symbols = { USD: '$', EUR: '€', ARS: '$' }; 
  return `${symbols[currency] || ''}${amount} ${currency}`;
}

function DailyIncomeCell({ day, dailyIncomeData, onIncomeCellClick }) {
  const incomeExists = dailyIncomeData && dailyIncomeData.amount > 0;
  let cellClassName = 'video-scheduler-income-cell';
  let displayText = '+ Ingreso'; 
  let payerText = '';

  if (incomeExists) {
    displayText = formatCurrency(dailyIncomeData.amount, dailyIncomeData.currency);
    payerText = dailyIncomeData.payer || ''; 
    if (dailyIncomeData.status === 'paid') {
      cellClassName += ' income-paid';
    } else {
      cellClassName += ' income-pending';
    }
  } else {
    cellClassName += ' income-empty';
  }

  return React.createElement(
    'td',
    { 
      className: cellClassName, 
      onClick: (e) => onIncomeCellClick(day, e) 
    },
    React.createElement('div', {className: 'income-content-wrapper'}, [ 
        React.createElement('div', {key: 'income-amount-display', className: 'income-amount-text'}, displayText),
        payerText && React.createElement('div', {key: 'income-payer-display', className: 'income-payer-text'}, payerText)
    ])
  );
}

export default DailyIncomeCell;