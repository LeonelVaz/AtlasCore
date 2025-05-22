// src/components/ui/dialog-system/CustomDialog.jsx
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './CustomDialog.css';

/**
 * Componente de diálogo personalizado que reemplaza alert(), confirm() y prompt()
 * Funciona tanto en web como en Electron sin problemas de foco
 */
const CustomDialog = ({ 
  isOpen, 
  type, 
  title, 
  message, 
  defaultValue,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  onClose
}) => {
  const [inputValue, setInputValue] = useState(defaultValue || '');
  const [isVisible, setIsVisible] = useState(false);
  const inputRef = useRef(null);
  const dialogRef = useRef(null);

  // Efecto para manejar la animación de entrada
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Enfocar input si es un prompt
      if (type === 'prompt' && inputRef.current) {
        setTimeout(() => {
          inputRef.current.focus();
          inputRef.current.select();
        }, 100);
      }
    } else {
      setIsVisible(false);
    }
  }, [isOpen, type]);

  // Manejar teclas de escape y enter
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        handleCancel();
      } else if (e.key === 'Enter') {
        if (type === 'prompt') {
          // Solo confirmar si no estamos en un textarea
          if (e.target.tagName !== 'TEXTAREA') {
            handleConfirm();
          }
        } else {
          handleConfirm();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, type, inputValue]);

  // Prevenir scroll del body cuando el diálogo está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleConfirm = () => {
    if (type === 'prompt') {
      onConfirm(inputValue);
    } else {
      onConfirm(true);
    }
  };

  const handleCancel = () => {
    if (type === 'alert') {
      onClose();
    } else {
      onCancel(false);
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (type === 'alert') {
        handleConfirm();
      } else {
        handleCancel();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`custom-dialog-overlay ${isVisible ? 'visible' : ''}`}
      onClick={handleBackdropClick}
    >
      <div 
        ref={dialogRef}
        className={`custom-dialog custom-dialog-${type}`}
        role="dialog"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
        aria-modal="true"
      >
        {/* Encabezado */}
        {title && (
          <div className="custom-dialog-header">
            <h3 id="dialog-title" className="custom-dialog-title">
              {title}
            </h3>
          </div>
        )}

        {/* Contenido */}
        <div className="custom-dialog-body">
          {message && (
            <p id="dialog-message" className="custom-dialog-message">
              {message}
            </p>
          )}

          {/* Input para prompt */}
          {type === 'prompt' && (
            <div className="custom-dialog-input-container">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                className="custom-dialog-input"
                placeholder="Ingresa un valor..."
              />
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="custom-dialog-footer">
          {type === 'alert' ? (
            <button
              className="custom-dialog-button custom-dialog-button-primary"
              onClick={handleConfirm}
              autoFocus
            >
              {confirmText}
            </button>
          ) : (
            <>
              <button
                className="custom-dialog-button custom-dialog-button-secondary"
                onClick={handleCancel}
              >
                {cancelText}
              </button>
              <button
                className="custom-dialog-button custom-dialog-button-primary"
                onClick={handleConfirm}
                autoFocus={type !== 'prompt'}
              >
                {confirmText}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

CustomDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  type: PropTypes.oneOf(['alert', 'confirm', 'prompt']).isRequired,
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  defaultValue: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  onClose: PropTypes.func
};

export default CustomDialog;