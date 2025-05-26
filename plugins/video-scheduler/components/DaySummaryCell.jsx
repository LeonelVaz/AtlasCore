// video-scheduler/components/DaySummaryCell.jsx
import React from 'react';
import { STATUS_EMOJIS } from '../utils/constants.js';

function DaySummaryCell({ videosForDay }) { 
  const summaryContent = (videosForDay || [])
    .map(video => 
        (STATUS_EMOJIS[video.status] || ' ') + 
        (video.subStatus ? (STATUS_EMOJIS[video.subStatus] || '') : '')
    )
    .join('  ');

  return React.createElement(
    'td',
    { className: 'video-scheduler-summary-cell' }, 
    React.createElement('span', null, summaryContent || '---')
  );
}

export default DaySummaryCell;