/**
 * Componente para el ítem de navegación
 */
import React from 'react';

export function NavigationItem(props) {
  const { onNavigate, pluginId } = props;
  
  const handleClick = () => {
    if (onNavigate) {
      onNavigate(pluginId, 'plugin-tester');
    }
  };
  
  return (
    <div className="plugin-tester-nav-item" onClick={handleClick}>
      <span className="material-icons">bug_report</span>
      <span>Plugin Tester</span>
    </div>
  );
}