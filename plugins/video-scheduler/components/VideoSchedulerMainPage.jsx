import React from 'react'; // React.useState y React.useEffect serán necesarios

function VideoSchedulerMainPage(props) {
  const { plugin, pluginId } = props; // 'plugin' es la instancia de nuestro plugin

  // Estado para almacenar la lista de videos a mostrar
  const [videos, setVideos] = React.useState([]);

  // Función para cargar/refrescar los videos desde el plugin
  const refreshVideos = () => {
    if (plugin && plugin.publicAPI && plugin.publicAPI.getAllVideos) {
      const currentVideos = plugin.publicAPI.getAllVideos();
      setVideos(currentVideos);
      console.log(`[${pluginId}] Videos refrescados en UI:`, currentVideos);
    } else {
      console.warn(`[${pluginId}] publicAPI.getAllVideos no está disponible.`);
    }
  };

  // Cargar videos cuando el componente se monta y cuando el plugin esté listo
  React.useEffect(() => {
    refreshVideos(); // Carga inicial
  }, [plugin]); // Dependencia: re-ejecutar si la instancia del plugin cambia (poco probable pero seguro)


  const handleAddVideo = () => {
    if (plugin && plugin.publicAPI && plugin.publicAPI.createVideo) {
      // Crear un video con datos por defecto.
      // En el futuro, esto podría abrir un formulario.
      const newVideoData = {
        title: `Video de Prueba #${videos.length + 1}`
        // No necesitamos pasar 'status' o 'id', el plugin se encargará
      };
      plugin.publicAPI.createVideo(newVideoData);
      refreshVideos(); // Refrescar la lista después de añadir
    } else {
      console.warn(`[${pluginId}] publicAPI.createVideo no está disponible.`);
    }
  };

  // Renderizado
  console.log(`[${pluginId}] VideoSchedulerMainPage rendering. Número de videos: ${videos.length}`);
  
  return React.createElement(
    'div',
    {
      className: 'video-scheduler-main-page',
      style: { padding: '20px' }
    },
    [
      React.createElement('h1', { key: 'title' }, `${plugin.name || 'Video Scheduler'} Dashboard`),
      React.createElement(
        'button',
        {
          key: 'add-video-btn',
          onClick: handleAddVideo,
          style: { marginBottom: '20px', padding: '10px', cursor: 'pointer' }
        },
        'Añadir Video de Prueba'
      ),
      React.createElement('h2', { key: 'list-title' }, 'Lista de Videos:'),
      videos.length === 0
        ? React.createElement('p', { key: 'no-videos' }, 'No hay videos aún. ¡Añade uno!')
        : React.createElement(
            'ul',
            { key: 'videos-list', style: { listStyle: 'none', padding: 0 } },
            videos.map((video, index) => 
              React.createElement(
                'li',
                { 
                  key: video.id || `video-${index}`, // Usar video.id si está disponible
                  style: { 
                    padding: '8px', 
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between'
                  } 
                },
                [
                    React.createElement('span', {key: `title-${video.id}`}, `${video.title} (Estado: ${video.status || 'N/A'})`),
                    // Aquí podríamos añadir un botón de eliminar en el futuro
                ]
              )
            )
          )
    ]
  );
}

export default VideoSchedulerMainPage;