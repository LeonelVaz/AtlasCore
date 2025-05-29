import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import eventBus from "../../core/bus/event-bus";
import uiExtensionManager from "../../core/plugins/ui-extension-manager";

/**
 * Componente para renderizar extensiones de plugins en un punto específico
 * Este componente actúa como un contenedor para componentes de plugins
 * y se encarga de su ciclo de vida y renderizado.
 */
const ExtensionPoint = ({ zoneId, render, fallback = null }) => {
  const [extensions, setExtensions] = useState([]);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  // Cargar extensiones iniciales y suscribirse a cambios
  useEffect(() => {
    if (!zoneId) return;

    // Cargar extensiones iniciales
    const initialExtensions = uiExtensionManager.getExtensionsForZone(zoneId);
    setExtensions(initialExtensions);

    // Suscribirse a cambios en el punto de extensión
    const unsubscribe = eventBus.subscribe(
      `pluginSystem.extension.${zoneId}`,
      (data) => {
        if (data && Array.isArray(data.extensions)) {
          setExtensions(data.extensions);

          // Resetear error si había uno previo y ahora hay nuevas extensiones
          if (hasError && data.extensions.length > 0) {
            setHasError(false);
            setError(null);
          }
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [zoneId, hasError]);

  // No renderizar nada si no hay zona definida
  if (!zoneId) return null;

  try {
    // Si hay un renderizador personalizado, usarlo
    if (typeof render === "function") {
      return render(extensions);
    }

    // Si no hay extensiones y hay fallback, mostrar fallback
    if (extensions.length === 0 && fallback !== null) {
      return fallback;
    }

    // Si hay un error previo, mostrar mensaje de error
    if (hasError) {
      return (
        <div className="plugin-extension-error">
          <div className="plugin-extension-error-title">Error en extensión</div>
          <div className="plugin-extension-error-message">
            {error
              ? error.message
              : "Error desconocido al renderizar extensión"}
          </div>
        </div>
      );
    }

    // Renderizar componentes en contenedor estándar
    return (
      <div className="plugin-extension-container" data-extension-zone={zoneId}>
        {extensions.map((extension) => {
          try {
            const ExtComponent = extension.component;

            // Renderizar cada componente con sus props y props adicionales
            return (
              <div
                key={extension.id}
                className="plugin-extension-item"
                data-plugin-id={extension.pluginId}
              >
                <ExtComponent
                  {...extension.props}
                  pluginId={extension.pluginId}
                  extensionId={extension.id}
                />
              </div>
            );
          } catch (componentError) {
            console.error(
              `Error al renderizar componente de plugin ${extension.pluginId}:`,
              componentError
            );

            // Renderizar error para este componente específico
            return (
              <div
                key={extension.id}
                className="plugin-extension-item plugin-extension-error"
                data-plugin-id={extension.pluginId}
              >
                <div className="plugin-extension-error-title">
                  Error en extensión de plugin {extension.pluginId}
                </div>
                <div className="plugin-extension-error-message">
                  {componentError.message || "Error desconocido"}
                </div>
              </div>
            );
          }
        })}
      </div>
    );
  } catch (renderError) {
    console.error(
      `Error al renderizar punto de extensión ${zoneId}:`,
      renderError
    );

    // Marcar que hay un error para futuras renderizaciones
    setHasError(true);
    setError(renderError);

    // Renderizar fallback en caso de error general
    return (
      <div className="plugin-extension-error">
        <div className="plugin-extension-error-title">
          Error en punto de extensión
        </div>
        <div className="plugin-extension-error-message">
          {renderError.message || "Error desconocido al renderizar extensiones"}
        </div>
      </div>
    );
  }
};

ExtensionPoint.propTypes = {
  zoneId: PropTypes.string.isRequired,
  render: PropTypes.func,
  fallback: PropTypes.node,
};

export default ExtensionPoint;
