# Sistema de Plugins de Atlas

En esta carpeta se deben instalar los plugins para la aplicación Atlas.

## Estructura de Plugins

Para que un plugin funcione correctamente, debes crear una subcarpeta con el ID de tu plugin y colocar un archivo `index.js` como punto de entrada:

```
/plugins/
├── mi-plugin/
│   ├── index.js
│   ├── components/
│   ├── utils/
│   └── styles/
└── otro-plugin/
    └── index.js
```

## Estructura básica de un plugin

Un plugin debe definir como mínimo:

```javascript
export default {
  // Metadatos obligatorios
  id: 'mi-plugin',
  name: 'Mi Plugin',
  version: '1.0.0',
  description: 'Descripción de mi plugin',
  author: 'Tu Nombre',
  
  // Restricciones de compatibilidad
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
  
  // Método de inicialización (obligatorio)
  init: function(core) {
    // Tu código aquí...
    return true;
  },
  
  // Método de limpieza (obligatorio)
  cleanup: function() {
    // Tu código aquí...
    return true;
  },
  
  // API pública (opcional)
  publicAPI: {
    // Métodos expuestos a otros plugins
    miMetodo: function() { ... }
  }
};
```

## API Core para Plugins

Durante la inicialización, el sistema proporciona un objeto `core` con las siguientes capacidades:

### Sistema de Eventos

```javascript
// Suscribirse a un evento
const unsubscribe = core.events.subscribe(
  'mi-plugin',           // ID de tu plugin
  'calendar.eventCreated', // Nombre del evento
  (data, sourcePlugin) => {
    // Manejar el evento...
  }
);

// Publicar un evento
core.events.publish(
  'mi-plugin',        // ID de tu plugin
  'miPlugin.miEvento', // Nombre del evento
  { /* datos del evento */ }
);

// Cancelar suscripción
unsubscribe();

// O cancelar todas las suscripciones
core.events.unsubscribeAll('mi-plugin');
```

### Sistema de Almacenamiento

```javascript
// Guardar datos
await core.storage.setItem(
  'mi-plugin',     // ID de tu plugin
  'miClave',       // Nombre de la clave
  { /* datos */ }  // Datos a guardar
);

// Recuperar datos
const datos = await core.storage.getItem(
  'mi-plugin',     // ID de tu plugin
  'miClave',       // Nombre de la clave
  null             // Valor por defecto
);

// Eliminar datos
await core.storage.removeItem(
  'mi-plugin',     // ID de tu plugin
  'miClave'        // Nombre de la clave
);

// Limpiar todos los datos
await core.storage.clearPluginData('mi-plugin');
```

### Acceso a Módulos

```javascript
// Obtener referencia a un módulo
const calendarModule = core.getModule('calendar');

// Usar el módulo
if (calendarModule) {
  const events = calendarModule.getEvents();
  // ...
}
```

## Buenas Prácticas

1. **Limpieza de Recursos**: Libera todos los recursos en el método `cleanup`
2. **Manejo de Errores**: Implementa try/catch en todas las operaciones
3. **Namespaces de Eventos**: Usa el formato `tuPlugin.nombreEvento` para tus eventos
4. **Límites de Almacenamiento**: Mantén el uso de almacenamiento por debajo de 1MB
5. **Versiones Compatibles**: Indica correctamente las versiones de Atlas soportadas

Para más información, consulta la documentación completa del sistema de plugins.

## Ejemplo de Plugin

Puedes encontrar un plugin de ejemplo en la carpeta `example-plugin`.

```javascript
// Ejemplo mínimo funcional
export default {
  id: 'plugin-basico',
  name: 'Plugin Básico',
  version: '0.1.0',
  description: 'Un plugin mínimo de ejemplo',
  author: 'Atlas Team',
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
  
  init: function(core) {
    console.log('Plugin Básico inicializado');
    return true;
  },
  
  cleanup: function() {
    console.log('Plugin Básico desactivado');
    return true;
  }
};
```