import React from "react";
import PropTypes from "prop-types";

/**
 * Componente de botón personalizado
 *
 * @param {Object} props - Propiedades del componente
 * @param {string} [props.variant='primary'] - Variante del botón (primary, secondary, danger, text)
 * @param {string} [props.size='medium'] - Tamaño del botón (small, medium, large)
 * @param {string} [props.className] - Clases adicionales
 * @param {boolean} [props.disabled=false] - Si el botón está deshabilitado
 * @param {boolean} [props.isActive=false] - Si el botón está activo (para botones toggle)
 * @param {Function} props.onClick - Función al hacer clic
 * @param {React.ReactNode} props.children - Contenido del botón
 */
function Button({
  variant = "primary",
  size = "medium",
  className = "",
  disabled = false,
  isActive = false,
  onClick,
  children,
  ...rest
}) {
  // Determinar clases según las props
  const getButtonClasses = () => {
    const baseClass = "ui-button";
    const variantClass = `ui-button-${variant}`;
    const sizeClass = `ui-button-${size}`;
    const activeClass = isActive ? "ui-button-active" : "";

    return `${baseClass} ${variantClass} ${sizeClass} ${activeClass} ${className}`.trim();
  };

  return (
    <button
      className={getButtonClasses()}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}

Button.propTypes = {
  variant: PropTypes.oneOf(["primary", "secondary", "danger", "text"]),
  size: PropTypes.oneOf(["small", "medium", "large"]),
  className: PropTypes.string,
  disabled: PropTypes.bool,
  isActive: PropTypes.bool,
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
};

export default Button;
