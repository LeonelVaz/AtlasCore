// src/hooks/use-time-grid.jsx (versión completa corregida)
import { useState, useEffect, useCallback } from 'react';
import { formatHour } from '../utils/date-utils';
import { DEFAULT_HOUR_CELL_HEIGHT, STORAGE_KEYS } from '../core/config/constants';
import storageService from '../services/storage-service';
import eventBus from '../core/bus/event-bus';

/**
 * Hook personalizado para manejar la rejilla temporal del calendario con soporte para franjas personalizadas
 * @param {number} startHour - Hora de inicio para la rejilla (por defecto 0)
 * @param {number} endHour - Hora de fin para la rejilla (por defecto 24)
 * @param {number} cellHeight - Altura de celda (por defecto definida en constantes)
 * @returns {Object} - Funciones y datos para manejar la rejilla temporal
 */
function useTimeGrid(startHour = 0, endHour = 24, cellHeight = DEFAULT_HOUR_CELL_HEIGHT) {
  // Estado para manejar franjas horarias personalizadas
  const [customSlots, setCustomSlots] = useState({});
  const [gridHeight, setGridHeight] = useState(cellHeight);
  const [isLoading, setIsLoading] = useState(true);
  
  // Cargar franjas personalizadas al iniciar
  useEffect(() => {
    const loadCustomSlots = async () => {
      try {
        const savedSlots = await storageService.get(STORAGE_KEYS.CUSTOM_TIME_SLOTS, {});
        
        // Asegurar que las franjas tienen duración calculada
        const slotsWithDuration = {};
        
        Object.entries(savedSlots).forEach(([hour, slots]) => {
          const hourNum = parseInt(hour, 10);
          
          // Ordenar las franjas por minutos
          const sortedSlots = [...slots].sort((a, b) => a.minutes - b.minutes);
          
          // Calcular las duraciones
          slotsWithDuration[hourNum] = sortedSlots.map((slot, index) => {
            let duration;
            
            if (index < sortedSlots.length - 1) {
              // Si hay una siguiente franja, la duración es hasta ella
              duration = sortedSlots[index + 1].minutes - slot.minutes;
            } else {
              // Si es la última franja, la duración es hasta la siguiente hora
              duration = 60 - slot.minutes;
            }
            
            return {
              ...slot,
              duration
            };
          });
        });
        
        setCustomSlots(slotsWithDuration);
        setIsLoading(false);
      } catch (error) {
        console.error('Error al cargar franjas horarias personalizadas:', error);
        setCustomSlots({});
        setIsLoading(false);
      }
    };

    loadCustomSlots();
  }, []);

  // Guardar franjas personalizadas cuando cambien
  useEffect(() => {
    if (!isLoading) {
      storageService.set(STORAGE_KEYS.CUSTOM_TIME_SLOTS, customSlots);
      
      // Notificar al sistema del cambio en las franjas horarias
      eventBus.publish('calendar.timeSlotsChanged', customSlots);
    }
  }, [customSlots, isLoading]);

  /**
   * Calcula la duración de una franja horaria
   * @param {number} hour - Hora de la franja
   * @param {number} minutes - Minutos de la franja
   * @param {Array} allSlots - Todas las franjas de la hora
   * @returns {number} - Duración en minutos
   */
  const calculateSlotDuration = (hour, minutes, allSlots) => {
    // Ordenar las franjas por minutos
    const sortedSlots = [...allSlots].sort((a, b) => a.minutes - b.minutes);
    
    // Encontrar el índice de esta franja
    const slotIndex = sortedSlots.findIndex(slot => slot.minutes === minutes);
    
    if (slotIndex === -1) {
      // Si no se encuentra (no debería pasar), devolver duración predeterminada
      return 60 - minutes;
    }
    
    if (slotIndex < sortedSlots.length - 1) {
      // Si hay una siguiente franja, la duración es hasta ella
      return sortedSlots[slotIndex + 1].minutes - minutes;
    } else {
      // Si es la última franja, la duración es hasta la siguiente hora
      return 60 - minutes;
    }
  };

  /**
   * Recalcula las duraciones de todas las franjas de una hora
   * @param {number} hour - Hora a recalcular
   * @param {Array} slots - Franjas de la hora
   * @returns {Array} - Franjas con duraciones actualizadas
   */
  const recalculateSlotDurations = (hour, slots) => {
    // Ordenar las franjas por minutos
    const sortedSlots = [...slots].sort((a, b) => a.minutes - b.minutes);
    
    // Calcular duración para cada franja
    return sortedSlots.map((slot, index) => {
      if (index < sortedSlots.length - 1) {
        // Si hay una siguiente franja, la duración es hasta ella
        return {
          ...slot,
          duration: sortedSlots[index + 1].minutes - slot.minutes
        };
      } else {
        // Si es la última franja, la duración es hasta la siguiente hora
        return {
          ...slot,
          duration: 60 - slot.minutes
        };
      }
    });
  };

  /**
   * Validar que no se creen subdivisiones en un orden incorrecto
   * @param {number} hour - Hora base (0-23)
   * @param {number} minutes - Minutos (múltiplos de 15)
   * @returns {boolean} - true si es válido crear la subdivisión
   */
  const validateSubdivisionOrder = useCallback((hour, minutes) => {
    const hourSlots = customSlots[hour] || [];
    
    // Si se intenta crear XX:15 y no existe XX:30, no permitir
    if (minutes === 15 && !hourSlots.some(slot => slot.minutes === 30)) {
      console.warn(`No se puede crear franja a las ${hour}:15 sin crear primero franja a las ${hour}:30`);
      return false;
    }
    
    // Si se intenta crear XX:45 y no existe XX:30, no permitir
    if (minutes === 45 && !hourSlots.some(slot => slot.minutes === 30)) {
      console.warn(`No se puede crear franja a las ${hour}:45 sin crear primero franja a las ${hour}:30`);
      return false;
    }
    
    return true;
  }, [customSlots]);

  /**
   * Agrega una franja horaria personalizada
   * @param {number} hour - Hora base (0-23)
   * @param {number} minutes - Minutos (múltiplos de 15)
   * @returns {boolean} - true si se agregó correctamente
   */
  const addCustomTimeSlot = useCallback((hour, minutes) => {
    try {
      // Validar parámetros
      if (hour < 0 || hour >= 24 || minutes < 0 || minutes >= 60) {
        console.error('Parámetros de franja horaria inválidos:', hour, minutes);
        return false;
      }
      
      // Asegurar que minutes sea múltiplo de 15
      const validMinutes = Math.round(minutes / 15) * 15;
      if (validMinutes !== minutes) {
        console.warn(`Minutos ajustados de ${minutes} a ${validMinutes}`);
        minutes = validMinutes;
      }
      
      // Verificar si la franja ya existe
      const hourSlots = customSlots[hour] || [];
      if (hourSlots.some(slot => slot.minutes === minutes)) {
        console.warn(`La franja ${hour}:${minutes} ya existe`);
        return false;
      }
      
      // Validar orden de creación
      if (!validateSubdivisionOrder(hour, minutes)) {
        return false;
      }
      
      // Agregar la nueva franja
      setCustomSlots(prev => {
        const updatedSlots = { ...prev };
        const newHourSlots = [...(updatedSlots[hour] || []), { minutes }];
        
        // Recalcular duraciones para todas las franjas de esta hora
        updatedSlots[hour] = recalculateSlotDurations(hour, newHourSlots);
        
        return updatedSlots;
      });
      
      return true;
    } catch (error) {
      console.error('Error al agregar franja horaria personalizada:', error);
      return false;
    }
  }, [customSlots, validateSubdivisionOrder]);

  /**
   * Elimina una franja horaria personalizada
   * @param {number} hour - Hora base (0-23)
   * @param {number} minutes - Minutos
   * @returns {boolean} - true si se eliminó correctamente
   */
  const removeCustomTimeSlot = useCallback((hour, minutes) => {
    try {
      // Validar parámetros
      if (hour < 0 || hour >= 24 || minutes <= 0 || minutes >= 60) {
        console.error('Parámetros de franja horaria inválidos:', hour, minutes);
        return false;
      }
      
      // Verificar si la franja existe
      const hourSlots = customSlots[hour] || [];
      if (!hourSlots.some(slot => slot.minutes === minutes)) {
        console.warn(`La franja ${hour}:${minutes} no existe`);
        return false;
      }
      
      // Eliminar la franja
      setCustomSlots(prev => {
        const updatedSlots = { ...prev };
        const filteredSlots = updatedSlots[hour].filter(slot => slot.minutes !== minutes);
        
        // Si no quedan franjas para esta hora, eliminar la entrada
        if (filteredSlots.length === 0) {
          delete updatedSlots[hour];
        } else {
          // Recalcular duraciones para las franjas restantes
          updatedSlots[hour] = recalculateSlotDurations(hour, filteredSlots);
        }
        
        return updatedSlots;
      });
      
      return true;
    } catch (error) {
      console.error('Error al eliminar franja horaria personalizada:', error);
      return false;
    }
  }, [customSlots]);

  /**
   * Verifica si se puede agregar una franja intermedia a una hora
   * @param {number} hour - Hora base
   * @param {number} minutes - Minutos
   * @returns {boolean} - true si se puede agregar
   */
  const canAddIntermediateSlot = useCallback((hour, minutes) => {
    const hourSlots = customSlots[hour] || [];
    
    // Para la franja estándar de una hora (XX:00)
    if (minutes === 0) {
      // Solo mostrar botón + si no hay subdivisión a las XX:30
      return !hourSlots.some(slot => slot.minutes === 30);
    }
    
    // Para la franja de 30 minutos (XX:30-XX+1:00)
    if (minutes === 30) {
      // Solo mostrar botón + si no hay subdivisión a las XX:45
      return !hourSlots.some(slot => slot.minutes === 45);
    }
    
    // No mostrar botón + para otras franjas (incluyendo XX:15 y XX:45)
    return false;
  }, [customSlots]);

  /**
   * Verifica si se puede agregar una franja intermedia a las XX:15
   * @param {number} hour - Hora base (0-23)
   * @returns {boolean} - true si se puede agregar una franja intermedia a las XX:15
   */
  const canAddIntermediateSlotAt15 = useCallback((hour) => {
    const hourSlots = customSlots[hour] || [];
    
    // Verificar si existe una franja a las XX:30 (requisito)
    // y no existe una franja a las XX:15
    return hourSlots.some(slot => slot.minutes === 30) && 
           !hourSlots.some(slot => slot.minutes === 15);
  }, [customSlots]);

  /**
   * Verifica si un evento comienza exactamente en esta celda
   * @param {Object} event - Evento a verificar
   * @param {Date} day - Día a verificar
   * @param {number} hour - Hora a verificar
   * @param {number} minutes - Minutos a verificar (0 por defecto)
   * @returns {boolean} - true si el evento comienza en esta celda
   */
  const shouldShowEventStart = useCallback((event, day, hour, minutes = 0) => {
    try {
      if (!event?.start) {
        console.error('Error al verificar inicio de evento: evento sin propiedad start', event);
        return false;
      }
      
      const eventStart = new Date(event.start);
      
      if (isNaN(eventStart.getTime())) {
        console.error('Error al verificar inicio de evento: fecha de inicio inválida', event);
        return false;
      }
      
      return (
        eventStart.getDate() === day.getDate() &&
        eventStart.getMonth() === day.getMonth() &&
        eventStart.getFullYear() === day.getFullYear() &&
        eventStart.getHours() === hour &&
        eventStart.getMinutes() === minutes
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
      if (!event?.start || !event?.end) {
        console.error('Error al verificar evento activo al inicio del día: evento sin propiedades requeridas', event);
        return false;
      }
      
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) {
        console.error('Error al verificar evento activo al inicio del día: fechas inválidas', event);
        return false;
      }
      
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
   * Formatea las horas para mostrar
   * @param {number} hour - Hora a formatear
   * @param {number} minutes - Minutos a formatear (0 por defecto)
   * @returns {string} - Hora formateada
   */
  const formatTimeSlot = useCallback((hour, minutes = 0) => {
    if (minutes === 0) {
      return formatHour(hour);
    } else {
      return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
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

  // Generar horas del grid (solo las horas principales)
  const hours = [];
  for (let i = startHour; i < endHour; i++) {
    hours.push(i);
  }

  // Efecto para actualizar la altura de la rejilla cuando cambia cellHeight
  if (gridHeight !== cellHeight) {
    setGridHeight(cellHeight);
  }

  return {
    hours,
    customSlots,
    gridHeight,
    setHourCellHeight,
    shouldShowEventStart,
    isEventActiveAtStartOfDay,
    formatTimeSlot,
    addCustomTimeSlot,
    removeCustomTimeSlot,
    canAddIntermediateSlot,
    canAddIntermediateSlotAt15,
    validateSubdivisionOrder,
    isLoading
  };
}

export default useTimeGrid;