import React, { useState, useEffect, useRef } from 'react';
import { sanitizeHtml } from '../utils/notes-utils';

/**
 * Componente para crear notas desde el formulario de eventos
 */
const NoteCreateField = ({ event, onChange }) => {
  // Obtener traducciones
  const getTranslation = (key) => {
    const translations = {
      'notes.sectionTitle': 'Notas',
      'notes.createPlaceholder': 'Añadir una nota para este evento...',
      'notes.willBeCreatedMessage': 'Se creará una nota al guardar el evento',
      'notes.attachNote': 'Adjuntar nota',
      'notes.editorTitle': 'Contenido de la nota'
    };
    return translations[key] || key;
  };

  const [noteContent, setNoteContent] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [useRichEditor, setUseRichEditor] = useState(false);
  const textareaRef = useRef(null);
  
  // Inicializar con datos del evento si existen
  useEffect(() => {
    if (event && event.noteContent) {
      setNoteContent(event.noteContent);
      setIsExpanded(true);
    }
    
    if (event && event.noteTitle) {
      setNoteTitle(event.noteTitle);
    } else if (event && event.title) {
      // Usar título del evento como sugerencia
      setNoteTitle(`Notas: ${event.title}`);
    }
  }, [event]);
  
  // Manejar cambio en el contenido de la nota
  const handleContentChange = (e) => {
    let content;
    
    if (typeof e === 'string') {
      // Viene del editor rico
      content = e;
    } else {
      // Viene del textarea
      content = e.target.value;
    }
    
    setNoteContent(content);
    
    // También actualizar el formulario principal de eventos
    if (onChange) {
      onChange({
        target: {
          name: 'noteContent',
          value: content
        }
      });
      
      // Actualizar también el título
      onChange({
        target: {
          name: 'noteTitle',
          value: noteTitle
        }
      });
    }
  };
  
  // Manejar cambio en el título
  const handleTitleChange = (e) => {
    const title = e.target.value;
    setNoteTitle(title);
    
    // Actualizar el formulario principal
    if (onChange) {
      onChange({
        target: {
          name: 'noteTitle',
          value: title
        }
      });
    }
  };
  
  // Manejar focus para expandir el campo
  const handleFocus = () => {
    setIsExpanded(true);
  };
  
  // Auto-expandir altura del textarea
  const autoResize = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = (textareaRef.current.scrollHeight) + 'px';
    }
  };
  
  // Llamar a autoResize cuando cambia el contenido
  useEffect(() => {
    if (!useRichEditor) {
      autoResize();
    }
  }, [noteContent, useRichEditor]);
  
  // Alternar entre editor rico y básico
  const toggleEditor = () => {
    setUseRichEditor(!useRichEditor);
  };
  
  // Renderizar editor básico o rico según la opción
  const renderEditor = () => {
    if (useRichEditor) {
      try {
        // Importar dinámicamente el RichTextEditor
        const RichTextEditor = React.lazy(() => import('./rich-text-editor'));
        
        return (
          <React.Suspense fallback={<div>Cargando editor...</div>}>
            <RichTextEditor
              value={noteContent}
              onChange={handleContentChange}
              placeholder={getTranslation('notes.createPlaceholder')}
              height="150px"
            />
          </React.Suspense>
        );
      } catch (e) {
        console.error('Error al cargar editor rico:', e);
        setUseRichEditor(false);
        // Fallback al editor básico
        return (
          <textarea 
            ref={textareaRef}
            placeholder={getTranslation('notes.createPlaceholder')}
            rows={4}
            className="note-textarea"
            value={noteContent}
            onChange={handleContentChange}
            onFocus={handleFocus}
          />
        );
      }
    } else {
      return (
        <textarea 
          ref={textareaRef}
          placeholder={getTranslation('notes.createPlaceholder')}
          rows={isExpanded ? 4 : 3}
          className="note-textarea"
          value={noteContent}
          onChange={handleContentChange}
          onFocus={handleFocus}
        />
      );
    }
  };
  
  return (
    <div className="event-extension-section">
      <h3 className="event-extension-section-title">{getTranslation('notes.sectionTitle')}</h3>
      <div className="event-extension-field">
        <div className="note-create-header">
          <label className="note-create-label">{getTranslation('notes.attachNote')}:</label>
          <div className="note-create-tools">
            <button 
              type="button" 
              className={`editor-toggle-button ${useRichEditor ? 'active' : ''}`}
              onClick={toggleEditor}
              title={useRichEditor ? "Usar editor simple" : "Usar editor rico"}
            >
              <span className="material-icons">
                {useRichEditor ? 'text_format' : 'wysiwyg'}
              </span>
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="note-title-field">
            <input
              type="text"
              placeholder="Título de la nota"
              value={noteTitle}
              onChange={handleTitleChange}
              className="note-title-input"
            />
          </div>
        )}
        
        <div className="note-content-field">
          {renderEditor()}
        </div>
        
        {isExpanded && noteContent.trim() && (
          <div className="note-create-info">
            <span className="note-create-message">
              {getTranslation('notes.willBeCreatedMessage')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteCreateField;