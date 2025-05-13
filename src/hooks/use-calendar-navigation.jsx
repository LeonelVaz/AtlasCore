import { useState } from 'react';

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
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToCurrentWeek = () => {
    setCurrentDate(new Date());
  };

  // Manejar navegación de días en vista diaria
  const goToPreviousDay = () => {
    const prevDay = new Date(selectedDay);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDay(prevDay);
  };

  const goToNextDay = () => {
    const nextDay = new Date(selectedDay);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDay(nextDay);
  };

  const goToToday = () => {
    setSelectedDay(new Date());
    setCurrentDate(new Date()); // También actualizar la semana actual para sincronizar ambas vistas
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