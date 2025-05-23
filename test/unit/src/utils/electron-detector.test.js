/**
 * @jest-environment jsdom
 */

// test/unit/electron-detector.test.js
import { isElectronEnv } from '../../../../src/utils/electron-detector';

describe('Electron Detector', () => {
  // Guardar el window original para restaurarlo después de las pruebas
  const originalWindow = global.window;
  
  afterEach(() => {
    // Restaurar window después de cada prueba
    global.window = originalWindow;
  });

  test('debe detectar correctamente el entorno Electron', () => {
    // Simular entorno Electron
    Object.defineProperty(global, 'window', {
      value: {
        electronAPI: {
          minimize: jest.fn(),
          maximize: jest.fn(),
          close: jest.fn()
        }
      },
      writable: true
    });
    
    expect(isElectronEnv()).toBe(true);
  });

  test('debe detectar correctamente el entorno no-Electron (navegador)', () => {
    // Simular entorno navegador (sin electronAPI)
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true
    });
    
    expect(isElectronEnv()).toBe(false);
  });

  test('debe manejar el caso donde window.electronAPI es undefined', () => {
    // Simular entorno con window pero electronAPI undefined
    Object.defineProperty(global, 'window', {
      value: {
        electronAPI: undefined
      },
      writable: true
    });
    
    expect(isElectronEnv()).toBe(false);
  });

  test('debe manejar el caso donde window no está definido', () => {
    // Simular entorno sin window (como Node.js sin jsdom)
    global.window = undefined;
    
    expect(isElectronEnv()).toBe(false);
  });

  test('debe manejar el caso donde window es null', () => {
    // Simular entorno donde window es null
    global.window = null;
    
    expect(isElectronEnv()).toBe(false);
  });
});