/**
 * MainPage.jsx
 * Página principal del plugin, donde se muestran todas las demostraciones
 */

import constants from '../constants';
import { publishDemoEvent } from '../api/eventManager';
import logger from '../utils/logger';

/**
 * Componente para la página principal del plugin
 */
function MainPage(props) {
  const React = require('react');
  const { useState, useEffect, useMemo } = React;
  
  // Extraer propiedades
  const { core, plugin, pageId } = props;
  
  // Estados locales
  const [activeCategory, setActiveCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [counterValue, setCounterValue] = useState(0);
  const [eventLog, setEventLog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Memoizar categorías de demostración
  const demoCategories = useMemo(() => {
    return constants.DEMO_CATEGORIES;
  }, []);
  
  // Efecto para cargar datos iniciales
  useEffect(() => {
    setIsLoading(true);
    
    // Obtener datos del plugin
    if (plugin && plugin._data) {
      setCounterValue(plugin._data.demoData.counter);
      setEventLog(plugin._data.demoData.eventLog || []);
      setCategories(demoCategories);
    }
    
    setIsLoading(false);
    
    // Suscribirse a actualizaciones del contador
    const unsubCounter = core.events.subscribe(
      plugin.id,
      constants.CUSTOM_EVENTS.COUNTER_UPDATED,
      (data) => {
        setCounterValue(data.value);
      }
    );
    
    // Suscribirse a entradas de log
    const unsubLog = core.events.subscribe(
      plugin.id,
      constants.CUSTOM_EVENTS.LOG_ENTRY,
      (data) => {
        setEventLog(prev => {
          const newLog = [...prev, {
            time: Date.now(),
            ...data
          }];
          
          // Limitar a los últimos 50 eventos
          if (newLog.length > 50) {
            return newLog.slice(-50);
          }
          
          return newLog;
        });
      }
    );
    
    // Publicar evento de inicio de página
    publishDemoEvent(core, plugin, 'main-page', 'viewed');
    
    // Limpiar suscripciones al desmontar
    return () => {
      if (unsubCounter) unsubCounter();
      if (unsubLog) unsubLog();
    };
  }, [core, plugin, demoCategories]);
  
  // Manejador para incrementar contador
  const handleIncrementCounter = async () => {
    try {
      await plugin.publicAPI.incrementCounter();
    } catch (error) {
      logger.error('Error al incrementar contador:', error);
    }
  };
  
  // Manejador para seleccionar categoría
  const handleCategoryClick = (categoryId) => {
    if (activeCategory === categoryId) {
      setActiveCategory(null);
    } else {
      setActiveCategory(categoryId);
      publishDemoEvent(core, plugin, categoryId, 'selected');
      
      // Navegar a la página correspondiente
      if (categoryId === 'storage' || categoryId === 'events' || categoryId === 'communication') {
        props.onNavigate(plugin.id, 'api-tests', { category: categoryId });
      } else if (categoryId === 'ui' || categoryId === 'themes' || categoryId === 'forms') {
        props.onNavigate(plugin.id, 'ui-tests', { category: categoryId });
      } else if (categoryId === 'advanced' || categoryId === 'charts' || categoryId === 'calendar') {
        props.onNavigate(plugin.id, 'advanced-demos', { category: categoryId });
      } else if (categoryId === 'permissions') {
        // Para permisos, mostrar un modal o diálogo
        // Esta funcionalidad se implementará en otro componente
      }
    }
  };
  
  // Mostrar indicador de carga
  if (isLoading) {
    return React.createElement(
      'div',
      { className: 'pg-loading' },
      [
        React.createElement(
          'div',
          { key: 'spinner', className: 'pg-spinner' }
        ),
        React.createElement(
          'p',
          { key: 'text' },
          'Cargando...'
        )
      ]
    );
  }
  
  // Renderizar página principal
  return React.createElement(
    'div',
    { className: 'pg-main-page' },
    [
      // Encabezado
      React.createElement(
        'header',
        { key: 'header', className: 'pg-header' },
        [
          React.createElement(
            'h1',
            { key: 'title' },
            'Pruebas Generales para Atlas'
          ),
          React.createElement(
            'p',
            { key: 'description' },
            'Explora todas las capacidades del sistema de plugins de Atlas'
          )
        ]
      ),
      
      // Dashboard
      React.createElement(
        'div',
        { key: 'dashboard', className: 'pg-dashboard' },
        [
          // Contador
          React.createElement(
            'div',
            { key: 'counter', className: 'pg-counter-card' },
            [
              React.createElement('h3', { key: 'title' }, 'Contador Demo'),
              React.createElement(
                'div', 
                { key: 'value', className: 'pg-counter-value' }, 
                counterValue.toString()
              ),
              React.createElement(
                'button',
                {
                  key: 'button',
                  className: 'pg-button pg-button-primary',
                  onClick: handleIncrementCounter
                },
                'Incrementar'
              )
            ]
          ),
          
          // Información del plugin
          React.createElement(
            'div',
            { key: 'info', className: 'pg-info-card' },
            [
              React.createElement('h3', { key: 'title' }, 'Información del Plugin'),
              React.createElement(
                'ul',
                { key: 'info-list' },
                [
                  React.createElement('li', { key: 'id' }, `ID: ${plugin.id}`),
                  React.createElement('li', { key: 'name' }, `Nombre: ${plugin.name}`),
                  React.createElement('li', { key: 'version' }, `Versión: ${plugin.version}`),
                  React.createElement('li', { key: 'permissions' }, `Permisos: ${plugin.permissions.join(', ')}`)
                ]
              )
            ]
          )
        ]
      ),
      
      // Categorías de demostración
      React.createElement(
        'section',
        { key: 'categories', className: 'pg-categories-section' },
        [
          React.createElement('h2', { key: 'title' }, 'Categorías de demostración'),
          React.createElement(
            'div',
            { key: 'categories-grid', className: 'pg-categories-grid' },
            categories.map(category => React.createElement(
              'div',
              {
                key: category.id,
                className: `pg-category-card ${activeCategory === category.id ? 'active' : ''}`,
                onClick: () => handleCategoryClick(category.id)
              },
              [
                React.createElement(
                  'div',
                  { key: 'icon', className: 'pg-category-icon' },
                  React.createElement(
                    'span',
                    { className: 'material-icons' },
                    category.icon
                  )
                ),
                React.createElement('h3', { key: 'name' }, category.name),
                React.createElement('p', { key: 'description' }, category.description)
              ]
            ))
          )
        ]
      ),
      
      // Registro de eventos
      React.createElement(
        'section',
        { key: 'event-log', className: 'pg-event-log-section' },
        [
          React.createElement('h2', { key: 'title' }, 'Registro de eventos'),
          React.createElement(
            'div',
            { key: 'log', className: 'pg-event-log' },
            eventLog.length > 0 
              ? eventLog.slice(-10).reverse().map((entry, index) => React.createElement(
                  'div',
                  { key: `log-${index}`, className: `pg-log-entry pg-log-${entry.level || 'info'}` },
                  [
                    React.createElement(
                      'span',
                      { key: 'time', className: 'pg-log-time' },
                      new Date(entry.time).toLocaleTimeString()
                    ),
                    React.createElement(
                      'span',
                      { key: 'message', className: 'pg-log-message' },
                      entry.message || (entry.action ? `${entry.type || ''} ${entry.action}` : 'Evento')
                    )
                  ]
                ))
              : React.createElement('p', { className: 'pg-empty-log' }, 'No hay eventos registrados')
          )
        ]
      )
    ]
  );
}

export default MainPage;