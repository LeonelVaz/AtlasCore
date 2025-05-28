// Dirección: notes-manager\components\NotesNavigationItem.jsx
import React from "react";

function NotesNavigationItem(props) {
  // Desestructuramos las props necesarias, incluyendo las nuevas para el estado activo
  const { onNavigate, plugin, activePagePluginId, activePageId } = props;

  // El ID de la página a la que este ítem de navegación dirige.
  // En tu plugin, NotesPage se registra con pageId: "notes".
  const pageIdToNavigate = "notes";

  const handleClick = () => {
    if (onNavigate) {
      // Usamos plugin.id (el ID de este plugin) y pageIdToNavigate
      onNavigate(plugin.id, pageIdToNavigate);
    } else {
      console.warn(
        `[${plugin.id || "NotesNavigationItem"}] 'onNavigate' no está definido.`
      );
    }
  };

  // Lógica para determinar si este ítem de navegación está activo
  // Compara el ID del plugin actual y el ID de la página a la que navega
  // con los IDs activos globales proporcionados por Atlas.
  const isActive =
    plugin.id === activePagePluginId && pageIdToNavigate === activePageId;

  return React.createElement(
    "div",
    {
      // Aplicar la clase 'active' dinámicamente
      className: `sidebar-item ${isActive ? "active" : ""}`,
      onClick: handleClick,
      tabIndex: 0, // Para accesibilidad
      title: "Notes", // Tooltip
      style: { cursor: "pointer" }, // Indica que es clickeable
    },
    [
      // Contenedor del icono
      React.createElement(
        "span",
        {
          className: "sidebar-item-icon", // Clase REQUERIDA para el icono
          key: "notes-nav-icon",
        },
        React.createElement(
          "span",
          { className: "material-icons" }, // Clase para iconos de Material Design
          "note" // El nombre del Material Icon
        )
      ),
      // Contenedor de la etiqueta (texto)
      React.createElement(
        "span",
        {
          className: "sidebar-item-label", // CLASE CRÍTICA para el colapso de texto
          key: "notes-nav-label",
        },
        "Notes" // El texto de tu elemento de navegación
      ),
    ]
  );
}

export default NotesNavigationItem;
