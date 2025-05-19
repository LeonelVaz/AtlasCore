import React, { useState } from 'react';
import PropTypes from 'prop-types';
import SidebarExtensions from '../../plugin-extension/sidebar-extensions';
import NavigationExtensions from '../../plugin-extension/navigation-extensions'; // Importar nuevo componente

/**
 * Componente del panel lateral de navegación
 * @param {Object} props - Propiedades del componente
 */
const Sidebar = ({ children, onPluginNavigate }) => {
  // Estado para controlar si el sidebar está expandido (para vista móvil)
  const [expanded, setExpanded] = useState(true);

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  return (
    <div className={`sidebar ${expanded ? 'expanded' : 'collapsed'}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">Atlas Core</h2>
        <button 
          className="sidebar-toggle" 
          onClick={toggleSidebar}
          aria-label={expanded ? "Colapsar panel" : "Expandir panel"}
        >
          {expanded ? '←' : '→'}
        </button>
      </div>
      <div className="sidebar-content">
        {children}
        
        {/* Punto de extensión para navegación de plugins */}
        <NavigationExtensions onNavigate={onPluginNavigate} />
        
        {/* Punto de extensión para widgets en sidebar */}
        <SidebarExtensions />
      </div>
      <div className="sidebar-footer">
        <span className="version-info">v0.3.0</span>
      </div>
    </div>
  );
};

Sidebar.propTypes = {
  children: PropTypes.node,
  onPluginNavigate: PropTypes.func
};

export default Sidebar;