# Sistema de Plugins de Atlas

## Visión General

El sistema de plugins de Atlas permite extender la funcionalidad básica de la aplicación con módulos adicionales que se integran perfectamente con el núcleo. Esta arquitectura modular es uno de los valores fundamentales de Atlas, permitiendo a los usuarios personalizar su experiencia según sus necesidades.

## Plugins Disponibles

| Plugin | Descripción | Categoría | Disponible desde |
|--------|-------------|-----------|------------------|
| [Notes Manager](notes-manager.md) | Gestión de notas vinculadas a fechas y eventos | Productividad | v0.3.0 |
| [Task Tracker](task-tracker.md) | Sistema de seguimiento de tareas con vista Kanban | Organización | v0.4.0 |
| [Reminder System](reminder-system.md) | Sistema avanzado de recordatorios y notificaciones | Notificaciones | v0.4.0 |
| [Calendar Analytics](calendar-analytics.md) | Análisis y estadísticas del uso del calendario | Análisis | v0.5.0 |
| [Video Scheduler](video-scheduler.md) | Planificación de producción de videos | Contenido | v0.5.0 |
| [Weather Integration](weather-integration.md) | Integración de datos meteorológicos | Información | v0.5.0 |

## Matriz de Interacción entre Plugins

La siguiente matriz muestra cómo interactúan los diferentes plugins entre sí:

| Plugin A | Plugin B | Tipo de Interacción | Notas |
|----------|----------|---------------------|-------|
| Notes Manager | Calendar | Las notas pueden vincularse a eventos | La eliminación de eventos no elimina notas vinculadas |
| Task Tracker | Calendar | Las tareas pueden mostrarse como eventos | Sincronización bidireccional de cambios |
| Task Tracker | Notes Manager | Notas pueden vincularse a tareas | Relación opcional |
| Calendar Analytics | Calendar | Analiza datos del calendario | Solo lectura, no modifica eventos |
| Video Scheduler | Calendar | Crea eventos especiales de tipo video | Añade metadatos específicos a eventos |
| Reminder System | Calendar | Añade recordatorios a eventos | Extensión de la funcionalidad de eventos |
| Weather Integration | Calendar | Muestra clima en días del calendario | No modifica eventos, solo añade visualización |

## Arquitectura del Sistema de Plugins

El sistema de plugins de Atlas está basado en los siguientes principios arquitectónicos:

### 1. Acoplamiento Débil

Los plugins se comunican con el núcleo y entre sí a través de:
- El bus de eventos centralizado
- APIs bien definidas expuestas a través del registro de módulos
- Convertidores de datos estandarizados para intercambio de información

### 2. Integración Coherente

Todos los plugins mantienen:
- Consistencia visual con el resto de la aplicación
- Compatibilidad con el sistema de temas
- Soporte para internacionalización
- Manejo adecuado de errores

### 3. Control de Ciclo de Vida

El sistema de plugins gestiona de forma centralizada:
- Carga y descarga de plugins
- Registro y exposición de APIs
- Resolución de conflictos entre plugins
- Acceso a recursos compartidos

## Desarrollo de Plugins

Para los desarrolladores interesados en crear nuevos plugins para Atlas, cada plugin debe seguir una estructura estandarizada:

```
plugin-name/ 
├── index.js                 # Punto de entrada del plugin
├── components/              # Componentes UI
│   ├── component-name.jsx
│   └── ...
├── contexts/                # Contextos del plugin (si aplica)
│   └── context-name.jsx
├── services/                # Servicios del plugin (si aplica)
│   └── service-name.js
├── utils/                   # Utilidades
│   └── utility-name.js
├── styles/                  # Estilos
│   └── plugin-styles.css
├── locales/                 # Traducciones
│   ├── es/                  # Español
│   │   └── plugin.json
│   └── en/                  # Inglés
│       └── plugin.json
└── README.md                # Documentación del plugin
```

Para más detalles sobre cómo desarrollar un plugin, consulte la documentación dedicada al desarrollo de plugins en la sección de desarrollo de la documentación principal.

## Gestión de Plugins

Los usuarios pueden gestionar sus plugins desde el panel de configuración de Atlas:

- **Activar/Desactivar plugins**: Controlar qué plugins están activos
- **Configurar plugins**: Personalizar las opciones específicas de cada plugin
- **Verificar compatibilidad**: Ver la matriz de compatibilidad entre plugins instalados
- **Actualizar plugins**: Gestionar las actualizaciones disponibles

### Estructura Estándar de Plugins

Cada plugin debe seguir la siguiente estructura estandarizada:

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
    - Conexión a APIs externas (Weather Integration)
    - Sistemas de notificaciones (Reminder System)
    - Procesamiento complejo de datos (Calendar Analytics)
  * **OPCIONAL** para plugins que operan principalmente con datos locales (Notes Manager, Task Tracker)

Todos los plugins deben mantener esta estructura para garantizar la coherencia del sistema y facilitar el mantenimiento.

## Internacionalización de Plugins

Todos los plugins incorporan soporte para múltiples idiomas. A partir de la versión 1.0.0, los plugins incluyen traducciones para:

- Español (idioma predeterminado)
- Inglés

Cada plugin debe proporcionar sus propios archivos de traducción siguiendo la estructura estandarizada:

```
locales/
├── es/
│   └── plugin.json          # Traducciones en español
└── en/
    └── plugin.json          # Traducciones en inglés
```

Para más información sobre la internacionalización de plugins, consulte la documentación de internacionalización.

## Proceso de Carga de Plugins

El proceso de carga de plugins sigue estos pasos:

1. **Detección**: El sistema escanea el directorio de plugins
2. **Validación**: Se verifica que el plugin cumpla con la estructura requerida
3. **Registro**: El plugin se registra en el sistema principal
4. **Inicialización**: Se ejecuta el método `init()` del plugin
5. **Carga de Recursos**: Se cargan traducciones y otros recursos
6. **Integración UI**: Se añaden los componentes del plugin a la interfaz

Este proceso garantiza que los plugins se integren de manera segura y consistente con el resto de la aplicación.

**Nota sobre las fechas**: Los ejemplos y referencias a fechas en esta documentación son ilustrativos.