import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CALENDAR_VIEWS, SNAP_VALUES, STORAGE_KEYS } from '../../../../../src/core/config/constants';

// --- MOCKS DE SERVICIOS Y MÓDULOS ---
jest.mock('../../../../../src/services/storage-service', () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

jest.mock('../../../../../src/core/bus/event-bus', () => ({
  subscribe: jest.fn().mockReturnValue(jest.fn()),
  publish: jest.fn(),
  setDebugMode: jest.fn(), // Añadido por si es usado
  getActiveEvents: jest.fn().mockReturnValue([]), // Añadido por si es usado
  getSubscriberCount: jest.fn().mockReturnValue(0), // Añadido por si es usado
}));

jest.mock('../../../../../src/core/modules/calendar-module', () => ({
  init: jest.fn(),
  getEventsForDate: jest.fn(),
  getEventsForDateRange: jest.fn(),
  getUpcomingEvents: jest.fn(),
  getMonthMetadata: jest.fn(),
}));

jest.mock('../../../../../src/core/modules/module-registry', () => ({
  registerModule: jest.fn(),
  unregisterModule: jest.fn(),
}));

jest.mock('../../../../../src/utils/debug-utils', () => ({
  setupDebugTools: jest.fn().mockReturnValue(jest.fn()),
}));

// --- MOCKS DE COMPONENTES HIJOS ---
jest.mock('../../../../../src/components/calendar/week-view', () => jest.fn(({ onEventClick, onCellClick, onUpdateEvent, maxSimultaneousEvents, snapValue, events, currentDate }) => (
  <div data-testid="week-view-mock">
    Week View - MaxSim: {maxSimultaneousEvents} - Snap: {snapValue} - Events: {events.length} - Date: {currentDate.toISOString()}
    <button data-testid="week-event-click" onClick={() => onEventClick({ id: 'event1', title: 'Test Event Week', start: new Date().toISOString(), end: new Date(Date.now() + 3600000).toISOString() })}>Simulate Week Event Click</button>
    <button data-testid="week-cell-click" onClick={() => onCellClick(new Date(), 9, 0, 60)}>Simulate Week Cell Click</button>
    <button data-testid="week-update-event" onClick={() => onUpdateEvent('event1-id', { title: 'Updated Week Event' })}>Simulate Week Update Event</button>
  </div>
)));

jest.mock('../../../../../src/components/calendar/day-view', () => jest.fn(({ onEventClick, onTimeSlotClick, onUpdate, maxSimultaneousEvents, snapValue, events, date }) => (
  <div data-testid="day-view-mock">
    Day View - MaxSim: {maxSimultaneousEvents} - Snap: {snapValue} - Events: {events.length} - Date: {date.toISOString()}
    <button data-testid="day-event-click" onClick={() => onEventClick({ id: 'event2', title: 'Test Event Day', start: new Date().toISOString(), end: new Date(Date.now() + 3600000).toISOString() })}>Simulate Day Event Click</button>
    <button data-testid="day-cell-click" onClick={() => onTimeSlotClick(new Date(), 10, 30, 30)}>Simulate Day Cell Click</button>
    <button data-testid="day-update-event" onClick={() => onUpdate('event2-id', { title: 'Updated Day Event' })}>Simulate Day Update Event</button>
  </div>
)));

jest.mock('../../../../../src/components/calendar/event-form', () => jest.fn(({ onSave, onClose, onDelete, onChange, event, isEditing, error }) => (
  <div data-testid="event-form-mock">
    Event Form: {isEditing ? 'Editing' : 'New'} - Title: {event?.title} {error ? `- Error: ${error}` : ''}
    <button data-testid="form-save" onClick={onSave}>Save</button>
    <button data-testid="form-close" onClick={onClose}>Close</button>
    {isEditing && <button data-testid="form-delete" onClick={onDelete}>Delete</button>}
    <input data-testid="form-title-input" type="text" name="title" defaultValue={event?.title || ''} onChange={onChange} />
    <input data-testid="form-start-input" type="datetime-local" name="start" defaultValue={event?.startFormatted || ''} onChange={onChange} />
    <input data-testid="form-end-input" type="datetime-local" name="end" defaultValue={event?.endFormatted || ''} onChange={onChange} />
  </div>
)));

jest.mock('../../../../../src/components/calendar/snap-control', () => {
  const { SNAP_VALUES: ImportedSnapValues } = require('../../../../../src/core/config/constants');
  return jest.fn(({ snapValue, onSnapChange }) => (
    <div data-testid="snap-control-mock">
      Snap: {snapValue}
      <button data-testid="snap-change-button" onClick={() => onSnapChange(ImportedSnapValues.MEDIUM)}>Set Snap Medium</button>
    </div>
  ));
});

jest.mock('../../../../../src/components/ui/button', () => jest.fn(({ children, onClick, variant, isActive, 'aria-label': ariaLabel, size, disabled, title }) => (
  <button onClick={onClick} data-variant={variant} data-active={isActive} aria-label={ariaLabel} data-size={size} disabled={disabled} title={title}>
    {children}
  </button>
)));

// --- MOCKS DE HOOKS ---
const mockCreateEvent = jest.fn().mockResolvedValue({ id: 'newEventId' });
const mockUpdateEvent = jest.fn().mockResolvedValue({ id: 'updatedEventId' });
const mockDeleteEvent = jest.fn().mockResolvedValue(true);
const mockGetEvents = jest.fn().mockResolvedValue([]);
const mockSaveEvents = jest.fn();

const mockHandleEventFormChange = jest.fn();
const mockHandleSaveEvent = jest.fn();
const mockHandleDeleteEvent = jest.fn();
const mockHandleCloseForm = jest.fn();
const mockHandleEventClick = jest.fn();
const mockHandleCellClick = jest.fn();

const mockSetSelectedDay = jest.fn();
const mockGoToPreviousWeek = jest.fn();
const mockGoToNextWeek = jest.fn();
const mockGoToCurrentWeek = jest.fn();
const mockGoToPreviousDay = jest.fn();
const mockGoToNextDay = jest.fn();
const mockGoToToday = jest.fn();

jest.mock('../../../../../src/hooks/use-calendar-events', () => {
  const internalInitialMockEvents = [{ id: 'ev1', title: 'Initial Event Factory', start: new Date().toISOString(), end: new Date(Date.now() + 3600000).toISOString() }];
  return () => ({
    events: internalInitialMockEvents,
    getEvents: mockGetEvents,
    createEvent: mockCreateEvent,
    updateEvent: mockUpdateEvent,
    deleteEvent: mockDeleteEvent,
    saveEvents: mockSaveEvents,
  });
});

let mockNewEventState = {
  id: '', title: 'Nuevo evento mock', start: new Date().toISOString(), end: new Date(Date.now() + 3600000).toISOString(),
  startFormatted: '2023-01-01T10:00', endFormatted: '2023-01-01T11:00', color: '#2d4b94'
};
let mockSelectedEventState = null;
let mockShowEventFormState = false;
let mockFormErrorState = '';

jest.mock('../../../../../src/hooks/use-event-form', () => jest.fn((createEvent, updateEvent, deleteEvent, events, maxSimultaneousEvents) => ({
  selectedEvent: mockSelectedEventState,
  showEventForm: mockShowEventFormState,
  formError: mockFormErrorState,
  newEvent: mockNewEventState,
  handleEventClick: mockHandleEventClick,
  handleCellClick: mockHandleCellClick,
  handleEventFormChange: mockHandleEventFormChange,
  handleCloseForm: mockHandleCloseForm,
  handleSaveEvent: mockHandleSaveEvent,
  handleDeleteEvent: mockHandleDeleteEvent,
})));

const MOCK_CURRENT_DATE = new Date(2023, 10, 15); // 15 de Noviembre de 2023
jest.mock('../../../../../src/hooks/use-calendar-navigation', () => () => ({
  currentDate: MOCK_CURRENT_DATE,
  selectedDay: MOCK_CURRENT_DATE,
  setSelectedDay: mockSetSelectedDay,
  goToPreviousWeek: mockGoToPreviousWeek,
  goToNextWeek: mockGoToNextWeek,
  goToCurrentWeek: mockGoToCurrentWeek,
  goToPreviousDay: mockGoToPreviousDay,
  goToNextDay: mockGoToNextDay,
  goToToday: mockGoToToday,
}));

// --- IMPORTAR EL COMPONENTE A PROBAR Y MÓDULOS MOCKEADOS ---
import CalendarMain from '../../../../../src/components/calendar/calendar-main';
import { registerModule, unregisterModule } from '../../../../../src/core/modules/module-registry';
import storageService from '../../../../../src/services/storage-service';
import eventBus from '../../../../../src/core/bus/event-bus';
import { setupDebugTools } from '../../../../../src/utils/debug-utils';
import calendarModule from '../../../../../src/core/modules/calendar-module';


describe('Componente CalendarMain', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();

    mockNewEventState = {
      id: '', title: 'Nuevo evento mock', start: new Date().toISOString(), end: new Date(Date.now() + 3600000).toISOString(),
      startFormatted: '2023-01-01T10:00', endFormatted: '2023-01-01T11:00', color: '#2d4b94'
    };
    mockSelectedEventState = null;
    mockShowEventFormState = false;
    mockFormErrorState = '';
    storageService.get.mockResolvedValue(3); // Default maxSimultaneousEvents
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  test('renderiza la vista de semana por defecto y se inicializa correctamente', async () => {
    render(<CalendarMain />);
    expect(screen.getByTestId('week-view-mock')).toBeInTheDocument();
    expect(screen.getByText('Semana')).toBeInTheDocument();
    expect(screen.getByText('Día')).toBeInTheDocument();
    expect(screen.getByTestId('snap-control-mock')).toBeInTheDocument();
    expect(screen.getByText(/Noviembre de 2023/i)).toBeInTheDocument(); // Ajustado para mock de fecha

    await waitFor(() => {
      expect(storageService.get).toHaveBeenCalledWith(STORAGE_KEYS.MAX_SIMULTANEOUS_EVENTS, 3);
    });
    expect(eventBus.subscribe).toHaveBeenCalledWith('calendar.maxSimultaneousEventsChanged', expect.any(Function));
    expect(calendarModule.init).toHaveBeenCalledTimes(1);
    expect(registerModule).toHaveBeenCalledWith('calendar', expect.any(Object));
    expect(setupDebugTools).toHaveBeenCalledWith(
      expect.any(Array), 
      mockCreateEvent,
      mockUpdateEvent,
      mockSaveEvents
    );
  });

  test('cambia a la vista de día, actualiza el título y la navegación', () => {
    render(<CalendarMain />);
    calendarModule.init.mockClear();
    const dayViewButton = screen.getAllByText('Día').find(btn => btn.closest('.calendar-view-toggle'));
    expect(dayViewButton).toBeInTheDocument();
    fireEvent.click(dayViewButton);

    expect(screen.getByTestId('day-view-mock')).toBeInTheDocument();
    expect(screen.queryByTestId('week-view-mock')).not.toBeInTheDocument();
    expect(screen.getByText(/15 de noviembre de 2023/i)).toBeInTheDocument(); // Ajustado para mock de fecha
    expect(mockSetSelectedDay).toHaveBeenCalledWith(MOCK_CURRENT_DATE);
    expect(calendarModule.init).toHaveBeenCalledTimes(1);

    const prevDayButton = screen.getAllByLabelText('Día anterior')[0];
    fireEvent.click(prevDayButton);
    expect(mockGoToPreviousDay).toHaveBeenCalled();

    const todayButtonDay = screen.getAllByText('Hoy').find(btn => btn.closest('.calendar-navigation'));
    fireEvent.click(todayButtonDay);
    expect(mockGoToToday).toHaveBeenCalled();

    const nextDayButton = screen.getAllByLabelText('Día siguiente')[0];
    fireEvent.click(nextDayButton);
    expect(mockGoToNextDay).toHaveBeenCalled();
  });

  test('los botones de navegación para la vista de semana funcionan correctamente', () => {
    render(<CalendarMain />);
    const prevWeekButton = screen.getAllByLabelText('Semana anterior')[0];
    fireEvent.click(prevWeekButton);
    expect(mockGoToPreviousWeek).toHaveBeenCalled();

    const todayButtonWeek = screen.getAllByText('Hoy').find(btn => btn.closest('.calendar-navigation'));
    fireEvent.click(todayButtonWeek);
    expect(mockGoToCurrentWeek).toHaveBeenCalled();

    const nextWeekButton = screen.getAllByLabelText('Semana siguiente')[0];
    fireEvent.click(nextWeekButton);
    expect(mockGoToNextWeek).toHaveBeenCalled();
  });

  test('maneja el cambio de precisión (snap)', () => {
    render(<CalendarMain />);
    calendarModule.init.mockClear();
    fireEvent.click(screen.getByTestId('snap-change-button'));
    expect(calendarModule.init).toHaveBeenCalledTimes(1);
    expect(screen.getByText(`Snap: ${SNAP_VALUES.MEDIUM}`)).toBeInTheDocument();
  });

  describe('Interacciones del Formulario de Eventos', () => {
    beforeEach(() => {
      mockShowEventFormState = true; // Hacemos que el formulario sea visible para estos tests
    });

    test('muestra el formulario para un nuevo evento y maneja el guardado', () => {
      mockSelectedEventState = null; // Aseguramos que es un evento nuevo
      render(<CalendarMain />);
      expect(screen.getByTestId('event-form-mock')).toBeInTheDocument();
      expect(screen.getByText(/Event Form: New/)).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('form-save'));
      expect(mockHandleSaveEvent).toHaveBeenCalled();
    });

    test('muestra el formulario para editar un evento, maneja guardado y eliminación', () => {
      mockSelectedEventState = { id: 'event123', title: 'Evento Existente' };
      mockNewEventState = { // El estado del formulario se actualiza para reflejar el evento seleccionado
          id: 'event123', title: 'Evento Existente', start: new Date().toISOString(), end: new Date(Date.now() + 3600000).toISOString(),
          startFormatted: '2023-01-02T10:00', endFormatted: '2023-01-02T11:00', color: '#ff0000'
      };
      render(<CalendarMain />);
      expect(screen.getByTestId('event-form-mock')).toBeInTheDocument();
      expect(screen.getByText(/Event Form: Editing/)).toBeInTheDocument();
      expect(screen.getByText(/Title: Evento Existente/)).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('form-save'));
      expect(mockHandleSaveEvent).toHaveBeenCalled();

      expect(screen.getByTestId('form-delete')).toBeInTheDocument();
      fireEvent.click(screen.getByTestId('form-delete'));
      expect(mockHandleDeleteEvent).toHaveBeenCalled();
    });

    test('maneja el cambio de input del formulario y el cierre', () => {
      render(<CalendarMain />);
      const titleInput = screen.getByTestId('form-title-input');
      fireEvent.change(titleInput, { target: { name: 'title', value: 'Nuevo Título Ingresado' } });
      expect(mockHandleEventFormChange).toHaveBeenCalledWith(expect.objectContaining({
        target: expect.objectContaining({ name: 'title', value: 'Nuevo Título Ingresado' })
      }));

      fireEvent.click(screen.getByTestId('form-close'));
      expect(mockHandleCloseForm).toHaveBeenCalled();
    });

    test('muestra el error del formulario si está presente', () => {
        mockFormErrorState = 'Este es un error de prueba';
        render(<CalendarMain />);
        expect(screen.getByText(/Error: Este es un error de prueba/)).toBeInTheDocument();
    });
  });

  test('maneja el clic en celda desde WeekView y DayView', () => {
    render(<CalendarMain />);
    fireEvent.click(screen.getByTestId('week-cell-click'));
    expect(mockHandleCellClick).toHaveBeenCalledTimes(1);
    expect(mockHandleCellClick).toHaveBeenCalledWith(expect.any(Date), 9, 0, 60);

    const dayViewButton = screen.getAllByText('Día').find(btn => btn.closest('.calendar-view-toggle'));
    fireEvent.click(dayViewButton);
    
    fireEvent.click(screen.getByTestId('day-cell-click'));
    expect(mockHandleCellClick).toHaveBeenCalledTimes(2);
    expect(mockHandleCellClick).toHaveBeenLastCalledWith(expect.any(Date), 10, 30, 30);
  });

  test('maneja el clic en evento desde WeekView y DayView', () => {
    render(<CalendarMain />);
    fireEvent.click(screen.getByTestId('week-event-click'));
    expect(mockHandleEventClick).toHaveBeenCalledTimes(1);
    expect(mockHandleEventClick).toHaveBeenCalledWith(expect.objectContaining({ title: 'Test Event Week' }));

    const dayViewButton = screen.getAllByText('Día').find(btn => btn.closest('.calendar-view-toggle'));
    fireEvent.click(dayViewButton);

    fireEvent.click(screen.getByTestId('day-event-click'));
    expect(mockHandleEventClick).toHaveBeenCalledTimes(2);
    expect(mockHandleEventClick).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Test Event Day' }));
  });

  test('maneja la actualización de evento desde WeekView y DayView (prop de actualización directa)', () => {
    render(<CalendarMain />);
    fireEvent.click(screen.getByTestId('week-update-event'));
    expect(mockUpdateEvent).toHaveBeenCalledWith('event1-id', { title: 'Updated Week Event' });

    const dayViewButton = screen.getAllByText('Día').find(btn => btn.closest('.calendar-view-toggle'));
    fireEvent.click(dayViewButton);

    fireEvent.click(screen.getByTestId('day-update-event'));
    expect(mockUpdateEvent).toHaveBeenCalledWith('event2-id', { title: 'Updated Day Event' });
  });

  test('la API del módulo setMaxSimultaneousEvents actualiza el estado', () => {
    render(<CalendarMain />);
    const moduleApi = registerModule.mock.calls[0][1];
    calendarModule.init.mockClear();
    
    act(() => {
      moduleApi.setMaxSimultaneousEvents(5);
    });
    expect(screen.getByText(/MaxSim: 5/)).toBeInTheDocument(); // Asumiendo que el mock de WeekView/DayView renderiza esto
    expect(calendarModule.init).toHaveBeenCalledTimes(1);
  });

  test('los getters de la API del módulo llaman a las funciones del módulo subyacente o devuelven el estado', () => {
    render(<CalendarMain />);
    const moduleApi = registerModule.mock.calls[0][1];

    moduleApi.getEventsForDate(new Date());
    expect(calendarModule.getEventsForDate).toHaveBeenCalled();
    moduleApi.getEventsForDateRange(new Date(), new Date());
    expect(calendarModule.getEventsForDateRange).toHaveBeenCalled();
    moduleApi.getUpcomingEvents(5);
    expect(calendarModule.getUpcomingEvents).toHaveBeenCalled();
    moduleApi.getMonthMetadata(10); // Mes de Noviembre (0-indexed)
    expect(calendarModule.getMonthMetadata).toHaveBeenCalled();

    expect(moduleApi.getCurrentView()).toBe(CALENDAR_VIEWS.WEEK);
    expect(moduleApi.getSelectedDate()).toEqual(MOCK_CURRENT_DATE);
    moduleApi.getEvents();
    expect(mockGetEvents).toHaveBeenCalled();
  });
  
  test('maneja errores al cargar maxSimultaneousEvents desde el almacenamiento', async () => {
    storageService.get.mockRejectedValueOnce(new Error('Storage Failed'));
    render(<CalendarMain />);
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Error al cargar configuración de eventos simultáneos:', expect.any(Error));
    });
    // Verifica que el valor por defecto (3) se usa
    expect(screen.getByText(/MaxSim: 3/)).toBeInTheDocument();
  });

  test('la suscripción de eventBus para maxSimultaneousEventsChanged funciona', async () => {
    render(<CalendarMain />);
    expect(calendarModule.init).toHaveBeenCalledTimes(1); 
    calendarModule.init.mockClear(); 

    const busSubscriptionCall = eventBus.subscribe.mock.calls.find(call => call[0] === 'calendar.maxSimultaneousEventsChanged');
    expect(busSubscriptionCall).toBeDefined();
    const busCallback = busSubscriptionCall[1];
    
    act(() => {
      busCallback({ value: 7 });
    });
    
    expect(screen.getByText(/MaxSim: 7/)).toBeInTheDocument();
    expect(calendarModule.init).toHaveBeenCalledTimes(1); 
  });

  test('se desuscribe de eventBus y desregistra el módulo al desmontar', () => {
    const { unmount } = render(<CalendarMain />);
    const unsubscribeEventBusMock = eventBus.subscribe.mock.results[0].value; // La función de desuscripción
    const unsubscribeDebugToolsMock = setupDebugTools.mock.results[0].value; // La función de limpieza de debug tools

    unmount();
    expect(unsubscribeEventBusMock).toHaveBeenCalledTimes(1);
    expect(unregisterModule).toHaveBeenCalledWith('calendar');
    expect(unsubscribeDebugToolsMock).toHaveBeenCalledTimes(1);
  });

   test('toggleView con argumento de fecha llama a setSelectedDay', () => {
    render(<CalendarMain />);
    const dayViewButton = screen.getAllByText('Día').find(btn => btn.closest('.calendar-view-toggle'));
    fireEvent.click(dayViewButton); // Esto ya llama a toggleView con la currentDate
    expect(mockSetSelectedDay).toHaveBeenCalledWith(MOCK_CURRENT_DATE);
  });

  test('cubre console.error en useEffect para maxSimultaneousEvents (caso parseInt NaN)', async () => {
    storageService.get.mockResolvedValue("not-a-number");
    render(<CalendarMain />);
    await waitFor(() => {
        expect(storageService.get).toHaveBeenCalled();
    });
    // Debe usar el valor por defecto de 3 si el valor almacenado no es un número válido
    expect(screen.getByText(/MaxSim: 3/)).toBeInTheDocument(); 
  });

  test('cubre moduleAPI.setMaxSimultaneousEvents con valores inválidos', () => {
    render(<CalendarMain />);
    const moduleApi = registerModule.mock.calls[0][1];
    calendarModule.init.mockClear();
    
    act(() => {
      expect(moduleApi.setMaxSimultaneousEvents(0)).toBe(1); // Debe ser clampado a 1
    });
    expect(screen.getByText(/MaxSim: 1/)).toBeInTheDocument();
    expect(calendarModule.init).toHaveBeenCalledTimes(1);
    calendarModule.init.mockClear();

    act(() => {
      expect(moduleApi.setMaxSimultaneousEvents(20)).toBe(10); // Debe ser clampado a 10
    });
    expect(screen.getByText(/MaxSim: 10/)).toBeInTheDocument();
    expect(calendarModule.init).toHaveBeenCalledTimes(1);
  });
});