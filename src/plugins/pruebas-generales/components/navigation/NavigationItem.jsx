/**
 * NavigationItem.jsx
 * Ítem de navegación para el menú principal
 */

/**
 * Componente para el ítem de navegación
 */
function NavigationItem(props) {
  // Importar React explícitamente en lugar de usar require('react')
  const React = require('react');
  
  // Extraer propiedades necesarias
  const { pluginId, onNavigate } = props;
  
  /**
   * Manejador de clic para navegar a la página principal del plugin
   */
  const handleClick = () => {
    // Navegar a la página principal del plugin cuando se hace clic
    onNavigate(pluginId, 'main-page');
  };
  
  // Renderizar el ítem de navegación
  return React.createElement(
    'div',
    {
      className: 'pg-nav-item',
      onClick: handleClick,
      title: 'Explorar demo de plugins para Atlas'
    },
    [
      // Icono de material design
      React.createElement(
        'span',
        { 
          key: 'icon',
          className: 'material-icons pg-nav-icon'
        },
        'science' // Icono de laboratorio/ciencia para representar pruebas
      ),
      // Texto del ítem
      React.createElement(
        'span',
        { 
          key: 'label',
          className: 'pg-nav-label'
        },
        'Pruebas Generales'
      )
    ]
  );
}

export default NavigationItem;