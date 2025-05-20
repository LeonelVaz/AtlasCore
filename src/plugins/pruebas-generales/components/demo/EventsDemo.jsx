/**
 * EventsDemo.jsx
 * Componente para demostrar el sistema de eventos y comunicación entre plugins
 */

import logger from '../../utils/logger';
import constants from '../../constants';
import { publishDemoEvent, createCommunicationChannel } from '../../api/eventManager';

/**
 * Componente de demostración de eventos
 */
function EventsDemo(props) {
  const React = window.React;
  const { useState, useEffect, useRef } = React;
  
  // Extraer propiedades
  const { core, plugin } = props;
  
  // Referencias
  const channelRef = useRef(null);
  const subscriptionsRef = useRef([]);
  
  // Estados locales
  const [eventList, setEventList] = useState([]);
  const [customEvent, setCustomEvent] = useState('');
  const [customEventData, setCustomEventData] = useState('{}');
  const [channelMessages, setChannelMessages] = useState([]);
  const [channelMessage, setChannelMessage] = useState('');
  const [activeTab, setActiveTab] = useState('system-events');
  const [connectedPlugins, setConnectedPlugins] = useState([]);
  const [isChannelOpen, setIsChannelOpen] = useState(false);
  
  // Efecto para configurar subscripciones a eventos
  useEffect(() => {
    // Publicar evento de vista
    publishDemoEvent(core, plugin, 'events-demo', 'viewed');
    
    // Limpiar eventos anteriores
    setEventList([]);
    
    // Suscripción a eventos del sistema
    const systemEventPatterns = [
      'calendar.*',
      'app.*',
      'storage.*'
    ];
    
    // Añadir suscripciones para eventos del sistema
    systemEventPatterns.forEach(pattern => {
      const unsub = core.events.subscribe(
        plugin.id,
        pattern,
        (data, eventName, sourcePlugin) => {
          handleSystemEvent(eventName, data, sourcePlugin);
        }
      );
      
      subscriptionsRef.current.push(unsub);
    });
    
    // Suscripción a eventos propios
    const ownEventPatterns = [
      'pruebas-generales.*',
      'plugin.*'
    ];
    
    // Añadir suscripciones para eventos propios
    ownEventPatterns.forEach(pattern => {
      const unsub = core.events.subscribe(
        plugin.id,
        pattern,
        (data, eventName, sourcePlugin) => {
          handlePluginEvent(eventName, data, sourcePlugin);
        }
      );
      
      subscriptionsRef.current.push(unsub);
    });
    
    // Obtener plugins conectados
    const activePlugins = core.plugins.getActivePlugins();
    if (Array.isArray(activePlugins)) {
      setConnectedPlugins(
        activePlugins
          .filter(p => p.id !== plugin.id) // Excluir este plugin
          .map(p => ({
            id: p.id,
            name: p.name || p.id,
            hasAPI: Boolean(core.plugins.getPluginAPI(plugin.id, p.id))
          }))
      );
    }
    
    // Limpiar suscripciones al desmontar
    return () => {
      subscriptionsRef.current.forEach(unsub => {
        if (typeof unsub === 'function') {
          unsub();
        }
      });
      
      // Cerrar canal si está abierto
      closeChannel();
    };
  }, [core, plugin]);
  
  /**
   * Manejador para eventos del sistema
   */
  const handleSystemEvent = (eventName, data, sourcePlugin) => {
    // No registrar eventos de log para evitar bucles infinitos
    if (eventName.includes('log.entry')) return;
    
    // Añadir evento a la lista
    addEventToList({
      type: 'system',
      name: eventName,
      source: sourcePlugin,
      data,
      time: Date.now()
    });
  };
  
  /**
   * Manejador para eventos de plugins
   */
  const handlePluginEvent = (eventName, data, sourcePlugin) => {
    // No registrar eventos de log para evitar bucles infinitos
    if (eventName.includes('log.entry')) return;
    
    // Añadir evento a la lista
    addEventToList({
      type: 'plugin',
      name: eventName,
      source: sourcePlugin,
      data,
      time: Date.now()
    });
  };
  
  /**
   * Añadir evento a la lista
   */
  const addEventToList = (event) => {
    setEventList(prevList => {
      // Limitar a los últimos 50 eventos
      const newList = [event, ...prevList];
      if (newList.length > 50) {
        return newList.slice(0, 50);
      }
      return newList;
    });
  };
  
  /**
   * Publicar evento personalizado
   */
  const handlePublishEvent = () => {
    if (!customEvent) {
      logger.warn('Nombre de evento no especificado');
      return;
    }
    
    try {
      // Intentar parsear datos JSON
      const data = customEventData ? JSON.parse(customEventData) : {};
      
      // Publicar evento
      core.events.publish(
        plugin.id,
        customEvent,
        data
      );
      
      logger.info(`Evento personalizado publicado: ${customEvent}`);
      
      // Limpiar campos
      setCustomEvent('');
      setCustomEventData('{}');
    } catch (error) {
      logger.error('Error al publicar evento:', error);
    }
  };
  
  /**
   * Abrir canal de comunicación
   */
  const openChannel = () => {
    // Si ya hay un canal abierto, cerrarlo primero
    closeChannel();
    
    try {
      // Nombre del canal con timestamp para hacerlo único
      const channelName = `demo-channel-${Date.now()}`;
      
      // Crear canal
      const channel = createCommunicationChannel(core, plugin, channelName);
      
      if (channel) {
        channelRef.current = channel;
        setIsChannelOpen(true);
        
        // Suscribirse al canal
        const unsub = channel.subscribe(message => {
          // Añadir mensaje a la lista
          setChannelMessages(prevMessages => {
            const newMessages = [...prevMessages, {
              content: message,
              time: Date.now()
            }];
            
            // Limitar a los últimos 50 mensajes
            if (newMessages.length > 50) {
              return newMessages.slice(-50);
            }
            
            return newMessages;
          });
        });
        
        // Guardar la función de cancelación
        subscriptionsRef.current.push(unsub);
        
        logger.info(`Canal de comunicación abierto: ${channelName}`);
      } else {
        logger.error('Error al abrir canal de comunicación');
      }
    } catch (error) {
      logger.error('Error al crear canal:', error);
    }
  };
  
  /**
   * Cerrar canal de comunicación
   */
  const closeChannel = () => {
    if (channelRef.current) {
      try {
        channelRef.current.close();
        logger.info('Canal de comunicación cerrado');
      } catch (error) {
        logger.warn('Error al cerrar canal:', error);
      }
      
      channelRef.current = null;
      setIsChannelOpen(false);
      setChannelMessages([]);
    }
  };
  
  /**
   * Publicar mensaje en el canal
   */
  const handlePublishMessage = () => {
    if (!channelRef.current || !channelMessage) {
      return;
    }
    
    try {
      // Publicar mensaje
      channelRef.current.publish({
        text: channelMessage,
        sender: plugin.id,
        timestamp: Date.now()
      });
      
      // Limpiar campo
      setChannelMessage('');
    } catch (error) {
      logger.error('Error al publicar mensaje:', error);
    }
  };
  
  /**
   * Manejador para cambio de pestaña
   */
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  /**
   * Renderizar lista de eventos
   */
  const renderEventList = () => {
    if (eventList.length === 0) {
      return React.createElement(
        'div',
        { className: 'pg-empty-list' },
        'No hay eventos registrados. Interactúa con la aplicación para generar eventos.'
      );
    }
    
    return React.createElement(
      'ul',
      { className: 'pg-event-list' },
      eventList.map((event, index) => React.createElement(
        'li',
        {
          key: `event-${index}`,
          className: `pg-event-item pg-event-${event.type}`
        },
        [
          React.createElement(
            'div',
            { key: 'header', className: 'pg-event-header' },
            [
              React.createElement(
                'span',
                { key: 'name', className: 'pg-event-name' },
                event.name
              ),
              React.createElement(
                'span',
                { key: 'time', className: 'pg-event-time' },
                new Date(event.time).toLocaleTimeString()
              )
            ]
          ),
          React.createElement(
            'div',
            { key: 'meta', className: 'pg-event-meta' },
            `Fuente: ${event.source || 'desconocida'}`
          ),
          React.createElement(
            'pre',
            { key: 'data', className: 'pg-event-data' },
            JSON.stringify(event.data, null, 2)
          )
        ]
      ))
    );
  };
  
  /**
   * Renderizar pestaña de eventos del sistema
   */
  const renderSystemEventsTab = () => {
    return React.createElement(
      'div',
      { className: 'pg-tab-content' },
      [
        React.createElement(
          'div',
          { key: 'info', className: 'pg-tab-info' },
          [
            React.createElement('h3', { key: 'title' }, 'Eventos del sistema'),
            React.createElement(
              'p',
              { key: 'desc' },
              'Esta vista muestra eventos del sistema en tiempo real. Interactúa con la aplicación para generar eventos.'
            )
          ]
        ),
        React.createElement(
          'div',
          { key: 'events', className: 'pg-events-container' },
          renderEventList()
        )
      ]
    );
  };
  
  /**
   * Renderizar pestaña de eventos personalizados
   */
  const renderCustomEventsTab = () => {
    return React.createElement(
      'div',
      { className: 'pg-tab-content' },
      [
        React.createElement(
          'div',
          { key: 'publisher', className: 'pg-event-publisher' },
          [
            React.createElement('h3', { key: 'title' }, 'Publicar evento personalizado'),
            
            // Campo: Nombre del evento
            React.createElement(
              'div',
              { key: 'event-name', className: 'pg-input-group' },
              [
                React.createElement('label', { key: 'label', htmlFor: 'event-name' }, 'Nombre del evento:'),
                React.createElement(
                  'input',
                  {
                    key: 'input',
                    type: 'text',
                    id: 'event-name',
                    className: 'pg-input',
                    value: customEvent,
                    onChange: (e) => setCustomEvent(e.target.value),
                    placeholder: 'pruebas-generales.mi-evento'
                  }
                )
              ]
            ),
            
            // Campo: Datos del evento
            React.createElement(
              'div',
              { key: 'event-data', className: 'pg-input-group' },
              [
                React.createElement('label', { key: 'label', htmlFor: 'event-data' }, 'Datos (JSON):'),
                React.createElement(
                  'textarea',
                  {
                    key: 'input',
                    id: 'event-data',
                    className: 'pg-textarea',
                    value: customEventData,
                    onChange: (e) => setCustomEventData(e.target.value),
                    rows: 5
                  }
                )
              ]
            ),
            
            // Botón para publicar
            React.createElement(
              'button',
              {
                key: 'publish',
                className: 'pg-button pg-button-primary',
                onClick: handlePublishEvent
              },
              'Publicar evento'
            )
          ]
        ),
        
        // Lista de eventos
        React.createElement(
          'div',
          { key: 'events', className: 'pg-events-container' },
          [
            React.createElement('h3', { key: 'title' }, 'Eventos recibidos'),
            renderEventList()
          ]
        )
      ]
    );
  };
  
  /**
   * Renderizar pestaña de canal de comunicación
   */
  const renderChannelTab = () => {
    return React.createElement(
      'div',
      { className: 'pg-tab-content' },
      [
        React.createElement(
          'div',
          { key: 'channel-controls', className: 'pg-channel-controls' },
          isChannelOpen
            ? [
                React.createElement(
                  'div',
                  { key: 'status', className: 'pg-channel-status pg-channel-open' },
                  'Canal abierto'
                ),
                React.createElement(
                  'button',
                  {
                    key: 'close',
                    className: 'pg-button pg-button-danger',
                    onClick: closeChannel
                  },
                  'Cerrar canal'
                )
              ]
            : [
                React.createElement(
                  'div',
                  { key: 'status', className: 'pg-channel-status pg-channel-closed' },
                  'Canal cerrado'
                ),
                React.createElement(
                  'button',
                  {
                    key: 'open',
                    className: 'pg-button pg-button-primary',
                    onClick: openChannel
                  },
                  'Abrir nuevo canal'
                )
              ]
        ),
        
        isChannelOpen && React.createElement(
          'div',
          { key: 'message-composer', className: 'pg-message-composer' },
          [
            React.createElement(
              'input',
              {
                key: 'input',
                type: 'text',
                className: 'pg-input',
                value: channelMessage,
                onChange: (e) => setChannelMessage(e.target.value),
                placeholder: 'Escribe un mensaje...',
                onKeyDown: (e) => e.key === 'Enter' && handlePublishMessage()
              }
            ),
            React.createElement(
              'button',
              {
                key: 'send',
                className: 'pg-button pg-button-primary',
                onClick: handlePublishMessage
              },
              'Enviar'
            )
          ]
        ),
        
        React.createElement(
          'div',
          { key: 'messages', className: 'pg-channel-messages' },
          channelMessages.length > 0
            ? React.createElement(
                'ul',
                { className: 'pg-message-list' },
                channelMessages.map((msg, index) => React.createElement(
                  'li',
                  { key: `msg-${index}`, className: 'pg-message-item' },
                  [
                    React.createElement(
                      'div',
                      { key: 'header', className: 'pg-message-header' },
                      [
                        React.createElement(
                          'span',
                          { key: 'sender', className: 'pg-message-sender' },
                          msg.content.sender === plugin.id ? 'Tú' : msg.content.sender
                        ),
                        React.createElement(
                          'span',
                          { key: 'time', className: 'pg-message-time' },
                          new Date(msg.time).toLocaleTimeString()
                        )
                      ]
                    ),
                    React.createElement(
                      'div',
                      { key: 'content', className: 'pg-message-content' },
                      msg.content.text
                    )
                  ]
                ))
              )
            : React.createElement(
                'div',
                { className: 'pg-empty-list' },
                isChannelOpen
                  ? 'No hay mensajes. Envía el primer mensaje.'
                  : 'Abre un canal para comenzar a enviar mensajes.'
              )
        )
      ]
    );
  };
  
  /**
   * Renderizar pestaña de comunicación entre plugins
   */
  const renderPluginCommunicationTab = () => {
    return React.createElement(
      'div',
      { className: 'pg-tab-content' },
      [
        React.createElement(
          'div',
          { key: 'info', className: 'pg-tab-info' },
          [
            React.createElement('h3', { key: 'title' }, 'Comunicación entre plugins'),
            React.createElement(
              'p',
              { key: 'desc' },
              'Esta vista muestra los plugins activos y permite interactuar con sus APIs.'
            )
          ]
        ),
        
        // Lista de plugins
        React.createElement(
          'div',
          { key: 'plugins', className: 'pg-plugins-list' },
          connectedPlugins.length > 0
            ? connectedPlugins.map(p => React.createElement(
                'div',
                { key: p.id, className: 'pg-plugin-item' },
                [
                  React.createElement(
                    'div',
                    { key: 'info', className: 'pg-plugin-info' },
                    [
                      React.createElement('h4', { key: 'name' }, p.name),
                      React.createElement('code', { key: 'id' }, p.id),
                      React.createElement(
                        'span',
                        {
                          key: 'api',
                          className: `pg-api-status ${p.hasAPI ? 'pg-api-available' : 'pg-api-unavailable'}`
                        },
                        p.hasAPI ? 'API disponible' : 'Sin API pública'
                      )
                    ]
                  ),
                  
                  // Acciones
                  React.createElement(
                    'div',
                    { key: 'actions', className: 'pg-plugin-actions' },
                    [
                      React.createElement(
                        'button',
                        {
                          key: 'call-api',
                          className: 'pg-button pg-button-small',
                          disabled: !p.hasAPI,
                          onClick: () => handleCallPluginAPI(p.id)
                        },
                        'Llamar API'
                      ),
                      React.createElement(
                        'button',
                        {
                          key: 'send-event',
                          className: 'pg-button pg-button-small',
                          onClick: () => handleSendEventToPlugin(p.id)
                        },
                        'Enviar Evento'
                      )
                    ]
                  )
                ]
              ))
            : React.createElement(
                'div',
                { className: 'pg-empty-list' },
                'No hay otros plugins activos.'
              )
        )
      ]
    );
  };
  
  /**
   * Manejador para llamar a la API de otro plugin
   */
  const handleCallPluginAPI = (pluginId) => {
    try {
      // Obtener API del plugin
      const api = core.plugins.getPluginAPI(plugin.id, pluginId);
      
      if (!api) {
        logger.warn(`El plugin ${pluginId} no tiene API pública`);
        return;
      }
      
      // Obtener información del plugin (si está disponible)
      if (typeof api.getPluginInfo === 'function') {
        const info = api.getPluginInfo();
        logger.info(`Información del plugin ${pluginId}:`, info);
        
        // Añadir evento para mostrar la llamada
        addEventToList({
          type: 'plugin',
          name: 'plugin.api.called',
          source: plugin.id,
          data: {
            target: pluginId,
            method: 'getPluginInfo',
            result: info
          },
          time: Date.now()
        });
      } else {
        // Intentar otro método común
        const methods = Object.keys(api);
        
        if (methods.length > 0) {
          // Llamar al primer método disponible
          const method = methods[0];
          try {
            const result = api[method]();
            logger.info(`Llamada al método ${method} del plugin ${pluginId}:`, result);
            
            // Añadir evento para mostrar la llamada
            addEventToList({
              type: 'plugin',
              name: 'plugin.api.called',
              source: plugin.id,
              data: {
                target: pluginId,
                method,
                result
              },
              time: Date.now()
            });
          } catch (error) {
            logger.warn(`Error al llamar método ${method}:`, error);
          }
        } else {
          logger.warn(`El plugin ${pluginId} no tiene métodos disponibles`);
        }
      }
    } catch (error) {
      logger.error(`Error al llamar a la API del plugin ${pluginId}:`, error);
    }
  };
  
  /**
   * Manejador para enviar evento a otro plugin
   */
  const handleSendEventToPlugin = (pluginId) => {
    try {
      // Crear un evento personalizado dirigido al plugin
      const eventName = `${plugin.id}.message.to.${pluginId}`;
      
      // Datos del evento
      const eventData = {
        message: `Hola desde ${plugin.id}`,
        timestamp: Date.now(),
        targetPlugin: pluginId
      };
      
      // Publicar evento
      core.events.publish(
        plugin.id,
        eventName,
        eventData
      );
      
      logger.info(`Evento enviado a ${pluginId}:`, eventData);
    } catch (error) {
      logger.error(`Error al enviar evento a ${pluginId}:`, error);
    }
  };
  
  // Renderizar demostración de eventos
  return React.createElement(
    'div',
    { className: 'pg-events-demo' },
    [
      // Pestañas
      React.createElement(
        'div',
        { key: 'tabs', className: 'pg-tabs' },
        [
          React.createElement(
            'div',
            {
              key: 'system-events',
              className: `pg-tab ${activeTab === 'system-events' ? 'pg-tab-active' : ''}`,
              onClick: () => handleTabChange('system-events')
            },
            'Eventos del sistema'
          ),
          React.createElement(
            'div',
            {
              key: 'custom-events',
              className: `pg-tab ${activeTab === 'custom-events' ? 'pg-tab-active' : ''}`,
              onClick: () => handleTabChange('custom-events')
            },
            'Eventos personalizados'
          ),
          React.createElement(
            'div',
            {
              key: 'channel',
              className: `pg-tab ${activeTab === 'channel' ? 'pg-tab-active' : ''}`,
              onClick: () => handleTabChange('channel')
            },
            'Canal de comunicación'
          ),
          React.createElement(
            'div',
            {
              key: 'plugin-communication',
              className: `pg-tab ${activeTab === 'plugin-communication' ? 'pg-tab-active' : ''}`,
              onClick: () => handleTabChange('plugin-communication')
            },
            'Comunicación entre plugins'
          )
        ]
      ),
      
      // Contenido de la pestaña activa
      React.createElement(
        'div',
        { key: 'content', className: 'pg-tab-container' },
        activeTab === 'system-events' && renderSystemEventsTab(),
        activeTab === 'custom-events' && renderCustomEventsTab(),
        activeTab === 'channel' && renderChannelTab(),
        activeTab === 'plugin-communication' && renderPluginCommunicationTab()
      )
    ]
  );
}

export default EventsDemo;