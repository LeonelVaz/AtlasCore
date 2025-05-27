// video-scheduler/components/DaySummaryCell.jsx
import React from 'react';
import { STATUS_EMOJIS } from '../utils/constants.js';

function DaySummaryCell({ videosForDay }) {
  const videoSummaryElements = (videosForDay || []).map((video, index) => {
    const emojiStack = [];

    // 1. Estado Principal (siempre al fondo de la pila visual)
    if (video.status && STATUS_EMOJIS[video.status]) {
      emojiStack.push(
        React.createElement('span', {
          key: `main-${index}`,
          className: 'summary-emoji summary-main-status'
        }, STATUS_EMOJIS[video.status])
      );
    } else {
      // Placeholder si no hay estado principal (no debería ocurrir con la lógica actual)
      emojiStack.push(
        React.createElement('span', {
          key: `main-placeholder-${index}`,
          className: 'summary-emoji'
        }, ' ')
      );
    }

    // 2. Sub-estado Normal (encima del principal)
    if (video.subStatus && STATUS_EMOJIS[video.subStatus]) {
      emojiStack.push(
        React.createElement('span', {
          key: `sub-${index}`,
          className: 'summary-emoji summary-sub-status'
        }, STATUS_EMOJIS[video.subStatus])
      );
    }

    // 3. Sub-estados Apilables (encima de todo lo demás)
    if (video.stackableStatuses && video.stackableStatuses.length > 0) {
      video.stackableStatuses.forEach((stackableStatus, sIndex) => {
        if (STATUS_EMOJIS[stackableStatus]) {
          emojiStack.push(
            React.createElement('span', {
              key: `stackable-${index}-${sIndex}`,
              className: 'summary-emoji summary-stackable-status'
            }, STATUS_EMOJIS[stackableStatus])
          );
        }
      });
    }
    
    // Si no hay emojis, mostrar un guion para ese slot
    if (emojiStack.length === 1 && emojiStack[0].props.children === ' ') {
        return React.createElement(
            'div',
            { key: `video-summary-empty-${index}`, className: 'summary-video-item empty-slot' },
            '–' // Guion simple para slot vacío visualmente
        );
    }


    // El div 'summary-video-item' usará flex-direction: column-reverse
    // por lo que el orden de los hijos aquí es el orden visual de abajo hacia arriba.
    return React.createElement(
      'div',
      { key: `video-summary-${index}`, className: 'summary-video-item' },
      emojiStack // Renderiza los elementos del array
    );
  });
  
  const hasContent = videoSummaryElements.some(el => el.props.className !== 'summary-video-item empty-slot');

  return React.createElement(
    'td',
    { className: 'video-scheduler-summary-cell' },
    React.createElement(
      'div',
      { className: 'summary-videos-container' },
      hasContent ? videoSummaryElements : React.createElement('span', null, '---')
    )
  );
}

export default DaySummaryCell;