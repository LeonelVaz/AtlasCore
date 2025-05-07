# Plan de Pruebas Integral para el Componente Principal del Calendario - Stage 1

Este plan ha sido ajustado para enfocarse exclusivamente en las funcionalidades implementadas en el Stage 1.

## 1. Renderizado del Componente

- 1.1 [x] La estructura de la cuadrícula del calendario se renderiza correctamente con las franjas horarias
- 1.2 [x] El encabezado de hora muestra 24 horas con el formato correcto
- 1.3 [x] Los botones de navegación de fecha se renderizan y se puede hacer clic
- 1.4 [x] El título del calendario muestra el mes y el año correctos
- 1.5 [x] Los encabezados de día muestran las fechas con el formato correcto
- 1.6 [x] El formulario de evento no se muestra inicialmente

## 2. Navegación por Fecha

- 2.1 [x] El botón de la semana anterior reduce la fecha en 7 días
- 2.2 [x] El botón de la semana siguiente incrementa la fecha en 7 días
- 2.3 [x] El botón de la semana actual se restablece a la fecha actual
- 2.4 [x] Los días de la semana se generan correctamente para cualquier fecha

## 3. Gestión de Eventos

### 3.1 Creación de Eventos

- [x] 3.1.1 Al hacer clic en una franja horaria vacía, se abre un nuevo formulario de evento
- [ ] 3.1.2 Nuevo evento creado con valores predeterminados que coinciden con la hora del clic
- [ ] 3.1.3 El nuevo evento recibe un ID único
- [ ] 3.1.4 El nuevo evento se guarda en el almacenamiento local
- [ ] 3.1.5 El evento publica una notificación de actualización a través de EventBus
- [ ] 3.1.6 El nuevo evento aparece en la cuadrícula del calendario tras su creación

### 3.2 Edición de eventos

- [ ] 3.2.1 Al hacer clic en un evento existente, se abre el formulario de edición
- [ ] 3.2.2 El formulario de edición se rellena con los datos correctos del evento
- [ ] 3.2.3 Los cambios en el evento se guardan correctamente
- [ ] 3.2.4 El evento actualizado se guarda en el almacenamiento local
- [ ] 3.2.5 El evento publica una notificación de actualización a través de EventBus
- [ ] 3.2.6 El evento actualizado aparece con los cambios en la cuadrícula del calendario

### 3.3 Eliminación de eventos

- [ ] 3.3.1 El botón Eliminar aparece en el formulario de edición
- [ ] 3.3.2 El evento se elimina del estado al eliminarse
- [ ] 3.3.3 El evento se elimina del almacenamiento local al eliminarse
- [ ] 3.3.4 La eliminación del evento publica una notificación de actualización
- [ ] 3.3.5 El evento eliminado ya no aparece en la cuadrícula del calendario

## 4. Formulario Manejo

- [ ] 4.1 El formulario muestra los campos correctos (título, inicio, fin, color)
- [ ] 4.2 La validación de campos funciona correctamente
- [ ] 4.3 Los cambios en el estado de actualización de los campos del formulario
- [ ] 4.4 El botón Cancelar cierra el formulario sin guardar
- [ ] 4.5 El formulario gestiona correctamente las entradas de fecha y hora
- [ ] 4.6 El selector de color actualiza el color del evento

## 5. Representación de eventos

- [ ] 5.1 Los eventos se representan en las franjas horarias correctas según la hora de inicio
- [ ] 5.2 Los eventos se muestran con el título correcto
- [ ] 5.3 Los eventos se muestran con el formato de hora correcto
- [ ] 5.4 Los eventos se muestran con el color de fondo correcto
- [ ] 5.5 Se puede hacer clic en los eventos y abren el formulario de edición
- [ ] 5.6 La función shouldShowEvent filtra los eventos correctamente

## 6. Integración de almacenamiento

- [ ] 6.1 Los eventos se cargan desde el almacenamiento local al montar el componente
- [ ] 6.2 Los eventos se guardan en el almacenamiento local al crearse, actualizarse o eliminarse
- [ ] 6.3 La gestión de errores funciona para el almacenamiento local
- [ ] 6.4 Las operaciones de almacenamiento publican los eventos apropiados

## 7. Registro del módulo

- [ ] 7.1 El módulo de calendario se registra correctamente al montar
- [ ] 7.2 El módulo expone las funciones correctas de la API (getEvents, createEvent, updateEvent, deleteEvent)
- [ ] 7.3 Las funciones de la API funcionan correctamente al ser llamadas externamente
- [ ] 7.4 El módulo se anula el registro (si corresponde) al desmontar

## 8. Integración del bus de eventos

- [ ] 8.1 El componente se suscribe a los eventos apropiados
- [ ] 8.2 El componente responde a las actualizaciones de eventos externos
- [ ] 8.3 El componente publica eventos cuando cambian los datos
- [ ] 8.4 El componente limpia las suscripciones al desmontar

## 9. Casos extremos relevantes para Stage 1

- [ ] 9.1 Gestiona eventos simultáneos en la misma franja horaria
- [ ] 9.2 Gestiona eventos en los límites del día (medianoche)
- [ ] 9.3 Gestiona datos de eventos no válidos
- [ ] 9.4 Gestiona correctamente el exceso de la cuota de almacenamiento local

## Notas de implementación simulada

Para pruebas específicas de calendar-main.jsx, asegúrese de que estas dependencias se simulen correctamente:
```javascript
// Dependencias Mock
jest.mock('../../../../src/core/bus/event-bus');
jest.mock('../../../../src/core/module/module-registry');
jest.mock('../../../../src/utils/date-utils');
```

## Test Helpers

Create isolated test helpers that allow direct testing of component internals:

```javascript
// Example helper to test shouldShowEvent function
const testShouldShowEvent = (component, event, day, hour) => {
    // Implementation that allows testing of private component function
};

// Example helper to simulate cell click at specific day/hour
const simulateCellClick = (component, day, hour) => {
    // Implementation that finds and clicks the right cell
};
```