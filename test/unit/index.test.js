import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../../src/app';

// Mocks para ReactDOM
jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn()
  }))
}));

// Mock para el componente App
jest.mock('../../src/app', () => {
  return function MockApp() {
    return <div>App Simulada</div>;
  };
});

describe('Index', () => {
  let originalGetElementById;
  
  beforeEach(() => {
    // Guardar implementación original
    originalGetElementById = document.getElementById;
    
    // Mock para document.getElementById
    document.getElementById = jest.fn().mockReturnValue({});
    
    // Limpiar el mock de ReactDOM
    ReactDOM.createRoot.mockClear();
  });
  
  afterEach(() => {
    // Restaurar la implementación original
    document.getElementById = originalGetElementById;
    
    // Eliminar módulos cacheados para que index.jsx se vuelva a ejecutar
    jest.resetModules();
  });
  
  test('debe crear un root de React y renderizar el componente App', () => {
    // Cargar el archivo index.jsx para que se ejecute
    require('../../src/index.jsx');
    
    // Verificar que se llamó a document.getElementById con 'root'
    expect(document.getElementById).toHaveBeenCalledWith('root');
    
    // Verificar que se creó un root React
    expect(ReactDOM.createRoot).toHaveBeenCalled();
    
    // Verificar que se renderizó algún componente (sin verificar la estructura exacta)
    const mockRoot = ReactDOM.createRoot.mock.results[0].value;
    expect(mockRoot.render).toHaveBeenCalled();
  });
});