// video-scheduler/components/VideoSlotCell.jsx
import React from 'react';
import { STATUS_EMOJIS, VIDEO_MAIN_STATUS, VIDEO_STACKABLE_STATUS } from '../utils/constants.js';

function VideoSlotCell(props) {
  const { day, slotIndex, videoData, onNameChange, onStatusIconClick, onDescriptionChange } = props;
  const [currentName, setCurrentName] = React.useState(videoData.name || '');
  const [currentDescription, setCurrentDescription] = React.useState(videoData.description || '');

  React.useEffect(() => {
    setCurrentName(videoData.name || '');
    setCurrentDescription(videoData.description || '');
  }, [videoData.name, videoData.description]);

  const handleNameInputChange = (e) => {
    setCurrentName(e.target.value);
  };

  const handleNameInputBlur = () => {
    if (currentName !== videoData.name || (videoData.status === VIDEO_MAIN_STATUS.PENDING && currentName.trim() !== '')) {
      onNameChange(day, slotIndex, currentName.trim());
    }
  };

  const handleDescriptionInputChange = (e) => {
    setCurrentDescription(e.target.value);
  };

  const handleDescriptionInputBlur = () => {
    if (currentDescription !== videoData.description) {
      onDescriptionChange(day, slotIndex, currentDescription.trim());
    }
  };

  const handleNameInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.target.blur(); 
    } else if (e.key === 'Escape') {
      setCurrentName(videoData.name || ''); 
      e.target.blur();
    }
  };

  const handleDescriptionInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.target.blur(); 
    } else if (e.key === 'Escape') {
      setCurrentDescription(videoData.description || ''); 
      e.target.blur();
    }
  };
  
  const nameInputId = `video-name-${day}-${slotIndex}`;
  const descriptionInputId = `video-description-${day}-${slotIndex}`;
  const placeholderText = videoData.status === VIDEO_MAIN_STATUS.EMPTY ? 'Vacío (No programar)' : '';

  // Construir el texto de estado con sub-estados apilables
  const buildStatusDisplay = () => {
    let statusText = STATUS_EMOJIS[videoData.status] || '';
    
    // Añadir sub-estado normal si existe
    if (videoData.subStatus) {
      statusText += ` ${STATUS_EMOJIS[videoData.subStatus] || ''}`;
    }
    
    // Añadir sub-estados apilables si existen
    if (videoData.stackableStatuses && videoData.stackableStatuses.length > 0) {
      videoData.stackableStatuses.forEach(stackableStatus => {
        statusText += STATUS_EMOJIS[stackableStatus] || '';
      });
    }
    
    return statusText;
  };

  // EMPTY ya no está disabled - el usuario puede cambiarlo
  const isClickable = videoData.status !== VIDEO_MAIN_STATUS.PENDING;

  return React.createElement(
    'td',
    { className: 'video-scheduler-slot-cell' },
    React.createElement(
      'div',
      { className: `video-slot status-${videoData.status}` }, 
      [
        React.createElement('input', {
          key: nameInputId,
          id: nameInputId,
          type: 'text',
          className: 'video-name-input', 
          value: currentName,
          placeholder: placeholderText,
          onChange: handleNameInputChange,
          onBlur: handleNameInputBlur,
          onKeyDown: handleNameInputKeyDown,
          onClick: (e) => e.stopPropagation() 
        }),
        React.createElement(
          'div',
          { 
            key: `description-status-container-${day}-${slotIndex}`,
            className: 'description-status-container'
          },
          [
            React.createElement('input', {
              key: descriptionInputId,
              id: descriptionInputId,
              type: 'text',
              className: 'video-description-input', 
              value: currentDescription,
              placeholder: '',
              onChange: handleDescriptionInputChange,
              onBlur: handleDescriptionInputBlur,
              onKeyDown: handleDescriptionInputKeyDown,
              onClick: (e) => e.stopPropagation() 
            }),
            React.createElement(
              'div',
              { 
                key: `status-icons-${day}-${slotIndex}`,
                className: 'status-container', 
                onClick: isClickable 
                          ? (e) => { e.stopPropagation(); onStatusIconClick(day, slotIndex, e); }
                          : (e) => { e.stopPropagation(); }, 
                style: { 
                    cursor: isClickable ? 'pointer' : 'default',
                }
              },
              buildStatusDisplay()
            )
          ]
        )
      ]
    )
  );
}

export default VideoSlotCell;