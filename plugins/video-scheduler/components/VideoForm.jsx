// video-scheduler/components/VideoForm.jsx
import { useState, useEffect } from 'react';
import { VIDEO_STATUS, VIDEO_TIME_SLOTS, CURRENCIES, DEFAULT_VIDEO_STRUCTURE } from '../utils/constants.js';
import { validateVideoData, getStatusEmoji, getTimeSlotLabel } from '../utils/videoUtils.js';

export default function VideoForm(props) {
  const { video, onSave, onCancel, plugin } = props;
  const isEditing = video && video.id;
  
  const [formData, setFormData] = useState(() => ({
    ...DEFAULT_VIDEO_STRUCTURE,
    ...video,
    slot: {
      ...DEFAULT_VIDEO_STRUCTURE.slot,
      ...video?.slot,
      date: video?.slot?.date || new Date().toISOString().split('T')[0]
    },
    tags: video?.tags || [],
    productionMetadata: {
      ...DEFAULT_VIDEO_STRUCTURE.productionMetadata,
      ...video?.productionMetadata
    }
  }));

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [showEarningsForm, setShowEarningsForm] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Validar formulario en tiempo real
  useEffect(() => {
    const validation = validateVideoData(formData);
    setErrors(validation.errors.reduce((acc, error) => {
      const field = error.includes('título') ? 'title' :
                   error.includes('fecha') ? 'date' :
                   error.includes('duración') ? 'duration' :
                   'general';
      acc[field] = error;
      return acc;
    }, {}));
  }, [formData]);

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim()) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateVideoData(formData);
    if (!validation.isValid) {
      alert('Por favor corrige los errores en el formulario');
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error al guardar video:', error);
      alert('Error al guardar el video');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEarning = async (earningData) => {
    try {
      if (isEditing) {
        await plugin.publicAPI.trackEarningsForVideo(video.id, earningData);
        // Recargar datos del video
        const updatedVideo = plugin.publicAPI.getVideoById(video.id);
        setFormData(prev => ({
          ...prev,
          earnings: updatedVideo.earnings
        }));
      }
      setShowEarningsForm(false);
    } catch (error) {
      console.error('Error al añadir ingreso:', error);
      alert('Error al añadir el ingreso');
    }
  };

  const renderBasicTab = () => {
    return React.createElement(
      'div',
      { className: 'form-tab-content' },
      [
        // Título
        React.createElement(
          'div',
          { className: 'form-group', key: 'title-group' },
          [
            React.createElement('label', { key: 'label' }, '* Título'),
            React.createElement('input', {
              key: 'input',
              type: 'text',
              value: formData.title,
              onChange: (e) => handleChange('title', e.target.value),
              placeholder: 'Ingresa el título del video',
              className: errors.title ? 'error' : ''
            }),
            errors.title && React.createElement('span', { 
              key: 'error', 
              className: 'error-message' 
            }, errors.title)
          ]
        ),

        // Descripción
        React.createElement(
          'div',
          { className: 'form-group', key: 'description-group' },
          [
            React.createElement('label', { key: 'label' }, 'Descripción'),
            React.createElement('textarea', {
              key: 'textarea',
              value: formData.description,
              onChange: (e) => handleChange('description', e.target.value),
              placeholder: 'Describe brevemente el contenido del video',
              rows: 3
            })
          ]
        ),

        // Fecha y franja horaria
        React.createElement(
          'div',
          { className: 'form-row', key: 'schedule-row' },
          [
            React.createElement(
              'div',
              { className: 'form-group', key: 'date-group' },
              [
                React.createElement('label', { key: 'label' }, '* Fecha'),
                React.createElement('input', {
                  key: 'input',
                  type: 'date',
                  value: formData.slot.date,
                  onChange: (e) => handleChange('slot.date', e.target.value),
                  className: errors.date ? 'error' : ''
                }),
                errors.date && React.createElement('span', { 
                  key: 'error', 
                  className: 'error-message' 
                }, errors.date)
              ]
            ),

            React.createElement(
              'div',
              { className: 'form-group', key: 'timeslot-group' },
              [
                React.createElement('label', { key: 'label' }, 'Franja Horaria'),
                React.createElement(
                  'select',
                  {
                    key: 'select',
                    value: formData.slot.timeSlot,
                    onChange: (e) => handleChange('slot.timeSlot', e.target.value)
                  },
                  VIDEO_TIME_SLOTS.map(slot =>
                    React.createElement('option', { 
                      key: slot, 
                      value: slot 
                    }, getTimeSlotLabel(slot))
                  )
                )
              ]
            )
          ]
        ),

        // Estado y plataforma
        React.createElement(
          'div',
          { className: 'form-row', key: 'status-row' },
          [
            React.createElement(
              'div',
              { className: 'form-group', key: 'status-group' },
              [
                React.createElement('label', { key: 'label' }, 'Estado'),
                React.createElement(
                  'select',
                  {
                    key: 'select',
                    value: formData.status,
                    onChange: (e) => handleChange('status', e.target.value)
                  },
                  Object.values(VIDEO_STATUS).map(status =>
                    React.createElement('option', { 
                      key: status, 
                      value: status 
                    }, `${getStatusEmoji(status)} ${status}`)
                  )
                )
              ]
            ),

            React.createElement(
              'div',
              { className: 'form-group', key: 'platform-group' },
              [
                React.createElement('label', { key: 'label' }, 'Plataforma'),
                React.createElement(
                  'select',
                  {
                    key: 'select',
                    value: formData.platform,
                    onChange: (e) => handleChange('platform', e.target.value)
                  },
                  [
                    React.createElement('option', { key: 'youtube', value: 'youtube' }, '📺 YouTube'),
                    React.createElement('option', { key: 'vimeo', value: 'vimeo' }, '🎥 Vimeo'),
                    React.createElement('option', { key: 'tiktok', value: 'tiktok' }, '📱 TikTok'),
                    React.createElement('option', { key: 'instagram', value: 'instagram' }, '📷 Instagram'),
                    React.createElement('option', { key: 'facebook', value: 'facebook' }, '📘 Facebook'),
                    React.createElement('option', { key: 'twitch', value: 'twitch' }, '🎮 Twitch')
                  ]
                )
              ]
            )
          ]
        ),

        // Duración
        React.createElement(
          'div',
          { className: 'form-group', key: 'duration-group' },
          [
            React.createElement('label', { key: 'label' }, 'Duración (minutos)'),
            React.createElement('input', {
              key: 'input',
              type: 'number',
              min: 1,
              max: 600,
              value: formData.duration,
              onChange: (e) => handleChange('duration', parseInt(e.target.value)),
              className: errors.duration ? 'error' : ''
            }),
            errors.duration && React.createElement('span', { 
              key: 'error', 
              className: 'error-message' 
            }, errors.duration)
          ]
        ),

        // Tags
        React.createElement(
          'div',
          { className: 'form-group', key: 'tags-group' },
          [
            React.createElement('label', { key: 'label' }, 'Etiquetas'),
            React.createElement(
              'div',
              { className: 'tags-input-container', key: 'input-container' },
              [
                React.createElement('input', {
                  key: 'input',
                  type: 'text',
                  value: tagInput,
                  onChange: (e) => setTagInput(e.target.value),
                  onKeyPress: (e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  },
                  placeholder: 'Añadir etiqueta',
                  disabled: formData.tags.length >= 10
                }),
                React.createElement('button', {
                  key: 'add-btn',
                  type: 'button',
                  onClick: handleAddTag,
                  disabled: !tagInput.trim() || formData.tags.length >= 10,
                  className: 'btn-secondary'
                }, 'Añadir')
              ]
            ),
            React.createElement(
              'div',
              { className: 'tags-container', key: 'tags-container' },
              formData.tags.map(tag =>
                React.createElement(
                  'span',
                  { 
                    key: tag, 
                    className: 'tag' 
                  },
                  [
                    tag,
                    React.createElement('button', {
                      key: 'remove',
                      type: 'button',
                      onClick: () => handleRemoveTag(tag),
                      className: 'tag-remove'
                    }, '×')
                  ]
                )
              )
            )
          ]
        ),

        // Miniatura
        React.createElement(
          'div',
          { className: 'form-group', key: 'thumbnail-group' },
          [
            React.createElement('label', { key: 'label' }, 'URL de Miniatura'),
            React.createElement('input', {
              key: 'input',
              type: 'url',
              value: formData.thumbnail,
              onChange: (e) => handleChange('thumbnail', e.target.value),
              placeholder: 'https://ejemplo.com/miniatura.jpg'
            })
          ]
        )
      ]
    );
  };

  const renderProductionTab = () => {
    return React.createElement(
      'div',
      { className: 'form-tab-content' },
      [
        React.createElement('h4', { key: 'title' }, 'Metadatos de Producción'),

        // Estado del guión
        React.createElement(
          'div',
          { className: 'form-row', key: 'script-row' },
          [
            React.createElement(
              'div',
              { className: 'form-group', key: 'script-status' },
              [
                React.createElement('label', { key: 'label' }, 'Estado del Guión'),
                React.createElement(
                  'select',
                  {
                    key: 'select',
                    value: formData.productionMetadata.scriptStatus,
                    onChange: (e) => handleChange('productionMetadata.scriptStatus', e.target.value)
                  },
                  [
                    React.createElement('option', { key: 'pending', value: 'pending' }, 'Pendiente'),
                    React.createElement('option', { key: 'draft', value: 'draft' }, 'Borrador'),
                    React.createElement('option', { key: 'review', value: 'review' }, 'En Revisión'),
                    React.createElement('option', { key: 'approved', value: 'approved' }, 'Aprobado')
                  ]
                )
              ]
            ),

            React.createElement(
              'div',
              { className: 'form-group', key: 'script-link' },
              [
                React.createElement('label', { key: 'label' }, 'Enlace del Guión'),
                React.createElement('input', {
                  key: 'input',
                  type: 'url',
                  value: formData.productionMetadata.scriptLink,
                  onChange: (e) => handleChange('productionMetadata.scriptLink', e.target.value),
                  placeholder: 'https://docs.google.com/...'
                })
              ]
            )
          ]
        ),

        // Información de grabación
        React.createElement(
          'div',
          { className: 'form-row', key: 'recording-row' },
          [
            React.createElement(
              'div',
              { className: 'form-group', key: 'recording-date' },
              [
                React.createElement('label', { key: 'label' }, 'Fecha de Grabación'),
                React.createElement('input', {
                  key: 'input',
                  type: 'date',
                  value: formData.productionMetadata.recordingDate || '',
                  onChange: (e) => handleChange('productionMetadata.recordingDate', e.target.value)
                })
              ]
            ),

            React.createElement(
              'div',
              { className: 'form-group', key: 'recording-location' },
              [
                React.createElement('label', { key: 'label' }, 'Ubicación de Grabación'),
                React.createElement('input', {
                  key: 'input',
                  type: 'text',
                  value: formData.productionMetadata.recordingLocation,
                  onChange: (e) => handleChange('productionMetadata.recordingLocation', e.target.value),
                  placeholder: 'Ej: Estudio principal, Casa, Exterior'
                })
              ]
            )
          ]
        ),

        // Información de edición
        React.createElement(
          'div',
          { className: 'form-row', key: 'editing-row' },
          [
            React.createElement(
              'div',
              { className: 'form-group', key: 'editor' },
              [
                React.createElement('label', { key: 'label' }, 'Editor'),
                React.createElement('input', {
                  key: 'input',
                  type: 'text',
                  value: formData.productionMetadata.editor,
                  onChange: (e) => handleChange('productionMetadata.editor', e.target.value),
                  placeholder: 'Nombre del editor'
                })
              ]
            ),

            React.createElement(
              'div',
              { className: 'form-group', key: 'editing-progress' },
              [
                React.createElement('label', { key: 'label' }, 
                  `Progreso de Edición: ${formData.productionMetadata.editingProgress}%`
                ),
                React.createElement('input', {
                  key: 'input',
                  type: 'range',
                  min: 0,
                  max: 100,
                  value: formData.productionMetadata.editingProgress,
                  onChange: (e) => handleChange('productionMetadata.editingProgress', parseInt(e.target.value))
                })
              ]
            )
          ]
        ),

        // Artista de miniatura
        React.createElement(
          'div',
          { className: 'form-group', key: 'thumbnail-artist' },
          [
            React.createElement('label', { key: 'label' }, 'Artista de Miniatura'),
            React.createElement('input', {
              key: 'input',
              type: 'text',
              value: formData.productionMetadata.thumbnailArtist,
              onChange: (e) => handleChange('productionMetadata.thumbnailArtist', e.target.value),
              placeholder: 'Nombre del diseñador de miniatura'
            })
          ]
        ),

        // Notas
        React.createElement(
          'div',
          { className: 'form-group', key: 'notes' },
          [
            React.createElement('label', { key: 'label' }, 'Notas de Producción'),
            React.createElement('textarea', {
              key: 'textarea',
              value: formData.productionMetadata.notes,
              onChange: (e) => handleChange('productionMetadata.notes', e.target.value),
              placeholder: 'Notas generales, instrucciones especiales, etc.',
              rows: 4
            })
          ]
        )
      ]
    );
  };

  const renderEarningsTab = () => {
    const earnings = formData.earnings || { total: 0, breakdown: {}, currency: 'USD' };

    return React.createElement(
      'div',
      { className: 'form-tab-content' },
      [
        React.createElement('h4', { key: 'title' }, 'Gestión de Ingresos'),

        // Resumen de ingresos
        React.createElement(
          'div',
          { className: 'earnings-summary', key: 'summary' },
          [
            React.createElement('h5', { key: 'total-title' }, 'Total de Ingresos'),
            React.createElement('div', { 
              key: 'total-amount', 
              className: 'earnings-total' 
            }, `${earnings.currency} ${earnings.total.toFixed(2)}`),
            
            earnings.lastUpdated && React.createElement('p', { 
              key: 'last-updated', 
              className: 'text-muted' 
            }, `Última actualización: ${new Date(earnings.lastUpdated).toLocaleDateString()}`)
          ]
        ),

        // Desglose por fuente
        Object.keys(earnings.breakdown).length > 0 && React.createElement(
          'div',
          { className: 'earnings-breakdown', key: 'breakdown' },
          [
            React.createElement('h5', { key: 'breakdown-title' }, 'Desglose por Fuente'),
            React.createElement(
              'div',
              { className: 'breakdown-list', key: 'breakdown-list' },
              Object.entries(earnings.breakdown).map(([source, amount]) =>
                React.createElement(
                  'div',
                  { 
                    key: source, 
                    className: 'breakdown-item' 
                  },
                  [
                    React.createElement('span', { key: 'source' }, source),
                    React.createElement('span', { key: 'amount' }, 
                      `${earnings.currency} ${amount.toFixed(2)}`
                    )
                  ]
                )
              )
            )
          ]
        ),

        // Botón para añadir nuevo ingreso (solo si está editando)
        isEditing && React.createElement(
          'div',
          { className: 'earnings-actions', key: 'actions' },
          React.createElement('button', {
            type: 'button',
            onClick: () => setShowEarningsForm(true),
            className: 'btn-primary'
          }, '💰 Añadir Ingreso')
        ),

        !isEditing && React.createElement(
          'p',
          { className: 'text-muted', key: 'save-first' },
          'Guarda el video primero para poder gestionar ingresos'
        )
      ]
    );
  };

  return React.createElement(
    'form',
    { onSubmit: handleSubmit, className: 'video-form' },
    [
      // Tabs de navegación
      React.createElement(
        'div',
        { className: 'form-tabs', key: 'tabs' },
        [
          React.createElement('button', {
            key: 'basic-tab',
            type: 'button',
            className: `tab-button ${activeTab === 'basic' ? 'active' : ''}`,
            onClick: () => setActiveTab('basic')
          }, '📝 Básico'),
          React.createElement('button', {
            key: 'production-tab',
            type: 'button',
            className: `tab-button ${activeTab === 'production' ? 'active' : ''}`,
            onClick: () => setActiveTab('production')
          }, '🎬 Producción'),
          React.createElement('button', {
            key: 'earnings-tab',
            type: 'button',
            className: `tab-button ${activeTab === 'earnings' ? 'active' : ''}`,
            onClick: () => setActiveTab('earnings')
          }, '💰 Ingresos')
        ]
      ),

      // Contenido de tabs
      activeTab === 'basic' ? renderBasicTab() :
      activeTab === 'production' ? renderProductionTab() :
      renderEarningsTab(),

      // Acciones del formulario
      React.createElement(
        'div',
        { className: 'form-actions', key: 'actions' },
        [
          React.createElement(
            'button',
            {
              key: 'save',
              type: 'submit',
              className: 'btn-primary',
              disabled: loading || Object.keys(errors).length > 0
            },
            loading ? 'Guardando...' : (isEditing ? 'Actualizar Video' : 'Crear Video')
          ),
          React.createElement(
            'button',
            {
              key: 'cancel',
              type: 'button',
              onClick: onCancel,
              className: 'btn-secondary',
              disabled: loading
            },
            'Cancelar'
          )
        ]
      ),

      // Modal de ingresos
      showEarningsForm && React.createElement(EarningsForm, {
        key: 'earnings-form',
        video: formData,
        onSave: handleAddEarning,
        onCancel: () => setShowEarningsForm(false),
        plugin: plugin
      })
    ]
  );
}

// Componente simple de EarningsForm (se implementaría completamente en archivo separado)
const EarningsForm = (props) => {
  const { onSave, onCancel } = props;
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
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
    { className: 'modal-overlay' },
    React.createElement(
      'div',
      { className: 'modal-content earnings-modal' },
      [
        React.createElement('h3', { key: 'title' }, 'Añadir Ingreso'),
        React.createElement(
          'form',
          { key: 'form', onSubmit: handleSubmit },
          [
            React.createElement(
              'div',
              { className: 'form-group', key: 'amount' },
              [
                React.createElement('label', { key: 'label' }, 'Cantidad'),
                React.createElement('input', {
                  key: 'input',
                  type: 'number',
                  step: '0.01',
                  value: amount,
                  onChange: (e) => setAmount(e.target.value),
                  placeholder: '0.00',
                  required: true
                })
              ]
            ),
            React.createElement(
              'div',
              { className: 'form-group', key: 'currency' },
              [
                React.createElement('label', { key: 'label' }, 'Moneda'),
                React.createElement(
                  'select',
                  {
                    key: 'select',
                    value: currency,
                    onChange: (e) => setCurrency(e.target.value)
                  },
                  Object.keys(CURRENCIES).map(curr =>
                    React.createElement('option', { key: curr, value: curr }, 
                      `${curr} - ${CURRENCIES[curr].name}`
                    )
                  )
                )
              ]
            ),
            React.createElement(
              'div',
              { className: 'form-group', key: 'source' },
              [
                React.createElement('label', { key: 'label' }, 'Fuente'),
                React.createElement('input', {
                  key: 'input',
                  type: 'text',
                  value: source,
                  onChange: (e) => setSource(e.target.value),
                  placeholder: 'Ej: AdSense, Patrocinio, Venta directa',
                  required: true
                })
              ]
            ),
            React.createElement(
              'div',
              { className: 'form-actions', key: 'actions' },
              [
                React.createElement('button', {
                  key: 'save',
                  type: 'submit',
                  className: 'btn-primary'
                }, 'Añadir'),
                React.createElement('button', {
                  key: 'cancel',
                  type: 'button',
                  onClick: onCancel,
                  className: 'btn-secondary'
                }, 'Cancelar')
              ]
            )
          ]
        )
      ]
    )
  );
};