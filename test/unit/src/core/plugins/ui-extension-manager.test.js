// test/unit/src/core/plugins/ui-extension-manager.test.js

/**
 * @jest-environment jsdom
 */
import uiExtensionManager from '../../../../../src/core/plugins/ui-extension-manager';
// NO importes PLUGIN_CONSTANTS directamente aquí si vas a mockearlo completamente.
// import { PLUGIN_CONSTANTS } from '../../../../../src/core/config/constants';

// Mockear dependencias
jest.mock('../../../../../src/core/config/constants', () => ({
  PLUGIN_CONSTANTS: {
    UI_EXTENSION_ZONES: { // Define aquí las zonas que usarás en los tests
      HEADER_RIGHT: 'header-right-actual-zone-id', // Usa el VALOR real que esperas como ID de zona
      SIDEBAR_TOP: 'sidebar-top-actual-zone-id',
      SIDEBAR_BOTTOM: 'sidebar-bottom-actual-zone-id',
      // Añade otras zonas que uses en los tests con sus valores reales
      // Si tus zonas en el código fuente son directamente 'headerRight', 'sidebarTop', entonces:
      // HEADER_RIGHT: 'headerRight',
      // SIDEBAR_TOP: 'sidebarTop',
      // SIDEBAR_BOTTOM: 'sidebarBottom',
    }
  }
}));

jest.mock('../../../../../src/core/bus/event-bus', () => ({
  publish: jest.fn(),
  subscribe: jest.fn((eventName, callback) => {
    if (eventName === 'pluginSystem.pluginDeactivated') {
      global.mockPluginDeactivatedCallback = callback;
    }
    return jest.fn(); 
  }),
}));

const eventBus = require('../../../../../src/core/bus/event-bus');
// Para acceder a las constantes mockeadas DENTRO del test:
const { PLUGIN_CONSTANTS } = require('../../../../../src/core/config/constants');


describe('UIExtensionManager', () => {
  const pluginId = 'testPlugin';
  // Ahora zoneId usará el valor del mock
  const zoneId = PLUGIN_CONSTANTS.UI_EXTENSION_ZONES.HEADER_RIGHT; 
  const mockComponent = () => 'MockComponent'; 

  let originalConsoleError; // Para silenciar errores esperados

  beforeEach(() => {
    originalConsoleError = console.error;
    console.error = jest.fn(); // Mock para silenciar errores durante los tests

    jest.clearAllMocks();
    // Resetear estado interno del singleton
    // _initializeExtensionPoints será llamado por el constructor o directamente
    // y usará el PLUGIN_CONSTANTS mockeado.
    uiExtensionManager.extensionPoints = {}; 
    uiExtensionManager.pluginComponents = {};
    uiExtensionManager.lastExtensionId = 0;
    uiExtensionManager._initializeExtensionPoints(); 
    global.mockPluginDeactivatedCallback = null; 
    // No necesitas llamar a _setupEventListeners() de nuevo aquí si _initializeExtensionPoints no lo resetea.
    // Sin embargo, el constructor de UIExtensionManager llama a _setupEventListeners.
    // Si creas una nueva instancia o _initializeExtensionPoints resetea los listeners, entonces sí.
    // Por seguridad, y dado que el constructor lo llama:
    // uiExtensionManager._setupEventListeners(); // Es probable que no sea necesario si el singleton persiste
  });

  afterEach(() => {
      console.error = originalConsoleError; // Restaurar console.error
  });

  describe('Initialization and Zone Management', () => {
    test('debe inicializar puntos de extensión basados en PLUGIN_CONSTANTS', () => {
      // zoneId ahora es 'header-right-actual-zone-id' (o lo que hayas definido en el mock)
      expect(uiExtensionManager.extensionPoints[zoneId]).toBeDefined();
      expect(Array.isArray(uiExtensionManager.extensionPoints[zoneId])).toBe(true);
    });

    test('extensionZoneExists debe verificar si una zona existe', () => {
      expect(uiExtensionManager.extensionZoneExists(zoneId)).toBe(true);
      expect(uiExtensionManager.extensionZoneExists('nonExistentZone')).toBe(false);
    });
  });

  describe('registerExtension', () => {
    test('debe registrar una extensión en una zona válida', () => {
      const extensionId = uiExtensionManager.registerExtension(pluginId, zoneId, { component: mockComponent, order: 50 });
      
      expect(extensionId).toMatch(/^ext_\d+_\d+$/);
      expect(uiExtensionManager.extensionPoints[zoneId].length).toBe(1);
      expect(uiExtensionManager.extensionPoints[zoneId][0].id).toBe(extensionId);
      expect(uiExtensionManager.extensionPoints[zoneId][0].pluginId).toBe(pluginId);
      expect(uiExtensionManager.extensionPoints[zoneId][0].order).toBe(50);
      expect(uiExtensionManager.pluginComponents[pluginId]).toContainEqual({ extensionId, zoneId });
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.extensionPointChanged', { zoneId, extensions: expect.any(Array) });
    });

    test('debe devolver null si la zona no es válida', () => {
      const extensionId = uiExtensionManager.registerExtension(pluginId, 'invalidZone', { component: mockComponent });
      expect(extensionId).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Zona de extensión no válida: invalidZone');
    });

    test('debe ordenar las extensiones por la propiedad "order"', () => {
      uiExtensionManager.registerExtension(pluginId, zoneId, { component: () => 'CompA', order: 100 });
      uiExtensionManager.registerExtension(pluginId, zoneId, { component: () => 'CompB', order: 50 });
      
      const extensions = uiExtensionManager.getExtensionsForZone(zoneId);
      expect(extensions.length).toBe(2);
      expect(extensions[0].order).toBe(50); 
      expect(extensions[1].order).toBe(100); 
    });
  });

  describe('removeExtension', () => {
    test('debe eliminar una extensión registrada', () => {
      const extensionId = uiExtensionManager.registerExtension(pluginId, zoneId, { component: mockComponent });
      const result = uiExtensionManager.removeExtension(extensionId);
      
      expect(result).toBe(true);
      expect(uiExtensionManager.extensionPoints[zoneId].length).toBe(0);
      // Si es la última extensión del plugin, pluginComponents[pluginId] se borra.
      expect(uiExtensionManager.pluginComponents[pluginId]).toBeUndefined(); 
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.extensionPointChanged', { zoneId, extensions: [] });
    });

    test('debe devolver false si la extensión no existe', () => {
      const result = uiExtensionManager.removeExtension('nonExistentId');
      expect(result).toBe(false);
    });
  });

  describe('removeAllPluginExtensions', () => {
    test('debe eliminar todas las extensiones de un plugin específico', () => {
      const extId1 = uiExtensionManager.registerExtension(pluginId, zoneId, { component: mockComponent });
      const zoneId2 = PLUGIN_CONSTANTS.UI_EXTENSION_ZONES.SIDEBAR_TOP; // Usar el valor del mock
      const extId2 = uiExtensionManager.registerExtension(pluginId, zoneId2, { component: mockComponent });
      uiExtensionManager.registerExtension('otherPlugin', zoneId, { component: mockComponent });

      const result = uiExtensionManager.removeAllPluginExtensions(pluginId);
      
      expect(result).toBe(true);
      expect(uiExtensionManager.getExtensionsForZone(zoneId).some(ext => ext.id === extId1)).toBe(false);
      expect(uiExtensionManager.getExtensionsForZone(zoneId2).some(ext => ext.id === extId2)).toBe(false);
      expect(uiExtensionManager.pluginComponents[pluginId]).toBeUndefined();
      expect(uiExtensionManager.getExtensionsForZone(zoneId).length).toBe(1); 
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.extensionPointChanged', { zoneId, extensions: expect.any(Array) });
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.extensionPointChanged', { zoneId: zoneId2, extensions: [] });
    });
  });

  describe('getExtensionsForZone', () => {
    test('debe devolver todas las extensiones para una zona específica', () => {
      uiExtensionManager.registerExtension(pluginId, zoneId, { component: mockComponent, order: 100 }); // Ajustar order si es necesario para la aserción
      uiExtensionManager.registerExtension('otherPlugin', zoneId, { component: mockComponent, order: 10 });

      const extensions = uiExtensionManager.getExtensionsForZone(zoneId);
      expect(extensions.length).toBe(2);
      expect(extensions[0].pluginId).toBe('otherPlugin'); 
    });
  });
  
  describe('Event Bus Integration', () => {
    test('debe eliminar extensiones de un plugin cuando se desactiva', () => {
        uiExtensionManager.registerExtension(pluginId, zoneId, { component: mockComponent });
        expect(uiExtensionManager.getExtensionsForZone(zoneId).length).toBe(1);

        if (global.mockPluginDeactivatedCallback) {
            global.mockPluginDeactivatedCallback({ pluginId: pluginId });
        } else {
            // Fallback si el mock del callback no se configuró bien
            console.warn("global.mockPluginDeactivatedCallback no está definido, llamando directamente a removeAllPluginExtensions para el test");
            uiExtensionManager.removeAllPluginExtensions(pluginId);
        }
        
        expect(uiExtensionManager.getExtensionsForZone(zoneId).length).toBe(0);
        expect(uiExtensionManager.pluginComponents[pluginId]).toBeUndefined();
    });
  });

  describe('getExtensionStats', () => {
    test('debe devolver estadísticas correctas de las extensiones', () => {
        uiExtensionManager.registerExtension('p1', zoneId, { component: mockComponent });
        const zoneId2 = PLUGIN_CONSTANTS.UI_EXTENSION_ZONES.SIDEBAR_BOTTOM; // Usar el valor del mock
        uiExtensionManager.registerExtension('p1', zoneId2, { component: mockComponent });
        uiExtensionManager.registerExtension('p2', zoneId, { component: mockComponent });

        const stats = uiExtensionManager.getExtensionStats();
        expect(stats.totalExtensions).toBe(3);
        expect(stats.extensionsByZone[zoneId]).toBe(2);
        expect(stats.extensionsByZone[zoneId2]).toBe(1);
        expect(stats.extensionsByPlugin['p1']).toBe(2);
        expect(stats.extensionsByPlugin['p2']).toBe(1);
    });
  });
});