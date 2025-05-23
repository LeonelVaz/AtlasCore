// test/unit/components/plugin-extension/sidebar-extensions.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SidebarExtensions from '../../../../../src/components/plugin-extension/sidebar-extensions';
import { PLUGIN_CONSTANTS } from '../../../../../src/core/config/constants';

// Mock ExtensionPoint - we don't need to control its render prop for this component
// as SidebarExtensions uses the default rendering of ExtensionPoint.
// We just want to check if it's called with correct props.
jest.mock('../../../../../src/components/plugin-extension/extension-point', () => {
  return jest.fn(({ zoneId, fallback, 'data-extension-zone': dataExtensionZone }) => (
    <div data-testid="mock-extension-point" data-zoneid={zoneId} data-fallback={fallback !== null ? "has-fallback" : "no-fallback"}>
      Mocked ExtensionPoint for {zoneId}
    </div>
  ));
});

describe('SidebarExtensions Component', () => {
  const zoneId = PLUGIN_CONSTANTS.UI_EXTENSION_ZONES.CALENDAR_SIDEBAR;

  beforeEach(() => {
    jest.clearAllMocks();
    require('../../../../../src/components/plugin-extension/extension-point').mockClear();
  });

  test('renders ExtensionPoint with correct zoneId and null fallback', () => {
    render(<SidebarExtensions />);
    
    const ExtensionPointMock = require('../../../../../src/components/plugin-extension/extension-point');
    expect(ExtensionPointMock).toHaveBeenCalledWith(
      expect.objectContaining({
        zoneId: zoneId,
        fallback: null,
      }),
      {}
    );

    // Verify the mock was rendered (optional, but good for sanity)
    expect(screen.getByTestId('mock-extension-point')).toBeInTheDocument();
    expect(screen.getByTestId('mock-extension-point')).toHaveTextContent(`Mocked ExtensionPoint for ${zoneId}`);
    expect(screen.getByTestId('mock-extension-point')).toHaveAttribute('data-fallback', 'no-fallback');
  });

  test('applies className prop to the root div', () => {
    const { container } = render(<SidebarExtensions className="custom-sidebar-class" />);
    const rootDiv = container.querySelector('.sidebar-extensions');
    expect(rootDiv).toHaveClass('custom-sidebar-class');
  });
});