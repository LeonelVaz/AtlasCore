// test/unit/stage2.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Importar los componentes a probar
import CalendarMain from '../../src/components/calendar/calendar-main';
import Button from '../../src/components/ui/button';
import Dialog from '../../src/components/ui/dialog';
import SnapControl from '../../src/components/calendar/snap-control';
import EventForm from '../../src/components/calendar/event-form';

// Mocks necesarios
jest.mock('../../src/services/storage-service', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockResolvedValue([]),
    set: jest.fn().mockResolvedValue(true)
  }
}));

jest.mock('../../src/core/bus/event-bus', () => ({
  __esModule: true,
  default: {
    subscribe: jest.fn().mockReturnValue(() => {}),
    publish: jest.fn()
  },
  EventCategories: {
    CALENDAR: 'calendar',
    APP: 'app',
    STORAGE: 'storage'
  }
}));

// Mock para funciones de fecha para tener una fecha consistente en las pruebas
const mockDate = new Date('2025-05-10T12:00:00Z');
const originalDate = global.Date;
jest.spyOn(global, 'Date').mockImplementation((args) => {
  if (args) {
    return new originalDate(args);
  }
  return mockDate;
});

// Funciones helper para las pruebas
const renderCalendarMain = () => {
  return render(<CalendarMain />);
};

describe('1. Renderizado del Componente', () => {
  // Restaurar mocks después de cada prueba
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('1.1 La estructura de la cuadrícula del calendario se renderiza correctamente con las franjas horarias', () => {
    renderCalendarMain();
    
    // Verificar que existe la cuadrícula del calendario
    const calendarGrid = document.querySelector('.calendar-grid');
    expect(calendarGrid).toBeInTheDocument();
    
    // Verificar que hay franjas horarias (time slots)
    const timeSlots = document.querySelectorAll('.calendar-time-slot');
    expect(timeSlots.length).toBeGreaterThan(0);
    
    // Verificar que hay una estructura de filas
    const calendarRows = document.querySelectorAll('.calendar-row');
    expect(calendarRows.length).toBeGreaterThan(23); // Al menos 24 horas (0-23)
  });

  test('1.2 El encabezado de hora muestra 24 horas con el formato correcto', () => {
    renderCalendarMain();
    
    // Verificar que hay 24 encabezados de hora (0-23)
    const timeHeaders = document.querySelectorAll('.calendar-time');
    expect(timeHeaders.length).toBe(24);
    
    // Verificar el formato de algunas horas (pueden variar según la implementación)
    const timePattern = /^\d{2}:\d{2}$/;
    expect(timeHeaders[0].textContent).toMatch(timePattern);
    expect(timeHeaders[12].textContent).toMatch(timePattern);
    expect(timeHeaders[23].textContent).toMatch(timePattern);
  });

  test('1.3 Los botones de navegación de fecha se renderizan y se puede hacer clic', () => {
    renderCalendarMain();
    
    // Verificar que existen los botones de navegación
    const prevButton = screen.getByText(/semana anterior/i);
    const nextButton = screen.getByText(/semana siguiente/i);
    const currentButton = screen.getByText(/semana actual/i);
    
    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
    expect(currentButton).toBeInTheDocument();
    
    // Verificar que se puede hacer clic en ellos
    fireEvent.click(prevButton);
    fireEvent.click(nextButton);
    fireEvent.click(currentButton);
    
    // No hay error al hacer clic (prueba implícita)
  });

  test('1.4 El título del calendario muestra el mes y el año correctos', () => {
    renderCalendarMain();
    
    // Verificar que el título del calendario contiene el mes y año actuales
    const calendarTitle = document.querySelector('.calendar-title h2');
    expect(calendarTitle).toBeInTheDocument();
    
    // La fecha es mayo 2025 según nuestro mock
    expect(calendarTitle.textContent.toLowerCase()).toContain('mayo');
    expect(calendarTitle.textContent).toContain('2025');
  });

  test('1.5 Los encabezados de día muestran las fechas con el formato correcto', () => {
    renderCalendarMain();
    
    // Verificar que hay encabezados para los días de la semana
    const dayHeaders = document.querySelectorAll('.calendar-day-header');
    expect(dayHeaders.length).toBe(7); // 7 días de la semana
    
    // Verificar que los encabezados tienen un formato válido
    // No podemos saber el formato exacto, pero al menos deben tener texto
    dayHeaders.forEach(header => {
      expect(header.textContent.trim().length).toBeGreaterThan(3);
    });
  });

  test('1.6 El formulario de evento no se muestra inicialmente', () => {
    renderCalendarMain();
    
    // Verificar que el formulario de evento no está visible inicialmente
    const eventForm = document.querySelector('.ui-dialog');
    expect(eventForm).not.toBeInTheDocument();
    
    // Alternativamente, verificar que no hay elementos del formulario visibles
    const titleInput = screen.queryByLabelText(/título/i);
    expect(titleInput).not.toBeInTheDocument();
  });

  test('1.7 El sistema de vistas alterna correctamente entre vista semanal y diaria', async () => {
    renderCalendarMain();
    
    // Verificar que inicialmente está en vista semanal
    expect(document.querySelector('.week-view')).toBeInTheDocument();
    
    // Cambiar a vista diaria
    const dayViewButton = screen.getByText(/vista diaria/i);
    fireEvent.click(dayViewButton);
    
    // Verificar que cambia a vista diaria
    await waitFor(() => {
      expect(document.querySelector('.day-view-container')).toBeInTheDocument();
    });
    
    // Volver a vista semanal
    const weekViewButton = screen.getByText(/vista semanal/i);
    fireEvent.click(weekViewButton);
    
    // Verificar que vuelve a vista semanal
    await waitFor(() => {
      expect(document.querySelector('.week-view')).toBeInTheDocument();
    });
  });

  test('1.8 El control de snap (imán) se renderiza correctamente', () => {
    renderCalendarMain();
    
    // Verificar que existe el control de snap
    const snapControl = document.querySelector('.snap-control-container');
    expect(snapControl).toBeInTheDocument();
    
    // Verificar que tiene el botón toggle y el indicador de valor
    const snapToggle = document.querySelector('.snap-control-toggle');
    const snapValue = document.querySelector('.snap-value-indicator');
    
    expect(snapToggle).toBeInTheDocument();
    expect(snapValue).toBeInTheDocument();
    
    // El valor inicial puede variar según la implementación
  });

  test('1.9 Los nuevos componentes UI (Button, Dialog) se renderizan correctamente', () => {
    // Probar el componente Button
    const { rerender } = render(
      <Button variant="primary" onClick={() => {}}>Test Button</Button>
    );
    
    const button = screen.getByText('Test Button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('ui-button');
    expect(button).toHaveClass('ui-button-primary');
    
    // Probar diferentes variantes de Button
    rerender(<Button variant="secondary" onClick={() => {}}>Secondary Button</Button>);
    const secondaryButton = screen.getByText('Secondary Button');
    expect(secondaryButton).toHaveClass('ui-button-secondary');
    
    // Probar el componente Dialog
    render(
      <Dialog 
        isOpen={true} 
        onClose={() => {}} 
        title="Test Dialog"
      >
        Dialog Content
      </Dialog>
    );
    
    const dialog = screen.getByText('Test Dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Dialog Content')).toBeInTheDocument();
    expect(document.querySelector('.ui-dialog')).toBeInTheDocument();
  });

  test('1.10 La estructura CSS modular se aplica correctamente a todos los componentes', () => {
    renderCalendarMain();
    
    // Verificar que las clases CSS modulares se aplican correctamente
    // Componentes del calendario
    expect(document.querySelector('.calendar-container')).toBeInTheDocument();
    expect(document.querySelector('.calendar-header')).toBeInTheDocument();
    
    // Componentes de vista (al menos uno debe existir)
    const hasViewComponent = Boolean(
      document.querySelector('.week-view') || 
      document.querySelector('.day-view-container')
    );
    expect(hasViewComponent).toBe(true);
    
    // Grid y eventos
    const hasGridComponent = Boolean(
      document.querySelector('.calendar-grid') || 
      document.querySelector('.day-view-timeline')
    );
    expect(hasGridComponent).toBe(true);
    
    // Componentes UI
    const buttons = document.querySelectorAll('button');
    // Al menos algunos botones deben tener la clase ui-button
    const hasUIButtons = Array.from(buttons).some(button => 
      button.classList.contains('ui-button')
    );
    expect(hasUIButtons).toBe(true);
    
    // Controles específicos
    expect(document.querySelector('.snap-control-container')).toBeInTheDocument();
  });
});

