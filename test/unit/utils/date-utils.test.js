import {
  getFirstDayOfWeek,
  getLastDayOfWeek,
  formatDate,
  formatTime,
  formatHour,
  isTimeOverlapping,
  addDays,
  generateWeekDays,
  isPastDate,
  isSameDay
} from '../../../src/utils/date-utils';

describe('Date Utilities', () => {
  describe('getFirstDayOfWeek', () => {
    test('debe obtener el domingo para una fecha intermedia de la semana', () => {
      // Miércoles 15 de abril de 2025
      const date = new Date(2025, 3, 15);
      const result = getFirstDayOfWeek(date);
      
      // Debería devolver Domingo 13 de abril de 2025
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(3);
      expect(result.getDate()).toBe(13);
      expect(result.getDay()).toBe(0); // 0 = Domingo
    });

    test('debe devolver la misma fecha si ya es domingo', () => {
      // Domingo 13 de abril de 2025
      const date = new Date(2025, 3, 13);
      const result = getFirstDayOfWeek(date);
      
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(3);
      expect(result.getDate()).toBe(13);
      expect(result.getDay()).toBe(0);
    });

    test('debe manejar cambios de mes correctamente', () => {
      // Martes 1 de abril de 2025
      const date = new Date(2025, 3, 1);
      const result = getFirstDayOfWeek(date);
      
      // Debería devolver Domingo 30 de marzo de 2025
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(2); // 2 = Marzo
      expect(result.getDate()).toBe(30);
    });

    test('debe mantener la hora original de la fecha', () => {
      const date = new Date(2025, 3, 15, 10, 30, 0);
      const result = getFirstDayOfWeek(date);
      
      expect(result.getHours()).toBe(10);
      expect(result.getMinutes()).toBe(30);
    });
  });

  describe('getLastDayOfWeek', () => {
    test('debe obtener el sábado para una fecha intermedia de la semana', () => {
      // Miércoles 15 de abril de 2025
      const date = new Date(2025, 3, 15);
      const result = getLastDayOfWeek(date);
      
      // Debería devolver Sábado 19 de abril de 2025
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(3);
      expect(result.getDate()).toBe(19);
      expect(result.getDay()).toBe(6); // 6 = Sábado
    });

    test('debe manejar cambios de mes correctamente', () => {
      // Martes 29 de abril de 2025
      const date = new Date(2025, 3, 29);
      const result = getLastDayOfWeek(date);
      
      // Debería devolver Sábado 3 de mayo de 2025
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(4); // 4 = Mayo
      expect(result.getDate()).toBe(3);
    });
  });

  describe('formatDate', () => {
    test('debe formatear una fecha con opciones predeterminadas', () => {
      const date = new Date(2025, 3, 15);
      const result = formatDate(date);
      
      // El formato exacto depende de la configuración regional,
      // pero debería ser algo como "15/4/2025"
      expect(result).toContain('15');
      expect(result).toContain('4');
      expect(result).toContain('2025');
    });

    test('debe formatear una fecha con opciones personalizadas', () => {
      const date = new Date(2025, 3, 15);
      const result = formatDate(date, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      // Para es-ES: "miércoles, 15 de abril de 2025"
      expect(result.toLowerCase()).toContain('abril');
      expect(result).toContain('15');
      expect(result).toContain('2025');
    });

    test('debe formatear una fecha con configuración regional diferente', () => {
      const date = new Date(2025, 3, 15);
      const result = formatDate(date, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }, 'en-US');
      
      // Para en-US: "Wednesday, April 15, 2025"
      expect(result).toContain('April');
      expect(result).toContain('15');
      expect(result).toContain('2025');
    });
  });

  describe('formatTime', () => {
    test('debe formatear hora sin minutos', () => {
      expect(formatTime(9)).toBe('09:00');
      expect(formatTime(12)).toBe('12:00');
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(23)).toBe('23:00');
    });

    test('debe formatear hora con minutos', () => {
      expect(formatTime(9, 30)).toBe('09:30');
      expect(formatTime(0, 5)).toBe('00:05');
      expect(formatTime(23, 59)).toBe('23:59');
    });
  });

  describe('formatHour', () => {
    test('debe formatear la hora correctamente', () => {
      expect(formatHour(9)).toBe('09:00');
      expect(formatHour(12)).toBe('12:00');
      expect(formatHour(0)).toBe('00:00');
      expect(formatHour(23)).toBe('23:00');
    });
  });

  describe('isTimeOverlapping', () => {
    test('debe identificar solapamiento cuando un evento comienza durante otro', () => {
      const start1 = new Date(2025, 3, 15, 10, 0);
      const end1 = new Date(2025, 3, 15, 11, 0);
      const start2 = new Date(2025, 3, 15, 10, 30);
      const end2 = new Date(2025, 3, 15, 11, 30);
      
      expect(isTimeOverlapping(start1, end1, start2, end2)).toBe(true);
    });

    test('debe identificar solapamiento cuando un evento termina durante otro', () => {
      const start1 = new Date(2025, 3, 15, 10, 0);
      const end1 = new Date(2025, 3, 15, 11, 30);
      const start2 = new Date(2025, 3, 15, 9, 30);
      const end2 = new Date(2025, 3, 15, 10, 30);
      
      expect(isTimeOverlapping(start1, end1, start2, end2)).toBe(true);
    });

    test('debe identificar solapamiento cuando un evento contiene completamente a otro', () => {
      const start1 = new Date(2025, 3, 15, 9, 0);
      const end1 = new Date(2025, 3, 15, 12, 0);
      const start2 = new Date(2025, 3, 15, 10, 0);
      const end2 = new Date(2025, 3, 15, 11, 0);
      
      expect(isTimeOverlapping(start1, end1, start2, end2)).toBe(true);
    });

    test('debe identificar que no hay solapamiento cuando un evento termina antes de que otro comience', () => {
      const start1 = new Date(2025, 3, 15, 9, 0);
      const end1 = new Date(2025, 3, 15, 10, 0);
      const start2 = new Date(2025, 3, 15, 10, 0);
      const end2 = new Date(2025, 3, 15, 11, 0);
      
      expect(isTimeOverlapping(start1, end1, start2, end2)).toBe(false);
    });

    test('debe identificar que no hay solapamiento para eventos en días diferentes', () => {
      const start1 = new Date(2025, 3, 15, 10, 0);
      const end1 = new Date(2025, 3, 15, 11, 0);
      const start2 = new Date(2025, 3, 16, 10, 0);
      const end2 = new Date(2025, 3, 16, 11, 0);
      
      expect(isTimeOverlapping(start1, end1, start2, end2)).toBe(false);
    });
  });

  describe('addDays', () => {
    test('debe añadir días positivos correctamente', () => {
      const date = new Date(2025, 3, 15);
      const result = addDays(date, 5);
      
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(3);
      expect(result.getDate()).toBe(20);
    });

    test('debe añadir días negativos correctamente', () => {
      const date = new Date(2025, 3, 15);
      const result = addDays(date, -5);
      
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(3);
      expect(result.getDate()).toBe(10);
    });

    test('debe manejar cambios de mes correctamente', () => {
      const date = new Date(2025, 3, 28);
      const result = addDays(date, 5);
      
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(4); // Mayo
      expect(result.getDate()).toBe(3);
    });

    test('debe manejar cambios de año correctamente', () => {
      const date = new Date(2025, 11, 30); // 30 de diciembre
      const result = addDays(date, 3);
      
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(0); // Enero
      expect(result.getDate()).toBe(2);
    });

    test('debe mantener la hora original', () => {
      const date = new Date(2025, 3, 15, 10, 30);
      const result = addDays(date, 5);
      
      expect(result.getHours()).toBe(10);
      expect(result.getMinutes()).toBe(30);
    });
  });

  describe('generateWeekDays', () => {
    test('debe generar 7 días para una semana', () => {
      const date = new Date(2025, 3, 15);
      const result = generateWeekDays(date);
      
      expect(result.length).toBe(7);
      expect(result[0].getDay()).toBe(0); // Domingo
      expect(result[6].getDay()).toBe(6); // Sábado
    });

    test('debe generar días consecutivos', () => {
      const date = new Date(2025, 3, 15);
      const result = generateWeekDays(date);
      
      for (let i = 1; i < result.length; i++) {
        const diff = result[i].getTime() - result[i-1].getTime();
        expect(diff).toBe(24 * 60 * 60 * 1000); // Diferencia de un día en milisegundos
      }
    });

    test('debe manejar cambios de mes correctamente', () => {
      const date = new Date(2025, 4, 1); // 1 de mayo de 2025
      const result = generateWeekDays(date);
      
      // La semana debe empezar en abril y terminar en mayo
      expect(result[0].getMonth()).toBe(3); // Abril
      expect(result[result.length-1].getMonth()).toBe(4); // Mayo
    });
  });

  describe('isPastDate', () => {
    test('debe identificar correctamente fechas pasadas', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Ayer
      
      expect(isPastDate(pastDate)).toBe(true);
    });

    test('debe identificar correctamente fechas futuras', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Mañana
      
      expect(isPastDate(futureDate)).toBe(false);
    });

    test('debe considerar la fecha actual como no pasada', () => {
      const today = new Date();
      today.setHours(23, 59, 59); // Final del día actual
      
      expect(isPastDate(today)).toBe(false);
    });
  });

  describe('isSameDay', () => {
    test('debe identificar correctamente el mismo día', () => {
      const date1 = new Date(2025, 3, 15, 10, 0);
      const date2 = new Date(2025, 3, 15, 15, 30);
      
      expect(isSameDay(date1, date2)).toBe(true);
    });

    test('debe identificar correctamente días diferentes', () => {
      const date1 = new Date(2025, 3, 15);
      const date2 = new Date(2025, 3, 16);
      
      expect(isSameDay(date1, date2)).toBe(false);
    });

    test('debe manejar diferentes meses correctamente', () => {
      const date1 = new Date(2025, 3, 30);
      const date2 = new Date(2025, 4, 1);
      
      expect(isSameDay(date1, date2)).toBe(false);
    });

    test('debe manejar diferentes años correctamente', () => {
      const date1 = new Date(2025, 11, 31);
      const date2 = new Date(2026, 0, 1);
      
      expect(isSameDay(date1, date2)).toBe(false);
    });
  });
});