# Desarrollo de Plugins para Atlas

## Introducción

Este documento proporciona una guía completa para desarrolladores que desean crear plugins para Atlas. Los plugins son la forma principal de extender la funcionalidad base de Atlas, permitiendo a los usuarios personalizar la aplicación según sus necesidades específicas.

## Índice

1. [Fundamentos del Sistema de Plugins](#fundamentos-del-sistema-de-plugins)
2. [Estructura Estándar de un Plugin](#estructura-estándar-de-un-plugin)
3. [Ciclo de Vida de un Plugin](#ciclo-de-vida-de-un-plugin)
4. [API de Plugins](#api-de-plugins)
5. [Comunicación entre Plugins](#comunicación-entre-plugins)
6. [Mejores Prácticas](#mejores-prácticas)
7. [Proceso de Publicación](#proceso-de-publicación)
8. [Ejemplos de Plugins](#ejemplos-de-plugins)

## Fundamentos del Sistema de Plugins

### Principios Fundamentales

El sistema de plugins de Atlas se basa en los siguientes principios:

1. **Modularidad**: Cada plugin debe funcionar como un módulo independiente.
2. **Acoplamiento débil**: Los plugins se comunican con el núcleo y entre sí a través de interfaces bien definidas.
3. **Coherencia visual**: Todos los plugins deben mantener la estética y experiencia de usuario de Atlas.
4. **Extensibilidad responsable**: Los plugins añaden valor sin comprometer el rendimiento o la estabilidad.
5. **Internacionalización**: Soporte para múltiples idiomas desde su diseño.

### Capacidades de los Plugins

Los plugins pueden:

- Añadir nuevas vistas y componentes a la interfaz de usuario
- Extender la funcionalidad de componentes existentes
- Integrar servicios externos
- Procesar y analizar datos del calendario
- Añadir opciones de configuración personalizadas
- Implementar sistemas de notificación o alertas
- Crear nuevos tipos de visualizaciones de datos

### Limitaciones

Los plugins no pueden:

- Modificar el código fuente del núcleo de Atlas
- Acceder directamente a la base de datos fuera de las APIs proporcionadas
- Implementar funcionalidades que comprometan la seguridad o privacidad
- Causar degradación significativa del rendimiento
- Romper la compatibilidad con otros plugins oficiales

## Estructura Estándar de un Plugin

Todo plugin de Atlas debe seguir esta estructura de directorios:

```
plugin-name/
├── index.js                 # Punto de entrada del plugin (OBLIGATORIO)
├── components/              # Componentes UI (OBLIGATORIO)
│   ├── component-name.jsx
│   └── ...
├── contexts/                # Contextos del plugin (OPCIONAL)
│   └── context-name.jsx
├── services/                # Servicios del plugin (OPCIONAL*)
│   └── service-name.js
├── utils/                   # Utilidades (OBLIGATORIO)
│   └── utility-name.js
├── styles/                  # Estilos (OBLIGATORIO)
│   └── plugin-styles.css
├── locales/                 # Traducciones (OBLIGATORIO desde v1.0.0)
│   ├── es/                  # Español
│   │   └── plugin.json
│   └── en/                  # Inglés
│       └── plugin.json
└── README.md                # Documentación del plugin (OBLIGATORIO)
```

**Notas importantes sobre la estructura:**

* **OBLIGATORIO**: Estos componentes deben estar presentes en todos los plugins.
* **OPCIONAL**: Estos componentes pueden incluirse según las necesidades específicas del plugin.
* **OPCIONAL***: El directorio `services/` es:
  * **OBLIGATORIO** para plugins que requieren:
    - Conexión a APIs externas
    - Sistemas de notificaciones
    - Procesamiento complejo de datos
  * **OPCIONAL** para plugins que operan principalmente con datos locales

### Punto de Entrada (index.js)

El archivo `index.js` debe exportar un objeto con la siguiente estructura:

```javascript
export default {
  id: 'plugin-name',         // Identificador único del plugin
  name: 'Plugin Name',       // Nombre visible para el usuario
  version: '1.0.0',          // Versión siguiendo SemVer
  description: 'Descripción breve del plugin',
  author: 'Nombre del autor',
  
  // Función de inicialización, llamada al cargar el plugin
  init: function(core) {
    // Inicialización del plugin
    // El parámetro 'core' proporciona acceso a las APIs del núcleo
    
    // Registro de componentes UI
    core.ui.registerComponent('plugin-area-id', MyComponent);
    
    // Registro en bus de eventos
    core.events.subscribe('event-type', this.handleEvent);
    
    // Registro de APIs públicas
    core.registerModule(this.id, this.publicAPI);
    
    // Carga de traducciones
    core.i18n.addResourceBundle('es', this.id, esTranslations);
    core.i18n.addResourceBundle('en', this.id, enTranslations);
    
    return true; // Devolver true si la inicialización fue exitosa
  },
  
  // Función de limpieza, llamada al desactivar el plugin
  cleanup: function(core) {
    // Limpieza de recursos
    // Cancelación de suscripciones a eventos
    // Eliminación de componentes UI
    
    return true; // Devolver true si la limpieza fue exitosa
  },
  
  // API pública expuesta a otros plugins y al núcleo
  publicAPI: {
    // Métodos y propiedades expuestos
    getFeatureData: function() { /* ... */ },
    processInput: function(data) { /* ... */ },
    // ...
  }
};
```

## Ciclo de Vida de un Plugin

El ciclo de vida de un plugin consta de las siguientes fases:

1. **Registro**: El plugin se declara al sistema durante el inicio de Atlas
2. **Inicialización**: Se ejecuta el método `init()` que registra componentes y servicios
3. **Activación**: El usuario activa el plugin desde la configuración (si no está activo por defecto)
4. **Ejecución**: El plugin opera normalmente, con todos sus componentes y servicios funcionando
5. **Desactivación**: El usuario desactiva el plugin desde la configuración
6. **Limpieza**: Se ejecuta el método `cleanup()` para liberar recursos

### Carga Diferida

Para optimizar el rendimiento, los plugins pueden implementar carga diferida de componentes:

```javascript
// En lugar de importar todo el plugin de una vez
import MyHeavyComponent from './components/heavy-component';

// Usar importación dinámica
const loadHeavyComponent = async () => {
  const { default: MyHeavyComponent } = await import('./components/heavy-component');
  return MyHeavyComponent;
};
```

## API de Plugins

### Acceso a APIs del Núcleo

El parámetro `core` recibido en la función `init()` proporciona acceso a las siguientes APIs:

#### Sistema de Eventos

```javascript
// Suscripción a eventos
const unsubscribe = core.events.subscribe('calendar.event_created', handleEventCreated);

// Publicación de eventos
core.events.publish('plugin-name.custom_event', { data: 'example' });
```

#### APIs de UI

```javascript
// Registrar un componente en una zona específica
core.ui.registerComponent('calendar-sidebar', MySidebarComponent);

// Registrar una opción en menú contextual
core.ui.registerContextMenuItem('event', {
  id: 'my-plugin-option',
  label: 'Mi Opción',
  action: handleMenuAction
});
```

#### Acceso a Datos

```javascript
// Obtener referencia al módulo de calendario
const calendar = core.getModule('calendar');

// Acceder a métodos del calendario
const events = calendar.getEventsByDate(new Date());
```

#### Almacenamiento

```javascript
// Guardar datos específicos del plugin
await core.storage.setItem('plugin-name.settings', settingsData);

// Recuperar datos
const settings = await core.storage.getItem('plugin-name.settings');
```

#### Internacionalización

```javascript
// Añadir traducciones
core.i18n.addResourceBundle('es', 'plugin-name', esTranslations);

// Usar traductor
const { t } = core.i18n;
const translatedText = t('plugin-name:keyName');
```

### Exportación de APIs Públicas

Cada plugin puede exponer su funcionalidad a otros plugins a través de una API pública:

```javascript
// En index.js
export default {
  // ...
  publicAPI: {
    getFeatureData: function() {
      // Implementación
      return this.internalData;
    },
    
    processExternalData: function(data) {
      // Validación
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format');
      }
      
      // Procesamiento
      return this.processDataInternally(data);
    }
  },
  
  // Métodos internos no expuestos
  internalData: { /* ... */ },
  processDataInternally: function(data) {
    // Implementación
  }
};
```

## Comunicación entre Plugins

### Usando el Bus de Eventos

El método recomendado para comunicación entre plugins es el bus de eventos:

```javascript
// En Plugin A
core.events.publish('plugin-a.data_processed', { result: processedData });

// En Plugin B
core.events.subscribe('plugin-a.data_processed', (data) => {
  // Usar los datos procesados por Plugin A
});
```

### Usando APIs Expuestas

Los plugins también pueden comunicarse directamente a través de las APIs expuestas:

```javascript
// En Plugin B
const pluginA = core.getModule('plugin-a');
if (pluginA) {
  const result = pluginA.processExternalData(myData);
  // Usar el resultado
}
```

### Conversión de Datos

Para facilitar la interoperabilidad, Atlas proporciona utilidades para conversión entre formatos:

```javascript
// Convertir una tarea en un evento
const taskTracker = core.getModule('task-tracker');
const task = taskTracker.getTaskById('task-123');

// Usar el convertidor
const taskEvent = core.converters.taskToEvent(task);

// Añadir al calendario
const calendar = core.getModule('calendar');
calendar.addEvent(taskEvent);
```

## Mejores Prácticas

### Rendimiento

- Implementar carga diferida para componentes pesados
- Evitar cálculos intensivos en el hilo principal
- Optimizar el manejo de eventos para evitar sobrecarga
- Utilizar virtualización para listas largas
- Implementar caché para operaciones frecuentes

### Manejo de Errores

- Implementar boundaries de error para cada componente principal
- Registrar errores con contexto útil
- Proporcionar mensajes de error comprensibles para el usuario
- Implementar mecanismos de recuperación
- Validar todos los datos externos

```javascript
// Ejemplo de boundary de error con React
import { ErrorBoundary } from 'react-error-boundary';

function MyPluginComponent() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorDisplay}
      onError={(error, info) => logError(error, info)}
    >
      <ActualComponent />
    </ErrorBoundary>
  );
}
```

### Estilo y UX

- Seguir la guía de estilos de Atlas
- Utilizar las variables CSS del tema actual
- Implementar modos oscuro y claro
- Asegurar que la UI sea accesible (contraste, navegación por teclado)
- Mantener coherencia con la interfaz principal

```css
/* Ejemplo de uso de variables de tema */
.my-plugin-component {
  background-color: var(--background-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  /* ... */
}
```

### Seguridad

- Validar todos los datos de entrada
- Sanitizar contenido HTML para prevenir XSS
- No almacenar información sensible sin encriptación
- Usar tokens de seguridad para conexiones externas
- Seguir el principio de privilegio mínimo

## Proceso de Publicación

Para publicar un plugin para Atlas:

1. **Desarrollo local**: Crea y prueba tu plugin en un entorno local
2. **Documentación**: Completa README.md con instrucciones claras
3. **Pruebas**: Implementa pruebas unitarias y de integración
4. **Empaquetado**: Genera el paquete del plugin siguiendo las convenciones de nomenclatura
5. **Publicación**: Sube el plugin al repositorio oficial o distribúyelo por canales alternativos

### Requisitos para Publicación Oficial

- Seguir todas las convenciones estructurales
- Proporcionar documentación completa
- Incluir traducciones para español e inglés
- Pasar todas las pruebas automatizadas
- Cumplir con los estándares de rendimiento
- No infringir derechos de autor ni licencias

## Ejemplos de Plugins

### Plugin Mínimo

```javascript
// index.js
import MyComponent from './components/my-component';
import esTranslations from './locales/es/plugin.json';
import enTranslations from './locales/en/plugin.json';

export default {
  id: 'minimal-plugin',
  name: 'Plugin Mínimo',
  version: '1.0.0',
  description: 'Un plugin mínimo de ejemplo',
  author: 'Atlas Team',
  
  init: function(core) {
    // Registrar componente
    core.ui.registerComponent('calendar-sidebar', MyComponent);
    
    // Registrar traducciones
    core.i18n.addResourceBundle('es', this.id, esTranslations);
    core.i18n.addResourceBundle('en', this.id, enTranslations);
    
    return true;
  },
  
  cleanup: function(core) {
    // Limpiar recursos
    return true;
  },
  
  publicAPI: {
    // API mínima
    getVersion: function() {
      return this.version;
    }
  }
};
```

### Plugins de Referencia

Para guiarte en el desarrollo de plugins, puedes revisar los siguientes plugins oficiales:

- [Notes Manager](plugins/notes-manager.md) | Gestión de notas vinculadas a fechas y eventos
- [Task Tracker](plugins/task-tracker.md) | Sistema de seguimiento de tareas con vista Kanban
- [Reminder System](plugins/reminder-system.md) | Sistema avanzado de recordatorios y notificaciones
- [Calendar Analytics](plugins/calendar-analytics.md) | Análisis y estadísticas del uso del calendario
- [Video Scheduler](plugins/video-scheduler.md) | Planificación de producción de videos | Contenido
- [Weather Integration](plugins/weather-integration.md) | Integración de datos meteorológicos


Cada uno de estos plugins está documentado en detalle y puede servir como referencia para diferentes tipos de funcionalidades.

---

**Nota sobre las fechas**: Los ejemplos y referencias a fechas en esta documentación son ilustrativos.