import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Button from './button';

/**
 * Componente de diálogo modal
 * 
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isOpen - Si el diálogo está abierto
 * @param {Function} props.onClose - Función para cerrar el diálogo
 * @param {string} [props.title] - Título del diálogo
 * @param {React.ReactNode} props.children - Contenido del diálogo
 * @param {Function} [props.onConfirm] - Función para confirmar acción (si existe, muestra botón)
 * @param {string} [props.confirmText='Confirmar'] - Texto del botón de confirmación
 * @param {string} [props.cancelText='Cancelar'] - Texto del botón de cancelar
 * @param {string} [props.className] - Clases adicionales
 */
function Dialog({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  className = '',
  ...rest
}) {
  const dialogRef = useRef(null);

  // Manejar clics fuera del diálogo
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Manejar tecla Escape
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // No renderizar nada si no está abierto
  if (!isOpen) return null;

  return (
    <div className="ui-dialog-overlay" data-testid="dialog-overlay">
      <div 
        ref={dialogRef}
        className={`ui-dialog ${className}`}
        {...rest}
      >
        {title && (
          <div className="ui-dialog-header">
            <h3 className="ui-dialog-title">{title}</h3>
            <button 
              className="ui-dialog-close" 
              onClick={onClose}
              aria-label="Cerrar"
            >
              &times;
            </button>
          </div>
        )}
        
        <div className="ui-dialog-body">
          {children}
        </div>
        
        <div className="ui-dialog-footer">
          {onConfirm && (
            <Button 
              variant="primary" 
              onClick={onConfirm}
            >
              {confirmText}
            </Button>
          )}
          
          <Button 
            variant="secondary" 
            onClick={onClose}
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </div>
  );
}

Dialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  onConfirm: PropTypes.func,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  className: PropTypes.string
};

export default Dialog;