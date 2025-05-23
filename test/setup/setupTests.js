// test/setup/setupTests.js
import '@testing-library/jest-dom';

console.log('--- [setupTests.js] Archivo de setup global INICIADO ---');

if (typeof window.electronAPI === 'undefined') {
  Object.defineProperty(window, 'electronAPI', {
    value: undefined, 
    writable: true,
    configurable: true, 
  });
  // console.log('--- [setupTests.js] window.electronAPI mockeado/asegurado ---');
}

if (!window.__appModules) {
  window.__appModules = {};
  // console.log('--- [setupTests.js] window.__appModules mockeado/asegurado ---');
}

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn; 

const IGNORED_MESSAGES = [
  'Warning: An update to %s inside a test was not wrapped in act(...)',
];

console.error = (...args) => {
  const message = (args.length > 0 && typeof args[0] === 'string') ? args[0] : '';
  if (IGNORED_MESSAGES.some(ignoredMessage => message.includes(ignoredMessage))) {
    return;
  }
  // No suprimir errores de RTL por defecto, son importantes para la depuración
  originalConsoleError(...args);
};

console.warn = (...args) => {
  const message = (args.length > 0 && typeof args[0] === 'string') ? args[0] : '';
  if (IGNORED_MESSAGES.some(ignoredMessage => message.includes(ignoredMessage))) {
    return;
  }
  originalConsoleWarn(...args);
};

console.log('--- [setupTests.js] Archivo de setup global COMPLETADO ---');