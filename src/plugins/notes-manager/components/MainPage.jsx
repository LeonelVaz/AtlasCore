import React from 'react';

export function createMainPage(plugin) {
  const { RichTextEditor, RichTextViewer } = plugin._core.ui.components;
  
  return function MainPage(props) {
    const [todasLasNotas, setTodasLasNotas] = React.useState([]);
    const [notasFiltradas, setNotasFiltradas] = React.useState([]);
    const [busqueda, setBusqueda] = React.useState('');
    const [categoriaFiltro, setCategoriaFiltro] = React.useState('todas');
    const [vistaActual, setVistaActual] = React.useState('lista'); // lista, grid, calendario
    const [notaSeleccionada, setNotaSeleccionada] = React.useState(null);
    const [modoEdicion, setModoEdicion] = React.useState(false);
    const [ordenamiento, setOrdenamiento] = React.useState(plugin._data.configuracion.ordenamiento);
    
    // Estados para crear/editar nota
    const [mostrarFormulario, setMostrarFormulario] = React.useState(false);
    const [notaEditando, setNotaEditando] = React.useState(null);
    const [contenidoNota, setContenidoNota] = React.useState('');
    const [categoriaNota, setCategoriaNota] = React.useState('general');
    const [etiquetasNota, setEtiquetasNota] = React.useState('');
    const [fechaNota, setFechaNota] = React.useState(new Date().toISOString().split('T')[0]);
    
    React.useEffect(() => {
      cargarTodasLasNotas();
      
      // Suscribirse a cambios
      const subscriptions = [
        plugin._core.events.subscribe(
          plugin.id,
          'administradorNotas.notaCreada',
          cargarTodasLasNotas
        ),
        plugin._core.events.subscribe(
          plugin.id,
          'administradorNotas.notaActualizada',
          cargarTodasLasNotas
        ),
        plugin._core.events.subscribe(
          plugin.id,
          'administradorNotas.notaEliminada',
          cargarTodasLasNotas
        )
      ];
      
      return () => {
        subscriptions.forEach(unsub => unsub());
      };
    }, []);
    
    React.useEffect(() => {
      filtrarNotas();
    }, [todasLasNotas, busqueda, categoriaFiltro, ordenamiento]);
    
    const cargarTodasLasNotas = () => {
      const notas = [];
      Object.entries(plugin._data.notas).forEach(([fecha, notasPorFecha]) => {
        notasPorFecha.forEach(nota => {
          notas.push({ fecha, nota });
        });
      });
      setTodasLasNotas(notas);
    };
    
    const filtrarNotas = () => {
      let filtradas = [...todasLasNotas];
      
      // Filtrar por búsqueda
      if (busqueda) {
        const busquedaLower = busqueda.toLowerCase();
        filtradas = filtradas.filter(({ nota }) => 
          nota.contenido.toLowerCase().includes(busquedaLower) ||
          nota.etiquetas.some(tag => tag.toLowerCase().includes(busquedaLower))
        );
      }
      
      // Filtrar por categoría
      if (categoriaFiltro !== 'todas') {
        filtradas = filtradas.filter(({ nota }) => nota.categoria === categoriaFiltro);
      }
      
      // Ordenar
      filtradas = plugin._helpers.sortNotas(
        filtradas.map(({ nota }) => nota),
        ordenamiento
      ).map(nota => {
        const item = todasLasNotas.find(({ nota: n }) => n.id === nota.id);
        return item;
      }).filter(Boolean);
      
      setNotasFiltradas(filtradas);
    };
    
    const handleCrearNota = () => {
      setNotaEditando(null);
      setContenidoNota('');
      setCategoriaNota('general');
      setEtiquetasNota('');
      setFechaNota(new Date().toISOString().split('T')[0]);
      setMostrarFormulario(true);
    };
    
    const handleEditarNota = (fecha, nota) => {
      setNotaEditando({ fecha, nota });
      setContenidoNota(nota.contenido);
      setCategoriaNota(nota.categoria);
      setEtiquetasNota(plugin._helpers.etiquetasToString(nota.etiquetas));
      setFechaNota(fecha);
      setMostrarFormulario(true);
    };
    
    const handleGuardarNota = () => {
      if (!contenidoNota.trim()) return;
      
      const etiquetas = plugin._helpers.parseEtiquetas(etiquetasNota);
      
      if (notaEditando) {
        // Actualizar nota existente
        plugin.publicAPI.actualizarNota(
          notaEditando.fecha,
          notaEditando.nota.id,
          {
            contenido: contenidoNota,
            categoria: categoriaNota,
            etiquetas: etiquetas
          }
        );
      } else {
        // Crear nueva nota
        plugin.publicAPI.crearNota(
          fechaNota,
          contenidoNota,
          {
            categoria: categoriaNota,
            etiquetas: etiquetas
          }
        );
      }
      
      setMostrarFormulario(false);
    };
    
    const handleEliminarNota = (fecha, notaId) => {
      if (confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
        plugin.publicAPI.eliminarNota(fecha, notaId);
        setNotaSeleccionada(null);
      }
    };
    
    const handleExportar = () => {
      plugin._storageService.exportData().then(jsonData => {
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notas_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    };
    
    // Componente de estadísticas
    const renderEstadisticas = () => {
      const stats = plugin._notesService.obtenerEstadisticas();
      
      return (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-lg)'
          }}
        >
          {/* Total de notas */}
          <div
            className="administrador-notas-stat-card"
            style={{
              backgroundColor: 'var(--card-bg)',
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--border-radius-md)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                fontSize: '2em',
                fontWeight: 'bold',
                color: 'var(--primary-color)'
              }}
            >
              {stats.totalNotas}
            </div>
            <div
              style={{
                color: 'var(--text-color-secondary)',
                fontSize: '14px'
              }}
            >
              Total de notas
            </div>
          </div>
          
          {/* Por categoría */}
          {Object.entries(plugin._data.categorias).map(([id, categoria]) => (
            <div
              key={id}
              className="administrador-notas-stat-card"
              style={{
                backgroundColor: 'var(--card-bg)',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--border-radius-md)',
                textAlign: 'center',
                borderTop: `3px solid ${categoria.color}`
              }}
            >
              <div
                style={{
                  fontSize: '1.5em',
                  fontWeight: 'bold',
                  color: categoria.color
                }}
              >
                {stats.notasPorCategoria[id] || 0}
              </div>
              <div
                style={{
                  color: 'var(--text-color-secondary)',
                  fontSize: '14px'
                }}
              >
                {categoria.nombre}
              </div>
            </div>
          ))}
        </div>
      );
    };
    
    // Renderizar vista principal
    return (
      <div
        className="administrador-notas-main-page"
        style={{
          padding: 'var(--spacing-lg)',
          maxWidth: '1200px',
          margin: '0 auto'
        }}
      >
        {/* Encabezado */}
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h1
            style={{
              margin: '0 0 var(--spacing-md) 0',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-md)'
            }}
          >
            <span className="material-icons" style={{ fontSize: '36px' }}>note</span>
            Administrador de Notas
          </h1>
          
          {/* Acciones principales */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
              flexWrap: 'wrap'
            }}
          >
            <button
              className="administrador-notas-button"
              onClick={handleCrearNota}
              style={{
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--border-radius-md)',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)'
              }}
            >
              <span className="material-icons">add</span>
              Nueva Nota
            </button>
            <button
              className="administrador-notas-button"
              onClick={handleExportar}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--primary-color)',
                border: '1px solid var(--primary-color)',
                borderRadius: 'var(--border-radius-md)',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)'
              }}
            >
              <span className="material-icons">download</span>
              Exportar
            </button>
          </div>
        </div>
        
        {/* Estadísticas */}
        {renderEstadisticas()}
        
        {/* Filtros y búsqueda */}
        <div
          style={{
            backgroundColor: 'var(--card-bg)',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--border-radius-md)',
            marginBottom: 'var(--spacing-md)',
            display: 'flex',
            gap: 'var(--spacing-md)',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}
        >
          {/* Búsqueda */}
          <input
            type="text"
            placeholder="Buscar notas..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              flex: '1',
              minWidth: '200px',
              padding: 'var(--spacing-sm)',
              borderRadius: 'var(--border-radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--input-bg)',
              color: 'var(--text-color)'
            }}
          />
          
          {/* Filtro de categoría */}
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            style={{
              padding: 'var(--spacing-sm)',
              borderRadius: 'var(--border-radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--input-bg)',
              color: 'var(--text-color)'
            }}
          >
            <option value="todas">Todas las categorías</option>
            {Object.entries(plugin._data.categorias).map(([id, cat]) => (
              <option key={id} value={id}>{cat.nombre}</option>
            ))}
          </select>
          
          {/* Ordenamiento */}
          <select
            value={ordenamiento}
            onChange={(e) => setOrdenamiento(e.target.value)}
            style={{
              padding: 'var(--spacing-sm)',
              borderRadius: 'var(--border-radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--input-bg)',
              color: 'var(--text-color)'
            }}
          >
            <option value="fecha-desc">Más recientes</option>
            <option value="fecha-asc">Más antiguas</option>
            <option value="modificacion-desc">Última modificación</option>
            <option value="categoria">Por categoría</option>
          </select>
        </div>
        
        {/* Lista de notas */}
        <div
          className="administrador-notas-lista"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 'var(--spacing-md)'
          }}
        >
          {notasFiltradas.length > 0 ? (
            notasFiltradas.map(({ fecha, nota }) => {
              const categoria = plugin._data.categorias[nota.categoria];
              
              return (
                <div
                  key={nota.id}
                  className="administrador-notas-nota-card"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: 'var(--border-radius-md)',
                    padding: 'var(--spacing-md)',
                    borderLeft: `4px solid ${categoria?.color || 'var(--primary-color)'}`,
                    cursor: 'pointer',
                    transition: 'transform var(--transition-fast)'
                  }}
                  onClick={() => setNotaSeleccionada({ fecha, nota })}
                >
                  {/* Encabezado de la tarjeta */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 'var(--spacing-sm)'
                    }}
                  >
                    <div>
                      <span
                        className="administrador-notas-categoria-badge"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: plugin._helpers.generateLightColor(categoria?.color || '#9E9E9E'),
                          color: categoria?.color || '#9E9E9E',
                          padding: '4px 8px',
                          borderRadius: 'var(--border-radius-sm)',
                          fontSize: '12px',
                          fontWeight: '500',
                          marginBottom: '4px'
                        }}
                      >
                        <span className="material-icons" style={{ fontSize: '14px' }}>
                          {plugin._helpers.getCategoryIcon(categoria?.icono)}
                        </span>
                        {categoria?.nombre || nota.categoria}
                      </span>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-color-secondary)'
                        }}
                      >
                        {plugin._helpers.formatDateDisplay(fecha)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditarNota(fecha, nota);
                        }}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: 'var(--text-color-secondary)',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        <span className="material-icons" style={{ fontSize: '18px' }}>edit</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEliminarNota(fecha, nota.id);
                        }}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: 'var(--danger-color)',
                          cursor: 'pointer',
                          padding: '4px'
                        }}
                      >
                        <span className="material-icons" style={{ fontSize: '18px' }}>delete</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Contenido */}
                  <div
                    style={{
                      fontSize: '14px',
                      color: 'var(--text-color)',
                      marginBottom: 'var(--spacing-sm)',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: '3',
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.5'
                    }}
                  >
                    {plugin._helpers.stripHtml(nota.contenido)}
                  </div>
                  
                  {/* Etiquetas */}
                  {nota.etiquetas.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '4px'
                      }}
                    >
                      {nota.etiquetas.map(tag => (
                        <span
                          key={tag}
                          className="administrador-notas-tag"
                          style={{
                            backgroundColor: 'var(--bg-color-secondary)',
                            color: 'var(--text-color-secondary)',
                            padding: '2px 6px',
                            borderRadius: 'var(--border-radius-sm)',
                            fontSize: '11px'
                          }}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: 'var(--spacing-xl)',
                color: 'var(--text-color-secondary)'
              }}
            >
              {busqueda || categoriaFiltro !== 'todas'
                ? 'No se encontraron notas con estos filtros'
                : 'No hay notas aún. ¡Crea tu primera nota!'}
            </div>
          )}
        </div>
        
        {/* Modal de formulario */}
        {mostrarFormulario && (
          <div
            className="administrador-notas-modal-backdrop"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}
            onClick={() => setMostrarFormulario(false)}
          >
            <div
              className="administrador-notas-modal-content"
              style={{
                backgroundColor: 'var(--modal-bg)',
                borderRadius: 'var(--border-radius-lg)',
                padding: 'var(--spacing-lg)',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '90vh',
                overflow: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ margin: '0 0 var(--spacing-md) 0' }}>
                {notaEditando ? 'Editar Nota' : 'Nueva Nota'}
              </h2>
              
              {/* Fecha */}
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label>Fecha:</label>
                <input
                  type="date"
                  value={fechaNota}
                  onChange={(e) => setFechaNota(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-sm)',
                    marginTop: '4px',
                    borderRadius: 'var(--border-radius-sm)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-color)'
                  }}
                />
              </div>
              
              {/* Categoría */}
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label>Categoría:</label>
                <select
                  value={categoriaNota}
                  onChange={(e) => setCategoriaNota(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-sm)',
                    marginTop: '4px',
                    borderRadius: 'var(--border-radius-sm)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-color)'
                  }}
                >
                  {Object.entries(plugin._data.categorias).map(([id, cat]) => (
                    <option key={id} value={id}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
              
              {/* Contenido */}
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label>Contenido:</label>
                {RichTextEditor ? (
                  <RichTextEditor
                    value={contenidoNota}
                    onChange={setContenidoNota}
                    placeholder="Escribe tu nota aquí..."
                  />
                ) : (
                  <textarea
                    value={contenidoNota}
                    onChange={(e) => setContenidoNota(e.target.value)}
                    placeholder="Escribe tu nota aquí..."
                    style={{
                      width: '100%',
                      minHeight: '200px',
                      padding: 'var(--spacing-sm)',
                      marginTop: '4px',
                      borderRadius: 'var(--border-radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--input-bg)',
                      color: 'var(--text-color)',
                      resize: 'vertical'
                    }}
                  />
                )}
              </div>
              
              {/* Etiquetas */}
              <div style={{ marginBottom: 'var(--spacing-md)' }}>
                <label>Etiquetas (separadas por comas):</label>
                <input
                  type="text"
                  value={etiquetasNota}
                  onChange={(e) => setEtiquetasNota(e.target.value)}
                  placeholder="trabajo, importante, seguimiento"
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-sm)',
                    marginTop: '4px',
                    borderRadius: 'var(--border-radius-sm)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-color)'
                  }}
                />
              </div>
              
              {/* Botones */}
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--spacing-md)',
                  justifyContent: 'flex-end'
                }}
              >
                <button
                  onClick={() => setMostrarFormulario(false)}
                  style={{
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    borderRadius: 'var(--border-radius-sm)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-color)',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardarNota}
                  disabled={!contenidoNota.trim()}
                  style={{
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    borderRadius: 'var(--border-radius-sm)',
                    border: 'none',
                    backgroundColor: contenidoNota.trim() 
                      ? 'var(--primary-color)' 
                      : 'var(--border-color)',
                    color: 'white',
                    cursor: contenidoNota.trim() ? 'pointer' : 'not-allowed'
                  }}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
}