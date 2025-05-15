# Guía de Desarrollo de Plugins para Atlas

## Introducción

Esta guía proporciona instrucciones detalladas para desarrollar plugins para Atlas. Los plugins permiten extender la funcionalidad base de la aplicación, añadiendo nuevas características sin modificar el código original.

## Requisitos previos

- Conocimientos básicos de JavaScript/React
- Node.js y npm instalados
- Familiaridad con la arquitectura de Atlas

## Creación de un Plugin Básico

### 1. Estructura de directorios

Crea una carpeta para tu plugin dentro del directorio `src/plugins/` con la siguiente estructura:

```
src/plugins/mi-plugin/
├── index.js                 # Punto de entrada (OBLIGATORIO)
├── components/              # Componentes UI (OBLIGATORIO)
│   └── mi-componente.jsx
├── utils/                   # Utilidades (OBLIGATORIO)
│   └── mi-utilidad.js
├── styles/                  # Estilos (OBLIGATORIO)
│   └── mi-plugin.css
└── README.md                # Documentación (OBLIGATORIO)
```

Opcionalmente, puedes añadir:

```
├── contexts/                # Contextos React (OPCIONAL)
│   └── mi-contexto.jsx
├── services/                # Servicios (OPCIONAL)
│   └── mi-servicio.js
└── locales/                 # Traducciones (OPCIONAL en v0.3.0, OBLIGATORIO en v1.0.0)
    ├── es/
    │   └── traduccion.json
    └── en/
        └── translation.json
```

### 2. Implementación del punto de entrada

Crea un archivo `index.js` en la raíz de tu plugin:

```javascript
/**
 * Mi Plugin para Atlas
 * 
 * Descripción breve del propósito del plugin
 */
export default {
  // Metadatos del plugin
  id: 'mi-plugin',           // ID único (usar minúsculas y guiones)
  name: 'Mi Plugin',         // Nombre para mostrar
  version: '0.1.0',          // Versión semántica
  description: 'Descripción de mi plugin', // Descripción breve
  author: 'Tu Nombre',       // Autor o organización
  
  // Restricciones de compatibilidad
  minAppVersion: '0.3.0',    // Versión mínima de Atlas soportada
  maxAppVersion: '1.0.0',    // Versión máxima de Atlas soportada
  
  /**
   * Se ejecuta cuando el plugin se activa
   * @param {Object} core - API central proporcionada por Atlas
   * @returns {boolean} - true si la inicialización fue exitosa
   */
  init: function(core) {
    // Guardar referencia al core para uso posterior
    this.core = core;
    
    // Suscribirse a eventos
    this.unsubscribeHandlers = [];
    const unsubscribe = core.events.subscribe('calendar.event_created', this.handleEventCreated.bind(this));
    this.unsubscribeHandlers.push(unsubscribe);
    
    // Registrar componentes UI
    // core.ui.registerComponent('calendar-sidebar', MiComponente);
    
    console.log('Mi Plugin inicializado correctamente');
    return true;
  },
  
  /**
   * Se ejecuta cuando el plugin se desactiva
   * @param {Object} core - API central proporcionada por Atlas
   * @returns {boolean} - true si la limpieza fue exitosa
   */
  cleanup: function(core) {
    // Cancelar todas las suscripciones a eventos
    this.unsubscribeHandlers.forEach(unsubscribe => unsubscribe());
    this.unsubscribeHandlers = [];
    
    // Limpiar otras referencias
    this.core = null;
    
    console.log('Mi Plugin desactivado correctamente');
    return true;
  },
  
  /**
   * Manejador de evento (ejemplo)
   * @private
   */
  handleEventCreated: function(eventData) {
    console.log('Mi Plugin: Nuevo evento creado', eventData);
  },
  
  /**
   * API pública que expone el plugin para otros plugins o módulos
   */
  publicAPI: {
    getInfo: function() {
      return {
        name: 'Mi Plugin',
        version: '0.1.0'
      };
    },
    
    doSomething: function(param) {
      // Implementación...
      return `Resultado para ${param}`;
    }
  }
};
```

### 3. Añadir un componente React

Crea un componente React básico en `components/mi-componente.jsx`:

```jsx
import React, { useState, useEffect } from 'react';

/**
 * Componente de ejemplo para mi plugin
 */
const MiComponente = () => {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    // Cargar datos o realizar inicialización
    setData(['Item 1', 'Item 2', 'Item 3']);
  }, []);
  
  return (
    <div className="mi-plugin-container">
      <h3 className="mi-plugin-title">Mi Plugin</h3>
      <ul className="mi-plugin-list">
        {data.map((item, index) => (
          <li key={index} className="mi-plugin-item">{item}</li>
        ))}
      </ul>
    </div>
  );
};

export default MiComponente;
```

### 4. Añadir estilos

Crea un archivo CSS en `styles/mi-plugin.css`:

```css
/* Estilos para mi plugin */
.mi-plugin-container {
  padding: 16px;
  background-color: var(--color-calendar-header);
  border-radius: 8px;
  margin-bottom: 16px;
}

.mi-plugin-title {
  color: var(--color-atlas-blue);
  font-size: 1.2rem;
  margin-bottom: 12px;
}

.mi-plugin-list {
  list-style-type: none;
  padding-left: 0;
}

.mi-plugin-item {
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
}

.mi-plugin-item:last-child {
  border-bottom: none;
}
```

## Uso de la API `core`

### Bus de eventos

```javascript
// Suscribirse a un evento
const unsubscribe = core.events.subscribe('calendar.event_created', (eventData) => {
  console.log('Evento creado:', eventData);
});

// Publicar un evento
core.events.publish('mi-plugin.custom_event', {
  timestamp: Date.now(),
  data: 'Información personalizada'
});

// Cancelar suscripción
unsubscribe();
```

### Almacenamiento de datos

```javascript
// Guardar datos
await core.storage.setItem('mi-plugin', 'preferencias', {
  tema: 'oscuro',
  intervalo: 30
});

// Recuperar datos
const preferencias = await core.storage.getItem('mi-plugin', 'preferencias', {});

// Eliminar datos
await core.storage.removeItem('mi-plugin', 'datos_temporales');
```

### Acceso a módulos de la aplicación

```javascript
// Obtener referencia al módulo del calendario
const calendar = core.getModule('calendar');

// Usar API del calendario
if (calendar) {
  const eventos = calendar.getEvents();
  console.log('Eventos actuales:', eventos);
}
```

### Registro de componentes UI

```javascript
// Registrar un componente en la barra lateral
core.ui.registerComponent('calendar-sidebar', MiComponenteSidebar);

// Registrar un componente en el panel de configuración
core.ui.registerComponent('settings-panel', MiConfiguracion);
```

## Interacción con Otros Plugins

### Acceso a APIs de otros plugins

```javascript
// Obtener referencia a otro plugin
const otroPlugin = core.getModule('otro-plugin');

// Usar su API pública
if (otroPlugin) {
  const resultado = otroPlugin.doSomething('parámetro');
  console.log('Resultado:', resultado);
}
```

## Depuración

Para facilitar la depuración durante el desarrollo:

1. Usa `console.log()` para registrar información en la consola del navegador
2. Verifica la sección de Plugins en Configuración para ver el estado de tu plugin
3. Usa el botón "Recargar Plugins" para actualizar sin reiniciar la aplicación

## Pruebas

Para asegurar que tu plugin funciona correctamente:

1. Prueba la activación y desactivación
2. Verifica que se limpian los recursos al desactivar
3. Comprueba la interacción con componentes de la aplicación
4. Asegúrate de que funciona con diferentes temas

## Distribución

Para distribuir tu plugin:

1. Empaquétalo en un archivo ZIP con la estructura correcta
2. Proporciona documentación clara en el README.md
3. Especifica las versiones de Atlas compatibles

## Consideraciones Finales

1. **Rendimiento**: Optimiza tu plugin para evitar ralentizar la aplicación
2. **Limpieza**: Asegúrate de liberar todos los recursos cuando el plugin se desactiva
3. **Coherencia visual**: Sigue las pautas de diseño de Atlas
4. **Errores**: Implementa un buen manejo de errores para evitar afectar la aplicación

## Ejemplos

Puedes encontrar plugins de ejemplo en:

- [Plugin de Notas](./notes-manager.md): Plugin básico que demuestra integración con el calendario
- [Plugin de Tareas](./task-tracker.md) (próximamente): Plugin más complejo con su propio almacenamiento de datos
- [Plugin de Clima](./weather-integration.md) (próximamente): Plugin que integra API externa

---

Para más información, consulta la [documentación del sistema de plugins](./plugin-system.md) o la [guía rápida de creación de plugins](./quick-plugin-guide.md).