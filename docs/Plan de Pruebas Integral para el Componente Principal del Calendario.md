# Plan de Pruebas Integral para el Componente Principal del Calendario

## 1. Renderizado del Componente

- 1.1 [x] La estructura de la cuadrícula del calendario se renderiza correctamente con las franjas horarias

- 1.2 [x] El encabezado de hora muestra 24 horas con el formato correcto

- 1.3 [x] Los botones de navegación de fecha se renderizan y se puede hacer clic

- 1.4 [x] El título del calendario muestra el mes y el año correctos

- 1.5 [ ] Los encabezados de día muestran las fechas con el formato correcto

- 1.6 [ ] El formulario de evento no se muestra inicialmente

## 2. Navegación por Fecha

- [ ] El botón de la semana anterior reduce la fecha en 7 días

- [ ] El botón de la semana siguiente incrementa la fecha en 7 días

- [ ] El botón de la semana actual se restablece a la fecha actual

- [ ] Los días de la semana se generan correctamente para cualquier fecha

- [ ] El encabezado de mes/año se actualiza al navegar entre meses

## 3. Gestión de Eventos

### 3.1 Creación de Eventos

- [ ] Al hacer clic en una franja horaria vacía, se abre un nuevo formulario de evento

- [ ] Nuevo evento creado con valores predeterminados Valores que coinciden con la hora del clic

- [ ] El nuevo evento recibe un ID único

- [ ] El nuevo evento se guarda en el almacenamiento local

- [ ] El evento publica una notificación de actualización a través de EventBus

- [ ] El nuevo evento aparece en la cuadrícula del calendario tras su creación

### 3.2 Edición de eventos

- [ ] Al hacer clic en un evento existente, se abre el formulario de edición

- [ ] El formulario de edición se rellena con los datos correctos del evento

- [ ] Los cambios en el evento se guardan correctamente

- [ ] El evento actualizado se guarda en el almacenamiento local

- [ ] El evento publica una notificación de actualización a través de EventBus

- [ ] El evento actualizado aparece con los cambios en la cuadrícula del calendario

### 3.3 Eliminación de eventos

- [ ] El botón Eliminar aparece en el formulario de edición

- [ ] El evento se elimina del estado al eliminarse

- [ ] El evento se elimina del almacenamiento local al eliminarse

- [ ] La eliminación del evento publica una notificación de actualización

- [ ] El evento eliminado ya no aparece en la cuadrícula del calendario

## 4. Formulario Manejo

- [ ] El formulario muestra los campos correctos (título, inicio, fin, color)

- [ ] La validación de campos funciona correctamente

- [ ] Los cambios en el estado de actualización de los campos del formulario

- [ ] El botón Cancelar cierra el formulario sin guardar

- [ ] El formulario gestiona correctamente las entradas de fecha y hora

- [ ] El selector de color actualiza el color del evento

## 5. Representación de eventos

- [ ] Los eventos se representan en las franjas horarias correctas según la hora de inicio

- [ ] Los eventos se muestran con el título correcto

- [ ] Los eventos se muestran con el formato de hora correcto

- [ ] Los eventos se muestran con el color de fondo correcto

- [ ] Se puede hacer clic en los eventos y abren el formulario de edición

- [ ] La función shouldShowEvent filtra los eventos correctamente

## 6. Integración de almacenamiento

- [ ] Los eventos se cargan desde el almacenamiento local al montar el componente

- [ ] Los eventos se guardan en el almacenamiento local al crearse, actualizarse o eliminarse

- [ ] La gestión de errores funciona para el almacenamiento local Errores

- [ ] Las operaciones de almacenamiento publican los eventos apropiados

## 7. Registro del módulo

- [ ] El módulo de calendario se registra correctamente al montar

- [ ] El módulo expone las funciones correctas de la API (getEvents, createEvent, updateEvent, deleteEvent)

- [ ] Las funciones de la API funcionan correctamente al ser llamadas externamente

- [ ] El módulo se anula el registro (si corresponde) al desmontar

## 8. Integración del bus de eventos

- [ ] El componente se suscribe a los eventos apropiados

- [ ] El componente responde a las actualizaciones de eventos externos

- [ ] El componente publica eventos cuando cambian los datos

- [ ] El componente limpia las suscripciones al desmontar

## 9. Casos extremos

- [ ] Gestiona eventos que abarcan varios días

- [ ] Gestiona eventos simultáneos en la misma franja horaria

- [ ] Gestiona eventos en los límites del día (medianoche)

- [ ] Gestiona los cambios de horario de verano correctamente

- [ ] Gestiona los años bisiestos Correctamente

- [ ] Gestiona datos de eventos no válidos

- [ ] Gestiona correctamente el exceso de la cuota de almacenamiento local

## 10. Accesibilidad

- [ ] El calendario es navegable mediante teclado

- [ ] Los controles de formulario tienen etiquetas apropiadas

- [ ] El contraste de color cumple con los estándares de accesibilidad

- [ ] Los lectores de pantalla pueden interpretar la estructura del calendario

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