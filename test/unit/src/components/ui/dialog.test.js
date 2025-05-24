/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dialog from '../../../../../src/components/ui/dialog'; // Ajusta la ruta

// Mock del componente Button usado internamente
const mockOnClickButton = jest.fn();
jest.mock('../../../../../src/components/ui/button', () => {
  return jest.fn(({ children, onClick, variant }) => (
    <button onClick={onClick} data-variant={variant}>
      {children}
    </button>
  ));
});


describe('Dialog Component', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('no debe renderizar nada si isOpen es false', () => {
    render(
      <Dialog isOpen={false} onClose={mockOnClose}>
        Dialog Content
      </Dialog>
    );
    expect(screen.queryByTestId('dialog-overlay')).not.toBeInTheDocument();
  });

  test('debe renderizar el diálogo si isOpen es true', () => {
    render(
      <Dialog isOpen={true} onClose={mockOnClose} title="Test Dialog">
        Dialog Content
      </Dialog>
    );
    expect(screen.getByTestId('dialog-overlay')).toBeInTheDocument();
    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    expect(screen.getByText('Dialog Content')).toBeInTheDocument();
  });

  test('debe mostrar el título si se proporciona', () => {
    render(
      <Dialog isOpen={true} onClose={mockOnClose} title="Mi Título">
        Content
      </Dialog>
    );
    expect(screen.getByText('Mi Título')).toBeInTheDocument();
  });

  test('no debe mostrar el header si no se proporciona título', () => {
    render(
      <Dialog isOpen={true} onClose={mockOnClose}>
        Content
      </Dialog>
    );
    expect(screen.queryByRole('heading')).not.toBeInTheDocument(); // Asumiendo que el título es un h3
    expect(screen.queryByLabelText('Cerrar')).not.toBeInTheDocument(); // Botón de cerrar del header
  });

  test('debe llamar a onClose al hacer clic en el botón de cerrar del header', () => {
    render(
      <Dialog isOpen={true} onClose={mockOnClose} title="Test Dialog">
        Content
      </Dialog>
    );
    fireEvent.click(screen.getByLabelText('Cerrar'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('debe llamar a onClose al hacer clic en el botón "Cancelar" del footer', () => {
    render(
      <Dialog isOpen={true} onClose={mockOnClose} cancelText="Cerrar Custom">
        Content
      </Dialog>
    );
    fireEvent.click(screen.getByText('Cerrar Custom'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('debe mostrar y llamar a onConfirm si se proporciona', () => {
    render(
      <Dialog isOpen={true} onClose={mockOnClose} onConfirm={mockOnConfirm} confirmText="Aceptar">
        Content
      </Dialog>
    );
    const confirmButton = screen.getByText('Aceptar');
    expect(confirmButton).toBeInTheDocument();
    fireEvent.click(confirmButton);
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  test('no debe mostrar el botón de confirmar si onConfirm no se proporciona', () => {
    render(
      <Dialog isOpen={true} onClose={mockOnClose}>
        Content
      </Dialog>
    );
    expect(screen.queryByText('Confirmar')).not.toBeInTheDocument(); // Asumiendo texto por defecto
  });

  test('debe llamar a onClose al presionar la tecla Escape', () => {
    render(
      <Dialog isOpen={true} onClose={mockOnClose}>
        Content
      </Dialog>
    );
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('debe llamar a onClose al hacer clic fuera del diálogo', () => {
    render(
      <Dialog isOpen={true} onClose={mockOnClose}>
        Content
      </Dialog>
    );
    // Simular clic en el overlay (fuera del contenido del diálogo)
    fireEvent.mouseDown(screen.getByTestId('dialog-overlay'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('no debe llamar a onClose al hacer clic dentro del diálogo', () => {
    render(
      <Dialog isOpen={true} onClose={mockOnClose}>
        <div data-testid="dialog-inner-content">Inner Content</div>
      </Dialog>
    );
    fireEvent.mouseDown(screen.getByTestId('dialog-inner-content'));
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('debe limpiar los event listeners al desmontar o cuando isOpen cambia a false', () => {
    const addEventSpy = jest.spyOn(document, 'addEventListener');
    const removeEventSpy = jest.spyOn(document, 'removeEventListener');

    const { rerender } = render(
      <Dialog isOpen={true} onClose={mockOnClose}>Content</Dialog>
    );
    expect(addEventSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(addEventSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    addEventSpy.mockClear(); // Limpiar llamadas para la siguiente aserción

    rerender(<Dialog isOpen={false} onClose={mockOnClose}>Content</Dialog>);
    
    expect(removeEventSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(removeEventSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    addEventSpy.mockRestore();
    removeEventSpy.mockRestore();
  });
});