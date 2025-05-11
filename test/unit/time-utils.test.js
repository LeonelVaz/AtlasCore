// test/unit/time-utils.test.js
import { 
  formatEventTime, 
  calculateEventDuration, 
  eventContinuesToNextDay,
  eventContinuesFromPrevDay,
  snapTimeToInterval
} from '../../src/utils/time-utils';

describe('Time Utils', () => {
  // Configuración de fechas para pruebas
  const baseDate = new Date('2025-05-12T10:00:00');
  const sameDay = new Date('2025-05-12T12:00:00');
  const nextDay = new Date('2025-05-13T10:00:00');
  const prevDay = new Date('2025-05-11T10:00:00');

  // Espiar console.error para casos de error
  let errorSpy;
  
  beforeEach(() => {
    // Espiar console.error
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock para toLocaleTimeString (para evitar diferencias por zona horaria y configuraciones locales)
    const originalToLocaleTimeString = Date.prototype.toLocaleTimeString;
    Date.prototype.toLocaleTimeString = function(locale, options) {
      if (options && options.hour === '2-digit' && options.minute === '2-digit') {
        const hours = this.getHours().toString().padStart(2, '0');
        const minutes = this.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      }
      return originalToLocaleTimeString.call(this, locale, options);
    };
  });
  
  afterEach(() => {
    // Restaurar console.error
    errorSpy.mockRestore();
    
    // Restaurar toLocaleTimeString
    if (jest.isMockFunction(Date.prototype.toLocaleTimeString)) {
      Date.prototype.toLocaleTimeString.mockRestore?.();
    }
  });

  describe('formatEventTime', () => {
    test('formatea correctamente el tiempo de un evento', () => {
      // Evento de 1 hora
      const event = {
        start: '2025-05-12T10:00:00',
        end: '2025-05-12T11:00:00'
      };
      
      const formatted = formatEventTime(event);
      // Eliminar espacios en blanco y saltos de línea para la comparación
      const cleanFormatted = formatted.replace(/\s+/g, '');
      expect(cleanFormatted).toBe('10:00-11:00');
    });
    
    test('formatea correctamente eventos con minutos', () => {
      // Evento con minutos
      const event = {
        start: '2025-05-12T10:15:00',
        end: '2025-05-12T11:45:00'
      };
      
      const formatted = formatEventTime(event);
      // Eliminar espacios en blanco y saltos de línea para la comparación
      const cleanFormatted = formatted.replace(/\s+/g, '');
      expect(cleanFormatted).toBe('10:15-11:45');
    });
    
    test('maneja eventos que cruzan días', () => {
      // Evento que cruza a otro día
      const event = {
        start: '2025-05-12T22:00:00',
        end: '2025-05-13T02:00:00'
      };
      
      const formatted = formatEventTime(event);
      // Eliminar espacios en blanco y saltos de línea para la comparación
      const cleanFormatted = formatted.replace(/\s+/g, '');
      expect(cleanFormatted).toBe('22:00-02:00');
    });
    
    test('maneja errores en el formato de fecha', () => {
      // Evento con fecha inválida
      const invalidEvent = {
        start: 'invalid-date',
        end: '2025-05-12T11:00:00'
      };
      
      const formatted = formatEventTime(invalidEvent);
      expect(formatted).toBe('');
      expect(errorSpy).toHaveBeenCalledWith(
        'Error al formatear hora del evento:',
        expect.any(Error)
      );
    });
    
    test('maneja eventos sin propiedades start/end', () => {
      // Evento incompleto
      const incompleteEvent = {
        title: 'Sin horas'
      };
      
      const formatted = formatEventTime(incompleteEvent);
      expect(formatted).toBe('');
      expect(errorSpy).toHaveBeenCalledWith(
        'Error al formatear hora del evento:',
        expect.any(Error)
      );
    });
  });

  describe('calculateEventDuration', () => {
    test('calcula correctamente la duración de un evento en minutos', () => {
      // Evento de 1 hora (60 minutos)
      const oneHourEvent = {
        start: '2025-05-12T10:00:00',
        end: '2025-05-12T11:00:00'
      };
      
      const duration = calculateEventDuration(oneHourEvent);
      expect(duration).toBe(60);
      
      // Evento de 30 minutos
      const halfHourEvent = {
        start: '2025-05-12T10:00:00',
        end: '2025-05-12T10:30:00'
      };
      
      const halfDuration = calculateEventDuration(halfHourEvent);
      expect(halfDuration).toBe(30);
      
      // Evento de múltiples horas
      const multiHourEvent = {
        start: '2025-05-12T10:00:00',
        end: '2025-05-12T13:45:00'
      };
      
      const multiDuration = calculateEventDuration(multiHourEvent);
      expect(multiDuration).toBe(225); // 3 horas y 45 minutos = 225 minutos
    });
    
    test('calcula la duración de eventos que cruzan días', () => {
      // Evento que cruza a otro día
      const overnightEvent = {
        start: '2025-05-12T22:00:00',
        end: '2025-05-13T02:00:00'
      };
      
      const duration = calculateEventDuration(overnightEvent);
      expect(duration).toBe(240); // 4 horas = 240 minutos
    });
    
    test('maneja errores en el formato de fecha', () => {
      // Evento con fecha inválida
      const invalidEvent = {
        start: 'invalid-date',
        end: '2025-05-12T11:00:00'
      };
      
      const duration = calculateEventDuration(invalidEvent);
      expect(duration).toBe(60); // Valor por defecto
      expect(errorSpy).toHaveBeenCalledWith(
        'Error al calcular duración del evento:',
        expect.any(Error)
      );
    });
    
    test('maneja eventos sin propiedades start/end', () => {
      // Evento incompleto
      const incompleteEvent = {
        title: 'Sin horas'
      };
      
      const duration = calculateEventDuration(incompleteEvent);
      expect(duration).toBe(60); // Valor por defecto
      expect(errorSpy).toHaveBeenCalledWith(
        'Error al calcular duración del evento:',
        expect.any(Error)
      );
    });
  });

  describe('eventContinuesToNextDay', () => {
    test('detecta correctamente eventos que continúan al día siguiente', () => {
      // Evento que continúa al día siguiente
      const continuingEvent = {
        start: '2025-05-12T22:00:00',
        end: '2025-05-13T02:00:00'
      };
      
      expect(eventContinuesToNextDay(continuingEvent)).toBe(true);
      
      // Evento que termina el mismo día
      const nonContinuingEvent = {
        start: '2025-05-12T10:00:00',
        end: '2025-05-12T11:00:00'
      };
      
      expect(eventContinuesToNextDay(nonContinuingEvent)).toBe(false);
      
      // Evento que cruza más de un día
      const multiDayEvent = {
        start: '2025-05-12T10:00:00',
        end: '2025-05-14T11:00:00'
      };
      
      expect(eventContinuesToNextDay(multiDayEvent)).toBe(true);
    });
    
    test('maneja eventos que cruzan meses', () => {
      // Evento que cruza a otro mes
      const crossMonthEvent = {
        start: '2025-05-31T22:00:00',
        end: '2025-06-01T02:00:00'
      };
      
      expect(eventContinuesToNextDay(crossMonthEvent)).toBe(true);
    });
    
    test('maneja eventos que cruzan años', () => {
      // Evento que cruza a otro año
      const crossYearEvent = {
        start: '2025-12-31T22:00:00',
        end: '2026-01-01T02:00:00'
      };
      
      expect(eventContinuesToNextDay(crossYearEvent)).toBe(true);
    });
    
    test('maneja errores en el formato de fecha', () => {
      // Evento con fecha inválida
      const invalidEvent = {
        start: 'invalid-date',
        end: '2025-05-12T11:00:00'
      };
      
      expect(eventContinuesToNextDay(invalidEvent)).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        'Error al verificar continuidad del evento:',
        expect.any(Error)
      );
    });
    
    test('maneja eventos sin propiedades start/end', () => {
      // Evento incompleto
      const incompleteEvent = {
        title: 'Sin horas'
      };
      
      expect(eventContinuesToNextDay(incompleteEvent)).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        'Error al verificar continuidad del evento:',
        expect.any(Error)
      );
    });
  });

  describe('eventContinuesFromPrevDay', () => {
    test('detecta correctamente eventos que continúan desde el día anterior', () => {
      // Fecha actual
      const currentDate = new Date('2025-05-13T12:00:00'); // 13 de mayo
      
      // Evento que continúa desde el día anterior
      const continuingEvent = {
        start: '2025-05-12T22:00:00', // Empieza el 12 de mayo
        end: '2025-05-13T02:00:00'    // Termina el 13 de mayo
      };
      
      expect(eventContinuesFromPrevDay(continuingEvent, currentDate)).toBe(true);
      
      // Evento que empieza el mismo día
      const nonContinuingEvent = {
        start: '2025-05-13T10:00:00', // Empieza el 13 de mayo
        end: '2025-05-13T11:00:00'    // Termina el 13 de mayo
      };
      
      expect(eventContinuesFromPrevDay(nonContinuingEvent, currentDate)).toBe(false);
    });
    
    test('maneja eventos que cruzan meses anteriores', () => {
      // Fecha actual (junio)
      const currentDate = new Date('2025-06-01T12:00:00');
      
      // Evento que cruza desde mayo
      const crossMonthEvent = {
        start: '2025-05-31T22:00:00',
        end: '2025-06-01T02:00:00'
      };
      
      expect(eventContinuesFromPrevDay(crossMonthEvent, currentDate)).toBe(true);
    });
    
    test('maneja eventos que cruzan años anteriores', () => {
      // Fecha actual (enero del nuevo año)
      const currentDate = new Date('2026-01-01T12:00:00');
      
      // Evento que cruza desde el año anterior
      const crossYearEvent = {
        start: '2025-12-31T22:00:00',
        end: '2026-01-01T02:00:00'
      };
      
      expect(eventContinuesFromPrevDay(crossYearEvent, currentDate)).toBe(true);
    });
    
    test('maneja errores en el formato de fecha', () => {
      // Fecha actual
      const currentDate = new Date('2025-05-13T12:00:00');
      
      // Evento con fecha inválida
      const invalidEvent = {
        start: 'invalid-date',
        end: '2025-05-12T11:00:00'
      };
      
      expect(eventContinuesFromPrevDay(invalidEvent, currentDate)).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        'Error al verificar continuidad desde día anterior:',
        expect.any(Error)
      );
    });
    
    test('maneja eventos sin propiedades start/end', () => {
      // Fecha actual
      const currentDate = new Date('2025-05-13T12:00:00');
      
      // Evento incompleto
      const incompleteEvent = {
        title: 'Sin horas'
      };
      
      expect(eventContinuesFromPrevDay(incompleteEvent, currentDate)).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        'Error al verificar continuidad desde día anterior:',
        expect.any(Error)
      );
    });
  });

  describe('snapTimeToInterval', () => {
    test('ajusta correctamente el tiempo al intervalo más cercano', () => {
      // Tiempo base: 10:20
      const time = new Date('2025-05-12T10:20:00');
      
      // Snap a 15 minutos (debería ser 10:15 o 10:30)
      const snap15 = snapTimeToInterval(time, 15);
      expect(snap15.getMinutes()).toBe(15); // Debería redondear a 10:15
      
      // Tiempo base: 10:23
      const time2 = new Date('2025-05-12T10:23:00');
      
      // Snap a 15 minutos (debería ser 10:30)
      const snap15_2 = snapTimeToInterval(time2, 15);
      expect(snap15_2.getMinutes()).toBe(30); // Debería redondear a 10:30
      
      // Tiempo base: 10:31
      const time3 = new Date('2025-05-12T10:31:00');
      
      // Snap a 30 minutos (debería ser 10:30)
      const snap30 = snapTimeToInterval(time3, 30);
      expect(snap30.getMinutes()).toBe(30); // Debería redondear a 10:30
      
      // Tiempo base: 10:45
      const time4 = new Date('2025-05-12T10:45:00');
      
      // Snap a 30 minutos (debería ser 11:00)
      const snap30_2 = snapTimeToInterval(time4, 30);
      expect(snap30_2.getHours()).toBe(11);
      expect(snap30_2.getMinutes()).toBe(0); // Debería redondear a 11:00
    });
    
    test('devuelve el tiempo original cuando el snap está desactivado', () => {
      // Tiempo base: 10:23
      const time = new Date('2025-05-12T10:23:00');
      
      // Sin snap (snapMinutes=0)
      const noSnap = snapTimeToInterval(time, 0);
      expect(noSnap.getHours()).toBe(10);
      expect(noSnap.getMinutes()).toBe(23); // No debería cambiar
      
      // Sin snap (snapMinutes=null)
      const noSnapNull = snapTimeToInterval(time, null);
      expect(noSnapNull.getHours()).toBe(10);
      expect(noSnapNull.getMinutes()).toBe(23); // No debería cambiar
    });
    
    test('no modifica el tiempo cuando ya está alineado con el intervalo', () => {
      // Tiempo base: 10:30 (ya alineado con intervalos de 15 y 30)
      const alignedTime = new Date('2025-05-12T10:30:00');
      
      // Snap a 15 minutos
      const snap15 = snapTimeToInterval(alignedTime, 15);
      expect(snap15.getHours()).toBe(10);
      expect(snap15.getMinutes()).toBe(30); // No debería cambiar
      
      // Snap a 30 minutos
      const snap30 = snapTimeToInterval(alignedTime, 30);
      expect(snap30.getHours()).toBe(10);
      expect(snap30.getMinutes()).toBe(30); // No debería cambiar
    });
    
    test('resetea segundos y milisegundos al hacer snap', () => {
      // Tiempo con segundos y milisegundos
      const timeWithSeconds = new Date('2025-05-12T10:28:45.500');
      
      // Snap a 15 minutos
      const snapped = snapTimeToInterval(timeWithSeconds, 15);
      
      expect(snapped.getSeconds()).toBe(0);
      expect(snapped.getMilliseconds()).toBe(0);
    });
    
    test('maneja errores en el tiempo', () => {
      // Simulamos un error creando un Date que lanza error al usar setMinutes
      const errorDate = new Date('2025-05-11T16:15:00.000Z');
      const originalSetMinutes = errorDate.setMinutes;
      errorDate.setMinutes = () => { throw new Error('Error simulado'); };
      
      const result = snapTimeToInterval(errorDate, 15);
      
      // Debería devolver el tiempo original
      // Comparar el ISO string en lugar del objeto
      expect(result.toISOString()).toBe(errorDate.toISOString());
      expect(errorSpy).toHaveBeenCalledWith('Error al hacer snap del tiempo:', expect.any(Error));
      
      // Restaurar el método original
      errorDate.setMinutes = originalSetMinutes;
    });
  });
});