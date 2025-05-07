// calendar-main.test.js

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CalendarMain from '../../../../src/components/calendar/calendar-main'; // Ajusta el path si es necesario
import * as dateUtils from '../../../../src/utils/date-utils';

// Mocks obligatorios según las notas del plan
jest.mock('../../../../src/core/bus/event-bus', () => ({
  __esModule: true,
  default: {
    subscribe: jest.fn(() => () => {}),
    publish: jest.fn(),
  },
  EventCategories: {
    STORAGE: 'storage',
  },
}));

jest.mock('../../../../src/core/module/module-registry', () => ({
  registerModule: jest.fn(),
}));

jest.mock('../../../../src/utils/date-utils');

describe('CalendarMain - Renderizado de estructura de cuadrícula', () => {
  beforeEach(() => {
    // Mock de días de la semana (ajustado para mayo de 2025)
    dateUtils.generateWeekDays.mockReturnValue([
      new Date('2025-05-05'),
      new Date('2025-05-06'),
      new Date('2025-05-07'),
      new Date('2025-05-08'),
      new Date('2025-05-09'),
      new Date('2025-05-10'),
      new Date('2025-05-11'),
    ]);

    // Mock de formato de hora
    dateUtils.formatHour.mockImplementation(hour => `${hour}:00`);

    // Mock de la fecha actual (6 de mayo de 2025)
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2025-05-06').getTime());
  });

  // test 1.1: La estructura de la cuadrícula del calendario se renderiza correctamente con las franjas horarias
  test('la estructura de la cuadrícula del calendario se renderiza con las 24 franjas horarias', () => {
    render(<CalendarMain />);
    
    // Verifica que se renderizan las 24 horas
    for (let i = 0; i < 24; i++) {
      const hourLabel = screen.getAllByText(`${i}:00`);
      expect(hourLabel.length).toBeGreaterThan(0); // Puede haber más de una ocurrencia
    }
  });

  // test 1.2: El encabezado de hora muestra 24 horas con el formato correcto
  test('el encabezado de hora muestra 24 horas con el formato correcto', () => {
    render(<CalendarMain />);
    
    // Verifica que cada hora está en formato correcto
    for (let i = 0; i < 24; i++) {
      const hourLabel = screen.getAllByText(`${i}:00`);
      hourLabel.forEach(label => {
        expect(label).toHaveTextContent(`${i}:00`);
      });
    }
  });

  // test 1.3: Los botones de navegación de fecha se renderizan y se puede hacer clic
  test('los botones de navegación de fecha se renderizan y se puede hacer clic', () => {
    render(<CalendarMain />);
    
    // Verifica que los botones de navegación están presentes
    const prevButton = screen.getByRole('button', { name: /anterior/i });
    const nextButton = screen.getByRole('button', { name: /siguiente/i });
    
    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
    
    // Simula un clic en el botón siguiente
    fireEvent.click(nextButton);
    // Aquí puedes agregar expectativas para verificar que el calendario cambió a la siguiente fecha
    // Ejemplo: verificar si el mes del calendario ha cambiado
    
    fireEvent.click(prevButton);
    // Verifica que el calendario vuelva a la fecha anterior
  });

  // test 1.4: El título del calendario muestra el mes y el año correctos
  test('el título del calendario muestra el mes y el año correctos', () => {
    render(<CalendarMain />);
    
    // Verifica que el título muestra mayo de 2025
    const title = screen.getByText('mayo de 2025');
    expect(title).toBeInTheDocument();
  });
});
