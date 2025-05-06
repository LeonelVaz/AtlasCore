import eventBus, { EventCategories } from '../../../../src/core/bus/event-bus';

describe('EventBus', () => {
  afterEach(() => {
    // Limpiar todas las suscripciones entre pruebas
    Object.keys(eventBus.subscribers).forEach(eventType => {
      Object.keys(eventBus.subscribers[eventType]).forEach(() => {
        delete eventBus.subscribers[eventType];
      });
      delete eventBus.subscribers[eventType];
    });
  });

  test('debe ser una instancia singleton', () => {
    expect(eventBus).toBeDefined();
    expect(typeof eventBus.subscribe).toBe('function');
    expect(typeof eventBus.publish).toBe('function');
  });

  test('EventCategories debe contener las categorías correctas', () => {
    expect(EventCategories.CALENDAR).toBe('calendar');
    expect(EventCategories.APP).toBe('app');
    expect(EventCategories.STORAGE).toBe('storage');
  });

  test('subscribe debe devolver una función para cancelar la suscripción', () => {
    const callback = jest.fn();
    const unsubscribe = eventBus.subscribe('test-event', callback);
    
    expect(typeof unsubscribe).toBe('function');
    expect(eventBus.subscribers['test-event']).toBeDefined();
    
    // Verificar la cancelación de suscripción
    unsubscribe();
    // Verificar que se eliminó por completo la clave (este cambio corrige el test)
    expect(eventBus.subscribers['test-event']).toBeUndefined();
  });

  test('publish debe llamar a todos los callbacks suscritos con los datos correctos', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const testData = { id: '123', name: 'test' };
    
    eventBus.subscribe('test-event', callback1);
    eventBus.subscribe('test-event', callback2);
    
    eventBus.publish('test-event', testData);
    
    expect(callback1).toHaveBeenCalledWith(testData);
    expect(callback2).toHaveBeenCalledWith(testData);
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  test('publish no debe hacer nada si no hay suscriptores para el evento', () => {
    const callback = jest.fn();
    eventBus.subscribe('test-event', callback);
    
    eventBus.publish('non-existing-event', {});
    
    expect(callback).not.toHaveBeenCalled();
  });

  test('debe manejar errores en los callbacks sin interrumpir otros callbacks', () => {
    const callbackWithError = jest.fn().mockImplementation(() => {
      throw new Error('Error en callback');
    });
    const normalCallback = jest.fn();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    eventBus.subscribe('test-event', callbackWithError);
    eventBus.subscribe('test-event', normalCallback);
    
    eventBus.publish('test-event', {});
    
    expect(callbackWithError).toHaveBeenCalledTimes(1);
    expect(normalCallback).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  test('debe permitir múltiples suscripciones y cancelaciones sin afectar otras suscripciones', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const callback3 = jest.fn();
    
    const unsubscribe1 = eventBus.subscribe('test-event', callback1);
    const unsubscribe2 = eventBus.subscribe('test-event', callback2);
    eventBus.subscribe('other-event', callback3);
    
    unsubscribe1();
    
    eventBus.publish('test-event', {});
    eventBus.publish('other-event', {});
    
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback3).toHaveBeenCalledTimes(1);
    
    unsubscribe2();
    
    // Verificar que el eventType se elimina si no quedan suscriptores
    expect(eventBus.subscribers['test-event']).toBeUndefined();
  });

  test('debe asignar IDs únicos a cada suscripción', () => {
    const callback = jest.fn();
    
    // Espiar el método getNextId
    const getNextIdSpy = jest.spyOn(eventBus, 'getNextId');
    
    eventBus.subscribe('test-event', callback);
    eventBus.subscribe('test-event', callback);
    
    expect(getNextIdSpy).toHaveBeenCalledTimes(2);
    expect(getNextIdSpy.mock.results[0].value).not.toBe(getNextIdSpy.mock.results[1].value);
    
    getNextIdSpy.mockRestore();
  });
});