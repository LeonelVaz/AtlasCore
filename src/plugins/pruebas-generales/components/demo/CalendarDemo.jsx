/**
 * CalendarDemo.jsx
 * Componente para demostrar interacciones con el calendario
 */

import logger from '../../utils/logger';
import { publishDemoEvent } from '../../api/eventManager';
import { formatDate, generateId } from '../../utils/helpers';

/**
 * Componente de demostración de integración con calendario
 */
function CalendarDemo(props) {
  const React = window.React;
  const { useState, useEffect, useRef } = React;
  
  // Extraer propiedades
  const { core, plugin } = props;
  
  // Estados locales
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [calendarModule, setCalendarModule] = useState(null);
  const [activeTab, setActiveTab] = useState('events');
  
  // Referencia al formulario
  const formRef = useRef(null);
  
  // Estados de formulario
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startDate: formatInputDate(new Date()),
    startTime: '09:00',
    endDate: formatInputDate(new Date()),
    endTime: '10:00',
    color: '#4285f4',
    location: '',
    importance: 0
  });
  
  // Efecto para cargar módulo de calendario y eventos
  useEffect(() => {
    loadCalendarModule();
    
    // Publicar evento de vista
    publishDemoEvent(core, plugin, 'calendar-demo', 'viewed');
    
    // Limpiar al desmontar
    return () => {
      // Limpiar temporizadores, etc.
    };
  }, [core, plugin]);
  
  /**
   * Carga el módulo de calendario y eventos iniciales
   */
  const loadCalendarModule = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Intentar obtener el módulo de calendario
      const module = core.getModule('calendar');
      
      if (!module) {
        throw new Error('Módulo de calendario no disponible');
      }
      
      setCalendarModule(module);
      
      // Cargar eventos
      await loadEvents(module);
    } catch (error) {
      logger.error('Error al cargar módulo de calendario:', error);
      setError('No se pudo acceder al calendario. Verifica que el módulo esté disponible.');
      
      // Datos de ejemplo para demostración
      setEvents(getExampleEvents());
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Carga eventos desde el módulo de calendario
   */
  const loadEvents = async (calModule) => {
    try {
      // Fechas para filtrar (últimos 7 días y próximos 30 días)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      
      // Obtener eventos del período
      const calendarEvents = await calModule.getEventsBetweenDates(startDate, endDate);
      
      if (Array.isArray(calendarEvents)) {
        setEvents(calendarEvents);
      } else {
        // Si no es un array, usar datos de ejemplo
        setEvents(getExampleEvents());
      }
    } catch (error) {
      logger.error('Error al cargar eventos:', error);
      // Usar datos de ejemplo
      setEvents(getExampleEvents());
    }
  };
  
  /**
   * Cambia la pestaña activa
   */
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Limpiar mensajes
    setError(null);
    setSuccessMessage(null);
    
    // Si cambiamos a eventos, recargarlos
    if (tab === 'events' && calendarModule) {
      loadEvents(calendarModule);
    }
  };
  
  /**
   * Manejador para seleccionar un evento
   */
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    
    // Publicar evento de demo
    publishDemoEvent(core, plugin, 'calendar-demo', 'event-selected', {
      eventId: event.id,
      title: event.title
    });
  };
  
  /**
   * Prepara la creación de un nuevo evento
   */
  const handlePrepareNewEvent = () => {
    setIsCreating(true);
    setSelectedEvent(null);
    
    // Hora actual redondeada a la siguiente hora
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    
    const endTime = new Date(nextHour);
    endTime.setHours(endTime.getHours() + 1);
    
    // Restablecer formulario
    setNewEvent({
      title: '',
      description: '',
      startDate: formatInputDate(nextHour),
      startTime: formatInputTime(nextHour),
      endDate: formatInputDate(endTime),
      endTime: formatInputTime(endTime),
      color: '#4285f4',
      location: '',
      importance: 0
    });
    
    // Desplazarse al formulario
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Publicar evento de demo
    publishDemoEvent(core, plugin, 'calendar-demo', 'new-event-prepared');
  };
  
  /**
   * Manejador para campos del formulario
   */
  const handleEventFieldChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    
    setNewEvent(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  /**
   * Crea un nuevo evento
   */
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    
    setError(null);
    setSuccessMessage(null);
    
    // Validar entradas
    if (!newEvent.title.trim()) {
      setError('El título es obligatorio');
      return;
    }
    
    try {
      // Construir objeto de evento
      const eventData = {
        id: generateId('event'),
        title: newEvent.title,
        description: newEvent.description,
        start: combineDateAndTime(newEvent.startDate, newEvent.startTime),
        end: combineDateAndTime(newEvent.endDate, newEvent.endTime),
        location: newEvent.location,
        color: newEvent.color,
        // Metadatos específicos de nuestro plugin
        metadata: {
          importance: parseInt(newEvent.importance, 10) || 0,
          createdBy: plugin.id
        }
      };
      
      // Verificar fechas
      if (new Date(eventData.end) <= new Date(eventData.start)) {
        setError('La fecha/hora de fin debe ser posterior a la de inicio');
        return;
      }
      
      // Crear evento en el calendario (si está disponible)
      if (calendarModule && typeof calendarModule.createEvent === 'function') {
        const createdEvent = await calendarModule.createEvent(eventData);
        
        if (createdEvent) {
          setEvents(prev => [createdEvent, ...prev]);
          setSuccessMessage('Evento creado correctamente');
          setIsCreating(false);
          
          // Publicar evento de demo
          publishDemoEvent(core, plugin, 'calendar-demo', 'event-created', {
            eventId: createdEvent.id,
            title: createdEvent.title
          });
          
          return;
        }
      }
      
      // Si no hay módulo o falló la creación, simular
      setEvents(prev => [eventData, ...prev]);
      setSuccessMessage('Evento creado correctamente (simulado)');
      setIsCreating(false);
      
      // Publicar evento de demo
      publishDemoEvent(core, plugin, 'calendar-demo', 'event-created-simulated', {
        eventId: eventData.id,
        title: eventData.title
      });
    } catch (error) {
      logger.error('Error al crear evento:', error);
      setError('Error al crear evento: ' + error.message);
    }
  };
  
  /**
   * Elimina un evento
   */
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('¿Estás seguro de eliminar este evento?')) {
      return;
    }
    
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Eliminar del calendario si está disponible
      if (calendarModule && typeof calendarModule.deleteEvent === 'function') {
        const success = await calendarModule.deleteEvent(eventId);
        
        if (success) {
          // Actualizar lista local
          setEvents(prev => prev.filter(e => e.id !== eventId));
          
          // Si es el evento seleccionado, deseleccionar
          if (selectedEvent && selectedEvent.id === eventId) {
            setSelectedEvent(null);
          }
          
          setSuccessMessage('Evento eliminado correctamente');
          
          // Publicar evento de demo
          publishDemoEvent(core, plugin, 'calendar-demo', 'event-deleted', {
            eventId
          });
          
          return;
        }
      }
      
      // Si no hay módulo o falló la eliminación, simular
      setEvents(prev => prev.filter(e => e.id !== eventId));
      
      // Si es el evento seleccionado, deseleccionar
      if (selectedEvent && selectedEvent.id === eventId) {
        setSelectedEvent(null);
      }
      
      setSuccessMessage('Evento eliminado correctamente (simulado)');
      
      // Publicar evento de demo
      publishDemoEvent(core, plugin, 'calendar-demo', 'event-deleted-simulated', {
        eventId
      });
    } catch (error) {
      logger.error('Error al eliminar evento:', error);
      setError('Error al eliminar evento: ' + error.message);
    }
  };
  
  /**
   * Combina fecha y hora en un objeto Date
   */
  const combineDateAndTime = (dateStr, timeStr) => {
    const date = new Date(dateStr);
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
  };
  
  /**
   * Formatea fecha para input de tipo date
   */
  function formatInputDate(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    
    return [year, month, day].join('-');
  }
  
  /**
   * Formatea hora para input de tipo time
   */
  function formatInputTime(date) {
    const d = new Date(date);
    let hours = '' + d.getHours();
    let minutes = '' + d.getMinutes();
    
    if (hours.length < 2) hours = '0' + hours;
    if (minutes.length < 2) minutes = '0' + minutes;
    
    return [hours, minutes].join(':');
  }
  
  /**
   * Eventos de ejemplo para demostración
   */
  function getExampleEvents() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const inTwoDays = new Date(now);
    inTwoDays.setDate(inTwoDays.getDate() + 2);
    
    return [
      {
        id: 'demo-event-1',
        title: 'Reunión de equipo',
        description: 'Revisión semanal de proyecto',
        start: new Date(now.setHours(10, 0, 0, 0)).toISOString(),
        end: new Date(now.setHours(11, 0, 0, 0)).toISOString(),
        location: 'Sala de conferencias',
        color: '#4285f4',
        metadata: {
          importance: 2,
          createdBy: plugin.id
        }
      },
      {
        id: 'demo-event-2',
        title: 'Almuerzo con cliente',
        description: 'Discutir nuevos requisitos',
        start: new Date(tomorrow.setHours(13, 0, 0, 0)).toISOString(),
        end: new Date(tomorrow.setHours(14, 30, 0, 0)).toISOString(),
        location: 'Restaurante Central',
        color: '#34a853',
        metadata: {
          importance: 1,
          createdBy: plugin.id
        }
      },
      {
        id: 'demo-event-3',
        title: 'Taller de desarrollo',
        description: 'Introducción a las APIs de Atlas',
        start: new Date(inTwoDays.setHours(15, 0, 0, 0)).toISOString(),
        end: new Date(inTwoDays.setHours(17, 0, 0, 0)).toISOString(),
        location: 'Sala de formación',
        color: '#fbbc05',
        metadata: {
          importance: 1,
          createdBy: plugin.id
        }
      }
    ];
  }
  
  /**
   * Nivel de importancia a texto
   */
  const importanceToText = (level) => {
    switch (parseInt(level, 10)) {
      case 2: return 'Alta';
      case 1: return 'Media';
      case 0:
      default: return 'Normal';
    }
  };
  
  // Renderizar demo de calendario
  return React.createElement(
    'div',
    { className: 'pg-calendar-demo' },
    [
      // Información
      React.createElement(
        'div',
        { key: 'info', className: 'pg-demo-info' },
        [
          React.createElement('h2', { key: 'title' }, 'Demostración de Integración con Calendario'),
          React.createElement(
            'p',
            { key: 'desc' },
            'Esta demostración muestra cómo interactuar con el calendario de Atlas para ver, crear y gestionar eventos.'
          )
        ]
      ),
      
      // Mensajes de estado
      (error || successMessage) && React.createElement(
        'div',
        { 
          key: 'messages',
          className: `pg-messages ${error ? 'pg-messages-error' : 'pg-messages-success'}`
        },
        error || successMessage
      ),
      
      // Pestañas
      React.createElement(
        'div',
        { key: 'tabs', className: 'pg-tabs pg-tabs-large' },
        [
          React.createElement(
            'div',
            {
              key: 'events',
              className: `pg-tab ${activeTab === 'events' ? 'pg-tab-active' : ''}`,
              onClick: () => handleTabChange('events')
            },
            [
              React.createElement(
                'span',
                { key: 'icon', className: 'material-icons' },
                'event_note'
              ),
              React.createElement('span', { key: 'text' }, 'Eventos')
            ]
          ),
          React.createElement(
            'div',
            {
              key: 'create',
              className: `pg-tab ${activeTab === 'create' ? 'pg-tab-active' : ''}`,
              onClick: () => handleTabChange('create')
            },
            [
              React.createElement(
                'span',
                { key: 'icon', className: 'material-icons' },
                'add_circle'
              ),
              React.createElement('span', { key: 'text' }, 'Crear Evento')
            ]
          ),
          React.createElement(
            'div',
            {
              key: 'api',
              className: `pg-tab ${activeTab === 'api' ? 'pg-tab-active' : ''}`,
              onClick: () => handleTabChange('api')
            },
            [
              React.createElement(
                'span',
                { key: 'icon', className: 'material-icons' },
                'code'
              ),
              React.createElement('span', { key: 'text' }, 'API de Calendario')
            ]
          )
        ]
      ),
      
      // Contenido de la pestaña activa
      React.createElement(
        'div',
        { key: 'content', className: 'pg-tab-content' },
        activeTab === 'events' ? 
          // Lista de eventos
          React.createElement(
            'div',
            { className: 'pg-events-panel' },
            [
              // Encabezado con acciones
              React.createElement(
                'div',
                { key: 'header', className: 'pg-panel-header' },
                [
                  React.createElement('h3', { key: 'title' }, 'Eventos del Calendario'),
                  React.createElement(
                    'div',
                    { key: 'actions', className: 'pg-panel-actions' },
                    [
                      React.createElement(
                        'button',
                        {
                          key: 'refresh',
                          className: 'pg-button pg-button-small',
                          onClick: () => loadEvents(calendarModule),
                          disabled: isLoading || !calendarModule
                        },
                        [
                          React.createElement(
                            'span',
                            { key: 'icon', className: 'material-icons pg-icon-small' },
                            'refresh'
                          ),
                          'Actualizar'
                        ]
                      ),
                      React.createElement(
                        'button',
                        {
                          key: 'create',
                          className: 'pg-button pg-button-small pg-button-primary',
                          onClick: handlePrepareNewEvent
                        },
                        [
                          React.createElement(
                            'span',
                            { key: 'icon', className: 'material-icons pg-icon-small' },
                            'add'
                          ),
                          'Nuevo Evento'
                        ]
                      )
                    ]
                  )
                ]
              ),
              
              // Lista de eventos
              React.createElement(
                'div',
                { key: 'list', className: 'pg-events-list' },
                isLoading
                  ? React.createElement(
                      'div',
                      { className: 'pg-loading-small' },
                      'Cargando eventos...'
                    )
                  : events.length > 0
                    ? events.map(event => React.createElement(
                        'div',
                        {
                          key: event.id,
                          className: `pg-event-item ${selectedEvent && selectedEvent.id === event.id ? 'pg-event-active' : ''}`,
                          onClick: () => handleSelectEvent(event),
                          style: { borderLeftColor: event.color || '#4285f4' }
                        },
                        [
                          React.createElement(
                            'div',
                            { key: 'details', className: 'pg-event-details' },
                            [
                              React.createElement('div', { key: 'title', className: 'pg-event-title' }, event.title),
                              React.createElement(
                                'div',
                                { key: 'datetime', className: 'pg-event-datetime' },
                                `${formatDate(event.start, 'datetime')} - ${formatDate(event.end, 'time')}`
                              ),
                              event.location && React.createElement(
                                'div',
                                { key: 'location', className: 'pg-event-location' },
                                React.createElement(
                                  'span',
                                  { className: 'material-icons pg-icon-tiny' },
                                  'location_on'
                                ),
                                event.location
                              )
                            ]
                          ),
                          React.createElement(
                            'div',
                            { key: 'actions', className: 'pg-event-actions' },
                            [
                              React.createElement(
                                'button',
                                {
                                  key: 'delete',
                                  className: 'pg-button-icon',
                                  onClick: (e) => {
                                    e.stopPropagation();
                                    handleDeleteEvent(event.id);
                                  },
                                  title: 'Eliminar evento'
                                },
                                React.createElement(
                                  'span',
                                  { className: 'material-icons' },
                                  'delete'
                                )
                              )
                            ]
                          )
                        ]
                      ))
                    : React.createElement(
                        'div',
                        { className: 'pg-empty-list' },
                        'No hay eventos próximos. Crea uno nuevo haciendo clic en "Nuevo Evento".'
                      )
              ),
              
              // Detalles del evento seleccionado
              selectedEvent && React.createElement(
                'div',
                { key: 'details', className: 'pg-event-full-details' },
                [
                  React.createElement('h3', { key: 'title', className: 'pg-details-title' }, selectedEvent.title),
                  
                  // Fecha y hora
                  React.createElement(
                    'div',
                    { key: 'datetime', className: 'pg-details-section' },
                    [
                      React.createElement(
                        'span',
                        { key: 'icon', className: 'material-icons pg-details-icon' },
                        'schedule'
                      ),
                      React.createElement(
                        'div',
                        { key: 'content' },
                        [
                          React.createElement(
                            'div',
                            { key: 'start' },
                            `Inicio: ${formatDate(selectedEvent.start, 'long')} ${formatDate(selectedEvent.start, 'time')}`
                          ),
                          React.createElement(
                            'div',
                            { key: 'end' },
                            `Fin: ${formatDate(selectedEvent.end, 'long')} ${formatDate(selectedEvent.end, 'time')}`
                          )
                        ]
                      )
                    ]
                  ),
                  
                  // Ubicación (si existe)
                  selectedEvent.location && React.createElement(
                    'div',
                    { key: 'location', className: 'pg-details-section' },
                    [
                      React.createElement(
                        'span',
                        { key: 'icon', className: 'material-icons pg-details-icon' },
                        'location_on'
                      ),
                      React.createElement('div', { key: 'content' }, selectedEvent.location)
                    ]
                  ),
                  
                  // Descripción (si existe)
                  selectedEvent.description && React.createElement(
                    'div',
                    { key: 'description', className: 'pg-details-section' },
                    [
                      React.createElement(
                        'span',
                        { key: 'icon', className: 'material-icons pg-details-icon' },
                        'description'
                      ),
                      React.createElement('div', { key: 'content' }, selectedEvent.description)
                    ]
                  ),
                  
                  // Metadatos (importancia)
                  selectedEvent.metadata && typeof selectedEvent.metadata.importance !== 'undefined' && React.createElement(
                    'div',
                    { key: 'importance', className: 'pg-details-section' },
                    [
                      React.createElement(
                        'span',
                        { key: 'icon', className: 'material-icons pg-details-icon' },
                        selectedEvent.metadata.importance >= 2 ? 'priority_high' : 'low_priority'
                      ),
                      React.createElement(
                        'div',
                        { key: 'content' },
                        `Importancia: ${importanceToText(selectedEvent.metadata.importance)}`
                      )
                    ]
                  ),
                  
                  // ID del evento
                  React.createElement(
                    'div',
                    { key: 'id', className: 'pg-details-small' },
                    `ID: ${selectedEvent.id}`
                  )
                ]
              )
            ]
          )
        : activeTab === 'create' ?
          // Formulario de creación
          React.createElement(
            'div',
            { className: 'pg-create-panel', ref: formRef },
            [
              // Encabezado
              React.createElement(
                'div',
                { key: 'header', className: 'pg-panel-header' },
                React.createElement('h3', { key: 'title' }, 'Crear Nuevo Evento')
              ),
              
              // Formulario
              React.createElement(
                'form',
                {
                  key: 'form',
                  className: 'pg-event-form',
                  onSubmit: handleCreateEvent
                },
                [
                  // Título
                  React.createElement(
                    'div',
                    { key: 'title', className: 'pg-form-group' },
                    [
                      React.createElement('label', { key: 'label', htmlFor: 'event-title' }, 'Título:'),
                      React.createElement(
                        'input',
                        {
                          key: 'input',
                          type: 'text',
                          id: 'event-title',
                          className: 'pg-input',
                          value: newEvent.title,
                          onChange: handleEventFieldChange('title'),
                          placeholder: 'Título del evento',
                          required: true
                        }
                      )
                    ]
                  ),
                  
                  // Descripción
                  React.createElement(
                    'div',
                    { key: 'description', className: 'pg-form-group' },
                    [
                      React.createElement('label', { key: 'label', htmlFor: 'event-description' }, 'Descripción:'),
                      React.createElement(
                        'textarea',
                        {
                          key: 'input',
                          id: 'event-description',
                          className: 'pg-textarea',
                          value: newEvent.description,
                          onChange: handleEventFieldChange('description'),
                          placeholder: 'Descripción del evento',
                          rows: 3
                        }
                      )
                    ]
                  ),
                  
                  // Fechas (inicio y fin)
                  React.createElement(
                    'div',
                    { key: 'dates', className: 'pg-form-row' },
                    [
                      // Fecha de inicio
                      React.createElement(
                        'div',
                        { key: 'start-date', className: 'pg-form-group' },
                        [
                          React.createElement('label', { key: 'label', htmlFor: 'event-start-date' }, 'Fecha inicio:'),
                          React.createElement(
                            'input',
                            {
                              key: 'input',
                              type: 'date',
                              id: 'event-start-date',
                              className: 'pg-input',
                              value: newEvent.startDate,
                              onChange: handleEventFieldChange('startDate'),
                              required: true
                            }
                          )
                        ]
                      ),
                      
                      // Hora de inicio
                      React.createElement(
                        'div',
                        { key: 'start-time', className: 'pg-form-group' },
                        [
                          React.createElement('label', { key: 'label', htmlFor: 'event-start-time' }, 'Hora inicio:'),
                          React.createElement(
                            'input',
                            {
                              key: 'input',
                              type: 'time',
                              id: 'event-start-time',
                              className: 'pg-input',
                              value: newEvent.startTime,
                              onChange: handleEventFieldChange('startTime'),
                              required: true
                            }
                          )
                        ]
                      )
                    ]
                  ),
                  
                  React.createElement(
                    'div',
                    { key: 'dates-end', className: 'pg-form-row' },
                    [
                      // Fecha de fin
                      React.createElement(
                        'div',
                        { key: 'end-date', className: 'pg-form-group' },
                        [
                          React.createElement('label', { key: 'label', htmlFor: 'event-end-date' }, 'Fecha fin:'),
                          React.createElement(
                            'input',
                            {
                              key: 'input',
                              type: 'date',
                              id: 'event-end-date',
                              className: 'pg-input',
                              value: newEvent.endDate,
                              onChange: handleEventFieldChange('endDate'),
                              required: true
                            }
                          )
                        ]
                      ),
                      
                      // Hora de fin
                      React.createElement(
                        'div',
                        { key: 'end-time', className: 'pg-form-group' },
                        [
                          React.createElement('label', { key: 'label', htmlFor: 'event-end-time' }, 'Hora fin:'),
                          React.createElement(
                            'input',
                            {
                              key: 'input',
                              type: 'time',
                              id: 'event-end-time',
                              className: 'pg-input',
                              value: newEvent.endTime,
                              onChange: handleEventFieldChange('endTime'),
                              required: true
                            }
                          )
                        ]
                      )
                    ]
                  ),
                  
                  // Ubicación y color
                  React.createElement(
                    'div',
                    { key: 'location-color', className: 'pg-form-row' },
                    [
                      // Ubicación
                      React.createElement(
                        'div',
                        { key: 'location', className: 'pg-form-group' },
                        [
                          React.createElement('label', { key: 'label', htmlFor: 'event-location' }, 'Ubicación:'),
                          React.createElement(
                            'input',
                            {
                              key: 'input',
                              type: 'text',
                              id: 'event-location',
                              className: 'pg-input',
                              value: newEvent.location,
                              onChange: handleEventFieldChange('location'),
                              placeholder: 'Ubicación (opcional)'
                            }
                          )
                        ]
                      ),
                      
                      // Color
                      React.createElement(
                        'div',
                        { key: 'color', className: 'pg-form-group' },
                        [
                          React.createElement('label', { key: 'label', htmlFor: 'event-color' }, 'Color:'),
                          React.createElement(
                            'input',
                            {
                              key: 'input',
                              type: 'color',
                              id: 'event-color',
                              className: 'pg-input pg-input-color',
                              value: newEvent.color,
                              onChange: handleEventFieldChange('color')
                            }
                          )
                        ]
                      )
                    ]
                  ),
                  
                  // Importancia
                  React.createElement(
                    'div',
                    { key: 'importance', className: 'pg-form-group' },
                    [
                      React.createElement('label', { key: 'label', htmlFor: 'event-importance' }, 'Importancia:'),
                      React.createElement(
                        'select',
                        {
                          key: 'select',
                          id: 'event-importance',
                          className: 'pg-select',
                          value: newEvent.importance,
                          onChange: handleEventFieldChange('importance')
                        },
                        [
                          React.createElement('option', { key: '0', value: 0 }, 'Normal'),
                          React.createElement('option', { key: '1', value: 1 }, 'Media'),
                          React.createElement('option', { key: '2', value: 2 }, 'Alta')
                        ]
                      )
                    ]
                  ),
                  
                  // Botones
                  React.createElement(
                    'div',
                    { key: 'buttons', className: 'pg-form-buttons' },
                    [
                      React.createElement(
                        'button',
                        {
                          key: 'submit',
                          type: 'submit',
                          className: 'pg-button pg-button-primary',
                          disabled: isLoading
                        },
                        'Crear Evento'
                      ),
                      React.createElement(
                        'button',
                        {
                          key: 'cancel',
                          type: 'button',
                          className: 'pg-button',
                          onClick: () => setIsCreating(false)
                        },
                        'Cancelar'
                      )
                    ]
                  )
                ]
              )
            ]
          )
        : 
          // Documentación de API
          React.createElement(
            'div',
            { className: 'pg-api-panel' },
            [
              React.createElement('h3', { key: 'title' }, 'API de Calendario'),
              React.createElement(
                'p',
                { key: 'intro' },
                'El módulo de calendario proporciona APIs para interactuar con eventos y vistas de calendario en Atlas.'
              ),
              
              React.createElement(
                'div',
                { key: 'api-docs', className: 'pg-api-docs' },
                [
                  // Método: getEventsForDate
                  React.createElement(
                    'div',
                    { key: 'method-1', className: 'pg-api-method' },
                    [
                      React.createElement('h4', { key: 'title' }, 'getEventsForDate(date)'),
                      React.createElement(
                        'p',
                        { key: 'desc' },
                        'Obtiene los eventos para una fecha específica.'
                      ),
                      React.createElement(
                        'div',
                        { key: 'params', className: 'pg-api-params' },
                        [
                          React.createElement('div', { key: 'param-title' }, 'Parámetros:'),
                          React.createElement('code', { key: 'param' }, 'date: Date - Fecha para la que obtener eventos')
                        ]
                      ),
                      React.createElement(
                        'div',
                        { key: 'returns', className: 'pg-api-returns' },
                        [
                          React.createElement('div', { key: 'returns-title' }, 'Retorna:'),
                          React.createElement('code', { key: 'return' }, 'Array<Event> - Lista de eventos para la fecha')
                        ]
                      ),
                      React.createElement(
                        'div',
                        { key: 'example', className: 'pg-api-example' },
                        [
                          React.createElement('div', { key: 'example-title' }, 'Ejemplo:'),
                          React.createElement(
                            'pre',
                            { key: 'code' },
                            `const events = calendar.getEventsForDate(new Date());
console.log(\`Hay \${events.length} eventos hoy\`);`
                          )
                        ]
                      )
                    ]
                  ),
                  
                  // Método: getEventsBetweenDates
                  React.createElement(
                    'div',
                    { key: 'method-2', className: 'pg-api-method' },
                    [
                      React.createElement('h4', { key: 'title' }, 'getEventsBetweenDates(startDate, endDate)'),
                      React.createElement(
                        'p',
                        { key: 'desc' },
                        'Obtiene los eventos entre dos fechas.'
                      ),
                      React.createElement(
                        'div',
                        { key: 'params', className: 'pg-api-params' },
                        [
                          React.createElement('div', { key: 'param-title' }, 'Parámetros:'),
                          React.createElement('code', { key: 'param1' }, 'startDate: Date - Fecha de inicio'),
                          React.createElement('code', { key: 'param2' }, 'endDate: Date - Fecha de fin')
                        ]
                      ),
                      React.createElement(
                        'div',
                        { key: 'returns', className: 'pg-api-returns' },
                        [
                          React.createElement('div', { key: 'returns-title' }, 'Retorna:'),
                          React.createElement('code', { key: 'return' }, 'Array<Event> - Lista de eventos en el rango de fechas')
                        ]
                      )
                    ]
                  ),
                  
                  // Método: createEvent
                  React.createElement(
                    'div',
                    { key: 'method-3', className: 'pg-api-method' },
                    [
                      React.createElement('h4', { key: 'title' }, 'createEvent(eventData)'),
                      React.createElement(
                        'p',
                        { key: 'desc' },
                        'Crea un nuevo evento en el calendario.'
                      ),
                      React.createElement(
                        'div',
                        { key: 'params', className: 'pg-api-params' },
                        [
                          React.createElement('div', { key: 'param-title' }, 'Parámetros:'),
                          React.createElement('code', { key: 'param' }, 'eventData: Object - Datos del evento a crear')
                        ]
                      ),
                      React.createElement(
                        'div',
                        { key: 'returns', className: 'pg-api-returns' },
                        [
                          React.createElement('div', { key: 'returns-title' }, 'Retorna:'),
                          React.createElement('code', { key: 'return' }, 'Promise<Event> - Evento creado')
                        ]
                      )
                    ]
                  ),
                  
                  // Método: updateEvent
                  React.createElement(
                    'div',
                    { key: 'method-4', className: 'pg-api-method' },
                    [
                      React.createElement('h4', { key: 'title' }, 'updateEvent(eventId, eventData)'),
                      React.createElement(
                        'p',
                        { key: 'desc' },
                        'Actualiza un evento existente.'
                      ),
                      React.createElement(
                        'div',
                        { key: 'params', className: 'pg-api-params' },
                        [
                          React.createElement('div', { key: 'param-title' }, 'Parámetros:'),
                          React.createElement('code', { key: 'param1' }, 'eventId: string - ID del evento a actualizar'),
                          React.createElement('code', { key: 'param2' }, 'eventData: Object - Nuevos datos del evento')
                        ]
                      ),
                      React.createElement(
                        'div',
                        { key: 'returns', className: 'pg-api-returns' },
                        [
                          React.createElement('div', { key: 'returns-title' }, 'Retorna:'),
                          React.createElement('code', { key: 'return' }, 'Promise<Event> - Evento actualizado')
                        ]
                      )
                    ]
                  ),
                  
                  // Método: deleteEvent
                  React.createElement(
                    'div',
                    { key: 'method-5', className: 'pg-api-method' },
                    [
                      React.createElement('h4', { key: 'title' }, 'deleteEvent(eventId)'),
                      React.createElement(
                        'p',
                        { key: 'desc' },
                        'Elimina un evento del calendario.'
                      ),
                      React.createElement(
                        'div',
                        { key: 'params', className: 'pg-api-params' },
                        [
                          React.createElement('div', { key: 'param-title' }, 'Parámetros:'),
                          React.createElement('code', { key: 'param' }, 'eventId: string - ID del evento a eliminar')
                        ]
                      ),
                      React.createElement(
                        'div',
                        { key: 'returns', className: 'pg-api-returns' },
                        [
                          React.createElement('div', { key: 'returns-title' }, 'Retorna:'),
                          React.createElement('code', { key: 'return' }, 'Promise<boolean> - true si se eliminó correctamente')
                        ]
                      )
                    ]
                  )
                ]
              )
            ]
          )
      ),
      
      // Instrucciones
      React.createElement(
        'div',
        { key: 'instructions', className: 'pg-instructions' },
        [
          React.createElement('h3', { key: 'title' }, 'Cómo integrar con el calendario'),
          React.createElement(
            'p',
            { key: 'desc' },
            'Para integrar tu plugin con el calendario de Atlas, primero debes obtener acceso al módulo de calendario:'
          ),
          React.createElement(
            'pre',
            { key: 'code', className: 'pg-code-block' },
            `// En la función init de tu plugin
init: function(core) {
  // Obtener módulo de calendario
  const calendarModule = core.getModule('calendar');
  
  if (calendarModule) {
    // Usar APIs del calendario
    calendarModule.getEventsForDate(new Date())
      .then(events => {
        // Procesar eventos
      });
  }
}`
          ),
          React.createElement(
            'p',
            { key: 'note' },
            'Nota: Los plugins pueden añadir metadatos personalizados a los eventos mediante la propiedad "metadata".'
          )
        ]
      )
    ]
  );
}

export default CalendarDemo;