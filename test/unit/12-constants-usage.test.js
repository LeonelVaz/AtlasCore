// test/unit/12-constants-usage.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Importar componentes a probar
import CalendarMain from '../../src/components/calendar/calendar-main';
import SnapControl from '../../src/components/calendar/snap-control';

// Importar constantes
import { CALENDAR_VIEWS, SNAP_VALUES, STORAGE_KEYS, EVENT_OPERATIONS } from '../../src/core/config/constants';

// Importar servicios que utilizan las constantes
import storageService from '../../src/services/storage-service';

// Mocks para EventBus
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

// Mocks para servicios
const mockEvents = [];
const mockStorageGet = jest.fn().mockImplementation(() => Promise.resolve(mockEvents));
const mockStorageSet = jest.fn().mockImplementation(() => Promise.resolve(true));

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
const mockDateNow = jest.spyOn(global.Date, 'now').mockImplementation(() => mockDate.getTime());

describe('12. Uso de Constantes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    
    // Configurar mocks para los servicios
    storageService.get.mockImplementation((key, defaultValue) => {
      if (key === STORAGE_KEYS.EVENTS) {
        return Promise.resolve(mockEvents);
      }
      return Promise.resolve(defaultValue);
    });
    
    storageService.set.mockImplementation(() => Promise.resolve(true));
  });

  afterAll(() => {
    mockDateNow.mockRestore();
  });

  test('12.1 Las constantes CALENDAR_VIEWS se utilizan correctamente para las vistas', async () => {
    // Verificar que las constantes están definidas correctamente
    expect(CALENDAR_VIEWS).toBeDefined();
    expect(CALENDAR_VIEWS.DAY).toBe('day');
    expect(CALENDAR_VIEWS.WEEK).toBe('week');
    expect(CALENDAR_VIEWS.MONTH).toBe('month');
    
    // Renderizar el componente principal
    render(<CalendarMain />);
    
    // Verificar que la vista inicial es WEEK (según la implementación)
    expect(document.querySelector('.week-view')).toBeInTheDocument();
    
    // Cambiar a vista diaria
    const dayViewButton = screen.getByText(/vista diaria/i);
    fireEvent.click(dayViewButton);
    
    // Esperar a que cambie la vista
    await waitFor(() => {
      expect(document.querySelector('.day-view-container')).toBeInTheDocument();
    });
    
    // Cambiar de nuevo a vista semanal
    const weekViewButton = screen.getByText(/vista semanal/i);
    fireEvent.click(weekViewButton);
    
    // Esperar a que cambie la vista
    await waitFor(() => {
      expect(document.querySelector('.week-view')).toBeInTheDocument();
    });
    
    // Verificar comportamiento en el código fuente
    // Nota: Estas verificaciones son adicionales y comprueban la estructura de las constantes
    // en relación con su uso en el código.
    
    // Verificar que la constante WEEK existe
    expect(CALENDAR_VIEWS.WEEK).toBeDefined();
    
    // Verificar que la constante WEEK tiene el valor esperado ('week')
    // Este valor es importante porque debe coincidir con las clases CSS utilizadas
    expect(CALENDAR_VIEWS.WEEK).toBe('week');
    
    // Verificar que la constante DAY existe y tiene el valor esperado ('day')
    expect(CALENDAR_VIEWS.DAY).toBeDefined();
    expect(CALENDAR_VIEWS.DAY).toBe('day');
  });

  test('12.2 Las constantes SNAP_VALUES se utilizan correctamente en el sistema de snap', async () => {
    // Verificar que las constantes están definidas correctamente
    expect(SNAP_VALUES).toBeDefined();
    expect(SNAP_VALUES.NONE).toBe(0);
    expect(SNAP_VALUES.PRECISE).toBe(15);
    expect(SNAP_VALUES.MEDIUM).toBe(30);
    expect(SNAP_VALUES.BASIC).toBe(60);
    
    // Renderizar el componente SnapControl
    const mockOnSnapChange = jest.fn();
    const { rerender } = render(
      <SnapControl
        snapValue={SNAP_VALUES.NONE}
        onSnapChange={mockOnSnapChange}
      />
    );
    
    // Verificar que muestra "Off" como valor cuando SNAP_VALUES.NONE está activo
    const valueIndicator = document.querySelector('.snap-value-indicator');
    expect(valueIndicator.textContent).toBe('Off');
    
    // Hacer clic en el botón toggle para activar snap
    const snapToggle = document.querySelector('.snap-control-toggle');
    fireEvent.click(snapToggle);
    
    // Verificar que se llamó con SNAP_VALUES.BASIC (valor esperado al activar)
    expect(mockOnSnapChange).toHaveBeenCalledWith(SNAP_VALUES.BASIC);
    
    // Renderizar con SNAP_VALUES.BASIC
    rerender(
      <SnapControl
        snapValue={SNAP_VALUES.BASIC}
        onSnapChange={mockOnSnapChange}
      />
    );
    
    // Verificar que muestra "1h" para SNAP_VALUES.BASIC
    expect(document.querySelector('.snap-value-indicator').textContent).toBe('1h');
    
    // Abrir el menú de opciones
    fireEvent.click(document.querySelector('.snap-value-indicator'));
    
    // Verificar que el menú está abierto
    expect(document.querySelector('.snap-options-menu')).toBeInTheDocument();
    
    // Seleccionar la opción para SNAP_VALUES.MEDIUM (30 min)
    const options = document.querySelectorAll('.snap-option');
    // Tercer elemento en el menú (índice 2)
    const mediumOption = options[2];
    
    // Limpiar el mock antes de hacer clic
    mockOnSnapChange.mockClear();
    
    // Hacer clic en la opción
    fireEvent.click(mediumOption);
    
    // Verificar que se llamó con SNAP_VALUES.MEDIUM
    expect(mockOnSnapChange).toHaveBeenCalledWith(SNAP_VALUES.MEDIUM);
    
    // Renderizar con SNAP_VALUES.MEDIUM
    rerender(
      <SnapControl
        snapValue={SNAP_VALUES.MEDIUM}
        onSnapChange={mockOnSnapChange}
      />
    );
    
    // Verificar que muestra "30m" para SNAP_VALUES.MEDIUM
    expect(document.querySelector('.snap-value-indicator').textContent).toBe('30m');
  });

  test('12.3 Las constantes STORAGE_KEYS se utilizan correctamente en el almacenamiento', async () => {
    // Verificar que las constantes están definidas correctamente
    expect(STORAGE_KEYS).toBeDefined();
    expect(STORAGE_KEYS.EVENTS).toBe('atlas_events');
    expect(STORAGE_KEYS.SETTINGS).toBe('atlas_settings');
    expect(STORAGE_KEYS.THEME).toBe('atlas_theme');
    expect(STORAGE_KEYS.SNAP_VALUE).toBe('atlas_snap_value');
    
    // Renderizar CalendarMain para activar el almacenamiento
    render(<CalendarMain />);
    
    // Esperar a que se carguen los eventos
    await waitFor(() => {
      expect(storageService.get).toHaveBeenCalled();
    });
    
    // Verificar que storageService.get fue llamado con STORAGE_KEYS.EVENTS
    expect(storageService.get).toHaveBeenCalledWith(STORAGE_KEYS.EVENTS, []);
    
    // Crear un nuevo evento para verificar el uso de la constante en set
    const timeSlots = document.querySelectorAll('.calendar-time-slot');
    fireEvent.click(timeSlots[11]); // Clic en la hora 11
    
    // Esperar a que se abra el formulario
    await waitFor(() => {
      expect(document.querySelector('.ui-dialog')).toBeInTheDocument();
    });
    
    // Completar y guardar el formulario
    const titleInput = screen.getByLabelText(/título/i);
    fireEvent.change(titleInput, { target: { value: 'Evento para constantes' } });
    
    // Limpiar mock antes de guardar
    storageService.set.mockClear();
    
    const saveButton = screen.getByText(/guardar/i);
    fireEvent.click(saveButton);
    
    // Verificar que storageService.set fue llamado con STORAGE_KEYS.EVENTS
    await waitFor(() => {
      expect(storageService.set).toHaveBeenCalled();
      
      // Verificar que el primer parámetro es STORAGE_KEYS.EVENTS
      const [key] = storageService.set.mock.calls[0];
      expect(key).toBe(STORAGE_KEYS.EVENTS);
    });
  });

  test('12.4 Las constantes EVENT_OPERATIONS se utilizan correctamente en las publicaciones de eventos', async () => {
    // Verificar que las constantes están definidas correctamente
    expect(EVENT_OPERATIONS).toBeDefined();
    expect(EVENT_OPERATIONS.CREATE).toBe('create');
    expect(EVENT_OPERATIONS.UPDATE).toBe('update');
    expect(EVENT_OPERATIONS.DELETE).toBe('delete');
    
    // Renderizar CalendarMain
    render(<CalendarMain />);
    
    // Esperar a que se monte el componente
    await waitFor(() => {
      expect(document.querySelector('.calendar-container')).toBeInTheDocument();
    });
    
    // Crear un nuevo evento
    const timeSlots = document.querySelectorAll('.calendar-time-slot');
    fireEvent.click(timeSlots[9]); // Clic en la hora 9
    
    // Esperar a que se abra el formulario
    await waitFor(() => {
      expect(document.querySelector('.ui-dialog')).toBeInTheDocument();
    });
    
    // Completar el formulario
    const titleInput = screen.getByLabelText(/título/i);
    fireEvent.change(titleInput, { target: { value: 'Evento para operaciones' } });
    
    // Limpiar mock antes de guardar
    mockPublish.mockClear();
    
    // Guardar el evento
    const saveButton = screen.getByText(/guardar/i);
    fireEvent.click(saveButton);
    
    // Verificar que se publicó un evento CREATE
    await waitFor(() => {
      expect(mockPublish).toHaveBeenCalled();
      
      // Buscar la llamada con el patrón de CREATE
      const createCall = mockPublish.mock.calls.find(
        call => call[0] && call[0].includes(EVENT_OPERATIONS.CREATE)
      );
      
      expect(createCall).toBeTruthy();
      expect(createCall[1].title).toBe('Evento para operaciones');
    });
  });

  test('12.5 Las constantes CALENDAR_VIEWS, SNAP_VALUES y STORAGE_KEYS tienen los valores esperados', () => {
    // Este test verifica que las constantes tienen los valores esperados,
    // para asegurar que no cambien accidentalmente en el futuro
    
    // CALENDAR_VIEWS
    expect(CALENDAR_VIEWS).toEqual({
      DAY: 'day',
      WEEK: 'week',
      MONTH: 'month'
    });
    
    // SNAP_VALUES
    expect(SNAP_VALUES).toEqual({
      NONE: 0,
      PRECISE: 15,
      MEDIUM: 30,
      BASIC: 60
    });
    
    // STORAGE_KEYS
    expect(STORAGE_KEYS).toEqual({
      EVENTS: 'atlas_events',
      SETTINGS: 'atlas_settings',
      THEME: 'atlas_theme',
      SNAP_VALUE: 'atlas_snap_value'
    });
    
    // EVENT_OPERATIONS
    expect(EVENT_OPERATIONS).toEqual({
      CREATE: 'create',
      UPDATE: 'update',
      DELETE: 'delete'
    });
  });
});