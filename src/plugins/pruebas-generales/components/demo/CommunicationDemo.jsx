/**
 * CommunicationDemo.jsx
 * Componente para demostrar la comunicación entre plugins
 */

import logger from '../../utils/logger';
import { publishDemoEvent, createCommunicationChannel } from '../../api/eventManager';

/**
 * Componente de demostración de comunicación entre plugins
 */
function CommunicationDemo(props) {
  const React = require('react');
  const { useState, useEffect, useRef } = React;
  
  // Extraer propiedades
  const { core, plugin } = props;
  
  // Estados locales
  const [activePlugins, setActivePlugins] = useState([]);
  const [channelMessages, setChannelMessages] = useState([]);
  const [channelName, setChannelName] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isChannelActive, setIsChannelActive] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('plugins');
  const [apiCalls, setApiCalls] = useState([]);
  
  // Referencias
  const channelRef = useRef(null);
  const messageEndRef = useRef(null);
  
  // Efecto para cargar plugins activos
  useEffect(() => {
    loadActivePlugins();
    
    // Nombre de canal único con timestamp
    setChannelName(`demo-channel-${Date.now()}`);
    
    // Publicar evento de vista
    publishDemoEvent(core, plugin, 'communication-demo', 'viewed');
    
    // Limpiar al desmontar
    return () => {
      closeChannel();
    };
  }, [core, plugin]);
  
  // Efecto para desplazar a último mensaje
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [channelMessages]);
  
  /**
   * Carga la lista de plugins activos
   */
  const loadActivePlugins = () => {
    try {
      // Obtener plugins activos
      const plugins = core.plugins.getActivePlugins();
      
      if (Array.isArray(plugins)) {
        // Filtrar plugins y añadir información adicional
        const filteredPlugins = plugins
          .filter(p => p.id !== plugin.id) // Excluir este plugin
          .map(p => ({
            id: p.id,
            name: p.name || p.id,
            hasAPI: Boolean(core.plugins.getPluginAPI(plugin.id, p.id))
          }));
        
        setActivePlugins(filteredPlugins);
      } else {
        setActivePlugins([]);
      }
    } catch (error) {
      logger.error('Error al cargar plugins activos:', error);
      setError('No se pudieron cargar los plugins activos');
    }
  };
  
  /**
   * Crea un canal de comunicación
   */
  const createChannel = () => {
    // Validar nombre de canal
    if (!channelName.trim()) {
      setError('El nombre del canal no puede estar vacío');
      return;
    }
    
    try {
      // Cerrar canal existente si hay
      closeChannel();
      
      // Crear nuevo canal
      const channel = createCommunicationChannel(core, plugin, channelName);
      
      if (!channel) {
        throw new Error('No se pudo crear el canal');
      }
      
      // Guardar referencia
      channelRef.current = channel;
      setIsChannelActive(true);
      
      // Limpiar mensajes anteriores
      setChannelMessages([]);
      
      // Suscribirse a mensajes
      channel.subscribe(message => {
        // Añadir mensaje recibido
        setChannelMessages(prev => [
          ...prev,
          {
            id: Date.now(),
            sender: message.sender || 'Desconocido',
            text: message.text || JSON.stringify(message),
            timestamp: message.timestamp || Date.now(),
            isOwn: message.sender === plugin.id
          }
        ]);
      });
      
      setSuccessMessage(`Canal '${channelName}' creado correctamente`);
      
      // Limpiar mensaje de error si existe
      setError(null);
      
      // Publicar evento de demo
      publishDemoEvent(core, plugin, 'communication-demo', 'channel-created', {
        channelName
      });
    } catch (error) {
      logger.error('Error al crear canal:', error);
      setError(`Error al crear canal: ${error.message}`);
    }
  };
  
  /**
   * Cierra el canal de comunicación
   */
  const closeChannel = () => {
    if (channelRef.current) {
      try {
        // Cerrar canal
        channelRef.current.close();
        channelRef.current = null;
        setIsChannelActive(false);
        
        // Publicar evento de demo
        publishDemoEvent(core, plugin, 'communication-demo', 'channel-closed', {
          channelName
        });
      } catch (error) {
        logger.error('Error al cerrar canal:', error);
      }
    }
  };
  
  /**
   * Envía un mensaje al canal
   */
  const sendMessage = () => {
    // Validar mensaje
    if (!messageText.trim() || !isChannelActive || !channelRef.current) {
      return;
    }
    
    try {
      // Construir mensaje
      const message = {
        text: messageText,
        sender: plugin.id,
        timestamp: Date.now()
      };
      
      // Publicar en el canal
      channelRef.current.publish(message);
      
      // Limpiar campo
      setMessageText('');
      
      // Publicar evento de demo
      publishDemoEvent(core, plugin, 'communication-demo', 'message-sent', {
        channelName,
        messageLength: messageText.length
      });
    } catch (error) {
      logger.error('Error al enviar mensaje:', error);
      setError(`Error al enviar mensaje: ${error.message}`);
    }
  };
  
  /**
   * Manejador de tecla para envío de mensajes
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  /**
   * Llama a un método de la API de otro plugin
   */
  const callPluginAPI = (pluginId) => {
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Obtener API del plugin
      const api = core.plugins.getPluginAPI(plugin.id, pluginId);
      
      if (!api) {
        throw new Error(`El plugin ${pluginId} no tiene API pública disponible`);
      }
      
      // Registrar llamada
      const callRecord = {
        id: Date.now(),
        pluginId,
        method: null,
        result: null,
        timestamp: Date.now(),
        error: null
      };
      
      // Verificar métodos disponibles
      const apiMethods = Object.keys(api).filter(key => typeof api[key] === 'function');
      
      if (apiMethods.length === 0) {
        throw new Error(`El plugin ${pluginId} no tiene métodos disponibles`);
      }
      
      // Usar el primer método disponible o uno informativo si existe
      const methodToCall = apiMethods.includes('getPluginInfo') 
        ? 'getPluginInfo' 
        : apiMethods[0];
      
      callRecord.method = methodToCall;
      
      // Llamar al método
      const result = api[methodToCall]();
      
      // Si es una promesa, esperar resultado
      if (result instanceof Promise) {
        result
          .then(res => {
            callRecord.result = res;
            setApiCalls(prev => [callRecord, ...prev]);
            setSuccessMessage(`Método '${methodToCall}' del plugin '${pluginId}' llamado correctamente`);
            
            // Publicar evento de demo
            publishDemoEvent(core, plugin, 'communication-demo', 'api-call-success', {
              pluginId,
              method: methodToCall
            });
          })
          .catch(err => {
            callRecord.error = err.message;
            setApiCalls(prev => [callRecord, ...prev]);
            setError(`Error al llamar al método '${methodToCall}': ${err.message}`);
          });
      } else {
        // Resultado directo
        callRecord.result = result;
        setApiCalls(prev => [callRecord, ...prev]);
        setSuccessMessage(`Método '${methodToCall}' del plugin '${pluginId}' llamado correctamente`);
        
        // Publicar evento de demo
        publishDemoEvent(core, plugin, 'communication-demo', 'api-call-success', {
          pluginId,
          method: methodToCall
        });
      }
    } catch (error) {
      logger.error(`Error al llamar API del plugin ${pluginId}:`, error);
      setError(`Error: ${error.message}`);
      
      // Registrar error
      setApiCalls(prev => [
        {
          id: Date.now(),
          pluginId,
          method: null,
          result: null,
          timestamp: Date.now(),
          error: error.message
        },
        ...prev
      ]);
      
      // Publicar evento de demo
      publishDemoEvent(core, plugin, 'communication-demo', 'api-call-error', {
        pluginId,
        error: error.message
      });
    }
  };
  
  /**
   * Publica un evento global
   */
  const publishGlobalEvent = (pluginId) => {
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Construir nombre de evento
      const eventName = `pruebas-generales.message-to.${pluginId}`;
      
      // Datos del evento
      const eventData = {
        message: `Hola desde ${plugin.id} a ${pluginId}`,
        timestamp: Date.now(),
        sender: plugin.id
      };
      
      // Publicar evento
      core.events.publish(plugin.id, eventName, eventData);
      
      setSuccessMessage(`Evento '${eventName}' publicado correctamente`);
      
      // Publicar evento de demo
      publishDemoEvent(core, plugin, 'communication-demo', 'event-published', {
        eventName,
        targetPlugin: pluginId
      });
    } catch (error) {
      logger.error(`Error al publicar evento para ${pluginId}:`, error);
      setError(`Error al publicar evento: ${error.message}`);
    }
  };
  
  /**
   * Cambia la pestaña activa
   */
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(null);
    setSuccessMessage(null);
  };
  
  /**
   * Formatea un timestamp
   */
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };
  
  // Renderizar demo de comunicación
  return React.createElement(
    'div',
    { className: 'pg-communication-demo' },
    [
      // Información
      React.createElement(
        'div',
        { key: 'info', className: 'pg-demo-info' },
        [
          React.createElement('h2', { key: 'title' }, 'Demostración de Comunicación entre Plugins'),
          React.createElement(
            'p',
            { key: 'desc' },
            'Esta demostración muestra cómo los plugins de Atlas pueden comunicarse entre sí mediante APIs públicas, eventos y canales.'
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
        { key: 'tabs', className: 'pg-tabs' },
        [
          React.createElement(
            'div',
            {
              key: 'plugins',
              className: `pg-tab ${activeTab === 'plugins' ? 'pg-tab-active' : ''}`,
              onClick: () => handleTabChange('plugins')
            },
            'Plugins y APIs'
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
              key: 'events',
              className: `pg-tab ${activeTab === 'events' ? 'pg-tab-active' : ''}`,
              onClick: () => handleTabChange('events')
            },
            'Eventos globales'
          )
        ]
      ),
      
      // Contenido según pestaña activa
      React.createElement(
        'div',
        { key: 'content', className: 'pg-tab-content' },
        activeTab === 'plugins' ? 
          // Contenido de plugins y APIs
          React.createElement(
            'div',
            { className: 'pg-plugins-panel' },
            [
              // Encabezado
              React.createElement(
                'div',
                { key: 'header', className: 'pg-panel-header' },
                [
                  React.createElement('h3', { key: 'title' }, 'Plugins activos y sus APIs'),
                  React.createElement(
                    'button',
                    {
                      key: 'refresh',
                      className: 'pg-button pg-button-small',
                      onClick: loadActivePlugins
                    },
                    [
                      React.createElement(
                        'span',
                        { key: 'icon', className: 'material-icons pg-icon-small' },
                        'refresh'
                      ),
                      'Actualizar'
                    ]
                  )
                ]
              ),
              
              // Lista de plugins
              React.createElement(
                'div',
                { key: 'plugins-list', className: 'pg-plugins-list' },
                activePlugins.length > 0
                  ? activePlugins.map(p => React.createElement(
                      'div',
                      { key: p.id, className: 'pg-plugin-item' },
                      [
                        // Información del plugin
                        React.createElement(
                          'div',
                          { key: 'info', className: 'pg-plugin-info' },
                          [
                            React.createElement('h4', { key: 'name' }, p.name),
                            React.createElement('div', { key: 'id', className: 'pg-plugin-id' }, p.id),
                            React.createElement(
                              'div',
                              { 
                                key: 'api',
                                className: `pg-api-status ${p.hasAPI ? 'pg-api-available' : 'pg-api-unavailable'}`
                              },
                              p.hasAPI ? 'API disponible' : 'Sin API'
                            )
                          ]
                        ),
                        
                        // Botones de acción
                        React.createElement(
                          'div',
                          { key: 'actions', className: 'pg-plugin-actions' },
                          [
                            React.createElement(
                              'button',
                              {
                                key: 'call-api',
                                className: 'pg-button pg-button-small',
                                onClick: () => callPluginAPI(p.id),
                                disabled: !p.hasAPI
                              },
                              'Llamar API'
                            ),
                            React.createElement(
                              'button',
                              {
                                key: 'publish-event',
                                className: 'pg-button pg-button-small',
                                onClick: () => publishGlobalEvent(p.id)
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
                      'No hay otros plugins activos en el sistema.'
                    )
              ),
              
              // Historial de llamadas a API
              apiCalls.length > 0 && React.createElement(
                'div',
                { key: 'api-calls', className: 'pg-api-calls' },
                [
                  React.createElement('h3', { key: 'title' }, 'Historial de llamadas a API'),
                  React.createElement(
                    'div',
                    { key: 'calls-list', className: 'pg-calls-list' },
                    apiCalls.map(call => React.createElement(
                      'div',
                      {
                        key: call.id,
                        className: `pg-call-item ${call.error ? 'pg-call-error' : 'pg-call-success'}`
                      },
                      [
                        React.createElement(
                          'div',
                          { key: 'header', className: 'pg-call-header' },
                          [
                            React.createElement(
                              'div',
                              { key: 'info', className: 'pg-call-info' },
                              `${call.pluginId}${call.method ? `::${call.method}()` : ''}`
                            ),
                            React.createElement(
                              'div',
                              { key: 'time', className: 'pg-call-time' },
                              formatTimestamp(call.timestamp)
                            )
                          ]
                        ),
                        
                        call.error
                          ? React.createElement(
                              'div',
                              { key: 'error', className: 'pg-call-result pg-call-error-message' },
                              call.error
                            )
                          : React.createElement(
                              'pre',
                              { key: 'result', className: 'pg-call-result' },
                              typeof call.result === 'object'
                                ? JSON.stringify(call.result, null, 2)
                                : String(call.result)
                            )
                      ]
                    ))
                  )
                ]
              )
            ]
          )
        : activeTab === 'channel' ?
          // Contenido de canal de comunicación
          React.createElement(
            'div',
            { className: 'pg-channel-panel' },
            [
              // Encabezado y configuración
              React.createElement(
                'div',
                { key: 'setup', className: 'pg-channel-setup' },
                [
                  React.createElement('h3', { key: 'title' }, 'Canal de comunicación'),
                  
                  // Configuración del canal
                  React.createElement(
                    'div',
                    { key: 'config', className: 'pg-channel-config' },
                    [
                      React.createElement(
                        'div',
                        { key: 'name-field', className: 'pg-form-group' },
                        [
                          React.createElement('label', { key: 'label', htmlFor: 'channel-name' }, 'Nombre del canal:'),
                          React.createElement(
                            'input',
                            {
                              key: 'input',
                              type: 'text',
                              id: 'channel-name',
                              className: 'pg-input',
                              value: channelName,
                              onChange: (e) => setChannelName(e.target.value),
                              disabled: isChannelActive
                            }
                          )
                        ]
                      ),
                      
                      // Botones
                      React.createElement(
                        'div',
                        { key: 'buttons', className: 'pg-channel-buttons' },
                        isChannelActive
                          ? React.createElement(
                              'button',
                              {
                                key: 'close',
                                className: 'pg-button pg-button-danger',
                                onClick: closeChannel
                              },
                              'Cerrar canal'
                            )
                          : React.createElement(
                              'button',
                              {
                                key: 'create',
                                className: 'pg-button pg-button-primary',
                                onClick: createChannel,
                                disabled: !channelName.trim()
                              },
                              'Crear canal'
                            )
                      )
                    ]
                  ),
                  
                  // Estado del canal
                  React.createElement(
                    'div',
                    { key: 'status', className: `pg-channel-status ${isChannelActive ? 'pg-channel-active' : 'pg-channel-inactive'}` },
                    isChannelActive
                      ? `Canal activo: ${channelName}`
                      : 'No hay canal activo'
                  )
                ]
              ),
              
              // Área de chat
              isChannelActive && React.createElement(
                'div',
                { key: 'chat', className: 'pg-channel-chat' },
                [
                  // Mensajes
                  React.createElement(
                    'div',
                    { key: 'messages', className: 'pg-chat-messages' },
                    channelMessages.length > 0
                      ? channelMessages.map(msg => React.createElement(
                          'div',
                          {
                            key: msg.id,
                            className: `pg-chat-message ${msg.isOwn ? 'pg-message-own' : 'pg-message-other'}`
                          },
                          [
                            React.createElement(
                              'div',
                              { key: 'header', className: 'pg-message-header' },
                              [
                                React.createElement(
                                  'span',
                                  { key: 'sender', className: 'pg-message-sender' },
                                  msg.sender === plugin.id ? 'Tú' : msg.sender
                                ),
                                React.createElement(
                                  'span',
                                  { key: 'time', className: 'pg-message-time' },
                                  formatTimestamp(msg.timestamp)
                                )
                              ]
                            ),
                            React.createElement(
                              'div',
                              { key: 'text', className: 'pg-message-text' },
                              msg.text
                            )
                          ]
                        ))
                      : React.createElement(
                          'div',
                          { className: 'pg-empty-chat' },
                          'No hay mensajes. Sé el primero en enviar algo.'
                        ),
                    
                    // Referencia para desplazamiento
                    React.createElement('div', { key: 'end', ref: messageEndRef })
                  ),
                  
                  // Entrada de mensaje
                  React.createElement(
                    'div',
                    { key: 'input', className: 'pg-chat-input' },
                    [
                      React.createElement(
                        'textarea',
                        {
                          key: 'textarea',
                          className: 'pg-textarea',
                          value: messageText,
                          onChange: (e) => setMessageText(e.target.value),
                          onKeyDown: handleKeyDown,
                          placeholder: 'Escribe un mensaje...',
                          rows: 2
                        }
                      ),
                      React.createElement(
                        'button',
                        {
                          key: 'send',
                          className: 'pg-button pg-button-primary',
                          onClick: sendMessage,
                          disabled: !messageText.trim()
                        },
                        [
                          React.createElement(
                            'span',
                            { key: 'icon', className: 'material-icons' },
                            'send'
                          )
                        ]
                      )
                    ]
                  )
                ]
              )
            ]
          )
        :
          // Contenido de eventos globales
          React.createElement(
            'div',
            { className: 'pg-events-panel' },
            [
              React.createElement('h3', { key: 'title' }, 'Sistema de eventos globales'),
              React.createElement(
                'p',
                { key: 'desc' },
                'El sistema de eventos permite a los plugins comunicarse mediante la publicación y suscripción a eventos. Los plugins pueden suscribirse a eventos específicos o utilizar patrones para capturar múltiples eventos.'
              ),
              
              // Ejemplo de código
              React.createElement(
                'div',
                { key: 'code', className: 'pg-code-block' },
                [
                  React.createElement('h4', { key: 'title' }, 'Suscripción a eventos:'),
                  React.createElement(
                    'pre',
                    { key: 'code' },
                    `// Suscribirse a un evento específico
const unsubscribe = core.events.subscribe(
  pluginId,
  'nombre.del.evento',
  function(datos, nombreEvento, pluginOrigen) {
    // Manejar el evento
    console.log('Evento recibido:', datos);
  }
);

// Suscribirse a múltiples eventos con patrón
core.events.subscribe(
  pluginId,
  'plugin.*',  // Todos los eventos que comiencen con 'plugin.'
  function(datos, nombreEvento, pluginOrigen) {
    console.log(\`Evento \${nombreEvento} recibido\`);
  }
);

// Cancelar una suscripción
unsubscribe();

// Cancelar todas las suscripciones
core.events.unsubscribeAll(pluginId);`
                  )
                ]
              ),
              
              React.createElement(
                'div',
                { key: 'code2', className: 'pg-code-block' },
                [
                  React.createElement('h4', { key: 'title' }, 'Publicación de eventos:'),
                  React.createElement(
                    'pre',
                    { key: 'code' },
                    `// Publicar un evento
core.events.publish(
  pluginId,        // ID del plugin que publica
  'mi.evento',     // Nombre del evento
  {                // Datos del evento
    mensaje: 'Hola desde el plugin',
    timestamp: Date.now()
  }
);`
                  )
                ]
              ),
              
              // Eventos del sistema
              React.createElement(
                'div',
                { key: 'system-events', className: 'pg-system-events' },
                [
                  React.createElement('h4', { key: 'title' }, 'Eventos importantes del sistema:'),
                  React.createElement(
                    'ul',
                    { key: 'list' },
                    [
                      React.createElement('li', { key: 'event1' }, 'calendar.eventCreated - Cuando se crea un evento'),
                      React.createElement('li', { key: 'event2' }, 'calendar.eventUpdated - Cuando se actualiza un evento'),
                      React.createElement('li', { key: 'event3' }, 'calendar.eventDeleted - Cuando se elimina un evento'),
                      React.createElement('li', { key: 'event4' }, 'calendar.viewChanged - Cambio de vista del calendario'),
                      React.createElement('li', { key: 'event5' }, 'app.themeChanged - Cambio de tema de la aplicación'),
                      React.createElement('li', { key: 'event6' }, 'app.initialized - Inicialización de la aplicación'),
                      React.createElement('li', { key: 'event7' }, 'storage.dataChanged - Cambio en el almacenamiento')
                    ]
                  )
                ]
              ),
              
              // Prueba con plugins activos
              activePlugins.length > 0 && React.createElement(
                'div',
                { key: 'event-test', className: 'pg-event-test' },
                [
                  React.createElement('h4', { key: 'title' }, 'Probar evento con plugins activos:'),
                  React.createElement(
                    'div',
                    { key: 'plugins', className: 'pg-test-plugins' },
                    activePlugins.map(p => React.createElement(
                      'button',
                      {
                        key: p.id,
                        className: 'pg-button',
                        onClick: () => publishGlobalEvent(p.id)
                      },
                      `Enviar evento a ${p.name}`
                    ))
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
          React.createElement('h3', { key: 'title' }, 'Comunicación entre plugins'),
          React.createElement(
            'p',
            { key: 'desc' },
            'Los plugins de Atlas pueden comunicarse entre sí de tres formas principales:'
          ),
          React.createElement(
            'ul',
            { key: 'list' },
            [
              React.createElement(
                'li',
                { key: 'item1' },
                'Mediante APIs públicas que exponen funcionalidad a otros plugins'
              ),
              React.createElement(
                'li',
                { key: 'item2' },
                'A través del sistema de eventos para comunicación menos acoplada'
              ),
              React.createElement(
                'li',
                { key: 'item3' },
                'Usando canales de comunicación para intercambio de mensajes en tiempo real'
              )
            ]
          ),
          React.createElement(
            'p',
            { key: 'tip' },
            'Consejo: Usa APIs para funcionalidad directa, eventos para notificaciones y canales para comunicación bidireccional.'
          )
        ]
      )
    ]
  );
}

export default CommunicationDemo;