# Etapa 4 - Robustez y Plugins Esenciales (Versión 0.4.0)

**Enfoque**: Ampliar las capacidades del sistema y mejorar la gestión de datos

**Componentes a desarrollar:**
1. **Sistema de administración y monitoreo**
   - Panel de administración desplegable
   - Visor integrado de logs de la aplicación
   - Componente ErrorBoundary para captura de errores

2. **Exportación e importación de datos**
   - Funcionalidad de exportación por módulos y rango de fechas
   - Importación con validación y resolución de conflictos
   - Integración con sistema de archivos nativo en Electron

3. **Plugin: Seguimiento de tareas**
   - Implementación del plugin de tareas
   - Integración bidireccional con eventos del calendario
   - Vistas de tablero Kanban y lista

4. **Plugin: Recordatorios**
   - Sistema de recordatorios para eventos
   - Notificaciones nativas (escritorio) y en aplicación (web)
   - Configuración personalizada de alertas

**Criterios de finalización:**
- Sistema completo de administración y diagnóstico
- Funcionalidades robustas de importación/exportación de datos
- Dos nuevos plugins (Tareas y Recordatorios) completamente funcionales
- Mayor estabilidad general del sistema

## Estructura de archivos al finalizar la Etapa 4

```
atlas-core/
├── package.json
├── vite.config.js
├── index.html
├── electron/                        # Configuración para la app de escritorio mejorada
│   ├── main.js                      # Proceso principal de Electron
│   ├── preload.js                   # Script de precarga mejorado
│   └── windowManager.js             # Gestión de ventanas completa
│
├── public/
│   ├── favicon.ico
│   └── assets/
│       ├── fonts/                   # Fuentes para los temas
│       └── images/                  # Imágenes para la UI
│
├── src/
│   ├── index.jsx                    # Punto de entrada principal
│   ├── App.jsx                      # Componente raíz con providers y error boundaries
│   │
│   ├── core/                        # Núcleo de la aplicación
│   │   ├── bus/                     # Sistema de bus de eventos
│   │   │   ├── EventBus.js          # Implementación mejorada
│   │   │   └── events.js            # Eventos completos del sistema
│   │   │
│   │   ├── module/                  # Sistema de registro de módulos
│   │   │   ├── ModuleRegistry.js    # Registro de módulos
│   │   │   └── moduleUtils.js       # Utilidades para módulos
│   │   │
│   │   └── config/                  # Configuración global
│   │       ├── appConfig.js         # Configuración de la app
│   │       └── constants.js         # Constantes globales
│   │
│   ├── services/                    # Servicios de la aplicación
│   │   ├── storageService.js        # Abstracción de almacenamiento mejorada
│   │   ├── importExportService.js   # Servicio de importación/exportación
│   │   ├── logService.js            # Servicio de logging
│   │   └── themeService.js          # Servicio de gestión de temas
│   │
│   ├── components/                  # Componentes de la aplicación
│   │   ├── calendar/                # Componentes del calendario
│   │   │   ├── CalendarMain.jsx     # Componente principal mejorado
│   │   │   ├── DayView.jsx          # Vista de día mejorada
│   │   │   ├── WeekView.jsx         # Vista de semana mejorada
│   │   │   ├── EventItem.jsx        # Elemento de evento con interacciones avanzadas
│   │   │   ├── TimeGrid.jsx         # Rejilla temporal con escalas
│   │   │   ├── TimeSlot.jsx         # Franja horaria personalizable
│   │   │   └── EventForm.jsx        # Formulario de eventos avanzado
│   │   │
│   │   ├── admin/                   # Componentes de administración
│   │   │   ├── AdminPanel.jsx       # Panel de administración
│   │   │   ├── LogViewer.jsx        # Visor de logs
│   │   │   └── ErrorDisplay.jsx     # Visualizador de errores
│   │   │
│   │   ├── ui/                      # Componentes de UI reutilizables
│   │   │   ├── Button.jsx           # Botón personalizado
│   │   │   ├── Dialog.jsx           # Diálogo moderno
│   │   │   ├── Toast.jsx            # Notificaciones toast
│   │   │   ├── Dropdown.jsx         # Menú desplegable
│   │   │   ├── ErrorBoundary.jsx    # Captura de errores React
│   │   │   └── ThemeSelector.jsx    # Selector de temas
│   │   │
│   │   └── settings/                # Componentes de configuración
│   │       ├── SettingsPanel.jsx    # Panel de configuración completo
│   │       ├── TimeScaleConfig.jsx  # Configuración de escala de tiempo
│   │       ├── ThemeConfig.jsx      # Configuración de temas
│   │       └── ExportImportPanel.jsx # Panel de exportación/importación
│   │
│   ├── contexts/                    # Contextos de React
│   │   ├── CalendarContext.jsx      # Contexto del calendario
│   │   ├── ThemeContext.jsx         # Contexto de temas
│   │   ├── SettingsContext.jsx      # Contexto de configuraciones
│   │   └── AdminContext.jsx         # Contexto de administración
│   │
│   ├── hooks/                       # Hooks personalizados
│   │   ├── useCalendarEvents.jsx    # Hook para eventos del calendario
│   │   ├── useTimeGrid.jsx          # Hook para rejilla temporal
│   │   ├── useEventDrag.jsx         # Hook para arrastrar eventos
│   │   ├── useEventResize.jsx       # Hook para redimensionar eventos
│   │   ├── useTheme.jsx             # Hook para gestión de temas
│   │   └── useUIUtils.jsx           # Hook para utilidades UI
│   │
│   ├── utils/                       # Utilidades
│   │   ├── dateUtils.js             # Utilidades de fechas
│   │   ├── timeUtils.js             # Utilidades de tiempo
│   │   ├── eventUtils.js            # Utilidades para eventos
│   │   ├── themeUtils.js            # Utilidades para temas
│   │   ├── storageUtils.js          # Utilidades de almacenamiento
│   │   └── validationUtils.js       # Utilidades de validación
│   │
│   ├── styles/                      # Estilos
│   │   ├── index.css                # Estilos globales
│   │   ├── App.css                  # Estilos para App.jsx
│   │   ├── variables.css            # Variables CSS globales
│   │   ├── themes/                  # Archivos de temas
│   │   │   ├── light.css            # Tema claro
│   │   │   ├── dark.css             # Tema oscuro
│   │   │   └── purpleNight.css      # Tema púrpura nocturno
│   │   │
│   │   ├── components/              # Estilos de componentes
│   │   │   ├── calendar.css         # Estilos del calendario
│   │   │   ├── events.css           # Estilos de eventos
│   │   │   ├── settings.css         # Estilos de configuración
│   │   │   └── admin.css            # Estilos de administración
│   │   │
│   │   └── calendar/                # Estilos específicos del calendario
│   │       └── CalendarMain.css     # Estilos para CalendarMain.jsx
│   │
│   └── plugins/                     # Sistema de plugins extendido
│       ├── pluginLoader.js          # Cargador de plugins mejorado
│       ├── pluginRegistry.js        # Registro de plugins avanzado
│       │
│       ├── notes-manager/           # Plugin de notas mejorado
│       │   ├── index.js             # Punto de entrada del plugin
│       │   ├── components/          # Componentes del plugin
│       │   │   ├── NotesList.jsx    # Lista de notas
│       │   │   ├── NoteEditor.jsx   # Editor de notas
│       │   │   └── NotesPanel.jsx   # Panel principal
│       │   ├── contexts/
│       │   │   └── NotesContext.jsx # Contexto de notas
│       │   ├── utils/
│       │   │   └── notesUtils.js    # Utilidades específicas
│       │   ├── styles/
│       │   │   └── notes.css        # Estilos específicos del plugin
│       │   └── README.md            # Documentación del plugin
│       │
│       ├── task-tracker/            # Plugin de seguimiento de tareas
│       │   ├── index.js             # Punto de entrada del plugin
│       │   ├── components/          # Componentes del plugin
│       │   │   ├── TaskBoard.jsx    # Vista de tablero Kanban
│       │   │   ├── TaskList.jsx     # Vista de lista de tareas
│       │   │   ├── TaskItem.jsx     # Componente de tarea individual
│       │   │   └── TaskForm.jsx     # Formulario para crear/editar tareas
│       │   ├── contexts/
│       │   │   └── TaskContext.jsx  # Contexto global de tareas
│       │   ├── utils/
│       │   │   ├── taskUtils.js     # Utilidades específicas
│       │   │   └── taskToEvent.js   # Conversión entre tareas y eventos
│       │   ├── styles/
│       │   │   └── tasks.css        # Estilos específicos
│       │   └── README.md            # Documentación
│       │
│       └── reminder-system/         # Plugin de recordatorios
│           ├── index.js             # Punto de entrada del plugin
│           ├── components/          # Componentes del plugin
│           │   ├── ReminderSettings.jsx # Configuración de recordatorios
│           │   ├── NotificationPanel.jsx # Panel de notificaciones
│           │   └── ReminderForm.jsx # Formulario para crear recordatorios
│           ├── services/
│           │   ├── notificationService.js # Servicio de notificaciones
│           │   └── schedulerService.js # Programación de recordatorios
│           ├── utils/
│           │   └── reminderUtils.js # Utilidades específicas
│           ├── styles/
│           │   └── reminders.css    # Estilos específicos
│           └── README.md            # Documentación
│
└── docs/                            # Documentación del proyecto
    ├── dev/                         # Documentación para desarrolladores
    │   ├── atlas-overview.md        # Visión general de Atlas
    │   ├── atlas-stages.md          # Etapas de desarrollo
    │   ├── comandos.md              # Comandos útiles
    │   └── stages/                  # Documentación detallada por etapas
    │       ├── stage-1.md           # Documentación de la Etapa 1
    │       ├── stage-2.md           # Documentación de la Etapa 2
    │       ├── stage-3.md           # Documentación de la Etapa 3
    │       └── stage-4.md           # Documentación de la Etapa 4
    │
    └── brand-assets/                # Recursos de marca
        ├── logos/                   # Logos de la aplicación
        │   └── atlas-logo.svg       # Logo SVG principal
        │
        └── documentation/           # Documentación de marca
            └── atlas-brand-guide.md # Guía de identidad de marca
```
