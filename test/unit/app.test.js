import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../../src/app';

// Mock del componente CalendarMain para aislarlo en pruebas de App
jest.mock('../../src/components/calendar/calendar-main', () => {
  return function MockCalendarMain() {
    return <div data-testid="mock-calendar">Calendario Simulado</div>;
  };
});

describe('App', () => {
  test('debe renderizar correctamente el header con el título', () => {
    render(<App />);
    expect(screen.getByText('Atlas')).toBeInTheDocument();
  });

  test('debe renderizar el componente CalendarMain', () => {
    render(<App />);
    expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
  });

  test('debe tener la estructura básica con header y main', () => {
    const { container } = render(<App />);
    expect(container.querySelector('.app-header')).toBeInTheDocument();
    expect(container.querySelector('.app-content')).toBeInTheDocument();
  });

  test('debe tener los estilos de clase apropiados', () => {
    const { container } = render(<App />);
    expect(container.firstChild).toHaveClass('app-container');
  });
});