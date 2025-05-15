# Sistema de Plugins de Atlas

## Introducción

El sistema de plugins de Atlas permite extender la funcionalidad de la aplicación base mediante módulos independientes. Los plugins pueden añadir nuevas características, modificar componentes existentes o integrar servicios externos sin modificar el código fuente principal.

## Características principales

- **Modularidad**: Plugins completamente independientes de la aplicación base
- **Descargabilidad**: Plugins opcionales, descargables e instalables por los usuarios
- **API estable**: Interfaces bien definidas para interactuar con la aplicación
- **Compatibilidad versionada**: Sistema de verificación de compatibilidad con diferentes versiones de Atlas
- **Seguridad**: Aislamiento para prevenir que plugins maliciosos afecten la aplicación

## Arquitectura del Sistema

El sistema de plugins de Atlas se compone de los siguientes elementos:

1. **Plugin Loader**: Responsable de descubrir, cargar e inicializar plugins
2. **Plugin Registry**: Mantiene un registro de plugins disponibles y su estado
3. **Core API**: Proporciona una interfaz estable para que los plugins interactúen con Atlas
4. **Puntos de extensión**: Áreas específicas de la UI donde los plugins pueden integrarse

## Estructura de un Plugin

Un plugin de Atlas debe seguir una estructura estándar:

```
plugin-name/
├── index.js                 # Punto de entrada del plugin (OBLIGATORIO)
├── components/              # Componentes UI (OBLIGATORIO)
├── contexts/                # Contextos del plugin (OPCIONAL)
├── services/                # Servicios del plugin (OPCIONAL)
├── utils/                   # Utilidades (OBLIGATORIO)
├── styles/                  # Estilos (OBLIGATORIO)
├── locales/                 # Traducciones (OBLIGATORIO en v1.0.0+)
│   ├── es/                  # Español
│   └── en/                  # Inglés
└── README.md                # Documentación (OBLIGATORIO)
```

## Punto de Entrada: `index.js`

Todo plugin debe tener un archivo `index.js` con la siguiente estructura:

```javascript
export default {
  // Metadatos del plugin
  id: 'plugin-name',         // ID único
  name: 'Plugin Name',       // Nombre para mostrar
  version: '1.0.0',          // Versión semántica
  description: 'Plugin description',
  author: 'Author name',
  
  // Compatibilidad con versiones de Atlas
  minAppVersion: '0.3.0',    // Versión mínima soportada
  maxAppVersion: '1.0.0',    // Versión máxima soportada
  
  // Función de inicialización
  init: function(core) {
    // Código de inicialización
    return true; // Devolver true si la inicialización fue exitosa
  },
  
  // Función de limpieza
  cleanup: function(core) {
    // Código de limpieza
    return true; // Devolver true si la limpieza fue exitosa
  },
  
  // API pública
  publicAPI: {
    // Métodos expuestos a otros plugins
  }
};
```

## API del Objeto `core`

El objeto `core` proporcionado en la función `init()` contiene las siguientes APIs:

### Bus de Eventos

```javascript
// Suscribirse a eventos
const unsubscribe = core.events.subscribe('event.name', function(data) {
  // Manejar evento
});

// Publicar eventos
core.events.publish('plugin-name.event', { data: 'value' });
```

### Almacenamiento

```javascript
// Guardar datos
await core.storage.setItem('plugin-id', 'key', value);

// Recuperar datos
const value = await core.storage.getItem('plugin-id', 'key', defaultValue);

// Eliminar datos
await core.storage.removeItem('plugin-id', 'key');
```

### Acceso a Módulos

```javascript
// Obtener referencia a otro módulo
const calendar = core.getModule('calendar');

// Usar API del módulo
const events = calendar.getEvents();
```

### UI

```javascript
// Registrar componente en una zona específica
core.ui.registerComponent('calendar-sidebar', MyComponent);
```

### Configuración

```javascript
// Guardar configuración
await core.config.saveConfig('plugin-id', { setting: 'value' });

// Cargar configuración
const config = await core.config.loadConfig('plugin-id');
```

## Ciclo de Vida de un Plugin

1. **Registro**: El plugin se declara al sistema durante el inicio de Atlas
2. **Inicialización**: Se ejecuta el método `init()` que configura el plugin
3. **Activación**: El usuario activa el plugin desde la configuración
4. **Ejecución**: El plugin opera normalmente
5. **Desactivación**: El usuario desactiva el plugin desde la configuración
6. **Limpieza**: Se ejecuta el método `cleanup()` para liberar recursos

## Zonas de Integración UI

Los plugins pueden integrarse en varias zonas de la interfaz de usuario:

| Zona ID | Descripción | Disponibilidad |
|---------|-------------|---------------|
| `calendar-sidebar` | Panel lateral del calendario | v0.3.0+ |
| `calendar-event-context` | Menú contextual de eventos | v0.4.0+ |
| `dashboard-widgets` | Widgets en el dashboard | v0.5.0+ |
| `settings-panel` | Panel de configuración | v0.3.0+ |

La disponibilidad de zonas aumentará en versiones futuras.

## Mejores Prácticas

1. **Mínimo acoplamiento**: Usar solo las APIs proporcionadas
2. **Manejo de errores**: Implementar tratamiento de excepciones
3. **Rendimiento**: Minimizar el impacto en el rendimiento global
4. **Internacionalización**: Preparar para soporte multilingüe
5. **Documentación**: Documentar el uso y funcionalidades del plugin

## Seguridad

Los plugins deben respetar las siguientes restricciones:

- No acceder directamente al sistema de archivos (solo a través de las APIs proporcionadas)
- No modificar el DOM fuera de sus componentes registrados
- No realizar peticiones a servidores no autorizados
- No almacenar información sensible sin encriptación

## Distribución de Plugins

Atlas soportará dos métodos de distribución:

1. **Repositorio oficial**: Plugins verificados y aprobados por el equipo de Atlas
2. **Instalación manual**: Plugins descargados desde otras fuentes e instalados por el usuario

## Compatibilidad con Versiones

Los plugins declaran su rango de compatibilidad mediante `minAppVersion` y `maxAppVersion`. El sistema verificará automáticamente la compatibilidad antes de permitir la activación de un plugin.

## Estado de Implementación

| Característica | Estado | Disponibilidad |
|----------------|--------|---------------|
| Carga básica de plugins | Completo | v0.3.0 |
| Puntos de extensión UI | Parcial | v0.3.0 |
| Almacenamiento de datos | Completo | v0.3.0 |
| Comunicación entre plugins | Planeado | v0.4.0 |
| Sistema de permisos | Planeado | v0.5.0 |
| Marketplace de plugins | Planeado | v1.0.0 |

---

Este sistema de plugins está diseñado para crecer con la aplicación. Durante las primeras etapas (0.3.0 - 0.5.0), se implementarán las funcionalidades básicas. La versión 1.0.0 incluirá el sistema completo con soporte para distribución y un conjunto robusto de APIs.