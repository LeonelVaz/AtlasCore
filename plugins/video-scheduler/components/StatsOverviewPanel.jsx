// video-scheduler/components/StatsOverviewPanel.jsx
import React from "react";
import {
  VIDEO_MAIN_STATUS,
  VIDEO_SUB_STATUS,
  VIDEO_STACKABLE_STATUS,
  STATUS_EMOJIS,
  getCurrencySymbol, // Importar el helper para símbolos
} from "../utils/constants.js";

function StatsOverviewPanel({
  monthData,
  currentDate,
  plugin,
  compact = false,
}) {
  const filterDataByMonth = (data, year, month) => {
    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    const filteredVideos = {};
    const filteredIncomes = {};
    if (data && data.videos) {
      Object.entries(data.videos).forEach(([key, video]) => {
        if (key.startsWith(monthKey)) filteredVideos[key] = video;
      });
    }
    if (data && data.dailyIncomes) {
      Object.entries(data.dailyIncomes).forEach(([key, income]) => {
        if (key.startsWith(monthKey)) filteredIncomes[key] = income;
      });
    }
    return { videos: filteredVideos, dailyIncomes: filteredIncomes };
  };

  const filteredData = filterDataByMonth(
    monthData,
    currentDate.getFullYear(),
    currentDate.getMonth()
  );

  const calculateVideoStats = (data) => {
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
    if (data && data.videos) {
      Object.values(data.videos).forEach((video) => {
        stats.total++;
        if (video.status) stats[video.status]++;
        if (video.subStatus) stats[video.subStatus]++;
        if (video.stackableStatuses && Array.isArray(video.stackableStatuses)) {
          video.stackableStatuses.forEach((status) => {
            if (stats[status] !== undefined) stats[status]++;
            if (status === VIDEO_STACKABLE_STATUS.WARNING) stats.withAlerts++;
            if (status === VIDEO_STACKABLE_STATUS.QUESTION)
              stats.withQuestions++;
          });
        }
      });
    }
    return stats;
  };

  const calculateIncomeStats = (data) => {
    // Obtener configuración de moneda del plugin
    const currencyConfig = plugin._pluginData.settings;
    const mainDisplayCurrency = currencyConfig.mainUserCurrency || "USD"; // Moneda en la que se mostrará el total
    const exchangeRates = currencyConfig.currencyRates || {
      [mainDisplayCurrency]: 1,
    }; // Tasas relativas a la moneda principal

    const incomeStats = {
      totalByCurrency: {}, // Ej: { USD: 100, EUR: 50 }
      totalInMainCurrency: 0, // Total convertido a mainDisplayCurrency
      paidByCurrency: {},
      pendingByCurrency: {},
      totalPaidInMainCurrency: 0,
      totalPendingInMainCurrency: 0,
    };

    if (data && data.dailyIncomes) {
      Object.values(data.dailyIncomes).forEach((income) => {
        if (income && income.amount > 0) {
          const currency = income.currency; // Moneda original del ingreso
          const amount = parseFloat(income.amount) || 0;

          // La tasa de conversión es cuántas unidades de mainDisplayCurrency obtienes por 1 unidad de 'currency'
          // Si la tasa almacenada es "1 EUR = 1.08 USD" (main=USD), y el ingreso es en EUR, rate = 1.08
          // Si la tasa almacenada es "1 USD = 0.92 EUR" (main=EUR), y el ingreso es en USD, rate = 0.92
          const rateToMain =
            exchangeRates[currency] === undefined ? 0 : exchangeRates[currency]; // 0 si la tasa no está definida
          if (rateToMain === 0 && currency !== mainDisplayCurrency) {
            console.warn(
              `[StatsOverview] Tasa para ${currency} (relativa a ${mainDisplayCurrency}) no encontrada. Ingreso no se sumará al total general.`
            );
          }

          const amountInMainCurrency = amount * rateToMain;

          // Total por moneda original
          if (!incomeStats.totalByCurrency[currency])
            incomeStats.totalByCurrency[currency] = 0;
          incomeStats.totalByCurrency[currency] += amount;

          // Sumar al total general solo si hay tasa
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
            // pending
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

  const videoStats = calculateVideoStats(filteredData);
  const incomeStats = calculateIncomeStats(filteredData);
  const mainDisplayCurrency =
    plugin._pluginData.settings.mainUserCurrency || "USD";

  const formatCurrency = (amount, currencyCode) => {
    const symbol = getCurrencySymbol(currencyCode);
    // Usar toLocaleString para formateo numérico, pero mantener el símbolo y código
    return `${symbol}${Math.round(amount).toLocaleString(
      "es-ES"
    )} ${currencyCode}`;
  };

  // El modo compacto (footer) no se usa, se mantiene el modo completo directamente.
  // Si en el futuro se reactiva, también necesitará usar mainDisplayCurrency.

  return React.createElement("div", { className: "stats-tab-content" }, [
    React.createElement(
      "div",
      { key: "video-stats", className: "stats-section" },
      [
        React.createElement("h3", { key: "title" }, "Estado de Videos"),
        React.createElement(
          "div",
          { key: "stats-grid", className: "stats-grid" },
          [
            React.createElement(
              "div",
              { key: "main-states", className: "stats-group" },
              [
                React.createElement(
                  "h4",
                  { key: "title" },
                  "Estados Principales"
                ),
                React.createElement(
                  "div",
                  { key: "items", className: "stats-items" },
                  Object.entries({
                    [VIDEO_MAIN_STATUS.PENDING]: "Pendiente",
                    [VIDEO_MAIN_STATUS.EMPTY]: "Vacío",
                    [VIDEO_MAIN_STATUS.DEVELOPMENT]: "Desarrollo",
                    [VIDEO_MAIN_STATUS.PRODUCTION]: "Producción",
                    [VIDEO_MAIN_STATUS.PUBLISHED]: "Publicado",
                  }).map(([status, label]) =>
                    React.createElement(
                      "div",
                      { key: `main-${status}`, className: "stats-item" },
                      [
                        React.createElement(
                          "span",
                          { key: `emoji-${status}` },
                          STATUS_EMOJIS[status]
                        ),
                        React.createElement(
                          "span",
                          { key: `label-${status}` },
                          label
                        ),
                        React.createElement(
                          "span",
                          { key: `count-${status}`, className: "stats-count" },
                          videoStats[status]
                        ),
                      ]
                    )
                  )
                ),
              ]
            ),
            React.createElement(
              "div",
              { key: "sub-states", className: "stats-group" },
              [
                React.createElement("h4", { key: "title" }, "Actividades"),
                React.createElement(
                  "div",
                  { key: "items", className: "stats-items" },
                  Object.entries({
                    [VIDEO_SUB_STATUS.REC]: "Grabando",
                    [VIDEO_SUB_STATUS.EDITING]: "Editando",
                    [VIDEO_SUB_STATUS.THUMBNAIL]: "Thumbnail",
                    [VIDEO_SUB_STATUS.SCHEDULING_POST]: "Programando",
                    [VIDEO_SUB_STATUS.SCHEDULED]: "Programado",
                  }).map(([status, label]) =>
                    React.createElement(
                      "div",
                      { key: `sub-${status}`, className: "stats-item" },
                      [
                        React.createElement(
                          "span",
                          { key: `emoji-${status}` },
                          STATUS_EMOJIS[status]
                        ),
                        React.createElement(
                          "span",
                          { key: `label-${status}` },
                          label
                        ),
                        React.createElement(
                          "span",
                          { key: `count-${status}`, className: "stats-count" },
                          videoStats[status]
                        ),
                      ]
                    )
                  )
                ),
              ]
            ),
            React.createElement(
              "div",
              { key: "alerts", className: "stats-group" },
              [
                React.createElement(
                  "h4",
                  { key: "title" },
                  "Atención Requerida"
                ),
                React.createElement(
                  "div",
                  { key: "items", className: "stats-items" },
                  [
                    React.createElement(
                      "div",
                      { key: "warnings", className: "stats-item warning-item" },
                      [
                        React.createElement(
                          "span",
                          { key: "emoji" },
                          STATUS_EMOJIS[VIDEO_STACKABLE_STATUS.WARNING]
                        ),
                        React.createElement(
                          "span",
                          { key: "label" },
                          "Con Alertas"
                        ),
                        React.createElement(
                          "span",
                          { key: "count", className: "stats-count" },
                          videoStats.withAlerts
                        ),
                      ]
                    ),
                    React.createElement(
                      "div",
                      {
                        key: "questions",
                        className: "stats-item question-item",
                      },
                      [
                        React.createElement(
                          "span",
                          { key: "emoji" },
                          STATUS_EMOJIS[VIDEO_STACKABLE_STATUS.QUESTION]
                        ),
                        React.createElement(
                          "span",
                          { key: "label" },
                          "Con Dudas"
                        ),
                        React.createElement(
                          "span",
                          { key: "count", className: "stats-count" },
                          videoStats.withQuestions
                        ),
                      ]
                    ),
                    React.createElement(
                      "div",
                      { key: "total", className: "stats-item total-item" },
                      [
                        React.createElement("span", { key: "emoji" }, "📊"),
                        React.createElement(
                          "span",
                          { key: "label" },
                          "Total Videos"
                        ),
                        React.createElement(
                          "span",
                          { key: "count", className: "stats-count" },
                          videoStats.total
                        ),
                      ]
                    ),
                  ]
                ),
              ]
            ),
          ]
        ),
      ]
    ),
    React.createElement(
      "div",
      { key: "income-stats", className: "stats-section" },
      [
        React.createElement(
          "h3",
          { key: "title" },
          `Ganancias del Mes (en ${mainDisplayCurrency})`
        ),
        React.createElement(
          "div",
          { key: "income-grid", className: "income-stats-grid" },
          [
            React.createElement(
              "div",
              { key: "by-currency", className: "income-group" },
              [
                React.createElement(
                  "h4",
                  { key: "title" },
                  "Ingresos Por Moneda Original"
                ),
                React.createElement(
                  "div",
                  { key: "items", className: "income-items" },
                  Object.entries(incomeStats.totalByCurrency).length > 0
                    ? Object.entries(incomeStats.totalByCurrency).map(
                        ([currency, amount]) =>
                          React.createElement(
                            "div",
                            {
                              key: `currency-${currency}`,
                              className: "income-item",
                            },
                            [
                              React.createElement(
                                "span",
                                { key: `currency-label-${currency}` },
                                currency
                              ),
                              React.createElement(
                                "span",
                                { key: `amount-${currency}` },
                                formatCurrency(amount, currency)
                              ),
                            ]
                          )
                      )
                    : React.createElement(
                        "p",
                        { className: "no-income-data-text" },
                        "Sin ingresos registrados."
                      )
                ),
              ]
            ),
            React.createElement(
              "div",
              { key: "payment-status", className: "income-group" },
              [
                React.createElement(
                  "h4",
                  { key: "title" },
                  `Estado de Pagos (en ${mainDisplayCurrency})`
                ),
                React.createElement(
                  "div",
                  { key: "items", className: "income-items" },
                  [
                    React.createElement(
                      "div",
                      { key: "paid", className: "income-item paid" },
                      [
                        React.createElement(
                          "span",
                          { key: "label" },
                          "✅ Pagado"
                        ),
                        React.createElement(
                          "span",
                          { key: "amount" },
                          formatCurrency(
                            incomeStats.totalPaidInMainCurrency,
                            mainDisplayCurrency
                          )
                        ),
                      ]
                    ),
                    React.createElement(
                      "div",
                      { key: "pending", className: "income-item pending" },
                      [
                        React.createElement(
                          "span",
                          { key: "label" },
                          "⏳ Pendiente"
                        ),
                        React.createElement(
                          "span",
                          { key: "amount" },
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
            React.createElement(
              "div",
              { key: "total-income", className: "income-group total-income" },
              [
                React.createElement(
                  "h4",
                  { key: "title" },
                  `Total del Mes (en ${mainDisplayCurrency})`
                ),
                React.createElement(
                  "div",
                  { key: "total", className: "income-total" },
                  formatCurrency(
                    incomeStats.totalInMainCurrency,
                    mainDisplayCurrency
                  )
                ),
              ]
            ),
          ]
        ),
        Object.values(incomeStats.totalByCurrency).some(
          (amount) => amount > 0
        ) &&
          Object.keys(incomeStats.totalByCurrency).some(
            (currency) =>
              plugin._pluginData.settings.currencyRates[currency] ===
                undefined && currency !== mainDisplayCurrency
          ) &&
          React.createElement(
            "p",
            {
              key: "missing-rate-warning",
              className: "missing-rate-warning-text",
            },
            `❗ Algunas monedas de ingreso no tienen tasa de cambio configurada hacia ${mainDisplayCurrency}. Esos montos no se incluyen en el "Total del Mes". Configura las tasas en "⚙️ Tasas Cambio".`
          ),
      ]
    ),
  ]);
}

export default StatsOverviewPanel;
