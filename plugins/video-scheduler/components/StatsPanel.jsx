// video-scheduler/components/StatsPanel.jsx
import React from "react";
import StatsOverviewPanel from "./StatsOverviewPanel.jsx";
import {
  VIDEO_MAIN_STATUS,
  VIDEO_SUB_STATUS,
  VIDEO_STACKABLE_STATUS,
  STATUS_EMOJIS,
  getCurrencySymbol, // Importar helper
} from "../utils/constants.js";

function StatsPanel({
  monthData: initialMonthData,
  currentDate,
  onClose,
  plugin,
}) {
  const modalRef = React.useRef(null);
  const [currentStatsDate, setCurrentStatsDate] = React.useState(
    new Date(currentDate)
  );
  const [compareMode, setCompareMode] = React.useState(false);
  const [compareDate, setCompareDate] = React.useState(
    new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
  );

  // Usar el monthData pasado como prop para el mes actual, y cargar para otros meses.
  const [currentStatsData, setCurrentStatsData] =
    React.useState(initialMonthData);
  const [compareStatsData, setCompareStatsData] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState("overview");
  const [isLoadingCompare, setIsLoadingCompare] = React.useState(false);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target))
        onClose();
    };
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const loadStatsForDate = React.useCallback(
    async (dateToLoad) => {
      try {
        const year = dateToLoad.getFullYear();
        const month = dateToLoad.getMonth();
        // Asegurarse de que publicAPI.getMonthViewData esté disponible (puede no estarlo en el primer render si el plugin aún no está 100% listo)
        if (plugin && plugin.publicAPI && plugin.publicAPI.getMonthViewData) {
          const data = await plugin.publicAPI.getMonthViewData(year, month);
          return data;
        }
        return { videos: {}, dailyIncomes: {} }; // Fallback
      } catch (error) {
        console.error(
          "Error al cargar datos de estadísticas para otra fecha:",
          error
        );
        return { videos: {}, dailyIncomes: {} };
      }
    },
    [plugin]
  );

  // Efecto para cargar datos del mes actual si cambia currentStatsDate
  React.useEffect(() => {
    // Si la fecha actual de stats es diferente de la fecha inicial del panel, cargar datos
    if (
      currentStatsDate.getFullYear() !== currentDate.getFullYear() ||
      currentStatsDate.getMonth() !== currentDate.getMonth()
    ) {
      const updateCurrentStats = async () => {
        const data = await loadStatsForDate(currentStatsDate);
        setCurrentStatsData(data);
      };
      updateCurrentStats();
    } else {
      // Si es la misma fecha, usar los datos iniciales ya pasados
      setCurrentStatsData(initialMonthData);
    }
  }, [currentStatsDate, currentDate, initialMonthData, loadStatsForDate]);

  React.useEffect(() => {
    if (compareMode) {
      const updateCompareStats = async () => {
        setIsLoadingCompare(true);
        const data = await loadStatsForDate(compareDate);
        setCompareStatsData(data);
        setIsLoadingCompare(false);
      };
      updateCompareStats();
    }
  }, [compareMode, compareDate, loadStatsForDate]);

  const handlePrevMonth = () =>
    setCurrentStatsDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  const handleNextMonth = () =>
    setCurrentStatsDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );

  const calculateVideoStats = (dataToCalc) => {
    // ... (sin cambios en esta función, ya que solo maneja videos)
    const stats = {
      [VIDEO_MAIN_STATUS.PENDING]: 0,
      [VIDEO_MAIN_STATUS.EMPTY]: 0,
      [VIDEO_MAIN_STATUS.DEVELOPMENT]: 0,
      [VIDEO_MAIN_STATUS.PRODUCTION]: 0,
      [VIDEO_MAIN_STATUS.PUBLISHED]: 0,
      [VIDEO_SUB_STATUS.REC]: 0,
      [VIDEO_SUB_STATUS.EDITING]: 0,
      [VIDEO_SUB_STATUS.THUMBNAIL]: 0,
      [VIDEO_SUB_STATUS.SCHEDULING_POST]: 0,
      [VIDEO_SUB_STATUS.SCHEDULED]: 0,
      [VIDEO_STACKABLE_STATUS.QUESTION]: 0,
      [VIDEO_STACKABLE_STATUS.WARNING]: 0,
      total: 0,
      withAlerts: 0,
      withQuestions: 0,
    };
    if (dataToCalc && dataToCalc.videos) {
      Object.values(dataToCalc.videos).forEach((video) => {
        stats.total++;
        if (video.status) stats[video.status]++;
        if (video.subStatus) stats[video.subStatus]++;
        if (video.stackableStatuses) {
          video.stackableStatuses.forEach((s) => {
            if (stats[s] !== undefined) stats[s]++;
            if (s === VIDEO_STACKABLE_STATUS.WARNING) stats.withAlerts++;
            if (s === VIDEO_STACKABLE_STATUS.QUESTION) stats.withQuestions++;
          });
        }
      });
    }
    return stats;
  };

  const calculateIncomeStats = (dataToCalc) => {
    // Obtener configuración de moneda del plugin
    const currencyConfig = plugin._pluginData.settings;
    const mainDisplayCurrency = currencyConfig.mainUserCurrency || "USD";
    const exchangeRates = currencyConfig.currencyRates || {
      [mainDisplayCurrency]: 1,
    };

    const incomeStats = {
      totalByCurrency: {},
      totalInMainCurrency: 0,
      paidByCurrency: {},
      pendingByCurrency: {},
      totalPaidInMainCurrency: 0,
      totalPendingInMainCurrency: 0,
    };

    if (dataToCalc && dataToCalc.dailyIncomes) {
      Object.values(dataToCalc.dailyIncomes).forEach((income) => {
        if (income && income.amount > 0) {
          const currency = income.currency;
          const amount = parseFloat(income.amount) || 0;
          const rateToMain =
            exchangeRates[currency] === undefined ? 0 : exchangeRates[currency];

          const amountInMainCurrency = amount * rateToMain;

          if (!incomeStats.totalByCurrency[currency])
            incomeStats.totalByCurrency[currency] = 0;
          incomeStats.totalByCurrency[currency] += amount;

          if (rateToMain > 0 || currency === mainDisplayCurrency) {
            incomeStats.totalInMainCurrency += amountInMainCurrency;
          }

          if (income.status === "paid") {
            if (!incomeStats.paidByCurrency[currency])
              incomeStats.paidByCurrency[currency] = 0;
            incomeStats.paidByCurrency[currency] += amount;
            if (rateToMain > 0 || currency === mainDisplayCurrency) {
              incomeStats.totalPaidInMainCurrency += amountInMainCurrency;
            }
          } else {
            if (!incomeStats.pendingByCurrency[currency])
              incomeStats.pendingByCurrency[currency] = 0;
            incomeStats.pendingByCurrency[currency] += amount;
            if (rateToMain > 0 || currency === mainDisplayCurrency) {
              incomeStats.totalPendingInMainCurrency += amountInMainCurrency;
            }
          }
        }
      });
    }
    return incomeStats;
  };

  const videoStats = calculateVideoStats(currentStatsData);
  const incomeStats = calculateIncomeStats(currentStatsData);
  const compareVideoStats =
    compareMode && compareStatsData
      ? calculateVideoStats(compareStatsData)
      : null;
  const compareIncomeStats =
    compareMode && compareStatsData
      ? calculateIncomeStats(compareStatsData)
      : null;

  const mainDisplayCurrency =
    plugin._pluginData.settings.mainUserCurrency || "USD";

  const monthName = currentStatsDate.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });
  const compareMonthName = compareDate.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  const formatCurrency = (amount, currencyCode) => {
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${Math.round(amount).toLocaleString(
      "es-ES"
    )} ${currencyCode}`;
  };

  const BarChart = ({ data, title, maxValue }) => {
    // ... (sin cambios en BarChart)
    const chartBars = Object.entries(data).map(([key, value]) => {
      const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
      return React.createElement(
        "div",
        { key: `bar-item-${key}`, className: "chart-bar-item" },
        React.createElement("div", { className: "chart-bar-container" }, [
          React.createElement("div", {
            key: `bar-fill-${key}`,
            className: "chart-bar",
            style: { width: `${percentage}%` },
          }),
          React.createElement(
            "span",
            { key: `bar-label-${key}`, className: "chart-bar-label" },
            `${STATUS_EMOJIS[key] || ""} ${value}`
          ),
        ])
      );
    });
    return React.createElement("div", { className: "simple-bar-chart" }, [
      React.createElement("h5", { key: "chart-title" }, title),
      React.createElement(
        "div",
        { key: "chart-bars", className: "chart-bars" },
        chartBars
      ),
    ]);
  };

  const renderTabButtons = () => {
    const tabs = [
      { id: "overview", label: "Vista General", icon: "dashboard" },
      { id: "charts", label: "Gráficos", icon: "bar_chart" },
      { id: "compare", label: "Comparar", icon: "compare_arrows" },
    ];
    const tabButtons = tabs.map((tab) =>
      React.createElement(
        "button",
        {
          key: `tab-button-${tab.id}`,
          className: `stats-tab ${activeTab === tab.id ? "active" : ""}`,
          onClick: () => {
            setActiveTab(tab.id);
            if (tab.id === "compare" && !compareMode) setCompareMode(true);
          },
        },
        [
          React.createElement(
            "span",
            { className: "material-icons", key: "icon" },
            tab.icon
          ),
          tab.label,
        ]
      )
    );
    return React.createElement("div", { className: "stats-tabs" }, tabButtons);
  };

  const renderChartsTab = () => {
    const mainStatesData = {
      [VIDEO_MAIN_STATUS.PENDING]: videoStats[VIDEO_MAIN_STATUS.PENDING],
      [VIDEO_MAIN_STATUS.DEVELOPMENT]:
        videoStats[VIDEO_MAIN_STATUS.DEVELOPMENT],
      [VIDEO_MAIN_STATUS.PRODUCTION]: videoStats[VIDEO_MAIN_STATUS.PRODUCTION],
      [VIDEO_MAIN_STATUS.PUBLISHED]: videoStats[VIDEO_MAIN_STATUS.PUBLISHED],
    };
    const maxMainStates = Math.max(...Object.values(mainStatesData));

    return React.createElement(
      "div",
      { className: "charts-content" },
      React.createElement("div", { className: "charts-grid" }, [
        React.createElement(BarChart, {
          key: "main-states-chart",
          data: mainStatesData,
          title: "Estados Principales de Videos",
          maxValue: maxMainStates,
        }),
        React.createElement(
          "div",
          { key: "income-chart", className: "income-chart" },
          [
            React.createElement(
              "h5",
              { key: "income-chart-title" },
              `Distribución de Ingresos (en ${mainDisplayCurrency})`
            ),
            React.createElement(
              "div",
              { key: "income-pie", className: "income-pie-chart" }, // Esto no es un pie real, solo una representación
              [
                React.createElement(
                  "div",
                  { key: "paid-segment", className: "pie-segment paid" },
                  [
                    React.createElement(
                      "span",
                      { key: "paid-label" },
                      "✅ Pagado"
                    ),
                    React.createElement(
                      "span",
                      { key: "paid-amount" },
                      formatCurrency(
                        incomeStats.totalPaidInMainCurrency,
                        mainDisplayCurrency
                      )
                    ),
                  ]
                ),
                React.createElement(
                  "div",
                  { key: "pending-segment", className: "pie-segment pending" },
                  [
                    React.createElement(
                      "span",
                      { key: "pending-label" },
                      "⏳ Pendiente"
                    ),
                    React.createElement(
                      "span",
                      { key: "pending-amount" },
                      formatCurrency(
                        incomeStats.totalPendingInMainCurrency,
                        mainDisplayCurrency
                      )
                    ),
                  ]
                ),
              ]
            ),
          ]
        ),
      ])
    );
  };

  const renderCompareTab = () => {
    if (isLoadingCompare || !compareStatsData) {
      return React.createElement(
        "div",
        { className: "compare-content loading-compare" },
        "Cargando datos de comparación..."
      );
    }
    // ... (la lógica de cálculo de diferencia no cambia)
    const calculateDifference = (current, compare) => {
      const diff = current - compare;
      const percentage =
        compare > 0
          ? Math.round((diff / compare) * 100)
          : current > 0
          ? 100
          : 0;
      return { diff, percentage };
    };

    const videoComparisonItems = Object.entries({
      [VIDEO_MAIN_STATUS.DEVELOPMENT]: "Desarrollo",
      [VIDEO_MAIN_STATUS.PRODUCTION]: "Producción",
      [VIDEO_MAIN_STATUS.PUBLISHED]: "Publicado",
    }).map(([status, label]) => {
      const current = videoStats[status];
      const compare = compareVideoStats ? compareVideoStats[status] : 0;
      const { diff, percentage } = calculateDifference(current, compare);
      return React.createElement(
        "div",
        { key: `video-compare-item-${status}`, className: "comparison-item" },
        [
          React.createElement(
            "span",
            { key: `video-emoji-${status}` },
            STATUS_EMOJIS[status]
          ),
          React.createElement("span", { key: `video-label-${status}` }, label),
          React.createElement(
            "span",
            { key: `video-current-${status}` },
            current
          ),
          React.createElement("span", { key: `video-vs-${status}` }, "vs"),
          React.createElement(
            "span",
            { key: `video-compare-value-${status}` },
            compare
          ),
          React.createElement(
            "span",
            {
              key: `video-diff-${status}`,
              className: `diff ${
                diff > 0 ? "positive" : diff < 0 ? "negative" : "neutral"
              }`,
            },
            `${diff > 0 ? "+" : ""}${diff} (${
              percentage > 0 ? "+" : ""
            }${percentage}%)`
          ),
        ]
      );
    });

    const incomeDiffResult = (() => {
      const currentTotal = incomeStats.totalInMainCurrency;
      const compareTotal = compareIncomeStats
        ? compareIncomeStats.totalInMainCurrency
        : 0;
      const { diff, percentage } = calculateDifference(
        currentTotal,
        compareTotal
      );
      return React.createElement(
        "span",
        {
          className: `diff ${
            diff > 0 ? "positive" : diff < 0 ? "negative" : "neutral"
          }`,
        },
        `${diff > 0 ? "+" : ""}${formatCurrency(diff, mainDisplayCurrency)} (${
          percentage > 0 ? "+" : ""
        }${percentage}%)`
      );
    })();

    return React.createElement("div", { className: "compare-content" }, [
      React.createElement(
        "div",
        { key: "compare-controls", className: "compare-controls" },
        [
          React.createElement(
            "label",
            { key: "compare-label" },
            "Comparar con:"
          ),
          React.createElement("input", {
            key: "compare-date-input",
            type: "month",
            value: `${compareDate.getFullYear()}-${String(
              compareDate.getMonth() + 1
            ).padStart(2, "0")}`,
            onChange: (e) => {
              const [year, monthVal] = e.target.value.split("-");
              if (year && monthVal)
                setCompareDate(
                  new Date(parseInt(year), parseInt(monthVal) - 1, 1)
                );
            },
          }),
        ]
      ),
      React.createElement(
        "div",
        { key: "comparison-grid", className: "comparison-grid" },
        [
          React.createElement(
            "div",
            { key: "video-comparison", className: "comparison-section" },
            [
              React.createElement(
                "h4",
                { key: "video-comp-title" },
                "Videos: Estado Principal"
              ),
              React.createElement(
                "div",
                { key: "video-comp-items", className: "comparison-items" },
                videoComparisonItems
              ),
            ]
          ),
          React.createElement(
            "div",
            { key: "income-comparison", className: "comparison-section" },
            [
              React.createElement(
                "h4",
                { key: "income-comp-title" },
                `Ingresos Totales (en ${mainDisplayCurrency})`
              ),
              React.createElement(
                "div",
                {
                  key: "total-income-comparison",
                  className: "total-income-comparison",
                },
                [
                  React.createElement(
                    "div",
                    {
                      key: "current-month-income",
                      className: "month-income current",
                    },
                    [
                      React.createElement(
                        "span",
                        { key: "current-month-label" },
                        monthName
                      ),
                      React.createElement(
                        "span",
                        { key: "current-month-amount" },
                        formatCurrency(
                          incomeStats.totalInMainCurrency,
                          mainDisplayCurrency
                        )
                      ),
                    ]
                  ),
                  React.createElement("span", { key: "income-vs" }, "vs"),
                  React.createElement(
                    "div",
                    {
                      key: "compare-month-income",
                      className: "month-income compare",
                    },
                    [
                      React.createElement(
                        "span",
                        { key: "compare-month-label" },
                        compareMonthName
                      ),
                      React.createElement(
                        "span",
                        { key: "compare-month-amount" },
                        formatCurrency(
                          compareIncomeStats
                            ? compareIncomeStats.totalInMainCurrency
                            : 0,
                          mainDisplayCurrency
                        )
                      ),
                    ]
                  ),
                  React.createElement(
                    "div",
                    {
                      key: "income-difference",
                      className: "income-difference",
                    },
                    incomeDiffResult
                  ),
                ]
              ),
            ]
          ),
        ]
      ),
    ]);
  };

  const renderActiveTabContent = () => {
    if (activeTab === "overview") {
      return React.createElement(StatsOverviewPanel, {
        monthData: currentStatsData, // Pasar los datos del mes actualmente seleccionado para stats
        currentDate: currentStatsDate,
        plugin: plugin,
        compact: false,
      });
    } else if (activeTab === "charts") {
      return renderChartsTab();
    } else if (activeTab === "compare") {
      return renderCompareTab();
    }
    return null;
  };

  return React.createElement(
    "div",
    { className: "video-scheduler-stats-panel advanced" },
    [
      React.createElement(
        "div",
        {
          ref: modalRef,
          key: "stats-content",
          className: "stats-panel-content",
        },
        [
          React.createElement(
            "div",
            { key: "stats-header", className: "stats-panel-header" },
            [
              React.createElement(
                "div",
                {
                  key: "title-section",
                  className: "stats-panel-title-section",
                },
                [
                  React.createElement(
                    "button",
                    {
                      key: "prev-month-btn",
                      className: "month-nav-button",
                      onClick: handlePrevMonth,
                    },
                    "←"
                  ),
                  React.createElement(
                    "h2",
                    { key: "stats-title" },
                    `Estadísticas - ${monthName}`
                  ),
                  React.createElement(
                    "button",
                    {
                      key: "next-month-btn",
                      className: "month-nav-button",
                      onClick: handleNextMonth,
                    },
                    "→"
                  ),
                ]
              ),
              React.createElement(
                "button",
                {
                  key: "close-btn",
                  className: "stats-panel-close",
                  onClick: onClose,
                },
                "✕"
              ),
            ]
          ),
          React.createElement(
            "div",
            {
              key: "tab-buttons-container",
              className: "stats-tab-buttons-container",
            },
            renderTabButtons()
          ),
          React.createElement(
            "div",
            {
              key: "active-tab-content-container",
              className: "active-tab-content-container",
            },
            renderActiveTabContent()
          ),
        ]
      ),
    ]
  );
}

export default StatsPanel;
