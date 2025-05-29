import React from "react";
import PropTypes from "prop-types";
import ExtensionPoint from "./extension-point";
import { PLUGIN_CONSTANTS } from "../../core/config/constants";

/**
 * Componente para mostrar extensiones de plugins en el panel de configuración
 * Se encarga de renderizar todos los componentes de plugins registrados
 * para la zona 'settings-panel' según su orden.
 */
const SettingsExtensions = ({ className = "" }) => {
  const zoneId = PLUGIN_CONSTANTS.UI_EXTENSION_ZONES.SETTINGS_PANEL;

  // Renderizar componentes con un título
  return (
    <div className={`settings-extensions ${className}`}>
      <h3 className="settings-section-title">Extensiones de Plugins</h3>

      <ExtensionPoint
        zoneId={zoneId}
        fallback={
          <div className="settings-extensions-empty">
            <p>No hay extensiones de configuración disponibles.</p>
            <p className="settings-extensions-note">
              Las extensiones aparecerán aquí cuando instales plugins que añadan
              opciones de configuración.
            </p>
          </div>
        }
      />
    </div>
  );
};

SettingsExtensions.propTypes = {
  className: PropTypes.string,
};

export default SettingsExtensions;
