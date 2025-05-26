// video-scheduler/components/BulkAddForm.jsx
import { useState, useEffect } from 'react';
import { VIDEO_TIME_SLOTS, VIDEO_STATUS, BULK_ADD_DEFAULTS } from '../utils/constants.js';
import { generateBulkDates, getTimeSlotLabel } from '../utils/videoUtils.js';

export default function BulkAddForm(props) {
  const { onSubmit, onCancel, plugin } = props;
  
  const [formData, setFormData] = useState({
    baseName: 'Video',
    startNumber: 1,
    count: 5,
    frequency: 'daily',
    startDate: new Date().toISOString().split('T')[0],
    timeSlot: 'morning',
    status: VIDEO_STATUS.PLANNED,
    platform: plugin.publicAPI.getPluginSettings().defaultPlatform || 'youtube',
    duration: 10,
    selectedDaysOfWeek: [1, 2, 3, 4, 5], // Lunes a Viernes por defecto
    monthlyDay: 1, // Para frecuencia mensual
    tags: []
  });

  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Generar vista previa cuando cambien los datos relevantes
  useEffect(() => {
    generatePreview();
  }, [formData.baseName, formData.startNumber, formData.count, formData.frequency, formData.startDate, formData.selectedDaysOfWeek, formData.timeSlot]);

  const generatePreview = () => {
    try {
      if (!formData.baseName || !formData.count || formData.count <= 0) {
        setPreview([]);
        return;
      }

      const dates = generateBulkDates({
        startDate: formData.startDate,
        count: Math.min(formData.count, 30), // Limitar vista previa a 30
        frequency: formData.frequency,
        selectedDays: formData.selectedDaysOfWeek
      });

      const previewVideos = dates.map((date, index) => ({
        title: `${formData.baseName} #${formData.startNumber + index}`,
        date: date.toISOString().split('T')[0],
        timeSlot: formData.timeSlot,
        status: formData.status
      }));

      setPreview(previewVideos);
    } catch (error) {
      console.error('Error generando vista previa:', error);
      setPreview([]);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.baseName.trim()) {
      newErrors.baseName = 'El nombre base es obligatorio';
    }

    if (formData.count <= 0 || formData.count > 30) {
      newErrors.count = 'La cantidad debe estar entre 1 y 30';
    }

    if (formData.startNumber <= 0) {
      newErrors.startNumber = 'El número inicial debe ser mayor a 0';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'La fecha de inicio es obligatoria';
    }

    if (formData.frequency === 'custom' && formData.selectedDaysOfWeek.length === 0) {
      newErrors.selectedDaysOfWeek = 'Selecciona al menos un día de la semana';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        baseName: formData.baseName,
        startNumber: formData.startNumber,
        count: formData.count,
        startDay: formData.startDate,
        startSlot: formData.timeSlot,
        frequency: formData.frequency,
        selectedDaysOfWeek: formData.selectedDaysOfWeek,
        defaultStatus: formData.status,
        defaultPlatform: formData.platform,
        defaultDuration: formData.duration,
        defaultTags: formData.tags
      });
    } catch (error) {
      console.error('Error al crear videos en lote:', error);
      alert('Error al crear los videos');
    } finally {
      setLoading(false);
    }
  };

  const handleDayOfWeekToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      selectedDaysOfWeek: prev.selectedDaysOfWeek.includes(day)
        ? prev.selectedDaysOfWeek.filter(d => d !== day)
        : [...prev.selectedDaysOfWeek, day].sort()
    }));
  };

  const getDayName = (dayNumber) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return days[dayNumber];
  };

  const renderFrequencyOptions = () => {
    switch (formData.frequency) {
      case 'custom':
        return React.createElement(
          'div',
          { className: 'custom-frequency-options', key: 'custom-options' },
          [
            React.createElement('label', { key: 'label' }, 'Días de la semana:'),
            React.createElement(
              'div',
              { className: 'days-of-week', key: 'days' },
              [0, 1, 2, 3, 4, 5, 6].map(day =>
                React.createElement(
                  'label',
                  { 
                    key: day, 
                    className: `day-checkbox ${formData.selectedDaysOfWeek.includes(day) ? 'selected' : ''}` 
                  },
                  [
                    React.createElement('input', {
                      key: 'checkbox',
                      type: 'checkbox',
                      checked: formData.selectedDaysOfWeek.includes(day),
                      onChange: () => handleDayOfWeekToggle(day)
                    }),
                    React.createElement('span', { key: 'label' }, getDayName(day))
                  ]
                )
              )
            ),
            errors.selectedDaysOfWeek && React.createElement('span', { 
              key: 'error', 
              className: 'error-message' 
            }, errors.selectedDaysOfWeek)
          ]
        );

      case 'monthly':
        return React.createElement(
          'div',
          { className: 'monthly-frequency-options', key: 'monthly-options' },
          [
            React.createElement('label', { key: 'label' }, 'Día del mes:'),
            React.createElement('input', {
              key: 'input',
              type: 'number',
              min: 1,
              max: 28,
              value: formData.monthlyDay,
              onChange: (e) => setFormData(prev => ({ ...prev, monthlyDay: parseInt(e.target.value) }))
            })
          ]
        );

      default:
        return null;
    }
  };

  return React.createElement(
    'form',
    { onSubmit: handleSubmit, className: 'bulk-add-form' },
    [
      React.createElement('h3', { key: 'title' }, 'Añadir Videos en Lote'),

      // Configuración básica
      React.createElement(
        'div',
        { className: 'form-section', key: 'basic-section' },
        [
          React.createElement('h4', { key: 'section-title' }, 'Configuración Básica'),

          React.createElement(
            'div',
            { className: 'form-row', key: 'name-count-row' },
            [
              React.createElement(
                'div',
                { className: 'form-group', key: 'base-name' },
                [
                  React.createElement('label', { key: 'label' }, '* Nombre Base'),
                  React.createElement('input', {
                    key: 'input',
                    type: 'text',
                    value: formData.baseName,
                    onChange: (e) => setFormData(prev => ({ ...prev, baseName: e.target.value })),
                    placeholder: 'Ej: Mi Serie de Videos',
                    className: errors.baseName ? 'error' : ''
                  }),
                  errors.baseName && React.createElement('span', { 
                    key: 'error', 
                    className: 'error-message' 
                  }, errors.baseName)
                ]
              ),

              React.createElement(
                'div',
                { className: 'form-group', key: 'start-number' },
                [
                  React.createElement('label', { key: 'label' }, 'Número Inicial'),
                  React.createElement('input', {
                    key: 'input',
                    type: 'number',
                    min: 1,
                    value: formData.startNumber,
                    onChange: (e) => setFormData(prev => ({ ...prev, startNumber: parseInt(e.target.value) })),
                    className: errors.startNumber ? 'error' : ''
                  }),
                  errors.startNumber && React.createElement('span', { 
                    key: 'error', 
                    className: 'error-message' 
                  }, errors.startNumber)
                ]
              ),

              React.createElement(
                'div',
                { className: 'form-group', key: 'count' },
                [
                  React.createElement('label', { key: 'label' }, '* Cantidad'),
                  React.createElement('input', {
                    key: 'input',
                    type: 'number',
                    min: 1,
                    max: 30,
                    value: formData.count,
                    onChange: (e) => setFormData(prev => ({ ...prev, count: parseInt(e.target.value) })),
                    className: errors.count ? 'error' : ''
                  }),
                  errors.count && React.createElement('span', { 
                    key: 'error', 
                    className: 'error-message' 
                  }, errors.count)
                ]
              )
            ]
          )
        ]
      ),

      // Configuración de programación
      React.createElement(
        'div',
        { className: 'form-section', key: 'schedule-section' },
        [
          React.createElement('h4', { key: 'section-title' }, 'Programación'),

          React.createElement(
            'div',
            { className: 'form-row', key: 'schedule-row' },
            [
              React.createElement(
                'div',
                { className: 'form-group', key: 'start-date' },
                [
                  React.createElement('label', { key: 'label' }, '* Fecha de Inicio'),
                  React.createElement('input', {
                    key: 'input',
                    type: 'date',
                    value: formData.startDate,
                    onChange: (e) => setFormData(prev => ({ ...prev, startDate: e.target.value })),
                    className: errors.startDate ? 'error' : ''
                  }),
                  errors.startDate && React.createElement('span', { 
                    key: 'error', 
                    className: 'error-message' 
                  }, errors.startDate)
                ]
              ),

              React.createElement(
                'div',
                { className: 'form-group', key: 'time-slot' },
                [
                  React.createElement('label', { key: 'label' }, 'Franja Horaria'),
                  React.createElement(
                    'select',
                    {
                      key: 'select',
                      value: formData.timeSlot,
                      onChange: (e) => setFormData(prev => ({ ...prev, timeSlot: e.target.value }))
                    },
                    VIDEO_TIME_SLOTS.map(slot =>
                      React.createElement('option', { 
                        key: slot, 
                        value: slot 
                      }, getTimeSlotLabel(slot))
                    )
                  )
                ]
              ),

              React.createElement(
                'div',
                { className: 'form-group', key: 'frequency' },
                [
                  React.createElement('label', { key: 'label' }, 'Frecuencia'),
                  React.createElement(
                    'select',
                    {
                      key: 'select',
                      value: formData.frequency,
                      onChange: (e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))
                    },
                    [
                      React.createElement('option', { key: 'daily', value: 'daily' }, 'Diario'),
                      React.createElement('option', { key: 'weekly', value: 'weekly' }, 'Semanal'),
                      React.createElement('option', { key: 'custom', value: 'custom' }, 'Días específicos'),
                      React.createElement('option', { key: 'monthly', value: 'monthly' }, 'Mensual')
                    ]
                  )
                ]
              )
            ]
          ),

          renderFrequencyOptions()
        ]
      ),

      // Configuración de videos
      React.createElement(
        'div',
        { className: 'form-section', key: 'video-section' },
        [
          React.createElement('h4', { key: 'section-title' }, 'Configuración de Videos'),

          React.createElement(
            'div',
            { className: 'form-row', key: 'video-row' },
            [
              React.createElement(
                'div',
                { className: 'form-group', key: 'status' },
                [
                  React.createElement('label', { key: 'label' }, 'Estado Inicial'),
                  React.createElement(
                    'select',
                    {
                      key: 'select',
                      value: formData.status,
                      onChange: (e) => setFormData(prev => ({ ...prev, status: e.target.value }))
                    },
                    Object.values(VIDEO_STATUS).map(status =>
                      React.createElement('option', { 
                        key: status, 
                        value: status 
                      }, status)
                    )
                  )
                ]
              ),

              React.createElement(
                'div',
                { className: 'form-group', key: 'platform' },
                [
                  React.createElement('label', { key: 'label' }, 'Plataforma'),
                  React.createElement(
                    'select',
                    {
                      key: 'select',
                      value: formData.platform,
                      onChange: (e) => setFormData(prev => ({ ...prev, platform: e.target.value }))
                    },
                    [
                      React.createElement('option', { key: 'youtube', value: 'youtube' }, 'YouTube'),
                      React.createElement('option', { key: 'vimeo', value: 'vimeo' }, 'Vimeo'),
                      React.createElement('option', { key: 'tiktok', value: 'tiktok' }, 'TikTok'),
                      React.createElement('option', { key: 'instagram', value: 'instagram' }, 'Instagram')
                    ]
                  )
                ]
              ),

              React.createElement(
                'div',
                { className: 'form-group', key: 'duration' },
                [
                  React.createElement('label', { key: 'label' }, 'Duración (min)'),
                  React.createElement('input', {
                    key: 'input',
                    type: 'number',
                    min: 1,
                    max: 600,
                    value: formData.duration,
                    onChange: (e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))
                  })
                ]
              )
            ]
          )
        ]
      ),

      // Vista previa
      preview.length > 0 && React.createElement(
        'div',
        { className: 'form-section', key: 'preview-section' },
        [
          React.createElement('h4', { key: 'section-title' }, 
            `Vista Previa (${Math.min(preview.length, 10)} de ${formData.count})`
          ),
          React.createElement(
            'div',
            { className: 'preview-container', key: 'preview' },
            preview.slice(0, 10).map((video, index) =>
              React.createElement(
                'div',
                { key: index, className: 'preview-item' },
                [
                  React.createElement('strong', { key: 'title' }, video.title),
                  React.createElement('span', { key: 'date' }, 
                    ` - ${new Date(video.date).toLocaleDateString()} (${getTimeSlotLabel(video.timeSlot)})`
                  )
                ]
              )
            )
          ),
          preview.length > 10 && React.createElement('p', { 
            key: 'more', 
            className: 'text-muted' 
          }, `... y ${preview.length - 10} videos más`)
        ]
      ),

      // Acciones
      React.createElement(
        'div',
        { className: 'form-actions', key: 'actions' },
        [
          React.createElement(
            'button',
            {
              key: 'submit',
              type: 'submit',
              className: 'btn-primary',
              disabled: loading || preview.length === 0
            },
            loading ? 'Creando...' : `Crear ${formData.count} Videos`
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
      )
    ]
  );
}