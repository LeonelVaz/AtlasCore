import React from 'react';

function VideoSchedulerMainPage(props) {
  const { plugin, pluginId } = props;
  const [videos, setVideos] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true); // Para feedback de carga inicial

  const refreshVideos = React.useCallback(async () => { // useCallback para estabilidad
    if (plugin && plugin.publicAPI && plugin.publicAPI.getAllVideos) {
      console.log(`[${pluginId}] VideoSchedulerMainPage: Llamando a getAllVideos...`);
      const currentVideos = plugin.publicAPI.getAllVideos(); // Sigue siendo síncrono para obtener la lista actual
      setVideos(currentVideos);
      console.log(`[${pluginId}] Videos refrescados en UI:`, currentVideos.length);
    } else {
      console.warn(`[${pluginId}] publicAPI.getAllVideos no está disponible en refreshVideos.`);
    }
  }, [plugin, pluginId]);


  React.useEffect(() => {
    setIsLoading(true);
    // Asegurarse de que el plugin y su publicAPI estén listos
    if (plugin && plugin.publicAPI) {
        refreshVideos();
    }
    setIsLoading(false); // Asumimos que getAllVideos es rápido por ahora
    // En una app real con carga asíncrona de datos inicial, esto sería más complejo
  }, [plugin, refreshVideos]);


  const handleAddVideo = async () => { // Ahora es async
    if (plugin && plugin.publicAPI && plugin.publicAPI.createVideo) {
      const newVideoData = {
        title: `Video Persistente #${videos.length + 1}`
      };
      try {
        console.log(`[${pluginId}] VideoSchedulerMainPage: Llamando a createVideo...`);
        await plugin.publicAPI.createVideo(newVideoData); // Esperar a que se cree y guarde
        refreshVideos(); // Refrescar la lista
      } catch (error) {
        console.error(`[${pluginId}] Error al crear video:`, error);
        // Aquí podrías mostrar un mensaje de error al usuario
      }
    } else {
      console.warn(`[${pluginId}] publicAPI.createVideo no está disponible en handleAddVideo.`);
    }
  };

  console.log(`[${pluginId}] VideoSchedulerMainPage rendering. Videos: ${videos.length}, Loading: ${isLoading}`);
  
  if (isLoading) {
    return React.createElement('p', {key: 'loading-msg'}, 'Cargando videos...');
  }

  return React.createElement(
    'div',
    {
      className: 'video-scheduler-main-page',
      style: { padding: '20px' }
    },
    [
      React.createElement('h1', { key: 'title' }, `${plugin.name || 'Video Scheduler'} Dashboard (Persistente)`),
      React.createElement(
        'button',
        {
          key: 'add-video-btn',
          onClick: handleAddVideo,
          style: { marginBottom: '20px', padding: '10px', cursor: 'pointer' }
        },
        'Añadir Video (Guardado)'
      ),
      React.createElement('h2', { key: 'list-title' }, 'Lista de Videos Guardados:'),
      videos.length === 0
        ? React.createElement('p', { key: 'no-videos' }, 'No hay videos guardados. ¡Añade uno!')
        : React.createElement(
            'ul',
            { key: 'videos-list', style: { listStyle: 'none', padding: 0 } },
            videos.map((video, index) => 
              React.createElement(
                'li',
                { 
                  key: video.id || `video-${index}`,
                  style: { 
                    padding: '8px', 
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between'
                  } 
                },
                [
                    React.createElement('span', {key: `title-${video.id}`}, `${video.title} (Estado: ${video.status || 'N/A'})`),
                ]
              )
            )
          )
    ]
  );
}

export default VideoSchedulerMainPage;