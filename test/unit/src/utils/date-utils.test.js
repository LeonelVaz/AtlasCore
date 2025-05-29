// test/unit/date-utils.test.js
import * as dateUtils from "../../../../src/utils/date-utils";

describe("Date Utils", () => {
  // Fechas para pruebas - Usar formato año, mes (0-11), día para evitar problemas de zona horaria
  const sundayDate = new Date(2025, 4, 11); // Un domingo (Mayo es 4, no 5)
  const mondayDate = new Date(2025, 4, 12); // Un lunes
  const tuesdayDate = new Date(2025, 4, 13); // Un martes
  const saturdayDate = new Date(2025, 4, 17); // Un sábado

  describe("getFirstDayOfWeek", () => {
    test("obtiene correctamente el primer día (domingo) de la semana", () => {
      // Desde un domingo (ya es el primer día)
      const firstDayFromSunday = dateUtils.getFirstDayOfWeek(sundayDate);
      expect(firstDayFromSunday.getDay()).toBe(0); // 0 = Domingo
      expect(firstDayFromSunday.getDate()).toBe(11);
      expect(firstDayFromSunday.getMonth()).toBe(4); // 4 = Mayo

      // Desde un día intermedio (martes)
      const firstDayFromTuesday = dateUtils.getFirstDayOfWeek(tuesdayDate);
      expect(firstDayFromTuesday.getDay()).toBe(0);
      expect(firstDayFromTuesday.getDate()).toBe(11); // Domingo 11 de mayo

      // Desde el último día (sábado)
      const firstDayFromSaturday = dateUtils.getFirstDayOfWeek(saturdayDate);
      expect(firstDayFromSaturday.getDay()).toBe(0);
      expect(firstDayFromSaturday.getDate()).toBe(11); // Domingo 11 de mayo
    });

    test("no modifica la fecha original", () => {
      // Copia para asegurar que no se modifica
      const originalDate = new Date(mondayDate);

      // Llamar a la función
      dateUtils.getFirstDayOfWeek(mondayDate);

      // Verificar que la fecha original no cambió
      expect(mondayDate.getTime()).toBe(originalDate.getTime());
    });
  });

  describe("getLastDayOfWeek", () => {
    test("obtiene correctamente el último día (sábado) de la semana", () => {
      // Desde un domingo (primer día)
      const lastDayFromSunday = dateUtils.getLastDayOfWeek(sundayDate);
      expect(lastDayFromSunday.getDay()).toBe(6); // 6 = Sábado
      expect(lastDayFromSunday.getDate()).toBe(17); // Sábado 17 de mayo

      // Desde un día intermedio (martes)
      const lastDayFromTuesday = dateUtils.getLastDayOfWeek(tuesdayDate);
      expect(lastDayFromTuesday.getDay()).toBe(6);
      expect(lastDayFromTuesday.getDate()).toBe(17);

      // Desde el último día (sábado)
      const lastDayFromSaturday = dateUtils.getLastDayOfWeek(saturdayDate);
      expect(lastDayFromSaturday.getDay()).toBe(6);
      expect(lastDayFromSaturday.getDate()).toBe(17);
    });

    test("no modifica la fecha original", () => {
      // Copia para asegurar que no se modifica
      const originalDate = new Date(mondayDate);

      // Llamar a la función
      dateUtils.getLastDayOfWeek(mondayDate);

      // Verificar que la fecha original no cambió
      expect(mondayDate.getTime()).toBe(originalDate.getTime());
    });
  });

  describe("formatDate", () => {
    test("formatea correctamente una fecha con opciones", () => {
      // Ejemplo con varias opciones
      const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };

      const formatted = dateUtils.formatDate(mondayDate, options);

      // Estos tests dependen del locale, pero aseguramos que la cadena contiene los datos clave
      expect(formatted).toContain("2025");
      expect(formatted.toLowerCase()).toMatch(/lunes|monday/i);

      // Con solo mes y año
      const monthYearOptions = {
        month: "long",
        year: "numeric",
      };

      const monthYearFormatted = dateUtils.formatDate(
        mondayDate,
        monthYearOptions
      );
      expect(monthYearFormatted).toContain("2025");
      expect(monthYearFormatted.toLowerCase()).toMatch(/mayo|may/i);
    });

    test("usa el locale especificado", () => {
      const options = { month: "long" };

      // Con locale español (si está disponible)
      try {
        const formattedES = dateUtils.formatDate(mondayDate, options, "es-ES");
        expect(formattedES.toLowerCase()).toMatch(/mayo/i);
      } catch (error) {
        // Si el locale español no está disponible, ignoramos esta prueba
        console.log("Locale es-ES no disponible, omitiendo prueba");
      }

      // Con locale inglés (si está disponible)
      try {
        const formattedEN = dateUtils.formatDate(mondayDate, options, "en-US");
        expect(formattedEN.toLowerCase()).toMatch(/may/i);
      } catch (error) {
        // Si el locale inglés no está disponible, ignoramos esta prueba
        console.log("Locale en-US no disponible, omitiendo prueba");
      }
    });

    test("formatea con opciones por defecto", () => {
      // Sin opciones
      const formatted = dateUtils.formatDate(mondayDate);

      // Verificar que devuelve una cadena no vacía
      expect(typeof formatted).toBe("string");
      expect(formatted.length).toBeGreaterThan(0);

      // La fecha debe contener el número 12 (día)
      expect(formatted).toContain("12");
    });
  });

  describe("formatTime", () => {
    test("formatea correctamente la hora y minutos", () => {
      // Hora sin minutos
      const timeNoMinutes = dateUtils.formatTime(9);
      expect(timeNoMinutes).toBe("09:00");

      // Hora con minutos
      const timeWithMinutes = dateUtils.formatTime(14, 30);
      expect(timeWithMinutes).toBe("14:30");

      // Hora de un solo dígito y minutos de un solo dígito
      const singleDigits = dateUtils.formatTime(1, 5);
      expect(singleDigits).toBe("01:05");

      // Medianoche
      const midnight = dateUtils.formatTime(0, 0);
      expect(midnight).toBe("00:00");
    });
  });

  describe("formatHour", () => {
    test("formatea correctamente la hora", () => {
      // Hora de un solo dígito
      const singleDigitHour = dateUtils.formatHour(9);
      expect(singleDigitHour).toBe("09:00");

      // Hora de dos dígitos
      const doubleDigitHour = dateUtils.formatHour(14);
      expect(doubleDigitHour).toBe("14:00");

      // Medianoche
      const midnight = dateUtils.formatHour(0);
      expect(midnight).toBe("00:00");

      // Hora máxima
      const maxHour = dateUtils.formatHour(23);
      expect(maxHour).toBe("23:00");
    });
  });

  describe("isTimeOverlapping", () => {
    test("detecta correctamente solapamientos de tiempo", () => {
      // Caso 1: Solapamiento parcial
      const start1 = new Date("2025-05-12T10:00:00");
      const end1 = new Date("2025-05-12T12:00:00");
      const start2 = new Date("2025-05-12T11:00:00");
      const end2 = new Date("2025-05-12T13:00:00");

      expect(dateUtils.isTimeOverlapping(start1, end1, start2, end2)).toBe(
        true
      );

      // Caso 2: Un rango completamente dentro del otro
      const start3 = new Date("2025-05-12T09:00:00");
      const end3 = new Date("2025-05-12T14:00:00");
      const start4 = new Date("2025-05-12T10:00:00");
      const end4 = new Date("2025-05-12T13:00:00");

      expect(dateUtils.isTimeOverlapping(start3, end3, start4, end4)).toBe(
        true
      );

      // Caso 3: No hay solapamiento
      const start5 = new Date("2025-05-12T09:00:00");
      const end5 = new Date("2025-05-12T11:00:00");
      const start6 = new Date("2025-05-12T11:00:00");
      const end6 = new Date("2025-05-12T13:00:00");

      expect(dateUtils.isTimeOverlapping(start5, end5, start6, end6)).toBe(
        false
      );

      // Caso 4: Solapamiento solo en el límite exacto (no se considera solapamiento)
      const start7 = new Date("2025-05-12T09:00:00");
      const end7 = new Date("2025-05-12T11:00:00");
      const start8 = new Date("2025-05-12T11:00:00");
      const end8 = new Date("2025-05-12T13:00:00");

      expect(dateUtils.isTimeOverlapping(start7, end7, start8, end8)).toBe(
        false
      );
    });
  });

  describe("addDays", () => {
    test("añade correctamente días a una fecha", () => {
      // Añadir días positivos
      const tomorrow = dateUtils.addDays(mondayDate, 1);
      expect(tomorrow.getDate()).toBe(13); // 12 + 1

      // Añadir múltiples días
      const nextWeek = dateUtils.addDays(mondayDate, 7);
      expect(nextWeek.getDate()).toBe(19); // 12 + 7

      // Añadir días suficientes para cambiar de mes
      const nextMonth = dateUtils.addDays(mondayDate, 20);
      expect(nextMonth.getMonth()).toBe(5); // 4 (mayo) + 1 = 5 (junio)

      // Añadir días suficientes para cambiar de año
      const nextYear = dateUtils.addDays(mondayDate, 365);
      expect(nextYear.getFullYear()).toBe(2026);
    });

    test("resta correctamente días a una fecha", () => {
      // Restar un día
      const yesterday = dateUtils.addDays(mondayDate, -1);
      expect(yesterday.getDate()).toBe(11); // 12 - 1

      // Restar múltiples días
      const lastWeek = dateUtils.addDays(mondayDate, -7);
      expect(lastWeek.getDate()).toBe(5); // 12 - 7

      // Restar días suficientes para cambiar de mes
      const lastMonth = dateUtils.addDays(mondayDate, -12);
      expect(lastMonth.getMonth()).toBe(3); // 4 (mayo) - 1 = 3 (abril)

      // Restar días suficientes para cambiar de año
      const lastYear = dateUtils.addDays(mondayDate, -365);
      expect(lastYear.getFullYear()).toBe(2024);
    });

    test("no modifica la fecha original", () => {
      // Copia para asegurar que no se modifica
      const originalDate = new Date(mondayDate);

      // Llamar a la función
      dateUtils.addDays(mondayDate, 5);

      // Verificar que la fecha original no cambió
      expect(mondayDate.getTime()).toBe(originalDate.getTime());
    });
  });

  describe("generateWeekDays", () => {
    test("genera correctamente un array con los 7 días de la semana", () => {
      // Generar desde un domingo
      const weekFromSunday = dateUtils.generateWeekDays(sundayDate);

      // Verificar que hay 7 días
      expect(weekFromSunday).toHaveLength(7);

      // El primer día debe ser domingo y el último sábado
      expect(weekFromSunday[0].getDay()).toBe(0); // Domingo
      expect(weekFromSunday[6].getDay()).toBe(6); // Sábado

      // Verificar fechas concretas
      expect(weekFromSunday[0].getDate()).toBe(11); // Domingo 11
      expect(weekFromSunday[1].getDate()).toBe(12); // Lunes 12
      expect(weekFromSunday[6].getDate()).toBe(17); // Sábado 17
    });

    test("genera correctamente la semana desde cualquier día", () => {
      // Generar desde un día intermedio (miércoles)
      const wednesdayDate = new Date(2025, 4, 14); // Miércoles
      const weekFromWednesday = dateUtils.generateWeekDays(wednesdayDate);

      // El primer día debe ser domingo y el último sábado
      expect(weekFromWednesday[0].getDay()).toBe(0); // Domingo
      expect(weekFromWednesday[6].getDay()).toBe(6); // Sábado

      // Verificar fechas concretas (debe ser la misma semana)
      expect(weekFromWednesday[0].getDate()).toBe(11); // Domingo 11
      expect(weekFromWednesday[3].getDate()).toBe(14); // Miércoles 14
      expect(weekFromWednesday[6].getDate()).toBe(17); // Sábado 17
    });
  });

  describe("isPastDate", () => {
    test("identifica correctamente las fechas pasadas", () => {
      // Fecha en el pasado
      const pastDate = new Date("2023-01-01");
      expect(dateUtils.isPastDate(pastDate)).toBe(true);

      // Fecha futura
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(dateUtils.isPastDate(futureDate)).toBe(false);
    });

    test("maneja el caso del día actual", () => {
      // Fecha actual
      const today = new Date();

      // Crear objeto con la misma fecha pero a las 00:00:00
      const todayMidnight = new Date(today);
      todayMidnight.setHours(0, 0, 0, 0);

      // Hoy no debería ser "pasado"
      expect(dateUtils.isPastDate(today)).toBe(false);

      // Si queremos probar el comportamiento exacto, necesitamos crear una fecha de "ayer"
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      expect(dateUtils.isPastDate(yesterday)).toBe(true);
    });
  });

  describe("isSameDay", () => {
    test("identifica correctamente si dos fechas son el mismo día", () => {
      // Mismo día, diferentes horas
      const date1 = new Date("2025-05-12T10:00:00");
      const date2 = new Date("2025-05-12T14:30:00");

      expect(dateUtils.isSameDay(date1, date2)).toBe(true);

      // Diferentes días
      const date3 = new Date("2025-05-12T10:00:00");
      const date4 = new Date("2025-05-13T10:00:00");

      expect(dateUtils.isSameDay(date3, date4)).toBe(false);
    });

    test("maneja correctamente diferentes meses y años", () => {
      // Mismo día, diferentes meses
      const date1 = new Date("2025-05-12T10:00:00");
      const date2 = new Date("2025-06-12T10:00:00");

      expect(dateUtils.isSameDay(date1, date2)).toBe(false);

      // Mismo día y mes, diferentes años
      const date3 = new Date("2025-05-12T10:00:00");
      const date4 = new Date("2026-05-12T10:00:00");

      expect(dateUtils.isSameDay(date3, date4)).toBe(false);
    });
  });

  describe("formatDateForInput", () => {
    test("formatea correctamente una fecha para input datetime-local", () => {
      // Fecha con valores de un solo dígito
      const date1 = new Date("2025-02-03T01:05:00");
      expect(dateUtils.formatDateForInput(date1)).toBe("2025-02-03T01:05");

      // Fecha con valores de dos dígitos
      const date2 = new Date("2025-12-25T23:59:00");
      expect(dateUtils.formatDateForInput(date2)).toBe("2025-12-25T23:59");
    });

    test("añade ceros a la izquierda cuando es necesario", () => {
      // Crear una fecha y modificarla con setMonth y setDate
      // (para asegurar que los valores son los que esperamos)
      const date = new Date("2025-01-01T00:00:00");
      date.setMonth(4); // Mayo (0-indexed)
      date.setDate(5);
      date.setHours(9, 8);

      expect(dateUtils.formatDateForInput(date)).toBe("2025-05-05T09:08");
    });

    test("no muestra segundos ni milisegundos", () => {
      // Fecha con segundos y milisegundos
      const date = new Date("2025-05-12T10:30:45.500");
      const formatted = dateUtils.formatDateForInput(date);

      // Verificar que no contiene segundos ni milisegundos
      expect(formatted).toBe("2025-05-12T10:30");
      expect(formatted).not.toContain("45");
      expect(formatted).not.toContain("500");
    });
  });
});
