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
  const [isInitialLoad, setIsInitialLoad] = React.useState(true); // Nuevo estado para carga inicial
  const [showStatusSelector, setShowStatusSelector] = React.useState(false);
  const [statusSelectorContext, setStatusSelectorContext] = React.useState(null); 
  const [showIncomeForm, setShowIncomeForm] = React.useState(false);
  const [incomeFormContext, setIncomeFormContext] = React.useState(null);

  // Función para encontrar el contenedor con scroll real (app-main)
  const findScrollContainer = (element) => {
    // Buscar específicamente en el orden de jerarquía que mencionaste
    const appMain = document.querySelector('.app-main');
    if (appMain) {
      console.log('Found app-main container');
      return appMain;
    }
    
    const appContent = document.querySelector('.app-content');
    if (appContent) {
      console.log('Found app-content container');
      return appContent;
    }
    
    // Fallback: buscar por overflow como antes
    let current = element;
    while (current && current !== document.body) {
      const overflow = window.getComputedStyle(current).overflow;
      const overflowY = window.getComputedStyle(current).overflowY;
      
      if ((overflow === 'auto' || overflow === 'scroll' || 
           overflowY === 'auto' || overflowY === 'scroll') && 
          current.scrollHeight > current.clientHeight) {
        console.log('Found overflow container:', current.className || current.tagName);
        return current;
      }
      
      current = current.parentElement;
    }
    
    console.log('No scroll container found, using document.documentElement');
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

    // Agregar listener de scroll al contenedor principal y a window
    const scrollContainer = document.querySelector('.app-main') || 
                           document.querySelector('.app-content') || 
                           window;
    
    if (scrollContainer === window) {
      window.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (scrollContainer === window) {
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
      setIsInitialLoad(true); // Marcar como carga inicial para mostrar loading
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }
  const handleNextMonth = () => {
      setShowStatusSelector(false); setShowIncomeForm(false);
      setIsInitialLoad(true); // Marcar como carga inicial para mostrar loading
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  const handleVideoNameChange = async (day, slotIndex, newName) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    await plugin.publicAPI.updateVideoName(dateStr, slotIndex, newName);
    refreshCalendarDataSilently(); // Usar función silenciosa para evitar scroll
  };

  const handleVideoDescriptionChange = async (day, slotIndex, newDescription) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    await plugin.publicAPI.updateVideoDescription(dateStr, slotIndex, newDescription);
    refreshCalendarDataSilently(); // Usar función silenciosa para evitar scroll
  };

  const handleStatusIconClick = (day, slotIndex, event) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const videoKey = `${dateStr}-${slotIndex}`;
    const video = monthData.videos[videoKey] || {...DEFAULT_SLOT_VIDEO_STRUCTURE, id: videoKey}; 
    const rect = event.currentTarget.getBoundingClientRect();
    
    // Encontrar el contenedor de referencia para position absolute
    const mainContentWrapper = event.currentTarget.closest('.video-scheduler-main-content-wrapper') || document.body;
    const wrapperRect = mainContentWrapper.getBoundingClientRect();
    
    // Encontrar el contenedor con scroll real
    const scrollContainer = findScrollContainer(event.currentTarget);
    
    // Obtener el scroll actual
    const scrollTop = scrollContainer.scrollTop || 0;
    const scrollLeft = scrollContainer.scrollLeft || 0;
    
    console.log('=== STATUS SELECTOR DEBUG ===');
    console.log('Scroll container:', scrollContainer.className || scrollContainer.tagName);
    console.log('Scroll top:', scrollTop);
    console.log('Icon rect (viewport):', rect);
    console.log('Wrapper rect (viewport):', wrapperRect);
    
    // Calcular posición del icono relativa al wrapper
    const iconTopInWrapper = rect.top - wrapperRect.top;
    const iconLeftInWrapper = rect.left - wrapperRect.left;
    const iconBottomInWrapper = rect.bottom - wrapperRect.top;
    
    console.log('Icon position in wrapper (before scroll):', {
      top: iconTopInWrapper,
      left: iconLeftInWrapper,
      bottom: iconBottomInWrapper
    });
    
    // Agregar el scroll offset
    const finalIconTop = iconTopInWrapper + scrollTop;
    const finalIconLeft = iconLeftInWrapper + scrollLeft;
    const finalIconBottom = iconBottomInWrapper + scrollTop;
    
    console.log('Icon position in wrapper (after scroll):', {
      top: finalIconTop,
      left: finalIconLeft,
      bottom: finalIconBottom
    });
    
    // Posición del popup: debajo del icono
    let finalLeft = finalIconLeft;
    let finalTop = finalIconBottom + 5; // 5px debajo del icono
    
    // Verificar que no se salga por los bordes
    const statusSelectorWidth = 200; // Ancho estimado del popup
    const wrapperWidth = wrapperRect.width;
    
    // Ajustar posición horizontal si se sale por la derecha
    if (finalLeft + statusSelectorWidth > wrapperWidth) {
        finalLeft = wrapperWidth - statusSelectorWidth - 10;
    }
    
    // Asegurar que no se salga por la izquierda
    if (finalLeft < 10) {
        finalLeft = 10;
    }
    
    // Asegurar que el popup esté visible (no muy arriba en la pantalla)
    const minVisibleTop = scrollTop + 10;
    if (finalTop < minVisibleTop) {
        finalTop = minVisibleTop;
    }

    console.log('Final status selector position:', { top: finalTop, left: finalLeft });
    console.log('=== END STATUS DEBUG ===');

    setStatusSelectorContext({ 
        day, slotIndex, video, 
        position: { 
            top: finalTop, 
            left: finalLeft
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
      refreshCalendarDataSilently(); // Usar función silenciosa para evitar scroll
      
      // Actualizar el contexto con el nuevo estado para que el popup se mantenga actualizado
      setStatusSelectorContext(prev => ({
        ...prev,
        video: {
          ...prev.video,
          status: newMainStatus,
          subStatus: newSubStatus
        }
      }));
    }
    // NO cerrar automáticamente el popup - el componente StatusSelector maneja cuándo cerrarse
  };

  const handleIncomeCellClick = (day, event) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const incomeData = monthData.dailyIncomes[dateStr] || null;
    const cellRect = event.currentTarget.getBoundingClientRect();
    
    // Encontrar el contenedor de referencia para position absolute
    const mainContentWrapper = event.currentTarget.closest('.video-scheduler-main-content-wrapper') || document.body;
    const wrapperRect = mainContentWrapper.getBoundingClientRect();
    
    // Encontrar el contenedor con scroll real
    const scrollContainer = findScrollContainer(event.currentTarget);
    
    // Obtener el scroll actual
    const scrollTop = scrollContainer.scrollTop || 0;
    const scrollLeft = scrollContainer.scrollLeft || 0;
    
    console.log('=== DEBUG INFO ===');
    console.log('Scroll container:', scrollContainer.className || scrollContainer.tagName);
    console.log('Scroll top:', scrollTop);
    console.log('Cell rect (viewport):', cellRect);
    console.log('Wrapper rect (viewport):', wrapperRect);
    
    // MÉTODO ALTERNATIVO: Usar las coordenadas de viewport y restar la posición del wrapper
    // Esto debería ser más confiable
    const cellTopInWrapper = cellRect.top - wrapperRect.top;
    const cellLeftInWrapper = cellRect.left - wrapperRect.left;
    const cellRightInWrapper = cellRect.right - wrapperRect.left;
    
    console.log('Cell position in wrapper (before scroll):', {
      top: cellTopInWrapper,
      left: cellLeftInWrapper,
      right: cellRightInWrapper
    });
    
    // Solo agregar el scroll si realmente hay scroll
    const finalCellTop = cellTopInWrapper + scrollTop;
    const finalCellLeft = cellLeftInWrapper + scrollLeft;
    const finalCellRight = cellRightInWrapper + scrollLeft;
    
    console.log('Cell position in wrapper (after scroll):', {
      top: finalCellTop,
      left: finalCellLeft,
      right: finalCellRight
    });
    
    // Ancho estimado del popup de ingresos
    const incomeFormWidth = 320;
    
    // Posición por defecto: a la derecha de la celda
    let finalLeft = finalCellRight + 10;
    
    // Verificar si hay suficiente espacio a la derecha
    const wrapperWidth = wrapperRect.width;
    if (finalLeft + incomeFormWidth > wrapperWidth) {
        // Si no hay espacio a la derecha, ponerlo a la izquierda
        finalLeft = finalCellLeft - incomeFormWidth - 10;
    }
    
    // Asegurar que no se salga por la izquierda
    if (finalLeft < 10) {
        finalLeft = 10;
    }
    
    // Para la posición vertical, usar la posición calculada
    let finalTop = finalCellTop;
    
    // Asegurar que el popup esté visible (no muy arriba en la pantalla)
    const minVisibleTop = scrollTop + 10;
    if (finalTop < minVisibleTop) {
        finalTop = minVisibleTop;
    }

    console.log('Final popup position:', { top: finalTop, left: finalLeft });
    console.log('=== END DEBUG ===');

    setIncomeFormContext({ 
        day, 
        incomeData, 
        position: { 
            top: finalTop,
            left: finalLeft
        } 
    });
    setShowIncomeForm(true);
    setShowStatusSelector(false); 
  };

  const handleIncomeSave = async (day, newIncomeData) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    await plugin.publicAPI.setDailyIncome(dateStr, newIncomeData);
    refreshCalendarDataSilently(); // Usar función silenciosa para evitar scroll
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

  // Solo mostrar loading durante la carga inicial, no durante actualizaciones
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