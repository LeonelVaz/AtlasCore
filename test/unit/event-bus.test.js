// test/unit/event-bus.test.js
import eventBus, { EventCategories } from '../../src/core/bus/event-bus';

describe('EventBus', () => {
  // Limpiar suscripciones después de cada test para evitar efectos secundarios
  afterEach(() => {
    // Limpiar suscriptores para evitar efectos secundarios entre tests
    eventBus.subscribers = {};
    eventBus.lastId = 0;
  });

  test('EventBus puede suscribirse a eventos y devuelve una función para cancelar suscripción', () => {
    // Preparar
    const mockCallback = jest.fn();
    const eventType = 'test.event';
    
    // Actuar
    const unsubscribe = eventBus.subscribe(eventType, mockCallback);
    
    // Verificar
    expect(typeof unsubscribe).toBe('function');
    expect(eventBus.subscribers[eventType]).toBeDefined();
    expect(Object.keys(eventBus.subscribers[eventType]).length).toBe(1);
    
    // Verificar que la función de cancelación funciona
    unsubscribe();
    expect(Object.keys(eventBus.subscribers[eventType]).length).toBe(0);
  });

  test('EventBus publica eventos y notifica a todos los suscriptores', () => {
    // Preparar
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();
    const eventType = 'test.notification';
    const eventData = { message: 'Hello World' };
    
    eventBus.subscribe(eventType, mockCallback1);
    eventBus.subscribe(eventType, mockCallback2);
    
    // Actuar
    eventBus.publish(eventType, eventData);
    
    // Verificar
    expect(mockCallback1).toHaveBeenCalledWith(eventData);
    expect(mockCallback2).toHaveBeenCalledWith(eventData);
  });

  test('EventBus maneja errores en los callbacks de los suscriptores', () => {
    // Espiar console.error
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Preparar
    const eventType = 'test.error';
    const eventData = { value: 42 };
    const errorMessage = 'Error simulado en suscriptor';
    
    // Suscriptor que lanza un error
    const errorCallback = jest.fn(() => {
      throw new Error(errorMessage);
    });
    
    // Suscriptor normal que no debería verse afectado por el error del primero
    const normalCallback = jest.fn();
    
    eventBus.subscribe(eventType, errorCallback);
    eventBus.subscribe(eventType, normalCallback);
    
    // Actuar
    eventBus.publish(eventType, eventData);
    
    // Verificar
    expect(errorCallback).toHaveBeenCalledWith(eventData);
    expect(normalCallback).toHaveBeenCalledWith(eventData);
    expect(console.error).toHaveBeenCalled();
    
    // Restaurar console.error
    console.error = originalConsoleError;
  });

  test('EventBus genera IDs únicos para cada suscripción', () => {
    // Preparar
    const eventType = 'test.ids';
    const mockCallback = jest.fn();
    
    // Actuar
    const id1 = eventBus.getNextId();
    const id2 = eventBus.getNextId();
    const id3 = eventBus.getNextId();
    
    // Verificar
    expect(id1).not.toBe(id2);
    expect(id2).not.toBe(id3);
    expect(id1).toBe(1); // Empieza en 1
    expect(id2).toBe(2);
    expect(id3).toBe(3);
  });

  test('EventBus ignora publicaciones a eventos sin suscriptores', () => {
    // Preparar - intencionalmente no hay suscriptores
    const eventType = 'test.no.subscribers';
    const eventData = { value: 'test' };
    
    // Actuar - No debería causar errores
    const publishAction = () => eventBus.publish(eventType, eventData);
    
    // Verificar
    expect(publishAction).not.toThrow();
  });

  test('EventBus permite múltiples suscripciones del mismo callback a diferentes eventos', () => {
    // Preparar
    const mockCallback = jest.fn();
    const eventType1 = 'test.multiple.1';
    const eventType2 = 'test.multiple.2';
    const data1 = { source: 'event1' };
    const data2 = { source: 'event2' };
    
    // Actuar
    eventBus.subscribe(eventType1, mockCallback);
    eventBus.subscribe(eventType2, mockCallback);
    
    eventBus.publish(eventType1, data1);
    eventBus.publish(eventType2, data2);
    
    // Verificar
    expect(mockCallback).toHaveBeenCalledTimes(2);
    expect(mockCallback).toHaveBeenCalledWith(data1);
    expect(mockCallback).toHaveBeenCalledWith(data2);
  });

  test('EventBus limpia correctamente cuando se cancelan todas las suscripciones de un tipo', () => {
    // Preparar
    const eventType = 'test.cleanup';
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();
    
    const unsubscribe1 = eventBus.subscribe(eventType, mockCallback1);
    const unsubscribe2 = eventBus.subscribe(eventType, mockCallback2);
    
    // Actuar
    // Verificar que el evento existe
    expect(eventBus.subscribers[eventType]).toBeDefined();
    
    // Cancelar todas las suscripciones
    unsubscribe1();
    unsubscribe2();
    
    // Verificar
    // El objeto del evento debería haberse eliminado completamente
    expect(eventBus.subscribers[eventType]).toBeUndefined();
  });

  test('EventBus mantiene suscripciones independientes para cada tipo de evento', () => {
    // Preparar
    const eventType1 = 'test.independent.1';
    const eventType2 = 'test.independent.2';
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();
    
    eventBus.subscribe(eventType1, mockCallback1);
    eventBus.subscribe(eventType2, mockCallback2);
    
    // Actuar
    eventBus.publish(eventType1, { value: 1 });
    
    // Verificar
    expect(mockCallback1).toHaveBeenCalledTimes(1);
    expect(mockCallback2).not.toHaveBeenCalled();
  });

  test('EventBus utiliza correctamente las categorías predefinidas', () => {
    // Verificar que las categorías están definidas
    expect(EventCategories.CALENDAR).toBe('calendar');
    expect(EventCategories.APP).toBe('app');
    expect(EventCategories.STORAGE).toBe('storage');
    
    // Preparar
    const mockCallback = jest.fn();
    const eventType = `${EventCategories.CALENDAR}.test`;
    const eventData = { test: true };
    
    // Actuar
    eventBus.subscribe(eventType, mockCallback);
    eventBus.publish(eventType, eventData);
    
    // Verificar
    expect(mockCallback).toHaveBeenCalledWith(eventData);
  });
});