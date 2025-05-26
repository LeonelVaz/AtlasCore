import React from 'react';

function VideoSchedulerNavItem(props) {
  // props pasados desde el Wrapper: core, plugin, pluginId, pageIdToNavigate, y props de Atlas como onNavigate
  const { pluginId, onNavigate, pageIdToNavigate, plugin } = props;

  const handleClick = () => {
    console.log(`[${pluginId}] NavItem Clicked from JSX. Attempting to navigate to pageId: '${pageIdToNavigate}'`);
    if (onNavigate && pageIdToNavigate) {
      onNavigate(pluginId, pageIdToNavigate);
    } else {
      console.warn(`[${pluginId}] onNavigate o pageIdToNavigate no disponible en VideoSchedulerNavItem (JSX).`);
    }
  };

  return (
    <div
      className='video-scheduler-nav-item'
      onClick={handleClick}
      style={{ cursor: 'pointer', padding: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}
    >
      <span style={{ fontSize: '1.2em' }}>🎬</span>
      <span>{plugin.name || 'Video Scheduler'}</span>
    </div>
  );
}

export default VideoSchedulerNavItem;