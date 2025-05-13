// src/components/settings/settings-panel.jsx (actualizado)
import React, { useState } from 'react';
import ThemeConfig from './theme-config';
import TimeScaleConfig from './time-scale-config';
import SidebarItem from '../ui/sidebar/sidebar-item';

// Iconos para las secciones de configuración (usando Material Icons)
const SECTION_ICONS = {
  GENERAL: 'settings',
  APPEARANCE: 'palette',
  CALENDAR: 'calendar_today',
  TIME_SCALE: 'schedule',
  BACKUP: 'backup'
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
    { id: 'calendar', label: 'Calendario', icon: SECTION_ICONS.CALENDAR },
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
      case 'general':
      case 'calendar':
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
    <div className="settings-panel">
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