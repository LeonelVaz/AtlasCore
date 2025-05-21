import React from 'react';

export function createSettingsPanel(plugin) {
  return function SettingsPanel(props) {
    const [configuracion, setConfiguracion] = React.useState(plugin._data.configuracion);
    const [categorias, setCategorias] = React.useState(plugin._data.categorias);
    const [mostrarFormCategoria, setMostrarFormCategoria] = React.useState(false);
    const [categoriaEditando, setCategoriaEditando] = React.useState(null);
    const [nuevaCategoria, setNuevaCategoria] = React.useState({
      id: '',
      nombre: '',
      color: '#2196F3',
      icono: 'note'
    });
    const [estadisticas, setEstadisticas] = React.useState(null);
    
    React.useEffect(() => {
      // Cargar estadísticas
      const stats = plugin._notesService.obtenerEstadisticas();
      setEstadisticas(stats);
    }, []);
    
    const handleConfigChange = (key, value) => {
      const nuevaConfig = { ...configuracion, [key]: value };
      setConfiguracion(nuevaConfig);
      plugin._data.configuracion = nuevaConfig;
      plugin._storageService.saveData(plugin._data);
    };
    
    const handleAgregarCategoria = () => {
      if (!nuevaCategoria.nombre.trim() || !nuevaCategoria.id.trim()) {
        alert('Por favor, completa todos los campos');
        return;
      }
      
      if (categorias[nuevaCategoria.id] && !categoriaEditando) {
        alert('Ya existe una categoría con ese ID');
        return;
      }
      
      const categoriasActualizadas = {
        ...categorias,
        [nuevaCategoria.id]: {
          nombre: nuevaCategoria.nombre,
          color: nuevaCategoria.color,
          icono: nuevaCategoria.icono
        }
      };
      
      setCategorias(categoriasActualizadas);
      plugin._data.categorias = categoriasActualizadas;
      plugin._storageService.saveData(plugin._data);
      
      // Resetear formulario
      setNuevaCategoria({
        id: '',
        nombre: '',
        color: '#2196F3',
        icono: 'note'
      });
      setCategoriaEditando(null);
      setMostrarFormCategoria(false);
    };
    
    const handleEditarCategoria = (id) => {
      const cat = categorias[id];
      setNuevaCategoria({
        id: id,
        nombre: cat.nombre,
        color: cat.color,
        icono: cat.icono
      });
      setCategoriaEditando(id);
      setMostrarFormCategoria(true);
    };
    
    const handleEliminarCategoria = (id) => {
      if (id === 'general') {
        alert('No se puede eliminar la categoría General');
        return;
      }
      
      // Verificar si hay notas con esta categoría
      let notasConCategoria = 0;
      Object.values(plugin._data.notas).forEach(notasPorFecha => {
        notasConCategoria += notasPorFecha.filter(n => n.categoria === id).length;
      });
      
      if (notasConCategoria > 0) {
        if (!confirm(`Hay ${notasConCategoria} notas con esta categoría. Si la eliminas, se cambiarán a la categoría General. ¿Continuar?`)) {
          return;
        }
        
        // Cambiar notas a categoría general
        Object.values(plugin._data.notas).forEach(notasPorFecha => {
          notasPorFecha.forEach(nota => {
            if (nota.categoria === id) {
              nota.categoria = 'general';
            }
          });
        });
      }
      
      const categoriasActualizadas = { ...categorias };
      delete categoriasActualizadas[id];
      
      setCategorias(categoriasActualizadas);
      plugin._data.categorias = categoriasActualizadas;
      plugin._storageService.saveData(plugin._data);
    };
    
    const handleLimpiarNotasHuerfanas = async () => {
      const cantidad = plugin._notesService.limpiarNotasHuerfanas();
      alert(`Se eliminaron ${cantidad} notas huérfanas`);
      
      // Actualizar estadísticas
      const stats = plugin._notesService.obtenerEstadisticas();
      setEstadisticas(stats);
    };
    
    const handleLimpiarDatosAntiguos = async () => {
      const dias = prompt('¿Eliminar notas más antiguas de cuántos días?', '365');
      if (!dias) return;
      
      const diasNum = parseInt(dias);
      if (isNaN(diasNum) || diasNum < 1) {
        alert('Por favor, ingresa un número válido de días');
        return;
      }
      
      if (confirm(`¿Estás seguro de eliminar todas las notas con más de ${diasNum} días de antigüedad?`)) {
        const eliminadas = await plugin._storageService.cleanOldData(diasNum);
        alert(`Se eliminaron ${eliminadas} notas antiguas`);
        
        // Actualizar estadísticas
        const stats = plugin._notesService.obtenerEstadisticas();
        setEstadisticas(stats);
      }
    };
    
    const handleImportar = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            await plugin._storageService.importData(event.target.result);
            alert('Datos importados exitosamente');
            
            // Actualizar vista
            setCategorias({ ...plugin._data.categorias });
            setConfiguracion({ ...plugin._data.configuracion });
            
            // Actualizar estadísticas
            const stats = plugin._notesService.obtenerEstadisticas();
            setEstadisticas(stats);
          } catch (error) {
            alert('Error al importar datos: ' + error.message);
          }
        };
        reader.readAsText(file);
      };
      
      input.click();
    };
    
    const iconosDisponibles = [
      'note', 'work', 'person', 'star', 'home', 'school', 
      'event', 'shopping_cart', 'favorite', 'flight', 
      'restaurant', 'sports', 'music_note', 'attach_money'
    ];
    
    return (
      <div
        className="administrador-notas-settings"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderRadius: 'var(--border-radius-md)',
          padding: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-md)'
        }}
      >
        {/* Título */}
        <h3
          style={{
            margin: '0 0 var(--spacing-lg) 0',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)'
          }}
        >
          <span className="material-icons">settings</span>
          Configuración del Administrador de Notas
        </h3>
        
        {/* Sección de configuración general */}
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h4 style={{ marginBottom: 'var(--spacing-md)' }}>Configuración General</h4>
          
          {/* Mostrar indicadores en calendario */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-sm)',
              marginBottom: 'var(--spacing-md)',
              cursor: 'pointer'
            }}
          >
            <input
              type="checkbox"
              checked={configuracion.mostrarIndicadores}
              onChange={(e) => handleConfigChange('mostrarIndicadores', e.target.checked)}
            />
            Mostrar indicadores de notas en el calendario
          </label>
          
          {/* Formato de fecha */}
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              Formato de fecha:
            </label>
            <select
              value={configuracion.formatoFecha}
              onChange={(e) => handleConfigChange('formatoFecha', e.target.value)}
              style={{
                padding: 'var(--spacing-sm)',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-color)'
              }}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          
          {/* Ordenamiento por defecto */}
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>
              Ordenamiento por defecto:
            </label>
            <select
              value={configuracion.ordenamiento}
              onChange={(e) => handleConfigChange('ordenamiento', e.target.value)}
              style={{
                padding: 'var(--spacing-sm)',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-color)'
              }}
            >
              <option value="fecha-desc">Más recientes primero</option>
              <option value="fecha-asc">Más antiguas primero</option>
              <option value="modificacion-desc">Última modificación</option>
              <option value="categoria">Por categoría</option>
            </select>
          </div>
        </div>
        
        {/* Sección de categorías */}
        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: 'var(--spacing-lg)',
            marginBottom: 'var(--spacing-lg)'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--spacing-md)'
            }}
          >
            <h4>Categorías</h4>
            <button
              onClick={() => {
                setCategoriaEditando(null);
                setNuevaCategoria({
                  id: '',
                  nombre: '',
                  color: '#2196F3',
                  icono: 'note'
                });
                setMostrarFormCategoria(true);
              }}
              style={{
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--border-radius-sm)',
                padding: '4px 12px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Agregar
            </button>
          </div>
          
          {/* Lista de categorías */}
          <div>
            {Object.entries(categorias).map(([id, cat]) => (
              <div
                key={id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--spacing-sm)',
                  marginBottom: 'var(--spacing-xs)',
                  backgroundColor: 'var(--bg-color-secondary)',
                  borderRadius: 'var(--border-radius-sm)',
                  borderLeft: `3px solid ${cat.color}`
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)'
                  }}
                >
                  <span
                    className="material-icons"
                    style={{ color: cat.color }}
                  >
                    {plugin._helpers.getCategoryIcon(cat.icono)}
                  </span>
                  <span>{cat.nombre}</span>
                  <code
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-color-secondary)',
                      backgroundColor: 'var(--bg-color)',
                      padding: '2px 6px',
                      borderRadius: 'var(--border-radius-sm)'
                    }}
                  >
                    {id}
                  </code>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => handleEditarCategoria(id)}
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
                  {id !== 'general' && (
                    <button
                      onClick={() => handleEliminarCategoria(id)}
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
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Formulario de categoría */}
          {mostrarFormCategoria && (
            <div
              style={{
                marginTop: 'var(--spacing-md)',
                padding: 'var(--spacing-md)',
                backgroundColor: 'var(--bg-color-secondary)',
                borderRadius: 'var(--border-radius-sm)'
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--spacing-sm)',
                  marginBottom: 'var(--spacing-md)'
                }}
              >
                <div>
                  <label>ID (sin espacios):</label>
                  <input
                    type="text"
                    value={nuevaCategoria.id}
                    onChange={(e) => setNuevaCategoria({
                      ...nuevaCategoria,
                      id: e.target.value.replace(/\s/g, '-').toLowerCase()
                    })}
                    disabled={categoriaEditando !== null}
                    placeholder="mi-categoria"
                    style={{
                      width: '100%',
                      padding: '4px',
                      marginTop: '4px',
                      borderRadius: 'var(--border-radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--input-bg)',
                      color: 'var(--text-color)'
                    }}
                  />
                </div>
                <div>
                  <label>Nombre:</label>
                  <input
                    type="text"
                    value={nuevaCategoria.nombre}
                    onChange={(e) => setNuevaCategoria({
                      ...nuevaCategoria,
                      nombre: e.target.value
                    })}
                    placeholder="Mi Categoría"
                    style={{
                      width: '100%',
                      padding: '4px',
                      marginTop: '4px',
                      borderRadius: 'var(--border-radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--input-bg)',
                      color: 'var(--text-color)'
                    }}
                  />
                </div>
                <div>
                  <label>Color:</label>
                  <input
                    type="color"
                    value={nuevaCategoria.color}
                    onChange={(e) => setNuevaCategoria({
                      ...nuevaCategoria,
                      color: e.target.value
                    })}
                    style={{
                      width: '100%',
                      height: '32px',
                      marginTop: '4px',
                      borderRadius: 'var(--border-radius-sm)',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer'
                    }}
                  />
                </div>
                <div>
                  <label>Icono:</label>
                  <select
                    value={nuevaCategoria.icono}
                    onChange={(e) => setNuevaCategoria({
                      ...nuevaCategoria,
                      icono: e.target.value
                    })}
                    style={{
                      width: '100%',
                      padding: '4px',
                      marginTop: '4px',
                      borderRadius: 'var(--border-radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--input-bg)',
                      color: 'var(--text-color)'
                    }}
                  >
                    {iconosDisponibles.map(icono => (
                      <option key={icono} value={icono}>{icono}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--spacing-sm)',
                  justifyContent: 'flex-end'
                }}
              >
                <button
                  onClick={() => setMostrarFormCategoria(false)}
                  style={{
                    padding: '6px 16px',
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
                  onClick={handleAgregarCategoria}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 'var(--border-radius-sm)',
                    border: 'none',
                    backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  {categoriaEditando ? 'Actualizar' : 'Agregar'}
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Sección de mantenimiento */}
        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: 'var(--spacing-lg)'
          }}
        >
          <h4 style={{ marginBottom: 'var(--spacing-md)' }}>Mantenimiento y Datos</h4>
          
          {/* Estadísticas */}
          {estadisticas && (
            <div
              style={{
                backgroundColor: 'var(--bg-color-secondary)',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--border-radius-sm)',
                marginBottom: 'var(--spacing-md)',
                fontSize: '14px'
              }}
            >
              <div>Total de notas: {estadisticas.totalNotas}</div>
              {estadisticas.notasHuerfanas > 0 && (
                <div style={{ color: 'var(--warning-color)' }}>
                  Notas huérfanas: {estadisticas.notasHuerfanas}
                </div>
              )}
            </div>
          )}
          
          {/* Botones de mantenimiento */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--spacing-sm)'
            }}
          >
            <button
              onClick={handleImportar}
              style={{
                padding: 'var(--spacing-sm)',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'transparent',
                color: 'var(--text-color)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <span className="material-icons" style={{ fontSize: '18px' }}>upload</span>
              Importar datos
            </button>
            
            {estadisticas && estadisticas.notasHuerfanas > 0 && (
              <button
                onClick={handleLimpiarNotasHuerfanas}
                style={{
                  padding: 'var(--spacing-sm)',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--warning-color)',
                  backgroundColor: 'transparent',
                  color: 'var(--warning-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                <span className="material-icons" style={{ fontSize: '18px' }}>cleaning_services</span>
                Limpiar huérfanas
              </button>
            )}
            
            <button
              onClick={handleLimpiarDatosAntiguos}
              style={{
                padding: 'var(--spacing-sm)',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--danger-color)',
                backgroundColor: 'transparent',
                color: 'var(--danger-color)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              <span className="material-icons" style={{ fontSize: '18px' }}>delete_sweep</span>
              Limpiar datos antiguos
            </button>
          </div>
        </div>
      </div>
    );
  };
}