import React from "react";

function NotesNavigationItem(props) {
  const handleClick = () => {
    // props.plugin.id es el id de tu plugin ("simple-notes")
    // "notes" es el pageId que has definido para tu página de notas.
    // Esto parece correcto y coincide con cómo registras tu página.
    if (props.onNavigate) {
      props.onNavigate(props.plugin.id, "notes");
    }
  };

  // Determinar si el ítem está activo.
  // Atlas no pasa explícitamente una prop 'active'. Si necesitas esta
  // funcionalidad, deberías implementarla basándote en el estado global
  // de la aplicación o gestionarlo internamente.
  // Por ahora, lo dejamos como false.
  const isActive = false;

  return React.createElement(
    "div",
    {
      // 1. Clase raíz REQUERIDA por Atlas para ítems de navegación principal
      className: `sidebar-item ${isActive ? "active" : ""}`,
      onClick: handleClick,
      tabIndex: 0, // Para accesibilidad
      title: "Notes", // Tooltip
      style: { cursor: "pointer" }, // Indica que es clickeable
    },
    [
      // 2. Contenedor del icono REQUERIDO
      React.createElement(
        "span",
        {
          className: "sidebar-item-icon", // Clase REQUERIDA para el icono
          key: "notes-nav-icon",
        },
        // Para usar Material Icons (si "note" es un nombre de icono válido)
        React.createElement(
          "span",
          { className: "material-icons" }, // Clase para iconos de Material Design
          "note" // El nombre del Material Icon (o un emoji si prefieres)
        )
      ),
      // 3. Contenedor de la etiqueta (texto) REQUERIDO
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
