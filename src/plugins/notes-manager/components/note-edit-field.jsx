import React from 'react';

const NoteEditField = (props) => {
  return (
    <div className="event-extension-section">
      <h3 className="event-extension-section-title">Notas</h3>
      <div className="event-extension-field">
        <textarea 
          placeholder="Añadir o editar nota para este evento..."
          rows={3}
          className="note-textarea"
          value={props.event?.noteContent || ''}
          onChange={(e) => {
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

export default NoteEditField;