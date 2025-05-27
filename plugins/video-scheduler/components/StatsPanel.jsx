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
  const modalRef = React.useRef(null); // <--- 1. Crear la referencia
  const [currentStatsDate, setCurrentStatsDate] = React.useState(new Date(currentDate));
  const [compareMode, setCompareMode] = React.useState(false);
  const [compareDate, setCompareDate] = React.useState(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const [currentStatsData, setCurrentStatsData] = React.useState(monthData);
  const [compareStatsData, setCompareStatsData] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('overview');

  // <--- 2. useEffect para manejar clic fuera --->
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    // Agregar el listener después de un pequeño delay
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]); // Dependencia: onClose

  // <--- 3. (Opcional pero recomendado) useEffect para manejar tecla Escape --->
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]); // Dependencia: onClose


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

    if (data && data.videos) {
      Object.entries(data.videos).forEach(([key, video]) => {
        if (key.startsWith(monthKey)) {
          filteredVideos[key] = video;
        }
      });
    }

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

  React.useEffect(() => {
    const updateCurrentStats = async () => {
      const data = await loadStatsForDate(currentStatsDate);
      setCurrentStatsData(data);
    };
    updateCurrentStats();
  }, [currentStatsDate, loadStatsForDate]);

  React.useEffect(() => {
    if (compareMode) {
      const updateCompareStats = async () => {
        const data = await loadStatsForDate(compareDate);
        setCompareStatsData(data);
      };
      updateCompareStats();
    }
  }, [compareMode, compareDate, loadStatsForDate]);


  const handlePrevMonth = () => {
    setCurrentStatsDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentStatsDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const calculateVideoStats = (data) => {
    const stats = {
      [VIDEO_MAIN_STATUS.PENDING]: 0, [VIDEO_MAIN_STATUS.EMPTY]: 0, [VIDEO_MAIN_STATUS.DEVELOPMENT]: 0,
      [VIDEO_MAIN_STATUS.PRODUCTION]: 0, [VIDEO_MAIN_STATUS.PUBLISHED]: 0,
      [VIDEO_SUB_STATUS.REC]: 0, [VIDEO_SUB_STATUS.EDITING]: 0, [VIDEO_SUB_STATUS.THUMBNAIL]: 0,
      [VIDEO_SUB_STATUS.SCHEDULING_POST]: 0, [VIDEO_SUB_STATUS.SCHEDULED]: 0,
      [VIDEO_STACKABLE_STATUS.QUESTION]: 0, [VIDEO_STACKABLE_STATUS.WARNING]: 0,
      total: 0, withAlerts: 0, withQuestions: 0
    };
    if (data && data.videos) {
      Object.values(data.videos).forEach(video => {
        stats.total++;
        if (video.status) stats[video.status]++;
        if (video.subStatus) stats[video.subStatus]++;
        if (video.stackableStatuses) {
          video.stackableStatuses.forEach(s => {
            if (stats[s] !== undefined) stats[s]++;
            if (s === VIDEO_STACKABLE_STATUS.WARNING) stats.withAlerts++;
            if (s === VIDEO_STACKABLE_STATUS.QUESTION) stats.withQuestions++;
          });
        }
      });
    }
    return stats;
  };

  const calculateIncomeStats = (data) => {
    const incomeStats = {
      totalByCurrency: {}, totalInARS: 0, paidByCurrency: {}, pendingByCurrency: {},
      totalPaidInARS: 0, totalPendingInARS: 0
    };
    const exchangeRates = plugin._pluginData?.settings?.currencyRates || { USD: 870, EUR: 950, ARS: 1 };
    if (data && data.dailyIncomes) {
      Object.values(data.dailyIncomes).forEach(income => {
        if (income && income.amount > 0) {
          const currency = income.currency || 'USD';
          const amount = parseFloat(income.amount) || 0;
          const rate = exchangeRates[currency] || 1;
          incomeStats.totalByCurrency[currency] = (incomeStats.totalByCurrency[currency] || 0) + amount;
          incomeStats.totalInARS += amount * rate;
          if (income.status === 'paid') {
            incomeStats.paidByCurrency[currency] = (incomeStats.paidByCurrency[currency] || 0) + amount;
            incomeStats.totalPaidInARS += amount * rate;
          } else {
            incomeStats.pendingByCurrency[currency] = (incomeStats.pendingByCurrency[currency] || 0) + amount;
            incomeStats.totalPendingInARS += amount * rate;
          }
        }
      });
    }
    return incomeStats;
  };

  const videoStats = calculateVideoStats(currentStatsData);
  const incomeStats = calculateIncomeStats(currentStatsData);
  const compareVideoStats = compareMode && compareStatsData ? calculateVideoStats(compareStatsData) : null;
  const compareIncomeStats = compareMode && compareStatsData ? calculateIncomeStats(compareStatsData) : null;

  const monthName = currentStatsDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const compareMonthName = compareDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const formatCurrency = (amount, currency = 'ARS') => {
    const symbols = { USD: '$', EUR: '€', ARS: '$' };
    return `${symbols[currency] || ''}${Math.round(amount).toLocaleString()} ${currency}`;
  };

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
            if (tab.id === 'compare' && !compareMode) {
              setCompareMode(true);
            }
          }
        },
        tab.label
      )
    );

    return React.createElement('div', { className: 'stats-tabs' }, tabButtons);
  };

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
      { className: 'charts-content' },
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

  const renderCompareTab = () => {
    if (!compareStatsData) {
      return React.createElement(
        'div',
        { className: 'compare-content loading-compare' },
        'Cargando datos de comparación...'
      );
    }

    const calculateDifference = (current, compare) => {
      const diff = current - compare;
      const percentage = compare > 0 ? Math.round((diff / compare) * 100) : (current > 0 ? 100 : 0);
      return { diff, percentage };
    };

    const videoComparisonItems = Object.entries({
      [VIDEO_MAIN_STATUS.DEVELOPMENT]: 'Desarrollo',
      [VIDEO_MAIN_STATUS.PRODUCTION]: 'Producción',
      [VIDEO_MAIN_STATUS.PUBLISHED]: 'Publicado'
    }).map(([status, label]) => {
      const current = videoStats[status];
      const compare = compareVideoStats ? compareVideoStats[status] : 0;
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
      const currentTotal = incomeStats.totalInARS;
      const compareTotal = compareIncomeStats ? compareIncomeStats.totalInARS : 0;
      const { diff, percentage } = calculateDifference(currentTotal, compareTotal);
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
      { className: 'compare-content' },
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
                const [year, monthVal] = e.target.value.split('-');
                if (year && monthVal) {
                  setCompareDate(new Date(parseInt(year), parseInt(monthVal) - 1, 1));
                }
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
                        React.createElement('span', { key: 'compare-month-amount' }, formatCurrency(compareIncomeStats ? compareIncomeStats.totalInARS : 0))
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
    { className: 'video-scheduler-stats-panel advanced' }, // Este es el overlay
    [
      React.createElement( // Este es el contenido del modal
        'div',
        {
          ref: modalRef, // <--- 4. Asignar la referencia al contenido del modal
          key: 'stats-content',
          className: 'stats-panel-content'
        },
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
          React.createElement('div', { key: 'tab-buttons-container', className: 'stats-tab-buttons-container' }, renderTabButtons()),
          React.createElement('div', { key: 'active-tab-content-container', className: 'active-tab-content-container' }, renderActiveTabContent())
        ]
      )
    ]
  );
}

export default StatsPanel;