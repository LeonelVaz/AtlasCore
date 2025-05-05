# Etapa 3 - Personalización y Primeros Plugins (Versión 0.3.0)

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

## Estructura de archivos al finalizar la Etapa 3

```
atlas-core/
├── package.json
├── vite.config.js
├── index.html
├── electron/                       # Configuración para la app de escritorio
│   ├── main.js                     # Proceso principal de Electron mejorado
│   ├── preload.js                  # Script de precarga para Electron
│   └── windowManager.js            # Gestión de ventanas
│
├── public/
│   ├── favicon.ico
│   └── assets/
│       └── fonts/                  # Fuentes para los temas
│
├── src/
│   ├── index.jsx                   # Punto de entrada principal
│   ├── App.jsx                     # Componente raíz con ThemeProvider
│   │
│   ├── core/                       # Núcleo de la aplicación
│   │   ├── bus/                    # Sistema de bus de eventos
│   │   │   ├── EventBus.js         # Implementación mejorada
│   │   │   └── events.js           # Más eventos definidos
│   │   │
│   │   ├── module/                 # Sistema de registro de módulos
│   │   │   ├── ModuleRegistry.js   # Registro de módulos
│   │   │   └── moduleUtils.js      # Utilidades para módulos
│   │   │
│   │   └── config/                 # Configuración global
│   │       ├── appConfig.js        # Configuración de la app
│   │       └── constants.js        # Constantes globales
│   │
│   ├── services/                   # Servicios de la aplicación
│   │   ├── storageService.js       # Abstracción de almacenamiento
│   │   └── themeService.js         # Servicio de gestión de temas
│   │
│   ├── components/                 # Componentes de la aplicación
│   │   ├── calendar/               # Componentes del calendario
│   │   │   ├── CalendarMain.jsx    # Componente principal mejorado
│   │   │   ├── DayView.jsx         # Vista de día
│   │   │   ├── WeekView.jsx        # Vista de semana mejorada
│   │   │   ├── EventItem.jsx       # Elemento de evento con interacciones
│   │   │   ├── TimeGrid.jsx        # Rejilla temporal con escalas
│   │   │   ├── TimeSlot.jsx        # Franja horaria personalizable
│   │   │   └── EventForm.jsx       # Formulario de eventos mejorado
│   │   │
│   │   ├── ui/                     # Componentes de UI reutilizables
│   │   │   ├── Button.jsx          # Botón personalizado
│   │   │   ├── Dialog.jsx          # Diálogo moderno
│   │   │   ├── Dropdown.jsx        # Menú desplegable
│   │   │   └── ThemeSelector.jsx   # Selector de temas
│   │   │
│   │   └── settings/               # Componentes de configuración
│   │       ├── SettingsPanel.jsx   # Panel de configuración
│   │       ├── TimeScaleConfig.jsx # Configuración de escala de tiempo
│   │       └── ThemeConfig.jsx     # Configuración de temas
│   │
│   ├── contexts/                   # Contextos de React
│   │   ├── CalendarContext.jsx     # Contexto del calendario
│   │   ├── ThemeContext.jsx        # Contexto de temas
│   │   └── SettingsContext.jsx     # Contexto de configuraciones
│   │
│   ├── hooks/                      # Hooks personalizados
│   │   ├── useCalendarEvents.jsx   # Hook para eventos del calendario
│   │   ├── useTimeGrid.jsx         # Hook para rejilla temporal
│   │   ├── useEventDrag.jsx        # Hook para arrastrar eventos
│   │   ├── useEventResize.jsx      # Hook para redimensionar eventos
│   │   └── useTheme.jsx            # Hook para gestión de temas
│   │
│   ├── utils/                      # Utilidades
│   │   ├── dateUtils.js            # Utilidades de fechas
│   │   ├── timeUtils.js            # Utilidades de tiempo
│   │   ├── eventUtils.js           # Utilidades para eventos
│   │   ├── themeUtils.js           # Utilidades para temas
│   │   └── storageUtils.js         # Utilidades de almacenamiento
│   │
│   ├── styles/                     # Estilos
│   │   ├── index.css               # Estilos globales
│   │   ├── App.css                 # Estilos para App.jsx
│   │   ├── variables.css           # Variables CSS globales
│   │   ├── themes/                 # Archivos de temas
│   │   │   ├── light.css           # Tema claro
│   │   │   ├── dark.css            # Tema oscuro
│   │   │   └── purpleNight.css     # Tema púrpura nocturno
│   │   │
│   │   ├── components/             # Estilos de componentes
│   │   │   ├── calendar.css        # Estilos del calendario
│   │   │   ├── events.css          # Estilos de eventos
│   │   │   └── settings.css        # Estilos de configuración
│   │   │
│   │   └── calendar/               # Estilos específicos del calendario
│   │       └── CalendarMain.css    # Estilos para CalendarMain.jsx
│   │
│   └── plugins/                    # Sistema de plugins inicial
│       ├── pluginLoader.js         # Cargador básico de plugins
│       ├── pluginRegistry.js       # Registro de plugins
│       │
│       └── notes-manager/          # Plugin de notas
│           ├── index.js            # Punto de entrada del plugin
│           ├── components/         # Componentes del plugin
│           │   ├── NotesList.jsx   # Lista de notas
│           │   ├── NoteEditor.jsx  # Editor de notas
│           │   └── NotesPanel.jsx  # Panel principal
│           ├── contexts/
│           │   └── NotesContext.jsx # Contexto de notas
│           ├── utils/
│           │   └── notesUtils.js   # Utilidades específicas
│           ├── styles/
│           │   └── notes.css       # Estilos específicos del plugin
│           └── README.md           # Documentación del plugin
│
└── docs/                           # Documentación del proyecto
    ├── dev/                        # Documentación para desarrolladores
    │   ├── atlas-overview.md       # Visión general de Atlas
    │   ├── atlas-stages.md         # Etapas de desarrollo
    │   ├── comandos.md             # Comandos útiles
    │   └── stages/                 # Documentación detallada por etapas
    │       ├── stage-1.md          # Documentación de la Etapa 1
    │       ├── stage-2.md          # Documentación de la Etapa 2
    │       └── stage-3.md          # Documentación de la Etapa 3
    │
    └── brand-assets/               # Recursos de marca
        ├── logos/                  # Logos de la aplicación
        │   └── atlas-logo.svg      # Logo SVG principal
        │
        └── documentation/          # Documentación de marca
            └── atlas-brand-guide.md  # Guía de identidad de marca
```
