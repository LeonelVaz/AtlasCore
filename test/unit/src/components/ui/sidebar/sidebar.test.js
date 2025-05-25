/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Sidebar from '../../../../../../src/components/ui/sidebar/sidebar';

// Mock de los componentes de extensión
jest.mock('../../../../../../src/components/plugin-extension/navigation-extensions', () => {
  // eslint-disable-next-line react/prop-types
  return function MockNavigationExtensions({ onNavigate }) {
    return (
      <div data-testid="nav-extensions" onClick={() => onNavigate && onNavigate('test-plugin-nav')}>
        Nav Extensions
      </div>
    );
  };
});

jest.mock('../../../../../../src/components/plugin-extension/sidebar-extensions', () => {
  // eslint-disable-next-line react/prop-types
  return function MockSidebarExtensions() {
    return <div data-testid="sidebar-extensions">Sidebar Extensions</div>;
  };
});

describe('Sidebar Component', () => {
  const mockOnPluginNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe renderizar el título, hijos (elemento), footer y llamar a onPluginNavigate', () => {
    render(
      <Sidebar onPluginNavigate={mockOnPluginNavigate}>
        <div data-testid="child-content">Child Content Element</div>
      </Sidebar>
    );
    expect(screen.getByText('Atlas Core')).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toHaveTextContent('Child Content Element');
    expect(screen.getByText('v0.3.0')).toBeInTheDocument();
    expect(screen.getByTestId('nav-extensions')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-extensions')).toBeInTheDocument();

    // Probar interacción con NavigationExtensions
    fireEvent.click(screen.getByTestId('nav-extensions'));
    expect(mockOnPluginNavigate).toHaveBeenCalledWith('test-plugin-nav');
  });

  test('debe renderizar con children como string y con onPluginNavigate', () => {
    render(
      <Sidebar onPluginNavigate={mockOnPluginNavigate}>
        Child Content String
      </Sidebar>
    );
    expect(screen.getByText('Atlas Core')).toBeInTheDocument();
    expect(screen.getByText('Child Content String')).toBeInTheDocument(); // Children como string
  });

  test('debe renderizar correctamente sin la prop children (undefined) pero con onPluginNavigate', () => {
    render(<Sidebar onPluginNavigate={mockOnPluginNavigate} />);
    expect(screen.getByText('Atlas Core')).toBeInTheDocument();
    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
    expect(screen.queryByText('Child Content String')).not.toBeInTheDocument();
    expect(screen.getByTestId('nav-extensions')).toBeInTheDocument();

    // Probar interacción con NavigationExtensions
    fireEvent.click(screen.getByTestId('nav-extensions'));
    expect(mockOnPluginNavigate).toHaveBeenCalledWith('test-plugin-nav');
  });

  test('debe renderizar correctamente con children pero sin la prop onPluginNavigate (undefined)', () => {
    render(
      <Sidebar>
        <div>Child Content For No Nav Prop</div>
      </Sidebar>
    );
    expect(screen.getByText('Atlas Core')).toBeInTheDocument();
    expect(screen.getByText('Child Content For No Nav Prop')).toBeInTheDocument();
    const navExtensionsMockElement = screen.getByTestId('nav-extensions');
    expect(() => fireEvent.click(navExtensionsMockElement)).not.toThrow();
    expect(mockOnPluginNavigate).not.toHaveBeenCalled();
  });

  test('debe renderizar correctamente sin children (undefined) y sin onPluginNavigate (undefined)', () => {
    render(<Sidebar />); // Ambas props opcionales son undefined
    expect(screen.getByText('Atlas Core')).toBeInTheDocument();
    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
    const navExtensionsMockElement = screen.getByTestId('nav-extensions');
    expect(() => fireEvent.click(navExtensionsMockElement)).not.toThrow();
    expect(mockOnPluginNavigate).not.toHaveBeenCalled();
  });

  test('debe renderizar correctamente cuando children es explícitamente null y con onPluginNavigate', () => {
    render(<Sidebar onPluginNavigate={mockOnPluginNavigate} children={null} />);
    expect(screen.getByText('Atlas Core')).toBeInTheDocument();
    expect(screen.queryByTestId('child-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('nav-extensions')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('nav-extensions'));
    expect(mockOnPluginNavigate).toHaveBeenCalledWith('test-plugin-nav');
  });


  test('debe estar expandido por defecto y mostrar los elementos correctos', () => {
    render(<Sidebar>Default Content</Sidebar>); // onPluginNavigate es undefined
    const sidebarDiv = screen.getByText('Atlas Core').closest('.sidebar');
    expect(sidebarDiv).toHaveClass('sidebar', 'expanded');
    expect(sidebarDiv).not.toHaveClass('collapsed');

    const toggleButton = screen.getByRole('button', { name: 'Colapsar panel' });
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveTextContent('←');
  });

  test('debe colapsar y expandir al hacer clic en el botón de toggle, actualizando clases, aria-label y texto del botón', () => {
    render(<Sidebar>Toggle Content</Sidebar>); // onPluginNavigate es undefined
    const sidebarDiv = screen.getByText('Atlas Core').closest('.sidebar');
    let toggleButton = screen.getByRole('button', { name: 'Colapsar panel' });

    // Estado inicial (expandido)
    expect(sidebarDiv).toHaveClass('expanded');
    expect(sidebarDiv).not.toHaveClass('collapsed');
    expect(toggleButton).toHaveTextContent('←');
    expect(toggleButton).toHaveAttribute('aria-label', 'Colapsar panel');

    // Colapsar
    fireEvent.click(toggleButton);
    expect(sidebarDiv).toHaveClass('collapsed');
    expect(sidebarDiv).not.toHaveClass('expanded');
    toggleButton = screen.getByRole('button', { name: 'Expandir panel' }); // El aria-label cambia
    expect(toggleButton).toHaveTextContent('→');
    expect(toggleButton).toHaveAttribute('aria-label', 'Expandir panel');

    // Expandir
    fireEvent.click(toggleButton);
    expect(sidebarDiv).toHaveClass('expanded');
    expect(sidebarDiv).not.toHaveClass('collapsed');
    toggleButton = screen.getByRole('button', { name: 'Colapsar panel' }); // El aria-label cambia de nuevo
    expect(toggleButton).toHaveTextContent('←');
    expect(toggleButton).toHaveAttribute('aria-label', 'Colapsar panel');
  });

  test('debe renderizar NavigationExtensions y SidebarExtensions (ya cubierto pero confirmando)', () => {
    render(<Sidebar onPluginNavigate={mockOnPluginNavigate}>Content</Sidebar>);
    expect(screen.getByTestId('nav-extensions')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-extensions')).toBeInTheDocument();
  });
});