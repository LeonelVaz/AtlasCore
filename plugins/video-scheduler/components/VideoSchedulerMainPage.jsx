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
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const [showStatusSelector, setShowStatusSelector] = React.useState(false);
  const [statusSelectorContext, setStatusSelectorContext] = React.useState(null); 
  const [showIncomeForm, setShowIncomeForm] = React.useState(false);
  const [incomeFormContext, setIncomeFormContext] = React.useState(null);

  // Función para encontrar el contenedor con scroll real (app-main)
  const findScrollContainer = () => {
    const appMain = document.querySelector('.app-main');
    if (appMain) return appMain;
    
    const appContent = document.querySelector('.app-content');
    if (appContent) return appContent;
    
    return document.documentElement;
  };

  // Effect para cerrar popups cuando se hace scroll
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

  // Función para cargar datos sin mostrar loading (para actualizaciones)
  const refreshCalendarDataSilently = React.useCallback(async () => {
    if (plugin && plugin.publicAPI && plugin.publicAPI.getMonthViewData) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth(); 
      const data = await plugin.publicAPI.getMonthViewData(year, month);
      setMonthData(data);
      console.log(`[${pluginId}] Datos del mes ${year}-${month+1} refrescados silenciosamente.`);
    }
  }, [plugin, currentDate, pluginId]);

  // Función para carga inicial con loading state
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
      console.log(`[${pluginId}] Datos del mes ${year}-${month+1} refrescados.`);
    }
  }, [plugin, currentDate, pluginId, isInitialLoad]);

  React.useEffect(() => {
    refreshCalendarData();
  }, [refreshCalendarData]); 

  const handlePrevMonth = () => {
      setShowStatusSelector(false); setShowIncomeForm(false);
      setIsInitialLoad(true);
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }
  const handleNextMonth = () => {
      setShowStatusSelector(false); setShowIncomeForm(false);
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
    const video = monthData.videos[videoKey] || {...DEFAULT_SLOT_VIDEO_STRUCTURE, id: videoKey}; 
    
    const wrapper = event.currentTarget.closest('.video-scheduler-main-content-wrapper');
    const iconRect = event.currentTarget.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    
    // Calcular posición relativa al wrapper
    const iconLeft = iconRect.left - wrapperRect.left;
    const iconTop = iconRect.top - wrapperRect.top;
    const iconBottom = iconRect.bottom - wrapperRect.top;
    
    // Dimensiones del popup y wrapper
    const popupWidth = 220;
    const popupHeight = 250;
    const wrapperWidth = wrapper.clientWidth;
    const wrapperHeight = wrapper.clientHeight;
    
    // Posición horizontal (alineado con icono, ajustado si se sale)
    let finalLeft = iconLeft;
    if (finalLeft + popupWidth > wrapperWidth - 10) {
      finalLeft = wrapperWidth - popupWidth - 10;
    }
    if (finalLeft < 10) finalLeft = 10;
    
    // Posición vertical (debajo del icono, arriba si se sale)
    let finalTop = iconBottom + 5;
    if (finalTop + popupHeight > wrapperHeight - 10) {
      finalTop = iconTop - popupHeight - 5;
    }
    if (finalTop < 10) finalTop = 10;

    setStatusSelectorContext({ 
        day, slotIndex, video, 
        position: { top: finalTop, left: finalLeft }
    });
    setShowStatusSelector(true);
    setShowIncomeForm(false); 
  };

  const handleStatusChange = async (newMainStatus, newSubStatus) => {
    if (statusSelectorContext) {
      const { day, slotIndex } = statusSelectorContext;
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      await plugin.publicAPI.updateVideoStatus(dateStr, slotIndex, newMainStatus, newSubStatus);
      refreshCalendarDataSilently();
      
      setStatusSelectorContext(prev => ({
        ...prev,
        video: {
          ...prev.video,
          status: newMainStatus,
          subStatus: newSubStatus
        }
      }));
    }
  };

  const handleIncomeCellClick = (day, event) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const incomeData = monthData.dailyIncomes[dateStr] || null;
    
    const wrapper = event.currentTarget.closest('.video-scheduler-main-content-wrapper');
    const cellRect = event.currentTarget.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    
    // Posición de la celda relativa al wrapper
    const cellLeft = cellRect.left - wrapperRect.left;
    const cellRight = cellRect.right - wrapperRect.left;
    const cellTop = cellRect.top - wrapperRect.top;
    const cellBottom = cellRect.bottom - wrapperRect.top;
    
    // Dimensiones del popup y márgenes
    const popupWidth = 320;
    const popupHeight = 300;
    const margin = 10;
    
    // Obtener la altura del header para calcular el límite inferior correcto
    const header = wrapper.querySelector('.page-header-controls');
    const headerHeight = header ? header.offsetHeight : 0;
    
    // El límite inferior es la altura del wrapper menos el área del panel de estadísticas
    const availableHeight = wrapper.clientHeight - 60; // 60px para el panel de estadísticas
    
    console.log('=== SIMPLE CALC ===');
    console.log('Cell position:', { cellTop, cellBottom, cellLeft, cellRight });
    console.log('Wrapper client height:', wrapper.clientHeight);
    console.log('Available height (minus stats panel):', availableHeight);
    console.log('Header height:', headerHeight);
    
    // Posición horizontal: izquierda de la celda por defecto, derecha si no cabe
    let finalLeft = cellLeft - popupWidth;
    console.log('=== HORIZONTAL DEBUG ===');
    console.log('cellLeft:', cellLeft, 'cellRight:', cellRight);
    console.log('popupWidth:', popupWidth, 'margin:', margin);
    console.log('wrapper.clientWidth:', wrapper.clientWidth);
    console.log('finalLeft inicial (izquierda):', finalLeft);
    console.log('¿Cabe a la izquierda?', finalLeft >= margin);
    
    if (finalLeft < margin) {
      console.log('NO CABE A LA IZQUIERDA - Posicionando a la derecha');
      finalLeft = cellRight + margin;
      console.log('finalLeft (derecha):', finalLeft);
      
      // Si tampoco cabe a la derecha, ajustar al máximo posible
      if (finalLeft + popupWidth > wrapper.clientWidth - margin) {
        console.log('Tampoco cabe a la derecha, ajustando al límite');
        finalLeft = wrapper.clientWidth - popupWidth - margin;
      }
    }
    
    // Posición vertical: alineado con la celda por defecto
    let finalTop = cellTop;
    
    // Si se sale por abajo del área disponible, ponerlo ARRIBA de la celda
    if (finalTop + popupHeight > availableHeight - margin) {
      finalTop = cellTop - popupHeight - margin; // ARRIBA de la celda, no abajo
      console.log('Reposicionando ARRIBA de la celda');
    }
    
    // Si tampoco cabe arriba, ajustar al máximo posible
    if (finalTop < headerHeight + margin) {
      finalTop = headerHeight + margin;
    }
    
    console.log('Final position:', { top: finalTop, left: finalLeft });
    console.log('Popup will end at:', finalTop + popupHeight);
    console.log('Available space ends at:', availableHeight);
    console.log('=== SETTING CONTEXT ===');

    setIncomeFormContext({ 
        day, incomeData, 
        position: { top: finalTop, left: finalLeft }
    });
    setShowIncomeForm(true);
    setShowStatusSelector(false); 
  };

  const handleIncomeSave = async (day, newIncomeData) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    await plugin.publicAPI.setDailyIncome(dateStr, newIncomeData);
    refreshCalendarDataSilently();
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
        })
      ]),
      React.createElement('div', {key: 'stats-panel', className: 'video-stats-panel-placeholder'}, 'Panel de Estadísticas (Próximamente)')
    ]
  );
}

export default VideoSchedulerMainPage;