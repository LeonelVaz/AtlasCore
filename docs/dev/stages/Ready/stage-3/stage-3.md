# Stage 3 - Personalización, Plugins y Seguridad Avanzada (Versión 0.3.0)

**Enfoque**: Implementar un sistema de temas robusto, escalas de tiempo y horarios personalizables, un sistema de plugins completo con seguridad avanzada, herramientas de desarrollo, y los primeros plugins funcionales con UI rica.

**Componentes a desarrollar:**

1.  **Sistema de Temas Avanzado**

    - Implementación de temas base (Claro, Oscuro) y adicionales (Atlas Dark Blue, Púrpura Nocturno, Deep Ocean).
    - Sistema de variables CSS para personalización completa.
    - Panel de configuración de apariencia para seleccionar temas.
    - Aplicación dinámica de temas sin recarga de página.
    - Persistencia de preferencias de tema.

2.  **Sistema de Escalas de Tiempo y Franjas Horarias Personalizables**

    - Configuración de densidad visual del calendario (píxeles por minuto/hora).
    - Interfaz para gestionar escalas de tiempo con previsualización en tiempo real.
    - Escalas predefinidas (Compacta, Estándar, Cómoda, Espaciosa) y creación de escalas personalizadas.
    - Editor para crear y eliminar franjas horarias personalizadas (ej. 15, 30, 45 minutos).
    - Visualización diferenciada y creación de tiempos intermedios directamente en la rejilla.
    - Persistencia de configuraciones de escala y franjas.

3.  **Sistema de Plugins Completo y API Core Mejorada**

    - Estructura de plugins robusta con carga dinámica.
    - Registro de plugins, gestión de dependencias y resolución de conflictos.
    - **API Core para Plugins Avanzada:**
      - Acceso a almacenamiento persistente.
      - Sistema de eventos para comunicación entre plugins y con el núcleo.
      - API para extensiones de interfaz de usuario.
      - API para comunicación directa entre plugins (llamada de métodos y canales).
      - API de diálogos personalizados (`alert`, `confirm`, `prompt`) para plugins.
      - Acceso a componentes UI reutilizables del núcleo (ej. `RichTextEditor`, `RichTextViewer`).

4.  **Sistema de UI Extensible Avanzado**

    - Componente `ExtensionPoint` para renderizar extensiones dinámicamente.
    - **Zonas de Extensión Nuevas y Mejoradas:**
      - `MAIN_NAVIGATION`: Permite a los plugins añadir ítems a la barra de navegación principal.
      - `PLUGIN_PAGES`: Permite a los plugins definir y renderizar sus propias páginas completas.
      - `SETTINGS_PANEL`: Permite a los plugins añadir sus propios paneles de configuración.
      - `CALENDAR_SIDEBAR`: Para widgets y herramientas en la barra lateral del calendario.
      - Extensiones específicas del calendario: `CALENDAR_DAY_HEADER`, `CALENDAR_HOUR_CELL`, `EVENT_DETAIL_VIEW`, `EVENT_FORM`.

5.  **Sistema de Diálogos Personalizado**

    - Implementación de diálogos modales personalizados (`alert`, `confirm`, `prompt`) que reemplazan los nativos.
    - Contexto de React para gestión centralizada de diálogos.
    - Interceptor para diálogos globales, asegurando consistencia en web y Electron.
    - API de diálogos disponible para los plugins.

6.  **Panel de Desarrolladores y Herramientas de Depuración**

    - Implementación de un panel de configuración avanzado para desarrolladores.
    - **Event Debugger Avanzado:**
      - Panel flotante para monitoreo en tiempo real de todos los eventos del sistema.
      - Visualización de estadísticas de eventos (total, por categoría).
      - Configuraciones rápidas (logs detallados, monitor de rendimiento futuro).
      - Herramientas de depuración (Test Manual, Limpiar Consola, Información del Sistema).
    - Logs detallados en consola configurables desde el panel.

7.  **Sistema de Seguridad para Plugins Avanzado**

    - **Sandbox para Ejecución Aislada:** Ejecución segura del código de plugins.
    - **Sistema de Permisos Granular:** Declaración y verificación de permisos.
    - **Detección de Código Malicioso:** Análisis estático y monitoreo de comportamiento.
    - **Monitoreo de Recursos:** Seguimiento del uso de CPU, memoria y otras operaciones por plugin.
    - **Niveles de Seguridad Configurables (LOW, NORMAL, HIGH):** Impactan permisos, límites y monitoreo.
    - **Auditoría de Seguridad:** Registro detallado de actividades de plugins y eventos de seguridad.
    - **Gestión de Seguridad en UI:**
      - `SecurityPanel.jsx`: Panel central en configuración.
      - `AuditDashboard.jsx`: Visualización de logs de auditoría.
      - `PermissionsManager.jsx`: Gestión de permisos de plugins.
      - `ThreatsDashboard.jsx`: Visualización de amenazas detectadas.
    - Lista negra de plugins.

8.  **Marketplace de Plugins, Gestión de Repositorios y Actualizaciones**

    - **Interfaz de Marketplace (`PluginMarketplace.jsx`):**
      - Buscar, ver detalles, instalar y desinstalar plugins.
    - **Gestión de Repositorios (`RepositoryManager.jsx`):**
      - Añadir, editar, eliminar y sincronizar repositorios de plugins.
    - **Gestión de Actualizaciones (`UpdateManager.jsx`):**
      - Verificar y aplicar actualizaciones para plugins instalados.
    - **Núcleo de Distribución:**
      - `plugin-package-manager.js`: Empaquetado e instalación.
      - `plugin-repository-manager.js`: Manejo de fuentes de plugins.
      - `plugin-update-manager.js`: Lógica de actualizaciones.
      - `plugin-integrity-checker.js`: Verificación de integridad de paquetes.

9.  **Plugin: Gestor de Notas Avanzado (notes-manager)**

    - **Vinculación Completa con Eventos del Calendario:**
      - Crear notas desde el menú contextual de eventos.
      - Visualizar notas asociadas en los detalles del evento.
      - Selector de eventos para vincular/desvincular notas.
      - Sincronización automática de títulos de eventos.
    - **Editor de Texto Enriquecido:**
      - Integración con `RichTextEditor` y `RichTextViewer` de Atlas Core.
      - Soporte para formato (negrita, cursiva, listas, enlaces, imágenes, citas, etc.).
    - **Navegación y Página Dedicada:** Ítem en la navegación principal y página completa para gestión de notas.
    - **Funcionalidades Adicionales:** Búsqueda inteligente (títulos, contenido, eventos vinculados), estadísticas de notas.

10. **Plugin: Contador de Eventos Pro (event-counter)**

    - Contador visual de eventos por día en el calendario.
    - **Personalización Extrema:**
      - Estilos de badge (redondeado, circular, cuadrado, minimalista).
      - Posición y tamaño del badge.
      - Colores dinámicos (único o por rangos según cantidad de eventos).
      - Tipografía avanzada (familia, tamaño, peso, color).
      - Efectos visuales: sombras, resplandor (glow), bordes.
      - Fondo transparente.
      - Animaciones de aparición y efectos hover.
    - **Opciones Avanzadas:** Ocultar con cero eventos, mostrar solo en días laborales, CSS personalizado.
    - Presets de configuración y vista previa en tiempo real.

11. **Plugin: Planificador de Videos (video-scheduler)**
    - **Sistema de Estados Detallado:** Estados principales (Pendiente, Vacío, Desarrollo, Producción, Publicado), sub-estados (Grabando, Editando, etc.) y estados apilables (Duda, Alerta) con representación visual mediante emojis.
    - **Gestión de Ingresos Diarios:** Registro de montos, selección de moneda, pagador y estado de pago.
    - **Configuración de Monedas y Tasas de Cambio:** Definición de moneda principal del usuario y tasas de conversión para ingresos en otras divisas.
    - **Calendario Mensual Específico:** Interfaz principal para planificar videos en slots horarios (7am, 15pm, 22pm).
    - **Formularios Dedicados:** Para edición de detalles de video, ingresos diarios, adición en lote de videos.
    - **Panel de Estadísticas Avanzado:** Vista general del mes, gráficos, comparación entre meses para videos e ingresos.
    - **Funcionalidades de Gestión de Datos:** Importación/exportación de todos los datos del plugin, reseteo de datos (mes actual o total).
    - **Integración Completa:** Ítem de navegación, página principal y widget en el panel de configuración de Atlas.

**Criterios de finalización:**

- Sistema de temas y personalización de UI completamente funcional.
- Configuración de escalas temporales y franjas horarias operativas.
- Sistema de plugins robusto, seguro y con API documentada.
- Plugins de Notas, Contador de Eventos y Planificador de Videos integrados, funcionales y con buen rendimiento.
- Panel de configuración de Atlas extendido para gestionar todas las nuevas opciones.
- Panel de Desarrolladores con herramientas de depuración funcionales.
- Sistema de Seguridad para Plugins operativo y configurable.
- Funcionalidades de Marketplace, Repositorios y Actualizaciones implementadas y probadas.
- Documentación actualizada para reflejar la nueva arquitectura y funcionalidades.
- Cobertura de pruebas unitarias superior al 80% para el núcleo de la aplicación.

## Estructura de archivos de la Aplicación Principal (`src`) al finalizar Stage 3

```

atlas-core/
├── ... (archivos raíz como package.json, vite.config.js)
├── electron/ # Configuración para la app de escritorio
│ ├── main.js
│ ├── preload.js
│ └── window-manager.js
│
├── public/
│ ├── favicon.ico
│ └── logo-white.png # Logo para la UI
│
├── src/
│ ├── index.jsx # Punto de entrada principal de React
│ ├── app.jsx # Componente raíz de la aplicación
│ │
│ ├── components/
│ │ ├── calendar/ # Componentes principales del calendario
│ │ │ ├── calendar-main.jsx
│ │ │ ├── day-view.jsx
│ │ │ ├── event-form.jsx
│ │ │ ├── event-item.jsx
│ │ │ ├── snap-control.jsx
│ │ │ ├── time-grid.jsx
│ │ │ ├── time-slot.jsx
│ │ │ └── week-view.jsx
│ │ │
│ │ ├── debug/ # Componentes de depuración
│ │ │ └── event-debugger.jsx
│ │ │
│ │ ├── plugin-extension/ # Componentes para el sistema de extensión de UI
│ │ │ ├── extension-point.jsx
│ │ │ ├── navigation-extensions.jsx
│ │ │ ├── plugin-pages.jsx
│ │ │ ├── settings-extensions.jsx
│ │ │ └── sidebar-extensions.jsx
│ │ │
│ │ ├── security/ # Dashboards y componentes de UI para seguridad
│ │ │ ├── audit-dashboard.jsx
│ │ │ ├── permissions-manager.jsx
│ │ │ └── threats-dashboard.jsx
│ │ │
│ │ ├── settings/ # Componentes para el panel de configuración
│ │ │ ├── calendar-config.jsx
│ │ │ ├── developer-panel.jsx
│ │ │ ├── plugin-marketplace.jsx
│ │ │ ├── plugins-panel.jsx
│ │ │ ├── repository-manager.jsx
│ │ │ ├── security-panel.jsx
│ │ │ ├── settings-panel.jsx
│ │ │ ├── theme-config.jsx
│ │ │ ├── time-scale-config.jsx
│ │ │ ├── time-slot-editor.jsx
│ │ │ └── update-manager.jsx
│ │ │
│ │ └── ui/ # Componentes de UI reutilizables
│ │ ├── button.jsx
│ │ ├── dialog-system/ # Sistema de diálogos personalizados
│ │ │ └── custom-dialog.jsx
│ │ ├── dialog.jsx
│ │ ├── rich-text/ # Componentes de texto enriquecido
│ │ │ ├── index.js
│ │ │ ├── rich-text-editor.jsx
│ │ │ └── rich-text-viewer.jsx
│ │ ├── sidebar/
│ │ │ ├── sidebar-item.jsx
│ │ │ └── sidebar.jsx
│ │ └── window-controls.jsx # Controles de ventana para Electron
│ │
│ ├── config/ # Archivos de configuración del núcleo
│ │ └── plugin-config.js # Configuración de plugins (ahora en src)
│ │
│ ├── contexts/ # Contextos de React
│ │ ├── config-provider.jsx # Proveedor unificado de contextos de configuración
│ │ ├── dialog-context.jsx
│ │ ├── theme-context.jsx
│ │ └── time-scale-context.jsx
│ │
│ ├── core/ # Lógica central de Atlas
│ │ ├── bus/
│ │ │ ├── event-bus.js
│ │ │ └── events.js
│ │ │
│ │ ├── config/
│ │ │ └── constants.js # Constantes globales (movido a core/config)
│ │ │
│ │ ├── modules/
│ │ │ ├── calendar-module.js
│ │ │ └── module-registry.js
│ │ │
│ │ └── plugins/ # Lógica del sistema de plugins
│ │ ├── core-api.js
│ │ ├── plugin-api-registry.js
│ │ ├── plugin-communication.js
│ │ ├── plugin-compatibility.js
│ │ ├── plugin-dependency-resolver.js
│ │ ├── plugin-error-handler.js
│ │ ├── plugin-events.js
│ │ ├── plugin-integrity-checker.js
│ │ ├── plugin-loader.js
│ │ ├── plugin-manager.js
│ │ ├── plugin-package-manager.js
│ │ ├── plugin-permission-checker.js
│ │ ├── plugin-registry.js
│ │ ├── plugin-repository-manager.js
│ │ ├── plugin-resource-monitor.js
│ │ ├── plugin-sandbox.js
│ │ ├── plugin-security-audit.js
│ │ ├── plugin-security-manager.js
│ │ ├── plugin-storage.js
│ │ ├── plugin-update-manager.js
│ │ ├── plugin-validator.js
│ │ └── ui-extension-manager.js
│ │
│ ├── hooks/ # Hooks personalizados de React
│ │ ├── use-calendar-events.jsx
│ │ ├── use-calendar-navigation.jsx
│ │ ├── use-event-drag.jsx
│ │ ├── use-event-form.jsx
│ │ ├── use-event-resize.jsx
│ │ ├── use-theme.jsx
│ │ ├── use-time-grid.jsx
│ │ └── use-time-scale.jsx
│ │
│ ├── services/ # Servicios globales de la aplicación
│ │ ├── storage-service.js
│ │ ├── theme-service.js
│ │ └── time-scale-service.js
│ │
│ ├── styles/ # Estilos CSS
│ │ ├── app.css
│ │ ├── calendar/ # ... (estilos del calendario)
│ │ ├── debug/ # ... (estilos de depuración)
│ │ ├── header-controls.css
│ │ ├── index.css # Principal de estilos
│ │ ├── plugins/ # ... (estilos relacionados con plugins)
│ │ ├── settings/ # ... (estilos de configuración)
│ │ ├── themes/ # ... (archivos de temas)
│ │ ├── ui/ # ... (estilos de componentes UI)
│ │ └── variables.css
│ │
│ └── utils/ # Funciones de utilidad
│ ├── date-utils.js
│ ├── debug-utils.js
│ ├── dialog-interceptor.js # Interceptor de diálogos
│ ├── electron-detector.js # Detector de entorno Electron
│ ├── event-utils.js
│ ├── module-utils.js
│ └── time-utils.js
│
├── plugins/ # Carpeta contenedora de plugins
│ ├── event-counter/ # (Estructura detallada más abajo)
│ ├── notes-manager/ # (Estructura detallada más abajo)
│ ├── video-scheduler/ # (Estructura detallada más abajo)
│ └── README.md # Guía para la carpeta de plugins
│
└── docs/ # Documentación del proyecto

```

## Estructura Detallada de los Plugins (en `atlas-core/plugins/`)

A continuación, se detalla la estructura interna de cada uno de los plugins principales desarrollados o significativamente actualizados en esta etapa.

### 1. Plugin: Contador de Eventos Pro (`event-counter`)

```

plugins/
└── event-counter/
├── index.js # Lógica principal del plugin y API pública
├── components/
│ ├── EventCounterBadge.jsx # Componente UI del badge contador
│ └── SettingsPanel.jsx # Panel de configuración del plugin
├── styles/
│ ├── index.css # Importa los otros CSS del plugin
│ ├── EventCounterBadge.css # Estilos para el badge
│ └── SettingsPanel.css # Estilos para el panel de configuración
├── docs/
│ └── guia-plugin-atlas.md # (Este es el archivo que estamos editando, lo incluyo por completitud)
└── README.md # Documentación específica del plugin

```

### 2. Plugin: Gestor de Notas (`notes-manager`)

```

plugins/
└── notes-manager/
├── index.js # Lógica principal, API y registro de extensiones
├── components/
│ ├── NotesNavigationItem.jsx # Ítem para la barra de navegación principal
│ ├── NotesPage.jsx # Página principal para ver y gestionar notas
│ ├── NoteCard.jsx # Componente para mostrar una nota individual
│ ├── CreateNoteForm.jsx # Formulario para crear/editar notas (con RichText)
│ ├── EventNotesExtension.jsx # Componente para mostrar notas en detalles de evento
│ └── EventSelector.jsx # Modal para seleccionar un evento a vincular
├── styles/
│ ├── index.css # Importa todos los CSS del plugin
│ ├── notes-page.css # Estilos para la página principal
│ ├── note-card.css # Estilos para las tarjetas de nota
│ ├── create-note-form.css # Estilos para el formulario de creación/edición
│ ├── event-notes-extension.css # Estilos para la extensión en detalles de evento
│ └── event-selector.css # Estilos para el modal selector de eventos
└── README.md # Documentación del plugin de notas

```

### 3. Plugin: Planificador de Videos (`video-scheduler`)

```

plugins/
└── video-scheduler/
├── index.js # Lógica principal, API y registro de extensiones
├── components/
│ ├── VideoSchedulerNavItem.jsx # Ítem para la barra de navegación principal
│ ├── VideoSchedulerMainPage.jsx# Página principal del calendario de videos
│ ├── DayCell.jsx # Celda para mostrar el día del mes
│ ├── VideoSlotCell.jsx # Celda para un slot de video (con inputs y estados)
│ ├── DaySummaryCell.jsx # Celda de resumen de estados del día
│ ├── DailyIncomeCell.jsx # Celda para mostrar ingresos del día
│ ├── StatusSelector.jsx # Popup para seleccionar estado del video
│ ├── DailyIncomeForm.jsx # Popup para añadir/editar ingresos
│ ├── VideoForm.jsx # Modal para editar detalles extendidos del video
│ ├── BulkAddForm.jsx # Modal para añadir videos en lote
│ ├── CurrencyRateForm.jsx # Modal para configurar monedas y tasas
│ ├── StatsPanel.jsx # Modal/Panel avanzado de estadísticas
│ ├── StatsOverviewPanel.jsx # Componente para la vista general de estadísticas
│ ├── SettingsPanelWidget.jsx # Widget para el panel de configuración de Atlas
│ ├── ImportExportModal.jsx # Modal para importar/exportar datos
│ └── ResetDataModal.jsx # Modal para resetear datos del plugin
├── utils/
│ └── constants.js # Constantes específicas del plugin (estados, emojis, etc.)
├── styles/
│ ├── index.css # Importa todos los CSS del plugin
│ ├── VideoSchedulerMainPage.css
│ ├── DayCell.css
│ ├── VideoSlotCell.css
│ ├── DaySummaryCell.css
│ ├── DailyIncomeCell.css
│ ├── StatusSelector.css
│ ├── DailyIncomeForm.css
│ ├── StatsPanel.css
│ ├── StatsOverviewPanel.css
│ ├── BulkAddForm.css
│ ├── CurrencyRateForm.css
│ ├── VideoForm.css
│ ├── SettingsPanelWidget.css
│ ├── ImportExportModal.css
│ └── ResetDataModal.css
├── docs/
│ ├── STATUS_SYSTEM.md # Documentación del sistema de estados de video
│ └── VIDEO_SCHEDULER_UX_VISION.md # Visión de diseño UX
└── README.md # Documentación general del plugin
```
