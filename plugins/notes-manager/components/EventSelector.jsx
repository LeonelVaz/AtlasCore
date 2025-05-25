import React from 'react';

function EventSelector(props) {
  const { onSelect, onCancel, currentEventId, core } = props;
  const [events, setEvents] = React.useState([]);
  const [filteredEvents, setFilteredEvents] = React.useState([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedDate, setSelectedDate] = React.useState(null);
  
  React.useEffect(() => {
    // Obtener eventos del calendario
    const calendar = core.getModule('calendar');
    if (calendar) {
      const allEvents = calendar.getEvents();
      // Ordenar eventos por fecha
      const sortedEvents = allEvents.sort((a, b) => 
        new Date(a.start) - new Date(b.start)
      );
      setEvents(sortedEvents);
      setFilteredEvents(sortedEvents);
    }
  }, [core]);
  
  React.useEffect(() => {
    // Filtrar eventos
    let filtered = events;
    
    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query)
      );
    }
    
    // Filtrar por fecha seleccionada
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.start).toISOString().split('T')[0];
        return eventDate === dateStr;
      });
    }
    
    setFilteredEvents(filtered);
  }, [searchQuery, selectedDate, events]);
  
  const formatEventDate = (event) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    
    const dateOptions = { day: 'numeric', month: 'short' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    
    const dateStr = start.toLocaleDateString('es-ES', dateOptions);
    const startTime = start.toLocaleTimeString('es-ES', timeOptions);
    const endTime = end.toLocaleTimeString('es-ES', timeOptions);
    
    return `${dateStr} • ${startTime} - ${endTime}`;
  };
  
  // Agrupar eventos por mes
  const eventsByMonth = React.useMemo(() => {
    const grouped = {};
    filteredEvents.forEach(event => {
      const date = new Date(event.start);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          name: monthName,
          events: []
        };
      }
      
      grouped[monthKey].events.push(event);
    });
    
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredEvents]);
  
  return React.createElement(
    'div',
    {
      className: 'event-selector-modal',
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 'var(--spacing-lg)'
      },
      onClick: onCancel
    },
    React.createElement(
      'div',
      {
        style: {
          backgroundColor: 'var(--modal-bg)',
          borderRadius: 'var(--border-radius-lg)',
          maxWidth: '600px',
          maxHeight: '80vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-xl)'
        },
        onClick: (e) => e.stopPropagation()
      },
      [
        // Header
        React.createElement(
          'div',
          {
            key: 'header',
            style: {
              padding: 'var(--spacing-lg)',
              borderBottom: '1px solid var(--border-color)'
            }
          },
          [
            React.createElement(
              'h3',
              {
                key: 'title',
                style: {
                  margin: '0 0 var(--spacing-md) 0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: 'var(--text-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)'
                }
              },
              [
                React.createElement('span', { className: 'material-icons', key: 'icon' }, 'event'),
                React.createElement('span', { key: 'text' }, 'Seleccionar Evento')
              ]
            ),
            
            // Buscador
            React.createElement(
              'div',
              {
                key: 'search',
                style: {
                  position: 'relative'
                }
              },
              [
                React.createElement('input', {
                  key: 'search-input',
                  type: 'text',
                  value: searchQuery,
                  onChange: (e) => setSearchQuery(e.target.value),
                  placeholder: 'Buscar eventos...',
                  style: {
                    width: '100%',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    paddingLeft: '40px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-md)',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-color)',
                    fontSize: '14px',
                    outline: 'none'
                  }
                }),
                React.createElement(
                  'span',
                  {
                    className: 'material-icons',
                    key: 'search-icon',
                    style: {
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-color-secondary)',
                      fontSize: '18px'
                    }
                  },
                  'search'
                )
              ]
            )
          ]
        ),
        
        // Lista de eventos
        React.createElement(
          'div',
          {
            key: 'events-list',
            style: {
              flex: 1,
              overflowY: 'auto',
              padding: 'var(--spacing-md)'
            }
          },
          eventsByMonth.length === 0 ? 
            React.createElement(
              'div',
              {
                style: {
                  textAlign: 'center',
                  padding: 'var(--spacing-xl)',
                  color: 'var(--text-color-secondary)'
                }
              },
              'No se encontraron eventos'
            ) :
            eventsByMonth.map(([monthKey, monthData]) => 
              React.createElement(
                'div',
                {
                  key: monthKey,
                  style: {
                    marginBottom: 'var(--spacing-lg)'
                  }
                },
                [
                  React.createElement(
                    'h4',
                    {
                      key: 'month-header',
                      style: {
                        margin: '0 0 var(--spacing-sm) 0',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--text-color-secondary)',
                        textTransform: 'capitalize'
                      }
                    },
                    monthData.name
                  ),
                  React.createElement(
                    'div',
                    {
                      key: 'month-events',
                      style: {
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--spacing-xs)'
                      }
                    },
                    monthData.events.map(event =>
                      React.createElement(
                        'div',
                        {
                          key: event.id,
                          className: 'event-selector-item',
                          style: {
                            padding: 'var(--spacing-sm)',
                            backgroundColor: event.id === currentEventId ? 
                              'rgba(var(--primary-color-rgb, 45, 75, 148), 0.1)' : 
                              'var(--card-bg)',
                            border: event.id === currentEventId ? 
                              '2px solid var(--primary-color)' : 
                              '1px solid var(--border-color)',
                            borderRadius: 'var(--border-radius-md)',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)'
                          },
                          onClick: () => onSelect(event),
                          onMouseEnter: (e) => {
                            if (event.id !== currentEventId) {
                              e.currentTarget.style.borderColor = 'var(--primary-color)';
                              e.currentTarget.style.backgroundColor = 'var(--hover-color)';
                            }
                          },
                          onMouseLeave: (e) => {
                            if (event.id !== currentEventId) {
                              e.currentTarget.style.borderColor = 'var(--border-color)';
                              e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                            }
                          }
                        },
                        [
                          React.createElement(
                            'div',
                            {
                              key: 'event-content',
                              style: {
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 'var(--spacing-sm)'
                              }
                            },
                            [
                              React.createElement(
                                'div',
                                {
                                  key: 'color-indicator',
                                  style: {
                                    width: '4px',
                                    height: '40px',
                                    backgroundColor: event.color || 'var(--primary-color)',
                                    borderRadius: 'var(--border-radius-sm)',
                                    flexShrink: 0
                                  }
                                }
                              ),
                              React.createElement(
                                'div',
                                {
                                  key: 'event-details',
                                  style: {
                                    flex: 1
                                  }
                                },
                                [
                                  React.createElement(
                                    'div',
                                    {
                                      key: 'event-title',
                                      style: {
                                        fontWeight: '500',
                                        fontSize: '14px',
                                        color: 'var(--text-color)',
                                        marginBottom: '4px'
                                      }
                                    },
                                    event.title
                                  ),
                                  React.createElement(
                                    'div',
                                    {
                                      key: 'event-date',
                                      style: {
                                        fontSize: '12px',
                                        color: 'var(--text-color-secondary)'
                                      }
                                    },
                                    formatEventDate(event)
                                  )
                                ]
                              ),
                              event.id === currentEventId && React.createElement(
                                'span',
                                {
                                  key: 'check-icon',
                                  className: 'material-icons',
                                  style: {
                                    fontSize: '18px',
                                    color: 'var(--primary-color)'
                                  }
                                },
                                'check_circle'
                              )
                            ]
                          )
                        ]
                      )
                    )
                  )
                ]
              )
            )
        ),
        
        // Footer
        React.createElement(
          'div',
          {
            key: 'footer',
            style: {
              padding: 'var(--spacing-md) var(--spacing-lg)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--spacing-sm)'
            }
          },
          [
            React.createElement(
              'button',
              {
                key: 'cancel',
                onClick: onCancel,
                style: {
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-color-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all var(--transition-fast)'
                }
              },
              'Cancelar'
            ),
            currentEventId && React.createElement(
              'button',
              {
                key: 'unlink',
                onClick: () => onSelect(null),
                style: {
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  backgroundColor: 'var(--danger-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--border-radius-md)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all var(--transition-fast)'
                }
              },
              'Desvincular'
            )
          ]
        )
      ]
    )
  );
}

export default EventSelector;