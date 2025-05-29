# Estándares y Convenciones de Desarrollo de Atlas

Este documento establece los estándares, convenciones y mejores prácticas a seguir durante el desarrollo de la aplicación Atlas y sus plugins. El objetivo es mantener un código base consistente, legible, mantenible y de alta calidad.

## 1. Convenciones de Nomenclatura

### 1.1. Archivos

- **Componentes React (.jsx):** Usar `PascalCase.jsx`. Ej: `CalendarMain.jsx`, `SidebarItem.jsx`.
- **Archivos JavaScript (.js):** Usar `kebab-case.js` para módulos, servicios, utilidades y scripts de configuración. Ej: `event-bus.js`, `storage-service.js`, `plugin-loader.js`.
- **Archivos CSS (.css):** Usar `kebab-case.css` y nombrarlos de forma similar al componente o módulo que estilizan. Ej: `calendar-main.css`, `settings-panel.css`.
- **Archivos de Test (.test.js, .test.jsx):** `nombre-del-archivo.test.js` o `nombre-del-archivo.test.jsx`.
- **Directorios:** Usar `kebab-case` para nombres de directorios. Ej: `plugin-extension`, `event-counter`.

### 1.2. Variables

- **Variables y funciones locales:** Usar `camelCase`. Ej: `let eventCount = 0;`, `function handleSaveEvent() {}`.
- **Constantes:** Usar `UPPER_SNAKE_CASE`. Ej: `const MAX_EVENTS = 10;`, `const STORAGE_KEYS = {...}`.
  - Las constantes exportadas desde `src/core/config/constants.js` y `plugins/*/utils/constants.js` siguen esta convención.
- **Variables privadas de clase/objeto (simuladas):** Prefijar con guion bajo `_`. Ej: `this._core`, `_pluginData`. (Esta convención se observa en el código de plugins y módulos del core).
- **Componentes React (variables que los almacenan):** Usar `PascalCase`. Ej: `const MainCalendar = () => ...;`.

### 1.3. Funciones y Métodos

- **Funciones y métodos:** Usar `camelCase`. Ej: `function initializePluginSystem() {}`, `plugin.init()`.
- **Funciones constructoras o Clases:** Usar `PascalCase`. Ej: `class EventBus {}`, `new PluginManager()`.

### 1.4. Componentes React

- **Nombres de Componentes:** Usar `PascalCase`. Ej: `CalendarMain`, `SettingsPanel`.
- **Nombres de Props:** Usar `camelCase`. Ej: `currentDate`, `onEventClick`.
- **Nombres de Handlers de Eventos (props):** Prefijar con `on`. Ej: `onClick`, `onChange`, `onSave`.
- **Nombres de Handlers de Eventos (internos):** Prefijar con `handle`. Ej: `const handleSave = () => {...}`.

### 1.5. CSS

- **Selectores de Clase:** Usar `kebab-case`. Ej: `.calendar-container`, `.sidebar-item`.
- **Prefijos para Plugins:** Se recomienda prefijar las clases CSS específicas de un plugin con el ID del plugin o un nombre corto representativo para evitar colisiones. Ej: `event-counter-badge`, `notes-manager-card`.
  - Se observa un buen uso de clases anidadas en los CSS de los plugins (ej. en `event-counter.css`), lo cual ayuda al scoping.
- **Variables CSS:** Usar el prefijo `--` seguido de `kebab-case`. Ej: `--primary-color`, `--font-family-body`. Las variables globales de Atlas (ej. `--color-background`, `--spacing-md`) deben ser utilizadas preferentemente.

## 2. Estructura y Organización del Código

- **Modularidad:** Agrupar funcionalidades relacionadas en módulos o directorios cohesivos. (Ver `architecture.md` para la estructura de directorios).
- **Componentes Pequeños y Enfocados:** Preferir componentes pequeños con una única responsabilidad.
- **Separación de Lógica y Presentación:**
  - Utilizar hooks personalizados (`src/hooks/`) para encapsular lógica de estado y efectos complejos.
  - Los componentes deben centrarse en la presentación y la delegación de eventos.
- **Importaciones Claras:** Organizar las importaciones al principio del archivo, agrupándolas (ej. React, librerías de terceros, componentes locales, utilidades, estilos).
- **Exportaciones Explícitas:** Preferir exportaciones nombradas. Usar `export default` para el componente principal de un archivo `.jsx` o la exportación principal de un módulo `.js`.

## 3. Patrones de React Recomendados

- **Componentes Funcionales y Hooks:** Es el estándar en el proyecto.
- **`useState`:** Para estado local del componente.
- **`useEffect`:** Para efectos secundarios, suscripciones y limpieza. Siempre incluir un array de dependencias adecuado.
- **`useContext`:** Para acceder a estado global provisto por Context Providers (ej. `ThemeContext`, `DialogContext`).
- **`useCallback` y `useMemo`:** Utilizar para optimizar el rendimiento cuando sea necesario, especialmente al pasar callbacks o datos memoizados a componentes hijos.
- **`React.createElement` para Plugins:** Aunque la aplicación principal usa JSX, los componentes de UI dentro de los plugins (ejemplos proporcionados) usan `React.createElement` directamente. Este patrón debe seguirse para nuevos plugins si la intención es evitar un paso de transpilación para los mismos.
  - Si se decide usar JSX en plugins, se deberá asegurar que el `plugin-loader` o el proceso de empaquetado del plugin maneje la transpilación.
- **Props Drilling vs Context:** Para estados que necesitan muchos componentes anidados, considerar el uso de Context API en lugar de pasar props a través de múltiples niveles.
- **Prop Types:** Utilizar `PropTypes` para la validación de tipos de props en los componentes, como se observa en varios componentes UI.

## 4. Estándares de CSS y Styling

- **Variables CSS:** Utilizar las variables CSS definidas en `src/styles/variables.css` y las específicas de cada tema (`src/styles/themes/`) para colores, fuentes, espaciado, etc. Esto asegura la consistencia y la adaptabilidad a los temas.
- **CSS Anidado:** Se observa el uso de anidamiento CSS (nativo o similar a preprocesadores) en archivos como `EventCounterBadge.css` y `SettingsPanel.css` del plugin `event-counter`. Esta práctica es buena para mantener los estilos encapsulados bajo una clase raíz del componente/plugin.
  - Ejemplo (de `SettingsPanel.css`):
    ```css
    .event-counter-settings-panel {
      /* Estilos base */
      .settings-header {
        /* Estilo anidado */
      }
    }
    ```
- **Nomenclatura BEM (Bloque, Elemento, Modificador):** Aunque no se sigue estrictamente en todo el proyecto, es una buena práctica a considerar para componentes complejos para mejorar la claridad y evitar conflictos.
- **Archivos CSS por Componente/Módulo:** Organizar los estilos en archivos CSS separados por componente o módulo funcional, importándolos donde sean necesarios (ej. `calendar-main.css` para `CalendarMain.jsx`). `index.css` en cada subdirectorio de `styles` agrupa las importaciones.
- **Evitar Selectores Globales Excesivos:** Limitar el uso de selectores de etiqueta (`div`, `p`) en el ámbito global para prevenir efectos secundarios no deseados. Prefijar o anidar.
- **Comentarios:** Usar comentarios en CSS para explicar secciones complejas o decisiones de diseño.

## 5. Documentación en Código

- **Comentarios JSDoc/TSDoc (para JavaScript):**
  - Utilizar comentarios de bloque (`/** ... */`) para documentar funciones, clases, módulos y parámetros importantes.
  - Describir el propósito, los parámetros (`@param`), el valor de retorno (`@returns`), y cualquier efecto secundario o suposición.
  - Ejemplo (observado en `useCalendarEvents.jsx`):
    ```javascript
    /**
     * Hook para la gestión de eventos del calendario
     */
    function useCalendarEvents() {
      /* ... */
    }
    ```
- **Comentarios en línea:** Usar `//` para explicaciones breves de lógica compleja o decisiones no obvias.
- **Comentarios TODO/FIXME:** Utilizar `// TODO:` para tareas pendientes y `// FIXME:` para problemas conocidos que necesitan ser arreglados.
- **Comentarios en CSS:** Explicar la estructura del archivo CSS, agrupaciones de selectores o hacks/soluciones específicas.

## 6. Manejo de Errores y Logging

- **Bloques `try...catch`:** Utilizar para operaciones que puedan fallar (ej. interacciones con `localStorage`, parsing de JSON, llamadas a API de plugins).
- **Logging Consistente:**
  - Usar `console.log()` para información de depuración general o flujos normales.
  - Usar `console.warn()` para advertencias o situaciones no críticas que podrían indicar un problema.
  - Usar `console.error()` para errores.
  - Prefijar los logs con el nombre del módulo o plugin para facilitar la depuración, ej: `console.log("[PluginManager] Inicializando plugin:", pluginId);`. El `EventDebugger` y `plugins-info.md` muestran esta práctica.
- **Manejo de Errores en Plugins:** El `plugin-error-handler.js` centraliza el manejo de errores de plugins. Los plugins deben usar `coreAPI._handleError` (si está expuesto) o permitir que los errores se propaguen para ser capturados por el sistema.
- **Feedback al Usuario:** Para errores que afectan al usuario, usar el `DialogContext` (a través de `useDialog` o `coreAPI.dialogs`) para mostrar mensajes de error.

## 7. Testing Guidelines

- **Framework:** Jest es el framework de pruebas configurado (`jest.config.js`).
- **Ubicación de Pruebas:** Las pruebas unitarias parecen estar destinadas a la carpeta `test/unit/`.
- **Cobertura:** El objetivo de cobertura es >80% (como se indica en `stage-3-testing.md`).
- **Tipos de Pruebas:**
  - **Pruebas Unitarias:** Enfocarse en probar unidades aisladas de código (funciones, componentes individuales, módulos). Usar mocks para dependencias.
  - **Pruebas de Componentes (React):** Utilizar `@testing-library/react` para probar el renderizado de componentes, interacciones del usuario y cambios de estado.
- **Mocks:** Utilizar los mocks definidos en `test/mocks/` (ej. `styleMock.js`, `fileMock.js`) para recursos no JS.
- **Nomenclatura de Pruebas:** Usar `describe` para agrupar pruebas relacionadas y `it` o `test` para casos de prueba individuales con descripciones claras.
- **Asersiones:** Usar las aserciones de Jest (ej. `expect(...).toBe(...)`, `expect(...).toHaveBeenCalled()`).
- **`setupFilesAfterEnv`:** El archivo `test/setup/setupTests.js` se usa para configuración global de pruebas (ej. importar `@testing-library/jest-dom`).

## 8. Git Workflow y Convenciones de Commits

_(Dado que no tengo acceso al historial de Git, estas son recomendaciones basadas en buenas prácticas)._

- **Branches:**
  - `main` o `master`: Rama principal, debe reflejar el código estable y desplegable.
  - `develop`: Rama de integración para funcionalidades completadas.
  - Feature branches: Crear branches a partir de `develop` para cada nueva funcionalidad o bugfix (ej. `feature/nombre-funcionalidad`, `fix/descripcion-bug`).
- **Commits:**
  - **Mensajes Claros y Concisos:** Escribir mensajes de commit que describan el cambio de forma breve pero informativa.
  - **Formato Convencional (opcional pero recomendado):**

    ```
    type(scope): subject

    body (opcional)

    footer (opcional)
    ```

    - `type`: `feat` (nueva funcionalidad), `fix` (corrección de bug), `docs` (cambios en documentación), `style` (formato, sin cambios de código), `refactor`, `test`, `chore` (mantenimiento).
    - `scope`: Módulo o parte de la aplicación afectada (ej. `calendar`, `plugins`, `core-api`).
    - `subject`: Descripción imperativa y concisa del cambio.

  - **Atomic Commits:** Hacer commits pequeños y enfocados en un solo cambio lógico.
- **Pull Requests (PRs):**
  - Utilizar PRs para fusionar cambios de feature branches a `develop`.
  - Incluir una descripción clara de los cambios en el PR.
  - Requerir revisión de código por al menos otro miembro del equipo antes de fusionar.
  - Asegurar que todas las pruebas pasen antes de fusionar.

## 9. Linting y Formatting Rules

- **ESLint:** La configuración se encuentra en `.eslintrc.js`.
  - `extends`: `eslint:recommended`, `plugin:react/recommended`, `plugin:react-hooks/recommended`.
  - `rules`:
    - `react/react-in-jsx-scope`: "off" (No necesario con React 17+ y el nuevo JSX transform).
    - `react/prop-types`: "warn" (Se recomienda usar PropTypes para validación).
    - `no-unused-vars`: "warn".
    - `no-console`: ["warn", { allow: ["warn", "error"] }] (Permite `console.warn` y `console.error`).
  - `settings.react.version`: "detect".
- **Formatting:** Aunque no hay un formateador explícito (como Prettier) en las dependencias de desarrollo, se debe mantener un estilo de código consistente. La ejecución de `npm run lint:fix` aplicará correcciones automáticas basadas en ESLint.

## 10. Best Practices Específicas del Proyecto

- **Manejo de Estado de Plugins:** Cada plugin debe gestionar su propio estado interno. La comunicación con el core o con otros plugins se realiza mediante `coreAPI` y el `EventBus`.
- **Limpieza de Recursos en Plugins:** Es crucial que el método `cleanup` de cada plugin libere todos los recursos (suscripciones a eventos, extensiones UI, temporizadores) para evitar fugas de memoria y comportamientos inesperados al desactivar o recargar plugins.
- **Patrón Wrapper para Componentes de UI de Plugins:** Como se detalla en `guia-plugin-atlas.md`, los componentes de UI de los plugins que se registran en puntos de extensión deben ser envueltos (`_createComponentWrapper`) para inyectarles `plugin`, `core`, y `pluginId` como props.
- **Uso de Constantes:** Utilizar las constantes definidas en `src/core/config/constants.js` y en los archivos `constants.js` específicos de cada plugin para valores mágicos, claves de almacenamiento, nombres de eventos, etc.
- **Asincronía:** Usar `async/await` para manejar operaciones asíncronas (ej. interacciones con `storageService`, carga de datos).
- **Inmutabilidad:** Al modificar arrays u objetos del estado (especialmente en React o en datos expuestos por plugins), crear nuevas instancias en lugar de mutar las existentes para evitar efectos secundarios. (Ej. `[...self._tasks]` en la API pública de `task-manager`).
- **Seguridad de Plugins:** Seguir las directrices de la `guia-plugin-atlas.md` para desarrollar plugins seguros, declarando los permisos necesarios y utilizando el `coreAPI` de forma responsable.
- **Documentación de Plugins:** Cada plugin debe incluir un `README.md` explicando su funcionalidad, instalación y configuración.
