import React, { useState, useRef, useEffect } from 'react';
import { sanitizeHtml } from '../utils/notes-utils';

/**
 * Editor de texto enriquecido basado en contenteditable
 * Un editor simple pero funcional para el plugin de notas
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
  
  // Inicializar valor
  useEffect(() => {
    setHtml(value);
  }, [value]);

  // Manejar cambios en el editor
  const handleChange = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      // Sanitizar contenido para prevenir XSS
      const sanitized = sanitizeHtml(newContent);
      setHtml(sanitized);
      
      if (onChange) {
        onChange(sanitized);
      }
    }
  };

  // Aplicar comandos de edición
  const executeCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    handleChange();
    // Enfocar el editor después de ejecutar un comando
    editorRef.current.focus();
  };

  // Comandos para las acciones de formato
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

  // Manejar pegar texto sin formato
  const handlePaste = (e) => {
    e.preventDefault();
    // Obtener texto sin formato del portapapeles
    const text = e.clipboardData.getData('text/plain');
    // Insertar como texto plano
    document.execCommand('insertText', false, text);
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
        onInput={handleChange}
        onBlur={handleChange}
        onPaste={handlePaste}
        style={{ minHeight: height }}
        placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
    </div>
  );
};

export default RichTextEditor;