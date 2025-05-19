// hay un problema con el loadData

/**
* Archivo principal del Plugin Tester para Atlas
* Este archivo exporta el objeto principal del plugin y coordina los diferentes componentes
*/

// Importaciones de componentes UI
import { SidebarWidget } from './components/SidebarWidget';
import { CalendarCellExtension } from './components/CalendarCellExtension';
import { EventDetailExtension } from './components/EventDetailExtension';
import { EventFormExtension } from './components/EventFormExtension';
import { NavigationItem } from './components/NavigationItem';
import { DashboardPage } from './components/DashboardPage';
import { SettingsPanel } from './components/SettingsPanel';

// Importaciones de servicios
import { initStorage, loadData, saveData } from './services/storage';
import { setupEventListeners, unsubscribeFromEvents } from './services/events';
import { createPublicAPI } from './services/api';

// Importaciones de utilidades
import { PLUGIN_ID, PLUGIN_NAME, DEFAULT_SETTINGS } from './utils/constants';

// Importación del archivo CSS (esto requiere un loader específico en webpack/rollup)
import './styles/plugin-tester.css';

// Definición del plugin
export default {
// ===== Metadatos del plugin =====
id: PLUGIN_ID,
name: PLUGIN_NAME,
version: '1.0.0',
description: 'Plugin de prueba que utiliza todas las funcionalidades disponibles en Atlas',
author: 'Desarrollador Atlas',
minAppVersion: '0.3.0',
maxAppVersion: '1.0.0',
priority: 50,
core: false,

// ===== Dependencias y conflictos =====
dependencies: [],
conflicts: [],

// ===== Permisos requeridos =====
permissions: [
  'storage',
  'events',
  'ui',
  'network',
  'notifications',
  'communication'
],

// ===== Variables internas =====
_core: null,
_data: {
  contador: 0,
  configuracion: { ...DEFAULT_SETTINGS },
  registroEventos: []
},
_timerId: null,
_subscriptions: [],
_extensionIds: {},

// ===== API pública =====
publicAPI: null,

// ===== Método de inicialización =====
init: async function(core) {
  try {
    console.log('[Plugin Tester] Iniciando inicialización...');
    this._core = core;
    
    // Inicializar almacenamiento
    initStorage(core);
    
    // Cargar datos almacenados (esperar a que termine la carga)
    await this._loadData();
    
    // Incrementar contador de inicializaciones
    this._data.contador++;
    await saveData(core, this.id, this._data);
    
    // Inicializar y registrar API pública
    this.publicAPI = createPublicAPI(this);
    core.plugins.registerAPI(this.id, this.publicAPI);
    
    // Configurar escuchadores de eventos
    this._subscriptions = setupEventListeners(core, this);
    
    // Registrar extensiones UI
    this._registerUIExtensions();
    
    // Configurar temporizador periódico
    this._configurarActualizacionPeriodica();
    
    console.log('[Plugin Tester] Inicialización completada con éxito.');
    return true;
  } catch (error) {
    console.error('[Plugin Tester] Error durante la inicialización:', error);
    return false;
  }
},

// ===== Método de limpieza =====
cleanup: function() {
  try {
    console.log('[Plugin Tester] Iniciando limpieza...');
    
    // Guardar datos
    saveData(this._core, this.id, this._data);
    
    // Detener temporizador
    if (this._timerId) {
      clearInterval(this._timerId);
      this._timerId = null;
    }
    
    // Cancelar suscripciones a eventos
    unsubscribeFromEvents(this._core, this.id, this._subscriptions);
    
    console.log('[Plugin Tester] Limpieza completada con éxito.');
    return true;
  } catch (error) {
    console.error('[Plugin Tester] Error durante la limpieza:', error);
    return false;
  }
},

// ===== Registro de extensiones UI =====
_registerUIExtensions: function() {
  console.log('[Plugin Tester] Registrando extensiones de UI...');
  
  // 1. Registrar componente de barra lateral
  this._extensionIds.sidebar = this._core.ui.registerExtension(
    this.id,
    this._core.ui.getExtensionZones().CALENDAR_SIDEBAR,
    SidebarWidget,
    { 
      order: 100,
      props: { plugin: this }
    }
  );
  
  // 2. Registrar extensión para celdas del calendario
  this._extensionIds.calendarCell = this._core.ui.registerExtension(
    this.id,
    this._core.ui.getExtensionZones().CALENDAR_DAY_CELL,
    CalendarCellExtension,
    { 
      order: 100,
      props: { plugin: this }
    }
  );
  
  // 3. Registrar extensión para detalles de eventos
  this._extensionIds.eventDetail = this._core.ui.registerExtension(
    this.id,
    this._core.ui.getExtensionZones().EVENT_DETAIL_VIEW,
    EventDetailExtension,
    { 
      order: 100,
      props: { plugin: this }
    }
  );
  
  // 4. Registrar extensión para formulario de eventos
  this._extensionIds.eventForm = this._core.ui.registerExtension(
    this.id,
    this._core.ui.getExtensionZones().EVENT_FORM,
    EventFormExtension,
    { 
      order: 100,
      props: { plugin: this }
    }
  );
  
  // 5. Registrar componente de navegación
  this._extensionIds.navigation = this._core.ui.registerExtension(
    this.id,
    this._core.ui.getExtensionZones().MAIN_NAVIGATION,
    NavigationItem,
    { 
      order: 100,
      props: { plugin: this }
    }
  );
  
  // 6. Registrar página completa
  this._extensionIds.page = this._core.ui.registerExtension(
    this.id,
    this._core.ui.getExtensionZones().PLUGIN_PAGES,
    DashboardPage,
    {
      order: 100,
      props: { 
        pageId: 'plugin-tester',
        plugin: this
      }
    }
  );
  
  // 7. Registrar panel de configuración
  this._extensionIds.settings = this._core.ui.registerExtension(
    this.id,
    this._core.ui.getExtensionZones().SETTINGS_PANEL,
    SettingsPanel,
    { 
      order: 100,
      props: { plugin: this }
    }
  );
  
  console.log('[Plugin Tester] Extensiones de UI registradas con éxito.');
},

// ===== Temporizador periódico =====
_configurarActualizacionPeriodica: function() {
  console.log('[Plugin Tester] Configurando actualización periódica...');
  
  // Asegurar que la configuración existe antes de usarla
  if (!this._data || !this._data.configuracion || !this._data.configuracion.intervaloActualizacion) {
    console.log('[Plugin Tester] Usando intervalo por defecto de 30 segundos');
    this._data.configuracion = this._data.configuracion || {};
    this._data.configuracion.intervaloActualizacion = 30;
  }

  // Convertir segundos a milisegundos
  const intervalo = this._data.configuracion.intervaloActualizacion * 1000;
  
  // Configurar temporizador
  this._timerId = setInterval(() => {
    console.log('[Plugin Tester] Ejecutando actualización periódica...');
    
    // Publicar evento de actualización
    this._core.events.publish(
      this.id,
      'pluginTester.actualizacionPeriodica',
      {
        timestamp: Date.now(),
        contador: this._data.contador
      }
    );
    
  }, intervalo);
  
  console.log(`[Plugin Tester] Actualización periódica configurada cada ${intervalo}ms.`);
}
};