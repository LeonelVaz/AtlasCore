/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// --- Mocking UI Components y Componentes Hijos ---
// Rutas hardcodeadas directamente en jest.mock

const mockThemeConfig = jest.fn(() => <div data-testid="mock-theme-config">Theme Config Mock</div>);
const mockTimeScaleConfig = jest.fn(() => <div data-testid="mock-timescale-config">TimeScale Config Mock</div>);
const mockTimeSlotEditor = jest.fn(() => <div data-testid="mock-timeslot-editor">TimeSlot Editor Mock</div>);
const mockCalendarConfig = jest.fn(() => <div data-testid="mock-calendar-config">Calendar Config Mock</div>);
const mockPluginsPanel = jest.fn(() => <div data-testid="mock-plugins-panel">Plugins Panel Mock</div>);
const mockSettingsExtensions = jest.fn(() => <div data-testid="mock-settings-extensions">Settings Extensions Mock</div>);
const mockSecurityPanel = jest.fn(() => <div data-testid="mock-security-panel">Security Panel Mock</div>);
const mockDeveloperPanel = jest.fn(() => <div data-testid="mock-developer-panel">Developer Panel Mock</div>);

jest.mock('../../../../../src/components/settings/theme-config', () => mockThemeConfig);
jest.mock('../../../../../src/components/settings/time-scale-config', () => mockTimeScaleConfig);
jest.mock('../../../../../src/components/settings/time-slot-editor', () => mockTimeSlotEditor);
jest.mock('../../../../../src/components/settings/calendar-config', () => mockCalendarConfig);
jest.mock('../../../../../src/components/settings/plugins-panel', () => mockPluginsPanel);
jest.mock('../../../../../src/components/plugin-extension/settings-extensions', () => mockSettingsExtensions);
jest.mock('../../../../../src/components/settings/security-panel', () => mockSecurityPanel);
jest.mock('../../../../../src/components/settings/developer-panel', () => mockDeveloperPanel);

// Mock del componente SidebarItem
const mockSidebarItem = jest.fn(({ label, active, onClick, icon }) => (
  <div
    data-testid={`sidebar-item-${label.toLowerCase().replace(/\s+/g, '-')}`}
    className={`mock-sidebar-item ${active ? 'active' : ''}`}
    onClick={onClick}
  >
    <span className="material-icons">{icon}</span>
    {label}
  </div>
));
jest.mock('../../../../../src/components/ui/sidebar/sidebar-item', () => mockSidebarItem);


const SettingsPanel = require('../../../../../src/components/settings/settings-panel').default;

describe('SettingsPanel Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe renderizar el panel de configuración con el título y la barra lateral', () => {
    render(<SettingsPanel />);
    expect(screen.getByText('Configuración')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-item-apariencia')).toBeInTheDocument(); 
    expect(screen.getByTestId('sidebar-item-general')).toBeInTheDocument();
  });

  test('debe mostrar la sección "Apariencia" (ThemeConfig) por defecto', () => {
    render(<SettingsPanel />);
    expect(screen.getByTestId('mock-theme-config')).toBeInTheDocument();
    expect(mockThemeConfig).toHaveBeenCalled();
  });

  test('debe cambiar a la sección "General" al hacer clic y mostrar placeholder', async () => {
    render(<SettingsPanel />);
    const generalSectionButton = await screen.findByTestId('sidebar-item-general');
    fireEvent.click(generalSectionButton);

    expect(await screen.findByText((content, node) => node.tagName.toLowerCase() === 'h3' && content === 'Sección general')).toBeInTheDocument();
    expect(screen.getByText('Esta sección será implementada próximamente.')).toBeInTheDocument();
    
    expect(mockThemeConfig).toHaveBeenCalledTimes(1); 
    expect(mockTimeScaleConfig).not.toHaveBeenCalled();
  });

  test('debe cambiar a la sección "Escala de Tiempo" y renderizar TimeScaleConfig', async () => {
    render(<SettingsPanel />);
    const timeScaleSectionButton = await screen.findByTestId('sidebar-item-escala-de-tiempo');
    fireEvent.click(timeScaleSectionButton);

    expect(await screen.findByTestId('mock-timescale-config')).toBeInTheDocument();
    expect(mockTimeScaleConfig).toHaveBeenCalled();
  });

  test('debe cambiar a la sección "Franjas Horarias" y renderizar TimeSlotEditor', async () => {
    render(<SettingsPanel />);
    const timeSlotsSectionButton = await screen.findByTestId('sidebar-item-franjas-horarias');
    fireEvent.click(timeSlotsSectionButton);

    expect(await screen.findByTestId('mock-timeslot-editor')).toBeInTheDocument();
    expect(mockTimeSlotEditor).toHaveBeenCalled();
  });

  test('debe cambiar a la sección "Calendario" y renderizar CalendarConfig', async () => {
    render(<SettingsPanel />);
    const calendarSectionButton = await screen.findByTestId('sidebar-item-calendario');
    fireEvent.click(calendarSectionButton);

    expect(await screen.findByTestId('mock-calendar-config')).toBeInTheDocument();
    expect(mockCalendarConfig).toHaveBeenCalled();
  });

  test('debe cambiar a la sección "Plugins" y renderizar PluginsPanel', async () => {
    render(<SettingsPanel />);
    const pluginsSectionButton = await screen.findByTestId('sidebar-item-plugins');
    fireEvent.click(pluginsSectionButton);

    expect(await screen.findByTestId('mock-plugins-panel')).toBeInTheDocument();
    expect(mockPluginsPanel).toHaveBeenCalled();
  });
  
  test('debe cambiar a la sección "Extensiones" y renderizar SettingsExtensions', async () => {
    render(<SettingsPanel />);
    const extensionsSectionButton = await screen.findByTestId('sidebar-item-extensiones');
    fireEvent.click(extensionsSectionButton);

    expect(await screen.findByTestId('mock-settings-extensions')).toBeInTheDocument();
    expect(mockSettingsExtensions).toHaveBeenCalled();
  });

  test('debe cambiar a la sección "Seguridad" y renderizar SecurityPanel', async () => {
    render(<SettingsPanel />);
    const securitySectionButton = await screen.findByTestId('sidebar-item-seguridad');
    fireEvent.click(securitySectionButton);

    expect(await screen.findByTestId('mock-security-panel')).toBeInTheDocument();
    expect(mockSecurityPanel).toHaveBeenCalled();
  });

  test('debe cambiar a la sección "Desarrolladores" y renderizar DeveloperPanel', async () => {
    render(<SettingsPanel />);
    const devSectionButton = await screen.findByTestId('sidebar-item-desarrolladores');
    fireEvent.click(devSectionButton);

    expect(await screen.findByTestId('mock-developer-panel')).toBeInTheDocument();
    expect(mockDeveloperPanel).toHaveBeenCalled();
  });

  test('debe cambiar a la sección "Respaldo" y mostrar placeholder', async () => {
    render(<SettingsPanel />);
    const backupSectionButton = await screen.findByTestId('sidebar-item-respaldo');
    fireEvent.click(backupSectionButton);
    
    // CORRECCIÓN AQUÍ:
    // Buscar el h3 que contiene el texto "Sección" y "backup"
    // Usar una regex para ser flexible con los espacios entre "Sección" y el id de la sección.
    const headingElement = await screen.findByRole('heading', { 
        level: 3, 
        name: (name, element) => {
            // El 'name' accesible aquí es el contenido de texto accesible del heading.
            // Necesitamos verificar que sea un h3 y que contenga el texto deseado.
            return element.tagName.toLowerCase() === 'h3' && 
                   /Sección\s+backup/i.test(name); // Regex: "Sección" seguido de uno o más espacios, luego "backup", case-insensitive
        }
    });
    expect(headingElement).toBeInTheDocument();

    // También verificar el párrafo, que es más directo
    expect(screen.getByText('Esta sección será implementada próximamente.')).toBeInTheDocument();
  });

  test('debe marcar la sección activa en la barra lateral', async () => {
    render(<SettingsPanel />);
    await screen.findByTestId('mock-theme-config'); 

    expect(screen.getByTestId('sidebar-item-apariencia')).toHaveClass('active');
    expect(screen.getByTestId('sidebar-item-general')).not.toHaveClass('active');

    const generalSectionButton = screen.getByTestId('sidebar-item-general');
    fireEvent.click(generalSectionButton);

    await waitFor(() => {
        expect(screen.getByTestId('sidebar-item-general')).toHaveClass('active');
    });
    expect(screen.getByTestId('sidebar-item-apariencia')).not.toHaveClass('active');
  });
});