// =================================================================================================
// DOCUMENTACIÓN Y GUÍA PARA ESTE TEST SUITE DE PERMISSIONS MANAGER
// =================================================================================================
//
// Este test suite para PermissionsManager aplica lecciones aprendidas de depuraciones extensas
// en componentes React complejos con Jest y React Testing Library (RTL).
//
// Principios Clave Aplicados:
//
// 1.  MOCKS DE MÓDULOS ANTES DE IMPORTACIONES:
//     - Todos los `jest.mock()` y `jest.doMock()` para dependencias directas del componente
//       (ej. `Button`, `pluginPermissionChecker`, `pluginManager`, `PLUGIN_CONSTANTS`)
//       se definen al principio del archivo, ANTES de cualquier `require()` o `import`
//       del componente `PermissionsManager` o de los módulos mockeados.
//     - `jest.doMock()` se usa para módulos que podrían ser singletons o tener efectos
//       secundarios al importar (como `pluginPermissionChecker`, `pluginManager`), para
//       asegurar que el mock se aplique en el orden correcto y antes de que el
//       código de la aplicación lo necesite. `jest.mock()` se usa para componentes UI simples.
//
// 2.  `require()` DESPUÉS DE MOCKS:
//     - El componente `PermissionsManager` y las instancias mockeadas necesarias para
//       las aserciones (ej. `pluginManager`) se importan usando `require()` DESPUÉS
//       de que todos los mocks relevantes hayan sido declarados.
//
// 3.  `beforeEach` y `afterEach` GLOBALES AL `describe`:
//     - `beforeEach`: Principalmente para `jest.clearAllMocks()` y para mockear/restaurar
//       objetos globales como `window.confirm` y `window.alert`. Los spies del DOM
//       NO se configuran aquí globalmente para evitar interferencias con el renderizado.
//     - `afterEach`: Restaura `window.confirm`/`alert` y llama a `jest.useRealTimers()`
//       para asegurar que los timers de Jest estén limpios para el siguiente test.
//       También se encarga de restaurar spies del DOM si se crearon en algún test.
//
// 4.  SPIES DEL DOM AISLADOS (PARA TESTS ESPECÍFICOS):
//     - Si un test necesita espiar funciones del DOM (ej. `document.createElement` para
//       simular descargas), esos spies se declaran en el scope del `describe` principal
//       pero se configuran (`jest.spyOn`) DENTRO del `test` específico que los necesita,
//       idealmente DESPUÉS de que el componente se haya renderizado y estabilizado.
//     - Los spies se restauran en el `afterEach` global. Esto mantiene la configuración
//       del DOM limpia para la mayoría de los tests y solo la modifica cuando es necesario.
//
// 5.  MANEJO DE ASINCRONÍA Y ESTADOS DE CARGA:
//     - `await screen.findByText(...)` (y otras queries `findBy...`) se usa para esperar
//       a que los elementos aparezcan en el DOM después de operaciones asíncronas
//       (ej. carga de datos en `useEffect`).
//     - Se evita aserciones sobre estados de carga muy efímeros si el contenido final
//       aparece rápidamente, para reducir la inestabilidad del test.
//     - `act(async () => { ... })` se usa para envolver interacciones (`fireEvent`)
//       que causan actualizaciones de estado y para el avance de timers, asegurando
//       que todas las actualizaciones de React se procesen.
//
// 6.  TIMERS DE JEST (`useFakeTimers`, `runAllTimers`):
//     - `jest.useRealTimers()` se usa al inicio de tests que involucran la carga inicial
//       del componente si esta depende de `setTimeout`s reales o promesas.
//     - `jest.useFakeTimers()` se activa justo ANTES de la interacción que usa timers
//       controlables (ej. un `setTimeout` en una función `handleExport`).
//     - `act(() => { jest.runAllTimers(); })` para ejecutar los timers falsos.
//     - El `afterEach` global llama a `jest.useRealTimers()` para limpiar.
//
// 7.  QUERIES ESPECÍFICAS Y `within`:
//     - `within(element)` se usa para acotar las búsquedas a una sección específica del DOM,
//       haciendo las queries más robustas (ej. buscar un botón "Aprobar" dentro de una
//       fila de permiso específica).
//     - Funciones como matcher para `getAllByText((content, node) => ...)` cuando se
//       necesita una lógica de coincidencia más compleja o para asegurar que se encuentran
//       elementos que contienen ciertos sub-textos.
//
// 8.  `jest.clearAllMocks()`: En el `beforeEach` principal para resetear contadores de
//     llamadas y estados de los mocks entre tests. Si es necesario, `mockClear()` se
//     usa en mocks específicos dentro de un test antes de una interacción particular.
//
// Este enfoque busca un equilibrio entre tests exhaustivos y mantenibles, abordando
// los desafíos comunes de probar componentes React que interactúan con el DOM,
// realizan operaciones asíncronas y dependen de módulos externos.
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

const MOCK_PERMISSION_CHECKER_PATH =
  "../../../../../src/core/plugins/plugin-permission-checker";
const mockPluginAPermissions = {
  approved: ["readData", "writeData"],
  pending: ["sendNotifications"],
  revoked: ["accessCamera"],
};
const mockPluginBPermissions = {
  approved: ["accessLocation"],
  pending: [],
  revoked: [],
};
const mockPluginCPermissions = { approved: [], pending: [], revoked: [] };
jest.doMock(MOCK_PERMISSION_CHECKER_PATH, () => ({
  __esModule: true,
  default: {
    getPluginPermissions: jest.fn((pluginId) => {
      if (pluginId === "pluginA") return mockPluginAPermissions;
      if (pluginId === "pluginB") return mockPluginBPermissions;
      if (pluginId === "pluginC") return mockPluginCPermissions;
      return { approved: [], pending: [], revoked: [] };
    }),
  },
}));

const MOCK_PLUGIN_MANAGER_PATH =
  "../../../../../src/core/plugins/plugin-manager";
const mockAllPlugins = [
  { id: "pluginA", name: "Plugin A" },
  { id: "pluginB", name: "Plugin B" },
  { id: "pluginC", name: "Plugin C Vacío" },
  { id: "pluginD", name: "Plugin D Sin Permisos Registrados" },
];
jest.doMock(MOCK_PLUGIN_MANAGER_PATH, () => ({
  __esModule: true,
  default: {
    getAllPlugins: jest.fn(() => mockAllPlugins),
    approvePluginPermissions: jest.fn().mockResolvedValue(true),
    rejectPluginPermissions: jest.fn().mockResolvedValue(true),
    revokePluginPermissions: jest.fn().mockResolvedValue(true),
  },
}));

const MOCK_CONSTANTS_PATH = "../../../../../src/core/config/constants";
const mockPermissionTypes = {
  READDATA: "Leer Datos",
  WRITEDATA: "Escribir Datos",
  SENDNOTIFICATIONS: "Enviar Notificaciones",
  ACCESSCAMERA: "Acceder a Cámara",
  ACCESSLOCATION: "Acceder a Ubicación",
};
jest.doMock(MOCK_CONSTANTS_PATH, () => ({
  PLUGIN_CONSTANTS: { SECURITY: { PERMISSION_TYPES: mockPermissionTypes } },
}));

// --- Importaciones de la App DESPUÉS de los mocks ---
const PermissionsManager =
  require("../../../../../src/components/security/permissions-manager").default;
const pluginPermissionChecker = require(MOCK_PERMISSION_CHECKER_PATH).default;
const pluginManager = require(MOCK_PLUGIN_MANAGER_PATH).default;

describe("PermissionsManager Component", () => {
  let originalConfirm, originalAlert;
  let createElementSpy,
    appendChildSpy,
    removeChildSpy,
    clickSpy,
    createObjectURLSpy,
    revokeObjectURLSpy;
  let originalDocumentCreateElement;

  beforeEach(() => {
    jest.clearAllMocks();
    originalConfirm = window.confirm;
    originalAlert = window.alert;
    window.confirm = jest.fn();
    window.alert = jest.fn();
  });

  afterEach(() => {
    window.confirm = originalConfirm;
    window.alert = originalAlert;

    if (createElementSpy && typeof createElementSpy.mockRestore === "function")
      createElementSpy.mockRestore();
    if (appendChildSpy && typeof appendChildSpy.mockRestore === "function")
      appendChildSpy.mockRestore();
    if (removeChildSpy && typeof removeChildSpy.mockRestore === "function")
      removeChildSpy.mockRestore();
    if (
      createObjectURLSpy &&
      typeof createObjectURLSpy.mockRestore === "function"
    )
      createObjectURLSpy.mockRestore();
    if (
      revokeObjectURLSpy &&
      typeof revokeObjectURLSpy.mockRestore === "function"
    )
      revokeObjectURLSpy.mockRestore();

    createElementSpy = null;
    appendChildSpy = null;
    removeChildSpy = null;
    clickSpy = null;
    createObjectURLSpy = null;
    revokeObjectURLSpy = null;
    originalDocumentCreateElement = null;

    jest.useRealTimers();
  });

  test("debe renderizar el gestor completo y cargar datos iniciales", async () => {
    render(<PermissionsManager />);
    expect(
      await screen.findByText("Gestor de Permisos", {}, { timeout: 3000 })
    ).toBeInTheDocument();

    expect(pluginManager.getAllPlugins).toHaveBeenCalledTimes(1);
    expect(pluginPermissionChecker.getPluginPermissions).toHaveBeenCalledWith(
      "pluginA"
    );
    expect(pluginPermissionChecker.getPluginPermissions).toHaveBeenCalledWith(
      "pluginB"
    );

    const pendingTab = screen.getByText(/Pendientes \(\d+\)/);
    expect(pendingTab).toHaveClass("active");

    expect(
      await screen.findByText("pluginA", {}, { timeout: 1000 })
    ).toBeInTheDocument();
    expect(screen.getByText("sendNotifications")).toBeInTheDocument();
    expect(screen.getAllByText("Aprobar").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rechazar").length).toBeGreaterThan(0);
  });

  test("debe renderizar la vista compacta y mostrar permisos pendientes", async () => {
    const mockOnPluginClick = jest.fn();
    render(
      <PermissionsManager compact={true} onPluginClick={mockOnPluginClick} />
    );
    expect(
      await screen.findByText("Permisos Pendientes", {}, { timeout: 3000 })
    ).toBeInTheDocument();

    expect(pluginManager.getAllPlugins).toHaveBeenCalledTimes(1);
    expect(pluginPermissionChecker.getPluginPermissions).toHaveBeenCalledWith(
      "pluginA"
    );

    expect(screen.getByText("pluginA")).toBeInTheDocument();
    expect(screen.getByText("sendNotifications")).toBeInTheDocument();
    expect(screen.getAllByText("Aprobar").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rechazar").length).toBeGreaterThan(0);

    // Verificar que solo se muestran hasta 3 por defecto en modo compacto
    // y que el permiso 'accessCamera' de pluginA (que era revoked) no está.
    expect(screen.queryByText("accessCamera")).not.toBeInTheDocument();
  });

  test('debe cambiar a la pestaña "Todos los Permisos" y mostrar todos los permisos', async () => {
    render(<PermissionsManager />);
    await screen.findByText("Gestor de Permisos");

    const allPermissionsTab = screen.getByText("Todos los Permisos");
    await act(async () => {
      fireEvent.click(allPermissionsTab);
    });
    expect(allPermissionsTab).toHaveClass("active");

    // Esperar a que el contenido de la pestaña "Todos" se cargue/muestre
    // (puede ser instantáneo si los datos ya están, pero findBy es más seguro)
    const pluginAEntries = await screen.findAllByText(
      "pluginA",
      {},
      { timeout: 2000 }
    );
    expect(pluginAEntries.length).toBeGreaterThan(0);

    expect(screen.getByText("readData")).toBeInTheDocument();
    expect(screen.getByText("sendNotifications")).toBeInTheDocument(); // Ahora visible como pendiente
    expect(screen.getByText("accessCamera")).toBeInTheDocument(); // Ahora visible como rechazado

    const pluginBEntries = await screen.findAllByText("pluginB");
    expect(pluginBEntries.length).toBeGreaterThan(0);
    expect(screen.getByText("accessLocation")).toBeInTheDocument();
  });

  test('debe filtrar permisos en la pestaña "Pendientes"', async () => {
    render(<PermissionsManager />);
    await screen.findByText("Gestor de Permisos");

    expect(await screen.findByText("pluginA")).toBeInTheDocument();

    const filterInput = screen.getByPlaceholderText(
      /Filtrar por plugin o permiso.../i
    );

    await act(async () => {
      fireEvent.change(filterInput, { target: { value: "pluginB" } });
    });

    expect(
      await screen.findByText(
        "No hay permisos pendientes de aprobación",
        {},
        { timeout: 2000 }
      )
    ).toBeInTheDocument();

    expect(screen.queryByText("pluginA")).not.toBeInTheDocument();
    expect(screen.queryByText("sendNotifications")).not.toBeInTheDocument();
  });

  test("debe aprobar un permiso pendiente", async () => {
    render(<PermissionsManager />);
    await screen.findByText("Gestor de Permisos");

    const pluginARow = (
      await screen.findAllByText((content, node) => {
        const parent = node.closest(".permission-row");
        return (
          parent &&
          parent.textContent.includes("pluginA") &&
          parent.textContent.includes("sendNotifications")
        );
      })
    )[0].closest(".permission-row");

    expect(pluginARow).toBeInTheDocument();
    const approveButton = within(pluginARow).getByText("Aprobar");

    // Limpiar mocks para esta interacción específica
    pluginManager.approvePluginPermissions.mockClear();
    pluginManager.getAllPlugins.mockClear();
    pluginPermissionChecker.getPluginPermissions.mockClear();

    await act(async () => {
      fireEvent.click(approveButton);
    });

    expect(pluginManager.approvePluginPermissions).toHaveBeenCalledWith(
      "pluginA",
      ["sendNotifications"]
    );
    // Esperar a que los datos se recarguen debido al cambio en refreshKey
    await waitFor(() =>
      expect(pluginManager.getAllPlugins).toHaveBeenCalledTimes(1)
    );
    // Aquí podrías añadir una aserción más fuerte si el mock de getPluginPermissions
    // se actualizara para reflejar el cambio de estado del permiso.
  });

  // Puedes añadir tests para rechazar y revocar permisos de manera similar.

  test("debe refrescar los datos al hacer clic en el botón Refrescar", async () => {
    render(<PermissionsManager />);
    await screen.findByText("Gestor de Permisos");

    // Limpiar llamadas de la carga inicial
    pluginManager.getAllPlugins.mockClear();
    pluginPermissionChecker.getPluginPermissions.mockClear();

    const refreshButton = screen.getByText("Refrescar");
    await act(async () => {
      fireEvent.click(refreshButton);
    });

    // Esperar a que las funciones sean llamadas una vez más debido al refresh
    await waitFor(() =>
      expect(pluginManager.getAllPlugins).toHaveBeenCalledTimes(1)
    );
    // Verificar para un plugin específico para confirmar que getPluginPermissions se llamó después del refresh
    await waitFor(() =>
      expect(pluginPermissionChecker.getPluginPermissions).toHaveBeenCalledWith(
        "pluginA"
      )
    );
  });
});
