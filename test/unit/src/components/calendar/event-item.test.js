// test/unit/components/calendar/event-item.test.js
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import EventItem from "../../../../../src/components/calendar/event-item";
import { formatEventTime } from "../../../../../src/utils/time-utils";

// Mock hooks
const mockUseEventDrag = {
  dragging: false,
  handleDragStart: jest.fn(),
};
jest.mock("../../../../../src/hooks/use-event-drag", () => ({
  useEventDrag: jest.fn(() => mockUseEventDrag),
}));

const mockUseEventResize = {
  resizing: false,
  handleResizeStart: jest.fn(),
};
jest.mock("../../../../../src/hooks/use-event-resize", () => ({
  useEventResize: jest.fn(() => mockUseEventResize),
}));

// Mock time-utils
jest.mock("../../../../../src/utils/time-utils", () => ({
  formatEventTime: jest.fn(() => "10:00 - 11:00"),
}));

describe("EventItem Component", () => {
  const mockEvent = {
    id: "event1",
    title: "Test Event Title",
    start: "2023-01-01T10:00:00Z",
    end: "2023-01-01T11:00:00Z",
    color: "blue",
  };
  const mockOnClick = jest.fn();
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock hook states
    mockUseEventDrag.dragging = false;
    mockUseEventResize.resizing = false;
    // Ensure setBlockClicks (passed into hooks) is correctly set up if its calls are checked
    const { useEventDrag } = require("../../../../../src/hooks/use-event-drag");
    useEventDrag.mockImplementation(({ setBlockClicks }) => ({
      ...mockUseEventDrag,
      // If the hook calls setBlockClicks, you can mock that call here if needed
    }));
    const {
      useEventResize,
    } = require("../../../../../src/hooks/use-event-resize");
    useEventResize.mockImplementation(({ setBlockClicks }) => ({
      ...mockUseEventResize,
    }));
  });

  test("renders event title and time", () => {
    render(
      <EventItem
        event={mockEvent}
        onClick={mockOnClick}
        onUpdate={mockOnUpdate}
      />
    );
    expect(screen.getByText(mockEvent.title)).toBeInTheDocument();
    expect(screen.getByText("10:00 - 11:00")).toBeInTheDocument(); // From mock formatEventTime
    expect(formatEventTime).toHaveBeenCalledWith(mockEvent);
  });

  test("applies background color from event", () => {
    render(
      <EventItem
        event={mockEvent}
        onClick={mockOnClick}
        onUpdate={mockOnUpdate}
      />
    );
    const eventElement = screen
      .getByText(mockEvent.title)
      .closest(".calendar-event");
    expect(eventElement).toHaveStyle(`background-color: ${mockEvent.color}`);
  });

  test("calls onClick handler when clicked and not dragging/resizing", () => {
    render(
      <EventItem
        event={mockEvent}
        onClick={mockOnClick}
        onUpdate={mockOnUpdate}
      />
    );
    const eventElement = screen
      .getByText(mockEvent.title)
      .closest(".calendar-event");
    fireEvent.click(eventElement);
    expect(mockOnClick).toHaveBeenCalledWith(mockEvent);
  });

  test("calls handleDragStart on mousedown (not on resize handle)", () => {
    render(
      <EventItem
        event={mockEvent}
        onClick={mockOnClick}
        onUpdate={mockOnUpdate}
      />
    );
    const eventElement = screen
      .getByText(mockEvent.title)
      .closest(".calendar-event");
    fireEvent.mouseDown(eventElement);
    expect(mockUseEventDrag.handleDragStart).toHaveBeenCalled();
  });

  test("calls handleResizeStart on mousedown on resize handle", () => {
    render(
      <EventItem
        event={mockEvent}
        onClick={mockOnClick}
        onUpdate={mockOnUpdate}
      />
    );
    const resizeHandle = screen
      .getByText(mockEvent.title)
      .closest(".calendar-event")
      .querySelector(".event-resize-handle");
    expect(resizeHandle).toBeInTheDocument();
    fireEvent.mouseDown(resizeHandle);
    expect(mockUseEventResize.handleResizeStart).toHaveBeenCalled();
  });

  test("does not call onClick if blockClicks is true (simulated by hook)", (done) => {
    // Simulate that a drag/resize operation just finished and set blockClicks
    const { useEventDrag } = require("../../../../../src/hooks/use-event-drag");
    useEventDrag.mockImplementationOnce(
      ({ eventRef, event, onUpdate, gridSize, snapValue, setBlockClicks }) => {
        // Simulate the hook calling setBlockClicks
        // This is tricky as setBlockClicks is internal to EventItem's state
        // A better way might be to check if `e.preventDefault` was called.
        // For this test, we'll rely on the eventRef.current.dataset.recentlyResized flag
        // which EventItem itself sets.
        return {
          ...mockUseEventDrag,
          handleDragStart: (e) => {
            if (eventRef.current)
              eventRef.current.dataset.recentlyResized = "true"; // Simulate resize
            mockUseEventDrag.handleDragStart(e);
          },
        };
      }
    );

    render(
      <EventItem
        event={mockEvent}
        onClick={mockOnClick}
        onUpdate={mockOnUpdate}
      />
    );
    const eventElement = screen
      .getByText(mockEvent.title)
      .closest(".calendar-event");

    // Simulate drag start that sets recentlyResized
    fireEvent.mouseDown(eventElement);
    // Now try to click
    fireEvent.click(eventElement);

    expect(mockOnClick).not.toHaveBeenCalled();

    // Check if recentlyResized is reset after a short delay (implicitly by the click handler)
    // We can't easily test the setTimeout from within EventItem directly here without more complex mocks.
    // However, we've confirmed onClick was blocked.
    // Test the reset of the flag after click
    expect(eventElement.dataset.recentlyResized).toBe("false");
    done();
  });

  test("applies conditional classes: dragging, resizing, continues", () => {
    mockUseEventDrag.dragging = true;
    mockUseEventResize.resizing = true;
    const { rerender } = render(
      <EventItem
        event={mockEvent}
        onClick={mockOnClick}
        onUpdate={mockOnUpdate}
        continuesNextDay={true}
        continuesFromPrevDay={true}
        isMicroEvent={true}
      />
    );
    let eventElement = screen
      .getByText(mockEvent.title)
      .closest(".calendar-event");
    expect(eventElement).toHaveClass("dragging");
    expect(eventElement).toHaveClass("resizing");
    expect(eventElement).toHaveClass("continues-next-day");
    expect(eventElement).toHaveClass("continues-from-prev-day");
    expect(eventElement).toHaveClass("micro-event");

    // Test data-being-dragged attribute
    expect(eventElement).toHaveAttribute("data-being-dragged", "true");

    mockUseEventDrag.dragging = false;
    rerender(
      <EventItem
        event={mockEvent}
        onClick={mockOnClick}
        onUpdate={mockOnUpdate}
        continuesNextDay={true}
        continuesFromPrevDay={true}
        isMicroEvent={true}
      />
    );
    eventElement = screen.getByText(mockEvent.title).closest(".calendar-event");
    expect(eventElement).not.toHaveClass("dragging");
    expect(eventElement).toHaveAttribute("data-being-dragged", "false");
  });

  test("does not render resize handle if continuesNextDay is true", () => {
    render(
      <EventItem
        event={mockEvent}
        onClick={mockOnClick}
        onUpdate={mockOnUpdate}
        continuesNextDay={true}
      />
    );
    const eventElement = screen
      .getByText(mockEvent.title)
      .closest(".calendar-event");
    expect(
      eventElement.querySelector(".event-resize-handle")
    ).not.toBeInTheDocument();
  });

  test("passes correct arguments to hooks", () => {
    const customSlots = { 10: [{ minutes: 30 }] };
    render(
      <EventItem
        event={mockEvent}
        onClick={mockOnClick}
        onUpdate={mockOnUpdate}
        gridSize={50}
        snapValue={10}
        customSlots={customSlots}
        maxSimultaneousEvents={2}
      />
    );

    const { useEventDrag } = require("../../../../../src/hooks/use-event-drag");
    expect(useEventDrag).toHaveBeenCalledWith(
      expect.objectContaining({
        event: mockEvent,
        onUpdate: mockOnUpdate,
        gridSize: 50,
        snapValue: 10,
        setBlockClicks: expect.any(Function),
        customSlots: customSlots,
        maxSimultaneousEvents: 2,
      })
    );

    const {
      useEventResize,
    } = require("../../../../../src/hooks/use-event-resize");
    expect(useEventResize).toHaveBeenCalledWith(
      expect.objectContaining({
        event: mockEvent,
        onUpdate: mockOnUpdate,
        gridSize: 50,
        snapValue: 10,
        setBlockClicks: expect.any(Function),
        customSlots: customSlots,
      })
    );
  });
});
