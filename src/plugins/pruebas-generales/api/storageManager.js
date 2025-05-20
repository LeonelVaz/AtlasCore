/**
 * storageManager.js
 * Manejo de almacenamiento persistente para el plugin
 */

import logger from '../utils/logger';
import constants from '../constants';

/**
 * Inicializa el almacenamiento cargando los datos guardados
 * @param {Object} core - Objeto core del sistema
 * @param {Object} plugin - Instancia del plugin
 * @returns {Promise<void>} - Promesa que se resuelve cuando se completa la inicialización
 */
export async function initializeStorage(core, plugin) {
  logger.debug('Inicializando almacenamiento...');
  
  try {
    // Cargar configuración
    const settings = await core.storage.getItem(
      plugin.id, 
      constants.STORAGE_KEYS.SETTINGS, 
      plugin._data.settings
    );
    
    // Cargar datos de demostración
    const demoData = await core.storage.getItem(
      plugin.id, 
      constants.STORAGE_KEYS.DEMO_DATA, 
      plugin._data.demoData
    );
    
    // Actualizar datos del plugin
    plugin._data.settings = settings;
    plugin._data.demoData = demoData;
    
    logger.debug('Datos cargados desde almacenamiento:', { settings, demoData });
  } catch (error) {
    logger.error('Error al cargar datos desde almacenamiento:', error);
    // Continuar con los valores predeterminados
  }
}

/**
 * Guarda los datos actuales del plugin en el almacenamiento
 * @param {Object} core - Objeto core del sistema
 * @param {Object} plugin - Instancia del plugin
 * @returns {Promise<void>} - Promesa que se resuelve cuando se completa el guardado
 */
export async function saveData(core, plugin) {
  logger.debug('Guardando datos en almacenamiento...');
  
  try {
    // Guardar configuración
    await core.storage.setItem(
      plugin.id, 
      constants.STORAGE_KEYS.SETTINGS, 
      plugin._data.settings
    );
    
    // Guardar datos de demostración
    await core.storage.setItem(
      plugin.id, 
      constants.STORAGE_KEYS.DEMO_DATA, 
      plugin._data.demoData
    );
    
    logger.debug('Datos guardados correctamente');
  } catch (error) {
    logger.error('Error al guardar datos en almacenamiento:', error);
  }
}

/**
 * Obtiene los datos almacenados
 * @param {Object} plugin - Instancia del plugin
 * @returns {Object} - Datos almacenados
 */
export function getStoredData(plugin) {
  return {
    settings: { ...plugin._data.settings },
    demoData: { ...plugin._data.demoData }
  };
}

/**
 * Actualiza la configuración del plugin
 * @param {Object} core - Objeto core del sistema
 * @param {Object} plugin - Instancia del plugin
 * @param {Object} newSettings - Nueva configuración
 * @returns {Promise<boolean>} - Éxito/fallo de la actualización
 */
export async function updateSettings(core, plugin, newSettings) {
  try {
    // Guardar configuración anterior para posible rollback
    const oldSettings = { ...plugin._data.settings };
    
    // Actualizar configuración
    plugin._data.settings = {
      ...plugin._data.settings,
      ...newSettings
    };
    
    // Guardar en almacenamiento
    await core.storage.setItem(
      plugin.id, 
      constants.STORAGE_KEYS.SETTINGS, 
      plugin._data.settings
    );
    
    // Verificar si el tema ha cambiado
    if (oldSettings.theme !== plugin._data.settings.theme) {
      // Publicar evento de cambio de tema
      core.events.publish(
        plugin.id,
        constants.CUSTOM_EVENTS.THEME_CHANGED,
        { 
          oldTheme: oldSettings.theme, 
          newTheme: plugin._data.settings.theme 
        }
      );
    }
    
    logger.info('Configuración actualizada:', plugin._data.settings);
    return true;
  } catch (error) {
    logger.error('Error al actualizar configuración:', error);
    return false;
  }
}

/**
 * Incrementa el contador de demostración
 * @param {Object} core - Objeto core del sistema
 * @param {Object} plugin - Instancia del plugin
 * @returns {Promise<number>} - Nuevo valor del contador
 */
export async function incrementCounter(core, plugin) {
  try {
    // Incrementar contador
    plugin._data.demoData.counter++;
    plugin._data.demoData.lastUpdate = Date.now();
    
    // Añadir registro al log
    plugin._data.demoData.eventLog.push({
      time: Date.now(),
      action: 'increment',
      value: plugin._data.demoData.counter
    });
    
    // Mantener log en un tamaño manejable
    if (plugin._data.demoData.eventLog.length > 50) {
      plugin._data.demoData.eventLog = plugin._data.demoData.eventLog.slice(-50);
    }
    
    // Guardar en almacenamiento
    await core.storage.setItem(
      plugin.id, 
      constants.STORAGE_KEYS.DEMO_DATA, 
      plugin._data.demoData
    );
    
    // Publicar evento de actualización
    core.events.publish(
      plugin.id,
      constants.CUSTOM_EVENTS.COUNTER_UPDATED,
      { 
        value: plugin._data.demoData.counter,
        timestamp: plugin._data.demoData.lastUpdate 
      }
    );
    
    return plugin._data.demoData.counter;
  } catch (error) {
    logger.error('Error al incrementar contador:', error);
    throw error;
  }
}

/**
 * Limpia todos los datos del plugin
 * @param {Object} core - Objeto core del sistema
 * @param {Object} plugin - Instancia del plugin
 * @returns {Promise<boolean>} - Éxito/fallo de la limpieza
 */
export async function clearAllData(core, plugin) {
  try {
    // Limpiar datos en el almacenamiento
    await core.storage.clearPluginData(plugin.id);
    
    // Restaurar a valores predeterminados
    plugin._data = {
      settings: {
        theme: 'light',
        showNotifications: true,
        animationsEnabled: true,
        logLevel: 'info'
      },
      demoData: {
        counter: 0,
        lastUpdate: null,
        eventLog: []
      }
    };
    
    logger.info('Todos los datos del plugin han sido limpiados');
    return true;
  } catch (error) {
    logger.error('Error al limpiar datos del plugin:', error);
    return false;
  }
}