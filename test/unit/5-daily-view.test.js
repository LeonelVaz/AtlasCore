// test/unit/5-daily-view.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Importar los componentes a probar
import CalendarMain from '../../src/components/calendar/calendar-main';
import DayView from '../../src/components/calendar/day-view';

// Mocks para servicios y hooks
const mockEvents = [
  {
    id: "event-1",
    title: "Evento que empieza por la mañana",
    start: "2025-05-10T09:00:00Z",
    end: "2025-05-10T10:00:00Z",
    color: "#2D4B94"
  },
  {
    id: "event-2",
    title: "Evento que cruza días",
    start: "2025-05-09T22:00:00Z",
    end: "2025-05-10T02:00:00Z",
    color: "#26A69A"
  },
  {
    id: "event-3",
    title: "Evento que continúa al día siguiente",
    start: "2025-05-10T20:00:00Z",
    end: "2025-05-11T04:00:00Z",
    color: "#FF9800"
  }
];

// Mock para storage
const mockStorageGet = jest.fn().mockImplementation(() => Promise.resolve(mockEvents));
const mockStorageSet = jest.fn().mockImplementation(() => Promise.resolve(true));

jest.mock('../../src/services/storage-service', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockStorageGet(...args),
    set: (...args) => mockStorageSet(...args)
  }
}));

// Mock para EventBus
const mockSubscribe = jest.fn().mockReturnValue(() => {});
const mockPublish = jest.fn();

jest.mock('../../src/core/bus/event-bus', () => ({
  __esModule: true,
  default: {
    subscribe: (...args) => mockSubscribe(...args),
    publish: (...args) => mockPublish(...args)
  },
  EventCategories: {
    CALENDAR: 'calendar',
    APP: 'app',
    STORAGE: 'storage'
  }
}));

// Mock para fecha constante
const mockDate = new Date('2025-05-10T12:00:00Z');
const originalDate = global.Date;
const mockDateNow = jest.spyOn(global.Date, 'now').mockImplementation(() => mockDate.getTime());

// Mock para formato de hora
jest.mock('../../src/utils/time-utils', () => {
  const original = jest.requireActual('../../src/utils/time-utils');
  return {
    ...original,
    formatEventTime: jest.fn(event => {
      const start = new Date(event.start);
      const end = new Date(event.end);
      return `${start.getHours()}:00 - ${end.getHours()}:00`;
    })
  };
});

describe('5. Vista Diaria', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  afterAll(() => {
    mockDateNow.mockRestore();
  });

  test('5.1 La vista diaria muestra correctamente las 24 horas del día', async () => {
    // Renderizar CalendarMain y cambiar a vista diaria
    render(<CalendarMain />);
    
    // Cambiar a vista diaria
    const dayViewButton = screen.getByText(/vista diaria/i);
    fireEvent.click(dayViewButton);
    
    // Esperar a que cargue la vista diaria
    await waitFor(() => {
      expect(document.querySelector('.day-view-container')).toBeInTheDocument();
    });
    
    // Verificar que hay 24 filas para las horas (0-23)
    const hourRows = document.querySelectorAll('.day-view-hour-row');
    expect(hourRows.length).toBe(24);
    
    // Verificar que las etiquetas de hora se muestran correctamente
    const hourLabels = document.querySelectorAll('.day-view-hour-label');
    
    // Comprobar algunas horas claves (00:00, 12:00, 23:00)
    expect(hourLabels[0].textContent).toMatch(/00:00/);
    expect(hourLabels[12].textContent).toMatch(/12:00/);
    expect(hourLabels[23].textContent).toMatch(/23:00/);
  });

  test('5.2 Los eventos se muestran correctamente en la vista diaria', async () => {
    // Renderizar CalendarMain y cambiar a vista diaria
    render(<CalendarMain />);
    
    // Cambiar a vista diaria
    const dayViewButton = screen.getByText(/vista diaria/i);
    fireEvent.click(dayViewButton);
    
    // Esperar a que cargue la vista diaria y aparezcan los eventos
    await waitFor(() => {
      expect(document.querySelector('.day-view-container')).toBeInTheDocument();
      
      // Debería haber al menos un evento en la vista diaria
      const events = document.querySelectorAll('.calendar-event');
      expect(events.length).toBeGreaterThan(0);
    });
    
    // Verificar que los eventos contienen sus títulos
    const eventElements = document.querySelectorAll('.calendar-event');
    const eventTitles = Array.from(eventElements).map(e => e.textContent);
    
    expect(eventTitles.some(title => title.includes('Evento que empieza por la mañana'))).toBe(true);
    expect(eventTitles.some(title => title.includes('Evento que cruza días'))).toBe(true);
    expect(eventTitles.some(title => title.includes('Evento que continúa al día siguiente'))).toBe(true);
  });

  test('5.3 La navegación entre fechas funciona en la vista diaria', async () => {
    // Renderizar CalendarMain y cambiar a vista diaria
    render(<CalendarMain />);
    
    // Cambiar a vista diaria
    const dayViewButton = screen.getByText(/vista diaria/i);
    fireEvent.click(dayViewButton);
    
    // Esperar a que cargue la vista diaria
    await waitFor(() => {
      expect(document.querySelector('.day-view-container')).toBeInTheDocument();
    });
    
    // Obtener el título inicial
    const initialTitle = document.querySelector('.day-view-title').textContent;
    expect(initialTitle.toLowerCase()).toContain('10');  // Día 10
    expect(initialTitle.toLowerCase()).toContain('mayo'); // Mayo
    
    // Navegar al día siguiente
    const nextDayButton = screen.getByText(/día siguiente/i);
    fireEvent.click(nextDayButton);
    
    // Verificar que el título cambia
    await waitFor(() => {
      const newTitle = document.querySelector('.day-view-title').textContent;
      expect(newTitle).not.toBe(initialTitle);
      expect(newTitle.toLowerCase()).toContain('11');  // Ahora debería ser día 11
      expect(newTitle.toLowerCase()).toContain('mayo');
    });
    
    // Navegar al día anterior (de vuelta al 10)
    const prevDayButton = screen.getByText(/día anterior/i);
    fireEvent.click(prevDayButton);
    
    // Verificar que volvemos al día inicial
    await waitFor(() => {
      const returnedTitle = document.querySelector('.day-view-title').textContent;
      expect(returnedTitle.toLowerCase()).toContain('10');
      expect(returnedTitle.toLowerCase()).toContain('mayo');
    });
  });

  test('5.4 La vista diaria gestiona correctamente los eventos que continúan desde el día anterior', async () => {
    // Renderizar directamente el componente DayView con props específicas
    const mockOnEventClick = jest.fn();
    const mockOnTimeSlotClick = jest.fn();
    const mockOnUpdate = jest.fn();
    
    // Crear fecha para representar el 10 de mayo
    const testDate = new Date('2025-05-10T12:00:00Z');
    
    // Renderizar DayView directamente para tener más control
    render(
      <DayView
        date={testDate}
        events={mockEvents}
        onEventClick={mockOnEventClick}
        onTimeSlotClick={mockOnTimeSlotClick}
        onUpdate={mockOnUpdate}
        snapValue={0}
      />
    );
    
    // Verificar que existe un evento con clase "continues-from-prev-day"
    await waitFor(() => {
      const continuingEvents = document.querySelectorAll('.continues-from-prev-day');
      expect(continuingEvents.length).toBeGreaterThan(0);
      
      // Verificar que aparece en la parte superior del día
      const eventWrappers = document.querySelectorAll('.event-wrapper.continues-from-prev-day');
      expect(eventWrappers.length).toBeGreaterThan(0);
      
      // El evento que cruza desde el día anterior es "Evento que cruza días"
      const eventText = eventWrappers[0].textContent;
      expect(eventText).toContain('Evento que cruza días');
    });
  });

  test('5.5 La vista diaria gestiona correctamente los eventos que continúan al día siguiente', async () => {
    // Renderizar directamente el componente DayView con props específicas
    const mockOnEventClick = jest.fn();
    const mockOnTimeSlotClick = jest.fn();
    const mockOnUpdate = jest.fn();
    
    // Crear fecha para representar el 10 de mayo
    const testDate = new Date('2025-05-10T12:00:00Z');
    
    // Renderizar DayView directamente para tener más control
    render(
      <DayView
        date={testDate}
        events={mockEvents}
        onEventClick={mockOnEventClick}
        onTimeSlotClick={mockOnTimeSlotClick}
        onUpdate={mockOnUpdate}
        snapValue={0}
      />
    );
    
    // Verificar que existe un evento con clase "continues-next-day"
    await waitFor(() => {
      const continuingEvents = document.querySelectorAll('.continues-next-day');
      expect(continuingEvents.length).toBeGreaterThan(0);
      
      // Verificar que al menos uno de estos eventos es el que continúa al día siguiente
      const eventWrappers = document.querySelectorAll('.event-wrapper.continues-next-day');
      expect(eventWrappers.length).toBeGreaterThan(0);
      
      // El evento que continúa al día siguiente es "Evento que continúa al día siguiente"
      const allEventTexts = Array.from(eventWrappers).map(e => e.textContent).join(' ');
      expect(allEventTexts).toContain('Evento que continúa al día siguiente');
    });
  });
});