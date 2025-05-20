/**
 * QuickAccess.jsx
 * Componente de acceso rápido para la barra lateral
 */

import logger from '../../utils/logger';
import { incrementCounter } from '../../api/storageManager';

/**
 * Componente para acceso rápido desde la barra lateral
 */
function QuickAccess(props) {
  const React = window.React;
  const { useState, useEffect } = React;
  
  // Extraer propiedades
  const { core, plugin } = props;
  
  // Estados locales
  const [shortcuts, setShortcuts] = useState([
    { id: 'main', icon: 'home', label: 'Inicio', pageId: 'main-page' },
    { id: 'api', icon: 'api', label: 'APIs', pageId: 'api-tests' },
    { id: 'ui', icon: 'dashboard', label: 'UI', pageId: 'ui-tests' },
    { id: 'advanced', icon: 'stars', label: 'Avanzado', pageId: 'advanced-demos' }
  ]);
  
  // Manejador para navegación
  const handleNavigate = (pageId, params) => {
    if (props.onNavigate && typeof props.onNavigate === 'function') {
      props.onNavigate(plugin.id, pageId, params);
    }
  };
  
  // Manejador para incrementar contador
  const handleIncrementCounter = async () => {
    try {
      await incrementCounter(core, plugin);
      logger.info('Contador incrementado desde acceso rápido');
    } catch (error) {
      logger.error('Error al incrementar contador:', error);
    }
  };
  
  // Renderizar componente de acceso rápido
  return React.createElement(
    'div',
    { className: 'pg-quick-access' },
    [
      // Título
      React.createElement(
        'h3',
        { key: 'title', className: 'pg-quick-access-title' },
        'Accesos rápidos'
      ),
      
      // Lista de accesos
      React.createElement(
        'ul',
        { key: 'list', className: 'pg-quick-access-list' },
        shortcuts.map(shortcut => React.createElement(
          'li',
          { key: shortcut.id },
          React.createElement(
            'button',
            {
              className: 'pg-quick-access-button',
              onClick: () => handleNavigate(shortcut.pageId)
            },
            [
              React.createElement(
                'span',
                { key: 'icon', className: 'material-icons' },
                shortcut.icon
              ),
              React.createElement('span', { key: 'label' }, shortcut.label)
            ]
          )
        ))
      ),
      
      // Separador
      React.createElement('div', { key: 'divider', className: 'pg-quick-access-divider' }),
      
      // Botón para incrementar contador
      React.createElement(
        'button',
        {
          key: 'counter',
          className: 'pg-quick-access-button pg-quick-access-counter',
          onClick: handleIncrementCounter
        },
        [
          React.createElement(
            'span',
            { key: 'icon', className: 'material-icons' },
            'add_circle'
          ),
          React.createElement('span', { key: 'label' }, 'Incrementar contador')
        ]
      )
    ]
  );
}

export default QuickAccess;