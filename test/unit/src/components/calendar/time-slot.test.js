// test/unit/components/calendar/time-slot.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TimeSlot from '../../../../../src/components/calendar/time-slot';

describe('TimeSlot Component', () => {
  const mockDay = new Date(2023, 0, 2); // Jan 2, 2023
  const mockCellHeight = 60; // px per hour

  const mockTimeSlotStandard = {
    id: 'ts1',
    hour: 9,
    minutes: 0,
    label: '09:00',
    type: 'standard',
    duration: 60, // minutes
  };
  const mockTimeSlotMedium = {
    id: 'ts2',
    hour: 10,
    minutes: 0,
    label: '10:00',
    type: 'medium',
    duration: 30,
  };
  const mockTimeSlotShort = {
    id: 'ts3',
    hour: 11,
    minutes: 0,
    label: '11:00',
    type: 'short',
    duration: 15,
  };

  const mockOnCellClick = jest.fn();
  const mockOnAddIntermediateSlot = jest.fn();
  const mockRenderEvents = jest.fn(timeSlot => <div data-testid={`events-for-${timeSlot.id}`}>Events</div>);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders standard time slot correctly', () => {
    render(
      <TimeSlot
        timeSlot={mockTimeSlotStandard}
        day={mockDay}
        cellHeight={mockCellHeight}
        onCellClick={mockOnCellClick}
        renderEvents={mockRenderEvents}
      />
    );
    const slotElement = screen.getByTestId('calendar-time-slot');
    expect(slotElement).toBeInTheDocument();
    expect(slotElement).toHaveClass('time-slot-standard');
    expect(slotElement).toHaveStyle(`height: ${mockCellHeight}px`); // 60min duration = 1 * cellHeight
    expect(slotElement).toHaveStyle(`min-height: ${mockCellHeight}px`);
    expect(screen.getByTestId(`events-for-${mockTimeSlotStandard.id}`)).toBeInTheDocument();
    expect(mockRenderEvents).toHaveBeenCalledWith(mockTimeSlotStandard);
  });

  test('renders medium time slot correctly', () => {
    render(
      <TimeSlot
        timeSlot={mockTimeSlotMedium}
        day={mockDay}
        cellHeight={mockCellHeight}
      />
    );
    const slotElement = screen.getByTestId('calendar-time-slot');
    expect(slotElement).toHaveClass('time-slot-medium');
    expect(slotElement).toHaveStyle(`height: ${mockCellHeight / 2}px`); // 30min duration = 0.5 * cellHeight
  });

  test('renders short time slot correctly', () => {
    render(
      <TimeSlot
        timeSlot={mockTimeSlotShort}
        day={mockDay}
        cellHeight={mockCellHeight}
      />
    );
    const slotElement = screen.getByTestId('calendar-time-slot');
    expect(slotElement).toHaveClass('time-slot-short');
    expect(slotElement).toHaveStyle(`height: ${mockCellHeight / 4}px`); // 15min duration = 0.25 * cellHeight
  });

  test('calls onCellClick when slot is clicked', () => {
    render(
      <TimeSlot
        timeSlot={mockTimeSlotStandard}
        day={mockDay}
        cellHeight={mockCellHeight}
        onCellClick={mockOnCellClick}
      />
    );
    fireEvent.click(screen.getByTestId('calendar-time-slot'));
    
    const expectedDate = new Date(mockDay);
    expectedDate.setHours(mockTimeSlotStandard.hour, mockTimeSlotStandard.minutes, 0, 0);
    expect(mockOnCellClick).toHaveBeenCalledWith(expectedDate);
  });

  test('renders add intermediate button and calls onAddIntermediateSlot when canAddIntermediate is true', () => {
    render(
      <TimeSlot
        timeSlot={mockTimeSlotStandard}
        day={mockDay}
        cellHeight={mockCellHeight}
        onAddIntermediateSlot={mockOnAddIntermediateSlot}
        canAddIntermediate={true}
      />
    );
    const addButton = screen.getByTitle(`Agregar franja intermedia a las ${mockTimeSlotStandard.hour}:${(mockTimeSlotStandard.minutes + 15).toString().padStart(2, '0')}`);
    expect(addButton).toBeInTheDocument();
    fireEvent.click(addButton);
    expect(mockOnAddIntermediateSlot).toHaveBeenCalledWith(mockTimeSlotStandard.hour, mockTimeSlotStandard.minutes);
  });

  test('does not render add intermediate button when canAddIntermediate is false or not provided', () => {
    const { rerender } = render(
      <TimeSlot
        timeSlot={mockTimeSlotStandard}
        day={mockDay}
        cellHeight={mockCellHeight}
        onAddIntermediateSlot={mockOnAddIntermediateSlot}
        canAddIntermediate={false}
      />
    );
    expect(screen.queryByTitle(/Agregar franja intermedia/)).not.toBeInTheDocument();

    rerender(
      <TimeSlot
        timeSlot={mockTimeSlotStandard}
        day={mockDay}
        cellHeight={mockCellHeight}
        onAddIntermediateSlot={mockOnAddIntermediateSlot}
        // canAddIntermediate not provided
      />
    );
    expect(screen.queryByTitle(/Agregar franja intermedia/)).not.toBeInTheDocument();
  });

  test('does not call onCellClick if not provided', () => {
    render(
      <TimeSlot
        timeSlot={mockTimeSlotStandard}
        day={mockDay}
        cellHeight={mockCellHeight}
        // onCellClick not provided
      />
    );
    const slotElement = screen.getByTestId('calendar-time-slot');
    expect(() => fireEvent.click(slotElement)).not.toThrow();
  });
    
  test('does not call onAddIntermediateSlot if not provided, even if canAddIntermediate is true', () => {
    render(
      <TimeSlot
        timeSlot={mockTimeSlotStandard}
        day={mockDay}
        cellHeight={mockCellHeight}
        canAddIntermediate={true}
        // onAddIntermediateSlot not provided
      />
    );
    const addButton = screen.getByTitle(/Agregar franja intermedia/);
    expect(() => fireEvent.click(addButton)).not.toThrow();
  });
});