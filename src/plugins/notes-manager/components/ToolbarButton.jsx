import React from 'react';

export function createToolbarButton(plugin) {
  return function ToolbarButton(props) {
    const [notasCount, setNotasCount] = React.useState(0);
    
    React.useEffect(() => {
      // Calcular número total de notas
      const updateCount = () => {
        let count = 0;
        Object.values(plugin._data.notas).forEach(notasPorFecha => {
          count += notasPorFecha.length;
        });
        setNotasCount(count);
      };
      
      updateCount();
      
      // Suscribirse a cambios
      const subscriptions = [
        plugin._core.events.subscribe(
          plugin.id,
          'administradorNotas.notaCreada',
          updateCount
        ),
        plugin._core.events.subscribe(
          plugin.id,
          'administradorNotas.notaEliminada',
          updateCount
        )
      ];
      
      return () => {
        subscriptions.forEach(unsub => unsub());
      };
    }, []);
    
    const handleClick = () => {
      props.onNavigate(plugin.id, 'administrador-notas');
    };
    
    return (
      <div
        className="administrador-notas-toolbar-button"
        onClick={handleClick}
        style={{
          position: 'relative',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: 'var(--border-radius-md)',
          transition: 'background-color var(--transition-fast)',
          backgroundColor: 'transparent'
        }}
      >
        <span
          className="material-icons"
          style={{
            fontSize: '24px',
            color: 'var(--text-color)'
          }}
        >
          note
        </span>
        
        {notasCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              borderRadius: '10px',
              padding: '2px 6px',
              fontSize: '12px',
              fontWeight: 'bold',
              minWidth: '20px',
              textAlign: 'center'
            }}
          >
            {notasCount > 99 ? '99+' : notasCount}
          </span>
        )}
        
        <span
          className="toolbar-tooltip"
          style={{
            position: 'absolute',
            bottom: '-30px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--card-bg)',
            color: 'var(--text-color)',
            padding: '4px 8px',
            borderRadius: 'var(--border-radius-sm)',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            opacity: '0',
            pointerEvents: 'none',
            transition: 'opacity var(--transition-fast)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          Notas
        </span>
      </div>
    );
  };
}