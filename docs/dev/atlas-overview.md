# Documentación Completa de Atlas

## Índice de Funcionalidades

1. **Arquitectura Base y Sistema de Plugins**
   - Estructura Modular
   - Sistema de Bus de Eventos
   - Registro de Módulos e Interoperabilidad
   - Integración Electron para Aplicación de Escritorio

2. **Aplicación Principal - Atlas**
   - Vistas y Navegación
   - Gestión de Eventos
   - Interacciones Avanzadas
   - Sistema de Escalas de Tiempo
   - Personalización de Horarios

3. **Sistema de Administración y Monitoreo**
   - Panel de Administración
   - Visor de Logs
   - Gestión de Errores
   - Utilidades UI Modernas

4. **Gestión de Datos y Almacenamiento**
   - Sistema de Almacenamiento Abstracto
   - Exportación e Importación
   - Copias de Seguridad

5. **Sistema de Temas y Personalización Visual**
   - Temas Predefinidos y Personalización
   - Configuración de Elementos Visuales
   - Firma Personalizada

6. **Sistema de Plugins**
   - Integración con el Núcleo
   - Comunicación entre Plugins y Core
   - Ejemplos de Plugins

## 1. Arquitectura Base y Sistema de Plugins

### Estructura Modular
- Arquitectura de aplicación dividida en core, servicios, componentes y plugins
- Sistema de directorios organizado por funcionalidad
- Componentes reutilizables en módulo common
- Soporte para entorno web y aplicación de escritorio (Electron)
- Implementación con React usando JSX para componentes

### Sistema de Bus de Eventos
- Bus de eventos centralizado para comunicación desacoplada entre módulos
- Patrón publicador/suscriptor implementado en clase `EventBus`
- Eventos categorizados por módulos (CALENDAR, VIDEO_SCHEDULER, TASK_TRACKER, APP)
- Sistema de cancelación de suscripciones con devolución de función limpiadora

### Registro de Módulos e Interoperabilidad
- Función `registerModule` para registrar componentes como módulos del sistema
- Sistema global `window.__appModules` que mantiene referencias a las APIs expuestas
- Conversión bidireccional entre tipos de datos de diferentes módulos
- Utilidades para verificar conflictos de horarios entre módulos

### Integración Electron para Aplicación de Escritorio
- Compilación web + aplicación nativa para escritorio
- Soporte para manejo de ventanas y archivos nativos
- Controles de ventana personalizados (minimizar, maximizar, cerrar)
- Sistema de comunicación IPC entre procesos principal y renderer

## 2. Aplicación Principal - Atlas

### Vistas y Navegación
- Vistas de semana y día con navegación intuitiva
- Botones para semana anterior/siguiente/actual
- Encabezados de día configurables con tres estilos diferentes (predeterminado, minimalista, dashboard)
- Opciones para mostrar/ocultar fines de semana
- Rejilla temporal con franjas horarias personalizables

### Gestión de Eventos
- Creación de eventos con clic en celdas de tiempo
- Edición rápida de título mediante clic
- Panel completo de detalles para edición avanzada
- Asignación de colores desde paleta predefinida
- Visualización de hora de inicio/fin en eventos

### Interacciones Avanzadas
- Arrastrar y soltar eventos entre horas y días
- Redimensionamiento de eventos para modificar duración
- Sistema de imán (snap) para alineación automática configurable
- Detección y resolución de solapamientos
- Cálculo automático de posiciones para eventos multicelda

### Sistema de Escalas de Tiempo
- Configuración de densidad visual (píxeles por minuto)
- Escala de tiempo global y por semana independientes
- Interfaz para gestionar escala con previsualización
- Cálculo automático de tamaños y posiciones según escala
- Restauración de escala a valores predeterminados

### Personalización de Horarios
- Franjas horarias estándar (hora en hora) y personalizadas
- Creación de tiempos intermedios con botón + entre franjas
- Edición y eliminación de franjas personalizadas
- Diferenciación visual por tipo y duración de franja
- Validación inteligente de tiempos según escala actual

## 3. Sistema de Administración y Monitoreo

### Panel de Administración
- Panel desplegable para administración y depuración
- Acceso a logs del sistema y métricas de rendimiento
- Interfaz para análisis de errores y diagnóstico
- Activación condicionada por configuración

### Visor de Logs
- Visor integrado de logs de la aplicación
- Filtrado por nivel (debug, info, warning, error)
- Filtrado por tipo de evento (UI, datos, validación, etc.)
- Exportación de logs para análisis
- Auto-refresco configurable

### Gestión de Errores
- Componente ErrorBoundary para captura de errores no manejados
- Registro automático de errores con detalles
- UI de recuperación tras error fatal
- Opciones para recargar la aplicación

### Utilidades UI Modernas
- Sistema de diálogos moderno reemplazando alert/confirm/prompt
- Hook personalizado useUIUtils para interfaces consistentes
- Detección y registro de uso de métodos obsoletos
- Notificaciones tipo toast para feedback no intrusivo

## 4. Gestión de Datos y Almacenamiento

### Sistema de Almacenamiento Abstracto
- Capa de abstracción sobre métodos de almacenamiento (storageService)
- Soporte para Electron Store en app nativa
- Fallback a localStorage para versión web
- Operaciones CRUD asíncronas con manejo de errores

### Exportación e Importación
- Exportación selectiva por módulos y rango de fechas
- Importación de datos con validación y resolución de conflictos
- Opciones para sobrescribir o combinar datos existentes
- Informe de datos disponibles para exportación
- Integración con sistema de archivos nativo en Electron

### Copias de Seguridad
- Respaldos automáticos diarios configurables
- Respaldos manuales bajo demanda
- Nomenclatura basada en fechas
- Recuperación desde respaldos
- Sistema de registro de última copia realizada

## 5. Sistema de Temas y Personalización Visual

### Temas Predefinidos y Personalización
- Tres temas incorporados (Claro, Oscuro, Púrpura Nocturno)
- Sistema de variables CSS para personalización completa
- Carga dinámica de temas sin recargar la aplicación
- Almacenamiento de preferencias de tema
- Soporte para temas personalizados en versión de escritorio

### Configuración de Elementos Visuales
- Panel centralizado para todas las configuraciones visuales
- Estilos de encabezado de días configurables
- Opciones para visualización de hora en eventos (posición, estilo)
- Animaciones configurables para elementos interactivos
- Ajuste de rangos horarios visibles (hora inicio/fin)

### Firma Personalizada
- Texto personalizable en parte superior de la aplicación
- Opción para mostrar/ocultar la firma
- Vista previa de cambios en tiempo real
- Efecto visual estilizado con fuente especial

## 6. Sistema de Plugins

### Integración con el Núcleo
- Arquitectura de aplicación diseñada para extensibilidad
- Sistema de registro de plugins como módulos
- Puntos de extensión en componentes principales
- Acceso a contextos React compartidos para datos globales

### Comunicación entre Plugins y Core
- Bus de eventos como canal principal de comunicación
- Eventos específicos por namespace de plugin
- Métodos para comprobar conflictos entre módulos
- Conversión automática de datos entre formatos de diferentes módulos

## Ejemplos de Plugins

### 1. Plugin de Programador de Videos (plugins/video-scheduler)

**Descripción:** Plugin para planificar la creación, producción y publicación de videos en diferentes franjas horarias.

**Estructura de carpetas:**
```
plugins/video-scheduler/
  ├── index.js                 # Punto de entrada del plugin
  ├── components/              # Componentes React
  │   ├── VideoScheduler.jsx   # Componente principal
  │   ├── VideoSlot.jsx        # Slot individual de video
  │   ├── StatusSelector.jsx   # Selector de estado de producción
  │   └── EarningsTracker.jsx  # Seguimiento de ingresos
  ├── contexts/
  │   └── VideoContext.jsx     # Contexto del programador
  ├── utils/
  │   ├── videoUtils.js        # Utilidades específicas
  │   └── eventConverter.js    # Conversión entre eventos y videos
  ├── styles/
  │   └── videoScheduler.css   # Estilos específicos
  └── README.md                # Documentación
```

**Funcionalidades:**
- Programación de videos en tres slots diarios (mañana, tarde, noche)
- Estados de producción configurables (pendiente, desarrollo, producción, publicado)
- Seguimiento de ingresos por video con soporte multi-divisa
- Vista mensual para planificación
- Sincronización automática con eventos de calendario
- Estadísticas de producción e ingresos

**Integración:**
- Registro mediante `registerModule('video-scheduler', videoSchedulerAPI)`
- Conversión bidireccional entre eventos de calendario y slots de video
- Verificación de conflictos con otros eventos del calendario
- Almacenamiento independiente en `videoSchedulerData`

### 2. Plugin de Notas (plugins/notes-manager)

**Descripción:** Permite asociar notas a fechas específicas o eventos del calendario. Las notas pueden contener texto formateado, listas y contenido enriquecido.

**Estructura de carpetas:**
```
plugins/notes-manager/
  ├── index.js             # Punto de entrada del plugin
  ├── components/          # Componentes React del plugin
  │   ├── NotesList.jsx    # Lista de notas
  │   ├── NoteEditor.jsx   # Editor de notas
  │   └── NotesPanel.jsx   # Panel principal
  ├── contexts/
  │   └── NotesContext.jsx # Estado global de notas
  ├── utils/
  │   └── notesUtils.js    # Utilidades específicas
  ├── styles/
  │   └── notes.css        # Estilos específicos del plugin
  └── README.md            # Documentación del plugin
```

**Funcionalidades:**
- Notas vinculadas a fechas específicas o eventos del calendario
- Editor de texto enriquecido con formato básico
- Categorización por etiquetas y colores
- Búsqueda rápida de notas
- Creación de notas desde eventos de calendario
- Indicador visual en el calendario para días con notas

**Integración:**
- Registro del módulo mediante `registerModule('notes-manager', notesManagerAPI)`
- Suscripción a eventos de calendario como `CALENDAR.DATE_SELECTED` y `CALENDAR.EVENT_CREATED`
- Extensión de la UI añadiendo un icono de notas en la barra de herramientas
- Almacenamiento independiente en `notesData` usando `storageService`

### 3. Plugin de Tareas (plugins/task-tracker)

**Descripción:** Sistema de gestión de tareas integrado con el calendario. Permite crear tareas con fechas de vencimiento, prioridades y estados de progreso.

**Estructura de carpetas:**
```
plugins/task-tracker/
  ├── index.js                # Punto de entrada del plugin
  ├── components/             # Componentes React
  │   ├── TaskBoard.jsx       # Vista de tablero Kanban
  │   ├── TaskList.jsx        # Vista de lista de tareas
  │   ├── TaskItem.jsx        # Componente de tarea individual
  │   └── TaskForm.jsx        # Formulario para crear/editar tareas
  ├── contexts/
  │   └── TaskContext.jsx     # Contexto global de tareas
  ├── utils/
  │   ├── taskUtils.js        # Utilidades específicas
  │   └── taskToEvent.js      # Conversión entre tareas y eventos
  ├── styles/
  │   └── tasks.css           # Estilos específicos
  └── README.md               # Documentación
```

**Funcionalidades:**
- Creación de tareas con título, descripción, prioridad y fecha de vencimiento
- Estados configurables (pendiente, en progreso, completada)
- Vista de tablero Kanban y vista de lista
- Filtrado por estado, prioridad y fecha
- Conversión bidireccional entre tareas y eventos de calendario
- Recordatorios de tareas próximas a vencer

**Integración:**
- Registro mediante `registerModule('task-tracker', taskTrackerAPI)`
- Creación automática de eventos en calendario para tareas con fecha
- Publicación de eventos como `TASK_TRACKER.TASK_COMPLETED` para notificar cambios
- Almacenamiento independiente en `taskTrackerData`

### 4. Plugin de Estadísticas (plugins/calendar-analytics)

**Descripción:** Proporciona análisis y estadísticas de uso del calendario, generando informes visuales sobre cómo se distribuye el tiempo.

**Estructura de carpetas:**
```
plugins/calendar-analytics/
  ├── index.js                   # Punto de entrada
  ├── components/                # Componentes React
  │   ├── AnalyticsDashboard.jsx # Panel principal
  │   ├── TimeDistribution.jsx   # Gráfico de distribución
  │   ├── CategoryPieChart.jsx   # Gráfico circular por categorías
  │   └── ActivityTimeline.jsx   # Línea de tiempo de actividad
  ├── utils/
  │   ├── analyticsUtils.js      # Utilidades de análisis
  │   └── dataProcessing.js      # Procesamiento de datos
  ├── styles/
  │   └── analytics.css          # Estilos específicos
  └── README.md                  # Documentación
```

**Funcionalidades:**
- Análisis de distribución del tiempo por categorías/colores
- Estadísticas de horas productivas y descansos
- Informes diarios, semanales y mensuales
- Visualización de tendencias a lo largo del tiempo
- Exportación de informes en PDF o CSV
- Sugerencias de optimización basadas en patrones

**Integración:**
- Registro mediante `registerModule('calendar-analytics', analyticsAPI)`
- Acceso de solo lectura a datos del calendario para análisis
- Pestaña dedicada en la interfaz principal
- Almacenamiento propio para configuraciones de informes y preferencias

### 5. Plugin de Recordatorios (plugins/reminder-system)

**Descripción:** Sistema avanzado de recordatorios y notificaciones para eventos del calendario, con opciones de personalización y notificaciones en la aplicación y el sistema.

**Estructura de carpetas:**
```
plugins/reminder-system/
  ├── index.js                   # Punto de entrada
  ├── components/                # Componentes React
  │   ├── ReminderSettings.jsx   # Configuración de recordatorios
  │   ├── NotificationPanel.jsx  # Panel de notificaciones
  │   └── ReminderForm.jsx       # Formulario para crear recordatorios
  ├── services/
  │   ├── notificationService.js # Servicio de notificaciones
  │   └── schedulerService.js    # Programación de recordatorios
  ├── utils/
  │   └── reminderUtils.js       # Utilidades específicas
  ├── styles/
  │   └── reminders.css          # Estilos específicos
  └── README.md                  # Documentación
```

**Funcionalidades:**
- Recordatorios personalizables para eventos (5 min, 15 min, 1 hora, 1 día antes)
- Notificaciones nativas del sistema en aplicación de escritorio
- Notificaciones en la aplicación para versión web
- Sonidos personalizables para diferentes tipos de alertas
- Recordatorios recurrentes para eventos periódicos
- Snooze (posponer) para recordatorios

**Integración:**
- Registro mediante `registerModule('reminder-system', reminderAPI)`
- Extensión del panel de detalles de eventos con opciones de recordatorio
- Suscripción a eventos del calendario y reloj del sistema
- Almacenamiento propio para configuraciones de recordatorios

### 6. Plugin de Clima (plugins/weather-integration)

**Descripción:** Integra información meteorológica con el calendario, mostrando previsiones para los días de la vista actual y para eventos programados al aire libre.

**Estructura de carpetas:**
```
plugins/weather-integration/
  ├── index.js                  # Punto de entrada
  ├── components/               # Componentes React
  │   ├── WeatherWidget.jsx     # Widget para la UI principal
  │   ├── ForecastDay.jsx       # Previsión diaria
  │   └── EventWeather.jsx      # Componente para eventos
  ├── services/
  │   └── weatherAPI.js         # Servicio de conexión a API externa
  ├── utils/
  │   └── weatherUtils.js       # Utilidades específicas
  ├── styles/
  │   └── weather.css           # Estilos específicos
  └── README.md                 # Documentación
```

**Funcionalidades:**
- Visualización de clima actual en la interfaz del calendario
- Previsión meteorológica para los próximos días
- Indicadores meteorológicos en eventos marcados como "exterior"
- Alertas para condiciones adversas en días con eventos
- Ajuste de ubicación manual o automático por geolocalización
- Personalización de unidades (celsius/fahrenheit)

**Integración:**
- Registro mediante `registerModule('weather-integration', weatherAPI)`
- Extensión de encabezados de día con iconos de clima
- Extensión del formulario de eventos con opción "evento exterior"
- Almacenamiento propio para configuraciones y caché de datos meteorológicos

---

La aplicación está diseñada para que todos estos plugins sean completamente opcionales. Si se elimina cualquier carpeta de plugin, la aplicación principal continuará funcionando sin problemas. El sistema de detección de plugins verifica la existencia de las carpetas en el directorio plugins/ y solo carga aquellos que estén presentes.

Cada plugin se comunica con el núcleo a través del sistema de bus de eventos y el registro de módulos, manteniendo un acoplamiento débil que permite añadir o eliminar funcionalidades sin afectar al sistema principal.

---

# Estructura de Carpetas y Archivos

```
atlas/
├── package.json
├── README.md
├── vite.config.js               # Configuración de Vite para desarrollo
├── index.html                   # Archivo HTML principal
├── electron/                    # Configuración para la app de escritorio
│   ├── main.js                  # Proceso principal de Electron
│   ├── preload.js               # Script de precarga para Electron
│   └── windowManager.js         # Gestión de ventanas
│
├── public/                      # Archivos estáticos
│   ├── favicon.ico
│   └── assets/
│       ├── fonts/
│       └── images/
│
├── src/
│   ├── index.jsx                # Punto de entrada principal
│   ├── App.jsx                  # Componente raíz de la aplicación
│   │
│   ├── core/                    # Núcleo de la aplicación
│   │   ├── bus/                 # Sistema de bus de eventos
│   │   │   ├── EventBus.js      # Implementación del bus de eventos
│   │   │   └── events.js        # Definición de eventos del sistema
│   │   │
│   │   ├── module/              # Sistema de registro de módulos
│   │   │   ├── ModuleRegistry.js   # Registro de módulos
│   │   │   └── moduleUtils.js   # Utilidades para módulos
│   │   │
│   │   └── config/              # Configuración global
│   │       ├── appConfig.js     # Configuración de la app
│   │       └── constants.js     # Constantes globales
│   │
│   ├── services/                # Servicios de la aplicación
│   │   ├── storageService.js    # Abstracción de almacenamiento
│   │   ├── backupService.js     # Servicio de copias de seguridad
│   │   ├── importExportService.js # Servicio de importación/exportación
│   │   ├── logService.js        # Servicio de logging
│   │   └── themeService.js      # Servicio de gestión de temas
│   │
│   ├── components/              # Componentes de la aplicación
│   │   ├── calendar/            # Componentes del calendario
│   │   │   ├── CalendarMain.jsx # Componente principal del calendario
│   │   │   ├── CalendarHeader.jsx # Encabezado del calendario
│   │   │   ├── DayView.jsx      # Vista de día
│   │   │   ├── WeekView.jsx     # Vista de semana
│   │   │   ├── EventItem.jsx    # Elemento de evento
│   │   │   ├── TimeGrid.jsx     # Rejilla temporal
│   │   │   ├── TimeSlot.jsx     # Franja horaria
│   │   │   └── EventForm.jsx    # Formulario de eventos
│   │   │
│   │   ├── admin/               # Componentes de administración
│   │   │   ├── AdminPanel.jsx   # Panel de administración
│   │   │   ├── LogViewer.jsx    # Visor de logs
│   │   │   └── ErrorDisplay.jsx # Visualizador de errores
│   │   │
│   │   ├── ui/                  # Componentes de UI reutilizables
│   │   │   ├── Button.jsx       # Botón personalizado
│   │   │   ├── Dialog.jsx       # Diálogo moderno
│   │   │   ├── Toast.jsx        # Notificaciones toast
│   │   │   ├── Dropdown.jsx     # Menú desplegable
│   │   │   ├── ErrorBoundary.jsx # Captura de errores React
│   │   │   └── ThemeSelector.jsx # Selector de temas
│   │   │
│   │   └── settings/            # Componentes de configuración
│   │       ├── SettingsPanel.jsx # Panel de configuración
│   │       ├── TimeScaleConfig.jsx # Configuración de escala de tiempo
│   │       ├── ThemeConfig.jsx  # Configuración de temas
│   │       └── CustomSignature.jsx # Configuración de firma
│   │
│   ├── contexts/                # Contextos de React
│   │   ├── CalendarContext.jsx  # Contexto del calendario
│   │   ├── ThemeContext.jsx     # Contexto de temas
│   │   └── SettingsContext.jsx  # Contexto de configuraciones
│   │
│   ├── hooks/                   # Hooks personalizados
│   │   ├── useCalendarEvents.jsx # Hook para eventos del calendario
│   │   ├── useTimeGrid.jsx      # Hook para rejilla temporal
│   │   ├── useEventDrag.jsx     # Hook para arrastrar eventos
│   │   ├── useEventResize.jsx   # Hook para redimensionar eventos
│   │   └── useUIUtils.jsx       # Hook para utilidades UI
│   │
│   ├── utils/                   # Utilidades
│   │   ├── dateUtils.js         # Utilidades de fechas
│   │   ├── timeUtils.js         # Utilidades de tiempo
│   │   ├── eventUtils.js        # Utilidades para eventos
│   │   ├── storageUtils.js      # Utilidades de almacenamiento
│   │   └── validationUtils.js   # Utilidades de validación
│   │
│   ├── styles/                  # Estilos
│   │   ├── index.css            # Estilos globales
│   │   ├── App.css              # Estilos para App.jsx
│   │   ├── variables.css        # Variables CSS globales
│   │   ├── themes/              # Archivos de temas
│   │   │   ├── light.css        # Tema claro
│   │   │   ├── dark.css         # Tema oscuro
│   │   │   └── purpleNight.css  # Tema púrpura nocturno
│   │   │
│   │   ├── components/          # Estilos de componentes
│   │   │   ├── calendar.css     # Estilos del calendario
│   │   │   ├── events.css       # Estilos de eventos
│   │   │   └── admin.css        # Estilos de administración
│   │   │
│   │   └── calendar/            # Estilos específicos del calendario
│   │       └── CalendarMain.css # Estilos para CalendarMain.jsx
│   │
│   └── plugins/                 # Sistema de plugins
│       ├── pluginLoader.js      # Cargador de plugins
│       ├── pluginRegistry.js    # Registro de plugins
│       │
│       ├── video-scheduler/     # Plugin de programador de videos
│       │   ├── index.js         # Punto de entrada del plugin
│       │   ├── components/      # Componentes del plugin
│       │   │   ├── VideoScheduler.jsx
│       │   │   ├── VideoSlot.jsx
│       │   │   ├── StatusSelector.jsx
│       │   │   └── EarningsTracker.jsx
│       │   ├── contexts/
│       │   │   └── VideoContext.jsx
│       │   ├── utils/
│       │   │   ├── videoUtils.js
│       │   │   └── eventConverter.js
│       │   ├── styles/
│       │   │   └── videoScheduler.css
│       │   └── README.md
│       │
│       ├── notes-manager/       # Plugin de notas
│       │   ├── index.js
│       │   ├── components/
│       │   │   ├── NotesList.jsx
│       │   │   ├── NoteEditor.jsx
│       │   │   └── NotesPanel.jsx
│       │   ├── contexts/
│       │   │   └── NotesContext.jsx
│       │   ├── utils/
│       │   │   └── notesUtils.js
│       │   ├── styles/
│       │   │   └── notes.css
│       │   └── README.md
│       │
│       ├── task-tracker/        # Plugin de seguimiento de tareas
│       │   ├── index.js
│       │   ├── components/
│       │   │   ├── TaskBoard.jsx
│       │   │   ├── TaskList.jsx
│       │   │   ├── TaskItem.jsx
│       │   │   └── TaskForm.jsx
│       │   ├── contexts/
│       │   │   └── TaskContext.jsx
│       │   ├── utils/
│       │   │   ├── taskUtils.js
│       │   │   └── taskToEvent.js
│       │   ├── styles/
│       │   │   └── tasks.css
│       │   └── README.md
│       │
│       ├── calendar-analytics/  # Plugin de estadísticas
│       │   ├── index.js
│       │   ├── components/
│       │   │   ├── AnalyticsDashboard.jsx
│       │   │   ├── TimeDistribution.jsx
│       │   │   ├── CategoryPieChart.jsx
│       │   │   └── ActivityTimeline.jsx
│       │   ├── utils/
│       │   │   ├── analyticsUtils.js
│       │   │   └── dataProcessing.js
│       │   ├── styles/
│       │   │   └── analytics.css
│       │   └── README.md
│       │
│       ├── reminder-system/     # Plugin de recordatorios
│       │   ├── index.js
│       │   ├── components/
│       │   │   ├── ReminderSettings.jsx
│       │   │   ├── NotificationPanel.jsx
│       │   │   └── ReminderForm.jsx
│       │   ├── services/
│       │   │   ├── notificationService.js
│       │   │   └── schedulerService.js
│       │   ├── utils/
│       │   │   └── reminderUtils.js
│       │   ├── styles/
│       │   │   └── reminders.css
│       │   └── README.md
│       │
│       └── weather-integration/ # Plugin de integración con el clima
│           ├── index.js
│           ├── components/
│           │   ├── WeatherWidget.jsx
│           │   ├── ForecastDay.jsx
│           │   └── EventWeather.jsx
│           ├── services/
│           │   └── weatherAPI.js
│           ├── utils/
│           │   └── weatherUtils.js
│           ├── styles/
│           │   └── weather.css
│           └── README.md
│
├── test/                        # Tests de la aplicación
│   ├── unit/                    # Tests unitarios
│   │   ├── core/                # Tests del núcleo
│   │   ├── services/            # Tests de servicios
│   │   └── components/          # Tests de componentes
│   │
│   └── integration/             # Tests de integración
│       ├── calendar/            # Tests del calendario
│       └── plugins/             # Tests de plugins
│
└── docs/                        # Documentación del proyecto
    ├── dev/                     # Documentación para desarrolladores
    │   ├── atlas-overview.md    # Visión general de Atlas
    │   ├── atlas-stages.md      # Documento principal de etapas (redirige a index)
    │   ├── comandos.md          # Comandos útiles
    │   └── stages/              # Documentación detallada por etapas
    │       ├── atlas-stages-index.md    # Índice de las etapas de desarrollo
    │       ├── stage-1.md       # Documentación de la Etapa 1
    │       ├── stage-2.md       # Documentación de la Etapa 2
    │       ├── stage-3.md       # Documentación de la Etapa 3
    │       ├── stage-4.md       # Documentación de la Etapa 4
    │       ├── stage-5.md       # Documentación de la Etapa 5
    │       └── stage-6.md       # Documentación de la Etapa 6
    │
    └── brand-assets/            # Recursos de marca
        ├── logos/               # Logos de la aplicación
        │   └── atlas-logo.svg   # Logo SVG principal
        │
        └── documentation/       # Documentación de marca
            └── atlas-brand-guide.md # Guía de identidad de marca
```