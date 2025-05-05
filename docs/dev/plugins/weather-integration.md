# Weather Integration

## Visión General
El plugin Weather Integration incorpora información meteorológica directamente en el calendario de Atlas, mostrando previsiones para los días visualizados y datos específicos para eventos programados al aire libre. Esta funcionalidad ayuda a los usuarios a planificar mejor sus actividades considerando las condiciones climáticas esperadas.

## Arquitectura
El plugin se estructura en torno a un conjunto de componentes de visualización y un servicio de conexión a APIs meteorológicas externas.

```
Weather Integration
│
├── Componentes UI
│   ├── WeatherWidget (Widget para la UI principal)
│   ├── ForecastDay (Previsión diaria)
│   └── EventWeather (Componente para eventos)
│
├── Servicios
│   └── weatherAPI (Servicio de conexión a API externa)
│
├── Utilidades
│   └── weatherUtils (Funciones de procesamiento y formateo)
│
├── Estilos
│   └── weather.css (Estilos específicos del plugin)
│
└── Traducciones
    ├── es/ (Español)
    │   └── weather.json
    └── en/ (Inglés)
        └── weather.json
```

## API y Interfaces
El plugin expone las siguientes funcionalidades a través de su API:

### Métodos Públicos
| Método | Parámetros | Retorno | Descripción |
|--------|------------|---------|-------------|
| `getCurrentWeather` | `location?: string` | `WeatherData` | Obtiene el clima actual para una ubicación |
| `getForecast` | `location?: string, days?: number` | `Array<ForecastData>` | Obtiene previsión para X días |
| `getWeatherForEvent` | `eventId: string` | `WeatherData \| null` | Obtiene clima previsto para un evento específico |
| `getWeatherForDate` | `date: Date, location?: string` | `WeatherData` | Obtiene clima para una fecha específica |
| `setLocation` | `location: string \| GeoCoordinates` | `boolean` | Establece la ubicación predeterminada |
| `getLocation` | ninguno | `string \| GeoCoordinates` | Obtiene la ubicación configurada |
| `setUnits` | `units: 'metric' \| 'imperial'` | `boolean` | Establece unidades (métrico/imperial) |
| `getUnits` | ninguno | `'metric' \| 'imperial'` | Obtiene las unidades configuradas |
| `markEventAsOutdoor` | `eventId: string, isOutdoor: boolean` | `boolean` | Marca/desmarca un evento como "al aire libre" |
| `isEventOutdoor` | `eventId: string` | `boolean` | Verifica si un evento está marcado como "al aire libre" |

### Eventos
| Nombre del Evento | Datos | Descripción |
|-------------------|------|-------------|
| `weather-integration.weather_updated` | `{ location: string, data: WeatherData }` | Se dispara cuando se actualiza el clima |
| `weather-integration.forecast_updated` | `{ location: string, data: Array<ForecastData> }` | Se dispara cuando se actualiza la previsión |
| `weather-integration.location_changed` | `{ newLocation: string, oldLocation: string }` | Se dispara cuando cambia la ubicación configurada |
| `weather-integration.units_changed` | `{ newUnits: string, oldUnits: string }` | Se dispara cuando cambian las unidades configuradas |
| `weather-integration.event_marked_outdoor` | `{ eventId: string, isOutdoor: boolean }` | Se dispara cuando se marca/desmarca un evento como "al aire libre" |

## Integración con el Sistema Principal
El plugin se integra con el núcleo de Atlas de la siguiente manera:

### Registro del Módulo
```javascript
// Registro del módulo Weather Integration
registerModule('weather-integration', weatherIntegrationAPI);
```

### Suscripción a Eventos
```javascript
// Suscripción a eventos del calendario
subscribeToEvent(EVENT_TYPES.CALENDAR.EVENT_CREATED, handleEventCreated);
subscribeToEvent(EVENT_TYPES.CALENDAR.EVENT_UPDATED, handleEventUpdated);
subscribeToEvent(EVENT_TYPES.CALENDAR.WEEK_CHANGED, handleWeekChanged);
subscribeToEvent(EVENT_TYPES.CALENDAR.DATE_SELECTED, handleDateSelected);
```

### Extensiones UI
- Extiende los encabezados de día con iconos de clima
- Añade indicadores meteorológicos en eventos marcados como "al aire libre"
- Proporciona un widget de previsión expandible en el panel lateral
- Integra una opción "evento al aire libre" en el formulario de eventos
- Añade una sección en configuración para preferencias meteorológicas

## Estados y Ciclo de Vida
1. **Inicialización**: Carga de configuración y detección inicial de ubicación
2. **Obtención de datos**: Conexión a API externa y caché de datos meteorológicos
3. **Renderizado**: Visualización de datos en diferentes componentes del calendario
4. **Actualización**: Refresco periódico de datos según configuración
5. **Limpieza**: Liberación de recursos y cancelación de solicitudes pendientes

## Estructura de Datos
```javascript
// Estructura de datos meteorológicos actuales
const weatherDataExample = {
  location: {
    name: 'San Luis',
    region: 'San Luis',
    country: 'Argentina',
    lat: -33.280, 
    lon: -66.338,
    timezone: 'America/Argentina/San_Luis'
  },
  current: {
    temp_c: 22.5,
    temp_f: 72.5,
    condition: {
      text: 'Parcialmente nublado',
      code: 1003,
      icon: 'partly-cloudy.png'
    },
    wind_kph: 15.1,
    wind_mph: 9.4,
    wind_dir: 'ENE',
    precip_mm: 0.0,
    precip_in: 0.0,
    humidity: 65,
    cloud: 25,
    feelslike_c: 24.2,
    feelslike_f: 75.6,
    uv: 5.0
  },
  updated: '2025-05-05T14:30:00Z',
  source: 'weatherapi.com'
};

// Estructura de previsión diaria
const forecastDataExample = {
  date: '2025-05-06',
  day: {
    maxtemp_c: 25.6,
    maxtemp_f: 78.1,
    mintemp_c: 14.2,
    mintemp_f: 57.6,
    avgtemp_c: 19.8,
    avgtemp_f: 67.6,
    condition: {
      text: 'Soleado',
      code: 1000,
      icon: 'sunny.png'
    },
    daily_chance_of_rain: 10,
    daily_chance_of_snow: 0,
    precip_mm: 0.5,
    precip_in: 0.02,
    uv: 6.0
  },
  astro: {
    sunrise: '07:12 AM',
    sunset: '06:45 PM',
    moonrise: '05:36 PM',
    moonset: '05:28 AM',
    moon_phase: 'Cuarto Creciente',
    moon_illumination: '51'
  },
  hour: [
    // Previsión horaria (24 entradas)
    {
      time: '2025-05-06T00:00:00Z',
      temp_c: 15.3,
      temp_f: 59.5,
      condition: {
        text: 'Despejado',
        code: 1000,
        icon: 'clear.png'
      },
      // ... más datos horarios
    }
    // ... resto de horas
  ]
};

// Preferencias del plugin
const preferencesExample = {
  location: {
    type: 'city', // 'city', 'coordinates', 'auto'
    value: 'San Luis, Argentina', // o coordenadas {lat: -33.280, lon: -66.338}
    autoDetect: true // si debe detectar automáticamente
  },
  units: 'metric', // 'metric' o 'imperial'
  display: {
    showInDayHeaders: true,
    showForOutdoorEvents: true,
    expandedWidget: false,
    refreshInterval: 3600 // segundos
  },
  alerts: {
    enabled: true,
    conditions: ['rain', 'snow', 'storm', 'extreme']
  }
};
```

## Guía de Uso para Desarrolladores
Para integrar con el plugin Weather Integration:

1. Obtenga la API del módulo
   ```javascript
   const weatherIntegration = getModule('weather-integration');
   if (!weatherIntegration) {
     console.warn('Plugin Weather Integration no disponible');
     return;
   }
   ```

2. Acceda a datos meteorológicos
   ```javascript
   // Obtener clima actual
   const currentWeather = weatherIntegration.getCurrentWeather();
   
   // Obtener previsión de 5 días
   const forecast = weatherIntegration.getForecast(null, 5);
   
   // Obtener clima para un evento específico
   const eventWeather = weatherIntegration.getWeatherForEvent('event-123');
   ```

3. Suscriba a eventos para reaccionar a cambios
   ```javascript
   subscribeToEvent('weather-integration.weather_updated', handleWeatherUpdate);
   subscribeToEvent('weather-integration.location_changed', handleLocationChange);
   ```

## Ejemplos de Uso

### Ejemplo Básico: Componente de clima para un día
```javascript
function DayWeatherWidget({ date, location }) {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const weatherIntegration = getModule('weather-integration');
  
  useEffect(() => {
    if (!weatherIntegration) {
      setLoading(false);
      return;
    }
    
    const fetchWeather = async () => {
      try {
        const data = await weatherIntegration.getWeatherForDate(date, location);
        setWeatherData(data);
      } catch (err) {
        console.error('Error al obtener datos del clima:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeather();
    
    // Suscribirse a actualizaciones
    const unsubscribe = subscribeToEvent(
      'weather-integration.weather_updated',
      (data) => {
        if (data.location === location) {
          fetchWeather();
        }
      }
    );
    
    return unsubscribe;
  }, [date, location]);
  
  if (loading) {
    return <div className="weather-widget loading">Cargando...</div>;
  }
  
  if (!weatherIntegration) {
    return (
      <div className="weather-widget not-available">
        Información climática no disponible
      </div>
    );
  }
  
  if (!weatherData) {
    return (
      <div className="weather-widget no-data">
        Sin datos para esta fecha/ubicación
      </div>
    );
  }
  
  // Obtener unidades configuradas
  const units = weatherIntegration.getUnits();
  const isMetric = units === 'metric';
  
  // Renderizar widget
  return (
    <div className="weather-widget">
      <div className="weather-icon">
        <img 
          src={weatherData.condition.icon} 
          alt={weatherData.condition.text} 
        />
      </div>
      
      <div className="weather-info">
        <div className="temperature">
          {isMetric 
            ? `${weatherData.temp_c}°C` 
            : `${weatherData.temp_f}°F`}
        </div>
        
        <div className="condition">
          {weatherData.condition.text}
        </div>
        
        <div className="details">
          <span className="precipitation">
            {`${weatherData.precip_mm}mm`}
          </span>
          <span className="wind">
            {isMetric 
              ? `${weatherData.wind_kph} km/h` 
              : `${weatherData.wind_mph} mph`}
          </span>
        </div>
      </div>
    </div>
  );
}
```

### Ejemplo Avanzado: Extensión de formulario de eventos
```javascript
function OutdoorEventWeatherExtension({ eventId }) {
  const [isOutdoor, setIsOutdoor] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherAlert, setWeatherAlert] = useState(null);
  const weatherIntegration = getModule('weather-integration');
  const calendar = getModule('calendar');
  
  useEffect(() => {
    if (!weatherIntegration || !calendar || !eventId) return;
    
    // Verificar si el evento está marcado como "al aire libre"
    const checkOutdoorStatus = () => {
      const isEventOutdoor = weatherIntegration.isEventOutdoor(eventId);
      setIsOutdoor(isEventOutdoor);
      
      // Si es un evento al aire libre, obtener datos meteorológicos
      if (isEventOutdoor) {
        fetchWeatherData();
      } else {
        setWeatherData(null);
        setWeatherAlert(null);
      }
    };
    
    // Obtener datos meteorológicos para el evento
    const fetchWeatherData = async () => {
      try {
        const weather = await weatherIntegration.getWeatherForEvent(eventId);
        
        if (weather) {
          setWeatherData(weather);
          
          // Verificar si hay condiciones adversas
          checkForAlerts(weather);
        }
      } catch (err) {
        console.error('Error al obtener clima para evento:', err);
      }
    };
    
    // Verificar condiciones adversas
    const checkForAlerts = (weather) => {
      // Obtener el evento del calendario
      const event = calendar.getEvent(eventId);
      if (!event) return;
      
      // Verificar condiciones según preferencias
      const preferences = weatherIntegration.getPreferences();
      const alertConditions = preferences.alerts.conditions || [];
      
      let alert = null;
      
      // Verificar lluvia
      if (alertConditions.includes('rain') && 
          weather.day.daily_chance_of_rain > 30) {
        alert = {
          type: 'rain',
          message: `Probabilidad de lluvia: ${weather.day.daily_chance_of_rain}%`,
          severity: weather.day.daily_chance_of_rain > 70 ? 'high' : 'medium'
        };
      }
      
      // Verificar condiciones extremas
      else if (alertConditions.includes('extreme')) {
        const condition = weather.day.condition.code;
        // Códigos para condiciones extremas (tormentas, etc.)
        const extremeCodes = [1087, 1273, 1276, 1279, 1282];
        
        if (extremeCodes.includes(condition)) {
          alert = {
            type: 'extreme',
            message: `Alerta: ${weather.day.condition.text}`,
            severity: 'high'
          };
        }
      }
      
      // Más verificaciones según necesidad...
      
      setWeatherAlert(alert);
    };
    
    // Verificar estado inicial
    checkOutdoorStatus();
    
    // Suscribirse a cambios
    const unsubscribeOutdoor = subscribeToEvent(
      'weather-integration.event_marked_outdoor', 
      (data) => {
        if (data.eventId === eventId) {
          checkOutdoorStatus();
        }
      }
    );
    
    const unsubscribeWeather = subscribeToEvent(
      'weather-integration.forecast_updated',
      () => {
        if (isOutdoor) {
          fetchWeatherData();
        }
      }
    );
    
    return () => {
      unsubscribeOutdoor();
      unsubscribeWeather();
    };
  }, [eventId, isOutdoor]);
  
  // Manejador para cambio de estado "al aire libre"
  const handleOutdoorToggle = () => {
    if (!weatherIntegration || !eventId) return;
    
    const newStatus = !isOutdoor;
    weatherIntegration.markEventAsOutdoor(eventId, newStatus);
    setIsOutdoor(newStatus);
    
    // Si se marca como al aire libre, obtener datos meteorológicos
    if (newStatus) {
      weatherIntegration.getWeatherForEvent(eventId)
        .then(setWeatherData)
        .catch(err => console.error('Error al obtener clima:', err));
    }
  };
  
  // Si el plugin no está disponible
  if (!weatherIntegration) {
    return null;
  }
  
  // Renderizar extensión del formulario
  return (
    <div className="event-weather-extension">
      <div className="outdoor-toggle">
        <label>
          <input 
            type="checkbox"
            checked={isOutdoor}
            onChange={handleOutdoorToggle}
          />
          Evento al aire libre
        </label>
      </div>
      
      {isOutdoor && weatherData && (
        <div className="event-weather-preview">
          <h4>Previsión Meteorológica</h4>
          
          <div className="weather-card">
            <div className="weather-header">
              <img 
                src={weatherData.day.condition.icon} 
                alt={weatherData.day.condition.text} 
              />
              <div className="weather-temp">
                {weatherIntegration.getUnits() === 'metric'
                  ? `${weatherData.day.avgtemp_c}°C`
                  : `${weatherData.day.avgtemp_f}°F`}
              </div>
            </div>
            
            <div className="weather-details">
              <div className="condition-text">
                {weatherData.day.condition.text}
              </div>
              
              <div className="precipitation">
                Probabilidad de lluvia: {weatherData.day.daily_chance_of_rain}%
              </div>
              
              <div className="sun-times">
                <span className="sunrise">
                  🌅 {weatherData.astro.sunrise}
                </span>
                <span className="sunset">
                  🌇 {weatherData.astro.sunset}
                </span>
              </div>
            </div>
          </div>
          
          {weatherAlert && (
            <div className={`weather-alert severity-${weatherAlert.severity}`}>
              ⚠️ {weatherAlert.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

## Dependencias
- **API Externa**: Conexión a servicios meteorológicos externos
- **Geolocalización**: Para detección automática de ubicación
- **Calendario**: Integración con eventos y vista principal
- **Almacenamiento**: Guarda preferencias y caché de datos
- **Internacionalización**: Utiliza el servicio de i18n para traducciones

## Consideraciones de Rendimiento
- Implementación de caché para datos meteorológicos con tiempo de validez
- Solicitudes agrupadas para evitar múltiples llamadas a la API
- Carga diferida de previsiones detalladas solo cuando se necesitan
- Limitación de actualizaciones automáticas según configuración
- Optimización de componentes de visualización para renderizado eficiente

## Solución de Problemas Comunes
| Problema | Causa | Solución |
|----------|-------|----------|
| Datos meteorológicos no aparecen | API no accesible o ubicación no configurada | Verificar conexión a internet y configurar ubicación manualmente |
| Ubicación incorrecta | Detección automática imprecisa | Desactivar detección automática y configurar ubicación manualmente |
| Iconos meteorológicos no se muestran | Recursos no cargados correctamente | Usar modo alternativo de visualización sin imágenes |
| Datos desactualizados | Problemas de caché o actualización | Usar botón "Actualizar datos meteorológicos" en configuración |
| Diferencia entre previsión y clima real | Limitaciones inherentes a las previsiones | Usar fuente de datos alternativa o ajustar expectativas |

## Historial de Versiones
| Versión | Cambios |
|---------|---------|
| 0.5.0   | Versión inicial con datos básicos e integración con encabezados de día |
| 0.5.5   | Añadido soporte para eventos al aire libre y alertas |
| 0.6.0   | Mejora de visualización y múltiples proveedores de datos |
| 0.8.0   | Previsiones históricas y tendencias para planificación a largo plazo |
| 1.0.0   | Soporte completo para internacionalización y accesibilidad |