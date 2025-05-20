/**
 * TabNavigation.jsx
 * Componente de navegación por pestañas reutilizable
 */

/**
 * Componente para navegación por pestañas
 * @param {Object} props - Propiedades del componente
 * @param {Array} props.tabs - Array de pestañas { id, label, icon, disabled }
 * @param {string} props.activeTab - ID de la pestaña activa
 * @param {Function} props.onTabChange - Manejador de cambio de pestaña
 * @param {string} props.className - Clases CSS adicionales
 */
function TabNavigation(props) {
  const React = window.React;
  
  // Extraer propiedades
  const {
    tabs,
    activeTab,
    onTabChange,
    className = ''
  } = props;
  
  // Renderizar componente de navegación por pestañas
  return React.createElement(
    'div',
    { className: `pg-tabs ${className}` },
    tabs.map(tab => React.createElement(
      'div',
      {
        key: tab.id,
        className: `pg-tab ${activeTab === tab.id ? 'pg-tab-active' : ''} ${tab.disabled ? 'pg-tab-disabled' : ''}`,
        onClick: tab.disabled ? undefined : () => onTabChange(tab.id)
      },
      [
        tab.icon && React.createElement(
          'span',
          { key: 'icon', className: 'material-icons' },
          tab.icon
        ),
        React.createElement('span', { key: 'label' }, tab.label)
      ]
    ))
  );
}

export default TabNavigation;