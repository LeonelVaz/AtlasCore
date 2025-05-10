import { useState, useCallback } from 'react';
import { formatHour } from '../utils/date-utils';
import { DEFAULT_HOUR_CELL_HEIGHT } from '../core/config/constants';

/**
 * Hook personalizado para manejar la rejilla temporal del calendario
 * @param {number} startHour - Hora de inicio para la rejilla (por defecto 0)
 * @param {number} endHour - Hora de fin para la rejilla (por defecto 24)
 * @param {number} cellHeight - Altura de celda (por defecto definida en constantes)
 * @returns {Object} - Funciones y datos para manejar la rejilla temporal
 */
function useTimeGrid(startHour = 0, endHour = 24, cellHeight = DEFAULT_HOUR_CELL_HEIGHT) {
  // Estado para manejar franjas horarias personalizadas (implementación básica, se mejorará en Stage 3)
  const [timeSlots, setTimeSlots] = useState([]);
  const [gridHeight, setGridHeight] = useState(cellHeight);
  
  /**
   * Genera el array de horas para la rejilla
   * @returns {Array} - Array de horas (números)
   */
  const generateHours = useCallback(() => {
    const hours = [];
    for (let i = startHour; i < endHour; i++) {
      hours.push(i);
    }
    return hours;
  }, [startHour, endHour]);

  /**
   * Verifica si un evento comienza exactamente en esta celda
   * @param {Object} event - Evento a verificar
   * @param {Date} day - Día a verificar
   * @param {number} hour - Hora a verificar
   * @returns {boolean} - true si el evento comienza en esta celda
   */
  const shouldShowEventStart = useCallback((event, day, hour) => {
    try {
      if (!event?.start) return false;
      
      const eventStart = new Date(event.start);
      
      if (isNaN(eventStart.getTime())) return false;
      
      return (
        eventStart.getDate() === day.getDate() &&
        eventStart.getMonth() === day.getMonth() &&
        eventStart.getFullYear() === day.getFullYear() &&
        eventStart.getHours() === hour
      );
    } catch (error) {
      console.error('Error al verificar inicio de evento:', error, event);
      return false;
    }
  }, []);

  /**
   * Verifica si un evento está activo al inicio del día
   * @param {Object} event - Evento a verificar
   * @param {Date} day - Día a verificar
   * @returns {boolean} - true si el evento está activo al inicio del día
   */
  const isEventActiveAtStartOfDay = useCallback((event, day) => {
    try {
      if (!event?.start || !event?.end) return false;
      
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) return false;
      
      // Medianoche del día
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      
      // El evento comenzó antes de la medianoche y termina después
      return eventStart < dayStart && eventEnd > dayStart;
    } catch (error) {
      console.error('Error al verificar evento activo al inicio del día:', error, event);
      return false;
    }
  }, []);

  /**
   * Filtra eventos para un día y hora específicos
   * @param {Array} events - Todos los eventos
   * @param {Date} day - Día a verificar
   * @param {number} hour - Hora a verificar
   * @returns {Array} - Eventos que comienzan en esa hora/día
   */
  const getEventsForTimeSlot = useCallback((events, day, hour) => {
    if (!Array.isArray(events) || !day) return [];
    
    return events.filter(event => shouldShowEventStart(event, day, hour));
  }, [shouldShowEventStart]);

  /**
   * Filtra eventos que continúan desde el día anterior
   * @param {Array} events - Todos los eventos
   * @param {Date} day - Día a verificar
   * @returns {Array} - Eventos que continúan desde el día anterior
   */
  const getContinuingEvents = useCallback((events, day) => {
    if (!Array.isArray(events) || !day) return [];
    
    return events.filter(event => isEventActiveAtStartOfDay(event, day));
  }, [isEventActiveAtStartOfDay]);
  
  /**
   * Formatea las horas para mostrar
   * @param {number} hour - Hora a formatear
   * @returns {string} - Hora formateada
   */
  const formatTimeSlot = useCallback((hour) => {
    return formatHour(hour);
  }, []);

  /**
   * Ajusta la altura de la celda
   * @param {number} newHeight - Nueva altura en píxeles
   */
  const setHourCellHeight = useCallback((newHeight) => {
    if (newHeight > 0) {
      setGridHeight(newHeight);
    }
  }, []);

  // Generar horas del grid
  const hours = generateHours();

  return {
    hours,
    timeSlots,
    setTimeSlots,
    gridHeight,
    setHourCellHeight,
    generateHours,
    shouldShowEventStart,
    isEventActiveAtStartOfDay,
    getEventsForTimeSlot,
    getContinuingEvents,
    formatTimeSlot
  };
}

export default useTimeGrid;