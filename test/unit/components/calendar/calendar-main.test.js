// calendar-main.test.js

import React from 'react';
import { render, screen } from '@testing-library/react';
import CalendarMain from '../../../../src/components/calendar/calendar-main'; // Ajustá el path si es necesario
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
    // Mock de días de la semana
    dateUtils.generateWeekDays.mockReturnValue([
      new Date('2024-01-01'),
      new Date('2024-01-02'),
      new Date('2024-01-03'),
      new Date('2024-01-04'),
      new Date('2024-01-05'),
      new Date('2024-01-06'),
      new Date('2024-01-07'),
    ]);

    // Mock de formato de hora
    dateUtils.formatHour.mockImplementation(hour => `${hour}:00`);
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
});
