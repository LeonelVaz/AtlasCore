// test/unit/10-custom-hooks.test.js
import React from 'react';
import { render, renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom';

// Importar los hooks a probar
import useCalendarEvents from '../../src/hooks/use-calendar-events';
import useCalendarNavigation from '../../src/hooks/use-calendar-navigation';
import useEventForm from '../../src/hooks/use-event-form';
import useTimeGrid from '../../src/hooks/use-time-grid';

// Mocks para servicios
const mockEvents = [
  {
    id: "event-1",
    title: "Evento de prueba para hooks",
    start: "2025-05-12T10:00:00Z",
    end: "2025-05-12T11:00:00Z",
    color: "#2D4B94"
  }
];

// Mock para storage
const mockStorageGet = jest.fn().mockImplementation(() => Promise.resolve(mockEvents));
const mockStorageSet = jest.fn().mockImplementation(() => Promise.resolve(true));

jest.mock('../../src/services/storage-service', () => ({
  __esModule: true,
  default: {
    get: (...args) => mockStorageGet(...args),
    set: (...args) => mockStorageSet(...args)
  }
}));

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

// Mock para formatDateForInput
jest.mock('../../src/utils/date-utils', () => {
  const originalModule = jest.requireActual('../../src/utils/date-utils');
  return {
    ...originalModule,
    formatDateForInput: jest.fn(date => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    })
  };
});

// Mock para fecha constante
const mockDate = new Date('2025-05-12T12:00:00Z');
const mockDateNow = jest.spyOn(global.Date, 'now').mockImplementation(() => mockDate.getTime());

describe('10. Uso de Hooks Personalizados', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockDateNow.mockRestore();
  });

  test('10.1 El hook useCalendarEvents gestiona correctamente los eventos', async () => {
    // Renderizar el hook
    const { result } = renderHook(() => useCalendarEvents());
    
    // Esperar a que los eventos se carguen
    await waitFor(() => {
      expect(result.current.events).toHaveLength(mockEvents.length);
    });
    
    // Verificar que se llamó a get para cargar los eventos
    expect(mockStorageGet).toHaveBeenCalled();
    
    // Verificar que los eventos están disponibles
    expect(result.current.events).toEqual(mockEvents);
    
    // Verificar que se suscribió a eventos del almacenamiento
    expect(mockSubscribe).toHaveBeenCalled();
    
    // Crear un nuevo evento
    const newEvent = {
      title: "Nuevo evento desde hook",
      start: "2025-05-12T14:00:00Z",
      end: "2025-05-12T15:00:00Z",
      color: "#26A69A"
    };
    
    // Limpiar mock antes de crear
    mockStorageSet.mockClear();
    mockPublish.mockClear();
    
    // Llamar a la función createEvent
    await act(async () => {
      const createdEvent = await result.current.createEvent(newEvent);
      
      // Verificar que el evento se creó con un ID
      expect(createdEvent).toBeTruthy();
      expect(createdEvent.id).toBeTruthy();
      expect(createdEvent.title).toBe(newEvent.title);
    });
    
    // Verificar que se guardó en el almacenamiento
    expect(mockStorageSet).toHaveBeenCalled();
    
    // Verificar que se publicó el evento
    expect(mockPublish).toHaveBeenCalled();
    expect(mockPublish.mock.calls[0][0]).toContain('calendar');
    expect(mockPublish.mock.calls[0][0]).toContain('create');
    
    // Verificar que el array de eventos se actualizó
    expect(result.current.events.length).toBe(mockEvents.length + 1);
    
    // Actualizar un evento
    const eventToUpdate = result.current.events[0];
    const updatedData = {
      ...eventToUpdate,
      title: "Evento actualizado desde hook"
    };
    
    // Limpiar mocks antes de actualizar
    mockStorageSet.mockClear();
    mockPublish.mockClear();
    
    // Llamar a la función updateEvent
    await act(async () => {
      const updatedEvent = await result.current.updateEvent(eventToUpdate.id, updatedData);
      
      // Verificar que el evento se actualizó
      expect(updatedEvent).toBeTruthy();
      expect(updatedEvent.title).toBe(updatedData.title);
    });
    
    // Verificar que se guardó en el almacenamiento
    expect(mockStorageSet).toHaveBeenCalled();
    
    // Verificar que se publicó el evento
    expect(mockPublish).toHaveBeenCalled();
    expect(mockPublish.mock.calls[0][0]).toContain('calendar');
    expect(mockPublish.mock.calls[0][0]).toContain('update');
    
    // Eliminar un evento
    const eventToDelete = result.current.events[0];
    
    // Limpiar mocks antes de eliminar
    mockStorageSet.mockClear();
    mockPublish.mockClear();
    
    // Llamar a la función deleteEvent
    await act(async () => {
      await result.current.deleteEvent(eventToDelete.id);
    });
    
    // Verificar que se guardó en el almacenamiento
    expect(mockStorageSet).toHaveBeenCalled();
    
    // Verificar que se publicó el evento
    expect(mockPublish).toHaveBeenCalled();
    expect(mockPublish.mock.calls[0][0]).toContain('calendar');
    expect(mockPublish.mock.calls[0][0]).toContain('delete');
    
    // Verificar funciones adicionales del hook
    expect(typeof result.current.getEvents).toBe('function');
    expect(typeof result.current.saveEvents).toBe('function');
    expect(typeof result.current.loadEvents).toBe('function');
    
    // Verificar resultados de getEvents
    const currentEvents = result.current.getEvents();
    expect(Array.isArray(currentEvents)).toBe(true);
  });

  test('10.2 El hook useCalendarNavigation maneja correctamente la navegación', async () => {
    // Renderizar el hook
    const { result } = renderHook(() => useCalendarNavigation());
    
    // Verificar estado inicial
    expect(result.current.currentDate).toBeInstanceOf(Date);
    expect(result.current.selectedDay).toBeInstanceOf(Date);
    
    // Verificar funciones de navegación
    expect(typeof result.current.goToPreviousWeek).toBe('function');
    expect(typeof result.current.goToNextWeek).toBe('function');
    expect(typeof result.current.goToCurrentWeek).toBe('function');
    expect(typeof result.current.goToPreviousDay).toBe('function');
    expect(typeof result.current.goToNextDay).toBe('function');
    expect(typeof result.current.goToToday).toBe('function');
    
    // Guardar fechas iniciales
    const initialCurrentDate = new Date(result.current.currentDate);
    const initialSelectedDay = new Date(result.current.selectedDay);
    
    // Navegar a la semana anterior
    await act(async () => {
      result.current.goToPreviousWeek();
    });
    
    // Verificar cambio en la fecha actual
    const previousWeekDate = new Date(initialCurrentDate);
    previousWeekDate.setDate(previousWeekDate.getDate() - 7);
    
    expect(result.current.currentDate.getDate()).toBe(previousWeekDate.getDate());
    expect(result.current.currentDate.getMonth()).toBe(previousWeekDate.getMonth());
    
    // Navegar a la semana siguiente
    await act(async () => {
      result.current.goToNextWeek();
    });
    
    // Verificar que volvemos a la fecha inicial
    expect(result.current.currentDate.getDate()).toBe(initialCurrentDate.getDate());
    expect(result.current.currentDate.getMonth()).toBe(initialCurrentDate.getMonth());
    
    // Navegar al día anterior
    await act(async () => {
      result.current.goToPreviousDay();
    });
    
    // Verificar cambio en el día seleccionado
    const previousDay = new Date(initialSelectedDay);
    previousDay.setDate(previousDay.getDate() - 1);
    
    expect(result.current.selectedDay.getDate()).toBe(previousDay.getDate());
    
    // Navegar al día siguiente
    await act(async () => {
      result.current.goToNextDay();
    });
    
    // Verificar que volvemos al día inicial
    expect(result.current.selectedDay.getDate()).toBe(initialSelectedDay.getDate());
    
    // Establecer fechas manualmente
    const newDate = new Date('2025-06-15T12:00:00Z');
    
    await act(async () => {
      result.current.setCurrentDate(newDate);
      result.current.setSelectedDay(newDate);
    });
    
    // Verificar cambios manuales
    expect(result.current.currentDate.getMonth()).toBe(5); // Junio (0-indexed)
    expect(result.current.currentDate.getDate()).toBe(15);
    expect(result.current.selectedDay.getMonth()).toBe(5);
    expect(result.current.selectedDay.getDate()).toBe(15);
    
    // Volver a la fecha actual
    await act(async () => {
      result.current.goToCurrentWeek();
      result.current.goToToday();
    });
    
    // Verificar que volvemos a la fecha actual
    const today = new Date();
    
    // Verificar el mes y año (no el día exacto, ya que depende de mockDate)
    expect(result.current.currentDate.getFullYear()).toBe(today.getFullYear());
    expect(result.current.selectedDay.getFullYear()).toBe(today.getFullYear());
  });

  test('10.3 El hook useEventForm gestiona correctamente el formulario de eventos', async () => {
    // Funciones mock para los callbacks
    const mockCreateEvent = jest.fn(eventData => ({ ...eventData, id: 'new-id' }));
    const mockUpdateEvent = jest.fn((id, eventData) => ({ ...eventData }));
    const mockDeleteEvent = jest.fn(id => { /* simulación de eliminación */ });
    
    // Renderizar el hook
    const { result } = renderHook(() => 
      useEventForm(mockCreateEvent, mockUpdateEvent, mockDeleteEvent)
    );
    
    // Verificar estado inicial
    expect(result.current.selectedEvent).toBeNull();
    expect(result.current.showEventForm).toBe(false);
    expect(result.current.formError).toBe('');
    expect(result.current.newEvent).toBeTruthy();
    
    // Verificar funciones disponibles
    expect(typeof result.current.handleEventClick).toBe('function');
    expect(typeof result.current.handleCellClick).toBe('function');
    expect(typeof result.current.handleEventFormChange).toBe('function');
    expect(typeof result.current.handleCloseForm).toBe('function');
    expect(typeof result.current.handleSaveEvent).toBe('function');
    expect(typeof result.current.handleDeleteEvent).toBe('function');
    
    // Probar clic en celda (creación de evento)
    await act(async () => {
      result.current.handleCellClick(new Date(), 10); // Día actual, hora 10
    });
    
    // Verificar que se abrió el formulario con valores predeterminados
    expect(result.current.showEventForm).toBe(true);
    expect(result.current.newEvent.title).toBe('Nuevo evento');
    expect(result.current.newEvent.startFormatted).toBeTruthy();
    expect(result.current.newEvent.endFormatted).toBeTruthy();
    
    // Modificar datos del formulario
    await act(async () => {
      result.current.handleEventFormChange({
        target: { name: 'title', value: 'Evento desde form hook' }
      });
    });
    
    // Verificar que se actualizó el título
    expect(result.current.newEvent.title).toBe('Evento desde form hook');
    
    // Guardar evento
    await act(async () => {
      await result.current.handleSaveEvent();
    });
    
    // Verificar que se llamó a createEvent
    expect(mockCreateEvent).toHaveBeenCalled();
    expect(mockCreateEvent.mock.calls[0][0].title).toBe('Evento desde form hook');
    
    // Verificar que se cerró el formulario
    expect(result.current.showEventForm).toBe(false);
    
    // Probar clic en evento existente (edición)
    const existingEvent = {
      id: 'existing-id',
      title: 'Evento existente',
      start: '2025-05-12T14:00:00Z',
      end: '2025-05-12T15:00:00Z',
      color: '#FF5722'
    };
    
    await act(async () => {
      result.current.handleEventClick(existingEvent);
    });
    
    // Verificar que se abrió el formulario con datos del evento
    expect(result.current.showEventForm).toBe(true);
    expect(result.current.selectedEvent).toBeTruthy();
    expect(result.current.newEvent.id).toBe(existingEvent.id);
    expect(result.current.newEvent.title).toBe(existingEvent.title);
    
    // Modificar título del evento
    await act(async () => {
      result.current.handleEventFormChange({
        target: { name: 'title', value: 'Evento actualizado' }
      });
    });
    
    // Guardar cambios
    await act(async () => {
      await result.current.handleSaveEvent();
    });
    
    // Verificar que se llamó a updateEvent
    expect(mockUpdateEvent).toHaveBeenCalled();
    expect(mockUpdateEvent.mock.calls[0][0]).toBe(existingEvent.id);
    expect(mockUpdateEvent.mock.calls[0][1].title).toBe('Evento actualizado');
    
    // Probar eliminación de evento
    // Abrir el formulario nuevamente para un evento existente
    await act(async () => {
      result.current.handleEventClick(existingEvent);
    });
    
    // Eliminar evento
    await act(async () => {
      await result.current.handleDeleteEvent();
    });
    
    // Verificar que se llamó a deleteEvent
    expect(mockDeleteEvent).toHaveBeenCalled();
    expect(mockDeleteEvent.mock.calls[0][0]).toBe(existingEvent.id);
    
    // Verificar que se cerró el formulario
    expect(result.current.showEventForm).toBe(false);
    
    // Probar cierre del formulario
    await act(async () => {
      result.current.handleCellClick(new Date(), 15);
    });
    
    expect(result.current.showEventForm).toBe(true);
    
    await act(async () => {
      result.current.handleCloseForm();
    });
    
    expect(result.current.showEventForm).toBe(false);
  });

  test('10.4 Los hooks limpian correctamente sus recursos al desmontar', async () => {
    // Crear un mock para la función unsubscribe
    const mockUnsubscribe = jest.fn();
    mockSubscribe.mockReturnValue(mockUnsubscribe);
    
    // Componente de prueba que usa el hook y se puede desmontar
    function TestComponent() {
      useCalendarEvents();
      return <div>Test Component</div>;
    }
    
    // Renderizar el componente
    const { unmount } = render(<TestComponent />);
    
    // Verificar que se suscribió a eventos
    expect(mockSubscribe).toHaveBeenCalled();
    
    // Desmontar el componente
    unmount();
    
    // Verificar que se llamó a la función unsubscribe
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  test('10.5 El hook useTimeGrid proporciona la funcionalidad correcta para la rejilla temporal', () => {
    // Renderizar el hook
    const { result } = renderHook(() => useTimeGrid());
    
    // Verificar funciones y datos
    expect(Array.isArray(result.current.hours)).toBe(true);
    expect(result.current.hours.length).toBe(24); // 24 horas
    
    // Verificar funciones principales
    expect(typeof result.current.generateHours).toBe('function');
    expect(typeof result.current.shouldShowEventStart).toBe('function');
    expect(typeof result.current.isEventActiveAtStartOfDay).toBe('function');
    expect(typeof result.current.getEventsForTimeSlot).toBe('function');
    expect(typeof result.current.formatTimeSlot).toBe('function');
    
    // Probar shouldShowEventStart
    const testEvent = {
      start: '2025-05-12T10:00:00Z',
      end: '2025-05-12T11:00:00Z'
    };
    
    const testDay = new Date('2025-05-12T00:00:00Z');
    const eventHour = 10;
    const nonEventHour = 11;
    
    // Verificar que detecta correctamente cuando un evento empieza a cierta hora
    const shouldShow = result.current.shouldShowEventStart(testEvent, testDay, eventHour);
    expect(shouldShow).toBe(true);
    
    // Verificar que detecta correctamente cuando un evento NO empieza a cierta hora
    const shouldNotShow = result.current.shouldShowEventStart(testEvent, testDay, nonEventHour);
    expect(shouldNotShow).toBe(false);
    
    // Probar isEventActiveAtStartOfDay para evento que cruza días
    const overnightEvent = {
      start: '2025-05-09T22:00:00Z',
      end: '2025-05-12T02:00:00Z'
    };
    
    const isActive = result.current.isEventActiveAtStartOfDay(overnightEvent, testDay);
    expect(isActive).toBe(true);
    
    // Verificar que detecta correctamente cuando un evento NO está activo al inicio del día
    const regularEvent = {
      start: '2025-05-12T08:00:00Z',
      end: '2025-05-12T09:00:00Z'
    };
    
    const isNotActive = result.current.isEventActiveAtStartOfDay(regularEvent, testDay);
    expect(isNotActive).toBe(false);
    
    // Probar formatTimeSlot
    const formattedHour = result.current.formatTimeSlot(10);
    expect(formattedHour).toBe('10:00');
  });
});