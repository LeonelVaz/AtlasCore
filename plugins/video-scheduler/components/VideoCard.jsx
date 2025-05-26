// video-scheduler/components/VideoCard.jsx
import { useState, useRef } from 'react';
import { 
  formatDate, 
  getStatusEmoji, 
  getTimeSlotLabel, 
  formatCurrency 
} from '../utils/videoUtils.js';
import { VIDEO_STATUS, PLATFORM_ICONS } from '../utils/constants.js';

export default function VideoCard(props) {
  const { video, onEdit, onDelete, onDuplicate, plugin, compact = false } = props;
  const [showActions, setShowActions] = useState(false);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const cardRef = useRef(null);

  const handleQuickStatusChange = async (newStatus) => {
    setLoading(true);
    try {
      await plugin.publicAPI.updateVideo(video.id, { status: newStatus });
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar el estado del video');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEarning = async (earningData) => {
    try {
      await plugin.publicAPI.trackEarningsForVideo(video.id, earningData);
      setShowEarningsModal(false);
    } catch (error) {
      console.error('Error al añadir ingreso:', error);
      alert('Error al añadir el ingreso');
    }
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate(video);
    } else {
      // Crear una copia con nueva fecha
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const duplicatedVideo = {
        ...video,
        title: `${video.title} (Copia)`,
        slot: {
          ...video.slot,
          date: tomorrow.toISOString().split('T')[0]
        },
        status: VIDEO_STATUS.PLANNED,
        earnings: null,
        publishedAt: null
      };
      
      delete duplicatedVideo.id;
      delete duplicatedVideo.createdAt;
      delete duplicatedVideo.updatedAt;
      
      onEdit && onEdit(duplicatedVideo);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      [VIDEO_STATUS.PLANNED]: '#3B82F6',
      [VIDEO_STATUS.SCRIPTING]: '#8B5CF6',
      [VIDEO_STATUS.RECORDING]: '#F59E0B',
      [VIDEO_STATUS.EDITING]: '#EF4444',
      [VIDEO_STATUS.REVIEW]: '#06B6D4',
      [VIDEO_STATUS.READY_TO_PUBLISH]: '#10B981',
      [VIDEO_STATUS.PUBLISHED]: '#059669',
      [VIDEO_STATUS.ARCHIVED]: '#6B7280'
    };
    return colors[status] || '#6B7280';
  };

  const getDaysUntilDate = () => {
    if (!video.slot.date) return null;
    
    const today = new Date();
    const videoDate = new Date(video.slot.date);
    const diffTime = videoDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Hace ${Math.abs(diffDays)} días`;
    } else if (diffDays === 0) {
      return 'Hoy';
    } else if (diffDays === 1) {
      return 'Mañana';
    } else {
      return `En ${diffDays} días`;
    }
  };

  const getProgressPercentage = () => {
    const statusOrder = Object.values(VIDEO_STATUS);
    const currentIndex = statusOrder.indexOf(video.status);
    return Math.max(0, (currentIndex / (statusOrder.length - 1)) * 100);
  };

  if (compact) {
    return React.createElement(
      'div',
      { 
        className: `video-card compact ${video.status}`,
        ref: cardRef,
        onClick: (e) => {
          if (!e.target.closest('.card-actions')) {
            onEdit && onEdit(video);
          }
        }
      },
      [
        React.createElement(
          'div',
          { className: 'card-content', key: 'content' },
          [
            React.createElement(
              'div',
              { className: 'card-header', key: 'header' },
              [
                React.createElement('h4', { key: 'title' }, video.title),
                React.createElement(
                  'div',
                  { className: 'card-meta', key: 'meta' },
                  [
                    React.createElement('span', { 
                      key: 'status',
                      className: 'status-badge',
                      style: { backgroundColor: getStatusColor(video.status) }
                    }, `${getStatusEmoji(video.status)} ${video.status}`),
                    React.createElement('span', { key: 'platform' }, 
                      `${PLATFORM_ICONS[video.platform] || '🎬'} ${video.platform}`
                    )
                  ]
                )
              ]
            ),
            
            React.createElement(
              'div',
              { className: 'card-info', key: 'info' },
              [
                React.createElement('span', { key: 'date' }, 
                  `📅 ${formatDate(video.slot.date)} - ${getTimeSlotLabel(video.slot.timeSlot)}`
                ),
                getDaysUntilDate() && React.createElement('span', { 
                  key: 'days-until',
                  className: 'days-until'
                }, getDaysUntilDate())
              ]
            )
          ]
        ),

        React.createElement(
          'div',
          { className: 'card-actions', key: 'actions' },
          [
            React.createElement('button', {
              key: 'edit',
              onClick: (e) => {
                e.stopPropagation();
                onEdit && onEdit(video);
              },
              className: 'btn-icon',
              title: 'Editar'
            }, '✏️'),
            
            React.createElement('button', {
              key: 'delete',
              onClick: (e) => {
                e.stopPropagation();
                onDelete && onDelete(video.id);
              },
              className: 'btn-icon',
              title: 'Eliminar'
            }, '🗑️')
          ]
        )
      ]
    );
  }

  return React.createElement(
    'div',
    { 
      className: `video-card full ${video.status} ${loading ? 'loading' : ''}`,
      ref: cardRef,
      onMouseEnter: () => setShowActions(true),
      onMouseLeave: () => setShowActions(false),
      onClick: (e) => {
        if (!e.target.closest('.card-actions') && !e.target.closest('.quick-status')) {
          onEdit && onEdit(video);
        }
      }
    },
    [
      // Thumbnail/Preview
      React.createElement(
        'div',
        { className: 'card-thumbnail', key: 'thumbnail' },
        [
          video.thumbnail ? React.createElement('img', {
            key: 'img',
            src: video.thumbnail,
            alt: video.title,
            onError: (e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }
          }) : null,
          
          React.createElement(
            'div',
            { 
              className: 'thumbnail-placeholder',
              key: 'placeholder',
              style: { display: video.thumbnail ? 'none' : 'flex' }
            },
            [
              React.createElement('span', { key: 'icon' }, 
                PLATFORM_ICONS[video.platform] || '🎬'
              ),
              React.createElement('span', { key: 'platform' }, video.platform)
            ]
          ),

          // Duración badge
          React.createElement(
            'div',
            { className: 'duration-badge', key: 'duration' },
            `${video.duration}min`
          ),

          // Estado badge
          React.createElement(
            'div',
            { 
              className: 'status-badge',
              key: 'status',
              style: { backgroundColor: getStatusColor(video.status) }
            },
            `${getStatusEmoji(video.status)} ${video.status}`
          )
        ]
      ),

      // Contenido principal
      React.createElement(
        'div',
        { className: 'card-content', key: 'content' },
        [
          React.createElement(
            'div',
            { className: 'card-header', key: 'header' },
            [
              React.createElement('h3', { key: 'title', title: video.title }, video.title),
              React.createElement(
                'div',
                { className: 'card-date', key: 'date' },
                [
                  React.createElement('span', { key: 'date-text' }, 
                    formatDate(video.slot.date)
                  ),
                  React.createElement('span', { key: 'timeslot' }, 
                    getTimeSlotLabel(video.slot.timeSlot)
                  ),
                  getDaysUntilDate() && React.createElement('span', { 
                    key: 'days-until',
                    className: `days-until ${getDaysUntilDate().includes('Hace') ? 'overdue' : ''}`
                  }, getDaysUntilDate())
                ]
              )
            ]
          ),

          // Descripción
          video.description && React.createElement('p', { 
            key: 'description',
            className: 'card-description' 
          }, video.description.length > 100 ? 
            video.description.substring(0, 100) + '...' : 
            video.description
          ),

          // Barra de progreso
          React.createElement(
            'div',
            { className: 'progress-bar', key: 'progress' },
            [
              React.createElement('div', {
                key: 'fill',
                className: 'progress-fill',
                style: { 
                  width: `${getProgressPercentage()}%`,
                  backgroundColor: getStatusColor(video.status)
                }
              }),
              React.createElement('span', { key: 'text', className: 'progress-text' },
                `${getProgressPercentage().toFixed(0)}% completado`
              )
            ]
          ),

          // Metadatos adicionales
          React.createElement(
            'div',
            { className: 'card-metadata', key: 'metadata' },
            [
              // Tags
              video.tags && video.tags.length > 0 && React.createElement(
                'div',
                { className: 'card-tags', key: 'tags' },
                video.tags.slice(0, 3).map(tag =>
                  React.createElement('span', { key: tag, className: 'tag' }, tag)
                ).concat(
                  video.tags.length > 3 ? [
                    React.createElement('span', { key: 'more', className: 'tag more' }, 
                      `+${video.tags.length - 3}`
                    )
                  ] : []
                )
              ),

              // Ingresos
              video.earnings && video.earnings.total > 0 && React.createElement(
                'div',
                { className: 'card-earnings', key: 'earnings' },
                [
                  React.createElement('span', { key: 'icon' }, '💰'),
                  React.createElement('span', { key: 'amount' }, 
                    formatCurrency(video.earnings.total, video.earnings.currency)
                  )
                ]
              )
            ]
          )
        ]
      ),

      // Acciones rápidas
      React.createElement(
        'div',
        { 
          className: `card-actions ${showActions ? 'visible' : ''}`,
          key: 'actions'
        },
        [
          React.createElement('button', {
            key: 'edit',
            onClick: (e) => {
              e.stopPropagation();
              onEdit && onEdit(video);
            },
            className: 'btn-icon',
            title: 'Editar video'
          }, '✏️'),

          React.createElement('button', {
            key: 'duplicate',
            onClick: (e) => {
              e.stopPropagation();
              handleDuplicate();
            },
            className: 'btn-icon',
            title: 'Duplicar video'
          }, '📋'),

          React.createElement('button', {
            key: 'earnings',
            onClick: (e) => {
              e.stopPropagation();
              setShowEarningsModal(true);
            },
            className: 'btn-icon',
            title: 'Gestionar ingresos'
          }, '💰'),

          React.createElement('button', {
            key: 'delete',
            onClick: (e) => {
              e.stopPropagation();
              onDelete && onDelete(video.id);
            },
            className: 'btn-icon btn-danger',
            title: 'Eliminar video'
          }, '🗑️')
        ]
      ),

      // Cambio rápido de estado
      React.createElement(
        'div',
        { className: 'quick-status', key: 'quick-status' },
        [
          React.createElement('label', { key: 'label' }, 'Estado:'),
          React.createElement(
            'select',
            {
              key: 'select',
              value: video.status,
              onChange: (e) => {
                e.stopPropagation();
                handleQuickStatusChange(e.target.value);
              },
              disabled: loading,
              onClick: (e) => e.stopPropagation()
            },
            Object.values(VIDEO_STATUS).map(status =>
              React.createElement('option', { key: status, value: status }, 
                `${getStatusEmoji(status)} ${status}`
              )
            )
          )
        ]
      ),

      // Modal de ingresos
      showEarningsModal && React.createElement(QuickEarningsModal, {
        key: 'earnings-modal',
        video: video,
        onSave: handleAddEarning,
        onClose: () => setShowEarningsModal(false),
        plugin: plugin
      })
    ]
  );
}

// Modal rápido para añadir ingresos
const QuickEarningsModal = (props) => {
  const { video, onSave, onClose, plugin } = props;
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(
    plugin.publicAPI.getPluginSettings().defaultCurrency
  );
  const [source, setSource] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (amount && source) {
      onSave({
        amount: parseFloat(amount),
        currency,
        source,
        date: new Date().toISOString()
      });
    }
  };

  return React.createElement(
    'div',
    { 
      className: 'modal-overlay quick-earnings-modal',
      onClick: (e) => {
        if (e.target === e.currentTarget) onClose();
      }
    },
    React.createElement(
      'div',
      { className: 'modal-content small' },
      [
        React.createElement(
          'div',
          { className: 'modal-header', key: 'header' },
          [
            React.createElement('h4', { key: 'title' }, 
              `Añadir Ingreso - ${video.title}`
            ),
            React.createElement('button', {
              key: 'close',
              onClick: onClose,
              className: 'btn-icon close-btn'
            }, '×')
          ]
        ),

        React.createElement(
          'form',
          { key: 'form', onSubmit: handleSubmit, className: 'quick-earnings-form' },
          [
            React.createElement(
              'div',
              { className: 'form-row', key: 'amount-row' },
              [
                React.createElement('input', {
                  key: 'amount',
                  type: 'number',
                  step: '0.01',
                  value: amount,
                  onChange: (e) => setAmount(e.target.value),
                  placeholder: 'Cantidad',
                  required: true,
                  autoFocus: true
                }),
                React.createElement(
                  'select',
                  {
                    key: 'currency',
                    value: currency,
                    onChange: (e) => setCurrency(e.target.value)
                  },
                  ['USD', 'EUR', 'ARS', 'MXN'].map(curr =>
                    React.createElement('option', { key: curr, value: curr }, curr)
                  )
                )
              ]
            ),

            React.createElement('input', {
              key: 'source',
              type: 'text',
              value: source,
              onChange: (e) => setSource(e.target.value),
              placeholder: 'Fuente (ej: AdSense, Patrocinio)',
              required: true
            }),

            React.createElement(
              'div',
              { className: 'form-actions', key: 'actions' },
              [
                React.createElement('button', {
                  key: 'save',
                  type: 'submit',
                  className: 'btn-primary btn-small'
                }, '💰 Añadir'),
                React.createElement('button', {
                  key: 'cancel',
                  type: 'button',
                  onClick: onClose,
                  className: 'btn-secondary btn-small'
                }, 'Cancelar')
              ]
            )
          ]
        ),

        // Mostrar ingresos existentes
        video.earnings && video.earnings.total > 0 && React.createElement(
          'div',
          { className: 'existing-earnings', key: 'existing' },
          [
            React.createElement('h5', { key: 'title' }, 'Ingresos Actuales'),
            React.createElement('div', { key: 'total', className: 'earnings-total' },
              formatCurrency(video.earnings.total, video.earnings.currency)
            ),
            Object.entries(video.earnings.breakdown || {}).length > 0 && React.createElement(
              'div',
              { className: 'earnings-breakdown', key: 'breakdown' },
              Object.entries(video.earnings.breakdown).map(([src, amt]) =>
                React.createElement('div', { key: src, className: 'breakdown-item' },
                  [
                    React.createElement('span', { key: 'source' }, src),
                    React.createElement('span', { key: 'amount' }, 
                      formatCurrency(amt, video.earnings.currency)
                    )
                  ]
                )
              )
            )
          ]
        )
      ]
    )
  );
};