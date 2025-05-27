// video-scheduler/components/DaySummaryCell.jsx
import React from 'react';
import { STATUS_EMOJIS } from '../utils/constants.js';

function DaySummaryCell({ videosForDay }) { 
  const summaryContent = (videosForDay || [])
    .map(video => {
      let statusDisplay = STATUS_EMOJIS[video.status] || ' ';
      
      // Añadir sub-estado normal si existe
      if (video.subStatus) {
        statusDisplay += STATUS_EMOJIS[video.subStatus] || '';
      }
      
      // Añadir sub-estados apilables si existen
      if (video.stackableStatuses && video.stackableStatuses.length > 0) {
        video.stackableStatuses.forEach(stackableStatus => {
          statusDisplay += STATUS_EMOJIS[stackableStatus] || '';
        });
      }
      
      return statusDisplay;
    })
    .join('  ');

  return React.createElement(
    'td',
    { className: 'video-scheduler-summary-cell' }, 
    React.createElement('span', null, summaryContent || '---')
  );
}

export default DaySummaryCell;