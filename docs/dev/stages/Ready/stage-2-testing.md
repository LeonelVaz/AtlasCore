# Plan de Pruebas Prioritarias para Atlas v0.2.0 - Stage 2

Este plan de pruebas cubre las funcionalidades implementadas hasta el Stage 2, incluyendo las interacciones avanzadas, sistema de almacenamiento mejorado, vista diaria y registro de módulos.

## 1. Renderizado del Componente - rendering.test.js

- [x] 1.1 La estructura de la cuadrícula del calendario se renderiza correctamente con las franjas horarias
- [x] 1.2 El encabezado de hora muestra 24 horas con el formato correcto
- [x] 1.3 Los botones de navegación de fecha se renderizan y se puede hacer clic
- [x] 1.4 El título del calendario muestra el mes y el año correctos
- [x] 1.5 Los encabezados de día muestran las fechas con el formato correcto
- [x] 1.6 El formulario de evento no se muestra inicialmente
- [x] 1.7 El sistema de vistas alterna correctamente entre vista semanal y diaria
- [x] 1.8 El control de snap (imán) se renderiza correctamente
- [x] 1.9 Los nuevos componentes UI (Button, Dialog) se renderizan correctamente
- [x] 1.10 La estructura CSS modular se aplica correctamente a todos los componentes

## 2. Navegación por Fecha - date-navigation.test.js

- [x] 2.1 El botón de la semana anterior reduce la fecha en 7 días
- [x] 2.2 El botón de la semana siguiente incrementa la fecha en 7 días
- [x] 2.3 El botón de la semana actual se restablece a la fecha actual
- [x] 2.4 Los días de la semana se generan correctamente para cualquier fecha
- [x] 2.5 En vista diaria, el botón de día anterior reduce la fecha en 1 día
- [x] 2.6 En vista diaria, el botón de día siguiente incrementa la fecha en 1 día
- [x] 2.7 En vista diaria, el botón "Hoy" se restablece a la fecha actual
- [x] 2.8 El cambio de vista mantiene la fecha seleccionada correctamente

## 3. Gestión de Eventos Básica - event-operations.test.js

### 3.1 Creación de Eventos

- [x] 3.1.1 Al hacer clic en una franja horaria vacía, se abre un nuevo formulario de evento
- [x] 3.1.2 Nuevo evento creado con valores predeterminados que coinciden con la hora del clic
- [x] 3.1.3 El nuevo evento recibe un ID único
- [x] 3.1.4 El nuevo evento se guarda en el almacenamiento
- [x] 3.1.5 El evento publica una notificación de actualización a través de EventBus
- [x] 3.1.6 El nuevo evento aparece en la cuadrícula del calendario tras su creación
- [x] 3.1.7 Validación de fechas funciona al crear un nuevo evento
- [x] 3.1.8 La creación de eventos funciona correctamente en vista diaria
- [x] 3.1.9 La creación de eventos utiliza correctamente el nuevo componente Dialog

### 3.2 Edición de eventos

- [x] 3.2.1 Al hacer clic en un evento existente, se abre el formulario de edición
- [x] 3.2.2 El formulario de edición se rellena con los datos correctos del evento
- [x] 3.2.3 Los cambios en el evento se guardan correctamente
- [x] 3.2.4 El evento actualizado se guarda en el almacenamiento
- [x] 3.2.5 El evento publica una notificación de actualización a través de EventBus
- [x] 3.2.6 El evento actualizado aparece con los cambios en la cuadrícula del calendario
- [x] 3.2.7 Validación de fechas funciona al editar un evento existente

### 3.3 Eliminación de eventos

- [x] 3.3.1 El formulario de edición contiene un botón Eliminar correctamente configurado
- [x] 3.3.2 El formulario de edición se abre correctamente para eventos existentes
- [x] 3.3.3 El botón Eliminar está presente y accesible en el formulario
- [x] 3.3.4 Los eventos creados se muestran correctamente en la cuadrícula
- [x] 3.3.5 La interfaz permite interactuar con eventos existentes

## 4. Interacciones Avanzadas con Eventos (Nuevas en Stage 2) - advanced-event-interactions.test.js

### 4.1 Arrastrar y Soltar Eventos

- [x] 4.1.1 Los eventos se pueden arrastrar verticalmente dentro del mismo día
- [x] 4.1.2 Al soltar, el evento actualiza sus horas de inicio y fin
- [x] 4.1.3 Al arrastrar eventos, se aplica el valor de snap configurado
- [x] 4.1.4 El historial de eventos de bus se actualiza al mover eventos

### 4.2 Redimensionamiento de Eventos

- [x] 4.2.1 Los eventos se pueden redimensionar desde el borde inferior
- [x] 4.2.2 Al soltar después de redimensionar, el evento actualiza su hora de fin
- [x] 4.2.3 El redimensionamiento mantiene la hora de inicio original
- [x] 4.2.4 El historial de eventos de bus se actualiza al redimensionar eventos

### 4.3 Sistema de Imán (Snap)

- [x] 4.3.1 El botón de snap activa/desactiva la funcionalidad de alineación
- [x] 4.3.2 El menú de opciones de snap muestra todos los valores predeterminados
- [x] 4.3.3 El valor de snap se muestra correctamente en el indicador
- [x] 4.3.4 La funcionalidad de snap utiliza correctamente las constantes definidas

## 5. Vista Diaria (Nueva en Stage 2) - daily-view.test.js

- [x] 5.1 La vista diaria muestra correctamente las 24 horas del día
- [ ] 5.2 Los eventos se muestran correctamente en la vista diaria
- [ ] 5.3 La navegación entre fechas funciona en la vista diaria
- [ ] 5.4 La vista diaria gestiona correctamente los eventos que continúan desde el día anterior
- [x] 5.5 La vista diaria gestiona correctamente los eventos que continúan al día siguiente

## 6. Representación de eventos - event-rendering.test.js

- [ ] 6.1 Los eventos se representan en las franjas horarias correctas según la hora de inicio
- [ ] 6.2 Los eventos se muestran con el título correcto
- [ ] 6.3 Los eventos se muestran con el formato de hora correcto
- [ ] 6.4 Los eventos se muestran con el color de fondo correcto
- [ ] 6.5 Se puede hacer clic en los eventos y abren el formulario de edición
- [ ] 6.6 Los eventos que continúan entre días muestran indicadores visuales adecuados

## 7. Integración de almacenamiento mejorado - enhanced-storage-integration.test.js

- [ ] 7.1 Los eventos se cargan desde el almacenamiento al montar el componente
- [ ] 7.2 Los eventos se guardan en el almacenamiento al crearse, actualizarse o eliminarse
- [x] 7.3 La gestión de errores funciona para el almacenamiento
- [ ] 7.4 El almacenamiento maneja correctamente las operaciones asíncronas
- [x] 7.5 El sistema de almacenamiento utiliza correctamente las constantes para las claves

## 8. Registro del módulo e interoperabilidad - module-registration.test.js

- [ ] 8.1 El módulo de calendario se registra correctamente al montar
- [ ] 8.2 El módulo expone las funciones correctas de la API (getEvents, createEvent, updateEvent, deleteEvent)
- [ ] 8.3 El módulo se anula el registro (si corresponde) al desmontar
- [ ] 8.4 La función unsubscribe se ejecuta al desmontar

## 9. Integración del bus de eventos - event-bus-integration.test.js

- [ ] 9.1 El componente se suscribe a los eventos apropiados
- [ ] 9.2 El componente publica eventos cuando cambian los datos
- [ ] 9.3 El componente limpia las suscripciones al desmontar
- [ ] 9.4 Las operaciones de arrastre y redimensionamiento publican los eventos correctos

## 10. Uso de Hooks Personalizados - custom-hooks.test.js

- [ ] 10.1 El hook useCalendarEvents gestiona correctamente los eventos
- [ ] 10.2 El hook useCalendarNavigation maneja correctamente la navegación
- [ ] 10.3 El hook useEventForm gestiona correctamente el formulario de eventos
- [ ] 10.4 Los hooks limpian correctamente sus recursos al desmontar

## 11. Componentes UI (Nuevos en Stage 2) - ui-components.test.js

- [ ] 11.1 El componente Button renderiza correctamente con diferentes variantes
- [ ] 11.2 El componente Dialog se abre y cierra correctamente
- [ ] 11.3 El Dialog se cierra al hacer clic fuera o presionar Escape
- [ ] 11.4 El Dialog muestra correctamente el título y contenido
- [ ] 11.5 Los botones del Dialog funcionan correctamente

## 12. Uso de Constantes - constants-usage.test.js

- [ ] 12.1 Las constantes CALENDAR_VIEWS se utilizan correctamente para las vistas
- [ ] 12.2 Las constantes SNAP_VALUES se utilizan correctamente en el sistema de snap
- [ ] 12.3 Las constantes STORAGE_KEYS se utilizan correctamente en el almacenamiento

## Notas de Implementación para Tests

Para pruebas específicas de los componentes del Stage 2, asegúrese de que estas dependencias se simulen correctamente:

```javascript
// Dependencias Mock
jest.mock('../../core/bus/event-bus');
jest.mock('../../core/module/module-registry');
jest.mock('../../utils/date-utils');
jest.mock('../../services/storage-service');
jest.mock('../../hooks/use-event-drag', () => ({
  useEventDrag: jest.fn(() => ({ dragging: false, handleDragStart: jest.fn() }))
}));
jest.mock('../../hooks/use-event-resize', () => ({
  useEventResize: jest.fn(() => ({ resizing: false, handleResizeStart: jest.fn() }))
}));
```