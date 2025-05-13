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
  active = false,
  onClick 
}) => {
  // Determinar si el icono es un nombre de Material Icon o un emoji
  const isMaterialIcon = typeof icon === 'string' && !icon.match(/\p{Emoji}/u);
  
  return (
    <div 
      className={`sidebar-item ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {icon && (
        <span className="sidebar-item-icon">
          {isMaterialIcon ? (
            <span className="material-icons">{icon}</span>
          ) : (
            icon
          )}
        </span>
      )}
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