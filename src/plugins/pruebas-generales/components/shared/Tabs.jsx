/**
 * Tabs.jsx
 * Componente de pestañas reutilizable
 */

/**
 * Componente Tabs para navegación por pestañas
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.tabs - Array de objetos de pestaña { id, label, icon, disabled }
 * @param {string} props.activeTab - ID de la pestaña activa
 * @param {Function} props.onChange - Manejador de cambio de pestaña
 * @param {string} props.className - Clases CSS adicionales
 * @param {string} props.tabsClassName - Clases CSS adicionales para la barra de pestañas
 * @param {string} props.contentClassName - Clases CSS adicionales para el contenido
 * @param {React.ReactNode} props.children - Contenido de las pestañas (debe incluir componentes Tab)
 */
function Tabs(props) {
  const React = window.React;
  
  // Extraer propiedades
  const {
    tabs,
    activeTab,
    onChange,
    className = '',
    tabsClassName = '',
    contentClassName = '',
    children
  } = props;
  
  // Manejar clic en pestaña
  const handleTabClick = (tabId) => {
    if (onChange) {
      onChange(tabId);
    }
  };
  
  // Renderizar componente Tabs
  return React.createElement(
    'div',
    { className: `pg-tabs-container ${className}` },
    [
      // Barra de pestañas
      React.createElement(
        'div',
        { key: 'tabs', className: `pg-tabs ${tabsClassName}` },
        tabs.map(tab => React.createElement(
          'div',
          {
            key: tab.id,
            className: `pg-tab ${activeTab === tab.id ? 'pg-tab-active' : ''} ${tab.disabled ? 'pg-tab-disabled' : ''}`,
            onClick: tab.disabled ? undefined : () => handleTabClick(tab.id)
          },
          [
            tab.icon && React.createElement(
              'span',
              { key: 'icon', className: 'material-icons pg-tab-icon' },
              tab.icon
            ),
            React.createElement('span', { key: 'label' }, tab.label)
          ]
        ))
      ),
      
      // Contenido de las pestañas
      React.createElement(
        'div',
        { key: 'content', className: `pg-tab-content ${contentClassName}` },
        // Filtrar los hijos para mostrar solo el contenido de la pestaña activa
        React.Children.map(children, child => {
          // Verificar si el hijo es un componente Tab válido y corresponde a la pestaña activa
          if (child && child.props && child.props.tabId === activeTab) {
            return child;
          }
          return null;
        })
      )
    ]
  );
}

/**
 * Componente Tab para contenido de una pestaña individual
 * @param {Object} props - Propiedades del componente
 * @param {string} props.tabId - ID de la pestaña a la que corresponde este contenido
 * @param {string} props.className - Clases CSS adicionales
 * @param {React.ReactNode} props.children - Contenido de la pestaña
 */
function Tab(props) {
  const React = window.React;
  
  // Extraer propiedades
  const { tabId, className = '', children } = props;
  
  // Renderizar componente Tab
  return React.createElement(
    'div',
    { className: `pg-tab-pane ${className}` },
    children
  );
}

// Exportar ambos componentes
export { Tabs, Tab };