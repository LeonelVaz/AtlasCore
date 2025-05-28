# 🔢 Contador de Eventos por Día

Plugin para Atlas que muestra la cantidad de eventos en el header de cada día del calendario con actualización en tiempo real y diseño elegante.

## 📁 Estructura del Proyecto

```
contador-eventos-dia/
├── index.js                           # Plugin principal
├── components/
│   └── EventCounterBadge.jsx         # Componente del badge contador
├── styles/
│   └── event-counter.css             # Estilos CSS del plugin
└── README.md                         # Este archivo
```

## ✨ Características

- **Contador inteligente**: Muestra un badge con el número de eventos por día
- **Variantes visuales**: Diferentes colores según la cantidad de eventos:
  - 🟢 **Verde/Azul** (1-2 eventos): Pocos eventos
  - 🔵 **Azul/Morado** (3-5 eventos): Cantidad moderada
  - 🟠 **Naranja/Rojo** (6+ eventos): Muchos eventos
- **Actualización en tiempo real**: Se actualiza instantáneamente al crear/modificar/eliminar eventos
- **Diseño elegante**: Badge sutil en la esquina inferior derecha
- **Totalmente responsive**: Se adapta a diferentes tamaños de pantalla
- **Accesible**: Soporte para temas oscuros, alto contraste y navegación por teclado

## 🎨 Comportamiento Visual

### Variantes por Cantidad de Eventos

| Cantidad | Variante | Colores        | Descripción                            |
| -------- | -------- | -------------- | -------------------------------------- |
| 1-2      | `low`    | Verde → Azul   | Pocos eventos, colores suaves          |
| 3-5      | `medium` | Azul → Morado  | Cantidad normal, colores principales   |
| 6+       | `high`   | Naranja → Rojo | Muchos eventos, colores de advertencia |

### Formateo de Números

- **1-9**: Se muestra el número tal como es
- **10-99**: Se muestra el número completo
- **100+**: Se muestra como "99+"

## 🛠️ Instalación

1. Copia la carpeta completa `contador-eventos-dia/` a tu directorio de plugins de Atlas
2. Reinicia Atlas o recarga la página
3. El plugin se activará automáticamente

## 💻 Arquitectura del Código

### `index.js` - Plugin Principal

- Inicialización y configuración del plugin
- Gestión de eventos del calendario
- Carga dinámica de estilos CSS
- Registro de extensiones UI usando el patrón Wrapper

### `components/EventCounterBadge.jsx` - Componente React

- Lógica para contar eventos por día
- Determinación de variantes visuales
- Formateo inteligente de números
- Manejo de estados de carga y actualización

### `styles/event-counter.css` - Estilos CSS

- Diseño responsive y accesible
- Variantes de color por cantidad de eventos
- Animaciones y transiciones suaves
- Soporte para temas oscuros y alto contraste

## 🎯 Funcionalidades Técnicas

### Gestión de Estado

```javascript
const [eventCount, setEventCount] = React.useState(0);
const [isLoading, setIsLoading] = React.useState(true);
```

### Lógica de Variantes

```javascript
const getBadgeVariant = (count) => {
  if (count <= 2) return "low";
  if (count <= 5) return "medium";
  return "high";
};
```

### Actualización Reactiva

- Escucha eventos: `calendar.eventCreated`, `calendar.eventUpdated`, `calendar.eventDeleted`
- Publica evento personalizado: `contadorEventos.actualizar`
- Actualización automática sin necesidad de recargar

## 🔧 Configuración

El plugin funciona sin configuración adicional. Los estilos se basan completamente en las variables CSS de Atlas:

```css
/* Usa variables nativas de Atlas */
background: linear-gradient(
  135deg,
  var(--primary-color),
  var(--secondary-color)
);
color: var(--text-color-secondary);
border-radius: var(--border-radius-md);
box-shadow: var(--shadow-sm);
```

## 🎨 Personalización

### Modificar Colores

Edita las variables en `styles/event-counter.css`:

```css
.event-counter-badge--low {
  background: linear-gradient(135deg, var(--success-color), var(--info-color));
}
```

### Cambiar Posición

Modifica la posición en el CSS:

```css
.event-counter-badge {
  bottom: 4px; /* Distancia desde abajo */
  right: 4px; /* Distancia desde la derecha */
}
```

### Ajustar Umbrales de Variantes

Modifica la función en `EventCounterBadge.jsx`:

```javascript
const getBadgeVariant = (count) => {
  if (count <= 3) return "low"; // Cambiar umbral bajo
  if (count <= 7) return "medium"; // Cambiar umbral medio
  return "high";
};
```

## 📱 Compatibilidad

- **Atlas**: Versiones 0.3.0 - 1.0.0
- **Navegadores**: Todos los navegadores modernos
- **Dispositivos**: Desktop, tablet y móvil
- **Temas**: Claro, oscuro y alto contraste

## 🐛 Solución de Problemas

### El badge no aparece

- Verifica que hay eventos creados para ese día
- Revisa la consola para mensajes de error
- Asegúrate de que el plugin esté activado

### Estilos no se cargan

- Verifica que el archivo CSS esté en `styles/event-counter.css`
- Revisa que no hay errores de sintaxis en el CSS
- Recarga la página completamente

### Números no se actualizan

- Verifica que los eventos del calendario se publican correctamente
- Revisa los logs en consola: `[EventCounterBadge]`
- Asegúrate de que el módulo de calendario está disponible

## 📚 API del Componente

### Props Recibidas

```javascript
{
  date: Date,           // Fecha del día del calendario
  core: Object,         // API de Core de Atlas
  plugin: Object,       // Instancia del plugin
  pluginId: String      // ID del plugin
}
```

### Eventos Escuchados

- `contadorEventos.actualizar`: Actualización manual del contador
- `calendar.eventCreated`: Evento creado
- `calendar.eventUpdated`: Evento actualizado
- `calendar.eventDeleted`: Evento eliminado

## 🚀 Extensiones Futuras

Ideas para mejoras:

- Mostrar tipos de eventos con iconos diferentes
- Animaciones más elaboradas
- Configuración de colores personalizable
- Integración con filtros de calendario
- Estadísticas detalladas en tooltip

---

**Versión**: 1.0.0  
**Compatibilidad**: Atlas 0.3.0 - 1.0.0  
**Última actualización**: Mayo 2025
