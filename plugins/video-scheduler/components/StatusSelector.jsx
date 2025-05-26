// video-scheduler/components/StatusSelector.jsx
import React from 'react';
import { VIDEO_MAIN_STATUS, VIDEO_SUB_STATUS, STATUS_EMOJIS, VALID_SUB_STATUSES_FOR_MAIN } from '../utils/constants.js';

function StatusSelector(props) {
  const { currentMainStatus, currentSubStatus, onStatusChange, onCancel, styleProps } = props;

  const handleMainStatusSelect = (newMainStatus) => {
    const validSubStatusesForNewMain = VALID_SUB_STATUSES_FOR_MAIN[newMainStatus] || [];
    let newSub = null;
    if (newMainStatus === currentMainStatus && validSubStatusesForNewMain.includes(currentSubStatus)) {
      newSub = currentSubStatus;
    }
    onStatusChange(newMainStatus, newSub);
  };

  const handleSubStatusSelect = (subStatus) => {
    const validSubStatuses = VALID_SUB_STATUSES_FOR_MAIN[currentMainStatus] || [];
    if (validSubStatuses.includes(subStatus)) {
      const newSubStatus = currentSubStatus === subStatus ? null : subStatus;
      onStatusChange(currentMainStatus, newSubStatus);
    } else {
      console.warn(`Sub-estado ${subStatus} no es válido para el estado principal ${currentMainStatus}`);
    }
  };

  const availableMainStatuses = Object.values(VIDEO_MAIN_STATUS);
  const availableSubStatuses = VALID_SUB_STATUSES_FOR_MAIN[currentMainStatus] || [];

  return React.createElement(
    'div',
    {
      className: 'status-selector-popup', 
      style: styleProps 
    },
    [
      React.createElement('h4', { key: 'ss-title' }, 'Cambiar Estado'),
      React.createElement('strong', {key: 'main-label', className: 'status-selector-label'}, 'Estado Principal:'),
      React.createElement(
        'div',
        { key: 'ss-main-statuses', className: 'status-options-group' },
        availableMainStatuses.map(statusValue => 
          React.createElement(
            'button',
            {
              key: statusValue,
              onClick: () => handleMainStatusSelect(statusValue),
              className: `status-option-button ${currentMainStatus === statusValue ? 'active' : ''}`
            },
            `${STATUS_EMOJIS[statusValue] || '?'} ${statusValue.charAt(0).toUpperCase() + statusValue.slice(1)}`
          )
        )
      ),
      availableSubStatuses.length > 0 && React.createElement(React.Fragment, {key: 'sub-status-section'}, [
        React.createElement('strong', {key: 'sub-label', className: 'status-selector-label sub-label'}, 'Sub-Estado:'),
        React.createElement(
            'div',
            { key: 'ss-sub-statuses', className: 'status-options-group' },
            availableSubStatuses.map(subStatusValue => 
              React.createElement(
                'button',
                {
                  key: subStatusValue,
                  onClick: () => handleSubStatusSelect(subStatusValue),
                  className: `status-option-button ${currentSubStatus === subStatusValue ? 'active' : ''}`
                },
                `${STATUS_EMOJIS[subStatusValue] || '?'} ${subStatusValue.charAt(0).toUpperCase() + subStatusValue.slice(1)}`
              )
            )
          )
      ]),
      React.createElement(
        'button',
        { key: 'ss-cancel', onClick: onCancel, className: 'status-selector-cancel-button' },
        'Cerrar'
      )
    ]
  );
}

export default StatusSelector;