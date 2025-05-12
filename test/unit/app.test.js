// test/unit/app.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Importar el componente a probar
import App from '../../src/app';

// Mock del módulo electron-detector
jest.mock('../../src/utils/electron-detector', () => ({
  isElectronEnv: jest.fn()
}));

// Importar la función mockeada
import { isElectronEnv } from '../../src/utils/electron-detector';

// Mock para CalendarMain
jest.mock('../../src/components/calendar/calendar-main', () => {
  return function MockCalendarMain() {
    return <div data-testid="mock-calendar-main">Mock Calendar Main</div>;
  };
});

// Mock para WindowControls
jest.mock('../../src/components/ui/window-controls', () => {
  return function MockWindowControls() {
    return <div data-testid="mock-window-controls">Mock Window Controls</div>;
  };
});

describe('App Component', () => {
  beforeEach(() => {
    // Limpiar cualquier mock antes de cada prueba
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Limpiar el DOM después de cada prueba
    document.body.innerHTML = '';
  });

  test('se renderiza correctamente con header y contenido principal', () => {
    // Mock de isElectronEnv para este test
    isElectronEnv.mockReturnValue(false);
    
    // Renderizar el componente App
    render(<App />);
    
    // Verificar que el header existe
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('app-header');
    
    // Verificar que el logo y título están presentes
    const title = screen.getByText('Atlas');
    expect(title).toBeInTheDocument();
    
    // Verificar que el contenido principal existe
    const mainContent = screen.getByRole('main');
    expect(mainContent).toBeInTheDocument();
    expect(mainContent).toHaveClass('app-content');
    
    // Verificar que CalendarMain está renderizado
    const calendarMain = screen.getByTestId('mock-calendar-main');
    expect(calendarMain).toBeInTheDocument();
  });

  test('aplica la clase draggable al header cuando estamos en Electron', () => {
    // Mock de isElectronEnv para simular entorno Electron
    isElectronEnv.mockReturnValue(true);
    
    // Renderizar el componente App
    render(<App />);
    
    // Verificar que el header tiene la clase draggable
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('draggable');
  });

  test('no aplica la clase draggable al header cuando no estamos en Electron', () => {
    // Mock de isElectronEnv para simular entorno no-Electron
    isElectronEnv.mockReturnValue(false);
    
    // Renderizar el componente App
    render(<App />);
    
    // Verificar que el header no tiene la clase draggable
    const header = screen.getByRole('banner');
    expect(header).not.toHaveClass('draggable');
  });

  test('renderiza el componente WindowControls cuando estamos en Electron', () => {
    // Mock de isElectronEnv para simular entorno Electron
    isElectronEnv.mockReturnValue(true);
    
    // Renderizar el componente App
    render(<App />);
    
    // Verificar que WindowControls está renderizado
    const windowControls = screen.getByTestId('mock-window-controls');
    expect(windowControls).toBeInTheDocument();
  });

  test('no renderiza el componente WindowControls cuando no estamos en Electron', () => {
    // Mock de isElectronEnv para simular entorno no-Electron
    isElectronEnv.mockReturnValue(false);
    
    // Renderizar el componente App
    render(<App />);
    
    // Verificar que WindowControls NO está renderizado
    const windowControls = screen.queryByTestId('mock-window-controls');
    expect(windowControls).not.toBeInTheDocument();
  });
});