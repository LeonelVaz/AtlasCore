// src/services/time-scale-service.js
import { TIME_SCALES, STORAGE_KEYS } from '../core/config/constants';
import storageService from './storage-service';
import eventBus from '../core/bus/event-bus';

/**
 * Servicio para gestionar la escala de tiempo
 */
class TimeScaleService {
  constructor() {
    // Escala predeterminada
    this.defaultTimeScale = TIME_SCALES.STANDARD;
    
    // Escalas disponibles
    this.availableTimeScales = [
      TIME_SCALES.COMPACT,
      TIME_SCALES.STANDARD,
      TIME_SCALES.COMFORTABLE,
      TIME_SCALES.SPACIOUS
    ];
  }

  /**
   * Obtiene la lista de escalas de tiempo disponibles
   * @returns {Array} - Lista de escalas disponibles
   */
  getAvailableTimeScales() {
    return this.availableTimeScales;
  }

  /**
   * Obtiene la escala de tiempo actual del almacenamiento
   * @returns {Promise<Object>} - Escala de tiempo actual
   */
  async getCurrentTimeScale() {
    try {
      const timeScaleId = await storageService.get(STORAGE_KEYS.TIME_SCALE);
      
      if (!timeScaleId) {
        return this.defaultTimeScale;
      }
      
      // Si es una escala predefinida
      const predefinedScale = this.availableTimeScales.find(scale => scale.id === timeScaleId);
      
      if (predefinedScale) {
        return predefinedScale;
      }
      
      // Si no es una escala predefinida, intentar cargar una escala personalizada
      const customHeight = await storageService.get(`${STORAGE_KEYS.TIME_SCALE}_${timeScaleId}`);
      
      if (customHeight && Number.isInteger(customHeight) && customHeight > 20 && customHeight <= 200) {
        return {
          ...TIME_SCALES.CUSTOM,
          height: customHeight,
          pixelsPerMinute: customHeight / 60
        };
      }
      
      // Si no se encuentra o no es válida, devolver la escala predeterminada
      return this.defaultTimeScale;
    } catch (error) {
      console.error('Error al obtener la escala de tiempo actual:', error);
      return this.defaultTimeScale;
    }
  }

  /**
   * Establece una nueva escala de tiempo
   * @param {string|Object} timeScale - ID de escala predefinida o objeto de escala personalizada
   * @returns {Promise<boolean>} - true si la escala se estableció correctamente
   */
  async setTimeScale(timeScale) {
    try {
      let timeScaleToSave;
      
      // Si es un ID de escala predefinida
      if (typeof timeScale === 'string') {
        const predefinedScale = this.availableTimeScales.find(scale => scale.id === timeScale);
        
        if (predefinedScale) {
          timeScaleToSave = predefinedScale.id;
        } else {
          console.error(`Escala de tiempo no válida: ${timeScale}`);
          return false;
        }
      } 
      // Si es un objeto de escala personalizada
      else if (typeof timeScale === 'object' && timeScale.height) {
        // Limitar la altura entre 20 y 200 píxeles
        const height = Math.max(20, Math.min(200, timeScale.height));
        
        // Crear ID único para la escala personalizada
        const customId = `custom_${Date.now()}`;
        
        // Guardar la altura personalizada
        await storageService.set(`${STORAGE_KEYS.TIME_SCALE}_${customId}`, height);
        
        timeScaleToSave = customId;
      } else {
        console.error('Formato de escala de tiempo no válido:', timeScale);
        return false;
      }
      
      // Guardar el ID de la escala en el almacenamiento
      const result = await storageService.set(STORAGE_KEYS.TIME_SCALE, timeScaleToSave);
      
      // Publicar evento de cambio de escala
      if (result) {
        eventBus.publish('app.timeScaleChanged', { timeScaleId: timeScaleToSave });
      }
      
      return result;
    } catch (error) {
      console.error('Error al establecer la escala de tiempo:', error);
      return false;
    }
  }

  /**
   * Crea una escala personalizada con una altura específica
   * @param {number} height - Altura en píxeles para la escala personalizada
   * @returns {Promise<boolean>} - true si la escala se creó correctamente
   */
  async createCustomTimeScale(height) {
    try {
      if (!Number.isInteger(height) || height < 20 || height > 200) {
        console.error('Altura de escala no válida. Debe ser un número entero entre 20 y 200 píxeles');
        return false;
      }
      
      const customScale = {
        height,
        pixelsPerMinute: height / 60
      };
      
      return await this.setTimeScale(customScale);
    } catch (error) {
      console.error('Error al crear escala personalizada:', error);
      return false;
    }
  }

  /**
   * Inicializa el servicio de escalas de tiempo
   * @returns {Promise<Object>} - Escala de tiempo actual
   */
  async initialize() {
    try {
      const currentTimeScale = await this.getCurrentTimeScale();
      return currentTimeScale;
    } catch (error) {
      console.error('Error al inicializar el servicio de escalas de tiempo:', error);
      return this.defaultTimeScale;
    }
  }
}

// Exportar una única instancia para toda la aplicación
const timeScaleService = new TimeScaleService();
export default timeScaleService;