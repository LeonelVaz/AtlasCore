import React from 'react';

export function createCalendarIndicator(plugin) {
  return function CalendarIndicator(props) {
    const [hasNotas, setHasNotas] = React.useState(false);
    const [notasCount, setNotasCount] = React.useState(0);
    
    React.useEffect(() => {
      // Verificar si hay notas para esta fecha usando fechaCalendario
      const checkNotas = () => {
        if (!plugin._data.configuracion.mostrarIndicadores) {
          setHasNotas(false);
          return;
        }
        
        // Obtener notas que tienen fechaCalendario en este día
        const notas = plugin._notesService.getNotasPorFechaCalendario(props.date);
        
        setHasNotas(notas.length > 0);
        setNotasCount(notas.length);
      };
      
      checkNotas();
      
      // Suscribirse a cambios
      const subscriptions = [
        plugin._core.events.subscribe(
          plugin.id,
          'administradorNotas.notaCreada',
          checkNotas
        ),
        plugin._core.events.subscribe(
          plugin.id,
          'administradorNotas.notaEliminada',
          checkNotas
        ),
        plugin._core.events.subscribe(
          plugin.id,
          'administradorNotas.notaActualizada',
          checkNotas
        ),
        plugin._core.events.subscribe(
          plugin.id,
          'administradorNotas.notaMovida',
          checkNotas
        ),
        plugin._core.events.subscribe(
          plugin.id,
          'administradorNotas.fechasCalendarioActualizadas',
          checkNotas
        ),
        plugin._core.events.subscribe(
          plugin.id,
          'administradorNotas.calendarioActualizado',
          checkNotas
        )
      ];
      
      return () => {
        subscriptions.forEach(unsub => unsub());
      };
    }, [props.date, plugin._data.configuracion.mostrarIndicadores]);
    
    if (!hasNotas) {
      return null;
    }
    
    // Determinar el color basado en las categorías de las notas
    const getIndicatorColor = () => {
      const notas = plugin._notesService.getNotasPorFechaCalendario(props.date);
      
      // Si todas las notas son de la misma categoría, usar ese color
      const categorias = [...new Set(notas.map(n => n.categoria))];
      if (categorias.length === 1) {
        return plugin._data.categorias[categorias[0]]?.color || 'var(--primary-color)';
      }
      
      // Si hay múltiples categorías, usar color primario
      return 'var(--primary-color)';
    };
    
    return (
      <div
        className="administrador-notas-calendar-indicator"
        style={{
          position: 'absolute',
          bottom: '2px',
          right: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '2px'
        }}
      >
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: getIndicatorColor(),
            opacity: '0.8'
          }}
        />
        {notasCount > 1 && (
          <span
            style={{
              fontSize: '10px',
              color: 'var(--text-color-secondary)',
              fontWeight: '500'
            }}
          >
            {notasCount}
          </span>
        )}
      </div>
    );
  };
}