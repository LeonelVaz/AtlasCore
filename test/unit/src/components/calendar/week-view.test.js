import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import WeekView from '../../../../../src/components/calendar/week-view';
import { generateWeekDays } from '../../../../../src/utils/date-utils';

// Mock TimeGrid component
jest.mock('../../../../../src/components/calendar/time-grid', () => {
  return jest.fn(({ days, events, onEventClick, onCellClick, onUpdateEvent, snapValue, renderDayHeader, maxSimultaneousEvents }) => (
    <div data-testid="time-grid-mock">
      {days.map(day => (
        <div key={day.toISOString()} data-testid="day-header-rendered">
          {renderDayHeader(day)}
        </div>
      ))}
      <div>Days Count: {days.length}</div>
      <div>Events Count: {events.length}</div>
      <div>Snap: {snapValue}</div>
      <div>Max Simultaneous: {maxSimultaneousEvents}</div>
    </div>
  ));
});

// Mock date-utils
const mockGeneratedWeekDays = [
  new Date(2023, 0, 1), // Sun
  new Date(2023, 0, 2), // Mon
  new Date(2023, 0, 3), // Tue
  new Date(2023, 0, 4), // Wed
  new Date(2023, 0, 5), // Thu
  new Date(2023, 0, 6), // Fri
  new Date(2023, 0, 7), // Sat
];
jest.mock('../../../../../src/utils/date-utils', () => ({
  generateWeekDays: jest.fn(() => mockGeneratedWeekDays),
}));

describe('WeekView Component', () => {
  const mockCurrentDate = new Date(2023, 0, 4); // A Wednesday
  const mockEvents = [{ id: '1', title: 'Event 1', start: new Date(2023,0,4,10,0,0), end: new Date(2023,0,4,11,0,0) }];
  const mockOnEventClick = jest.fn();
  const mockOnCellClick = jest.fn();
  const mockOnUpdateEvent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders TimeGrid with correct props', () => {
    render(
      <WeekView
        currentDate={mockCurrentDate}
        events={mockEvents}
        onEventClick={mockOnEventClick}
        onCellClick={mockOnCellClick}
        onUpdateEvent={mockOnUpdateEvent}
        snapValue={30}
        maxSimultaneousEvents={4}
      />
    );

    expect(generateWeekDays).toHaveBeenCalledWith(mockCurrentDate);

    const timeGridMock = screen.getByTestId('time-grid-mock');
    expect(timeGridMock).toBeInTheDocument();
    expect(screen.getByText(`Days Count: ${mockGeneratedWeekDays.length}`)).toBeInTheDocument();
    expect(screen.getByText('Events Count: 1')).toBeInTheDocument();
    expect(screen.getByText('Snap: 30')).toBeInTheDocument();
    expect(screen.getByText('Max Simultaneous: 4')).toBeInTheDocument();
  });

  test('renderDayHeader formats and displays day information correctly for each day', () => {
    render(<WeekView currentDate={mockCurrentDate} events={[]} />);
    
    const dayHeadersRendered = screen.getAllByTestId('day-header-rendered');
    expect(dayHeadersRendered).toHaveLength(mockGeneratedWeekDays.length);

    mockGeneratedWeekDays.forEach((day, index) => {
      const dayName = day.toLocaleDateString('es-ES', { weekday: 'long' });
      const dayNumber = day.getDate();
      const expectedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      
      // Check if the content is within the specific header div
      const headerContent = dayHeadersRendered[index];
      expect(headerContent).toHaveTextContent(expectedDayName);
      expect(headerContent).toHaveTextContent(dayNumber.toString());
    });
  });

  test('passes event handlers and other props to TimeGrid', () => {
    render(
      <WeekView
        currentDate={mockCurrentDate}
        events={mockEvents}
        onEventClick={mockOnEventClick}
        onCellClick={mockOnCellClick}
        onUpdateEvent={mockOnUpdateEvent}
        snapValue={15}
        maxSimultaneousEvents={2}
      />
    );
    // Access the mock directly to check passed props
    const TimeGrid = require('../../../../../src/components/calendar/time-grid');
    const lastCallProps = TimeGrid.mock.calls[TimeGrid.mock.calls.length - 1][0];

    expect(lastCallProps.onEventClick).toBe(mockOnEventClick);
    expect(lastCallProps.onCellClick).toBe(mockOnCellClick);
    expect(lastCallProps.onUpdateEvent).toBe(mockOnUpdateEvent);
    expect(lastCallProps.snapValue).toBe(15);
    expect(lastCallProps.maxSimultaneousEvents).toBe(2);
  });

  test('defaults maxSimultaneousEvents if not provided', () => {
     render(
      <WeekView
        currentDate={mockCurrentDate}
        events={mockEvents}
        onEventClick={mockOnEventClick}
        onCellClick={mockOnCellClick}
        onUpdateEvent={mockOnUpdateEvent}
        snapValue={0}
        // maxSimultaneousEvents not provided
      />
    );
    const TimeGrid = require('../../../../../src/components/calendar/time-grid');
    const lastCallProps = TimeGrid.mock.calls[TimeGrid.mock.calls.length - 1][0];
    expect(lastCallProps.maxSimultaneousEvents).toBe(3); // Default from WeekView
  });
});