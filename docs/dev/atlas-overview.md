# Documentación Completa de Atlas

## Índice de Funcionalidades

1. **Arquitectura Base y Sistema de Plugins**
   - [Estructura Modular](#estructura-modular)
   - [Sistema de Bus de Eventos](#sistema-de-bus-de-eventos)
   - [Registro de Módulos e Interoperabilidad](#registro-de-módulos-e-interoperabilidad)
   - [Integración Electron para Aplicación de Escritorio](#integración-electron-para-aplicación-de-escritorio)

2. **Aplicación Principal - Atlas**
   - [Vistas y Navegación](#vistas-y-navegación)
   - [Gestión de Eventos](#gestión-de-eventos)
   - [Interacciones Avanzadas](#interacciones-avanzadas)
   - [Sistema de Escalas de Tiempo](#sistema-de-escalas-de-tiempo)
   - [Personalización de Franjas Horarias](#personalización-de-franjas-horarias)

3. **Sistema de Administración y Monitoreo**
   - [Panel de Administración](#panel-de-administración)
   - [Visor de Logs](#visor-de-logs)
   - [Gestión de Errores](#gestión-de-errores)
   - [Utilidades UI Modernas](#utilidades-ui-modernas)

4. **Gestión de Datos y Almacenamiento**
   - [Sistema de Almacenamiento Abstracto](#sistema-de-almacenamiento-abstracto)
   - [Exportación e Importación](#exportación-e-importación)
   - [Copias de Seguridad](#copias-de-seguridad)

5. **Sistema de Temas y Personalización Visual**
   - [Temas Predefinidos y Personalización](#temas-predefinidos-y-personalización)
   - [Configuración de Elementos Visuales](#configuración-de-elementos-visuales)
   - [Firma Personalizada](#firma-personalizada)

6. **Sistema de Plugins**
   - [Integración con el Núcleo](#integración-con-el-núcleo)
   - [Comunicación entre Plugins y Core](#comunicación-entre-plugins-y-core)
   - [Plugins Disponibles](#plugins-disponibles)

7. **Internacionalización**
   - [Soporte Multilingüe](#soporte-multilingüe)
   - [Estructura de Traducciones](#estructura-de-traducciones)

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

### Personalización de Franjas Horarias
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

### Plugins Disponibles
Atlas incluye un ecosistema de plugins que extienden su funcionalidad base. Para más detalles sobre cada plugin, consulte su documentación específica:

1. [Notes Manager](plugins/notes-manager.md) - Gestión de notas vinculadas a fechas y eventos
2. [Task Tracker](plugins/task-tracker.md) - Sistema de seguimiento de tareas con vista Kanban
3. [Reminder System](plugins/reminder-system.md) - Sistema avanzado de recordatorios
4. [Calendar Analytics](plugins/calendar-analytics.md) - Análisis y estadísticas del uso del calendario
5. [Video Scheduler](plugins/video-scheduler.md) - Planificación de producción de videos
6. [Weather Integration](plugins/weather-integration.md) - Integración de datos meteorológicos

Para una visión general de la interacción entre plugins, consulte la [documentación de interacción entre plugins](plugins/atlas-plugins-index.md).

## 7. Internacionalización

### Soporte Multilingüe
- Sistema completo de internacionalización para todas las interfaces
- Soporte inicial para español e inglés (desde v1.0.0)
- Detección automática del idioma preferido del sistema
- Selección manual de idioma en configuración

### Estructura de Traducciones
- Archivos de traducción organizados por módulos
- Sistema extensible para añadir nuevos idiomas
- Integración con plugins para mantener coherencia
- Herramientas de administración para gestionar traducciones

Para detalles completos sobre el sistema de internacionalización, consulte la [documentación de internacionalización](internationalization.md).

---

# Estructura de Carpetas y Archivos

```
atlas-core/
├── package.json
├── README.md
├── vite.config.js               # Configuración de Vite para desarrollo
├── index.html                   # Archivo HTML principal
├── electron/                    # Configuración para la app de escritorio
│   ├── main.js                  # Proceso principal de Electron
│   ├── preload.js               # Script de precarga para Electron
│   └── window-manager.js        # Gestión de ventanas
│
├── public/                      # Archivos estáticos
│   ├── favicon.ico
│   └── assets/
│       ├── fonts/
│       └── images/
│
├── src/
│   ├── index.jsx                # Punto de entrada principal
│   ├── app.jsx                  # Componente raíz de la aplicación
│   │
│   ├── core/                    # Núcleo de la aplicación
│   │   ├── bus/                 # Sistema de bus de eventos
│   │   │   ├── event-bus.js     # Implementación del bus de eventos
│   │   │   └── events.js        # Definición de eventos del sistema
│   │   │
│   │   ├── module/              # Sistema de registro de módulos
│   │   │   ├── module-registry.js  # Registro de módulos
│   │   │   └── module-utils.js  # Utilidades para módulos
│   │   │
│   │   └── config/              # Configuración global
│   │       ├── app-config.js    # Configuración de la app
│   │       └── constants.js     # Constantes globales
│   │
│   ├── services/                # Servicios de la aplicación
│   │   ├── storage-service.js   # Abstracción de almacenamiento
│   │   ├── backup-service.js    # Servicio de copias de seguridad
│   │   ├── import-export-service.js # Servicio de importación/exportación
│   │   ├── log-service.js       # Servicio de logging
│   │   ├── theme-service.js     # Servicio de gestión de temas
│   │   └── i18n-service.js      # Servicio de internacionalización
│   │
│   ├── components/              # Componentes de la aplicación
│   │   ├── calendar/            # Componentes del calendario
│   │   │   ├── calendar-main.jsx # Componente principal del calendario
│   │   │   ├── calendar-header.jsx # Encabezado del calendario
│   │   │   ├── day-view.jsx      # Vista de día
│   │   │   ├── week-view.jsx     # Vista de semana
│   │   │   ├── event-item.jsx    # Elemento de evento
│   │   │   ├── time-grid.jsx     # Rejilla temporal
│   │   │   ├── time-slot.jsx     # Franja horaria
│   │   │   └── event-form.jsx    # Formulario de eventos
│   │   │
│   │   ├── admin/               # Componentes de administración
│   │   │   ├── admin-panel.jsx   # Panel de administración
│   │   │   ├── log-viewer.jsx    # Visor de logs
│   │   │   └── error-display.jsx # Visualizador de errores
│   │   │
│   │   ├── ui/                  # Componentes de UI reutilizables
│   │   │   ├── button.jsx       # Botón personalizado
│   │   │   ├── dialog.jsx       # Diálogo moderno
│   │   │   ├── toast.jsx        # Notificaciones toast
│   │   │   ├── dropdown.jsx     # Menú desplegable
│   │   │   ├── error-boundary.jsx # Captura de errores React
│   │   │   └── theme-selector.jsx # Selector de temas
│   │   │
│   │   └── settings/            # Componentes de configuración
│   │       ├── settings-panel.jsx # Panel de configuración
│   │       ├── time-scale-config.jsx # Configuración de escala de tiempo
│   │       ├── theme-config.jsx  # Configuración de temas
│   │       └── custom-signature.jsx # Configuración de firma
│   │
│   ├── contexts/                # Contextos de React
│   │   ├── calendar-context.jsx  # Contexto del calendario
│   │   ├── theme-context.jsx     # Contexto de temas
│   │   └── settings-context.jsx  # Contexto de configuraciones
│   │
│   ├── hooks/                   # Hooks personalizados
│   │   ├── use-calendar-events.jsx # Hook para eventos del calendario
│   │   ├── use-time-grid.jsx      # Hook para rejilla temporal
│   │   ├── use-event-drag.jsx     # Hook para arrastrar eventos
│   │   ├── use-event-resize.jsx   # Hook para redimensionar eventos
│   │   └── use-ui-utils.jsx       # Hook para utilidades UI
│   │
│   ├── utils/                   # Utilidades
│   │   ├── date-utils.js        # Utilidades de fechas
│   │   ├── time-utils.js        # Utilidades de tiempo
│   │   ├── event-utils.js       # Utilidades para eventos
│   │   ├── storage-utils.js     # Utilidades de almacenamiento
│   │   └── validation-utils.js  # Utilidades de validación
│   │
│   ├── i18n/                    # Internacionalización
│   │   ├── index.js             # Configuración de i18n
│   │   ├── config.js            # Configuración global
│   │   └── locales/             # Archivos de traducción
│   │       ├── es/              # Español (idioma predeterminado)
│   │       └── en/              # Inglés
│   │
│   ├── styles/                  # Estilos
│   │   ├── index.css            # Estilos globales
│   │   ├── app.css              # Estilos para app.jsx
│   │   ├── variables.css        # Variables CSS globales
│   │   ├── themes/              # Archivos de temas
│   │   │   ├── light.css        # Tema claro
│   │   │   ├── dark.css         # Tema oscuro
│   │   │   └── purple-night.css # Tema púrpura nocturno
│   │   │
│   │   ├── components/          # Estilos de componentes
│   │   │   ├── calendar.css     # Estilos del calendario
│   │   │   ├── events.css       # Estilos de eventos
│   │   │   └── admin.css        # Estilos de administración
│   │   │
│   │   └── calendar/            # Estilos específicos del calendario
│   │       └── calendar-main.css # Estilos para calendar-main.jsx
│   │
│   └── plugins/                 # Sistema de plugins
│       ├── plugin-loader.js     # Cargador de plugins
│       ├── plugin-registry.js   # Registro de plugins
│       │
│       ├── video-scheduler/     # Plugin de programador de videos
│       │   ├── index.js         # Punto de entrada del plugin
│       │   ├── components/      # Componentes del plugin
│       │   ├── contexts/        # Contextos específicos del plugin
│       │   ├── utils/           # Utilidades específicas
│       │   ├── styles/          # Estilos específicos
│       │   ├── locales/         # Traducciones específicas
│       │   │   ├── es/
│       │   │   │   └── video.json
│       │   │   └── en/
│       │   │       └── video.json
│       │   └── README.md        # Documentación del plugin
│       │
│       ├── notes-manager/       # Plugin de notas
│       │   ├── index.js         # Punto de entrada del plugin
│       │   ├── components/      # Componentes del plugin
│       │   ├── contexts/        # Contextos específicos del plugin
│       │   ├── utils/           # Utilidades específicas
│       │   ├── styles/          # Estilos específicos
│       │   ├── locales/         # Traducciones específicas
│       │   │   ├── es/
│       │   │   │   └── notes.json
│       │   │   └── en/
│       │   │       └── notes.json
│       │   └── README.md        # Documentación del plugin
│       │
│       ├── task-tracker/        # Plugin de seguimiento de tareas
│       │   ├── index.js         # Punto de entrada del plugin
│       │   ├── components/      # Componentes del plugin
│       │   ├── contexts/        # Contextos específicos del plugin
│       │   ├── utils/           # Utilidades específicas
│       │   ├── styles/          # Estilos específicos
│       │   ├── locales/         # Traducciones específicas
│       │   │   ├── es/
│       │   │   │   └── tasks.json
│       │   │   └── en/
│       │   │       └── tasks.json
│       │   └── README.md        # Documentación del plugin
│       │
│       ├── calendar-analytics/  # Plugin de estadísticas
│       │   ├── index.js         # Punto de entrada del plugin
│       │   ├── components/      # Componentes del plugin
│       │   ├── utils/           # Utilidades específicas
│       │   ├── styles/          # Estilos específicos
│       │   ├── locales/         # Traducciones específicas
│       │   │   ├── es/
│       │   │   │   └── analytics.json
│       │   │   └── en/
│       │   │       └── analytics.json
│       │   └── README.md        # Documentación del plugin
│       │
│       ├── reminder-system/     # Plugin de recordatorios
│       │   ├── index.js         # Punto de entrada del plugin
│       │   ├── components/      # Componentes del plugin
│       │   ├── services/        # Servicios específicos
│       │   ├── utils/           # Utilidades específicas
│       │   ├── styles/          # Estilos específicos
│       │   ├── locales/         # Traducciones específicas
│       │   │   ├── es/
│       │   │   │   └── reminders.json
│       │   │   └── en/
│       │   │       └── reminders.json
│       │   └── README.md        # Documentación del plugin
│       │
│       └── weather-integration/ # Plugin de integración con el clima
│           ├── index.js         # Punto de entrada del plugin
│           ├── components/      # Componentes del plugin
│           ├── services/        # Servicios específicos
│           ├── utils/           # Utilidades específicas
│           ├── styles/          # Estilos específicos
│           ├── locales/         # Traducciones específicas
│           │   ├── es/
│           │   │   └── weather.json
│           │   └── en/
│           │       └── weather.json
│           └── README.md        # Documentación del plugin
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
    │   ├── atlas-stages.md      # Documento principal de stages
    │   ├── atlas-visual-design.md # Diseño visual
    │   ├── internationalization.md # Documentación de internacionalización
    │   ├── guide-versions.md    # Guía de versionado
    │   ├── comandos.md          # Comandos útiles
    │   ├── plugins/             # Documentación detallada de plugins
    │   │   ├── atlas-plugins-index.md # Índice de plugins e interacciones
    │   │   ├── notes-manager.md # Documentación del plugin de notas
    │   │   ├── task-tracker.md  # Documentación del plugin de tareas
    │   │   ├── reminder-system.md # Documentación del plugin de recordatorios
    │   │   ├── calendar-analytics.md # Documentación del plugin de estadísticas
    │   │   ├── video-scheduler.md # Documentación del plugin de videos
    │   │   └── weather-integration.md # Documentación del plugin de clima
    │   │
    │   └── stages/              # Documentación detallada por stages
    │       ├── atlas-stages-index.md    # Índice de los stages de desarrollo
    │       ├── stage-1.md       # Documentación del Stage 1
    │       ├── stage-2.md       # Documentación del Stage 2
    │       ├── stage-3.md       # Documentación del Stage 3
    │       ├── stage-4.md       # Documentación del Stage 4
    │       ├── stage-5.md       # Documentación del Stage 5
    │       └── stage-6.md       # Documentación del Stage 6
    │
    └── brand-assets/            # Recursos de marca
        ├── logos/               # Logos de la aplicación
        │   └── atlas-logo.svg   # Logo SVG principal
        │
        └── documentation/       # Documentación de marca
            ├── atlas-brand-guide.md # Guía de identidad de marca
            └── atlas-logo-guidelines.md # Directrices del logotipo
```

**Nota sobre las fechas**: Los ejemplos y referencias a fechas en esta documentación son ilustrativos.