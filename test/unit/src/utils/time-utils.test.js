// test/unit/src/utils/time-utils.test.js

/**
 * @jest-environment jsdom
 */

import {
  formatEventTime,
  calculateEventDuration,
  eventContinuesToNextDay,
  eventContinuesFromPrevDay,
  snapTimeToInterval,
} from "../../../../src/utils/time-utils";

describe("Time Utils", () => {
  let originalConsoleError;

  beforeEach(() => {
    originalConsoleError = console.error;
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe("formatEventTime", () => {
    test("debe formatear correctamente el tiempo del evento", () => {
      // Usar horas locales para la creación, luego toISOString para la entrada de la función
      const startDateLocal = new Date(2023, 4, 12, 10, 0, 0); // 10:00 Local
      const endDateLocal = new Date(2023, 4, 12, 11, 30, 0); // 11:30 Local
      const event = {
        start: startDateLocal.toISOString(),
        end: endDateLocal.toISOString(),
      };

      const formattedTime = formatEventTime(event);

      // toLocaleTimeString usará la zona horaria del sistema donde se ejecutan los tests.
      // Para hacer el test robusto, formateamos las fechas esperadas de la misma manera.
      const options = { hour: "2-digit", minute: "2-digit" };
      const expectedStartTime = startDateLocal.toLocaleTimeString(
        "es-ES",
        options
      );
      const expectedEndTime = endDateLocal.toLocaleTimeString("es-ES", options);

      expect(formattedTime).toBe(`${expectedStartTime} - ${expectedEndTime}`);
    });

    // Test Corregido
    test("debe devolver string vacío si faltan fechas o son inválidas, sin error de consola esperado", () => {
      expect(formatEventTime({})).toBe("");
      expect(formatEventTime({ start: "invalid", end: "invalid" })).toBe("");
      // La función retorna antes de que new Date() lance un error que el catch capturaría
      // o antes de que isNaN active un console.error.
      // El console.error en el CATCH solo se activaría para errores inesperados.
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe("calculateEventDuration", () => {
    test("debe calcular la duración correcta en minutos", () => {
      const event = {
        start: "2023-05-12T10:00:00Z",
        end: "2023-05-12T11:45:00Z",
      };
      expect(calculateEventDuration(event)).toBe(105);
    });

    // Test Corregido
    test("debe devolver 60 (duración por defecto) si faltan fechas o son inválidas, sin error de consola esperado", () => {
      expect(calculateEventDuration({})).toBe(60);
      expect(calculateEventDuration({ start: "invalid", end: "invalid" })).toBe(
        60
      );
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe("eventContinuesToNextDay", () => {
    // Test Corregido
    test("debe devolver true si el evento cruza la medianoche (fechas UTC)", () => {
      // Fechas explícitamente UTC
      const event = {
        start: "2023-05-12T23:00:00Z",
        end: "2023-05-13T01:00:00Z",
      };
      // start.getUTCDate() es 12, end.getUTCDate() es 13.
      // Usar getUTCDate, getUTCMonth, getUTCFullYear para ser explícitos.
      const s = new Date(event.start);
      const e = new Date(event.end);
      const continues =
        s.getUTCDate() !== e.getUTCDate() ||
        s.getUTCMonth() !== e.getUTCMonth() ||
        s.getUTCFullYear() !== e.getUTCFullYear();
      expect(continues).toBe(true); // Verificación manual para el test
      expect(eventContinuesToNextDay(event)).toBe(true); // Asersión sobre la función
    });

    test("debe devolver false si el evento termina el mismo día (fechas UTC)", () => {
      const event = {
        start: "2023-05-12T10:00:00Z",
        end: "2023-05-12T11:00:00Z",
      };
      expect(eventContinuesToNextDay(event)).toBe(false);
    });

    // Test Corregido
    test("debe devolver true si el evento termina justo a medianoche del día siguiente (fechas UTC)", () => {
      // El evento termina exactamente cuando comienza el nuevo día UTC.
      const event = {
        start: "2023-05-12T22:00:00Z",
        end: "2023-05-13T00:00:00Z",
      };
      // start.getUTCDate() es 12, end.getUTCDate() es 13.
      const s = new Date(event.start);
      const e = new Date(event.end);
      const continues =
        s.getUTCDate() !== e.getUTCDate() ||
        s.getUTCMonth() !== e.getUTCMonth() ||
        s.getUTCFullYear() !== e.getUTCFullYear();
      expect(continues).toBe(true); // Verificación manual
      expect(eventContinuesToNextDay(event)).toBe(true);
    });

    test("debe devolver false si faltan fechas o son inválidas", () => {
      expect(eventContinuesToNextDay({})).toBe(false);
      expect(
        eventContinuesToNextDay({ start: "invalid", end: "invalid" })
      ).toBe(false);
      expect(console.error).not.toHaveBeenCalled(); // El error se maneja internamente sin log en estos casos
    });
  });

  describe("eventContinuesFromPrevDay", () => {
    const currentDate = new Date("2023-05-12T10:00:00Z");
    test("debe devolver true si el evento comenzó el día anterior y aún no ha terminado", () => {
      const event = {
        start: "2023-05-11T23:00:00Z",
        end: "2023-05-12T01:00:00Z",
      };
      expect(eventContinuesFromPrevDay(event, currentDate)).toBe(true);
    });

    test("debe devolver false si el evento comienza el mismo día", () => {
      const event = {
        start: "2023-05-12T09:00:00Z",
        end: "2023-05-12T11:00:00Z",
      };
      expect(eventContinuesFromPrevDay(event, currentDate)).toBe(false);
    });

    test("debe devolver false si faltan fechas o son inválidas", () => {
      expect(eventContinuesFromPrevDay({}, currentDate)).toBe(false);
      expect(eventContinuesFromPrevDay({ start: "invalid" }, currentDate)).toBe(
        false
      );
      expect(
        eventContinuesFromPrevDay(
          { start: "2023-05-11T23:00:00Z" },
          "invalid_date"
        )
      ).toBe(false);
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe("snapTimeToInterval", () => {
    test("debe ajustar el tiempo al intervalo de snap más cercano", () => {
      const date = new Date(2023, 4, 12, 10, 7, 0);
      expect(snapTimeToInterval(new Date(date), 15).getMinutes()).toBe(0);

      date.setMinutes(8);
      expect(snapTimeToInterval(new Date(date), 15).getMinutes()).toBe(15);

      date.setMinutes(20);
      expect(snapTimeToInterval(new Date(date), 15).getMinutes()).toBe(15);

      date.setMinutes(23);
      expect(snapTimeToInterval(new Date(date), 15).getMinutes()).toBe(30);

      date.setMinutes(55);
      const snappedDate = snapTimeToInterval(new Date(date), 15);
      expect(snappedDate.getMinutes()).toBe(0);
      expect(snappedDate.getHours()).toBe(11); // Se va a la siguiente hora
    });

    test("debe devolver el tiempo original si snapMinutes es 0 o inválido", () => {
      const date = new Date(2023, 4, 12, 10, 7, 30);
      expect(snapTimeToInterval(new Date(date), 0).getTime()).toBe(
        date.getTime()
      );
      expect(snapTimeToInterval(new Date(date), -5).getTime()).toBe(
        date.getTime()
      );
      expect(snapTimeToInterval(new Date(date), null).getTime()).toBe(
        date.getTime()
      );
    });

    test("debe establecer segundos y milisegundos a 0", () => {
      const date = new Date(2023, 4, 12, 10, 7, 33, 500);
      const snapped = snapTimeToInterval(new Date(date), 15);
      expect(snapped.getMinutes()).toBe(0);
      expect(snapped.getSeconds()).toBe(0);
      expect(snapped.getMilliseconds()).toBe(0);
    });

    // Test Corregido
    test("debe devolver el tiempo original (inválido) si la fecha es inválida, sin error de consola esperado", () => {
      const invalidDate = new Date("invalid"); // Esto crea un objeto Date con tiempo NaN
      const result = snapTimeToInterval(invalidDate, 15);
      expect(isNaN(result.getTime())).toBe(true); // El tiempo de un Date inválido es NaN
      expect(console.error).not.toHaveBeenCalled(); // La función retorna antes del catch
    });
  });
});
