/**
 * Servicio de eventos para el plugin
 */

/**
 * Configura los escuchadores de eventos
 * @param {Object} core - Objeto core de Atlas
 * @param {Object} plugin - Referencia al plugin
 * @returns {Array} Lista de funciones para cancelar las suscripciones
 */
export function setupEventListeners(core, plugin) {
  console.log('[Plugin Tester] Configurando escuchadores de eventos...');
  
  const subscriptions = [];
  
  // Eventos del calendario
  const eventCreatedSub = core.events.subscribe(
    plugin.id,
    'calendar.eventCreated',
    handleCalendarEvent.bind(null, plugin, 'created')
  );
  
  const eventUpdatedSub = core.events.subscribe(
    plugin.id,
    'calendar.eventUpdated',
    handleCalendarEvent.bind(null, plugin, 'updated')
  );
  
  const eventDeletedSub = core.events.subscribe(
    plugin.id,
    'calendar.eventDeleted',
    handleCalendarEvent.bind(null, plugin, 'deleted')
  );
  
  // Eventos de la aplicación
  const appThemeChangedSub = core.events.subscribe(
    plugin.id,
    'app.themeChanged',
    handleAppEvent.bind(null, plugin, 'themeChanged')
  );
  
  const appInitializedSub = core.events.subscribe(
    plugin.id,
    'app.initialized',
    handleAppEvent.bind(null, plugin, 'initialized')
  );
  
  // Añadir suscripciones a la lista para limpiarlas luego
  subscriptions.push(
    eventCreatedSub,
    eventUpdatedSub,
    eventDeletedSub,
    appThemeChangedSub,
    appInitializedSub
  );
  
  // Publicar un evento propio para pruebas
  core.events.publish(
    plugin.id,
    'pluginTester.initialized',
    { timestamp: Date.now() }
  );
  
  console.log('[Plugin Tester] Escuchadores de eventos configurados.');
  
  return subscriptions;
}

/**
 * Cancela todas las suscripciones a eventos
 * @param {Object} core - Objeto core de Atlas
 * @param {string} pluginId - ID del plugin
 * @param {Array} subscriptions - Lista de funciones para cancelar suscripciones
 */
export function unsubscribeFromEvents(core, pluginId, subscriptions) {
  console.log('[Plugin Tester] Cancelando suscripciones a eventos...');
  
  // Cancelar todas las suscripciones individualmente
  subscriptions.forEach(unsub => {
    if (typeof unsub === 'function') {
      unsub();
    }
  });
  
  // O usar el método del core para cancelar todas
  core.events.unsubscribeAll(pluginId);
  
  console.log('[Plugin Tester] Suscripciones a eventos canceladas.');
}

/**
 * Maneja eventos del calendario
 * @param {Object} plugin - Referencia al plugin
 * @param {string} tipo - Tipo de evento (created, updated, deleted)
 * @param {Object} datos - Datos del evento
 */
function handleCalendarEvent(plugin, tipo, datos) {
  console.log(`[Plugin Tester] Evento de calendario ${tipo} recibido:`, datos);
  
  // Registrar evento
  plugin._data.registroEventos.push({
    tipo: `calendar.event${tipo[0].toUpperCase() + tipo.slice(1)}`,
    timestamp: Date.now(),
    datos: datos
  });
  
  // Limitar el registro a los últimos 100 eventos
  if (plugin._data.registroEventos.length > 100) {
    plugin._data.registroEventos = plugin._data.registroEventos.slice(-100);
  }
  
  // Guardar datos
  saveData(plugin);
}

/**
 * Maneja eventos de la aplicación
 * @param {Object} plugin - Referencia al plugin
 * @param {string} tipo - Tipo de evento
 * @param {Object} datos - Datos del evento
 */
function handleAppEvent(plugin, tipo, datos) {
  console.log(`[Plugin Tester] Evento de aplicación ${tipo} recibido:`, datos);
  
  // Registrar evento
  plugin._data.registroEventos.push({
    tipo: `app.${tipo}`,
    timestamp: Date.now(),
    datos: datos
  });
  
  // Limitar el registro a los últimos 100 eventos
  if (plugin._data.registroEventos.length > 100) {
    plugin._data.registroEventos = plugin._data.registroEventos.slice(-100);
  }
  
  // Guardar datos
  saveData(plugin);
}

/**
 * Helper para guardar datos tras manejar eventos
 * @param {Object} plugin - Referencia al plugin
 */
function saveData(plugin) {
  plugin._core.storage.setItem(
    plugin.id,
    'plugin-data',
    plugin._data
  ).catch(error => {
    console.error('[Plugin Tester] Error al guardar datos después de evento:', error);
  });
}