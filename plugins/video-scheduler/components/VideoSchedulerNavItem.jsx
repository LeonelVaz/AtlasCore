// video-scheduler/components/VideoSchedulerNavItem.jsx
import React from "react";

function VideoSchedulerNavItem(props) {
  const {
    pluginId,
    onNavigate,
    pageIdToNavigate,
    plugin, // Tu prop personalizada
    activePagePluginId, // Prop de Atlas
    activePageId, // Prop de Atlas
  } = props;

  const handleClick = () => {
    // Tu lógica de console.log puede permanecer si es para depuración
    // console.log(
    //   `[${pluginId}] NavItem Clicked. Attempting to navigate to pageId: '${pageIdToNavigate}'`
    // );
    if (onNavigate && pageIdToNavigate) {
      onNavigate(pluginId, pageIdToNavigate);
    } else {
      console.warn(
        `[${pluginId}] onNavigate o pageIdToNavigate no disponible en VideoSchedulerNavItem.`
      );
    }
  };

  // Determinar si este ítem de navegación está activo
  const isActive =
    pluginId === activePagePluginId && pageIdToNavigate === activePageId;

  return React.createElement(
    "div",
    {
      // Clase raíz requerida por Atlas, y clase 'active' si corresponde
      className: `sidebar-item ${isActive ? "active" : ""}`,
      onClick: handleClick,
      title: plugin.name || "Video Scheduler", // Tooltip para accesibilidad
      style: { cursor: "pointer" }, // Para indicar que es clickeable
    },
    [
      // Contenedor del icono (según la guía)
      React.createElement(
        "span",
        {
          className: "sidebar-item-icon", // Clase estándar de Atlas para el contenedor del icono
          key: "nav-icon-container",
        },
        // Icono (usando Material Icons, como en tu implementación original)
        React.createElement(
          "span",
          {
            className: "material-icons", // Clase estándar para Material Icons
            key: "nav-icon",
          },
          "movie" // Tu icono original (o 'extension' o el que prefieras)
        )
      ),
      // Contenedor de la etiqueta (texto)
      React.createElement(
        "span",
        {
          className: "sidebar-item-label", // CLASE CRÍTICA para el colapso de texto
          key: "nav-label",
        },
        plugin.name || "Video Scheduler" // Texto del elemento de navegación
      ),
    ]
  );
}

export default VideoSchedulerNavItem;
