/**
 * @jest-environment jsdom
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock UI Components
jest.mock("../../../../../src/components/ui/button", () => {
  return jest.fn(({ children, onClick, variant, size, disabled }) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      disabled={disabled}
      className="mocked-button"
    >
      {children}
    </button>
  ));
});
jest.mock("../../../../../src/components/ui/dialog", () => {
  return jest.fn(({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-dialog" aria-label={title}>
        {" "}
        {/* El título del diálogo se usa como aria-label */}
        <h2 data-testid="dialog-actual-title">{title}</h2>{" "}
        {/* Añadimos un testid al título real */}
        {children}
        <button onClick={onClose}>Close Dialog</button>
      </div>
    );
  });
});

// Mock Child Dashboards/Managers
const mockThreatsDashboard = jest.fn(({ onPluginClick }) => (
  <div
    data-testid="mock-threats-dashboard"
    onClick={() => onPluginClick("pluginX")}
  >
    ThreatsDashboardMock
  </div>
));
const mockPermissionsManager = jest.fn(({ onPluginClick }) => (
  <div
    data-testid="mock-permissions-manager"
    onClick={() => onPluginClick("pluginY")}
  >
    PermissionsManagerMock
  </div>
));
const mockAuditDashboard = jest.fn(({ onPluginClick }) => (
  <div
    data-testid="mock-audit-dashboard"
    onClick={() => onPluginClick("pluginZ")}
  >
    AuditDashboardMock
  </div>
));

jest.mock(
  "../../../../../src/components/security/threats-dashboard",
  () => mockThreatsDashboard
);
jest.mock(
  "../../../../../src/components/security/permissions-manager",
  () => mockPermissionsManager
);
jest.mock(
  "../../../../../src/components/security/audit-dashboard",
  () => mockAuditDashboard
);

// Mock Core Services
const mockPluginManager = {
  getSecurityStats: jest.fn(),
  setSecurityLevel: jest.fn().mockResolvedValue(true),
  getPendingPermissionRequests: jest.fn(() => []),
  getPluginSecurityInfo: jest.fn(),
  approvePluginPermissions: jest.fn().mockResolvedValue(true),
  rejectPluginPermissions: jest.fn().mockResolvedValue(true),
  blacklistPlugin: jest.fn().mockResolvedValue(true),
  whitelistPlugin: jest.fn().mockResolvedValue(true),
  deactivatePlugin: jest.fn().mockResolvedValue(true),
};
jest.mock(
  "../../../../../src/core/plugins/plugin-manager",
  () => mockPluginManager
);

const mockPluginSecurityManager = {
  toggleSecurityCheck: jest.fn().mockReturnValue(true),
};
jest.mock(
  "../../../../../src/core/plugins/plugin-security-manager",
  () => mockPluginSecurityManager
);

const mockPluginSecurityAudit = {
  getAuditLog: jest.fn(() => []),
  clearAllAuditLogs: jest.fn().mockResolvedValue(true),
};
jest.mock(
  "../../../../../src/core/plugins/plugin-security-audit",
  () => mockPluginSecurityAudit
);

const mockConstants = {
  PLUGIN_CONSTANTS: {
    SECURITY: {
      LEVEL: { LOW: "low", NORMAL: "normal", HIGH: "high" },
      PERMISSION_TYPES: { STORAGE: "Almacenamiento", NETWORK: "Red" }, // Asegúrate que estos coincidan con los usados
    },
  },
};
jest.mock("../../../../../src/core/config/constants", () => mockConstants);

const SecurityPanel =
  require("../../../../../src/components/settings/security-panel").default;
const { PLUGIN_CONSTANTS } = mockConstants;

describe("SecurityPanel Component", () => {
  const mockSecurityStatsData = {
    securityEnabled: true,
    securityLevel: PLUGIN_CONSTANTS.SECURITY.LEVEL.NORMAL,
    activeChecks: ["resourceUsage", "apiAccess"],
    threats: {
      recent: [
        {
          pluginId: "pluginX",
          timestamp: Date.now(),
          severity: "high",
          type: "test-threat",
          actionTaken: "blocked",
        },
      ],
    },
  };
  const mockPluginSecurityInfoData = {
    id: "pluginX", // Añadir id para el título del diálogo
    securityScore: 80,
    permissions: { approved: ["storage"], pending: ["network"] },
    resourceUsage: {
      operationCounts: { cpuTime: 10, totalOperations: 100 },
      resources: { storage: 1024 },
    },
    auditHistory: [
      { timestamp: Date.now(), auditType: "test", eventType: "testEvent" },
    ],
    blacklisted: false, // Añadir estado de blacklist
    warnings: [],
    sandboxErrors: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPluginManager.getSecurityStats.mockReturnValue(mockSecurityStatsData);
    mockPluginManager.getPendingPermissionRequests.mockReturnValue([
      { pluginId: "pluginY", permissions: ["network"], timestamp: Date.now() },
    ]);
    mockPluginManager.getPluginSecurityInfo.mockImplementation((pluginId) => {
      if (pluginId === "pluginX") {
        return { ...mockPluginSecurityInfoData, id: pluginId }; // Devolver info con el id correcto
      }
      return {
        // Devolver un objeto por defecto si no es pluginX
        id: pluginId,
        securityScore: 50,
        permissions: { approved: [], pending: [] },
        resourceUsage: {},
        auditHistory: [],
        blacklisted: false,
      };
    });
    mockPluginSecurityAudit.getAuditLog.mockReturnValue([
      {
        timestamp: Date.now(),
        pluginId: "pluginZ",
        auditType: "testAudit",
        eventType: "logEvent",
        details: {},
      },
    ]);

    // Reset window.confirm para cada test
    window.confirm = jest.fn(() => true);
  });

  test("debe renderizar el panel de seguridad y cargar datos iniciales", async () => {
    render(<SecurityPanel />);
    expect(await screen.findByText("Seguridad de Plugins")).toBeInTheDocument();
    expect(mockPluginManager.getSecurityStats).toHaveBeenCalled();
    expect(mockPluginManager.getPendingPermissionRequests).toHaveBeenCalled();
    expect(mockPluginSecurityAudit.getAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 50 })
    );

    expect(screen.getByTestId("mock-threats-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("mock-permissions-manager")).toBeInTheDocument();
    expect(screen.getByTestId("mock-audit-dashboard")).toBeInTheDocument();
  });

  test("debe mostrar mensaje si el sistema de seguridad está desactivado", async () => {
    mockPluginManager.getSecurityStats.mockReturnValueOnce({
      securityEnabled: false,
    });
    render(<SecurityPanel />);
    expect(
      await screen.findByText("Sistema de Seguridad Desactivado")
    ).toBeInTheDocument();
  });

  test("debe cambiar el nivel de seguridad", async () => {
    render(<SecurityPanel />);
    await screen.findByText("Seguridad de Plugins");

    const highLevelRadio = screen.getByLabelText(/Alto/i, {
      selector: 'input[type="radio"]',
    });
    await act(async () => {
      fireEvent.click(highLevelRadio);
    });

    await waitFor(() => {
      expect(mockPluginManager.setSecurityLevel).toHaveBeenCalledWith(
        PLUGIN_CONSTANTS.SECURITY.LEVEL.HIGH
      );
    });
    expect(highLevelRadio).toBeChecked();
  });

  test("debe activar/desactivar una verificación de seguridad", async () => {
    render(<SecurityPanel />);
    await screen.findByText("Seguridad de Plugins");

    const resourceUsageCheckbox = screen.getByLabelText(
      /Monitoreo de Recursos/i
    );
    expect(resourceUsageCheckbox).toBeChecked();

    await act(async () => {
      fireEvent.click(resourceUsageCheckbox);
    });

    await waitFor(() => {
      expect(
        mockPluginSecurityManager.toggleSecurityCheck
      ).toHaveBeenCalledWith("resourceUsage", false);
    });
    expect(resourceUsageCheckbox).not.toBeChecked();

    await act(async () => {
      fireEvent.click(resourceUsageCheckbox);
    });
    await waitFor(() => {
      expect(
        mockPluginSecurityManager.toggleSecurityCheck
      ).toHaveBeenCalledWith("resourceUsage", true);
    });
    expect(resourceUsageCheckbox).toBeChecked();
  });

  test("debe mostrar detalles de seguridad de un plugin desde ThreatsDashboard", async () => {
    render(<SecurityPanel />);
    await screen.findByText("Seguridad de Plugins");

    fireEvent.click(screen.getByTestId("mock-threats-dashboard")); // Esto llama a onPluginClick('pluginX')

    expect(await screen.findByTestId("mock-dialog")).toBeInTheDocument();
    // CORRECCIÓN: Buscar el título del diálogo por su testid específico
    expect(screen.getByTestId("dialog-actual-title")).toHaveTextContent(
      "Seguridad de Plugin: pluginX"
    );
    expect(screen.getByText("Puntuación de Seguridad")).toBeInTheDocument(); // Un elemento dentro del diálogo
  });

  test("debe abrir el diálogo de detalles de seguridad y mostrar información del plugin (prueba directa de showPluginSecurity)", async () => {
    // Este test es similar al anterior, pero fuerza la llamada a showPluginSecurity
    // para asegurar que la función interna y el renderizado del diálogo funcionan.
    const { container } = render(<SecurityPanel />);
    await screen.findByText("Seguridad de Plugins"); // Esperar carga inicial

    // Para llamar a showPluginSecurity directamente en el test, necesitaríamos exponerla
    // o tener un elemento en SecurityPanel que la llame.
    // Dado que los dashboards hijos ya la llaman, el test anterior es más representativo.
    // Si quisiéramos probar showPluginSecurity de forma aislada, necesitaríamos refactorizar
    // o encontrar una forma de invocarla.
    // Por ahora, nos basamos en la cobertura del test anterior.
    // Si se añade un botón en SecurityPanel para ver seguridad de un plugin específico:
    // fireEvent.click(screen.getByTestId('boton-ver-seguridad-pluginX'));

    // Este test ahora se enfocará en que la función showPluginSecurity (cuando es llamada)
    // efectivamente actualice el estado y muestre el diálogo.
    // Como es llamada desde los hijos, probaremos si un click en un hijo (simulado) la activa.
    fireEvent.click(screen.getByTestId("mock-permissions-manager")); // Llama a onPluginClick('pluginY')

    expect(await screen.findByTestId("mock-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("dialog-actual-title")).toHaveTextContent(
      "Seguridad de Plugin: pluginY"
    );
  });

  // ... (otros tests como manejo de permisos, blacklist, logs de auditoría pueden añadirse aquí)
  // Esos tests serían más complejos ya que implicarían interactuar con los diálogos.
});
