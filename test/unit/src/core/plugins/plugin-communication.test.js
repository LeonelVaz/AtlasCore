/**
 * @jest-environment jsdom
 */

// Importar el módulo.
import pluginCommunicationModuleInstance from '../../../../../src/core/plugins/plugin-communication'; // Renombrar para claridad

// Mockear dependencias ANTES de cualquier otra cosa
jest.mock('../../../../../src/core/bus/event-bus', () => ({
  publish: jest.fn(),
}));
jest.mock('../../../../../src/core/plugins/plugin-registry', () => ({
  getPlugin: jest.fn(),
  isPluginActive: jest.fn(),
  getAllPlugins: jest.fn(() => []), 
}));
jest.mock('../../../../../src/core/plugins/plugin-api-registry', () => ({
  callPluginMethod: jest.fn(),
}));
jest.mock('../../../../../src/core/plugins/plugin-compatibility', () => ({
  getConflictInfo: jest.fn(),
}));
jest.mock('../../../../../src/core/plugins/plugin-error-handler', () => ({
  handleError: jest.fn(),
}));

// Importar los módulos mockeados para poder acceder a sus funciones jest.fn()
const eventBus = require('../../../../../src/core/bus/event-bus');
const pluginRegistry = require('../../../../../src/core/plugins/plugin-registry');
const pluginAPIRegistry = require('../../../../../src/core/plugins/plugin-api-registry');
const pluginCompatibility = require('../../../../../src/core/plugins/plugin-compatibility');
const pluginErrorHandler = require('../../../../../src/core/plugins/plugin-error-handler');

// Obtener la instancia real del módulo.
// Según los logs, la importación directa ya nos da la instancia.
const pluginCommunication = pluginCommunicationModuleInstance; 

// =========== DEBUGGING BLOCK (Puedes quitarlo una vez que funcione) ===========
// console.log('--- DEBUGGING pluginCommunication ---');
// console.log('1. pluginCommunicationModuleInstance (raw import):', pluginCommunicationModuleInstance);
// console.log('2. pluginCommunication (final variable to use):', pluginCommunication);
// if (pluginCommunication) {
//   console.log('3. typeof pluginCommunication.getChannel:', typeof pluginCommunication.getChannel);
//   console.log('4. typeof pluginCommunication.createChannel:', typeof pluginCommunication.createChannel);
//   console.log('5. Object.keys(pluginCommunication):', Object.keys(pluginCommunication));
//   try {
//     const prototype = Object.getPrototypeOf(pluginCommunication);
//     if (prototype) {
//       console.log('6. Methods on prototype:', Object.getOwnPropertyNames(prototype).filter(name => typeof prototype[name] === 'function'));
//     } else {
//       console.log('6. Prototype is null or undefined');
//     }
//   } catch (e) {
//     console.error('Error getting prototype:', e);
//   }
// } else {
//   console.log('3. pluginCommunication IS UNDEFINED OR NULL');
// }
// console.log('--- END DEBUGGING ---');
// =========== DEBUGGING BLOCK END ===========

describe('PluginCommunication', () => {
  let originalConsoleError;

  beforeEach(() => {
    jest.clearAllMocks();
    
    if (!pluginCommunication || typeof pluginCommunication.createChannel !== 'function') {
        throw new Error("pluginCommunication no es una instancia válida o no tiene los métodos esperados en beforeEach. Verifica la importación y exportación del módulo.");
    }
    
    pluginCommunication.communicationHistory = {};
    pluginCommunication.lastCommunicationId = 0;
    pluginCommunication.channels = {};
    if (typeof pluginCommunication.clearCache === 'function') { 
      pluginCommunication.clearCache();
    }

    pluginRegistry.isPluginActive.mockReturnValue(true);
    pluginCompatibility.getConflictInfo.mockReturnValue(null); 
    pluginAPIRegistry.callPluginMethod.mockResolvedValue('mockApiResult');

    originalConsoleError = console.error;
    console.error = jest.fn(); 
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  // ... (EL RESTO DE LOS TESTS PERMANECEN EXACTAMENTE IGUAL QUE EN LA RESPUESTA ANTERIOR)
  // No es necesario repetirlos aquí, ya que el único cambio es la línea de asignación de pluginCommunication.
  describe('callPluginMethod', () => {
    test('debe llamar a pluginAPIRegistry.callPluginMethod si todo es válido', async () => {
      await pluginCommunication.callPluginMethod('callerP', 'targetP', 'methodX', ['arg1']);
      expect(pluginAPIRegistry.callPluginMethod).toHaveBeenCalledWith('callerP', 'targetP', 'methodX', ['arg1']);
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.communication', expect.objectContaining({ success: true }));
      expect(pluginCommunication.getCommunicationHistory('callerP')[0]).toMatchObject({
        callerPluginId: 'callerP', targetPluginId: 'targetP', methodName: 'methodX', status: 'success'
      });
    });

    test('debe lanzar error si el plugin llamador no está activo', async () => {
      pluginRegistry.isPluginActive.mockImplementation(id => id !== 'callerP');
      await expect(pluginCommunication.callPluginMethod('callerP', 'targetP', 'methodX'))
        .rejects.toThrow('Plugin llamador no está activo: callerP');
      expect(pluginErrorHandler.handleError).toHaveBeenCalled();
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.communication', expect.objectContaining({ success: false }));
    });

    test('debe lanzar error si el plugin objetivo no está activo', async () => {
        pluginRegistry.isPluginActive.mockImplementation(id => id !== 'targetP');
        await expect(pluginCommunication.callPluginMethod('callerP', 'targetP', 'methodX'))
          .rejects.toThrow('Plugin objetivo no está activo: targetP');
        expect(pluginErrorHandler.handleError).toHaveBeenCalled();
    });
    
    test('debe lanzar error si hay incompatibilidad de conflicto (simulado por _checkPluginsCompatibility)', async () => {
        const originalCheckCompatibility = pluginCommunication._checkPluginsCompatibility;
        pluginCommunication._checkPluginsCompatibility = jest.fn().mockReturnValue({ compatible: false, reason: 'Conflicto directo simulado' });
  
        await expect(pluginCommunication.callPluginMethod('callerP', 'targetP', 'methodX'))
          .rejects.toThrow('Plugins incompatibles: Conflicto directo simulado');
        
        pluginCommunication._checkPluginsCompatibility = originalCheckCompatibility; 
    });

    test('debe lanzar error si pluginAPIRegistry.callPluginMethod falla', async () => {
        pluginAPIRegistry.callPluginMethod.mockRejectedValueOnce(new Error('API call failed'));
        await expect(pluginCommunication.callPluginMethod('callerP', 'targetP', 'methodX'))
          .rejects.toThrow('API call failed');
        expect(pluginErrorHandler.handleError).toHaveBeenCalledWith(
            'callerP',
            'pluginCommunication',
            expect.any(Error),
            expect.objectContaining({ target: 'targetP', method: 'methodX' })
        );
    });
  });

  describe('Canales de Comunicación', () => {
    test('createChannel debe crear un canal y publicar evento', () => {
      const channelApi = pluginCommunication.createChannel('myChannel', 'pluginA');
      expect(pluginCommunication.channels['myChannel']).toBeDefined();
      expect(pluginCommunication.channels['myChannel'].creator).toBe('pluginA');
      expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.channelCreated', {
        channelName: 'myChannel',
        creatorPluginId: 'pluginA',
      });
      expect(channelApi.publish).toBeInstanceOf(Function);
      expect(channelApi.subscribe).toBeInstanceOf(Function);
      expect(channelApi.close).toBeInstanceOf(Function);
    });

    test('createChannel debe lanzar error si el canal ya existe', () => {
      pluginCommunication.createChannel('myChannel', 'pluginA');
      expect(() => pluginCommunication.createChannel('myChannel', 'pluginB'))
        .toThrow('El canal ya existe: myChannel');
    });

    test('getChannel debe devolver la API del canal si existe', () => {
        pluginCommunication.createChannel('myChannel', 'pluginA');
        const channelApi = pluginCommunication.getChannel('pluginB', 'myChannel'); 
        expect(channelApi).toBeDefined();
        expect(channelApi).not.toBeNull(); 
        
        const info = channelApi.getInfo();
        expect(info).toBeDefined();
        expect(info.name).toBe('myChannel'); 
        
        expect(typeof channelApi.subscribe).toBe('function');
    });

    test('getChannel debe devolver null si el canal no existe', () => {
        expect(pluginCommunication.getChannel('pluginX', 'nonExistentChannel')).toBeNull();
    });
    
    test('listChannels debe devolver información de los canales activos', () => {
        pluginCommunication.createChannel('chan1', 'pluginA');
        pluginCommunication.createChannel('chan2', 'pluginB');
        const channels = pluginCommunication.listChannels(); 
        expect(channels.length).toBe(2);
        expect(channels).toEqual(expect.arrayContaining([
            expect.objectContaining({ name: 'chan1', createdBy: 'pluginA' }),
            expect.objectContaining({ name: 'chan2', createdBy: 'pluginB' }),
        ]));
    });


    describe('Interacción con Canales (creados)', () => {
      let channelApiA; 
      let channelApiB_view; 
      const mockCallbackB = jest.fn();

      beforeEach(() => {
        channelApiA = pluginCommunication.createChannel('testChan', 'pluginA');
        channelApiB_view = pluginCommunication.getChannel('pluginB', 'testChan');
        if(channelApiB_view && typeof channelApiB_view.subscribe === 'function') {
            channelApiB_view.subscribe(mockCallbackB);
        } else {
            console.error("ERROR EN TEST (beforeEach de Interacción con Canales): channelApiB_view o su método subscribe no está definido.");
        }
      });

      test('publishToChannel debe notificar a los suscriptores', () => {
        if (!channelApiA || typeof channelApiA.publish !== 'function') throw new Error("Channel API for A or publish method not created for publish test");
        channelApiA.publish({ data: 'hello from A' });
        expect(mockCallbackB).toHaveBeenCalledTimes(1);
        expect(mockCallbackB).toHaveBeenCalledWith(expect.objectContaining({
          publisher: 'pluginA',
          content: { data: 'hello from A' },
        }));
      });

      test('subscribeToChannel debe permitir la suscripción y devolver función de desuscripción', () => {
        const mockCallbackC = jest.fn();
        pluginRegistry.getPlugin.mockImplementation(id => id === 'pluginC' ? ({id: 'pluginC'}) : ({id}));
        pluginRegistry.isPluginActive.mockReturnValue(true);

        const pluginCChannelAPI = pluginCommunication.getChannel('pluginC', 'testChan');
        expect(pluginCChannelAPI).not.toBeNull();
        if (!pluginCChannelAPI || typeof pluginCChannelAPI.subscribe !== 'function') {
            throw new Error("pluginCChannelAPI o subscribe no está definido");
        }

        const unsubscribe = pluginCChannelAPI.subscribe(mockCallbackC);
        
        expect(typeof unsubscribe).toBe('function');
        expect(pluginCommunication.channels['testChan'].subscribers['pluginC']).toBeDefined();
        
        unsubscribe(); 
        expect(pluginCommunication.channels['testChan'].subscribers['pluginC']).toBeUndefined();
        expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.channelUnsubscribed', {
            channelName: 'testChan',
            pluginId: 'pluginC'
        });
      });

      test('closeChannel debe eliminar el canal y notificar (si el creador lo cierra)', () => {
        if (!channelApiA || typeof channelApiA.close !== 'function') throw new Error("Channel API for A or close method not defined for close test");
        channelApiA.close(); 
        expect(pluginCommunication.channels['testChan']).toBeUndefined();
        expect(eventBus.publish).toHaveBeenCalledWith('pluginSystem.channelClosed', {
          channelName: 'testChan',
          closedBy: 'pluginA',
        });
        expect(mockCallbackB).toHaveBeenCalledWith(expect.objectContaining({
            content: { type: 'channel_closed', reason: expect.any(String) }
        }));
      });

      test('un plugin no creador no debe poder cerrar el canal por defecto', () => {
        if(!pluginCommunication.channels['testChan']) { 
            pluginCommunication.createChannel('testChan', 'pluginA');
            channelApiB_view = pluginCommunication.getChannel('pluginB', 'testChan');
            if(channelApiB_view && typeof channelApiB_view.subscribe === 'function') {
                channelApiB_view.subscribe(mockCallbackB);
            }
        }
        expect(channelApiB_view).toBeDefined(); 
        if (!channelApiB_view || typeof channelApiB_view.close !== 'function') throw new Error ("channelApiB_view or close method is not defined");

        const result = channelApiB_view.close();
        expect(result).toBe(false);
        expect(pluginCommunication.channels['testChan']).toBeDefined(); 
        expect(console.error).toHaveBeenCalledWith('Plugin pluginB no puede cerrar el canal testChan');
      });
    });
  });

  describe('clearPluginResources', () => {
    test('debe limpiar el historial y desuscribir/cerrar canales del plugin', () => {
        pluginCommunication.createChannel('ch1', 'pluginToClear');
        pluginCommunication.createChannel('ch2', 'anotherPlugin');
        
        pluginCommunication.subscribeToChannel('ch2', 'pluginToClear', jest.fn());
        
        if (typeof pluginCommunication._registerCommunication === 'function') {
            pluginCommunication._registerCommunication('pluginToClear', 'target', 'method');
        }

        pluginCommunication.clearPluginResources('pluginToClear');

        expect(pluginCommunication.getCommunicationHistory('pluginToClear').length).toBe(0);
        expect(pluginCommunication.channels['ch1']).toBeUndefined(); 
        expect(pluginCommunication.channels['ch2']).toBeDefined(); 
        expect(pluginCommunication.channels['ch2'].subscribers['pluginToClear']).toBeUndefined();
    });
  });
});