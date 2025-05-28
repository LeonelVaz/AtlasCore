// test/unit/components/debug/event-debugger.test.js
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import EventDebugger from "../../../../../src/components/debug/event-debugger";
import eventBus, {
  CalendarEvents,
  AppEvents,
  StorageEvents,
} from "../../../../../src/core/bus/event-bus";
import storageService from "../../../../../src/services/storage-service";
import { STORAGE_KEYS } from "../../../../../src/core/config/constants";

// Mock dependencies
jest.mock("../../../../../src/core/bus/event-bus", () => ({
  __esModule: true,
  default: {
    subscribe: jest.fn().mockReturnValue(jest.fn()), // General mock
    publish: jest.fn(),
    getActiveEvents: jest.fn().mockReturnValue([]),
    getSubscriberCount: jest.fn().mockReturnValue(0),
    hasSubscribers: jest.fn().mockReturnValue(true),
    setDebugMode: jest.fn(),
  },
  CalendarEvents: {
    EVENT_CREATED: "calendar.eventCreated",
    EVENT_UPDATED: "calendar.eventUpdated",
    EVENT_DELETED: "calendar.eventDeleted",
    EVENTS_LOADED: "calendar.eventsLoaded",
    VIEW_CHANGED: "calendar.viewChanged",
    DATE_CHANGED: "calendar.dateChanged",
  },
  AppEvents: {
    INITIALIZED: "app.initialized",
    THEME_CHANGED: "app.themeChanged",
    MODULE_REGISTERED: "app.moduleRegistered",
    SETTINGS_CHANGED: "app.settingsChanged",
  },
  StorageEvents: {
    DATA_CHANGED: "storage.dataChanged",
    EVENTS_UPDATED: "storage.eventsUpdated",
  },
}));

jest.mock("../../../../../src/services/storage-service", () => ({
  get: jest.fn(),
  set: jest.fn(),
}));

// Mock console methods
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();
const mockConsoleClear = jest.fn();
const mockConsoleTable = jest.fn();
const mockConsoleGroup = jest.fn();
const mockConsoleGroupEnd = jest.fn();

const originalConsole = { ...global.console };

global.console = {
  ...global.console,
  log: mockConsoleLog,
  error: mockConsoleError,
  clear: mockConsoleClear,
  table: mockConsoleTable,
  group: mockConsoleGroup,
  groupEnd: mockConsoleGroupEnd,
};

Object.defineProperty(global.navigator, "userAgent", {
  value: "TestAgent/1.0",
  configurable: true,
  writable: true,
});
Object.defineProperty(global.navigator, "platform", {
  value: "TestPlatform",
  configurable: true,
  writable: true,
});
Object.defineProperty(global.navigator, "language", {
  value: "en-US",
  configurable: true,
  writable: true,
});
Object.defineProperty(global.navigator, "cookieEnabled", {
  value: true,
  configurable: true,
  writable: true,
});
Object.defineProperty(global.navigator, "onLine", {
  value: true,
  configurable: true,
  writable: true,
});
Object.defineProperty(global, "screen", {
  value: {
    width: 1920,
    height: 1080,
    availWidth: 1920,
    availHeight: 1040,
    colorDepth: 24,
  },
  configurable: true,
  writable: true,
});
Object.defineProperty(global.window, "innerWidth", {
  value: 1024,
  configurable: true,
  writable: true,
});
Object.defineProperty(global.window, "innerHeight", {
  value: 768,
  configurable: true,
  writable: true,
});
Object.defineProperty(global.window, "outerWidth", {
  value: 1024,
  configurable: true,
  writable: true,
});
Object.defineProperty(global.window, "outerHeight", {
  value: 768,
  configurable: true,
  writable: true,
});

describe("EventDebugger Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default storage.get for most tests
    storageService.get.mockImplementation(async (key, defaultValue) => {
      if (key === STORAGE_KEYS.DEV_EVENT_DEBUGGER_ENABLED) return false;
      if (key === STORAGE_KEYS.DEV_CONSOLE_LOGS_ENABLED) return false;
      if (key === STORAGE_KEYS.DEV_PERFORMANCE_MONITOR_ENABLED) return false;
      return defaultValue;
    });
    storageService.set.mockResolvedValue(undefined);
    eventBus.getActiveEvents.mockReturnValue([]);
    eventBus.getSubscriberCount.mockReturnValue(0);
    // Default subscribe mock, can be overridden in specific tests
    eventBus.subscribe.mockReturnValue(jest.fn());
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  afterAll(() => {
    global.console = originalConsole;
  });

  test("renders null if not enabled", async () => {
    storageService.get.mockResolvedValue(false); // Specifically for DEV_EVENT_DEBUGGER_ENABLED
    const { container } = render(<EventDebugger />);
    await waitFor(() =>
      expect(storageService.get).toHaveBeenCalledWith(
        STORAGE_KEYS.DEV_EVENT_DEBUGGER_ENABLED,
        false
      )
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders debugger UI if enabled from storage", async () => {
    storageService.get.mockImplementation(async (key) => {
      // Ensure it's enabled
      if (key === STORAGE_KEYS.DEV_EVENT_DEBUGGER_ENABLED) return true;
      return false;
    });
    render(<EventDebugger />);
    await waitFor(() =>
      expect(screen.getByText("Event Debugger")).toBeInTheDocument()
    );
    // Expand the debugger to find content
    fireEvent.click(screen.getByText("Event Debugger"));
    expect(screen.getByText("Eventos capturados:")).toBeInTheDocument();
  });

  test("loads initial config from storageService and UI reflects it when expanded", async () => {
    storageService.get.mockImplementation(async (key) => {
      if (key === STORAGE_KEYS.DEV_EVENT_DEBUGGER_ENABLED) return true;
      if (key === STORAGE_KEYS.DEV_CONSOLE_LOGS_ENABLED) return true;
      if (key === STORAGE_KEYS.DEV_PERFORMANCE_MONITOR_ENABLED) return false;
      return false;
    });

    render(<EventDebugger />);
    await waitFor(() =>
      expect(screen.getByText("Event Debugger")).toBeInTheDocument()
    ); // Enabled
    fireEvent.click(screen.getByText("Event Debugger")); // Expand

    const logToggle = screen
      .getByText("Logs detallados")
      .closest(".debug-toggle")
      .querySelector("input");
    const perfToggle = screen
      .getByText("Monitor rendimiento")
      .closest(".debug-toggle")
      .querySelector("input");
    expect(logToggle).toBeChecked();
    expect(perfToggle).not.toBeChecked();
  });

  test("handles error when loading config from storage", async () => {
    storageService.get.mockRejectedValueOnce(new Error("Storage failed"));
    render(<EventDebugger />);
    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith(
        "Error al cargar configuración del Event Debugger:",
        expect.any(Error)
      );
    });
    expect(screen.queryByText("Event Debugger")).not.toBeInTheDocument();
  });

  describe("when enabled", () => {
    let capturedEventCallbacks = {}; // To capture callbacks for event simulation

    beforeEach(async () => {
      capturedEventCallbacks = {}; // Reset for each test in this block

      // Setup a flexible subscribe mock that can capture callbacks
      eventBus.subscribe.mockImplementation((eventName, callback) => {
        // Capture ALL subscribed callbacks if a callback is provided
        if (callback) {
          capturedEventCallbacks[eventName] = callback;
        }
        return jest.fn(); // Return a generic unsubscribe mock function
      });

      storageService.get.mockImplementation(async (key) => {
        if (key === STORAGE_KEYS.DEV_EVENT_DEBUGGER_ENABLED) return true;
        // Default other toggles to false unless set otherwise by a specific test
        if (key === STORAGE_KEYS.DEV_CONSOLE_LOGS_ENABLED) return false;
        if (key === STORAGE_KEYS.DEV_PERFORMANCE_MONITOR_ENABLED) return false;
        return false;
      });

      render(<EventDebugger />);
      await waitFor(() =>
        expect(screen.getByText("Event Debugger")).toBeInTheDocument()
      );
      fireEvent.click(screen.getByText("Event Debugger")); // Expand for all tests in this block
    });

    test("toggles minimized state on header click", () => {
      expect(screen.getByText("Eventos capturados:")).toBeVisible();
      fireEvent.click(screen.getByText("Event Debugger")); // Minimize (header text is still 'Event Debugger')
      expect(screen.queryByText("Eventos capturados:")).not.toBeInTheDocument();
      fireEvent.click(screen.getByText("Event Debugger")); // Expand
      expect(screen.getByText("Eventos capturados:")).toBeVisible();
    });

    test("close button toggles debugger enabled state and saves to storage", async () => {
      const closeButton = screen.getByTitle("Desactivar Event Debugger");
      fireEvent.click(closeButton);
      await waitFor(() => {
        expect(storageService.set).toHaveBeenCalledWith(
          STORAGE_KEYS.DEV_EVENT_DEBUGGER_ENABLED,
          false
        );
        expect(eventBus.publish).toHaveBeenCalledWith(
          "developer.eventDebuggerToggled",
          { enabled: false }
        );
      });
    });

    test("log toggle updates state, storage, and eventBus", async () => {
      const logToggleInput = screen
        .getByText("Logs detallados")
        .closest(".debug-toggle")
        .querySelector("input");
      expect(logToggleInput).not.toBeChecked();

      fireEvent.click(logToggleInput);
      await waitFor(() => expect(logToggleInput).toBeChecked());

      await waitFor(() => {
        expect(storageService.set).toHaveBeenCalledWith(
          STORAGE_KEYS.DEV_CONSOLE_LOGS_ENABLED,
          true
        );
        expect(eventBus.setDebugMode).toHaveBeenCalledWith(true);
      });

      fireEvent.click(logToggleInput);
      await waitFor(() => expect(logToggleInput).not.toBeChecked());
      await waitFor(() => {
        expect(storageService.set).toHaveBeenCalledWith(
          STORAGE_KEYS.DEV_CONSOLE_LOGS_ENABLED,
          false
        );
      });
    });

    test("performance toggle updates state, storage, and eventBus", async () => {
      const perfToggleInput = screen
        .getByText("Monitor rendimiento")
        .closest(".debug-toggle")
        .querySelector("input");
      expect(perfToggleInput).not.toBeChecked();

      fireEvent.click(perfToggleInput);
      await waitFor(() => expect(perfToggleInput).toBeChecked());

      await waitFor(() => {
        expect(storageService.set).toHaveBeenCalledWith(
          STORAGE_KEYS.DEV_PERFORMANCE_MONITOR_ENABLED,
          true
        );
      });

      fireEvent.click(perfToggleInput);
      await waitFor(() => expect(perfToggleInput).not.toBeChecked());
      await waitFor(() => {
        expect(storageService.set).toHaveBeenCalledWith(
          STORAGE_KEYS.DEV_PERFORMANCE_MONITOR_ENABLED,
          false
        );
      });
    });

    test('"Test Manual" button executes test sequence', () => {
      const testManualButton = screen.getByText("🧪 Test Manual");
      fireEvent.click(testManualButton);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "\n🧪 EJECUTANDO TEST MANUAL..."
      );
      expect(eventBus.publish).toHaveBeenCalledWith("test.manual", {
        mensaje: "Test manual desde EventDebugger",
      });
    });

    test('"Limpiar" button clears console', () => {
      const clearButton = screen.getByText("🧹 Limpiar");
      fireEvent.click(clearButton);
      expect(mockConsoleClear).toHaveBeenCalled();
    });

    test('"Info Sistema" button shows system info', () => {
      const infoButton = screen.getByText("🖥️ Info Sistema");
      fireEvent.click(infoButton);
      expect(mockConsoleGroup).toHaveBeenCalledWith(
        "🖥️ INFORMACIÓN DEL SISTEMA"
      );
      expect(mockConsoleTable).toHaveBeenCalledWith(
        expect.objectContaining({ version: "0.3.0" })
      );
    });

    test('"Stats" button shows event stats', () => {
      eventBus.getActiveEvents.mockReturnValue(["event1", "event2"]);
      eventBus.getSubscriberCount.mockImplementation((event) =>
        event === "event1" ? 2 : 1
      );
      const statsButton = screen.getByText("📊 Stats");
      fireEvent.click(statsButton);
      expect(mockConsoleLog).toHaveBeenCalledWith("📋 Eventos activos:", [
        "event1",
        "event2",
      ]);
      expect(mockConsoleTable).toHaveBeenCalledWith({ event1: 2, event2: 1 });
    });

    test("subscribes to configuration change events and updates UI", async () => {
      const logToggleInput = screen
        .getByText("Logs detallados")
        .closest(".debug-toggle")
        .querySelector("input");
      expect(logToggleInput).not.toBeChecked();

      // Use the captured callback from the beforeEach setup
      act(() => {
        if (capturedEventCallbacks["developer.consoleLogsToggled"]) {
          capturedEventCallbacks["developer.consoleLogsToggled"]({
            enabled: true,
          });
        } else {
          // This case should ideally not happen if beforeEach mock is correct
          console.warn(
            "Callback for 'developer.consoleLogsToggled' was not captured by the global mock."
          );
          // Fallback: Manually trigger publish to simulate external event if direct callback invocation fails
          eventBus.publish("developer.consoleLogsToggled", { enabled: true });
        }
      });
      await waitFor(() => expect(logToggleInput).toBeChecked());

      const perfToggleInput = screen
        .getByText("Monitor rendimiento")
        .closest(".debug-toggle")
        .querySelector("input");
      expect(perfToggleInput).not.toBeChecked();
      act(() => {
        if (capturedEventCallbacks["developer.performanceMonitorToggled"]) {
          capturedEventCallbacks["developer.performanceMonitorToggled"]({
            enabled: true,
          });
        } else {
          console.warn(
            "Callback for 'developer.performanceMonitorToggled' was not captured by the global mock."
          );
          eventBus.publish("developer.performanceMonitorToggled", {
            enabled: true,
          });
        }
      });
      await waitFor(() => expect(perfToggleInput).toBeChecked());
    });

    test("subscribes to system events and updates counts", async () => {
      await act(async () => {
        jest.runAllTimers();
      }); // For verifySystemStatus setTimeout

      // Use the captured callbacks from the beforeEach setup
      expect(
        capturedEventCallbacks[CalendarEvents.EVENT_CREATED]
      ).toBeDefined();
      act(() =>
        capturedEventCallbacks[CalendarEvents.EVENT_CREATED]({ id: "test1" })
      );
      expect(
        screen.getByText("📅 Calendario").nextElementSibling
      ).toHaveTextContent("1");

      expect(capturedEventCallbacks[AppEvents.INITIALIZED]).toBeDefined();
      act(() =>
        capturedEventCallbacks[AppEvents.INITIALIZED]({ success: true })
      );
      expect(
        screen.getByText("🔧 Aplicación").nextElementSibling
      ).toHaveTextContent("1");

      expect(capturedEventCallbacks[StorageEvents.DATA_CHANGED]).toBeDefined();
      act(() =>
        capturedEventCallbacks[StorageEvents.DATA_CHANGED]({ key: "myKey" })
      );
      expect(
        screen.getByText("💾 Storage").nextElementSibling
      ).toHaveTextContent("1");
    });

    test("useEffect for event monitoring calls verifySystemStatus and logs", async () => {
      await act(async () => {
        jest.runAllTimers();
      }); // For verifySystemStatus setTimeout
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "🔍 EventDebugger: Iniciando monitoreo completo del sistema...\n"
      );
      expect(eventBus.hasSubscribers).toHaveBeenCalledWith(
        "calendar.eventCreated"
      );
    });

    // For this specific test, we will re-mock eventBus.subscribe locally
    // to have precise control over the returned unsubscribe functions.
    test("unsubscribes from all eventBus subscriptions on unmount", async () => {
      const localMockUnsubscribeConfig = jest.fn();
      const localMockUnsubscribeMonitoring = jest.fn();
      let localConfigSubCount = 0;
      let localMonitoringSubCount = 0;

      // Override the global mock for this test's scope
      const originalEventBusSubscribe = eventBus.subscribe;
      eventBus.subscribe = jest.fn((eventName) => {
        if (
          eventName === "developer.eventDebuggerToggled" ||
          eventName === "developer.consoleLogsToggled" ||
          eventName === "developer.performanceMonitorToggled"
        ) {
          localConfigSubCount++;
          return localMockUnsubscribeConfig;
        }
        localMonitoringSubCount++;
        return localMockUnsubscribeMonitoring;
      });

      // Ensure the component is enabled for this specific test run
      storageService.get.mockImplementation(async (key) => {
        if (key === STORAGE_KEYS.DEV_EVENT_DEBUGGER_ENABLED) return true;
        return false; // Other toggles off by default
      });

      const { unmount } = render(<EventDebugger key="unmount-specific-test" />);

      await waitFor(() => {
        // A simple check to ensure the component's effects related to subscriptions have run
        // We expect at least one monitoring subscription to have been made
        expect(localMonitoringSubCount).toBeGreaterThan(0);
      });

      unmount();

      expect(localMockUnsubscribeConfig).toHaveBeenCalledTimes(3);
      expect(localMockUnsubscribeMonitoring).toHaveBeenCalledTimes(13); // 6 Calendar, 4 App, 2 Storage, 1 Dev 'test'

      // Verify the counters from the mockImplementation also match
      expect(localConfigSubCount).toBe(3);
      expect(localMonitoringSubCount).toBe(13);

      // Restore the original mock
      eventBus.subscribe = originalEventBusSubscribe;
    });
  });
});
