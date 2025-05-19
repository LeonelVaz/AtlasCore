/**
 * Constantes utilizadas en el plugin
 */

// Identificador del plugin
export const PLUGIN_ID = 'atlas-plugin-tester';

// Nombre del plugin
export const PLUGIN_NAME = 'Plugin Tester';

// Configuración por defecto
export const DEFAULT_SETTINGS = {
  // Color del tema
  colorTema: '#3498db',
  
  // Mostrar notificaciones
  mostrarNotificaciones: true,
  
  // Intervalo de actualización en segundos
  intervaloActualizacion: 30
};

// Tipos de eventos del plugin
export const EVENT_TYPES = {
  INITIALIZED: 'pluginTester.initialized',
  ACTUALIZACION_PERIODICA: 'pluginTester.actualizacionPeriodica',
  EVENTO_MANUAL: 'pluginTester.eventoManual',
  TEST_EVENT: 'pluginTester.testEvent'
};

// Claves de almacenamiento
export const STORAGE_KEYS = {
  PLUGIN_DATA: 'plugin-data',
  TEST_KEY: 'test-key'
};

// IDs de páginas
export const PAGE_IDS = {
  MAIN: 'plugin-tester'
};