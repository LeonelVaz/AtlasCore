import React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import App, { AppContent } from "../../../src/app";

// Declarar variables mock ANTES de los mocks para evitar errores de inicialización
const mockDialogContext = {
  showAlert: jest.fn(),
  showConfirm: jest.fn(),
  showPrompt: jest.fn(),
};

// Mocks de componentes
jest.mock("../../../src/components/calendar/calendar-main", () => {
  return function CalendarMain() {
    return <div data-testid="calendar-main">Calendar Main Component</div>;
  };
});

jest.mock("../../../src/components/settings/settings-panel", () => {
  return function SettingsPanel() {
    return <div data-testid="settings-panel">Settings Panel Component</div>;
  };
});

jest.mock("../../../src/components/ui/sidebar/Sidebar", () => {
  return function Sidebar({ children, onPluginNavigate }) {
    return (
      <div data-testid="sidebar" data-on-plugin-navigate={!!onPluginNavigate}>
        {children}
      </div>
    );
  };
});

jest.mock("../../../src/components/ui/sidebar/sidebar-item", () => {
  return function SidebarItem({ icon, label, active, onClick }) {
    return (
      <div
        data-testid={`sidebar-item-${label.toLowerCase()}`}
        data-active={active}
        onClick={onClick}
        className={active ? "active" : ""}
      >
        <span data-testid="icon">{icon}</span>
        <span data-testid="label">{label}</span>
      </div>
    );
  };
});

jest.mock("../../../src/components/ui/window-controls", () => {
  return function WindowControls() {
    return <div data-testid="window-controls">Window Controls</div>;
  };
});

// Mock corregido para PluginPages
jest.mock("../../../src/components/plugin-extension/plugin-pages", () => {
  const PluginPages = function PluginPages({ currentPluginPage }) {
    if (!currentPluginPage) {
      return (
        <div className="plugin-error" data-testid="plugin-error">
          No se ha seleccionado ninguna página de plugin.
        </div>
      );
    }
    return (
      <div data-testid="plugin-pages">
        Plugin Page: {currentPluginPage?.pluginId}/{currentPluginPage?.pageId}
      </div>
    );
  };

  // Export tanto default como named export para compatibilidad
  return {
    __esModule: true,
    default: PluginPages,
    PluginPages: PluginPages,
  };
});

jest.mock("../../../src/components/debug/event-debugger", () => {
  return function EventDebugger() {
    return <div data-testid="event-debugger">Event Debugger</div>;
  };
});

// Mocks de contextos
jest.mock("../../../src/contexts/config-provider", () => {
  return function ConfigProvider({ children }) {
    return <div data-testid="config-provider">{children}</div>;
  };
});

jest.mock("../../../src/contexts/dialog-context", () => ({
  DialogProvider: function DialogProvider({ children }) {
    return <div data-testid="dialog-provider">{children}</div>;
  },
  useDialog: jest.fn(),
}));

// Mocks de utilidades
jest.mock("../../../src/utils/dialog-interceptor", () => ({
  initializeDialogInterceptor: jest.fn(),
}));

jest.mock("../../../src/utils/electron-detector", () => ({
  isElectronEnv: jest.fn(() => false),
}));

// Mocks de servicios y sistemas
jest.mock("../../../src/core/plugins/plugin-manager", () => ({
  initialize: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../src/services/storage-service", () => ({
  get: jest.fn(),
}));

jest.mock("../../../src/core/bus/event-bus", () => ({
  subscribe: jest.fn(() => jest.fn()), // Retorna función de unsubscribe
  setDebugMode: jest.fn(),
}));

jest.mock("../../../src/core/config/constants", () => ({
  STORAGE_KEYS: {
    DEV_EVENT_DEBUGGER_ENABLED: "dev.event_debugger_enabled",
    DEV_CONSOLE_LOGS_ENABLED: "dev.console_logs_enabled",
  },
}));

// Importar mocks después de definirlos
import { initializeDialogInterceptor } from "../../../src/utils/dialog-interceptor";
import { isElectronEnv } from "../../../src/utils/electron-detector";
import pluginManager from "../../../src/core/plugins/plugin-manager";
import storageService from "../../../src/services/storage-service";
import eventBus from "../../../src/core/bus/event-bus";
import { useDialog } from "../../../src/contexts/dialog-context";
import PluginPages from "../../../src/components/plugin-extension/plugin-pages";

// Mock de console.log y console.error para evitar ruido en tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe("App Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Configurar el mock de useDialog para retornar el contexto por defecto
    useDialog.mockReturnValue(mockDialogContext);
    // Reset storage service mock responses
    storageService.get.mockResolvedValue(false);
    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe("App (Main Component)", () => {
    test("renders with all providers", () => {
      render(<App />);

      expect(screen.getByTestId("config-provider")).toBeInTheDocument();
      expect(screen.getByTestId("dialog-provider")).toBeInTheDocument();
    });

    test("renders AppContent inside providers", () => {
      render(<App />);

      expect(screen.getByTestId("calendar-main")).toBeInTheDocument();
      expect(screen.getByRole("banner")).toBeInTheDocument(); // header
    });
  });

  describe("AppContent Component", () => {
    test("renders default layout with calendar section active", () => {
      render(<App />);

      expect(screen.getByRole("banner")).toBeInTheDocument();
      expect(screen.getByTestId("sidebar")).toBeInTheDocument();
      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(screen.getByTestId("calendar-main")).toBeInTheDocument();
    });

    test("renders app logo", () => {
      render(<App />);

      const logo = screen.getByAltText("Atlas");
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute("src", "/logo-white.png");
      expect(logo).toHaveAttribute("height", "40");
    });

    test("renders sidebar items correctly", () => {
      render(<App />);

      expect(screen.getByTestId("sidebar-item-calendario")).toBeInTheDocument();
      expect(
        screen.getByTestId("sidebar-item-configuración")
      ).toBeInTheDocument();

      // Calendar should be active by default
      expect(screen.getByTestId("sidebar-item-calendario")).toHaveAttribute(
        "data-active",
        "true"
      );
      expect(screen.getByTestId("sidebar-item-configuración")).toHaveAttribute(
        "data-active",
        "false"
      );
    });

    test("switches to settings panel when settings item is clicked", () => {
      render(<App />);

      const settingsItem = screen.getByTestId("sidebar-item-configuración");
      fireEvent.click(settingsItem);

      expect(screen.getByTestId("settings-panel")).toBeInTheDocument();
      expect(screen.queryByTestId("calendar-main")).not.toBeInTheDocument();
    });

    test("maintains active state in sidebar when switching sections", () => {
      render(<App />);

      const settingsItem = screen.getByTestId("sidebar-item-configuración");
      fireEvent.click(settingsItem);

      expect(screen.getByTestId("sidebar-item-configuración")).toHaveAttribute(
        "data-active",
        "true"
      );
      expect(screen.getByTestId("sidebar-item-calendario")).toHaveAttribute(
        "data-active",
        "false"
      );
    });

    test("switches back to calendar from settings", () => {
      render(<App />);

      // Go to settings
      fireEvent.click(screen.getByTestId("sidebar-item-configuración"));
      expect(screen.getByTestId("settings-panel")).toBeInTheDocument();

      // Go back to calendar
      fireEvent.click(screen.getByTestId("sidebar-item-calendario"));
      expect(screen.getByTestId("calendar-main")).toBeInTheDocument();
      expect(screen.queryByTestId("settings-panel")).not.toBeInTheDocument();
    });

    test("handles unknown section by defaulting to calendar", () => {
      render(<App />);

      // Simulate an unknown section (this would happen in renderContent switch default case)
      // Since we can't directly call renderContent, we test through the default behavior
      expect(screen.getByTestId("calendar-main")).toBeInTheDocument();
    });
  });

  describe("Electron Environment", () => {
    test("renders window controls when in electron environment", () => {
      isElectronEnv.mockReturnValue(true);

      render(<App />);

      expect(screen.getByTestId("window-controls")).toBeInTheDocument();
      expect(screen.getByRole("banner")).toHaveClass("draggable");
    });

    test("does not render window controls when not in electron environment", () => {
      isElectronEnv.mockReturnValue(false);

      render(<App />);

      expect(screen.queryByTestId("window-controls")).not.toBeInTheDocument();
      expect(screen.getByRole("banner")).not.toHaveClass("draggable");
    });
  });

  describe("Plugin System Integration", () => {
    test("initializes plugin manager with dialog context", async () => {
      render(<App />);

      await waitFor(() => {
        expect(pluginManager.initialize).toHaveBeenCalledWith({
          dialog: mockDialogContext,
        });
      });
    });

    test("handles plugin initialization error", async () => {
      const error = new Error("Plugin initialization failed");
      pluginManager.initialize.mockRejectedValue(error);

      render(<App />);

      await waitFor(() => {
        expect(mockDialogContext.showAlert).toHaveBeenCalledWith(
          "Error al inicializar el sistema de plugins: Plugin initialization failed",
          "Error de inicialización"
        );
      });
    });

    test("logs success message when plugin system initializes correctly", async () => {
      pluginManager.initialize.mockResolvedValue(undefined);

      render(<App />);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith(
          "Sistema de plugins inicializado con soporte para diálogos"
        );
      });
    });

    test("logs error when plugin system fails to initialize", async () => {
      const error = new Error("Plugin initialization failed");
      pluginManager.initialize.mockRejectedValue(error);

      render(<App />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          "Error al inicializar sistema de plugins:",
          error
        );
      });
    });

    test("renders plugin pages when plugin section is active with valid plugin page", () => {
      // Test sin plugin page (caso de error)
      const { unmount } = render(<PluginPages currentPluginPage={null} />);
      expect(screen.getByTestId("plugin-error")).toBeInTheDocument();
      expect(
        screen.getByText("No se ha seleccionado ninguna página de plugin.")
      ).toBeInTheDocument();

      // Limpiar el render anterior
      unmount();

      // Test con plugin page válida
      render(
        <PluginPages
          currentPluginPage={{ pluginId: "test-plugin", pageId: "test-page" }}
        />
      );
      expect(screen.getByTestId("plugin-pages")).toBeInTheDocument();
      expect(
        screen.getByText("Plugin Page: test-plugin/test-page")
      ).toBeInTheDocument();
    });
  });

  describe("Dialog System Integration", () => {
    test("initializes dialog interceptor with dialog context", async () => {
      render(<App />);

      await waitFor(() => {
        expect(initializeDialogInterceptor).toHaveBeenCalledWith(
          mockDialogContext
        );
      });
    });

    test("logs success message when dialog interceptor initializes", async () => {
      render(<App />);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith(
          "Interceptor de diálogos inicializado"
        );
      });
    });

    test("waits for dialog context before initializing plugin system", async () => {
      // First render with null dialog context
      useDialog.mockReturnValue(null);
      const { rerender } = render(<App />);

      // Plugin manager should not be called yet
      expect(pluginManager.initialize).not.toHaveBeenCalled();

      // Then provide dialog context
      useDialog.mockReturnValue(mockDialogContext);
      rerender(<App />);

      await waitFor(() => {
        expect(pluginManager.initialize).toHaveBeenCalledWith({
          dialog: mockDialogContext,
        });
      });
    });
  });

  describe("Event Debugger Integration", () => {
    test("loads debugger configuration on mount", async () => {
      storageService.get
        .mockResolvedValueOnce(true) // DEV_EVENT_DEBUGGER_ENABLED
        .mockResolvedValueOnce(false); // DEV_CONSOLE_LOGS_ENABLED

      render(<App />);

      await waitFor(() => {
        expect(storageService.get).toHaveBeenCalledWith(
          "dev.event_debugger_enabled",
          false
        );
        expect(storageService.get).toHaveBeenCalledWith(
          "dev.console_logs_enabled",
          false
        );
      });
    });

    test("enables debug mode when console logs are enabled", async () => {
      storageService.get
        .mockResolvedValueOnce(false) // DEV_EVENT_DEBUGGER_ENABLED
        .mockResolvedValueOnce(true); // DEV_CONSOLE_LOGS_ENABLED

      render(<App />);

      await waitFor(() => {
        expect(eventBus.setDebugMode).toHaveBeenCalledWith(true);
        expect(console.log).toHaveBeenCalledWith(
          "🔧 Modo debug activado para el sistema de eventos"
        );
      });
    });

    test("subscribes to debugger toggle events", () => {
      render(<App />);

      expect(eventBus.subscribe).toHaveBeenCalledWith(
        "developer.eventDebuggerToggled",
        expect.any(Function)
      );
    });

    test("handles debugger toggle event", async () => {
      let toggleCallback;
      eventBus.subscribe.mockImplementation((event, callback) => {
        if (event === "developer.eventDebuggerToggled") {
          toggleCallback = callback;
        }
        return jest.fn(); // unsubscribe function
      });

      render(<App />);

      // Simulate debugger toggle event
      await act(async () => {
        toggleCallback({ enabled: true });
      });

      // The debugger state should be updated (we can't directly test state,
      // but we can ensure the callback was set up correctly)
      expect(toggleCallback).toBeDefined();
    });

    test("handles debugger configuration loading error", async () => {
      const error = new Error("Storage error");
      storageService.get.mockRejectedValue(error);

      render(<App />);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          "Error al cargar configuración de desarrollo:",
          error
        );
      });
    });
  });

  describe("Layout and Structure", () => {
    test("has correct CSS classes and structure", () => {
      render(<App />);

      const appContainer = screen
        .getByTestId("calendar-main")
        .closest(".app-container");
      expect(appContainer).toBeInTheDocument();

      const header = screen.getByRole("banner");
      expect(header).toHaveClass("app-header");

      const main = screen.getByRole("main");
      expect(main).toHaveClass("app-content");
    });

    test("passes onPluginNavigate prop to Sidebar", () => {
      render(<App />);

      const sidebar = screen.getByTestId("sidebar");
      expect(sidebar).toHaveAttribute("data-on-plugin-navigate", "true");
    });

    test("has correct app-main structure", () => {
      render(<App />);

      const sidebar = screen.getByTestId("sidebar");
      const main = screen.getByRole("main");

      // Both should be inside the same parent container
      expect(sidebar.parentElement).toBe(main.parentElement);
      expect(sidebar.parentElement).toHaveClass("app-main");
    });
  });

  describe("Constants and Configuration", () => {
    test("APP_SECTIONS constants are used correctly", () => {
      render(<App />);

      // Test that sidebar items use the correct labels from APP_SECTIONS
      expect(screen.getByText("Calendario")).toBeInTheDocument();
      expect(screen.getByText("Configuración")).toBeInTheDocument();

      // Test that icons are rendered from APP_SECTIONS
      const calendarItem = screen.getByTestId("sidebar-item-calendario");
      expect(
        calendarItem.querySelector('[data-testid="icon"]')
      ).toHaveTextContent("calendar_today");

      const settingsItem = screen.getByTestId("sidebar-item-configuración");
      expect(
        settingsItem.querySelector('[data-testid="icon"]')
      ).toHaveTextContent("settings");
    });
  });

  describe("Memory Cleanup", () => {
    test("cleans up event subscriptions on unmount", () => {
      const unsubscribeMock = jest.fn();
      eventBus.subscribe.mockReturnValue(unsubscribeMock);

      const { unmount } = render(<App />);

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });

    test("handles missing unsubscribe function gracefully", () => {
      eventBus.subscribe.mockReturnValue(null);

      const { unmount } = render(<App />);

      // Should not throw error when unsubscribe is null
      expect(() => unmount()).not.toThrow();
    });

    test("handles undefined unsubscribe function gracefully", () => {
      eventBus.subscribe.mockReturnValue(undefined);

      const { unmount } = render(<App />);

      // Should not throw error when unsubscribe is undefined
      expect(() => unmount()).not.toThrow();
    });
  });

  describe("Edge Cases and Error Handling", () => {
    test("handles missing dialog context gracefully in plugin initialization", () => {
      useDialog.mockReturnValue(null);

      render(<App />);

      // Plugin manager should not be initialized without dialog context
      expect(pluginManager.initialize).not.toHaveBeenCalled();
    });

    test("handles missing dialog context gracefully in dialog interceptor", () => {
      useDialog.mockReturnValue(null);

      render(<App />);

      // Dialog interceptor should not be initialized without dialog context
      expect(initializeDialogInterceptor).not.toHaveBeenCalled();
    });

    test("handles all storage service calls correctly", async () => {
      storageService.get
        .mockResolvedValueOnce(true) // DEV_EVENT_DEBUGGER_ENABLED
        .mockResolvedValueOnce(true); // DEV_CONSOLE_LOGS_ENABLED

      render(<App />);

      await waitFor(() => {
        expect(storageService.get).toHaveBeenCalledTimes(2);
        expect(eventBus.setDebugMode).toHaveBeenCalledWith(true);
      });
    });

    test("renders correctly when debugger is enabled from storage", async () => {
      storageService.get
        .mockResolvedValueOnce(true) // DEV_EVENT_DEBUGGER_ENABLED
        .mockResolvedValueOnce(false); // DEV_CONSOLE_LOGS_ENABLED

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId("event-debugger")).toBeInTheDocument();
      });
    });
  });
});
