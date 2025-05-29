// src/components/ui/sidebar/sidebar.jsx
import React, { useState } from "react";
import PropTypes from "prop-types";
import SidebarExtensions from "../../plugin-extension/sidebar-extensions";
import NavigationExtensions from "../../plugin-extension/navigation-extensions";

/**
 * Componente del panel lateral de navegación
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Ítems de sidebar nativos
 * @param {Function} props.onPluginNavigate - Función para navegar a páginas de plugin
 * @param {string | null} props.activeSectionId - ID de la sección activa (nativo o 'plugin')
 * @param {string | null} props.activePluginId - ID del plugin activo (si la sección es 'plugin')
 * @param {string | null} props.activePageId - ID de la página del plugin activa (si la sección es 'plugin')
 */
const Sidebar = ({
  children,
  onPluginNavigate,
  activeSectionId, // Prop recibida
  activePluginId, // Prop recibida
  activePageId, // Prop recibida
}) => {
  const [expanded, setExpanded] = useState(true);

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  return (
    <div className={`sidebar ${expanded ? "expanded" : "collapsed"}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">Atlas Core</h2>
        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label={expanded ? "Colapsar panel" : "Expandir panel"}
        >
          {expanded ? "←" : "→"}
        </button>
      </div>
      <div className="sidebar-content">
        {children}

        {/* Punto de extensión para navegación de plugins */}
        <NavigationExtensions
          onNavigate={onPluginNavigate}
          activeSectionId={activeSectionId} // Pasar para contexto general si es necesario
          activePluginId={activePluginId} // Pasar el ID del plugin activo
          activePageId={activePageId} // Pasar el ID de la página activa
        />

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
  onPluginNavigate: PropTypes.func,
  activeSectionId: PropTypes.string,
  activePluginId: PropTypes.string,
  activePageId: PropTypes.string,
};

export default Sidebar;
