import eventBus, { EventCategories } from '../../../../../src/core/bus/event-bus';
// Importamos Events para asegurar que la re-exportación es cubierta, aunque no la usemos directamente en estos tests
import Events, { CalendarEvents, AppEvents, StorageEvents, UIEvents } from '../../../../../src/core/bus/events';


describe('EventBus', () => {
  let consoleErrorSpy;
  let consoleLogSpy;

  beforeEach(() => {
    // Espiar console.error y console.log antes de cada test
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  // Limpiar suscripciones y restaurar spies después de cada test para evitar efectos secundarios
  afterEach(() => {
    eventBus.clear(); // Usar el método clear para asegurar que se testea también
    eventBus.lastId = 0;
    eventBus.setDebugMode(false); // Reset debug mode
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  test('EventBus puede suscribirse a eventos y devuelve una función para cancelar suscripción', () => {
    const mockCallback = jest.fn();
    const eventType = 'test.event';
    
    const unsubscribe = eventBus.subscribe(eventType, mockCallback);
    
    expect(typeof unsubscribe).toBe('function');
    expect(eventBus.subscribers[eventType]).toBeDefined();
    expect(Object.keys(eventBus.subscribers[eventType]).length).toBe(1);
    
    unsubscribe();
    expect(eventBus.subscribers[eventType]).toBeUndefined();
  });

  test('La función de desuscripción no falla si se llama múltiples veces o si el evento/callback ya no existe', () => {
    const mockCallback = jest.fn();
    const eventType = 'test.unsubscribe.multiple';
    const unsubscribe = eventBus.subscribe(eventType, mockCallback);

    unsubscribe(); // Primera llamada, funciona
    expect(eventBus.subscribers[eventType]).toBeUndefined();
    
    expect(() => unsubscribe()).not.toThrow(); // Segunda llamada, no debe fallar

    // Intentar desuscribir un callback que no estaba (o ya fue removido) en un evento que ya no existe
    const anotherCallback = jest.fn();
    expect(() => eventBus.unsubscribe(eventType, anotherCallback)).not.toThrow();
  });


  test('EventBus publica eventos y notifica a todos los suscriptores', () => {
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();
    const eventType = 'test.notification';
    const eventData = { message: 'Hello World' };
    
    eventBus.subscribe(eventType, mockCallback1);
    eventBus.subscribe(eventType, mockCallback2);
    
    eventBus.publish(eventType, eventData);
    
    expect(mockCallback1).toHaveBeenCalledWith(eventData);
    expect(mockCallback2).toHaveBeenCalledWith(eventData);
  });

  describe('unsubscribe', () => {
    test('no debe fallar si se intenta desuscribir con eventType nulo o undefined', () => {
      const mockCallback = jest.fn();
      eventBus.subscribe('event.exists', mockCallback);
      expect(() => eventBus.unsubscribe(null, mockCallback)).not.toThrow();
      expect(() => eventBus.unsubscribe(undefined, mockCallback)).not.toThrow();
      expect(eventBus.getSubscriberCount('event.exists')).toBe(1); // No debe haber afectado
    });

    test('no debe fallar si se intenta desuscribir con callback nulo o undefined', () => {
      const eventType = 'event.for.null.callback';
      eventBus.subscribe(eventType, jest.fn());
      expect(() => eventBus.unsubscribe(eventType, null)).not.toThrow();
      expect(() => eventBus.unsubscribe(eventType, undefined)).not.toThrow();
      expect(eventBus.getSubscriberCount(eventType)).toBe(1); // No debe haber afectado
    });

    test('no debe fallar si se intenta desuscribir de un eventType que no tiene suscriptores', () => {
      const mockCallback = jest.fn();
      expect(() => eventBus.unsubscribe('non.existent.event', mockCallback)).not.toThrow();
    });

    test('no debe fallar si se intenta desuscribir un callback no registrado para un eventType existente', () => {
      const subscribedCallback = jest.fn();
      const notSubscribedCallback = jest.fn();
      const eventType = 'event.with.subscriber';
      
      eventBus.subscribe(eventType, subscribedCallback);
      expect(() => eventBus.unsubscribe(eventType, notSubscribedCallback)).not.toThrow();
      expect(eventBus.getSubscriberCount(eventType)).toBe(1); // El suscrito debe seguir ahí
    });

    test('debe eliminar un callback específico sin afectar a otros para el mismo evento', () => {
      const cb1 = jest.fn();
      const cb2 = jest.fn();
      const eventType = 'event.multiple.callbacks';
      eventBus.subscribe(eventType, cb1);
      const unsubscribeCb2 = eventBus.subscribe(eventType, cb2);

      expect(eventBus.getSubscriberCount(eventType)).toBe(2);
      eventBus.unsubscribe(eventType, cb1); // Usando el método unsubscribe directo
      expect(eventBus.getSubscriberCount(eventType)).toBe(1);
      
      eventBus.publish(eventType, 'test');
      expect(cb1).not.toHaveBeenCalled();
      expect(cb2).toHaveBeenCalledWith('test');

      unsubscribeCb2(); // Usando la función de retorno
      expect(eventBus.getSubscriberCount(eventType)).toBe(0);
    });
  });

  describe('publish', () => {
    test('no debe fallar ni publicar si eventType es nulo o undefined', () => {
      const mockCallback = jest.fn();
      eventBus.subscribe('real.event', mockCallback);
      
      expect(() => eventBus.publish(null, { data: 'test' })).not.toThrow();
      expect(() => eventBus.publish(undefined, { data: 'test' })).not.toThrow();
      expect(mockCallback).not.toHaveBeenCalled();
    });

    test('loguea mensajes cuando debugEnabled es true y hay/no hay suscriptores', () => {
      const eventType = 'debug.event';
      const eventData = { info: 'debug data' };
      const mockCallback = jest.fn();

      eventBus.setDebugMode(true);

      // Caso 1: Publicar sin suscriptores
      eventBus.publish(eventType, eventData);
      expect(consoleLogSpy).toHaveBeenCalledWith(`[EventBus] Publicando evento: ${eventType}`, eventData);
      expect(consoleLogSpy).toHaveBeenCalledWith(`[EventBus] No hay suscriptores para: ${eventType}`);
      
      consoleLogSpy.mockClear(); // Limpiar para la siguiente aserción

      // Caso 2: Publicar con suscriptores
      eventBus.subscribe(eventType, mockCallback);
      eventBus.publish(eventType, eventData);
      expect(consoleLogSpy).toHaveBeenCalledWith(`[EventBus] Publicando evento: ${eventType}`, eventData);
      expect(consoleLogSpy).toHaveBeenCalledWith(`[EventBus] Notificando a 1 suscriptores de ${eventType}`);
      expect(mockCallback).toHaveBeenCalledWith(eventData);
    });
  });

  test('EventBus maneja errores en los callbacks de los suscriptores y loguea el error', () => {
    const eventType = 'test.error';
    const eventData = { value: 42 };
    const errorMessage = 'Error simulado en suscriptor';
    
    const errorCallback = jest.fn(() => {
      throw new Error(errorMessage);
    });
    const normalCallback = jest.fn();
    
    eventBus.subscribe(eventType, errorCallback);
    eventBus.subscribe(eventType, normalCallback);
    
    eventBus.publish(eventType, eventData);
    
    expect(errorCallback).toHaveBeenCalledWith(eventData);
    expect(normalCallback).toHaveBeenCalledWith(eventData);
    expect(consoleErrorSpy).toHaveBeenCalledWith(`Error en suscriptor de evento ${eventType}:`, expect.any(Error));
  });

  test('EventBus genera IDs únicos para cada suscripción', () => {
    const id1 = eventBus.getNextId();
    const id2 = eventBus.getNextId();
    const id3 = eventBus.getNextId();
    
    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).toBe(1);
    expect(id2).toBe(2);
    expect(id3).toBe(3);
  });

  test('EventBus ignora publicaciones a eventos sin suscriptores', () => {
    const eventType = 'test.no.subscribers';
    const eventData = { value: 'test' };
    
    const publishAction = () => eventBus.publish(eventType, eventData);
    expect(publishAction).not.toThrow();
  });

  test('EventBus permite múltiples suscripciones del mismo callback a diferentes eventos', () => {
    const mockCallback = jest.fn();
    const eventType1 = 'test.multiple.1';
    const eventType2 = 'test.multiple.2';
    const data1 = { source: 'event1' };
    const data2 = { source: 'event2' };
    
    eventBus.subscribe(eventType1, mockCallback);
    eventBus.subscribe(eventType2, mockCallback);
    
    eventBus.publish(eventType1, data1);
    eventBus.publish(eventType2, data2);
    
    expect(mockCallback).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenCalledWith(data1);
    expect(mockCallback).toHaveBeenCalledWith(data2);
  });

  test('EventBus limpia correctamente cuando se cancelan todas las suscripciones de un tipo', () => {
    const eventType = 'test.cleanup';
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();
    
    const unsubscribe1 = eventBus.subscribe(eventType, mockCallback1);
    const unsubscribe2 = eventBus.subscribe(eventType, mockCallback2);
    
    expect(eventBus.subscribers[eventType]).toBeDefined();
    
    unsubscribe1();
    unsubscribe2();
    
    expect(eventBus.subscribers[eventType]).toBeUndefined();
  });

  test('EventBus mantiene suscripciones independientes para cada tipo de evento', () => {
    const eventType1 = 'test.independent.1';
    const eventType2 = 'test.independent.2';
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();
    
    eventBus.subscribe(eventType1, mockCallback1);
    eventBus.subscribe(eventType2, mockCallback2);
    
    eventBus.publish(eventType1, { value: 1 });
    
    expect(mockCallback1).toHaveBeenCalledTimes(1);
    expect(mockCallback2).not.toHaveBeenCalled();
  });

  test('EventBus utiliza correctamente las categorías predefinidas', () => {
    expect(EventCategories.CALENDAR).toBe('calendar');
    expect(EventCategories.APP).toBe('app');
    expect(EventCategories.STORAGE).toBe('storage');
    
    const mockCallback = jest.fn();
    const eventType = `${EventCategories.CALENDAR}.test`;
    const eventData = { test: true };
    
    eventBus.subscribe(eventType, mockCallback);
    eventBus.publish(eventType, eventData);
    
    expect(mockCallback).toHaveBeenCalledWith(eventData);
  });

  test('hasSubscribers devuelve true si hay suscriptores y false si no', () => {
    const eventType = 'has.subscribers.event';
    expect(eventBus.hasSubscribers(eventType)).toBe(false);
    expect(eventBus.hasSubscribers(null)).toBe(false); // Test con eventType nulo
    
    const unsubscribe = eventBus.subscribe(eventType, jest.fn());
    expect(eventBus.hasSubscribers(eventType)).toBe(true);
    
    unsubscribe();
    expect(eventBus.hasSubscribers(eventType)).toBe(false);
  });

  test('getSubscriberCount devuelve la cantidad correcta de suscriptores', () => {
    const eventType = 'count.event';
    expect(eventBus.getSubscriberCount(eventType)).toBe(0);
    expect(eventBus.getSubscriberCount(null)).toBe(0); // Test con eventType nulo
    expect(eventBus.getSubscriberCount(undefined)).toBe(0); // Test con eventType undefined

    const unsub1 = eventBus.subscribe(eventType, jest.fn());
    expect(eventBus.getSubscriberCount(eventType)).toBe(1);
    
    const unsub2 = eventBus.subscribe(eventType, jest.fn());
    expect(eventBus.getSubscriberCount(eventType)).toBe(2);
    
    unsub1();
    expect(eventBus.getSubscriberCount(eventType)).toBe(1);
    
    unsub2();
    expect(eventBus.getSubscriberCount(eventType)).toBe(0);
  });

  test('clear elimina todas las suscripciones', () => {
    eventBus.subscribe('event1.clear', jest.fn());
    eventBus.subscribe('event2.clear', jest.fn());
    expect(Object.keys(eventBus.subscribers).length).toBeGreaterThan(0);
    
    eventBus.clear();
    expect(eventBus.subscribers).toEqual({});
    expect(Object.keys(eventBus.subscribers).length).toBe(0);
  });

  test('getActiveEvents devuelve los eventos con suscriptores', () => {
    expect(eventBus.getActiveEvents()).toEqual([]);
    
    const event1 = 'active.event1';
    const event2 = 'active.event2';
    eventBus.subscribe(event1, jest.fn());
    eventBus.subscribe(event2, jest.fn());
    
    const activeEvents = eventBus.getActiveEvents();
    expect(activeEvents).toHaveLength(2);
    expect(activeEvents).toContain(event1);
    expect(activeEvents).toContain(event2);
  });

  test('setDebugMode actualiza el flag debugEnabled', () => {
    expect(eventBus.debugEnabled).toBe(false); // Default
    
    eventBus.setDebugMode(true);
    expect(eventBus.debugEnabled).toBe(true);
    
    eventBus.setDebugMode(false);
    expect(eventBus.debugEnabled).toBe(false);
  });

  // Test para la re-exportación de Events
  test('debe re-exportar Events y sus sub-objetos correctamente', () => {
    expect(Events).toBeDefined();
    expect(CalendarEvents).toBeDefined();
    expect(AppEvents).toBeDefined();
    expect(StorageEvents).toBeDefined();
    expect(UIEvents).toBeDefined(); // Asumiendo que UIEvents también se exporta desde events.js
    // Puedes añadir aserciones más específicas si conoces el contenido de estos objetos
    expect(typeof CalendarEvents.EVENT_CREATED).toBe('string'); // Ejemplo
  });
});