// src/components/ui/sidebar/SidebarItem.jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Componente para un elemento del panel lateral
 * @param {Object} props - Propiedades del componente
 */
const SidebarItem = ({ 
  icon, 
  label, 
  active = false, // Usando parámetro por defecto de JavaScript
  onClick 
}) => {
  return (
    <div 
      className={`sidebar-item ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {icon && <span className="sidebar-item-icon">{icon}</span>}
      <span className="sidebar-item-label">{label}</span>
    </div>
  );
};

SidebarItem.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.string.isRequired,
  active: PropTypes.bool,
  onClick: PropTypes.func.isRequired
};

export default SidebarItem;