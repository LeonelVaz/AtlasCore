/**
 * @jest-environment jsdom
 */
import coreAPI from '../../../../../src/core/plugins/core-api';
import { PLUGIN_CONSTANTS } from '../../../../../src/core/config/constants';

// --- Mocks de Módulos ---
jest.mock('../../../../../src/core/bus/event-bus', () => ({
  __esModule: true,
  default: { publish: jest.fn(), subscribe: jest.fn(() => jest.fn()) }
}));
jest.mock('../../../../../src/services/storage-service', () => ({
  setItem: jest.fn(), getItem: jest.fn(), removeItem: jest.fn(), clear: jest.fn()
}));
jest.mock('../../../../../src/core/plugins/plugin-events', () => ({
  subscribe: jest.fn(() => jest.fn()), publish: jest.fn(), unsubscribeAll: jest.fn()
}));
jest.mock('../../../../../src/core/plugins/plugin-storage', () => ({
  setItem: jest.fn(), getItem: jest.fn(), removeItem: jest.fn(), clearPluginData: jest.fn()
}));
jest.mock('../../../../../src/core/plugins/ui-extension-manager', () => ({
  registerExtension: jest.fn(), removeExtension: jest.fn(), removeAllPluginExtensions: jest.fn()
}));
jest.mock('../../../../../src/core/plugins/plugin-api-registry', () => ({
  registerAPI: jest.fn(), unregisterAPI: jest.fn(), callPluginMethod: jest.fn()
}));
jest.mock('../../../../../src/core/plugins/plugin-communication', () => ({
  createChannel: jest.fn(), getChannel: jest.fn(), publishToChannel: jest.fn(), 
  subscribeToChannel: jest.fn(), clearPluginResources: jest.fn(), getChannelsInfo: jest.fn(), 
  callPluginMethod: jest.fn()
}));
jest.mock('../../../../../src/core/plugins/plugin-registry', () => ({
  getPlugin: jest.fn(), isPluginActive: jest.fn(), getActivePlugins: jest.fn()
}));
jest.mock('../../../../../src/core/modules/calendar-module', () => ({
  __esModule: true, default: { init: jest.fn(), getEvents: jest.fn() }
}));

// Mock createPluginDialogAPI para que devuelva un objeto con funciones mockeadas
const mockDialogApiAlert = jest.fn().mockResolvedValue(true);
const mockDialogApiConfirm = jest.fn().mockResolvedValue(false);
const mockDialogApiPrompt = jest.fn().mockResolvedValue(null);
const mockDialogApiShowDialog = jest.fn().mockResolvedValue(null);

jest.mock('../../../../../src/utils/dialog-interceptor', () => ({
    createPluginDialogAPI: jest.fn(() => ({
        alert: mockDialogApiAlert,
        confirm: mockDialogApiConfirm,
        prompt: mockDialogApiPrompt,
        showDialog: mockDialogApiShowDialog,
    })),
}));
jest.mock('../../../../../src/components/ui/rich-text', () => ({
    __esModule: true,
    default: {
        Editor: jest.fn(() => <div data-testid="mock-rte">RTE</div>),
        Viewer: jest.fn(() => <div data-testid="mock-rtv">RTV</div>),
    }
}));

// --- Importar Mocks para uso en Tests ---
const pluginEvents = require('../../../../../src/core/plugins/plugin-events');
const pluginStorage = require('../../../../../src/core/plugins/plugin-storage');
const uiExtensionManager = require('../../../../../src/core/plugins/ui-extension-manager');
const pluginAPIRegistry = require('../../../../../src/core/plugins/plugin-api-registry');
const pluginCommunication = require('../../../../../src/core/plugins/plugin-communication');
const calendarModule = require('../../../../../src/core/modules/calendar-module').default;
const { createPluginDialogAPI } = require('../../../../../src/utils/dialog-interceptor');


describe('CoreAPI', () => {
  let originalConsoleLog;
  let originalConsoleError;
  let originalConsoleWarn;
  let mockServices;

  beforeEach(() => {
    jest.clearAllMocks(); 
    
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    
    mockServices = {
      dialog: {}, // Presencia de services.dialog activa createPluginDialogAPI
      calendar: { /* mock del servicio de calendario, puede estar vacío si no se testea su uso */ }
    };
        
    coreAPI._pluginResources = {};
    coreAPI._modulesInitialized = new Set();
    coreAPI._dialogAPI = null; 
    coreAPI._errorHandlers = []; 
    // No llamar a coreAPI.init() globalmente aquí; cada describe/test lo hará según necesidad.
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  test('debe tener una versión definida', () => {
    expect(coreAPI.version).toBe('0.3.0');
  });

  describe('init', () => {
    test('debe inicializar subcomponentes y loguear mensaje', () => {
      coreAPI.init(mockServices);
      expect(console.log).toHaveBeenCalledWith('API Core inicializada (v0.3.0)');
      expect(coreAPI.events).toBeDefined();
      expect(createPluginDialogAPI).toHaveBeenCalledTimes(1);
      // _initErrorHandling se llama, por lo que _errorHandlers tendrá el handler por defecto
      expect(coreAPI._errorHandlers.length).toBe(1); 
    });

    test('debe inicializar _dialogAPI si services.dialog está presente en la llamada a init', () => {
      coreAPI.init({ dialog: {} }); 
      expect(createPluginDialogAPI).toHaveBeenCalledTimes(1);
      expect(coreAPI._dialogAPI).not.toBeNull();
      expect(coreAPI._dialogAPI.alert).toBe(mockDialogApiAlert);
    });

    test('no debe inicializar _dialogAPI si services.dialog no está presente en la llamada a init', () => {
      coreAPI.init({}); 
      expect(createPluginDialogAPI).not.toHaveBeenCalled();
      expect(coreAPI._dialogAPI).toBeNull();
    });
  });

  describe('API de Eventos (events)', () => {
    beforeEach(() => coreAPI.init(mockServices));

    test('events.subscribe debe llamar a pluginEvents.subscribe', () => {
      const cb = () => {};
      coreAPI.events.subscribe('pluginTest', 'eventName', cb);
      expect(pluginEvents.subscribe).toHaveBeenCalledWith('pluginTest', 'eventName', cb);
    });
    test('events.publish debe llamar a pluginEvents.publish', () => {
      coreAPI.events.publish('pluginTest', 'eventName', {data: 'test'});
      expect(pluginEvents.publish).toHaveBeenCalledWith('pluginTest', 'eventName', {data: 'test'});
    });
    test('events.unsubscribeAll debe llamar a pluginEvents.unsubscribeAll', () => {
      coreAPI.events.unsubscribeAll('pluginTest');
      expect(pluginEvents.unsubscribeAll).toHaveBeenCalledWith('pluginTest');
    });
  });

  describe('API de Almacenamiento (storage)', () => {
    beforeEach(() => coreAPI.init(mockServices));
    test('storage.setItem debe llamar a pluginStorage.setItem', async () => {
      await coreAPI.storage.setItem('pluginTest', 'key', 'value');
      expect(pluginStorage.setItem).toHaveBeenCalledWith('pluginTest', 'key', 'value');
    });
    test('storage.getItem debe llamar a pluginStorage.getItem', async () => {
        await coreAPI.storage.getItem('pluginTest', 'key', 'default');
        expect(pluginStorage.getItem).toHaveBeenCalledWith('pluginTest', 'key', 'default');
      });
    test('storage.removeItem debe llamar a pluginStorage.removeItem', async () => {
        await coreAPI.storage.removeItem('pluginTest', 'key');
        expect(pluginStorage.removeItem).toHaveBeenCalledWith('pluginTest', 'key');
    });
    test('storage.clearPluginData debe llamar a pluginStorage.clearPluginData', async () => {
        await coreAPI.storage.clearPluginData('pluginTest');
        expect(pluginStorage.clearPluginData).toHaveBeenCalledWith('pluginTest');
    });
  });

  describe('API de UI (ui)', () => {
    beforeEach(() => coreAPI.init(mockServices));
    test('ui.registerExtension debe llamar a uiExtensionManager.registerExtension y registrar recurso', () => {
      const comp = () => <div />;
      uiExtensionManager.registerExtension.mockReturnValue('ext123'); 
      const extId = coreAPI.ui.registerExtension('pluginTest', 'zone1', comp, { order: 50 });
      
      expect(uiExtensionManager.registerExtension).toHaveBeenCalledWith('pluginTest', 'zone1', { component: comp, props: {}, order: 50 });
      expect(extId).toBe('ext123');
      expect(coreAPI._pluginResources['pluginTest'].extensions).toContainEqual({ extensionId: 'ext123', zoneId: 'zone1' });
    });
    test('ui.getExtensionZones debe devolver las zonas de PLUGIN_CONSTANTS', () => {
        const zones = coreAPI.ui.getExtensionZones();
        // Asegurarse que PLUGIN_CONSTANTS esté definido para este test
        // Si PLUGIN_CONSTANTS se importa en core-api.js, el mock no es necesario aquí si es solo para lectura.
        // Si se usa el import en este archivo de test, entonces debe ser el objeto real o un mock.
        expect(zones).toEqual(PLUGIN_CONSTANTS.UI_EXTENSION_ZONES || {}); // Fallback a objeto vacío si no está definido
    });
    test('ui.components debe exponer RichTextEditor y RichTextViewer', () => {
        expect(coreAPI.ui.components.RichTextEditor).toBeDefined();
        expect(coreAPI.ui.components.RichTextViewer).toBeDefined();
    });
  });

  describe('API de Diálogos (dialogs)', () => {
    beforeEach(() => {
        coreAPI.init({ dialog: {} }); 
    });

    test('dialogs.alert debe llamar a _dialogAPI.alert si está disponible', async () => {
      await coreAPI.dialogs.alert('pluginTest', 'Test message', 'Test Title');
      expect(mockDialogApiAlert).toHaveBeenCalledWith('Test message', 'Test Title');
    });

    test('dialogs.alert debe usar console.log como fallback si _dialogAPI no está definido', async () => {
      coreAPI._dialogAPI = null; 
      await coreAPI.dialogs.alert('pluginTest', 'Test message');
      expect(console.log).toHaveBeenCalledWith('[Plugin pluginTest] Alert:', 'Test message');
      expect(mockDialogApiAlert).not.toHaveBeenCalled();
    });

    test('dialogs.show("alert") debe llamar a la función alert del _dialogAPI', async () => {
        const message = 'Show Alert Message';
        const title = 'Show Title';
        
        // No espiar coreAPI.dialogs.alert, sino verificar el efecto final
        await coreAPI.dialogs.show('pluginTest', 'alert', message, { title });
        
        expect(mockDialogApiAlert).toHaveBeenCalledWith(message, title);
    });
  });
  
  describe('API de Comunicación entre Plugins (plugins)', () => {
    beforeEach(() => coreAPI.init(mockServices));
    test('plugins.registerAPI debe llamar a pluginAPIRegistry.registerAPI', () => {
        const apiObj = { test: () => {} };
        coreAPI.plugins.registerAPI('pluginTest', apiObj);
        expect(pluginAPIRegistry.registerAPI).toHaveBeenCalledWith('pluginTest', apiObj);
    });
  });

  describe('Manejo de Errores', () => {
    beforeEach(() => coreAPI.init({ dialog: {} }));

    test('_handleError debe llamar a los handlers registrados y a console.error, y dialog si es crítico', () => {
        // init() ya añadió el handler por defecto.
        const mockHandler = jest.fn();
        coreAPI.registerErrorHandler(mockHandler);
        const error = new Error('Test critical error');
        
        coreAPI._handleError('pluginTest', 'init', error); 
        
        expect(mockHandler).toHaveBeenCalledWith('pluginTest', 'init', error);
        expect(console.error).toHaveBeenCalledWith('Error en plugin [pluginTest] (init):', error);
        expect(mockDialogApiAlert).toHaveBeenCalledWith(
            'Error crítico en plugin "pluginTest": Test critical error',
            'Error de Plugin'
        );
    });

     test('registerErrorHandler debe registrar y permitir desregistrar un handler', () => {
        expect(coreAPI._errorHandlers.length).toBe(1); // Solo el por defecto de init
        const handler = jest.fn();
        const unsubscribe = coreAPI.registerErrorHandler(handler);
        expect(coreAPI._errorHandlers.length).toBe(2); 
        
        unsubscribe();
        expect(coreAPI._errorHandlers.length).toBe(1); 
      });
  });

  describe('getModule', () => {
    beforeEach(() => {
        window.__appModules = {};
        coreAPI._modulesInitialized = new Set();
        coreAPI.init(mockServices); 
    });

    test('getModule("calendar") debe inicializar y devolver calendarModule', () => {
      const calModule = coreAPI.getModule('calendar');
      expect(calendarModule.init).toHaveBeenCalledWith(mockServices.calendar);
      expect(calModule).toBe(calendarModule); 
      
      calendarModule.init.mockClear();
      coreAPI.getModule('calendar'); 
      expect(calendarModule.init).not.toHaveBeenCalled(); 
    });

    test('getModule debe devolver un módulo de window.__appModules', () => {
        const mockAppModule = { test: 'module' };
        window.__appModules['myAppModule'] = mockAppModule;
        const retrieved = coreAPI.getModule('myAppModule');
        expect(retrieved).toBe(mockAppModule);
    });

    test('getModule debe devolver un servicio si no está en __appModules', () => {
        const mockOtherService = { id: 'otherServiceVal' };
        // Re-init con el nuevo servicio para que _services se actualice
        coreAPI.init({ ...mockServices, otherService: mockOtherService }); 
        const retrieved = coreAPI.getModule('otherService');
        expect(retrieved).toBe(mockOtherService);
    });

    test('getModule debe devolver null y loguear advertencia si el módulo no se encuentra', () => {
        const retrieved = coreAPI.getModule('nonExistentModule');
        expect(retrieved).toBeNull();
        expect(console.warn).toHaveBeenCalledWith('Módulo no encontrado: nonExistentModule');
    });
  });

  describe('cleanupPluginResources', () => {
    beforeEach(() => coreAPI.init(mockServices));
    test('debe llamar a los métodos de limpieza correspondientes', async () => {
        coreAPI._pluginResources['pluginToClean'] = { extensions: [{extensionId: 'ext1', zoneId: 'zoneA'}] };

        await coreAPI.cleanupPluginResources('pluginToClean');
        expect(pluginEvents.unsubscribeAll).toHaveBeenCalledWith('pluginToClean');
        expect(uiExtensionManager.removeAllPluginExtensions).toHaveBeenCalledWith('pluginToClean');
        expect(pluginAPIRegistry.unregisterAPI).toHaveBeenCalledWith('pluginToClean');
        expect(pluginCommunication.clearPluginResources).toHaveBeenCalledWith('pluginToClean');
        expect(coreAPI._pluginResources['pluginToClean']).toBeUndefined();
    });
  });
});