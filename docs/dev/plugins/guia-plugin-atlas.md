# Guía para desarrollar plugins en Atlas

## Índice

1. [Introducción](#introducción)
2. [Primer Plugin Paso a Paso](#primer-plugin-paso-a-paso)
3. [Estructura básica de un plugin](#estructura-básica-de-un-plugin)
4. [Metadatos del plugin](#metadatos-del-plugin)
5. [Ciclo de vida del plugin](#ciclo-de-vida-del-plugin)
   - [Inicialización](#inicialización)
   - [Limpieza](#limpieza)
6. [La API de Core](#la-api-de-core)
   - [Almacenamiento persistente](#almacenamiento-persistente)
   - [Sistema de eventos](#sistema-de-eventos)
   - [Extensiones de UI](#extensiones-de-ui)
   - [Comunicación entre plugins](#comunicación-entre-plugins)
7. [Sistema de permisos](#sistema-de-permisos)
8. [Sistema de seguridad](#sistema-de-seguridad)
   - [Modelo de seguridad multinivel](#modelo-de-seguridad-multinivel)
   - [Sandbox para ejecución segura](#sandbox-para-ejecución-segura)
   - [Monitoreo de recursos](#monitoreo-de-recursos)
   - [Auditoría de seguridad](#auditoría-de-seguridad)
9. [Creación de interfaces de usuario](#creación-de-interfaces-de-usuario)
   - [Puntos de extensión UI](#puntos-de-extensión-ui)
   - [Patrón Wrapper para componentes](#patrón-wrapper-para-componentes)
   - [Componentes para la barra lateral](#componentes-para-la-barra-lateral)
   - [Integración Visual en la Barra Lateral de Atlas](#integración-visual-en-la-barra-lateral-de-atlas)
     - [1. Ítems de Navegación Principal (Zona: `MAIN_NAVIGATION`)](#1-ítems-de-navegación-principal-zona-main_navigation)
     - [2. Widgets o Paneles en la Barra Lateral (Zona: `CALENDAR_SIDEBAR` u otras)](#2-widgets-o-paneles-en-la-barra-lateral-zona-calendar_sidebar-u-otras)
   - [Extensiones para el calendario](#extensiones-para-el-calendario)
   - [Páginas completas de plugin](#páginas-completas-de-plugin)
   - [Widgets para el panel de configuración](#widgets-para-el-panel-de-configuración)
10. [Gestión de estado en componentes React](#gestión-de-estado-en-componentes-react)
11. [Estilos y temas](#estilos-y-temas)
    - [Sistema de temas de Atlas](#sistema-de-temas-de-atlas)
    - [Variables CSS disponibles](#variables-css-disponibles)
    - [Adaptación a diferentes temas](#adaptación-a-diferentes-temas)
    - [Buenas prácticas de CSS](#buenas-prácticas-de-css)
12. [Dependencias y conflictos](#dependencias-y-conflictos)
    - [Manejo de dependencias](#manejo-de-dependencias)
    - [Resolución de conflictos](#resolución-de-conflictos)
    - [Resolver ciclos de dependencias](#resolver-ciclos-de-dependencias)
13. [Empaquetado y distribución](#empaquetado-y-distribución)
    - [Estructura del paquete](#estructura-del-paquete)
    - [Verificación de integridad](#verificación-de-integridad)
    - [Repositorios de plugins](#repositorios-de-plugins)
    - [Actualizaciones automáticas](#actualizaciones-automáticas)
14. [Mejores prácticas](#mejores-prácticas)
    - [Manejo asíncrono de datos](#manejo-asíncrono-de-datos)
    - [Gestión de errores robusta](#gestión-de-errores-robusta)
    - [Prevención de errores comunes](#prevención-de-errores-comunes)
    - [Optimización de rendimiento](#optimización-de-rendimiento)
15. [Depuración](#depuración)
    - [Técnicas de depuración](#técnicas-de-depuración)
    - [Errores comunes y soluciones](#errores-comunes-y-soluciones)
16. [Ejemplos prácticos](#ejemplos-prácticos)

## Introducción

Atlas es una aplicación modular de gestión del tiempo con arquitectura basada en eventos. Su sistema de plugins permite extender la funcionalidad de la aplicación base de diversas formas. Esta guía te enseñará cómo desarrollar plugins efectivos para Atlas.

Los plugins en Atlas pueden:

- Añadir nuevas funcionalidades a la aplicación
- Integrar con servicios externos
- Personalizar la interfaz de usuario
- Interactuar con otros plugins
- Almacenar datos persistentes
- Extender el calendario y mejorar la experiencia del usuario

## Primer Plugin Paso a Paso

Esta sección te guiará desde cero para crear tu primer plugin funcional con navegación y página principal.

### Paso 1: Estructura Básica de Archivos

Crea la siguiente estructura de archivos:

```
mi-primer-plugin/
├── components/
│   ├── MiPluginNavItem.jsx
│   └── MiPluginMainPage.jsx
├── utils/
│   └── constants.js
└── index.js
```

### Paso 2: Archivo Principal (index.js)

⚠️ **IMPORTANTE**: Debes importar React explícitamente en todos los archivos que lo usen:

```javascript
import React from "react";
import MiPluginNavItem from "./components/MiPluginNavItem.jsx";
import MiPluginMainPage from "./components/MiPluginMainPage.jsx";

export default {
  // Metadatos obligatorios
  id: "mi-primer-plugin",
  name: "Mi Primer Plugin",
  version: "1.0.0",
  description: "Mi primer plugin para Atlas",
  author: "Tu Nombre",

  // Restricciones de compatibilidad
  minAppVersion: "0.3.0",
  maxAppVersion: "1.0.0",

  // Permisos requeridos
  permissions: ["ui", "storage"],

  // Variables internas
  _core: null,
  _navigationExtensionId: null,
  _pageExtensionId: null,

  // CONSTANTE CRÍTICA: Define el ID de tu página
  _PAGE_ID: "mi-pagina-principal",

  // Método de inicialización
  init: function (core) {
    try {
      this._core = core;

      // Registrar componentes UI
      this._registerNavigation();
      this._registerMainPage();

      console.log("[Mi Primer Plugin] Inicializado correctamente");
      return true;
    } catch (error) {
      console.error("[Mi Primer Plugin] Error de inicialización:", error);
      return false;
    }
  },

  // ⚠️ PATRÓN CRÍTICO: Patrón Wrapper para inyección de dependencias
  _registerNavigation: function () {
    const self = this; // Preservar contexto

    // Wrapper que inyecta dependencias al componente
    function NavigationWrapper(propsFromAtlas) {
      return React.createElement(MiPluginNavItem, {
        ...propsFromAtlas, // Props de Atlas (ej. onNavigate)
        plugin: self, // Instancia del plugin
        core: self._core, // API de Core
        pluginId: self.id, // ID del plugin
        pageIdToNavigate: self._PAGE_ID, // ID de página para navegación
      });
    }

    // Registrar el Wrapper (no el componente directamente)
    this._navigationExtensionId = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().MAIN_NAVIGATION,
      NavigationWrapper,
      { order: 100 }
    );
  },

  // ⚠️ REGISTRO CRÍTICO: El pageId DEBE estar en props
  _registerMainPage: function () {
    const self = this;

    function PageWrapper(propsFromAtlas) {
      return React.createElement(MiPluginMainPage, {
        ...propsFromAtlas,
        plugin: self,
        core: self._core,
        pluginId: self.id,
      });
    }

    // ¡CRUCIAL! El pageId debe estar en props
    this._pageExtensionId = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().PLUGIN_PAGES,
      PageWrapper,
      {
        order: 100,
        props: {
          pageId: this._PAGE_ID, // ¡ESTO ES OBLIGATORIO!
        },
      }
    );
  },

  // Método de limpieza
  cleanup: function () {
    try {
      // Limpiar extensiones específicas (recomendado)
      if (this._navigationExtensionId) {
        this._core.ui.removeExtension(this.id, this._navigationExtensionId);
      }
      if (this._pageExtensionId) {
        this._core.ui.removeExtension(this.id, this._pageExtensionId);
      }

      // O limpieza general (alternativa)
      // this._core.ui.removeAllExtensions(this.id);

      console.log("[Mi Primer Plugin] Limpieza completada");
      return true;
    } catch (error) {
      console.error("[Mi Primer Plugin] Error en limpieza:", error);
      return false;
    }
  },
};
```

### Paso 3: Componente de Navegación (components/MiPluginNavItem.jsx)

```javascript
import React from "react";

function MiPluginNavItem(props) {
  // ⚠️ NAVEGACIÓN CRÍTICA: Usar exactamente el mismo pageId
  const handleClick = () => {
    props.onNavigate(props.pluginId, props.pageIdToNavigate);
  };

  // Determinar si el ítem está activo.
  // Para este ejemplo, lo dejaremos simple. En un plugin real,
  // necesitarías una lógica para determinar si la página actual
  // coincide con pageIdToNavigate.
  const isActive = false;

  return React.createElement(
    "div",
    {
      // Clase raíz requerida por Atlas para ítems de navegación principal
      className: `sidebar-item ${isActive ? "active" : ""}`,
      onClick: handleClick,
      title: "Ir a Mi Plugin", // Tooltip para accesibilidad
      style: { cursor: "pointer" }, // Añadir cursor para indicar clickeabilidad
    },
    [
      // Contenedor del icono
      React.createElement(
        "span",
        {
          className: "sidebar-item-icon", // Clase para el icono
          key: "plugin-nav-icon",
        },
        // Icono (usando Material Icons)
        React.createElement(
          "span",
          { className: "material-icons" },
          "extension" // Nombre del Material Icon
        )
      ),
      // Contenedor de la etiqueta (texto)
      React.createElement(
        "span",
        {
          className: "sidebar-item-label", // CLASE CRÍTICA para el colapso de texto
          key: "plugin-nav-label",
        },
        "Mi Plugin" // Texto del elemento de navegación
      ),
    ]
  );
}

export default MiPluginNavItem;
```

### Paso 4: Página Principal (components/MiPluginMainPage.jsx)

```javascript
import React from "react";

function MiPluginMainPage(props) {
  return React.createElement(
    "div",
    { className: "plugin-page", style: { padding: "20px" } },
    [
      React.createElement("h1", { key: "title" }, "Mi Primer Plugin"),
      React.createElement(
        "p",
        { key: "description" },
        "¡Felicitaciones! Tu plugin está funcionando correctamente."
      ),
      React.createElement("div", { key: "info" }, [
        React.createElement(
          "h2",
          { key: "info-title" },
          "Información del Plugin:"
        ),
        React.createElement("p", { key: "plugin-id" }, `ID: ${props.pluginId}`),
        React.createElement(
          "p",
          { key: "page-id" },
          `Página ID: ${props.pageId}`
        ),
      ]),
    ]
  );
}

export default MiPluginMainPage;
```

### Paso 5: Constantes (utils/constants.js)

```javascript
// Constantes para tu plugin
export const PLUGIN_CONFIG = {
  STORAGE_KEY: "plugin_data",
  VERSION: "1.0.0",
};

export const UI_CONSTANTS = {
  COLORS: {
    PRIMARY: "#007bff",
    SUCCESS: "#28a745",
    WARNING: "#ffc107",
    DANGER: "#dc3545",
  },
};
```

### Paso 6: Verificación

Si seguiste estos pasos correctamente:

1.  **El plugin se carga**: Aparece en la lista de plugins de Atlas
2.  **El item de navegación funciona**: Aparece en la navegación principal, se ve como los demás ítems y su texto se oculta al colapsar la barra lateral.
3.  **La página se muestra**: Al hacer clic en el item de navegación, se muestra tu página principal

### Problemas Comunes en el Primer Plugin

#### Error: "La página no se muestra"

**Causa**: El `pageId` en `props` del registro de página no coincide con el usado en `onNavigate`.
**Solución**: Verifica que ambos usen exactamente el mismo valor.

#### Error: "Cannot read property of undefined"

**Causa**: No importaste React o hay problemas con el patrón Wrapper.
**Solución**: Importa React explícitamente y usa el patrón Wrapper mostrado arriba.

#### Error: "Plugin no se carga"

**Causa**: Error de sintaxis o falta algún método obligatorio.
**Solución**: Verifica que `init` y `cleanup` estén definidos y devuelvan `true`.

## Estructura básica de un plugin

Un plugin de Atlas se define como un objeto JavaScript con propiedades y métodos específicos. La estructura básica es la siguiente:

```javascript
import React from "react"; // ⚠️ OBLIGATORIO en archivos que usen React

export default {
  // Metadatos del plugin
  id: "mi-plugin",
  name: "Mi Plugin",
  version: "1.0.0",
  description: "Descripción de mi plugin",
  author: "Tu Nombre",

  // Restricciones de compatibilidad (⚠️ OBLIGATORIO)
  minAppVersion: "0.3.0",
  maxAppVersion: "1.0.0",

  // Dependencias y conflictos (opcionales)
  dependencies: [],
  conflicts: [],

  // Permisos requeridos
  permissions: ["storage", "events", "ui"],

  // Variables internas (recomendado para tracking)
  _core: null,
  _subscriptions: [],
  _extensionIds: {},

  // API pública (opcional)
  publicAPI: {
    // Métodos expuestos a otros plugins
    miMetodo: function () {
      /* ... */
    },
  },

  // Método de inicialización (obligatorio)
  init: function (core) {
    // Código de inicialización
    return true; // Devolver true si la inicialización fue exitosa
  },

  // Método de limpieza (obligatorio)
  cleanup: function () {
    // Código de limpieza
    return true; // Devolver true si la limpieza fue exitosa
  },
};
```

Esta estructura debe exportarse como exportación predeterminada desde el archivo principal de tu plugin (normalmente `index.js`).

### Organización de archivos

Para plugins más complejos, se recomienda una estructura organizada de archivos:

```
mi-plugin/
├── index.js                  // Punto de entrada principal
├── components/               // Componentes React/UI
│   ├── SidebarWidget.jsx     // Widget para la barra lateral
│   ├── MainPage.jsx          // Página principal del plugin
│   ├── SettingsPanel.jsx     // Panel de configuración
│   └── MyForm.jsx            // Formularios del plugin
├── services/                 // Lógica de servicios
│   ├── api.js                // Comunicación con APIs externas
│   └── storage.js            // Manejo de almacenamiento
├── utils/                    // Utilidades
│   ├── constants.js          // Constantes y configuración
│   └── helpers.js            // Funciones auxiliares
├── styles/                   // Estilos CSS
│   └── plugin-styles.css     // Estilos del plugin
└── package.json              // Para dependencias y metadatos
```

⚠️ **IMPORTANTE**: Todos los archivos `.jsx` deben importar React explícitamente:

```javascript
// En cada archivo .jsx
import React from "react";
```

## Metadatos del plugin

Los metadatos son propiedades que describen tu plugin y determinan cómo interactúa con Atlas:

- **id**: Identificador único de tu plugin. Usa un formato como 'nombre-plugin' o 'nombrePlugin'
- **name**: Nombre amigable para mostrar en la interfaz
- **version**: Sigue el formato de [versionado semántico](https://semver.org/) (X.Y.Z)
- **description**: Breve descripción de lo que hace tu plugin
- **author**: Tu nombre o el de tu organización
- **minAppVersion**: Versión mínima de Atlas compatible con tu plugin ⚠️ **RECOMENDADO**
- **maxAppVersion**: Versión máxima de Atlas compatible con tu plugin ⚠️ **RECOMENDADO**
- **priority** (opcional): Prioridad de carga (número menor = mayor prioridad)
- **core** (opcional): Establécelo a `true` si tu plugin es un componente crítico para la aplicación

Ejemplo:

```javascript
{
  id: 'calendar-export',
  name: 'Exportador de Calendario',
  version: '1.2.0',
  description: 'Permite exportar eventos del calendario a diversos formatos',
  author: 'Tu Nombre',
  minAppVersion: '0.3.0', // ⚠️ Incluir para compatibilidad
  maxAppVersion: '1.0.0', // ⚠️ Incluir para compatibilidad
  priority: 100,
  core: false
}
```

## Ciclo de vida del plugin

### Inicialización

El método `init` se llama cuando el plugin se activa. Recibe el objeto `core` que proporciona acceso a las APIs del sistema:

```javascript
init: function(core) {
  const self = this; // Preservar el contexto 'this'

  try {
    // Guardar referencia al core
    self._core = core;

    // Inicializar arrays de tracking (recomendado)
    self._subscriptions = [];
    self._extensionIds = {};

    // Configurar el plugin
    self._setupEventListeners();
    self._registerUIExtensions();

    // Registrar API pública si existe
    if (self.publicAPI) {
      core.plugins.registerAPI(self.id, self.publicAPI);
    }

    console.log(`[${self.name}] Inicializado correctamente`);
    return true;
  } catch (error) {
    console.error(`[${self.name}] Error durante la inicialización:`, error);
    return false;
  }
}
```

#### Inicialización Asíncrona (Con Almacenamiento)

Si tu plugin necesita cargar datos del almacenamiento, el método `init` debe ser asíncrono:

```javascript
init: async function(core) {
  const self = this;

  try {
    self._core = core;

    // ⚠️ CRÍTICO: Cargar datos almacenados primero
    await self._loadDataFromStorage();

    // Luego configurar el resto del plugin
    self._setupEventListeners();
    self._registerUIExtensions();

    if (self.publicAPI) {
      core.plugins.registerAPI(self.id, self.publicAPI);
    }

    console.log(`[${self.name}] Inicializado correctamente`);
    return true;
  } catch (error) {
    console.error(`[${self.name}] Error durante la inicialización:`, error);
    return false;
  }
}

// Método auxiliar para cargar datos
async _loadDataFromStorage() {
  const STORAGE_KEY = 'plugin_data'; // ⚠️ Define constantes para claves
  const storedData = await this._core.storage.getItem(
    this.id,
    STORAGE_KEY,
    {} // ⚠️ CRUCIAL: Proporcionar valor por defecto
  );

  this._data = storedData || {};
}
```

Si `init` devuelve `false` o una Promise resuelta con `false`, el sistema considerará que la inicialización ha fallado y el plugin no se activará.

### Limpieza

El método `cleanup` se llama cuando el plugin se desactiva. Debes liberar todos los recursos que tu plugin haya adquirido:

```javascript
cleanup: function() {
  try {
    // ⚠️ IMPORTANTE: Limpiar extensiones específicas
    Object.entries(this._extensionIds).forEach(([zone, extensionId]) => {
      this._core.ui.removeExtension(this.id, extensionId);
    });

    // ⚠️ IMPORTANTE: Cancelar suscripciones a eventos
    this._subscriptions.forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });

    // Limpiar temporizadores
    if (this._timerId) {
      clearInterval(this._timerId);
      this._timerId = null;
    }

    console.log(`[${this.name}] Limpieza completada`);
    return true;
  } catch (error) {
    console.error(`[${this.name}] Error durante la limpieza:`, error);
    return false;
  }
}
```

#### Limpieza Asíncrona (Con Almacenamiento)

Si tu plugin guarda datos, la limpieza también debe ser asíncrona:

```javascript
cleanup: async function() {
  try {
    // ⚠️ IMPORTANTE: Guardar datos antes de limpiar
    await this._saveDataToStorage();

    // Limpiar extensiones
    Object.entries(this._extensionIds).forEach(([zone, extensionId]) => {
      this._core.ui.removeExtension(this.id, extensionId);
    });

    // Cancelar suscripciones
    this._subscriptions.forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });

    console.log(`[${this.name}] Limpieza completada`);
    return true;
  } catch (error) {
    console.error(`[${this.name}] Error durante la limpieza:`, error);
    return false;
  }
}

// Método auxiliar para guardar datos
async _saveDataToStorage() {
  const STORAGE_KEY = 'plugin_data';
  try {
    await this._core.storage.setItem(this.id, STORAGE_KEY, this._data);
  } catch (error) {
    console.error(`[${this.name}] Error al guardar datos:`, error);
  }
}
```

## La API de Core

El objeto `core` proporcionado durante la inicialización contiene varias APIs:

### Almacenamiento persistente

La API `storage` permite guardar y recuperar datos persistentes:

```javascript
// ⚠️ PATRÓN RECOMENDADO: Definir constantes para claves
const STORAGE_KEY_DATA = "plugin_data";
const STORAGE_KEY_SETTINGS = "settings";

// Guardar datos
await core.storage.setItem(pluginId, STORAGE_KEY_DATA, misDatos);

// Recuperar datos con valor por defecto ⚠️ CRUCIAL
const misDatos = await core.storage.getItem(
  pluginId,
  STORAGE_KEY_DATA,
  valorPorDefecto
);

// Eliminar datos
await core.storage.removeItem(pluginId, STORAGE_KEY_DATA);

// Limpiar todos los datos del plugin
await core.storage.clearPluginData(pluginId);
```

⚠️ **PATRONES CRÍTICOS DE ALMACENAMIENTO:**

```javascript
// 1. Método de carga con manejo de errores
async _loadDataFromStorage() {
  const STORAGE_KEY = 'data';
  try {
    const storedData = await this._core.storage.getItem(
      this.id,
      STORAGE_KEY,
      [] // ⚠️ SIEMPRE proporcionar valor por defecto
    );
    this._data = storedData || []; // ⚠️ Verificación adicional
  } catch (error) {
    console.error(`[${this.name}] Error al cargar datos:`, error);
    this._data = []; // Valor de emergencia
  }
}

// 2. Método de guardado con manejo de errores
async _saveDataToStorage() {
  const STORAGE_KEY = 'data';
  try {
    await this._core.storage.setItem(this.id, STORAGE_KEY, this._data);
  } catch (error) {
    console.error(`[${this.name}] Error al guardar datos:`, error);
  }
}

// 3. Métodos internos que modifican datos deben guardar
async _internalCreateItem(itemData) {
  const newItem = {
    id: Date.now().toString(),
    ...itemData,
    createdAt: new Date().toISOString()
  };

  this._data.push(newItem);
  await this._saveDataToStorage(); // ⚠️ Guardar después de modificar
  return newItem;
}
```

El almacenamiento tiene límites impuestos por el sistema de seguridad. Por defecto, cada plugin tiene un límite de 1MB de almacenamiento.

### Sistema de eventos

La API `events` permite suscribirse a eventos del sistema y publicar eventos propios:

```javascript
// Suscribirse a un evento
const unsubscribe = core.events.subscribe(
  pluginId,
  "nombreDelEvento",
  function (datos, pluginOrigen) {
    // Manejar el evento
  }
);

// ⚠️ IMPORTANTE: Guardar función de cancelación
this._subscriptions.push(unsubscribe);

// Publicar un evento
core.events.publish(pluginId, "miPlugin.miEvento", { datos: "valor" });

// Cancelar todas las suscripciones
core.events.unsubscribeAll(pluginId);
```

#### Eventos importantes del sistema:

Los eventos del calendario incluyen información detallada para que los plugins puedan reaccionar apropiadamente:

##### Eventos del calendario

- **`calendar.eventCreated`** - Cuando se crea un evento en el calendario

  ```javascript
  // Estructura de datos del evento
  {
    event: {
      id: "1234567890",
      title: "Reunión de equipo",
      start: "2025-05-21T14:00:00.000Z",
      end: "2025-05-21T15:00:00.000Z",
      color: "#2D4B94",
      // ... otros campos del evento
    }
  }
  ```

- **`calendar.eventUpdated`** - Cuando se actualiza un evento

  ```javascript
  // Estructura de datos del evento
  {
    oldEvent: {
      id: "1234567890",
      title: "Reunión de equipo",
      start: "2025-05-21T14:00:00.000Z",
      // ... datos anteriores del evento
    },
    newEvent: {
      id: "1234567890",
      title: "Reunión de equipo - ACTUALIZADA",
      start: "2025-05-21T15:00:00.000Z", // Nueva hora
      // ... datos actualizados del evento
    }
  }
  ```

- **`calendar.eventDeleted`** - Cuando se elimina un evento

  ```javascript
  // Estructura de datos del evento
  {
    event: {
      id: "1234567890",
      title: "Reunión de equipo",
      // ... todos los datos del evento eliminado
    }
  }
  ```

- **`calendar.eventsLoaded`** - Cuando se cargan los eventos del calendario

  ```javascript
  // Estructura de datos del evento
  {
    events: [ /* array de todos los eventos */ ],
    count: 42 // número total de eventos
  }
  ```

- **`calendar.viewChanged`** - Cuando se cambia la vista del calendario (día/semana/mes)
- **`calendar.dateChanged`** - Cuando se cambia la fecha seleccionada

##### Eventos de la aplicación

- **`app.themeChanged`** - Cuando cambia el tema de la aplicación
- **`app.initialized`** - Cuando la aplicación ha terminado de inicializarse
- **`app.moduleRegistered`** - Cuando se registra un nuevo módulo en el sistema

##### Eventos de almacenamiento

- **`storage.dataChanged`** - Cuando cambian datos en el almacenamiento
- **`storage.eventsUpdated`** - Cuando se actualizan los eventos almacenados

### Extensiones de UI

La API `ui` permite agregar componentes a la interfaz de usuario de Atlas:

```javascript
// Registrar un componente en un punto de extensión
const extensionId = core.ui.registerExtension(
  pluginId,
  zonaDePuntoDeExtension,
  componenteReact,
  {
    order: 100, // Orden de aparición
    props: {
      /* Props adicionales */
    },
  }
);

// ⚠️ IMPORTANTE: Guardar ID para limpieza posterior
this._extensionIds[zonaDePuntoDeExtension] = extensionId;

// Eliminar una extensión
core.ui.removeExtension(pluginId, extensionId);

// Eliminar todas las extensiones del plugin
core.ui.removeAllExtensions(pluginId);

// Obtener zonas de extensión disponibles
const zones = core.ui.getExtensionZones();

// Acceder a componentes UI reutilizables
const { RichTextEditor, RichTextViewer } = core.ui.components;
```

### Comunicación entre plugins

La API `plugins` permite interactuar con otros plugins:

```javascript
// Obtener información de un plugin
const pluginInfo = core.plugins.getPlugin(pluginId);

// Obtener lista de plugins activos
const activePlugins = core.plugins.getActivePlugins();

// Verificar si un plugin está activo
const isActive = core.plugins.isPluginActive(pluginId);

// Registrar una API pública
core.plugins.registerAPI(pluginId, apiObject);

// Acceder a la API de otro plugin
const otroPlugin = core.plugins.getPluginAPI(miPluginId, otroPluginId);
if (otroPlugin) {
  const resultado = await otroPlugin.metodoPublico(parametros);
}
```

También puedes crear canales de comunicación entre plugins:

```javascript
// Crear un canal
const canal = core.plugins.createChannel("nombre-canal", pluginId, {
  allowAnyPublisher: false, // Solo creador puede publicar
  sendHistoryOnSubscribe: true, // Enviar historial al suscribirse
  maxMessages: 100, // Máximo historial
});

// Publicar en un canal
canal.publish(mensaje);

// Suscribirse a un canal
const unsub = canal.subscribe(function (mensaje) {
  // Manejar mensaje
});

// Obtener historial de mensajes
const historial = canal.getHistory();

// Obtener información del canal
const info = canal.getInfo();

// Cerrar un canal
canal.close();
```

### Acceso al módulo de calendario

El módulo de calendario proporciona acceso completo a los eventos y configuración del calendario:

```javascript
// Obtener el módulo de calendario
const calendar = core.getModule("calendar");

// El módulo de calendario se mantiene automáticamente sincronizado con los eventos
// No necesitas escuchar eventos para actualizar el estado, el módulo lo hace por ti

// Obtener todos los eventos
const allEvents = calendar.getEvents();

// Obtener eventos para una fecha específica
const eventsToday = calendar.getEventsForDate(new Date());

// Obtener eventos en un rango de fechas
const weekEvents = calendar.getEventsForDateRange(startDate, endDate);

// Obtener próximos eventos
const upcomingEvents = calendar.getUpcomingEvents(5); // Los próximos 5 eventos

// Obtener un evento específico por ID
const event = calendar.getEvent(eventId);

// Crear un nuevo evento
const newEvent = calendar.createEvent({
  title: "Mi evento",
  start: new Date(),
  end: new Date(Date.now() + 3600000), // 1 hora después
  color: "#2D4B94",
});

// Actualizar un evento existente
const updatedEvent = calendar.updateEvent(eventId, {
  title: "Título actualizado",
});

// Eliminar un evento
const deleted = calendar.deleteEvent(eventId);

// Obtener eventos agrupados por categoría
const eventsByColor = calendar.getEventsByCategory("color");

// Obtener metadatos del mes actual
const monthMetadata = calendar.getMonthMetadata(); // Array con info de cada día
```

## Sistema de permisos

Los plugins deben declarar los permisos que necesitan:

```javascript
permissions: ["storage", "events", "ui", "network"];
```

Permisos disponibles:

- `storage` - Almacenamiento persistente
- `events` - Sistema de eventos
- `ui` - Extensiones de UI
- `network` - Acceso a red
- `notifications` - Notificaciones
- `communication` - Comunicación entre plugins
- `dom` - Manipulación del DOM (restringido)
- `codeExecution` - Ejecución de código (muy restringido)

El sistema de permisos está integrado con el sistema de seguridad. Dependiendo del nivel de seguridad de Atlas, algunos permisos pueden requerir aprobación manual del usuario.

## Sistema de seguridad

Atlas incluye un robusto sistema de seguridad para plugins, que protege la aplicación y los datos del usuario.

### Modelo de seguridad multinivel

El sistema de seguridad tiene tres niveles configurables:

- **LOW**: Para desarrollo, con restricciones mínimas
- **NORMAL**: Para uso general, con restricciones equilibradas (predeterminado)
- **HIGH**: Para entornos críticos, con máximas restricciones

Cada nivel impacta en:

1. Qué permisos se aprueban automáticamente
2. Límites de recursos (memoria, CPU, red)
3. Nivel de monitoreo y auditoría
4. Verificaciones de código y comportamiento sospechoso

```javascript
// Ejemplo de límites según nivel de seguridad (simplificado)
const resourceLimits = {
  LOW: {
    memory: 10 * 1024 * 1024, // 10 MB
    cpuTimePerMinute: 5000, // 5 segundos
    networkRequestsPerMinute: 60,
    apiCallsPerMinute: 200,
  },
  NORMAL: {
    memory: 5 * 1024 * 1024, // 5 MB
    cpuTimePerMinute: 2000, // 2 segundos
    networkRequestsPerMinute: 30,
    apiCallsPerMinute: 100,
  },
  HIGH: {
    memory: 2 * 1024 * 1024, // 2 MB
    cpuTimePerMinute: 1000, // 1 segundo
    networkRequestsPerMinute: 10,
    apiCallsPerMinute: 50,
  },
};
```

### Sandbox para ejecución segura

El sistema ejecuta todo el código de los plugins en un entorno aislado (sandbox):

1. Intercepción de operaciones potencialmente peligrosas
2. Tiempo máximo de ejecución para prevenir bloqueos
3. Restricciones en la manipulación del DOM
4. Prevención de ejecución de código no seguro

Ejemplos de operaciones monitoreadas:

- Uso de `eval()` u otros métodos de ejecución dinámica
- Manipulación directa del DOM con propiedad `innerHTML`
- Intentos de acceder a objetos nativos protegidos
- Uso de temporizadores con código como cadena

### Monitoreo de recursos

El sistema monitorea activamente el uso de recursos por parte de los plugins:

```javascript
// Ejemplo de lo que se monitorea
const resourceUsage = {
  memory: bytesUsados,
  cpuTime: tiempoDeEjecuciónEnMs,
  networkRequests: númeroDePeticionesDeRed,
  apiCalls: númeroDeLlamadasAAPI,
  domOperations: númeroDeCambiosAlDOM,
  totalOperations: númeroTotalDeOperaciones,
};
```

Si un plugin excede los límites establecidos:

1. Primero se le aplican restricciones (ejecución más lenta)
2. Si persiste, se emiten advertencias al usuario
3. En casos graves, el plugin puede ser desactivado automáticamente
4. En el nivel de seguridad alto, puede ser añadido a lista negra

### Auditoría de seguridad

Todas las actividades de los plugins son registradas en un sistema de auditoría de seguridad:

1. Acciones específicas (crear/modificar eventos, acceso a red, etc.)
2. Solicitudes y cambios de permisos
3. Comportamientos sospechosos o anómalos
4. Errores de ejecución y violaciones de seguridad

El sistema de auditoría soporta tres modos:

- `immediate`: Registro inmediato (predeterminado en niveles NORMAL y HIGH)
- `batch`: Registro por lotes periódicos (predeterminado en nivel LOW)
- `disabled`: Sin registro (solo para desarrollo)

## Creación de interfaces de usuario

Los plugins pueden extender la interfaz de usuario mediante componentes React.

### Puntos de extensión UI

Atlas proporciona múltiples puntos donde los plugins pueden insertar sus componentes:

```javascript
// Zonas de extensión principales
const EXTENSION_ZONES = {
  CALENDAR_SIDEBAR: "calendar-sidebar", // Barra lateral del calendario
  SETTINGS_PANEL: "settings-panel", // Panel de configuración
  MAIN_NAVIGATION: "main-navigation", // Navegación principal
  PLUGIN_PAGES: "plugin-pages", // Páginas completas
  CALENDAR_DAY_HEADER: "calendar-day-header", // Encabezados de día en calendario
  CALENDAR_HOUR_CELL: "calendar-hour-cell", // Celdas de hora en calendario
  EVENT_DETAIL_VIEW: "event-detail-view", // Vista detallada de eventos
  EVENT_FORM: "event-form", // Formulario de eventos
};
```

### Patrón Wrapper para componentes

⚠️ **PATRÓN FUNDAMENTAL**: Para pasar datos del plugin a los componentes UI, debes usar el patrón Wrapper:

```javascript
// ⚠️ PATRÓN CRÍTICO: Wrapper para inyección de dependencias
function _createComponentWrapper(ComponenteReal, extraProps = {}) {
  const self = this; // Preservar contexto del plugin

  return function ComponentWrapper(propsFromAtlas) {
    return React.createElement(ComponenteReal, {
      ...propsFromAtlas, // Props que Atlas proporciona
      plugin: self, // Instancia del plugin
      core: self._core, // API de Core
      pluginId: self.id, // ID del plugin
      ...extraProps, // Props adicionales específicas
    });
  };
}

// Uso del patrón:
const NavigationWrapper = this._createComponentWrapper(MiNavComponent, {
  pageIdToNavigate: this._PAGE_ID,
});

const extensionId = this._core.ui.registerExtension(
  this.id,
  this._core.ui.getExtensionZones().MAIN_NAVIGATION,
  NavigationWrapper, // Registra el Wrapper, no el componente directamente
  { order: 100 }
);
```

### Componentes para la barra lateral

Esta sección ha sido expandida y detallada en la siguiente sección: [Integración Visual en la Barra Lateral de Atlas](#integración-visual-en-la-barra-lateral-de-atlas).

### Integración Visual en la Barra Lateral de Atlas

La barra lateral de Atlas es un componente central de la navegación y la interacción. Los plugins pueden extenderla de dos maneras principales, y es crucial que ambas mantengan una coherencia visual con la interfaz de Atlas:

1.  **Añadiendo Ítems de Navegación Principal**: Para dirigir al usuario a páginas completas dedicadas del plugin.
2.  **Añadiendo Widgets o Paneles Informativos**: Para mostrar información o controles rápidos directamente en la barra lateral (generalmente en la zona `CALENDAR_SIDEBAR`).

#### 1. Ítems de Navegación Principal (Zona: `MAIN_NAVIGATION`)

Estos elementos permiten a los usuarios acceder a las páginas principales de tu plugin. Para que se vean y comporten como los ítems nativos de Atlas –incluyendo el importante ocultamiento del texto cuando la barra lateral se colapsa– sigue estas directrices:

##### Requisitos para tu Componente de Ítem de Navegación Principal:

- **Punto de Extensión**: Registra tu componente de navegación en la zona de extensión `MAIN_NAVIGATION` utilizando `core.ui.registerExtension`.

  ```javascript
  // En el método init de tu plugin (index.js)
  this._extensionIds.navigation = this._core.ui.registerExtension(
    this.id, // El ID de tu plugin
    this._core.ui.getExtensionZones().MAIN_NAVIGATION, // Zona específica
    NavigationItemWrapper, // Tu componente de navegación (envuelto con el Patrón Wrapper)
    { order: 150 } // Opcional: para influir en el orden de aparición
  );
  ```

- **Estructura DOM y Clases CSS Clave**: El componente React que renderices debe generar la siguiente estructura DOM con clases CSS específicas para asegurar la compatibilidad visual y funcional:

  - **Elemento Raíz (Contenedor Principal del Ítem)**:
    - Debe tener la clase CSS `sidebar-item`.
    - Opcionalmente, puede tener la clase `active` si el ítem representa la página actualmente visible (la lógica para determinar esto recae en el plugin o en cómo se gestione el estado de página activa globalmente).
  - **Icono**:
    - Dentro del elemento raíz, debe haber un `<span>` con la clase CSS `sidebar-item-icon`.
    - Para usar los iconos estándar de la aplicación (Material Icons), dentro de este `<span>`, incluye otro `<span>` con la clase CSS `material-icons` y el nombre del icono como contenido textual (ej: `"widgets"`).
    - Alternativamente, puedes usar un carácter emoji directamente como contenido del `<span>` con clase `sidebar-item-icon`.
  - **Etiqueta de Texto**:
    - Junto al icono (o como hermano del `sidebar-item-icon`), debe haber un `<span>` con la clase CSS `sidebar-item-label`.
    - **Esta es la clase CSS esencial que Atlas utiliza para ocultar automáticamente el texto del ítem cuando la barra lateral se colapsa.**

- **Props Recibidas por tu Componente de Navegación**: Cuando Atlas renderiza tu componente de navegación en la zona `MAIN_NAVIGATION`, le pasará automáticamente las siguientes `props` (a través del `ExtensionPoint` y tu wrapper):

  - `pluginId` (string): El ID de tu plugin (el mismo que definiste en tus metadatos).
  - `extensionId` (string): Un ID único generado por Atlas para esta instancia específica de la extensión.
  - `onNavigate` (function): Una función que **debes** llamar para que Atlas navegue a la página de tu plugin. Esta función espera dos argumentos: `(pluginId, pageId)`.

- **Manejo de la Navegación**:
  - Debes definir un `pageId` (un string único y constante) para la página principal (o cada página navegable) de tu plugin.
  - Al hacer clic en tu elemento de navegación, debes invocar la función `props.onNavigate(props.pluginId, TU_PAGE_ID_DEFINIDO)`.
  - Es crucial que este `TU_PAGE_ID_DEFINIDO` sea el mismo que utilices al registrar el componente de tu página principal en la zona `PLUGIN_PAGES` (ver la sección [Páginas completas de plugin](#páginas-completas-de-plugin)).

##### Ejemplo de Componente para `MAIN_NAVIGATION` (`MiPluginNavItem.jsx`):

```javascript
// plugins/mi-plugin/components/MiPluginNavItem.jsx
import React from "react"; // Siempre importa React en archivos .jsx

function MiPluginNavItem(props) {
  // props.pluginId y props.onNavigate son proporcionados por Atlas.
  // props.pageIdToNavigate es una prop personalizada que debes pasar
  // a través del Patrón Wrapper desde tu plugin (ver sección de registro).

  const handleClick = () => {
    if (props.onNavigate && props.pageIdToNavigate) {
      props.onNavigate(props.pluginId, props.pageIdToNavigate);
    } else {
      // Es buena práctica loguear si faltan props esenciales
      console.warn(
        `[${props.pluginId}] Navegación no posible: 'onNavigate' o 'pageIdToNavigate' no definidos en props.`
      );
    }
  };

  // Determinar si el ítem está activo.
  // Atlas no pasa explícitamente una prop 'active' a los ítems de plugin.
  // Si necesitas esta funcionalidad, deberás implementarla basándote en el
  // estado global de la aplicación (si es accesible) o gestionarlo internamente.
  // const isActive = tuLogicaParaDeterminarSiEstaActivo;
  const isActive = false; // Simplificado para el ejemplo

  return React.createElement(
    "div",
    {
      className: `sidebar-item ${isActive ? "active" : ""}`, // Clase raíz
      onClick: handleClick,
      title: "Ir a Mi Plugin", // Tooltip para accesibilidad y usabilidad
      style: { cursor: "pointer" }, // Es buena práctica añadir esto para indicar que es clickeable
    },
    [
      // Contenedor del icono
      React.createElement(
        "span",
        {
          className: "sidebar-item-icon", // Clase para el icono
          key: "plugin-nav-icon", // React key
        },
        // Icono (usando Material Icons)
        React.createElement(
          "span",
          { className: "material-icons" }, // Clase para iconos de Material Design
          "extension" // Reemplaza con el nombre del Material Icon deseado
          // o usa un emoji directamente como texto aquí.
        )
      ),
      // Contenedor de la etiqueta (texto)
      React.createElement(
        "span",
        {
          className: "sidebar-item-label", // CLASE CRÍTICA para el colapso de texto
          key: "plugin-nav-label", // React key
        },
        "Mi Plugin" // El texto de tu elemento de navegación
      ),
    ]
  );
}

export default MiPluginNavItem;
```

**Nota sobre el Registro**: Recuerda utilizar el [Patrón Wrapper](#patrón-wrapper-para-componentes) al registrar este `MiPluginNavItem` para inyectarle props como `pageIdToNavigate`.

#### 2. Widgets o Paneles en la Barra Lateral (Zona: `CALENDAR_SIDEBAR` u otras)

Estas extensiones son diferentes de los ítems de navegación principal. En lugar de llevar a páginas completas, ofrecen información o funcionalidades rápidas directamente en la barra lateral. Aunque no suelen necesitar la misma lógica de colapso de texto, su diseño debe ser coherente con el tema y estilo de Atlas.

##### Recomendaciones para el Diseño de Widgets en la Barra Lateral:

- **Punto de Extensión**: Registra tu componente de widget en la zona apropiada, como `CALENDAR_SIDEBAR`, usando `core.ui.registerExtension`.
- **Apariencia Visual (CSS)**:
  - **Variables CSS de Atlas**: Utiliza las [Variables CSS disponibles](#variables-css-disponibles) de Atlas para todos los aspectos visuales:
    - **Fondos**: `var(--sidebar-bg)` para el fondo principal del sidebar, o `var(--bg-color-secondary)` si deseas un leve contraste para tu widget dentro del sidebar.
    - **Texto**: `var(--text-color)` para el texto principal, y `var(--text-color-secondary)` para texto secundario o menos enfatizado.
    - **Bordes**: `var(--border-color)` para bordes, y `var(--border-radius-md)` o `var(--border-radius-sm)` para esquinas redondeadas.
    - **Colores de Acento**: Para elementos destacados, usa `var(--primary-color)` o variables semánticas como `var(--success-color)`.
  - **Espaciado**: Aplica márgenes y rellenos internos usando las variables de espaciado de Atlas (ej. `var(--spacing-sm)`, `var(--spacing-md)`).
  - **Tipografía**: Emplea `var(--font-family-body)` para texto general. Si tu widget tiene títulos, puedes usar `var(--font-family-heading)` y tamaños de fuente consistentes (ej. `0.9rem`, `1rem`).
- **Contenedor Principal del Widget**:
  - Envuelve la UI de tu widget en un `div` con una **clase CSS única y específica de tu plugin** (ej. `mi-plugin-id-sidebar-widget`). Esto ayuda a aislar tus estilos.
  - Aplica un `padding` interno usando las variables de espaciado de Atlas (ej. `var(--spacing-sm)` o `var(--spacing-md)`).
  - Si tu widget tiene un título, utiliza una etiqueta semántica como `<h4>` y estilízala sutilmente con las variables de Atlas.
- **Elementos Interactivos**:
  - Si tu widget incluye botones, campos de entrada u otros controles, estilízalos para que coincidan con la apariencia general de Atlas. Utiliza las variables de color para botones (`var(--color-button-primary-bg)`, etc.) y para inputs (`var(--input-bg)`, `var(--border-color)`).
- **Adaptación al Colapso (Avanzado y Opcional para Widgets)**:
  Los widgets en `CALENDAR_SIDEBAR` generalmente no se colapsan como los ítems de `MAIN_NAVIGATION`. Sin embargo, si tu widget tiene contenido que podría no verse bien cuando el sidebar general de Atlas se colapse (se haga más estrecho), podrías necesitar implementar lógica de CSS o JavaScript para ajustar su diseño. Esto implicaría detectar si el elemento contenedor `.sidebar` tiene la clase `.collapsed` aplicada por Atlas. Esta es una consideración avanzada y depende de la complejidad de tu widget.

##### Ejemplo de Componente Widget para `CALENDAR_SIDEBAR` (`MiSidebarWidget.jsx`):

```javascript
// plugins/mi-plugin/components/MiSidebarWidget.jsx
import React from "react";

function MiSidebarWidget(props) {
  // props.plugin (tu instancia de plugin), props.core (API de Atlas),
  // y props.pluginId son inyectados por el Patrón Wrapper.

  const [widgetData, setWidgetData] = React.useState(
    "Cargando datos del widget..."
  );

  React.useEffect(() => {
    // Simular carga de datos o suscripción a eventos del plugin
    const timer = setTimeout(() => {
      setWidgetData(`Información relevante de ${props.pluginId} actualizada.`);
    }, 1500);
    return () => clearTimeout(timer);
  }, [props.pluginId]); // Dependencia para reaccionar si el pluginId cambiara (aunque es raro)

  // Estilos en línea usando variables CSS de Atlas para consistencia
  const widgetContainerStyle = {
    padding: "var(--spacing-md)",
    margin: "var(--spacing-sm) var(--spacing-xs)", // Margen para separación
    backgroundColor: "var(--bg-color-secondary)", // Un fondo ligeramente distinto
    borderRadius: "var(--border-radius-md)",
    border: `1px solid var(--border-color)`,
    color: "var(--text-color)",
    fontFamily: "var(--font-family-body)",
    boxShadow: "var(--shadow-sm)", // Sombra sutil para destacar
  };

  const widgetTitleStyle = {
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "var(--primary-color)", // Usar color primario de Atlas
    marginBottom: "var(--spacing-xs)",
    marginTop: "0", // Resetear margen superior del h4
  };

  const widgetContentStyle = {
    fontSize: "0.85rem",
    color: "var(--text-color-secondary)",
    lineHeight: "1.4",
    margin: "0", // Resetear margen del p
  };

  const widgetButtonStyle = {
    marginTop: "var(--spacing-sm)",
    padding: "var(--spacing-xs) var(--spacing-sm)",
    backgroundColor: "var(--primary-color)",
    color: "var(--color-button-primary-text)", // Asegura contraste
    border: "none",
    borderRadius: "var(--border-radius-sm)",
    cursor: "pointer",
    fontSize: "0.8rem",
    transition: "background-color var(--transition-fast)",
  };

  // Hover para el botón (se podría hacer con CSS también)
  const handleButtonHover = (e, isHovering) => {
    e.target.style.backgroundColor = isHovering
      ? "var(--primary-hover)"
      : "var(--primary-color)";
  };

  return React.createElement(
    "div",
    {
      className: `${props.pluginId}-sidebar-widget`, // Clase única para tu plugin
      style: widgetContainerStyle,
    },
    [
      React.createElement(
        "h4", // Título semántico para el widget
        { key: "widget-title", style: widgetTitleStyle },
        "Widget de Mi Plugin"
      ),
      React.createElement(
        "p",
        { key: "widget-content", style: widgetContentStyle },
        widgetData
      ),
      // Ejemplo de un botón dentro del widget
      React.createElement(
        "button",
        {
          key: "widget-action",
          onClick: () => {
            /* Lógica de tu botón */ alert("Botón del widget presionado!");
          },
          style: widgetButtonStyle,
          onMouseEnter: (e) => handleButtonHover(e, true),
          onMouseLeave: (e) => handleButtonHover(e, false),
        },
        "Acción Rápida"
      ),
    ]
  );
}

export default MiSidebarWidget;
```

**Nota sobre el Registro del Widget**: Al igual que con los ítems de navegación, usa el [Patrón Wrapper](#patrón-wrapper-para-componentes) para registrar tu `MiSidebarWidget` en la zona `CALENDAR_SIDEBAR` o la que corresponda, para asegurarte de que reciba las props necesarias como `plugin`, `core`, y `pluginId`.

### Extensiones para el calendario

Puedes extender diferentes partes del calendario:

#### Extensión para encabezados de día

```javascript
// Extensión para encabezados de días
function DayHeaderExtension(props) {
  // props contiene: date
  const dayOfWeek = props.date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return React.createElement(
    "div",
    {
      className: "day-header-extension",
      style: {
        backgroundColor: isWeekend ? "#ffebee" : "transparent",
        padding: "2px 4px",
        borderRadius: "4px",
      },
    },
    isWeekend ? "🌟" : null
  );
}

// Registrar extensión para encabezados de día
const extensionId = core.ui.registerExtension(
  pluginId,
  core.ui.getExtensionZones().CALENDAR_DAY_HEADER,
  this._createComponentWrapper(DayHeaderExtension),
  { order: 100 }
);
```

#### Extensión para celdas de hora

```javascript
// Extensión para celdas de hora
function HourCellExtension(props) {
  // props contiene: date, hour, minutes
  const isLunchTime = props.hour === 12 || props.hour === 13;

  return React.createElement(
    "div",
    {
      className: "hour-cell-extension",
      style: {
        position: "absolute",
        right: "4px",
        top: "4px",
        fontSize: "12px",
        opacity: 0.6,
      },
    },
    isLunchTime ? "🍽️" : null
  );
}

// Registrar extensión para celdas de hora
const extensionId = core.ui.registerExtension(
  pluginId,
  core.ui.getExtensionZones().CALENDAR_HOUR_CELL,
  this._createComponentWrapper(HourCellExtension),
  { order: 100 }
);
```

#### Extensión para detalles de eventos

```javascript
// Extensión para detalles de eventos
function EventDetailExtension(props) {
  // props contiene: event, isEditing
  return React.createElement(
    "div",
    { className: "event-detail-extension" },
    React.createElement("h4", {}, "Información adicional"),
    React.createElement("p", {}, "Datos personalizados para este evento")
  );
}

// Registrar extensión para detalles de eventos
const extensionId = core.ui.registerExtension(
  pluginId,
  core.ui.getExtensionZones().EVENT_DETAIL_VIEW,
  this._createComponentWrapper(EventDetailExtension),
  { order: 100 }
);
```

#### Extensión para el formulario de eventos

```javascript
// Extensión para el formulario de eventos
function EventFormExtension(props) {
  // props contiene: event, isEditing, onChange
  const handleChange = (e) => {
    // Actualizar datos del evento
    props.onChange({
      target: {
        name: "metadatos",
        value: e.target.value,
      },
    });
  };

  return React.createElement(
    "div",
    { className: "event-form-extension" },
    React.createElement("label", {}, "Metadatos:"),
    React.createElement("input", {
      type: "text",
      value: props.event.metadatos || "",
      onChange: handleChange,
    })
  );
}

// Registrar extensión para formulario de eventos
const extensionId = core.ui.registerExtension(
  pluginId,
  core.ui.getExtensionZones().EVENT_FORM,
  this._createComponentWrapper(EventFormExtension),
  { order: 100 }
);
```

### Páginas completas de plugin

⚠️ **REGISTRO CRÍTICO**: Las páginas de plugin requieren configuración específica:

```javascript
// ⚠️ IMPORTANTE: Define una constante para el ID de página
const PAGE_ID = "mi-pagina-principal";

// Componente de navegación (usar el ejemplo de MiPluginNavItem.jsx adaptado)
// function NavigationItem(props) { ... }

// Componente de página
function MainPage(props) {
  return React.createElement("div", { className: "plugin-page" }, [
    React.createElement("h1", { key: "title" }, "Mi Plugin"),
    React.createElement(
      "p",
      { key: "content" },
      "Contenido de mi página principal"
    ),
  ]);
}

// Registrar navegación
const navWrapper = this._createComponentWrapper(MiPluginNavItem, {
  // Asegúrate de usar tu componente
  pageIdToNavigate: PAGE_ID, // Pasar el pageId como prop
});

this._navigationExtensionId = core.ui.registerExtension(
  this.id,
  core.ui.getExtensionZones().MAIN_NAVIGATION,
  navWrapper,
  { order: 100 }
);

// ⚠️ REGISTRO CRUCIAL: pageId DEBE estar en props
const pageWrapper = this._createComponentWrapper(MainPage);

this._pageExtensionId = core.ui.registerExtension(
  this.id,
  core.ui.getExtensionZones().PLUGIN_PAGES,
  pageWrapper,
  {
    order: 100,
    props: {
      pageId: PAGE_ID, // ¡OBLIGATORIO!
    },
  }
);
```

### Widgets para el panel de configuración

```javascript
function SettingsWidget(props) {
  const [valor, setValor] = React.useState("");

  const handleChange = (e) => {
    setValor(e.target.value);
    // Guardar configuración
    // Esto es un ejemplo, la lógica de onSettingChange dependería de cómo
    // el panel de configuración de Atlas maneje los cambios.
    // props.onSettingChange("miConfiguracion", e.target.value);

    // Si `onSettingChange` no es provisto, necesitarás tu propia lógica
    // para guardar la configuración, por ejemplo, usando la API de almacenamiento
    // del plugin a través de `props.plugin.publicAPI.saveSetting(...)` o
    // `props.core.storage.setItem(...)`.
    if (
      props.plugin &&
      props.plugin.publicAPI &&
      props.plugin.publicAPI.saveSetting
    ) {
      props.plugin.publicAPI.saveSetting("miConfiguracion", e.target.value);
    } else {
      console.warn("Función para guardar configuración no disponible.");
    }
  };

  // Ejemplo de carga de configuración inicial
  React.useEffect(() => {
    if (
      props.plugin &&
      props.plugin.publicAPI &&
      props.plugin.publicAPI.loadSetting
    ) {
      const initialValue = props.plugin.publicAPI.loadSetting(
        "miConfiguracion",
        ""
      );
      setValor(initialValue);
    }
  }, [props.plugin]);

  return React.createElement(
    "div",
    {
      className: `${props.pluginId}-settings-widget settings-widget`, // Clase específica y genérica
      style: {
        padding: "var(--spacing-md)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--border-radius-md)",
        marginBottom: "var(--spacing-md)",
        backgroundColor: "var(--card-bg)",
      },
    },
    [
      React.createElement(
        "h3",
        {
          key: "title",
          style: {
            color: "var(--text-color)",
            marginTop: 0,
            marginBottom: "var(--spacing-sm)",
          },
        },
        "Configuración de Mi Plugin"
      ),
      React.createElement("input", {
        key: "input",
        type: "text",
        value: valor,
        onChange: handleChange,
        placeholder: "Valor de configuración",
        style: {
          width: "100%",
          padding: "var(--spacing-sm)",
          borderRadius: "var(--border-radius-sm)",
          border: "1px solid var(--border-color)",
          backgroundColor: "var(--input-bg)",
          color: "var(--text-color)",
          boxSizing: "border-box",
        },
      }),
    ]
  );
}

// Registrar en el panel de configuración
const settingsWrapper = this._createComponentWrapper(SettingsWidget);

const extensionId = core.ui.registerExtension(
  pluginId,
  core.ui.getExtensionZones().SETTINGS_PANEL,
  settingsWrapper,
  { order: 100 }
);
```

## Gestión de estado en componentes React

⚠️ **PATRONES CRÍTICOS** para manejar estado en componentes de plugins:

### 1. Estado para listas dinámicas

```javascript
function MiListaComponent(props) {
  // ⚠️ Estado para datos que cambián
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // ⚠️ Función para refrescar datos
  const refreshItems = React.useCallback(async () => {
    try {
      setLoading(true);
      // Asegúrate de que publicAPI y getAllItems existan y sean funciones
      if (
        props.plugin &&
        props.plugin.publicAPI &&
        typeof props.plugin.publicAPI.getAllItems === "function"
      ) {
        const currentItems = await props.plugin.publicAPI.getAllItems();
        setItems(Array.isArray(currentItems) ? currentItems : []); // Asegurar que es un array
      } else {
        console.warn(
          `[${props.pluginId}] publicAPI.getAllItems no está disponible.`
        );
        setItems([]);
      }
    } catch (error) {
      console.error(`[${props.pluginId}] Error al cargar items:`, error);
      setItems([]); // Valor de emergencia
    } finally {
      setLoading(false);
    }
  }, [props.plugin, props.pluginId]); // props.pluginId para logs, props.plugin para la API

  // ⚠️ Cargar datos iniciales
  React.useEffect(() => {
    refreshItems();
  }, [refreshItems]);

  // ⚠️ Función para manejar acciones
  const handleCreateItem = async (itemData) => {
    try {
      if (
        props.plugin &&
        props.plugin.publicAPI &&
        typeof props.plugin.publicAPI.createItem === "function"
      ) {
        await props.plugin.publicAPI.createItem(itemData);
        refreshItems(); // ⚠️ Refrescar después de modificar
      } else {
        console.warn(
          `[${props.pluginId}] publicAPI.createItem no está disponible.`
        );
      }
    } catch (error) {
      console.error(`[${props.pluginId}] Error al crear item:`, error);
    }
  };

  if (loading) {
    return React.createElement(
      "div",
      { style: { color: "var(--text-color)" } },
      "Cargando..."
    );
  }

  return React.createElement(
    "div",
    { className: `${props.pluginId}-items-list items-list` },
    [
      React.createElement(
        "h2",
        { key: "title", style: { color: "var(--text-color)" } },
        "Mi Lista"
      ),
      React.createElement(
        "button",
        {
          key: "add-btn",
          onClick: () => handleCreateItem({ name: "Nuevo item" }),
          style: {
            backgroundColor: "var(--primary-color)",
            color: "var(--color-button-primary-text)",
            border: "none",
            padding: "var(--spacing-sm) var(--spacing-md)",
            borderRadius: "var(--border-radius-sm)",
            cursor: "pointer",
            marginBottom: "var(--spacing-md)",
          },
        },
        "Añadir Item"
      ),
      React.createElement(
        "ul",
        { key: "list", style: { listStyle: "none", padding: 0, margin: 0 } },
        items.map((item, index) =>
          React.createElement(
            "li",
            {
              key: item.id || index, // ⚠️ Key única obligatoria
              style: {
                padding: "var(--spacing-sm)",
                borderBottom: "1px solid var(--border-color)",
                color: "var(--text-color-secondary)",
              },
            },
            item.name
          )
        )
      ),
    ]
  );
}
```

### 2. Estado para formularios

```javascript
function MiFormulario(props) {
  // ⚠️ Estado inicial basado en props
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    status: "active",
  });

  // ⚠️ Resetear formulario cuando cambian las props
  React.useEffect(() => {
    if (props.existingItem) {
      setFormData({
        name: props.existingItem.name || "",
        description: props.existingItem.description || "",
        status: props.existingItem.status || "active",
      });
    } else {
      setFormData({ name: "", description: "", status: "active" });
    }
  }, [props.existingItem]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ⚠️ Validación básica
    if (!formData.name.trim()) {
      alert("El nombre es obligatorio"); // Considerar usar un sistema de notificaciones más integrado
      return;
    }

    try {
      // Asegurar que las funciones de publicAPI existen
      const api = props.plugin?.publicAPI;
      if (!api) {
        console.error(`[${props.pluginId}] publicAPI no disponible.`);
        return;
      }

      if (props.existingItem && typeof api.updateItem === "function") {
        await api.updateItem(props.existingItem.id, formData);
      } else if (typeof api.createItem === "function") {
        await api.createItem(formData);
      } else {
        console.error(
          `[${props.pluginId}] Funciones updateItem o createItem no disponibles en publicAPI.`
        );
        return;
      }

      // ⚠️ Callback al componente padre
      if (props.onSave && typeof props.onSave === "function") {
        props.onSave(formData);
      }
    } catch (error) {
      console.error(`[${props.pluginId}] Error al guardar:`, error);
    }
  };

  const commonInputStyle = {
    width: "100%",
    padding: "var(--spacing-sm)",
    borderRadius: "var(--border-radius-sm)",
    border: `1px solid var(--border-color)`,
    backgroundColor: "var(--input-bg)",
    color: "var(--text-color)",
    boxSizing: "border-box",
    marginBottom: "var(--spacing-md)",
  };

  return React.createElement(
    "form",
    {
      onSubmit: handleSubmit,
      className: `${props.pluginId}-mi-formulario`,
    },
    [
      React.createElement("input", {
        key: "name",
        type: "text",
        name: "name",
        value: formData.name,
        onChange: handleChange,
        placeholder: "Nombre",
        style: commonInputStyle,
      }),
      React.createElement("textarea", {
        key: "description",
        name: "description",
        value: formData.description,
        onChange: handleChange,
        placeholder: "Descripción",
        style: { ...commonInputStyle, minHeight: "80px" },
      }),
      React.createElement(
        "select",
        {
          key: "status",
          name: "status",
          value: formData.status,
          onChange: handleChange,
          style: commonInputStyle,
        },
        [
          React.createElement(
            "option",
            { key: "active", value: "active" },
            "Activo"
          ),
          React.createElement(
            "option",
            { key: "inactive", value: "inactive" },
            "Inactivo"
          ),
        ]
      ),
      React.createElement(
        "button",
        {
          key: "submit",
          type: "submit",
          style: {
            backgroundColor: "var(--primary-color)",
            color: "var(--color-button-primary-text)",
            border: "none",
            padding: "var(--spacing-sm) var(--spacing-md)",
            borderRadius: "var(--border-radius-sm)",
            cursor: "pointer",
          },
        },
        props.existingItem ? "Actualizar" : "Crear"
      ),
    ]
  );
}
```

### 3. Estado para controlar visibilidad (modales/popups)

```javascript
function ComponenteConModal(props) {
  const [showModal, setShowModal] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState(null);

  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleSave = (formData) => {
    // La lógica de guardado se maneja en el formulario MiFormulario
    // Aquí solo cerramos el modal y, opcionalmente, refrescamos la lista o notificamos.
    console.log(`[${props.pluginId}] Formulario guardado:`, formData);
    handleCloseModal();
    // Si este componente maneja una lista que necesita actualizarse:
    // if (props.onListRefresh) props.onListRefresh();
  };

  return React.createElement(
    "div",
    {
      className: `${props.pluginId}-component-with-modal component-with-modal`,
    },
    [
      React.createElement(
        "button",
        {
          key: "open-btn",
          onClick: () => handleOpenModal(),
          style: {
            backgroundColor: "var(--primary-color)",
            color: "var(--color-button-primary-text)",
            border: "none",
            padding: "var(--spacing-sm) var(--spacing-md)",
            borderRadius: "var(--border-radius-sm)",
            cursor: "pointer",
          },
        },
        "Crear Nuevo con Modal"
      ),

      // ⚠️ Renderizado condicional del modal
      showModal &&
        React.createElement(
          "div", // Modal Overlay
          {
            key: "modal-overlay",
            className: `${props.pluginId}-modal-overlay modal-overlay`,
            style: {
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.6)", // Fondo semitransparente
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000, // Asegurar que esté por encima de otros elementos
            },
          },
          React.createElement(
            "div", // Modal Content
            {
              className: `${props.pluginId}-modal-content modal-content`,
              style: {
                backgroundColor: "var(--card-bg)", // Fondo del modal
                padding: "var(--spacing-lg)",
                borderRadius: "var(--border-radius-lg)", // Bordes redondeados
                boxShadow: "var(--shadow-xl)", // Sombra pronunciada
                maxWidth: "500px",
                width: "90%",
                maxHeight: "80vh", // Altura máxima para evitar que sea muy largo
                overflowY: "auto", // Scroll si el contenido es muy largo
              },
            },
            [
              React.createElement(MiFormulario, {
                // Reutilizar el componente de formulario
                key: "form-in-modal",
                plugin: props.plugin, // Pasar la instancia del plugin
                pluginId: props.pluginId,
                existingItem: editingItem,
                onSave: handleSave, // Callback para cuando el formulario se guarda
                // Pasar onCancel también si el formulario lo maneja internamente
              }),
              // Botón de cancelar podría estar aquí o dentro del formulario
              // Si MiFormulario no tiene su propio botón de cancelar:
              // React.createElement(
              //   "button",
              //   {
              //     key: "cancel-modal-btn",
              //     onClick: handleCloseModal,
              //     style: {
              //       marginTop: "var(--spacing-md)",
              //       backgroundColor: "var(--bg-color-secondary)",
              //       color: "var(--text-color)",
              //       border: "1px solid var(--border-color)",
              //       padding: "var(--spacing-sm) var(--spacing-md)",
              //       borderRadius: "var(--border-radius-sm)",
              //       cursor: "pointer",
              //       display: "block", // o flex para alinear con el de guardar
              //       width: "100%" // o ajustado según diseño
              //     }
              //   },
              //   "Cancelar (desde Modal)"
              // )
            ]
          )
        ),
    ]
  );
}
```

### 4. API Pública del Plugin para UI

⚠️ **PATRÓN RECOMENDADO** para exponer funcionalidad a los componentes UI:

```javascript
// En index.js del plugin
_createPublicAPI: function() {
  const self = this;

  return {
    // Operaciones de lectura
    getAllItems: () => [...self._items], // ⚠️ Devolver copia para inmutabilidad
    getItem: (id) => {
        const item = self._items.find(item => item.id === id);
        return item ? { ...item } : undefined; // Devolver copia si se encuentra
    },

    // Operaciones de escritura (deben ser async si usan storage)
    createItem: async (itemData) => {
      // self._internalCreateItem ya debería devolver una copia y manejar el storage
      return await self._internalCreateItem(itemData);
    },

    updateItem: async (id, updateData) => {
      return await self._internalUpdateItem(id, updateData);
    },

    deleteItem: async (id) => {
      return await self._internalDeleteItem(id);
    }
    // Puedes añadir aquí métodos específicos para guardar/cargar configuraciones
    // si los widgets de configuración los necesitan.
    // saveSetting: async (key, value) => { ... },
    // loadSetting: async (key, defaultValue) => { ... },
  };
},

// Métodos internos que realmente modifican los datos
async _internalCreateItem(itemData) {
  const newItem = {
    id: Date.now().toString(), // Usar un generador de UUIDs más robusto en producción
    ...itemData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString() // Añadir updatedAt también en creación
  };

  this._items.push(newItem);
  await this._saveDataToStorage(); // ⚠️ Persistir cambios
  // Publicar evento si es necesario (ej. this._core.events.publish(...))
  return { ...newItem }; // Devolver copia
},

async _internalUpdateItem(id, updateData) {
  const index = this._items.findIndex(item => item.id === id);
  if (index === -1) {
    // Considerar devolver un error o un objeto que indique el fallo
    console.error(`[${this.id}] Item con ID ${id} no encontrado para actualizar.`);
    throw new Error(`Item con ID ${id} no encontrado`); // O manejar de otra forma
  }

  // Evitar sobreescribir el ID o createdAt
  const { id: _id, createdAt: _createdAt, ...restOfUpdateData } = updateData;

  this._items[index] = {
    ...this._items[index],
    ...restOfUpdateData, // Aplicar solo los datos actualizables
    updatedAt: new Date().toISOString()
  };

  await this._saveDataToStorage();
  // Publicar evento si es necesario
  return { ...this._items[index] }; // Devolver copia
},

async _internalDeleteItem(id) {
  const index = this._items.findIndex(item => item.id === id);
  if (index === -1) {
    console.error(`[${this.id}] Item con ID ${id} no encontrado para eliminar.`);
    throw new Error(`Item con ID ${id} no encontrado`);
  }

  const deletedItem = this._items.splice(index, 1)[0];
  await this._saveDataToStorage();
  // Publicar evento si es necesario
  return { ...deletedItem }; // Devolver copia
}
```

## Estilos y temas

### Sistema de temas de Atlas

Atlas utiliza un sistema de temas basado en variables CSS que permite a los plugins adaptarse automáticamente a diferentes esquemas de colores. Todos los plugins deben usar estas variables en lugar de colores directos para garantizar una apariencia coherente.

```javascript
// Ejemplo de componente con estilos adaptados al tema
function ThemeAwareComponent() {
  return React.createElement(
    "div",
    {
      style: {
        backgroundColor: "var(--card-bg)",
        color: "var(--text-color)",
        border: "1px solid var(--border-color)",
        padding: "var(--spacing-md)",
        borderRadius: "var(--border-radius-md)",
      },
    },
    "Este componente se adapta automáticamente al tema"
  );
}
```

### Variables CSS disponibles

Las variables CSS de Atlas están organizadas por categorías:

#### Colores y apariencia

```css
/* Colores primarios y de acento */
--primary-color        /* Color principal de la aplicación */
--primary-hover        /* Versión hover del color principal */
--secondary-color      /* Color secundario */
--success-color        /* Color para acciones exitosas */
--warning-color        /* Color para advertencias */
--danger-color         /* Color para errores o acciones peligrosas */
--info-color           /* Color para información */

/* Fondos y texto */
--bg-color             /* Color de fondo principal */
--bg-color-secondary   /* Color de fondo secundario */
--text-color           /* Color de texto principal */
--text-color-secondary /* Color de texto secundario */

/* Componentes UI */
--header-bg            /* Fondo de encabezado */
--sidebar-bg           /* Fondo de barra lateral */
--card-bg              /* Fondo de tarjetas */
--modal-bg             /* Fondo de ventanas modales */
--input-bg             /* Fondo de campos de entrada */
--border-color         /* Color de bordes */
--hover-color          /* Color para estados hover */

/* Botones */
--color-button-primary-bg     /* Fondo de botones primarios */
--color-button-primary-text   /* Texto de botones primarios */
--color-button-primary-hover  /* Hover de botones primarios */
--color-button-secondary-bg   /* Fondo de botones secundarios */
--color-button-secondary-text /* Texto de botones secundarios */
```

#### Espaciado y dimensiones

```css
/* Espaciado */
--spacing-xs           /* Espaciado extra pequeño (0.25rem) */
--spacing-sm           /* Espaciado pequeño (0.5rem) */
--spacing-md           /* Espaciado medio (1rem) */
--spacing-lg           /* Espaciado grande (1.5rem) */
--spacing-xl           /* Espaciado extra grande (2rem) */

/* Radios de borde */
--border-radius-sm     /* Radio pequeño (0.25rem) */
--border-radius-md     /* Radio medio (0.375rem) */
--border-radius-lg     /* Radio grande (0.5rem) */
--border-radius-xl     /* Radio extra grande (0.75rem) */

/* Sombras */
--shadow-sm            /* Sombra pequeña */
--shadow-md            /* Sombra media */
--shadow-lg            /* Sombra grande */
--shadow-xl            /* Sombra extra grande */
```

#### Tipografía

```css
/* Familias de fuentes */
--font-family-heading  /* Fuente para encabezados */
--font-family-body     /* Fuente para texto general */
--font-family-mono     /* Fuente monoespaciada */
```

#### Transiciones y animaciones

```css
/* Transiciones */
--transition-fast      /* Transición rápida (0.15s) */
--transition-normal    /* Transición normal (0.25s) */
--transition-slow      /* Transición lenta (0.4s) */
```

### Adaptación a diferentes temas

Para garantizar que tu plugin se vea bien en todos los temas, sigue estas pautas:

1.  **Usa siempre variables CSS** en lugar de colores directos:

    ```css
    /* Mal */
    .mi-componente {
      background-color: #ffffff;
      color: #333333;
      border: 1px solid #dddddd;
    }

    /* Bien */
    .mi-componente {
      background-color: var(--card-bg);
      color: var(--text-color);
      border: 1px solid var(--border-color);
    }
    ```

2.  **Considera diferentes modos de color**:

    El sistema de temas de Atlas incluye temas claros y oscuros. Asegúrate de que tu UI sea legible en ambos modos.

3.  **Prueba tu plugin en diferentes temas**:

    Verifica que tu plugin luce bien en todos los temas disponibles de Atlas, especialmente en los temas predeterminados y cualquier tema de alto contraste.

### Buenas prácticas de CSS

1.  **Aislar los estilos CSS de tu plugin para evitar conflictos:**
    Para asegurar que los estilos de tu plugin no interfieran con otros plugins o con la aplicación principal (por ejemplo, Atlas), es crucial que todas tus reglas CSS estén **contenidas bajo una clase principal específica de tu plugin**. Esta clase principal actúa como un "prefijo" o "namespace" para tus estilos.

    Por ejemplo, si el contenedor principal de tu panel de configuración es `.event-counter-settings-panel`, tradicionalmente cualquier estilo interno debería seguir este patrón:

    ```css
    /* Forma tradicional de prefijar */
    .event-counter-settings-panel .settings-right-column {
      position: sticky;
    }
    .event-counter-settings-panel .settings-title {
      font-size: 28px;
    }
    ```

    Así, una clase como `.settings-right-column` definida por otro plugin o por Atlas no se verá afectada por tus estilos.

    **La forma moderna y recomendada de lograr este aislamiento directamente en CSS, sin repetir constantemente la clase principal, es mediante el Anidamiento CSS Nativo (CSS Nesting).** Esta característica te permite escribir la clase principal una sola vez y luego "envolver" o anidar todas las demás reglas CSS dentro de ella.

    Así se vería utilizando Anidamiento CSS Nativo:

    ```css
    .event-counter-settings-panel {
      /* Estilos base del panel (clase principal) */
      background: var(--card-bg, #ffffff);
      padding: var(--spacing-lg);
      border-radius: var(--border-radius-md);
      /* ...otros estilos del panel... */

      /* Todos los estilos internos van anidados aquí */
      .settings-right-column {
        position: sticky;
        top: var(--spacing-md);
      }

      .settings-title {
        font-size: 28px;
        color: var(--text-color);
        margin-bottom: var(--spacing-md);
      }

      /* Y así con todas las demás clases internas del plugin */
      .form-group {
        margin-bottom: var(--spacing-sm);
      }

      /* Ejemplo con una pseudo-clase usando el selector de padre '&' */
      .some-button {
        background-color: var(--primary-color);
        color: var(--color-button-primary-text);
        padding: var(--spacing-sm) var(--spacing-md);
        border: none;
        border-radius: var(--border-radius-sm);
        cursor: pointer;

        &:hover {
          background-color: var(--primary-hover);
        }
      }

      /* También puedes anidar media queries */
      @media (max-width: 768px) {
        .settings-title {
          font-size: 24px;
        }
        .settings-right-column {
          position: static; /* Cambiar comportamiento en móviles */
        }
      }
    }
    ```

    **Importante:** El Anidamiento CSS Nativo es una característica relativamente nueva. Asegúrate de verificar su compatibilidad con los navegadores que necesitas soportar ([caniuse.com/#feat=css-nesting](https://caniuse.com/#feat=css-nesting)). Si la compatibilidad con navegadores más antiguos es un requisito, podrías necesitar herramientas como PostCSS para transformar este CSS moderno a uno más compatible, o considerar SASS/SCSS que ofrecen funcionalidades de anidamiento desde hace mucho tiempo y compilan a CSS estándar.

    Este enfoque mantiene tus estilos organizados, con el alcance (scope) correcto, y reduce significativamente la repetición en tu código CSS, haciéndolo más legible y fácil de mantener.

2.  **Evita selectores demasiado genéricos** que puedan afectar a otros plugins o al núcleo de Atlas:

    ```css
    /* Mal - selector demasiado genérico que podría afectar a toda la aplicación */
    div {
      padding: 10px;
    }
    .button {
      background-color: blue;
    }

    /* Bien - selectores específicos, preferiblemente anidados como se muestra arriba */
    .mi-plugin-container div {
      /* Aún mejor si 'div' tiene una clase más específica */
      padding: 10px;
    }
    .mi-plugin-container .mi-plugin-button {
      background-color: blue;
    }
    ```

3.  **Aprovecha las variables CSS de Atlas**:
    Utiliza las [Variables CSS disponibles](#variables-css-disponibles) para colores, espaciado, tipografía, etc. Esto asegura que tu plugin se integre visualmente con el tema actual de Atlas y se adapte a los cambios de tema (claro/oscuro).

4.  **Considera la accesibilidad**:

    - Mantén suficiente contraste entre texto y fondo (las variables de tema de Atlas suelen ayudar con esto).
    - No dependas solo del color para transmitir información importante.
    - Asegúrate de que los elementos interactivos sean claramente identificables y tengan estados `focus` visibles.

5.  **Organiza tus estilos**:
    Si tu plugin tiene muchos estilos, considera dividirlos en archivos más pequeños o usar comentarios para estructurar tu CSS. Un archivo `styles/plugin-styles.css` es un buen punto de partida.

    ```css
    /* Ejemplo de organización de CSS en un archivo */

    /* --- Estilos Generales del Plugin --- */
    .mi-plugin-nombre-contenedor-principal {
      /* ... */
    }

    /* --- Componentes Específicos --- */

    /* Componente Tarjeta */
    .mi-plugin-nombre-contenedor-principal {
      .card-component {
        /* ... */
        .card-header {
          /* ... */
        }
        .card-body {
          /* ... */
        }
      }
    }

    /* Componente Botón (si no usas uno genérico) */
    .mi-plugin-nombre-contenedor-principal {
      .custom-button {
        /* ... */
        &:hover {
          /* ... */
        }
        &--primary {
          /* ... */
        }
      }
    }

    /* --- Modificadores y Estados --- */
    .mi-plugin-nombre-contenedor-principal {
      .elemento--activo {
        /* ... */
      }
      .elemento--deshabilitado {
        /* ... */
      }
    }

    /* --- Media Queries / Responsividad --- */
    .mi-plugin-nombre-contenedor-principal {
      @media (max-width: 600px) {
        .card-component {
          /* Ajustes para pantallas pequeñas */
        }
      }
    }
    ```

## Dependencias y conflictos

### Manejo de dependencias

Puedes especificar dependencias de otros plugins:

```javascript
// Dependencias
dependencies: ["plugin-requerido", { id: "otro-plugin", version: "1.2.0" }];
```

El sistema se asegurará de que:

1. Las dependencias se carguen antes que tu plugin
2. Solo se active tu plugin si todas sus dependencias están activas
3. Las versiones de las dependencias sean compatibles con las requeridas

### Resolución de conflictos

También puedes declarar conflictos con otros plugins:

```javascript
// Conflictos
conflicts: [
  "plugin-incompatible",
  {
    id: "otro-plugin-problematico",
    reason: "Usa los mismos recursos y causa conflictos",
  },
];
```

El sistema evitará activar tu plugin si hay conflictos activos, mostrando al usuario los motivos.

### Resolver ciclos de dependencias

El sistema detecta y resuelve automáticamente ciclos de dependencias. Si dos plugins dependen uno del otro, el sistema romperá el ciclo y determinará un orden de carga seguro.

## Empaquetado y distribución

### Estructura del paquete

Para distribuir tu plugin:

1. Organiza tu código en una estructura clara:

   ```
   mi-plugin/
   ├── index.js        // Punto de entrada principal
   ├── components/     // Componentes React
   ├── utils/          // Utilidades
   ├── styles/         // Estilos (si los hay)
   └── README.md       // Documentación
   ```

2. El sistema generará un paquete con:
   - Manifiesto con metadatos del plugin
   - Checksums para verificación de integridad
   - Firma digital opcional para autenticidad

### Verificación de integridad

Atlas verifica la integridad de los plugins antes de instalarlos:

1. Validación de checksums para cada archivo
2. Verificación de firma digital (si está presente)
3. Comprobación de compatibilidad con la versión actual
4. Validación de permisos y dependencias

Si un plugin falla la verificación, no se instalará y se mostrará un mensaje al usuario.

### Repositorios de plugins

Los plugins pueden distribuirse a través de repositorios:

1. **Repositorio oficial**: Controlado por los desarrolladores de Atlas
2. **Repositorios de comunidad**: Mantenidos por la comunidad
3. **Repositorios privados**: Para organizaciones específicas

Configuración de un repositorio:

```javascript
const repositorio = {
  id: "mi-repositorio",
  name: "Mi Repositorio de Plugins",
  url: "https://mi-sitio.com/plugins",
  apiEndpoint: "https://api.mi-sitio.com/plugins",
  description: "Repositorio personal de plugins",
  official: false,
  enabled: true,
};
```

### Actualizaciones automáticas

El sistema puede verificar y aplicar actualizaciones automáticamente:

1. Comprobación periódica de actualizaciones
2. Notificación al usuario sobre nuevas versiones
3. Descarga e instalación con verificación de integridad
4. Actualización en caliente sin reiniciar la aplicación

Configuración de actualizaciones:

```javascript
const updateSettings = {
  checkAutomatically: true, // Verificar automáticamente
  checkInterval: 86400000, // Cada 24 horas
  autoUpdate: false, // No actualizar automáticamente
  updateNotificationsEnabled: true, // Mostrar notificaciones
};
```

## Mejores prácticas

### Manejo asíncrono de datos

⚠️ **PATRONES CRÍTICOS** para operaciones asíncronas:

1. **Init asíncrono para almacenamiento**:

```javascript
// ⚠️ RECOMENDADO: Init asíncrono
init: async function(core) {
  const self = this;

  try {
    self._core = core;

    // ⚠️ Cargar datos primero
    await self._loadDataFromStorage();

    // Luego configurar el resto
    self._setupEventListeners();
    self._registerUIExtensions();

    if (self.publicAPI) {
      core.plugins.registerAPI(self.id, self.publicAPI);
    }

    return true;
  } catch (error) {
    console.error(`[${self.name}] Error de inicialización:`, error);
    return false;
  }
}
```

2. **Manejo correcto del contexto `this`**:

```javascript
// ⚠️ PROBLEMA: contexto 'this' perdido en callbacks
init: function(core) {
  this._core = core;

  core.storage.getItem(this.id, 'data', null)
    .then(function(data) {
      // ¡Error! 'this' no se refiere al plugin aquí
      this._data = data; // 'this' es undefined o window
    });
}

// ✅ SOLUCIÓN 1: Guardar 'this' en una variable
init: function(core) {
  const self = this;
  this._core = core;

  core.storage.getItem(this.id, 'data', null)
    .then(function(data) {
      self._data = data; // Funciona correctamente
    });
}

// ✅ SOLUCIÓN 2: Usar funciones flecha (recomendado)
init: function(core) {
  this._core = core;

  core.storage.getItem(this.id, 'data', null)
    .then((data) => {
      this._data = data; // Funciona correctamente
    });
}

// ✅ SOLUCIÓN 3: Async/await (más limpio)
init: async function(core) {
  try {
    this._core = core;

    const data = await core.storage.getItem(this.id, 'data', null);
    this._data = data;

    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}
```

3. **Implementación por etapas para tareas complejas**:

```javascript
init: async function(core) {
  const self = this;

  try {
    // Paso 1: Configuración básica
    self._core = core;
    self._subscriptions = [];
    self._extensionIds = {};

    // Paso 2: Cargar datos
    await self._loadDataFromStorage();

    // Paso 3: Configurar dependencias de datos
    await self._setupDataDependentFeatures();

    // Paso 4: Registrar UI
    self._registerUIExtensions();

    // Paso 5: API pública
    if (self.publicAPI) {
      core.plugins.registerAPI(self.id, self.publicAPI);
    }

    return true;
  } catch (error) {
    console.error(`[${self.name}] Error en inicialización:`, error);
    return false;
  }
}
```

### Gestión de errores robusta

Una buena gestión de errores es crucial para plugins estables:

1. **Usa bloques try/catch**:

```javascript
try {
  // Código que podría fallar
} catch (error) {
  console.error(`[${this.name}] Error:`, error);
  // Manejar el error apropiadamente
}
```

2. **Valida datos antes de usarlos**:

```javascript
// ⚠️ Malo: Acceso directo sin validación
function processData(data) {
  const result = data.items.filter((item) => item.active);
  return result;
}

// ✅ Bueno: Validación antes de uso
function processData(data) {
  if (!data || !Array.isArray(data.items)) {
    console.warn("Datos inválidos, usando valores predeterminados");
    return [];
  }

  const result = data.items.filter((item) => item.active === true);
  return result;
}
```

3. **Proporciona valores por defecto**:

```javascript
// Rescate con valores predeterminados
function getConfig() {
  try {
    return this._data.configuracion || {};
  } catch (error) {
    console.warn(
      "Error al obtener configuración, usando valores predeterminados"
    );
    return {};
  }
}
```

4. **Maneja errores asíncronos**:

```javascript
// Manejo de promesas con catch
core.storage
  .getItem(this.id, "data")
  .then(function (data) {
    // Usar datos
  })
  .catch(function (error) {
    console.error("Error al obtener datos:", error);
    // Manejar el error
  });
```

### Prevención de errores comunes

⚠️ **ERRORES FRECUENTES** y cómo evitarlos:

1. **Problema**: Usar `async/await` directamente en la definición de funciones de objeto:

```javascript
// ❌ Incorrecto: Puede causar errores de sintaxis en algunos entornos
{
  init: async function(core) { /* ... */ }
}

// ✅ Correcto: Usar async dentro de la función
{
  init: function(core) {
    return new Promise(async (resolve) => {
      try {
        // Código asíncrono aquí
        await this._loadData();
        resolve(true);
      } catch (error) {
        console.error('Error:', error);
        resolve(false);
      }
    });
  }
}

// ✅ Alternativa (más simple y moderna):
{
  init: async function(core) {
    try {
      await this._loadData();
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  }
}
```

2. **Problema**: No verificar si los objetos existen antes de acceder a sus propiedades:

```javascript
// ❌ Incorrecto: Acceso sin verificación
function doSomething(props) {
  const count = props.data.items.length; // Error si props.data es undefined
}

// ✅ Correcto: Verificar antes de acceder
function doSomething(props) {
  if (props && props.data && Array.isArray(props.data.items)) {
    const count = props.data.items.length;
    // continuar
  } else {
    // manejar caso donde props.data.items no existe
  }
}

// ✅ Alternativa concisa (si el entorno lo soporta)
function doSomething(props) {
  const count = props?.data?.items?.length || 0;
  // continuar
}
```

3. **Problema**: No incluir key props en listas de React:

```javascript
// ❌ Incorrecto: Sin key props
function MiLista(props) {
  return React.createElement(
    "ul",
    {},
    props.items.map(
      (item) => React.createElement("li", {}, item.name) // ⚠️ Falta key
    )
  );
}

// ✅ Correcto: Con key props únicas
function MiLista(props) {
  return React.createElement(
    "ul",
    {},
    props.items.map((item, index) =>
      React.createElement(
        "li",
        { key: item.id || index }, // ✅ Key única
        item.name
      )
    )
  );
}
```

4. **Problema**: Inicialización insegura en componentes React:

```javascript
// ❌ Incorrecto: Asume que plugin.publicAPI existe
function Dashboard(props) {
  const [stats, setStats] = React.useState(props.plugin.publicAPI.getStats());
  // ...
}

// ✅ Correcto: Inicialización segura con valores predeterminados
function Dashboard(props) {
  const getInitialStats = () => {
    try {
      return props.plugin?.publicAPI?.getStats() || { count: 0 };
    } catch (e) {
      return { count: 0 };
    }
  };

  const [stats, setStats] = React.useState(getInitialStats());
  // ...
}
```

5. **Problema**: No limpiar recursos adecuadamente:

```javascript
// ❌ Incorrecto: Suscripción sin limpieza
React.useEffect(() => {
  const subscription = props.core.events.subscribe("event", handleEvent);
  // Sin función de limpieza
}, []);

// ✅ Correcto: Limpieza adecuada
React.useEffect(() => {
  const subscription = props.core.events.subscribe("event", handleEvent);

  return () => {
    if (typeof subscription === "function") {
      subscription(); // Cancelar suscripción al desmontar
    }
  };
}, []);
```

6. **Problema**: No usar el patrón Wrapper correctamente:

```javascript
// ❌ Incorrecto: Registrar componente directamente
core.ui.registerExtension(
  pluginId,
  zone,
  MiComponente, // Componente no tendrá acceso al plugin
  options
);

// ✅ Correcto: Usar patrón Wrapper
const ComponentWrapper = this._createComponentWrapper(MiComponente);
core.ui.registerExtension(
  pluginId,
  zone,
  ComponentWrapper, // Wrapper inyecta dependencias
  options
);
```

7. **Problema**: pageId no coincide en navegación:

```javascript
// ❌ Incorrecto: pageId diferentes
// En registro de página:
props: {
  pageId: "mi-pagina";
}

// En navegación:
props.onNavigate(pluginId, "mi-pagina-principal"); // ¡No coincide!

// ✅ Correcto: Usar constante
const PAGE_ID = "mi-pagina-principal";

// En registro:
props: {
  pageId: PAGE_ID;
}

// En navegación:
props.onNavigate(pluginId, PAGE_ID);
```

### Optimización de rendimiento

Para crear plugins eficientes:

1. **Minimiza las suscripciones a eventos**:

```javascript
// Mejor: Suscribirse solo a eventos necesarios
_setupEventListeners: function() {
  // Suscribirse solo a eventos específicos
  this._subscriptions.push(
    this._core.events.subscribe(
      this.id,
      'calendar.eventCreated',
      this._handleEventChange.bind(this)
    )
  );
}
```

2. **Memoiza valores o componentes** en React:

```javascript
// Usar useMemo para cálculos costosos
function MyComponent(props) {
  const expensiveResult = React.useMemo(() => {
    return computeExpensiveValue(props.data);
  }, [props.data]);

  return React.createElement("div", {}, expensiveResult);
}
```

3. **Evita renderizados innecesarios**:

```javascript
// Evitar recrear funciones en cada renderizado
function MyComponent() {
  // ❌ Mal: Se crea una nueva función en cada renderizado
  return React.createElement(
    "button",
    { onClick: () => handleClick() },
    "Click me"
  );

  // ✅ Bien: Usar useCallback
  const handleButtonClick = React.useCallback(() => {
    handleClick();
  }, []);

  return React.createElement(
    "button",
    { onClick: handleButtonClick },
    "Click me"
  );
}
```

4. **Carga perezosa de recursos pesados**:

```javascript
// Cargar grandes conjuntos de datos solo cuando sea necesario
function UserList() {
  const [users, setUsers] = React.useState([]);
  const [loaded, setLoaded] = React.useState(false);

  const loadUsers = () => {
    if (!loaded) {
      fetchUsers().then((data) => {
        setUsers(data);
        setLoaded(true);
      });
    }
  };

  return React.createElement("div", {}, [
    !loaded &&
      React.createElement(
        "button",
        { key: "load", onClick: loadUsers },
        "Cargar usuarios"
      ),
    loaded && React.createElement(UserTable, { key: "table", users: users }),
  ]);
}
```

## Depuración

### Técnicas de depuración

Para depurar tu plugin de manera efectiva:

1. **Uso de console.log con prefijo**:

```javascript
function log(message, data) {
  console.log(`[${this.name || this.id}] ${message}`, data);
}

function error(message, err) {
  console.error(`[${this.name || this.id}] ${message}`, err);
}
```

2. **Inspección del estado del plugin**:

```javascript
// Para ver el estado completo del plugin
console.log(`[${this.name}] Estado actual:`, JSON.parse(JSON.stringify(this)));

// Para ver una versión limpia para inspección
console.log(`[${this.name}] Datos:`, {
  configuracion: this._data.configuracion,
  contador: this._data.contador,
  eventos: this._data.registroEventos?.length || 0,
});
```

3. **Depuración de componentes React**:

```javascript
function DebugComponent(props) {
  console.log("Renderizando con props:", props);

  // Depurar ciclo de vida
  React.useEffect(() => {
    console.log("Componente montado");
    return () => {
      console.log("Componente desmontado");
    };
  }, []);

  return React.createElement("div", {}, "Componente");
}
```

4. **Monitoreo de eventos**:

```javascript
// Función para monitorear eventos en el sistema
function monitorEvents(core, eventPattern) {
  return core.events.subscribe(
    "debug-monitor",
    eventPattern || "*",
    function (data, eventName, pluginId) {
      console.log(`[Event] ${pluginId} → ${eventName}`, data);
    }
  );
}

// Usar en depuración
const unsubscribe = monitorEvents(core, "calendar.*");
// Cuando termines:
unsubscribe();
```

5. **Depuración del sistema de eventos del calendario**:

El EventBus ahora incluye logs de depuración automáticos. Cuando se publican eventos, verás en la consola:

```
[EventBus] Publicando evento: calendar.eventCreated {...}
[EventBus] Notificando a 3 suscriptores de calendar.eventCreated
```

Si un evento no funciona como esperas, puedes verificar:

- Si el evento se está publicando (busca los logs `[EventBus]`)
- Cuántos suscriptores tiene el evento
- Si hay errores en los manejadores de eventos

### Errores comunes y soluciones

⚠️ **ERRORES FRECUENTES** y sus soluciones:

1. **Error**: `Cannot read property 'X' of undefined`

   **Solución**: Verificar que los objetos existen antes de acceder a sus propiedades.

   ```javascript
   // ❌ Incorrecto
   const value = obj.prop.deepProp;

   // ✅ Correcto
   const value = obj && obj.prop ? obj.prop.deepProp : undefined;

   // ✅ Alternativa (si el entorno lo soporta)
   const value = obj?.prop?.deepProp;
   ```

2. **Error**: `this` es `undefined` en callbacks

   **Solución**: Guardar referencia a `this` o usar funciones flecha.

   ```javascript
   // ✅ Guardar 'this'
   const self = this;
   someFunction(function () {
     self.doSomething();
   });

   // ✅ O usar arrow function
   someFunction(() => {
     this.doSomething();
   });
   ```

3. **Error**: No se cancelan suscripciones a eventos

   **Solución**: Mantener referencias a las funciones de cancelación y usarlas.

   ```javascript
   init: function(core) {
     this._subscriptions = [];

     this._subscriptions.push(
       core.events.subscribe(this.id, 'event', this._handler)
     );

     return true;
   },

   cleanup: function() {
     // Cancelar todas las suscripciones
     this._subscriptions.forEach(unsub => {
       if (typeof unsub === 'function') unsub();
     });

     return true;
   }
   ```

4. **Error**: Estado de React no se actualiza

   **Solución**: Verificar dependencias en useEffect y estructura de datos.

   ```javascript
   // ❌ Incorrecto
   React.useEffect(() => {
     fetchData().then(setData);
   }, []); // Falta dependencia

   // ✅ Correcto
   React.useEffect(() => {
     fetchData().then(setData);
   }, [fetchData]); // Incluye todas las dependencias
   ```

5. **Error**: Manejo incorrecto de promesas

   **Solución**: Usar correctamente then/catch o async/await.

   ```javascript
   // ❌ Incorrecto
   function saveData() {
     core.storage.setItem(id, "data", data);
     // Continúa sin esperar a que termine la operación
     doNextThing();
   }

   // ✅ Correcto con then/catch
   function saveData() {
     core.storage
       .setItem(id, "data", data)
       .then(() => {
         doNextThing();
       })
       .catch((error) => {
         console.error("Error al guardar:", error);
       });
   }

   // ✅ Correcto con async/await
   async function saveData() {
     try {
       await core.storage.setItem(id, "data", data);
       doNextThing();
     } catch (error) {
       console.error("Error al guardar:", error);
     }
   }
   ```

6. **Error**: Los eventos del calendario no se reciben

   **Solución**: Verificar que estás suscrito a los nombres correctos de eventos.

   ```javascript
   // ✅ Los nombres correctos de eventos son:
   "calendar.eventCreated"; // NO 'calendar.create'
   "calendar.eventUpdated"; // NO 'calendar.update'
   "calendar.eventDeleted"; // NO 'calendar.delete'
   "calendar.eventsLoaded"; // Cuando se cargan todos los eventos

   // ✅ Ejemplo correcto:
   core.events.subscribe(pluginId, "calendar.eventUpdated", function (data) {
     // data contiene { oldEvent, newEvent }
     console.log("Evento actualizado de:", data.oldEvent);
     console.log("a:", data.newEvent);
   });
   ```

7. **Error**: "La página del plugin no se muestra"

   **Causa**: El `pageId` en el registro no coincide con el usado en navegación.

   **Solución**: Usar exactamente el mismo `pageId`:

   ```javascript
   // ✅ Definir constante
   const PAGE_ID = "mi-pagina-principal";

   // ✅ En registro de página:
   core.ui.registerExtension(
     pluginId,
     core.ui.getExtensionZones().PLUGIN_PAGES,
     PageWrapper,
     {
       order: 100,
       props: { pageId: PAGE_ID }, // ✅ Usar constante
     }
   );

   // ✅ En navegación:
   props.onNavigate(props.pluginId, PAGE_ID); // ✅ Misma constante
   ```

8. **Error**: "Warning: Each child in a list should have a unique 'key' prop"

   **Solución**: Añadir key props únicas a elementos de lista:

   ```javascript
   // ✅ Correcto: Key props en listas
   Object.keys(VIDEO_STATUS).map((statusKey) =>
     React.createElement(
       "option",
       {
         key: VIDEO_STATUS[statusKey], // ✅ Key única obligatoria
         value: VIDEO_STATUS[statusKey],
       },
       statusKey
     )
   );
   ```

## Ejemplos prácticos

### Plugin simple con extensión de calendario

```javascript
import React from "react";

export default {
  id: "calendario-notificador",
  name: "Notificador de Eventos",
  version: "1.0.0",
  description: "Añade notificaciones visuales al calendario",
  author: "Tu Nombre",
  minAppVersion: "0.3.0",
  maxAppVersion: "1.0.0",
  permissions: ["storage", "events", "ui"],

  _core: null,
  _settings: {
    notificationColor: "#FF5722",
    showInHeaders: true,
    showInCells: true,
  },
  _subscriptions: [],
  _extensionIds: {},

  init: async function (core) {
    try {
      this._core = core;

      // Cargar configuración
      await this._loadSettings();

      // Registrar extensiones UI
      this._registerUIExtensions();

      // Registrar en panel de configuración
      this._registerSettingsPanel();

      // Suscribirse a eventos
      this._setupEventListeners();

      return true;
    } catch (error) {
      console.error("[Notificador] Error al inicializar:", error);
      return false;
    }
  },

  cleanup: async function () {
    try {
      // Guardar configuración
      await this._saveSettings();

      // Cancelar suscripciones a eventos
      this._subscriptions.forEach((unsub) => {
        if (typeof unsub === "function") unsub();
      });

      // Limpiar extensiones de UI (importante para evitar errores al recargar)
      Object.entries(this._extensionIds).forEach(([key, extensionId]) => {
        if (extensionId) {
          this._core.ui.removeExtension(this.id, extensionId);
        }
      });
      this._extensionIds = {};

      return true;
    } catch (error) {
      console.error("[Notificador] Error al limpiar:", error);
      return false;
    }
  },

  _loadSettings: async function () {
    try {
      const savedSettings = await this._core.storage.getItem(
        this.id,
        "settings",
        null
      );

      if (savedSettings) {
        this._settings = { ...this._settings, ...savedSettings };
      }
    } catch (error) {
      console.error("[Notificador] Error al cargar configuración:", error);
    }
  },

  _saveSettings: async function () {
    try {
      await this._core.storage.setItem(this.id, "settings", this._settings);
    } catch (error) {
      console.error("[Notificador] Error al guardar configuración:", error);
    }
  },

  _setupEventListeners: function () {
    // Suscribirse a eventos del calendario
    const eventCreatedSub = this._core.events.subscribe(
      this.id,
      "calendar.eventCreated",
      this._handleEventChanged.bind(this)
    );

    const eventUpdatedSub = this._core.events.subscribe(
      this.id,
      "calendar.eventUpdated",
      this._handleEventChanged.bind(this)
    );

    const eventDeletedSub = this._core.events.subscribe(
      this.id,
      "calendar.eventDeleted",
      this._handleEventChanged.bind(this)
    );

    this._subscriptions.push(eventCreatedSub, eventUpdatedSub, eventDeletedSub);
  },

  _handleEventChanged: function (data) {
    // Aquí podrías procesar los cambios de eventos
    // Para este plugin, las extensiones UI reaccionan automáticamente
    // (o se fuerzan a re-renderizar si es necesario)
    console.log("[Notificador] Evento del calendario recibido:", data);
    // Forzar re-renderizado de extensiones si es necesario
    // Esto es un ejemplo, en la práctica podría ser más selectivo
    if (this._extensionIds.dayHeader)
      this._core.ui.rerenderExtension(this.id, this._extensionIds.dayHeader);
    if (this._extensionIds.hourCell)
      this._core.ui.rerenderExtension(this.id, this._extensionIds.hourCell);
  },

  _createComponentWrapper: function (Component, extraProps = {}) {
    const self = this;

    return function ComponentWrapper(propsFromAtlas) {
      return React.createElement(Component, {
        ...propsFromAtlas,
        plugin: self,
        core: self._core,
        pluginId: self.id,
        settings: self._settings, // Pasar settings a los componentes
        ...extraProps,
      });
    };
  },

  _registerUIExtensions: function () {
    const self = this;

    // Crear componente para encabezados de día
    function DayHeaderExtension(props) {
      // props incluye settings ahora
      const [eventCount, setEventCount] = React.useState(0);

      React.useEffect(() => {
        const calendar = props.core.getModule("calendar");
        if (!calendar) return;
        const eventsForDay = calendar.getEventsForDate(props.date);
        setEventCount(eventsForDay.length);
      }, [props.date, props.core]); // props.core para estabilidad de useEffect

      if (eventCount === 0 || !props.settings.showInHeaders) return null;

      return React.createElement(
        "span",
        {
          className: `${self.id}-notification-badge`, // Clase específica del plugin
          style: {
            backgroundColor: props.settings.notificationColor,
            color: "white",
            borderRadius: "50%",
            padding: "2px 6px",
            fontSize: "11px",
            marginLeft: "4px",
          },
        },
        eventCount
      );
    }

    // Crear componente para celdas de hora
    function HourCellExtension(props) {
      // props incluye settings ahora
      const [hasEvent, setHasEvent] = React.useState(false);

      React.useEffect(() => {
        const calendar = props.core.getModule("calendar");
        if (!calendar) return;
        const eventsForDay = calendar.getEventsForDate(props.date);
        const eventsInHour = eventsForDay.filter((event) => {
          const eventStart = new Date(event.start);
          return (
            eventStart.getHours() === props.hour &&
            eventStart.getMinutes() === props.minutes
          );
        });
        setHasEvent(eventsInHour.length > 0);
      }, [props.date, props.hour, props.minutes, props.core]); // props.core para estabilidad

      if (!hasEvent || !props.settings.showInCells) return null;

      return React.createElement("div", {
        className: `${self.id}-hour-notification-indicator`, // Clase específica del plugin
        style: {
          position: "absolute",
          top: "2px",
          right: "2px",
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          backgroundColor: props.settings.notificationColor,
        },
      });
    }

    // Registrar extensión para encabezados de día
    this._extensionIds.dayHeader = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().CALENDAR_DAY_HEADER,
      this._createComponentWrapper(DayHeaderExtension),
      { order: 100 }
    );

    // Registrar extensión para celdas de hora
    this._extensionIds.hourCell = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().CALENDAR_HOUR_CELL,
      this._createComponentWrapper(HourCellExtension),
      { order: 100 }
    );
  },

  _registerSettingsPanel: function () {
    const self = this;

    // Crear componente para panel de configuración
    function SettingsPanelComponent(props) {
      // Renombrado para evitar conflicto de nombres
      const [currentSettings, setCurrentSettings] = React.useState({
        ...props.settings,
      });

      const handleSettingChange = (key, value) => {
        const newSettings = { ...currentSettings, [key]: value };
        setCurrentSettings(newSettings);
        self._settings = newSettings; // Actualizar settings del plugin
        self._saveSettings(); // Guardar inmediatamente
        // Forzar re-renderizado de extensiones UI afectadas
        if (self._extensionIds.dayHeader)
          self._core.ui.rerenderExtension(
            self.id,
            self._extensionIds.dayHeader
          );
        if (self._extensionIds.hourCell)
          self._core.ui.rerenderExtension(self.id, self._extensionIds.hourCell);
      };

      return React.createElement(
        "div",
        {
          className: `${self.id}-settings-panel settings-widget`, // Clase específica y genérica
          style: {
            padding: "var(--spacing-md)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--border-radius-md)",
            backgroundColor: "var(--card-bg)",
          },
        },
        [
          React.createElement(
            "h3",
            {
              key: "title",
              style: {
                color: "var(--text-color)",
                marginTop: 0,
                marginBottom: "var(--spacing-md)",
              },
            },
            "Configuración de Notificaciones"
          ),

          React.createElement(
            "div",
            {
              key: "color",
              className: "settings-group",
              style: {
                marginBottom: "var(--spacing-md)",
                display: "flex",
                alignItems: "center",
              },
            },
            [
              React.createElement(
                "label",
                {
                  key: "label",
                  htmlFor: `${self.id}-color-input`,
                  style: {
                    marginRight: "var(--spacing-sm)",
                    color: "var(--text-color-secondary)",
                  },
                },
                "Color de notificación:"
              ),
              React.createElement("input", {
                key: "input",
                id: `${self.id}-color-input`,
                type: "color",
                value: currentSettings.notificationColor,
                onChange: (e) =>
                  handleSettingChange("notificationColor", e.target.value),
                style: {
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--border-radius-sm)",
                  padding: "var(--spacing-xs)", // Pequeño padding para el input color
                  backgroundColor: "var(--input-bg)", // Fondo del input
                },
              }),
            ]
          ),

          React.createElement(
            "div",
            {
              key: "headers",
              className: "settings-group",
              style: {
                marginBottom: "var(--spacing-sm)",
                display: "flex",
                alignItems: "center",
              },
            },
            [
              React.createElement("input", {
                key: "input",
                id: `${self.id}-headers-checkbox`,
                type: "checkbox",
                checked: currentSettings.showInHeaders,
                onChange: (e) =>
                  handleSettingChange("showInHeaders", e.target.checked),
                style: { marginRight: "var(--spacing-xs)" },
              }),
              React.createElement(
                "label",
                {
                  key: "label",
                  htmlFor: `${self.id}-headers-checkbox`,
                  style: {
                    color: "var(--text-color-secondary)",
                    cursor: "pointer",
                  },
                },
                "Mostrar en encabezados de día"
              ),
            ]
          ),

          React.createElement(
            "div",
            {
              key: "cells",
              className: "settings-group",
              style: { display: "flex", alignItems: "center" },
            },
            [
              React.createElement("input", {
                key: "input",
                id: `${self.id}-cells-checkbox`,
                type: "checkbox",
                checked: currentSettings.showInCells,
                onChange: (e) =>
                  handleSettingChange("showInCells", e.target.checked),
                style: { marginRight: "var(--spacing-xs)" },
              }),
              React.createElement(
                "label",
                {
                  key: "label",
                  htmlFor: `${self.id}-cells-checkbox`,
                  style: {
                    color: "var(--text-color-secondary)",
                    cursor: "pointer",
                  },
                },
                "Mostrar en celdas de hora"
              ),
            ]
          ),
        ]
      );
    }

    // Registrar en el panel de configuración
    this._extensionIds.settings = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().SETTINGS_PANEL,
      this._createComponentWrapper(SettingsPanelComponent),
      { order: 100 }
    );
  },
};
```

### Plugin con página completa y API pública

```javascript
import React from "react";

export default {
  id: "estadisticas-tiempo",
  name: "Estadísticas de Tiempo",
  version: "1.0.0",
  description: "Muestra estadísticas sobre el uso del tiempo",
  author: "Tu Nombre",
  minAppVersion: "0.3.0",
  maxAppVersion: "1.0.0",
  permissions: ["storage", "events", "ui", "communication"],

  _core: null,
  _data: {
    stats: {},
    lastUpdate: null,
  },
  _subscriptions: [],
  _extensionIds: {},
  _PAGE_ID: "estadisticas",

  init: async function (core) {
    const self = this;

    try {
      self._core = core;

      // Cargar datos
      await self._loadDataFromStorage();

      // Registrar navegación y página
      self._registerNavigation();
      self._registerMainPage();

      // Suscribirse a eventos para actualizar estadísticas
      self._setupEventListeners();

      // Crear y registrar API pública
      self.publicAPI = self._createPublicAPI();
      core.plugins.registerAPI(self.id, self.publicAPI);

      console.log(`[${self.name}] Inicializado correctamente`);
      return true;
    } catch (error) {
      console.error(`[${self.name}] Error de inicialización:`, error);
      return false;
    }
  },

  cleanup: async function () {
    try {
      // Guardar datos
      await this._saveDataToStorage();

      // Cancelar suscripciones
      this._subscriptions.forEach((unsub) => {
        if (typeof unsub === "function") unsub();
      });

      // Limpiar extensiones de UI
      Object.entries(this._extensionIds).forEach(([key, extensionId]) => {
        if (extensionId) {
          this._core.ui.removeExtension(this.id, extensionId);
        }
      });
      this._extensionIds = {};

      return true;
    } catch (error) {
      console.error(`[${this.name}] Error en limpieza:`, error);
      return false;
    }
  },

  async _loadDataFromStorage() {
    const STORAGE_KEY = "stats_data";
    try {
      const storedData = await this._core.storage.getItem(
        this.id,
        STORAGE_KEY,
        { stats: {}, lastUpdate: null }
      );
      this._data = storedData || { stats: {}, lastUpdate: null };
    } catch (error) {
      console.error(`[${this.name}] Error al cargar datos:`, error);
      this._data = { stats: {}, lastUpdate: null };
    }
  },

  async _saveDataToStorage() {
    const STORAGE_KEY = "stats_data";
    try {
      await this._core.storage.setItem(this.id, STORAGE_KEY, this._data);
    } catch (error) {
      console.error(`[${this.name}] Error al guardar datos:`, error);
    }
  },

  _createPublicAPI: function () {
    const self = this;

    return {
      getStats: function () {
        return { ...self._data.stats }; // Devolver copia
      },

      getDailySummary: function (date) {
        const dateStr = date
          ? new Date(date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];
        // Devolver copia o un objeto por defecto si no existe
        return self._data.stats[dateStr]
          ? { ...self._data.stats[dateStr] }
          : { created: 0, updated: 0, deleted: 0 };
      },

      getLastUpdateTime: function () {
        return self._data.lastUpdate;
      },
    };
  },

  _setupEventListeners: function () {
    // Suscribirse a eventos de calendario
    const createdSub = this._core.events.subscribe(
      this.id,
      "calendar.eventCreated",
      (data) => this._updateStats({ ...data, type: "created" })
    );

    const updatedSub = this._core.events.subscribe(
      this.id,
      "calendar.eventUpdated",
      (data) => this._updateStats({ ...data, type: "updated" })
    );

    const deletedSub = this._core.events.subscribe(
      this.id,
      "calendar.eventDeleted",
      (data) => this._updateStats({ ...data, type: "deleted" })
    );

    this._subscriptions.push(createdSub, updatedSub, deletedSub);
  },

  _updateStats: async function (eventData) {
    // Actualizar estadísticas
    const stats = this._data.stats; // Acceso directo para modificar
    const date = new Date().toISOString().split("T")[0];

    if (!stats[date]) {
      stats[date] = { created: 0, updated: 0, deleted: 0 };
    }

    if (eventData.type === "created") {
      stats[date].created++;
    } else if (eventData.type === "updated") {
      stats[date].updated++;
    } else if (eventData.type === "deleted") {
      stats[date].deleted++;
    }

    this._data.lastUpdate = new Date().toISOString(); // Guardar como ISO string

    // Publicar evento propio con copia de los datos
    this._core.events.publish(this.id, "estadisticasTiempo.actualizado", {
      stats: { ...this._data.stats }, // Enviar copia
      lastUpdate: this._data.lastUpdate,
    });

    // Guardar datos
    await this._saveDataToStorage();
  },

  _createComponentWrapper: function (Component, extraProps = {}) {
    const self = this;

    return function ComponentWrapper(propsFromAtlas) {
      return React.createElement(Component, {
        ...propsFromAtlas,
        plugin: self,
        core: self._core,
        pluginId: self.id,
        ...extraProps,
      });
    };
  },

  _registerNavigation: function () {
    const self = this;

    // Usar el componente MiPluginNavItem.jsx adaptado para este plugin
    function StatsNavItem(props) {
      const handleClick = () => {
        props.onNavigate(props.pluginId, props.pageIdToNavigate);
      };
      const isActive = false; // Lógica de activación si es necesaria

      return React.createElement(
        "div",
        {
          className: `sidebar-item ${isActive ? "active" : ""}`,
          onClick: handleClick,
          title: "Ver Estadísticas de Tiempo",
          style: { cursor: "pointer" },
        },
        [
          React.createElement(
            "span",
            { className: "sidebar-item-icon", key: "icon" },
            React.createElement(
              "span",
              { className: "material-icons" },
              "bar_chart"
            )
          ),
          React.createElement(
            "span",
            { className: "sidebar-item-label", key: "label" },
            "Estadísticas"
          ),
        ]
      );
    }

    const navWrapper = this._createComponentWrapper(StatsNavItem, {
      pageIdToNavigate: this._PAGE_ID,
    });

    this._extensionIds.navigation = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().MAIN_NAVIGATION,
      navWrapper,
      { order: 110 } // Ajustar orden si es necesario
    );
  },

  _registerMainPage: function () {
    const self = this;

    function StatsPage(props) {
      // props.plugin, props.core, props.pluginId son inyectados por el wrapper
      const [stats, setStats] = React.useState({});
      const [lastUpdate, setLastUpdate] = React.useState(null);

      const refreshStats = React.useCallback(() => {
        // Usar la API pública del plugin (inyectada como props.plugin)
        const currentStats = props.plugin.publicAPI.getStats();
        const currentLastUpdate = props.plugin.publicAPI.getLastUpdateTime();
        setStats({ ...currentStats }); // Clonar
        setLastUpdate(currentLastUpdate);
      }, [props.plugin]); // Dependencia de props.plugin

      React.useEffect(() => {
        refreshStats(); // Carga inicial

        // Suscribirse a actualizaciones del propio plugin
        const unsub = props.core.events.subscribe(
          props.pluginId, // ID del plugin actual
          "estadisticasTiempo.actualizado",
          (data) => {
            setStats({ ...data.stats }); // Asegurarse de clonar el objeto
            setLastUpdate(data.lastUpdate);
          }
        );

        return () => {
          if (typeof unsub === "function") unsub();
        };
      }, [refreshStats, props.core.events, props.pluginId]); // Dependencias

      const handleDownload = () => {
        const dataToDownload = {
          stats: stats,
          lastUpdate: lastUpdate,
          generatedAt: new Date().toISOString(),
        };
        const json = JSON.stringify(dataToDownload, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${props.pluginId}-estadisticas.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };

      return React.createElement(
        "div",
        {
          className: `${props.pluginId}-stats-page plugin-page`,
          style: { padding: "var(--spacing-lg)", color: "var(--text-color)" },
        },
        [
          React.createElement(
            "h1",
            {
              key: "title",
              style: {
                color: "var(--text-color)",
                marginBottom: "var(--spacing-md)",
              },
            },
            "Estadísticas de Tiempo"
          ),

          React.createElement(
            "button",
            {
              key: "download",
              className: `${props.pluginId}-download-button`,
              onClick: handleDownload,
              style: {
                backgroundColor: "var(--primary-color)",
                color: "var(--color-button-primary-text)",
                border: "none",
                padding: "var(--spacing-sm) var(--spacing-md)",
                borderRadius: "var(--border-radius-sm)",
                cursor: "pointer",
                marginBottom: "var(--spacing-md)",
              },
            },
            "Descargar estadísticas"
          ),

          lastUpdate &&
            React.createElement(
              "p",
              {
                key: "last-update-info",
                style: {
                  color: "var(--text-color-secondary)",
                  fontSize: "0.85rem",
                  marginBottom: "var(--spacing-lg)",
                },
              },
              `Última actualización: ${new Date(lastUpdate).toLocaleString()}`
            ),

          React.createElement(
            "div",
            {
              className: `${props.pluginId}-stats-container`,
              key: "container",
            },
            Object.entries(stats).length === 0
              ? React.createElement(
                  "p",
                  {
                    key: "no-data",
                    style: { color: "var(--text-color-secondary)" },
                  },
                  "No hay estadísticas disponibles todavía."
                )
              : Object.entries(stats)
                  .map(([date, dayStat]) => {
                    return React.createElement(
                      "div", // Contenedor por día
                      {
                        className: `${props.pluginId}-stat-item`,
                        key: date,
                        style: {
                          backgroundColor: "var(--card-bg)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "var(--border-radius-md)",
                          padding: "var(--spacing-md)",
                          marginBottom: "var(--spacing-md)",
                          boxShadow: "var(--shadow-sm)",
                        },
                      },
                      [
                        React.createElement(
                          "h3", // Fecha
                          {
                            key: "date",
                            style: {
                              color: "var(--text-color)",
                              marginTop: 0,
                              marginBottom: "var(--spacing-sm)",
                              fontSize: "1.1rem",
                            },
                          },
                          new Date(date + "T00:00:00").toLocaleDateString(
                            undefined,
                            { year: "numeric", month: "long", day: "numeric" }
                          ) // Formatear fecha
                        ),
                        React.createElement(
                          "ul", // Lista de estadísticas del día
                          {
                            key: "list",
                            style: {
                              listStyle: "none",
                              padding: 0,
                              margin: 0,
                              color: "var(--text-color-secondary)",
                              fontSize: "0.9rem",
                            },
                          },
                          [
                            React.createElement(
                              "li",
                              {
                                key: "created",
                                style: { marginBottom: "var(--spacing-xs)" },
                              },
                              `✅ Creados: ${dayStat.created || 0}`
                            ),
                            React.createElement(
                              "li",
                              {
                                key: "updated",
                                style: { marginBottom: "var(--spacing-xs)" },
                              },
                              `📝 Actualizados: ${dayStat.updated || 0}`
                            ),
                            React.createElement(
                              "li",
                              {
                                key: "deleted",
                                style: { marginBottom: "var(--spacing-xs)" },
                              },
                              `❌ Eliminados: ${dayStat.deleted || 0}`
                            ),
                            React.createElement(
                              "li",
                              {
                                key: "total",
                                style: {
                                  fontWeight: "bold",
                                  marginTop: "var(--spacing-sm)",
                                  paddingTop: "var(--spacing-xs)",
                                  borderTop: `1px solid var(--border-color)`,
                                  color: "var(--text-color)",
                                },
                              },
                              `📊 Total de cambios: ${
                                (dayStat.created || 0) +
                                (dayStat.updated || 0) +
                                (dayStat.deleted || 0)
                              }`
                            ),
                          ]
                        ),
                      ]
                    );
                  })
                  .sort((a, b) => new Date(b.key) - new Date(a.key)) // Ordenar por fecha descendente
          ),
        ]
      );
    }

    const pageWrapper = this._createComponentWrapper(StatsPage);

    this._extensionIds.page = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().PLUGIN_PAGES,
      pageWrapper,
      {
        order: 100,
        props: {
          pageId: this._PAGE_ID,
        },
      }
    );
  },
};
```

### Plugin Completo con Formularios y Gestión de Estado

```javascript
import React from "react";

// Constantes del plugin
const TASK_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};

const STATUS_LABELS = {
  [TASK_STATUS.PENDING]: "Pendiente",
  [TASK_STATUS.IN_PROGRESS]: "En Progreso",
  [TASK_STATUS.COMPLETED]: "Completado",
};

export default {
  id: "task-manager",
  name: "Gestor de Tareas",
  version: "1.0.0",
  description: "Plugin completo para gestión de tareas con formularios",
  author: "Tu Nombre",
  minAppVersion: "0.3.0",
  maxAppVersion: "1.0.0",
  permissions: ["storage", "events", "ui"],

  _core: null,
  _tasks: [], // Estado interno para las tareas
  _subscriptions: [],
  _extensionIds: {},
  _PAGE_ID: "task-manager-page", // ID único para la página

  init: async function (core) {
    try {
      this._core = core;
      this._subscriptions = []; // Inicializar arrays de tracking
      this._extensionIds = {};

      // Cargar tareas desde el almacenamiento
      await this._loadTasksFromStorage();

      // Crear y registrar la API pública del plugin
      // Es importante hacerlo antes de registrar componentes que puedan usarla
      this.publicAPI = this._createPublicAPI();
      core.plugins.registerAPI(this.id, this.publicAPI);

      // Registrar componentes de UI (navegación y página principal)
      this._registerNavigation();
      this._registerMainPage();

      console.log(`[${this.name}] Inicializado correctamente`);
      return true;
    } catch (error) {
      console.error(`[${this.name}] Error de inicialización:`, error);
      return false;
    }
  },

  cleanup: async function () {
    try {
      // Opcional: Guardar tareas al limpiar, aunque se recomienda guardar tras cada cambio
      await this._saveTasksToStorage();

      // Cancelar todas las suscripciones a eventos
      this._subscriptions.forEach((unsub) => {
        if (typeof unsub === "function") unsub();
      });
      this._subscriptions = []; // Limpiar array

      // Limpiar todas las extensiones de UI registradas por este plugin
      Object.entries(this._extensionIds).forEach(([key, extensionId]) => {
        if (extensionId) {
          this._core.ui.removeExtension(this.id, extensionId);
        }
      });
      this._extensionIds = {}; // Limpiar objeto

      console.log(`[${this.name}] Limpieza completada`);
      return true;
    } catch (error) {
      console.error(`[${this.name}] Error en limpieza:`, error);
      return false;
    }
  },

  async _loadTasksFromStorage() {
    const STORAGE_KEY = `${this.id}_tasks`;
    try {
      const storedTasks = await this._core.storage.getItem(
        this.id,
        STORAGE_KEY,
        [] // Valor por defecto: array vacío
      );
      this._tasks = Array.isArray(storedTasks) ? storedTasks : []; // Asegurar que sea un array
    } catch (error) {
      console.error(`[${this.name}] Error al cargar tareas:`, error);
      this._tasks = []; // Estado seguro en caso de error
    }
  },

  async _saveTasksToStorage() {
    const STORAGE_KEY = `${this.id}_tasks`;
    try {
      await this._core.storage.setItem(this.id, STORAGE_KEY, this._tasks);
    } catch (error) {
      console.error(`[${this.name}] Error al guardar tareas:`, error);
    }
  },

  // API Pública del plugin para ser usada por sus componentes u otros plugins
  _createPublicAPI: function () {
    const self = this; // Preservar contexto del plugin

    return {
      getAllTasks: () => [...self._tasks], // Devolver copia para inmutabilidad

      getTaskById: (id) => {
        const task = self._tasks.find((t) => t.id === id);
        return task ? { ...task } : undefined; // Devolver copia
      },

      createTask: async (taskData) => {
        return await self._internalCreateTask(taskData); // Usar método interno
      },

      updateTask: async (id, updateData) => {
        return await self._internalUpdateTask(id, updateData);
      },

      deleteTask: async (id) => {
        return await self._internalDeleteTask(id);
      },

      getTasksByStatus: (status) => {
        return self._tasks
          .filter((task) => task.status === status)
          .map((task) => ({ ...task })); // Copias
      },
    };
  },

  // Métodos internos para la lógica de negocio (CRUD de tareas)
  async _internalCreateTask(taskData) {
    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // ID más único
      title: taskData.title || "Nueva Tarea",
      description: taskData.description || "",
      status: taskData.status || TASK_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this._tasks.push(newTask);
    await this._saveTasksToStorage(); // Guardar después de modificar

    // Publicar evento de que una tarea fue creada
    this._core.events.publish(
      this.id, // ID del plugin que origina el evento
      `${this.id}.taskCreated`, // Nombre del evento (pluginId.nombreEvento)
      { task: { ...newTask } } // Datos del evento (enviar copia)
    );

    return { ...newTask }; // Devolver copia de la nueva tarea
  },

  async _internalUpdateTask(id, updateData) {
    const taskIndex = this._tasks.findIndex((task) => task.id === id);
    if (taskIndex === -1) {
      console.error(
        `[${this.name}] Tarea con ID ${id} no encontrada para actualizar.`
      );
      throw new Error(`Tarea con ID ${id} no encontrada`);
    }

    // Evitar sobreescribir id y createdAt
    const { id: _id, createdAt: _createdAt, ...restOfUpdateData } = updateData;

    this._tasks[taskIndex] = {
      ...this._tasks[taskIndex],
      ...restOfUpdateData,
      updatedAt: new Date().toISOString(),
    };

    await this._saveTasksToStorage();

    this._core.events.publish(this.id, `${this.id}.taskUpdated`, {
      task: { ...this._tasks[taskIndex] },
    });

    return { ...this._tasks[taskIndex] };
  },

  async _internalDeleteTask(id) {
    const taskIndex = this._tasks.findIndex((task) => task.id === id);
    if (taskIndex === -1) {
      console.error(
        `[${this.name}] Tarea con ID ${id} no encontrada para eliminar.`
      );
      throw new Error(`Tarea con ID ${id} no encontrada`);
    }

    const deletedTask = this._tasks.splice(taskIndex, 1)[0];
    await this._saveTasksToStorage();

    this._core.events.publish(this.id, `${this.id}.taskDeleted`, {
      task: { ...deletedTask }, // Enviar la tarea eliminada
      taskId: id, // También puede ser útil enviar solo el ID
    });

    return { ...deletedTask };
  },

  // Patrón Wrapper para inyectar dependencias (plugin, core, pluginId) a los componentes
  _createComponentWrapper: function (Component, extraProps = {}) {
    const self = this;
    return function ComponentWrapper(propsFromAtlas) {
      return React.createElement(Component, {
        ...propsFromAtlas, // Props de Atlas (ej. onNavigate)
        plugin: self, // Instancia del plugin (incluye publicAPI)
        core: self._core, // API de Core
        pluginId: self.id, // ID del plugin
        ...extraProps, // Props adicionales definidas al crear el wrapper
      });
    };
  },

  // Registrar el ítem de navegación para la página del plugin
  _registerNavigation: function () {
    const self = this; // Mantener contexto del plugin

    // Componente React para el ítem de navegación
    function TaskManagerNavItem(props) {
      // props.pluginId, props.onNavigate son pasados por Atlas
      // props.pageIdToNavigate es pasado por el _createComponentWrapper
      const handleClick = () => {
        if (props.onNavigate && props.pageIdToNavigate) {
          props.onNavigate(props.pluginId, props.pageIdToNavigate);
        }
      };
      // Lógica para estado activo (simplificada)
      const isActive = false; // props.currentPageId === props.pageIdToNavigate; (requeriría currentPageId de Atlas)

      return React.createElement(
        "div",
        {
          className: `sidebar-item ${isActive ? "active" : ""}`,
          onClick: handleClick,
          title: self.name, // Usar el nombre del plugin para el tooltip
          style: { cursor: "pointer" },
        },
        [
          React.createElement(
            "span",
            { className: "sidebar-item-icon", key: "icon" },
            React.createElement(
              "span",
              { className: "material-icons" },
              "task_alt"
            ) // Icono para tareas
          ),
          React.createElement(
            "span",
            { className: "sidebar-item-label", key: "label" },
            "Tareas" // Texto del ítem
          ),
        ]
      );
    }

    const navWrapper = this._createComponentWrapper(TaskManagerNavItem, {
      pageIdToNavigate: this._PAGE_ID, // Pasar el ID de la página a navegar
    });

    this._extensionIds.navigation = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().MAIN_NAVIGATION,
      navWrapper,
      { order: 120 } // Orden de aparición en la barra lateral
    );
  },

  // Registrar la página principal del plugin
  _registerMainPage: function () {
    // Componente React para la página principal del gestor de tareas
    // (Definiciones de TaskManagerPage, TaskItem, TaskForm van aquí, como en el ejemplo original)
    // ... (ver las definiciones de TaskManagerPage, TaskItem, TaskForm del ejemplo anterior) ...
    // Por brevedad, no se repiten aquí pero deben estar definidos.

    const self = this; // Guardar referencia a 'this' del plugin

    // Componente de la página principal del gestor de tareas
    function TaskManagerPage(props) {
      // props aquí son las inyectadas por el wrapper (plugin, core, pluginId)
      const [tasks, setTasks] = React.useState([]);
      const [showForm, setShowForm] = React.useState(false);
      const [editingTask, setEditingTask] = React.useState(null); // null o la tarea a editar

      // Función para cargar/refrescar la lista de tareas desde la API del plugin
      const refreshTasks = React.useCallback(async () => {
        try {
          // Usar props.plugin.publicAPI que fue inyectado por el wrapper
          const currentTasks = props.plugin.publicAPI.getAllTasks();
          setTasks(
            currentTasks.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            )
          ); // Ordenar por más reciente
        } catch (error) {
          console.error(`[${props.pluginId}] Error al cargar tareas:`, error);
          setTasks([]); // Estado seguro
        }
      }, [props.plugin, props.pluginId]); // Dependencias de useCallback

      // Efecto para cargar tareas al montar y suscribirse a eventos del plugin
      React.useEffect(() => {
        refreshTasks(); // Carga inicial

        // Suscribirse a eventos propios del plugin para mantener la UI actualizada
        const eventNames = [
          `${props.pluginId}.taskCreated`,
          `${props.pluginId}.taskUpdated`,
          `${props.pluginId}.taskDeleted`,
        ];
        const subscriptions = eventNames.map((eventName) =>
          props.core.events.subscribe(
            props.pluginId,
            eventName,
            (eventData) => {
              console.log(
                `[${props.pluginId}] Evento recibido: ${eventName}`,
                eventData
              );
              refreshTasks(); // Refrescar la lista cuando ocurra un evento
            }
          )
        );

        // Función de limpieza para desuscribirse al desmontar el componente
        return () => {
          subscriptions.forEach((unsub) => {
            if (typeof unsub === "function") unsub();
          });
        };
      }, [refreshTasks, props.core.events, props.pluginId]); // Dependencias del useEffect

      const handleOpenForm = (taskToEdit = null) => {
        setEditingTask(taskToEdit ? { ...taskToEdit } : null); // Clonar si se edita
        setShowForm(true);
      };

      const handleFormSave = async (taskData) => {
        try {
          if (editingTask) {
            await props.plugin.publicAPI.updateTask(editingTask.id, taskData);
          } else {
            await props.plugin.publicAPI.createTask(taskData);
          }
          // refreshTasks() será llamado por el manejador de eventos.
          setShowForm(false);
          setEditingTask(null);
        } catch (error) {
          console.error(`[${props.pluginId}] Error al guardar tarea:`, error);
          // Considerar mostrar un mensaje de error al usuario (ej. con un toast/notificación de Atlas)
        }
      };

      const handleFormCancel = () => {
        setShowForm(false);
        setEditingTask(null);
      };

      const handleDeleteTask = async (taskId) => {
        // Usar confirmación nativa o un modal más elegante proporcionado por Atlas si existe
        if (
          window.confirm("¿Estás seguro de que quieres eliminar esta tarea?")
        ) {
          try {
            await props.plugin.publicAPI.deleteTask(taskId);
            // refreshTasks() será llamado por el manejador de eventos.
          } catch (error) {
            console.error(
              `[${props.pluginId}] Error al eliminar tarea:`,
              error
            );
          }
        }
      };

      const handleStatusChange = async (taskId, newStatus) => {
        try {
          await props.plugin.publicAPI.updateTask(taskId, {
            status: newStatus,
          });
          // refreshTasks() será llamado por el manejador de eventos.
        } catch (error) {
          console.error(
            `[${props.pluginId}] Error al cambiar estado de tarea:`,
            error
          );
        }
      };

      // Estilos comunes para botones y elementos de UI de esta página
      const buttonStyle = {
        backgroundColor: "var(--primary-color)",
        color: "var(--color-button-primary-text)",
        border: "none",
        padding: "var(--spacing-sm) var(--spacing-md)",
        borderRadius: "var(--border-radius-sm)",
        cursor: "pointer",
        transition: "background-color var(--transition-fast)",
      };

      return React.createElement(
        "div",
        {
          className: `${props.pluginId}-task-manager-page plugin-page`,
          style: { padding: "var(--spacing-lg)", color: "var(--text-color)" },
        },
        [
          React.createElement(
            "div",
            {
              key: "header-bar",
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--spacing-lg)",
              },
            },
            [
              React.createElement(
                "h1",
                { key: "title", style: { margin: 0 } },
                self.name
              ),
              React.createElement(
                "button",
                {
                  key: "add-btn",
                  onClick: () => handleOpenForm(),
                  style: buttonStyle,
                  onMouseEnter: (e) =>
                    (e.target.style.backgroundColor = "var(--primary-hover)"),
                  onMouseLeave: (e) =>
                    (e.target.style.backgroundColor = "var(--primary-color)"),
                },
                "Nueva Tarea"
              ),
            ]
          ),

          React.createElement(
            "div",
            {
              key: "tasks-list-container",
              className: `${props.pluginId}-tasks-list`,
            },
            tasks.length === 0
              ? React.createElement(
                  "p",
                  {
                    key: "no-tasks-msg",
                    style: {
                      color: "var(--text-color-secondary)",
                      textAlign: "center",
                      padding: "var(--spacing-lg)",
                    },
                  },
                  "No hay tareas. ¡Añade una para empezar!"
                )
              : tasks.map((task) =>
                  React.createElement(TaskItem, {
                    // Componente TaskItem (definido abajo)
                    key: task.id,
                    task: task,
                    pluginId: props.pluginId,
                    onEdit: () => handleOpenForm(task),
                    onDelete: () => handleDeleteTask(task.id),
                    onStatusChange: (newStatus) =>
                      handleStatusChange(task.id, newStatus),
                  })
                )
          ),

          showForm &&
            React.createElement(
              ModalWrapper,
              { pluginId: props.pluginId }, // Componente ModalWrapper (definido abajo)
              React.createElement(TaskForm, {
                // Componente TaskForm (definido abajo)
                pluginId: props.pluginId,
                existingTask: editingTask,
                onSave: handleFormSave,
                onCancel: handleFormCancel,
              })
            ),
        ]
      );
    }

    // Componente para envolver el formulario en un modal
    function ModalWrapper(props) {
      const { pluginId, children } = props;
      return React.createElement(
        "div", // Overlay del modal
        {
          key: `${pluginId}-modal-overlay`,
          className: `${pluginId}-modal-overlay`,
          style: {
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1050, // Alto z-index
          },
        },
        React.createElement(
          "div", // Contenido del modal
          {
            className: `${pluginId}-modal-content`,
            style: {
              backgroundColor: "var(--card-bg)",
              padding: "var(--spacing-lg)",
              borderRadius: "var(--border-radius-lg)",
              boxShadow: "var(--shadow-xl)",
              maxWidth: "600px",
              width: "calc(100% - var(--spacing-lg)*2)",
              maxHeight: "90vh",
              overflowY: "auto",
            },
          },
          children // Aquí se renderizará el TaskForm
        )
      );
    }

    // Componente para mostrar una tarea individual
    function TaskItem(props) {
      const { task, onEdit, onDelete, onStatusChange, pluginId } = props;

      const getStatusStyle = (status) => {
        switch (status) {
          case TASK_STATUS.COMPLETED:
            return {
              backgroundColor: "var(--success-color)",
              color: "white",
              padding: "2px 6px",
              borderRadius: "var(--border-radius-sm)",
              fontSize: "0.75rem",
            };
          case TASK_STATUS.IN_PROGRESS:
            return {
              backgroundColor: "var(--info-color)",
              color: "white",
              padding: "2px 6px",
              borderRadius: "var(--border-radius-sm)",
              fontSize: "0.75rem",
            };
          default:
            return {
              backgroundColor: "var(--bg-color-secondary)",
              color: "var(--text-color-secondary)",
              padding: "2px 6px",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--border-radius-sm)",
              fontSize: "0.75rem",
            };
        }
      };

      return React.createElement(
        "div",
        {
          className: `${pluginId}-task-item`,
          style: {
            backgroundColor: "var(--card-bg)",
            border: `1px solid var(--border-color)`,
            borderRadius: "var(--border-radius-md)",
            padding: "var(--spacing-md)",
            marginBottom: "var(--spacing-md)",
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-sm)",
          },
        },
        [
          React.createElement(
            // Encabezado de la tarea con título y acciones
            "div",
            {
              key: "task-header",
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              },
            },
            [
              React.createElement(
                "h3",
                {
                  key: "task-title",
                  style: {
                    margin: 0,
                    color: "var(--text-color)",
                    fontSize: "1.1rem",
                    flexGrow: 1,
                    marginRight: "var(--spacing-sm)",
                  },
                },
                task.title
              ),
              React.createElement(
                "div",
                {
                  key: "task-actions",
                  style: {
                    display: "flex",
                    gap: "var(--spacing-xs)",
                    flexShrink: 0,
                  },
                },
                [
                  React.createElement(
                    "button",
                    {
                      key: "edit-btn",
                      onClick: onEdit,
                      title: "Editar tarea",
                      style: {
                        padding: "var(--spacing-xs)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-color-secondary)",
                      },
                    },
                    React.createElement(
                      "span",
                      { className: "material-icons" },
                      "edit"
                    )
                  ),
                  React.createElement(
                    "button",
                    {
                      key: "delete-btn",
                      onClick: onDelete,
                      title: "Eliminar tarea",
                      style: {
                        padding: "var(--spacing-xs)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--danger-color)",
                      },
                    },
                    React.createElement(
                      "span",
                      { className: "material-icons" },
                      "delete_outline"
                    )
                  ),
                ]
              ),
            ]
          ),

          task.description &&
            React.createElement(
              "p",
              {
                key: "task-description",
                style: {
                  margin: 0,
                  color: "var(--text-color-secondary)",
                  fontSize: "0.9rem",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                },
              },
              task.description
            ),

          React.createElement(
            // Pie de la tarea con estado y selector
            "div",
            {
              key: "task-footer",
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "var(--spacing-xs)",
              },
            },
            [
              React.createElement(
                "span",
                { key: "status-badge", style: getStatusStyle(task.status) },
                STATUS_LABELS[task.status]
              ),
              React.createElement(
                "select",
                {
                  key: "status-select",
                  value: task.status,
                  onChange: (e) => onStatusChange(e.target.value),
                  title: "Cambiar estado",
                  style: {
                    padding: "var(--spacing-xs) var(--spacing-sm)",
                    borderRadius: "var(--border-radius-sm)",
                    border: `1px solid var(--border-color)`,
                    backgroundColor: "var(--input-bg)",
                    color: "var(--text-color)",
                    fontSize: "0.85rem",
                  },
                },
                Object.keys(TASK_STATUS).map((statusKey) =>
                  React.createElement(
                    "option",
                    {
                      key: TASK_STATUS[statusKey],
                      value: TASK_STATUS[statusKey],
                    },
                    STATUS_LABELS[TASK_STATUS[statusKey]]
                  )
                )
              ),
            ]
          ),
          React.createElement(
            "small",
            {
              key: "task-timestamps",
              style: {
                color: "var(--text-color-secondary)",
                fontSize: "0.75rem",
                textAlign: "right",
                marginTop: "var(--spacing-xs)",
              },
            },
            `Creado: ${new Date(
              task.createdAt
            ).toLocaleDateString()} | Actualizado: ${new Date(
              task.updatedAt
            ).toLocaleDateString()}`
          ),
        ]
      );
    }

    // Componente de formulario para crear/editar tareas
    function TaskForm(props) {
      const { existingTask, onSave, onCancel, pluginId } = props;

      const [formData, setFormData] = React.useState({
        title: existingTask?.title || "",
        description: existingTask?.description || "",
        status: existingTask?.status || TASK_STATUS.PENDING,
      });

      // Sincronizar formData si existingTask cambia (ej. al reabrir el form para editar otra tarea)
      React.useEffect(() => {
        if (existingTask) {
          setFormData({
            title: existingTask.title || "",
            description: existingTask.description || "",
            status: existingTask.status || TASK_STATUS.PENDING,
          });
        } else {
          // Resetea para nueva tarea
          setFormData({
            title: "",
            description: "",
            status: TASK_STATUS.PENDING,
          });
        }
      }, [existingTask]);

      const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
      };

      const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title.trim()) {
          // Considerar un sistema de notificaciones de Atlas si está disponible
          alert("El título es obligatorio.");
          return;
        }
        onSave(formData); // Llama al callback onSave pasado desde TaskManagerPage
      };

      const commonInputStyle = {
        width: "100%",
        padding: "var(--spacing-sm)",
        borderRadius: "var(--border-radius-sm)",
        border: `1px solid var(--border-color)`,
        backgroundColor: "var(--input-bg)",
        color: "var(--text-color)",
        boxSizing: "border-box", // Importante para que padding no aumente el width
        fontSize: "0.9rem",
      };
      const labelStyle = {
        display: "block",
        color: "var(--text-color-secondary)",
        marginBottom: "var(--spacing-xs)",
        fontSize: "0.85rem",
        fontWeight: "500",
      };

      return React.createElement(
        "form",
        {
          onSubmit: handleSubmit,
          className: `${pluginId}-task-form`,
          style: {
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-md)",
          },
        },
        [
          React.createElement(
            "h2",
            {
              key: "form-title",
              style: {
                marginTop: 0,
                marginBottom: 0,
                color: "var(--text-color)",
                fontSize: "1.3rem",
              },
            },
            existingTask ? "Editar Tarea" : "Nueva Tarea"
          ),

          React.createElement("div", { key: "title-group" }, [
            React.createElement(
              "label",
              {
                key: "title-label",
                htmlFor: `${pluginId}-task-title`,
                style: labelStyle,
              },
              "Título:"
            ),
            React.createElement("input", {
              key: "title-input",
              id: `${pluginId}-task-title`,
              type: "text",
              name: "title",
              value: formData.title,
              onChange: handleChange,
              required: true,
              style: commonInputStyle,
              placeholder: "Ej: Preparar informe mensual",
            }),
          ]),

          React.createElement("div", { key: "description-group" }, [
            React.createElement(
              "label",
              {
                key: "desc-label",
                htmlFor: `${pluginId}-task-description`,
                style: labelStyle,
              },
              "Descripción (opcional):"
            ),
            React.createElement("textarea", {
              key: "desc-textarea",
              id: `${pluginId}-task-description`,
              name: "description",
              value: formData.description,
              onChange: handleChange,
              rows: 4,
              style: {
                ...commonInputStyle,
                resize: "vertical",
                minHeight: "80px",
              },
              placeholder: "Ej: Recopilar datos de ventas, analizar KPIs...",
            }),
          ]),

          React.createElement("div", { key: "status-group" }, [
            React.createElement(
              "label",
              {
                key: "status-label",
                htmlFor: `${pluginId}-task-status`,
                style: labelStyle,
              },
              "Estado:"
            ),
            React.createElement(
              "select",
              {
                key: "status-select",
                id: `${pluginId}-task-status`,
                name: "status",
                value: formData.status,
                onChange: handleChange,
                style: commonInputStyle,
              },
              Object.keys(TASK_STATUS).map((statusKey) =>
                React.createElement(
                  "option",
                  {
                    key: TASK_STATUS[statusKey],
                    value: TASK_STATUS[statusKey],
                  },
                  STATUS_LABELS[TASK_STATUS[statusKey]]
                )
              )
            ),
          ]),

          React.createElement(
            // Contenedor para los botones de acción
            "div",
            {
              key: "form-actions",
              style: {
                display: "flex",
                gap: "var(--spacing-sm)",
                justifyContent: "flex-end",
                marginTop: "var(--spacing-sm)",
              },
            },
            [
              React.createElement(
                "button",
                {
                  key: "cancel-btn",
                  type: "button",
                  onClick: onCancel,
                  style: {
                    padding: "var(--spacing-sm) var(--spacing-md)",
                    borderRadius: "var(--border-radius-sm)",
                    border: `1px solid var(--border-color)`,
                    backgroundColor: "var(--bg-color-secondary)",
                    color: "var(--text-color)",
                    cursor: "pointer",
                    transition: "background-color var(--transition-fast)",
                  },
                  onMouseEnter: (e) =>
                    (e.target.style.backgroundColor = "var(--hover-color)"),
                  onMouseLeave: (e) =>
                    (e.target.style.backgroundColor =
                      "var(--bg-color-secondary)"),
                },
                "Cancelar"
              ),
              React.createElement(
                "button",
                {
                  key: "submit-btn",
                  type: "submit",
                  style: {
                    padding: "var(--spacing-sm) var(--spacing-md)",
                    borderRadius: "var(--border-radius-sm)",
                    border: "none",
                    backgroundColor: "var(--primary-color)",
                    color: "var(--color-button-primary-text)",
                    cursor: "pointer",
                    transition: "background-color var(--transition-fast)",
                  },
                  onMouseEnter: (e) =>
                    (e.target.style.backgroundColor = "var(--primary-hover)"),
                  onMouseLeave: (e) =>
                    (e.target.style.backgroundColor = "var(--primary-color)"),
                },
                existingTask ? "Actualizar Tarea" : "Crear Tarea"
              ),
            ]
          ),
        ]
      );
    }

    const pageWrapper = this._createComponentWrapper(TaskManagerPage);

    this._extensionIds.page = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().PLUGIN_PAGES,
      pageWrapper,
      {
        order: 100, // Orden de la página si hubiera múltiples
        props: {
          pageId: this._PAGE_ID, // ID de la página, crucial para la navegación
        },
      }
    );
  },
};
```

---

Este documento cubre los aspectos fundamentales y avanzados del desarrollo de plugins para Atlas, incluyendo las nuevas secciones sobre estilos y temas, y mejores prácticas para la prevención de errores comunes. Utiliza estos ejemplos y guías para crear plugins robustos, eficientes y visualmente integrados con la aplicación Atlas.

¡Buena suerte con tus proyectos de desarrollo de plugins!
