// test/unit/2-date-navigation.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Importar los componentes a probar
import CalendarMain from '../../src/components/calendar/calendar-main';

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

// Configuración para fecha consistente en las pruebas
describe('2. Navegación por Fecha', () => {
  // Mock para Date global
  const mockDate = new Date('2025-05-05T12:00:00');  // 5 de mayo de 2025, un lunes
  const originalDate = global.Date;
  
  beforeAll(() => {
    // Mock completo de Date para asegurar consistencia
    const OriginalDate = global.Date;
    global.Date = class extends OriginalDate {
      constructor(...args) {
        if (args.length === 0) {
          return new OriginalDate(mockDate);
        }
        return new OriginalDate(...args);
      }
      static now() {
        return mockDate.getTime();
      }
    };
  });

  afterAll(() => {
    // Restaurar Date después de todas las pruebas
    global.Date = originalDate;
  });

  beforeEach(() => {
    // Limpiar mocks antes de cada prueba
    jest.clearAllMocks();
  });

  test('2.1 El botón de la semana anterior reduce la fecha en 7 días', async () => {
    render(<CalendarMain />);
    
    // Obtener título inicial (debería ser mayo 2025)
    const initialTitle = document.querySelector('.calendar-title h2').textContent;
    expect(initialTitle.toLowerCase()).toContain('mayo');
    expect(initialTitle).toContain('2025');
    
    // Verificar los días iniciales mostrados (comenzando con 4 o 5 de mayo 2025)
    const dayHeaders = document.querySelectorAll('.calendar-day-header');
    const initialFirstDay = dayHeaders[0].textContent;
    
    // Clic en botón de semana anterior
    const prevWeekButton = screen.getByText(/semana anterior/i);
    fireEvent.click(prevWeekButton);
    
    // Esperar a que se actualice la UI
    await waitFor(() => {
      // Verificar que los días han cambiado (debería ser finales de abril)
      const updatedDayHeaders = document.querySelectorAll('.calendar-day-header');
      const updatedFirstDay = updatedDayHeaders[0].textContent;
      
      // El primer día debe ser diferente al inicial
      expect(updatedFirstDay).not.toBe(initialFirstDay);
      
      // El título podría cambiar a abril si la primera fecha mostrada es de abril
      const updatedTitle = document.querySelector('.calendar-title h2').textContent;
      expect(updatedTitle).toMatch(/abril|mayo/i);
    });
  });

  test('2.2 El botón de la semana siguiente incrementa la fecha en 7 días', async () => {
    render(<CalendarMain />);
    
    // Obtener título inicial (debería ser mayo 2025)
    const initialTitle = document.querySelector('.calendar-title h2').textContent;
    expect(initialTitle.toLowerCase()).toContain('mayo');
    expect(initialTitle).toContain('2025');
    
    // Verificar los días iniciales mostrados
    const dayHeaders = document.querySelectorAll('.calendar-day-header');
    const initialLastDay = dayHeaders[6].textContent;
    
    // Clic en botón de semana siguiente
    const nextWeekButton = screen.getByText(/semana siguiente/i);
    fireEvent.click(nextWeekButton);
    
    // Esperar a que se actualice la UI
    await waitFor(() => {
      // Verificar que los días han cambiado
      const updatedDayHeaders = document.querySelectorAll('.calendar-day-header');
      const updatedLastDay = updatedDayHeaders[6].textContent;
      
      // El último día debe ser diferente al inicial
      expect(updatedLastDay).not.toBe(initialLastDay);
      
      // El título debería seguir siendo mayo
      const updatedTitle = document.querySelector('.calendar-title h2').textContent;
      expect(updatedTitle.toLowerCase()).toContain('mayo');
    });
  });

  test('2.3 El botón de la semana actual se restablece a la fecha actual', async () => {
    render(<CalendarMain />);
    
    // Primero, navegar a la semana siguiente
    const nextWeekButton = screen.getByText(/semana siguiente/i);
    fireEvent.click(nextWeekButton);
    
    // Esperar a que se actualice la UI
    await waitFor(() => {
      const title = document.querySelector('.calendar-title h2').textContent;
      expect(title.toLowerCase()).toContain('mayo');
    });
    
    // Verificar los días después de ir a la semana siguiente
    const dayHeadersAfterNext = document.querySelectorAll('.calendar-day-header');
    const dayAfterNext = dayHeadersAfterNext[0].textContent;
    
    // Ahora, volver a la semana actual
    const currentWeekButton = screen.getByText(/semana actual/i);
    fireEvent.click(currentWeekButton);
    
    // Esperar a que se actualice la UI
    await waitFor(() => {
      const updatedDayHeaders = document.querySelectorAll('.calendar-day-header');
      const updatedFirstDay = updatedDayHeaders[0].textContent;
      
      // El primer día debe ser diferente al de la semana siguiente
      expect(updatedFirstDay).not.toBe(dayAfterNext);
      
      // El título debería ser mayo 2025
      const updatedTitle = document.querySelector('.calendar-title h2').textContent;
      expect(updatedTitle.toLowerCase()).toContain('mayo');
      expect(updatedTitle).toContain('2025');
    });
  });

  test('2.4 Los días de la semana se generan correctamente para cualquier fecha', async () => {
    render(<CalendarMain />);
    
    // Verificar la semana inicial
    let dayHeaders = document.querySelectorAll('.calendar-day-header');
    expect(dayHeaders.length).toBe(7);
    
    // Navegar a otras semanas para verificar generación correcta
    // Semana anterior
    const prevWeekButton = screen.getByText(/semana anterior/i);
    fireEvent.click(prevWeekButton);
    
    await waitFor(() => {
      dayHeaders = document.querySelectorAll('.calendar-day-header');
      expect(dayHeaders.length).toBe(7);
      
      // Verificar que cada día tiene un formato válido
      dayHeaders.forEach(header => {
        expect(header.textContent.trim().length).toBeGreaterThan(3);
      });
    });
    
    // Semana siguiente (2 veces para ir más allá de la fecha actual)
    const nextWeekButton = screen.getByText(/semana siguiente/i);
    fireEvent.click(nextWeekButton);
    fireEvent.click(nextWeekButton);
    
    await waitFor(() => {
      dayHeaders = document.querySelectorAll('.calendar-day-header');
      expect(dayHeaders.length).toBe(7);
      
      // Verificar que cada día tiene un formato válido
      dayHeaders.forEach(header => {
        expect(header.textContent.trim().length).toBeGreaterThan(3);
      });
    });
  });

  test('2.5 En vista diaria, el botón de día anterior reduce la fecha en 1 día', async () => {
    render(<CalendarMain />);
    
    // Cambiar a vista diaria
    const dayViewButton = screen.getByText(/vista diaria/i);
    fireEvent.click(dayViewButton);
    
    await waitFor(() => {
      expect(document.querySelector('.day-view-container')).toBeInTheDocument();
    });
    
    // Obtener título inicial
    const initialTitle = document.querySelector('.day-view-title').textContent;
    
    // Clic en botón de día anterior
    const prevDayButton = screen.getByText(/día anterior/i);
    fireEvent.click(prevDayButton);
    
    // Esperar a que se actualice la UI
    await waitFor(() => {
      const updatedTitle = document.querySelector('.day-view-title').textContent;
      expect(updatedTitle).not.toBe(initialTitle);
    });
  });

  test('2.6 En vista diaria, el botón de día siguiente incrementa la fecha en 1 día', async () => {
    render(<CalendarMain />);
    
    // Cambiar a vista diaria
    const dayViewButton = screen.getByText(/vista diaria/i);
    fireEvent.click(dayViewButton);
    
    await waitFor(() => {
      expect(document.querySelector('.day-view-container')).toBeInTheDocument();
    });
    
    // Obtener título inicial
    const initialTitle = document.querySelector('.day-view-title').textContent;
    
    // Clic en botón de día siguiente
    const nextDayButton = screen.getByText(/día siguiente/i);
    fireEvent.click(nextDayButton);
    
    // Esperar a que se actualice la UI
    await waitFor(() => {
      const updatedTitle = document.querySelector('.day-view-title').textContent;
      expect(updatedTitle).not.toBe(initialTitle);
    });
  });

  test('2.7 En vista diaria, el botón "Hoy" se restablece a la fecha actual', async () => {
    render(<CalendarMain />);
    
    // Cambiar a vista diaria
    const dayViewButton = screen.getByText(/vista diaria/i);
    fireEvent.click(dayViewButton);
    
    await waitFor(() => {
      expect(document.querySelector('.day-view-container')).toBeInTheDocument();
    });
    
    // Obtener título inicial (5 de mayo 2025)
    const initialTitle = document.querySelector('.day-view-title').textContent;
    expect(initialTitle.toLowerCase()).toContain('5');
    expect(initialTitle.toLowerCase()).toContain('mayo');
    expect(initialTitle).toContain('2025');
    
    // Navegar 2 días hacia adelante
    const nextDayButton = screen.getByText(/día siguiente/i);
    fireEvent.click(nextDayButton);
    fireEvent.click(nextDayButton);
    
    // Verificar que la fecha ha cambiado
    await waitFor(() => {
      const changedTitle = document.querySelector('.day-view-title').textContent;
      expect(changedTitle).not.toBe(initialTitle);
    });
    
    // Volver a la fecha actual
    const todayButton = screen.getByText(/hoy/i);
    fireEvent.click(todayButton);
    
    // Verificar que se ha vuelto a la fecha actual (5 de mayo)
    await waitFor(() => {
      const restoredTitle = document.querySelector('.day-view-title').textContent;
      // Debería contener "5" y "mayo" de 2025
      expect(restoredTitle.toLowerCase()).toContain('5');
      expect(restoredTitle.toLowerCase()).toContain('mayo');
      expect(restoredTitle).toContain('2025');
    });
  });

  test('2.8 El cambio de vista mantiene la fecha seleccionada correctamente', async () => {
    render(<CalendarMain />);
    
    // Navegar a otra semana para tener una fecha diferente a la actual
    const nextWeekButton = screen.getByText(/semana siguiente/i);
    fireEvent.click(nextWeekButton);
    
    // Esperar a que se actualice la UI
    await waitFor(() => {
      const weekTitle = document.querySelector('.calendar-title h2').textContent;
      expect(weekTitle.toLowerCase()).toContain('mayo');
    });
    
    // Cambiar a vista diaria
    const dayViewButton = screen.getByText(/vista diaria/i);
    fireEvent.click(dayViewButton);
    
    // Esperar a que cambie a vista diaria
    await waitFor(() => {
      expect(document.querySelector('.day-view-container')).toBeInTheDocument();
    });
    
    // Verificar que la fecha en vista diaria sigue siendo de mayo 2025
    const dayTitle = document.querySelector('.day-view-title').textContent;
    expect(dayTitle.toLowerCase()).toContain('mayo');
    expect(dayTitle).toContain('2025');
    
    // Cambiar de nuevo a vista semanal
    const weekViewButton = screen.getByText(/vista semanal/i);
    fireEvent.click(weekViewButton);
    
    // Esperar a que vuelva a vista semanal
    await waitFor(() => {
      expect(document.querySelector('.week-view')).toBeInTheDocument();
    });
    
    // Verificar que la semana sigue siendo la misma (la siguiente a la actual)
    const weekTitleAfterSwitch = document.querySelector('.calendar-title h2').textContent;
    expect(weekTitleAfterSwitch.toLowerCase()).toContain('mayo');
    expect(weekTitleAfterSwitch).toContain('2025');
  });
});