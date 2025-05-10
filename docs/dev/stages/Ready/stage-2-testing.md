# Plan de Pruebas Integral para el Componente del Calendario - Stage 2

Este plan de pruebas cubre las funcionalidades implementadas hasta el Stage 2, incluyendo las interacciones avanzadas, sistema de almacenamiento mejorado, vista diaria y registro de módulos.

## 1. Renderizado del Componente

- [ ] 1.1 La estructura de la cuadrícula del calendario se renderiza correctamente con las franjas horarias
- [ ] 1.2 El encabezado de hora muestra 24 horas con el formato correcto
- [ ] 1.3 Los botones de navegación de fecha se renderizan y se puede hacer clic
- [ ] 1.4 El título del calendario muestra el mes y el año correctos
- [ ] 1.5 Los encabezados de día muestran las fechas con el formato correcto
- [ ] 1.6 El formulario de evento no se muestra inicialmente
- [ ] 1.7 El sistema de vistas alterna correctamente entre vista semanal y diaria
- [ ] 1.8 El control de snap (imán) se renderiza correctamente
- [ ] 1.9 Los nuevos componentes UI (Button, Dialog) se renderizan correctamente
- [ ] 1.10 La estructura CSS modular se aplica correctamente a todos los componentes

## 2. Navegación por Fecha

- [ ] 2.1 El botón de la semana anterior reduce la fecha en 7 días
- [ ] 2.2 El botón de la semana siguiente incrementa la fecha en 7 días
- [ ] 2.3 El botón de la semana actual se restablece a la fecha actual
- [ ] 2.4 Los días de la semana se generan correctamente para cualquier fecha
- [ ] 2.5 En vista diaria, el botón de día anterior reduce la fecha en 1 día
- [ ] 2.6 En vista diaria, el botón de día siguiente incrementa la fecha en 1 día
- [ ] 2.7 En vista diaria, el botón "Hoy" se restablece a la fecha actual
- [ ] 2.8 El cambio de vista mantiene la fecha seleccionada correctamente

## 3. Gestión de Eventos Básica

### 3.1 Creación de Eventos

- [ ] 3.1.1 Al hacer clic en una franja horaria vacía, se abre un nuevo formulario de evento
- [ ] 3.1.2 Nuevo evento creado con valores predeterminados que coinciden con la hora del clic
- [ ] 3.1.3 El nuevo evento recibe un ID único
- [ ] 3.1.4 El nuevo evento se guarda en el almacenamiento
- [ ] 3.1.5 El evento publica una notificación de actualización a través de EventBus
- [ ] 3.1.6 El nuevo evento aparece en la cuadrícula del calendario tras su creación
- [ ] 3.1.7 Validación de fechas funciona al crear un nuevo evento
- [ ] 3.1.8 La creación de eventos funciona correctamente en vista diaria
- [ ] 3.1.9 La creación de eventos utiliza correctamente el nuevo componente Dialog

### 3.2 Edición de eventos

- [ ] 3.2.1 Al hacer clic en un evento existente, se abre el formulario de edición
- [ ] 3.2.2 El formulario de edición se rellena con los datos correctos del evento
- [ ] 3.2.3 Los cambios en el evento se guardan correctamente
- [ ] 3.2.4 El evento actualizado se guarda en el almacenamiento
- [ ] 3.2.5 El evento publica una notificación de actualización a través de EventBus
- [ ] 3.2.6 El evento actualizado aparece con los cambios en la cuadrícula del calendario
- [ ] 3.2.7 Validación de fechas funciona al editar un evento existente

### 3.3 Eliminación de eventos

- [ ] 3.3.1 El botón Eliminar aparece en el formulario de edición
- [ ] 3.3.2 El evento se elimina del estado al eliminarse
- [ ] 3.3.3 El evento se elimina del almacenamiento al eliminarse
- [ ] 3.3.4 La eliminación del evento publica una notificación de actualización
- [ ] 3.3.5 El evento eliminado ya no aparece en la cuadrícula del calendario

## 4. Interacciones Avanzadas con Eventos (Nuevas en Stage 2)

### 4.1 Arrastrar y Soltar Eventos

- [ ] 4.1.1 Los eventos se pueden arrastrar verticalmente dentro del mismo día
- [ ] 4.1.2 Los eventos se pueden arrastrar horizontalmente entre diferentes días
- [ ] 4.1.3 Al arrastrar, se muestra una vista previa de la nueva posición
- [ ] 4.1.4 Al soltar, el evento actualiza sus horas de inicio y fin
- [ ] 4.1.5 Los eventos arrastrados respetan el tiempo mínimo configurable (ej. 15min)
- [ ] 4.1.6 Al arrastrar eventos, se aplica el valor de snap configurado
- [ ] 4.1.7 El arrastrar y soltar funciona correctamente en vista diaria
- [ ] 4.1.8 Al arrastrar, las celdas de destino se resaltan visualmente
- [ ] 4.1.9 El historial de eventos de bus se actualiza al mover eventos

### 4.2 Redimensionamiento de Eventos

- [ ] 4.2.1 Los eventos se pueden redimensionar desde el borde inferior
- [ ] 4.2.2 Al redimensionar, se muestra una vista previa del nuevo tamaño
- [ ] 4.2.3 Al soltar después de redimensionar, el evento actualiza su hora de fin
- [ ] 4.2.4 Los eventos redimensionados respetan el tiempo mínimo configurable
- [ ] 4.2.5 Al redimensionar eventos, se aplica el valor de snap configurado
- [ ] 4.2.6 El redimensionamiento funciona correctamente en vista diaria
- [ ] 4.2.7 El redimensionamiento mantiene la hora de inicio original
- [ ] 4.2.8 El historial de eventos de bus se actualiza al redimensionar eventos

### 4.3 Sistema de Imán (Snap)

- [ ] 4.3.1 El botón de snap activa/desactiva la funcionalidad de alineación
- [ ] 4.3.2 El menú de opciones de snap muestra todos los valores predeterminados
- [ ] 4.3.3 Cambiar el valor de snap afecta al comportamiento de arrastre/redimensionamiento
- [ ] 4.3.4 El valor "Personalizado" permite configurar un tiempo específico
- [ ] 4.3.5 El valor de snap se muestra correctamente en el indicador
- [ ] 4.3.6 El menú de opciones de snap se cierra al hacer clic fuera
- [ ] 4.3.7 La funcionalidad de snap utiliza correctamente las constantes definidas

## 5. Vista Diaria (Nueva en Stage 2)

- [ ] 5.1 La vista diaria muestra correctamente las 24 horas del día
- [ ] 5.2 Los eventos se muestran correctamente en la vista diaria
- [ ] 5.3 La navegación entre fechas funciona en la vista diaria
- [ ] 5.4 Los eventos que abarcan varios días se muestran correctamente
- [ ] 5.5 El redimensionamiento de eventos funciona en la vista diaria
- [ ] 5.6 El arrastre de eventos funciona en la vista diaria
- [ ] 5.7 La validación de eventos funciona correctamente en vista diaria
- [ ] 5.8 La vista diaria gestiona correctamente los eventos que continúan desde el día anterior
- [ ] 5.9 La vista diaria gestiona correctamente los eventos que continúan al día siguiente

## 6. Representación de eventos

- [ ] 6.1 Los eventos se representan en las franjas horarias correctas según la hora de inicio
- [ ] 6.2 Los eventos se muestran con el título correcto
- [ ] 6.3 Los eventos se muestran con el formato de hora correcto
- [ ] 6.4 Los eventos se muestran con el color de fondo correcto
- [ ] 6.5 Se puede hacer clic en los eventos y abren el formulario de edición
- [ ] 6.6 La función shouldShowEvent filtra los eventos correctamente
- [ ] 6.7 El componente maneja excepciones durante el renderizado de eventos
- [ ] 6.8 Maneja diferentes tipos de excepciones durante el renderizado
- [ ] 6.9 Los eventos que continúan entre días muestran indicadores visuales adecuados
- [ ] 6.10 La altura de los eventos es proporcional a su duración
- [ ] 6.11 Las interacciones con eventos (arrastre, redimensionamiento) tienen indicadores visuales claros

## 7. Integración de almacenamiento mejorado

- [ ] 7.1 Los eventos se cargan desde el almacenamiento al montar el componente
- [ ] 7.2 Los eventos se guardan en el almacenamiento al crearse, actualizarse o eliminarse
- [ ] 7.3 La gestión de errores funciona para el almacenamiento
- [ ] 7.4 Las operaciones de almacenamiento publican los eventos apropiados
- [ ] 7.5 Manejo de formatos JSON inválidos en localStorage
- [ ] 7.6 La abstracción del servicio de almacenamiento funciona con diferentes adaptadores
- [ ] 7.7 El almacenamiento maneja correctamente las operaciones asíncronas
- [ ] 7.8 La integración con Electron Store funciona correctamente (si aplica)
- [ ] 7.9 El sistema de almacenamiento utiliza correctamente las constantes para las claves

## 8. Registro del módulo e interoperabilidad

- [ ] 8.1 El módulo de calendario se registra correctamente al montar
- [ ] 8.2 El módulo expone las funciones correctas de la API (getEvents, createEvent, updateEvent, deleteEvent)
- [ ] 8.3 Las funciones de la API funcionan correctamente al ser llamadas externamente
- [ ] 8.4 El módulo se anula el registro (si corresponde) al desmontar
- [ ] 8.5 La función unsubscribe se ejecuta al desmontar
- [ ] 8.6 El sistema de registro de módulos utiliza correctamente la estructura window.__appModules
- [ ] 8.7 Las utilidades de interoperabilidad entre módulos funcionan correctamente
- [ ] 8.8 La conversión de datos entre formatos de diferentes módulos funciona correctamente
- [ ] 8.9 La verificación de conflictos entre módulos funciona correctamente

## 9. Integración del bus de eventos

- [ ] 9.1 El componente se suscribe a los eventos apropiados
- [ ] 9.2 El componente responde a las actualizaciones de eventos externos
- [ ] 9.3 El componente publica eventos cuando cambian los datos
- [ ] 9.4 El componente limpia las suscripciones al desmontar
- [ ] 9.5 El historial de eventos de bus se actualiza correctamente durante las interacciones avanzadas
- [ ] 9.6 Las operaciones de arrastre y redimensionamiento publican los eventos correctos
- [ ] 9.7 Los eventos del sistema de snap se publican correctamente

## 10. Uso de Hooks Personalizados

- [ ] 10.1 El hook useCalendarEvents gestiona correctamente los eventos
- [ ] 10.2 El hook useCalendarNavigation maneja correctamente la navegación
- [ ] 10.3 El hook useEventForm gestiona correctamente el formulario de eventos
- [ ] 10.4 El hook useEventDrag maneja correctamente el arrastre de eventos
- [ ] 10.5 El hook useEventResize maneja correctamente el redimensionamiento
- [ ] 10.6 El hook useTimeGrid gestiona correctamente la rejilla temporal
- [ ] 10.7 Los hooks limpian correctamente sus recursos al desmontar
- [ ] 10.8 Los hooks manejan correctamente los errores
- [ ] 10.9 Los hooks utilizan correctamente las constantes definidas

## 11. Componentes UI (Nuevos en Stage 2)

- [ ] 11.1 El componente Button renderiza correctamente con diferentes variantes
- [ ] 11.2 El componente Button gestiona correctamente los estados (active, disabled)
- [ ] 11.3 El componente Dialog se abre y cierra correctamente
- [ ] 11.4 El Dialog se cierra al hacer clic fuera o presionar Escape
- [ ] 11.5 El Dialog muestra correctamente el título y contenido
- [ ] 11.6 Los botones del Dialog funcionan correctamente
- [ ] 11.7 Los componentes UI utilizan correctamente la estructura CSS modular
- [ ] 11.8 Los componentes UI son accesibles (según requisitos básicos)

## 12. Casos extremos y gestión de errores

- [ ] 12.1 Gestiona eventos simultáneos en la misma franja horaria
- [ ] 12.2 Gestiona eventos en los límites del día (medianoche)
- [ ] 12.3 Gestiona datos de eventos no válidos
- [ ] 12.4 Gestiona correctamente el exceso de la cuota de almacenamiento
- [ ] 12.5 Gestiona objetos no array en localStorage
- [ ] 12.6 Maneja eventos con tipos de datos inválidos
- [ ] 12.7 Gestiona eventos que se superponen durante el arrastre
- [ ] 12.8 Gestiona intentos de arrastrar un evento fuera de los límites visibles
- [ ] 12.9 Maneja correctamente fallos en las operaciones de arrastre/redimensionamiento
- [ ] 12.10 Gestiona correctamente los errores en las operaciones de almacenamiento asíncronas
- [ ] 12.11 Maneja correctamente los cambios entre vistas con datos corruptos

## 13. Uso de Constantes

- [ ] 13.1 Las constantes CALENDAR_VIEWS se utilizan correctamente para las vistas
- [ ] 13.2 Las constantes SNAP_VALUES se utilizan correctamente en el sistema de snap
- [ ] 13.3 Las constantes STORAGE_KEYS se utilizan correctamente en el almacenamiento
- [ ] 13.4 Las constantes EVENT_OPERATIONS se utilizan correctamente en las operaciones de eventos
- [ ] 13.5 La aplicación utiliza constantes en lugar de valores literales para todos los valores clave

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