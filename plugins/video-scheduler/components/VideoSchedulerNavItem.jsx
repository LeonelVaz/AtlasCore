// video-scheduler/components/VideoSchedulerNavItem.jsx
import React from "react";

function VideoSchedulerNavItem(props) {
  const { pluginId, onNavigate, pageIdToNavigate, plugin } = props;

  const handleClick = () => {
    console.log(
      `[${pluginId}] NavItem Clicked from JSX. Attempting to navigate to pageId: '${pageIdToNavigate}'`
    );
    if (onNavigate && pageIdToNavigate) {
      onNavigate(pluginId, pageIdToNavigate);
    } else {
      console.warn(
        `[${pluginId}] onNavigate o pageIdToNavigate no disponible en VideoSchedulerNavItem (JSX).`
      );
    }
  };

  return (
    // El div ya tiene la clase 'video-scheduler-nav-item' aplicada desde index.js si se usa la factoría
    // Si se usa directamente, la clase se puede añadir aquí. Por consistencia, lo dejo.
    React.createElement(
      "div",
      {
        className: "video-scheduler-nav-item", // Se puede aplicar estilo global en el CSS del plugin
        onClick: handleClick,
      },
      [
        React.createElement(
          "span",
          {
            key: "icon",
            className: "material-icons video-scheduler-nav-icon", // Clase para el icono
          },
          "movie" // Icono de Material Icons
        ),
        React.createElement(
          "span",
          { key: "label" },
          plugin.name || "Video Scheduler"
        ),
      ]
    )
  );
}

export default VideoSchedulerNavItem;
