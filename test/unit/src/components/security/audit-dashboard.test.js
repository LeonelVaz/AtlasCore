/**
 * @jest-environment jsdom
*/
import React from 'react';
import { render, screen, waitFor, fireEvent, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';

// NO importes AuditDashboard ni pluginSecurityAudit aquí arriba todavía

// console.log('--- [TEST FILE audit-dashboard.test.js] Inicio del archivo de test ---');

// ----- Mock de Button (sabemos que está OK) -----
jest.mock('../../../../../src/components/ui/button', () => {
  const ButtonMock = jest.fn(({ children, onClick, variant, size, disabled, className }) => (
    <button onClick={onClick} data-variant={variant} data-size={size} disabled={disabled} className={className || ''}>{children}</button>
  ));
  return ButtonMock;
});

// ----- Mock para plugin-security-audit -----
const MOCK_PLUGIN_SECURITY_AUDIT_PATH = '../../../../../src/core/plugins/plugin-security-audit';
const mockAuditStatsData = { 
  totalEntries: 150,
  auditMode: 'immediate',
}; 
const mockRecentLogsData = [ 
  { timestamp: new Date('2023-10-26T10:00:00Z').getTime(), auditType: 'securityEvent', pluginId: 'pluginA', eventType: 'loginSuccess', details: { user: 'admin' } },
  { timestamp: new Date('2023-10-26T09:30:00Z').getTime(), auditType: 'permissionChange', eventType: 'permissionGranted', details: { permission: 'readData' } },
  { timestamp: new Date('2023-10-26T09:00:00Z').getTime(), auditType: 'suspiciousActivity', pluginId: 'pluginB', eventType: 'failedLoginAttempt', details: {} },
  { timestamp: new Date('2023-10-25T18:00:00Z').getTime(), auditType: 'securityEvent', eventType: 'configChange', details: {} }, // Cuarto log
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

const AuditDashboard = require('../../../../../src/components/security/audit-dashboard').default; 
const pluginSecurityAudit = require(MOCK_PLUGIN_SECURITY_AUDIT_PATH).default;


describe('AuditDashboard Component', () => {
  let originalConfirm, originalAlert;
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
    if (createElementSpy) createElementSpy.mockRestore(); 
    if (appendChildSpy) appendChildSpy.mockRestore();
    if (removeChildSpy) removeChildSpy.mockRestore();
    if (createObjectURLSpy) createObjectURLSpy.mockRestore();
    if (revokeObjectURLSpy) revokeObjectURLSpy.mockRestore();
    jest.useRealTimers(); 
  });

  test('debe renderizar el dashboard y cargar datos iniciales correctamente', async () => {
    render(<AuditDashboard />); 
    
    expect(await screen.findByText('Dashboard de Auditoría', {}, {timeout: 3000})).toBeInTheDocument();
    
    expect(pluginSecurityAudit.getAuditStats).toHaveBeenCalledTimes(1);
    expect(pluginSecurityAudit.getAuditLog).toHaveBeenCalledWith({ limit: 50 });

    expect(screen.getByText('Total de Eventos')).toBeInTheDocument();
    expect(screen.getByText(mockAuditStatsData.totalEntries.toString())).toBeInTheDocument(); 
    expect(screen.getByText(mockAuditStatsData.auditMode === 'immediate' ? 'Inmediato' : 'Por lotes')).toBeInTheDocument();
    
    const latestEventsTitle = await screen.findByText('Últimos Eventos de Auditoría');
    const auditLatestSection = latestEventsTitle.closest('.audit-latest');
    expect(auditLatestSection).toBeInTheDocument();

    const { getAllByText: getAllByTextInLogs } = within(auditLatestSection);

    const logPluginAEntries = getAllByTextInLogs((content, node) => (node.textContent || "").includes('Plugin: pluginA') && (node.textContent || "").includes('Evento: loginSuccess'));
    expect(logPluginAEntries.length).toBeGreaterThan(0);
    
    const logPermissionEntries = getAllByTextInLogs((content, node) => (node.textContent || "").includes('Evento del sistema: permissionGranted'));
    expect(logPermissionEntries.length).toBeGreaterThan(0);
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
  

  describe('Funcionalidad de Exportar', () => {
    // Mover la configuración de spies DENTRO del test, DESPUÉS del renderizado inicial
    // y la espera de que el componente se cargue.

    test('debe exportar los datos de auditoría', async () => {
        jest.useRealTimers(); 
        
        render(<AuditDashboard />);
        
        // Esperar a que el componente esté completamente cargado ANTES de configurar spies o fake timers
        await screen.findByText('Dashboard de Auditoría', {}, {timeout: 7000});
        await screen.findByText(mockAuditStatsData.totalEntries.toString(), {}, {timeout: 3000}); 
        // console.log("--- [Export Test] Dashboard completamente cargado ---");

        // Configurar spies del DOM AHORA, después de que el componente se estabilizó
        const originalDocumentCreateElementBackup = document.createElement; // Backup
        const clickSpyLocal = jest.fn(); // Usar nombres locales para evitar colisión con variables del scope exterior si las hubiera
        const createElementSpyLocal = jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
          if (tagName?.toLowerCase() === 'a') {
            return { href: '', download: '', click: clickSpyLocal, style: {}, setAttribute: jest.fn(), removeAttribute: jest.fn(), remove: jest.fn() };
          }
          return originalDocumentCreateElementBackup.call(document, tagName); // Usar el backup
        });
        const appendChildSpyLocal = jest.spyOn(document.body, 'appendChild').mockImplementation(node => node);
        const removeChildSpyLocal = jest.spyOn(document.body, 'removeChild').mockImplementation(node => node);
        
        let createObjectURLSpyLocal, revokeObjectURLSpyLocal;
        if (typeof URL.createObjectURL === 'undefined') URL.createObjectURL = jest.fn(); // Asegurar existencia
        if (typeof URL.revokeObjectURL === 'undefined') URL.revokeObjectURL = jest.fn(); // Asegurar existencia
        createObjectURLSpyLocal = jest.spyOn(URL, 'createObjectURL').mockReturnValue('mock-url');
        revokeObjectURLSpyLocal = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

        jest.useFakeTimers(); 

        const exportButton = screen.getByText('Exportar Datos');
        await act(async () => {
            fireEvent.click(exportButton);
        });
  
        expect(pluginSecurityAudit.exportAuditData).toHaveBeenCalledTimes(1);
        expect(createElementSpyLocal).toHaveBeenCalledWith('a');
        expect(appendChildSpyLocal).toHaveBeenCalled();
        expect(clickSpyLocal).toHaveBeenCalled();
  
        await act(async () => { 
            jest.runAllTimers(); 
        });
  
        expect(removeChildSpyLocal).toHaveBeenCalled();
        expect(revokeObjectURLSpyLocal).toHaveBeenCalledWith('mock-url');

        // Limpiar spies locales al final del test
        createElementSpyLocal.mockRestore();
        appendChildSpyLocal.mockRestore();
        removeChildSpyLocal.mockRestore();
        createObjectURLSpyLocal.mockRestore();
        revokeObjectURLSpyLocal.mockRestore();
        // document.createElement = originalDocumentCreateElementBackup; // Restaurar si es necesario, aunque spyOn().mockRestore() debería hacerlo.

      }, 15000); 
  });
});