# Guía para desarrollar plugins en Atlas

## Índice
1. [Introducción](#introducción)
2. [Estructura básica de un plugin](#estructura-básica-de-un-plugin)
3. [Metadatos del plugin](#metadatos-del-plugin)
4. [Ciclo de vida del plugin](#ciclo-de-vida-del-plugin)
   - [Inicialización](#inicialización)
   - [Limpieza](#limpieza)
5. [La API de Core](#la-api-de-core)
   - [Almacenamiento persistente](#almacenamiento-persistente)
   - [Sistema de eventos](#sistema-de-eventos)
   - [Extensiones de UI](#extensiones-de-ui)
   - [Comunicación entre plugins](#comunicación-entre-plugins)
6. [Sistema de permisos](#sistema-de-permisos)
7. [Sistema de seguridad](#sistema-de-seguridad)
   - [Modelo de seguridad multinivel](#modelo-de-seguridad-multinivel)
   - [Sandbox para ejecución segura](#sandbox-para-ejecución-segura)
   - [Monitoreo de recursos](#monitoreo-de-recursos)
   - [Auditoría de seguridad](#auditoría-de-seguridad)
8. [Creación de interfaces de usuario](#creación-de-interfaces-de-usuario)
   - [Puntos de extensión UI](#puntos-de-extensión-ui)
   - [Componentes para la barra lateral](#componentes-para-la-barra-lateral)
   - [Extensiones para el calendario](#extensiones-para-el-calendario)
   - [Páginas completas de plugin](#páginas-completas-de-plugin)
   - [Widgets para el panel de configuración](#widgets-para-el-panel-de-configuración)
9. [Estilos y temas](#estilos-y-temas)
   - [Sistema de temas de Atlas](#sistema-de-temas-de-atlas)
   - [Variables CSS disponibles](#variables-css-disponibles)
   - [Adaptación a diferentes temas](#adaptación-a-diferentes-temas)
   - [Buenas prácticas de CSS](#buenas-prácticas-de-css)
10. [Dependencias y conflictos](#dependencias-y-conflictos)
    - [Manejo de dependencias](#manejo-de-dependencias)
    - [Resolución de conflictos](#resolución-de-conflictos)
    - [Resolver ciclos de dependencias](#resolver-ciclos-de-dependencias)
11. [Empaquetado y distribución](#empaquetado-y-distribución)
    - [Estructura del paquete](#estructura-del-paquete)
    - [Verificación de integridad](#verificación-de-integridad)
    - [Repositorios de plugins](#repositorios-de-plugins)
    - [Actualizaciones automáticas](#actualizaciones-automáticas)
12. [Mejores prácticas](#mejores-prácticas)
    - [Manejo asíncrono de datos](#manejo-asíncrono-de-datos)
    - [Gestión de errores robusta](#gestión-de-errores-robusta)
    - [Prevención de errores comunes](#prevención-de-errores-comunes)
    - [Optimización de rendimiento](#optimización-de-rendimiento)
13. [Depuración](#depuración)
    - [Técnicas de depuración](#técnicas-de-depuración)
    - [Errores comunes y soluciones](#errores-comunes-y-soluciones)
14. [Ejemplos prácticos](#ejemplos-prácticos)

## Introducción

Atlas es una aplicación modular de gestión del tiempo con arquitectura basada en eventos. Su sistema de plugins permite extender la funcionalidad de la aplicación base de diversas formas. Esta guía te enseñará cómo desarrollar plugins efectivos para Atlas.

Los plugins en Atlas pueden:
- Añadir nuevas funcionalidades a la aplicación
- Integrar con servicios externos
- Personalizar la interfaz de usuario
- Interactuar con otros plugins
- Almacenar datos persistentes
- Extender el calendario y mejorar la experiencia del usuario

## Estructura básica de un plugin

Un plugin de Atlas se define como un objeto JavaScript con propiedades y métodos específicos. La estructura básica es la siguiente:

```javascript
export default {
  // Metadatos del plugin
  id: 'mi-plugin',
  name: 'Mi Plugin',
  version: '1.0.0',
  description: 'Descripción de mi plugin',
  author: 'Tu Nombre',
  
  // Restricciones de compatibilidad
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
  
  // Dependencias y conflictos (opcionales)
  dependencies: [],
  conflicts: [],
  
  // Permisos requeridos
  permissions: ['storage', 'events', 'ui'],
  
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
│   └── SettingsPanel.jsx     // Panel de configuración
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

## Metadatos del plugin

Los metadatos son propiedades que describen tu plugin y determinan cómo interactúa con Atlas:

- **id**: Identificador único de tu plugin. Usa un formato como 'nombre-plugin' o 'nombrePlugin'
- **name**: Nombre amigable para mostrar en la interfaz
- **version**: Sigue el formato de [versionado semántico](https://semver.org/) (X.Y.Z)
- **description**: Breve descripción de lo que hace tu plugin
- **author**: Tu nombre o el de tu organización
- **minAppVersion**: Versión mínima de Atlas compatible con tu plugin
- **maxAppVersion**: Versión máxima de Atlas compatible con tu plugin
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
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
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
  
  // Se recomienda devolver una Promise para manejar operaciones asíncronas
  return new Promise(function(resolve) {
    try {
      // Guardar referencia al core
      self._core = core;
      
      // Cargar datos almacenados (operación asíncrona)
      core.storage.getItem(self.id, 'plugin-data', null)
        .then(function(savedData) {
          if (savedData) {
            self._data = savedData;
          }
          
          // Configurar el resto del plugin
          self._setupEventListeners();
          self._registerUIExtensions();
          
          // Registrar API pública si existe
          if (self.publicAPI) {
            core.plugins.registerAPI(self.id, self.publicAPI);
          }
          
          console.log('[Mi Plugin] Inicializado correctamente');
          resolve(true);
        })
        .catch(function(error) {
          console.error('[Mi Plugin] Error al cargar datos:', error);
          resolve(false);
        });
    } catch (error) {
      console.error('[Mi Plugin] Error durante la inicialización:', error);
      resolve(false);
    }
  });
}
```

Si `init` devuelve `false` o una Promise resuelta con `false`, el sistema considerará que la inicialización ha fallado y el plugin no se activará.

### Limpieza

El método `cleanup` se llama cuando el plugin se desactiva. Debes liberar todos los recursos que tu plugin haya adquirido:

```javascript
cleanup: function() {
  try {
    // Guardar datos
    if (this._core) {
      this._core.storage.setItem(this.id, 'plugin-data', this._data)
        .catch(function(error) {
          console.error('[Mi Plugin] Error al guardar datos:', error);
        });
    }
    
    // Cancelar suscripciones a eventos
    this._unsubscribeFromEvents();
    
    // Limpiar temporizadores
    if (this._timerId) {
      clearInterval(this._timerId);
      this._timerId = null;
    }
    
    console.log('[Mi Plugin] Limpieza completada');
    return true;
  } catch (error) {
    console.error('[Mi Plugin] Error durante la limpieza:', error);
    return false;
  }
}
```

## La API de Core

El objeto `core` proporcionado durante la inicialización contiene varias APIs:

### Almacenamiento persistente

La API `storage` permite guardar y recuperar datos persistentes:

```javascript
// Guardar datos
await core.storage.setItem(pluginId, 'miClave', misDatos);

// Recuperar datos
const misDatos = await core.storage.getItem(pluginId, 'miClave', valorPorDefecto);

// Eliminar datos
await core.storage.removeItem(pluginId, 'miClave');

// Limpiar todos los datos del plugin
await core.storage.clearPluginData(pluginId);
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

// Publicar un evento
core.events.publish(
  pluginId,
  'miPlugin.miEvento',
  { datos: 'valor' }
);

// Cancelar todas las suscripciones
core.events.unsubscribeAll(pluginId);
```

Eventos importantes del sistema:

- `calendar.eventCreated` - Cuando se crea un evento en el calendario
- `calendar.eventUpdated` - Cuando se actualiza un evento
- `calendar.eventDeleted` - Cuando se elimina un evento
- `calendar.viewChanged` - Cuando se cambia la vista del calendario
- `calendar.dateChanged` - Cuando se cambia la fecha seleccionada
- `app.themeChanged` - Cuando cambia el tema de la aplicación
- `app.initialized` - Cuando la aplicación ha terminado de inicializarse
- `app.moduleRegistered` - Cuando se registra un nuevo módulo en el sistema
- `storage.dataChanged` - Cuando cambian datos en el almacenamiento

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
  CALENDAR_SIDEBAR: 'calendar-sidebar',     // Barra lateral del calendario
  SETTINGS_PANEL: 'settings-panel',         // Panel de configuración
  MAIN_NAVIGATION: 'main-navigation',       // Navegación principal
  PLUGIN_PAGES: 'plugin-pages',             // Páginas completas
  CALENDAR_DAY_CELL: 'calendar-day-cell',   // Celdas de día en calendario
  EVENT_DETAIL_VIEW: 'event-detail-view',   // Vista detallada de eventos
  EVENT_FORM: 'event-form'                  // Formulario de eventos
};
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

// Registrar en la barra lateral
const extensionId = core.ui.registerExtension(
  pluginId,
  core.ui.getExtensionZones().CALENDAR_SIDEBAR,
  SidebarWidget,
  { order: 100 }
);
```

### Extensiones para el calendario

Ahora puedes extender directamente las celdas del calendario y los formularios de eventos:

```javascript
// Extensión para celdas de días
function DayCellExtension(props) {
  // props contiene: day, hour, minutes, date
  return React.createElement(
    'div',
    { className: 'day-cell-extension' },
    React.createElement(
      'span',
      { className: 'cell-indicator' },
      '⭐'
    )
  );
}

// Registrar extensión para celdas del calendario
core.ui.registerExtension(
  pluginId,
  core.ui.getExtensionZones().CALENDAR_DAY_CELL,
  DayCellExtension,
  { order: 100 }
);

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
core.ui.registerExtension(
  pluginId,
  core.ui.getExtensionZones().EVENT_DETAIL_VIEW,
  EventDetailExtension,
  { order: 100 }
);

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
core.ui.registerExtension(
  pluginId,
  core.ui.getExtensionZones().EVENT_FORM,
  EventFormExtension,
  { order: 100 }
);
```

### Páginas completas de plugin

Los plugins pueden tener páginas completas accesibles desde la navegación principal:

```javascript
// Componente de navegación
function NavigationItem(props) {
  const handleClick = () => {
    props.onNavigate(props.pluginId, 'pagina-principal');
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
core.ui.registerExtension(
  pluginId,
  core.ui.getExtensionZones().MAIN_NAVIGATION,
  NavigationItem,
  { order: 100 }
);

// Registrar página
core.ui.registerExtension(
  pluginId,
  core.ui.getExtensionZones().PLUGIN_PAGES,
  MainPage,
  {
    order: 100,
    props: { pageId: 'pagina-principal' }
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
const extensionId = core.ui.registerExtension(
  pluginId,
  core.ui.getExtensionZones().SETTINGS_PANEL,
  SettingsWidget,
  { order: 100 }
);
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

Al trabajar con operaciones asíncronas como almacenamiento o solicitudes de red:

1. **Usa Promesas de forma consistente**:

```javascript
// Recomendado: devolver Promise desde init
init: function(core) {
  const self = this;
  
  return new Promise(function(resolve) {
    // Operaciones asíncronas aquí
    core.storage.getItem(self.id, 'data', null)
      .then(function(data) {
        // Procesar datos
        resolve(true);
      })
      .catch(function(error) {
        console.error('Error:', error);
        resolve(false);
      });
  });
}
```

2. **Maneja el contexto `this` correctamente**:

```javascript
// Problema: contexto 'this' perdido en callbacks
init: function(core) {
  this._core = core;
  
  core.storage.getItem(this.id, 'data', null)
    .then(function(data) {
      // ¡Error! 'this' no se refiere al plugin aquí
      this._data = data; // 'this' es undefined o window
    });
}

// Solución 1: Guardar 'this' en una variable
init: function(core) {
  const self = this;
  this._core = core;
  
  core.storage.getItem(this.id, 'data', null)
    .then(function(data) {
      self._data = data; // Funciona correctamente
    });
}

// Solución 2: Usar funciones flecha (si el entorno lo permite)
init: function(core) {
  this._core = core;
  
  core.storage.getItem(this.id, 'data', null)
    .then((data) => {
      this._data = data; // Funciona correctamente
    });
}
```

3. **Implementa inicialización por etapas** para tareas complejas:

```javascript
init: function(core) {
  const self = this;
  
  return new Promise(function(resolve) {
    // Paso 1: Cargar datos
    function step1() {
      return core.storage.getItem(self.id, 'data', null);
    }
    
    // Paso 2: Configurar cosas que dependen de los datos
    function step2(data) {
      self._data = data || { configuracion: {} };
      return self._setupSomething(self._data);
    }
    
    // Paso 3: Finalizar inicialización
    function step3() {
      self._registerUIExtensions();
      return true;
    }
    
    // Ejecutar pasos en secuencia
    step1()
      .then(step2)
      .then(step3)
      .then(function(success) {
        resolve(success);
      })
      .catch(function(error) {
        console.error('Error en inicialización:', error);
        resolve(false);
      });
  });
}
```

### Gestión de errores robusta

Una buena gestión de errores es crucial para plugins estables:

1. **Usa bloques try/catch**:

```javascript
try {
  // Código que podría fallar
} catch (error) {
  console.error('[Mi Plugin] Error:', error);
  // Manejar el error apropiadamente
}
```

2. **Valida datos antes de usarlos**:

```javascript
// Malo: Acceso directo sin validación
function processData(data) {
  const result = data.items.filter(item => item.active);
  return result;
}

// Bueno: Validación antes de uso
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

Evita estos errores comunes en el desarrollo de plugins:

1. **Problema**: Usar `async/await` directamente en la definición de funciones de objeto:

```javascript
// Incorrecto: Puede causar errores de sintaxis en algunos entornos
{
  init: async function(core) { /* ... */ }
}

// Correcto: Usar Promise explícita
{
  init: function(core) {
    return new Promise(async function(resolve) {
      // Código asíncrono aquí
      resolve(true);
    });
  }
}
```

2. **Problema**: No verificar si los objetos existen antes de acceder a sus propiedades:

```javascript
// Incorrecto: Acceso sin verificación
function doSomething(props) {
  const count = props.data.items.length; // Error si props.data es undefined
}

// Correcto: Verificar antes de acceder
function doSomething(props) {
  if (props && props.data && Array.isArray(props.data.items)) {
    const count = props.data.items.length;
    // continuar
  } else {
    // manejar caso donde props.data.items no existe
  }
}

// Alternativa concisa con operador opcional (si el entorno lo soporta)
function doSomething(props) {
  const count = props?.data?.items?.length || 0;
  // continuar
}
```

3. **Problema**: Inicialización insegura en componentes React:

```javascript
// Incorrecto: Asume que plugin.publicAPI existe
function Dashboard(props) {
  const [stats, setStats] = useState(props.plugin.publicAPI.getStats());
  // ...
}

// Correcto: Inicialización segura con valores predeterminados
function Dashboard(props) {
  const getInitialStats = () => {
    try {
      return props.plugin?.publicAPI?.getStats() || { count: 0 };
    } catch (e) {
      return { count: 0 };
    }
  };
  
  const [stats, setStats] = useState(getInitialStats());
  // ...
}
```

4. **Problema**: No limpiar recursos adecuadamente:

```javascript
// Incorrecto: Suscripción sin limpieza
useEffect(() => {
  const subscription = props.core.events.subscribe(
    'event',
    handleEvent
  );
  // Sin función de limpieza
}, []);

// Correcto: Limpieza adecuada
useEffect(() => {
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
  
  return <div>{expensiveResult}</div>;
}
```

3. **Evita renderizados innecesarios**:

```javascript
// Evitar recrear funciones en cada renderizado
function MyComponent() {
  // Mal: Se crea una nueva función en cada renderizado
  return <Button onClick={() => handleClick()} />;
  
  // Bien: Usar useCallback
  const handleButtonClick = React.useCallback(() => {
    handleClick();
  }, []);
  
  return <Button onClick={handleButtonClick} />;
}
```

4. **Carga perezosa de recursos pesados**:

```javascript
// Cargar grandes conjuntos de datos solo cuando sea necesario
function UserList() {
  const [users, setUsers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  
  const loadUsers = () => {
    if (!loaded) {
      fetchUsers().then(data => {
        setUsers(data);
        setLoaded(true);
      });
    }
  };
  
  return (
    <div>
      {!loaded && <button onClick={loadUsers}>Cargar usuarios</button>}
      {loaded && <UserTable users={users} />}
    </div>
  );
}
```

## Depuración

### Técnicas de depuración

Para depurar tu plugin de manera efectiva:

1. **Uso de console.log con prefijo**:

```javascript
function log(message, data) {
  console.log(`[${this.id}] ${message}`, data);
}

function error(message, err) {
  console.error(`[${this.id}] ${message}`, err);
}
```

2. **Inspección del estado del plugin**:

```javascript
// Para ver el estado completo del plugin
console.log('[Mi Plugin] Estado actual:', JSON.parse(JSON.stringify(this)));

// Para ver una versión limpia para inspección
console.log('[Mi Plugin] Datos:', {
  configuracion: this._data.configuracion,
  contador: this._data.contador,
  eventos: this._data.registroEventos.length
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
  
  return <div>Componente</div>;
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

### Errores comunes y soluciones

Estos son errores frecuentes y cómo solucionarlos:

1. **Error**: `Cannot read property 'X' of undefined`

   **Solución**: Verificar que los objetos existen antes de acceder a sus propiedades.
   
   ```javascript
   // Incorrecto
   const value = obj.prop.deepProp;
   
   // Correcto
   const value = obj && obj.prop ? obj.prop.deepProp : undefined;
   
   // Alternativa (si el entorno lo soporta)
   const value = obj?.prop?.deepProp;
   ```

2. **Error**: `this` es `undefined` en callbacks

   **Solución**: Guardar referencia a `this` o usar funciones flecha.
   
   ```javascript
   // Guardar 'this'
   const self = this;
   someFunction(function() {
     self.doSomething();
   });
   
   // O usar arrow function
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
   // Incorrecto
   useEffect(() => {
     fetchData().then(setData);
   }, []); // Falta dependencia
   
   // Correcto
   useEffect(() => {
     fetchData().then(setData);
   }, [fetchData]); // Incluye todas las dependencias
   ```

5. **Error**: Manejo incorrecto de promesas

   **Solución**: Usar correctamente then/catch o async/await.
   
   ```javascript
   // Incorrecto
   function saveData() {
     core.storage.setItem(id, 'data', data);
     // Continúa sin esperar a que termine la operación
     doNextThing();
   }
   
   // Correcto con then/catch
   function saveData() {
     core.storage.setItem(id, 'data', data)
       .then(() => {
         doNextThing();
       })
       .catch(error => {
         console.error('Error al guardar:', error);
       });
   }
   
   // Correcto con async/await
   async function saveData() {
     try {
       await core.storage.setItem(id, 'data', data);
       doNextThing();
     } catch (error) {
       console.error('Error al guardar:', error);
     }
   }
   ```

## Ejemplos prácticos

### Plugin simple con extensión de calendario

```javascript
export default {
  id: 'calendario-notificador',
  name: 'Notificador de Eventos',
  version: '1.0.0',
  description: 'Añade notificaciones visuales a las celdas del calendario',
  author: 'Tu Nombre',
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
  permissions: ['storage', 'events', 'ui'],
  
  _core: null,
  _settings: {
    notificationColor: '#FF5722',
    showInDay: true,
    showInWeek: true
  },
  _subscriptions: [],
  
  init: function(core) {
    try {
      this._core = core;
      
      // Cargar configuración
      this._loadSettings();
      
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
  
  cleanup: function() {
    try {
      // Guardar configuración
      this._saveSettings();
      
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
  },
  
  _registerUIExtensions: function() {
    const self = this;
    
    // Crear componente para celdas del calendario
    function CalendarCellExtension(props) {
      const [eventos, setEventos] = React.useState([]);
      
      React.useEffect(() => {
        // Obtener módulo de calendario
        const calendar = self._core.getModule('calendar');
        if (!calendar) return;
        
        // Obtener eventos para esta fecha y hora
        const date = props.date;
        const eventsForDay = calendar.getEventsForDate(date);
        
        // Filtrar eventos para esta hora específica
        const eventsForCell = eventsForDay.filter(event => {
          const eventStart = new Date(event.start);
          return eventStart.getHours() === props.hour &&
                 eventStart.getMinutes() === props.minutes;
        });
        
        setEventos(eventsForCell);
      }, [props.date, props.hour, props.minutes]);
      
      // No mostrar nada si no hay eventos o según configuración
      if (eventos.length === 0) return null;
      
      return React.createElement(
        'div',
        { 
          className: 'notification-indicator',
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
    
    // Registrar extensión para celdas del calendario
    this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().CALENDAR_DAY_CELL,
      CalendarCellExtension,
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
            { key: 'day', className: 'settings-group' },
            [
              React.createElement('label', { key: 'label' }, 'Mostrar en vista de día:'),
              React.createElement(
                'input',
                {
                  key: 'input',
                  type: 'checkbox',
                  checked: settings.showInDay,
                  onChange: handleToggleChange('showInDay')
                }
              )
            ]
          ),
          
          React.createElement(
            'div',
            { key: 'week', className: 'settings-group' },
            [
              React.createElement('label', { key: 'label' }, 'Mostrar en vista de semana:'),
              React.createElement(
                'input',
                {
                  key: 'input',
                  type: 'checkbox',
                  checked: settings.showInWeek,
                  onChange: handleToggleChange('showInWeek')
                }
              )
            ]
          )
        ]
      );
    }
    
    // Registrar en el panel de configuración
    this._core.ui.registerExtension(
      this.id,
      this._core.ui.getExtensionZones().SETTINGS_PANEL,
      SettingsPanel,
      { order: 100 }
    );
  }
};
```

### Plugin con página completa y API pública

```javascript
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
  
  init: function(core) {
    const self = this;
    
    return new Promise(function(resolve) {
      try {
        self._core = core;
        
        // Cargar datos
        core.storage.getItem(self.id, 'stats', { stats: {}, lastUpdate: null })
          .then(function(data) {
            self._data = data;
            
            // Registrar nav item
            core.ui.registerExtension(
              self.id,
              core.ui.getExtensionZones().MAIN_NAVIGATION,
              self._createNavItem(),
              { order: 100 }
            );
            
            // Registrar página
            core.ui.registerExtension(
              self.id,
              core.ui.getExtensionZones().PLUGIN_PAGES,
              self._createStatsPage(),
              {
                order: 100,
                props: { pageId: 'estadisticas' }
              }
            );
            
            // Suscribirse a eventos para actualizar estadísticas
            self._setupEventListeners();
            
            // Crear y registrar API pública
            self.publicAPI = self._createPublicAPI();
            core.plugins.registerAPI(self.id, self.publicAPI);
            
            resolve(true);
          })
          .catch(function(error) {
            console.error('[Estadísticas] Error al cargar datos:', error);
            resolve(false);
          });
      } catch (error) {
        console.error('[Estadísticas] Error de inicialización:', error);
        resolve(false);
      }
    });
  },
  
  cleanup: function() {
    // Guardar datos
    if (this._core) {
      this._core.storage.setItem(this.id, 'stats', this._data)
        .catch(function(error) {
          console.error('[Estadísticas] Error al guardar datos:', error);
        });
      
      // Cancelar suscripciones
      this._core.events.unsubscribeAll(this.id);
    }
    
    return true;
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
    this._core.events.subscribe(
      this.id,
      'calendar.eventCreated',
      (data) => this._updateStats({ ...data, type: 'created' })
    );
    
    this._core.events.subscribe(
      this.id,
      'calendar.eventUpdated',
      (data) => this._updateStats({ ...data, type: 'updated' })
    );
    
    this._core.events.subscribe(
      this.id,
      'calendar.eventDeleted',
      (data) => this._updateStats({ ...data, type: 'deleted' })
    );
  },
  
  _updateStats: function(eventData) {
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
    this._core.storage.setItem(this.id, 'stats', this._data)
      .catch(function(error) {
        console.error('[Estadísticas] Error al guardar estadísticas:', error);
      });
  },
  
  _createNavItem: function() {
    return function NavItem(props) {
      const handleClick = () => {
        props.onNavigate(props.pluginId, 'estadisticas');
      };
      
      return React.createElement(
        'div',
        {
          className: 'navigation-item',
          onClick: handleClick
        },
        [
          React.createElement(
            'span',
            { className: 'material-icons', key: 'icon' },
            'bar_chart'
          ),
          React.createElement(
            'span',
            { key: 'label' },
            'Estadísticas'
          )
        ]
      );
    };
  },
  
  _createStatsPage: function() {
    const self = this;
    
    return function StatsPage(props) {
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
        { className: 'stats-page' },
        [
          React.createElement('h1', { key: 'title' }, 'Estadísticas de Tiempo'),
          
          React.createElement(
            'button',
            { 
              key: 'download', 
              className: 'download-button',
              onClick: handleDownload
            },
            'Descargar estadísticas'
          ),
          
          React.createElement(
            'div',
            { className: 'stats-container', key: 'container' },
            Object.entries(stats).map(([date, dayStat]) => {
              return React.createElement(
                'div',
                { className: 'stat-item', key: date },
                [
                  React.createElement('h3', { key: 'date' }, date),
                  React.createElement(
                    'ul',
                    { key: 'list' },
                    [
                      React.createElement('li', { key: 'created' }, `Creados: ${dayStat.created}`),
                      React.createElement('li', { key: 'updated' }, `Actualizados: ${dayStat.updated}`),
                      React.createElement('li', { key: 'deleted' }, `Eliminados: ${dayStat.deleted}`),
                      React.createElement('li', { key: 'total' }, `Total: ${dayStat.created + dayStat.updated + dayStat.deleted}`)
                    ]
                  )
                ]
              );
            })
          )
        ]
      );
    };
  }
};
```

---

Este documento cubre los aspectos fundamentales y avanzados del desarrollo de plugins para Atlas, incluyendo las nuevas secciones sobre estilos y temas, y mejores prácticas para la prevención de errores comunes. Utiliza estos ejemplos y guías para crear plugins robustos, eficientes y visualmente integrados con la aplicación Atlas.

¡Buena suerte con tus proyectos de desarrollo de plugins!