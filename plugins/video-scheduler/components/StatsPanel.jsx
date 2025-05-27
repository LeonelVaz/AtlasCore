// video-scheduler/components/StatsPanel.jsx
import React from 'react';
import StatsOverviewPanel from './StatsOverviewPanel.jsx';
import { 
  VIDEO_MAIN_STATUS, 
  VIDEO_SUB_STATUS, 
  VIDEO_STACKABLE_STATUS,
  STATUS_EMOJIS
} from '../utils/constants.js';

function StatsPanel({ monthData, currentDate, onClose, plugin }) {
  const [currentStatsDate, setCurrentStatsDate] = React.useState(new Date(currentDate));
  const [compareMode, setCompareMode] = React.useState(false);
  const [compareDate, setCompareDate] = React.useState(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const [currentStatsData, setCurrentStatsData] = React.useState(monthData);
  const [compareStatsData, setCompareStatsData] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('overview'); // 'overview', 'charts', 'compare'

  // Cargar datos del mes seleccionado
  const loadStatsForDate = React.useCallback(async (date) => {
    try {
      const year = date.getFullYear();
      const month = date.getMonth();
      const data = await plugin.publicAPI.getMonthViewData(year, month);
      return data;
    } catch (error) {
      console.error('Error al cargar datos de estadísticas:', error);
      return { videos: {}, dailyIncomes: {} };
    }
  }, [plugin]);

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

  // Actualizar datos cuando cambia la fecha
  React.useEffect(() => {
    const updateCurrentStats = async () => {
      const data = await loadStatsForDate(currentStatsDate);
      const filteredData = filterDataByMonth(data, currentStatsDate.getFullYear(), currentStatsDate.getMonth());
      setCurrentStatsData(filteredData);
    };
    updateCurrentStats();
  }, [currentStatsDate, loadStatsForDate]);

  // Cargar datos de comparación
  React.useEffect(() => {
    if (compareMode) {
      const updateCompareStats = async () => {
        const data = await loadStatsForDate(compareDate);
        const filteredData = filterDataByMonth(data, compareDate.getFullYear(), compareDate.getMonth());
        setCompareStatsData(filteredData);
      };
      updateCompareStats();
    }
  }, [compareMode, compareDate, loadStatsForDate]);

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

  const handlePrevMonth = () => {
    setCurrentStatsDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentStatsDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const videoStats = calculateVideoStats(currentStatsData);
  const incomeStats = calculateIncomeStats(currentStatsData);
  const compareVideoStats = compareMode ? calculateVideoStats(compareStatsData) : null;
  const compareIncomeStats = compareMode ? calculateIncomeStats(compareStatsData) : null;
  
  const monthName = currentStatsDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const compareMonthName = compareDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const formatCurrency = (amount, currency = 'ARS') => {
    const symbols = { USD: '$', EUR: '€', ARS: '$' };
    return `${symbols[currency] || ''}${Math.round(amount).toLocaleString()} ${currency}`;
  };

  // Componente de gráfico de barras simple
  const BarChart = ({ data, title, maxValue }) => {
    return React.createElement(
      'div',
      { className: 'simple-bar-chart' },
      [
        React.createElement('h5', { key: 'chart-title' }, title),
        React.createElement(
          'div',
          { key: 'chart-bars', className: 'chart-bars' },
          Object.entries(data).map(([key, value]) => {
            const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
            return React.createElement(
              'div',
              { key: `bar-${key}`, className: 'chart-bar-item' },
              [
                React.createElement(
                  'div',
                  { key: `bar-container-${key}`, className: 'chart-bar-container' },
                  [
                    React.createElement('div', {
                      key: `bar-${key}`,
                      className: 'chart-bar',
                      style: { width: `${percentage}%` }
                    }),
                    React.createElement('span', { key: `label-${key}`, className: 'chart-bar-label' }, `${STATUS_EMOJIS[key] || ''} ${value}`)
                  ]
                )
              ]
            );
          })
        )
      ]
    );
  };

  // Pestañas del panel
  const renderTabButtons = () => {
    const tabs = [
      { id: 'overview', label: '📊 Vista General', icon: '📊' },
      { id: 'charts', label: '📈 Gráficos', icon: '📈' },
      { id: 'compare', label: '⚖️ Comparar', icon: '⚖️' }
    ];

    return React.createElement(
      'div',
      { className: 'stats-tabs' },
      tabs.map(tab =>
        React.createElement(
          'button',
          {
            key: `tab-${tab.id}`,
            className: `stats-tab ${activeTab === tab.id ? 'active' : ''}`,
            onClick: () => {
              setActiveTab(tab.id);
              if (tab.id === 'compare') {
                setCompareMode(true);
              }
            }
          },
          tab.label
        )
      )
    );
  };

  // Contenido de la pestaña Gráficos
  const renderChartsTab = () => {
    const mainStatesData = {
      [VIDEO_MAIN_STATUS.PENDING]: videoStats[VIDEO_MAIN_STATUS.PENDING],
      [VIDEO_MAIN_STATUS.DEVELOPMENT]: videoStats[VIDEO_MAIN_STATUS.DEVELOPMENT],
      [VIDEO_MAIN_STATUS.PRODUCTION]: videoStats[VIDEO_MAIN_STATUS.PRODUCTION],
      [VIDEO_MAIN_STATUS.PUBLISHED]: videoStats[VIDEO_MAIN_STATUS.PUBLISHED]
    };

    const maxMainStates = Math.max(...Object.values(mainStatesData));

    return React.createElement(
      'div',
      { className: 'stats-tab-content charts-content' },
      [
        React.createElement(
          'div',
          { key: 'charts-grid', className: 'charts-grid' },
          [
            React.createElement(BarChart, {
              key: 'main-states-chart',
              data: mainStatesData,
              title: 'Estados Principales de Videos',
              maxValue: maxMainStates
            }),
            
            React.createElement(
              'div',
              { key: 'income-chart', className: 'income-chart' },
              [
                React.createElement('h5', { key: 'title' }, 'Distribución de Ingresos'),
                React.createElement(
                  'div',
                  { key: 'income-pie', className: 'income-pie-chart' },
                  [
                    React.createElement(
                      'div',
                      { key: 'paid-segment', className: 'pie-segment paid' },
                      [
                        React.createElement('span', { key: 'label' }, '✅ Pagado'),
                        React.createElement('span', { key: 'amount' }, formatCurrency(incomeStats.totalPaidInARS))
                      ]
                    ),
                    React.createElement(
                      'div',
                      { key: 'pending-segment', className: 'pie-segment pending' },
                      [
                        React.createElement('span', { key: 'label' }, '⏳ Pendiente'),
                        React.createElement('span', { key: 'amount' }, formatCurrency(incomeStats.totalPendingInARS))
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
  };

  // Contenido de la pestaña Comparar
  const renderCompareTab = () => {
    if (!compareStatsData) {
      return React.createElement('div', { className: 'loading-compare' }, 'Cargando datos de comparación...');
    }

    const calculateDifference = (current, compare) => {
      const diff = current - compare;
      const percentage = compare > 0 ? Math.round((diff / compare) * 100) : 0;
      return { diff, percentage };
    };

    return React.createElement(
      'div',
      { className: 'stats-tab-content compare-content' },
      [
        React.createElement(
          'div',
          { key: 'compare-controls', className: 'compare-controls' },
          [
            React.createElement('label', { key: 'label' }, 'Comparar con:'),
            React.createElement('input', {
              key: 'compare-date',
              type: 'month',
              value: `${compareDate.getFullYear()}-${String(compareDate.getMonth() + 1).padStart(2, '0')}`,
              onChange: (e) => {
                const [year, month] = e.target.value.split('-');
                setCompareDate(new Date(parseInt(year), parseInt(month) - 1, 1));
              }
            })
          ]
        ),
        
        React.createElement(
          'div',
          { key: 'comparison-grid', className: 'comparison-grid' },
          [
            React.createElement(
              'div',
              { key: 'video-comparison', className: 'comparison-section' },
              [
                React.createElement('h4', { key: 'title' }, 'Videos: Estado Principal'),
                React.createElement(
                  'div',
                  { key: 'items', className: 'comparison-items' },
                  Object.entries({
                    [VIDEO_MAIN_STATUS.DEVELOPMENT]: 'Desarrollo',
                    [VIDEO_MAIN_STATUS.PRODUCTION]: 'Producción',
                    [VIDEO_MAIN_STATUS.PUBLISHED]: 'Publicado'
                  }).map(([status, label]) => {
                    const current = videoStats[status];
                    const compare = compareVideoStats[status];
                    const { diff, percentage } = calculateDifference(current, compare);
                    
                    return React.createElement(
                      'div',
                      { key: `compare-${status}`, className: 'comparison-item' },
                      [
                        React.createElement('span', { key: `emoji-${status}` }, STATUS_EMOJIS[status]),
                        React.createElement('span', { key: `label-${status}` }, label),
                        React.createElement('span', { key: `current-${status}` }, current),
                        React.createElement('span', { key: `vs-${status}` }, 'vs'),
                        React.createElement('span', { key: `compare-${status}` }, compare),
                        React.createElement(
                          'span',
                          { 
                            key: `diff-${status}`,
                            className: `diff ${diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral'}`
                          },
                          `${diff > 0 ? '+' : ''}${diff} (${percentage > 0 ? '+' : ''}${percentage}%)`
                        )
                      ]
                    );
                  })
                )
              ]
            ),
            
            React.createElement(
              'div',
              { key: 'income-comparison', className: 'comparison-section' },
              [
                React.createElement('h4', { key: 'title' }, 'Ingresos Totales'),
                React.createElement(
                  'div',
                  { key: 'total-comparison', className: 'total-income-comparison' },
                  [
                    React.createElement(
                      'div',
                      { key: 'current-month', className: 'month-income current' },
                      [
                        React.createElement('span', { key: 'label' }, monthName),
                        React.createElement('span', { key: 'amount' }, formatCurrency(incomeStats.totalInARS))
                      ]
                    ),
                    React.createElement('span', { key: 'vs' }, 'vs'),
                    React.createElement(
                      'div',
                      { key: 'compare-month', className: 'month-income compare' },
                      [
                        React.createElement('span', { key: 'label' }, compareMonthName),
                        React.createElement('span', { key: 'amount' }, formatCurrency(compareIncomeStats.totalInARS))
                      ]
                    ),
                    React.createElement(
                      'div',
                      { key: 'income-diff', className: 'income-difference' },
                      (() => {
                        const { diff, percentage } = calculateDifference(incomeStats.totalInARS, compareIncomeStats.totalInARS);
                        return React.createElement(
                          'span',
                          { className: `diff ${diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral'}` },
                          `${diff > 0 ? '+' : ''}${formatCurrency(diff)} (${percentage > 0 ? '+' : ''}${percentage}%)`
                        );
                      })()
                    )
                  ]
                )
              ]
            )
          ]
        )
      ]
    );
  };

  return React.createElement(
    'div',
    { className: 'video-scheduler-stats-panel advanced' },
    [
      React.createElement(
        'div',
        { key: 'header', className: 'stats-panel-header' },
        [
          React.createElement(
            'div',
            { key: 'title-section', className: 'stats-panel-title-section' },
            [
              React.createElement(
                'button',
                { 
                  key: 'prev-month',
                  className: 'month-nav-button',
                  onClick: handlePrevMonth 
                },
                '←'
              ),
              React.createElement('h2', { key: 'title' }, `Estadísticas - ${monthName}`),
              React.createElement(
                'button',
                { 
                  key: 'next-month',
                  className: 'month-nav-button',
                  onClick: handleNextMonth 
                },
                '→'
              )
            ]
          ),
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
          renderTabButtons(),
          
          activeTab === 'overview' && React.createElement(StatsOverviewPanel, {
            key: 'overview-panel',
            monthData: currentStatsData,
            currentDate: currentStatsDate,
            plugin: plugin,
            compact: false
          }),
          activeTab === 'charts' && renderChartsTab(),
          activeTab === 'compare' && renderCompareTab()
        ]
      )
    ]
  );
}

export default StatsPanel;