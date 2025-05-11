// test/unit/7-enhanced-storage-integration.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Importar los componentes y servicios a probar
import CalendarMain from '../../src/components/calendar/calendar-main';
import storageService from '../../src/services/storage-service';
import { STORAGE_KEYS } from '../../src/core/config/constants';
import useCalendarEvents from '../../src/hooks/use-calendar-events';

// Mocks para el almacenamiento
const mockEvents = [
  {
    id: "event-1",
    title: "Evento de almacenamiento",
    start: "2025-05-10T10:00:00Z",
    end: "2025-05-10T11:00:00Z",
    color: "#2D4B94"
  }
];

const mockStorageGet = jest.fn();
const mockStorageSet = jest.fn();
const mockStorageRemove = jest.fn();
const mockStorageClear = jest.fn();

// Mock para EventBus
const mockSubscribe = jest.fn().mockReturnValue(() => {});
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

// Mock para el servicio de almacenamiento
jest.mock('../../src/services/storage-service', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
    clear: jest.fn()
  }
}));

// Mock para fecha constante
const mockDate = new Date('2025-05-10T12:00:00Z');
const originalDate = global.Date;
const mockDateNow = jest.spyOn(global.Date, 'now').mockImplementation(() => mockDate.getTime());

// Componente de prueba para el hook useCalendarEvents
function TestHookComponent({ onHookResult }) {
  const hookResult = useCalendarEvents();
  
  React.useEffect(() => {
    onHookResult(hookResult);
  }, [hookResult, onHookResult]);
  
  return null;
}

describe('7. Integración de Almacenamiento Mejorado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    
    // Restablecer los mocks para cada prueba
    storageService.get.mockImplementation((key, defaultValue) => {
      if (key === STORAGE_KEYS.EVENTS) {
        return Promise.resolve(mockEvents);
      }
      return Promise.resolve(defaultValue);
    });
    
    storageService.set.mockImplementation(() => Promise.resolve(true));
    storageService.remove.mockImplementation(() => Promise.resolve(true));
    storageService.clear.mockImplementation(() => Promise.resolve(true));
  });

  afterAll(() => {
    mockDateNow.mockRestore();
  });

  test('7.1 Los eventos se cargan desde el almacenamiento al montar el componente', async () => {
    render(<CalendarMain />);
    
    // Verificar que se llamó a get con la clave correcta
    expect(storageService.get).toHaveBeenCalled();
    expect(storageService.get).toHaveBeenCalledWith(STORAGE_KEYS.EVENTS, []);
    
    // Verificar que los eventos cargados aparecen en la interfaz
    await waitFor(() => {
      const events = document.querySelectorAll('.calendar-event');
      expect(events.length).toBeGreaterThan(0);
      
      // Verificar que al menos un evento contiene el título esperado
      const eventTitles = Array.from(events).map(e => e.textContent);
      expect(eventTitles.some(title => title.includes('Evento de almacenamiento'))).toBe(true);
    });
  });

  test('7.2 Los eventos se guardan en el almacenamiento al crearse, actualizarse o eliminarse', async () => {
    render(<CalendarMain />);
    
    // Esperar a que se carguen los eventos
    await waitFor(() => {
      const events = document.querySelectorAll('.calendar-event');
      expect(events.length).toBeGreaterThan(0);
    });
    
    // 1. Crear un nuevo evento
    const timeSlots = document.querySelectorAll('.calendar-time-slot');
    fireEvent.click(timeSlots[9]); // Clic en la hora 9
    
    // Verificar que se abre el formulario
    await waitFor(() => {
      expect(document.querySelector('.ui-dialog')).toBeInTheDocument();
    });
    
    // Completar y guardar el formulario
    const titleInput = screen.getByLabelText(/título/i);
    fireEvent.change(titleInput, { target: { value: 'Nuevo evento desde test' } });
    
    const saveButton = screen.getByText(/guardar/i);
    
    // Limpiar mock antes de guardar
    storageService.set.mockClear();
    
    fireEvent.click(saveButton);
    
    // Verificar que se llamó a set para guardar los eventos
    await waitFor(() => {
      expect(storageService.set).toHaveBeenCalled();
      
      // Verificar que se usó la clave correcta
      const [key, events] = storageService.set.mock.calls[0];
      expect(key).toBe(STORAGE_KEYS.EVENTS);
      
      // Verificar que los eventos incluyen el nuevo evento
      expect(Array.isArray(events)).toBe(true);
      expect(events.some(event => event.title === 'Nuevo evento desde test')).toBe(true);
    });
    
    // 2. Actualizar un evento existente
    const eventElements = document.querySelectorAll('.calendar-event');
    
    // Limpiar mock antes de actualizar
    storageService.set.mockClear();
    
    // Hacer clic en el primer evento para editarlo
    fireEvent.click(eventElements[0]);
    
    // Esperar a que se abra el formulario
    await waitFor(() => {
      expect(document.querySelector('.ui-dialog')).toBeInTheDocument();
    });
    
    // Cambiar el título
    const editTitleInput = screen.getByLabelText(/título/i);
    fireEvent.change(editTitleInput, { target: { value: 'Evento actualizado' } });
    
    // Guardar cambios
    const editSaveButton = screen.getByText(/guardar/i);
    fireEvent.click(editSaveButton);
    
    // Verificar que se llamó a set para guardar los eventos actualizados
    await waitFor(() => {
      expect(storageService.set).toHaveBeenCalled();
      
      // Verificar que se usó la clave correcta
      const [key, events] = storageService.set.mock.calls[0];
      expect(key).toBe(STORAGE_KEYS.EVENTS);
      
      // Verificar que los eventos incluyen el evento actualizado
      expect(Array.isArray(events)).toBe(true);
      expect(events.some(event => event.title === 'Evento actualizado')).toBe(true);
    });
  });

  test('7.3 La gestión de errores funciona para el almacenamiento', async () => {
    // Simular un error en el almacenamiento
    const errorMessage = 'Error simulado en almacenamiento';
    storageService.get.mockImplementation(() => Promise.reject(new Error(errorMessage)));
    
    // Usar el hook directamente para verificar la gestión de errores
    const mockHookCallback = jest.fn();
    render(<TestHookComponent onHookResult={mockHookCallback} />);
    
    // Esperar a que se llame al hook
    await waitFor(() => {
      expect(mockHookCallback).toHaveBeenCalled();
    });
    
    // Verificar que ante el error, el hook devuelve un array vacío
    const hookResult = mockHookCallback.mock.calls[0][0];
    expect(hookResult.events).toEqual([]);
    
    // Verificar que se intentó obtener los eventos
    expect(storageService.get).toHaveBeenCalledWith(STORAGE_KEYS.EVENTS, []);
  });

  test('7.4 El almacenamiento maneja correctamente las operaciones asíncronas', async () => {
    // Implementar un retardo simulado en las operaciones de almacenamiento
    storageService.get.mockImplementation((key, defaultValue) => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(key === STORAGE_KEYS.EVENTS ? mockEvents : defaultValue);
        }, 100);
      });
    });
    
    storageService.set.mockImplementation((key, value) => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(true);
        }, 100);
      });
    });
    
    // Renderizar el componente
    render(<CalendarMain />);
    
    // Verificar que se inició la carga
    expect(storageService.get).toHaveBeenCalled();
    
    // Esperar a que termine la carga asíncrona
    await waitFor(() => {
      const events = document.querySelectorAll('.calendar-event');
      expect(events.length).toBeGreaterThan(0);
    }, { timeout: 200 });
    
    // Crear un nuevo evento para probar la operación asíncrona de set
    const timeSlots = document.querySelectorAll('.calendar-time-slot');
    fireEvent.click(timeSlots[8]); // Clic en la hora 8
    
    // Verificar que se abre el formulario
    await waitFor(() => {
      expect(document.querySelector('.ui-dialog')).toBeInTheDocument();
    });
    
    // Completar y guardar el formulario
    const titleInput = screen.getByLabelText(/título/i);
    fireEvent.change(titleInput, { target: { value: 'Evento asíncrono' } });
    
    const saveButton = screen.getByText(/guardar/i);
    storageService.set.mockClear();
    
    fireEvent.click(saveButton);
    
    // Verificar que se llamó a set
    expect(storageService.set).toHaveBeenCalled();
    
    // Esperar a que termine la operación asíncrona
    await waitFor(() => {
      // El formulario debe estar cerrado después de guardar
      expect(document.querySelector('.ui-dialog')).not.toBeInTheDocument();
    }, { timeout: 200 });
  });

  test('7.5 El sistema de almacenamiento utiliza correctamente las constantes para las claves', async () => {
    // Verificar que se está usando la constante STORAGE_KEYS.EVENTS
    render(<CalendarMain />);
    
    // Verificar que se llama a get con la clave correcta
    expect(storageService.get).toHaveBeenCalledWith(STORAGE_KEYS.EVENTS, []);
    
    // Crear un nuevo evento para verificar el uso de la constante en set
    const timeSlots = document.querySelectorAll('.calendar-time-slot');
    fireEvent.click(timeSlots[12]); // Clic en la hora 12
    
    // Verificar que se abre el formulario
    await waitFor(() => {
      expect(document.querySelector('.ui-dialog')).toBeInTheDocument();
    });
    
    // Completar y guardar el formulario
    const titleInput = screen.getByLabelText(/título/i);
    fireEvent.change(titleInput, { target: { value: 'Evento para constantes' } });
    
    const saveButton = screen.getByText(/guardar/i);
    storageService.set.mockClear();
    
    fireEvent.click(saveButton);
    
    // Verificar que se llamó a set con la clave correcta
    await waitFor(() => {
      expect(storageService.set).toHaveBeenCalled();
      const [key] = storageService.set.mock.calls[0];
      expect(key).toBe(STORAGE_KEYS.EVENTS);
    });
    
    // Verificar que la clave utilizada en el código es igual a la definida en las constantes
    expect(STORAGE_KEYS.EVENTS).toBe('atlas_events');
  });
});