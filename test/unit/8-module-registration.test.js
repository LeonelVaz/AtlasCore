// test/unit/8-module-registration.test.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import CalendarMain from '../../src/components/calendar/calendar-main';

// Mocks para el registro de módulos
jest.mock('../../src/core/module/module-registry', () => ({
  registerModule: jest.fn().mockReturnValue(true),
  unregisterModule: jest.fn().mockReturnValue(true),
  getModule: jest.fn(),
  isModuleRegistered: jest.fn().mockReturnValue(false)
}));

// Importar las funciones mockeadas
import { registerModule, unregisterModule } from '../../src/core/module/module-registry';

// Mock para almacenamiento
const mockStorageGet = jest.fn().mockResolvedValue([]);
const mockStorageSet = jest.fn().mockResolvedValue(true);

jest.mock('../../src/services/storage-service', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockStorageGet(...args),
    set: (...args) => mockStorageSet(...args)
  }
}));

// Mock para EventBus
const mockUnsubscribe = jest.fn();
const mockSubscribe = jest.fn().mockReturnValue(mockUnsubscribe);
const mockPublish = jest.fn();

jest.mock('../../src/core/bus/event-bus', () => ({
  __esModule: true,
  default: {
    subscribe: (...args) => mockSubscribe(...args),
    publish: (...args) => mockPublish(...args)
  },
  EventCategories: {
    CALENDAR: 'calendar',
    APP: 'app',
    STORAGE: 'storage'
  }
}));

// Mock para fecha constante
const mockDate = new Date('2025-05-10T12:00:00');
const originalDate = global.Date;
const mockDateNow = jest.spyOn(global.Date, 'now').mockImplementation(() => mockDate.getTime());

describe('8. Registro del módulo e interoperabilidad', () => {
  let container = null;
  let root = null;
  
  beforeEach(() => {
    // Configurar un elemento DOM como objetivo del renderizado
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    
    // Limpiar todos los mocks antes de cada prueba
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Limpiar al salir
    act(() => {
      root.unmount();
    });
    container.remove();
    container = null;
    root = null;
  });
  
  afterAll(() => {
    mockDateNow.mockRestore();
  });

  test('8.1 El módulo de calendario se registra correctamente al montar', () => {
    // Renderizar el componente (envuelto en act())
    act(() => {
      root.render(<CalendarMain />);
    });
    
    // Verificar que se llamó a registerModule
    expect(registerModule).toHaveBeenCalled();
    
    // Verificar que se registró con el nombre correcto
    expect(registerModule.mock.calls[0][0]).toBe('calendar');
    
    // Verificar que se pasó una API
    expect(typeof registerModule.mock.calls[0][1]).toBe('object');
  });

  test('8.2 El módulo expone las funciones correctas de la API', () => {
    // Renderizar el componente (envuelto en act())
    act(() => {
      root.render(<CalendarMain />);
    });
    
    // Obtener el objeto API que se pasó a registerModule
    const moduleAPI = registerModule.mock.calls[0][1];
    
    // Verificar que la API contiene todas las funciones requeridas
    expect(typeof moduleAPI.getEvents).toBe('function');
    expect(typeof moduleAPI.createEvent).toBe('function');
    expect(typeof moduleAPI.updateEvent).toBe('function');
    expect(typeof moduleAPI.deleteEvent).toBe('function');
    
    // Verificar que no hay funciones adicionales inesperadas
    const apiKeys = Object.keys(moduleAPI);
    expect(apiKeys).toHaveLength(4); // Solo las 4 funciones requeridas
    expect(apiKeys).toEqual(
      expect.arrayContaining(['getEvents', 'createEvent', 'updateEvent', 'deleteEvent'])
    );
  });

  test('8.3 El módulo se anula el registro al desmontar', () => {
    // Crear un container específico para esta prueba
    const testContainer = document.createElement("div");
    document.body.appendChild(testContainer);
    const testRoot = createRoot(testContainer);
    
    try {
      // Primero montamos
      act(() => {
        testRoot.render(<CalendarMain />);
      });
      
      // Verificamos que unregisterModule aún no se ha llamado
      expect(unregisterModule).not.toHaveBeenCalled();
      
      // Luego desmontamos
      act(() => {
        testRoot.unmount();
      });
      
      // Ahora verificamos que unregisterModule fue llamado durante el desmontaje
      expect(unregisterModule).toHaveBeenCalledWith('calendar');
    } finally {
      // Limpieza
      if (testContainer.parentNode) {
        testContainer.parentNode.removeChild(testContainer);
      }
    }
  });

  test('8.4 La función unsubscribe se ejecuta al desmontar', () => {
    // Crear un container específico para esta prueba
    const testContainer = document.createElement("div");
    document.body.appendChild(testContainer);
    const testRoot = createRoot(testContainer);
    
    try {
      // Primero montamos
      act(() => {
        testRoot.render(<CalendarMain />);
      });
      
      // Verificamos que subscribe se ha llamado pero unsubscribe aún no
      expect(mockSubscribe).toHaveBeenCalled();
      expect(mockUnsubscribe).not.toHaveBeenCalled();
      
      // Luego desmontamos
      act(() => {
        testRoot.unmount();
      });
      
      // Ahora verificamos que unsubscribe fue llamado durante el desmontaje
      expect(mockUnsubscribe).toHaveBeenCalled();
    } finally {
      // Limpieza
      if (testContainer.parentNode) {
        testContainer.parentNode.removeChild(testContainer);
      }
    }
  });
});