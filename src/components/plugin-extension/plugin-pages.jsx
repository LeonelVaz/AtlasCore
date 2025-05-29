import React from "react";
import PropTypes from "prop-types";
import ExtensionPoint from "./extension-point";
import { PLUGIN_CONSTANTS } from "../../core/config/constants";

/**
 * Componente para renderizar páginas completas de plugins
 */
const PluginPages = ({ currentPluginPage, className = "" }) => {
  const zoneId = PLUGIN_CONSTANTS.UI_EXTENSION_ZONES.PLUGIN_PAGES;

  if (!currentPluginPage) {
    return null;
  }

  return (
    <div className={`plugin-pages ${className}`}>
      <ExtensionPoint
        zoneId={zoneId}
        render={(extensions) => {
          // Filtrar sólo la página actual
          const currentExtension = extensions.find(
            (ext) =>
              ext.pluginId === currentPluginPage.pluginId &&
              ext.props.pageId === currentPluginPage.pageId
          );

          if (!currentExtension) {
            return (
              <div className="plugin-page-not-found">
                <h2>Página no encontrada</h2>
                <p>La página solicitada no está disponible.</p>
              </div>
            );
          }

          const ExtComponent = currentExtension.component;
          return (
            <div
              className="plugin-page-container"
              data-plugin-id={currentExtension.pluginId}
              data-page-id={currentExtension.props.pageId}
            >
              <ExtComponent
                {...currentExtension.props}
                pluginId={currentExtension.pluginId}
                extensionId={currentExtension.id}
              />
            </div>
          );
        }}
        fallback={
          <div className="plugin-page-not-found">
            <h2>Página no encontrada</h2>
            <p>La página solicitada no está disponible.</p>
          </div>
        }
      />
    </div>
  );
};

PluginPages.propTypes = {
  currentPluginPage: PropTypes.shape({
    pluginId: PropTypes.string.isRequired,
    pageId: PropTypes.string.isRequired,
  }),
  className: PropTypes.string,
};

export default PluginPages;
