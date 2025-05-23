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
- [x] 3.1.2 Nuevo evento creado con valores predeterminados que coinciden con la hora del clic
- [x] 3.1.3 El nuevo evento recibe un ID único
- [x] 3.1.4 El nuevo evento se guarda en el almacenamiento local
- [x] 3.1.5 El evento publica una notificación de actualización a través de EventBus
- [x] 3.1.6 El nuevo evento aparece en la cuadrícula del calendario tras su creación
- [x] 3.1.7 Validación de fechas funciona al crear un nuevo evento

### 3.2 Edición de eventos

- [x] 3.2.1 Al hacer clic en un evento existente, se abre el formulario de edición
- [x] 3.2.2 El formulario de edición se rellena con los datos correctos del evento
- [x] 3.2.3 Los cambios en el evento se guardan correctamente
- [x] 3.2.4 El evento actualizado se guarda en el almacenamiento local
- [x] 3.2.5 El evento publica una notificación de actualización a través de EventBus
- [x] 3.2.6 El evento actualizado aparece con los cambios en la cuadrícula del calendario
- [x] 3.2.7 Validación de fechas funciona al editar un evento existente

### 3.3 Eliminación de eventos

- [x] 3.3.1 El botón Eliminar aparece en el formulario de edición
- [x] 3.3.2 El evento se elimina del estado al eliminarse
- [x] 3.3.3 El evento se elimina del almacenamiento local al eliminarse
- [x] 3.3.4 La eliminación del evento publica una notificación de actualización
- [x] 3.3.5 El evento eliminado ya no aparece en la cuadrícula del calendario

## 4. Formulario Manejo

- [x] 4.1 El formulario muestra los campos correctos (título, inicio, fin, color)
- [x] 4.2 La validación de campos funciona correctamente
- [x] 4.3 Los cambios en el estado de actualización de los campos del formulario
- [x] 4.4 El botón Cancelar cierra el formulario sin guardar
- [x] 4.5 El formulario gestiona correctamente las entradas de fecha y hora
- [x] 4.6 El selector de color actualiza el color del evento
- [x] 4.7 El formulario impide guardar eventos con hora de fin anterior a hora de inicio
- [x] 4.8 El estado de error se limpia al cerrar el formulario

## 5. Representación de eventos

- [ ] 5.1 Los eventos se representan en las franjas horarias correctas según la hora de inicio
- [x] 5.2 Los eventos se muestran con el título correcto
- [x] 5.3 Los eventos se muestran con el formato de hora correcto
- [x] 5.4 Los eventos se muestran con el color de fondo correcto
- [x] 5.5 Se puede hacer clic en los eventos y abren el formulario de edición
- [x] 5.6 La función shouldShowEvent filtra los eventos correctamente
- [x] 5.7: El componente maneja excepciones durante el renderizado de eventos
- [x] 5.8: Maneja diferentes tipos de excepciones durante el renderizado

## 6. Integración de almacenamiento

- [x] 6.1 Los eventos se cargan desde el almacenamiento local al montar el componente
- [x] 6.2 Los eventos se guardan en el almacenamiento local al crearse, actualizarse o eliminarse
- [x] 6.3 La gestión de errores funciona para el almacenamiento local
- [x] 6.4 Las operaciones de almacenamiento publican los eventos apropiados
- [x] 6.5: Manejo de formatos JSON inválidos en localStorage

## 7. Registro del módulo

- [x] 7.1 El módulo de calendario se registra correctamente al montar
- [x] 7.2 El módulo expone las funciones correctas de la API (getEvents, createEvent, updateEvent, deleteEvent)
- [x] 7.3 Las funciones de la API funcionan correctamente al ser llamadas externamente
- [x] 7.4 El módulo se anula el registro (si corresponde) al desmontar
- [x] 7.5: La función unsubscribe se ejecuta al desmontar

## 8. Integración del bus de eventos

- [x] 8.1 El componente se suscribe a los eventos apropiados
- [x] 8.2 El componente responde a las actualizaciones de eventos externos
- [x] 8.3 El componente publica eventos cuando cambian los datos
- [x] 8.4 El componente limpia las suscripciones al desmontar

## 9. Casos extremos relevantes para Stage 1

- [x] 9.1 Gestiona eventos simultáneos en la misma franja horaria
- [x] 9.2 Gestiona eventos en los límites del día (medianoche)
- [x] 9.3 Gestiona datos de eventos no válidos
- [x] 9.4 Gestiona correctamente el exceso de la cuota de almacenamiento local
- [x] 9.5: Gestiona objetos no array en localStorage
- [x] 9.6: Maneja eventos con tipos de datos inválidos
