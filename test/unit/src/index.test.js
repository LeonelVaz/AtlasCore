/**
 * @jest-environment jsdom
 */

import React from 'react';

// Mock para la importación de CSS
jest.mock('../../../src/styles/index.css', () => ({}));

// Mock para react-dom/client
jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn()
  }))
}));

// Mock para el componente App
jest.mock('../../../src/app', () => ({
  __esModule: true,
  default: () => <div>Mock App</div>
}));

describe('Index', () => {
  let originalConsoleError;
  let originalGetElementById;
  
  beforeEach(() => {
    // Guardamos el console.error original y lo reemplazamos con un mock
    originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Guardamos el getElementById original y lo reemplazamos con un mock
    originalGetElementById = document.getElementById;
    document.getElementById = jest.fn();
    
    // Limpiamos caché de módulos
    jest.resetModules();
  });
  
  afterEach(() => {
    // Restauramos funciones originales
    console.error = originalConsoleError;
    document.getElementById = originalGetElementById;
  });

  test('Se importa sin errores cuando el elemento root existe', () => {
    // Creamos un elemento div para simular root
    const mockRoot = document.createElement('div');
    document.getElementById.mockReturnValue(mockRoot);
    
    // No debería lanzar error
    expect(() => {
      require('../../../src/index.jsx');
    }).not.toThrow();
    
    expect(document.getElementById).toHaveBeenCalledWith('root');
  });

  test('Maneja correctamente cuando el elemento root no existe', () => {
    // Simulamos que getElementById retorna null
    document.getElementById.mockReturnValue(null);
    
    // No debería lanzar error
    expect(() => {
      require('../../../src/index.jsx');
    }).not.toThrow();
    
    expect(document.getElementById).toHaveBeenCalledWith('root');
  });
});