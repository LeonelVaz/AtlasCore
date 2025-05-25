// test/unit/src/services/theme-service.test.js

/**
 * @jest-environment jsdom
 */

// Mocks ANTES de la importación del servicio
jest.mock('../../../../src/core/config/constants', () => ({
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark',
    ATLAS_DARK_BLUE: 'atlas-dark-blue',
    PURPLE_NIGHT: 'purple-night',
    DEEP_OCEAN: 'deep-ocean'
  },
  STORAGE_KEYS: {
    THEME: 'atlas_theme_test_key'
  }
}));

jest.mock('../../../../src/services/storage-service', () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

// Importar el servicio DESPUÉS de los mocks
import themeService from '../../../../src/services/theme-service';
// Importar dependencias mockeadas para aserciones
const storageService = require('../../../../src/services/storage-service');
const { THEMES, STORAGE_KEYS } = require('../../../../src/core/config/constants');

describe('ThemeService', () => {
  let originalConsoleError;
  let originalConsoleLog;

  beforeEach(() => {
    jest.clearAllMocks();
    originalConsoleError = console.error;
    originalConsoleLog = console.log;
    console.error = jest.fn();
    console.log = jest.fn();

    storageService.get.mockReset();
    storageService.set.mockReset();

    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  test('debe inicializar con el tema por defecto LIGHT', () => {
    expect(themeService.defaultTheme).toBe(THEMES.LIGHT);
    expect(themeService.availableThemes.length).toBe(5);
  });

  test('getAvailableThemes debe devolver los temas disponibles', () => {
    const themes = themeService.getAvailableThemes();
    expect(themes).toEqual([
      { id: THEMES.LIGHT, name: 'Light' },
      { id: THEMES.DARK, name: 'Dark' },
      { id: THEMES.ATLAS_DARK_BLUE, name: 'Atlas Dark Blue' },
      { id: THEMES.PURPLE_NIGHT, name: 'Purple Night' },
      { id: THEMES.DEEP_OCEAN, name: 'Deep Ocean' }
    ]);
  });

  describe('getCurrentTheme', () => {
    test('debe devolver el tema por defecto si no hay nada en el almacenamiento', async () => {
      storageService.get.mockResolvedValue(null);
      const theme = await themeService.getCurrentTheme();
      expect(storageService.get).toHaveBeenCalledWith(STORAGE_KEYS.THEME);
      expect(theme).toBe(THEMES.LIGHT);
    });

    test('debe devolver el tema guardado en el almacenamiento', async () => {
      storageService.get.mockResolvedValue(THEMES.DARK);
      const theme = await themeService.getCurrentTheme();
      expect(theme).toBe(THEMES.DARK);
    });

    test('debe devolver el tema por defecto en caso de error al leer del storage', async () => {
      storageService.get.mockRejectedValue(new Error('Storage read error'));
      const theme = await themeService.getCurrentTheme();
      expect(theme).toBe(THEMES.LIGHT);
      expect(console.error).toHaveBeenCalledWith('Error al obtener el tema actual:', expect.any(Error));
    });
  });

  describe('setTheme', () => {
    test('debe establecer un tema válido, guardarlo y aplicarlo', async () => {
      storageService.set.mockResolvedValue(true);
      const applyThemeSpy = jest.spyOn(themeService, 'applyTheme');
      
      const result = await themeService.setTheme(THEMES.DARK);
      
      expect(result).toBe(true);
      expect(storageService.set).toHaveBeenCalledWith(STORAGE_KEYS.THEME, THEMES.DARK);
      expect(applyThemeSpy).toHaveBeenCalledWith(THEMES.DARK);
      expect(document.documentElement.classList.contains(`theme-${THEMES.DARK}`)).toBe(true);
      expect(document.documentElement.getAttribute('data-theme')).toBe(THEMES.DARK);
      expect(console.log).toHaveBeenCalledWith(`Tema aplicado: ${THEMES.DARK}`);
      
      applyThemeSpy.mockRestore();
    });

    test('debe devolver false si el ID del tema es inválido', async () => {
      const result = await themeService.setTheme('invalid-theme-id');
      expect(result).toBe(false);
      expect(storageService.set).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('Tema no válido: invalid-theme-id');
    });

    test('debe devolver false en caso de error al guardar en storage', async () => {
      storageService.set.mockResolvedValue(false);
      const applyThemeSpy = jest.spyOn(themeService, 'applyTheme');

      const result = await themeService.setTheme(THEMES.PURPLE_NIGHT);
      expect(result).toBe(false);
      expect(applyThemeSpy).not.toHaveBeenCalled();

      applyThemeSpy.mockRestore();
    });
  });

  describe('applyTheme', () => {
    test('debe añadir la clase correcta y el atributo data-theme al html', () => {
      themeService.applyTheme(THEMES.ATLAS_DARK_BLUE);
      expect(document.documentElement.classList.contains(`theme-${THEMES.ATLAS_DARK_BLUE}`)).toBe(true);
      expect(document.documentElement.getAttribute('data-theme')).toBe(THEMES.ATLAS_DARK_BLUE);
    });

    test('debe eliminar clases de temas anteriores antes de aplicar uno nuevo', () => {
      document.documentElement.classList.add(`theme-${THEMES.LIGHT}`);
      document.documentElement.setAttribute('data-theme', THEMES.LIGHT);

      themeService.applyTheme(THEMES.DEEP_OCEAN);

      expect(document.documentElement.classList.contains(`theme-${THEMES.LIGHT}`)).toBe(false);
      expect(document.documentElement.classList.contains(`theme-${THEMES.DEEP_OCEAN}`)).toBe(true);
      expect(document.documentElement.getAttribute('data-theme')).toBe(THEMES.DEEP_OCEAN);
    });
  });

  test('initialize debe obtener el tema actual y aplicarlo', async () => {
    storageService.get.mockResolvedValue(THEMES.PURPLE_NIGHT);
    const applyThemeSpy = jest.spyOn(themeService, 'applyTheme');
    
    const initialTheme = await themeService.initialize();
    
    expect(initialTheme).toBe(THEMES.PURPLE_NIGHT);
    expect(applyThemeSpy).toHaveBeenCalledWith(THEMES.PURPLE_NIGHT);
    
    applyThemeSpy.mockRestore();
  });

  // Test Corregido
  test('initialize debe aplicar el tema por defecto si hay un error al obtener el tema', async () => {
    storageService.get.mockRejectedValue(new Error('Failed to load')); // storageService.get falla
    const applyThemeSpy = jest.spyOn(themeService, 'applyTheme');

    const initialTheme = await themeService.initialize();

    expect(initialTheme).toBe(THEMES.LIGHT); // Se devuelve el tema por defecto
    expect(applyThemeSpy).toHaveBeenCalledWith(THEMES.LIGHT); // Se aplica el tema por defecto
    // Verificar el mensaje de error que realmente se loguea (el de getCurrentTheme)
    expect(console.error).toHaveBeenCalledWith('Error al obtener el tema actual:', expect.any(Error));
    // El error de initialize no se loguea porque getCurrentTheme maneja el error y devuelve un valor válido
    expect(console.error).not.toHaveBeenCalledWith('Error al inicializar el servicio de temas:', expect.any(Error));
    
    applyThemeSpy.mockRestore();
  });
});