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
import VideoForm from "./VideoForm.jsx";
// Los modales ImportExportModal y ResetDataModal se reciben como props
import {
  VIDEO_MAIN_STATUS,
  DEFAULT_SLOT_VIDEO_STRUCTURE,
  // ALL_SUPPORTED_CURRENCIES, // No se usa directamente aquí
} from "../utils/constants.js";

function getMonthDetails(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { daysInMonth };
}
const WEEKDAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function VideoSchedulerMainPage(props) {
  const { plugin, core, pluginId, ImportExportModal, ResetDataModal } = props;

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
  const [showVideoForm, setShowVideoForm] = React.useState(false);
  const [videoFormContext, setVideoFormContext] = React.useState(null);
  const [showImportExportModal, setShowImportExportModal] =
    React.useState(false);
  const [showResetDataModal, setShowResetDataModal] = React.useState(false);

  const [currencyConfiguration, setCurrencyConfiguration] = React.useState({
    mainUserCurrency: "USD",
    configuredIncomeCurrencies: ["USD", "EUR", "ARS"],
    currencyRates: { USD: 1, EUR: 1.08, ARS: 0.0011 },
  });

  const incomePopupConfig = { width: 320, margin: 10, gapToCell: 10 };
  const statusSelectorPopupConfig = { width: 220, margin: 10, gapToIcon: 10 };
  const currencyRatePopupConfig = { width: 700, margin: 10 };

  const findScrollContainer = () => {
    const appMain = document.querySelector(".app-main");
    if (appMain) return appMain;
    const appContent = document.querySelector(".app-content");
    if (appContent) return appContent;
    return document.documentElement;
  };

  React.useEffect(() => {
    const anyPopupOpen =
      showIncomeForm ||
      showStatusSelector ||
      showCurrencyRateForm ||
      showVideoForm ||
      showBulkAddForm ||
      showImportExportModal ||
      showResetDataModal;

    if (!anyPopupOpen) return; // No añadir listener si no hay popups/modales

    const handleScroll = () => {
      closeAllPopups();
    };
    const scrollContainer = findScrollContainer();
    let target = window;
    if (
      scrollContainer &&
      scrollContainer !== document.documentElement &&
      scrollContainer !== document.body
    ) {
      target = scrollContainer;
    }

    target.addEventListener("scroll", handleScroll, { passive: true });
    return () => target.removeEventListener("scroll", handleScroll);
  }, [
    showIncomeForm,
    showStatusSelector,
    showCurrencyRateForm,
    showVideoForm,
    showBulkAddForm,
    showImportExportModal,
    showResetDataModal, // Dependencias de todos los popups/modales
  ]);

  const refreshCalendarDataSilently = React.useCallback(async () => {
    if (plugin && plugin.publicAPI && plugin.publicAPI.getMonthViewData) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      try {
        const data = await plugin.publicAPI.getMonthViewData(year, month);
        setMonthData(data);
        const config = await plugin.publicAPI.getCurrencyConfiguration();
        setCurrencyConfiguration(config);
      } catch (error) {
        console.error(
          `[${pluginId}] Error en refreshCalendarDataSilently:`,
          error
        );
      }
    }
  }, [plugin, currentDate, pluginId]);

  const refreshCalendarData = React.useCallback(
    async (forceInitialState = false) => {
      if (plugin && plugin.publicAPI && plugin.publicAPI.getMonthViewData) {
        if (forceInitialState || isInitialLoad) {
          // Usar isInitialLoad para la primera carga real
          setIsLoading(true);
        }
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        try {
          console.log(
            `[${pluginId}-MainPage] Refreshing calendar data for ${year}-${
              month + 1
            }`
          );
          const data = await plugin.publicAPI.getMonthViewData(year, month);
          console.log(`[${pluginId}-MainPage] Data received:`, data);
          setMonthData(data);
          const config = await plugin.publicAPI.getCurrencyConfiguration();
          setCurrencyConfiguration(config);
        } catch (error) {
          console.error(`[${pluginId}] Error en refreshCalendarData:`, error);
        } finally {
          setIsLoading(false);
          if (isInitialLoad) {
            // Solo setear isInitialLoad a false en la primera carga real del mes
            setIsInitialLoad(false);
          }
        }
      }
    },
    [plugin, currentDate, isInitialLoad, pluginId]
  );

  React.useEffect(() => {
    // El primer refreshCalendarData se hace aquí, marcándolo como la carga inicial.
    // El argumento `true` es para `forceInitialState` en refreshCalendarData.
    if (isInitialLoad) {
      // Solo si es la carga inicial del componente o cambio de mes
      refreshCalendarData(true);
    }
  }, [currentDate, isInitialLoad, refreshCalendarData]); // Depender de isInitialLoad y currentDate

  React.useEffect(() => {
    if (!core || !core.events || !pluginId) return;

    const handleCurrencyConfigChanged = () => {
      console.log(
        `[${pluginId}-MainPage] Currency config changed event received, refreshing silently.`
      );
      refreshCalendarDataSilently();
    };
    const handleDataImportedOrReset = () => {
      console.log(
        `[${pluginId}-MainPage] Data imported/reset event received, forcing full calendar refresh.`
      );
      setIsInitialLoad(true); // Forzar a que la próxima carga de datos muestre "Cargando..."
      // No llamamos a refreshCalendarData aquí directamente,
      // el cambio de isInitialLoad y el useEffect de currentDate/isInitialLoad se encargarán.
      // O, para forzarlo inmediatamente si currentDate no cambia:
      refreshCalendarData(true);
    };
    const handleRequestOpenCurrencyModal = () => {
      console.log(
        `[${pluginId}-MainPage] Request to open currency modal received.`
      );
      closeAllPopups();
      setShowCurrencyRateForm(true);
    };

    const unsubConfig = core.events.subscribe(
      pluginId,
      `${pluginId}.currencyConfigChanged`,
      handleCurrencyConfigChanged
    );
    const unsubImport = core.events.subscribe(
      pluginId,
      `${pluginId}.dataImportedRefresh`,
      handleDataImportedOrReset
    );
    const unsubReset = core.events.subscribe(
      pluginId,
      `${pluginId}.dataResetRefresh`,
      handleDataImportedOrReset
    );
    const unsubOpenModal = core.events.subscribe(
      pluginId,
      `${pluginId}.requestOpenCurrencyModal`,
      handleRequestOpenCurrencyModal
    );

    return () => {
      if (typeof unsubConfig === "function") unsubConfig();
      if (typeof unsubImport === "function") unsubImport();
      if (typeof unsubReset === "function") unsubReset();
      if (typeof unsubOpenModal === "function") unsubOpenModal();
    };
  }, [core, pluginId, refreshCalendarDataSilently, refreshCalendarData]); // Añadido refreshCalendarData como dependencia

  const closeAllPopups = () => {
    setShowStatusSelector(false);
    setStatusSelectorContext(null);
    setShowIncomeForm(false);
    setIncomeFormContext(null);
    setShowCurrencyRateForm(false);
    setShowVideoForm(false);
    setVideoFormContext(null);
    setShowBulkAddForm(false);
    setShowImportExportModal(false);
    setShowResetDataModal(false);
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
    closeAllPopups();
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
      margin: popupMargin,
      gapToIcon,
    } = statusSelectorPopupConfig;
    let finalLeft = iconRect.right - wrapperRect.left + gapToIcon;
    if (finalLeft + popupWidth > wrapper.clientWidth - popupMargin)
      finalLeft = iconRect.left - wrapperRect.left - popupWidth - gapToIcon;
    if (finalLeft < popupMargin)
      finalLeft = Math.max(popupMargin, (wrapper.clientWidth - popupWidth) / 2);

    const tempPopup = document.createElement("div");
    tempPopup.className = "status-selector-popup";
    tempPopup.style.visibility = "hidden";
    tempPopup.style.position = "absolute";
    document.body.appendChild(tempPopup);
    const popupHeightEstimate = tempPopup.offsetHeight || 280;
    document.body.removeChild(tempPopup);

    let finalTop =
      iconRect.top -
      wrapperRect.top +
      iconRect.height / 2 -
      popupHeightEstimate / 2;
    const headerEl = wrapper.querySelector(".page-header-controls");
    const headerHeight = headerEl ? headerEl.offsetHeight : 0;
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
      position: { top: finalTop, left: finalLeft, height: "auto" },
    });
    setShowStatusSelector(true);
  };

  const handleStatusChange = async (
    newMainStatusFromSelector,
    newSubStatusFromSelector,
    newStackableStatusesFromSelector = []
  ) => {
    if (statusSelectorContext && statusSelectorContext.video) {
      const {
        day,
        slotIndex,
        video: videoBeforeChangeInPopup,
      } = statusSelectorContext;
      const dateStr = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const videoAfterUpdateInBackend =
        await plugin.publicAPI.updateVideoStatus(
          dateStr,
          slotIndex,
          newMainStatusFromSelector,
          newSubStatusFromSelector,
          newStackableStatusesFromSelector
        );
      setStatusSelectorContext((prevContext) => {
        if (!prevContext) return null;
        return {
          ...prevContext,
          video: {
            ...videoBeforeChangeInPopup,
            status: videoAfterUpdateInBackend.status,
            subStatus: videoAfterUpdateInBackend.subStatus,
            stackableStatuses: videoAfterUpdateInBackend.stackableStatuses,
            updatedAt: videoAfterUpdateInBackend.updatedAt,
          },
        };
      });
      refreshCalendarDataSilently();
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
    const { width: popupWidth, margin, gapToCell } = incomePopupConfig;
    let finalLeft = cellRect.left - wrapperRect.left - popupWidth - gapToCell;
    if (finalLeft < margin)
      finalLeft = cellRect.right - wrapperRect.left + gapToCell;
    if (finalLeft + popupWidth > wrapper.clientWidth - margin)
      finalLeft = Math.max(margin, wrapper.clientWidth - popupWidth - margin);

    const tempPopup = document.createElement("div");
    tempPopup.className = "daily-income-form-popup";
    tempPopup.style.visibility = "hidden";
    tempPopup.style.position = "absolute";
    tempPopup.style.width = `${popupWidth}px`;
    document.body.appendChild(tempPopup);
    const popupHeight = tempPopup.offsetHeight || 300;
    document.body.removeChild(tempPopup);

    let finalTop = cellRect.top - wrapperRect.top;
    const headerEl = wrapper.querySelector(".page-header-controls");
    const headerHeight = headerEl ? headerEl.offsetHeight : 0;
    const footerStatsPanel = wrapper.querySelector(".stats-tab-content");
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
        height: "auto",
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

  const handleIncomeDelete = async (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    await plugin.publicAPI.deleteDailyIncome(dateStr);
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
      const successMessage = `✅ ${
        schedule.length
      } videos creados (${monthsInvolved.join(", ")})`;
      if (core && core.dialogs && core.dialogs.alert)
        await core.dialogs.alert(successMessage, "Creación en Lote Exitosa");
      else alert(successMessage);
    } catch (error) {
      console.error("Error al crear videos en lote:", error);
      const errorMessage = "❌ Error al crear los videos. Revisa la consola.";
      if (core && core.dialogs && core.dialogs.alert)
        await core.dialogs.alert(errorMessage, "Error en Creación en Lote");
      else alert(errorMessage);
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
      setShowCurrencyRateForm(false);
      const successMessage = "✅ Configuración de moneda guardada.";
      if (core && core.dialogs && core.dialogs.alert)
        await core.dialogs.alert(successMessage, "Configuración Guardada");
      else alert(successMessage);
      // El evento 'currencyConfigChanged' escuchado en useEffect se encargará de llamar a refreshCalendarDataSilently
    } catch (error) {
      console.error("Error al guardar config. de moneda:", error);
      const errorMessage = "❌ Error al guardar la configuración.";
      if (core && core.dialogs && core.dialogs.alert)
        await core.dialogs.alert(errorMessage, "Error al Guardar");
      else alert(errorMessage);
    }
  };

  const handleOpenDetailsForm = (day, slotIndex, videoDataFromCell) => {
    closeAllPopups();
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const videoKey = `${dateStr}-${slotIndex}`;
    const fullVideoData = monthData?.videos?.[videoKey] ||
      videoDataFromCell || { ...DEFAULT_SLOT_VIDEO_STRUCTURE, id: videoKey };
    setVideoFormContext({ day, slotIndex, ...fullVideoData });
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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const { daysInMonth } = getMonthDetails(year, month);
  const monthNameStr = getMonthName(month);

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
  // Solo generar filas si NO está cargando Y hay datos
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
                onOpenDetailsForm: handleOpenDetailsForm,
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

  if (isLoading) {
    // Mostrar mensaje de carga si isLoading es true
    return React.createElement(
      "div",
      { className: "video-scheduler-page-loading" }, // Usar una clase para estilizar el contenedor de carga
      React.createElement(
        "p",
        { key: "loading", className: "loading-message-placeholder" },
        "Cargando calendario..."
      )
    );
  }

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
                    title: "Añadir videos en lote",
                  },
                  [
                    React.createElement(
                      "span",
                      { className: "material-icons", key: "icon" },
                      "playlist_add"
                    ),
                    "Añadir Lote",
                  ]
                ),
                React.createElement(
                  "button",
                  {
                    key: "currency-rate-btn",
                    className: "global-action-button",
                    onClick: handleOpenCurrencyRateForm,
                    title: "Configurar monedas y tasas de cambio",
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
                    title: "Ver estadísticas del mes",
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
                React.createElement(
                  "button",
                  {
                    key: "import-export-btn",
                    className: "global-action-button",
                    onClick: () => {
                      closeAllPopups();
                      setShowImportExportModal(true);
                    },
                    title: "Importar o exportar datos del plugin",
                  },
                  [
                    React.createElement(
                      "span",
                      { className: "material-icons", key: "icon" },
                      "import_export"
                    ),
                    "Import/Export",
                  ]
                ),
                React.createElement(
                  "button",
                  {
                    key: "reset-data-btn",
                    className: "global-action-button danger",
                    onClick: () => {
                      closeAllPopups();
                      setShowResetDataModal(true);
                    },
                    title: "Restablecer datos del plugin",
                  },
                  [
                    React.createElement(
                      "span",
                      { className: "material-icons", key: "icon" },
                      "restart_alt"
                    ),
                    "Resetear",
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
            styleProps: { ...statusSelectorContext.position, height: "auto" },
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
            onDelete: handleIncomeDelete,
            styleProps: { ...incomeFormContext.position, height: "auto" },
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
        showVideoForm &&
          videoFormContext &&
          React.createElement(VideoForm, {
            key: "video-form-instance",
            videoData: videoFormContext,
            onSave: handleSaveVideoDetails,
            onCancel: () => {
              setShowVideoForm(false);
              setVideoFormContext(null);
            },
            plugin: plugin,
          }),
        ImportExportModal &&
          showImportExportModal &&
          React.createElement(ImportExportModal, {
            key: "import-export-modal-instance",
            plugin: plugin,
            core: core,
            pluginId: pluginId,
            onClose: () => setShowImportExportModal(false),
          }),
        ResetDataModal &&
          showResetDataModal &&
          React.createElement(ResetDataModal, {
            key: "reset-data-modal-instance",
            plugin: plugin,
            core: core,
            pluginId: pluginId,
            onClose: () => setShowResetDataModal(false),
            currentViewDate: currentDate,
          }),
      ]
    ),
    !isLoading &&
      React.createElement(StatsOverviewPanel, {
        key: "footer-stats-panel",
        monthData: monthData,
        currentDate: currentDate,
        plugin: plugin,
        compact: false,
      }),
  ]);
}

export default VideoSchedulerMainPage;
