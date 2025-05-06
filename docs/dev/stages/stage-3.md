# Stage 3 - Personalización y Primeros Plugins (Versión 0.3.0)

**Enfoque**: Implementar el sistema de temas y los primeros plugins básicos

**Componentes a desarrollar:**
1. **Sistema de temas**
   - Implementación de los tres temas base (Claro, Oscuro, Púrpura Nocturno)
   - Sistema de variables CSS para personalización
   - Panel de configuración de apariencia básico

2. **Sistema de escalas de tiempo**
   - Configuración de densidad visual (píxeles por minuto)
   - Interfaz para gestionar escala con previsualización
   - Cálculo automático de tamaños y posiciones según escala

3. **Personalización de horarios**
   - Implementación de franjas horarias personalizadas
   - Editor de franjas temporales
   - Visualización diferenciada por tipo de franja

4. **Primer plugin: Notas**
   - Estructura de plugins básica
   - Implementación del plugin de notas vinculadas a fechas/eventos
   - Integración completa con el calendario principal

**Criterios de finalización:**
- Sistema de temas completamente funcional
- Personalización de escalas temporales y franjas horarias
- Primer plugin (Notas) funcional e integrado
- Panel de configuración para gestionar las nuevas opciones

## Estructura de archivos al finalizar la Stage 3

```
atlas-core/
├── package.json
├── vite.config.js
├── index.html
├── electron/                     # Configuración para la app de escritorio
│   ├── main.js                   # Proceso principal de Electron mejorado
│   ├── preload.js                # Script de precarga para Electron
│   └── window-manager.js         # Gestión de ventanas
│
├── public/
│   ├── favicon.ico
│   └── assets/
│       └── fonts/                # Fuentes para los temas
│
├── src/
│   ├── index.jsx                 # Punto de entrada principal
│   ├── app.jsx                   # Componente raíz con ThemeProvider
│   │
│   ├── core/                     # Núcleo de la aplicación
│   │   ├── bus/                  # Sistema de bus de eventos
│   │   │   ├── event-bus.js      # Implementación mejorada
│   │   │   └── events.js         # Más eventos definidos
│   │   │
│   │   ├── module/               # Sistema de registro de módulos
│   │   │   ├── module-registry.js # Registro de módulos
│   │   │   └── module-utils.js   # Utilidades para módulos
│   │   │
│   │   └── config/               # Configuración global
│   │       ├── app-config.js     # Configuración de la app
│   │       └── constants.js      # Constantes globales
│   │
│   ├── services/                 # Servicios de la aplicación
│   │   ├── storage-service.js    # Abstracción de almacenamiento
│   │   └── theme-service.js      # Servicio de gestión de temas
│   │
│   ├── components/               # Componentes de la aplicación
│   │   ├── calendar/             # Componentes del calendario
│   │   │   ├── calendar-main.jsx # Componente principal mejorado
│   │   │   ├── day-view.jsx      # Vista de día
│   │   │   ├── week-view.jsx     # Vista de semana mejorada
│   │   │   ├── event-item.jsx    # Elemento de evento con interacciones
│   │   │   ├── time-grid.jsx     # Rejilla temporal con escalas
│   │   │   ├── time-slot.jsx     # Franja horaria personalizable
│   │   │   └── event-form.jsx    # Formulario de eventos mejorado
│   │   │
│   │   ├── ui/                   # Componentes de UI reutilizables
│   │   │   ├── button.jsx        # Botón personalizado
│   │   │   ├── dialog.jsx        # Diálogo moderno
│   │   │   ├── dropdown.jsx      # Menú desplegable
│   │   │   └── theme-selector.jsx # Selector de temas
│   │   │
│   │   └── settings/             # Componentes de configuración
│   │       ├── settings-panel.jsx # Panel de configuración
│   │       ├── time-scale-config.jsx # Configuración de escala de tiempo
│   │       └── theme-config.jsx  # Configuración de temas
│   │
│   ├── contexts/                 # Contextos de React
│   │   ├── calendar-context.jsx  # Contexto del calendario
│   │   ├── theme-context.jsx     # Contexto de temas
│   │   └── settings-context.jsx  # Contexto de configuraciones
│   │
│   ├── hooks/                    # Hooks personalizados
│   │   ├── use-calendar-events.jsx # Hook para eventos del calendario
│   │   ├── use-time-grid.jsx     # Hook para rejilla temporal
│   │   ├── use-event-drag.jsx    # Hook para arrastrar eventos
│   │   ├── use-event-resize.jsx  # Hook para redimensionar eventos
│   │   └── use-theme.jsx         # Hook para gestión de temas
│   │
│   ├── utils/                    # Utilidades
│   │   ├── date-utils.js         # Utilidades de fechas
│   │   ├── time-utils.js         # Utilidades de tiempo
│   │   ├── event-utils.js        # Utilidades para eventos
│   │   ├── theme-utils.js        # Utilidades para temas
│   │   └── storage-utils.js      # Utilidades de almacenamiento
│   │
│   ├── styles/                   # Estilos
│   │   ├── index.css             # Estilos globales
│   │   ├── app.css               # Estilos para app.jsx
│   │   ├── variables.css         # Variables CSS globales
│   │   ├── themes/               # Archivos de temas
│   │   │   ├── light.css         # Tema claro
│   │   │   ├── dark.css          # Tema oscuro
│   │   │   └── purple-night.css  # Tema púrpura nocturno
│   │   │
│   │   ├── components/           # Estilos de componentes
│   │   │   ├── calendar.css      # Estilos del calendario
│   │   │   ├── events.css        # Estilos de eventos
│   │   │   └── settings.css      # Estilos de configuración
│   │   │
│   │   └── calendar/             # Estilos específicos del calendario
│   │       └── calendar-main.css # Estilos para calendar-main.jsx
│   │
│   └── plugins/                  # Sistema de plugins inicial
│       ├── plugin-loader.js      # Cargador básico de plugins
│       ├── plugin-registry.js    # Registro de plugins
│       │
│       └── notes-manager/        # Plugin de notas
│           ├── index.js          # Punto de entrada del plugin
│           ├── components/       # Componentes del plugin
│           │   ├── notes-list.jsx # Lista de notas
│           │   ├── note-editor.jsx # Editor de notas
│           │   └── notes-panel.jsx # Panel principal
│           ├── contexts/
│           │   └── notes-context.jsx # Contexto de notas
│           ├── utils/
│           │   └── notes-utils.js # Utilidades específicas
│           ├── styles/
│           │   └── notes.css     # Estilos específicos del plugin
│           └── README.md         # Documentación del plugin
│
└── docs/                         # Documentación del proyecto
    ├── dev/                      # Documentación para desarrolladores
    │   ├── atlas-overview.md     # Visión general de Atlas
    │   ├── atlas-stages.md       # Stages de desarrollo
    │   ├── comandos.md           # Comandos útiles
    │   ├── plugins/              # Documentación detallada de plugins
    │   │   └── notes-manager.md  # Documentación del plugin de notas
    │   └── stages/               # Documentación detallada por Stages
    │       ├── stage-1.md        # Documentación de la Stage 1
    │       ├── stage-2.md        # Documentación de la Stage 2
    │       └── stage-3.md        # Documentación de la Stage 3
    │
    └── brand-assets/             # Recursos de marca
        ├── logos/                # Logos de la aplicación
        │   └── atlas-logo.svg    # Logo SVG principal
        │
        └── documentation/        # Documentación de marca
            └── atlas-brand-guide.md # Guía de identidad de marca
```
