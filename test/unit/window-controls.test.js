// test/unit/window-controls.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Importar el componente a probar
import WindowControls from '../../src/components/ui/window-controls';

describe('WindowControls Component', () => {
  // Configuración para cada prueba
  beforeEach(() => {
    // Eliminar window.electronAPI para asegurar entorno limpio
    delete window.electronAPI;
    
    // Limpiar mocks
    jest.clearAllMocks();
  });

  test('no renderiza nada cuando window.electronAPI no está definido', () => {
    // Verificar que window.electronAPI no está definido
    expect(window.electronAPI).toBeUndefined();
    
    // Renderizar el componente
    const { container } = render(<WindowControls />);
    
    // Verificar que no se renderizó nada
    expect(container.firstChild).toBeNull();
  });

  test('renderiza correctamente los controles de ventana en Electron', () => {
    // Simular que estamos en entorno Electron
    window.electronAPI = {
      minimize: jest.fn(),
      maximize: jest.fn(),
      close: jest.fn(),
      isMaximized: jest.fn().mockResolvedValue(false),
      isFocused: jest.fn().mockResolvedValue(true),
      onMaximizeChange: jest.fn().mockReturnValue(() => {}),
      onFocusChange: jest.fn().mockReturnValue(() => {})
    };
    
    // Renderizar el componente
    render(<WindowControls />);
    
    // Verificar que se han renderizado los tres botones (minimizar, maximizar, cerrar)
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    
    // Verificar que los botones tienen las clases correctas
    expect(buttons[0]).toHaveClass('window-button');
    expect(buttons[0]).toHaveClass('min-button');
    
    expect(buttons[1]).toHaveClass('window-button');
    expect(buttons[1]).toHaveClass('max-button');
    
    expect(buttons[2]).toHaveClass('window-button');
    expect(buttons[2]).toHaveClass('close-button');
  });

  test('llama a las funciones de electronAPI al hacer clic en los botones', async () => {
    // Simular que estamos en entorno Electron
    window.electronAPI = {
      minimize: jest.fn(),
      maximize: jest.fn(),
      close: jest.fn(),
      isMaximized: jest.fn().mockResolvedValue(false),
      isFocused: jest.fn().mockResolvedValue(true),
      onMaximizeChange: jest.fn().mockReturnValue(() => {}),
      onFocusChange: jest.fn().mockReturnValue(() => {})
    };
    
    // Renderizar el componente
    render(<WindowControls />);
    
    // Obtener los botones
    const buttons = screen.getAllByRole('button');
    const minimizeButton = buttons[0];
    const maximizeButton = buttons[1];
    const closeButton = buttons[2];
    
    // Verificar que los botones tienen los atributos aria-label correctos
    expect(minimizeButton).toHaveAttribute('aria-label', 'Minimizar');
    expect(maximizeButton).toHaveAttribute('aria-label', 'Maximizar');
    expect(closeButton).toHaveAttribute('aria-label', 'Cerrar');
    
    // Hacer clic en el botón de minimizar
    fireEvent.click(minimizeButton);
    
    // Verificar que se llamó a la función minimize
    expect(window.electronAPI.minimize).toHaveBeenCalled();
    
    // Hacer clic en el botón de maximizar
    fireEvent.click(maximizeButton);
    
    // Verificar que se llamó a la función maximize
    expect(window.electronAPI.maximize).toHaveBeenCalled();
    
    // Hacer clic en el botón de cerrar
    fireEvent.click(closeButton);
    
    // Verificar que se llamó a la función close
    expect(window.electronAPI.close).toHaveBeenCalled();
  });

  test('cambia entre los iconos de maximizar y restaurar según el estado', async () => {
    // Simular que estamos en entorno Electron
    window.electronAPI = {
      minimize: jest.fn(),
      maximize: jest.fn(),
      close: jest.fn(),
      isMaximized: jest.fn().mockResolvedValue(false),
      isFocused: jest.fn().mockResolvedValue(true),
      onMaximizeChange: jest.fn((callback) => {
        // Simular evento de cambio de maximización
        setTimeout(() => callback(true), 0);
        return () => {};
      }),
      onFocusChange: jest.fn().mockReturnValue(() => {})
    };
    
    // Renderizar el componente
    const { rerender } = render(<WindowControls />);
    
    // Verificar el estado inicial (no maximizado)
    const initialMaximizeButton = screen.getByLabelText('Maximizar');
    expect(initialMaximizeButton).toBeInTheDocument();
    expect(initialMaximizeButton.querySelector('.max-icon')).toBeInTheDocument();
    expect(initialMaximizeButton.querySelector('.restore-icon')).not.toBeInTheDocument();
    
    // Esperar a que se llame al callback de onMaximizeChange
    await waitFor(() => {
      // Volver a renderizar para que se apliquen los cambios de estado
      rerender(<WindowControls />);
      
      // Verificar que ahora muestra el icono de restaurar
      const restoreButton = screen.getByLabelText('Restaurar');
      expect(restoreButton).toBeInTheDocument();
      expect(restoreButton.querySelector('.restore-icon')).toBeInTheDocument();
      expect(restoreButton.querySelector('.max-icon')).not.toBeInTheDocument();
    });
  });

  test('aplica la clase window-focused cuando la ventana está enfocada', async () => {
    // Estado inicial: ventana enfocada
    window.electronAPI = {
      minimize: jest.fn(),
      maximize: jest.fn(),
      close: jest.fn(),
      isMaximized: jest.fn().mockResolvedValue(false),
      isFocused: jest.fn().mockResolvedValue(true),
      onMaximizeChange: jest.fn().mockReturnValue(() => {}),
      onFocusChange: jest.fn((callback) => {
        // No llamamos al callback inicialmente
        return () => {};
      })
    };
    
    // Renderizar el componente
    const { container } = render(<WindowControls />);
    
    // Esperar a que se inicialice el estado
    await waitFor(() => {
      // Verificar que tiene la clase window-focused
      expect(container.querySelector('.window-controls')).toHaveClass('window-focused');
    });
    
    // Cambiar a ventana sin foco
    window.electronAPI.isFocused.mockResolvedValue(false);
    
    // Volver a renderizar
    const { container: container2 } = render(<WindowControls />);
    
    // Esperar a que se inicialice el estado
    await waitFor(() => {
      // Verificar que tiene la clase window-blurred
      expect(container2.querySelector('.window-controls')).toHaveClass('window-blurred');
    });
  });

  test('se suscribe a los eventos de cambio al montar y se desuscribe al desmontar', async () => {
    // Mock para funciones de suscripción
    const mockUnsubscribeMaximize = jest.fn();
    const mockUnsubscribeFocus = jest.fn();
    
    // Simular entorno Electron
    window.electronAPI = {
      minimize: jest.fn(),
      maximize: jest.fn(),
      close: jest.fn(),
      isMaximized: jest.fn().mockResolvedValue(false),
      isFocused: jest.fn().mockResolvedValue(true),
      onMaximizeChange: jest.fn().mockReturnValue(mockUnsubscribeMaximize),
      onFocusChange: jest.fn().mockReturnValue(mockUnsubscribeFocus)
    };
    
    // Renderizar componente
    const { unmount } = render(<WindowControls />);
    
    // Verificar que se suscribió a los eventos
    expect(window.electronAPI.onMaximizeChange).toHaveBeenCalled();
    expect(window.electronAPI.onFocusChange).toHaveBeenCalled();
    
    // Desmontar componente
    unmount();
    
    // Verificar que se desuscribió
    expect(mockUnsubscribeMaximize).toHaveBeenCalled();
    expect(mockUnsubscribeFocus).toHaveBeenCalled();
  });
});