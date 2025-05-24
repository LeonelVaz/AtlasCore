/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';

// --- Mocking UI Components ---
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
const mockPluginRepositoryManager = {
  initialized: true,
  initialize: jest.fn().mockResolvedValue(undefined),
  getRepositories: jest.fn(),
  addRepository: jest.fn().mockResolvedValue(undefined),
  updateRepository: jest.fn().mockResolvedValue(undefined),
  removeRepository: jest.fn().mockResolvedValue(undefined),
  toggleRepository: jest.fn().mockResolvedValue(undefined),
  syncRepository: jest.fn().mockResolvedValue({ success: true }),
  syncAllRepositories: jest.fn().mockResolvedValue({ succeeded: [], failed: [] }),
};
jest.mock('../../../../../src/core/plugins/plugin-repository-manager', () => mockPluginRepositoryManager);

// ESTE ES EL MOCK CRUCIAL para evitar el error de import.meta
// RepositoryManager.jsx importa pluginPackageManager.
const mockPluginPackageManager = {
  initialized: true,
  initialize: jest.fn().mockResolvedValue(undefined),
  // Añade aquí mocks de cualquier función de pluginPackageManager que RepositoryManager pueda usar.
  // Por el código de RepositoryManager.jsx, no parece usar ninguna función directamente.
  // Así que un mock simple es suficiente para evitar el error de parseo.
};
jest.mock('../../../../../src/core/plugins/plugin-package-manager', () => mockPluginPackageManager);


const mockEventBus = {
  publish: jest.fn(),
  subscribe: jest.fn((eventName, callback) => {
    if (!mockEventBus.subscriptions) mockEventBus.subscriptions = {};
    if (!mockEventBus.subscriptions[eventName]) mockEventBus.subscriptions[eventName] = [];
    mockEventBus.subscriptions[eventName].push(callback);
    return jest.fn(() => {
        if (mockEventBus.subscriptions && mockEventBus.subscriptions[eventName]) { // Chequeo extra
            mockEventBus.subscriptions[eventName] = mockEventBus.subscriptions[eventName].filter(cb => cb !== callback);
        }
    });
  }),
   _simulateEvent: (eventName, data) => {
    if (mockEventBus.subscriptions && mockEventBus.subscriptions[eventName]) {
      // No es necesario act() aquí si los callbacks del componente no actualizan estado
      // o si los tests ya usan waitFor/findBy*
      mockEventBus.subscriptions[eventName].forEach(cb => cb(data));
    }
  }
};
jest.mock('../../../../../src/core/bus/event-bus', () => mockEventBus);

// --- Import Component Under Test ---
const RepositoryManager = require('../../../../../src/components/settings/repository-manager').default;

// --- Test Data ---
// Usar una copia profunda de los datos para cada test para evitar mutaciones accidentales
const getMockRepositoriesData = () => JSON.parse(JSON.stringify({
  'repo-official': { id: 'repo-official', name: 'Official Atlas Repo', url: 'https://atlas.official.repo', apiEndpoint: 'https://atlas.official.api', description: 'Main repo', official: true, enabled: true, priority: 1, lastSync: Date.now() },
  'repo-community': { id: 'repo-community', name: 'Community Showcase', url: 'https://community.repo', description: 'User plugins', official: false, enabled: true, priority: 10, lastSync: Date.now() - 100000 },
  'repo-disabled': { id: 'repo-disabled', name: 'Old Repo', url: 'https://old.repo', description: 'Disabled', official: false, enabled: false, priority: 20 },
}));

describe('RepositoryManager Component', () => {
  const mockOnBack = jest.fn();
  let currentMockRepositoriesData;

  beforeEach(() => {
    jest.clearAllMocks();
    currentMockRepositoriesData = getMockRepositoriesData();
    mockPluginRepositoryManager.getRepositories.mockReturnValue(currentMockRepositoriesData);
    
    // Asegurar que los mocks de inicialización están resueltos
    mockPluginRepositoryManager.initialize.mockResolvedValue(undefined);
    mockPluginPackageManager.initialize.mockResolvedValue(undefined); // Aunque mockeado, es buena práctica
    mockPluginRepositoryManager.initialized = true;
    mockPluginPackageManager.initialized = true;


    if (mockEventBus.subscriptions) { // Limpiar suscripciones si existen
        Object.keys(mockEventBus.subscriptions).forEach(key => {
            mockEventBus.subscriptions[key] = [];
        });
    }
  });

  afterEach(() => {
    // No es necesario limpiar mockEventBus.subscriptions aquí si se hace en beforeEach
  });

  test('debe renderizar el gestor y cargar repositorios iniciales', async () => {
    render(<RepositoryManager onBack={mockOnBack} />);
    
    expect(screen.getByText('Gestión de Repositorios')).toBeInTheDocument();
    // Esperar a que los repositorios aparezcan después de la carga inicial
    expect(await screen.findByText('Official Atlas Repo')).toBeInTheDocument();
    expect(mockPluginRepositoryManager.getRepositories).toHaveBeenCalled();

    expect(screen.getByText('Community Showcase')).toBeInTheDocument();
    expect(screen.getByText('Old Repo')).toBeInTheDocument();
  });

  test('debe abrir el diálogo para añadir un nuevo repositorio', async () => {
    render(<RepositoryManager onBack={mockOnBack} />);
    await screen.findByText('Official Atlas Repo'); // Esperar carga

    fireEvent.click(screen.getByText('Añadir Repositorio'));
    
    expect(await screen.findByTestId('mock-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Añadir Repositorio');
    expect(screen.getByLabelText('ID')).toBeInTheDocument();
  });

  test('debe añadir un nuevo repositorio', async () => {
    render(<RepositoryManager onBack={mockOnBack} />);
    await screen.findByText('Official Atlas Repo');
    
    fireEvent.click(screen.getByText('Añadir Repositorio'));
    await screen.findByLabelText('ID');

    fireEvent.change(screen.getByLabelText('ID'), { target: { value: 'new-repo' } });
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'New Awesome Repo' } });
    fireEvent.change(screen.getByLabelText('URL'), { target: { value: 'https://new.repo.com' } });

    const addButtonInDialog = within(screen.getByTestId('mock-dialog')).getByText('Añadir');
    // La función handleAddRepository es async
    await act(async () => {
      fireEvent.click(addButtonInDialog);
    });

    await waitFor(() => {
      expect(mockPluginRepositoryManager.addRepository).toHaveBeenCalledWith(expect.objectContaining({
        id: 'new-repo',
        name: 'New Awesome Repo',
        url: 'https://new.repo.com',
      }));
    });
    expect(screen.queryByTestId('mock-dialog')).not.toBeInTheDocument();
  });

  test('debe mostrar error si faltan campos obligatorios al añadir', async () => {
    render(<RepositoryManager onBack={mockOnBack} />);
    await screen.findByText('Añadir Repositorio'); // Esperar a que el botón esté disponible
    fireEvent.click(screen.getByText('Añadir Repositorio'));
    await screen.findByLabelText('ID'); // Esperar a que el diálogo esté abierto

    const addButtonInDialog = within(screen.getByTestId('mock-dialog')).getByText('Añadir');
    // No es necesario `act` aquí si el click no causa actualizaciones de estado asíncronas
    // pero el `setError` sí es una actualización de estado.
    fireEvent.click(addButtonInDialog); 
    
    expect(await screen.findByText('ID, nombre y URL son campos obligatorios')).toBeInTheDocument();
    expect(mockPluginRepositoryManager.addRepository).not.toHaveBeenCalled();
  });

  test('debe abrir el diálogo para editar un repositorio', async () => {
    render(<RepositoryManager onBack={mockOnBack} />);
    const communityRepoItem = (await screen.findByText('Community Showcase')).closest('.repository-item');
    const editButton = within(communityRepoItem).getByText('Editar');
    fireEvent.click(editButton);

    expect(await screen.findByTestId('mock-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Editar Repositorio');
    expect(screen.getByLabelText('Nombre')).toHaveValue('Community Showcase');
    expect(screen.getByLabelText('URL')).toHaveValue('https://community.repo');
  });
  
  test('debe editar un repositorio existente', async () => {
    render(<RepositoryManager onBack={mockOnBack} />);
    const communityRepoItem = (await screen.findByText('Community Showcase')).closest('.repository-item');
    fireEvent.click(within(communityRepoItem).getByText('Editar'));
    await screen.findByLabelText('Nombre'); // Esperar a que el diálogo esté listo

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Updated Community Repo' } });
    
    const saveButtonInDialog = within(screen.getByTestId('mock-dialog')).getByText('Guardar');
    await act(async () => {
      fireEvent.click(saveButtonInDialog);
    });

    await waitFor(() => {
      expect(mockPluginRepositoryManager.updateRepository).toHaveBeenCalledWith('repo-community', expect.objectContaining({
        name: 'Updated Community Repo',
      }));
    });
    expect(screen.queryByTestId('mock-dialog')).not.toBeInTheDocument();
  });

  test('debe deshabilitar/habilitar un repositorio', async () => {
    render(<RepositoryManager onBack={mockOnBack} />);
    const communityRepoItem = (await screen.findByText('Community Showcase')).closest('.repository-item');
    const toggleButton = within(communityRepoItem).getByText('Deshabilitar'); 
    
    // La función handleToggleRepository es async
    await act(async () => {
      fireEvent.click(toggleButton);
    });
    await waitFor(() => {
      expect(mockPluginRepositoryManager.toggleRepository).toHaveBeenCalledWith('repo-community', false);
    });

    // Simular actualización del estado y re-render para verificar el cambio del botón (opcional pero bueno)
    currentMockRepositoriesData['repo-community'].enabled = false;
    mockPluginRepositoryManager.getRepositories.mockReturnValue(currentMockRepositoriesData);
    // Simular el evento que causa la actualización en el componente
    act(() => { 
        mockEventBus._simulateEvent('pluginSystem.repositoryToggled', { repositoryId: 'repo-community', enabled: false });
    });
    
    // Esperar a que el botón cambie a "Habilitar"
    expect(await within(communityRepoItem).findByText('Habilitar')).toBeInTheDocument();
  });

  test('debe eliminar un repositorio (no oficial)', async () => {
    render(<RepositoryManager onBack={mockOnBack} />);
    const communityRepoItem = (await screen.findByText('Community Showcase')).closest('.repository-item');
    fireEvent.click(within(communityRepoItem).getByText('Eliminar'));

    expect(await screen.findByTestId('mock-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Eliminar Repositorio');
    
    const confirmDeleteButton = within(screen.getByTestId('mock-dialog')).getByText('Eliminar');
    await act(async () => {
      fireEvent.click(confirmDeleteButton);
    });

    await waitFor(() => {
      expect(mockPluginRepositoryManager.removeRepository).toHaveBeenCalledWith('repo-community');
    });
    expect(screen.queryByTestId('mock-dialog')).not.toBeInTheDocument();
  });
  
  test('los botones Editar y Eliminar deben estar deshabilitados para repositorios oficiales', async () => {
    render(<RepositoryManager onBack={mockOnBack} />);
    const officialRepoItem = (await screen.findByText('Official Atlas Repo')).closest('.repository-item');
    expect(within(officialRepoItem).getByText('Editar')).toBeDisabled();
    expect(within(officialRepoItem).getByText('Eliminar')).toBeDisabled();
    expect(within(officialRepoItem).getByText('Deshabilitar')).toBeDisabled();
  });

  test('debe sincronizar un repositorio específico', async () => {
    render(<RepositoryManager onBack={mockOnBack} />);
    const communityRepoItem = (await screen.findByText('Community Showcase')).closest('.repository-item');
    const syncButton = within(communityRepoItem).getByText('Sincronizar');
    
    // handleSyncRepository es async
    await act(async () => {
      fireEvent.click(syncButton);
    });

    await waitFor(() => {
      expect(mockPluginRepositoryManager.syncRepository).toHaveBeenCalledWith('repo-community');
    });
  });

  test('debe sincronizar todos los repositorios', async () => {
    render(<RepositoryManager onBack={mockOnBack} />);
    await screen.findByText('Gestión de Repositorios');
    
    const syncAllButton = screen.getByText('Sincronizar Todos');
    // handleSyncAll es async
    await act(async () => {
      fireEvent.click(syncAllButton);
    });

    await waitFor(() => {
      expect(mockPluginRepositoryManager.syncAllRepositories).toHaveBeenCalled();
    });
  });
  
  test('debe llamar onBack al hacer clic en el botón Volver', async () => {
    render(<RepositoryManager onBack={mockOnBack} />);
    await screen.findByText('Gestión de Repositorios');

    const backButton = screen.getByText('Volver');
    fireEvent.click(backButton);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  test('debe mostrar "Cargando repositorios..." durante la carga', async () => {
    // Forzar estado no inicializado para el mock
    mockPluginRepositoryManager.initialized = false;
    mockPluginRepositoryManager.initialize.mockImplementationOnce(
      () => new Promise(resolve => global.setTimeout(() => {
          mockPluginRepositoryManager.initialized = true; // Simular que la inicialización termina
          resolve();
      }, 100))
    );
    
    render(<RepositoryManager onBack={mockOnBack} />);
    expect(screen.getByText('Cargando repositorios...')).toBeInTheDocument();
    // Esperar a que el contenido principal aparezca después de la carga
    expect(await screen.findByText('Official Atlas Repo', {}, {timeout: 500})).toBeInTheDocument();
    expect(screen.queryByText('Cargando repositorios...')).not.toBeInTheDocument();
  });

  test('debe manejar error al cargar repositorios', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockPluginRepositoryManager.initialized = false; // Simular que no está inicializado
    mockPluginRepositoryManager.initialize.mockRejectedValueOnce(new Error('Init failed'));
    
    render(<RepositoryManager onBack={mockOnBack} />);
    expect(await screen.findByText('No se pudieron cargar los repositorios')).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error al cargar repositorios:', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });
});