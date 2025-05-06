// test/setupTests.js
import '@testing-library/jest-dom';

// Mock de localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => {
      return store[key] || null;
    }),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock para la propiedad window.__appModules si no existe
if (typeof window !== 'undefined' && !window.__appModules) {
  window.__appModules = {};
}

// Mock para console.error y console.warn para mantener la salida de tests limpia
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = jest.fn((...args) => {
  // No mostrar errores esperados durante las pruebas
  if (
    args[0]?.includes?.('The above error occurred in the') ||
    args[0]?.includes?.('Error: Not implemented') ||
    args[0]?.includes?.('Esto es un error esperado en la prueba')
  ) {
    return;
  }
  originalConsoleError(...args);
});

console.warn = jest.fn((...args) => {
  // No mostrar advertencias esperadas durante las pruebas
  if (
    args[0]?.includes?.('Warning: ') ||
    args[0]?.includes?.('Esto es una advertencia esperada en la prueba')
  ) {
    return;
  }
  originalConsoleWarn(...args);
});

// Limpiar mocks después de cada prueba
afterEach(() => {
  jest.clearAllMocks();
});