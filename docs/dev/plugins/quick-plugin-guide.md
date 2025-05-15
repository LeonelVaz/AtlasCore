# Guía para Crear y Probar un Plugin Básico

Esta guía te mostrará cómo crear un plugin sencillo para probar el sistema de plugins de Atlas.

## Paso 1: Crear una carpeta para el plugin

Crea una carpeta llamada `test-plugin` dentro del directorio `src/plugins/` de Atlas:

```
src/plugins/test-plugin/
```

## Paso 2: Crear el archivo index.js

Dentro de la carpeta `test-plugin`, crea un archivo `index.js` con el siguiente contenido:

```javascript
/**
 * Plugin de prueba para Atlas
 */
export default {
  // Metadatos del plugin
  id: 'test-plugin',
  name: 'Plugin de Prueba',
  version: '0.1.0',
  description: 'Un plugin simple para probar el sistema de plugins',
  author: 'Tu Nombre',
  
  // Restricciones de compatibilidad
  minAppVersion: '0.3.0',
  maxAppVersion: '1.0.0',
  
  /**
   * Inicializa el plugin
   * @param {Object} core - API central proporcionada por Atlas
   * @returns {boolean} - true si la inicialización fue exitosa
   */
  init: function(core) {
    console.log('¡Plugin de prueba inicializado!');
    
    // Guardar referencia al core para uso posterior
    this.core = core;
    
    // Subscribirse a eventos
    this.unsubscribe = core.events.subscribe('app.initialized', () => {
      console.log('Plugin de prueba recibió evento app.initialized');
    });
    
    return true;
  },
  
  /**
   * Limpia recursos cuando el plugin se desactiva
   * @param {Object} core - API central proporcionada por Atlas
   * @returns {boolean} - true si la limpieza fue exitosa
   */
  cleanup: function(core) {
    console.log('Plugin de prueba desactivado');
    
    // Cancelar suscripciones a eventos
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    this.core = null;
    
    return true;
  },
  
  /**
   * API pública que expone el plugin
   */
  publicAPI: {
    getInfo: function() {
      return {
        name: 'Plugin de Prueba',
        version: '0.1.0'
      };
    }
  }
};
```

## Paso 3: Reiniciar la aplicación

Después de crear el plugin:

1. Reinicia la aplicación Atlas
2. Ve a la sección de "Configuración"
3. Selecciona "Plugins" en el menú lateral
4. Haz clic en "Recargar Plugins"

El nuevo plugin debería aparecer en la lista de plugins disponibles. Puedes activarlo o desactivarlo usando los botones en la interfaz.

## Paso 4: Verificar la consola

Abre la consola del navegador o de la aplicación Electron (DevTools) para ver los mensajes de registro del plugin:

- Cuando se inicializa: `¡Plugin de prueba inicializado!`
- Cuando se desactiva: `Plugin de prueba desactivado`

## Modificaciones y pruebas

Puedes modificar el archivo `index.js` para probar diferentes funcionalidades. Después de cada modificación, reinicia la aplicación o utiliza el botón "Recargar Plugins" para ver los cambios.

## Estructura completa del plugin

Para un plugin más completo, puedes seguir esta estructura:

```
src/plugins/test-plugin/
├── index.js                 # Punto de entrada del plugin
├── components/              # Componentes UI 
│   └── test-component.jsx   # Un componente de ejemplo
├── utils/                   # Utilidades
│   └── test-utils.js        # Funciones de utilidad
└── styles/                  # Estilos
    └── test-styles.css      # Estilos CSS
```

En versiones futuras del sistema de plugins, podrás implementar componentes que se integren en diferentes partes de la aplicación Atlas.