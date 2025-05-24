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

3. **Configuración básica de PWA (Progressive Web App)**
   - Creación y configuración inicial del archivo manifest.json con:
     - Información básica de la aplicación (nombre, descripción corta)
     - Configuración de iconos en diferentes tamaños
     - Definición de colores de tema y fondo
     - Configuración de orientación y modo de visualización
   - Implementación de un Service Worker mínimo para:
     - Caché básica de recursos estáticos (HTML, CSS, JS)
     - Funcionalidad offline básica para acceder a la última sesión
     - Estrategia de actualización cuando hay conectividad
   - Configuración de metadatos de instalación en index.html
   - Esta configuración sienta las bases para la implementación completa prevista en la versión 1.0.0

4. **Plugin: Task Tracker**
   - Implementación del plugin de tareas
   - Integración bidireccional con eventos del calendario
   - Vistas de tablero Kanban y lista

5. **Plugin: Reminder System**
   - Sistema de recordatorios para eventos
   - Notificaciones nativas (escritorio) y en aplicación (web)
   - Configuración personalizada de alertas

6. **Estructura básica de internacionalización**
   - Implementación de la estructura base del sistema de i18n
   - Preparación de componentes core para internacionalización
   - Configuración inicial y pruebas básicas

**Criterios de finalización:**
- Sistema completo de administración y diagnóstico
- Funcionalidades robustas de importación/exportación de datos
- Dos nuevos plugins (Task Tracker y Reminder System) completamente funcionales
- Estructura base para la internacionalización implementada
- Configuración básica para soporte futuro de PWA implementada
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
│   │   │   ├── snap-control.jsx  # Control de imán
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
│   │   ├── use-event-form.jsx    # Hook para formulario de eventos
│   │   ├── use-calendar-navigation.jsx # Hook para navegación en el calendario
│   │   ├── use-event-resize.jsx     # Hook para redimensionar eventos
│   │   ├── use-theme.jsx            # Hook para gestión de temas
│   │   └── use-ui-utils.jsx         # Hook para utilidades UI
│   │
│   ├── utils/                       # Utilidades
│   │   ├── date-utils.js            # Utilidades de fechas
│   │   ├── time-utils.js            # Utilidades de tiempo
│   │   ├── debug-utils.js        # Utilidades de depuración
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
    │   ├── commands.md              # Comandos útiles
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



Añadir a stage 4:

Durante el desarrollo y las pruebas de la aplicación Atlas Core, hemos identificado la necesidad de estandarizar el manejo de fechas y horas para mejorar la robustez, consistencia y evitar posibles bugs relacionados con las zonas horarias. Esta propuesta describe las directrices generales para lograrlo.

**Objetivos Principales:**

1.  **Consistencia de Datos:** Asegurar que todas las fechas y horas se almacenen y procesen internamente de una manera uniforme y predecible.
2.  **Precisión para el Usuario:** Garantizar que los usuarios siempre vean las fechas y horas correctamente adaptadas a su contexto local o a su zona horaria preferida.
3.  **Interoperabilidad:** Facilitar la integración con sistemas externos o APIs que puedan tener sus propios requisitos de formato de fecha/hora.
4.  **Mantenibilidad:** Reducir la complejidad y la probabilidad de errores futuros relacionados con el manejo de fechas.

**Estrategia General Propuesta:**

La estrategia recomendada es adoptar **UTC (Tiempo Universal Coordinado)** como el estándar para todas las operaciones internas y de almacenamiento, y realizar conversiones a la zona horaria del usuario únicamente en la capa de visualización.

**Acciones Clave a Realizar:**

1.  **Almacenamiento y Lógica Interna en UTC:**
    *   **Auditoría:** Revisar todas las partes de la aplicación donde se crean, almacenan, manipulan o transmiten fechas y horas.
    *   **Estándar de Almacenamiento:** Definir UTC como el estándar para guardar fechas en cualquier almacenamiento persistente (localStorage, IndexedDB, y especialmente si se interactúa con un backend).
    *   **Procesamiento Interno:** Realizar todos los cálculos, comparaciones y lógica de negocio que involucren fechas/horas utilizando representaciones UTC o timestamps UTC para evitar ambigüedades.
    *   **Creación de Fechas:** Al crear nuevas instancias de `Date`, ser explícitos sobre si representan un instante UTC o un instante local. Preferir la construcción de fechas UTC cuando la lógica no dependa inherentemente de la localidad del usuario (ej. `new Date(Date.UTC(...))`).

2.  **Manejo de Entradas del Usuario:**
    *   Cuando los usuarios ingresen fechas y/o horas (a través de selectores de fecha, inputs, etc.), estos valores generalmente estarán en su zona horaria local.
    *   **Conversión a UTC:** Antes de procesar internamente o guardar estas entradas, convertirlas a UTC.

3.  **Visualización para el Usuario (Conversión a Local):**
    *   **Capa de Presentación:** La conversión de fechas UTC a la zona horaria del usuario debe realizarse únicamente en la capa de presentación, justo antes de mostrar la información al usuario.
    *   **Detección de Zona Horaria:** Utilizar la zona horaria del navegador del usuario como el valor por defecto para la visualización. La API `Intl.DateTimeFormat` de JavaScript es la herramienta estándar para esto.
    *   **Formato:** Asegurar que el formato de visualización sea coherente y claro para el usuario, respetando sus configuraciones regionales de ser posible.

4.  **Configuración de Zona Horaria por el Usuario (Nueva Funcionalidad):**
    *   **Implementación:** Desarrollar una nueva sección en el panel de configuración que permita a los usuarios seleccionar explícitamente su zona horaria preferida de una lista de zonas horarias estándar (ej., usando identificadores IANA como "America/New_York", "Europe/London").
    *   **Almacenamiento:** Guardar esta preferencia del usuario de forma persistente.
    *   **Aplicación:** Si el usuario ha configurado una zona horaria preferida, esta debe tener precedencia sobre la zona horaria detectada del navegador para todas las visualizaciones de fecha/hora en la aplicación. La API `Intl.DateTimeFormat` permite especificar una `timeZone`.

5.  **APIs y Comunicación Externa:**
    *   Si la aplicación se comunica con APIs externas o un backend, asegurar que todas las fechas intercambiadas utilicen el formato estándar ISO 8601 con el designador UTC (`Z`), por ejemplo: `YYYY-MM-DDTHH:mm:ss.sssZ`.

**Consideraciones Adicionales:**

*   **Bibliotecas de Fechas:** Evaluar el uso de bibliotecas de manejo de fechas robustas (como `date-fns`, `date-fns-tz`, `Luxon`) que pueden simplificar enormemente las conversiones, el formateo y la manipulación de fechas a través de diferentes zonas horarias.
*   **Componentes Reutilizables:** Cualquier componente que maneje o muestre fechas debería ser consciente de esta estrategia y, idealmente, operar con fechas UTC internamente, aceptando o convirtiendo a UTC en sus props y convirtiendo a local solo para mostrar.
*   **Testing:** Actualizar o crear tests unitarios y de integración para verificar el correcto manejo de fechas, conversiones de zona horaria y la nueva funcionalidad de selección de zona horaria. Los mocks de fechas en los tests deben ser manejados cuidadosamente para reflejar la zona horaria esperada o UTC.

**Beneficios Esperados:**

*   Reducción significativa de bugs relacionados con la incorrecta interpretación de horas en diferentes regiones.
*   Una base de código más predecible y fácil de mantener en lo referente a fechas.
*   Mejora de la experiencia del usuario al ver las horas correctamente ajustadas a su contexto.
*   Preparación de la aplicación para una posible expansión a usuarios en múltiples zonas horarias globales.

