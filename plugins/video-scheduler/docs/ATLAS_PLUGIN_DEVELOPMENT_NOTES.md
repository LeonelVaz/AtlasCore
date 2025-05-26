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

## Etapa 1: Estructura de Datos Básica y Creación/Visualización de Videos (En Memoria)

### Objetivos Cumplidos:
1.  Definida una estructura de datos inicial para "Videos" (`DEFAULT_VIDEO_STRUCTURE`).
2.  Implementado el almacenamiento de videos en un array en memoria (`this._videos`) dentro de la instancia del plugin.
3.  Creados métodos internos `_internalCreateVideo` y `_internalGetAllVideos`.
4.  La `VideoSchedulerMainPage.jsx` ahora muestra una lista de videos y permite añadir nuevos (que se reflejan en la UI).
5.  Funciones `createVideo` y `getAllVideos` expuestas a través de `publicAPI`.

### Descubrimientos y Patrones Clave:

#### 1. Estructura de Datos y Constantes
*   Es útil definir estructuras de datos por defecto (ej. `DEFAULT_VIDEO_STRUCTURE`) y constantes (ej. `VIDEO_STATUS`) en un archivo separado (ej. `utils/constants.js`) para mantener la organización y consistencia.
    ```javascript
    // utils/constants.js
    export const DEFAULT_VIDEO_STRUCTURE = { /* ... */ };
    export const VIDEO_STATUS = { /* ... */ };
    ```

#### 2. Gestión de Estado en Componentes React (para listas)
*   Para mostrar datos dinámicos (como una lista de videos) en un componente React, se utiliza `React.useState` para mantener el estado de los datos que se van a renderizar.
    ```javascript
    // En VideoSchedulerMainPage.jsx
    const [videos, setVideos] = React.useState([]);
    ```
*   Se usa `React.useEffect` para cargar los datos iniciales cuando el componente se monta y/o cuando las dependencias relevantes (como la instancia del plugin) cambian.
    ```javascript
    // En VideoSchedulerMainPage.jsx
    React.useEffect(() => {
      refreshVideos(); // Función que llama a plugin.publicAPI.getAllVideos() y actualiza el estado 'videos'
    }, [plugin]); // Dependencia
    ```
*   Después de acciones que modifican los datos (ej. crear un video), se debe llamar a la función que refresca los datos para actualizar la UI.

#### 3. API Pública del Plugin para Interacción con UI
*   El objeto `publicAPI` del plugin expone funciones que los componentes de UI (pasados a través de `props.plugin`) pueden llamar para interactuar con la lógica de negocio y los datos del plugin.
    ```javascript
    // En index.js
    _createPublicAPI: function(pluginInstance) {
      return {
        getAllVideos: () => pluginInstance._internalGetAllVideos(),
        createVideo: (videoData) => pluginInstance._internalCreateVideo(videoData),
      };
    }

    // En VideoSchedulerMainPage.jsx
    // plugin.publicAPI.createVideo(newVideoData);
    // const currentVideos = plugin.publicAPI.getAllVideos();
    ```

#### 4. Métodos Internos del Plugin
*   La lógica principal de manipulación de datos reside en métodos internos del plugin (prefijados con `_internal` por convención). Estos métodos son los que realmente modifican el estado interno del plugin (ej. `this._videos`).
    ```javascript
    // En index.js
    _internalCreateVideo: function(videoData) {
      // ... lógica para crear y añadir el video a this._videos ...
      // En etapas futuras, esto también interactuará con core.storage
    }
    ```
*   Es una buena práctica que los métodos internos devuelvan una copia de los datos (ej. `[...this._videos]`) cuando se leen, para evitar la mutación directa del estado interno del plugin desde el exterior.

#### 5. Flujo de Datos
*   **Acción del Usuario (UI):** Ej. Clic en "Añadir Video" en `VideoSchedulerMainPage.jsx`.
*   **Llamada a API Pública (UI -> Plugin):** `props.plugin.publicAPI.createVideo(...)`.
*   **Ejecución de Lógica Interna (Plugin):** `publicAPI.createVideo` llama a `this._internalCreateVideo(...)`, que actualiza `this._videos`.
*   **Refresco de Datos (UI):** El componente llama a `refreshVideos()`, que a su vez llama a `props.plugin.publicAPI.getAllVideos()` para obtener la lista actualizada.
*   **Actualización de Estado (UI):** `setVideos(...)` actualiza el estado del componente, causando un nuevo renderizado con los datos más recientes.

### Estructura de Archivos Actualizada (Etapa 1):

```
video-scheduler/
├── components/
│   ├── VideoSchedulerNavItem.jsx
│   └── VideoSchedulerMainPage.jsx
├── utils/
│   └── constants.js  <-- NUEVO
└── index.js
```

## Etapa 2: Persistencia de Videos con `core.storage`

### Objetivos Cumplidos:
1.  La lista de videos ahora se carga desde `core.storage` cuando el plugin se inicializa.
2.  Los videos creados se guardan en `core.storage` después de su creación.
3.  Los videos persisten correctamente después de recargar la aplicación Atlas.

### Descubrimientos y Patrones Clave:

#### 1. Uso de `core.storage`
*   **Clave de Almacenamiento:** Es recomendable definir una constante para la clave que se usará en `core.storage` (ej. `const STORAGE_KEY_VIDEOS = 'videos_data';`).
*   **Carga de Datos en `init`:**
    *   El método `init` del plugin ahora es `async` (o devuelve una `Promise`) para acomodar la carga asíncrona de datos desde el almacenamiento.
    *   Se utiliza `await self._core.storage.getItem(pluginId, STORAGE_KEY, defaultValue)` para recuperar los datos. Es importante proporcionar un `defaultValue` (ej. `[]`) en caso de que no haya nada guardado aún.
    ```javascript
    // En index.js, dentro de init o un método llamado por init
    async _loadVideosFromStorage() {
      const storedVideos = await this._core.storage.getItem(this.id, STORAGE_KEY_VIDEOS, []);
      this._videos = storedVideos || []; // this._videos es el array en memoria del plugin
    }
    ```
*   **Guardado de Datos:**
    *   Después de cualquier operación que modifique los datos que deben persistir (ej. crear, actualizar, eliminar un video), se llama a `await self._core.storage.setItem(pluginId, STORAGE_KEY, dataToSave)`.
    *   Los métodos que realizan estas operaciones (ej. `_internalCreateVideo`) ahora deben ser `async` para usar `await` al guardar.
    ```javascript
    // En index.js
    async _saveVideosToStorage() {
      await this._core.storage.setItem(this.id, STORAGE_KEY_VIDEOS, this._videos);
    }

    async _internalCreateVideo(videoData) {
      // ...lógica para crear newVideo y añadirlo a this._videos...
      await this._saveVideosToStorage(); // Guardar después de modificar
      return newVideo;
    }
    ```
*   **Limpieza (`cleanup`):** Es una buena práctica guardar los datos una última vez en `cleanup` como medida de seguridad, convirtiendo `cleanup` también en una función `async`.

#### 2. Manejo de Asincronía en Componentes UI
*   Si la función de la `publicAPI` que el componente UI llama ahora es `async` (ej. `plugin.publicAPI.createVideo`), el manejador de eventos en el componente UI también debe ser `async` y usar `await` para asegurar que la operación se complete antes de, por ejemplo, refrescar la lista de datos.
    ```javascript
    // En VideoSchedulerMainPage.jsx
    const handleAddVideo = async () => {
      // ...
      await plugin.publicAPI.createVideo(newVideoData);
      refreshVideos();
      // ...
    };
    ```

#### 3. Permiso `storage`
*   El plugin debe declarar el permiso `'storage'` en sus `permissions` dentro de `index.js` para poder usar `core.storage`.
    ```javascript
    // En index.js
    permissions: ['ui', 'storage'], 
    ```

### Observaciones de Funcionamiento:
*   Los logs confirman que los datos se cargan desde el storage al iniciar y se guardan tras la creación de videos.
*   Los videos añadidos persisten correctamente entre sesiones de la aplicación.

### Consideraciones Adicionales (Para el Futuro):
*   **Borrado de Datos:** Dado que Atlas (actualmente) no provee una forma de desinstalar/limpiar datos de un plugin, se podría añadir una función dentro del plugin (ej. en un panel de configuración) para permitir al usuario restablecer/borrar todos los datos almacenados por el plugin.

