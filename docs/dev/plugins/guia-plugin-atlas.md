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
7. [Creación de interfaces de usuario](#creación-de-interfaces-de-usuario)
   - [Componentes para la barra lateral](#componentes-para-la-barra-lateral)
   - [Widgets para el panel de configuración](#widgets-para-el-panel-de-configuración)
   - [Páginas completas de plugin](#páginas-completas-de-plugin)
8. [Dependencias y conflictos](#dependencias-y-conflictos)
9. [Empaquetado y distribución](#empaquetado-y-distribución)
10. [Mejores prácticas](#mejores-prácticas)
11. [Depuración](#depuración)
12. [Ejemplos prácticos](#ejemplos-prácticos)

## Introducción

Atlas es una aplicación modular de gestión del tiempo con arquitectura basada en eventos. Su sistema de plugins permite extender la funcionalidad de la aplicación base de diversas formas. Esta guía te enseñará cómo desarrollar plugins efectivos para Atlas.

Los plugins en Atlas pueden:
- Añadir nuevas funcionalidades a la aplicación
- Integrar con servicios externos
- Personalizar la interfaz de usuario
- Interactuar con otros plugins
- Almacenar datos persistentes

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
  priority: 100
}
```

## Ciclo de vida del plugin

### Inicialización

El método `init` se llama cuando el plugin se activa. Recibe el objeto `core` que proporciona acceso a las APIs del sistema:

```javascript
init: function(core) {
  try {
    // Guardar referencia al core
    this._core = core;
    
    // Cargar datos almacenados
    this._loadData();
    
    // Suscribirse a eventos
    this._setupEventListeners();
    
    // Registrar extensiones UI
    this._registerUIExtensions();
    
    console.log('[Mi Plugin] Inicializado correctamente');
    return true;
  } catch (error) {
    console.error('[Mi Plugin] Error durante la inicialización:', error);
    return false;
  }
}
```

Si `init` devuelve `false`, el sistema considerará que la inicialización ha fallado y el plugin no se activará.

### Limpieza

El método `cleanup` se llama cuando el plugin se desactiva. Debes liberar todos los recursos que tu plugin haya adquirido:

```javascript
cleanup: function() {
  try {
    // Guardar datos
    this._saveData();
    
    // Cancelar suscripciones a eventos
    this._unsubscribeFromEvents();
    
    // Las extensiones UI se limpian automáticamente
    
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

Ejemplo práctico:

```javascript
async function guardarPreferencias(tema, idioma) {
  try {
    await this._core.storage.setItem(this.id, 'preferencias', {
      tema: tema,
      idioma: idioma,
      ultimaActualizacion: Date.now()
    });
    return true;
  } catch (error) {
    console.error('Error al guardar preferencias:', error);
    return false;
  }
}
```

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
- `app.themeChanged` - Cuando cambia el tema de la aplicación

Ejemplo práctico:

```javascript
_setupEventListeners: function() {
  // Guardar referencia a las suscripciones para limpiarlas después
  this._subscriptions = [];
  
  // Suscribirse a eventos del calendario
  const eventSub = this._core.events.subscribe(
    this.id,
    'calendar.eventCreated',
    this._handleNewEvent.bind(this)
  );
  
  this._subscriptions.push(eventSub);
  
  // Suscribirse a cambios de tema
  const themeSub = this._core.events.subscribe(
    this.id,
    'app.themeChanged',
    this._handleThemeChange.bind(this)
  );
  
  this._subscriptions.push(themeSub);
},

_unsubscribeFromEvents: function() {
  // Cancelar todas las suscripciones
  this._subscriptions.forEach(unsubscribe => {
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
  });
  
  this._subscriptions = [];
}
```

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

// Obtener zonas de extensión disponibles
const zones = core.ui.getExtensionZones();
```

Zonas de extensión principales:

- `CALENDAR_SIDEBAR` - Barra lateral del calendario
- `SETTINGS_PANEL` - Panel de configuración
- `MAIN_NAVIGATION` - Navegación principal
- `PLUGIN_PAGES` - Páginas completas de plugin

### Comunicación entre plugins

La API `plugins` permite interactuar con otros plugins:

```javascript
// Obtener información de un plugin
const pluginInfo = core.plugins.getPlugin(pluginId);

// Obtener lista de plugins activos
const activePlugins = core.plugins.getActivePlugins();

// Verificar si un plugin está activo
const isActive = core.plugins.isPluginActive(pluginId);

// Acceder a la API de otro plugin
const otroPlugin = core.plugins.getPluginAPI(miPluginId, otroPluginId);
if (otroPlugin) {
  const resultado = await otroPlugin.metodoPublico(parametros);
}
```

También puedes crear canales de comunicación entre plugins:

```javascript
// Crear un canal
const canal = core.plugins.createChannel('nombre-canal', pluginId, opciones);

// Publicar en un canal
canal.publish(mensaje);

// Suscribirse a un canal
const unsub = canal.subscribe(function(mensaje) {
  // Manejar mensaje
});

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

Dependiendo del nivel de seguridad de Atlas, algunos permisos pueden requerir aprobación manual del usuario.

## Creación de interfaces de usuario

Los plugins pueden extender la interfaz de usuario mediante componentes React.

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

## Dependencias y conflictos

Puedes especificar dependencias y conflictos con otros plugins:

```javascript
// Dependencias
dependencies: [
  'plugin-requerido',
  { id: 'otro-plugin', version: '1.2.0' }
],

// Conflictos
conflicts: [
  'plugin-incompatible',
  { 
    id: 'otro-plugin-problematico', 
    reason: 'Usa los mismos recursos y causa conflictos'
  }
]
```

Atlas verificará estas relaciones al activar tu plugin.

## Empaquetado y distribución

Para distribuir tu plugin:

1. Organiza tu código en una estructura como esta:
   ```
   mi-plugin/
   ├── index.js        // Punto de entrada principal
   ├── components/     // Componentes React
   ├── utils/          // Utilidades
   ├── styles/         // Estilos (si los hay)
   └── README.md       // Documentación
   ```

2. El sistema de Atlas generará automáticamente checksums para verificación de integridad.

3. Tu plugin puede distribuirse a través de:
   - El repositorio oficial de Atlas
   - Repositorios de comunidad
   - Instalación manual por parte del usuario

## Mejores prácticas

1. **Manejo de errores**: Implementa try/catch en todas las operaciones importantes
   ```javascript
   try {
     // Operación que podría fallar
   } catch (error) {
     console.error('[Mi Plugin] Error:', error);
     // Manejar el error apropiadamente
   }
   ```

2. **Limpieza de recursos**: Asegúrate de liberar todos los recursos en el método `cleanup`
   ```javascript
   cleanup: function() {
     // Cancelar temporizadores
     if (this._timerId) clearInterval(this._timerId);
     
     // Cancelar suscripciones a eventos
     this._unsubscribeFromEvents();
     
     // Guardar datos pendientes
     this._saveData();
     
     return true;
   }
   ```

3. **Namespaces de eventos**: Usa el formato `tuPlugin.nombreEvento` para eventos propios
   ```javascript
   core.events.publish(
     this.id,
     'miPlugin.datosActualizados',
     { datos: 'nuevos' }
   );
   ```

4. **Organización del código**: Separa la lógica en métodos con propósitos claros
   ```javascript
   {
     // Método para cargar datos
     _loadData: async function() { /* ... */ },
     
     // Método para guardar datos
     _saveData: async function() { /* ... */ },
     
     // Método para configurar listeners
     _setupEventListeners: function() { /* ... */ },
     
     // Método para manejar eventos
     _handleEvent: function(data) { /* ... */ }
   }
   ```

5. **Rendimiento**: Evita operaciones costosas en el hilo principal
   ```javascript
   // Mal (bloquea el hilo principal)
   const resultado = procesarDatosGrandes(datos);
   
   // Mejor (asíncrono)
   setTimeout(() => {
     const resultado = procesarDatosGrandes(datos);
     this._handleResultado(resultado);
   }, 0);
   ```

6. **Seguridad**: No solicites más permisos de los que necesitas
   ```javascript
   // Bien - Solo los permisos necesarios
   permissions: ['storage', 'events', 'ui'],
   
   // Mal - Demasiados permisos
   permissions: ['storage', 'events', 'ui', 'network', 'dom', 'codeExecution'],
   ```

## Depuración

Para depurar tu plugin:

1. **Uso de console.log**: Incluye un prefijo para identificar los logs de tu plugin
   ```javascript
   console.log('[Mi Plugin] Inicializando...');
   console.error('[Mi Plugin] Error:', error);
   ```

2. **Inspección de estado**: Atlas proporciona una API de depuración
   ```javascript
   // Para ver todos los plugins registrados
   console.log(pluginManager.getAllPlugins());
   
   // Para ver plugins activos
   console.log(pluginManager.getActivePlugins());
   
   // Para ver estado del sistema de plugins
   console.log(pluginManager.getStatus());
   ```

3. **Errores comunes**:
   - No guardar referencias a las funciones de cancelación (unsubscribe)
   - No manejar adecuadamente las promesas
   - No verificar si los objetos existen antes de accederlos
   - No limpiar adecuadamente los recursos

## Ejemplos prácticos

### Plugin simple para exportar eventos

```javascript
export default {
  id: 'evento-exportador',
  name: 'Exportador de Eventos',
  version: '1.0.0',
  description: 'Permite exportar eventos del calendario a formato CSV',
  author: 'Tu Nombre',
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
  permissions: ['storage', 'events', 'ui'],
  
  _core: null,
  _subscriptions: [],
  _extensions: [],
  
  init: function(core) {
    this._core = core;
    
    // Registrar botón en la barra lateral
    const exportButtonId = core.ui.registerExtension(
      this.id,
      core.ui.getExtensionZones().CALENDAR_SIDEBAR,
      this._createExportButton(),
      { order: 100 }
    );
    
    this._extensions.push(exportButtonId);
    
    // Suscribirse a eventos
    const eventSub = core.events.subscribe(
      this.id,
      'calendar.eventCreated',
      this._handleNewEvent.bind(this)
    );
    
    this._subscriptions.push(eventSub);
    
    return true;
  },
  
  cleanup: function() {
    // Cancelar suscripciones
    this._subscriptions.forEach(unsub => unsub());
    this._subscriptions = [];
    
    // Las extensiones UI se limpian automáticamente
    this._extensions = [];
    
    return true;
  },
  
  _createExportButton: function() {
    return function ExportButton(props) {
      const handleClick = () => {
        // Obtener módulo de calendario
        const calendar = props._core.getModule('calendar');
        if (!calendar) return;
        
        // Obtener eventos
        const events = calendar.getEvents();
        
        // Exportar a CSV
        let csv = 'Title,Start,End\n';
        events.forEach(event => {
          csv += `"${event.title}","${event.start}","${event.end}"\n`;
        });
        
        // Crear enlace de descarga
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'eventos.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };
      
      return React.createElement(
        'button',
        {
          className: 'sidebar-button',
          onClick: handleClick
        },
        'Exportar Eventos'
      );
    };
  },
  
  _handleNewEvent: function(eventData) {
    console.log('[Exportador] Nuevo evento creado:', eventData);
    // Aquí podrías mostrar una notificación o actualizar el estado
  }
};
```

### Plugin con página completa y estado

```javascript
export default {
  id: 'estadisticas-tiempo',
  name: 'Estadísticas de Tiempo',
  version: '1.0.0',
  description: 'Muestra estadísticas sobre el uso del tiempo',
  author: 'Tu Nombre',
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
  permissions: ['storage', 'events', 'ui'],
  
  _core: null,
  _data: {
    stats: {},
    lastUpdate: null
  },
  
  init: function(core) {
    this._core = core;
    
    // Cargar datos
    this._loadData();
    
    // Registrar nav item
    core.ui.registerExtension(
      this.id,
      core.ui.getExtensionZones().MAIN_NAVIGATION,
      this._createNavItem(),
      { order: 100 }
    );
    
    // Registrar página
    core.ui.registerExtension(
      this.id,
      core.ui.getExtensionZones().PLUGIN_PAGES,
      this._createStatsPage(),
      {
        order: 100,
        props: { pageId: 'estadisticas' }
      }
    );
    
    // Suscribirse a eventos para actualizar estadísticas
    this._setupEventListeners();
    
    return true;
  },
  
  cleanup: function() {
    // Guardar datos
    this._saveData();
    
    // Cancelar suscripciones
    this._core.events.unsubscribeAll(this.id);
    
    return true;
  },
  
  _loadData: async function() {
    const data = await this._core.storage.getItem(
      this.id,
      'stats',
      { stats: {}, lastUpdate: null }
    );
    
    this._data = data;
  },
  
  _saveData: async function() {
    await this._core.storage.setItem(
      this.id,
      'stats',
      this._data
    );
  },
  
  _setupEventListeners: function() {
    // Suscribirse a eventos de calendario
    this._core.events.subscribe(
      this.id,
      'calendar.eventCreated',
      this._updateStats.bind(this)
    );
    
    this._core.events.subscribe(
      this.id,
      'calendar.eventUpdated',
      this._updateStats.bind(this)
    );
    
    this._core.events.subscribe(
      this.id,
      'calendar.eventDeleted',
      this._updateStats.bind(this)
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
    this._saveData();
  },
  
  _createNavItem: function() {
    return function NavItem(props) {
      const handleClick = () => {
        props.onNavigate(props.pluginId, 'estadisticas');
      };
      
      return React.createElement(
        'div',
        {
          className: 'sidebar-item',
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
      const [stats, setStats] = React.useState(self._data.stats);
      
      React.useEffect(() => {
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
      
      return React.createElement(
        'div',
        { className: 'stats-page' },
        [
          React.createElement('h1', { key: 'title' }, 'Estadísticas de Tiempo'),
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
                      React.createElement('li', { key: 'deleted' }, `Eliminados: ${dayStat.deleted}`)
                    ]
                  )
                ]
              );
            })
          )
        ]
      );
    };
  },
  
  // API pública
  publicAPI: {
    getStats: function() {
      return { ...this._data.stats };
    }
  }
};
```

---

Este documento cubre los aspectos fundamentales del desarrollo de plugins para Atlas. Recuerda que el sistema de plugins está diseñado para ser flexible y extensible, lo que te permite crear una amplia variedad de integraciones y mejoras para la aplicación.

Para más detalles, consulta la documentación oficial y examina los plugins de ejemplo incluidos con Atlas.

¡Buena suerte con tus proyectos de desarrollo de plugins!
