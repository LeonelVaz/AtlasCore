/**
 * AnimationsDemo.jsx
 * Componente para demostrar capacidades de animación
 */

import logger from '../../utils/logger';
import { publishDemoEvent } from '../../api/eventManager';

/**
 * Componente de demostración de animaciones
 */
function AnimationsDemo(props) {
  const React = require('react');
  const { useState, useEffect, useRef } = React;
  
  // Extraer propiedades
  const { core, plugin } = props;
  
  // Estados locales
  const [activeAnimation, setActiveAnimation] = useState(null);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [speed, setSpeed] = useState('normal');
  const [playCount, setPlayCount] = useState({});
  
  // Efecto para cargar preferencias
  useEffect(() => {
    // Cargar configuración de animaciones del plugin
    if (plugin && plugin._data && plugin._data.settings) {
      setAnimationsEnabled(plugin._data.settings.animationsEnabled !== false);
    }
    
    // Publicar evento de vista
    publishDemoEvent(core, plugin, 'animations-demo', 'viewed');
    
    // Limpiar al desmontar
    return () => {
      // Cancelar animaciones en curso
    };
  }, [core, plugin]);
  
  /**
   * Manejador para cambiar estado de animaciones
   */
  const handleAnimationsToggle = (e) => {
    const enabled = e.target.checked;
    setAnimationsEnabled(enabled);
    
    // Actualizar configuración del plugin
    if (plugin && plugin._data) {
      plugin._data.settings.animationsEnabled = enabled;
      
      // Guardar configuración si está disponible almacenamiento
      if (core && core.storage) {
        core.storage.setItem(plugin.id, 'settings', plugin._data.settings)
          .catch(err => {
            logger.warn('Error al guardar configuración de animaciones:', err);
          });
      }
    }
    
    // Publicar evento de demo
    publishDemoEvent(core, plugin, 'animations-demo', 'animations-toggled', {
      enabled
    });
  };
  
  /**
   * Manejador para cambiar velocidad
   */
  const handleSpeedChange = (e) => {
    setSpeed(e.target.value);
    
    // Publicar evento de demo
    publishDemoEvent(core, plugin, 'animations-demo', 'speed-changed', {
      speed: e.target.value
    });
  };
  
  /**
   * Manejador para activar una animación
   */
  const handleAnimationClick = (animation) => {
    setActiveAnimation(animation);
    
    // Incrementar contador de reproducciones
    setPlayCount(prev => ({
      ...prev,
      [animation]: (prev[animation] || 0) + 1
    }));
    
    // Publicar evento de demo
    publishDemoEvent(core, plugin, 'animations-demo', 'animation-played', {
      animation
    });
    
    // Restablecer después de la animación
    setTimeout(() => {
      setActiveAnimation(null);
    }, getAnimationDuration(animation, speed));
  };
  
  /**
   * Obtener duración de animación según velocidad
   */
  const getAnimationDuration = (animation, currentSpeed) => {
    const baseDuration = {
      fade: 1000,
      slide: 800,
      bounce: 1000,
      flip: 800,
      scale: 600,
      rotate: 1000,
      shake: 800
    }[animation] || 1000;
    
    const speedFactor = {
      slow: 1.5,
      normal: 1,
      fast: 0.5
    }[currentSpeed] || 1;
    
    return baseDuration * speedFactor;
  };
  
  /**
   * Obtener clase de animación completa
   */
  const getAnimationClass = (animation) => {
    if (!animation || !animationsEnabled) return '';
    
    return `pg-animation-${animation} pg-animation-speed-${speed}`;
  };
  
  // Lista de animaciones disponibles
  const animations = [
    {
      id: 'fade',
      name: 'Fade',
      icon: 'opacity',
      description: 'Efecto de desvanecimiento suave'
    },
    {
      id: 'slide',
      name: 'Slide',
      icon: 'swap_horiz',
      description: 'Deslizamiento horizontal o vertical'
    },
    {
      id: 'bounce',
      name: 'Bounce',
      icon: 'sync',
      description: 'Efecto de rebote elástico'
    },
    {
      id: 'flip',
      name: 'Flip',
      icon: 'flip',
      description: 'Rotación en 3D tipo carta'
    },
    {
      id: 'scale',
      name: 'Scale',
      icon: 'open_in_full',
      description: 'Cambio de escala (zoom)'
    },
    {
      id: 'rotate',
      name: 'Rotate',
      icon: 'rotate_right',
      description: 'Rotación completa'
    },
    {
      id: 'shake',
      name: 'Shake',
      icon: 'vibration',
      description: 'Efecto de vibración o temblor'
    }
  ];
  
  // Renderizar demo de animaciones
  return React.createElement(
    'div',
    { className: 'pg-animations-demo' },
    [
      // Información
      React.createElement(
        'div',
        { key: 'info', className: 'pg-demo-info' },
        [
          React.createElement('h2', { key: 'title' }, 'Demostración de Animaciones'),
          React.createElement(
            'p',
            { key: 'desc' },
            'Esta demostración muestra cómo usar animaciones CSS y transiciones para mejorar la experiencia de usuario en tu plugin.'
          )
        ]
      ),
      
      // Controles
      React.createElement(
        'div',
        { key: 'controls', className: 'pg-animation-controls' },
        [
          // Toggle para habilitar/deshabilitar animaciones
          React.createElement(
            'div',
            { key: 'toggle', className: 'pg-control-group' },
            [
              React.createElement(
                'label',
                { key: 'label', className: 'pg-toggle-label' },
                [
                  React.createElement(
                    'input',
                    {
                      key: 'input',
                      type: 'checkbox',
                      checked: animationsEnabled,
                      onChange: handleAnimationsToggle
                    }
                  ),
                  'Animaciones habilitadas'
                ]
              )
            ]
          ),
          
          // Selector de velocidad
          React.createElement(
            'div',
            { key: 'speed', className: 'pg-control-group' },
            [
              React.createElement('label', { key: 'label', htmlFor: 'animation-speed' }, 'Velocidad:'),
              React.createElement(
                'select',
                {
                  key: 'select',
                  id: 'animation-speed',
                  className: 'pg-select',
                  value: speed,
                  onChange: handleSpeedChange,
                  disabled: !animationsEnabled
                },
                [
                  React.createElement('option', { key: 'slow', value: 'slow' }, 'Lenta'),
                  React.createElement('option', { key: 'normal', value: 'normal' }, 'Normal'),
                  React.createElement('option', { key: 'fast', value: 'fast' }, 'Rápida')
                ]
              )
            ]
          )
        ]
      ),
      
      // Galería de animaciones
      React.createElement(
        'div',
        { key: 'gallery', className: 'pg-animation-gallery' },
        animations.map(animation => React.createElement(
          'div',
          {
            key: animation.id,
            className: 'pg-animation-card',
            onClick: () => handleAnimationClick(animation.id)
          },
          [
            React.createElement(
              'div',
              {
                key: 'preview',
                className: `pg-animation-preview ${activeAnimation === animation.id ? getAnimationClass(animation.id) : ''}`
              },
              React.createElement(
                'span',
                { className: 'material-icons pg-animation-icon' },
                animation.icon
              )
            ),
            React.createElement('h3', { key: 'name' }, animation.name),
            React.createElement('p', { key: 'desc' }, animation.description),
            React.createElement(
              'div',
              { key: 'plays', className: 'pg-animation-plays' },
              `Reproducida: ${playCount[animation.id] || 0} ${playCount[animation.id] === 1 ? 'vez' : 'veces'}`
            )
          ]
        ))
      ),
      
      // Ejemplo práctico
      React.createElement(
        'div',
        { key: 'example', className: 'pg-animation-example' },
        [
          React.createElement('h3', { key: 'title' }, 'Ejemplo práctico'),
          React.createElement(
            'p',
            { key: 'desc' },
            'A continuación se muestra un ejemplo de cómo las animaciones pueden mejorar la experiencia de usuario en un componente real.'
          ),
          
          // Demostración de componente con animaciones
          React.createElement(
            'div',
            { key: 'demo', className: 'pg-example-component' },
            [
              React.createElement(
                'div',
                { key: 'header', className: 'pg-example-header' },
                [
                  React.createElement('h4', { key: 'title' }, 'Notificaciones'),
                  React.createElement(
                    'span',
                    { key: 'count', className: 'pg-example-count' },
                    '3'
                  )
                ]
              ),
              
              // Lista de notificaciones animadas
              React.createElement(
                'div',
                { key: 'list', className: 'pg-example-list' },
                [
                  // Notificación 1 - Fade In
                  React.createElement(
                    'div',
                    {
                      key: 'item1',
                      className: `pg-example-item ${animationsEnabled ? 'pg-animation-fade pg-animation-delay-1' : ''}`
                    },
                    [
                      React.createElement(
                        'span',
                        { key: 'icon', className: 'material-icons pg-example-icon pg-example-icon-info' },
                        'info'
                      ),
                      React.createElement(
                        'div',
                        { key: 'content', className: 'pg-example-content' },
                        [
                          React.createElement('div', { key: 'title' }, 'Recordatorio'),
                          React.createElement('div', { key: 'message' }, 'Tienes una reunión en 15 minutos')
                        ]
                      )
                    ]
                  ),
                  
                  // Notificación 2 - Slide In
                  React.createElement(
                    'div',
                    {
                      key: 'item2',
                      className: `pg-example-item ${animationsEnabled ? 'pg-animation-slide pg-animation-delay-2' : ''}`
                    },
                    [
                      React.createElement(
                        'span',
                        { key: 'icon', className: 'material-icons pg-example-icon pg-example-icon-success' },
                        'check_circle'
                      ),
                      React.createElement(
                        'div',
                        { key: 'content', className: 'pg-example-content' },
                        [
                          React.createElement('div', { key: 'title' }, 'Tarea completada'),
                          React.createElement('div', { key: 'message' }, 'Informe trimestral enviado con éxito')
                        ]
                      )
                    ]
                  ),
                  
                  // Notificación 3 - Bounce In
                  React.createElement(
                    'div',
                    {
                      key: 'item3',
                      className: `pg-example-item ${animationsEnabled ? 'pg-animation-bounce pg-animation-delay-3' : ''}`
                    },
                    [
                      React.createElement(
                        'span',
                        { key: 'icon', className: 'material-icons pg-example-icon pg-example-icon-warning' },
                        'warning'
                      ),
                      React.createElement(
                        'div',
                        { key: 'content', className: 'pg-example-content' },
                        [
                          React.createElement('div', { key: 'title' }, 'Recordatorio importante'),
                          React.createElement('div', { key: 'message' }, 'La reunión de equipo ha sido reprogramada')
                        ]
                      )
                    ]
                  )
                ]
              )
            ]
          )
        ]
      ),
      
      // Código de ejemplo
      React.createElement(
        'div',
        { key: 'code-example', className: 'pg-code-example' },
        [
          React.createElement('h3', { key: 'title' }, 'Implementación'),
          React.createElement(
            'p',
            { key: 'desc' },
            'Para implementar animaciones en tu plugin, puedes usar las clases CSS proporcionadas o crear tus propias animaciones:'
          ),
          
          // Ejemplo de código CSS
          React.createElement(
            'div',
            { key: 'css', className: 'pg-code-block' },
            [
              React.createElement('h4', { key: 'title' }, 'CSS:'),
              React.createElement(
                'pre',
                { key: 'code' },
                `/* Definir animación */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Aplicar animación */
.my-animated-element {
  animation: fadeIn 0.5s ease-in-out;
}

/* Usar variables CSS para duración y timing */
.my-plugin-animation {
  transition-duration: var(--transition-normal);
  transition-property: opacity, transform;
}`
              )
            ]
          ),
          
          // Ejemplo de código JavaScript
          React.createElement(
            'div',
            { key: 'js', className: 'pg-code-block' },
            [
              React.createElement('h4', { key: 'title' }, 'JavaScript:'),
              React.createElement(
                'pre',
                { key: 'code' },
                `// Comprobar si las animaciones están habilitadas
const animationsEnabled = plugin._data.settings.animationsEnabled !== false;

// Aplicar clase de animación condicionalmente
return React.createElement(
  'div',
  {
    className: \`my-component \${animationsEnabled ? 'my-animation' : ''}\`
  },
  'Contenido animado'
);`
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
                'Siempre proporciona una opción para deshabilitar animaciones (por accesibilidad).'
              ),
              React.createElement(
                'li',
                { key: 'practice2' },
                'Utiliza las variables CSS para duración y timing para mantener consistencia.'
              ),
              React.createElement(
                'li',
                { key: 'practice3' },
                'Evita animaciones excesivas que puedan distraer o sobrecargar la interfaz.'
              ),
              React.createElement(
                'li',
                { key: 'practice4' },
                'Prioriza el rendimiento: usa propiedades que el navegador puede animar eficientemente (transform, opacity).'
              ),
              React.createElement(
                'li',
                { key: 'practice5' },
                'Considera la preferencia del sistema "prefers-reduced-motion" para usuarios que desean menos animaciones.'
              )
            ]
          )
        ]
      )
    ]
  );
}

export default AnimationsDemo;