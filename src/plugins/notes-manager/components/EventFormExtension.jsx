import React from 'react';

export function createEventFormExtension(plugin) {
  return function EventFormExtension(props) {
    const [notas, setNotas] = React.useState([]);
    const [showForm, setShowForm] = React.useState(false);
    const [newNotaContent, setNewNotaContent] = React.useState('');
    const [selectedCategoria, setSelectedCategoria] = React.useState('general');
    
    React.useEffect(() => {
      // Cargar notas existentes para este evento
      if (props.event && props.event.id) {
        const notasEvento = plugin.publicAPI.getNotasPorEvento(props.event.id);
        setNotas(notasEvento);
      }
    }, [props.event]);
    
    const handleAddNota = () => {
      if (!newNotaContent.trim()) return;
      
      const fecha = props.event.start || new Date();
      const nuevaNota = plugin.publicAPI.crearNota(
        fecha,
        newNotaContent,
        {
          eventoId: props.event.id,
          categoria: selectedCategoria,
          fechaEvento: fecha, // Pasar la fecha del evento para establecer fechaCalendario
          fechaCalendario: new Date(fecha).getTime() // Establecer explícitamente fechaCalendario
        }
      );
      
      setNotas([...notas, nuevaNota]);
      setNewNotaContent('');
      setShowForm(false);
    };
    
    const handleDeleteNota = (nota) => {
      const fecha = props.event.start || new Date();
      plugin.publicAPI.eliminarNota(fecha, nota.id);
      setNotas(notas.filter(n => n.id !== nota.id));
    };
    
    return (
      <div
        className="administrador-notas-event-form"
        style={{
          marginTop: 'var(--spacing-md)',
          padding: 'var(--spacing-md)',
          backgroundColor: 'var(--bg-color-secondary)',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--spacing-sm)'
          }}
        >
          <h4
            style={{
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)',
              color: 'var(--text-color)'
            }}
          >
            <span className="material-icons">note</span>
            Notas
          </h4>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              backgroundColor: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--border-radius-sm)',
              padding: '4px 12px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span className="material-icons" style={{ fontSize: '16px' }}>add</span>
            Añadir
          </button>
        </div>
        
        {/* Lista de notas existentes */}
        {notas.length > 0 && (
          <div style={{ marginBottom: 'var(--spacing-sm)' }}>
            {notas.map(nota => (
              <div
                key={nota.id}
                style={{
                  backgroundColor: 'var(--card-bg)',
                  padding: 'var(--spacing-sm)',
                  borderRadius: 'var(--border-radius-sm)',
                  marginBottom: 'var(--spacing-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: '4px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        backgroundColor: plugin._helpers.generateLightColor(
                          plugin._data.categorias[nota.categoria]?.color || '#9E9E9E'
                        ),
                        color: plugin._data.categorias[nota.categoria]?.color || '#9E9E9E',
                        padding: '2px 8px',
                        borderRadius: 'var(--border-radius-sm)',
                        fontSize: '12px'
                      }}
                    >
                      {plugin._data.categorias[nota.categoria]?.nombre || nota.categoria}
                    </span>
                    {nota.fechaCalendario && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-color-secondary)'
                        }}
                        title="Visible en el calendario"
                      >
                        <span className="material-icons" style={{ fontSize: '14px', verticalAlign: 'middle' }}>
                          calendar_today
                        </span>
                      </span>
                    )}
                  </div>
                  <span style={{ color: 'var(--text-color)' }}>
                    {plugin._helpers.truncateText(plugin._helpers.stripHtml(nota.contenido), 50)}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteNota(nota)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: 'var(--danger-color)',
                    cursor: 'pointer',
                    padding: '4px',
                    marginLeft: '8px'
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '18px' }}>delete</span>
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Formulario para nueva nota */}
        {showForm && (
          <div
            style={{
              backgroundColor: 'var(--card-bg)',
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--border-radius-sm)',
              marginTop: 'var(--spacing-sm)'
            }}
          >
            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '4px',
                  fontSize: '14px',
                  color: 'var(--text-color-secondary)'
                }}
              >
                Categoría:
              </label>
              <select
                value={selectedCategoria}
                onChange={(e) => setSelectedCategoria(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px',
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
            
            <textarea
              value={newNotaContent}
              onChange={(e) => setNewNotaContent(e.target.value)}
              placeholder="Escribe tu nota aquí..."
              style={{
                width: '100%',
                minHeight: '80px',
                padding: 'var(--spacing-sm)',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--input-bg)',
                color: 'var(--text-color)',
                resize: 'vertical',
                fontSize: '14px'
              }}
            />
            
            <div
              style={{
                marginTop: 'var(--spacing-sm)',
                fontSize: '12px',
                color: 'var(--text-color-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span className="material-icons" style={{ fontSize: '16px' }}>info</span>
              Esta nota se mostrará en el calendario en la fecha del evento
            </div>
            
            <div
              style={{
                display: 'flex',
                gap: 'var(--spacing-sm)',
                marginTop: 'var(--spacing-sm)',
                justifyContent: 'flex-end'
              }}
            >
              <button
                onClick={() => {
                  setShowForm(false);
                  setNewNotaContent('');
                }}
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
                onClick={handleAddNota}
                disabled={!newNotaContent.trim()}
                style={{
                  padding: '6px 16px',
                  borderRadius: 'var(--border-radius-sm)',
                  border: 'none',
                  backgroundColor: newNotaContent.trim() 
                    ? 'var(--primary-color)' 
                    : 'var(--border-color)',
                  color: 'white',
                  cursor: newNotaContent.trim() ? 'pointer' : 'not-allowed',
                  opacity: newNotaContent.trim() ? '1' : '0.6'
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };
}