# Plan de Pruebas Prioritarias para Atlas v0.2.0 - Stage 2

Este plan de pruebas cubre las funcionalidades implementadas hasta el Stage 2, incluyendo las interacciones avanzadas, sistema de almacenamiento mejorado, vista diaria y registro de módulos.

## 1. Renderizado del Componente

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

## 2. Navegación por Fecha

- [x] 2.1 El botón de la semana anterior reduce la fecha en 7 días
- [x] 2.2 El botón de la semana siguiente incrementa la fecha en 7 días
- [x] 2.3 El botón de la semana actual se restablece a la fecha actual
- [x] 2.4 Los días de la semana se generan correctamente para cualquier fecha
- [x] 2.5 En vista diaria, el botón de día anterior reduce la fecha en 1 día
- [x] 2.6 En vista diaria, el botón de día siguiente incrementa la fecha en 1 día
- [x] 2.7 En vista diaria, el botón "Hoy" se restablece a la fecha actual
- [x] 2.8 El cambio de vista mantiene la fecha seleccionada correctamente

## 3. Gestión de Eventos Básica

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

## 4. Interacciones Avanzadas con Eventos (Nuevas en Stage 2)

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