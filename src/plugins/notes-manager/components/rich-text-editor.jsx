import React, { useState, useRef, useEffect } from 'react';
import { sanitizeHtml } from '../utils/notes-utils';

/**
 * Editor de texto enriquecido basado en contenteditable
 * Proporciona una interfaz para crear contenido con formato para las notas
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.value - Contenido HTML inicial
 * @param {Function} props.onChange - Función para manejar cambios
 * @param {string} props.placeholder - Texto de placeholder cuando está vacío
 * @param {string} props.className - Clases adicionales
 * @param {string} props.height - Altura del editor
 */
const RichTextEditor = ({ 
  value = '', 
  onChange, 
  placeholder = 'Escribe aquí...',
  className = '',
  height = '200px'
}) => {
  const [html, setHtml] = useState('');
  const editorRef = useRef(null);
  const toolbarRef = useRef(null);
  
  // Inicializar el editor con el valor proporcionado
  useEffect(() => {
    if (value !== html) {
      setHtml(value);
      
      // Actualizar directamente el contenido del editor si ya está montado
      if (editorRef.current) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  // Manejar cambios en el editor
  const handleChange = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      // Sanitizar el contenido para prevenir ataques XSS
      const sanitized = sanitizeHtml(newContent);
      
      // Solo actualizar si hay cambios reales
      if (sanitized !== html) {
        setHtml(sanitized);
        
        // Notificar cambios al componente padre
        if (onChange) {
          onChange(sanitized);
        }
      }
    }
  };

  // Ejecutar comandos de edición
  const executeCommand = (command, value = null) => {
    // Asegurarse de que el editor tiene el foco antes de ejecutar comandos
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.focus();
    }
    
    document.execCommand(command, false, value);
    // Pequeño retraso para asegurar que el comando se ha ejecutado
    setTimeout(() => {
      handleChange();
      // Mantener el foco en el editor
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }, 10);
  };

  // Comandos para los botones de la barra de herramientas
  const formatBold = () => executeCommand('bold');
  const formatItalic = () => executeCommand('italic');
  const formatUnderline = () => executeCommand('underline');
  const formatStrikeThrough = () => executeCommand('strikeThrough');
  const formatOrderedList = () => executeCommand('insertOrderedList');
  const formatUnorderedList = () => executeCommand('insertUnorderedList');
  const formatLink = () => {
    const url = prompt('Introduce la URL del enlace:');
    if (url) {
      executeCommand('createLink', url);
    }
  };
  const formatUnlink = () => executeCommand('unlink');
  const formatClear = () => executeCommand('removeFormat');

  // Manejar pegado de texto para preservar solo texto plano
  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    handleChange();
  };

  // Manejar teclas especiales
  const handleKeyDown = (e) => {
    // Implementar comportamiento especial para algunas teclas
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
      handleChange();
    }
  };

  // Capturar eventos de input para asegurar que se registran todos los cambios
  const handleInput = () => {
    // Usar setTimeout para asegurar que el evento se procesa después de que el DOM se actualiza
    setTimeout(handleChange, 0);
  };

  return (
    <div className="rich-text-editor">
      <div className="rich-text-toolbar" ref={toolbarRef}>
        <button 
          type="button" 
          className="toolbar-button" 
          onClick={formatBold} 
          title="Negrita (Ctrl+B)"
        >
          <span className="material-icons">format_bold</span>
        </button>
        <button 
          type="button" 
          className="toolbar-button" 
          onClick={formatItalic} 
          title="Cursiva (Ctrl+I)"
        >
          <span className="material-icons">format_italic</span>
        </button>
        <button 
          type="button" 
          className="toolbar-button" 
          onClick={formatUnderline} 
          title="Subrayado (Ctrl+U)"
        >
          <span className="material-icons">format_underlined</span>
        </button>
        <button 
          type="button" 
          className="toolbar-button" 
          onClick={formatStrikeThrough} 
          title="Tachado"
        >
          <span className="material-icons">strikethrough_s</span>
        </button>
        <span className="toolbar-divider"></span>
        <button 
          type="button" 
          className="toolbar-button" 
          onClick={formatOrderedList} 
          title="Lista numerada"
        >
          <span className="material-icons">format_list_numbered</span>
        </button>
        <button 
          type="button" 
          className="toolbar-button" 
          onClick={formatUnorderedList} 
          title="Lista con viñetas"
        >
          <span className="material-icons">format_list_bulleted</span>
        </button>
        <span className="toolbar-divider"></span>
        <button 
          type="button" 
          className="toolbar-button" 
          onClick={formatLink} 
          title="Insertar enlace"
        >
          <span className="material-icons">insert_link</span>
        </button>
        <button 
          type="button" 
          className="toolbar-button" 
          onClick={formatUnlink} 
          title="Quitar enlace"
        >
          <span className="material-icons">link_off</span>
        </button>
        <span className="toolbar-divider"></span>
        <button 
          type="button" 
          className="toolbar-button" 
          onClick={formatClear} 
          title="Limpiar formato"
        >
          <span className="material-icons">format_clear</span>
        </button>
      </div>
      <div
        ref={editorRef}
        className={`rich-text-content ${className}`}
        contentEditable="true"
        dangerouslySetInnerHTML={{ __html: html }}
        onInput={handleInput}
        onBlur={handleChange}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        style={{ minHeight: height }}
        placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
    </div>
  );
};

export default RichTextEditor;