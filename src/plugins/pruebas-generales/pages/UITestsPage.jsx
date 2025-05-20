/**
 * UITestsPage.jsx
 * Página para pruebas de interfaz de usuario
 */

import logger from '../utils/logger';
import { publishDemoEvent } from '../api/eventManager';
import ThemesDemo from '../components/demo/ThemesDemo';
import FormsDemo from '../components/demo/FormsDemo';
import AnimationsDemo from '../components/demo/AnimationsDemo';
import UIExtensionsDemo from '../components/demo/UIExtensionsDemo';

/**
 * Componente para la página de pruebas de UI
 */
function UITestsPage(props) {
  const React = window.React;
  const { useState, useEffect } = React;
  
  // Extraer propiedades
  const { core, plugin, pageId, params } = props;
  
  // Estados locales
  const [activeTab, setActiveTab] = useState(params?.category || 'ui');
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
    publishDemoEvent(core, plugin, 'ui-tests', 'viewed', { 
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
    publishDemoEvent(core, plugin, 'ui-tests', 'tab-changed', { 
      prevTab: activeTab,
      newTab: tab 
    });
  };
  
  // Renderizar página de pruebas de UI
  return React.createElement(
    'div',
    { className: 'pg-ui-tests-page' },
    [
      // Encabezado
      React.createElement(
        'header',
        { key: 'header', className: 'pg-page-header' },
        [
          React.createElement('h1', { key: 'title' }, 'Pruebas de Interfaz de Usuario'),
          React.createElement(
            'p',
            { key: 'desc' },
            'Explora las capacidades de interfaz de usuario del sistema de plugins de Atlas.'
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
              key: 'ui',
              className: `pg-tab ${activeTab === 'ui' ? 'pg-tab-active' : ''}`,
              onClick: () => handleTabChange('ui')
            },
            [
              React.createElement(
                'span',
                { key: 'icon', className: 'material-icons' },
                'dashboard'
              ),
              React.createElement('span', { key: 'text' }, 'Extensiones UI')
            ]
          ),
          React.createElement(
            'div',
            {
              key: 'themes',
              className: `pg-tab ${activeTab === 'themes' ? 'pg-tab-active' : ''}`,
              onClick: () => handleTabChange('themes')
            },
            [
              React.createElement(
                'span',
                { key: 'icon', className: 'material-icons' },
                'palette'
              ),
              React.createElement('span', { key: 'text' }, 'Temas')
            ]
          ),
          React.createElement(
            'div',
            {
              key: 'forms',
              className: `pg-tab ${activeTab === 'forms' ? 'pg-tab-active' : ''}`,
              onClick: () => handleTabChange('forms')
            },
            [
              React.createElement(
                'span',
                { key: 'icon', className: 'material-icons' },
                'text_fields'
              ),
              React.createElement('span', { key: 'text' }, 'Formularios')
            ]
          ),
          React.createElement(
            'div',
            {
              key: 'animations',
              className: `pg-tab ${activeTab === 'animations' ? 'pg-tab-active' : ''}`,
              onClick: () => handleTabChange('animations')
            },
            [
              React.createElement(
                'span',
                { key: 'icon', className: 'material-icons' },
                'animation'
              ),
              React.createElement('span', { key: 'text' }, 'Animaciones')
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
            'Estas demostraciones muestran las diferentes formas de extender la interfaz de usuario de Atlas con plugins.'
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
    case 'ui':
      return React.createElement(UIExtensionsDemo, { core, plugin });
      
    case 'themes':
      return React.createElement(ThemesDemo, { core, plugin });
      
    case 'forms':
      return React.createElement(FormsDemo, { core, plugin });
      
    case 'animations':
      return React.createElement(AnimationsDemo, { core, plugin });
      
    default:
      return React.createElement(
        'div',
        { className: 'pg-tab-error' },
        `Pestaña "${activeTab}" no encontrada`
      );
  }
}

export default UITestsPage;