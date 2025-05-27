// video-scheduler/components/VideoSlotCell.jsx
import React from 'react';
import { STATUS_EMOJIS, VIDEO_MAIN_STATUS } from '../utils/constants.js';

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

  const placeholderText = currentName.trim() === '' ? '...' : '';

  const buildStatusDisplay = () => {
    const emojiElements = [];

    // 1. Sub-estados Apilables (primero en el array, aparecerán más a la izquierda)
    // Se añaden en el orden en que están en el array, pero se pueden invertir si es necesario
    if (videoData.stackableStatuses && videoData.stackableStatuses.length > 0) {
      videoData.stackableStatuses.forEach((stackableStatus, index) => {
        if (STATUS_EMOJIS[stackableStatus]) {
          emojiElements.push(
            React.createElement('span', { 
              key: `stackable-${index}`, 
              className: 'status-emoji stackable-status-emoji' // Clase para posible estilo
            }, STATUS_EMOJIS[stackableStatus])
          );
        }
      });
    }

    // 2. Sub-estado Normal (después de los apilables)
    if (videoData.subStatus && STATUS_EMOJIS[videoData.subStatus]) {
      emojiElements.push(
        React.createElement('span', { 
          key: 'sub-status', 
          className: 'status-emoji sub-status-emoji' // Clase para posible estilo
        }, STATUS_EMOJIS[videoData.subStatus])
      );
    }

    // 3. Estado Principal (último en el array, aparecerá más a la derecha)
    if (videoData.status && STATUS_EMOJIS[videoData.status]) {
      emojiElements.push(
        React.createElement('span', { 
          key: 'main-status', 
          className: 'status-emoji main-status-emoji' // Clase para posible estilo
        }, STATUS_EMOJIS[videoData.status])
      );
    } else {
      // Fallback si no hay estado principal (debería mostrar PENDING por defecto)
       emojiElements.push(
        React.createElement('span', { 
          key: 'main-status-pending-fallback', 
          className: 'status-emoji main-status-emoji'
        }, STATUS_EMOJIS[VIDEO_MAIN_STATUS.PENDING])
      );
    }
    
    // Si no hay emojis (ej. solo era un PENDING que no tenía emoji explícito antes),
    // asegurar que se muestre el PENDING.
    if (emojiElements.length === 0) {
       emojiElements.push(
        React.createElement('span', { 
          key: 'main-status-empty-fallback', 
          className: 'status-emoji main-status-emoji'
        }, STATUS_EMOJIS[VIDEO_MAIN_STATUS.PENDING])
      );
    }

    return emojiElements; // Devolvemos el array de elementos
  };

  const isClickable = true;

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
                className: 'status-container', // La clase 'status-container' ya usa flex
                onClick: isClickable
                          ? (e) => { e.stopPropagation(); onStatusIconClick(day, slotIndex, e); }
                          : (e) => { e.stopPropagation(); },
                style: {
                    cursor: isClickable ? 'pointer' : 'default',
                }
              },
              // buildStatusDisplay() ahora devuelve un array de elementos,
              // que React renderizará en orden.
              buildStatusDisplay()
            )
          ]
        )
      ]
    )
  );
}

export default VideoSlotCell;