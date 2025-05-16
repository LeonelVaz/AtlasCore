import React, { useState } from 'react';
import ThemeConfig from './theme-config';
import TimeScaleConfig from './time-scale-config';
import TimeSlotEditor from './time-slot-editor';
import CalendarConfig from './calendar-config';
import PluginsPanel from './plugins-panel';
import SidebarItem from '../ui/sidebar/sidebar-item';
import SettingsExtensions from '../plugin-extension/settings-extensions';

// Iconos para las secciones de configuración (usando Material Icons)
const SECTION_ICONS = {
  GENERAL: 'settings',
  APPEARANCE: 'palette',
  CALENDAR: 'calendar_today',
  TIME_SCALE: 'schedule',
  TIME_SLOTS: 'horizontal_split',
  BACKUP: 'backup',
  PLUGINS: 'extension',
  EXTENSIONS: 'extension_plus' // Icono para sección de extensiones
};

/**
 * Componente para el panel de configuración
 */
const SettingsPanel = () => {
  // Estado para la sección activa
  const [activeSection, setActiveSection] = useState('appearance');
  
  // Definir las secciones de configuración
  const sections = [
    { id: 'general', label: 'General', icon: SECTION_ICONS.GENERAL },
    { id: 'appearance', label: 'Apariencia', icon: SECTION_ICONS.APPEARANCE },
    { id: 'time_scale', label: 'Escala de Tiempo', icon: SECTION_ICONS.TIME_SCALE },
    { id: 'time_slots', label: 'Franjas Horarias', icon: SECTION_ICONS.TIME_SLOTS },
    { id: 'calendar', label: 'Calendario', icon: SECTION_ICONS.CALENDAR },
    { id: 'plugins', label: 'Plugins', icon: SECTION_ICONS.PLUGINS },
    { id: 'extensions', label: 'Extensiones', icon: SECTION_ICONS.EXTENSIONS },
    { id: 'backup', label: 'Respaldo', icon: SECTION_ICONS.BACKUP }
  ];
  
  // Función para cambiar de sección
  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
  };
  
  // Renderizar la sección activa
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'appearance':
        return <ThemeConfig />;
      case 'time_scale':
        return <TimeScaleConfig />;
      case 'time_slots':
        return <TimeSlotEditor />;
      case 'calendar':
        return <CalendarConfig />;
      case 'plugins':
        return <PluginsPanel />;
      case 'extensions':
        return <SettingsExtensions />;
      case 'general':
      case 'backup':
        return (
          <div className="settings-placeholder">
            <h3>Sección {activeSection}</h3>
            <p>Esta sección será implementada próximamente.</p>
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="settings-panel" key="settings-panel-main">
      <div className="settings-sidebar">
        <h2 className="settings-title">Configuración</h2>
        <div className="settings-sections">
          {sections.map(section => (
            <SidebarItem 
              key={section.id}
              icon={section.icon}
              label={section.label}
              active={activeSection === section.id}
              onClick={() => handleSectionChange(section.id)}
            />
          ))}
        </div>
      </div>
      <div className="settings-content">
        {renderActiveSection()}
      </div>
    </div>
  );
};

export default SettingsPanel;