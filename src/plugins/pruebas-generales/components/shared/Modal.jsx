/**
 * Modal.jsx
 * Componente de modal reutilizable
 */

/**
 * Componente Modal para diálogos y ventanas modales
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Manejador para cerrar el modal
 * @param {string} props.title - Título del modal
 * @param {React.ReactNode} props.children - Contenido del modal
 * @param {React.ReactNode} props.footer - Contenido del pie del modal (opcional)
 * @param {string} props.size - Tamaño del modal ('small', 'medium', 'large', 'fullscreen')
 * @param {boolean} props.closeOnBackdrop - Si el modal se cierra al hacer clic en el fondo
 * @param {boolean} props.closeOnEscape - Si el modal se cierra al presionar Escape
 * @param {string} props.className - Clases CSS adicionales
 * @param {React.ReactNode} props.headerContent - Contenido personalizado para el encabezado (opcional)
 */
function Modal(props) {
  const React = window.React;
  const { useEffect, useRef } = React;
  
  // Extraer propiedades
  const {
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'medium',
    closeOnBackdrop = true,
    closeOnEscape = true,
    className = '',
    headerContent
  } = props;
  
  // Referencia al contenedor del modal
  const modalRef = useRef(null);
  
  // Efecto para manejar tecla Escape
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEscape, onClose]);
  
  // Manejar clic en el fondo del modal
  const handleBackdropClick = (event) => {
    if (!closeOnBackdrop) return;
    
    // Solo cerrar si se hizo clic directamente en el fondo (no en el contenido)
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      onClose();
    }
  };
  
  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) {
    return null;
  }
  
  // Renderizar componente Modal
  return React.createElement(
    'div',
    {
      className: 'pg-modal-backdrop',
      onClick: handleBackdropClick
    },
    React.createElement(
      'div',
      {
        ref: modalRef,
        className: `pg-modal pg-modal-${size} ${className}`,
        // Evitar que los clics dentro del modal se propaguen al fondo
        onClick: (e) => e.stopPropagation()
      },
      [
        // Encabezado del modal
        React.createElement(
          'div',
          { key: 'header', className: 'pg-modal-header' },
          [
            // Contenido personalizado o título
            headerContent || React.createElement('h2', { key: 'title', className: 'pg-modal-title' }, title),
            
            // Botón de cerrar
            React.createElement(
              'button',
              {
                key: 'close',
                className: 'pg-modal-close',
                onClick: onClose,
                'aria-label': 'Cerrar'
              },
              React.createElement(
                'span',
                { className: 'material-icons' },
                'close'
              )
            )
          ]
        ),
        
        // Cuerpo del modal
        React.createElement(
          'div',
          { key: 'body', className: 'pg-modal-body' },
          children
        ),
        
        // Pie del modal (opcional)
        footer && React.createElement(
          'div',
          { key: 'footer', className: 'pg-modal-footer' },
          footer
        )
      ]
    )
  );
}

export default Modal;