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
    const chartBars = Object.entries(data).map(([key, value]) => {
      const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
      return React.createElement(
        'div',
        { key: `bar-item-${key}`, className: 'chart-bar-item' },
        React.createElement(
          'div',
          { className: 'chart-bar-container' },
          [
            React.createElement('div', {
              key: `bar-fill-${key}`,
              className: 'chart-bar',
              style: { width: `${percentage}%` }
            }),
            React.createElement('span', { 
              key: `bar-label-${key}`, 
              className: 'chart-bar-label' 
            }, `${STATUS_EMOJIS[key] || ''} ${value}`)
          ]
        )
      );
    });

    return React.createElement(
      'div',
      { className: 'simple-bar-chart' },
      [
        React.createElement('h5', { key: 'chart-title' }, title),
        React.createElement('div', { key: 'chart-bars', className: 'chart-bars' }, chartBars)
      ]
    );
  };

  // Pestañas del panel
  const renderTabButtons = () => {
    const tabs = [
      { id: 'overview', label: '📊 Vista General' },
      { id: 'charts', label: '📈 Gráficos' },
      { id: 'compare', label: '⚖️ Comparar' }
    ];

    const tabButtons = tabs.map(tab =>
      React.createElement(
        'button',
        {
          key: `tab-button-${tab.id}`,
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
    );

    return React.createElement('div', { className: 'stats-tabs' }, tabButtons);
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
      React.createElement(
        'div',
        { className: 'charts-grid' },
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
              React.createElement('h5', { key: 'income-chart-title' }, 'Distribución de Ingresos'),
              React.createElement(
                'div',
                { key: 'income-pie', className: 'income-pie-chart' },
                [
                  React.createElement(
                    'div',
                    { key: 'paid-segment', className: 'pie-segment paid' },
                    [
                      React.createElement('span', { key: 'paid-label' }, '✅ Pagado'),
                      React.createElement('span', { key: 'paid-amount' }, formatCurrency(incomeStats.totalPaidInARS))
                    ]
                  ),
                  React.createElement(
                    'div',
                    { key: 'pending-segment', className: 'pie-segment pending' },
                    [
                      React.createElement('span', { key: 'pending-label' }, '⏳ Pendiente'),
                      React.createElement('span', { key: 'pending-amount' }, formatCurrency(incomeStats.totalPendingInARS))
                    ]
                  )
                ]
              )
            ]
          )
        ]
      )
    );
  };

  // Contenido de la pestaña Comparar
  const renderCompareTab = () => {
    if (!compareStatsData) {
      return React.createElement(
        'div', 
        { className: 'stats-tab-content compare-content' },
        React.createElement('div', { className: 'loading-compare' }, 'Cargando datos de comparación...')
      );
    }

    const calculateDifference = (current, compare) => {
      const diff = current - compare;
      const percentage = compare > 0 ? Math.round((diff / compare) * 100) : 0;
      return { diff, percentage };
    };

    const videoComparisonItems = Object.entries({
      [VIDEO_MAIN_STATUS.DEVELOPMENT]: 'Desarrollo',
      [VIDEO_MAIN_STATUS.PRODUCTION]: 'Producción',
      [VIDEO_MAIN_STATUS.PUBLISHED]: 'Publicado'
    }).map(([status, label]) => {
      const current = videoStats[status];
      const compare = compareVideoStats[status];
      const { diff, percentage } = calculateDifference(current, compare);
      
      return React.createElement(
        'div',
        { key: `video-compare-item-${status}`, className: 'comparison-item' },
        [
          React.createElement('span', { key: `video-emoji-${status}` }, STATUS_EMOJIS[status]),
          React.createElement('span', { key: `video-label-${status}` }, label),
          React.createElement('span', { key: `video-current-${status}` }, current),
          React.createElement('span', { key: `video-vs-${status}` }, 'vs'),
          React.createElement('span', { key: `video-compare-value-${status}` }, compare),
          React.createElement(
            'span',
            { 
              key: `video-diff-${status}`,
              className: `diff ${diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral'}`
            },
            `${diff > 0 ? '+' : ''}${diff} (${percentage > 0 ? '+' : ''}${percentage}%)`
          )
        ]
      );
    });

    const incomeDiffResult = (() => {
      const { diff, percentage } = calculateDifference(incomeStats.totalInARS, compareIncomeStats.totalInARS);
      return React.createElement(
        'span',
        { 
          className: `diff ${diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral'}` 
        },
        `${diff > 0 ? '+' : ''}${formatCurrency(diff)} (${percentage > 0 ? '+' : ''}${percentage}%)`
      );
    })();

    return React.createElement(
      'div',
      { className: 'stats-tab-content compare-content' },
      [
        React.createElement(
          'div',
          { key: 'compare-controls', className: 'compare-controls' },
          [
            React.createElement('label', { key: 'compare-label' }, 'Comparar con:'),
            React.createElement('input', {
              key: 'compare-date-input',
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
                React.createElement('h4', { key: 'video-comp-title' }, 'Videos: Estado Principal'),
                React.createElement('div', { key: 'video-comp-items', className: 'comparison-items' }, videoComparisonItems)
              ]
            ),
            
            React.createElement(
              'div',
              { key: 'income-comparison', className: 'comparison-section' },
              [
                React.createElement('h4', { key: 'income-comp-title' }, 'Ingresos Totales'),
                React.createElement(
                  'div',
                  { key: 'total-income-comparison', className: 'total-income-comparison' },
                  [
                    React.createElement(
                      'div',
                      { key: 'current-month-income', className: 'month-income current' },
                      [
                        React.createElement('span', { key: 'current-month-label' }, monthName),
                        React.createElement('span', { key: 'current-month-amount' }, formatCurrency(incomeStats.totalInARS))
                      ]
                    ),
                    React.createElement('span', { key: 'income-vs' }, 'vs'),
                    React.createElement(
                      'div',
                      { key: 'compare-month-income', className: 'month-income compare' },
                      [
                        React.createElement('span', { key: 'compare-month-label' }, compareMonthName),
                        React.createElement('span', { key: 'compare-month-amount' }, formatCurrency(compareIncomeStats.totalInARS))
                      ]
                    ),
                    React.createElement(
                      'div',
                      { key: 'income-difference', className: 'income-difference' },
                      incomeDiffResult
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

  // Renderizar contenido de pestaña activa
  const renderActiveTabContent = () => {
    if (activeTab === 'overview') {
      return React.createElement(StatsOverviewPanel, {
        monthData: currentStatsData,
        currentDate: currentStatsDate,
        plugin: plugin,
        compact: false
      });
    } else if (activeTab === 'charts') {
      return renderChartsTab();
    } else if (activeTab === 'compare') {
      return renderCompareTab();
    }
    return null;
  };

  return React.createElement(
    'div',
    { className: 'video-scheduler-stats-panel advanced' },
    [
      React.createElement(
        'div',
        { key: 'stats-header', className: 'stats-panel-header' },
        [
          React.createElement(
            'div',
            { key: 'title-section', className: 'stats-panel-title-section' },
            [
              React.createElement(
                'button',
                { 
                  key: 'prev-month-btn',
                  className: 'month-nav-button',
                  onClick: handlePrevMonth 
                },
                '←'
              ),
              React.createElement('h2', { key: 'stats-title' }, `Estadísticas - ${monthName}`),
              React.createElement(
                'button',
                { 
                  key: 'next-month-btn',
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
              key: 'close-btn',
              className: 'stats-panel-close',
              onClick: onClose 
            },
            '✕'
          )
        ]
      ),
      
      React.createElement(
        'div',
        { key: 'stats-content', className: 'stats-panel-content' },
        [
          React.createElement('div', { key: 'tab-buttons-container' }, renderTabButtons()),
          React.createElement('div', { key: 'active-tab-content' }, renderActiveTabContent())
        ]
      )
    ]
  );
}

export default StatsPanel;