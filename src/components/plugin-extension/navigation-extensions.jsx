import React from "react";
import PropTypes from "prop-types";
import ExtensionPoint from "./extension-point";
import { PLUGIN_CONSTANTS } from "../../core/config/constants";

/**
 * Componente para mostrar elementos de navegación de plugins en la barra lateral principal
 */
const NavigationExtensions = ({ className = "", onNavigate }) => {
  const zoneId = PLUGIN_CONSTANTS.UI_EXTENSION_ZONES.MAIN_NAVIGATION;

  return (
    <div className={`navigation-extensions ${className}`}>
      <ExtensionPoint
        zoneId={zoneId}
        render={(extensions) => (
          <>
            {extensions.map((extension) => {
              const ExtComponent = extension.component;
              return (
                <div
                  key={extension.id}
                  className="navigation-item"
                  data-plugin-id={extension.pluginId}
                >
                  <ExtComponent
                    {...extension.props}
                    onNavigate={onNavigate}
                    pluginId={extension.pluginId}
                    extensionId={extension.id}
                  />
                </div>
              );
            })}
          </>
        )}
        fallback={null}
      />
    </div>
  );
};

NavigationExtensions.propTypes = {
  className: PropTypes.string,
  onNavigate: PropTypes.func,
};

export default NavigationExtensions;
