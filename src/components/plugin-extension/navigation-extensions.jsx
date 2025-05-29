import React from "react";
import PropTypes from "prop-types";
import ExtensionPoint from "./extension-point";
import { PLUGIN_CONSTANTS } from "../../core/config/constants";

/**
 * Componente para mostrar elementos de navegación de plugins en la barra lateral principal
 * @param {Object} props - Propiedades del componente
 * @param {string} [props.className] - Clases adicionales
 * @param {Function} props.onNavigate - Función para manejar la navegación a páginas de plugin
 * @param {string | null} props.activePluginId - ID del plugin cuya página está actualmente activa
 * @param {string | null} props.activePageId - ID de la página del plugin que está actualmente activa
 * @param {string | null} props.activeSectionId - ID de la sección activa general de la app (para contexto, opcional aquí si activePluginId ya está condicionado)
 */
const NavigationExtensions = ({
  className = "",
  onNavigate,
  activePluginId, // Prop recibida desde Sidebar
  activePageId, // Prop recibida desde Sidebar
  activeSectionId, // Prop recibida, para información contextual si es necesario
}) => {
  const zoneId = PLUGIN_CONSTANTS.UI_EXTENSION_ZONES.MAIN_NAVIGATION;

  return (
    <div className={`navigation-extensions ${className}`}>
      <ExtensionPoint
        zoneId={zoneId}
        render={(extensions) => (
          <>
            {extensions.map((extension) => {
              const ExtComponent = extension.component;
              // Aquí `extension.pluginId` es el ID del plugin que registró esta extensión de navegación.
              // `extension.props.pageId` (si es pasado por el plugin) es el ID de la página que este ítem debe abrir.
              return (
                <div
                  key={extension.id}
                  className="navigation-item" // Mantener esta clase para estilos si es necesario
                  data-plugin-id={extension.pluginId}
                >
                  <ExtComponent
                    {...extension.props} // Props originales pasadas al registrar la extensión (ej. pageIdToNavigate)
                    onNavigate={onNavigate} // Prop de Atlas para ejecutar la navegación
                    pluginId={extension.pluginId} // ID del plugin que registró este ítem
                    extensionId={extension.id} // ID único de la extensión
                    // --- Props Propuestas para el estado activo ---
                    activePagePluginId={activePluginId} // El ID del plugin que está actualmente activo globalmente
                    activePageId={activePageId} // El ID de la página que está actualmente activa globalmente
                    // Opcional: Pasar también activeSectionId si el componente de navegación del plugin lo necesita
                    // activeSectionId={activeSectionId}
                  />
                </div>
              );
            })}
          </>
        )}
        fallback={null} // No mostrar nada si no hay extensiones de navegación
      />
    </div>
  );
};

NavigationExtensions.propTypes = {
  className: PropTypes.string,
  onNavigate: PropTypes.func,
  activePluginId: PropTypes.string,
  activePageId: PropTypes.string,
  activeSectionId: PropTypes.string,
};

export default NavigationExtensions;
