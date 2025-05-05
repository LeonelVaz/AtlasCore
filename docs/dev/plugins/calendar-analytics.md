# Calendar Analytics

## Visión General
El plugin Calendar Analytics proporciona análisis exhaustivo y estadísticas sobre el uso del calendario, generando informes visuales que ayudan al usuario a comprender cómo distribuye su tiempo. Ofrece métricas detalladas, gráficos interactivos y recomendaciones personalizadas para optimizar la gestión del tiempo.

## Arquitectura
El plugin se estructura en torno a un motor de análisis de datos que procesa los eventos del calendario y genera visualizaciones a través de componentes especializados.

```
calendar-analytics/
├── index.js                 # Punto de entrada
├── components/              # Componentes UI
│   ├── analytics-dashboard.jsx # Panel principal
│   ├── time-distribution.jsx # Gráfico de distribución
│   ├── category-pie-chart.jsx # Gráfico circular por categorías
│   └── activity-timeline.jsx # Línea de tiempo de actividad
├── services/                # Servicios
│   ├── data-processor.js    # Procesamiento de datos
│   └── report-generator.js  # Generación de informes
├── utils/                   # Utilidades
│   ├── analytics-utils.js   # Funciones de procesamiento y formateo
│   └── data-processing.js   # Procesamiento avanzado de datos
├── styles/                  # Estilos
│   └── analytics.css        # Estilos específicos del plugin
├── locales/                 # Traducciones
│   ├── es/                  # Español
│   │   └── analytics.json
│   └── en/                  # Inglés
│       └── analytics.json
└── README.md                # Documentación
```

## API y Interfaces
El plugin expone las siguientes funcionalidades a través de su API:

### Métodos Públicos
| Método | Parámetros | Retorno | Descripción |
|--------|------------|---------|-------------|
| `getTimeDistribution` | `options: AnalyticsOptions` | `TimeDistributionData` | Obtiene análisis de distribución del tiempo |
| `getCategoryBreakdown` | `options: AnalyticsOptions` | `CategoryBreakdownData` | Obtiene análisis por categorías/colores |
| `getProductivityMetrics` | `options: AnalyticsOptions` | `ProductivityMetrics` | Obtiene métricas de productividad |
| `getActivityHeatmap` | `options: AnalyticsOptions` | `HeatmapData` | Obtiene mapa de calor de actividad |
| `getTrendAnalysis` | `options: AnalyticsOptions` | `TrendData` | Obtiene análisis de tendencias a lo largo del tiempo |
| `generateReport` | `options: ReportOptions` | `Report` | Genera un informe completo |
| `exportReport` | `reportId: string, format: string` | `Blob` | Exporta un informe en formato específico |
| `getOptimizationSuggestions` | `options: AnalyticsOptions` | `Array<Suggestion>` | Obtiene sugerencias de optimización |

### Eventos
| Nombre del Evento | Datos | Descripción |
|-------------------|------|-------------|
| `calendar-analytics.report_generated` | `{ reportId: string, type: string }` | Se dispara cuando se genera un informe |
| `calendar-analytics.analysis_complete` | `{ analysisType: string, dataPoints: number }` | Se dispara cuando finaliza un análisis |
| `calendar-analytics.export_complete` | `{ reportId: string, format: string, size: number }` | Se dispara cuando se exporta un informe |
| `calendar-analytics.preferences_updated` | `{ preferences: AnalyticsPreferences }` | Se dispara al actualizar preferencias |

## Integración con el Sistema Principal
El plugin se integra con el núcleo de Atlas de la siguiente manera:

### Registro del Módulo
```javascript
// Registro del módulo Calendar Analytics
registerModule('calendar-analytics', calendarAnalyticsAPI);
```

### Suscripción a Eventos
```javascript
// Suscripción a eventos del calendario (solo lectura)
subscribeToEvent(EVENT_TYPES.CALENDAR.EVENT_CREATED, handleEventChange);
subscribeToEvent(EVENT_TYPES.CALENDAR.EVENT_UPDATED, handleEventChange);
subscribeToEvent(EVENT_TYPES.CALENDAR.EVENT_DELETED, handleEventChange);
```

### Extensiones UI
- Añade una entrada "Análisis" en la navegación principal
- Integra widgets en el dashboard principal (opcional)
- Proporciona una vista completa de análisis con múltiples paneles
- Añade una sección en la configuración para preferencias de análisis

## Estados y Ciclo de Vida
1. **Inicialización**: Carga de preferencias y configuración de análisis
2. **Recopilación**: Lectura de datos del calendario para análisis
3. **Procesamiento**: Generación de métricas y estadísticas
4. **Visualización**: Renderizado de gráficos e informes
5. **Actualización**: Recálculo periódico o bajo demanda
6. **Exportación**: Generación de informes en varios formatos

## Estructura de Datos
```javascript
// Opciones de análisis
const analyticsOptionsExample = {
  timeRange: {
    start: '2023-01-01T00:00:00Z',
    end: '2023-03-31T23:59:59Z'
  },
  groupBy: 'day', // 'hour', 'day', 'week', 'month'
  filters: {
    categories: ['work', 'personal'],
    colors: ['#2D4B94', '#26A69A'],
    excludeAllDay: true
  },
  compareWith: { // Opcional, para comparaciones
    start: '2022-10-01T00:00:00Z',
    end: '2022-12-31T23:59:59Z'
  }
};

// Datos de distribución de tiempo
const timeDistributionExample = {
  total: 432000, // Tiempo total en segundos
  breakdown: {
    'work': 259200, // 60%
    'personal': 86400, // 20%
    'health': 43200, // 10%
    'other': 43200 // 10%
  },
  byDayOfWeek: {
    'monday': 86400,
    'tuesday': 72000,
    // ...resto de días
  },
  byHourOfDay: {
    '9': 36000,
    '10': 39600,
    // ...resto de horas
  },
  averagePerDay: 14400, // Promedio diario en segundos
  busiest: {
    day: 'wednesday',
    hour: '14'
  }
};

// Informe generado
const reportExample = {
  id: 'report-123456',
  title: 'Análisis Trimestral Q1 2023',
  generatedAt: '2023-04-01T10:30:00Z',
  timeRange: {
    start: '2023-01-01T00:00:00Z',
    end: '2023-03-31T23:59:59Z'
  },
  sections: [
    {
      title: 'Distribución del Tiempo',
      type: 'time-distribution',
      data: {/*...*/}
    },
    {
      title: 'Análisis por Categorías',
      type: 'category-breakdown',
      data: {/*...*/}
    },
    // ...más secciones
  ],
  summary: {
    highlights: [
      'Pasaste 60% del tiempo en actividades laborales',
      'Tu día más productivo fue miércoles',
      'Tienes un promedio de 4 horas de reuniones semanales'
    ],
    suggestions: [
      'Considera programar más descansos entre reuniones largas',
      'Los viernes tienes menos energía, programa tareas menos intensivas'
    ]
  }
};

// Preferencias de análisis
const preferencesExample = {
  defaultTimeRange: 'month', // 'week', 'month', 'quarter', 'year'
  defaultView: 'dashboard', // 'dashboard', 'time-distribution', 'categories'
  autoRefresh: true,
  autoRefreshInterval: 3600, // en segundos
  workingHours: {
    start: '09:00',
    end: '18:00'
  },
  categories: [
    { name: 'Trabajo', color: '#2D4B94', keywords: ['reunión', 'proyecto'] },
    { name: 'Personal', color: '#26A69A', keywords: ['familia', 'amigos'] },
    { name: 'Salud', color: '#7E57C2', keywords: ['ejercicio', 'médico'] }
  ]
};
```

## Guía de Uso para Desarrolladores
Para integrar con el plugin Calendar Analytics:

1. Obtenga la API del módulo
   ```javascript
   const calendarAnalytics = getModule('calendar-analytics');
   if (!calendarAnalytics) {
     console.warn('Plugin Calendar Analytics no disponible');
     return;
   }
   ```

2. Obtenga análisis específicos
   ```javascript
   // Análisis de distribución de tiempo para el último mes
   const lastMonth = {
     start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
     end: new Date()
   };
   
   const timeDistribution = calendarAnalytics.getTimeDistribution({
     timeRange: {
       start: lastMonth.start.toISOString(),
       end: lastMonth.end.toISOString()
     },
     groupBy: 'day'
   });
   ```

3. Genere y exporte informes
   ```javascript
   // Generar un informe mensual
   const report = calendarAnalytics.generateReport({
     title: 'Informe Mensual',
     timeRange: {
       start: lastMonth.start.toISOString(),
       end: lastMonth.end.toISOString()
     },
     sections: ['time-distribution', 'category-breakdown', 'productivity']
   });
   
   // Exportar a PDF
   const pdfBlob = await calendarAnalytics.exportReport(report.id, 'pdf');
   ```

## Ejemplos de Uso

### Ejemplo Básico: Widget de resumen para dashboard
```javascript
function AnalyticsSummaryWidget() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const calendarAnalytics = getModule('calendar-analytics');
  
  useEffect(() => {
    if (!calendarAnalytics) {
      setLoading(false);
      return;
    }
    
    // Obtener datos para el widget
    const fetchSummaryData = async () => {
      try {
        // Definir rango de tiempo (última semana)
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        
        // Obtener métricas
        const metrics = await calendarAnalytics.getProductivityMetrics({
          timeRange: {
            start: weekStart.toISOString(),
            end: now.toISOString()
          }
        });
        
        setSummary(metrics);
      } catch (err) {
        console.error('Error al obtener métricas:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSummaryData();
    
    // Actualizar cuando se generen nuevos análisis
    const unsubscribe = subscribeToEvent(
      'calendar-analytics.analysis_complete', 
      fetchSummaryData
    );
    
    return unsubscribe;
  }, []);
  
  if (loading) {
    return <div className="analytics-widget loading">Cargando análisis...</div>;
  }
  
  if (!calendarAnalytics) {
    return (
      <div className="analytics-widget not-available">
        El análisis de calendario no está disponible
      </div>
    );
  }
  
  if (!summary) {
    return (
      <div className="analytics-widget no-data">
        No hay suficientes datos para análisis
      </div>
    );
  }
  
  // Renderizar widget con datos
  return (
    <div className="analytics-widget">
      <h3>Resumen Semanal</h3>
      
      <div className="metrics-grid">
        <div className="metric">
          <span className="value">{formatHours(summary.totalTime)}</span>
          <span className="label">Horas Programadas</span>
        </div>
        
        <div className="metric">
          <span className="value">{summary.eventsCount}</span>
          <span className="label">Eventos</span>
        </div>
        
        <div className="metric">
          <span className="value">{summary.busiest.day}</span>
          <span className="label">Día Más Ocupado</span>
        </div>
        
        <div className="metric">
          <span className="value">{formatPercentage(summary.focusTime)}</span>
          <span className="label">Tiempo Enfocado</span>
        </div>
      </div>
      
      {summary.suggestion && (
        <div className="suggestion">
          <span className="icon">💡</span>
          <span className="text">{summary.suggestion}</span>
        </div>
      )}
    </div>
  );
}
```

### Ejemplo Avanzado: Panel de distribución de tiempo
```javascript
function TimeDistributionPanel() {
  const [timeData, setTimeData] = useState(null);
  const [dateRange, setDateRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState('day');
  const calendarAnalytics = getModule('calendar-analytics');
  
  // Función para calcular rango de fechas basado en selección
  const calculateDateRange = (range) => {
    const now = new Date();
    const end = new Date(now);
    const start = new Date(now);
    
    switch(range) {
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setMonth(now.getMonth() - 1);
    }
    
    return { start, end };
  };
  
  // Cargar datos cuando cambie el rango o agrupación
  useEffect(() => {
    if (!calendarAnalytics) {
      setLoading(false);
      return;
    }
    
    const fetchTimeDistribution = async () => {
      setLoading(true);
      
      try {
        const { start, end } = calculateDateRange(dateRange);
        
        const timeDistribution = await calendarAnalytics.getTimeDistribution({
          timeRange: {
            start: start.toISOString(),
            end: end.toISOString()
          },
          groupBy
        });
        
        setTimeData(timeDistribution);
      } catch (err) {
        console.error('Error al obtener distribución de tiempo:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTimeDistribution();
  }, [dateRange, groupBy]);
  
  // Renderizar controles y gráfico
  return (
    <div className="time-distribution-panel">
      <div className="panel-header">
        <h2>Distribución del Tiempo</h2>
        
        <div className="controls">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="date-range-selector"
          >
            <option value="week">Última Semana</option>
            <option value="month">Último Mes</option>
            <option value="quarter">Último Trimestre</option>
            <option value="year">Último Año</option>
          </select>
          
          <select 
            value={groupBy} 
            onChange={(e) => setGroupBy(e.target.value)}
            className="group-by-selector"
          >
            <option value="hour">Por Hora</option>
            <option value="day">Por Día</option>
            <option value="week">Por Semana</option>
            <option value="month">Por Mes</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-indicator">Cargando datos...</div>
      ) : !timeData ? (
        <div className="no-data-message">
          No hay suficientes datos para este rango de tiempo
        </div>
      ) : (
        <div className="chart-container">
          {/* Renderizar gráfico principal */}
          <BarChart 
            data={transformDataForChart(timeData, groupBy)} 
            height={300} 
            width="100%"
          />
          
          {/* Mostrar estadísticas adicionales */}
          <div className="stats-container">
            <div className="stat-box total">
              <h4>Tiempo Total</h4>
              <div className="value">{formatHours(timeData.total)}</div>
            </div>
            
            <div className="stat-box average">
              <h4>Promedio Diario</h4>
              <div className="value">{formatHours(timeData.averagePerDay)}</div>
            </div>
            
            <div className="stat-box busiest">
              <h4>Día Más Ocupado</h4>
              <div className="value">{formatDay(timeData.busiest.day)}</div>
            </div>
            
            <div className="stat-box categories">
              <h4>Distribución por Categoría</h4>
              <PieChart 
                data={transformCategoriesForChart(timeData.breakdown)} 
                height={150} 
                width={150}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Funciones auxiliares
function transformDataForChart(timeData, groupBy) {
  // Transformar datos según la agrupación seleccionada
  // ...código de transformación
}

function transformCategoriesForChart(breakdown) {
  // Transformar datos de categorías para gráfico circular
  // ...código de transformación
}

function formatHours(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function formatDay(day) {
  const days = {
    'monday': 'Lunes',
    'tuesday': 'Martes',
    'wednesday': 'Miércoles',
    'thursday': 'Jueves',
    'friday': 'Viernes',
    'saturday': 'Sábado',
    'sunday': 'Domingo'
  };
  return days[day] || day;
}

function formatPercentage(value) {
  return `${Math.round(value * 100)}%`;
}
```

## Dependencias
- **Gráficos**: Utiliza bibliotecas de visualización de datos para representación gráfica
- **Exportación**: Capacidades de generación de PDF, CSV y otros formatos
- **Calendario**: Acceso de solo lectura a datos del calendario para análisis
- **Almacenamiento**: Persiste configuraciones e informes generados
- **Procesamiento**: Algoritmos de análisis de patrones y tendencias
- **Internacionalización**: Utiliza el servicio de i18n para traducciones

## Consideraciones de Rendimiento
- Uso de procesamiento en segundo plano para análisis complejos
- Implementación de memoización para evitar recálculos innecesarios
- Almacenamiento en caché de resultados intermedios para consultas frecuentes
- Renderizado optimizado de gráficos con grandes conjuntos de datos
- Análisis incremental para actualizar solo lo necesario cuando cambian los datos

## Solución de Problemas Comunes
| Problema | Causa | Solución |
|----------|-------|----------|
| Tiempo de carga lento para informes | Gran cantidad de eventos | Activar "Modo ligero" para análisis rápido |
| Categorización incorrecta | Reglas de categoría mal definidas | Ajustar reglas en preferencias de análisis |
| Exportación de PDF falla | Gráficos demasiado complejos | Reducir el rango de tiempo o detalle de análisis |
| Datos no actualizados | Caché desactualizada | Usar botón "Actualizar análisis" manualmente |
| Períodos vacíos en gráficos | Datos insuficientes | Aumentar el rango de tiempo analizado |

## Historial de Versiones
| Versión | Cambios |
|---------|---------|
| 0.5.0   | Versión inicial con análisis básico y gráficos |
| 0.5.5   | Añadida exportación de informes en múltiples formatos |
| 0.6.0   | Implementadas sugerencias de optimización basadas en patrones |
| 0.8.0   | Añadido análisis predictivo y comparación de períodos |
| 1.0.0   | Soporte completo para internacionalización y accesibilidad |

**Nota sobre las fechas**: Los ejemplos y referencias a fechas en esta documentación son ilustrativos.