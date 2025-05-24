/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';

// --- Mocking UI Components ---
jest.mock('../../../../../src/components/ui/button', () => {
  return jest.fn(({ children, onClick, variant, size, disabled, className, title }) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      disabled={disabled}
      className={className || 'mocked-button'}
      title={title}
    >
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

// --- Mocking Child Page Components ---
jest.mock('../../../../../src/components/settings/repository-manager', () => {
  // eslint-disable-next-line react/prop-types
  return function MockRepositoryManager({ onBack }) { 
    return (
      <div data-testid="mock-repository-manager">
        RepositoryManagerMock <button onClick={onBack}>BackFromRepo</button>
      </div>
    );
  };
});

jest.mock('../../../../../src/components/settings/update-manager', () => {
  // eslint-disable-next-line react/prop-types
  return function MockUpdateManager({ onBack }) {
    return (
      <div data-testid="mock-update-manager">
        UpdateManagerMock <button onClick={onBack}>BackFromUpdate</button>
      </div>
    );
  };
});

jest.mock('../../../../../src/components/settings/plugin-marketplace', () => {
  // eslint-disable-next-line react/prop-types
  return function MockPluginMarketplace({ onBack }) {
    return (
      <div data-testid="mock-plugin-marketplace">
        PluginMarketplaceMock <button onClick={onBack}>BackFromMarketplace</button>
      </div>
    );
  };
});


// --- Mocking Core Services ---
const mockPluginManager = {
  initialized: true,
  initialize: jest.fn().mockResolvedValue(undefined),
  getAllPlugins: jest.fn(),
  getStatus: jest.fn(),
  subscribe: jest.fn(() => jest.fn()), 
  isPluginActive: jest.fn(),
  activatePlugin: jest.fn().mockResolvedValue(undefined),
  deactivatePlugin: jest.fn().mockResolvedValue(undefined),
  reloadPlugins: jest.fn().mockResolvedValue(undefined),
  getPluginAPIsInfo: jest.fn(() => ({})),
  getChannelsInfo: jest.fn(() => ({})),
  _triggerSubscription: (eventName, data) => {
    const call = mockPluginManager.subscribe.mock.calls.find(c => c[0] === eventName);
    if (call && call[1]) {
      call[1](data);
    }
  }
};
jest.mock('../../../../../src/core/plugins/plugin-manager', () => mockPluginManager);

const mockPluginErrorHandler = {
  getErrorLog: jest.fn(() => []),
  clearErrorLog: jest.fn(),
};
jest.mock('../../../../../src/core/plugins/plugin-error-handler', () => mockPluginErrorHandler);

const mockPluginStorage = {
  clearPluginData: jest.fn().mockResolvedValue(undefined),
};
jest.mock('../../../../../src/core/plugins/plugin-storage', () => mockPluginStorage);

const mockPluginDependencyResolver = {
  getDetectedCycles: jest.fn(() => []),
};
jest.mock('../../../../../src/core/plugins/plugin-dependency-resolver', () => mockPluginDependencyResolver);

const mockPluginPackageManager = {
  initialized: true,
  initialize: jest.fn().mockResolvedValue(undefined),
  isPluginInstalled: jest.fn(() => true),
  uninstallPlugin: jest.fn().mockResolvedValue(undefined),
};
jest.mock('../../../../../src/core/plugins/plugin-package-manager', () => mockPluginPackageManager);

let eventBusPluginUpdateManagerSubscriptions = {};
const mockPluginUpdateManager = {
  initialized: true,
  initialize: jest.fn().mockResolvedValue(undefined),
  subscribe: jest.fn((eventName, callback) => { 
    if (!eventBusPluginUpdateManagerSubscriptions[eventName]) {
        eventBusPluginUpdateManagerSubscriptions[eventName] = [];
    }
    eventBusPluginUpdateManagerSubscriptions[eventName].push(callback);
    return jest.fn(() => {
        if (eventBusPluginUpdateManagerSubscriptions[eventName]) {
            eventBusPluginUpdateManagerSubscriptions[eventName] = eventBusPluginUpdateManagerSubscriptions[eventName].filter(cb => cb !== callback);
        }
    });
  }),
  getAvailableUpdates: jest.fn(() => ({})),
  checkForUpdates: jest.fn().mockResolvedValue(undefined),
  _triggerSubscription: (eventName, data) => { 
    if (eventBusPluginUpdateManagerSubscriptions[eventName]) {
        act(() => {
            eventBusPluginUpdateManagerSubscriptions[eventName].forEach(cb => cb(data));
        });
    }
  }
};
jest.mock('../../../../../src/core/plugins/plugin-update-manager', () => mockPluginUpdateManager);


// --- Import Component Under Test ---
const PluginsPanel = require('../../../../../src/components/settings/plugins-panel').default;

// --- Test Data ---
const mockPluginsData = [
  { id: 'plugin1', name: 'Plugin One', version: '1.0.0', author: 'Author One', description: 'Desc One', compatible: true, minAppVersion: '0.1.0', maxAppVersion: '1.0.0', dependencies: ['plugin2'], conflicts: [] },
  { id: 'plugin2', name: 'Plugin Two', version: '1.1.0', author: 'Author Two', description: 'Desc Two', compatible: true, minAppVersion: '0.1.0', maxAppVersion: '1.0.0', dependencies: [], conflicts: [] },
  { id: 'plugin3', name: 'Plugin Three (Incompatible)', version: '1.0.0', author: 'Author Three', description: 'Desc Three', compatible: false, incompatibilityReason: 'Too old', minAppVersion: '0.0.1', maxAppVersion: '0.0.2', dependencies: [], conflicts: [] },
];

const mockSystemStatus = {
  initialized: true,
  totalPlugins: 3,
  activePlugins: 1,
  compatiblePlugins: 2,
  apiCount: 0,
  activeChannels: 0,
};


describe('PluginsPanel Component', () => {
  let originalConfirm;
  let originalAlert;

  beforeEach(() => {
    jest.clearAllMocks();
    eventBusPluginUpdateManagerSubscriptions = {}; 
    
    originalConfirm = window.confirm;
    originalAlert = window.alert;
    window.confirm = jest.fn(() => true); 
    window.alert = jest.fn();

    mockPluginManager.getAllPlugins.mockReturnValue([...mockPluginsData]);
    mockPluginManager.getStatus.mockReturnValue(mockSystemStatus);
    mockPluginManager.isPluginActive.mockImplementation(pluginId => pluginId === 'plugin1');
    mockPluginErrorHandler.getErrorLog.mockReturnValue([]);
    mockPluginDependencyResolver.getDetectedCycles.mockReturnValue([]);
    mockPluginUpdateManager.getAvailableUpdates.mockReturnValue({});
    
    mockPluginManager.initialized = true;
    mockPluginPackageManager.initialized = true;
    mockPluginUpdateManager.initialized = true;
    mockPluginManager.initialize.mockResolvedValue(undefined);
    mockPluginPackageManager.initialize.mockResolvedValue(undefined);
    mockPluginUpdateManager.initialize.mockResolvedValue(undefined);
  });

  afterEach(() => {
    window.confirm = originalConfirm;
    window.alert = originalAlert;
  });

  test('debe renderizar el panel principal y cargar datos iniciales', async () => {
    render(<PluginsPanel />);
    expect(screen.getByText('Plugins')).toBeInTheDocument(); 
    expect(await screen.findByText('Plugin One')).toBeInTheDocument();
    expect(mockPluginManager.getAllPlugins).toHaveBeenCalled();
    expect(mockPluginManager.getStatus).toHaveBeenCalled();
    expect(screen.getByText('Plugin Two')).toBeInTheDocument();
    expect(screen.getByText('Plugin Three (Incompatible)')).toBeInTheDocument();
    expect(screen.getByText(/Sistema de plugins inicializado/i)).toBeInTheDocument();
    expect(within(screen.getByText('Total:').closest('.status-item')).getByText('3')).toBeInTheDocument();
    expect(within(screen.getByText('Activos:').closest('.status-item')).getByText('1')).toBeInTheDocument();
    expect(within(screen.getByText('Compatibles:').closest('.status-item')).getByText('2')).toBeInTheDocument();
  });

  test('debe mostrar "Cargando plugins..." durante la carga inicial', async () => {
    mockPluginManager.initialize.mockImplementationOnce(
        () => new Promise(resolve => setTimeout(() => {
            mockPluginManager.initialized = true; 
            resolve();
        }, 100))
    );
    mockPluginManager.initialized = false; 
    
    render(<PluginsPanel />);
    expect(screen.getByText('Cargando plugins...')).toBeInTheDocument();
    await screen.findByText('Plugin One', {}, { timeout: 500 });
    expect(screen.queryByText('Cargando plugins...')).not.toBeInTheDocument();
  });

  test('debe activar un plugin inactivo y compatible', async () => {
    render(<PluginsPanel />);
    const pluginTwoItem = (await screen.findByText('Plugin Two')).closest('.plugin-item');
    const activateButton = within(pluginTwoItem).getByText('Activar');
    
    await act(async () => {
      fireEvent.click(activateButton);
    });

    await waitFor(() => {
      expect(mockPluginManager.activatePlugin).toHaveBeenCalledWith('plugin2');
    });
  });

  test('debe desactivar un plugin activo', async () => {
    render(<PluginsPanel />);
    const pluginOneItem = (await screen.findByText('Plugin One')).closest('.plugin-item');
    const deactivateButton = within(pluginOneItem).getByText('Desactivar');
    
    await act(async () => {
      fireEvent.click(deactivateButton);
    });

    await waitFor(() => {
      expect(mockPluginManager.deactivatePlugin).toHaveBeenCalledWith('plugin1');
    });
  });
  
  test('el botón Activar debe estar deshabilitado para plugins incompatibles', async () => {
    render(<PluginsPanel />);
    const pluginThreeItem = (await screen.findByText('Plugin Three (Incompatible)')).closest('.plugin-item');
    const activateButton = within(pluginThreeItem).getByText('Activar');
    expect(activateButton).toBeDisabled();
    expect(activateButton).toHaveAttribute('title', 'Too old');
  });

  test('debe recargar todos los plugins', async () => {
    render(<PluginsPanel />);
    await screen.findByText('Plugins'); 
    
    const reloadButton = screen.getByText('Recargar Plugins');
    await act(async () => {
      fireEvent.click(reloadButton);
    });

    await waitFor(() => {
      expect(mockPluginManager.reloadPlugins).toHaveBeenCalled();
    });
  });

  test('debe mostrar detalles del plugin', async () => {
    render(<PluginsPanel />);
    const pluginOneItem = (await screen.findByText('Plugin One')).closest('.plugin-item');
    const detailsButton = within(pluginOneItem).getByText('Detalles');
    fireEvent.click(detailsButton);

    expect(await screen.findByTestId('mock-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Plugin: Plugin One');
    expect(within(screen.getByTestId('mock-dialog')).getByText('Desc One')).toBeInTheDocument();
  });

  test('debe mostrar dependencias del plugin', async () => {
    render(<PluginsPanel />);
    const pluginOneItem = (await screen.findByText('Plugin One')).closest('.plugin-item');
    const depsButton = within(pluginOneItem).getByText('Dependencias');
    fireEvent.click(depsButton);

    expect(await screen.findByTestId('mock-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Dependencias: Plugin One');
    expect(within(screen.getByTestId('mock-dialog')).getByText('plugin2')).toBeInTheDocument();
  });

  test('debe navegar a RepositoryManager, UpdateManager y PluginMarketplace y volver', async () => {
    render(<PluginsPanel />);
    await screen.findByText('Plugins');

    fireEvent.click(screen.getByText('Marketplace'));
    expect(await screen.findByTestId('mock-plugin-marketplace')).toBeInTheDocument();
    fireEvent.click(screen.getByText('BackFromMarketplace'));
    expect(await screen.findByText('Plugins')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Repositorios'));
    expect(await screen.findByTestId('mock-repository-manager')).toBeInTheDocument();
    fireEvent.click(screen.getByText('BackFromRepo'));
    expect(await screen.findByText('Plugins')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText(/^Actualizaciones/)); 
    expect(await screen.findByTestId('mock-update-manager')).toBeInTheDocument();
    fireEvent.click(screen.getByText('BackFromUpdate'));
    expect(await screen.findByText('Plugins')).toBeInTheDocument();
  });

  test('debe mostrar errores de plugins si existen y permitir limpiarlos', async () => {
    const mockErrorData = [{ pluginId: 'plugin2', message: 'Failed to init', operation: 'init', timestamp: Date.now() }];
    mockPluginErrorHandler.getErrorLog.mockReturnValue(mockErrorData);
    
    render(<PluginsPanel />);
    expect(await screen.findByText('1 plugins con errores')).toBeInTheDocument();
    
    const viewErrorsButton = screen.getByText('Ver errores');
    fireEvent.click(viewErrorsButton);

    expect(await screen.findByText('Errores detectados')).toBeInTheDocument();
    // CORRECCIÓN AQUÍ: Hacer el matcher más específico para el div.plugin-error-item
    const plugin2ErrorItem = screen.getByText((content, node) => 
        node.classList.contains('plugin-error-item') && 
        (node.textContent || "").includes('plugin2')
    );
    expect(plugin2ErrorItem).toBeInTheDocument();
    // Verificar que el mensaje específico está DENTRO de este ítem de error
    expect(within(plugin2ErrorItem).getByText('Failed to init')).toBeInTheDocument();

    const clearAllButton = screen.getByText('Limpiar todos');
    fireEvent.click(clearAllButton);
    expect(mockPluginErrorHandler.clearErrorLog).toHaveBeenCalled();
  });

  test('debe desinstalar un plugin (plugin inactivo)', async () => {
    mockPluginManager.isPluginActive.mockImplementation(pluginId => pluginId === 'plugin1');
    
    render(<PluginsPanel />);
    const pluginTwoItem = (await screen.findByText('Plugin Two')).closest('.plugin-item');
    const uninstallButton = within(pluginTwoItem).getByText('Desinstalar');
    
    window.confirm.mockReturnValueOnce(true); 
    await act(async () => {
      fireEvent.click(uninstallButton);
    });
    
    expect(window.confirm).toHaveBeenCalledWith('¿Estás seguro de que deseas desinstalar el plugin plugin2?');
    await waitFor(() => {
      expect(mockPluginPackageManager.uninstallPlugin).toHaveBeenCalledWith('plugin2');
    });
  });

  test('el botón Desinstalar debe estar deshabilitado para plugins activos', async () => {
    render(<PluginsPanel />);
    const pluginOneItem = (await screen.findByText('Plugin One')).closest('.plugin-item');
    const uninstallButton = within(pluginOneItem).getByText('Desinstalar');
    expect(uninstallButton).toBeDisabled();
    expect(uninstallButton).toHaveAttribute('title', 'Desactiva el plugin antes de desinstalarlo');
  });

  test('debe mostrar sección de actualizaciones si hay actualizaciones disponibles', async () => {
    mockPluginUpdateManager.getAvailableUpdates.mockReturnValue({
      'plugin1': { pluginId: 'plugin1', currentVersion: '1.0.0', newVersion: '1.1.0', releaseNotes: 'Fixes' }
    });
    render(<PluginsPanel />);
    expect(await screen.findByText('Actualizaciones Disponibles')).toBeInTheDocument();
    expect(screen.getByText(/Hay 1 actualización disponible/i)).toBeInTheDocument();
    expect(screen.getByText('Ver Actualizaciones')).toBeInTheDocument();
  });

  test('debe manejar la no existencia de plugins instalados', async () => {
    mockPluginManager.getAllPlugins.mockReturnValue([]);
    mockPluginManager.getStatus.mockReturnValue({ initialized: true, totalPlugins: 0 });
    render(<PluginsPanel />);
    expect(await screen.findByText('No se encontraron plugins instalados.')).toBeInTheDocument();
    expect(screen.getByText('Ir al Marketplace')).toBeInTheDocument();
  });
});