import React from 'react';
// --- NUEVO: Importar VideoForm ---
import VideoForm from './VideoForm.jsx';

function VideoSchedulerMainPage(props) {
  const { plugin, core, pluginId } = props; // 'core' puede ser útil para dialogs, etc.
  const [videos, setVideos] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  // --- NUEVO: Estado para mostrar/ocultar el formulario y para edición ---
  const [showForm, setShowForm] = React.useState(false);
  const [editingVideo, setEditingVideo] = React.useState(null); // null para nuevo, objeto video para editar

  const refreshVideos = React.useCallback(async () => {
    if (plugin && plugin.publicAPI && plugin.publicAPI.getAllVideos) {
      const currentVideos = plugin.publicAPI.getAllVideos();
      setVideos(currentVideos);
    }
  }, [plugin]);

  React.useEffect(() => {
    setIsLoading(true);
    if (plugin && plugin.publicAPI) {
      refreshVideos();
    }
    setIsLoading(false);
  }, [plugin, refreshVideos]);

  const handleOpenCreateForm = () => {
    setEditingVideo(null); // Asegurar que no hay video existente
    setShowForm(true);
    console.log(`[${pluginId}] Abriendo formulario para crear nuevo video.`);
  };
  
  // const handleOpenEditForm = (videoToEdit) => {
  //   setEditingVideo(videoToEdit);
  //   setShowForm(true);
  //   console.log(`[${pluginId}] Abriendo formulario para editar video:`, videoToEdit);
  // };

  const handleFormSave = async (videoData) => {
    console.log(`[${pluginId}] VideoForm guardado. Datos:`, videoData);
    if (editingVideo) {
      // Lógica de actualización (Etapa futura)
      // await plugin.publicAPI.updateVideo(editingVideo.id, videoData);
      console.log(`[${pluginId}] (Simulado) Video actualizado: ${editingVideo.id}`);
    } else {
      // Lógica de creación
      await plugin.publicAPI.createVideo(videoData);
    }
    refreshVideos();
    setShowForm(false); // Ocultar formulario después de guardar
    setEditingVideo(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingVideo(null);
    console.log(`[${pluginId}] Formulario cancelado.`);
  };
  
  if (isLoading) {
    return React.createElement('p', {key: 'loading-msg'}, 'Cargando videos...');
  }

  return React.createElement(
    'div',
    { className: 'video-scheduler-main-page', style: { padding: '20px' } },
    [
      React.createElement('h1', { key: 'title' }, `${plugin.name || 'Video Scheduler'} Dashboard`),
      
      // --- Botón para mostrar formulario de creación ---
      !showForm && React.createElement( // Solo mostrar si el formulario está oculto
        'button',
        {
          key: 'show-create-form-btn',
          onClick: handleOpenCreateForm,
          style: { marginBottom: '20px', padding: '10px', cursor: 'pointer' }
        },
        'Crear Nuevo Video'
      ),

      // --- Renderizar VideoForm si showForm es true ---
      showForm && React.createElement(VideoForm, {
        key: 'video-form-instance',
        plugin: plugin,
        core: core,
        existingVideo: editingVideo, // Será null para nuevo video
        onSave: handleFormSave,
        onCancel: handleFormCancel
      }),
      
      React.createElement('h2', { key: 'list-title', style: { marginTop: showForm ? '30px' : '10px'} }, 'Lista de Videos:'),
      videos.length === 0 && !showForm // No mostrar "No hay videos" si el form está abierto para crear el primero
        ? React.createElement('p', { key: 'no-videos' }, 'No hay videos. ¡Crea uno!')
        : React.createElement(
            'ul',
            { key: 'videos-list', style: { listStyle: 'none', padding: 0 } },
            videos.map((video, index) => 
              React.createElement(
                'li',
                { 
                  key: video.id || `video-${index}`,
                  style: { 
                    padding: '10px', 
                    border: '1px solid #ddd',
                    marginBottom: '5px',
                    borderRadius: '4px',
                    backgroundColor: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  } 
                },
                [
                  React.createElement('div', {key: `details-${video.id}`}, [
                    React.createElement('strong', {key: `title-${video.id}`}, video.title),
                    React.createElement('br', {key: `br-${video.id}`}),
                    React.createElement('span', {key: `desc-${video.id}`, style: {fontSize: '0.9em', color: '#555'}}, video.description || React.createElement('em', {}, 'Sin descripción')),
                    React.createElement('br', {key: `br2-${video.id}`}),
                    React.createElement('span', {key: `status-${video.id}`, style: {fontSize: '0.8em', color: '#777'}}, `Estado: ${video.status}`)
                  ]),
                  // --- Botón de Editar (funcionalidad se completará después) ---
                  // React.createElement(
                  //   'button',
                  //   { 
                  //     key: `edit-btn-${video.id}`,
                  //     onClick: () => handleOpenEditForm(video),
                  //     style: { marginLeft: '10px', padding: '5px 10px', cursor: 'pointer' }
                  //   },
                  //   'Editar'
                  // )
                ]
              )
            )
          )
    ]
  );
}

export default VideoSchedulerMainPage;