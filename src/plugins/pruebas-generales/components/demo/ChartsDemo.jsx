/**
 * ChartsDemo.jsx
 * Componente para demostrar la capacidad de visualización de datos
 */

import logger from '../../utils/logger';

/**
 * Componente de demostración de gráficas
 */
function ChartsDemo(props) {
  const React = window.React;
  const { useState, useEffect, useRef } = React;
  
  // Extraer propiedades
  const { core, plugin } = props;
  
  // Referencias
  const chartContainerRef = useRef(null);
  
  // Estados locales
  const [chartType, setChartType] = useState('bar');
  const [dataType, setDataType] = useState('events');
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 300 });
  
  // Efecto para cargar datos
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    const fetchData = async () => {
      try {
        // Generar datos según el tipo seleccionado
        let data = [];
        
        switch (dataType) {
          case 'events':
            // Datos de eventos (últimos 7 días)
            data = generateEventData();
            break;
          case 'performance':
            // Datos de rendimiento (simulados)
            data = generatePerformanceData();
            break;
          case 'activity':
            // Datos de actividad (simulados)
            data = generateActivityData();
            break;
          default:
            data = generateEventData();
        }
        
        setChartData(data);
        setIsLoading(false);
      } catch (error) {
        logger.error('Error al cargar datos para gráfica:', error);
        setError('Error al cargar datos. Inténtalo de nuevo.');
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [dataType]);
  
  // Efecto para actualizar dimensiones del contenedor
  useEffect(() => {
    const updateDimensions = () => {
      if (chartContainerRef.current) {
        const { width } = chartContainerRef.current.getBoundingClientRect();
        setDimensions({
          width: width,
          height: 300
        });
      }
    };
    
    // Actualizar dimensiones iniciales
    updateDimensions();
    
    // Configurar listener para redimensionar
    window.addEventListener('resize', updateDimensions);
    
    // Limpiar listener al desmontar
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);
  
  /**
   * Generar datos de eventos para la última semana
   */
  const generateEventData = () => {
    const data = [];
    const today = new Date();
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    // Datos para los últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      data.push({
        name: dayNames[date.getDay()],
        created: Math.floor(Math.random() * 5) + 1,
        updated: Math.floor(Math.random() * 8) + 2,
        deleted: Math.floor(Math.random() * 3)
      });
    }
    
    return data;
  };
  
  /**
   * Generar datos de rendimiento simulados
   */
  const generatePerformanceData = () => {
    const data = [];
    
    // Datos para las últimas 24 horas
    for (let i = 0; i < 24; i++) {
      data.push({
        name: `${i}:00`,
        cpu: Math.floor(Math.random() * 30) + 10,
        memory: Math.floor(Math.random() * 40) + 30,
        requests: Math.floor(Math.random() * 15) + 5
      });
    }
    
    return data;
  };
  
  /**
   * Generar datos de actividad simulados
   */
  const generateActivityData = () => {
    const data = [];
    const categories = ['Trabajo', 'Reuniones', 'Descanso', 'Planificación', 'Investigación'];
    
    // Datos para categorías de actividad
    categories.forEach(category => {
      data.push({
        name: category,
        hours: Math.floor(Math.random() * 20) + 5,
        percentage: Math.floor(Math.random() * 50) + 10
      });
    });
    
    return data;
  };
  
  /**
   * Manejador para cambio de tipo de gráfica
   */
  const handleChartTypeChange = (e) => {
    setChartType(e.target.value);
  };
  
  /**
   * Manejador para cambio de tipo de datos
   */
  const handleDataTypeChange = (e) => {
    setDataType(e.target.value);
  };
  
  /**
   * Generar colores para los datos
   */
  const getDataColors = () => {
    return {
      created: '#4CAF50',    // Verde
      updated: '#2196F3',    // Azul
      deleted: '#F44336',    // Rojo
      cpu: '#FF9800',        // Naranja
      memory: '#9C27B0',     // Púrpura
      requests: '#00BCD4',   // Cian
      hours: '#8BC34A',      // Verde claro
      percentage: '#3F51B5'  // Índigo
    };
  };
  
  /**
   * Renderizar el componente de gráfica adecuado
   */
  const renderChart = () => {
    if (isLoading) {
      return React.createElement(
        'div',
        { className: 'pg-loading' },
        [
          React.createElement('div', { key: 'spinner', className: 'pg-spinner' }),
          React.createElement('p', { key: 'text' }, 'Cargando datos...')
        ]
      );
    }
    
    if (error) {
      return React.createElement(
        'div',
        { className: 'pg-chart-error' },
        error
      );
    }
    
    // Obtener colores para los datos
    const colors = getDataColors();
    
    // Determinar qué campos mostrar según el tipo de datos
    let fields = [];
    switch (dataType) {
      case 'events':
        fields = ['created', 'updated', 'deleted'];
        break;
      case 'performance':
        fields = ['cpu', 'memory', 'requests'];
        break;
      case 'activity':
        fields = ['hours', 'percentage'];
        break;
    }
    
    // Renderizar según el tipo de gráfica
    switch (chartType) {
      case 'bar':
        return renderBarChart(chartData, fields, colors);
      case 'line':
        return renderLineChart(chartData, fields, colors);
      case 'pie':
        return renderPieChart(chartData, fields, colors);
      case 'area':
        return renderAreaChart(chartData, fields, colors);
      default:
        return renderBarChart(chartData, fields, colors);
    }
  };
  
  /**
   * Renderizar gráfica de barras
   */
  const renderBarChart = (data, fields, colors) => {
    return React.createElement(
      React.Fragment,
      {},
      [
        React.createElement(
          'div',
          { key: 'title', className: 'pg-chart-title' },
          getTitleForDataType(dataType)
        ),
        React.createElement(
          'div',
          { key: 'chart', className: 'pg-chart-container' },
          React.createElement(
            'svg',
            {
              width: dimensions.width,
              height: dimensions.height,
              className: 'pg-chart'
            },
            [
              // Eje X
              React.createElement(
                'line',
                {
                  key: 'x-axis',
                  x1: 50,
                  y1: dimensions.height - 30,
                  x2: dimensions.width - 20,
                  y2: dimensions.height - 30,
                  stroke: 'var(--pg-border-color)',
                  strokeWidth: 1
                }
              ),
              
              // Eje Y
              React.createElement(
                'line',
                {
                  key: 'y-axis',
                  x1: 50,
                  y1: 20,
                  x2: 50,
                  y2: dimensions.height - 30,
                  stroke: 'var(--pg-border-color)',
                  strokeWidth: 1
                }
              ),
              
              // Barras y etiquetas
              ...renderBarChartElements(data, fields, colors)
            ]
          )
        ),
        React.createElement(
          'div',
          { key: 'legend', className: 'pg-chart-legend' },
          fields.map(field => React.createElement(
            'div',
            { key: field, className: 'pg-legend-item' },
            [
              React.createElement(
                'span',
                {
                  key: 'color',
                  className: 'pg-legend-color',
                  style: { backgroundColor: colors[field] }
                }
              ),
              React.createElement(
                'span',
                { key: 'label', className: 'pg-legend-label' },
                getFieldLabel(field)
              )
            ]
          ))
        )
      ]
    );
  };
  
  /**
   * Renderizar elementos para la gráfica de barras
   */
  const renderBarChartElements = (data, fields, colors) => {
    const elements = [];
    const chartWidth = dimensions.width - 70;
    const chartHeight = dimensions.height - 50;
    const barWidth = (chartWidth / data.length) / (fields.length + 1);
    
    // Encontrar el valor máximo para escalar
    let maxValue = 0;
    data.forEach(item => {
      fields.forEach(field => {
        if (item[field] > maxValue) {
          maxValue = item[field];
        }
      });
    });
    
    // Factor de escala
    const scale = chartHeight / (maxValue * 1.2);
    
    // Generar barras y etiquetas
    data.forEach((item, index) => {
      const x = 50 + (index * (chartWidth / data.length)) + barWidth;
      
      // Etiqueta del eje X
      elements.push(
        React.createElement(
          'text',
          {
            key: `x-label-${index}`,
            x: x + (barWidth * fields.length / 2),
            y: dimensions.height - 10,
            textAnchor: 'middle',
            fill: 'var(--pg-text-color)',
            fontSize: 10
          },
          item.name
        )
      );
      
      // Barras para cada campo
      fields.forEach((field, fieldIndex) => {
        const barHeight = item[field] * scale;
        const barX = x + (fieldIndex * barWidth);
        const barY = dimensions.height - 30 - barHeight;
        
        elements.push(
          React.createElement(
            'rect',
            {
              key: `bar-${index}-${field}`,
              x: barX,
              y: barY,
              width: barWidth - 2,
              height: barHeight,
              fill: colors[field]
            }
          )
        );
        
        // Valor encima de la barra
        elements.push(
          React.createElement(
            'text',
            {
              key: `value-${index}-${field}`,
              x: barX + (barWidth / 2),
              y: barY - 5,
              textAnchor: 'middle',
              fill: 'var(--pg-text-color)',
              fontSize: 10
            },
            item[field].toString()
          )
        );
      });
    });
    
    return elements;
  };
  
  /**
   * Renderizar gráfica de línea (simplificada para el ejemplo)
   */
  const renderLineChart = (data, fields, colors) => {
    return React.createElement(
      React.Fragment,
      {},
      [
        React.createElement(
          'div',
          { key: 'title', className: 'pg-chart-title' },
          getTitleForDataType(dataType)
        ),
        React.createElement(
          'div',
          { key: 'chart-placeholder', className: 'pg-chart-placeholder' },
          'Esta es una representación simplificada de una gráfica de línea. En un plugin real, se implementaría la visualización completa.'
        ),
        React.createElement(
          'div',
          { key: 'legend', className: 'pg-chart-legend' },
          fields.map(field => React.createElement(
            'div',
            { key: field, className: 'pg-legend-item' },
            [
              React.createElement(
                'span',
                {
                  key: 'color',
                  className: 'pg-legend-color',
                  style: { backgroundColor: colors[field] }
                }
              ),
              React.createElement(
                'span',
                { key: 'label', className: 'pg-legend-label' },
                getFieldLabel(field)
              )
            ]
          ))
        )
      ]
    );
  };
  
  /**
   * Renderizar gráfica de pastel (simplificada para el ejemplo)
   */
  const renderPieChart = (data, fields, colors) => {
    return React.createElement(
      React.Fragment,
      {},
      [
        React.createElement(
          'div',
          { key: 'title', className: 'pg-chart-title' },
          getTitleForDataType(dataType)
        ),
        React.createElement(
          'div',
          { key: 'chart-placeholder', className: 'pg-chart-placeholder' },
          'Esta es una representación simplificada de una gráfica de pastel. En un plugin real, se implementaría la visualización completa.'
        ),
        React.createElement(
          'div',
          { key: 'legend', className: 'pg-chart-legend' },
          fields.map(field => React.createElement(
            'div',
            { key: field, className: 'pg-legend-item' },
            [
              React.createElement(
                'span',
                {
                  key: 'color',
                  className: 'pg-legend-color',
                  style: { backgroundColor: colors[field] }
                }
              ),
              React.createElement(
                'span',
                { key: 'label', className: 'pg-legend-label' },
                getFieldLabel(field)
              )
            ]
          ))
        )
      ]
    );
  };
  
  /**
   * Renderizar gráfica de área (simplificada para el ejemplo)
   */
  const renderAreaChart = (data, fields, colors) => {
    return React.createElement(
      React.Fragment,
      {},
      [
        React.createElement(
          'div',
          { key: 'title', className: 'pg-chart-title' },
          getTitleForDataType(dataType)
        ),
        React.createElement(
          'div',
          { key: 'chart-placeholder', className: 'pg-chart-placeholder' },
          'Esta es una representación simplificada de una gráfica de área. En un plugin real, se implementaría la visualización completa.'
        ),
        React.createElement(
          'div',
          { key: 'legend', className: 'pg-chart-legend' },
          fields.map(field => React.createElement(
            'div',
            { key: field, className: 'pg-legend-item' },
            [
              React.createElement(
                'span',
                {
                  key: 'color',
                  className: 'pg-legend-color',
                  style: { backgroundColor: colors[field] }
                }
              ),
              React.createElement(
                'span',
                { key: 'label', className: 'pg-legend-label' },
                getFieldLabel(field)
              )
            ]
          ))
        )
      ]
    );
  };
  
  /**
   * Obtener etiqueta para un campo
   */
  const getFieldLabel = (field) => {
    const labels = {
      created: 'Creados',
      updated: 'Actualizados',
      deleted: 'Eliminados',
      cpu: 'CPU (%)',
      memory: 'Memoria (%)',
      requests: 'Peticiones',
      hours: 'Horas',
      percentage: 'Porcentaje'
    };
    
    return labels[field] || field;
  };
  
  /**
   * Obtener título para el tipo de datos
   */
  const getTitleForDataType = (type) => {
    const titles = {
      events: 'Actividad de eventos (últimos 7 días)',
      performance: 'Métricas de rendimiento (últimas 24 horas)',
      activity: 'Distribución de actividades'
    };
    
    return titles[type] || 'Datos';
  };
  
  // Renderizar demostración de gráficas
  return React.createElement(
    'div',
    { className: 'pg-charts-demo', ref: chartContainerRef },
    [
      // Controles
      React.createElement(
        'div',
        { key: 'controls', className: 'pg-chart-controls' },
        [
          // Selector de tipo de gráfica
          React.createElement(
            'div',
            { key: 'chart-type', className: 'pg-control-group' },
            [
              React.createElement('label', { key: 'label', htmlFor: 'chart-type' }, 'Tipo de gráfica:'),
              React.createElement(
                'select',
                {
                  key: 'select',
                  id: 'chart-type',
                  value: chartType,
                  onChange: handleChartTypeChange,
                  className: 'pg-select'
                },
                [
                  React.createElement('option', { key: 'bar', value: 'bar' }, 'Barras'),
                  React.createElement('option', { key: 'line', value: 'line' }, 'Línea'),
                  React.createElement('option', { key: 'pie', value: 'pie' }, 'Pastel'),
                  React.createElement('option', { key: 'area', value: 'area' }, 'Área')
                ]
              )
            ]
          ),
          
          // Selector de tipo de datos
          React.createElement(
            'div',
            { key: 'data-type', className: 'pg-control-group' },
            [
              React.createElement('label', { key: 'label', htmlFor: 'data-type' }, 'Datos:'),
              React.createElement(
                'select',
                {
                  key: 'select',
                  id: 'data-type',
                  value: dataType,
                  onChange: handleDataTypeChange,
                  className: 'pg-select'
                },
                [
                  React.createElement('option', { key: 'events', value: 'events' }, 'Eventos'),
                  React.createElement('option', { key: 'performance', value: 'performance' }, 'Rendimiento'),
                  React.createElement('option', { key: 'activity', value: 'activity' }, 'Actividad')
                ]
              )
            ]
          )
        ]
      ),
      
      // Gráfica
      React.createElement(
        'div',
        { key: 'chart-wrapper', className: 'pg-chart-wrapper' },
        renderChart()
      )
    ]
  );
}

export default ChartsDemo;