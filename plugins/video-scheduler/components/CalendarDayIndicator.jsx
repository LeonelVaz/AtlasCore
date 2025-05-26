// video-scheduler/components/CalendarDayIndicator.jsx
import { useState, useEffect } from 'react';
import { getStatusEmoji } from '../utils/videoUtils.js';
import { VIDEO_STATUS } from '../utils/constants.js';

export default function CalendarDayIndicator(props) {
  const { date, plugin, core } = props;
  const [dayVideos, setDayVideos] = useState([]);
  const [showTooltip, setShowTooltip] = useState(false);

  // Cargar videos para esta fecha
  useEffect(() => {
    if (!date || !plugin) return;
    
    const dateStr = date.toISOString().split('T')[0];
    const videos = plugin.publicAPI.getVideosByDate(dateStr);
    setDayVideos(videos);
  }, [date, plugin]);

  // Suscribirse a cambios en los videos
  useEffect(() => {
    if (!plugin || !core) return;

    const unsubscribers = [
      core.events.subscribe(plugin.id, `${plugin.id}.videoCreated`, updateVideos),
      core.events.subscribe(plugin.id, `${plugin.id}.videoUpdated`, updateVideos),
      core.events.subscribe(plugin.id, `${plugin.id}.videoDeleted`, updateVideos),
      core.events.subscribe(plugin.id, `${plugin.id}.bulkVideosAdded`, updateVideos)
    ];

    function updateVideos() {
      if (date) {
        const dateStr = date.toISOString().split('T')[0];
        const videos = plugin.publicAPI.getVideosByDate(dateStr);
        setDayVideos(videos);
      }
    }

    return () => {
      unsubscribers.forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
    };
  }, [date, plugin, core]);

  // No mostrar nada si no hay videos
  if (!dayVideos || dayVideos.length === 0) {
    return null;
  }

  const getIndicatorColor = () => {
    // Prioridad de colores según el estado más avanzado
    const statusPriority = {
      [VIDEO_STATUS.PUBLISHED]: '#059669',
      [VIDEO_STATUS.READY_TO_PUBLISH]: '#10B981',
      [VIDEO_STATUS.REVIEW]: '#06B6D4',
      [VIDEO_STATUS.EDITING]: '#EF4444',
      [VIDEO_STATUS.RECORDING]: '#F59E0B',
      [VIDEO_STATUS.SCRIPTING]: '#8B5CF6',
      [VIDEO_STATUS.PLANNED]: '#3B82F6',
      [VIDEO_STATUS.ARCHIVED]: '#6B7280'
    };

    const statuses = dayVideos.map(v => v.status);
    
    // Encontrar el estado con mayor prioridad (más avanzado)
    for (const status of Object.keys(statusPriority)) {
      if (statuses.includes(status)) {
        return statusPriority[status];
      }
    }
    
    return '#3B82F6'; // Color por defecto
  };

  const getTooltipContent = () => {
    if (dayVideos.length === 1) {
      const video = dayVideos[0];
      return `${getStatusEmoji(video.status)} ${video.title} (${video.status})`;
    }
    
    // Múltiples videos
    const statusCounts = dayVideos.reduce((acc, video) => {
      acc[video.status] = (acc[video.status] || 0) + 1;
      return acc;
    }, {});

    const summary = Object.entries(statusCounts)
      .map(([status, count]) => `${getStatusEmoji(status)} ${count} ${status}`)
      .join('\n');

    return `${dayVideos.length} videos programados:\n${summary}`;
  };

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Navegar a la página del plugin con la fecha seleccionada
    if (core && core.ui) {
      // Intentar navegar al plugin (esto dependería de cómo Atlas maneja la navegación)
      try {
        // Esta es una implementación conceptual - la API real podría ser diferente
        core.events.publish(plugin.id, 'navigate.to.plugin', {
          pluginId: plugin.id,
          pageId: 'main-scheduler',
          params: { selectedDate: date.toISOString().split('T')[0] }
        });
      } catch (error) {
        console.warn('No se pudo navegar al plugin:', error);
      }
    }
  };

  return React.createElement(
    'div',
    {
      className: 'videoscheduler-day-indicator',
      style: {
        position: 'relative',
        display: 'inline-block',
        marginLeft: '4px'
      },
      onMouseEnter: () => setShowTooltip(true),
      onMouseLeave: () => setShowTooltip(false),
      onClick: handleClick
    },
    [
      // Indicador principal
      React.createElement(
        'span',
        {
          key: 'indicator',
          style: {
            backgroundColor: getIndicatorColor(),
            color: 'white',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: '11px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'inline-block',
            minWidth: '18px',
            textAlign: 'center',
            lineHeight: '1.2',
            transition: 'all 0.2s ease'
          },
          title: getTooltipContent()
        },
        dayVideos.length
      ),

      // Tooltip detallado (opcional, más sofisticado)
      showTooltip && React.createElement(Tooltip, {
        key: 'tooltip',
        videos: dayVideos,
        onClose: () => setShowTooltip(false)
      })
    ]
  );
}

// Componente de tooltip más detallado
const Tooltip = (props) => {
  const { videos, onClose } = props;

  return React.createElement(
    'div',
    {
      className: 'video-tooltip',
      style: {
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'var(--modal-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-md)',
        padding: 'var(--spacing-sm)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 1000,
        minWidth: '200px',
        maxWidth: '300px',
        marginTop: '4px'
      }
    },
    [
      // Header del tooltip
      React.createElement(
        'div',
        {
          key: 'header',
          style: {
            fontWeight: '600',
            marginBottom: 'var(--spacing-xs)',
            color: 'var(--text-color)'
          }
        },
        `${videos.length} video${videos.length > 1 ? 's' : ''} programado${videos.length > 1 ? 's' : ''}`
      ),

      // Lista de videos
      React.createElement(
        'div',
        { key: 'videos', className: 'tooltip-videos' },
        videos.slice(0, 5).map(video =>
          React.createElement(
            'div',
            {
              key: video.id,
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--spacing-xs) 0',
                borderBottom: videos.indexOf(video) < Math.min(videos.length, 5) - 1 ? 
                  '1px solid var(--border-color)' : 'none'
              }
            },
            [
              React.createElement(
                'div',
                { key: 'info', style: { flex: 1, minWidth: 0 } },
                [
                  React.createElement(
                    'div',
                    {
                      key: 'title',
                      style: {
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: 'var(--text-color)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }
                    },
                    video.title
                  ),
                  React.createElement(
                    'div',
                    {
                      key: 'meta',
                      style: {
                        fontSize: '0.75rem',
                        color: 'var(--text-color-secondary)',
                        marginTop: '2px'
                      }
                    },
                    `${video.slot.timeSlot} • ${video.platform}`
                  )
                ]
              ),
              React.createElement(
                'span',
                {
                  key: 'status',
                  style: {
                    fontSize: '0.75rem',
                    marginLeft: 'var(--spacing-xs)'
                  },
                  title: video.status
                },
                getStatusEmoji(video.status)
              )
            ]
          )
        )
      ),

      // Indicador de más videos si hay muchos
      videos.length > 5 && React.createElement(
        'div',
        {
          key: 'more',
          style: {
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--text-color-secondary)',
            marginTop: 'var(--spacing-xs)',
            fontStyle: 'italic'
          }
        },
        `... y ${videos.length - 5} más`
      ),

      // Footer con acción
      React.createElement(
        'div',
        {
          key: 'footer',
          style: {
            marginTop: 'var(--spacing-sm)',
            paddingTop: 'var(--spacing-xs)',
            borderTop: '1px solid var(--border-color)',
            textAlign: 'center'
          }
        },
        React.createElement(
          'button',
          {
            style: {
              background: 'none',
              border: 'none',
              color: 'var(--primary-color)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            },
            onClick: () => {
              // Aquí se podría implementar la navegación al plugin
              onClose();
            }
          },
          'Ver en Video Scheduler'
        )
      )
    ]
  );
};

// Variante simple del indicador para uso minimal
export const SimpleVideoIndicator = (props) => {
  const { date, plugin } = props;
  const [videoCount, setVideoCount] = useState(0);

  useEffect(() => {
    if (!date || !plugin) return;
    
    const dateStr = date.toISOString().split('T')[0];
    const videos = plugin.publicAPI.getVideosByDate(dateStr);
    setVideoCount(videos.length);
  }, [date, plugin]);

  if (videoCount === 0) return null;

  return React.createElement(
    'span',
    {
      className: 'simple-video-indicator',
      style: {
        backgroundColor: 'var(--primary-color)',
        color: 'white',
        borderRadius: '50%',
        padding: '1px 4px',
        fontSize: '10px',
        fontWeight: '500',
        marginLeft: '2px',
        display: 'inline-block',
        minWidth: '14px',
        textAlign: 'center'
      },
      title: `${videoCount} video${videoCount > 1 ? 's' : ''} programado${videoCount > 1 ? 's' : ''}`
    },
    videoCount
  );
};