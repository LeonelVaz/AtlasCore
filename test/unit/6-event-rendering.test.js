// test/unit/6-event-rendering.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Importar los componentes a probar
import CalendarMain from '../../src/components/calendar/calendar-main';
import EventItem from '../../src/components/calendar/event-item';
import TimeGrid from '../../src/components/calendar/time-grid';

// Mocks para servicios
const mockEvents = [
  {
    id: "event-1",
    title: "Reunión del equipo",
    start: "2025-05-10T10:00:00Z",
    end: "2025-05-10T11:00:00Z",
    color: "#2D4B94"
  },
  {
    id: "event-2",
    title: "Evento de múltiples días",
    start: "2025-05-10T22:00:00Z",
    end: "2025-05-11T02:00:00Z",
    color: "#FF5722"
  },
  {
    id: "event-3",
    title: "Curso de formación",
    start: "2025-05-10T14:30:00Z",
    end: "2025-05-10T16:00:00Z",
    color: "#26A69A"
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

describe('6. Representación de Eventos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  afterAll(() => {
    mockDateNow.mockRestore();
  });

  test('6.1 Los eventos se representan en las franjas horarias correctas según la hora de inicio', async () => {
    render(<CalendarMain />);
    
    // Esperar a que se carguen los eventos
    await waitFor(() => {
      const events = document.querySelectorAll('.calendar-event');
      expect(events.length).toBeGreaterThan(0);
    });
    
    // Verificar que los eventos aparecen en las franjas horarias correctas
    const timeSlots = document.querySelectorAll('.calendar-time-slot');
    
    // Evento en la hora 10:00
    const slot10 = Array.from(timeSlots).find(slot => {
      // Encontrar el contenedor que corresponde a las 10:00
      const rowIndex = 10; // Hora 10
      return slot.closest('.calendar-row') === document.querySelectorAll('.calendar-row')[rowIndex];
    });
    
    // Verificar que el slot de las 10:00 contiene un evento
    expect(slot10).toBeTruthy();
    const event10 = slot10.querySelector('.calendar-event');
    expect(event10).toBeTruthy();
    expect(event10.textContent).toContain('Reunión del equipo');
    
    // Evento en la hora 14:30
    const slot14 = Array.from(timeSlots).find(slot => {
      // Encontrar el contenedor que corresponde a las 14:00
      const rowIndex = 14; // Hora 14
      return slot.closest('.calendar-row') === document.querySelectorAll('.calendar-row')[rowIndex];
    });
    
    // Verificar que el slot de las 14:00 contiene un evento
    expect(slot14).toBeTruthy();
    const event14 = slot14.querySelector('.calendar-event');
    expect(event14).toBeTruthy();
    expect(event14.textContent).toContain('Curso de formación');
  });

  test('6.2 Los eventos se muestran con el título correcto', async () => {
    render(<CalendarMain />);
    
    // Esperar a que se carguen los eventos
    await waitFor(() => {
      const events = document.querySelectorAll('.calendar-event');
      expect(events.length).toBeGreaterThan(0);
    });
    
    // Verificar que los eventos tienen los títulos correctos
    const eventElements = document.querySelectorAll('.event-title');
    const titles = Array.from(eventElements).map(e => e.textContent);
    
    // Verificar que los títulos de los eventos están presentes
    expect(titles).toContain('Reunión del equipo');
    expect(titles.some(title => title.includes('Curso de formación'))).toBe(true);
    expect(titles.some(title => title.includes('Evento de múltiples días'))).toBe(true);
  });

  test('6.3 Los eventos se muestran con el formato de hora correcto', async () => {
    // Renderizar directamente un EventItem para verificar el formato de hora
    const testEvent = mockEvents[0]; // Reunión del equipo
    const mockOnClick = jest.fn();
    const mockOnUpdate = jest.fn();
    
    // Renderizar evento de prueba
    render(
      <div data-testid="event-container">
        <EventItem
          event={testEvent}
          onClick={mockOnClick}
          onUpdate={mockOnUpdate}
          snapValue={0}
        />
      </div>
    );
    
    // Verificar que el formato de hora está presente
    const eventContainer = screen.getByTestId('event-container');
    const eventTimeElement = eventContainer.querySelector('.event-time');
    
    expect(eventTimeElement).toBeInTheDocument();
    
    // El formato puede variar, pero debería contener la hora de inicio y fin
    const timeText = eventTimeElement.textContent;
    expect(timeText).toMatch(/\d{1,2}:\d{2}/); // Formato hh:mm
    
    // Debería contener alguna referencia a las horas de inicio y fin (10:00 - 11:00)
    expect(timeText).toMatch(/10/);
    expect(timeText).toMatch(/11/);
  });

  test('6.4 Los eventos se muestran con el color de fondo correcto', async () => {
    render(<CalendarMain />);
    
    // Esperar a que se carguen los eventos
    await waitFor(() => {
      const events = document.querySelectorAll('.calendar-event');
      expect(events.length).toBeGreaterThan(0);
    });
    
    // Obtener todos los eventos y verificar que tienen los colores correctos
    const eventElements = document.querySelectorAll('.calendar-event');
    
    // Verificar cada evento por su título y color
    const reunionEvent = Array.from(eventElements).find(e => e.textContent.includes('Reunión del equipo'));
    expect(reunionEvent).toBeInTheDocument();
    expect(reunionEvent.style.backgroundColor).toBe('rgb(45, 75, 148)') || 
      expect(reunionEvent.style.backgroundColor).toBe('#2D4B94');
    
    const cursoEvent = Array.from(eventElements).find(e => e.textContent.includes('Curso de formación'));
    expect(cursoEvent).toBeInTheDocument();
    expect(cursoEvent.style.backgroundColor).toBe('rgb(38, 166, 154)') || 
      expect(cursoEvent.style.backgroundColor).toBe('#26A69A');
  });

  test('6.5 Se puede hacer clic en los eventos y abren el formulario de edición', async () => {
    render(<CalendarMain />);
    
    // Esperar a que se carguen los eventos
    await waitFor(() => {
      const events = document.querySelectorAll('.calendar-event');
      expect(events.length).toBeGreaterThan(0);
    });
    
    // Hacer clic en un evento
    const firstEvent = document.querySelector('.calendar-event');
    expect(firstEvent).toBeInTheDocument();
    
    fireEvent.click(firstEvent);
    
    // Verificar que se abre el formulario de edición
    await waitFor(() => {
      expect(document.querySelector('.ui-dialog')).toBeInTheDocument();
      
      // Verificar que el formulario tiene los datos del evento
      const titleInput = screen.getByLabelText(/título/i);
      expect(titleInput).toBeInTheDocument();
      
      // El formulario debe contener los datos del evento que se hizo clic
      expect(titleInput.value).toBeTruthy();
      
      // Verificar que es el formulario de edición, no de creación
      const dialogTitle = document.querySelector('.ui-dialog-title');
      expect(dialogTitle.textContent.toLowerCase()).toContain('editar');
    });
  });

  test('6.6 Los eventos que continúan entre días muestran indicadores visuales adecuados', async () => {
    render(<CalendarMain />);
    
    // Esperar a que se carguen los eventos
    await waitFor(() => {
      const events = document.querySelectorAll('.calendar-event');
      expect(events.length).toBeGreaterThan(0);
    });
    
    // Buscar eventos que continúan al día siguiente
    await waitFor(() => {
      // Evento que cruza al día siguiente
      const multiDayEvents = document.querySelectorAll('.calendar-event.continues-next-day');
      expect(multiDayEvents.length).toBeGreaterThan(0);
      
      // Verificar que el evento corresponde al evento de múltiples días
      const multiDayEvent = Array.from(multiDayEvents).find(e => 
        e.textContent.includes('Evento de múltiples días')
      );
      expect(multiDayEvent).toBeTruthy();
      
      // Verificar que tiene los estilos CSS adecuados para indicar continuidad
      expect(multiDayEvent).toHaveClass('continues-next-day');
    });
  });
});