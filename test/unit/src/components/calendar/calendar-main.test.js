import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DayView from '../../../../../src/components/calendar/day-view';
import { formatDate } from '../../../../../src/utils/date-utils';

// Mock TimeGrid component
jest.mock('../../../../../src/components/calendar/time-grid', () => {
  return jest.fn(({ days, events, onEventClick, onCellClick, onUpdateEvent, snapValue, renderDayHeader, maxSimultaneousEvents }) => (
    <div data-testid="time-grid-mock">
      <div data-testid="day-header-rendered">{renderDayHeader(days[0])}</div>
      <div>Date: {days[0].toISOString()}</div>
      <div>Events Count: {events.length}</div>
      <div>Snap: {snapValue}</div>
      <div>Max Simultaneous: {maxSimultaneousEvents}</div>
      <button onClick={() => onEventClick({ id: 'test-event' })}>EventClick</button>
      <button onClick={() => onCellClick(new Date(days[0]).setHours(10, 30, 0, 0), 10, 30, 30)}>CellClick</button>
      <button onClick={() => onUpdateEvent({ id: 'updated-event' })}>UpdateEvent</button>
    </div>
  ));
});

// Mock date-utils
jest.mock('../../../../../src/utils/date-utils', () => ({
  formatDate: jest.fn((date, options) => {
    if (options.weekday === 'long') return 'Lunes';
    if (options.month === 'long') return 'Enero';
    return date.toString(); // Fallback
  }),
}));

describe('DayView Component', () => {
  const mockDate = new Date(2023, 0, 2, 10, 0, 0); // Jan 2, 2023, 10:00 AM
  const mockEvents = [{ id: '1', title: 'Event 1', start: mockDate, end: new Date(mockDate.getTime() + 3600000) }];
  const mockOnEventClick = jest.fn();
  const mockOnTimeSlotClick = jest.fn();
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders TimeGrid with correct props', () => {
    render(
      <DayView
        date={mockDate}
        events={mockEvents}
        onEventClick={mockOnEventClick}
        onTimeSlotClick={mockOnTimeSlotClick}
        onUpdate={mockOnUpdate}
        snapValue={15}
        maxSimultaneousEvents={2}
      />
    );

    const timeGridMock = screen.getByTestId('time-grid-mock');
    expect(timeGridMock).toBeInTheDocument();
    expect(screen.getByText(`Date: ${mockDate.toISOString()}`)).toBeInTheDocument();
    expect(screen.getByText('Events Count: 1')).toBeInTheDocument();
    expect(screen.getByText('Snap: 15')).toBeInTheDocument();
    expect(screen.getByText('Max Simultaneous: 2')).toBeInTheDocument();
  });

  test('renderDayHeader formats and displays day information correctly', () => {
    render(<DayView date={mockDate} events={[]} />);
    
    const dayHeaderRendered = screen.getByTestId('day-header-rendered');
    expect(dayHeaderRendered).toBeInTheDocument();

    expect(formatDate).toHaveBeenCalledWith(mockDate, { weekday: 'long' });
    expect(formatDate).toHaveBeenCalledWith(mockDate, { month: 'long' });
    
    // Check for parts of the rendered header
    expect(screen.getByText('Lunes')).toBeInTheDocument(); // From mock formatDate
    expect(screen.getByText(mockDate.getDate().toString())).toBeInTheDocument();
    expect(screen.getByText('Enero')).toBeInTheDocument(); // From mock formatDate
  });

  test('handleTimeSlotClick passes correct arguments to onTimeSlotClick prop', () => {
    render(
      <DayView
        date={mockDate}
        events={mockEvents}
        onEventClick={mockOnEventClick}
        onTimeSlotClick={mockOnTimeSlotClick}
        onUpdate={mockOnUpdate}
      />
    );

    fireEvent.click(screen.getByText('CellClick'));
    
    const expectedDateWithTime = new Date(mockDate);
    expectedDateWithTime.setHours(10, 30, 0, 0);

    expect(mockOnTimeSlotClick).toHaveBeenCalledWith(expectedDateWithTime.getTime(), 10, 30, 30);
  });

  test('passes event handlers to TimeGrid', () => {
    render(
      <DayView
        date={mockDate}
        events={mockEvents}
        onEventClick={mockOnEventClick}
        onTimeSlotClick={mockOnTimeSlotClick}
        onUpdate={mockOnUpdate}
      />
    );

    fireEvent.click(screen.getByText('EventClick'));
    expect(mockOnEventClick).toHaveBeenCalledWith({ id: 'test-event' });

    fireEvent.click(screen.getByText('UpdateEvent'));
    expect(mockOnUpdate).toHaveBeenCalledWith({ id: 'updated-event' });
  });

  test('defaults snapValue and maxSimultaneousEvents if not provided', () => {
    render(
      <DayView
        date={mockDate}
        events={mockEvents}
        onEventClick={mockOnEventClick}
        onTimeSlotClick={mockOnTimeSlotClick}
        onUpdate={mockOnUpdate}
      />
    );
    // Access the mock directly to check passed props
    const TimeGrid = require('../../../../../src/components/calendar/time-grid');
    const lastCallProps = TimeGrid.mock.calls[TimeGrid.mock.calls.length - 1][0];
    
    expect(lastCallProps.snapValue).toBe(0); // Default from DayView
    expect(lastCallProps.maxSimultaneousEvents).toBe(3); // Default from DayView
  });
});