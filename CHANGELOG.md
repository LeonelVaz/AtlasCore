# Registro de Cambios (Changelog)

Todas las notas de cambios para este proyecto serán documentadas en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Versionamiento Semántico](https://semver.org/lang/es/).

## [0.3.0] - 2025-05-29

### Añadido

- **Sistema de Temas Avanzado:**
  - Implementación de temas base (Claro, Oscuro) y adicionales (Atlas Dark Blue, Púrpura Nocturno, Deep Ocean).
  - Panel de configuración de apariencia (`src/components/settings/theme-config.jsx`) para selección y previsualización de temas.
  - Aplicación dinámica de temas sin recarga y persistencia de preferencias mediante `ThemeService`.
- **Escalas de Tiempo y Franjas Horarias Personalizables:**
  - Panel de configuración (`src/components/settings/time-scale-config.jsx`) para ajustar la densidad visual del calendario.
  - Editor de franjas horarias personalizadas (`src/components/settings/time-slot-editor.jsx`) para subdivisiones.
  - Persistencia de configuraciones gestionada por `TimeScaleService`.
- **Sistema de Plugins Completo y API Core Mejorada (`coreAPI` v0.3.0):**
  - Carga dinámica de plugins desde el directorio `/plugins/` (`src/core/plugins/plugin-loader.js`).
  - Gestión de dependencias y resolución de conflictos (`src/core/plugins/plugin-dependency-resolver.js`).
  - API para almacenamiento persistente por plugin (`coreAPI.storage` vía `src/core/plugins/plugin-storage.js`).
  - API para sistema de eventos (`coreAPI.events` vía `src/core/plugins/plugin-events.js`).
  - API para extensiones de UI (`coreAPI.ui` vía `src/core/plugins/ui-extension-manager.js`).
  - API para comunicación directa entre plugins y canales (`coreAPI.plugins` vía `src/core/plugins/plugin-communication.js`).
  - API de diálogos personalizados (`coreAPI.dialogs`) integrada con `DialogContext`.
  - Acceso a componentes UI del Core (`RichTextEditor`, `RichTextViewer`) vía `coreAPI.ui.components`.
  - Acceso al módulo de calendario (`coreAPI.getModule('calendar')`).
- **Sistema de UI Extensible Avanzado:**
  - Componente `ExtensionPoint` (`src/components/plugin-extension/extension-point.jsx`) para renderizar extensiones.
  - Nuevas zonas de extensión: `MAIN_NAVIGATION`, `PLUGIN_PAGES`, `SETTINGS_PANEL`, `CALENDAR_DAY_HEADER`, `CALENDAR_HOUR_CELL`, `EVENT_DETAIL_VIEW`, `EVENT_FORM`.
- **Sistema de Diálogos Personalizado:**
  - Componente `CustomDialog` (`src/components/ui/dialog-system/custom-dialog.jsx`).
  - Contexto `DialogContext` y hook `useDialog` (`src/contexts/dialog-context.jsx`).
  - Interceptor de diálogos globales (`src/utils/dialog-interceptor.js`).
- **Panel de Desarrolladores y Herramientas de Depuración:**
  - Panel de configuración (`src/components/settings/developer-panel.jsx`).
  - Event Debugger flotante (`src/components/debug/event-debugger.jsx`) mejorado.
- **Sistema de Seguridad para Plugins Avanzado:**
  - Sandbox para ejecución (`src/core/plugins/plugin-sandbox.js`).
  - Sistema de permisos (`src/core/plugins/plugin-permission-checker.js`).
  - Monitoreo de recursos (`src/core/plugins/plugin-resource-monitor.js`).
  - Auditoría de seguridad (`src/core/plugins/plugin-security-audit.js`).
  - Paneles de gestión en UI (`src/components/security/`).
- **Marketplace de Plugins, Gestión de Repositorios y Actualizaciones (Funcionalidad Alfa):**
  - Interfaces de usuario: `PluginMarketplace`, `RepositoryManager`, `UpdateManager`.
  - Lógica del Core: `plugin-package-manager.js`, `plugin-repository-manager.js`, `plugin-update-manager.js`, `plugin-integrity-checker.js`.
- **Plugin: Gestor de Notas Avanzado (`plugins/notes-manager` v1.2.1):**
  - Vinculación completa con eventos del calendario.
  - Integración con `RichTextEditor` y `RichTextViewer` del Core.
  - Navegación, página dedicada, búsqueda y estadísticas.
- **Plugin: Contador de Eventos Pro (`plugins/event-counter` v2.0.0):**
  - Badges de eventos altamente personalizables.
  - Panel de configuración con vista previa.
- **Plugin: Planificador de Videos (`plugins/video-scheduler` v0.8.4):**
  - Sistema de estados detallado, gestión de ingresos, calendario específico y estadísticas.
  - Funciones de importación/exportación y reseteo de datos.
- **UI Principal y Contextos:**
  - Componente `Sidebar` (`src/components/ui/sidebar/sidebar.jsx`) con soporte para expansión/colapso y extensiones de plugins.
  - Controles de ventana para Electron (`src/components/ui/window-controls.jsx`).
  - Proveedores de contexto `ConfigProvider`, `ThemeContext`, `TimeScaleContext`.

### Mejorado

- **Arquitectura del Core:** Mayor modularidad en sistemas de plugins, seguridad y configuración.
- **Cobertura de Pruebas Unitarias:** Superada la meta del 80% para el núcleo de la aplicación.
- **API de Core para Plugins:** Robustez y funcionalidades expandidas.
- **Estilos y Temas:** Sistema de variables CSS global (`src/styles/variables.css`) y por tema, aplicación consistente.
- **Documentación Interna:** Actualización de guías de desarrollo.
- **Manejo de Estado:** Uso optimizado de hooks y contextos de React.
- **Proceso de Carga de Plugins:** Mejoras en la resiliencia y el logging detallado.
- **Integración con Electron:** Mejoras en la comunicación (`preload.js`, `main.js`) y controles de ventana.

### Corregido

- Errores menores en la lógica de arrastrar y soltar eventos del calendario, especialmente con el sistema "snap".
- Problemas de sincronización de estado en el `calendar-module` al interactuar con plugins.
- Inconsistencias en la aplicación de variables de tema en algunos componentes UI periféricos.
- Errores en el manejo de almacenamiento persistente (`storageService`) al limpiar datos de plugins.
- Fallos intermitentes en la detección del entorno Electron (`electron-detector.js`) en builds de desarrollo.
- Optimización del renderizado en `TimeGrid` para reducir re-renders innecesarios al actualizar eventos.
- Validación de `pageId` en `PluginPages` para evitar errores si la página no se encuentra.
- Manejo de errores mejorado en el `PluginManager` durante la activación/desactivación de plugins.

## [0.2.0] - 2025-05-11

### Añadido

- Interacciones avanzadas con eventos del calendario
  - Arrastrar y soltar eventos entre horas y días
  - Redimensionamiento de eventos para modificar duración
  - Sistema de imán (snap) para alineación automática
- Vista diaria del calendario
  - Implementación de vista detallada por día
  - Gestión avanzada de eventos continuos entre días
  - Navegación fluida entre vista diaria y semanal
- Sistema de almacenamiento mejorado
  - Capa de abstracción completa (storageService)
  - Integración con Electron Store para la versión de escritorio
  - Manejo mejorado de errores en operaciones de datos
- Registro de módulos funcional
  - Sistema completo window.\_\_appModules
  - Utilidades para interoperabilidad entre módulos
  - Conversión automática de datos entre formatos
- Componentes UI básicos
  - Implementación de componentes Button y Dialog
  - Sistema de mensajes modales

### Mejorado

- Experiencia de usuario con interacciones intuitivas
- Rendimiento en operaciones de arrastrar y redimensionar
- Gestión de errores y validación de datos
- Soporte para la aplicación de escritorio (Electron)
- Estructuración del código para mayor mantenibilidad

## [0.1.0] - 2025-05-08

### Añadido

- Estructura modular base
- Sistema de Bus de Eventos
- Calendario básico funcional
- Almacenamiento simple con localStorage
- Visualización de eventos en formato semanal
- Creación, edición y eliminación de eventos básicos
- Navegación entre semanas

### Mejoras Técnicas

- Implementación de la clase `EventBus` para el patrón publicador/suscriptor
- Sistema básico de registro de módulos
- Hooks personalizados para manejo de eventos del calendario
- Utilidades para gestión de fechas y eventos
