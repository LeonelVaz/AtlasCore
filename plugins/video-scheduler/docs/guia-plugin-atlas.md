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
import React from 'react';
import MiPluginNavItem from './components/MiPluginNavItem.jsx';
import MiPluginMainPage from './components/MiPluginMainPage.jsx';

export default {
  // Metadatos obligatorios
  id: 'mi-primer-plugin',
  name: 'Mi Primer Plugin',
  version: '1.0.0',
  description: 'Mi primer plugin para Atlas',
  author: 'Tu Nombre',
  
  // Restricciones de compatibilidad
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
  
  // Permisos requeridos
  permissions: ['ui', 'storage'],
  
  // Variables internas
  _core: null,
  _navigationExtensionId: null,
  _pageExtensionId: null,
  
  // CONSTANTE CRÍTICA: Define el ID de tu página
  _PAGE_ID: 'mi-pagina-principal',
  
  // Método de inicialización
  init: function(core) {
    try {
      this._core = core;
      
      // Registrar componentes UI
      this._registerNavigation();
      this._registerMainPage();
      
      console.log('[Mi Primer Plugin] Inicializado correctamente');
      return true;
    } catch (error) {
      console.error('[Mi Primer Plugin] Error de inicialización:', error);
      return false;
    }
  },
  
  // ⚠️ PATRÓN CRÍTICO: Patrón Wrapper para inyección de dependencias
  _registerNavigation: function() {
    const self = this; // Preservar contexto
    
    // Wrapper que inyecta dependencias al componente
    function NavigationWrapper(propsFromAtlas) {
      return React.createElement(MiPluginNavItem, {
        ...propsFromAtlas,          // Props de Atlas (ej. onNavigate)
        plugin: self,               // Instancia del plugin
        core: self._core,           // API de Core
        pluginId: self.id,          // ID del plugin
        pageIdToNavigate: self._PAGE_ID  // ID de página para navegación
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
  _registerMainPage: function() {
    const self = this;
    
    function PageWrapper(propsFromAtlas) {
      return React.createElement(MiPluginMainPage, {
        ...propsFromAtlas,
        plugin: self,
        core: self._core,
        pluginId: self.id
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
          pageId: this._PAGE_ID  // ¡ESTO ES OBLIGATORIO!
        }
      }
    );
  },
  
  // Método de limpieza
  cleanup: function() {
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
      
      console.log('[Mi Primer Plugin] Limpieza completada');
      return true;
    } catch (error) {
      console.error('[Mi Primer Plugin] Error en limpieza:', error);
      return false;
    }
  }
};
```

### Paso 3: Componente de Navegación (components/MiPluginNavItem.jsx)

```javascript
import React from 'react';

function MiPluginNavItem(props) {
  // ⚠️ NAVEGACIÓN CRÍTICA: Usar exactamente el mismo pageId
  const handleClick = () => {
    props.onNavigate(props.pluginId, props.pageIdToNavigate);
  };
  
  return React.createElement(
    'div',
    {
      className: 'navigation-item',
      onClick: handleClick,
      style: { cursor: 'pointer', padding: '8px' }
    },
    [
      React.createElement(
        'span',
        { className: 'material-icons', key: 'icon' },
        'extension'
      ),
      React.createElement(
        'span',
        { key: 'label', style: { marginLeft: '8px' } },
        'Mi Plugin'
      )
    ]
  );
}

export default MiPluginNavItem;
```

### Paso 4: Página Principal (components/MiPluginMainPage.jsx)

```javascript
import React from 'react';

function MiPluginMainPage(props) {
  return React.createElement(
    'div',
    { className: 'plugin-page', style: { padding: '20px' } },
    [
      React.createElement('h1', { key: 'title' }, 'Mi Primer Plugin'),
      React.createElement(
        'p', 
        { key: 'description' }, 
        '¡Felicitaciones! Tu plugin está funcionando correctamente.'
      ),
      React.createElement(
        'div',
        { key: 'info' },
        [
          React.createElement('h2', { key: 'info-title' }, 'Información del Plugin:'),
          React.createElement('p', { key: 'plugin-id' }, `ID: ${props.pluginId}`),
          React.createElement('p', { key: 'page-id' }, `Página ID: ${props.pageId}`)
        ]
      )
    ]
  );
}

export default MiPluginMainPage;
```

### Paso 5: Constantes (utils/constants.js)

```javascript
// Constantes para tu plugin
export const PLUGIN_CONFIG = {
  STORAGE_KEY: 'plugin_data',
  VERSION: '1.0.0'
};

export const UI_CONSTANTS = {
  COLORS: {
    PRIMARY: '#007bff',
    SUCCESS: '#28a745',
    WARNING: '#ffc107',
    DANGER: '#dc3545'
  }
};
```

### Paso 6: Verificación

Si seguiste estos pasos correctamente:

1. **El plugin se carga**: Aparece en la lista de plugins de Atlas
2. **El item de navegación funciona**: Aparece en la navegación principal
3. **La página se muestra**: Al hacer clic en el item de navegación, se muestra tu página principal

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
import React from 'react'; // ⚠️ OBLIGATORIO en archivos que usen React

export default {
  // Metadatos del plugin
  id: 'mi-plugin',
  name: 'Mi Plugin',
  version: '1.0.0',
  description: 'Descripción de mi plugin',
  author: 'Tu Nombre',
  
  // Restricciones de compatibilidad (⚠️ OBLIGATORIO)
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
  
  // Dependencias y conflictos (opcionales)
  dependencies: [],
  conflicts: [],
  
  // Permisos requeridos
  permissions: ['storage', 'events', 'ui'],
  
  // Variables internas (recomendado para tracking)
  _core: null,
  _subscriptions: [],
  _extensionIds: {},
  
  // API pública (opcional)
  publicAPI: {
    // Métodos expuestos a otros plugins
    miMetodo: function() { /* ... */ }
  },
  
  // Método de inicialización (obligatorio)
  init: function(core) {
    // Código de inicialización
    return true; // Devolver true si la inicialización fue exitosa
  },
  
  // Método de limpieza (obligatorio)
  cleanup: function() {
    // Código de limpieza
    return true; // Devolver true si la limpieza fue exitosa
  }
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
import React from 'react';
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
const STORAGE_KEY_DATA = 'plugin_data';
const STORAGE_KEY_SETTINGS = 'settings';

// Guardar datos
await core.storage.setItem(pluginId, STORAGE_KEY_DATA, misDatos);

// Recuperar datos con valor por defecto ⚠️ CRUCIAL
const misDatos = await core.storage.getItem(pluginId, STORAGE_KEY_DATA, valorPorDefecto);

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
  'nombreDelEvento',
  function(datos, pluginOrigen) {
    // Manejar el evento
  }
);

// ⚠️ IMPORTANTE: Guardar función de cancelación
this._subscriptions.push(unsubscribe);

// Publicar un evento
core.events.publish(
  pluginId,
  'miPlugin.miEvento',
  { datos: 'valor' }
);

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
    props: { /* Props adicionales */ }
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
const canal = core.plugins.createChannel('nombre-canal', pluginId, {
  allowAnyPublisher: false, // Solo creador puede publicar
  sendHistoryOnSubscribe: true, // Enviar historial al suscribirse
  maxMessages: 100 // Máximo historial
});

// Publicar en un canal
canal.publish(mensaje);

// Suscribirse a un canal
const unsub = canal.subscribe(function(mensaje) {
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
const calendar = core.getModule('calendar');

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
  title: 'Mi evento',
  start: new Date(),
  end: new Date(Date.now() + 3600000), // 1 hora después
  color: '#2D4B94'
});

// Actualizar un evento existente
const updatedEvent = calendar.updateEvent(eventId, {
  title: 'Título actualizado'
});

// Eliminar un evento
const deleted = calendar.deleteEvent(eventId);

// Obtener eventos agrupados por categoría
const eventsByColor = calendar.getEventsByCategory('color');

// Obtener metadatos del mes actual
const monthMetadata = calendar.getMonthMetadata(); // Array con info de cada día
```

## Sistema de permisos

Los plugins deben declarar los permisos que necesitan:

```javascript
permissions: ['storage', 'events', 'ui', 'network']
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
    cpuTimePerMinute: 5000,   // 5 segundos
    networkRequestsPerMinute: 60,
    apiCallsPerMinute: 200,
  },
  NORMAL: {
    memory: 5 * 1024 * 1024,  // 5 MB
    cpuTimePerMinute: 2000,   // 2 segundos
    networkRequestsPerMinute: 30,
    apiCallsPerMinute: 100,
  },
  HIGH: {
    memory: 2 * 1024 * 1024,  // 2 MB
    cpuTimePerMinute: 1000,   // 1 segundo
    networkRequestsPerMinute: 10,
    apiCallsPerMinute: 50,
  }
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
  totalOperations: númeroTotalDeOperaciones
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
  CALENDAR_SIDEBAR: 'calendar-sidebar',          // Barra lateral del calendario
  SETTINGS_PANEL: 'settings-panel',              // Panel de configuración
  MAIN_NAVIGATION: 'main-navigation',            // Navegación principal
  PLUGIN_PAGES: 'plugin-pages',                  // Páginas completas
  CALENDAR_DAY_HEADER: 'calendar-day-header',    // Encabezados de día en calendario
  CALENDAR_HOUR_CELL: 'calendar-hour-cell',      // Celdas de hora en calendario
  EVENT_DETAIL_VIEW: 'event-detail-view',        // Vista detallada de eventos
  EVENT_FORM: 'event-form'                       // Formulario de eventos
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
      ...propsFromAtlas,    // Props que Atlas proporciona
      plugin: self,         // Instancia del plugin
      core: self._core,     // API de Core
      pluginId: self.id,    // ID del plugin
      ...extraProps         // Props adicionales específicas
    });
  };
}

// Uso del patrón:
const NavigationWrapper = this._createComponentWrapper(MiNavComponent, {
  pageIdToNavigate: this._PAGE_ID
});

const extensionId = this._core.ui.registerExtension(
  this.id,
  this._core.ui.getExtensionZones().MAIN_NAVIGATION,
  NavigationWrapper, // Registra el Wrapper, no el componente directamente
  { order: 100 }
);
```

### Componentes para la barra lateral

```javascript
function SidebarWidget(props) {
  return React.createElement(
    'div',
    { className: 'sidebar-widget' },
    [
      React.createElement('h3', { key: 'title' }, 'Mi Widget'),
      React.createElement('p', { key: 'content' }, 'Contenido de mi widget')
    ]
  );
}

// Registrar en la barra lateral usando el patrón Wrapper
const SidebarWrapper = this._createComponentWrapper(SidebarWidget);

const extensionId = core.ui.registerExtension(
  pluginId,
  core.ui.getExtensionZones().CALENDAR_SIDEBAR,
  SidebarWrapper,
  { order: 100 }
);
```

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
    'div',
    { 
      className: 'day-header-extension',
      style: { 
        backgroundColor: isWeekend ? '#ffebee' : 'transparent',
        padding: '2px 4px',
        borderRadius: '4px'
      }
    },
    isWeekend ? '🌟' : null
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
    'div',
    { 
      className: 'hour-cell-extension',
      style: {
        position: 'absolute',
        right: '4px',
        top: '4px',
        fontSize: '12px',
        opacity: 0.6
      }
    },
    isLunchTime ? '🍽️' : null
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
    'div',
    { className: 'event-detail-extension' },
    React.createElement('h4', {}, 'Información adicional'),
    React.createElement('p', {}, 'Datos personalizados para este evento')
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
        name: 'metadatos',
        value: e.target.value
      }
    });
  };

  return React.createElement(
    'div',
    { className: 'event-form-extension' },
    React.createElement('label', {}, 'Metadatos:'),
    React.createElement(
      'input',
      {
        type: 'text',
        value: props.event.metadatos || '',
        onChange: handleChange
      }
    )
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
const PAGE_ID = 'mi-pagina-principal';

// Componente de navegación
function NavigationItem(props) {
  const handleClick = () => {
    // ⚠️ CRÍTICO: Usar exactamente el mismo pageId
    props.onNavigate(props.pluginId, props.pageIdToNavigate);
  };
  
  return React.createElement(
    'div',
    { className: 'nav-item', onClick: handleClick },
    [
      React.createElement(
        'span',
        { className: 'material-icons', key: 'icon' },
        'extension'
      ),
      React.createElement(
        'span',
        { key: 'label' },
        'Mi Plugin'
      )
    ]
  );
}

// Componente de página
function MainPage(props) {
  return React.createElement(
    'div',
    { className: 'plugin-page' },
    [
      React.createElement('h1', { key: 'title' }, 'Mi Plugin'),
      React.createElement('p', { key: 'content' }, 'Contenido de mi página principal')
    ]
  );
}

// Registrar navegación
const navWrapper = this._createComponentWrapper(NavigationItem, {
  pageIdToNavigate: PAGE_ID // Pasar el pageId como prop
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
      pageId: PAGE_ID // ¡OBLIGATORIO!
    }
  }
);
```

### Widgets para el panel de configuración

```javascript
function SettingsWidget(props) {
  const [valor, setValor] = React.useState('');
  
  const handleChange = (e) => {
    setValor(e.target.value);
    // Guardar configuración
    props.onSettingChange('miConfiguracion', e.target.value);
  };
  
  return React.createElement(
    'div',
    { className: 'settings-widget' },
    [
      React.createElement('h3', { key: 'title' }, 'Configuración de Mi Plugin'),
      React.createElement(
        'input',
        {
          key: 'input',
          type: 'text',
          value: valor,
          onChange: handleChange,
          placeholder: 'Configuración'
        }
      )
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
      const currentItems = await props.plugin.publicAPI.getAllItems();
      setItems(currentItems);
    } catch (error) {
      console.error('Error al cargar items:', error);
      setItems([]); // Valor de emergencia
    } finally {
      setLoading(false);
    }
  }, [props.plugin]);
  
  // ⚠️ Cargar datos iniciales
  React.useEffect(() => {
    refreshItems();
  }, [refreshItems]);
  
  // ⚠️ Función para manejar acciones
  const handleCreateItem = async (itemData) => {
    try {
      await props.plugin.publicAPI.createItem(itemData);
      refreshItems(); // ⚠️ Refrescar después de modificar
    } catch (error) {
      console.error('Error al crear item:', error);
    }
  };
  
  if (loading) {
    return React.createElement('div', {}, 'Cargando...');
  }
  
  return React.createElement(
    'div',
    { className: 'items-list' },
    [
      React.createElement('h2', { key: 'title' }, 'Mi Lista'),
      React.createElement(
        'button',
        { key: 'add-btn', onClick: () => handleCreateItem({ name: 'Nuevo item' }) },
        'Añadir Item'
      ),
      React.createElement(
        'ul',
        { key: 'list' },
        items.map((item, index) => 
          React.createElement(
            'li', 
            { key: item.id || index }, // ⚠️ Key única obligatoria
            item.name
          )
        )
      )
    ]
  );
}
```

### 2. Estado para formularios

```javascript
function MiFormulario(props) {
  // ⚠️ Estado inicial basado en props
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    status: 'active'
  });
  
  // ⚠️ Resetear formulario cuando cambian las props
  React.useEffect(() => {
    if (props.existingItem) {
      setFormData(props.existingItem);
    } else {
      setFormData({ name: '', description: '', status: 'active' });
    }
  }, [props.existingItem]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ⚠️ Validación básica
    if (!formData.name.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    
    try {
      if (props.existingItem) {
        await props.plugin.publicAPI.updateItem(props.existingItem.id, formData);
      } else {
        await props.plugin.publicAPI.createItem(formData);
      }
      
      // ⚠️ Callback al componente padre
      if (props.onSave) {
        props.onSave(formData);
      }
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };
  
  return React.createElement(
    'form',
    { onSubmit: handleSubmit },
    [
      React.createElement(
        'input',
        {
          key: 'name',
          type: 'text',
          name: 'name',
          value: formData.name,
          onChange: handleChange,
          placeholder: 'Nombre'
        }
      ),
      React.createElement(
        'textarea',
        {
          key: 'description',
          name: 'description',
          value: formData.description,
          onChange: handleChange,
          placeholder: 'Descripción'
        }
      ),
      React.createElement(
        'select',
        {
          key: 'status',
          name: 'status',
          value: formData.status,
          onChange: handleChange
        },
        [
          React.createElement('option', { key: 'active', value: 'active' }, 'Activo'),
          React.createElement('option', { key: 'inactive', value: 'inactive' }, 'Inactivo')
        ]
      ),
      React.createElement(
        'button',
        { key: 'submit', type: 'submit' },
        props.existingItem ? 'Actualizar' : 'Crear'
      )
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
    // La lógica de guardado se maneja en el formulario
    handleCloseModal();
  };
  
  return React.createElement(
    'div',
    { className: 'component-with-modal' },
    [
      React.createElement(
        'button',
        { key: 'open-btn', onClick: () => handleOpenModal() },
        'Crear Nuevo'
      ),
      
      // ⚠️ Renderizado condicional del modal
      showModal && React.createElement(
        'div',
        {
          key: 'modal',
          className: 'modal-overlay',
          style: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }
        },
        React.createElement(
          'div',
          {
            className: 'modal-content',
            style: {
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%'
            }
          },
          [
            React.createElement(MiFormulario, {
              key: 'form',
              plugin: props.plugin,
              existingItem: editingItem,
              onSave: handleSave
            }),
            React.createElement(
              'button',
              { key: 'cancel', onClick: handleCloseModal },
              'Cancelar'
            )
          ]
        )
      )
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
    getAllItems: () => [...self._items], // ⚠️ Devolver copia
    getItem: (id) => self._items.find(item => item.id === id),
    
    // Operaciones de escritura (deben ser async si usan storage)
    createItem: async (itemData) => {
      return await self._internalCreateItem(itemData);
    },
    
    updateItem: async (id, updateData) => {
      return await self._internalUpdateItem(id, updateData);
    },
    
    deleteItem: async (id) => {
      return await self._internalDeleteItem(id);
    }
  };
},

// Métodos internos que realmente modifican los datos
async _internalCreateItem(itemData) {
  const newItem = {
    id: Date.now().toString(),
    ...itemData,
    createdAt: new Date().toISOString()
  };
  
  this._items.push(newItem);
  await this._saveDataToStorage(); // ⚠️ Persistir cambios
  return newItem;
},

async _internalUpdateItem(id, updateData) {
  const index = this._items.findIndex(item => item.id === id);
  if (index === -1) {
    throw new Error(`Item con ID ${id} no encontrado`);
  }
  
  this._items[index] = {
    ...this._items[index],
    ...updateData,
    updatedAt: new Date().toISOString()
  };
  
  await this._saveDataToStorage();
  return this._items[index];
},

async _internalDeleteItem(id) {
  const index = this._items.findIndex(item => item.id === id);
  if (index === -1) {
    throw new Error(`Item con ID ${id} no encontrado`);
  }
  
  const deletedItem = this._items.splice(index, 1)[0];
  await this._saveDataToStorage();
  return deletedItem;
}
```

## Estilos y temas

### Sistema de temas de Atlas

Atlas utiliza un sistema de temas basado en variables CSS que permite a los plugins adaptarse automáticamente a diferentes esquemas de colores. Todos los plugins deben usar estas variables en lugar de colores directos para garantizar una apariencia coherente.

```javascript
// Ejemplo de componente con estilos adaptados al tema
function ThemeAwareComponent() {
  return React.createElement(
    'div',
    {
      style: {
        backgroundColor: 'var(--card-bg)',
        color: 'var(--text-color)',
        border: '1px solid var(--border-color)',
        padding: 'var(--spacing-md)',
        borderRadius: 'var(--border-radius-md)'
      }
    },
    'Este componente se adapta automáticamente al tema'
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

1. **Usa siempre variables CSS** en lugar de colores directos:

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

2. **Considera diferentes modos de color**:

El sistema de temas de Atlas incluye temas claros y oscuros. Asegúrate de que tu UI sea legible en ambos modos.

3. **Prueba tu plugin en diferentes temas**:

Verifica que tu plugin luce bien en todos los temas disponibles de Atlas, especialmente en los temas predeterminados y cualquier tema de alto contraste.

### Buenas prácticas de CSS

1. **Usa prefijos específicos** para clases CSS para evitar conflictos:

```css
/* Prefijo todas las clases con tu ID de plugin */
.mi-plugin-container { }
.mi-plugin-button { }
.mi-plugin-input { }
```

2. **Evita selectores demasiado genéricos** que puedan afectar a otros plugins:

```css
/* Mal - selector demasiado genérico */
.container { }
.button { }

/* Bien - selector específico */
.mi-plugin-container { }
.mi-plugin-button { }
```

3. **Aprovecha los componentes existentes**:

Atlas proporciona varios componentes UI reutilizables. Úsalos cuando sea posible para mantener consistencia.

4. **Considera la accesibilidad**:

- Mantén suficiente contraste entre texto y fondo
- No dependas solo del color para transmitir información
- Asegúrate de que los elementos interactivos sean claramente identificables

5. **Organiza tus estilos**:

```css
/* Ejemplo de organización de CSS */

/* 1. Variables y configuración */
:root {
  --mi-plugin-spacing: 12px;
}

/* 2. Estructuras generales */
.mi-plugin-container { }
.mi-plugin-header { }
.mi-plugin-content { }

/* 3. Componentes específicos */
.mi-plugin-button { }
.mi-plugin-button:hover { }
.mi-plugin-input { }

/* 4. Modificadores y estados */
.mi-plugin-button--primary { }
.mi-plugin-button--disabled { }
.mi-plugin-input--focused { }

/* 5. Estilos específicos de páginas o vistas */
.mi-plugin-settings-page { }
.mi-plugin-dashboard { }
```

## Dependencias y conflictos

### Manejo de dependencias

Puedes especificar dependencias de otros plugins:

```javascript
// Dependencias
dependencies: [
  'plugin-requerido',
  { id: 'otro-plugin', version: '1.2.0' }
]
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
  'plugin-incompatible',
  { 
    id: 'otro-plugin-problematico', 
    reason: 'Usa los mismos recursos y causa conflictos'
  }
]
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
  id: 'mi-repositorio',
  name: 'Mi Repositorio de Plugins',
  url: 'https://mi-sitio.com/plugins',
  apiEndpoint: 'https://api.mi-sitio.com/plugins',
  description: 'Repositorio personal de plugins',
  official: false,
  enabled: true
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
  checkAutomatically: true,      // Verificar automáticamente
  checkInterval: 86400000,       // Cada 24 horas
  autoUpdate: false,             // No actualizar automáticamente
  updateNotificationsEnabled: true // Mostrar notificaciones
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
  const result = data.items.filter(item => item.active);
  return result;
}

// ✅ Bueno: Validación antes de uso
function processData(data) {
  if (!data || !Array.isArray(data.items)) {
    console.warn('Datos inválidos, usando valores predeterminados');
    return [];
  }
  
  const result = data.items.filter(item => item.active === true);
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
    console.warn('Error al obtener configuración, usando valores predeterminados');
    return {};
  }
}
```

4. **Maneja errores asíncronos**:

```javascript
// Manejo de promesas con catch
core.storage.getItem(this.id, 'data')
  .then(function(data) {
    // Usar datos
  })
  .catch(function(error) {
    console.error('Error al obtener datos:', error);
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
    'ul',
    {},
    props.items.map((item) => 
      React.createElement('li', {}, item.name) // ⚠️ Falta key
    )
  );
}

// ✅ Correcto: Con key props únicas
function MiLista(props) {
  return React.createElement(
    'ul',
    {},
    props.items.map((item, index) => 
      React.createElement(
        'li', 
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
  const subscription = props.core.events.subscribe(
    'event',
    handleEvent
  );
  // Sin función de limpieza
}, []);

// ✅ Correcto: Limpieza adecuada
React.useEffect(() => {
  const subscription = props.core.events.subscribe(
    'event',
    handleEvent
  );
  
  return () => {
    if (typeof subscription === 'function') {
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
props: { pageId: 'mi-pagina' }

// En navegación:
props.onNavigate(pluginId, 'mi-pagina-principal'); // ¡No coincide!

// ✅ Correcto: Usar constante
const PAGE_ID = 'mi-pagina-principal';

// En registro:
props: { pageId: PAGE_ID }

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
  
  return React.createElement('div', {}, expensiveResult);
}
```

3. **Evita renderizados innecesarios**:

```javascript
// Evitar recrear funciones en cada renderizado
function MyComponent() {
  // ❌ Mal: Se crea una nueva función en cada renderizado
  return React.createElement(
    'button', 
    { onClick: () => handleClick() }, 
    'Click me'
  );
  
  // ✅ Bien: Usar useCallback
  const handleButtonClick = React.useCallback(() => {
    handleClick();
  }, []);
  
  return React.createElement(
    'button', 
    { onClick: handleButtonClick }, 
    'Click me'
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
      fetchUsers().then(data => {
        setUsers(data);
        setLoaded(true);
      });
    }
  };
  
  return React.createElement(
    'div',
    {},
    [
      !loaded && React.createElement(
        'button', 
        { key: 'load', onClick: loadUsers }, 
        'Cargar usuarios'
      ),
      loaded && React.createElement(UserTable, { key: 'table', users: users })
    ]
  );
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
  eventos: this._data.registroEventos?.length || 0
});
```

3. **Depuración de componentes React**:

```javascript
function DebugComponent(props) {
  console.log('Renderizando con props:', props);
  
  // Depurar ciclo de vida
  React.useEffect(() => {
    console.log('Componente montado');
    return () => {
      console.log('Componente desmontado');
    };
  }, []);
  
  return React.createElement('div', {}, 'Componente');
}
```

4. **Monitoreo de eventos**:

```javascript
// Función para monitorear eventos en el sistema
function monitorEvents(core, eventPattern) {
  return core.events.subscribe(
    'debug-monitor',
    eventPattern || '*',
    function(data, eventName, pluginId) {
      console.log(`[Event] ${pluginId} → ${eventName}`, data);
    }
  );
}

// Usar en depuración
const unsubscribe = monitorEvents(core, 'calendar.*');
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
   someFunction(function() {
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
     core.storage.setItem(id, 'data', data);
     // Continúa sin esperar a que termine la operación
     doNextThing();
   }
   
   // ✅ Correcto con then/catch
   function saveData() {
     core.storage.setItem(id, 'data', data)
       .then(() => {
         doNextThing();
       })
       .catch(error => {
         console.error('Error al guardar:', error);
       });
   }
   
   // ✅ Correcto con async/await
   async function saveData() {
     try {
       await core.storage.setItem(id, 'data', data);
       doNextThing();
     } catch (error) {
       console.error('Error al guardar:', error);
     }
   }
   ```

6. **Error**: Los eventos del calendario no se reciben

   **Solución**: Verificar que estás suscrito a los nombres correctos de eventos.
   
   ```javascript
   // ✅ Los nombres correctos de eventos son:
   'calendar.eventCreated'    // NO 'calendar.create'
   'calendar.eventUpdated'    // NO 'calendar.update'
   'calendar.eventDeleted'    // NO 'calendar.delete'
   'calendar.eventsLoaded'    // Cuando se cargan todos los eventos
   
   // ✅ Ejemplo correcto:
   core.events.subscribe(
     pluginId,
     'calendar.eventUpdated',
     function(data) {
       // data contiene { oldEvent, newEvent }
       console.log('Evento actualizado de:', data.oldEvent);
       console.log('a:', data.newEvent);
     }
   );
   ```

7. **Error**: "La página del plugin no se muestra"

   **Causa**: El `pageId` en el registro no coincide con el usado en navegación.
   
   **Solución**: Usar exactamente el mismo `pageId`:
   
   ```javascript
   // ✅ Definir constante
   const PAGE_ID = 'mi-pagina-principal';
   
   // ✅ En registro de página:
   core.ui.registerExtension(
     pluginId,
     core.ui.getExtensionZones().PLUGIN_PAGES,
     PageWrapper,
     {
       order: 100,
       props: { pageId: PAGE_ID } // ✅ Usar constante
     }
   );
   
   // ✅ En navegación:
   props.onNavigate(props.pluginId, PAGE_ID); // ✅ Misma constante
   ```

8. **Error**: "Warning: Each child in a list should have a unique 'key' prop"

   **Solución**: Añadir key props únicas a elementos de lista:
   
   ```javascript
   // ✅ Correcto: Key props en listas
   Object.keys(VIDEO_STATUS).map(statusKey => 
     React.createElement('option', { 
       key: VIDEO_STATUS[statusKey], // ✅ Key única obligatoria
       value: VIDEO_STATUS[statusKey] 
     }, statusKey)
   )
   ```

## Ejemplos prácticos

### Plugin simple con extensión de calendario

```javascript
import React from 'react';

export default {
  id: 'calendario-notificador',
  name: 'Notificador de Eventos',
  version: '1.0.0',
  description: 'Añade notificaciones visuales al calendario',
  author: 'Tu Nombre',
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
  permissions: ['storage', 'events', 'ui'],
  
  _core: null,
  _settings: {
    notificationColor: '#FF5722',
    showInHeaders: true,
    showInCells: true
  },
  _subscriptions: [],
  _extensionIds: {},
  
  init: async function(core) {
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
      console.error('[Notificador] Error al inicializar:', error);
      return false;
    }
  },
  
  cleanup: async function() {
    try {
      // Guardar configuración
      await this._saveSettings();
      
      // Cancelar suscripciones a eventos
      this._subscriptions.forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
      
      return true;
    } catch (error) {
      console.error('[Notificador] Error al limpiar:', error);
      return false;
    }
  },
  
  _loadSettings: async function() {
    try {
      const savedSettings = await this._core.storage.getItem(
        this.id,
        'settings',
        null
      );
      
      if (savedSettings) {
        this._settings = { ...this._settings, ...savedSettings };
      }
    } catch (error) {
      console.error('[Notificador] Error al cargar configuración:', error);
    }
  },
  
  _saveSettings: async function() {
    try {
      await this._core.storage.setItem(
        this.id,
        'settings',
        this._settings
      );
    } catch (error) {
      console.error('[Notificador] Error al guardar configuración:', error);
    }
  },
  
  _setupEventListeners: function() {
    // Suscribirse a eventos del calendario
    const eventCreatedSub = this._core.events.subscribe(
      this.id,
      'calendar.eventCreated',
      this._handleEventChanged.bind(this)
    );
    
    const eventUpdatedSub = this._core.events.subscribe(
      this.id,
      'calendar.eventUpdated',
      this._handleEventChanged.bind(this)
    );
    
    const eventDeletedSub = this._core.events.subscribe(
      this.id,
      'calendar.eventDeleted',
      this._handleEventChanged.bind(this)
    );
    
    this._subscriptions.push(eventCreatedSub, eventUpdatedSub, eventDeletedSub);
  },
  
  _handleEventChanged: function(data) {
    // Aquí podrías procesar los cambios de eventos
    // Para este plugin, las extensiones UI reaccionan automáticamente
    console.log('[Notificador] Evento del calendario recibido:', data);
  },
  
  _createComponentWrapper: function(Component, extraProps = {}) {
    const self = this;
    
    return function ComponentWrapper(propsFromAtlas) {
      return React.createElement(Component, {
        ...propsFromAtlas,
        plugin: self,
        core: self._core,
        pluginId: self.id,
        ...extraProps
      });
    };
  },
  
  _registerUIExtensions: function() {
    const self = this;
    
    // Crear componente para encabezados de día
    function DayHeaderExtension(props) {
      const [eventCount, setEventCount] = React.useState(0);
      
      React.useEffect(() => {
        // Obtener módulo de calendario
        const calendar = self._core.getModule('calendar');
        if (!calendar) return;
        
        // Obtener eventos para esta fecha
        const eventsForDay = calendar.getEventsForDate(props.date);
        setEventCount(eventsForDay.length);
      }, [props.date]);
      
      // No mostrar nada si no hay eventos o según configuración
      if (eventCount === 0 || !self._settings.showInHeaders) return null;
      
      return React.createElement(
        'span',
        { 
          className: 'notification-badge',
          style: {
            backgroundColor: self._settings.notificationColor,
            color: 'white',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: '11px',
            marginLeft: '4px'
          }
        },
        eventCount
      );
    }
    
    // Crear componente para celdas de hora
    function HourCellExtension(props) {
      const [hasEvent, setHasEvent] = React.useState(false);
      
      React.useEffect(() => {
        // Obtener módulo de calendario
        const calendar = self._core.getModule('calendar');
        if (!calendar) return;
        
        // Verificar si hay eventos en esta hora
        const eventsForDay = calendar.getEventsForDate(props.date);
        const eventsInHour = eventsForDay.filter(event => {
          const eventStart = new Date(event.start);
          return eventStart.getHours() === props.hour &&
                 eventStart.getMinutes() === props.minutes;
        });
        
        setHasEvent(eventsInHour.length > 0);
      }, [props.date, props.hour, props.minutes]);
      
      // No mostrar nada si no hay eventos o según configuración
      if (!hasEvent || !self._settings.showInCells) return null;
      
      return React.createElement(
        'div',
        { 
          className: 'hour-notification-indicator',
          style: {
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: self._settings.notificationColor
          }
        }
      );
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
  
  _registerSettingsPanel: function() {
    const self = this;
    
    // Crear componente para panel de configuración
    function SettingsPanel(props) {
      const [settings, setSettings] = React.useState({...self._settings});
      
      const handleColorChange = (e) => {
        const newSettings = {
          ...settings,
          notificationColor: e.target.value
        };
        
        setSettings(newSettings);
        self._settings = newSettings;
        self._saveSettings();
      };
      
      const handleToggleChange = (setting) => (e) => {
        const newSettings = {
          ...settings,
          [setting]: e.target.checked
        };
        
        setSettings(newSettings);
        self._settings = newSettings;
        self._saveSettings();
      };
      
      return React.createElement(
        'div',
        { className: 'settings-panel' },
        [
          React.createElement('h3', { key: 'title' }, 'Configuración de Notificaciones'),
          
          React.createElement(
            'div',
            { key: 'color', className: 'settings-group' },
            [
              React.createElement('label', { key: 'label' }, 'Color de notificación:'),
              React.createElement(
                'input',
                {
                  key: 'input',
                  type: 'color',
                  value: settings.notificationColor,
                  onChange: handleColorChange
                }
              )
            ]
          ),
          
          React.createElement(
            'div',
            { key: 'headers', className: 'settings-group' },
            [
              React.createElement('label', { key: 'label' }, 'Mostrar en encabezados de día:'),
              React.createElement(
                'input',
                {
                  key: 'input',
                  type: 'checkbox',
                  checked: settings.showInHeaders,
                  onChange: handleToggleChange('showInHeaders')
                }
              )
            ]
          ),
          
          React.createElement(
            'div',
            { key: 'cells', className: 'settings-group' },
            [
              React.createElement('label', { key: 'label' }, 'Mostrar en celdas de hora:'),
              React.createElement(
                'input',
                {
                  key: 'input',
                  type: 'checkbox',
                  checked: settings.showInCells,
                  onChange: handleToggleChange('showInCells')
                }
              )
            ]
          )
        ]
      );
    }
    
    // Registrar en el panel de configuración
    this._extensionIds.settings = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().SETTINGS_PANEL,
      this._createComponentWrapper(SettingsPanel),
      { order: 100 }
    );
  }
};
```

### Plugin con página completa y API pública

```javascript
import React from 'react';

export default {
  id: 'estadisticas-tiempo',
  name: 'Estadísticas de Tiempo',
  version: '1.0.0',
  description: 'Muestra estadísticas sobre el uso del tiempo',
  author: 'Tu Nombre',
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
  permissions: ['storage', 'events', 'ui', 'communication'],
  
  _core: null,
  _data: {
    stats: {},
    lastUpdate: null
  },
  _subscriptions: [],
  _extensionIds: {},
  _PAGE_ID: 'estadisticas',
  
  init: async function(core) {
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
  
  cleanup: async function() {
    try {
      // Guardar datos
      await this._saveDataToStorage();
      
      // Cancelar suscripciones
      this._subscriptions.forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
      
      return true;
    } catch (error) {
      console.error(`[${this.name}] Error en limpieza:`, error);
      return false;
    }
  },
  
  async _loadDataFromStorage() {
    const STORAGE_KEY = 'stats_data';
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
    const STORAGE_KEY = 'stats_data';
    try {
      await this._core.storage.setItem(this.id, STORAGE_KEY, this._data);
    } catch (error) {
      console.error(`[${this.name}] Error al guardar datos:`, error);
    }
  },
  
  _createPublicAPI: function() {
    const self = this;
    
    return {
      getStats: function() {
        return { ...self._data.stats };
      },
      
      getDailySummary: function(date) {
        const dateStr = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        return self._data.stats[dateStr] || { created: 0, updated: 0, deleted: 0 };
      },
      
      getLastUpdateTime: function() {
        return self._data.lastUpdate;
      }
    };
  },
  
  _setupEventListeners: function() {
    // Suscribirse a eventos de calendario
    const createdSub = this._core.events.subscribe(
      this.id,
      'calendar.eventCreated',
      (data) => this._updateStats({ ...data, type: 'created' })
    );
    
    const updatedSub = this._core.events.subscribe(
      this.id,
      'calendar.eventUpdated',
      (data) => this._updateStats({ ...data, type: 'updated' })
    );
    
    const deletedSub = this._core.events.subscribe(
      this.id,
      'calendar.eventDeleted',
      (data) => this._updateStats({ ...data, type: 'deleted' })
    );
    
    this._subscriptions.push(createdSub, updatedSub, deletedSub);
  },
  
  _updateStats: async function(eventData) {
    // Actualizar estadísticas
    const stats = this._data.stats;
    const date = new Date().toISOString().split('T')[0];
    
    if (!stats[date]) {
      stats[date] = { created: 0, updated: 0, deleted: 0 };
    }
    
    if (eventData.type === 'created') {
      stats[date].created++;
    } else if (eventData.type === 'updated') {
      stats[date].updated++;
    } else if (eventData.type === 'deleted') {
      stats[date].deleted++;
    }
    
    this._data.lastUpdate = Date.now();
    
    // Publicar evento propio
    this._core.events.publish(
      this.id,
      'estadisticasTiempo.actualizado',
      { stats: this._data.stats }
    );
    
    // Guardar datos
    await this._saveDataToStorage();
  },
  
  _createComponentWrapper: function(Component, extraProps = {}) {
    const self = this;
    
    return function ComponentWrapper(propsFromAtlas) {
      return React.createElement(Component, {
        ...propsFromAtlas,
        plugin: self,
        core: self._core,
        pluginId: self.id,
        ...extraProps
      });
    };
  },
  
  _registerNavigation: function() {
    const self = this;
    
    function NavItem(props) {
      const handleClick = () => {
        props.onNavigate(props.pluginId, props.pageIdToNavigate);
      };
      
      return React.createElement(
        'div',
        {
          className: 'navigation-item',
          onClick: handleClick,
          style: { cursor: 'pointer', padding: '8px' }
        },
        [
          React.createElement(
            'span',
            { className: 'material-icons', key: 'icon' },
            'bar_chart'
          ),
          React.createElement(
            'span',
            { key: 'label', style: { marginLeft: '8px' } },
            'Estadísticas'
          )
        ]
      );
    }
    
    const navWrapper = this._createComponentWrapper(NavItem, {
      pageIdToNavigate: this._PAGE_ID
    });
    
    this._extensionIds.navigation = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().MAIN_NAVIGATION,
      navWrapper,
      { order: 100 }
    );
  },
  
  _registerMainPage: function() {
    const self = this;
    
    function StatsPage(props) {
      const [stats, setStats] = React.useState({});
      
      React.useEffect(() => {
        // Cargar estadísticas iniciales
        setStats({...self._data.stats});
        
        // Suscribirse a actualizaciones
        const unsub = self._core.events.subscribe(
          props.pluginId,
          'estadisticasTiempo.actualizado',
          (data) => {
            setStats(data.stats);
          }
        );
        
        return () => unsub();
      }, []);
      
      // Función para descargar estadísticas
      const handleDownload = () => {
        const json = JSON.stringify(stats, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'estadisticas.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };
      
      return React.createElement(
        'div',
        { 
          className: 'stats-page',
          style: { padding: '20px' }
        },
        [
          React.createElement('h1', { key: 'title' }, 'Estadísticas de Tiempo'),
          
          React.createElement(
            'button',
            { 
              key: 'download', 
              className: 'download-button',
              onClick: handleDownload,
              style: {
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '20px'
              }
            },
            'Descargar estadísticas'
          ),
          
          React.createElement(
            'div',
            { className: 'stats-container', key: 'container' },
            Object.entries(stats).length === 0 ?
              React.createElement('p', { key: 'no-data' }, 'No hay estadísticas disponibles') :
              Object.entries(stats).map(([date, dayStat]) => {
                return React.createElement(
                  'div',
                  { 
                    className: 'stat-item', 
                    key: date,
                    style: {
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '12px'
                    }
                  },
                  [
                    React.createElement('h3', { key: 'date' }, date),
                    React.createElement(
                      'ul',
                      { key: 'list', style: { listStyle: 'none', padding: 0 } },
                      [
                        React.createElement('li', { key: 'created' }, `✅ Creados: ${dayStat.created}`),
                        React.createElement('li', { key: 'updated' }, `📝 Actualizados: ${dayStat.updated}`),
                        React.createElement('li', { key: 'deleted' }, `❌ Eliminados: ${dayStat.deleted}`),
                        React.createElement('li', { key: 'total' }, `📊 Total: ${dayStat.created + dayStat.updated + dayStat.deleted}`)
                      ]
                    )
                  ]
                );
              })
          )
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
          pageId: this._PAGE_ID 
        }
      }
    );
  }
};
```

### Plugin Completo con Formularios y Gestión de Estado

```javascript
import React from 'react';

// Constantes del plugin
const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
};

const STATUS_LABELS = {
  [TASK_STATUS.PENDING]: 'Pendiente',
  [TASK_STATUS.IN_PROGRESS]: 'En Progreso',
  [TASK_STATUS.COMPLETED]: 'Completado'
};

export default {
  id: 'task-manager',
  name: 'Gestor de Tareas',
  version: '1.0.0',
  description: 'Plugin completo para gestión de tareas con formularios',
  author: 'Tu Nombre',
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
  permissions: ['storage', 'events', 'ui'],
  
  _core: null,
  _tasks: [],
  _subscriptions: [],
  _extensionIds: {},
  _PAGE_ID: 'task-manager',
  
  init: async function(core) {
    try {
      this._core = core;
      this._subscriptions = [];
      this._extensionIds = {};
      
      // Cargar datos
      await this._loadTasksFromStorage();
      
      // Crear API pública
      this.publicAPI = this._createPublicAPI();
      core.plugins.registerAPI(this.id, this.publicAPI);
      
      // Registrar UI
      this._registerNavigation();
      this._registerMainPage();
      
      console.log(`[${this.name}] Inicializado correctamente`);
      return true;
    } catch (error) {
      console.error(`[${this.name}] Error de inicialización:`, error);
      return false;
    }
  },
  
  cleanup: async function() {
    try {
      await this._saveTasksToStorage();
      
      this._subscriptions.forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
      
      return true;
    } catch (error) {
      console.error(`[${this.name}] Error en limpieza:`, error);
      return false;
    }
  },
  
  async _loadTasksFromStorage() {
    const STORAGE_KEY = 'tasks';
    try {
      const storedTasks = await this._core.storage.getItem(
        this.id, 
        STORAGE_KEY, 
        []
      );
      this._tasks = storedTasks || [];
    } catch (error) {
      console.error(`[${this.name}] Error al cargar tareas:`, error);
      this._tasks = [];
    }
  },
  
  async _saveTasksToStorage() {
    const STORAGE_KEY = 'tasks';
    try {
      await this._core.storage.setItem(this.id, STORAGE_KEY, this._tasks);
    } catch (error) {
      console.error(`[${this.name}] Error al guardar tareas:`, error);
    }
  },
  
  _createPublicAPI: function() {
    const self = this;
    
    return {
      getAllTasks: () => [...self._tasks],
      
      createTask: async (taskData) => {
        return await self._internalCreateTask(taskData);
      },
      
      updateTask: async (id, updateData) => {
        return await self._internalUpdateTask(id, updateData);
      },
      
      deleteTask: async (id) => {
        return await self._internalDeleteTask(id);
      },
      
      getTasksByStatus: (status) => {
        return self._tasks.filter(task => task.status === status);
      }
    };
  },
  
  async _internalCreateTask(taskData) {
    const newTask = {
      id: Date.now().toString(),
      title: taskData.title || '',
      description: taskData.description || '',
      status: taskData.status || TASK_STATUS.PENDING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this._tasks.push(newTask);
    await this._saveTasksToStorage();
    
    // Publicar evento
    this._core.events.publish(
      this.id,
      'taskManager.taskCreated',
      { task: newTask }
    );
    
    return newTask;
  },
  
  async _internalUpdateTask(id, updateData) {
    const index = this._tasks.findIndex(task => task.id === id);
    if (index === -1) {
      throw new Error(`Tarea con ID ${id} no encontrada`);
    }
    
    this._tasks[index] = {
      ...this._tasks[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    await this._saveTasksToStorage();
    
    // Publicar evento
    this._core.events.publish(
      this.id,
      'taskManager.taskUpdated',
      { task: this._tasks[index] }
    );
    
    return this._tasks[index];
  },
  
  async _internalDeleteTask(id) {
    const index = this._tasks.findIndex(task => task.id === id);
    if (index === -1) {
      throw new Error(`Tarea con ID ${id} no encontrada`);
    }
    
    const deletedTask = this._tasks.splice(index, 1)[0];
    await this._saveTasksToStorage();
    
    // Publicar evento
    this._core.events.publish(
      this.id,
      'taskManager.taskDeleted',
      { task: deletedTask }
    );
    
    return deletedTask;
  },
  
  _createComponentWrapper: function(Component, extraProps = {}) {
    const self = this;
    
    return function ComponentWrapper(propsFromAtlas) {
      return React.createElement(Component, {
        ...propsFromAtlas,
        plugin: self,
        core: self._core,
        pluginId: self.id,
        ...extraProps
      });
    };
  },
  
  _registerNavigation: function() {
    function NavItem(props) {
      const handleClick = () => {
        props.onNavigate(props.pluginId, props.pageIdToNavigate);
      };
      
      return React.createElement(
        'div',
        {
          className: 'navigation-item',
          onClick: handleClick,
          style: { cursor: 'pointer', padding: '8px' }
        },
        [
          React.createElement(
            'span',
            { className: 'material-icons', key: 'icon' },
            'task'
          ),
          React.createElement(
            'span',
            { key: 'label', style: { marginLeft: '8px' } },
            'Tareas'
          )
        ]
      );
    }
    
    const navWrapper = this._createComponentWrapper(NavItem, {
      pageIdToNavigate: this._PAGE_ID
    });
    
    this._extensionIds.navigation = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().MAIN_NAVIGATION,
      navWrapper,
      { order: 100 }
    );
  },
  
  _registerMainPage: function() {
    function TaskManagerPage(props) {
      const [tasks, setTasks] = React.useState([]);
      const [showForm, setShowForm] = React.useState(false);
      const [editingTask, setEditingTask] = React.useState(null);
      
      // Función para refrescar tareas
      const refreshTasks = React.useCallback(async () => {
        try {
          const currentTasks = props.plugin.publicAPI.getAllTasks();
          setTasks(currentTasks);
        } catch (error) {
          console.error('Error al cargar tareas:', error);
          setTasks([]);
        }
      }, [props.plugin]);
      
      // Cargar tareas iniciales
      React.useEffect(() => {
        refreshTasks();
      }, [refreshTasks]);
      
      // Manejar guardado de formulario
      const handleFormSave = async (taskData) => {
        try {
          if (editingTask) {
            await props.plugin.publicAPI.updateTask(editingTask.id, taskData);
          } else {
            await props.plugin.publicAPI.createTask(taskData);
          }
          refreshTasks();
          setShowForm(false);
          setEditingTask(null);
        } catch (error) {
          console.error('Error al guardar tarea:', error);
        }
      };
      
      // Manejar cancelación de formulario
      const handleFormCancel = () => {
        setShowForm(false);
        setEditingTask(null);
      };
      
      // Manejar edición de tarea
      const handleEditTask = (task) => {
        setEditingTask(task);
        setShowForm(true);
      };
      
      // Manejar eliminación de tarea
      const handleDeleteTask = async (taskId) => {
        if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
          try {
            await props.plugin.publicAPI.deleteTask(taskId);
            refreshTasks();
          } catch (error) {
            console.error('Error al eliminar tarea:', error);
          }
        }
      };
      
      // Manejar cambio de estado
      const handleStatusChange = async (taskId, newStatus) => {
        try {
          await props.plugin.publicAPI.updateTask(taskId, { status: newStatus });
          refreshTasks();
        } catch (error) {
          console.error('Error al cambiar estado:', error);
        }
      };
      
      return React.createElement(
        'div',
        { 
          className: 'task-manager-page',
          style: { padding: '20px' }
        },
        [
          React.createElement('h1', { key: 'title' }, 'Gestor de Tareas'),
          
          React.createElement(
            'button',
            { 
              key: 'add-btn',
              onClick: () => setShowForm(true),
              style: {
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '20px'
              }
            },
            'Nueva Tarea'
          ),
          
          React.createElement(
            'div',
            { key: 'tasks-list', className: 'tasks-list' },
            tasks.length === 0 ?
              React.createElement('p', { key: 'no-tasks' }, 'No hay tareas') :
              tasks.map(task => 
                React.createElement(TaskItem, {
                  key: task.id,
                  task: task,
                  onEdit: () => handleEditTask(task),
                  onDelete: () => handleDeleteTask(task.id),
                  onStatusChange: (newStatus) => handleStatusChange(task.id, newStatus)
                })
              )
          ),
          
          // Modal de formulario
          showForm && React.createElement(
            'div',
            {
              key: 'modal',
              className: 'modal-overlay',
              style: {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }
            },
            React.createElement(
              'div',
              {
                className: 'modal-content',
                style: {
                  backgroundColor: 'var(--card-bg)',
                  padding: '20px',
                  borderRadius: '8px',
                  maxWidth: '500px',
                  width: '90%',
                  maxHeight: '80vh',
                  overflow: 'auto'
                }
              },
              React.createElement(TaskForm, {
                existingTask: editingTask,
                onSave: handleFormSave,
                onCancel: handleFormCancel
              })
            )
          )
        ]
      );
    }
    
    // Componente para mostrar una tarea individual
    function TaskItem(props) {
      const { task, onEdit, onDelete, onStatusChange } = props;
      
      return React.createElement(
        'div',
        {
          className: 'task-item',
          style: {
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px'
          }
        },
        [
          React.createElement(
            'div',
            { key: 'header', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            [
              React.createElement('h3', { key: 'title' }, task.title),
              React.createElement(
                'div',
                { key: 'actions', style: { display: 'flex', gap: '8px' } },
                [
                  React.createElement(
                    'button',
                    { 
                      key: 'edit',
                      onClick: onEdit,
                      style: { padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }
                    },
                    'Editar'
                  ),
                  React.createElement(
                    'button',
                    { 
                      key: 'delete',
                      onClick: onDelete,
                      style: { 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        border: '1px solid var(--danger-color)',
                        color: 'var(--danger-color)'
                      }
                    },
                    'Eliminar'
                  )
                ]
              )
            ]
          ),
          
          task.description && React.createElement('p', { key: 'description' }, task.description),
          
          React.createElement(
            'div',
            { key: 'status', style: { marginTop: '12px' } },
            [
              React.createElement('label', { key: 'label' }, 'Estado: '),
              React.createElement(
                'select',
                {
                  key: 'select',
                  value: task.status,
                  onChange: (e) => onStatusChange(e.target.value),
                  style: { padding: '4px 8px', borderRadius: '4px' }
                },
                Object.keys(TASK_STATUS).map(statusKey =>
                  React.createElement(
                    'option',
                    { 
                      key: TASK_STATUS[statusKey],
                      value: TASK_STATUS[statusKey]
                    },
                    STATUS_LABELS[TASK_STATUS[statusKey]]
                  )
                )
              )
            ]
          )
        ]
      );
    }
    
    // Componente de formulario para crear/editar tareas
    function TaskForm(props) {
      const { existingTask, onSave, onCancel } = props;
      
      const [formData, setFormData] = React.useState({
        title: '',
        description: '',
        status: TASK_STATUS.PENDING
      });
      
      // Resetear formulario cuando cambia existingTask
      React.useEffect(() => {
        if (existingTask) {
          setFormData({
            title: existingTask.title || '',
            description: existingTask.description || '',
            status: existingTask.status || TASK_STATUS.PENDING
          });
        } else {
          setFormData({
            title: '',
            description: '',
            status: TASK_STATUS.PENDING
          });
        }
      }, [existingTask]);
      
      const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      };
      
      const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validación básica
        if (!formData.title.trim()) {
          alert('El título es obligatorio');
          return;
        }
        
        onSave(formData);
      };
      
      return React.createElement(
        'form',
        { onSubmit: handleSubmit },
        [
          React.createElement('h2', { key: 'form-title' }, existingTask ? 'Editar Tarea' : 'Nueva Tarea'),
          
          React.createElement(
            'div',
            { key: 'title-field', style: { marginBottom: '16px' } },
            [
              React.createElement('label', { key: 'label' }, 'Título:'),
              React.createElement(
                'input',
                {
                  key: 'input',
                  type: 'text',
                  name: 'title',
                  value: formData.title,
                  onChange: handleChange,
                  required: true,
                  style: { 
                    width: '100%', 
                    padding: '8px', 
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    marginTop: '4px'
                  }
                }
              )
            ]
          ),
          
          React.createElement(
            'div',
            { key: 'description-field', style: { marginBottom: '16px' } },
            [
              React.createElement('label', { key: 'label' }, 'Descripción:'),
              React.createElement(
                'textarea',
                {
                  key: 'textarea',
                  name: 'description',
                  value: formData.description,
                  onChange: handleChange,
                  rows: 3,
                  style: { 
                    width: '100%', 
                    padding: '8px', 
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    marginTop: '4px',
                    resize: 'vertical'
                  }
                }
              )
            ]
          ),
          
          React.createElement(
            'div',
            { key: 'status-field', style: { marginBottom: '16px' } },
            [
              React.createElement('label', { key: 'label' }, 'Estado:'),
              React.createElement(
                'select',
                {
                  key: 'select',
                  name: 'status',
                  value: formData.status,
                  onChange: handleChange,
                  style: { 
                    width: '100%', 
                    padding: '8px', 
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    marginTop: '4px'
                  }
                },
                Object.keys(TASK_STATUS).map(statusKey =>
                  React.createElement(
                    'option',
                    { 
                      key: TASK_STATUS[statusKey],
                      value: TASK_STATUS[statusKey]
                    },
                    STATUS_LABELS[TASK_STATUS[statusKey]]
                  )
                )
              )
            ]
          ),
          
          React.createElement(
            'div',
            { 
              key: 'buttons',
              style: { display: 'flex', gap: '8px', justifyContent: 'flex-end' }
            },
            [
              React.createElement(
                'button',
                { 
                  key: 'cancel',
                  type: 'button',
                  onClick: onCancel,
                  style: { 
                    padding: '8px 16px', 
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'transparent'
                  }
                },
                'Cancelar'
              ),
              React.createElement(
                'button',
                { 
                  key: 'submit',
                  type: 'submit',
                  style: { 
                    padding: '8px 16px', 
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: 'var(--primary-color)',
                    color: 'white'
                  }
                },
                existingTask ? 'Actualizar' : 'Crear'
              )
            ]
          )
        ]
      );
    }
    
    const pageWrapper = this._createComponentWrapper(TaskManagerPage);
    
    this._extensionIds.page = this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().PLUGIN_PAGES,
      pageWrapper,
      {
        order: 100,
        props: { 
          pageId: this._PAGE_ID 
        }
      }
    );
  }
};
```

---

Este documento cubre los aspectos fundamentales y avanzados del desarrollo de plugins para Atlas, incluyendo las nuevas secciones sobre estilos y temas, y mejores prácticas para la prevención de errores comunes. Utiliza estos ejemplos y guías para crear plugins robustos, eficientes y visualmente integrados con la aplicación Atlas.

¡Buena suerte con tus proyectos de desarrollo de plugins!