// video-scheduler/components/BulkAddForm.jsx
import React from "react";
import { VIDEO_MAIN_STATUS } from "../utils/constants.js";

function BulkAddForm({ currentDate, onSave, onCancel, styleProps, plugin }) {
  const [formData, setFormData] = React.useState({
    baseName: "",
    startNumber: 1,
    videoCount: 5,
    startYear: currentDate.getFullYear(),
    startMonth: currentDate.getMonth(),
    startDay: 1,
    timeSlot: 0,
    frequency: "daily",
    dailyInterval: 1,
    weeklyDays: [],
    weeklyTimeSlots: [0],
  });

  const modalRef = React.useRef(null);

  const timeSlotOptions = [
    { value: 0, label: "7am" },
    { value: 1, label: "15pm" },
    { value: 2, label: "22pm" },
  ];

  const weekDays = [
    { value: 0, label: "Dom" },
    { value: 1, label: "Lun" },
    { value: 2, label: "Mar" },
    { value: 3, label: "Mié" },
    { value: 4, label: "Jue" },
    { value: 5, label: "Vie" },
    { value: 6, label: "Sáb" },
  ];

  const currentYearForOptions = new Date().getFullYear();
  const yearOptions = [];
  for (
    let year = currentYearForOptions - 1;
    year <= currentYearForOptions + 2;
    year++
  ) {
    yearOptions.push({ value: year, label: year.toString() });
  }

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
    const year = Number(formData.startYear);
    const month = Number(formData.startMonth);
    return new Date(year, month + 1, 0).getDate();
  }, [formData.startYear, formData.startMonth]);

  const dayOptions = React.useMemo(() => {
    const options = [];
    for (let i = 1; i <= daysInSelectedMonth; i++) {
      options.push({ value: i, label: i.toString() });
    }
    return options;
  }, [daysInSelectedMonth]);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target))
        onCancel();
    };
    const timeoutId = setTimeout(
      () => document.addEventListener("mousedown", handleClickOutside),
      100
    );
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onCancel]);

  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  React.useEffect(() => {
    if (Number(formData.startDay) > daysInSelectedMonth) {
      setFormData((prev) => ({ ...prev, startDay: daysInSelectedMonth }));
    }
  }, [
    formData.startYear,
    formData.startMonth,
    formData.startDay,
    daysInSelectedMonth,
  ]);

  const handleInputChange = (field) => (e) => {
    let value = e.target.value;
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
        value =
          field === "startYear"
            ? currentYearForOptions
            : field === "startMonth" || field === "timeSlot"
            ? 0
            : 1;
      }
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleWeeklyDayToggle = (dayValue) => {
    setFormData((prev) => ({
      ...prev,
      weeklyDays: prev.weeklyDays.includes(dayValue)
        ? prev.weeklyDays.filter((d) => d !== dayValue)
        : [...prev.weeklyDays, dayValue].sort((a, b) => a - b),
    }));
  };

  const handleWeeklyTimeSlotToggle = (slotValue) => {
    setFormData((prev) => ({
      ...prev,
      weeklyTimeSlots: prev.weeklyTimeSlots.includes(slotValue)
        ? prev.weeklyTimeSlots.filter((s) => s !== slotValue)
        : [...prev.weeklyTimeSlots, slotValue].sort((a, b) => a - b),
    }));
  };

  const getNextDate = (currentYear, currentMonth, currentDay, interval) => {
    let d = new Date(currentYear, currentMonth, currentDay + interval);
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  };

  const generateVideoSchedule = () => {
    const schedule = [];
    if (!formData.baseName.trim() || Number(formData.videoCount) < 1)
      return schedule;

    const numStartYear = Number(formData.startYear);
    const numStartMonth = Number(formData.startMonth);
    const numStartDay = Number(formData.startDay);
    const numTimeSlot = Number(formData.timeSlot);
    const numVideoCount = Number(formData.videoCount);
    const numDailyInterval = Number(formData.dailyInterval);

    let videosCreated = 0;
    let currentIterationDate = new Date(
      numStartYear,
      numStartMonth,
      numStartDay
    );

    if (formData.frequency === "daily") {
      const interval = Math.max(1, Math.min(numDailyInterval, 7));
      while (videosCreated < numVideoCount) {
        const dateStr = `${currentIterationDate.getFullYear()}-${String(
          currentIterationDate.getMonth() + 1
        ).padStart(2, "0")}-${String(currentIterationDate.getDate()).padStart(
          2,
          "0"
        )}`;
        schedule.push({
          year: currentIterationDate.getFullYear(),
          month: currentIterationDate.getMonth(),
          day: currentIterationDate.getDate(),
          dateStr: dateStr,
          slotIndex: numTimeSlot,
          name: `${formData.baseName.trim()} ${
            Number(formData.startNumber) + videosCreated
          }`,
          status: VIDEO_MAIN_STATUS.DEVELOPMENT,
          description: "",
        });
        videosCreated++;
        if (videosCreated < numVideoCount) {
          currentIterationDate.setDate(
            currentIterationDate.getDate() + interval
          );
        }
      }
    } else if (formData.frequency === "weekly") {
      if (
        formData.weeklyDays.length === 0 ||
        formData.weeklyTimeSlots.length === 0
      )
        return schedule;
      let iterationsLimit = numVideoCount * 10; // Safety break
      while (videosCreated < numVideoCount && iterationsLimit-- > 0) {
        if (formData.weeklyDays.includes(currentIterationDate.getDay())) {
          formData.weeklyTimeSlots.forEach((timeSlot) => {
            if (videosCreated < numVideoCount) {
              const dateStr = `${currentIterationDate.getFullYear()}-${String(
                currentIterationDate.getMonth() + 1
              ).padStart(2, "0")}-${String(
                currentIterationDate.getDate()
              ).padStart(2, "0")}`;
              schedule.push({
                year: currentIterationDate.getFullYear(),
                month: currentIterationDate.getMonth(),
                day: currentIterationDate.getDate(),
                dateStr: dateStr,
                slotIndex: timeSlot,
                name: `${formData.baseName.trim()} ${
                  Number(formData.startNumber) + videosCreated
                }`,
                status: VIDEO_MAIN_STATUS.DEVELOPMENT,
                description: "",
              });
              videosCreated++;
            }
          });
        }
        if (videosCreated < numVideoCount) {
          currentIterationDate.setDate(currentIterationDate.getDate() + 1);
        }
      }
    }
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
    if (
      !confirm(
        `Se crearán ${schedule.length} videos ${monthsText}.\n\n¿Continuar?`
      )
    )
      return;

    try {
      await onSave(schedule);
    } catch (error) {
      console.error("Error al crear videos en lote:", error);
      alert("Error al crear los videos. Revisa la consola.");
    }
  };

  const previewSchedule = generateVideoSchedule();
  const groupedPreview = previewSchedule.reduce((acc, item) => {
    const monthKey = `${item.year}-${item.month}`;
    if (!acc[monthKey])
      acc[monthKey] = {
        year: item.year,
        month: item.month,
        monthName: `${monthOptions[item.month].label} ${item.year}`,
        videos: [],
      };
    acc[monthKey].videos.push(item);
    return acc;
  }, {});

  return React.createElement(
    "div",
    { className: "bulk-add-form-overlay" },
    React.createElement(
      "div",
      { ref: modalRef, className: "bulk-add-form-modal", style: styleProps },
      [
        React.createElement(
          "div",
          {
            key: "header",
            className: "bulk-add-form-header modal-header-flex",
          }, // Añadida clase modal-header-flex
          [
            React.createElement(
              // Contenedor para el icono y el título
              "div",
              { key: "title-container", className: "modal-title-container" },
              [
                React.createElement(
                  "span",
                  {
                    key: "icon",
                    className: "material-icons modal-header-icon",
                  }, // Clase para el icono
                  "playlist_add"
                ),
                React.createElement(
                  "h3",
                  { key: "title" },
                  "Añadir Videos en Lote (Multimes)" // Texto sin el emoji
                ),
              ]
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
                        {
                          key: "basic-info-section",
                          className: "form-section",
                        },
                        [
                          React.createElement(
                            "h4",
                            { key: "bi-title" },
                            "Información Básica"
                          ),
                          React.createElement(
                            "div",
                            { key: "base-name-group", className: "form-group" },
                            [
                              React.createElement(
                                "label",
                                { key: "bn-label" },
                                "Nombre base de la serie:"
                              ),
                              React.createElement("input", {
                                key: "bn-input",
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
                              key: "number-fields-row",
                              className: "form-row-compact",
                            },
                            [
                              React.createElement(
                                "div",
                                {
                                  key: "start-number-group",
                                  className: "form-group",
                                },
                                [
                                  React.createElement(
                                    "label",
                                    { key: "sn-label" },
                                    "Desde #:"
                                  ),
                                  React.createElement("input", {
                                    key: "sn-input",
                                    type: "number",
                                    value: formData.startNumber,
                                    onChange: handleInputChange("startNumber"),
                                    min: 1,
                                    max: 999,
                                  }),
                                ]
                              ),
                              React.createElement(
                                "div",
                                {
                                  key: "video-count-group",
                                  className: "form-group",
                                },
                                [
                                  React.createElement(
                                    "label",
                                    { key: "vc-label" },
                                    "Cantidad:"
                                  ),
                                  React.createElement("input", {
                                    key: "vc-input",
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
                        {
                          key: "start-date-section",
                          className: "form-section",
                        },
                        [
                          React.createElement(
                            "h4",
                            { key: "sd-title" },
                            "Fecha de Inicio"
                          ),
                          React.createElement(
                            "div",
                            { key: "sd-info", className: "date-info" },
                            `${
                              monthOptions[Number(formData.startMonth)].label
                            } tiene ${daysInSelectedMonth} días`
                          ),
                          React.createElement(
                            "div",
                            {
                              key: "date-fields-row",
                              className: "form-row-compact",
                            },
                            [
                              React.createElement(
                                "div",
                                {
                                  key: "start-year-group",
                                  className: "form-group",
                                },
                                [
                                  React.createElement(
                                    "label",
                                    { key: "sy-label" },
                                    "Año:"
                                  ),
                                  React.createElement(
                                    "select",
                                    {
                                      key: "sy-select",
                                      value: formData.startYear,
                                      onChange: handleInputChange("startYear"),
                                    },
                                    yearOptions.map((opt) =>
                                      React.createElement(
                                        "option",
                                        {
                                          key: `y-${opt.value}`,
                                          value: opt.value,
                                        },
                                        opt.label
                                      )
                                    )
                                  ),
                                ]
                              ),
                              React.createElement(
                                "div",
                                {
                                  key: "start-month-group",
                                  className: "form-group",
                                },
                                [
                                  React.createElement(
                                    "label",
                                    { key: "sm-label" },
                                    "Mes:"
                                  ),
                                  React.createElement(
                                    "select",
                                    {
                                      key: "sm-select",
                                      value: formData.startMonth,
                                      onChange: handleInputChange("startMonth"),
                                    },
                                    monthOptions.map((opt) =>
                                      React.createElement(
                                        "option",
                                        {
                                          key: `m-${opt.value}`,
                                          value: opt.value,
                                        },
                                        opt.label
                                      )
                                    )
                                  ),
                                ]
                              ),
                              React.createElement(
                                "div",
                                {
                                  key: "start-day-group",
                                  className: "form-group",
                                },
                                [
                                  React.createElement(
                                    "label",
                                    { key: "sd-label" },
                                    "Día:"
                                  ),
                                  React.createElement(
                                    "select",
                                    {
                                      key: "sd-select",
                                      value: formData.startDay,
                                      onChange: handleInputChange("startDay"),
                                    },
                                    dayOptions.map((opt) =>
                                      React.createElement(
                                        "option",
                                        {
                                          key: `d-${opt.value}`,
                                          value: opt.value,
                                        },
                                        opt.label
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
                        { key: "frequency-section", className: "form-section" },
                        [
                          React.createElement(
                            "h4",
                            { key: "freq-title" },
                            "Frecuencia"
                          ),
                          React.createElement(
                            "div",
                            { key: "freq-type-group", className: "form-group" },
                            [
                              React.createElement(
                                "label",
                                { key: "ft-label" },
                                "Tipo:"
                              ),
                              React.createElement(
                                "select",
                                {
                                  key: "ft-select",
                                  value: formData.frequency,
                                  onChange: handleInputChange("frequency"),
                                },
                                [
                                  React.createElement(
                                    "option",
                                    { key: "daily-opt", value: "daily" },
                                    "Diaria"
                                  ),
                                  React.createElement(
                                    "option",
                                    { key: "weekly-opt", value: "weekly" },
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
                                key: "daily-options-div",
                                className: "frequency-options",
                              },
                              React.createElement(
                                "div",
                                {
                                  key: "daily-row-div",
                                  className: "form-row-compact",
                                },
                                [
                                  React.createElement(
                                    "div",
                                    {
                                      key: "daily-interval-group",
                                      className: "form-group",
                                    },
                                    [
                                      React.createElement(
                                        "label",
                                        { key: "di-label" },
                                        "Cada X días:"
                                      ),
                                      React.createElement("input", {
                                        key: "di-input",
                                        type: "number",
                                        value: formData.dailyInterval,
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
                                      key: "time-slot-group",
                                      className: "form-group",
                                    },
                                    [
                                      React.createElement(
                                        "label",
                                        { key: "ts-label" },
                                        "Horario:"
                                      ),
                                      React.createElement(
                                        "select",
                                        {
                                          key: "ts-select",
                                          value: formData.timeSlot,
                                          onChange:
                                            handleInputChange("timeSlot"),
                                        },
                                        timeSlotOptions.map((opt) =>
                                          React.createElement(
                                            "option",
                                            {
                                              key: `t-${opt.value}`,
                                              value: opt.value,
                                            },
                                            opt.label
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
                                key: "weekly-options-div",
                                className: "frequency-options",
                              },
                              [
                                React.createElement(
                                  "div",
                                  {
                                    key: "weekly-days-group",
                                    className: "form-group",
                                  },
                                  [
                                    React.createElement(
                                      "label",
                                      { key: "wd-label" },
                                      "Días de la semana:"
                                    ),
                                    React.createElement(
                                      "div",
                                      {
                                        key: "wd-grid",
                                        className: "checkbox-grid-compact",
                                      },
                                      weekDays.map((day) =>
                                        React.createElement(
                                          "label",
                                          {
                                            key: `wd-${day.value}`,
                                            className: "checkbox-item-compact",
                                          },
                                          [
                                            React.createElement("input", {
                                              key: `wdc-${day.value}`,
                                              type: "checkbox",
                                              checked:
                                                formData.weeklyDays.includes(
                                                  day.value
                                                ),
                                              onChange: () =>
                                                handleWeeklyDayToggle(
                                                  day.value
                                                ),
                                            }),
                                            React.createElement(
                                              "span",
                                              { key: `wds-${day.value}` },
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
                                    key: "weekly-ts-group",
                                    className: "form-group",
                                  },
                                  [
                                    React.createElement(
                                      "label",
                                      { key: "wts-label" },
                                      "Horarios:"
                                    ),
                                    React.createElement(
                                      "div",
                                      {
                                        key: "wts-grid",
                                        className: "checkbox-grid-compact",
                                      },
                                      timeSlotOptions.map((opt) =>
                                        React.createElement(
                                          "label",
                                          {
                                            key: `wts-${opt.value}`,
                                            className: "checkbox-item-compact",
                                          },
                                          [
                                            React.createElement("input", {
                                              key: `wtsc-${opt.value}`,
                                              type: "checkbox",
                                              checked:
                                                formData.weeklyTimeSlots.includes(
                                                  opt.value
                                                ),
                                              onChange: () =>
                                                handleWeeklyTimeSlotToggle(
                                                  opt.value
                                                ),
                                            }),
                                            React.createElement(
                                              "span",
                                              { key: `wtss-${opt.value}` },
                                              opt.label
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
                        key: "preview-section-div",
                        className: "form-section preview-section",
                      },
                      [
                        React.createElement(
                          "h4",
                          { key: "ps-title" },
                          "Vista Previa Multimes"
                        ),
                        React.createElement(
                          "div",
                          { key: "ps-stats", className: "preview-stats" },
                          [
                            React.createElement(
                              "span",
                              { key: "ps-count", className: "preview-count" },
                              `${previewSchedule.length} videos`
                            ),
                            Object.keys(groupedPreview).length > 0 &&
                              React.createElement(
                                "span",
                                {
                                  key: "ps-months",
                                  className: "preview-months",
                                },
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
                            key: "ps-list",
                            className: "preview-list-horizontal",
                          },
                          Object.keys(groupedPreview).length > 0
                            ? Object.values(groupedPreview).map(
                                (monthGroup, monthIndex) =>
                                  React.createElement(
                                    "div",
                                    {
                                      key: `month-group-${monthIndex}`,
                                      className: "preview-month-group",
                                    },
                                    [
                                      React.createElement(
                                        "div",
                                        {
                                          key: `mh-${monthIndex}`,
                                          className: "preview-month-header",
                                        },
                                        `${monthGroup.monthName} (${monthGroup.videos.length})`
                                      ),
                                      React.createElement(
                                        "div",
                                        {
                                          key: `mv-${monthIndex}`,
                                          className: "preview-month-videos",
                                        },
                                        monthGroup.videos
                                          .slice(0, 6)
                                          .map((item, index) =>
                                            React.createElement(
                                              "div",
                                              {
                                                key: `pitem-${monthIndex}-${index}`,
                                                className:
                                                  "preview-item-compact",
                                              },
                                              [
                                                React.createElement(
                                                  "div",
                                                  {
                                                    key: `pday-${index}`,
                                                    className:
                                                      "preview-day-compact",
                                                  },
                                                  item.day
                                                ),
                                                React.createElement(
                                                  "div",
                                                  {
                                                    key: `ptime-${index}`,
                                                    className:
                                                      "preview-time-compact",
                                                  },
                                                  timeSlotOptions[
                                                    item.slotIndex
                                                  ].label
                                                ),
                                                React.createElement(
                                                  "div",
                                                  {
                                                    key: `pname-${index}`,
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
                                                      key: `pmore-${monthIndex}`,
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
                                    key: "ps-empty",
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
            { key: "form-actions-div", className: "form-actions" },
            [
              React.createElement(
                "button",
                {
                  key: "cancel-action",
                  type: "button",
                  onClick: onCancel,
                  className: "button-secondary",
                },
                "Cancelar"
              ),
              React.createElement(
                "button",
                {
                  key: "submit-action",
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
