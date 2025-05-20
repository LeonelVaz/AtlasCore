/**
 * SettingsPanel.jsx
 * Panel de configuración para el plugin
 */

import logger from '../../utils/logger';
import constants from '../../constants';
import { updateSettings, clearAllData } from '../../api/storageManager';

/**
 * Componente para el panel de configuración
 */
function SettingsPanel(props) {
  const React = window.React;
  const { useState, useEffect } = React;
  
  // Extraer propiedades
  const { core, plugin, onSettingChange } = props;
  
  // Estados locales
  const [settings, setSettings] = useState({
    theme: 'light',
    showNotifications: true,
    animationsEnabled: true,
    logLevel: 'info'
  });
  
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  
  // Efecto para cargar configuración actual
  useEffect(() => {
    if (plugin && plugin._data && plugin._data.settings) {
      setSettings({ ...plugin._data.settings });
    }
  }, [plugin]);
  
  /**
   * Manejador para cambios en la configuración
   */
  const handleSettingChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Determinar el valor según el tipo de input
    const newValue = type === 'checkbox' ? checked : value;
    
    // Actualizar estado local
    setSettings(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Propagar cambio si existe la función
    if (typeof onSettingChange === 'function') {
      onSettingChange(name, newValue);
    }
    
    // Actualizar configuración en el plugin
    if (core && plugin) {
      updateSettings(core, plugin, {
        [name]: newValue
      });
      
      // Si es cambio de tema, publicar evento
      if (name === 'theme' && newValue !== settings.theme) {
        core.events.publish(
          plugin.id,
          constants.CUSTOM_EVENTS.THEME_CHANGED,
          {
            oldTheme: settings.theme,
            newTheme: newValue
          }
        );
      }
    }
  };
  
  /**
   * Manejador para resetear configuración
   */
  const handleReset = async () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    
    setIsResetting(true);
    
    try {
      if (core && plugin) {
        await clearAllData(core, plugin);
        
        // Actualizar estado local
        setSettings({
          theme: 'light',
          showNotifications: true,
          animationsEnabled: true,
          logLevel: 'info'
        });
        
        // Informar al usuario
        logger.success('Todos los datos del plugin han sido restablecidos');
      }
    } catch (error) {
      logger.error('Error al resetear datos:', error);
    } finally {
      setIsResetting(false);
      setResetConfirm(false);
    }
  };
  
  /**
   * Manejador para cancelar reset
   */
  const handleCancelReset = () => {
    setResetConfirm(false);
  };
  
  // Renderizar panel de configuración
  return React.createElement(
    'div',
    { className: 'pg-settings-panel' },
    [
      // Encabezado
      React.createElement(
        'h2',
        { key: 'title', className: 'pg-settings-title' },
        'Configuración de Pruebas Generales'
      ),
      
      // Contenido principal
      React.createElement(
        'div',
        { key: 'content', className: 'pg-settings-content' },
        [
          // Sección: Apariencia
          React.createElement(
            'section',
            { key: 'appearance', className: 'pg-settings-section' },
            [
              React.createElement('h3', { key: 'title' }, 'Apariencia'),
              
              // Selector de tema
              React.createElement(
                'div',
                { key: 'theme', className: 'pg-settings-item' },
                [
                  React.createElement('label', { key: 'label', htmlFor: 'theme' }, 'Tema:'),
                  React.createElement(
                    'select',
                    {
                      key: 'select',
                      id: 'theme',
                      name: 'theme',
                      value: settings.theme,
                      onChange: handleSettingChange,
                      className: 'pg-select'
                    },
                    [
                      React.createElement('option', { key: 'light', value: 'light' }, 'Claro'),
                      React.createElement('option', { key: 'dark', value: 'dark' }, 'Oscuro'),
                      React.createElement('option', { key: 'high-contrast', value: 'high-contrast' }, 'Alto contraste')
                    ]
                  )
                ]
              ),
              
              // Checkbox para animaciones
              React.createElement(
                'div',
                { key: 'animations', className: 'pg-settings-item pg-checkbox-item' },
                [
                  React.createElement(
                    'label',
                    { key: 'label', htmlFor: 'animationsEnabled' },
                    'Habilitar animaciones'
                  ),
                  React.createElement(
                    'input',
                    {
                      key: 'input',
                      type: 'checkbox',
                      id: 'animationsEnabled',
                      name: 'animationsEnabled',
                      checked: settings.animationsEnabled,
                      onChange: handleSettingChange
                    }
                  )
                ]
              )
            ]
          ),
          
          // Sección: Notificaciones
          React.createElement(
            'section',
            { key: 'notifications', className: 'pg-settings-section' },
            [
              React.createElement('h3', { key: 'title' }, 'Notificaciones'),
              
              // Checkbox para notificaciones
              React.createElement(
                'div',
                { key: 'notifications', className: 'pg-settings-item pg-checkbox-item' },
                [
                  React.createElement(
                    'label',
                    { key: 'label', htmlFor: 'showNotifications' },
                    'Mostrar notificaciones'
                  ),
                  React.createElement(
                    'input',
                    {
                      key: 'input',
                      type: 'checkbox',
                      id: 'showNotifications',
                      name: 'showNotifications',
                      checked: settings.showNotifications,
                      onChange: handleSettingChange
                    }
                  )
                ]
              )
            ]
          ),
          
          // Sección: Depuración
          React.createElement(
            'section',
            { key: 'debug', className: 'pg-settings-section' },
            [
              React.createElement('h3', { key: 'title' }, 'Depuración'),
              
              // Selector de nivel de log
              React.createElement(
                'div',
                { key: 'logLevel', className: 'pg-settings-item' },
                [
                  React.createElement('label', { key: 'label', htmlFor: 'logLevel' }, 'Nivel de log:'),
                  React.createElement(
                    'select',
                    {
                      key: 'select',
                      id: 'logLevel',
                      name: 'logLevel',
                      value: settings.logLevel,
                      onChange: handleSettingChange,
                      className: 'pg-select'
                    },
                    [
                      React.createElement('option', { key: 'debug', value: 'debug' }, 'Debug'),
                      React.createElement('option', { key: 'info', value: 'info' }, 'Info'),
                      React.createElement('option', { key: 'warn', value: 'warn' }, 'Warning'),
                      React.createElement('option', { key: 'error', value: 'error' }, 'Error'),
                      React.createElement('option', { key: 'none', value: 'none' }, 'Ninguno')
                    ]
                  )
                ]
              )
            ]
          ),
          
          // Sección: Restablecer datos
          React.createElement(
            'section',
            { key: 'reset', className: 'pg-settings-section' },
            [
              React.createElement('h3', { key: 'title' }, 'Datos del plugin'),
              
              // Botón de reset
              React.createElement(
                'div',
                { key: 'reset', className: 'pg-settings-item' },
                resetConfirm
                  ? [
                      React.createElement(
                        'p',
                        { key: 'confirm', className: 'pg-reset-confirm' },
                        '¿Estás seguro? Esta acción eliminará todos los datos del plugin.'
                      ),
                      React.createElement(
                        'div',
                        { key: 'buttons', className: 'pg-reset-buttons' },
                        [
                          React.createElement(
                            'button',
                            {
                              key: 'cancel',
                              className: 'pg-button',
                              onClick: handleCancelReset,
                              disabled: isResetting
                            },
                            'Cancelar'
                          ),
                          React.createElement(
                            'button',
                            {
                              key: 'confirm',
                              className: 'pg-button pg-button-danger',
                              onClick: handleReset,
                              disabled: isResetting
                            },
                            isResetting ? 'Restableciendo...' : 'Sí, restablecer todo'
                          )
                        ]
                      )
                    ]
                  : React.createElement(
                      'button',
                      {
                        key: 'reset',
                        className: 'pg-button pg-button-warning',
                        onClick: handleReset
                      },
                      'Restablecer todos los datos'
                    )
              )
            ]
          )
        ]
      ),
      
      // Footer
      React.createElement(
        'div',
        { key: 'footer', className: 'pg-settings-footer' },
        [
          React.createElement(
            'p',
            {},
            `Pruebas Generales v${plugin?.version || '1.0.0'}`
          ),
          React.createElement(
            'p',
            { className: 'pg-settings-author' },
            `Desarrollado por ${plugin?.author || 'Tu Nombre'}`
          )
        ]
      )
    ]
  );
}

export default SettingsPanel;