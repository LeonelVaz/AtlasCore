// video-scheduler/components/VideoForm.jsx
import React from 'react';
// Importar constantes de estado si es necesario para el selector de estado
import { VIDEO_MAIN_STATUS } from '../utils/constants.js'; // Solo necesitamos VIDEO_MAIN_STATUS aquí

function VideoForm(props) {
  const { plugin, core, existingVideo, onSave, onCancel } = props;
  
  const [title, setTitle] = React.useState(existingVideo ? existingVideo.title : '');
  const [description, setDescription] = React.useState(existingVideo ? existingVideo.description : '');
  // El estado inicial para un nuevo video se establece aquí
  const [status, setStatus] = React.useState(existingVideo ? existingVideo.status : VIDEO_MAIN_STATUS.PLANNED);

  const pluginId = plugin ? plugin.id : 'video-scheduler-form'; 

  React.useEffect(() => {
    if (existingVideo) {
      setTitle(existingVideo.title);
      setDescription(existingVideo.description);
      setStatus(existingVideo.status);
    } else {
      setTitle('');
      setDescription('');
      setStatus(VIDEO_MAIN_STATUS.PLANNED); // Estado por defecto para nuevo video
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
      status: status, // El estado principal se envía desde aquí
      // subStatus se manejará a través del StatusSelector dedicado
    };
    
    console.log(`[${pluginId}] VideoForm handleSubmit. Datos:`, videoData);
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
      React.createElement('h3', { key: 'form-title-h3' }, existingVideo ? 'Editar Video' : 'Crear Nuevo Video'),
      React.createElement(
        'form',
        { key: 'video-form-element', onSubmit: handleSubmit },
        [
          // Campo Título
          React.createElement(
            'div', { key: 'title-group', style: { marginBottom: '15px' } },
            [
              React.createElement(
                'label',
                { key: 'title-label', htmlFor: 'video-title', style: { display: 'block', marginBottom: '5px' } },
                'Título:'
              ),
              React.createElement('input', {
                key: 'title-input',
                type: 'text',
                id: 'video-title',
                value: title,
                onChange: (e) => setTitle(e.target.value),
                style: { width: '95%', padding: '8px' },
                required: true
              })
            ]
          ),
          // Campo Descripción
          React.createElement(
            'div', { key: 'desc-group', style: { marginBottom: '15px' } },
            [
              React.createElement(
                'label',
                { key: 'desc-label', htmlFor: 'video-description', style: { display: 'block', marginBottom: '5px' } },
                'Descripción:'
              ),
              React.createElement('textarea', {
                key: 'desc-input',
                id: 'video-description',
                value: description,
                onChange: (e) => setDescription(e.target.value),
                rows: 4,
                style: { width: '95%', padding: '8px' }
              })
            ]
          ),
          // Campo Estado (Selector simple para el estado principal en el formulario)
          // El StatusSelector más complejo se usará desde la lista/calendario
          React.createElement(
            'div', { key: 'status-group', style: { marginBottom: '15px' } },
            [
              React.createElement(
                'label',
                { key: 'status-label', htmlFor: 'video-status', style: { display: 'block', marginBottom: '5px' } },
                'Estado Principal:'
              ),
              React.createElement(
                'select',
                {
                  key: 'status-select',
                  id: 'video-status',
                  value: status, // Este es el estado principal
                  onChange: (e) => setStatus(e.target.value),
                  style: { width: '100%', padding: '8px' }
                },
                Object.values(VIDEO_MAIN_STATUS).map(mainStatusValue => 
                  React.createElement(
                    'option',
                    { 
                      key: mainStatusValue, 
                      value: mainStatusValue
                    },
                    mainStatusValue.charAt(0).toUpperCase() + mainStatusValue.slice(1)
                  )
                )
              )
            ]
          ),
          // Botones
          React.createElement(
            'div', { key: 'actions-group', style: { marginTop: '20px'} },
            [
              React.createElement(
                'button',
                { key: 'submit-btn', type: 'submit', style: { padding: '10px 15px', marginRight: '10px', cursor: 'pointer' } },
                existingVideo ? 'Guardar Cambios' : 'Crear Video'
              ),
              React.createElement(
                'button',
                { key: 'cancel-btn', type: 'button', onClick: onCancel, style: { padding: '10px 15px', cursor: 'pointer' } },
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