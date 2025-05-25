// test/unit/src/hooks/use-theme.test.jsx

/**
 * @jest-environment jsdom
 */
import React from 'react';
import { renderHook } from '@testing-library/react';
import useTheme from '../../../../src/hooks/use-theme';
import { ThemeContext } from '../../../../src/contexts/theme-context'; // Importar el contexto real

describe('useTheme Hook', () => {
  test('debe devolver el contexto del tema cuando se usa dentro de un ThemeProvider', () => {
    const mockThemeContextValue = {
      theme: 'dark',
      setTheme: jest.fn(),
      availableThemes: ['light', 'dark'],
    };

    // Crear un wrapper que provea el contexto
    const wrapper = ({ children }) => (
      <ThemeContext.Provider value={mockThemeContextValue}>
        {children}
      </ThemeContext.Provider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe('dark');
    expect(result.current.setTheme).toBe(mockThemeContextValue.setTheme);
    expect(result.current.availableThemes).toEqual(['light', 'dark']);
  });

  test('debe lanzar un error si se usa fuera de un ThemeProvider', () => {
    // Suprimir console.error temporalmente para este test, ya que React lo usa al lanzar el error.
    const originalError = console.error;
    console.error = jest.fn();

    // renderHook lanzará un error si el contexto no está disponible,
    // y Jest lo capturará.
    expect(() => renderHook(() => useTheme())).toThrow('useTheme debe usarse dentro de un ThemeProvider');

    // Restaurar console.error
    console.error = originalError;
  });
});