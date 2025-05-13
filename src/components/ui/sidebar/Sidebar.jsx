import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Componente del panel lateral de navegación
 * @param {Object} props - Propiedades del componente
 */
const Sidebar = ({ children }) => {
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
      </div>
      <div className="sidebar-footer">
        <span className="version-info">v0.3.0</span>
      </div>
    </div>
  );
};

Sidebar.propTypes = {
  children: PropTypes.node,
};

export default Sidebar;