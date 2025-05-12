// test/unit/module-registry.test.js
import { 
  registerModule, 
  getModule, 
  isModuleRegistered, 
  unregisterModule 
} from '../../src/core/module/module-registry';

describe('Module Registry', () => {
  // Configuración previa a las pruebas
  beforeEach(() => {
    // Restablecer el registro de módulos antes de cada prueba
    if (typeof window !== 'undefined') {
      window.__appModules = {};
    }
  });

  // Eliminar residuos después de las pruebas
  afterEach(() => {
    if (typeof window !== 'undefined') {
      window.__appModules = {};
    }
  });

  test('registerModule registra correctamente un módulo y su API', () => {
    // Preparar
    const moduleName = 'testModule';
    const moduleApi = {
      doSomething: jest.fn(),
      getStuff: jest.fn()
    };
    
    // Espiar console.log y console.warn
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    console.log = jest.fn();
    console.warn = jest.fn();
    
    // Actuar
    const result = registerModule(moduleName, moduleApi);
    
    // Verificar
    expect(result).toBe(true);
    expect(window.__appModules[moduleName]).toBe(moduleApi);
    expect(console.log).toHaveBeenCalledWith(`Módulo ${moduleName} registrado correctamente`);
    
    // Restaurar console.log y console.warn
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
  });

  test('registerModule advierte cuando se sobrescribe un módulo existente', () => {
    // Preparar
    const moduleName = 'existingModule';
    const originalApi = { original: true };
    const newApi = { new: true };
    
    // Espiar console.warn
    const originalConsoleWarn = console.warn;
    const originalConsoleLog = console.log;
    console.warn = jest.fn();
    console.log = jest.fn();
    
    // Registrar el módulo original
    registerModule(moduleName, originalApi);
    
    // Actuar - Sobrescribir con nueva API
    const result = registerModule(moduleName, newApi);
    
    // Verificar
    expect(result).toBe(true);
    expect(window.__appModules[moduleName]).toBe(newApi); // Debería haberse sobrescrito
    expect(console.warn).toHaveBeenCalledWith(`El módulo ${moduleName} ya está registrado. Se sobrescribirá.`);
    
    // Restaurar console.warn
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
  });

  test('getModule devuelve la API de un módulo registrado', () => {
    // Preparar
    const moduleName = 'moduleToGet';
    const moduleApi = { getData: jest.fn() };
    
    // Registrar el módulo
    registerModule(moduleName, moduleApi);
    
    // Actuar
    const retrievedApi = getModule(moduleName);
    
    // Verificar
    expect(retrievedApi).toBe(moduleApi);
  });

  test('getModule devuelve null y advierte cuando el módulo no existe', () => {
    // Preparar
    const nonExistentModule = 'nonExistentModule';
    
    // Espiar console.warn
    const originalConsoleWarn = console.warn;
    console.warn = jest.fn();
    
    // Actuar
    const result = getModule(nonExistentModule);
    
    // Verificar
    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(`El módulo ${nonExistentModule} no está disponible`);
    
    // Restaurar console.warn
    console.warn = originalConsoleWarn;
  });

  test('isModuleRegistered verifica correctamente si un módulo está registrado', () => {
    // Preparar
    const registeredModule = 'registeredModule';
    const unregisteredModule = 'unregisteredModule';
    
    // Registrar un módulo
    registerModule(registeredModule, {});
    
    // Actuar y verificar
    expect(isModuleRegistered(registeredModule)).toBe(true);
    expect(isModuleRegistered(unregisteredModule)).toBe(false);
  });

  test('unregisterModule elimina correctamente un módulo registrado', () => {
    // Preparar
    const moduleName = 'moduleToRemove';
    
    // Espiar console.log
    const originalConsoleLog = console.log;
    console.log = jest.fn();
    
    // Registrar el módulo
    registerModule(moduleName, {});
    
    // Actuar
    const result = unregisterModule(moduleName);
    
    // Verificar
    expect(result).toBe(true);
    expect(window.__appModules[moduleName]).toBeUndefined();
    expect(console.log).toHaveBeenCalledWith(`Módulo ${moduleName} eliminado correctamente`);
    
    // Restaurar console.log
    console.log = originalConsoleLog;
  });

  test('unregisterModule devuelve false y advierte cuando el módulo no existe', () => {
    // Preparar
    const nonExistentModule = 'moduleDoesNotExist';
    
    // Espiar console.warn
    const originalConsoleWarn = console.warn;
    console.warn = jest.fn();
    
    // Actuar
    const result = unregisterModule(nonExistentModule);
    
    // Verificar
    expect(result).toBe(false);
    expect(console.warn).toHaveBeenCalledWith(`El módulo ${nonExistentModule} no está registrado, no se puede eliminar.`);
    
    // Restaurar console.warn
    console.warn = originalConsoleWarn;
  });

  test('registerModule maneja el caso cuando window no está definido', () => {
    // Preparar
    const moduleName = 'testModuleNoWindow';
    const moduleApi = { test: true };
    
    // Guardar el valor original de window
    const originalWindow = global.window;
    // Simular que window no está definido
    delete global.window;
    
    // Espiar console.error
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Actuar
    const result = registerModule(moduleName, moduleApi);
    
    // Verificar
    expect(result).toBe(false);
    expect(console.error).toHaveBeenCalledWith('No se puede registrar el módulo fuera del entorno del navegador');
    
    // Restaurar window y console.error
    global.window = originalWindow;
    console.error = originalConsoleError;
  });

  test('getModule maneja el caso cuando window no está definido', () => {
    // Preparar
    const moduleName = 'testModuleGetNoWindow';
    
    // Guardar el valor original de window
    const originalWindow = global.window;
    // Simular que window no está definido
    delete global.window;
    
    // Espiar console.warn
    const originalConsoleWarn = console.warn;
    console.warn = jest.fn();
    
    // Actuar
    const result = getModule(moduleName);
    
    // Verificar
    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalledWith(`El módulo ${moduleName} no está disponible`);
    
    // Restaurar window y console.warn
    global.window = originalWindow;
    console.warn = originalConsoleWarn;
  });

  test('isModuleRegistered maneja el caso cuando window no está definido', () => {
    // Preparar
    const moduleName = 'testModuleCheckNoWindow';
    
    // Guardar el valor original de window
    const originalWindow = global.window;
    // Simular que window no está definido
    delete global.window;
    
    // Actuar
    const result = isModuleRegistered(moduleName);
    
    // Verificar
    expect(result).toBe(false);
    
    // Restaurar window
    global.window = originalWindow;
  });

  test('unregisterModule maneja el caso cuando window no está definido', () => {
    // Preparar
    const moduleName = 'testModuleUnregisterNoWindow';
    
    // Guardar el valor original de window
    const originalWindow = global.window;
    // Simular que window no está definido
    delete global.window;
    
    // Espiar console.warn
    const originalConsoleWarn = console.warn;
    console.warn = jest.fn();
    
    // Actuar
    const result = unregisterModule(moduleName);
    
    // Verificar
    expect(result).toBe(false);
    expect(console.warn).toHaveBeenCalledWith(`El módulo ${moduleName} no está registrado, no se puede eliminar.`);
    
    // Restaurar window y console.warn
    global.window = originalWindow;
    console.warn = originalConsoleWarn;
  });
});