/**
 * Button.jsx
 * Componente de botón reutilizable
 */

/**
 * Componente Button para acciones interactivas
 * @param {Object} props - Propiedades del componente
 * @param {string} props.variant - Variante del botón ('primary', 'secondary', 'danger', etc.)
 * @param {string} props.size - Tamaño del botón ('small', 'medium', 'large')
 * @param {boolean} props.disabled - Si el botón está deshabilitado
 * @param {Function} props.onClick - Manejador de clic
 * @param {string} props.className - Clases CSS adicionales
 * @param {string} props.icon - Nombre del icono de Material (opcional)
 * @param {React.ReactNode} props.children - Contenido del botón
 * @param {string} props.type - Tipo de botón HTML ('button', 'submit', 'reset')
 */
function Button(props) {
  const React = window.React;
  
  // Extraer propiedades
  const {
    variant = 'default',
    size = 'medium',
    disabled = false,
    onClick,
    className = '',
    icon,
    children,
    type = 'button',
    ...otherProps
  } = props;
  
  // Generar clases según las propiedades
  const buttonClasses = [
    'pg-button',
    `pg-button-${variant}`,
    `pg-button-${size}`,
    disabled ? 'pg-button-disabled' : '',
    className
  ].filter(Boolean).join(' ');
  
  // Renderizar contenido del botón
  const renderContent = () => {
    // Si solo hay icono, renderizar solo el icono
    if (icon && !children) {
      return React.createElement(
        'span',
        { className: 'material-icons' },
        icon
      );
    }
    
    // Si hay icono y texto, renderizar ambos
    if (icon) {
      return [
        React.createElement(
          'span',
          { key: 'icon', className: 'material-icons pg-button-icon' },
          icon
        ),
        React.createElement(
          'span',
          { key: 'text', className: 'pg-button-text' },
          children
        )
      ];
    }
    
    // Solo texto
    return children;
  };
  
  // Renderizar componente Button
  return React.createElement(
    'button',
    {
      className: buttonClasses,
      onClick: disabled ? undefined : onClick,
      disabled: disabled,
      type: type,
      ...otherProps
    },
    renderContent()
  );
}

export default Button;