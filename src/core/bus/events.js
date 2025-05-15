/**
 * Definición de eventos y categorías para el sistema de bus de eventos
 */

// Categorías principales
export const EventCategories = {
  CALENDAR: 'calendar',
  APP: 'app',
  STORAGE: 'storage',
  TASK: 'task',
  VIDEO: 'video',
  UI: 'ui'
};

// Eventos del calendario
export const CalendarEvents = {
  EVENT_CREATED: `${EventCategories.CALENDAR}.eventCreated`,
  EVENT_UPDATED: `${EventCategories.CALENDAR}.eventUpdated`,
  EVENT_DELETED: `${EventCategories.CALENDAR}.eventDeleted`,
  VIEW_CHANGED: `${EventCategories.CALENDAR}.viewChanged`,
  DATE_CHANGED: `${EventCategories.CALENDAR}.dateChanged`,
  EVENTS_LOADED: `${EventCategories.CALENDAR}.eventsLoaded`
};

// Eventos de la aplicación
export const AppEvents = {
  INITIALIZED: `${EventCategories.APP}.initialized`,
  ERROR: `${EventCategories.APP}.error`,
  MODULE_REGISTERED: `${EventCategories.APP}.moduleRegistered`,
  MODULE_UNREGISTERED: `${EventCategories.APP}.moduleUnregistered`,
  THEME_CHANGED: `${EventCategories.APP}.themeChanged`,
  SETTINGS_CHANGED: `${EventCategories.APP}.settingsChanged`
};

// Eventos de almacenamiento
export const StorageEvents = {
  DATA_CHANGED: `${EventCategories.STORAGE}.dataChanged`,
  DATA_REMOVED: `${EventCategories.STORAGE}.dataRemoved`,
  DATA_CLEARED: `${EventCategories.STORAGE}.dataCleared`,
  EVENTS_UPDATED: `${EventCategories.STORAGE}.eventsUpdated`,
  BACKUP_CREATED: `${EventCategories.STORAGE}.backupCreated`,
  BACKUP_RESTORED: `${EventCategories.STORAGE}.backupRestored`,
  ERROR: `${EventCategories.STORAGE}.error`
};

// Eventos de interfaz de usuario
export const UIEvents = {
  DIALOG_OPENED: `${EventCategories.UI}.dialogOpened`,
  DIALOG_CLOSED: `${EventCategories.UI}.dialogClosed`,
  NOTIFICATION_SHOWN: `${EventCategories.UI}.notificationShown`,
  NOTIFICATION_CLOSED: `${EventCategories.UI}.notificationClosed`,
  DRAWER_OPENED: `${EventCategories.UI}.drawerOpened`,
  DRAWER_CLOSED: `${EventCategories.UI}.drawerClosed`,
  ERROR_DISPLAYED: `${EventCategories.UI}.errorDisplayed`
};

// Exportar todos los eventos
export default {
  Categories: EventCategories,
  Calendar: CalendarEvents,
  App: AppEvents,
  Storage: StorageEvents,
  UI: UIEvents
};