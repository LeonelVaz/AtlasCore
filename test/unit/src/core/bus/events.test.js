import {
  EventCategories,
  CalendarEvents,
  AppEvents,
  StorageEvents,
  UIEvents,
  default as Events
} from '../../../../../src/core/bus/events';

describe('Event Definitions', () => {
  test('EventCategories define las categorías correctas', () => {
    // Verificar que todos los valores esperados están presentes
    expect(EventCategories).toEqual({
      CALENDAR: 'calendar',
      APP: 'app',
      STORAGE: 'storage',
      TASK: 'task',
      VIDEO: 'video',
      UI: 'ui'
    });
    
    // Verificar individualmente para diagnóstico más específico
    expect(EventCategories.CALENDAR).toBe('calendar');
    expect(EventCategories.APP).toBe('app');
    expect(EventCategories.STORAGE).toBe('storage');
    expect(EventCategories.TASK).toBe('task');
    expect(EventCategories.VIDEO).toBe('video');
    expect(EventCategories.UI).toBe('ui');
  });

  test('CalendarEvents define los eventos relacionados con el calendario', () => {
    // Verificar que todos los eventos tienen el prefijo correcto
    const prefix = EventCategories.CALENDAR;
    
    // Verificar cada evento individualmente
    expect(CalendarEvents.EVENT_CREATED).toBe(`${prefix}.eventCreated`);
    expect(CalendarEvents.EVENT_UPDATED).toBe(`${prefix}.eventUpdated`);
    expect(CalendarEvents.EVENT_DELETED).toBe(`${prefix}.eventDeleted`);
    expect(CalendarEvents.VIEW_CHANGED).toBe(`${prefix}.viewChanged`);
    expect(CalendarEvents.DATE_CHANGED).toBe(`${prefix}.dateChanged`);
    expect(CalendarEvents.EVENTS_LOADED).toBe(`${prefix}.eventsLoaded`);
    
    // Verificar número total de eventos
    expect(Object.keys(CalendarEvents).length).toBe(6);
  });

  test('AppEvents define los eventos relacionados con la aplicación', () => {
    // Verificar que todos los eventos tienen el prefijo correcto
    const prefix = EventCategories.APP;
    
    // Verificar cada evento individualmente
    expect(AppEvents.INITIALIZED).toBe(`${prefix}.initialized`);
    expect(AppEvents.ERROR).toBe(`${prefix}.error`);
    expect(AppEvents.MODULE_REGISTERED).toBe(`${prefix}.moduleRegistered`);
    expect(AppEvents.MODULE_UNREGISTERED).toBe(`${prefix}.moduleUnregistered`);
    expect(AppEvents.THEME_CHANGED).toBe(`${prefix}.themeChanged`);
    expect(AppEvents.SETTINGS_CHANGED).toBe(`${prefix}.settingsChanged`);
    
    // Verificar número total de eventos
    expect(Object.keys(AppEvents).length).toBe(6);
  });

  test('StorageEvents define los eventos relacionados con el almacenamiento', () => {
    // Verificar que todos los eventos tienen el prefijo correcto
    const prefix = EventCategories.STORAGE;
    
    // Verificar cada evento individualmente
    expect(StorageEvents.DATA_CHANGED).toBe(`${prefix}.dataChanged`);
    expect(StorageEvents.DATA_REMOVED).toBe(`${prefix}.dataRemoved`);
    expect(StorageEvents.DATA_CLEARED).toBe(`${prefix}.dataCleared`);
    expect(StorageEvents.EVENTS_UPDATED).toBe(`${prefix}.eventsUpdated`);
    expect(StorageEvents.BACKUP_CREATED).toBe(`${prefix}.backupCreated`);
    expect(StorageEvents.BACKUP_RESTORED).toBe(`${prefix}.backupRestored`);
    expect(StorageEvents.ERROR).toBe(`${prefix}.error`);
    
    // Verificar número total de eventos
    expect(Object.keys(StorageEvents).length).toBe(7);
  });

  test('UIEvents define los eventos relacionados con la interfaz de usuario', () => {
    // Verificar que todos los eventos tienen el prefijo correcto
    const prefix = EventCategories.UI;
    
    // Verificar cada evento individualmente
    expect(UIEvents.DIALOG_OPENED).toBe(`${prefix}.dialogOpened`);
    expect(UIEvents.DIALOG_CLOSED).toBe(`${prefix}.dialogClosed`);
    expect(UIEvents.NOTIFICATION_SHOWN).toBe(`${prefix}.notificationShown`);
    expect(UIEvents.NOTIFICATION_CLOSED).toBe(`${prefix}.notificationClosed`);
    expect(UIEvents.DRAWER_OPENED).toBe(`${prefix}.drawerOpened`);
    expect(UIEvents.DRAWER_CLOSED).toBe(`${prefix}.drawerClosed`);
    expect(UIEvents.ERROR_DISPLAYED).toBe(`${prefix}.errorDisplayed`);
    
    // Verificar número total de eventos
    expect(Object.keys(UIEvents).length).toBe(7);
  });

  test('La exportación por defecto incluye todos los eventos', () => {
    // Verificar que la exportación por defecto contiene todas las categorías
    expect(Events.Categories).toBe(EventCategories);
    expect(Events.Calendar).toBe(CalendarEvents);
    expect(Events.App).toBe(AppEvents);
    expect(Events.Storage).toBe(StorageEvents);
    expect(Events.UI).toBe(UIEvents);
    
    // Verificar que no hay elementos adicionales
    expect(Object.keys(Events).length).toBe(5);
  });
});