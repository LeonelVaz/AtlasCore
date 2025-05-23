// =================================================================================================
// DOCUMENTACIÓN Y LECCIONES APRENDIDAS PARA ESTE TEST SUITE
// =================================================================================================
//
// Este test suite para AuditDashboard pasó por un proceso de depuración extenso.
// Las siguientes son lecciones clave y soluciones a problemas comunes encontrados,
// especialmente relacionados con el renderizado en JSDOM, mocks y operaciones asíncronas.
//
// 1.  PROBLEMA: EL DOM APARECE VACÍO (`<body />`) DESPUÉS DE `render()` EN UN ARCHIVO DE TEST:
//     --------------------------------------------------------------------------------------
//     - Causa Raíz Principal: A menudo, un problema en `setupTests.js` (mocks globales
//       mal configurados o con efectos secundarios) o mocks locales definidos en el propio
//       archivo de test que interfieren con el entorno JSDOM antes de que RTL pueda montar
//       el componente. La importación de módulos con código de nivel superior que interactúa
//       con APIs de navegador (incluso si es una dependencia de una dependencia) también
//       puede ser una causa.
//     - Solución / Proceso de Depuración:
//       a. Crear un test ultra-básico (`render(<div>Hola</div>)`) en un archivo *separado*
//          (`simple.test.js`) para verificar la configuración fundamental de Jest/JSDOM/RTL.
//          Si este pasa, el problema es específico del archivo de test original.
//       b. En el archivo de test problemático, comentar TODAS las importaciones de módulos de
//          la aplicación y TODOS los mocks locales. Ejecutar el test ultra-básico. Si pasa,
//          el problema está en las importaciones o mocks comentados.
//       c. Reintroducir la importación del componente bajo prueba. Si el test mínimo falla
//          AHORA, el problema está en el módulo del componente o una de sus dependencias
//          directas (no mockeadas) que se ejecuta al importar.
//       d. Reintroducir los mocks locales (`jest.mock` y `jest.doMock`) UNO POR UNO.
//          Si el test mínimo falla después de añadir un mock específico, ese mock (o el
//          módulo real que intenta "ver") es el culpable.
//       e. Simplificar `setupTests.js` al mínimo (solo `@testing-library/jest-dom` y
//          configuraciones globales de `window` absolutamente necesarias y seguras).
//          EVITAR mocks globales de módulos de la aplicación en `setupTests.js`.
//
// 2.  MOCKS DE MÓDULOS (ESPECIALMENTE SINGLETONS O CON EFECTOS SECUNDARIOS AL IMPORTAR):
//     --------------------------------------------------------------------------------
//     - Problema: Un `jest.mock()` normal podría no ser suficiente si el módulo real
//       es un singleton que ya fue instanciado por el componente bajo prueba (debido al
//       orden de importación), o si el módulo real tiene código de nivel superior
//       problemático.
//     - Solución: Usar `jest.doMock('path/to/module', factory)` ANTES de cualquier
//       `require()` o `import` del módulo que se está mockeando Y del componente
//       que lo utiliza. `jest.doMock()` no se eleva (hoisted) y se aplica en el
//       orden en que se escribe.
//     - Ejemplo:
//       ```javascript
//       jest.doMock('path/to/my-service', () => ({
//         __esModule: true, // Si el módulo real usa export default
//         default: {
//           someMethod: jest.fn(() => 'mockedValue'),
//         }
//       }));
//       // Las importaciones/requires deben ir DESPUÉS de todos los jest.mock/jest.doMock
//       const MyComponent = require('path/to/MyComponent').default;
//       const myService = require('path/to/my-service').default;
//       ```
//
// 3.  ERROR "CANNOT ACCESS 'VARIABLE' BEFORE INITIALIZATION" CON `jest.mock()`:
//     ------------------------------------------------------------------------
//     - Causa: `jest.mock()` se eleva (hoisted) al principio del módulo. Si el primer
//       argumento (el path) es una variable, esa variable aún no estará inicializada.
//     - Solución: Hardcodear el string del path directamente en `jest.mock('path/string', factory)`.
//       Para `jest.doMock(variablePath, factory)`, esto no es un problema.
//
// 4.  MANEJO DE SPIES DEL DOM (`jest.spyOn(document, 'createElement')`, etc.):
//     -------------------------------------------------------------------------
//     - Problema: Configurar spies globales del DOM en un `beforeEach` para todo un
//       `describe` puede interferir inesperadamente con el renderizado de React Testing Library.
//     - Solución:
//       a. Configurar los spies del DOM solo DENTRO de los tests específicos que los
//          necesitan, o en un `beforeEach` de un `describe` anidado que agrupe solo
//          esos tests.
//       b. Idealmente, configurar los spies DESPUÉS de que el componente principal
//          se haya renderizado y estabilizado (ej. después de un `await screen.findByText(...)`),
//          si el spy solo es necesario para una interacción posterior.
//       c. Siempre restaurar los spies (`spy.mockRestore()`) en un `afterEach`
//          apropiado. Es buena práctica declarar las variables de los spies en el scope
//          del `describe` y asignarlas/restaurarlas en `beforeEach`/`afterEach` de ese `describe`
//          o dentro del test si solo se usan una vez.
//
// 5.  OPERACIONES ASÍNCRONAS Y TIMERS:
//     --------------------------------
//     - `findBy...` queries: Usar `await screen.findByText(...)`, etc., para esperar
//       a que aparezcan elementos después de operaciones asíncronas.
//     - `act()`: Envolver interacciones (`fireEvent`), y especialmente el avance de timers
//       (`jest.runAllTimers()`) en `act(async () => { ... })` o `await act(async () => { ... })`
//       para asegurar que todas las actualizaciones de estado y efectos se procesen.
//     - `jest.useFakeTimers()` y `jest.useRealTimers()`:
//       a. Usar `jest.useRealTimers()` al inicio de tests o `beforeEach` si el renderizado
//          inicial del componente depende de operaciones asíncronas o `setTimeout` reales.
//       b. Cambiar a `jest.useFakeTimers()` justo ANTES de la parte del test que necesita
//          controlar timers.
//       c. Siempre llamar a `jest.useRealTimers()` en el `afterEach` global para limpiar.
//     - Timeouts de Test: Si un test falla por timeout, aumentar el timeout del
//       test: `test('...', async () => { ... }, 15000); // 15 segundos`.
//
// 6.  BÚSQUEDA DE TEXTO FLEXIBLE:
//     ---------------------------
//     - Usar una función como matcher para `getByText` o `getAllByText`:
//       `screen.getByText((content, node) => (node.textContent || "").includes('parte'))`
//     - Usar `within(parentElement).getByText(...)` para acotar la búsqueda.
//
// 7.  `jest.clearAllMocks()`: Usar esto en el `beforeEach` principal es crucial.
//
// Al seguir estos principios, los tests se vuelven más estables y la depuración
// de problemas de renderizado y mocks se simplifica considerablemente.
// =================================================================================================

/**
 * @jest-environment jsdom
*/
import React from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';

// --- Definición de Mocks ANTES de cualquier importación de la app ---

jest.mock('../../../../../src/components/ui/button', () => {
  return jest.fn(({ children, onClick, variant, size, disabled, className }) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      disabled={disabled}
      className={className || 'mocked-button'}
    >
      {children}
    </button>
  ));
});

const MOCK_PLUGIN_SECURITY_AUDIT_PATH = '../../../../../src/core/plugins/plugin-security-audit';
const mockAuditStatsData = { 
  totalEntries: 150,
  auditMode: 'immediate',
}; 
const mockRecentLogsData = [ 
  { timestamp: new Date('2023-10-26T10:00:00Z').getTime(), auditType: 'securityEvent', pluginId: 'pluginA', eventType: 'loginSuccess', details: { user: 'admin' } },
  { timestamp: new Date('2023-10-26T09:30:00Z').getTime(), auditType: 'permissionChange', eventType: 'permissionGranted', details: { permission: 'readData' } },
  { timestamp: new Date('2023-10-26T09:00:00Z').getTime(), auditType: 'suspiciousActivity', pluginId: 'pluginB', eventType: 'failedLoginAttempt', details: {} },
  { timestamp: new Date('2023-10-25T18:00:00Z').getTime(), auditType: 'securityEvent', eventType: 'configChange', details: {} },
  { timestamp: new Date('2023-10-25T17:00:00Z').getTime(), auditType: 'permissionRequest', pluginId: 'pluginC', eventType: 'requestStorage', details: {} },
];

jest.doMock(MOCK_PLUGIN_SECURITY_AUDIT_PATH, () => {
  return {
      __esModule: true, 
      default: {
        getAuditStats: jest.fn(() => mockAuditStatsData),
        getAuditLog: jest.fn((options) => mockRecentLogsData.slice(0, options?.limit || 50)),
        setAuditMode: jest.fn().mockResolvedValue(true),
        exportAuditData: jest.fn(() => ({ logs: mockRecentLogsData, stats: mockAuditStatsData })),
        clearAllAuditLogs: jest.fn().mockResolvedValue(true),
      }
  };
});

// --- Importaciones de la App DESPUÉS de los mocks ---
const AuditDashboard = require('../../../../../src/components/security/audit-dashboard').default; 
const pluginSecurityAudit = require(MOCK_PLUGIN_SECURITY_AUDIT_PATH).default; 

describe('AuditDashboard Component', () => {
  let originalConfirm, originalAlert;
  // Spies del DOM para el test de exportar, se declaran aquí para ser accesibles en afterEach
  let createElementSpy, appendChildSpy, removeChildSpy, clickSpy, createObjectURLSpy, revokeObjectURLSpy;
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
    // Restaurar spies si fueron creados en algún test
    if (createElementSpy && typeof createElementSpy.mockRestore === 'function') createElementSpy.mockRestore(); 
    if (appendChildSpy && typeof appendChildSpy.mockRestore === 'function') appendChildSpy.mockRestore();
    if (removeChildSpy && typeof removeChildSpy.mockRestore === 'function') removeChildSpy.mockRestore();
    if (createObjectURLSpy && typeof createObjectURLSpy.mockRestore === 'function') createObjectURLSpy.mockRestore();
    if (revokeObjectURLSpy && typeof revokeObjectURLSpy.mockRestore === 'function') revokeObjectURLSpy.mockRestore();
    
    // Limpiar las referencias para el siguiente test
    createElementSpy = null;
    appendChildSpy = null;
    removeChildSpy = null;
    clickSpy = null; 
    createObjectURLSpy = null;
    revokeObjectURLSpy = null;
    originalDocumentCreateElement = null;

    jest.useRealTimers(); 
  });

  test('debe renderizar el dashboard y cargar datos iniciales correctamente', async () => {
    render(<AuditDashboard />);
    expect(await screen.findByText('Dashboard de Auditoría', {}, {timeout: 3000})).toBeInTheDocument();
    
    expect(pluginSecurityAudit.getAuditStats).toHaveBeenCalledTimes(1);
    expect(pluginSecurityAudit.getAuditLog).toHaveBeenCalledWith({ limit: 50 });

    expect(screen.getByText('Total de Eventos')).toBeInTheDocument();
    expect(screen.getByText(mockAuditStatsData.totalEntries.toString())).toBeInTheDocument(); 
    expect(screen.getByText('Inmediato')).toBeInTheDocument();
    
    const latestEventsTitle = await screen.findByText('Últimos Eventos de Auditoría');
    const auditLatestSection = latestEventsTitle.closest('.audit-latest');
    expect(auditLatestSection).toBeInTheDocument();

    const { getAllByText: getAllByTextInLogs } = within(auditLatestSection);
    const logPluginAEntries = getAllByTextInLogs((content, node) => (node.textContent || "").includes('Plugin: pluginA') && (node.textContent || "").includes('Evento: loginSuccess'));
    expect(logPluginAEntries.length).toBeGreaterThan(0);
    const logPermissionEntries = getAllByTextInLogs((content, node) => (node.textContent || "").includes('Evento del sistema: permissionGranted'));
    expect(logPermissionEntries.length).toBeGreaterThan(0);

    expect(screen.getByText('Eventos por Tipo')).toBeInTheDocument();
    expect(screen.getByText('Eventos por Tiempo')).toBeInTheDocument();
    expect(screen.getByText('Limpiar Logs')).toBeInTheDocument();
    expect(screen.getByText('Exportar Datos')).toBeInTheDocument();
  });

  test('debe renderizar el dashboard compacto y cargar datos', async () => {
    const mockOnPluginClick = jest.fn();
    render(<AuditDashboard compact={true} onPluginClick={mockOnPluginClick} />);
    await screen.findByText('Resumen de Auditoría', {}, {timeout: 3000});

    expect(pluginSecurityAudit.getAuditStats).toHaveBeenCalledTimes(1);
    expect(pluginSecurityAudit.getAuditLog).toHaveBeenCalledWith({ limit: 50 });

    expect(screen.getByText('Total de Eventos')).toBeInTheDocument();
    expect(screen.getByText(mockAuditStatsData.totalEntries.toString())).toBeInTheDocument();
    expect(screen.getByText('Inmediato')).toBeInTheDocument();

    const latestEventsTitleCompact = await screen.findByText('Últimos Eventos', {}, {timeout:1000});
    const compactLatestEntries = latestEventsTitleCompact.closest('.latest-entries.compact');
    expect(compactLatestEntries).toBeInTheDocument();

    const { getAllByText: getAllByTextInCompactLogs, queryByText: queryByTextInCompactLogs } = within(compactLatestEntries);
    const logPluginACompact = getAllByTextInCompactLogs((content, node) => (node.textContent || "").includes('Plugin: pluginA') && (node.textContent || "").includes('Evento: loginSuccess'));
    expect(logPluginACompact.length).toBeGreaterThan(0);
    expect(queryByTextInCompactLogs(/Evento del sistema: configChange/)).not.toBeInTheDocument();

    const verButtons = within(compactLatestEntries).getAllByText('Ver'); 
    fireEvent.click(verButtons[0]);
    expect(mockOnPluginClick).toHaveBeenCalledWith('pluginA');
  });

  test('debe refrescar los datos al hacer clic en el botón Refrescar', async () => {
    render(<AuditDashboard />);
    await screen.findByText('Dashboard de Auditoría'); 
    pluginSecurityAudit.getAuditStats.mockClear(); 
    pluginSecurityAudit.getAuditLog.mockClear();

    const refreshButton = screen.getByText('Refrescar');
    await act(async () => { fireEvent.click(refreshButton); });
    await waitFor(() => expect(pluginSecurityAudit.getAuditStats).toHaveBeenCalledTimes(1)); 
    await waitFor(() => expect(pluginSecurityAudit.getAuditLog).toHaveBeenCalledTimes(1));
  });

  test('debe cambiar el modo de auditoría', async () => {
    render(<AuditDashboard />);
    await screen.findByText('Dashboard de Auditoría'); 
    const toggle = screen.getByRole('checkbox'); 
    expect(toggle).toBeChecked(); 
    
    pluginSecurityAudit.setAuditMode.mockClear(); 
    await act(async () => { fireEvent.click(toggle); });
    await screen.findByText('Por lotes'); 
    expect(pluginSecurityAudit.setAuditMode).toHaveBeenCalledWith('batch');
    expect(toggle).not.toBeChecked();

    pluginSecurityAudit.setAuditMode.mockClear();
    await act(async () => { fireEvent.click(toggle); });
    await screen.findByText('Inmediato');
    expect(pluginSecurityAudit.setAuditMode).toHaveBeenCalledWith('immediate');
    expect(toggle).toBeChecked();
  });

  test('debe limpiar los logs de auditoría después de confirmación', async () => {
    window.confirm.mockReturnValue(true);
    render(<AuditDashboard />);
    await screen.findByText('Dashboard de Auditoría');
    pluginSecurityAudit.getAuditStats.mockClear(); 
    pluginSecurityAudit.getAuditLog.mockClear();
    pluginSecurityAudit.clearAllAuditLogs.mockClear();

    const clearButton = screen.getByText('Limpiar Logs');
    await act(async () => { fireEvent.click(clearButton); });
    expect(window.confirm).toHaveBeenCalledWith('¿Estás seguro de que deseas limpiar todos los logs de auditoría? Esta acción no se puede deshacer.');
    expect(pluginSecurityAudit.clearAllAuditLogs).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(pluginSecurityAudit.getAuditStats).toHaveBeenCalledTimes(1)); 
    await waitFor(() => expect(pluginSecurityAudit.getAuditLog).toHaveBeenCalledTimes(1));
  });

  test('no debe limpiar los logs si el usuario cancela', async () => {
    window.confirm.mockReturnValue(false);
    render(<AuditDashboard />);
    await screen.findByText('Dashboard de Auditoría');
    pluginSecurityAudit.clearAllAuditLogs.mockClear();
    pluginSecurityAudit.getAuditStats.mockClear(); 

    const clearButton = screen.getByText('Limpiar Logs');
    await act(async () => { fireEvent.click(clearButton); });
    expect(window.confirm).toHaveBeenCalled();
    expect(pluginSecurityAudit.clearAllAuditLogs).not.toHaveBeenCalled();
    expect(pluginSecurityAudit.getAuditStats).not.toHaveBeenCalled();
  });
  
  test('debe mostrar alerta si falla la exportación (datos nulos)', async () => {
    pluginSecurityAudit.exportAuditData.mockReturnValueOnce(null);
    render(<AuditDashboard />);
    await screen.findByText('Dashboard de Auditoría');

    const exportButton = screen.getByText('Exportar Datos');
    await act(async () => { fireEvent.click(exportButton); });
    expect(window.alert).toHaveBeenCalledWith('Error al exportar: No se pudieron obtener datos para exportar');
  });
  
  test('debe manejar el clic en un plugin en la vista completa si onPluginClick se proporciona', async () => {
    const mockOnPluginClick = jest.fn();
    render(<AuditDashboard onPluginClick={mockOnPluginClick}/>);
    await screen.findByText('Dashboard de Auditoría');
    const pluginLink = await screen.findByText((content, node) => 
        node.classList.contains('audit-plugin-link') && (node.textContent || "").trim() === 'pluginA'
    );
    fireEvent.click(pluginLink);
    expect(mockOnPluginClick).toHaveBeenCalledWith('pluginA');
  });

  test('debe exportar los datos de auditoría', async () => {
    jest.useRealTimers(); 
    render(<AuditDashboard />);
    
    await screen.findByText('Dashboard de Auditoría', {}, {timeout: 7000});
    await screen.findByText(mockAuditStatsData.totalEntries.toString(), {}, {timeout: 3000}); 

    // Configurar spies del DOM DENTRO del test
    originalDocumentCreateElement = document.createElement; 
    clickSpy = jest.fn(); 
    createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName?.toLowerCase() === 'a') {
        return { href: '', download: '', click: clickSpy, style: {}, setAttribute: jest.fn(), removeAttribute: jest.fn(), remove: jest.fn() };
      }
      return originalDocumentCreateElement.call(document, tagName);
    });
    appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(node => node);
    removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(node => node);
    
    if (typeof URL.createObjectURL === 'undefined') URL.createObjectURL = jest.fn();
    if (typeof URL.revokeObjectURL === 'undefined') URL.revokeObjectURL = jest.fn();
    createObjectURLSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue('mock-url');
    revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    jest.useFakeTimers(); 

    const exportButton = screen.getByText('Exportar Datos');
    await act(async () => {
        fireEvent.click(exportButton);
    });

    expect(pluginSecurityAudit.exportAuditData).toHaveBeenCalledTimes(1);
    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(appendChildSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    await act(async () => { 
        jest.runAllTimers(); 
    });

    expect(removeChildSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('mock-url');
    // Los spies se restaurarán en el afterEach global.
  }, 15000); 
});