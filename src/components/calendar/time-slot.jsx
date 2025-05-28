import React from "react";
import PropTypes from "prop-types";

/**
 * Componente para mostrar una franja horaria personalizable
 */
const TimeSlot = ({
  timeSlot,
  day,
  onCellClick,
  onAddIntermediateSlot,
  renderEvents,
  canAddIntermediate,
  cellHeight,
}) => {
  // Calcular altura según la duración
  const slotHeight = (timeSlot.duration / 60) * cellHeight;

  // Determinar clase de tipo de franja
  const getSlotTypeClass = () => {
    switch (timeSlot.type) {
      case "medium":
        return "time-slot-medium";
      case "short":
        return "time-slot-short";
      default:
        return "time-slot-standard";
    }
  };

  // Manejar clic para agregar franja intermedia
  const handleAddIntermediateClick = (e) => {
    e.stopPropagation();
    if (onAddIntermediateSlot) {
      onAddIntermediateSlot(timeSlot.hour, timeSlot.minutes);
    }
  };

  // Manejar clic en la celda
  const handleCellClick = () => {
    if (onCellClick) {
      const cellDate = new Date(day);
      cellDate.setHours(timeSlot.hour, timeSlot.minutes, 0, 0);
      onCellClick(cellDate);
    }
  };

  return (
    <div
      className={`calendar-time-slot ${getSlotTypeClass()}`}
      data-testid="calendar-time-slot"
      onClick={handleCellClick}
      style={{ height: `${slotHeight}px`, minHeight: `${slotHeight}px` }}
    >
      {/* Eventos dentro de la franja */}
      {renderEvents && renderEvents(timeSlot)}

      {/* Botón para agregar franja intermedia */}
      {canAddIntermediate && (
        <div className="add-intermediate-slot">
          <button
            className="add-intermediate-button"
            onClick={handleAddIntermediateClick}
            title={`Agregar franja intermedia a las ${timeSlot.hour}:${(
              timeSlot.minutes + 15
            )
              .toString()
              .padStart(2, "0")}`}
          >
            <span className="material-icons">add</span>
          </button>
        </div>
      )}
    </div>
  );
};

TimeSlot.propTypes = {
  timeSlot: PropTypes.shape({
    id: PropTypes.string.isRequired,
    hour: PropTypes.number.isRequired,
    minutes: PropTypes.number.isRequired,
    label: PropTypes.string.isRequired,
    type: PropTypes.oneOf(["standard", "medium", "short"]).isRequired,
    duration: PropTypes.number.isRequired,
  }).isRequired,
  day: PropTypes.instanceOf(Date).isRequired,
  onCellClick: PropTypes.func,
  onAddIntermediateSlot: PropTypes.func,
  renderEvents: PropTypes.func,
  canAddIntermediate: PropTypes.bool,
  cellHeight: PropTypes.number.isRequired,
};

export default TimeSlot;
