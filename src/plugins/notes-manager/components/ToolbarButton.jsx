import React from 'react';

export function createToolbarButton(plugin) {
  return function ToolbarButton(props) {
    const [notasCount, setNotasCount] = React.useState(0);
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const [notasRecientes, setNotasRecientes] = React.useState([]);
    const dropdownRef = React.useRef(null);
    
    React.useEffect(() => {
      // Calcular número total de notas
      const updateCount = () => {
        let count = 0;
        Object.values(plugin._data.notas).forEach(notasPorFecha => {
          count += notasPorFecha.length;
        });
        setNotasCount(count);
      };
      
      // Actualizar notas recientes
      const actualizarNotasRecientes = () => {
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
      
      updateCount();
      actualizarNotasRecientes();
      
      // Suscribirse a cambios
      const subscriptions = [
        plugin._core.events.subscribe(
          plugin.id,
          'administradorNotas.notaCreada',
          () => {
            updateCount();
            actualizarNotasRecientes();
          }
        ),
        plugin._core.events.subscribe(
          plugin.id,
          'administradorNotas.notaActualizada',
          actualizarNotasRecientes
        ),
        plugin._core.events.subscribe(
          plugin.id,
          'administradorNotas.notaEliminada',
          () => {
            updateCount();
            actualizarNotasRecientes();
          }
        )
      ];
      
      return () => {
        subscriptions.forEach(unsub => unsub());
      };
    }, []);
    
    // Cerrar dropdown al hacer clic fuera
    React.useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsDropdownOpen(false);
        }
      };
      
      if (isDropdownOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }
    }, [isDropdownOpen]);
    
    const handleMainClick = () => {
      props.onNavigate(plugin.id, 'administrador-notas');
    };
    
    const handleDropdownToggle = (e) => {
      e.stopPropagation();
      setIsDropdownOpen(!isDropdownOpen);
    };
    
    const handleCrearNota = () => {
      const fecha = new Date();
      const contenido = prompt('Escribe tu nota:');
      
      if (contenido && contenido.trim()) {
        plugin.publicAPI.crearNota(fecha, contenido);
        setIsDropdownOpen(false);
      }
    };
    
    const handleNotaClick = (fecha) => {
      // Navegar a la fecha en el calendario
      const calendar = plugin._core.getModule('calendar');
      if (calendar) {
        calendar.navigateToDate(new Date(fecha));
      }
      setIsDropdownOpen(false);
    };
    
    const mostrarNotasRecientes = plugin._data.configuracion.mostrarNotasRecientes !== false;
    
    return (
      <div
        className="administrador-notas-toolbar-container"
        ref={dropdownRef}
        style={{
          position: 'relative'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {/* Botón principal de Notas */}
          <div
            className="administrador-notas-toolbar-button"
            onClick={handleMainClick}
            style={{
              position: 'relative',
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: 'var(--border-radius-md)',
              transition: 'background-color var(--transition-fast)',
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--hover-color)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
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
            
            <span
              style={{
                color: 'var(--text-color)',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Notas
            </span>
            
            {notasCount > 0 && (
              <span
                style={{
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
          </div>
          
          {/* Botón dropdown para notas recientes */}
          {mostrarNotasRecientes && (
            <button
              onClick={handleDropdownToggle}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                color: 'var(--text-color-secondary)',
                borderRadius: 'var(--border-radius-sm)',
                transition: 'all var(--transition-fast)',
                display: 'flex',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--hover-color)';
                e.currentTarget.style.color = 'var(--text-color)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-color-secondary)';
              }}
            >
              <span 
                className="material-icons" 
                style={{ 
                  fontSize: '20px',
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform var(--transition-fast)'
                }}
              >
                expand_more
              </span>
            </button>
          )}
        </div>
        
        {/* Dropdown de notas recientes */}
        {mostrarNotasRecientes && isDropdownOpen && (
          <div
            className="administrador-notas-dropdown"
            style={{
              position: 'absolute',
              top: '100%',
              left: '0',
              marginTop: '4px',
              backgroundColor: 'var(--card-bg)',
              borderRadius: 'var(--border-radius-md)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-color)',
              minWidth: '280px',
              maxWidth: '350px',
              zIndex: 1000,
              overflow: 'hidden'
            }}
          >
            {/* Encabezado del dropdown */}
            <div
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-color)'
                }}
              >
                Notas recientes
              </span>
              <button
                onClick={handleCrearNota}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--primary-color)',
                  cursor: 'pointer',
                  padding: '2px',
                  borderRadius: 'var(--border-radius-sm)',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Crear nueva nota"
              >
                <span className="material-icons" style={{ fontSize: '20px' }}>add_circle</span>
              </button>
            </div>
            
            {/* Lista de notas */}
            <div
              style={{
                maxHeight: '300px',
                overflowY: 'auto'
              }}
            >
              {notasRecientes.length > 0 ? (
                notasRecientes.map(({ fecha, nota }) => {
                  const categoria = plugin._data.categorias[nota.categoria];
                  
                  return (
                    <div
                      key={nota.id}
                      style={{
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        transition: 'background-color var(--transition-fast)'
                      }}
                      onClick={() => handleNotaClick(fecha)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--hover-color)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
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
                })
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: 'var(--spacing-lg)',
                    color: 'var(--text-color-secondary)',
                    fontSize: '13px'
                  }}
                >
                  No hay notas recientes
                </div>
              )}
            </div>
            
            {/* Botón ver todas */}
            <div
              style={{
                padding: 'var(--spacing-sm)',
                borderTop: '1px solid var(--border-color)',
                textAlign: 'center'
              }}
            >
              <button
                onClick={handleMainClick}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'var(--primary-color)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  padding: '4px 8px',
                  borderRadius: 'var(--border-radius-sm)',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--hover-color)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Ver todas las notas →
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };
}