/**
 * PermissionsDemo.jsx
 * Componente para demostrar el sistema de permisos de Atlas
 */

import logger from '../../utils/logger';
import { publishDemoEvent } from '../../api/eventManager';

/**
 * Componente de demostración de permisos
 */
function PermissionsDemo(props) {
  const React = window.React;
  const { useState, useEffect } = React;
  
  // Extraer propiedades
  const { core, plugin } = props;
  
  // Estados locales
  const [permissions, setPermissions] = useState([]);
  const [testResults, setTestResults] = useState({});
  const [securityLevel, setSecurityLevel] = useState('NORMAL');
  const [expandedSection, setExpandedSection] = useState(null);
  
  // Efecto para cargar permisos
  useEffect(() => {
    // Permisos definidos en el plugin
    if (plugin && Array.isArray(plugin.permissions)) {
      setPermissions(plugin.permissions);
    }
    
    // Intentar obtener nivel de seguridad
    if (core && core.security && typeof core.security.getSecurityLevel === 'function') {
      try {
        const level = core.security.getSecurityLevel();
        setSecurityLevel(level);
      } catch (error) {
        logger.debug('No se pudo obtener nivel de seguridad:', error);
      }
    }
    
    // Publicar evento de vista
    publishDemoEvent(core, plugin, 'permissions-demo', 'viewed');
  }, [core, plugin]);
  
  /**
   * Prueba un permiso específico
   */
  const testPermission = (permission) => {
    try {
      // Resultado por defecto: no disponible
      let result = {
        status: 'unknown',
        message: 'No se pudo probar el permiso'
      };
      
      // Verificar diferentes permisos según su tipo
      switch (permission) {
        case 'storage':
          result = testStoragePermission();
          break;
        case 'events':
          result = testEventsPermission();
          break;
        case 'ui':
          result = testUIPermission();
          break;
        case 'network':
          result = testNetworkPermission();
          break;
        case 'notifications':
          result = testNotificationsPermission();
          break;
        case 'communication':
          result = testCommunicationPermission();
          break;
        case 'dom':
          result = testDOMPermission();
          break;
        case 'codeExecution':
          result = testCodeExecutionPermission();
          break;
        default:
          result = {
            status: 'unknown',
            message: `Permiso "${permission}" desconocido`
          };
      }
      
      // Actualizar resultados de prueba
      setTestResults(prev => ({
        ...prev,
        [permission]: result
      }));
      
      // Publicar evento de demo
      publishDemoEvent(core, plugin, 'permissions-demo', 'permission-tested', {
        permission,
        result: result.status
      });
      
      return result;
    } catch (error) {
      logger.error(`Error al probar permiso "${permission}":`, error);
      
      // Actualizar resultados de prueba
      const result = {
        status: 'error',
        message: error.message
      };
      
      setTestResults(prev => ({
        ...prev,
        [permission]: result
      }));
      
      return result;
    }
  };
  
  /**
   * Prueba el permiso de almacenamiento
   */
  const testStoragePermission = () => {
    if (!core || !core.storage) {
      return {
        status: 'error',
        message: 'API de almacenamiento no disponible'
      };
    }
    
    try {
      // Intentar guardar un valor
      const testKey = '_permission_test';
      const testValue = { timestamp: Date.now() };
      
      // Operación síncrona para simular
      const promise = core.storage.setItem(plugin.id, testKey, testValue);
      
      return {
        status: 'success',
        message: 'Permiso de almacenamiento concedido',
        promise
      };
    } catch (error) {
      return {
        status: 'denied',
        message: `Permiso denegado: ${error.message}`
      };
    }
  };
  
  /**
   * Prueba el permiso de eventos
   */
  const testEventsPermission = () => {
    if (!core || !core.events) {
      return {
        status: 'error',
        message: 'API de eventos no disponible'
      };
    }
    
    try {
      // Intentar publicar un evento
      const testEvent = 'permissions.test';
      const testData = { timestamp: Date.now() };
      
      core.events.publish(plugin.id, testEvent, testData);
      
      return {
        status: 'success',
        message: 'Permiso de eventos concedido'
      };
    } catch (error) {
      return {
        status: 'denied',
        message: `Permiso denegado: ${error.message}`
      };
    }
  };
  
  /**
   * Prueba el permiso de UI
   */
  const testUIPermission = () => {
    if (!core || !core.ui) {
      return {
        status: 'error',
        message: 'API de UI no disponible'
      };
    }
    
    try {
      // Intentar obtener zonas de extensión
      const zones = core.ui.getExtensionZones();
      
      if (!zones) {
        return {
          status: 'partial',
          message: 'API de UI disponible pero no se pudieron obtener zonas'
        };
      }
      
      return {
        status: 'success',
        message: 'Permiso de UI concedido',
        data: Object.keys(zones)
      };
    } catch (error) {
      return {
        status: 'denied',
        message: `Permiso denegado: ${error.message}`
      };
    }
  };
  
  /**
   * Prueba el permiso de red
   */
  const testNetworkPermission = () => {
    if (!window.fetch) {
      return {
        status: 'error',
        message: 'API fetch no disponible'
      };
    }
    
    try {
      // Intentar hacer una petición de red
      // Nota: En un entorno real, esto podría bloquearse por el sandbox
      const testUrl = 'https://example.com';
      
      // No ejecutamos realmente la petición para no causar problemas
      // Solo verificamos si hay alguna restricción previa
      
      if (core && core.security && typeof core.security.isUrlAllowed === 'function') {
        const isAllowed = core.security.isUrlAllowed(testUrl);
        
        if (!isAllowed) {
          return {
            status: 'denied',
            message: `URL no permitida: ${testUrl}`
          };
        }
      }
      
      return {
        status: 'likely',
        message: 'Permiso de red probablemente concedido (no se realizó petición real)'
      };
    } catch (error) {
      return {
        status: 'denied',
        message: `Permiso denegado: ${error.message}`
      };
    }
  };
  
  /**
   * Prueba el permiso de notificaciones
   */
  const testNotificationsPermission = () => {
    if (!window.Notification) {
      return {
        status: 'error',
        message: 'API de notificaciones no disponible'
      };
    }
    
    // Verificar permiso del navegador
    const browserPermission = window.Notification.permission;
    
    if (browserPermission === 'denied') {
      return {
        status: 'denied',
        message: 'Permiso de notificaciones denegado por el navegador'
      };
    }
    
    try {
      // Verificar permiso del plugin
      // Normalmente habría un método específico en el core
      if (core && core.notifications) {
        if (typeof core.notifications.checkPermission === 'function') {
          const hasPermission = core.notifications.checkPermission();
          
          if (!hasPermission) {
            return {
              status: 'denied',
              message: 'Permiso de notificaciones denegado por Atlas'
            };
          }
        }
        
        return {
          status: 'success',
          message: 'Permiso de notificaciones concedido'
        };
      }
      
      return {
        status: 'unknown',
        message: 'No se pudo verificar el permiso de notificaciones'
      };
    } catch (error) {
      return {
        status: 'denied',
        message: `Permiso denegado: ${error.message}`
      };
    }
  };
  
  /**
   * Prueba el permiso de comunicación
   */
  const testCommunicationPermission = () => {
    if (!core || !core.plugins) {
      return {
        status: 'error',
        message: 'API de plugins no disponible'
      };
    }
    
    try {
      // Intentar obtener plugins activos
      const activePlugins = core.plugins.getActivePlugins();
      
      if (!Array.isArray(activePlugins)) {
        return {
          status: 'partial',
          message: 'API de plugins disponible pero no se pudieron obtener plugins activos'
        };
      }
      
      // Intentar crear un canal
      if (typeof core.plugins.createChannel === 'function') {
        try {
          const channel = core.plugins.createChannel(`test-channel-${Date.now()}`, plugin.id, {
            allowAnyPublisher: false
          });
          
          if (channel) {
            // Cerrar canal inmediatamente
            channel.close();
            
            return {
              status: 'success',
              message: 'Permiso de comunicación concedido completamente'
            };
          }
        } catch (channelError) {
          return {
            status: 'partial',
            message: 'Permiso parcial: se pueden ver plugins pero no crear canales'
          };
        }
      }
      
      return {
        status: 'partial',
        message: 'Permiso de comunicación parcial'
      };
    } catch (error) {
      return {
        status: 'denied',
        message: `Permiso denegado: ${error.message}`
      };
    }
  };
  
  /**
   * Prueba el permiso de manipulación del DOM
   */
  const testDOMPermission = () => {
    try {
      // Intentar crear un elemento temporal
      const tempElement = document.createElement('div');
      tempElement.id = `temp-element-${Date.now()}`;
      tempElement.style.display = 'none';
      
      // Intentar añadirlo al DOM
      document.body.appendChild(tempElement);
      
      // Si llegamos aquí, el DOM no está completamente restringido
      // Limpiar inmediatamente
      document.body.removeChild(tempElement);
      
      return {
        status: 'likely',
        message: 'Manipulación básica del DOM parece permitida'
      };
    } catch (error) {
      return {
        status: 'denied',
        message: `Permiso denegado: ${error.message}`
      };
    }
  };
  
  /**
   * Prueba el permiso de ejecución de código
   */
  const testCodeExecutionPermission = () => {
    try {
      // Intentar eval básico
      const testFunc = new Function('return 42;');
      const result = testFunc();
      
      if (result === 42) {
        return {
          status: 'warning',
          message: 'Ejecución de código dinámica permitida (inseguro)'
        };
      }
      
      return {
        status: 'unknown',
        message: 'Resultado inesperado en prueba de ejecución de código'
      };
    } catch (error) {
      return {
        status: 'secure',
        message: 'Ejecución de código dinámica bloqueada (seguro)'
      };
    }
  };
  
  /**
   * Probar todos los permisos
   */
  const testAllPermissions = () => {
    permissions.forEach(testPermission);
  };
  
  /**
   * Alternar sección expandida
   */
  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };
  
  /**
   * Obtener clase de estado para un resultado
   */
  const getStatusClass = (status) => {
    switch (status) {
      case 'success':
        return 'pg-status-success';
      case 'partial':
        return 'pg-status-partial';
      case 'likely':
        return 'pg-status-likely';
      case 'denied':
        return 'pg-status-denied';
      case 'error':
        return 'pg-status-error';
      case 'warning':
        return 'pg-status-warning';
      case 'secure':
        return 'pg-status-success';
      default:
        return 'pg-status-unknown';
    }
  };
  
  // Información sobre permisos
  const permissionsInfo = {
    storage: {
      title: 'Almacenamiento',
      description: 'Permite al plugin guardar y recuperar datos persistentes.',
      risk: 'Bajo',
      impact: 'Bajo a medio. El plugin puede almacenar datos que persisten entre sesiones.'
    },
    events: {
      title: 'Eventos',
      description: 'Permite al plugin suscribirse y publicar eventos del sistema.',
      risk: 'Bajo',
      impact: 'Bajo. El plugin puede recibir notificaciones de eventos y enviar eventos propios.'
    },
    ui: {
      title: 'Interfaz de usuario',
      description: 'Permite al plugin registrar componentes en la interfaz de usuario.',
      risk: 'Bajo',
      impact: 'Bajo. El plugin puede añadir elementos visuales a la aplicación.'
    },
    network: {
      title: 'Red',
      description: 'Permite al plugin realizar peticiones de red a servidores externos.',
      risk: 'Medio',
      impact: 'Medio. El plugin puede enviar y recibir datos de servicios externos.'
    },
    notifications: {
      title: 'Notificaciones',
      description: 'Permite al plugin mostrar notificaciones al usuario.',
      risk: 'Bajo',
      impact: 'Bajo. El plugin puede mostrar mensajes de notificación.'
    },
    communication: {
      title: 'Comunicación',
      description: 'Permite al plugin comunicarse con otros plugins.',
      risk: 'Bajo',
      impact: 'Bajo a medio. El plugin puede intercambiar datos con otros plugins.'
    },
    dom: {
      title: 'Manipulación del DOM',
      description: 'Permite al plugin manipular directamente el DOM de la aplicación.',
      risk: 'Alto',
      impact: 'Alto. El plugin puede modificar cualquier parte de la interfaz, potencialmente causando problemas.'
    },
    codeExecution: {
      title: 'Ejecución de código',
      description: 'Permite al plugin ejecutar código dinámicamente.',
      risk: 'Muy alto',
      impact: 'Muy alto. El plugin puede ejecutar código arbitrario, representando un riesgo de seguridad significativo.'
    }
  };
  
  // Renderizar demo de permisos
  return React.createElement(
    'div',
    { className: 'pg-permissions-demo' },
    [
      // Información
      React.createElement(
        'div',
        { key: 'info', className: 'pg-demo-info' },
        [
          React.createElement('h2', { key: 'title' }, 'Sistema de permisos de Atlas'),
          React.createElement(
            'p',
            { key: 'desc' },
            'Esta demostración muestra cómo funciona el sistema de permisos para garantizar la seguridad y privacidad de los datos del usuario.'
          )
        ]
      ),
      
      // Nivel de seguridad actual
      React.createElement(
        'div',
        { key: 'security-level', className: 'pg-security-level' },
        [
          React.createElement('h3', { key: 'title' }, 'Nivel de seguridad'),
          React.createElement(
            'div',
            { key: 'level', className: `pg-level pg-level-${securityLevel.toLowerCase()}` },
            [
              React.createElement(
                'span',
                { key: 'icon', className: 'material-icons' },
                securityLevel === 'HIGH' ? 'security' : (securityLevel === 'LOW' ? 'shield' : 'verified_user')
              ),
              React.createElement('span', { key: 'text' }, securityLevel)
            ]
          ),
          React.createElement(
            'p',
            { key: 'desc' },
            securityLevel === 'HIGH'
              ? 'Modo de alta seguridad: los permisos son estrictamente controlados y requieren aprobación explícita.'
              : securityLevel === 'LOW'
                ? 'Modo de baja seguridad: la mayoría de los permisos se conceden automáticamente (para desarrollo).'
                : 'Modo de seguridad normal: equilibrio entre seguridad y funcionalidad.'
          )
        ]
      ),
      
      // Permisos del plugin
      React.createElement(
        'div',
        { key: 'plugin-permissions', className: 'pg-plugin-permissions' },
        [
          React.createElement('h3', { key: 'title' }, 'Permisos del plugin'),
          React.createElement(
            'div',
            { key: 'list', className: 'pg-permissions-list' },
            permissions.length > 0
              ? permissions.map(permission => {
                  const info = permissionsInfo[permission] || {
                    title: permission,
                    description: 'Permiso personalizado',
                    risk: 'Desconocido',
                    impact: 'Desconocido'
                  };
                  
                  const result = testResults[permission];
                  const statusClass = result ? getStatusClass(result.status) : '';
                  
                  return React.createElement(
                    'div',
                    {
                      key: permission,
                      className: `pg-permission-item ${statusClass}`,
                      onClick: () => toggleSection(permission)
                    },
                    [
                      // Cabecera de permiso
                      React.createElement(
                        'div',
                        { key: 'header', className: 'pg-permission-header' },
                        [
                          React.createElement(
                            'div',
                            { key: 'info', className: 'pg-permission-info' },
                            [
                              React.createElement('h4', { key: 'title' }, info.title),
                              React.createElement('div', { key: 'name', className: 'pg-permission-name' }, permission)
                            ]
                          ),
                          
                          // Resultado de prueba (si existe)
                          result && React.createElement(
                            'div',
                            { key: 'result', className: 'pg-permission-result' },
                            [
                              React.createElement(
                                'span',
                                { key: 'status', className: `pg-status ${getStatusClass(result.status)}` },
                                result.status === 'success' ? 'Concedido' :
                                result.status === 'partial' ? 'Parcial' :
                                result.status === 'likely' ? 'Probable' :
                                result.status === 'denied' ? 'Denegado' :
                                result.status === 'warning' ? 'Advertencia' :
                                result.status === 'secure' ? 'Seguro' :
                                'Desconocido'
                              ),
                              React.createElement(
                                'button',
                                {
                                  key: 'test',
                                  className: 'pg-button pg-button-small',
                                  onClick: (e) => {
                                    e.stopPropagation();
                                    testPermission(permission);
                                  }
                                },
                                'Probar'
                              )
                            ]
                          ),
                          
                          // Botón de test (si no hay resultado)
                          !result && React.createElement(
                            'button',
                            {
                              key: 'test',
                              className: 'pg-button pg-button-small',
                              onClick: (e) => {
                                e.stopPropagation();
                                testPermission(permission);
                              }
                            },
                            'Probar permiso'
                          )
                        ]
                      ),
                      
                      // Detalles de permiso (expandibles)
                      expandedSection === permission && React.createElement(
                        'div',
                        { key: 'details', className: 'pg-permission-details' },
                        [
                          React.createElement('p', { key: 'desc' }, info.description),
                          React.createElement(
                            'div',
                            { key: 'risk', className: 'pg-permission-risk' },
                            [
                              React.createElement('strong', { key: 'label' }, 'Nivel de riesgo: '),
                              React.createElement('span', {}, info.risk)
                            ]
                          ),
                          React.createElement(
                            'div',
                            { key: 'impact', className: 'pg-permission-impact' },
                            [
                              React.createElement('strong', { key: 'label' }, 'Impacto potencial: '),
                              React.createElement('span', {}, info.impact)
                            ]
                          ),
                          
                          // Resultado detallado de la prueba (si existe)
                          result && React.createElement(
                            'div',
                            { key: 'test-result', className: 'pg-test-result' },
                            [
                              React.createElement('strong', { key: 'label' }, 'Resultado de la prueba: '),
                              React.createElement('span', {}, result.message)
                            ]
                          )
                        ]
                      )
                    ]
                  );
                })
              : React.createElement(
                  'div',
                  { className: 'pg-empty-list' },
                  'No se han definido permisos para este plugin.'
                )
          ),
          
          // Botón para probar todos los permisos
          permissions.length > 0 && React.createElement(
            'button',
            {
              key: 'test-all',
              className: 'pg-button pg-button-primary',
              onClick: testAllPermissions
            },
            'Probar todos los permisos'
          )
        ]
      ),
      
      // Modelo de seguridad
      React.createElement(
        'div',
        { key: 'security-model', className: 'pg-security-model' },
        [
          React.createElement('h3', { key: 'title' }, 'Modelo de seguridad multinivel'),
          React.createElement(
            'p',
            { key: 'desc' },
            'Atlas implementa un modelo de seguridad multinivel para los plugins, con diferentes restricciones según el nivel configurado:'
          ),
          
          // Tabla de niveles de seguridad
          React.createElement(
            'div',
            { key: 'table', className: 'pg-security-table' },
            [
              // Cabecera
              React.createElement(
                'div',
                { key: 'header', className: 'pg-table-row pg-table-header' },
                [
                  React.createElement('div', { key: 'level', className: 'pg-table-cell' }, 'Nivel'),
                  React.createElement('div', { key: 'perms', className: 'pg-table-cell' }, 'Permisos automáticos'),
                  React.createElement('div', { key: 'limits', className: 'pg-table-cell' }, 'Límites de recursos'),
                  React.createElement('div', { key: 'audit', className: 'pg-table-cell' }, 'Auditoría')
                ]
              ),
              
              // Fila: LOW
              React.createElement(
                'div',
                { key: 'low', className: 'pg-table-row' },
                [
                  React.createElement(
                    'div',
                    { key: 'level', className: 'pg-table-cell pg-level-indicator pg-level-low' },
                    'LOW'
                  ),
                  React.createElement('div', { key: 'perms', className: 'pg-table-cell' }, 'Mayoría concedidos automáticamente'),
                  React.createElement('div', { key: 'limits', className: 'pg-table-cell' }, 'Límites altos (10 MB, 60 req/min)'),
                  React.createElement('div', { key: 'audit', className: 'pg-table-cell' }, 'Básica')
                ]
              ),
              
              // Fila: NORMAL
              React.createElement(
                'div',
                { key: 'normal', className: 'pg-table-row' },
                [
                  React.createElement(
                    'div',
                    { key: 'level', className: 'pg-table-cell pg-level-indicator pg-level-normal' },
                    'NORMAL'
                  ),
                  React.createElement('div', { key: 'perms', className: 'pg-table-cell' }, 'Permisos básicos automáticos'),
                  React.createElement('div', { key: 'limits', className: 'pg-table-cell' }, 'Límites medios (5 MB, 30 req/min)'),
                  React.createElement('div', { key: 'audit', className: 'pg-table-cell' }, 'Detallada')
                ]
              ),
              
              // Fila: HIGH
              React.createElement(
                'div',
                { key: 'high', className: 'pg-table-row' },
                [
                  React.createElement(
                    'div',
                    { key: 'level', className: 'pg-table-cell pg-level-indicator pg-level-high' },
                    'HIGH'
                  ),
                  React.createElement('div', { key: 'perms', className: 'pg-table-cell' }, 'Requieren aprobación explícita'),
                  React.createElement('div', { key: 'limits', className: 'pg-table-cell' }, 'Límites estrictos (2 MB, 10 req/min)'),
                  React.createElement('div', { key: 'audit', className: 'pg-table-cell' }, 'Exhaustiva')
                ]
              )
            ]
          )
        ]
      ),
      
      // Buenas prácticas
      React.createElement(
        'div',
        { key: 'best-practices', className: 'pg-best-practices' },
        [
          React.createElement('h3', { key: 'title' }, 'Buenas prácticas'),
          React.createElement(
            'ul',
            { key: 'list', className: 'pg-practices-list' },
            [
              React.createElement(
                'li',
                { key: 'practice1' },
                'Solicita solo los permisos que tu plugin realmente necesita.'
              ),
              React.createElement(
                'li',
                { key: 'practice2' },
                'Maneja correctamente los casos donde un permiso puede ser denegado.'
              ),
              React.createElement(
                'li',
                { key: 'practice3' },
                'Evita solicitar permisos de alto riesgo como "dom" y "codeExecution" a menos que sean absolutamente necesarios.'
              ),
              React.createElement(
                'li',
                { key: 'practice4' },
                'Documenta claramente los permisos que utiliza tu plugin y por qué son necesarios.'
              ),
              React.createElement(
                'li',
                { key: 'practice5' },
                'Considera ofrecer funcionalidad degradada cuando ciertos permisos no están disponibles.'
              )
            ]
          )
        ]
      )
    ]
  );
}

export default PermissionsDemo;