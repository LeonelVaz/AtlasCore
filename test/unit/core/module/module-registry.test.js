// module-registry.test.js

import { registerModule, getModule, isModuleRegistered, unregisterModule } from '../../../../src/core/module/module-registry';

describe('Module Registry', () => {
  // Limpiar el registro de módulos entre pruebas
  beforeEach(() => {
    if (window.__appModules) {
      Object.keys(window.__appModules).forEach(key => {
        delete window.__appModules[key];
      });
    }
  });

  // Prueba para la inicialización del registro global de módulos (línea 10)
  test('debe inicializar window.__appModules si no existe', () => {
    // Eliminar __appModules para comprobar la inicialización
    delete window.__appModules;
    
    // Re-importar el módulo para que se ejecute la inicialización
    jest.resetModules();
    const moduleRegistry = require('../../../../src/core/module/module-registry');
    
    // Verificar que __appModules se ha inicializado
    expect(window.__appModules).toBeDefined();
    expect(window.__appModules).toEqual({});
  });

  test('registerModule debe registrar un módulo y devolver true si es exitoso', () => {
    const testModuleApi = {
      sayHello: () => 'Hello from test module'
    };
    
    const result = registerModule('testModule', testModuleApi);
    
    expect(result).toBe(true);
    expect(window.__appModules['testModule']).toBe(testModuleApi);
  });

  test('registerModule debe mostrar una advertencia si se sobrescribe un módulo', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    registerModule('testModule', { version: '1.0' });
    registerModule('testModule', { version: '2.0' });
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('El módulo testModule ya está registrado. Se sobrescribirá.')
    );
    expect(window.__appModules['testModule']).toEqual({ version: '2.0' });
    
    consoleSpy.mockRestore();
  });

  test('registerModule debe mostrar un error si no está en un entorno de navegador', () => {
    const originalWindow = global.window;
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Simular que no estamos en un navegador
    delete global.window;
    
    const result = registerModule('testModule', {});
    
    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('No se puede registrar el módulo fuera del entorno del navegador')
    );
    
    // Restaurar window
    global.window = originalWindow;
    consoleSpy.mockRestore();
  });

  test('getModule debe devolver la API del módulo si está registrado', () => {
    const testModuleApi = {
      getData: () => 'test data'
    };
    
    registerModule('testModule', testModuleApi);
    
    const retrievedModule = getModule('testModule');
    
    expect(retrievedModule).toBe(testModuleApi);
    expect(retrievedModule.getData()).toBe('test data');
  });

  test('getModule debe devolver null y mostrar advertencia si el módulo no existe', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    const result = getModule('nonExistingModule');
    
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('El módulo nonExistingModule no está disponible')
    );
    
    consoleSpy.mockRestore();
  });

  test('getModule debe manejar caso cuando window no está definido', () => {
    const originalWindow = global.window;
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    delete global.window;
    
    const result = getModule('testModule');
    
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    
    global.window = originalWindow;
    consoleSpy.mockRestore();
  });

  test('isModuleRegistered debe devolver true si el módulo está registrado', () => {
    registerModule('testModule', {});
    
    const isRegistered = isModuleRegistered('testModule');
    
    expect(isRegistered).toBe(true);
  });

  test('isModuleRegistered debe devolver false si el módulo no está registrado', () => {
    const isRegistered = isModuleRegistered('nonExistingModule');
    
    expect(isRegistered).toBe(false);
  });

  test('isModuleRegistered debe manejar caso cuando window no está definido', () => {
    const originalWindow = global.window;
    
    delete global.window;
    
    const isRegistered = isModuleRegistered('testModule');
    
    expect(isRegistered).toBe(false);
    
    global.window = originalWindow;
  });

  // Pruebas para unregisterModule (líneas 65-73)
  test('unregisterModule debe eliminar un módulo registrado y devolver true', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    registerModule('testModule', { id: 'test' });
    
    // Verificar que el módulo está registrado
    expect(isModuleRegistered('testModule')).toBe(true);
    
    // Eliminar el módulo
    const result = unregisterModule('testModule');
    
    expect(result).toBe(true);
    expect(isModuleRegistered('testModule')).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Módulo testModule eliminado correctamente')
    );
    
    consoleSpy.mockRestore();
  });

  test('unregisterModule debe devolver false y mostrar advertencia si el módulo no existe', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    const result = unregisterModule('nonExistingModule');
    
    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('El módulo nonExistingModule no está registrado, no se puede eliminar.')
    );
    
    consoleSpy.mockRestore();
  });

  test('unregisterModule debe manejar caso cuando window no está definido', () => {
    const originalWindow = global.window;
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    delete global.window;
    
    const result = unregisterModule('testModule');
    
    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    
    global.window = originalWindow;
    consoleSpy.mockRestore();
  });

  test('unregisterModule debe manejar caso cuando window.__appModules no está definido', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    // Guardar y eliminar __appModules
    const originalAppModules = window.__appModules;
    delete window.__appModules;
    
    const result = unregisterModule('testModule');
    
    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    
    // Restaurar __appModules
    window.__appModules = originalAppModules;
    consoleSpy.mockRestore();
  });

  test('múltiples módulos pueden registrarse y recuperarse correctamente', () => {
    const module1Api = { id: 'module1' };
    const module2Api = { id: 'module2' };
    const module3Api = { id: 'module3' };
    
    registerModule('module1', module1Api);
    registerModule('module2', module2Api);
    registerModule('module3', module3Api);
    
    expect(getModule('module1')).toBe(module1Api);
    expect(getModule('module2')).toBe(module2Api);
    expect(getModule('module3')).toBe(module3Api);
    
    expect(isModuleRegistered('module1')).toBe(true);
    expect(isModuleRegistered('module2')).toBe(true);
    expect(isModuleRegistered('module3')).toBe(true);
    expect(isModuleRegistered('module4')).toBe(false);
  });
});