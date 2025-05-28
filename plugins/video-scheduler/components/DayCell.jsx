// video-scheduler/components/DayCell.jsx
import React from "react";

function DayCell({ dayNumber, dayName }) {
  return React.createElement(
    "td",
    { className: "video-scheduler-day-cell" },
    React.createElement("div", { className: "day-info-container" }, [
      React.createElement(
        "span",
        { key: `day-num-${dayNumber}`, className: "day-number-display" },
        dayNumber
      ),
      React.createElement(
        "span",
        { key: `day-name-${dayNumber}`, className: "day-name-display" },
        dayName
      ),
    ])
  );
}

export default DayCell;
