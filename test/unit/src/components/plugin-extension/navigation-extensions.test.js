// test/unit/components/plugin-extension/navigation-extensions.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react'; // Added fireEvent
import '@testing-library/jest-dom';
import NavigationExtensions from '../../../../../src/components/plugin-extension/navigation-extensions';
// PLUGIN_CONSTANTS is imported here for use outside the mock factory
import { PLUGIN_CONSTANTS } from '../../../../../src/core/config/constants';

// Mock ExtensionPoint
let mockNavExtensionsProvided = [];
jest.mock('../../../../../src/components/plugin-extension/extension-point', () => {
  // Require PLUGIN_CONSTANTS *inside* the factory function
  const { PLUGIN_CONSTANTS: Mocked_PLUGIN_CONSTANTS } = require('../../../../../src/core/config/constants');
  return jest.fn(({ zoneId, render, fallback }) => {
    if (render && zoneId === Mocked_PLUGIN_CONSTANTS.UI_EXTENSION_ZONES.MAIN_NAVIGATION) {
      return render(mockNavExtensionsProvided);
    }
    return fallback || null;
  });
});

const MockNavItemComponent = ({ pluginId, extensionId, label, onNavigate, customProp }) => (
  <button data-testid={`nav-${pluginId}-${extensionId}`} onClick={() => onNavigate({ pluginId, pageId: label.toLowerCase() })}>
    {label} - {customProp}
  </button>
);

describe('NavigationExtensions Component', () => {
  // zoneId can now use the imported PLUGIN_CONSTANTS
  const zoneId = PLUGIN_CONSTANTS.UI_EXTENSION_ZONES.MAIN_NAVIGATION;
  const mockOnNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavExtensionsProvided = [];
    // Clear the mock for ExtensionPoint itself if needed, e.g., to reset call counts
    const ExtensionPointMock = require('../../../../../src/components/plugin-extension/extension-point');
    if (ExtensionPointMock.mockClear) { // Check if it's a Jest mock
        ExtensionPointMock.mockClear();
    }
  });

  test('renders ExtensionPoint with correct zoneId and null fallback', () => {
    render(<NavigationExtensions onNavigate={mockOnNavigate} />);
    
    const ExtensionPointMock = require('../../../../../src/components/plugin-extension/extension-point');
    expect(ExtensionPointMock).toHaveBeenCalledWith(
      expect.objectContaining({
        zoneId: zoneId, // This uses the zoneId defined in the test scope
        fallback: null,
      }),
      {} // Second argument for component props if any, usually empty for default mock behavior
    );
  });

  test('renders navigation items provided by ExtensionPoint', () => {
    mockNavExtensionsProvided = [
      { id: 'nav1', pluginId: 'pluginX', component: MockNavItemComponent, props: { label: 'DashboardX', customProp: 'PropX' } },
      { id: 'nav2', pluginId: 'pluginY', component: MockNavItemComponent, props: { label: 'SettingsY', customProp: 'PropY' } },
    ];

    render(<NavigationExtensions onNavigate={mockOnNavigate} />);

    const navItemX = screen.getByTestId('nav-pluginX-nav1');
    expect(navItemX).toHaveTextContent('DashboardX - PropX');
    const navItemY = screen.getByTestId('nav-pluginY-nav2');
    expect(navItemY).toHaveTextContent('SettingsY - PropY');
  });

  test('passes onNavigate prop to each rendered navigation item component and can be called', () => {
    mockNavExtensionsProvided = [
      { id: 'nav1', pluginId: 'pluginX', component: MockNavItemComponent, props: { label: 'TestNav', customProp: 'TestProp' } },
    ];

    render(<NavigationExtensions onNavigate={mockOnNavigate} />);
    
    const navButton = screen.getByTestId('nav-pluginX-nav1');
    fireEvent.click(navButton); // Use fireEvent to simulate click
    expect(mockOnNavigate).toHaveBeenCalledWith({ pluginId: 'pluginX', pageId: 'testnav' });
  });

  test('renders nothing meaningful (empty fragment from render prop) if ExtensionPoint provides no extensions', () => {
    mockNavExtensionsProvided = []; // No extensions
    const { container } = render(<NavigationExtensions onNavigate={mockOnNavigate} />);
    const rootDiv = container.querySelector('.navigation-extensions');
    expect(rootDiv).toBeInTheDocument();
    // The custom render prop returns <></> which results in no direct children for .navigation-extensions
    // if mockNavExtensionsProvided is empty.
    // If the render prop returned null, then rootDiv.firstChild would be null.
    // Since it's <>, children.length is 0.
    expect(rootDiv.children.length).toBe(0);
  });

  test('applies className prop to the root div', () => {
    const { container } = render(<NavigationExtensions className="custom-nav-class" onNavigate={mockOnNavigate} />);
    const rootDiv = container.querySelector('.navigation-extensions');
    expect(rootDiv).toHaveClass('custom-nav-class');
  });
});