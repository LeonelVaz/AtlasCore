// src/contexts/theme-context.jsx
import React, { createContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import themeService from "../services/theme-service";
import { THEMES } from "../core/config/constants";

// Crear el contexto
export const ThemeContext = createContext();

/**
 * Proveedor de contexto para el tema
 * @param {Object} props - Propiedades del componente
 */
export const ThemeProvider = ({ children }) => {
  // Estado para el tema actual
  const [currentTheme, setCurrentTheme] = useState(THEMES.LIGHT);
  // Estado para los temas disponibles
  const [availableThemes, setAvailableThemes] = useState([]);
  // Estado de carga
  const [loading, setLoading] = useState(true);

  // Cargar tema al inicio
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        // Inicializar el servicio de temas
        const theme = await themeService.initialize();
        setCurrentTheme(theme);

        // Obtener los temas disponibles
        const themes = themeService.getAvailableThemes();
        setAvailableThemes(themes);
      } catch (error) {
        console.error("Error al inicializar el tema:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeTheme();
  }, []);

  // Función para cambiar el tema
  const changeTheme = async (themeId) => {
    try {
      const success = await themeService.setTheme(themeId);
      if (success) {
        setCurrentTheme(themeId);
      }
      return success;
    } catch (error) {
      console.error("Error al cambiar el tema:", error);
      return false;
    }
  };

  // Valor del contexto
  const value = {
    currentTheme,
    availableThemes,
    changeTheme,
    loading,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ThemeProvider;
