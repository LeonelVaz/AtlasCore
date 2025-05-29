# Plugin: Weather Integration (Integración Meteorológica) - Visión Conceptual

## 1. Visión General

El plugin **Weather Integration** para Atlas tiene como propósito enriquecer la experiencia de planificación mostrando información meteorológica relevante directamente dentro de la aplicación. Los usuarios podrían ver la previsión del tiempo para los días en su calendario y obtener detalles específicos para eventos, especialmente aquellos programados al aire libre.

## 2. Funcionalidades Clave Propuestas

- **Previsión Diaria en el Calendario:**
  - Mostrar un icono meteorológico y la temperatura (máxima/mínima) en los encabezados de día de las vistas semanal y diaria del calendario de Atlas.
- **Información Meteorológica para Eventos:**
  - Para eventos marcados como "al aire libre", mostrar un resumen de la previsión meteorológica para la hora y lugar del evento en sus detalles.
- **Widget Meteorológico:**
  - Un widget (potencialmente en `CALENDAR_SIDEBAR` o en un dashboard futuro de Atlas) que muestre el clima actual y una previsión para los próximos días para una ubicación seleccionada.
- **Configuración de Ubicación:**
  - Detección automática de la ubicación del usuario (con su permiso).
  - Opción para establecer manualmente una o varias ubicaciones de interés.
- **Preferencias de Unidades:** Selección entre unidades métricas (°C, km/h) e imperiales (°F, mph).
- **(Potencial) Alertas Meteorológicas:** Notificaciones sobre condiciones climáticas adversas (lluvia, nieve, tormentas) para eventos al aire libre programados.

## 3. Arquitectura Conceptual y Módulos

- **`index.js`:** Punto de entrada del plugin.
- **Componentes UI (`components/`):**
  - `WeatherWidget.jsx`: Componente para el widget principal en la UI.
  - `DailyForecastIcon.jsx`: Pequeño componente para mostrar en los encabezados de día del calendario.
  - `EventWeatherInfo.jsx`: Componente para mostrar información meteorológica en los detalles de un evento.
- **Servicios (`services/`):**
  - `WeatherApiService.js`: Encargado de realizar las llamadas a una API meteorológica externa (ej. OpenWeatherMap, WeatherAPI.com, etc.). Manejaría la clave de API y la caché de respuestas.
- **Utilidades (`utils/`):** Funciones para formatear datos meteorológicos, convertir unidades, seleccionar iconos apropiados.
- **Estilos y Localización:** Carpetas `styles/` y `locales/`.

## 4. Interacción con Atlas Core

- **Extensiones UI:**
  - Registraría `DailyForecastIcon.jsx` en la zona `CALENDAR_DAY_HEADER`.
  - Registraría `EventWeatherInfo.jsx` en la zona `EVENT_DETAIL_VIEW`.
  - Podría registrar `WeatherWidget.jsx` en `CALENDAR_SIDEBAR`.
  - Añadiría una sección al `SETTINGS_PANEL` para la configuración del plugin (API key, ubicación, unidades, preferencias de alerta).
  - Podría extender `EVENT_FORM` con un toggle para marcar un evento como "al aire libre".
- **Almacenamiento:** Usaría `coreAPI.storage` para guardar la clave de API (encriptada si es posible o con advertencias), la ubicación preferida, las unidades y otras configuraciones.
- **Eventos del Calendario:** Se suscribiría a `CalendarEvents.DATE_CHANGED` y `CalendarEvents.VIEW_CHANGED` para saber qué fechas están visibles y necesita obtener la previsión. También a `CalendarEvents.EVENT_UPDATED` si necesita re-evaluar si un evento es al aire libre.
- **Permisos:** Necesitaría el permiso `network` para acceder a APIs externas. Si usa geolocalización del navegador, requeriría el manejo de esos permisos.
- **Notificaciones (Potencial):** Si implementa alertas, podría usar `coreAPI.notifications` o su propio `NotificationService`.

## 5. API Pública y Eventos del Plugin (Conceptuales)

- **Métodos Públicos (ejemplos):**
  - `getWeatherForLocation(location, date)`: Obtiene datos para una ubicación y fecha.
  - `setUserLocation(location)`
  - `setUnits(units)`
- **Eventos Publicados (ejemplos):**
  - `weather-integration.weatherUpdated`: Cuando se actualizan los datos meteorológicos.
  - `weather-integration.locationChanged`: Si el usuario cambia su ubicación configurada.

## 6. Consideraciones de Diseño y UX

- **API Key:** El plugin necesitará que el usuario proporcione su propia clave de API para un servicio meteorológico (a menos que Atlas decida proveer una clave genérica con límites de uso). Esto debe comunicarse claramente durante la configuración.
- **Rendimiento:** Limitar el número de llamadas a la API externa y cachear los resultados eficazmente.
- **Claridad Visual:** Los iconos y datos meteorológicos deben ser discretos para no sobrecargar la interfaz del calendario, pero fácilmente accesibles.
- **Precisión de la Ubicación:** Ofrecer múltiples formas de establecer la ubicación (automática, por nombre de ciudad, por coordenadas).

Este plugin aportaría un contexto valioso a la planificación, permitiendo a los usuarios tomar decisiones más informadas basadas en las condiciones climáticas.
