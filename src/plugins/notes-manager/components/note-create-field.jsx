import React from 'react';

const NoteCreateField = (props) => {
  return (
    <div className="event-extension-section">
      <h3 className="event-extension-section-title">Notas</h3>
      <div className="event-extension-field">
        <textarea 
          placeholder="Añadir una nota para este evento..."
          rows={3}
          className="note-textarea"
          onChange={(e) => {
            // Esto está simplificado, la implementación completa usaría
            // el contexto de notas para almacenar este valor temporalmente
            if (props.onChange) {
              props.onChange({
                target: {
                  name: 'noteContent',
                  value: e.target.value
                }
              });
            }
          }}
        />
      </div>
    </div>
  );
};

export default NoteCreateField;