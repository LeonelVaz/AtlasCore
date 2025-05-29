# Sistema de Imán (Snap) de Atlas

## Visión General

El sistema de imán (snap) es una característica clave de Atlas que permite la alineación automática de eventos durante las operaciones de arrastrar y redimensionar. Este sistema mejora significativamente la experiencia del usuario al facilitar la creación y modificación de eventos con precisión temporal.

## Características Principales

- Alineación automática a intervalos de tiempo específicos
- Modos predefinidos con diferentes niveles de precisión
- Feedback visual durante operaciones de arrastre y redimensionamiento
- Personalización del nivel de precisión

## Valores de Snap Predefinidos

Atlas define cuatro niveles de precisión estándar:

| Nivel | Valor (minutos) | Descripción |
|-------|----------------|-------------|
| NONE | 0 | Sin alineación automática |
| PRECISE | 15 | Alineación a intervalos de 15 minutos |
| MEDIUM | 30 | Alineación a intervalos de 30 minutos |
| BASIC | 60 | Alineación a horas completas |

Estos valores están definidos como constantes en `src/core/config/constants.js`.

## Componentes del Sistema

### Control de Snap

El componente `SnapControl` proporciona una interfaz para activar/desactivar y ajustar el nivel de precisión:

```jsx
<SnapControl
  snapValue={snapValue}
  onSnapChange={setSnapValue}
/>
```

Este control muestra:
- Un botón de activación/desactivación
- Un indicador del valor actual
- Un menú desplegable con opciones predefinidas y personalizadas

### Integración con Arrastre de Eventos

El sistema de snap se integra con el hook `useEventDrag` para aplicar alineación durante las operaciones de arrastre:

```javascript
// Ejemplo simplificado de la integración
if (snapValue > 0) {
  // Convertir snapValue (minutos) a pixeles
  const snapPixels = snapValue * (gridSize / 60);
  adjustedDeltaY = Math.round(deltaY / snapPixels) * snapPixels;
}
```

### Integración con Redimensionamiento

De manera similar, el hook `useEventResize` utiliza el valor de snap para alinear el borde inferior del evento durante el redimensionamiento.

## Indicadores Visuales

El sistema proporciona feedback visual durante las operaciones:

1. **Rejilla Visual**: Destacado visual de las líneas de tiempo que corresponden a los intervalos de snap
2. **Animación de Ajuste**: Movimiento suave cuando un evento se ajusta a un intervalo
3. **Clase CSS**: Se añade `.snap-active` al cuerpo del documento cuando el snap está activo

## Implementación Técnica

### Función Principal de Snap

La función `snapTimeToInterval` en `src/utils/time-utils.js` maneja la lógica central:

```javascript
export function snapTimeToInterval(time, snapMinutes) {
  // Sin snap, devolver tiempo original
  if (!snapMinutes || snapMinutes <= 0) {
    return time;
  }
  
  // Calcular minutos actuales
  const minutes = time.getMinutes();
  const remainder = minutes % snapMinutes;
  
  // Si ya está alineado, no hacer nada
  if (remainder === 0) {
    return time;
  }
  
  // Calcular nuevo valor redondeando al intervalo más cercano
  const roundedMinutes = remainder < snapMinutes / 2 
    ? minutes - remainder 
    : minutes + (snapMinutes - remainder);
  
  // Crear una nueva fecha con los minutos ajustados
  const result = new Date(time);
  result.setMinutes(roundedMinutes);
  result.setSeconds(0);
  result.setMilliseconds(0);
  
  return result;
}
```

### Cálculo Preciso de Cambios de Tiempo

Durante operaciones visuales, se utiliza `calculatePreciseTimeChange` para convertir píxeles a minutos respetando el valor de snap:

```javascript
export function calculatePreciseTimeChange(deltaY, isResize, gridSize, snapValue) {
  // Con snap activado
  if (snapValue > 0) {
    const pixelsPerMinute = gridSize / 60;
    const snapPixels = snapValue * pixelsPerMinute;
    const snapIntervals = Math.round(deltaY / snapPixels);
    return snapIntervals * snapValue;  // Retorna minutos exactos
  }
  
  // Sin snap, cálculo normal
  const pixelsPerMinute = gridSize / 60;
  return deltaY / pixelsPerMinute;
}
```

## Casos de Uso Típicos

1. **Creación de Eventos**: Alineación a intervalos lógicos de tiempo
2. **Reubicación de Eventos**: Mantener horas de inicio/fin organizadas
3. **Reuniones Estándar**: Facilitar la creación de eventos de 30 o 60 minutos
4. **Horarios Precisos**: Permitir ajuste fino para necesidades específicas

## Mejores Prácticas

1. **Configuración Predeterminada**: Comenzar con BASIC (60 minutos) para usuarios nuevos
2. **Indicación Clara**: Mostrar siempre el valor de snap activo
3. **Accesibilidad**: Proporcionar alternativas de teclado para todas las funciones
4. **Rendimiento**: Optimizar cálculos para operaciones fluidas

## Consideraciones para el Futuro

- Valores de snap personalizados persistentes por usuario
- Snap contextual basado en tipo de evento o franja horaria
- Alineación a eventos cercanos (no solo a intervalos fijos)
- Teclas modificadoras para activar/desactivar snap temporalmente

Este sistema de imán (snap) es una característica distintiva de Atlas que mejora significativamente la precisión y eficiencia en la gestión del calendario.