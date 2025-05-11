// test/unit/index.test.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../../src/app';

// Mock para ReactDOM.createRoot
jest.mock('react-dom/client', () => ({
  createRoot: jest.fn().mockReturnValue({
    render: jest.fn()
  })
}));

// Mock para App
jest.mock('../../src/app', () => {
  return function MockApp() {
    return <div data-testid="mock-app">Mock App Component</div>;
  };
});

// Mock para document.getElementById
const mockGetElementById = jest.fn();
document.getElementById = mockGetElementById;

describe('Index Entry Point', () => {
  beforeEach(() => {
    // Limpiar mocks antes de cada prueba
    jest.clearAllMocks();
    // Mock de getElementById para devolver un elemento div
    mockGetElementById.mockReturnValue(document.createElement('div'));
  });

  test('renderiza App en el elemento root', () => {
    // Ejecutar el archivo index.jsx
    require('../../src/index.jsx');
    
    // Verificar que se llamó a getElementById con 'root'
    expect(mockGetElementById).toHaveBeenCalledWith('root');
    
    // Verificar que se creó el root de React
    expect(createRoot).toHaveBeenCalled();
    
    // Verificar que se renderizó App
    const mockRoot = createRoot.mock.results[0].value;
    expect(mockRoot.render).toHaveBeenCalledWith(
      expect.objectContaining({
        type: App
      })
    );
  });

  test('envuelve App en StrictMode', () => {
    // Ejecutar el archivo index.jsx
    jest.isolateModules(() => {
      require('../../src/index.jsx');
    });
    
    // Verificar la estructura con StrictMode
    const mockRoot = createRoot.mock.results[0].value;
    const renderCall = mockRoot.render.mock.calls[0][0];
    
    // StrictMode debe ser el componente exterior
    expect(renderCall.type.name).toBe('StrictMode');
    
    // App debe ser el hijo de StrictMode
    const strictModeChildren = renderCall.props.children;
    expect(strictModeChildren.type).toBe(App);
  });

  test('maneja el caso donde el elemento root no existe', () => {
    // Simular que getElementById devuelve null
    mockGetElementById.mockReturnValue(null);
    
    // Capturar los errores de consola
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Ejecutar el archivo index.jsx
    jest.isolateModules(() => {
      require('../../src/index.jsx');
    });
    
    // Verificar que se intentó encontrar el elemento root
    expect(mockGetElementById).toHaveBeenCalledWith('root');
    
    // Verificar que no se creó el root de React si el elemento no existe
    // Al menos debería mostrar algún error o warning
    expect(console.error).toHaveBeenCalled();
    
    // Restaurar console.error
    console.error = originalConsoleError;
  });
});