// src/contexts/time-scale-context.jsx
import React, { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import timeScaleService from '../services/time-scale-service';
import { TIME_SCALES } from '../core/config/constants';
import eventBus from '../core/bus/event-bus';

// Crear el contexto
export const TimeScaleContext = createContext();

/**
 * Proveedor de contexto para la escala de tiempo
 * @param {Object} props - Propiedades del componente
 */
export const TimeScaleProvider = ({ children }) => {
  // Estado para la escala de tiempo actual
  const [currentTimeScale, setCurrentTimeScale] = useState(TIME_SCALES.STANDARD);
  // Estado para las escalas disponibles
  const [availableTimeScales, setAvailableTimeScales] = useState([]);
  // Estado de carga
  const [loading, setLoading] = useState(true);

  // Cargar escala al inicio
  useEffect(() => {
    const initializeTimeScale = async () => {
      try {
        // Inicializar el servicio de escalas de tiempo
        const timeScale = await timeScaleService.initialize();
        setCurrentTimeScale(timeScale);
        
        // Obtener las escalas disponibles
        const scales = timeScaleService.getAvailableTimeScales();
        setAvailableTimeScales(scales);
      } catch (error) {
        console.error('Error al inicializar la escala de tiempo:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeTimeScale();
    
    // Suscribirse a cambios de escala
    const unsubscribe = eventBus.subscribe('app.timeScaleChanged', async () => {
      const timeScale = await timeScaleService.getCurrentTimeScale();
      setCurrentTimeScale(timeScale);
    });
    
    return () => {
      unsubscribe && unsubscribe();
    };
  }, []);

  // Función para cambiar la escala de tiempo
  const changeTimeScale = async (timeScale) => {
    try {
      const success = await timeScaleService.setTimeScale(timeScale);
      if (success) {
        const updatedTimeScale = await timeScaleService.getCurrentTimeScale();
        setCurrentTimeScale(updatedTimeScale);
      }
      return success;
    } catch (error) {
      console.error('Error al cambiar la escala de tiempo:', error);
      return false;
    }
  };
  
  // Función para crear una escala personalizada
  const createCustomTimeScale = async (height) => {
    try {
      const success = await timeScaleService.createCustomTimeScale(height);
      if (success) {
        const updatedTimeScale = await timeScaleService.getCurrentTimeScale();
        setCurrentTimeScale(updatedTimeScale);
      }
      return success;
    } catch (error) {
      console.error('Error al crear escala personalizada:', error);
      return false;
    }
  };

  // Valor del contexto
  const value = {
    currentTimeScale,
    availableTimeScales,
    changeTimeScale,
    createCustomTimeScale,
    loading
  };

  return (
    <TimeScaleContext.Provider value={value}>
      {children}
    </TimeScaleContext.Provider>
  );
};

TimeScaleProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default TimeScaleProvider;