import React from 'react';

// Asumimos que PAGE_ID_TO_NAVIGATE se pasa como prop o se obtiene de plugin.constants
const PAGE_ID_RENDERED = 'videoscheduler';

function VideoSchedulerMainPage(props) {
  // props pasados desde el Wrapper: core, plugin, pluginId, y pageId de Atlas
  console.log(`[${props.pluginId}] VideoSchedulerMainPage (JSX) component IS rendering with props:`, props);
  
  return (
    <div
      className='video-scheduler-main-page-test'
      style={{ padding: '20px', border: '2px solid purple', backgroundColor: '#f3e6ff' }}
    >
      <h1>Página de {props.plugin.name || 'Video Scheduler'} (ID: {props.pageId || PAGE_ID_RENDERED})</h1>
      <p>Si ves este contenido con fondo morado, la página (JSX) se cargó.</p>
      <p>Plugin ID: {props.pluginId}</p>
    </div>
  );
}

export default VideoSchedulerMainPage;