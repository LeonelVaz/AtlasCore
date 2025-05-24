/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// --- Mocking Dependencies ---
const mockStorageService = {
  get: jest.fn(),
  set: jest.fn(),
};
jest.mock('../../../../../src/services/storage-service', () => mockStorageService);

const mockEventBus = {
  publish: jest.fn(),
  subscribe: jest.fn(() => jest.fn()),
  setDebugMode: jest.fn(),
  getActiveEvents: jest.fn(() => ['event1', 'event2']),
  getSubscriberCount: jest.fn(() => 2),
};
jest.mock('../../../../../src/core/bus/event-bus', () => mockEventBus);

jest.mock('../../../../../src/core/config/constants', () => ({
  STORAGE_KEYS: {
    DEV_EVENT_DEBUGGER_ENABLED: 'test_dev.eventDebuggerEnabled',
    DEV_CONSOLE_LOGS_ENABLED: 'test_dev.consoleLogsEnabled',
    DEV_PERFORMANCE_MONITOR_ENABLED: 'test_dev.performanceMonitorEnabled',
  },
}));

// --- Import Component Under Test ---
const DeveloperPanel = require('../../../../../src/components/settings/developer-panel').default;
const { STORAGE_KEYS } = require('../../../../../src/core/config/constants');

// Mock window properties
let originalNavigator;
let originalScreen;
let originalElectronAPI;

describe('DeveloperPanel Component', () => {
  let consoleLogSpy, consoleClearSpy, consoleGroupSpy, consoleGroupEndSpy, consoleTableSpy, consoleErrorSpy;

  beforeAll(() => {
    originalNavigator = Object.getOwnPropertyDescriptor(global, 'navigator');
    originalScreen = Object.getOwnPropertyDescriptor(global, 'screen');
    originalElectronAPI = window.electronAPI;

    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'TestAgent/1.0',
        platform: 'TestPlatform',
        language: 'en-US',
        cookieEnabled: true,
        onLine: true,
      },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(global, 'screen', {
      value: {
        width: 1920,
        height: 1080,
        availWidth: 1920,
        availHeight: 1040,
        colorDepth: 24,
      },
      writable: true,
      configurable: true,
    });
  });

  afterAll(() => {
    if (originalNavigator) {
      Object.defineProperty(global, 'navigator', originalNavigator);
    }
    if (originalScreen) {
      Object.defineProperty(global, 'screen', originalScreen);
    }
    window.electronAPI = originalElectronAPI;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageService.get.mockImplementation(async (key, defaultValue) => defaultValue);
    mockStorageService.set.mockResolvedValue(undefined);

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleClearSpy = jest.spyOn(console, 'clear').mockImplementation(() => {});
    consoleGroupSpy = jest.spyOn(console, 'group').mockImplementation(() => {});
    consoleGroupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation(() => {});
    consoleTableSpy = jest.spyOn(console, 'table').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    if (typeof window.electronAPI !== 'undefined') {
        Object.defineProperty(window, 'electronAPI', {
            value: undefined, 
            writable: true,
            configurable: true, 
        });
    }
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleClearSpy.mockRestore();
    consoleGroupSpy.mockRestore();
    consoleGroupEndSpy.mockRestore();
    consoleTableSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test('debe renderizar el panel y cargar la configuración inicial (todos desactivados por defecto)', async () => {
    render(<DeveloperPanel />);
    expect(await screen.findByText('Herramientas de Desarrollo')).toBeInTheDocument();
    
    expect(mockStorageService.get).toHaveBeenCalledWith(STORAGE_KEYS.DEV_EVENT_DEBUGGER_ENABLED, false);
    expect(mockStorageService.get).toHaveBeenCalledWith(STORAGE_KEYS.DEV_CONSOLE_LOGS_ENABLED, false);
    expect(mockStorageService.get).toHaveBeenCalledWith(STORAGE_KEYS.DEV_PERFORMANCE_MONITOR_ENABLED, false);

    const eventDebuggerSection = screen.getByText('Event Debugger').closest('.settings-section');
    const eventDebuggerInput = eventDebuggerSection.querySelector('input[type="checkbox"]');
    expect(eventDebuggerInput).not.toBeChecked();

    const consoleLogsSection = screen.getByText('Logs Detallados').closest('.settings-section');
    const consoleLogsInput = consoleLogsSection.querySelector('input[type="checkbox"]');
    expect(consoleLogsInput).not.toBeChecked();
    
    const perfMonitorSection = screen.getByText('Monitor de Rendimiento').closest('.settings-section');
    const perfMonitorInput = perfMonitorSection.querySelector('input[type="checkbox"]');
    expect(perfMonitorInput).not.toBeChecked();

    expect(screen.getByText('🧹 Limpiar Consola')).toBeInTheDocument();
    expect(screen.getByText('🖥️ Info del Sistema')).toBeInTheDocument();
    expect(screen.getByText('🧪 Test de Eventos')).toBeInTheDocument();
  });

  test('debe cargar la configuración con valores guardados', async () => {
    mockStorageService.get
      .mockImplementation(async (key) => {
        if (key === STORAGE_KEYS.DEV_EVENT_DEBUGGER_ENABLED) return true;
        if (key === STORAGE_KEYS.DEV_CONSOLE_LOGS_ENABLED) return true;
        if (key === STORAGE_KEYS.DEV_PERFORMANCE_MONITOR_ENABLED) return false;
        return false;
      });
    
    render(<DeveloperPanel />);
    await screen.findByText('Herramientas de Desarrollo');

    const eventDebuggerSection = screen.getByText('Event Debugger').closest('.settings-section');
    expect(eventDebuggerSection.querySelector('input[type="checkbox"]')).toBeChecked();
    
    const consoleLogsSection = screen.getByText('Logs Detallados').closest('.settings-section');
    expect(consoleLogsSection.querySelector('input[type="checkbox"]')).toBeChecked();

    const perfMonitorSection = screen.getByText('Monitor de Rendimiento').closest('.settings-section');
    expect(perfMonitorSection.querySelector('input[type="checkbox"]')).not.toBeChecked();
  });

  test('debe activar/desactivar el Event Debugger y guardar el cambio', async () => {
    render(<DeveloperPanel />);
    await screen.findByText('Herramientas de Desarrollo');

    const eventDebuggerSection = screen.getByText('Event Debugger').closest('.settings-section');
    const toggle = eventDebuggerSection.querySelector('input[type="checkbox"]');
    
    expect(toggle).not.toBeChecked();
    await act(async () => {
      fireEvent.click(toggle);
    });

    expect(toggle).toBeChecked();
    await waitFor(() => {
      expect(mockStorageService.set).toHaveBeenCalledWith(STORAGE_KEYS.DEV_EVENT_DEBUGGER_ENABLED, true);
      expect(mockEventBus.publish).toHaveBeenCalledWith('developer.eventDebuggerToggled', { enabled: true });
    });
    expect(screen.getByText(/El Event Debugger aparecerá en la esquina inferior derecha/i)).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(toggle).not.toBeChecked();
    await waitFor(() => {
      expect(mockStorageService.set).toHaveBeenCalledWith(STORAGE_KEYS.DEV_EVENT_DEBUGGER_ENABLED, false);
      expect(mockEventBus.publish).toHaveBeenCalledWith('developer.eventDebuggerToggled', { enabled: false });
    });
    expect(screen.queryByText(/El Event Debugger aparecerá en la esquina inferior derecha/i)).not.toBeInTheDocument();
  });

  test('debe activar/desactivar los Logs de Consola y guardar el cambio', async () => {
    render(<DeveloperPanel />);
    await screen.findByText('Herramientas de Desarrollo');

    const consoleLogsSection = screen.getByText('Logs Detallados').closest('.settings-section');
    const toggle = consoleLogsSection.querySelector('input[type="checkbox"]');
    
    await act(async () => { fireEvent.click(toggle); });
    expect(toggle).toBeChecked();
    await waitFor(() => {
      expect(mockStorageService.set).toHaveBeenCalledWith(STORAGE_KEYS.DEV_CONSOLE_LOGS_ENABLED, true);
      expect(mockEventBus.setDebugMode).toHaveBeenCalledWith(true);
      expect(mockEventBus.publish).toHaveBeenCalledWith('developer.consoleLogsToggled', { enabled: true });
    });

    await act(async () => { fireEvent.click(toggle); });
    expect(toggle).not.toBeChecked();
    await waitFor(() => {
        expect(mockStorageService.set).toHaveBeenCalledWith(STORAGE_KEYS.DEV_CONSOLE_LOGS_ENABLED, false);
        expect(mockEventBus.setDebugMode).toHaveBeenCalledWith(false);
        expect(mockEventBus.publish).toHaveBeenCalledWith('developer.consoleLogsToggled', { enabled: false });
      });
  });
  
  test('debe activar/desactivar el Monitor de Rendimiento y guardar el cambio', async () => {
    render(<DeveloperPanel />);
    await screen.findByText('Herramientas de Desarrollo');

    const perfMonitorSection = screen.getByText('Monitor de Rendimiento').closest('.settings-section');
    const toggle = perfMonitorSection.querySelector('input[type="checkbox"]');
    
    await act(async () => { fireEvent.click(toggle); });
    expect(toggle).toBeChecked();
    await waitFor(() => {
      expect(mockStorageService.set).toHaveBeenCalledWith(STORAGE_KEYS.DEV_PERFORMANCE_MONITOR_ENABLED, true);
      expect(mockEventBus.publish).toHaveBeenCalledWith('developer.performanceMonitorToggled', { enabled: true });
    });

    await act(async () => { fireEvent.click(toggle); });
    expect(toggle).not.toBeChecked();
    await waitFor(() => {
        expect(mockStorageService.set).toHaveBeenCalledWith(STORAGE_KEYS.DEV_PERFORMANCE_MONITOR_ENABLED, false);
        expect(mockEventBus.publish).toHaveBeenCalledWith('developer.performanceMonitorToggled', { enabled: false });
      });
  });

  test('debe limpiar la consola al hacer clic en "Limpiar Consola"', async () => {
    render(<DeveloperPanel />);
    const clearButton = await screen.findByText('🧹 Limpiar Consola');
    
    fireEvent.click(clearButton);
    expect(consoleClearSpy).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith('🧹 Logs de consola limpiados por el usuario');
  });

  test('debe mostrar información del sistema al hacer clic en "Info del Sistema"', async () => {
    render(<DeveloperPanel />);
    const sysInfoButton = await screen.findByText('🖥️ Info del Sistema');
    
    fireEvent.click(sysInfoButton);
    
    expect(consoleGroupSpy).toHaveBeenCalledWith('🖥️ INFORMACIÓN DEL SISTEMA');
    expect(consoleTableSpy).toHaveBeenCalledWith(expect.objectContaining({ version: '0.3.0' }));
    expect(consoleLogSpy).toHaveBeenCalledWith('🌐 Navegador:', 'TestAgent/1.0');
    expect(consoleGroupEndSpy).toHaveBeenCalled();
  });

  test('debe ejecutar test del sistema de eventos al hacer clic en "Test de Eventos"', async () => {
    render(<DeveloperPanel />);
    const testEventsButton = await screen.findByText('🧪 Test de Eventos');
    
    fireEvent.click(testEventsButton);

    expect(consoleGroupSpy).toHaveBeenCalledWith('🧪 TEST DEL SISTEMA DE EVENTOS');
    expect(mockEventBus.publish).toHaveBeenCalledWith('developer.test', expect.any(Object));
    expect(mockEventBus.getActiveEvents).toHaveBeenCalled();
    expect(mockEventBus.getSubscriberCount).toHaveBeenCalledWith('event1');
    expect(mockEventBus.getSubscriberCount).toHaveBeenCalledWith('event2');
    expect(consoleTableSpy).toHaveBeenCalledWith({ event1: 2, event2: 2 });
    expect(consoleGroupEndSpy).toHaveBeenCalled();
  });

  test('debe manejar errores al cargar la configuración', async () => {
    mockStorageService.get.mockRejectedValue(new Error('Load failed'));
    render(<DeveloperPanel />);
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error al cargar configuración de desarrollo:', expect.any(Error));
    });
    expect(await screen.findByText('Herramientas de Desarrollo')).toBeInTheDocument();
  });

  test('debe manejar errores al cambiar configuraciones y revertir estado', async () => {
    mockStorageService.set.mockRejectedValueOnce(new Error('Set failed'));
    render(<DeveloperPanel />);
    await screen.findByText('Herramientas de Desarrollo');

    const eventDebuggerSection = screen.getByText('Event Debugger').closest('.settings-section');
    const toggle = eventDebuggerSection.querySelector('input[type="checkbox"]');

    fireEvent.click(toggle);
    expect(toggle).toBeChecked(); 

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error al cambiar configuración del Event Debugger:', expect.any(Error));
    });
    expect(toggle).not.toBeChecked();
  });

  test('debe mostrar entorno Electron si window.electronAPI está definido', async () => {
    Object.defineProperty(window, 'electronAPI', {
        value: {}, 
        writable: true,
        configurable: true, 
    });
    render(<DeveloperPanel />);
    // Esperar a que el componente cargue
    await screen.findByText('Herramientas de Desarrollo');
    // Usar un matcher de función para encontrar el texto dividido
    const environmentElement = await screen.findByText((content, element) => {
        return element.tagName.toLowerCase() === 'p' && 
               element.textContent.includes('Entorno:') &&
               element.textContent.includes('Electron');
    });
    expect(environmentElement).toBeInTheDocument();
  });

  test('debe mostrar entorno Web si window.electronAPI no está definido', async () => {
    render(<DeveloperPanel />);
    // Esperar a que el componente cargue
    await screen.findByText('Herramientas de Desarrollo');
    // Usar un matcher de función para encontrar el texto dividido
    const environmentElement = await screen.findByText((content, element) => {
        return element.tagName.toLowerCase() === 'p' &&
               element.textContent.includes('Entorno:') &&
               element.textContent.includes('Web');
    });
    expect(environmentElement).toBeInTheDocument();
  });
});