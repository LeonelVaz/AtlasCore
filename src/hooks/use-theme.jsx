// src/hooks/use-theme.jsx
import { useContext } from 'react';
import { ThemeContext } from '../contexts/theme-context';

/**
 * Hook personalizado para acceder al contexto de temas
 * @returns {Object} - Valores y funciones del contexto de temas
 */
function useTheme() {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider');
  }
  
  return context;
}

export default useTheme;