// test/unit/src/hooks/use-theme.test.jsx

/**
 * @jest-environment jsdom
 */
import React from 'react';
import { renderHook } from '@testing-library/react';
// Importar el hook bajo prueba
import useTheme from '../../../../src/hooks/use-theme'; // Ruta corregida
// Importar el Contexto real para el Provider
import { ThemeContext } from '../../../../src/contexts/theme-context'; // Ruta corregida

describe('useTheme Hook', () => {
  test('debe devolver el contexto del tema cuando se usa dentro de un ThemeProvider', () => {
    const mockThemeContextValue = {
      theme: 'dark',
      setTheme: jest.fn(),
      availableThemes: ['light', 'dark'],
    };

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
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => renderHook(() => useTheme())).toThrow('useTheme debe usarse dentro de un ThemeProvider');

    console.error = originalError;
  });
});