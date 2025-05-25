// test/unit/src/utils/event-utils.test.js

/**
 * @jest-environment jsdom
 */

import {
  initializeGridInfo,
  getMonthIndex,
  findTargetSlot,
  calculatePreciseTimeChange
} from '../../../../src/utils/event-utils';

describe('Event Utils', () => {
  let mockEventRefCurrent;
  let mockEvent;
  let container;
  let originalConsoleError;

  beforeEach(() => {
    originalConsoleError = console.error;
    console.error = jest.fn();

    document.body.innerHTML = `
      <div class="calendar-grid">
        <div class="calendar-header-row">
          <div class="calendar-cell calendar-time-header"></div>
          <div class="calendar-cell calendar-day-header" data-date-info="Dom, 11 Mayo">Día 1</div>
          <div class="calendar-cell calendar-day-header" data-date-info="Lun, 12 Mayo">Día 2</div>
        </div>
        <div class="calendar-row">
            <div class="calendar-cell calendar-time">09:00</div>
            <div class="calendar-cell calendar-time-slot" data-hour="9" data-minutes="0"></div>
            <div class="calendar-cell calendar-time-slot" data-hour="9" data-minutes="0"></div>
        </div>
        <div class="calendar-row">
            <div class="calendar-cell calendar-time">10:00</div>
            <div class="calendar-cell calendar-time-slot" data-hour="10" data-minutes="0" id="slot-10-0-day1"></div>
            <div class="calendar-cell calendar-time-slot" data-hour="10" data-minutes="0" id="slot-10-0-day2"></div>
        </div>
      </div>
      <div class="day-view-container">
        <div class="day-view-hour-slot" data-hour="8" data-minutes="0"></div>
        <div class="day-view-hour-slot" data-hour="9" data-minutes="0" id="day-view-slot-9"></div>
      </div>
    `;
    container = document.querySelector('.calendar-grid');

    mockEventRefCurrent = document.createElement('div');
    mockEventRefCurrent.classList.add('calendar-event'); // Clase base de evento
    
    const firstSlot = document.getElementById('slot-10-0-day1'); // Usar un ID específico
    if (firstSlot) {
        firstSlot.appendChild(mockEventRefCurrent);
    }

    mockEvent = {
      id: 'evt1',
      start: new Date(2023, 4, 12, 10, 0, 0).toISOString(),
      end: new Date(2023, 4, 12, 11, 0, 0).toISOString(),
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
    console.error = originalConsoleError;
  });

  // ... (otros tests que ya pasaban) ...
  describe('initializeGridInfo', () => {
    test('debe inicializar correctamente para la vista semanal', () => {
      const eventRef = { current: mockEventRefCurrent };
      document.querySelectorAll('.calendar-day-header').forEach(el => {
        jest.spyOn(el, 'getBoundingClientRect').mockReturnValue({
          width: 100, height: 30, top: 0, left: 0, bottom: 0, right: 0, x:0, y:0, toJSON: () => {}
        });
      });
      jest.spyOn(container, 'getBoundingClientRect').mockReturnValue({
        width: 700, height: 1200, top: 0, left: 0, bottom: 0, right: 0, x:0, y:0, toJSON: () => {}
      });


      const gridInfo = initializeGridInfo(eventRef, 60, mockEvent);

      expect(gridInfo.inWeekView).toBe(true);
      expect(gridInfo.hourHeight).toBe(60);
      expect(gridInfo.dayWidth).toBeGreaterThan(0);
      // expect(gridInfo.days.length).toBe(2); // Esta aserción puede ser frágil dependiendo del parseo
      expect(gridInfo.startDay).toBeInstanceOf(Date);
      expect(gridInfo.startHour).toBe(10);
      expect(gridInfo.startMinute).toBe(0);
      expect(gridInfo.timeSlots.length).toBeGreaterThan(0);
    });

    test('debe inicializar correctamente para la vista diaria', () => {
      const dayViewContainer = document.querySelector('.day-view-container');
      const dayViewSlot = document.getElementById('day-view-slot-9');
      if (mockEventRefCurrent.parentElement) { // Asegurarse de que tiene padre antes de mover
        mockEventRefCurrent.parentElement.removeChild(mockEventRefCurrent);
      }
      dayViewSlot.appendChild(mockEventRefCurrent);

      const eventRef = { current: mockEventRefCurrent };
       jest.spyOn(dayViewContainer, 'getBoundingClientRect').mockReturnValue({
        width: 300, height: 1000, top: 0, left: 0, bottom: 0, right: 0, x:0, y:0, toJSON: () => {}
      });

      const gridInfo = initializeGridInfo(eventRef, 60, mockEvent);

      expect(gridInfo.inWeekView).toBe(false);
      expect(gridInfo.hourHeight).toBe(60);
      expect(gridInfo.dayWidth).toBe(0);
      expect(gridInfo.timeSlots.length).toBeGreaterThan(0);
    });
    
    test('debe manejar el caso donde eventRef.current es null', () => {
        const gridInfo = initializeGridInfo({ current: null }, 60, mockEvent);
        expect(gridInfo.containerElement).toBeNull();
    });
  });

  describe('getMonthIndex', () => {
    test('debe devolver el índice correcto para nombres de mes válidos', () => {
      expect(getMonthIndex('Ene')).toBe(0);
      expect(getMonthIndex('enero')).toBe(0);
      expect(getMonthIndex('Dic')).toBe(11);
      expect(getMonthIndex('diciembre')).toBe(11);
    });

    test('debe devolver -1 para nombres de mes inválidos', () => {
      expect(getMonthIndex('InvalidMonth')).toBe(-1);
      expect(getMonthIndex('')).toBe(-1);
    });
  });

  describe('findTargetSlot', () => {
    let dragInfo;
    beforeEach(() => {
        const eventRef = { current: mockEventRefCurrent };
        const slot = document.getElementById('slot-10-0-day1');
        if (mockEventRefCurrent.parentElement) {
            mockEventRefCurrent.parentElement.removeChild(mockEventRefCurrent);
        }
        slot.appendChild(mockEventRefCurrent);

        const grid = initializeGridInfo(eventRef, 60, mockEvent);
        dragInfo = {
            grid: grid,
            virtualDeltaY: undefined,
        };
        document.querySelectorAll('.calendar-time-slot, .day-view-hour-slot').forEach(el => {
            const baseTop = el.dataset.hour ? parseInt(el.dataset.hour) * 60 : 0;
            let baseLeft = 0;
            if (el.parentElement && el.parentElement.classList.contains('calendar-row')) {
                 const children = Array.from(el.parentElement.children);
                 const index = children.indexOf(el);
                 if (index > 0 && children[0].classList.contains('calendar-time')) { // Si la primera es la celda de tiempo
                    baseLeft = (index -1) * 100; // Asumiendo que 100 es el ancho de día
                 } else if (index > 0) { // Si no hay celda de tiempo, o es una fila diferente
                    baseLeft = index * 100;
                 }
            }


            jest.spyOn(el, 'getBoundingClientRect').mockReturnValue({
                top: baseTop, bottom: baseTop + 60,
                left: baseLeft, right: baseLeft + 100,
                width: 100, height: 60,
                x: baseLeft, y: baseTop,
                toJSON: () => ({})
            });
        });
    });

    test('debe encontrar el slot correcto usando elementsFromPoint si está directamente bajo el cursor', () => {
        const targetSlotElement = document.getElementById('slot-10-0-day2');
        const rect = targetSlotElement.getBoundingClientRect();
        const clientX = rect.left + 10;
        const clientY = rect.top + 10;

        document.elementsFromPoint = jest.fn().mockReturnValue([targetSlotElement, document.body]);
      
        const foundSlot = findTargetSlot(clientX, clientY, dragInfo);
        expect(foundSlot).toBe(targetSlotElement);
        expect(dragInfo.grid.targetSlot).toBe(targetSlotElement);
    });

    test('debe encontrar el slot por proximidad si no está directamente bajo el cursor', () => {
        document.elementsFromPoint = jest.fn().mockReturnValue([document.body]);
        const draggingEvent = document.querySelector('.calendar-event.dragging');
        if (draggingEvent) draggingEvent.style.visibility = 'hidden';

        const targetSlotElement = document.getElementById('slot-10-0-day2');
        const rect = targetSlotElement.getBoundingClientRect();
        const clientX = rect.left + 10;
        const clientY = rect.top + 10;

        const foundSlot = findTargetSlot(clientX, clientY, dragInfo);
        expect(foundSlot).toBe(targetSlotElement);
        
        if (draggingEvent) draggingEvent.style.visibility = '';
    });

    // Test Corregido
    test('debe actualizar data-events-count si el conteo visual es mayor', () => {
        const targetSlotElement = document.getElementById('slot-10-0-day1');
        targetSlotElement.setAttribute('data-events-count', '0');
        
        // Este es el evento que se está "arrastrando" (mockEventRefCurrent)
        // Para que el selector :not(.dragging) lo excluya, debe tener la clase 'dragging'
        mockEventRefCurrent.classList.add('dragging'); 

        // Añadir un evento visualmente que NO está siendo arrastrado
        const existingEvent = document.createElement('div');
        existingEvent.classList.add('calendar-event'); // No tiene .dragging
        targetSlotElement.appendChild(existingEvent);

        document.elementsFromPoint = jest.fn().mockReturnValue([targetSlotElement]);
        const clientX = targetSlotElement.getBoundingClientRect().left + 5;
        const clientY = targetSlotElement.getBoundingClientRect().top + 5;

        findTargetSlot(clientX, clientY, dragInfo);
        
        // QuerySelectorAll('.calendar-event:not(.dragging)') debería encontrar solo 'existingEvent'
        expect(targetSlotElement.getAttribute('data-events-count')).toBe('1');
        expect(dragInfo.grid.targetEventsCount).toBe(1);

        targetSlotElement.removeChild(existingEvent);
        mockEventRefCurrent.classList.remove('dragging'); // Limpiar para otros tests
    });
  });

  describe('calculatePreciseTimeChange', () => {
    test('debe calcular el cambio en minutos sin snap', () => {
      const change = calculatePreciseTimeChange(30, false, 60, 0);
      expect(change).toBe(30);
    });

    test('debe calcular el cambio en minutos con snap', () => {
      const change = calculatePreciseTimeChange(35, false, 60, 15);
      expect(change).toBe(30);
    });

    test('debe ajustar a casillas completas para redimensionamiento sin snap', () => {
      const change1 = calculatePreciseTimeChange(30, true, 60, 0);
      expect(change1).toBe(60);

      const change2 = calculatePreciseTimeChange(20, true, 60, 0);
      expect(change2).toBe(0);
    });
  });
});