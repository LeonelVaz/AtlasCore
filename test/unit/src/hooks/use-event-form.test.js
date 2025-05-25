// test/unit/src/hooks/use-event-form.test.jsx

/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';

// Mocks ANTES de la importación del hook
jest.mock('../../../../src/utils/date-utils', () => ({
  formatDateForInput: jest.fn((date) => {
    if (date instanceof Date && !isNaN(date.valueOf())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    return '';
  }),
}));

// Importar el hook DESPUÉS de los mocks
import useEventForm from '../../../../src/hooks/use-event-form';
// Importar mocks para aserciones (DESPUÉS de jest.mock)
const dateUtils = require('../../../../src/utils/date-utils');


describe('useEventForm Hook', () => {
  let mockCreateEvent;
  let mockUpdateEvent;
  let mockDeleteEvent;
  let originalConsoleError;

  const mockAllEventsData = [
    { id: 'event1', title: 'Existing Event 1', start: new Date(2023, 0, 15, 10, 0).toISOString(), end: new Date(2023, 0, 15, 11, 0).toISOString(), color: '#ff0000' },
    { id: 'event2', title: 'Existing Event 2', start: new Date(2023, 0, 15, 12, 0).toISOString(), end: new Date(2023, 0, 15, 13, 0).toISOString(), color: '#00ff00' },
  ];
  const maxSimultaneousEvents = 3;


  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateEvent = jest.fn();
    mockUpdateEvent = jest.fn();
    mockDeleteEvent = jest.fn();

    originalConsoleError = console.error;
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  test('debe inicializar con estado por defecto', () => {
    const { result } = renderHook(() => useEventForm(mockCreateEvent, mockUpdateEvent, mockDeleteEvent));
    expect(result.current.selectedEvent).toBeNull();
    expect(result.current.showEventForm).toBe(false);
    expect(result.current.formError).toBe('');
    expect(result.current.newEvent.title).toBe('');
    expect(result.current.newEvent.color).toBe('#2d4b94');
  });

  describe('handleCellClick', () => {
    test('debe preparar un nuevo evento y mostrar el formulario (con fecha y hora)', () => {
      const { result } = renderHook(() => useEventForm(mockCreateEvent, mockUpdateEvent, mockDeleteEvent));
      const day = new Date(2023, 0, 15);
      const hour = 9;

      act(() => { result.current.handleCellClick(day, hour, 0, 60); });

      expect(result.current.showEventForm).toBe(true);
      expect(result.current.selectedEvent).toBeNull();
      expect(result.current.newEvent.title).toBe('Nuevo evento');
      
      const expectedStartDate = new Date(2023, 0, 15, 9, 0, 0);
      const expectedEndDate = new Date(2023, 0, 15, 10, 0, 0);
      
      expect(result.current.newEvent.start).toBe(expectedStartDate.toISOString());
      expect(result.current.newEvent.end).toBe(expectedEndDate.toISOString());
      expect(dateUtils.formatDateForInput).toHaveBeenCalledWith(expectedStartDate);
      expect(dateUtils.formatDateForInput).toHaveBeenCalledWith(expectedEndDate);
    });

    test('debe usar la fecha completa si el argumento day ya incluye hora/minutos', () => {
      const { result } = renderHook(() => useEventForm(mockCreateEvent, mockUpdateEvent, mockDeleteEvent));
      const specificDateTime = new Date(2023, 0, 15, 14, 30, 0);

      act(() => { result.current.handleCellClick(specificDateTime, 0, 0, 30); });

      const expectedEndDate = new Date(specificDateTime.getTime() + 30 * 60 * 1000);

      expect(result.current.newEvent.start).toBe(specificDateTime.toISOString());
      expect(result.current.newEvent.end).toBe(expectedEndDate.toISOString());
      expect(dateUtils.formatDateForInput).toHaveBeenCalledWith(specificDateTime);
      expect(dateUtils.formatDateForInput).toHaveBeenCalledWith(expectedEndDate);
    });
  });

  describe('handleEventClick', () => {
    test('debe cargar un evento existente y mostrar el formulario', () => {
      const { result } = renderHook(() => useEventForm(mockCreateEvent, mockUpdateEvent, mockDeleteEvent));
      const eventToLoad = mockAllEventsData[0];

      act(() => { result.current.handleEventClick(eventToLoad); });

      expect(result.current.showEventForm).toBe(true);
      expect(result.current.selectedEvent).toEqual(eventToLoad);
      expect(result.current.newEvent.id).toBe(eventToLoad.id);
      expect(result.current.newEvent.title).toBe(eventToLoad.title);
      expect(result.current.newEvent.color).toBe(eventToLoad.color);
      expect(dateUtils.formatDateForInput).toHaveBeenCalledWith(new Date(eventToLoad.start));
      expect(dateUtils.formatDateForInput).toHaveBeenCalledWith(new Date(eventToLoad.end));
    });
  });

  describe('handleEventFormChange', () => {
    test('debe actualizar el estado de newEvent para título y color', () => {
      const { result } = renderHook(() => useEventForm(mockCreateEvent, mockUpdateEvent, mockDeleteEvent));
      act(() => { result.current.handleCellClick(new Date(), 9); });

      act(() => { result.current.handleEventFormChange({ target: { name: 'title', value: 'Nuevo Título' } }); });
      expect(result.current.newEvent.title).toBe('Nuevo Título');

      act(() => { result.current.handleEventFormChange({ target: { name: 'color', value: '#0000ff' } }); });
      expect(result.current.newEvent.color).toBe('#0000ff');
    });

    test('debe actualizar el estado de newEvent para fechas', () => {
        const { result } = renderHook(() => useEventForm(mockCreateEvent, mockUpdateEvent, mockDeleteEvent));
        act(() => { result.current.handleCellClick(new Date(), 9); });
  
        const newStartTimeString = '2023-01-15T10:30';
        // La entrada es local, el hook la convierte a ISO (UTC)
        const expectedISOForHookStart = new Date(newStartTimeString).toISOString(); 
        act(() => {
          result.current.handleEventFormChange({ target: { name: 'start', value: newStartTimeString } });
        });
        expect(result.current.newEvent.start).toBe(expectedISOForHookStart);
        expect(result.current.newEvent.startFormatted).toBe(newStartTimeString);
  
        const newEndTimeString = '2023-01-15T11:45';
        const expectedISOForHookEnd = new Date(newEndTimeString).toISOString();
        act(() => {
          result.current.handleEventFormChange({ target: { name: 'end', value: newEndTimeString } });
        });
        expect(result.current.newEvent.end).toBe(expectedISOForHookEnd);
        expect(result.current.newEvent.endFormatted).toBe(newEndTimeString);
      });
  });

  describe('handleSaveEvent', () => {
    test('debe llamar a createEvent para un nuevo evento válido', () => {
      const { result } = renderHook(() => useEventForm(mockCreateEvent, mockUpdateEvent, mockDeleteEvent, [], maxSimultaneousEvents));
      act(() => { result.current.handleCellClick(new Date(2023, 0, 16), 10); });
      act(() => { result.current.handleEventFormChange({ target: { name: 'title', value: 'Evento Guardado' } }); });

      act(() => { result.current.handleSaveEvent(); });

      expect(mockCreateEvent).toHaveBeenCalledWith(expect.objectContaining({ title: 'Evento Guardado' }));
      expect(result.current.showEventForm).toBe(false);
      expect(result.current.formError).toBe('');
    });

    test('debe llamar a updateEvent para un evento existente válido', () => {
      const { result } = renderHook(() => useEventForm(mockCreateEvent, mockUpdateEvent, mockDeleteEvent, mockAllEventsData, maxSimultaneousEvents));
      act(() => { result.current.handleEventClick(mockAllEventsData[0]); });
      act(() => { result.current.handleEventFormChange({ target: { name: 'title', value: 'Evento Modificado' } }); });

      act(() => { result.current.handleSaveEvent(); });

      expect(mockUpdateEvent).toHaveBeenCalledWith(mockAllEventsData[0].id, expect.objectContaining({ title: 'Evento Modificado' }));
      expect(result.current.showEventForm).toBe(false);
      expect(result.current.formError).toBe('');
    });

    test('debe mostrar error y no guardar si el título está vacío', () => {
      const { result } = renderHook(() => useEventForm(mockCreateEvent, mockUpdateEvent, mockDeleteEvent));
      act(() => result.current.handleCellClick(new Date(), 9));
      act(() => result.current.handleEventFormChange({ target: { name: 'title', value: '  ' } }));
      act(() => result.current.handleSaveEvent());

      expect(result.current.formError).toBe('El título del evento no puede estar vacío');
      expect(mockCreateEvent).not.toHaveBeenCalled();
    });

    test('debe mostrar error y no guardar si la fecha de fin es anterior a la de inicio', () => {
      const { result } = renderHook(() => useEventForm(mockCreateEvent, mockUpdateEvent, mockDeleteEvent));
      act(() => result.current.handleCellClick(new Date(), 9));
      act(() => { result.current.handleEventFormChange({ target: { name: 'title', value: 'Test Fechas' } }); });
      
      act(() => {
        result.current.handleEventFormChange({ target: { name: 'start', value: dateUtils.formatDateForInput(new Date(2023,0,15,11,0)) } });
      });
      act(() => {
        result.current.handleEventFormChange({ target: { name: 'end', value: dateUtils.formatDateForInput(new Date(2023,0,15,10,0)) } });
      });

      act(() => result.current.handleSaveEvent());

      expect(result.current.formError).toBe('La hora de fin no puede ser anterior a la hora de inicio');
      expect(mockCreateEvent).not.toHaveBeenCalled();
    });

    test('debe mostrar error si se excede el límite de eventos simultáneos al crear', () => {
        // Definir horas como LOCALES, el hook las convertirá a ISO (UTC) para la comparación
        const localTime1000 = new Date(2023, 0, 20, 10, 0, 0);
        const localTime1015 = new Date(2023, 0, 20, 10, 15, 0);
        const localTime1030 = new Date(2023, 0, 20, 10, 30, 0);
        const localTime1045 = new Date(2023, 0, 20, 10, 45, 0); // Para el nuevo evento

        const threeEvents = [
            { id: 'e1', start: localTime1000.toISOString(), end: new Date(localTime1000.getTime() + 60*60000).toISOString() },
            { id: 'e2', start: localTime1015.toISOString(), end: new Date(localTime1015.getTime() + 60*60000).toISOString() },
            { id: 'e3', start: localTime1030.toISOString(), end: new Date(localTime1030.getTime() + 60*60000).toISOString() },
        ];
        const { result } = renderHook(() => useEventForm(mockCreateEvent, mockUpdateEvent, mockDeleteEvent, threeEvents, 3));
        
        // Simular la apertura del formulario Y el llenado de datos para un nuevo evento LOCAL
        act(() => {
            // Llamar a handleCellClick para inicializar newEvent.id a '' y otras propiedades.
            // Usamos una fecha que no solape para la inicialización, luego la sobrescribimos.
            result.current.handleCellClick(new Date(2023,0,19), 9); 
        });
        act(() => {
            result.current.handleEventFormChange({ target: { name: 'title', value: 'Conflicting Event' }});
            result.current.handleEventFormChange({ target: { name: 'start', value: dateUtils.formatDateForInput(localTime1045) }});
            result.current.handleEventFormChange({ target: { name: 'end', value: dateUtils.formatDateForInput(new Date(localTime1045.getTime() + 60*60000)) }});
            result.current.handleEventFormChange({ target: { name: 'color', value: '#2d4b94' }});
        });

        act(() => result.current.handleSaveEvent());

        expect(result.current.formError).toBe(`No se puede crear el evento: excedería el límite de ${maxSimultaneousEvents} eventos simultáneos`);
        expect(mockCreateEvent).not.toHaveBeenCalled();
    });

    test('NO debe mostrar error de límite si se edita un evento sin cambiar su tiempo', () => {
        const localTime1000 = new Date(2023, 0, 20, 10, 0, 0);
        const localTime1015 = new Date(2023, 0, 20, 10, 15, 0);
        const localTime1030 = new Date(2023, 0, 20, 10, 30, 0);

        const threeEventsIncludingSelected = [
            { id: 'event1', title: 'Event 1', start: localTime1000.toISOString(), end: new Date(localTime1000.getTime() + 60*60000).toISOString(), color: '#ff0000' },
            { id: 'e2', start: localTime1015.toISOString(), end: new Date(localTime1015.getTime() + 60*60000).toISOString(), color: '#00ff00' },
            { id: 'e3', start: localTime1030.toISOString(), end: new Date(localTime1030.getTime() + 60*60000).toISOString(), color: '#0000ff' },
        ];
        const { result } = renderHook(() => useEventForm(mockCreateEvent, mockUpdateEvent, mockDeleteEvent, threeEventsIncludingSelected, 3));
        
        act(() => { result.current.handleEventClick(threeEventsIncludingSelected[0]); }); // Carga event1 para editar
        act(() => { result.current.handleEventFormChange({ target: { name: 'title', value: 'Título Cambiado' } }); }); // Solo cambia el título
        
        act(() => { result.current.handleSaveEvent(); });

        expect(result.current.formError).toBe('');
        expect(mockUpdateEvent).toHaveBeenCalledWith(threeEventsIncludingSelected[0].id, expect.objectContaining({ title: 'Título Cambiado' }));
    });
  });

  describe('handleDeleteEvent', () => {
    test('debe llamar a deleteEvent si hay un evento seleccionado', () => {
      const { result } = renderHook(() => useEventForm(mockCreateEvent, mockUpdateEvent, mockDeleteEvent));
      act(() => result.current.handleEventClick(mockAllEventsData[0]));

      act(() => result.current.handleDeleteEvent());

      expect(mockDeleteEvent).toHaveBeenCalledWith(mockAllEventsData[0].id);
      expect(result.current.showEventForm).toBe(false);
    });

    test('no debe llamar a deleteEvent si no hay evento seleccionado', () => {
        const { result } = renderHook(() => useEventForm(mockCreateEvent, mockUpdateEvent, mockDeleteEvent));
        act(() => result.current.handleDeleteEvent());
        expect(mockDeleteEvent).not.toHaveBeenCalled();
      });
  });

  test('handleCloseForm debe resetear el estado', () => {
    const { result } = renderHook(() => useEventForm(mockCreateEvent, mockUpdateEvent, mockDeleteEvent));
    act(() => result.current.handleEventClick(mockAllEventsData[0]));
    
    expect(result.current.showEventForm).toBe(true);

    act(() => result.current.handleCloseForm());

    expect(result.current.showEventForm).toBe(false);
    expect(result.current.selectedEvent).toBeNull();
    expect(result.current.newEvent.title).toBe('');
    expect(result.current.formError).toBe('');
  });
});