// =================================================================================================
// DOCUMENTACIÓN Y GUÍA PARA ESTE TEST SUITE DE THREATS DASHBOARD
// =================================================================================================
//
// Este test suite para ThreatsDashboard aplica lecciones aprendidas de depuraciones extensas
// en componentes React complejos con Jest y React Testing Library (RTL).
//
// Principios Clave Aplicados:
//
// 1.  MOCKS DE MÓDULOS ANTES DE IMPORTACIONES:
//     - Todos los `jest.mock()` y `jest.doMock()` para dependencias directas del componente
//       (ej. `Button`, `pluginSecurityManager`) se definen al principio del archivo,
//       ANTES de cualquier `require()` o `import` del componente `ThreatsDashboard`
//       o de los módulos mockeados.
//     - `jest.doMock()` se usa para `pluginSecurityManager` ya que es un servicio
//       que podría ser un singleton o tener lógica de inicialización.
//
// 2.  `require()` DESPUÉS DE MOCKS:
//     - El componente `ThreatsDashboard` y la instancia mockeada de `pluginSecurityManager`
//       se importan usando `require()` DESPUÉS de que todos los mocks relevantes
//       hayan sido declarados.
//
// 3.  `beforeEach` y `afterEach` GLOBALES AL `describe`:
//     - `beforeEach`: Para `jest.clearAllMocks()`.
//     - `afterEach`: Para `jest.useRealTimers()`.
//
// 4.  OPERACIONES ASÍNCRONAS Y ESTADOS DE CARGA:
//     - `await screen.findByText(...)` se usa para esperar a que los elementos aparezcan
//       después de operaciones asíncronas (carga de datos en `useEffect`).
//     - Se evita aserciones sobre el texto "Cargando..." si el contenido final aparece
//       rápidamente, para reducir la inestabilidad del test.
//
// 5.  QUERIES ESPECÍFICAS Y `within`:
//     - `within(element)` se usa para acotar las búsquedas a una sección específica del DOM,
//       haciendo las queries más robustas (ej. buscar texto dentro de la sección
//       '.recent-threats').
//     - Funciones como matcher para `getByText` o `getAllByText` son cruciales cuando
//       el texto puede estar distribuido en múltiples nodos HTML o cuando se necesita
//       validar el contexto del nodo además de su contenido.
//       Ejemplo: `screen.getAllByText((content, node) => node.closest('.summary-card')?.textContent.includes('Total de Amenazas5'))`
//       - **Lección aprendida aquí:** Si un matcher de función para `getByText` es verdadero para
//         MÚLTIPLES nodos (porque, por ejemplo, todos comparten un ancestro común cuyo
//         `textContent` completo coincide), `getByText` fallará. En tales casos, se debe:
//         a) Usar `getAllByText` y verificar que `length > 0`.
//         b) Hacer la función matcher más específica para que solo devuelva `true` para el
//            nodo exacto deseado (ej. verificando `node.classList.contains('clase-especifica')`).
//
// 6.  DATOS MOCKEADOS:
//     - Se definen estructuras de datos mockeadas claras para simular la respuesta de
//       `pluginSecurityManager.getSecurityStats()`.
//
// 7.  `setupTests.js` MÍNIMO:
//     - El archivo de setup global de Jest (`setupTests.js`) se mantiene lo más simple
//       posible, solo con configuraciones verdaderamente globales como `@testing-library/jest-dom`
//       o mocks de `window` muy básicos. Los mocks de módulos específicos de la aplicación
//       se manejan localmente en sus respectivos archivos de test. Esto fue clave para
//       resolver problemas iniciales de renderizado donde el DOM aparecía vacío.
//
// Este enfoque busca asegurar que los tests sean robustos, mantenibles y verifiquen
// correctamente el comportamiento del componente con sus dependencias mockeadas.
// =================================================================================================

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

// --- Definición de Mocks ANTES de cualquier importación de la app ---

jest.mock("../../../../../src/components/ui/button", () => {
  return jest.fn(
    ({ children, onClick, variant, size, disabled, className }) => (
      <button
        onClick={onClick}
        data-variant={variant}
        data-size={size}
        disabled={disabled}
        className={className || "mocked-button"}
      >
        {children}
      </button>
    )
  );
});

const MOCK_SECURITY_MANAGER_PATH =
  "../../../../../src/core/plugins/plugin-security-manager";

const mockSecurityStatsData = {
  detectedThreats: {
    total: 5,
    bySeverity: { critical: 1, high: 2, medium: 1, low: 1 },
    recent: [
      {
        pluginId: "pluginX",
        timestamp: new Date("2023-10-26T10:00:00Z").getTime(),
        severity: "critical",
        type: "malware",
        actionTaken: "quarantined",
      },
      {
        pluginId: "pluginY",
        timestamp: new Date("2023-10-26T09:00:00Z").getTime(),
        severity: "high",
        type: "phishingAttempt",
        actionTaken: "blocked",
      },
      {
        pluginId: "pluginZ",
        timestamp: new Date("2023-10-26T08:00:00Z").getTime(),
        severity: "medium",
        type: "suspiciousLogin",
        actionTaken: "alerted",
      },
    ],
    byType: { malware: 1, phishingAttempt: 2, suspiciousLogin: 1, dataLeak: 1 },
  },
  overallScore: 75,
  activeProtections: ["firewall", "antivirus"],
};

jest.doMock(MOCK_SECURITY_MANAGER_PATH, () => {
  return {
    __esModule: true,
    default: {
      getSecurityStats: jest.fn(() => mockSecurityStatsData),
    },
  };
});

// --- Importaciones de la App DESPUÉS de los mocks ---
const ThreatsDashboard =
  require("../../../../../src/components/security/threats-dashboard").default;
const pluginSecurityManager = require(MOCK_SECURITY_MANAGER_PATH).default;

describe("ThreatsDashboard Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("debe renderizar el dashboard completo y cargar datos iniciales", async () => {
    render(<ThreatsDashboard />);
    expect(
      await screen.findByText("Dashboard de Amenazas", {}, { timeout: 3000 })
    ).toBeInTheDocument();
    expect(pluginSecurityManager.getSecurityStats).toHaveBeenCalledTimes(1);

    expect(
      screen.getAllByText((content, node) =>
        node
          .closest(".summary-card")
          ?.textContent.includes("Total de Amenazas5")
      ).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText((content, node) =>
        node
          .closest(".summary-card")
          ?.textContent.includes("Amenazas Críticas1")
      ).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText((content, node) =>
        node.closest(".summary-card")?.textContent.includes("Amenazas Altas2")
      ).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText((content, node) =>
        node.closest(".summary-card")?.textContent.includes("Amenazas Medias1")
      ).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText((content, node) =>
        node.closest(".summary-card")?.textContent.includes("Amenazas Bajas1")
      ).length
    ).toBeGreaterThan(0);

    const threatsByTypeTitle = screen.getByText("Amenazas por Tipo");
    const threatsByTypeSection = threatsByTypeTitle.closest(".threats-by-type");
    expect(threatsByTypeSection).toBeInTheDocument();

    expect(
      within(threatsByTypeSection).getByText("malware")
    ).toBeInTheDocument();
    expect(
      within(threatsByTypeSection).getByText("phishingAttempt")
    ).toBeInTheDocument();

    const recentThreatsTitle = await screen.findByText("Amenazas Recientes");
    const recentThreatsSection = recentThreatsTitle.closest(".recent-threats");
    expect(recentThreatsSection).toBeInTheDocument();

    expect(
      within(recentThreatsSection).getByText(
        (content, node) =>
          node.classList.contains("threat-type") &&
          (node.textContent || "").includes("Tipo: malware")
      )
    ).toBeInTheDocument();

    expect(
      within(recentThreatsSection).getByText(
        (content, node) =>
          node.classList.contains("threat-type") &&
          (node.textContent || "").includes("Tipo: phishingAttempt")
      )
    ).toBeInTheDocument();
  });

  test("debe renderizar la vista compacta y mostrar datos resumidos", async () => {
    const mockOnPluginClick = jest.fn();
    render(
      <ThreatsDashboard compact={true} onPluginClick={mockOnPluginClick} />
    );
    expect(
      await screen.findByText("Resumen de Amenazas", {}, { timeout: 3000 })
    ).toBeInTheDocument();
    expect(pluginSecurityManager.getSecurityStats).toHaveBeenCalledTimes(1);

    expect(
      screen.getAllByText((content, node) =>
        node
          .closest(".summary-card")
          ?.textContent.includes("Total de Amenazas5")
      ).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText((content, node) =>
        node
          .closest(".summary-card")
          ?.textContent.includes("Amenazas Críticas1")
      ).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText((content, node) =>
        node.closest(".summary-card")?.textContent.includes("Amenazas Altas2")
      ).length
    ).toBeGreaterThan(0);

    const recentThreatsTitleCompact = await screen.findByText(
      "Amenazas Recientes"
    );
    const recentThreatsSectionCompact = recentThreatsTitleCompact.closest(
      ".recent-threats.compact"
    );
    expect(recentThreatsSectionCompact).toBeInTheDocument();

    expect(
      within(recentThreatsSectionCompact).getByText(
        (content, node) =>
          node.classList.contains("threat-type") &&
          (node.textContent || "").includes("Tipo: malware")
      )
    ).toBeInTheDocument();

    const detailsButtons = within(recentThreatsSectionCompact).getAllByText(
      "Ver Detalles"
    );
    expect(detailsButtons.length).toBeGreaterThan(0);
    fireEvent.click(detailsButtons[0]);
    expect(mockOnPluginClick).toHaveBeenCalledWith("pluginX");
  });

  test("debe refrescar los datos al hacer clic en el botón Refrescar", async () => {
    render(<ThreatsDashboard />);
    await screen.findByText("Dashboard de Amenazas");
    pluginSecurityManager.getSecurityStats.mockClear();
    const refreshButton = screen.getByText("Refrescar");
    await act(async () => {
      fireEvent.click(refreshButton);
    });
    await waitFor(() =>
      expect(pluginSecurityManager.getSecurityStats).toHaveBeenCalledTimes(1)
    );
  });

  test("debe manejar correctamente la ausencia de datos de amenazas", async () => {
    pluginSecurityManager.getSecurityStats.mockReturnValueOnce({
      detectedThreats: { total: 0, bySeverity: {}, recent: [], byType: {} },
    });

    render(<ThreatsDashboard />);
    await screen.findByText("Dashboard de Amenazas");

    expect(
      screen.getAllByText((content, node) =>
        node
          .closest(".summary-card")
          ?.textContent.includes("Total de Amenazas0")
      ).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText((content, node) =>
        node
          .closest(".summary-card")
          ?.textContent.includes("Amenazas Críticas0")
      ).length
    ).toBeGreaterThan(0);

    const threatsByTypeSection = screen
      .getByText("Amenazas por Tipo")
      .closest(".threats-by-type");
    expect(
      within(threatsByTypeSection).getByText("No hay datos disponibles")
    ).toBeInTheDocument();
    expect(screen.queryByText("Amenazas Recientes")).not.toBeInTheDocument();
  });

  test("debe renderizar la sección de amenazas a lo largo del tiempo", async () => {
    render(<ThreatsDashboard />);
    await screen.findByText("Dashboard de Amenazas");
    expect(
      screen.getByText("Amenazas a lo Largo del Tiempo")
    ).toBeInTheDocument();
    const timePoints = (
      await screen.findAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/)
    ).filter((el) => el.classList.contains("time-label"));
    expect(timePoints.length).toBe(7);
  });
});
