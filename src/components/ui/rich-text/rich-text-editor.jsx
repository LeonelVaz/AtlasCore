// rich-text-editor.jsx

import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Editor de texto enriquecido para plugins de Atlas
 * Proporciona herramientas básicas de formato (negrita, cursiva, listas, enlaces, etc.)
 */
function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Escribe aquí...', 
  height = '200px',
  toolbar = 'full',
  className = ''
}) {
  const [htmlContent, setHtmlContent] = useState(value || '');
  const editorRef = useRef(null);
  const toolbarRef = useRef(null);
  const isInitialized = useRef(false);
  
  // Solo sincronizar valor externo al inicializar o cuando cambia externamente
  useEffect(() => {
    if (editorRef.current && value !== undefined) {
      // Solo actualizar si es la primera vez o si el valor cambió desde fuera
      if (!isInitialized.current || (value !== htmlContent && value !== editorRef.current.innerHTML)) {
        editorRef.current.innerHTML = value;
        setHtmlContent(value);
        isInitialized.current = true;
      }
    }
  }, [value]); // Removemos htmlContent de las dependencias

  // Actualizar contenido cuando cambia el editor
  const handleInput = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setHtmlContent(newContent);
      if (onChange) {
        onChange(newContent);
      }
    }
  };

  // Ejecutar comando de formato
  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleInput();
  };

  // Crear enlaces
  const createLink = () => {
    const selection = window.getSelection();
    if (selection.rangeCount === 0 || selection.toString().trim() === '') {
      alert('Por favor, selecciona el texto que quieres convertir en enlace');
      return;
    }
    
    const url = prompt('Ingresa la URL del enlace:', 'https://');
    if (url) {
      execCommand('createLink', url);
    }
  };

  // Insertar imagen
  const insertImage = () => {
    const url = prompt('Ingresa la URL de la imagen:', 'https://');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  // Manejar eventos de teclado para atajos
  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
        default:
          break;
      }
    }
  };

  // Renderizar controles según el tipo de barra de herramientas
  const renderToolbar = () => {
    // Barra de herramientas mínima
    if (toolbar === 'minimal') {
      return (
        <div className="rich-editor-toolbar" ref={toolbarRef}>
          <button type="button" onClick={() => execCommand('bold')} title="Negrita (Ctrl+B)">
            <span className="material-icons">format_bold</span>
          </button>
          <button type="button" onClick={() => execCommand('italic')} title="Cursiva (Ctrl+I)">
            <span className="material-icons">format_italic</span>
          </button>
          <button type="button" onClick={() => execCommand('underline')} title="Subrayado (Ctrl+U)">
            <span className="material-icons">format_underlined</span>
          </button>
          <span className="toolbar-separator"></span>
          <button type="button" onClick={createLink} title="Insertar enlace">
            <span className="material-icons">link</span>
          </button>
        </div>
      );
    }

    // Barra de herramientas completa (por defecto)
    return (
      <div className="rich-editor-toolbar" ref={toolbarRef}>
        {/* Formato básico */}
        <div className="toolbar-group">
          <button type="button" onClick={() => execCommand('bold')} title="Negrita (Ctrl+B)">
            <span className="material-icons">format_bold</span>
          </button>
          <button type="button" onClick={() => execCommand('italic')} title="Cursiva (Ctrl+I)">
            <span className="material-icons">format_italic</span>
          </button>
          <button type="button" onClick={() => execCommand('underline')} title="Subrayado (Ctrl+U)">
            <span className="material-icons">format_underlined</span>
          </button>
        </div>

        <span className="toolbar-separator"></span>

        {/* Alineación */}
        <div className="toolbar-group">
          <button type="button" onClick={() => execCommand('justifyLeft')} title="Alinear a la izquierda">
            <span className="material-icons">format_align_left</span>
          </button>
          <button type="button" onClick={() => execCommand('justifyCenter')} title="Centrar">
            <span className="material-icons">format_align_center</span>
          </button>
          <button type="button" onClick={() => execCommand('justifyRight')} title="Alinear a la derecha">
            <span className="material-icons">format_align_right</span>
          </button>
        </div>

        <span className="toolbar-separator"></span>

        {/* Listas */}
        <div className="toolbar-group">
          <button type="button" onClick={() => execCommand('insertUnorderedList')} title="Lista con viñetas">
            <span className="material-icons">format_list_bulleted</span>
          </button>
          <button type="button" onClick={() => execCommand('insertOrderedList')} title="Lista numerada">
            <span className="material-icons">format_list_numbered</span>
          </button>
        </div>

        <span className="toolbar-separator"></span>

        {/* Enlace e imagen */}
        <div className="toolbar-group">
          <button type="button" onClick={createLink} title="Insertar enlace">
            <span className="material-icons">link</span>
          </button>
          <button type="button" onClick={insertImage} title="Insertar imagen">
            <span className="material-icons">image</span>
          </button>
        </div>

        <span className="toolbar-separator"></span>

        {/* Formato avanzado */}
        <div className="toolbar-group">
          <button type="button" onClick={() => execCommand('formatBlock', '<h2>')} title="Encabezado">
            <span className="material-icons">title</span>
          </button>
          <button type="button" onClick={() => execCommand('formatBlock', '<blockquote>')} title="Cita">
            <span className="material-icons">format_quote</span>
          </button>
          <button type="button" onClick={() => execCommand('removeFormat')} title="Eliminar formato">
            <span className="material-icons">format_clear</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`rich-text-editor ${className}`}>
      {renderToolbar()}
      <div 
        ref={editorRef}
        className="rich-editor-content"
        contentEditable="true"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        style={{ minHeight: height }}
        suppressContentEditableWarning={true}
        data-testid="rich-editor-content-div"
      >
        {!isInitialized.current && (htmlContent || placeholder)}
      </div>
    </div>
  );
}

RichTextEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  height: PropTypes.string,
  toolbar: PropTypes.oneOf(['full', 'minimal']),
  className: PropTypes.string
};

export default RichTextEditor;