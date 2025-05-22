import React from 'react';

function NotesNavigationItem(props) {
  const handleClick = () => {
    // Usar onNavigate para navegar a la página de notas
    if (props.onNavigate) {
      props.onNavigate(props.plugin.id, 'notes');
    }
  };
  
  return React.createElement(
    'div',
    {
      className: 'notes-navigation-item',
      onClick: handleClick,
      style: {
        display: 'flex',
        alignItems: 'center',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        cursor: 'pointer',
        borderRadius: 'var(--border-radius-md)',
        transition: 'background-color var(--transition-fast)',
        color: 'var(--text-color)',
        backgroundColor: 'transparent'
      },
      onMouseEnter: (e) => {
        e.target.style.backgroundColor = 'var(--hover-color)';
      },
      onMouseLeave: (e) => {
        e.target.style.backgroundColor = 'transparent';
      }
    },
    [
      React.createElement(
        'span',
        { 
          className: 'material-icons',
          key: 'icon',
          style: {
            marginRight: 'var(--spacing-sm)',
            fontSize: '20px'
          }
        },
        'note'
      ),
      React.createElement(
        'span',
        { 
          key: 'label',
          style: {
            fontSize: '14px',
            fontWeight: '500'
          }
        },
        'Notes'
      )
    ]
  );
}

export default NotesNavigationItem;