import React from 'react';
import { VIDEO_STATUS } from '../utils/constants.js';

function VideoForm(props) {
  const { plugin, core, existingVideo, onSave, onCancel } = props;
  
  const [title, setTitle] = React.useState(existingVideo ? existingVideo.title : '');
  const [description, setDescription] = React.useState(existingVideo ? existingVideo.description : '');
  const [status, setStatus] = React.useState(existingVideo ? existingVideo.status : VIDEO_STATUS.PLANNED);

  const pluginId = plugin ? plugin.id : 'video-scheduler-form';

  React.useEffect(() => {
    if (existingVideo) {
      setTitle(existingVideo.title);
      setDescription(existingVideo.description);
      setStatus(existingVideo.status);
    } else {
      setTitle('');
      setDescription('');
      setStatus(VIDEO_STATUS.PLANNED);
    }
  }, [existingVideo]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!title.trim()) {
      alert('El título es obligatorio.');
      console.warn(`[${pluginId}] Intento de guardar video sin título.`);
      return;
    }
    const videoData = {
      title: title.trim(),
      description: description.trim(),
      status: status,
    };
    onSave(videoData);
  };

  return React.createElement(
    'div',
    {
      className: 'video-form-container',
      style: {
        border: '1px solid #ccc',
        padding: '20px',
        marginTop: '20px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px'
      }
    },
    [
      React.createElement('h3', { key: 'form-title-h3' }, existingVideo ? 'Editar Video' : 'Crear Nuevo Video'), // Añadida key
      React.createElement(
        'form',
        { key: 'video-form-element', onSubmit: handleSubmit }, // Añadida key
        [
          React.createElement(
            'div', { key: 'title-group', style: { marginBottom: '15px' } },
            [
              React.createElement(
                'label',
                { key: 'title-label', htmlFor: 'video-title', style: { display: 'block', marginBottom: '5px' } }, // Añadida key
                'Título:'
              ),
              React.createElement('input', {
                key: 'title-input', // Añadida key
                type: 'text',
                id: 'video-title',
                value: title,
                onChange: (e) => setTitle(e.target.value),
                style: { width: '95%', padding: '8px' },
                required: true
              })
            ]
          ),
          React.createElement(
            'div', { key: 'desc-group', style: { marginBottom: '15px' } },
            [
              React.createElement(
                'label',
                { key: 'desc-label', htmlFor: 'video-description', style: { display: 'block', marginBottom: '5px' } }, // Añadida key
                'Descripción:'
              ),
              React.createElement('textarea', {
                key: 'desc-input', // Añadida key
                id: 'video-description',
                value: description,
                onChange: (e) => setDescription(e.target.value),
                rows: 4,
                style: { width: '95%', padding: '8px' }
              })
            ]
          ),
          React.createElement(
            'div', { key: 'status-group', style: { marginBottom: '15px' } },
            [
              React.createElement(
                'label',
                { key: 'status-label', htmlFor: 'video-status', style: { display: 'block', marginBottom: '5px' } }, // Añadida key
                'Estado:'
              ),
              React.createElement(
                'select',
                {
                  key: 'status-select', // Añadida key
                  id: 'video-status',
                  value: status,
                  onChange: (e) => setStatus(e.target.value),
                  style: { width: '100%', padding: '8px' }
                },
                Object.keys(VIDEO_STATUS).map(statusKey => // Renombrada la variable del map para claridad
                  React.createElement(
                    'option',
                    { 
                      // --- CORRECCIÓN AQUÍ ---
                      key: VIDEO_STATUS[statusKey], // Usar el valor del estado (ej. "planned") como key
                      value: VIDEO_STATUS[statusKey]
                    },
                    VIDEO_STATUS[statusKey].charAt(0).toUpperCase() + VIDEO_STATUS[statusKey].slice(1)
                  )
                )
              )
            ]
          ),
          React.createElement(
            'div', { key: 'actions-group', style: { marginTop: '20px'} },
            [
              React.createElement(
                'button',
                { key: 'submit-btn', type: 'submit', style: { padding: '10px 15px', marginRight: '10px', cursor: 'pointer' } }, // Añadida key
                existingVideo ? 'Guardar Cambios' : 'Crear Video'
              ),
              React.createElement(
                'button',
                { key: 'cancel-btn', type: 'button', onClick: onCancel, style: { padding: '10px 15px', cursor: 'pointer' } }, // Añadida key
                'Cancelar'
              )
            ]
          )
        ]
      )
    ]
  );
}

export default VideoForm;