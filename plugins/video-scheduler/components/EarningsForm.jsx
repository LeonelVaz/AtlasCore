// video-scheduler/components/EarningsForm.jsx
import { useState, useEffect } from 'react';
import { CURRENCIES } from '../utils/constants.js';
import { formatCurrency, convertCurrency } from '../utils/videoUtils.js';

export default function EarningsForm(props) {
  const { video, onSave, onCancel, plugin } = props;
  const [earnings, setEarnings] = useState(video.earnings || {
    currency: plugin.publicAPI.getPluginSettings().defaultCurrency,
    total: 0,
    breakdown: {},
    lastUpdated: null
  });
  
  const [newEarning, setNewEarning] = useState({
    amount: '',
    currency: plugin.publicAPI.getPluginSettings().defaultCurrency,
    source: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [showConversion, setShowConversion] = useState(false);
  const [editingSource, setEditingSource] = useState(null);

  const settings = plugin.publicAPI.getPluginSettings();

  // Recalcular total cuando cambie el breakdown
  useEffect(() => {
    const total = Object.values(earnings.breakdown).reduce((sum, amount) => sum + amount, 0);
    setEarnings(prev => ({ ...prev, total }));
  }, [earnings.breakdown]);

  const handleAddEarning = async () => {
    if (!newEarning.amount || !newEarning.source) {
      alert('Por favor completa la cantidad y la fuente');
      return;
    }

    setLoading(true);
    try {
      const amount = parseFloat(newEarning.amount);
      
      // Convertir a la moneda principal del video si es necesario
      const convertedAmount = newEarning.currency !== earnings.currency ?
        convertCurrency(amount, newEarning.currency, earnings.currency, settings.currencyRates) :
        amount;

      const updatedBreakdown = {
        ...earnings.breakdown,
        [newEarning.source]: (earnings.breakdown[newEarning.source] || 0) + convertedAmount
      };

      const updatedEarnings = {
        ...earnings,
        breakdown: updatedBreakdown,
        lastUpdated: new Date().toISOString()
      };

      setEarnings(updatedEarnings);
      
      // Limpiar formulario
      setNewEarning({
        amount: '',
        currency: settings.defaultCurrency,
        source: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });

    } catch (error) {
      console.error('Error al añadir ingreso:', error);
      alert('Error al añadir el ingreso');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEarning = (source) => {
    if (window.confirm(`¿Eliminar todos los ingresos de "${source}"?`)) {
      const updatedBreakdown = { ...earnings.breakdown };
      delete updatedBreakdown[source];
      
      setEarnings(prev => ({
        ...prev,
        breakdown: updatedBreakdown,
        lastUpdated: new Date().toISOString()
      }));
    }
  };

  const handleEditEarning = (source, newAmount) => {
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount < 0) return;

    const updatedBreakdown = {
      ...earnings.breakdown,
      [source]: amount
    };

    setEarnings(prev => ({
      ...prev,
      breakdown: updatedBreakdown,
      lastUpdated: new Date().toISOString()
    }));
    
    setEditingSource(null);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(earnings);
    } catch (error) {
      console.error('Error al guardar ingresos:', error);
      alert('Error al guardar los ingresos');
    } finally {
      setLoading(false);
    }
  };

  const getTotalInDefaultCurrency = () => {
    if (earnings.currency === settings.defaultCurrency) {
      return earnings.total;
    }
    return convertCurrency(earnings.total, earnings.currency, settings.defaultCurrency, settings.currencyRates);
  };

  const getQuickSourceSuggestions = () => {
    return [
      'AdSense',
      'Patrocinio',
      'Membresías',
      'Donaciones',
      'Venta de productos',
      'Afiliados',
      'Licencias',
      'Consultoría'
    ];
  };

  return React.createElement(
    'div',
    { className: 'earnings-form' },
    [
      React.createElement('h3', { key: 'title' }, 
        `Gestionar Ingresos - ${video.title}`
      ),

      // Resumen actual
      React.createElement(
        'div',
        { className: 'earnings-summary', key: 'summary' },
        [
          React.createElement('h4', { key: 'summary-title' }, 'Resumen de Ingresos'),
          React.createElement(
            'div',
            { className: 'summary-grid', key: 'grid' },
            [
              React.createElement(
                'div',
                { className: 'summary-item primary', key: 'total' },
                [
                  React.createElement('span', { key: 'label' }, 'Total'),
                  React.createElement('span', { key: 'value', className: 'value' },
                    formatCurrency(earnings.total, earnings.currency)
                  )
                ]
              ),
              
              earnings.currency !== settings.defaultCurrency && React.createElement(
                'div',
                { className: 'summary-item secondary', key: 'converted' },
                [
                  React.createElement('span', { key: 'label' }, 
                    `En ${settings.defaultCurrency}`
                  ),
                  React.createElement('span', { key: 'value', className: 'value converted' },
                    formatCurrency(getTotalInDefaultCurrency(), settings.defaultCurrency)
                  )
                ]
              ),

              React.createElement(
                'div',
                { className: 'summary-item', key: 'sources' },
                [
                  React.createElement('span', { key: 'label' }, 'Fuentes'),
                  React.createElement('span', { key: 'value', className: 'value' },
                    Object.keys(earnings.breakdown).length
                  )
                ]
              ),

              earnings.lastUpdated && React.createElement(
                'div',
                { className: 'summary-item', key: 'updated' },
                [
                  React.createElement('span', { key: 'label' }, 'Actualizado'),
                  React.createElement('span', { key: 'value', className: 'value date' },
                    new Date(earnings.lastUpdated).toLocaleDateString()
                  )
                ]
              )
            ]
          )
        ]
      ),

      // Formulario para nuevo ingreso
      React.createElement(
        'div',
        { className: 'add-earning-form', key: 'add-form' },
        [
          React.createElement('h4', { key: 'form-title' }, 'Añadir Nuevo Ingreso'),
          
          React.createElement(
            'div',
            { className: 'form-grid', key: 'form-grid' },
            [
              React.createElement(
                'div',
                { className: 'form-group', key: 'amount' },
                [
                  React.createElement('label', { key: 'label' }, 'Cantidad *'),
                  React.createElement('input', {
                    key: 'input',
                    type: 'number',
                    step: '0.01',
                    min: '0',
                    value: newEarning.amount,
                    onChange: (e) => setNewEarning(prev => ({ ...prev, amount: e.target.value })),
                    placeholder: '0.00',
                    disabled: loading
                  })
                ]
              ),

              React.createElement(
                'div',
                { className: 'form-group', key: 'currency' },
                [
                  React.createElement('label', { key: 'label' }, 'Moneda'),
                  React.createElement(
                    'select',
                    {
                      key: 'select',
                      value: newEarning.currency,
                      onChange: (e) => setNewEarning(prev => ({ ...prev, currency: e.target.value })),
                      disabled: loading
                    },
                    Object.entries(CURRENCIES).map(([code, info]) =>
                      React.createElement('option', { key: code, value: code }, 
                        `${code} - ${info.symbol}`
                      )
                    )
                  )
                ]
              ),

              React.createElement(
                'div',
                { className: 'form-group full-width', key: 'source' },
                [
                  React.createElement('label', { key: 'label' }, 'Fuente de Ingreso *'),
                  React.createElement('input', {
                    key: 'input',
                    type: 'text',
                    value: newEarning.source,
                    onChange: (e) => setNewEarning(prev => ({ ...prev, source: e.target.value })),
                    placeholder: 'Ej: AdSense, Patrocinio Brand X',
                    list: 'source-suggestions',
                    disabled: loading
                  }),
                  React.createElement(
                    'datalist',
                    { key: 'datalist', id: 'source-suggestions' },
                    getQuickSourceSuggestions().map(suggestion =>
                      React.createElement('option', { key: suggestion, value: suggestion })
                    )
                  )
                ]
              ),

              React.createElement(
                'div',
                { className: 'form-group', key: 'date' },
                [
                  React.createElement('label', { key: 'label' }, 'Fecha'),
                  React.createElement('input', {
                    key: 'input',
                    type: 'date',
                    value: newEarning.date,
                    onChange: (e) => setNewEarning(prev => ({ ...prev, date: e.target.value })),
                    disabled: loading
                  })
                ]
              ),

              React.createElement(
                'div',
                { className: 'form-group full-width', key: 'description' },
                [
                  React.createElement('label', { key: 'label' }, 'Descripción (opcional)'),
                  React.createElement('input', {
                    key: 'input',
                    type: 'text',
                    value: newEarning.description,
                    onChange: (e) => setNewEarning(prev => ({ ...prev, description: e.target.value })),
                    placeholder: 'Notas adicionales sobre este ingreso',
                    disabled: loading
                  })
                ]
              )
            ]
          ),

          React.createElement(
            'div',
            { className: 'form-actions', key: 'add-actions' },
            React.createElement('button', {
              onClick: handleAddEarning,
              disabled: loading || !newEarning.amount || !newEarning.source,
              className: 'btn-primary'
            }, loading ? 'Añadiendo...' : '💰 Añadir Ingreso')
          )
        ]
      ),

      // Lista de ingresos existentes
      Object.keys(earnings.breakdown).length > 0 && React.createElement(
        'div',
        { className: 'earnings-breakdown', key: 'breakdown' },
        [
          React.createElement('h4', { key: 'breakdown-title' }, 'Desglose de Ingresos'),
          
          React.createElement(
            'div',
            { className: 'breakdown-list', key: 'list' },
            Object.entries(earnings.breakdown)
              .sort(([,a], [,b]) => b - a) // Ordenar por cantidad descendente
              .map(([source, amount]) =>
                React.createElement(
                  'div',
                  { key: source, className: 'breakdown-item' },
                  [
                    React.createElement(
                      'div',
                      { className: 'breakdown-info', key: 'info' },
                      [
                        React.createElement('span', { key: 'source', className: 'source' }, source),
                        React.createElement('span', { key: 'percentage', className: 'percentage' },
                          `${((amount / earnings.total) * 100).toFixed(1)}%`
                        )
                      ]
                    ),
                    
                    React.createElement(
                      'div',
                      { className: 'breakdown-amount', key: 'amount' },
                      editingSource === source ? React.createElement('input', {
                        key: 'edit-input',
                        type: 'number',
                        step: '0.01',
                        defaultValue: amount,
                        onBlur: (e) => handleEditEarning(source, e.target.value),
                        onKeyPress: (e) => {
                          if (e.key === 'Enter') {
                            handleEditEarning(source, e.target.value);
                          } else if (e.key === 'Escape') {
                            setEditingSource(null);
                          }
                        },
                        autoFocus: true,
                        className: 'inline-edit'
                      }) : React.createElement('span', {
                        key: 'amount-display',
                        className: 'amount-display',
                        onClick: () => setEditingSource(source)
                      }, formatCurrency(amount, earnings.currency))
                    ),

                    React.createElement(
                      'div',
                      { className: 'breakdown-actions', key: 'actions' },
                      [
                        React.createElement('button', {
                          key: 'edit',
                          onClick: () => setEditingSource(source),
                          className: 'btn-icon',
                          title: 'Editar cantidad'
                        }, '✏️'),
                        
                        React.createElement('button', {
                          key: 'delete',
                          onClick: () => handleRemoveEarning(source),
                          className: 'btn-icon btn-danger',
                          title: 'Eliminar esta fuente'
                        }, '🗑️')
                      ]
                    )
                  ]
                )
              )
          )
        ]
      ),

      // Configuración de moneda principal
      React.createElement(
        'div',
        { className: 'currency-settings', key: 'currency-settings' },
        [
          React.createElement('h4', { key: 'currency-title' }, 'Configuración de Moneda'),
          React.createElement(
            'div',
            { className: 'form-group', key: 'currency-group' },
            [
              React.createElement('label', { key: 'label' }, 'Moneda Principal del Video'),
              React.createElement(
                'select',
                {
                  key: 'select',
                  value: earnings.currency,
                  onChange: (e) => {
                    if (window.confirm('¿Cambiar la moneda principal? Esto puede afectar los cálculos.')) {
                      setEarnings(prev => ({ ...prev, currency: e.target.value }));
                    }
                  },
                  disabled: loading
                },
                Object.entries(CURRENCIES).map(([code, info]) =>
                  React.createElement('option', { key: code, value: code }, 
                    `${code} - ${info.name}`
                  )
                )
              ),
              React.createElement('small', { key: 'help' }, 
                'Todos los ingresos se convertirán a esta moneda para el cálculo total'
              )
            ]
          )
        ]
      ),

      // Acciones principales
      React.createElement(
        'div',
        { className: 'main-actions', key: 'main-actions' },
        [
          React.createElement('button', {
            key: 'save',
            onClick: handleSave,
            disabled: loading,
            className: 'btn-primary'
          }, loading ? 'Guardando...' : 'Guardar Cambios'),
          
          React.createElement('button', {
            key: 'cancel',
            onClick: onCancel,
            disabled: loading,
            className: 'btn-secondary'
          }, 'Cancelar'),

          React.createElement('button', {
            key: 'export',
            onClick: () => {
              const data = {
                video: { id: video.id, title: video.title },
                earnings: earnings,
                exportedAt: new Date().toISOString()
              };
              
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `ingresos-${video.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            },
            className: 'btn-secondary'
          }, '📊 Exportar Datos')
        ]
      )
    ]
  );
}