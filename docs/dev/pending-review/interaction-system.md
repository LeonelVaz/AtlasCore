# Sistema de Interacciones Avanzadas

## Introducción

El Sistema de Interacciones Avanzadas de Atlas proporciona una experiencia de usuario intuitiva y potente para manipular eventos en el calendario. Este documento detalla la arquitectura, implementación y principios de diseño del sistema que permite arrastrar y soltar eventos, redimensionarlos y alinearlos automáticamente mediante un sistema de imán (snap).

## Arquitectura General

### Principios de Diseño

El sistema se basa en los siguientes principios:

1. **Separación de responsabilidades**: La lógica de interacción está separada de los componentes de UI.
2. **Composición mediante hooks**: Las funcionalidades se encapsulan en hooks personalizados reutilizables.
3. **Retroalimentación visual clara**: El sistema proporciona indicaciones visuales sobre las acciones realizadas.
4. **Precisión configurable**: El sistema de imán (snap) permite ajustar la precisión de las interacciones.
5. **Consistencia entre vistas**: Las interacciones funcionan de manera coherente en las vistas de día y semana.

### Componentes Principales

```
hooks/
├── use-event-drag.jsx     # Hook para arrastrar eventos
├── use-event-resize.jsx   # Hook para redimensionar eventos
└── use-time-grid.jsx      # Hook para cálculos de rejilla temporal

components/calendar/
├── event-item.jsx         # Componente de evento con interacciones
├── snap-control.jsx       # Control de imán (snap)
└── time-grid.jsx          # Rejilla temporal

utils/
├── event-utils.js         # Utilidades para cálculos de eventos
└── time-utils.js          # Utilidades para manipulación de tiempo
```

### Diagrama de Interacción

```
┌───────────────┐     ┌────────────────┐     ┌────────────────┐
│  EventItem    │────▶│  useEventDrag  │────▶│  EventBus      │
│  Componente   │     │  useEventResize│     │  (notificación)│
└───────────┬───┘     └────────┬───────┘     └────────────────┘
            │                  │
            │                  ▼
            │         ┌────────────────┐
            │         │  event-utils   │
            │         │  Cálculos      │
            │         └────────┬───────┘
            │                  │
            ▼                  ▼
     ┌────────────────┐ ┌────────────────┐
     │ CalendarMain/  │ │  storageService │
     │ Context        │ │  (persistencia) │
     └────────────────┘ └────────────────┘
```

## Arrastrar y Soltar Eventos

### Hook useEventDrag

El hook `useEventDrag` gestiona todo el comportamiento de arrastrar y soltar eventos:

```javascript
// Uso básico del hook
const { dragging, handleDragStart } = useEventDrag({
  eventRef,      // Referencia al elemento DOM del evento
  event,         // Datos del evento
  onUpdate,      // Función para actualizar el evento
  gridSize,      // Tamaño de la celda (altura en píxeles)
  snapValue,     // Valor de imán en minutos (0 = desactivado)
  setBlockClicks // Función para bloquear clics durante arrastre
});
```

### Ciclo de Vida del Arrastre

1. **Inicio del arrastre**: `handleDragStart` captura la posición inicial y configura los listeners.
2. **Durante el arrastre**: Listeners de mousemove actualizan la posición visual del evento.
3. **Feedback visual**: Se aplican clases CSS para indicar el estado de arrastre y las celdas destino.
4. **Finalización**: Al soltar, se calculan las nuevas fechas y se actualiza el evento.
5. **Limpieza**: Se eliminan los listeners y se restablecen los estados visuales.

### Algoritmo de Cálculo de Posición

```javascript
// Cálculo de nueva posición temporal
const calculateNewEventTimes = (event, deltaY, daysDelta, snapValue, gridSize) => {
  // Convertir pixeles en minutos
  let minutesDelta = calculatePreciseTimeChange(deltaY, false, gridSize, snapValue);
  
  // Crear nuevas fechas
  const startDate = new Date(event.start);
  const endDate = new Date(event.end);
  
  // Aplicar cambio en minutos
  startDate.setMinutes(startDate.getMinutes() + minutesDelta);
  endDate.setMinutes(endDate.getMinutes() + minutesDelta);
  
  // Aplicar cambio en días si se arrastró horizontalmente
  if (daysDelta !== 0) {
    startDate.setDate(startDate.getDate() + daysDelta);
    endDate.setDate(endDate.getDate() + daysDelta);
  }
  
  return {
    start: startDate.toISOString(),
    end: endDate.toISOString()
  };
};
```

### Manejo de Estados Visuales

Durante el arrastre se aplican varias clases CSS para indicar los estados:

```css
/* Estilo para evento durante arrastre */
.calendar-event.dragging {
  opacity: 0.8;
  z-index: 100;
  pointer-events: none;
  cursor: move !important;
}

/* Estilo para celda destino */
.drag-target-active {
  background-color: rgba(41, 98, 255, 0.15) !important;
  box-shadow: inset 0 0 0 2px rgba(41, 98, 255, 0.5);
  transition: none !important;
  position: relative;
  z-index: 5;
}

/* Estado global durante arrastre */
body.dragging-active .calendar-time-slot:hover:not(.drag-target-active) {
  background-color: inherit;
}
```

## Redimensionamiento de Eventos

### Hook useEventResize

El hook `useEventResize` gestiona el redimensionamiento vertical de eventos:

```javascript
// Uso básico del hook
const { resizing, handleResizeStart } = useEventResize({
  eventRef,      // Referencia al elemento DOM del evento
  event,         // Datos del evento
  onUpdate,      // Función para actualizar el evento
  gridSize,      // Tamaño de la celda (altura en píxeles)
  snapValue,     // Valor de imán en minutos (0 = desactivado)
  setBlockClicks // Función para bloquear clics durante redimensionamiento
});
```

### Ciclo de Vida del Redimensionamiento

1. **Inicio del redimensionamiento**: Se activa al hacer mousedown en el controlador de redimensionamiento.
2. **Durante el redimensionamiento**: Se ajusta la altura del evento según el movimiento del ratón.
3. **Finalización**: Al soltar, se calcula la nueva hora de fin y se actualiza el evento.

### Algoritmo de Cálculo de Duración

```javascript
// Cálculo de tiempo para redimensionamiento
const calculateNewEndTime = (event, deltaY, snapValue, gridSize) => {
  // Minutos de cambio (considerando snap)
  const minutesDelta = calculatePreciseTimeChange(deltaY, true, gridSize, snapValue);
  
  // Fecha de fin original
  const endDate = new Date(event.end);
  
  // Ajustar minutos manteniendo la hora de inicio
  endDate.setMinutes(endDate.getMinutes() + minutesDelta);
  
  return endDate.toISOString();
};
```

### Manejo de Casos Especiales

El sistema detecta y maneja situaciones especiales:

1. **Eventos que continúan al día siguiente**: Se muestran indicadores visuales especiales.
2. **Duración mínima**: No se permite redimensionar por debajo de una duración mínima.
3. **Conflictos con otros eventos**: Se implementa lógica para detectar solapamientos.

```javascript
// Verificación de duración mínima
if (newEndDate - startDate < MINIMUM_EVENT_DURATION) {
  newEndDate = new Date(startDate.getTime() + MINIMUM_EVENT_DURATION);
}
```

## Sistema de Imán (Snap)

### Componente SnapControl

El componente `SnapControl` permite al usuario configurar la precisión del sistema de imán:

```javascript
// Uso del componente en CalendarMain
<SnapControl 
  snapValue={snapValue} 
  onSnapChange={setSnapValue} 
/>
```

### Valores de Snap Predefinidos

El sistema proporciona varios valores predefinidos:

```javascript
// En constants.js
export const SNAP_VALUES = {
  NONE: 0,      // Sin imán
  PRECISE: 15,  // 15 minutos
  MEDIUM: 30,   // 30 minutos
  BASIC: 60     // 1 hora
};
```

### Algoritmo de Alineación

```javascript
// Función para alinear un tiempo según el valor de snap
export function snapTimeToInterval(time, snapMinutes) {
  // Si no hay snap, devolver el tiempo original
  if (!snapMinutes || snapMinutes <= 0) {
    return time;
  }
  
  // Copia para no modificar el original
  const result = new Date(time);
  
  // Obtener minutos actuales
  const minutes = result.getMinutes();
  const remainder = minutes % snapMinutes;
  
  // Si ya está alineado, no hay cambios
  if (remainder === 0) {
    return result;
  }
  
  // Calcular el valor alineado más cercano
  const roundedMinutes = remainder < snapMinutes / 2 
    ? minutes - remainder 
    : minutes + (snapMinutes - remainder);
  
  // Aplicar el ajuste
  result.setMinutes(roundedMinutes);
  result.setSeconds(0);
  result.setMilliseconds(0);
  
  return result;
}
```

### Feedback Visual de Snap

Durante operaciones con snap activado, el sistema proporciona feedback visual:

1. **Indicador de valor**: Muestra el valor actual (15m, 30m, 1h).
2. **Movimiento discreto**: Los eventos se mueven en incrementos precisos.
3. **Clase CSS especial**: Se aplica una clase `snap-active` para efectos visuales.

## Integración con el Calendario

### Componente EventItem

El componente `EventItem` integra los hooks de arrastre y redimensionamiento:

```javascript
function EventItem({ event, onClick, onUpdate, snapValue, ...props }) {
  const eventRef = useRef(null);
  const [blockClicks, setBlockClicks] = useState(false);
  
  // Utilizar hooks de interacción
  const { dragging, handleDragStart } = useEventDrag({
    eventRef,
    event,
    onUpdate,
    snapValue,
    setBlockClicks
  });
  
  const { resizing, handleResizeStart } = useEventResize({
    eventRef,
    event,
    onUpdate,
    snapValue,
    setBlockClicks
  });
  
  // Manejar clic para editar
  const handleClick = (e) => {
    if (blockClicks) {
      e.preventDefault();
      return;
    }
    
    // Lógica de clic...
    onClick(event);
  };
  
  return (
    <div 
      ref={eventRef}
      className={`calendar-event ${dragging ? 'dragging' : ''} ${resizing ? 'resizing' : ''}`}
      style={{ backgroundColor: event.color }}
      onMouseDown={handleDragStart}
      onClick={handleClick}
    >
      <div className="event-title">{event.title}</div>
      <div className="event-time">{formatEventTime(event)}</div>
      
      {/* Controlador de redimensionamiento */}
      <div 
        className="event-resize-handle"
        onMouseDown={handleResizeStart}
      />
    </div>
  );
}
```

### Integración con el Bus de Eventos

Las interacciones publican eventos a través del bus para notificar cambios:

```javascript
// En useEventDrag al finalizar una operación de arrastre
eventBus.publish(`${EventCategories.CALENDAR}.${EVENT_OPERATIONS.UPDATE}`, updatedEvent);
```

### Persistencia de Cambios

Los cambios se persisten a través del servicio de almacenamiento:

```javascript
// En useCalendarEvents
const updateEvent = (eventId, eventData) => {
  try {
    const updatedEvents = events.map(event => 
      event.id === eventId ? { ...eventData } : event
    );
    
    setEvents(updatedEvents);
    saveEvents(updatedEvents);
    
    const updatedEvent = updatedEvents.find(e => e.id === eventId);
    
    // Publicar evento de actualización
    if (updatedEvent) {
      eventBus.publish(`${EventCategories.CALENDAR}.${EVENT_OPERATIONS.UPDATE}`, updatedEvent);
    }
    
    return updatedEvent;
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    return null;
  }
};
```

## Consistencia entre Vista de Día y Semana

El sistema garantiza que las interacciones funcionen de manera coherente en ambas vistas:

1. **Detección de vista**: Los hooks determinan automáticamente si están en vista de día o semana.
2. **Selección de celdas**: Se adapta a las diferencias estructurales de las rejillas.
3. **Cálculos unificados**: Las funciones de utilidad funcionan igual en ambas vistas.

```javascript
// Detectar tipo de vista
const isWeekView = eventRef.current.closest('.calendar-grid') !== null;
const isInDayView = eventRef.current.closest('.day-view-container') !== null;

// Aplicar lógica específica según vista
if (isInDayView) {
  // Lógica específica para vista diaria...
} else {
  // Lógica para vista semanal...
}
```

## Manejo de Errores y Casos Especiales

El sistema implementa mecanismos robustos para manejar:

1. **Datos incorrectos**: Validación de fechas y propiedades de eventos.
2. **Errores de DOM**: Captura y manejo de errores en operaciones DOM.
3. **Desincronización de estado**: Mecanismos para detectar y corregir inconsistencias.
4. **Clics accidentales**: Bloqueo temporal de clics después de operaciones de arrastre.

```javascript
// Ejemplo de manejo de casos especiales
try {
  // Verificar que el evento tenga las propiedades necesarias
  if (!event || !event.start || !event.end) {
    console.error('Error en handleDragStart: Evento sin propiedades start/end', event);
    return;
  }
  
  const startDate = new Date(event.start);
  const endDate = new Date(event.end);
  
  // Verificar que las fechas son válidas
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    console.error('Error en handleDragStart: Fechas inválidas en el evento', event);
    return;
  }
  
  // Continuar con la operación normal...
  
} catch (error) {
  console.error('Error al iniciar arrastre:', error);
  // Limpieza y recuperación...
}
```

## Rendimiento

### Optimizaciones Implementadas

1. **Throttling**: Limitación de la frecuencia de actualización visual durante arrastre.
2. **Reutilización de referencias**: Uso de useRef para evitar recrear objetos.
3. **Cálculos diferidos**: Postergación de cálculos costosos hasta ser necesarios.
4. **CSS para animaciones**: Uso de transformaciones CSS en lugar de manipulación de DOM.

```javascript
// Ejemplo de throttling
const throttledUpdate = useCallback(
  throttle((deltaX, deltaY) => {
    if (eventRef.current) {
      eventRef.current.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    }
  }, 16), // ~60fps
  []
);
```

### Medidas para Dispositivos de Bajo Rendimiento

1. **Detección de rendimiento**: Adaptación según capacidades del dispositivo.
2. **Reducción de efectos visuales**: Desactivación de efectos opcionales en dispositivos lentos.
3. **Batching de actualizaciones**: Agrupación de múltiples actualizaciones visuales.

## Accesibilidad

### Soporte de Teclado

El sistema está diseñado para ser accesible mediante teclado:

1. **Atajos de teclado**: Para operaciones comunes (mover evento, cambiar duración).
2. **Focus visible**: Indicadores claros de foco para navegación con teclado.
3. **Roles ARIA**: Atributos adecuados para lectores de pantalla.

```javascript
// Ejemplo de manejo de teclado (a implementar en versiones futuras)
const handleKeyDown = (e) => {
  if (e.key === 'ArrowUp') {
    // Mover evento hacia arriba
    moveEventByMinutes(-30);
  } else if (e.key === 'ArrowDown') {
    // Mover evento hacia abajo
    moveEventByMinutes(30);
  }
};
```

### Información para Lectores de Pantalla

```html
<!-- Ejemplo de atributos ARIA -->
<div 
  role="button"
  aria-label="Redimensionar evento: Reunión de equipo"
  class="event-resize-handle"
  tabindex="0"
></div>
```

## Ejemplos de Casos de Uso

### Caso 1: Cambiar un Evento de Hora

```
1. Usuario hace mousedown en un evento
2. Arrastra el evento verticalmente a una nueva hora
3. El sistema aplica snap si está activado
4. Al soltar, se calcula la nueva hora de inicio/fin
5. Se actualiza el evento en el estado y almacenamiento
6. Se publica la actualización en el bus de eventos
7. Otros componentes suscriptos se actualizan
```

### Caso 2: Cambiar un Evento de Día

```
1. Usuario hace mousedown en un evento
2. Arrastra el evento horizontalmente a otro día
3. El sistema destaca visualmente el día destino
4. Al soltar, se calculan las nuevas fechas
5. Se actualiza el evento manteniendo las mismas horas
6. Se persiste el cambio y se notifica
```

### Caso 3: Modificar la Duración de un Evento

```
1. Usuario hace mousedown en el manipulador de redimensionamiento
2. Arrastra verticalmente para cambiar la duración
3. El sistema muestra una vista previa de la nueva duración
4. Al soltar, se calcula la nueva hora de fin
5. Se actualiza el evento, manteniendo la hora de inicio
6. Se persiste el cambio y se notifica
```

## Extensiones Futuras

El sistema está diseñado para ser extendido con:

1. **Soporte para pantalla táctil**: Gestos de toque en dispositivos móviles.
2. **Múltiples eventos simultáneos**: Selección y manipulación de varios eventos.
3. **Comportamientos personalizables**: Reglas configurables por el usuario.
4. **Snap a eventos existentes**: Alineación con otros eventos.
5. **Inteligencia de programación**: Sugerencias basadas en patrones del usuario.

## Conclusión

El Sistema de Interacciones Avanzadas de Atlas proporciona una experiencia de usuario intuitiva y potente para manipular eventos del calendario. Mediante la separación de la lógica en hooks personalizados y la aplicación de principios de diseño sólidos, el sistema ofrece:

1. **Intuitivo**: Interacciones naturales que reducen la curva de aprendizaje.
2. **Preciso**: Control fino sobre tiempos mediante el sistema de imán.
3. **Robusto**: Manejo adecuado de errores y casos especiales.
4. **Consistente**: Comportamiento uniforme entre diferentes vistas.
5. **Extensible**: Base sólida para futuras mejoras.

Este sistema representa un componente fundamental de la experiencia de usuario de Atlas, permitiendo a los usuarios gestionar eficientemente su tiempo mediante interacciones directas e intuitivas con los eventos del calendario.

**Nota sobre las fechas**: Los ejemplos y referencias a fechas en esta documentación son ilustrativos.