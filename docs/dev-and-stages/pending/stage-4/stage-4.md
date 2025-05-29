# Stage 4: Robustez, Gestión Avanzada y Fundamentos de Internacionalización (Versión 0.4.0 Propuesta)

**Enfoque Principal:** Fortalecer la estabilidad del núcleo de Atlas, mejorar la gestión de datos y permisos, integrar funcionalidades de seguridad avanzadas del sandbox, y sentar las bases para la internacionalización y capacidades de Progressive Web App (PWA). Además, se introducirían nuevos plugins esenciales para expandir la utilidad de la plataforma.

---

## Componentes Clave a Desarrollar / Mejorar

### 1. Sistema Avanzado de Administración y Monitoreo

- **Objetivo:** Proporcionar a los administradores y desarrolladores herramientas mejoradas para el diagnóstico y mantenimiento de la aplicación.
- **Funcionalidades:**
  - **Panel de Administración Mejorado:** Evolucionar el actual "Panel de Desarrolladores" para incluir:
    - Visor integrado de logs de la aplicación (no solo de eventos, sino logs generales del sistema y plugins).
    - Estadísticas de rendimiento y uso de recursos más detalladas (integrando y exponiendo mejor los datos de `plugin-resource-monitor.js`).
  - **Componente `ErrorBoundary` Global:** Implementar un `ErrorBoundary` de React a nivel raíz de la aplicación para capturar errores de renderizado en cualquier parte de la UI, mostrando un mensaje amigable al usuario y facilitando el reporte de errores.
  - **Diagnóstico de Plugins:** Mejorar la información disponible sobre el estado, errores y uso de recursos de cada plugin en el "Panel de Plugins".

### 2. Gestión Robusta de Datos: Exportación e Importación

- **Objetivo:** Permitir a los usuarios realizar copias de seguridad completas de sus datos de Atlas y restaurarlos, así como facilitar la migración entre instalaciones.
- **Funcionalidades:**
  - **Exportación Selectiva y Completa:**
    - Opción para exportar todos los datos de la aplicación (configuración, eventos del calendario, datos de todos los plugins) en un formato consolidado (ej. JSON).
    - (Potencial) Posibilidad de exportar datos por módulo o plugin específico.
    - (Potencial) Opción para filtrar por rango de fechas para datos temporales (ej. eventos del calendario).
  - **Importación con Validación:**
    - Funcionalidad para importar un archivo de datos previamente exportado.
    - Validación de la estructura y versión del archivo importado.
    - Estrategias para la resolución de conflictos (ej. omitir, sobrescribir, fusionar si es posible).
  - **Integración con Sistema de Archivos Nativo (Electron):** Utilizar diálogos nativos de guardado/apertura de archivos para una mejor experiencia en la versión de escritorio.
  - **Seguridad en la Exportación/Importación:** Considerar opciones para encriptar los datos exportados si contienen información sensible.

### 3. Estandarización del Manejo de Fechas y Horas y Configuración de Zona Horaria

- **Objetivo:** Asegurar la consistencia y precisión en el manejo de todas las fechas y horas dentro de Atlas y sus plugins, y dar control al usuario sobre su zona horaria.
- **Funcionalidades:**
  - Adopción interna de UTC para almacenamiento y lógica.
  - Conversión a la zona horaria local del usuario (o preferida) solo en la capa de visualización.
  - Implementación de una configuración de usuario para seleccionar explícitamente una zona horaria preferida.
- **Referencia:** Ver documento detallado [`date-time-standardization.md`](./date-time-standardization.md) para la estrategia completa.

### 4. Integración Completa de Funcionalidades Avanzadas del Sandbox

- **Objetivo:** Activar y utilizar todas las capacidades de seguridad del `plugin-sandbox.js` para mejorar la protección contra comportamientos no deseados de los plugins.
- **Funcionalidades:**
  - Integración activa de `createDOMProxy` para la manipulación segura del DOM por parte de los plugins.
  - Activación y prueba de la protección de objetos globales de JavaScript en niveles de seguridad altos.
  - Revisión y ajuste de las reglas de análisis estático para alinearlas con las APIs seguras expuestas por `coreAPI`.
- **Referencia:** Ver documento detallado [`integration-of-advanced-sandbox-features.md`](./integration-of-advanced-sandbox-features.md) para la estrategia completa.

### 5. Mejoras en el Sistema de Gestión de Permisos de Plugins

- **Objetivo:** Implementar la persistencia de las decisiones de permisos, permitir la revocación y la reconsideración de permisos.
- **Funcionalidades:**
  - Guardar y restaurar el estado de los permisos (aprobados, denegados/revocados) entre sesiones.
  - Interfaz de usuario para que los administradores/usuarios puedan revocar permisos ya concedidos.
  - Interfaz para revisar y potencialmente aprobar permisos previamente denegados.
- **Referencia:** Ver documento detallado [`plugin-permissions-enhancements.md`](./plugin-permissions-enhancements.md) para la estrategia completa.

### 6. Fundamentos de Internacionalización (i18n)

- **Objetivo:** Preparar la aplicación y su arquitectura para el soporte multilingüe.
- **Funcionalidades:**
  - Implementación de la estructura básica del sistema de i18n (directorios, configuración inicial de la librería `i18next`).
  - Extracción de cadenas de texto de los componentes principales del Core a archivos de recursos de idioma (inicialmente para `es` y `en`).
  - Preparación de la API Core y del sistema de plugins para que los plugins puedan registrar y utilizar sus propias traducciones.
  - Configuración inicial para la detección de idioma y (potencialmente) un selector básico de idioma en la configuración.
- **Referencia:** Ver documento detallado [`internationalization.md`](./internationalization.md) para la arquitectura y guía de implementación.

### 7. Configuración Inicial de Progressive Web App (PWA)

- **Objetivo:** Sentar las bases para que Atlas pueda ser instalable y ofrecer una experiencia offline básica como PWA.
- **Funcionalidades:**
  - Creación y configuración del archivo `manifest.json` con información básica de la aplicación (nombre, descripción, iconos, colores tema, modo de visualización).
  - Implementación de un Service Worker mínimo para caché básica de recursos estáticos (HTML, CSS, JS principales) y una estrategia de "network falling back to cache" o "cache first" para funcionalidad offline básica.
  - Inclusión de metadatos necesarios en `index.html` para la instalación de PWA.
  - _(Nota: La funcionalidad PWA completa, incluyendo sincronización offline avanzada, se planificaría para versiones posteriores, potencialmente v1.0.0)._

### 8. Plugin Esencial: Task Tracker (Seguimiento de Tareas)

- **Objetivo:** Implementar un plugin robusto para la gestión de tareas.
- **Funcionalidades Clave:**
  - Creación, edición, eliminación de tareas con detalles (descripción, fecha de vencimiento, prioridad, estado, tags).
  - Vistas flexibles: lista de tareas y tablero Kanban personalizable.
  - Integración opcional y configurable con los eventos del calendario de Atlas (sincronización de tareas con fechas de vencimiento).
- **Referencia:** Ver documento conceptual [`task-tracker.md`](./plugins/task-tracker.md) para la visión detallada.

### 9. Plugin Esencial: Reminder System (Sistema de Recordatorios)

- **Objetivo:** Implementar un sistema de notificaciones y recordatorios para eventos.
- **Funcionalidades Clave:**
  - Configuración de múltiples recordatorios por evento (ej. 1 hora antes, 15 mins antes).
  - Notificaciones nativas (Electron) y notificaciones web.
  - Opciones de posponer (snooze) y descartar recordatorios.
  - Preferencias de notificación personalizables por el usuario.
- **Referencia:** Ver documento conceptual [`reminder-system.md`](./plugins/reminder-system.md) para la visión detallada.

---

## Criterios de Finalización para la Stage 4 (v0.4.0)

- Sistema de administración con visor de logs y ErrorBoundary funcional.
- Capacidad de exportar e importar todos los datos de la aplicación (Core y plugins) de forma fiable.
- Manejo de fechas y horas estandarizado en UTC internamente, con visualización localizada y opción de configuración de zona horaria por el usuario.
- Funcionalidades avanzadas del sandbox (protección DOM, objetos globales) integradas y operativas según el nivel de seguridad.
- Sistema de permisos de plugins con persistencia, revocación y reconsideración implementados.
- Estructura base de internacionalización funcional, con el Core de Atlas y los plugins principales mostrando textos extraídos de archivos de recursos (al menos para `es` y `en`).
- Configuración básica de PWA (`manifest.json`, Service Worker simple para caché offline básica) implementada.
- Los plugins "Task Tracker" y "Reminder System" desarrollados, funcionales y bien integrados.
- Aumento continuo de la cobertura de pruebas y mejora de la estabilidad general del sistema.
- Documentación actualizada para todas las nuevas funcionalidades y cambios arquitectónicos.

---

## Estructura de Archivos Prevista al Finalizar la Stage 4 (Adiciones/Cambios Notables)

```

AtlasCore/
├── ... (sin cambios mayores en la raíz)
├── public/
│ └── manifest.json # NUEVO (para PWA)
│ └── service-worker.js # NUEVO (para PWA, o en src y compilado a public)
├── plugins/
│ ├── task-tracker/ # NUEVO PLUGIN
│ │ ├── index.js
│ │ ├── components/
│ │ ├── services/ (si aplica)
│ │ ├── locales/
│ │ │ ├── es/tasks.json
│ │ │ └── en/tasks.json
│ │ └── ...
│ ├── reminder-system/ # NUEVO PLUGIN
│ │ ├── index.js
│ │ ├── components/
│ │ ├── services/
│ │ ├── locales/
│ │ │ ├── es/reminders.json
│ │ │ └── en/reminders.json
│ │ └── ...
│ └── (otros plugins existentes)
│ └── locales/ # Carpetas de locales añadidas a plugins existentes
│ ├── es/plugin-nombre.json
│ └── en/plugin-nombre.json
└── src/
├── components/
│ └── admin/ # NUEVO (o renombrado desde debug)
│ ├── AdminPanel.jsx
│ ├── LogViewer.jsx
│ └── ErrorBoundary.jsx
│ └── ui/
│ └── TimezoneSelector.jsx # NUEVO (para configuración de zona horaria)
├── i18n/ # NUEVO DIRECTORIO
│ ├── index.js # Configuración de i18next
│ └── locales/ # Archivos de traducción (es/, en/)
│ ├── es/common.json
│ ├── es/calendar.json
│ ├── es/settings.json
│ └── ...
├── services/
│ └── i18n-service.js # (Potencial) Servicio para i18n si es necesario
├── utils/
│ └── timezone-utils.js # NUEVO (para manejo de zonas horarias)
└── ... (otros archivos pueden ser modificados para i18n y manejo de fechas)

```

_(Esta estructura es una estimación y podría variar según las decisiones de implementación específicas)._
