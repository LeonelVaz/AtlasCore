// video-scheduler/components/VideoSchedulerPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { VIDEO_STATUS, VIDEO_TIME_SLOTS } from '../utils/constants.js';
import { formatDate, getStatusEmoji, getTimeSlotLabel } from '../utils/videoUtils.js';

export default function VideoSchedulerPage(props) {
  const { plugin, core } = props;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'calendar', 'list'
  const [filters, setFilters] = useState({
    status: '',
    platform: '',
    timeSlot: '',
    search: ''
  });
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [loading, setLoading] = useState(false);

  // Cargar videos del mes actual
  const loadVideos = useCallback(() => {
    setLoading(true);
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const monthVideos = plugin.publicAPI.getVideosInDateRange(
        startOfMonth.toISOString().split('T')[0],
        endOfMonth.toISOString().split('T')[0]
      );
      
      setVideos(monthVideos);
    } catch (error) {
      console.error('Error al cargar videos:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate, plugin]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...videos];

    if (filters.status) {
      filtered = filtered.filter(video => video.status === filters.status);
    }
    
    if (filters.platform) {
      filtered = filtered.filter(video => video.platform === filters.platform);
    }
    
    if (filters.timeSlot) {
      filtered = filtered.filter(video => video.slot.timeSlot === filters.timeSlot);
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(video => 
        video.title.toLowerCase().includes(searchTerm) ||
        video.description.toLowerCase().includes(searchTerm) ||
        video.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    setFilteredVideos(filtered);
  }, [videos, filters]);

  // Cargar videos cuando cambie la fecha
  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  // Suscribirse a eventos del plugin
  useEffect(() => {
    const unsubscribers = [
      core.events.subscribe(plugin.id, `${plugin.id}.videoCreated`, loadVideos),
      core.events.subscribe(plugin.id, `${plugin.id}.videoUpdated`, loadVideos),
      core.events.subscribe(plugin.id, `${plugin.id}.videoDeleted`, loadVideos),
      core.events.subscribe(plugin.id, `${plugin.id}.bulkVideosAdded`, loadVideos)
    ];

    return () => {
      unsubscribers.forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
    };
  }, [core, plugin, loadVideos]);

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const handleCreateVideo = (slotDate = null, timeSlot = 'morning') => {
    setEditingVideo({
      slot: { 
        date: slotDate || new Date().toISOString().split('T')[0], 
        timeSlot: timeSlot 
      }
    });
    setShowVideoModal(true);
  };

  const handleEditVideo = (video) => {
    setEditingVideo(video);
    setShowVideoModal(true);
  };

  const handleDeleteVideo = async (videoId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este video?')) {
      try {
        await plugin.publicAPI.deleteVideo(videoId);
      } catch (error) {
        console.error('Error al eliminar video:', error);
        alert('Error al eliminar el video');
      }
    }
  };

  const handleSaveVideo = async (videoData) => {
    try {
      if (editingVideo && editingVideo.id) {
        await plugin.publicAPI.updateVideo(editingVideo.id, videoData);
      } else {
        await plugin.publicAPI.createVideo(videoData);
      }
      setShowVideoModal(false);
      setEditingVideo(null);
    } catch (error) {
      console.error('Error al guardar video:', error);
      alert('Error al guardar el video');
    }
  };

  const handleBulkAdd = async (bulkData) => {
    try {
      await plugin.publicAPI.addBulkVideos(bulkData);
      setShowBulkModal(false);
    } catch (error) {
      console.error('Error al añadir videos en lote:', error);
      alert('Error al añadir videos en lote');
    }
  };

  const renderVideoCard = (video) => {
    return React.createElement(VideoCard, {
      key: video.id,
      video: video,
      onEdit: () => handleEditVideo(video),
      onDelete: () => handleDeleteVideo(video.id),
      plugin: plugin
    });
  };

  const renderCalendarView = () => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startOfWeek = new Date(startOfMonth);
    startOfWeek.setDate(startOfMonth.getDate() - startOfMonth.getDay());
    
    const days = [];
    const currentCalendarDate = new Date(startOfWeek);
    
    // Generar 42 días (6 semanas)
    for (let i = 0; i < 42; i++) {
      const dateStr = currentCalendarDate.toISOString().split('T')[0];
      const dayVideos = videos.filter(video => video.slot.date === dateStr);
      const isCurrentMonth = currentCalendarDate.getMonth() === currentDate.getMonth();
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      
      days.push(
        React.createElement(
          'div',
          {
            key: dateStr,
            className: `calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`,
            onClick: () => handleCreateVideo(dateStr, 'morning')
          },
          [
            React.createElement(
              'div',
              { className: 'calendar-day-number', key: 'number' },
              currentCalendarDate.getDate()
            ),
            React.createElement(
              'div',
              { className: 'calendar-day-videos', key: 'videos' },
              dayVideos.slice(0, 3).map(video =>
                React.createElement(
                  'div',
                  {
                    key: video.id,
                    className: 'calendar-video-item',
                    onClick: (e) => {
                      e.stopPropagation();
                      handleEditVideo(video);
                    }
                  },
                  `${getStatusEmoji(video.status)} ${video.title.substring(0, 20)}${video.title.length > 20 ? '...' : ''}`
                )
              )
            ),
            dayVideos.length > 3 && React.createElement(
              'div',
              { className: 'calendar-more-videos', key: 'more' },
              `+${dayVideos.length - 3} más`
            )
          ]
        )
      );
      
      currentCalendarDate.setDate(currentCalendarDate.getDate() + 1);
    }

    return React.createElement(
      'div',
      { className: 'videoscheduler-calendar' },
      [
        React.createElement(
          'div',
          { className: 'calendar-grid', key: 'grid' },
          [
            // Headers de días de la semana
            ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day =>
              React.createElement(
                'div',
                { className: 'calendar-day-header', key: day },
                day
              )
            ),
            // Días del calendario
            ...days
          ]
        )
      ]
    );
  };

  const renderFilterBar = () => {
    return React.createElement(
      'div',
      { className: 'filter-bar' },
      [
        React.createElement('input', {
          key: 'search',
          type: 'text',
          placeholder: 'Buscar videos...',
          value: filters.search,
          onChange: (e) => setFilters(prev => ({ ...prev, search: e.target.value }))
        }),
        
        React.createElement(
          'select',
          {
            key: 'status-filter',
            value: filters.status,
            onChange: (e) => setFilters(prev => ({ ...prev, status: e.target.value }))
          },
          [
            React.createElement('option', { key: 'all', value: '' }, 'Todos los estados'),
            ...Object.values(VIDEO_STATUS).map(status =>
              React.createElement('option', { key: status, value: status }, 
                `${getStatusEmoji(status)} ${status}`
              )
            )
          ]
        ),

        React.createElement(
          'select',
          {
            key: 'timeslot-filter',
            value: filters.timeSlot,
            onChange: (e) => setFilters(prev => ({ ...prev, timeSlot: e.target.value }))
          },
          [
            React.createElement('option', { key: 'all', value: '' }, 'Todas las franjas'),
            ...VIDEO_TIME_SLOTS.map(slot =>
              React.createElement('option', { key: slot, value: slot }, 
                getTimeSlotLabel(slot)
              )
            )
          ]
        ),

        React.createElement(
          'div',
          { className: 'view-mode-selector', key: 'view-mode' },
          [
            React.createElement('button', {
              key: 'grid',
              className: `btn-icon ${viewMode === 'grid' ? 'active' : ''}`,
              onClick: () => setViewMode('grid'),
              title: 'Vista de rejilla'
            }, '⊞'),
            React.createElement('button', {
              key: 'calendar',
              className: `btn-icon ${viewMode === 'calendar' ? 'active' : ''}`,
              onClick: () => setViewMode('calendar'),
              title: 'Vista de calendario'
            }, '📅'),
            React.createElement('button', {
              key: 'list',
              className: `btn-icon ${viewMode === 'list' ? 'active' : ''}`,
              onClick: () => setViewMode('list'),
              title: 'Vista de lista'
            }, '☰')
          ]
        )
      ]
    );
  };

  return React.createElement(
    'div',
    { className: 'videoscheduler-page' },
    [
      // Header
      React.createElement(
        'div',
        { className: 'videoscheduler-header', key: 'header' },
        [
          React.createElement('h1', { key: 'title' }, 'Video Scheduler'),
          React.createElement(
            'div',
            { className: 'videoscheduler-controls', key: 'controls' },
            [
              React.createElement(
                'button',
                {
                  key: 'add-video',
                  onClick: () => handleCreateVideo(),
                  className: 'btn-primary'
                },
                '➕ Añadir Video'
              ),
              React.createElement(
                'button',
                {
                  key: 'bulk-add',
                  onClick: () => setShowBulkModal(true),
                  className: 'btn-secondary'
                },
                '📦 Añadir en Lote'
              ),
              React.createElement(
                'button',
                {
                  key: 'stats',
                  onClick: () => setShowStatsModal(true),
                  className: 'btn-secondary'
                },
                '📊 Estadísticas'
              ),
              React.createElement(
                'button',
                {
                  key: 'prev-month',
                  onClick: handlePrevMonth
                },
                '← Mes Anterior'
              ),
              React.createElement(
                'span',
                { key: 'current-month', className: 'calendar-month-title' },
                currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
              ),
              React.createElement(
                'button',
                {
                  key: 'next-month',
                  onClick: handleNextMonth
                },
                'Mes Siguiente →'
              )
            ]
          )
        ]
      ),

      // Barra de filtros
      renderFilterBar(),

      // Contenido principal
      loading ? React.createElement(
        'div',
        { className: 'loading-container', key: 'loading' },
        'Cargando videos...'
      ) : (
        viewMode === 'calendar' ? renderCalendarView() :
        viewMode === 'list' ? React.createElement(
          'div',
          { className: 'videoscheduler-list', key: 'list' },
          filteredVideos.map(renderVideoCard)
        ) :
        React.createElement(
          'div',
          { className: 'videoscheduler-videos', key: 'grid' },
          filteredVideos.map(renderVideoCard)
        )
      ),

      // Modales
      showVideoModal && React.createElement(
        'div',
        { className: 'modal-overlay', key: 'video-modal' },
        React.createElement(
          'div',
          { className: 'modal-content' },
          [
            React.createElement('h2', { key: 'modal-title' }, 
              editingVideo?.id ? 'Editar Video' : 'Nuevo Video'
            ),
            React.createElement(VideoForm, {
              key: 'video-form',
              video: editingVideo,
              onSave: handleSaveVideo,
              onCancel: () => {
                setShowVideoModal(false);
                setEditingVideo(null);
              },
              plugin: plugin
            })
          ]
        )
      ),

      showBulkModal && React.createElement(
        'div',
        { className: 'modal-overlay', key: 'bulk-modal' },
        React.createElement(
          'div',
          { className: 'modal-content' },
          [
            React.createElement('h2', { key: 'modal-title' }, 'Añadir Videos en Lote'),
            React.createElement(BulkAddForm, {
              key: 'bulk-form',
              onSubmit: handleBulkAdd,
              onCancel: () => setShowBulkModal(false),
              plugin: plugin
            })
          ]
        )
      ),

      showStatsModal && React.createElement(
        'div',
        { className: 'modal-overlay', key: 'stats-modal' },
        React.createElement(
          'div',
          { className: 'modal-content' },
          [
            React.createElement('h2', { key: 'modal-title' }, 'Estadísticas'),
            React.createElement(VideoStatsDisplay, {
              key: 'stats-display',
              videos: videos,
              plugin: plugin
            }),
            React.createElement(
              'div',
              { className: 'form-actions', key: 'actions' },
              React.createElement(
                'button',
                {
                  onClick: () => setShowStatsModal(false),
                  className: 'btn-secondary'
                },
                'Cerrar'
              )
            )
          ]
        )
      )
    ]
  );
}

// Importar otros componentes (estos serían archivos separados)
const VideoCard = (props) => {
  const { video, onEdit, onDelete, plugin } = props;

  return React.createElement(
    'div',
    { className: 'video-card' },
    [
      React.createElement('h3', { key: 'title' }, video.title),
      React.createElement('p', { key: 'date' }, 
        `📅 ${formatDate(video.slot.date)} - ${getTimeSlotLabel(video.slot.timeSlot)}`
      ),
      React.createElement('p', { key: 'status' }, 
        `${getStatusEmoji(video.status)} ${video.status}`
      ),
      React.createElement('p', { key: 'platform' }, 
        `🎬 ${video.platform}`
      ),
      video.earnings?.total > 0 && React.createElement('p', { 
        key: 'earnings', 
        className: 'video-card-earnings' 
      }, 
        `💰 ${video.earnings.currency} ${video.earnings.total.toFixed(2)}`
      ),
      React.createElement(
        'div',
        { className: 'video-card-actions', key: 'actions' },
        [
          React.createElement('button', {
            key: 'edit',
            onClick: (e) => {
              e.stopPropagation();
              onEdit();
            },
            className: 'btn-icon',
            title: 'Editar'
          }, '✏️'),
          React.createElement('button', {
            key: 'delete',
            onClick: (e) => {
              e.stopPropagation();
              onDelete();
            },
            className: 'btn-icon',
            title: 'Eliminar'
          }, '🗑️')
        ]
      )
    ]
  );
};

const VideoForm = (props) => {
  // Este componente se implementaría en un archivo separado
  return React.createElement('div', {}, 'VideoForm - Implementar en archivo separado');
};

const BulkAddForm = (props) => {
  // Este componente se implementaría en un archivo separado
  return React.createElement('div', {}, 'BulkAddForm - Implementar en archivo separado');
};

const VideoStatsDisplay = (props) => {
  // Este componente se implementaría en un archivo separado
  return React.createElement('div', {}, 'VideoStatsDisplay - Implementar en archivo separado');
};