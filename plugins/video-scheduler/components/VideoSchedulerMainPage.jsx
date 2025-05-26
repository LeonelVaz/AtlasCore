// video-scheduler/components/VideoSchedulerMainPage.jsx
import React from 'react';
import VideoForm from './VideoForm.jsx';
import StatusSelector from './StatusSelector.jsx';
import { STATUS_EMOJIS, VIDEO_MAIN_STATUS } from '../utils/constants.js';

function VideoSchedulerMainPage(props) {
  const { plugin, core, pluginId } = props;
  const [videos, setVideos] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [editingVideo, setEditingVideo] = React.useState(null); 

  const [showStatusSelector, setShowStatusSelector] = React.useState(false);
  const [statusSelectorTargetVideo, setStatusSelectorTargetVideo] = React.useState(null);
  const [statusSelectorPosition, setStatusSelectorPosition] = React.useState({ top: 0, left: 0 });

  const refreshVideos = React.useCallback(async () => {
    if (plugin && plugin.publicAPI && plugin.publicAPI.getAllVideos) {
      const currentVideos = plugin.publicAPI.getAllVideos();
      setVideos(currentVideos);
      console.log(`[${pluginId}] Videos refrescados en UI: ${currentVideos.length} videos.`);
    } else {
        console.warn(`[${pluginId}] publicAPI o getAllVideos no disponible al refrescar.`);
    }
  }, [plugin, pluginId]);

  React.useEffect(() => {
    setIsLoading(true);
    if (plugin && plugin.publicAPI) {
      refreshVideos();
    }
    setIsLoading(false);
  }, [plugin, refreshVideos]);

  const handleOpenCreateForm = () => {
    setEditingVideo(null); 
    setShowForm(true);
    setShowStatusSelector(false);
    console.log(`[${pluginId}] Abriendo formulario para crear nuevo video.`);
  };
  
  const handleFormSave = async (videoDataFromForm) => {
    console.log(`[${pluginId}] VideoForm guardado. Datos del formulario:`, videoDataFromForm);
    if (editingVideo) {
      // await plugin.publicAPI.updateVideo(editingVideo.id, videoDataFromForm); // Para Etapa 4
    } else {
      await plugin.publicAPI.createVideo(videoDataFromForm);
    }
    refreshVideos();
    setShowForm(false);
    setEditingVideo(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingVideo(null);
    console.log(`[${pluginId}] Formulario cancelado.`);
  };

  const handleOpenStatusSelector = (video, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setStatusSelectorTargetVideo(video);
    setStatusSelectorPosition({ 
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX 
    });
    setShowForm(false); 
    setShowStatusSelector(true);
    console.log(`[${pluginId}] Abriendo StatusSelector para video: ${video.id}`);
  };

  const handleStatusSelectorClose = () => {
    setShowStatusSelector(false);
    setStatusSelectorTargetVideo(null);
  };

  const handleStatusChangeFromSelector = async (newMainStatus, newSubStatus) => {
    if (statusSelectorTargetVideo && plugin.publicAPI.updateVideoStatus) {
      console.log(`[${pluginId}] Cambiando estado para ${statusSelectorTargetVideo.id} a: Main=${newMainStatus}, Sub=${newSubStatus}`);
      await plugin.publicAPI.updateVideoStatus(statusSelectorTargetVideo.id, newMainStatus, newSubStatus);
      refreshVideos();
    }
    handleStatusSelectorClose();
  };
  
  // Helper para formatear el texto del estado
  const formatStatusText = (statusValue) => {
    if (typeof statusValue === 'string' && statusValue.length > 0) {
      return statusValue.charAt(0).toUpperCase() + statusValue.slice(1);
    }
    return 'N/A'; // O algún otro valor por defecto si el estado es inválido
  };

  if (isLoading) {
    return React.createElement('p', {key: 'loading-msg'}, 'Cargando videos...');
  }

  return React.createElement(
    'div', 
    { className: 'video-scheduler-main-page', style: { padding: '20px', position: 'relative' } },
    [
      React.createElement('h1', { key: 'title' }, `${plugin.name || 'Video Scheduler'} Dashboard`),
      
      !showForm && !showStatusSelector && React.createElement(
        'button',
        {
          key: 'show-create-form-btn',
          onClick: handleOpenCreateForm,
          style: { marginBottom: '20px', padding: '10px 15px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }
        },
        'Crear Nuevo Video'
      ),

      showForm && React.createElement(VideoForm, {
        key: 'video-form-instance',
        plugin: plugin,
        core: core,
        existingVideo: editingVideo,
        onSave: handleFormSave,
        onCancel: handleFormCancel
      }),
      
      React.createElement('h2', { key: 'list-title', style: { marginTop: (showForm || showStatusSelector) ? '30px' : '10px'} }, 'Lista de Videos:'),
      videos.length === 0 && !showForm 
        ? React.createElement('p', { key: 'no-videos' }, 'No hay videos. ¡Crea uno!')
        : React.createElement(
            'ul',
            { key: 'videos-list', style: { listStyle: 'none', padding: 0 } },
            videos.map((video) => {
              // --- CORRECCIÓN AQUÍ ---
              // Asegurarse de que video.status y video.subStatus sean strings antes de usar charAt
              const mainStatusText = video.status ? formatStatusText(video.status) : 'Desconocido';
              const subStatusText = video.subStatus ? formatStatusText(video.subStatus) : '';

              const statusDisplay = `Estado: ${STATUS_EMOJIS[video.status] || '?'} ${mainStatusText} ${
                                video.subStatus 
                                ? `(${STATUS_EMOJIS[video.subStatus] || '?'} ${subStatusText})` 
                                : ''
                              }`;

              return React.createElement(
                'li',
                { 
                  key: video.id,
                  style: { 
                    padding: '12px', border: '1px solid #ddd', marginBottom: '8px',
                    borderRadius: '6px', backgroundColor: '#fff',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  } 
                },
                [
                  React.createElement('div', {key: `details-${video.id}`}, [
                    React.createElement('strong', {key: `title-${video.id}`, style: {fontSize: '16px'}}, video.title),
                    React.createElement('br', {key: `br1-${video.id}`}),
                    React.createElement('span', {key: `desc-${video.id}`, style: {fontSize: '14px', color: '#555'}}, video.description || React.createElement('em', {}, 'Sin descripción')),
                    React.createElement('br', {key: `br2-${video.id}`}),
                    React.createElement(
                        'span',
                        {
                            key: `status-indicator-${video.id}`,
                            style: { 
                                fontSize: '14px', 
                                color: '#333', 
                                cursor: 'pointer', 
                                display: 'inline-block',
                                padding: '4px 8px',
                                border: '1px solid #007bff', 
                                borderRadius: '4px',
                                backgroundColor: '#f0f8ff',
                                marginTop: '5px'
                            },
                            onClick: (e) => handleOpenStatusSelector(video, e) 
                        },
                        statusDisplay // Usar la variable formateada
                    )
                  ]),
                ]
              );
            })
          ),
      showStatusSelector && statusSelectorTargetVideo && React.createElement(StatusSelector, {
        key: 'status-selector-instance',
        currentMainStatus: statusSelectorTargetVideo.status,
        currentSubStatus: statusSelectorTargetVideo.subStatus,
        onStatusChange: handleStatusChangeFromSelector,
        onCancel: handleStatusSelectorClose,
        styleProps: { 
            top: `${statusSelectorPosition.top}px`, 
            left: `${statusSelectorPosition.left}px` 
        }
      })
    ]
  );
}

export default VideoSchedulerMainPage;