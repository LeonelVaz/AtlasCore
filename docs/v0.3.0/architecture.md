# Arquitectura del Sistema Atlas

## 1. Introducción

Atlas está diseñado como una aplicación de escritorio modular y extensible, con un fuerte enfoque en una arquitectura basada en eventos y un sistema de plugins robusto. Esta documentación detalla los componentes clave de su arquitectura, los patrones de diseño implementados y cómo interactúan las diferentes partes del sistema.

## 2. Estructura Modular y Patrones de Diseño

Atlas adopta una estructura modular para promover la cohesión, el bajo acoplamiento y la mantenibilidad. Los principales patrones y conceptos arquitectónicos utilizados son:

- **Arquitectura Basada en Eventos (Event-Driven Architecture - EDA):** El `EventBus` (`src/core/bus/event-bus.js`) es central para la comunicación desacoplada entre diferentes módulos y componentes. Los componentes publican eventos y otros se suscriben a ellos, permitiendo interacciones sin dependencias directas.
- **Inyección de Dependencias (Implícita):** Aunque no se utiliza un framework de DI formal, el `coreAPI` (`src/core/plugins/core-api.js`) se inyecta en los plugins durante su inicialización, proporcionándoles acceso controlado a las funcionalidades del núcleo. De manera similar, los contextos de React (Tema, Escala de Tiempo, Diálogos) proveen servicios a los componentes de UI.
- **Patrón Módulo:** Diferentes funcionalidades del núcleo están encapsuladas en módulos (ej. `calendar-module.js`, `plugin-manager.js`). El `ModuleRegistry` (`src/core/modules/module-registry.js`) permite un acceso centralizado a estos módulos, aunque su uso parece estar evolucionando, con `coreAPI.getModule()` siendo un punto de acceso clave.
- **Patrón Fachada (Facade):** El `coreAPI` actúa como una fachada para los plugins, simplificando la interacción con los subsistemas del núcleo (eventos, almacenamiento, UI, etc.).
- **Arquitectura de Microkernel (Plugins):** El núcleo de Atlas proporciona funcionalidades básicas y un sistema de gestión de plugins (`src/core/plugins/`), permitiendo que la funcionalidad principal sea extendida por componentes de terceros (plugins).
- **Separación de Intereses (SoC):**
  - **Core Logic (`src/core/`):** Lógica de negocio central, sistema de plugins, bus de eventos.
  - **UI Components (`src/components/`):** Componentes React reutilizables y específicos de la aplicación.
  - **Services (`src/services/`):** Lógica de servicios encapsulada (almacenamiento, temas, escala de tiempo).
  - **Contexts (`src/contexts/`):** Gestión de estado global y propagación de datos para la UI.
  - **Electron-specific code (`electron/`):** Lógica para la versión de escritorio.

## 3. Sistema de Bus de Eventos

- **Ubicación:** `src/core/bus/event-bus.js` (implementación) y `src/core/bus/events.js` (definiciones).
- **Funcionalidad:** Proporciona un mecanismo de publicador/suscriptor para la comunicación entre componentes sin acoplamiento directo.
- **Categorías de Eventos:** Los eventos están organizados en categorías (Calendar, App, Storage, UI) para una mejor organización y filtrado potencial.
- **Publicación:** Los componentes pueden publicar eventos con datos asociados. El `EventBus` notifica a todos los suscriptores de ese tipo de evento.
- **Suscripción:** Los componentes se suscriben a tipos de eventos específicos y proporcionan una función de callback para manejar el evento. Las suscripciones devuelven una función para cancelar la suscripción, crucial para la limpieza de componentes y evitar fugas de memoria.
- **Uso por Plugins:** El `coreAPI` expone métodos para que los plugins puedan suscribirse y publicar eventos, facilitando la comunicación con el núcleo y con otros plugins.
- **Depuración:** El `EventBus` incluye un modo de depuración (`setDebugMode`) que registra la publicación y notificación de eventos, facilitando el seguimiento del flujo de eventos.

## 4. Registro de Módulos e Interoperabilidad

- **Ubicación:** `src/core/modules/module-registry.js` y `src/core/modules/calendar-module.js`.
- **Funcionalidad:**
  - El `module-registry.js` proporciona funciones básicas (`registerModule`, `getModule`, `isModuleRegistered`, `unregisterModule`) para gestionar un registro global de módulos accesibles a través de `window.__appModules`.
  - El `calendar-module.js` es un ejemplo de un módulo que se registra y expone una API para interactuar con la lógica del calendario. Se inicializa con un `calendarService` (inyectado desde `CalendarMain.jsx`) y mantiene su propio estado sincronizado con los eventos del calendario.
  - El `coreAPI.getModule(moduleId)` es el método preferido para que los plugins accedan a los módulos del núcleo, como el módulo de calendario.
- **Interoperabilidad:**
  - Los módulos exponen una API pública.
  - Los plugins pueden acceder a estos módulos a través del `coreAPI`.
  - El `EventBus` también juega un papel crucial en la interoperabilidad, permitiendo que los módulos y plugins reaccionen a eventos del sistema o de otros componentes.

## 5. Arquitectura de Plugins y Extensibilidad

Esta es una de las áreas más complejas y centrales de Atlas.

- **Ubicación Principal:** `src/core/plugins/` (lógica del sistema de plugins) y `src/components/plugin-extension/` (componentes de UI para renderizar extensiones).
- **Componentes Clave del Sistema de Plugins:**
  - **`plugin-manager.js`:** Orquestador principal. Maneja la carga, inicialización, activación, desactivación y recarga de plugins. Interactúa con casi todos los demás submódulos de plugins.
  - **`plugin-loader.js`:** Responsable de descubrir y cargar dinámicamente los archivos de los plugins (usando `import.meta.glob` para Vite y un fallback para Webpack).
  - **`plugin-registry.js`:** Mantiene un registro de todos los plugins conocidos, su estado (activo/inactivo) y sus metadatos.
  - **`core-api.js`:** Fachada que se inyecta a los plugins, dándoles acceso controlado a eventos, almacenamiento, UI, diálogos, módulos, etc.
  - **`plugin-validator.js`:** Valida la estructura y metadatos de un plugin.
  - **`plugin-compatibility.js`:** Verifica la compatibilidad de un plugin con la versión actual de Atlas y con otros plugins (dependencias, conflictos).
  - **`plugin-dependency-resolver.js`:** Analiza las dependencias entre plugins, detecta ciclos y calcula un orden de carga óptimo.
  - **`ui-extension-manager.js`:** Gestiona los puntos de extensión de la UI. Los plugins registran componentes React en zonas específicas, y el `ExtensionPoint` los renderiza.
    - **`ExtensionPoint.jsx` (`src/components/plugin-extension/`):** Componente React que se usa en la UI de Atlas para renderizar las extensiones registradas para una `zoneId` específica.
  - **`plugin-events.js`:** Sub-sistema de eventos específico para plugins, gestionando el prefijo `plugin.` y aislando los eventos de plugins.
  - **`plugin-storage.js`:** Proporciona almacenamiento persistente aislado por plugin, con límites de tamaño.
  - **`plugin-api-registry.js`:** Permite a los plugins exponer sus propias APIs públicas a otros plugins.
  - **`plugin-communication.js`:** Facilita la llamada a métodos de otros plugins y la creación de canales de comunicación.
  - **Sistema de Seguridad para Plugins:**
    - **`plugin-security-manager.js`:** Orquestador de la seguridad.
    - **`plugin-sandbox.js`:** Ejecuta código de plugin en un entorno más controlado.
    - **`plugin-resource-monitor.js`:** Monitorea el uso de recursos (CPU, memoria).
    - **`plugin-permission-checker.js`:** Valida y gestiona los permisos declarados por los plugins.
    - **`plugin-security-audit.js`:** Registra eventos de seguridad.
  - **Sistema de Distribución y Actualizaciones:**
    - **`plugin-package-manager.js`:** Maneja la instalación y desinstalación de paquetes de plugins.
    - **`plugin-repository-manager.js`:** Gestiona las fuentes (repositorios) desde donde se pueden obtener plugins.
    - **`plugin-update-manager.js`:** Verifica y aplica actualizaciones para los plugins instalados.
    - **`plugin-integrity-checker.js`:** Verifica la integridad de los paquetes de plugins (checksums, firmas).
- **Flujo de Carga y Activación de un Plugin:**
  1.  `plugin-loader.js` descubre los plugins (ej. de la carpeta `/plugins`).
  2.  `plugin-manager.js` recibe la lista de plugins.
  3.  Cada plugin se registra en `plugin-registry.js`.
  4.  Se verifica la compatibilidad (`plugin-compatibility.js`).
  5.  Si un plugin está marcado para activarse (o se activa manualmente):
      - Se resuelven y activan sus dependencias (`plugin-dependency-resolver.js`, `plugin-manager.js`).
      - Se validan sus permisos (`plugin-permission-checker.js`).
      - Se ejecuta su código de `init()` dentro de un sandbox (`plugin-sandbox.js`), inyectándole el `coreAPI`.
      - El plugin puede usar el `coreAPI` para registrar extensiones de UI, suscribirse a eventos, etc.
- **Puntos de Extensión UI:** Definidos en `PLUGIN_CONSTANTS.UI_EXTENSION_ZONES` (`src/core/config/constants.js`). Los componentes de Atlas (ej. `Sidebar.jsx`, `SettingsPanel.jsx`, `CalendarMain.jsx`, `EventForm.jsx`) usan `ExtensionPoint.jsx` para renderizar los componentes que los plugins registren en estas zonas.

## 6. Flujo de Datos y Estados de la Aplicación

- **Estado del Calendario:** Gestionado principalmente por el hook `useCalendarEvents` (`src/hooks/use-calendar-events.jsx`), que interactúa con `storageService` para persistencia y publica eventos en el `EventBus` sobre cambios. El `calendar-module.js` también mantiene una copia sincronizada de este estado para la API de plugins.
- **Estado de Configuración Global:**
  - **Tema:** Gestionado por `ThemeContext` (`src/contexts/theme-context.jsx`) y `theme-service.js`.
  - **Escala de Tiempo:** Gestionado por `TimeScaleContext` (`src/contexts/time-scale-context.jsx`) y `time-scale-service.js`.
  - **Diálogos:** Gestionado por `DialogContext` (`src/contexts/dialog-context.jsx`) y `dialog-interceptor.js`.
  - Otras configuraciones se guardan mediante `storageService` usando claves de `STORAGE_KEYS`.
- **Estado de Plugins:**
  - `plugin-registry.js` mantiene el estado de activación y registro de plugins.
  - `plugin-storage.js` permite a cada plugin tener su propio almacenamiento persistente.
  - El estado interno de los componentes de UI de los plugins es manejado por React (useState, useEffect).
- **Flujo de Datos para Plugins:**
  1.  Plugin se inicializa y recibe `coreAPI`.
  2.  Plugin usa `coreAPI.storage` para cargar/guardar sus datos.
  3.  Plugin usa `coreAPI.events.subscribe` para escuchar eventos del núcleo u otros plugins.
  4.  Plugin usa `coreAPI.ui.registerExtension` para añadir componentes a la UI.
  5.  Plugin usa `coreAPI.plugins.registerAPI` para exponer su propia funcionalidad.
  6.  Plugin usa `coreAPI.plugins.getPluginAPI` o canales para comunicarse con otros plugins.

## 7. Decisiones Arquitectónicas y Justificaciones

- **Uso de `React.createElement` en plugins:** La `guia-plugin-atlas.md` y los ejemplos de plugins (`event-counter`, `notes-manager`, `video-scheduler`) usan `React.createElement` directamente en lugar de JSX para los componentes de UI de los plugins.
  - **Justificación (probable):** Esto podría ser para evitar la necesidad de un paso de transpilación de JSX específico para los plugins, simplificando el desarrollo de plugins si se cargan dinámicamente como archivos JS puros. También podría ser una forma de asegurar un control más granular sobre la creación de elementos en un entorno de plugins. Sin embargo, la aplicación principal sí usa JSX y Babel.
- **Sistema de Plugins Complejo:** La creación de un sistema de plugins tan detallado (seguridad, dependencias, UI extensible, comunicación, etc.) indica una fuerte apuesta por la extensibilidad como característica central, aunque añade complejidad al núcleo.
- **`coreAPI` como Fachada Central:** Simplifica la interacción para los desarrolladores de plugins, pero también centraliza la lógica de acceso.
- **Electron para Escritorio:** La carpeta `electron/` (`main.js`, `preload.js`, `window-manager.js`) y las configuraciones en `package.json` y `vite.config.js` indican que Atlas está diseñado para ser una aplicación de escritorio, aunque la base de React y Vite permite también ejecución web. `window-controls.jsx` y `electron-detector.js` refuerzan esto.
- **Contextos de React para Configuración Global de UI:** Un patrón estándar y eficiente para gestionar temas y otras configuraciones que afectan a toda la interfaz de usuario.

## 8. Diagramas de Arquitectura (Descripción Textual)

- **Diagrama de Componentes Principales:**
  - **App Core:**
    - EventBus
    - ModuleRegistry (CalendarModule)
    - PluginManager (con todos sus submódulos: Registry, Loader, API, Security, etc.)
    - Services (Storage, Theme, TimeScale)
    - CoreAPI (Fachada)
  - **UI Layer (React):**
    - App (Raíz)
    - ContextProviders (Config, Dialog)
    - Main UI Components (Sidebar, CalendarMain, SettingsPanel)
    - Plugin Extension Points (ExtensionPoint, NavigationExtensions, etc.)
  - **Electron Shell (si aplica):**
    - Main Process (`electron/main.js`)
    - Preload Script (`electron/preload.js`)
    - WindowControls
  - **Plugins (externos al Core, pero interactúan con él):**
    - Plugin A (event-counter)
    - Plugin B (notes-manager)
    - Plugin C (video-scheduler)
  - **Interacciones:**
    - Plugins ↔ CoreAPI ↔ App Core
    - UI Layer ↔ Contexts ↔ Services
    - UI Layer ↔ EventBus ↔ App Core / Plugins
    - UI Layer (WindowControls) ↔ Electron Main Process (via IPC)
- **Diagrama de Flujo de Activación de Plugin (Simplificado):**
  1.  `PluginManager.initialize()` o `PluginManager.activatePlugin()`.
  2.  `PluginLoader` carga el código del plugin.
  3.  `PluginRegistry` registra el plugin.
  4.  `PluginCompatibility` y `PluginDependencyResolver` verifican el plugin.
  5.  `PluginSecurityManager` valida permisos y código (si está activado).
  6.  `PluginSandbox` prepara el entorno.
  7.  Se llama a `plugin.init(coreAPI)`.
  8.  Plugin usa `coreAPI` para interactuar (registrar UI, suscribir eventos, etc.).
  9.  `PluginManager` actualiza el estado y publica evento `pluginActivated`.

## 9. Servicios Core y su Interacción

- **`storageService.js`:**
  - Abstracción sobre `localStorage` (web) y `electron-store` (Electron).
  - Utilizado por `useCalendarEvents` para persistir eventos del calendario.
  - Utilizado por `plugin-storage.js` para el almacenamiento de datos de plugins.
  - Utilizado por `theme-service.js` y `time-scale-service.js` para persistir preferencias del usuario.
  - Utilizado por el `plugin-manager` y sus submódulos para guardar estados de plugins, configuraciones de seguridad, etc.
- **`theme-service.js`:**
  - Gestiona la carga, aplicación y cambio de temas visuales.
  - Interactúa con `storageService` para persistir el tema seleccionado.
  - Modifica clases en el elemento `<html>` para aplicar estilos.
  - Utilizado por `ThemeContext`.
- **`time-scale-service.js`:**
  - Gestiona la configuración de la escala de tiempo del calendario.
  - Interactúa con `storageService` para persistir la escala seleccionada.
  - Utilizado por `TimeScaleContext`.
- **`eventBus.js` (ya detallado):** Utilizado por casi todos los componentes del núcleo y expuesto a plugins para comunicación.

## 10. Estructura de Directorios (Explicación Técnica)

- `AtlasCore/`
  - `.eslintrc.js`, `babel.config.js`, `jest.config.js`, `package.json`, `vite.config.js`: Configuración del proyecto, linting, transpiling, testing y dependencias.
  - `CHANGELOG.md`, `README.md`: Documentación general.
  - `docs/`: Documentación detallada del desarrollo y guías.
  - `electron/`:
    - `main.js`: Proceso principal de Electron, creación de ventana, IPC.
    - `preload.js`: Script que se ejecuta antes de cargar la página web en el renderer, expone APIs de Electron de forma segura (`contextBridge`). Intercepta diálogos nativos.
    - `window-manager.js`: Clase para gestionar la ventana principal (parece ser una abstracción que podría o no estar completamente integrada con `main.js` directamente, o una versión anterior).
  - `index.html`: Punto de entrada HTML para la aplicación Vite.
  - `plugins/`: Directorio donde residen los plugins de la aplicación. Cada subdirectorio es un plugin.
    - `event-counter/`, `notes-manager/`, `video-scheduler/`: Ejemplos de plugins, cada uno con su `index.js`, componentes, estilos y, a veces, utilidades.
  - `src/`: Código fuente principal de la aplicación Atlas.
    - `app.jsx`: Componente React raíz que estructura la aplicación (header, sidebar, contenido principal). Inicializa el `PluginManager` y `DialogInterceptor`.
    - `index.jsx`: Punto de entrada de React que renderiza `App`.
    - `components/`:
      - `calendar/`: Componentes UI específicos del calendario (`CalendarMain`, `WeekView`, `DayView`, `EventItem`, `EventForm`, etc.).
      - `debug/`: Componentes para depuración (`EventDebugger`).
      - `plugin-extension/`: Componentes React que facilitan la extensibilidad de la UI por plugins (`ExtensionPoint`, `NavigationExtensions`, `PluginPages`, `SettingsExtensions`, `SidebarExtensions`).
      - `security/`: Componentes UI para el panel de seguridad (`AuditDashboard`, `PermissionsManager`, `ThreatsDashboard`).
      - `settings/`: Componentes UI para el panel de configuración general de Atlas y sus subsecciones (`SettingsPanel`, `ThemeConfig`, `PluginsPanel`, etc.).
      - `ui/`: Componentes UI reutilizables y genéricos (`Button`, `Dialog`, `Sidebar`, `RichTextEditor`, `WindowControls`).
    - `config/`:
      - `plugin-config.js`: Script que se carga para permitir el registro de plugins en tiempo de ejecución (`window.registerPlugin`).
    - `contexts/`: Contextos de React para gestión de estado global y compartición de datos (`ConfigProvider`, `DialogContext`, `ThemeContext`, `TimeScaleContext`).
    - `core/`: Lógica central y no visual de Atlas.
      - `bus/`: Implementación del `EventBus` y definiciones de eventos.
      - `config/`: Constantes globales de la aplicación (`constants.js`).
      - `modules/`: Sistema de registro de módulos y módulos específicos del núcleo (ej. `calendar-module.js`).
      - `plugins/`: **Corazón del sistema de extensibilidad.** Contiene toda la lógica para cargar, gestionar, asegurar y comunicar plugins.
    - `hooks/`: Hooks personalizados de React para encapsular lógica reutilizable de componentes (ej. `useCalendarEvents`, `useTheme`).
    - `services/`: Servicios de bajo nivel que abstraen funcionalidades (ej. `storageService`, `themeService`).
    - `styles/`: Hojas de estilo CSS, organizadas por componente o funcionalidad, incluyendo temas.
    - `utils/`: Funciones de utilidad genéricas (ej. `date-utils`, `electron-detector`).
  - `test/`: (Ignorado en el análisis inicial, pero contendría pruebas unitarias y de integración).

Esta estructura refleja una aplicación bien organizada con una clara separación de responsabilidades, preparándola para la escalabilidad y la contribución de múltiples desarrolladores.
