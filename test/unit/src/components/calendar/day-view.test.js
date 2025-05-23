import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DayView from '../../../../../src/components/calendar/day-view';
import { formatDate } from '../../../../../src/utils/date-utils';

// Mock del componente TimeGrid
jest.mock('../../../../../src/components/calendar/time-grid', () => {
  return jest.fn(({ days, events, onEventClick, onCellClick, onUpdateEvent, snapValue, renderDayHeader, maxSimultaneousEvents }) => (
    <div data-testid="time-grid-mock">
      <div data-testid="day-header-rendered">{renderDayHeader(days[0])}</div>
      <div>Fecha: {days[0].toISOString()}</div>
      <div>Cantidad de Eventos: {events.length}</div>
      <div>Precisión: {snapValue}</div>
      <div>Máx Simultáneos: {maxSimultaneousEvents}</div>
      <button onClick={() => onEventClick({ id: 'test-event' })}>ClicEnEvento</button>
      <button onClick={() => onCellClick(new Date(days[0]).setHours(10, 30, 0, 0), 10, 30, 30)}>ClicEnCelda</button>
      <button onClick={() => onUpdateEvent({ id: 'updated-event' })}>ActualizarEvento</button>
    </div>
  ));
});

// Mock de date-utils
jest.mock('../../../../../src/utils/date-utils', () => ({
  formatDate: jest.fn((date, options) => {
    if (options.weekday === 'long') return 'Lunes'; // Ejemplo
    if (options.month === 'long') return 'Enero'; // Ejemplo
    return date.toString(); // Fallback
  }),
}));

describe('Componente DayView', () => {
  const mockFecha = new Date(2023, 0, 2, 10, 0, 0); // 2 de Enero, 2023, 10:00 AM
  const mockEventos = [{ id: '1', title: 'Evento 1', start: mockFecha, end: new Date(mockFecha.getTime() + 3600000) }];
  const mockOnEventClick = jest.fn();
  const mockOnTimeSlotClick = jest.fn();
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renderiza TimeGrid con las props correctas', () => {
    render(
      <DayView
        date={mockFecha}
        events={mockEventos}
        onEventClick={mockOnEventClick}
        onTimeSlotClick={mockOnTimeSlotClick}
        onUpdate={mockOnUpdate}
        snapValue={15}
        maxSimultaneousEvents={2}
      />
    );

    const timeGridMock = screen.getByTestId('time-grid-mock');
    expect(timeGridMock).toBeInTheDocument();
    expect(screen.getByText(`Fecha: ${mockFecha.toISOString()}`)).toBeInTheDocument();
    expect(screen.getByText('Cantidad de Eventos: 1')).toBeInTheDocument();
    expect(screen.getByText('Precisión: 15')).toBeInTheDocument();
    expect(screen.getByText('Máx Simultáneos: 2')).toBeInTheDocument();
  });

  test('renderDayHeader formatea y muestra la información del día correctamente', () => {
    render(<DayView date={mockFecha} events={[]} />);
    
    const dayHeaderRendered = screen.getByTestId('day-header-rendered');
    expect(dayHeaderRendered).toBeInTheDocument();

    expect(formatDate).toHaveBeenCalledWith(mockFecha, { weekday: 'long' });
    expect(formatDate).toHaveBeenCalledWith(mockFecha, { month: 'long' });
    
    // Verifica partes del encabezado renderizado
    expect(screen.getByText('Lunes')).toBeInTheDocument(); // Del mock formatDate
    expect(screen.getByText(mockFecha.getDate().toString())).toBeInTheDocument();
    expect(screen.getByText('Enero')).toBeInTheDocument(); // Del mock formatDate
  });

  test('handleTimeSlotClick pasa los argumentos correctos a la prop onTimeSlotClick', () => {
    render(
      <DayView
        date={mockFecha}
        events={mockEventos}
        onEventClick={mockOnEventClick}
        onTimeSlotClick={mockOnTimeSlotClick}
        onUpdate={mockOnUpdate}
      />
    );

    fireEvent.click(screen.getByText('ClicEnCelda'));
    
    const fechaEsperadaConHora = new Date(mockFecha);
    fechaEsperadaConHora.setHours(10, 30, 0, 0);

    // El primer argumento es el timestamp de la fecha/hora
    expect(mockOnTimeSlotClick).toHaveBeenCalledWith(fechaEsperadaConHora.getTime(), 10, 30, 30);
  });

  test('pasa los manejadores de eventos a TimeGrid', () => {
    render(
      <DayView
        date={mockFecha}
        events={mockEventos}
        onEventClick={mockOnEventClick}
        onTimeSlotClick={mockOnTimeSlotClick}
        onUpdate={mockOnUpdate}
      />
    );

    fireEvent.click(screen.getByText('ClicEnEvento'));
    expect(mockOnEventClick).toHaveBeenCalledWith({ id: 'test-event' });

    fireEvent.click(screen.getByText('ActualizarEvento'));
    expect(mockOnUpdate).toHaveBeenCalledWith({ id: 'updated-event' });
  });

  test('usa valores por defecto para snapValue y maxSimultaneousEvents si no se proveen', () => {
    render(
      <DayView
        date={mockFecha}
        events={mockEventos}
        onEventClick={mockOnEventClick}
        onTimeSlotClick={mockOnTimeSlotClick}
        onUpdate={mockOnUpdate}
      />
    );
    // Accede al mock directamente para verificar las props pasadas
    const TimeGrid = require('../../../../../src/components/calendar/time-grid');
    const lastCallProps = TimeGrid.mock.calls[TimeGrid.mock.calls.length - 1][0];
    
    expect(lastCallProps.snapValue).toBe(0); // Valor por defecto de DayView
    expect(lastCallProps.maxSimultaneousEvents).toBe(3); // Valor por defecto de DayView
  });
});