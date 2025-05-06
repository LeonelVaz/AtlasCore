# Estándares de Codificación para Atlas

## Introducción

Este documento define los estándares de codificación para el proyecto Atlas. Seguir estas directrices asegura consistencia, mantenibilidad y calidad en todo el código base. Todos los desarrolladores que contribuyen al proyecto, ya sea en el núcleo o en plugins, deben adherirse a estos estándares.

## Índice

1. [Principios Generales](#principios-generales)
2. [Convenciones de Nomenclatura](#convenciones-de-nomenclatura)
3. [Estructura de Archivos y Organización](#estructura-de-archivos-y-organización)
4. [Estándares JavaScript/React](#estándares-javascriptreact)
5. [Estilos y CSS](#estilos-y-css)
6. [Documentación](#documentación)
7. [Pruebas](#pruebas)
8. [Control de Versiones](#control-de-versiones)
9. [Revisión de Código](#revisión-de-código)
10. [Rendimiento](#rendimiento)

## Principios Generales

### Legibilidad y Mantenibilidad

- Escribe código claro y autoexplicativo.
- Prioriza la legibilidad sobre la brevedad.
- Sigue el principio DRY (Don't Repeat Yourself).
- Mantén funciones y componentes pequeños y centrados en una sola responsabilidad.

### Consistencia

- Sigue las convenciones establecidas incluso si difieren de tus preferencias personales.
- Mantén coherencia con el código existente.
- Usa herramientas de formateo automático para mantener consistencia.

### Calidad

- Escribe pruebas para todo el código nuevo.
- Refactoriza código legacy cuando sea posible.
- Evita "código mágico" con comportamientos no obvios.
- No dejes código comentado en producción.

## Convenciones de Nomenclatura

### General

- Usa nombres descriptivos que expliquen el propósito.
- Evita abreviaturas excepto las universalmente conocidas (ej. `i` para índices).
- Mantén la coherencia con las convenciones de React y JavaScript.

### Archivos y Carpetas

- Nombres en kebab-case para archivos: `my-component.jsx`, `date-utils.js`.
- Nombres en kebab-case para carpetas: `calendar-views/`, `ui-components/`.
- Archivo principal de cada módulo/plugin nombrado `index.js`.
- Archivos de prueba con sufijo `.test.js` o `.spec.js`.

### Variables y Funciones

- camelCase para variables y funciones: `eventData`, `calculatePosition()`.
- Funciones de manejo de eventos con prefijo "handle": `handleClick()`, `handleSubmit()`.
- Booleanos con prefijo "is", "has" o similar: `isActive`, `hasPermission`.

### Componentes React

- PascalCase para componentes: `EventItem`, `CalendarView`.
- Archivos de componentes con extensión `.jsx`.
- Nombre de archivo igual al nombre del componente.

### Constantes

- UPPER_SNAKE_CASE para constantes globales: `DEFAULT_THEME`, `API_ENDPOINT`.
- Grupos de constantes relacionadas en objetos con PascalCase:

```javascript
export const EventTypes = {
  CREATED: 'event_created',
  UPDATED: 'event_updated',
  DELETED: 'event_deleted'
};
```

### CSS/Clases

- kebab-case para clases CSS: `.event-item`, `.time-slot`.
- BEM (Block Element Modifier) para estructura de clases:
  - Bloque: `.calendar`
  - Elemento: `.calendar__event`
  - Modificador: `.calendar__event--highlighted`

## Estructura de Archivos y Organización

### Estructura General

```
src/
├── components/          # Componentes reutilizables
├── contexts/            # Contextos de React
├── hooks/               # Hooks personalizados
├── utils/               # Funciones de utilidad
├── services/            # Servicios de aplicación
├── styles/              # Estilos globales y temas
└── plugins/             # Plugins del sistema
```

### Estructura de Componentes

- Un componente por archivo (excepto componentes muy pequeños y estrechamente relacionados).
- Estructura de carpeta para componentes complejos:

```
ComponentName/
├── index.js             # Exporta el componente como default
├── ComponentName.jsx    # Implementación principal
├── ComponentName.css    # Estilos específicos del componente
├── SubComponent.jsx     # Subcomponentes (si son necesarios)
└── ComponentName.test.js # Pruebas del componente
```

### Importaciones

- Agrupar importaciones en el siguiente orden:
  1. Librerías externas (React, etc.)
  2. Componentes/hooks/utilidades internos
  3. Estilos y recursos
- Separar grupos con línea en blanco:

```javascript
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { useCalendarEvents } from '../../hooks/use-calendar-events';
import Button from '../ui/button';
import { formatDate } from '../../utils/date-utils';

import './component-name.css';
```

## Estándares JavaScript/React

### Sintaxis Moderna

- Usar ECMAScript moderno (ES6+).
- Preferir `const` sobre `let`, y evitar `var`.
- Usar desestructuración para props y estados.
- Usar operador spread con moderación.
- Preferir funciones flecha para funciones anónimas.

### Componentes

- Usar componentes funcionales con hooks en lugar de componentes de clase.
- Extraer lógica compleja a custom hooks.
- Validar props con PropTypes o TypeScript.
- Proporcionar valores predeterminados para props opcionales.

```javascript
import React from 'react';
import PropTypes from 'prop-types';

function EventItem({ title, startTime, endTime, color = '#2D4B94' }) {
  // Implementación
  
  return (
    <div 
      className="event-item"
      style={{ backgroundColor: color }}
    >
      <h3>{title}</h3>
      <time>{formatTimeRange(startTime, endTime)}</time>
    </div>
  );
}

EventItem.propTypes = {
  title: PropTypes.string.isRequired,
  startTime: PropTypes.instanceOf(Date).isRequired,
  endTime: PropTypes.instanceOf(Date).isRequired,
  color: PropTypes.string
};

export default EventItem;
```

### Hooks

- Seguir las reglas de hooks de React.
- Nombrar hooks personalizados con prefijo `use`.
- Mantener hooks centrados en una funcionalidad específica.
- Evitar anidación excesiva de hooks.

```javascript
function useEventDrag(initialPosition) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  
  // Lógica de arrastre...
  
  return { position, isDragging, startDrag, endDrag };
}
```

### Estado y Efectos

- Mantener el estado lo más simple posible.
- Dividir estados complejos en piezas manejables.
- Limitar cambios de estado en efectos.
- Siempre proporcionar array de dependencias completo en `useEffect`.
- Limpiar recursos en efectos cuando sea necesario:

```javascript
useEffect(() => {
  const subscription = eventBus.subscribe('event.updated', handleUpdate);
  
  // Función de limpieza
  return () => {
    subscription.unsubscribe();
  };
}, [eventId]); // Array de dependencias
```

### Manejo de Errores

- Usar bloques try/catch para operaciones propensas a errores.
- Implementar ErrorBoundary para capturar errores en componentes.
- Proporcionar estados de error y mensajes de usuario amigables.
- Registrar errores con información de contexto.

## Estilos y CSS

### Organización

- Preferir CSS modular o CSS-in-JS para estilos de componentes.
- Mantener estilos globales al mínimo.
- Utilizar sistema de variables CSS para temas.

### Variables CSS

- Agrupar variables por categoría:

```css
:root {
  /* Colores */
  --color-primary: #2D4B94;
  --color-secondary: #26A69A;
  --color-background: #FFFFFF;
  --color-text: #333333;
  
  /* Espaciado */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  
  /* Tipografía */
  --font-family-primary: 'Montserrat', sans-serif;
  --font-family-secondary: 'Inter', sans-serif;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-md: 16px;
  --font-size-lg: 20px;
}

/* Tema oscuro */
[data-theme="dark"] {
  --color-background: #141B2D;
  --color-text: #FFFFFF;
  /* Otras variables del tema oscuro */
}
```

### Responsive Design

- Diseñar mobile-first cuando sea posible.
- Usar media queries con variables para breakpoints:

```css
:root {
  --breakpoint-sm: 576px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 992px;
  --breakpoint-xl: 1200px;
}

.component {
  /* Estilos base (móvil) */
}

@media (min-width: var(--breakpoint-md)) {
  .component {
    /* Estilos para tablet y superiores */
  }
}

@media (min-width: var(--breakpoint-lg)) {
  .component {
    /* Estilos para desktop */
  }
}
```

## Documentación

### Comentarios en el Código

- Documentar intenciones, no implementaciones obvias.
- Comentar código complejo o no intuitivo.
- Usar formato JSDoc para funciones y componentes públicos:

```javascript
/**
 * Convierte un evento del calendario en una tarea.
 * 
 * @param {string} eventId - ID del evento a convertir
 * @param {Object} [options] - Opciones de conversión
 * @param {boolean} [options.preserveDescription=true] - Mantener descripción original
 * @param {string} [options.defaultStatus='pending'] - Estado predeterminado de la tarea
 * @returns {Object} La tarea creada
 * @throws {Error} Si el evento no existe
 */
function convertEventToTask(eventId, options = {}) {
  // Implementación...
}
```

### README y Documentación de Módulos

- Cada plugin/módulo debe tener un README.md con:
  - Descripción breve
  - Funcionalidades principales
  - Instalación/Uso
  - Ejemplos de código
  - API pública
  - Eventos publicados/escuchados

## Pruebas

### Tipos de Pruebas

- **Pruebas Unitarias**: Para funciones y componentes individuales.
- **Pruebas de Integración**: Para interacciones entre módulos.
- **Pruebas E2E**: Para flujos de usuario completos.

### Pruebas de Componentes

- Probar al menos:
  - Renderizado básico
  - Interacciones de usuario (clicks, inputs)
  - Estados diferentes (cargando, error, vacío)
  - Props e interacciones con callback

```javascript
// Ejemplo con Jest y React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import EventForm from './EventForm';

describe('EventForm', () => {
  test('llama onSubmit con datos correctos al enviar formulario', () => {
    const mockSubmit = jest.fn();
    render(<EventForm onSubmit={mockSubmit} />);
    
    // Rellenar formulario
    fireEvent.change(screen.getByLabelText(/título/i), {
      target: { value: 'Reunión de equipo' }
    });
    
    // Enviar formulario
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    
    // Verificar que onSubmit se llamó con los datos correctos
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Reunión de equipo'
      })
    );
  });
});
```

### Cobertura de Pruebas

- Objetivo: 80% de cobertura para código nuevo.
- Enfocar pruebas en lógica de negocio crítica.
- No obsesionarse con el porcentaje de cobertura en detrimento de pruebas útiles.

## Control de Versiones

### Convenciones de Commits

- Usar formato de Conventional Commits:
  - `feat`: Nueva característica
  - `fix`: Corrección de errores
  - `docs`: Documentación
  - `style`: Cambios de formato
  - `refactor`: Refactorización sin cambio de comportamiento
  - `test`: Añadir o corregir pruebas
  - `chore`: Tareas de mantenimiento

Ejemplo:
```
feat(calendar): añadir función de arrastrar y soltar para eventos

Implementa la funcionalidad para mover eventos arrastrándolos a
diferentes franjas horarias. Incluye:
- Sistema de arrastre con drag handlers
- Algoritmo de snap para alineación automática
- Animaciones visuales durante el arrastre

Closes #123
```

### Branches

- `main`: Rama principal, siempre en estado estable.
- `develop`: Rama de desarrollo, integración de características.
- `feature/nombre`: Ramas de características.
- `fix/nombre`: Ramas para correcciones.
- `release/X.Y.Z`: Ramas para preparación de releases.

### Pull Requests

- Mantener PRs enfocados en un solo cambio o característica.
- Incluir descripción clara de los cambios y su propósito.
- Referenciar issues relacionados.
- Asegurar que todas las pruebas pasan.
- Solicitar revisión de al menos un desarrollador.

## Revisión de Código

### Criterios de Revisión

- Adherencia a estos estándares de codificación.
- Corrección funcional.
- Mantenibilidad y legibilidad.
- Seguridad y manejo de errores.
- Rendimiento y optimización.

### Proceso

1. Revisar el código en un plazo máximo de 24 horas laborables.
2. Proporcionar feedback constructivo y específico.
3. Destacar aspectos positivos, no solo problemas.
4. Centrarse en el código, no en el desarrollador.
5. Usar preguntas para clarificar intenciones en lugar de declaraciones.

## Rendimiento

### Prácticas Recomendadas

- Usar React.memo() para componentes que renderizan frecuentemente.
- Implementar virtualización para listas largas.
- Optimizar re-renderizados con useMemo() y useCallback().
- Utilizar código diferido (lazy loading) para componentes grandes.
- Optimizar imágenes y recursos estáticos.

```javascript
// Ejemplo de optimización con hooks
function EventList({ events }) {
  // Memoizar función callback
  const handleEventClick = useCallback((eventId) => {
    // Implementación...
  }, [/* dependencias */]);
  
  // Memoizar lista procesada
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => a.startTime - b.startTime);
  }, [events]);
  
  return (
    <div className="event-list">
      {sortedEvents.map(event => (
        <EventItem
          key={event.id}
          event={event}
          onClick={handleEventClick}
        />
      ))}
    </div>
  );
}

// Memoizar componente para prevenir re-renderizados innecesarios
export default React.memo(EventList);
```

### Medición de Rendimiento

- Usar React DevTools Profiler para identificar problemas.
- Establecer métricas de rendimiento base y monitorear cambios.
- Implementar pruebas de rendimiento automatizadas para funcionalidades críticas.

## Conclusión

Estos estándares de codificación son un documento vivo que evolucionará con el proyecto. Las sugerencias de mejora son bienvenidas a través del proceso normal de revisión. El objetivo principal es mantener un código base coherente, mantenible y de alta calidad que permita a Atlas seguir creciendo de manera sostenible.

**Nota sobre las fechas**: Los ejemplos y referencias a fechas en esta documentación son ilustrativos.