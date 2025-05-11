// test/unit/debug-utils.test.js
import { setupDebugTools } from '../../src/utils/debug-utils';

describe('Debug Utils', () => {
  // Variables para guardar referencia a window.debugAtlas
  let originalDebugAtlas;
  
  // Guardar la referencia original a window.debugAtlas antes de las pruebas
  beforeAll(() => {
    originalDebugAtlas = window.debugAtlas;
  });
  
  // Restaurar window.debugAtlas después de cada prueba
  afterEach(() => {
    window.debugAtlas = originalDebugAtlas;
  });
  
  // Restaurar window.debugAtlas después de todas las pruebas
  afterAll(() => {
    window.debugAtlas = originalDebugAtlas;
  });

  test('setupDebugTools registra las herramientas de depuración en window.debugAtlas', () => {
    // Mock de eventos y funciones
    const mockEvents = [
      { id: 'event-1', title: 'Evento 1', start: '2025-05-10T10:00:00', end: '2025-05-10T11:00:00' }
    ];
    
    const mockCreateEvent = jest.fn(event => ({ ...event, id: 'new-id' }));
    const mockUpdateEvent = jest.fn((id, event) => ({ ...event }));
    const mockSaveEvents = jest.fn();
    
    // Ejecutar la función setupDebugTools
    const cleanupFn = setupDebugTools(mockEvents, mockCreateEvent, mockUpdateEvent, mockSaveEvents);
    
    // Verificar que window.debugAtlas existe
    expect(window.debugAtlas).toBeDefined();
    
    // Verificar métodos disponibles
    expect(typeof window.debugAtlas.getEvents).toBe('function');
    expect(typeof window.debugAtlas.createTestEvent).toBe('function');
    expect(typeof window.debugAtlas.forceUpdate).toBe('function');
    expect(typeof window.debugAtlas.saveAllEvents).toBe('function');
    
    // Probar la función getEvents
    const retrievedEvents = window.debugAtlas.getEvents();
    expect(retrievedEvents).toBe(mockEvents);
    
    // Probar la función createTestEvent
    // Espiar console.log
    const originalConsoleLog = console.log;
    console.log = jest.fn();
    
    const newEvent = window.debugAtlas.createTestEvent();
    
    expect(mockCreateEvent).toHaveBeenCalled();
    expect(newEvent).toEqual({ ...newEvent, id: 'new-id' });
    expect(console.log).toHaveBeenCalledWith('Evento de prueba creado:', newEvent);
    
    // Restaurar console.log
    console.log = originalConsoleLog;
    
    // Probar la función forceUpdate
    console.log = jest.fn();
    
    // Configurar los eventos simulados para incluir el que actualizaremos
    mockEvents[0] = { id: 'event-1', title: 'Evento 1', start: '2025-05-10T10:00:00', end: '2025-05-10T11:00:00' };
    
    const updatedEvent = window.debugAtlas.forceUpdate('event-1', 2);
    
    expect(mockUpdateEvent).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Actualización forzada:', updatedEvent);
    
    // Restaurar console.log
    console.log = originalConsoleLog;
    
    // Probar la función saveAllEvents
    console.log = jest.fn();
    
    window.debugAtlas.saveAllEvents();
    
    expect(mockSaveEvents).toHaveBeenCalledWith(mockEvents);
    expect(console.log).toHaveBeenCalledWith('Eventos guardados manualmente');
    
    // Restaurar console.log
    console.log = originalConsoleLog;
    
    // Verificar la función de limpieza
    cleanupFn();
    expect(window.debugAtlas).toBeUndefined();
  });

  test('forceUpdate maneja el caso cuando el evento no se encuentra', () => {
    // Mock de eventos y funciones
    const mockEvents = [
      { id: 'event-1', title: 'Evento 1', start: '2025-05-10T10:00:00', end: '2025-05-10T11:00:00' }
    ];
    
    const mockCreateEvent = jest.fn();
    const mockUpdateEvent = jest.fn();
    const mockSaveEvents = jest.fn();
    
    // Espiar console.error
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Ejecutar la función setupDebugTools
    const cleanupFn = setupDebugTools(mockEvents, mockCreateEvent, mockUpdateEvent, mockSaveEvents);
    
    // Intentar actualizar un evento que no existe
    const result = window.debugAtlas.forceUpdate('non-existent-id', 1);
    
    // Verificar que se manejó correctamente
    expect(result).toBeNull();
    expect(console.error).toHaveBeenCalledWith('Evento no encontrado:', 'non-existent-id');
    
    // Restaurar console.error
    console.error = originalConsoleError;
    
    // Limpiar
    cleanupFn();
  });

  test('createTestEvent crea un evento con la hora actual correctamente', () => {
    // Mock de eventos y funciones
    const mockEvents = [];
    const mockCreateEvent = jest.fn(event => ({ ...event, id: 'new-id' }));
    const mockUpdateEvent = jest.fn();
    const mockSaveEvents = jest.fn();
    
    // Mock para Date para tener una fecha consistente
    const mockDate = new Date('2025-05-10T12:00:00');
    const originalDate = global.Date;
    
    global.Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          return new originalDate(mockDate);
        }
        return new originalDate(...args);
      }
      static now() {
        return mockDate.getTime();
      }
    };
    
    // Ejecutar la función setupDebugTools
    const cleanupFn = setupDebugTools(mockEvents, mockCreateEvent, mockUpdateEvent, mockSaveEvents);
    
    // Crear un evento de prueba
    window.debugAtlas.createTestEvent();
    
    // Verificar que se llamó a createEvent con un objeto que contiene las propiedades correctas
    expect(mockCreateEvent).toHaveBeenCalled();
    const createdEvent = mockCreateEvent.mock.calls[0][0];
    
    // Verificar las propiedades básicas
    expect(createdEvent.title).toContain('Evento de prueba');
    expect(createdEvent.color).toBe('#FF5722');
    
    // Verificar fechas (start debe ser 1 hora en el futuro desde mockDate)
    const startDate = new Date(createdEvent.start);
    expect(startDate.getHours()).toBe(13); // 12 + 1
    
    // end debe ser 1 hora después de start
    const endDate = new Date(createdEvent.end);
    expect(endDate.getHours()).toBe(14); // 13 + 1
    
    // Limpiar
    cleanupFn();
    global.Date = originalDate;
  });

  test('setupDebugTools devuelve una función para limpiar', () => {
    // Mock de eventos y funciones
    const mockEvents = [];
    const mockCreateEvent = jest.fn();
    const mockUpdateEvent = jest.fn();
    const mockSaveEvents = jest.fn();
    
    // Ejecutar la función setupDebugTools
    const cleanupFn = setupDebugTools(mockEvents, mockCreateEvent, mockUpdateEvent, mockSaveEvents);
    
    // Verificar que window.debugAtlas se creó
    expect(window.debugAtlas).toBeDefined();
    
    // Llamar a la función de limpieza
    cleanupFn();
    
    // Verificar que window.debugAtlas se eliminó
    expect(window.debugAtlas).toBeUndefined();
  });

  test('setupDebugTools funciona cuando window no está definido', () => {
    // Guardar el window original
    const originalWindow = global.window;
    
    // Eliminar window para simular un entorno sin window
    delete global.window;
    
    // Mock de eventos y funciones
    const mockEvents = [];
    const mockCreateEvent = jest.fn();
    const mockUpdateEvent = jest.fn();
    const mockSaveEvents = jest.fn();
    
    // Ejecutar la función setupDebugTools
    const cleanupFn = setupDebugTools(mockEvents, mockCreateEvent, mockUpdateEvent, mockSaveEvents);
    
    // No debería fallar, pero no hará nada
    expect(cleanupFn).toBeDefined();
    
    // Llamar a la función de limpieza (que no hará nada)
    cleanupFn();
    
    // Restaurar window
    global.window = originalWindow;
  });
});