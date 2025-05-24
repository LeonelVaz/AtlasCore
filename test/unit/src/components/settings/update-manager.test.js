/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock UI Components
jest.mock('../../../../../src/components/ui/button', () => {
  return jest.fn(({ children, onClick, variant, size, disabled }) => (
    <button onClick={onClick} data-variant={variant} data-size={size} disabled={disabled} className="mocked-button">
      {children}
    </button>
  ));
});
jest.mock('../../../../../src/components/ui/dialog', () => {
  return jest.fn(({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-dialog" aria-label={title}>
        <h2 data-testid="dialog-title">{title}</h2>
        {children}
        <button onClick={onClose}>Close Dialog</button>
      </div>
    );
  });
});

// --- Mocking Core Services ---
const mockPluginUpdateManager = {
  initialized: true,
  initialize: jest.fn().mockResolvedValue(undefined),
  getAvailableUpdates: jest.fn(() => ({})),
  getUpdateHistory: jest.fn(() => ({})),
  getUpdateSettings: jest.fn(() => ({
    checkAutomatically: true,
    checkInterval: 86400000,
    autoUpdate: false,
    updateNotificationsEnabled: true,
  })),
  lastCheckTimestamp: null,
  checkForUpdates: jest.fn().mockResolvedValue(undefined),
  applyAllUpdates: jest.fn().mockResolvedValue({ succeeded: [], failed: [] }),
  applyUpdate: jest.fn().mockResolvedValue(undefined),
  configureUpdateSettings: jest.fn().mockResolvedValue(undefined),
};
jest.mock('../../../../../src/core/plugins/plugin-update-manager', () => mockPluginUpdateManager);

// MOCK plugin-package-manager para evitar el error de import.meta
const mockPluginPackageManager = {
  // Añadir aquí mocks de funciones si UpdateManager.jsx las usa directamente.
  // Por el código de UpdateManager.jsx, no parece usarlo directamente.
  // Este mock es principalmente para prevenir el error de parseo.
  initialized: true,
  initialize: jest.fn().mockResolvedValue(undefined),
};
jest.mock('../../../../../src/core/plugins/plugin-package-manager', () => mockPluginPackageManager);

// pluginManager es importado por UpdateManager.jsx
const mockPluginManager = {
  // Añadir mocks de funciones si UpdateManager.jsx las usa.
  // No parece usarlas directamente.
};
jest.mock('../../../../../src/core/plugins/plugin-manager', () => ({
  __esModule: true, // Si pluginManager usa export default
  default: mockPluginManager,
}));


let eventBusSubscriptions = {};
const mockEventBus = {
  publish: jest.fn(),
  subscribe: jest.fn((eventName, callback) => {
    if (!eventBusSubscriptions[eventName]) eventBusSubscriptions[eventName] = [];
    eventBusSubscriptions[eventName].push(callback);
    return jest.fn(() => {
      if (eventBusSubscriptions[eventName]) {
        eventBusSubscriptions[eventName] = eventBusSubscriptions[eventName].filter(cb => cb !== callback);
      }
    });
  }),
  _simulateEvent: (eventName, data) => {
    if (eventBusSubscriptions[eventName]) {
      act(() => {
        eventBusSubscriptions[eventName].forEach(cb => cb(data));
      });
    }
  },
};
jest.mock('../../../../../src/core/bus/event-bus', () => mockEventBus);

// --- Import Component Under Test ---
// La importación del componente ocurrirá después de que los mocks se hayan elevado
const UpdateManager = require('../../../../../src/components/settings/update-manager').default;

describe('UpdateManager Component', () => {
  const mockOnBack = jest.fn();
  const mockAvailableUpdateData = {
    'pluginX': { id: 'pluginX', currentVersion: '1.0.0', newVersion: '1.1.0', detectedAt: Date.now() - 10000 },
  };
  const mockHistoryData = {
    'pluginY': [{ appliedAt: Date.now() - 20000, fromVersion: '0.8.0', toVersion: '0.9.0', repositoryId: 'repo-official' }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    eventBusSubscriptions = {};
    mockPluginUpdateManager.getAvailableUpdates.mockReturnValue({});
    mockPluginUpdateManager.getUpdateHistory.mockReturnValue({});
    mockPluginUpdateManager.getUpdateSettings.mockReturnValue({
        checkAutomatically: true, checkInterval: 86400000, autoUpdate: false, updateNotificationsEnabled: true,
    });
    mockPluginUpdateManager.lastCheckTimestamp = null;
    mockPluginUpdateManager.initialize.mockResolvedValue(undefined);
    mockPluginUpdateManager.initialized = true;
    
    // Asegurar que los mocks de dependencias indirectas también estén listos
    mockPluginPackageManager.initialize.mockResolvedValue(undefined);
    mockPluginPackageManager.initialized = true;
  });

  test('debe renderizar el gestor y cargar datos iniciales', async () => {
    mockPluginUpdateManager.getAvailableUpdates.mockReturnValue(mockAvailableUpdateData);
    mockPluginUpdateManager.getUpdateHistory.mockReturnValue(mockHistoryData);
    mockPluginUpdateManager.lastCheckTimestamp = Date.now() - 50000;

    render(<UpdateManager onBack={mockOnBack} />);
    
    expect(await screen.findByText('Gestión de Actualizaciones')).toBeInTheDocument();
    expect(mockPluginUpdateManager.getAvailableUpdates).toHaveBeenCalled();
    expect(mockPluginUpdateManager.getUpdateHistory).toHaveBeenCalled();
    expect(mockPluginUpdateManager.getUpdateSettings).toHaveBeenCalled();

    expect(screen.getByText('pluginX')).toBeInTheDocument(); 
    expect(screen.getByText('pluginY')).toBeInTheDocument(); 
    expect(screen.getByText(/Última verificación:/)).toBeInTheDocument();
  });

  test('debe mostrar "Cargando..." si loading es true', async () => {
    // Forzar estado no inicializado para el mock principal
    mockPluginUpdateManager.initialized = false;
    mockPluginUpdateManager.initialize.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => {
        mockPluginUpdateManager.initialized = true; // Simular que la inicialización termina
        resolve();
      }, 50))
    );

    render(<UpdateManager onBack={mockOnBack} />);
    expect(screen.getByText('Cargando datos de actualizaciones...')).toBeInTheDocument();
    // Esperar a que el contenido principal aparezca después de la carga
    await waitFor(() => expect(screen.queryByText('Cargando datos de actualizaciones...')).not.toBeInTheDocument());
    expect(screen.getByText('Gestión de Actualizaciones')).toBeInTheDocument(); // Verificar que el resto del panel se renderiza
  });

  test('debe llamar a checkForUpdates al hacer clic en el botón', async () => {
    render(<UpdateManager onBack={mockOnBack} />);
    await screen.findByText('Gestión de Actualizaciones'); 

    const checkButton = screen.getByText('Verificar Actualizaciones');
    // La función handleCheckForUpdates es async
    await act(async () => {
      fireEvent.click(checkButton);
    });
    expect(mockPluginUpdateManager.checkForUpdates).toHaveBeenCalledWith({ fullCheck: true });
  });

  test('debe aplicar todas las actualizaciones', async () => {
    mockPluginUpdateManager.getAvailableUpdates.mockReturnValue(mockAvailableUpdateData);
    render(<UpdateManager onBack={mockOnBack} />);
    await screen.findByText('pluginX'); 

    const updateAllButton = screen.getByText('Actualizar Todo');
    // La función handleApplyAllUpdates es async
    await act(async () => {
      fireEvent.click(updateAllButton);
    });
    expect(mockPluginUpdateManager.applyAllUpdates).toHaveBeenCalled();
  });

  test('debe abrir diálogo de confirmación y aplicar actualización específica', async () => {
    mockPluginUpdateManager.getAvailableUpdates.mockReturnValue(mockAvailableUpdateData);
    render(<UpdateManager onBack={mockOnBack} />);
    const updateItem = await screen.findByText('pluginX');
    const updateButton = within(updateItem.closest('.update-item')).getByText('Actualizar');

    fireEvent.click(updateButton); 

    expect(await screen.findByTestId('mock-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Confirmar Actualización');

    const confirmButtonInDialog = within(screen.getByTestId('mock-dialog')).getByText('Actualizar');
    // La función handleApplyUpdate es async
    await act(async () => {
      fireEvent.click(confirmButtonInDialog);
    });

    expect(mockPluginUpdateManager.applyUpdate).toHaveBeenCalledWith('pluginX');
    expect(screen.queryByTestId('mock-dialog')).not.toBeInTheDocument();
  });

  test('debe abrir diálogo de configuración y guardar cambios', async () => {
    render(<UpdateManager onBack={mockOnBack} />);
    await screen.findByText('Gestión de Actualizaciones');

    fireEvent.click(screen.getByText('Configuración'));
    expect(await screen.findByTestId('mock-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Configuración de Actualizaciones');

    const autoCheckCheckbox = screen.getByLabelText(/Verificar actualizaciones automáticamente/i);
    fireEvent.click(autoCheckCheckbox); // Desmarcar

    const saveButton = within(screen.getByTestId('mock-dialog')).getByText('Guardar');
    // La función handleSaveSettings es async
    await act(async () => {
      fireEvent.click(saveButton);
    });

    expect(mockPluginUpdateManager.configureUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ checkAutomatically: false })
    );
    expect(screen.queryByTestId('mock-dialog')).not.toBeInTheDocument();
  });

  test('debe mostrar diálogo de historial de plugin', async () => {
    mockPluginUpdateManager.getUpdateHistory.mockReturnValue(mockHistoryData);
    render(<UpdateManager onBack={mockOnBack} />);
    const historyItem = await screen.findByText('pluginY'); 
    const viewDetailsButton = within(historyItem.closest('.history-item')).getByText('Ver Detalles');

    fireEvent.click(viewDetailsButton);
    expect(await screen.findByTestId('mock-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Historial de Actualizaciones: pluginY');
    expect(screen.getByText('v0.8.0')).toBeInTheDocument(); 
  });

  test('debe llamar a onBack al hacer clic en Volver', async () => {
    render(<UpdateManager onBack={mockOnBack} />);
    await screen.findByText('Gestión de Actualizaciones');
    fireEvent.click(screen.getByText('Volver'));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });
});