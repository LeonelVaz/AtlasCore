// video-scheduler/components/SettingsPanelWidget.jsx
import { useState, useEffect } from 'react';
import { CURRENCIES } from '../utils/constants.js';

export default function SettingsPanelWidget(props) {
  const { plugin, core } = props;
  const [settings, setSettings] = useState(plugin.publicAPI.getPluginSettings());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [expandedSections, setExpandedSections] = useState({
    general: true,
    display: false,
    currencies: false,
    advanced: false
  });

  // Sincronizar con los settings del plugin
  useEffect(() => {
    const unsubscribe = core.events.subscribe(
      plugin.id,
      `${plugin.id}.settingsUpdated`,
      (data) => {
        setSettings(data.settings);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [core, plugin]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSettingChange = async (key, value) => {
    setLoading(true);
    try {
      await plugin.publicAPI.updatePluginSetting(key, value);
      setSettings(prev => ({ ...prev, [key]: value }));
      showMessage('success', 'Configuración actualizada');
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      showMessage('error', 'Error al actualizar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyRateChange = (currency, rate) => {
    const newRates = {
      ...settings.currencyRates,
      [currency]: parseFloat(rate) || 1.0
    };
    
    handleSettingChange('currencyRates', newRates);
  };

  const handleImportExportSettings = async (action) => {
    if (action === 'export') {
      const exportData = {
        settings: settings,
        version: plugin.version,
        exportedAt: new Date().toISOString()
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video-scheduler-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showMessage('success', 'Configuración exportada');
    } else if (action === 'import') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (data.settings) {
              // Actualizar cada configuración individualmente
              for (const [key, value] of Object.entries(data.settings)) {
                await plugin.publicAPI.updatePluginSetting(key, value);
              }
              showMessage('success', 'Configuración importada');
            } else {
              showMessage('error', 'Archivo de configuración inválido');
            }
          } catch (error) {
            console.error('Error al importar configuración:', error);
            showMessage('error', 'Error al importar configuración');
          }
        }
      };
      input.click();
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderGeneralSettings = () => {
    return React.createElement(
      'div',
      { className: 'settings-section' },
      [
        React.createElement(
          'div',
          { className: 'form-group', key: 'default-platform' },
          [
            React.createElement('label', { key: 'label' }, 'Plataforma por Defecto'),
            React.createElement(
              'select',
              {
                key: 'select',
                value: settings.defaultPlatform,
                onChange: (e) => handleSettingChange('defaultPlatform', e.target.value),
                disabled: loading
              },
              [
                React.createElement('option', { key: 'youtube', value: 'youtube' }, '📺 YouTube'),
                React.createElement('option', { key: 'vimeo', value: 'vimeo' }, '🎥 Vimeo'),
                React.createElement('option', { key: 'tiktok', value: 'tiktok' }, '📱 TikTok'),
                React.createElement('option', { key: 'instagram', value: 'instagram' }, '📷 Instagram'),
                React.createElement('option', { key: 'facebook', value: 'facebook' }, '📘 Facebook'),
                React.createElement('option', { key: 'twitch', value: 'twitch' }, '🎮 Twitch')
              ]
            ),
            React.createElement('small', { key: 'help' }, 
              'Plataforma que se seleccionará por defecto al crear nuevos videos'
            )
          ]
        ),

        React.createElement(
          'div',
          { className: 'form-group', key: 'default-currency' },
          [
            React.createElement('label', { key: 'label' }, 'Moneda por Defecto'),
            React.createElement(
              'select',
              {
                key: 'select',
                value: settings.defaultCurrency,
                onChange: (e) => handleSettingChange('defaultCurrency', e.target.value),
                disabled: loading
              },
              Object.entries(CURRENCIES).map(([code, info]) =>
                React.createElement('option', { key: code, value: code }, 
                  `${code} - ${info.name}`
                )
              )
            ),
            React.createElement('small', { key: 'help' }, 
              'Moneda principal para reportes y conversiones'
            )
          ]
        ),

        React.createElement(
          'div',
          { className: 'form-group', key: 'language' },
          [
            React.createElement('label', { key: 'label' }, 'Idioma'),
            React.createElement(
              'select',
              {
                key: 'select',
                value: settings.language,
                onChange: (e) => handleSettingChange('language', e.target.value),
                disabled: loading
              },
              [
                React.createElement('option', { key: 'es', value: 'es' }, '🇪🇸 Español'),
                React.createElement('option', { key: 'en', value: 'en' }, '🇺🇸 English')
              ]
            ),
            React.createElement('small', { key: 'help' }, 
              'Idioma de la interfaz del plugin'
            )
          ]
        )
      ]
    );
  };

  const renderDisplaySettings = () => {
    return React.createElement(
      'div',
      { className: 'settings-section' },
      [
        React.createElement(
          'div',
          { className: 'form-group checkbox-group', key: 'calendar-headers' },
          [
            React.createElement(
              'label',
              { key: 'label', className: 'checkbox-label' },
              [
                React.createElement('input', {
                  key: 'checkbox',
                  type: 'checkbox',
                  checked: settings.showInCalendarHeaders,
                  onChange: (e) => handleSettingChange('showInCalendarHeaders', e.target.checked),
                  disabled: loading
                }),
                React.createElement('span', { key: 'text' }, 'Mostrar indicadores en el calendario principal de Atlas')
              ]
            ),
            React.createElement('small', { key: 'help' }, 
              'Muestra pequeños indicadores en el calendario de Atlas cuando hay videos programados'
            )
          ]
        ),

        React.createElement(
          'div',
          { className: 'form-group', key: 'default-view' },
          [
            React.createElement('label', { key: 'label' }, 'Vista por Defecto'),
            React.createElement(
              'select',
              {
                key: 'select',
                value: settings.defaultView || 'grid',
                onChange: (e) => handleSettingChange('defaultView', e.target.value),
                disabled: loading
              },
              [
                React.createElement('option', { key: 'grid', value: 'grid' }, 'Rejilla'),
                React.createElement('option', { key: 'calendar', value: 'calendar' }, 'Calendario'),
                React.createElement('option', { key: 'list', value: 'list' }, 'Lista')
              ]
            ),
            React.createElement('small', { key: 'help' }, 
              'Vista que se mostrará por defecto al abrir el plugin'
            )
          ]
        ),

        React.createElement(
          'div',
          { className: 'form-group checkbox-group', key: 'compact-view' },
          [
            React.createElement(
              'label',
              { key: 'label', className: 'checkbox-label' },
              [
                React.createElement('input', {
                  key: 'checkbox',
                  type: 'checkbox',
                  checked: settings.compactView || false,
                  onChange: (e) => handleSettingChange('compactView', e.target.checked),
                  disabled: loading
                }),
                React.createElement('span', { key: 'text' }, 'Vista compacta para tarjetas de video')
              ]
            ),
            React.createElement('small', { key: 'help' }, 
              'Muestra las tarjetas de video en un formato más compacto'
            )
          ]
        )
      ]
    );
  };

  const renderCurrencySettings = () => {
    return React.createElement(
      'div',
      { className: 'settings-section' },
      [
        React.createElement('p', { key: 'description' }, 
          'Configura las tasas de cambio para conversión de monedas. Las tasas se expresan en relación a 1 unidad de la moneda por defecto.'
        ),

        React.createElement(
          'div',
          { className: 'currency-rates', key: 'rates' },
          Object.entries(settings.currencyRates || {}).map(([currency, rate]) =>
            React.createElement(
              'div',
              { className: 'form-group currency-rate-item', key: currency },
              [
                React.createElement('label', { key: 'label' }, 
                  `${currency} (${CURRENCIES[currency]?.name || currency})`
                ),
                React.createElement('input', {
                  key: 'input',
                  type: 'number',
                  step: '0.01',
                  min: '0',
                  value: rate,
                  onChange: (e) => handleCurrencyRateChange(currency, e.target.value),
                  disabled: loading || currency === settings.defaultCurrency
                }),
                currency === settings.defaultCurrency && React.createElement('small', { 
                  key: 'help' 
                }, 'Moneda base')
              ]
            )
          )
        ),

        React.createElement(
          'div',
          { className: 'currency-actions', key: 'actions' },
          [
            React.createElement('button', {
              key: 'update-rates',
              onClick: () => {
                showMessage('info', 'Función de actualización automática no implementada aún');
              },
              className: 'btn-secondary',
              disabled: loading
            }, '🔄 Actualizar Tasas Automáticamente'),
            
            React.createElement('button', {
              key: 'reset-rates',
              onClick: () => {
                if (window.confirm('¿Restablecer todas las tasas de cambio a los valores por defecto?')) {
                  const defaultRates = {
                    USD: 1.0,
                    EUR: 0.92,
                    ARS: 850.0,
                    MXN: 18.5
                  };
                  handleSettingChange('currencyRates', defaultRates);
                }
              },
              className: 'btn-secondary',
              disabled: loading
            }, '↺ Restablecer por Defecto')
          ]
        )
      ]
    );
  };

  const renderAdvancedSettings = () => {
    return React.createElement(
      'div',
      { className: 'settings-section' },
      [
        React.createElement(
          'div',
          { className: 'form-group', key: 'auto-save' },
          [
            React.createElement('label', { key: 'label' }, 'Intervalo de Guardado Automático (segundos)'),
            React.createElement('input', {
              key: 'input',
              type: 'number',
              min: '0',
              max: '300',
              value: settings.autoSaveInterval || 30,
              onChange: (e) => handleSettingChange('autoSaveInterval', parseInt(e.target.value)),
              disabled: loading
            }),
            React.createElement('small', { key: 'help' }, 
              'Tiempo entre guardados automáticos (0 para desactivar)'
            )
          ]
        ),

        React.createElement(
          'div',
          { className: 'form-group checkbox-group', key: 'debug-mode' },
          [
            React.createElement(
              'label',
              { key: 'label', className: 'checkbox-label' },
              [
                React.createElement('input', {
                  key: 'checkbox',
                  type: 'checkbox',
                  checked: settings.debugMode || false,
                  onChange: (e) => handleSettingChange('debugMode', e.target.checked),
                  disabled: loading
                }),
                React.createElement('span', { key: 'text' }, 'Modo de depuración')
              ]
            ),
            React.createElement('small', { key: 'help' }, 
              'Activa logs adicionales en la consola para depuración'
            )
          ]
        ),

        React.createElement(
          'div',
          { className: 'advanced-actions', key: 'actions' },
          [
            React.createElement('button', {
              key: 'export',
              onClick: () => handleImportExportSettings('export'),
              className: 'btn-secondary',
              disabled: loading
            }, '📤 Exportar Configuración'),
            
            React.createElement('button', {
              key: 'import',
              onClick: () => handleImportExportSettings('import'),
              className: 'btn-secondary',
              disabled: loading
            }, '📥 Importar Configuración'),

            React.createElement('button', {
              key: 'reset-all',
              onClick: () => {
                if (window.confirm('¿Estás seguro de que quieres restablecer TODA la configuración? Esta acción no se puede deshacer.')) {
                  // Aquí implementarías el reset completo
                  showMessage('warning', 'Función de reset completo no implementada por seguridad');
                }
              },
              className: 'btn-secondary btn-danger',
              disabled: loading
            }, '⚠️ Restablecer Todo')
          ]
        )
      ]
    );
  };

  const renderSectionHeader = (key, title, icon) => {
    return React.createElement(
      'div',
      { 
        className: `section-header ${expandedSections[key] ? 'expanded' : ''}`,
        onClick: () => toggleSection(key),
        key: `${key}-header`
      },
      [
        React.createElement('span', { key: 'icon' }, icon),
        React.createElement('span', { key: 'title' }, title),
        React.createElement('span', { key: 'toggle' }, expandedSections[key] ? '▼' : '▶')
      ]
    );
  };

  return React.createElement(
    'div',
    { className: 'videoscheduler-settings' },
    [
      React.createElement('h3', { key: 'title' }, 'Configuración Video Scheduler'),

      // Mensaje de estado
      message.text && React.createElement(
        'div',
        { 
          className: `settings-message ${message.type}`,
          key: 'message'
        },
        message.text
      ),

      // Configuración General
      renderSectionHeader('general', 'Configuración General', '⚙️'),
      expandedSections.general && renderGeneralSettings(),

      // Configuración de Visualización
      renderSectionHeader('display', 'Visualización', '👁️'),
      expandedSections.display && renderDisplaySettings(),

      // Configuración de Monedas
      renderSectionHeader('currencies', 'Monedas y Tasas de Cambio', '💱'),
      expandedSections.currencies && renderCurrencySettings(),

      // Configuración Avanzada
      renderSectionHeader('advanced', 'Configuración Avanzada', '🔧'),
      expandedSections.advanced && renderAdvancedSettings(),

      // Footer con información
      React.createElement(
        'div',
        { className: 'settings-footer', key: 'footer' },
        [
          React.createElement('small', { key: 'version' }, 
            `Video Scheduler v${plugin.version}`
          ),
          React.createElement('small', { key: 'status' }, 
            loading ? 'Guardando...' : 'Configuración sincronizada'
          )
        ]
      )
    ]
  );
}