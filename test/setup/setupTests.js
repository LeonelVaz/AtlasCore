// test/setup/setupTests.js
import "@testing-library/jest-dom";

console.log("--- [setupTests.js] Archivo de setup global INICIADO ---");

// --- INICIO: Mocks para características de bundler (Vite/Webpack) ---

// Mock para import() dinámico y import.meta.glob
// Dado que babel-plugin-transform-vite-meta-glob elimina import.meta.glob,
// este mock para import.meta.glob no será usado por el código transformado.
// Se mantiene por si acaso o para otros módulos.
if (typeof global.import !== "function") {
  // @ts-ignore
  global.import = jest.fn();
}
// @ts-ignore
if (!global.import.meta) {
  // @ts-ignore
  global.import.meta = { glob: jest.fn() };
  // @ts-ignore
} else if (typeof global.import.meta.glob !== "function") {
  // @ts-ignore
  global.import.meta.glob = jest.fn();
}

// Mock para require.context (Webpack)
if (typeof global.require === "undefined") {
  // @ts-ignore
  global.require = {};
}
// @ts-ignore
if (typeof global.require.context !== "function") {
  // Asegurar que solo se defina si no existe
  // @ts-ignore
  global.require.context = jest.fn(() => ({
    // Esta es la función que se llamará
    keys: jest.fn(() => []),
    call: jest.fn((self, key) => ({ default: null })), // Simula context(key)
    resolve: jest.fn(),
  }));
}
// --- FIN: Mocks para características de bundler ---

if (typeof window.electronAPI === "undefined") {
  Object.defineProperty(window, "electronAPI", {
    value: undefined,
    writable: true,
    configurable: true,
  });
}

if (!window.__appModules) {
  window.__appModules = {};
}

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

const IGNORED_MESSAGES = [
  "Warning: An update to %s inside a test was not wrapped in act(...)",
];

console.error = (...args) => {
  const message = args.length > 0 && typeof args[0] === "string" ? args[0] : "";
  if (
    IGNORED_MESSAGES.some((ignoredMessage) => message.includes(ignoredMessage))
  ) {
    return;
  }
  originalConsoleError(...args);
};

console.warn = (...args) => {
  const message = args.length > 0 && typeof args[0] === "string" ? args[0] : "";
  if (
    IGNORED_MESSAGES.some((ignoredMessage) => message.includes(ignoredMessage))
  ) {
    return;
  }
  originalConsoleWarn(...args);
};

console.log("--- [setupTests.js] Archivo de setup global COMPLETADO ---");
