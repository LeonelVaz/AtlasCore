/**
 * ThemesDemo.jsx
 * Componente para demostrar capacidades de temas y estilos
 */

import logger from '../../utils/logger';
import { publishDemoEvent } from '../../api/eventManager';

/**
 * Componente de demostración de temas
 */
function ThemesDemo(props) {
  const React = require('react');
  const { useState, useEffect } = React;
  
  // Extraer propiedades
  const { core, plugin } = props;
  
  // Estados locales
  const [currentTheme, setCurrentTheme] = useState('light');
  const [previewTheme, setPreviewTheme] = useState(null);
  const [previewTimer, setPreviewTimer] = useState(null);
  const [sampleContent, setSampleContent] = useState('default');
  
  // Efecto para cargar tema actual
  useEffect(() => {
    // Obtener tema actual de la aplicación
    if (plugin && plugin._data && plugin._data.settings) {
      setCurrentTheme(plugin._data.settings.theme || 'light');
    }
    
    // Suscribirse a eventos de cambio de tema
    const unsubTheme = core.events.subscribe(
      plugin.id,
      'app.themeChanged',
      (data) => {
        if (data && data.theme) {
          // Mapear tema de la aplicación si es necesario
          let pluginTheme = 'light';
          if (data.theme.includes('dark')) {
            pluginTheme = 'dark';
          } else if (data.theme.includes('contrast')) {
            pluginTheme = 'high-contrast';
          }
          
          setCurrentTheme(pluginTheme);
        }
      }
    );
    
    // Publicar evento de vista
    publishDemoEvent(core, plugin, 'themes-demo', 'viewed');
    
    // Limpiar suscripciones al desmontar
    return () => {
      if (unsubTheme) unsubTheme();
      if (previewTimer) clearTimeout(previewTimer);
    };
  }, [core, plugin]);
  
  /**
   * Manejador para cambiar tema
   */
  const handleThemeChange = (theme) => {
    try {
      // Actualizar tema en el plugin
      if (plugin && plugin._data) {
        plugin._data.settings.theme = theme;
        
        // Publicar evento de cambio de tema
        core.events.publish(
          plugin.id,
          'pruebas-generales.theme.changed',
          {
            oldTheme: currentTheme,
            newTheme: theme
          }
        );
        
        // Guardar configuración si está disponible
        if (typeof core.storage?.setItem === 'function') {
          core.storage.setItem(
            plugin.id,
            'settings',
            plugin._data.settings
          ).catch(err => {
            logger.warn('Error al guardar configuración de tema:', err);
          });
        }
      }
      
      // Actualizar estado
      setCurrentTheme(theme);
      
      // Publicar evento de demo
      publishDemoEvent(core, plugin, 'themes-demo', 'theme-changed', { theme });
      
      // Intentar actualizar tema de la aplicación (si está soportado)
      try {
        const appTheme = mapToAppTheme(theme);
        if (typeof core.app?.setTheme === 'function') {
          core.app.setTheme(appTheme);
        }
      } catch (e) {
        // La función setTheme puede no estar disponible
        logger.debug('No se pudo establecer el tema de la aplicación:', e);
      }
    } catch (error) {
      logger.error('Error al cambiar tema:', error);
    }
  };
  
  /**
   * Mapea un tema del plugin al formato esperado por la aplicación
   */
  const mapToAppTheme = (theme) => {
    switch (theme) {
      case 'dark': return 'dark';
      case 'high-contrast': return 'high-contrast';
      default: return 'light';
    }
  };
  
  /**
   * Manejador para previsualizar tema
   */
  const handleThemePreview = (theme) => {
    // Cancelar temporizador anterior si existe
    if (previewTimer) {
      clearTimeout(previewTimer);
    }
    
    // Establecer tema de previsualización
    setPreviewTheme(theme);
    
    // Configurar temporizador para volver al tema actual después de 2 segundos
    const timer = setTimeout(() => {
      setPreviewTheme(null);
      setPreviewTimer(null);
    }, 2000);
    
    setPreviewTimer(timer);
  };
  
  /**
   * Manejador para cambiar contenido de muestra
   */
  const handleContentChange = (content) => {
    setSampleContent(content);
  };
  
  // Tema efectivo (previsualización o actual)
  const effectiveTheme = previewTheme || currentTheme;
  
  // Renderizar demostración de temas
  return React.createElement(
    'div',
    { className: `pg-themes-demo pg-theme-${effectiveTheme}` },
    [
      // Información
      React.createElement(
        'div',
        { key: 'info', className: 'pg-demo-info' },
        [
          React.createElement('h2', { key: 'title' }, 'Demostración de Temas y Estilos'),
          React.createElement(
            'p',
            { key: 'desc' },
            'Esta demostración muestra cómo usar el sistema de temas y variables CSS para adaptar tu plugin a diferentes estilos visuales.'
          )
        ]
      ),
      
      // Selector de temas
      React.createElement(
        'div',
        { key: 'theme-selector', className: 'pg-theme-selector' },
        [
          React.createElement('h3', { key: 'title' }, 'Selecciona un tema'),
          React.createElement(
            'div',
            { key: 'options', className: 'pg-theme-options' },
            [
              // Tema claro
              React.createElement(
                'div',
                {
                  key: 'light',
                  className: `pg-theme-option ${effectiveTheme === 'light' ? 'pg-theme-active' : ''}`,
                  onClick: () => handleThemeChange('light'),
                  onMouseEnter: () => handleThemePreview('light'),
                  onMouseLeave: () => setPreviewTheme(null)
                },
                [
                  React.createElement(
                    'div',
                    { key: 'preview', className: 'pg-theme-preview pg-theme-light' },
                    React.createElement('div', { className: 'pg-theme-sample' })
                  ),
                  React.createElement('span', { key: 'name' }, 'Claro')
                ]
              ),
              
              // Tema oscuro
              React.createElement(
                'div',
                {
                  key: 'dark',
                  className: `pg-theme-option ${effectiveTheme === 'dark' ? 'pg-theme-active' : ''}`,
                  onClick: () => handleThemeChange('dark'),
                  onMouseEnter: () => handleThemePreview('dark'),
                  onMouseLeave: () => setPreviewTheme(null)
                },
                [
                  React.createElement(
                    'div',
                    { key: 'preview', className: 'pg-theme-preview pg-theme-dark' },
                    React.createElement('div', { className: 'pg-theme-sample' })
                  ),
                  React.createElement('span', { key: 'name' }, 'Oscuro')
                ]
              ),
              
              // Tema de alto contraste
              React.createElement(
                'div',
                {
                  key: 'high-contrast',
                  className: `pg-theme-option ${effectiveTheme === 'high-contrast' ? 'pg-theme-active' : ''}`,
                  onClick: () => handleThemeChange('high-contrast'),
                  onMouseEnter: () => handleThemePreview('high-contrast'),
                  onMouseLeave: () => setPreviewTheme(null)
                },
                [
                  React.createElement(
                    'div',
                    { key: 'preview', className: 'pg-theme-preview pg-theme-high-contrast' },
                    React.createElement('div', { className: 'pg-theme-sample' })
                  ),
                  React.createElement('span', { key: 'name' }, 'Alto contraste')
                ]
              )
            ]
          )
        ]
      ),
      
      // Selector de contenido de muestra
      React.createElement(
        'div',
        { key: 'content-selector', className: 'pg-content-selector' },
        [
          React.createElement('h3', { key: 'title' }, 'Contenido de muestra'),
          React.createElement(
            'div',
            { key: 'buttons', className: 'pg-content-buttons' },
            [
              React.createElement(
                'button',
                {
                  key: 'default',
                  className: `pg-button ${sampleContent === 'default' ? 'pg-button-primary' : ''}`,
                  onClick: () => handleContentChange('default')
                },
                'General'
              ),
              React.createElement(
                'button',
                {
                  key: 'form',
                  className: `pg-button ${sampleContent === 'form' ? 'pg-button-primary' : ''}`,
                  onClick: () => handleContentChange('form')
                },
                'Formulario'
              ),
              React.createElement(
                'button',
                {
                  key: 'card',
                  className: `pg-button ${sampleContent === 'card' ? 'pg-button-primary' : ''}`,
                  onClick: () => handleContentChange('card')
                },
                'Tarjetas'
              ),
              React.createElement(
                'button',
                {
                  key: 'colors',
                  className: `pg-button ${sampleContent === 'colors' ? 'pg-button-primary' : ''}`,
                  onClick: () => handleContentChange('colors')
                },
                'Colores'
              )
            ]
          )
        ]
      ),
      
      // Contenido de muestra
      React.createElement(
        'div',
        { key: 'content', className: 'pg-theme-content' },
        [
          React.createElement('h3', { key: 'title' }, 'Vista previa'),
          React.createElement(
            'div',
            { key: 'preview', className: 'pg-theme-preview-content' },
            renderSampleContent(sampleContent)
          )
        ]
      ),
      
      // Variables CSS disponibles
      React.createElement(
        'div',
        { key: 'variables', className: 'pg-css-variables' },
        [
          React.createElement('h3', { key: 'title' }, 'Variables CSS disponibles'),
          React.createElement(
            'p',
            { key: 'desc' },
            'Algunas de las variables CSS disponibles en el sistema de temas:'
          ),
          React.createElement(
            'div',
            { key: 'vars', className: 'pg-variables-list' },
            [
              // Colores
              React.createElement(
                'div',
                { key: 'colors', className: 'pg-variable-group' },
                [
                  React.createElement('h4', { key: 'title' }, 'Colores'),
                  React.createElement(
                    'ul',
                    { key: 'list' },
                    [
                      React.createElement('li', { key: 'primary' }, '--primary-color'),
                      React.createElement('li', { key: 'secondary' }, '--secondary-color'),
                      React.createElement('li', { key: 'bg' }, '--bg-color'),
                      React.createElement('li', { key: 'text' }, '--text-color'),
                      React.createElement('li', { key: 'border' }, '--border-color')
                    ]
                  )
                ]
              ),
              
              // Espaciado
              React.createElement(
                'div',
                { key: 'spacing', className: 'pg-variable-group' },
                [
                  React.createElement('h4', { key: 'title' }, 'Espaciado'),
                  React.createElement(
                    'ul',
                    { key: 'list' },
                    [
                      React.createElement('li', { key: 'xs' }, '--spacing-xs'),
                      React.createElement('li', { key: 'sm' }, '--spacing-sm'),
                      React.createElement('li', { key: 'md' }, '--spacing-md'),
                      React.createElement('li', { key: 'lg' }, '--spacing-lg'),
                      React.createElement('li', { key: 'xl' }, '--spacing-xl')
                    ]
                  )
                ]
              ),
              
              // Bordes y sombras
              React.createElement(
                'div',
                { key: 'borders', className: 'pg-variable-group' },
                [
                  React.createElement('h4', { key: 'title' }, 'Bordes y sombras'),
                  React.createElement(
                    'ul',
                    { key: 'list' },
                    [
                      React.createElement('li', { key: 'radius-sm' }, '--border-radius-sm'),
                      React.createElement('li', { key: 'radius-md' }, '--border-radius-md'),
                      React.createElement('li', { key: 'radius-lg' }, '--border-radius-lg'),
                      React.createElement('li', { key: 'shadow-sm' }, '--shadow-sm'),
                      React.createElement('li', { key: 'shadow-md' }, '--shadow-md')
                    ]
                  )
                ]
              )
            ]
          )
        ]
      ),
      
      // Instrucciones
      React.createElement(
        'div',
        { key: 'instructions', className: 'pg-instructions' },
        [
          React.createElement('h3', { key: 'title' }, 'Cómo implementar temas en tu plugin'),
          React.createElement(
            'p',
            { key: 'desc' },
            'Para que tu plugin se adapte automáticamente a diferentes temas, usa las variables CSS proporcionadas por Atlas en lugar de colores directos.'
          ),
          React.createElement(
            'div',
            { key: 'code', className: 'pg-code-block' },
            [
              React.createElement('h4', { key: 'title' }, 'Ejemplo:'),
              React.createElement(
                'pre',
                { key: 'pre' },
                `.mi-componente {
  background-color: var(--bg-color);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
}`
              )
            ]
          )
        ]
      )
    ]
  );
}

/**
 * Renderiza el contenido de muestra según el tipo seleccionado
 */
function renderSampleContent(contentType) {
  const React = require('react');
  
  switch (contentType) {
    case 'form':
      return renderFormSample();
    case 'card':
      return renderCardSample();
    case 'colors':
      return renderColorsSample();
    case 'default':
    default:
      return renderDefaultSample();
  }
}

/**
 * Renderiza muestra de contenido general
 */
function renderDefaultSample() {
  const React = require('react');
  
  return React.createElement(
    'div',
    { className: 'pg-sample-container' },
    [
      React.createElement('h2', { key: 'title' }, 'Muestra de contenido general'),
      React.createElement(
        'p',
        { key: 'text1' },
        'Este es un ejemplo de texto normal. Los colores, tipografía y espaciado se adaptan automáticamente al tema seleccionado.'
      ),
      React.createElement(
        'div',
        { key: 'buttons', className: 'pg-button-group' },
        [
          React.createElement('button', { key: 'btn1', className: 'pg-button pg-button-primary' }, 'Botón primario'),
          React.createElement('button', { key: 'btn2', className: 'pg-button' }, 'Botón normal'),
          React.createElement('button', { key: 'btn3', className: 'pg-button pg-button-danger' }, 'Botón de peligro')
        ]
      ),
      React.createElement(
        'ul',
        { key: 'list', className: 'pg-sample-list' },
        [
          React.createElement('li', { key: 'item1' }, 'Elemento de lista 1'),
          React.createElement('li', { key: 'item2' }, 'Elemento de lista 2'),
          React.createElement('li', { key: 'item3' }, 'Elemento de lista 3')
        ]
      ),
      React.createElement(
        'div',
        { key: 'alert', className: 'pg-alert pg-alert-info' },
        'Este es un mensaje de alerta informativo'
      )
    ]
  );
}

/**
 * Renderiza muestra de formulario
 */
function renderFormSample() {
  const React = require('react');
  
  return React.createElement(
    'div',
    { className: 'pg-sample-container' },
    [
      React.createElement('h2', { key: 'title' }, 'Ejemplo de formulario'),
      React.createElement(
        'form',
        { key: 'form', className: 'pg-sample-form' },
        [
          React.createElement(
            'div',
            { key: 'field1', className: 'pg-form-group' },
            [
              React.createElement('label', { key: 'label', htmlFor: 'sample-name' }, 'Nombre:'),
              React.createElement(
                'input',
                {
                  key: 'input',
                  type: 'text',
                  id: 'sample-name',
                  className: 'pg-input',
                  placeholder: 'Ingresa tu nombre'
                }
              )
            ]
          ),
          React.createElement(
            'div',
            { key: 'field2', className: 'pg-form-group' },
            [
              React.createElement('label', { key: 'label', htmlFor: 'sample-email' }, 'Email:'),
              React.createElement(
                'input',
                {
                  key: 'input',
                  type: 'email',
                  id: 'sample-email',
                  className: 'pg-input',
                  placeholder: 'correo@ejemplo.com'
                }
              )
            ]
          ),
          React.createElement(
            'div',
            { key: 'field3', className: 'pg-form-group' },
            [
              React.createElement('label', { key: 'label', htmlFor: 'sample-message' }, 'Mensaje:'),
              React.createElement(
                'textarea',
                {
                  key: 'input',
                  id: 'sample-message',
                  className: 'pg-textarea',
                  rows: 4,
                  placeholder: 'Escribe tu mensaje aquí'
                }
              )
            ]
          ),
          React.createElement(
            'div',
            { key: 'field4', className: 'pg-form-group pg-checkbox-group' },
            [
              React.createElement(
                'label',
                { key: 'label', className: 'pg-checkbox-label' },
                [
                  React.createElement('input', { key: 'input', type: 'checkbox' }),
                  'Acepto los términos y condiciones'
                ]
              )
            ]
          ),
          React.createElement(
            'div',
            { key: 'buttons', className: 'pg-form-buttons' },
            [
              React.createElement('button', { key: 'submit', className: 'pg-button pg-button-primary', type: 'button' }, 'Enviar'),
              React.createElement('button', { key: 'cancel', className: 'pg-button', type: 'button' }, 'Cancelar')
            ]
          )
        ]
      )
    ]
  );
}

/**
 * Renderiza muestra de tarjetas
 */
function renderCardSample() {
  const React = require('react');
  
  return React.createElement(
    'div',
    { className: 'pg-sample-container' },
    [
      React.createElement('h2', { key: 'title' }, 'Ejemplos de tarjetas'),
      React.createElement(
        'div',
        { key: 'cards', className: 'pg-sample-cards' },
        [
          // Tarjeta 1
          React.createElement(
            'div',
            { key: 'card1', className: 'pg-card' },
            [
              React.createElement(
                'div',
                { key: 'header', className: 'pg-card-header' },
                React.createElement('h3', { className: 'pg-card-title' }, 'Tarjeta básica')
              ),
              React.createElement(
                'div',
                { key: 'body', className: 'pg-card-body' },
                [
                  React.createElement(
                    'p',
                    { key: 'text' },
                    'Esta es una tarjeta simple con encabezado y cuerpo. Las tarjetas son útiles para mostrar contenido agrupado.'
                  )
                ]
              )
            ]
          ),
          
          // Tarjeta 2
          React.createElement(
            'div',
            { key: 'card2', className: 'pg-card' },
            [
              React.createElement(
                'div',
                { key: 'header', className: 'pg-card-header' },
                React.createElement('h3', { className: 'pg-card-title' }, 'Tarjeta con acciones')
              ),
              React.createElement(
                'div',
                { key: 'body', className: 'pg-card-body' },
                [
                  React.createElement(
                    'p',
                    { key: 'text' },
                    'Esta tarjeta incluye un pie con acciones.'
                  ),
                  React.createElement(
                    'div',
                    { key: 'image', className: 'pg-card-image-placeholder' },
                    'Imagen'
                  )
                ]
              ),
              React.createElement(
                'div',
                { key: 'footer', className: 'pg-card-footer' },
                [
                  React.createElement('button', { key: 'btn1', className: 'pg-button pg-button-primary pg-button-small' }, 'Aceptar'),
                  React.createElement('button', { key: 'btn2', className: 'pg-button pg-button-small' }, 'Cancelar')
                ]
              )
            ]
          ),
          
          // Tarjeta 3
          React.createElement(
            'div',
            { key: 'card3', className: 'pg-card pg-card-accent' },
            [
              React.createElement(
                'div',
                { key: 'body', className: 'pg-card-body' },
                [
                  React.createElement('h3', { key: 'title' }, 'Tarjeta con acento'),
                  React.createElement(
                    'p',
                    { key: 'text' },
                    'Esta tarjeta utiliza un color de acento. Puede usarse para destacar información importante.'
                  ),
                  React.createElement(
                    'button',
                    { key: 'btn', className: 'pg-button pg-button-primary pg-button-small' },
                    'Acción'
                  )
                ]
              )
            ]
          )
        ]
      )
    ]
  );
}

/**
 * Renderiza muestra de colores
 */
function renderColorsSample() {
  const React = require('react');
  
  // Lista de variables de color y sus nombres
  const colorVariables = [
    { name: 'Primary Color', variable: '--primary-color' },
    { name: 'Secondary Color', variable: '--secondary-color' },
    { name: 'Success Color', variable: '--success-color' },
    { name: 'Warning Color', variable: '--warning-color' },
    { name: 'Danger Color', variable: '--danger-color' },
    { name: 'Info Color', variable: '--info-color' },
    { name: 'Background Color', variable: '--bg-color' },
    { name: 'Text Color', variable: '--text-color' },
    { name: 'Border Color', variable: '--border-color' }
  ];
  
  return React.createElement(
    'div',
    { className: 'pg-sample-container' },
    [
      React.createElement('h2', { key: 'title' }, 'Paleta de colores'),
      React.createElement(
        'div',
        { key: 'colors', className: 'pg-color-palette' },
        colorVariables.map(color => React.createElement(
          'div',
          { key: color.variable, className: 'pg-color-sample' },
          [
            React.createElement(
              'div',
              {
                key: 'swatch',
                className: 'pg-color-swatch',
                style: { backgroundColor: `var(${color.variable})` }
              }
            ),
            React.createElement(
              'div',
              { key: 'info', className: 'pg-color-info' },
              [
                React.createElement('div', { key: 'name', className: 'pg-color-name' }, color.name),
                React.createElement('code', { key: 'var', className: 'pg-color-var' }, color.variable)
              ]
            )
          ]
        ))
      )
    ]
  );
}

export default ThemesDemo;