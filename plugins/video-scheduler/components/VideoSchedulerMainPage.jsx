// video-scheduler/components/VideoSchedulerMainPage.jsx
import React from "react";
import DayCell from "./DayCell.jsx";
import VideoSlotCell from "./VideoSlotCell.jsx";
import DaySummaryCell from "./DaySummaryCell.jsx";
import DailyIncomeCell from "./DailyIncomeCell.jsx";
import StatusSelector from "./StatusSelector.jsx";
import DailyIncomeForm from "./DailyIncomeForm.jsx";
import StatsPanel from "./StatsPanel.jsx";
import StatsOverviewPanel from "./StatsOverviewPanel.jsx";
import BulkAddForm from "./BulkAddForm.jsx";
import CurrencyRateForm from "./CurrencyRateForm.jsx";
import VideoForm from "./VideoForm.jsx"; // <--- NUEVO: Importar VideoForm
import {
  VIDEO_MAIN_STATUS,
  DEFAULT_SLOT_VIDEO_STRUCTURE,
  ALL_SUPPORTED_CURRENCIES,
} from "../utils/constants.js";

function getMonthDetails(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { daysInMonth };
}
const WEEKDAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function VideoSchedulerMainPage(props) {
  const { plugin, core, pluginId } = props;

  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [monthData, setMonthData] = React.useState({
    videos: {},
    dailyIncomes: {},
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);

  const [showStatusSelector, setShowStatusSelector] = React.useState(false);
  const [statusSelectorContext, setStatusSelectorContext] =
    React.useState(null);
  const [showIncomeForm, setShowIncomeForm] = React.useState(false);
  const [incomeFormContext, setIncomeFormContext] = React.useState(null);
  const [showStatsPanel, setShowStatsPanel] = React.useState(false);
  const [showBulkAddForm, setShowBulkAddForm] = React.useState(false);
  const [showCurrencyRateForm, setShowCurrencyRateForm] = React.useState(false);
  const [showVideoForm, setShowVideoForm] = React.useState(false); // <--- NUEVO: Estado para VideoForm
  const [videoFormContext, setVideoFormContext] = React.useState(null); // <--- NUEVO: Contexto para VideoForm

  const [currencyConfiguration, setCurrencyConfiguration] = React.useState({
    mainUserCurrency: "USD",
    configuredIncomeCurrencies: ["USD", "EUR", "ARS"],
    currencyRates: { USD: 1, EUR: 1.08, ARS: 0.0011 },
  });

  const incomePopupConfig = {
    width: 320,
    height: 300,
    margin: 10,
    gapToCell: 10,
  };
  const statusSelectorPopupConfig = {
    width: 220,
    height: 280,
    margin: 10,
    gapToIcon: 10,
  };
  const currencyRatePopupConfig = { width: 700, margin: 10 };

  const findScrollContainer = () => {
    const appMain = document.querySelector(".app-main");
    if (appMain) return appMain;
    const appContent = document.querySelector(".app-content");
    if (appContent) return appContent;
    return document.documentElement;
  };

  React.useEffect(() => {
    const handleScroll = () => {
      if (
        showIncomeForm ||
        showStatusSelector ||
        showCurrencyRateForm ||
        showVideoForm
      ) {
        setShowIncomeForm(false);
        setIncomeFormContext(null);
        setShowStatusSelector(false);
        setStatusSelectorContext(null);
        setShowCurrencyRateForm(false);
        setShowVideoForm(false);
        setVideoFormContext(null); // <--- NUEVO: Cerrar VideoForm al hacer scroll
      }
    };
    const scrollContainer = findScrollContainer();
    if (scrollContainer && scrollContainer.addEventListener) {
      const target =
        scrollContainer === document.documentElement ||
        scrollContainer === document.body
          ? window
          : scrollContainer;
      target.addEventListener("scroll", handleScroll, { passive: true });
      return () => target.removeEventListener("scroll", handleScroll);
    }
  }, [showIncomeForm, showStatusSelector, showCurrencyRateForm, showVideoForm]); // <--- NUEVO: Dependencia de showVideoForm

  const refreshCalendarDataSilently = React.useCallback(async () => {
    if (plugin && plugin.publicAPI && plugin.publicAPI.getMonthViewData) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const data = await plugin.publicAPI.getMonthViewData(year, month);
      setMonthData(data);
      const config = await plugin.publicAPI.getCurrencyConfiguration();
      setCurrencyConfiguration(config);
    }
  }, [plugin, currentDate]);

  const refreshCalendarData = React.useCallback(async () => {
    if (plugin && plugin.publicAPI && plugin.publicAPI.getMonthViewData) {
      if (isInitialLoad) setIsLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const data = await plugin.publicAPI.getMonthViewData(year, month);
      setMonthData(data);
      const config = await plugin.publicAPI.getCurrencyConfiguration();
      setCurrencyConfiguration(config);
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  }, [plugin, currentDate, isInitialLoad]);

  React.useEffect(() => {
    refreshCalendarData();
  }, [refreshCalendarData]);

  const closeAllPopups = () => {
    setShowStatusSelector(false);
    setStatusSelectorContext(null);
    setShowIncomeForm(false);
    setIncomeFormContext(null);
    setShowCurrencyRateForm(false);
    setShowVideoForm(false);
    setVideoFormContext(null); // <--- NUEVO: Incluir VideoForm
    setShowBulkAddForm(false); // BulkAdd es modal, pero por consistencia
  };

  const handlePrevMonth = () => {
    closeAllPopups();
    setIsInitialLoad(true);
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };
  const handleNextMonth = () => {
    closeAllPopups();
    setIsInitialLoad(true);
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const handleVideoNameChange = async (day, slotIndex, newName) => {
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    await plugin.publicAPI.updateVideoName(dateStr, slotIndex, newName);
    refreshCalendarDataSilently();
  };

  const handleVideoDescriptionChange = async (
    day,
    slotIndex,
    newDescription
  ) => {
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    await plugin.publicAPI.updateVideoDescription(
      dateStr,
      slotIndex,
      newDescription
    );
    refreshCalendarDataSilently();
  };

  const handleStatusIconClick = (day, slotIndex, event) => {
    closeAllPopups(); // Cerrar otros popups antes de abrir uno nuevo
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const videoKey = `${dateStr}-${slotIndex}`;
    if (!monthData || !monthData.videos) return;
    const video = monthData.videos[videoKey] || {
      ...DEFAULT_SLOT_VIDEO_STRUCTURE,
      id: videoKey,
      stackableStatuses: [],
    };
    const wrapper = event.currentTarget.closest(
      ".video-scheduler-main-content-wrapper"
    );
    if (!wrapper) return;
    const iconRect = event.currentTarget.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    const {
      width: popupWidth,
      height: popupHeightEstimate,
      margin: popupMargin,
      gapToIcon,
    } = statusSelectorPopupConfig;
    let finalLeft = iconRect.right - wrapperRect.left + gapToIcon;
    if (finalLeft + popupWidth > wrapper.clientWidth - popupMargin)
      finalLeft = iconRect.left - wrapperRect.left - popupWidth - gapToIcon;
    if (finalLeft < popupMargin)
      finalLeft = Math.max(popupMargin, (wrapper.clientWidth - popupWidth) / 2);
    let finalTop =
      iconRect.top -
      wrapperRect.top +
      iconRect.height / 2 -
      popupHeightEstimate / 2;
    const header = wrapper.querySelector(".page-header-controls");
    const headerHeight = header ? header.offsetHeight : 0;
    const minTopPosition = headerHeight + popupMargin;
    const maxBottomEdgeOfPopup = wrapper.clientHeight - popupMargin;
    if (finalTop < minTopPosition) finalTop = minTopPosition;
    if (finalTop + popupHeightEstimate > maxBottomEdgeOfPopup)
      finalTop = Math.max(
        minTopPosition,
        maxBottomEdgeOfPopup - popupHeightEstimate
      );
    setStatusSelectorContext({
      day,
      slotIndex,
      video,
      position: { top: finalTop, left: finalLeft },
    });
    setShowStatusSelector(true);
  };

  const handleStatusChange = async (
    newMainStatus,
    newSubStatus,
    newStackableStatuses = []
  ) => {
    if (statusSelectorContext && statusSelectorContext.video) {
      const { day, slotIndex } = statusSelectorContext;
      const dateStr = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      await plugin.publicAPI.updateVideoStatus(
        dateStr,
        slotIndex,
        newMainStatus,
        newSubStatus,
        newStackableStatuses
      );
      refreshCalendarDataSilently();
      // No cerramos el selector aquí, se cierra desde el propio selector o por scroll/escape
    }
  };

  const handleIncomeCellClick = (day, event) => {
    closeAllPopups();
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const incomeData = monthData?.dailyIncomes?.[dateStr] || null;
    const wrapper = event.currentTarget.closest(
      ".video-scheduler-main-content-wrapper"
    );
    if (!wrapper) return;
    const cellRect = event.currentTarget.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    const {
      width: popupWidth,
      height: popupHeight,
      margin,
      gapToCell,
    } = incomePopupConfig;
    let finalLeft = cellRect.left - wrapperRect.left - popupWidth - gapToCell;
    if (finalLeft < margin)
      finalLeft = cellRect.right - wrapperRect.left + gapToCell;
    if (finalLeft + popupWidth > wrapper.clientWidth - margin)
      finalLeft = Math.max(margin, wrapper.clientWidth - popupWidth - margin);
    let finalTop = cellRect.top - wrapperRect.top;
    const header = wrapper.querySelector(".page-header-controls");
    const headerHeight = header ? header.offsetHeight : 0;
    const footerStatsPanel = wrapper.querySelector(".stats-tab-content"); // Asumiendo que este es el panel inferior
    const footerStatsPanelHeight = footerStatsPanel
      ? footerStatsPanel.offsetHeight
      : 0;
    const minTopPosition = headerHeight + margin;
    const maxBottomEdgeOfPopup =
      wrapper.clientHeight - footerStatsPanelHeight - margin;
    if (finalTop + popupHeight > maxBottomEdgeOfPopup)
      finalTop = Math.max(
        minTopPosition,
        cellRect.bottom - wrapperRect.top - popupHeight
      );
    if (finalTop < minTopPosition) finalTop = minTopPosition;
    setIncomeFormContext({
      day,
      incomeData,
      position: {
        top: finalTop,
        left: finalLeft,
        width: `${popupWidth}px`,
        height: `${popupHeight}px`,
      },
    });
    setShowIncomeForm(true);
  };

  const handleIncomeSave = async (day, newIncomeData) => {
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    await plugin.publicAPI.setDailyIncome(dateStr, newIncomeData);
    refreshCalendarDataSilently();
    setShowIncomeForm(false);
    setIncomeFormContext(null);
  };

  const handleBulkAddSave = async (schedule) => {
    try {
      for (const item of schedule) {
        await plugin.publicAPI.updateVideoName(
          item.dateStr,
          item.slotIndex,
          item.name
        );
        if (item.status !== VIDEO_MAIN_STATUS.PENDING)
          await plugin.publicAPI.updateVideoStatus(
            item.dateStr,
            item.slotIndex,
            item.status,
            null,
            []
          );
        if (item.description)
          await plugin.publicAPI.updateVideoDescription(
            item.dateStr,
            item.slotIndex,
            item.description
          );
      }
      refreshCalendarDataSilently();
      setShowBulkAddForm(false);
      const monthsInvolved = [
        ...new Set(
          schedule.map((item) => `${getMonthName(item.month)} ${item.year}`)
        ),
      ];
      alert(
        `✅ ${schedule.length} videos creados (${monthsInvolved.join(", ")})`
      );
    } catch (error) {
      console.error("Error al crear videos en lote:", error);
      alert("❌ Error al crear los videos. Revisa la consola.");
      throw error;
    }
  };

  const getMonthName = (monthIndex) =>
    [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ][monthIndex] || "Mes desconocido";

  const handleOpenCurrencyRateForm = () => {
    closeAllPopups();
    setShowCurrencyRateForm(true);
  };

  const handleCurrencyRateSave = async (
    mainCurrency,
    incomeCurrencies,
    rates
  ) => {
    try {
      await plugin.publicAPI.saveCurrencyConfiguration(
        mainCurrency,
        incomeCurrencies,
        rates
      );
      const newConfig = await plugin.publicAPI.getCurrencyConfiguration();
      setCurrencyConfiguration(newConfig);
      refreshCalendarDataSilently();
      setShowCurrencyRateForm(false);
      alert("✅ Configuración de moneda guardada.");
    } catch (error) {
      console.error("Error al guardar config. de moneda:", error);
      alert("❌ Error al guardar la configuración.");
    }
  };

  // --- NUEVAS FUNCIONES PARA VIDEOFORM ---
  const handleOpenDetailsForm = (day, slotIndex, videoDataFromCell) => {
    closeAllPopups();
    // Asegurarnos de que tenemos los datos completos del video
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const videoKey = `${dateStr}-${slotIndex}`;
    const fullVideoData = monthData?.videos?.[videoKey] ||
      videoDataFromCell || { ...DEFAULT_SLOT_VIDEO_STRUCTURE, id: videoKey };

    setVideoFormContext({
      day,
      slotIndex,
      ...fullVideoData, // Esparcir todos los datos del video
    });
    setShowVideoForm(true);
  };

  const handleSaveVideoDetails = async (day, slotIndex, details) => {
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    await plugin.publicAPI.updateVideoDetails(dateStr, slotIndex, details);
    refreshCalendarDataSilently();
    setShowVideoForm(false);
    setVideoFormContext(null);
  };
  // --- FIN NUEVAS FUNCIONES PARA VIDEOFORM ---

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const { daysInMonth } = getMonthDetails(year, month);
  const monthNameStr = getMonthName(month); // Usar getMonthName para consistencia

  const tableHeader = React.createElement(
    "thead",
    { key: "cal-head" },
    React.createElement(
      "tr",
      null,
      ["Día", "7am", "15pm", "22pm", "Resumen", "Ingresos"].map((headerText) =>
        React.createElement("th", { key: headerText }, headerText)
      )
    )
  );

  const tableBodyRows = [];
  if (!isLoading && monthData && monthData.videos && monthData.dailyIncomes) {
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      const dayDate = new Date(year, month, day);
      const dayName = WEEKDAY_NAMES[dayDate.getDay()];
      const videosForDay = [0, 1, 2].map((slotIndex) => {
        const videoKey = `${dateStr}-${slotIndex}`;
        return (
          monthData.videos[videoKey] || {
            ...DEFAULT_SLOT_VIDEO_STRUCTURE,
            id: videoKey,
            status: VIDEO_MAIN_STATUS.PENDING,
            stackableStatuses: [],
          }
        );
      });
      const currentDailyIncome = monthData.dailyIncomes[dateStr] || null;
      tableBodyRows.push(
        React.createElement(
          "tr",
          { key: `day-row-${day}`, className: "calendar-row" },
          [
            React.createElement(DayCell, {
              key: `daycell-${day}`,
              dayNumber: day,
              dayName: dayName,
            }),
            ...videosForDay.map((video, slotIndex) =>
              React.createElement(VideoSlotCell, {
                key: `videoslot-${day}-${slotIndex}`,
                day,
                slotIndex,
                videoData: video,
                onNameChange: handleVideoNameChange,
                onDescriptionChange: handleVideoDescriptionChange,
                onStatusIconClick: (d, s, e) => handleStatusIconClick(d, s, e),
                onOpenDetailsForm: handleOpenDetailsForm, // <--- NUEVO: Pasar callback
              })
            ),
            React.createElement(DaySummaryCell, {
              key: `summary-${day}`,
              videosForDay,
            }),
            React.createElement(DailyIncomeCell, {
              key: `incomecell-${day}`,
              day,
              dailyIncomeData: currentDailyIncome,
              onIncomeCellClick: (d, e) => handleIncomeCellClick(d, e),
            }),
          ]
        )
      );
    }
  }
  const tableBody = React.createElement(
    "tbody",
    { key: "cal-body" },
    tableBodyRows
  );

  if (isLoading && isInitialLoad)
    return React.createElement(
      "p",
      { key: "loading", className: "loading-message-placeholder" },
      "Cargando calendario..."
    );

  return React.createElement("div", { className: "video-scheduler-page" }, [
    React.createElement(
      "div",
      {
        key: "main-wrapper",
        className: "video-scheduler-main-content-wrapper",
      },
      [
        React.createElement(
          "header",
          { key: "page-header", className: "page-header-controls" },
          [
            React.createElement(
              "div",
              { key: "month-nav", className: "month-navigation" },
              [
                React.createElement(
                  "button",
                  { key: "prev-month", onClick: handlePrevMonth },
                  "← Mes Anterior"
                ),
                React.createElement(
                  "h2",
                  { key: "current-month-display" },
                  `${monthNameStr} ${year}`
                ),
                React.createElement(
                  "button",
                  { key: "next-month", onClick: handleNextMonth },
                  "Mes Siguiente →"
                ),
              ]
            ),
            React.createElement(
              "div",
              {
                key: "global-actions",
                className: "video-scheduler-global-actions",
              },
              [
                React.createElement(
                  "button",
                  {
                    key: "bulk-add-btn",
                    className: "global-action-button",
                    onClick: () => {
                      closeAllPopups();
                      setShowBulkAddForm(true);
                    },
                  },
                  [
                    React.createElement(
                      "span",
                      { className: "material-icons", key: "icon" },
                      "playlist_add"
                    ),
                    "Añadir en Lote",
                  ]
                ),
                React.createElement(
                  "button",
                  {
                    key: "currency-rate-btn",
                    className: "global-action-button",
                    onClick: handleOpenCurrencyRateForm,
                  },
                  [
                    React.createElement(
                      "span",
                      { className: "material-icons", key: "icon" },
                      "currency_exchange"
                    ),
                    "Monedas",
                  ]
                ),
                React.createElement(
                  "button",
                  {
                    key: "stats-btn",
                    className: "global-action-button",
                    onClick: () => {
                      closeAllPopups();
                      setShowStatsPanel(true);
                    },
                  },
                  [
                    React.createElement(
                      "span",
                      { className: "material-icons", key: "icon" },
                      "insights"
                    ),
                    "Estadísticas",
                  ]
                ),
              ]
            ),
          ]
        ),
        React.createElement(
          "div",
          { key: "calendar-container", className: "calendar-container" },
          [
            React.createElement(
              "table",
              { key: "calendar-grid", className: "calendar-grid" },
              [tableHeader, tableBody]
            ),
          ]
        ),

        showStatusSelector &&
          statusSelectorContext &&
          statusSelectorContext.video &&
          React.createElement(StatusSelector, {
            key: "status-selector-instance",
            currentMainStatus: statusSelectorContext.video.status,
            currentSubStatus: statusSelectorContext.video.subStatus,
            currentStackableStatuses:
              statusSelectorContext.video.stackableStatuses || [],
            onStatusChange: handleStatusChange,
            onCancel: () => {
              setShowStatusSelector(false);
              setStatusSelectorContext(null);
            },
            styleProps: statusSelectorContext.position,
          }),
        showIncomeForm &&
          incomeFormContext &&
          React.createElement(DailyIncomeForm, {
            key: "income-form-instance",
            day: incomeFormContext.day,
            existingIncome: incomeFormContext.incomeData,
            onSave: handleIncomeSave,
            onCancel: () => {
              setShowIncomeForm(false);
              setIncomeFormContext(null);
            },
            styleProps: incomeFormContext.position,
            plugin: plugin,
          }),
        showStatsPanel &&
          React.createElement(StatsPanel, {
            key: "stats-panel-instance",
            monthData: monthData,
            currentDate: currentDate,
            plugin: plugin,
            onClose: () => setShowStatsPanel(false),
          }),
        showBulkAddForm &&
          React.createElement(BulkAddForm, {
            key: "bulk-add-form-instance",
            currentDate: currentDate,
            plugin: plugin,
            onSave: handleBulkAddSave,
            onCancel: () => setShowBulkAddForm(false),
            styleProps: {},
          }),
        showCurrencyRateForm &&
          React.createElement(CurrencyRateForm, {
            key: "currency-rate-form-instance",
            initialConfiguration: currencyConfiguration,
            onSave: handleCurrencyRateSave,
            onCancel: () => setShowCurrencyRateForm(false),
            styleProps: { width: `${currencyRatePopupConfig.width}px` },
            plugin: plugin,
          }),
        // --- NUEVO: Renderizar VideoForm ---
        showVideoForm &&
          videoFormContext &&
          React.createElement(VideoForm, {
            key: "video-form-instance",
            videoData: videoFormContext, // Pasar todos los datos del video, incluyendo day y slotIndex si es necesario
            onSave: handleSaveVideoDetails,
            onCancel: () => {
              setShowVideoForm(false);
              setVideoFormContext(null);
            },
            plugin: plugin,
          }),
        // --- FIN NUEVO ---
      ]
    ),
    !isLoading &&
      React.createElement(StatsOverviewPanel, {
        key: "footer-stats-panel",
        monthData: monthData,
        currentDate: currentDate,
        plugin: plugin,
        compact: false, // Siempre modo completo para el footer
      }),
  ]);
}

export default VideoSchedulerMainPage;
