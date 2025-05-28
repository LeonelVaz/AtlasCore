import React from "react";

function NotesNavigationItem(props) {
  const handleClick = () => {
    if (props.onNavigate) {
      props.onNavigate(props.plugin.id, "notes");
    }
  };

  return React.createElement(
    "div",
    {
      className: "notes-navigation-item",
      onClick: handleClick,
      tabIndex: 0, // Para accesibilidad
    },
    [
      React.createElement(
        "span",
        {
          className: "material-icons notes-navigation-item-icon",
          key: "icon",
        },
        "note"
      ),
      React.createElement(
        "span",
        {
          key: "label",
          className: "notes-navigation-item-label",
        },
        "Notes"
      ),
    ]
  );
}

export default NotesNavigationItem;
