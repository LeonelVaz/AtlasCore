import React, { useState, useRef, useContext } from 'react';
import { NotesContext } from '../contexts/notes-context';

/**
 * Campo para añadir o editar notas en el formulario de creación de eventos
 */
const NoteCreateField = (props) => {
  const { t, createNote } = useContext(NotesContext);
  const [noteContent, setNoteContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef(null);
  
  // Manejar cambio en el contenido de la nota
  const handleChange = (e) => {
    setNoteContent(e.target.value);
    
    // También actualizar el formulario principal de eventos
    if (props.onChange) {
      props.onChange({
        target: {
          name: 'noteContent',
          value: e.target.value
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
  React.useEffect(() => {
    autoResize();
  }, [noteContent]);
  
  return (
    <div className="event-extension-section">
      <h3 className="event-extension-section-title">{t('notes.sectionTitle')}</h3>
      <div className="event-extension-field">
        <textarea 
          ref={textareaRef}
          placeholder={t('notes.createPlaceholder')}
          rows={isExpanded ? 4 : 3}
          className="note-textarea"
          value={noteContent}
          onChange={handleChange}
          onFocus={handleFocus}
        />
        
        {isExpanded && noteContent.trim() && (
          <div className="note-create-info">
            <span className="note-create-message">
              {t('notes.willBeCreatedMessage')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteCreateField;