// test/unit/11-ui-components.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Importar los componentes a probar
import Button from '../../src/components/ui/button';
import Dialog from '../../src/components/ui/dialog';

describe('11. Componentes UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  // Tests para el componente Button
  describe('11.1 Componente Button', () => {
    test('11.1.1 El componente Button renderiza correctamente con diferentes variantes', () => {
      // Renderizar el botón con diferentes variantes
      const { rerender } = render(
        <Button onClick={jest.fn()}>Botón por defecto</Button>
      );
      
      // Verificar botón primario (default)
      const defaultButton = screen.getByText('Botón por defecto');
      expect(defaultButton).toBeInTheDocument();
      expect(defaultButton).toHaveClass('ui-button');
      expect(defaultButton).toHaveClass('ui-button-primary');
      
      // Renderizar botón secundario
      rerender(
        <Button variant="secondary" onClick={jest.fn()}>Botón secundario</Button>
      );
      
      const secondaryButton = screen.getByText('Botón secundario');
      expect(secondaryButton).toBeInTheDocument();
      expect(secondaryButton).toHaveClass('ui-button');
      expect(secondaryButton).toHaveClass('ui-button-secondary');
      
      // Renderizar botón peligro
      rerender(
        <Button variant="danger" onClick={jest.fn()}>Botón peligro</Button>
      );
      
      const dangerButton = screen.getByText('Botón peligro');
      expect(dangerButton).toBeInTheDocument();
      expect(dangerButton).toHaveClass('ui-button');
      expect(dangerButton).toHaveClass('ui-button-danger');
      
      // Renderizar botón texto
      rerender(
        <Button variant="text" onClick={jest.fn()}>Botón texto</Button>
      );
      
      const textButton = screen.getByText('Botón texto');
      expect(textButton).toBeInTheDocument();
      expect(textButton).toHaveClass('ui-button');
      expect(textButton).toHaveClass('ui-button-text');
    });

    test('11.1.2 El componente Button responde a diferentes tamaños', () => {
      // Renderizar el botón con diferentes tamaños
      const { rerender } = render(
        <Button size="small" onClick={jest.fn()}>Botón pequeño</Button>
      );
      
      // Verificar botón pequeño
      const smallButton = screen.getByText('Botón pequeño');
      expect(smallButton).toBeInTheDocument();
      expect(smallButton).toHaveClass('ui-button-small');
      
      // Renderizar botón mediano
      rerender(
        <Button size="medium" onClick={jest.fn()}>Botón mediano</Button>
      );
      
      const mediumButton = screen.getByText('Botón mediano');
      expect(mediumButton).toBeInTheDocument();
      expect(mediumButton).toHaveClass('ui-button-medium');
      
      // Renderizar botón grande
      rerender(
        <Button size="large" onClick={jest.fn()}>Botón grande</Button>
      );
      
      const largeButton = screen.getByText('Botón grande');
      expect(largeButton).toBeInTheDocument();
      expect(largeButton).toHaveClass('ui-button-large');
    });

    test('11.1.3 El componente Button maneja correctamente el estado deshabilitado', () => {
      // Renderizar un botón deshabilitado
      const mockOnClick = jest.fn();
      render(
        <Button disabled onClick={mockOnClick}>Botón deshabilitado</Button>
      );
      
      // Verificar que está deshabilitado
      const disabledButton = screen.getByText('Botón deshabilitado');
      expect(disabledButton).toBeDisabled();
      
      // Intentar hacer clic en el botón deshabilitado
      fireEvent.click(disabledButton);
      
      // Verificar que no se llamó al callback
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    test('11.1.4 El componente Button llama al callback onClick cuando se hace clic', () => {
      // Renderizar un botón con callback
      const mockOnClick = jest.fn();
      render(
        <Button onClick={mockOnClick}>Botón con callback</Button>
      );
      
      // Hacer clic en el botón
      const buttonWithCallback = screen.getByText('Botón con callback');
      fireEvent.click(buttonWithCallback);
      
      // Verificar que se llamó al callback
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    test('11.1.5 El componente Button maneja correctamente el estado activo', () => {
      // Renderizar un botón activo (para botones toggle)
      render(
        <Button isActive onClick={jest.fn()}>Botón activo</Button>
      );
      
      // Verificar que tiene la clase de activo
      const activeButton = screen.getByText('Botón activo');
      expect(activeButton).toHaveClass('ui-button-active');
    });
  });

  // Tests para el componente Dialog
  describe('11.2 Componente Dialog', () => {
    test('11.2.1 El componente Dialog se abre y cierra correctamente', async () => {
      // Mock para la función de cierre
      const mockOnClose = jest.fn();
      
      // Estado para controlar si el diálogo está abierto
      let isOpen = true;
      
      // Renderizar diálogo cerrado
      const { rerender } = render(
        <Dialog isOpen={isOpen} onClose={mockOnClose} title="Diálogo de prueba">
          Contenido del diálogo
        </Dialog>
      );
      
      // Verificar que el diálogo está abierto
      expect(screen.getByText('Diálogo de prueba')).toBeInTheDocument();
      expect(screen.getByText('Contenido del diálogo')).toBeInTheDocument();
      
      // Simular cierre del diálogo
      isOpen = false;
      rerender(
        <Dialog isOpen={isOpen} onClose={mockOnClose} title="Diálogo de prueba">
          Contenido del diálogo
        </Dialog>
      );
      
      // Verificar que el diálogo está cerrado (no se renderiza)
      expect(screen.queryByText('Diálogo de prueba')).not.toBeInTheDocument();
      expect(screen.queryByText('Contenido del diálogo')).not.toBeInTheDocument();
    });

    test('11.2.2 El Dialog se cierra al hacer clic en el botón de cerrar', () => {
      // Mock para la función de cierre
      const mockOnClose = jest.fn();
      
      // Renderizar diálogo
      render(
        <Dialog isOpen={true} onClose={mockOnClose} title="Diálogo con botón cerrar">
          Contenido del diálogo
        </Dialog>
      );
      
      // Verificar que el diálogo está abierto
      expect(screen.getByText('Diálogo con botón cerrar')).toBeInTheDocument();
      
      // Encontrar y hacer clic en el botón de cerrar
      const closeButton = document.querySelector('.ui-dialog-close');
      expect(closeButton).toBeInTheDocument();
      fireEvent.click(closeButton);
      
      // Verificar que se llamó a la función onClose
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('11.2.3 El Dialog se cierra al hacer clic fuera o presionar Escape', () => {
      // Mock para la función de cierre
      const mockOnClose = jest.fn();
      
      // Renderizar diálogo
      render(
        <Dialog isOpen={true} onClose={mockOnClose} title="Diálogo con cierre externo">
          Contenido del diálogo
        </Dialog>
      );
      
      // 1. Probar cierre al hacer clic fuera
      // Hacer clic en el overlay (fuera del diálogo)
      const overlay = document.querySelector('.ui-dialog-overlay');
      expect(overlay).toBeInTheDocument();
      
      // Simular clic fuera del diálogo pero dentro del overlay
      const dialogElement = document.querySelector('.ui-dialog');
      const rect = dialogElement.getBoundingClientRect();
      
      // Clic en una posición fuera del diálogo
      const outsideClick = new MouseEvent('mousedown', {
        bubbles: true,
        cancelable: true,
        clientX: rect.right + 10,
        clientY: rect.bottom + 10
      });
      
      fireEvent(document, outsideClick);
      
      // Verificar que se llamó a onClose
      expect(mockOnClose).toHaveBeenCalledTimes(1);
      
      // Resetear el mock
      mockOnClose.mockReset();
      
      // 2. Probar cierre al presionar Escape
      const escapeKeyDown = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: 'Escape'
      });
      
      fireEvent(document, escapeKeyDown);
      
      // Verificar que se llamó a onClose nuevamente
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('11.2.4 El Dialog muestra correctamente el título y contenido', () => {
      // Renderizar diálogo con diferentes contenidos
      const { rerender } = render(
        <Dialog isOpen={true} onClose={jest.fn()} title="Título de prueba">
          <p>Párrafo de prueba</p>
          <button>Botón en contenido</button>
        </Dialog>
      );
      
      // Verificar título
      expect(screen.getByText('Título de prueba')).toBeInTheDocument();
      
      // Verificar contenido
      expect(screen.getByText('Párrafo de prueba')).toBeInTheDocument();
      expect(screen.getByText('Botón en contenido')).toBeInTheDocument();
      
      // Renderizar sin título
      rerender(
        <Dialog isOpen={true} onClose={jest.fn()}>
          Contenido sin título
        </Dialog>
      );
      
      // Verificar que no hay título pero sí contenido
      expect(screen.queryByText('Título de prueba')).not.toBeInTheDocument();
      expect(screen.getByText('Contenido sin título')).toBeInTheDocument();
    });

    test('11.2.5 Los botones del Dialog funcionan correctamente', () => {
      // Mocks para las funciones de los botones
      const mockOnClose = jest.fn();
      const mockOnConfirm = jest.fn();
      
      // Renderizar diálogo con botones de confirmar y cancelar
      render(
        <Dialog 
          isOpen={true} 
          onClose={mockOnClose} 
          onConfirm={mockOnConfirm}
          confirmText="Aceptar"
          cancelText="Cancelar"
          title="Diálogo con botones"
        >
          Contenido del diálogo
        </Dialog>
      );
      
      // Verificar que existen los botones
      expect(screen.getByText('Aceptar')).toBeInTheDocument();
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
      
      // Hacer clic en el botón de confirmar
      fireEvent.click(screen.getByText('Aceptar'));
      
      // Verificar que se llamó a la función onConfirm
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      
      // Hacer clic en el botón de cancelar
      fireEvent.click(screen.getByText('Cancelar'));
      
      // Verificar que se llamó a la función onClose
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('11.2.6 El Dialog muestra botones con textos personalizados', () => {
      // Renderizar diálogo con textos personalizados para los botones
      render(
        <Dialog 
          isOpen={true} 
          onClose={jest.fn()} 
          onConfirm={jest.fn()}
          confirmText="Guardar cambios"
          cancelText="Descartar"
          title="Diálogo con textos personalizados"
        >
          Contenido del diálogo
        </Dialog>
      );
      
      // Verificar textos personalizados
      expect(screen.getByText('Guardar cambios')).toBeInTheDocument();
      expect(screen.getByText('Descartar')).toBeInTheDocument();
    });

    test('11.2.7 El Dialog no muestra el botón de confirmar si no se proporciona onConfirm', () => {
      // Renderizar diálogo sin función onConfirm
      render(
        <Dialog 
          isOpen={true} 
          onClose={jest.fn()}
          title="Diálogo sin confirmación"
        >
          Contenido del diálogo
        </Dialog>
      );
      
      // Verificar que no existe el botón de confirmar pero sí el de cancelar
      expect(screen.queryByText('Confirmar')).not.toBeInTheDocument();
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });
  });
});