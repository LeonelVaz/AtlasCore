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
 * Encuentra la celda destino según posición del cursor y actualiza la información de arrastre
 * @param {number} clientX - Posición X del cursor
 * @param {number} clientY - Posición Y del cursor
 * @param {Object} dragInfo - Información del arrastre
 * @returns {Element|null} Elemento de la celda destino
 */
export function findTargetSlot(clientX, clientY, dragInfo) {
  if (!dragInfo.grid || !dragInfo.grid.timeSlots.length) {
    return null;
  }
  
  // 1. Obtener todas las celdas visibles
  const slots = dragInfo.grid.timeSlots;
  
  // 2. Identificar el elemento en la posición actual del cursor
  // Uso de elementsFromPoint para obtener todos los elementos apilados
  const elementsAtPoint = document.elementsFromPoint(clientX, clientY);
  
  // 3. Primera estrategia: Buscar una celda directamente en la pila de elementos
  let targetSlot = null;
  for (const element of elementsAtPoint) {
    if (element.classList && (element.classList.contains('calendar-time-slot') || 
                             element.classList.contains('day-view-hour-slot'))) {
      targetSlot = element;
      break;
    }
  }
  
  // 4. Segunda estrategia: Si no encontramos una celda, buscar por coordenadas
  if (!targetSlot) {
    // Ocultar temporalmente el evento que se está arrastrando para ver qué hay debajo
    const draggingEvent = document.querySelector('.calendar-event.dragging');
    let originalVisibility = null;
    
    if (draggingEvent) {
      originalVisibility = draggingEvent.style.visibility;
      draggingEvent.style.visibility = 'hidden';
      
      // Intentar de nuevo con el evento oculto
      const elementUnderEvent = document.elementFromPoint(clientX, clientY);
      
      // Restaurar visibilidad
      draggingEvent.style.visibility = originalVisibility;
      
      if (elementUnderEvent) {
        // Buscar la celda más cercana en el árbol DOM
        let current = elementUnderEvent;
        while (current && !targetSlot) {
          if (current.classList && (current.classList.contains('calendar-time-slot') || 
                                   current.classList.contains('day-view-hour-slot'))) {
            targetSlot = current;
          } else if (current.parentElement) {
            current = current.parentElement;
          } else {
            break;
          }
        }
      }
    }
  }
  
  // 5. Tercera estrategia: Si aún no encontramos una celda, encontrar la celda por proximidad espacial
  if (!targetSlot) {
    // Calcular qué celda está más cerca del cursor
    let closestDistance = Infinity;
    
    for (const slot of slots) {
      const rect = slot.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const distance = Math.sqrt(
        Math.pow(clientX - centerX, 2) + 
        Math.pow(clientY - centerY, 2)
      );
      
      if (distance < closestDistance) {
        closestDistance = distance;
        targetSlot = slot;
      }
    }
  }
  
  // 6. Actualizar la posición Y virtual para sincronizar con el destino real
  if (targetSlot) {
    // Actualizar el grid con información de la celda objetivo
    dragInfo.grid.targetSlot = targetSlot;
    
    // Extraer información de hora y minutos de la celda
    const hour = parseInt(targetSlot.getAttribute('data-hour') || '0', 10);
    const minutes = parseInt(targetSlot.getAttribute('data-minutes') || '0', 10);
    dragInfo.grid.targetHour = hour;
    dragInfo.grid.targetMinutes = minutes;
    
    // MEJORADO: Obtener conteo de eventos de forma más confiable
    let eventsCount = parseInt(targetSlot.getAttribute('data-events-count') || '0', 10);
    
    // Contar eventos visualmente si están disponibles los selectores DOM
    if (targetSlot.querySelectorAll) {
      const visibleEvents = targetSlot.querySelectorAll('.calendar-event:not(.dragging)');
      const domCount = visibleEvents.length;
      
      // Usar el valor más alto entre el atributo y el conteo visual
      if (domCount > eventsCount) {
        eventsCount = domCount;
      }
      
      // Actualizar el atributo para mantener la coherencia
      targetSlot.setAttribute('data-events-count', eventsCount.toString());
    }
    
    // Actualizar el conteo en la información de arrastre
    dragInfo.grid.targetEventsCount = eventsCount;
    
    // Obtener el rectángulo de la celda objetivo
    const targetRect = targetSlot.getBoundingClientRect();
    
    if (dragInfo.grid.startSlot) {
      // Sincronizar la posición virtual de arrastre con la posición real del objetivo
      // para garantizar que la previsualización y el drop coincidan
      const originalRect = dragInfo.grid.startSlot.getBoundingClientRect();
      const virtualDeltaY = targetRect.top - originalRect.top;
      
      // Esto garantiza que el cálculo en handleMouseUp use este valor sincronizado
      // en lugar del deltaY del mouse
      dragInfo.virtualDeltaY = virtualDeltaY;
    }
  }
  
  return targetSlot;
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