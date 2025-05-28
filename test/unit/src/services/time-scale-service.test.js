// test/unit/src/services/time-scale-service.test.js

/**
 * @jest-environment jsdom
 */

// Mocks ANTES de la importación del servicio
jest.mock("../../../../src/core/config/constants", () => ({
  TIME_SCALES: {
    STANDARD: {
      id: "standard",
      name: "Estándar",
      height: 60,
      pixelsPerMinute: 1,
    },
    COMPACT: {
      id: "compact",
      name: "Compacta",
      height: 40,
      pixelsPerMinute: 40 / 60,
    },
    COMFORTABLE: {
      id: "comfortable",
      name: "Confortable",
      height: 80,
      pixelsPerMinute: 80 / 60,
    },
    SPACIOUS: {
      id: "spacious",
      name: "Espaciosa",
      height: 100,
      pixelsPerMinute: 100 / 60,
    },
    CUSTOM: { id: "custom", name: "Personalizada" }, // No necesita height/pixelsPerMinute aquí
  },
  STORAGE_KEYS: {
    TIME_SCALE: "atlas_time_scale_test_key",
    // No necesitamos mockear todas las claves, solo las usadas por el servicio
  },
}));

jest.mock("../../../../src/services/storage-service", () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

jest.mock("../../../../src/core/bus/event-bus", () => ({
  __esModule: true,
  default: {
    publish: jest.fn(),
  },
}));

// Importar el servicio DESPUÉS de los mocks
import timeScaleService from "../../../../src/services/time-scale-service";
// Importar dependencias mockeadas para aserciones
const storageService = require("../../../../src/services/storage-service");
const eventBus = require("../../../../src/core/bus/event-bus").default;
const {
  TIME_SCALES,
  STORAGE_KEYS,
} = require("../../../../src/core/config/constants");

describe("TimeScaleService", () => {
  let originalConsoleError;

  beforeEach(() => {
    jest.clearAllMocks();
    originalConsoleError = console.error;
    console.error = jest.fn(); // Para suprimir errores esperados en tests

    // Resetear mocks de storageService para cada test
    storageService.get.mockReset();
    storageService.set.mockReset();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  test("debe inicializar con la escala estándar por defecto", () => {
    expect(timeScaleService.defaultTimeScale).toEqual(TIME_SCALES.STANDARD);
    expect(timeScaleService.availableTimeScales.length).toBe(4); // Compact, Standard, Comfortable, Spacious
  });

  test("getAvailableTimeScales debe devolver las escalas disponibles", () => {
    const scales = timeScaleService.getAvailableTimeScales();
    expect(scales).toEqual([
      TIME_SCALES.COMPACT,
      TIME_SCALES.STANDARD,
      TIME_SCALES.COMFORTABLE,
      TIME_SCALES.SPACIOUS,
    ]);
  });

  describe("getCurrentTimeScale", () => {
    test("debe devolver la escala por defecto si no hay nada en el almacenamiento", async () => {
      storageService.get.mockResolvedValue(null); // Simula que no hay valor para TIME_SCALE
      const scale = await timeScaleService.getCurrentTimeScale();
      expect(storageService.get).toHaveBeenCalledWith(STORAGE_KEYS.TIME_SCALE);
      expect(scale).toEqual(TIME_SCALES.STANDARD);
    });

    test("debe devolver una escala predefinida si su ID está en el almacenamiento", async () => {
      storageService.get.mockResolvedValue(TIME_SCALES.COMPACT.id);
      const scale = await timeScaleService.getCurrentTimeScale();
      expect(scale).toEqual(TIME_SCALES.COMPACT);
    });

    test("debe devolver una escala personalizada si su ID y altura están en el almacenamiento", async () => {
      const customId = "custom_123";
      const customHeight = 75;
      storageService.get
        .mockResolvedValueOnce(customId) // Para TIME_SCALE
        .mockResolvedValueOnce(customHeight); // Para TIME_SCALE_custom_123

      const scale = await timeScaleService.getCurrentTimeScale();
      expect(storageService.get).toHaveBeenCalledWith(STORAGE_KEYS.TIME_SCALE);
      expect(storageService.get).toHaveBeenCalledWith(
        `${STORAGE_KEYS.TIME_SCALE}_${customId}`
      );
      expect(scale).toEqual({
        ...TIME_SCALES.CUSTOM,
        id: TIME_SCALES.CUSTOM.id, // El id del objeto CUSTOM, no customId
        name: TIME_SCALES.CUSTOM.name,
        height: customHeight,
        pixelsPerMinute: customHeight / 60,
      });
    });

    test("debe devolver la escala por defecto si la altura personalizada es inválida", async () => {
      const customId = "custom_invalid";
      storageService.get
        .mockResolvedValueOnce(customId)
        .mockResolvedValueOnce(10); // Altura inválida (< 20)
      const scale = await timeScaleService.getCurrentTimeScale();
      expect(scale).toEqual(TIME_SCALES.STANDARD);
    });

    test("debe devolver la escala por defecto en caso de error al leer del storage", async () => {
      storageService.get.mockRejectedValue(new Error("Storage read error"));
      const scale = await timeScaleService.getCurrentTimeScale();
      expect(scale).toEqual(TIME_SCALES.STANDARD);
      expect(console.error).toHaveBeenCalledWith(
        "Error al obtener la escala de tiempo actual:",
        expect.any(Error)
      );
    });
  });

  describe("setTimeScale", () => {
    test("debe establecer una escala predefinida por ID y publicar evento", async () => {
      storageService.set.mockResolvedValue(true);
      const result = await timeScaleService.setTimeScale(
        TIME_SCALES.COMFORTABLE.id
      );
      expect(result).toBe(true);
      expect(storageService.set).toHaveBeenCalledWith(
        STORAGE_KEYS.TIME_SCALE,
        TIME_SCALES.COMFORTABLE.id
      );
      expect(eventBus.publish).toHaveBeenCalledWith("app.timeScaleChanged", {
        timeScaleId: TIME_SCALES.COMFORTABLE.id,
      });
    });

    test("debe establecer una escala personalizada y guardar su altura", async () => {
      storageService.set.mockResolvedValue(true);
      const customHeight = 90;
      // Mockear Date.now() para tener un ID predecible si es necesario, pero el servicio usa el timestamp
      const mockDateNow = jest.spyOn(Date, "now").mockReturnValue(1234567890);

      const result = await timeScaleService.setTimeScale({
        height: customHeight,
      });

      const expectedCustomId = `custom_1234567890`;
      expect(result).toBe(true);
      expect(storageService.set).toHaveBeenCalledWith(
        `${STORAGE_KEYS.TIME_SCALE}_${expectedCustomId}`,
        customHeight
      );
      expect(storageService.set).toHaveBeenCalledWith(
        STORAGE_KEYS.TIME_SCALE,
        expectedCustomId
      );
      expect(eventBus.publish).toHaveBeenCalledWith("app.timeScaleChanged", {
        timeScaleId: expectedCustomId,
      });

      mockDateNow.mockRestore();
    });

    test("debe limitar la altura de la escala personalizada entre 20 y 200", async () => {
      storageService.set.mockResolvedValue(true);
      const mockDateNow = jest.spyOn(Date, "now").mockReturnValue(111);

      await timeScaleService.setTimeScale({ height: 10 }); // Menor que 20
      expect(storageService.set).toHaveBeenCalledWith(
        `${STORAGE_KEYS.TIME_SCALE}_custom_111`,
        20
      );

      jest.clearAllMocks(); // Limpiar para la siguiente llamada
      mockDateNow.mockReturnValue(222);
      await timeScaleService.setTimeScale({ height: 250 }); // Mayor que 200
      expect(storageService.set).toHaveBeenCalledWith(
        `${STORAGE_KEYS.TIME_SCALE}_custom_222`,
        200
      );

      mockDateNow.mockRestore();
    });

    test("debe devolver false si el ID de escala predefinida es inválido", async () => {
      const result = await timeScaleService.setTimeScale("invalid-id");
      expect(result).toBe(false);
      expect(storageService.set).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        "Escala de tiempo no válida: invalid-id"
      );
    });

    test("debe devolver false si el objeto de escala personalizada es inválido", async () => {
      const result = await timeScaleService.setTimeScale({ invalid: "scale" });
      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        "Formato de escala de tiempo no válido:",
        { invalid: "scale" }
      );
    });

    test("debe devolver false en caso de error al guardar en storage", async () => {
      storageService.set.mockResolvedValue(false); // Simula fallo al guardar
      const result = await timeScaleService.setTimeScale(
        TIME_SCALES.STANDARD.id
      );
      expect(result).toBe(false);
      // eventBus.publish no debería llamarse si set falla
      expect(eventBus.publish).not.toHaveBeenCalled();
    });
  });

  describe("createCustomTimeScale", () => {
    test("debe llamar a setTimeScale con un objeto de escala correcto", async () => {
      const setTimeScaleSpy = jest.spyOn(timeScaleService, "setTimeScale");
      storageService.set.mockResolvedValue(true); // Para que setTimeScale no falle por storage

      const height = 100;
      await timeScaleService.createCustomTimeScale(height);

      expect(setTimeScaleSpy).toHaveBeenCalledWith({
        height: height,
        pixelsPerMinute: height / 60,
      });
      setTimeScaleSpy.mockRestore();
    });

    test("debe devolver false si la altura es inválida", async () => {
      const result1 = await timeScaleService.createCustomTimeScale(10); // < 20
      expect(result1).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        "Altura de escala no válida. Debe ser un número entero entre 20 y 200 píxeles"
      );

      console.error.mockClear();
      const result2 = await timeScaleService.createCustomTimeScale(300); // > 200
      expect(result2).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        "Altura de escala no válida. Debe ser un número entero entre 20 y 200 píxeles"
      );

      console.error.mockClear();
      const result3 = await timeScaleService.createCustomTimeScale(
        "not a number"
      );
      expect(result3).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        "Altura de escala no válida. Debe ser un número entero entre 20 y 200 píxeles"
      );
    });
  });

  test("initialize debe llamar a getCurrentTimeScale", async () => {
    const getCurrentTimeScaleSpy = jest
      .spyOn(timeScaleService, "getCurrentTimeScale")
      .mockResolvedValue(TIME_SCALES.STANDARD);
    await timeScaleService.initialize();
    expect(getCurrentTimeScaleSpy).toHaveBeenCalled();
    getCurrentTimeScaleSpy.mockRestore();
  });
});
