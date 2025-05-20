/**
 * AdvancedDemosPage.jsx
 * Página para demostraciones avanzadas del plugin
 */

import logger from '../utils/logger';
import { publishDemoEvent } from '../api/eventManager';
import DragDropDemo from '../components/demo/DragDropDemo';
import ChartsDemo from '../components/demo/ChartsDemo';
import CalendarDemo from '../components/demo/CalendarDemo';

/**
 * Componente para la página de demostraciones avanzadas
 */
function AdvancedDemosPage(props) {
  const React = require('react');
  const { useState, useEffect } = React;
  
  // Extraer propiedades
  const { core, plugin, pageId, params } = props;
  
  // Estados locales
  const [activeTab, setActiveTab] = useState(params?.category || 'advanced');
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
    publishDemoEvent(core, plugin, 'advanced-demos', 'viewed', { 
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
    publishDemoEvent(core, plugin, 'advanced-demos', 'tab-changed', { 
      prevTab: activeTab,
      newTab: tab 
    });
  };
  
  // Renderizar página de demostraciones avanzadas
  return React.createElement(
    'div',
    { className: 'pg-advanced-demos-page' },
    [
      // Encabezado
      React.createElement(
        'header',
        { key: 'header', className: 'pg-page-header' },
        [
          React.createElement('h1', { key: 'title' }, 'Demostraciones Avanzadas'),
          React.createElement(
            'p',
            { key: 'desc' },
            'Explora características avanzadas del sistema de plugins como drag and drop, gráficas y más.'
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
              key: 'advanced',
              className: `pg-tab ${activeTab === 'advanced' ? 'pg-tab-active' : ''}`,
              onClick: () => handleTabChange('advanced')
            },
            [
              React.createElement(
                'span',
                { key: 'icon', className: 'material-icons' },
                'stars'
              ),
              React.createElement('span', { key: 'text' }, 'Drag & Drop')
            ]
          ),
          React.createElement(
            'div',
            {
              key: 'charts',
              className: `pg-tab ${activeTab === 'charts' ? 'pg-tab-active' : ''}`,
              onClick: () => handleTabChange('charts')
            },
            [
              React.createElement(
                'span',
                { key: 'icon', className: 'material-icons' },
                'bar_chart'
              ),
              React.createElement('span', { key: 'text' }, 'Gráficas')
            ]
          ),
          React.createElement(
            'div',
            {
              key: 'calendar',
              className: `pg-tab ${activeTab === 'calendar' ? 'pg-tab-active' : ''}`,
              onClick: () => handleTabChange('calendar')
            },
            [
              React.createElement(
                'span',
                { key: 'icon', className: 'material-icons' },
                'calendar_today'
              ),
              React.createElement('span', { key: 'text' }, 'Calendario')
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
            'Estas demostraciones muestran funcionalidades avanzadas que puedes implementar en tus plugins.'
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
    case 'advanced':
      return React.createElement(DragDropDemo, { core, plugin });
      
    case 'charts':
      return React.createElement(ChartsDemo, { core, plugin });
      
    case 'calendar':
      return React.createElement(CalendarDemo, { core, plugin });
      
    default:
      return React.createElement(
        'div',
        { className: 'pg-tab-error' },
        `Pestaña "${activeTab}" no encontrada`
      );
  }
}

export default AdvancedDemosPage;