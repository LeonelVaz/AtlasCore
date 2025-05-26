// video-scheduler/components/VideoStatsDisplay.jsx
import { useState, useEffect, useMemo } from 'react';
import { 
  getVideoCountByStatus, 
  calculateTotalEarnings, 
  calculateProductionStats,
  formatCurrency,
  getStatusEmoji
} from '../utils/videoUtils.js';
import { VIDEO_STATUS, STATUS_EMOJIS } from '../utils/constants.js';

export default function VideoStatsDisplay(props) {
  const { videos, plugin } = props;
  const [dateRange, setDateRange] = useState('all');
  const [filteredVideos, setFilteredVideos] = useState(videos);
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  // Filtrar videos según los filtros seleccionados
  useEffect(() => {
    let filtered = [...videos];

    // Filtro por rango de fechas
    if (dateRange !== 'all') {
      const now = new Date();
      const startDate = new Date();

      switch (dateRange) {
        case 'thisMonth':
          startDate.setDate(1);
          break;
        case 'lastMonth':
          startDate.setMonth(now.getMonth() - 1, 1);
          break;
        case 'thisYear':
          startDate.setMonth(0, 1);
          break;
        case 'last30days':
          startDate.setDate(now.getDate() - 30);
          break;
        case 'last90days':
          startDate.setDate(now.getDate() - 90);
          break;
      }

      const endDate = dateRange === 'lastMonth' ? 
        new Date(now.getFullYear(), now.getMonth(), 0) : now;

      filtered = filtered.filter(video => {
        const videoDate = new Date(video.slot.date);
        return videoDate >= startDate && videoDate <= endDate;
      });
    }

    // Filtro por plataforma
    if (selectedPlatform !== 'all') {
      filtered = filtered.filter(video => video.platform === selectedPlatform);
    }

    setFilteredVideos(filtered);
  }, [videos, dateRange, selectedPlatform]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const statusCounts = getVideoCountByStatus(filteredVideos);
    const earningsReport = calculateTotalEarnings(
      filteredVideos,
      plugin.publicAPI.getPluginSettings().currencyRates,
      plugin.publicAPI.getPluginSettings().defaultCurrency
    );
    const productionStats = calculateProductionStats(filteredVideos);
    
    // Estadísticas por plataforma
    const platformStats = filteredVideos.reduce((acc, video) => {
      acc[video.platform] = (acc[video.platform] || 0) + 1;
      return acc;
    }, {});

    // Estadísticas por mes
    const monthlyStats = filteredVideos.reduce((acc, video) => {
      const month = video.slot.date?.substring(0, 7) || 'Sin fecha';
      if (!acc[month]) {
        acc[month] = { count: 0, earnings: 0 };
      }
      acc[month].count++;
      if (video.earnings?.total) {
        acc[month].earnings += video.earnings.total;
      }
      return acc;
    }, {});

    // Videos próximos a vencer (en los próximos 7 días)
    const upcomingDeadlines = filteredVideos.filter(video => {
      if (video.status === VIDEO_STATUS.PUBLISHED) return false;
      const videoDate = new Date(video.slot.date);
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return videoDate >= now && videoDate <= sevenDaysFromNow;
    }).sort((a, b) => new Date(a.slot.date) - new Date(b.slot.date));

    return {
      statusCounts,
      earningsReport,
      productionStats,
      platformStats,
      monthlyStats,
      upcomingDeadlines
    };
  }, [filteredVideos, plugin]);

  const renderOverviewStats = () => {
    return React.createElement(
      'div',
      { className: 'stats-grid' },
      [
        React.createElement(
          'div',
          { className: 'stat-card', key: 'total-videos' },
          [
            React.createElement('h4', { key: 'title' }, 'Total de Videos'),
            React.createElement('div', { key: 'value', className: 'stat-value' }, 
              stats.productionStats.total
            ),
            React.createElement('div', { key: 'subtitle', className: 'stat-subtitle' }, 
              'En el periodo seleccionado'
            )
          ]
        ),

        React.createElement(
          'div',
          { className: 'stat-card', key: 'published' },
          [
            React.createElement('h4', { key: 'title' }, 'Videos Publicados'),
            React.createElement('div', { key: 'value', className: 'stat-value success' }, 
              stats.productionStats.published
            ),
            React.createElement('div', { key: 'subtitle', className: 'stat-subtitle' }, 
              `${stats.productionStats.completionRate.toFixed(1)}% del total`
            )
          ]
        ),

        React.createElement(
          'div',
          { className: 'stat-card', key: 'in-production' },
          [
            React.createElement('h4', { key: 'title' }, 'En Producción'),
            React.createElement('div', { key: 'value', className: 'stat-value warning' }, 
              stats.productionStats.inProduction
            ),
            React.createElement('div', { key: 'subtitle', className: 'stat-subtitle' }, 
              'Videos activos'
            )
          ]
        ),

        React.createElement(
          'div',
          { className: 'stat-card', key: 'planned' },
          [
            React.createElement('h4', { key: 'title' }, 'Planeados'),
            React.createElement('div', { key: 'value', className: 'stat-value info' }, 
              stats.productionStats.planned
            ),
            React.createElement('div', { key: 'subtitle', className: 'stat-subtitle' }, 
              'Por comenzar'
            )
          ]
        ),

        React.createElement(
          'div',
          { className: 'stat-card', key: 'total-earnings' },
          [
            React.createElement('h4', { key: 'title' }, 'Ingresos Totales'),
            React.createElement('div', { key: 'value', className: 'stat-value success' }, 
              formatCurrency(
                stats.earningsReport.totalInTargetCurrency,
                plugin.publicAPI.getPluginSettings().defaultCurrency
              )
            ),
            React.createElement('div', { key: 'subtitle', className: 'stat-subtitle' }, 
              `${stats.earningsReport.videoCount} videos con ingresos`
            )
          ]
        ),

        React.createElement(
          'div',
          { className: 'stat-card', key: 'avg-earnings' },
          [
            React.createElement('h4', { key: 'title' }, 'Promedio por Video'),
            React.createElement('div', { key: 'value', className: 'stat-value' }, 
              formatCurrency(
                stats.earningsReport.averageEarningsPerVideo,
                plugin.publicAPI.getPluginSettings().defaultCurrency
              )
            ),
            React.createElement('div', { key: 'subtitle', className: 'stat-subtitle' }, 
              'Ingresos promedio'
            )
          ]
        ),

        React.createElement(
          'div',
          { className: 'stat-card', key: 'total-duration' },
          [
            React.createElement('h4', { key: 'title' }, 'Duración Total'),
            React.createElement('div', { key: 'value', className: 'stat-value' }, 
              Math.floor(stats.productionStats.totalDuration / 60)
            ),
            React.createElement('div', { key: 'subtitle', className: 'stat-subtitle' }, 
              `horas (${stats.productionStats.totalDuration} min)`
            )
          ]
        ),

        React.createElement(
          'div',
          { className: 'stat-card', key: 'avg-duration' },
          [
            React.createElement('h4', { key: 'title' }, 'Duración Promedio'),
            React.createElement('div', { key: 'value', className: 'stat-value' }, 
              `${stats.productionStats.averageDuration.toFixed(1)}`
            ),
            React.createElement('div', { key: 'subtitle', className: 'stat-subtitle' }, 
              'minutos por video'
            )
          ]
        )
      ]
    );
  };

  const renderStatusBreakdown = () => {
    return React.createElement(
      'div',
      { className: 'status-breakdown' },
      [
        React.createElement('h3', { key: 'title' }, 'Videos por Estado'),
        React.createElement(
          'div',
          { className: 'status-list', key: 'list' },
          Object.entries(stats.statusCounts).map(([status, count]) =>
            React.createElement(
              'div',
              { 
                key: status, 
                className: `status-item status-${status}` 
              },
              [
                React.createElement('span', { key: 'emoji' }, getStatusEmoji(status)),
                React.createElement('span', { key: 'label' }, status),
                React.createElement('span', { key: 'count', className: 'status-count' }, count),
                React.createElement(
                  'div',
                  { 
                    key: 'bar',
                    className: 'status-bar' 
                  },
                  React.createElement('div', {
                    className: 'status-bar-fill',
                    style: { 
                      width: `${stats.productionStats.total > 0 ? (count / stats.productionStats.total) * 100 : 0}%` 
                    }
                  })
                )
              ]
            )
          )
        )
      ]
    );
  };

  const renderPlatformStats = () => {
    return React.createElement(
      'div',
      { className: 'platform-stats' },
      [
        React.createElement('h3', { key: 'title' }, 'Videos por Plataforma'),
        React.createElement(
          'div',
          { className: 'platform-list', key: 'list' },
          Object.entries(stats.platformStats)
            .sort(([,a], [,b]) => b - a)
            .map(([platform, count]) =>
              React.createElement(
                'div',
                { key: platform, className: 'platform-item' },
                [
                  React.createElement('span', { key: 'platform' }, platform),
                  React.createElement('span', { key: 'count' }, count),
                  React.createElement(
                    'div',
                    { key: 'bar', className: 'platform-bar' },
                    React.createElement('div', {
                      className: 'platform-bar-fill',
                      style: { 
                        width: `${stats.productionStats.total > 0 ? (count / stats.productionStats.total) * 100 : 0}%` 
                      }
                    })
                  )
                ]
              )
            )
        )
      ]
    );
  };

  const renderUpcomingDeadlines = () => {
    if (stats.upcomingDeadlines.length === 0) {
      return React.createElement(
        'div',
        { className: 'upcoming-deadlines' },
        [
          React.createElement('h3', { key: 'title' }, 'Próximos Deadlines'),
          React.createElement('p', { key: 'empty', className: 'text-muted' }, 
            'No hay deadlines próximos'
          )
        ]
      );
    }

    return React.createElement(
      'div',
      { className: 'upcoming-deadlines' },
      [
        React.createElement('h3', { key: 'title' }, 
          `Próximos Deadlines (${stats.upcomingDeadlines.length})`
        ),
        React.createElement(
          'div',
          { className: 'deadline-list', key: 'list' },
          stats.upcomingDeadlines.slice(0, 5).map(video =>
            React.createElement(
              'div',
              { key: video.id, className: 'deadline-item' },
              [
                React.createElement('div', { key: 'info', className: 'deadline-info' },
                  [
                    React.createElement('strong', { key: 'title' }, video.title),
                    React.createElement('span', { key: 'status' }, 
                      `${getStatusEmoji(video.status)} ${video.status}`
                    )
                  ]
                ),
                React.createElement('div', { key: 'date', className: 'deadline-date' },
                  new Date(video.slot.date).toLocaleDateString('es-ES', {
                    month: 'short',
                    day: 'numeric'
                  })
                )
              ]
            )
          )
        )
      ]
    );
  };

  const renderEarningsByMonth = () => {
    const monthlyEntries = Object.entries(stats.monthlyStats)
      .filter(([month]) => month !== 'Sin fecha')
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6); // Últimos 6 meses

    if (monthlyEntries.length === 0) {
      return null;
    }

    return React.createElement(
      'div',
      { className: 'earnings-by-month' },
      [
        React.createElement('h3', { key: 'title' }, 'Evolución Mensual'),
        React.createElement(
          'div',
          { className: 'monthly-chart', key: 'chart' },
          monthlyEntries.map(([month, data]) =>
            React.createElement(
              'div',
              { key: month, className: 'monthly-item' },
              [
                React.createElement('div', { key: 'month' }, 
                  new Date(month + '-01').toLocaleDateString('es-ES', { 
                    month: 'short',
                    year: '2-digit' 
                  })
                ),
                React.createElement('div', { key: 'videos' }, 
                  `${data.count} videos`
                ),
                React.createElement('div', { key: 'earnings' }, 
                  formatCurrency(data.earnings, plugin.publicAPI.getPluginSettings().defaultCurrency)
                )
              ]
            )
          )
        )
      ]
    );
  };

  const handleExportStats = () => {
    const exportData = {
      dateRange,
      platform: selectedPlatform,
      totalVideos: stats.productionStats.total,
      statusBreakdown: stats.statusCounts,
      earnings: stats.earningsReport,
      platformStats: stats.platformStats,
      monthlyStats: stats.monthlyStats,
      generatedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video-scheduler-stats-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return React.createElement(
    'div',
    { className: 'video-stats-display' },
    [
      // Controles de filtro
      React.createElement(
        'div',
        { className: 'stats-controls', key: 'controls' },
        [
          React.createElement(
            'div',
            { className: 'filter-group', key: 'date-filter' },
            [
              React.createElement('label', { key: 'label' }, 'Período:'),
              React.createElement(
                'select',
                {
                  key: 'select',
                  value: dateRange,
                  onChange: (e) => setDateRange(e.target.value)
                },
                [
                  React.createElement('option', { key: 'all', value: 'all' }, 'Todo el tiempo'),
                  React.createElement('option', { key: 'thisMonth', value: 'thisMonth' }, 'Este mes'),
                  React.createElement('option', { key: 'lastMonth', value: 'lastMonth' }, 'Mes pasado'),
                  React.createElement('option', { key: 'last30days', value: 'last30days' }, 'Últimos 30 días'),
                  React.createElement('option', { key: 'last90days', value: 'last90days' }, 'Últimos 90 días'),
                  React.createElement('option', { key: 'thisYear', value: 'thisYear' }, 'Este año')
                ]
              )
            ]
          ),

          React.createElement(
            'div',
            { className: 'filter-group', key: 'platform-filter' },
            [
              React.createElement('label', { key: 'label' }, 'Plataforma:'),
              React.createElement(
                'select',
                {
                  key: 'select',
                  value: selectedPlatform,
                  onChange: (e) => setSelectedPlatform(e.target.value)
                },
                [
                  React.createElement('option', { key: 'all', value: 'all' }, 'Todas'),
                  ...Object.keys(stats.platformStats).map(platform =>
                    React.createElement('option', { key: platform, value: platform }, platform)
                  )
                ]
              )
            ]
          ),

          React.createElement('button', {
            key: 'export',
            onClick: handleExportStats,
            className: 'btn-secondary'
          }, '📊 Exportar Estadísticas')
        ]
      ),

      // Estadísticas generales
      React.createElement(
        'div',
        { className: 'stats-section', key: 'overview' },
        [
          React.createElement('h2', { key: 'title' }, 'Resumen General'),
          renderOverviewStats()
        ]
      ),

      // Desglose por estado
      React.createElement(
        'div',
        { className: 'stats-section', key: 'status' },
        renderStatusBreakdown()
      ),

      // Grid de estadísticas adicionales
      React.createElement(
        'div',
        { className: 'stats-grid-2col', key: 'additional' },
        [
          renderPlatformStats(),
          renderUpcomingDeadlines()
        ]
      ),

      // Evolución mensual
      renderEarningsByMonth()
    ]
  );
}