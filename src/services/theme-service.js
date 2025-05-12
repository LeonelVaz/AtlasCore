// src/services/theme-service.js
import { THEMES, STORAGE_KEYS } from '../core/config/constants';
import storageService from './storage-service';

/**
 * Servicio para gestionar los temas de la aplicación
 */
class ThemeService {
  constructor() {
    // Tema predeterminado
    this.defaultTheme = THEMES.LIGHT;
    
    // Temas disponibles
    this.availableThemes = [
      {
        id: THEMES.LIGHT,
        name: 'Claro',
        icon: '☀️'
      },
      {
        id: THEMES.DARK,
        name: 'Oscuro',
        icon: '🌑'
      },
      {
        id: THEMES.ATLAS_DARK_BLUE,
        name: 'Azul Atlas Oscuro',
        icon: '🌃'
      },
      {
        id: THEMES.PURPLE_NIGHT,
        name: 'Púrpura Nocturno',
        icon: '✨'
      },
      {
        id: THEMES.DEEP_OCEAN,
        name: 'Océano Profundo',
        icon: '🌊'
      }
    ];
  }

  /**
   * Obtiene la lista de temas disponibles
   * @returns {Array} - Lista de temas disponibles
   */
  getAvailableThemes() {
    return this.availableThemes;
  }

  /**
   * Obtiene el tema actual del almacenamiento
   * @returns {Promise<string>} - ID del tema actual
   */
  async getCurrentTheme() {
    try {
      const theme = await storageService.get(STORAGE_KEYS.THEME);
      return theme || this.defaultTheme;
    } catch (error) {
      console.error('Error al obtener el tema actual:', error);
      return this.defaultTheme;
    }
  }

  /**
   * Establece un nuevo tema
   * @param {string} themeId - ID del tema a establecer
   * @returns {Promise<boolean>} - true si el tema se estableció correctamente
   */
  async setTheme(themeId) {
    try {
      // Validar que el tema existe
      if (!Object.values(THEMES).includes(themeId)) {
        console.error(`Tema no válido: ${themeId}`);
        return false;
      }
      
      // Guardar el tema en el almacenamiento
      const result = await storageService.set(STORAGE_KEYS.THEME, themeId);
      
      // Aplicar el tema al elemento html
      if (result) {
        this.applyTheme(themeId);
      }
      
      return result;
    } catch (error) {
      console.error('Error al establecer el tema:', error);
      return false;
    }
  }

  /**
   * Aplica un tema al documento
   * @param {string} themeId - ID del tema a aplicar
   */
  applyTheme(themeId) {
    try {
      // Obtener el elemento html
      const htmlElement = document.documentElement;
      
      // Eliminar clases de tema anteriores
      Object.values(THEMES).forEach(theme => {
        htmlElement.classList.remove(`theme-${theme}`);
      });
      
      // Añadir la clase del nuevo tema
      htmlElement.classList.add(`theme-${themeId}`);
      
      // Actualizar el atributo data-theme para selectores CSS
      htmlElement.setAttribute('data-theme', themeId);
      
      console.log(`Tema aplicado: ${themeId}`);
    } catch (error) {
      console.error('Error al aplicar el tema:', error);
    }
  }

  /**
   * Inicializa el servicio de temas
   * @returns {Promise<string>} - Tema actual
   */
  async initialize() {
    try {
      const currentTheme = await this.getCurrentTheme();
      this.applyTheme(currentTheme);
      return currentTheme;
    } catch (error) {
      console.error('Error al inicializar el servicio de temas:', error);
      this.applyTheme(this.defaultTheme);
      return this.defaultTheme;
    }
  }
}

// Exportar una única instancia para toda la aplicación
const themeService = new ThemeService();
export default themeService;