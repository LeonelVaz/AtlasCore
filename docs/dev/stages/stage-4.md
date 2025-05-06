# Stage 4 - Robustez y Plugins Esenciales (Versión 0.4.0)

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

## Estructura de archivos al finalizar la Stage 4

```
atlas-core/
├── package.json
├── vite.config.js
├── index.html
├── electron/                        # Configuración para la app de escritorio mejorada
│   ├── main.js                      # Proceso principal de Electron
│   ├── preload.js                   # Script de precarga mejorado
│   └── window-manager.js            # Gestión de ventanas completa
│
├── public/
│   ├── favicon.ico
│   └── assets/
│       ├── fonts/                   # Fuentes para los temas
│       └── images/                  # Imágenes para la UI
│
├── src/
│   ├── index.jsx                    # Punto de entrada principal
│   ├── app.jsx                      # Componente raíz con providers y error boundaries
│   │
│   ├── core/                        # Núcleo de la aplicación
│   │   ├── bus/                     # Sistema de bus de eventos
│   │   │   ├── event-bus.js         # Implementación mejorada
│   │   │   └── events.js            # Eventos completos del sistema
│   │   │
│   │   ├── module/                  # Sistema de registro de módulos
│   │   │   ├── module-registry.js   # Registro de módulos
│   │   │   └── module-utils.js      # Utilidades para módulos
│   │   │
│   │   └── config/                  # Configuración global
│   │       ├── app-config.js        # Configuración de la app
│   │       └── constants.js         # Constantes globales
│   │
│   ├── services/                    # Servicios de la aplicación
│   │   ├── storage-service.js       # Abstracción de almacenamiento mejorada
│   │   ├── import-export-service.js # Servicio de importación/exportación
│   │   ├── log-service.js           # Servicio de logging
│   │   └── theme-service.js         # Servicio de gestión de temas
│   │
│   ├── components/                  # Componentes de la aplicación
│   │   ├── calendar/                # Componentes del calendario
│   │   │   ├── calendar-main.jsx    # Componente principal mejorado
│   │   │   ├── day-view.jsx         # Vista de día mejorada
│   │   │   ├── week-view.jsx        # Vista de semana mejorada
│   │   │   ├── event-item.jsx       # Elemento de evento con interacciones avanzadas
│   │   │   ├── time-grid.jsx        # Rejilla temporal con escalas
│   │   │   ├── time-slot.jsx        # Franja horaria personalizable
│   │   │   └── event-form.jsx       # Formulario de eventos avanzado
│   │   │
│   │   ├── admin/                   # Componentes de administración
│   │   │   ├── admin-panel.jsx      # Panel de administración
│   │   │   ├── log-viewer.jsx       # Visor de logs
│   │   │   └── error-display.jsx    # Visualizador de errores
│   │   │
│   │   ├── ui/                      # Componentes de UI reutilizables
│   │   │   ├── button.jsx           # Botón personalizado
│   │   │   ├── dialog.jsx           # Diálogo moderno
│   │   │   ├── toast.jsx            # Notificaciones toast
│   │   │   ├── dropdown.jsx         # Menú desplegable
│   │   │   ├── error-boundary.jsx   # Captura de errores React
│   │   │   └── theme-selector.jsx   # Selector de temas
│   │   │
│   │   └── settings/                # Componentes de configuración
│   │       ├── settings-panel.jsx   # Panel de configuración completo
│   │       ├── time-scale-config.jsx # Configuración de escala de tiempo
│   │       ├── theme-config.jsx     # Configuración de temas
│   │       └── export-import-panel.jsx # Panel de exportación/importación
│   │
│   ├── contexts/                    # Contextos de React
│   │   ├── calendar-context.jsx     # Contexto del calendario
│   │   ├── theme-context.jsx        # Contexto de temas
│   │   ├── settings-context.jsx     # Contexto de configuraciones
│   │   └── admin-context.jsx        # Contexto de administración
│   │
│   ├── hooks/                       # Hooks personalizados
│   │   ├── use-calendar-events.jsx  # Hook para eventos del calendario
│   │   ├── use-time-grid.jsx        # Hook para rejilla temporal
│   │   ├── use-event-drag.jsx       # Hook para arrastrar eventos
│   │   ├── use-event-resize.jsx     # Hook para redimensionar eventos
│   │   ├── use-theme.jsx            # Hook para gestión de temas
│   │   └── use-ui-utils.jsx         # Hook para utilidades UI
│   │
│   ├── utils/                       # Utilidades
│   │   ├── date-utils.js            # Utilidades de fechas
│   │   ├── time-utils.js            # Utilidades de tiempo
│   │   ├── event-utils.js           # Utilidades para eventos
│   │   ├── theme-utils.js           # Utilidades para temas
│   │   ├── storage-utils.js         # Utilidades de almacenamiento
│   │   └── validation-utils.js      # Utilidades de validación
│   │
│   ├── styles/                      # Estilos
│   │   ├── index.css                # Estilos globales
│   │   ├── app.css                  # Estilos para app.jsx
│   │   ├── variables.css            # Variables CSS globales
│   │   ├── themes/                  # Archivos de temas
│   │   │   ├── light.css            # Tema claro
│   │   │   ├── dark.css             # Tema oscuro
│   │   │   └── purple-night.css     # Tema púrpura nocturno
│   │   │
│   │   ├── components/              # Estilos de componentes
│   │   │   ├── calendar.css         # Estilos del calendario
│   │   │   ├── events.css           # Estilos de eventos
│   │   │   ├── settings.css         # Estilos de configuración
│   │   │   └── admin.css            # Estilos de administración
│   │   │
│   │   └── calendar/                # Estilos específicos del calendario
│   │       └── calendar-main.css    # Estilos para calendar-main.jsx
│   │
│   └── plugins/                     # Sistema de plugins extendido
│       ├── plugin-loader.js         # Cargador de plugins mejorado
│       ├── plugin-registry.js       # Registro de plugins avanzado
│       │
│       ├── notes-manager/           # Plugin de notas mejorado
│       │   ├── index.js             # Punto de entrada del plugin
│       │   ├── components/          # Componentes del plugin
│       │   │   ├── notes-list.jsx   # Lista de notas
│       │   │   ├── note-editor.jsx  # Editor de notas
│       │   │   └── notes-panel.jsx  # Panel principal
│       │   ├── contexts/
│       │   │   └── notes-context.jsx # Contexto de notas
│       │   ├── utils/
│       │   │   └── notes-utils.js   # Utilidades específicas
│       │   ├── styles/
│       │   │   └── notes.css        # Estilos específicos del plugin
│       │   └── README.md            # Documentación del plugin
│       │
│       ├── task-tracker/            # Plugin de seguimiento de tareas
│       │   ├── index.js             # Punto de entrada del plugin
│       │   ├── components/          # Componentes del plugin
│       │   │   ├── task-board.jsx   # Vista de tablero Kanban
│       │   │   ├── task-list.jsx    # Vista de lista de tareas
│       │   │   ├── task-item.jsx    # Componente de tarea individual
│       │   │   └── task-form.jsx    # Formulario para crear/editar tareas
│       │   ├── contexts/
│       │   │   └── task-context.jsx # Contexto global de tareas
│       │   ├── utils/
│       │   │   ├── task-utils.js    # Utilidades específicas
│       │   │   └── task-to-event.js # Conversión entre tareas y eventos
│       │   ├── styles/
│       │   │   └── tasks.css        # Estilos específicos
│       │   └── README.md            # Documentación
│       │
│       └── reminder-system/         # Plugin de recordatorios
│           ├── index.js             # Punto de entrada del plugin
│           ├── components/          # Componentes del plugin
│           │   ├── reminder-settings.jsx # Configuración de recordatorios
│           │   ├── notification-panel.jsx # Panel de notificaciones
│           │   └── reminder-form.jsx # Formulario para crear recordatorios
│           ├── services/
│           │   ├── notification-service.js # Servicio de notificaciones
│           │   └── scheduler-service.js # Programación de recordatorios
│           ├── utils/
│           │   └── reminder-utils.js # Utilidades específicas
│           ├── styles/
│           │   └── reminders.css    # Estilos específicos
│           └── README.md            # Documentación
│
└── docs/                            # Documentación del proyecto
    ├── dev/                         # Documentación para desarrolladores
    │   ├── atlas-overview.md        # Visión general de Atlas
    │   ├── atlas-stages.md          # Stages de desarrollo
    │   ├── comandos.md              # Comandos útiles
    │   └── stages/                  # Documentación detallada por Stages
    │       ├── stage-1.md           # Documentación de la Stage 1
    │       ├── stage-2.md           # Documentación de la Stage 2
    │       ├── stage-3.md           # Documentación de la Stage 3
    │       └── stage-4.md           # Documentación de la Stage 4
    │
    └── brand-assets/                # Recursos de marca
        ├── logos/                   # Logos de la aplicación
        │   └── atlas-logo.svg       # Logo SVG principal
        │
        └── documentation/           # Documentación de marca
            └── atlas-brand-guide.md # Guía de identidad de marca
```
