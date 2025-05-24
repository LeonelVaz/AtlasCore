/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Button from '../../../../../src/components/ui/button'; // Ajusta la ruta según tu estructura

describe('Button Component', () => {
  test('debe renderizar con el texto y clases por defecto', () => {
    render(<Button onClick={() => {}}>Click Me</Button>);
    const buttonElement = screen.getByText('Click Me');
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement).toHaveClass('ui-button ui-button-primary ui-button-medium');
  });

  test('debe aplicar la variante correcta', () => {
    render(<Button variant="secondary" onClick={() => {}}>Secondary</Button>);
    expect(screen.getByText('Secondary')).toHaveClass('ui-button-secondary');
  });

  test('debe aplicar el tamaño correcto', () => {
    render(<Button size="large" onClick={() => {}}>Large</Button>);
    expect(screen.getByText('Large')).toHaveClass('ui-button-large');
  });

  test('debe aplicar clases adicionales', () => {
    render(<Button className="extra-class" onClick={() => {}}>With Extra</Button>);
    expect(screen.getByText('With Extra')).toHaveClass('extra-class');
  });

  test('debe estar deshabilitado si la prop disabled es true', () => {
    render(<Button disabled onClick={() => {}}>Disabled</Button>);
    expect(screen.getByText('Disabled')).toBeDisabled();
  });

  test('debe tener la clase active si isActive es true', () => {
    render(<Button isActive onClick={() => {}}>Active</Button>);
    expect(screen.getByText('Active')).toHaveClass('ui-button-active');
  });

  test('debe llamar a onClick cuando se hace clic', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Clickable</Button>);
    fireEvent.click(screen.getByText('Clickable'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('no debe llamar a onClick si está deshabilitado', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick} disabled>Non Clickable</Button>);
    fireEvent.click(screen.getByText('Non Clickable'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  test('debe pasar atributos adicionales al elemento button', () => {
    render(<Button onClick={() => {}} data-testid="custom-button" aria-label="custom label">Test</Button>);
    const buttonElement = screen.getByTestId('custom-button');
    expect(buttonElement).toHaveAttribute('aria-label', 'custom label');
  });
});