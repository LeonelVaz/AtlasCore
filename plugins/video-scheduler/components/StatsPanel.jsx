// video-scheduler/components/StatsPanel.jsx
import React from 'react';
import { 
  VIDEO_MAIN_STATUS, 
  VIDEO_SUB_STATUS, 
  VIDEO_STACKABLE_STATUS,
  STATUS_EMOJIS,
  CURRENCIES 
} from '../utils/constants.js';

function StatsPanel({ monthData, currentDate, onClose, plugin }) {
  // Calcular estadísticas de videos
  const calculateVideoStats = () => {
    const stats = {
      // Estados principales
      [VIDEO_MAIN_STATUS.PENDING]: 0,
      [VIDEO_MAIN_STATUS.EMPTY]: 0,
      [VIDEO_MAIN_STATUS.DEVELOPMENT]: 0,
      [VIDEO_MAIN_STATUS.PRODUCTION]: 0,
      [VIDEO_MAIN_STATUS.PUBLISHED]: 0,
      
      // Sub-estados normales
      [VIDEO_SUB_STATUS.REC]: 0,
      [VIDEO_SUB_STATUS.EDITING]: 0,
      [VIDEO_SUB_STATUS.THUMBNAIL]: 0,
      [VIDEO_SUB_STATUS.SCHEDULING_POST]: 0,
      [VIDEO_SUB_STATUS.SCHEDULED]: 0,
      
      // Sub-estados apilables
      [VIDEO_STACKABLE_STATUS.QUESTION]: 0,
      [VIDEO_STACKABLE_STATUS.WARNING]: 0,
      
      // Totales
      total: 0,
      withAlerts: 0,
      withQuestions: 0
    };

    if (monthData && monthData.videos) {
      Object.values(monthData.videos).forEach(video => {
        stats.total++;
        
        // Contar estado principal
        if (video.status) {
          stats[video.status]++;
        }
        
        // Contar sub-estado normal
        if (video.subStatus) {
          stats[video.subStatus]++;
        }
        
        // Contar sub-estados apilables
        if (video.stackableStatuses && Array.isArray(video.stackableStatuses)) {
          video.stackableStatuses.forEach(status => {
            if (stats[status] !== undefined) {
              stats[status]++;
            }
            
            if (status === VIDEO_STACKABLE_STATUS.WARNING) {
              stats.withAlerts++;
            }
            if (status === VIDEO_STACKABLE_STATUS.QUESTION) {
              stats.withQuestions++;
            }
          });
        }
      });
    }

    return stats;
  };

  // Calcular estadísticas de ingresos
  const calculateIncomeStats = () => {
    const incomeStats = {
      totalByCurrency: {},
      totalInARS: 0,
      paidByCurrency: {},
      pendingByCurrency: {},
      totalPaidInARS: 0,
      totalPendingInARS: 0
    };

    // Tasas de cambio por defecto (deberían venir de configuración)
    const exchangeRates = plugin._pluginData?.settings?.currencyRates || {
      USD: 870, // USD a ARS
      EUR: 950, // EUR a ARS
      ARS: 1    // ARS a ARS
    };

    if (monthData && monthData.dailyIncomes) {
      Object.values(monthData.dailyIncomes).forEach(income => {
        if (income && income.amount > 0) {
          const currency = income.currency || 'USD';
          const amount = parseFloat(income.amount) || 0;
          const rate = exchangeRates[currency] || 1;
          
          // Totales por moneda
          if (!incomeStats.totalByCurrency[currency]) {
            incomeStats.totalByCurrency[currency] = 0;
          }
          incomeStats.totalByCurrency[currency] += amount;
          
          // Total en ARS
          incomeStats.totalInARS += amount * rate;
          
          // Por estado de pago
          if (income.status === 'paid') {
            if (!incomeStats.paidByCurrency[currency]) {
              incomeStats.paidByCurrency[currency] = 0;
            }
            incomeStats.paidByCurrency[currency] += amount;
            incomeStats.totalPaidInARS += amount * rate;
          } else {
            if (!incomeStats.pendingByCurrency[currency]) {
              incomeStats.pendingByCurrency[currency] = 0;
            }
            incomeStats.pendingByCurrency[currency] += amount;
            incomeStats.totalPendingInARS += amount * rate;
          }
        }
      });
    }

    return incomeStats;
  };

  const videoStats = calculateVideoStats();
  const incomeStats = calculateIncomeStats();
  const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const formatCurrency = (amount, currency = 'ARS') => {
    const symbols = { USD: '$', EUR: '€', ARS: '$' };
    return `${symbols[currency] || ''}${Math.round(amount).toLocaleString()} ${currency}`;
  };

  return React.createElement(
    'div',
    { className: 'video-scheduler-stats-panel' },
    [
      React.createElement(
        'div',
        { key: 'header', className: 'stats-panel-header' },
        [
          React.createElement('h2', { key: 'title' }, `Estadísticas - ${monthName}`),
          React.createElement(
            'button',
            { 
              key: 'close',
              className: 'stats-panel-close',
              onClick: onClose 
            },
            '✕'
          )
        ]
      ),
      
      React.createElement(
        'div',
        { key: 'content', className: 'stats-panel-content' },
        [
          // Sección de Estados de Videos
          React.createElement(
            'div',
            { key: 'video-stats', className: 'stats-section' },
            [
              React.createElement('h3', { key: 'title' }, 'Estado de Videos'),
              React.createElement(
                'div',
                { key: 'stats-grid', className: 'stats-grid' },
                [
                  React.createElement(
                    'div',
                    { key: 'main-states', className: 'stats-group' },
                    [
                      React.createElement('h4', { key: 'title' }, 'Estados Principales'),
                      React.createElement(
                        'div',
                        { key: 'items', className: 'stats-items' },
                        [
                          React.createElement(
                            'div',
                            { key: 'pending', className: 'stats-item' },
                            [
                              React.createElement('span', { key: 'emoji' }, STATUS_EMOJIS[VIDEO_MAIN_STATUS.PENDING]),
                              React.createElement('span', { key: 'label' }, 'Pendiente'),
                              React.createElement('span', { key: 'count', className: 'stats-count' }, videoStats[VIDEO_MAIN_STATUS.PENDING])
                            ]
                          ),
                          React.createElement(
                            'div',
                            { key: 'empty', className: 'stats-item' },
                            [
                              React.createElement('span', { key: 'emoji' }, STATUS_EMOJIS[VIDEO_MAIN_STATUS.EMPTY]),
                              React.createElement('span', { key: 'label' }, 'Vacío'),
                              React.createElement('span', { key: 'count', className: 'stats-count' }, videoStats[VIDEO_MAIN_STATUS.EMPTY])
                            ]
                          ),
                          React.createElement(
                            'div',
                            { key: 'development', className: 'stats-item' },
                            [
                              React.createElement('span', { key: 'emoji' }, STATUS_EMOJIS[VIDEO_MAIN_STATUS.DEVELOPMENT]),
                              React.createElement('span', { key: 'label' }, 'Desarrollo'),
                              React.createElement('span', { key: 'count', className: 'stats-count' }, videoStats[VIDEO_MAIN_STATUS.DEVELOPMENT])
                            ]
                          ),
                          React.createElement(
                            'div',
                            { key: 'production', className: 'stats-item' },
                            [
                              React.createElement('span', { key: 'emoji' }, STATUS_EMOJIS[VIDEO_MAIN_STATUS.PRODUCTION]),
                              React.createElement('span', { key: 'label' }, 'Producción'),
                              React.createElement('span', { key: 'count', className: 'stats-count' }, videoStats[VIDEO_MAIN_STATUS.PRODUCTION])
                            ]
                          ),
                          React.createElement(
                            'div',
                            { key: 'published', className: 'stats-item' },
                            [
                              React.createElement('span', { key: 'emoji' }, STATUS_EMOJIS[VIDEO_MAIN_STATUS.PUBLISHED]),
                              React.createElement('span', { key: 'label' }, 'Publicado'),
                              React.createElement('span', { key: 'count', className: 'stats-count' }, videoStats[VIDEO_MAIN_STATUS.PUBLISHED])
                            ]
                          )
                        ]
                      )
                    ]
                  ),
                  
                  React.createElement(
                    'div',
                    { key: 'sub-states', className: 'stats-group' },
                    [
                      React.createElement('h4', { key: 'title' }, 'Actividades'),
                      React.createElement(
                        'div',
                        { key: 'items', className: 'stats-items' },
                        [
                          React.createElement(
                            'div',
                            { key: 'rec', className: 'stats-item' },
                            [
                              React.createElement('span', { key: 'emoji' }, STATUS_EMOJIS[VIDEO_SUB_STATUS.REC]),
                              React.createElement('span', { key: 'label' }, 'Grabando'),
                              React.createElement('span', { key: 'count', className: 'stats-count' }, videoStats[VIDEO_SUB_STATUS.REC])
                            ]
                          ),
                          React.createElement(
                            'div',
                            { key: 'editing', className: 'stats-item' },
                            [
                              React.createElement('span', { key: 'emoji' }, STATUS_EMOJIS[VIDEO_SUB_STATUS.EDITING]),
                              React.createElement('span', { key: 'label' }, 'Editando'),
                              React.createElement('span', { key: 'count', className: 'stats-count' }, videoStats[VIDEO_SUB_STATUS.EDITING])
                            ]
                          ),
                          React.createElement(
                            'div',
                            { key: 'thumbnail', className: 'stats-item' },
                            [
                              React.createElement('span', { key: 'emoji' }, STATUS_EMOJIS[VIDEO_SUB_STATUS.THUMBNAIL]),
                              React.createElement('span', { key: 'label' }, 'Thumbnail'),
                              React.createElement('span', { key: 'count', className: 'stats-count' }, videoStats[VIDEO_SUB_STATUS.THUMBNAIL])
                            ]
                          ),
                          React.createElement(
                            'div',
                            { key: 'scheduling', className: 'stats-item' },
                            [
                              React.createElement('span', { key: 'emoji' }, STATUS_EMOJIS[VIDEO_SUB_STATUS.SCHEDULING_POST]),
                              React.createElement('span', { key: 'label' }, 'Programando'),
                              React.createElement('span', { key: 'count', className: 'stats-count' }, videoStats[VIDEO_SUB_STATUS.SCHEDULING_POST])
                            ]
                          ),
                          React.createElement(
                            'div',
                            { key: 'scheduled', className: 'stats-item' },
                            [
                              React.createElement('span', { key: 'emoji' }, STATUS_EMOJIS[VIDEO_SUB_STATUS.SCHEDULED]),
                              React.createElement('span', { key: 'label' }, 'Programado'),
                              React.createElement('span', { key: 'count', className: 'stats-count' }, videoStats[VIDEO_SUB_STATUS.SCHEDULED])
                            ]
                          )
                        ]
                      )
                    ]
                  ),
                  
                  React.createElement(
                    'div',
                    { key: 'alerts', className: 'stats-group' },
                    [
                      React.createElement('h4', { key: 'title' }, 'Atención Requerida'),
                      React.createElement(
                        'div',
                        { key: 'items', className: 'stats-items' },
                        [
                          React.createElement(
                            'div',
                            { key: 'warnings', className: 'stats-item warning-item' },
                            [
                              React.createElement('span', { key: 'emoji' }, STATUS_EMOJIS[VIDEO_STACKABLE_STATUS.WARNING]),
                              React.createElement('span', { key: 'label' }, 'Con Alertas'),
                              React.createElement('span', { key: 'count', className: 'stats-count' }, videoStats.withAlerts)
                            ]
                          ),
                          React.createElement(
                            'div',
                            { key: 'questions', className: 'stats-item question-item' },
                            [
                              React.createElement('span', { key: 'emoji' }, STATUS_EMOJIS[VIDEO_STACKABLE_STATUS.QUESTION]),
                              React.createElement('span', { key: 'label' }, 'Con Dudas'),
                              React.createElement('span', { key: 'count', className: 'stats-count' }, videoStats.withQuestions)
                            ]
                          ),
                          React.createElement(
                            'div',
                            { key: 'total', className: 'stats-item total-item' },
                            [
                              React.createElement('span', { key: 'emoji' }, '📊'),
                              React.createElement('span', { key: 'label' }, 'Total Videos'),
                              React.createElement('span', { key: 'count', className: 'stats-count' }, videoStats.total)
                            ]
                          )
                        ]
                      )
                    ]
                  )
                ]
              )
            ]
          ),
          
          // Sección de Ingresos
          React.createElement(
            'div',
            { key: 'income-stats', className: 'stats-section' },
            [
              React.createElement('h3', { key: 'title' }, 'Ganancias del Mes'),
              React.createElement(
                'div',
                { key: 'income-grid', className: 'income-stats-grid' },
                [
                  React.createElement(
                    'div',
                    { key: 'by-currency', className: 'income-group' },
                    [
                      React.createElement('h4', { key: 'title' }, 'Por Moneda'),
                      React.createElement(
                        'div',
                        { key: 'items', className: 'income-items' },
                        Object.entries(incomeStats.totalByCurrency).map(([currency, amount]) =>
                          React.createElement(
                            'div',
                            { key: currency, className: 'income-item' },
                            [
                              React.createElement('span', { key: 'currency' }, currency),
                              React.createElement('span', { key: 'amount' }, formatCurrency(amount, currency))
                            ]
                          )
                        )
                      )
                    ]
                  ),
                  
                  React.createElement(
                    'div',
                    { key: 'payment-status', className: 'income-group' },
                    [
                      React.createElement('h4', { key: 'title' }, 'Estado de Pagos'),
                      React.createElement(
                        'div',
                        { key: 'items', className: 'income-items' },
                        [
                          React.createElement(
                            'div',
                            { key: 'paid', className: 'income-item paid' },
                            [
                              React.createElement('span', { key: 'label' }, '✅ Pagado'),
                              React.createElement('span', { key: 'amount' }, formatCurrency(incomeStats.totalPaidInARS))
                            ]
                          ),
                          React.createElement(
                            'div',
                            { key: 'pending', className: 'income-item pending' },
                            [
                              React.createElement('span', { key: 'label' }, '⏳ Pendiente'),
                              React.createElement('span', { key: 'amount' }, formatCurrency(incomeStats.totalPendingInARS))
                            ]
                          )
                        ]
                      )
                    ]
                  ),
                  
                  React.createElement(
                    'div',
                    { key: 'total-income', className: 'income-group total-income' },
                    [
                      React.createElement('h4', { key: 'title' }, 'Total del Mes'),
                      React.createElement(
                        'div',
                        { key: 'total', className: 'income-total' },
                        formatCurrency(incomeStats.totalInARS)
                      )
                    ]
                  )
                ]
              )
            ]
          )
        ]
      )
    ]
  );
}

export default StatsPanel;