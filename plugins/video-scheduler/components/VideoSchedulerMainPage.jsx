// video-scheduler/components/VideoSchedulerMainPage.jsx
import React from 'react';
import DayCell from './DayCell.jsx';
import VideoSlotCell from './VideoSlotCell.jsx';
import DaySummaryCell from './DaySummaryCell.jsx';
import DailyIncomeCell from './DailyIncomeCell.jsx';
import StatusSelector from './StatusSelector.jsx';
import DailyIncomeForm from './DailyIncomeForm.jsx';
import StatsPanel from './StatsPanel.jsx';
import StatsOverviewPanel from './StatsOverviewPanel.jsx';
import BulkAddForm from './BulkAddForm.jsx';
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
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const [showStatusSelector, setShowStatusSelector] = React.useState(false);
  const [statusSelectorContext, setStatusSelectorContext] = React.useState(null);
  const [showIncomeForm, setShowIncomeForm] = React.useState(false);
  const [incomeFormContext, setIncomeFormContext] = React.useState(null);
  const [showStatsPanel, setShowStatsPanel] = React.useState(false);
  const [showBulkAddForm, setShowBulkAddForm] = React.useState(false);

  const incomePopupConfig = {
    width: 320,
    height: 300,
    margin: 10, 
    gapToCell: 10 
  };

  const statusSelectorPopupConfig = {
    width: 220, 
    height: 280, // Ajustado ligeramente para más contenido
    margin: 10,  
    gapToIcon: 10 
  };

  const findScrollContainer = () => {
    const appMain = document.querySelector('.app-main');
    if (appMain) return appMain;
    
    const appContent = document.querySelector('.app-content');
    if (appContent) return appContent;
    
    return document.documentElement; // Fallback al body/html
  };

  React.useEffect(() => {
    const handleScroll = () => {
      if (showIncomeForm || showStatusSelector) {
        setShowIncomeForm(false);
        setIncomeFormContext(null);
        setShowStatusSelector(false);
        setStatusSelectorContext(null);
      }
    };

    const scrollContainer = findScrollContainer();
    // Asegurarse de que scrollContainer no sea null y tenga addEventListener
    if (scrollContainer && scrollContainer.addEventListener) {
        if (scrollContainer === document.documentElement || scrollContainer === document.body) {
            window.addEventListener('scroll', handleScroll, { passive: true });
        } else {
            scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
        }
    }
    
    return () => {
        if (scrollContainer && scrollContainer.removeEventListener) {
            if (scrollContainer === document.documentElement || scrollContainer === document.body) {
                window.removeEventListener('scroll', handleScroll);
            } else {
                scrollContainer.removeEventListener('scroll', handleScroll);
            }
        }
    };
  }, [showIncomeForm, showStatusSelector]);


  const refreshCalendarDataSilently = React.useCallback(async () => {
    if (plugin && plugin.publicAPI && plugin.publicAPI.getMonthViewData) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth(); 
      const data = await plugin.publicAPI.getMonthViewData(year, month);
      setMonthData(data);
    }
  }, [plugin, currentDate]);

  const refreshCalendarData = React.useCallback(async () => {
    if (plugin && plugin.publicAPI && plugin.publicAPI.getMonthViewData) {
      if (isInitialLoad) {
        setIsLoading(true);
      }
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth(); 
      const data = await plugin.publicAPI.getMonthViewData(year, month);
      setMonthData(data);
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, [plugin, currentDate, pluginId, isInitialLoad]);

  React.useEffect(() => {
    refreshCalendarData();
  }, [refreshCalendarData]); 

  const handlePrevMonth = () => {
      setShowStatusSelector(false); setStatusSelectorContext(null);
      setShowIncomeForm(false); setIncomeFormContext(null);
      setIsInitialLoad(true);
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }
  const handleNextMonth = () => {
      setShowStatusSelector(false); setStatusSelectorContext(null);
      setShowIncomeForm(false); setIncomeFormContext(null);
      setIsInitialLoad(true);
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  const handleVideoNameChange = async (day, slotIndex, newName) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    await plugin.publicAPI.updateVideoName(dateStr, slotIndex, newName);
    refreshCalendarDataSilently();
  };

  const handleVideoDescriptionChange = async (day, slotIndex, newDescription) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    await plugin.publicAPI.updateVideoDescription(dateStr, slotIndex, newDescription);
    refreshCalendarDataSilently();
  };

  const handleStatusIconClick = (day, slotIndex, event) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const videoKey = `${dateStr}-${slotIndex}`;
    
    if (!monthData || !monthData.videos) {
        return;
    }
    const video = monthData.videos[videoKey] || {
      ...DEFAULT_SLOT_VIDEO_STRUCTURE, 
      id: videoKey,
      stackableStatuses: []
    };
    
    const wrapper = event.currentTarget.closest('.video-scheduler-main-content-wrapper');
    if (!wrapper) {
        return;
    }
    const iconRect = event.currentTarget.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    
    const { 
        width: popupWidth, 
        height: popupHeightEstimate,
        margin: popupMargin, 
        gapToIcon 
    } = statusSelectorPopupConfig;
    
    let finalLeft = (iconRect.right - wrapperRect.left) + gapToIcon;
    if (finalLeft + popupWidth > wrapper.clientWidth - popupMargin) {
      finalLeft = (iconRect.left - wrapperRect.left) - popupWidth - gapToIcon;
    }
    if (finalLeft < popupMargin) {
      finalLeft = wrapper.clientWidth - popupWidth - popupMargin;
      if (finalLeft < popupMargin) {
        finalLeft = popupMargin;
      }
    }
    if (popupWidth > wrapper.clientWidth - 2 * popupMargin) {
        finalLeft = popupMargin;
    }

    let finalTop = (iconRect.top - wrapperRect.top) + (iconRect.height / 2) - (popupHeightEstimate / 2);
    const header = wrapper.querySelector('.page-header-controls');
    const headerHeight = header ? header.offsetHeight : 0;
    const minTopPosition = headerHeight + popupMargin;
    const maxBottomEdgeOfPopup = wrapper.clientHeight - popupMargin;

    if (finalTop < minTopPosition) {
      finalTop = minTopPosition;
    }
    if (finalTop + popupHeightEstimate > maxBottomEdgeOfPopup) {
      finalTop = maxBottomEdgeOfPopup - popupHeightEstimate;
      if (finalTop < minTopPosition) {
          finalTop = minTopPosition;
      }
    }

    setStatusSelectorContext({ 
        day, slotIndex, video, 
        position: { top: finalTop, left: finalLeft }
    });
    setShowStatusSelector(true);
    setShowIncomeForm(false); 
    setIncomeFormContext(null);
  };

  const handleStatusChange = async (newMainStatus, newSubStatus, newStackableStatuses = []) => {
    if (statusSelectorContext && statusSelectorContext.video) {
      const { day, slotIndex } = statusSelectorContext;
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      await plugin.publicAPI.updateVideoStatus(dateStr, slotIndex, newMainStatus, newSubStatus, newStackableStatuses);
      
      setStatusSelectorContext(prev => {
        if (!prev || !prev.video) return prev; 
        return {
          ...prev,
          video: {
            ...prev.video,
            status: newMainStatus,
            subStatus: newSubStatus,
            stackableStatuses: newStackableStatuses
          }
        };
      });
      
      refreshCalendarDataSilently();
    }
  };

  const handleIncomeCellClick = (day, event) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const incomeData = (monthData && monthData.dailyIncomes) ? (monthData.dailyIncomes[dateStr] || null) : null;
    
    const wrapper = event.currentTarget.closest('.video-scheduler-main-content-wrapper');
    if (!wrapper) return;
    const cellRect = event.currentTarget.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    
    const cellLeft = cellRect.left - wrapperRect.left;
    const cellRight = cellRect.right - wrapperRect.left;
    const cellTop = cellRect.top - wrapperRect.top;

    const { width: popupWidth, height: popupHeight, margin, gapToCell } = incomePopupConfig;
    
    const header = wrapper.querySelector('.page-header-controls');
    const headerHeight = header ? header.offsetHeight : 0;
    
    // Considerar la altura del panel de estadísticas inferior si está visible
    // Esta es una estimación, idealmente se debería obtener dinámicamente.
    const footerStatsPanel = wrapper.querySelector('.stats-tab-content'); // Se usa .stats-tab-content para el panel inferior ahora
    const footerStatsPanelHeight = footerStatsPanel ? footerStatsPanel.offsetHeight : 0;
    
    const minTopPosition = headerHeight + margin;
    const maxBottomEdgeOfPopup = wrapper.clientHeight - footerStatsPanelHeight - margin;

    let finalLeft = cellLeft - popupWidth - gapToCell;
    if (finalLeft < margin) {
      finalLeft = cellRight + gapToCell;
      if (finalLeft + popupWidth > wrapper.clientWidth - margin) {
        finalLeft = wrapper.clientWidth - popupWidth - margin;
        if (finalLeft < margin) {
            finalLeft = margin;
        }
      }
    }
    
    let finalTop = cellTop;
    if (finalTop + popupHeight > maxBottomEdgeOfPopup) {
        finalTop = cellRect.bottom - wrapperRect.top - popupHeight;
        if (finalTop + popupHeight > maxBottomEdgeOfPopup) { // Re-check
            finalTop = maxBottomEdgeOfPopup - popupHeight;
        }
    }
    if (finalTop < minTopPosition) {
      finalTop = minTopPosition;
    }
    
    setIncomeFormContext({ 
        day, incomeData, 
        position: { 
            top: finalTop, 
            left: finalLeft,
            width: `${popupWidth}px`, 
            height: `${popupHeight}px`
        }
    });
    setShowIncomeForm(true);
    setShowStatusSelector(false); 
    setStatusSelectorContext(null);
  };

  const handleIncomeSave = async (day, newIncomeData) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    await plugin.publicAPI.setDailyIncome(dateStr, newIncomeData);
    refreshCalendarDataSilently();
    setShowIncomeForm(false);
    setIncomeFormContext(null);
  };

  const handleBulkAddSave = async (schedule) => {
    try {
      for (const item of schedule) {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`;
        await plugin.publicAPI.updateVideoName(dateStr, item.slotIndex, item.name);
        if (item.status !== VIDEO_MAIN_STATUS.PENDING) { // Asegurar que no se actualice a PENDING si ya tiene nombre
            const videoData = await plugin.publicAPI.updateVideoStatus(dateStr, item.slotIndex, item.status, null, []);
            // Si la descripción está en el item, actualizarla también
            if (item.description !== undefined) {
                await plugin.publicAPI.updateVideoDescription(dateStr, item.slotIndex, item.description);
            }
        }
      }
      refreshCalendarDataSilently();
      setShowBulkAddForm(false);
    } catch (error) {
      console.error('Error al crear videos en lote:', error);
      throw error; // Relanzar para que el formulario de BulkAdd pueda manejarlo
    }
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
  if (!isLoading && monthData && monthData.videos && monthData.dailyIncomes) {
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayDate = new Date(year, month, day);
      const dayName = WEEKDAY_NAMES[dayDate.getDay()];
      const videosForDay = [0, 1, 2].map(slotIndex => {
          const videoKey = `${dateStr}-${slotIndex}`;
          return monthData.videos[videoKey] || {
            ...DEFAULT_SLOT_VIDEO_STRUCTURE, 
            id: videoKey, 
            status: VIDEO_MAIN_STATUS.PENDING, // Estado por defecto
            stackableStatuses: []
          };
      });
      const currentDailyIncome = monthData.dailyIncomes[dateStr] || null;

      tableBodyRows.push(
        React.createElement('tr', {key: `day-row-${day}`, className: 'calendar-row'}, [ // Añadida clase para hover
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
              onIncomeCellClick: (d,e) => handleIncomeCellClick(d,e)
          })
        ])
      );
    }
  }
  const tableBody = React.createElement('tbody', {key: 'cal-body'}, tableBodyRows);

  if (isLoading && isInitialLoad) return React.createElement('p', {key: 'loading', className: 'loading-message-placeholder'}, 'Cargando calendario...');

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
            React.createElement(
              'button',
              { 
                key: 'bulk-add-btn',
                className: 'global-action-button',
                onClick: () => setShowBulkAddForm(true)
              },
              '📋 Añadir en Lote'
            ),
            React.createElement(
              'button',
              { 
                key: 'stats-btn',
                className: 'global-action-button',
                onClick: () => setShowStatsPanel(true)
              },
              '📊 Estadísticas'
            )
          ])
        ]),
        React.createElement('div', {key: 'calendar-container', className: 'calendar-container'}, [
          React.createElement('table', {key: 'calendar-grid', className: 'calendar-grid'}, [tableHeader, tableBody])
        ]),
        
        showStatusSelector && statusSelectorContext && statusSelectorContext.video && React.createElement(StatusSelector, {
          key: 'status-selector-instance',
          currentMainStatus: statusSelectorContext.video.status,
          currentSubStatus: statusSelectorContext.video.subStatus,
          currentStackableStatuses: statusSelectorContext.video.stackableStatuses || [],
          onStatusChange: handleStatusChange,
          onCancel: () => {
            setShowStatusSelector(false);
            setStatusSelectorContext(null);
          },
          styleProps: statusSelectorContext.position
        }),

        showIncomeForm && incomeFormContext && React.createElement(DailyIncomeForm, {
          key: 'income-form-instance',
          day: incomeFormContext.day,
          existingIncome: incomeFormContext.incomeData,
          onSave: handleIncomeSave,
          onCancel: () => {
            setShowIncomeForm(false);
            setIncomeFormContext(null);
          },
          styleProps: incomeFormContext.position
        }),

        showStatsPanel && React.createElement(StatsPanel, {
          key: 'stats-panel-instance',
          monthData: monthData, // Se pasa monthData completo, StatsPanel filtrará si es necesario
          currentDate: currentDate,
          plugin: plugin,
          onClose: () => setShowStatsPanel(false)
        }),

        showBulkAddForm && React.createElement(BulkAddForm, {
          key: 'bulk-add-form-instance',
          currentDate: currentDate,
          plugin: plugin,
          onSave: handleBulkAddSave,
          onCancel: () => setShowBulkAddForm(false),
          styleProps: { /* Para centrar por defecto, no se necesitan props de posición aquí */ }
        })
      ]),
      
      !isLoading && React.createElement(StatsOverviewPanel, {
        key: 'footer-stats-panel',
        monthData: monthData, // Se pasa monthData completo
        currentDate: currentDate,
        plugin: plugin,
        compact: false // Usar el modo completo para mostrar todas las estadísticas
      })
    ]
  );
}

export default VideoSchedulerMainPage;