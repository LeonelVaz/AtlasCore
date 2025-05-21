import { useState } from 'react';
import eventBus, { CalendarEvents } from '../core/bus/event-bus';

/**
 * Hook personalizado para gestionar la navegación del calendario
 * @returns {Object} - Funciones y estados para navegación
 */
function useCalendarNavigation() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  
  // Navegación entre semanas
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
    
    // Publicar evento de cambio de fecha
    eventBus.publish(CalendarEvents.DATE_CHANGED, {
      date: newDate,
      previousDate: currentDate,
      navigation: 'previousWeek'
    });
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
    
    // Publicar evento de cambio de fecha
    eventBus.publish(CalendarEvents.DATE_CHANGED, {
      date: newDate,
      previousDate: currentDate,
      navigation: 'nextWeek'
    });
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const previousDate = new Date(currentDate);
    setCurrentDate(today);
    
    // Publicar evento de cambio de fecha
    eventBus.publish(CalendarEvents.DATE_CHANGED, {
      date: today,
      previousDate: previousDate,
      navigation: 'today'
    });
  };

  // Manejar navegación de días en vista diaria
  const goToPreviousDay = () => {
    const prevDay = new Date(selectedDay);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDay(prevDay);
    
    // Publicar evento de cambio de fecha
    eventBus.publish(CalendarEvents.DATE_CHANGED, {
      date: prevDay,
      previousDate: selectedDay,
      navigation: 'previousDay'
    });
  };

  const goToNextDay = () => {
    const nextDay = new Date(selectedDay);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDay(nextDay);
    
    // Publicar evento de cambio de fecha
    eventBus.publish(CalendarEvents.DATE_CHANGED, {
      date: nextDay,
      previousDate: selectedDay,
      navigation: 'nextDay'
    });
  };

  const goToToday = () => {
    const today = new Date();
    const previousDay = new Date(selectedDay);
    setSelectedDay(today);
    setCurrentDate(today); // También actualizar la semana actual para sincronizar ambas vistas
    
    // Publicar evento de cambio de fecha
    eventBus.publish(CalendarEvents.DATE_CHANGED, {
      date: today,
      previousDate: previousDay,
      navigation: 'today'
    });
  };
  
  return {
    currentDate,
    selectedDay,
    setCurrentDate,
    setSelectedDay,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    goToPreviousDay,
    goToNextDay,
    goToToday
  };
}

export default useCalendarNavigation;