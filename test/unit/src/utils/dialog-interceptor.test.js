// test/unit/src/utils/dialog-interceptor.test.js

/**
 * @jest-environment jsdom
 */

// Guardar las implementaciones originales de JSDOM para restaurarlas al final
const originalJSDOMAlert = window.alert;
const originalJSDOMConfirm = window.confirm;
const originalJSDOMPrompt = window.prompt;

// Mockear el módulo BAJO PRUEBA y exportar los mocks internos
jest.mock('../../../../src/utils/dialog-interceptor', () => {
  // Estas son las funciones que el módulo real capturará como "originales"
  const mockInternalAlert = jest.fn();
  const mockInternalConfirm = jest.fn();
  const mockInternalPrompt = jest.fn();

  // 1. Mockear las funciones globales de window ANTES de requerir el módulo real
  global.alert = mockInternalAlert;
  global.confirm = mockInternalConfirm;
  global.prompt = mockInternalPrompt;

  // 2. Requerir el módulo real AHORA. Capturará nuestros mocks.
  const actualDialogInterceptor = jest.requireActual('../../../../src/utils/dialog-interceptor');
  
  // 3. Devolver el módulo real Y los mocks internos para que los tests puedan acceder a ellos
  return {
    __esModule: true,
    ...actualDialogInterceptor,
    // Exportar los mocks para que los tests puedan hacer aserciones sobre ellos
    _mockCapturedAlert: mockInternalAlert,
    _mockCapturedConfirm: mockInternalConfirm,
    _mockCapturedPrompt: mockInternalPrompt,
  };
});

// Ahora importar las funciones del módulo Y los mocks exportados
import {
  initializeDialogInterceptor,
  restoreNativeDialogs,
  isInterceptorActive,
  safeAlert,
  safeConfirm,
  safePrompt,
  createPluginDialogAPI,
  // Importar los mocks exportados desde el mock del módulo
  _mockCapturedAlert as mockCapturedAlertFromModule,
  _mockCapturedConfirm as mockCapturedConfirmFromModule,
  _mockCapturedPrompt as mockCapturedPromptFromModule,
} from '../../../../src/utils/dialog-interceptor';


describe('DialogInterceptor', () => {
  let mockDialogContext;
  let consoleLogSpy;
  let consoleWarnSpy;
  
  afterAll(() => {
    // Restaurar las funciones globales originales de JSDOM
    window.alert = originalJSDOMAlert;
    window.confirm = originalJSDOMConfirm;
    window.prompt = originalJSDOMPrompt;
  });
  
  beforeEach(() => {
    // Limpiar el estado de los mocks (ahora importados desde el módulo mockeado)
    mockCapturedAlertFromModule.mockClear();
    mockCapturedConfirmFromModule.mockClear();
    mockCapturedPromptFromModule.mockClear();

    mockDialogContext = {
      showAlert: jest.fn().mockResolvedValue(undefined),
      showConfirm: jest.fn().mockResolvedValue(true),
      showPrompt: jest.fn().mockResolvedValue('user input'),
      showCustomDialog: jest.fn().mockResolvedValue({ button: 'ok' }),
    };

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    restoreNativeDialogs();
    consoleLogSpy.mockClear();
  });

  afterEach(() => {
    restoreNativeDialogs();
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });


  describe('initializeDialogInterceptor y restoreNativeDialogs', () => {
    test('debe reemplazar los diálogos nativos y luego restaurarlos a los mocks capturados', () => {
      expect(window.alert).toBe(mockCapturedAlertFromModule);

      initializeDialogInterceptor(mockDialogContext);
      expect(consoleLogSpy).toHaveBeenCalledWith('Dialog interceptor inicializado - Los diálogos nativos ahora son personalizados');
      
      expect(window.alert).not.toBe(mockCapturedAlertFromModule); 
      expect(isInterceptorActive()).toBe(true);

      const alertMessage = "test init";
      window.alert(alertMessage);
      expect(mockDialogContext.showAlert).toHaveBeenCalledWith(alertMessage);

      restoreNativeDialogs();
      expect(consoleLogSpy).toHaveBeenCalledWith('Diálogos nativos restaurados');
      expect(window.alert).toBe(mockCapturedAlertFromModule); 
      expect(isInterceptorActive()).toBe(false);
    });
  });

  describe('Intercepción de Diálogos Globales', () => {
    test('window.alert (interceptado) debe llamar a showAlert del contexto', async () => {
      initializeDialogInterceptor(mockDialogContext);
      await window.alert('Test Alert');
      expect(mockDialogContext.showAlert).toHaveBeenCalledWith('Test Alert');
      expect(mockCapturedAlertFromModule).not.toHaveBeenCalled();
    });

    test('window.confirm (interceptado) debe llamar a showConfirm del contexto', async () => {
      initializeDialogInterceptor(mockDialogContext);
      await window.confirm('Test Confirm');
      expect(mockDialogContext.showConfirm).toHaveBeenCalledWith('Test Confirm');
      expect(mockCapturedConfirmFromModule).not.toHaveBeenCalled();
    });

    test('window.prompt (interceptado) debe llamar a showPrompt del contexto', async () => {
      initializeDialogInterceptor(mockDialogContext);
      await window.prompt('Test Prompt', 'default');
      expect(mockDialogContext.showPrompt).toHaveBeenCalledWith('Test Prompt', 'default');
      expect(mockCapturedPromptFromModule).not.toHaveBeenCalled();
    });

    test('los diálogos globales deben usar el fallback (nuestro mock capturado) si el contexto no tiene el método', async () => {
      initializeDialogInterceptor({ 
        showConfirm: mockDialogContext.showConfirm, 
        showPrompt: mockDialogContext.showPrompt 
      });

      await window.alert('Fallback Alert');

      expect(mockCapturedAlertFromModule).toHaveBeenCalledWith('Fallback Alert');
      expect(mockDialogContext.showAlert).not.toHaveBeenCalled();
    });
  });

  describe('Funciones Seguras (safeAlert, safeConfirm, safePrompt)', () => {
    test('safeAlert debe llamar a showAlert si el contexto está disponible', async () => {
      initializeDialogInterceptor(mockDialogContext);
      await safeAlert('Safe Message', 'Safe Title');
      expect(mockDialogContext.showAlert).toHaveBeenCalledWith('Safe Message', 'Safe Title');
    });

    test('safeAlert debe usar console.warn como fallback si el contexto no está disponible', async () => {
      restoreNativeDialogs();
      await safeAlert('Safe Fallback');
      expect(consoleWarnSpy).toHaveBeenCalledWith('Dialog context no disponible, usando console.log:', 'Safe Fallback');
    });

    test('safeConfirm debe llamar a showConfirm si el contexto está disponible', async () => {
      initializeDialogInterceptor(mockDialogContext);
      await safeConfirm('Safe Confirm', 'Confirm Title');
      expect(mockDialogContext.showConfirm).toHaveBeenCalledWith('Safe Confirm', 'Confirm Title');
    });

    test('safeConfirm debe usar console.warn y devolver false como fallback', async () => {
      restoreNativeDialogs();
      const result = await safeConfirm('Safe Confirm Fallback');
      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith('Dialog context no disponible, retornando false para confirm:', 'Safe Confirm Fallback');
    });

    test('safePrompt debe llamar a showPrompt si el contexto está disponible', async () => {
      initializeDialogInterceptor(mockDialogContext);
      await safePrompt('Safe Prompt', 'default val', 'Prompt Title');
      expect(mockDialogContext.showPrompt).toHaveBeenCalledWith('Safe Prompt', 'default val', 'Prompt Title');
    });

    test('safePrompt debe usar console.warn y devolver null como fallback', async () => {
      restoreNativeDialogs();
      const result = await safePrompt('Safe Prompt Fallback');
      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Dialog context no disponible, retornando null para prompt:', 'Safe Prompt Fallback');
    });
  });

  describe('createPluginDialogAPI', () => {
    test('debe devolver un objeto API con funciones de diálogo', () => {
      const pluginAPI = createPluginDialogAPI();
      expect(typeof pluginAPI.alert).toBe('function');
      expect(typeof pluginAPI.confirm).toBe('function');
      expect(typeof pluginAPI.prompt).toBe('function');
      expect(typeof pluginAPI.showDialog).toBe('function');
    });

    test('las funciones de pluginAPI deben llamar a las funciones del contexto si está disponible', async () => {
      initializeDialogInterceptor(mockDialogContext);
      const pluginAPI = createPluginDialogAPI();

      await pluginAPI.alert('Plugin Alert');
      expect(mockDialogContext.showAlert).toHaveBeenCalledWith('Plugin Alert', undefined);

      await pluginAPI.confirm('Plugin Confirm');
      expect(mockDialogContext.showConfirm).toHaveBeenCalledWith('Plugin Confirm', undefined);

      await pluginAPI.prompt('Plugin Prompt');
      expect(mockDialogContext.showPrompt).toHaveBeenCalledWith('Plugin Prompt', '', undefined);

      const dialogOptions = { type: 'custom', content: 'Test' };
      await pluginAPI.showDialog(dialogOptions);
      expect(mockDialogContext.showCustomDialog).toHaveBeenCalledWith(dialogOptions);
    });

    test('pluginAPI.showDialog debe usar fallback si el contexto no tiene showCustomDialog', async () => {
        initializeDialogInterceptor({ showAlert: jest.fn() });
        const pluginAPI = createPluginDialogAPI();
        const result = await pluginAPI.showDialog({ content: 'test' });
        expect(result).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalledWith('Dialog context no disponible para showDialog');
    });
  });
});