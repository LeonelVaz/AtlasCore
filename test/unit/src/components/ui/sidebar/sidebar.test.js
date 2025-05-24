/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Sidebar from '../../../../../../src/components/ui/sidebar/sidebar';

// Mock de los componentes de extensión directamente en jest.mock
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
    // Limpiar los mocks de los componentes si es necesario, 
    // aunque al ser definidos con jest.mock, Jest los resetea parcialmente.
    // Si necesitaras resetear llamadas a las funciones mockeadas de los componentes:
    // require('../../../../../../src/components/plugin-extension/navigation-extensions').mockClear();
    // require('../../../../../../src/components/plugin-extension/sidebar-extensions').mockClear();
  });

  test('debe renderizar el título, hijos y footer', () => {
    render(
      <Sidebar onPluginNavigate={mockOnPluginNavigate}>
        <div data-testid="child-content">Child Content</div>
      </Sidebar>
    );
    expect(screen.getByText('Atlas Core')).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('v0.3.0')).toBeInTheDocument(); 
  });

  test('debe estar expandido por defecto', () => {
    render(<Sidebar>Content</Sidebar>);
    const sidebarDiv = screen.getByText('Atlas Core').closest('.sidebar');
    expect(sidebarDiv).toHaveClass('sidebar expanded');
    expect(screen.getByLabelText('Colapsar panel')).toBeInTheDocument();
  });

  test('debe colapsar y expandir al hacer clic en el botón de toggle', () => {
    render(<Sidebar>Content</Sidebar>);
    const sidebarDiv = screen.getByText('Atlas Core').closest('.sidebar');
    const toggleButtonCollapse = screen.getByLabelText('Colapsar panel');

    // Colapsar
    fireEvent.click(toggleButtonCollapse);
    expect(sidebarDiv).toHaveClass('sidebar collapsed');
    expect(sidebarDiv).not.toHaveClass('expanded');
    const toggleButtonExpand = screen.getByLabelText('Expandir panel');
    expect(toggleButtonExpand).toBeInTheDocument();

    // Expandir
    fireEvent.click(toggleButtonExpand); 
    expect(sidebarDiv).toHaveClass('sidebar expanded');
    expect(sidebarDiv).not.toHaveClass('collapsed');
    expect(screen.getByLabelText('Colapsar panel')).toBeInTheDocument();
  });

  test('debe renderizar NavigationExtensions y SidebarExtensions', () => {
    render(<Sidebar onPluginNavigate={mockOnPluginNavigate}>Content</Sidebar>);
    expect(screen.getByTestId('nav-extensions')).toBeInTheDocument();
    // Para verificar props pasadas a componentes mockeados, necesitas acceder al mock.
    // La forma más fácil es si el mock es una jest.fn() que renderiza algo.
    // Como definimos el componente mock directamente, no podemos usar .toHaveBeenCalledWith
    // directamente sobre mockNavigationExtensions (que ahora es la función del factory).
    // Si quisieras verificar props, necesitarías un espía en el mock o cambiar la estrategia de mock.
    // Por ahora, el test de "debe llamar a onPluginNavigate" cubre la interacción.
    
    expect(screen.getByTestId('sidebar-extensions')).toBeInTheDocument();
  });

  test('debe llamar a onPluginNavigate cuando se simula un clic en NavigationExtensions', () => {
    render(<Sidebar onPluginNavigate={mockOnPluginNavigate}>Content</Sidebar>);
    const navExtensionsMockElement = screen.getByTestId('nav-extensions');
    fireEvent.click(navExtensionsMockElement); 
    expect(mockOnPluginNavigate).toHaveBeenCalledWith('test-plugin-nav');
  });
});