import React from 'react';
import PropTypes from 'prop-types';
import ExtensionPoint from './extension-point';
import { PLUGIN_CONSTANTS } from '../../core/config/constants';

/**
 * Componente para mostrar extensiones de plugins en la barra lateral
 * Se encarga de renderizar todos los componentes de plugins registrados
 * para la zona 'calendar-sidebar' según su orden.
 */
const SidebarExtensions = ({ className = '' }) => {
  const zoneId = PLUGIN_CONSTANTS.UI_EXTENSION_ZONES.CALENDAR_SIDEBAR;
  
  return (
    <div className={`sidebar-extensions ${className}`}>
      <ExtensionPoint 
        zoneId={zoneId} 
        fallback={null} 
      />
    </div>
  );
};

SidebarExtensions.propTypes = {
  className: PropTypes.string
};

export default SidebarExtensions;