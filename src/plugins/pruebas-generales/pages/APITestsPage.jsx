/**
 * APITestsPage.jsx
 * Página para pruebas de APIs del sistema
 */

import logger from '../utils/logger';
import { publishDemoEvent } from '../api/eventManager';
import StorageDemo from '../components/demo/StorageDemo';
import EventsDemo from '../components/demo/EventsDemo';
import CommunicationDemo from '../components/demo/CommunicationDemo';
import PermissionsDemo from '../components/demo/PermissionsDemo';

/**
 * Componente para la página de pruebas de API
 */
function APITestsPage(props) {
  const React = window.React;
  const { useState, useEffect } = React;
  
  // Extraer propiedades
  const { core, plugin, pageId, params } = props;
  
  // Estados locales
  const [activeTab, setActiveTab] = useState(params?.category || 'storage');
  const [isLoading, setIsLoading] = useState(true);
  
  // Efecto para cargar datos iniciales
  useEffect(() => {
    // Inicializar
    setIsLoading(true);
    
    // Si hay categoría en los parámetros, activarla
    if (params && params.category) {
      setActiveTab(params.category);
    }
    
    // Publicar evento de vista de página
    publishDemoEvent(core, plugin, 'api-tests', 'viewed', { 
      tab: activeTab 
    });
    
    setIsLoading(false);
    
    // Efecto de limpieza
    return () => {
      // Nada específico que limpiar por ahora
    };
  }, [core, plugin, params]);
  
  /**
   * Manejador para cambio de pestaña
   */
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Publicar evento de cambio de pestaña
    publishDemoEvent(core, plugin, 'api-tests', 'tab-changed', { 
      prevTab: activeTab,
      newTab: tab 
    });
  };
  
  // Renderizar página de pruebas de API
  return React.createElement(
    'div',
    { className: 'pg-api-tests-page' },
    [
      // Encabezado
      React.createElement(
        'header',
        { key: 'header', className: 'pg-page-header' },
        [
          React.createElement('h1', { key: 'title' }, 'Pruebas de APIs del Sistema'),
          React.createElement(
            'p',
            { key: 'desc' },
            'Explora las capacidades de almacenamiento, eventos y comunicación del sistema de plugins de Atlas.'
          )
        ]
      ),
      
      // Navegación por pestañas
      React.createElement(
        'div',
        { key: 'tabs', className: 'pg-tabs pg-tabs-large' },
        [
          React.createElement(
            'div',
            {
              key: 'storage',
              className: `pg-tab ${activeTab === 'storage' ? 'pg-tab-active' : ''}`,
              onClick: () => handleTabChange('storage')
            },
            [
              React.createElement(
                'span',
                { key: 'icon', className: 'material-icons' },
                'storage'
              ),
              React.createElement('span', { key: 'text' }, 'Almacenamiento')
            ]
          ),
          React.createElement(
            'div',
            {
              key: 'events',
              className: `pg-tab ${activeTab === 'events' ? 'pg-tab-active' : ''}`,
              onClick: () => handleTabChange('events')
            },
            [
              React.createElement(
                'span',
                { key: 'icon', className: 'material-icons' },
                'event'
              ),
              React.createElement('span', { key: 'text' }, 'Eventos')
            ]
          ),
          React.createElement(
            'div',
            {
              key: 'communication',
              className: `pg-tab ${activeTab === 'communication' ? 'pg-tab-active' : ''}`,
              onClick: () => handleTabChange('communication')
            },
            [
              React.createElement(
                'span',
                { key: 'icon', className: 'material-icons' },
                'share'
              ),
              React.createElement('span', { key: 'text' }, 'Comunicación')
            ]
          ),
          React.createElement(
            'div',
            {
              key: 'permissions',
              className: `pg-tab ${activeTab === 'permissions' ? 'pg-tab-active' : ''}`,
              onClick: () => handleTabChange('permissions')
            },
            [
              React.createElement(
                'span',
                { key: 'icon', className: 'material-icons' },
                'security'
              ),
              React.createElement('span', { key: 'text' }, 'Permisos')
            ]
          )
        ]
      ),
      
      // Contenedor principal
      React.createElement(
        'div',
        { key: 'content', className: 'pg-page-content' },
        isLoading
          ? React.createElement(
              'div',
              { className: 'pg-loading' },
              [
                React.createElement('div', { key: 'spinner', className: 'pg-spinner' }),
                React.createElement('p', { key: 'text' }, 'Cargando...')
              ]
            )
          : renderTabContent(activeTab, core, plugin)
      ),
      
      // Pie de página
      React.createElement(
        'footer',
        { key: 'footer', className: 'pg-page-footer' },
        [
          React.createElement(
            'p',
            { key: 'info' },
            'Estas demostraciones muestran cómo interactuar con las APIs del sistema Atlas desde un plugin.'
          ),
          React.createElement(
            'button',
            { 
              key: 'button',
              className: 'pg-button pg-button-primary',
              onClick: () => props.onNavigate(plugin.id, 'main-page')
            },
            'Volver a la página principal'
          )
        ]
      )
    ]
  );
}

/**
 * Renderiza el contenido según la pestaña activa
 */
function renderTabContent(activeTab, core, plugin) {
  switch(activeTab) {
    case 'storage':
      return React.createElement(StorageDemo, { core, plugin });
      
    case 'events':
      return React.createElement(EventsDemo, { core, plugin });
      
    case 'communication':
      return React.createElement(CommunicationDemo, { core, plugin });
      
    case 'permissions':
      return React.createElement(PermissionsDemo, { core, plugin });
      
    default:
      return React.createElement(
        'div',
        { className: 'pg-tab-error' },
        `Pestaña "${activeTab}" no encontrada`
      );
  }
}

export default APITestsPage;