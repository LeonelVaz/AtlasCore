// use-time-grid.jsx (optimizado)
import { useState, useEffect, useCallback } from 'react';
import { formatHour } from '../utils/date-utils';
import { DEFAULT_HOUR_CELL_HEIGHT, STORAGE_KEYS } from '../core/config/constants';
import storageService from '../services/storage-service';
import eventBus from '../core/bus/event-bus';

function useTimeGrid(startHour = 0, endHour = 24, cellHeight = DEFAULT_HOUR_CELL_HEIGHT) {
  const [customSlots, setCustomSlots] = useState({});
  const [gridHeight, setGridHeight] = useState(cellHeight);
  const [isLoading, setIsLoading] = useState(true);
  
  // Cargar franjas personalizadas
  useEffect(() => {
    const loadCustomSlots = async () => {
      try {
        const savedSlots = await storageService.get(STORAGE_KEYS.CUSTOM_TIME_SLOTS, {});
        const slotsWithDuration = {};
        
        Object.entries(savedSlots).forEach(([hour, slots]) => {
          const hourNum = parseInt(hour, 10);
          const sortedSlots = [...slots].sort((a, b) => a.minutes - b.minutes);
          
          slotsWithDuration[hourNum] = sortedSlots.map((slot, index) => {
            let duration;
            if (index < sortedSlots.length - 1) {
              duration = sortedSlots[index + 1].minutes - slot.minutes;
            } else {
              duration = 60 - slot.minutes;
            }
            return { ...slot, duration };
          });
        });
        
        setCustomSlots(slotsWithDuration);
        setIsLoading(false);
      } catch (error) {
        console.error('Error al cargar franjas horarias:', error);
        setCustomSlots({});
        setIsLoading(false);
      }
    };

    loadCustomSlots();
  }, []);

  // Guardar franjas cuando cambien
  useEffect(() => {
    if (!isLoading) {
      storageService.set(STORAGE_KEYS.CUSTOM_TIME_SLOTS, customSlots);
      eventBus.publish('calendar.timeSlotsChanged', customSlots);
    }
  }, [customSlots, isLoading]);

  // Funciones de utilidad
  const recalculateSlotDurations = (hour, slots) => {
    const sortedSlots = [...slots].sort((a, b) => a.minutes - b.minutes);
    
    return sortedSlots.map((slot, index) => {
      const duration = index < sortedSlots.length - 1 
        ? sortedSlots[index + 1].minutes - slot.minutes 
        : 60 - slot.minutes;
      return { ...slot, duration };
    });
  };

  const validateSubdivisionOrder = useCallback((hour, minutes) => {
    const hourSlots = customSlots[hour] || [];
    if (minutes === 45 && !hourSlots.some(slot => slot.minutes === 30)) {
      console.warn(`No se puede crear franja a las ${hour}:45 sin crear primero franja a las ${hour}:30`);
      return false;
    }
    return true;
  }, [customSlots]);

  // Agregar franja horaria
  const addCustomTimeSlot = useCallback((hour, minutes) => {
    try {
      if (hour < 0 || hour >= 24 || minutes < 0 || minutes >= 60) {
        console.error('Parámetros de franja horaria inválidos:', hour, minutes);
        return false;
      }
      
      // Ajustar a múltiplo de 15
      const validMinutes = Math.round(minutes / 15) * 15;
      if (validMinutes !== minutes) {
        console.warn(`Minutos ajustados de ${minutes} a ${validMinutes}`);
        minutes = validMinutes;
      }
      
      // Verificar si ya existe
      const hourSlots = customSlots[hour] || [];
      if (hourSlots.some(slot => slot.minutes === minutes)) {
        console.warn(`La franja ${hour}:${minutes} ya existe`);
        return false;
      }
      
      if (!validateSubdivisionOrder(hour, minutes)) return false;
      
      setCustomSlots(prev => {
        const updatedSlots = { ...prev };
        const newHourSlots = [...(updatedSlots[hour] || []), { minutes }];
        updatedSlots[hour] = recalculateSlotDurations(hour, newHourSlots);
        return updatedSlots;
      });
      
      return true;
    } catch (error) {
      console.error('Error al agregar franja horaria:', error);
      return false;
    }
  }, [customSlots, validateSubdivisionOrder]);

  // Eliminar franja horaria
  const removeCustomTimeSlot = useCallback((hour, minutes) => {
    try {
      if (hour < 0 || hour >= 24 || minutes <= 0 || minutes >= 60) {
        console.error('Parámetros de franja horaria inválidos:', hour, minutes);
        return false;
      }
      
      const hourSlots = customSlots[hour] || [];
      if (!hourSlots.some(slot => slot.minutes === minutes)) {
        console.warn(`La franja ${hour}:${minutes} no existe`);
        return false;
      }
      
      setCustomSlots(prev => {
        const updatedSlots = { ...prev };
        const filteredSlots = updatedSlots[hour].filter(slot => slot.minutes !== minutes);
        
        if (filteredSlots.length === 0) {
          delete updatedSlots[hour];
        } else {
          updatedSlots[hour] = recalculateSlotDurations(hour, filteredSlots);
        }
        
        return updatedSlots;
      });
      
      return true;
    } catch (error) {
      console.error('Error al eliminar franja horaria:', error);
      return false;
    }
  }, [customSlots]);

  // Verificadores
  const canAddIntermediateSlot = useCallback((hour, minutes) => {
    const hourSlots = customSlots[hour] || [];
    
    if (minutes === 0) {
      return !hourSlots.some(slot => slot.minutes === 30);
    }
    
    if (minutes === 30) {
      return !hourSlots.some(slot => slot.minutes === 45);
    }
    
    return false;
  }, [customSlots]);

  const canAddIntermediateSlotAt15 = useCallback((hour) => {
    const hourSlots = customSlots[hour] || [];
    return hourSlots.some(slot => slot.minutes === 30) && 
           !hourSlots.some(slot => slot.minutes === 15);
  }, [customSlots]);

  // Verificar solapamientos
  const eventsOverlapInTimeSlot = useCallback((event1, event2, day = null) => {
    try {
      if (!event1?.start || !event1?.end || !event2?.start || !event2?.end) return false;
      
      const start1 = new Date(event1.start);
      const end1 = new Date(event1.end);
      const start2 = new Date(event2.start);
      const end2 = new Date(event2.end);
      
      if (isNaN(start1.getTime()) || isNaN(end1.getTime()) || 
          isNaN(start2.getTime()) || isNaN(end2.getTime())) return false;
      
      if (day) {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);
        
        if ((end1 <= dayStart || start1 >= dayEnd) || 
            (end2 <= dayStart || start2 >= dayEnd)) return false;
        
        const visibleStart1 = start1 < dayStart ? dayStart : start1;
        const visibleEnd1 = end1 > dayEnd ? dayEnd : end1;
        const visibleStart2 = start2 < dayStart ? dayStart : start2;
        const visibleEnd2 = end2 > dayEnd ? dayEnd : end2;
        
        return visibleStart1 < visibleEnd2 && visibleStart2 < visibleEnd1;
      }
      
      return start1 < end2 && start2 < end1;
    } catch (error) {
      console.error('Error al verificar solapamiento:', error);
      return false;
    }
  }, []);

  // Verificar inicio de evento
  const shouldShowEventStart = useCallback((event, day, hour, minutes = 0, duration = 60) => {
    try {
      if (!event?.start) return false;
      
      const eventStart = new Date(event.start);
      if (isNaN(eventStart.getTime())) return false;
      
      const sameDay = (
        eventStart.getDate() === day.getDate() &&
        eventStart.getMonth() === day.getMonth() &&
        eventStart.getFullYear() === day.getFullYear()
      );
      
      if (!sameDay) return false;
      
      const cellStartMinutes = hour * 60 + minutes;
      const cellEndMinutes = cellStartMinutes + duration;
      const eventStartMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
      
      return eventStartMinutes >= cellStartMinutes && eventStartMinutes < cellEndMinutes;
    } catch (error) {
      console.error('Error al verificar inicio de evento:', error);
      return false;
    }
  }, []);

  // Verificar evento activo al inicio del día
  const isEventActiveAtStartOfDay = useCallback((event, day) => {
    try {
      if (!event?.start || !event?.end) return false;
      
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) return false;
      
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      
      return eventStart < dayStart && eventEnd > dayStart;
    } catch (error) {
      console.error('Error al verificar evento activo al inicio del día:', error);
      return false;
    }
  }, []);

  // Calcular posición relativa del evento
  const getEventPositionInSlot = useCallback((event, hour, minutes = 0, duration = 60, cellHeight = 60) => {
    try {
      if (!event?.start) return { offsetPercent: 0, offsetPixels: 0 };
      
      const eventStart = new Date(event.start);
      if (isNaN(eventStart.getTime())) return { offsetPercent: 0, offsetPixels: 0 };
      
      const cellStartMinutes = hour * 60 + minutes;
      const eventStartMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
      const offsetMinutes = eventStartMinutes - cellStartMinutes;
      
      const limitedOffsetMinutes = Math.max(0, Math.min(duration, offsetMinutes));
      const offsetPercent = (limitedOffsetMinutes / duration) * 100;
      const offsetPixels = (limitedOffsetMinutes / 60) * cellHeight;
      
      return { offsetPercent, offsetPixels };
    } catch (error) {
      console.error('Error al calcular posición del evento:', error);
      return { offsetPercent: 0, offsetPixels: 0 };
    }
  }, []);

  // Formatear hora
  const formatTimeSlot = useCallback((hour, minutes = 0) => {
    return minutes === 0 
      ? formatHour(hour) 
      : `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }, []);

  // Ajustar altura
  const setHourCellHeight = useCallback((newHeight) => {
    if (newHeight > 0) setGridHeight(newHeight);
  }, []);

  // Generar horas 
  const hours = [];
  for (let i = startHour; i < endHour; i++) {
    hours.push(i);
  }

  // Actualizar gridHeight si es necesario
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
    isLoading,
    getEventPositionInSlot,
    eventsOverlapInTimeSlot
  };
}

export default useTimeGrid;