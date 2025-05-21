import React from 'react';

export function createSidebarWidget(plugin) {
  return function SidebarWidget(props) {
    const [notasRecientes, setNotasRecientes] = React.useState([]);
    const [selectedDate, setSelectedDate] = React.useState(null);
    
    React.useEffect(() => {
      const actualizarNotasRecientes = () => {
        // Obtener las últimas 5 notas
        const todasLasNotas = [];
        
        Object.entries(plugin._data.notas).forEach(([fecha, notas]) => {
          notas.forEach(nota => {
            todasLasNotas.push({ fecha, nota });
          });
        });
        
        // Ordenar por fecha de modificación más reciente
        todasLasNotas.sort((a, b) => 
          b.nota.fechaModificacion - a.nota.fechaModificacion
        );
        
        setNotasRecientes(todasLasNotas.slice(0, 5));
      };
      
      actualizarNotasRecientes();
      
      // Suscribirse a cambios
      const subscriptions = [
        plugin._core.events.subscribe(
          plugin.id,
          'administradorNotas.notaCreada',
          actualizarNotasRecientes
        ),
        plugin._core.events.subscribe(
          plugin.id,
          'administradorNotas.notaActualizada',
          actualizarNotasRecientes
        ),
        plugin._core.events.subscribe(
          plugin.id,
          'administradorNotas.notaEliminada',
          actualizarNotasRecientes
        )
      ];
      
      // Suscribirse a cambios de fecha en el calendario
      const calendarSubscription = plugin._core.events.subscribe(
        plugin.id,
        'calendar.dateChanged',
        (data) => {
          setSelectedDate(data.date);
        }
      );
      subscriptions.push(calendarSubscription);
      
      return () => {
        subscriptions.forEach(unsub => unsub());
      };
    }, []);
    
    const handleVerMas = () => {
      // Navegación manejada por el componente padre
      if (props.onNavigate) {
        props.onNavigate(plugin.id, 'administrador-notas');
      }
    };
    
    const handleCrearNota = () => {
      const fecha = selectedDate || new Date();
      const contenido = prompt('Escribe tu nota:');
      
      if (contenido && contenido.trim()) {
        plugin.publicAPI.crearNota(fecha, contenido);
      }
    };
    
    const handleNotaClick = (fecha) => {
      // Navegar a la fecha en el calendario
      const calendar = plugin._core.getModule('calendar');
      if (calendar) {
        calendar.navigateToDate(new Date(fecha));
      }
    };
    
    return (
      <div
        className="administrador-notas-sidebar-widget"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderRadius: 'var(--border-radius-md)',
          padding: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-md)'
        }}
      >
        {/* Encabezado */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--spacing-md)'
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '600',
              color: 'var(--text-color)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)'
            }}
          >
            <span className="material-icons">note</span>
            Notas Recientes
          </h3>
          <button
            onClick={handleCrearNota}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--primary-color)',
              cursor: 'pointer',
              padding: '4px'
            }}
            title="Crear nueva nota"
          >
            <span className="material-icons">add_circle</span>
          </button>
        </div>
        
        {/* Lista de notas recientes */}
        {notasRecientes.length > 0 ? (
          <div>
            {notasRecientes.map(({ fecha, nota }) => {
              const categoria = plugin._data.categorias[nota.categoria];
              
              return (
                <div
                  key={nota.id}
                  style={{
                    padding: 'var(--spacing-sm)',
                    marginBottom: 'var(--spacing-xs)',
                    backgroundColor: 'var(--bg-color-secondary)',
                    borderRadius: 'var(--border-radius-sm)',
                    borderLeft: `2px solid ${categoria?.color || 'var(--primary-color)'}`,
                    cursor: 'pointer',
                    transition: 'background-color var(--transition-fast)'
                  }}
                  onClick={() => handleNotaClick(fecha)}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '4px'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        color: categoria?.color || 'var(--primary-color)',
                        fontWeight: '500'
                      }}
                    >
                      {categoria?.nombre || nota.categoria}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-color-secondary)'
                      }}
                    >
                      {plugin._helpers.formatRelativeDate(fecha)}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-color)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {plugin._helpers.stripHtml(nota.contenido)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--spacing-lg)',
              color: 'var(--text-color-secondary)',
              fontSize: '14px'
            }}
          >
            No hay notas recientes
          </div>
        )}
        
        {/* Botón ver más */}
        <button
          onClick={handleVerMas}
          style={{
            width: '100%',
            marginTop: 'var(--spacing-md)',
            padding: 'var(--spacing-sm)',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-sm)',
            color: 'var(--primary-color)',
            cursor: 'pointer',
            fontSize: '14px',
            transition: 'all var(--transition-fast)'
          }}
        >
          Ver todas las notas
        </button>
      </div>
    );
  };
}