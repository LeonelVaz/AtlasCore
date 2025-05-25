# Stage 3 - Personalización y Primeros Plugins (Versión 0.3.0)

**Enfoque**: Implementar el sistema de temas y los primeros plugins básicos

**Componentes a desarrollar:**
1. **Sistema de temas**
   - Implementación de temas base (Claro, Oscuro)
   - Sistema de variables CSS para personalización
   - Panel de configuración de apariencia básico
   - Implementación de temas adicionales (Púrpura Nocturno, Atlas Dark Blue, Deep Ocean)
   - Aplicación dinámica de temas sin recarga de página
   - Persistencia de preferencias de tema

2. **Sistema de escalas de tiempo**
   - Configuración de densidad visual (píxeles por minuto)
   - Interfaz para gestionar escala con previsualización
   - Cálculo automático de tamaños y posiciones según escala
   - Escalas predefinidas (Compacta, Estándar, Cómoda, Espaciosa)
   - Creación de escalas personalizadas con altura configurable
   - Persistencia de preferencias de escala

3. **Personalización de horarios**
   - Implementación de franjas horarias personalizadas
   - Editor de franjas temporales
   - Visualización diferenciada por tipo de franja
   - Creación de tiempos intermedios con botón + entre franjas
   - Diferenciación visual por tipo y duración de franja
   - Validación inteligente de tiempos según escala actual

4. **Sistema de plugins**
   - Estructura de plugins básica
   - Sistema de carga dinámica de plugins
   - Registro de plugins y gestión de dependencias
   - API para extensiones de interfaz de usuario
   - Sistema de eventos para comunicación entre plugins
   - Gestión de permisos y seguridad de plugins

5. **Primer plugin: Notas**
   - Implementación del plugin de notas vinculadas a fechas/eventos
   - Integración completa con el calendario principal
   - Editor de texto enriquecido para notas
   - Vinculación de notas con eventos específicos
   - Visualización de notas en la vista de eventos

6. **Segundo plugin: Contador de Eventos**
   - Implementación de contador visual de eventos por día
   - Actualización en tiempo real al crear, mover o eliminar eventos
   - Interfaz limpia integrada con el estilo de Atlas
   - Visualización de badges en los headers de días con eventos

7. **Panel de Desarrolladores**
   - Implementación de panel de configuración para desarrolladores
   - Sistema de depuración con Event Debugger
   - Monitoreo de eventos del sistema en tiempo real
   - Herramientas para pruebas y diagnóstico
   - Logs detallados en consola configurables
   - Visualización de estadísticas de eventos

8. **Sistema de Seguridad para Plugins**
   - Implementación de sandbox para ejecución aislada de plugins
   - Sistema de permisos granular para plugins
   - Detección y prevención de código malicioso
   - Monitoreo de recursos utilizados por plugins
   - Niveles de seguridad configurables (bajo, normal, alto)
   - Auditoría de actividades de plugins

**Criterios de finalización:**
- Sistema de temas completamente funcional
- Personalización de escalas temporales y franjas horarias
- Sistema de plugins funcional con API documentada
- Plugins de Notas y Contador de Eventos integrados y funcionales
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
│   │   ├── modules/               # Sistema de registro de módulos
│   │   │   ├── module-registry.js # Registro de módulos
│   │   │   └── calendar-module.js
│   │   │
│   │   └── config/               # Configuración global
│   │       ├── app-config.js     # Configuración de la app
│   │       └── constants.js      # Constantes globales
│   │
│   ├── services/                 # Servicios de la aplicación
│   │   ├── storage-service.js    # Abstracción de almacenamiento
│   │   ├── theme-service.js      # Servicio de gestión de temas
│   │   └── time-scale-service.js # Servicio de escalas de tiempo
│   │
│   ├── components/               # Componentes de la aplicación
│   │   ├── calendar/             # Componentes del calendario
│   │   │   ├── calendar-main.jsx # Componente principal mejorado
│   │   │   ├── day-view.jsx      # Vista de día
│   │   │   ├── week-view.jsx     # Vista de semana mejorada
│   │   │   ├── event-item.jsx    # Elemento de evento con interacciones
│   │   │   ├── time-grid.jsx     # Rejilla temporal con escalas
│   │   │   ├── time-slot.jsx     # Franja horaria personalizable
│   │   │   ├── snap-control.jsx  # Control de imán
│   │   │   └── event-form.jsx    # Formulario de eventos mejorado
│   │   │
│   │   ├── ui/                   # Componentes de UI reutilizables
│   │   │   ├── button.jsx        # Botón personalizado
│   │   │   ├── dialog.jsx        # Diálogo moderno
│   │   │   ├── dropdown.jsx      # Menú desplegable
│   │   │   └── theme-selector.jsx # Selector de temas
│   │   │
│   │   ├── settings/             # Componentes de configuración
│   │   │   ├── settings-panel.jsx # Panel de configuración
│   │   │   ├── time-scale-config.jsx # Configuración de escala de tiempo
│   │   │   ├── time-slot-editor.jsx # Editor de franjas horarias
│   │   │   └── theme-config.jsx  # Configuración de temas
│   │   │
│   │   └── plugin-extension/     # Sistema de extensiones para plugins
│   │       ├── extension-point.jsx # Punto de extensión genérico
│   │       ├── navigation-extensions.jsx # Extensiones de navegación
│   │       └── plugin-pages.jsx  # Páginas completas de plugins
│   │
│   ├── contexts/                 # Contextos de React
│   │   ├── calendar-context.jsx  # Contexto del calendario
│   │   ├── theme-context.jsx     # Contexto de temas
│   │   ├── time-scale-context.jsx # Contexto de escalas de tiempo
│   │   └── settings-context.jsx  # Contexto de configuraciones
│   │
│   ├── hooks/                    # Hooks personalizados
│   │   ├── use-calendar-events.jsx # Hook para eventos del calendario
│   │   ├── use-time-grid.jsx     # Hook para rejilla temporal
│   │   ├── use-event-drag.jsx    # Hook para arrastrar eventos
│   │   ├── use-event-form.jsx    # Hook para formulario de eventos
│   │   ├── use-calendar-navigation.jsx # Hook para navegación en el calendario
│   │   ├── use-event-resize.jsx  # Hook para redimensionar eventos
│   │   ├── use-time-scale.jsx    # Hook para gestión de escalas de tiempo
│   │   └── use-theme.jsx         # Hook para gestión de temas
│   │
│   ├── utils/                    # Utilidades
│   │   ├── date-utils.js         # Utilidades de fechas
│   │   ├── time-utils.js         # Utilidades de tiempo
│   │   ├── debug-utils.js        # Utilidades de depuración
│   │   ├── event-utils.js        # Utilidades para eventos
│   │   ├── theme-utils.js        # Utilidades para temas
│   │   └── storage-utils.js      # Utilidades de almacenamiento
│   │
│   └── styles/                   # Estilos
│       ├── index.css             # Estilos globales
│       ├── app.css               # Estilos para app.jsx
│       ├── variables.css         # Variables CSS globales
│       ├── themes/               # Archivos de temas
│       │   ├── light.css         # Tema claro
│       │   ├── dark.css          # Tema oscuro
│       │   ├── atlas-dark-blue.css # Tema Atlas azul oscuro
│       │   ├── deep-ocean.css    # Tema océano profundo
│       │   └── purple-night.css  # Tema púrpura nocturno
│       │
│       ├── components/           # Estilos de componentes
│       │   ├── calendar.css      # Estilos del calendario
│       │   ├── events.css        # Estilos de eventos
│       │   └── settings.css      # Estilos de configuración
│       │
│       └── calendar/             # Estilos específicos del calendario
│           ├── calendar-main.css # Estilos para calendar-main.jsx
│           └── time-slots.css    # Estilos para franjas horarias
│    
│
├── docs/                         # Documentación del proyecto
│   ├── dev/                      # Documentación para desarrolladores
│   │   ├── atlas-overview.md     # Visión general de Atlas
│   │   ├── atlas-stages.md       # Stages de desarrollo
│   │   ├── commands.md           # Comandos útiles
│   │   ├── plugins/              # Documentación detallada de plugins
│   │   │   ├── notes-manager.md  # Documentación del plugin de notas
│   │   │   └── event-counter.md  # Documentación del plugin de contador
│   │   └── stages/               # Documentación detallada por Stages
│   │       ├── stage-1.md        # Documentación de la Stage 1
│   │       ├── stage-2.md        # Documentación de la Stage 2
│   │       └── stage-3.md        # Documentación de la Stage 3
│   │
│   └── brand-assets/             # Recursos de marca
│       ├── logos/                # Logos de la aplicación
│       │   └── atlas-logo.svg    # Logo SVG principal
│       │
│        └── documentation/        # Documentación de marca
│           └── atlas-brand-guide.md # Guía de identidad de marca
│
└── plugins/                  # Sistema de plugins
    ├── plugin-loader.js      # Cargador de plugins
    ├── plugin-registry.js    # Registro de plugins
    ├── plugin-api-registry.js # Registro de APIs para plugins
    ├── plugin-events.js      # Sistema de eventos para plugins
    │
    ├── notes-manager/        # Plugin de notas
    │   ├── index.js          # Punto de entrada del plugin
    │   ├── components/       # Componentes del plugin
    │   │   ├── notes-list.jsx # Lista de notas
    │   │   ├── note-editor.jsx # Editor de notas
    │   │   ├── notes-panel.jsx # Panel principal
    │   │   ├── event-notes-extension.jsx # Vista de notas en eventos
    │   │   └── event-selector.jsx # Selector de eventos
    │   ├── contexts/
    │   │   └── notes-context.jsx # Contexto de notas
    │   ├── utils/
    │   │   └── notes-utils.js # Utilidades específicas
    │   ├── styles/
    │   │   └── notes.css     # Estilos específicos del plugin
    │   └── README.md         # Documentación del plugin
    │
    └── event-counter/        # Plugin de contador de eventos
        ├── index.js          # Punto de entrada del plugin
        └── README.md         # Documentación del plugin