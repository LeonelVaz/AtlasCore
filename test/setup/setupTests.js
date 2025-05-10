// test/setup/setupTests.js
import '@testing-library/jest-dom';

// Configuración adicional para Jest
// Esto añade los matchers personalizados como toBeInTheDocument, toHaveClass, etc.

// Mock para window.electronAPI 
// Necesario para probar componentes que verifican window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: undefined,
  writable: true
});

// Mock para window.__appModules
// Necesario para el registro de módulos
if (!window.__appModules) {
  window.__appModules = {};
}

// Mock para funciones de storage que devuelven Promises
jest.mock('../../src/services/storage-service', () => ({
  __esModule: true,
  default: {
    get: jest.fn().mockImplementation(() => Promise.resolve([])),
    set: jest.fn().mockImplementation(() => Promise.resolve(true))
  }
}));

// Suprimir errores de consola durante las pruebas
const originalConsoleError = console.error;
console.error = (...args) => {
  // No mostrar ciertos errores esperados durante las pruebas
  if (
    args[0]?.includes?.('Warning:') ||
    args[0]?.includes?.('Error:') ||
    args[0]?.includes?.('act(...)')
  ) {
    return;
  }
  originalConsoleError(...args);
};