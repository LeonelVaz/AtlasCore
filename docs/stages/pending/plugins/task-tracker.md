# Plugin: Task Tracker (Seguimiento de Tareas) - Visión Conceptual

## 1. Visión General

El plugin **Task Tracker** para Atlas tiene como objetivo proporcionar un sistema completo de gestión de tareas personales o de proyectos pequeños, integrado de forma opcional con el calendario principal. Permitiría a los usuarios crear, organizar, priorizar y seguir el progreso de sus tareas, utilizando vistas como listas o tableros Kanban.

## 2. Funcionalidades Clave Propuestas

- **Creación y Gestión de Tareas:**
  - Título, descripción detallada.
  - Fecha de vencimiento (opcional).
  - Prioridad (ej. Baja, Media, Alta).
  - Estado de progreso (personalizable, ej. Pendiente, En Progreso, Completada).
  - Tags o categorías.
  - (Potencial) Subtareas.
  - (Potencial) Asignación a un responsable (si se piensa en colaboración futura).
- **Vistas de Tareas:**
  - **Vista de Lista:** Listado tradicional de tareas, con opciones de ordenamiento y filtrado.
  - **Vista de Tablero Kanban:** Columnas representando estados (ej. "Por Hacer", "En Progreso", "Hecho"), con tareas como tarjetas que se pueden arrastrar entre columnas.
- **Integración con el Calendario de Atlas (Opcional, configurable por el usuario):**
  - Opción de mostrar tareas con fecha de vencimiento como eventos en el calendario principal.
  - Opción de crear una tarea a partir de un evento del calendario.
  - Sincronización (unidireccional o bidireccional limitada) entre una tarea y su evento de calendario asociado.
- **Filtrado y Búsqueda:** Capacidades para filtrar tareas por estado, prioridad, fecha de vencimiento, tags, etc.
- **Notificaciones (Integración con Reminder System):** Potencialmente, las tareas con fecha de vencimiento podrían generar recordatorios si el plugin `reminder-system` está activo.

## 3. Arquitectura Conceptual y Módulos

- **`index.js`:** Punto de entrada, registro, API pública del plugin.
- **Componentes UI (`components/`):**
  - `TaskDashboardPage.jsx`: Página principal del plugin, que permitiría cambiar entre la vista de lista y el tablero Kanban.
  - `TaskList.jsx`: Componente para la vista de lista.
  - `TaskBoard.jsx`: Componente para la vista de tablero Kanban.
  - `TaskItem.jsx`: Componente para representar una tarea individual (en lista o como tarjeta).
  - `TaskForm.jsx`: Modal o panel para crear y editar tareas.
- **Contextos (`contexts/`):**
  - `(Potencial) TaskContext.jsx`: Para gestionar el estado de las tareas y proveerlo a los componentes del plugin.
- **Utilidades (`utils/`):**
  - `taskUtils.js`: Lógica de filtrado, ordenamiento, validación de tareas.
  - `taskToEvent.js`: Lógica para convertir entre el formato de tarea y el formato de evento de calendario de Atlas.
- **Estilos y Localización:** Carpetas `styles/` y `locales/`.

## 4. Interacción con Atlas Core

- **Navegación:** Añadiría un ítem "Tareas" (o similar) a la `MAIN_NAVIGATION` de Atlas, llevando a `TaskDashboardPage.jsx` (registrada en `PLUGIN_PAGES`).
- **Almacenamiento:** Usaría `coreAPI.storage` para persistir todas las tareas y la configuración del plugin (ej. estados Kanban personalizados).
- **Eventos del Calendario (Opcional):** Si se implementa la sincronización, se suscribiría a eventos de creación/actualización/eliminación de eventos de calendario para mantener la coherencia.
- **API del Calendario (Opcional):** Si se crean eventos desde tareas, usaría `coreAPI.getModule('calendar').createEvent()`, etc.
- **Extensiones UI:**
  - Podría añadir una opción "Crear Tarea desde Evento" al menú contextual de los eventos del calendario.
  - Podría mostrar indicadores en el calendario para días con tareas vencidas o por vencer (usando `CALENDAR_DAY_HEADER`).
  - Una sección en `SETTINGS_PANEL` para configurar el Task Tracker (ej. definir estados Kanban, configurar sincronización con calendario).
- **API de Diálogos:** Usaría `coreAPI.dialogs` para confirmaciones (ej. eliminar tarea).

## 5. API Pública y Eventos del Plugin (Conceptuales)

- **Métodos Públicos (ejemplos):**
  - `getTasks(options)`: Devuelve tareas filtradas/ordenadas.
  - `createTask(taskData)`
  - `updateTask(taskId, updates)`
  - `deleteTask(taskId)`
  - `getTaskStatuses()`: Devuelve los estados configurados para el tablero Kanban.
- **Eventos Publicados (ejemplos):**
  - `task-tracker.taskCreated`
  - `task-tracker.taskUpdated`
  - `task-tracker.taskMoved` (para cambios de estado en Kanban)

## 6. Consideraciones de Diseño y UX

- **Flexibilidad:** Permitir al usuario definir sus propios estados/columnas para el tablero Kanban.
- **Claridad Visual:** Diferenciar claramente entre tareas y eventos del calendario si se muestran juntos.
- **Sincronización Inteligente:** Si se implementa la sincronización con el calendario, debe ser clara para el usuario y manejar posibles conflictos o desajustes.
- **Rendimiento:** Optimizar la carga y renderizado de listas/tableros con muchas tareas.

Este plugin transformaría Atlas de una herramienta de calendario a una solución de gestión de productividad más completa.
