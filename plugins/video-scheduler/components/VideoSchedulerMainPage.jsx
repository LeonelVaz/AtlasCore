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
    margin: 10, // Margen general de seguridad respecto a los bordes del wrapper
    gapToCell: 10 // Espacio deseado entre la celda y el popup cuando se posiciona a un lado
  };

  // Configuración para el popup StatusSelector
  const statusSelectorPopupConfig = {
    width: 220,  // Ancho del StatusSelector
    height: 250, // Alto ESTIMADO del StatusSelector (puede variar con el contenido)
    margin: 10,  // Margen respecto a los bordes del wrapper
    gapToIcon: 10 // Espacio deseado entre el icono y el popup
  };

  const findScrollContainer = () => {
    const appMain = document.querySelector('.app-main');
    if (appMain) return appMain;
    
    const appContent = document.querySelector('.app-content');
    if (appContent) return appContent;
    
    return document.documentElement;
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
    if (scrollContainer === document.documentElement) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (scrollContainer === document.documentElement) {
        window.removeEventListener('scroll', handleScroll);
      } else {
        scrollContainer.removeEventListener('scroll', handleScroll);
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
        height: popupHeightEstimate, // Es una estimación, la altura real puede variar
        margin: popupMargin, 
        gapToIcon 
    } = statusSelectorPopupConfig;
    
    // --- Posición Horizontal ---
    // Prioridad 1: A la derecha del icono
    let finalLeft = (iconRect.right - wrapperRect.left) + gapToIcon;
    
    // Si se sale por la derecha, intentar a la izquierda
    if (finalLeft + popupWidth > wrapper.clientWidth - popupMargin) {
      finalLeft = (iconRect.left - wrapperRect.left) - popupWidth - gapToIcon;
    }
    // Si sigue saliéndose por la izquierda (o la posición izquierda no es viable)
    if (finalLeft < popupMargin) {
      // Si cabía a la derecha pero se ajustó a la izquierda y aun así no cabe,
      // o si directamente no cabe a la izquierda, intentar pegarlo al borde derecho del wrapper.
      finalLeft = wrapper.clientWidth - popupWidth - popupMargin;
      // Si el popup es más ancho que el wrapper, pegarlo al borde izquierdo.
      if (finalLeft < popupMargin) {
        finalLeft = popupMargin;
      }
    }
    // Asegurar que si es más ancho que el wrapper, se alinee a la izquierda con margen.
    if (popupWidth > wrapper.clientWidth - 2 * popupMargin) {
        finalLeft = popupMargin;
    }

    // --- Posición Vertical ---
    // Idealmente, el centro del popup se alinea con el centro del icono.
    let finalTop = (iconRect.top - wrapperRect.top) + (iconRect.height / 2) - (popupHeightEstimate / 2);
    
    const header = wrapper.querySelector('.page-header-controls');
    const headerHeight = header ? header.offsetHeight : 0;
    const minTopPosition = headerHeight + popupMargin; // No solapar el header
    const maxBottomEdgeOfPopup = wrapper.clientHeight - popupMargin; // Límite inferior del wrapper

    // Ajustar para no salirse por arriba
    if (finalTop < minTopPosition) {
      finalTop = minTopPosition;
    }
    // Ajustar para no salirse por abajo
    if (finalTop + popupHeightEstimate > maxBottomEdgeOfPopup) {
      finalTop = maxBottomEdgeOfPopup - popupHeightEstimate;
      // Si después de ajustar al fondo, queda por encima del mínimo, está bien.
      // Pero si el popup es muy alto para el espacio disponible, podría irse por encima del minTop.
      if (finalTop < minTopPosition) {
          finalTop = minTopPosition; // Priorizar no salirse por arriba. El popup podría cortarse si es muy alto.
      }
    }

    setStatusSelectorContext({ 
        day, slotIndex, video, 
        position: { top: finalTop, left: finalLeft }
    });
    setShowStatusSelector(true);
    setShowIncomeForm(false); // Cerrar el otro popup si estuviera abierto
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
    
    const statsPanelPlaceholderHeight = 60; 
    const minTopPosition = headerHeight + margin;
    const maxBottomEdgeOfPopup = wrapper.clientHeight - statsPanelPlaceholderHeight - margin;

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
        if (finalTop + popupHeight > maxBottomEdgeOfPopup) {
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
    setShowStatusSelector(false); // Cerrar el otro popup
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
        if (item.status !== VIDEO_MAIN_STATUS.PENDING) {
          await plugin.publicAPI.updateVideoStatus(dateStr, item.slotIndex, item.status, null, []);
        }
      }
      refreshCalendarDataSilently();
      setShowBulkAddForm(false);
    } catch (error) {
      console.error('Error al crear videos en lote:', error);
      throw error;
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
  // Asegurarse que monthData y sus propiedades necesarias existan antes de iterar
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
            status: VIDEO_MAIN_STATUS.PENDING,
            stackableStatuses: []
          };
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
        
        showStatusSelector && statusSelectorContext && statusSelectorContext.video && React.createElement(StatusSelector, { // AÑADIDA LA CONDICIÓN statusSelectorContext.video
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
          monthData: monthData,
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
          styleProps: {}
        })
      ]),
      
      // Panel de estadísticas compartido inferior usando el mismo componente
      !isLoading && React.createElement(StatsOverviewPanel, {
        key: 'footer-stats-panel',
        monthData: monthData,
        currentDate: currentDate,
        plugin: plugin,
        compact: true // Usa el modo compacto para el panel inferior
      })
    ]
  );
}

export default VideoSchedulerMainPage;