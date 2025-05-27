// video-scheduler/components/BulkAddForm.jsx
import React from 'react';
import { VIDEO_MAIN_STATUS } from '../utils/constants.js';

function BulkAddForm({ currentDate, onSave, onCancel, styleProps, plugin }) {
  const [formData, setFormData] = React.useState({
    baseName: '',
    startNumber: 1,
    videoCount: 5,
    startDay: 1,
    timeSlot: 0, // 0=7am, 1=15pm, 2=22pm
    frequency: 'daily', // 'daily' o 'weekly'
    dailyInterval: 1, // Para frecuencia diaria: cada X días
    weeklyDays: [], // Para frecuencia semanal: días de la semana [0-6]
    weeklyTimeSlots: [0] // Para frecuencia semanal: horarios por día
  });

  const popupRef = React.useRef(null);

  // Opciones de horarios
  const timeSlotOptions = [
    { value: 0, label: '7am' },
    { value: 1, label: '15pm' },
    { value: 2, label: '22pm' }
  ];

  // Días de la semana
  const weekDays = [
    { value: 0, label: 'Dom' },
    { value: 1, label: 'Lun' },
    { value: 2, label: 'Mar' },
    { value: 3, label: 'Mié' },
    { value: 4, label: 'Jue' },
    { value: 5, label: 'Vie' },
    { value: 6, label: 'Sáb' }
  ];

  // Obtener días del mes actual
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const dayOptions = [];
  for (let i = 1; i <= daysInMonth; i++) {
    dayOptions.push({ value: i, label: i.toString() });
  }

  // Manejar clicks fuera del popup
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onCancel();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCancel]);

  const handleInputChange = (field) => (e) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWeeklyDayToggle = (dayValue) => {
    setFormData(prev => {
      const newWeeklyDays = prev.weeklyDays.includes(dayValue)
        ? prev.weeklyDays.filter(d => d !== dayValue)
        : [...prev.weeklyDays, dayValue].sort();
      
      return {
        ...prev,
        weeklyDays: newWeeklyDays
      };
    });
  };

  const handleWeeklyTimeSlotToggle = (slotValue) => {
    setFormData(prev => {
      const newTimeSlots = prev.weeklyTimeSlots.includes(slotValue)
        ? prev.weeklyTimeSlots.filter(s => s !== slotValue)
        : [...prev.weeklyTimeSlots, slotValue].sort();
      
      return {
        ...prev,
        weeklyTimeSlots: newTimeSlots
      };
    });
  };

  const generateVideoSchedule = () => {
    const schedule = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    if (formData.frequency === 'daily') {
      // Frecuencia diaria
      let currentDay = formData.startDay;
      let videosCreated = 0;
      
      while (videosCreated < formData.videoCount && currentDay <= daysInMonth) {
        schedule.push({
          day: currentDay,
          slotIndex: formData.timeSlot,
          name: `${formData.baseName} ${formData.startNumber + videosCreated}`,
          status: VIDEO_MAIN_STATUS.DEVELOPMENT,
          description: ''
        });
        
        videosCreated++;
        currentDay += formData.dailyInterval;
      }
    } else if (formData.frequency === 'weekly') {
      // Frecuencia semanal
      if (formData.weeklyDays.length === 0 || formData.weeklyTimeSlots.length === 0) {
        return schedule; // Sin días o horarios seleccionados
      }
      
      let videosCreated = 0;
      let currentDay = formData.startDay;
      
      while (videosCreated < formData.videoCount && currentDay <= daysInMonth) {
        const dayOfWeek = new Date(year, month, currentDay).getDay();
        
        if (formData.weeklyDays.includes(dayOfWeek)) {
          // Este día está en los días seleccionados
          formData.weeklyTimeSlots.forEach(timeSlot => {
            if (videosCreated < formData.videoCount) {
              schedule.push({
                day: currentDay,
                slotIndex: timeSlot,
                name: `${formData.baseName} ${formData.startNumber + videosCreated}`,
                status: VIDEO_MAIN_STATUS.DEVELOPMENT,
                description: ''
              });
              videosCreated++;
            }
          });
        }
        
        currentDay++;
      }
    }
    
    return schedule;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.baseName.trim()) {
      alert('El nombre base es obligatorio');
      return;
    }
    
    if (formData.videoCount < 1 || formData.videoCount > 50) {
      alert('La cantidad de videos debe estar entre 1 y 50');
      return;
    }
    
    if (formData.frequency === 'weekly' && formData.weeklyDays.length === 0) {
      alert('Selecciona al menos un día de la semana');
      return;
    }
    
    if (formData.frequency === 'weekly' && formData.weeklyTimeSlots.length === 0) {
      alert('Selecciona al menos un horario');
      return;
    }
    
    // Generar programación
    const schedule = generateVideoSchedule();
    
    if (schedule.length === 0) {
      alert('No se pueden crear videos con la configuración actual');
      return;
    }
    
    // Confirmar antes de crear
    const confirmMessage = `Se crearán ${schedule.length} videos. ¿Continuar?`;
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      await onSave(schedule);
    } catch (error) {
      console.error('Error al crear videos en lote:', error);
      alert('Error al crear los videos. Revisa la consola para más detalles.');
    }
  };

  const previewSchedule = generateVideoSchedule();

  return React.createElement(
    'div',
    {
      ref: popupRef,
      className: 'bulk-add-form-modal',
      style: styleProps
    },
    [
      React.createElement('h3', { key: 'title' }, 'Añadir Videos en Lote'),
      
      React.createElement('form', { key: 'form', onSubmit: handleSubmit }, [
        // Información básica
        React.createElement(
          'div',
          { key: 'basic-info', className: 'form-section' },
          [
            React.createElement('h4', { key: 'section-title' }, 'Información Básica'),
            
            React.createElement(
              'div',
              { key: 'base-name', className: 'form-group' },
              [
                React.createElement('label', { key: 'label' }, 'Nombre base de la serie:'),
                React.createElement('input', {
                  key: 'input',
                  type: 'text',
                  value: formData.baseName,
                  onChange: handleInputChange('baseName'),
                  placeholder: 'ej. Tutorial React',
                  required: true
                })
              ]
            ),
            
            React.createElement(
              'div',
              { key: 'start-number', className: 'form-group' },
              [
                React.createElement('label', { key: 'label' }, 'Comenzar numeración desde:'),
                React.createElement('input', {
                  key: 'input',
                  type: 'number',
                  value: formData.startNumber,
                  onChange: handleInputChange('startNumber'),
                  min: 1,
                  max: 999
                })
              ]
            ),
            
            React.createElement(
              'div',
              { key: 'video-count', className: 'form-group' },
              [
                React.createElement('label', { key: 'label' }, 'Cantidad de videos:'),
                React.createElement('input', {
                  key: 'input',
                  type: 'number',
                  value: formData.videoCount,
                  onChange: handleInputChange('videoCount'),
                  min: 1,
                  max: 50
                })
              ]
            ),
            
            React.createElement(
              'div',
              { key: 'start-day', className: 'form-group' },
              [
                React.createElement('label', { key: 'label' }, 'Comenzar desde el día:'),
                React.createElement(
                  'select',
                  {
                    key: 'select',
                    value: formData.startDay,
                    onChange: handleInputChange('startDay')
                  },
                  dayOptions.map(option =>
                    React.createElement('option', {
                      key: option.value,
                      value: option.value
                    }, option.label)
                  )
                )
              ]
            )
          ]
        ),
        
        // Frecuencia
        React.createElement(
          'div',
          { key: 'frequency', className: 'form-section' },
          [
            React.createElement('h4', { key: 'section-title' }, 'Frecuencia'),
            
            React.createElement(
              'div',
              { key: 'frequency-type', className: 'form-group' },
              [
                React.createElement('label', { key: 'label' }, 'Tipo de frecuencia:'),
                React.createElement(
                  'select',
                  {
                    key: 'select',
                    value: formData.frequency,
                    onChange: handleInputChange('frequency')
                  },
                  [
                    React.createElement('option', { key: 'daily', value: 'daily' }, 'Diaria'),
                    React.createElement('option', { key: 'weekly', value: 'weekly' }, 'Semanal')
                  ]
                )
              ]
            ),
            
            // Opciones para frecuencia diaria
            formData.frequency === 'daily' && React.createElement(
              'div',
              { key: 'daily-options' },
              [
                React.createElement(
                  'div',
                  { key: 'daily-interval', className: 'form-group' },
                  [
                    React.createElement('label', { key: 'label' }, 'Publicar cada X días:'),
                    React.createElement('input', {
                      key: 'input',
                      type: 'number',
                      value: formData.dailyInterval,
                      onChange: handleInputChange('dailyInterval'),
                      min: 1,
                      max: 7
                    })
                  ]
                ),
                
                React.createElement(
                  'div',
                  { key: 'time-slot', className: 'form-group' },
                  [
                    React.createElement('label', { key: 'label' }, 'Horario:'),
                    React.createElement(
                      'select',
                      {
                        key: 'select',
                        value: formData.timeSlot,
                        onChange: handleInputChange('timeSlot')
                      },
                      timeSlotOptions.map(option =>
                        React.createElement('option', {
                          key: option.value,
                          value: option.value
                        }, option.label)
                      )
                    )
                  ]
                )
              ]
            ),
            
            // Opciones para frecuencia semanal
            formData.frequency === 'weekly' && React.createElement(
              'div',
              { key: 'weekly-options' },
              [
                React.createElement(
                  'div',
                  { key: 'weekly-days', className: 'form-group' },
                  [
                    React.createElement('label', { key: 'label' }, 'Días de la semana:'),
                    React.createElement(
                      'div',
                      { key: 'days-grid', className: 'checkbox-grid' },
                      weekDays.map(day =>
                        React.createElement(
                          'label',
                          { key: day.value, className: 'checkbox-item' },
                          [
                            React.createElement('input', {
                              key: 'checkbox',
                              type: 'checkbox',
                              checked: formData.weeklyDays.includes(day.value),
                              onChange: () => handleWeeklyDayToggle(day.value)
                            }),
                            React.createElement('span', { key: 'label' }, day.label)
                          ]
                        )
                      )
                    )
                  ]
                ),
                
                React.createElement(
                  'div',
                  { key: 'weekly-time-slots', className: 'form-group' },
                  [
                    React.createElement('label', { key: 'label' }, 'Horarios:'),
                    React.createElement(
                      'div',
                      { key: 'times-grid', className: 'checkbox-grid' },
                      timeSlotOptions.map(option =>
                        React.createElement(
                          'label',
                          { key: option.value, className: 'checkbox-item' },
                          [
                            React.createElement('input', {
                              key: 'checkbox',
                              type: 'checkbox',
                              checked: formData.weeklyTimeSlots.includes(option.value),
                              onChange: () => handleWeeklyTimeSlotToggle(option.value)
                            }),
                            React.createElement('span', { key: 'label' }, option.label)
                          ]
                        )
                      )
                    )
                  ]
                )
              ]
            )
          ]
        ),
        
        // Vista previa
        React.createElement(
          'div',
          { key: 'preview', className: 'form-section' },
          [
            React.createElement('h4', { key: 'section-title' }, `Vista Previa (${previewSchedule.length} videos)`),
            React.createElement(
              'div',
              { key: 'preview-list', className: 'preview-list' },
              previewSchedule.length > 0 ? 
                previewSchedule.slice(0, 10).map((item, index) => 
                  React.createElement(
                    'div',
                    { key: index, className: 'preview-item' },
                    `Día ${item.day} - ${timeSlotOptions[item.slotIndex].label}: ${item.name}`
                  )
                ).concat(
                  previewSchedule.length > 10 ? 
                    [React.createElement('div', { key: 'more' }, `... y ${previewSchedule.length - 10} más`)] : 
                    []
                ) :
                [React.createElement('div', { key: 'empty' }, 'No se crearán videos con la configuración actual')]
            )
          ]
        ),
        
        // Botones de acción
        React.createElement(
          'div',
          { key: 'actions', className: 'form-actions' },
          [
            React.createElement(
              'button',
              {
                key: 'cancel',
                type: 'button',
                onClick: onCancel,
                className: 'button-secondary'
              },
              'Cancelar'
            ),
            React.createElement(
              'button',
              {
                key: 'submit',
                type: 'submit',
                className: 'button-primary',
                disabled: previewSchedule.length === 0
              },
              `Crear ${previewSchedule.length} Videos`
            )
          ]
        )
      ])
    ]
  );
}

export default BulkAddForm;