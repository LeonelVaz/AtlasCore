import React from 'react';

export function createEventFormExtension(plugin) {
  return function EventFormExtension(props) {
    const [notas, setNotas] = React.useState([]);
    const [showForm, setShowForm] = React.useState(false);
    const [newNotaContent, setNewNotaContent] = React.useState('');
    const [selectedCategoria, setSelectedCategoria] = React.useState('general');
    
    React.useEffect(() => {
      console.log('[EventFormExtension] Props recibidas:', props);
      console.log('[EventFormExtension] Evento:', props.event);
      
      // Cargar notas existentes para este evento
      if (props.event && props.event.id) {
        const notasEvento = plugin.publicAPI.getNotasPorEvento(props.event.id);
        console.log('[EventFormExtension] Notas encontradas para evento:', notasEvento);
        setNotas(notasEvento);
      }
    }, [props.event]);
    
    const handleAddNota = () => {
      if (!newNotaContent.trim()) return;
      
      console.log('[EventFormExtension] === CREANDO NOTA ===');
      console.log('[EventFormExtension] Props completas:', props);
      console.log('[EventFormExtension] Evento completo:', props.event);
      
      // Validar que tenemos un evento válido
      if (!props.event) {
        console.error('[EventFormExtension] ERROR: No hay evento en props');
        alert('Error: No se puede crear la nota sin un evento asociado');
        return;
      }
      
      // Validar que el evento tenga ID
      if (!props.event.id) {
        console.error('[EventFormExtension] ERROR: El evento no tiene ID');
        console.log('[EventFormExtension] Evento sin ID:', props.event);
        alert('Error: El evento no tiene un ID válido');
        return;
      }
      
      // Asegurar que tenemos una fecha válida del evento
      let fechaEvento;
      console.log('[EventFormExtension] event.start:', props.event.start);
      console.log('[EventFormExtension] Tipo de event.start:', typeof props.event.start);
      
      if (props.event && props.event.start) {
        // Si start es un string ISO o un objeto Date
        if (props.event.start instanceof Date) {
          fechaEvento = props.event.start;
        } else if (typeof props.event.start === 'string') {
          fechaEvento = new Date(props.event.start);
        } else if (typeof props.event.start === 'number') {
          // Por si acaso es un timestamp
          fechaEvento = new Date(props.event.start);
        } else {
          console.error('[EventFormExtension] Formato de fecha no reconocido:', props.event.start);
          fechaEvento = new Date();
        }
      } else {
        // Fallback a fecha actual si no hay fecha del evento
        fechaEvento = new Date();
        console.warn('[EventFormExtension] No se encontró fecha del evento, usando fecha actual');
      }
      
      console.log('[EventFormExtension] Fecha del evento procesada:', fechaEvento);
      console.log('[EventFormExtension] Fecha ISO:', fechaEvento.toISOString());
      console.log('[EventFormExtension] Timestamp:', fechaEvento.getTime());
      
      // Usar la fecha del evento como fecha de almacenamiento
      const fechaAlmacenamiento = fechaEvento;
      
      // Datos de la nueva nota
      const datosNota = {
        eventoId: props.event.id,
        categoria: selectedCategoria,
        fechaEvento: fechaEvento,
        fechaCalendario: fechaEvento.getTime()
      };
      
      console.log('[EventFormExtension] Datos para crear nota:', datosNota);
      
      // Crear la nota con fechaCalendario establecida correctamente
      const nuevaNota = plugin.publicAPI.crearNota(
        fechaAlmacenamiento,
        newNotaContent,
        datosNota
      );
      
      console.log('[EventFormExtension] Nota creada:', nuevaNota);
      console.log('[EventFormExtension] eventoId:', nuevaNota.eventoId);
      console.log('[EventFormExtension] fechaCalendario:', nuevaNota.fechaCalendario);
      console.log('[EventFormExtension] fechaCalendario Date:', new Date(nuevaNota.fechaCalendario));
      
      setNotas([...notas, nuevaNota]);
      setNewNotaContent('');
      setShowForm(false);
    };
    
    const handleDeleteNota = (nota) => {
      console.log('[EventFormExtension] Eliminando nota:', nota);
      const fecha = props.event && props.event.start ? props.event.start : new Date();
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
                        title={`Visible en el calendario: ${new Date(nota.fechaCalendario).toLocaleString()}`}
                      >
                        <span className="material-icons" style={{ fontSize: '14px', verticalAlign: 'middle' }}>
                          calendar_today
                        </span>
                      </span>
                    )}
                    {nota.eventoId && (
                      <span
                        style={{
                          fontSize: '10px',
                          color: 'var(--info-color)',
                          backgroundColor: 'var(--bg-color-secondary)',
                          padding: '2px 4px',
                          borderRadius: '2px'
                        }}
                        title={`ID del evento: ${nota.eventoId}`}
                      >
                        EV: {nota.eventoId.substring(0, 8)}...
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
            {/* Info de debug */}
            {props.event && (
              <div
                style={{
                  backgroundColor: 'var(--bg-color-secondary)',
                  padding: '8px',
                  borderRadius: '4px',
                  marginBottom: 'var(--spacing-sm)',
                  fontSize: '11px',
                  color: 'var(--text-color-secondary)'
                }}
              >
                <div>ID del evento: {props.event.id || 'SIN ID'}</div>
                <div>Fecha del evento: {props.event.start ? new Date(props.event.start).toLocaleString() : 'SIN FECHA'}</div>
              </div>
            )}
            
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