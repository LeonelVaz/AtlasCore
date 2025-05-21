import React from 'react';

export function createEventDetailExtension(plugin) {
  const { RichTextViewer } = plugin._core.ui.components;
  
  return function EventDetailExtension(props) {
    const [notas, setNotas] = React.useState([]);
    const [expanded, setExpanded] = React.useState({});
    
    React.useEffect(() => {
      // Cargar notas para este evento
      if (props.event && props.event.id) {
        const notasEvento = plugin.publicAPI.getNotasPorEvento(props.event.id);
        setNotas(notasEvento);
      }
    }, [props.event]);
    
    if (!notas.length) {
      return null;
    }
    
    const toggleExpanded = (notaId) => {
      setExpanded(prev => ({
        ...prev,
        [notaId]: !prev[notaId]
      }));
    };
    
    return (
      <div
        className="administrador-notas-event-detail"
        style={{
          marginTop: 'var(--spacing-md)',
          padding: 'var(--spacing-md)',
          backgroundColor: 'var(--bg-color-secondary)',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--border-color)'
        }}
      >
        <h4
          style={{
            margin: '0 0 var(--spacing-md) 0',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
            color: 'var(--text-color)'
          }}
        >
          <span className="material-icons">note</span>
          Notas ({notas.length})
        </h4>
        
        <div>
          {notas.map(nota => {
            const categoria = plugin._data.categorias[nota.categoria];
            const isExpanded = expanded[nota.id];
            const contenidoPreview = plugin._helpers.truncateText(
              plugin._helpers.stripHtml(nota.contenido),
              100
            );
            
            return (
              <div
                key={nota.id}
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderRadius: 'var(--border-radius-sm)',
                  padding: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-sm)',
                  borderLeft: `3px solid ${categoria?.color || 'var(--primary-color)'}`
                }}
              >
                {/* Encabezado de la nota */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--spacing-sm)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm)'
                    }}
                  >
                    {/* Categoría */}
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: plugin._helpers.generateLightColor(
                          categoria?.color || '#9E9E9E'
                        ),
                        color: categoria?.color || '#9E9E9E',
                        padding: '4px 8px',
                        borderRadius: 'var(--border-radius-sm)',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      <span 
                        className="material-icons"
                        style={{ fontSize: '14px' }}
                      >
                        {plugin._helpers.getCategoryIcon(categoria?.icono)}
                      </span>
                      {categoria?.nombre || nota.categoria}
                    </span>
                    
                    {/* Fecha */}
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-color-secondary)'
                      }}
                    >
                      {plugin._helpers.formatRelativeDate(nota.fechaCreacion)}
                    </span>
                  </div>
                  
                  {/* Botón expandir/colapsar */}
                  <button
                    onClick={() => toggleExpanded(nota.id)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'var(--text-color-secondary)',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <span 
                      className="material-icons"
                      style={{ fontSize: '20px' }}
                    >
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                </div>
                
                {/* Etiquetas */}
                {nota.etiquetas.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '4px',
                      marginBottom: 'var(--spacing-sm)'
                    }}
                  >
                    {nota.etiquetas.map(etiqueta => (
                      <span
                        key={etiqueta}
                        style={{
                          backgroundColor: 'var(--bg-color-secondary)',
                          color: 'var(--text-color-secondary)',
                          padding: '2px 8px',
                          borderRadius: 'var(--border-radius-sm)',
                          fontSize: '11px'
                        }}
                      >
                        #{etiqueta}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Contenido */}
                <div
                  style={{
                    color: 'var(--text-color)',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}
                >
                  {isExpanded ? (
                    RichTextViewer ? (
                      <RichTextViewer content={nota.contenido} />
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: nota.contenido }} />
                    )
                  ) : (
                    contenidoPreview
                  )}
                </div>
                
                {/* Estado de la nota (completada, huérfana) */}
                {(nota.completada || nota.huerfana) && (
                  <div
                    style={{
                      marginTop: 'var(--spacing-sm)',
                      display: 'flex',
                      gap: 'var(--spacing-sm)'
                    }}
                  >
                    {nota.completada && (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--success-color)',
                          fontSize: '12px'
                        }}
                      >
                        <span className="material-icons" style={{ fontSize: '16px' }}>
                          check_circle
                        </span>
                        Completada
                      </span>
                    )}
                    {nota.huerfana && (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--warning-color)',
                          fontSize: '12px'
                        }}
                      >
                        <span className="material-icons" style={{ fontSize: '16px' }}>
                          warning
                        </span>
                        Evento eliminado
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
}