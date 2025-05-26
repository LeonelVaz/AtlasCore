// video-scheduler/components/StatusSelector.jsx
import React from 'react';
// Corregir el nombre de la constante importada si estaba mal, aunque el error sugiere que se usa mal DENTRO del componente.
// La importación correcta es:
import { VIDEO_MAIN_STATUS, VIDEO_SUB_STATUS, STATUS_EMOJIS, VALID_SUB_STATUSES_FOR_MAIN, SUB_STATUS_MAIN_MAP } from '../utils/constants.js';
// Asegurémonos que SUB_STATUS_MAIN_MAP también se importe si se usa (aunque en el código actual de handleSubStatusSelect no se usa, podría ser útil después)

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
    // --- CORRECCIÓN AQUÍ ---
    // Usar el nombre correcto de la constante importada: VALID_SUB_STATUSES_FOR_MAIN
    const validSubStatuses = VALID_SUB_STATUSES_FOR_MAIN[currentMainStatus] || [];
    if (validSubStatuses.includes(subStatus)) {
      const newSubStatus = currentSubStatus === subStatus ? null : subStatus;
      onStatusChange(currentMainStatus, newSubStatus);
    } else {
      console.warn(`Sub-estado ${subStatus} no es válido para el estado principal ${currentMainStatus}`);
    }
  };

  const availableMainStatuses = Object.values(VIDEO_MAIN_STATUS);
  // Y aquí también para la lista de sub-estados disponibles para renderizar:
  const availableSubStatuses = VALID_SUB_STATUSES_FOR_MAIN[currentMainStatus] || [];


  return React.createElement(
    'div',
    {
      className: 'status-selector-popup',
      style: {
        position: 'absolute',
        border: '1px solid #ccc',
        backgroundColor: 'white',
        padding: '15px',
        zIndex: 1000,
        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
        borderRadius: '8px',
        minWidth: '200px',
        ...styleProps
      }
    },
    [
      React.createElement('h4', { key: 'ss-title', style: { marginTop: '0', marginBottom: '15px', fontSize: '16px', fontWeight: '600' } }, 'Cambiar Estado'),
      
      React.createElement('strong', {key: 'main-label', style: {display: 'block', marginBottom: '5px', fontSize: '14px'}}, 'Estado Principal:'),
      React.createElement(
        'div',
        { key: 'ss-main-statuses', style: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: availableSubStatuses.length > 0 ? '15px' : '0'} },
        availableMainStatuses.map(statusValue => 
          React.createElement(
            'button',
            {
              key: statusValue,
              onClick: () => handleMainStatusSelect(statusValue),
              style: {
                padding: '10px',
                cursor: 'pointer',
                backgroundColor: currentMainStatus === statusValue ? '#d0e0ff' : 'transparent',
                border: `1px solid ${currentMainStatus === statusValue ? '#007bff' : '#ddd'}`,
                borderRadius: '4px',
                textAlign: 'left',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }
            },
            `${STATUS_EMOJIS[statusValue] || '?'} ${statusValue.charAt(0).toUpperCase() + statusValue.slice(1)}`
          )
        )
      ),

      availableSubStatuses.length > 0 && React.createElement(React.Fragment, {key: 'sub-status-section'}, [
        React.createElement('strong', {key: 'sub-label', style: {display: 'block', marginBottom: '5px', marginTop: '15px', fontSize: '14px'}}, 'Sub-Estado:'),
        React.createElement(
            'div',
            { key: 'ss-sub-statuses', style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
            availableSubStatuses.map(subStatusValue => 
              React.createElement(
                'button',
                {
                  key: subStatusValue,
                  onClick: () => handleSubStatusSelect(subStatusValue), // Aquí es donde ocurre el error
                  style: {
                    padding: '10px',
                    cursor: 'pointer',
                    backgroundColor: currentSubStatus === subStatusValue ? '#e0e0e0' : 'transparent',
                    border: `1px solid ${currentSubStatus === subStatusValue ? '#555' : '#ddd'}`,
                    borderRadius: '4px',
                    textAlign: 'left',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }
                },
                `${STATUS_EMOJIS[subStatusValue] || '?'} ${subStatusValue.charAt(0).toUpperCase() + subStatusValue.slice(1)}`
              )
            )
          )
      ]),

      React.createElement(
        'button',
        { 
          key: 'ss-cancel', 
          onClick: onCancel, 
          style: { marginTop: '20px', padding: '10px', width: '100%', cursor: 'pointer', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px' } 
        },
        'Cerrar'
      )
    ]
  );
}

export default StatusSelector;