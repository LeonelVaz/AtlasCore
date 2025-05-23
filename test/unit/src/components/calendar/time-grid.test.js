// test/unit/components/calendar/time-grid.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TimeGrid from '../../../../../src/components/calendar/time-grid';
import { TimeScaleContext } from '../../../../../src/contexts/time-scale-context';
import { TIME_SCALES } from '../../../../../src/core/config/constants';

// Mock child components and hooks
jest.mock('../../../../../src/components/calendar/event-item', () => {
  return jest.fn(({ event, onClick, onUpdate, continuesNextDay, continuesFromPrevDay, isMicroEvent }) => (
    <div
      data-testid={`event-item-${event.id}`}
      onClick={() => onClick(event)}
      data-continues-next={continuesNextDay}
      data-continues-prev={continuesFromPrevDay}
      data-micro={isMicroEvent}
    >
      {event.title}
      <button onClick={() => onUpdate({ ...event, title: "Updated" })}>Update</button>
    </div>
  ));
});

const mockUseTimeGrid = {
  hours: Array.from({ length: 24 }, (_, i) => i), // 0-23
  customSlots: {},
  shouldShowEventStart: jest.fn((event, day, hour, minutes, duration) => {
    const eventStart = new Date(event.start);
    return eventStart.getHours() === hour && eventStart.getMinutes() >= minutes && eventStart.getMinutes() < (minutes + duration);
  }),
  isEventActiveAtStartOfDay: jest.fn((event, day) => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    const dayStart = new Date(day);
    dayStart.setHours(0,0,0,0);
    return eventStart < dayStart && eventEnd > dayStart;
  }),
  formatTimeSlot: jest.fn((hour, minutes = 0) => `${hour}:${minutes.toString().padStart(2, '0')}`),
  addCustomTimeSlot: jest.fn(),
  removeCustomTimeSlot: jest.fn(),
  canAddIntermediateSlot: jest.fn(() => true),
  canAddIntermediateSlotAt15: jest.fn(() => true),
  getEventPositionInSlot: jest.fn(() => ({ offsetPixels: 0 })),
  eventsOverlapInTimeSlot: jest.fn(() => false),
};
jest.mock('../../../../../src/hooks/use-time-grid', () => jest.fn(() => mockUseTimeGrid));


// Mock ExtensionPoint
const MockExtensionComponent = jest.fn(({ date, hour, minutes, pluginId, extensionId }) => (
  <div data-testid={`extension-${pluginId}-${extensionId}`}>
    Ext: {pluginId}/{extensionId} for {date?.toISOString().split('T')[0]}
    {/* Solo mostrar H: y M: si hour/minutes están definidos y no son null (0 es válido) */}
    {hour !== undefined && hour !== null ? ` H:${hour}` : ''}
    {minutes !== undefined && minutes !== null ? ` M:${minutes}` : ''}
  </div>
));

jest.mock('../../../../../src/components/plugin-extension/extension-point', () => {
  const { PLUGIN_CONSTANTS } = require('../../../../../src/core/config/constants');
  return jest.fn(({ zoneId, render, fallback }) => {
    if (zoneId === PLUGIN_CONSTANTS.UI_EXTENSION_ZONES.CALENDAR_DAY_HEADER ||
        zoneId === PLUGIN_CONSTANTS.UI_EXTENSION_ZONES.CALENDAR_HOUR_CELL) {
      const mockExtensions = [
        { id: 'ext-dh-1', pluginId: 'pluginDayHeader', component: MockExtensionComponent, props: {} },
      ];
      return render(mockExtensions);
    }
    return fallback || null;
  });
});


describe('TimeGrid Component', () => {
  const mockDays = [new Date(2023, 0, 2), new Date(2023, 0, 3)];
  const mockEvents = [
    { id: 'ev1', title: 'Event 1', start: new Date(2023, 0, 2, 10, 0).toISOString(), end: new Date(2023, 0, 2, 11, 0).toISOString() },
    { id: 'ev2', title: 'Event Cont', start: new Date(2023, 0, 1, 22, 0).toISOString(), end: new Date(2023, 0, 2, 2, 0).toISOString() },
  ];
  const mockOnEventClick = jest.fn();
  const mockOnCellClick = jest.fn();
  const mockOnUpdateEvent = jest.fn();
  const mockRenderDayHeader = jest.fn(day => `Header for ${day.getDate()}`);
  const mockTimeScaleContextValue = {
    currentTimeScale: TIME_SCALES.STANDARD,
    setTimeScaleById: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTimeGrid.customSlots = {};
    // Restablecer implementaciones de mocks si es necesario para cada test
    mockUseTimeGrid.shouldShowEventStart.mockImplementation((event, day, hour, minutes, duration) => {
        const eventStart = new Date(event.start);
        // Asegurarse que la comparación de fechas sea solo por día, mes, año
        const eventDay = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
        const compareDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        return eventDay.getTime() === compareDay.getTime() && eventStart.getHours() === hour && eventStart.getMinutes() >= minutes && eventStart.getMinutes() < (minutes + duration);
    });
    mockUseTimeGrid.isEventActiveAtStartOfDay.mockImplementation((event, day) => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
        return eventStart < dayStart && eventEnd > dayStart;
    });
    mockUseTimeGrid.eventsOverlapInTimeSlot.mockReturnValue(false);
    mockUseTimeGrid.getEventPositionInSlot.mockReturnValue({ offsetPixels: 0 });
    mockUseTimeGrid.canAddIntermediateSlot.mockReturnValue(true); // Resetear por si un test lo cambia
    mockUseTimeGrid.canAddIntermediateSlotAt15.mockReturnValue(true);
  });

  const renderWithContext = (component) => {
    return render(
      <TimeScaleContext.Provider value={mockTimeScaleContextValue}>
        {component}
      </TimeScaleContext.Provider>
    );
  };

  test('renders grid structure with headers and time slots', () => {
    renderWithContext(
      <TimeGrid
        days={mockDays}
        events={mockEvents}
        onEventClick={mockOnEventClick}
        onCellClick={mockOnCellClick}
        onUpdateEvent={mockOnUpdateEvent}
        snapValue={0}
        renderDayHeader={mockRenderDayHeader}
        maxSimultaneousEvents={3}
      />
    );

    expect(screen.getAllByTestId('calendar-day-header')).toHaveLength(mockDays.length);
    mockDays.forEach(day => {
      expect(mockRenderDayHeader).toHaveBeenCalledWith(day);
      expect(screen.getByText(`Header for ${day.getDate()}`)).toBeInTheDocument();
    });

    mockUseTimeGrid.hours.forEach(hour => {
        const hourRegex = new RegExp(`^${hour}:00$`);
        expect(screen.getByText(hourRegex)).toBeInTheDocument();
    });

    expect(screen.getAllByTestId('calendar-time-slot')).toHaveLength(mockUseTimeGrid.hours.length * mockDays.length);
  });

  test('renders events correctly', () => {
     mockUseTimeGrid.shouldShowEventStart.mockImplementation((event, day, hour, minutes, duration) => {
        return event.id === 'ev1' && day.getDate() === 2 && hour === 10;
    });

    renderWithContext(
      <TimeGrid days={mockDays} events={mockEvents} renderDayHeader={mockRenderDayHeader} onUpdateEvent={mockOnUpdateEvent} onEventClick={mockOnEventClick} onCellClick={mockOnCellClick}/>
    );
    expect(screen.getByTestId('event-item-ev1')).toBeInTheDocument();
    expect(screen.getByText('Event 1')).toBeInTheDocument();
  });

  test('renders continuing events correctly', () => {
     mockUseTimeGrid.isEventActiveAtStartOfDay.mockImplementation((event, day) => {
      return event.id === 'ev2' && day.getDate() === 2;
    });
     mockUseTimeGrid.shouldShowEventStart.mockReturnValue(false);

    renderWithContext(
      <TimeGrid days={mockDays} events={mockEvents} renderDayHeader={mockRenderDayHeader} onUpdateEvent={mockOnUpdateEvent} onEventClick={mockOnEventClick} onCellClick={mockOnCellClick}/>
    );
    const eventItem = screen.getByTestId('event-item-ev2');
    expect(eventItem).toBeInTheDocument();
    expect(screen.getByText('Event Cont')).toBeInTheDocument();
    expect(eventItem).toHaveAttribute('data-continues-prev', 'true');
  });

  test('handles cell clicks', () => {
    renderWithContext(
      <TimeGrid days={mockDays} events={[]} onCellClick={mockOnCellClick} renderDayHeader={mockRenderDayHeader} onEventClick={mockOnEventClick} onUpdateEvent={mockOnUpdateEvent}/>
    );
    const nineAmCells = screen.getAllByTestId('calendar-time-slot').filter(cell => cell.dataset.hour === "9");
    fireEvent.click(nineAmCells[0]);

    const expectedDate = new Date(mockDays[0]);
    expectedDate.setHours(9, 0, 0, 0);
    expect(mockOnCellClick).toHaveBeenCalledWith(expectedDate, 9, 0, 60);
  });

  test('handles event clicks and updates', () => {
     mockUseTimeGrid.shouldShowEventStart.mockImplementation((event, day, hour, minutes, duration) => {
        return event.id === 'ev1' && day.getDate() === 2 && hour === 10;
    });
    renderWithContext(
      <TimeGrid days={mockDays} events={mockEvents} onEventClick={mockOnEventClick} onUpdateEvent={mockOnUpdateEvent} renderDayHeader={mockRenderDayHeader} onCellClick={mockOnCellClick}/>
    );
    const eventItem = screen.getByTestId('event-item-ev1');
    fireEvent.click(eventItem);
    expect(mockOnEventClick).toHaveBeenCalledWith(mockEvents.find(e => e.id === 'ev1'));

    const updateButton = within(eventItem).getByText('Update');
    fireEvent.click(updateButton);
    expect(mockOnUpdateEvent).toHaveBeenCalledWith(mockEvents.find(e => e.id === 'ev1').id, expect.objectContaining({ title: "Updated" }));
  });

  test('renders custom time slots and handles add/remove', () => {
    mockUseTimeGrid.customSlots = { 9: [{ minutes: 30, duration: 15 }] };
    mockUseTimeGrid.canAddIntermediateSlot.mockReturnValue(true);
    
    renderWithContext(
      <TimeGrid days={[mockDays[0]]} events={[]} onCellClick={mockOnCellClick} renderDayHeader={mockRenderDayHeader} onEventClick={mockOnEventClick} onUpdateEvent={mockOnUpdateEvent}/>
    );

    expect(screen.getByTestId('calendar-time-slot-custom')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-time-slot-custom')).toHaveAttribute('data-minutes', '30');
    
    const addSlotButtons = screen.getAllByTitle(/Añadir franja/);
    expect(addSlotButtons.length).toBeGreaterThan(0);
    fireEvent.click(addSlotButtons[0]); 
    expect(mockUseTimeGrid.addCustomTimeSlot).toHaveBeenCalled();
    
    const removeButton = screen.getByLabelText('Eliminar franja horaria');
    fireEvent.click(removeButton);
    expect(mockUseTimeGrid.removeCustomTimeSlot).toHaveBeenCalledWith(9, 30);
  });

  test('applies compact class when time scale is compact', () => {
    const compactContextValue = {
      ...mockTimeScaleContextValue,
      currentTimeScale: TIME_SCALES.COMPACT,
    };
    render(
      <TimeScaleContext.Provider value={compactContextValue}>
        <TimeGrid days={mockDays} events={[]} renderDayHeader={mockRenderDayHeader} onEventClick={mockOnEventClick} onCellClick={mockOnCellClick} onUpdateEvent={mockOnUpdateEvent}/>
      </TimeScaleContext.Provider>
    );
    expect(screen.getByText(`Header for ${mockDays[0].getDate()}`).closest('.calendar-grid')).toHaveClass('time-scale-compact');
  });

  test('renders ExtensionPoints for day headers and hour cells', () => {
    mockUseTimeGrid.customSlots = {}; // Asegurar que no haya custom slots para esta prueba
    renderWithContext(
      <TimeGrid days={[mockDays[0]]} events={[]} renderDayHeader={mockRenderDayHeader} onEventClick={mockOnEventClick} onCellClick={mockOnCellClick} onUpdateEvent={mockOnUpdateEvent}/>
    );
    
    const expectedExtensionCount = 1 + mockUseTimeGrid.hours.length; // 1 para header, 24 para hour cells
    const allExtensions = screen.getAllByTestId('extension-pluginDayHeader-ext-dh-1');
    expect(allExtensions).toHaveLength(expectedExtensionCount);
    
    const dayHeaderExtension = allExtensions.find(el => {
        const text = el.textContent || "";
        return text.includes(mockDays[0].toISOString().split('T')[0]) &&
               !text.includes(" H:") && 
               !text.includes(" M:");
    });
    expect(dayHeaderExtension).toBeInTheDocument();
    if (dayHeaderExtension) {
      expect(dayHeaderExtension).toHaveTextContent(mockDays[0].toISOString().split('T')[0]);
    }

    const hourCellExtension = allExtensions.find(el => {
        const text = el.textContent || "";
        return text.includes(mockDays[0].toISOString().split('T')[0]) &&
               text.includes(" H:9") && 
               text.includes(" M:0");
    });
    expect(hourCellExtension).toBeInTheDocument();
    if (hourCellExtension) {
      expect(hourCellExtension).toHaveTextContent(mockDays[0].toISOString().split('T')[0]);
    }
  });

   test('calculates event positioning for simultaneous events', () => {
    const simultaneousEvents = [
        { id: 's1', title: 'Sim Event 1', start: new Date(2023, 0, 2, 10, 0).toISOString(), end: new Date(2023, 0, 2, 11, 0).toISOString() },
        { id: 's2', title: 'Sim Event 2', start: new Date(2023, 0, 2, 10, 15).toISOString(), end: new Date(2023, 0, 2, 11, 15).toISOString() },
    ];
    mockUseTimeGrid.shouldShowEventStart.mockImplementation((event, day, hour, minutes, duration) => {
        const eventDay = new Date(new Date(event.start).getFullYear(), new Date(event.start).getMonth(), new Date(event.start).getDate());
        const compareDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        return eventDay.getTime() === compareDay.getTime() && new Date(event.start).getHours() === hour;
    });
    mockUseTimeGrid.eventsOverlapInTimeSlot.mockImplementation((eventA, eventB) => {
      return eventA.id === 's2' && eventB && eventB.id === 's1';
    });

    renderWithContext(
      <TimeGrid days={[mockDays[0]]} events={simultaneousEvents} renderDayHeader={mockRenderDayHeader} onUpdateEvent={mockOnUpdateEvent} onEventClick={mockOnEventClick} onCellClick={mockOnCellClick}/>
    );

    const event1Item = screen.getByTestId('event-item-s1');
    const event2Item = screen.getByTestId('event-item-s2');
    expect(event1Item).toBeInTheDocument();
    expect(event2Item).toBeInTheDocument();

    expect(mockUseTimeGrid.eventsOverlapInTimeSlot).toHaveBeenCalled();
  });

  function within(element) {
    const { getByText } = require('@testing-library/dom');
    return {
      getByText: (text, options) => getByText(element, text, options),
    };
  }
});