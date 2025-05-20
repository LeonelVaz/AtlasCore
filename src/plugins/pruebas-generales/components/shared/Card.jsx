/**
 * Card.jsx
 * Componente de tarjeta reutilizable
 */

/**
 * Componente Card para mostrar información en una tarjeta
 * @param {Object} props - Propiedades del componente
 * @param {string} props.title - Título de la tarjeta (opcional)
 * @param {React.ReactNode} props.children - Contenido de la tarjeta
 * @param {Function} props.onClick - Manejador de clic (opcional)
 * @param {string} props.className - Clases CSS adicionales (opcional)
 * @param {string} props.headerClassName - Clases CSS adicionales para el encabezado (opcional)
 * @param {string} props.bodyClassName - Clases CSS adicionales para el cuerpo (opcional)
 * @param {string} props.footerClassName - Clases CSS adicionales para el pie (opcional)
 * @param {React.ReactNode} props.header - Contenido de encabezado personalizado (opcional)
 * @param {React.ReactNode} props.footer - Contenido de pie personalizado (opcional)
 */
function Card(props) {
  const React = window.React;
  
  // Extraer propiedades
  const {
    title,
    children,
    onClick,
    className = '',
    headerClassName = '',
    bodyClassName = '',
    footerClassName = '',
    header,
    footer
  } = props;
  
  // Función para renderizar el encabezado
  const renderHeader = () => {
    // Si hay encabezado personalizado, usarlo
    if (header) {
      return React.createElement(
        'div',
        { className: `pg-card-header ${headerClassName}` },
        header
      );
    }
    
    // Si hay título, renderizar encabezado con título
    if (title) {
      return React.createElement(
        'div',
        { className: `pg-card-header ${headerClassName}` },
        React.createElement('h3', { className: 'pg-card-title' }, title)
      );
    }
    
    // Sin encabezado
    return null;
  };
  
  // Renderizar componente Card
  return React.createElement(
    'div',
    {
      className: `pg-card ${className}`,
      onClick: onClick,
      style: { cursor: onClick ? 'pointer' : 'default' }
    },
    [
      // Encabezado (si existe)
      renderHeader(),
      
      // Cuerpo
      React.createElement(
        'div',
        { key: 'body', className: `pg-card-body ${bodyClassName}` },
        children
      ),
      
      // Pie (si existe)
      footer && React.createElement(
        'div',
        { key: 'footer', className: `pg-card-footer ${footerClassName}` },
        footer
      )
    ]
  );
}

export default Card;