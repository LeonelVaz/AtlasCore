# Stage 2 - Mejoras de Interacción y Persistencia (Versión 0.2.0)

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

## Estructura de archivos al finalizar la Stage 2

```
atlas-core/
├── package.json
├── vite.config.js
├── index.html
├── electron/                     # Configuración para la app de escritorio
│   ├── main.js                   # Proceso principal de Electron
│   ├── preload.js                # Script de precarga para Electron
│   └── window-manager.js         # Gestión básica de ventanas
│
├── public/
│   └── favicon.ico
│
├── src/
│   ├── index.jsx                 # Punto de entrada principal
│   ├── app.jsx                   # Componente raíz con header y controles
│   │
│   ├── core/                     # Núcleo de la aplicación
│   │   ├── bus/                  # Sistema de bus de eventos mejorado
│   │   │   ├── event-bus.js      # Implementación del bus de eventos
│   │   │   └── events.js         # Definición de eventos del sistema
│   │   │
│   │   ├── module/               # Sistema de registro de módulos completo
│   │   │   ├── module-registry.js # Registro de módulos avanzado
│   │   │   └── module-utils.js   # Utilidades para módulos
│   │   │
│   │   └── config/               # Configuración básica
│   │       └── constants.js      # Constantes globales
│   │
│   ├── services/                 # Servicios de la aplicación
│   │   └── storage-service.js    # Abstracción de almacenamiento
│   │
│   ├── components/               # Componentes de la aplicación
│   │   ├── calendar/             # Componentes del calendario
│   │   │   ├── calendar-main.jsx # Componente principal mejorado
│   │   │   ├── day-view.jsx      # Vista de día
│   │   │   ├── week-view.jsx     # Vista de semana mejorada
│   │   │   ├── event-item.jsx    # Elemento de evento con interacciones
│   │   │   ├── time-grid.jsx     # Rejilla temporal mejorada
│   │   │   ├── snap-control.jsx  # Control de imán
│   │   │   └── event-form.jsx    # Formulario mejorado de eventos
│   │   │
│   │   └── ui/                   # Componentes de UI básicos
│   │       ├── button.jsx        # Botón personalizado
│   │       └── dialog.jsx        # Diálogo básico
│   │
│   ├── hooks/                    # Hooks personalizados
│   │   ├── use-calendar-events.jsx # Hook para eventos del calendario
│   │   ├── use-time-grid.jsx     # Hook para rejilla temporal
│   │   ├── use-event-drag.jsx    # Hook para arrastrar eventos
│   │   ├── use-event-form.jsx    # Hook para formulario de eventos
│   │   ├── use-calendar-navigation.jsx # Hook para navegación en el calendario
│   │   └── use-event-resize.jsx  # Hook para redimensionar eventos
│   │
│   ├── utils/                    # Utilidades
│   │   ├── date-utils.js         # Utilidades de fechas
│   │   ├── time-utils.js         # Utilidades de tiempo
│   │   ├── debug-utils.js        # Utilidades de depuración
│   │   └── event-utils.js        # Utilidades para eventos
│   │
│   └── styles/                   # Estilos
│       ├── index.css             # Estilos globales e importaciones
│       ├── app.css               # Estilos para app.jsx
│       │
│       ├── ui/                   # Estilos de componentes UI
│       │   ├── index.css         # Importa estilos UI
│       │   ├── button.css        # Estilos para botones
│       │   └── dialog.css        # Estilos para diálogos
│       │
│       └── calendar/             # Estilos de componentes del calendario
│           ├── index.css         # Importa estilos del calendario
│           ├── calendar-main.css # Estilos para el componente principal
│           ├── time-grid.css     # Estilos para la rejilla temporal
│           ├── event-item.css    # Estilos para eventos
│           ├── day-view.css      # Estilos para vista diaria
│           ├── week-view.css     # Estilos para vista semanal
│           └── snap-control.css  # Estilos para control de snap (imán)
│
└── docs/                         # Documentación del proyecto
    ├── dev/                      # Documentación para desarrolladores
    │   ├── atlas-overview.md     # Visión general de Atlas
    │   ├── atlas-stages.md       # Stages de desarrollo
    │   ├── commands.md           # Comandos útiles
    │   └── stages/               # Documentación detallada por Stages
    │       ├── stage-1.md        # Documentación de la Stage 1
    │       └── stage-2.md        # Documentación de la Stage 2
    │
    └── brand-assets/             # Recursos de marca
        ├── logos/                # Logos de la aplicación
        │   └── atlas-logo.svg    # Logo SVG principal
        │
        └── documentation/        # Documentación de marca
            └── atlas-brand-guide.md # Guía de identidad de marca
```