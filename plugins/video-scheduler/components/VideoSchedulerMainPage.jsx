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
import CurrencyRateForm from './CurrencyRateForm.jsx'; // <--- NUEVA IMPORTACIÓN
import { VIDEO_MAIN_STATUS, DEFAULT_SLOT_VIDEO_STRUCTURE, CURRENCIES } from '../utils/constants.js'; // <--- CURRENCIES AÑADIDO

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
  const [showCurrencyRateForm, setShowCurrencyRateForm] = React.useState(false); // <--- NUEVO ESTADO
  const [currentRates, setCurrentRates] = React.useState({ USD: 870, EUR: 950, ARS: 1 }); // <--- NUEVO ESTADO
  const [currentDefaultCurrency, setCurrentDefaultCurrency] = React.useState('USD'); // <--- NUEVO ESTADO


  const incomePopupConfig = {
    width: 320,
    height: 300,
    margin: 10, 
    gapToCell: 10 
  };

  const statusSelectorPopupConfig = {
    width: 220, 
    height: 280, 
    margin: 10,  
    gapToIcon: 10 
  };

  // <--- NUEVO: Configuración para el popup de tasas de cambio --->
  const currencyRatePopupConfig = {
    width: 380,
    // height: 'auto', // La altura se ajustará al contenido
    margin: 10
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
      if (showIncomeForm || showStatusSelector || showCurrencyRateForm) { // <--- AÑADIDO showCurrencyRateForm
        setShowIncomeForm(false);
        setIncomeFormContext(null);
        setShowStatusSelector(false);
        setStatusSelectorContext(null);
        setShowCurrencyRateForm(false); // <--- AÑADIDO
      }
    };

    const scrollContainer = findScrollContainer();
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
  }, [showIncomeForm, showStatusSelector, showCurrencyRateForm]); // <--- AÑADIDO showCurrencyRateForm


  const refreshCalendarDataSilently = React.useCallback(async () => {
    if (plugin && plugin.publicAPI && plugin.publicAPI.getMonthViewData) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth(); 
      const data = await plugin.publicAPI.getMonthViewData(year, month);
      setMonthData(data);
      // También cargar tasas y moneda por defecto silenciosamente si es necesario
      const rates = await plugin.publicAPI.getCurrencyRates();
      setCurrentRates(rates);
      const defCurrency = await plugin.publicAPI.getDefaultCurrency();
      setCurrentDefaultCurrency(defCurrency);
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

      // <--- CARGAR TASAS Y MONEDA POR DEFECTO --->
      const rates = await plugin.publicAPI.getCurrencyRates();
      setCurrentRates(rates);
      const defCurrency = await plugin.publicAPI.getDefaultCurrency();
      setCurrentDefaultCurrency(defCurrency);
      // <--- FIN CARGA TASAS --->

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
      setShowCurrencyRateForm(false); // <--- AÑADIDO
      setIsInitialLoad(true);
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }
  const handleNextMonth = () => {
      setShowStatusSelector(false); setStatusSelectorContext(null);
      setShowIncomeForm(false); setIncomeFormContext(null);
      setShowCurrencyRateForm(false); // <--- AÑADIDO
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
    setShowCurrencyRateForm(false); // <--- AÑADIDO
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
    
    const footerStatsPanel = wrapper.querySelector('.stats-tab-content'); 
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
    setShowStatusSelector(false); 
    setStatusSelectorContext(null);
    setShowCurrencyRateForm(false); // <--- AÑADIDO
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
      console.log(`[VideoSchedulerMainPage] Procesando ${schedule.length} videos en lote multimes`);
      
      const monthGroups = schedule.reduce((acc, item) => {
        const monthKey = `${item.year}-${item.month}`;
        if (!acc[monthKey]) {
          acc[monthKey] = [];
        }
        acc[monthKey].push(item);
        return acc;
      }, {});
      
      console.log(`[VideoSchedulerMainPage] Videos agrupados en ${Object.keys(monthGroups).length} meses:`, monthGroups);
      
      for (const [monthKey, monthVideos] of Object.entries(monthGroups)) {
        console.log(`[VideoSchedulerMainPage] Procesando mes ${monthKey} con ${monthVideos.length} videos`);
        
        for (const item of monthVideos) {
          console.log(`[VideoSchedulerMainPage] Creando video: ${item.dateStr} slot ${item.slotIndex} - ${item.name}`);
          
          await plugin.publicAPI.updateVideoName(item.dateStr, item.slotIndex, item.name);
          
          if (item.status !== VIDEO_MAIN_STATUS.PENDING) {
            await plugin.publicAPI.updateVideoStatus(item.dateStr, item.slotIndex, item.status, null, []);
          }
          
          if (item.description !== undefined && item.description !== '') {
            await plugin.publicAPI.updateVideoDescription(item.dateStr, item.slotIndex, item.description);
          }
        }
      }
      
      refreshCalendarDataSilently();
      setShowBulkAddForm(false);
      
      console.log(`[VideoSchedulerMainPage] Completado: ${schedule.length} videos creados exitosamente`);
      
      const monthsInvolved = [...new Set(schedule.map(item => `${getMonthName(item.month)} ${item.year}`))];
      const monthsText = monthsInvolved.length > 1 ? 
        `en ${monthsInvolved.join(', ')}` : 
        `en ${monthsInvolved[0]}`;
      
      alert(`✅ ${schedule.length} videos creados exitosamente ${monthsText}`);
      
    } catch (error) {
      console.error('Error al crear videos en lote multimes:', error);
      alert('❌ Error al crear los videos. Revisa la consola para más detalles.');
      throw error; 
    }
  };

  const getMonthName = (monthIndex) => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[monthIndex] || 'Mes desconocido';
  };

  // --- NUEVAS FUNCIONES PARA EL FORMULARIO DE TASAS DE CAMBIO ---
  const handleOpenCurrencyRateForm = () => {
    setShowCurrencyRateForm(true);
    setShowIncomeForm(false);
    setIncomeFormContext(null);
    setShowStatusSelector(false);
    setStatusSelectorContext(null);
  };

  const handleCurrencyRateSave = async (newRates, newDefaultCurrency) => {
    try {
      console.log(`[VideoSchedulerMainPage] Guardando tasas:`, newRates, `Moneda por defecto:`, newDefaultCurrency);
      await plugin.publicAPI.setCurrencyRates(newRates);
      await plugin.publicAPI.setDefaultCurrency(newDefaultCurrency);
      
      // Actualizar estado local y refrescar datos que dependen de las tasas (como el panel de stats)
      setCurrentRates(newRates);
      setCurrentDefaultCurrency(newDefaultCurrency);
      refreshCalendarDataSilently(); // Refresca stats y otros datos
      
      setShowCurrencyRateForm(false);
      alert('✅ Tasas de cambio y moneda por defecto guardadas.');
    } catch (error) {
      console.error('Error al guardar tasas de cambio:', error);
      alert('❌ Error al guardar las tasas. Revisa la consola.');
    }
  };
  // --- FIN NUEVAS FUNCIONES ---
  
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
            status: VIDEO_MAIN_STATUS.PENDING, 
            stackableStatuses: []
          };
      });
      const currentDailyIncome = monthData.dailyIncomes[dateStr] || null;

      tableBodyRows.push(
        React.createElement('tr', {
          key: `day-row-${day}`, 
          className: 'calendar-row' 
        }, [ 
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
            // --- NUEVO BOTÓN PARA TASAS DE CAMBIO ---
            React.createElement(
              'button',
              { 
                key: 'currency-rate-btn',
                className: 'global-action-button',
                onClick: handleOpenCurrencyRateForm // <--- NUEVA FUNCIÓN
              },
              '⚙️ Tasas Cambio' // Emoji de engranaje
            ),
            // --- FIN NUEVO BOTÓN ---
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
          styleProps: { }
        }),

        // --- NUEVO FORMULARIO DE TASAS DE CAMBIO ---
        showCurrencyRateForm && React.createElement(CurrencyRateForm, {
            key: 'currency-rate-form-instance',
            initialRates: currentRates,
            initialDefaultCurrency: currentDefaultCurrency,
            onSave: handleCurrencyRateSave,
            onCancel: () => setShowCurrencyRateForm(false),
            // Para centrar, no se necesitan props de posición complejas,
            // ya que el CSS del CurrencyRateForm lo manejará como un modal centrado.
            styleProps: { 
                width: `${currencyRatePopupConfig.width}px`,
                // height: `${currencyRatePopupConfig.height}px` // altura auto
            } 
        })
        // --- FIN NUEVO FORMULARIO ---
      ]),
      
      !isLoading && React.createElement(StatsOverviewPanel, {
        key: 'footer-stats-panel',
        monthData: monthData, 
        currentDate: currentDate,
        plugin: plugin,
        compact: false 
      })
    ]
  );
}

export default VideoSchedulerMainPage;