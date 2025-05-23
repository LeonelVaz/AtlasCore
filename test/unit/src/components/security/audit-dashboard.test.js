// audit-dashboard.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuditDashboard from '../../../../../src/components/security/audit-dashboard';
import pluginSecurityAudit from '../../../../../src/core/plugins/plugin-security-audit';

// Mock del componente Button
jest.mock('../../../../../src/components/ui/button', () => {
  return jest.fn(({ children, onClick, variant, size, disabled }) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      disabled={disabled}
    >
      {children}
    </button>
  ));
});

// Mock del módulo plugin-security-audit
const mockAuditStats = {
  totalEntries: 150,
  auditMode: 'immediate',
};
const mockRecentLogs = [
  { timestamp: new Date('2023-10-26T10:00:00Z').getTime(), auditType: 'securityEvent', pluginId: 'pluginA', eventType: 'loginSuccess', details: { user: 'admin' } },
  { timestamp: new Date('2023-10-26T09:30:00Z').getTime(), auditType: 'permissionChange', eventType: 'permissionGranted', details: { permission: 'readData' } },
  { timestamp: new Date('2023-10-26T09:00:00Z').getTime(), auditType: 'suspiciousActivity', pluginId: 'pluginB', eventType: 'failedLoginAttempt' },
  { timestamp: new Date('2023-10-25T18:00:00Z').getTime(), auditType: 'securityEvent', eventType: 'configChange' },
  { timestamp: new Date('2023-10-25T17:00:00Z').getTime(), auditType: 'permissionRequest', pluginId: 'pluginC', eventType: 'requestStorage' },
];

jest.mock('../../../../../src/core/plugins/plugin-security-audit', () => ({
  getAuditStats: jest.fn(() => mockAuditStats),
  getAuditLog: jest.fn(() => mockRecentLogs.slice(0, 50)), // Simula el límite de 50
  setAuditMode: jest.fn().mockResolvedValue(true),
  exportAuditData: jest.fn(() => ({ logs: mockRecentLogs, stats: mockAuditStats })),
  clearAllAuditLogs: jest.fn().mockResolvedValue(true),
}));

describe('AuditDashboard Component', () => {
  let originalConfirm;
  let originalAlert;
  let createElementSpy;
  let appendChildSpy;
  let removeChildSpy;
  let clickSpy;
  let createObjectURLSpy;
  let revokeObjectURLSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    originalConfirm = window.confirm;
    originalAlert = window.alert;
    window.confirm = jest.fn();
    window.alert = jest.fn();

    // Mocks para la descarga de archivos
    clickSpy = jest.fn();
    createElementSpy = jest.spyOn(document, 'createElement').mockImplementation(() => ({
      href: '',
      download: '',
      click: clickSpy,
      style: {},
    }));
    appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(jest.fn());
    removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(jest.fn());

    // Asegurarse de que URL.createObjectURL y URL.revokeObjectURL existan antes de espiarlos
    if (!URL.createObjectURL) {
      URL.createObjectURL = jest.fn();
    }
    if (!URL.revokeObjectURL) {
      URL.revokeObjectURL = jest.fn();
    }
    createObjectURLSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue('mock-url');
    revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(jest.fn());
  });

  afterEach(() => {
    window.confirm = originalConfirm;
    window.alert = originalAlert;
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    // Solo restaurar si el espía fue creado (para evitar errores si beforeEach falla antes)
    if (createObjectURLSpy) createObjectURLSpy.mockRestore();
    if (revokeObjectURLSpy) revokeObjectURLSpy.mockRestore();
  });

  test('debe renderizar el dashboard completo y cargar datos iniciales', async () => {
    render(<AuditDashboard />);

    await waitFor(() => {
      expect(pluginSecurityAudit.getAuditStats).toHaveBeenCalledTimes(1);
      expect(pluginSecurityAudit.getAuditLog).toHaveBeenCalledWith({ limit: 50 });
    });

    expect(screen.getByText('Dashboard de Auditoría')).toBeInTheDocument();
    expect(screen.getByText('Total de Eventos')).toBeInTheDocument();
    expect(screen.getByText(mockAuditStats.totalEntries.toString())).toBeInTheDocument();
    expect(screen.getByText('Inmediato')).toBeInTheDocument(); // Modo de auditoría

    // Verificar que se muestran algunos logs
    expect(screen.getByText('Plugin: pluginA - Evento: loginSuccess')).toBeInTheDocument();
    expect(screen.getByText('Evento del sistema: permissionGranted')).toBeInTheDocument();

    // Verificar gráficos simulados (presencia de títulos)
    expect(screen.getByText('Eventos por Tipo')).toBeInTheDocument();
    expect(screen.getByText('Eventos por Tiempo')).toBeInTheDocument();

    // Verificar botones de acción
    expect(screen.getByText('Limpiar Logs')).toBeInTheDocument();
    expect(screen.getByText('Exportar Datos')).toBeInTheDocument();
  });

  test('debe renderizar el dashboard compacto y cargar datos', async () => {
    const mockOnPluginClick = jest.fn();
    render(<AuditDashboard compact={true} onPluginClick={mockOnPluginClick} />);

    await waitFor(() => {
      expect(pluginSecurityAudit.getAuditStats).toHaveBeenCalledTimes(1);
      expect(pluginSecurityAudit.getAuditLog).toHaveBeenCalledWith({ limit: 50 });
    });

    expect(screen.getByText('Resumen de Auditoría')).toBeInTheDocument();
    expect(screen.getByText('Total de Eventos')).toBeInTheDocument();
    expect(screen.getByText(mockAuditStats.totalEntries.toString())).toBeInTheDocument();
    expect(screen.getByText('Inmediato')).toBeInTheDocument();

    // Verifica que se muestran hasta 3 logs en modo compacto
    expect(screen.getByText(/Plugin: pluginA - Evento: loginSuccess/)).toBeInTheDocument();
    expect(screen.queryByText(/Evento del sistema: configChange/)).not.toBeInTheDocument(); // El cuarto log no debería estar

    // Simular clic en "Ver" de un plugin
    const verButtons = screen.getAllByText('Ver');
    fireEvent.click(verButtons[0]);
    expect(mockOnPluginClick).toHaveBeenCalledWith('pluginA');
  });

  test('debe refrescar los datos al hacer clic en el botón Refrescar', async () => {
    render(<AuditDashboard />);
    await waitFor(() => expect(pluginSecurityAudit.getAuditStats).toHaveBeenCalledTimes(1));

    pluginSecurityAudit.getAuditStats.mockClear();
    pluginSecurityAudit.getAuditLog.mockClear();

    const refreshButton = screen.getByText('Refrescar');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(pluginSecurityAudit.getAuditStats).toHaveBeenCalledTimes(1);
      expect(pluginSecurityAudit.getAuditLog).toHaveBeenCalledTimes(1);
    });
  });

  test('debe cambiar el modo de auditoría', async () => {
    render(<AuditDashboard />);
    await waitFor(() => expect(screen.getByText('Inmediato')).toBeInTheDocument());

    const toggle = screen.getByRole('checkbox');
    expect(toggle).toBeChecked(); // Modo 'immediate'

    pluginSecurityAudit.setAuditMode.mockResolvedValueOnce(true);
    await act(async () => {
      fireEvent.click(toggle);
    });

    await waitFor(() => {
      expect(pluginSecurityAudit.setAuditMode).toHaveBeenCalledWith('batch');
      expect(screen.getByText('Por lotes')).toBeInTheDocument();
      expect(toggle).not.toBeChecked();
    });

    pluginSecurityAudit.setAuditMode.mockResolvedValueOnce(true);
    await act(async () => {
      fireEvent.click(toggle);
    });
    
    await waitFor(() => {
      expect(pluginSecurityAudit.setAuditMode).toHaveBeenCalledWith('immediate');
      expect(screen.getByText('Inmediato')).toBeInTheDocument();
      expect(toggle).toBeChecked();
    });
  });

  test('debe limpiar los logs de auditoría después de confirmación', async () => {
    window.confirm.mockReturnValue(true);
    render(<AuditDashboard />);
    await waitFor(() => expect(pluginSecurityAudit.getAuditStats).toHaveBeenCalled());

    const clearButton = screen.getByText('Limpiar Logs');
    await act(async () => {
      fireEvent.click(clearButton);
    });
    

    expect(window.confirm).toHaveBeenCalledWith('¿Estás seguro de que deseas limpiar todos los logs de auditoría? Esta acción no se puede deshacer.');
    await waitFor(() => {
      expect(pluginSecurityAudit.clearAllAuditLogs).toHaveBeenCalledTimes(1);
    });
     // Debería refrescar
    await waitFor(() => {
        expect(pluginSecurityAudit.getAuditStats).toHaveBeenCalledTimes(2);
    });
  });

  test('no debe limpiar los logs si el usuario cancela', async () => {
    window.confirm.mockReturnValue(false);
    render(<AuditDashboard />);
    await waitFor(() => expect(pluginSecurityAudit.getAuditStats).toHaveBeenCalled());
    pluginSecurityAudit.getAuditStats.mockClear();

    const clearButton = screen.getByText('Limpiar Logs');
    await act(async () => {
      fireEvent.click(clearButton);
    });

    expect(window.confirm).toHaveBeenCalled();
    expect(pluginSecurityAudit.clearAllAuditLogs).not.toHaveBeenCalled();
    expect(pluginSecurityAudit.getAuditStats).not.toHaveBeenCalled();
  });

  test('debe exportar los datos de auditoría', async () => {
    jest.useFakeTimers();
    render(<AuditDashboard />);
    await waitFor(() => expect(pluginSecurityAudit.getAuditStats).toHaveBeenCalled());

    const exportButton = screen.getByText('Exportar Datos');
    await act(async () => {
      fireEvent.click(exportButton);
    });

    expect(pluginSecurityAudit.exportAuditData).toHaveBeenCalledTimes(1);
    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(appendChildSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    // Avanzar el temporizador para la limpieza
    act(() => {
      jest.runAllTimers();
    });

    expect(removeChildSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('mock-url');
    jest.useRealTimers();
  });

  test('debe mostrar alerta si falla la exportación', async () => {
    pluginSecurityAudit.exportAuditData.mockReturnValueOnce(null); // Simula fallo
    render(<AuditDashboard />);
    await waitFor(() => expect(pluginSecurityAudit.getAuditStats).toHaveBeenCalled());

    const exportButton = screen.getByText('Exportar Datos');
    await act(async () => {
      fireEvent.click(exportButton);
    });
    
    expect(window.alert).toHaveBeenCalledWith('Error al exportar: No se pudieron obtener datos para exportar');
  });
  
  test('debe manejar el clic en un plugin en la vista completa si onPluginClick se proporciona', async () => {
    const mockOnPluginClick = jest.fn();
    pluginSecurityAudit.getAuditLog.mockReturnValueOnce([ // Asegurarse de que hay logs con pluginId
      { timestamp: Date.now(), auditType: 'securityEvent', pluginId: 'pluginTest', eventType: 'testEvent' }
    ]);
    render(<AuditDashboard onPluginClick={mockOnPluginClick}/>);

    await waitFor(() => {
      expect(screen.getByText('Plugin: pluginTest')).toBeInTheDocument();
    });

    const pluginLink = screen.getByText('pluginTest');
    fireEvent.click(pluginLink);
    expect(mockOnPluginClick).toHaveBeenCalledWith('pluginTest');
  });
});