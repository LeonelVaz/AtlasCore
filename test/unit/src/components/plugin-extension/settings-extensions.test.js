// test/unit/components/plugin-extension/settings-extensions.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SettingsExtensions from '../../../../../src/components/plugin-extension/settings-extensions';
import { PLUGIN_CONSTANTS } from '../../../../../src/core/config/constants';

// Mock ExtensionPoint
let mockFallbackProp;
jest.mock('../../../../../src/components/plugin-extension/extension-point', () => {
  return jest.fn(({ zoneId, fallback }) => {
    mockFallbackProp = fallback; // Capture the fallback to test its content
    return (
      <div data-testid="mock-extension-point" data-zoneid={zoneId}>
        Mocked ExtensionPoint for {zoneId}
        {/* Render fallback if it exists, to test its structure if needed */}
        {/* For this specific test, we only need to check if the correct fallback was passed */}
      </div>
    );
  });
});

describe('SettingsExtensions Component', () => {
  const zoneId = PLUGIN_CONSTANTS.UI_EXTENSION_ZONES.SETTINGS_PANEL;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFallbackProp = undefined;
    require('../../../../../src/components/plugin-extension/extension-point').mockClear();
  });

  test('renders a title and ExtensionPoint with correct zoneId', () => {
    render(<SettingsExtensions />);
    
    expect(screen.getByText('Extensiones de Plugins')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Extensiones de Plugins');

    const ExtensionPointMock = require('../../../../../src/components/plugin-extension/extension-point');
    expect(ExtensionPointMock).toHaveBeenCalledWith(
      expect.objectContaining({
        zoneId: zoneId,
        // fallback will be checked separately
      }),
      {}
    );
    expect(screen.getByTestId('mock-extension-point')).toBeInTheDocument();
    expect(screen.getByTestId('mock-extension-point')).toHaveTextContent(`Mocked ExtensionPoint for ${zoneId}`);
  });

  test('passes the correct fallback content to ExtensionPoint', () => {
    render(<SettingsExtensions />);
    
    expect(mockFallbackProp).toBeDefined();
    // Render the captured fallback prop to inspect its content
    const { getByText } = render(<>{mockFallbackProp}</>);
    expect(getByText('No hay extensiones de configuración disponibles.')).toBeInTheDocument();
    expect(getByText('Las extensiones aparecerán aquí cuando instales plugins que añadan opciones de configuración.')).toBeInTheDocument();
    expect(document.querySelector('.settings-extensions-empty')).toBeInTheDocument();
    expect(document.querySelector('.settings-extensions-note')).toBeInTheDocument();

  });

  test('applies className prop to the root div', () => {
    const { container } = render(<SettingsExtensions className="custom-settings-class" />);
    const rootDiv = container.querySelector('.settings-extensions');
    expect(rootDiv).toHaveClass('custom-settings-class');
  });
});