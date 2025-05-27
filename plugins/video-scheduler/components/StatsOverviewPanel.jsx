// video-scheduler/components/StatsOverviewPanel.jsx
import React from 'react';
import { 
  VIDEO_MAIN_STATUS, 
  VIDEO_SUB_STATUS, 
  VIDEO_STACKABLE_STATUS,
  STATUS_EMOJIS 
} from '../utils/constants.js';

function StatsOverviewPanel({ monthData, currentDate, plugin, compact = false }) {
  // Función para filtrar datos por mes específico
  const filterDataByMonth = (data, year, month) => {
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    
    const filteredVideos = {};
    const filteredIncomes = {};
    
    // Filtrar videos por mes
    if (data && data.videos) {
      Object.entries(data.videos).forEach(([key, video]) => {
        if (key.startsWith(monthKey)) {
          filteredVideos[key] = video;
        }
      });
    }
    
    // Filtrar ingresos por mes
    if (data && data.dailyIncomes) {
      Object.entries(data.dailyIncomes).forEach(([key, income]) => {
        if (key.startsWith(monthKey)) {
          filteredIncomes[key] = income;
        }
      });
    }
    
    return {
      videos: filteredVideos,
      dailyIncomes: filteredIncomes
    };
  };

  // Filtrar datos solo del mes actual
  const filteredData = filterDataByMonth(monthData, currentDate.getFullYear(), currentDate.getMonth());

  // Calcular estadísticas de videos (solo del mes específico)
  const calculateVideoStats = (data) => {
    const stats = {
      [VIDEO_MAIN_STATUS.PENDING]: 0,
      [VIDEO_MAIN_STATUS.EMPTY]: 0,
      [VIDEO_MAIN_STATUS.DEVELOPMENT]: 0,
      [VIDEO_MAIN_STATUS.PRODUCTION]: 0,
      [VIDEO_MAIN_STATUS.PUBLISHED]: 0,
      [VIDEO_SUB_STATUS.REC]: 0,
      [VIDEO_SUB_STATUS.EDITING]: 0,
      [VIDEO_SUB_STATUS.THUMBNAIL]: 0,
      [VIDEO_SUB_STATUS.SCHEDULING_POST]: 0,
      [VIDEO_SUB_STATUS.SCHEDULED]: 0,
      [VIDEO_STACKABLE_STATUS.QUESTION]: 0,
      [VIDEO_STACKABLE_STATUS.WARNING]: 0,
      total: 0,
      withAlerts: 0,
      withQuestions: 0
    };

    if (data && data.videos) {
      Object.values(data.videos).forEach(video => {
        stats.total++;
        
        if (video.status) {
          stats[video.status]++;
        }
        
        if (video.subStatus) {
          stats[video.subStatus]++;
        }
        
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

  // Calcular estadísticas de ingresos (solo del mes específico)
  const calculateIncomeStats = (data) => {
    const incomeStats = {
      totalByCurrency: {},
      totalInARS: 0,
      paidByCurrency: {},
      pendingByCurrency: {},
      totalPaidInARS: 0,
      totalPendingInARS: 0
    };

    const exchangeRates = plugin._pluginData?.settings?.currencyRates || {
      USD: 870, EUR: 950, ARS: 1
    };

    if (data && data.dailyIncomes) {
      Object.values(data.dailyIncomes).forEach(income => {
        if (income && income.amount > 0) {
          const currency = income.currency || 'USD';
          const amount = parseFloat(income.amount) || 0;
          const rate = exchangeRates[currency] || 1;
          
          if (!incomeStats.totalByCurrency[currency]) {
            incomeStats.totalByCurrency[currency] = 0;
          }
          incomeStats.totalByCurrency[currency] += amount;
          incomeStats.totalInARS += amount * rate;
          
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

  const videoStats = calculateVideoStats(filteredData);
  const incomeStats = calculateIncomeStats(filteredData);

  const formatCurrency = (amount, currency = 'ARS') => {
    const symbols = { USD: '$', EUR: '€', ARS: '$' };
    return `${symbols[currency] || ''}${Math.round(amount).toLocaleString()} ${currency}`;
  };

  // Si es modo compacto (para el panel inferior), usar diseño más simple
  if (compact) {
    const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long' });
    
    return React.createElement(
      'div',
      { className: 'video-scheduler-footer-stats' },
      [
        React.createElement(
          'div',
          { key: 'stats-overview', className: 'footer-stats-overview' },
          [
            React.createElement('h3', { key: 'title' }, `Resumen - ${monthName}`),
            
            React.createElement(
              'div',
              { key: 'stats-grid', className: 'footer-stats-grid' },
              [
                // Estadísticas de videos
                React.createElement(
                  'div',
                  { key: 'video-section', className: 'footer-stats-section' },
                  [
                    React.createElement('h4', { key: 'title' }, 'Estado de Videos'),
                    React.createElement(
                      'div',
                      { key: 'items', className: 'footer-stats-items' },
                      [
                        React.createElement(
                          'div',
                          { key: 'pending', className: 'footer-stat-item' },
                          [
                            React.createElement('span', { key: 'emoji' }, STATUS_EMOJIS[VIDEO_MAIN_STATUS.PENDING]),
                            React.createElement('span', { key: 'count' }, videoStats[VIDEO_MAIN_STATUS.PENDING])
                          ]
                        ),
                        React.createElement(
                          'div',
                          { key: 'development', className: 'footer-stat-item' },
                          [
                            React.createElement('span', { key: 'emoji' }, STATUS_EMOJIS[VIDEO_MAIN_STATUS.DEVELOPMENT]),
                            React.createElement('span', { key: 'count' }, videoStats[VIDEO_MAIN_STATUS.DEVELOPMENT])
                          ]
                        ),
                        React.createElement(
                          'div',
                          { key: 'production', className: 'footer-stat-item' },
                          [
                            React.createElement('span', { key: 'emoji' }, STATUS_EMOJIS[VIDEO_MAIN_STATUS.PRODUCTION]),
                            React.createElement('span', { key: 'count' }, videoStats[VIDEO_MAIN_STATUS.PRODUCTION])
                          ]
                        ),
                        React.createElement(
                          'div',
                          { key: 'published', className: 'footer-stat-item' },
                          [
                            React.createElement('span', { key: 'emoji' }, STATUS_EMOJIS[VIDEO_MAIN_STATUS.PUBLISHED]),
                            React.createElement('span', { key: 'count' }, videoStats[VIDEO_MAIN_STATUS.PUBLISHED])
                          ]
                        )
                      ]
                    )
                  ]
                ),
                
                // Alertas y dudas
                React.createElement(
                  'div',
                  { key: 'alerts-section', className: 'footer-stats-section' },
                  [
                    React.createElement('h4', { key: 'title' }, 'Atención'),
                    React.createElement(
                      'div',
                      { key: 'items', className: 'footer-stats-items' },
                      [
                        React.createElement(
                          'div',
                          { key: 'alerts', className: 'footer-stat-item warning' },
                          [
                            React.createElement('span', { key: 'emoji' }, STATUS_EMOJIS[VIDEO_STACKABLE_STATUS.WARNING]),
                            React.createElement('span', { key: 'count' }, videoStats.withAlerts)
                          ]
                        ),
                        React.createElement(
                          'div',
                          { key: 'questions', className: 'footer-stat-item question' },
                          [
                            React.createElement('span', { key: 'emoji' }, STATUS_EMOJIS[VIDEO_STACKABLE_STATUS.QUESTION]),
                            React.createElement('span', { key: 'count' }, videoStats.withQuestions)
                          ]
                        )
                      ]
                    )
                  ]
                ),
                
                // Ganancias
                React.createElement(
                  'div',
                  { key: 'income-section', className: 'footer-stats-section income-section' },
                  [
                    React.createElement('h4', { key: 'title' }, 'Ganancias del Mes'),
                    React.createElement(
                      'div',
                      { key: 'items', className: 'footer-income-items' },
                      [
                        React.createElement(
                          'div',
                          { key: 'total', className: 'footer-income-total' },
                          formatCurrency(incomeStats.totalInARS)
                        ),
                        React.createElement(
                          'div',
                          { key: 'breakdown', className: 'footer-income-breakdown' },
                          [
                            React.createElement(
                              'span',
                              { key: 'paid', className: 'income-paid' },
                              `✅ ${formatCurrency(incomeStats.totalPaid)}`
                            ),
                            React.createElement(
                              'span',
                              { key: 'pending', className: 'income-pending' },
                              `⏳ ${formatCurrency(incomeStats.totalPending)}`
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
        )
      ]
    );
  }

  // Modo completo (para el panel avanzado)
  return React.createElement(
    'div',
    { className: 'stats-tab-content' },
    [
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
                    Object.entries({
                      [VIDEO_MAIN_STATUS.PENDING]: 'Pendiente',
                      [VIDEO_MAIN_STATUS.EMPTY]: 'Vacío', 
                      [VIDEO_MAIN_STATUS.DEVELOPMENT]: 'Desarrollo',
                      [VIDEO_MAIN_STATUS.PRODUCTION]: 'Producción',
                      [VIDEO_MAIN_STATUS.PUBLISHED]: 'Publicado'
                    }).map(([status, label]) =>
                      React.createElement(
                        'div',
                        { key: `main-${status}`, className: 'stats-item' },
                        [
                          React.createElement('span', { key: `emoji-${status}` }, STATUS_EMOJIS[status]),
                          React.createElement('span', { key: `label-${status}` }, label),
                          React.createElement('span', { key: `count-${status}`, className: 'stats-count' }, videoStats[status])
                        ]
                      )
                    )
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
                    Object.entries({
                      [VIDEO_SUB_STATUS.REC]: 'Grabando',
                      [VIDEO_SUB_STATUS.EDITING]: 'Editando',
                      [VIDEO_SUB_STATUS.THUMBNAIL]: 'Thumbnail',
                      [VIDEO_SUB_STATUS.SCHEDULING_POST]: 'Programando',
                      [VIDEO_SUB_STATUS.SCHEDULED]: 'Programado'
                    }).map(([status, label]) =>
                      React.createElement(
                        'div',
                        { key: `sub-${status}`, className: 'stats-item' },
                        [
                          React.createElement('span', { key: `emoji-${status}` }, STATUS_EMOJIS[status]),
                          React.createElement('span', { key: `label-${status}` }, label),
                          React.createElement('span', { key: `count-${status}`, className: 'stats-count' }, videoStats[status])
                        ]
                      )
                    )
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
                        { key: `currency-${currency}`, className: 'income-item' },
                        [
                          React.createElement('span', { key: `currency-label-${currency}` }, currency),
                          React.createElement('span', { key: `amount-${currency}` }, formatCurrency(amount, currency))
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
                ],
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
  );
}

export default StatsOverviewPanel;