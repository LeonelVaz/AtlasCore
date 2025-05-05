# Etapa 2 - Mejoras de Interacción y Persistencia (Versión 0.2.0)

**Enfoque**: Mejorar la experiencia de usuario y robustez del sistema

**Componentes a desarrollar:**
1. **Interacciones avanzadas con eventos**
   - Arrastrar y soltar eventos entre horas y días
   - Redimensionamiento de eventos para modificar duración
   - Sistema de imán (snap) para alineación automática

2. **Sistema de almacenamiento mejorado**
   - Implementación de la capa de abstracción completa (storageService)
   - Integración con Electron Store para la versión de escritorio
   - Manejo mejorado de errores en operaciones de datos

3. **Vista diaria del calendario**
   - Implementación de la vista detallada de un solo día
   - Navegación entre vistas de día y semana
   - Mejoras de visualización para eventos en la vista diaria

4. **Registro de módulos funcional**
   - Sistema completo de registro de módulos
   - Estructura window.__appModules implementada
   - Utilidades básicas para interoperabilidad entre módulos

**Criterios de finalización:**
- Sistema completo de interacción con eventos del calendario
- Persistencia de datos robusta con manejo de errores
- Transición fluida entre vistas de día y semana
- Base para el sistema de plugins implementada

## Estructura de archivos al finalizar la Etapa 2

```
atlas-core/
├── package.json
├── vite.config.js
├── index.html
├── electron/                       # Configuración para la app de escritorio
│   ├── main.js                     # Proceso principal de Electron
│   ├── preload.js                  # Script de precarga para Electron
│   └── windowManager.js            # Gestión básica de ventanas
│
├── public/
│   └── favicon.ico
│
├── src/
│   ├── index.jsx                   # Punto de entrada principal
│   ├── App.jsx                     # Componente raíz con header y controles
│   │
│   ├── core/                       # Núcleo de la aplicación
│   │   ├── bus/                    # Sistema de bus de eventos mejorado
│   │   │   ├── EventBus.js         # Implementación del bus de eventos
│   │   │   └── events.js           # Definición de eventos del sistema
│   │   │
│   │   ├── module/                 # Sistema de registro de módulos completo
│   │   │   ├── ModuleRegistry.js   # Registro de módulos avanzado
│   │   │   └── moduleUtils.js      # Utilidades para módulos
│   │   │
│   │   └── config/                 # Configuración básica
│   │       └── constants.js        # Constantes globales
│   │
│   ├── services/                   # Servicios de la aplicación
│   │   └── storageService.js       # Abstracción de almacenamiento
│   │
│   ├── components/                 # Componentes de la aplicación
│   │   ├── calendar/               # Componentes del calendario
│   │   │   ├── CalendarMain.jsx    # Componente principal mejorado
│   │   │   ├── DayView.jsx         # Vista de día
│   │   │   ├── WeekView.jsx        # Vista de semana mejorada
│   │   │   ├── EventItem.jsx       # Elemento de evento con interacciones
│   │   │   ├── TimeGrid.jsx        # Rejilla temporal mejorada
│   │   │   └── EventForm.jsx       # Formulario mejorado de eventos
│   │   │
│   │   └── ui/                     # Componentes de UI básicos
│   │       ├── Button.jsx          # Botón personalizado
│   │       └── Dialog.jsx          # Diálogo básico
│   │
│   ├── hooks/                      # Hooks personalizados
│   │   ├── useCalendarEvents.jsx   # Hook para eventos del calendario
│   │   ├── useTimeGrid.jsx         # Hook para rejilla temporal
│   │   ├── useEventDrag.jsx        # Hook para arrastrar eventos
│   │   └── useEventResize.jsx      # Hook para redimensionar eventos
│   │
│   ├── utils/                      # Utilidades
│   │   ├── dateUtils.js            # Utilidades de fechas
│   │   ├── timeUtils.js            # Utilidades de tiempo
│   │   └── eventUtils.js           # Utilidades para eventos
│   │
│   └── styles/                     # Estilos
│       ├── index.css               # Estilos globales
│       ├── App.css                 # Estilos para App.jsx
│       ├── components/             # Estilos de componentes
│       │   ├── calendar.css        # Estilos del calendario
│       │   └── events.css          # Estilos de eventos
│       │
│       └── calendar/               # Estilos específicos del calendario
│           └── CalendarMain.css    # Estilos para CalendarMain.jsx
│
└── docs/                           # Documentación del proyecto
    ├── dev/                        # Documentación para desarrolladores
    │   ├── atlas-overview.md       # Visión general de Atlas
    │   ├── atlas-stages.md         # Etapas de desarrollo
    │   ├── comandos.md             # Comandos útiles
    │   └── stages/                 # Documentación detallada por etapas
    │       ├── stage-1.md          # Documentación de la Etapa 1
    │       └── stage-2.md          # Documentación de la Etapa 2
    │
    └── brand-assets/               # Recursos de marca
        ├── logos/                  # Logos de la aplicación
        │   └── atlas-logo.svg      # Logo SVG principal
        │
        └── documentation/          # Documentación de marca
            └── atlas-brand-guide.md  # Guía de identidad de marca
```
