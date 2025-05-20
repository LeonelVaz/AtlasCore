/**
 * UIExtensionsDemo.jsx
 * Componente para demostrar las extensiones UI disponibles
 */

import logger from '../../utils/logger';
import { publishDemoEvent } from '../../api/eventManager';

/**
 * Componente de demostración de extensiones UI
 */
function UIExtensionsDemo(props) {
  const React = require('react');
  const { useState, useEffect } = React;
  
  // Extraer propiedades
  const { core, plugin } = props;
  
  // Estados locales
  const [extensionZones, setExtensionZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneDetails, setZoneDetails] = useState(null);
  
  // Efecto para cargar zonas de extensión
  useEffect(() => {
    // Obtener todas las zonas de extensión disponibles
    const zones = core.ui.getExtensionZones();
    
    if (zones) {
      // Transformar objeto de zonas a array para mostrar
      const zonesArray = Object.entries(zones).map(([key, value]) => ({
        id: key,
        name: key.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' '),
        description: getZoneDescription(key),
        extensions: []
      }));
      
      setExtensionZones(zonesArray);
      
      // Si hay zonas, seleccionar la primera por defecto
      if (zonesArray.length > 0) {
        setSelectedZone(zonesArray[0].id);
        setZoneDetails(zonesArray[0]);
      }
    }
    
    // Publicar evento de vista
    publishDemoEvent(core, plugin, 'ui-extensions-demo', 'viewed');
    
  }, [core, plugin]);
  
  /**
   * Obtiene una descripción para la zona de extensión
   */
  const getZoneDescription = (zoneId) => {
    const descriptions = {
      'MAIN_NAVIGATION': 'Navegación principal de la aplicación',
      'CALENDAR_SIDEBAR': 'Barra lateral del calendario',
      'CALENDAR_DAY_CELL': 'Celdas de día en la vista de calendario',
      'EVENT_DETAIL_VIEW': 'Vista detallada de eventos',
      'EVENT_FORM': 'Formulario de creación/edición de eventos',
      'SETTINGS_PANEL': 'Panel de configuración',
      'PLUGIN_PAGES': 'Páginas completas del plugin',
      'TOOLBAR': 'Barra de herramientas de la aplicación',
      'DASHBOARD': 'Dashboard de la aplicación'
    };
    
    return descriptions[zoneId] || 'Zona de extensión del sistema';
  };
  
  /**
   * Manejador para seleccionar una zona
   */
  const handleSelectZone = (zoneId) => {
    const zone = extensionZones.find(z => z.id === zoneId);
    setSelectedZone(zoneId);
    setZoneDetails(zone);
    
    // Publicar evento de selección
    publishDemoEvent(core, plugin, 'ui-extensions-demo', 'zone-selected', {
      zoneId
    });
  };
  
  /**
   * Obtener componentes registrados en la zona seleccionada
   */
  const getZoneComponents = () => {
    if (!selectedZone) return [];
    
    try {
      const extensions = core.ui.getExtensionsInZone(selectedZone);
      return extensions || [];
    } catch (error) {
      logger.error(`Error al obtener extensiones para la zona ${selectedZone}:`, error);
      return [];
    }
  };
  
  // Renderizar demostración de extensiones UI
  return React.createElement(
    'div',
    { className: 'pg-ui-extensions-demo' },
    [
      // Información
      React.createElement(
        'div',
        { key: 'info', className: 'pg-demo-info' },
        [
          React.createElement('h2', { key: 'title' }, 'Demostración de Extensiones UI'),
          React.createElement(
            'p',
            { key: 'desc' },
            'Esta demostración muestra las diferentes zonas de extensión disponibles en Atlas donde los plugins pueden registrar componentes.'
          )
        ]
      ),
      
      // Contenido principal
      React.createElement(
        'div',
        { key: 'content', className: 'pg-extensions-container' },
        [
          // Lista de zonas
          React.createElement(
            'div',
            { key: 'zones', className: 'pg-zones-list' },
            [
              React.createElement('h3', { key: 'title' }, 'Zonas de extensión'),
              React.createElement(
                'ul',
                { key: 'list' },
                extensionZones.map(zone => React.createElement(
                  'li',
                  {
                    key: zone.id,
                    className: selectedZone === zone.id ? 'pg-active-zone' : '',
                    onClick: () => handleSelectZone(zone.id)
                  },
                  zone.name
                ))
              )
            ]
          ),
          
          // Detalles de la zona seleccionada
          React.createElement(
            'div',
            { key: 'details', className: 'pg-zone-details' },
            zoneDetails ? [
              React.createElement('h3', { key: 'title' }, zoneDetails.name),
              React.createElement('p', { key: 'desc' }, zoneDetails.description),
              
              // Componentes registrados
              React.createElement(
                'div',
                { key: 'components', className: 'pg-zone-components' },
                [
                  React.createElement('h4', { key: 'title' }, 'Componentes registrados'),
                  React.createElement(
                    'div',
                    { key: 'list', className: 'pg-components-list' },
                    (() => {
                      const components = getZoneComponents();
                      return components.length > 0
                        ? components.map((ext, index) => React.createElement(
                            'div',
                            { key: `ext-${index}`, className: 'pg-component-item' },
                            [
                              React.createElement('div', { key: 'plugin' }, `Plugin: ${ext.pluginId}`),
                              React.createElement('div', { key: 'id' }, `ID: ${ext.id}`),
                              ext.order && React.createElement('div', { key: 'order' }, `Orden: ${ext.order}`)
                            ]
                          ))
                        : React.createElement(
                            'div',
                            { className: 'pg-empty-list' },
                            'No hay componentes registrados en esta zona'
                          );
                    })()
                  )
                ]
              ),
              
              // Código de ejemplo
              React.createElement(
                'div',
                { key: 'example', className: 'pg-code-example' },
                [
                  React.createElement('h4', { key: 'title' }, 'Código de ejemplo'),
                  React.createElement(
                    'pre',
                    { key: 'code', className: 'pg-code-block' },
                    `// Registrar componente en la zona ${zoneDetails.id}
const extensionId = core.ui.registerExtension(
  plugin.id,
  core.ui.getExtensionZones().${zoneDetails.id},
  MiComponente,
  {
    order: 100,
    props: {
      // Propiedades adicionales para el componente
    }
  }
);

// Eliminar extensión
core.ui.removeExtension(plugin.id, extensionId);`
                  )
                ]
              )
            ] : React.createElement(
              'div',
              { className: 'pg-no-zone-selected' },
              'Selecciona una zona de extensión para ver detalles'
            )
          )
        ]
      ),
      
      // Instrucciones
      React.createElement(
        'div',
        { key: 'instructions', className: 'pg-instructions' },
        [
          React.createElement('h3', { key: 'title' }, 'Uso de extensiones UI'),
          React.createElement(
            'p',
            { key: 'desc' },
            'Las extensiones UI permiten a los plugins integrar sus componentes en diferentes partes de la interfaz de Atlas. Cada zona de extensión tiene un propósito específico y puede tener requisitos particulares para los componentes.'
          ),
          React.createElement(
            'ul',
            { key: 'list' },
            [
              React.createElement('li', { key: 'tip1' }, 'Usa un orden adecuado para posicionar tus componentes.'),
              React.createElement('li', { key: 'tip2' }, 'Asegúrate de manejar correctamente el ciclo de vida de tus componentes.'),
              React.createElement('li', { key: 'tip3' }, 'Respeta las dimensiones y estilos de la zona donde se integra tu componente.'),
              React.createElement('li', { key: 'tip4' }, 'No olvides eliminar tus extensiones al desactivar el plugin.')
            ]
          )
        ]
      )
    ]
  );
}

export default UIExtensionsDemo;