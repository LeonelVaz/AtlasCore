/**
 * Utilidades para manejar eventos con soporte para diferentes escalas de tiempo
 */

/**
 * Inicializa la información de la rejilla del calendario
 * @param {React.RefObject} eventRef - Referencia al elemento del evento
 * @param {number} gridSize - Tamaño de la rejilla en píxeles
 * @param {Object} event - Evento a manejar
 * @returns {Object} Información de la rejilla
 */
export function initializeGridInfo(eventRef, gridSize, event) {
  try {
    const isWeekView = eventRef.current.closest('.calendar-grid') !== null;
    const isInDayView = eventRef.current.closest('.day-view-container') !== null;
    
    const currentSlot = eventRef.current.closest('.calendar-time-slot') || 
                        eventRef.current.closest('.day-view-hour-slot');
    
    let timeSlots = [];
    let container = null;
    
    if (isWeekView) {
      container = eventRef.current.closest('.calendar-grid');
      timeSlots = container ? Array.from(container.querySelectorAll('.calendar-time-slot')) : [];
    } else {
      container = eventRef.current.closest('.day-view-container');
      timeSlots = container ? Array.from(container.querySelectorAll('.day-view-hour-slot')) : [];
    }
    
    // Vista diaria (solo info vertical)
    if (isInDayView) {
      return {
        containerElement: container,
        gridRect: container ? container.getBoundingClientRect() : null,
        dayWidth: 0,
        hourHeight: gridSize,
        days: [],
        dayElements: [],
        inWeekView: false,
        startDay: new Date(event.start),
        startHour: new Date(event.start).getHours(),
        startMinute: new Date(event.start).getMinutes(), // Añadir minutos del inicio
        timeSlots,
        startSlot: currentSlot,
        targetSlot: currentSlot
      };
    }
    
    // Vista semanal (info horizontal y vertical)
    const gridElement = container;
    const gridRect = gridElement?.getBoundingClientRect();
    
    const headerRow = gridElement?.querySelector('.calendar-header-row');
    const dayHeaders = headerRow?.querySelectorAll('.calendar-day-header');
    const dayElements = [];
    const days = [];
    
    let totalDayWidth = 0;
    let dayCount = 0;
    
    if (dayHeaders) {
      dayHeaders.forEach((dayHeader, index) => {
        if (index > 0) { // Ignorar header de tiempo
          const headerText = dayHeader.textContent || '';
          const dateParts = headerText.split(',');
          if (dateParts.length > 1) {
            let dayDate = new Date();
            
            try {
              const monthYearStr = dateParts[1].trim();
              const [day, month] = monthYearStr.split(' ');
              const monthIndex = getMonthIndex(month);
              
              if (!isNaN(parseInt(day)) && monthIndex !== -1) {
                dayDate = new Date();
                dayDate.setDate(parseInt(day));
                dayDate.setMonth(monthIndex);
              }
            } catch (e) {
              console.log('Error parsing date from header:', e);
            }
            
            days.push(dayDate);
            dayElements.push(dayHeader);
            
            const dayRect = dayHeader.getBoundingClientRect();
            totalDayWidth += dayRect.width;
            dayCount++;
          }
        }
      });
    }
    
    const avgDayWidth = dayCount > 0 ? totalDayWidth / dayCount : gridRect ? gridRect.width / 7 : 0;
    const startDay = new Date(event.start);
    const startHour = startDay.getHours();
    const startMinute = startDay.getMinutes();
    
    return {
      containerElement: gridElement,
      gridRect,
      dayWidth: avgDayWidth,
      hourHeight: gridSize,
      days,
      dayElements,
      inWeekView: true,
      startDay,
      startHour,
      startMinute,
      timeSlots,
      startSlot: currentSlot,
      targetSlot: currentSlot
    };
  } catch (error) {
    console.error('Error initializing grid info:', error);
    return {
      containerElement: null,
      gridRect: null,
      dayWidth: 0,
      hourHeight: gridSize,
      days: [],
      dayElements: [],
      inWeekView: false,
      startDay: new Date(event.start),
      startHour: new Date(event.start).getHours(),
      startMinute: new Date(event.start).getMinutes(),
      timeSlots: [],
      startSlot: null,
      targetSlot: null
    };
  }
}

/**
 * Convierte nombre de mes a índice
 * @param {string} monthName - Nombre del mes
 * @returns {number} Índice del mes (0-11)
 */
export function getMonthIndex(monthName) {
  const months = {
    'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
    'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
  };
  
  for (const [abbr, index] of Object.entries(months)) {
    if (monthName.toLowerCase().startsWith(abbr)) {
      return index;
    }
  }
  
  return -1;
}

/**
 * Encuentra la celda destino según posición
 * @param {number} clientX - Posición X del cursor
 * @param {number} clientY - Posición Y del cursor
 * @param {Object} dragInfo - Información del arrastre
 * @returns {Element|null} Elemento de la celda destino
 */
export function findTargetSlot(clientX, clientY, dragInfo) {
  if (!dragInfo.grid || !dragInfo.grid.timeSlots.length) {
    return null;
  }
  
  const deltaY = clientY - dragInfo.startY;
  const deltaX = clientX - dragInfo.startX;
  
  // Aplicar snap a la posición vertical (tiempo)
  let adjustedDeltaY = deltaY;
  if (dragInfo.snapValue > 0) {
    // Convertir snapValue (minutos) a pixeles según la escala actual
    const pixelsPerMinute = dragInfo.grid.hourHeight / 60;
    const snapPixels = dragInfo.snapValue * pixelsPerMinute;
    adjustedDeltaY = Math.round(deltaY / snapPixels) * snapPixels;
  }
  
  // Calcular cambio en horas considerando la escala actual
  const hourDelta = Math.round(adjustedDeltaY / dragInfo.grid.hourHeight);
  let dayDelta = 0;
  
  if (dragInfo.grid.inWeekView && dragInfo.grid.dayWidth > 0) {
    dayDelta = Math.round(deltaX / dragInfo.grid.dayWidth);
  }
  
  if (hourDelta === 0 && dayDelta === 0) {
    return dragInfo.grid.startSlot;
  }
  
  const slots = dragInfo.grid.timeSlots;
  if (!slots.length) return null;
  
  const startSlotIndex = slots.indexOf(dragInfo.grid.startSlot);
  if (startSlotIndex === -1) return null;
  
  const rowSize = dragInfo.grid.inWeekView ? 7 : 1;
  
  let targetRowIndex = Math.floor(startSlotIndex / rowSize) + hourDelta;
  let targetColIndex = startSlotIndex % rowSize + dayDelta;
  
  targetRowIndex = Math.max(0, Math.min(targetRowIndex, Math.floor((slots.length - 1) / rowSize)));
  targetColIndex = Math.max(0, Math.min(targetColIndex, rowSize - 1));
  
  const targetIndex = targetRowIndex * rowSize + targetColIndex;
  
  if (targetIndex >= 0 && targetIndex < slots.length) {
    return slots[targetIndex];
  }
  
  return null;
}

/**
 * Calcula el cambio de tiempo preciso teniendo en cuenta la escala de tiempo y ajustando a límites de casillas
 * @param {number} deltaY - Delta Y en píxeles
 * @param {boolean} isResize - Indica si es redimensionamiento
 * @param {number} gridSize - Tamaño de la rejilla en píxeles (altura por hora)
 * @param {number} snapValue - Valor de snap en minutos
 * @returns {number} Cambio en minutos
 */
export function calculatePreciseTimeChange(deltaY, isResize = false, gridSize = 60, snapValue = 0) {
  // Calcular píxeles por minuto según la escala actual
  const pixelsPerMinute = gridSize / 60;
  
  // Si estamos redimensionando SIN snap activado, ajustar a casillas completas
  if (isResize && snapValue === 0) {
    // Determinar cuántas casillas enteras se ha desplazado
    // Dividir el desplazamiento por el tamaño de la celda para obtener el número de casillas
    const cellDelta = Math.round(deltaY / gridSize);
    
    // Convertir casillas a minutos (cada casilla es una hora = 60 minutos)
    return cellDelta * 60;
  }
  
  // Si hay snap activado (o no es redimensionamiento), usar la lógica normal
  if (snapValue > 0) {
    // Con snap activado, calcular cuántos intervalos de snap
    const snapPixels = snapValue * pixelsPerMinute;
    const snapIntervals = Math.round(deltaY / snapPixels);
    
    // Devuelve minutos exactos basados en el snap
    return snapIntervals * snapValue;
  }
  
  // Para movimientos normales sin snap
  return Math.round(deltaY / pixelsPerMinute);
}