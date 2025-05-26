# Notas de Desarrollo para Plugins de Atlas (Enfoque: Video Scheduler)

Este documento registra observaciones, soluciones y patrones descubiertos durante el desarrollo de plugins para la plataforma Atlas, complementando la guía oficial `guia-plugin-atlas.md`.

## Etapa 0: Esqueleto Básico del Plugin y Navegación

### Objetivos Cumplidos:
1.  Plugin cargado y reconocido por Atlas.
2.  Ítem de navegación funcional en la `MAIN_NAVIGATION`.
3.  Página de plugin básica renderizada y accesible desde el ítem de navegación.

### Descubrimientos y Patrones Clave:

#### 1. Uso de React y Componentes
*   **Importación de React:** Es necesario importar React explícitamente en cada archivo que lo utilice (incluyendo el `index.js` principal si define componentes o los wrappers).
    ```javascript
    import React from 'react';
    ```
*   **Componentes en Archivos `.jsx`:** Es una buena práctica y está soportado definir componentes React en archivos `.jsx` separados (ej., dentro de una carpeta `components/`) e importarlos en el `index.js` del plugin.
    ```javascript
    // En index.js
    import MiComponenteNavItem from './components/MiComponenteNavItem.jsx';
    import MiComponentePage from './components/MiComponentePage.jsx';
    ```
*   **`React.createElement`:** Si no se utiliza un paso de transpilación JSX, los componentes deben usar `React.createElement` directamente.

#### 2. Registro de Extensiones de UI
*   **Patrón Wrapper para Inyección de Dependencias:** Para pasar la instancia del plugin (`self`) y la API de `core` a los componentes de UI registrados, se utiliza un patrón de "Wrapper". El componente Wrapper se registra con Atlas, y este Wrapper es el que luego renderiza el componente real pasándole las props adicionales.

    ```javascript
    // En index.js (dentro de init o un método llamado desde init)
    const self = this; // Instancia del plugin

    function NavigationWrapper(propsFromAtlas) {
      return React.createElement(MiComponenteNavItem, { // Componente real del plugin
        ...propsFromAtlas,    // Props que Atlas pasa (ej. onNavigate)
        plugin: self,         // Instancia del plugin
        core: self._core,     // API de Core
        pluginId: self.id     // ID del plugin
      });
    }

    self._navigationExtensionId = self._core.ui.registerExtension(
      self.id,
      self._core.ui.getExtensionZones().MAIN_NAVIGATION,
      NavigationWrapper, // Se registra el Wrapper
      { order: 150 }     // Opciones para la extensión
    );
    ```

#### 3. Registro de Páginas de Plugin (`PLUGIN_PAGES`) y Navegación
*   **`pageId` en `props`:** Al registrar una extensión en la zona `PLUGIN_PAGES`, el `pageId` que identificará a esta página para la navegación debe especificarse **dentro de un objeto `props`** en las opciones de `registerExtension`.

    ```javascript
    // En index.js (dentro de init o un método llamado desde init)
    const PLUGIN_INTERNAL_PAGE_ID = 'mipaginaid'; // ID consistente

    function PageWrapper(propsFromAtlas) {
      // propsFromAtlas incluirá { pageId: 'mipaginaid', ...otrasPropsDeAtlas }
      return React.createElement(MiComponentePage, {
        ...propsFromAtlas,
        plugin: self,
        core: self._core,
        pluginId: self.id
      });
    }

    self._pageExtensionId = self._core.ui.registerExtension(
      self.id,
      self._core.ui.getExtensionZones().PLUGIN_PAGES,
      PageWrapper,
      { // Opciones para la extensión
        order: 100,
        props: { // El pageId DEBE estar aquí
          pageId: PLUGIN_INTERNAL_PAGE_ID 
        }
      }
    );
    ```
*   **Navegación (`onNavigate`):** El componente registrado en `MAIN_NAVIGATION` (ej. `MiComponenteNavItem`) recibe una prop `onNavigate` de Atlas. Para navegar a la página del plugin, se llama así:

    ```javascript
    // Dentro de MiComponenteNavItem.jsx (o el componente de navegación)
    // Asumiendo que pageIdToNavigate (ej. 'mipaginaid') se pasó como prop
    props.onNavigate(props.pluginId, props.pageIdToNavigate); 
    ```
    Es crucial que el `pageId` usado en `onNavigate` coincida exactamente con el `pageId` especificado en `props` durante el registro de la página.
*   **Simplicidad del `pageId`:** Usar identificadores de página simples, en minúsculas y sin caracteres especiales (ej. `'mipaginaid'`, `'videoscheduler'`) parece ser más robusto.

#### 4. Metadatos del Plugin (`index.js`)
*   Es recomendable incluir `minAppVersion` y `maxAppVersion` para una mejor gestión de la compatibilidad, como lo sugiere el validador de plugins de Atlas.

#### 5. Limpieza (`cleanup`)
*   Es una buena práctica guardar los IDs de extensión devueltos por `this._core.ui.registerExtension` y usarlos para desregistrar explícitamente las extensiones en la función `cleanup` mediante `this._core.ui.removeExtension(pluginId, extensionId)`.
*   Alternativamente, `this._core.ui.removeAllExtensions(pluginId)` puede usarse para una limpieza más general si los IDs individuales no se guardaron o si se quiere asegurar que todo lo del plugin se remueva.

### Estructura de Archivos de la Etapa 0 (Ejemplo `video-scheduler`):

```
video-scheduler/
├── components/
│   ├── VideoSchedulerNavItem.jsx
│   └── VideoSchedulerMainPage.jsx
└── index.js
```

### Próximos Pasos (Hacia Etapa 1):
*   Definir la estructura de datos para los videos.
*   Implementar la lógica para crear y listar videos (inicialmente en memoria).
*   Mostrar la lista de videos en `VideoSchedulerMainPage.jsx`.
