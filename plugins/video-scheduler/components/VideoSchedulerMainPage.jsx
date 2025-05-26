// video-scheduler/components/VideoSchedulerMainPage.jsx
import React from 'react';
import DayCell from './DayCell.jsx';
import VideoSlotCell from './VideoSlotCell.jsx';
import DaySummaryCell from './DaySummaryCell.jsx';
import DailyIncomeCell from './DailyIncomeCell.jsx';
import StatusSelector from './StatusSelector.jsx';
import DailyIncomeForm from './DailyIncomeForm.jsx';
import { VIDEO_MAIN_STATUS, DEFAULT_SLOT_VIDEO_STRUCTURE } from '../utils/constants.js';

function getMonthDetails(year, month) { // month es 0-11
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { daysInMonth };
}
const WEEKDAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function VideoSchedulerMainPage(props) {
  const { plugin, core, pluginId } = props;

  const [currentDate, setCurrentDate] = React.useState(new Date()); 
  const [monthData, setMonthData] = React.useState({ videos: {}, dailyIncomes: {} }); 
  const [isLoading, setIsLoading] = React.useState(true);
  const [showStatusSelector, setShowStatusSelector] = React.useState(false);
  const [statusSelectorContext, setStatusSelectorContext] = React.useState(null); 
  const [showIncomeForm, setShowIncomeForm] = React.useState(false);
  const [incomeFormContext, setIncomeFormContext] = React.useState(null);

  const refreshCalendarData = React.useCallback(async () => {
    if (plugin && plugin.publicAPI && plugin.publicAPI.getMonthViewData) {
      setIsLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth(); 
      const data = await plugin.publicAPI.getMonthViewData(year, month);
      setMonthData(data);
      setIsLoading(false);
      console.log(`[${pluginId}] Datos del mes ${year}-${month+1} refrescados.`);
    }
  }, [plugin, currentDate, pluginId]);

  React.useEffect(() => {
    refreshCalendarData();
  }, [refreshCalendarData]); 

  const handlePrevMonth = () => {
      setShowStatusSelector(false); setShowIncomeForm(false);
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }
  const handleNextMonth = () => {
      setShowStatusSelector(false); setShowIncomeForm(false);
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  const handleVideoNameChange = async (day, slotIndex, newName) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    await plugin.publicAPI.updateVideoName(dateStr, slotIndex, newName);
    refreshCalendarData(); 
  };

  const handleVideoDescriptionChange = async (day, slotIndex, newDescription) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    await plugin.publicAPI.updateVideoDescription(dateStr, slotIndex, newDescription);
    refreshCalendarData(); 
  };

  const handleStatusIconClick = (day, slotIndex, event) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const videoKey = `${dateStr}-${slotIndex}`;
    const video = monthData.videos[videoKey] || {...DEFAULT_SLOT_VIDEO_STRUCTURE, id: videoKey}; 
    const rect = event.currentTarget.getBoundingClientRect();
    const mainContentWrapper = event.currentTarget.closest('.video-scheduler-main-content-wrapper') || document.body;
    const wrapperRect = mainContentWrapper.getBoundingClientRect();

    setStatusSelectorContext({ 
        day, slotIndex, video, 
        position: { 
            top: rect.bottom - wrapperRect.top + window.scrollY + 5, 
            left: rect.left - wrapperRect.left + window.scrollX 
        }
    });
    setShowStatusSelector(true);
    setShowIncomeForm(false); 
  };

  const handleStatusChange = async (newMainStatus, newSubStatus) => {
    if (statusSelectorContext) {
      const { day, slotIndex } = statusSelectorContext;
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      await plugin.publicAPI.updateVideoStatus(dateStr, slotIndex, newMainStatus, newSubStatus);
      refreshCalendarData();
    }
    setShowStatusSelector(false);
    setStatusSelectorContext(null);
  };

  const handleIncomeCellClick = (day, event) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const incomeData = monthData.dailyIncomes[dateStr] || null;
    const cellRect = event.currentTarget.getBoundingClientRect(); 
    const mainContentWrapper = event.currentTarget.closest('.video-scheduler-main-content-wrapper') || document.body;
    const wrapperRect = mainContentWrapper.getBoundingClientRect();

    // Ancho estimado del popup de ingresos (ajustar si es necesario)
    const incomeFormWidth = 320; // Estimado en px
    let leftPosition = cellRect.right - wrapperRect.left + window.scrollX + 10; // Por defecto a la derecha

    // Si no hay suficiente espacio a la derecha, ponerlo a la izquierda
    if (cellRect.right + incomeFormWidth > window.innerWidth - wrapperRect.left) { // Considerar el borde del wrapper también
        leftPosition = cellRect.left - wrapperRect.left + window.scrollX - incomeFormWidth - 10;
    }
    // Asegurar que no se salga por la izquierda del wrapper
    if (leftPosition < 0) leftPosition = 10;


    setIncomeFormContext({ 
        day, incomeData, 
        position: { 
            top: cellRect.top - wrapperRect.top + window.scrollY, 
            left: leftPosition
        } 
    });
    setShowIncomeForm(true);
    setShowStatusSelector(false); 
  };

  const handleIncomeSave = async (day, newIncomeData) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    await plugin.publicAPI.setDailyIncome(dateStr, newIncomeData);
    refreshCalendarData();
    setShowIncomeForm(false);
    setIncomeFormContext(null);
  };
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); 
  const { daysInMonth } = getMonthDetails(year, month);
  const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long' });

  const tableHeader = React.createElement(
    'thead', {key: 'cal-head'},
    React.createElement('tr', null, 
      ["Día", "7am", "15pm", "22pm", "Resumen", "Ingresos"].map(headerText => 
        React.createElement('th', {key: headerText}, headerText)
      )
    )
  );

  const tableBodyRows = [];
  if (!isLoading && monthData.videos && monthData.dailyIncomes) {
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayDate = new Date(year, month, day);
      const dayName = WEEKDAY_NAMES[dayDate.getDay()];
      const videosForDay = [0, 1, 2].map(slotIndex => {
          const videoKey = `${dateStr}-${slotIndex}`;
          return monthData.videos[videoKey] || {...DEFAULT_SLOT_VIDEO_STRUCTURE, id: videoKey, status: VIDEO_MAIN_STATUS.PENDING };
      });
      const currentDailyIncome = monthData.dailyIncomes[dateStr] || null;

      tableBodyRows.push(
        React.createElement('tr', {key: `day-row-${day}`}, [
          React.createElement(DayCell, {key: `daycell-${day}`, dayNumber: day, dayName: dayName}),
          videosForDay.map((video, slotIndex) => 
            React.createElement(VideoSlotCell, {
              key: `videoslot-${day}-${slotIndex}`, day, slotIndex, videoData: video,
              onNameChange: handleVideoNameChange,
              onDescriptionChange: handleVideoDescriptionChange,
              onStatusIconClick: (d,s,e) => handleStatusIconClick(d,s,e)
            })
          ),
          React.createElement(DaySummaryCell, {key: `summary-${day}`, videosForDay}),
          React.createElement(DailyIncomeCell, {
              key: `incomecell-${day}`, day, dailyIncomeData: currentDailyIncome, 
              onIncomeCellClick: (d,e) => handleIncomeCellClick(d,e) // Pasar el evento
          })
        ])
      );
    }
  }
  const tableBody = React.createElement('tbody', {key: 'cal-body'}, tableBodyRows);

  if (isLoading) return React.createElement('p', {key: 'loading', className: 'loading-message-placeholder'}, 'Cargando calendario...');

  return React.createElement(
    'div', 
    {className: 'video-scheduler-page'},
    [
      React.createElement('div', {key: 'main-wrapper', className: 'video-scheduler-main-content-wrapper'}, [
        React.createElement('header', {key: 'page-header', className: 'page-header-controls'}, [
          React.createElement('div', {key: 'month-nav', className: 'month-navigation'}, [
            React.createElement('button', {key: 'prev-month', onClick: handlePrevMonth}, '← Mes Anterior'),
            React.createElement('h2', {key: 'current-month-display'}, `${monthName} ${year}`),
            React.createElement('button', {key: 'next-month', onClick: handleNextMonth}, 'Mes Siguiente →')
          ]),
          React.createElement('div', {key: 'global-actions', className: 'video-scheduler-global-actions'}, [
            /* Futuros botones globales */
          ])
        ]),
        React.createElement('div', {key: 'calendar-container', className: 'calendar-container'}, [
          React.createElement('table', {key: 'calendar-grid', className: 'calendar-grid'}, [tableHeader, tableBody])
        ]),
        
        showStatusSelector && statusSelectorContext && React.createElement(StatusSelector, {
          key: 'status-selector-instance',
          currentMainStatus: statusSelectorContext.video.status,
          currentSubStatus: statusSelectorContext.video.subStatus,
          onStatusChange: handleStatusChange,
          onCancel: () => setShowStatusSelector(false),
          styleProps: statusSelectorContext.position 
        }),
        showIncomeForm && incomeFormContext && React.createElement(DailyIncomeForm, {
          key: 'income-form-instance',
          day: incomeFormContext.day,
          existingIncome: incomeFormContext.incomeData,
          onSave: handleIncomeSave,
          onCancel: () => setShowIncomeForm(false),
          styleProps: incomeFormContext.position
        })
      ]),
      React.createElement('div', {key: 'stats-panel', className: 'video-stats-panel-placeholder'}, 'Panel de Estadísticas (Próximamente)')
    ]
  );
}

export default VideoSchedulerMainPage;