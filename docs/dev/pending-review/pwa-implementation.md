# Implementación de Progressive Web App (PWA) en Atlas

## Introducción

Este documento detalla el enfoque progresivo para implementar las capacidades de Progressive Web App (PWA) en Atlas, desde la configuración inicial en la versión 0.4.0 hasta la implementación completa en la versión 1.0.0. El objetivo es proporcionar una aplicación web que ofrezca una experiencia similar a la nativa, con soporte offline, instalación en dispositivos y rendimiento optimizado.

## Enfoque Incremental

La implementación de PWA en Atlas sigue un enfoque incremental dividido en dos fases principales:

1. **Configuración básica (v0.4.0)**: Establece los fundamentos técnicos necesarios
2. **Implementación completa (v1.0.0)**: Desarrolla todas las capacidades PWA avanzadas

Este enfoque permite establecer tempranamente las bases de la arquitectura PWA mientras se continúa con el desarrollo de otras funcionalidades críticas, completando la implementación cuando el producto esté listo para su lanzamiento.

## Fase 1: Configuración Básica (v0.4.0)

### Web App Manifest

En la versión 0.4.0, se implementa un archivo `manifest.json` básico en el directorio `public/`:

```json
{
  "name": "Atlas - Gestión de Tiempo Modular",
  "short_name": "Atlas",
  "description": "Plataforma modular para gestión del tiempo con plugins personalizables",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#141B2D",
  "theme_color": "#2D4B94",
  "icons": [
    {
      "src": "assets/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "assets/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "assets/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "assets/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "assets/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "assets/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "assets/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "assets/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker Básico

Se implementa un Service Worker mínimo para habilitar capacidades offline básicas:

```javascript
// public/service-worker.js
const CACHE_NAME = 'atlas-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/favicon.ico',
  '/assets/icons/icon-192x192.png'
];

// Instalación del Service Worker y caché de recursos estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(STATIC_ASSETS);
      })
  );
});

// Estrategia básica: Cache First con fallback a red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Devolver de caché si está disponible
        if (cachedResponse) {
          return cachedResponse;
        }
        // De lo contrario, fetch desde la red
        return fetch(event.request)
          .then(response => {
            // No cachear respuestas no válidas
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clonar respuesta para caché y retorno
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          });
      })
  );
});

// Activación y limpieza de cachés antiguos
self.addEventListener('activate', event => {
  const cacheAllowlist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheAllowlist.indexOf(cacheName) === -1) {
            // Eliminar cachés antiguos
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

### Registro del Service Worker

Código para registrar el Service Worker en `index.html`:

```html
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registrado correctamente:', registration);
        })
        .catch(error => {
          console.log('Error al registrar Service Worker:', error);
        });
    });
  }
</script>
```

### Metadatos de Instalación

Adición de meta tags relevantes en `index.html`:

```html
<head>
  <!-- Metadatos existentes -->
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#2D4B94">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Atlas">
  <link rel="apple-touch-icon" href="/assets/icons/icon-152x152.png">
  <!-- Otros metadatos y recursos -->
</head>
```

### Limitaciones en v0.4.0

La implementación básica en v0.4.0 tiene las siguientes limitaciones:

- Experiencia offline limitada (solo recursos estáticos)
- Sin sincronización en segundo plano
- Sin notificaciones push
- Estrategia de caché simple
- Sin integración profunda con otras funcionalidades de Atlas
- Sin optimizaciones avanzadas de rendimiento

## Fase 2: Implementación Completa (v1.0.0)

### Service Worker Avanzado

En la versión 1.0.0, se implementa un Service Worker avanzado usando la biblioteca Workbox para una gestión sofisticada del caché:

```javascript
// Implementación con Workbox en v1.0.0
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

// Configuración de Workbox
workbox.setConfig({
  debug: false
});

// Precache de recursos críticos (generado automáticamente durante el build)
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

// Estrategia para recursos estáticos: Cache First
workbox.routing.registerRoute(
  ({request}) => request.destination === 'style' || 
                 request.destination === 'script' || 
                 request.destination === 'font' ||
                 request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'atlas-static-resources',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 días
      })
    ]
  })
);

// Estrategia para páginas HTML: Network First
workbox.routing.registerRoute(
  ({request}) => request.mode === 'navigate',
  new workbox.strategies.NetworkFirst({
    cacheName: 'atlas-pages',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 7 * 24 * 60 * 60 // 7 días
      })
    ]
  })
);

// Estrategia para API: Stale-While-Revalidate
workbox.routing.registerRoute(
  new RegExp('/api/.*'),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'atlas-api-responses',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60 // 1 día
      })
    ]
  })
);

// Background Sync para operaciones pendientes
const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('atlas-pending-operations', {
  maxRetentionTime: 24 * 60 // 24 horas en minutos
});

// Capturar solicitudes fallidas de operaciones críticas para sync en segundo plano
workbox.routing.registerRoute(
  ({url}) => url.pathname.startsWith('/api/events') || 
             url.pathname.startsWith('/api/tasks'),
  new workbox.strategies.NetworkOnly({
    plugins: [bgSyncPlugin]
  }),
  'POST'
);

// Notificaciones Push
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url
    },
    actions: data.actions
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Manejo de clics en notificaciones
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action) {
    // Procesar acciones específicas
    // Por ejemplo, "ver", "snooze", etc.
  } else {
    // Acción predeterminada: abrir la aplicación
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});
```

### Manifest Completo

Versión mejorada del manifest.json en v1.0.0:

```json
{
  "name": "Atlas - Plataforma Modular de Gestión del Tiempo",
  "short_name": "Atlas",
  "description": "Sostén tu mundo, organiza tu tiempo con la plataforma modular Atlas",
  "start_url": "/?source=pwa",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#141B2D",
  "theme_color": "#2D4B94",
  "categories": ["productivity", "time management", "calendar"],
  "lang": "es-MX",
  "dir": "ltr",
  "iarc_rating_id": "e84b072d-71b3-4d3e-86ae-31a8ce4e53b7",
  "prefer_related_applications": false,
  "scope": "/",
  "shortcuts": [
    {
      "name": "Añadir Evento",
      "short_name": "Nuevo Evento",
      "description": "Crear un nuevo evento en el calendario",
      "url": "/new-event",
      "icons": [{ "src": "/assets/icons/shortcuts/add-event-96x96.png", "sizes": "96x96" }]
    },
    {
      "name": "Tareas Pendientes",
      "short_name": "Tareas",
      "description": "Ver tareas pendientes",
      "url": "/tasks?filter=pending",
      "icons": [{ "src": "/assets/icons/shortcuts/tasks-96x96.png", "sizes": "96x96" }]
    },
    {
      "name": "Recordatorios",
      "short_name": "Alarmas",
      "description": "Ver recordatorios activos",
      "url": "/reminders",
      "icons": [{ "src": "/assets/icons/shortcuts/reminders-96x96.png", "sizes": "96x96" }]
    }
  ],
  "icons": [
    /* Iconos mejorados para todas las plataformas */
    {
      "src": "assets/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    /* ... y más tamaños, incluyendo iconos maskable */
    {
      "src": "assets/icons/maskable-icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "assets/screenshots/calendar-view-1280x720.png",
      "sizes": "1280x720",
      "type": "image/png",
      "platform": "wide",
      "label": "Vista de Calendario Semanal en Atlas"
    },
    {
      "src": "assets/screenshots/tasks-view-1280x720.png",
      "sizes": "1280x720",
      "type": "image/png",
      "platform": "wide",
      "label": "Gestión de Tareas en Atlas"
    },
    {
      "src": "assets/screenshots/mobile-day-view-750x1334.png",
      "sizes": "750x1334",
      "type": "image/png",
      "platform": "narrow",
      "label": "Vista Diaria en Móvil"
    }
  ]
}
```

### Características Avanzadas en v1.0.0

#### 1. Notificaciones Push

Integración completa con el plugin Reminder System:

- Suscripción a notificaciones push en el navegador
- Gestión de permisos simplificada para el usuario
- Mensajes personalizados basados en eventos del calendario
- Acciones rápidas en notificaciones (snooze, ver detalles)

#### 2. Sincronización en Segundo Plano

Implementación robusta para:

- Operaciones CRUD pendientes cuando no hay conexión
- Sincronización automática cuando se restaura la conexión
- Resolución de conflictos durante la sincronización
- Indicadores de estado de sincronización en la interfaz

#### 3. Experiencia Offline Completa

- Shell de aplicación que carga instantáneamente
- Acceso completo a datos previamente vistos
- Interfaz para operaciones pendientes
- Estrategias optimizadas por tipo de contenido
- Mensajes claros sobre el estado de conectividad

#### 4. Instalación Optimizada

- Experiencia de instalación guiada
- Detección inteligente del momento óptimo para sugerir instalación
- Soporte para iOS, Android y escritorio
- Tutoriales post-instalación
- Medición de uso de la app instalada vs. web

#### 5. Integración con Plugins

- API para que los plugins registren workers específicos
- Caché personalizada por plugin según necesidades
- Sincronización específica por plugin (Ej: Weather API)
- Notificaciones push disponibles para plugins como Reminder System

## Diagrama de Arquitectura PWA

```
+-------------------------------------+
|             Atlas PWA               |
+-------------------------------------+
|                                     |
|  +-------------------------------+  |
|  |         Application Shell     |  |
|  +-------------------------------+  |
|                                     |
|  +---------------+  +-----------+   |
|  | Core Features |  |  Plugins  |   |
|  +---------------+  +-----------+   |
|                                     |
|  +-------------------------------+  |
|  |       Service Worker          |  |
|  | +-------------+ +----------+  |  |
|  | | Cache Logic | | Sync API |  |  |
|  | +-------------+ +----------+  |  |
|  | +--------------------------+  |  |
|  | |    Notification API      |  |  |
|  | +--------------------------+  |  |
|  +-------------------------------+  |
|                                     |
|  +-------------------------------+  |
|  |     IndexedDB / Storage      |  |  
|  +-------------------------------+  |
|                                     |
+-------------------------------------+
           |             |
           v             v
   +--------------+ +--------------+
   |  Web Server  | | Push Server  |
   +--------------+ +--------------+
```

## Flujo de Implementación

### Durante Stage 4 (v0.4.0)

1. Creación de manifest.json básico
2. Implementación de Service Worker simple
3. Configuración de metadatos necesarios
4. Pruebas de instalación básica
5. Testing de funcionalidad offline limitada

### Durante Stage 6 (v1.0.0)

1. Actualización a Service Worker avanzado con Workbox
2. Mejora de manifest.json con características completas
3. Implementación de notificaciones push
4. Desarrollo de sincronización en segundo plano
5. Integración con APIs de plugins
6. Testing exhaustivo en múltiples plataformas
7. Optimizaciones de rendimiento
8. Auditorías PWA para cumplimiento de estándares

## Medición de Rendimiento

El rendimiento de la PWA se evalúa usando los siguientes criterios:

1. **Lighthouse Score**: Objetivo mínimo 90/100 en categoría PWA
2. **Tiempo de inicio**: < 2 segundos en dispositivos promedio
3. **Interactividad**: < 3.5 segundos (First Input Delay)
4. **Tamaño de descarga inicial**: < 200KB (sin imágenes)
5. **Pruebas de rendimiento offline**: 100% funcionalidad crítica

## Consideraciones de Plataforma

### Móvil Web

- Optimizaciones específicas para iOS y Android
- Adaptaciones para diferencias en implementación de PWA
- Pruebas en navegadores móviles principales

### Escritorio

- Experiencia instalable en Windows, macOS y Linux
- Integración con características del sistema operativo
- Optimizaciones para pantallas grandes

## Pruebas y Compatibilidad

### Navegadores Soportados

- Chrome (móvil y escritorio): Soporte completo
- Safari (iOS y macOS): Soporte con limitaciones específicas
- Edge: Soporte completo
- Firefox: Soporte completo
- Samsung Internet: Soporte completo

### Dispositivos de Prueba

- Lista de dispositivos para pruebas de instalación y rendimiento
- Matriz de compatibilidad para características específicas
- Proceso de prueba automatizado para cada release

## Conclusión

La implementación de PWA en Atlas sigue un enfoque progresivo, estableciendo los fundamentos en la versión 0.4.0 y completando todas las características avanzadas en la versión 1.0.0. Este enfoque permite una integración cuidadosa con otras funcionalidades del sistema, asegurando que la experiencia PWA sea robusta y ofrezca un valor significativo a los usuarios.

El resultado final es una aplicación que combina lo mejor de las aplicaciones web y nativas: accesibilidad universal a través del navegador, capacidad de instalación en dispositivos, funcionamiento offline y rendimiento optimizado.

**Nota sobre las fechas**: Los ejemplos y referencias a fechas en esta documentación son ilustrativos.