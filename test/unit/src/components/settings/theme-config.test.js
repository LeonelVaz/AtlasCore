/**
 * @jest-environment jsdom
 */
import React from 'react';
// AÑADIR 'within' A LA IMPORTACIÓN
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock del hook useTheme
const mockChangeTheme = jest.fn();
const mockUseTheme = jest.fn(() => ({
  currentTheme: 'light',
  availableThemes: [
    { id: 'light', name: 'Claro' },
    { id: 'dark', name: 'Oscuro' },
    { id: 'atlas-dark-blue', name: 'Atlas Azul Oscuro' },
  ],
  changeTheme: mockChangeTheme,
}));

jest.mock('../../../../../src/hooks/use-theme', () => mockUseTheme);

// Importar el componente después de mockear el hook
const ThemeConfig = require('../../../../../src/components/settings/theme-config').default;

describe('ThemeConfig Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Resetear el mock para cada test si es necesario, o configurar un nuevo valor
    mockUseTheme.mockImplementation(() => ({
      currentTheme: 'light',
      availableThemes: [
        { id: 'light', name: 'Claro' },
        { id: 'dark', name: 'Oscuro' },
        { id: 'atlas-dark-blue', name: 'Atlas Azul Oscuro' },
      ],
      changeTheme: mockChangeTheme,
    }));
  });

  test('debe renderizar el título y la descripción', () => {
    render(<ThemeConfig />);
    expect(screen.getByText('Tema de la Aplicación')).toBeInTheDocument();
    expect(screen.getByText(/Elige el tema que más te guste/i)).toBeInTheDocument();
  });

  test('debe mostrar los temas disponibles', () => {
    render(<ThemeConfig />);
    expect(screen.getByText('Claro')).toBeInTheDocument();
    expect(screen.getByText('Oscuro')).toBeInTheDocument();
    expect(screen.getByText('Atlas Azul Oscuro')).toBeInTheDocument();
  });

  test('debe resaltar el tema actual', () => {
    // Simular que 'dark' es el tema actual para este test específico
    mockUseTheme.mockImplementation(() => ({ 
      currentTheme: 'dark',
      availableThemes: [
        { id: 'light', name: 'Claro' },
        { id: 'dark', name: 'Oscuro' },
      ],
      changeTheme: mockChangeTheme,
    }));
    render(<ThemeConfig />);
    const darkThemeOption = screen.getByText('Oscuro').closest('.theme-option');
    expect(darkThemeOption).toHaveClass('selected');
    // Usar within para buscar el checkmark dentro de la opción seleccionada
    expect(within(darkThemeOption).getByText('✓')).toBeInTheDocument();

    const lightThemeOption = screen.getByText('Claro').closest('.theme-option');
    expect(lightThemeOption).not.toHaveClass('selected');
    expect(within(lightThemeOption).queryByText('✓')).not.toBeInTheDocument(); // Verificar que no tiene checkmark
  });

  test('debe llamar a changeTheme al hacer clic en una opción de tema', () => {
    render(<ThemeConfig />);
    const darkThemeOption = screen.getByText('Oscuro').closest('.theme-option');
    fireEvent.click(darkThemeOption);
    expect(mockChangeTheme).toHaveBeenCalledWith('dark');
  });

  test('debe renderizar secciones de placeholders para funcionalidades futuras', () => {
    render(<ThemeConfig />);
    expect(screen.getByText('Estilo de Encabezados de Días')).toBeInTheDocument();
    // Ser más específico si el texto puede repetirse
    const placeholders = screen.getAllByText('Esta funcionalidad se implementará próximamente');
    expect(placeholders.length).toBe(2); // Asegurar que ambos placeholders están presentes
    expect(screen.getByText('Visualización de Hora en Eventos')).toBeInTheDocument();
  });
});