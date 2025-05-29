# Ecosistema de Plugins de Atlas

## 1. Introducción al Sistema de Plugins de Atlas

Atlas está diseñado desde su núcleo para ser una aplicación altamente extensible a través de un sofisticado sistema de plugins. Esta arquitectura permite añadir nuevas funcionalidades, personalizar la interfaz de usuario e integrar con servicios externos sin modificar el código base de la aplicación principal.

Los plugins son componentes de software independientes que se "conectan" al núcleo de Atlas (Core) y pueden:

- Añadir nuevos elementos a la interfaz de usuario (botones, paneles, páginas completas).
- Interactuar con los datos y funcionalidades del calendario.
- Almacenar y gestionar sus propios datos de forma persistente.
- Comunicarse con el Core y con otros plugins a través de un sistema de eventos.
- Exponer sus propias APIs para ser utilizadas por otros plugins.

El sistema de plugins de Atlas está diseñado con un fuerte enfoque en la **seguridad**, la **estabilidad** y la **facilidad de desarrollo**.

## 2. ¿Cómo Funciona la Integración de Plugins con el Core?

La integración de los plugins con el núcleo de Atlas se basa en varios mecanismos clave:

1.  **Carga Dinámica:** El `PluginLoader` (`src/core/plugins/plugin-loader.js`) descubre y carga los plugins (generalmente desde un directorio `/plugins/`).
2.  **Registro Centralizado:** El `PluginRegistry` (`src/core/plugins/plugin-registry.js`) mantiene un listado de todos los plugins conocidos, su metadata y su estado (activo/inactivo).
3.  **Ciclo de Vida del Plugin:** Cada plugin debe exportar un objeto con métodos `init(coreAPI)` y `cleanup()`.
    - `init(coreAPI)`: Se llama cuando el plugin se activa. Recibe una instancia del `coreAPI`.
    - `cleanup()`: Se llama cuando el plugin se desactiva. Debe liberar todos los recursos.
4.  **API del Core (`coreAPI`):** (`src/core/plugins/core-api.js`) Fachada principal para que los plugins interactúen con Atlas (eventos, almacenamiento, UI, diálogos, etc.).
5.  **Sistema de Seguridad:** Un conjunto de módulos (`plugin-security-manager.js`, `plugin-sandbox.js`, etc.) que validan, monitorean y restringen la ejecución de los plugins.
6.  **Puntos de Extensión de UI:** (`src/components/plugin-extension/ExtensionPoint.jsx`) Componentes de Atlas que permiten a los plugins inyectar su propia interfaz gráfica.
7.  **Gestión de Dependencias y Conflictos:** El sistema analiza las dependencias y conflictos declarados por los plugins.

## 3. Lista y Descripción de Plugins Disponibles (v0.3.0)

A continuación, se describen los plugins principales que forman parte del ecosistema de Atlas en la versión actual.

### 3.1. Contador de Eventos Pro (`event-counter`)

- **ID:** `contador-eventos-dia`
- **Versión:** 2.0.0
- **Autor:** Atlas Plugin Developer
- **Descripción:** Muestra "badges" (insignias) personalizables en cada día del calendario con el número de eventos programados, ofreciendo una rica personalización visual.
- **Funcionalidades Clave:**
  - Renderiza un badge contador en los encabezados de día del calendario.
  - Amplias opciones de personalización (estilo, posición, tamaño, colores dinámicos, tipografía, efectos visuales como sombras y resplandor, animaciones, CSS personalizado).
  - Panel de configuración dedicado con vista previa en tiempo real.
  - Presets de configuración para inicio rápido.
- **Integración con Atlas:**
  - Extiende `CALENDAR_DAY_HEADER` para mostrar el badge.
  - Añade un panel al `SETTINGS_PANEL` para su configuración.
  - Utiliza `coreAPI.storage` para guardar sus ajustes.
  - Se suscribe a eventos del calendario para actualizar los contadores.
- **API Pública:** Expone métodos para obtener/actualizar su configuración y para que otros componentes puedan determinar dinámicamente los estilos y clases del badge.

### 3.2. Gestor de Notas Avanzado (`notes-manager`)

- **ID:** `simple-notes`
- **Versión:** 1.2.1
- **Autor:** Atlas Plugin Developer
- **Descripción:** Permite crear, gestionar y organizar notas personales con formato de texto enriquecido, con una fuerte integración con los eventos del calendario de Atlas.
- **Funcionalidades Clave:**
  - Página dedicada para la gestión de notas, accesible desde la navegación principal.
  - Editor de texto enriquecido (utilizando `RichTextEditor` del Core) para formatear notas.
  - Visualizador de notas con formato (`RichTextViewer` del Core).
  - Vinculación de notas a eventos del calendario: crear notas desde eventos, ver notas asociadas en los detalles del evento, selector de eventos para vincular/desvincular.
  - Búsqueda inteligente en títulos, contenido y eventos vinculados.
  - Estadísticas básicas sobre las notas (total, con formato, vinculadas, creadas hoy).
- **Integración con Atlas:**
  - Añade un ítem a `MAIN_NAVIGATION`.
  - Registra una página en `PLUGIN_PAGES`.
  - Extiende `EVENT_DETAIL_VIEW` para mostrar notas vinculadas a eventos.
  - (Potencialmente) Extiende el menú contextual de eventos del calendario.
  - Utiliza `coreAPI.storage`, `coreAPI.ui.components`, y `coreAPI.dialogs`.
  - Se suscribe a eventos del calendario para mantener la coherencia de las vinculaciones.
- **API Pública:** Expone métodos para CRUD de notas, gestión de vinculaciones, búsqueda y obtención de estadísticas.

### 3.3. Planificador de Videos (`video-scheduler`)

- **ID:** `video-scheduler`
- **Versión:** 0.8.4
- **Autor:** Atlas Plugin Developer
- **Descripción:** Herramienta especializada para la planificación visual y gestión del ciclo de producción de contenido de video, incluyendo seguimiento de ingresos.
- **Funcionalidades Clave:**
  - Página dedicada con un calendario mensual específico para slots de video (7am, 15pm, 22pm).
  - Sistema de estados detallado para videos (Pendiente, Desarrollo, Producción, Publicado) con sub-estados (Grabando, Editando, etc.) y marcadores apilables (Duda, Alerta), visualizados con emojis.
  - Edición inline de nombre y descripción breve del video.
  - Formulario de detalles extendidos para cada video.
  - Gestión de ingresos diarios por video/día, con selección de moneda y estado de pago.
  - Configuración de moneda principal y tasas de cambio para otras divisas de ingreso.
  - Funcionalidad para añadir videos en lote con patrones de frecuencia.
  - Panel de estadísticas avanzado para producción de videos e ingresos.
  - Importación y exportación de todos los datos del plugin, y opciones de reseteo.
- **Integración con Atlas:**
  - Añade un ítem a `MAIN_NAVIGATION`.
  - Registra una página en `PLUGIN_PAGES`.
  - Añade un widget al `SETTINGS_PANEL` para la configuración de moneda.
  - Utiliza `coreAPI.storage` y `coreAPI.dialogs`.
- **API Pública:** Expone una API completa para gestionar videos, ingresos, configuraciones de moneda y datos del plugin.

## 4. Guía Detallada para Desarrollar Nuevos Plugins

Para obtener una guía exhaustiva sobre cómo desarrollar, empaquetar y distribuir plugins para Atlas, incluyendo la estructura de un plugin, cómo usar la API del Core, mejores prácticas, y ejemplos de código, por favor consulta el siguiente documento:

➡️ **[Guía para Desarrollar Plugins en Atlas (`guia-plugin-atlas.md`)](guia-plugin-atlas.md)**

Este documento cubre:

- Estructura básica y metadatos de un plugin.
- Ciclo de vida (`init`, `cleanup`).
- Uso detallado de la `coreAPI`:
  - Almacenamiento persistente (`coreAPI.storage`).
  - Sistema de eventos (`coreAPI.events`).
  - Extensiones de UI (`coreAPI.ui`), incluyendo el patrón Wrapper y las zonas de extensión.
  - Diálogos personalizados (`coreAPI.dialogs`).
  - Comunicación entre plugins (`coreAPI.plugins`).
  - Acceso a módulos del Core (como el módulo de calendario).
- Sistema de permisos y seguridad.
- Creación de interfaces de usuario con `React.createElement`.
- Estilos, temas y uso de variables CSS de Atlas.
- Manejo de dependencias y conflictos.
- Empaquetado, distribución y actualizaciones.
- Mejores prácticas, manejo de errores, optimización y depuración.
- Ejemplos prácticos de plugins.

## 5. Seguridad de Plugins

Atlas implementa un sistema de seguridad multinivel para proteger al usuario y a la aplicación al ejecutar código de plugins. Este sistema incluye:

- **Declaración de Permisos:** Los plugins deben listar los permisos que requieren (ej. `storage`, `network`, `ui`) en sus metadatos.
- **Sandbox de Ejecución (`plugin-sandbox.js`):** El código de los plugins (especialmente sus métodos `init` y `cleanup`, y potencialmente otros callbacks) se ejecuta en un entorno más controlado para mitigar riesgos. Incluye:
  - Análisis estático básico para detectar patrones de código potencialmente peligrosos.
  - Límites de tiempo de ejecución para prevenir bloqueos.
  - (Futuro/Planeado) Intercepción de manipulación del DOM y protección de objetos globales.
- **Monitoreo de Recursos (`plugin-resource-monitor.js`):** Se monitorea el uso de recursos como CPU, memoria y número de operaciones. Exceder los límites puede llevar a restricciones o a la desactivación del plugin.
- **Auditoría de Seguridad (`plugin-security-audit.js`):** Las acciones relevantes para la seguridad (solicitud de permisos, operaciones de alto riesgo, errores de plugin) son registradas.
- **Niveles de Seguridad (LOW, NORMAL, HIGH):** El administrador de Atlas puede configurar el nivel de seguridad general, lo que afecta qué permisos se aprueban automáticamente, los límites de recursos y el rigor de las verificaciones.
- **Gestor de Permisos (`plugin-permission-checker.js`):** Valida los permisos solicitados por los plugins y gestiona su estado (aprobado, pendiente, denegado).
- **Panel de Seguridad:** La sección de "Seguridad" en la configuración de Atlas (`src/components/settings/security-panel.jsx`) proporciona herramientas para:
  - Visualizar el estado general de seguridad.
  - Gestionar los permisos de los plugins instalados (ver `PermissionsManager`).
  - Revisar un dashboard de amenazas detectadas (`ThreatsDashboard`).
  - Consultar los logs de auditoría (`AuditDashboard`).

Los desarrolladores de plugins deben ser conscientes de estas medidas y diseñar sus plugins para operar de manera segura y eficiente dentro de este marco.

## 6. Empaquetado, Distribución y Actualizaciones

Atlas cuenta con un sistema integrado para la gestión del ciclo de vida de los plugins, desde su descubrimiento hasta su actualización o desinstalación.

- **Empaquetado:** Aunque no hay un formato de empaquetado formalmente impuesto para el desarrollo local (los plugins se cargan desde sus directorios), el sistema está diseñado para soportar un formato de "paquete de plugin" para distribución. El `plugin-package-manager.js` está preparado para manejar la instalación desde dichos paquetes.
- **Repositorios de Plugins (`plugin-repository-manager.js`):**
  - Atlas puede conectarse a múltiples repositorios de plugins.
  - Existe un repositorio oficial (`atlas-official`) y se pueden añadir repositorios de la comunidad o privados.
  - Los repositorios se pueden habilitar/deshabilitar y sincronizar para obtener la lista más reciente de plugins disponibles.
  - La gestión se realiza a través del componente `RepositoryManager` en la configuración.
- **Marketplace de Plugins (`PluginMarketplace.jsx`):**
  - Interfaz de usuario dentro de la configuración de Atlas que permite a los usuarios buscar, ver detalles, instalar y desinstalar plugins de los repositorios configurados.
  - Muestra información como nombre, descripción, autor, versión, compatibilidad, y estado de instalación.
- **Instalación y Desinstalación (`plugin-package-manager.js`):**
  - Maneja el proceso de instalación (simulado como extracción de archivos en la v0.3.0) y desinstalación de plugins.
  - Verifica la integridad y compatibilidad del plugin antes de la instalación.
- **Actualizaciones (`plugin-update-manager.js`):**
  - Puede verificar automáticamente (configurable) si hay actualizaciones disponibles para los plugins instalados.
  - Notifica al usuario sobre las actualizaciones y permite aplicarlas.
  - Mantiene un historial de actualizaciones.
  - La gestión se realiza a través del componente `UpdateManager` en la configuración.
- **Verificación de Integridad (`plugin-integrity-checker.js`):**
  - Calcula y verifica checksums de los archivos del plugin.
  - (Futuro) Podría soportar firmas digitales para autenticidad.

Este sistema busca proporcionar una experiencia fluida y segura para que los usuarios expandan las capacidades de Atlas con plugins de diversas fuentes.

---

Esta documentación proporciona una visión general del ecosistema de plugins de Atlas v0.3.0. Para obtener la guía más detallada y actualizada sobre el desarrollo de plugins, incluyendo ejemplos de código paso a paso y mejores prácticas, consulta el archivo [`guia-plugin-atlas.md`](guia-plugin-atlas.md).
