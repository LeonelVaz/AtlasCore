// test/unit/components/plugin-extension/plugin-pages.test.js
import React from 'react';
// Import 'within' and alias it to avoid naming conflicts if necessary
import { render, screen, within as withinRTL } from '@testing-library/react';
import '@testing-library/jest-dom';
import PluginPages from '../../../../../src/components/plugin-extension/plugin-pages';
import { PLUGIN_CONSTANTS } from '../../../../../src/core/config/constants';

// Mock ExtensionPoint
let mockExtensionsProvidedToRender = [];

jest.mock('../../../../../src/components/plugin-extension/extension-point', () => {
  // You might need to require constants inside if the mock factory uses them,
  // but for this specific mock, it doesn't seem to.
  // const { PLUGIN_CONSTANTS: Mocked_PLUGIN_CONSTANTS } = require('../../../../../src/core/config/constants');
  return jest.fn(({ zoneId, render, fallback }) => {
    // Simulate ExtensionPoint calling our render prop
    if (render) {
      return render(mockExtensionsProvidedToRender);
    }
    return fallback || null;
  });
});


const MockPage1Component = ({ pageId, pluginId, extensionId, title }) => (
  <div data-testid={`page-${pluginId}-${pageId}`}>
    <h1>{title}</h1>
    <p>Plugin: {pluginId}, Extension: {extensionId}</p>
  </div>
);

describe('PluginPages Component', () => {
  const zoneId = PLUGIN_CONSTANTS.UI_EXTENSION_ZONES.PLUGIN_PAGES;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExtensionsProvidedToRender = [];
    const ExtensionPointMock = require('../../../../../src/components/plugin-extension/extension-point');
    if (ExtensionPointMock.mockClear) {
        ExtensionPointMock.mockClear();
    }
  });

  test('renders null if currentPluginPage is not provided', () => {
    const { container } = render(<PluginPages />);
    expect(container.firstChild).toBeNull();
  });

  test('renders the correct plugin page if currentPluginPage matches an extension', () => {
    const currentPage = { pluginId: 'pluginA', pageId: 'dashboard' };
    mockExtensionsProvidedToRender = [
      { id: 'extA', pluginId: 'pluginA', component: MockPage1Component, props: { pageId: 'dashboard', title: 'Plugin A Dashboard' } },
      { id: 'extB', pluginId: 'pluginB', component: MockPage1Component, props: { pageId: 'settings', title: 'Plugin B Settings' } },
    ];

    render(<PluginPages currentPluginPage={currentPage} />);
    
    const ExtensionPointMock = require('../../../../../src/components/plugin-extension/extension-point');
    expect(ExtensionPointMock).toHaveBeenCalledWith(
      expect.objectContaining({ zoneId }), // zoneId from the test's scope
      {}
    );

    expect(screen.getByTestId('page-pluginA-dashboard')).toBeInTheDocument();
    expect(screen.getByText('Plugin A Dashboard')).toBeInTheDocument();
    // Use withinRTL for potentially non-unique text within a specific container
    const pageContainer = screen.getByTestId('page-pluginA-dashboard');
    expect(withinRTL(pageContainer).getByText('Plugin: pluginA, Extension: extA')).toBeInTheDocument();
    expect(screen.queryByTestId('page-pluginB-settings')).not.toBeInTheDocument();
  });

  test('renders "Página no encontrada" if currentPluginPage does not match any extension', () => {
    const currentPage = { pluginId: 'pluginC', pageId: 'unknown' };
    mockExtensionsProvidedToRender = [
      { id: 'extA', pluginId: 'pluginA', component: MockPage1Component, props: { pageId: 'dashboard', title: 'Plugin A Dashboard' } },
    ];

    render(<PluginPages currentPluginPage={currentPage} />);

    // PluginPages itself renders this fallback when its render prop doesn't find a match
    expect(screen.getAllByText('Página no encontrada').length).toBeGreaterThan(0);
    expect(screen.getAllByText('La página solicitada no está disponible.').length).toBeGreaterThan(0);
    expect(screen.queryByTestId('page-pluginA-dashboard')).not.toBeInTheDocument();
  });
  
  test('renders "Página no encontrada" if ExtensionPoint provides no extensions', () => {
    const currentPage = { pluginId: 'pluginA', pageId: 'dashboard' };
    mockExtensionsProvidedToRender = []; // No extensions available at all

    render(<PluginPages currentPluginPage={currentPage} />);
    // PluginPages' custom render prop logic will result in this fallback
    expect(screen.getAllByText('Página no encontrada').length).toBeGreaterThan(0);
  });

  test('applies className prop to the root div', () => {
    const currentPage = { pluginId: 'pluginA', pageId: 'dashboard' };
    mockExtensionsProvidedToRender = [
      { id: 'extA', pluginId: 'pluginA', component: MockPage1Component, props: { pageId: 'dashboard', title: 'Plugin A Dashboard' } },
    ];
    const { container } = render(<PluginPages currentPluginPage={currentPage} className="custom-class" />);
    
    const rootDiv = container.querySelector('.plugin-pages');
    expect(rootDiv).toHaveClass('custom-class');
  });

  test('ExtensionPoint receives the correct fallback message', () => {
    // First render of PluginPages. This will put one "Página no encontrada" into the main document
    // if the currentPluginPage doesn't lead to a rendered page via mockExtensionsProvidedToRender.
    // Let's assume for this test, it does find a page or mockExtensionsProvidedToRender is empty,
    // leading to PluginPages' own fallback.
    mockExtensionsProvidedToRender = []; // Ensure PluginPages shows its own fallback
    render(<PluginPages currentPluginPage={{ pluginId: 'p1', pageId: 'pg1' }} />);
    
    const ExtensionPointMock = require('../../../../../src/components/plugin-extension/extension-point');
    const mockCalls = ExtensionPointMock.mock.calls;
    expect(mockCalls.length).toBeGreaterThan(0);
    const lastCallArgs = mockCalls[mockCalls.length - 1][0]; // Get the props passed to ExtensionPoint
    
    // Render the fallback prop passed to ExtensionPoint *in isolation*
    // This creates a new, clean document fragment for querying, separate from the main document.
    const { container: fallbackContainer } = render(<>{lastCallArgs.fallback}</>);
    
    // Use `withinRTL` to scope the queries to only the rendered fallback fragment
    // This ensures we are only looking at the fallback passed to ExtensionPoint,
    // not the one potentially rendered by PluginPages itself in the main document.
    expect(withinRTL(fallbackContainer).getByText('Página no encontrada')).toBeInTheDocument();
    expect(withinRTL(fallbackContainer).getByText('La página solicitada no está disponible.')).toBeInTheDocument();
  });
});