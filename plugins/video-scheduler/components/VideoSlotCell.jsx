// video-scheduler/components/VideoSlotCell.jsx
import React from 'react';
import { STATUS_EMOJIS, VIDEO_MAIN_STATUS } from '../utils/constants.js';

function VideoSlotCell(props) {
  const { day, slotIndex, videoData, onNameChange, onStatusIconClick } = props;
  const [currentName, setCurrentName] = React.useState(videoData.name || '');

  React.useEffect(() => {
    setCurrentName(videoData.name || '');
  }, [videoData.name]);

  const handleNameInputChange = (e) => {
    setCurrentName(e.target.value);
  };

  const handleNameInputBlur = () => {
    if (currentName !== videoData.name || (videoData.status === VIDEO_MAIN_STATUS.PENDING && currentName.trim() !== '')) {
      onNameChange(day, slotIndex, currentName.trim());
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
  
  const nameInputId = `video-name-${day}-${slotIndex}`;
  const placeholderText = videoData.status === VIDEO_MAIN_STATUS.PENDING ? 'Pend...' : (videoData.status === VIDEO_MAIN_STATUS.EMPTY ? 'Vacío (No programar)' : 'Nombre del Video...');

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
          disabled: videoData.status === VIDEO_MAIN_STATUS.EMPTY,
          onClick: (e) => e.stopPropagation() 
        }),
        React.createElement(
          'div',
          { 
            key: `status-icons-${day}-${slotIndex}`,
            className: 'status-container', 
            onClick: (videoData.status !== VIDEO_MAIN_STATUS.EMPTY && videoData.status !== VIDEO_MAIN_STATUS.PENDING) 
                      ? (e) => { e.stopPropagation(); onStatusIconClick(day, slotIndex, e); }
                      : (e) => { e.stopPropagation(); }, 
            style: { 
                cursor: (videoData.status !== VIDEO_MAIN_STATUS.EMPTY && videoData.status !== VIDEO_MAIN_STATUS.PENDING) ? 'pointer' : 'default',
            }
          },
          [
            STATUS_EMOJIS[videoData.status] || '',
            videoData.subStatus ? ` ${STATUS_EMOJIS[videoData.subStatus] || ''}` : ''
          ]
        )
      ]
    )
  );
}

export default VideoSlotCell;