/**
 * eventManager.js
 * Gestión de eventos del sistema y eventos personalizados
 */

import logger from '../utils/logger';
import constants from '../constants';

/**
 * Colección de suscripciones activas
 * @type {Array<Function>}
 */
let activeSubscriptions = [];

/**
 * Configura las suscripciones a eventos del sistema
 * @param {Object} core - Objeto core del sistema
 * @param {Object} plugin - Instancia del plugin
 */
export function setupEventSubscriptions(core, plugin) {
  logger.debug('Configurando suscripciones a eventos...');
  
  // Suscribirse a cambios en el calendario
  activeSubscriptions.push(
    core.events.subscribe(
      plugin.id,
      'calendar.eventCreated',
      data => handleCalendarEvent(core, plugin, 'created', data)
    )
  );
  
  activeSubscriptions.push(
    core.events.subscribe(
      plugin.id,
      'calendar.eventUpdated',
      data => handleCalendarEvent(core, plugin, 'updated', data)
    )
  );
  
  activeSubscriptions.push(
    core.events.subscribe(
      plugin.id,
      'calendar.eventDeleted',
      data => handleCalendarEvent(core, plugin, 'deleted', data)
    )
  );
  
  // Suscribirse a cambios de tema en la aplicación
  activeSubscriptions.push(
    core.events.subscribe(
      plugin.id,
      'app.themeChanged',
      data => handleAppThemeChanged(core, plugin, data)
    )
  );
  
  // Suscribirse a eventos propios
  activeSubscriptions.push(
    core.events.subscribe(
      plugin.id,
      constants.CUSTOM_EVENTS.COUNTER_UPDATED,
      data => handleCounterUpdated(core, plugin, data)
    )
  );
  
  logger.debug(`Configuradas ${activeSubscriptions.length} suscripciones a eventos`);
}

/**
 * Limpia todas las suscripciones a eventos
 * @param {Object} core - Objeto core del sistema
 * @param {Object} plugin - Instancia del plugin
 */
export function cleanupEventSubscriptions(core, plugin) {
  logger.debug(`Cancelando ${activeSubscriptions.length} suscripciones a eventos...`);
  
  // Cancelar todas las suscripciones individuales
  activeSubscriptions.forEach(unsub => {
    if (typeof unsub === 'function') {
      try {
        unsub();
      } catch (error) {
        logger.warn('Error al cancelar suscripción:', error);
      }
    }
  });
  
  // Limpiar array de suscripciones
  activeSubscriptions = [];
  
  // O usar unsubscribeAll para limpiar todas las suscripciones de una vez
  try {
    core.events.unsubscribeAll(plugin.id);
  } catch (error) {
    logger.warn('Error al cancelar todas las suscripciones:', error);
  }
  
  logger.debug('Suscripciones a eventos canceladas');
}

/**
 * Manejador para eventos del calendario
 * @param {Object} core - Objeto core del sistema
 * @param {Object} plugin - Instancia del plugin
 * @param {string} action - Acción (created, updated, deleted)
 * @param {Object} data - Datos del evento
 */
function handleCalendarEvent(core, plugin, action, data) {
  if (!data || !data.event) return;
  
  logger.debug(`Evento de calendario ${action}:`, data.event.title || 'Sin título');
  
  // Añadir al registro de eventos
  plugin._data.demoData.eventLog.push({
    time: Date.now(),
    action: `calendar.${action}`,
    event: {
      id: data.event.id,
      title: data.event.title || 'Sin título',
      start: data.event.start
    }
  });
  
  // Mantener log en un tamaño manejable
  if (plugin._data.demoData.eventLog.length > 50) {
    plugin._data.demoData.eventLog = plugin._data.demoData.eventLog.slice(-50);
  }
  
  // Si las notificaciones están habilitadas, mostrar notificación
  if (plugin._data.settings.showNotifications) {
    const actions = {
      created: 'creado',
      updated: 'actualizado',
      deleted: 'eliminado'
    };
    
    // Publicar evento de log
    core.events.publish(
      plugin.id,
      constants.CUSTOM_EVENTS.LOG_ENTRY,
      {
        type: 'calendar',
        action: action,
        data: {
          title: data.event.title || 'Sin título',
          time: new Date().toLocaleTimeString()
        }
      }
    );
  }
}

/**
 * Manejador para cambios de tema en la aplicación
 * @param {Object} core - Objeto core del sistema
 * @param {Object} plugin - Instancia del plugin
 * @param {Object} data - Datos del cambio de tema
 */
function handleAppThemeChanged(core, plugin, data) {
  logger.debug('Tema de aplicación cambiado:', data);
  
  // Actualizar el tema en la configuración del plugin
  if (data && data.theme) {
    // Mapear el tema de la aplicación a nuestro formato
    let pluginTheme = 'light';
    if (data.theme.includes('dark')) {
      pluginTheme = 'dark';
    } else if (data.theme.includes('contrast')) {
      pluginTheme = 'high-contrast';
    }
    
    // Actualizar si es diferente
    if (plugin._data.settings.theme !== pluginTheme) {
      plugin._data.settings.theme = pluginTheme;
      
      // Guardar cambio en el almacenamiento
      core.storage.setItem(
        plugin.id, 
        constants.STORAGE_KEYS.SETTINGS, 
        plugin._data.settings
      ).catch(error => {
        logger.warn('Error al guardar cambio de tema:', error);
      });
      
      // Publicar nuestro propio evento de cambio de tema
      core.events.publish(
        plugin.id,
        constants.CUSTOM_EVENTS.THEME_CHANGED,
        { newTheme: pluginTheme }
      );
    }
  }
}

/**
 * Manejador para actualizaciones del contador
 * @param {Object} core - Objeto core del sistema
 * @param {Object} plugin - Instancia del plugin
 * @param {Object} data - Datos de la actualización
 */
function handleCounterUpdated(core, plugin, data) {
  logger.debug('Contador actualizado:', data);
  
  // Si las notificaciones están habilitadas, mostrar notificación
  if (plugin._data.settings.showNotifications) {
    // Publicar evento de log
    core.events.publish(
      plugin.id,
      constants.CUSTOM_EVENTS.LOG_ENTRY,
      {
        type: 'counter',
        action: 'updated',
        data: {
          value: data.value,
          time: new Date().toLocaleTimeString()
        }
      }
    );
  }
}

/**
 * Publica un evento de demostración
 * @param {Object} core - Objeto core del sistema
 * @param {Object} plugin - Instancia del plugin
 * @param {string} demoId - ID de la demostración
 * @param {string} action - Acción (started, completed, etc.)
 * @param {Object} data - Datos adicionales
 */
export function publishDemoEvent(core, plugin, demoId, action, data = {}) {
  if (!core || !plugin) return;
  
  // Evento a publicar
  let eventName;
  if (action === 'started') {
    eventName = constants.CUSTOM_EVENTS.DEMO_STARTED;
  } else if (action === 'completed') {
    eventName = constants.CUSTOM_EVENTS.DEMO_COMPLETED;
  } else {
    eventName = `pruebas-generales.demo.${action}`;
  }
  
  // Publicar evento
  core.events.publish(
    plugin.id,
    eventName,
    {
      demoId,
      action,
      timestamp: Date.now(),
      ...data
    }
  );
  
  logger.debug(`Publicado evento ${eventName} para demo ${demoId}`);
}

/**
 * Crea y gestiona un canal de comunicación
 * @param {Object} core - Objeto core del sistema
 * @param {Object} plugin - Instancia del plugin
 * @param {string} channelName - Nombre del canal
 * @returns {Object} - Canal de comunicación
 */
export function createCommunicationChannel(core, plugin, channelName) {
  if (!core || !plugin) return null;
  
  logger.debug(`Creando canal de comunicación: ${channelName}`);
  
  try {
    // Crear canal con opciones
    const channel = core.plugins.createChannel(
      channelName,
      plugin.id,
      {
        allowAnyPublisher: true,       // Cualquiera puede publicar
        sendHistoryOnSubscribe: true,  // Enviar historial al suscribirse
        maxMessages: 50                // Limitar historial
      }
    );
    
    return channel;
  } catch (error) {
    logger.error(`Error al crear canal ${channelName}:`, error);
    return null;
  }
}