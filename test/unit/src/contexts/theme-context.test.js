/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, ThemeContext } from '../../../../src/contexts/theme-context'; 
import { THEMES } from '../../../../src/core/config/constants'; 

// Mock del themeService
// La factory de jest.mock DEBE devolver el objeto mock directamente.
// Las funciones jest.fn() se crearán aquí.
jest.mock('../../../../src/services/theme-service', () => ({
  initialize: jest.fn(),
  getAvailableThemes: jest.fn(),
  setTheme: jest.fn(),
}));

// Importar el themeService DESPUÉS de que haya sido mockeado
// Ahora, `themeService` será el objeto mock que definimos arriba.
const themeService = require('../../../../src/services/theme-service');

// Componente de prueba para consumir el contexto
const TestConsumer = () => {
  const context = React.useContext(ThemeContext);
  if (!context) return <p>Context not found</p>;
  return (
    <div>
      <p>Current Theme: {context.currentTheme}</p>
      <p>Loading: {context.loading.toString()}</p>
      <p>Available Themes: {context.availableThemes.map(t => t.name).join(', ')}</p>
      <button onClick={async () => await context.changeTheme(THEMES.DARK)}>Change to Dark</button>
    </div>
  );
};

describe('ThemeProvider and ThemeContext', () => {
  const mockAvailableThemesData = [
    { id: THEMES.LIGHT, name: 'Claro' },
    { id: THEMES.DARK, name: 'Oscuro' },
  ];

  beforeEach(() => {
    // Limpiar todas las llamadas y configuraciones de los mocks del servicio
    // Accedemos a las funciones a través del themeService mockeado
    themeService.initialize.mockClear();
    themeService.getAvailableThemes.mockClear();
    themeService.setTheme.mockClear();

    // Configuración por defecto de los mocks del servicio
    themeService.initialize.mockResolvedValue(THEMES.LIGHT);
    themeService.getAvailableThemes.mockReturnValue(mockAvailableThemesData);
    themeService.setTheme.mockResolvedValue(true);
  });

  test('debe inicializar y proveer el tema actual, temas disponibles y estado de carga', async () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByText('Loading: true')).toBeInTheDocument();
    
    await waitFor(() => expect(screen.getByText('Loading: false')).toBeInTheDocument());

    expect(themeService.initialize).toHaveBeenCalledTimes(1);
    expect(themeService.getAvailableThemes).toHaveBeenCalledTimes(1);
    
    expect(screen.getByText(`Current Theme: ${THEMES.LIGHT}`)).toBeInTheDocument();
    expect(screen.getByText(`Available Themes: ${mockAvailableThemesData.map(t => t.name).join(', ')}`)).toBeInTheDocument();
  });

  test('debe manejar errores durante la inicialización', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    themeService.initialize.mockRejectedValueOnce(new Error('Init failed'));

    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    await waitFor(() => expect(screen.getByText('Loading: false')).toBeInTheDocument());
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error al inicializar el tema:', expect.any(Error));
    expect(screen.getByText(`Current Theme: ${THEMES.LIGHT}`)).toBeInTheDocument();
    
    consoleErrorSpy.mockRestore();
  });

  test('changeTheme debe llamar a themeService.setTheme y actualizar currentTheme si tiene éxito', async () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );
    await waitFor(() => expect(screen.getByText('Loading: false')).toBeInTheDocument());

    const changeButton = screen.getByRole('button', { name: 'Change to Dark' });
    await act(async () => {
      fireEvent.click(changeButton);
    });

    expect(themeService.setTheme).toHaveBeenCalledWith(THEMES.DARK);
    await waitFor(() => expect(screen.getByText(`Current Theme: ${THEMES.DARK}`)).toBeInTheDocument());
  });

  test('changeTheme no debe actualizar currentTheme si themeService.setTheme falla (devuelve false)', async () => {
    themeService.setTheme.mockResolvedValueOnce(false); 
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );
    await waitFor(() => expect(screen.getByText('Loading: false')).toBeInTheDocument());
    expect(screen.getByText(`Current Theme: ${THEMES.LIGHT}`)).toBeInTheDocument();


    const changeButton = screen.getByRole('button', { name: 'Change to Dark' });
    await act(async () => {
      fireEvent.click(changeButton);
    });

    expect(themeService.setTheme).toHaveBeenCalledWith(THEMES.DARK);
    expect(screen.getByText(`Current Theme: ${THEMES.LIGHT}`)).toBeInTheDocument();
  });

   test('changeTheme debe manejar errores de themeService.setTheme (lanza error)', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    themeService.setTheme.mockRejectedValueOnce(new Error('Set failed'));
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );
    await waitFor(() => expect(screen.getByText('Loading: false')).toBeInTheDocument());

    const changeButton = screen.getByRole('button', { name: 'Change to Dark' });
     await act(async () => {
      fireEvent.click(changeButton);
    });
    
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error al cambiar el tema:', expect.any(Error));
    expect(screen.getByText(`Current Theme: ${THEMES.LIGHT}`)).toBeInTheDocument(); 
    consoleErrorSpy.mockRestore();
  });
});