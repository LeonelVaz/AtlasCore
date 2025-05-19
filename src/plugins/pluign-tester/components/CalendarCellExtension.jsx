/**
 * Componente para las celdas del calendario
 */
import React from 'react';

export function CalendarCellExtension(props) {
  const { plugin, hour, minutes, date } = props;
  
  // Solo mostrar en algunas celdas para demostración
  const shouldShow = (
    (hour + minutes) % 3 === 0 && 
    date.getDate() % 2 === 0
  );
  
  if (!shouldShow) return null;
  
  const colorTema = plugin._data.configuracion.colorTema;
  
  return (
    <div className="plugin-tester-cell-indicator" />
  );
}