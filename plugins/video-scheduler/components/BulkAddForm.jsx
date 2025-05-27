// video-scheduler/components/BulkAddForm.jsx
import React from "react";
import { VIDEO_MAIN_STATUS } from "../utils/constants.js";

function BulkAddForm({ currentDate, onSave, onCancel, styleProps, plugin }) {
  const [formData, setFormData] = React.useState({
    baseName: "",
    startNumber: 1,
    videoCount: 5,
    startYear: currentDate.getFullYear(),
    startMonth: currentDate.getMonth(), // Esto es un número (0-11)
    startDay: 1,
    timeSlot: 0, // 0=7am, 1=15pm, 2=22pm. Esto es un número.
    frequency: "daily", // 'daily' o 'weekly'
    dailyInterval: 1, // Para frecuencia diaria: cada X días
    weeklyDays: [], // Para frecuencia semanal: días de la semana [0-6]
    weeklyTimeSlots: [0], // Para frecuencia semanal: horarios por día
  });

  const modalRef = React.useRef(null);

  // Opciones de horarios
  const timeSlotOptions = [
    { value: 0, label: "7am" },
    { value: 1, label: "15pm" },
    { value: 2, label: "22pm" },
  ];

  // Días de la semana
  const weekDays = [
    { value: 0, label: "Dom" },
    { value: 1, label: "Lun" },
    { value: 2, label: "Mar" },
    { value: 3, label: "Mié" },
    { value: 4, label: "Jue" },
    { value: 5, label: "Vie" },
    { value: 6, label: "Sáb" },
  ];

  // Generar opciones de año (actual +/- 2 años)
  const currentYearForOptions = new Date().getFullYear(); // Renombrado para evitar confusión con el 'currentYear' del default
  const yearOptions = [];
  for (
    let year = currentYearForOptions - 1;
    year <= currentYearForOptions + 2;
    year++
  ) {
    yearOptions.push({ value: year, label: year.toString() });
  }

  // Generar opciones de mes
  const monthOptions = [
    { value: 0, label: "Enero" },
    { value: 1, label: "Febrero" },
    { value: 2, label: "Marzo" },
    { value: 3, label: "Abril" },
    { value: 4, label: "Mayo" },
    { value: 5, label: "Junio" },
    { value: 6, label: "Julio" },
    { value: 7, label: "Agosto" },
    { value: 8, label: "Septiembre" },
    { value: 9, label: "Octubre" },
    { value: 10, label: "Noviembre" },
    { value: 11, label: "Diciembre" },
  ];

  const daysInSelectedMonth = React.useMemo(() => {
    // Asegurarse de que formData.startYear y formData.startMonth sean números aquí
    const year = Number(formData.startYear);
    const month = Number(formData.startMonth);
    return new Date(year, month + 1, 0).getDate();
  }, [formData.startYear, formData.startMonth]);

  // Generar opciones de día basadas en el mes seleccionado
  const dayOptions = React.useMemo(() => {
    const options = [];
    for (let i = 1; i <= daysInSelectedMonth; i++) {
      options.push({ value: i, label: i.toString() });
    }
    return options;
  }, [daysInSelectedMonth]);

  // Manejar clicks fuera del modal
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onCancel();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onCancel]);

  // Manejar tecla Escape
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCancel]);

  // Ajustar día cuando cambia el mes/año
  React.useEffect(() => {
    if (Number(formData.startDay) > daysInSelectedMonth) {
      console.log(
        `[BulkAdd] Ajustando día ${
          formData.startDay
        } a ${daysInSelectedMonth} para ${
          monthOptions[Number(formData.startMonth)].label
        } ${formData.startYear}`
      );
      setFormData((prev) => ({
        ...prev,
        startDay: daysInSelectedMonth, // daysInSelectedMonth ya es un número
      }));
    }
  }, [
    formData.startYear,
    formData.startMonth,
    formData.startDay,
    daysInSelectedMonth,
  ]);

  const handleInputChange = (field) => (e) => {
    let value = e.target.value;

    // Campos que deben ser numéricos, independientemente del tipo de input
    const numericFields = [
      "startNumber",
      "videoCount",
      "startYear",
      "startMonth",
      "startDay",
      "timeSlot",
      "dailyInterval",
    ];

    if (numericFields.includes(field)) {
      value = parseInt(value, 10);
      if (isNaN(value)) {
        // Reestablecer a un valor por defecto seguro si parseInt falla
        switch (field) {
          case "startNumber":
            value = 1;
            break;
          case "videoCount":
            value = 1;
            break;
          case "startDay":
            value = 1;
            break;
          case "startYear":
            value = currentYearForOptions;
            break;
          case "startMonth":
            value = 0;
            break;
          case "timeSlot":
            value = 0;
            break;
          case "dailyInterval":
            value = 1;
            break;
          default:
            value = 0;
        }
      }
    }

    console.log(
      `[BulkAdd] Campo ${field} cambiado a:`,
      value,
      `(tipo: ${typeof value})`
    );

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleWeeklyDayToggle = (dayValue) => {
    setFormData((prev) => {
      const newWeeklyDays = prev.weeklyDays.includes(dayValue)
        ? prev.weeklyDays.filter((d) => d !== dayValue)
        : [...prev.weeklyDays, dayValue].sort((a, b) => a - b); // Asegurar orden numérico

      return {
        ...prev,
        weeklyDays: newWeeklyDays,
      };
    });
  };

  const handleWeeklyTimeSlotToggle = (slotValue) => {
    setFormData((prev) => {
      const newTimeSlots = prev.weeklyTimeSlots.includes(slotValue)
        ? prev.weeklyTimeSlots.filter((s) => s !== slotValue)
        : [...prev.weeklyTimeSlots, slotValue].sort((a, b) => a - b); // Asegurar orden numérico

      return {
        ...prev,
        weeklyTimeSlots: newTimeSlots,
      };
    });
  };

  // Función para avanzar a la siguiente fecha válida
  const getNextDate = (currentYear, currentMonth, currentDay, interval) => {
    let nextDay = currentDay + interval;
    let nextMonth = currentMonth;
    let nextYear = currentYear;

    let daysInMonth = new Date(nextYear, nextMonth + 1, 0).getDate();

    while (nextDay > daysInMonth) {
      nextDay -= daysInMonth;
      nextMonth++;

      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear++;
      }
      daysInMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
    }

    return { year: nextYear, month: nextMonth, day: nextDay };
  };

  const generateVideoSchedule = () => {
    const schedule = [];

    if (!formData.baseName.trim() || Number(formData.videoCount) < 1) {
      return schedule;
    }

    console.log(`[BulkAdd] Generando programación con datos:`, {
      ...formData,
      daysInSelectedMonth: daysInSelectedMonth,
    });

    // Asegurar que los valores numéricos de formData sean realmente números
    const numStartYear = Number(formData.startYear);
    const numStartMonth = Number(formData.startMonth);
    const numStartDay = Number(formData.startDay);
    const numTimeSlot = Number(formData.timeSlot);
    const numVideoCount = Number(formData.videoCount);
    const numDailyInterval = Number(formData.dailyInterval);

    if (formData.frequency === "daily") {
      let videosCreated = 0;
      let currentYear = numStartYear;
      let currentMonth = numStartMonth;
      let currentDay = Math.max(1, Math.min(numStartDay, daysInSelectedMonth));
      const interval = Math.max(1, Math.min(numDailyInterval, 7));

      console.log(`[BulkAdd] Generando videos diarios multimes:`, {
        startYear: currentYear,
        startMonth: currentMonth,
        startDay: currentDay,
        interval: interval,
        videoCount: numVideoCount,
        daysInStartMonth: daysInSelectedMonth,
      });

      while (videosCreated < numVideoCount) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
          2,
          "0"
        )}-${String(currentDay).padStart(2, "0")}`;

        schedule.push({
          year: currentYear,
          month: currentMonth,
          day: currentDay,
          dateStr: dateStr,
          slotIndex: numTimeSlot,
          name: `${formData.baseName.trim()} ${
            Number(formData.startNumber) + videosCreated
          }`,
          status: VIDEO_MAIN_STATUS.DEVELOPMENT,
          description: "",
        });

        console.log(
          `[BulkAdd] Video ${videosCreated + 1}: ${dateStr} (${
            monthOptions[currentMonth].label
          })`
        );
        videosCreated++;

        if (videosCreated < numVideoCount) {
          const nextDate = getNextDate(
            currentYear,
            currentMonth,
            currentDay,
            interval
          );
          currentYear = nextDate.year;
          currentMonth = nextDate.month;
          currentDay = nextDate.day;
        }
      }
    } else if (formData.frequency === "weekly") {
      if (
        formData.weeklyDays.length === 0 ||
        formData.weeklyTimeSlots.length === 0
      ) {
        return schedule;
      }

      let videosCreated = 0;
      let currentYear = numStartYear;
      let currentMonth = numStartMonth;
      let currentDay = Math.max(1, Math.min(numStartDay, daysInSelectedMonth));

      console.log(`[BulkAdd] Generando videos semanales multimes:`, {
        startYear: currentYear,
        startMonth: currentMonth,
        startDay: currentDay,
        weeklyDays: formData.weeklyDays,
        timeSlots: formData.weeklyTimeSlots,
        videoCount: numVideoCount,
        daysInStartMonth: daysInSelectedMonth,
      });

      let iterationsLimit = numVideoCount * 10;
      let iterations = 0;

      while (videosCreated < numVideoCount && iterations < iterationsLimit) {
        iterations++;
        const dayOfWeek = new Date(
          currentYear,
          currentMonth,
          currentDay
        ).getDay();

        if (formData.weeklyDays.includes(dayOfWeek)) {
          formData.weeklyTimeSlots.forEach((timeSlot) => {
            // timeSlot ya es número aquí
            if (videosCreated < numVideoCount) {
              const dateStr = `${currentYear}-${String(
                currentMonth + 1
              ).padStart(2, "0")}-${String(currentDay).padStart(2, "0")}`;

              schedule.push({
                year: currentYear,
                month: currentMonth,
                day: currentDay,
                dateStr: dateStr,
                slotIndex: timeSlot, // Usar directamente el valor numérico
                name: `${formData.baseName.trim()} ${
                  Number(formData.startNumber) + videosCreated
                }`,
                status: VIDEO_MAIN_STATUS.DEVELOPMENT,
                description: "",
              });

              console.log(
                `[BulkAdd] Video ${videosCreated + 1}: ${dateStr} (${
                  monthOptions[currentMonth].label
                }), slot ${timeSlot}`
              );
              videosCreated++;
            }
          });
        }

        const nextDate = getNextDate(currentYear, currentMonth, currentDay, 1);
        currentYear = nextDate.year;
        currentMonth = nextDate.month;
        currentDay = nextDate.day;
      }
    }

    console.log(`[BulkAdd] Videos totales creados: ${schedule.length}`);
    return schedule;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const numVideoCount = Number(formData.videoCount);
    const numStartDay = Number(formData.startDay);
    const numDailyInterval = Number(formData.dailyInterval);

    if (!formData.baseName.trim()) {
      alert("El nombre base es obligatorio");
      return;
    }
    if (numVideoCount < 1 || numVideoCount > 100) {
      alert("La cantidad de videos debe estar entre 1 y 100");
      return;
    }
    if (numStartDay < 1 || numStartDay > daysInSelectedMonth) {
      alert(`El día de inicio debe estar entre 1 y ${daysInSelectedMonth}`);
      return;
    }
    if (
      formData.frequency === "daily" &&
      (numDailyInterval < 1 || numDailyInterval > 7)
    ) {
      alert("El intervalo diario debe estar entre 1 y 7 días");
      return;
    }
    if (formData.frequency === "weekly" && formData.weeklyDays.length === 0) {
      alert("Selecciona al menos un día de la semana");
      return;
    }
    if (
      formData.frequency === "weekly" &&
      formData.weeklyTimeSlots.length === 0
    ) {
      alert("Selecciona al menos un horario");
      return;
    }

    const schedule = generateVideoSchedule();
    if (schedule.length === 0) {
      alert("No se pueden crear videos con la configuración actual");
      return;
    }

    const monthsInvolved = [
      ...new Set(
        schedule.map((item) => `${monthOptions[item.month].label} ${item.year}`)
      ),
    ];
    const monthsText =
      monthsInvolved.length > 1
        ? `abarcando ${monthsInvolved.join(", ")}`
        : `en ${monthsInvolved[0]}`;

    const confirmMessage = `Se crearán ${schedule.length} videos ${monthsText}.\n\n¿Continuar?`;
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await onSave(schedule);
    } catch (error) {
      console.error("Error al crear videos en lote:", error);
      alert("Error al crear los videos. Revisa la consola para más detalles.");
    }
  };

  const previewSchedule = generateVideoSchedule();

  const groupedPreview = previewSchedule.reduce((acc, item) => {
    const monthKey = `${item.year}-${item.month}`;
    if (!acc[monthKey]) {
      acc[monthKey] = {
        year: item.year,
        month: item.month,
        monthName: `${monthOptions[item.month].label} ${item.year}`,
        videos: [],
      };
    }
    acc[monthKey].videos.push(item);
    return acc;
  }, {});

  return React.createElement(
    "div",
    { className: "bulk-add-form-overlay" },
    React.createElement(
      "div",
      {
        ref: modalRef,
        className: "bulk-add-form-modal",
        style: styleProps,
      },
      [
        // Header del modal
        React.createElement(
          "div",
          { key: "header", className: "bulk-add-form-header" },
          [
            React.createElement(
              "h3",
              { key: "title" },
              "📋 Añadir Videos en Lote (Multimes)"
            ),
            React.createElement(
              "button",
              {
                key: "close-btn",
                type: "button",
                className: "bulk-add-close-button",
                onClick: onCancel,
              },
              "✕"
            ),
          ]
        ),

        React.createElement("form", { key: "form", onSubmit: handleSubmit }, [
          React.createElement(
            "div",
            { key: "form-content", className: "bulk-add-form-content" },
            [
              React.createElement(
                "div",
                { key: "main-layout", className: "bulk-add-main-layout" },
                [
                  React.createElement(
                    "div",
                    { key: "left-column", className: "bulk-add-left-column" },
                    [
                      React.createElement(
                        "div",
                        { key: "basic-info", className: "form-section" },
                        [
                          React.createElement(
                            "h4",
                            { key: "section-title" },
                            "Información Básica"
                          ),
                          React.createElement(
                            "div",
                            { key: "base-name", className: "form-group" },
                            [
                              React.createElement(
                                "label",
                                { key: "label" },
                                "Nombre base de la serie:"
                              ),
                              React.createElement("input", {
                                key: "input",
                                type: "text",
                                value: formData.baseName,
                                onChange: handleInputChange("baseName"),
                                placeholder: "ej. Tutorial React",
                                required: true,
                              }),
                            ]
                          ),
                          React.createElement(
                            "div",
                            {
                              key: "number-fields",
                              className: "form-row-compact",
                            },
                            [
                              React.createElement(
                                "div",
                                {
                                  key: "start-number",
                                  className: "form-group",
                                },
                                [
                                  React.createElement(
                                    "label",
                                    { key: "label" },
                                    "Desde #:"
                                  ),
                                  React.createElement("input", {
                                    key: "input",
                                    type: "number", // Esto ayuda, pero el parseo explícito es más robusto
                                    value: formData.startNumber,
                                    onChange: handleInputChange("startNumber"),
                                    min: 1,
                                    max: 999,
                                  }),
                                ]
                              ),
                              React.createElement(
                                "div",
                                { key: "video-count", className: "form-group" },
                                [
                                  React.createElement(
                                    "label",
                                    { key: "label" },
                                    "Cantidad:"
                                  ),
                                  React.createElement("input", {
                                    key: "input",
                                    type: "number",
                                    value: formData.videoCount,
                                    onChange: handleInputChange("videoCount"),
                                    min: 1,
                                    max: 100,
                                  }),
                                ]
                              ),
                            ]
                          ),
                        ]
                      ),
                      React.createElement(
                        "div",
                        { key: "start-date", className: "form-section" },
                        [
                          React.createElement(
                            "h4",
                            { key: "section-title" },
                            "Fecha de Inicio"
                          ),
                          React.createElement(
                            "div",
                            { key: "date-info", className: "date-info" },
                            // Asegurar que formData.startMonth sea número para el índice
                            `${
                              monthOptions[Number(formData.startMonth)].label
                            } tiene ${daysInSelectedMonth} días`
                          ),
                          React.createElement(
                            "div",
                            {
                              key: "date-fields",
                              className: "form-row-compact",
                            },
                            [
                              React.createElement(
                                "div",
                                { key: "start-year", className: "form-group" },
                                [
                                  React.createElement(
                                    "label",
                                    { key: "label" },
                                    "Año:"
                                  ),
                                  React.createElement(
                                    "select",
                                    {
                                      key: "select",
                                      value: formData.startYear, // value será número debido a la inicialización y handleInputChange
                                      onChange: handleInputChange("startYear"),
                                    },
                                    yearOptions.map((option) =>
                                      React.createElement(
                                        "option",
                                        {
                                          key: option.value,
                                          value: option.value,
                                        },
                                        option.label
                                      )
                                    )
                                  ),
                                ]
                              ),
                              React.createElement(
                                "div",
                                { key: "start-month", className: "form-group" },
                                [
                                  React.createElement(
                                    "label",
                                    { key: "label" },
                                    "Mes:"
                                  ),
                                  React.createElement(
                                    "select",
                                    {
                                      key: "select",
                                      value: formData.startMonth, // value será número
                                      onChange: handleInputChange("startMonth"),
                                    },
                                    monthOptions.map((option) =>
                                      React.createElement(
                                        "option",
                                        {
                                          key: option.value,
                                          value: option.value,
                                        },
                                        option.label
                                      )
                                    )
                                  ),
                                ]
                              ),
                              React.createElement(
                                "div",
                                { key: "start-day", className: "form-group" },
                                [
                                  React.createElement(
                                    "label",
                                    { key: "label" },
                                    "Día:"
                                  ),
                                  React.createElement(
                                    "select",
                                    {
                                      key: "select",
                                      value: formData.startDay, // value será número
                                      onChange: handleInputChange("startDay"),
                                    },
                                    dayOptions.map((option) =>
                                      React.createElement(
                                        "option",
                                        {
                                          key: option.value,
                                          value: option.value,
                                        },
                                        option.label
                                      )
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
                        { key: "frequency", className: "form-section" },
                        [
                          React.createElement(
                            "h4",
                            { key: "section-title" },
                            "Frecuencia"
                          ),
                          React.createElement(
                            "div",
                            { key: "frequency-type", className: "form-group" },
                            [
                              React.createElement(
                                "label",
                                { key: "label" },
                                "Tipo:"
                              ),
                              React.createElement(
                                "select",
                                {
                                  key: "select",
                                  value: formData.frequency, // string
                                  onChange: handleInputChange("frequency"),
                                },
                                [
                                  React.createElement(
                                    "option",
                                    { key: "daily", value: "daily" },
                                    "Diaria"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "weekly", value: "weekly" },
                                    "Semanal"
                                  ),
                                ]
                              ),
                            ]
                          ),
                          formData.frequency === "daily" &&
                            React.createElement(
                              "div",
                              {
                                key: "daily-options",
                                className: "frequency-options",
                              },
                              React.createElement(
                                "div",
                                {
                                  key: "daily-row",
                                  className: "form-row-compact",
                                },
                                [
                                  React.createElement(
                                    "div",
                                    {
                                      key: "daily-interval",
                                      className: "form-group",
                                    },
                                    [
                                      React.createElement(
                                        "label",
                                        { key: "label" },
                                        "Cada X días:"
                                      ),
                                      React.createElement("input", {
                                        key: "input",
                                        type: "number",
                                        value: formData.dailyInterval, // value será número
                                        onChange:
                                          handleInputChange("dailyInterval"),
                                        min: 1,
                                        max: 7,
                                      }),
                                    ]
                                  ),
                                  React.createElement(
                                    "div",
                                    {
                                      key: "time-slot",
                                      className: "form-group",
                                    },
                                    [
                                      React.createElement(
                                        "label",
                                        { key: "label" },
                                        "Horario:"
                                      ),
                                      React.createElement(
                                        "select",
                                        {
                                          key: "select",
                                          value: formData.timeSlot, // value será número
                                          onChange:
                                            handleInputChange("timeSlot"),
                                        },
                                        timeSlotOptions.map((option) =>
                                          React.createElement(
                                            "option",
                                            {
                                              key: option.value,
                                              value: option.value,
                                            },
                                            option.label
                                          )
                                        )
                                      ),
                                    ]
                                  ),
                                ]
                              )
                            ),
                          formData.frequency === "weekly" &&
                            React.createElement(
                              "div",
                              {
                                key: "weekly-options",
                                className: "frequency-options",
                              },
                              [
                                React.createElement(
                                  "div",
                                  {
                                    key: "weekly-days",
                                    className: "form-group",
                                  },
                                  [
                                    React.createElement(
                                      "label",
                                      { key: "label" },
                                      "Días de la semana:"
                                    ),
                                    React.createElement(
                                      "div",
                                      {
                                        key: "days-grid",
                                        className: "checkbox-grid-compact",
                                      },
                                      weekDays.map((day) =>
                                        React.createElement(
                                          "label",
                                          {
                                            key: day.value,
                                            className: "checkbox-item-compact",
                                          },
                                          [
                                            React.createElement("input", {
                                              key: "checkbox",
                                              type: "checkbox",
                                              checked:
                                                formData.weeklyDays.includes(
                                                  day.value
                                                ),
                                              onChange: () =>
                                                handleWeeklyDayToggle(
                                                  day.value
                                                ), // day.value es número
                                            }),
                                            React.createElement(
                                              "span",
                                              { key: "label" },
                                              day.label
                                            ),
                                          ]
                                        )
                                      )
                                    ),
                                  ]
                                ),
                                React.createElement(
                                  "div",
                                  {
                                    key: "weekly-time-slots",
                                    className: "form-group",
                                  },
                                  [
                                    React.createElement(
                                      "label",
                                      { key: "label" },
                                      "Horarios:"
                                    ),
                                    React.createElement(
                                      "div",
                                      {
                                        key: "times-grid",
                                        className: "checkbox-grid-compact",
                                      },
                                      timeSlotOptions.map((option) =>
                                        React.createElement(
                                          "label",
                                          {
                                            key: option.value,
                                            className: "checkbox-item-compact",
                                          },
                                          [
                                            React.createElement("input", {
                                              key: "checkbox",
                                              type: "checkbox",
                                              checked:
                                                formData.weeklyTimeSlots.includes(
                                                  option.value
                                                ),
                                              onChange: () =>
                                                handleWeeklyTimeSlotToggle(
                                                  option.value
                                                ), // option.value es número
                                            }),
                                            React.createElement(
                                              "span",
                                              { key: "label" },
                                              option.label
                                            ),
                                          ]
                                        )
                                      )
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
                    { key: "right-column", className: "bulk-add-right-column" },
                    React.createElement(
                      "div",
                      {
                        key: "preview",
                        className: "form-section preview-section",
                      },
                      [
                        React.createElement(
                          "h4",
                          { key: "section-title" },
                          "Vista Previa Multimes"
                        ),
                        React.createElement(
                          "div",
                          { key: "preview-stats", className: "preview-stats" },
                          [
                            React.createElement(
                              "span",
                              { key: "count", className: "preview-count" },
                              `${previewSchedule.length} videos`
                            ),
                            Object.keys(groupedPreview).length > 0 &&
                              React.createElement(
                                "span",
                                { key: "months", className: "preview-months" },
                                `${Object.keys(groupedPreview).length} mes${
                                  Object.keys(groupedPreview).length > 1
                                    ? "es"
                                    : ""
                                }`
                              ),
                          ]
                        ),
                        React.createElement(
                          "div",
                          {
                            key: "preview-list",
                            className: "preview-list-horizontal",
                          },
                          Object.keys(groupedPreview).length > 0
                            ? Object.values(groupedPreview).map(
                                (monthGroup, monthIndex) =>
                                  React.createElement(
                                    "div",
                                    {
                                      key: `month-${monthIndex}`,
                                      className: "preview-month-group",
                                    },
                                    [
                                      React.createElement(
                                        "div",
                                        {
                                          key: "month-header",
                                          className: "preview-month-header",
                                        },
                                        `${monthGroup.monthName} (${monthGroup.videos.length})`
                                      ),
                                      React.createElement(
                                        "div",
                                        {
                                          key: "month-videos",
                                          className: "preview-month-videos",
                                        },
                                        monthGroup.videos
                                          .slice(0, 6)
                                          .map((item, index) =>
                                            React.createElement(
                                              "div",
                                              {
                                                key: index,
                                                className:
                                                  "preview-item-compact",
                                              },
                                              [
                                                React.createElement(
                                                  "div",
                                                  {
                                                    key: "day",
                                                    className:
                                                      "preview-day-compact",
                                                  },
                                                  item.day
                                                ),
                                                React.createElement(
                                                  "div",
                                                  {
                                                    key: "time",
                                                    className:
                                                      "preview-time-compact",
                                                  },
                                                  timeSlotOptions[
                                                    item.slotIndex
                                                  ].label // item.slotIndex debe ser número
                                                ),
                                                React.createElement(
                                                  "div",
                                                  {
                                                    key: "name",
                                                    className:
                                                      "preview-name-compact",
                                                  },
                                                  item.name
                                                ),
                                              ]
                                            )
                                          )
                                          .concat(
                                            monthGroup.videos.length > 6
                                              ? [
                                                  React.createElement(
                                                    "div",
                                                    {
                                                      key: "more",
                                                      className:
                                                        "preview-more-compact",
                                                    },
                                                    `+${
                                                      monthGroup.videos.length -
                                                      6
                                                    } más`
                                                  ),
                                                ]
                                              : []
                                          )
                                      ),
                                    ]
                                  )
                              )
                            : [
                                React.createElement(
                                  "div",
                                  {
                                    key: "empty",
                                    className: "preview-empty-compact",
                                  },
                                  "Configura los parámetros para ver la vista previa"
                                ),
                              ]
                        ),
                      ]
                    )
                  ),
                ]
              ),
            ]
          ),
          React.createElement(
            "div",
            { key: "actions", className: "form-actions" },
            [
              React.createElement(
                "button",
                {
                  key: "cancel",
                  type: "button",
                  onClick: onCancel,
                  className: "button-secondary",
                },
                "Cancelar"
              ),
              React.createElement(
                "button",
                {
                  key: "submit",
                  type: "submit",
                  className: "button-primary",
                  disabled: previewSchedule.length === 0,
                },
                `Crear ${previewSchedule.length} Videos`
              ),
            ]
          ),
        ]),
      ]
    )
  );
}

export default BulkAddForm;
